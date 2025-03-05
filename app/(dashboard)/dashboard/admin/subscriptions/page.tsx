"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Calendar,
  User,
  Package,
  Clock,
  MoreHorizontal,
  Truck,
  PauseCircle,
  PlayCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Subscription {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  planName: string | null;
  status: string;
  startDate: string;
  nextDeliveryDate: string | null;
  price: number | null;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para o diálogo de agendamento
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [newDeliveryDate, setNewDeliveryDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar assinaturas da API
  useEffect(() => {
    const fetchSubscriptions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Buscando assinaturas...");
        const response = await fetch("/api/subscriptions");

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Erro na resposta da API:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
          throw new Error(
            `Falha ao carregar assinaturas: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log(`Recebidas ${data.length} assinaturas`);
        setSubscriptions(data);
      } catch (err) {
        console.error("Erro na requisição:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        toast.error("Não foi possível carregar as assinaturas");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  // Filtrar assinaturas baseado na busca e filtro de status
  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const matchesSearch =
      (subscription.userName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (subscription.userEmail?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (subscription.planName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      );

    const matchesStatus = !statusFilter || subscription.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Estatísticas
  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status === "active"
  ).length;
  const pausedSubscriptions = subscriptions.filter(
    (sub) => sub.status === "paused"
  ).length;
  const cancelledSubscriptions = subscriptions.filter(
    (sub) => sub.status === "cancelled"
  ).length;

  // Formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Obter badge de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Ativa</Badge>;
      case "paused":
        return <Badge variant="outline">Pausada</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Abrir diálogo de agendamento
  const openScheduleDialog = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setNewDeliveryDate(
      subscription.nextDeliveryDate
        ? new Date(subscription.nextDeliveryDate).toISOString().split("T")[0]
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
    );
    setIsScheduleDialogOpen(true);
  };

  // Atualizar status da assinatura
  const updateSubscriptionStatus = async (id: number, status: string) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Falha ao atualizar status da assinatura");
      }

      // Atualizar lista local
      setSubscriptions((prev) =>
        prev.map((sub) => (sub.id === id ? { ...sub, status } : sub))
      );

      toast.success(`Assinatura ${getStatusText(status)}`);
    } catch (err) {
      toast.error("Erro ao atualizar status da assinatura");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Agendar próxima entrega
  const scheduleNextDelivery = async () => {
    if (!selectedSubscription || !newDeliveryDate) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedSubscription.id,
          status: selectedSubscription.status,
          nextDeliveryDate: newDeliveryDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao agendar próxima entrega");
      }

      // Atualizar lista local
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === selectedSubscription.id
            ? { ...sub, nextDeliveryDate: newDeliveryDate }
            : sub
        )
      );

      toast.success("Próxima entrega agendada com sucesso");
      setIsScheduleDialogOpen(false);
    } catch (err) {
      toast.error("Erro ao agendar próxima entrega");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obter texto do status para mensagens
  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "ativada com sucesso";
      case "paused":
        return "pausada com sucesso";
      case "cancelled":
        return "cancelada com sucesso";
      default:
        return `alterada para ${status}`;
    }
  };

  // Navegar para detalhes da assinatura
  const viewSubscriptionDetails = (id: number) => {
    router.push(`/dashboard/admin/subscriptions/${id}`);
  };

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando assinaturas...</p>
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Gerenciamento de Assinaturas
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Assinaturas
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <PlayCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {totalSubscriptions > 0
                ? Math.round((activeSubscriptions / totalSubscriptions) * 100)
                : 0}
              % do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pausadas</CardTitle>
            <PauseCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pausedSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {totalSubscriptions > 0
                ? Math.round((pausedSubscriptions / totalSubscriptions) * 100)
                : 0}
              % do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cancelledSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {totalSubscriptions > 0
                ? Math.round(
                    (cancelledSubscriptions / totalSubscriptions) * 100
                  )
                : 0}
              % do total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar assinaturas..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter || "all"}
          onValueChange={(value) =>
            setStatusFilter(value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="paused">Pausadas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Próxima Entrega</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Nenhuma assinatura encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div className="font-medium">
                      {subscription.userName || "N/A"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {subscription.userEmail}
                    </div>
                  </TableCell>
                  <TableCell>{subscription.planName || "N/A"}</TableCell>
                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                  <TableCell>{formatDate(subscription.startDate)}</TableCell>
                  <TableCell>
                    {subscription.status === "active"
                      ? formatDate(subscription.nextDeliveryDate)
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {subscription.price
                      ? subscription.price.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                      : "N/A"}
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
                        <DropdownMenuItem
                          onClick={() =>
                            viewSubscriptionDetails(subscription.id)
                          }
                        >
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {subscription.status === "active" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => openScheduleDialog(subscription)}
                            >
                              Agendar próxima entrega
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateSubscriptionStatus(
                                  subscription.id,
                                  "paused"
                                )
                              }
                            >
                              Pausar assinatura
                            </DropdownMenuItem>
                          </>
                        )}
                        {subscription.status === "paused" && (
                          <DropdownMenuItem
                            onClick={() =>
                              updateSubscriptionStatus(
                                subscription.id,
                                "active"
                              )
                            }
                          >
                            Reativar assinatura
                          </DropdownMenuItem>
                        )}
                        {subscription.status !== "cancelled" && (
                          <DropdownMenuItem
                            onClick={() =>
                              updateSubscriptionStatus(
                                subscription.id,
                                "cancelled"
                              )
                            }
                            className="text-red-600"
                          >
                            Cancelar assinatura
                          </DropdownMenuItem>
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

      {/* Diálogo de agendamento de entrega */}
      <Dialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agendar Próxima Entrega</DialogTitle>
            <DialogDescription>
              Defina a data da próxima entrega para esta assinatura.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="delivery-date" className="text-right">
                Data
              </label>
              <Input
                id="delivery-date"
                type="date"
                value={newDeliveryDate}
                onChange={(e) => setNewDeliveryDate(e.target.value)}
                className="col-span-3"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsScheduleDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={scheduleNextDelivery} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
