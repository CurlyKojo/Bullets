// Odometer-style number: each digit is its own column of 0-9 that scrolls, and the
// higher places roll fewer turns, like a mechanical counter. The digit-travel and
// place-reveal approach follows remocn's rolling-number (https://github.com/Remocn/remocn,
// MIT License, Copyright (c) 2026 Remocn); rewritten here to support decimals, take an
// external progress value and use the brand's type.
import React from "react";
import { interpolate } from "remotion";

const wrap10 = (v: number) => ((v % 10) + 10) % 10;

export const Rolling: React.FC<{ value: number; decimals?: number; progress: number; fontSize: number; color: string; font: string }> = ({
  value,
  decimals = 0,
  progress,
  fontSize,
  color,
  font,
}) => {
  const end = Math.round(Math.abs(value) * 10 ** decimals);
  const digits = Math.max(String(end).length, decimals + 1);
  const current = progress * end;
  const cell = fontSize * 1.05;
  const cols: React.ReactNode[] = [];
  for (let place = digits - 1; place >= 0; place--) {
    const pow = 10 ** place;
    const pos = wrap10(progress * Math.floor(end / pow));
    // Leading places fade up as the count reaches them, so 500 doesn't start as "000".
    const reveal = place === 0 || place < decimals + 1 ? 1 : interpolate(current, [pow * 0.4, pow], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cols.push(
      <span key={place} style={{ display: "inline-block", overflow: "hidden", height: cell, width: "0.6em", textAlign: "center", opacity: reveal, transform: `translateY(${(1 - reveal) * fontSize * 0.3}px)` }}>
        <span style={{ display: "flex", flexDirection: "column", transform: `translateY(${-pos * cell}px)` }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
            <span key={i} style={{ height: cell, lineHeight: `${cell}px` }}>
              {d}
            </span>
          ))}
        </span>
      </span>,
    );
    if (decimals > 0 && place === decimals) cols.push(<span key="dot" style={{ display: "inline-block", height: cell, lineHeight: `${cell}px` }}>.</span>);
  }
  return <span style={{ display: "inline-flex", fontFamily: font, color, fontSize, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{cols}</span>;
};
