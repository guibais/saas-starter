import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CircleIcon, Home, LogOut } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getUser } from "@/lib/db/queries";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <DashboardHeader user={user} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
