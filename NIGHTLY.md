# The daily run (one Reel a day, fully automatic)

One scheduled task in Claude Code on the web. Every afternoon it pulls fresh footage from
your project repos, renders the next Reel in the queue, writes more posts when the queue
runs low, commits, and republishes the download page. You open the page, save the video,
post it.

## Status

Running since 2026-11-02: the scheduled task "Kojo Labs daily Reel" fires at 3:41 PM
Pacific every day into the session the studio was built in. The steps below are for
setting it up again from another account or session.

## Set it up (about five minutes)

1. Make sure the Claude GitHub app covers this repo with push rights, plus read access to
   `CurlyKojo/Orbit-Simulation-` and `CurlyKojo/Flow-V2` (both private; the footage
   comes from them). Ghost and Wisp are public.
2. On claude.ai/code start a new session on this repo, branch `main`. Call it
   "Kojo Labs daily". Leave it open; the task fires into this same session every day.
3. Paste this as the first message:

   > Create a scheduled task bound to this session named "Kojo Labs daily Reel",
   > cron `CRON_TZ=America/Los_Angeles 41 15 * * *`, no notifications, whose prompt is the
   > whole contents of NIGHTLY.md's "The prompt" section, verbatim. Don't run it now.

4. Say "run the daily prompt now" once to test it. The first run creates the download
   page; it's private to you.

3:41 PM Pacific leaves time to render (3–5 minutes) before the 6–8 PM posting window.

## The prompt

Daily Kojo Labs Reel. Work in /home/user/Bullets (cd there first; it is the CurlyKojo/Bullets repo). Keep tokens low: run the scripts, read their reports, don't open video frames unless a script fails.

1. Get current: git fetch origin main and git checkout -B main origin/main. If node_modules is missing, run npm ci. Make sure the project repos are attached to this session (add_repo CurlyKojo/Orbit-Simulation- and CurlyKojo/Flow-V2 if a clone fails), then run `node scripts/sync.mjs`. A project that fails to sync is fine as long as today's post doesn't use it; say so in the report. Never push anything to the project repos.

2. Keep the queue full: run `node scripts/daily.mjs --dry`. If it says QUEUE EMPTY or LOW, write 7 new posts first, following posts/WRITING.md exactly: number them after the highest existing file, rotate projects, use only facts from projects/*.json and the project repos (Burnline's newest docs/devlog.md entry in .cache/repos/burnline is a good source of fresh, true material; so are recent commit messages), and reuse the hook formulas. Run `npm run check` until it passes.

3. Render: `node scripts/daily.mjs --mark`. If it fails, report the last lines and stop. If it prints PROBLEMS, look at out/latest/qa/contact.jpg once, fix the post or the code, and rerun.

4. Commit posts/state.json and any new posts as "Daily Reel: <post id>" with the attribution lines and push to main. No pull request. If the push is rejected, push a branch named daily/<date> and say so.

5. Hand it over through the download page. Read daily-artifact.json for its url. With the Artifact tool: `read` that url (once per session is enough), `list` with scope "files" and that url, then `publish` with that url, file_path out/latest/page.html, and files {"daily.mp4": {"from": "out/latest/reel.mp4", "contentType": "video/mp4"}, "cover.jpg": "out/latest/cover.jpg"}; no icon and no capabilities, so the page keeps its download capability. If the publish is refused with the live version, publish again from the same files. If daily-artifact.json has no url or the artifact can't be written, publish a new artifact instead: file_path out/latest/page.html, the same files, icon "video", capabilities {"downloads": true}, description "Today's Kojo Labs Reel with its caption and song, ready to post"; then write {"url": "<its url>"} to daily-artifact.json, commit it as "Daily Reel: download page", push to main, and say in the report that the page is new.

6. Only if IG_ACCESS_TOKEN and IG_USER_ID are set in this environment: run `node scripts/publish-instagram.mjs` and include the media id in the report.

Report in a few lines: the post id and hook, length, song and downbeat second, how many posts are left in the queue (and how many you wrote), anything that failed to sync, and the artifact url.

## Attribution lines

Commits end with the Co-Authored-By and Claude-Session lines Claude Code adds in that
session. Never put a model name in a commit.
