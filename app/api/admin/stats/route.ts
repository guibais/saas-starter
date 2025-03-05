import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  users,
  orders,
  products,
  customers,
  userSubscriptions,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { and, count, eq, gte, lte, sql, SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e permissão de admin
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Obter parâmetros de data
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Construir condições de filtragem por data
    let dateCondition: SQL<unknown> | undefined = undefined;
    if (startDate && endDate) {
      dateCondition = and(
        gte(orders.createdAt, new Date(startDate)),
        lte(orders.createdAt, new Date(endDate))
      );
    } else if (startDate) {
      dateCondition = gte(orders.createdAt, new Date(startDate));
    } else if (endDate) {
      dateCondition = lte(orders.createdAt, new Date(endDate));
    }

    // Buscar estatísticas com base no período selecionado
    // 1. Total de vendas
    const salesResult = await db
      .select({
        totalSales: sql`SUM(total_amount)`.mapWith(Number),
        orderCount: count(),
      })
      .from(orders)
      .where(dateCondition);

    const totalSales = salesResult[0]?.totalSales || 0;
    const orderCount = salesResult[0]?.orderCount || 0;

    // 2. Novos usuários no período
    const newUsersResult = await db
      .select({ count: count() })
      .from(customers)
      .where(
        startDate && endDate
          ? and(
              gte(customers.createdAt, new Date(startDate)),
              lte(customers.createdAt, new Date(endDate))
            )
          : startDate
          ? gte(customers.createdAt, new Date(startDate))
          : endDate
          ? lte(customers.createdAt, new Date(endDate))
          : undefined
      );

    const newUsers = newUsersResult[0]?.count || 0;

    // 3. Pedidos pendentes
    const pendingOrdersResult = await db
      .select({ count: count() })
      .from(orders)
      .where(
        dateCondition
          ? and(dateCondition, eq(orders.status, "Pendente"))
          : eq(orders.status, "Pendente")
      );

    const pendingOrders = pendingOrdersResult[0]?.count || 0;

    // 4. Produtos com estoque baixo
    const lowStockResult = await db
      .select({ count: count() })
      .from(products)
      .where(
        and(
          eq(products.isAvailable, true),
          sql`stock_quantity <= 20 AND stock_quantity > 5`
        )
      );

    const criticalStockResult = await db
      .select({ count: count() })
      .from(products)
      .where(and(eq(products.isAvailable, true), sql`stock_quantity <= 5`));

    const lowStock = lowStockResult[0]?.count || 0;
    const criticalStock = criticalStockResult[0]?.count || 0;

    // 5. Contagens das seções administrativas
    const productsCount = await db.select({ count: count() }).from(products);

    const plansCount = await db
      .select({ count: count() })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.status, "active"));

    const usersCount = await db.select({ count: count() }).from(users);

    const subscriptionsCount = await db
      .select({ count: count() })
      .from(userSubscriptions);

    // Verificar a mudança percentual (comparando com período anterior equivalente)
    // Este é um cálculo simplificado que poderia ser melhorado
    let salesChangePercent = 0;
    let usersChangePercent = 0;
    let ordersChangePercent = 0;
    let stockChangeValue = 0;

    if (startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const periodInDays =
        (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24);

      // Calcular período anterior equivalente
      const previousStartDate = new Date(startDateObj);
      previousStartDate.setDate(previousStartDate.getDate() - periodInDays);
      const previousEndDate = new Date(startDateObj);
      previousEndDate.setDate(previousEndDate.getDate() - 1);

      // Obter estatísticas do período anterior
      const previousSalesResult = await db
        .select({
          totalSales: sql`SUM(total_amount)`.mapWith(Number),
          orderCount: count(),
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, previousStartDate),
            lte(orders.createdAt, previousEndDate)
          )
        );

      const previousUsersResult = await db
        .select({ count: count() })
        .from(customers)
        .where(
          and(
            gte(customers.createdAt, previousStartDate),
            lte(customers.createdAt, previousEndDate)
          )
        );

      const previousSales = previousSalesResult[0]?.totalSales || 0;
      const previousOrderCount = previousSalesResult[0]?.orderCount || 0;
      const previousUsers = previousUsersResult[0]?.count || 0;

      // Calcular percentuais de mudança
      salesChangePercent =
        previousSales > 0
          ? Math.round(((totalSales - previousSales) / previousSales) * 100)
          : 0;

      usersChangePercent =
        previousUsers > 0
          ? Math.round(((newUsers - previousUsers) / previousUsers) * 100)
          : 0;

      ordersChangePercent =
        previousOrderCount > 0
          ? Math.round(
              ((orderCount - previousOrderCount) / previousOrderCount) * 100
            )
          : 0;

      // Para produtos com baixo estoque, calcular variação absoluta
      const previousLowStockResult = await db
        .select({ count: count() })
        .from(products)
        .where(and(eq(products.isAvailable, true), sql`stock_quantity <= 20`));

      const previousLowStock = previousLowStockResult[0]?.count || 0;
      stockChangeValue = lowStock + criticalStock - previousLowStock;
    }

    // Formatação dos valores para exibição
    const formattedSales = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(totalSales);

    // Retornar as estatísticas coletadas
    return NextResponse.json({
      stats: [
        {
          title: "Vendas no Período",
          value: formattedSales,
          change: `${salesChangePercent > 0 ? "+" : ""}${salesChangePercent}%`,
          trend: salesChangePercent >= 0 ? "up" : "down",
        },
        {
          title: "Novos Usuários",
          value: newUsers.toString(),
          change: `${usersChangePercent > 0 ? "+" : ""}${usersChangePercent}%`,
          trend: usersChangePercent >= 0 ? "up" : "down",
        },
        {
          title: "Pedidos Pendentes",
          value: pendingOrders.toString(),
          change: `${
            ordersChangePercent > 0 ? "+" : ""
          }${ordersChangePercent}%`,
          trend: ordersChangePercent >= 0 ? "up" : "down",
        },
        {
          title: "Produtos Baixo Estoque",
          value: (lowStock + criticalStock).toString(),
          change: `${stockChangeValue > 0 ? "+" : ""}${stockChangeValue}`,
          trend: stockChangeValue <= 0 ? "up" : "down",
        },
      ],
      adminSections: [
        {
          title: "Produtos",
          description: "Gerenciar catálogo de produtos",
          href: "/dashboard/admin/products",
          count: `${productsCount[0]?.count || 0} produtos`,
        },
        {
          title: "Planos de Assinatura",
          description: "Configurar planos de assinatura",
          href: "/dashboard/admin/plans",
          count: `${plansCount[0]?.count || 0} planos ativos`,
        },
        {
          title: "Estoque",
          description: "Gerenciar níveis de estoque",
          href: "/dashboard/admin/inventory",
          count: `${lowStock + criticalStock} itens críticos`,
        },
        {
          title: "Pedidos",
          description: "Visualizar e gerenciar pedidos",
          href: "/dashboard/admin/orders",
          count: `${pendingOrders} pendentes`,
        },
        {
          title: "Usuários",
          description: "Gerenciar contas de usuários",
          href: "/dashboard/admin/users",
          count: `${usersCount[0]?.count || 0} usuários`,
        },
        {
          title: "Assinaturas",
          description: "Gerenciar assinaturas ativas",
          href: "/dashboard/admin/subscriptions",
          count: `${subscriptionsCount[0]?.count || 0} assinaturas`,
        },
      ],
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
