import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  PackageIcon,
  RefreshCcw,
  PauseCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cookies } from "next/headers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import SubscriptionDebug from "./debug";
import { getCustomerUser } from "@/lib/customer/utils";

// Function to get customer subscription
async function getCustomerSubscription(customerId: number) {
  try {
    // URL absoluta para evitar problemas de resolução
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions/customer/${customerId}`
      : `http://localhost:3000/api/subscriptions/customer/${customerId}`;

    console.log(`Buscando assinatura para cliente ID: ${customerId}`);
    console.log(`URL da API: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        Cookie: cookies().toString(),
      },
      next: { revalidate: 0 },
    });

    console.log(`Status da resposta: ${response.status}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Nenhuma assinatura encontrada para este cliente");
        return null; // No subscription found
      }
      console.error(`Erro ao buscar assinatura: ${response.statusText}`);
      throw new Error(`Error fetching subscription: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(
      "Dados da assinatura recebidos:",
      JSON.stringify(data).substring(0, 200) + "..."
    );
    return data;
  } catch (error) {
    console.error("Erro ao buscar assinatura do cliente:", error);
    return null;
  }
}

// Format date helper
function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: { debug?: string };
}) {
  const showDebug = searchParams.debug === "true";
  const user = await getCustomerUser();

  console.log(
    "Página de assinatura - Dados do usuário:",
    user ? `ID: ${user.id}` : "Usuário não encontrado"
  );

  if (!user) {
    redirect("/customer/login");
  }

  const subscription = await getCustomerSubscription(user.id);
  console.log(
    "Página de assinatura - Assinatura encontrada:",
    subscription ? "Sim" : "Não"
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Minha Assinatura</h1>
        <div className="flex gap-2">
          {showDebug && (
            <Link href="/customer/dashboard/subscription">
              <Button variant="outline">Esconder Diagnóstico</Button>
            </Link>
          )}
          {!showDebug && (
            <Link href="/customer/dashboard/subscription?debug=true">
              <Button variant="outline" size="sm">
                Diagnóstico
              </Button>
            </Link>
          )}
          <Link href="/customer/dashboard">
            <Button variant="outline">Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>

      {showDebug && user && <SubscriptionDebug userId={user.id} />}

      {!subscription ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma assinatura encontrada</CardTitle>
            <CardDescription>
              Você ainda não possui uma assinatura ativa.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-center text-gray-500 mb-6">
              Escolha um plano de assinatura para receber frutas frescas
              regularmente.
            </p>
            <Button asChild>
              <Link href="/plans">Ver planos disponíveis</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Detalhes da Assinatura</CardTitle>
                <Badge
                  variant={
                    subscription.status === "active" ? "default" : "destructive"
                  }
                  className={
                    subscription.status === "active" ? "bg-green-500" : ""
                  }
                >
                  {subscription.status === "active"
                    ? "Ativa"
                    : subscription.status === "paused"
                    ? "Pausada"
                    : subscription.status === "cancelled"
                    ? "Cancelada"
                    : subscription.status}
                </Badge>
              </div>
              <CardDescription>ID: {subscription.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Plano</h3>
                  <p className="font-medium">{subscription.planName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Preço</h3>
                  <p className="font-medium">
                    R$ {parseFloat(subscription.price).toFixed(2)}/mês
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Data de Início
                  </h3>
                  <p className="font-medium">
                    {formatDate(subscription.startDate)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Próxima Cobrança
                  </h3>
                  <p className="font-medium">
                    {formatDate(
                      subscription.nextBillingDate ||
                        subscription.nextDeliveryDate
                    )}
                  </p>
                </div>
              </div>

              {subscription.items && subscription.items.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-3">Itens do Plano</h3>
                  <ul className="space-y-2">
                    {subscription.items.map(
                      (
                        item: {
                          productName: string;
                          quantity: number;
                          unit?: string;
                        },
                        index: number
                      ) => (
                        <li key={index} className="flex justify-between">
                          <span>{item.productName}</span>
                          <span className="font-medium">
                            {item.quantity} {item.unit || "un"}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                asChild
              >
                <Link href="/plans">
                  <RefreshCcw className="h-4 w-4" />
                  Alterar Plano
                </Link>
              </Button>
              {subscription.status === "active" ? (
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  asChild
                >
                  <Link href={`/api/subscriptions/${subscription.id}/pause`}>
                    <PauseCircle className="h-4 w-4" />
                    Pausar Assinatura
                  </Link>
                </Button>
              ) : subscription.status === "paused" ? (
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  asChild
                >
                  <Link href={`/api/subscriptions/${subscription.id}/resume`}>
                    <RefreshCcw className="h-4 w-4" />
                    Retomar Assinatura
                  </Link>
                </Button>
              ) : null}
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próxima Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-gray-500" />
                  <span>{formatDate(subscription.nextDeliveryDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span>Entre 08:00 e 12:00</span>
                </div>
                <div className="flex items-center gap-2">
                  <PackageIcon className="h-5 w-5 text-gray-500" />
                  <span>Entrega padrão</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Alterar Data de Entrega
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Precisa de Ajuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Estamos aqui para ajudar com qualquer dúvida sobre sua
                  assinatura.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button variant="default" className="w-full">
                  Falar com Atendimento
                </Button>
                <Button variant="outline" className="w-full">
                  Ver Perguntas Frequentes
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
