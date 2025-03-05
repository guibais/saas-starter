import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { comparePasswords, signToken } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find customer by email
    const customer = await db.query.customers.findFirst({
      where: eq(customers.email, email),
    });

    if (!customer) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await comparePasswords(
      password,
      customer.passwordHash
    );

    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create session
    const expires = new Date(Date.now() + 86400 * 1000); // 1 day
    const session = {
      user: {
        id: customer.id,
        role: "customer", // Specific role for customers
      },
      expires: expires.toISOString(),
      isCustomer: true, // Flag to identify customer sessions
    };

    const token = await signToken(session);

    // Create response with customer data
    const response = NextResponse.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
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
    console.error("Error in customer login:", error);
    return NextResponse.json(
      { message: "Error processing login" },
      { status: 500 }
    );
  }
}
