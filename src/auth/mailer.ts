export type MailParams = { to: string; subject: string; text: string; html?: string }

export async function sendMail({ to, subject, text, html }: MailParams): Promise<void> {
  // 仅使用管理端（数据库）配置
  const { prisma } = await import('@/src/db/client')
  const rows = await (prisma as any)["systemConfig"].findMany({ where: { key: { in: ['smtp.host','smtp.port','smtp.user','smtp.pass','mail.from'] } } })
  const map = new Map<string, string>()
  for (const r of rows) map.set(r.key, r.value)

  const host = (map.get('smtp.host') || '').trim() || undefined
  const portStr = (map.get('smtp.port') || '').trim() || undefined
  const user = (map.get('smtp.user') || '').trim() || undefined
  const pass = (map.get('smtp.pass') || '').trim() || undefined
  const from = ((map.get('mail.from') || '').trim()) || user || 'no-reply@example.com'

  const port = portStr ? Number(portStr) : undefined

  if (!host || !port || !user || !pass) {
    throw new Error('SMTP_CONFIG_MISSING')
  }

  if (host && port && user && pass) {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
    await transporter.sendMail({ from, to, subject, text, html })
    return
  }
  // 不再回退到 DRYRUN；上方缺失即抛错。
}
