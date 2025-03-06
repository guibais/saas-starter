"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Package,
  Calendar,
  AlertCircle,
} from "lucide-react";
import React, { use } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
  deliveryInstructions: string | null;
  createdAt: string;
}

interface Subscription {
  id: number;
  userId: number;
  planId: number;
  status: string;
  startDate: string;
  nextDeliveryDate: string | null;
  price?: number;
  planName?: string;
}

interface Order {
  id: number;
  userId: number;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productName?: string;
}

export default function UserDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const unwrappedParams = use(params as any) as { id: string };
  const userId = unwrappedParams.id;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/users/${userId}`);

        if (response.status === 401) {
          // Redirecionar para a página de login administrativo
          toast.error("Sessão expirada. Faça login novamente.");
          router.push("/admin-login");
          return;
        }

        if (!response.ok) {
          throw new Error("Falha ao carregar dados do usuário");
        }

        const data = await response.json();

        setUser(data.user);
        setSubscriptions(data.subscriptions || []);
        setOrders(data.orders || []);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Erro desconhecido");
        toast.error("Erro ao carregar dados do usuário");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId, router]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Ativa</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>;
      case "paused":
        return <Badge variant="outline">Pausada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-green-500">Entregue</Badge>;
      case "processing":
        return <Badge className="bg-blue-500">Em processamento</Badge>;
      case "shipped":
        return <Badge className="bg-yellow-500">Enviado</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Pago</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case "failed":
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">
          Carregando dados do usuário...
        </p>
      </div>
    );
  }

  // Renderizar estado de erro
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="mt-4 text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Renderizar estado de usuário não encontrado
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="mt-4 text-muted-foreground">Usuário não encontrado</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard/admin/users")}
        >
          Voltar para lista de usuários
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/admin/users")}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Detalhes do Usuário</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">
                    {user.name || "Sem nome"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {user.role === "admin" ? "Administrador" : "Cliente"}
                  </p>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{user.phone || "Não informado"}</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                  <span>{user.address || "Não informado"}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Package className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Instruções de Entrega</p>
                    <p className="text-sm">
                      {user.deliveryInstructions || "Não informado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Membro desde</p>
                    <p className="text-sm">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Assinaturas</CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  Este usuário não possui assinaturas.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Início</TableHead>
                      <TableHead>Próxima Entrega</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">
                          #{subscription.id}
                        </TableCell>
                        <TableCell>
                          {getSubscriptionStatusBadge(subscription.status)}
                        </TableCell>
                        <TableCell>
                          {formatDate(subscription.startDate)}
                        </TableCell>
                        <TableCell>
                          {subscription.nextDeliveryDate
                            ? formatDate(subscription.nextDeliveryDate)
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  Este usuário não possui pedidos.
                </p>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium">
                            Pedido #{order.id}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 md:mt-0">
                          {getOrderStatusBadge(order.status)}
                          {getPaymentStatusBadge(order.paymentStatus)}
                          <span className="font-medium">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </div>
                      {order.items && order.items.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead className="text-right">
                                Quantidade
                              </TableHead>
                              <TableHead className="text-right">
                                Preço Unitário
                              </TableHead>
                              <TableHead className="text-right">
                                Total
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {order.items.map((item: OrderItem) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  {item.productName ||
                                    `Produto #${item.productId}`}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.quantity}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(item.unitPrice)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(item.totalPrice)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center py-2 text-muted-foreground">
                          Detalhes dos itens não disponíveis.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
