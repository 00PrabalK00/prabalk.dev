import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import styles from "./door.module.css";

/**
 * The door.
 *
 * Two ways in: the cinematic one and the plain one. Deliberately a static
 * server component with no client JavaScript at all — the whole point is that
 * whichever door you pick, the choosing itself is instant. Nothing here imports
 * three, lenis or framer-motion, so none of that is fetched until someone
 * actually asks for it.
 *
 * There is no button on this page, and no panel either. Cards and rows both
 * had the same problem: they turned one sentence's worth of decision into
 * furniture, and the furniture was the loudest thing on screen. So the choice
 * is a sentence, the two options are words inside it, and a small arrow under
 * each one says so — underlines alone were not enough of a tell. The caption
 * below swaps to describe whichever option you are pointing at, done with
 * peer-hover rather than state so it costs nothing and works before hydration
 * would have happened anyway.
 */

export const metadata: Metadata = {
  title: "Prabal Khare — Robotics Engineer & Embodied AI",
  description:
    "Robotics software engineer building ROS 2 autonomy stacks for real robots. Pick your poison: the cinematic version, or the one that loads in a blink.",
  alternates: { canonical: `${SITE_URL}/` },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: "Robotics Engineer",
  email: `mailto:${profile.email}`,
  url: SITE_URL,
  sameAs: [profile.github, profile.linkedin, profile.youtube, profile.botopsy],
};

const links = [
  { label: "GitHub", href: profile.github },
  { label: "LinkedIn", href: profile.linkedin },
  { label: "YouTube", href: profile.youtube },
  { label: "Botopsy Lab", href: profile.botopsy },
  { label: "Resume", href: profile.resume },
  { label: "CV", href: profile.cv },
  { label: "Email", href: `mailto:${profile.email}` },
];

export default function Door() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      {/*
       * overflow-x-clip because the two routes behind this one are wide, and a
       * stray horizontal scrollbar on the door was pushing this column off its
       * own left edge.
       */}
      <main className="flex min-h-dvh flex-1 flex-col overflow-x-clip bg-ink">
        <div className="mx-auto flex w-full max-w-[52rem] flex-1 flex-col items-center px-6 text-center sm:px-10">
          <header className="pt-10 sm:pt-16">
            <p className="mono text-[11px] tracking-[0.24em] text-accent uppercase">
              {profile.name}
            </p>
            <p className="mono mt-2 text-[11px] tracking-[0.18em] text-mute uppercase">
              Robotics Engineer · Embodied AI · {profile.location}
            </p>

            {/*
             * Recruiters want the resume and engineers want the source; neither
             * should have to guess a door first, and neither should have to
             * scroll past the choice to find it. So these sit with the name
             * rather than in a footer — the sentence below is the only thing
             * that gets the middle of the page.
             */}
            <nav className="mt-6 flex flex-wrap items-baseline justify-center gap-x-5 gap-y-2">
              {links.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  {...(href.startsWith("mailto:")
                    ? {}
                    : { target: "_blank", rel: "noopener noreferrer" })}
                  className="mono text-[10px] tracking-[0.16em] text-mute uppercase underline decoration-line underline-offset-[5px] transition-colors hover:text-accent hover:decoration-accent"
                >
                  {label}
                </a>
              ))}
            </nav>
          </header>

          <div className="flex flex-1 flex-col justify-center py-14 sm:py-20">
            <p className="max-w-[24ch] text-[1.75rem] leading-[1.3] font-medium tracking-[-0.02em] text-balance text-bone sm:text-[2.5rem]">
              I build autonomy stacks for robots that move around real
              buildings.
            </p>

            {/*
             * The choice gets its own line so the arrows below each option hang
             * into reserved padding rather than into the next line of copy. The
             * captions are siblings of the two options — that is what peer-hover
             * walks — and all three are stacked in one absolutely positioned box
             * at the foot of that padding, so nothing reflows when one replaces
             * another. The resting line is the inverse case: it leaves when
             * either option is pointed at.
             */}
            <div
              /*
               * The padding is reserving two stacked things, not one: the
               * pointer hanging off the words (~60px) and the caption pinned to
               * the bottom of the box (up to four wrapped lines). Sized for the
               * longest caption so the two never meet.
               */
              className={`${styles.line} relative mt-9 pb-[17rem] text-[1.25rem] leading-[1.9] font-medium tracking-[-0.01em] text-balance text-bone sm:mt-12 sm:pb-[14rem] sm:text-[1.6rem]`}
            >
              Watch them the{" "}
              <Choice
                href="/cool-kids"
                peer="loud"
                color="var(--c-blue)"
                ink="var(--c-accent)"
              >
                loud way
              </Choice>{" "}
              or the{" "}
              <Choice
                href="/boring"
                peer="fast"
                color="var(--c-pink)"
                ink="var(--c-fault)"
              >
                fast way
              </Choice>
              .
              <Caption resting>Either one reaches the same robots.</Caption>
              <Caption peer="loud">
                Seven robots and the research, in 3D, flown past on your scroll
                wheel. WebGL and a real-time renderer — best on a laptop, and it
                takes a moment to load.
              </Caption>
              <Caption peer="fast">
                Every project, role and patent on a white page. No WebGL, under
                half the JavaScript, loads instantly.
              </Caption>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}

/**
 * One of the two words that are actually the navigation: a coloured underline,
 * plus — for whichever one the pointer currently belongs to — an arrow saying
 * so, because an underline alone still reads as emphasis rather than a link.
 *
 * The peer class sits on this wrapper rather than the anchor because the
 * captions are siblings of the wrapper, and peer-hover only walks siblings.
 */
function Choice({
  href,
  peer,
  color,
  ink,
  children,
}: {
  href: string;
  peer: "loud" | "fast";
  /** Vivid palette value — fine as a 3px rule, unreadable as type. */
  color: string;
  /** Same hue taken down until it carries small text on the ground. */
  ink: string;
  children: string;
}) {
  const loud = peer === "loud";

  return (
    <span
      className={`${styles.pick} ${loud ? styles.loud : styles.fast} ${
        loud ? "peer/loud" : "peer/fast"
      }`}
    >
      <Link
        href={href}
        style={{ textDecorationColor: color }}
        className="underline decoration-[3px] underline-offset-[6px] transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
      >
        {children}
      </Link>

      <span aria-hidden style={{ color: ink }} className={styles.pointer}>
        <span className={styles.arrow}>↑</span>
        <span className={`mono ${styles.label}`}>click me</span>
      </span>
    </span>
  );
}

/**
 * Captions occupy the same box and cross-fade. `resting` is the inverse case:
 * visible until either option is hovered or keyboard-focused.
 */
function Caption({
  peer,
  resting,
  children,
}: {
  peer?: "loud" | "fast";
  resting?: boolean;
  children: string;
}) {
  const shown = resting
    ? "opacity-100 peer-hover/loud:opacity-0 peer-focus-within/loud:opacity-0 peer-hover/fast:opacity-0 peer-focus-within/fast:opacity-0"
    : peer === "loud"
      ? "opacity-0 peer-hover/loud:opacity-100 peer-focus-within/loud:opacity-100"
      : "opacity-0 peer-hover/fast:opacity-100 peer-focus-within/fast:opacity-100";

  return (
    <span
      className={`mono absolute inset-x-0 bottom-0 mx-auto block max-w-[46ch] text-[11px] leading-[1.7] font-normal tracking-[0.04em] text-balance text-mute normal-case transition-opacity duration-200 ${shown}`}
    >
      {children}
    </span>
  );
}
