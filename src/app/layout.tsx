import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TürkiyeGuessr - Multiplayer Konum Tahmin Oyunu",
  description: "Arkadaşlarınla Türkiye'yi keşfet!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
