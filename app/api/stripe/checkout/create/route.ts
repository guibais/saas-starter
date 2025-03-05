import { NextRequest, NextResponse } from "next/server";
import { createOneTimeCheckoutSession } from "@/lib/payments/stripe";
import { getUser } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cartItems, paymentMethod } = body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { message: "Carrinho inválido" },
        { status: 400 }
      );
    }

    // Verificar se todos os produtos têm um ID do Stripe
    for (const item of cartItems) {
      if (!item.price) {
        // Se não tiver, buscar o produto no banco e criar no Stripe
        const productId = parseInt(item.productId);
        if (isNaN(productId)) {
          return NextResponse.json(
            { message: "ID de produto inválido" },
            { status: 400 }
          );
        }

        const dbProduct = await db.query.products.findFirst({
          where: eq(products.id, productId),
        });

        if (!dbProduct) {
          return NextResponse.json(
            { message: `Produto não encontrado: ${productId}` },
            { status: 404 }
          );
        }

        // Aqui você poderia criar o produto no Stripe e atualizar o banco
        // Por enquanto, retornamos erro
        return NextResponse.json(
          { message: `Produto sem ID do Stripe: ${dbProduct.name}` },
          { status: 400 }
        );
      }
    }

    // Criar sessão de checkout
    const session = await createOneTimeCheckoutSession({
      userId: user.id,
      cartItems,
      customerEmail: user.email,
    });

    if (!session || !session.url) {
      throw new Error("Falha ao criar sessão de checkout");
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);
    return NextResponse.json(
      { message: "Erro ao criar sessão de checkout" },
      { status: 500 }
    );
  }
}
