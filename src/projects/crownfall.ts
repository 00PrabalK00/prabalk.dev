import type { Project } from "./types";

/**
 * CrownFall. A side project, not robotics: a strategy game that bolts a card
 * hand onto chess. Copy and screenshots come from crownfall.company.
 */
export const crownfall: Project = {
  slug: "crownfall",
  title: "CrownFall",
  subtitle: "Chess collapses into chaos: a chess and card strategy game",
  status: "active-development",
  year: "2026",
  role: "Author",
  category: "bench",
  order: 0,

  thesis:
    "Every turn is a chess move plus the cards in your hand: bend the rules, break the board, and save your King at the last moment.",

  summary:
    "A free strategy game that combines chess with card play, for Windows and Mac with online cross-play. 64 cards across four suits, reactions that can cancel a card, rewind a capture or escape checkmate, four bot opponents up to Grandmaster, 50 hand-built puzzles and online play with room codes. In free beta.",

  links: [
    {
      label: "crownfall.company",
      href: "https://crownfall.company",
      kind: "site",
    },
  ],

  stack: ["Windows", "macOS", "Online cross-play", "Game design"],

  built: {
    heading: "What it is",
    body: [
      "Each turn you make a chess move and play cards from your hand, paid for with Command and Guard, the two resources that fund your turn and power your opponent's reactions.",
    ],
    points: [
      "64 cards across four suits: Storm, Blade, Crown and Clock",
      "Reactions and finales: cancel a card, rewind a capture, escape checkmate",
      "Four bot opponents, from Starter to Grandmaster",
      "50 hand-built puzzles, from Novice to Grandmaster",
      "Online play with room codes, daily quests, Windows and Mac cross-play",
    ],
  },

  limitations: ["In free beta (v0.14.0 as of 22 October 2026)."],

  gallery: [
    {
      file: "crownfall-GameBoard.webp",
      type: "image",
      caption: "A game in progress: the chess board with the card hand",
    },
    {
      file: "crownfall-MainMenu.webp",
      type: "image",
      caption: "Main menu",
    },
    {
      file: "crownfall-CardLibrary.webp",
      type: "image",
      caption: "The card library, 64 cards across four suits",
    },
  ],

  attribution: [
    {
      kind: "built-by-me",
      detail: "Game design and development. Third-party credits are listed at crownfall.company/credits.",
    },
  ],

  related: [],
};
