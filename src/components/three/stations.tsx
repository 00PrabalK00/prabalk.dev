"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cinema, isLowPower, range, smoothstep } from "@/lib/scroll";
import { STATIONS, type Station } from "@/lib/cinema";
import { P } from "@/lib/palette";

/** Seeded PRNG so every layout is identical on every render. */
function makeRand(seedInit: number) {
  let seed = seedInit;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build a geometry for `<lineSegments>` from a polyline.
 * JSX `<line>` resolves to SVGLineElement, not THREE.Line, so every continuous
 * stroke has to be emitted as duplicated segment pairs instead.
 */
function segmentsFromPoints(pts: THREE.Vector3[]) {
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < pts.length - 1; i++) out.push(pts[i], pts[i + 1]);
  return new THREE.BufferGeometry().setFromPoints(out);
}

/**
 * Presence: fades in across the approach so the object is fully solid by the
 * time the camera parks, and only starts leaving after the copy is gone.
 */
function presence(p: number, s: Station) {
  const inn = smoothstep(range(p, s.enter - 0.012, s.from - 0.004));
  const out = 1 - smoothstep(range(p, s.to + 0.008, s.to + 0.032));
  return inn * out;
}

type RevealMaterial = THREE.Material & { opacity: number; depthWrite: boolean };

/**
 * Darkens and warms a station's surfaces, once, on first sight.
 *
 * The station materials were authored against a near-black stage — cool pale
 * greys picked to catch a rim light out of the dark. On the Soft Beach sweep
 * they are lighter than several parts of the background, so the objects read
 * as fog rather than as hardware.
 *
 * `LIGHT_ADJUST` already does this for the warehouse act, but it is applied in
 * CinemaScene and never reached anything in this file, so the stations were the
 * only things on screen that never got the light-stage treatment.
 *
 * A multiply rather than a rewrite of the thirty-odd hex values: this is one
 * tunable number applied uniformly, it preserves the relative values the
 * modelling depends on, and it cannot silently miss a material. The tint is
 * warm-biased so the greys drift toward the sand family instead of staying
 * blue against a warm palette.
 */
const SURFACE_TINT = new THREE.Color(0.62, 0.575, 0.58);
const EMISSIVE_TINT = new THREE.Color(0.72, 0.68, 0.69);

function darkenForLightStage(m: THREE.Material) {
  const mat = m as THREE.Material & {
    color?: THREE.Color;
    emissive?: THREE.Color;
    userData: Record<string, unknown>;
  };
  // Guarded: these run inside a lazily-populated cache, and applying the
  // multiply twice would take the surfaces to mud.
  if (mat.userData.pkDarkened) return;
  mat.userData.pkDarkened = true;
  if (mat.color) mat.color.multiply(SURFACE_TINT);
  if (mat.emissive) mat.emissive.multiply(EMISSIVE_TINT);
}

/**
 * Applies presence to every material under a group and hides it when zero.
 *
 * `depthWrite` is re-enabled once a material is essentially opaque — leaving
 * transparent geometry writing no depth is what makes PBR objects look like
 * they're inside-out during the fade.
 *
 * The material list is gathered once and cached. This used to run a full
 * `Object3D.traverse` of the station's subtree on every frame it was on
 * screen — walking dozens of nodes and doing an `in` check on each, sixty
 * times a second, to reach a set of materials that never changes. The
 * subtrees are declared statically in JSX and gain no children at runtime, so
 * the walk only ever produced the same answer.
 *
 * Writes are also gated on the value actually changing. Assigning
 * `material.opacity` flags the material's uniforms for re-upload, and while a
 * station is parked at full presence the value is a flat 1 for hundreds of
 * consecutive frames.
 */
function useReveal(s: Station, ref: React.RefObject<THREE.Group | null>, max = 1) {
  const mats = useRef<RevealMaterial[] | null>(null);
  const noDepth = useRef<boolean[]>([]);
  /** Last presence written, quantised. -1 so the first frame always applies. */
  const lastStep = useRef(-1);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;

    const a = presence(cinema.progress, s);
    const visible = a > 0.008;
    if (g.visible !== visible) g.visible = visible;
    if (!visible) return;

    if (mats.current === null) {
      const list: RevealMaterial[] = [];
      const flags: boolean[] = [];
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material;
        if (!m || Array.isArray(m) || !("opacity" in m)) return;
        darkenForLightStage(m);
        list.push(m as RevealMaterial);
        flags.push(Boolean(o.userData.noDepth));
      });
      mats.current = list;
      noDepth.current = flags;
    }

    const target = a * max;
    const step = Math.round(target * 200);
    if (step === lastStep.current) return;
    lastStep.current = step;

    const value = step / 200;
    const writeDepth = value > 0.9;

    g.scale.setScalar(0.86 + a * 0.14);
    for (let i = 0; i < mats.current.length; i++) {
      const m = mats.current[i];
      m.opacity = value;
      if (!noDepth.current[i]) m.depthWrite = writeDepth;
    }
  });
}

/* Shared material presets — every station uses the same PBR vocabulary. */
const METAL = {
  roughness: 0.32,
  metalness: 1,
  envMapIntensity: 1.35,
} as const;

const PAINTED = {
  roughness: 0.45,
  metalness: 0.65,
  envMapIntensity: 1.05,
} as const;

/**
 * One key/rim/fill rig, moved to whichever station is currently on screen.
 *
 * This used to be three `<pointLight>`s per station, declared INSIDE the group
 * whose `visible` is toggled — and that was the single most expensive thing in
 * the flight.
 *
 * three bakes the scene's light counts into the shader as literals
 * (`NUM_POINT_LIGHTS` is string-replaced into the GLSL source,
 * three.module.js:6458) and hashes them into the program cache key
 * (three.module.js:7846). A hidden object contributes no lights, because
 * `projectObject` returns before `pushLight` for anything invisible. So every
 * station appearing or disappearing changed the scene's point-light count,
 * which invalidated the cached program for EVERY material in the scene and
 * recompiled the lot mid-scroll. Measured at up to 367 ms on an Intel UHD —
 * twenty-two dropped frames, in the middle of a camera move.
 *
 * Precompiling could not have fixed it: the variants needed during the flight
 * are the ones with a single station lit, and a warm-up pass with everything
 * visible compiles the eighteen-light variant that never actually occurs.
 *
 * Hoisted here, the count is fixed at three for the whole run. The rig moves to
 * the most-present station and fades on its presence, which is nearly the same
 * image — the windows barely overlap, so there is almost never a second station
 * that wanted its own key light.
 */
export function StationRig() {
  const group = useRef<THREE.Group>(null);
  const key = useRef<THREE.PointLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  const fill = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const g = group.current;
    if (!g) return;

    let best: Station | null = null;
    let bestA = 0;
    for (const s of STATIONS) {
      const a = presence(cinema.progress, s);
      if (a > bestA) {
        bestA = a;
        best = s;
      }
    }

    // Nothing on screen: leave the rig where it is and take it to black. Moving
    // it would drag a dying highlight across the scene.
    if (key.current) key.current.intensity = 38 * bestA;
    if (rim.current) rim.current.intensity = 26 * bestA;
    if (fill.current) fill.current.intensity = 12 * bestA;
    if (!best || bestA <= 0.001) return;

    g.position.set(best.pos[0], best.pos[1], best.pos[2]);
    if (rim.current) rim.current.color.set(best.color);
  });

  return (
    <group ref={group}>
      <pointLight
        ref={key}
        position={[4, 4.5, 5]}
        intensity={0}
        distance={18}
        color="#f4fdfd"
      />
      <pointLight ref={rim} position={[-4.5, -1.5, -3]} intensity={0} distance={16} />
      <pointLight
        ref={fill}
        position={[0, -3.5, 3]}
        intensity={0}
        distance={12}
        color="#bfa4ac"
      />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* MIRA — sealed-hull AUV with hydrophone rings and rising bubbles     */
/* ------------------------------------------------------------------ */
function AuvStation({ s }: { s: Station }) {
  const root = useRef<THREE.Group>(null);
  const hull = useRef<THREE.Group>(null);
  const bubbles = useRef<THREE.Points>(null);
  useReveal(s, root, 0.9);

  const bubbleGeo = useMemo(() => {
    const rand = makeRand(0x1a77c3);
    const n = isLowPower() ? 110 : 260;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      // kept close to the frame so the bubbles read as coming off the vehicle
      pos[i * 3] = (rand() - 0.5) * 5.5;
      pos[i * 3 + 1] = (rand() - 0.5) * 5;
      pos[i * 3 + 2] = (rand() - 0.5) * 5.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (hull.current) {
      hull.current.rotation.y = t * 0.16;
      hull.current.position.y = Math.sin(t * 0.7) * 0.14;
    }
    if (bubbles.current) {
      bubbles.current.rotation.y -= dt * 0.05;
      const arr = bubbles.current.geometry.attributes.position
        .array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] += dt * 0.42;
        if (arr[i] > 2.5) arr[i] = -2.5;
      }
      bubbles.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Open aluminium space-frame: longitudinal rails, cross members, uprights.
  const FR = { x: 1.55, y: 0.82, z: 1.15 };
  const rails: {
    pos: [number, number, number];
    size: [number, number, number];
  }[] = [
    // longitudinal (along Z)
    ...[-1, 1].flatMap((sx) =>
      [-1, 1].map(
        (sy) =>
          ({
            pos: [sx * FR.x, sy * FR.y, 0],
            size: [0.1, 0.1, FR.z * 2],
          }) as (typeof rails)[number]
      )
    ),
    // lateral (along X)
    ...[-1, 1].flatMap((sz) =>
      [-1, 1].map(
        (sy) =>
          ({
            pos: [0, sy * FR.y, sz * FR.z],
            size: [FR.x * 2, 0.1, 0.1],
          }) as (typeof rails)[number]
      )
    ),
    // uprights
    ...[-1, 1].flatMap((sx) =>
      [-1, 1].map(
        (sz) =>
          ({
            pos: [sx * FR.x, 0, sz * FR.z],
            size: [0.1, FR.y * 2, 0.1],
          }) as (typeof rails)[number]
      )
    ),
  ];

  // Six ducted thrusters: four vectored on the corners, two vertical.
  const thrusters: {
    pos: [number, number, number];
    rot: [number, number, number];
  }[] = [
    { pos: [-1.55, -0.42, -0.78], rot: [0, Math.PI / 4, Math.PI / 2] },
    { pos: [1.55, -0.42, -0.78], rot: [0, -Math.PI / 4, Math.PI / 2] },
    { pos: [-1.55, -0.42, 0.78], rot: [0, -Math.PI / 4, Math.PI / 2] },
    { pos: [1.55, -0.42, 0.78], rot: [0, Math.PI / 4, Math.PI / 2] },
    { pos: [-0.95, 0.52, 0], rot: [0, 0, 0] },
    { pos: [0.95, 0.52, 0], rot: [0, 0, 0] },
  ];

  return (
    <group ref={root} position={s.pos} visible={false}>
      <group ref={hull}>
        {/* space-frame */}
        {rails.map((r, i) => (
          <mesh key={i} position={r.pos}>
            <boxGeometry args={r.size} />
            <meshStandardMaterial
              color="#d8dee6"
              roughness={0.34}
              metalness={0.9}
              envMapIntensity={1.35}
              transparent
            />
          </mesh>
        ))}

        {/* main electronics pressure housing, acrylic dome forward */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.44, 0.44, 1.5, 36]} />
          <meshPhysicalMaterial
            color="#39424f"
            roughness={0.22}
            metalness={1}
            clearcoat={0.7}
            envMapIntensity={1.5}
            transparent
          />
        </mesh>
        <mesh position={[0, 0, -0.75]} rotation={[-Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[0.44, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial
            color="#cfe6f5"
            roughness={0.04}
            metalness={0}
            transmission={0.92}
            thickness={0.35}
            ior={1.45}
            clearcoat={1}
            envMapIntensity={1.6}
            transparent
          />
        </mesh>
        {/* housing clamps */}
        {[-0.5, 0.5].map((z) => (
          <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.47, 0.47, 0.08, 36]} />
            <meshStandardMaterial color="#8d98a8" {...METAL} transparent />
          </mesh>
        ))}

        {/* battery pod slung underneath */}
        <mesh position={[0, -0.5, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 1.05, 28]} />
          <meshStandardMaterial
            color={s.color}
            {...PAINTED}
            emissive={s.color}
            emissiveIntensity={0.3}
            transparent
          />
        </mesh>

        {/* forward camera dome */}
        <mesh position={[0, 0.42, -0.9]}>
          <sphereGeometry args={[0.2, 24, 24]} />
          <meshPhysicalMaterial
            color="#cfe6f5"
            roughness={0.05}
            transmission={0.9}
            thickness={0.2}
            ior={1.45}
            transparent
          />
        </mesh>

        {/* ducted thrusters: shroud, hub, blades */}
        {thrusters.map((t, i) => (
          <group key={i} position={t.pos} rotation={t.rot}>
            <mesh>
              <cylinderGeometry args={[0.28, 0.28, 0.34, 28, 1, true]} />
              <meshStandardMaterial
                color="#1c232c"
                roughness={0.48}
                metalness={0.9}
                envMapIntensity={1.2}
                side={THREE.DoubleSide}
                transparent
              />
            </mesh>
            <mesh>
              <cylinderGeometry args={[0.09, 0.09, 0.36, 16]} />
              <meshStandardMaterial color="#aab6c4" {...METAL} transparent />
            </mesh>
            {[0, Math.PI / 3, (2 * Math.PI) / 3].map((r) => (
              <mesh key={r} rotation={[0, r, 0.34]}>
                <boxGeometry args={[0.5, 0.015, 0.13]} />
                <meshStandardMaterial
                  color="#7f8b9a"
                  roughness={0.4}
                  metalness={0.85}
                  transparent
                />
              </mesh>
            ))}
          </group>
        ))}

        {/* hydrophones — the sonar cue now lives ON the frame, not orbiting it */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 1.55, -0.82, -1.15]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.22, 16]} />
              <meshStandardMaterial
                color={s.color}
                emissive={s.color}
                emissiveIntensity={1.8}
                toneMapped={false}
                transparent
              />
            </mesh>
          </group>
        ))}
      </group>

      <points ref={bubbles} geometry={bubbleGeo}>
        <pointsMaterial
          size={0.055}
          color={s.color}
          transparent
          opacity={0.5}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* VTOL UAV — X-frame, spinning rotor discs, thermal scan cone         */
/* ------------------------------------------------------------------ */
function VtolStation({ s }: { s: Station }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const rotors = useRef<THREE.Group>(null);
  const cone = useRef<THREE.Mesh>(null);
  useReveal(s, root, 0.9);

  // Lift rotors sit on twin booms fore and aft of the wing — the quadrotor
  // layout this used to have was a multirotor, not a VTOL.
  const lifts: [number, number][] = [
    [1.85, -1.35],
    [-1.85, -1.35],
    [1.85, 1.5],
    [-1.85, 1.5],
  ];

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (body.current) {
      body.current.position.y = Math.sin(t * 1.1) * 0.1;
      // gentle bank and yaw, like a machine holding a hover in wind
      body.current.rotation.z = Math.sin(t * 0.8) * 0.055;
      body.current.rotation.x = Math.sin(t * 0.6) * 0.03;
      body.current.rotation.y = t * 0.12;
    }
    if (rotors.current) {
      rotors.current.children.forEach((c, i) => {
        c.rotation.y += dt * (i % 2 ? -26 : 26);
      });
    }
    if (cone.current) {
      const m = cone.current.material as THREE.MeshBasicMaterial;
      m.opacity = (0.1 + Math.abs(Math.sin(t * 1.3)) * 0.1) * (root.current?.visible ? 1 : 0);
    }
  });

  return (
    <group ref={root} position={s.pos} visible={false}>
      <group ref={body}>
        {/* fuselage — slender pod, nose forward (-Z) */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.26, 1.7, 10, 24]} />
          <meshPhysicalMaterial
            color="#e8edf3"
            roughness={0.32}
            metalness={0.1}
            clearcoat={0.9}
            clearcoatRoughness={0.14}
            envMapIntensity={1.2}
            transparent
          />
        </mesh>
        {/* nose cone */}
        <mesh position={[0, 0, -1.16]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.26, 0.5, 24]} />
          <meshPhysicalMaterial
            color="#23303c"
            roughness={0.22}
            metalness={0.4}
            clearcoat={1}
            envMapIntensity={1.4}
            transparent
          />
        </mesh>

        {/* main wing — a foam plank, matte, not a glossy composite */}
        <mesh position={[0, 0.06, 0.1]}>
          <boxGeometry args={[4.6, 0.07, 0.72]} />
          <meshStandardMaterial
            color="#eef1f5"
            roughness={0.86}
            metalness={0.02}
            envMapIntensity={0.6}
            transparent
          />
        </mesh>
        {/* wing leading-edge accent */}
        <mesh position={[0, 0.06, -0.24]}>
          <boxGeometry args={[4.6, 0.075, 0.12]} />
          <meshStandardMaterial
            color={s.color}
            emissive={s.color}
            emissiveIntensity={0.9}
            toneMapped={false}
            transparent
          />
        </mesh>
        {/* tape bands across the wing, like the real airframe */}
        {[-1.5, -0.55, 0.55, 1.5].map((x) => (
          <mesh key={x} position={[x, 0.075, 0.1]}>
            <boxGeometry args={[0.26, 0.02, 0.74]} />
            <meshStandardMaterial
              color="#d9b25a"
              roughness={0.8}
              metalness={0.05}
              transparent
            />
          </mesh>
        ))}

        {/* twin lift booms running fore-aft under the wing */}
        {[-1.85, 1.85].map((x) => (
          <mesh key={x} position={[x, 0.02, 0.08]}>
            <boxGeometry args={[0.13, 0.13, 3.4]} />
            <meshStandardMaterial color="#5c677a" {...METAL} transparent />
          </mesh>
        ))}

        {/* tail boom + conventional tail */}
        <mesh position={[0, 0.06, 1.55]}>
          <boxGeometry args={[0.11, 0.11, 1.6]} />
          <meshStandardMaterial color="#5c677a" {...METAL} transparent />
        </mesh>
        <mesh position={[0, 0.06, 2.3]}>
          <boxGeometry args={[1.5, 0.05, 0.42]} />
          <meshStandardMaterial color="#e8edf3" {...PAINTED} transparent />
        </mesh>
        <mesh position={[0, 0.42, 2.3]}>
          <boxGeometry args={[0.05, 0.7, 0.42]} />
          <meshStandardMaterial color="#e8edf3" {...PAINTED} transparent />
        </mesh>

        {/* exposed avionics tray on top of the wing */}
        <mesh position={[0, 0.16, 0.42]}>
          <boxGeometry args={[0.5, 0.16, 0.6]} />
          <meshStandardMaterial color="#2a323d" roughness={0.6} metalness={0.4} transparent />
        </mesh>
        <mesh position={[0.16, 0.25, 0.42]}>
          <boxGeometry args={[0.1, 0.03, 0.2]} />
          <meshStandardMaterial
            color={s.color}
            emissive={s.color}
            emissiveIntensity={2}
            toneMapped={false}
            transparent
          />
        </mesh>

        {/* four lift rotors on the booms */}
        <group ref={rotors}>
          {lifts.map(([x, z], i) => (
            <group key={i} position={[x, 0.16, z]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.6, 0.68, 40]} />
                <meshBasicMaterial
                  color={s.color}
                  transparent
                  opacity={0.4}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
              {/* two blades, so it reads as a prop rather than a bar */}
              {[0, Math.PI / 2].map((r) => (
                <mesh key={r} rotation={[0, r, 0]}>
                  <boxGeometry args={[1.28, 0.018, 0.08]} />
                  <meshStandardMaterial
                    color="#aeb9c7"
                    roughness={0.4}
                    metalness={0.8}
                    transparent
                    opacity={0.65}
                  />
                </mesh>
              ))}
              <mesh>
                <cylinderGeometry args={[0.075, 0.075, 0.16, 14]} />
                <meshStandardMaterial color="#5c677a" {...METAL} transparent />
              </mesh>
            </group>
          ))}
        </group>

        {/* rear pusher prop — the cruise motor */}
        <group position={[0, 0, 1.18]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.2, 16]} />
            <meshStandardMaterial color="#5c677a" {...METAL} transparent />
          </mesh>
          <mesh position={[0, 0, 0.14]}>
            <circleGeometry args={[0.52, 32]} />
            <meshBasicMaterial
              color={s.color}
              transparent
              opacity={0.16}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>

        {/* thermal camera pod: gimbal housing + hot lens */}
        <mesh position={[0, -0.28, 0.35]}>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshStandardMaterial color="#2c3742" {...PAINTED} transparent />
        </mesh>
        <mesh position={[0, -0.36, 0.47]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.06, 20]} />
          <meshStandardMaterial
            color="#e8899b"
            emissive="#e8899b"
            emissiveIntensity={2.4}
            toneMapped={false}
            transparent
          />
        </mesh>
      </group>

      {/* downward thermal scan cone */}
      <mesh ref={cone} position={[0, -3.2, 0.35]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[2.1, 5.6, 32, 1, true]} />
        <meshBasicMaterial
          color="#e8899b"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Kurat — head, perception ring, speech waveform arcs                 */
/* ------------------------------------------------------------------ */
function CompanionStation({ s }: { s: Station }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const bars = useRef<THREE.Group>(null);
  useReveal(s, root, 0.92);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.5) * 0.42;
      head.current.position.y = 0.3 + Math.sin(t * 0.9) * 0.08;
    }
    if (ring.current) ring.current.rotation.z += dt * 0.7;
    if (bars.current) {
      bars.current.children.forEach((c, i) => {
        const h = 0.14 + Math.abs(Math.sin(t * 3 + i * 0.7)) * 0.85;
        c.scale.y = h;
      });
    }
  });

  return (
    <group ref={root} position={s.pos} visible={false}>
      {/* body — soft matte shell, not another metal box */}
      <mesh position={[0, -1.15, 0]}>
        <cylinderGeometry args={[0.78, 1.05, 1.5, 40]} />
        <meshPhysicalMaterial
          color="#dfe4ea"
          roughness={0.62}
          metalness={0.04}
          clearcoat={0.5}
          clearcoatRoughness={0.5}
          envMapIntensity={1}
          transparent
        />
      </mesh>
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.1, 40]} />
        <meshStandardMaterial color="#8d98a8" {...METAL} transparent />
      </mesh>

      <group ref={head}>
        {/* gloss black visor sphere */}
        <mesh>
          <sphereGeometry args={[0.86, 44, 44]} />
          <meshPhysicalMaterial
            color="#12161c"
            roughness={0.1}
            metalness={0.25}
            clearcoat={1}
            clearcoatRoughness={0.06}
            envMapIntensity={1.7}
            transparent
          />
        </mesh>
        {/* RealSense bar */}
        <mesh position={[0, 0.06, 0.79]}>
          <boxGeometry args={[0.95, 0.19, 0.1]} />
          <meshStandardMaterial
            color={s.color}
            emissive={s.color}
            emissiveIntensity={2.2}
            toneMapped={false}
            transparent
          />
        </mesh>
        {/* eyes */}
        {[-0.26, 0.26].map((x) => (
          <mesh key={x} position={[x, 0.24, 0.76]}>
            <sphereGeometry args={[0.1, 20, 20]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={1.6}
              toneMapped={false}
              transparent
            />
          </mesh>
        ))}
      </group>

      {/* perception ring */}
      <mesh ref={ring} position={[0, 0.3, 0]} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[1.85, 0.018, 8, 80]} />
        <meshBasicMaterial color={s.color} transparent opacity={0.55} />
      </mesh>

      {/* speech waveform */}
      <group ref={bars} position={[0, -0.2, 1.5]}>
        {Array.from({ length: 13 }).map((_, i) => (
          <mesh key={i} position={[(i - 6) * 0.17, 0, 0]}>
            <boxGeometry args={[0.06, 1, 0.06]} />
            <meshBasicMaterial color={s.color} transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* ABB IRB140 — articulated arm tracing a glowing stroke path          */
/* ------------------------------------------------------------------ */
function ArmStation({ s }: { s: Station }) {
  const root = useRef<THREE.Group>(null);
  const j1 = useRef<THREE.Group>(null);
  const j2 = useRef<THREE.Group>(null);
  const j3 = useRef<THREE.Group>(null);
  useReveal(s, root, 0.92);

  // the "drawing" the arm is routing through
  const strokeGeo = useMemo(() => {
    const rand = makeRand(0x3b91ff);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 220; i++) {
      const a = (i / 220) * Math.PI * 6;
      const r = 0.5 + (i / 220) * 1.5 + rand() * 0.06;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0.01, Math.sin(a) * r));
    }
    return segmentsFromPoints(pts);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (j1.current) j1.current.rotation.y = Math.sin(t * 0.55) * 0.9;
    if (j2.current) j2.current.rotation.z = -0.5 + Math.sin(t * 0.7) * 0.32;
    if (j3.current) j3.current.rotation.z = 0.75 + Math.sin(t * 0.7 + 1.1) * 0.3;
  });

  // ABB industrial orange, painted rather than raw metal
  const link = (
    <meshPhysicalMaterial
      color="#e07b2c"
      roughness={0.34}
      metalness={0.15}
      clearcoat={0.85}
      clearcoatRoughness={0.14}
      envMapIntensity={1.15}
      transparent
    />
  );

  return (
    <group ref={root} position={s.pos} visible={false}>
      {/* base */}
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.85, 1.0, 0.28, 40]} />
        <meshStandardMaterial color="#2b3441" {...PAINTED} transparent />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.08, 40]} />
        <meshStandardMaterial color="#98a4b3" {...METAL} transparent />
      </mesh>

      <group ref={j1} position={[0, 0.3, 0]}>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.7, 0.8, 0.7]} />
          {link}
        </mesh>
        <group ref={j2} position={[0, 0.8, 0]}>
          <mesh position={[0, 0.85, 0]}>
            <boxGeometry args={[0.42, 1.7, 0.42]} />
            {link}
          </mesh>
          <group ref={j3} position={[0, 1.7, 0]}>
            <mesh position={[0.75, 0, 0]}>
              <boxGeometry args={[1.5, 0.34, 0.34]} />
              {link}
            </mesh>
            {/* pen */}
            <mesh position={[1.5, -0.22, 0]}>
              <cylinderGeometry args={[0.05, 0.02, 0.5, 16]} />
              <meshStandardMaterial
                color={s.color}
                emissive={s.color}
                emissiveIntensity={2}
                toneMapped={false}
                transparent
              />
            </mesh>
          </group>
        </group>
      </group>

      {/* the routed stroke path on the table */}
      <lineSegments geometry={strokeGeo}>
        <lineBasicMaterial color={s.color} transparent opacity={0.7} />
      </lineSegments>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* OpenDroneKit — reconstructed structure, cracks lit in red           */
/* ------------------------------------------------------------------ */
/**
 * The reconstruction volume, and everything inside it.
 *
 * Derived rather than written twice. The cloud, the cracks and the wireframe
 * were three independent sets of hard-coded numbers, and nothing checked that
 * the first two fitted inside the third — which is how the cracks ended up
 * climbing out through the top face.
 */
const CLOUD_HALF_XZ = 1.3;
const CLOUD_HALF_Y = 2.2;
/** Margin between the scanned surface and the drawn volume. */
const BOX_MARGIN = 0.15;
const BOX_HALF_XZ = CLOUD_HALF_XZ + BOX_MARGIN;
const BOX_HALF_Y = CLOUD_HALF_Y + BOX_MARGIN;
/** Cracks sit just proud of the front face so they read as surface damage. */
const CRACK_Z = CLOUD_HALF_XZ + 0.04;

function CloudStation({ s }: { s: Station }) {
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const cracks = useRef<THREE.Group>(null);
  useReveal(s, root, 0.85);

  // a point cloud shaped like a bridge pier / wall section
  const geo = useMemo(() => {
    const rand = makeRand(0x77c1a4);
    const n = isLowPower() ? 1100 : 2600;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const face = Math.floor(rand() * 4);
      const u = (rand() - 0.5) * 2 * CLOUD_HALF_XZ;
      const v = (rand() - 0.5) * 2 * CLOUD_HALF_Y;
      if (face === 0) {
        pos[i * 3] = u;
        pos[i * 3 + 1] = v;
        pos[i * 3 + 2] = CLOUD_HALF_XZ;
      } else if (face === 1) {
        pos[i * 3] = u;
        pos[i * 3 + 1] = v;
        pos[i * 3 + 2] = -CLOUD_HALF_XZ;
      } else if (face === 2) {
        pos[i * 3] = CLOUD_HALF_XZ;
        pos[i * 3 + 1] = v;
        pos[i * 3 + 2] = u;
      } else {
        pos[i * 3] = -CLOUD_HALF_XZ;
        pos[i * 3 + 1] = v;
        pos[i * 3 + 2] = u;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  /**
   * Cracks that climb the front face without leaving it.
   *
   * The rise per step is now derived from the headroom actually left above the
   * starting point and divided across the remaining segments, so a crack that
   * starts high simply climbs more gently instead of running off the top. The
   * previous version drew a fixed 0.16-0.28 per step from a start as high as
   * +1.4, which reached y = 4.48 against a ceiling of 2.35.
   *
   * The jitter is kept — it is what makes these read as cracks rather than
   * tally marks — but it multiplies the derived rise instead of adding to a
   * constant, and both axes are clamped as a backstop.
   */
  const crackLines = useMemo(() => {
    const rand = makeRand(0x2266aa);
    const SEGMENTS = 12;
    const TOP = CLOUD_HALF_Y - 0.12;
    const SIDE = CLOUD_HALF_XZ - 0.1;

    return Array.from({ length: 5 }).map(() => {
      const pts: THREE.Vector3[] = [];
      let x = (rand() - 0.5) * 2 * SIDE * 0.85;
      let y = -CLOUD_HALF_Y + 0.1 + rand() * 1.6;

      // Spread whatever room is left over the segments that remain.
      const rise = (TOP - y) / (SEGMENTS - 1);

      for (let i = 0; i < SEGMENTS; i++) {
        pts.push(new THREE.Vector3(x, y, CRACK_Z));
        x = Math.max(-SIDE, Math.min(SIDE, x + (rand() - 0.5) * 0.42));
        y = Math.min(TOP, y + rise * (0.7 + rand() * 0.6));
      }
      return segmentsFromPoints(pts);
    });
  }, []);

  useFrame((state, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.14;
    if (cracks.current) {
      const pulse = 0.45 + Math.abs(Math.sin(state.clock.elapsedTime * 1.6)) * 0.5;
      cracks.current.children.forEach((c) => {
        const m = (c as THREE.LineSegments).material as THREE.LineBasicMaterial;
        m.opacity = pulse;
      });
    }
  });

  return (
    <group ref={root} position={s.pos} visible={false}>

      {/*
        The volume turns with what is inside it.

        The cloud is a square tube of half-width 1.3, so its corners sit at
        radius 1.84 — well outside the 1.45 half-width of the box. Spinning the
        contents inside a fixed box therefore swept those corners out through
        the walls twice per revolution. Rotating the box too keeps it wrapped
        around the faces at every angle, and keeps the margin tight; the
        alternative was a box a third wider that only ever looked correct at
        45 degrees.
      */}
      <group ref={spin}>
        <points geometry={geo}>
          <pointsMaterial
            size={0.038}
            color={s.color}
            transparent
            opacity={0.7}
            sizeAttenuation
            depthWrite={false}
          />
        </points>

        <group ref={cracks}>
          {crackLines.map((g, i) => (
            <lineSegments key={i} geometry={g}>
              <lineBasicMaterial color="#e8899b" transparent opacity={0.8} />
            </lineSegments>
          ))}
        </group>

        {/* bounding box of the reconstruction */}
        <lineSegments>
          <edgesGeometry
            args={[
              new THREE.BoxGeometry(BOX_HALF_XZ * 2, BOX_HALF_Y * 2, BOX_HALF_XZ * 2),
            ]}
          />
          <lineBasicMaterial color={s.color} transparent opacity={0.22} />
        </lineSegments>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Continuum — context graph, packets travelling along the edges       */
/* ------------------------------------------------------------------ */
function GraphStation({ s }: { s: Station }) {
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const packets = useRef<THREE.Group>(null);
  useReveal(s, root, 0.92);

  const { nodes, edges } = useMemo(() => {
    const rand = makeRand(0x9911fe);
    const n = 11;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = 1.5 + rand() * 1.5;
      pts.push(
        new THREE.Vector3(
          Math.cos(a) * r,
          (rand() - 0.5) * 3.4,
          Math.sin(a) * r
        )
      );
    }
    const e: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      e.push([i, (i + 1) % n]);
      if (i % 3 === 0) e.push([i, (i + 5) % n]);
    }
    return { nodes: pts, edges: e };
  }, []);

  const edgeGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    edges.forEach(([a, b]) => {
      pts.push(nodes[a], nodes[b]);
    });
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [edges, nodes]);

  useFrame((state, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.16;
    if (packets.current) {
      const t = state.clock.elapsedTime;
      packets.current.children.forEach((c, i) => {
        const [a, b] = edges[i % edges.length];
        const k = ((t * 0.35 + i * 0.19) % 1);
        c.position.lerpVectors(nodes[a], nodes[b], k);
      });
    }
  });

  return (
    <group ref={root} position={s.pos} visible={false}>
      <group ref={spin}>
        <lineSegments geometry={edgeGeo}>
          <lineBasicMaterial color={s.color} transparent opacity={0.3} />
        </lineSegments>

        {nodes.map((p, i) => (
          <mesh key={i} position={p}>
            <icosahedronGeometry args={[i % 4 === 0 ? 0.22 : 0.13, 1]} />
            <meshStandardMaterial
              color={s.color}
              emissive={s.color}
              emissiveIntensity={i % 4 === 0 ? 2.2 : 1.1}
              toneMapped={false}
              transparent
              opacity={0.9}
            />
          </mesh>
        ))}

        <group ref={packets}>
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh key={i}>
              <sphereGeometry args={[0.065, 14, 14]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={2.6}
                toneMapped={false}
                transparent
                opacity={0.95}
              />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Patent monoliths — four slabs standing at the end of the flight     */
/* ------------------------------------------------------------------ */
export function Monoliths({
  z,
  from,
  to,
}: {
  z: number;
  from: number;
  to: number;
}) {
  const root = useRef<THREE.Group>(null);
  /** Same caching as useReveal — one walk instead of one per slab per frame. */
  const mats = useRef<{ m: THREE.Material & { opacity: number }; line: boolean }[] | null>(
    null
  );
  const lastStep = useRef(-1);

  useFrame((state) => {
    const g = root.current;
    if (!g) return;
    const a =
      smoothstep(range(cinema.progress, from - 0.06, from + 0.01)) *
      (1 - smoothstep(range(cinema.progress, to + 0.01, to + 0.06)));

    const visible = a > 0.008;
    if (g.visible !== visible) g.visible = visible;
    if (!visible) return;

    // The slabs drift and turn continuously, so these do have to be written
    // every frame — unlike the opacities below.
    const t = state.clock.elapsedTime;
    g.children.forEach((c, i) => {
      c.position.y = -0.4 + Math.sin(t * 0.5 + i * 1.3) * 0.16 + (1 - a) * -3;
      c.rotation.y = Math.sin(t * 0.25 + i) * 0.28;
    });

    if (mats.current === null) {
      const list: { m: THREE.Material & { opacity: number }; line: boolean }[] = [];
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material;
        if (!m || Array.isArray(m) || !("opacity" in m)) return;
        darkenForLightStage(m);
        list.push({
          m: m as THREE.Material & { opacity: number },
          line: o.type === "LineSegments",
        });
      });
      mats.current = list;
    }

    const step = Math.round(a * 200);
    if (step === lastStep.current) return;
    lastStep.current = step;
    const value = step / 200;
    for (const { m, line } of mats.current) m.opacity = value * (line ? 0.65 : 0.85);
  });

  return (
    <group ref={root} position={[0, 0, z]} visible={false}>
      {[-3.4, 0, 3.4].map((x, i) => (
        <group key={x} position={[x, -0.4, 0]}>
          {/* polished obsidian slab — the env map does the work here */}
          <mesh>
            <boxGeometry args={[1.5, 4.4, 0.28]} />
            <meshPhysicalMaterial
              color="#0f141b"
              roughness={0.08}
              metalness={0.4}
              clearcoat={1}
              clearcoatRoughness={0.05}
              envMapIntensity={1.8}
              transparent
            />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(1.5, 4.4, 0.28)]} />
            <lineBasicMaterial color={P.accent} transparent opacity={0.65} />
          </lineSegments>
          {/* filing seal */}
          <mesh position={[0, 1.5, 0.16]}>
            <ringGeometry args={[0.26, 0.32, 40]} />
            <meshStandardMaterial
              color={i === 0 ? P.pass : P.accent}
              emissive={i === 0 ? P.pass : P.accent}
              emissiveIntensity={2.4}
              toneMapped={false}
              transparent
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */
export function StationObject({ s }: { s: Station }) {
  switch (s.kind) {
    case "auv":
      return <AuvStation s={s} />;
    case "vtol":
      return <VtolStation s={s} />;
    case "companion":
      return <CompanionStation s={s} />;
    case "arm":
      return <ArmStation s={s} />;
    case "cloud":
      return <CloudStation s={s} />;
    case "graph":
      return <GraphStation s={s} />;
  }
}
