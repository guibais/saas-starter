"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

// Removendo o componente Breadcrumb duplicado

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
        {/* Breadcrumb removido para evitar duplicidade */}
        {children}
      </div>
    </div>
  );
}
