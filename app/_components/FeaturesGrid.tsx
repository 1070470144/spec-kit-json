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
    <section className="py-12">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-surface-on mb-4">
          核心功能
        </h2>
        <p className="text-lg text-surface-on-variant max-w-2xl mx-auto">
          为您提供完整的剧本管理和分享解决方案
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
          >
            {/* 渐变光泽 */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-sky-500/5 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* 顶部装饰条 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500"></div>
            
            {/* 内容 */}
            <div className="relative p-8 md:p-10">
              {/* 图标背景 */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500/10 to-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                {feature.icon}
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-surface-on group-hover:text-sky-600 transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="text-body-medium text-surface-on-variant leading-relaxed">
                {feature.description}
              </p>
              
              {/* 箭头指示 */}
              <div className="mt-6 flex items-center gap-2 text-sky-600 font-medium group-hover:gap-4 transition-all duration-300">
                <span>了解更多</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
            
            {/* 悬浮边框效果 */}
            <div className="absolute inset-0 border-2 border-sky-500/0 group-hover:border-sky-500/20 rounded-2xl transition-all duration-500"></div>
          </Link>
        ))}
      </div>
    </section>
  )
}
