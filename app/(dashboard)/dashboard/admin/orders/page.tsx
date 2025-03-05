"use client";

import { useState, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MoreHorizontal,
  Eye,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ban,
  ArrowUpDown,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

// Adicionar interface para os pedidos
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
  userName: string | null;
  userEmail: string | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const router = useRouter();
  const { toast } = useToast();

  // Buscar pedidos da API
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        console.log("Buscando todos os pedidos (admin)");
        const response = await fetch("/api/orders?all=true");

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Erro na resposta da API:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
          throw new Error(
            `Falha ao carregar pedidos: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log(`Recebidos ${data.length} pedidos`);
        setOrders(data);
      } catch (err) {
        console.error("Erro na requisição:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        toast({
          title: "Erro",
          description: "Não foi possível carregar os pedidos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [toast]);

  // Filtrar pedidos
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.userName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (order.userEmail?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      order.id.toString().includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    const matchesPayment =
      paymentFilter === "all" || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Atualizar status do pedido
  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: orderId,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao atualizar status do pedido");
      }

      // Atualizar a lista de pedidos
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      toast({
        title: "Sucesso",
        description: "Status do pedido atualizado",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  // Atualizar status de pagamento
  const updatePaymentStatus = async (
    orderId: number,
    paymentStatus: string
  ) => {
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: orderId,
          paymentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao atualizar status de pagamento");
      }

      // Atualizar a lista de pedidos
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, paymentStatus } : order
        )
      );

      toast({
        title: "Sucesso",
        description: "Status de pagamento atualizado",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  // Visualizar detalhes do pedido
  const viewOrderDetails = (orderId: number) => {
    router.push(`/dashboard/admin/orders/${orderId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR").format(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Entregue":
        return <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />;
      case "Em Trânsito":
        return <Truck className="mr-2 h-4 w-4 text-blue-500" />;
      case "Processando":
        return <Clock className="mr-2 h-4 w-4 text-yellow-500" />;
      case "Aguardando Pagamento":
        return <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />;
      case "Cancelado":
        return <Ban className="mr-2 h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "Pago":
        return <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />;
      case "Pendente":
        return <Clock className="mr-2 h-4 w-4 text-yellow-500" />;
      case "Reembolsado":
        return <CreditCard className="mr-2 h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  // Calculate order statistics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (sum, order) => sum + parseFloat(order.totalAmount),
    0
  );
  const pendingOrders = orders.filter(
    (order) => order.status === "Pendente" || order.status === "Processando"
  ).length;
  const completedOrders = orders.filter(
    (order) => order.status === "Entregue"
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Gerenciamento de Pedidos
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Pedidos
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((completedOrders / totalOrders) * 100)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pedidos Únicos
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((pendingOrders / totalOrders) * 100)}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por cliente, email ou ID..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status do Pedido" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="Entregue">Entregue</SelectItem>
            <SelectItem value="Em Trânsito">Em Trânsito</SelectItem>
            <SelectItem value="Processando">Processando</SelectItem>
            <SelectItem value="Aguardando Pagamento">
              Aguardando Pagamento
            </SelectItem>
            <SelectItem value="Cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status de Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="Pago">Pago</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Reembolsado">Reembolsado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Nenhum pedido encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.userEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    R$ {parseFloat(order.totalAmount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <span>{order.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getPaymentStatusIcon(order.paymentStatus)}
                      <span>{order.paymentStatus}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Ver Detalhes</span>
                        </DropdownMenuItem>
                        {order.status === "Processando" && (
                          <DropdownMenuItem>
                            <Truck className="mr-2 h-4 w-4" />
                            <span>Marcar como Enviado</span>
                          </DropdownMenuItem>
                        )}
                        {order.status === "Em Trânsito" && (
                          <DropdownMenuItem>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            <span>Marcar como Entregue</span>
                          </DropdownMenuItem>
                        )}
                        {(order.status === "Processando" ||
                          order.status === "Aguardando Pagamento") && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Ban className="mr-2 h-4 w-4" />
                              <span>Cancelar Pedido</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
