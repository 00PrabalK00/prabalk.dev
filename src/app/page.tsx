import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

/**
 * The door.
 *
 * Two ways in: the cinematic one and the plain one. Deliberately a static
 * server component with no client JavaScript at all — the whole point is that
 * whichever door you pick, the choosing itself is instant. Nothing here imports
 * three, lenis or framer-motion, so none of that is fetched until someone
 * actually asks for it.
 */

export const metadata: Metadata = {
  title: "Prabal Khare — Robotics Software Engineer",
  description:
    "Robotics software engineer building ROS 2 autonomy stacks for real robots. Pick your poison: the cinematic version, or the one that loads in a blink.",
  alternates: { canonical: `${SITE_URL}/` },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: "Robotics Software Engineer",
  email: `mailto:${profile.email}`,
  url: SITE_URL,
  sameAs: [profile.github, profile.linkedin, profile.youtube, profile.botopsy],
};

export default function Door() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <main className="flex min-h-dvh flex-1 flex-col bg-ink">
        {/* Name up top, so the choice is never the first thing you read. */}
        <header className="px-6 pt-10 sm:px-12 sm:pt-14">
          <p className="mono text-[11px] tracking-[0.24em] text-accent uppercase">
            {profile.name}
          </p>
          <p className="mono mt-2 text-[11px] tracking-[0.18em] text-mute uppercase">
            Robotics Software Engineer · {profile.location}
          </p>
        </header>

        <div className="flex flex-1 flex-col items-stretch gap-4 px-6 py-10 sm:px-12 lg:flex-row lg:gap-6 lg:py-16">
          <DoorCard
            href="/cool-kids"
            eyebrow="Option A"
            title="Cool Kids Website"
            blurb="A 3D flight through six robots, scored to your scroll wheel. WebGL, a real-time renderer, and a camera that does not sit still."
            notes={["Best on a laptop", "Takes a moment to load", "Worth it"]}
            tone="accent"
          />

          <DoorCard
            href="/boring"
            eyebrow="Option B"
            title="Boring Website"
            blurb="White background. Black text. Every project, every role, every patent — laid out like a normal portfolio by someone with somewhere else to be."
            // Measured, not asserted: 208 KB gzipped and that is everything it
            // ever loads, against 233 KB before the cinematic route has even
            // mounted its canvas and 480 KB once it has.
            notes={["No WebGL", "Under half the JavaScript", "Loads instantly"]}
            tone="plain"
            aside="ps. more optimized"
          />
        </div>

        <footer className="px-6 pb-8 sm:px-12">
          <p className="mono text-[10px] tracking-[0.16em] text-mute/70 uppercase">
            Either door reaches the same robots.
          </p>
        </footer>
      </main>
    </>
  );
}

function DoorCard({
  href,
  eyebrow,
  title,
  blurb,
  notes,
  tone,
  aside,
}: {
  href: string;
  eyebrow: string;
  title: string;
  blurb: string;
  notes: string[];
  tone: "accent" | "plain";
  aside?: string;
}) {
  const accent = tone === "accent";

  return (
    <Link
      href={href}
      className={`group relative flex flex-1 flex-col justify-between overflow-hidden border p-7 transition-colors sm:p-10 ${
        accent
          ? "border-accent/35 bg-accent/[0.04] hover:border-accent hover:bg-accent/[0.09]"
          : "border-line bg-bone/[0.03] hover:border-bone/60 hover:bg-bone/[0.07]"
      }`}
    >
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <span
            className={`mono text-[10px] tracking-[0.22em] uppercase ${
              accent ? "text-accent" : "text-mute"
            }`}
          >
            {eyebrow}
          </span>
          {aside && (
            <span className="mono text-[10px] tracking-[0.14em] text-mute/70 lowercase">
              {aside}
            </span>
          )}
        </div>

        <h2
          className={`mt-5 text-[2rem] leading-[1.05] font-semibold tracking-[-0.03em] sm:text-[2.6rem] ${
            accent ? "text-bone" : "text-bone/90"
          }`}
        >
          {title}
        </h2>

        <p className="mt-5 max-w-[42ch] text-[15px] leading-[1.65] text-bone/70">
          {blurb}
        </p>
      </div>

      <ul className="mt-9 flex flex-wrap gap-x-5 gap-y-2">
        {notes.map((n) => (
          <li
            key={n}
            className="mono text-[10px] tracking-[0.14em] text-mute uppercase"
          >
            {n}
          </li>
        ))}
      </ul>

      <span
        className={`mono mt-8 inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase transition-colors ${
          accent ? "text-accent" : "text-bone/70 group-hover:text-bone"
        }`}
      >
        Enter
        <span aria-hidden className="transition-transform group-hover:translate-x-1">
          →
        </span>
      </span>
    </Link>
  );
}
