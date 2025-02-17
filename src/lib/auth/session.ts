import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { setUser as setSentryUser } from "@sentry/nextjs";

import {
  ACCESS_TOKEN_EXPIRATION_SECONDS,
  REFRESH_TOKEN_EXPIRATION_SECONDS,
} from "@/constants";

import { verifyAndRefreshTokens, verifyAccessToken } from "./tokens";

const ACCESS_TOKEN_COOKIE_NAME = "access_token";
const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

export const createSession = async (tokens: Tokens) => {
  const cookieStore = await cookies();

  // Set access token in an HTTP-only cookie
  cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken, {
    httpOnly: true,
    secure: true, // Always use HTTPS because we have self-signed certs in dev
    sameSite: "strict",
    path: "/",
    maxAge: ACCESS_TOKEN_EXPIRATION_SECONDS,
  });

  // Set refresh token in an HTTP-only cookie
  cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: REFRESH_TOKEN_EXPIRATION_SECONDS,
  });
};

export const clearSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME);
  cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME);
  setSentryUser(null);
};

export function getSessionTokens(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

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
 * Validate the session and return the payload of the access token
 *
 * @param request the request
 * @returns the payload of the access token
 */
export async function getSession(request: NextRequest) {
  const { accessToken, refreshToken } = getSessionTokens(request);

  if (!accessToken || !refreshToken) {
    throw new Error("No access token or refresh token found");
  }

  await verifyAndRefreshTokens(accessToken, refreshToken);
  return await verifyAccessToken(accessToken);
}
