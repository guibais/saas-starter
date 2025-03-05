import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db/drizzle";
import { userSubscriptions, subscriptionPlans } from "@/lib/db/schema";
import { getCustomerSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CancelSubscriptionPage() {
  const session = await getCustomerSession();

  if (!session) {
    redirect("/login");
  }

  const customerId = session.user.id;

  // Buscar a assinatura do cliente
  const subscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.customerId, customerId),
    with: {
      plan: true,
    },
  });

  if (!subscription) {
    redirect("/customer/dashboard/subscription");
  }

  return (
    <div className="container max-w-3xl py-10">
      <Link
        href="/customer/dashboard/subscription"
        className="flex items-center text-sm text-gray-500 mb-6 hover:text-gray-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para detalhes da assinatura
      </Link>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Cancelar Assinatura</CardTitle>
          <CardDescription>
            Tem certeza que deseja cancelar sua assinatura?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-md border border-amber-200 flex">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Atenção:</p>
              <p className="text-sm text-amber-700">
                Ao cancelar sua assinatura:
              </p>
              <ul className="list-disc list-inside text-sm text-amber-700 mt-2">
                <li>
                  Você perderá acesso aos benefícios do plano{" "}
                  {subscription.plan.name}
                </li>
                <li>O cancelamento é imediato e não pode ser desfeito</li>
                <li>Você pode se inscrever novamente a qualquer momento</li>
              </ul>
            </div>
          </div>

          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium mb-2">
              Detalhes da assinatura:
            </h3>
            <p className="text-sm text-gray-500">
              Plano: {subscription.plan.name}
            </p>
            <p className="text-sm text-gray-500">
              Status atual:{" "}
              {subscription.status === "active"
                ? "Ativa"
                : subscription.status === "paused"
                ? "Pausada"
                : subscription.status}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/customer/dashboard/subscription">Voltar</Link>
          </Button>
          <Button variant="destructive" asChild>
            <Link href={`/api/subscriptions/${subscription.id}/cancel`}>
              Confirmar Cancelamento
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
