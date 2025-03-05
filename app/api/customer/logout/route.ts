import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });

    // Delete the customer session cookie
    response.cookies.set({
      name: "customer_session",
      value: "",
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error in customer logout:", error);
    return NextResponse.json(
      { message: "Error processing logout" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Criar resposta de redirecionamento para a página inicial
    const response = NextResponse.redirect(new URL("/", request.url));

    // Limpar cookie de sessão do cliente
    response.cookies.set({
      name: "customer_session",
      value: "",
      expires: new Date(0), // Data no passado para expirar imediatamente
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erro ao fazer logout do cliente:", error);
    return NextResponse.json(
      { message: "Erro ao processar logout" },
      { status: 500 }
    );
  }
}
