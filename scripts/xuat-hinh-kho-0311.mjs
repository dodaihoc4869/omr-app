// Chỉ đọc D1/R2; xuất hình và ngữ cảnh công khai để vẽ vector, không xuất đáp án.
import { mkdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const token = process.env.CLOUDFLARE_API_TOKEN?.trim()
const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim()
if (!token || !/^[0-9a-f]{32}$/i.test(account ?? '')) throw Error('Thiếu cấu hình đọc kho')
const root = '/tmp/hinh-kho-0311'
mkdirSync(root + '/anh', { recursive: true })
const api = `https://api.cloudflare.com/client/v4/accounts/${account}`
const headers = { Authorization: `Bearer ${token}` }
async function request(url, options = {}) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(45000) })
    if (r.ok) return r
    if (r.status < 500 || i === 2) throw Error(`Không đọc được nguồn: HTTP ${r.status}`)
  }
}
async function query(sql) {
  const r = await request(`${api}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sql }) })
  const j = await r.json()
  if (!j.success) throw Error('D1 từ chối truy vấn chỉ đọc')
  return j.result.flatMap(x => x.results ?? [])
}
const exams = await query('SELECT ma_de, r2_khoa, so_cau FROM de_kho WHERE COALESCE(da_xoa,0)=0 ORDER BY ma_de')
const assets = new Map(), questions = [], errors = []
let total = 0
async function image(src, refs, where) {
  if (typeof src !== 'string') return
  const match = /^data:(image\/[\w.+-]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(src)
  let bytes, mime, sourceHash
  if (match) { bytes = Buffer.from(match[2], 'base64'); mime = match[1] }
  else {
    const m = /^(?:https:\/\/omr\.ttadodaihoc\.workers\.dev)?\/anh\/([0-9a-f]{64})(?:\.[a-z]+)?$/i.exec(src)
    if (!m) { if (/^(data:image|https?:|\/anh\/)/.test(src)) errors.push({ where, reason: 'Định dạng ảnh cần kiểm tra' }); return }
    sourceHash = m[1]
    const r = await request(`${api}/r2/buckets/omr-de/objects/${encodeURIComponent('anh/' + sourceHash)}`)
    bytes = Buffer.from(await r.arrayBuffer()); mime = r.headers.get('content-type')?.split(';')[0] ?? 'image/png'
  }
  if (!bytes.length) throw Error('Ảnh rỗng')
  const hash = createHash('sha256').update(bytes).digest('hex')
  const ext = mime === 'image/svg+xml' ? 'svg' : mime.split('/')[1]?.replace('jpeg', 'jpg') ?? 'bin'
  const file = `anh/${hash}.${ext}`
  if (!assets.has(hash)) { writeFileSync(root + '/' + file, bytes); assets.set(hash, { hash, file, mime, bytes: bytes.length }) }
  refs.push({ hash, where, hashDataUrl: createHash('sha256').update(src).digest('hex'), ...(sourceHash ? { sourceHash } : {}) })
}
async function scan(v, refs, where) {
  if (typeof v === 'string') {
    if (/^data:image|^(?:https:\/\/omr\.ttadodaihoc\.workers\.dev)?\/anh\//.test(v)) await image(v, refs, where)
    else for (const m of v.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) await image(m[1], refs, where)
  } else if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) await scan(v[i], refs, where + '.' + i)
  } else if (v && typeof v === 'object') {
    for (const [key, value] of Object.entries(v)) {
      if (/^(correct|dap.?an|loi.?giai|answer|solution|dung|vi_sao)/i.test(key)) continue
      await scan(value, refs, where + '.' + key)
    }
  }
}
for (let i = 0; i < exams.length; i += 4) {
  await Promise.all(exams.slice(i, i + 4).map(async exam => {
    try {
      const key = exam.r2_khoa || `kho/${exam.ma_de}.json`
      const r = await request(`${api}/r2/buckets/omr-de/objects/${encodeURIComponent(key)}`)
      const raw = await r.json()
      const list = Array.isArray(raw.cau) ? raw.cau : ['I', 'II', 'III'].flatMap(p => (raw['phan' + p] ?? []).map(c => ({ ...c, phan: p })))
      if (!list.length && exam.so_cau > 0) throw Error('Không nhận dạng được khuôn gói đề')
      for (let n = 0; n < list.length; n++) {
        const c = list[n]; total++
        const qid = String(c.qid ?? c.id ?? `${exam.ma_de}-${c.phan}-${c.so ?? n + 1}`)
        const publicPart = Object.fromEntries(['de', 'text', 'stem', 'pa', 'y', 'options', 'statements', 'hinh', 'hinhAnh', 'thanCauImg', 'imageDataUrl', 'table', 'bang'].filter(k => c[k] != null).map(k => [k, c[k]]))
        const refs = []; await scan(publicPart, refs, qid)
        if (refs.length) {
          // Ngữ cảnh chỉ giữ câu dẫn và phương án dưới dạng chữ; không chép cột chấm/lời giải.
          questions.push({ qid, maDe: exam.ma_de, de: String(c.de ?? c.text ?? c.stem ?? '').replace(/<img\b[^>]*>/gi, '[HÌNH]'), hinh: refs })
        }
      }
    } catch (e) { errors.push({ maDe: exam.ma_de, reason: e.message }) }
  }))
  console.log('Đã đọc đề:', Math.min(i + 4, exams.length), '/', exams.length, '; hình riêng:', assets.size)
}
const report = { luc: new Date().toISOString(), chiDoc: true, soDe: exams.length, soCau: total, soCauCoHinh: questions.length, soAnhRieng: assets.size, errors, assets: [...assets.values()], questions }
writeFileSync(root + '/kiem-ke.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify({ soDe: report.soDe, soCau: total, soCauCoHinh: questions.length, soAnhRieng: assets.size, soLoi: errors.length }))
if (errors.length) process.exitCode = 1
