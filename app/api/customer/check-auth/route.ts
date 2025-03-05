import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Verificar se o cookie de sessão do cliente existe
    const cookieStore = await cookies();
    const customerSession = cookieStore.get("customer_session");

    // Retornar o status de autenticação
    return NextResponse.json({
      authenticated: !!customerSession,
    });
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return NextResponse.json(
      { error: "Erro ao verificar autenticação" },
      { status: 500 }
    );
  }
}
