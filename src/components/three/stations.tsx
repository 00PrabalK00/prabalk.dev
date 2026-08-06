"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cinema, isLowPower, range, smoothstep } from "@/lib/scroll";
import type { Station } from "@/lib/cinema";
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

/**
 * Applies presence to every material under a group and hides it when zero.
 *
 * `depthWrite` is re-enabled once a material is essentially opaque — leaving
 * transparent geometry writing no depth is what makes PBR objects look like
 * they're inside-out during the fade.
 */
function useReveal(s: Station, ref: React.RefObject<THREE.Group | null>, max = 1) {
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const a = presence(cinema.progress, s);
    g.visible = a > 0.008;
    if (!g.visible) return;
    g.scale.setScalar(0.86 + a * 0.14);
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as
        | (THREE.Material & { opacity: number; depthWrite: boolean })
        | undefined;
      if (!m || !("opacity" in m)) return;
      const target = a * max;
      m.opacity = target;
      if (!o.userData.noDepth) m.depthWrite = target > 0.9;
    });
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

/** Local key + rim so a station is lit even between the travelling lights. */
function StationLights({ color }: { color: string }) {
  return (
    <>
      <pointLight position={[4, 4.5, 5]} intensity={38} distance={18} color="#eaf2ff" />
      <pointLight position={[-4.5, -1.5, -3]} intensity={26} distance={16} color={color} />
      <pointLight position={[0, -3.5, 3]} intensity={12} distance={12} color="#8fa4bd" />
    </>
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
      <StationLights color={s.color} />
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
      <StationLights color={s.color} />
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
            color="#ff5c5c"
            emissive="#ff5c5c"
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
          color="#f87171"
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
      <StationLights color={s.color} />
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
      <StationLights color={s.color} />
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
function CloudStation({ s }: { s: Station }) {
  const root = useRef<THREE.Group>(null);
  const cloud = useRef<THREE.Points>(null);
  const cracks = useRef<THREE.Group>(null);
  useReveal(s, root, 0.85);

  // a point cloud shaped like a bridge pier / wall section
  const geo = useMemo(() => {
    const rand = makeRand(0x77c1a4);
    const n = isLowPower() ? 1100 : 2600;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const face = Math.floor(rand() * 4);
      const u = (rand() - 0.5) * 2.6;
      const v = (rand() - 0.5) * 4.4;
      if (face === 0) {
        pos[i * 3] = u;
        pos[i * 3 + 1] = v;
        pos[i * 3 + 2] = 1.3;
      } else if (face === 1) {
        pos[i * 3] = u;
        pos[i * 3 + 1] = v;
        pos[i * 3 + 2] = -1.3;
      } else if (face === 2) {
        pos[i * 3] = 1.3;
        pos[i * 3 + 1] = v;
        pos[i * 3 + 2] = u;
      } else {
        pos[i * 3] = -1.3;
        pos[i * 3 + 1] = v;
        pos[i * 3 + 2] = u;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const crackLines = useMemo(() => {
    const rand = makeRand(0x2266aa);
    return Array.from({ length: 5 }).map(() => {
      const pts: THREE.Vector3[] = [];
      let x = (rand() - 0.5) * 2.2;
      let y = -2.0 + rand() * 3.4;
      for (let i = 0; i < 12; i++) {
        pts.push(new THREE.Vector3(x, y, 1.34));
        x += (rand() - 0.5) * 0.42;
        y += 0.16 + rand() * 0.12;
      }
      return segmentsFromPoints(pts);
    });
  }, []);

  useFrame((state, dt) => {
    if (cloud.current) cloud.current.rotation.y += dt * 0.14;
    if (cracks.current) {
      cracks.current.rotation.y += dt * 0.14;
      const pulse = 0.45 + Math.abs(Math.sin(state.clock.elapsedTime * 1.6)) * 0.5;
      cracks.current.children.forEach((c) => {
        const m = (c as THREE.LineSegments).material as THREE.LineBasicMaterial;
        m.opacity = pulse;
      });
    }
  });

  return (
    <group ref={root} position={s.pos} visible={false}>
      <StationLights color={s.color} />
      <points ref={cloud} geometry={geo}>
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
            <lineBasicMaterial color="#f87171" transparent opacity={0.8} />
          </lineSegments>
        ))}
      </group>

      {/* bounding box of the reconstruction */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(2.9, 4.7, 2.9)]} />
        <lineBasicMaterial color={s.color} transparent opacity={0.22} />
      </lineSegments>
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
      <StationLights color={s.color} />
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

  useFrame((state) => {
    const g = root.current;
    if (!g) return;
    const a =
      smoothstep(range(cinema.progress, from - 0.06, from + 0.01)) *
      (1 - smoothstep(range(cinema.progress, to + 0.01, to + 0.06)));
    g.visible = a > 0.008;
    if (!g.visible) return;
    const t = state.clock.elapsedTime;
    g.children.forEach((c, i) => {
      c.position.y = -0.4 + Math.sin(t * 0.5 + i * 1.3) * 0.16 + (1 - a) * -3;
      c.rotation.y = Math.sin(t * 0.25 + i) * 0.28;
      c.traverse((o) => {
        const m = (o as THREE.Mesh).material as
          | (THREE.Material & { opacity: number })
          | undefined;
        if (m && "opacity" in m) m.opacity = a * (o.type === "LineSegments" ? 0.65 : 0.85);
      });
    });
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
