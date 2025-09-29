import { headers, cookies } from 'next/headers'

type Item = { id: string; title: string; authorName?: string|null }

async function fetchMyFavorites() {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const res = await fetch(`${base}/api/me/favorites`, { cache: 'no-store', headers: { cookie: cookieHeader } })
  const j = await res.json().catch(()=>({}))
  const items = (j?.data?.items ?? j?.items ?? []) as Item[]
  return { items }
}

export default async function MyFavoritesPage() {
  const { items } = await fetchMyFavorites()
  return (
    <div className="container-page section">
      <h1 className="text-2xl font-semibold">我的收藏</h1>
      <div className="grid-cards">
        {(!items || items.length === 0) && <div className="muted">暂无收藏</div>}
        {items && items.length > 0 && items.map(s => (
          // @ts-expect-error client component wrapper
          <FavCardWrapper key={s.id} id={s.id} title={s.title} authorName={s.authorName} />
        ))}
      </div>
    </div>
  )
}

function FavCardWrapper(props: { id: string; title: string; authorName?: string | null }) {
  const C = require('../FavCard').default as (p: { id: string; title: string; authorName?: string | null }) => JSX.Element
  return <C {...props} />
}


