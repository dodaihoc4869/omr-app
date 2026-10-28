// THỬ TẢI GIỜ CAO ĐIỂM 28/10 — CHỈ bắn vào Worker SAO `omr-thu-tai` (D1 sao). Không bao giờ gọi bản thật.
// Mô phỏng N em cùng học: mở app (loạt hỏi sớm song song như index.html: Sảnh + kế hoạch + ca đang mở + buổi học + lịch sử + thưởng + thông báo)
// ⇒ mở chặng ⇒ nộp tối đa 6 câu (nghĩ 3–15 s/câu, sau mỗi câu `hoc-tap-dem` như màn thật) ⇒ về Sảnh ⇒ lặp tới hết giờ.
// Nền mỗi em: /hs/thuong 60 ± 10 s, /notifications/list 180 ± 30 s. Một máy thầy hỏi Bảng tin sống 30 s/lần. Đầu dò /khoe 5 s/lần (không chạm D1) = đo mạng.
// Token ký bằng mã bí mật CỦA BẢN SAO (dẫn xuất trong runner) cho mật khẩu thử đã ghi vào D1 sao — không dùng mật khẩu thật.
// In ra: CHỈ số đếm + phân vị theo lệnh. Không in SBD, tên, nội dung câu.
// Env: GOC (URL Worker sao), SEED (mã bí mật sao), DS_EM (tệp JSON kết quả `SELECT sbd FROM thu_tai_em`), SO_EM, PHUT, PHUT_LEN (dồn em vào), RA (tệp JSON kết quả).
import fs from 'node:fs'
import crypto from 'node:crypto'

const GOC = String(process.env.GOC || '').replace(/\/+$/, '')
if (!/^https:\/\/omr-thu-tai\./.test(GOC)) { console.error('DỪNG: chỉ được bắn vào Worker sao omr-thu-tai'); process.exit(1) }
const SEED = String(process.env.SEED || '')
if (SEED.length < 32) { console.error('Thiếu SEED'); process.exit(1) }
const SO_EM = Number(process.env.SO_EM || 270), PHUT = Number(process.env.PHUT || 12), PHUT_LEN = Number(process.env.PHUT_LEN || 2)
const raw = JSON.parse(fs.readFileSync(process.env.DS_EM, 'utf8'))
const dsEm = (Array.isArray(raw) ? raw[0]?.results ?? raw : []).map((r) => String(r.sbd)).filter(Boolean).slice(0, SO_EM)
console.log(`Số em thử: ${dsEm.length} · ${PHUT} phút đo · dồn vào trong ${PHUT_LEN} phút`)

const hex = (b) => Buffer.from(b).toString('hex')
const sha = (v) => hex(crypto.createHash('sha256').update(JSON.stringify(v)).digest())
const ky = (payload) => hex(crypto.createHmac('sha256', SEED).update(payload).digest())
const matKhauThu = (sbd) => `tt-${SEED.slice(0, 16)}-${sbd}`
const token = (sbd) => { const p = Buffer.from(JSON.stringify({ sbd, exp: Date.now() + 2 * 86400000, pwd: sha(matKhauThu(sbd)) }), 'binary').toString('base64'); return `${p}.${ky(p)}` }

const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const ng = (a, b) => a + Math.random() * (b - a)

// DỰNG SẴN (lệnh `dung-san` trong lenh.txt, chỉ lượt đo chính): D1 sao về trạng thái như bản thật trước giờ học — chụp hồ sơ OMNI đêm cho mọi em
// (route sao `/thu-tai/chup`), rồi mỗi em mở Sảnh một lần (6 em song song) ⇒ bản sẵn, điểm gọn, prior lớp, bản chụp kho có đủ. Không tính vào số đo.
if (SO_EM > 10 && /^dung-san\b/m.test(fs.readFileSync(new URL('./lenh.txt', import.meta.url), 'utf8'))) {
  const t0 = Date.now()
  let sau = '', so = 0
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(GOC + '/thu-tai/chup', { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': SEED }, body: JSON.stringify({ sau, n: 12 }) }); const j = await r.json(); if (!j.ok || !j.cuoi) break; so += j.so; sau = j.cuoi } catch (e) { console.log('  chụp lỗi:', String(e?.message).slice(0, 80)); break }
  }
  console.log(`Dựng sẵn: chụp hồ sơ ${so} em · ${Math.round((Date.now() - t0) / 1000)} s`)
  const hang = [...dsEm]
  await Promise.all(Array.from({ length: 6 }, async () => { for (let sbd = hang.shift(); sbd; sbd = hang.shift()) { try { const r = await fetch(GOC + '/game-v2/hoc-tap-sanh', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: token(sbd) }) }); await r.text() } catch { /* bỏ */ } } }))
  console.log(`Dựng sẵn: Sảnh ${dsEm.length} em · ${Math.round((Date.now() - t0) / 1000)} s`)
  await ngu(45_000)
}
// HÂM MÁY (Smart Placement): Worker mới chạy ở trạm gần runner (Mỹ), D1 ở APAC ⇒ mỗi truy vấn ~200 ms. Bản thật đã được Cloudflare dời về sát D1.
// Bắn nhẹ (30 em, Sảnh 3 s/lần) tới khi ≥ 90% phản hồi 60 s gần nhất có `cf-placement: remote-*`, tối đa AM_PHUT phút. Không tính vào số đo.
{
  const AM = Number(process.env.AM_PHUT || 0), het = Date.now() + AM * 60_000
  let gan = [], tLog = 0
  const xa = () => { const t = Date.now() - 60_000; gan = gan.filter((x) => x.t >= t); return gan.length ? gan.filter((x) => x.xa).length / gan.length : 0 }
  if (AM > 0) {
    console.log(`Hâm máy tối đa ${AM} phút…`)
    let du = false, tuLuc = 0
    await Promise.all(dsEm.slice(0, 30).map(async (sbd) => {
      const tk = token(sbd)
      while (!du && Date.now() < het) {
        try { const r = await fetch(GOC + '/game-v2/hoc-tap-sanh', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: tk }) }); await r.text(); gan.push({ t: Date.now(), xa: /^remote/.test(r.headers.get('cf-placement') || '') }) } catch { /* bỏ */ }
        const ty = xa()
        if (ty >= 0.9 && gan.length >= 100) { tuLuc ||= Date.now(); if (Date.now() - tuLuc > 90_000) du = true } else tuLuc = 0
        if (Date.now() - tLog > 60_000) { tLog = Date.now(); console.log(`  hâm: ${Math.round((Date.now() - het + AM * 60_000) / 1000)} s · remote ${Math.round(ty * 100)}% (${gan.length} mẫu/60 s)`) }
        await ngu(ng(2_000, 4_000))
      }
    }))
    console.log(du ? 'Hâm xong: Worker đã chạy sát D1.' : `Hết giờ hâm, remote ${Math.round(xa() * 100)}% — đo tiếp, ghi chú kết quả.`)
  }
}
const BAT_DAU = Date.now(), HET = BAT_DAU + (PHUT_LEN + PHUT) * 60_000, DO_TU = BAT_DAU + PHUT_LEN * 60_000
const so = {} // ten -> {ms:[], trang:{}, loi:{}}
const dem = (ten) => (so[ten] ??= { ms: [], msDu: [], trang: {}, loi: {}, tre: 0 })
const noiDat = {}
const VET = {} // ten -> [{ms, w, d:[[a,b,sql,n,dur]]}]
const anLoi = (s) => String(s ?? '').replace(/\d{3,}/g, '#').replace(/"[^"]*"/g, '"…"').slice(0, 90)

async function goi(ten, duong, than, { giay = 30, get = false, dau = {} } = {}) {
  const t0 = performance.now(), ms_ = [].concat(ten).map(dem), m = ms_[0], trongDo = Date.now() >= DO_TU
  const c = new AbortController(), hen = setTimeout(() => c.abort(), giay * 1000)
  try {
    const r = await fetch(GOC + duong, get ? { signal: c.signal, headers: { ...dau, 'x-vet': '1' } } : { method: 'POST', headers: { 'content-type': 'application/json', 'x-vet': '1', ...dau }, body: JSON.stringify(than), signal: c.signal })
    const chu = await r.text()
    const ms = performance.now() - t0
    const xv = r.headers.get('x-vet')
    if (xv && trongDo) { const k = [].concat(ten)[0]; const a = (VET[k] ??= []); if (a.length < 600) { try { a.push({ ms, ...JSON.parse(decodeURIComponent(xv)) }) } catch { /* */ } } }
    const pl = r.headers.get('cf-placement') || 'khong'
    noiDat[pl] = (noiDat[pl] || 0) + 1
    let j = null; try { j = JSON.parse(chu) } catch { /* không phải JSON */ }
    if (trongDo) for (const m of ms_) {
      m.ms.push(ms)
      m.trang[r.status] = (m.trang[r.status] || 0) + 1
      if (r.status >= 400 || (j && j.ok === false)) { const k = `${r.status} ${anLoi(j?.error ?? j?.message ?? chu.slice(0, 60))}`; m.loi[k] = (m.loi[k] || 0) + 1 }
    }
    return j ?? {}
  } catch (e) {
    if (trongDo) for (const m of ms_) { m.tre++; m.ms.push(performance.now() - t0); const k = e?.name === 'AbortError' ? `quá ${giay}s` : `mạng ${anLoi(e?.message)}`; m.loi[k] = (m.loi[k] || 0) + 1 }
    return {}
  } finally { clearTimeout(hen) }
}

const soChang = { mo: 0, rong: 0, cau: 0, lyDo: {} } // hết việc ⇒ em nghỉ 3–6 phút (như rời app) rồi mới mở lại — không dồn Sảnh liên tục
async function em(sbd) {
  const tk = token(sbd)
  await ngu(ng(0, PHUT_LEN * 60_000))
  // Nền: thưởng (công tắc tạm đóng) 60 s, thông báo 180 s.
  const cho = (ms) => ngu(Math.max(0, Math.min(ms, HET - Date.now())))
  const nen = (ten, duong, coSo, lech) => (async () => { await cho(ng(5_000, coSo)); while (Date.now() < HET) { await goi(ten, duong, { token: tk }); await cho(coSo + ng(-lech, lech)) } })()
  const ds = [nen('nen_thuong', '/hs/thuong', 60_000, 10_000), nen('nen_thong_bao', '/notifications/list', 180_000, 30_000)]
  // Mở app: loạt hỏi sớm song song (nap-truoc-man-em.ts) — đo Sảnh riêng + cả loạt.
  const t0 = performance.now()
  await Promise.all([
    goi(['sanh', 'sanh_mo_app'], '/game-v2/hoc-tap-sanh', { token: tk }),
    goi('mo_ke_hoach_ngay', '/hs/ke-hoach-ngay', { token: tk }),
    goi('mo_ca_dang_mo', '/hs/ca-dang-mo', { token: tk }),
    goi('mo_buoi_hoc', '/hs/buoi-hoc', { token: tk }),
    goi('mo_lich_su', '/hs/lich-su', { sbd }),
    goi('mo_thuong', '/hs/thuong', { token: tk }),
    goi('mo_thong_bao', '/notifications/list', { token: tk }),
  ])
  if (Date.now() >= DO_TU) dem('mo_app_ca_loat').ms.push(performance.now() - t0)
  while (Date.now() < HET) {
    await ngu(ng(2_000, 6_000))
    const s = await goi('mo_chang', '/game-v2/hoc-tap-start', { token: tk }, { giay: 40 })
    const cau = Array.isArray(s.questions) ? s.questions : []
    soChang.mo++
    if (!s.id || !cau.length) { soChang.rong++; const ly = anLoi(s.error ?? s.message ?? '').slice(0, 50); soChang.lyDo[ly] = (soChang.lyDo[ly] || 0) + 1; await cho(ng(180_000, 360_000)); if (Date.now() >= HET) break; await goi(['sanh', 'sanh_ve'], '/game-v2/hoc-tap-sanh', { token: tk }); continue }
    for (const q of cau.slice(0, 6)) {
      if (Date.now() >= HET) break
      const nghi = ng(3_000, 15_000)
      await ngu(nghi)
      const tra = q.phan === 'I' ? 'ABCD'[Math.floor(Math.random() * 4)] : q.phan === 'II' ? Array.from({ length: 4 }, () => (Math.random() < 0.5 ? 'D' : 'S')).join('') : String(Math.floor(Math.random() * 10 ** Math.max(1, Math.min(4, Number(q.soO) || 4))))
      const r = await goi('nop_cau', '/game-v2/answer', { token: tk, session: s.id, qid: q.qid, answer: tra, assisted: false, msLam: Math.round(nghi) }, { giay: 15 })
      if (typeof r.correct === 'boolean') soChang.cau++
      void goi('dem_sau_cau', '/game-v2/hoc-tap-dem', { token: tk }, { giay: 20 })
      await ngu(ng(1_500, 4_000)) // đọc kết quả câu
    }
    await goi(['sanh', 'sanh_ve'], '/game-v2/hoc-tap-sanh', { token: tk }) // về Sảnh
  }
  await Promise.all(ds)
}

async function thay() {
  while (Date.now() < HET) { await goi('thay_bang_tin', '/gv/bang-tin-song', {}, { dau: { 'x-ma-bi-mat': SEED } }); await ngu(Math.max(0, Math.min(30_000, HET - Date.now()))) }
}
async function doMang() {
  while (Date.now() < HET) { await goi('khoe_mang', '/khoe', null, { get: true, giay: 10 }); await ngu(Math.max(0, Math.min(5_000, HET - Date.now()))) }
}

const pv = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))]) }
const theoPhut = {}
const nhip = setInterval(() => {
  if (Date.now() < DO_TU) return
  const ph = Math.floor((Date.now() - DO_TU) / 60_000)
  const cat = (t) => { const m = so[t]; if (!m) return null; const a = m.ms.slice(m._da || 0); m._da = m.ms.length; return { n: a.length, p50: pv(a, 0.5), p95: pv(a, 0.95) } }
  theoPhut[ph] = { sanh: cat('sanh'), mo_chang: cat('mo_chang'), nop_cau: cat('nop_cau') }
}, 60_000)

await Promise.all([...dsEm.map((s) => em(s).catch(() => {})), thay(), doMang()])
clearInterval(nhip)
const bang = {}
for (const [ten, m] of Object.entries(so)) {
  const loi5xx = Object.entries(m.trang).filter(([k]) => Number(k) >= 500).reduce((n, [, v]) => n + v, 0)
  bang[ten] = { n: m.ms.length, p50: pv(m.ms, 0.5), p95: pv(m.ms, 0.95), p99: pv(m.ms, 0.99), max: pv(m.ms, 1), loi5xx, quaGio: m.tre, trang: m.trang, loiHay: Object.entries(m.loi).sort((a, b) => b[1] - a[1]).slice(0, 4) }
}
const kq = { goc: GOC.replace(/\/\/[^.]+/, '//omr-thu-tai'), soEm: dsEm.length, phut: PHUT, batDauDo: new Date(DO_TU).toISOString(), ketThuc: new Date().toISOString(), noiDat, soChang, bang, theoPhut }
fs.writeFileSync(process.env.RA || 'ket-qua-tai.json', JSON.stringify(kq, null, 1))
console.log('=== KẾT QUẢ (ms, đo từ runner) ===')
for (const [ten, b] of Object.entries(bang)) console.log(`${ten.padEnd(18)} n=${String(b.n).padStart(5)} p50=${b.p50} p95=${b.p95} p99=${b.p99} max=${b.max} 5xx=${b.loi5xx} quáGiờ=${b.quaGio} trạng=${JSON.stringify(b.trang)}${b.loiHay.length ? ' lỗi=' + JSON.stringify(b.loiHay) : ''}`)
console.log('Nơi chạy Worker (cf-placement):', JSON.stringify(noiDat))
console.log('Chặng:', JSON.stringify(soChang))
console.log('Theo phút (sanh/mo_chang/nop_cau p50·p95):')
for (const [ph, v] of Object.entries(theoPhut)) console.log(`  phút ${ph}: ` + ['sanh', 'mo_chang', 'nop_cau'].map((k) => v[k] ? `${k} ${v[k].n}× ${v[k].p50}·${v[k].p95}` : `${k} -`).join(' | '))

// ── VẾT D1 (Worker sao VET=1): mỗi lệnh — wall Worker, số lượt D1, số đợt (gộp khoảng chồng), thời gian chờ D1 trên đường (phủ), D1 tự báo; câu tốn nhất.
{
  const p = (a, q) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.floor(q * s.length))]) }
  console.log('=== VẾT D1 theo lệnh (p50 · p95) ===')
  for (const [ten, ds] of Object.entries(VET)) {
    const hang = ds.map((v) => {
      const kh = (v.d || []).filter((x) => x[0] <= v.w).map((x) => [x[0], x[1]]).sort((a, b) => a[0] - b[0])
      let dot = 0, cuoi = -1, phu = 0
      for (const [a, b] of kh) { if (a > cuoi) { dot++; phu += b - a; cuoi = b } else if (b > cuoi) { phu += b - cuoi; cuoi = b } }
      const d1 = (v.d || []).reduce((n, x) => n + (x[4] || 0), 0)
      return { ms: v.ms, w: v.w, n: (v.d || []).length, dot, phu, ngoai: v.w - phu, d1, dau: kh.length ? kh[0][0] : v.w }
    })
    const f = (k) => `${p(hang.map((h) => h[k]), 0.5)}·${p(hang.map((h) => h[k]), 0.95)}`
    console.log(`${ten.padEnd(16)} n=${hang.length} runner=${f('ms')} worker=${f('w')} lượt=${f('n')} đợt=${f('dot')} chờD1=${f('phu')} ngoàiD1=${f('ngoai')} D1báo=${f('d1')} lượtĐầuLúc=${f('dau')}`)
    // câu tốn: tổng (b-a) / số yêu cầu, và trung bình mỗi lượt
    const cau = new Map()
    for (const v of ds) for (const x of v.d || []) { const k = String(x[2]).slice(0, 70); const o = cau.get(k) ?? { t: 0, n: 0, d: 0, r: 0 }; o.t += x[1] - x[0]; o.n++; o.d += x[4] || 0; o.r += x[3] || 0; cau.set(k, o) }
    for (const [k, o] of [...cau].sort((a, b) => b[1].t - a[1].t).slice(0, 8)) console.log(`   ${String(Math.round(o.t / ds.length)).padStart(5)} ms/yc · ${(o.n / ds.length).toFixed(1)} lượt/yc · tb ${Math.round(o.t / o.n)} ms · D1 ${(o.d / o.n).toFixed(1)} ms · ${Math.round(o.r / o.n)} dòng | ${k}`)
  }
  { const sv = {}; for (const ds of Object.values(VET)) for (const v of ds) for (const x of v.sv || []) sv[x] = (sv[x] || 0) + 1; console.log('D1 phục vụ bởi:', JSON.stringify(sv)) }
  // một vết mẫu Sảnh (trung vị) để nhìn thứ tự
  const s = (VET.sanh || []).slice().sort((a, b) => a.w - b.w)
  const m = s[Math.floor(s.length / 2)]
  if (m) { console.log(`Vết Sảnh trung vị (worker ${m.w} ms, runner ${Math.round(m.ms)} ms):`); for (const x of (m.d || []).slice().sort((a, b) => a[0] - b[0]).slice(0, 45)) console.log(`   +${String(x[0]).padStart(5)}…${String(x[1]).padStart(5)} n=${String(x[3]).padStart(5)} D1=${x[4]} ${String(x[2]).slice(0, 110)}`) }
  const mc = (VET.mo_chang || []).slice().sort((a, b) => a.w - b.w); const m2 = mc[Math.floor(mc.length * 0.9)]
  if (m2) { console.log(`Vết mở chặng p90 (worker ${m2.w} ms):`); for (const x of (m2.d || []).slice().sort((a, b) => a[0] - b[0]).slice(0, 30)) console.log(`   +${String(x[0]).padStart(5)}…${String(x[1]).padStart(5)} n=${String(x[3]).padStart(5)} D1=${x[4]} ${String(x[2]).slice(0, 110)}`) }
  const nc = (VET.nop_cau || []).slice().sort((a, b) => a.w - b.w); const m3 = nc[Math.floor(nc.length / 2)]
  if (m3) { console.log(`Vết nộp trung vị (worker ${m3.w} ms):`); for (const x of (m3.d || []).slice().sort((a, b) => a[0] - b[0]).slice(0, 30)) console.log(`   +${String(x[0]).padStart(5)}…${String(x[1]).padStart(5)} n=${String(x[3]).padStart(5)} D1=${x[4]} ${String(x[2]).slice(0, 110)}`) }
}
