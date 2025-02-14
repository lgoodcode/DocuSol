import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { PublicKey } from "@solana/web3.js";
import { Redis } from "@upstash/redis";
import { captureException } from "@sentry/nextjs";

import {
  ACCESS_TOKEN_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
  ACCESS_TOKEN_EXPIRATION_SECONDS,
  REFRESH_TOKEN_EXPIRATION_SECONDS,
} from "@/constants";

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "your-access-secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret";

const JWT_ALGORITHM = "HS256";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Generate a pair of access and refresh tokens and store the refresh token in Redis
 * - prevents reuse of refresh tokens
 * - allows for refresh of access tokens
 * - Redis ttl is the same as the token expiration so it will be deleted automatically
 * - can revoke refresh tokens by deleting them from Redis
 * - store the public key in the refresh token payload to retrieve it later for refreshing
 *
 * @param publicKey the public key of the user
 * @returns the access and refresh tokens
 */
export async function generateTokens(publicKey: PublicKey) {
  const accessToken = await new SignJWT({ publicKey: publicKey.toBase58() })
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

  // Store the refresh token info in Redis
  // Key: refresh_token:{jti}, Value: { publicKey }
  // Expire after the refresh token expiration
  await redis.set(
    `@docusol/session/refresh_token:${refreshTokenId}`,
    { publicKey: publicKey.toBase58() },
    { ex: REFRESH_TOKEN_EXPIRATION_SECONDS },
  );

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
): Promise<UserJwtPayload & JWTPayload> {
  const { payload: accessPayload } = await jwtVerify<UserJwtPayload>(
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
 * Revoke a refresh token by deleting it from Redis
 *
 * @param refreshToken the refresh token
 * @throws an error if the refresh token is not found or cannot be deleted
 */
export async function revokeRefreshToken(refreshToken: string) {
  await redis.del(`refresh_token:${refreshToken}`);
}

/**
 * Get the public key from the refresh token
 *
 * @param refreshToken the refresh token
 * @returns the public key of the user
 */
export async function getRefreshTokenPublicKey(refreshToken: string) {
  const tokenData = await redis.get<{ publicKey: string }>(
    `refresh_token:${refreshToken}`,
  );
  return tokenData?.publicKey;
}

/**
 * Refresh a pair of access and refresh tokens
 *
 * @param refreshToken the refresh token
 * @returns the new access and refresh tokens
 */
export async function refreshTokens(refreshToken: string) {
  const publicKey = await getRefreshTokenPublicKey(refreshToken);
  if (!publicKey) {
    throw new Error("Refresh token not found");
  }
  return generateTokens(new PublicKey(publicKey));
}

function isTokenExpired(token: JWTPayload) {
  return (token.exp || 0) - Date.now() / 1000 < ACCESS_TOKEN_EXPIRATION_SECONDS;
}

/**
 * Verify and refresh tokens. If the access token is valid but close to expiry, it will be refreshed.
 * @param accessToken the access token
 * @param refreshToken the refresh token
 * @returns the new access and refresh tokens
 * @throws an error if boths tokens are invalid
 */
export async function verifyAndRefreshTokens(
  accessToken: string,
  refreshToken: string,
) {
  try {
    try {
      const accessPayload = await verifyAccessToken(accessToken);

      // If access token is valid but close to expiry, refresh both tokens
      if (isTokenExpired(accessPayload)) {
        return await refreshTokens(refreshToken);
      }

      // Access token is valid and not close to expiry
      return { accessToken, refreshToken };
    } catch {
      // Access token verification failed - try to use refresh token
      return await refreshTokens(refreshToken);
    }
  } catch (error) {
    const authError = error as Error;
    console.error(authError.message);
    captureException(authError);
    throw new Error("Failed to verify and refresh tokens");
  }
}
