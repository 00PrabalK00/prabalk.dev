"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { cinema, damp, lerp, lerp3, range, smoothstep } from "@/lib/scroll";
import { ACT1_END, MONOLITH_Z, OUTRO, STATIONS } from "@/lib/cinema";
import { Monoliths, StationObject } from "@/components/three/stations";
import { P, STAGE } from "@/lib/palette";
import { resolveTheme, themeStore } from "@/lib/theme";

const accent = P.accent;
const CYAN = P.teal;
const PASS = P.pass;
const VIOLET = P.violet;

/* ------------------------------------------------------------------ */
/* Robot position along the aisle, as a function of scroll             */
/* ------------------------------------------------------------------ */
const SHELF_Z = -27;

/** Act-local progress: 0 → 1 across the warehouse act only. */
const act1 = (p: number) => Math.min(1, p / ACT1_END);

function robotZ(p: number): number {
  const u = act1(p);
  if (u < 0.14) return lerp(3.5, 1.5, smoothstep(range(u, 0, 0.14)));
  if (u < 0.44) return lerp(1.5, -21, smoothstep(range(u, 0.14, 0.44)));
  if (u < 0.56) return lerp(-21, SHELF_Z + 1.4, smoothstep(range(u, 0.44, 0.56)));
  return SHELF_Z + 1.4;
}

/* ------------------------------------------------------------------ */
/* Camera keyframes — position + look target, both interpolated        */
/* ------------------------------------------------------------------ */
type Key = {
  at: number;
  pos: [number, number, number];
  /** look target; if `followRobot`, z is offset from the robot instead */
  look: [number, number, number];
  followRobot?: boolean;
};

/** Act I: the warehouse. Times are act-local, rescaled to absolute below. */
const ACT1_KEYS: Key[] = [
  // low, behind, dark — the reveal
  { at: 0.0, pos: [0, 1.15, 11], look: [0, 1.0, 0], followRobot: true },
  // push in past the LiDAR puck as the scan fan sweeps
  { at: 0.13, pos: [1.5, 0.78, 3.4], look: [0, 0.62, -1.2], followRobot: true },
  // tracking alongside, driving
  { at: 0.29, pos: [5.6, 1.7, 3.5], look: [0, 0.7, 0], followRobot: true },
  // dropped to floor level, tags streaking past
  { at: 0.43, pos: [2.6, 0.36, 4.2], look: [0, 0.5, -2], followRobot: true },
  // the dock — ground level, head on
  { at: 0.56, pos: [0.05, 0.5, 5.4], look: [0, 0.9, -1.5], followRobot: true },
  // pull UP hard: the whole warehouse
  { at: 0.7, pos: [13, 17, -6], look: [0, 0, -16] },
  // rise out, warehouse dissolving into fog
  { at: 0.88, pos: [2, 26, 20], look: [0, 4, -10] },
  // punch forward into open space, heading down the corridor of work
  { at: 1.0, pos: [0, 4, 4], look: [0, 1, -14] },
];

/**
 * Act II+ is generated from the station script: an approach key (pulled back
 * along the view vector) and a hold key parked in front of each object, then
 * the patent monoliths and the final settle.
 */
function buildKeys(): Key[] {
  const keys: Key[] = ACT1_KEYS.map((k) => ({
    ...k,
    at: k.at * ACT1_END,
  }));

  for (const s of STATIONS) {
    const [px, py, pz] = s.pos;
    const [vx, vy, vz] = s.view;
    // approach: further out and wider, so arriving reads as a move-in
    keys.push({
      at: s.enter,
      pos: [px + vx * 1.85, py + vy * 1.45, pz + vz * 1.7],
      look: [px, py, pz],
    });
    // parked — the copy comes up here
    keys.push({
      at: s.from,
      pos: [px + vx, py + vy, pz + vz],
      look: [px, py, pz],
    });
    // barely-there drift so the hold is alive without pulling the eye
    keys.push({
      at: s.to,
      pos: [px + vx * 0.9, py + vy * 0.95, pz + vz * 0.93],
      look: [px, py, pz],
    });
  }

  // patents: pull back to see all four monoliths at once
  keys.push({
    at: OUTRO.patents.from - 0.028,
    pos: [0, 4, MONOLITH_Z + 26],
    look: [0, 0, MONOLITH_Z],
  });
  keys.push({
    at: OUTRO.patents.from,
    pos: [0, 1.4, MONOLITH_Z + 15],
    look: [0, 0, MONOLITH_Z],
  });
  keys.push({
    at: OUTRO.patents.to,
    pos: [0, 0.9, MONOLITH_Z + 12.5],
    look: [0, 0, MONOLITH_Z],
  });

  // final settle, looking back down the whole corridor
  keys.push({
    at: 1.0,
    pos: [0, 6, MONOLITH_Z + 30],
    look: [0, 2, MONOLITH_Z],
  });

  return keys.sort((a, b) => a.at - b.at);
}

const KEYS: Key[] = buildKeys();

function sampleKeys(p: number, rz: number) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].at) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = smoothstep(range(p, a.at, b.at));

  const aPos: [number, number, number] = a.followRobot
    ? [a.pos[0], a.pos[1], rz + a.pos[2]]
    : a.pos;
  const bPos: [number, number, number] = b.followRobot
    ? [b.pos[0], b.pos[1], rz + b.pos[2]]
    : b.pos;
  const aLook: [number, number, number] = a.followRobot
    ? [a.look[0], a.look[1], rz + a.look[2]]
    : a.look;
  const bLook: [number, number, number] = b.followRobot
    ? [b.look[0], b.look[1], rz + b.look[2]]
    : b.look;

  return { pos: lerp3(aPos, bPos, t), look: lerp3(aLook, bLook, t) };
}

/* ------------------------------------------------------------------ */
/* Seeded PRNG — layout must be identical every render                 */
/* ------------------------------------------------------------------ */
function makeRand(seedInit: number) {
  let seed = seedInit;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Warehouse floor — grid + PGV tags streaking past at floor level     */
/* ------------------------------------------------------------------ */
function Floor() {
  const tags = useMemo(() => {
    const out: [number, number][] = [];
    for (let z = 8; z >= -40; z -= 3) {
      out.push([-2.2, z]);
      out.push([2.2, z]);
    }
    return out;
  }, []);

  const tagMat = useRef<THREE.MeshBasicMaterial>(null);

  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    const u = act1(cinema.progress);
    // tags glow while the PGV beat is on screen
    if (tagMat.current) {
      const on = smoothstep(range(u, 0.24, 0.34));
      const off = 1 - smoothstep(range(u, 0.6, 0.72));
      tagMat.current.opacity = 0.1 + 0.55 * on * off;
    }
    // the floor itself is gone once we leave the warehouse
    if (group.current) group.current.visible = cinema.progress < ACT1_END + 0.02;
  });

  return (
    <group ref={group}>
      {/* polished concrete: low roughness so the env map gives it a sheen */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -14]}>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial
          color="#10161e"
          roughness={0.42}
          metalness={0.35}
          envMapIntensity={0.5}
        />
      </mesh>

      <gridHelper
        args={[160, 160, new THREE.Color("#1f2833"), new THREE.Color("#161d26")]}
        position={[0, 0.001, -14]}
      />
      <gridHelper
        args={[160, 32, new THREE.Color("#334252"), new THREE.Color("#334252")]}
        position={[0, 0.002, -14]}
      />

      {tags.map(([x, z], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.005, z]}>
          <planeGeometry args={[0.42, 0.42]} />
          {i === 0 ? (
            <meshBasicMaterial
              ref={tagMat}
              color={CYAN}
              transparent
              opacity={0.14}
              side={THREE.DoubleSide}
            />
          ) : (
            <meshBasicMaterial
              color={CYAN}
              transparent
              opacity={0.14}
              side={THREE.DoubleSide}
            />
          )}
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Racking — dissolves as the camera rises out                         */
/* ------------------------------------------------------------------ */
function Racks() {
  const group = useRef<THREE.Group>(null);

  const rows = useMemo(() => {
    const rand = makeRand(0x51ed270b);
    const out: { pos: [number, number, number]; h: number; w: number }[] = [];
    for (const side of [-1, 1]) {
      for (let i = 0; i < 18; i++) {
        const z = 6 - i * 3.1;
        const h = 2.6 + rand() * 3.2;
        out.push({ pos: [side * (5.4 + rand() * 0.6), h / 2, z], h, w: 2.2 });
        out.push({ pos: [side * (11 + rand() * 3), h / 2 + 1, z - 1], h: h + 2, w: 3 });
      }
    }
    return out;
  }, []);

  useFrame(() => {
    if (!group.current) return;
    const fade = 1 - smoothstep(range(act1(cinema.progress), 0.78, 0.95));
    group.current.visible = fade > 0.01;
    group.current.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (m && m.transparent) m.opacity = 0.9 * fade;
    });
  });

  return (
    <group ref={group}>
      {rows.map((r, i) => (
        <mesh key={i} position={r.pos}>
          <boxGeometry args={[r.w, r.h, 1.2]} />
          <meshStandardMaterial
            color="#1a222c"
            roughness={0.75}
            metalness={0.55}
            envMapIntensity={0.6}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* The shelf the robot docks under                                     */
/* ------------------------------------------------------------------ */
function Shelf() {
  const lift = useRef<THREE.Group>(null);
  const root = useRef<THREE.Group>(null);

  useFrame(() => {
    // shelf lifts once docking completes
    const t = smoothstep(range(act1(cinema.progress), 0.56, 0.63));
    if (lift.current) lift.current.position.y = 1.02 + t * 0.16;
    if (root.current) root.current.visible = cinema.progress < ACT1_END + 0.02;
  });

  return (
    <group ref={root} position={[0, 0, SHELF_Z]}>
      <group ref={lift}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.2, 0.12, 2.2]} />
          <meshStandardMaterial
            color={P.steel}
            roughness={0.5}
            metalness={0.85}
            envMapIntensity={1}
          />
        </mesh>
        {/* payload — cardboard-ish so it isn't all metal */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[2.0, 0.9, 2.0]} />
          <meshStandardMaterial color="#3d3428" roughness={0.95} metalness={0.02} />
        </mesh>
      </group>
      {/* legs with reflective markers */}
      {[
        [-0.9, -0.9],
        [0.9, -0.9],
        [-0.9, 0.9],
        [0.9, 0.9],
      ].map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, 0.5, z]}>
            <boxGeometry args={[0.11, 1.0, 0.11]} />
            <meshStandardMaterial
              color={P.steelLight}
              roughness={0.32}
              metalness={1}
              envMapIntensity={1.3}
            />
          </mesh>
          {/* retroreflective marker the LiDAR clusters on */}
          <mesh position={[x, 0.28, z]}>
            <boxGeometry args={[0.145, 0.16, 0.145]} />
            <meshStandardMaterial
              color={accent}
              emissive={accent}
              emissiveIntensity={2.6}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* SMR300 with a scan fan that ignites during the LiDAR beat           */
/* ------------------------------------------------------------------ */
function Robot() {
  const root = useRef<THREE.Group>(null);
  const fan = useRef<THREE.Mesh>(null);
  const fanMat = useRef<THREE.MeshBasicMaterial>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const led = useRef<THREE.MeshBasicMaterial>(null);
  const liftPlate = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    const p = cinema.progress;
    const u = act1(p);
    const t = state.clock.elapsedTime;

    if (root.current) {
      root.current.position.z = robotZ(p);
      root.current.visible = p < ACT1_END + 0.02;
      if (!root.current.visible) return;
    }

    // scan fan spins up during the LiDAR beat, stays on through the drive
    const scan = smoothstep(range(u, 0.08, 0.18)) * (1 - smoothstep(range(u, 0.72, 0.86)));
    if (fan.current) fan.current.rotation.z -= dt * 3.1 * (0.3 + scan);
    if (fanMat.current) fanMat.current.opacity = 0.17 * scan;

    const ring = (r: React.RefObject<THREE.Mesh | null>, offset: number) => {
      if (!r.current) return;
      const c = (t * 0.6 + offset) % 1;
      r.current.scale.setScalar(0.6 + c * 8);
      (r.current.material as THREE.MeshBasicMaterial).opacity = (1 - c) * 0.42 * scan;
    };
    ring(ringA, 0);
    ring(ringB, 0.5);

    // beacon: accent while driving, green once docked
    if (led.current) {
      const docked = smoothstep(range(u, 0.56, 0.62));
      led.current.color.lerpColors(
        new THREE.Color(accent),
        new THREE.Color(PASS),
        docked
      );
      led.current.opacity = 0.5 + Math.sin(t * 4) * 0.45;
    }

    // lift plate rises on dock
    if (liftPlate.current) {
      liftPlate.current.position.y = 0.52 + smoothstep(range(u, 0.56, 0.63)) * 0.16;
    }
  });

  return (
    <group ref={root}>
      {/* chassis — clearcoat reads as painted industrial steel */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[1.5, 0.42, 2.1]} />
        <meshPhysicalMaterial
          color={P.steel}
          roughness={0.38}
          metalness={0.9}
          clearcoat={0.55}
          clearcoatRoughness={0.28}
          envMapIntensity={1.1}
        />
      </mesh>

      {/* chamfer strip breaks the silhouette so it isn't a plain box */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.44, 0.06, 2.02]} />
        <meshStandardMaterial
          color={P.steelDark}
          roughness={0.5}
          metalness={0.85}
          envMapIntensity={1}
        />
      </mesh>

      <group ref={liftPlate}>
        <mesh>
          <boxGeometry args={[1.38, 0.16, 1.94]} />
          <meshPhysicalMaterial
            color={P.deck}
            roughness={0.26}
            metalness={0.95}
            clearcoat={0.4}
            envMapIntensity={1.25}
          />
        </mesh>
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.52, 0.52, 0.08, 40]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.3}
            metalness={0.55}
            emissive={accent}
            emissiveIntensity={0.22}
            envMapIntensity={1.2}
          />
        </mesh>
      </group>

      {/* safety stripes — emissive so they hold up in both themes */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.756, 0.28, 0]}>
          <boxGeometry args={[0.02, 0.1, 2.05]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={1.5}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* wheels: rubber tyre + machined hub */}
      {[
        [-0.78, -0.62],
        [0.78, -0.62],
        [-0.78, 0.62],
        [0.78, 0.62],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.19, z]} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.19, 0.19, 0.14, 28]} />
            <meshStandardMaterial
              color={P.rubber}
              roughness={0.92}
              metalness={0.05}
            />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.115, 0.115, 0.152, 20]} />
            <meshStandardMaterial
              color={P.steelLight}
              roughness={0.25}
              metalness={1}
              envMapIntensity={1.4}
            />
          </mesh>
        </group>
      ))}

      {/* LiDAR puck — dark glass dome over a machined base */}
      <mesh position={[0, 0.56, -0.92]}>
        <cylinderGeometry args={[0.16, 0.17, 0.1, 28]} />
        <meshStandardMaterial
          color={P.steelLight}
          roughness={0.3}
          metalness={1}
          envMapIntensity={1.4}
        />
      </mesh>
      <mesh position={[0, 0.645, -0.92]}>
        <cylinderGeometry args={[0.14, 0.15, 0.08, 28]} />
        <meshPhysicalMaterial
          color="#0b0e13"
          roughness={0.12}
          metalness={0.2}
          clearcoat={1}
          envMapIntensity={1.6}
        />
      </mesh>
      <mesh position={[0, 0.665, -0.92]}>
        <cylinderGeometry args={[0.105, 0.105, 0.03, 28]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>

      {/* PGV sensor */}
      <mesh position={[0, 0.1, -0.75]}>
        <boxGeometry args={[0.3, 0.08, 0.16]} />
        <meshStandardMaterial
          color={P.steelDark}
          roughness={0.4}
          metalness={0.8}
          emissive={CYAN}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* beacon */}
      <mesh position={[0.55, 0.52, 0.85]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial ref={led} color={accent} transparent />
      </mesh>

      {/* scan geometry */}
      <group position={[0, 0.62, -0.92]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh ref={fan}>
          <circleGeometry args={[6.2, 48, 0, Math.PI / 2.6]} />
          <meshBasicMaterial
            ref={fanMat}
            color={accent}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh ref={ringA}>
          <ringGeometry args={[0.93, 1, 64]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh ref={ringB}>
          <ringGeometry args={[0.93, 1, 64]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Planned path — draws itself ahead of the robot                      */
/* ------------------------------------------------------------------ */
function PlannedPath() {
  const seg = useRef<THREE.LineSegments>(null);
  const mat = useRef<THREE.LineDashedMaterial>(null);

  const geom = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.014, 4),
        new THREE.Vector3(0, 0.014, SHELF_Z + 1),
      ]),
    []
  );

  // Dashes only render once per-vertex line distances exist.
  useEffect(() => {
    seg.current?.computeLineDistances();
  }, []);

  useFrame(() => {
    if (!mat.current) return;
    const u = act1(cinema.progress);
    const on = smoothstep(range(u, 0.16, 0.26));
    const off = 1 - smoothstep(range(u, 0.66, 0.78));
    mat.current.opacity = 0.42 * on * off;
  });

  return (
    <lineSegments ref={seg} geometry={geom}>
      <lineDashedMaterial
        ref={mat}
        color={accent}
        dashSize={0.55}
        gapSize={0.4}
        transparent
        opacity={0}
      />
    </lineSegments>
  );
}

/* ------------------------------------------------------------------ */
/* Travelling key light — follows the camera so stations are lit       */
/* ------------------------------------------------------------------ */
function TravelLight() {
  const light = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!light.current) return;
    light.current.position.copy(state.camera.position);
    light.current.intensity =
      22 * smoothstep(range(cinema.progress, ACT1_END - 0.02, ACT1_END + 0.05));
  });

  return <pointLight ref={light} intensity={0} distance={34} color="#c9d6e6" />;
}

/* ------------------------------------------------------------------ */
/* Starfield behind everything, revealed in the space beat             */
/* ------------------------------------------------------------------ */
function Stars() {
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  const geo = useMemo(() => {
    const rand = makeRand(0x2f6b1a37);
    const n = 2600;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      // a long box of stars covering the whole flight corridor, not a sphere
      pos[i * 3] = (rand() - 0.5) * 150;
      pos[i * 3 + 1] = (rand() - 0.5) * 90;
      pos[i * 3 + 2] = 20 - rand() * 230;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((state, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.004;
    if (matRef.current) {
      matRef.current.opacity =
        0.55 * smoothstep(range(cinema.progress, ACT1_END * 0.82, ACT1_END + 0.04));
    }
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        ref={matRef}
        size={0.13}
        color="#9fb2c8"
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Director: drives camera + fog from scroll                           */
/* ------------------------------------------------------------------ */
function Director() {
  const pos = useRef(new THREE.Vector3(0, 1.15, 14.5));
  const look = useRef(new THREE.Vector3(0, 1, 3.5));

  useFrame((state, dt) => {
    const p = cinema.progress;
    const rz = robotZ(p);
    const target = sampleKeys(p, rz);

    const k = damp(dt, 0.0008);
    pos.current.lerp(new THREE.Vector3(...target.pos), k);
    look.current.lerp(new THREE.Vector3(...target.look), k);

    state.camera.position.copy(pos.current);
    state.camera.lookAt(look.current);

    // fog thickens to swallow the warehouse, then clears into open space
    const fog = state.scene.fog as THREE.FogExp2;
    if (fog) {
      const u = act1(p);
      const swallow = smoothstep(range(u, 0.7, 0.92));
      const clear = smoothstep(range(p, ACT1_END - 0.01, ACT1_END + 0.05));
      fog.density = lerp(lerp(0.026, 0.09, swallow), 0.0055, clear);
    }
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Scene root                                                          */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* Theme driver — crossfades background, fog and exposure               */
/* ------------------------------------------------------------------ */
function ThemeDriver() {
  // The theme-driven lights are owned here rather than passed in — a component
  // may not mutate refs it received as props.
  const ambient = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);

  const dark = useMemo(() => new THREE.Color(STAGE.dark.bg), []);
  const light = useMemo(() => new THREE.Color(STAGE.light.bg), []);
  // one Color, mutated in place — cloning per frame would allocate 60×/s
  const bg = useMemo(() => new THREE.Color(STAGE.dark.bg), []);

  useEffect(() => {
    themeStore.current = resolveTheme();
    themeStore.blend = themeStore.current === "light" ? 1 : 0;

    const onTheme = () => {
      themeStore.current = resolveTheme();
    };
    window.addEventListener("pk-theme", onTheme);
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", onTheme);
    return () => {
      window.removeEventListener("pk-theme", onTheme);
      mq.removeEventListener("change", onTheme);
    };
  }, []);

  useFrame((state, dt) => {
    const target = themeStore.current === "light" ? 1 : 0;
    themeStore.blend = lerp(themeStore.blend, target, damp(dt, 0.02));
    const b = themeStore.blend;

    bg.copy(dark).lerp(light, b);
    state.scene.background = bg;
    const fog = state.scene.fog as THREE.FogExp2;
    if (fog) fog.color.copy(bg);

    state.gl.toneMappingExposure = lerp(
      STAGE.dark.exposure,
      STAGE.light.exposure,
      b
    );

    // light mode needs far more fill or everything reads as a silhouette
    if (ambient.current) ambient.current.intensity = lerp(0.35, 1.15, b);
    if (hemi.current) {
      hemi.current.intensity = lerp(0.6, 1.5, b);
      hemi.current.groundColor.set(b > 0.5 ? "#c7d2e0" : "#05070a");
    }
    if (sun.current) sun.current.intensity = lerp(1.6, 2.6, b);
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.35} />
      <hemisphereLight ref={hemi} args={["#8fa4bd", "#05070a", 0.6]} />
      <directionalLight
        ref={sun}
        position={[14, 22, 10]}
        intensity={1.6}
        color="#eaf2ff"
      />
    </>
  );
}

export default function CinemaScene() {
  const [maxDpr, setMaxDpr] = useState(1.75);

  return (
    <Canvas
      dpr={[1, maxDpr]}
      performance={{ min: 0.5 }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
      }}
      camera={{ position: [0, 1.15, 14.5], fov: 46, near: 0.05, far: 320 }}
      onCreated={async ({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = STAGE.dark.exposure;
        gl.outputColorSpace = THREE.SRGBColorSpace;

        scene.background = new THREE.Color(STAGE.dark.bg);
        scene.fog = new THREE.FogExp2(STAGE.dark.fog, 0.026);

        // Without an environment map, metalness renders black — this is the
        // single biggest reason PBR scenes look "broken". RoomEnvironment ships
        // with three, so no CDN fetch and no HDR file to host.
        const { RoomEnvironment } = await import(
          "three/examples/jsm/environments/RoomEnvironment.js"
        );
        const pmrem = new THREE.PMREMGenerator(gl);
        pmrem.compileEquirectangularShader();
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environmentIntensity = 0.85;
        pmrem.dispose();
      }}
    >
      <PerformanceMonitor onDecline={() => setMaxDpr(1)} />
      <AdaptiveDpr pixelated={false} />

      {/* cool rim from behind keeps chassis edges legible on both themes */}
      <directionalLight position={[-12, 6, -18]} intensity={0.9} color={CYAN} />
      <pointLight position={[0, 3, 0]} intensity={16} distance={20} color={accent} />
      <pointLight position={[-9, 5, -12]} intensity={26} distance={30} color={CYAN} />
      <pointLight position={[8, 4, -30]} intensity={20} distance={26} color={VIOLET} />

      <ThemeDriver />

      <TravelLight />

      <Stars />
      <Floor />
      <Racks />
      <Shelf />
      <PlannedPath />
      <Robot />

      {STATIONS.map((s) => (
        <StationObject key={s.id} s={s} />
      ))}
      <Monoliths
        z={MONOLITH_Z}
        from={OUTRO.patents.from}
        to={OUTRO.patents.to}
      />

      <Director />
    </Canvas>
  );
}
