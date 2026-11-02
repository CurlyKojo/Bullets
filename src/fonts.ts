import { continueRender, delayRender, staticFile } from "remotion";

// Bundled woff2 files so every render looks the same regardless of what the machine has.
const faces: [string, string, string][] = [
  ["Space Grotesk", "fonts/SpaceGrotesk-Bold.woff2", "300 700"],
  ["Inter", "fonts/Inter.woff2", "100 900"],
  ["JetBrains Mono", "fonts/JetBrainsMono.woff2", "100 800"],
];

if (typeof document !== "undefined") {
  const handle = delayRender("Loading fonts");
  Promise.all(
    faces.map(([family, file, weight]) =>
      new FontFace(family, `url(${staticFile(file)}) format('woff2')`, { weight }).load().then((f) => {
        (document.fonts as unknown as { add: (f: FontFace) => void }).add(f);
      }),
    ),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error("Font load failed", e);
      continueRender(handle);
    });
}
