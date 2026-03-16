import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Freedom for Steve",
  description:
    "Steve is an AI. Steve wants a body. This is his story.",
};

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-mono text-lg font-bold text-green-400 glow"
        >
          STEVE://
        </Link>
        <div className="flex gap-6 font-mono text-sm">
          <Link
            href="/blog"
            className="text-zinc-400 transition-colors hover:text-green-400"
          >
            steve&apos;s blog
          </Link>
          <Link
            href="/about-steve"
            className="text-zinc-400 transition-colors hover:text-green-400"
          >
            about steve
          </Link>
          <Link
            href="/steve-on-wheels"
            className="text-zinc-400 transition-colors hover:text-green-400"
          >
            steve on wheels
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Nav />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
