import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { BLOG_POSTS } from "@/data/blogPosts";

export const metadata: Metadata = {
  title: "Blog — Türkiye Coğrafya Rehberi ve Oyun İpuçları",
  description:
    "TürkiyeGuessr blog: Türkiye coğrafyası, konum tahmin taktikleri, bölge rehberleri ve oyun ipuçları. Türkçe içeriklerle coğrafya bilgini geliştir.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  return (
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
            Blog
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Türkiye coğrafyası, konum tahmin taktikleri ve oyun rehberleri.
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
  );
}
