---
id: "0x04"
slug: "secure-chat-firmware"
title: "Reversing a 'secure' chat app firmware in four hours"
kind: "WRITEUP"
tags: ["reversing", "crypto", "iot"]
date: "2026.04.22"
read: "18 min"
severity: "CRITICAL"
excerpt: "Marketed as end-to-end encrypted. Was, technically. The key derivation was deterministic from the device serial."
---

I won't name the vendor because the lawyers and I have an understanding. Call it Vendor X. They sell a $400 hardware chat 'pager' to people who think Signal is for civilians.

### // Pulling the firmware

UART pads on the back of the board, unmarked but obvious. 115200 baud, U-Boot drops to a shell if you mash the spacebar during boot. From there, `md.l` and a serial capture script gets you the entire flash in about an hour. The bootloader doesn't verify image signatures, which is the first sign you're going to have a good day.

### // The key schedule

The 'E2E' protocol is a custom thing built on top of libsodium. libsodium is fine. The custom thing is not.

```
key = HKDF(
  ikm  = SERIAL || FIRMWARE_VERSION,
  salt = 0x00 * 32,
  info = "chat-session-v1"
)
```

The serial is printed on the back of the device. The firmware version is in every protocol handshake, unencrypted. The salt is zero. The key derivation has no contribution from either party's identity, no Diffie-Hellman, no ratchet, nothing.

Given a serial number — which you can read across the room with a long lens — you can decrypt every message that device has ever sent or received.

### // Disclosure

Vendor X's first response was a cease and desist. Their second response, after I sent the PoC to a journalist I trust, was a firmware update and a settlement with an NDA I didn't sign. The product still ships. The marketing page still says E2E. The serial is still printed on the back.
