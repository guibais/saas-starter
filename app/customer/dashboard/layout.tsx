import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { redirect } from "next/navigation";
import { getCustomerUser } from "@/lib/customer/utils";

export default async function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCustomerUser();

  // Redirect to login if user is not authenticated
  if (!user) {
    redirect("/customer/login");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader />
      <div className="flex-1 container mx-auto px-4 py-8">{children}</div>
      <SiteFooter />
    </div>
  );
}
