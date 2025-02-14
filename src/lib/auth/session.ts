import { NextRequest } from "next/server";

import { verifyAndRefreshTokens } from "./tokens";

/**
 * Get the session from the request. If there are no tokens, return null.
 * Validate and refresh tokens if needed.
 *
 * @param request the request
 * @returns true if the session is valid, false otherwise
 */
export async function validateSession(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!accessToken || !refreshToken) {
    return false;
  }

  await verifyAndRefreshTokens(accessToken, refreshToken);
  return true;
}
