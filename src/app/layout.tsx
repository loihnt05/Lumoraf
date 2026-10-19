import type { Metadata } from "next";
import { Inter, Pinyon_Script } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const pinyonScript = Pinyon_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pinyon",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Lumora — Thoughtful stays", template: "%s | Lumora" },
  description: "A little space to slow down. Thoughtful homestays by Lumora.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${inter.variable} ${pinyonScript.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
