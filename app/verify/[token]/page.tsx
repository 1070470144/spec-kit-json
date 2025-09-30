async function verifyToken(token: string) {
  const res = await fetch(`http://localhost:3000/api/auth/email/verify?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, data }
}

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const p = await params
  const { ok, data } = await verifyToken(p.token)
  return (
    <div className="container-page section">
      <h1 className="text-2xl font-semibold">邮箱验证</h1>
      {ok ? (
        <div className="space-y-3">
          <div className="text-green-600">邮箱验证成功</div>
          <a className="btn btn-primary" href="/login">去登录</a>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-red-600">验证失败：{data?.error?.message || '无效的验证请求'}</div>
          <a className="btn btn-outline" href="/forgot">忘记密码</a>
        </div>
      )}
    </div>
  )
}


