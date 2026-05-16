# Data Model: Generator UI & Retro Pixel Art Experience

**Branch**: `002-generator-ui`
**Phase**: 1 — Design & Contracts
**Date**: 2026-02-22

---

## Overview

This feature is **UI-only**. No new database tables, columns, or migrations are required. The existing data model (users, generations, credits) is unchanged.

The only new "data structure" is the `StylePreset` — a pure frontend constant.

---

## New Frontend Data Structures

### StylePreset

A static, hardcoded record used to render style preset chips and augment generation prompts. Not persisted to the database.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique slug identifier (e.g., `"retro-arcade"`) |
| `label` | `string` | Display name shown on the chip (e.g., `"Retro Arcade"`) |
| `keywords` | `string` | Keyword string appended to the prompt when the preset is selected |

**Preset catalogue** (defined as a `const` array in `StylePresets.tsx`):

```
id: "retro-arcade"     label: "Retro Arcade"     keywords: "retro arcade pixel art style, bold vibrant colors, hard pixel edges, 8-bit character"
id: "cyberpunk"        label: "Cyberpunk"         keywords: "cyberpunk neon visor, dark longcoat, electric blue and magenta highlights, dystopian future"
id: "fantasy-knight"   label: "Fantasy Knight"    keywords: "medieval fantasy knight, polished plate armor, heraldic colors, bold contrast shading"
id: "90s-fighter"      label: "90s Fighter"       keywords: "90s arcade fighting game character, bold silhouette, vivid costume, Street Fighter aesthetic"
id: "space-explorer"   label: "Space Explorer"    keywords: "space explorer, reflective helmet visor, cosmic suit colors, sci-fi pixel art"
id: "pixel-warrior"    label: "Pixel Warrior"     keywords: "pixel art warrior, chunky blocky armor, strong primary color palette, video game hero"
```

---

## Existing Entities (Unchanged)

These entities are already defined in `lib/db/schema.ts` and remain untouched by this feature.

### User
- `id`, `email`, `isSubscriber`, `creditsRemaining`, `dailyLimit`, `subscriptionEndsAt`
- Passed as `initialUser` prop to `GeneratorPageClient`

### SkinGeneration
- `id`, `userId`, `skinUrl`, `prompt`, `referenceImageUrl`, `createdAt`
- Referenced via `generationId` in `SkinPreview` for the download API call

### Credit
- Tracked as `creditsRemaining` on the User entity; no separate credits table

---

## Design Token Model (CSS Layer)

The CSS custom properties in `globals.css` define the visual data model for the UI. These are treated as design tokens — a change here propagates to all components automatically via Tailwind.

| Token | Old Value | New Value |
|-------|-----------|-----------|
| `--background` (dark) | `222.2 84% 4.9%` | `220 20% 6%` |
| `--foreground` (dark) | `210 40% 98%` | `210 30% 90%` |
| `--primary` (dark) | `210 40% 98%` | `127 60% 45%` (Minecraft green) |
| `--accent` (dark) | `217.2 32.6% 17.5%` | `38 95% 58%` (gold/amber) |
| `--radius` | `0.5rem` | `0.25rem` (blocky, squared) |

The **light mode tokens are also updated** to a warm cream/earthy Minecraft palette (stone grey, grass green, dirt brown) so the design is coherent regardless of whether dark mode is forced.
