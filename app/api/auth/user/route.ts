import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    // Obter token da sessão dos cookies da requisição
    const sessionCookie = request.cookies.get("session");

    if (!sessionCookie) {
      return NextResponse.json(null, { status: 401 });
    }

    // Verificar token
    const session = await verifyToken(sessionCookie.value);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(null, { status: 401 });
    }

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
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erro ao obter usuário:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
