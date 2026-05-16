---
id: "0x02"
slug: "dns-rebinding-returns"
title: "DNS rebinding is back, and it's wearing a hoodie"
kind: "WRITEUP"
tags: ["netsec", "web", "dns"]
date: "2026.03.28"
read: "9 min"
severity: "MEDIUM"
excerpt: "Local-network IoT dashboards keep reinventing the same mistake. A short tour of why your smart fridge is one malicious ad away from a botnet."
---

DNS rebinding isn't new. It's been documented since 2007. It keeps working because the people shipping local-network web UIs aren't reading 2007 papers.

### // The attack, in three steps

One. Victim visits attacker.com. Two. attacker.com resolves to attacker's real IP, serves a page with JavaScript, then changes its DNS record to point at 192.168.1.1 with a short TTL. Three. The JavaScript, now considered same-origin with the victim's router admin panel, posts whatever it wants to whatever endpoint it likes.

### // Why it still works

Every cheap smart-home device ships a local web UI. Most of those UIs don't check the Host header. Most of them have no CSRF protection because the developers assume nobody can reach them from the outside. The whole threat model is 'the LAN is friendly,' which stopped being true around the time the Roomba grew a microphone.

### // Defenses

Validate the Host header. Reject anything that isn't an IP or a hostname you control. Add CSRF tokens even on a LAN UI. Require auth for state-changing endpoints, even on a LAN UI. Use HTTPS with a self-signed cert; the browser warning is a feature here, not a bug.

None of this is hard. It's just unglamorous. Which is why, in 2026, I'm still writing this post.
