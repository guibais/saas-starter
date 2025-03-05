"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  PauseCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubscriptionItem {
  id: number;
  subscriptionId: number;
  productId: number;
  quantity: number;
  productName: string;
  productType: string;
  productPrice: string;
}

interface Subscription {
  id: number;
  userId: number;
  planId: number;
  status: string;
  startDate: string;
  nextDeliveryDate: string | null;
  createdAt: string;
}

interface User {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  deliveryInstructions: string | null;
}

interface Plan {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  price: string;
  imageUrl: string | null;
}

interface SubscriptionDetails {
  subscription: Subscription;
  customer: User;
  plan: Plan;
  items: SubscriptionItem[];
}

export default function SubscriptionDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const unwrappedParams = use(params as any) as { id: string };
  const id = unwrappedParams.id;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] =
    useState<SubscriptionDetails | null>(null);

  // Estados para o diálogo de agendamento
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [newDeliveryDate, setNewDeliveryDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para o diálogo de atualização de status
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");

  // Buscar detalhes da assinatura
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/subscriptions/${id}`);
        if (!response.ok) {
          throw new Error("Falha ao carregar detalhes da assinatura");
        }
        const data = await response.json();
        setSubscriptionDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        toast.error("Não foi possível carregar os detalhes da assinatura");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, [id]);

  // Formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não agendada";
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", {
      locale: ptBR,
    });
  };

  // Obter badge de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            Ativa
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <PauseCircle className="mr-1 h-3 w-3" />
            Pausada
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelada
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <AlertCircle className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        );
    }
  };

  // Agendar próxima entrega
  const scheduleNextDelivery = async () => {
    if (!newDeliveryDate) {
      toast.error("Selecione uma data para a próxima entrega");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nextDeliveryDate: newDeliveryDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao agendar próxima entrega");
      }

      // Atualizar os detalhes da assinatura
      if (subscriptionDetails) {
        setSubscriptionDetails({
          ...subscriptionDetails,
          subscription: {
            ...subscriptionDetails.subscription,
            nextDeliveryDate: newDeliveryDate,
          },
        });
      }

      toast.success("Próxima entrega agendada com sucesso");
      setIsScheduleDialogOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao agendar próxima entrega"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Atualizar status da assinatura
  const updateSubscriptionStatus = async () => {
    if (!newStatus) {
      toast.error("Selecione um status para a assinatura");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          statusReason: statusReason,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao atualizar status da assinatura");
      }

      // Atualizar os detalhes da assinatura
      if (subscriptionDetails) {
        setSubscriptionDetails({
          ...subscriptionDetails,
          subscription: {
            ...subscriptionDetails.subscription,
            status: newStatus,
          },
        });
      }

      toast.success("Status da assinatura atualizado com sucesso");
      setIsStatusDialogOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erro ao atualizar status da assinatura"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obter texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Ativa";
      case "paused":
        return "Pausada";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  // Obter texto do tipo de produto
  const getProductTypeText = (type: string) => {
    switch (type) {
      case "normal":
        return "Normal";
      case "exotic":
        return "Exótica";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Carregando detalhes da assinatura...</p>
      </div>
    );
  }

  if (error || !subscriptionDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
        <p className="text-red-500">
          {error || "Não foi possível carregar os detalhes da assinatura"}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard/admin/subscriptions")}
        >
          Voltar para Assinaturas
        </Button>
      </div>
    );
  }

  const { subscription, customer, plan, items } = subscriptionDetails;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/admin/subscriptions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Detalhes da Assinatura #{subscription.id}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsScheduleDialogOpen(true)}
            disabled={subscription.status !== "active"}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Agendar Entrega
          </Button>
          <Button
            variant={
              subscription.status === "active"
                ? "destructive"
                : subscription.status === "paused"
                ? "default"
                : "outline"
            }
            onClick={() => {
              setNewStatus(
                subscription.status === "active"
                  ? "paused"
                  : subscription.status === "paused"
                  ? "active"
                  : ""
              );
              setIsStatusDialogOpen(true);
            }}
            disabled={subscription.status === "cancelled"}
          >
            {subscription.status === "active" ? (
              <>
                <PauseCircle className="mr-2 h-4 w-4" />
                Pausar Assinatura
              </>
            ) : subscription.status === "paused" ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Reativar Assinatura
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Gerenciar Status
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações da Assinatura</CardTitle>
            <CardDescription>
              Detalhes do plano e status da assinatura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-bold">
                  R$ {parseFloat(plan.price).toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">por mês</span>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Status
                </h4>
                <div>{getStatusBadge(subscription.status)}</div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Data de Início
                </h4>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  {formatDate(subscription.startDate)}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Próxima Entrega
                </h4>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  {formatDate(subscription.nextDeliveryDate)}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Data de Criação
                </h4>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  {formatDate(subscription.createdAt)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
            <CardDescription>Detalhes do assinante</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">
                  {customer?.name || "Sem nome"}
                </span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{customer?.email || "Sem e-mail"}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{customer?.phone || "Sem telefone"}</span>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Endereço de Entrega</h4>
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                <span>{customer?.address || "Sem endereço cadastrado"}</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">
                Instruções de Entrega
              </h4>
              <p className="text-sm text-muted-foreground">
                {customer?.deliveryInstructions || "Sem instruções específicas"}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/dashboard/admin/users/${customer?.id}`}>
                Ver Perfil Completo
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens da Assinatura</CardTitle>
          <CardDescription>Produtos incluídos nesta assinatura</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-2 font-medium">Nenhum item na assinatura</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Esta assinatura não possui itens configurados.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Preço Unitário</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.productName}
                    </TableCell>
                    <TableCell>
                      {getProductTypeText(item.productType)}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      R$ {parseFloat(item.productPrice).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      R${" "}
                      {(parseFloat(item.productPrice) * item.quantity).toFixed(
                        2
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para agendar próxima entrega */}
      <Dialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Próxima Entrega</DialogTitle>
            <DialogDescription>
              Selecione a data para a próxima entrega desta assinatura.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delivery-date">Data de Entrega</Label>
              <Input
                id="delivery-date"
                type="date"
                value={newDeliveryDate}
                onChange={(e) => setNewDeliveryDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsScheduleDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={scheduleNextDelivery} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agendando...
                </>
              ) : (
                "Agendar Entrega"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para atualizar status */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status da Assinatura</DialogTitle>
            <DialogDescription>
              Altere o status desta assinatura.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Novo Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">Selecione um status</option>
                <option value="active">Ativa</option>
                <option value="paused">Pausada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Alteração (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Informe o motivo da alteração de status"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={updateSubscriptionStatus}
              disabled={isSubmitting || !newStatus}
              variant={newStatus === "cancelled" ? "destructive" : "default"}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                `Confirmar ${
                  newStatus ? getStatusText(newStatus).toLowerCase() : ""
                }`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
