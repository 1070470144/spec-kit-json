'use client'
import { useEffect, useState } from 'react'

export default function SensitiveWordsPage() {
  const [words, setWords] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [msg, setMsg] = useState('')

  async function load() {
    const res = await fetch('/api/admin/settings/sensitive-words', { cache: 'no-store' })
    const j = await res.json().catch(()=>({}))
    setWords(j?.data?.words || j?.words || [])
  }
  useEffect(() => { load() }, [])

  function addWord() {
    const w = input.trim()
    if (!w) return
    if (words.includes(w)) return
    setWords(prev => [...prev, w])
    setInput('')
  }
  function remove(word: string) { setWords(prev => prev.filter(w => w !== word)) }

  async function save() {
    setMsg('')
    const res = await fetch('/api/admin/settings/sensitive-words', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ words }) })
    const j = await res.json().catch(()=>({}))
    if (!res.ok) { setMsg(j?.error?.message || '保存失败'); return }
    setMsg('已保存')
  }

  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-body">
          <div className="card-title">敏感词设置</div>
          <div className="flex gap-2 items-center">
            <input className="input w-64" placeholder="输入敏感词" value={input} onChange={e=>setInput(e.target.value)} />
            <button className="btn btn-outline" onClick={addWord}>添加</button>
            <button className="btn btn-primary" onClick={save}>保存</button>
            {msg && <div className="muted">{msg}</div>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {words.map(w => (
              <span key={w} className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-sm">
                {w}
                <button className="text-gray-500 hover:text-gray-800" onClick={()=>remove(w)}>×</button>
              </span>
            ))}
            {!words.length && <div className="muted">暂无敏感词</div>}
          </div>
        </div>
      </div>
    </div>
  )
}


