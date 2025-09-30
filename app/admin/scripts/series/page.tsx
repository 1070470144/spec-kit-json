async function fetchSeries() {
  const base = process.env.APP_BASE_URL || ''
  const res = await fetch(`${base}/api/admin/scripts/series`, { cache: 'no-store' })
  const j = await res.json().catch(()=>({}))
  const items = (j?.data?.items ?? j?.items ?? []) as { id: string; title: string; state: string; versions: number; images: number }[]
  return { items }
}

export default async function AdminSeriesPage() { return <div className="container-page section" data-admin><div className="muted">系列功能已下线</div></div> }


