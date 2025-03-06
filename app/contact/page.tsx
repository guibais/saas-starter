import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MagicText } from "@/components/home/magic-text";
import { FaqSection, defaultFaqItems } from "@/components/faq-section";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  Instagram,
  Facebook,
  Twitter,
  ArrowRight,
} from "lucide-react";
import { constructMetadata } from "../metadata";

export const metadata = constructMetadata({
  title: "Contato | Tudo Fresco",
  description:
    "Entre em contato com a equipe Tudo Fresco. Estamos aqui para ajudar com dúvidas, sugestões ou agendamento de assinaturas de frutas.",
});

export default async function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative pt-20 pb-12 px-4 md:px-6 lg:px-8 bg-gradient-to-br from-green-900 to-green-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/images/fruit-pattern.png')] bg-repeat"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30 border-none px-4 py-1 text-sm">
                FALE CONOSCO
              </Badge>
              <h1 className="responsive-heading-1 mb-6 text-white">
                <MagicText>Estamos Aqui Para Ajudar</MagicText>
              </h1>
              <p className="text-xl text-green-50 max-w-xl mb-8">
                Tem dúvidas, sugestões ou quer saber mais sobre nossos planos?
                Nossa equipe está pronta para atender você com toda atenção que
                merece.
              </p>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl flex items-start">
                  <div className="bg-green-700 p-2 rounded-lg mr-4">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">E-mail</h3>
                    <a
                      href="mailto:contato@tudofresco.com.br"
                      className="text-green-50 hover:text-white transition-colors"
                    >
                      contato@tudofresco.com.br
                    </a>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl flex items-start">
                  <div className="bg-green-700 p-2 rounded-lg mr-4">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Telefone</h3>
                    <a
                      href="tel:+551199999999"
                      className="text-green-50 hover:text-white transition-colors"
                    >
                      (11) 9999-9999
                    </a>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl flex items-start">
                  <div className="bg-green-700 p-2 rounded-lg mr-4">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Endereço</h3>
                    <p className="text-green-50">
                      Rua das Frutas, 123
                      <br />
                      São Paulo, SP, 01234-567
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl flex items-start">
                  <div className="bg-green-700 p-2 rounded-lg mr-4">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Horário</h3>
                    <p className="text-green-50">
                      Segunda - Sexta: 8h às 18h
                      <br />
                      Sábado: 9h às 13h
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-bold mb-3">Redes Sociais</h3>
                <div className="flex space-x-4">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-full"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-full"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-full"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl">
              <div className="mb-6 flex items-center">
                <MessageSquare className="w-6 h-6 mr-3" />
                <h2 className="text-2xl font-bold">Envie sua Mensagem</h2>
              </div>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium mb-1"
                    >
                      Nome
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium mb-1"
                    >
                      E-mail
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="Seu e-mail"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium mb-1"
                  >
                    Assunto
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    placeholder="Assunto da mensagem"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium mb-1"
                  >
                    Mensagem
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    placeholder="Digite sua mensagem aqui..."
                    required
                  ></textarea>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-2 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  Enviar Mensagem
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-200 border-none px-4 py-1 text-sm">
              ONDE ESTAMOS
            </Badge>
            <h2 className="responsive-heading-2 text-green-900 mb-4">
              <MagicText>Venha nos Visitar</MagicText>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Nossa sede fica em uma localização estratégica, de fácil acesso e
              próxima a diversos pontos de referência.
            </p>
          </div>

          <div className="rounded-xl overflow-hidden shadow-lg">
            <div className="aspect-[16/9] relative">
              <Image
                src="/images/map.jpg"
                alt="Mapa mostrando a localização da sede do Tudo Fresco"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-green-900/20 flex items-center justify-center backdrop-blur-sm">
                <div className="bg-white p-6 rounded-xl shadow-lg max-w-md text-center">
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    Tudo Fresco - Sede
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Rua das Frutas, 123
                    <br />
                    São Paulo, SP, 01234-567
                  </p>
                  <Button asChild className="bg-green-800 hover:bg-green-700">
                    <a
                      href="https://maps.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      Ver no Google Maps
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
              <h3 className="text-xl font-bold text-green-900 mb-3">
                Central de Distribuição
              </h3>
              <p className="text-gray-600 mb-2">
                Av. das Hortaliças, 456
                <br />
                São Paulo, SP, 04567-890
              </p>
              <p className="text-sm text-gray-500">
                Segunda - Sexta: 8h às 18h
              </p>
            </div>

            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
              <h3 className="text-xl font-bold text-green-900 mb-3">
                Loja Conceito
              </h3>
              <p className="text-gray-600 mb-2">
                Shopping Vila Olímpia, Loja 34
                <br />
                São Paulo, SP, 04552-040
              </p>
              <p className="text-sm text-gray-500">
                Segunda - Domingo: 10h às 22h
              </p>
            </div>

            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
              <h3 className="text-xl font-bold text-green-900 mb-3">
                Atendimento Corporativo
              </h3>
              <p className="text-gray-600 mb-2">
                Rua Empresarial, 789, 15º andar
                <br />
                São Paulo, SP, 01452-000
              </p>
              <p className="text-sm text-gray-500">
                Segunda - Sexta: 9h às 18h
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FaqSection faqItems={defaultFaqItems} />

      {/* Newsletter Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8 bg-gradient-to-br from-green-900 to-green-800 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30 border-none px-4 py-1 text-sm">
            FIQUE POR DENTRO
          </Badge>
          <h2 className="responsive-heading-2 text-white mb-4">
            <MagicText>Assine Nossa Newsletter</MagicText>
          </h2>
          <p className="text-lg text-green-50 max-w-3xl mx-auto mb-8">
            Receba dicas de alimentação saudável, novidades sobre nossos
            produtos e ofertas exclusivas diretamente no seu e-mail.
          </p>

          <form className="max-w-xl mx-auto flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-transparent"
              required
            />
            <Button
              type="submit"
              className="bg-white text-green-900 hover:bg-green-100 whitespace-nowrap"
            >
              Inscrever-se
            </Button>
          </form>

          <p className="mt-4 text-sm text-green-50 opacity-80">
            Ao se inscrever, você concorda com nossa Política de Privacidade e
            em receber comunicações por e-mail.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
