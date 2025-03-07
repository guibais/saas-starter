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

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
