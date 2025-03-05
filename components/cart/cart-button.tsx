"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/state/cartStore";
import { useEffect, useState } from "react";

export function CartButton() {
  const { openCart, getItemCount } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);

  // Evitar hidratação incorreta
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-800 text-[10px] font-medium text-white flex items-center justify-center">
          0
        </span>
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
      <ShoppingCart className="h-5 w-5" />
      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-800 text-[10px] font-medium text-white flex items-center justify-center">
        {getItemCount()}
      </span>
    </Button>
  );
}
