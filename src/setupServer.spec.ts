import { request } from 'http'
import type { Server } from 'http'

import { map } from './map'
import { setupServer } from './setupServer'
import type { Transformer } from './coreTypes'

const echoTransformer: Transformer = map(context => ({
  response: {
    body: context.request?.body,
  },
}))

const helloWorldTransformer: Transformer = map(() => ({
  response: {
    body: 'Hello, World!',
  },
}))

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
