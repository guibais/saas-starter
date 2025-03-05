import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    // Get the customer session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("customer_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Verify the token
    const session = await verifyToken(sessionCookie.value);

    if (!session || !session.isCustomer) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get customer data
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, session.user.id),
      columns: {
        id: true,
        name: true,
        email: true,
        address: true,
        phone: true,
        deliveryInstructions: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...customer,
      isCustomer: true,
    });
  } catch (error) {
    console.error("Error getting customer:", error);
    return NextResponse.json(
      { message: "Error retrieving customer data" },
      { status: 500 }
    );
  }
}
