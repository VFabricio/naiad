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

const emptyTransformer: Transformer = map(() => ({}))

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
        expect(responseBody).toEqual(requestBody)
        done()
      })
    })

    req.write(requestBody)
    req.end()
  })

  test('can return a server with reasonable response defaults', done => {
    server = setupServer(emptyTransformer)
    server.listen(port)

    const options = {
      port,
    }

    const req = request(options, res => {
      const chunks: Buffer[] = []
      res.on('data', chunk => {
        chunks.push(chunk)
        console.log('Received ', chunk)
      })
      res.on('end', () => {
        const responseBody = Buffer.concat(chunks)
        expect(responseBody.toString()).toEqual('')
        expect(res.statusCode).toEqual(200)
        expect(res.statusMessage).toEqual('OK')
        done()
      })
    })

    req.end()
  })
})
