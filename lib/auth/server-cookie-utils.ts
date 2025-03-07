"use server";

import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  CUSTOMER_COOKIE_NAME,
  getBaseCookieConfig,
  getDomainConfig,
} from "./cookie-utils";

// Set admin session cookie (for server components)
export async function setAdminSessionCookie(token: string, expiresDate: Date) {
  const cookieStore = cookies();
  const isProd = process.env.NODE_ENV === "production";
  console.log(
    `[Cookie] Setting admin session cookie in ${
      isProd ? "production" : "development"
    } mode`
  );

  cookieStore.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    expires: expiresDate,
    ...getBaseCookieConfig(isProd),
    ...getDomainConfig(isProd),
  });
}

// Set customer session cookie (for server components)
export async function setCustomerSessionCookie(
  token: string,
  expiresDate: Date
) {
  const cookieStore = cookies();
  const isProd = process.env.NODE_ENV === "production";
  console.log(
    `[Cookie] Setting customer session cookie in ${
      isProd ? "production" : "development"
    } mode`
  );

  cookieStore.set({
    name: CUSTOMER_COOKIE_NAME,
    value: token,
    expires: expiresDate,
    ...getBaseCookieConfig(isProd),
    ...getDomainConfig(isProd),
  });
}

// Clear admin session cookie (for server components)
export async function clearAdminSessionCookie() {
  const cookieStore = cookies();
  const isProd = process.env.NODE_ENV === "production";
  console.log(
    `[Cookie] Clearing admin session cookie in ${
      isProd ? "production" : "development"
    } mode`
  );

  cookieStore.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    expires: new Date(0),
    ...getBaseCookieConfig(isProd),
    ...getDomainConfig(isProd),
  });
}

// Clear customer session cookie (for server components)
export async function clearCustomerSessionCookie() {
  const cookieStore = cookies();
  const isProd = process.env.NODE_ENV === "production";
  console.log(
    `[Cookie] Clearing customer session cookie in ${
      isProd ? "production" : "development"
    } mode`
  );

  cookieStore.set({
    name: CUSTOMER_COOKIE_NAME,
    value: "",
    expires: new Date(0),
    ...getBaseCookieConfig(isProd),
    ...getDomainConfig(isProd),
  });
}
