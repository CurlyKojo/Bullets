# HyperFrames pilot

The showcase Reel (post 036) rebuilt in [HyperFrames](https://github.com/heygen-com/hyperframes)
(Apache-2.0) to compare against the Remotion engine. Same cut, footage and copy; adds
transitions with a cause (light leak, whip, blur swap, zoom-through, iris from the Ghost's
eye), a drawn-on logo, and the 12 Ghost STLs as real 3D turntables via three.js.

```bash
npm run sync                      # footage into public/assets (once)
node pilot/build.mjs              # writes pilot/showcase/ and copies media in
cd pilot/showcase
export HYPERFRAMES_BROWSER_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
npx hyperframes@0.9.13 check
npx hyperframes@0.9.13 render --quality delivery -o renders/showcase-hyperframes.mp4
```

Edit `build.mjs`, not the generated HTML. GSAP and three.js are vendored in
`showcase/assets/lib/` because renders can't reach a CDN from the cloud sandbox.

First result: 15.0 s at 1080x1920 rendered in 2 min 34 s (Remotion: 5 min 31 s), and it passes
`check` plus our freeze and black-frame checks.
