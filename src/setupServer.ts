import { createServer } from 'http'
import { fromEvent } from 'rxjs'
import { flatMap, map, reduce, takeUntil, tap } from 'rxjs/operators'
import type { IncomingMessage, Server, ServerResponse } from 'http'
import type { Observable } from 'rxjs'

import { defaults } from './config'
import { res as resSymbol } from './symbols'
import type { Context, Transformer } from './coreTypes'

const createContext = (req: IncomingMessage, res: ServerResponse): Observable<Context> => {
  const data$: Observable<Buffer> = fromEvent(req, 'data')
  const end$: Observable<void> = fromEvent(req, 'end')

  const body$ = data$.pipe(
    takeUntil(end$),
    reduce(
      (buffer: Buffer, nextChunk: Uint8Array) => Buffer.concat([buffer, nextChunk]),
      Buffer.alloc(defaults.bodyBufferSize),
    ),
  )

  const { headers, httpVersion, method = defaults.requestMethod, url = defaults.requestUrl } = req

  const context$ = body$.pipe(
    map(body => ({
      request: {
        body,
        headers,
        httpVersion,
        method,
        url,
      },
      [resSymbol]: res,
    })),
  )

  return context$
}

const sendResponse = (context: Context): void => {
  const response = context.response || {}
  const {
    body = defaults.responseBody,
    encoding = defaults.responseEncoding,
    headers = defaults.responseHeaders,
    statusCode = defaults.responseStatusCode,
    statusMessage,
  } = response

  const normalizedEncoding = (
    Buffer.isEncoding(encoding) ? encoding : defaults.responseEncoding as BufferEncoding
  )

  const res = context[resSymbol]

  res.writeHead(statusCode, statusMessage, headers)
  res.end(body, normalizedEncoding)
}

const setupServer = (transformer: Transformer, inputServer?: Server) => {
  const server = inputServer || createServer()

  const rawRequest$: Observable<[IncomingMessage, ServerResponse]> = fromEvent(server, 'request')
  const close$: Observable<void> = fromEvent(server, 'close')

  const request$: Observable<Context> = rawRequest$.pipe(
    takeUntil(close$),
    flatMap(([req, res]) => createContext(req, res)),
  )

  const response$ = transformer(request$)

  const responseEffect$ = response$.pipe(
    tap(sendResponse),
  )

  responseEffect$.subscribe()

  return server
}

export { setupServer }
