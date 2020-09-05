import { request } from 'http'
import { map } from 'rxjs/operators'
import type { Server } from 'http'

import type { Transformer } from './coreTypes'
import { setupServer } from './setupServer'

const echoTransformer: Transformer = request$ => request$.pipe(
  map(context => ({
    ...context,
    response: {
      body: context.request?.body,
    },
  })),
)

const helloWorldTransformer: Transformer = request$ => request$.pipe(
  map(context => ({
    ...context,
    response: {
      body: 'Hello, World!',
    },
  })),
)

const port = 8080

describe('setupServer', () => {
  let server: Server

  afterEach(() => {
    server.close()
  })

  test('can return a "Hello, World!" server', done => {
    server = setupServer(helloWorldTransformer)
    server.listen(port)

    const options = {
      port,
    }

    request(options, res => {
      let responseBody = ''
      res.on('data', chunk => {
        responseBody += chunk
      })
      res.on('end', () => {
        expect(responseBody).toBe('Hello, World!')
        done()
      })
    }).end()
  })

  test('can return an echo server', done => {
    const requestBody = 'foo'

    server = setupServer(echoTransformer)
    server.listen(port)

    const options = {
      method: 'POST',
      port,
    }

    const req = request(options, res => {
      let responseBody = ''
      res.on('data', chunk => {
        responseBody += chunk
      })
      res.on('end', () => {
        expect(responseBody).toMatch(requestBody)
        done()
      })
    })

    req.write(requestBody)
    req.end()
  })
})
