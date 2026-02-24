export function GET() {
  const body =
    "google.com, pub-4031611961368310, DIRECT, f08c47fec0942fa0\n";
  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
}
