'use client'
import { useEffect, useState } from 'react'

type Item = { rank: number; scriptId: string; title: string; author: string | null; downloads: number; cover?: string }

export default function RankPage() {
  const [range, setRange] = useState<'7d'|'30d'|'all'>('7d')
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [total, setTotal] = useState(0)
  const [view, setView] = useState<'table'|'cards'>('table')

  async function load(r: '7d'|'30d'|'all', p = page) {
    setLoading(true)
    try {
      const res = await fetch(`/api/rankings?range=${r}&page=${p}&pageSize=${pageSize}`)
      const j = await res.json().catch(()=>({}))
      const d = j?.data || j
      setItems(d?.items || [])
      setTotal(d?.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(range, page) }, [range, page])

  return (
    <div className="container-page section">
      <h1 className="text-2xl font-semibold">排行榜</h1>
      <div className="flex items-center gap-2">
        <button className={`btn ${range==='7d' ? 'btn-primary' : 'btn-outline'}`} onClick={()=>setRange('7d')}>近7天</button>
        <button className={`btn ${range==='30d' ? 'btn-primary' : 'btn-outline'}`} onClick={()=>setRange('30d')}>近30天</button>
        <button className={`btn ${range==='all' ? 'btn-primary' : 'btn-outline'}`} onClick={()=>setRange('all')}>全部</button>
        <span className="ml-auto" />
        <button className={`btn ${view==='table' ? 'btn-primary' : 'btn-outline'}`} onClick={()=>setView('table')}>表格</button>
        <button className={`btn ${view==='cards' ? 'btn-primary' : 'btn-outline'}`} onClick={()=>setView('cards')}>卡片</button>
      </div>

      <div className="card">
        <div className="card-body">
          {loading && <div className="muted">加载中…</div>}
          {!loading && items.length === 0 && <div className="muted">暂无数据</div>}
          {!loading && items.length > 0 && view==='table' && (
            <div className="overflow-x-auto">
              <table className="table-admin">
                <thead>
                  <tr>
                    <th className="px-2 py-2">排名</th>
                    <th className="px-2 py-2">封面</th>
                    <th className="px-2 py-2">标题</th>
                    <th className="px-2 py-2">作者</th>
                    <th className="px-2 py-2">下载量</th>
                    <th className="px-2 py-2">查看</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.scriptId} className="border-t">
                      <td className="px-2 py-2">{it.rank}</td>
                      <td className="px-2 py-2">{it.cover ? <img src={it.cover} alt="cover" className="w-12 h-9 object-cover rounded border" /> : '-'}</td>
                      <td className="px-2 py-2">{it.title}</td>
                      <td className="px-2 py-2">{it.author || '-'}</td>
                      <td className="px-2 py-2">{it.downloads}</td>
                      <td className="px-2 py-2"><a className="btn btn-outline" href={`/scripts/${it.scriptId}`}>查看</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && items.length > 0 && view==='cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(it => (
                <div key={it.scriptId} className="card">
                  <div className="card-body">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs rounded bg-blue-600 text-white">{it.rank}</span>
                      <div className="font-medium">{it.title}</div>
                    </div>
                    <div className="muted">{it.author || '-'}</div>
                    {it.cover && <img src={it.cover} alt="cover" className="mt-2 w-full h-32 object-cover rounded border" />}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="muted">下载：{it.downloads}</span>
                      <a className="btn btn-outline" href={`/scripts/${it.scriptId}`}>查看</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && total > pageSize && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button className="btn btn-outline" disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>上一页</button>
              <span className="muted">第 {page} 页 / 共 {Math.ceil(total/pageSize)} 页</span>
              <button className="btn btn-outline" disabled={page>=Math.ceil(total/pageSize)} onClick={()=>setPage(p=>p+1)}>下一页</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


