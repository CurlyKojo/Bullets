export type Bullet = {
  id: string;
  text: string;
  createdAt: number;
};

export type CharRange = {
  min: number;
  max: number;
};

export const PRESETS: { label: string; range: CharRange }[] = [
  { label: "Tight", range: { min: 80, max: 120 } },
  { label: "Standard", range: { min: 100, max: 160 } },
  { label: "Full", range: { min: 140, max: 200 } },
];

export const RANGE_SCALE_MAX = 500;
