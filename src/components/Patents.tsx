"use client";

import { honors, patents, skills } from "@/lib/data";
import { Reveal, Section } from "@/components/ui";

export function Patents() {
  return (
    <Section
      id="patents"
      index="05 / IP"
      title="Patents filed"
      kicker="Four Indian patent applications across hybrid aerial-ground robotics, thermal systems, inertial sensing and smart infrastructure."
    >
      <ol>
        {patents.map((p, i) => (
          <Reveal key={p.title} delay={i * 70}>
            <li className="border-t border-line/60 last:border-b">
              <article className="grid gap-x-12 gap-y-5 py-10 lg:grid-cols-[190px_minmax(0,1fr)]">
                <div>
                  <div className="mono text-[10px] tracking-[0.2em] uppercase text-accent">
                    {p.status}
                  </div>
                  <div className="mono mt-2 text-[12.5px] tabular-nums text-bone">
                    {p.number}
                  </div>
                </div>

                <div>
                  <h3 className="max-w-[30ch] text-2xl leading-[1.15] font-medium tracking-[-0.03em] text-bone sm:text-[1.9rem]">
                    {p.title}
                  </h3>
                  <p className="mt-5 max-w-[58ch] text-[15px] leading-[1.7] text-mute">
                    {p.body}
                  </p>
                  <p className="mono mt-6 text-[11px] tracking-[0.06em] text-mute/60">
                    {p.tags.map((t, ti) => (
                      <span key={t}>
                        {ti > 0 && <span className="text-line-2"> / </span>}
                        {t}
                      </span>
                    ))}
                  </p>
                </div>
              </article>
            </li>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

export function Skills() {
  return (
    <Section
      id="skills"
      index="06 / STACK"
      title="What I work with"
      kicker="Ordered by how much of it I've had to debug at 2 a.m. on a factory floor."
    >
      <dl>
        {skills.map((g, gi) => (
          <Reveal key={g.group} delay={gi * 60}>
            <div className="grid gap-x-12 gap-y-4 border-t border-line/60 py-8 last:border-b lg:grid-cols-[190px_minmax(0,1fr)]">
              <dt className="mono text-[10px] tracking-[0.2em] uppercase text-accent">
                {g.group}
              </dt>
              <dd className="flex flex-wrap gap-x-6 gap-y-3">
                {g.items.map((s) => (
                  <span
                    key={s}
                    className="mono text-[13px] text-mute transition-colors hover:text-bone"
                  >
                    {s}
                  </span>
                ))}
              </dd>
            </div>
          </Reveal>
        ))}
      </dl>
    </Section>
  );
}

export function Honors() {
  return (
    <Section
      id="honors"
      index="07 / RECORD"
      title="Competitions & teaching"
      kicker="Second place in Norway, top finishes at two national hackathons, and 150+ students taught along the way."
    >
      <ul>
        {honors.map((h, i) => (
          <Reveal key={h.title} delay={i * 55}>
            <li className="grid items-baseline gap-x-10 gap-y-2 border-t border-line/60 py-7 last:border-b sm:grid-cols-[minmax(0,1fr)_200px_70px]">
              <div>
                <h3 className="text-lg tracking-[-0.02em] text-bone sm:text-xl">
                  {h.title}
                </h3>
                <p className="mt-1.5 max-w-[52ch] text-[14px] leading-relaxed text-mute">
                  {h.body}
                </p>
              </div>
              <span className="mono text-[12px] tracking-[0.1em] text-accent">
                {h.result}
              </span>
              <span className="mono text-[11px] text-mute/60 sm:text-right">
                {h.year}
              </span>
            </li>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
