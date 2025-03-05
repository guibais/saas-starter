import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, Download } from "lucide-react";
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

export default async function BillingPage() {
  const user = await getCustomerUser();

  if (!user) {
    redirect("/customer/login");
  }

  // Mock payment history data - in a real app, this would come from your database
  const payments = [
    {
      id: "pay_123456",
      date: "15/02/2024",
      amount: "R$ 99,90",
      status: "paid",
      method: "Cartão de Crédito",
      last4: "4242",
    },
    {
      id: "pay_123455",
      date: "15/01/2024",
      amount: "R$ 99,90",
      status: "paid",
      method: "Cartão de Crédito",
      last4: "4242",
    },
    {
      id: "pay_123454",
      date: "15/12/2023",
      amount: "R$ 99,90",
      status: "paid",
      method: "Cartão de Crédito",
      last4: "4242",
    },
    {
      id: "pay_123453",
      date: "15/11/2023",
      amount: "R$ 99,90",
      status: "paid",
      method: "Cartão de Crédito",
      last4: "4242",
    },
  ];

  // Mock payment method data
  const paymentMethod = {
    type: "credit_card",
    brand: "Visa",
    last4: "4242",
    expMonth: "12",
    expYear: "2025",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pagamentos</h1>
        <Link href="/customer/dashboard">
          <Button variant="outline">Voltar ao Dashboard</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.id}
                      </TableCell>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell>{payment.amount}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === "paid"
                              ? "default"
                              : "destructive"
                          }
                          className={
                            payment.status === "paid" ? "bg-green-500" : ""
                          }
                        >
                          {payment.status === "paid" ? "Pago" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.method} **** {payment.last4}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Recibo
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Método de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="h-8 w-8 text-gray-500" />
                <div>
                  <p className="font-medium">
                    {paymentMethod.brand} **** {paymentMethod.last4}
                  </p>
                  <p className="text-sm text-gray-500">
                    Expira em {paymentMethod.expMonth}/{paymentMethod.expYear}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Atualizar Método de Pagamento
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Próxima Cobrança</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">R$ 99,90</p>
              <p className="text-sm text-gray-500 mt-1">15/03/2024</p>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Sua assinatura será renovada automaticamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
