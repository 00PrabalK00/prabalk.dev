import { ImageResponse } from "next/og";

/**
 * Generated rather than a static file, so the numbers can never drift from the
 * ones on the page. Uses only system-default fonts — fetching a webfont here
 * would put a network call in the build path for no visual gain at this size.
 */
export const alt = "Prabal Khare — Robotics Software Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0a0d12";
const ACCENT = "#4da6ff";
const BONE = "#e6edf5";
const MUTE = "#7a8798";
const LINE = "#232c38";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: INK,
          padding: "64px 72px",
          position: "relative",
        }}
      >
        {/* accent bloom, top-left */}
        <div
          style={{
            position: "absolute",
            top: -260,
            left: -160,
            width: 720,
            height: 720,
            borderRadius: 9999,
            background: "rgba(77,166,255,0.16)",
            filter: "blur(120px)",
          }}
        />

        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 9999,
              background: "#3ddc97",
            }}
          />
          <div
            style={{
              fontSize: 20,
              letterSpacing: 4,
              color: MUTE,
              textTransform: "uppercase",
            }}
          >
            Robotics Software Engineer · Brooklyn, NY
          </div>
        </div>

        {/* name */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 132,
              lineHeight: 1,
              fontWeight: 700,
              letterSpacing: -6,
              color: BONE,
              display: "flex",
            }}
          >
            PRABAL KHARE
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 30,
              lineHeight: 1.35,
              color: MUTE,
              maxWidth: 900,
              display: "flex",
            }}
          >
            ROS 2 autonomy, localization, navigation and operator tooling for
            robots that ship.
          </div>
        </div>

        {/* stats */}
        <div
          style={{
            display: "flex",
            gap: 64,
            borderTop: `1px solid ${LINE}`,
            paddingTop: 28,
          }}
        >
          {[
            ["300 kg", "AMR shipped"],
            ["97%", "docking success"],
            ["2 cm", "docking error"],
            ["3", "patents filed"],
          ].map(([value, label]) => (
            <div
              key={label}
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <div
                style={{
                  fontSize: 46,
                  fontWeight: 700,
                  letterSpacing: -2,
                  color: ACCENT,
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontSize: 18,
                  letterSpacing: 2,
                  color: MUTE,
                  textTransform: "uppercase",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
