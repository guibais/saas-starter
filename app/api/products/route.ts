import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { products } from "@/lib/db/schema";
import { desc, eq, like, or, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Schema de validação para criação/atualização de produtos
const productSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  price: z.string().or(z.number()),
  imageUrl: z.string().optional().nullable(),
  productType: z.enum(["normal", "exotic"]),
  stockQuantity: z.number().min(0),
  isAvailable: z.boolean().default(true),
});

// GET /api/products - Listar todos os produtos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 10;
    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page")!)
      : 1;
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const offset = (page - 1) * limit;

    // Construir a query base
    let query = db.select().from(products);

    // Adicionar filtros
    if (search) {
      query = query.where(
        or(
          like(products.name, `%${search}%`),
          like(products.description || "", `%${search}%`)
        )
      );
    }

    if (type && (type === "normal" || type === "exotic")) {
      query = query.where(eq(products.productType, type));
    }

    // Adicionar ordenação
    if (sortBy === "price") {
      query = query.orderBy(
        sortOrder === "asc" ? products.price : desc(products.price)
      );
    } else if (sortBy === "name") {
      query = query.orderBy(
        sortOrder === "asc" ? products.name : desc(products.name)
      );
    } else {
      query = query.orderBy(
        sortOrder === "asc" ? products.createdAt : desc(products.createdAt)
      );
    }

    // Adicionar paginação
    query = query.limit(limit).offset(offset);

    // Executar a query
    const productsList = await query;

    // Contar total de produtos para paginação usando SQL direto
    let countSql = sql`SELECT COUNT(*) FROM products`;

    if (search && type && (type === "normal" || type === "exotic")) {
      countSql = sql`SELECT COUNT(*) FROM products WHERE 
        (name LIKE ${`%${search}%`} OR description LIKE ${`%${search}%`}) 
        AND product_type = ${type}`;
    } else if (search) {
      countSql = sql`SELECT COUNT(*) FROM products WHERE 
        name LIKE ${`%${search}%`} OR description LIKE ${`%${search}%`}`;
    } else if (type && (type === "normal" || type === "exotic")) {
      countSql = sql`SELECT COUNT(*) FROM products WHERE product_type = ${type}`;
    }

    const totalResult = await db.execute(countSql);
    const total =
      totalResult && totalResult.length > 0
        ? Number(totalResult[0]?.count || 0)
        : 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      products: productsList,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 }
    );
  }
}

// POST /api/products - Criar um novo produto
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validar os dados recebidos
    const validatedData = productSchema.parse(body);

    // Verificar se já existe um produto com o mesmo nome
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.name, validatedData.name),
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Já existe um produto com este nome" },
        { status: 400 }
      );
    }

    // Inserir o produto no banco de dados
    const [newProduct] = await db
      .insert(products)
      .values({
        name: validatedData.name,
        description: validatedData.description || null,
        price: validatedData.price.toString(),
        imageUrl: processImageUrl(validatedData.imageUrl),
        productType: validatedData.productType,
        stockQuantity: validatedData.stockQuantity,
        isAvailable: validatedData.isAvailable,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar produto:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    );
  }
}

// Função auxiliar para processar URLs do R2
function processImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    // Verificar se é uma URL especial do R2
    if (url.startsWith("__r2_storage__:")) {
      console.log("URL do R2 recebida:", url);

      // Verificar se é um caso especial onde a URL completa foi prefixada
      if (url.includes("https://") || url.includes("http://")) {
        // Extrair apenas a parte após "__r2_storage__:"
        const actualUrl = url.replace("__r2_storage__:", "");

        // Para URLs no formato __r2_storage__:https::dominio/caminho
        // Corrigir o formato dos dois pontos extras após https:
        return actualUrl
          .replace(/^https::(.*)/i, "https://$1")
          .replace(/^http::(.*)/i, "http://$1");
      }

      // Caso tradicional do formato __r2_storage__:bucket:path
      const parts = url.split(":");
      if (parts.length >= 3) {
        const bucket = parts[1];
        const filePath = parts.slice(2).join(":");
        // Reconstruir a URL pública do R2
        const r2PublicUrl = process.env.R2_PUBLIC_URL || "";

        // Remover barras extras para construção limpa da URL
        const baseUrl = r2PublicUrl.endsWith("/")
          ? r2PublicUrl.slice(0, -1)
          : r2PublicUrl;
        const path = filePath.startsWith("/") ? filePath.slice(1) : filePath;

        const processedUrl = `${baseUrl}/${bucket}/${path}`;
        console.log("URL do R2 processada:", processedUrl);
        return processedUrl;
      }
    }

    // Verificar se é uma URL de erro
    if (url.startsWith("__r2_error__:")) {
      console.error("URL com erro do R2:", url);
      // Optamos por retornar null para não salvar URLs inválidas
      return null;
    }

    return url;
  } catch (error) {
    console.error("Erro ao processar URL da imagem:", error);
    return url; // Em caso de erro, mantém a URL original
  }
}
