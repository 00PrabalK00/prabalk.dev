import type { Project } from "./types";

export const contractencrypt: Project = {
  slug: "contractencrypt",
  subdomain: "contractencrypt",
  title: "ContractEncrypt",
  subtitle: "Lattice and ECC encryption under simulated quantum attack",
  status: "completed",
  year: "2025",
  role: "Author",
  category: "bench",
  order: 1,

  thesis:
    "Implement both schemes from the primitives, then attack them — because the interesting question is not which is faster but which assumption survives.",

  summary:
    "An LWE-based lattice scheme and P-256 ECDH with AES-CBC, implemented from the primitives and benchmarked on speed, ciphertext size, Shannon entropy and bit-flip resilience. Quantum attack circuits were then simulated in Qiskit against both.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/ContractEncrypt",
      kind: "repo",
    },
  ],

  stack: ["Python", "NumPy", "PyCryptodome", "Qiskit", "LWE", "ECC"],

  problem: {
    heading: "Problem",
    body: [
      "Post-quantum arguments are usually read rather than run. Implementing both schemes and simulating the attack makes the difference concrete: one hardness assumption has a known quantum algorithm against it and the other does not.",
    ],
  },

  built: {
    heading: "What I built",
    body: ["Both schemes, a benchmark, and the attack."],
    points: [
      "LWE-based lattice encryption implemented from the primitives",
      "P-256 ECDH with AES-CBC as the classical comparison",
      "Benchmarks on encryption and decryption speed, ciphertext size, Shannon entropy and bit-flip resilience",
      "Quantum attack circuits simulated in Qiskit and Qiskit-Aer against both schemes",
    ],
  },

  limitations: [
    "Simulated circuits on a classical machine. This demonstrates the structure of the attack, not its practicality at scale.",
    "Implemented from primitives for study. Not hardened, not constant-time, and not for production use.",
  ],

  attribution: [
    { kind: "built-by-me", detail: "Both implementations, the benchmark and the attack simulation." },
    { kind: "based-on-external-research", detail: "LWE, ECDH and the quantum algorithms are established work." },
  ],

  related: [],
};
