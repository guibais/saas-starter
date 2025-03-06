import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  console.log("[API /auth/user] Recebendo solicitação");

  try {
    // Obter token da sessão dos cookies da requisição
    const sessionCookie = request.cookies.get("session");

    if (!sessionCookie) {
      console.log("[API /auth/user] Nenhum cookie de sessão encontrado");
      return NextResponse.json(null, { status: 401 });
    }

    console.log(
      "[API /auth/user] Cookie de sessão encontrado, verificando token"
    );

    // Verificar token
    const session = await verifyToken(sessionCookie.value);

    if (!session || !session.user || !session.user.id) {
      console.log("[API /auth/user] Token inválido ou expirado");
      return NextResponse.json(null, { status: 401 });
    }

    console.log(
      `[API /auth/user] Token válido para usuário ID: ${session.user.id}`
    );

    // Buscar usuário no banco de dados
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        address: true,
        phone: true,
        deliveryInstructions: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      console.log(
        `[API /auth/user] Usuário ID: ${session.user.id} não encontrado no banco de dados`
      );
      return NextResponse.json(null, { status: 404 });
    }

    console.log(
      `[API /auth/user] Usuário ID: ${user.id}, role: ${user.role} encontrado com sucesso`
    );
    return NextResponse.json(user);
  } catch (error) {
    console.error("[API /auth/user] Erro ao obter usuário:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
