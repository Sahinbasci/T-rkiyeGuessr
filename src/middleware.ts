import { NextRequest, NextResponse } from "next/server";

const MAINTENANCE_HTML = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Bakım Çalışması — TürkiyeGuessr</title>
<style>
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;padding:0;height:100%;background:#0a0a0f;color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  body{display:flex;align-items:center;justify-content:center;padding:24px;text-align:center}
  .card{max-width:560px;background:#13131a;border:1px solid #26262e;border-radius:18px;padding:40px 28px;box-shadow:0 10px 40px rgba(0,0,0,.4)}
  .flag{font-size:54px;line-height:1;margin-bottom:18px}
  h1{margin:0 0 12px;font-size:28px;letter-spacing:-.01em}
  p{margin:0 0 14px;color:#c9c9d4;line-height:1.55;font-size:16px}
  .small{color:#8a8a99;font-size:14px;margin-top:18px}
  a{color:#ef4444;text-decoration:none}
  a:hover{text-decoration:underline}
</style>
</head>
<body>
  <main class="card" role="main">
    <div class="flag" aria-hidden="true">🇹🇷</div>
    <h1>Sitemiz şu anda bakımda</h1>
    <p>TürkiyeGuessr geçici olarak hizmet dışıdır. Bakım çalışmamızı en kısa sürede tamamlayıp tekrar açacağız.</p>
    <p>Anlayışınız için teşekkür ederiz.</p>
    <p class="small">İletişim: <a href="mailto:sahinbasci2002@gmail.com">sahinbasci2002@gmail.com</a></p>
  </main>
</body>
</html>`;

export function middleware(_req: NextRequest) {
  return new NextResponse(MAINTENANCE_HTML, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      "retry-after": "3600",
      "x-robots-tag": "noindex",
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemap|api/sitemap-index|ads.txt|manifest.json|icon-192.png|icon-512.png|apple-touch-icon.png|og-image.png).*)",
  ],
};
