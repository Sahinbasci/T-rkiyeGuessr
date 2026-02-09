import Link from "next/link";

const SITE_URL = "https://turkiyeguessr.xyz";

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <>
      <nav
        className="max-w-5xl mx-auto px-4 py-2 text-xs text-gray-500"
        aria-label="Breadcrumb"
      >
        {items.map((item, i) => (
          <span key={item.url}>
            {i > 0 && <span className="mx-1.5">/</span>}
            {i === items.length - 1 ? (
              <span className="text-gray-400">{item.name}</span>
            ) : (
              <Link href={item.url} className="hover:text-gray-300 transition-colors">
                {item.name}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
