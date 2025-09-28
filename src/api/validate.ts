import { z } from 'zod'
import { invalidPayload } from './http'

export async function parseJson<T>(req: Request, schema: z.ZodSchema<T>) {
  try {
    const data = await req.json()
    const parsed = schema.safeParse(data)
    if (!parsed.success) {
      return { ok: false as const, res: invalidPayload(parsed.error.flatten()) }
    }
    return { ok: true as const, data: parsed.data }
  } catch (e) {
    return { ok: false as const, res: invalidPayload(String((e as Error).message)) }
  }
}
