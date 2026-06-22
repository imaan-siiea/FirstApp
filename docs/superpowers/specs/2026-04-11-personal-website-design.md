# Personal Website Design — imaanali.com

**Date:** 2026-04-11
**Status:** Approved — ready for implementation

---

## Overview

A personal brand hub for Imaan Ali at `imaanali.com`. The site leads with ideas and impact — not a career title. Tone: old money, powerful, auraful. Designed to impress college admissions officers, academic collaborators, and professional contacts equally.

**Core identity framing:** Thinker. Builder. Changemaker. (Not locked to a career path.)

---

## Visual Design

### Palette
| Role | Value |
|------|-------|
| Background | `#0e0608` (near-black) |
| Primary accent | `#c0392b` (maroon) |
| Secondary accent | `#721c24` (deep maroon) |
| Text primary | `#f5ebe0` (warm cream) |
| Text muted | `#555555` |

### Typography
| Role | Font |
|------|------|
| Headings | Playfair Display (serif, bold) |
| Body | Inter (sans-serif) |
| Taglines / labels | Inter, uppercase, wide letter-spacing |

### Aesthetic Rules
- Maroon is used sparingly — lines, hover states, accents, monogram. Never overwhelming.
- No harsh borders. Elements bleed into the black background.
- Scroll animations: fade-in-up on section entry (Framer Motion).
- Photo (to be added later): portrait, maroon tint overlay, bleeds into background — no box or frame.

---

## Pages & Routes

| Page | Route | Type |
|------|-------|------|
| Home | `/` | Single cinematic scroll |
| Brown RA detail | `/work/brown-ra` | Static detail page |
| Research paper detail | `/work/chains-of-captivity` | Static detail page |
| Patent detail | `/work/patent` | Static detail page |

---

## Home Page — Section Breakdown

### 1. Hero (full-screen)
- **Top left:** `IA` monogram in maroon (serves as logo and home link)
- **Top right:** Minimal nav — `Work · About · Contact`
- **Center/bottom left:** Name in large Playfair Display, stacked:
  ```
  Imaan
  Ali.
  ```
- **Below name:** Thin maroon rule, then tagline: *Thinker. Builder. Changemaker.*
- **Bottom right:** Photo placeholder (portrait, maroon-tinted, fades into background)
- **Bottom center:** Subtle animated scroll indicator (chevron or dot)

### 2. About
Two short, confident paragraphs. No fluff.

Covers:
- Still in high school — doing work most people wait until grad school to attempt
- Research Assistant at Brown University (Indigenous enslavement digital archive project)
- Published research paper on Native American slavery and colonial archives
- Patent holder
- Driven by a belief that history, technology, and justice are inseparable

Ends with a one-line values tease that links naturally to the Values section below.

### 3. Work
Three cards in a row. Maroon border appears on hover. Each card links to its detail page.

**Card 1 — Research Assistant, Brown University**
- Title: Research Assistant, Brown University
- Short description: Collaborative digital archive documenting histories of Indigenous enslavement in the Americas. Works with Indigenous scholars, community partners, and academic researchers.
- Tag: `Archival Research · Decolonial Practice`

**Card 2 — *Chains of Captivity***
- Title: Chains of Captivity, Colonial Power, and Archival Erasure
- Short description: Research paper analyzing Native American slavery in colonial North America through colonial print culture and decolonial epistemological critique. Primary sources: Library of Congress digitized newspapers.
- Tag: `History · Decolonial Research`

**Card 3 — OCCT (Organizational Commitment Chain Tracker)**
- Title: OCCT — Organizational Commitment Chain Tracker
- Short description: A software system that tracks whether politicians keep their promises — scoring fidelity across five dimensions: amount, scope, timeline, population, and mechanism. Provisional patent holder.
- Tag: `Civic Tech · Intellectual Property`

### 4. Values
Single statement, large Playfair Display, centered, cream text. Full-width section.

- *Carpe Diem.*

### 5. Contact
Minimal. Dark background continues.
- Email: `imaan@siiea.ai`
- LinkedIn: `www.linkedin.com/in/imaan-ali-8857a0308`
- One line of copy: *"I respond to everything."*

---

## Work Detail Pages

### `/work/brown-ra`
- Role title + institution
- Full description of responsibilities:
  - Archival and database research
  - Verifying and synthesizing historical records
  - Contributing to a publicly accessible, ethically stewarded digital archive
  - Collaborating with Indigenous scholars, community partners, and academic researchers
  - Supporting historiographical analysis and refining research methodology
- Context: why this work matters

### `/work/chains-of-captivity`
- Full paper title
- Abstract (as written in the paper)
- Key argument summary (2-3 sentences):
  - Indigenous slavery was constitutive — not marginal — to colonial political economies
  - Historiographical erasure is a product of colonial archival epistemology, not historical absence
  - Decolonial recovery requires engaging with how archives produce knowledge, not just what they contain
- Methodology note: Library of Congress Chronicling America archive, decolonial framework (Smith, 1999)
- Option to download or read full paper (PDF link)

### `/work/patent`
- **Title:** OCCT — Organizational Commitment Chain Tracker
- **The problem:** Existing tools only give a binary "kept or broken" rating on political promises. That misses how promises actually die — through dilution, delay, and scope creep.
- **What it does:** Automatically extracts commitments from speeches and documents, then tracks each promise through legislation and regulation. Produces a multi-dimensional fidelity score across five dimensions: amount, scope, timeline, population, and mechanism.
- **Why it matters:** Shows exactly where and how a promise was diluted, delayed, or delivered — not just whether it was kept.
- **Status:** Provisional patent filed (USPTO)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Fonts | Google Fonts — Playfair Display + Inter |
| Deployment | Docker container → Coolify |
| DNS | Cloudflare → Coolify server IP |

No database. No auth. No CMS. Static-ish Next.js — fast, simple, nothing to break.

---

## Deployment

1. Build Docker image from Next.js app
2. Deploy via Coolify (existing infrastructure)
3. Point `imaanali.com` DNS A record in Cloudflare to Coolify server IP
4. Coolify handles SSL via Let's Encrypt

---

## Content Still Needed from Imaan

- [ ] Headshot / portrait photo (can be added after launch)
- [x] Email — imaan@siiea.ai
- [x] LinkedIn — www.linkedin.com/in/imaan-ali-8857a0308
- [x] Patent description — OCCT full description provided
- [x] Values — written and approved
