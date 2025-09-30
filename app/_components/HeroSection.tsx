import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden -mx-6 -mt-6 w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
        {/* 网格背景 */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>
      
      {/* 光晕效果 */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/30 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/30 rounded-full blur-[150px]"></div>
      
      {/* 内容 */}
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white mb-8 tracking-tight">
          血染钟楼
          <span className="block mt-4 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-400">
            剧本资源平台
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          汇聚全球优质剧本，为玩家和说书人提供便捷的资源分享平台
          <span className="block mt-2">探索热门剧本，上传你的创作，加入推理之旅</span>
        </p>
        
        {/* 醒目CTA */}
        <div className="flex gap-6 justify-center flex-wrap">
          <Link 
            href="/scripts" 
            className="group relative inline-flex items-center gap-3 px-12 py-6 text-lg font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-600 rounded-full shadow-2xl hover:shadow-sky-500/50 transition-all duration-300 hover:scale-105"
          >
            <span>探索剧本</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          
          <Link 
            href="/upload" 
            className="inline-flex items-center gap-3 px-12 py-6 text-lg font-semibold text-white border-2 border-white/30 rounded-full backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>上传剧本</span>
          </Link>
        </div>
        
        {/* 特性标签 */}
        <div className="mt-16 flex gap-6 justify-center flex-wrap">
          <div className="group flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 backdrop-blur-sm hover:from-emerald-500/30 hover:to-teal-500/30 hover:border-emerald-400/50 transition-all duration-300">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-white font-semibold">完全免费</span>
          </div>
          <div className="group flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-sky-500/20 to-cyan-500/20 border border-sky-400/30 backdrop-blur-sm hover:from-sky-500/30 hover:to-cyan-500/30 hover:border-sky-400/50 transition-all duration-300">
            <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-white font-semibold">JSON 格式</span>
          </div>
          <div className="group flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-600/20 border border-blue-400/30 backdrop-blur-sm hover:from-blue-500/30 hover:to-cyan-600/30 hover:border-blue-400/50 transition-all duration-300">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-white font-semibold">社区驱动</span>
          </div>
        </div>
      </div>
      
      {/* 底部渐变遮罩 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#f8fafc] to-transparent"></div>
    </section>
  )
}
