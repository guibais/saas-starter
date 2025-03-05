"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ShoppingBag,
  Users,
  Calendar,
  Layers,
  ShoppingCart,
  BarChart3,
  ArrowRight,
  TrendingUp,
  DollarSign,
  UserPlus,
  Package,
} from "lucide-react";

export default function AdminDashboardPage() {
  // Dados de exemplo para o dashboard
  const stats = [
    {
      title: "Vendas Hoje",
      value: "R$ 3.250,00",
      change: "+12%",
      trend: "up",
      icon: <DollarSign className="h-5 w-5 text-emerald-600" />,
    },
    {
      title: "Novos Usuários",
      value: "24",
      change: "+8%",
      trend: "up",
      icon: <UserPlus className="h-5 w-5 text-blue-600" />,
    },
    {
      title: "Pedidos Pendentes",
      value: "18",
      change: "-2%",
      trend: "down",
      icon: <ShoppingCart className="h-5 w-5 text-orange-600" />,
    },
    {
      title: "Produtos Baixo Estoque",
      value: "7",
      change: "+3",
      trend: "up",
      icon: <Package className="h-5 w-5 text-red-600" />,
    },
  ];

  const adminSections = [
    {
      title: "Produtos",
      description: "Gerenciar catálogo de produtos",
      icon: <ShoppingBag className="h-8 w-8 text-primary" />,
      href: "/dashboard/admin/products",
      count: "124 produtos",
    },
    {
      title: "Planos de Assinatura",
      description: "Configurar planos de assinatura",
      icon: <Calendar className="h-8 w-8 text-primary" />,
      href: "/dashboard/admin/plans",
      count: "5 planos ativos",
    },
    {
      title: "Estoque",
      description: "Gerenciar níveis de estoque",
      icon: <Layers className="h-8 w-8 text-primary" />,
      href: "/dashboard/admin/inventory",
      count: "7 itens críticos",
    },
    {
      title: "Pedidos",
      description: "Visualizar e gerenciar pedidos",
      icon: <ShoppingCart className="h-8 w-8 text-primary" />,
      href: "/dashboard/admin/orders",
      count: "18 pendentes",
    },
    {
      title: "Usuários",
      description: "Gerenciar contas de usuários",
      icon: <Users className="h-8 w-8 text-primary" />,
      href: "/dashboard/admin/users",
      count: "1.245 usuários",
    },
    {
      title: "Assinaturas",
      description: "Gerenciar assinaturas ativas",
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      href: "/dashboard/admin/subscriptions",
      count: "342 assinaturas",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Painel Administrativo
        </h1>
        <p className="text-muted-foreground">
          Visão geral da plataforma Tudo Fresco
        </p>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p
                className={`text-xs ${
                  stat.trend === "up" ? "text-emerald-600" : "text-red-600"
                } flex items-center mt-1`}
              >
                {stat.change}
                <TrendingUp
                  className={`h-3 w-3 ml-1 ${
                    stat.trend === "up" ? "" : "rotate-180"
                  }`}
                />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Seções principais */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Gerenciamento</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {adminSections.map((section) => (
            <Link href={section.href} key={section.title}>
              <Card className="h-full transition-all hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-medium">
                    {section.title}
                  </CardTitle>
                  {section.icon}
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {section.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {section.count}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
