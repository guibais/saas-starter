import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { UserProvider } from "@/lib/auth";
import { getUser } from "@/lib/db/queries";
import { AuthProvider } from "@/lib/state/AuthProvider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Tudo Fresco - Frutas Gourmet",
  description:
    "Plataforma de assinatura de frutas gourmet e compras individuais.",
  keywords: [
    "Frutas",
    "Assinatura",
    "Hortifruti",
    "Gourmet",
    "Frutas Exóticas",
    "Delivery",
    "Frutas Frescas",
    "Tudo Fresco",
  ],
  authors: [
    {
      name: "Tudo Fresco",
      url: "https://tudofresco.com.br",
    },
  ],
  creator: "Tudo Fresco",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://tudofresco.com.br",
    title: "Tudo Fresco - Frutas Gourmet",
    description:
      "Plataforma de assinatura de frutas gourmet e compras individuais.",
    siteName: "Tudo Fresco",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tudo Fresco - Frutas Gourmet",
    description:
      "Plataforma de assinatura de frutas gourmet e compras individuais.",
    creator: "@tudofresco",
  },
};

export const viewport: Viewport = {
  maximumScale: 1,
};

const manrope = Manrope({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userPromise = getUser();

  return (
    <html
      lang="pt-BR"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
    >
      <body className="min-h-[100dvh] bg-gray-50">
        <UserProvider userPromise={userPromise}>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </UserProvider>
      </body>
    </html>
  );
}
