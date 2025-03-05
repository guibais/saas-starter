"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

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
  };

  return (
    <nav className="flex items-center text-sm text-gray-500 mb-4 overflow-x-auto pb-2">
      <Link
        href="/dashboard/admin"
        className="hover:text-gray-900 whitespace-nowrap"
      >
        {segmentNames["admin"]}
      </Link>
      {segments.slice(2).map((segment, index) => {
        // Ignorar segmentos numéricos (IDs)
        if (!isNaN(Number(segment))) {
          return null;
        }

        const href = `/${segments.slice(0, index + 3).join("/")}`;
        const isLast = index === segments.slice(2).length - 1;

        return (
          <div key={segment} className="flex items-center whitespace-nowrap">
            <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
            {isLast ? (
              <span className="font-medium text-gray-900">
                {segmentNames[segment] || segment}
              </span>
            ) : (
              <Link href={href} className="hover:text-gray-900">
                {segmentNames[segment] || segment}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="w-full">
      {/* Main content */}
      <div className="w-full">
        {/* Breadcrumb */}
        {pathname !== "/dashboard/admin" && <Breadcrumb />}
        {children}
      </div>
    </div>
  );
}
