import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-green-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Tudo Fresco</h3>
            <p className="text-green-50 mb-4">
              Frutas frescas e gourmet entregues diretamente na sua porta.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://facebook.com"
                className="hover:text-green-200"
              >
                <Facebook size={20} />
              </Link>
              <Link
                href="https://instagram.com"
                className="hover:text-green-200"
              >
                <Instagram size={20} />
              </Link>
              <Link href="https://twitter.com" className="hover:text-green-200">
                <Twitter size={20} />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4">Navegação</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-green-50 hover:text-white">
                  Início
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-green-50 hover:text-white"
                >
                  Frutas
                </Link>
              </li>
              <li>
                <Link href="/plans" className="text-green-50 hover:text-white">
                  Planos de Assinatura
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-green-50 hover:text-white">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-green-50 hover:text-white"
                >
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Planos</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/plans/basico"
                  className="text-green-50 hover:text-white"
                >
                  Plano Básico
                </Link>
              </li>
              <li>
                <Link
                  href="/plans/premium"
                  className="text-green-50 hover:text-white"
                >
                  Plano Premium
                </Link>
              </li>
              <li>
                <Link
                  href="/plans/familia"
                  className="text-green-50 hover:text-white"
                >
                  Plano Família
                </Link>
              </li>
              <li>
                <Link
                  href="/plans/exotico"
                  className="text-green-50 hover:text-white"
                >
                  Plano Exótico
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Contato</h4>
            <address className="not-italic text-green-50">
              <p className="mb-2">Rua das Frutas, 123</p>
              <p className="mb-2">São Paulo, SP</p>
              <p className="mb-2">CEP: 01234-567</p>
              <p className="mb-2">
                <a href="tel:+551199999999" className="hover:text-white">
                  (11) 9999-9999
                </a>
              </p>
              <p>
                <a
                  href="mailto:contato@tudofresco.com.br"
                  className="hover:text-white"
                >
                  contato@tudofresco.com.br
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="border-t border-green-800 mt-8 pt-8 text-center text-green-50">
          <p>
            &copy; {new Date().getFullYear()} Tudo Fresco. Todos os direitos
            reservados.
          </p>
          <div className="mt-2 space-x-4">
            <Link href="/terms" className="text-sm hover:text-white">
              Termos de Uso
            </Link>
            <Link href="/privacy" className="text-sm hover:text-white">
              Política de Privacidade
            </Link>
            <Link href="/faq" className="text-sm hover:text-white">
              Perguntas Frequentes
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
