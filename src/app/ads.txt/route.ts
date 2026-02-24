export function GET() {
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.replace("ca-", "") ?? "pub-4031611961368310";
  const body = `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
