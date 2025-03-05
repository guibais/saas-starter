"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get("session_id");
  const subscriptionId = searchParams.get("subscription_id");
  const type = searchParams.get("type");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId && !subscriptionId) {
        setError("Informações de pagamento não encontradas");
        setIsLoading(false);
        return;
      }

      try {
        // Verificar o status do pagamento
        const response = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            subscriptionId,
            type: type || "subscription",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao verificar pagamento");
        }

        setIsVerified(true);
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao verificar seu pagamento"
        );
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, subscriptionId, type]);

  return (
    <div className="container max-w-4xl py-12">
      <Card className="mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Confirmação de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg">Verificando seu pagamento...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center space-y-4 py-8 text-center">
              <div className="rounded-full bg-red-100 p-3">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-red-700">
                Ocorreu um problema
              </h3>
              <p className="text-gray-600">{error}</p>
              <Button asChild className="mt-4">
                <Link href="/plans">Ver planos disponíveis</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 py-8 text-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-medium text-green-700">
                Pagamento confirmado!
              </h3>
              <p className="max-w-md text-gray-600">
                Sua assinatura foi processada com sucesso. Você receberá um
                e-mail com os detalhes da sua compra em breve.
              </p>
              <div className="mt-8 flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Button asChild>
                  <Link href="/customer/dashboard">Ir para o Dashboard</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Voltar para a Página Inicial</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
