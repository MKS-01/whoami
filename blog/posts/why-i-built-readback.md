---
title: why i built readback
date: 2026-07-21
pinned: true
repo: MKS-01/readback
desc: It started as a voice agent on a new Mac. The reader was what was left after I deleted everything else.
blurb: started as a voice agent — the reader is what was left
---

<figure class="hero">
  <svg viewBox="0 0 560 336" role="img" aria-labelledby="pipe-t">
    <title id="pipe-t">readback pipeline: a URL is fetched, or a photo or book scan is read by vision OCR; the text is then extracted, optionally summarized, then synthesized to audio and stored; the terminal CLI generates live reads while the web dashboard replays past ones.</title>
    <defs>
      <marker id="a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0 0 L8 4 L0 8 z" fill="var(--text-faint)"/>
      </marker>
    </defs>

    <!-- inputs -->
    <rect x="70" y="14" width="200" height="34" fill="rgba(139,148,158,0.05)" stroke="var(--text-faint)" stroke-width="1.5" rx="6"/>
    <rect x="290" y="14" width="200" height="34" fill="rgba(139,148,158,0.05)" stroke="var(--text-faint)" stroke-width="1.5" rx="6"/>
    <text x="170" y="36" text-anchor="middle" font-family="Fira Code, monospace" font-size="16" font-weight="500" fill="var(--text)">URL</text>
    <text x="390" y="36" text-anchor="middle" font-family="Fira Code, monospace" font-size="16" font-weight="500" fill="var(--text)">photo · book scan</text>

    <!-- converge into the pipeline -->
    <path d="M170 48 V62 H280" fill="none" stroke="var(--text-faint)" stroke-width="1.5"/>
    <path d="M390 48 V62 H280" fill="none" stroke="var(--text-faint)" stroke-width="1.5"/>
    <path d="M280 62 V90" fill="none" stroke="var(--text-faint)" stroke-width="1.5" marker-end="url(#a)"/>

    <!-- pipeline container -->
    <rect x="30" y="98" width="500" height="104" fill="none" stroke="var(--text-faint)" stroke-width="1.5" stroke-dasharray="4 4" rx="8"/>
    <text x="46" y="119" font-family="Fira Code, monospace" font-size="11" fill="var(--text-faint)" class="sub">readback server · 100% on-device</text>

    <rect x="48" y="132" width="140" height="48" fill="rgba(139,148,158,0.05)" stroke="var(--text-faint)" stroke-width="1.5" rx="6"/>
    <rect x="210" y="132" width="140" height="48" fill="rgba(139,148,158,0.05)" stroke="var(--text-faint)" stroke-width="1.5" rx="6"/>
    <rect x="372" y="132" width="140" height="48" fill="rgba(139,148,158,0.05)" stroke="var(--text-faint)" stroke-width="1.5" rx="6"/>
    <text x="118" y="154" text-anchor="middle" font-family="Fira Code, monospace" font-size="16" font-weight="500" fill="var(--text)">extract</text>
    <text x="280" y="154" text-anchor="middle" font-family="Fira Code, monospace" font-size="16" font-weight="500" fill="var(--text)">summary</text>
    <text x="442" y="154" text-anchor="middle" font-family="Fira Code, monospace" font-size="16" font-weight="500" fill="var(--text)">speak</text>
    <text x="118" y="170" text-anchor="middle" font-family="Fira Code, monospace" font-size="9" font-weight="400" fill="var(--text-faint)" class="sub">trafilatura · mlx-vlm</text>
    <text x="280" y="170" text-anchor="middle" font-family="Fira Code, monospace" font-size="9" font-weight="400" fill="var(--text-faint)" class="sub">mlx-lm · optional</text>
    <text x="442" y="170" text-anchor="middle" font-family="Fira Code, monospace" font-size="9" font-weight="400" fill="var(--text-faint)" class="sub">CSM-1B</text>

    <path d="M188 156 H206" fill="none" stroke="var(--text-faint)" stroke-width="1.5" marker-end="url(#a)"/>
    <path d="M350 156 H368" fill="none" stroke="var(--text-faint)" stroke-width="1.5" marker-end="url(#a)"/>

    <!-- store -->
    <path d="M280 202 V226" fill="none" stroke="var(--text-faint)" stroke-width="1.5" marker-end="url(#a)"/>
    <rect x="185" y="232" width="190" height="40" fill="rgba(88,166,255,0.08)" stroke="var(--accent)" stroke-width="1.5" rx="6"/>
    <text x="280" y="250" text-anchor="middle" font-family="Fira Code, monospace" font-size="14" font-weight="500" fill="var(--accent)">WAV + SQLite</text>
    <text x="280" y="264" text-anchor="middle" font-family="Fira Code, monospace" font-size="10" font-weight="400" fill="var(--text-faint)" class="sub">generate once</text>

    <!-- fork to the two clients -->
    <path d="M280 272 V288 H140 V300" fill="none" stroke="var(--text-faint)" stroke-width="1.5" marker-end="url(#a)"/>
    <path d="M280 272 V288 H420 V300" fill="none" stroke="var(--text-faint)" stroke-width="1.5" marker-end="url(#a)"/>
    <rect x="40" y="302" width="200" height="30" fill="rgba(139,148,158,0.05)" stroke="var(--text-faint)" stroke-width="1.5" rx="6"/>
    <rect x="320" y="302" width="200" height="30" fill="rgba(139,148,158,0.05)" stroke="var(--text-faint)" stroke-width="1.5" rx="6"/>
    <text x="140" y="322" text-anchor="middle" font-family="Fira Code, monospace" font-size="14" font-weight="500" fill="var(--text)">CLI · live read</text>
    <text x="420" y="322" text-anchor="middle" font-family="Fira Code, monospace" font-size="14" font-weight="500" fill="var(--text)">dashboard · replay</text>
  </svg>
  <figcaption>one server, two clients: the CLI makes new reads, the dashboard replays old ones.</figcaption>
</figure>

It didn't start as a reader. I got a new Mac, wanted to know what a
local LLM could actually do on it, and a real-time voice agent was the
excuse. Somewhere in the middle of tuning TTS I stopped listening for
bugs and just listened — the interesting half was never the conversation,
it was the reading. I read a lot, and some days reading isn't possible;
now the Mac reads and I listen.

What follows is what it actually does, and what it cost to get there.

## what deleting the live half bought

v0.5 was the peak: dual ASR, Smart-Turn, `webrtcvad`, a mic
gate to stop the model hearing itself, wake-word, personas, tools,
Obsidian export, a React frontend. v0.8.0 removed all of it.

That wasn't tidying, it changed what the product could be. A real-time
loop has to keep pace with a speaker, so every decision bends toward
latency: synthesize in small pieces, start playing before you're done,
keep a buffer fed. That constraint drags a whole class of problems behind
it — audio underrun, echo cancellation, wake-word false positives, a mic
that hears the model and re-triggers.

None of those exist once nobody is waiting on a reply. Synthesis moved
to batch: render the whole piece up front, then play it. Quality gets to
win over latency, which is the exact opposite of the trade I started
with, and the right one for something you press play on.

## the pipeline

`trafilatura` pulls the article body out, with a browser-UA
retry for the sites that 403 a bare fetch. Then it's scrubbed for speech
— citation markers, stray URLs, collapsed whitespace. Your eyes skip all
of that; a voice reads it out loud.

In summary mode a local LLM rewrites the article as a spoken
explanation instead of reading the page verbatim. Anything too long for
one pass gets map-reduced across batches rather than truncated, so the
ending doesn't disappear, and the result is clipped to a word ceiling at
a sentence boundary — the prompt's own limit is advisory, models overrun
it.

Then chunk and synthesize. Chunks respect sentences and paragraphs,
and each one's length cap is randomised between 280 and 400 characters.
That detail matters more than it looks: at a fixed chunk size every pause
lands on the same beat and the read starts to sound like a machine.

It isn't only URLs. Point it at a photo or a book scan and
`mlx-vlm` reads the page first; hand it a folder and it
stitches the pages together in filename order.

## generate once, replay many

Making a read is heavy and occasional — it wants the GPU and unified
memory, and only when I want something new. Playing back one I already
made needs none of that. Splitting those two halves is the decision the
rest of the architecture hangs off.

One server, two clients doing different jobs. The terminal CLI drives
live reads over a WebSocket, because it needs progress events and the
ability to cancel mid-synthesis. The dashboard replays old ones over
plain REST — no models, no WebSocket, just rows out of SQLite and a
finished WAV. Every read lands there with its title, source, voice,
duration and transcript.

That's why the web UI could come back after I'd deleted it: what I
removed in v2.0.0 was trying to be the whole product, what I added back
in v3.0.0 only had to replay. It's also why a $15 Pi can serve the entire
library while the Mac stays the only machine that needs a GPU, and why
re-reading something skips the pipeline outright — the cache keys on URL,
mode, voice and model, so it hands back the WAV it already made.

## the engine i threw away and came back to

On day two I replaced CSM-1B with Kokoro. Later Qwen3-TTS. Then at
v0.8.0 I went back to CSM-1B and committed to it for good.

The voice didn't get good because I found the right model. It got good
because of three small numpy functions on the output:

- `_tidy_silence` — CSM conditioned on a casual reference prompt leaves long pauses mid-sentence. This trims the ends and caps the internal ones at ~300ms. Single biggest quality win in the project.
- `_fade_out_tail` — 100ms fade at chunk boundaries, so joins stop clicking.
- `_peak_normalize` — clone voices inherit their reference clip's level and would otherwise play far quieter than the built-ins. This lands every voice at the same loudness.

All three are post-processing that works on any model, and I wrote
them after spending weeks swapping models looking for the fix. "Stay on
CSM-1B, no Kokoro again" is a stored memory in the repo now, so I don't
re-argue it with myself every time quality comes up.

## one process on metal

By v4.0.0 the whole inference stack — summary LLM, vision OCR, and TTS
— runs in a single Python process on Metal. Ollama is gone entirely: no
daemon to manage, no network hop, no second install path, and 25–30%
faster generation.

MLX binds its GPU stream to the first thread that touches the device,
so the engine owns a single-worker executor and runs every bit of model
work on it. That sounds like a limitation and is actually free
serialization — concurrent read jobs queue behind each other instead of
fighting over the GPU.

## where it landed

A URL goes in, audio comes out, and nothing leaves the machine. The
Mac generates, the Pi serves, and the thing I set out to learn — how far
local models go on this hardware — got answered by building something I
use instead of benchmarking it. Lazy me still gets to learn something.
