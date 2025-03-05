import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  userSubscriptions,
  subscriptionPlans,
  subscriptionItems,
  customers,
  products,
  paymentMethods,
  payments,
  planFixedItems,
} from "@/lib/db/schema";
import { getSession, verifyToken, hashPassword } from "@/lib/auth/session";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";

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

    // Validar dados do cartão de crédito
    const { paymentDetails } = body;
    if (
      !paymentDetails ||
      !paymentDetails.cardNumber ||
      !paymentDetails.cardName ||
      !paymentDetails.cardExpiry ||
      !paymentDetails.cardCvc
    ) {
      return NextResponse.json(
        { error: "Informações de pagamento incompletas" },
        { status: 400 }
      );
    }

    // Verificar se os produtos existem e estão disponíveis
    const productIds = body.customizableItems.map(
      (item: { product: { id: number } }) => item.product.id
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

    // Verificar se o cliente está autenticado usando o cookie customer_session
    const cookieStore = await cookies();
    const customerSessionCookie = cookieStore.get("customer_session");

    if (customerSessionCookie?.value) {
      // Verificar o token do cliente
      const customerSession = await verifyToken(customerSessionCookie.value);

      if (customerSession && customerSession.isCustomer) {
        customerId = customerSession.user.id;

        console.log("Cliente autenticado:", {
          sessionUserId: customerId,
          isCustomer: customerSession.isCustomer,
        });

        // Verificar se o ID do cliente existe na tabela customers
        const customer = await db.query.customers.findFirst({
          where: eq(customers.id, customerId),
        });

        if (!customer) {
          console.error(
            "Cliente autenticado não encontrado na tabela customers:",
            customerId
          );
          return NextResponse.json(
            {
              error: "Cliente não encontrado. Por favor, faça login novamente.",
            },
            { status: 404 }
          );
        }

        console.log("Cliente encontrado:", {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        });

        // Se o cliente estiver autenticado, não precisamos das informações pessoais
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
      } else {
        console.log("Token de cliente inválido ou expirado");
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

      console.log(`Nova conta criada para ${email} com ID ${customerId}`);
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

    // Criar a assinatura no banco de dados (status ativo)
    const startDate = new Date();
    const nextDeliveryDate = new Date();
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7); // Próxima entrega em 7 dias

    // Formatar as datas para o formato do PostgreSQL (YYYY-MM-DD)
    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedNextDeliveryDate = nextDeliveryDate
      .toISOString()
      .split("T")[0];

    console.log("Inserindo assinatura com os seguintes dados:", {
      customerId,
      planId: body.planId,
      formattedStartDate,
      formattedNextDeliveryDate,
    });

    // Inserir na tabela de assinaturas usando SQL raw
    const insertResult = await db.execute(
      sql`INSERT INTO user_subscriptions 
          (customer_id, plan_id, status, start_date, next_delivery_date, plan_name, created_at, updated_at) 
          VALUES 
          (${customerId}, ${body.planId}, 'active', ${formattedStartDate}::date, ${formattedNextDeliveryDate}::date, ${plan.name}, NOW(), NOW()) 
          RETURNING id, status, start_date as "startDate", next_delivery_date as "nextDeliveryDate"`
    );

    // Extrair o resultado da inserção
    const subscription = insertResult[0];
    const subscriptionId = subscription.id as number;

    console.log("Assinatura criada com sucesso:", {
      subscriptionId,
      status: subscription.status,
    });

    // Buscar itens fixos do plano
    const fixedPlanItems = await db
      .select()
      .from(planFixedItems)
      .where(eq(planFixedItems.planId, body.planId));

    console.log(`Processando ${fixedPlanItems.length} itens fixos do plano`);

    // Adicionar itens fixos do plano à assinatura
    if (fixedPlanItems.length > 0) {
      for (const item of fixedPlanItems) {
        console.log("Inserindo item fixo:", {
          subscriptionId,
          productId: item.productId,
          quantity: item.quantity,
        });

        // Inserir item fixo da assinatura usando SQL raw
        await db.execute(
          sql`INSERT INTO subscription_items 
              (subscription_id, product_id, quantity, created_at, updated_at) 
              VALUES 
              (${subscriptionId}, ${item.productId}, ${item.quantity}, NOW(), NOW())`
        );
      }
    }

    // Inserir itens personalizáveis
    if (body.customizableItems.length > 0) {
      console.log(
        `Processando ${body.customizableItems.length} itens personalizáveis`
      );

      for (const item of body.customizableItems) {
        console.log("Inserindo item personalizado:", {
          subscriptionId,
          productId: item.product.id,
          quantity: item.quantity,
        });

        // Inserir item da assinatura usando SQL raw
        await db.execute(
          sql`INSERT INTO subscription_items 
              (subscription_id, product_id, quantity, created_at, updated_at) 
              VALUES 
              (${subscriptionId}, ${item.product.id}, ${item.quantity}, NOW(), NOW())`
        );
      }
    } else {
      console.log("Nenhum item personalizado para processar");
    }

    // Calcular o valor total da assinatura
    const planPrice = parseFloat(plan.price);
    let customItemsTotal = 0;

    // Calcular o valor dos itens personalizados
    for (const item of body.customizableItems) {
      const product = await db.query.products.findFirst({
        where: eq(products.id, item.product.id),
      });
      if (product) {
        customItemsTotal += parseFloat(product.price) * item.quantity;
      }
    }

    const totalAmount = planPrice + customItemsTotal;

    // Salvar os dados do cartão de crédito (em produção, isso seria feito com criptografia)
    // Aqui estamos apenas salvando os últimos 4 dígitos e a data de expiração
    const lastFourDigits = paymentDetails.cardNumber.slice(-4);

    console.log("Criando método de pagamento para o cliente:", customerId);

    // Verificar se customerId existe antes de prosseguir
    if (!customerId) {
      console.error("ID do cliente não definido ao criar método de pagamento");
      return NextResponse.json(
        { error: "Erro ao processar pagamento: ID do cliente não definido" },
        { status: 500 }
      );
    }

    // Usar SQL raw para inserir o método de pagamento
    const paymentMethodResult = await db.execute(
      sql`INSERT INTO payment_methods 
          (user_id, type, last_four_digits, expiry_date, holder_name, is_default, created_at, updated_at) 
          VALUES 
          (${customerId}, 'credit_card', ${lastFourDigits}, ${paymentDetails.cardExpiry}, ${paymentDetails.cardName}, true, NOW(), NOW()) 
          RETURNING id`
    );

    const paymentMethodId = paymentMethodResult[0].id as number;
    console.log("Método de pagamento criado:", paymentMethodId);

    // Registrar o pagamento usando SQL raw
    await db.execute(
      sql`INSERT INTO payments 
          (user_id, subscription_id, payment_method_id, amount, currency, status, payment_date, created_at, updated_at) 
          VALUES 
          (${customerId}, ${subscriptionId}, ${paymentMethodId}, ${totalAmount.toString()}, 'BRL', 'completed', NOW(), NOW(), NOW())`
    );

    // Enviar email de confirmação (em um sistema real)
    // sendConfirmationEmail(customerId, subscriptionId);

    return NextResponse.json({
      success: true,
      subscriptionId: subscriptionId,
      message: "Assinatura criada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao processar assinatura:", error);

    // Registrar detalhes específicos do erro para facilitar a depuração
    if (error instanceof Error) {
      console.error("Detalhes do erro:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao processar assinatura";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
