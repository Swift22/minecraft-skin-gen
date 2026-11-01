# minecraft-skin-gen Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-21

## Active Technologies
- TypeScript 5.x, Node.js 18.17.0+ + Next.js 15.1.7, React 19, Tailwind CSS 3.4, shadcn/ui (Radix UI primitives), skinview3d 3.4.1, lucide-react 0.475, next/font/google (Press Start 2P — no new package) (002-generator-ui)
- N/A — no new persistence; Supabase Storage unchanged (002-generator-ui)

- TypeScript 5.x, Node.js 18.17.0+ (001-ai-skin-gen)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x, Node.js 18.17.0+: Follow standard conventions

## Recent Changes
- 002-generator-ui: Added TypeScript 5.x, Node.js 18.17.0+ + Next.js 15.1.7, React 19, Tailwind CSS 3.4, shadcn/ui (Radix UI primitives), skinview3d 3.4.1, lucide-react 0.475, next/font/google (Press Start 2P — no new package)

- 001-ai-skin-gen: Added TypeScript 5.x, Node.js 18.17.0+

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

## Product copy — plain and visual

Applies to any user-facing text produced in this project: UI labels, buttons, empty states, errors, toasts, tooltips, onboarding, notifications, emails.

- Plain language: everyday words a non-technical user gets at a glance — write it the way a person would say it out loud. Jargon and technical terms stay in the code, out of the UI.
- Shortest wording that still works. Ship the cut-down version, not the thorough one.
- Show, don't tell: prefer a visual where the UI allows one — icon, progress bar, chart, illustration — text becomes the caption.
- Errors: say what happened and what to do next in plain words. Raw exception/API text (`error.message`, stack traces, HTTP codes) goes to logs or a collapsed details view, never into visible copy.
