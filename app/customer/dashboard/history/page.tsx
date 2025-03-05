import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export default async function HistoryPage() {
  const user = await getCustomerUser();

  if (!user) {
    redirect("/customer/login");
  }

  // Mock delivery history data - in a real app, this would come from your database
  const deliveries = [
    {
      id: "del_123456",
      date: "01/03/2024",
      status: "delivered",
      items: [
        { name: "Maçã Fuji", quantity: 5 },
        { name: "Banana Prata", quantity: 8 },
        { name: "Uva Thompson", quantity: 500, unit: "g" },
        { name: "Manga Palmer", quantity: 2 },
        { name: "Abacaxi Pérola", quantity: 1 },
      ],
      trackingCode: "BR123456789",
    },
    {
      id: "del_123455",
      date: "15/02/2024",
      status: "delivered",
      items: [
        { name: "Maçã Fuji", quantity: 5 },
        { name: "Banana Prata", quantity: 8 },
        { name: "Uva Thompson", quantity: 500, unit: "g" },
        { name: "Manga Palmer", quantity: 2 },
        { name: "Abacaxi Pérola", quantity: 1 },
      ],
      trackingCode: "BR123456788",
    },
    {
      id: "del_123454",
      date: "01/02/2024",
      status: "delivered",
      items: [
        { name: "Maçã Fuji", quantity: 5 },
        { name: "Banana Prata", quantity: 8 },
        { name: "Uva Thompson", quantity: 500, unit: "g" },
        { name: "Manga Palmer", quantity: 2 },
        { name: "Abacaxi Pérola", quantity: 1 },
      ],
      trackingCode: "BR123456787",
    },
    {
      id: "del_123453",
      date: "15/01/2024",
      status: "delivered",
      items: [
        { name: "Maçã Fuji", quantity: 5 },
        { name: "Banana Prata", quantity: 8 },
        { name: "Uva Thompson", quantity: 500, unit: "g" },
        { name: "Manga Palmer", quantity: 2 },
        { name: "Abacaxi Pérola", quantity: 1 },
      ],
      trackingCode: "BR123456786",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Histórico de Entregas</h1>
        <Link href="/customer/dashboard">
          <Button variant="outline">Voltar ao Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suas Entregas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Código de Rastreio</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">{delivery.id}</TableCell>
                  <TableCell>{delivery.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        delivery.status === "delivered"
                          ? "default"
                          : "destructive"
                      }
                      className={
                        delivery.status === "delivered" ? "bg-green-500" : ""
                      }
                    >
                      {delivery.status === "delivered"
                        ? "Entregue"
                        : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>{delivery.trackingCode}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/customer/dashboard/history/${delivery.id}`}>
                        Detalhes
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximas Entregas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">
              Sua próxima entrega está agendada para 15/03/2024.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/customer/dashboard/subscription">
                Ver Detalhes da Assinatura
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
