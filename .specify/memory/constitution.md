<!--
SYNC IMPACT REPORT
==================
Version change: [UNFILLED TEMPLATE] → 1.0.0
This is the initial ratification of the Minecraft Skin Generator constitution.
All placeholder tokens have been replaced.

Modified principles: N/A (first fill)

Added sections:
  - Core Principles (I–IV)
  - Quality Gates
  - Development Workflow
  - Governance

Removed sections: N/A

Templates requiring updates:
  ✅ .specify/memory/constitution.md — this file, fully populated
  ✅ .specify/templates/plan-template.md — Constitution Check section references
     principles by name; existing structure is compatible with the four principles defined here.
  ✅ .specify/templates/spec-template.md — Success Criteria section aligns with
     performance and UX consistency principles (SC-002 perf targets, SC-003 UX metrics).
  ✅ .specify/templates/tasks-template.md — Phase N "Polish" tasks cover performance
     optimization and security hardening consistent with these principles; no structural
     changes required.
  ⚠ .specify/templates/agent-file-template.md — Code Style section should reference
     Principle I (Code Quality) once technologies are confirmed. Manually update when
     the first feature plan is produced.

Follow-up TODOs:
  - NONE: All placeholders resolved. Agent-file-template flagged for manual update
    after first plan.md is generated.
-->

# Minecraft Skin Generator Constitution

## Core Principles

### I. Code Quality

All code contributed to this project MUST be clean, readable, and maintainable.
Specifically:

- Functions and modules MUST have a single, clearly stated responsibility.
- Variable and function names MUST be descriptive; abbreviations are prohibited
  unless they are universally understood domain terms (e.g., `px`, `RGB`).
- Code MUST be free of dead code, commented-out blocks, and unused imports before
  merging; exceptions require an explanatory comment with a linked issue or TODO.
- Cyclomatic complexity per function MUST NOT exceed 10 without explicit justification
  in the pull request description.
- All public APIs MUST be documented with types and intent (docstrings, JSDoc, or
  equivalent for the active language).

**Rationale**: A skin generator involves image processing logic, AI/generative pipelines,
and a user-facing interface. Complexity accumulates quickly; disciplined code quality
prevents maintenance debt from blocking future iteration.

### II. Testing Standards

Testing is a first-class activity and MUST NOT be skipped to meet delivery speed.

- Unit tests MUST cover all pure functions, utility helpers, and transformation logic.
- Integration tests MUST cover every user-facing workflow end-to-end at the service
  boundary (e.g., prompt → skin generation → image output).
- New features MUST NOT be merged unless all associated tests pass in CI.
- Minimum acceptable test coverage threshold is **80 %** for new code; coverage MUST
  NOT decrease below the current baseline on any merged commit.
- Tests MUST be deterministic; flaky tests MUST be fixed or quarantined immediately,
  not silently tolerated.
- TDD is the preferred workflow: write tests first, confirm they fail, then implement.

**Rationale**: Image generation pipelines have subtle regressions (color shifts,
dimension errors, format incompatibilities) that only structured testing catches reliably.

### III. User Experience Consistency

Every user-facing surface MUST behave predictably and adhere to a unified design language.

- UI components MUST follow the project's established design tokens (colors, spacing,
  typography) without one-off overrides.
- Error states MUST be communicated clearly to the user with actionable guidance;
  raw stack traces or internal error codes MUST NOT be exposed.
- Loading/processing states (e.g., skin generation in progress) MUST provide visible
  feedback within 300 ms of the triggering action.
- Navigation and interaction patterns MUST be consistent across all screens or
  workflow steps; an action available in one context MUST behave identically in
  equivalent contexts.
- Accessibility: all interactive elements MUST meet WCAG 2.1 AA contrast and
  keyboard-navigability requirements.

**Rationale**: Minecraft skin generation involves creative, iterative user workflows.
Inconsistent UX breaks the creative flow and erodes user trust in generated output.

### IV. Performance Requirements

Performance targets are non-negotiable product requirements, not post-launch
optimizations.

- Skin generation (prompt → downloadable image) MUST complete within **15 seconds**
  at p95 under expected load. If an external model API is the bottleneck, the UI MUST
  stream progress rather than show a static spinner.
- Initial page/application load MUST render interactive content within **3 seconds**
  on a standard broadband connection (≥25 Mbps).
- Image assets served to users MUST be appropriately compressed; unoptimized raw
  bitmaps MUST NOT be delivered to the browser/client.
- Performance regressions of more than **10 %** on any tracked metric MUST be
  investigated and resolved before the offending commit is merged.
- Performance benchmarks MUST be run in CI on every pull request touching
  generation, rendering, or asset-serving code paths.

**Rationale**: Perceived speed is a primary driver of user satisfaction in generative
tools. A slow or unpredictable generation loop drives abandonment regardless of
output quality.

## Quality Gates

All pull requests MUST pass the following gates before merge:

1. **Linting & formatting**: Zero linting errors; auto-formatter applied with no
   unstaged diff.
2. **Test suite**: All existing and new tests pass; coverage does not regress below
   the established threshold.
3. **Performance check**: Benchmarks on affected code paths show no regression >10 %.
4. **Constitution Check**: PR description MUST acknowledge any complexity justifications
   required by Principle I, and MUST confirm test coverage for the changes per
   Principle II.
5. **Peer review**: At least one reviewer MUST approve; automated review alone is
   insufficient for logic-bearing changes.

Hotfixes to production may bypass peer review under documented emergency conditions,
but MUST be followed by a retroactive review within 24 hours.

## Development Workflow

1. Feature work begins with a specification (`/speckit.specify`) and plan
   (`/speckit.plan`) before any code is written.
2. Tasks are generated from the plan (`/speckit.tasks`) and executed in priority order.
3. Tests are written and confirmed failing before implementation (Principle II).
4. All code is submitted via pull request against the main branch; direct pushes
   to main are prohibited.
5. The Constitution Check in `plan.md` MUST be completed before Phase 0 research
   and re-verified after Phase 1 design.
6. Complexity violations identified during the Constitution Check MUST be documented
   in the Complexity Tracking table of `plan.md` before proceeding.

## Governance

This constitution supersedes all other practices, conventions, and prior verbal
agreements. It applies to all contributors regardless of role.

**Amendment procedure**:
1. Propose amendment via pull request updating this file.
2. Amendment MUST include a completed Sync Impact Report (as an HTML comment at
   the top of this file) detailing the version bump and affected artifacts.
3. At least one maintainer MUST approve the amendment.
4. Version MUST be incremented per semantic versioning:
   - **MAJOR**: Backward-incompatible removal or redefinition of a principle.
   - **MINOR**: New principle or section added, or materially expanded guidance.
   - **PATCH**: Clarifications, wording, or non-semantic refinements.
5. All templates listed in the Sync Impact Report MUST be updated in the same PR
   or flagged as ⚠ pending with a linked follow-up issue.

**Compliance review**: Constitution compliance MUST be verified in every PR review.
Reviewers are empowered to block merges that violate any principle.

**Version**: 1.0.0 | **Ratified**: 2026-02-21 | **Last Amended**: 2026-02-21
