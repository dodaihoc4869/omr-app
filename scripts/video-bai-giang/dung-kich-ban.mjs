// VIDEO BÀI GIẢNG (thử 14/11, thầy: «dựng thử lại video của K12 cho tôi xem trước duyệt»). Bước 1/3: DỰNG KỊCH BẢN — từ tư liệu một buổi live
// (lời Thầy có giờ, nét phấn có giờ, khoảng lặng của tiếng) + tệp cấu hình chọn cảnh ⇒ `kich-ban.json`: mọi thứ trên video dùng CHUNG một đồng hồ ra.
//
// Mỗi cảnh là chuỗi MẢNH { t0, t1 (giây trên video), s0, s1 (giây trên tiếng gốc), giong }:
//   · mảnh có giọng: 1 giây video = 1 giây tiếng gốc (lời Thầy giữ nguyên);
//   · mảnh nối (không giọng): khoảng ngừng dài trong câu / giữa hai câu rút còn ~0,3 giây ⇒ nét phấn Thầy viết lúc ngừng được vẽ TUA NHANH cho khớp.
// Điểm cắt bám khoảng lặng thật (`silencedetect`) trong ±0,45 giây quanh mốc của bản chép lời ⇒ không cắt giữa chữ.
// Dùng: node dung-kich-ban.mjs <thư mục tư liệu> <cau-hinh.json> <thư mục ra>
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { amNguyenVan, gioTungChu } from './khop-loi.mjs'

const [duLieu, cauHinhTep, ra] = process.argv.slice(2)
if (!duLieu || !cauHinhTep || !ra) { console.error('dùng: node dung-kich-ban.mjs <tư liệu> <cau-hinh.json> <ra>'); process.exit(1) }
mkdirSync(ra, { recursive: true })
const nk = JSON.parse(readFileSync(join(duLieu, 'nhat-ky.json'), 'utf8'))
const trang = JSON.parse(readFileSync(join(duLieu, 'trang.json'), 'utf8'))
const ch = JSON.parse(readFileSync(cauHinhTep, 'utf8'))
// LỜI NGUYÊN VĂN có giờ từng chữ (PhoWhisper chạy trên máy; «loiAsr»: tên tệp trong thư mục tư liệu) — CHỈ để lấy GIỜ, chữ không bao giờ ra màn hình
const AM_ASR = ch.loiAsr && existsSync(join(duLieu, ch.loiAsr)) ? amNguyenVan(JSON.parse(readFileSync(join(duLieu, ch.loiAsr), 'utf8')).flatMap((c) => c.tu)) : null
const lang = readFileSync(join(duLieu, 'lang-35.txt'), 'utf8').trim().split('\n').map((d) => d.split(/\s+/).map(Number)).filter((x) => x.length === 2 && x[1] > x[0])

// ── nhịp dựng ──
// Nhạc 112 BPM: mở đầu đúng 4 ô nhịp ⇒ chũm chọe của ô 5 rơi đúng lúc thẻ chương đầu vào
const NHIP = 112, MO_DAU = 4 * 4 * 60 / NHIP, THE_CHUONG = 2.4, NOI_CAU = 0.25, NGUNG_DAI = 0.55, NGUNG_GIU = 0.1, DUOI_CANH = 0.7, KET = 11
const DAU_TRUOC = 0.08, DUOI_SAU = 0.12

/** Số âm tiết khi đọc một chữ trong lời (số đọc thành chữ, công thức đọc từng kí hiệu) — tiếng Việt một chữ một âm. */
function soAm(w) {
  const s = w.replace(/[.,:;!?()«»"]/g, '')
  if (!s) return 0
  const m = s.match(/^(\d+)(.*)$/)
  if (m) { const n = Number(m[1]), a = n < 11 ? 1 : n < 20 ? 2 : n % 10 === 0 && n < 100 ? 2 : n < 100 ? 3 : n % 100 === 0 ? 2 : 5; return a + (m[2] ? soAm(m[2]) : 0) }
  if (!/[A-Z].*[A-Z]|\d/.test(s) && /[aeiouyàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]/i.test(s)) return 1
  let n = (s.match(/[A-Z][a-z]?/g) || []).length; if (/[⁺⁻+−]$/.test(s)) n++
  return Math.max(1, n)
}
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
function catCau(a, b, vietThat = false) {
  const ds = []; let cur = a
  for (const [x, y] of lang) {
    if (x <= a || y >= b || y - x < NGUNG_DAI) continue
    const s1 = x + DUOI_SAU, s2 = y - DAU_TRUOC
    if (s1 > cur) ds.push({ giong: true, s0: cur, s1 })
    if (vietThat) ds.push(...chiaNoi(s1, s2, NGUNG_GIU)); else ds.push({ giong: false, s0: s1, s1: s2, dai: NGUNG_GIU })
    cur = s2
  }
  ds.push({ giong: true, s0: cur, s1: b })
  return ds
}

// ── nét phấn trang 3 (mọi cảnh của buổi K12 trên bảng cuộn này) ──
const tr0 = trang.trang.find((t) => t.net.length > 100) ?? trang.trang[trang.trang.length - 1]
// NÉT CÓ GIỜ THẬT TỪNG ĐIỂM (net-co-gio.ts dựng từ net.bin): có thì dùng cho cả phân tích (cụm nét, giờ viết xong) lẫn bộ khung (dạng 2, bộ máy bút live)
const NET_GIO = ch.netCoGio && existsSync(join(duLieu, 'net-gio.json')) ? JSON.parse(readFileSync(join(duLieu, 'net-gio.json'), 'utf8')) : null // bật bằng «netCoGio»: true trong cấu hình
const tr = NET_GIO ? { ...tr0, net: NET_GIO.net.map((n) => { const p = []; for (let i = 0; i < n.d.length; i += 4) p.push(Math.round(n.d[i] * 6400), Math.round((n.d[i + 1] * 6400) / NET_GIO.tiLe), n.d[i + 3]); return { t: n.t, p } }) } : tr0
const netBox = tr.net.map((n) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < n.p.length; i += 3) { const x = n.p[i] / 4, y = n.p[i + 1] / 4; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y } return { t0: n.t / 1000, t1: (n.t + (n.p[n.p.length - 1] || 0)) / 1000, x0, y0, x1, y1 } })
// GIỮ NHỊP VIẾT THẬT (thầy 14/11 «giữ lại nét chữ viết theo cây bút mượt mà»): khoảng không có lời mà Thầy ĐANG VIẾT thì không tua vụt — đoạn đang
// viết chạy ×TOC_VIET, đoạn ngồi yên rút còn ~0,12 s. Trả các mảnh nối (không giọng) phủ kín [s0, s1], tổng ≥ toiThieu.
const TOC_VIET = 1.2
function chiaNoi(s0, s1, toiThieu) {
  const ban = netBox.filter((b) => b.t1 > s0 && b.t0 < s1).map((b) => [Math.max(s0, b.t0 - 0.12), Math.min(s1, b.t1 + 0.12)]).sort((x, y) => x[0] - y[0])
  const gop = []; for (const k of ban) { const c = gop[gop.length - 1]; if (c && k[0] <= c[1] + 0.35) c[1] = Math.max(c[1], k[1]); else gop.push([...k]) }
  if (!gop.length) return [{ giong: false, s0, s1, dai: toiThieu }]
  const ra = []; let cur = s0
  for (const [x, y] of gop) { if (x > cur) ra.push({ giong: false, s0: cur, s1: x, dai: Math.min(x - cur, 0.12) }); ra.push({ giong: false, s0: x, s1: y, dai: (y - x) / TOC_VIET, viet: true }); cur = y }
  if (s1 > cur) ra.push({ giong: false, s0: cur, s1, dai: Math.min(s1 - cur, 0.12) })
  const tong = ra.reduce((z, m) => z + m.dai, 0); if (tong < toiThieu) ra[ra.length - 1].dai += toiThieu - tong
  return ra
}
/** Cụm nét: các nét liền nhau (cách < 1,6 s, cùng hàng chữ) — một chữ / một vế Thầy viết một mạch. */
function cumNet(s0, s1) {
  const ds = netBox.filter((b) => b.t0 >= s0 && b.t0 <= s1).sort((a, b) => a.t0 - b.t0), cum = []
  for (const b of ds) { const c = cum[cum.length - 1]; if (c && b.t0 - c.t1 < 1.6 && Math.abs((b.y0 + b.y1) / 2 - (c.y0 + c.y1) / 2) < 60) { c.t1 = Math.max(c.t1, b.t1); c.x0 = Math.min(c.x0, b.x0); c.y0 = Math.min(c.y0, b.y0); c.x1 = Math.max(c.x1, b.x1); c.y1 = Math.max(c.y1, b.y1) } else cum.push({ ...b }) }
  return cum
}

// BỐ CỤC MỘT NGUỒN (khung.js đọc từ kich-ban.bo): bảng phấn trái, cột hình minh hoạ phải — cột rộng để hình đọc rõ trên điện thoại
const BO = { bang: [56, 118, 950, 760], cot: [1036, 118, 828, 760] }
const BANG_W = tr.rong, BANG_H = tr.cao, KHUNG_TI = BO.bang[2] / BO.bang[3]
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
// mục lục «Hôm nay em học» (dấu hiệu cấu trúc bài): mỗi phần một dòng
const muc = ch.mucLuc ?? ch.canh.map((c) => [c.so, c.tieuDe, c.mau])
doan.push({ loai: 'mo-dau', t0: 0, t1: MO_DAU, ...ch.moDau, muc }); sfx.push({ t: 0.35, loai: 'vut' }, { t: 1.1, loai: 'dap' }, { t: 2.2, loai: 'bop' }, { t: 4.45, loai: 'vut' })
muc.forEach((_, i) => sfx.push({ t: 5.05 + i * 0.32, loai: 'bip' }))
t = MO_DAU
for (const cc of ch.canh) {
  const c = nk.canh.find((x) => x.id === cc.id)
  if (!c) throw new Error(`thiếu cảnh ${cc.id}`)
  // thẻ chương
  doan.push({ loai: 'the-chuong', t0: t, t1: t + THE_CHUONG, so: cc.so, tieuDe: cc.tieuDe, mau: cc.mau }); sfx.push({ t: t + 0.02, loai: 'vut' }, { t: t + 0.55, loai: 'bop' }, { t: t + THE_CHUONG - 0.42, loai: 'vut-ra' })
  t += THE_CHUONG
  const canh = { loai: 'canh', id: cc.id, so: cc.so, tieuDe: cc.tieuDe, mau: cc.mau, nhan: cc.nhan, t0: t, manh: [], cau: [], su: [], nhanManh: [], khung: [] }
  // LỜI RIÊNG của cảnh (cc.loiRieng — tệp trong thư mục tư liệu: [{ chu, tu, den }]): lời viết lại PHỦ KÍN mọi ý Thầy giảng (từ lời nguyên văn), thay lời
  // tóm tắt của văn phòng vốn bỏ sót những đoạn Thầy đang giảng (thầy 14/11 «đoạn 1:20 thầy nói mà bảng với hoạt hoạ không minh hoạ»)
  const loiCanh = cc.loiRieng ? JSON.parse(readFileSync(join(duLieu, cc.loiRieng), 'utf8')) : c.loi
  const cauGoc = cc.dong.map((i) => ({ i, ...loiCanh[i] }))
  let trc = null
  canh.nham = []
  // PHÁT CHẬM (cc.cham: [[câu, tốc độ]]) — câu nhẩm số dày đặc chạy chậm lại cả giọng (giữ cao độ) lẫn nét bảng
  const tocCau = new Map((cc.cham ?? []).map(([i, k]) => [i, k]))
  const chenDoVui = (sMoc) => {
    const dv = cc.doVui
    canh.manh.push({ t0: t, t1: t + dv.giay, s0: sMoc, s1: sMoc, giong: false, dung: true })
    canh.doVui = { t0: t, t1: t + dv.giay, hoi: dv.hoi, luaChon: dv.luaChon, moDong: dv.moDong, tom: dv.tom }
    sfx.push({ t: t + 0.05, loai: 'vut' }, { t: t + 0.5, loai: 'bop' })
    for (let g = 0; g < 5; g++) sfx.push({ t: t + dv.giay - 5.4 + g, loai: g === 4 ? 'tich-cuoi' : 'tich' })
    t += dv.giay
  }
  if (cc.doVui && cc.doVui.sauDong === -1) chenDoVui(batDau(cauGoc[0].tu))
  for (const [k, cg] of cauGoc.entries()) {
    const a = batDau(cg.tu), b = ketThuc(cg.den)
    if (trc != null && a > trc) {
      if (cc.vietThat) for (const m of chiaNoi(trc, a, NOI_CAU)) { canh.manh.push({ t0: t, t1: t + m.dai, s0: m.s0, s1: m.s1, giong: false }); t += m.dai }
      else { canh.manh.push({ t0: t, t1: t + NOI_CAU, s0: trc, s1: a, giong: false }); t += NOI_CAU }
    }
    // EM NHẨM TRƯỚC (cc.nham: [{ truocDong, giay, hoi }]) — ngay trước câu Thầy nói đáp số: dừng hình, câu hỏi + đếm ngược 3-2-1 cho em tự nhẩm
    for (const nh of (cc.nham ?? []).filter((x) => x.truocDong === cg.i)) {
      canh.manh.push({ t0: t, t1: t + nh.giay, s0: a, s1: a, giong: false, dung: true })
      canh.nham.push({ t0: t, t1: t + nh.giay, hoi: nh.hoi, goi: nh.goi ?? 'Nghe Thầy giải' })
      sfx.push({ t: t + 0.02, loai: 'vut' }, { t: t + 0.45, loai: 'bop' }); for (let g = 0; g < 3; g++) sfx.push({ t: t + nh.giay - 3.6 + g, loai: g === 2 ? 'tich-cuoi' : 'tich' })
      t += nh.giay
    }
    const cau = { i: cg.i, chu: cg.chu, t0: t, s0: a, s1: b }
    const toc = tocCau.get(cg.i) ?? 1
    for (const m of catCau(a, b, !!cc.vietThat)) {
      const d = m.giong ? (m.s1 - m.s0) / toc : m.dai
      canh.manh.push({ t0: t, t1: t + d, s0: m.s0, s1: m.s1, giong: m.giong }); if (m.giong) giong.push({ t0: t, s0: m.s0, s1: m.s1, ...(toc !== 1 ? { k: toc } : {}) }); t += d
    }
    cau.t1 = t; canh.cau.push(cau); trc = b
    // ĐỐ VUI chèn sau câu `sauDong`: bảng đứng, giọng tắt, thẻ câu hỏi + đếm ngược
    if (cc.doVui && cg.i === cc.doVui.sauDong) chenDoVui(b)
    void k
  }
  const duoi = cc.duoi ?? DUOI_CANH // đuôi cảnh (giây, chạy đúng nhịp tiếng gốc): đủ để thấy nét viết cuối + kết quả
  canh.manh.push({ t0: t, t1: t + duoi, s0: trc, s1: trc + duoi, giong: false }); t += duoi
  canh.t1 = t
  // sự kiện hiện thẻ / điểm nhấn / phân tử theo đầu câu
  const dauCau = (i) => canh.cau.find((x) => x.i === i)
  // LỘ ĐÁP ÁN đúng lúc Thầy nói chữ cuối câu ("…là 4a"): đáy đoạn giọng cuối của câu − 0,55 s
  if (canh.doVui && cc.doVui.moLuc == null) { const q = dauCau(canh.doVui.moDong); canh.doVui.tMo = q.t1 - 0.55; sfx.push({ t: canh.doVui.tMo, loai: 'dung' }) }
  const moc = (dong, frac) => { const q = dauCau(dong); return q ? q.t0 + (frac != null ? frac * (q.t1 - q.t0) : 0.35) : null }
  // GIỜ TỪNG CHỮ của phụ đề từ lời nguyên văn (gióng hàng khop-loi.mjs)
  if (AM_ASR) for (const q of canh.cau) {
    const r = gioTungChu(q.chu.split(/\s+/), AM_ASR, q.s0, q.s1)
    if (r && r.khop >= Math.min(3, r.tong)) q.gioAsr = r.tu
    console.log(`  khớp lời câu ${q.i}: ${r ? r.khop : 0}/${q.chu.split(/\s+/).length} chữ neo`)
  }
  /** giây trên tiếng gốc ⇒ giây trên video (qua bảng mảnh của cảnh) */
  const raGioCanh = (sv) => { for (const m of canh.manh) if (m.s1 > m.s0 && sv >= m.s0 && sv <= m.s1) return m.t0 + ((sv - m.s0) / (m.s1 - m.s0)) * (m.t1 - m.t0); let best = null, kc = 1e9; for (const m of canh.manh) { const d = Math.min(Math.abs(sv - m.s0), Math.abs(sv - m.s1)); if (d < kc) { kc = d; best = sv <= m.s0 ? m.t0 : m.t1 } } return best }
  /** GIỜ TỪ KHOÁ (chỉ có lời tóm tắt, không có giờ từng chữ): câu chia CỤM theo dấu phẩy; cụm đặt lên trục THỜI GIAN CÓ GIỌNG theo số ÂM TIẾT
   *  (tiếng Việt một chữ một âm), đầu cụm hút vào điểm Thầy bắt đầu nói sau một khoảng lặng gần nhất (±1,2 s); trong cụm đi theo nhịp nói ~4,5 âm/giây.
   *  Sai số bị chặn trong một cụm, không trôi dọc cả câu dài. Mốc nào có NÉT VIẾT thì dùng {s} (chính xác tuyệt đối). */
  const gioTu = (dong, khoa, lan = 1) => {
    const q = dauCau(dong); if (!q) return null
    const tu = q.chu.split(/\s+/), sach = (w) => w.toLowerCase().normalize('NFC').replace(/[.,:;!?()]/g, '')
    let dem = 0, vt = -1; for (let i = 0; i < tu.length; i++) if (sach(tu[i]).includes(sach(khoa)) && ++dem === lan) { vt = i; break }
    return vt < 0 ? null : gioChu(q, vt)
  }
  /** giờ (video) chữ thứ vt của câu q */
  function gioChu(q, vt) {
    if (q.gioAsr) return raGioCanh(q.gioAsr[vt]) // giờ thật Thầy nói chữ này
    // GHIM một chữ vào nét viết (cc.ghimChu: [câu, chữ thứ mấy, giây tiếng gốc]) — vd. «gắn Na» đúng lúc Thầy viết «Na»
    const gc = (cc.ghimChu ?? []).find(([d2, w2]) => d2 === q.i && w2 === vt); if (gc) return raGioCanh(gc[2])
    const tu = q.chu.split(/\s+/)
    const am = tu.map(soAm), cong = (a, b) => am.slice(a, b).reduce((x, y) => x + y, 0), tong = cong(0, tu.length)
    let dauCum = 0; for (let i = 0; i < vt; i++) if (/[,;:]$/.test(tu[i])) dauCum = i + 1
    // các đoạn CÓ GIỌNG của câu trên tiếng gốc (trừ khoảng lặng)
    const doan = []; let cur = q.s0
    for (const [x, y] of lang) { if (y <= q.s0 || x >= q.s1) continue; if (x > cur) doan.push([cur, x]); cur = Math.max(cur, y) }
    if (q.s1 > cur) doan.push([cur, q.s1])
    const V = doan.reduce((z, [x, y]) => z + y - x, 0); if (!V) return null
    const raNguon = (v) => { for (const [x, y] of doan) { if (v <= y - x) return x + v; v -= y - x } return q.s1 }
    const raGiong = (sv) => { let v = 0; for (const [x, y] of doan) { if (sv <= y) return v + Math.max(0, sv - x); v += y - x } return V }
    let sCum = raNguon((cong(0, dauCum) / tong) * V)
    let gan = null; for (const [x] of doan) if (Math.abs(x - sCum) <= 1.2 && (gan == null || Math.abs(x - sCum) < Math.abs(gan - sCum))) gan = x
    if (gan != null) sCum = gan
    // GHIM đầu cụm vào nét viết (cc.ghimCum: [câu, cụm thứ mấy, giây tiếng gốc]): lúc Thầy đánh dấu / viết đúng nội dung cụm đó trên bảng
    const soCum = tu.slice(0, dauCum).filter((w) => /[,;:]$/.test(w)).length, ghim = (cc.ghimCum ?? []).find(([d2, c2]) => d2 === q.i && c2 === soCum)
    if (ghim) sCum = Math.min(q.s1, Math.max(q.s0, ghim[2]))
    return raGioCanh(raNguon(Math.min(V, raGiong(sCum) + cong(dauCum, vt) / 4.5)))
  }
  // PHỤ ĐỀ CỤM (cc.phuDeCum — thầy 14/11 «học tất cả cách làm phụ đề siêu cuốn»): như phụ đề ngắn của các kênh giảng dạy lớn — mỗi lần MỘT cụm (tách ở dấu
  // phẩy, cụm dài > 8 chữ tách đôi cho ≤ 2 dòng), hiện đúng đầu cụm trên trục lời, chữ bật lên lần lượt theo nhịp nói ~4,5 âm/giây, giữ tới cụm sau.
  if (cc.phuDeCum) {
    canh.phuDe = []
    for (const q of canh.cau) {
      const tu = q.chu.split(/\s+/), cum = []; let bd = 0
      tu.forEach((w, j) => { if (/[,;:]$/.test(w) || j === tu.length - 1) { cum.push([bd, j + 1]); bd = j + 1 } })
      // cụm dài > 8 chữ tách đôi ở chỗ ngắt tự nhiên gần giữa nhất (trước «mà, thì, nên, còn, là, với, khi, để, vì»), không thì ở giữa
      const NGAT = /^(mà|thì|nên|còn|là|với|khi|để|vì)$/i
      const tach = []; for (const [x, y] of cum) {
        if (y - x <= 8) { tach.push([x, y]); continue }
        let g = x + Math.ceil((y - x) / 2), tot = 1e9; for (let j = x + 2; j <= y - 2; j++) if (NGAT.test(tu[j]) && Math.abs(j - (x + y) / 2) < tot) { tot = Math.abs(j - (x + y) / 2); g = j }
        tach.push([x, g], [g, y])
      }
      tach.forEach(([x, y]) => { const t0 = Math.max(q.t0, (gioChu(q, x) ?? q.t0) - 0.1); canh.phuDe.push({ chu: tu.slice(x, y).join(' '), t0, cau: q, x, y }) })
    }
    canh.phuDe.forEach((c, i) => { const p = canh.phuDe[i - 1]; if (p && c.t0 < p.t0 + 0.5) c.t0 = p.t0 + 0.5 })
    // cụm hiện chưa tới 1 giây ⇒ gộp với cụm sau cùng câu (≤ 10 chữ): mắt kịp đọc
    for (let i = 0; i + 1 < canh.phuDe.length; i++) {
      const c = canh.phuDe[i], n = canh.phuDe[i + 1]
      if (n.cau === c.cau && n.t0 - c.t0 < 1.0 && c.chu.split(/\s+/).length + n.chu.split(/\s+/).length <= 10) { c.chu += ' ' + n.chu; c.y = n.y; canh.phuDe.splice(i + 1, 1); i-- }
    }
    canh.phuDe = canh.phuDe.map((c, i) => {
      const sau = canh.phuDe[i + 1], t1 = sau ? Math.min(sau.t0 - 0.04, sau.cau === c.cau ? sau.t0 : Math.max(c.cau.t1, c.t0 + 1.2)) : c.cau.t1
      const am = c.chu.split(/\s+/).map(soAm), tw = []; let cong = 0
      for (const [k, a] of am.entries()) { const that = c.cau.gioAsr ? gioChu(c.cau, c.x + k) : null; tw.push(Math.round(Math.max(c.t0, Math.min(that ?? c.t0 + cong / 4.5, c.t0 + 0.92 * (t1 - c.t0))) * 1000) / 1000); cong += a }
      const t1g = Math.max(c.t0 + 1.2, Math.min(t1, tw[tw.length - 1] + 3.5)) // nói xong cụm 3,5 s mà chưa sang cụm sau ⇒ tắt, không treo chữ cũ
      return { chu: c.chu, t0: Math.round(c.t0 * 1000) / 1000, t1: Math.round(t1g * 1000) / 1000, tw }
    })
  }

  const mocTu = (v) => {
    if (Array.isArray(v)) return typeof v[1] === 'string' ? (gioTu(v[0], v[1], v[3] ?? 1) ?? moc(v[0], 0)) + (v[2] ?? 0) : moc(v[0], v[1])
    if (v && typeof v === 'object' && 's' in v) return raGioCanh(v.s) + (v.lech ?? 0)
    return null
  }
  // lộ đáp án đố vui đúng lúc Thầy NÓI đáp số (moLuc: mốc lời) thay vì cuối câu
  if (canh.doVui && cc.doVui.moLuc != null) { canh.doVui.tMo = mocTu(cc.doVui.moLuc); sfx.push({ t: canh.doVui.tMo, loai: 'dung' }) }
  for (const s of cc.su ?? []) { const tt = s.luc != null ? mocTu(s.luc) : moc(s.dong, s.frac); if (tt == null) continue; canh.su.push({ ...s, t: tt }); sfx.push({ t: tt, loai: s.loai === 'lon' || s.loai === 'dau' ? 'dap' : 'bop' }) }
  // HOẠT HOẠ chi tiết của cảnh: mốc = [câu, phần trăm độ dài câu] ⇒ giây trên video
  if (cc.hoat) {
    canh.hoat = { loai: cc.hoat.loai, cao: cc.hoat.cao, p: cc.hoat.p, moc: Object.fromEntries(Object.entries(cc.hoat.moc).map(([k, v]) => [k, mocTu(v)])) }
    // 4 HCl bay vào + bộ đếm lên đủ 4a NGAY TRƯỚC lúc lộ đáp án (không lướt qua «3a» khi thẻ đã sáng)
    if (canh.doVui && 'thuoc' in canh.hoat.moc) canh.hoat.moc.thuoc = Math.max(canh.doVui.tMo - 1.35, (canh.hoat.moc.tong ?? 0) + 0.3)
    const TD = { hat: { hien: 'bip', dem50: 'vut', mau: 'bop', lk: 've', oligo: 'bop', poly: 'bop' }, 'dong-phan': { hien: 'vut', doi: 'vut', so: 'dap', quy: 'bop', giu: 'bip', dau: 'bop' }, 'cat-lk': { hien: 'vut', nuoc: 'bot', tach: 'dap', mt: 'bop', hoan: 'bop', khong: 'bop' }, biuret: { thuoc: 'bot', x3: 'bip', tim: 'dung-nhe' }, 'thu-vien': { hien: 'vut', ala: 'bip', gly: 'bip', val: 'bip', lys: 'bip', lysN2: 'bip', glu: 'bip', gluC2: 'bip', sang: 'bop' }, 'cau-truc': { hien: 'vut', dk1: 'dung-nhe', alpha: 'bip', matOH: 'bop', matH: 'bop', noi: 'vut' }, bazo: { a_g1: 'bop', a_g1b: 'bop', a_acid: 'bip', a_base: 'bip', a_cung0: 'nhay', a_nuoc: 'giot', a_hop: 've', a_coona: 'lap', a_tom: 'bop', b_hien: 'vut', b_gly1: 'bop', b_ala: 'bop', b_gly2: 'bop', b_dem: 'bip', b_c1: 'dem1', b_c2: 'dem2', b_c3: 'dem3', b_tong: 'tong', b_3a: 'vut', c_can: 'giot', c_sinh: 'giot', c_triet: 'gach', c_con: 'dung-nhe', d_hien: 'vut', d_na: 'bop', d_coona: 'lap', d_tru1: 'bip', d_cong23: 'bip', d_22: 'tong', d_ala22: 'bip' }, chuoi: { hien: 'vut', cat: 'bot', d1: 'bip', d2: 'bip', d3: 'bip', d4: 'bip', d5: 'bip', tong: 'dap', thuoc: 'vut', sinh: 'bot', con: 'bop', nhan: 'bop', m1: 'bop', m2: 'bop' } }[cc.hoat.loai] ?? {}
    if (cc.hoat.loai === 'phuong-trinh') for (const k of Object.keys(canh.hoat.moc)) TD[k] = 'bop'
    for (const [k, tt] of Object.entries(canh.hoat.moc)) if (TD[k] && tt != null) sfx.push({ t: tt, loai: TD[k] })
    if (cc.hoat.loai === 'cau-truc') sfx.push({ t: canh.hoat.moc.noi + 1.05, loai: 'bot' })
    if (cc.hoat.loai === 'chuoi') sfx.push({ t: canh.hoat.moc.cat + 0.55, loai: 'bot' })
    if (cc.hoat.loai === 'bazo') { // tiếng đi kèm chuyển động phụ (khớp hoat-hoa-3.js): Na gắn vào COO⁻ · 2 liên kết đứt · giọt thứ 2, 3 · Na gắn vào Gly · = 111
      const m = canh.hoat.moc, them = (tt, loai) => { if (tt != null && Number.isFinite(tt)) sfx.push({ t: tt, loai }) }
      them(m.a_gCN3, 'gan'); them(m.c_can + 0.12, 'giot'); them(m.c_can + 0.45, 'gay'); them(m.c_can + 0.57, 'gay')
      them(m.c_sinh + 0.16, 'giot'); them(m.c_sinh + 0.32, 'giot'); them(m.c_triet + 0.5, 'gach'); them(m.d_na + 1.1, 'gan'); them(m.d_ala22 + 0.7, 'dung-nhe')
    }
  }
  // KHOANH TRÊN BẢNG: vùng nét Thầy viết trong câu ⇒ viền phát sáng + đường nối tới hình minh hoạ
  canh.danhDau = []
  for (const dd of cc.danhDau ?? []) {
    // vùng khoanh cho sẵn (neo: [x0, y0, x1, y1] toạ độ bảng) + mốc lời (luc) — dùng khi chuyển cấu hình cũ sang lời riêng
    if (dd.neo && dd.luc != null) { const t0 = mocTu(dd.luc) + (dd.lech ?? 0); if (t0 != null) { canh.danhDau.push({ t0, t1: t0 + (dd.dai ?? 2.4), neo: dd.neo, toi: dd.toi }); sfx.push({ t: t0, loai: 've' }) } continue }
    // khoanh theo GIỜ VIẾT (tuS…denS trên tiếng gốc): vùng đúng các nét Thầy viết trong khoảng ấy, hiện ngay khi viết xong vế đó
    if (dd.tuS != null) {
      const h = hopNet(dd.tuS - 0.05, dd.denS); if (!h) continue
      // `luc` (mốc lời: [câu, "từ"] / [câu, cụm] / {s}) ⇒ khoanh đúng lúc Thầy NÓI tới chữ ấy (chữ có thể đã viết từ trước) — «nói tới đâu chiếu bảng tới đó»
      const t0 = dd.luc != null ? mocTu(dd.luc) + (dd.lech ?? 0) : raGioCanh(dd.denS) + (dd.lech ?? 0.1)
      canh.danhDau.push({ t0, t1: t0 + (dd.dai ?? 2.2), neo: [h.x0, h.y0, h.x1, h.y1], toi: dd.toi }); sfx.push({ t: t0, loai: 've' }); continue
    }
    const q = dauCau(dd.dong); if (!q) continue
    const h = hopNet(q.s0 - 1, q.s1); if (!h || h.n < 2) continue
    // chỉ khoanh khi Thầy đã viết xong ~80 % nét của câu (giờ nét trên tiếng gốc ⇒ giờ video qua bảng mảnh)
    const ket = netBox.filter((b) => b.t1 >= q.s0 - 1 && b.t0 <= q.s1).map((b) => b.t1).sort((a, b) => a - b)
    const sXong = ket[Math.min(ket.length - 1, Math.floor(ket.length * 0.8))]
    const raGio = (sv) => { for (const m of canh.manh) if (sv >= m.s0 && sv <= m.s1 && m.s1 > m.s0) return m.t0 + ((sv - m.s0) / (m.s1 - m.s0)) * (m.t1 - m.t0); return null }
    let t0 = Math.max(q.t0 + (dd.frac ?? 0.15) * (q.t1 - q.t0), raGio(sXong) ?? 0)
    const t1 = Math.max(q.t1 + 0.25, t0 + 1.6)
    canh.danhDau.push({ t0, t1, neo: [h.x0, h.y0, h.x1, h.y1], toi: dd.toi })
    sfx.push({ t: t0, loai: 've' })
  }
  for (const i of cc.nhan ?? []) { const q = dauCau(i); if (q) canh.nhanManh.push({ t0: q.t0, t1: q.t1 }) }
  if (cc.phanTu) { canh.phanTu = Object.fromEntries(Object.entries(cc.phanTu).map(([k, i]) => [k, typeof i === 'number' ? dauCau(i).t0 + 0.4 : mocTu(i)])); for (const k of ['hien', 'matOH', 'matH']) sfx.push({ t: canh.phanTu[k], loai: 'bop' }); sfx.push({ t: canh.phanTu.noi + 0.9, loai: 'dap' }, { t: canh.phanTu.nuoc + 1.2, loai: 'bot' }) }
  // khung máy quay: theo nét Thầy viết quanh từng câu; câu không viết ⇒ giữ khung trước
  const hopCanh = hopNet(canh.cau[0].s0 - 25, canh.cau[canh.cau.length - 1].s1) ?? hopNet(canh.cau[0].s0 - 120, canh.cau[0].s0)
  let kTruoc = hopCanh ? khungQuay(hopCanh) : [0, 0, BANG_W, BANG_W / KHUNG_TI]
  canh.khung.push({ t: canh.t0, k: kTruoc })
  for (const q of canh.cau) {
    const h = hopNet(q.s0 - 4, q.s1)
    if (h && h.n >= 3) { kTruoc = khungQuay(moRong(h, canh.cau[0].s0 - 300, q.s1)); canh.khung.push({ t: q.t0, k: kTruoc }) }
  }
  // MÁY QUAY BÁM CỤM NÉT (thầy 14/11 «bảng và hoạt hoạ phối hợp nhịp nhàng»): mỗi lần Thầy bắt đầu viết một cụm ⇒ máy tới trước 0,4 s, khung = các nét
  // của cảnh quanh cụm đó (cùng vùng chữ) ⇒ thấy rõ chữ đang viết + phần đã viết bên cạnh. Khung gần giống khung trước thì không đổi (không giật).
  if (cc.khungNet) {
    const sA = canh.cau[0].s0 - 2, sB = canh.cau[canh.cau.length - 1].s1, nets = netBox.filter((b) => b.t0 >= sA && b.t0 <= sB), ks = [canh.khung[0]]
    const giao = (a, b) => { const x = Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])), y = Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1])); return (x * y) / (a[2] * a[3] + b[2] * b[3] - x * y) }
    for (const c of cumNet(sA, sB)) {
      const cx = (c.x0 + c.x1) / 2, cy = (c.y0 + c.y1) / 2, gan = nets.filter((b) => Math.abs((b.x0 + b.x1) / 2 - cx) < 420 && Math.abs((b.y0 + b.y1) / 2 - cy) < 170)
      const h = gan.reduce((r, b) => ({ x0: Math.min(r.x0, b.x0), y0: Math.min(r.y0, b.y0), x1: Math.max(r.x1, b.x1), y1: Math.max(r.y1, b.y1) }), { x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1 })
      const k = khungQuay(h), cuoi = ks[ks.length - 1]
      let tt = raGioCanh(c.t0) - 0.4
      if (ks.length === 1) tt = Math.max(tt, cuoi.t + 0.5) // cụm đầu: vào gần ngay khi cảnh mở
      if (giao(k, cuoi.k) > 0.72 || (ks.length > 1 && tt < cuoi.t + 1.3)) continue
      ks.push({ t: tt, k })
    }
    canh.khung = ks
  }
  // MÁY QUAY THEO LỜI: chỗ được khoanh mà đang nằm ngoài khung ⇒ máy tới đó trước 0,7 s, khoanh xong thì về lại khung cũ (nét Thầy viết tiếp vẫn trong hình)
  if (cc.khungNet) for (const dd of canh.danhDau.slice().sort((x, y) => x.t0 - y.t0)) {
    const ks = canh.khung, i = ks.reduce((z, k, j) => (k.t <= dd.t0 ? j : z), 0), k = ks[i].k, [x0, y0, x1, y1] = dd.neo
    if (x0 >= k[0] + 20 && x1 <= k[0] + k[2] - 20 && y0 >= k[1] + 20 && y1 <= k[1] + k[3] - 20) continue
    const cxN = (x0 + x1) / 2, cyN = (y0 + y1) / 2, gan = netBox.filter((b) => b.t0 <= (dd.s ?? 1e9) && Math.abs((b.x0 + b.x1) / 2 - cxN) < 380 && Math.abs((b.y0 + b.y1) / 2 - cyN) < 150)
    const h = gan.reduce((r, b) => ({ x0: Math.min(r.x0, b.x0), y0: Math.min(r.y0, b.y0), x1: Math.max(r.x1, b.x1), y1: Math.max(r.y1, b.y1) }), { x0, y0, x1, y1 })
    const toi = { t: dd.t0 - 0.7, k: khungQuay(h) }, sau = ks[i + 1]
    ks.splice(i + 1, 0, toi)
    if (!sau || sau.t > dd.t1 + 1.4) ks.splice(i + 2, 0, { t: dd.t1 + 0.2, k })
  }
  canh.vung = hopCanh ? khungQuay(hopCanh) : kTruoc
  // KHUNG ĐỘNG (cc.cheDo: [[mốc, 'bang' | 'minh']]): «bang» = bảng mở rộng gần cả màn, phóng to chữ (chỗ Thầy đã viết / vẽ rõ); «minh» = bảng + cột hoạt hoạ
  if (cc.cheDo) canh.cheDo = cc.cheDo.map(([moc2, che]) => ({ t: moc2 === 'dau' ? canh.t0 : mocTu(moc2), p: che === 'bang' ? 1 : 0 })).filter((x) => x.t != null).sort((x, y) => x.t - y.t)
  // THẺ NỔI trên bảng (cc.theNoi: [{ luc, giay, chu }]) — ý chốt khi đang ở khung «bang»
  if (cc.theNoi) canh.theNoi = cc.theNoi.map((x) => { const t0 = mocTu(x.luc); return { t0, t1: t0 + (x.giay ?? 5), chu: x.chu } })
  if (!canh.nham.length) delete canh.nham
  doan.push(canh)
}
// kết
const KET_DAI = Math.max(KET, 6.5 + ch.ket.y.length * 0.9)
doan.push({ loai: 'ket', t0: t, t1: t + KET_DAI, ...ch.ket }); sfx.push({ t: t + 0.02, loai: 'vut' }); ch.ket.y.forEach((_, i) => sfx.push({ t: t + 1.3 + i * 0.9, loai: 'bop' })); sfx.push({ t: t + KET_DAI - 3.6, loai: 'dap' })
t += KET_DAI

const kb = { fps: 30, rong: 1920, cao: 1080, nhip: NHIP, bo: BO, tong: Math.round(t * 1000) / 1000, ten: ch.ten, lop: ch.lop, ngay: ch.ngay, doan, giong, sfx: sfx.sort((a, b) => a.t - b.t) }
writeFileSync(join(ra, 'kich-ban.json'), JSON.stringify(kb))
writeFileSync(join(ra, 'net.json'), JSON.stringify(NET_GIO ?? { rong: tr.rong, cao: tr.cao, mau: tr.mau, net: tr.net }))
const giay = (x) => `${Math.floor(x / 60)}:${String(Math.round(x % 60)).padStart(2, '0')}`
console.log(`tổng ${giay(t)} (${t.toFixed(1)} s) · ${giong.length} mảnh giọng · ${sfx.length} tiếng động`)
for (const d of doan) console.log(`  ${d.loai.padEnd(10)} ${d.t0.toFixed(1).padStart(6)} → ${d.t1.toFixed(1).padStart(6)}  ${d.id ?? ''} ${d.cau ? `${d.cau.length} câu · ${d.khung.length} khung · vùng ${d.vung}` : ''}`)
