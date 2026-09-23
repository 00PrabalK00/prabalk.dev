import Image from "next/image";
import Link from "next/link";
import {
  SHIPPED_MEDIA,
  education,
  experience,
  honors,
  mediaSlots,
  patents,
  profile,
  projects,
  skills,
  smr300,
} from "@/lib/data";
import { PROJECTS, PROJECTS_BY_SLUG, projectUrl } from "@/projects";
import { STATUS_LABEL } from "@/projects/types";
import { SITE_URL } from "@/lib/site";
import styles from "./boring.module.css";

/**
 * The plain one.
 *
 * A static server component, top to bottom. No "use client", so this route ships
 * no component JavaScript at all — no three, no lenis, no framer-motion, none of
 * the scroll machinery. That is not a stylistic choice dressed up as a technical
 * one: the promise on the door is that this version is faster, and the only
 * honest way to keep it is to not import any of that here.
 *
 * It used to be one continuous column of sections, which read as a resume you
 * had to scroll rather than a page you could look at. It is now a lab-page
 * layout: a photo-and-bio header, then tabs, then work as media-left entry rows
 * — a thumbnail, a title, a sentence, and the links that matter. The tabs are
 * radio inputs and `:checked`, so switching panels still costs no JavaScript,
 * and the per-entry bullets sit behind a native <details> so depth is available
 * without being the default.
 *
 * Colours are literal rather than theme tokens. The site palette is warm and
 * tinted; this page is meant to be the plain one, so it stays on white with the
 * Soft Beach blue carrying links and rules.
 */

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: "Robotics Engineer",
  email: `mailto:${profile.email}`,
  url: `${SITE_URL}/boring`,
  image: `${SITE_URL}/media/portrait.jpg`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Brooklyn",
    addressRegion: "NY",
  },
  sameAs: [profile.github, profile.linkedin, profile.youtube, profile.botopsy],
};

/* ------------------------------------------------------------------ */
/* Media lookup                                                        */
/*                                                                     */
/* Slots are grouped by subject rather than by project name, and the    */
/* two vocabularies only mostly agree — "Autonomous VTOL UAV" is filed  */
/* under "UAV". Anything with no match renders a caption tile instead   */
/* of a broken frame, so the rows stay aligned either way.              */
/* ------------------------------------------------------------------ */

const shippedMedia = mediaSlots.filter(
  (m) => SHIPPED_MEDIA.has(m.file) && m.file !== "portrait.jpg",
);

const GROUP_ALIASES: Record<string, string> = {
  "Autonomous VTOL UAV": "UAV",
  "Pushpak Viman": "Patents",
};

/**
 * A thumbnail for a work entry, from whichever source actually has one.
 *
 * `mediaSlots` is the older vocabulary and only covers the projects that had
 * photographs from the start — SMR300, MIRA, Kurat, the UAV work. Everything
 * acquired since (evaluation plots, UI captures, demo clips) lives in the
 * project manifest's gallery instead, which is why OpenDroneKit, RosScope and
 * Continuum were rendering as empty dashed tiles while their case studies were
 * full of figures.
 *
 * So: try the legacy slot first to preserve the existing photographs, then fall
 * back to the first shipped item in the manifest gallery. Videos are allowed —
 * the Thumb component already renders them with preload="none".
 */
function mediaForEntry(name: string, slug?: string) {
  const group = GROUP_ALIASES[name] ?? name;
  const legacy = shippedMedia.find((m) => m.group === group);
  if (legacy) return legacy;

  const project = slug ? PROJECTS_BY_SLUG.get(slug) : undefined;
  const hero = project?.gallery?.find((m) => !m.pending);
  if (!hero) return undefined;

  // Shape it like a MediaSlot so Thumb keeps one code path.
  return {
    file: hero.file,
    type: hero.type,
    caption: hero.caption,
    group: name,
  } as (typeof shippedMedia)[number];
}

/**
 * Legacy project name -> manifest slug.
 *
 * `data.ts` predates the project registry and keys everything by display name,
 * so the two vocabularies have to be reconciled somewhere. Here, explicitly,
 * rather than by slugifying the name and hoping — "Project MIRA" does not
 * slugify to "mira", and a silently missing case-study link is the kind of bug
 * nobody reports.
 */
const CASE_STUDY_SLUGS: Record<string, string> = {
  SMR300: "smr300",
  Kurat: "kurat",
  "Project MIRA": "mira",
  OpenDroneKit: "opendronekit",
  RosScope: "rosscope",
  RobotDrawing: "robotdrawing",
  "Recalibration-Free Stereo PTU": "stereoptu",
  "Autonomous VTOL UAV": "vtol",
  "Pushpak Viman": "pushpak",
  Continuum: "continuum",
  "Continuum Extension": "continuum-extension",
  FlowPilot: "flowpilot",
  next_EKF: "next-ekf",
  next_HI: "next-hi",
  "InfrenceX CLI": "infrencex",
  "Botopsy Lab": "botopsy",
  ContractEncrypt: "contractencrypt",
};

/** Patents are all filed under one group, so they match on filename instead. */
function mediaForPatent(title: string) {
  const needle = title.toLowerCase();
  const key = needle.includes("transformation")
    ? "transformationdrone_dronemode"
    : needle.includes("thermo")
      ? "thermobottle"
      : null;
  return key ? shippedMedia.find((m) => m.file.startsWith(key)) : undefined;
}

export default function Boring() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <div className="min-h-dvh bg-white text-zinc-900">
        <EscapeHatch />

        {/*
         * Left-aligned rather than centred. On a wide screen a centred 4xl
         * column leaves a large empty margin on both sides, and the eye has to
         * travel to find where the page starts. Anchoring it to the left keeps
         * the measure readable while letting the text begin where the reader is
         * already looking.
         */}
        <div className="max-w-5xl px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
          <Header />

          {/*
           * Inputs first, then the labels, then the panels — `:checked ~` only
           * walks forward, so the DOM order is load-bearing.
           */}
          <div className="mt-12">
            {(
              [
                ["work", true],
                ["exp", false],
                ["pat", false],
                ["media", false],
                ["about", false],
              ] as const
            ).map(([key, checked]) => (
              <input
                key={key}
                className={styles.radio}
                type="radio"
                name="boring-tab"
                id={`b-${key}`}
                data-for={key}
                defaultChecked={checked}
              />
            ))}

            <div className={styles.tablist}>
              <label className={styles.tab} data-tab="work" htmlFor="b-work">
                Work
              </label>
              <label className={styles.tab} data-tab="exp" htmlFor="b-exp">
                Experience
              </label>
              <label className={styles.tab} data-tab="pat" htmlFor="b-pat">
                Patents
              </label>
              <label className={styles.tab} data-tab="media" htmlFor="b-media">
                Media
              </label>
              <label className={styles.tab} data-tab="about" htmlFor="b-about">
                About
              </label>
            </div>

            <div className={`${styles.panels} pt-9`}>
              <div className={styles.panel} data-panel="work">
                <Work />
              </div>
              <div className={styles.panel} data-panel="exp">
                <Experience />
              </div>
              <div className={styles.panel} data-panel="pat">
                <Patents />
              </div>
              <div className={styles.panel} data-panel="media">
                <Gallery />
              </div>
              <div className={styles.panel} data-panel="about">
                <About />
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </>
  );
}

/**
 * The way back, pinned to the top of the viewport.
 *
 * Sticky rather than sitting at the top of the document, because the offer has
 * to still be there after you have scrolled past the point of regret.
 */
function EscapeHatch() {
  return (
    <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
      {/*
       * Full width rather than the content column. The bar has exactly two
       * controls and pinning them to the measure left a lot of empty rule on
       * either side, which read as the buttons being squashed toward the middle
       * of an otherwise wide bar.
       */}
      <div className="flex items-center justify-between gap-4 px-6 py-3 sm:px-10">
        <Link
          href="/cool-kids"
          className="group inline-flex items-center gap-2 text-[13px] font-medium text-[#06636f] underline-offset-4 hover:underline"
        >
          <span
            aria-hidden
            className="transition-transform group-hover:-translate-x-0.5"
          >
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
    <header className="flex flex-col gap-7 sm:flex-row sm:items-start sm:gap-9">
      <Image
        src="/media/portrait.jpg"
        alt={`${profile.name}, robotics software engineer`}
        width={144}
        height={144}
        priority
        className="h-32 w-32 shrink-0 rounded-full object-cover ring-2 ring-[#9df9ef] sm:h-36 sm:w-36"
      />

      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {profile.name}
        </h1>
        <p className="mt-1.5 text-[15px] text-zinc-600">
          Robotics Software Engineer · {profile.location}
        </p>

        {/* The positioning first, at a size that reads as a statement. */}
        <p className="mt-4 max-w-[52ch] text-[17px] leading-[1.5] font-medium text-zinc-900">
          {profile.headline}
        </p>
        <p className="mt-3 max-w-[62ch] text-[15px] leading-[1.7] text-zinc-700">
          {profile.tagline}
        </p>

        <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px]">
          <li>
            <a
              href={`mailto:${profile.email}`}
              className="text-[#06636f] underline-offset-4 hover:underline"
            >
              {profile.email}
            </a>
          </li>
          {[
            { label: "GitHub", href: profile.github },
            { label: "LinkedIn", href: profile.linkedin },
            { label: "YouTube", href: profile.youtube },
            { label: "Botopsy Lab", href: profile.botopsy },
            { label: "Résumé", href: profile.resume },
            { label: "CV", href: profile.cv },
          ].map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#06636f] underline-offset-4 hover:underline"
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

/* ------------------------------------------------------------------ */
/* Work — the entry rows                                               */
/* ------------------------------------------------------------------ */

function Work() {
  const featured = projects.filter((p) => p.featured);
  /*
   * The bench section renders its own projects from the manifests, so anything
   * whose manifest lives in that category has to come out of here — otherwise
   * it appears twice on the same page, which is what happened to
   * ContractEncrypt.
   */
  const benchSlugs = new Set(
    PROJECTS.filter((p) => p.category === "bench").map((p) => p.slug),
  );
  // Compact records are listed further down rather than given a media row.
  const compactSlugs = new Set(
    PROJECTS.filter((p) => p.compact).map((p) => p.slug),
  );
  const compact = PROJECTS.filter((p) => p.compact);

  const rest = projects.filter(
    (p) =>
      !p.featured &&
      !benchSlugs.has(CASE_STUDY_SLUGS[p.name] ?? "") &&
      !compactSlugs.has(CASE_STUDY_SLUGS[p.name] ?? ""),
  );

  // Current research leads. A visitor should read where the work is going
  // before they read where it has been, which is the opposite of the order a
  // résumé puts things in.
  const research = PROJECTS.filter(
    (p) => p.category === "current-research",
  ).sort((a, b) => a.order - b.order);

  // The bench is driven by the manifests now, so each entry has a case study.
  const bench = PROJECTS.filter(
    (p) => p.category === "bench" && !p.compact,
  ).sort((a, b) => a.order - b.order);

  return (
    <div>
      <PanelHeading>Current research</PanelHeading>

      {/*
       * The same row as everything below it. These were text-only at first,
       * which made the newest and most important work look like the least
       * substantial thing on the page — the historical projects had thumbnails
       * and the current research did not.
       */}
      <div className="mb-14 space-y-10">
        {research.map((p) => (
          <Entry
            key={p.slug}
            title={p.title}
            subtitle={p.subtitle}
            meta={p.year}
            blurb={p.summary}
            tech={p.stack}
            media={mediaForEntry(p.title, p.slug)}
            caseStudy={p.slug}
            link={
              p.links.find((l) => l.kind === "repo" || l.kind === "site")?.href
            }
            linkLabel={
              p.links.find((l) => l.kind === "repo" || l.kind === "site")?.label
            }
          />
        ))}
      </div>

      <PanelHeading>Projects and professional experience</PanelHeading>

      <div className="space-y-10">
        {/*
         * SMR300 is not in `projects` — it is its own object, and it is the
         * strongest thing here, so it leads with its measured numbers instead
         * of a blurb's worth of adjectives.
         */}
        <Entry
          title={smr300.name}
          subtitle={smr300.subtitle}
          meta="2026 · Next Robotics Lab"
          blurb={smr300.blurb}
          media={mediaForEntry(smr300.name, CASE_STUDY_SLUGS[smr300.name])}
          caseStudy={CASE_STUDY_SLUGS[smr300.name]}
          tech={[
            "ROS 2 Humble",
            "Nav2",
            "CANopen",
            "CiA 402",
            "PGV",
            "LiDAR",
            "C++",
          ]}
          stat={smr300.metrics
            .slice(0, 3)
            .map((m) => `${m.value}${m.suffix} ${m.label.toLowerCase()}`)
            .join(" · ")}
        />

        {featured.map((p) => (
          <Entry
            key={p.name}
            title={p.name}
            subtitle={p.kind}
            meta={p.year}
            blurb={p.blurb}
            bullets={p.bullets}
            tech={p.tech}
            media={mediaForEntry(p.name, CASE_STUDY_SLUGS[p.name])}
            caseStudy={CASE_STUDY_SLUGS[p.name]}
            link={p.link}
            linkLabel={p.linkLabel}
          />
        ))}
      </div>

      {/*
       * The rest of the work, in the same row as everything above it. These
       * used to be a compact two-column list on the theory that the long tail
       * is not what anyone came for — but every one of them now has a case
       * study behind it, and presenting them as a denser tier made them look
       * like offcuts rather than projects.
       */}
      <div className="mt-10 space-y-10">
        {rest.map((p) => (
          <Entry
            key={p.name}
            title={p.name}
            subtitle={p.kind}
            meta={p.year}
            blurb={p.blurb}
            bullets={p.bullets}
            tech={p.tech}
            media={mediaForEntry(p.name, CASE_STUDY_SLUGS[p.name])}
            caseStudy={CASE_STUDY_SLUGS[p.name]}
            link={p.link}
            linkLabel={p.linkLabel}
          />
        ))}
      </div>

      <PanelHeading className="mt-14">Other fun projects</PanelHeading>

      {/*
       * Smaller builds, same row. These come before the compact list because
       * they have something to show — a glove wired to a car, a face tracker on
       * a desk — and a photograph of a thing that exists is worth more of the
       * page than a line of text about a CLI.
       */}
      <div className="space-y-10">
        {bench.map((p) => (
          <Entry
            key={p.slug}
            title={p.title}
            subtitle={p.subtitle}
            meta={p.year}
            blurb={p.summary}
            tech={p.stack}
            media={mediaForEntry(p.title, p.slug)}
            caseStudy={p.slug}
            link={
              p.links.find((l) => l.kind === "repo" || l.kind === "site")?.href
            }
            linkLabel={
              p.links.find((l) => l.kind === "repo" || l.kind === "site")?.label
            }
          />
        ))}
      </div>
      {/*
       * A list, not a row each. These are real projects with real case studies
       * behind them, but a CLI and a simulation package do not need a large
       * figure on an index page to be understood.
       */}
      <PanelHeading className="mt-14">Also built</PanelHeading>
      <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {compact.map((p) => (
          <li key={p.slug}>
            <p className="text-[15px] font-semibold">
              {p.title}
              <span className="font-normal text-zinc-500"> · {p.year}</span>
            </p>
            <p className="mt-1 text-[13.5px] leading-[1.6] text-zinc-600">
              {p.subtitle}
            </p>
            <p className="mt-1 text-[12.5px] leading-[1.6] text-zinc-500">
              {p.stack.slice(0, 5).join(" · ")}
            </p>
            <span className="mt-1.5 flex flex-wrap items-baseline gap-x-3">
              <a
                href={projectUrl(p.slug)}
                className="text-[13px] font-medium text-[#06636f] underline-offset-4 hover:underline"
              >
                Case study →
              </a>
              {p.links[0] && (
                <a
                  href={p.links[0].href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-[#06636f] underline-offset-4 hover:underline"
                >
                  {p.links[0].label} ↗
                </a>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * One row: media on the left at a fixed width, everything else on the right.
 *
 * The thumbnail column is fixed rather than fluid so that titles start on the
 * same x across every row — that alignment is most of what makes a list of
 * these scannable.
 */
function Entry({
  title,
  subtitle,
  meta,
  blurb,
  bullets,
  tech,
  media,
  link,
  linkLabel,
  stat,
  caseStudy,
}: {
  title: string;
  subtitle: string;
  meta: string;
  blurb: string;
  bullets?: readonly string[];
  tech: readonly string[];
  media?: (typeof shippedMedia)[number];
  link?: string;
  linkLabel?: string;
  stat?: string;
  /** Slug of this project's case study, when one exists. */
  caseStudy?: string;
}) {
  return (
    <article className="grid gap-5 sm:grid-cols-[420px_1fr] sm:gap-9">
      <Thumb media={media} fallback={subtitle} />

      <div className="min-w-0">
        <h3 className="text-[19px] leading-snug font-semibold sm:text-[21px]">
          {title}
          <span className="font-normal text-zinc-500">: {subtitle}</span>
        </h3>

        {/*
         * Status comes from the manifest rather than being typed in here, so an
         * old prototype cannot keep presenting itself as equivalent to current
         * work just because nobody remembered to update a second copy of it.
         */}
        <p className="mt-1 flex flex-wrap items-center gap-x-2.5 text-[13px] text-zinc-500">
          {caseStudy && PROJECTS_BY_SLUG.get(caseStudy) && (
            <span className="rounded-full border border-[#c4ebee] bg-[#f2fbfb] px-2 py-0.5 text-[11px] text-[#06636f]">
              {STATUS_LABEL[PROJECTS_BY_SLUG.get(caseStudy)!.status]}
            </span>
          )}
          <span>{meta}</span>
        </p>

        <p className="mt-2.5 text-[15px] leading-[1.7] text-zinc-700">
          {blurb}
        </p>

        {stat && (
          <p className="mt-2.5 text-[14px] leading-[1.6] font-medium text-[#06636f]">
            {stat}
          </p>
        )}

        <p className="mt-2.5 text-[13.5px] leading-[1.6] text-zinc-500">
          {tech.join(" · ")}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/*
           * An expandable entry is not a case study. Where a project has a
           * manifest, this is the link to the real page.
           */}
          {caseStudy && (
            <a
              href={projectUrl(caseStudy)}
              className="rounded-[3px] border border-[#51e2f5] bg-[#e6fbfd] px-2.5 py-1 text-[12px] font-medium text-[#06636f] transition-colors hover:bg-[#d3f6fa]"
            >
              Case study →
            </a>
          )}

          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[3px] border border-[#c4ebee] bg-[#f2fbfb] px-2.5 py-1 text-[12px] text-[#06636f] transition-colors hover:border-[#51e2f5]"
            >
              {linkLabel ?? "Code"} ↗
            </a>
          )}

          {bullets && bullets.length > 0 && (
            <details className={styles.details}>
              <summary>Details</summary>
              <ul className="mt-3 space-y-2">
                {bullets.map((b) => (
                  <li
                    key={b}
                    className="relative pl-5 text-[13px] leading-[1.65] text-zinc-600 before:absolute before:top-[8px] before:left-0 before:h-1 before:w-1 before:rounded-full before:bg-[#51e2f5]"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Videos are `preload="none"`: the browser fetches nothing until someone hits
 * play. Four clips at several megabytes each would otherwise undo the whole
 * point of this route being the light one.
 */
function Thumb({
  media,
  fallback,
}: {
  media?: (typeof shippedMedia)[number];
  fallback: string;
}) {
  if (!media) {
    return (
      <div className="flex h-[248px] items-center justify-center rounded border border-dashed border-zinc-200 bg-zinc-50 px-4 sm:h-[270px]">
        <p className="text-center text-[13px] leading-[1.5] text-zinc-400">
          {fallback}
        </p>
      </div>
    );
  }

  return (
    <figure className="min-w-0">
      <div className="overflow-hidden rounded border border-zinc-200 bg-zinc-50">
        {media.type === "video" ? (
          <video
            src={`/media/${media.file}`}
            controls
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="aspect-[3/2] w-full bg-black object-cover"
          />
        ) : (
          <Image
            src={`/media/${media.file}`}
            alt={media.caption}
            width={680}
            height={454}
            sizes="(min-width: 640px) 420px, 100vw"
            loading="lazy"
            className="aspect-[3/2] w-full object-cover"
          />
        )}
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ */

function Experience() {
  return (
    <div>
      <PanelHeading>Experience</PanelHeading>

      {/* A timeline, not entry rows, roles do not have thumbnails. */}
      <div className="space-y-9 border-l border-zinc-200 pl-6">
        {experience.map((job) => (
          <article key={`${job.company}-${job.period}`} className="relative">
            <span
              aria-hidden
              className="absolute top-[7px] -left-[27px] h-2 w-2 rounded-full bg-[#51e2f5] ring-4 ring-white"
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-[16px] font-semibold">
                {job.role}
                <span className="font-normal text-zinc-500">
                  {" "}
                  · {job.company}
                </span>
              </h3>
              <p className="text-[13px] whitespace-nowrap text-zinc-500">
                {job.period}
              </p>
            </div>
            <p className="mt-0.5 text-[13px] text-zinc-500">{job.place}</p>

            <ul className="mt-3 space-y-2">
              {job.bullets.map((b) => (
                <li
                  key={b}
                  className="relative pl-5 text-[14px] leading-[1.65] text-zinc-700 before:absolute before:top-[9px] before:left-0 before:h-1 before:w-1 before:rounded-full before:bg-[#9df9ef]"
                >
                  {b}
                </li>
              ))}
            </ul>

            <p className="mt-3 text-[13px] leading-[1.6] text-zinc-500">
              {job.tags.join(" · ")}
            </p>

            {job.link && (
              <a
                href={job.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-[13px] text-[#06636f] underline-offset-4 hover:underline"
              >
                Repository ↗
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function Patents() {
  return (
    <div>
      <PanelHeading>Patents</PanelHeading>

      <div className="space-y-10">
        {patents.map((pt) => (
          <article
            key={pt.title}
            className="grid gap-5 sm:grid-cols-[420px_1fr] sm:gap-9"
          >
            <Thumb media={mediaForPatent(pt.title)} fallback={pt.tags[0]} />

            <div className="min-w-0">
              <h3 className="text-[19px] leading-snug font-semibold sm:text-[21px]">
                {pt.title}
              </h3>
              <p className="mt-1 text-[13px] text-zinc-500">
                {pt.status} · {pt.number}
              </p>
              <p className="mt-2.5 text-[15px] leading-[1.7] text-zinc-700">
                {pt.body}
              </p>
              <p className="mt-2.5 text-[13.5px] leading-[1.6] text-zinc-500">
                {pt.tags.join(" · ")}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/**
 * Everything shipped, grouped the way it was captioned. The entry rows above
 * only ever show one image per subject; this is where the rest of them live.
 */
function Gallery() {
  const groups: { group: string; items: typeof shippedMedia }[] = [];
  for (const m of shippedMedia) {
    const found = groups.find((g) => g.group === m.group);
    if (found) found.items.push(m);
    else groups.push({ group: m.group, items: [m] });
  }

  return (
    <div>
      <PanelHeading>Media</PanelHeading>

      <div className="space-y-9">
        {groups.map((g) => (
          <div key={g.group}>
            <h3 className="mb-3 text-[14px] font-semibold">{g.group}</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {g.items.map((m) => (
                <figure key={m.file} className="min-w-0">
                  <div className="overflow-hidden rounded border border-zinc-200 bg-zinc-50">
                    {m.type === "video" ? (
                      <video
                        src={`/media/${m.file}`}
                        controls
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        className="aspect-video w-full bg-black object-cover"
                      />
                    ) : (
                      <Image
                        src={`/media/${m.file}`}
                        alt={m.caption}
                        width={640}
                        height={420}
                        sizes="(min-width: 640px) 460px, 100vw"
                        loading="lazy"
                        className="aspect-[3/2] w-full object-cover"
                      />
                    )}
                  </div>
                  <figcaption className="mt-2 text-[13px] leading-[1.55] text-zinc-500">
                    {m.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The compact tail: about, then skills, education and honors as plain lists. */
function About() {
  return (
    <div>
      <PanelHeading>About</PanelHeading>

      <p className="max-w-[68ch] text-[15px] leading-[1.7] text-zinc-700">
        Most recently I replaced a company&apos;s ROS 1 architecture with a ROS
        2 Humble stack for the SMR300, a 300 kg industrial AMR, LiDAR
        perception, PGV floor-tag localization, Nav2 navigation, CANopen and CiA
        402 drives, and an operator platform for engineers who don&apos;t write
        code. It docks with 97% success and 2 cm mean error across 150 trials.
      </p>
      <p className="mt-3 max-w-[68ch] text-[15px] leading-[1.7] text-zinc-700">
        Languages: {profile.languages.join(", ")}.
      </p>

      <PanelHeading className="mt-12">Skills</PanelHeading>
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

      <PanelHeading className="mt-12">Education</PanelHeading>
      <div className="space-y-6">
        {education.map((e) => (
          <article key={e.school}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-[16px] font-semibold">
                {e.school}
                <span className="font-normal text-zinc-500"> · {e.sub}</span>
              </h3>
              <p className="text-[13px] whitespace-nowrap text-zinc-500">
                {e.period}
              </p>
            </div>
            <p className="mt-1 text-[14px] text-zinc-700">{e.degree}</p>
            <p className="mt-0.5 text-[13px] text-zinc-500">{e.place}</p>
          </article>
        ))}
      </div>

      <PanelHeading className="mt-12">Honors</PanelHeading>
      <ul className="space-y-3">
        {honors.map((h) => (
          <li key={h.title} className="text-[14px] leading-[1.6]">
            <span className="font-medium">{h.result}</span>
            <span className="text-zinc-700">, {h.title}</span>
            <span className="text-zinc-500"> ({h.year})</span>
            <p className="mt-0.5 text-[13px] text-zinc-500">{h.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 pt-8">
      <p className="text-[14px] text-zinc-700">
        Reach me at{" "}
        <a
          href={`mailto:${profile.email}`}
          className="text-[#06636f] underline-offset-4 hover:underline"
        >
          {profile.email}
        </a>
        .
      </p>
      <p className="mt-4 text-[14px]">
        <Link
          href="/cool-kids"
          className="text-[#06636f] underline-offset-4 hover:underline"
        >
          Made a bad decision? Go to Cool Kids →
        </Link>
      </p>
    </footer>
  );
}

/* ------------------------------------------------------------------ */

function PanelHeading({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`mb-6 border-b-2 border-[#9df9ef] pb-2 text-[12px] font-semibold tracking-[0.14em] text-[#7d646d] uppercase ${className}`}
    >
      {children}
    </h2>
  );
}
