import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  userSubscriptions,
  subscriptionItems,
  products,
  subscriptionPlans,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getSession, getCustomerSession } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = parseInt(params.id);
    console.log(`[API] Buscando assinatura para cliente ID: ${customerId}`);

    if (isNaN(customerId)) {
      console.log("[API] Erro: ID do cliente inválido");
      return NextResponse.json(
        { error: "ID do cliente inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticação - tentar ambas as sessões
    const adminSession = await getSession();
    const customerSession = await getCustomerSession();

    console.log(`[API] Sessão admin encontrada: ${!!adminSession}`);
    console.log(`[API] Sessão cliente encontrada: ${!!customerSession}`);

    // Se não há nenhuma sessão válida
    if (!adminSession && !customerSession) {
      console.log("[API] Erro: Nenhuma sessão válida encontrada");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar permissões
    const isAdmin = adminSession && adminSession.user.role === "admin";
    const isCorrectCustomer =
      customerSession && customerSession.user.id === customerId;

    if (!isAdmin && !isCorrectCustomer) {
      console.log(
        "[API] Erro: Usuário não tem permissão para acessar esta assinatura"
      );
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Buscar a assinatura do cliente
    console.log(`[API] Consultando assinatura para customerId: ${customerId}`);
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.customerId, customerId),
      orderBy: (userSubscriptions, { desc }) => [
        desc(userSubscriptions.createdAt),
      ],
    });

    if (!subscription) {
      console.log("[API] Nenhuma assinatura encontrada para este cliente");
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    console.log(`[API] Assinatura encontrada com ID: ${subscription.id}`);

    // Buscar os itens da assinatura
    const subscriptionItemsResult = await db
      .select()
      .from(subscriptionItems)
      .where(eq(subscriptionItems.subscriptionId, subscription.id));

    // Buscar o plano para obter o preço
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, subscription.planId),
    });

    // Buscar os produtos relacionados aos itens da assinatura
    const productIds = subscriptionItemsResult.map((item) => item.productId);
    const productsResult =
      productIds.length > 0
        ? await db
            .select()
            .from(products)
            .where(inArray(products.id, productIds))
        : [];

    // Criar um mapa de produtos para facilitar o acesso
    const productsMap = new Map();
    productsResult.forEach((product) => {
      productsMap.set(product.id, product);
    });

    // Formatar os itens para a resposta
    const formattedItems = subscriptionItemsResult.map((item) => {
      const product = productsMap.get(item.productId);
      return {
        id: item.id,
        productId: item.productId,
        productName: product?.name || "Produto não encontrado",
        productType: product?.productType || "desconhecido",
        quantity: item.quantity,
        unit: "un", // Unidade padrão
      };
    });

    // Retornar a assinatura com os itens
    return NextResponse.json({
      id: subscription.id,
      customerId: subscription.customerId,
      planId: subscription.planId,
      planName: subscription.planName || "Plano Personalizado",
      status: subscription.status,
      price: plan?.price || "0.00",
      startDate: subscription.startDate,
      nextDeliveryDate: subscription.nextDeliveryDate,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      items: formattedItems,
    });
  } catch (error) {
    console.error("Erro ao buscar assinatura do cliente:", error);
    return NextResponse.json(
      { error: "Erro ao buscar assinatura" },
      { status: 500 }
    );
  }
}
