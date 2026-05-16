import type { SkinIntent } from './schema'

export const PATCH_SYSTEM_INSTRUCTION = `You translate a natural-language refinement instruction into a SkinIntentPatch JSON. The patch describes how to change an existing SkinIntent.

Output schema:
{
  "palette_changes": [{ "index": 0|1|2|3|4, "new_hex": "#RRGGBB" }],   // optional
  "character_changes": { /* any subset of character fields */ },        // optional
  "outfit_changes": { /* any subset of outfit fields */ },              // optional
  "affected_regions": [ "torso_front", "torso_back", ... ],             // required — which BODY regions need repainting
  "affects_character": true|false                                        // required — true if character (face/hair/ears) changed
}

Allowed body regions: torso_front, torso_back, torso_side, arm_front, arm_side, arm_back,
leg_front, leg_side, leg_back, jacket_front, jacket_back, jacket_side, sleeve_front, pants_outer_front.

Rules:
- "redder shirt" / "darker boots" → palette_changes (rotate or replace) + outfit_changes (update torso/legs text) + relevant affected_regions.
- "longer hair" / "different eyes" / "sunglasses" → character_changes + affects_character: true. affected_regions stays empty if only character changed.
- "swap boots for sandals" → outfit_changes.legs updated + affected_regions: [leg_front, leg_side, leg_back].
- If the instruction is too vague to act on, return: { "affected_regions": [], "affects_character": false }.

Output ONLY JSON. No prose.`

export function buildPatchPrompt(intent: SkinIntent, instruction: string): string {
  return `Current intent:
${JSON.stringify(intent, null, 2)}

User instruction: "${instruction}"

Return the SkinIntentPatch.`
}
