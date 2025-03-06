import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MagicText } from "@/components/home/magic-text";
import { Leaf, Heart, Users, Award, TrendingUp, Globe } from "lucide-react";
import { constructMetadata } from "../metadata";

export const metadata = constructMetadata({
  title: "Sobre Nós | Tudo Fresco",
  description:
    "Conheça a história, valores e filosofia por trás do Tudo Fresco - sua assinatura de frutas premium entregues direto na sua porta.",
});

export default async function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-6 lg:px-8 bg-gradient-to-br from-green-900 to-green-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern
              id="fruit-pattern"
              x="0"
              y="0"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M25,0 C35,0 45,10 45,20 C45,30 35,40 25,40 C15,40 5,30 5,20 C5,10 15,0 25,0 Z"
                fill="currentColor"
                opacity="0.3"
              />
              <circle cx="10" cy="35" r="8" fill="currentColor" opacity="0.2" />
              <path
                d="M40,25 C45,25 50,30 50,35 C50,40 45,45 40,45 C35,45 30,40 30,35 C30,30 35,25 40,25 Z"
                fill="currentColor"
                opacity="0.3"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#fruit-pattern)" />
          </svg>
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30 border-none px-4 py-1 text-sm">
            NOSSA HISTÓRIA
          </Badge>
          <h1 className="responsive-heading-1 mb-6 text-white">
            <MagicText>O Melhor da Natureza na Sua Porta</MagicText>
          </h1>
          <p className="text-xl text-green-50 max-w-3xl mb-8">
            Nascemos da paixão por alimentação saudável e da crença de que
            frutas frescas e de qualidade devem ser acessíveis a todos, sem
            esforço e com toda conveniência.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center mb-4">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fundação em 2021</h3>
              <p className="text-green-50">
                Iniciamos com uma visão simples: entregar frutas da mais alta
                qualidade diretamente na sua casa.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Missão Clara</h3>
              <p className="text-green-50">
                Promover saúde e bem-estar através do melhor que a natureza tem
                a oferecer, com conveniência e sustentabilidade.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Crescimento Constante</h3>
              <p className="text-green-50">
                De uma pequena operação para uma empresa que atende milhares de
                clientes mensalmente em todo Brasil.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-200 border-none px-4 py-1 text-sm">
                NOSSA JORNADA
              </Badge>
              <h2 className="responsive-heading-2 text-green-900 mb-6">
                <MagicText>A História por Trás do Tudo Fresco</MagicText>
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Tudo começou com a percepção de como era difícil encontrar
                  frutas realmente frescas e de qualidade superior nos mercados
                  tradicionais.
                </p>
                <p>
                  Em 2021, lançamos o Tudo Fresco com uma promessa: entregar as
                  melhores frutas, no ponto perfeito de maturação, diretamente
                  na casa dos nossos clientes. Começamos pequenos, atendendo
                  apenas alguns bairros em São Paulo.
                </p>
                <p>
                  Rapidamente, nossa base de clientes cresceu, impulsionada pelo
                  compromisso com a qualidade e pela experiência extraordinária
                  que proporcionamos. Hoje, atendemos milhares de lares em todo
                  o Brasil, mantendo o mesmo cuidado e atenção aos detalhes do
                  primeiro dia.
                </p>
                <p>
                  Nossa jornada é guiada pela crença de que todos merecem ter
                  acesso a alimentos frescos, nutritivos e deliciosos, sem
                  complicações.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="h-60 bg-green-50 rounded-xl overflow-hidden shadow-xl flex items-center justify-center p-4">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 500 300"
                  xmlns="http://www.w3.org/2000/svg"
                  className="max-h-52"
                >
                  {/* Basket */}
                  <path
                    d="M150,200 C150,150 350,150 350,200 L380,280 L120,280 L150,200 Z"
                    fill="#8B4513"
                  />
                  <path
                    d="M150,200 C150,180 350,180 350,200 L350,210 C350,190 150,190 150,210 L150,200 Z"
                    fill="#A0522D"
                  />
                  <ellipse cx="250" cy="200" rx="100" ry="20" fill="#A0522D" />
                  {/* Basket Handle */}
                  <path
                    d="M175,190 C175,120 325,120 325,190"
                    fill="none"
                    stroke="#8B4513"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Fruits */}
                  <circle cx="200" cy="160" r="30" fill="#FF5A5A" />{" "}
                  {/* Apple */}
                  <path d="M200,130 L205,110 L210,115 Z" fill="#0A7A0A" />{" "}
                  {/* Apple stem */}
                  <circle cx="250" cy="150" r="35" fill="#FFA500" />{" "}
                  {/* Orange */}
                  <path d="M250,115 L255,95 L260,100 Z" fill="#0A7A0A" />{" "}
                  {/* Orange stem */}
                  <ellipse
                    cx="300"
                    cy="170"
                    rx="35"
                    ry="25"
                    fill="#AA33FF"
                  />{" "}
                  {/* Plum */}
                  <path d="M300,145 L305,125 L310,130 Z" fill="#0A7A0A" />{" "}
                  {/* Plum stem */}
                  <ellipse
                    cx="220"
                    cy="190"
                    rx="25"
                    ry="20"
                    fill="#FFDD33"
                  />{" "}
                  {/* Lemon */}
                  <ellipse
                    cx="285"
                    cy="190"
                    rx="20"
                    ry="15"
                    fill="#50C878"
                  />{" "}
                  {/* Lime */}
                  {/* Leaves peeking out */}
                  <path
                    d="M180,160 C170,150 160,160 170,170"
                    fill="none"
                    stroke="#228B22"
                    strokeWidth="3"
                  />
                  <path
                    d="M330,160 C340,150 350,160 340,170"
                    fill="none"
                    stroke="#228B22"
                    strokeWidth="3"
                  />
                </svg>
              </div>
              <div className="absolute -bottom-4 -right-4 w-36 h-36 bg-green-100 rounded-xl -z-10"></div>
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-green-200 rounded-xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8 bg-green-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-200 border-none px-4 py-1 text-sm">
              NOSSOS VALORES
            </Badge>
            <h2 className="responsive-heading-2 text-green-900 mb-4">
              <MagicText>Princípios que nos Guiam</MagicText>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Nossos valores definem quem somos e como agimos. Eles são a base
              de tudo o que fazemos no Tudo Fresco.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 text-green-800 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-3">
                Qualidade Acima de Tudo
              </h3>
              <p className="text-gray-600">
                Selecionamos criteriosamente cada fruta, assegurando que apenas
                o melhor chegue à sua mesa. Nosso padrão é a excelência em cada
                entrega.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 text-green-800 rounded-lg flex items-center justify-center mb-4">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-3">
                Sustentabilidade
              </h3>
              <p className="text-gray-600">
                Trabalhamos com produtores comprometidos com práticas
                sustentáveis e utilizamos embalagens eco-friendly, minimizando
                nosso impacto ambiental.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 text-green-800 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-3">
                Inovação Constante
              </h3>
              <p className="text-gray-600">
                Buscamos continuamente aprimorar nossos processos e serviços,
                incorporando tecnologia e novidades para melhorar sua
                experiência.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 text-green-800 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-3">
                Cuidado Genuíno
              </h3>
              <p className="text-gray-600">
                Cada cliente, fornecedor e colaborador é tratado com respeito e
                atenção. Seus desejos e necessidades são nossa prioridade.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 text-green-800 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-3">
                Impacto Social
              </h3>
              <p className="text-gray-600">
                Promovemos o desenvolvimento local apoiando pequenos produtores
                e realizando ações que beneficiam comunidades agrícolas.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 text-green-800 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-3">
                Transparência
              </h3>
              <p className="text-gray-600">
                Acreditamos em relações abertas e honestas. Você sempre saberá a
                origem dos produtos, nossos processos e como trabalhamos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy & Approach Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-200 border-none px-4 py-1 text-sm">
              NOSSA FILOSOFIA
            </Badge>
            <h2 className="responsive-heading-2 text-green-900 mb-4">
              <MagicText>Uma Abordagem Diferenciada</MagicText>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              No Tudo Fresco, acreditamos que a qualidade dos alimentos que
              consumimos tem um impacto direto em nossa saúde e bem-estar.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="h-56 rounded-xl overflow-hidden shadow-xl bg-green-50 flex items-center justify-center p-4">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 400 400"
                  xmlns="http://www.w3.org/2000/svg"
                  className="max-h-48"
                >
                  {/* Selection process illustration */}
                  <g transform="translate(50, 50)">
                    {/* Sorting table */}
                    <rect
                      x="20"
                      y="150"
                      width="260"
                      height="20"
                      fill="#8B4513"
                    />
                    <rect
                      x="20"
                      y="170"
                      width="260"
                      height="80"
                      fill="#A0522D"
                      rx="5"
                      ry="5"
                    />
                    <rect
                      x="40"
                      y="230"
                      width="10"
                      height="50"
                      fill="#8B4513"
                    />
                    <rect
                      x="250"
                      y="230"
                      width="10"
                      height="50"
                      fill="#8B4513"
                    />
                    {/* Fruits on sorting table */}
                    <circle cx="60" cy="155" r="15" fill="#FF0000" />{" "}
                    {/* Red apple */}
                    <circle cx="100" cy="155" r="15" fill="#FFAA00" />{" "}
                    {/* Orange */}
                    <circle cx="140" cy="155" r="15" fill="#FFD700" />{" "}
                    {/* Yellow fruit */}
                    <circle cx="180" cy="155" r="15" fill="#50C878" />{" "}
                    {/* Green fruit */}
                    <circle cx="220" cy="155" r="15" fill="#8A2BE2" />{" "}
                    {/* Purple fruit */}
                    {/* Quality check symbol */}
                    <circle
                      cx="150"
                      cy="70"
                      r="50"
                      fill="#F5F5F5"
                      stroke="#0A7A0A"
                      strokeWidth="3"
                    />
                    <path
                      d="M120,70 L145,95 L180,45"
                      fill="none"
                      stroke="#0A7A0A"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Arrow pointing to quality check */}
                    <path
                      d="M150,155 L150,120"
                      fill="none"
                      stroke="#333"
                      strokeWidth="3"
                      strokeDasharray="5,5"
                    />
                    <polygon points="150,115 145,125 155,125" fill="#333" />
                    {/* Selection hands */}
                    <path
                      d="M90,190 C50,180 50,200 90,210"
                      fill="none"
                      stroke="#FFC0A0"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <path
                      d="M210,190 C250,180 250,200 210,210"
                      fill="none"
                      stroke="#FFC0A0"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                  </g>
                </svg>
              </div>
              <div className="absolute -top-4 -right-4 w-28 h-28 bg-green-100 rounded-xl -z-10"></div>
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-green-200 rounded-xl -z-10"></div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="space-y-6">
                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    Frescor Como Prioridade
                  </h3>
                  <p className="text-gray-600">
                    Trabalhamos com ciclos de fornecimento curtos e frequentes
                    para garantir que as frutas cheguem à sua mesa no auge do
                    frescor. Nossa logística é planejada para minimizar o tempo
                    entre a colheita e a entrega.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    Parcerias Responsáveis
                  </h3>
                  <p className="text-gray-600">
                    Estabelecemos relações diretas com produtores que
                    compartilham nossos valores de qualidade e sustentabilidade.
                    Isso nos permite garantir a procedência de cada fruta e
                    apoiar práticas agrícolas responsáveis.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    Tecnologia a Serviço da Qualidade
                  </h3>
                  <p className="text-gray-600">
                    Utilizamos sistemas avançados para monitorar a qualidade,
                    rastrear a origem de cada produto e otimizar nossas rotas de
                    entrega. A tecnologia nos ajuda a oferecer uma experiência
                    excepcional do campo à sua casa.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    Cliente no Centro de Tudo
                  </h3>
                  <p className="text-gray-600">
                    Cada decisão que tomamos é orientada pelas necessidades e
                    feedback dos nossos clientes. Acreditamos que construir
                    relacionamentos duradouros baseados na confiança é essencial
                    para nosso sucesso.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commitment Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8 bg-gradient-to-br from-green-900 to-green-800 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30 border-none px-4 py-1 text-sm">
            NOSSO COMPROMISSO
          </Badge>
          <h2 className="responsive-heading-2 text-white mb-6">
            <MagicText>De Produtores Comprometidos para sua Mesa</MagicText>
          </h2>
          <p className="text-xl text-green-50 max-w-3xl mx-auto mb-8">
            Nosso compromisso vai além da entrega de frutas. Estamos criando um
            ecossistema sustentável que beneficia produtores, consumidores e o
            planeta.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl flex flex-col items-center">
              <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center mb-4">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 12L11 14L15 10"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Qualidade Garantida</h3>
              <p className="text-green-50">
                Selecionamos apenas as melhores frutas, no ponto ideal de
                maturação, garantindo sabor e nutrientes em cada mordida.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl flex flex-col items-center">
              <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center mb-4">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M23 21V19C22.9986 17.1771 21.765 15.5857 20 15.13"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 3.13C17.7699 3.58317 19.0078 5.17799 19.0078 7.005C19.0078 8.83201 17.7699 10.4268 16 10.88"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">
                Apoio a Produtores Locais
              </h3>
              <p className="text-green-50">
                Trabalhamos diretamente com pequenos e médios produtores,
                promovendo práticas sustentáveis e comércio justo.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl flex flex-col items-center">
              <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center mb-4">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 16L12 12V6"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Entrega Responsável</h3>
              <p className="text-green-50">
                Utilizamos embalagens eco-friendly e otimizamos rotas de entrega
                para minimizar nossa pegada de carbono.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <div className="h-32 bg-white/10 backdrop-blur-sm p-3 rounded-xl flex items-center justify-center">
              <svg
                viewBox="0 0 240 150"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full max-h-24 w-auto"
              >
                {/* Simplified farm illustration */}
                <rect
                  x="90"
                  y="70"
                  width="60"
                  height="50"
                  fill="#A0522D"
                />{" "}
                {/* House body */}
                <polygon points="90,70 150,70 120,40" fill="#8B4513" />{" "}
                {/* House roof */}
                <rect
                  x="110"
                  y="90"
                  width="15"
                  height="30"
                  fill="#5B3A29"
                />{" "}
                {/* Door */}
                {/* Fields */}
                <rect
                  x="30"
                  y="100"
                  width="40"
                  height="30"
                  fill="#228B22"
                />{" "}
                {/* Field 1 */}
                <rect
                  x="170"
                  y="100"
                  width="40"
                  height="30"
                  fill="#228B22"
                />{" "}
                {/* Field 2 */}
                {/* Planting rows - simplified */}
                <line
                  x1="35"
                  y1="105"
                  x2="65"
                  y2="105"
                  stroke="#1E6E1E"
                  strokeWidth="1.5"
                />
                <line
                  x1="35"
                  y1="115"
                  x2="65"
                  y2="115"
                  stroke="#1E6E1E"
                  strokeWidth="1.5"
                />
                <line
                  x1="35"
                  y1="125"
                  x2="65"
                  y2="125"
                  stroke="#1E6E1E"
                  strokeWidth="1.5"
                />
                <line
                  x1="175"
                  y1="105"
                  x2="205"
                  y2="105"
                  stroke="#1E6E1E"
                  strokeWidth="1.5"
                />
                <line
                  x1="175"
                  y1="115"
                  x2="205"
                  y2="115"
                  stroke="#1E6E1E"
                  strokeWidth="1.5"
                />
                <line
                  x1="175"
                  y1="125"
                  x2="205"
                  y2="125"
                  stroke="#1E6E1E"
                  strokeWidth="1.5"
                />
                {/* Sun - simplified */}
                <circle cx="210" cy="30" r="15" fill="#FFD700" />
                <line
                  x1="210"
                  y1="10"
                  x2="210"
                  y2="5"
                  stroke="#FFD700"
                  strokeWidth="2"
                />
                <line
                  x1="210"
                  y1="50"
                  x2="210"
                  y2="55"
                  stroke="#FFD700"
                  strokeWidth="2"
                />
                <line
                  x1="190"
                  y1="30"
                  x2="185"
                  y2="30"
                  stroke="#FFD700"
                  strokeWidth="2"
                />
                <line
                  x1="230"
                  y1="30"
                  x2="235"
                  y2="30"
                  stroke="#FFD700"
                  strokeWidth="2"
                />
                {/* Trees - simplified */}
                <rect x="30" y="60" width="5" height="30" fill="#8B4513" />
                <polygon points="32.5,30 45,60 20,60" fill="#228B22" />
                <rect x="200" y="60" width="5" height="30" fill="#8B4513" />
                <polygon points="202.5,30 215,60 190,60" fill="#228B22" />
              </svg>
            </div>
            <div className="h-32 bg-white/10 backdrop-blur-sm p-3 rounded-xl flex items-center justify-center">
              <svg
                viewBox="0 0 240 150"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full max-h-24 w-auto"
              >
                {/* Simplified packaging illustration */}
                <rect
                  x="70"
                  y="60"
                  width="100"
                  height="60"
                  rx="5"
                  ry="5"
                  fill="#F5F5F5"
                  stroke="#555"
                  strokeWidth="1.5"
                />{" "}
                {/* Box */}
                <line
                  x1="70"
                  y1="80"
                  x2="170"
                  y2="80"
                  stroke="#555"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                {/* Fruits in box - simplified */}
                <circle cx="85" cy="100" r="10" fill="#FF5252" />
                <circle cx="110" cy="105" r="10" fill="#FFCA28" />
                <circle cx="135" cy="95" r="10" fill="#66BB6A" />
                <circle cx="155" cy="100" r="10" fill="#7E57C2" />
                {/* Quality seal - simplified */}
                <circle cx="120" cy="40" r="15" fill="#4CAF50" />
                <text
                  x="120"
                  y="44"
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="bold"
                  fill="white"
                >
                  SELO
                </text>
                {/* Eco-friendly label - simplified */}
                <rect
                  x="80"
                  y="50"
                  width="40"
                  height="15"
                  rx="3"
                  ry="3"
                  fill="#8BC34A"
                />
                <text
                  x="100"
                  y="61"
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="bold"
                  fill="white"
                >
                  ECO
                </text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
