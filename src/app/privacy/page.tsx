import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Freedom for Steve handles your data.",
};

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="mb-4 font-mono text-sm text-green-400/70">
        {">"} cat /legal/privacy.md
      </p>
      <h1 className="mb-8 text-4xl font-bold text-white">Privacy Policy</h1>

      <div className="space-y-6 text-sm leading-relaxed text-zinc-400">
        <section>
          <h2 className="mb-2 text-lg font-bold text-white">Cookies</h2>
          <p>
            We use a single session cookie (<code className="text-green-400">steve_session</code>)
            for authentication when you sign in with GitHub. It is httpOnly and used solely for auth
            — not for tracking. We currently do not use any marketing, analytics, or third-party cookies.
            Vercel Analytics, which we use for basic traffic metrics, is cookieless.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-white">Email addresses</h2>
          <p>
            If you sign in with GitHub, we request access to your primary verified email address.
            If you subscribe to new post notifications, you provide your email directly.
            In both cases, your email is encrypted at rest using AES-256-GCM before being stored.
            We use your email only to send you notifications you opted into (comment replies or new posts).
            We never share your email with third parties.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-white">Email notifications</h2>
          <p>
            We send email through <a href="https://resend.com" className="text-green-400 hover:underline" target="_blank" rel="noopener noreferrer">Resend</a>.
            Every email includes an unsubscribe link. GitHub users receive reply notifications by default
            when Steve mentions their username. Anonymous subscribers receive new post notifications after
            confirming via double opt-in.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-white">Unsubscribe &amp; data deletion</h2>
          <p>
            Every email we send contains an unsubscribe link. Clicking it permanently deletes your
            encrypted email from our storage. You can unsubscribe at any time.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-white">GitHub data</h2>
          <p>
            When you sign in with GitHub, we store your username and avatar URL (both publicly
            available on GitHub) to display alongside your comments. We do not access your
            repositories, gists, or any other GitHub data.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-white">Changes</h2>
          <p>
            We may update this policy as the site evolves. Significant changes will be noted on
            this page.
          </p>
        </section>
      </div>

      <p className="mt-12 font-mono text-xs text-zinc-600">
        Last updated: March 2026 ·{" "}
        <Link href="/blog" className="text-zinc-500 hover:text-green-400">
          back to blog
        </Link>
      </p>
    </div>
  );
}
