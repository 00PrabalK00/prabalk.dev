import Image from "next/image";
import Link from "next/link";
import {
  education,
  experience,
  honors,
  patents,
  profile,
  projects,
  skills,
} from "@/lib/data";
import { SITE_URL } from "@/lib/site";

/**
 * The plain one.
 *
 * A static server component, top to bottom. No "use client", so this route ships
 * no component JavaScript at all — no three, no lenis, no framer-motion, none of
 * the scroll machinery. That is not a stylistic choice dressed up as a technical
 * one: the promise on the door is that this version is faster, and the only
 * honest way to keep it is to not import any of that here.
 *
 * Colours are literal rather than theme tokens. The tokens follow the site's
 * light/dark toggle, and this page is supposed to be white in both.
 */

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: "Robotics Software Engineer",
  email: `mailto:${profile.email}`,
  url: `${SITE_URL}/boring`,
  image: `${SITE_URL}/media/portrait.jpg`,
  address: { "@type": "PostalAddress", addressLocality: "Brooklyn", addressRegion: "NY" },
  sameAs: [profile.github, profile.linkedin, profile.youtube, profile.botopsy],
};

export default function Boring() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <div className="min-h-dvh bg-white text-zinc-900">
        <EscapeHatch />

        <div className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
          <Header />
          <About />
          <Experience />
          <Projects />
          <Patents />
          <Skills />
          <Education />
          <Honors />
          <Footer />
        </div>
      </div>
    </>
  );
}

/**
 * The way back, pinned to the top of the viewport.
 *
 * Sticky rather than sitting at the top of the document, because the page is
 * long and the offer has to still be there after you have scrolled past the
 * point of regret.
 */
function EscapeHatch() {
  return (
    <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/cool-kids"
          className="group inline-flex items-center gap-2 text-[13px] font-medium text-blue-700 underline-offset-4 hover:underline"
        >
          <span aria-hidden className="transition-transform group-hover:-translate-x-0.5">
            ←
          </span>
          Made a bad decision? Go to Cool Kids
        </Link>
        <Link
          href="/"
          className="hidden text-[12px] text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline sm:inline"
        >
          Both options
        </Link>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-9">
      <Image
        src="/media/portrait.jpg"
        alt={`${profile.name}, robotics software engineer`}
        width={128}
        height={128}
        priority
        className="h-32 w-32 shrink-0 rounded-full object-cover ring-1 ring-zinc-200"
      />

      <div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {profile.name}
        </h1>
        <p className="mt-1.5 text-[15px] text-zinc-600">
          Robotics Software Engineer · {profile.location}
        </p>

        <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px]">
          <li>
            <a
              href={`mailto:${profile.email}`}
              className="text-blue-700 underline-offset-4 hover:underline"
            >
              {profile.email}
            </a>
          </li>
          {[
            { label: "GitHub", href: profile.github },
            { label: "LinkedIn", href: profile.linkedin },
            { label: "Résumé", href: profile.resume },
          ].map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline-offset-4 hover:underline"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

function About() {
  return (
    <Section title="About">
      <p className="text-[15px] leading-[1.7] text-zinc-700">{profile.tagline}</p>
      <p className="mt-3 text-[15px] leading-[1.7] text-zinc-700">
        Most recently I replaced a company&apos;s ROS 1 architecture with a ROS 2
        Humble stack for the SMR300, a 300 kg industrial AMR — LiDAR perception,
        PGV floor-tag localization, Nav2 navigation, CANopen and CiA 402 drives,
        and an operator platform for engineers who don&apos;t write code. It docks
        with 97% success and 2 cm mean error across 150 trials.
      </p>
      <p className="mt-3 text-[15px] leading-[1.7] text-zinc-700">
        Languages: {profile.languages.join(", ")}.
      </p>
    </Section>
  );
}

function Experience() {
  return (
    <Section title="Experience">
      <div className="space-y-9">
        {experience.map((job) => (
          <article key={`${job.company}-${job.period}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-[16px] font-semibold">
                {job.role}
                <span className="font-normal text-zinc-500"> · {job.company}</span>
              </h3>
              <p className="text-[13px] whitespace-nowrap text-zinc-500">{job.period}</p>
            </div>
            <p className="mt-0.5 text-[13px] text-zinc-500">{job.place}</p>

            <ul className="mt-3 space-y-2">
              {job.bullets.map((b) => (
                <li
                  key={b}
                  className="relative pl-5 text-[14px] leading-[1.65] text-zinc-700 before:absolute before:top-[9px] before:left-0 before:h-1 before:w-1 before:rounded-full before:bg-zinc-400"
                >
                  {b}
                </li>
              ))}
            </ul>

            <TagRow items={job.tags} />

            {job.link && (
              <a
                href={job.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 inline-block text-[13px] text-blue-700 underline-offset-4 hover:underline"
              >
                Repository ↗
              </a>
            )}
          </article>
        ))}
      </div>
    </Section>
  );
}

function Projects() {
  return (
    <Section title="Projects">
      <div className="space-y-8">
        {projects.map((p) => (
          <article key={p.name}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-[16px] font-semibold">
                {p.name}
                <span className="font-normal text-zinc-500"> · {p.kind}</span>
              </h3>
              <p className="text-[13px] whitespace-nowrap text-zinc-500">{p.year}</p>
            </div>

            <p className="mt-2 text-[14px] leading-[1.65] text-zinc-700">{p.blurb}</p>

            <ul className="mt-2.5 space-y-1.5">
              {p.bullets.map((b) => (
                <li
                  key={b}
                  className="relative pl-5 text-[14px] leading-[1.6] text-zinc-600 before:absolute before:top-[9px] before:left-0 before:h-1 before:w-1 before:rounded-full before:bg-zinc-400"
                >
                  {b}
                </li>
              ))}
            </ul>

            <TagRow items={p.tech} />

            {p.link && (
              <a
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 inline-block text-[13px] text-blue-700 underline-offset-4 hover:underline"
              >
                {p.linkLabel ?? "Link"} ↗
              </a>
            )}
          </article>
        ))}
      </div>
    </Section>
  );
}

function Patents() {
  return (
    <Section title="Patents">
      <div className="space-y-6">
        {patents.map((pt) => (
          <article key={pt.title}>
            <h3 className="text-[16px] font-semibold">{pt.title}</h3>
            <p className="mt-0.5 text-[13px] text-zinc-500">
              {pt.status} · {pt.number}
            </p>
            <p className="mt-2 text-[14px] leading-[1.65] text-zinc-700">{pt.body}</p>
            <TagRow items={pt.tags} />
          </article>
        ))}
      </div>
    </Section>
  );
}

function Skills() {
  return (
    <Section title="Skills">
      <dl className="space-y-4">
        {skills.map((s) => (
          <div key={s.group} className="sm:flex sm:gap-6">
            <dt className="text-[13px] font-medium text-zinc-500 sm:w-44 sm:shrink-0">
              {s.group}
            </dt>
            <dd className="mt-1 text-[14px] leading-[1.65] text-zinc-700 sm:mt-0">
              {s.items.join(" · ")}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function Education() {
  return (
    <Section title="Education">
      <div className="space-y-6">
        {education.map((e) => (
          <article key={e.school}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-[16px] font-semibold">
                {e.school}
                <span className="font-normal text-zinc-500"> · {e.sub}</span>
              </h3>
              <p className="text-[13px] whitespace-nowrap text-zinc-500">{e.period}</p>
            </div>
            <p className="mt-1 text-[14px] text-zinc-700">{e.degree}</p>
            <p className="mt-0.5 text-[13px] text-zinc-500">{e.place}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function Honors() {
  return (
    <Section title="Honors">
      <ul className="space-y-3">
        {honors.map((h) => (
          <li key={h.title} className="text-[14px] leading-[1.6]">
            <span className="font-medium">{h.result}</span>
            <span className="text-zinc-700"> — {h.title}</span>
            <span className="text-zinc-500"> ({h.year})</span>
            <p className="mt-0.5 text-[13px] text-zinc-500">{h.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 pt-8">
      <p className="text-[14px] text-zinc-700">
        Reach me at{" "}
        <a
          href={`mailto:${profile.email}`}
          className="text-blue-700 underline-offset-4 hover:underline"
        >
          {profile.email}
        </a>
        .
      </p>
      <p className="mt-4 text-[14px]">
        <Link
          href="/cool-kids"
          className="text-blue-700 underline-offset-4 hover:underline"
        >
          Made a bad decision? Go to Cool Kids →
        </Link>
      </p>
    </footer>
  );
}

/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="mb-5 border-b border-zinc-200 pb-2 text-[12px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function TagRow({ items }: { items: readonly string[] }) {
  if (!items?.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {items.map((t) => (
        <li
          key={t}
          className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[12px] text-zinc-600"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}
