"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Package,
  Phone,
  Truck,
  User,
  AlertTriangle,
  Ban,
} from "lucide-react";
import React, { use } from "react";

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  productName: string;
  productType: string;
  productImage: string | null;
}

interface Order {
  id: number;
  userId: number;
  status: string;
  totalAmount: string;
  paymentStatus: string;
  shippingAddress: string;
  deliveryInstructions: string | null;
  stripePaymentIntentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  deliveryInstructions: string | null;
}

interface OrderDetails {
  order: Order;
  user: User;
  items: OrderItem[];
}

export default function OrderDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const unwrappedParams = use(params as any) as { id: string };
  const orderId = unwrappedParams.id;

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error("Falha ao carregar detalhes do pedido");
        }
        const data = await response.json();
        setOrderDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes do pedido",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(value));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pendente":
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" /> Pendente
          </Badge>
        );
      case "Processando":
        return (
          <Badge variant="secondary">
            <Package className="mr-1 h-3 w-3" /> Processando
          </Badge>
        );
      case "Em Trânsito":
        return (
          <Badge variant="default">
            <Truck className="mr-1 h-3 w-3" /> Em Trânsito
          </Badge>
        );
      case "Entregue":
        return (
          <Badge
            className="border-transparent bg-green-500 text-white hover:bg-green-500/80"
            variant="outline"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" /> Entregue
          </Badge>
        );
      case "Cancelado":
        return (
          <Badge variant="destructive">
            <Ban className="mr-1 h-3 w-3" /> Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "Pendente":
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" /> Pendente
          </Badge>
        );
      case "Pago":
        return (
          <Badge
            className="border-transparent bg-green-500 text-white hover:bg-green-500/80"
            variant="outline"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" /> Pago
          </Badge>
        );
      case "Reembolsado":
        return (
          <Badge variant="secondary">
            <CreditCard className="mr-1 h-3 w-3" /> Reembolsado
          </Badge>
        );
      case "Falhou":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" /> Falhou
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Carregando detalhes do pedido...
          </h1>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Erro ao carregar detalhes do pedido
          </h1>
        </div>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const { order, user, items } = orderDetails;

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Pedido #{order.id}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Informações do Pedido */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Pedido</CardTitle>
            <CardDescription>Detalhes e status do pedido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Data do Pedido:
                </span>
              </div>
              <span className="font-medium">
                {formatDateTime(order.createdAt)}
              </span>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Status:</span>
              </div>
              <div>{getStatusBadge(order.status)}</div>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Pagamento:
                </span>
              </div>
              <div>{getPaymentStatusBadge(order.paymentStatus)}</div>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Valor Total:
                </span>
              </div>
              <span className="font-medium">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Entrega */}
        <Card>
          <CardHeader>
            <CardTitle>Informações de Entrega</CardTitle>
            <CardDescription>Dados de entrega do pedido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Nome:</span>
              </div>
              <span className="font-medium">{user.name || "N/A"}</span>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Telefone:</span>
              </div>
              <span className="font-medium">{user.phone || "N/A"}</span>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Endereço:</span>
              </div>
              <span className="font-medium">
                {order.shippingAddress || "N/A"}
              </span>
            </div>

            {order.deliveryInstructions && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Instruções de Entrega:
                  </span>
                </div>
                <p className="text-sm">{order.deliveryInstructions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Itens do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
          <CardDescription>Produtos incluídos neste pedido</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b pb-4"
              >
                <div className="flex items-center gap-4">
                  {item.productImage && (
                    <div className="h-16 w-16 overflow-hidden rounded-md">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{item.productName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.unitPrice)} x {item.quantity}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {item.productType}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(item.totalPrice)}
                  </p>
                </div>
              </div>
            ))}

            <div className="flex justify-between pt-4">
              <span className="font-bold">Total</span>
              <span className="font-bold">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
