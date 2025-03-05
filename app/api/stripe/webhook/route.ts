import Stripe from "stripe";
import { handleSubscriptionChange, stripe } from "@/lib/payments/stripe";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  orders,
  orderItems,
  products,
  userSubscriptions,
} from "@/lib/db/schema";
import { eq, like } from "drizzle-orm";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed." },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      // Eventos de assinatura
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;

      // Eventos de pagamento
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;

        // Verificar se é uma compra única ou assinatura
        if (session.mode === "payment") {
          await handleOneTimePaymentSuccess(session);
        } else if (session.mode === "subscription") {
          // A assinatura já é tratada pelos eventos de subscription acima
          console.log("Subscription checkout completed:", session.id);
        }
        break;

      // Eventos de pagamento de fatura
      case "invoice.paid":
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;

      // Eventos de falha de pagamento
      case "invoice.payment_failed":
        const failedInvoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error);
    return NextResponse.json(
      {
        error: `Error handling webhook event: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

// Função para lidar com pagamentos únicos bem-sucedidos
async function handleOneTimePaymentSuccess(session: Stripe.Checkout.Session) {
  if (!session.client_reference_id) {
    console.error("No client_reference_id found in session");
    return;
  }

  const userId = parseInt(session.client_reference_id);

  // Buscar detalhes da sessão de checkout para obter os itens
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

  // Criar o pedido no banco de dados
  const [orderResult] = await db
    .insert(orders)
    .values({
      userId,
      status: "processing",
      totalAmount: session.amount_total
        ? (session.amount_total / 100).toString()
        : "0",
      paymentStatus: "paid",
      shippingAddress:
        session.shipping?.address?.line1 || "Endereço não fornecido",
      deliveryInstructions: session.shipping?.address?.line2 || null,
      stripePaymentIntentId: (session.payment_intent as string) || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: orders.id });

  if (!orderResult) {
    console.error("Failed to create order in database");
    return;
  }

  const orderId = orderResult.id;

  // Processar cada item do pedido
  for (const item of lineItems.data) {
    // Obter o ID do produto a partir dos metadados do preço
    const price = await stripe.prices.retrieve(item.price?.id || "");
    const productId =
      typeof price.product === "string" ? price.product : price.product?.id;

    if (!productId) {
      console.error("Product ID not found for price:", price.id);
      continue;
    }

    // Buscar o produto no banco de dados pelo nome (assumindo que o nome do produto no Stripe corresponde ao nome no banco de dados)
    const stripeProduct = await stripe.products.retrieve(productId);
    const productResult = await db.query.products.findFirst({
      where: like(products.name, stripeProduct.name),
    });

    if (!productResult) {
      console.error("Product not found in database:", productId);
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
}

// Função para lidar com pagamentos de fatura bem-sucedidos
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    // Atualizar o status da assinatura para 'active' se necessário
    const subscriptionId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription.id;

    // Buscar a assinatura no banco de dados
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.stripeSubscriptionId, subscriptionId),
    });

    if (subscription) {
      // Atualizar o status da assinatura
      await db
        .update(userSubscriptions)
        .set({
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.id, subscription.id));
    }
  }
}

// Função para lidar com falhas de pagamento de fatura
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    // Atualizar o status da assinatura para 'past_due'
    const subscriptionId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription.id;

    // Buscar a assinatura no banco de dados
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.stripeSubscriptionId, subscriptionId),
    });

    if (subscription) {
      // Atualizar o status da assinatura
      await db
        .update(userSubscriptions)
        .set({
          status: "past_due",
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.id, subscription.id));
    }
  }
}
