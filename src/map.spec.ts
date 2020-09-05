/* eslint-disable import/no-extraneous-dependencies */
import { marbles } from 'rxjs-marbles'
import type { ServerResponse } from 'http'

import { map } from './map'
import { res as resSymbol } from './symbols'

describe('map', () => {
  it('should not change the stream when given an identity transformer', marbles(m => {
    const res = {} as ServerResponse
    const inputsAndOutputs = { a: { [resSymbol]: res } }

    const transformer = map(context => context)

    const source = m.hot('  ^-a-a--a--a|', inputsAndOutputs)
    const expected = m.hot('^-a-a--a--a|', inputsAndOutputs)
    const destination = transformer(source)

    m.expect(destination).toBeObservable(expected)
  }))

  it('should transform each context', marbles(m => {
    const res = {} as ServerResponse
    const inputs = {
      a: { [resSymbol]: res },
      b: { [resSymbol]: res, x: 0 },
      c: { [resSymbol]: res, y: 0 },
      d: { [resSymbol]: res, x: 0, y: 0 },
    }

    const outputs = {
      e: { [resSymbol]: res, x: 42 },
      f: { [resSymbol]: res, x: 42 },
      g: { [resSymbol]: res, x: 42, y: 0 },
      h: { [resSymbol]: res, x: 42, y: 0 },
    }

    const transformer = map(() => ({ x: 42 }))

    const source = m.hot('  ^-a-b--c---d|', inputs)
    const expected = m.hot('--e-f--g---h|', outputs)
    const destination = transformer(source)

    m.expect(destination).toBeObservable(expected)
  }))
})
