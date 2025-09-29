import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/db/client'

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: { code: 'INVALID_PAYLOAD', message: 'MISSING_TOKEN' } }, { status: 400 })
  const vt = await prisma.verificationToken.findUnique({ where: { token } })
  if (!vt) return NextResponse.json({ error: { code: 'TOKEN_INVALID', message: 'INVALID' } }, { status: 400 })
  if (vt.expiresAt < new Date()) return NextResponse.json({ error: { code: 'TOKEN_EXPIRED', message: 'EXPIRED' } }, { status: 400 })
  await prisma.$transaction([
    prisma.user.update({ where: { id: vt.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.verificationToken.delete({ where: { token } })
  ])
  return NextResponse.json({ ok: true })
}
