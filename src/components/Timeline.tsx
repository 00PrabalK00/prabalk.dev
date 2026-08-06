"use client";

import { useState } from "react";
import { education, experience, leadership } from "@/lib/data";
import { Reveal, Section, Stat } from "@/components/ui";

export default function Timeline() {
  const [active, setActive] = useState(0);

  return (
    <Section
      id="experience"
      index="03 / TRACK"
      title="Where I've built"
      kicker="Embedded boards and sealed hulls first, then autonomy stacks that ship. Every role put hardware in front of me before software."
    >
      {/* education */}
      <div className="grid gap-y-10 md:grid-cols-2 md:gap-x-16">
        {education.map((e, i) => (
          <Reveal key={e.school} delay={i * 80}>
            <div>
              <div className="mono mb-4 flex items-center gap-3 text-[10px] tracking-[0.16em] uppercase">
                <span className={e.status === "incoming" ? "text-accent" : "text-pass"}>
                  {e.status === "incoming" ? "incoming" : "completing"}
                </span>
                <span className="text-mute/60">{e.period}</span>
              </div>
              <h3 className="text-2xl font-medium tracking-[-0.025em] text-bone">
                {e.school}
              </h3>
              <div className="mono mt-1 text-[11px] text-mute/70">{e.sub}</div>
              <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-mute">
                {e.degree}
              </p>
              <p className="mono mt-2 text-[11px] text-mute/60">{e.place}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="hairline my-20" />

      {/* experience — rail on the left, prose on the right */}
      <div className="grid gap-y-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-x-16">
        <nav className="lg:sticky lg:top-28 lg:self-start">
          <ul>
            {experience.map((x, i) => {
              const on = active === i;
              return (
                <li key={x.company}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className="block w-full py-3 text-left"
                  >
                    <span
                      className={`block text-[14px] tracking-[-0.01em] transition-colors ${
                        on ? "text-bone" : "text-mute hover:text-bone/80"
                      }`}
                      style={on ? { color: x.accent } : undefined}
                    >
                      {x.company.replace(" Co., Ltd.", "")}
                    </span>
                    <span className="mono mt-0.5 block text-[10px] tracking-[0.1em] text-mute/50">
                      {x.period}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div>
          {experience.map((x, i) =>
            active === i ? (
              <div key={x.company}>
                <h3 className="text-3xl leading-tight font-semibold tracking-[-0.035em] text-bone sm:text-4xl">
                  {x.role}
                </h3>
                <p className="mono mt-3 text-[12px]" style={{ color: x.accent }}>
                  {x.company} · {x.place} · {x.period}
                </p>

                <p className="mono mt-6 max-w-[60ch] text-[11px] leading-relaxed tracking-[0.05em] text-mute/70">
                  {x.tags.map((t, ti) => (
                    <span key={t}>
                      {ti > 0 && <span className="text-line-2"> / </span>}
                      {t}
                    </span>
                  ))}
                </p>

                <ul className="mt-10 space-y-6">
                  {x.bullets.map((b) => (
                    <li key={b} className="flex gap-5">
                      <span
                        className="mt-[11px] h-px w-6 shrink-0"
                        style={{ background: x.accent }}
                      />
                      <p className="max-w-[62ch] text-[15px] leading-[1.7] text-mute">
                        {b}
                      </p>
                    </li>
                  ))}
                </ul>

                {x.link && (
                  <a
                    href={x.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono mt-9 inline-block text-[11px] tracking-[0.14em] uppercase transition-opacity hover:opacity-70"
                    style={{ color: x.accent }}
                  >
                    Related repository ↗
                  </a>
                )}
              </div>
            ) : null
          )}
        </div>
      </div>

      <div className="hairline my-20" />

      {/* leadership numbers */}
      <div className="grid grid-cols-2 gap-x-10 gap-y-12 md:grid-cols-4">
        {leadership.map((l, i) => (
          <Reveal key={l.label} delay={i * 70}>
            <Stat
              value={l.value}
              prefix={"prefix" in l ? (l.prefix as string) : undefined}
              suffix={l.suffix}
              label={l.label}
              size="md"
              accent="var(--color-bone)"
            />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
