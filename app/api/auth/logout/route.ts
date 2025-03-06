import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    console.log("[Auth/Logout] Iniciando processo de logout (POST)");

    // Verificar qual cookie está sendo usado
    const sessionCookie = request.cookies.get("session");

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

      // Limpar apenas o cookie de sessão do admin/staff
      console.log("[Auth/Logout] Removendo cookie 'session'");
      response.cookies.set({
        name: "session",
        value: "",
        expires: new Date(0), // Data no passado para expirar imediatamente
        path: "/",
      });
    } else {
      console.log(
        "[Auth/Logout] Nenhum cookie 'session' encontrado para logout"
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

    // Determinar a URL base para redirecionamento
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Verificar qual cookie está sendo usado
    const sessionCookie = request.cookies.get("session");

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

      // Limpar apenas o cookie de sessão do admin/staff
      console.log("[Auth/Logout] Removendo cookie 'session'");
      response.cookies.set({
        name: "session",
        value: "",
        expires: new Date(0), // Data no passado para expirar imediatamente
        path: "/",
      });
    } else {
      console.log(
        "[Auth/Logout] Nenhum cookie 'session' encontrado para logout"
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
