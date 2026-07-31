---
title: the nas, rebuilt
date: 2026-07-30
repo: MKS-01/pizow
desc: The 2020 NAS lived in my head. The rebuild lives in a script an agent runs.
blurb: it used to live in my head; now a script and an agent run it
---

The first one was a Pi 3, a 500 GB disk out of a dead laptop, and an
evening of `nano`. It ran for years, and every detail of how it
worked lived in exactly one place: my head.

It is rebuilt now on a board a fraction of the size. The storage
changed less than where the setup lives.

## what was in my head

Samba, typed by hand into `smb.conf`. `chmod 777`
and `force user = root`, because getting SMB permissions right
is tedious and it was my own LAN. An `fstab` line naming
`/dev/sda1`. A static IP put in by hand so the share stayed
findable.

None of it written down anywhere. Rebuilding meant remembering, and six
years is longer than I remember anything.

## what the hardware decided

The old disk didn't make the trip. The Zero's USB OTG port supplies
about **500 mA**, and a 2.5" spinning drive pulls 700–1000 mA on
spin-up. You get a disk that never spins, a board that browns out and
reboots, or — worst — intermittent dropouts under load that read as a
software bug for an evening. So: a flash drive, or a powered hub.

A new drive means a reformat, and a reformat is a chance to stop
working around NTFS. It is **ext4** now, shared over **NFS** instead
of SMB, so ownership is real — clients squash to a single uid at the
export rather than the filesystem being flattened to 777.
[File Browser](https://filebrowser.org/) on port 8080 covers
everything else. Mounting a network drive is friction; a URL is not.

## what the script knows

`setup-nas.sh` now holds what I used to. It finds the USB
device, formats it, resolves the UUID with `blkid`, writes the
`fstab` and NFS export lines, installs File Browser as a
systemd unit, and stands up a small stats endpoint the dashboard reads.
Run it from the Mac and it forwards itself to the Pi over SSH.

One line carries most of what the 2020 build got wrong:

```
UUID=<uuid>  /mnt/nas  ext4  defaults,nofail  0  2
```

`UUID` rather than `/dev/sda1`, because device
names reorder the moment a second stick goes in. `nofail`
because a missing disk should mean a boot without a share, not a boot that
never finishes. A udev rule handles the drive being plugged in after boot.

## what the agent knows

The repo ships Claude Code skills — `/pi-setup`,
`/pi-deploy`, `/pi-status`. Health check, deploy,
restart: the things I used to SSH in for and half-remember.

That's the actual delta. In 2020 the NAS existed as much in my memory
as on the board, and both degraded at about the same rate. Now the board
is the disposable part — reflash it, run one script, ask for its status in
a sentence. The disk is still the least reliable thing in the room. That
hasn't changed and won't.
