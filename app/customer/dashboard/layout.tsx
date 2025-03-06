import { SiteFooter } from "@/components/site-footer";
import { redirect } from "next/navigation";
import { getCustomerUser } from "@/lib/customer/utils";
import { CustomerHeader } from "@/components/dashboard/customer-header";

// Layout customer deve ser dinâmico para evitar erros de autenticação
export const dynamic = "force-dynamic";

export default async function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log(
    "[CustomerDashboardLayout] Iniciando verificação de autenticação"
  );

  // Verificar autenticação do cliente usando a função específica para clientes
  const user = await getCustomerUser();

  // Verificar se o usuário é um cliente
  if (!user) {
    console.log(
      "[CustomerDashboardLayout] Usuário não autenticado como cliente"
    );
    redirect("/customer/login");
  }

  console.log(
    `[CustomerDashboardLayout] Usuário cliente ${user.id} autenticado com sucesso`
  );

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <CustomerHeader user={user} />
      <div className="flex-1 container mx-auto px-4 py-8">{children}</div>
      <SiteFooter />
    </div>
  );
}
