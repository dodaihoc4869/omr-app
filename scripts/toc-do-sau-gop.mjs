#!/usr/bin/env node
// SO TỐC ĐỘ BẢN MỚI VỚI BẢN TRƯỚC (thầy 27/10: «bất kể thay đổi gì đều phải tự tối ưu tốc độ tức thì hơn bản trước») — máy tự ép, chạy sau mỗi
// push lên main (.github/workflows/toc-do-sau-gop.yml), không chặn phát hành.
//
// Hai bản build (`--truoc` = commit cha, `--sau` = commit mới), cùng máy, cùng máy chủ app GIẢ (scripts/do-app-hs/may-chu-gia.ts — không một byte tới
// máy chủ thật, không dữ liệu thật):
//   1. Byte tải mở từng app + từng đường vào (scripts/kiem-toc-do-tai.mjs --in-tat-ca) — tất định.
//   2. Độ mượt app học sinh (scripts/do-muot-hs.mjs, CPU ×N, Fast 3G): chạm được, bấm phương án, Kiểm tra, Tiếp tục, chuyển câu, vào chặng,
//      khung cuộn p95, rAF nền. Chạy XEN KẼ trước/sau `--lan` lượt (mặc định 3), lấy TRUNG VỊ từng chỉ số ⇒ bớt nhiễu máy.
//   3. Đợt chờ D1 + số lệnh D1 của lệnh nóng (`--d1-truoc` / `--d1-sau`: thư mục chứa JSON do các test tốc độ máy chủ ghi qua GHI_MOC_TOC_DO) — tất định.
// Chậm hơn khi: byte > +64 B (nhiễu mã băm tên tệp ≤ ~35 B) · D1: hơn 1 đợt / 1 lệnh · thời gian: trung vị vượt CẢ +10 ms lẫn +5 % VÀ khác biệt có ý nghĩa
// (Mann–Whitney một phía trên số từng lượt, p ≤ 0,05 ⇒ với 3 lượt: cả 3 lượt sau đều chậm hơn cả 3 lượt trước). Đo 28/10 trên 15 bản liên tiếp: hai bản chỉ
// khác chữ (bdff8d51 → 7915b8b4) vẫn lệch trung vị 3 lượt tới +150 ms (vào chặng), +16 ms (bấm phương án) ⇒ chỉ ngưỡng phần trăm sẽ mở issue giả. Chỉ số theo
// câu (bấm phương án / Kiểm tra / Tiếp tục / chuyển câu / hiệu ứng) còn phải chậm hơn trên mọi câu gộp (7 × 3 = 21 mẫu mỗi bên, p ≤ 0,01).
//   node scripts/toc-do-sau-gop.mjs --truoc=<dist> --sau=<dist> [--lan=3] [--cpu=4] [--d1-truoc=<dir>] [--d1-sau=<dir>] [--ra=kq.json] [--tom=tom.md]
//   node scripts/toc-do-sau-gop.mjs --muot-truoc=<a.json,b.json…> --muot-sau=<…>   (so các tệp --ra của do-muot-hs.mjs đã đo sẵn)
//   node scripts/toc-do-sau-gop.mjs --gop=<kq-trinh-duyet.json>,<kq-may-chu.json> --ra=kq.json --tom=tom.md   (gộp kết quả hai job)
// Luôn thoát 0 (không chặn); kết luận ở `--ra` (`cham`: danh sách chỉ số chậm hơn) và bảng Markdown ở `--tom` (Job Summary).
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const arg = (ten, mac) => process.argv.find((a) => a.startsWith(`--${ten}=`))?.slice(ten.length + 3) ?? mac
const GOC = resolve(import.meta.dirname, '..')
const LAN = Number(arg('lan', '3'))
const CPU = Number(arg('cpu', '4'))
const MANG = arg('mang', 'fast3g')
const RA = arg('ra', '')
const TOM = arg('tom', '')

export const NGUONG = { byte: 64, ms: 10, phanTram: 5, p: 0.05, pCau: 0.01 }
const giua = (ds) => { const s = ds.filter((x) => Number.isFinite(x)).sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : null }
/** Chỉ số độ mượt (từ tệp --ra của do-muot-hs.mjs) — nhãn theo bảng từ chuẩn; tất cả «càng nhỏ càng nhanh». Mỗi lượt cho MỘT số (chỉ số theo câu: trung vị
 *  các câu của lượt ấy) ⇒ nhiễu cả lượt (máy chạy test chậm lúc ấy) không bị đếm thành nhiều mẫu. */
const theoCau = (f) => Object.assign((kq) => giua((kq.cau || []).map(f)), { tungCau: (kq) => (kq.cau || []).map(f) })
const motLan = (k) => (kq) => kq.tom?.[k]
export const CHI_SO_MUOT = [
  ['moLaiChamDuoc', 'Mở lại: tới chạm được', 'ms', motLan('moLaiChamDuoc')],
  ['moLaiNoiDung', 'Mở lại: tới nội dung', 'ms', motLan('moLaiNoiDung')],
  ['bamPa', 'Bấm phương án: phản hồi', 'ms', theoCau((m) => m.bamPa.inp)],
  ['kiem', 'Bấm Kiểm tra: phản hồi', 'ms', theoCau((m) => m.kiemTra.inp)],
  ['tiep', 'Bấm Tiếp tục: phản hồi', 'ms', theoCau((m) => m.tiep.inp)],
  ['chuyenCau', 'Chuyển câu', 'ms', theoCau((m) => m.tiep.chuyenCau)],
  ['chuyenMan', 'Vào chặng: tới câu đầu', 'ms', motLan('chuyenMan')],
  ['loTrinhCuonP95', 'Cuộn Lộ trình: khung p95', 'ms', motLan('loTrinhCuonP95')],
  ['lamCauCuonP95', 'Cuộn màn làm câu: khung p95', 'ms', motLan('lamCauCuonP95')],
  ['hieuUng', 'Hiệu ứng kết quả: khung p95', 'ms', theoCau((m) => m.kiemTra.khungHieuUng.p95)],
  ['rafNen', 'Lộ trình đứng yên: rAF nền', 'lượt/s', motLan('rafNen')],
]

/** Mann–Whitney một phía: xác suất (giả thuyết «không khác») để `sau` lớn hơn `truoc` ít nhất như đã thấy. Chính xác khi ít mẫu, xấp xỉ chuẩn khi nhiều. */
export function pLonHon(truoc, sau) {
  const a = truoc.filter(Number.isFinite), b = sau.filter(Number.isFinite)
  if (!a.length || !b.length) return 1
  const U = (x, y) => { let u = 0; for (const s of y) for (const t of x) u += s > t ? 1 : s === t ? 0.5 : 0; return u }
  const u0 = U(a, b), tat = [...a, ...b], n = b.length
  if (tat.length <= 14) {
    let dem = 0, tong = 0
    const chon = (tu, ds) => {
      if (ds.length === n) { tong++; const y = ds.map((i) => tat[i]), x = tat.filter((_, i) => !ds.includes(i)); if (U(x, y) >= u0 - 1e-9) dem++; return }
      for (let i = tu; i < tat.length; i++) chon(i + 1, [...ds, i])
    }
    chon(0, [])
    return dem / tong
  }
  const m = a.length, mu = (m * n) / 2, sd = Math.sqrt((m * n * (m + n + 1)) / 12)
  const z = (u0 - mu - 0.5) / (sd || 1)
  return 0.5 * erfc(z / Math.SQRT2)
}
function erfc(x) { const t = 1 / (1 + 0.5 * Math.abs(x)); const r = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return x >= 0 ? r : 2 - r }

/** Chậm hơn quá ngưỡng nhiễu? byte / D1: tất định. ms: trung vị vượt CẢ +10 lẫn +5 % VÀ Mann–Whitney p ≤ 0,05 trên các mẫu (`mau`). */
export const chamHon = (truoc, sau, loai, mau) => {
  if (truoc == null || sau == null) return false
  if (loai === 'byte') return sau - truoc > NGUONG.byte
  if (loai === 'd1') return sau > truoc
  return sau - truoc > NGUONG.ms && sau > truoc * (1 + NGUONG.phanTram / 100) && (!mau || pLonHon(mau.truoc, mau.sau) <= NGUONG.p)
}

function doByte(dist) {
  const ra = execFileSync(process.execPath, [join(GOC, 'scripts/kiem-toc-do-tai.mjs'), `--dist=${resolve(dist)}`, '--in-tat-ca'], { encoding: 'utf8' })
  const j = JSON.parse(ra.trim().split('\n').pop())
  const o = {}
  for (const [k, v] of Object.entries(j.app)) o[`app ${k}`] = v.gzip
  for (const [k, v] of Object.entries(j.duong)) o[`đường ${k}`] = v
  return o
}

function doMuot(dist, i) {
  const tep = join(tmpdir(), `toc-do-sau-gop-${process.pid}-${i}.json`)
  const r = spawnSync(process.execPath, [join(GOC, 'scripts/do-muot-hs.mjs'), `--dist=${resolve(dist)}`, `--cpu=${CPU}`, `--mang=${MANG}`, `--ra=${tep}`], { cwd: GOC, encoding: 'utf8', timeout: 6 * 60_000 })
  if (!existsSync(tep)) return { loi: (r.stderr || r.error?.message || 'không chạy được').slice(-300) }
  const kq = JSON.parse(readFileSync(tep, 'utf8'))
  return kq.tom ? { kq } : { loi: String(kq.loiChay || 'không có số đo').slice(0, 300) }
}

/** JSON của 4 test tốc độ máy chủ (GHI_MOC_TOC_DO) trong một thư mục ⇒ { 'tệp › lệnh': {dot, lenh} }. */
function docD1(thu) {
  const o = {}
  if (!thu || !existsSync(thu)) return o
  for (const t of readdirSync(thu).filter((x) => x.endsWith('.json'))) {
    try { for (const [k, v] of Object.entries(JSON.parse(readFileSync(join(thu, t), 'utf8')))) o[`${t.replace(/\.json$/, '')} › ${k}`] = v } catch {}
  }
  return o
}

/** So các lượt đo độ mượt hai bản (mỗi lượt = kết quả đầy đủ của do-muot-hs.mjs). */
function soMuot(kq, luot) {
  for (const [khoa, ten, dv, layMau] of CHI_SO_MUOT) {
    const mau = { truoc: luot.truoc.map(layMau).filter(Number.isFinite), sau: luot.sau.map(layMau).filter(Number.isFinite) }
    const t = giua(mau.truoc), s = giua(mau.sau)
    // Chỉ số theo câu: thêm điều kiện trên MỌI câu gộp (p ≤ 0,01) — đo 28/10: chỉ xét số từng lượt, 2/14 cặp bản liền nhau báo giả (bấm phương án +16 ms ở PR chỉ đổi chữ).
    const cau = layMau.tungCau ? { truoc: luot.truoc.flatMap(layMau.tungCau).filter(Number.isFinite), sau: luot.sau.flatMap(layMau.tungCau).filter(Number.isFinite) } : null
    const pCau = cau ? pLonHon(cau.truoc, cau.sau) : null
    const tron = (x) => (x == null ? null : Math.round(x * 1000) / 1000)
    kq.muot.push({ ten, khoa, dv, truoc: t, sau: s, soMau: [mau.truoc.length, mau.sau.length], p: tron(pLonHon(mau.truoc, mau.sau)), pCau: tron(pCau),
      cham: chamHon(t, s, 'ms', mau) && (pCau == null || pCau <= NGUONG.pCau) })
  }
  kq.soLuot = { truoc: luot.truoc.length, sau: luot.sau.length }
}

function soSanhTrinhDuyet() {
  const truoc = arg('truoc', ''), sau = arg('sau', '')
  const kq = { cpu: CPU, mang: MANG, lan: LAN, byte: [], muot: [], loiMuot: [] }
  if (truoc && sau) {
    const a = doByte(truoc), b = doByte(sau)
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) kq.byte.push({ ten: k, truoc: a[k] ?? null, sau: b[k] ?? null, cham: chamHon(a[k], b[k], 'byte') })
    const luot = { truoc: [], sau: [] }
    for (let i = 0; i < LAN; i++) for (const [ten, d] of i % 2 ? [['sau', sau], ['truoc', truoc]] : [['truoc', truoc], ['sau', sau]]) {
      const r = doMuot(d, `${ten}-${i}`)
      if (r.kq) luot[ten].push(r.kq); else kq.loiMuot.push(`${ten} lượt ${i + 1}: ${r.loi}`)
      console.error(`đo ${ten} lượt ${i + 1}/${LAN}: ${r.kq ? 'xong' : 'LỖI'}`)
    }
    soMuot(kq, luot)
  } else if (arg('muot-truoc', '')) {
    const doc = (ds) => ds.split(',').map((t) => JSON.parse(readFileSync(t, 'utf8'))).filter((x) => x.tom)
    soMuot(kq, { truoc: doc(arg('muot-truoc', '')), sau: doc(arg('muot-sau', '')) })
  }
  const d1t = docD1(arg('d1-truoc', '')), d1s = docD1(arg('d1-sau', ''))
  kq.d1 = []
  for (const k of new Set([...Object.keys(d1t), ...Object.keys(d1s)])) {
    const t = d1t[k], s = d1s[k]
    kq.d1.push({ ten: k, truoc: t ?? null, sau: s ?? null, cham: !!(t && s && (chamHon(t.dot, s.dot, 'd1') || chamHon(t.lenh, s.lenh, 'd1'))) })
  }
  return kq
}

function gop(ds) {
  const kq = { byte: [], muot: [], d1: [], loiMuot: [] }
  for (const t of ds) {
    if (!existsSync(t)) continue
    const j = JSON.parse(readFileSync(t, 'utf8'))
    for (const k of ['byte', 'muot', 'd1', 'loiMuot']) if (j[k]?.length) kq[k] = kq[k].concat(j[k])
    for (const k of ['cpu', 'mang', 'lan', 'soLuot']) if (j[k] != null) kq[k] = j[k]
  }
  return kq
}

const so = (x, dv) => (x == null ? '—' : dv === 'B' ? `${(x / 1024).toFixed(2)} KB` : `${x}${dv === 'ms' ? ' ms' : dv ? ' ' + dv : ''}`)
function bangMarkdown(kq, tieuDe) {
  const cham = [
    ...kq.byte.filter((x) => x.cham).map((x) => `Byte tải mở ${x.ten}`),
    ...kq.muot.filter((x) => x.cham).map((x) => x.ten),
    ...kq.d1.filter((x) => x.cham).map((x) => `D1 ${x.ten}`),
  ]
  kq.cham = cham
  const d = [`## ${cham.length ? '🔴' : '🟢'} ${tieuDe}`, '']
  d.push(cham.length ? `**Chậm hơn bản trước ở ${cham.length} chỉ số:** ${cham.join(' · ')}` : '**Không chỉ số nào chậm hơn bản trước quá ngưỡng nhiễu.**', '')
  d.push(`Ngưỡng nhiễu: byte +${NGUONG.byte} B · thời gian: trung vị vượt cả +${NGUONG.ms} ms lẫn +${NGUONG.phanTram} % và Mann–Whitney trên số từng lượt p ≤ ${NGUONG.p} (chỉ số theo câu: thêm mọi câu gộp p ≤ ${NGUONG.pCau}) · D1 hơn 1 đợt / 1 lệnh. Dữ liệu GIẢ (máy chủ app giả), không dữ liệu thật.`, '')
  if (kq.muot.length) {
    d.push(`### Độ mượt app học sinh — CPU ×${kq.cpu}, ${kq.mang === 'slow3g' ? 'Slow 3G' : 'Fast 3G'}, trung vị, ${kq.soLuot?.truoc ?? 0}/${kq.soLuot?.sau ?? 0} lượt (trước/sau)`, '', '| Chỉ số | Trước | Sau | Lượt | p lượt | p câu | |', '|---|---:|---:|---:|---:|---:|:-:|')
    for (const x of kq.muot) d.push(`| ${x.ten} | ${so(x.truoc, x.dv)} | ${so(x.sau, x.dv)} | ${x.soMau?.join('/') ?? ''} | ${x.p ?? ''} | ${x.pCau ?? ''} | ${x.cham ? '🔴' : x.sau != null && x.truoc != null && x.sau < x.truoc ? '↓' : ''} |`)
    d.push('')
  }
  if (kq.loiMuot?.length) d.push('Lượt đo lỗi: ' + kq.loiMuot.map((x) => '`' + x.replace(/`/g, "'").slice(0, 160) + '`').join(' · '), '')
  if (kq.byte.length) {
    d.push('### Byte tải mở (nén gzip)', '', '| App / đường | Trước | Sau | Lệch | |', '|---|---:|---:|---:|:-:|')
    for (const x of kq.byte) d.push(`| ${x.ten} | ${so(x.truoc, 'B')} | ${so(x.sau, 'B')} | ${x.truoc != null && x.sau != null ? (x.sau - x.truoc >= 0 ? '+' : '') + (x.sau - x.truoc) + ' B' : '—'} | ${x.cham ? '🔴' : ''} |`)
    d.push('')
  }
  if (kq.d1.length) {
    d.push('### Máy chủ: đợt chờ D1 nối tiếp / số lệnh D1 (lệnh nóng)', '', '| Lệnh | Trước | Sau | |', '|---|---:|---:|:-:|')
    const o = (v) => (v ? `${v.dot} / ${v.lenh}` : '—')
    for (const x of kq.d1) d.push(`| ${x.ten} | ${o(x.truoc)} | ${o(x.sau)} | ${x.cham ? '🔴' : ''} |`)
    d.push('')
  }
  return d.join('\n')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const kq = arg('gop', '') ? gop(arg('gop', '').split(',')) : soSanhTrinhDuyet()
  const md = bangMarkdown(kq, arg('tieu-de', 'Tốc độ bản mới so bản trước'))
  if (RA) writeFileSync(RA, JSON.stringify(kq, null, 1))
  if (TOM) writeFileSync(TOM, md + '\n')
  console.log(md)
}
