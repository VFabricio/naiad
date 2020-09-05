import { createServer } from 'http'
import { fromEvent } from 'rxjs'
import { flatMap, map, reduce, takeUntil, tap } from 'rxjs/operators'
import type { IncomingMessage, Server, ServerResponse } from 'http'
import type { Observable } from 'rxjs'

import type { Context, Transformer } from './coreTypes'
import { res as resSymbol } from './symbols'

const createContext = (req: IncomingMessage, res: ServerResponse): Observable<Context> => {
  const data$: Observable<Buffer> = fromEvent(req, 'data')
  const end$: Observable<void> = fromEvent(req, 'end')

  const body$ = data$.pipe(
    takeUntil(end$),
    reduce(
      (buffer: Buffer, nextChunk: Uint8Array) => Buffer.concat([buffer, nextChunk]),
      Buffer.alloc(128),
    ),
  )

  const { headers, httpVersion, method = 'GET', url = '/' } = req

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
    body = '',
    encoding = 'utf-8',
    headers = {},
    statusCode = 400,
    statusMessage,
  } = response

  const normalizedEncoding = Buffer.isEncoding(encoding) ? encoding : 'utf-8'

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
