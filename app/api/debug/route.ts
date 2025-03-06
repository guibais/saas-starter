import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, getCustomerSession } from "@/lib/auth/session";
import {
  ADMIN_COOKIE_NAME,
  CUSTOMER_COOKIE_NAME,
} from "@/lib/auth/cookie-utils";

export async function GET(request: NextRequest) {
  try {
    // Obter todos os cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Tentar obter a sessão de admin e cliente
    const adminSession = await getSession();
    const customerSession = await getCustomerSession();

    return NextResponse.json({
      cookies: allCookies.map((cookie) => ({
        name: cookie.name,
        value: "***", // Ocultar valores por segurança
      })),
      hasSessionCookie: cookieStore.has(ADMIN_COOKIE_NAME),
      hasCustomerSessionCookie: cookieStore.has(CUSTOMER_COOKIE_NAME),
      adminSessionValid: adminSession !== null,
      customerSessionValid: customerSession !== null,
      adminSession: adminSession
        ? {
            userRole: adminSession.user.role,
            userId: adminSession.user.id,
            expires: adminSession.expires,
          }
        : null,
      customerSession: customerSession
        ? {
            userId: customerSession.user.id,
            expires: customerSession.expires,
            isCustomer: customerSession.isCustomer,
          }
        : null,
    });
  } catch (error) {
    console.error("Erro no diagnóstico:", error);
    return NextResponse.json(
      { error: "Erro ao executar diagnóstico" },
      { status: 500 }
    );
  }
}
