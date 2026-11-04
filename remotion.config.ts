import { Config } from "@remotion/cli/config";

// In the cloud sandbox scripts/render-env.mjs points this at the preinstalled headless
// shell; anywhere else Remotion downloads its own Chromium.
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
Config.setOverwriteOutput(true);
// Software GL (SwiftShader behind ANGLE) so the STL turntables render the same on any
// machine, GPU or not. Plain "swiftshader" cannot create a WebGL context in the headless shell.
Config.setChromiumOpenGlRenderer("swangle");
// Frames are captured as high-quality JPEG (95) rather than PNG: measured ~25% faster per
// frame, and no visible difference once the master is encoded to H.264 and then
// re-encoded by Instagram. scripts/daily.mjs re-encodes the upload copy.
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCrf(14);
Config.setX264Preset("slow");
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709");
