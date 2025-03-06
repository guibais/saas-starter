import "./globals.css";
import { Inter } from "next/font/google";
import { UserProvider } from "@/lib/auth";
import { getServerUser } from "@/lib/auth/server-session";
import { AuthProvider } from "@/lib/state/AuthProvider";
import { Toaster } from "@/components/ui/toaster";
import { constructMetadata } from "./metadata";
import { SkipToContent } from "@/components/skip-to-content";

const inter = Inter({ subsets: ["latin"] });

export const metadata = constructMetadata();

export const dynamic = "force-dynamic";

export const viewport = {
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userPromise = getServerUser().then((user) => user || null);

  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.className}>
      <body className="min-h-[100dvh] bg-gray-50">
        <SkipToContent />
        <UserProvider userPromise={userPromise}>
          <AuthProvider>
            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
            <Toaster />
          </AuthProvider>
        </UserProvider>
      </body>
    </html>
  );
}
