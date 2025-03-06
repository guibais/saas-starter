import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/session";

export async function GET() {
  try {
    // Verificar se o cookie de sessão do cliente existe
    const cookieStore = await cookies();
    const customerSession = cookieStore.get("customer_session");

    if (!customerSession?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    try {
      // Decodificar o token e obter os dados do usuário
      const session = await verifyToken(customerSession.value);

      if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
      }

      // Buscar dados do cliente
      const customer = await db.query.customers.findFirst({
        where: eq(customers.id, session.user.id),
      });

      if (!customer) {
        return NextResponse.json(
          { error: "Cliente não encontrado" },
          { status: 404 }
        );
      }

      // Retornar os dados do usuário
      return NextResponse.json({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        deliveryInstructions: customer.deliveryInstructions,
      });
    } catch (error) {
      console.error("Erro ao verificar token:", error);
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }
  } catch (error) {
    console.error("Erro ao buscar dados do cliente:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do cliente" },
      { status: 500 }
    );
  }
}
