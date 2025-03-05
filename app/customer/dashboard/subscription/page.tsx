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
} from "lucide-react";
import { cookies } from "next/headers";

// Function to get the customer user
async function getCustomerUser() {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_APP_URL + "/api/customer/user",
      {
        cache: "no-store",
        headers: {
          Cookie: cookies().toString(),
        },
      }
    );

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error getting customer user:", error);
    return null;
  }
}

export default async function SubscriptionPage() {
  const user = await getCustomerUser();

  if (!user) {
    redirect("/customer/login");
  }

  // Mock subscription data - in a real app, this would come from your database
  const subscription = {
    id: "sub_123456",
    status: "active",
    plan: "Plano Premium",
    price: "R$ 99,90",
    billingCycle: "Mensal",
    nextBillingDate: "15/03/2024",
    nextDeliveryDate: "15/03/2024",
    startDate: "15/01/2024",
    items: [
      { name: "Maçã Fuji", quantity: 5 },
      { name: "Banana Prata", quantity: 8 },
      { name: "Uva Thompson", quantity: 500, unit: "g" },
      { name: "Manga Palmer", quantity: 2 },
      { name: "Abacaxi Pérola", quantity: 1 },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Minha Assinatura</h1>
        <Link href="/customer/dashboard">
          <Button variant="outline">Voltar ao Dashboard</Button>
        </Link>
      </div>

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
                {subscription.status === "active" ? "Ativa" : "Inativa"}
              </Badge>
            </div>
            <CardDescription>ID: {subscription.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Plano</h3>
                <p className="font-medium">{subscription.plan}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Preço</h3>
                <p className="font-medium">
                  {subscription.price}/{subscription.billingCycle.toLowerCase()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Data de Início
                </h3>
                <p className="font-medium">{subscription.startDate}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Próxima Cobrança
                </h3>
                <p className="font-medium">{subscription.nextBillingDate}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-3">Itens do Plano</h3>
              <ul className="space-y-2">
                {subscription.items.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-medium">
                      {item.quantity} {item.unit || "un"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              Alterar Plano
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <PauseCircle className="h-4 w-4" />
              Pausar Assinatura
            </Button>
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
                <span>{subscription.nextDeliveryDate}</span>
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
    </div>
  );
}
