import Cinema from "@/components/Cinema";
import Console from "@/components/Console";
import { profile } from "@/lib/data";

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: "Robotics Software Engineer",
  email: `mailto:${profile.email}`,
  url: "https://prabalkhare.com",
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
      <main className="flex-1">
        <Cinema />
        <Console />
      </main>
    </>
  );
}
