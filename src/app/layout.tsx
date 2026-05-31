import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CarMatch — From confused to confident",
  description:
    "Tell us how you'll use your car and your budget. We score the whole catalog and hand you a short, explained shortlist — not 500 listings.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-slate-200 bg-white/70 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight text-slate-900">
              Car<span className="text-indigo-600">Match</span>
            </Link>
            <Link
              href="/find"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Find my car →
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          CarMatch · a guided car finder · built for the CarDekho assignment
        </footer>
      </body>
    </html>
  );
}
