import type { Metadata, Viewport } from "next";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import "./globals.css";

const SITE_URL = "https://turkiyeguessr.xyz";
const SITE_NAME = "TürkiyeGuessr";
const TITLE = "TürkiyeGuessr - Türkiye Konum Tahmin Oyunu | Multiplayer GeoGuessr";
const DESCRIPTION =
  "Türkiye'nin sokak görünümlerinde konumunu tahmin et! Arkadaşlarınla multiplayer oyna, 81 ili keşfet. Ücretsiz, hızlı ve bağımlılık yapan Türkiye coğrafya oyunu.";

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "türkiye guessr",
    "turkiye guessr",
    "türkiye konum tahmin",
    "türkiye coğrafya oyunu",
    "geoguessr türkiye",
    "geoguessr turkey",
    "türkiye harita oyunu",
    "konum tahmin oyunu",
    "multiplayer harita oyunu",
    "türkiye sokak görünümü oyunu",
    "türkiye şehir tahmin",
    "coğrafya bilgi yarışması",
    "türkiye quiz",
    "online türkiye oyunu",
    "arkadaşlarla coğrafya oyunu",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
    languages: {
      "tr-TR": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "TürkiyeGuessr - Türkiye Konum Tahmin Oyunu",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
    creator: "@turkiyeguessr",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  category: "games",
  classification: "Games > Geography > Trivia",
};

// BUG-016: Removed maximumScale=1 and userScalable=false to allow pinch-to-zoom
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0f",
};

function JsonLd() {
  const orgFields = {
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    sameAs: [
      "https://twitter.com/turkiyeguessr",
    ],
  };

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: DESCRIPTION,
      applicationCategory: "GameApplication",
      genre: "Geography",
      operatingSystem: "Web Browser",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      inLanguage: "tr",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "TRY",
      },
      author: { "@type": "Organization", ...orgFields },
      potentialAction: {
        "@type": "PlayAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: SITE_URL,
          actionPlatform: [
            "http://schema.org/DesktopWebPlatform",
            "http://schema.org/MobileWebPlatform",
          ],
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      ...orgFields,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "tr",
      publisher: { "@type": "Organization", ...orgFields },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/sehirler?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <>
      {structuredData.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <JsonLd />
      </head>
      <body className="antialiased">
          <ErrorBoundary>{children}</ErrorBoundary>
        </body>
    </html>
  );
}
