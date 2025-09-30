import Link from 'next/link'

const features = [
  {
    title: '上传剧本',
    description: '分享你的原创剧本 JSON 和精美图片，让更多玩家体验你的创作',
    href: '/upload',
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    )
  },
  {
    title: '浏览剧本',
    description: '探索丰富的剧本库，查看详细信息、多图展示和 JSON 数据',
    href: '/scripts',
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  {
    title: '排行榜',
    description: '查看热门剧本和活跃创作者，发现社区精选内容',
    href: '/leaderboard',
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  }
]

export default function FeaturesGrid() {
  return (
    <section className="py-8">
      <h2 className="text-headline-small text-center mb-8 text-surface-on">
        核心功能
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="m3-card-outlined group block"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 p-3 rounded-full bg-primary-container">
                {feature.icon}
              </div>
              <h3 className="text-title-medium mb-2 text-surface-on">
                {feature.title}
              </h3>
              <p className="text-body-medium text-surface-on-variant">
                {feature.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
