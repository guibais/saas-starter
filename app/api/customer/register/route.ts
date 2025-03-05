import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, signToken } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const customerData = await request.json();
    const { email, password, name, address, phone, deliveryInstructions } =
      customerData;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if email is already in use
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.email, email),
    });

    if (existingCustomer) {
      return NextResponse.json(
        { message: "Email is already in use" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create new customer
    const [newCustomer] = await db
      .insert(customers)
      .values({
        email,
        passwordHash,
        name,
        address,
        phone,
        deliveryInstructions,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: customers.id,
        email: customers.email,
        name: customers.name,
      });

    if (!newCustomer) {
      throw new Error("Failed to create customer");
    }

    // Create session
    const expires = new Date(Date.now() + 86400 * 1000); // 1 day
    const session = {
      user: {
        id: newCustomer.id,
        role: "customer",
      },
      expires: expires.toISOString(),
      isCustomer: true,
    };

    const token = await signToken(session);

    // Create response with customer data
    const response = NextResponse.json({
      id: newCustomer.id,
      name: newCustomer.name,
      email: newCustomer.email,
      isCustomer: true,
    });

    // Set session cookie
    response.cookies.set({
      name: "customer_session",
      value: token,
      httpOnly: true,
      expires,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error in customer registration:", error);
    return NextResponse.json(
      { message: "Error processing registration" },
      { status: 500 }
    );
  }
}
