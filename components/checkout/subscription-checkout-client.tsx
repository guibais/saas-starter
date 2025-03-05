"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePaymentStore } from "@/lib/state/paymentStore";
import { useSubscriptionStore } from "@/lib/state/subscriptionStore";
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
  CreditCard,
  QrCode,
  FileText,
  ArrowLeft,
  Loader2,
  ShoppingBag,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export function SubscriptionCheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedPlan, customizableItems, getCustomizationTotal } =
    useSubscriptionStore();
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
  const [planId, setPlanId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);

    // Obter o ID do plano da URL
    const planIdFromUrl = searchParams.get("plan_id");
    if (planIdFromUrl) {
      setPlanId(planIdFromUrl);
    }
  }, [searchParams]);

  // Redirecionar se não houver plano selecionado
  useEffect(() => {
    if (isMounted && !selectedPlan && !planId) {
      router.push("/plans");
    }
  }, [isMounted, selectedPlan, planId, router]);

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

    if (!selectedPlan && !planId) {
      toast.error("Plano não selecionado");
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Preparar os itens customizáveis para o formato esperado pela API
      const customItems = customizableItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      // Chamar a API para criar a sessão de checkout
      const response = await fetch("/api/stripe/checkout/subscription/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedPlan?.id || planId,
          customItems,
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

  if (!selectedPlan && !planId) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 text-green-800 animate-spin mb-8" />
        <h1 className="text-2xl font-bold mb-2">Carregando...</h1>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <Link
          href="/plans"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para planos
        </Link>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <h1 className="text-3xl font-bold mb-6">Finalizar Assinatura</h1>

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
                  "Finalizar Assinatura"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Resumo da Assinatura</h2>

          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-6">
                <div className="relative h-20 w-20 overflow-hidden rounded-md border">
                  {selectedPlan?.imageUrl ? (
                    <Image
                      src={selectedPlan.imageUrl}
                      alt={selectedPlan.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col">
                  <h3 className="font-medium">
                    {selectedPlan?.name || "Plano de Assinatura"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    Assinatura mensal
                  </p>
                  <p className="font-medium">
                    {formatCurrency(selectedPlan?.price || 0)}
                  </p>
                </div>
              </div>

              {customizableItems.length > 0 && (
                <>
                  <h4 className="font-medium mb-3">Itens Personalizados</h4>
                  <div className="space-y-3 mb-6">
                    {customizableItems.map((item) => (
                      <div key={item.product.id} className="flex gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                          {item.product.imageUrl ? (
                            <Image
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-secondary">
                              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="text-sm font-medium">
                                {item.product.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity}{" "}
                                {item.quantity === 1 ? "unidade" : "unidades"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Separator className="my-6" />

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-sm">Plano Base</span>
                  <span className="text-sm">
                    {formatCurrency(selectedPlan?.price || 0)}
                  </span>
                </div>
                {getCustomizationTotal() > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm">Itens Personalizados</span>
                    <span className="text-sm">
                      {formatCurrency(getCustomizationTotal())}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm">Frete</span>
                  <span className="text-sm">Grátis</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total Mensal</span>
                  <span>
                    {formatCurrency(
                      (Number(selectedPlan?.price) || 0) +
                        getCustomizationTotal()
                    )}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Ao assinar, você concorda com os termos de serviço e política
                  de privacidade.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
