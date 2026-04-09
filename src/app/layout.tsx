import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { CookieBanner } from "@/components/consent/CookieBanner";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import { GA4Script } from "@/components/analytics/GA4Script";
import { AnalyticsPageView } from "@/components/analytics/AnalyticsPageView";
import { ConsentModeInit } from "@/components/consent/ConsentModeInit";
import "./globals.css";
import { SITE_URL } from "@/config/site";

/* ── Self-hosted fonts via next/font (eliminates render-blocking @import) ── */
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});
const SITE_NAME = "TürkiyeGuessr";
const TITLE = "TürkiyeGuessr — Türkiye Konum Tahmin Oyunu";
const DESCRIPTION =
  "TürkiyeGuessr ile Türkiye'nin sokak görünümünde konum tahmin et! Google Maps tabanlı ücretsiz konum bulma oyunu. Arkadaşlarınla multiplayer oyna, 81 ili keşfet.";

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "turkiyeguessr",
    "türkiye konum tahmin",
    "geoguessr alternatifi",
    "ücretsiz geoguessr",
    "türkiye harita oyunu",
    "konum tahmin oyunu",
    "konum bulma oyunu",
    "türkiye coğrafya oyunu",
    "google maps oyunu",
    "yer tahmin etme oyunu",
    "şehir tahmin etme",
    "harita tahmin oyunu",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
    languages: {
      "tr-TR": "/",
      "x-default": "/",
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
    icon: [
      { url: "/favicon.ico", sizes: "16x16" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
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
    contactPoint: {
      "@type": "ContactPoint",
      email: "sahinbasci2002@gmail.com",
      contactType: "customer support",
      availableLanguage: "Turkish",
    },
    sameAs: [
      "https://twitter.com/turkiyeguessr",
      "https://turkiyeguessr.com",
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
        availability: "https://schema.org/InStock",
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
      screenshot: `${SITE_URL}/og-image.png`,
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
      alternateName: ["TurkiyeGuessr", "Türkiye Guessr", "Turkiye Guessr"],
      url: SITE_URL,
      inLanguage: "tr",
      description: DESCRIPTION,
      publisher: { "@type": "Organization", ...orgFields },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `https://www.google.com/search?q=site:turkiyeguessr.com+{search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Anasayfa",
          item: SITE_URL,
        },
      ],
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
    <html lang="tr" className={`${bebasNeue.variable} ${dmSans.variable}`}>
      <head>
        <link rel="preconnect" href="https://maps.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://maps.gstatic.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <JsonLd />
        <ConsentModeInit />
      </head>
      <body className="antialiased">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999999] focus:bg-red-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
          >
            Ana içeriğe atla
          </a>
          <ErrorBoundary>{children}</ErrorBoundary>
          <CookieBanner />
          <AdSenseScript />
          <GA4Script />
          <Suspense fallback={null}>
            <AnalyticsPageView />
          </Suspense>
        </body>
    </html>
  );
}
