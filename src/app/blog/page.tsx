import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { BLOG_POSTS } from "@/data/blogPosts";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Blog — Türkiye Coğrafya Rehberi ve Oyun İpuçları",
  description:
    "TürkiyeGuessr blog: Türkiye coğrafyası, konum tahmin taktikleri, bölge rehberleri ve oyun ipuçları. Türkçe içeriklerle coğrafya bilgini geliştir.",
  keywords: [
    "türkiye coğrafya rehberi",
    "konum tahmin ipuçları",
    "geoguessr taktikleri",
    "türkiye bölgeleri rehberi",
  ],
  alternates: { canonical: "/blog", languages: { "tr-TR": "/blog", "x-default": "/blog" } },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${SITE_URL}/blog`,
    siteName: "TürkiyeGuessr",
    title: "Blog — Türkiye Coğrafya Rehberi ve Oyun İpuçları",
    description:
      "TürkiyeGuessr blog: Türkiye coğrafyası, konum tahmin taktikleri, bölge rehberleri ve oyun ipuçları. Türkçe içeriklerle coğrafya bilgini geliştir.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Blog — Türkiye Coğrafya Rehberi ve Oyun İpuçları - TürkiyeGuessr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Blog — Türkiye Coğrafya Rehberi ve Oyun İpuçları",
    description:
      "TürkiyeGuessr blog: Türkiye coğrafyası, konum tahmin taktikleri, bölge rehberleri ve oyun ipuçları. Türkçe içeriklerle coğrafya bilgini geliştir.",
  },
};

function BlogJsonLd() {
  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Türkiye Coğrafya Rehberi ve Konum Tahmin İpuçları",
    description:
      "TürkiyeGuessr blog: Türkiye coğrafyası, konum tahmin taktikleri, bölge rehberleri ve oyun ipuçları.",
    url: `${SITE_URL}/blog`,
    isPartOf: { "@type": "WebSite", name: "TürkiyeGuessr", url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: BLOG_POSTS.map((post, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/blog/${post.slug}`,
        name: post.title,
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPage) }}
    />
  );
}

export default function BlogIndexPage() {
  return (
    <>
    <BlogJsonLd />
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Blog", url: "/blog" },
      ]}
    >
      <article className="space-y-8">
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Türkiye Coğrafya Rehberi ve Konum Tahmin İpuçları
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Türkiye coğrafyası, bölge rehberleri, konum tahmin taktikleri ve oyun stratejileri.
          </p>
        </header>

        <div className="space-y-4">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 hover:border-red-500/40 transition-colors"
            >
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString("tr-TR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span>{post.readTime} okuma</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-200 group-hover:text-red-400 transition-colors">
                {post.title}
              </h2>
              <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                {post.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] bg-gray-700/40 rounded px-1.5 py-0.5 text-gray-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        <section className="text-center py-6">
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Oyna — Ücretsiz!
          </Link>
        </section>
      </article>
    </SeoLayout>
    </>
  );
}
