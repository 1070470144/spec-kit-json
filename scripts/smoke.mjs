const base = process.env.BASE_URL || 'http://localhost:3000'

async function json(res) { if (!res.ok) throw new Error(`${res.status} ${await res.text()}`); return res.json() }

async function main() {
  const created = await json(await fetch(`${base}/api/scripts`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'smoke-demo', json: { name: 'demo' } })
  }))
  const id = created.data?.id || created.id
  await json(await fetch(`${base}/api/scripts/${id}/submit`, { method: 'POST' }))
  await json(await fetch(`${base}/api/scripts/${id}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision: 'approved', reason: 'ok' }) }))
  await json(await fetch(`${base}/api/scripts/${id}`))
  await json(await fetch(`${base}/api/scripts/${id}/download`))
  console.log('SMOKE OK', id)
}

main().catch((e) => { console.error('SMOKE FAILED', e); process.exit(1) })
