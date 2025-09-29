import { getSession } from '@/src/auth/session'
import { prisma } from '@/src/db/client'

type Item = { id: string; title: string; authorName?: string|null }

export default async function MyFavoritesPage() {
  const s = await getSession()
  const items = s ? (await prisma.favorite.findMany({
    where: { userId: s.userId }, orderBy: { createdAt: 'desc' }, select: { script: { select: { id: true, title: true, authorName: true } } }
  })).map(i => i.script as unknown as Item) : []
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


