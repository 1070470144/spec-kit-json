import { headers, cookies } from 'next/headers'

async function fetchAdminComments(page = 1) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const res = await fetch(`${base}/api/admin/comments?page=${page}&pageSize=20`, { cache: 'no-store', headers: { cookie: cookieHeader } })
  const j = await res.json().catch(()=>({}))
  return { data: j?.data || j }
}

export default async function AdminCommentsPage() {
  const { data } = await fetchAdminComments(1)
  const rows = data?.items || []
  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-body">
          <div className="card-title">评论管理</div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="text-left font-medium pb-1 pr-2">剧本</th>
                  <th className="text-left font-medium pb-1 pr-2">作者</th>
                  <th className="text-left font-medium pb-1 pr-2">内容</th>
                  <th className="text-left font-medium pb-1">时间</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="py-1 pr-2"><a className="hover:underline" href={`/scripts/${r.scriptId}`}>{r.scriptTitle}</a></td>
                    <td className="py-1 pr-2">{r.author}</td>
                    <td className="py-1 pr-2 whitespace-pre-wrap break-words max-w-[40rem]">{r.content}</td>
                    <td className="py-1 text-gray-600">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={4} className="py-2 text-center muted">暂无评论</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}


