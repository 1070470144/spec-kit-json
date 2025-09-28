import { NextRequest } from 'next/server'
import { createReadStream, statSync } from 'node:fs'
import { notFound, badRequest } from '@/src/api/http'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  if (!path) return badRequest('MISSING_PATH')

  try {
    const stat = statSync(path)
    const stream = createReadStream(path)
    return new Response(stream as unknown as ReadableStream, { headers: { 'content-length': String(stat.size) } })
  } catch {
    return notFound()
  }
}
