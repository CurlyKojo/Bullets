# What makes a Reel spread, and how this repo applies it

Research summary, November 2026. Most public data on Reels is third-party (marketing
blogs and vendor studies), so the numbers below are directional; Instagram Insights on
this account is the final word. Sources are listed at the bottom.

## What Instagram ranks on

Adam Mosseri named three signals for Reels in January 2025, and 2026 coverage still
treats them as the core:

1. **Watch time**: how much of the Reel people watch, including rewatches.
2. **Sends per reach**: how often viewers DM it to someone. Sends matter most for reaching
   people who don't follow you yet.
3. **Likes per reach**: matters most with existing followers.

Instagram also favours **original content**. Reels that look reposted, carry another
app's watermark, or duplicate someone else's post are pushed down; your own logo is fine.

**Applied here:** every Reel is built from our own project footage and code, with no
third-party watermarks. Never upload a file that's been through TikTok's or CapCut's
export (they add watermarks). Every caption ends with a call to action, and where it
fits, a *send* prompt aimed at a specific person ("Send this to the teammate who...").

## The first two seconds

Viewers decide almost immediately. Vendor studies disagree on the exact hold rates, but
agree that most drop-off happens in the first three seconds and that a clear, specific
promise up front beats a slow build.

**Applied here:** hooks are under 12 words, name a specific outcome or mistake, and the
picture is already moving on frame 0. The hook's last word lands on the song's first
downbeat, with a light-leak cut.

## Keeping them past the hook

The opening earns attention; the middle keeps it. Advice converges on a new visual every
couple of seconds and a fresh reason to keep watching every 10-15 seconds.

**Applied here:** `npm run check` fails any scene that holds too long (about 3 s for
footage, a little longer for scenes you read), and every cut lands on the beat.

## Length

Short Reels get watched to the end and rewatched; longer ones can reach more people if
they hold attention. Common guidance: 7-15 s for loops, 15-30 s for tutorials and tips,
longer only when the content earns it.

**Applied here:** tips are capped at 26 s, everything else at 30 s. The end card is short
and sits on the same backdrop as the hook, so the Reel loops cleanly into a rewatch.

## Why people share

Jonah Berger's STEPPS model is the standard framework: people share what makes them look
good (social currency), what's useful (practical value), what stirs strong feeling, and
good stories. Sharing also happens *to* someone: people send things to a specific
friend.

**Applied here:**
- Tips are practical value: one concrete thing you can use today, before and after.
- Project Reels are social currency: specific numbers (1 meter, 32 hours, 12 parts) that
  are fun to pass on.
- CTAs name the person to send it to.

## Taste

- **Emoji sparingly.** At most one emoji in a caption, and on screen just one floating 3D
  emoji, on the first tip card of a tip Reel. Never decoration for its own sake.
- **Hashtags:** five at most (Instagram's cap), niche over broad.
- **Honesty:** say where a project really stands. "I'm building" beats a claim the
  comments will catch.

## Craft: what makes motion look professionally made

From [motionmaxxing](https://github.com/Tejashmakwana/motionmaxxing) (Apache-2.0), a motion
design skill whose rules come from frame-by-frame measurement of professional pieces.
Summarised in our own words, applied where they fit a Reel:

- **No page chrome.** No progress bars, corner tags, tracked-caps labels, counters
  ("1 of 4") or kicker labels above headlines. They make a film read as a slide deck.
- **Words arrive like speech.** Whole words 3-6 frames apart, each settling in from a
  little oversize and decelerating; nothing bounces, nothing grows from zero.
- **Every frame is alive.** Something always moves: drift, a turning object, light.
- **End small and short.** The mark and the name, held about a second. No footer of
  handle, button and URL; the caption carries the ask.
- **Show, don't caption.** A claim on screen is followed by the thing doing it.

**Applied here:** the engine draws no progress bar, tag, kicker or counter; headline
words land 5 frames apart (3 in hooks) and settle from 1.35x; end cards are 3 beats with
the 3D mark and wordmark only. `npm run check` rejects counters and kicker labels, and
every render is checked for a frozen ending over 1.4 s and for blank frames.

## What to watch in Insights

Weekly: average watch time and shares (sends) per Reel. Make more of the formats that win
on both, and rewrite the hooks of the ones that lose viewers in the first seconds.
Instagram's *trial reels* (shown to non-followers first) are a low-risk way to test a new
format.

## Sources

- [Instagram Algorithm 2026: 5 Ranking Signals Mosseri Confirmed (Dataslayer)](https://www.dataslayer.ai/blog/instagram-algorithm-2025-complete-guide-for-marketers)
- [Adam Mosseri on Shares (Socialync)](https://www.socialync.io/blog/adam-mosseri-shares-instagram-algorithm-2026)
- [Instagram Algorithm 2026: Watch Time and Sends per Reach (blckalpaca)](https://blckalpaca.at/en/knowledge-base/social-media/social-media-algorithms-distribution/instagram-algorithm-2026)
- [Short-Form Video Retention Benchmarks (Grow-it)](https://www.grow-it.se/en/resources/short-form-video-retention-benchmarks)
- [Short-Form Video Retention: Keep Viewers Watching (Shortzly)](https://shortzly.com/blog/short-form-video-retention-strategies)
- [How Long Should Instagram Reels Be? (Highviz)](https://www.highviz.io/blog/how-long-should-instagram-reels-be/)
- [Best Instagram Reels Length in 2026 (Bytecap)](https://www.bytecap.io/research/best-instagram-reels-length)
- [Instagram Reels Completion Rate Benchmark (Grow Creator)](https://growcreator.pro/blog/instagram-reels-completion-rate-benchmark)
- [Instagram's algorithm will penalize unoriginal posts (Engadget)](https://engadget.com/2160560/instagrams-recommendation-algorithm-will-penalize-unoriginal-photo-and-carousel-posts)
- [Instagram: your own logo on a Reel is OK (Social Media Today)](https://www.socialmediatoday.com/news/instagram-clarifies-including-your-own-logo-on-a-reel-is-ok/730852/)
- [The 6 psychological triggers behind viral content (PR Daily)](https://prdaily.com/the-6-psychological-triggers-behind-viral-content)
- [Why people share (MediaPost)](https://www.mediapost.com/publications/article/254027/why-people-share.html)
- [motionmaxxing: motion design skill (Tejash Makwana, Apache-2.0)](https://github.com/Tejashmakwana/motionmaxxing)
- [Viral video, via Harvard Business Review (Alchemy Worx)](https://alchemyworx.com/blog/viral-video-every-marketers-dream-via-harvard-business-review/)
