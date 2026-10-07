// Worker dùng một lần, cùng mã giao đang phát hành và binding D1/R2; xoá sau job.
import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import type { CapGiao } from './chua-giao-danh-sach'

export async function taoGiaoGanD1() {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID!, token = process.env.CLOUDFLARE_API_TOKEN!
  const run = process.env.GITHUB_RUN_ID, attempt = process.env.GITHUB_RUN_ATTEMPT
  if (!/^\d+$/.test(run ?? '') || !/^\d+$/.test(attempt ?? '')) throw new Error('Chỉ chạy trong job vận hành.')
  const name = `chua-giao-${run}-${attempt}`, dir = mkdtempSync(join(tmpdir(), 'chua-giao-'))
  const key = randomBytes(32).toString('hex')
  console.log(`::add-mask::${key}`)
  const config = join(dir, 'wrangler.json'), secret = join(dir, 'secret.json')
  writeFileSync(secret, JSON.stringify({ CHUA_KEY: key }), { mode: 0o600 })
  writeFileSync(config, JSON.stringify({
    name, main: resolve('scripts/chua-giao-worker.ts'), compatibility_date: '2026-09-11',
    workers_dev: true, preview_urls: false, placement: { mode: 'smart' },
    vars: { CHUA_HAN: String(Date.now() + 90 * 60000) },
    d1_databases: [{ binding: 'DB', database_name: 'omr', database_id: 'd2e6d322-374a-45d7-83a3-9fac486b23f1' }],
    r2_buckets: [{ binding: 'DE', bucket_name: 'omr-de' }],
    observability: { enabled: false },
  }), { mode: 0o600 })
  async function cf(path: string, method = 'GET') {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/${path}`, { method, headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000) })
    const j = await r.json()
    if (!r.ok || !j.success) throw new Error('Không hoàn tất Worker vận hành tạm.')
    return j.result
  }
  let created = false
  async function close() {
    try { if (created) await cf(`workers/scripts/${name}`, 'DELETE') }
    finally { rmSync(dir, { recursive: true, force: true }) }
  }
  try {
    // Không được đè một Worker đã tồn tại, kể cả còn từ một lượt chạy cũ.
    const workers = await cf('workers/scripts')
    if (workers.some((w: { id: string }) => w.id === name)) throw new Error('Worker vận hành đã tồn tại.')
    // Nếu upload thành công nhưng bước bật workers.dev lỗi, vẫn phải dọn đúng tên.
    created = true
    execFileSync('npx', ['wrangler', 'deploy', '--config', config, '--secrets-file', secret], { timeout: 180000, maxBuffer: 4 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
    const { subdomain } = await cf('workers/subdomain')
    if (!/^[a-z0-9-]+$/.test(subdomain)) throw new Error('Tên miền Worker chưa hợp lệ.')
    const url = `https://${name}.${subdomain}.workers.dev/giao`
    // Không token phải bị chặn trước mọi truy vấn D1.
    let locked = false
    for (let i = 0; i < 30; i++) {
      try {
        const anon = await fetch(url, { method: 'POST', body: '{}', signal: AbortSignal.timeout(10000) })
        if (anon.status === 401) { locked = true; break }
        if (anon.status !== 404 && anon.status < 500) throw new Error('CONG_KHONG_KHOA')
      } catch (e) { if (e instanceof Error && e.message === 'CONG_KHONG_KHOA') throw e }
      if (i < 29) await new Promise(r => setTimeout(r, 2000))
    }
    if (!locked) throw new Error('Cổng vận hành chưa khoá.')
    console.log('Worker giao tạm đã khoá; cùng luật máy chủ, một cặp đã chọn/yêu cầu.')
    return {
      close,
      async goi(cap: CapGiao): Promise<{ ok: true; soCap: number }> {
        for (let i = 0; i < 4; i++) {
          try {
            const r = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify(cap), signal: AbortSignal.timeout(60000) })
            // Ca thi mở/cờ tắt: dừng, không tự bật lại và không retry như lỗi mạng.
            if (r.status === 409 || r.status === 401) throw new Error('DUNG_VAN_HANH')
            const j = await r.json()
            if (r.ok && j.ok) return j
          } catch (e) { if (e instanceof Error && e.message === 'DUNG_VAN_HANH') throw e }
          if (i < 3) await new Promise(r => setTimeout(r, (i + 1) * 1000))
        }
        throw new Error('Chưa hoàn tất cặp; giữ checkpoint.')
      },
    }
  } catch { await close(); throw new Error('Chưa dựng được công cụ giao gần D1.') }
}
