import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MagicText } from "@/components/home/magic-text";
import { ChevronDown, ArrowRight } from "lucide-react";
import Link from "next/link";

// Define the FAQ data structure
export type FaqItem = {
  question: string;
  answer: string;
};

// Define the component props
interface FaqSectionProps {
  title?: string;
  description?: string;
  faqItems: FaqItem[];
  showContactButton?: boolean;
  bgColor?: "white" | "green";
}

export function FaqSection({
  title = "Dúvidas Comuns sobre o Tudo Fresco",
  description = "Encontre respostas para algumas das perguntas mais frequentes sobre nossos serviços, entregas e assinaturas.",
  faqItems,
  showContactButton = true,
  bgColor = "green",
}: FaqSectionProps) {
  return (
    <section
      className={`py-16 px-4 md:px-6 lg:px-8 ${
        bgColor === "green" ? "bg-green-50" : "bg-white"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-200 border-none px-4 py-1 text-sm">
            PERGUNTAS FREQUENTES
          </Badge>
          <h2 className="responsive-heading-2 text-green-900 mb-4">
            <MagicText>{title}</MagicText>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {faqItems.map((faq, index) => (
            <details
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border border-green-100 group"
            >
              <summary className="text-lg font-bold text-green-900 cursor-pointer flex justify-between items-center">
                {faq.question}
                <ChevronDown className="w-5 h-5 text-green-700 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-4 text-gray-600">{faq.answer}</p>
            </details>
          ))}
        </div>

        {showContactButton && (
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-6">
              Não encontrou o que procurava? Entre em contato conosco
              diretamente!
            </p>
            <Button asChild className="bg-green-800 hover:bg-green-700">
              <Link href="/contact" className="flex items-center gap-2">
                Enviar Mensagem
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// Default FAQ items that can be imported and reused
export const defaultFaqItems: FaqItem[] = [
  {
    question: "Como funciona a assinatura de frutas?",
    answer:
      "Você escolhe um de nossos planos, personaliza de acordo com suas preferências e nós entregamos frutas frescas e selecionadas na sua casa, na frequência que você preferir. O pagamento é feito por meio de assinatura recorrente e você pode alterar, pausar ou cancelar quando quiser.",
  },
  {
    question: "Quais regiões vocês atendem?",
    answer:
      "Atualmente atendemos todas as capitais e regiões metropolitanas do Brasil. As entregas em algumas cidades do interior podem ter prazos diferenciados. Consulte a disponibilidade para sua região específica no momento da assinatura.",
  },
  {
    question: "Como garantem a qualidade das frutas?",
    answer:
      "Trabalhamos diretamente com produtores selecionados e possuímos um rigoroso processo de controle de qualidade. Todas as frutas são cuidadosamente inspecionadas e selecionadas no ponto ideal de maturação antes de serem enviadas para você.",
  },
  {
    question: "Posso alterar meu plano ou frequência de entrega?",
    answer:
      "Sim! Você pode alterar seu plano, incluir ou remover itens, e ajustar a frequência de entrega a qualquer momento através da sua conta no site ou aplicativo. As alterações serão aplicadas a partir da próxima entrega programada.",
  },
  {
    question: "E se eu não estiver em casa no momento da entrega?",
    answer:
      "No momento da assinatura, você pode deixar instruções específicas para a entrega. Caso ninguém receba a entrega, tentaremos novamente no dia seguinte. Você também pode optar por deixar a entrega com um porteiro ou vizinho, conforme suas preferências.",
  },
  {
    question: "Como posso cancelar minha assinatura?",
    answer:
      "O cancelamento pode ser feito diretamente pela sua conta no site ou aplicativo, sem multas ou taxas adicionais. Apenas solicitamos que o cancelamento seja feito com pelo menos 3 dias de antecedência da próxima entrega programada.",
  },
];
