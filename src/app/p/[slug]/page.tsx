import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudy } from "@/components/CaseStudy";
import { allProjectSlugs, getProject } from "@/projects";
import {
  ATTRIBUTION_LABEL,
  STATUS_LABEL,
  type Project,
} from "@/projects/types";
import { SITE_URL } from "@/lib/site";

/**
 * The case-study route.
 *
 * Every project subdomain rewrites here — `ripple.prabalkhare.com` is served by
 * `/p/ripple` without a redirect, so the subdomain stays in the address bar.
 * The path is also directly reachable on the apex, which means a project is
 * linkable before its DNS exists and keeps working if a subdomain is ever
 * retired.
 *
 * Fully static: `generateStaticParams` prerenders every project at build, and
 * `dynamicParams = false` means an unknown slug is a 404 rather than an
 * on-demand render of nothing.
 */

export const dynamicParams = false;

/** A project's real address: its subdomain, or the apex path if it has none. */
function canonicalFor(p: Project): string {
  return p.subdomain
    ? `https://${p.subdomain}.prabalkhare.com`
    : `${SITE_URL}/p/${p.slug}`;
}

export function generateStaticParams() {
  return allProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};

  // Canonical points at the subdomain when the project has one, since that is
  // the URL that gets shared. Without this, the apex path and the subdomain
  // would compete as duplicates.
  const canonical = canonicalFor(p);

  const title = `${p.title}, ${p.subtitle}`;

  return {
    title,
    description: p.summary,
    alternates: { canonical },
    openGraph: {
      title,
      description: p.summary,
      url: canonical,
      type: "article",
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  /*
   * Structured data, for the readers that parse rather than render.
   *
   * `SoftwareSourceCode` rather than the generic CreativeWork, because every
   * one of these is a codebase — it gives parsers `codeRepository` and
   * `programmingLanguage` to work with. Research projects are additionally
   * described as a `Dataset` of results, since the measured outcomes and their
   * conditions are the substance of those pages.
   *
   * The measurements are emitted as PropertyValue with their context attached.
   * A number without its trial count is not evidence, and that holds whether a
   * person or a model is reading it.
   */
  const repo = project.links.find((l) => l.kind === "repo")?.href;
  const demo = project.links.find(
    (l) => l.kind === "site" || l.kind === "demo",
  )?.href;
  const isResearch = project.category === "current-research";

  const schema = {
    "@context": "https://schema.org",
    "@type": isResearch
      ? ["SoftwareSourceCode", "Dataset"]
      : "SoftwareSourceCode",
    name: project.title,
    alternateName: project.subtitle,
    abstract: project.thesis,
    description: project.summary,
    url: canonicalFor(project),
    creativeWorkStatus: STATUS_LABEL[project.status],
    dateCreated: project.year,
    author: {
      "@type": "Person",
      name: "Prabal Khare",
      url: SITE_URL,
      jobTitle: "Robotics Engineer",
      email: "mailto:pk3391@nyu.edu",
    },
    keywords: project.stack.join(", "),
    programmingLanguage: project.stack,
    ...(repo ? { codeRepository: repo } : {}),
    ...(demo ? { discussionUrl: demo } : {}),

    // Measured results, each with the conditions it was measured under.
    ...(project.metrics?.length
      ? {
          variableMeasured: project.metrics.map((m) => ({
            "@type": "PropertyValue",
            name: m.label,
            value: m.value,
            description: m.context,
          })),
        }
      : {}),

    // What was actually asked and what came back, negative results included.
    ...(project.experiments?.length
      ? {
          hasPart: project.experiments.map((e) => ({
            "@type": "CreativeWork",
            name: e.name,
            abstract: e.question,
            description: `Method: ${e.method} Result: ${e.result}`,
            ...(e.negative
              ? { disambiguatingDescription: "Negative result" }
              : {}),
          })),
        }
      : {}),

    // Who did which part. The single most important field on a portfolio.
    creditText: project.attribution
      .map((a) => `${ATTRIBUTION_LABEL[a.kind]}: ${a.detail}`)
      .join(" "),

    ...(project.limitations?.length
      ? { usageInfo: project.limitations.join(" ") }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <CaseStudy project={project} />
    </>
  );
}
