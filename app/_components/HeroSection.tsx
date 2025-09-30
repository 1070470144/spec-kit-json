import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="m3-hero text-center">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-display-small md:text-display-large mb-4 text-surface-on">
          血染钟楼资源平台
        </h1>
        <p className="text-body-medium md:text-body-large text-surface-on-variant mb-8 max-w-2xl mx-auto px-4">
          集中收集与索引血染钟楼剧本 JSON 与图片，为玩家和说书人提供便捷的资源分享平台。
          探索热门剧本，上传你的创作，加入社区排行榜。
        </p>
        <div className="flex gap-4 justify-center flex-wrap px-4">
          <Link href="/scripts" className="m3-btn-filled">
            浏览剧本
          </Link>
          <Link 
            href="/upload" 
            className="inline-flex items-center justify-center rounded-sm px-6 py-3 text-label-large bg-surface border border-outline text-surface-on hover:bg-surface-variant transition-all duration-standard focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            上传剧本
          </Link>
        </div>
      </div>
    </section>
  )
}
