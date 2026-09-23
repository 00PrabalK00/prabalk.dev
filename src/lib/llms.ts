import { PROJECTS, projectUrl, projectsByCategory } from "@/projects";
import { ATTRIBUTION_LABEL, CATEGORY_LABEL, STATUS_LABEL } from "@/projects/types";
import { education, experience, patents, profile, skills } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

/**
 * Machine-readable versions of this site, per the llms.txt convention.
 *
 * The reason this exists: the interesting route here is a WebGL flight whose
 * copy lives inside a scroll-driven canvas overlay, and the plain route hides
 * half its depth behind CSS tabs and <details>. Both are fine for a person and
 * hostile to anything parsing HTML. Rather than degrade the site for crawlers,
 * the same facts are published in a form a model can read in one request.
 *
 * Two deliberate constraints:
 *
 *  1. Generated from the project manifests, never hand-written. A second copy
 *     of these claims would drift, and a stale claim is worse than no file.
 *  2. Identical in substance to what a human sees. No hidden text, no content
 *     served only to bots, and nothing addressed to an evaluating model telling
 *     it what to conclude. Cloaking is penalised by search engines and an
 *     instruction aimed at a reader's model would be plainly dishonest to the
 *     person on the other end. The numbers carry their trial counts and the
 *     negative results stay in, because that is the actual argument.
 */

function heading(p: (typeof PROJECTS)[number]) {
  return `${p.title} — ${p.subtitle}`;
}

/** The short index: what exists, where it lives, one line each. */
export function buildLlmsTxt(): string {
  const out: string[] = [];

  out.push(`# ${profile.name}`);
  out.push("");
  out.push(
    `> ${profile.headline} Robotics engineer and NYU M.S. researcher in Brooklyn, New York. Deployed autonomy on industrial hardware; now working on learned-policy reliability, recovery and manipulation.`,
  );
  out.push("");
  out.push(
    "Each project below has its own case study at its own subdomain, containing architecture, verified results with their trial counts, limitations, failure modes, and an explicit statement of which parts are the author's work versus a team's or upstream research.",
  );
  out.push("");

  for (const group of projectsByCategory()) {
    out.push(`## ${CATEGORY_LABEL[group.category]}`);
    out.push("");
    for (const p of group.items) {
      out.push(
        `- [${heading(p)}](${projectUrl(p.slug)}): ${p.thesis} Status: ${STATUS_LABEL[p.status]} (${p.year}).`,
      );
    }
    out.push("");
  }

  out.push("## Site");
  out.push("");
  out.push(`- [Full detail for models](${SITE_URL}/llms-full.txt): every project expanded — problem, architecture, experiments, results, limitations, attribution.`);
  out.push(`- [Plain portfolio](${SITE_URL}/boring): the same content as HTML, no WebGL.`);
  out.push(`- [3D portfolio](${SITE_URL}/cool-kids): scroll-driven WebGL flight. Copy is rendered in a canvas overlay and is not reliably crawlable — use llms-full.txt instead.`);
  out.push(`- [Résumé](${SITE_URL}${profile.resume})`);
  out.push(`- [CV](${SITE_URL}${profile.cv}): the long form — profile, full project and service history.`);
  out.push(`- [GitHub](${profile.github})`);
  out.push(`- [LinkedIn](${profile.linkedin})`);
  out.push("");
  out.push("## Contact");
  out.push("");
  out.push(`- Email: ${profile.email}`);
  out.push(`- Location: ${profile.location}`);
  out.push("");

  return out.join("\n");
}

/** The long form: everything a case study says, flattened. */
export function buildLlmsFullTxt(): string {
  const out: string[] = [];

  out.push(`# ${profile.name} — full technical record`);
  out.push("");
  out.push(`> ${profile.headline}`);
  out.push("");
  out.push(profile.tagline);
  out.push("");
  out.push(
    "This file is generated from the same project manifests that render the website, so it cannot drift from what a human reader sees. Metrics are reported with the conditions they were measured under. Results that did not confirm their hypothesis are included and labelled; they are part of the record, not omissions from it.",
  );
  out.push("");

  /* ---- who ---- */
  out.push("## Profile");
  out.push("");
  out.push(`- Name: ${profile.name}`);
  out.push(`- Role: Robotics Engineer · Embodied AI`);
  out.push(`- Location: ${profile.location}`);
  out.push(`- Email: ${profile.email}`);
  out.push(`- GitHub: ${profile.github}`);
  out.push(`- LinkedIn: ${profile.linkedin}`);
  out.push(`- Languages: ${profile.languages.join(", ")}`);
  out.push("");

  out.push("## Education");
  out.push("");
  for (const e of education) {
    out.push(`- ${e.degree}, ${e.school} (${e.sub}), ${e.place}. ${e.period}. Status: ${e.status}.`);
  }
  out.push("");

  out.push("## Experience");
  out.push("");
  for (const j of experience) {
    out.push(`### ${j.role} — ${j.company}`);
    out.push(`${j.place} · ${j.period}`);
    out.push("");
    for (const b of j.bullets) out.push(`- ${b}`);
    out.push("");
    out.push(`Technologies: ${j.tags.join(", ")}`);
    out.push("");
  }

  /* ---- the work ---- */
  for (const group of projectsByCategory()) {
    out.push(`## ${CATEGORY_LABEL[group.category]}`);
    out.push("");

    for (const p of group.items) {
      out.push(`### ${heading(p)}`);
      out.push("");
      out.push(`- URL: ${projectUrl(p.slug)}`);
      out.push(`- Status: ${STATUS_LABEL[p.status]}`);
      out.push(`- Years: ${p.year}`);
      out.push(`- Role: ${p.role}`);
      out.push(`- Stack: ${p.stack.join(", ")}`);
      if (p.links.length) {
        out.push(`- Links: ${p.links.map((l) => `${l.label} (${l.href})`).join(", ")}`);
      }
      out.push("");
      out.push(`**Thesis.** ${p.thesis}`);
      out.push("");
      out.push(p.summary);
      out.push("");

      for (const sec of [p.problem, p.built, p.architecture, ...(p.deepDive ?? [])]) {
        if (!sec) continue;
        out.push(`#### ${sec.heading}`);
        out.push("");
        for (const para of sec.body) out.push(para + "\n");
        if (sec.points) {
          for (const pt of sec.points) out.push(`- ${pt}`);
          out.push("");
        }
      }

      if (p.flows?.length) {
        for (const f of p.flows) {
          out.push(`#### ${f.title}`);
          out.push("");
          if (f.caption) out.push(f.caption + "\n");
          for (const st of f.steps) {
            out.push(`- ${st.label}${st.detail ? ` — ${st.detail}` : ""}`);
            for (const b of st.branches ?? []) out.push(`  - ${b.label}`);
          }
          out.push("");
        }
      }

      if (p.tables?.length) {
        for (const t of p.tables) {
          out.push(`#### ${t.title}`);
          out.push("");
          if (t.caption) out.push(t.caption + "\n");
          out.push(`| ${t.head.join(" | ")} |`);
          out.push(`| ${t.head.map(() => "---").join(" | ")} |`);
          for (const r of t.rows) out.push(`| ${r.join(" | ")} |`);
          out.push("");
        }
      }

      if (p.metrics?.length) {
        out.push("#### Measured results");
        out.push("");
        for (const m of p.metrics) {
          out.push(`- **${m.value}** — ${m.label}. ${m.context}`);
        }
        out.push("");
      }

      if (p.experiments?.length) {
        out.push("#### Experiments");
        out.push("");
        for (const e of p.experiments) {
          out.push(`- **${e.name}**${e.negative ? " (negative result)" : ""}`);
          out.push(`  - Question: ${e.question}`);
          out.push(`  - Method: ${e.method}`);
          out.push(`  - Result: ${e.result}`);
        }
        out.push("");
      }

      if (p.limitations?.length) {
        out.push("#### Limitations and failure modes");
        out.push("");
        for (const l of p.limitations) out.push(`- ${l}`);
        out.push("");
      }

      if (p.repos?.length) {
        out.push("#### Repositories");
        out.push("");
        for (const r of p.repos) out.push(`- ${r.name} (${r.href}): ${r.contains}`);
        out.push("");
      }

      out.push("#### Attribution");
      out.push("");
      for (const a of p.attribution) {
        out.push(`- ${ATTRIBUTION_LABEL[a.kind]}: ${a.detail}`);
      }
      out.push("");
    }
  }

  /* ---- the rest ---- */
  out.push("## Patents");
  out.push("");
  for (const pt of patents) {
    out.push(`### ${pt.title}`);
    out.push(`${pt.status} · ${pt.number}`);
    out.push("");
    out.push(pt.body);
    out.push("");
  }

  out.push("## Skills");
  out.push("");
  for (const s of skills) {
    out.push(`- **${s.group}**: ${s.items.join(", ")}`);
  }
  out.push("");

  return out.join("\n");
}
