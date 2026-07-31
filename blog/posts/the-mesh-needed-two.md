---
title: the mesh that needed two
date: 2026-07-26
repo: MKS-01/lokalgrid
desc: Meshtastic needs two boards to test. Mine was out of stock for the better part of a year, so I built something one node can do alone.
blurb: a mesh needs two boards — so i built what one can do
---

<figure class="hero">
  <svg viewBox="0 0 560 330" role="img" aria-labelledby="heroTitle">
    <title id="heroTitle">Three phones connect to a single node over WiFi and BLE; the node holds the only long-range radio, which is the one link out.</title>
    <g fill="none" stroke="var(--text-faint)" stroke-width="1.5">
      <rect x="34" y="26" width="46" height="76" rx="6" fill="rgba(240,233,223,0.05)"/>
      <rect x="34" y="122" width="46" height="76" rx="6" fill="rgba(240,233,223,0.05)"/>
      <rect x="34" y="218" width="46" height="76" rx="6" fill="rgba(240,233,223,0.05)"/>
      <path d="M80 64 H150 Q170 64 170 96 V128"/>
      <path d="M80 160 H170"/>
      <path d="M80 256 H150 Q170 256 170 224 V192"/>
      <path d="M170 128 V192"/>
      <rect x="248" y="112" width="132" height="96" rx="6" fill="rgba(240,233,223,0.05)" stroke="var(--accent)"/>
      <path d="M170 160 H248" stroke="var(--accent)"/>
      <path class="sub" d="M264 190 v10 M276 190 v10 M288 190 v10 M300 190 v10 M312 190 v10 M324 190 v10"/>
      <path d="M314 112 V54" stroke="var(--accent)"/>
      <path d="M300 68 a20 20 0 0 1 28 0" stroke="var(--accent)"/>
      <path d="M286 52 a40 40 0 0 1 56 0" stroke="var(--accent)"/>
      <path d="M380 160 H500" stroke-dasharray="6 6"/>
      <path d="M492 152 l10 8 -10 8"/>
    </g>
    <g fill="var(--text-dim)" font-family="Fira Code, monospace" font-size="14">
      <text x="248" y="240">one node · one radio</text>
    </g>
    <g class="sub" fill="var(--text-faint)" font-family="Fira Code, monospace" font-size="11">
      <text x="30" y="18">alpha</text>
      <text x="30" y="114">bravo</text>
      <text x="30" y="210">charlie</text>
      <text x="106" y="150">wifi · ble</text>
      <text x="396" y="150">lora · 1% duty</text>
    </g>
  </svg>
  <figcaption>Up to nine phones share the node's single radio. WiFi and BLE cover the room; LoRa is the only link out, and everything queues behind it.</figcaption>
</figure>

This started as a weekend build on a
[Meshtastic](https://meshtastic.org/) board and stopped at the
first end-to-end test, because a mesh needs a second node to be a mesh and
the second board was out of stock for the better part of a year. So: what
can **one** node do that isn't a worse mesh? Be infrastructure for the
phones already in the room.

## the stack

The node is an ESP32-S3 — a LilyGO T-Beam Supreme — on ESP-IDF rather
than Arduino, which hides the sleep and power APIs this needs: NimBLE,
LittleFS, FreeRTOS tasks where exactly one may touch the filesystem. The
phone is Kotlin and Compose, MapLibre, Room, a WebSocket over the node's
SoftAP with GATT underneath. Positions cross as **32-byte fixed-width
records** — `offset = index * 32`, so seeking is arithmetic,
not parsing — everything else is one JSON object per frame. The codec is
hand-written three times, in JavaScript, Kotlin and C, against one
golden-vector fixture.

## the scarce thing is airtime, not bandwidth

One radio, up to nine phones. Three of them sharing position at 1 Hz
already saturate LoRa's ~1 kbit/s, and the radio is capped at a **1% duty
cycle** — 36 seconds of transmit per hour. So the scheduler isn't an
optimisation, it's the resting state of the system, and it goes out in
lanes:

```
0  emergency  <span class="c">// pre-empts everything, ignores fairness</span>
1  position   <span class="c">// aggregated, decimated by distance — 50 m, never by time</span>
2  message    <span class="c">// deficit round-robin across clients</span>
3  bulk       <span class="c">// only when the budget is otherwise idle</span>
```

Each client gets 1/N of what lanes 0 and 1 leave, and unused allocation
**decays rather than banks** — otherwise whoever stayed quiet all
afternoon comes back with an hour of credit and drowns everyone. The duty
cycle is compiled in rather than offered as a setting, because a toggle
gets left wrong eventually and that failure is silent.

## a spinner is a lie about a queue

When your message is 60 seconds from transmitting, the app has to say
**something**, and almost every app says it with a spinner.
`queued 60 s` is barely better — a spinner with a number
stapled on.

So a reason names its constraint: `queued 56 s, bravo ahead of
you`, or `queued 60 s — radio duty-cycled`. One says a
person is in front of you, the other says physics is. Which forces the
decision I'd keep if I threw the rest away: **the reason is computed from
the order the queue will actually transmit in**, by the same loop that
does the transmitting. A separate estimate drifts from the scheduler in a
week and starts telling confident lies — worse than a spinner, because
people believe it.

## the same rule, pointed at the map

Same reason there are no crisp dots. A fix indoors with four satellites
and HDOP 3.2 is a claim with a radius of tens of metres, so it draws as a
ring that size, interpolated track draws dashed, and a stalled fix wears
its age. The map looks worse than everyone else's; the wide ring **is**
the thing working.

## where i broke my own rule

The protocol rests on one sentence: the node is authoritative about what
exists, each client about what it has received. I violated it in the node's
favour — on connect the node pushed the whole chat history **and**
answered the cursor the client sent a moment later. Two copies, same
sequence numbers, and a `LazyColumn` keyed on that seq killed
the app with `Key "seq-1" was already used` on every tap of the
tab. The fix was deleting code.

## what it turned into

A walkie-talkie on its own network — group, immediate, no dialling and
no accounts. Text rather than voice, but the metaphor holds where it
counts: range is enforced by physics, not policy. Reach the node and you're
in the group; walk out and you're not.

What runs today, against the real firmware: your position and everyone
else's, a map, one shared chat channel, the roster, and config you stage
then write on purpose. Nine phones at once, over WiFi or BLE, whichever
they arrived on. Messages are sealed end to end — the node schedules and
dead-drops traffic it cannot read, and says plainly that it still sees who
talked to whom, and when.
