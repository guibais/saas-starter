import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { userSubscriptions, users, subscriptionPlans } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { desc, eq, like, or } from "drizzle-orm";

// GET /api/subscriptions - Listar todas as assinaturas
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Obter parâmetros de consulta para filtragem e paginação
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 100;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;

    // Buscar assinaturas com informações do usuário e plano
    const subscriptionsList = await db
      .select({
        id: userSubscriptions.id,
        userId: userSubscriptions.userId,
        planId: userSubscriptions.planId,
        status: userSubscriptions.status,
        startDate: userSubscriptions.startDate,
        nextDeliveryDate: userSubscriptions.nextDeliveryDate,
        createdAt: userSubscriptions.createdAt,
        userName: users.name,
        userEmail: users.email,
        planName: subscriptionPlans.name,
        price: subscriptionPlans.price,
      })
      .from(userSubscriptions)
      .leftJoin(users, eq(userSubscriptions.userId, users.id))
      .leftJoin(
        subscriptionPlans,
        eq(userSubscriptions.planId, subscriptionPlans.id)
      )
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(limit)
      .offset(offset);

    // Filtrar os resultados na aplicação
    let filteredSubscriptions = subscriptionsList;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredSubscriptions = filteredSubscriptions.filter(
        (subscription) =>
          subscription.userName?.toLowerCase().includes(searchLower) ||
          subscription.userEmail?.toLowerCase().includes(searchLower) ||
          subscription.planName?.toLowerCase().includes(searchLower)
      );
    }

    if (status) {
      filteredSubscriptions = filteredSubscriptions.filter(
        (subscription) => subscription.status === status
      );
    }

    return NextResponse.json(filteredSubscriptions);
  } catch (error) {
    console.error("Erro ao buscar assinaturas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar assinaturas" },
      { status: 500 }
    );
  }
}

// PATCH /api/subscriptions - Atualizar status de assinaturas
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    const { id, status, nextDeliveryDate } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID e status são obrigatórios" },
        { status: 400 }
      );
    }

    // Atualizar a assinatura
    const updateData: any = { status };

    // Se fornecido, atualizar a próxima data de entrega
    if (nextDeliveryDate) {
      updateData.nextDeliveryDate = new Date(nextDeliveryDate);
    }

    const updated = await db
      .update(userSubscriptions)
      .set(updateData)
      .where(eq(userSubscriptions.id, id))
      .returning();

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Assinatura atualizada com sucesso",
      subscription: updated[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar assinatura:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar assinatura" },
      { status: 500 }
    );
  }
}
