"use client";

import { useEffect, useState } from "react";
import { profile } from "@/lib/data";
import ThemeToggle from "@/components/ThemeToggle";

const LINKS = [
  { id: "smr300", label: "SMR300" },
  { id: "github", label: "Live" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "patents", label: "Patents" },
  { id: "skills", label: "Skills" },
  { id: "media", label: "Media" },
  { id: "contact", label: "Contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const max = document.body.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5] }
    );
    LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "border-b border-line bg-ink/80 backdrop-blur-xl"
            : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <a href="#top" className="group flex items-center">
            <span className="text-sm font-medium tracking-tight text-bone transition-colors group-hover:text-accent">
              {profile.name}
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                className={`mono px-3 py-2 text-[11px] tracking-[0.12em] uppercase transition-colors ${
                  active === l.id
                    ? "text-accent"
                    : "text-mute hover:text-bone"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href={profile.resumeDrive}
              target="_blank"
              rel="noopener noreferrer"
              className="mono hidden border border-accent/60 bg-accent/10 px-3 py-2 text-[11px] tracking-[0.12em] uppercase text-accent transition-colors hover:bg-accent hover:text-ink sm:block"
            >
              Résumé
            </a>
            <button
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center border border-line text-bone md:hidden"
            >
              <span className="mono text-xs">{open ? "×" : "≡"}</span>
            </button>
          </div>
        </div>

        {/* scroll progress */}
        <div
          className="h-px origin-left bg-accent transition-transform duration-150"
          style={{ transform: `scaleX(${progress})` }}
        />
      </header>

      {open && (
        <div className="fixed inset-x-0 top-16 z-40 border-b border-line bg-ink/95 backdrop-blur-xl md:hidden">
          <div className="grid grid-cols-2">
            {LINKS.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={() => setOpen(false)}
                className="mono border-b border-r border-line px-5 py-4 text-[11px] tracking-[0.14em] uppercase text-mute"
              >
                {l.label}
              </a>
            ))}
            <a
              href={profile.resumeDrive}
              target="_blank"
              rel="noopener noreferrer"
              className="mono col-span-2 px-5 py-4 text-[11px] tracking-[0.14em] uppercase text-accent"
            >
              Résumé ↗
            </a>
          </div>
        </div>
      )}
    </>
  );
}
