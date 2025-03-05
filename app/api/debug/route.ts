import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    // Obter todos os cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Tentar obter a sessão
    const session = await getSession();

    return NextResponse.json({
      cookies: allCookies.map((cookie) => ({
        name: cookie.name,
        value: cookie.name === "session" ? "***" : "***", // Ocultar valores por segurança
      })),
      hasSessionCookie: cookieStore.has("session"),
      sessionValid: session !== null,
      session: session
        ? {
            userRole: session.user.role,
            userId: session.user.id,
            expires: session.expires,
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
