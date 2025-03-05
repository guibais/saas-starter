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
  ArrowUpDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// Interface para os itens de inventário
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  status: string;
}

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados de inventário da API
  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/inventory");
        if (!response.ok) {
          throw new Error("Falha ao carregar dados de inventário");
        }
        const data = await response.json();
        setInventory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        toast.error("Não foi possível carregar os dados de inventário");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, []);

  // Filter inventory based on search term and filter
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "normal")
      return matchesSearch && item.status === "Em Estoque";
    if (filter === "low")
      return matchesSearch && item.status === "Estoque Baixo";
    if (filter === "critical")
      return matchesSearch && item.status === "Estoque Crítico";

    return matchesSearch;
  });

  const handleAdjustment = (id: string, value: number) => {
    setAdjustments((prev) => {
      const currentAdjustment = prev[id] || 0;
      const newAdjustment = currentAdjustment + value;
      return { ...prev, [id]: newAdjustment };
    });
  };

  const getAdjustedStock = (item: InventoryItem) => {
    const adjustment = adjustments[item.id] || 0;
    return Math.max(0, item.currentStock + adjustment);
  };

  const getStockStatus = (item: InventoryItem) => {
    const adjustedStock = getAdjustedStock(item);
    if (adjustedStock <= 5) return "Estoque Crítico";
    if (adjustedStock <= 20) return "Estoque Baixo";
    return "Em Estoque";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em Estoque":
        return "bg-green-100 text-green-800";
      case "Estoque Baixo":
        return "bg-yellow-100 text-yellow-800";
      case "Estoque Crítico":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Em Estoque":
        return <CheckCircle2 className="mr-1 h-3 w-3" />;
      case "Estoque Baixo":
        return <TrendingUp className="mr-1 h-3 w-3" />;
      case "Estoque Crítico":
        return <AlertTriangle className="mr-1 h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleSaveAdjustments = async () => {
    setIsSubmitting(true);

    try {
      // Preparar os ajustes para enviar à API
      const adjustmentsArray = Object.entries(adjustments).map(
        ([id, quantity]) => ({
          id,
          quantity,
        })
      );

      // Enviar ajustes para a API
      const response = await fetch("/api/inventory", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adjustments: adjustmentsArray }),
      });

      if (!response.ok) {
        throw new Error("Falha ao atualizar estoque");
      }

      // Atualizar o inventário local com os novos valores
      setInventory((prevInventory) =>
        prevInventory.map((item) => {
          if (adjustments[item.id]) {
            const newStock = Math.max(
              0,
              item.currentStock + adjustments[item.id]
            );
            let newStatus = "Em Estoque";
            if (newStock <= 5) newStatus = "Estoque Crítico";
            else if (newStock <= 20) newStatus = "Estoque Baixo";

            return {
              ...item,
              currentStock: newStock,
              status: newStatus,
            };
          }
          return item;
        })
      );

      // Limpar ajustes
      setAdjustments({});
      toast.success("Estoque atualizado com sucesso");
    } catch (error) {
      toast.error("Erro ao atualizar estoque");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAdjustments = Object.keys(adjustments).length > 0;

  // Calculate inventory statistics
  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(
    (item) => item.status === "Estoque Baixo"
  ).length;
  const criticalStockItems = inventory.filter(
    (item) => item.status === "Estoque Crítico"
  ).length;

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando inventário...</p>
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
          Gerenciamento de Estoque
        </h1>
        {hasAdjustments && (
          <Button onClick={handleSaveAdjustments} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Ajustes
              </>
            )}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Produtos
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              {totalItems > 0
                ? Math.round((lowStockItems / totalItems) * 100)
                : 0}
              % do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estoque Crítico
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalStockItems}</div>
            <p className="text-xs text-muted-foreground">
              {totalItems > 0
                ? Math.round((criticalStockItems / totalItems) * 100)
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
            placeholder="Buscar produtos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Produtos</SelectItem>
            <SelectItem value="normal">Em Estoque</SelectItem>
            <SelectItem value="low">Estoque Baixo</SelectItem>
            <SelectItem value="critical">Estoque Crítico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Estoque Atual</TableHead>
              <TableHead>Estoque Mínimo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ajuste</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => {
                const adjustedStock = getAdjustedStock(item);
                const adjustedStatus = getStockStatus(item);

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <span
                        className={
                          adjustments[item.id]
                            ? "line-through text-gray-400"
                            : ""
                        }
                      >
                        {item.currentStock}
                      </span>
                      {adjustments[item.id] && (
                        <span className="ml-2 font-medium">
                          {adjustedStock}
                        </span>
                      )}{" "}
                      {item.unit}
                    </TableCell>
                    <TableCell>
                      {item.minStock} {item.unit}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                          adjustedStatus
                        )}`}
                      >
                        {getStatusIcon(adjustedStatus)}
                        {adjustedStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleAdjustment(item.id, -1)}
                          disabled={adjustedStock <= 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">
                          {adjustments[item.id] || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleAdjustment(item.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
