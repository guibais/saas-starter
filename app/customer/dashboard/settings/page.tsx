import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { cookies } from "next/headers";

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

export default async function SettingsPage() {
  const user = await getCustomerUser();

  if (!user) {
    redirect("/customer/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <Link href="/customer/dashboard">
          <Button variant="outline">Voltar ao Dashboard</Button>
        </Link>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais aqui.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" defaultValue={user.name || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={user.email} disabled />
                  <p className="text-xs text-gray-500">
                    O email não pode ser alterado.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço de Entrega</Label>
                <Input
                  id="address"
                  defaultValue={
                    user.address || "Rua das Frutas, 123, São Paulo, SP"
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    defaultValue={user.phone || "(11) 99999-9999"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthdate">Data de Nascimento</Label>
                  <Input id="birthdate" type="date" defaultValue="1990-01-01" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Salvar Alterações</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Escolha como deseja receber nossas notificações.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações por Email</p>
                  <p className="text-sm text-gray-500">
                    Receba atualizações sobre sua assinatura por email.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações de Entrega</p>
                  <p className="text-sm text-gray-500">
                    Receba alertas sobre o status da sua entrega.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ofertas e Promoções</p>
                  <p className="text-sm text-gray-500">
                    Receba ofertas especiais e promoções exclusivas.
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Newsletter</p>
                  <p className="text-sm text-gray-500">
                    Receba nossa newsletter mensal com dicas e novidades.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Salvar Preferências</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>
                Gerencie a segurança da sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <Input id="current-password" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input id="new-password" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input id="confirm-password" type="password" />
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-4">
                  Sessões Ativas
                </p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Este dispositivo</p>
                      <p className="text-xs text-gray-500">
                        São Paulo, Brasil • Último acesso: Agora
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Encerrar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="destructive">Excluir Conta</Button>
              <Button>Alterar Senha</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
