'use client'
import dynamic from 'next/dynamic'

const AdminScriptsList = dynamic(() => import('./AdminScriptsList'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="card">
        <div className="card-body p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-headline-medium font-semibold text-surface-on">剧本列表</h1>
              <p className="text-xs sm:text-sm text-surface-on-variant mt-1">加载中...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default function AdminScriptsManagePage() {
  return <AdminScriptsList />
}
