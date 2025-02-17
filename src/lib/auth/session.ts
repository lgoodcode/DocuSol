import { NextRequest } from "next/server";

import { verifyAndRefreshTokens, verifyAccessToken } from "./tokens";

export function getSessionTokens(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  return { accessToken, refreshToken };
}

/**
 * Get the session from the request. If there are no tokens, return null.
 * Validate and refresh tokens if needed.
 *
 * @param request the request
 * @returns true if the session is valid, false otherwise
 */
export async function validateSession(request: NextRequest) {
  const { accessToken, refreshToken } = getSessionTokens(request);

  if (!accessToken || !refreshToken) {
    return false;
  }

  await verifyAndRefreshTokens(accessToken, refreshToken);
  return true;
}

/**
 * Get the public key from the session
 *
 * @param request the request
 * @returns the public key
 */
export async function getSession(request: NextRequest) {
  const { accessToken } = getSessionTokens(request);

  if (!accessToken) {
    throw new Error("No access token found");
  }

  return await verifyAccessToken(accessToken);
}
