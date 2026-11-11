#!/usr/bin/env node
// PHÉP THỬ TIẾNG QUA PHÒNG THẬT + GIAO DIỆN ĐẦY ĐỦ + SFU THẬT (11/11 tối — thầy: «mất tiếng thật»; phép thử A gọi thẳng thư viện nên CHƯA phủ lớp phòng
// điều phối «ai kéo phiên / track nào» (live-san, live-mic, ss, noi[].ss) và lớp nối của app (thay-noi.ts, LopLive.tsx, ManBinhPhanUng.tsx)).
// Ngăn xếp của scripts/thu-live-1011/thu-2.mjs: Durable Object THẬT của phòng (server/src/phong-binh-phan-ung.ts) chạy trong Node, trang thầy = tờ chiếu thật
// trong khung + phần nối live của app; trang em = ManBinhPhanUng + LopLive thật. Cửa `/bpu/live/*` = cửa THẬT (server/src/live-sfu.ts) nối Cloudflare
// Realtime SFU THẬT; quyền bật mic của em hỏi CHÍNH phòng thật (`/live-mic`). Vé giả của trang thử được đổi sang vé ký thật ngay ở cửa (chỉ việc ký vé).
// Trình tự đúng như thầy: nhớ mic theo TÊN với mã cũ (thầy chọn BOYALINK, mã đổi) · lọc ồn Mạnh · bấm Live → «Bắt đầu» · mở lượt · gọi S1 lên bảng ⇒ mic em tự
// bật · bấm «Phát tiếng em ra loa lớp». Đo ba tầng mỗi chiều (do-trang.mjs) + ICE + dòng «đo tiếng từ xa» và «N em nghe» trên cửa sổ nút Live.
// `--chan-udp=1`: máy em S2 ở trình duyệt CHẶN UDP (không có relay) ⇒ xem có câm hai chiều không, và hai máy có BÁO RÕ không.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục>   (trong worktree của bản cần thử)
//   node scripts/thu-live-dot0-1011/phong-that.mjs --dist=<thư mục> --nhan=HEAD --wav=/abs/giong-2.wav [--goc-phong=<worktree>] [--loc-on=manh] [--chan-udp=0] [--giay=4]
// Chỉ in số đo + đạt / không. Không in khoá, vé, mã phiên.
import { existsSync, mkdtempSync, readFileSync, appendFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { chromium } from 'playwright'
import { docWav, doiHz } from './giong.mjs'
import { moc, taoKetLuan } from './do-trang.mjs'
import { moMayChu } from '../thu-live-1011/may-chu.mjs'

const ts = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, ...v]) => [k, v.length ? v.join('=') : '1']))
const DIST = resolve(ts.dist ?? 'dist-thu-live'), NHAN = ts.nhan ?? 'dist', WAV = resolve(ts.wav ?? ''), LOC_ON = ts['loc-on'] ?? 'manh'
const GOC_PHONG = ts['goc-phong'] ? resolve(ts['goc-phong']) : undefined, CHAN_UDP = ts['chan-udp'] === '1', UDP_HE = ts['udp-he'] === '1', GIAY = Math.max(2, Number(ts.giay) || 4)
const sach = (v) => String(v ?? '').replace(/[\r\n]/g, '').trim().replace(/^["']|["']$/g, '')
const APP_ID = sach(process.env.REALTIME_APP_ID), APP_SECRET = sach(process.env.REALTIME_APP_SECRET), TURN_ID = sach(process.env.TURN_KEY_ID), TURN_TOKEN = sach(process.env.TURN_KEY_API_TOKEN), CO_TURN = !!TURN_ID && !!TURN_TOKEN
if (process.env.GITHUB_ACTIONS) { for (const v of [APP_ID, APP_SECRET, TURN_ID, TURN_TOKEN]) if (v) console.log(`::add-mask::${v}`) }
if (!APP_ID || !APP_SECRET) { console.log('KHÔNG ĐẠT · thiếu khoá SFU (REALTIME_APP_ID / REALTIME_APP_SECRET)'); process.exit(1) }
if (!existsSync(WAV)) { console.log(`KHÔNG ĐẠT · thiếu tệp giọng --wav`); process.exit(1) }
const mau = docWav(readFileSync(WAV)), mauMono = doiHz(mau.kenh[0], mau.hz)

const tam = mkdtempSync(join(tmpdir(), 'phong-that-'))
await build({ entryPoints: [join(import.meta.dirname, 'may-chu.ts')], bundle: true, platform: 'node', format: 'esm', target: 'node22', outfile: join(tam, 'may-chu.mjs'), logLevel: 'warning' })
const { cuaLive, kyVeBpu } = await import(pathToFileURL(join(tam, 'may-chu.mjs')).href)
const BI_MAT = 'thu-phong-that-' + Date.now(), demCua = {}
const veThat = async (ve) => (ve === 'gv' ? kyVeBpu(BI_MAT, { b: 'b1', s: '', v: 'gv', h: Date.now() + 3_600_000 }) : ve.startsWith('hs.') ? kyVeBpu(BI_MAT, { b: 'b1', s: ve.slice(3), v: 'hs', h: Date.now() + 3_600_000 }) : ve)
const may = await moMayChu({
  dist: DIST, gocPhong: GOC_PHONG, // phòng của CHÍNH bản cần thử (worktree), không phải của nhánh chạy phép thử
  cuaLive: async (duong, b, phong) => {
    const env = { MA_BI_MAT: BI_MAT, REALTIME_APP_ID: APP_ID, REALTIME_APP_SECRET: APP_SECRET, ...(CO_TURN ? { TURN_KEY_ID: TURN_ID, TURN_KEY_API_TOKEN: TURN_TOKEN } : {}), PHONG_BPU: { idFromName: () => ({}), get: () => ({ fetch: (r) => phong.fetch(r) }) } }
    const r = await cuaLive(new Request(`http://x${duong}`, { method: 'POST', body: JSON.stringify({ ...b, ve: await veThat(String(b.ve ?? '')) }) }), env)
    const j = await r.json()
    const k = `${duong.slice('/bpu/live/'.length)} ${j.ok ? 'ok' : j.lyDo}`
    demCua[k] = (demCua[k] ?? 0) + 1
    return j
  },
})
const CAU = { qid: 'Q1', maDe: 'm', version: '1', group: 'g', phan: 'I', text: 'Alcohol nào sau đây là alcohol bậc II?', choices: ['CH₃–CH₂–OH', 'CH₃–CH(OH)–CH₃', '(CH₃)₃C–OH', 'CH₃–OH'], ideas: [], hinhAnh: [], dang: null, tenDang: 'Bậc alcohol', mucDo: 'hieu', sao: 2, kienThuc: [] }

const exe = process.env.PW_CHROMIUM
const ARGS = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${WAV}`, '--autoplay-policy=no-user-gesture-required']
const moTrinh = (them = []) => chromium.launch({ ...(exe && existsSync(exe) ? { executablePath: exe } : { channel: 'chromium' }), args: [...ARGS, ...them] })
// `--udp-he=1`: UDP đã bị chặn cho CẢ máy (iptables ở workflow) ⇒ mọi trang cùng một trình duyệt; không thì chỉ S2 ở trình duyệt có cờ chính sách IP.
const trinh = await moTrinh(), trinhUdp = CHAN_UDP && !UDP_HE ? await moTrinh(['--force-webrtc-ip-handling-policy=disable_non_proxied_udp']) : trinh
const loiTrang = []
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
async function nguCanh(tr, o) {
  const c = await tr.newContext({ permissions: ['microphone'], ...o })
  await c.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
  await c.addInitScript(moc)
  return c
}
const { ketLuan, dong, loi } = taoKetLuan({ nhan: `${NHAN}${UDP_HE ? ' · chặn UDP' : CHAN_UDP ? ' · S2 chặn UDP' : ''}`, giay: GIAY, mauMono })
const ketQua = { nhan: NHAN, chanUdp: CHAN_UDP, locOn: LOC_ON, kenhMic: mau.kenh.length, pha: [] }
let ma = 0
try {
  // ── MÁY THẦY: nhớ mic theo TÊN với mã CŨ (đã đổi) + lọc ồn Mạnh, như máy thầy thật ──
  const ctxThay = await nguCanh(trinh, { viewport: { width: 1366, height: 768 } })
  await ctxThay.addInitScript(([locOn]) => { try { if (!sessionStorage.getItem('__hat')) { sessionStorage.setItem('__hat', '1'); localStorage.setItem('ddh.live.loc-on', locOn); localStorage.setItem('ddh.live.mic', 'ma-cu-da-doi'); localStorage.setItem('ddh.live.mic-ten', 'Fake Audio Input 1') } } catch { /* chặn lưu */ } }, [LOC_ON])
  const thay = await ctxThay.newPage()
  thay.on('pageerror', (e) => loiTrang.push(`thầy: ${e.message.slice(0, 140)}`))
  await thay.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=thay`)
  await thay.evaluate(() => { window.__laThay = true })
  const to = thay.frameLocator('iframe')
  await to.locator('.mc-lv-nut').waitFor({ state: 'visible', timeout: 25_000 })

  // ── HAI MÁY EM (S2 có thể ở trình duyệt chặn UDP) ──
  await may.moLuot(CAU, 'B')
  const cacEm = []
  for (const [sbd, tr] of [['S1', trinh], ['S2', trinhUdp]]) {
    const c = await nguCanh(tr, { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })
    const t = await c.newPage()
    t.on('pageerror', (e) => loiTrang.push(`em ${sbd}: ${e.message.slice(0, 140)}`))
    await t.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=em&sbd=${sbd}`)
    await t.locator('.bpu-hs').waitFor({ timeout: 25_000 })
    await t.mouse.click(10, 380) // lần chạm đầu ⇒ LopLive mở khoá tiếng
    cacEm.push(t)
  }
  const [s1, s2] = cacEm

  // ── BẬT LIVE QUA GIAO DIỆN: nút Live → cửa sổ (mic mở, tìm lại mic theo tên) → «Bắt đầu» ──
  await to.locator('.mc-lv-nut').click()
  await to.locator('.mc-lv-the').waitFor({ state: 'visible', timeout: 10_000 })
  await ngu(2500)
  ketQua.theTruocBat = (await to.locator('.mc-lv-the').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 400)
  await to.locator('.mc-lv-the [data-lv="bat-dau"]').click({ timeout: 8000 })
  await to.locator('.mc-lv-cum b#mc-lv-dh').waitFor({ timeout: 15_000 })
  for (const em of cacEm) await em.mouse.click(10, 380)
  await ngu(8000)

  const pha = async (ten, vai) => {
    const [a, b, c] = await Promise.all([thay.evaluate(([v, ms]) => window.__do(v, ms), [vai.thay, GIAY * 1000]), s1.evaluate(([v, ms]) => window.__do(v, ms), [vai.s1, GIAY * 1000]), s2.evaluate(([v, ms]) => window.__do(v, ms), [vai.s2, GIAY * 1000])])
    ketQua.pha.push({ ten, pc: { thay: a.pc, s1: b.pc, s2: c.pc } })
    return { thay: a, s1: b, s2: c }
  }
  // có khoá TURN ⇒ chặn UDP vẫn PHẢI có tiếng (qua TURN TCP / TLS 443); chưa có khoá ⇒ câm là mong đợi
  const udp = (ten) => (UDP_HE ? (CO_TURN ? '' : 'cả máy bị chặn UDP, chưa có khoá TURN') : CHAN_UDP && /S2/.test(ten) ? 'S2 ở mạng chặn UDP' : '')
  const cham = (p, ten, chieu) => { for (const [tc, n, d, v, tk] of chieu) ketLuan(ten, tc, n, d, v, tk ?? '', udp(tc)) }
  const VAI_LIVE = { thay: ['micTho', 'gui'], s1: ['nhanDau'], s2: ['nhanDau'] }, VAI_NOI = { thay: ['micTho', 'gui', 'nhanCuoi'], s1: ['nhanDau', 'micTho', 'gui'], s2: ['nhanDau', 'nhanCuoi'] }

  const P0 = await pha('P0 live', VAI_LIVE)
  cham(P0, 'P0 live', [['thầy→S1', P0.thay, P0.s1, 'nhanDau'], ['thầy→S2', P0.thay, P0.s2, 'nhanDau']])

  // ── GỌI S1 LÊN BẢNG (lệnh của bảng Bình Phản Ứng) ⇒ LopLive tự bật mic qua cửa thật + phòng thật ──
  await thay.evaluate(() => window.__ws.send(JSON.stringify({ t: 'goi', sbd: 'S1', lyDo: ['Chưa lên bảng buổi này'] })))
  const t0 = Date.now()
  await s1.waitForFunction(() => !!window.__chon('gui'), null, { timeout: 20_000 }).catch(() => null)
  ketQua.micEmMs = Date.now() - t0
  await ngu(4000)
  const P1 = await pha('P1 gọi S1', VAI_NOI)
  cham(P1, 'P1 gọi S1', [['thầy→S1', P1.thay, P1.s1, 'nhanDau'], ['thầy→S2', P1.thay, P1.s2, 'nhanDau'], ['S1→thầy', P1.s1, P1.thay, 'nhanCuoi', '«Phát tiếng em ra loa lớp» mặc định tắt'], ['S1→S2', P1.s1, P1.s2, 'nhanCuoi']])

  // ── THẦY BẬT «Phát tiếng em ra loa lớp» trên tờ ──
  await to.locator('[data-nghe="1"]').click({ timeout: 8000 }).catch((e) => loiTrang.push(`không bấm được «Phát tiếng em»: ${String(e.message).slice(0, 80)}`))
  await ngu(5000)
  const P2 = await pha('P2 bật phát tiếng em', VAI_NOI)
  cham(P2, 'P2 bật phát tiếng em', [['thầy→S1', P2.thay, P2.s1, 'nhanDau'], ['thầy→S2', P2.thay, P2.s2, 'nhanDau'], ['S1→thầy', P2.s1, P2.thay, 'nhanCuoi'], ['S1→S2', P2.s1, P2.s2, 'nhanCuoi']])

  // ── CỬA SỔ NÚT LIVE: «N em đang nghe» + dòng đo tiếng từ xa (qua phòng thật) ──
  await ngu(6000)
  await to.locator('.mc-lv-cum').click() // đang live: viên Live mở lại cửa sổ
  await to.locator('.mc-lv-the').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => null)
  await ngu(1500)
  const the = (await to.locator('.mc-lv-the').innerText().catch(() => '')).replace(/[ \t]+/g, ' ')
  const soNghe = Number((the.match(/(\d+)\s*em đang nghe qua máy/) ?? [])[1] ?? -1)
  const dongDo = (await to.locator('.mc-lv-the .mc-lv-cd[role="status"]').innerText().catch(() => '')).split('\n').map((x) => x.trim()).filter(Boolean)
  ketQua.cuaSo = { soNghe, dongDo }
  const s2Dong = dongDo.find((x) => /S2|Lê Gia Huy/.test(x)) ?? ''
  if (CHAN_UDP) {
    const s2Ui = (await s2.locator('body').innerText().catch(() => '')).match(/[^\n]*(chặn tiếng|Mạng)[^\n]*/)?.[0] ?? ''
    ketQua.udp = { s2Dong, s2Ui, s2Pc: P2.s2.pc, thayPc: P2.thay.pc, vienLive: (await to.locator('.mc-lv-cum').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 120), dongDo }
    const baoThay = /⚠/.test(s2Dong), s2Cam = !!P2.s2.pc && P2.s2.pc.ice !== 'connected' && P2.s2.pc.ice !== 'completed'
    dong.push(`| ${NHAN} · S2 chặn UDP | báo rõ | thầy / S2 | — | — | ICE S2: ${P2.s2.pc?.ice ?? 'không phiên'} | — | ${s2Cam ? (baoThay ? 'S2 câm (mạng chặn) · máy thầy BÁO RÕ' : 'S2 câm · máy thầy KHÔNG báo') : 'S2 có tiếng qua TCP / đường khác'}${s2Ui ? ' · màn S2: «' + s2Ui.slice(0, 60) + '»' : ''} |`)
    if (s2Cam && !baoThay) ma = 1
  } else {
    const ok = soNghe === 2 && dongDo.filter((x) => /loa đang phát/.test(x)).length >= 2
    dong.push(`| ${NHAN} | cửa sổ nút Live | đo từ xa | — | — | — | — | ${ok ? 'ĐẠT' : 'KHÔNG'}: «${soNghe} em đang nghe» · ${dongDo.length} dòng đo${dongDo.length ? ' · ' + dongDo.slice(0, 3).join(' | ').slice(0, 220) : ''} |`)
    if (!ok) ma = 1
  }
} catch (e) {
  ma = 1
  dong.push(`| ${NHAN} | — | — | — | — | — | — | KỊCH BẢN DỪNG: ${String(e?.message ?? e).slice(0, 300)} |`)
} finally {
  await trinh.close().catch(() => {})
  if (trinhUdp !== trinh) await trinhUdp.close().catch(() => {})
  await may.dong().catch(() => {})
}
if (loi() > 0) ma = 1
const tieuDe = `== PHÒNG THẬT + GIAO DIỆN + SFU THẬT · ${NHAN} · mic giả ${mau.kenh.length} kênh · lọc ồn ${LOC_ON}${UDP_HE ? ' · CẢ MÁY CHẶN UDP' : CHAN_UDP ? ' · S2 CHẶN UDP' : ''} ==`
const bang = ['| bản | pha | chiều | 0 mic vào | 1 phía gửi | 2 phía nhận | 3 phần tử phát | kết luận |', '|---|---|---|---|---|---|---|---|', ...dong]
console.log(`\n${tieuDe}`)
for (const d of bang) console.log(d)
console.log(`ICE / phiên: ${JSON.stringify(ketQua.pha)}`)
console.log(`Cửa sổ trước khi bật: ${ketQua.theTruocBat ?? ''}`)
console.log(`Cửa sổ khi live: ${JSON.stringify(ketQua.cuaSo ?? {})}${ketQua.udp ? ' · UDP: ' + JSON.stringify(ketQua.udp) : ''} · mic em bật sau ${ketQua.micEmMs ?? '?'} ms`)
console.log(`Lệnh qua cửa /bpu/live/*: ${JSON.stringify(demCua)}`)
if (loiTrang.length) console.log(`Lỗi trang: ${loiTrang.join(' | ').slice(0, 600)}`)
console.log(`KẾT: ${ma ? 'CÓ CHIỀU CÂM / KHÔNG BÁO' : 'MỌI CHIỀU ĐẠT'}`)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### ${tieuDe}\n\n${bang.join('\n')}\n\n`)
process.exit(ma)
