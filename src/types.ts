// The props every composition takes. scripts/plan.mjs builds these from a post script in
// posts/ and a project file in projects/; frame numbers are already on the beat grid.

export type Media = {
  kind: "video" | "image" | "stl" | "none";
  /** Path under public/, e.g. "assets/ghost/hero.png". */
  src: string;
  /** Filament colour for STL. */
  color?: string;
  /** Frames to skip into a video. */
  start?: number;
  /** cover fills the frame; contain letterboxes over a blurred copy (good for renders). */
  fit?: "cover" | "contain";
  /** Push-in direction for stills. */
  zoom?: "in" | "out";
};

export type SceneType = "hook" | "media" | "stat" | "type" | "split" | "grid" | "end";

export type Scene = {
  type: SceneType;
  from: number;
  dur: number;
  /** Big words. Wrap a word in *stars* to paint it in the accent colour. */
  title?: string;
  /** Smaller line under the title. */
  sub?: string;
  /** White caption chip, TikTok style. */
  caption?: string;
  media?: Media;
  media2?: Media;
  labels?: string[];
  items?: Media[];
  /** stat: the number to count to and its unit. */
  value?: number;
  decimals?: number;
  prefix?: string;
  unit?: string;
  /** type: raw input typed out, then the result it becomes. */
  before?: string;
  after?: string;
  meter?: { used: number; limit: number; label?: string };
};

export type ReelProps = {
  total: number;
  bpm: number;
  accent: string;
  project: { name: string; kind: string; link: string };
  handle: string;
  brand: string;
  scenes: Scene[];
};

export const DEMO: ReelProps = {
  total: 150,
  bpm: 128,
  accent: "#4fbef6",
  project: { name: "Kojo Builds", kind: "studio", link: "link in bio" },
  handle: "@kojobuilds",
  brand: "Kojo Builds",
  scenes: [
    { type: "hook", from: 0, dur: 75, title: "I build *apps* and 3D print the *hardware*", media: { kind: "none", src: "" } },
    { type: "end", from: 75, dur: 75, title: "Follow for the next build", sub: "link in bio" },
  ],
};
