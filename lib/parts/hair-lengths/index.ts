import { createRegistry } from '../registry'
import { short } from './short'
import { medium } from './medium'
import { long } from './long'
import { very_long } from './very_long'

export const hairLengths = createRegistry({ short, medium, long, very_long })
export type HairLength = ReturnType<typeof hairLengths.names>[number]
