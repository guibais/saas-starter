import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  userSubscriptions,
  subscriptionItems,
  users,
  customers,
  products,
} from "@/lib/db/schema";
import { getSession, hashPassword } from "@/lib/auth/session";
import { eq, sql } from "drizzle-orm";

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
            error: "Alguns produtos não estão disponíveis ou estão sem estoque",
            productId,
          },
          { status: 400 }
        );
      }
    }

    // Verificar autenticação ou criar nova conta
    let customerId;
    const session = await getSession();

    if (session) {
      // Usuário já está autenticado
      customerId = session.user.id;
    } else if (body.createAccount && body.userDetails) {
      // Criar nova conta de cliente
      const { name, email, phone, address, deliveryInstructions, password } =
        body.userDetails;

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

      // TODO: Enviar email com a senha temporária
      console.log(
        `Nova conta criada para ${email} com senha temporária: ${password}`
      );
    } else {
      return NextResponse.json(
        { error: "Autenticação necessária para criar assinatura" },
        { status: 401 }
      );
    }

    // Continuar com a criação da assinatura usando customerId
    // Atualizar informações do usuário se fornecidas
    if (body.userDetails) {
      await db
        .update(users)
        .set({
          name: body.userDetails.name,
          phone: body.userDetails.phone,
          address: body.userDetails.address,
          deliveryInstructions: body.userDetails.deliveryInstructions,
        })
        .where(eq(users.id, customerId));
    }

    // Criar a assinatura
    const startDate = new Date();
    const nextDeliveryDate = new Date();
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7); // Próxima entrega em 7 dias

    // Inserir na tabela de assinaturas usando SQL raw
    const insertResult = await db.execute(
      sql`INSERT INTO user_subscriptions 
          (user_id, plan_id, status, start_date, next_delivery_date, created_at, updated_at) 
          VALUES 
          (${customerId}, ${body.planId}, 'active', ${startDate}, ${nextDeliveryDate}, NOW(), NOW()) 
          RETURNING id, status, start_date as "startDate", next_delivery_date as "nextDeliveryDate"`
    );

    // Extrair o resultado da inserção
    const subscription = insertResult[0];

    // Inserir itens personalizáveis
    if (body.customizableItems.length > 0) {
      for (const item of body.customizableItems) {
        // Inserir item da assinatura usando SQL raw
        await db.execute(
          sql`INSERT INTO subscription_items 
              (subscription_id, product_id, quantity, created_at, updated_at) 
              VALUES 
              (${subscription.id}, ${item.productId}, ${item.quantity}, NOW(), NOW())`
        );

        // Atualizar o estoque do produto
        const product = await db.query.products.findFirst({
          where: eq(products.id, item.productId),
        });

        if (product) {
          const newStock = Math.max(0, product.stockQuantity - item.quantity);
          await db
            .update(products)
            .set({
              stockQuantity: newStock,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        }
      }
    }

    // Aqui seria o lugar para integrar com o Stripe ou outro gateway de pagamento
    // Por enquanto, vamos apenas simular que o pagamento foi bem-sucedido

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      message: "Assinatura criada com sucesso",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        startDate: subscription.startDate,
        nextDeliveryDate: subscription.nextDeliveryDate,
      },
    });
  } catch (error) {
    console.error("Erro ao processar assinatura:", error);
    return NextResponse.json(
      { error: "Erro ao processar assinatura" },
      { status: 500 }
    );
  }
}
