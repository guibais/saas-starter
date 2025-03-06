import { Metadata } from "next";

// Configurações base de metadados para o site
export const siteConfig = {
  name: "Tudo Fresco",
  description:
    "Assinatura de frutas frescas entregues na sua porta semanalmente",
  url: "https://tudofresco.com.br",
  ogImage: "https://tudofresco.com.br/images/og-image.jpg",
  links: {
    twitter: "https://twitter.com/tudofresco",
    instagram: "https://instagram.com/tudofresco",
    facebook: "https://facebook.com/tudofresco",
  },
  keywords: [
    "frutas frescas",
    "assinatura de frutas",
    "entrega de frutas",
    "frutas orgânicas",
    "frutas em casa",
    "assinatura alimentar",
    "frutas selecionadas",
  ],
};

// Função para criar metadados para o site
export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  noIndex = false,
  keywords = siteConfig.keywords,
  route = "",
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  route?: string;
} = {}): Metadata {
  const fullTitle =
    title === siteConfig.name ? title : `${title} | ${siteConfig.name}`;
  const fullUrl = `${siteConfig.url}${route}`;

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url: fullUrl,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
      creator: "@tudofresco",
    },
    alternates: {
      canonical: fullUrl,
    },
    keywords,
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
    authors: [
      {
        name: "Tudo Fresco",
        url: siteConfig.url,
      },
    ],
    viewport: "width=device-width, initial-scale=1",
    metadataBase: new URL(siteConfig.url),
  };
}
