'use client'

export default function StateBadge({ state }: { state?: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: '待审核', className: 'bg-yellow-100 text-yellow-800' },
    published: { label: '已通过', className: 'bg-green-100 text-green-800' },
    rejected: { label: '已拒绝', className: 'bg-red-100 text-red-800' },
    abandoned: { label: '已废弃', className: 'bg-gray-100 text-gray-800' },
  }
  
  const { label, className } = config[state as string] || config.pending
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

