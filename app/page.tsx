import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Star, Sparkles, Leaf, Truck, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Componentes client-side
import { MagicText } from "@/components/home/magic-text";
import { FeatureCard } from "@/components/home/feature-card";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedPlans } from "@/components/home/featured-plans";
import { TestimonialCard } from "@/components/home/testimonial-card";
import { AnimatedCTA } from "@/components/home/animated-cta";
import { FaqSection, defaultFaqItems } from "@/components/faq-section";

// Definindo interfaces para os tipos de dados
interface Plan {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  price: string;
  imageUrl: string | null;
}

// Componente de JSON-LD para SEO
function JsonLd({ plans }: { plans: Plan[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://tudofresco.com.br/#organization",
        name: "Tudo Fresco",
        url: "https://tudofresco.com.br",
        logo: {
          "@type": "ImageObject",
          url: "https://tudofresco.com.br/images/logo.jpeg",
          width: 180,
          height: 60,
        },
        description:
          "Serviço de assinatura de frutas frescas e selecionadas, entregues diretamente na sua porta.",
      },
      {
        "@type": "WebSite",
        "@id": "https://tudofresco.com.br/#website",
        url: "https://tudofresco.com.br",
        name: "Tudo Fresco - Assinatura de Frutas Frescas",
        publisher: {
          "@id": "https://tudofresco.com.br/#organization",
        },
      },
      {
        "@type": "WebPage",
        "@id": "https://tudofresco.com.br/#webpage",
        url: "https://tudofresco.com.br",
        name: "Tudo Fresco - Frutas Frescas Entregues em Casa",
        isPartOf: {
          "@id": "https://tudofresco.com.br/#website",
        },
        about: {
          "@id": "https://tudofresco.com.br/#organization",
        },
        description:
          "Experimente a sensação de ter as frutas mais frescas e saborosas do mercado entregues diretamente na sua porta, selecionadas especialmente para você.",
      },
      ...plans.map((plan) => ({
        "@type": "Product",
        name: plan.name,
        description: plan.description,
        image: plan.imageUrl,
        offers: {
          "@type": "Offer",
          price: plan.price.replace(/[^\d,]/g, "").replace(",", "."),
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
          url: `https://tudofresco.com.br/plans/${plan.slug}`,
        },
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function HomePage() {
  // Buscar planos no servidor
  const highlightedPlans = await getHighlightedPlans();

  const testimonials = [
    {
      stars: 5,
      text: "As frutas são sempre frescas e suculentas! O serviço transformou minha rotina alimentar e me surpreende a cada entrega com a qualidade e variedade.",
      name: "Maria Costa",
      duration: "Assinante há 6 meses",
      initials: "MC",
    },
    {
      stars: 5,
      text: "Descobri sabores que nunca tinha experimentado antes! As frutas exóticas são uma verdadeira jornada gastronômica e tornaram minhas refeições muito mais especiais.",
      name: "João Silva",
      duration: "Assinante há 1 ano",
      initials: "JS",
    },
    {
      stars: 5,
      text: "A flexibilidade de personalizar minha cesta é fantástica. Consigo adaptar as entregas conforme a estação e meus gostos, sempre com produtos premium e entrega pontual.",
      name: "Ana Paula",
      duration: "Assinante há 3 meses",
      initials: "AP",
    },
  ];

  const features = [
    {
      icon: <Sparkles className="h-6 w-6" aria-hidden="true" />,
      title: "Seleção Premium",
      description:
        "Frutas cuidadosamente selecionadas no ponto ideal de maturação para oferecer o melhor sabor e nutrientes.",
    },
    {
      icon: <Truck className="h-6 w-6" aria-hidden="true" />,
      title: "Entrega Express",
      description:
        "Do produtor à sua porta em até 24h, garantindo máxima frescura e qualidade em cada mordida.",
    },
    {
      icon: <Leaf className="h-6 w-6" aria-hidden="true" />,
      title: "Cultivo Sustentável",
      description:
        "Produtos de produtores comprometidos com métodos sustentáveis e respeito ao meio ambiente.",
    },
    {
      icon: <Clock className="h-6 w-6" aria-hidden="true" />,
      title: "Assinatura Flexível",
      description:
        "Personalize frequência, conteúdo e quantidade conforme sua necessidade, sem compromissos longos.",
    },
  ];

  return (
    <>
      <JsonLd plans={highlightedPlans} />
      <div className="flex flex-col min-h-screen">
        <SiteHeader />

        {/* Hero Section */}
        <HeroSection />

        {/* Featured Plans Section */}
        <section
          aria-labelledby="planos-exclusivos"
          className="py-16 px-4 md:px-6 lg:px-8 bg-green-50"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-200 border-none px-4 py-1 text-sm">
                PLANOS EXCLUSIVOS
              </Badge>
              <h2
                id="planos-exclusivos"
                className="responsive-heading-2 text-green-900 mb-4"
              >
                <MagicText>Escolha a Experiência Perfeita Para Você</MagicText>
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Cada plano foi cuidadosamente elaborado para atender suas
                necessidades, garantindo variedade, qualidade e conveniência em
                cada entrega.
              </p>
            </div>

            <FeaturedPlans plans={highlightedPlans} />

            <div className="text-center mt-10">
              <Button
                asChild
                className="bg-green-800 hover:bg-green-700"
                size="lg"
              >
                <Link href="/plans" className="flex items-center gap-2">
                  Ver Todos os Planos
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          aria-labelledby="como-funciona"
          className="py-16 px-4 md:px-6 lg:px-8 bg-gradient-to-br from-green-900 to-green-800 text-white relative overflow-hidden"
        >
          <div
            className="absolute inset-0 bg-green-pattern opacity-10"
            aria-hidden="true"
          />

          <div className="relative max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30 border-none px-4 py-1 text-sm">
                PROCESSO SIMPLES
              </Badge>
              <h2
                id="como-funciona"
                className="responsive-heading-2 text-white mb-4"
              >
                <MagicText>Como Funciona</MagicText>
              </h2>
              <p className="text-lg text-green-50 max-w-3xl mx-auto">
                Em apenas três passos simples, você terá acesso às melhores
                frutas selecionadas especialmente para você.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {[
                {
                  number: 1,
                  title: "Escolha seu Plano",
                  description:
                    "Selecione entre nossos planos exclusivos aquele que combina perfeitamente com seus gostos e necessidades.",
                },
                {
                  number: 2,
                  title: "Personalize sua Cesta",
                  description:
                    "Defina quais frutas você prefere, adicione itens exóticos e crie uma cesta que reflita seu paladar.",
                },
                {
                  number: 3,
                  title: "Receba em Casa",
                  description:
                    "Relaxe enquanto entregamos suas frutas frescas, colhidas no ponto ideal, diretamente na sua porta.",
                },
              ].map((step, index) => (
                <div key={step.number} className="text-center relative z-10">
                  <div
                    className="w-20 h-20 bg-white text-green-900 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold relative"
                    aria-hidden="true"
                  >
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-green-50 max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-16 bg-white/10 p-8 rounded-xl backdrop-blur-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    Pronto para começar?
                  </h3>
                  <p className="text-green-50">
                    Transforme sua experiência alimentar com frutas selecionadas
                    e entregues no momento certo.
                  </p>
                </div>
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-green-900 hover:bg-green-50 whitespace-nowrap font-medium"
                >
                  <Link href="/plans" className="flex items-center gap-2">
                    Escolher Plano
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section
          aria-labelledby="beneficios"
          className="py-16 px-4 md:px-6 lg:px-8"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-200 border-none px-4 py-1 text-sm">
                BENEFÍCIOS EXCLUSIVOS
              </Badge>
              <h2
                id="beneficios"
                className="responsive-heading-2 text-green-900 mb-4"
              >
                <MagicText>Por que escolher o Tudo Fresco?</MagicText>
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Mais que uma assinatura de frutas, oferecemos uma experiência
                completa de sabor, qualidade e conveniência.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section
          aria-labelledby="depoimentos"
          className="py-16 px-4 md:px-6 lg:px-8 bg-green-50"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-200 border-none px-4 py-1 text-sm">
                DEPOIMENTOS
              </Badge>
              <h2
                id="depoimentos"
                className="responsive-heading-2 text-green-900 mb-4"
              >
                <MagicText>O que nossos clientes dizem</MagicText>
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Histórias reais de pessoas que transformaram sua experiência
                alimentar com o Tudo Fresco.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard
                  key={index}
                  testimonial={testimonial}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FaqSection
          faqItems={defaultFaqItems}
          bgColor="white"
          title="Perguntas Frequentes"
          description="Tire suas dúvidas sobre o Tudo Fresco, nossos planos e como funciona nossa assinatura."
        />

        {/* CTA Section */}
        <AnimatedCTA />

        <SiteFooter />
      </div>
    </>
  );
}

// Função para buscar planos no servidor
async function getHighlightedPlans(): Promise<Plan[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/plans?limit=3`,
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
