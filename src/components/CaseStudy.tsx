import Image from "next/image";
import Link from "next/link";
import {
  ATTRIBUTION_LABEL,
  STATUS_LABEL,
  type Flow,
  type MediaRef,
  type Project,
  type Section,
  type TableBlock,
} from "@/projects/types";
import { getProject, projectUrl } from "@/projects";

/**
 * The case-study template.
 *
 * One component renders every project page, so the evidence order is the same
 * everywhere: what it is, why it was hard, what was built, what was measured,
 * what did not work, and who did which part. A reader who has read one of these
 * knows where to look on all of them.
 *
 * A static server component — no "use client". These pages are documents.
 *
 * Sections are omitted when empty rather than rendered as headings over
 * nothing: a project that has no experiments yet should look like a project
 * with no experiments, not like a broken page.
 */
export function CaseStudy({ project: p }: { project: Project }) {
  const negatives = p.experiments?.filter((e) => e.negative) ?? [];

  return (
    <div className="min-h-dvh bg-white text-zinc-900">
      {/*
       * The way back.
       *
       * These pages are served from their own subdomains, so browser history is
       * often the only way back and there is no site navigation around them.
       * The first version put the name here with a small arrow, which read as a
       * wordmark rather than a control — people did not recognise it as the way
       * out. It is now an actual button, and it offers the two destinations
       * that are useful: the door, and the index of everything.
       *
       * Absolute URLs because the same component is served from a project
       * subdomain and from the apex at /p/<slug>; a relative href would keep
       * you on the subdomain, where neither route exists.
       */}
      <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-3">
          <a
            href="https://www.prabalkhare.com/boring"
            className="group inline-flex items-center gap-1.5 rounded-[3px] border border-[#c4ebee] bg-[#f2fbfb] px-2.5 py-1.5 text-[13px] font-medium text-[#06636f] transition-colors hover:border-[#51e2f5]"
          >
            <span aria-hidden className="transition-transform group-hover:-translate-x-0.5">
              ←
            </span>
            Back
          </a>
          <span className="text-[12px] text-zinc-500">{STATUS_LABEL[p.status]}</span>
        </div>
      </div>

      {/*
       * A meta rail beside the content rather than one narrow column.
       *
       * At max-w-3xl the article was ~768px in the middle of a 1440px window,
       * which left half the screen empty on every page. Widening the text alone
       * would have fixed the emptiness and broken the reading measure — prose
       * past about 70 characters a line is measurably harder to read.
       *
       * So the width is spent on structure instead: the facts you scan for
       * (status, dates, role, stack, links) move into a sticky rail on the
       * left, and the prose keeps its measure on the right. Below `lg` the rail
       * collapses back above the content and the page is the single column it
       * always was.
       */}
      <article className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-zinc-500 lg:hidden">
              <span className="rounded-full border border-[#c4ebee] bg-[#f2fbfb] px-2.5 py-0.5 text-[#06636f]">
                {STATUS_LABEL[p.status]}
              </span>
              <span>{p.year}</span>
              <span aria-hidden>·</span>
              <span>{p.role}</span>
            </div>

            <h1 className="mt-5 text-[2rem] leading-[1.1] font-semibold tracking-tight sm:text-[2.75rem] lg:mt-0">
              {p.title}
            </h1>
            <p className="mt-3 max-w-[70ch] text-[17px] leading-[1.6] text-zinc-600">
              {p.subtitle}
            </p>
          </div>

          {/* The rail. Sticky, because the stack is worth having in view while
              reading the deep dives. */}
          <aside className="mt-10 lg:sticky lg:top-24 lg:mt-12 lg:self-start">
            <dl className="space-y-5 border-t border-zinc-200 pt-5 lg:border-t-0 lg:pt-0">
              <div className="hidden lg:block">
                <dt className="text-[11px] tracking-[0.12em] text-zinc-400 uppercase">
                  Status
                </dt>
                <dd className="mt-1.5">
                  <span className="rounded-full border border-[#c4ebee] bg-[#f2fbfb] px-2.5 py-0.5 text-[12px] text-[#06636f]">
                    {STATUS_LABEL[p.status]}
                  </span>
                </dd>
              </div>
              <div className="hidden lg:block">
                <dt className="text-[11px] tracking-[0.12em] text-zinc-400 uppercase">
                  Years
                </dt>
                <dd className="mt-1 text-[13px] text-zinc-700">{p.year}</dd>
              </div>
              <div className="hidden lg:block">
                <dt className="text-[11px] tracking-[0.12em] text-zinc-400 uppercase">
                  Role
                </dt>
                <dd className="mt-1 text-[13px] text-zinc-700">{p.role}</dd>
              </div>
              <div>
                <dt className="text-[11px] tracking-[0.12em] text-zinc-400 uppercase">
                  Stack
                </dt>
                <dd className="mt-1.5 text-[13px] leading-[1.7] text-zinc-600">
                  {p.stack.join(" · ")}
                </dd>
              </div>
              {p.links.length > 0 && (
                <div>
                  <dt className="text-[11px] tracking-[0.12em] text-zinc-400 uppercase">
                    Links
                  </dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {p.links.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-[3px] border border-[#c4ebee] bg-[#f2fbfb] px-3 py-1.5 text-[13px] text-[#06636f] transition-colors hover:border-[#51e2f5]"
                      >
                        {l.label} ↗
                      </a>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </aside>

          {/* Everything that is read in order. */}
          <div className="min-w-0">
            <p className="mt-10 max-w-[66ch] border-l-2 border-[#51e2f5] pl-5 text-[16px] leading-[1.7] text-zinc-800 lg:mt-12">
              {p.thesis}
            </p>

            {p.hero && <Figure media={p.hero} className="mt-9" priority />}

        {/* Metrics: only ever with their context attached. */}
        {p.metrics && p.metrics.length > 0 && (
          <div className="mt-12 grid gap-6 border-y border-zinc-200 py-8 sm:grid-cols-3">
            {p.metrics.map((m) => (
              <div key={m.label}>
                <p className="text-[1.75rem] leading-none font-semibold tracking-tight text-[#06636f]">
                  {m.value}
                </p>
                <p className="mt-2 text-[14px] font-medium">{m.label}</p>
                <p className="mt-1 text-[12px] leading-[1.6] text-zinc-500">{m.context}</p>
              </div>
            ))}
          </div>
        )}

        <Prose section={p.problem} />
        <Prose section={p.built} />
        <Prose section={p.architecture} />

        {p.deepDive?.map((s) => <Prose key={s.heading} section={s} />)}

            {p.flows?.map((f) => <FlowDiagram key={f.title} flow={f} />)}

            {p.tables?.map((t) => <RefTable key={t.title} table={t} />)}

        {/* Experiments */}
        {p.experiments && p.experiments.length > 0 && (
          <section className="mt-14">
            <Heading>Experiments</Heading>
            <div className="space-y-8">
              {p.experiments.map((e) => (
                <div key={e.name}>
                  <h3 className="text-[16px] font-semibold">
                    {e.name}
                    {e.negative && (
                      <span className="ml-2 rounded-[3px] border border-zinc-300 px-1.5 py-0.5 align-middle text-[10px] font-normal tracking-[0.1em] text-zinc-500 uppercase">
                        negative result
                      </span>
                    )}
                  </h3>
                  <dl className="mt-3 space-y-2">
                    <Row term="Question" value={e.question} />
                    <Row term="Method" value={e.method} />
                    <Row term="Result" value={e.result} emphasis />
                  </dl>
                </div>
              ))}
            </div>

            {negatives.length > 0 && (
              <p className="mt-8 border-l-2 border-zinc-300 pl-5 text-[14px] leading-[1.7] text-zinc-600">
                {negatives.length === 1 ? "One result" : `${negatives.length} results`} did
                not confirm the hypothesis. They are reported here because an
                experiment that only ever confirms things is not an experiment.
              </p>
            )}
          </section>
        )}

        {/* Limitations — the section most portfolios skip. */}
        {p.limitations && p.limitations.length > 0 && (
          <section className="mt-14">
            <Heading>Limitations and failure modes</Heading>
            <ul className="space-y-2.5">
              {p.limitations.map((l) => (
                <li
                  key={l}
                  className="relative pl-5 text-[15px] leading-[1.7] text-zinc-700 before:absolute before:top-[10px] before:left-0 before:h-1 before:w-1 before:rounded-full before:bg-zinc-400"
                >
                  {l}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Gallery. Pending slots are declared, not silently skipped. */}
        {p.gallery && p.gallery.length > 0 && (
          <Gallery items={p.gallery} />
        )}

        {/* Repository map */}
        {p.repos && p.repos.length > 0 && (
          <section className="mt-14">
            <Heading>Repository map</Heading>
            <div className="space-y-4">
              {p.repos.map((r) => (
                <div key={r.href}>
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[15px] font-medium text-[#06636f] underline-offset-4 hover:underline"
                  >
                    {r.name} ↗
                  </a>
                  <p className="mt-0.5 text-[14px] leading-[1.6] text-zinc-600">
                    {r.contains}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Timeline */}
        {p.timeline && p.timeline.length > 0 && (
          <section className="mt-14">
            <Heading>Timeline</Heading>
            <ol className="space-y-4 border-l border-zinc-200 pl-6">
              {p.timeline.map((t) => (
                <li key={t.when} className="relative">
                  <span
                    aria-hidden
                    className="absolute top-[7px] -left-[27px] h-2 w-2 rounded-full bg-[#51e2f5] ring-4 ring-white"
                  />
                  <p className="text-[14px] font-medium">{t.when}</p>
                  <p className="mt-0.5 text-[14px] leading-[1.6] text-zinc-600">{t.what}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Attribution — required on every project. */}
        <section className="mt-14">
          <Heading>Attribution</Heading>
          <dl className="space-y-4">
            {p.attribution.map((a) => (
              <div key={a.detail} className="sm:flex sm:gap-6">
                <dt className="text-[13px] font-medium text-zinc-500 sm:w-52 sm:shrink-0">
                  {ATTRIBUTION_LABEL[a.kind]}
                </dt>
                <dd className="mt-1 text-[14px] leading-[1.7] text-zinc-700 sm:mt-0">
                  {a.detail}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Related */}
        {p.related && p.related.length > 0 && <Related slugs={p.related} />}

          </div>
        </div>

        {/*
         * Reaching the bottom is the other moment someone needs a way out, and
         * it should be the same way out as the top — back to the index of all
         * the work, not to the door. Someone who opened a case study came from
         * a list and wants the list again.
         *
         * The 3D route is deliberately not offered here. It is an entry
         * experience; handing it to someone who has just read a technical page
         * sends them from evidence back to spectacle.
         */}
        <footer className="mt-16 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-zinc-200 pt-8 text-[14px]">
          <a
            href="https://www.prabalkhare.com/boring"
            className="group inline-flex items-center gap-1.5 rounded-[3px] border border-[#c4ebee] bg-[#f2fbfb] px-3 py-1.5 font-medium text-[#06636f] transition-colors hover:border-[#51e2f5]"
          >
            <span aria-hidden className="transition-transform group-hover:-translate-x-0.5">
              ←
            </span>
            Back
          </a>
        </footer>
      </article>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Prose({ section }: { section?: Section }) {
  if (!section) return null;

  return (
    <section className="mt-14">
      <Heading>{section.heading}</Heading>
      {section.body.map((para) => (
        <p
          key={para}
          className="mt-4 max-w-[68ch] text-[15px] leading-[1.75] text-zinc-700 first:mt-0"
        >
          {para}
        </p>
      ))}
      {section.points && (
        <ul className="mt-5 space-y-2">
          {section.points.map((pt) => (
            <li
              key={pt}
              className="relative pl-5 text-[14px] leading-[1.7] text-zinc-600 before:absolute before:top-[10px] before:left-0 before:h-1 before:w-1 before:rounded-full before:bg-[#51e2f5]"
            >
              {pt}
            </li>
          ))}
        </ul>
      )}

      {/* A clip that belongs to this argument rather than to the gallery. */}
      {section.media && <Figure media={section.media} className="mt-7" />}
    </section>
  );
}

/**
 * A flow diagram, in HTML.
 *
 * Deliberately not mermaid. These pages ship no JavaScript, and a diagram that
 * only exists after a 400 KB library parses a text description is a diagram
 * that does not exist for anyone with JS off, on a slow connection, or reading
 * a cached copy. A vertical chain of steps with labelled branches renders
 * instantly, reflows on a phone, and is selectable text.
 */
function FlowDiagram({ flow }: { flow: Flow }) {
  const tone = {
    default: "border-zinc-300 bg-white text-zinc-800",
    decision: "border-[#c4ebee] bg-[#f2fbfb] text-[#06636f]",
    good: "border-[#9df9ef] bg-[#f0fdfa] text-[#06655b]",
    bad: "border-[#f5c2cc] bg-[#fdf2f4] text-[#a83a52]",
  } as const;

  return (
    <section className="mt-14">
      <Heading>{flow.title}</Heading>
      {flow.caption && (
        <p className="mb-6 max-w-[68ch] text-[14px] leading-[1.7] text-zinc-600">
          {flow.caption}
        </p>
      )}

      <ol className="max-w-[46rem]">
        {flow.steps.map((st, i) => (
          <li key={st.label}>
            {/* connector */}
            {i > 0 && (
              <div aria-hidden className="ml-5 h-6 w-px bg-zinc-300" />
            )}

            <div
              className={`rounded-[4px] border px-4 py-3 ${tone[st.tone ?? "default"]}`}
            >
              <p className="text-[14px] font-medium">{st.label}</p>
              {st.detail && (
                <p className="mt-1 text-[13px] leading-[1.6] opacity-80">
                  {st.detail}
                </p>
              )}
            </div>

            {st.branches && st.branches.length > 0 && (
              <div className="mt-2 ml-5 space-y-2 border-l border-zinc-300 pl-5">
                {st.branches.map((b) => (
                  <div
                    key={b.label}
                    className={`rounded-[4px] border px-3 py-2 text-[13px] leading-[1.6] ${tone[b.tone ?? "default"]}`}
                  >
                    {b.label}
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** A reference table. Scrolls horizontally rather than squashing on a phone. */
function RefTable({ table }: { table: TableBlock }) {
  return (
    <section className="mt-14">
      <Heading>{table.title}</Heading>
      {table.caption && (
        <p className="mb-5 max-w-[68ch] text-[14px] leading-[1.7] text-zinc-600">
          {table.caption}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left">
          <thead>
            <tr>
              {table.head.map((h) => (
                <th
                  key={h}
                  className="border-b border-zinc-300 pr-6 pb-2 text-[11px] tracking-[0.1em] text-zinc-500 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r) => (
              <tr key={r[0]}>
                {r.map((c, i) => (
                  <td
                    key={i}
                    className={`border-b border-zinc-200 py-3 pr-6 align-top text-[14px] leading-[1.6] ${
                      i === 0 ? "font-medium text-zinc-900" : "text-zinc-600"
                    }`}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Gallery({ items }: { items: MediaRef[] }) {
  const shipped = items.filter((m) => !m.pending);
  const pending = items.filter((m) => m.pending);

  return (
    <section className="mt-14">
      <Heading>Gallery</Heading>

      {shipped.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {shipped.map((m) => (
            <Figure key={m.file} media={m} />
          ))}
        </div>
      )}

      {/*
       * Declared rather than hidden. A reader can see what evidence is coming,
       * and so can whoever has to go and record it.
       */}
      {pending.length > 0 && (
        <div className={shipped.length > 0 ? "mt-6" : ""}>
          <p className="text-[12px] tracking-[0.1em] text-zinc-400 uppercase">
            Not yet captured
          </p>
          <ul className="mt-2 space-y-1">
            {pending.map((m) => (
              <li key={m.file} className="text-[13px] leading-[1.6] text-zinc-400">
                {m.caption}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Figure({
  media,
  className = "",
  priority,
}: {
  media: MediaRef;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure className={`min-w-0 ${className}`}>
      <div className="overflow-hidden rounded border border-zinc-200 bg-zinc-50">
        {media.type === "video" ? (
          /*
           * Autoplaying, muted and looping. `muted` is not decoration — every
           * browser refuses to autoplay a video with sound, so without it the
           * autoplay attribute is silently ignored.
           *
           * This trades bandwidth for immediacy: the clips now fetch on page
           * load rather than on a click. They are 0.7–1.9 MB each and they are
           * the evidence the page exists to show, so it is the right trade
           * here — but it is the reason `preload="none"` is gone, and it is why
           * controls stay available for anyone who wants to scrub.
           */
          <video
            src={`/media/${media.file}`}
            controls
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-black object-cover"
          />
        ) : media.file.endsWith(".svg") ? (
          /*
           * next/image refuses to optimise SVG without `dangerouslyAllowSVG`,
           * which would apply to every image on the site to accommodate one
           * chart. A plain img is the smaller blast radius: these are committed
           * assets from this repo, not user input, and the CSP already limits
           * img-src to 'self'.
           */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/media/${media.file}`}
            alt={media.caption}
            loading={priority ? undefined : "lazy"}
            className="w-full bg-white object-contain p-4"
          />
        ) : (
          <Image
            src={`/media/${media.file}`}
            alt={media.caption}
            width={1280}
            height={840}
            sizes="(min-width: 640px) 640px, 100vw"
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="aspect-[3/2] w-full object-cover"
          />
        )}
      </div>
      <figcaption className="mt-1.5 text-[12px] leading-[1.5] text-zinc-500">
        {media.caption}
      </figcaption>
    </figure>
  );
}

function Related({ slugs }: { slugs: string[] }) {
  // The registry guarantees these resolve — it throws at build otherwise — but
  // the filter keeps this component honest if it is ever reused elsewhere.
  const items = slugs.map(getProject).filter((p): p is Project => Boolean(p));
  if (items.length === 0) return null;

  return (
    <section className="mt-14">
      <Heading>Related</Heading>
      <ul className="space-y-3">
        {items.map((r) => (
          <li key={r.slug}>
            <a
              href={projectUrl(r.slug)}
              className="text-[15px] font-medium text-[#06636f] underline-offset-4 hover:underline"
            >
              {r.title}
            </a>
            <p className="mt-0.5 text-[13px] leading-[1.6] text-zinc-600">{r.subtitle}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 border-b-2 border-[#9df9ef] pb-2 text-[12px] font-semibold tracking-[0.14em] text-[#7d646d] uppercase">
      {children}
    </h2>
  );
}

function Row({
  term,
  value,
  emphasis,
}: {
  term: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="sm:flex sm:gap-5">
      <dt className="text-[12px] tracking-[0.08em] text-zinc-400 uppercase sm:w-20 sm:shrink-0 sm:pt-[3px]">
        {term}
      </dt>
      <dd
        className={`mt-0.5 text-[14px] leading-[1.7] sm:mt-0 ${
          emphasis ? "font-medium text-zinc-900" : "text-zinc-600"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
