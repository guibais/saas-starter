import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ClipboardList,
  Package,
  CreditCard,
  Settings,
  Home,
  AlertCircle,
} from "lucide-react";
import { getCustomerUser } from "@/lib/customer/utils";
import { cookies } from "next/headers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

// Interfaces
interface SubscriptionItem {
  id: number;
  subscriptionId: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    imageUrl: string | null;
    productType: string;
    price: string;
  };
}

// Function to get customer subscription
async function getCustomerSubscription(customerId: number) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions/customer/${customerId}`,
      {
        cache: "no-store",
        headers: {
          Cookie: cookies().toString(),
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No subscription found
      }
      throw new Error(`Error fetching subscription: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching customer subscription:", error);
    return null;
  }
}

// Function to get customer orders
async function getCustomerOrders(customerId: number) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/orders/customer/${customerId}?limit=2`,
      {
        cache: "no-store",
        headers: {
          Cookie: cookies().toString(),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching orders: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return { orders: [] };
  }
}

// Função para buscar detalhes dos produtos da assinatura
async function getSubscriptionItems(subscriptionId: number) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions/${subscriptionId}/items`,
      {
        cache: "no-store",
        headers: {
          Cookie: cookies().toString(),
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Error fetching subscription items: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching subscription items:", error);
    return { items: [] };
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

export default async function CustomerDashboardPage() {
  const user = await getCustomerUser();

  if (!user) {
    redirect("/customer/login");
  }

  const subscription = await getCustomerSubscription(user.id);
  const { orders = [] } = await getCustomerOrders(user.id);

  // Buscar itens da assinatura se o usuário tiver uma assinatura ativa
  const subscriptionItems = subscription
    ? await getSubscriptionItems(subscription.id)
    : { items: [] };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar Navigation */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Menu</CardTitle>
            <CardDescription>Gerencie sua assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <nav className="flex flex-col space-y-2">
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/customer/dashboard" className="flex items-center">
                  <Home className="mr-2 h-4 w-4" />
                  Início
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link
                  href="/customer/dashboard/subscription"
                  className="flex items-center"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Minha Assinatura
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link
                  href="/customer/dashboard/history"
                  className="flex items-center"
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Histórico de Entregas
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link
                  href="/customer/dashboard/billing"
                  className="flex items-center"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pagamentos
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link
                  href="/customer/dashboard/settings"
                  className="flex items-center"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Link>
              </Button>
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="md:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo, {user.name || user.email}!</CardTitle>
            <CardDescription>
              Painel de controle da sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    Status da Assinatura
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subscription ? (
                    <>
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-2 ${
                            subscription.status.toLowerCase() === "active"
                              ? "bg-green-500"
                              : subscription.status.toLowerCase() === "paused"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        ></div>
                        <span
                          className={`${
                            subscription.status.toLowerCase() === "active"
                              ? "text-green-600"
                              : subscription.status.toLowerCase() === "paused"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {subscription.status.toLowerCase() === "active"
                            ? "Ativa"
                            : subscription.status.toLowerCase() === "paused"
                            ? "Pausada"
                            : subscription.status.toLowerCase() === "cancelled"
                            ? "Cancelada"
                            : subscription.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Próxima entrega:{" "}
                        {formatDate(subscription.nextDeliveryDate)}
                      </p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center py-2">
                      <AlertCircle className="h-8 w-8 text-yellow-500 mb-2" />
                      <p className="text-sm text-center">
                        Você ainda não possui uma assinatura ativa
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        asChild
                      >
                        <Link href="/plans">Ver planos</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Plano Atual</CardTitle>
                </CardHeader>
                <CardContent>
                  {subscription ? (
                    <>
                      {subscription.plan?.imageUrl && (
                        <div className="relative h-32 w-full mb-3 rounded-md overflow-hidden">
                          <Image
                            src={subscription.plan.imageUrl}
                            alt={subscription.planName || "Plano"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <p className="font-medium">{subscription.planName}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        R$ {parseFloat(subscription.price).toFixed(2)}/mês
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        asChild
                      >
                        <Link href="/plans">Alterar Plano</Link>
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center py-2">
                      <p className="text-sm text-center">
                        Escolha um plano para começar a receber frutas frescas
                      </p>
                      <Button
                        variant="default"
                        size="sm"
                        className="mt-4"
                        asChild
                      >
                        <Link href="/plans">Assinar agora</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {subscription &&
              subscriptionItems.items &&
              subscriptionItems.items.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Suas Frutas</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {subscriptionItems.items.map((item: SubscriptionItem) => (
                      <div
                        key={item.id}
                        className="border rounded-md overflow-hidden"
                      >
                        {item.product?.imageUrl ? (
                          <div className="relative h-24 w-full">
                            <Image
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-24 w-full bg-gray-100 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="p-2">
                          <p className="font-medium text-sm">
                            {item.product.name}
                          </p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500">
                              Qtd: {item.quantity}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {item.product.productType === "normal"
                                ? "Normal"
                                : "Exótica"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Últimas Entregas</h3>
              {orders.length > 0 ? (
                <div className="border rounded-md divide-y">
                  {orders.map((order: any) => (
                    <div
                      key={order.id}
                      className="p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">Pedido #{order.id}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "processing"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "shipped"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status === "delivered"
                          ? "Entregue"
                          : order.status === "processing"
                          ? "Em processamento"
                          : order.status === "shipped"
                          ? "Enviado"
                          : order.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-md p-6 text-center">
                  <p className="text-gray-500">Nenhuma entrega encontrada</p>
                </div>
              )}
              <div className="mt-4 text-center">
                <Button variant="link" asChild>
                  <Link href="/customer/dashboard/history">
                    Ver histórico completo
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
