"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Package,
  Search,
  Truck,
  Ban,
  AlertTriangle,
  Eye,
} from "lucide-react";

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/orders");
        if (!response.ok) {
          throw new Error("Falha ao carregar pedidos");
        }
        const data = await response.json();
        setOrders(data);
        setFilteredOrders(data);
      } catch (err) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus pedidos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [toast]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter((order) =>
        order.id.toString().includes(searchTerm.trim())
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Meus Pedidos</h1>
        <p className="text-muted-foreground">
          Visualize e acompanhe todos os seus pedidos
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por número do pedido..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[400px] items-center justify-center">
          <p className="text-muted-foreground">Carregando pedidos...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex h-[400px] flex-col items-center justify-center gap-2">
          <p className="text-muted-foreground">Nenhum pedido encontrado</p>
          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              Limpar busca
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </TableCell>
                  <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Detalhes
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
