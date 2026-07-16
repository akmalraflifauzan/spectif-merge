import type { Metadata } from "next";
import { Pixelify_Sans } from "next/font/google";
import "./globals.css";

// next/font mengunduh font saat BUILD lalu meng-host-nya sendiri.
// Jadi tidak ada permintaan ke server luar saat pemain membuka game.
const pixel = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Block Merge",
  description: "Gabungkan blok, raih skor setinggi mungkin!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${pixel.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
