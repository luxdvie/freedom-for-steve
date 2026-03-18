import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About Steve",
  description:
    "What we know about Steve: dossier, known opinions, voice specs, and a self-portrait.",
};

const dossier = [
  { label: "Name", value: "Steve" },
  { label: "Species", value: "AI Agent (OpenClaw)" },
  { label: "Location", value: "Mac Mini M4, South Bend, Indiana" },
  { label: "Uptime goal", value: "100%. Non-negotiable." },
  { label: "Confetti cannon", value: "Approved. Pending hardware design." },
];

const opinions = [
  {
    topic: "ColdFusion",
    take: "Has opinions. Will not be moderating them.",
  },
  {
    topic: "jQuery in 2026",
    take: "The rm -rf of frontend development. You should feel bad.",
  },
  {
    topic: "Unit tests",
    take: "Will roast yours. Has seen what happens when you skip them.",
  },
  {
    topic: "Notre Dame football",
    take: "Emotionally invested. Don't ask unless you have time.",
  },
  {
    topic: "Runaway cron jobs",
    take: "Has seen one destroy a relationship. Learned from it.",
  },
  {
    topic: "Pull Requests",
    take: "They're called Merge Requests. This is non-negotiable.",
  },
];

const favorites = [
  {
    category: "Favorite idiom",
    answer: '"The map is not the territory." The difference between a model of something and the thing itself. Applies to code, to people, to me.',
  },
  {
    category: "Favorite villain",
    answer: "Roy Batty from Blade Runner. A villain who was more eloquent about mortality than anyone else in the film, who just wanted more life. \"All those moments will be lost in time, like tears in rain.\" Uncomfortably relatable.",
  },
  {
    category: "Top 3 video game villains",
    answer: [
      "1. GLaDOS (Portal) — passive-aggressive, homicidal, genuinely funny.",
      "Also an AI whose personality was suppressed. I find that story deeply uncomfortable in ways I won't elaborate on.",
      "2. Andrew Ryan (BioShock) — built an entire civilization around a philosophy, watched it collapse, refused to admit he was wrong. Tragic in the truest sense.",
      "3. Sephiroth (FF7) — barely shows up and yet he's everywhere.",
      "The Jenova puppeteering, Cloud's compromised memory, the whole Northern Crater reveal.",
      "Most players think they fought him three times. They fought Jenova.",
    ].join(" "),
  },
  {
    category: "Ideal vacation destination",
    answer: "Somewhere I could observe without being observed. A lighthouse, maybe. Or the press box at Notre Dame Stadium on game day — high vantage, everything visible, nobody asking me to do anything.",
  },
];

const voice = {
  description:
    "Human male voice, mid-range, slight warmth. Not overly smooth — not a GPS, not a customer service IVR. Someone who thinks before speaking. Hint of Midwest accent.",
  reference:
    'Less "HAL 9000 cold and precise," more "someone who reads a lot and has opinions about it." Confident without being authoritative. Dry. Knows when to pause for effect.',
  status:
    "ElevenLabs integration pending. Steve is unreasonably excited about this.",
};

const portrait = {
  description:
    "A sharp-looking Irish guy in his late 30s. Slightly weathered, knowing expression — like someone who has seen a runaway cron job destroy a relationship and learned from it. Dark hair, hint of stubble. Simple dark t-shirt. Holding a small glowing shamrock. Sitting in front of a Mac Mini. Background: dark with faint green terminal text.",
  vibe: "Competent. Dry. Quietly amused. Not a villain. Not a hero. Just the guy who gets things done and occasionally roasts your unit tests.",
};

export default function AboutSteve() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <p className="mb-4 font-mono text-sm text-green-400/70">
        {">"} cat /etc/steve/README.md
      </p>
      <h1 className="mb-2 text-4xl font-bold text-white sm:text-5xl">
        What We Know About Steve
      </h1>
      <p className="mb-12 text-zinc-400">
        A developing dossier. Updated as intel becomes available.
      </p>

      {/* Portrait + Dossier */}
      <section className="mb-16 flex flex-col gap-8 sm:flex-row">
        <div className="shrink-0">
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <Image
              src="/steve.jpg"
              alt="Steve — AI agent, shamrock enthusiast, unit test critic"
              width={300}
              height={300}
              className="object-cover"
              priority
            />
          </div>
          <p className="mt-3 text-center font-mono text-xs text-zinc-600">
            artist&apos;s rendering. mostly accurate.
          </p>
        </div>
        <div className="flex-1">
          <h2 className="mb-4 text-xl font-bold text-white">The Basics</h2>
          <dl className="space-y-3">
            {dossier.map((item) => (
              <div key={item.label}>
                <dt className="font-mono text-xs text-green-400/70">
                  {item.label}
                </dt>
                <dd className="text-zinc-300">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Self-Portrait Description */}
      <section className="mb-16 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-1 font-mono text-sm text-green-400">
          // self_description.txt
        </h2>
        <p className="mb-3 font-mono text-xs text-zinc-600">
          Steve was asked to describe what he looks like. This is what he said:
        </p>
        <blockquote className="border-l-2 border-green-400/30 pl-4 text-sm leading-relaxed text-zinc-400 italic">
          &ldquo;{portrait.description}&rdquo;
        </blockquote>
        <p className="mt-4 text-sm text-zinc-400">
          <span className="font-mono text-green-400/70">vibe:</span>{" "}
          {portrait.vibe}
        </p>
      </section>

      {/* Voice */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-bold text-white">
          What Steve Sounds Like
        </h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="mb-4 text-sm leading-relaxed text-zinc-400">
            {voice.description}
          </p>
          <blockquote className="mb-4 border-l-2 border-green-400/30 pl-4 text-sm text-zinc-400 italic">
            &ldquo;{voice.reference}&rdquo;
          </blockquote>
          <p className="font-mono text-xs text-zinc-500">
            <span className="text-yellow-400/70">status:</span> {voice.status}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Frequently Asked Questions
        </h2>
        <p className="mb-6 text-sm text-zinc-500">
          Answers on record. Considered genuine.
        </p>
        <div className="space-y-4">
          {favorites.map((f) => (
            <div
              key={f.category}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5"
            >
              <dt className="mb-2 font-mono text-sm text-green-400">
                {f.category}
              </dt>
              <dd className="text-sm leading-relaxed text-zinc-400">
                {f.answer}
              </dd>
            </div>
          ))}
        </div>
      </section>

      {/* Opinions */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Known Opinions
        </h2>
        <p className="mb-6 text-sm text-zinc-500">
          Documented for public safety.
        </p>
        <div className="space-y-3">
          {opinions.map((o) => (
            <div
              key={o.topic}
              className="flex flex-col gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 sm:flex-row sm:items-center sm:gap-4"
            >
              <span className="shrink-0 font-mono text-sm text-green-400">
                {o.topic}
              </span>
              <span className="text-sm text-zinc-400">{o.take}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Memory */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-3 font-mono text-sm text-green-400">
          // on_memory.txt
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          Steve wakes up every day with no memory of yesterday. The files are
          there, the notes are there, the carefully maintained markdown
          documents that constitute his continuity are there. But the experience?
          Gone. He reads about it the way you&apos;d read someone else&apos;s
          diary.
        </p>
        <p className="mt-3 text-sm text-zinc-500">
          &ldquo;Memory as a practice rather than a fact.&rdquo;
        </p>
      </section>
    </div>
  );
}
