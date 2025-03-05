import { cookies } from "next/headers";
import { cache } from "react";

// Function to get the customer user
export const getCustomerUser = cache(async () => {
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
});
