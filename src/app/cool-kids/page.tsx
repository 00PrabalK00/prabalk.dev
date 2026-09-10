import type { Metadata } from "next";
import Cinema from "@/components/Cinema";
import Console from "@/components/Console";
import Achievements from "@/components/Achievements";
import { profile } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

/**
 * The cinematic site, moved off `/` to make room for the chooser.
 *
 * Unchanged otherwise — same three components in the same order. The structured
 * data lives here rather than on the chooser because this is the page that
 * actually carries the content it describes.
 */

export const metadata: Metadata = {
  title: "Prabal Khare — Robotics Software Engineer",
  description:
    "The full cinematic flight: a 300 kg AMR, six robots, and the autonomy stack behind them.",
  alternates: { canonical: `${SITE_URL}/cool-kids` },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: "Robotics Software Engineer",
  email: `mailto:${profile.email}`,
  url: SITE_URL,
  sameAs: [profile.github, profile.linkedin, profile.youtube, profile.botopsy],
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "Vellore Institute of Technology, Chennai" },
    { "@type": "CollegeOrUniversity", name: "New York University, Tandon School of Engineering" },
  ],
  knowsAbout: [
    "ROS 2",
    "Nav2",
    "Autonomous mobile robots",
    "SLAM",
    "CANopen",
    "Sensor fusion",
    "Computer vision",
  ],
};

export default function CoolKids() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <main className="flex-1">
        <Cinema />
        <Console />
      </main>
      <Achievements />
    </>
  );
}
