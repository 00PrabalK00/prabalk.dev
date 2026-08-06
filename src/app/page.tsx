import Nav from "@/components/Nav";
import Cinema from "@/components/Cinema";
import Smr300Section from "@/components/Smr300Section";
import GithubLive from "@/components/GithubLive";
import Timeline from "@/components/Timeline";
import Projects from "@/components/Projects";
import { Honors, Patents, Skills } from "@/components/Patents";
import Media from "@/components/Media";
import Contact from "@/components/Contact";
import { profile } from "@/lib/data";

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: "Robotics Software Engineer",
  email: `mailto:${profile.email}`,
  url: "https://prabalkhare.dev",
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

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <Nav />
      <Cinema />
      <main className="relative z-10 flex-1 bg-ink">
        <Smr300Section />
        <GithubLive />
        <Timeline />
        <Projects />
        <Patents />
        <Skills />
        <Honors />
        <Media />
      </main>
      <Contact />
    </>
  );
}
