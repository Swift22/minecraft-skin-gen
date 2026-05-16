# Feature Specification: Generator UI & Retro Pixel Art Experience

**Feature Branch**: `002-generator-ui`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "lets create a good ui for our project — retro pixel art Minecraft skin aesthetics"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compelling Landing Page (Priority: P1)

A visitor who has never used the app arrives at the homepage. The page immediately communicates what the app does, shows a striking visual identity that matches Minecraft's retro pixel art culture, and converts the visitor into a signed-up user within one session. The design must feel intentional — bold arcade colors, blocky typography, pixel-art inspired framing — not a generic SaaS template.

**Why this priority**: First impressions drive sign-up conversion. A generic landing page wastes all traffic. This is the top of the funnel.

**Independent Test**: Can fully be tested by visiting the root URL and verifying layout, copy, and CTA links. Delivers value even without the generator itself.

**Acceptance Scenarios**:

1. **Given** a visitor arrives at the homepage, **When** the page loads, **Then** the page displays a hero section with bold product name, a one-sentence value proposition, and at least one primary CTA ("Generate a Skin" or "Sign Up Free").
2. **Given** a visitor sees the hero section, **When** they read the feature highlights, **Then** they understand the three core capabilities: text-to-skin, image reference, and instant download — presented with visual icons and brief descriptions.
3. **Given** a visitor reaches the bottom of the hero, **When** they look at pricing/access information, **Then** they see free tier limits (3 skins/day) and Pro tier benefits (50 skins/day) stated plainly.
4. **Given** a visitor clicks the primary CTA, **When** they are redirected, **Then** they are taken to the sign-up page.

---

### User Story 2 - Intuitive Skin Generator Form (Priority: P1)

A logged-in user opens the generator page and can describe their desired skin in a prompt field. The form is visually clear, has sensible placeholder copy that hints at retro/pixel art style suggestions, and shows the user what they'll get before they submit. Generating a skin feels fast and satisfying, with clear loading feedback.

**Why this priority**: The generator form is the core product interaction — everything else serves it.

**Independent Test**: Can be tested by navigating to `/generate`, entering a text prompt, and submitting. Delivers a generated skin without any other UI being polished.

**Acceptance Scenarios**:

1. **Given** a logged-in user is on the generator page, **When** the page loads, **Then** the form is immediately visible above the fold with a clearly labeled text area and a "Generate Skin" button.
2. **Given** a user views the prompt field, **When** it is empty, **Then** placeholder text suggests style cues like "retro knight in red armor", "cyberpunk hacker with neon visor", or "90s arcade fighter".
3. **Given** a user submits the form, **When** generation is in progress, **Then** a loading state is shown on the button and the preview area displays a skeleton/spinner — the user is never left wondering if something is happening.
4. **Given** generation completes, **When** the result arrives, **Then** the preview area shows the skin PNG and a download button appears without requiring a page reload.
5. **Given** an optional reference image is uploaded, **When** the user attaches an image, **Then** a thumbnail preview of the uploaded image is shown next to the form so the user can confirm their upload.

---

### User Story 3 - Skin Preview & Download (Priority: P1)

After generation, the user sees their skin displayed in a clear, large preview. The preview shows the flat 64×64 PNG as a scaled-up pixel grid (no blurring — crisp nearest-neighbor scaling). The user can immediately download the file or trigger regeneration.

**Why this priority**: If users cannot see and get their skin, the product has no value. This closes the core loop.

**Independent Test**: Can be tested by generating a skin and verifying the preview and download button work. Value is delivered as soon as the user can save their skin.

**Acceptance Scenarios**:

1. **Given** a skin has been generated, **When** the preview area renders the result, **Then** the skin PNG is displayed at a minimum of 256×256 visible pixels using crisp pixel-perfect scaling (no blur or anti-aliasing).
2. **Given** a user wants their skin, **When** they click "Download", **Then** the browser downloads the file as `skin.png` without navigating away from the page.
3. **Given** a user wants to try again, **When** they click "Regenerate" or "Try Again", **Then** the form resets (or restores previous values) and they can submit a new generation.
4. **Given** a skin is displayed, **When** the user inspects the preview, **Then** the pixel art is clearly legible and the UI framing does not distract from the skin itself.

---

### User Story 4 - Style Presets for Retro Pixel Art Quality (Priority: P2)

The generator form offers style tags or preset buttons that help users steer the AI toward high-quality retro pixel art results. Tags like "Retro Arcade", "Cyberpunk", "Fantasy Knight", "90s Fighter" are one-click additions to the prompt. This reduces the cognitive load of writing a good prompt and improves average output quality.

**Why this priority**: Most users won't know how to prompt the AI for pixel art quality. Presets both guide users and encode the aesthetic constraints automatically.

**Independent Test**: Can be tested by clicking a style tag and verifying it appends correctly to the prompt field. Value is delivered independently of other UI polish.

**Acceptance Scenarios**:

1. **Given** a user views the generator form, **When** they see the style preset area, **Then** at least 6 style presets are shown as clickable chips/badges below the prompt field.
2. **Given** a user clicks a style preset, **When** the tag is selected, **Then** it becomes visually active (highlighted) and its style keywords are appended or merged into the prompt.
3. **Given** a user clicks an already-selected preset, **When** they click it again, **Then** it is deselected and its keywords are removed from the prompt.
4. **Given** a user selects "Retro Arcade" preset, **When** they generate, **Then** the generation input includes the retro/arcade aesthetic constraints alongside their custom description.

---

### User Story 5 - Credit Counter & Upgrade UX (Priority: P2)

The credit counter is always visible on the generator page and updates in real time after each generation. When a free user runs out of credits, the upgrade prompt is prominent and clearly communicates the value of Pro. The upgrade flow is frictionless — one click to payment.

**Why this priority**: Monetization depends on users clearly understanding their limit and having a smooth path to upgrade.

**Independent Test**: Can be tested by exhausting free credits and verifying the upgrade prompt appears and the checkout link works.

**Acceptance Scenarios**:

1. **Given** a logged-in user is on the generator page, **When** the page loads, **Then** the credit counter shows remaining credits and daily limit (e.g., "2 / 3 remaining") in a visually prominent position.
2. **Given** a user generates a skin, **When** the result is returned, **Then** the credit counter updates immediately without a page reload.
3. **Given** a free user has 0 credits remaining, **When** they view the generator page, **Then** the generate button is disabled and a clear "You've used all your daily generations" message is shown with an "Upgrade to Pro" call-to-action.
4. **Given** a user clicks "Upgrade to Pro", **When** they are redirected, **Then** they land directly on the Stripe checkout page for the Pro subscription — no intermediate pages.
5. **Given** a Pro subscriber views the page, **When** they look at the header, **Then** a "Manage Subscription" link is visible and functional.

---

### User Story 6 - Responsive & Accessible Layout (Priority: P3)

The generator page works well on both desktop and mobile. On mobile, the form and preview stack vertically and remain usable. The app has a navigation header that is consistent across all pages and does not shift layout.

**Why this priority**: Minecraft is played on all devices and many users will visit from mobile. Accessibility is a baseline requirement.

**Independent Test**: Can be tested by resizing the browser to mobile widths and verifying no horizontal scroll and no broken layouts.

**Acceptance Scenarios**:

1. **Given** a user on a mobile device (375px viewport), **When** they view the generator page, **Then** the form and preview areas stack vertically with no horizontal overflow.
2. **Given** a user on desktop (1280px+), **When** they view the generator page, **Then** the form and preview sit side by side in a two-column layout.
3. **Given** any page in the app, **When** a screen reader user navigates, **Then** all interactive elements have accessible labels and focus states are visible.

---

### Edge Cases

- What happens when a user submits an empty or very short prompt (under 5 characters)?
- How does the preview area look before any skin has been generated (empty state)?
- What happens when image upload fails or the file is not a valid image format?
- What happens when the generation API returns an error mid-flow?
- How are very long prompts handled — is there a character limit shown to the user?
- What does the credit counter show if the user data fails to load?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The landing page MUST display a hero section with product name, one-line value proposition, and a primary sign-up CTA.
- **FR-002**: The landing page MUST present the three core features (text-to-skin, image reference, instant download) with visual icons and brief descriptions.
- **FR-003**: The landing page MUST display free tier (3/day) and Pro tier (50/day) access information.
- **FR-004**: The generator form MUST include a text area for skin description with placeholder copy suggesting retro/arcade style examples.
- **FR-005**: The generator form MUST include an optional reference image upload with a thumbnail preview shown upon selection.
- **FR-006**: The generator form MUST show a loading state (spinner or progress indicator) while generation is in progress and disable the submit button to prevent double-submission.
- **FR-007**: The skin preview area MUST display the generated PNG at 256×256 or larger using crisp pixel-perfect (nearest-neighbor) scaling — no blur or anti-aliasing.
- **FR-008**: The skin preview MUST include a download button that saves the file as `skin.png`.
- **FR-009**: The skin preview MUST include a regenerate/try-again action that resets the form to generate another skin.
- **FR-010**: The generator form MUST offer at least 6 style preset chips (e.g., "Retro Arcade", "Cyberpunk", "Fantasy Knight", "90s Fighter", "Space Explorer", "Pixel Warrior") that toggle-append keywords to the prompt.
- **FR-011**: The credit counter MUST be visible on the generator page and show credits remaining out of daily limit.
- **FR-012**: The credit counter MUST update without a page reload after each generation completes.
- **FR-013**: When credits reach zero, the generate button MUST be disabled and an upgrade prompt MUST be shown.
- **FR-014**: The upgrade prompt MUST include a direct link to the Pro subscription checkout.
- **FR-015**: The generator layout MUST be responsive, stacking form and preview vertically on mobile viewports and side-by-side on desktop.
- **FR-016**: All interactive elements MUST have visible focus states and accessible labels for keyboard and screen reader users.
- **FR-017**: Error states (generation failure, upload error, network error) MUST be displayed as user-friendly inline messages with suggested next actions.
- **FR-018**: The app MUST have a consistent header across all authenticated pages showing the product name, user email (desktop only), and sign-out action.
- **FR-019**: The visual design MUST use a bold, arcade-inspired aesthetic: high-contrast color palette, blocky/pixel-friendly typography, and pixel-art framing elements — consistent with the Minecraft retro pixel art identity.

### Key Entities

- **Skin Generation**: A user-submitted request with a text prompt and optional reference image, producing a 64×64 PNG skin output.
- **Style Preset**: A named style tag with associated keyword additions that can be toggled to shape generation prompts (e.g., "Retro Arcade" → bold colors, hard shading).
- **Credit**: A daily-resetting allowance representing one skin generation attempt.
- **User**: An authenticated account with a subscription tier (Free or Pro), credit balance, and generation history.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new visitor can reach the sign-up page from the landing page in 2 clicks or fewer.
- **SC-002**: A logged-in user can complete a full skin generation (prompt → generate → download) in under 60 seconds from page load.
- **SC-003**: The generator page loads and is interactive in under 3 seconds on a standard broadband connection.
- **SC-004**: The skin preview displays the pixel art at 4× or greater magnification with no blur — each pixel is sharply rendered as a visible square.
- **SC-005**: The credit counter reflects the correct balance within 1 second of a generation completing.
- **SC-006**: A user with 0 credits who clicks the upgrade button reaches the payment page in 1 click.
- **SC-007**: On a 375px mobile viewport, no horizontal scrolling occurs and all primary actions are reachable without zooming.
- **SC-008**: 100% of interactive form elements have accessible labels visible to screen readers.

## Assumptions

- The retro/arcade visual theme applies to the app UI chrome (colors, typography, framing) as well as the generated skins — this is an intentional brand direction.
- Style presets are purely prompt helpers: they append text keywords to the user's prompt before submission. They do not change any generation parameters beyond the text input.
- The existing Supabase auth, Stripe subscription, and credit system remain unchanged — this feature is UI-only on top of the existing backend.
- "Crisp pixel-perfect scaling" means CSS nearest-neighbor image scaling — no smoothing or anti-aliasing on the skin preview image.
- Free tier is 3 generations/day; Pro is 50/day. These values are already set in the backend and are not changing.
- The app targets Minecraft Java Edition players (desktop-primary, mobile-secondary).
