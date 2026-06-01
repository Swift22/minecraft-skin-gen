import { createRegistry } from '../registry'
import { none } from './none'
import { smile } from './smile'
import { wide_smile } from './wide_smile'
import { frown } from './frown'
import { open } from './open'
import { smirk } from './smirk'

export const mouths = createRegistry({ none, smile, wide_smile, frown, open, smirk })
export type MouthShape = ReturnType<typeof mouths.names>[number]
