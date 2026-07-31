---
title: a home server on 512 mb
date: 2026-07-21
repo: MKS-01/pizow
desc: A $15 board with 512 MB of RAM, and the architecture that fits on it.
blurb: what a $15 board runs, and how it fits together
---

$15, **512 MB of RAM**, and a microSD card. I flashed Ubuntu Server
onto a Pi Zero 2 W expecting a toy.

It's been up for months. Here's what's on it.

## what a raspberry pi is

If you haven't used one: a Raspberry Pi is a whole computer on a single
board, smaller than a credit card. A microSD card is the hard drive,
there's no screen or keyboard, and you reach it over SSH. It sips power,
so leaving it on permanently costs nothing. The catch is the specs — 512
MB of RAM where a laptop has 16 GB, and that number drives everything
below.

## the architecture

Three services, none of them depending on each other. **nginx**
listens on port 80 and reverse-proxies to a Node app. **PM2**
supervises that app, restarting it on crash and after reboots. The
**NAS** runs beside both, sharing a USB drive.

The drive is the least reliable part, so the Pi mounts it with
`nofail` and boots fine without it. `setup-pi.sh`
takes a blank Ubuntu install to all of that — Node 22, PM2, nginx, 1 GB
swap — and it's idempotent, so re-running it is the repair path.

## deploying to it

`deploy.sh` has three modes:

```
<span class="g">$</span> deploy.sh --local     <span class="c"># build on the mac, rsync the result</span>
<span class="g">$</span> deploy.sh --remote    <span class="c"># git pull + build on the pi</span>
<span class="g">$</span> deploy.sh --restart   <span class="c"># just bounce pm2</span>
```

`--local` is the default, and the reason is the RAM. 512 MB
can't compile a Next.js app; without swap the OOM killer takes the build
out mid-run. So the Mac builds it — `output: 'standalone'`
emits a self-contained bundle, rsync ships it, and the Pi runs
`node server.js` directly. No toolchain on the device. It only
executes.

## what it's for

A monitoring dashboard, a NAS, and
[readback](why-i-built-readback.html)'s library. That last one
explains the setup: readback generates audio, which wants a GPU and stays
on the Mac, but serving the library is just SQLite rows and finished WAVs
— exactly what a 512 MB board is good at. The expensive machine does the
expensive thing; the cheap machine does the thing that runs all day.

It hasn't asked me for anything since. Most of what I learned wasn't
about Linux — it was about what 512 MB refuses to do.
