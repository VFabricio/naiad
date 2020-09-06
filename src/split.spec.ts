/* eslint-disable import/no-extraneous-dependencies */
import { marbles } from 'rxjs-marbles'
import type { ServerResponse } from 'http'

import { map } from './map'
import { split } from './split'
import { res as resSymbol } from './symbols'
import type { Context, Predicate } from './coreTypes'

describe('split', () => {
  it('should handle each path as specified by the corresponding transformer', marbles(m => {
    const res = {} as ServerResponse
    const inputs = {
      a: {
        [resSymbol]: res,
        request: { body: Buffer.alloc(0), headers: {}, httpVersion: '1.1', method: 'GET', url: '/' },
      },
      b: {
        [resSymbol]: res,
        request: { body: Buffer.from('Hi!'), headers: {}, httpVersion: '1.1', method: 'GET', url: '/not-home' },
      },
      c: { [resSymbol]: res },
    }
    const outputs = {
      d: { ...inputs.a, response: { body: "You're home!" } },
      e: { ...inputs.b, response: { body: 'You said hi!' } },
      f: { ...inputs.c, response: { statusCode: 400 } },
    }

    const isHome: Predicate<Context> = context => context.request?.url === '/'
    const saysHi: Predicate<Context> = context => context.request?.body.toString() === 'Hi!'
    const handleHome = map(() => ({
      response: {
        body: "You're home!",
      },
    }))
    const handleHi = map(() => ({
      response: {
        body: 'You said hi!',
      },
    }))
    const fallbackHandler = map(() => ({
      response: {
        statusCode: 400,
      },
    }))

    const transformer = split(
      isHome, handleHome,
      saysHi, handleHi,
      fallbackHandler,
    )

    const source = m.hot('  ^-a--b-c-|', inputs)
    const expected = m.hot('^-d--e-f-|', outputs)
    const destination = transformer(source)

    m.expect(destination).toBeObservable(expected)
  }))
})
