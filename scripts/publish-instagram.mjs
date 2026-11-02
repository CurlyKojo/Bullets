#!/usr/bin/env node
// Optional: post out/latest/reel.mp4 straight to Instagram through the Graph API.
//
//   node scripts/publish-instagram.mjs            # posts out/latest
//   node scripts/publish-instagram.mjs --dir out/002-ghost-talks
//   node scripts/publish-instagram.mjs --dry      # show what would be sent
//
// Needs a Professional (Business or Creator) Instagram account and a Meta app with the
// content-publishing permission. Set in .env or the environment:
//   IG_USER_ID       the Instagram professional account id
//   IG_ACCESS_TOKEN  a long-lived token with instagram_content_publish (or
//                    instagram_business_content_publish for Instagram Login)
//   IG_GRAPH_HOST    graph.facebook.com (Facebook Login, default) or graph.instagram.com
//   IG_GRAPH_VERSION default v23.0
//
// Trade-off: a Reel posted through the API can't carry an Instagram library song, so it
// goes out with the silent track. Trending audio is a big part of Reels reach; posting by
// hand from the download page and adding the song is the better default. Use this for
// days you can't post by hand.
//
// Flow (Meta's resumable upload, so no public video URL is needed): create a REELS
// container with upload_type=resumable, send the bytes to rupload.facebook.com, poll the
// container until FINISHED, then publish it.
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROOT, arg } from "./lib.mjs";

if (existsSync(join(ROOT, ".env"))) {
  for (const line of readFileSync(join(ROOT, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const { IG_USER_ID, IG_ACCESS_TOKEN } = process.env;
const HOST = process.env.IG_GRAPH_HOST ?? "graph.facebook.com";
const VER = process.env.IG_GRAPH_VERSION ?? "v23.0";
const dir = join(ROOT, arg("dir", "out/latest"));
const video = join(dir, "reel.mp4");
const caption = readFileSync(join(dir, "caption.txt"), "utf8").trim();
const report = JSON.parse(readFileSync(join(dir, "report.json"), "utf8"));
const size = statSync(video).size;

if (arg("dry")) {
  console.log({ host: HOST, version: VER, video, size, thumbOffsetMs: 1000, caption });
  process.exit(0);
}
if (!IG_USER_ID || !IG_ACCESS_TOKEN) {
  console.error("Set IG_USER_ID and IG_ACCESS_TOKEN (see the top of this file).");
  process.exit(1);
}

const graph = async (path, params, method = "POST") => {
  const url = new URL(`https://${HOST}/${VER}/${path}`);
  const body = new URLSearchParams({ ...params, access_token: IG_ACCESS_TOKEN });
  const res = method === "GET" ? await fetch(`${url}?${body}`) : await fetch(url, { method, body });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(`${path}: ${JSON.stringify(json.error ?? json)}`);
  return json;
};

// 1. Container. thumb_offset picks the cover frame (ms); 1 s in is the hook, words landed.
const container = await graph(`${IG_USER_ID}/media`, {
  media_type: "REELS",
  upload_type: "resumable",
  caption,
  share_to_feed: "true",
  thumb_offset: "1000",
});
console.log(`container ${container.id}`);

// 2. Bytes.
const up = await fetch(container.uri ?? `https://rupload.facebook.com/ig-api-upload/${VER}/${container.id}`, {
  method: "POST",
  headers: { Authorization: `OAuth ${IG_ACCESS_TOKEN}`, offset: "0", file_size: String(size) },
  body: readFileSync(video),
});
const upJson = await up.json().catch(() => ({}));
if (!up.ok || upJson.success === false) throw new Error(`upload failed: ${up.status} ${JSON.stringify(upJson)}`);
console.log(`uploaded ${(size / 1e6).toFixed(1)} MB`);

// 3. Wait for Instagram to process it (usually under a minute).
let status = "IN_PROGRESS";
for (let i = 0; i < 60 && status === "IN_PROGRESS"; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  ({ status_code: status } = await graph(container.id, { fields: "status_code" }, "GET"));
}
if (status !== "FINISHED") throw new Error(`container ${container.id} ended ${status}`);

// 4. Publish.
const post = await graph(`${IG_USER_ID}/media_publish`, { creation_id: container.id });
console.log(`published ${report.post} as media ${post.id}`);
