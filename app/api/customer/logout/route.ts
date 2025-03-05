import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });

    // Delete the customer session cookie
    response.cookies.set({
      name: "customer_session",
      value: "",
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error in customer logout:", error);
    return NextResponse.json(
      { message: "Error processing logout" },
      { status: 500 }
    );
  }
}
