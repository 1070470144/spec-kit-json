import { getSession } from '@/src/auth/session'
import { prisma } from '@/src/db/client'

type Item = { id: string; title: string; authorName?: string|null }

export default async function MyFavoritesPage() {
  const s = await getSession()
  const items = s ? (await prisma.favorite.findMany({
    where: { userId: s.userId }, 
    orderBy: { createdAt: 'desc' }, 
    select: { 
      script: { 
        select: { 
          id: true, 
          title: true, 
          authorName: true,
          images: { 
            select: { path: true, isCover: true }, 
            take: 3, 
            orderBy: { sortOrder: 'asc' } 
          }
        } 
      } 
    }
  })).map(i => i.script as unknown as Item) : []
  return (
    <div className="container-page section space-y-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-surface-on mb-4">我的收藏</h1>
        <p className="text-lg text-surface-on-variant max-w-2xl mx-auto">
          您收藏的精选剧本，随时回顾和分享
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(!items || items.length === 0) && (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="text-title-medium font-medium text-surface-on mb-1">
              还没有收藏剧本
            </div>
            <div className="text-body-small text-surface-on-variant mb-4">
              浏览剧本列表，点击收藏按钮添加您喜欢的剧本
            </div>
            <a className="m3-btn-filled inline-flex items-center gap-2" href="/scripts">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              浏览剧本
            </a>
          </div>
        )}
        {items && items.length > 0 && items.map(s => (
          <div key={s.id} className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            {/* 顶部装饰条 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500"></div>
            
            {/* 收藏角标 */}
            <div className="absolute top-4 right-4 z-10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {/* 缩略图轮播 */}
            <ClientCarouselWrapper id={s.id} />
            
            {/* 卡片内容 */}
            <FavCardWrapper id={s.id} title={s.title} authorName={s.authorName} />
            
            {/* 悬浮边框效果 */}
            <div className="absolute inset-0 border-2 border-sky-500/0 group-hover:border-sky-500/20 rounded-2xl transition-all duration-500 pointer-events-none"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FavCardWrapper(props: { id: string; title: string; authorName?: string | null }) {
  const C = require('../FavCard').default as (p: { id: string; title: string; authorName?: string | null }) => JSX.Element
  return <C {...props} />
}

// 复用剧本图片轮播
function ClientCarouselWrapper({ id }: { id: string }) {
  const Carousel = require('../../scripts/ScriptImagesCarousel').default as (p: { id: string }) => JSX.Element
  return <Carousel id={id} />
}


