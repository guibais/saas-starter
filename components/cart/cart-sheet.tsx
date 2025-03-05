"use client";

import { useCartStore } from "@/lib/state/cartStore";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, X, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";

export function CartSheet() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getItemCount,
    getSubtotal,
  } = useCartStore();

  const [isMounted, setIsMounted] = useState(false);

  // Evitar hidratação incorreta
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="space-y-2.5">
          <SheetTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Carrinho
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({getItemCount()} {getItemCount() === 1 ? "item" : "itens"})
            </span>
          </SheetTitle>
          <SheetDescription>
            Revise seus itens antes de finalizar a compra
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Seu carrinho está vazio</p>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              Adicione alguns produtos para começar a comprar
            </p>
            <Button asChild onClick={closeCart}>
              <Link href="/products">Ver Produtos</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-5 overflow-y-auto max-h-[60vh] pr-2">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-md border">
                  {item.product.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary">
                      <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-sm font-medium">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.product.price)} cada
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center border rounded-md">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                        className="p-1.5 hover:bg-secondary"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-2 text-sm">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                        className="p-1.5 hover:bg-secondary"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-medium">
                      {formatCurrency(
                        Number(item.product.price) * item.quantity
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="mt-6 space-y-4">
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(getSubtotal())}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Frete e impostos calculados no checkout
              </p>
            </div>

            <SheetFooter className="mt-6">
              <Button asChild className="w-full" onClick={closeCart}>
                <Link href="/checkout">Finalizar Compra</Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
