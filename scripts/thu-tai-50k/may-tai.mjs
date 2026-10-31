// MÁY TẢI «50.000 EM CÙNG LÚC» (31/10) — Node ≥ 22, KHÔNG phụ thuộc gói nào (fetch có sẵn, giữ kết nối mặc định của undici).
// Mỗi tiến trình chạy MỘT LÁT em ảo (em thứ e với (e-1) % TONG_PHAN == PHAN), mọi em ảo chạy xen nhau trên cùng vòng sự kiện.
//
// MỘT EM ẢO (khớp app thật + nhịp đo máy thật 30/10 21:40 — ~200 em / 120 s):
//   mở app  : hoc-tap-sanh + hs/ke-hoach-ngay + hs/ca-dang-mo + hs/buoi-hoc + presence (song song, như nap-truoc-man-em.ts)
//   vòng học: hoc-tap-sanh → hs/ke-hoach-ngay → academic-sync → hoc-tap-start → trả lời 1–3 câu (nghĩ 5–15 s / câu; sau câu 50 % hoc-tap-dem;
//             câu đầu kèm hs/goi-y-so-do) → hs/thuong (70 %) → hoc-tap-sanh → nghỉ (trung bình NGHI_S giây)
//   nền     : presence 165 s · hs/chua-cau-sai (co|danh-sach) 85 s · hs/ca-dang-mo + hs/buoi-hoc 220 s · mom/list 330 s · notifications/list 420 s
//   ⇒ ~3,5 lệnh / phút / em, tỉ lệ từng đường gần đúng nhịp đo máy thật (in ra ở cuối: «lệnh/phút/em»).
// Token: máy tải TỰ KÝ (cùng công thức server/src/game-v2-auth.ts gameToken) bằng MA_BI_MAT của Worker THỬ (biến môi trường, không in ra).
//
// Chạy: MA_BI_MAT=… node scripts/thu-tai-50k/may-tai.mjs --goc https://omr-thu.x.workers.dev --so-em 500 --phan 0 --tong-phan 1 \
//         --ramp 60 --on-dinh 180 [--bat-dau <ms epoch>] [--so-em-dau 1] --ra ket-qua.json
// Dừng sớm: tỉ lệ lỗi 30 giây gần nhất > 20 % (≥ 200 lệnh) ⇒ dừng lát này, ghi `dungSom`.
import { createHmac, createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'

const tham = (ten, md) => { const i = process.argv.indexOf(`--${ten}`); return i > 0 ? process.argv[i + 1] : md }
const GOC = String(tham('goc', process.env.GOC ?? '')).replace(/\/+$/, '')
const SO_EM = Number(tham('so-em', 500)), PHAN = Number(tham('phan', 0)), TONG_PHAN = Number(tham('tong-phan', 1))
const SO_EM_DAU = Number(tham('so-em-dau', 1)) // em ảo thứ e dùng SBD của em (SO_EM_DAU + e - 1)
const RAMP_MS = Number(tham('ramp', 60)) * 1000, ON_DINH_MS = Number(tham('on-dinh', 180)) * 1000
const NGHI_S = Number(tham('nghi', 340))
const RA = tham('ra', 'ket-qua.json')
const GIAI_DOAN = String(tham('giai-doan', SO_EM))
const BAT_DAU = Number(tham('bat-dau', 0)) || Date.now() + 2000
const MA = process.env.MA_BI_MAT ?? ''
if (!GOC || !MA) { console.error('Thiếu --goc hoặc MA_BI_MAT'); process.exit(2) }
const HET_GIO_MS = 30_000
const TRE_BAT_DAU_MS = Math.max(0, Date.now() - BAT_DAU) // runner nhận việc muộn hơn mốc chung

// ---- token (y hệt gameToken: payload = btoa(JSON {sbd,exp,pwd}), pwd = hash(mat_khau) = sha256 hex của JSON.stringify(mat_khau)) ----
const PWD = createHash('sha256').update(JSON.stringify('mk')).digest('hex')
const sbdThu = (e) => (e <= 3 ? `S${e}` : `E${e}`)
function kyToken(sbd) {
  const payload = Buffer.from(JSON.stringify({ sbd, exp: Date.now() + 2 * 86_400_000, pwd: PWD })).toString('base64')
  return `${payload}.${createHmac('sha256', MA).update(payload).digest('hex')}`
}

// ---- đo ----
const tuyen = new Map() // đường → số liệu
const chuoi = new Map() // giây thứ (bội 10) → {n, loi}
const gan = [] // [t, loi] 30 s gần nhất (dừng sớm)
let dangChay = true, dungSom = null, dangBay = 0, dinhBay = 0
const noiChay = {}
const giaiDoanCua = (t) => (t < BAT_DAU + RAMP_MS ? 'ramp' : t < BAT_DAU + RAMP_MS + ON_DINH_MS ? 'onDinh' : 'sau')
function ghiDo(duong, t0, ms, ok, ngan, loi) {
  let o = tuyen.get(duong)
  if (!o) { o = { ramp: { n: 0, loi: 0, ngan: 0, ms: [] }, onDinh: { n: 0, loi: 0, ngan: 0, ms: [] }, sau: { n: 0, loi: 0, ngan: 0, ms: [] }, loiKieu: {} }; tuyen.set(duong, o) }
  const g = o[giaiDoanCua(t0)]
  g.n++; g.ms.push(Math.round(ms)); if (ngan) g.ngan++
  if (!ok) { g.loi++; const k = String(loi).slice(0, 90); o.loiKieu[k] = (o.loiKieu[k] ?? 0) + 1 }
  const s = Math.floor((t0 - BAT_DAU) / 10_000) * 10
  const c = chuoi.get(s) ?? { n: 0, loi: 0, ms: [] }; c.n++; if (!ok) c.loi++; c.ms.push(Math.round(ms)); chuoi.set(s, c)
  const now = Date.now(); gan.push([now, ok ? 0 : 1])
}
setInterval(() => {
  const now = Date.now()
  while (gan.length && gan[0][0] < now - 30_000) gan.shift()
  const loi = gan.reduce((a, x) => a + x[1], 0)
  if (!dungSom && gan.length >= 200 && loi / gan.length > 0.2) {
    dungSom = { luc: now - BAT_DAU, tiLe: Math.round((loi / gan.length) * 1000) / 10, soLenh30s: gan.length }
    console.log(`DỪNG SỚM: lỗi ${dungSom.tiLe}% trong 30 s gần nhất (${gan.length} lệnh) ở giây ${Math.round(dungSom.luc / 1000)}`)
    dangChay = false
  }
}, 2000).unref()

async function goi(duong, than, tenDo = duong) {
  const t0 = Date.now(); dangBay++; if (dangBay > dinhBay) dinhBay = dangBay
  let ok = false, ngan = false, loi = '', j = null
  try {
    const r = await fetch(`${GOC}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(than), signal: AbortSignal.timeout(HET_GIO_MS) })
    ngan = r.headers.get('x-ngan') === '1'
    // Nơi Worker chạy (smart placement: `cf-placement: remote-HKG` / `local-IAD`) + colo biên (đuôi cf-ray) — để đọc độ trễ cho đúng.
    const k = `${r.headers.get('cf-placement') ?? 'không có cf-placement'} · biên ${String(r.headers.get('cf-ray') ?? '').split('-')[1] ?? '?'}`
    noiChay[k] = (noiChay[k] ?? 0) + 1
    const chu = await r.text()
    try { j = JSON.parse(chu) } catch { j = null }
    if (r.status !== 200) loi = `HTTP ${r.status}${j ? ` ${j.maLoi ?? j.ma ?? ''} ${j.error ?? ''}`.trimEnd() : ` ${chu.slice(0, 60).replace(/\s+/g, ' ')}`}`
    else if (!j) loi = 'không phải JSON'
    else if (j.ok === false) loi = `ok:false ${j.maLoi ?? j.ma ?? ''} ${j.error ?? j.loi ?? ''}`.trimEnd()
    else ok = true
  } catch (e) {
    loi = e?.name === 'TimeoutError' ? `hết giờ ${HET_GIO_MS / 1000}s` : `mạng: ${e?.cause?.code ?? e?.name ?? e}`
  } finally { dangBay-- }
  ghiDo(tenDo, t0, Date.now() - t0, ok, ngan, loi)
  return ok ? j : null
}

const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const ngauNhien = (a, b) => a + Math.random() * (b - a)
const conChay = () => dangChay && Date.now() < BAT_DAU + RAMP_MS + ON_DINH_MS
/** Ngủ tới khi hết `ms` hoặc hết giờ chạy (kiểm 1 s / lần) — em ảo dừng gọn khi lát dừng. */
async function nguToi(ms) { const het = Date.now() + ms; while (conChay() && Date.now() < het) await ngu(Math.min(1000, het - Date.now())) }

const DAP_AN = { I: 'A', II: 'DSDD', III: '4' }
const thongKeEm = { cauTraLoi: 0, cauDung: 0, startKhongCau: 0, vongHoc: 0 }

async function vongNen(khoangS, viec) {
  await nguToi(ngauNhien(0, khoangS * 1000))
  while (conChay()) { await viec(); await nguToi(khoangS * 1000 * ngauNhien(0.8, 1.2)) }
}

async function emAo(e) {
  const sbd = sbdThu(SO_EM_DAU + e - 1)
  await ngu(Math.max(0, BAT_DAU - Date.now()) + ngauNhien(0, RAMP_MS))
  if (!conChay()) return
  const token = kyToken(sbd)
  const tk = { token }
  const phien = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${e}`
  // Mở app: các lệnh màn đầu song song.
  await Promise.all([
    goi('/game-v2/hoc-tap-sanh', tk), goi('/hs/ke-hoach-ngay', tk), goi('/hs/ca-dang-mo', tk), goi('/hs/buoi-hoc', tk), goi('/presence', { session: phien, role: 'hs' }),
  ])
  const nen = [
    vongNen(165, () => goi('/presence', { session: phien, role: 'hs' })),
    vongNen(85, () => (Math.random() < 0.5 ? goi('/hs/chua-cau-sai/co', tk) : goi('/hs/chua-cau-sai/danh-sach', tk))),
    vongNen(220, () => Promise.all([goi('/hs/ca-dang-mo', tk), goi('/hs/buoi-hoc', tk)])),
    vongNen(330, () => goi('/mom/list', tk)),
    vongNen(420, () => goi('/notifications/list', tk)),
  ]
  // Pha ngẫu nhiên: vòng học đầu bắt đầu rải đều trong một chu kỳ (tải ổn định, không dồn mọi em vào cùng phút).
  await nguToi(ngauNhien(0, NGHI_S * 1000))
  while (conChay()) {
    thongKeEm.vongHoc++
    await goi('/game-v2/hoc-tap-sanh', tk)
    await goi('/hs/ke-hoach-ngay', tk)
    await goi('/game-v2/academic-sync', { token, mom: [] })
    const s = await goi('/game-v2/hoc-tap-start', tk)
    const cau = Array.isArray(s?.questions) ? s.questions : []
    if (s && !cau.length) thongKeEm.startKhongCau++
    const k = Math.min(cau.length, 1 + Math.floor(Math.random() * 3))
    for (let i = 0; i < k && conChay(); i++) {
      const nghi = ngauNhien(5000, 15000)
      await nguToi(nghi)
      if (!conChay()) break
      const c = cau[i]
      const r = await goi('/game-v2/answer', { session: s.id, qid: c.qid, answer: DAP_AN[c.phan] ?? 'A', assisted: false, msLam: Math.round(nghi), token })
      if (r) { thongKeEm.cauTraLoi++; if (r.correct === true || r.dung === true) thongKeEm.cauDung++ }
      if (i === 0) await goi('/hs/goi-y-so-do', { token, qid: c.qid, session: s.id })
      if (Math.random() < 0.5) await goi('/game-v2/hoc-tap-dem', tk)
    }
    if (Math.random() < 0.7) await goi('/hs/thuong', tk)
    await goi('/game-v2/hoc-tap-sanh', tk)
    await nguToi(NGHI_S * 1000 * ngauNhien(0.5, 1.5))
  }
  await Promise.all(nen)
}

// ---- chạy ----
const ds = []
for (let e = 1 + PHAN; e <= SO_EM; e += TONG_PHAN) ds.push(e)
console.log(`Giai đoạn ${GIAI_DOAN}: lát ${PHAN}/${TONG_PHAN} — ${ds.length} em ảo · ramp ${RAMP_MS / 1000}s · ổn định ${ON_DINH_MS / 1000}s · bắt đầu sau ${Math.round((BAT_DAU - Date.now()) / 1000)}s`)
const nhip = setInterval(() => {
  const t = Math.round((Date.now() - BAT_DAU) / 1000)
  let n = 0, l = 0
  for (const o of tuyen.values()) for (const g of [o.ramp, o.onDinh, o.sau]) { n += g.n; l += g.loi }
  console.log(`  t=${t}s · lệnh ${n} · lỗi ${l} · đang bay ${dangBay}`)
}, 30_000)
await Promise.all(ds.map((e) => emAo(e)))
clearInterval(nhip)

const ket = {
  giaiDoan: GIAI_DOAN, phan: PHAN, tongPhan: TONG_PHAN, soEmAo: ds.length, soEmGiaiDoan: SO_EM, batDau: BAT_DAU, ketThuc: Date.now(), rampMs: RAMP_MS, onDinhMs: ON_DINH_MS,
  treBatDauMs: TRE_BAT_DAU_MS, dungSom, dinhBay, thongKeEm, noiChay,
  tuyen: Object.fromEntries(tuyen), chuoi: Object.fromEntries([...chuoi].sort((a, b) => a[0] - b[0])),
}
writeFileSync(RA, JSON.stringify(ket))
let n = 0, l = 0, nOd = 0
for (const o of tuyen.values()) { for (const g of [o.ramp, o.onDinh, o.sau]) { n += g.n; l += g.loi } nOd += o.onDinh.n }
console.log(`Xong: ${n} lệnh · lỗi ${l} (${n ? ((l / n) * 100).toFixed(1) : 0}%) · ổn định ${nOd} lệnh = ${(nOd / ds.length / (ON_DINH_MS / 60000)).toFixed(2)} lệnh/phút/em · đỉnh đang bay ${dinhBay} · ${JSON.stringify(thongKeEm)}`)
process.exit(0)
