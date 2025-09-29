export type MailParams = { to: string; subject: string; text: string; html?: string }

export async function sendMail({ to, subject, text }: MailParams): Promise<void> {
  // 开发环境占位实现：输出到控制台
  console.log('[MAIL] to=%s | subject=%s\n%s', to, subject, text)
}
