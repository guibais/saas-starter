import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { orders, customers } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: "ID do cliente inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticação
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se o usuário está tentando acessar seus próprios pedidos ou é um admin
    if (session.user.role !== "admin" && session.user.id !== customerId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Obter parâmetros de consulta para paginação
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 10;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;

    // Buscar os pedidos do cliente
    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // Contar o total de pedidos para paginação
    const totalCount = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.customerId, customerId));

    // Retornar os pedidos
    return NextResponse.json({
      orders: customerOrders,
      pagination: {
        total: totalCount[0]?.count || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar pedidos do cliente:", error);
    return NextResponse.json(
      { error: "Erro ao buscar pedidos" },
      { status: 500 }
    );
  }
}
