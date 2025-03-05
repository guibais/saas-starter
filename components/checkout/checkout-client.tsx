"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/state/cartStore";
import { usePaymentStore } from "@/lib/state/paymentStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  CreditCard,
  QrCode,
  FileText,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export function CheckoutClient() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const {
    selectedPaymentMethod,
    setPaymentMethod,
    isProcessing,
    setProcessing,
    error,
    setError,
    setSessionId,
  } = usePaymentStore();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirecionar se o carrinho estiver vazio
  useEffect(() => {
    if (isMounted && items.length === 0) {
      router.push("/products");
    }
  }, [isMounted, items, router]);

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  const handleCheckout = async () => {
    if (!selectedPaymentMethod) {
      toast.error("Por favor, selecione um método de pagamento");
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Preparar os itens do carrinho para o formato esperado pela API
      const cartItems = items.map((item) => ({
        price: item.product.stripePriceId || "",
        quantity: item.quantity,
        productId: item.product.id,
      }));

      // Chamar a API para criar a sessão de checkout
      const response = await fetch("/api/stripe/checkout/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartItems,
          paymentMethod: selectedPaymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao processar o pagamento");
      }

      const data = await response.json();

      // Armazenar o ID da sessão para uso posterior
      setSessionId(data.sessionId);

      // Redirecionar para a página de checkout do Stripe
      window.location.href = data.url;
    } catch (err) {
      console.error("Erro no checkout:", err);
      setError(
        err instanceof Error ? err.message : "Erro ao processar o pagamento"
      );
      setProcessing(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <Link
          href="/products"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para produtos
        </Link>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <h1 className="text-3xl font-bold mb-6">Finalizar Compra</h1>

          <Card>
            <CardHeader>
              <CardTitle>Método de Pagamento</CardTitle>
              <CardDescription>Selecione como deseja pagar</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedPaymentMethod || ""}
                onValueChange={(value) => setPaymentMethod(value as any)}
              >
                <div className="flex items-center space-x-2 mb-4">
                  <RadioGroupItem value="credit_card" id="credit_card" />
                  <Label
                    htmlFor="credit_card"
                    className="flex items-center cursor-pointer"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Cartão de Crédito
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mb-4">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label
                    htmlFor="pix"
                    className="flex items-center cursor-pointer"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    PIX
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="boleto" id="boleto" />
                  <Label
                    htmlFor="boleto"
                    className="flex items-center cursor-pointer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Boleto Bancário
                  </Label>
                </div>
              </RadioGroup>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleCheckout}
                disabled={isProcessing || !selectedPaymentMethod}
                className="w-full bg-green-800 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Finalizar Pedido"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-secondary">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
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
                            {formatCurrency(item.product.price)} ×{" "}
                            {item.quantity}
                          </p>
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

              <Separator className="my-6" />

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-sm">Subtotal</span>
                  <span className="text-sm">
                    {formatCurrency(getSubtotal())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Frete</span>
                  <span className="text-sm">Grátis</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(getSubtotal())}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
