import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Prabal Khare — Portfolio",
  description:
    "Robotics software engineer. ROS 2 autonomy, localization, navigation and operator tooling. Experience, projects, patents and contact details.",
  alternates: { canonical: `${SITE_URL}/boring` },
};

/**
 * White, whatever the rest of the site is doing.
 *
 * The root layout paints `body` from `--c-ink`, which follows the theme toggle
 * and is near-black by default. This route is supposed to be the plain one, so
 * it pins the page surface rather than inheriting a token that can move under
 * it. Scoped to the route: the element unmounts on navigation away, taking the
 * override with it.
 *
 * `color-scheme: light` is set too, so form controls, scrollbars and focus
 * rings match the page instead of staying in the dark theme's palette.
 */
export default function BoringLayout({ children }: LayoutProps<"/boring">) {
  return (
    <>
      <style>{`
        html { color-scheme: light; }
        html, body { background: #ffffff; }
      `}</style>
      {children}
    </>
  );
}
