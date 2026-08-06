import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const grotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const mono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const SITE = "https://prabalkhare.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Prabal Khare — Robotics Software Engineer",
    template: "%s · Prabal Khare",
  },
  description:
    "Robotics software engineer building ROS 2 autonomy stacks, localization, navigation and operator tooling for real robots — including the 300 kg SMR300 industrial AMR.",
  keywords: [
    "robotics software engineer",
    "ROS 2",
    "Nav2",
    "autonomy engineer",
    "AMR",
    "CANopen",
    "CiA 402",
    "SLAM",
    "mechatronics",
    "Prabal Khare",
  ],
  authors: [{ name: "Prabal Khare", url: "https://github.com/00PrabalK00" }],
  creator: "Prabal Khare",
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Prabal Khare",
    title: "Prabal Khare — Robotics Software Engineer",
    description:
      "ROS 2 autonomy, localization, navigation and operator tooling for robots that ship. 97% docking success on a 300 kg industrial AMR.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prabal Khare — Robotics Software Engineer",
    description:
      "ROS 2 autonomy, localization, navigation and operator tooling for robots that ship.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0d12" },
    { media: "(prefers-color-scheme: light)", color: "#f4f6f9" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${grotesk.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        {/* Applies the stored theme before first paint — no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
