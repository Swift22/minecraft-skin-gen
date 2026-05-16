# Research: Generator UI & Retro Pixel Art Experience

**Branch**: `002-generator-ui`
**Phase**: 0 — Outline & Research
**Date**: 2026-02-22

---

## Decision 1: Default Colour Mode

**Decision**: Force dark mode as the site default (add `class="dark"` to `<html>`).

**Rationale**: Minecraft's aesthetic is predominantly dark (deep caves, night sky, dark GUI chrome). An arcade/retro theme reads better in dark mode. All shadcn/ui tokens already have a `.dark` variant — no additional library is needed.

**Alternatives considered**:
- System-preference dark mode (`prefers-color-scheme`): Rejected. Inconsistent — ~50% of users would see a mismatched light theme.
- Toggle switch: Rejected for scope. The spec requires a consistent design identity, not a preference UI.

---

## Decision 2: Retro Arcade Colour Palette

**Decision**: Replace the default shadcn palette in `globals.css` with an arcade dark palette centred on Minecraft green primary, amber/gold accent, and near-black backgrounds.

| Token | Value (HSL) | Role |
|-------|-------------|------|
| `--background` | `220 20% 6%` | near-black page background |
| `--foreground` | `210 30% 90%` | cool off-white text |
| `--card` | `220 20% 9%` | slightly lighter surface |
| `--primary` | `127 60% 45%` | Minecraft green CTA |
| `--primary-foreground` | `0 0% 5%` | dark text on green |
| `--secondary` | `220 20% 14%` | muted surface |
| `--accent` | `38 95% 58%` | gold/amber highlight |
| `--accent-foreground` | `0 0% 5%` | dark text on gold |
| `--muted` | `220 20% 13%` | low-emphasis background |
| `--muted-foreground` | `215 15% 55%` | low-emphasis text |
| `--border` | `220 20% 18%` | subtle border |
| `--destructive` | `0 75% 55%` | error red |
| `--radius` | `0.25rem` | squared-off corners for blocky feel |

**Rationale**: This palette provides high contrast (WCAG AA compliant), uses Minecraft's recognisable green, and the reduced border-radius creates the blocky, pixel-art feel without requiring custom CSS.

**Alternatives considered**:
- Keeping the light default: Rejected — generic SaaS appearance, contradicts spec FR-019.
- Neon synthwave palette (purple/pink): Considered but rejected — Minecraft's identity is green/brown/stone, not synthwave.

---

## Decision 3: Pixel Heading Font

**Decision**: Load **Press Start 2P** (Google Fonts) via `next/font/google` and apply it only to headings (`h1`, page titles, feature names). Body text remains the system font stack for readability.

**Rationale**: Press Start 2P is the canonical retro pixel font, universally available via Google Fonts, and already in common use in Minecraft-adjacent tooling. Applying it only to headings avoids the legibility problems of using a pixel font for body copy.

**Alternatives considered**:
- VT323 (Google Fonts): Considered — thinner, terminal-style. Rejected in favour of Press Start 2P's broader recognition.
- Custom bitmap font: Rejected — adds unnecessary asset complexity for this scope.
- System font for all text: Rejected — misses the retro identity requirement (FR-019).

---

## Decision 4: Style Presets Data & Behaviour

**Decision**: Style presets are rendered as toggle chips. When selected, they append a fixed keyword string to the prompt (concatenated before the user's text). Multiple presets can be active simultaneously.

**Preset catalogue** (6 required by FR-010):

| Label | Appended Keywords |
|-------|-------------------|
| Retro Arcade | `retro arcade pixel art style, bold vibrant colors, hard pixel edges, 8-bit character` |
| Cyberpunk | `cyberpunk neon visor, dark longcoat, electric blue and magenta highlights, dystopian future` |
| Fantasy Knight | `medieval fantasy knight, polished plate armor, heraldic colors, bold contrast shading` |
| 90s Fighter | `90s arcade fighting game character, bold silhouette, vivid costume, Street Fighter aesthetic` |
| Space Explorer | `space explorer, reflective helmet visor, cosmic suit colors, sci-fi pixel art` |
| Pixel Warrior | `pixel art warrior, chunky blocky armor, strong primary color palette, video game hero` |

**Rationale**: Fixed keyword strings ensure consistent quality guidance without requiring any backend changes. The user can still type their own description — presets augment, not replace, the prompt.

**Alternatives considered**:
- Dropdown selector (single choice): Rejected — spec requires chips (FR-010), implying multi-select.
- Sending preset as a separate API field: Rejected — would require API changes. The spec explicitly states this is UI-only on top of the existing backend.

---

## Decision 5: Reference Image Thumbnail

**Decision**: On file selection, generate an object URL (`URL.createObjectURL(file)`) and render it in a small `<img>` element (48×48px) next to the remove button. Revoke the object URL on file clear or component unmount.

**Rationale**: Zero additional dependencies, works natively in all modern browsers, revocation prevents memory leaks.

**Alternatives considered**:
- `FileReader` + base64 data URL: Functional but slower and produces larger strings. Object URL is preferred for blobs.

---

## Decision 6: skinview3d 3D Preview (Keep As-Is)

**Decision**: The existing `SkinPreview` component already uses `skinview3d` to render an animated, auto-rotating 3D Minecraft player model. This is **already superior** to the spec's minimum requirement (crisp 2D pixel-art preview). No changes to the core rendering logic.

**What does change**: The container background colour (already `#1a1a2e` — dark navy, suitable for the retro palette), and the empty state visual design.

**Rationale**: Replacing a working 3D viewer with a static 2D image would be a regression. The spec's mention of "pixel-perfect scaling" was written before the existence of skinview3d was confirmed.

---

## Decision 7: Source Structure

This feature touches only the frontend layer of the existing Next.js app. No new API routes, no schema changes.

```text
app/
├── layout.tsx                          (add Press Start 2P font, set dark mode class)
├── page.tsx                            (redesign landing page)
├── globals.css                         (update CSS custom properties to arcade palette)
└── (app)/generate/
    └── GeneratorPageClient.tsx         (layout polish, integrate UpgradePrompt component)

components/
└── skin-generator/
    ├── GeneratorForm.tsx               (add image thumbnail, style presets integration)
    ├── StylePresets.tsx                (NEW — preset chip component)
    ├── CreditCounter.tsx               (retro styling, bolder visual)
    ├── SkinPreview.tsx                 (retro empty state, container polish)
    └── UpgradePrompt.tsx               (styling update, integrate properly in page)
```

No new dependencies required. All UI primitives (`Button`, `Card`, `Badge`, `Textarea`, etc.) are already available via shadcn/ui.

---

## Resolved Clarifications

No `[NEEDS CLARIFICATION]` markers were present in the spec. All design decisions above were derived from:
1. Codebase analysis (existing components, CSS tokens, package.json)
2. Spec requirements (FR-001 through FR-019, SC-001 through SC-008)
3. Constitution principles (Principle III — UX Consistency, Principle IV — Performance)
