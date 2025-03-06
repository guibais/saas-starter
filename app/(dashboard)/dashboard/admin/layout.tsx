import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server-session";

// Layout admin deve ser dinâmico para evitar erros de autenticação
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("[AdminLayout] Iniciando verificação de autenticação");

  // Verificar autenticação diretamente no layout, passando o parâmetro isAdminRoute=true
  const user = await getServerUser(true);

  console.log(
    "[AdminLayout] Resultado da verificação:",
    user
      ? `Usuário ID: ${user.id}, Role: ${user.role}`
      : "Usuário não encontrado"
  );

  // Redirecionar se não for admin ou não estiver autenticado
  if (!user || user.role !== "admin") {
    console.error("[AdminLayout] Usuário não autenticado ou não é admin");
    redirect("/sign-in");
  }

  console.log("[AdminLayout] Autenticação bem-sucedida, renderizando layout");

  return (
    <div className="w-full">
      {/* Main content */}
      <div className="w-full">
        {/* Breadcrumb removido para evitar duplicidade */}
        {children}
      </div>
    </div>
  );
}
