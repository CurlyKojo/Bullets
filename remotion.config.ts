import { Config } from "@remotion/cli/config";

// In the cloud sandbox scripts/render-env.mjs points this at the preinstalled headless
// shell; anywhere else Remotion downloads its own Chromium.
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
Config.setOverwriteOutput(true);
// Software GL (SwiftShader behind ANGLE) so the STL turntables render the same on any
// machine, GPU or not. Plain "swiftshader" cannot create a WebGL context in the headless shell.
Config.setChromiumOpenGlRenderer("swangle");
// Lossless frames into a near-transparent master. scripts/render.mjs re-encodes the
// upload copy at Instagram's sweet spot.
Config.setVideoImageFormat("png");
Config.setCrf(14);
Config.setX264Preset("slow");
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709");
