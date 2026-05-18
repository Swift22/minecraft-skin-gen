import { createRegistry } from '../registry'
import { none } from './none'
import { round } from './round'
import { pointy } from './pointy'
import { cat } from './cat'
import { fox } from './fox'
import { bunny } from './bunny'
import { wolf } from './wolf'
import { elf } from './elf'

export const ears = createRegistry({ none, round, pointy, cat, fox, bunny, wolf, elf })
export type EarTemplate = ReturnType<typeof ears.names>[number]
