/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  async headers() {
    return [
      {
        // Apply security headers to all pages EXCEPT crawler files (sitemap, robots, ads.txt)
        source: "/((?!sitemap\\.xml|sitemap/.*|robots\\.txt|ads\\.txt).*)",
        headers: [
          {
            key: "Content-Security-Policy",
            // BUG-009 NOTE: unsafe-eval + unsafe-inline are REQUIRED by:
            //   - Google Maps JS API (uses eval internally for tile rendering)
            //   - Google AdSense pagead2.js (dynamic ad code execution)
            //   - ConsentModeInit inline script (must run before any 3rd-party scripts)
            //   - JSON-LD structured data (dangerouslySetInnerHTML)
            // Nonce-based CSP is not feasible with these external dependencies.
            // This is a known trade-off accepted by most Google API consumers.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com https://pagead2.googlesyndication.com https://*.googleadservices.com https://adservice.google.com https://www.googletagservices.com https://tpc.googlesyndication.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://fundingchoicesmessages.google.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.googleusercontent.com https://pagead2.googlesyndication.com https://*.doubleclick.net https://www.google.com https://googleads.g.doubleclick.net",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.googleapis.com https://*.google.com https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com https://firebaseinstallations.googleapis.com https://pagead2.googlesyndication.com https://*.doubleclick.net https://*.googlesyndication.com https://*.googleadservices.com https://adservice.google.com.tr https://partner.googleadservices.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google",
              "frame-src 'self' https://*.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://fundingchoicesmessages.google.com",
              "worker-src 'self' blob:",
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // All SEO content + legal pages — edge-cached 7d, browser-cached 1d
        source: "/(nasil-oynanir|multiplayer|sss|hakkimizda|iletisim|geoguessr-alternatifi|turkiye-harita-oyunu|sehir-tahmin-oyunu|ucretsiz-cografya-oyunu|konum-tahmin-oyunu|bolgeler|sehirler|blog|gizlilik-politikasi|cerez-politikasi|kullanim-kosullari|kvkk)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, s-maxage=604800" },
        ],
      },
      {
        // Dynamic SEO subpages (cities, regions, blog posts)
        source: "/(sehirler|bolgeler|blog)/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, s-maxage=604800" },
        ],
      },
      {
        // Static assets — immutable long-term cache
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
