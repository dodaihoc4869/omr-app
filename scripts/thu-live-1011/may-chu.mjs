// MÁY CHỦ THỬ cho bộ thử Live (10/11): chạy ĐÚNG Durable Object của phòng (server/src/phong-binh-phan-ung.ts, đóng gói bằng esbuild) trong Node với
// `ctx` giả (kho nhớ trong bộ nhớ, WebSocket thật của gói `ws`) ⇒ hai trang Chromium (thầy + em) nói chuyện qua phòng THẬT về luật, không đụng máy chủ thật,
// không D1, không dữ liệu học sinh. Cửa /bpu/live/* trả «chưa cấu hình» ⇒ live chạy phần HÌNH qua WebSocket (tiếng cần SFU thật — kiểm trên máy thật).
import { createServer } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { WebSocketServer } from 'ws'

const GOC = resolve(import.meta.dirname, '../..')
const LOAI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }

/** `cuaLive(duong, than, phong)` (tuỳ chọn, 11/11 tối — scripts/thu-live-dot0-1011/phong-that.mjs): trả lời `POST /bpu/live/*` bằng cửa THẬT nối SFU thật thay cho «chưa cấu hình». */
export async function moMayChu({ dist, sfu = true, cuaLive = null, gocPhong = GOC }) {
  const tam = mkdtempSync(join(tmpdir(), 'thu-live-'))
  const ra = join(tam, 'phong.mjs')
  await build({ entryPoints: [join(gocPhong, 'server/src/phong-binh-phan-ung.ts')], bundle: true, platform: 'node', format: 'esm', outfile: ra, logLevel: 'error', nodePaths: [join(GOC, 'node_modules')] })
  // Cặp WebSocket giả của Workers: phần [1] là phía phòng — `send` chuyển sang kết nối thật của trình duyệt.
  class DauPhong {
    that = null; att = null; tag = ''
    send(d) { try { this.that?.send(d, { binary: typeof d !== 'string' }) } catch { /* đã đóng */ } }
    close() { try { this.that?.close() } catch { /* đã đóng */ } }
    serializeAttachment(v) { this.att = JSON.parse(JSON.stringify(v)) }
    deserializeAttachment() { return this.att }
  }
  let capCuoi = null
  globalThis.WebSocketPair = class { constructor() { this[0] = new DauPhong(); this[1] = new DauPhong(); capCuoi = this } }
  const { PhongBinhPhanUng } = await import(pathToFileURL(ra).href)
  const kho = new Map(), dsWs = []
  const ctx = {
    storage: { get: async (k) => kho.get(k), put: async (k, v) => { kho.set(k, JSON.parse(JSON.stringify(v))) }, delete: async (k) => kho.delete(k), setAlarm: async () => {}, getAlarm: async () => null, deleteAlarm: async () => {} },
    acceptWebSocket: (ws, tags) => { ws.tag = tags?.[0] ?? ''; dsWs.push(ws) },
    getWebSockets: (tag) => dsWs.filter((w) => !tag || w.tag === tag),
    waitUntil: () => {},
  }
  const phong = new PhongBinhPhanUng(ctx, { MA_BI_MAT: 'thu' })
  const post = (duong, b) => phong.fetch(new Request(`https://bpu${duong}`, { method: 'POST', body: JSON.stringify(b) })).then((r) => r.json())

  const PUB = join(GOC, 'public')
  const http = createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'), d = decodeURIComponent(u.pathname)
    res.setHeader('access-control-allow-origin', '*'); res.setHeader('access-control-allow-headers', '*')
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
    if (req.method === 'POST') {
      let than = ''
      for await (const c of req) than += c
      let b = {}
      try { b = JSON.parse(than || '{}') } catch { /* bỏ qua */ }
      const tra = (o) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)) }
      if (d.endsWith('/hs/bpu/ve') || d.endsWith('/hs/bpu/cua-em')) return tra({ ok: true, ve: `hs.${String(b.token ?? '').replace(/^tk-/, '') || 'S1'}`, buoiId: 'b1' })
      if (d.startsWith('/bpu/live/')) return tra(cuaLive ? await cuaLive(d, b, phong).catch((e) => ({ ok: false, lyDo: 'cua-thu', loi: String(e?.message ?? e).slice(0, 80) })) : { ok: false, lyDo: 'chua-cau-hinh' })
      return tra({ ok: false })
    }
    const p = join(dist, d), pub = join(PUB, d)
    const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(dist, 'scripts/thu-live-1011/trang.html')
    res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
    res.end(readFileSync(tep))
  })
  const wss = new WebSocketServer({ noServer: true })
  http.on('upgrade', (req, soc, dau) => {
    const u = new URL(req.url, 'http://x'), ve = u.searchParams.get('ve') ?? ''
    if (u.pathname !== '/bpu/phong') { soc.destroy(); return }
    wss.handleUpgrade(req, soc, dau, async (that) => {
      const vai = ve === 'gv' ? 'gv' : 'hs', sbd = ve.startsWith('hs.') ? ve.slice(3) : ''
      await phong.fetch(new Request('https://bpu/bpu/phong', { headers: { upgrade: 'websocket', 'x-bpu-vai': vai, 'x-bpu-sbd': sbd } })).catch(() => {})
      const dau1 = capCuoi[1]
      dau1.that = that
      that.on('message', (data, nhiPhan) => { void phong.webSocketMessage(dau1, nhiPhan ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) : data.toString()).catch((e) => console.error('[phòng] lỗi tin:', e)) })
      that.on('close', () => { const i = dsWs.indexOf(dau1); if (i >= 0) dsWs.splice(i, 1); void phong.webSocketClose(dau1) })
    })
  })
  await new Promise((r) => http.listen(0, '127.0.0.1', r))
  const goc = `http://127.0.0.1:${http.address().port}`
  const EM = [['S1', 'Nguyễn Thị Hà'], ['S2', 'Lê Gia Huy'], ['S3', 'Phạm Khánh Vy'], ['S4', 'Đỗ Hoàng Nam'], ['S5', 'Trần Minh Anh'], ['S6', 'Ngô Gia Bảo'], ['S7', 'Vũ Ngọc Lan'], ['S8', 'Bùi Đức Anh']]
  await post('/khoi', { buoiId: 'b1', lop: '12A1', ds: EM.map(([sbd, ten], i) => ({ sbd, ten, coMat: true, luc: Date.now() + i })), live: { cho: true, sfu } })
  return {
    goc, phong, post,
    /** Mở lượt cho câu (đáp án chỉ ở phòng). */
    moLuot: (cau, dung, hanGiay = null) => post('/luot', { qid: cau.qid, phan: cau.phan, tuLuan: false, cau, dung, hanGiay }),
    /** Cắt kết nối của một em từ phía phòng (thử mất mạng). */
    cat: (sbd) => { for (const w of dsWs) if (w.att?.s === sbd) w.that?.terminate() },
    trangThai: () => kho.get('st'),
    dong: () => new Promise((r) => { for (const w of dsWs) w.that?.terminate(); wss.close(); http.close(() => r()) }),
  }
}
