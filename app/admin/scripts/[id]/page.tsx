import { headers } from 'next/headers'
import AdminScriptEditor from '../../_components/AdminScriptEditor'

async function fetchScript(id: string) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const res = await fetch(`${base}/api/scripts/${id}`, { cache: 'no-store' })
  const j = await res.json().catch(()=>({}))
  return { data: j?.data || j }
}

export default async function AdminScriptDetailPage({ params }: { params: { id: string } }) {
  const { data } = await fetchScript(params.id)
  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-body">
          <div className="card-title">编辑剧本</div>
          <AdminScriptEditor id={params.id} />
        </div>
      </div>
    </div>
  )
}
