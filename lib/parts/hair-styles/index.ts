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
import { long_flowing } from './long_flowing'
import { twin_tails } from './twin_tails'
import { horned } from './horned'
import { antennae } from './antennae'
import { frog_hood } from './frog_hood'

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
  long_flowing,
  twin_tails,
  horned,
  antennae,
  frog_hood,
})
export type HairStyle = ReturnType<typeof hairStyles.names>[number]
