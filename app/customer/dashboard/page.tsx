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
} from "lucide-react";
import { getCustomerUser } from "@/lib/customer/utils";

export default async function CustomerDashboardPage() {
  const user = await getCustomerUser();

  if (!user) {
    redirect("/customer/login");
  }

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
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span>Ativa</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Próxima entrega: 15/03/2024
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Plano Atual</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">Plano Premium</p>
                  <p className="text-sm text-gray-500 mt-2">R$ 99,90/mês</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/plans">Alterar Plano</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Últimas Entregas</h3>
              <div className="border rounded-md divide-y">
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">Entrega #1234</p>
                    <p className="text-sm text-gray-500">01/03/2024</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Entregue
                  </span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">Entrega #1233</p>
                    <p className="text-sm text-gray-500">15/02/2024</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Entregue
                  </span>
                </div>
              </div>
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
