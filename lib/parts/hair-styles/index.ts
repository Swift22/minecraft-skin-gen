import { createRegistry } from '../registry'
import { classic } from './classic'
import { bangs } from './bangs'
import { side_part } from './side_part'
import { mohawk } from './mohawk'
import { fluffy } from './fluffy'
import { curtain } from './curtain'
import { bald } from './bald'
import { bun } from './bun'
import { ponytail } from './ponytail'
import { spiky } from './spiky'
import { undercut } from './undercut'
import { dreads } from './dreads'

export const hairStyles = createRegistry({
  classic,
  bangs,
  side_part,
  mohawk,
  fluffy,
  curtain,
  bald,
  bun,
  ponytail,
  spiky,
  undercut,
  dreads,
})
export type HairStyle = ReturnType<typeof hairStyles.names>[number]
