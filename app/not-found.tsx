import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <Image
        src="/images/logo.jpeg"
        alt="Tudo Fresco Logo"
        width={48}
        height={48}
        className="size-12"
      />
      <h1 className="mt-6 text-3xl font-bold text-gray-900">
        Página não encontrada
      </h1>
      <p className="mt-3 text-gray-600 text-center max-w-md">
        Desculpe, não encontramos a página que você está procurando.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-700 text-white hover:bg-green-800 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Voltar para a página inicial
      </Link>
    </div>
  );
}
