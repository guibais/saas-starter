"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingBag,
  Users,
  CreditCard,
  Package,
  TrendingUp,
  Calendar,
  Layers,
  ShoppingCart,
  BarChart3,
  Settings,
} from "lucide-react";

export default function AdminDashboardPage() {
  const adminSections = [
    {
      title: "Produtos",
      description: "Gerenciar catálogo de produtos",
      icon: <Package className="h-8 w-8 text-primary" />,
      href: "/dashboard/admin/products",
    },
    {
      title: "Planos de Assinatura",
      description: "Configurar planos de assinatura",
      icon: <Calendar className="h-8 w-8 text-primary" />,
      href: "/dashboard/admin/plans",
    },
    {
      title: "Estoque",
      description: "Gerenciar níveis de estoque",
      icon: <Layers className="h-8 w-8 text-primary" />,
      href: "/dashboard/admin/inventory",
    },
    {
      title: "Pedidos",
      description: "Visualizar e gerenciar pedidos",
      icon: <ShoppingCart className="h-8 w-8 text-primary" />,
      href: "/dashboard/admin/orders",
    },
    {
      title: "Usuários",
      description: "Gerenciar contas de usuários",
      icon: <Users className="h-8 w-8 text-primary" />,
      href: "/dashboard/security",
    },
    {
      title: "Estatísticas",
      description: "Visualizar métricas e relatórios",
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      href: "/dashboard/activity",
    },
    {
      title: "Configurações",
      description: "Configurar a plataforma",
      icon: <Settings className="h-8 w-8 text-primary" />,
      href: "/dashboard/general",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Painel Administrativo
        </h1>
        <p className="text-muted-foreground">
          Gerencie todos os aspectos da plataforma Tudo Fresco
        </p>
      </div>

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
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
