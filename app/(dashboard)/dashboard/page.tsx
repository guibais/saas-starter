import { redirect } from "next/navigation";
import { getUser } from "@/lib/db/queries";

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Redirect based on user role
  if (user.role === "admin") {
    redirect("/dashboard/admin");
  } else {
    // For regular users, redirect to the general settings page
    redirect("/dashboard/general");
  }
}
