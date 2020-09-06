import type { ServerResponse } from 'http'
import type { Observable } from 'rxjs'

import { res } from './symbols'

type Dict<T> = Record<string, T>

type PartialDict<T> = Partial<Dict<T>>

type Headers = PartialDict<string | string[]>

interface Request {
  body: Buffer,
  headers: Headers,
  httpVersion: string,
  method: string,
  url: string,
}

interface Response {
  body?: string | Buffer,
  encoding?: string,
  headers?: Headers,
  statusCode?: number,
  statusMessage?: string,
}

interface Context extends Dict<any> {
  [res]: ServerResponse,
  request?: Request,
  response?: Response,
}

type Transformer = (request$: Observable<Context>) => Observable<Context>

type Predicate<T> = (c: T) => boolean

export { Context, Dict, Headers, PartialDict, Request, Response, Predicate, Transformer }
