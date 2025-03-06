import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    console.log(
      "[Customer/Logout] Iniciando processo de logout do cliente (POST)"
    );

    // Verificar qual cookie está sendo usado
    const customerSessionCookie = request.cookies.get("customer_session");

    const response = NextResponse.json({ success: true });

    if (customerSessionCookie) {
      try {
        // Verificar se é uma sessão de cliente válida
        const session = await verifyToken(customerSessionCookie.value);
        console.log(
          `[Customer/Logout] Removendo sessão para cliente ID: ${session?.user?.id}`
        );
      } catch (error) {
        console.log("[Customer/Logout] Erro ao verificar sessão:", error);
      }

      // Limpar apenas o cookie de sessão do cliente
      console.log("[Customer/Logout] Removendo cookie 'customer_session'");
      response.cookies.set({
        name: "customer_session",
        value: "",
        expires: new Date(0),
        path: "/",
      });
    } else {
      console.log(
        "[Customer/Logout] Nenhum cookie 'customer_session' encontrado para logout"
      );
    }

    console.log(
      "[Customer/Logout] Processo de logout do cliente concluído com sucesso"
    );
    return response;
  } catch (error) {
    console.error("[Customer/Logout] Erro no logout do cliente:", error);
    return NextResponse.json(
      { message: "Error processing logout" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log(
      "[Customer/Logout] Iniciando processo de logout do cliente (GET)"
    );

    // Determinar a URL base para redirecionamento
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Verificar qual cookie está sendo usado
    const customerSessionCookie = request.cookies.get("customer_session");

    // Criar resposta de redirecionamento para a página inicial
    const response = NextResponse.redirect(`${baseUrl}/`);

    if (customerSessionCookie) {
      try {
        // Verificar se é uma sessão de cliente válida
        const session = await verifyToken(customerSessionCookie.value);
        console.log(
          `[Customer/Logout] Removendo sessão para cliente ID: ${session?.user?.id}`
        );
      } catch (error) {
        console.log("[Customer/Logout] Erro ao verificar sessão:", error);
      }

      // Limpar apenas o cookie de sessão do cliente
      console.log("[Customer/Logout] Removendo cookie 'customer_session'");
      response.cookies.set({
        name: "customer_session",
        value: "",
        expires: new Date(0), // Data no passado para expirar imediatamente
        path: "/",
      });
    } else {
      console.log(
        "[Customer/Logout] Nenhum cookie 'customer_session' encontrado para logout"
      );
    }

    console.log(
      "[Customer/Logout] Processo de logout do cliente concluído com sucesso, redirecionando para página inicial"
    );
    return response;
  } catch (error) {
    console.error("[Customer/Logout] Erro ao fazer logout do cliente:", error);
    return NextResponse.json(
      { message: "Erro ao processar logout" },
      { status: 500 }
    );
  }
}
