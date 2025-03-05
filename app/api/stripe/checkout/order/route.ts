import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { orders, orderItems, products } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/payments/stripe";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(new URL("/cart", request.url));
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer", "payment_intent"],
    });

    if (session.payment_status !== "paid") {
      throw new Error("Pagamento não foi concluído.");
    }

    // Verificar se o pedido já foi processado pelo webhook
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.stripePaymentIntentId, session.payment_intent as string),
    });

    if (existingOrder) {
      // Pedido já processado, redirecionar para a página de sucesso
      return NextResponse.redirect(
        new URL(
          `/checkout/success?type=order&id=${existingOrder.id}`,
          request.url
        )
      );
    }

    // Se o webhook ainda não processou, criar o pedido manualmente
    const userId = parseInt(session.client_reference_id || "0");

    if (!userId) {
      throw new Error("ID do usuário não encontrado na sessão.");
    }

    // Obter os itens da sessão
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);

    // Criar o pedido
    const [orderResult] = await db
      .insert(orders)
      .values({
        userId,
        status: "processing",
        totalAmount: session.amount_total
          ? (session.amount_total / 100).toString()
          : "0",
        paymentStatus: "paid",
        shippingAddress: "Endereço fornecido durante o checkout",
        stripePaymentIntentId: session.payment_intent as string,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: orders.id });

    if (!orderResult) {
      throw new Error("Falha ao criar o pedido no banco de dados.");
    }

    const orderId = orderResult.id;

    // Processar cada item do pedido
    for (const item of lineItems.data) {
      // Obter o ID do produto a partir dos metadados do preço
      const price = await stripe.prices.retrieve(item.price?.id || "");
      const productId =
        typeof price.product === "string" ? price.product : price.product?.id;

      if (!productId) {
        console.error("ID do produto não encontrado para o preço:", price.id);
        continue;
      }

      // Buscar o produto no banco de dados
      const stripeProduct = await stripe.products.retrieve(productId);
      const productResult = await db.query.products.findFirst({
        where: eq(products.name, stripeProduct.name),
      });

      if (!productResult) {
        console.error("Produto não encontrado no banco de dados:", productId);
        continue;
      }

      // Adicionar o item ao pedido
      await db.insert(orderItems).values({
        orderId,
        productId: productResult.id,
        quantity: item.quantity || 1,
        unitPrice: productResult.price,
        totalPrice: (
          Number(productResult.price) * (item.quantity || 1)
        ).toString(),
        createdAt: new Date(),
      });

      // Atualizar o estoque do produto
      await db
        .update(products)
        .set({
          stockQuantity: Math.max(
            0,
            productResult.stockQuantity - (item.quantity || 1)
          ),
          updatedAt: new Date(),
        })
        .where(eq(products.id, productResult.id));
    }

    // Redirecionar para a página de sucesso
    return NextResponse.redirect(
      new URL(`/checkout/success?type=order&id=${orderId}`, request.url)
    );
  } catch (error) {
    console.error("Erro ao processar checkout bem-sucedido:", error);
    return NextResponse.redirect(new URL("/error", request.url));
  }
}
