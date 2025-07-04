import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { PublicKey } from "@solana/web3.js";
import { Redis } from "@upstash/redis";

import {
  ACCESS_TOKEN_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
  ACCESS_TOKEN_EXPIRATION_SECONDS,
  REFRESH_TOKEN_EXPIRATION_SECONDS,
} from "@/constants";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

const REDIS_PREFIX = "@docusol/session";

const JWT_ALGORITHM = "HS256";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Store the refresh token in Redis. This is used to prevent reuse of refresh tokens
 * and to allow for revocation of refresh tokens by deleting them from Redis and
 * retrieving the payload data from the refresh token payload.
 *
 * It also has built-in TTL so it will be deleted automatically after the refresh token
 * expiration.
 *
 * @param id the id of the wallet user
 * @param publicKey the public key of the user
 * @param refreshTokenId the id of the refresh token
 */
const storeRefreshTokenData = async ({
  id,
  publicKey,
  refreshTokenId,
}: {
  id: string;
  publicKey: PublicKey;
  refreshTokenId: string;
}) => {
  await redis.set(
    `${REDIS_PREFIX}/refresh_token:${refreshTokenId}`,
    { id, publicKey: publicKey.toBase58() },
    { ex: REFRESH_TOKEN_EXPIRATION_SECONDS },
  );
};

/**
 * Revoke a refresh token by deleting it from Redis
 *
 * @param refreshToken the refresh token
 * @throws an error if the refresh token is not found or cannot be deleted
 */
export async function revokeRefreshToken(refreshToken: string) {
  await redis.del(`${REDIS_PREFIX}/refresh_token:${refreshToken}`);
}

/**
 * Get the refresh token data from Redis
 *
 * @param refreshTokenId the id of the refresh token
 * @returns the refresh token data
 * @throws an error if the refresh token is not found
 */
const getRefreshTokenData = async (refreshTokenId: string) => {
  const tokenData = await redis.get<AccessTokenPayload>(
    `${REDIS_PREFIX}/refresh_token:${refreshTokenId}`,
  );

  if (!tokenData) {
    throw new Error("Refresh token not found");
  }

  return tokenData;
};

/**
 * Generate a pair of access and refresh tokens and store the refresh token in Redis
 * - prevents reuse of refresh tokens
 * - allows for refresh of access tokens
 * - Redis ttl is the same as the token expiration so it will be deleted automatically
 * - can revoke refresh tokens by deleting them from Redis
 * - store the public key in the refresh token payload to retrieve it later for refreshing
 *
 * @param id the id of the wallet user
 * @param publicKey the public key of the user
 * @returns the access and refresh tokens
 */
export async function generateTokens(id: string, publicKey: PublicKey) {
  const accessToken = await new SignJWT({ id, publicKey: publicKey.toBase58() })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRATION)
    .setJti(crypto.randomUUID())
    .sign(new TextEncoder().encode(ACCESS_TOKEN_SECRET));

  const refreshTokenId = crypto.randomUUID();
  const refreshToken = await new SignJWT()
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRATION)
    .setJti(refreshTokenId)
    .sign(new TextEncoder().encode(REFRESH_TOKEN_SECRET));

  await storeRefreshTokenData({ id, publicKey, refreshTokenId });
  return { accessToken, refreshToken };
}

/**
 * Verify the access token and return the payload if valid
 *
 * @param accessToken the access token
 * @returns the payload of the access token
 * @throws an error if the access token is invalid, expired, or invalid payload
 */
export async function verifyAccessToken(
  accessToken: string,
): Promise<AccessTokenPayload> {
  const { payload: accessPayload } = await jwtVerify<AccessTokenPayload>(
    accessToken,
    new TextEncoder().encode(ACCESS_TOKEN_SECRET),
  );

  if (!accessPayload.publicKey) {
    throw new Error("Invalid access token: no public key");
  }

  return accessPayload;
}

/**
 * Verify the refresh token and return a boolean indicating if it is valid
 *
 * @param refreshToken the refresh token
 * @returns a boolean indicating if the refresh token is valid
 * @throws an error if the refresh token is invalid, expired, or invalid payload
 */
export async function verifyRefreshToken(
  refreshToken: string,
): Promise<boolean> {
  try {
    await jwtVerify(
      refreshToken,
      new TextEncoder().encode(REFRESH_TOKEN_SECRET),
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Refresh a pair of access and refresh tokens
 *
 * @param refreshToken the refresh token
 * @returns the new access and refresh tokens
 * @throws an error if the refresh token is invalid, expired, or invalid payload
 */
export async function refreshTokens(refreshToken: string) {
  // Decode the token to get the jti (JWT ID)
  const { payload } = await jwtVerify(
    refreshToken,
    new TextEncoder().encode(REFRESH_TOKEN_SECRET),
  );

  const tokenId = payload.jti;
  if (!tokenId) {
    throw new Error("Invalid refresh token: missing jti claim");
  }

  const { id, publicKey } = await getRefreshTokenData(tokenId);
  if (!publicKey) {
    throw new Error(`Refresh token: ${tokenId} not found`);
  }

  return generateTokens(id, new PublicKey(publicKey));
}

function isTokenExpired(token: JWTPayload) {
  return (token.exp || 0) - Date.now() / 1000 < ACCESS_TOKEN_EXPIRATION_SECONDS;
}

/**
 * Verify and refresh tokens. If the access token is valid but close to expiry, it will be refreshed.
 * @param accessToken the access token
 * @param refreshToken the refresh token
 * @returns the current tokens if not expired, or the new access and refresh tokens
 * @throws an error if boths tokens are invalid or failed to refresh
 */
export async function verifyAndRefreshTokens(
  accessToken: string,
  refreshToken: string,
) {
  try {
    const accessPayload = await verifyAccessToken(accessToken);

    // If access token is valid but close to expiry, refresh both tokens
    if (isTokenExpired(accessPayload)) {
      return await refreshTokens(refreshToken);
    }

    // Access token is valid and not close to expiry
    return { accessToken, refreshToken };
  } catch (err) {
    // If the token is invalid, throw and don't attempt to refresh again
    const error = err as Error;
    if (error.message.includes("JWSInvalid")) {
      throw error;
    }
    // Access token verification failed - try to use refresh token
    return await refreshTokens(refreshToken);
  }
}
