---
title: ble recon with bettercap
date: 2020-06-24
desc: Three commands to enumerate a fitness band's entire GATT table over Bluetooth Low Energy.
blurb: three commands and a fitness band tells you everything
---

Heart rate sensors, smart scales, iBeacons — early startup days, a lot
of prototypes, and most of them talked over Bluetooth Low Energy. Pulling
data off a sensor or wiring one up to a native Android or iOS client was
routine work.

What stuck with me was how little stands in the way. Most of these
devices will tell you everything about themselves before you have
authenticated anything. [Bettercap](https://www.bettercap.org/)
turns that into three commands.

## the setup

Bettercap is a recon and MITM framework written in Go — WiFi, Ethernet,
2.4GHz HID, and the part I care about here: BLE scanning, characteristic
enumeration, and reading and writing those characteristics.

Mine runs on a Raspberry Pi 3 with Kali on it, headless over SSH. The
Pi's onboard radio is enough; no external adapter needed for BLE.

## discovery

Start the pager and turn the BLE module on. Devices start falling in
immediately — every phone, watch and pair of earbuds in the room
announcing itself.

```
<span class="g">$</span> bettercap
bettercap v2.26.1 (built for linux arm64 with go1.13.8)

» ble.recon on
» [20:11:28] [ble.device.new] new BLE device detected (Apple, Inc.) -39 dBm.
» [20:11:28] [ble.device.new] new BLE device detected (Apple, Inc.) -41 dBm.
» [20:11:28] [ble.device.new] new BLE device honor Band 4-43F
                              detected (Huawei Technologies) -28 dBm.
» [20:11:58] [ble.device.new] new BLE device detected (Apple, Inc.) -56 dBm.
```

`ble.show` prints what it has collected, sorted by signal
strength. The strongest return at -28 dBm is a fitness band on my wrist,
which makes it the obvious thing to poke at.

```
» ble.show

 RSSI ▲    Vendor                  Flags                        Connect
 -28 dBm   Huawei Technologies     BR/EDR Not Supported            ✔
 -54 dBm   Apple, Inc.             LE + BR/EDR (controller/host)   ✔
 -54 dBm   Apple, Inc.             BR/EDR Not Supported            ✔
 -56 dBm   Apple, Inc.             BR/EDR Not Supported            ✔
```

## enumeration is the interesting part

`ble.enum MAC` connects and walks the device's GATT table —
every service, every characteristic, what you are allowed to do with each
one. This is the whole point. No pairing, no PIN, no prompt on the band.

```
» ble.enum <mac>

 Handles       Service > Characteristics          Properties      Data
 0001 -> 0009  Generic Access
 0003            Device Name (2a00)               READ            honor Band 4-43F
 0005            Appearance (2a01)                READ            Unknown

 0010 -> 0020  Device Information
 0012            Manufacturer Name String (2a29)  READ            HUAWEI
 0014            System ID (2a23)                 READ            0102030405_0000
 0016            Model Number String (2a24)       READ            HUAWEI
 001a            Firmware Revision String (2a26)  READ            1.0.0.1
 001c            Hardware Revision String (2a27)  READ            1.0.0.1

 002a -> 0034  fe86
 002c            fe01                             WRITE
 002e            fe02                             NOTIFY

 0100 -> 0112  Human Interface Device
 0102            HID Information (2a4a)           READ            01010003
 0107            HID Control Point (2a4c)         WRITE
 0109            Boot Keyboard Input (2a22)       READ, NOTIFY    insufficient authentication
 010e            Report (2a4d)                    READ, NOTIFY    insufficient authentication
```

Two things worth reading in that dump. First, the device volunteers its
manufacturer, model and firmware revision to anyone who asks — that is a
fingerprint, and firmware revisions map to known bugs.

Second, look at where it **does** push back. The Human Interface
Device service returns `insufficient authentication` on its
report characteristics, and one handle further down is flatly
`read not permitted`. So the band draws a line — just not in
front of the metadata, and not in front of the vendor-specific
`fe86` service sitting there with a writable characteristic and
no documentation.

## the module, in full

<div class="scroll-x">
<table>
  <tr><td><code>ble.recon on</code></td><td>start BLE discovery</td></tr>
  <tr><td><code>ble.recon off</code></td><td>stop it</td></tr>
  <tr><td><code>ble.clear</code></td><td>drop everything collected so far</td></tr>
  <tr><td><code>ble.show</code></td><td>list discovered devices</td></tr>
  <tr><td><code>ble.enum MAC</code></td><td>enumerate services and characteristics</td></tr>
  <tr><td><code>ble.write MAC UUID HEX</code></td><td>write a buffer to a characteristic</td></tr>
</table>
</div>

That last one is where recon stops and tampering starts, which is a
different post. Everything above is passive by comparison: you connect,
you read what the device offers, you disconnect. The uncomfortable part is
how much it offers.
