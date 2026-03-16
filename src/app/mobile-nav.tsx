"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function MobileNav({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 flex-col items-center justify-center gap-1.5"
        aria-label="Toggle menu"
      >
        <span
          className={`h-0.5 w-5 bg-zinc-400 transition-all ${open ? "translate-y-2 rotate-45" : ""}`}
        />
        <span
          className={`h-0.5 w-5 bg-zinc-400 transition-all ${open ? "opacity-0" : ""}`}
        />
        <span
          className={`h-0.5 w-5 bg-zinc-400 transition-all ${open ? "-translate-y-2 -rotate-45" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
          <div className="flex flex-col gap-1 px-6 py-4 font-mono text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 transition-colors ${
                  pathname === link.href
                    ? "bg-green-400/10 text-green-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-green-400"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
