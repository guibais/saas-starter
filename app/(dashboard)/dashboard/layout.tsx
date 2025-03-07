"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Package,
  ShoppingBag,
  Layers,
  Users,
  BarChart3,
  Settings,
  Calendar,
  ShoppingCart,
  Menu,
  X,
  Home,
  Shield,
  Activity,
  Cog,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CircleIcon } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

// Forçar renderização dinâmica em todas as páginas do dashboard
export const dynamic = "force-dynamic";

// Componente de Breadcrumb
function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Mapeamento de segmentos para nomes mais amigáveis
  const segmentNames: Record<string, string> = {
    dashboard: "Dashboard",
    admin: "Admin",
    products: "Produtos",
    plans: "Planos",
    inventory: "Estoque",
    orders: "Pedidos",
    users: "Usuários",
    subscriptions: "Assinaturas",
    general: "Geral",
    activity: "Atividade",
    security: "Segurança",
  };

  // Se estiver na raiz do dashboard, não mostrar breadcrumb
  if (pathname === "/dashboard") {
    return null;
  }

  return (
    <nav className="flex items-center text-sm text-gray-500 mb-4 overflow-x-auto pb-2">
      <Link href="/dashboard" className="hover:text-gray-900 whitespace-nowrap">
        Dashboard
      </Link>
      {segments.slice(1).map((segment, index) => {
        // Ignorar segmentos numéricos (IDs)
        if (!isNaN(Number(segment))) {
          return null;
        }

        // Construir o href para o segmento atual
        const href = `/${segments.slice(0, index + 2).join("/")}`;
        const isLast = index === segments.slice(1).length - 1;

        // Verificar se estamos na seção admin e aplicar estilos/links especiais
        const linkText = segmentNames[segment] || segment;

        return (
          <div key={segment} className="flex items-center whitespace-nowrap">
            <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
            {isLast ? (
              <span className="font-medium text-gray-900">{linkText}</span>
            ) : (
              <Link href={href} className="hover:text-gray-900">
                {linkText}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile header */}
      <div className="border-b lg:hidden">
        <div className="flex h-16 items-center px-4">
          <button className="mr-4">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </button>
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold">Tudo Fresco</span>
          </Link>
          <div className="ml-auto flex items-center space-x-4">
            <Link href="/api/auth/logout">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Overlay para dispositivos móveis */}

        {/* Sidebar */}
        <div
          id="mobile-sidebar"
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-background transition-transform lg:static lg:translate-x-0"
          )}
        >
          <div className="flex h-16 items-center justify-between border-b px-4 lg:h-[65px]">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold">Tudo Fresco</span>
            </Link>
            <button className="lg:hidden">
              <X className="h-6 w-6" />
              <span className="sr-only">Close sidebar</span>
            </button>
          </div>
          <nav className="space-y-6 px-2 py-5 h-[calc(100vh-65px)] overflow-y-auto">
            {/* <div>
              <h3 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                Dashboard
              </h3>
              <div className="space-y-1">
                {defaultLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
                      pathname === link.href
                        ? "bg-muted font-medium text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.title}
                  </Link>
                ))}
              </div>
            </div> */}
            <div className="border-t border-gray-200 pt-4 mt-auto">
              <Link
                href="/api/auth/logout"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:text-red-800 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </Link>
            </div>
          </nav>
        </div>
        <div className="flex flex-1 flex-col">
          <main className="flex-1 p-4 md:p-6">
            <Breadcrumb />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
