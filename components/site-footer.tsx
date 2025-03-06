import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Twitter,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteFooter() {
  return (
    <footer
      className="bg-green-900 text-white pt-16 pb-8"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <Image
                src="/images/logo.jpeg"
                alt="Tudo Fresco Logo"
                width={50}
                height={50}
                className="h-12 w-12 rounded-full"
              />
              <span className="text-xl font-bold text-white">Tudo Fresco</span>
            </Link>
            <p className="text-green-50 mb-6 max-w-md">
              Frutas frescas e selecionadas, entregues diretamente na sua porta.
              Experimente o sabor autêntico da natureza com nossa assinatura de
              frutas premium.
            </p>
            <div className="flex space-x-4 mb-8">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="bg-green-800 hover:bg-green-700 p-2 rounded-full transition-colors"
              >
                <Facebook size={20} aria-hidden="true" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="bg-green-800 hover:bg-green-700 p-2 rounded-full transition-colors"
              >
                <Instagram size={20} aria-hidden="true" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="bg-green-800 hover:bg-green-700 p-2 rounded-full transition-colors"
              >
                <Twitter size={20} aria-hidden="true" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-green-800 pb-2">
              Navegação
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-green-50 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2" aria-hidden="true" />
                  Início
                </Link>
              </li>
              <li>
                <Link
                  href="/plans"
                  className="text-green-50 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2" aria-hidden="true" />
                  Planos de Assinatura
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-green-50 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2" aria-hidden="true" />
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-green-50 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2" aria-hidden="true" />
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-green-800 pb-2">
              Planos
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/plans#plano-basico"
                  className="text-green-50 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2" aria-hidden="true" />
                  Plano Básico
                </Link>
              </li>
              <li>
                <Link
                  href="/plans#plano-premium"
                  className="text-green-50 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2" aria-hidden="true" />
                  Plano Premium
                </Link>
              </li>
              <li>
                <Link
                  href="/plans#plano-familia"
                  className="text-green-50 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2" aria-hidden="true" />
                  Plano Família
                </Link>
              </li>
              <li>
                <Link
                  href="/plans#plano-exotico"
                  className="text-green-50 hover:text-white transition-colors flex items-center"
                >
                  <ArrowRight className="h-3 w-3 mr-2" aria-hidden="true" />
                  Plano Exótico
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-green-800 pb-2">
              Contato
            </h3>
            <address className="not-italic">
              <ul className="space-y-3">
                <li className="flex items-start text-green-50">
                  <MapPin
                    className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    Rua das Frutas, 123
                    <br />
                    São Paulo, SP, 01234-567
                  </span>
                </li>
                <li>
                  <a
                    href="tel:+551199999999"
                    className="text-green-50 hover:text-white transition-colors flex items-center"
                  >
                    <Phone
                      className="h-5 w-5 mr-2 flex-shrink-0"
                      aria-hidden="true"
                    />
                    (11) 9999-9999
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:contato@tudofresco.com.br"
                    className="text-green-50 hover:text-white transition-colors flex items-center"
                  >
                    <Mail
                      className="h-5 w-5 mr-2 flex-shrink-0"
                      aria-hidden="true"
                    />
                    contato@tudofresco.com.br
                  </a>
                </li>
              </ul>
            </address>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-green-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="text-green-50">
              <p>
                &copy; {new Date().getFullYear()} Tudo Fresco. Todos os direitos
                reservados.
              </p>
            </div>

            <div className="md:text-center">
              <ul className="flex flex-wrap gap-4 md:justify-center">
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-green-50 hover:text-white transition-colors"
                  >
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-green-50 hover:text-white transition-colors"
                  >
                    Política de Privacidade
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-sm text-green-50 hover:text-white transition-colors"
                  >
                    Perguntas Frequentes
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:text-right">
              <Button
                asChild
                size="sm"
                className="bg-green-700 hover:bg-green-600 transition-colors"
              >
                <Link href="/plans" className="flex items-center gap-2">
                  Assine agora
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
