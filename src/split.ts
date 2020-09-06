import { merge, partition } from 'rxjs'
import type { Observable } from 'rxjs'
import type { Context, Predicate, Transformer } from './coreTypes'

type NaiadSplit = {
  (d: Transformer): Transformer
  (p1: Predicate<Context>, t1: Transformer, d: Transformer): Transformer
  (p1: Predicate<Context>, t1: Transformer,
   p2: Predicate<Context>, t2: Transformer, d: Transformer): Transformer
}

const butLast = <T>(arr: T[]): T[] => arr.slice(0, arr.length - 1)
const last = <T>(arr: T[]): T => arr[arr.length - 1]
const zip = <T, U>(a: T[], b: U[]): Array<[T, U]> => a.map((x, i) => [x, b[i]])

const splitOnce = <T>(observables: Observable<T>[], predicate: Predicate<T>) => [
  ...butLast(observables),
  ...partition(last(observables), predicate),
]

const splitOnPredicates = <T>(predicates: Predicate<T>[], source$: Observable<T>) => (
  predicates.reduce(splitOnce, [source$])
)

const split: NaiadSplit = (...args: any[]) => (input$: Observable<Context>) => {
  const splitters = butLast(args)
  const defaultHandler = last(args)
  const predicates: Predicate<Context>[] = splitters.filter((_, i) => i % 2 === 0)
  const handlers: Transformer[] = splitters.filter((_, i) => i % 2 === 1)

  const splitInputs = splitOnPredicates(predicates, input$)
  const matchedInputs = butLast(splitInputs)
  const fallthroughInput = last(splitInputs)

  const transformedMatchedInputs = zip(handlers, matchedInputs).map(([h, m]) => h(m))
  const transformedInputs = transformedMatchedInputs.concat(defaultHandler(fallthroughInput))

  return merge(...transformedInputs)
}

export { split }
