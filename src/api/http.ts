import { NextResponse } from 'next/server'

export type ErrorBody = { error: { code: string; message: string; details?: unknown } }

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data } as unknown as T, { status })
}
export function badRequest(message = 'Invalid request', details?: unknown) {
  return NextResponse.json({ error: { code: 'BAD_REQUEST', message, details } } as ErrorBody, { status: 400 })
}
export function invalidPayload(details?: unknown, message = 'Invalid payload') {
  return NextResponse.json({ error: { code: 'INVALID_PAYLOAD', message, details } } as ErrorBody, { status: 400 })
}
export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: { code: 'UNAUTHORIZED', message } } as ErrorBody, { status: 401 })
}
export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: { code: 'FORBIDDEN', message } } as ErrorBody, { status: 403 })
}
export function notFound(message = 'Not found') {
  return NextResponse.json({ error: { code: 'NOT_FOUND', message } } as ErrorBody, { status: 404 })
}
export function unsupportedMediaType(message = 'Unsupported Media Type') {
  return NextResponse.json({ error: { code: 'UNSUPPORTED_MEDIA_TYPE', message } } as ErrorBody, { status: 415 })
}
export function tooLarge(message = 'Payload Too Large') {
  return NextResponse.json({ error: { code: 'PAYLOAD_TOO_LARGE', message } } as ErrorBody, { status: 413 })
}
export function internalError(message = 'Internal Server Error', details?: unknown) {
  return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message, details } } as ErrorBody, { status: 500 })
}
