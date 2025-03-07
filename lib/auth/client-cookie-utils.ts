"use client";

// Cookie names
export const ADMIN_COOKIE_NAME = "admin_session";
export const CUSTOMER_COOKIE_NAME = "customer_session";

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

// Clear a cookie on the client side
export function clearClientCookie(name: string) {
  document.cookie = getClientCookieClearingScript(name);
}
