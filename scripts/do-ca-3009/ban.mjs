// ĐO CA KIỂM TRA 300 EM (tối ưu ca 30/09) — bắn tải GIẢ vào Worker CỤC BỘ (wrangler dev --local), KHÔNG BAO GIỜ vào máy chủ thật.
//   node scripts/do-ca-3009/ban.mjs --cay=<thư mục mã cần đo> --nhan=<nhãn> [--so-em=300] [--tre-d1=40] [--tre-r2=30]
//        [--lam-giay=180] [--de-rieng=1] [--cong-bo=ngay] [--cong=8791] [--ra=docs/do-ca-3009]
// Kịch bản (một ca 300 em, đề riêng, phòng chờ + đồng bộ giờ, công bố ngay):
//   1. 0–40 s: em tới dần — tra tên (/goi tenTheoSbd) → /vao-thi (phòng chờ) → hỏi GET /phong-cho mỗi 3 s × (1 + 0,4·ngẫu nhiên).
//   2. 45 s: thầy bấm Bắt đầu (/goi batDauThi, đồng bộ giờ). Cả lớp thấy ở nhịp hỏi kế tiếp ⇒ /vao-thi + GET /de/<ca> DỒN trong ~4 s.
//   3. Làm bài `lam-giay` giây: /luu-tam mỗi 15 s (đáp án tăng dần), /trang-thai mỗi 10 s × (1 + 0,4·ngẫu nhiên).
//   4. Nộp DỒN trong 60 s (/nop, đủ đáp án + dấu vết + giây từng câu).
//   5. Suốt ca: máy thầy hỏi /ca/nhip mỗi 3 s; dấu vết đổi ⇒ tải lại /ca/chi-tiet (cách lần trước ≥ 4 s). Cuối ca: /ca/chi-tiet + chấm /cham-diem theo lô 8 em.
// Ghi: p50/p95/max phía máy khách + số câu D1, vòng đi-về D1, dòng đọc, lượt đọc R2 mỗi lệnh (vỏ đo vo-do.ts).
import { spawn } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'

const GOC = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(GOC, '../..')
const arg = (ten, mac) => { const a = process.argv.find((x) => x.startsWith(`--${ten}=`)); return a ? a.slice(ten.length + 3) : mac }
const CAY = resolve(arg('cay', REPO))
const NHAN = arg('nhan', 'chua-dat-ten')
const SO_EM = Number(arg('so-em', 300))
const TRE_D1 = Number(arg('tre-d1', 40))
const TRE_R2 = Number(arg('tre-r2', 30))
const LAM_GIAY = Number(arg('lam-giay', 180))
const DE_RIENG = arg('de-rieng', '1') === '1'
const CONG_BO = arg('cong-bo', 'ngay')
const CONG = Number(arg('cong', 8791))
const DONG_LOAT = arg('dong-loat', '0') === '1'
const CHI_PHONG_CHO = arg('chi-phong-cho', '0') === '1'
const CHI_GAME = arg('chi-game', '0') === '1'
const CHO_MS = Number(arg('cho-ms', 45000))
const NOP_MS = Number(arg('nop-ms', 60000))
let hat = Number(arg('hat', 1102026)) >>> 0
const ngauNhien = () => { hat = (Math.imul(hat, 1664525) + 1013904223) >>> 0; return hat / 4294967296 }
const RA = resolve(REPO, arg('ra', 'docs/do-ca-3009'))
const MAT = randomBytes(12).toString('hex')
const MA_CA = '300930'
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a)
const ngu = (ms) => new Promise((ok) => setTimeout(ok, Math.max(0, ms)))

// (1) vỏ đo + cấu hình vào đúng cây mã cần đo
const dich = join(CAY, 'scripts/do-ca-3009')
mkdirSync(dich, { recursive: true })
if (dich !== GOC) for (const f of ['vo-do.ts', 'wrangler.toml']) copyFileSync(join(GOC, f), join(dich, f))
const chay = join(dich, `.chay-${process.pid}`)
rmSync(chay, { recursive: true, force: true })

// (2) Worker cục bộ
const dev = spawn('npx', ['wrangler', 'dev', '--local', '--config', join(dich, 'wrangler.toml'), '--persist-to', chay, '--port', String(CONG), '--ip', '127.0.0.1', '--log-level', 'error',
  '--var', `MA_BI_MAT:${MAT}`, '--var', `TRE_D1_MS:${TRE_D1}`, '--var', `TRE_R2_MS:${TRE_R2}`], { cwd: CAY, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
const nhatKyDev = []
dev.stdout.on('data', (d) => nhatKyDev.push(String(d)))
dev.stderr.on('data', (d) => nhatKyDev.push(String(d)))
const tat = () => { try { process.kill(-dev.pid, 'SIGTERM') } catch { /* đã tắt */ } }
process.on('exit', () => { tat(); rmSync(chay, { recursive: true, force: true }) })
process.on('SIGINT', () => { tat(); process.exit(130) })
const GOC_URL = `http://127.0.0.1:${CONG}`
let san = false
for (let i = 0; i < 120 && !san; i++) {
  try { san = (await fetch(GOC_URL + '/__do/reset', { signal: AbortSignal.timeout(2000) })).ok } catch { await ngu(1000) }
}
if (!san) { console.error('Worker cục bộ không lên:\n' + nhatKyDev.join('').slice(-3000)); tat(); process.exit(1) }
log(`Worker cục bộ sẵn sàng (${CAY}) · trễ D1 ${TRE_D1} ms/vòng · trễ R2 ${TRE_R2} ms/lượt`)

// (3) lược đồ = schema.sql + mọi migration (như vitest.config.d1.ts), dữ liệu GIẢ
function tachCau(sql) {
  const sach = sql.replace(/\/\*[\s\S]*?\*\//g, '\n').split('\n').filter((l) => !/^\s*--/.test(l)).map((l) => l.replace(/\s--.*$/, '')).join('\n')
  return sach.split(/;\s*(?:\n|$)/).map((s) => s.trim()).filter((s) => /[A-Za-z]/.test(s))
}
const post = async (duong, than, lenh) => {
  const r = await fetch(GOC_URL + duong, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': MAT, ...(lenh ? { 'x-do-lenh': encodeURIComponent(lenh) } : {}) }, body: JSON.stringify(than) })
  return r.json()
}
const tepSql = ['schema.sql', ...readdirSync(join(CAY, 'server')).filter((f) => /^migration-.*\.sql$/.test(f)).sort()].filter((f) => f !== 'migration-1609-academic-start.sql')
let soCauLuocDo = 0
for (const f of tepSql) {
  const cau = tachCau(readFileSync(join(CAY, 'server', f), 'utf8'))
  soCauLuocDo += cau.length
  await post('/__do/sql', { cau })
}
await post('/__do/sql', { cau: ['pham_vi', 'danh_sach_chon_json', 'mat_khau', 'de_rieng', 'pham_vi_hoi_lai'].map((c) => `ALTER TABLE ca ADD COLUMN ${c} TEXT`) })
const EM = Array.from({ length: SO_EM }, (_, i) => ({ sbd: String(90001 + i), hoTen: `Em Giả ${String(i + 1).padStart(3, '0')}`, namSinh: '2008', lop: `12A${(i % 6) + 1}` }))
const nay = new Date().toISOString()
await post('/__do/sql', { cau: EM.map((e) => `INSERT OR REPLACE INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES ('${e.sbd}','${e.hoTen}','${e.namSinh}','${e.lop}','${nay}')`) })
log(`Đã dựng lược đồ (${tepSql.length} tệp, ${soCauLuocDo} câu) + ${SO_EM} em giả`)

// (4) đề: kho 120 câu (72/24/24); mỗi em 18/4/6 câu (đề riêng) — cỡ chữ gần đề thật (có công thức, lời giải)
const chu = (i, n) => Array.from({ length: n }, (_, k) => `Hợp chất X${(i * 7 + k) % 97} phản ứng với dung dịch NaOH dư thu được ${(i + k) % 9 + 1},${k}2 gam muối`).join('. ')
const KHO = { I: 72, II: 24, III: 24 }
const qid = (p, i) => `DE3009-${p}-${i + 1}`
const bank = {
  phanI: Array.from({ length: KHO.I }, (_, i) => ({ id: qid('I', i), text: `${chu(i, 3)}. Tính $\\frac{m_{${i}}}{M}$?`, choices: [chu(i + 1, 1), chu(i + 2, 1), chu(i + 3, 1), chu(i + 4, 1)] })),
  phanII: Array.from({ length: KHO.II }, (_, i) => ({ id: qid('II', i), text: chu(i + 50, 3), ideas: [chu(i + 51, 1), chu(i + 52, 1), chu(i + 53, 1), chu(i + 54, 1)] })),
  phanIII: Array.from({ length: KHO.III }, (_, i) => ({ id: qid('III', i), text: `${chu(i + 90, 4)} Tính $x$.` })),
  soCau: { I: 18, II: 4, III: 6 },
}
const dapAnDung = (p, i) => (p === 'I' ? 'ABCD'[i % 4] : p === 'II' ? ['D', 'S', 'D', 'S'] : String((i % 9) + 0.5))
const keyBank = {
  phanI: bank.phanI.map((c, i) => ({ ...c, correct: dapAnDung('I', i), solution: chu(i + 7, 4), chuyenDe: `CĐ${i % 8}`, mucDo: 'hieu' })),
  phanII: bank.phanII.map((c, i) => ({ ...c, correct: dapAnDung('II', i), solution: chu(i + 8, 4), chuyenDe: `CĐ${i % 8}`, mucDo: 'van_dung' })),
  phanIII: bank.phanIII.map((c, i) => ({ ...c, correct: dapAnDung('III', i), solution: chu(i + 9, 4), chuyenDe: `CĐ${i % 8}`, mucDo: 'van_dung' })),
  soCau: bank.soCau,
}
const boCua = (k) => ({
  I: Array.from({ length: 18 }, (_, j) => (k * 5 + j * 4) % KHO.I),
  II: Array.from({ length: 4 }, (_, j) => (k * 3 + j * 6) % KHO.II),
  III: Array.from({ length: 6 }, (_, j) => (k * 2 + j * 4) % KHO.III),
})
const boTheoEm = { bo: {}, lap: {}, dem: {}, bb: { ghiChu: 'biên bản giả', luc: nay } }
EM.forEach((e, k) => {
  const b = boCua(k)
  boTheoEm.bo[e.sbd] = [...b.I.map((i) => qid('I', i)), ...b.II.map((i) => qid('II', i)), ...b.III.map((i) => qid('III', i))]
  boTheoEm.lap[e.sbd] = b.I.slice(0, 3).map((i) => qid('I', i))
  boTheoEm.dem[e.sbd] = Object.fromEntries(b.I.slice(0, 3).map((i) => [qid('I', i), 1]))
})
const ca = {
  maCa: MA_CA, tenCa: 'Ca đo 300 em', trangThai: 'mo', batDau: '', hetHanVao: '', thoiGianPhut: 50, loai: 'thi', congBo: CONG_BO,
  nguongLan: 3, nguongGiay: 30, soCau: bank.soCau, lop: '12A', phongCho: true, dongBoGio: true, deRieng: DE_RIENG, phamVi: 'tu_do',
  ...(DE_RIENG ? { boTheoEm } : {}),
}
const rDay = await post('/ca/day', { ca, bank, keyBank })
if (!rDay.ok) { console.error('Không mở được ca:', rDay); tat(); process.exit(1) }
log(`Đã mở ca ${MA_CA} · gói đề ${Math.round(JSON.stringify(bank).length / 1024)} KB · đáp án ${Math.round(JSON.stringify(keyBank).length / 1024)} KB · bản đồ đề riêng ${DE_RIENG ? Math.round(JSON.stringify(boTheoEm).length / 1024) + ' KB' : 'không'}`)
await fetch(GOC_URL + '/__do/reset')

// (5) bắn
const khach = [] // { lenh, ms, loi }
async function goi(lenh, duong, than, laLoi = (j) => j?.ok === false) {
  const t = performance.now()
  let loi = null
  let j = null
  try {
    const r = await fetch(GOC_URL + duong, than === undefined
      ? { headers: { 'x-do-lenh': encodeURIComponent(lenh) }, signal: AbortSignal.timeout(30000) }
      : { method: 'POST', headers: { 'content-type': 'application/json', 'x-do-lenh': encodeURIComponent(lenh), ...(than.__thay ? { 'x-ma-bi-mat': MAT } : {}) }, body: JSON.stringify(than), signal: AbortSignal.timeout(30000) })
    const txt = await r.text()
    try { j = JSON.parse(txt) } catch { j = null }
    if (r.status >= 400) loi = `http ${r.status} ${String(j?.error ?? j?.lyDo ?? txt).slice(0, 120)}`
    else if (j && laLoi(j)) loi = `ok:false ${j.lyDo ?? j.error ?? ''}`.slice(0, 80)
  } catch (e) {
    loi = `mạng: ${e?.name ?? e}`
  }
  khach.push({ lenh, ms: performance.now() - t, loi })
  return j
}
const T0 = Date.now()
const BAT_DAU_SAU = CHO_MS
let batDauLuc = 0
let xongHet = false
const bamGio = () => Date.now() - T0

function dapAnDen(e, k, soCau) {
  const b = boCua(k)
  const d = { phanI: {}, phanII: {}, phanIII: {} }
  let n = 0
  for (const i of b.I) { if (n++ >= soCau) break; d.phanI[qid('I', i)] = 'ABCD'[(i + k) % 4] }
  for (const i of b.II) { if (n++ >= soCau) break; d.phanII[qid('II', i)] = ['D', 'S', (i + k) % 2 ? 'D' : 'S', null] }
  for (const i of b.III) { if (n++ >= soCau) break; d.phanIII[qid('III', i)] = String(((i + k) % 9) + 0.5) }
  return d
}
function giayCauDen(k, soCau) {
  const b = boCua(k)
  const tat = [...b.I.map((i) => qid('I', i)), ...b.II.map((i) => qid('II', i)), ...b.III.map((i) => qid('III', i))].slice(0, soCau)
  return Object.fromEntries(tat.map((q, j) => [q, 20 + ((j * 7 + k) % 90)]))
}

async function motEm(e, k) {
  await ngu(DONG_LOAT ? 0 : ngauNhien() * 40_000)
  await goi('tra tên (/goi tenTheoSbd)', '/goi', { action: 'tenTheoSbd', maCa: MA_CA, sbd: e.sbd })
  const idThietBi = `may-${e.sbd}`
  let v = await goi('vào thi — phòng chờ (/vao-thi)', '/vao-thi', { maCa: MA_CA, sbd: e.sbd, idThietBi, hoTen: e.hoTen, namSinh: e.namSinh })
  const nhipCho = 3000 * (1 + ngauNhien() * 0.4)
  while (v?.cach === 'cho') {
    await ngu(nhipCho)
    const pc = await goi('hỏi phòng chờ (GET /phong-cho)', `/phong-cho?maCa=${MA_CA}`)
    if (pc?.batDau) v = await goi('vào thi — nhận lượt (/vao-thi)', '/vao-thi', { maCa: MA_CA, sbd: e.sbd, idThietBi, hoTen: e.hoTen, namSinh: e.namSinh })
    if (bamGio() > 120_000) break
  }
  if (!v?.ok || !v.khoaLuot) return
  const vaoLuc = Date.now()
  await goi('tải đề (GET /de/:ca)', v.deUrl ?? `/de/${MA_CA}`, undefined, () => false)
  const hanNop = batDauLuc + LAM_GIAY * 1000 + ngauNhien() * NOP_MS
  const nhipTt = 10_000 * (1 + ngauNhien() * 0.4)
  let soCau = 0
  let tt = Date.now() + nhipTt
  let luu = Date.now() + ngauNhien() * 15_000
  while (Date.now() < hanNop) {
    const toi = Math.min(tt, luu, hanNop)
    await ngu(toi - Date.now())
    if (Date.now() >= hanNop) break
    soCau = Math.min(28, Math.floor(((Date.now() - vaoLuc) / (LAM_GIAY * 1000)) * 28) + 1)
    if (Date.now() >= luu) {
      luu += 15_000
      void goi('lưu đáp án (/luu-tam)', '/luu-tam', { maCa: MA_CA, sbd: e.sbd, dapAn: dapAnDen(e, k, soCau), giayCau: giayCauDen(k, soCau) })
    }
    if (Date.now() >= tt) {
      tt += nhipTt
      void goi('báo trạng thái (/trang-thai)', '/trang-thai', { sbd: e.sbd, maCa: MA_CA, lop: e.lop, dangLam: true, batDauLuc: new Date(vaoLuc).toISOString(), daLamCauHoi: soCau, tongCauHoi: 28, soLanRoiApp: 0, blocked: false })
    }
  }
  await goi('nộp bài (/nop)', '/nop', { maCa: MA_CA, sbd: e.sbd, dapAn: dapAnDen(e, k, 28), giayCau: giayCauDen(k, 28), integrity: { leaveCount: k % 3, totalHiddenMs: (k % 3) * 1500, blocked: false, events: [] } })
}

async function mayThay() {
  let moc = ''
  let dauVet = null
  let taiDayLuc = 0
  while (!xongHet) {
    const n = await goi('thầy: nhịp ca (/ca/nhip)', '/ca/nhip', { __thay: 1, maCa: MA_CA, sau: moc })
    if (n?.ok) {
      moc = n.moc || moc
      if (n.dauVet !== dauVet && Date.now() - taiDayLuc >= 4000) {
        dauVet = n.dauVet
        taiDayLuc = Date.now()
        await goi('thầy: chi tiết ca (/ca/chi-tiet)', '/ca/chi-tiet', { __thay: 1, maCa: MA_CA })
      }
    }
    await ngu(3000)
  }
}
async function batDauThi() {
  await ngu(BAT_DAU_SAU)
  batDauLuc = Date.now()
  const r = await goi('thầy: bắt đầu thi (/goi batDauThi)', '/goi', { __thay: 1, action: 'batDauThi', maCa: MA_CA, dongBoGio: true, secret: MAT })
  log('Thầy bấm Bắt đầu:', r?.ok ? 'được' : JSON.stringify(r))
}
async function chamLo() {
  const baiCua = (e, k) => {
    const b = boCua(k)
    const cau = []
    let dung = { I: 0, II: 0, III: 0 }
    b.I.forEach((i, j) => { const chon = 'ABCD'[(i + k) % 4]; const d = chon === dapAnDung('I', i); if (d) dung.I++; cau.push({ phan: 'I', soCau: j + 1, qid: qid('I', i), chuyenDe: `CĐ${i % 8}`, mucDo: 'hieu', dapAnChon: chon, dapAnDung: dapAnDung('I', i), dungSai: d, giay: 30 }) })
    b.II.forEach((i, j) => { const d = (i + k) % 2 === 0; if (d) dung.II++; cau.push({ phan: 'II', soCau: j + 1, qid: qid('II', i), chuyenDe: `CĐ${i % 8}`, mucDo: 'van_dung', dapAnChon: 'DSDS', dapAnDung: 'DSDS', dungSai: d, giay: 60 }) })
    b.III.forEach((i, j) => { const d = (i + k) % 3 === 0; if (d) dung.III++; cau.push({ phan: 'III', soCau: j + 1, qid: qid('III', i), chuyenDe: `CĐ${i % 8}`, mucDo: 'van_dung', dapAnChon: String(((i + k) % 9) + 0.5), dapAnDung: dapAnDung('III', i), dungSai: d, giay: 90 }) })
    const diem = { I: dung.I * 0.25, II: dung.II * 1, III: dung.III * 0.25 }
    return { sbd: e.sbd, lanThu: 1, hoTen: e.hoTen, diem: { ...diem, tong: diem.I + diem.II + diem.III }, cau }
  }
  const tatCa = EM.map(baiCua)
  for (let i = 0; i < tatCa.length; i += 8) await goi('thầy: chấm lô 8 em (/cham-diem)', '/cham-diem', { __thay: 1, maCa: MA_CA, bai: tatCa.slice(i, i + 8) })
}

log(`Bắt đầu kịch bản: ${SO_EM} em · làm ${LAM_GIAY} s · nộp dồn ${NOP_MS / 1000} s`)
const thay = CHI_PHONG_CHO || CHI_GAME ? Promise.resolve() : mayThay()
const bd = CHI_PHONG_CHO || CHI_GAME ? Promise.resolve() : batDauThi()
if (CHI_GAME) {
  const { tokens } = await post('/__do/game', { sbds: EM.map(e => e.sbd) })
  await fetch(GOC_URL + '/__do/reset')
  await Promise.all(EM.map(async e => {
    const token = tokens[e.sbd]
    await goi('300 mở Sảnh game', '/game-v2/hoa2-sanh', { token })
    const luot = await goi('300 vào Đảo', '/game-v2/start', { token, mode: 'adventure' })
    if (!luot?.id || !luot.questions?.length) { khach.push({lenh:'Đảo không phát câu',ms:0,loi:'Không có lượt/câu'}); return }
    await goi('300 chốt câu game', '/game-v2/answer', { token, session: luot.id, qid: luot.questions[0].qid, answer: 'B' })
  }))
} else if (CHI_PHONG_CHO) {
  for (let dot = 0; dot < 3; dot++) await Promise.all(EM.map(() => goi('300 hỏi phòng chờ đồng thời', `/phong-cho?maCa=${MA_CA}`)))
  const r = await goi('thầy bắt đầu', '/goi', { __thay: 1, action: 'batDauThi', maCa: MA_CA, dongBoGio: true, secret: MAT })
  if (!r?.ok) throw new Error('Không bắt đầu được ca giả')
  const rs = await Promise.all(EM.map(() => goi('300 thấy bắt đầu đồng thời', `/phong-cho?maCa=${MA_CA}`)))
  if (rs.some(x => !x?.batDau)) console.error('Còn lượt chưa nhận được giờ bắt đầu')
} else await Promise.all(EM.map((e, k) => motEm(e, k)))
await bd
log('Cả lớp đã nộp — thầy tải chi tiết + chấm')
await ngu(3500)
let doiChieu = null
if (!CHI_PHONG_CHO && !CHI_GAME) {
  // Nộp lặp và gói lưu trễ phải giữ nguyên bài đã chốt.
  await goi('nộp lặp (giữ bài)', '/nop', { maCa: MA_CA, sbd: EM[0].sbd, dapAn: {}, giayCau: {} })
  await goi('lưu trễ sau nộp (bị chặn)', '/luu-tam', { maCa: MA_CA, sbd: EM[0].sbd, dapAn: {} }, j => j?.lyDo !== 'khong_dang_lam')
  const { rows } = await post('/__do/doi-chieu', { maCa: MA_CA })
  const map = new Map(rows.map(r => [r.sbd, r]))
  const sai = EM.filter((e, k) => {
    const r = map.get(e.sbd)
    return !r || r.trang_thai !== 'da_nop' || JSON.stringify(JSON.parse(r.dap_an_json ?? '{}')) !== JSON.stringify(dapAnDen(e, k, 28)) || JSON.stringify(JSON.parse(r.giay_cau_json ?? '{}')) !== JSON.stringify(giayCauDen(k, 28))
  })
  doiChieu = { soBai: rows.length, mongDoi: SO_EM, sai: sai.length, dapAnVaThoiGianKhop: rows.length === SO_EM && sai.length === 0 }
  log('Đối chiếu bài thực trong D1 cục bộ:', JSON.stringify(doiChieu))
}
await goi('thầy: chi tiết ca (/ca/chi-tiet)', '/ca/chi-tiet', { __thay: 1, maCa: MA_CA })
if (!CHI_PHONG_CHO && !CHI_GAME) await chamLo()
xongHet = true
await thay
await ngu(2000)
const { so } = await (await fetch(GOC_URL + '/__do/dump')).json()
tat()

// (6) gộp số
const p = (a, q) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))] }
const theoLenh = new Map()
for (const k of khach) {
  const o = theoLenh.get(k.lenh) ?? { lenh: k.lenh, ms: [], loi: 0, mauLoi: [] }
  o.ms.push(k.ms)
  if (k.loi) { o.loi++; if (o.mauLoi.length < 3) o.mauLoi.push(k.loi) }
  theoLenh.set(k.lenh, o)
}
const mayChu = new Map()
for (const s of so) {
  const o = mayChu.get(s.lenh) ?? { n: 0, cau: 0, vong: 0, doc: 0, r2Doc: 0, r2Byte: 0, vongMax: 0, msMay: [] }
  o.n++; o.cau += s.cau; o.vong += s.vong; o.doc += s.doc; o.r2Doc += s.r2Doc; o.r2Byte += s.r2Byte; o.vongMax = Math.max(o.vongMax, s.vong); o.msMay.push(s.ms)
  mayChu.set(s.lenh, o)
}
const bang = [...theoLenh.values()].map((o) => {
  const m = mayChu.get(o.lenh) ?? { n: 1, cau: 0, vong: 0, doc: 0, r2Doc: 0, r2Byte: 0, vongMax: 0, msMay: [] }
  const tb = (x) => +(x / Math.max(1, m.n)).toFixed(2)
  return { lenh: o.lenh, n: o.ms.length, loi: o.loi, mauLoi: o.mauLoi, p50: Math.round(p(o.ms, 0.5)), p95: Math.round(p(o.ms, 0.95)), max: Math.round(Math.max(...o.ms)),
    cauTb: tb(m.cau), vongTb: tb(m.vong), vongMax: m.vongMax, docTb: Math.round(m.doc / Math.max(1, m.n)), r2DocTb: tb(m.r2Doc), r2KBTb: Math.round(m.r2Byte / Math.max(1, m.n) / 1024) }
})
const tong = { luot: khach.length, loi: khach.filter((k) => k.loi).length, cauD1: so.reduce((t, s) => t + s.cau, 0), vongD1: so.reduce((t, s) => t + s.vong, 0), docD1: so.reduce((t, s) => t + s.doc, 0), r2Doc: so.reduce((t, s) => t + s.r2Doc, 0), r2MB: +(so.reduce((t, s) => t + s.r2Byte, 0) / 1048576).toFixed(1), giay: Math.round((Date.now() - T0) / 1000) }
mkdirSync(RA, { recursive: true })
const kq = { nhan: NHAN, luc: new Date().toISOString(), cauHinh: { soEm: SO_EM, treD1: TRE_D1, treR2: TRE_R2, lamGiay: LAM_GIAY, deRieng: DE_RIENG, congBo: CONG_BO, dongLoat: DONG_LOAT, chiPhongCho: CHI_PHONG_CHO, chiGame: CHI_GAME, choMs: CHO_MS, nopMs: NOP_MS, hat: Number(arg('hat', 1102026)) }, doiChieu, tong, bang }
writeFileSync(join(RA, `${NHAN}.json`), JSON.stringify(kq, null, 1) + '\n')
const dong = (b) => `| ${b.lenh} | ${b.n} | ${b.loi} | ${b.p50} | ${b.p95} | ${b.max} | ${b.cauTb} | ${b.vongTb} (max ${b.vongMax}) | ${b.docTb} | ${b.r2DocTb} (${b.r2KBTb} KB) |`
console.log(`\n### ${NHAN} — ${SO_EM} em, trễ D1 ${TRE_D1} ms/vòng, trễ R2 ${TRE_R2} ms\n\n| Lệnh | Lượt | Lỗi | p50 ms | p95 ms | max ms | Câu D1 TB | Vòng D1 TB | Dòng đọc TB | Đọc R2 TB |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n${bang.map(dong).join('\n')}\n`)
console.log('Tổng:', JSON.stringify(tong))
for (const b of bang) if (b.loi) console.log('LỖI', b.lenh, b.loi, b.mauLoi.join(' · '))
process.exit(tong.loi || doiChieu?.dapAnVaThoiGianKhop === false ? 1 : 0)
