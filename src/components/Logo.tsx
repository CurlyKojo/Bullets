import React from "react";

// The Kojo Labs mark: a K drawn as one upright and two arms meeting at a node, inside a
// ring. The node reads as a solder joint, an orbit's periapsis or a graph vertex, which is
// the whole studio in one shape.
export const LogoMark: React.FC<{ size: number; color: string; accent: string; stroke?: number; ring?: boolean }> = ({
  size,
  color,
  accent,
  stroke = 6,
  ring = true,
}) => (
  <svg viewBox="0 0 100 100" width={size} height={size} fill="none" strokeLinecap="square">
    {ring && <circle cx="50" cy="50" r="46" stroke={color} strokeWidth={stroke * 0.5} opacity={0.35} />}
    <path d="M35 26 V74" stroke={color} strokeWidth={stroke} />
    <path d="M47 50 L67 26 M47 50 L67 74" stroke={color} strokeWidth={stroke} />
    <circle cx="47" cy="50" r={stroke * 1.15} fill={accent} />
  </svg>
);

export const Wordmark: React.FC<{ size: number; color: string; dim: string; font: string }> = ({ size, color, dim, font }) => (
  <span style={{ fontFamily: font, fontWeight: 600, fontSize: size, letterSpacing: -size * 0.035, color }}>
    Kojo<span style={{ color: dim, fontWeight: 400 }}> Labs</span>
  </span>
);
