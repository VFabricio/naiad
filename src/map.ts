import { map as rxMap } from 'rxjs/operators'
import type { Context, Transformer } from './coreTypes'
import { res } from './symbols'

type ContextTransformer = (c: Context) => object
type NaiadMap = (f: ContextTransformer) => Transformer

const map: NaiadMap = f => source$ => (
  source$.pipe(
    rxMap(context => ({ ...context, ...f(context), [res]: context[res] })),
  )
)

export { map }
