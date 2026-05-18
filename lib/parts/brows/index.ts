import { createRegistry } from '../registry'
import { none } from './none'
import { flat } from './flat'
import { angled_up } from './angled_up'
import { angled_down } from './angled_down'
import { bushy } from './bushy'

export const brows = createRegistry({ none, flat, angled_up, angled_down, bushy })
export type BrowShape = ReturnType<typeof brows.names>[number]
