import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import {
  userSubscriptions,
  subscriptionPlans,
  subscriptionItems,
  customers,
  products,
  paymentMethods,
  payments,
  planFixedItems,
  users,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/payments/stripe";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      planId,
      customizableItems,
      userDetails,
      paymentDetails,
      createAccount,
      paymentIntentId,
    } = body;

    // Verificar se o plano existe
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      );
    }

    let userId = session?.user?.id;

    // Se não há sessão e precisamos criar uma conta
    if (!userId && createAccount) {
      // Verificar se o email já existe
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, userDetails.email),
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email já cadastrado. Faça login para continuar." },
          { status: 400 }
        );
      }

      // Criar hash da senha
      const hashedPassword = await bcrypt.hash(userDetails.password, 10);

      // Criar novo usuário
      const [newUser] = await db
        .insert(users)
        .values({
          name: userDetails.name,
          email: userDetails.email,
          hashedPassword,
          phone: userDetails.phone,
          address: userDetails.address,
          role: "customer",
        })
        .returning();

      userId = newUser.id;
    } else if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Verificar se o usuário já tem uma assinatura ativa para este plano
    const existingSubscription = await db.query.userSubscriptions.findFirst({
      where: (userSub, { and, eq }) =>
        and(
          eq(userSub.userId, userId),
          eq(userSub.planId, planId),
          eq(userSub.status, "active")
        ),
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: "Você já possui uma assinatura ativa para este plano" },
        { status: 400 }
      );
    }

    // Se temos um ID de Payment Intent, verificamos seu status
    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      if (
        paymentIntent.status !== "succeeded" &&
        paymentIntent.status !== "requires_capture"
      ) {
        return NextResponse.json(
          { error: "Pagamento não foi concluído" },
          { status: 400 }
        );
      }
    }

    // Calcular próxima data de entrega (próxima segunda-feira)
    const nextDeliveryDate = getNextMonday();

    // Criar assinatura
    const [subscription] = await db
      .insert(userSubscriptions)
      .values({
        userId,
        planId,
        status: "active",
        startDate: new Date(),
        nextDeliveryDate,
        stripeSubscriptionId: null, // Será atualizado quando criarmos no Stripe
        planName: plan.name,
      })
      .returning();

    // Salvar itens personalizados
    if (customizableItems && customizableItems.length > 0) {
      const itemValues = customizableItems.map((item) => ({
        subscriptionId: subscription.id,
        productId: item.product.id,
        quantity: item.quantity,
      }));

      await db.insert(subscriptionItems).values(itemValues);
    }

    // Se o usuário optou por salvar o método de pagamento, vamos criar um customer no Stripe
    if (paymentDetails.savePaymentMethod && paymentIntentId) {
      // Recuperar o customer existente ou criar um novo
      let customer;
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (user && user.stripeCustomerId) {
        // Usuário já tem um customer ID, vamos usá-lo
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        // Criar um novo customer
        customer = await stripe.customers.create({
          name: userDetails.name,
          email: userDetails.email,
          phone: userDetails.phone,
          address: {
            line1: userDetails.address,
          },
          metadata: {
            userId,
          },
        });

        // Atualizar o customer ID no usuário
        await db
          .update(users)
          .set({ stripeCustomerId: customer.id })
          .where(eq(users.id, userId));
      }

      // Atualizar o Payment Intent para associá-lo ao customer
      if (customer) {
        await stripe.paymentIntents.update(paymentIntentId, {
          customer: customer.id,
          setup_future_usage: "off_session",
        });
      }
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      message: "Assinatura criada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao processar o pagamento" },
      { status: 500 }
    );
  }
}

// Função auxiliar para calcular a próxima segunda-feira
function getNextMonday(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, ...

  // Calcular quantos dias faltam para a próxima segunda-feira
  const daysUntilMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7;

  // Se hoje é segunda-feira, retornamos a próxima semana
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);

  // Resetar para o início do dia
  nextMonday.setHours(8, 0, 0, 0);

  return nextMonday;
}
