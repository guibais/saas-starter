import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users, userSubscriptions, orders } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

// GET /api/users/[id] - Obter detalhes de um usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = parseInt(params.id);

    // Buscar usuário
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Buscar assinaturas do usuário
    const subscriptions = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    // Buscar pedidos do usuário
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));

    // Remover senha hash por segurança
    const userData = { ...user[0], passwordHash: undefined };

    return NextResponse.json({
      user: userData,
      subscriptions,
      orders: userOrders,
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes do usuário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar detalhes do usuário" },
      { status: 500 }
    );
  }
}
