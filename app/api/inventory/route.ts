import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { products } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

// GET /api/inventory - Listar todos os produtos com informações de estoque
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Obter parâmetros de consulta para filtragem
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    // Buscar todos os produtos
    let productList;

    // Aplicar filtros se fornecidos
    if (category) {
      productList = await db
        .select()
        .from(products)
        .where(eq(products.productType, category));
    } else {
      productList = await db.select().from(products);
    }

    // Processar os produtos para adicionar status baseado no estoque
    const inventoryItems = productList.map((product) => {
      let status = "Em Estoque";
      if (product.stockQuantity <= 5) {
        status = "Estoque Crítico";
      } else if (product.stockQuantity <= 20) {
        status = "Estoque Baixo";
      }

      return {
        id: product.id.toString(),
        name: product.name,
        category: product.productType,
        currentStock: product.stockQuantity,
        minStock: 10, // Valores padrão que podem ser configuráveis no futuro
        maxStock: 100, // Valores padrão que podem ser configuráveis no futuro
        unit: "unidade", // Valor padrão que pode ser configurável no futuro
        status,
      };
    });

    // Filtrar por status se fornecido
    let filteredItems = inventoryItems;
    if (status) {
      filteredItems = inventoryItems.filter((item) => {
        if (status === "normal" && item.status === "Em Estoque") return true;
        if (status === "low" && item.status === "Estoque Baixo") return true;
        if (status === "critical" && item.status === "Estoque Crítico")
          return true;
        return false;
      });
    }

    return NextResponse.json(filteredItems);
  } catch (error) {
    console.error("Erro ao buscar inventário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar inventário" },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory - Atualizar estoque de produtos
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Obter dados do corpo da requisição
    const body = await request.json();

    if (!body.adjustments || !Array.isArray(body.adjustments)) {
      return NextResponse.json(
        { error: "Formato de dados inválido" },
        { status: 400 }
      );
    }

    const updates = [];

    // Processar cada ajuste de estoque
    for (const adjustment of body.adjustments) {
      const { id, quantity } = adjustment;

      if (!id || typeof quantity !== "number") {
        continue; // Pular ajustes inválidos
      }

      // Buscar o produto atual
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, parseInt(id)))
        .limit(1);

      if (!product || product.length === 0) {
        continue; // Produto não encontrado
      }

      // Calcular novo estoque (não permitir valores negativos)
      const newStock = Math.max(0, product[0].stockQuantity + quantity);

      // Atualizar o estoque
      const updated = await db
        .update(products)
        .set({
          stockQuantity: newStock,
          updatedAt: new Date(),
        })
        .where(eq(products.id, parseInt(id)))
        .returning();

      updates.push(updated[0]);
    }

    return NextResponse.json({
      message: "Estoque atualizado com sucesso",
      updates,
    });
  } catch (error) {
    console.error("Erro ao atualizar estoque:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar estoque" },
      { status: 500 }
    );
  }
}
