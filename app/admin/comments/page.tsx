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
    <div className="space-y-6">
      <div className="card">
        <div className="card-body">
          <div className="mb-6">
            <h1 className="text-headline-medium font-semibold text-surface-on">评论管理</h1>
            <p className="text-body-small text-surface-on-variant mt-1">
              查看和管理所有剧本的用户评论
            </p>
          </div>

          {!rows.length && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="text-title-medium font-medium text-surface-on mb-1">
                暂无评论
              </div>
              <div className="text-body-small text-surface-on-variant">
                还没有用户发表评论
              </div>
            </div>
          )}

          {!!rows.length && (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="table-admin">
                <thead>
                  <tr>
                    <th className="px-3 py-3 text-body-small font-medium text-surface-on-variant">剧本</th>
                    <th className="px-3 py-3 text-body-small font-medium text-surface-on-variant">作者</th>
                    <th className="px-3 py-3 text-body-small font-medium text-surface-on-variant">评论内容</th>
                    <th className="px-3 py-3 text-body-small font-medium text-surface-on-variant">发表时间</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => (
                    <tr key={r.id} className="align-top">
                      <td className="px-3 py-3">
                        <a 
                          className="text-body-medium text-primary hover:underline font-medium" 
                          href={`/scripts/${r.scriptId}`}
                        >
                          {r.scriptTitle}
                        </a>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-body-medium text-surface-on font-medium">
                          {r.author}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-body-small text-surface-on whitespace-pre-wrap break-words max-w-md">
                          {r.content}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-body-small text-surface-on-variant whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


