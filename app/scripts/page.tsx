async function fetchList() {
  const res = await fetch('http://localhost:3000/api/scripts?state=published', { cache: 'no-store' })
  const j = await res.json()
  const items = (j?.data?.items ?? j?.items ?? []) as { id: string; title: string }[]
  return { items }
}

export default async function ScriptsPage() {
  const { items } = await fetchList()
  return (
    <div className="container-page section">
      <h1 className="text-2xl font-semibold">剧本列表</h1>
      <div className="grid-cards">
        {items.map(i => (
          <div key={i.id} className="card">
            {/* 缩略图轮播 */}
            {/* @ts-expect-error Server Component boundary */}
            <ClientCarouselWrapper id={i.id} />
            <div className="card-body">
              <div className="card-title">{i.title}</div>
              <a className="btn btn-outline mt-3" href={`/scripts/${i.id}`}>查看详情</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 轻量包装以在服务端组件中插入客户端组件
function ClientCarouselWrapper({ id }: { id: string }) {
  const Carousel = require('./ScriptImagesCarousel').default as (p: { id: string }) => JSX.Element
  return <Carousel id={id} />
}
