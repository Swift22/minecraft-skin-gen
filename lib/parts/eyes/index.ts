import { createRegistry } from '../registry'
import { round } from './round'
import { almond } from './almond'
import { wide } from './wide'
import { close_set } from './close_set'
import { sleepy } from './sleepy'
import { dot } from './dot'
import { square } from './square'
import { mono } from './mono'

export const eyes = createRegistry({
  round, almond, wide, close_set, sleepy, dot, square, mono,
})

export type EyeShape = ReturnType<typeof eyes.names>[number]
