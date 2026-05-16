# Feature Specification: AI Minecraft Skin Generator

**Feature Branch**: `001-ai-skin-gen`
**Created**: 2026-02-21
**Status**: Draft
**Input**: User description: "this will be an ai minecraft skin generator with google gemini, webapp, we have a skin-chart image for reference so we learn here how to build the skin in the minecraft png skin format, and a test-skin and also the gemini key is in the env, it will take like either visual reference or explanation from the user how they want their minecraft skin"

## Clarifications

### Session 2026-02-21

- Q: At what granularity does the AI output hex color data — individual pixels (4,096 values), per region face with 1–3 colors (base/highlight/shadow), or one flat color per region face? → A: Per named region face with 1–3 hex values (base, optional highlight, optional shadow). The pixel painter fills each UV-bounded region using deterministic distribution rules.
- Q: Should the AI generate hex colors for the outer layer (hat, jacket, sleeves, pants) as well as the inner layer, or inner layer only? → A: Both layers. Outer layer regions are optional — the AI may mark any outer region as transparent where no overlay is intended. Inner layer regions must always be filled.
- Q: When a user uploads a reference image, how should the AI use it in the hex-code generation flow? → A: Color extraction + region mapping — the AI analyses the image, identifies colors per body area (hair, face, torso, legs, etc.) and maps those extracted colors to the corresponding skin region hex values.
- Q: Which pixel distribution pattern should be used to apply 1–3 hex colors (base/highlight/shadow) across the pixels within each region face? → A: Top-lit shading — top pixel row(s) = highlight, middle rows = base color, bottom row(s) = shadow. Applied consistently across all region faces.
- Q: What should happen when the AI returns a malformed or incomplete Region Color Map (invalid hex codes, missing required regions, schema validation failure)? → A: Retry once automatically without consuming an additional credit. If the second attempt also fails validation, surface a user-facing error and refund the credit per FR-020.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Text Description to Skin (Priority: P1)

A logged-in user opens the webapp and types a description of the Minecraft skin they want — for example, "a ninja with a black outfit, red headband, and glowing eyes." The AI interprets the description and generates a valid Minecraft skin PNG that visually matches the request. The user can preview the result and download it for use in Minecraft.

**Why this priority**: This is the core capability of the product. Text input is the lowest barrier to entry and delivers the primary value proposition — turning a simple description into a playable skin.

**Independent Test**: Can be fully tested by entering a text description and verifying a valid, visually coherent 64x64 PNG skin file is generated and downloadable, without any other feature implemented (other than basic authentication to gate access).

**Acceptance Scenarios**:

1. **Given** a logged-in user is on the webapp home page, **When** they type "a knight in silver armor with a red cape" and click Generate, **Then** the system produces a 64x64 PNG that visually represents a knight with silver armor and red cape coloring, correctly laid out in the Minecraft skin format.
2. **Given** a generated skin is displayed, **When** the user clicks Download, **Then** a valid `.png` file is saved to their device that can be imported directly into Minecraft without errors.
3. **Given** the user submits a very short or vague description (e.g., "cool skin"), **When** generation completes, **Then** the system produces a visually coherent skin and optionally informs the user that more detail leads to better results.
4. **Given** the AI fails to generate a skin, **When** an error occurs, **Then** the user sees a friendly error message with an option to try again.

---

### User Story 2 - Image Reference to Skin (Priority: P2)

A logged-in user uploads a reference image — such as a photo, artwork, or character illustration — and the AI analyses it to extract dominant colors per body area (face/skin tone, hair, torso, legs, accessories). Those extracted colors are mapped to the corresponding skin region faces and used as the hex color values when constructing the 64×64 PNG.

**Why this priority**: Visual input is a powerful complement to text descriptions, enabling users who know exactly what they want to generate skins without needing to describe every detail in words.

**Independent Test**: Can be fully tested by uploading a reference image and verifying the generated skin visually reflects the dominant colors and recognizable features of the uploaded image.

**Acceptance Scenarios**:

1. **Given** a logged-in user uploads a JPEG or PNG image of a character, **When** they click Generate, **Then** the AI extracts dominant colors per body area from the image, maps them to skin region faces, and the system produces a Minecraft skin whose colors visibly reflect the reference image.
2. **Given** the user uploads a file in an unsupported format or above the size limit, **When** they attempt to generate, **Then** the system displays a clear error message about acceptable formats and size limits without consuming a generation credit.
3. **Given** the user provides both an image reference and a text description, **When** generation runs, **Then** the system incorporates both inputs into the resulting skin.

---

### User Story 3 - Skin Preview Before Download (Priority: P3)

After generation, the user sees a preview of the flat Minecraft skin PNG directly in the browser before choosing to download it. They can then decide to regenerate with a modified description or download the skin as-is.

**Why this priority**: Previewing before committing to a download is standard UX and reduces wasted generation credits.

**Independent Test**: Can be fully tested by generating a skin and verifying a preview image is shown in the browser UI, with a visible Download button and an option to regenerate.

**Acceptance Scenarios**:

1. **Given** the AI has completed generating a skin, **When** the result is displayed, **Then** the flat 64x64 skin PNG is shown as a preview image in the browser.
2. **Given** the preview is visible, **When** the user clicks "Regenerate," **Then** the input fields remain populated and a new generation request is sent (consuming another generation credit).
3. **Given** the preview is visible, **When** the user clicks "Download," **Then** the skin PNG file is saved to their device with a descriptive filename.

---

### User Story 4 - User Account & Authentication (Priority: P4)

A visitor lands on the webapp and must create an account or log in before generating skins. The system tracks their generation count, subscription status, and previously generated skins per session.

**Why this priority**: Authentication is required to enforce generation limits and subscription tiers. Without it, the monetization model cannot function.

**Independent Test**: Can be fully tested by verifying that unauthenticated users cannot access the generator, and that authenticated users can log in, view their generation count, and access the generator.

**Acceptance Scenarios**:

1. **Given** a visitor is not logged in, **When** they attempt to access the skin generator, **Then** they are redirected to the login/sign-up page.
2. **Given** a visitor signs up with a valid email and password, **When** registration completes, **Then** they are logged in and can access the generator.
3. **Given** a returning user enters their credentials, **When** they log in, **Then** they are taken to the generator with their remaining generation count displayed.
4. **Given** a logged-in user, **When** they view the generator, **Then** their remaining generation count for the current period is clearly visible.

---

### User Story 5 - Generation Limits & Subscription Upgrade (Priority: P5)

Free users have a limited number of generations per period and see Google Ads. When a free user reaches their limit, they are prompted to subscribe. Subscribers receive a higher generation allowance.

**Why this priority**: This is the core monetization model. It directly determines revenue and user upgrade conversion.

**Independent Test**: Can be fully tested by exhausting a free account's generation limit, verifying that generation is blocked, the upgrade prompt is shown, and that a subscribed user has their higher limit restored.

**Acceptance Scenarios**:

1. **Given** a free user has used all their generation credits for the current period, **When** they attempt to generate a new skin, **Then** the system blocks the generation, shows how many credits remain (0), and displays an upgrade prompt.
2. **Given** a free user is on the generator page, **When** the page loads, **Then** Google Ads are displayed in designated ad slots.
3. **Given** a free user clicks "Upgrade," **When** they complete payment, **Then** their account is upgraded to subscriber status and their generation count is refreshed to the subscriber allowance.
4. **Given** a subscriber is on the generator page, **When** the page loads, **Then** no Google Ads are shown.
5. **Given** a subscriber's generation limit for the period is reached, **When** they attempt to generate, **Then** the system informs them of their limit and when it resets (they are not prompted to upgrade again as they are already subscribed).

---

### Edge Cases

- What happens when the uploaded image is too large or in an unsupported format?
- What if the AI returns a Region Color Map with missing inner-layer regions or invalid hex codes? → System retries the AI call once automatically. If the second attempt also fails, the generation is aborted, a user-facing error is shown, and the credit is refunded.
- What if the AI returns a result that does not conform to the Region Color Map schema after both attempts?
- What if the description contains content that the AI safety filters flag?
- What happens if the AI generation service is unavailable or returns an error mid-request?
- What if a generation fails mid-way — does the user lose a credit?
- What happens if a subscription payment fails or is refunded?
- How does the system handle a user who tries to sign up with an already-registered email?

## Requirements *(mandatory)*

### Functional Requirements

**Core Skin Generation**

- **FR-001**: Users MUST be able to enter a natural language text description of their desired Minecraft skin appearance.
- **FR-002**: Users MUST be able to upload an image file as a visual reference for skin generation.
- **FR-003**: Users MUST be able to provide both a text description and an image reference simultaneously.
- **FR-004**: System MUST generate a valid Minecraft skin in 64x64 pixel PNG format, conforming to the standard body-part layout (head, body, arms, legs, and their outer layer equivalents). Generation is performed by: (1) sending the user's input and the skin UV region boundaries to the AI, (2) receiving structured hex color data (1–3 hex codes per named region face: base, highlight, shadow), and (3) programmatically painting each region onto a 64×64 RGBA pixel grid using those colors.
- **FR-004a**: The AI MUST output hex color data at the **per named region face** granularity — 1 to 3 hex values per region (base color; optionally a highlight and a shadow). The system MUST NOT rely on the AI to generate a PNG image directly. The schema covers all ~76 region faces: ~38 inner layer (body geometry) and ~38 outer layer (overlays: hat, jacket, sleeves, pants). All inner layer regions MUST be assigned a color. Outer layer regions MAY be marked transparent where no overlay is intended.
- **FR-004b**: The pixel-painting logic MUST distribute the provided hex colors across the pixels within each region using **top-lit shading**: top pixel row(s) = highlight color, middle rows = base color, bottom row(s) = shadow color. When only a base color is provided (no highlight or shadow), the entire region is filled with the base color. This rule applies consistently across all region faces.
- **FR-005**: System MUST display a preview of the generated skin to the user before download.
- **FR-006**: Users MUST be able to download the generated skin as a PNG file directly from the browser.
- **FR-007**: Users MUST be able to regenerate a new skin using their existing inputs without re-entering all information (each regeneration consumes a generation credit).
- **FR-008**: System MUST provide clear, user-friendly error messages when generation fails, with actionable guidance.
- **FR-008a**: When the AI returns a malformed or incomplete Region Color Map (invalid hex codes, missing required inner-layer regions, or schema validation failure), the system MUST automatically retry the AI call once before surfacing an error to the user. The retry MUST NOT consume an additional generation credit. If the second attempt also fails validation, the system MUST show a user-facing error and refund the original credit per FR-020.
- **FR-009**: System MUST validate that uploaded images meet format and size requirements before initiating generation; a failed validation MUST NOT consume a generation credit.
- **FR-010**: System MUST map the AI's per-region hex color output to pixel coordinates using the standard Minecraft skin UV region boundaries (as defined in the skin chart reference). Every named region face MUST be painted before the PNG is considered valid.

**Authentication**

- **FR-011**: System MUST require users to be authenticated before accessing the skin generator.
- **FR-012**: System MUST allow users to register with an email and password.
- **FR-013**: System MUST allow users to log in and log out.
- **FR-014**: System MUST prevent duplicate account registration with the same email address.

**Generation Limits**

- **FR-015**: System MUST track each user's generation count for the current billing/reset period.
- **FR-016**: System MUST display a user's remaining generation count on the generator page.
- **FR-017**: System MUST block generation attempts when a user's credit count reaches zero, and display an appropriate message.
- **FR-018**: Free users MUST have a limited number of generations per period (default: 3 per day).
- **FR-019**: Subscriber users MUST have a higher generation limit per period (default: 50 per day).
- **FR-020**: Generation credits MUST only be consumed on successful skin generation; failed generations due to system errors MUST NOT deduct a credit.

**Subscriptions & Monetization**

- **FR-021**: System MUST offer a subscription plan that unlocks a higher generation limit and removes ads.
- **FR-022**: System MUST integrate with a payment provider to handle subscription purchases and renewals.
- **FR-023**: System MUST display Google Ads to free-tier users in designated page areas.
- **FR-024**: System MUST NOT display Google Ads to active subscribers.
- **FR-025**: System MUST prompt free users who have exhausted their credits to upgrade to a subscription.
- **FR-026**: System MUST handle subscription cancellations and ensure access reverts to free-tier at the end of the billing period.

### Key Entities

- **User**: A registered account with email, authentication credentials, subscription status, and a generation credit counter for the current period.
- **Skin Generation Request**: A user's input consisting of an optional text description, an optional image reference, or both. At least one must be present.
- **Minecraft Skin**: A 64x64 pixel PNG file structured according to the Minecraft skin layout — divided into named region faces for each body part (head, body, arms, legs) and outer layer overlays (hat, jacket, sleeves, pants). Each region face is a rectangular pixel block with known UV coordinates.
- **Region Color Map**: The structured data output from the AI — a mapping of each named skin region face to 1–3 hex color values (base, optional highlight, optional shadow). This is the intermediate representation between the AI's output and the final PNG.
- **Generation Result**: The programmatically constructed skin PNG, built by painting each region face's hex colors onto a 64×64 RGBA pixel grid according to deterministic distribution rules. Associated with a user and timestamped to the session.
- **Subscription**: A user's active paid plan, including its tier, current period start/end dates, and status (active, cancelled, expired).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can go from opening the webapp to having a downloadable skin in under 45 seconds on average (excluding account creation time).
- **SC-002**: 100% of successfully generated skins are valid Minecraft skin files — 64x64 pixels, importable in-game without errors.
- **SC-003**: 85% or more of generated skins visually reflect the user's described or shown intent, as judged by manual review of a sample set.
- **SC-004**: Users can successfully generate a skin using text-only input, image-only input, or a combination of both.
- **SC-005**: Error states are communicated within 3 seconds of failure detection, with actionable guidance shown to the user.
- **SC-006**: Each generation is a standalone, independent request — no iterative refinement of a previous skin is required.
- **SC-007**: Generation limits are enforced accurately — no user generates more skins than their tier allows in a given period.
- **SC-008**: Subscription upgrade flow can be completed in under 2 minutes from clicking "Upgrade" to confirmed subscriber status.

## Assumptions

- The Minecraft skin PNG format is 64x64 pixels, with body-part region UV boundaries defined by the skin chart reference image already in the project.
- The AI does NOT generate a PNG image directly. It generates structured hex color data (a Region Color Map) which is then painted onto the pixel grid programmatically.
- The AI outputs 1–3 hex color values per named region face (base, optional highlight, optional shadow). The pixel painter applies these using deterministic pattern rules within each region's UV boundary.
- The Region Color Map schema covers all ~76 named region faces (~38 inner + ~38 outer). Inner layer regions are always filled; outer layer regions (hat, jacket, sleeves, pants) are optional and default to fully transparent (alpha = 0) when the AI omits them or explicitly marks them transparent.
- Users are familiar enough with Minecraft to know what a skin is and how to apply it in-game (no in-app tutorial required for MVP).
- Supported image upload formats are JPG and PNG; maximum file size is 10MB.
- The AI generation may take up to 30 seconds; the UI will display a loading state during this time.
- Free tier default: 3 generations per day. Subscriber tier default: 50 generations per day. These numbers can be adjusted.
- Generation credits reset on a daily basis at midnight UTC.
- Subscribers who cancel retain their subscriber benefits until the end of their current paid billing period.
- Failed generations due to system or AI errors do not consume a user's generation credit.
- The app is intended for personal/hobbyist use; content moderation relies on the AI provider's built-in safety filters.
- Each generation is standalone — users cannot iteratively refine a previously generated skin through follow-up instructions.
