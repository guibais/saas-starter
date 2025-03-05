"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ShoppingBag,
  Users,
  Layers,
  ShoppingCart,
  BarChart3,
  ArrowRight,
  TrendingUp,
  DollarSign,
  UserPlus,
  Package,
  Loader2,
  CalendarIcon,
  Calendar as CalendarIcon2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format, sub, startOfMonth, endOfMonth, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface Stat {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon?: React.ReactNode;
}

interface AdminSection {
  title: string;
  description: string;
  href: string;
  count: string;
  icon?: React.ReactNode;
}

interface DashboardData {
  stats: Stat[];
  adminSections: AdminSection[];
}

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [dateFilter, setDateFilter] = useState<string>("7");
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Ícones para cada estatística
  const statIcons = {
    "Vendas no Período": <DollarSign className="h-5 w-5 text-emerald-600" />,
    "Novos Usuários": <UserPlus className="h-5 w-5 text-blue-600" />,
    "Pedidos Pendentes": <ShoppingCart className="h-5 w-5 text-orange-600" />,
    "Produtos Baixo Estoque": <Package className="h-5 w-5 text-red-600" />,
  };

  // Ícones para cada seção administrativa
  const sectionIcons = {
    Produtos: <ShoppingBag className="h-8 w-8 text-primary" />,
    "Planos de Assinatura": <CalendarIcon2 className="h-8 w-8 text-primary" />,
    Estoque: <Layers className="h-8 w-8 text-primary" />,
    Pedidos: <ShoppingCart className="h-8 w-8 text-primary" />,
    Usuários: <Users className="h-8 w-8 text-primary" />,
    Assinaturas: <BarChart3 className="h-8 w-8 text-primary" />,
  };

  // Função para obter datas com base no filtro selecionado
  const getDateRangeFromFilter = (): { startDate: string; endDate: string } => {
    const today = new Date();
    let startDate: Date;
    let endDate = today;

    switch (dateFilter) {
      case "7":
        startDate = sub(today, { days: 7 });
        break;
      case "30":
        startDate = sub(today, { days: 30 });
        break;
      case "thisMonth":
        startDate = startOfMonth(today);
        break;
      case "lastMonth":
        startDate = startOfMonth(sub(today, { months: 1 }));
        endDate = endOfMonth(sub(today, { months: 1 }));
        break;
      case "jan2024":
        startDate = new Date(2024, 0, 1); // Janeiro = 0
        endDate = new Date(2024, 0, 31);
        break;
      case "feb2024":
        startDate = new Date(2024, 1, 1); // Fevereiro = 1
        endDate = new Date(2024, 1, 29); // 2024 é ano bissexto
        break;
      case "mar2024":
        startDate = new Date(2024, 2, 1); // Março = 2
        endDate = new Date(2024, 2, 31);
        break;
      case "custom":
        if (customDateRange.from && customDateRange.to) {
          startDate = customDateRange.from;
          endDate = customDateRange.to;
        } else {
          startDate = sub(today, { days: 7 });
        }
        break;
      default:
        startDate = sub(today, { days: 7 });
    }

    return {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    };
  };

  // Carregar dados do dashboard com base no filtro de data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);

      try {
        const { startDate, endDate } = getDateRangeFromFilter();
        const queryParams = new URLSearchParams({
          startDate,
          endDate,
        }).toString();

        const response = await fetch(`/api/admin/stats?${queryParams}`);

        if (!response.ok) {
          throw new Error("Falha ao carregar estatísticas");
        }

        const data = await response.json();

        // Adicionar ícones às estatísticas e seções
        const statsWithIcons = data.stats.map((stat: Stat) => ({
          ...stat,
          icon: statIcons[stat.title as keyof typeof statIcons],
        }));

        const sectionsWithIcons = data.adminSections.map(
          (section: AdminSection) => ({
            ...section,
            icon: sectionIcons[section.title as keyof typeof sectionIcons],
          })
        );

        setDashboardData({
          stats: statsWithIcons,
          adminSections: sectionsWithIcons,
        });
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
        toast.error("Não foi possível carregar os dados do dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateFilter, customDateRange]);

  // Handler para mudanças no seletor de data
  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    if (value !== "custom") {
      setCalendarOpen(false);
    }
  };

  // Handler para mudanças no calendário
  const handleCalendarChange = (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => {
    setCustomDateRange(range);
    if (range.from && range.to) {
      setCalendarOpen(false);
    }
  };

  // Renderizar período selecionado
  const renderSelectedPeriod = () => {
    // Para filtro personalizado
    if (dateFilter === "custom" && customDateRange.from && customDateRange.to) {
      return `${format(customDateRange.from, "dd/MM/yyyy")} até ${format(
        customDateRange.to,
        "dd/MM/yyyy"
      )}`;
    }

    // Para outros filtros pré-definidos
    switch (dateFilter) {
      case "7":
        return "Últimos 7 dias";
      case "30":
        return "Últimos 30 dias";
      case "thisMonth":
        return `Este mês (${format(new Date(), "MMMM", { locale: ptBR })})`;
      case "lastMonth":
        return `Mês passado (${format(sub(new Date(), { months: 1 }), "MMMM", {
          locale: ptBR,
        })})`;
      case "jan2024":
        return "Janeiro de 2024";
      case "feb2024":
        return "Fevereiro de 2024";
      case "mar2024":
        return "Março de 2024";
      default:
        return "Período selecionado";
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Visão geral da plataforma Tudo Fresco
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <Select value={dateFilter} onValueChange={handleDateFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione um período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="thisMonth">Este mês</SelectItem>
              <SelectItem value="lastMonth">Mês passado</SelectItem>
              <SelectItem value="jan2024">Janeiro de 2024</SelectItem>
              <SelectItem value="feb2024">Fevereiro de 2024</SelectItem>
              <SelectItem value="mar2024">Março de 2024</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {dateFilter === "custom" && (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange.from && customDateRange.to
                    ? `${format(customDateRange.from, "dd/MM/yyyy")} - ${format(
                        customDateRange.to,
                        "dd/MM/yyyy"
                      )}`
                    : "Selecionar datas"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={customDateRange.from}
                  selected={customDateRange}
                  onSelect={(range) =>
                    handleCalendarChange(
                      range as { from: Date | undefined; to: Date | undefined }
                    )
                  }
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="bg-muted/40 p-4 rounded-lg">
        <p className="text-sm font-medium">
          Estatísticas para:{" "}
          <span className="font-bold">{renderSelectedPeriod()}</span>
        </p>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          // Esqueletos para carregamento
          Array(4)
            .fill(0)
            .map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </CardContent>
              </Card>
            ))
        ) : dashboardData?.stats.length ? (
          // Dados reais
          dashboardData.stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p
                  className={`text-xs ${
                    stat.trend === "up" ? "text-emerald-600" : "text-red-600"
                  } flex items-center mt-1`}
                >
                  {stat.change}
                  <TrendingUp
                    className={`h-3 w-3 ml-1 ${
                      stat.trend === "up" ? "" : "rotate-180"
                    }`}
                  />
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          // Sem dados
          <div className="col-span-4 text-center py-4">
            <p className="text-muted-foreground">
              Nenhum dado disponível para o período selecionado
            </p>
          </div>
        )}
      </div>

      {/* Seções principais */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Gerenciamento</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            // Esqueletos para carregamento
            Array(6)
              .fill(0)
              .map((_, index) => (
                <Card key={index} className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-4" />
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-between items-center">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </CardFooter>
                </Card>
              ))
          ) : dashboardData?.adminSections.length ? (
            // Dados reais
            dashboardData.adminSections.map((section) => (
              <Link href={section.href} key={section.title}>
                <Card className="h-full transition-all hover:bg-muted/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-medium">
                      {section.title}
                    </CardTitle>
                    {section.icon}
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {section.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {section.count}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardFooter>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-3 text-center py-4">
              <p className="text-muted-foreground">Nenhuma seção disponível</p>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando dados...</span>
        </div>
      )}
    </div>
  );
}
