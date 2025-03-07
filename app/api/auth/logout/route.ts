import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/session";
import {
  ADMIN_COOKIE_NAME,
  clearSessionCookieInResponse,
} from "@/lib/auth/cookie-utils";

export async function POST(request: NextRequest) {
  try {
    console.log("[Auth/Logout] Iniciando processo de logout (POST)");

    // Verificar referenciador para detectar logouts não intencionais
    const referer = request.headers.get("referer");
    console.log(`[Auth/Logout] Referer: ${referer || "Nenhum"}`);

    // Verificar se é um logout após um login recente (potencialmente não intencional)
    if (
      referer &&
      (referer.includes("/login") ||
        referer.includes("/sign-in") ||
        referer.includes("/admin-login"))
    ) {
      console.log(
        "[Auth/Logout] ALERTA: Tentativa de logout imediatamente após login. Possível erro de configuração."
      );
      console.log(
        "[Auth/Logout] Abortando logout para evitar ciclo de autenticação."
      );
      return NextResponse.json(
        { success: false, error: "Logout abortado - detectado após login" },
        { status: 400 }
      );
    }

    // Verificar qual cookie está sendo usado
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME);

    // Criar resposta
    const response = NextResponse.json({ success: true });

    if (sessionCookie) {
      try {
        // Verificar se é uma sessão de admin ou staff
        const session = await verifyToken(sessionCookie.value);
        console.log(
          `[Auth/Logout] Removendo sessão para usuário ID: ${session?.user?.id}, role: ${session?.user?.role}`
        );
      } catch (error) {
        console.log("[Auth/Logout] Erro ao verificar sessão:", error);
      }

      // Limpar o cookie de admin usando a função utilitária
      console.log(`[Auth/Logout] Removendo cookie '${ADMIN_COOKIE_NAME}'`);
      clearSessionCookieInResponse(response.cookies, ADMIN_COOKIE_NAME);
    } else {
      console.log(
        `[Auth/Logout] Nenhum cookie '${ADMIN_COOKIE_NAME}' encontrado para logout`
      );
    }

    console.log("[Auth/Logout] Processo de logout concluído com sucesso");
    return response;
  } catch (error) {
    console.error("[Auth/Logout] Erro ao fazer logout:", error);
    return NextResponse.json(
      { message: "Erro ao processar logout" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[Auth/Logout] Iniciando processo de logout (GET)");

    // Verificar referenciador para detectar logouts não intencionais
    const referer = request.headers.get("referer");
    console.log(`[Auth/Logout] Referer: ${referer || "Nenhum"}`);

    // Verificar se é um logout após um login recente (potencialmente não intencional)
    if (
      referer &&
      (referer.includes("/login") ||
        referer.includes("/sign-in") ||
        referer.includes("/admin-login"))
    ) {
      console.log(
        "[Auth/Logout] ALERTA: Tentativa de logout imediatamente após login. Possível erro de configuração."
      );
      console.log(
        "[Auth/Logout] Abortando logout para evitar ciclo de autenticação."
      );
      // Redirecionar para o dashboard admin em vez de fazer logout
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    }

    // Determinar a URL base para redirecionamento
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Verificar qual cookie está sendo usado
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME);

    // Criar resposta de redirecionamento para a página inicial
    const response = NextResponse.redirect(`${baseUrl}/`);

    if (sessionCookie) {
      try {
        // Verificar se é uma sessão de admin ou staff
        const session = await verifyToken(sessionCookie.value);
        console.log(
          `[Auth/Logout] Removendo sessão para usuário ID: ${session?.user?.id}, role: ${session?.user?.role}`
        );
      } catch (error) {
        console.log("[Auth/Logout] Erro ao verificar sessão:", error);
      }

      // Limpar o cookie de admin usando a função utilitária
      console.log(`[Auth/Logout] Removendo cookie '${ADMIN_COOKIE_NAME}'`);
      clearSessionCookieInResponse(response.cookies, ADMIN_COOKIE_NAME);
    } else {
      console.log(
        `[Auth/Logout] Nenhum cookie '${ADMIN_COOKIE_NAME}' encontrado para logout`
      );
    }

    console.log(
      "[Auth/Logout] Processo de logout concluído com sucesso, redirecionando para página inicial"
    );
    return response;
  } catch (error) {
    console.error("[Auth/Logout] Erro ao fazer logout:", error);
    return NextResponse.json(
      { message: "Erro ao processar logout" },
      { status: 500 }
    );
  }
}
