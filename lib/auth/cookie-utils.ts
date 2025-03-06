import { cookies } from "next/headers";
import { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

// Cookie names
export const ADMIN_COOKIE_NAME = "admin_session";
export const CUSTOMER_COOKIE_NAME = "customer_session";

// Common cookie configuration
export function getBaseCookieConfig(
  isProd = process.env.NODE_ENV === "production"
) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "strict" as const,
    secure: isProd,
    priority: "high" as const,
  };
}

// Get domain configuration if in production
export function getDomainConfig(
  isProd = process.env.NODE_ENV === "production"
) {
  if (isProd && process.env.COOKIE_DOMAIN) {
    console.log(`[Cookie] Using domain: ${process.env.COOKIE_DOMAIN}`);
    return { domain: process.env.COOKIE_DOMAIN };
  }
  return {};
}

// Set session cookie (for server components)
export function setSessionCookie(
  cookieStore: ReadonlyRequestCookies,
  name: string,
  token: string,
  expiresDate: Date
) {
  const isProd = process.env.NODE_ENV === "production";
  console.log(
    `[Cookie] Setting ${name} cookie in ${
      isProd ? "production" : "development"
    } mode`
  );

  cookieStore.set({
    name,
    value: token,
    expires: expiresDate,
    ...getBaseCookieConfig(isProd),
    ...getDomainConfig(isProd),
  });
}

// Set session cookie in response (for API routes)
export function setSessionCookieInResponse(
  responseCookies: ResponseCookies,
  name: string,
  token: string,
  expiresDate: Date
) {
  const isProd = process.env.NODE_ENV === "production";
  console.log(
    `[Cookie] Setting ${name} cookie in response in ${
      isProd ? "production" : "development"
    } mode`
  );

  responseCookies.set({
    name,
    value: token,
    expires: expiresDate,
    ...getBaseCookieConfig(isProd),
    ...getDomainConfig(isProd),
  });
}

// Clear session cookie (for server components)
export function clearSessionCookie(
  cookieStore: ReadonlyRequestCookies,
  name: string
) {
  const isProd = process.env.NODE_ENV === "production";
  console.log(
    `[Cookie] Clearing ${name} cookie in ${
      isProd ? "production" : "development"
    } mode`
  );

  cookieStore.set({
    name,
    value: "",
    expires: new Date(0),
    ...getBaseCookieConfig(isProd),
    ...getDomainConfig(isProd),
  });
}

// Clear session cookie in response (for API routes)
export function clearSessionCookieInResponse(
  responseCookies: ResponseCookies,
  name: string
) {
  const isProd = process.env.NODE_ENV === "production";
  console.log(
    `[Cookie] Clearing ${name} cookie in response in ${
      isProd ? "production" : "development"
    } mode`
  );

  responseCookies.set({
    name,
    value: "",
    expires: new Date(0),
    ...getBaseCookieConfig(isProd),
    ...getDomainConfig(isProd),
  });
}

// Get client-side cookie clearing script
export function getClientCookieClearingScript(name: string) {
  const isProd = process.env.NODE_ENV === "production";
  const domainPart =
    isProd && process.env.NEXT_PUBLIC_COOKIE_DOMAIN
      ? `; Domain=${process.env.NEXT_PUBLIC_COOKIE_DOMAIN}`
      : "";

  return `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT${domainPart}; SameSite=Strict; ${
    isProd ? "Secure" : ""
  }`;
}
