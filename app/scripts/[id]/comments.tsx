'use client'
import { useEffect, useState } from 'react'

type C = { id: string; content: string; createdAt: string; author: string; authorId?: string }

type Me = { id: string } | null

export default function Comments({ id }: { id: string }) {
  const [content, setContent] = useState('')
  const [items, setItems] = useState<C[]>([])
  const [msg, setMsg] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [me, setMe] = useState<Me>(null)

  async function load(reset = false) {
    const res = await fetch(`/api/scripts/${id}/comments?page=${reset?1:page}&pageSize=10`, { cache: 'no-store' })
    const j = await res.json().catch(()=>({}))
    const list = j?.data?.items || j?.items || []
    const t = j?.data?.total ?? j?.total ?? 0
    if (reset) setItems(list)
    else setItems(prev => [...prev, ...list])
    setTotal(Number(t) || 0)
  }
  useEffect(() => { load(true) }, [id])
  useEffect(() => { if (page>1) load(false) }, [page])

  useEffect(() => {
    let aborted = false
    async function getMe() {
      try { const r = await fetch('/api/me', { cache: 'no-store' }); const jj = await r.json().catch(()=>({})); if (!aborted) setMe(jj?.data || null) } catch {}
    }
    getMe(); return () => { aborted = true }
  }, [])

  async function submit() {
    setMsg('')
    if (!content.trim()) { setMsg('请输入评论内容'); return }
    const res = await fetch(`/api/scripts/${id}/comments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }) })
    const j = await res.json().catch(()=>({}))
    if (!res.ok) { setMsg(j?.error?.message || '提交失败，请先登录'); return }
    setContent('')
    setPage(1)
    await load(true)
  }

  async function remove(commentId: string) {
    if (!confirm('确定删除该评论吗？')) return
    const res = await fetch(`/api/scripts/${id}/comments?commentId=${encodeURIComponent(commentId)}`, { method: 'DELETE' })
    const j = await res.json().catch(()=>({}))
    if (!res.ok) { setMsg(j?.error?.message || '删除失败'); return }
    setItems(prev => prev.filter(i => i.id !== commentId))
    setTotal(t => Math.max(0, t-1))
  }

  const canDelete = (c: C) => !!me && (me.id === c.authorId)

  return (
    <div className="card">
      <div className="card-body">
        <div className="card-title">评论</div>
        <div className="space-y-2">
          <textarea className="textarea h-24" placeholder="写下你的看法..." value={content} onChange={e=>setContent(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={submit}>发表</button>
            {msg && <div className="help-error self-center">{msg}</div>}
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {items.map(i => (
            <div key={i.id} className="border rounded-lg p-3 bg-white">
              <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">{i.content}</div>
              <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                <span>{i.author} · {new Date(i.createdAt).toLocaleString()}</span>
                {canDelete(i) && (
                  <button className="btn btn-outline px-2 py-1 text-xs" onClick={()=>remove(i.id)}>删除</button>
                )}
              </div>
            </div>
          ))}
          {!items.length && <div className="muted">还没有评论，快来抢沙发～</div>}
          {items.length < total && (
            <div className="text-center">
              <button className="btn btn-outline" onClick={()=>setPage(p=>p+1)}>加载更多</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


