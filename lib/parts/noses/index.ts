import { createRegistry } from '../registry'
import { none } from './none'
import { bridge } from './bridge'
import { dot } from './dot'
import { wide } from './wide'

export const noses = createRegistry({ none, bridge, dot, wide })
export type NoseShape = ReturnType<typeof noses.names>[number]
