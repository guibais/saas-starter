import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  userSubscriptions,
  subscriptionPlans,
  subscriptionItems,
  customers,
  products,
} from "@/lib/db/schema";
import { getSession, hashPassword } from "@/lib/auth/session";
import { eq, sql } from "drizzle-orm";
import Stripe from "stripe";

// Inicializar o cliente Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any,
});

export async function POST(request: NextRequest) {
  try {
    // Obter dados do corpo da requisição
    const body = await request.json();

    if (!body.planId) {
      return NextResponse.json(
        { error: "ID do plano é obrigatório" },
        { status: 400 }
      );
    }

    if (!body.customizableItems || !Array.isArray(body.customizableItems)) {
      return NextResponse.json(
        { error: "Itens personalizáveis são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se os produtos existem e estão disponíveis
    const productIds = body.customizableItems.map(
      (item: { productId: number }) => item.productId
    );

    for (const productId of productIds) {
      const product = await db.query.products.findFirst({
        where: eq(products.id, productId),
      });

      if (!product || !product.isAvailable || product.stockQuantity <= 0) {
        return NextResponse.json(
          {
            error: `Produto ID ${productId} não está disponível ou está sem estoque`,
            productId,
          },
          { status: 400 }
        );
      }
    }

    // Verificar autenticação ou criar nova conta
    let customerId;
    const userSession = await getSession();

    if (userSession) {
      // Usuário já está autenticado
      customerId = userSession.user.id;

      // Se o usuário estiver autenticado, não precisamos das informações pessoais
      // mas podemos atualizar as instruções de entrega se fornecidas
      if (body.userDetails?.deliveryInstructions) {
        await db
          .update(customers)
          .set({
            deliveryInstructions: body.userDetails.deliveryInstructions,
            updatedAt: new Date(),
          })
          .where(eq(customers.id, customerId));
      }
    } else if (body.createAccount && body.userDetails) {
      // Criar nova conta de cliente
      const { name, email, phone, address, deliveryInstructions, password } =
        body.userDetails;

      // Verificar se todos os campos obrigatórios foram fornecidos
      if (!name || !email || !phone || !address) {
        return NextResponse.json(
          { error: "Todos os campos são obrigatórios para criar uma conta" },
          { status: 400 }
        );
      }

      // Verificar se o email já existe
      const existingCustomer = await db.query.customers.findFirst({
        where: eq(customers.email, email),
      });

      if (existingCustomer) {
        return NextResponse.json(
          { error: "Email já cadastrado. Por favor, faça login." },
          { status: 400 }
        );
      }

      // Verificar se a senha foi fornecida
      if (!password) {
        return NextResponse.json(
          { error: "Senha é obrigatória para criar uma conta" },
          { status: 400 }
        );
      }

      // Usar a senha fornecida pelo usuário
      const hashedPassword = await hashPassword(password);

      // Criar novo cliente
      const [newCustomer] = await db
        .insert(customers)
        .values({
          name,
          email,
          passwordHash: hashedPassword,
          address,
          phone,
          deliveryInstructions,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      customerId = newCustomer.id;

      console.log(`Nova conta criada para ${email} com a senha fornecida`);
    } else {
      return NextResponse.json(
        { error: "Autenticação necessária para criar assinatura" },
        { status: 401 }
      );
    }

    // Obter detalhes do plano
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, body.planId),
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      );
    }

    // Criar a assinatura no banco de dados (status pendente)
    const startDate = new Date();
    const nextDeliveryDate = new Date();
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7); // Próxima entrega em 7 dias

    // Inserir na tabela de assinaturas usando SQL raw
    const insertResult = await db.execute(
      sql`INSERT INTO user_subscriptions 
          (user_id, plan_id, status, start_date, next_delivery_date, created_at, updated_at) 
          VALUES 
          (${customerId}, ${body.planId}, 'pending', ${startDate}, ${nextDeliveryDate}, NOW(), NOW()) 
          RETURNING id, status, start_date as "startDate", next_delivery_date as "nextDeliveryDate"`
    );

    // Extrair o resultado da inserção
    const subscription = insertResult[0];
    const subscriptionId = subscription.id as number;

    // Inserir itens personalizáveis
    if (body.customizableItems.length > 0) {
      for (const item of body.customizableItems) {
        // Inserir item da assinatura usando SQL raw
        await db.execute(
          sql`INSERT INTO subscription_items 
              (subscription_id, product_id, quantity, created_at, updated_at) 
              VALUES 
              (${subscriptionId}, ${item.productId}, ${item.quantity}, NOW(), NOW())`
        );
      }
    }

    // Calcular o valor total da assinatura
    const planPrice = parseFloat(plan.price);
    let customItemsTotal = 0;

    // Calcular o valor dos itens personalizados
    for (const item of body.customizableItems) {
      const product = await db.query.products.findFirst({
        where: eq(products.id, item.productId),
      });
      if (product) {
        customItemsTotal += parseFloat(product.price) * item.quantity;
      }
    }

    const totalAmount = planPrice + customItemsTotal;

    // Criar sessão de checkout do Stripe
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    });

    // Criar ou recuperar cliente no Stripe
    let stripeCustomerId;
    if (customer?.stripeCustomerId) {
      stripeCustomerId = customer.stripeCustomerId;
    } else {
      const stripeCustomer = await stripe.customers.create({
        email: body.userDetails?.email || customer?.email || "",
        name: body.userDetails?.name || customer?.name || "",
        phone: body.userDetails?.phone || customer?.phone || "",
        address: {
          line1: body.userDetails?.address || customer?.address || "",
          city: "Cidade",
          state: "Estado",
          postal_code: "00000-000",
          country: "BR",
        },
      });
      stripeCustomerId = stripeCustomer.id;

      // Atualizar o ID do cliente Stripe no banco de dados
      await db
        .update(customers)
        .set({
          stripeCustomerId,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, customerId));
    }

    // Criar sessão de checkout
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Assinatura: ${plan.name}`,
              description: plan.description || undefined,
              images: plan.imageUrl ? [plan.imageUrl] : undefined,
            },
            unit_amount: Math.round(totalAmount * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&subscription_id=${subscriptionId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel?subscription_id=${subscriptionId}`,
      metadata: {
        subscriptionId: subscriptionId.toString(),
        customerId: customerId.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscriptionId,
      checkoutUrl: stripeSession.url,
      message: "Sessão de checkout criada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao processar assinatura:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao processar assinatura";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
