#!/usr/bin/env node
// PHÉP THỬ «TIẾNG THẬT» CỦA LIVE (11/11 — thầy báo câm cả hai chiều trên bản sống dù mọi bộ thử cũ đều xanh). Khác bộ thử cũ (thu-live-dot0-1011.mjs):
//  · chạy trên BẢN DỰNG THẬT (`vite build` ⇒ dist/: service worker, mảnh mã đã băm tên, Worker từ Blob, wasm tách tệp, public/loc-on/*) phục vụ bằng máy chủ
//    tĩnh MÔ PHỎNG PAGES (tệp có ⇒ đúng MIME; không có ⇒ index.html 200; áp public/_headers) + cửa `/bpu/live/*` của Worker chạy trong Node, nối SFU THẬT;
//  · trang thầy / em là CHÍNH APP (`/` và `/hs`, đã được service worker điều khiển), thư viện live nạp từ ĐÚNG mảnh mã của bản dựng, gọi đúng như
//    src/components/live/thay-noi.ts (lọc 'tu', lọc ồn theo `--loc-on`, chuỗi làm rõ tiếng bật, chọn mic đích danh như thầy chọn BOYALINK) và LopLive.tsx
//    (nghe theo phòng, lần chạm đầu mở khoá tiếng, em được gọi ⇒ tự bật mic mỗi 1,5 giây tới khi được);
//  · mic giả từ tệp WAV GIỌNG NGƯỜI (một hoặc hai kênh), kiểm TỪNG CHIỀU theo tầng:
//      0 mic vào có giọng · 1 phía gửi: bộ gửi có byte + `media-source` có năng lượng + tiếng đang gửi VẪN LÀ GIỌNG (tương quan đường bao với mẫu)
//      2 phía nhận: `inbound-rtp` có gói + năng lượng · 3 PHẦN TỬ PHÁT: <audio> không dừng, không tắt tiếng, âm lượng > 0, currentTime chạy, tiếng nó cầm vẫn là giọng.
//  · bốn pha đúng kịch bản thầy: P0 live chưa gọi ai · P1 gọi em S1 lên bảng (mic tự bật, «Phát tiếng em ra loa lớp» mặc định) · P2 thầy bật «Phát tiếng em
//    ra loa lớp» (datNgheEm) · P3 thu mic em.
// Chỉ in SỐ ĐO + đạt / không — KHÔNG in khoá, vé, mã phiên SFU. Không đụng Worker sống / D1: mọi yêu cầu ra ngoài máy chủ tĩnh bị chặn.
//  · P4 «chuỗi hỏng»: dừng Worker của chuỗi làm rõ tiếng + treo mọi AudioContext của app ⇒ lưới an toàn phía gửi phải tự đổi về mic thô;
//  · `--cham=0` (đi cùng `--tu-phat=0`): KHÔNG chạm trang nào lúc đầu ⇒ trình duyệt chặn tự phát; đo cảnh «kẹt» rồi chạm từng trang ⇒ phải có tiếng
//    (lưới an toàn phía nghe + «Chạm để nghe»). Trang chưa chạm thì bộ đo của kịch bản (AudioContext) chưa chạy ⇒ tầng 0 / tương quan bỏ qua, chỉ kiểm số đo.
//   node scripts/thu-live-dot0-1011/tieng-that.mjs --dist=dist --nhan=HEAD --wav=/abs/giong-2.wav [--loc-on=manh] [--tu-phat=1] [--cham=1] [--xa=0] [--mic=chon] [--giay=4]
import { createServer } from 'node:http'
import { mkdtempSync, readFileSync, existsSync, statSync, readdirSync, appendFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { randomBytes } from 'node:crypto'
import { build } from 'esbuild'
import { chromium } from 'playwright'
import { docWav, doiHz, duongBao, tuongQuan } from './giong.mjs'

const ts = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, ...v]) => [k, v.length ? v.join('=') : '1']))
const DIST = resolve(ts.dist ?? 'dist'), NHAN = ts.nhan ?? 'dist', WAV = resolve(ts.wav ?? ''), LOC_ON = ts['loc-on'] ?? 'manh'
const TU_PHAT = ts['tu-phat'] !== '0', CHAM = ts.cham !== '0', XA = ts.xa === '1', MIC = ts.mic ?? 'chon', GIAY = Math.max(2, Number(ts.giay) || 4)
const sach = (v) => String(v ?? '').replace(/[\r\n]/g, '').trim().replace(/^["']|["']$/g, '')
const APP_ID = sach(process.env.REALTIME_APP_ID), APP_SECRET = sach(process.env.REALTIME_APP_SECRET), CO_SFU = !!APP_ID && !!APP_SECRET
if (process.env.GITHUB_ACTIONS) { for (const v of [APP_ID, APP_SECRET]) if (v) console.log(`::add-mask::${v}`) }
if (!existsSync(WAV)) { console.log(`KHÔNG ĐẠT · thiếu tệp giọng --wav (${WAV})`); process.exit(1) }

// ── Mẫu giọng: đường bao để so ──
const mauWav = docWav(readFileSync(WAV))
const mauMono = doiHz(mauWav.kenh[0], mauWav.hz)
const KENH_MIC = mauWav.kenh.length

// ── Bản dựng: tìm mảnh mã chứa thư viện live (tên băm + tên xuất bị rút gọn khác nhau giữa các bản) ──
const ASSETS = join(DIST, 'assets')
const cacJs = readdirSync(ASSETS).filter((f) => f.endsWith('.js'))
const coXuat = (src, ten) => new RegExp(`export\\s*\\{[^}]*\\b${ten}\\b[^}]*\\}`).test(src)
let manhThay = null, manhEm = null
for (const f of cacJs) {
  const s = readFileSync(join(ASSETS, f), 'utf8')
  if (!s.includes('batMicLenBang') && !s.includes('taoLiveThay')) continue
  if (!manhThay && coXuat(s, 'taoLiveThay')) manhThay = f
  if (s.includes('batMicLenBang:') && /export\s*\{/.test(s) && (!manhEm || coXuat(s, 'taoLiveThay'))) manhEm = f
}
if (!manhThay || !manhEm) { console.log(`KHÔNG ĐẠT · không tìm thấy mảnh thư viện live trong ${ASSETS} (thầy: ${manhThay}, em: ${manhEm})`); process.exit(1) }
if (!existsSync(join(DIST, 'sw.js'))) console.log('Cảnh báo: bản dựng không có sw.js')

// ── Cửa /bpu/live/* (mã Worker của nhánh đang chạy phép thử) ──
const tam = mkdtempSync(join(tmpdir(), 'tieng-that-'))
await build({ entryPoints: [join(import.meta.dirname, 'may-chu.ts')], bundle: true, platform: 'node', format: 'esm', target: 'node22', outfile: join(tam, 'may-chu.mjs'), logLevel: 'warning' })
const { cuaLive, kyVeBpu } = await import(pathToFileURL(join(tam, 'may-chu.mjs')).href)
const BI_MAT = randomBytes(24).toString('hex')
const phongMic = { goi: 'S1', bat: null }
const PHONG_GIA = { idFromName: () => ({}), get: () => ({ fetch: async (req) => { const b = await req.json(); const ok = b.sbd === phongMic.goi; if (ok && b.buoc === 'bat') phongMic.bat = { id: b.id, tieng: b.tieng }; return new Response(JSON.stringify({ ok })) } }) }
const env = { MA_BI_MAT: BI_MAT, PHONG_BPU: PHONG_GIA, ...(CO_SFU ? { REALTIME_APP_ID: APP_ID, REALTIME_APP_SECRET: APP_SECRET } : {}) }
const demCua = {}

// ── Máy chủ tĩnh mô phỏng Cloudflare Pages ──
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.webm': 'video/webm', '.bin': 'application/octet-stream', '.mobileconfig': 'application/x-apple-aspen-config', '.xml': 'application/xml' }
const luatHeaders = []
try {
  let cur = null
  for (const dong of readFileSync(join(DIST, '_headers'), 'utf8').split(/\r?\n/)) {
    if (!dong.trim() || dong.trim().startsWith('#')) continue
    if (!/^\s/.test(dong)) { cur = { re: new RegExp('^' + dong.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/:[A-Za-z]+/g, '[^/]+') + '$'), h: [] }; luatHeaders.push(cur); continue }
    const m = dong.trim().match(/^([^:]+):\s*(.*)$/)
    if (m && cur) cur.h.push([m[1].trim().toLowerCase(), m[2].trim()])
  }
} catch { /* bản dựng không có _headers */ }
const mayChu = createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x')
    if (req.method === 'POST' && u.pathname.startsWith('/bpu/live/')) {
      const khuc = []
      for await (const k of req) khuc.push(k)
      const r = await cuaLive(new Request(`http://x${u.pathname}`, { method: 'POST', body: Buffer.concat(khuc) }), env)
      const chu = await r.text()
      const lenh = u.pathname.slice('/bpu/live/'.length), ok = (() => { try { const j = JSON.parse(chu); return j.ok ? 'ok' : `${j.lyDo}${j.buoc ? ':' + j.buoc : ''}${j.http ? ':' + j.http : ''}` } catch { return 'hong' } })()
      demCua[`${lenh} ${ok}`] = (demCua[`${lenh} ${ok}`] ?? 0) + 1
      res.writeHead(200, { 'content-type': 'application/json' }); res.end(chu); return
    }
    let p = decodeURIComponent(u.pathname)
    if (p.includes('..')) { res.writeHead(400); res.end(); return }
    let tep = join(DIST, p)
    if (existsSync(tep) && statSync(tep).isDirectory()) tep = join(tep, 'index.html')
    if (!existsSync(tep) && existsSync(tep + '.html')) tep += '.html' // «pretty URL» của Pages
    let ma = 200
    if (!existsSync(tep) || !statSync(tep).isFile()) { tep = join(DIST, 'index.html'); p = '/index.html' } // `_redirects`: /* /index.html 200
    const h = { 'content-type': MIME[extname(tep).toLowerCase()] ?? 'application/octet-stream' }
    for (const l of luatHeaders) if (l.re.test(u.pathname)) for (const [k, v] of l.h) h[k] = v
    res.writeHead(ma, h); res.end(readFileSync(tep))
  } catch (e) { res.writeHead(500); res.end(String(e?.message ?? e)) }
})
await new Promise((xong) => mayChu.listen(0, '127.0.0.1', xong))
const GOC = `http://127.0.0.1:${mayChu.address().port}`
const ve = (v, s) => kyVeBpu(BI_MAT, { b: 'thu-tieng-that', s, v, h: Date.now() + 3_600_000 })

// ── Móc trong trang (chạy trước mã app): ghi mọi PeerConnection, track nhận, thẻ <audio>, luồng mic; hàm đo ──
function moc() {
  if (window.__moc) return
  window.__moc = true
  window.__pcs = []; window.__tracks = []; window.__am = []; window.__mic = []
  const P = window.RTCPeerConnection
  if (P) {
    const PC = function (...a) { const p = new P(...a); window.__pcs.push(p); p.addEventListener('track', (e) => { if (e.track.kind === 'audio') window.__tracks.push({ pc: p, t: e.track }) }); return p }
    PC.prototype = P.prototype; Object.setPrototypeOf(PC, P)
    window.RTCPeerConnection = PC
  }
  const ce = Document.prototype.createElement
  Document.prototype.createElement = function (t, o) { const e = ce.call(this, t, o); if (typeof t === 'string' && t.toLowerCase() === 'audio') window.__am.push(e); return e }
  const A = window.Audio
  if (A) { const Au = function (s) { const e = new A(s); window.__am.push(e); return e }; Au.prototype = A.prototype; window.Audio = Au }
  const bl = new Map(), cu = URL.createObjectURL.bind(URL)
  URL.createObjectURL = (b) => { const u = cu(b); if (b instanceof Blob) bl.set(u, b); return u }
  window.__workers = []; window.__ctxs = []
  const W = window.Worker
  if (W) { const Wk = function (u, o) { const w = new W(u, o); window.__workers.push(w); w.__loai = '?'; const b = bl.get(String(u)); if (b) b.text().then((t) => { w.__loai = t.includes('xuLy(') ? 'khung' : t.includes('df_process_frame') ? 'df3' : 'khac' }); return w }; Wk.prototype = W.prototype; window.Worker = Wk }
  const AC = window.AudioContext
  if (AC) { const Ac = function (o) { const c = new AC(o); if (!window.__dangDo) window.__ctxs.push(c); return c }; Ac.prototype = AC.prototype; Object.setPrototypeOf(Ac, AC); window.AudioContext = Ac }
  const md = navigator.mediaDevices
  if (md?.getUserMedia) { const g = md.getUserMedia.bind(md); md.getUserMedia = async (c) => { const s = await g(c); window.__mic.push(s); return s } }
  const pcSong = () => window.__pcs.filter((p) => p.signalingState !== 'closed')
  window.__chon = (vai) => {
    if (vai === 'micTho') { for (let i = window.__mic.length - 1; i >= 0; i--) { const t = window.__mic[i].getAudioTracks()[0]; if (t && t.readyState === 'live') return t } return null }
    const ds = pcSong(), p = ds[ds.length - 1]
    if (!p) return null
    if (vai === 'gui') { const s = p.getSenders().filter((x) => x.track && x.track.kind === 'audio'); return s.length ? s[s.length - 1].track : null }
    const tr = window.__tracks.filter((x) => x.pc === p).map((x) => x.t)
    if (vai === 'nhanDau') return tr[0] ?? null
    if (vai === 'nhanCuoi') return tr.length > (window.__laThay ? 0 : 1) ? tr[tr.length - 1] : null
    return null
  }
  window.__anh = async (t) => {
    const ra = {}
    const bcs = await Promise.all(pcSong().map((p) => p.getStats().catch(() => null)))
    for (const [vai, tr] of Object.entries(t)) {
      if (!tr || vai === 'micTho') continue
      for (const bc of bcs) {
        if (!bc) continue
        const ds = []; bc.forEach((s) => ds.push(s))
        if (vai === 'gui') {
          const ms = ds.find((s) => s.type === 'media-source' && s.kind === 'audio' && s.trackIdentifier === tr.id)
          if (!ms) continue
          const ob = ds.find((s) => s.type === 'outbound-rtp' && s.kind === 'audio' && s.mediaSourceId === ms.id)
          ra[vai] = { byte: ob?.bytesSent ?? 0, goi: ob?.packetsSent ?? 0, muc: ms.audioLevel ?? 0, nl: ms.totalAudioEnergy ?? 0 }
        } else {
          const ib = ds.find((s) => s.type === 'inbound-rtp' && s.kind === 'audio' && s.trackIdentifier === tr.id)
          if (ib) ra[vai] = { byte: ib.bytesReceived ?? 0, goi: ib.packetsReceived ?? 0, muc: ib.audioLevel ?? 0, nl: ib.totalAudioEnergy ?? 0, an: ib.concealedSamples ?? 0, mau: ib.totalSamplesReceived ?? 0 }
        }
      }
    }
    return ra
  }
  window.__phanTu = (t) => {
    if (!t) return null
    const e = window.__am.find((a) => { const so = a.srcObject; return so && typeof so.getAudioTracks === 'function' && so.getAudioTracks().some((x) => x.id === t.id) })
    if (!e) return { co: false, tr: { rs: t.readyState, en: t.enabled, mu: t.muted } }
    return { co: true, dung: e.paused, tat: e.muted, vol: e.volume, ct: e.currentTime, rs: e.readyState, loa: typeof e.sinkId === 'string' ? e.sinkId : null, tr: { rs: t.readyState, en: t.enabled, mu: t.muted } }
  }
  window.__thu = async (t, ms) => {
    window.__dangDo = true
    const C = window.__ctxDo ?? (window.__ctxDo = new AudioContext())
    window.__dangDo = false
    try { await C.resume() } catch { /* bị chặn */ }
    const e = {}, nut = []
    for (const [vai, tr] of Object.entries(t)) {
      if (!tr) continue
      const ds = []; e[vai] = ds
      try {
        const n = C.createMediaStreamSource(new MediaStream([tr])), sp = C.createScriptProcessor(1024, 1, 1)
        sp.onaudioprocess = (ev) => { const x = ev.inputBuffer.getChannelData(0); let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; ds.push(Math.sqrt(s / x.length)) }
        n.connect(sp); sp.connect(C.destination); nut.push(n, sp)
      } catch { /* không đo được */ }
    }
    await new Promise((r) => setTimeout(r, ms))
    for (const n of nut) { try { n.disconnect() } catch { /* đã gỡ */ } }
    return { d: 1024 / C.sampleRate, st: C.state, e }
  }
  window.__do = async (cacVai, ms) => {
    const t = {}
    for (const v of cacVai) t[v] = window.__chon(v)
    const s0 = await window.__anh(t), p0 = {}
    for (const v of cacVai) p0[v] = window.__phanTu(t[v])
    const thu = await window.__thu(t, ms)
    const s1 = await window.__anh(t), p1 = {}
    for (const v of cacVai) p1[v] = window.__phanTu(t[v])
    return { co: Object.fromEntries(cacVai.map((v) => [v, !!t[v]])), s0, s1, p0, p1, thu }
  }
}

// ── Trình duyệt ──
const exe = process.env.PW_CHROMIUM
const args = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${WAV}`]
// Chromium không giao diện mặc định CHO tự phát ⇒ `--tu-phat=0` phải đặt rõ chính sách của Chrome máy thật (cần thao tác của người dùng).
args.push(TU_PHAT ? '--autoplay-policy=no-user-gesture-required' : '--autoplay-policy=document-user-activation-required')
const trinh = await chromium.launch({ ...(exe && existsSync(exe) ? { executablePath: exe } : { channel: 'chromium' }), args })
const nguCanh = await trinh.newContext({ permissions: ['microphone'] })
await nguCanh.route('**/*', (r) => { const u = r.request().url(); return u.startsWith(GOC) ? r.continue() : r.abort() })
await nguCanh.addInitScript(moc)
const loiTrang = []
const CHAN_LOI = /ResizeObserver|Failed to load resource|net::ERR_FAILED|ERR_BLOCKED/
async function moTrang(ten, duong) {
  const t = await nguCanh.newPage()
  t.on('pageerror', (e) => { if (!CHAN_LOI.test(e.message)) loiTrang.push(`${ten}: ${e.message.slice(0, 160)}`) })
  await t.goto(GOC + duong, { waitUntil: 'load' })
  // App tự đăng ký service worker; bản mới chiếm quyền ⇒ app tự tải lại. Chờ có bộ điều khiển rồi tự tải lại một lần cho chắc trang đang do SW phục vụ.
  for (let i = 0; i < 3; i++) { try { await t.waitForFunction(() => !!navigator.serviceWorker?.controller, null, { timeout: 15_000 }); break } catch { /* trang đang tải lại */ } }
  await t.reload({ waitUntil: 'load' })
  await t.waitForTimeout(800)
  const sw = await t.evaluate(() => !!navigator.serviceWorker?.controller).catch(() => false)
  if (CHAM) await t.mouse.click(4, 4) // thao tác của người dùng (thầy đã bấm trong app; em chạm màn) ⇒ trang có «kích hoạt dính»
  const nap = await t.evaluate(async ({ uThay, uEm }) => {
    const mt = await import(uThay), me = uEm === uThay ? mt : await import(uEm)
    let thay = typeof mt.taoLiveThay === 'function' ? mt.taoLiveThay : null, em = null
    for (const v of [...Object.values(me), ...Object.values(mt)]) if (typeof v === 'function') { const s = String(v); if (!em && s.includes('batMicLenBang:')) em = v; if (!thay && s.includes('datNgheEm')) thay = v }
    window.__lib = { thay, em }
    return { thay: !!thay, em: !!em }
  }, { uThay: `${GOC}/assets/${manhThay}`, uEm: `${GOC}/assets/${manhEm}` })
  return { t, sw, nap }
}
const liveView = (o) => ({ san: false, bat: false, tu: null, phien: 0, ss: null, xem: 0, ws: 0, tay: [], noi: [], bang: true, xa: false, tiengLop: true, soNet: 0, tieng: CO_SFU ? 'bat' : 'chua-cau-hinh', ...o })
const liveViewEm = (o) => ({ duocXem: true, san: true, bat: true, tu: Date.now(), phien: 1, ss: null, tieng: CO_SFU ? 'bat' : 'chua-cau-hinh', soNet: 0, bang: true, emTay: false, hangTay: null, emDuocMoi: false, emNoi: false, noi: [], ...o })
const cho = (ms) => new Promise((x) => setTimeout(x, ms))

const ketQua = { nhan: NHAN, coSfu: CO_SFU, locOn: LOC_ON, kenhMic: KENH_MIC, tuPhat: TU_PHAT, cham: CHAM, xa: XA, chromium: trinh.version(), manh: { thay: manhThay, em: manhEm }, pha: [] }
let ma = 0
const dong = []
const r2 = (v) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 100) / 100)
const db = (ds) => { if (!ds?.length) return null; let s = 0; for (const v of ds) s += v * v; return r2(20 * Math.log10(Math.max(1e-5, Math.sqrt(s / ds.length)))) }
const r = (thu, vai) => { const ds = thu?.e?.[vai]; if (!ds?.length) return null; const nhan = Float32Array.from(ds, (v) => 20 * Math.log10(Math.max(1e-4, v))); return tuongQuan(nhan.slice(4), duongBao(mauMono, 48000, thu.d)) }
const NGUONG_R = 0.5

/** Kết luận một chiều theo tầng. `thietKe` ≠ '' ⇒ chiều này TẮT THEO THIẾT KẾ (không tính là lỗi, vẫn in số). */
function ketLuan(pha, ten, nguon, dich, vaiNhan, thietKe = '', moDoi = '') {
  const L0 = { db: db(nguon.thu.e.micTho), r: r(nguon.thu, 'micTho') }
  const g0 = nguon.s0.gui, g1 = nguon.s1.gui
  const L1 = { co: !!nguon.co.gui, byte: g1 && g0 ? g1.byte - g0.byte : null, nl: g1 && g0 ? r2((g1.nl - g0.nl) * 1000) : null, muc: g1 ? r2(g1.muc) : null, db: db(nguon.thu.e.gui), r: r(nguon.thu, 'gui') }
  const n0 = dich.s0[vaiNhan], n1 = dich.s1[vaiNhan]
  const L2 = { co: !!dich.co[vaiNhan], goi: n1 && n0 ? n1.goi - n0.goi : n1 ? n1.goi : null, nl: n1 && n0 ? r2((n1.nl - n0.nl) * 1000) : null, muc: n1 ? r2(n1.muc) : null }
  const p0 = dich.p0[vaiNhan], p1 = dich.p1[vaiNhan]
  const L3 = { pt: p1 ? { co: p1.co, dung: p1.dung, tat: p1.tat, vol: p1.vol, ct: p1.co && p0?.co ? r2(p1.ct - p0.ct) : null, loa: p1.loa, tr: p1.tr } : null, db: db(dich.thu.e[vaiNhan]), r: r(dich.thu, vaiNhan) }
  const loi = [], doGui = nguon.thu.st === 'running', doNhan = dich.thu.st === 'running'
  if (doGui && !(L0.db > -60 && L0.r >= NGUONG_R)) loi.push('0:mic vào không có giọng (mẫu / mic giả hỏng?)')
  if (!L1.co) loi.push('1:không có track đang gửi')
  else {
    if (!(L1.byte > 0)) loi.push('1:bộ gửi không tăng byte')
    if (!(L1.nl > 0)) loi.push('1:media-source năng lượng = 0 (đang gửi IM LẶNG)')
    if (doGui && !(L1.r >= NGUONG_R)) loi.push(`1:tiếng đang gửi không còn là giọng (r=${L1.r})`)
  }
  if (!L2.co) loi.push('2:máy nhận không có track')
  else { if (!(L2.goi > 0)) loi.push('2:không nhận gói'); if (!(L2.nl > 0)) loi.push('2:inbound năng lượng = 0') }
  const pt = L3.pt
  if (!pt?.co) loi.push('3:không có thẻ <audio> cầm track')
  else {
    if (pt.dung) loi.push('3:<audio> đang DỪNG (paused)')
    if (pt.tat) loi.push('3:<audio> TẮT TIẾNG (muted)')
    if (!(pt.vol > 0)) loi.push('3:âm lượng 0')
    if (!(pt.ct > GIAY * 0.5)) loi.push(`3:currentTime đứng (+${pt.ct} s)`)
    if (pt.tr?.rs !== 'live' || !pt.tr?.en) loi.push('3:track đã dừng / bị tắt')
    if (doNhan && !(L3.r >= NGUONG_R)) loi.push(`3:tiếng thẻ cầm không còn là giọng (r=${L3.r})`)
  }
  const dat = loi.length === 0
  const kq = { pha, ten, thietKe: thietKe || undefined, dat, loi, L0, L1, L2, L3 }
  if (!dat && !thietKe && !moDoi) ma = 1
  const o = (b) => (b ? 'đạt' : 'KHÔNG')
  const t0 = !loi.some((x) => x.startsWith('0:')), t1 = !loi.some((x) => x.startsWith('1:')), t2 = !loi.some((x) => x.startsWith('2:')), t3 = !loi.some((x) => x.startsWith('3:'))
  dong.push(`| ${NHAN} | ${kq.pha} | ${ten} | ${o(t0)} (${L0.db} dB, r ${L0.r}) | ${o(t1)} (+${L1.byte ?? '—'} B, nl ${L1.nl}, r ${L1.r}) | ${o(t2)} (+${L2.goi ?? '—'} gói, nl ${L2.nl}) | ${o(t3)} (${pt?.co ? `${pt.dung ? 'dừng' : 'chạy'}${pt.tat ? ' · TẮT TIẾNG' : ''} · vol ${pt.vol} · ct +${pt.ct}` : 'không thẻ'}, r ${L3.r}) | ${dat ? 'ĐẠT' : thietKe ? `TẮT THEO THIẾT KẾ (${thietKe})` : moDoi ? `MONG ĐỢI (${moDoi}): ${loi.join('; ')}` : 'CÂM: ' + loi.join('; ')} |`)
  return kq
}

try {
  // ── Máy thầy ──
  const { t: thay, sw: swThay, nap: napThay } = await moTrang('thầy', '/')
  ketQua.trang = { thay: { sw: swThay, ...napThay } }
  await thay.evaluate(() => { window.__laThay = true })
  await thay.evaluate(async ({ ve, goc, view, locOn }) => {
    window.__tin = []; window.__np = []
    window.lt = window.__lib.thay({ ve, goc, kenh: { gui: (t) => window.__tin.push(t), guiNhiPhan: () => {}, hangCho: () => 0 }, layAnh: () => null, loc: 'tu', locOn, chuoi: true, khiThietBi: () => {}, khiTrangThai: () => {} })
    window.lt.nhanTinPhong({ t: 'bang', live: view })
    await window.lt.noiSan()
  }, { ve: await ve('gv', ''), goc: GOC, view: liveView({}), locOn: LOC_ON })
  const ss = await thay.evaluate(() => window.__tin.filter((t) => t.t === 'live-san').pop()?.ss ?? null)
  // Thầy chọn mic ĐÍCH DANH (như chọn «Microphone (BOYALINK)»): mic giả đầu tiên không phải mục «Mặc định».
  const micId = MIC === 'chon' ? await thay.evaluate(async () => { const ds = await navigator.mediaDevices.enumerateDevices(); const m = ds.find((d) => d.kind === 'audioinput' && d.deviceId && d.deviceId !== 'default' && d.deviceId !== 'communications'); return m?.deviceId ?? null }) : null
  const bat = await thay.evaluate(async (mic) => window.lt.bat({ mic, khongTieng: false }), micId)
  const tu = Date.now()
  await thay.evaluate((view) => window.lt.nhanTinPhong({ t: 'bang', live: view }), liveView({ san: true, bat: true, tu, phien: 1, ss, xem: 2 }))
  ketQua.thay = { coPhienSfu: !!ss, bat, chonMic: !!micId }
  if (!CO_SFU) {
    // Chạy khô: tự kiểm đường đo (mic giả → bộ thu đường bao → tương quan với mẫu) để lượt chạy thật không hỏng vì phần đo.
    const k = await thay.evaluate(async ([id, ms]) => { await navigator.mediaDevices.getUserMedia({ audio: id ? { deviceId: { exact: id } } : true }); return window.__do(['micTho'], ms) }, [micId, GIAY * 1000])
    ketQua.tuKiem = { db: db(k.thu.e.micTho), r: r(k.thu, 'micTho'), ctx: k.thu.st, khung: k.thu.e.micTho?.length ?? 0 }
  }
  if (!CO_SFU || !ss) throw new Error(CO_SFU ? 'máy thầy không nối được SFU' : 'chạy khô (không có khoá SFU) — chỉ kiểm đường nạp')

  // ── Hai máy em ──
  const cacEm = []
  for (const sbd of ['S1', 'S2']) {
    const { t, sw, nap } = await moTrang(`em ${sbd}`, '/hs')
    ketQua.trang[sbd] = { sw, ...nap }
    await t.evaluate(async ({ ve, goc, view }) => {
      window.__tin = []
      window.le = window.__lib.em({ ve, goc, mayYeu: false, kenh: { gui: (x) => window.__tin.push(x), guiNhiPhan: () => {} }, khiBut: () => {}, khiTrangThai: () => {} })
      window.le.nhanView(view)
      window.addEventListener('click', () => { void window.le.moKhoaTieng() }, { capture: true, once: true })
    }, { ve: await ve('hs', sbd), goc: GOC, view: liveViewEm({ ss }) })
    if (CHAM) await t.mouse.click(30, 30) // lần chạm đầu của em ⇒ mở khoá tiếng (LopLive.tsx)
    cacEm.push(t)
  }
  const [s1, s2] = cacEm
  for (const em of cacEm) await em.waitForFunction(() => { const x = window.le.trangThai().tieng; return x === 'co' || x === 'loi' || x === 'bi-chan' }, null, { timeout: 25_000 }).catch(() => null)
  await cho(2500)

  const dt = async () => ({
    thay: await thay.evaluate(() => { const c = window.lt.chanDoan?.() ?? {}; const t = window.lt.trangThai(); return { pha: t.pha, tieng: t.tieng, micTinh: t.micTinh, ngheEm: t.ngheEm, emNoi: t.emNoi?.sbd ?? null, micKhac: t.micKhac ?? null, amEmKet: t.amEmKet ?? null, cd: { track: c.track, muc: c.muc, mucGui: c.mucGui, kbps: c.kbps, gan: c.gan, sfu: c.sfu, bac: c.bac, ctx: c.ctx, hz: c.hz, kenh: c.kenh, vong: c.vong, on: c.on, agc: c.agc, chuoi: c.chuoi, kieu: c.kieu, locOn: c.locOn, locOnChay: c.locOnChay, locOnBo: c.locOnBo ?? null, df3: c.df3 ? { tinh: c.df3.tinh, ms: c.df3.ms, vi: c.df3.vi ?? null } : null, luoi: c.luoi ?? null }, ti: window.lt.tiengMay?.().thay ?? null } }),
    em: await Promise.all(cacEm.map((e) => e.evaluate(() => { const t = window.le.trangThai(); return { tieng: t.tieng, nghe: t.nghe, mic: t.mic, banNoi: t.banNoi?.sbd ?? null, kenhNet: t.kenhNet, locMic: window.le.locMic?.() ?? null, ti: window.le.doTieng?.() ?? null } }))),
  })
  async function doPha(ten, vai) {
    const [a, b, c] = await Promise.all([thay.evaluate(([v, ms]) => window.__do(v, ms), [vai.thay, GIAY * 1000]), s1.evaluate(([v, ms]) => window.__do(v, ms), [vai.s1, GIAY * 1000]), s2.evaluate(([v, ms]) => window.__do(v, ms), [vai.s2, GIAY * 1000])])
    return { ten, thay: a, s1: b, s2: c, dt: await dt() }
  }
  const ghiPha = (p, chieu, moDoi = '') => { const kq = { ten: p.ten, dt: p.dt, chieu: [] }; for (const [ten, n, d, v, tk] of chieu) kq.chieu.push(ketLuan(p.ten, ten, n, d, v, tk, moDoi)); ketQua.pha.push(kq) }
  const VAI_NOI = { thay: ['micTho', 'gui', 'nhanCuoi'], s1: ['nhanDau', 'micTho', 'gui'], s2: ['nhanDau', 'nhanCuoi'] }
  const VAI_LIVE = { thay: ['micTho', 'gui'], s1: ['nhanDau'], s2: ['nhanDau'] }
  const bonChieu = (P, tkThay = '') => [['thầy→S1', P.thay, P.s1, 'nhanDau'], ['thầy→S2', P.thay, P.s2, 'nhanDau'], ['S1→thầy', P.s1, P.thay, 'nhanCuoi', tkThay], ['S1→S2', P.s1, P.s2, 'nhanCuoi']]
  const haiChieu = (P) => [['thầy→S1', P.thay, P.s1, 'nhanDau'], ['thầy→S2', P.thay, P.s2, 'nhanDau']]

  // P0 — live, chưa gọi em nào. `--cham=0`: máy em chưa chạm ⇒ trình duyệt chặn tự phát (MONG ĐỢI) ⇒ chạm ⇒ phải có tiếng.
  if (!CHAM) {
    await cho(3000)
    const P = await doPha('P0 em CHƯA chạm', VAI_LIVE)
    ghiPha(P, haiChieu(P), 'trình duyệt chặn tự phát khi chưa chạm')
    for (const em of cacEm) await em.mouse.click(30, 30)
    await cho(2500)
  }
  const P0 = await doPha('P0 live', VAI_LIVE)
  ghiPha(P0, haiChieu(P0))

  // P1 — thầy gọi S1 lên bảng: phòng cho phép ⇒ LopLive tự gọi batMicLenBang mỗi 1,5 giây tới khi được.
  await s1.evaluate((view) => window.le.nhanView(view), liveViewEm({ ss, emDuocMoi: true }))
  const t0Mic = Date.now()
  let micEm = null
  while (Date.now() - t0Mic < 15_000) {
    micEm = await s1.evaluate(async () => { const r = await window.le.batMicLenBang(); return { ok: r.ok, lyDo: r.lyDo ?? null, mic: window.le.trangThai().mic } })
    if (micEm.mic === 'dang-phat') break
    await cho(1500)
  }
  ketQua.micEm = { ...micEm, ms: Date.now() - t0Mic, phongGhi: !!phongMic.bat }
  if (phongMic.bat) {
    const noi = [{ sbd: 'S1', ten: 'Em S1', doi: 0, xa: XA, ss: phongMic.bat }]
    await s1.evaluate((view) => window.le.nhanView(view), liveViewEm({ ss, emDuocMoi: true, emNoi: true, noi }))
    await s2.evaluate((view) => window.le.nhanView(view), liveViewEm({ ss, noi }))
    await thay.evaluate((view) => window.lt.nhanTinPhong({ t: 'bang', live: view }), liveView({ san: true, bat: true, tu, phien: 1, ss, xem: 2, noi }))
    await cho(3500)
    const P1 = await doPha(`P1 gọi S1 (xa ${XA ? 'có' : 'không'}, nghe em mặc định)`, VAI_NOI)
    ghiPha(P1, bonChieu(P1, P1.dt.thay.ngheEm ? '' : '«Phát tiếng em ra loa lớp» mặc định tắt khi em trong lớp'))

    // P2 — thầy bật «Phát tiếng em ra loa lớp». `--cham=0`: cửa sổ app thầy chưa từng được chạm ⇒ thẻ tiếng em bị chặn (MONG ĐỢI, lưới báo `amEmKet`) ⇒ chạm.
    if (await thay.evaluate(() => typeof window.lt.datNgheEm === 'function')) {
      await thay.evaluate(() => window.lt.datNgheEm(true))
      await cho(4500)
      if (!CHAM) {
        const P = await doPha('P2 thầy CHƯA chạm', VAI_NOI)
        ghiPha(P, [['S1→thầy', P.s1, P.thay, 'nhanCuoi']], 'trình duyệt chặn tự phát khi chưa chạm')
        ketQua.truocChamThay = { amEmKet: P.dt.thay.amEmKet }
        await thay.mouse.click(4, 4)
        await cho(2500)
      }
      const P2 = await doPha('P2 thầy bật nghe em', VAI_NOI)
      ghiPha(P2, bonChieu(P2))
    }
    // P3 — thu mic em.
    await s1.evaluate(() => window.le.tatMic())
    await s1.evaluate((view) => window.le.nhanView(view), liveViewEm({ ss }))
    await s2.evaluate((view) => window.le.nhanView(view), liveViewEm({ ss }))
    await thay.evaluate((view) => window.lt.nhanTinPhong({ t: 'bang', live: view }), liveView({ san: true, bat: true, tu, phien: 1, ss, xem: 2, noi: [] }))
    await cho(3500)
    const P3 = await doPha('P3 thu mic em', VAI_LIVE)
    ghiPha(P3, haiChieu(P3))
    // P4 — CHUỖI HỎNG: dừng Worker của chuỗi «khung» + treo mọi AudioContext của app (bộ đo cũ mù) ⇒ lưới an toàn phía gửi phải tự về mic thô.
    const hong = await thay.evaluate(async () => { let w = 0; for (const x of window.__workers) if (x.__loai === 'khung') { x.terminate(); w += 1 } for (const c of window.__ctxs) await c.suspend().catch(() => {}); return { worker: w, ctx: window.__ctxs.length } })
    ketQua.chuoiHong = hong
    await cho(4000)
    const P4 = await doPha(`P4 chuỗi hỏng (dừng ${hong.worker} Worker, treo ${hong.ctx} AudioContext)`, VAI_LIVE)
    ghiPha(P4, haiChieu(P4))
  } else { ma = 1; dong.push(`| ${NHAN} | P1 | S1 bật mic | — | — | — | — | CÂM: em không bật được mic (${JSON.stringify(micEm)}) |`) }
} catch (e) {
  ma = 1
  dong.push(`| ${NHAN} | — | — | — | — | — | — | KỊCH BẢN DỪNG: ${String(e?.message ?? e).slice(0, 300)} |`)
} finally {
  ketQua.cua = demCua
  ketQua.loiTrang = loiTrang
  await trinh.close().catch(() => {})
  mayChu.close()
}
const tieuDe = `== TIẾNG THẬT · ${NHAN} · ${CO_SFU ? 'SFU THẬT' : 'CHẠY KHÔ'} · mic giả ${KENH_MIC} kênh · lọc ồn ${LOC_ON} · ${TU_PHAT ? 'cờ tự phát BẬT' : 'KHÔNG cờ tự phát (chạm thật)'} · em ${XA ? 'ở xa' : 'trong lớp'} ==`
const bang = ['| bản | pha | chiều | 0 mic vào | 1 phía gửi | 2 phía nhận | 3 phần tử phát | kết luận |', '|---|---|---|---|---|---|---|---|', ...dong]
console.log(`\n${tieuDe}`)
for (const d of bang) console.log(d)
for (const p of ketQua.pha) console.log(`Chẩn đoán ${p.ten}: thầy ${JSON.stringify(p.dt.thay)} · em ${JSON.stringify(p.dt.em)}`)
console.log(`Trang: ${JSON.stringify(ketQua.trang ?? {})} · thầy ${JSON.stringify(ketQua.thay ?? {})} · mic em ${JSON.stringify(ketQua.micEm ?? {})}`)
console.log(`Lệnh qua cửa /bpu/live/*: ${JSON.stringify(demCua)}`)
if (loiTrang.length) console.log(`Lỗi trang: ${loiTrang.join(' | ').slice(0, 800)}`)
console.log(`KẾT: ${ma ? 'CÓ CHIỀU CÂM' : 'MỌI CHIỀU ĐẠT'}`)
console.log(`JSON: ${JSON.stringify(ketQua)}`)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### ${tieuDe}\n\n${bang.join('\n')}\n\n`)
process.exit(ma)
