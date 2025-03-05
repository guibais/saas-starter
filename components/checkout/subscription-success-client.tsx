"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePaymentStore } from "@/lib/state/paymentStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Loader2, Calendar } from "lucide-react";
import Link from "next/link";

export function SubscriptionSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPaymentState, sessionId } = usePaymentStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);

  useEffect(() => {
    const processSubscriptionSuccess = async () => {
      try {
        // Obter o ID da sessão e do plano da URL ou do estado
        const sessionIdFromUrl = searchParams.get("session_id");
        const planId = searchParams.get("plan_id");
        const finalSessionId = sessionIdFromUrl || sessionId;

        if (!finalSessionId) {
          setError("ID da sessão não encontrado");
          setIsLoading(false);
          return;
        }

        if (!planId) {
          setError("ID do plano não encontrado");
          setIsLoading(false);
          return;
        }

        // Chamar a API para processar a assinatura
        const response = await fetch(
          `/api/stripe/checkout/subscription?session_id=${finalSessionId}&plan_id=${planId}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Erro ao processar a assinatura"
          );
        }

        const data = await response.json();
        setSubscriptionId(data.subscriptionId || "N/A");
        setPlanName(data.planName || "Plano de Assinatura");

        // Limpar o estado de pagamento
        resetPaymentState();
      } catch (err) {
        console.error("Erro ao processar sucesso da assinatura:", err);
        setError(
          err instanceof Error ? err.message : "Erro ao processar a assinatura"
        );
      } finally {
        setIsLoading(false);
      }
    };

    processSubscriptionSuccess();
  }, [searchParams, sessionId, resetPaymentState]);

  if (isLoading) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 text-green-800 animate-spin mb-8" />
        <h1 className="text-2xl font-bold mb-2">Processando sua assinatura</h1>
        <p className="text-muted-foreground">
          Aguarde enquanto confirmamos seu pagamento...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">
              Ocorreu um erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">
              Se você acredita que seu pagamento foi processado, entre em
              contato com nosso suporte.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/plans">Voltar para planos</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-20">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CheckCircle2 className="h-16 w-16 text-green-800 mx-auto mb-4" />
          <CardTitle className="text-2xl">Assinatura Confirmada!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6">
            Sua assinatura do plano <strong>{planName}</strong> foi confirmada.
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            Você receberá um e-mail com os detalhes da sua assinatura.
          </p>
          <p className="text-sm text-muted-foreground">
            Sua primeira entrega será agendada em breve!
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full bg-green-800 hover:bg-green-700">
            <Link href="/dashboard/subscription">Gerenciar Assinatura</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/products">
              <Calendar className="mr-2 h-4 w-4" />
              Ver Próximas Entregas
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
