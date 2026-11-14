// VIDEO BÀI GIẢNG (thử 14/11, thầy: «dựng thử lại video của K12 cho tôi xem trước duyệt»). Bước 1/3: DỰNG KỊCH BẢN — từ tư liệu một buổi live
// (lời Thầy có giờ, nét phấn có giờ, khoảng lặng của tiếng) + tệp cấu hình chọn cảnh ⇒ `kich-ban.json`: mọi thứ trên video dùng CHUNG một đồng hồ ra.
//
// Mỗi cảnh là chuỗi MẢNH { t0, t1 (giây trên video), s0, s1 (giây trên tiếng gốc), giong }:
//   · mảnh có giọng: 1 giây video = 1 giây tiếng gốc (lời Thầy giữ nguyên);
//   · mảnh nối (không giọng): khoảng ngừng dài trong câu / giữa hai câu rút còn ~0,3 giây ⇒ nét phấn Thầy viết lúc ngừng được vẽ TUA NHANH cho khớp.
// Điểm cắt bám khoảng lặng thật (`silencedetect`) trong ±0,45 giây quanh mốc của bản chép lời ⇒ không cắt giữa chữ.
// Dùng: node dung-kich-ban.mjs <thư mục tư liệu> <cau-hinh.json> <thư mục ra>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const [duLieu, cauHinhTep, ra] = process.argv.slice(2)
if (!duLieu || !cauHinhTep || !ra) { console.error('dùng: node dung-kich-ban.mjs <tư liệu> <cau-hinh.json> <ra>'); process.exit(1) }
mkdirSync(ra, { recursive: true })
const nk = JSON.parse(readFileSync(join(duLieu, 'nhat-ky.json'), 'utf8'))
const trang = JSON.parse(readFileSync(join(duLieu, 'trang.json'), 'utf8'))
const ch = JSON.parse(readFileSync(cauHinhTep, 'utf8'))
const lang = readFileSync(join(duLieu, 'lang-35.txt'), 'utf8').trim().split('\n').map((d) => d.split(/\s+/).map(Number)).filter((x) => x.length === 2 && x[1] > x[0])

// ── nhịp dựng ──
const MO_DAU = 6.5, THE_CHUONG = 2.4, NOI_CAU = 0.25, NGUNG_DAI = 0.55, NGUNG_GIU = 0.1, DUOI_CANH = 0.7, KET = 11
const DAU_TRUOC = 0.08, DUOI_SAU = 0.12

const trongLang = (t) => lang.find(([a, b]) => t >= a && t <= b)
function batDau(tu) {
  const l = trongLang(tu); if (l) return l[1] - DAU_TRUOC
  const truoc = lang.filter(([, b]) => b <= tu && b >= tu - 0.45).pop(); return truoc ? truoc[1] - DAU_TRUOC : tu - 0.05
}
function ketThuc(den) {
  const l = trongLang(den); if (l) return l[0] + DUOI_SAU
  const sau = lang.find(([a]) => a >= den && a <= den + 0.8); return sau ? sau[0] + DUOI_SAU : den + 0.1
}
/** Một câu [a, b] trên tiếng gốc ⇒ các đoạn giọng, bỏ ruột các khoảng ngừng dài (giữ NGUNG_GIU). */
function catCau(a, b) {
  const ds = []; let cur = a
  for (const [x, y] of lang) {
    if (x <= a || y >= b || y - x < NGUNG_DAI) continue
    const s1 = x + DUOI_SAU, s2 = y - DAU_TRUOC
    if (s1 > cur) ds.push({ giong: true, s0: cur, s1 }); ds.push({ giong: false, s0: s1, s1: s2, dai: NGUNG_GIU }); cur = s2
  }
  ds.push({ giong: true, s0: cur, s1: b })
  return ds
}

// ── nét phấn trang 3 (mọi cảnh của buổi K12 trên bảng cuộn này) ──
const tr = trang.trang.find((t) => t.net.length > 100) ?? trang.trang[trang.trang.length - 1]
const netBox = tr.net.map((n) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < n.p.length; i += 3) { const x = n.p[i] / 4, y = n.p[i + 1] / 4; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y } return { t0: n.t / 1000, t1: (n.t + (n.p[n.p.length - 1] || 0)) / 1000, x0, y0, x1, y1 } })
const BANG_W = tr.rong, BANG_H = tr.cao, KHUNG_TI = 1140 / 760
function hopNet(s0, s1) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, n = 0
  for (const b of netBox) { if (b.t1 < s0 || b.t0 > s1) continue; n++; x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1) }
  return n ? { x0, y0, x1, y1, n } : null
}
/** Nới hộp cho trọn những nét nó chạm (đã viết trong [sLo, sHi]) ⇒ máy quay không cắt ngang chữ. */
function moRong(h, sLo, sHi) {
  const r = { ...h }
  for (let lan = 0; lan < 3; lan++) for (const b of netBox) {
    if (b.t0 > sHi || b.t1 < sLo) continue
    if (b.x1 < r.x0 - 12 || b.x0 > r.x1 + 12 || b.y1 < r.y0 - 12 || b.y0 > r.y1 + 12) continue
    r.x0 = Math.min(r.x0, b.x0); r.y0 = Math.min(r.y0, b.y0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1)
  }
  return r
}
/** Hộp nét ⇒ khung máy quay [x, y, w, h] đúng tỉ lệ khung bảng, chừa lề, không phóng quá (w ≥ 560). */
function khungQuay(h) {
  const le = 70
  let w = Math.max(h.x1 - h.x0 + 2 * le, (h.y1 - h.y0 + 2 * le) * KHUNG_TI, 560)
  w = Math.min(w, BANG_W * 1.15)
  const hh = w / KHUNG_TI, cx = (h.x0 + h.x1) / 2, cy = (h.y0 + h.y1) / 2
  const x = Math.min(Math.max(cx - w / 2, -40), BANG_W - w + 40), y = Math.min(Math.max(cy - hh / 2, -40), BANG_H - hh + 40)
  return [Math.round(x), Math.round(y), Math.round(w), Math.round(hh)]
}

// ── dựng dòng thời gian ──
const doan = [], sfx = [], giong = []
let t = 0
doan.push({ loai: 'mo-dau', t0: 0, t1: MO_DAU, ...ch.moDau }); sfx.push({ t: 0.35, loai: 'vut' }, { t: 1.1, loai: 'dap' }, { t: 2.2, loai: 'bop' })
t = MO_DAU
for (const cc of ch.canh) {
  const c = nk.canh.find((x) => x.id === cc.id)
  if (!c) throw new Error(`thiếu cảnh ${cc.id}`)
  // thẻ chương
  doan.push({ loai: 'the-chuong', t0: t, t1: t + THE_CHUONG, so: cc.so, tieuDe: cc.tieuDe, mau: cc.mau }); sfx.push({ t: t + 0.02, loai: 'vut' }, { t: t + 0.55, loai: 'bop' }, { t: t + THE_CHUONG - 0.42, loai: 'vut-ra' })
  t += THE_CHUONG
  const canh = { loai: 'canh', id: cc.id, so: cc.so, tieuDe: cc.tieuDe, mau: cc.mau, nhan: cc.nhan, t0: t, manh: [], cau: [], su: [], nhanManh: [], khung: [] }
  const cauGoc = cc.dong.map((i) => ({ i, ...c.loi[i] }))
  let trc = null
  for (const [k, cg] of cauGoc.entries()) {
    const a = batDau(cg.tu), b = ketThuc(cg.den)
    if (trc != null && a > trc) { canh.manh.push({ t0: t, t1: t + NOI_CAU, s0: trc, s1: a, giong: false }); t += NOI_CAU }
    const cau = { i: cg.i, chu: cg.chu, t0: t, s0: a, s1: b }
    for (const m of catCau(a, b)) {
      const d = m.giong ? m.s1 - m.s0 : m.dai
      canh.manh.push({ t0: t, t1: t + d, s0: m.s0, s1: m.s1, giong: m.giong }); if (m.giong) giong.push({ t0: t, s0: m.s0, s1: m.s1 }); t += d
    }
    cau.t1 = t; canh.cau.push(cau); trc = b
    // ĐỐ VUI chèn sau câu `sauDong`: bảng đứng, giọng tắt, thẻ câu hỏi + đếm ngược
    if (cc.doVui && cg.i === cc.doVui.sauDong) {
      const dv = cc.doVui
      canh.manh.push({ t0: t, t1: t + dv.giay, s0: b, s1: b, giong: false, dung: true })
      canh.doVui = { t0: t, t1: t + dv.giay, hoi: dv.hoi, luaChon: dv.luaChon, moDong: dv.moDong }
      sfx.push({ t: t + 0.05, loai: 'vut' }, { t: t + 0.5, loai: 'bop' })
      for (let g = 0; g < 5; g++) sfx.push({ t: t + dv.giay - 5.4 + g, loai: g === 4 ? 'tich-cuoi' : 'tich' })
      t += dv.giay
    }
    void k
  }
  canh.manh.push({ t0: t, t1: t + DUOI_CANH, s0: trc, s1: trc + DUOI_CANH, giong: false }); t += DUOI_CANH
  canh.t1 = t
  // sự kiện hiện thẻ / điểm nhấn / phân tử theo đầu câu
  const dauCau = (i) => canh.cau.find((x) => x.i === i)
  for (const s of cc.su ?? []) { const q = dauCau(s.dong); if (!q) continue; canh.su.push({ ...s, t: q.t0 + 0.35 }); sfx.push({ t: q.t0 + 0.35, loai: s.loai === 'lon' || s.loai === 'dau' ? 'dap' : 'bop' }) }
  for (const i of cc.nhan ?? []) { const q = dauCau(i); if (q) canh.nhanManh.push({ t0: q.t0, t1: q.t1 }) }
  if (cc.phanTu) { canh.phanTu = Object.fromEntries(Object.entries(cc.phanTu).map(([k, i]) => [k, dauCau(i).t0 + 0.4])); for (const k of ['hien', 'matOH', 'matH']) sfx.push({ t: canh.phanTu[k], loai: 'bop' }); sfx.push({ t: canh.phanTu.noi + 0.9, loai: 'dap' }, { t: canh.phanTu.nuoc + 1.2, loai: 'bot' }) }
  if (canh.doVui) { const q = dauCau(canh.doVui.moDong); canh.doVui.tMo = q.t0 + 1.0; sfx.push({ t: canh.doVui.tMo, loai: 'dung' }) }
  // khung máy quay: theo nét Thầy viết quanh từng câu; câu không viết ⇒ giữ khung trước
  const hopCanh = hopNet(canh.cau[0].s0 - 25, canh.cau[canh.cau.length - 1].s1) ?? hopNet(canh.cau[0].s0 - 120, canh.cau[0].s0)
  let kTruoc = hopCanh ? khungQuay(hopCanh) : [0, 0, BANG_W, BANG_W / KHUNG_TI]
  canh.khung.push({ t: canh.t0, k: kTruoc })
  for (const q of canh.cau) {
    const h = hopNet(q.s0 - 4, q.s1)
    if (h && h.n >= 3) { kTruoc = khungQuay(moRong(h, canh.cau[0].s0 - 300, q.s1)); canh.khung.push({ t: q.t0, k: kTruoc }) }
  }
  canh.vung = hopCanh ? khungQuay(hopCanh) : kTruoc
  doan.push(canh)
}
// kết
doan.push({ loai: 'ket', t0: t, t1: t + KET, ...ch.ket }); sfx.push({ t: t + 0.02, loai: 'vut' }); ch.ket.y.forEach((_, i) => sfx.push({ t: t + 1.3 + i * 0.9, loai: 'bop' })); sfx.push({ t: t + KET - 3.6, loai: 'dap' })
t += KET

const kb = { fps: 30, rong: 1920, cao: 1080, tong: Math.round(t * 1000) / 1000, ten: ch.ten, lop: ch.lop, ngay: ch.ngay, doan, giong, sfx: sfx.sort((a, b) => a.t - b.t) }
writeFileSync(join(ra, 'kich-ban.json'), JSON.stringify(kb))
writeFileSync(join(ra, 'net.json'), JSON.stringify({ rong: tr.rong, cao: tr.cao, mau: tr.mau, net: tr.net }))
const giay = (x) => `${Math.floor(x / 60)}:${String(Math.round(x % 60)).padStart(2, '0')}`
console.log(`tổng ${giay(t)} (${t.toFixed(1)} s) · ${giong.length} mảnh giọng · ${sfx.length} tiếng động`)
for (const d of doan) console.log(`  ${d.loai.padEnd(10)} ${d.t0.toFixed(1).padStart(6)} → ${d.t1.toFixed(1).padStart(6)}  ${d.id ?? ''} ${d.cau ? `${d.cau.length} câu · ${d.khung.length} khung · vùng ${d.vung}` : ''}`)
