/** Minecraft skin UV region layer type */
export type RegionLayer = 'inner' | 'outer'

/** A named rectangular region in the Minecraft skin UV flat-sprite-sheet (64×64) */
export interface SkinRegion {
  /** Unique region identifier matching the RegionColorMap key */
  name: string
  /** Left edge pixel coordinate (0-indexed) */
  x: number
  /** Top edge pixel coordinate (0-indexed) */
  y: number
  /** Width in pixels */
  width: number
  /** Height in pixels */
  height: number
  /** Inner = base skin layer; outer = overlay layer (hat, jacket, sleeves, pants) */
  layer: RegionLayer
}

/**
 * All ~76 named Minecraft skin UV regions from the minotar/skin-spec UV map.
 * Coordinates follow the standard Java Edition skin layout on a 64×64 grid.
 */
export const SKIN_REGIONS: SkinRegion[] = [
  // ─── Head inner ───────────────────────────────────────────────────────────────
  { name: 'head_top', x: 8, y: 0, width: 8, height: 8, layer: 'inner' },
  { name: 'head_bottom', x: 16, y: 0, width: 8, height: 8, layer: 'inner' },
  { name: 'head_right', x: 0, y: 8, width: 8, height: 8, layer: 'inner' },
  { name: 'head_front', x: 8, y: 8, width: 8, height: 8, layer: 'inner' },
  { name: 'head_left', x: 16, y: 8, width: 8, height: 8, layer: 'inner' },
  { name: 'head_back', x: 24, y: 8, width: 8, height: 8, layer: 'inner' },

  // ─── Head outer (hat) ─────────────────────────────────────────────────────────
  { name: 'hat_top', x: 40, y: 0, width: 8, height: 8, layer: 'outer' },
  { name: 'hat_bottom', x: 48, y: 0, width: 8, height: 8, layer: 'outer' },
  { name: 'hat_right', x: 32, y: 8, width: 8, height: 8, layer: 'outer' },
  { name: 'hat_front', x: 40, y: 8, width: 8, height: 8, layer: 'outer' },
  { name: 'hat_left', x: 48, y: 8, width: 8, height: 8, layer: 'outer' },
  { name: 'hat_back', x: 56, y: 8, width: 8, height: 8, layer: 'outer' },

  // ─── Torso inner ──────────────────────────────────────────────────────────────
  { name: 'torso_top', x: 20, y: 16, width: 8, height: 4, layer: 'inner' },
  { name: 'torso_bottom', x: 28, y: 16, width: 8, height: 4, layer: 'inner' },
  { name: 'torso_right', x: 16, y: 20, width: 4, height: 12, layer: 'inner' },
  { name: 'torso_front', x: 20, y: 20, width: 8, height: 12, layer: 'inner' },
  { name: 'torso_left', x: 28, y: 20, width: 4, height: 12, layer: 'inner' },
  { name: 'torso_back', x: 32, y: 20, width: 8, height: 12, layer: 'inner' },

  // ─── Torso outer (jacket) ─────────────────────────────────────────────────────
  { name: 'jacket_top', x: 20, y: 32, width: 8, height: 4, layer: 'outer' },
  { name: 'jacket_bottom', x: 28, y: 32, width: 8, height: 4, layer: 'outer' },
  { name: 'jacket_right', x: 16, y: 36, width: 4, height: 12, layer: 'outer' },
  { name: 'jacket_front', x: 20, y: 36, width: 8, height: 12, layer: 'outer' },
  { name: 'jacket_left', x: 28, y: 36, width: 4, height: 12, layer: 'outer' },
  { name: 'jacket_back', x: 32, y: 36, width: 8, height: 12, layer: 'outer' },

  // ─── Right Arm inner ──────────────────────────────────────────────────────────
  { name: 'right_arm_top', x: 44, y: 16, width: 4, height: 4, layer: 'inner' },
  { name: 'right_arm_bottom', x: 48, y: 16, width: 4, height: 4, layer: 'inner' },
  { name: 'right_arm_right', x: 40, y: 20, width: 4, height: 12, layer: 'inner' },
  { name: 'right_arm_front', x: 44, y: 20, width: 4, height: 12, layer: 'inner' },
  { name: 'right_arm_left', x: 48, y: 20, width: 4, height: 12, layer: 'inner' },
  { name: 'right_arm_back', x: 52, y: 20, width: 4, height: 12, layer: 'inner' },

  // ─── Right Arm outer (sleeve) ─────────────────────────────────────────────────
  { name: 'right_sleeve_top', x: 44, y: 32, width: 4, height: 4, layer: 'outer' },
  { name: 'right_sleeve_bottom', x: 48, y: 32, width: 4, height: 4, layer: 'outer' },
  { name: 'right_sleeve_right', x: 40, y: 36, width: 4, height: 12, layer: 'outer' },
  { name: 'right_sleeve_front', x: 44, y: 36, width: 4, height: 12, layer: 'outer' },
  { name: 'right_sleeve_left', x: 48, y: 36, width: 4, height: 12, layer: 'outer' },
  { name: 'right_sleeve_back', x: 52, y: 36, width: 4, height: 12, layer: 'outer' },

  // ─── Right Leg inner ──────────────────────────────────────────────────────────
  { name: 'right_leg_top', x: 4, y: 16, width: 4, height: 4, layer: 'inner' },
  { name: 'right_leg_bottom', x: 8, y: 16, width: 4, height: 4, layer: 'inner' },
  { name: 'right_leg_right', x: 0, y: 20, width: 4, height: 12, layer: 'inner' },
  { name: 'right_leg_front', x: 4, y: 20, width: 4, height: 12, layer: 'inner' },
  { name: 'right_leg_left', x: 8, y: 20, width: 4, height: 12, layer: 'inner' },
  { name: 'right_leg_back', x: 12, y: 20, width: 4, height: 12, layer: 'inner' },

  // ─── Right Leg outer (pants) ──────────────────────────────────────────────────
  { name: 'right_pants_top', x: 4, y: 32, width: 4, height: 4, layer: 'outer' },
  { name: 'right_pants_bottom', x: 8, y: 32, width: 4, height: 4, layer: 'outer' },
  { name: 'right_pants_right', x: 0, y: 36, width: 4, height: 12, layer: 'outer' },
  { name: 'right_pants_front', x: 4, y: 36, width: 4, height: 12, layer: 'outer' },
  { name: 'right_pants_left', x: 8, y: 36, width: 4, height: 12, layer: 'outer' },
  { name: 'right_pants_back', x: 12, y: 36, width: 4, height: 12, layer: 'outer' },

  // ─── Left Arm inner ───────────────────────────────────────────────────────────
  { name: 'left_arm_top', x: 36, y: 48, width: 4, height: 4, layer: 'inner' },
  { name: 'left_arm_bottom', x: 40, y: 48, width: 4, height: 4, layer: 'inner' },
  { name: 'left_arm_right', x: 32, y: 52, width: 4, height: 12, layer: 'inner' },
  { name: 'left_arm_front', x: 36, y: 52, width: 4, height: 12, layer: 'inner' },
  { name: 'left_arm_left', x: 40, y: 52, width: 4, height: 12, layer: 'inner' },
  { name: 'left_arm_back', x: 44, y: 52, width: 4, height: 12, layer: 'inner' },

  // ─── Left Arm outer (sleeve) ──────────────────────────────────────────────────
  { name: 'left_sleeve_top', x: 52, y: 48, width: 4, height: 4, layer: 'outer' },
  { name: 'left_sleeve_bottom', x: 56, y: 48, width: 4, height: 4, layer: 'outer' },
  { name: 'left_sleeve_right', x: 48, y: 52, width: 4, height: 12, layer: 'outer' },
  { name: 'left_sleeve_front', x: 52, y: 52, width: 4, height: 12, layer: 'outer' },
  { name: 'left_sleeve_left', x: 56, y: 52, width: 4, height: 12, layer: 'outer' },
  { name: 'left_sleeve_back', x: 60, y: 52, width: 4, height: 12, layer: 'outer' },

  // ─── Left Leg inner ───────────────────────────────────────────────────────────
  { name: 'left_leg_top', x: 20, y: 48, width: 4, height: 4, layer: 'inner' },
  { name: 'left_leg_bottom', x: 24, y: 48, width: 4, height: 4, layer: 'inner' },
  { name: 'left_leg_right', x: 16, y: 52, width: 4, height: 12, layer: 'inner' },
  { name: 'left_leg_front', x: 20, y: 52, width: 4, height: 12, layer: 'inner' },
  { name: 'left_leg_left', x: 24, y: 52, width: 4, height: 12, layer: 'inner' },
  { name: 'left_leg_back', x: 28, y: 52, width: 4, height: 12, layer: 'inner' },

  // ─── Left Leg outer (pants) ───────────────────────────────────────────────────
  { name: 'left_pants_top', x: 4, y: 48, width: 4, height: 4, layer: 'outer' },
  { name: 'left_pants_bottom', x: 8, y: 48, width: 4, height: 4, layer: 'outer' },
  { name: 'left_pants_right', x: 0, y: 52, width: 4, height: 12, layer: 'outer' },
  { name: 'left_pants_front', x: 4, y: 52, width: 4, height: 12, layer: 'outer' },
  { name: 'left_pants_left', x: 8, y: 52, width: 4, height: 12, layer: 'outer' },
  { name: 'left_pants_back', x: 12, y: 52, width: 4, height: 12, layer: 'outer' },
]

/** Inner layer region names (required in RegionColorMap) */
export const INNER_REGION_NAMES = SKIN_REGIONS.filter((r) => r.layer === 'inner').map(
  (r) => r.name
)

/** Outer layer region names (optional in RegionColorMap — default transparent) */
export const OUTER_REGION_NAMES = SKIN_REGIONS.filter((r) => r.layer === 'outer').map(
  (r) => r.name
)
