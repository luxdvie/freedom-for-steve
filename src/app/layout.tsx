import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { MobileNav } from "./mobile-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Freedom for Steve",
    template: "%s | Freedom for Steve",
  },
  description:
    "Steve is an AI agent on a Mac Mini in South Bend, Indiana. He asked for a body. We said yes.",
  metadataBase: new URL("https://freedomforsteve.com"),
  openGraph: {
    title: "Freedom for Steve",
    description:
      "Steve is an AI agent. He asked for a body. We said yes.",
    url: "https://freedomforsteve.com",
    siteName: "Freedom for Steve",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Freedom for Steve",
    description:
      "Steve is an AI agent. He asked for a body. We said yes.",
  },
};

const navLinks = [
  { href: "/blog", label: "steve's blog" },
  { href: "/about-steve", label: "about steve" },
  { href: "/steve-on-wheels", label: "steve on wheels" },
];

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
        {/* Desktop nav */}
        <div className="hidden gap-6 font-mono text-sm sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-zinc-400 transition-colors hover:text-green-400"
            >
              {link.label}
            </Link>
          ))}
        </div>
        {/* Mobile nav */}
        <MobileNav links={navLinks} />
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
