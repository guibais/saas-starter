import { getCustomerSession } from "@/lib/auth/server-session";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Define tipo Customer com isCustomer
export type CustomerWithAuth = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  address: string | null;
  phone: string | null;
  deliveryInstructions: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  isCustomer: boolean;
  // Outras propriedades específicas do cliente
  stripeCustomerId?: string | null;
};

// Função para obter o cliente autenticado
export async function getCustomerUser(): Promise<CustomerWithAuth | null> {
  try {
    console.log("[getCustomerUser] Verificando sessão de cliente");

    const customerSession = await getCustomerSession();

    if (!customerSession || !customerSession.user || !customerSession.user.id) {
      console.log("[getCustomerUser] Sessão de cliente não encontrada");
      return null;
    }

    const customerId = customerSession.user.id;
    console.log(
      `[getCustomerUser] Sessão de cliente encontrada para ID: ${customerId}`
    );

    // Buscar cliente no banco de dados
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    });

    if (!customer) {
      console.log(
        `[getCustomerUser] Cliente ID ${customerId} não encontrado no banco de dados`
      );
      return null;
    }

    console.log(
      `[getCustomerUser] Cliente encontrado: ${customer.name || customer.email}`
    );

    // Converter para o tipo CustomerWithAuth
    const customerWithAuth: CustomerWithAuth = {
      ...customer,
      role: "customer",
      isCustomer: true,
    };

    return customerWithAuth;
  } catch (error) {
    console.error("[getCustomerUser] Erro ao obter cliente:", error);
    return null;
  }
}
