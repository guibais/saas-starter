import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { products } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

// GET /api/products/[id] - Obter um produto específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Buscar o produto
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(product[0]);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produto" },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id] - Atualizar um produto
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar se o produto existe
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Obter dados do corpo da requisição
    const body = await request.json();

    // Preparar dados para atualização
    const updateData: Partial<typeof products.$inferInsert> = {
      updatedAt: new Date(),
    };

    // Adicionar apenas os campos que foram fornecidos
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price.toString();
    if (body.imageUrl !== undefined) {
      // Verificar se é uma URL especial do R2
      if (body.imageUrl && body.imageUrl.startsWith("__r2_storage__:")) {
        console.log("URL do R2 recebida:", body.imageUrl);

        // Verificar se é um caso especial onde a URL completa foi prefixada
        if (
          body.imageUrl.includes("https://") ||
          body.imageUrl.includes("http://")
        ) {
          // Extrair apenas a parte após "__r2_storage__:"
          const actualUrl = body.imageUrl.replace("__r2_storage__:", "");

          // Para URLs no formato __r2_storage__:https::dominio/caminho
          // Corrigir o formato dos dois pontos extras após https:
          updateData.imageUrl = actualUrl
            .replace(/^https::(.*)/i, "https://$1")
            .replace(/^http::(.*)/i, "http://$1");
        } else {
          // Caso tradicional do formato __r2_storage__:bucket:path
          const parts = body.imageUrl.split(":");
          if (parts.length >= 3) {
            const bucket = parts[1];
            const filePath = parts.slice(2).join(":");
            // Reconstruir a URL pública do R2
            const r2PublicUrl = process.env.R2_PUBLIC_URL || "";

            // Remover barras extras para construção limpa da URL
            const baseUrl = r2PublicUrl.endsWith("/")
              ? r2PublicUrl.slice(0, -1)
              : r2PublicUrl;
            const path = filePath.startsWith("/")
              ? filePath.slice(1)
              : filePath;

            updateData.imageUrl = `${baseUrl}/${bucket}/${path}`;
          } else {
            updateData.imageUrl = body.imageUrl;
          }
        }
        console.log("URL do R2 processada:", updateData.imageUrl);
      } else {
        updateData.imageUrl = body.imageUrl;
      }
    }
    if (body.productType !== undefined)
      updateData.productType = body.productType;
    if (body.stockQuantity !== undefined)
      updateData.stockQuantity = body.stockQuantity;
    if (body.isAvailable !== undefined)
      updateData.isAvailable = body.isAvailable;

    // Atualizar o produto
    const updatedProduct = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    return NextResponse.json(updatedProduct[0]);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Excluir um produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar se o produto existe
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Excluir o produto
    await db.delete(products).where(eq(products.id, id));

    return NextResponse.json(
      { message: "Produto excluído com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    return NextResponse.json(
      { error: "Erro ao excluir produto" },
      { status: 500 }
    );
  }
}
