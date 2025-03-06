import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Criar resposta
    const response = NextResponse.json({ success: true });

    // Limpar cookie de sessão
    response.cookies.set({
      name: "session",
      value: "",
      expires: new Date(0), // Data no passado para expirar imediatamente
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    return NextResponse.json(
      { message: "Erro ao processar logout" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Determinar a URL base para redirecionamento
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Criar resposta de redirecionamento para a página inicial
    const response = NextResponse.redirect(`${baseUrl}/`);

    // Limpar cookie de sessão
    response.cookies.set({
      name: "session",
      value: "",
      expires: new Date(0), // Data no passado para expirar imediatamente
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    return NextResponse.json(
      { message: "Erro ao processar logout" },
      { status: 500 }
    );
  }
}
