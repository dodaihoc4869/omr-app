#!/usr/bin/env node
// THỬ KHẢ THI LIVE BẢNG — «Đợt 0» của đặc tả docs/dac-ta-live-bang-1011.md (mục 7, 9). Chạy Chromium THẬT (Playwright), hai trang: MÁY THẦY + MÁY EM,
// dùng đúng thư viện `src/lib/live` và đúng cửa `/bpu/live/*` (server/src/live-sfu.ts, chạy trong tiến trình Node này) nối tới Cloudflare Realtime SFU THẬT.
//   thầy: phát tiếng (mic GIẢ của Chromium: tiếng «bíp» mỗi giây) + kênh điểm đang viết (DataChannel không tin cậy) + viết nét tổng hợp 200 điểm/giây;
//   em:   kéo tiếng, nhận điểm qua DataChannel, phát qua đệm phát + nội suy; đo trễ nét đầu-cuối, RTT tới SFU, jitter, đệm tiếng.
// Cần hai biến môi trường REALTIME_APP_ID + REALTIME_APP_SECRET (workflow thu-live-dot0-1011.yml lấy từ GitHub secrets). KHÔNG in mã ứng dụng, khoá, mã phiên.
// Thiếu khoá ⇒ chạy KHÔ: chỉ kiểm thư viện nạp được trong trình duyệt thật và đường «chỉ hình» (khung đi vòng qua kịch bản thay cho phòng) — không có số đo mạng.
//
// SỐ ĐO Ở ĐÂY ĐO Ở ĐÂU: máy chạy kịch bản (máy CI của GitHub ở trung tâm dữ liệu nước ngoài, hoặc máy phát triển) — thầy và em cùng MỘT máy.
// ⇒ kiểm được: đường đi chạy thật (SDP, track, DataChannel 1 phát → 1 nhận), thứ tự độ lớn của trễ xử lý + đệm.
// ⇒ KHÔNG đại diện: mạng Việt Nam (Viettel / VNPT / FPT / Mobifone), 4G, máy em yếu, 300 người nghe. Các số đó phải đo tại lớp (đặc tả mục 7).
//
// Dùng:  node scripts/thu-live-dot0-1011.mjs [--giay=12] [--em=1]
import { createServer } from 'node:http'
import { mkdtempSync, readFileSync, existsSync, statSync, appendFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { randomBytes } from 'node:crypto'
import { build } from 'esbuild'
import { chromium } from 'playwright'

const thamSo = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? '1']))
const GIAY = Math.max(4, Number(thamSo.giay) || 12), SO_EM = Math.max(1, Math.min(8, Number(thamSo.em) || 1))
const sach = (v) => String(v ?? '').replace(/[\r\n]/g, '').trim().replace(/^["']|["']$/g, '')
const APP_ID = sach(process.env.REALTIME_APP_ID), APP_SECRET = sach(process.env.REALTIME_APP_SECRET)
const CO_SFU = !!APP_ID && !!APP_SECRET
if (process.env.GITHUB_ACTIONS) { for (const v of [APP_ID, APP_SECRET]) if (v) console.log(`::add-mask::${v}`) }

// ── Dựng: cửa máy chủ (Node) + thư viện máy khách (trình duyệt) từ chính mã nguồn của repo ──
const tam = mkdtempSync(join(tmpdir(), 'live-dot0-'))
await build({ entryPoints: ['scripts/thu-live-dot0-1011/may-chu.ts'], bundle: true, platform: 'node', format: 'esm', target: 'node22', outfile: join(tam, 'may-chu.mjs'), logLevel: 'warning' })
await build({ entryPoints: ['src/lib/live/index.ts'], bundle: true, platform: 'browser', format: 'iife', globalName: 'Live', target: 'es2020', outfile: join(tam, 'live.js'), logLevel: 'warning' })
const { cuaLive, kyVeBpu } = await import(pathToFileURL(join(tam, 'may-chu.mjs')).href)
const BI_MAT = randomBytes(24).toString('hex')
const env = { MA_BI_MAT: BI_MAT, PHONG_BPU: {}, ...(CO_SFU ? { REALTIME_APP_ID: APP_ID, REALTIME_APP_SECRET: APP_SECRET } : {}) }
const demCua = {}
const mayChu = createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url.startsWith('/bpu/live/')) {
      const khuc = []
      for await (const k of req) khuc.push(k)
      const r = await cuaLive(new Request(`http://x${req.url}`, { method: 'POST', body: Buffer.concat(khuc) }), env)
      const chu = await r.text()
      const lenh = req.url.slice('/bpu/live/'.length), ok = (() => { try { const j = JSON.parse(chu); return j.ok ? 'ok' : `${j.lyDo}${j.buoc ? ':' + j.buoc : ''}${j.http ? ':' + j.http : ''}${j.ma ? ':' + j.ma : ''}` } catch { return 'hong' } })()
      demCua[`${lenh} ${ok}`] = (demCua[`${lenh} ${ok}`] ?? 0) + 1
      res.writeHead(200, { 'content-type': 'application/json' }); res.end(chu); return
    }
    if (req.url === '/live.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); res.end(readFileSync(join(tam, 'live.js'))); return }
    res.writeHead(200, { 'content-type': 'text/html;charset=utf-8' }); res.end('<!doctype html><meta charset="utf-8"><title>live</title><script src="/live.js"></script><body>live</body>')
  } catch (e) { res.writeHead(500); res.end(String(e?.message ?? e)) }
})
await new Promise((xong) => mayChu.listen(0, '127.0.0.1', xong))
const GOC = `http://127.0.0.1:${mayChu.address().port}`
const ve = (v, s) => kyVeBpu(BI_MAT, { b: 'thu-dot0', s, v, h: Date.now() + 3_600_000 })

// ── Trình duyệt ──
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({
  executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined,
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
})
const nguCanh = await trinh.newContext({ permissions: ['microphone'] })
const loiTrang = []
async function trang(ten) {
  const t = await nguCanh.newPage()
  t.on('pageerror', (e) => loiTrang.push(`${ten}: ${e.message}`))
  await t.goto(GOC)
  await t.waitForFunction(() => typeof window.Live?.taoLiveThay === 'function')
  return t
}
const liveView = (o) => ({ san: false, bat: false, tu: null, phien: 0, ss: null, xem: 0, ws: 0, tay: [], noi: [], xa: false, tiengLop: true, soNet: 0, tieng: CO_SFU ? 'bat' : 'chua-cau-hinh', ...o })
const ketQua = { coSfu: CO_SFU, giay: GIAY, soEm: SO_EM }
let ma = 0
try {
  const thay = await trang('thầy')
  await thay.evaluate(async ({ ve, goc, view }) => {
    window.__tin = []; window.__np = []; window.__tt = []
    window.lt = window.Live.taoLiveThay({ ve, goc, kenh: { gui: (t) => window.__tin.push(t), guiNhiPhan: (k) => window.__np.push(Array.from(k)) }, khiTrangThai: (t) => window.__tt.push(t) })
    window.lt.nhanTinPhong({ t: 'bang', live: view })
    await window.lt.noiSan()
  }, { ve: await ve('gv', ''), goc: GOC, view: liveView({}) })
  const san = await thay.evaluate(() => ({ tt: window.lt.trangThai(), ss: window.__tin.filter((t) => t.t === 'live-san').pop()?.ss ?? null }))
  ketQua.thaySan = { pha: san.tt.pha, tieng: san.tt.tieng, kenhNet: san.tt.kenhNet, coPhienSfu: !!san.ss, ...(san.tt.loi ? { loi: san.tt.loi } : {}) }
  const ss = san.ss
  // Bấm Live: mic giả của Chromium ⇒ replaceTrack.
  const bat = await thay.evaluate(async (khongTieng) => window.lt.bat({ khongTieng }), !CO_SFU)
  await thay.evaluate((view) => window.lt.nhanTinPhong({ t: 'bang', live: view }), liveView({ san: true, bat: true, tu: Date.now(), phien: 1, ss }))
  ketQua.thayBat = { ...bat, tieng: (await thay.evaluate(() => window.lt.trangThai())).tieng }

  const cacEm = []
  for (let i = 0; i < SO_EM; i++) {
    const em = await trang(`em ${i + 1}`)
    await em.evaluate(async ({ ve, goc, view }) => {
      window.__tin = []; window.__den = []; window.__sk = { 'net-moi': 0, 'them-diem': 0, 'net-xong': 0, xoa: 0, trang: 0, tro: 0 }; window.__diem = 0; window.__am = 0; window.__khung = 0
      window.le = window.Live.taoLiveEm({
        ve, goc, kenh: { gui: (t) => window.__tin.push(t), guiNhiPhan: () => {} },
        // Giờ (đồng hồ lịch, chung máy với trang thầy) lúc từng điểm của nét dở được phát ra lớp vẽ ⇒ trễ nét đầu-cuối.
        khiBut: (sk) => { window.__sk[sk.loai] += 1; const ds = sk.loai === 'net-moi' && !sk.xong ? sk.net.diem : sk.loai === 'them-diem' ? sk.diem : []; const id = sk.loai === 'net-moi' ? sk.net.id : sk.id; const nay = Date.now(); for (const p of ds) { window.__den.push([id, p[3], nay]); window.__diem += 1 } },
      })
      await window.le.moKhoaTieng()
      window.le.datTieng(true)
      window.le.nhanView(view)
      const ve1 = () => { window.__khung += 1; window.le.khung(); window.__am = Math.max(window.__am, window.le.mucAm()); requestAnimationFrame(ve1) }
      requestAnimationFrame(ve1)
    }, { ve: await ve('hs', `S${i + 1}`), goc: GOC, view: { duocXem: true, san: true, bat: true, tu: Date.now(), phien: 1, ss, tieng: CO_SFU ? 'bat' : 'chua-cau-hinh', soNet: 0, emTay: false, hangTay: null, emDuocMoi: false, emNoi: false, noi: [] } })
    cacEm.push(em)
  }
  const t0Noi = Date.now()
  if (CO_SFU && ss) {
    for (const em of cacEm) await em.waitForFunction(() => { const t = window.le.trangThai(); return t.kenhNet === 'dc' || t.tieng === 'loi' }, null, { timeout: 30_000 }).catch(() => null)
    ketQua.noiEmMs = Date.now() - t0Noi
  }
  const ttEm = await Promise.all(cacEm.map((em) => em.evaluate(() => { const t = window.le.trangThai(); return { tieng: t.tieng, kenhNet: t.kenhNet, ok: window.__tin.filter((x) => x.t === 'live-ok').pop() ?? null } })))
  const soDc = ttEm.filter((t) => t.kenhNet === 'dc').length
  // Phòng báo máy thầy số em xem + số em cần điểm qua WebSocket.
  await thay.evaluate((m) => window.lt.nhanTinPhong(m), { t: 'live-xem', xem: SO_EM, ws: SO_EM - soDc })

  // Kịch bản đóng vai PHÒNG cho các khung nhị phân của máy thầy: ghi số thứ tự cho mục sổ nét, chuyển nguyên văn tới mọi máy em.
  let stt = 0, chuyen = true
  const vongChuyen = (async () => {
    while (chuyen) {
      const ds = await thay.evaluate(() => window.__np.splice(0))
      for (const k of ds) { if (k[0] >= 0x11 && k[0] <= 0x15) { stt += 1; k[1] = stt & 255; k[2] = (stt >>> 8) & 255; k[3] = (stt >>> 16) & 255; k[4] = (stt >>> 24) & 255 } }
      if (ds.length) await Promise.all(cacEm.map((em) => em.evaluate((cac) => { for (const k of cac) window.le.nhanTinPhong(new Uint8Array(k).buffer) }, ds)))
      await new Promise((x) => setTimeout(x, 25))
    }
  })()

  // Thầy viết: mỗi nét 1,2 giây, 200 điểm/giây, gom mỗi khung hình như tờ chiếu; ghi giờ tạo từng điểm.
  await thay.evaluate((giay) => new Promise((xong) => {
    window.__di = []
    const batDau = performance.now()
    let net = null, soNet = 0, tNet = 0, da = 0
    const buoc = () => {
      const nay = performance.now(), tu = nay - batDau
      if (tu > giay * 1000) { if (net) window.lt.nhanSuKienBut({ loai: 'net-xong', trang: '1', id: net.id }); xong(); return }
      if (!net) { soNet += 1; tNet = nay; da = 1; net = { id: `n${soNet}`, cong: 'but', mau: 'rgb(244,239,228)', co: 2.3, diem: [[0.05, 0.1 + (soNet % 8) * 0.1, 0.5, 0]] }; window.__di.push([net.id, 0, Date.now()]); window.lt.nhanSuKienBut({ loai: 'net-moi', trang: '1', net }) }
      const den = Math.floor((nay - tNet) / 5), lo = []
      for (; da <= den; da++) { lo.push([Math.round((0.05 + da * 0.0035) * 1e5) / 1e5, Math.round((0.1 + (soNet % 8) * 0.1 + Math.sin(da / 9) * 0.03) * 1e5) / 1e5, 0.5, da * 5]); window.__di.push([net.id, da * 5, Date.now()]) }
      if (lo.length) window.lt.nhanSuKienBut({ loai: 'them-diem', trang: '1', id: net.id, diem: lo })
      if (nay - tNet > 1200) { window.lt.nhanSuKienBut({ loai: 'net-xong', trang: '1', id: net.id }); net = null }
      requestAnimationFrame(buoc)
    }
    window.lt.nhanSuKienBut({ loai: 'trang', trang: '1', net: [], tiLe: 1.9512 })
    requestAnimationFrame(buoc)
  }), GIAY)
  await new Promise((x) => setTimeout(x, 1500))
  chuyen = false; await vongChuyen

  // ── Thu số đo ──
  const di = await thay.evaluate(() => ({ di: window.__di, soDo: window.lt.soDo(), tt: window.lt.trangThai() }))
  const gioTao = new Map(di.di.map(([id, t, luc]) => [`${id}|${t}`, luc]))
  const tk = (ds) => { const s = ds.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? { n: s.length, tv: Math.round(s[Math.floor((s.length - 1) / 2)]), p95: Math.round(s[Math.min(s.length - 1, Math.floor(s.length * 0.95))]), max: Math.round(s[s.length - 1]) } : null }
  ketQua.thay = { goiDc: di.soDo.goiDc, goiWs: di.soDo.goiWs, khungSo: di.soDo.khungSo, rttMs: di.soDo.rtt == null ? null : Math.round(di.soDo.rtt), kenhNet: di.tt.kenhNet, tieng: di.tt.tieng, diemDaViet: di.di.length }
  ketQua.em = []
  for (let i = 0; i < cacEm.length; i++) {
    const r = await cacEm[i].evaluate(() => ({ tt: window.le.trangThai(), soDo: window.le.soDo(), den: window.__den, sk: window.__sk, am: window.__am, khung: window.__khung, bang: window.le.bang().net.length }))
    const tre = r.den.map(([id, t, luc]) => luc - (gioTao.get(`${id}|${t}`) ?? NaN))
    const gon = (x) => (x ? { tv: Math.round(x.tv), p95: Math.round(x.p95), max: Math.round(x.max), n: x.n } : null)
    ketQua.em.push({
      tieng: r.tt.tieng, kenhNet: r.tt.kenhNet, baoDc: ttEm[i].ok?.dc ?? null,
      diemNhanDangViet: r.den.length, tiLeDiem: Math.round((r.den.length / Math.max(1, di.di.length)) * 1000) / 10,
      treNetDauCuoiMs: tk(tre), demPhatDMs: gon(r.soDo.d), jitterGoiDiemMs: gon(r.soDo.j), diemToiMuonMs: gon(r.soDo.m),
      rttSfuMs: gon(r.soDo.rtt), jitterTiengMs: gon(r.soDo.jt), treTiengPhiaEmMs: gon(r.soDo.tt), mucAmLonNhat: Math.round(r.am * 1000) / 1000,
      suKienBut: r.sk, netTrongBang: r.bang, khungHinh: r.khung,
    })
  }
  ketQua.cua = demCua
  ketQua.loiTrang = loiTrang

  // ── Kết luận ──
  const e0 = ketQua.em[0]
  const dat = []
  const kiem = (ten, ok) => { dat.push(`${ok ? 'ĐẠT' : 'KHÔNG ĐẠT'} · ${ten}`); if (!ok) ma = 1 }
  kiem('thư viện nạp và chạy trong Chromium thật, không lỗi trang', loiTrang.length === 0)
  kiem('nét xong tới máy em qua sổ nét (đúng số nét)', ketQua.em.every((e) => e.netTrongBang >= Math.floor(GIAY / 1.2) - 1))
  kiem('điểm đang viết tới máy em ≥ 95 %', ketQua.em.every((e) => e.tiLeDiem >= 95))
  if (CO_SFU) {
    kiem('máy thầy nối SFU, phát track tiếng', ketQua.thaySan.coPhienSfu && ketQua.thayBat.tieng === 'mic')
    kiem('máy thầy mở được DataChannel «net» qua SFU', ketQua.thay.kenhNet === 'dc')
    kiem('máy em nhận DataChannel «net» qua SFU', ketQua.em.every((e) => e.kenhNet === 'dc'))
    kiem('máy em có tiếng thầy (mức âm > 0)', ketQua.em.every((e) => e.tieng === 'co' && e.mucAmLonNhat > 0))
    kiem('điểm đi DataChannel, không đi WebSocket', ketQua.thay.goiDc > 0 && ketQua.thay.goiWs === 0)
  }
  console.log(`\n== THỬ KHẢ THI LIVE (Đợt 0) · ${CO_SFU ? 'Cloudflare Realtime SFU THẬT' : 'CHẠY KHÔ — chưa có khoá SFU, chỉ kiểm đường «chỉ hình»'} · ${SO_EM} máy em · viết ${GIAY} giây ==`)
  console.log('Nơi đo: máy chạy kịch bản này (thầy + em cùng một máy' + (process.env.GITHUB_ACTIONS ? ', máy CI của GitHub' : '') + ') — KHÔNG đại diện mạng Việt Nam / 4G / máy em yếu / 300 người nghe.')
  for (const d of dat) console.log(d)
  if (e0) {
    const s = (ten, x, dv = 'ms') => console.log(`  ${ten}: ${x ? `trung vị ${x.tv} ${dv} · p95 ${x.p95} ${dv} · lớn nhất ${x.max} ${dv} (${x.n} mẫu)` : 'không có mẫu'}`)
    console.log(`Máy em 1 — tiếng: ${e0.tieng} · điểm đến qua: ${e0.kenhNet} · nhận ${e0.diemNhanDangViet}/${ketQua.thay.diemDaViet} điểm đang viết (${e0.tiLeDiem} %)`)
    s('trễ nét đầu-cuối (điểm sinh ra ở máy thầy → phát ra lớp vẽ máy em)', e0.treNetDauCuoiMs)
    s('đệm phát D', e0.demPhatDMs); s('dao động giờ tới của gói điểm (p95 trong 2 giây)', e0.jitterGoiDiemMs); s('điểm tới muộn hơn mốc phát', e0.diemToiMuonMs)
    s('RTT máy em ↔ SFU', e0.rttSfuMs); s('jitter tiếng', e0.jitterTiengMs); s('trễ tiếng phía máy em (đệm jitter + ~65 ms thu / mã hoá / loa)', e0.treTiengPhiaEmMs)
    console.log(`  RTT máy thầy ↔ SFU: ${ketQua.thay.rttMs ?? 'không đo được'} ms · gói điểm thầy gửi: DataChannel ${ketQua.thay.goiDc}, WebSocket ${ketQua.thay.goiWs}${ketQua.noiEmMs != null ? ` · máy em nối xong sau ${ketQua.noiEmMs} ms` : ''}`)
  }
  console.log(`Lệnh qua cửa /bpu/live/*: ${JSON.stringify(demCua)}`)
  if (loiTrang.length) console.log(`Lỗi trang: ${loiTrang.join(' | ').slice(0, 800)}`)
  console.log(`JSON: ${JSON.stringify(ketQua)}`)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Thử khả thi Live (Đợt 0) — ${CO_SFU ? 'SFU thật' : 'chạy khô'}\n\nNơi đo: máy CI của GitHub (thầy + em cùng máy) — không đại diện mạng Việt Nam.\n\n${dat.map((d) => `- ${d}`).join('\n')}\n\n\`\`\`json\n${JSON.stringify(ketQua, null, 1)}\n\`\`\`\n`)
} catch (e) {
  ma = 1
  console.log(`KHÔNG ĐẠT · kịch bản dừng giữa chừng: ${String(e?.message ?? e).slice(0, 600)}`)
  console.log(`Lệnh qua cửa /bpu/live/*: ${JSON.stringify(demCua)} · lỗi trang: ${loiTrang.join(' | ').slice(0, 600)}`)
  console.log(`JSON: ${JSON.stringify(ketQua)}`)
} finally {
  await trinh.close().catch(() => {})
  mayChu.close()
}
process.exit(ma)
