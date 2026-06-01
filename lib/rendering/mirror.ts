export function mirrorHorizontal<T>(pixels: T[][]): T[][] {
  return pixels.map((row) => [...row].reverse())
}
