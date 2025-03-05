import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cookies } from "next/headers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle } from "lucide-react";

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

// Function to get customer orders
async function getCustomerOrders(customerId: number) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/orders/customer/${customerId}?limit=20`,
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

// Function to get customer subscription for next delivery
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

export default async function HistoryPage() {
  const user = await getCustomerUser();

  if (!user) {
    redirect("/customer/login");
  }

  const { orders = [] } = await getCustomerOrders(user.id);
  const subscription = await getCustomerSubscription(user.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Histórico de Entregas</h1>
        <Link href="/customer/dashboard">
          <Button variant="outline">Voltar ao Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suas Entregas</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === "delivered"
                            ? "default"
                            : order.status === "cancelled"
                            ? "destructive"
                            : "outline"
                        }
                        className={
                          order.status === "delivered"
                            ? "bg-green-500"
                            : order.status === "processing"
                            ? "bg-blue-500"
                            : order.status === "shipped"
                            ? "bg-purple-500"
                            : ""
                        }
                      >
                        {order.status === "delivered"
                          ? "Entregue"
                          : order.status === "processing"
                          ? "Em processamento"
                          : order.status === "shipped"
                          ? "Enviado"
                          : order.status === "cancelled"
                          ? "Cancelado"
                          : order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {order.shippingAddress}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/customer/dashboard/orders/${order.id}`}>
                          Detalhes
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">
                Você ainda não tem nenhum pedido ou entrega.
              </p>
              <Button variant="outline" className="mt-6" asChild>
                <Link href="/products">Ver Produtos</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximas Entregas</CardTitle>
        </CardHeader>
        <CardContent>
          {subscription && subscription.status === "ACTIVE" ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                Sua próxima entrega está agendada para{" "}
                {formatDate(subscription.nextDeliveryDate)}.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/customer/dashboard/subscription">
                  Ver Detalhes da Assinatura
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 flex flex-col items-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
              <p className="text-gray-500">
                Você não possui assinaturas ativas para receber entregas
                regulares.
              </p>
              <Button variant="default" className="mt-4" asChild>
                <Link href="/plans">Ver Planos Disponíveis</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
