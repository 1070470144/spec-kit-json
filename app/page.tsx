import HotCarousel from './_components/HotCarousel'

async function fetchHot() {
  try {
    const res = await fetch('http://localhost:3000/api/rankings?range=7d&pageSize=5', { cache: 'no-store' })
    const j = await res.json()
    const items = (j?.data?.items ?? j?.items ?? []) as { scriptId:string; title:string; downloads:number; cover?:string }[]
    return items
  } catch { return [] }
}

export default async function HomePage() {
  const hot = await fetchHot()
  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-body">
          <h1 className="card-title">血染钟楼资源平台</h1>
          <p className="muted">集中收集与索引剧本 JSON 与图片的门户。</p>
        </div>
      </div>
      {!!hot.length && <HotCarousel items={hot} />}
    </div>
  );
}
