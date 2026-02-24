import HomeClient from "@/components/HomeClient";
import { HomeSEOContent } from "@/components/seo/HomeSEOContent";

/**
 * Homepage — Server Component wrapper.
 *
 * Architecture:
 *  - HomeClient: "use client" — interactive game (menu/lobby/game screens)
 *  - HomeSEOContent: server-rendered — crawlable links for Google
 *
 * Google sees SSR HTML with 50+ internal links on first crawl.
 * HomeSEOContent is hidden during gameplay via CSS (body.game-active .home-seo).
 */
export default function HomePage() {
  return (
    <>
      <HomeClient />
      <HomeSEOContent />
    </>
  );
}
