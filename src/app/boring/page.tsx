import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  FileUser,
  FlaskConical,
  Mail,
} from "lucide-react";
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

/**
 * Project rows that are also a published patent application, keyed by the
 * row's display name. The badge on the row is the point: a reader skimming
 * the work list should not have to cross-reference the Patents tab to learn
 * that the thing in front of them is protected IP.
 */
const PATENT_FOR_PROJECT: Record<string, string> = {
  Kurat: "202641114580",
  "Recalibration-Free Stereo PTU": "202641064821",
  "Pushpak Viman": "202641035669",
};

function patentFor(name: string) {
  const number = PATENT_FOR_PROJECT[name];
  return number ? patents.find((pt) => pt.number === number) : undefined;
}

/**
 * Rows that stay on the page but sit below the robot work. These are tooling
 * and software; the hardware and the research should be read first.
 */
const PUSHED_DOWN = new Set(["OpenDroneKit", "RosScope", "Continuum"]);

/** Patents are all filed under one group, so they match on filename instead. */
function mediaForPatent(title: string) {
  const needle = title.toLowerCase();
  const key = needle.includes("search-and-rescue")
    ? "transformationdrone_dronemode"
    : needle.includes("medications")
      ? "thermobottle"
      : needle.includes("companion")
        ? "Kurat_body"
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
         * Centred, at a width that fills a laptop screen. The left-anchored
         * 92rem column left a band of empty white down the right of every wide
         * screen, which read as unfinished rather than airy.
         */}
        <div className="mx-auto max-w-[80rem] px-6 py-10 sm:px-10 sm:py-12">
          <Header />

          {/*
           * Inputs first, then the labels, then the panels — `:checked ~` only
           * walks forward, so the DOM order is load-bearing.
           */}
          <div className="mt-10">
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

/* Brand marks. lucide-react 1.x dropped brand icons, so these are inline. */
type IconProps = { className?: string; "aria-hidden"?: boolean };

function GithubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function LinkedinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}

function YoutubeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    </svg>
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
      <div className="mx-auto flex max-w-[80rem] items-center justify-between gap-4 px-6 py-3 sm:px-10">
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

/**
 * The header block is centred even though the rest of the page is anchored
 * left. It is the one part with no column beneath it to line up with, and a
 * portrait plus five lines of bio stranded against the left edge of a very wide
 * page reads as though something failed to load beside it.
 */
function Header() {
  return (
    <header className="flex flex-col gap-7 sm:flex-row sm:items-start sm:gap-10 lg:px-10">
      <Image
        src="/media/portrait.jpg"
        alt={`${profile.name}, robotics software engineer`}
        width={176}
        height={176}
        priority
        className="h-32 w-32 shrink-0 rounded-full object-cover ring-[3px] ring-[#51c6cf] ring-offset-2 sm:h-44 sm:w-44"
      />

      <div className="min-w-0">
        <h1 className="text-4xl font-bold tracking-tight sm:text-[2.9rem]">
          {profile.name}
        </h1>
        <p className="mt-1.5 text-[17px] text-zinc-600">
          Robotics Software Engineer · {profile.location}
        </p>

        {/* The positioning first, at a size that reads as a statement. */}
        <p className="mt-4 text-[19px] leading-[1.45] font-semibold text-zinc-900">
          {profile.headline}
        </p>
        <p className="mt-3 max-w-[72ch] text-[16px] leading-[1.6] text-zinc-600">
          {profile.tagline}
        </p>

        <ul className="mt-6 flex flex-wrap items-center gap-y-2 text-[14.5px]">
          {[
            {
              label: profile.email,
              href: `mailto:${profile.email}`,
              Icon: Mail,
              external: false,
            },
            { label: "GitHub", href: profile.github, Icon: GithubIcon, external: true },
            { label: "LinkedIn", href: profile.linkedin, Icon: LinkedinIcon, external: true },
            { label: "YouTube", href: profile.youtube, Icon: YoutubeIcon, external: true },
            { label: "Botopsy Lab", href: profile.botopsy, Icon: FlaskConical, external: true },
            { label: "Résumé", href: profile.resume, Icon: FileUser, external: true },
            { label: "CV", href: profile.cv, Icon: FileText, external: true },
          ].map(({ label, href, Icon, external }, i) => (
            <li
              key={label}
              className={`flex items-center pr-4 sm:pr-3.5 ${i > 0 ? "sm:border-l sm:border-zinc-300 sm:pl-3.5" : ""}`}
            >
              <a
                href={href}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="inline-flex items-center gap-2 text-[#06636f] underline-offset-4 hover:underline"
              >
                <Icon aria-hidden className="h-[17px] w-[17px] shrink-0" />
                {label}
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

/** Rows separated by a hairline, the way the mock reads. */
const ROWS = "divide-y divide-zinc-200 *:py-9 [&>*:first-child]:pt-0";

function Work() {
  const featured = projects.filter(
    (p) => p.featured && !PUSHED_DOWN.has(p.name),
  );
  const pushedDown = projects.filter(
    (p) => p.featured && PUSHED_DOWN.has(p.name),
  );
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

  // Ripple and Wren lead the list, above SMR300. They are not a separate
  // research tier any more, so they sit in the same list as everything else.
  const lead = ["ripple", "wren"]
    .map((slug) => PROJECTS_BY_SLUG.get(slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  // The bench is driven by the manifests now, so each entry has a case study.
  const bench = PROJECTS.filter(
    (p) => p.category === "bench" && !p.compact,
  ).sort((a, b) => a.order - b.order);

  return (
    <div>
      <PanelHeading>Projects and professional experience</PanelHeading>

      <div className={ROWS}>
        {lead.map((p) => (
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
              p.links.find((l) => l.kind === "site" || l.kind === "repo")?.href
            }
            linkLabel={
              p.links.find((l) => l.kind === "site" || l.kind === "repo")?.label
            }
          />
        ))}

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
            patent={patentFor(p.name)}
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
      <div className={`${ROWS} border-t border-zinc-200 pt-9`}>
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
            patent={patentFor(p.name)}
            link={p.link}
            linkLabel={p.linkLabel}
          />
        ))}
      </div>

      {/* Tooling and software, after the robots. */}
      <div className={`${ROWS} border-t border-zinc-200 pt-9`}>
        {pushedDown.map((p) => (
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
            patent={patentFor(p.name)}
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
      <div className={ROWS}>
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
  patent,
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
  /** The published patent application this project is, when it is one. */
  patent?: (typeof patents)[number];
}) {
  return (
    <article className="grid gap-6 md:grid-cols-[minmax(0,30rem)_1fr] md:gap-10">
      <Thumb media={media} fallback={subtitle} />

      <div className="min-w-0">
        <h3 className="text-[22px] leading-snug font-bold tracking-tight text-zinc-900 sm:text-[26px]">
          {title}:{" "}
          <span className="font-normal text-zinc-600">{subtitle}</span>
        </h3>

        {/*
         * Status comes from the manifest rather than being typed in here, so an
         * old prototype cannot keep presenting itself as equivalent to current
         * work just because nobody remembered to update a second copy of it.
         */}
        <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-zinc-500">
          {caseStudy && PROJECTS_BY_SLUG.get(caseStudy) && (
            <span className="rounded-full border border-[#8fd3d8] bg-[#effafa] px-3 py-0.5 text-[13px] text-[#06636f]">
              {STATUS_LABEL[PROJECTS_BY_SLUG.get(caseStudy)!.status]}
            </span>
          )}
          {patent && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-0.5 text-[13px] font-semibold text-amber-800">
              Patent
            </span>
          )}
          <span>{meta}</span>
        </p>

        {patent && (
          <p className="mt-2 text-[13.5px] leading-[1.6] text-amber-900">
            Published Indian patent application: {patent.title}, No.{" "}
            <span className="tabular-nums">{patent.number}</span>. Lead inventor.
          </p>
        )}

        <p className="mt-4 text-[16px] leading-[1.65] text-zinc-600">
          {blurb}
        </p>

        {stat && (
          <p className="mt-2.5 text-[14px] leading-[1.6] font-medium text-[#06636f]">
            {stat}
          </p>
        )}

        <p className="mt-4 text-[14.5px] leading-[1.6] text-zinc-500">
          {tech.join(" · ")}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {/*
           * An expandable entry is not a case study. Where a project has a
           * manifest, this is the link to the real page.
           */}
          {caseStudy && (
            <a
              href={projectUrl(caseStudy)}
              className="inline-flex items-center gap-2 rounded-md bg-[#0b7a84] px-5 py-2.5 text-[14.5px] font-medium text-white shadow-sm transition-colors hover:bg-[#086570]"
            >
              Case study <ArrowRight aria-hidden className="h-4 w-4" />
            </a>
          )}

          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-[#9fd4d8] bg-white px-5 py-2.5 text-[14.5px] font-medium text-[#0b7a84] transition-colors hover:border-[#0b7a84]"
            >
              {linkLabel ?? "Code"}{" "}
              <ArrowUpRight aria-hidden className="h-4 w-4" />
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
      <div className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 shadow-sm">
        {media.type === "video" ? (
          <video
            src={`/media/${media.file}`}
            controls
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="aspect-[16/9.5] w-full bg-black object-cover"
          />
        ) : (
          <Image
            src={`/media/${media.file}`}
            alt={media.caption}
            width={960}
            height={570}
            sizes="(min-width: 768px) 480px, 100vw"
            loading="lazy"
            className="aspect-[16/9.5] w-full object-cover"
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
                {pt.status} · {pt.number} · {pt.published}
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

      <p className="max-w-[86ch] text-[15px] leading-[1.7] text-zinc-700">
        Most recently I replaced a company&apos;s ROS 1 architecture with a ROS
        2 Humble stack for the SMR300, a 300 kg industrial AMR, LiDAR
        perception, PGV floor-tag localization, Nav2 navigation, CANopen and CiA
        402 drives, and an operator platform for engineers who don&apos;t write
        code. It docks with 97% success and 2 cm mean error across 150 trials.
      </p>
      <p className="mt-3 max-w-[86ch] text-[15px] leading-[1.7] text-zinc-700">
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
      className={`mb-8 flex items-center gap-4 text-[13px] font-semibold tracking-[0.16em] text-zinc-600 uppercase after:h-px after:flex-1 after:bg-[#9fd4d8] ${className}`}
    >
      {children}
    </h2>
  );
}
