async function fetchList() {
  const res = await fetch('http://localhost:3000/api/scripts', { cache: 'no-store' })
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
            {/* 缩略图整体展示 */}
            {/* @ts-expect-error Server Component boundary */}
            <ClientThumbsWrapper id={i.id} />
            <div className="card-body">
              <div className="card-title">{i.title}</div>
              {/* 信息面板 */}
              {/* @ts-expect-error Server Component boundary */}
              <ClientMetaWrapper id={i.id} />
              <a className="btn btn-outline mt-3" href={`/scripts/${i.id}`}>查看详情</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 轻量包装以在服务端组件中插入客户端组件
function ClientThumbsWrapper({ id }: { id: string }) {
  const Thumbs = require('./ScriptImagesThumbnails').default as (p: { id: string }) => JSX.Element
  return <Thumbs id={id} />
}

function ClientMetaWrapper({ id }: { id: string }) {
  const Panel = require('./ScriptMetaPanel').default as (p: { id: string }) => JSX.Element
  return <Panel id={id} />
}
