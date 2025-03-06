import { NextRequest, NextResponse } from "next/server";
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
import { stripe } from "@/lib/payments/stripe";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação usando o cookie de sessão
    const cookieStore = await cookies();
    const customerSession = cookieStore.get("customer_session");
    let session = null;

    if (customerSession?.value) {
      try {
        session = await verifyToken(customerSession.value);
      } catch (error) {
        console.error("Erro ao verificar token:", error);
      }
    }

    const data = await req.json();
    console.log("Dados recebidos:", {
      planId: data.planId,
      hasPaymentIntentId: !!data.paymentIntentId,
      createAccount: data.createAccount,
      isAuthenticated: !!session,
    });

    // Verificar se os dados necessários foram fornecidos
    if (!data.planId) {
      return NextResponse.json(
        { error: "ID do plano não fornecido" },
        { status: 400 }
      );
    }

    if (!data.paymentIntentId) {
      return NextResponse.json(
        { error: "Payment Intent ID não fornecido" },
        { status: 400 }
      );
    }

    // Verificar o status do Payment Intent no Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      data.paymentIntentId
    );

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: `Pagamento não finalizado. Status: ${paymentIntent.status}` },
        { status: 400 }
      );
    }

    // Obter ou criar cliente
    let customerId: number;

    if (session?.user?.id) {
      // Cliente já autenticado
      customerId = session.user.id;
      console.log("Cliente já autenticado:", customerId);
    } else if (data.createAccount && data.userDetails) {
      // Verificar se já existe um cliente com o mesmo email
      const existingCustomer = await db.query.customers.findFirst({
        where: eq(customers.email, data.userDetails.email),
      });

      if (existingCustomer) {
        return NextResponse.json(
          { error: "Email já cadastrado. Por favor, faça login." },
          { status: 400 }
        );
      }

      // Criar novo cliente
      console.log("Criando novo cliente...");
      const hashedPassword = await bcrypt.hash(data.userDetails.password, 10);
      const customerResult = await db
        .insert(customers)
        .values({
          name: data.userDetails.name,
          email: data.userDetails.email,
          passwordHash: hashedPassword,
          phone: data.userDetails.phone,
          address: data.userDetails.address,
          deliveryInstructions: data.userDetails.deliveryInstructions,
        })
        .returning({ id: customers.id });

      if (!customerResult || customerResult.length === 0) {
        throw new Error("Falha ao criar nova conta de cliente");
      }

      customerId = customerResult[0].id;
      console.log("Novo cliente criado:", customerId);
    } else {
      return NextResponse.json(
        {
          error:
            "Usuário não autenticado e dados para criar conta não fornecidos",
        },
        { status: 401 }
      );
    }

    // Buscar plano
    const planId = data.planId;
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      );
    }

    // Buscar itens fixos do plano separadamente
    const fixedItemsQuery = await db.query.planFixedItems.findMany({
      where: eq(planFixedItems.planId, planId),
      with: {
        product: true,
      },
    });

    console.log(
      `Plano ${plan.name} encontrado com ${fixedItemsQuery.length} itens fixos`
    );

    // Salvar método de pagamento se solicitado
    if (data.paymentDetails.savePaymentMethod) {
      try {
        console.log("Salvando método de pagamento...");

        // Verificar se temos dados do cartão nas charges
        let lastFour = "0000";
        let cardBrand = "";
        let expMonth = 12;
        let expYear = 30;

        if (
          paymentIntent.latest_charge &&
          typeof paymentIntent.latest_charge === "string"
        ) {
          try {
            const charge = await stripe.charges.retrieve(
              paymentIntent.latest_charge
            );
            if (charge.payment_method_details?.card) {
              const card = charge.payment_method_details.card;
              lastFour = card.last4 || "0000";
              cardBrand = card.brand || "";
              expMonth = card.exp_month || 12;
              expYear = card.exp_year || 30;
            }
          } catch (error) {
            console.error("Erro ao buscar detalhes da charge:", error);
          }
        }

        await db.insert(paymentMethods).values({
          userId: customerId,
          type: "card",
          lastFourDigits: lastFour,
          expiryDate: `${expMonth}/${expYear}`,
          holderName: data.userDetails.name,
          isDefault: true,
        });

        console.log("Método de pagamento salvo com sucesso");
      } catch (error) {
        console.error("Erro ao salvar método de pagamento:", error);
        // Continuar mesmo com erro para não impedir a criação da assinatura
      }
    }

    // Criar assinatura
    console.log("Criando assinatura...");

    // Próxima data de entrega (próxima segunda-feira)
    const nextDeliveryDate = getNextMonday();

    // Usar a API correta do Drizzle ORM para criar assinatura
    const newSubscription = {
      customerId: customerId,
      planId: planId,
      status: "active",
      startDate: new Date().toISOString(),
      nextDeliveryDate: nextDeliveryDate.toISOString(),
      stripeSubscriptionId: null,
      planName: plan.name,
    };

    console.log(
      "Tentando criar assinatura com:",
      JSON.stringify(newSubscription)
    );

    // Criar registro de assinatura
    const subscriptionResult = await db
      .insert(userSubscriptions)
      .values(newSubscription)
      .returning({ id: userSubscriptions.id });

    const subscriptionId = subscriptionResult[0].id;
    console.log("Assinatura criada com ID:", subscriptionId);

    // Já temos os itens fixos do plano
    console.log(
      `Encontrados ${fixedItemsQuery.length} itens fixos para o plano ID ${planId}`
    );

    // Adicionar itens fixos da assinatura
    if (fixedItemsQuery && fixedItemsQuery.length > 0) {
      for (const item of fixedItemsQuery) {
        console.log(
          `Adicionando item fixo: ${item.productId}, quantidade: ${item.quantity}`
        );
        try {
          // Usar SQL bruto para contornar problemas de tipo
          await db.execute(sql`
            INSERT INTO subscription_items 
            (subscription_id, product_id, quantity, created_at, updated_at) 
            VALUES 
            (${subscriptionId}, ${item.productId}, ${
            item.quantity
          }, ${new Date().toISOString()}, ${new Date().toISOString()})
          `);
        } catch (error) {
          console.error("Erro ao inserir item fixo:", error);
        }
      }
    }

    // Adicionar itens personalizados
    if (data.customizableItems && data.customizableItems.length > 0) {
      for (const item of data.customizableItems) {
        if (item.quantity > 0) {
          console.log(
            `Adicionando item personalizado: ${item.product.id}, quantidade: ${item.quantity}`
          );
          try {
            // Usar SQL bruto para contornar problemas de tipo
            await db.execute(sql`
              INSERT INTO subscription_items 
              (subscription_id, product_id, quantity, created_at, updated_at) 
              VALUES 
              (${subscriptionId}, ${item.product.id}, ${
              item.quantity
            }, ${new Date().toISOString()}, ${new Date().toISOString()})
            `);
          } catch (error) {
            console.error("Erro ao inserir item personalizado:", error);
          }
        }
      }
    }

    // Registrar pagamento
    console.log("Registrando pagamento...");
    const totalAmount =
      parseFloat(plan.price) +
      (data.customizableItems?.reduce((total: number, item: any) => {
        return total + parseFloat(item.product.price) * item.quantity;
      }, 0) || 0);

    // Nota: Na definição, o schema tem paymentDate obrigatório mas está ausente no código
    await db.insert(payments).values({
      userId: customerId,
      amount: totalAmount.toString(),
      status: "completed",
      paymentDate: new Date(),
      currency: "BRL",
      subscriptionId: subscriptionId,
    });

    console.log("Pagamento registrado com sucesso");

    // Se o cliente for recém-criado, fazer login automático
    if (data.createAccount) {
      // Criar token JWT para o cliente
      // Isso seria implementado com sua lógica de autenticação
      console.log("Cliente registrado, fazer login automático...");
    }

    return NextResponse.json({
      success: true,
      message: "Assinatura criada com sucesso",
      subscriptionId,
    });
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao processar o pagamento",
      },
      { status: 500 }
    );
  }
}

function getNextMonday(): Date {
  const date = new Date();
  const day = date.getDay();
  const diff = day === 0 ? 1 : 8 - day; // Se for domingo (0), próxima segunda é amanhã

  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);

  return date;
}
