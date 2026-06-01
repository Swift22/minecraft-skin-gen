export interface Registry<K extends string, V> {
  get(name: K): V
  names(): K[]
  has(name: string): name is K
}

export function createRegistry<K extends string, V>(parts: Record<K, V>): Registry<K, V> {
  const names = Object.keys(parts) as K[]
  return {
    get(name) {
      const value = parts[name]
      if (value === undefined) throw new Error(`Part not found: ${name}`)
      return value
    },
    names() {
      return [...names]
    },
    has(name): name is K {
      return name in parts
    },
  }
}
