import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Star } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Definindo interfaces para os tipos de dados
interface Plan {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  price: string;
  imageUrl: string | null;
}

async function getHighlightedPlans() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/plans?limit=3`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Falha ao carregar planos em destaque");
    }

    const data = await response.json();
    return data.plans || [];
  } catch (error) {
    console.error("Erro ao buscar planos em destaque:", error);
    return [];
  }
}

export default async function HomePage() {
  const highlightedPlans = await getHighlightedPlans();

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative w-full bg-gradient-to-r from-green-900 to-green-700 py-20 px-4 md:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/images/fruits-pattern.jpg"
            alt="Padrão de frutas"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-white">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Frutas Frescas e Gourmet na Sua Porta
            </h1>
            <p className="text-lg md:text-xl mb-8 text-green-50">
              Receba as melhores frutas selecionadas diretamente na sua casa com
              nossos planos de assinatura personalizados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                asChild
                className="bg-white text-green-900 hover:bg-green-50"
              >
                <Link href="/plans">Ver Planos de Assinatura</Link>
              </Button>
            </div>
          </div>
          <div className="flex-1 relative h-[300px] md:h-[400px] w-full rounded-lg overflow-hidden">
            <Image
              src="/images/hero-fruits.jpg"
              alt="Seleção de frutas gourmet"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Featured Plans Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8 bg-green-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">
              Planos de Assinatura em Destaque
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Escolha o plano ideal para você e receba frutas frescas e
              selecionadas regularmente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {highlightedPlans.length > 0
              ? highlightedPlans.map((plan: Plan) => (
                  <Card
                    key={plan.id}
                    className="overflow-hidden transition-all hover:shadow-lg"
                  >
                    <div className="relative h-48 w-full">
                      {plan.imageUrl ? (
                        <Image
                          src={plan.imageUrl}
                          alt={plan.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-green-200 flex items-center justify-center">
                          <span className="text-green-800">Tudo Fresco</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-2 text-green-900">
                        {plan.name}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {plan.description ||
                          "Plano de assinatura de frutas frescas e selecionadas."}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-green-800">
                          {formatCurrency(plan.price)}
                          <span className="text-sm font-normal text-gray-500">
                            /mês
                          </span>
                        </span>
                        <Button
                          asChild
                          variant="outline"
                          className="border-green-800 text-green-800 hover:bg-green-50"
                        >
                          <Link href={`/plans/${plan.slug}`}>Ver Plano</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              : Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="h-48 w-full bg-gray-200 animate-pulse"></div>
                    <CardContent className="p-6">
                      <div className="h-6 w-3/4 bg-gray-200 animate-pulse mb-2"></div>
                      <div className="h-4 w-full bg-gray-200 animate-pulse mb-2"></div>
                      <div className="h-4 w-2/3 bg-gray-200 animate-pulse mb-4"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-8 w-1/3 bg-gray-200 animate-pulse"></div>
                        <div className="h-10 w-1/4 bg-gray-200 animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>

          <div className="text-center mt-10">
            <Button asChild className="bg-green-800 hover:bg-green-700">
              <Link href="/plans" className="flex items-center gap-2">
                Ver Todos os Planos <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8 bg-green-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Como Funciona
            </h2>
            <p className="text-lg text-green-50 max-w-3xl mx-auto">
              Entenda como é fácil receber frutas frescas e selecionadas na sua
              casa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white text-green-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Escolha seu Plano</h3>
              <p className="text-green-50">
                Selecione o plano que melhor atende às suas necessidades e
                preferências.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white text-green-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Personalize sua Cesta</h3>
              <p className="text-green-50">
                Escolha as frutas que deseja receber dentro das opções
                disponíveis no seu plano.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white text-green-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Receba em Casa</h3>
              <p className="text-green-50">
                Nós entregamos suas frutas frescas diretamente na sua porta no
                dia programado.
              </p>
            </div>
          </div>

          <div className="mt-12 bg-green-800 p-6 rounded-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Pronto para começar?</h3>
                <p className="text-green-50">
                  Escolha seu plano agora e receba frutas frescas na sua casa.
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-white text-green-900 hover:bg-green-50 whitespace-nowrap"
              >
                <Link href="/plans">Escolher Plano</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">
              Por que escolher o Tudo Fresco?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Oferecemos a melhor experiência em assinatura de frutas gourmet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-800">
                <Check size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-green-900">
                  Frutas Selecionadas
                </h3>
                <p className="text-gray-600">
                  Todas as nossas frutas são cuidadosamente selecionadas para
                  garantir qualidade e frescor.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-800">
                <Check size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-green-900">
                  Entrega Rápida
                </h3>
                <p className="text-gray-600">
                  Entregamos suas frutas em até 24 horas após a colheita para
                  garantir o máximo de frescor.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-800">
                <Check size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-green-900">
                  Personalização
                </h3>
                <p className="text-gray-600">
                  Você pode personalizar sua cesta de acordo com suas
                  preferências e necessidades.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-800">
                <Check size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-green-900">
                  Frutas Exóticas
                </h3>
                <p className="text-gray-600">
                  Oferecemos uma variedade de frutas exóticas para você
                  experimentar novos sabores.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8 bg-green-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Veja o que nossos clientes acham do Tudo Fresco.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex text-yellow-400 mb-4">
                  <Star className="fill-current" size={20} />
                  <Star className="fill-current" size={20} />
                  <Star className="fill-current" size={20} />
                  <Star className="fill-current" size={20} />
                  <Star className="fill-current" size={20} />
                </div>
                <p className="text-gray-600 mb-6">
                  "As frutas são sempre frescas e de ótima qualidade. O serviço
                  de entrega é pontual e a equipe é muito atenciosa. Recomendo!"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-bold">
                    MC
                  </div>
                  <div>
                    <h4 className="font-bold">Maria Costa</h4>
                    <p className="text-sm text-gray-500">
                      Assinante há 6 meses
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex text-yellow-400 mb-4">
                  <Star className="fill-current" size={20} />
                  <Star className="fill-current" size={20} />
                  <Star className="fill-current" size={20} />
                  <Star className="fill-current" size={20} />
                  <Star className="fill-current" size={20} />
                </div>
                <p className="text-gray-600 mb-6">
                  "Adoro a variedade de frutas exóticas que recebo todo mês. É
                  uma ótima maneira de experimentar coisas novas e manter uma
                  alimentação saudável."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-bold">
                    JS
                  </div>
                  <div>
                    <h4 className="font-bold">João Silva</h4>
                    <p className="text-sm text-gray-500">Assinante há 1 ano</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex text-yellow-400 mb-4">
                  <Star className="fill-current" size={20} />
                  <Star className="fill-current" size={20} />
                  <Star className="fill-current" size={20} />
                  <Star className="fill-current" size={20} />
                  <Star className="fill-current" size={20} />
                </div>
                <p className="text-gray-600 mb-6">
                  "A flexibilidade de poder personalizar minha cesta é incrível.
                  As frutas são sempre frescas e o atendimento ao cliente é
                  excelente."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-bold">
                    AP
                  </div>
                  <div>
                    <h4 className="font-bold">Ana Paula</h4>
                    <p className="text-sm text-gray-500">
                      Assinante há 3 meses
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8 bg-green-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para experimentar o melhor em frutas gourmet?
          </h2>
          <p className="text-lg text-green-50 mb-8 max-w-2xl mx-auto">
            Assine agora e receba frutas frescas e selecionadas diretamente na
            sua porta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="bg-white text-green-900 hover:bg-green-50"
            >
              <Link href="/plans">Assinar Agora</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
