#!/usr/bin/env python3
"""Render Wisp's six states as vertical 1080x1920 MP4 loops, straight from the Wisp repo's
own animation code, so the Reels show the real thing at full resolution (the GIFs in that
repo are 480 px wide).

    python tools/wisp_render.py <wisp checkout> <out dir> [--seconds 6]

Needs pygame, cairosvg and Pillow (scripts/sync.mjs installs them if missing).
"""
import argparse
import os
import subprocess
import sys

ap = argparse.ArgumentParser()
ap.add_argument("repo")
ap.add_argument("out")
ap.add_argument("--seconds", type=float, default=6.0)
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--states", nargs="+", default=["idle", "listening", "thinking", "speaking", "happy", "sleepy"])
args = ap.parse_args()

os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
repo = os.path.abspath(args.repo)
args.out = os.path.abspath(args.out)
sys.path.insert(0, repo)
os.chdir(repo)

import pygame  # noqa: E402
from PIL import Image  # noqa: E402

import export_sprites as ex  # noqa: E402
from wisp_face import geometry as geo  # noqa: E402

pygame.init()
pygame.display.set_mode((8, 8))
os.makedirs(args.out, exist_ok=True)
ink = tuple(geo.palette.INK_RGB)
W, H = 1080, 1920

for state in args.states:
    dest = os.path.join(args.out, f"{state}.mp4")
    if os.path.exists(dest):
        print(f"{state}: cached")
        continue
    # At scale 3.6 the flame
    # fills about 65% of the Reel's width, its glow running off the canvas edges where
    # it has already faded to ink.
    frames = ex.render_frames(state, args.fps, 3.6, transparent=False, crop=True)
    size = frames[0].size
    loops = max(1, round(args.seconds * args.fps / len(frames)))
    enc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(args.fps),
         "-i", "-", "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", dest],
        stdin=subprocess.PIPE,
    )
    canvas = Image.new("RGB", (W, H), ink)
    for _ in range(loops):
        for fr in frames:
            c = canvas.copy()
            c.paste(fr.convert("RGB"), ((W - size[0]) // 2, int(H * 0.50 - size[1] / 2)))
            enc.stdin.write(c.tobytes())
    enc.stdin.close()
    enc.wait()
    print(f"{state}: {len(frames)} frames x{loops} -> {dest}")
