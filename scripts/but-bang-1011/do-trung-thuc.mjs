#!/usr/bin/env node
// ĐO ĐỘ TRUNG THỰC CỦA BÚT VIẾT BẢNG (11/11, thầy viết Wacom thật: «Viết bị nhằng nhằng chưa mượt như goodnote. Tối ưu viết tới mức đó hoặc hơn»).
// Viết ba dòng chữ NHỎ, NHANH của thầy («Anh yêu em» · «mm mm» · «KMnO4 + H2SO4») bằng quỹ đạo thật (scripts/but-bang-1011/chu-nho.mjs) vào TỜ CHIẾU THẬT trong Chromium,
// ở 60 / 125 / 200 mẫu mỗi giây, bốn loại thiết bị (bút có lực · chuột · bút lướt không báo nhấc · bút dồn giờ mẫu), rồi so nét VẼ RA với đường tay thật đã đi.
//   node scripts/but-bang-1011/do-trung-thuc.mjs [--goc=<thư mục chứa src/ của bản cũ>] [--ra=docs/ban-ve-but-1011/so-do-trung-thuc.json] [--nhanh=1] [--bo-khung] [--chi-khung] [--chi-tre] [--luot=3]
// Chỉ số:
//   (i)   lệch tâm nét so với quỹ đạo thật, px — hai chiều (thật → vẽ: mất dáng chữ · vẽ → thật: đuôi, vượt), lớn nhất + trung bình. Tâm nét VẼ RA có tính cả phép tô
//         «đường cong bậc hai qua trung điểm» của bộ máy (đỉnh thưa thì phép tô đó cắt góc).
//   (ii)  số nét vẽ ra so với số nét thật (nét dính) + số nét có mực ở chỗ bút KHÔNG chạm (đuôi thừa, cách mọi đường thật > 2 px).
//   (iii) độ trễ đầu nét: ngay sau khi một mẫu tới / sau mỗi khung hình, mực đã tới mẫu mới nhất chưa — đọc ĐIỂM ẢNH của hai lớp canvas (tính bằng số mẫu, ms, px).
//         Mỗi nét còn cho bút KHỰNG LẠI hai khung đúng lúc đi nhanh nhất: mực thò ra 3 px phía trước mẫu cuối = đoạn dự đoán nằm lại trên bảng
//         (lượt không có dự đoán cho số nền: chỗ đó vốn đã có mực của nét khác / chính nét đó vòng lại).
//   (iv)  phát thời gian thật qua CDP (pointerType pen, 200 Hz) ở CPU ×1 và ×4: khung hình mỗi giây, thời gian xử lý mỗi mẫu / mỗi khung.
// (i)–(iii) phát bằng PointerEvent dựng sẵn (đúng thứ tự Chromium: pointerrawupdate từng mẫu ⇒ cuối khung một pointermove mang các mẫu gộp ⇒ requestAnimationFrame),
// giờ của mẫu ghi đè đúng giờ thiết bị ⇒ lặp lại lần nào cũng ra cùng số, hai bản nhận đúng cùng một dữ liệu.
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { taoTo } from './chup.mjs'
import { baiChuNho, layMau, duongThat } from './chu-nho.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const LA_CHINH = import.meta.url === pathToFileURL(process.argv[1]).href
const thamSo = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true] }))
const RA = resolve(thamSo.ra ?? join(GOC, 'docs/ban-ve-but-1011/so-do-trung-thuc.json'))
const NHANH = +(thamSo.nhanh ?? 1)
const HZ = [60, 125, 200]
const THIET_BI = [['but', 'bút có lực'], ['chuot', 'chuột không lực (toạ độ nguyên px)'], ['luot', 'bút lướt, máy không báo nhấc'], ['don', 'bút, giờ mẫu dồn theo khung']]

// ── hình học ──
function xaDuong(x, y, p) {
  if (p.length === 2) return Math.hypot(x - p[0], y - p[1])
  let tot = Infinity
  for (let i = 0; i + 3 < p.length; i += 2) {
    const ax = p[i], ay = p[i + 1], vx = p[i + 2] - ax, vy = p[i + 3] - ay, q = vx * vx + vy * vy
    const t = q ? Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / q)) : 0
    const d = Math.hypot(ax + t * vx - x, ay + t * vy - y); if (d < tot) tot = d
  }
  return tot
}
/** Phép tô của bộ máy (veDaGiac) nối các đỉnh bằng đường cong bậc hai qua TRUNG ĐIỂM ⇒ áp đúng phép đó lên đường tâm. Chỗ quay đầu gắt bộ máy thêm quạt tròn (không cắt góc) ⇒ giữ nguyên đỉnh. */
function quaTrungDiem(p) {
  const n = p.length >> 1; if (n < 3) return p
  const ra = [p[0], p[1]], X = (i) => p[2 * i], Y = (i) => p[2 * i + 1]
  for (let i = 1; i < n - 1; i++) {
    const ax = X(i) - X(i - 1), ay = Y(i) - Y(i - 1), bx = X(i + 1) - X(i), by = Y(i + 1) - Y(i)
    const cham = (ax * bx + ay * by) / ((Math.hypot(ax, ay) || 1) * (Math.hypot(bx, by) || 1))
    const x0 = i === 1 ? X(0) : (X(i - 1) + X(i)) / 2, y0 = i === 1 ? Y(0) : (Y(i - 1) + Y(i)) / 2
    const x1 = i === n - 2 ? X(n - 1) : (X(i) + X(i + 1)) / 2, y1 = i === n - 2 ? Y(n - 1) : (Y(i) + Y(i + 1)) / 2
    if (cham < -0.25) { ra.push(x0, y0, X(i), Y(i), x1, y1); continue }
    for (let k = 0; k <= 6; k++) { const t = k / 6, u = 1 - t; ra.push(u * u * x0 + 2 * u * t * X(i) + t * t * x1, u * u * y0 + 2 * u * t * Y(i) + t * t * y1) }
  }
  return ra
}
function chiaDay(p, buoc = 0.25) {
  if (p.length < 4) return p
  const ra = []
  for (let i = 0; i + 3 < p.length; i += 2) { const d = Math.hypot(p[i + 2] - p[i], p[i + 3] - p[i + 1]), n = Math.max(1, Math.ceil(d / buoc)); for (let k = 0; k < n; k++) ra.push(p[i] + (p[i + 2] - p[i]) * k / n, p[i + 1] + (p[i + 3] - p[i + 1]) * k / n) }
  ra.push(p[p.length - 2], p[p.length - 1]); return ra
}
const hop = (p) => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (let i = 0; i < p.length; i += 2) { a = Math.min(a, p[i]); c = Math.max(c, p[i]); b = Math.min(b, p[i + 1]); d = Math.max(d, p[i + 1]) } return [a, b, c, d] }
const giao = (h, k, le) => h[0] - le <= k[2] && k[0] - le <= h[2] && h[1] - le <= k[3] && k[1] - le <= h[3]
/** Khoảng cách từ mọi điểm của các đường `tu` tới tập đường `toi` gần nhất (cắt ở 20 px). Trả về { lon, tong, dem, moiDuong: [lớn nhất của từng đường `tu`] }. */
function lech(tu, toi) {
  const ht = toi.map(hop), ra = { lon: 0, tong: 0, dem: 0, moiDuong: [] }
  for (const p of tu) {
    const h = hop(p), gan = toi.filter((_, j) => giao(h, ht[j], 20))
    let lonP = 0
    for (let i = 0; i < p.length; i += 2) {
      let d = 20
      for (const q of gan) { const v = xaDuong(p[i], p[i + 1], q); if (v < d) d = v }
      if (d > lonP) lonP = d
      ra.tong += d; ra.dem++
    }
    ra.moiDuong.push(lonP); if (lonP > ra.lon) ra.lon = lonP
  }
  return ra
}

// ── chạy trong trang ──
/** Phát chuỗi sự kiện vào tờ (đồng bộ, requestAnimationFrame do bộ đo cầm). Trả về { net: nét đã ghi, tam: đường tâm từng nét, tre: số đo trễ đầu nét }. */
export function phatTrongTrang({ sk, hz, doTre, veNgay, duDoan }) {
  const cv = document.querySelector('canvas.mc-but-song'), cvT = [...document.querySelectorAll('canvas.mc-but')].find((c) => c !== cv)
  const B = window.__mcBut, L = B.loi, KH = L.khung(innerWidth, innerHeight), coRaw = 'onpointerrawupdate' in window, dpr = Math.min(devicePixelRatio || 1, 3)
  if (B.veNgay) B.veNgay(!!veNgay)
  const hang = [], rafThat = window.requestAnimationFrame
  window.requestAnimationFrame = (f) => { hang.push(f); return hang.length }
  const T0 = 500000, F = 1000 / 60
  const tao = (loai, e, them = {}) => {
    const ev = new PointerEvent(loai, { pointerId: 7, pointerType: e.loai, isPrimary: true, clientX: e.x, clientY: e.y, pressure: e.p, buttons: e.b, button: loai === 'pointerdown' || loai === 'pointerup' ? 0 : -1, bubbles: true, cancelable: true, ...them })
    Object.defineProperty(ev, 'timeStamp', { value: T0 + (e.tGhi ?? e.t) })
    return ev
  }
  // mực đã phủ điểm (x, y) chưa: đọc điểm ảnh 3 × 3 của cả hai lớp
  const coMuc = (x, y) => [cv, cvT].some((c) => { const d = c.getContext('2d').getImageData(Math.round(x * dpr) - 1, Math.round(y * dpr) - 1, 3, 3).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) return true; return false })
  const tre = { sauMau: [], sauKhung: [], duoiDoan: 0, lanDung: 0 }
  let netMau = [] // các mẫu chạm của nét đang viết
  const doMotLan = (vao) => {
    if (!doTre || netMau.length < 2) return
    let lui = 0, px = 0
    for (let i = netMau.length - 1; i > 0 && !coMuc(netMau[i].x, netMau[i].y); i--) { lui++; px += Math.hypot(netMau[i].x - netMau[i - 1].x, netMau[i].y - netMau[i - 1].y) }
    vao.push([lui, px])
  }
  let cho = [], khung = Math.floor(sk[0].t / F)
  // mẫu đi nhanh nhất của từng nét (chỉ lấy nét có lúc nhanh hơn 250 px / giây)
  const khung_ = {}
  { const nhanh = {}; for (let i = 1; i < sk.length; i++) { const e = sk[i], a = sk[i - 1]; if (e.k !== 'm' || !e.b || a.net !== e.net || a.k === 'u') continue; const v = Math.hypot(e.x - a.x, e.y - a.y) / Math.max(1, e.t - a.t); if (v > 0.25 && v > (nhanh[e.net] || 0)) { nhanh[e.net] = v; khung_[e.net] = e } } }
  const xaMove = () => {
    if (!cho.length) return
    const c = cho[cho.length - 1]
    // đoạn dự đoán kiểu trình duyệt: kéo thẳng theo vận tốc hai mẫu cuối, 3 điểm cách nhau một nhịp mẫu (đủ để thử phần kẹp của bộ máy)
    let du = []
    if (duDoan && netMau.length > 1 && c.b) { const a = netMau[netMau.length - 2], dt = Math.max(1, c.t - a.t), vx = (c.x - a.x) / dt, vy = (c.y - a.y) / dt, buoc = 1000 / hz; du = [1, 2, 3].map((k) => tao('pointermove', { ...c, x: c.x + vx * buoc * k, y: c.y + vy * buoc * k, t: c.t + buoc * k, tGhi: undefined })) }
    cv.dispatchEvent(tao('pointermove', c, { coalescedEvents: cho.map((e) => tao('pointermove', e)), predictedEvents: du }))
    cho = []
  }
  const xaKhung = () => { xaMove(); const q = hang.splice(0); for (const f of q) f(T0 + (khung + 1) * F); doMotLan(tre.sauKhung) }
  for (const e of sk) {
    const k = Math.floor(e.t / F)
    if (k !== khung) { xaKhung(); khung = k }
    if (e.k === 'd') { netMau = [e]; cv.dispatchEvent(tao('pointerdown', e)) }
    else if (e.k === 'u') { xaMove(); cv.dispatchEvent(tao('pointerup', e)); netMau = [] }
    else {
      if (e.b) { if (!netMau.length || netMau[netMau.length - 1].net !== e.net) netMau = []; netMau.push(e) } else netMau = []
      if (coRaw) cv.dispatchEvent(tao('pointerrawupdate', e))
      cho.push(e)
      if (e.b) doMotLan(tre.sauMau)
      // BÚT KHỰNG LẠI giữa nét, đúng lúc đang đi nhanh nhất (thử phần dự đoán): vẽ khung này rồi thêm hai khung KHÔNG có sự kiện nào —
      // mực còn thò ra 3 px phía trước mẫu cuối là đoạn dự đoán nằm lại trên bảng (phần nét thật phía trước chưa được đưa vào).
      if (doTre && khung_[e.net] === e) {
        const a = netMau[netMau.length - 2], d = Math.hypot(e.x - a.x, e.y - a.y)
        xaMove(); for (let k = 1; k <= 3; k++) { const q = hang.splice(0); for (const f of q) f(T0 + (khung + k) * F) }
        tre.lanDung++; if (coMuc(e.x + (e.x - a.x) / d * 3, e.y + (e.y - a.y) / d * 3)) tre.duoiDoan++
      }
    }
  }
  xaKhung(); xaKhung(); xaKhung()
  window.requestAnimationFrame = rafThat
  const net = B.xuat().net
  const tam = net.map((n) => {
    if (L.duongTam) return L.duongTam(n, KH)
    // bản cũ: đường tâm đã lọc + đoạn nối thẳng tới điểm thật cuối cùng (đúng như hàm vien của bản cũ)
    const st = L.moXuLy(n, KH); L.xuLyThem(st, n.diem, n.diem.length)
    const p = []; for (let i = 0; i < st.X.length; i++) p.push(st.X[i], st.Y[i])
    const m = p.length; if (!m || Math.hypot(p[m - 2] - st.px, p[m - 1] - st.py) >= 0.3) p.push(st.px, st.py)
    return p
  })
  // mực còn lại trên từng lớp trong ô chữ (đếm điểm ảnh có mực): viết xong thì lớp SỐNG phải sạch, lớp TĨNH giữ đủ nét — chế độ vẽ nào cũng phải ra cùng một hình
  const demMuc = (c) => { const d = c.getContext('2d').getImageData(1300 * dpr, 270 * dpr, 240 * dpr, 190 * dpr).data; let n = 0, tong = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) { n++; tong += d[i] } return [n, tong] }
  return { tam, soDiem: net.reduce((s, n) => s + n.diem.length, 0), tre, coRaw, veNgay: B.veNgay ? B.veNgay() : false, mucTinh: demMuc(cvT), mucSong: demMuc(cv) }
}

const tk = (ds) => { const s = [...ds].sort((a, b) => a - b), lay = (p) => (s.length ? +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(3) : 0); return { n: s.length, trungBinh: s.length ? +(s.reduce((a, b) => a + b, 0) / s.length).toFixed(3) : 0, trungVi: lay(0.5), p95: lay(0.95), lonNhat: lay(1) } }
const lam = (v, k = 2) => +v.toFixed(k)

export async function moTo(trinh, tep, loi, dpr = 1) {
  const ctx = await trinh.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: dpr, reducedMotion: 'reduce' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loi.push(e.message))
  await t.goto(pathToFileURL(tep).href)
  await t.waitForFunction(() => document.body.getAttribute('data-bo-cuc') === 'xong')
  await t.keyboard.press('l'); await t.waitForTimeout(2600)
  await t.keyboard.press('b'); await t.waitForTimeout(300)
  return { ctx, t }
}

/** (i) + (ii) + (iii) cho một bản · một thiết bị · một tần số. */
async function doMot(trinh, tep, loi, bai, that, tb, hz, tuy = {}) {
  const sk = layMau(bai, hz, tb)
  const { ctx, t } = await moTo(trinh, tep, loi)
  const kq = await t.evaluate(phatTrongTrang, { sk, hz, doTre: !!tuy.doTre, veNgay: !!tuy.veNgay, duDoan: !!tuy.duDoan })
  await ctx.close()
  const ve = kq.tam.map((p) => chiaDay(quaTrungDiem(p)))
  const thatDay = that // đã bước 0,1 px
  const a = lech(thatDay, ve), b = lech(ve, thatDay)
  // sàn của thiết bị: chính các mẫu (đã làm tròn px, có nhiễu) cách đường thật bao xa
  const mauCham = sk.filter((e) => e.net >= 0)
  let san = 0; for (const e of mauCham) san = Math.max(san, xaDuong(e.x, e.y, that[e.net]))
  // … và đoạn đầu / cuối nét thiết bị KHÔNG thấy (bút chạm / nhấc giữa hai nhịp mẫu mà máy không báo pointerdown / pointerup)
  for (let i = 0; i < bai.length; i++) { const m = mauCham.filter((e) => e.net === i), d = that[i]; if (m.length) san = Math.max(san, Math.hypot(m[0].x - d[0], m[0].y - d[1]), Math.hypot(m[m.length - 1].x - d[d.length - 2], m[m.length - 1].y - d[d.length - 1])) }
  const ra = {
    thietBi: tb, hz, soNetThat: bai.length, soNetVe: kq.tam.length, netDinh: Math.max(0, bai.length - kq.tam.length), netVo: Math.max(0, kq.tam.length - bai.length),
    duoiThua: b.moiDuong.filter((v) => v > 2).length, duoiDaiNhat: lam(b.lon), soDiem: kq.soDiem,
    lechLonNhat: lam(Math.max(a.lon, b.lon)), lechTrungBinh: lam((a.tong + b.tong) / (a.dem + b.dem), 3), matDang: lam(a.lon), vuot: lam(b.lon), sanThietBi: lam(san),
  }
  if (tuy.doTre) {
    const quy = (ds) => ({ soLanDo: ds.length, mauTrungBinh: lam(ds.reduce((s, v) => s + v[0], 0) / (ds.length || 1)), mauLonNhat: Math.max(0, ...ds.map((v) => v[0])), msTrungBinh: lam(ds.reduce((s, v) => s + v[0], 0) / (ds.length || 1) * 1000 / hz, 1), pxTrungBinh: lam(ds.reduce((s, v) => s + v[1], 0) / (ds.length || 1)), pxLonNhat: lam(Math.max(0, ...ds.map((v) => v[1]))), phanTramToiMauMoiNhat: Math.round(100 * ds.filter((v) => !v[0]).length / (ds.length || 1)) })
    ra.tre = { coRaw: kq.coRaw, veNgay: kq.veNgay, duDoan: !!tuy.duDoan, sauMau: quy(kq.tre.sauMau), sauKhung: quy(kq.tre.sauKhung), butDungLai: kq.tre.lanDung, duoiDoanNamLai: kq.tre.duoiDoan, mucLopTinh: kq.mucTinh, mucLopSong: kq.mucSong }
  }
  return ra
}

/** (iv) phát thời gian thật qua CDP ở 200 Hz, CPU × `cpu`. */
async function doKhung(trinh, tep, loi, bai, cpu, veNgay) {
  const ctx = await trinh.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loi.push(e.message))
  await t.addInitScript(() => {
    const D = (window.__do = { bat: false, khung: [], xlKhung: [], xlMau: 0, mau: 0, pm: 0, gop: 0, raw: 0, dangCho: 0, theoLoai: {} })
    const raf = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (f) => raf((ts) => { const a = performance.now(); f(ts); if (D.bat) D.dangCho += performance.now() - a })
    let truoc = 0
    const vong = (ts) => { if (D.bat && truoc) { D.khung.push(ts - truoc) } truoc = ts; raf(vong); setTimeout(() => { if (D.bat) { D.xlKhung.push(D.dangCho) } D.dangCho = 0 }, 0) }
    raf(vong)
    // đo thời gian các hàm nghe con trỏ của bộ máy (trên canvas)
    const them = EventTarget.prototype.addEventListener, go = EventTarget.prototype.removeEventListener, boc = new Map()
    EventTarget.prototype.addEventListener = function (loai, f, tuy) {
      if (this instanceof HTMLCanvasElement && /^pointer(move|rawupdate|down|up)$/.test(loai) && typeof f === 'function') {
        const goc = f
        f = function (e) { const a = performance.now(); const r = goc.call(this, e); if (D.bat) { const d = performance.now() - a; D.xlMau += d; D.dangCho += d; D.theoLoai[loai] = (D.theoLoai[loai] || 0) + d; if (loai === 'pointermove') { D.pm++; const n = e.getCoalescedEvents ? e.getCoalescedEvents().length || 1 : 1; D.gop += n; D.mau += n } else if (loai === 'pointerrawupdate') D.raw++ } return r }
        boc.set(goc, f)
      }
      return them.call(this, loai, f, tuy)
    }
    // bộ máy gỡ hàm nghe (tắt chế độ vẽ ngay) ⇒ gỡ đúng hàm đã bọc
    EventTarget.prototype.removeEventListener = function (loai, f, tuy) { return go.call(this, loai, boc.get(f) ?? f, tuy) }
  })
  await t.goto(pathToFileURL(tep).href)
  await t.waitForFunction(() => document.body.getAttribute('data-bo-cuc') === 'xong')
  await t.keyboard.press('l'); await t.waitForTimeout(2600)
  const cdp = await ctx.newCDPSession(t)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  await t.keyboard.press('b'); await t.waitForTimeout(400)
  // veNgay: undefined = như khi phát hành · true / false = bật / tắt chế độ vẽ ngay khi mẫu tới
  const cheDo = await t.evaluate((v) => { window.__do.bat = true; const B = window.__mcBut; return B.veNgay ? B.veNgay(v ?? undefined) : false }, veNgay ?? null)
  const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
  const cho = []
  const gui = (type, e, buttons) => cho.push(cdp.send('Input.dispatchMouseEvent', { type, x: e.x, y: e.y, button: 'left', buttons, clickCount: type === 'mouseMoved' ? 0 : 1, pointerType: 'pen', force: e.p }).catch((x) => loi.push(x.message)))
  const sk = layMau(bai, 200, 'but')
  const t0 = performance.now()
  for (const e of sk) {
    for (let con = t0 + e.t - performance.now(); con > 0; con = t0 + e.t - performance.now()) await (con > 2.5 ? ngu(1) : new Promise((r) => setImmediate(r)))
    gui(e.k === 'd' ? 'mousePressed' : e.k === 'u' ? 'mouseReleased' : 'mouseMoved', e, e.k === 'u' ? 0 : 1)
  }
  await Promise.all(cho)
  await t.waitForTimeout(300)
  const giay = (performance.now() - t0) / 1000
  const D = await t.evaluate(() => { const d = window.__do; d.bat = false; return { ...d, soNet: window.__mcBut.xuat().net.length, veNgaySau: window.__mcBut.veNgay ? window.__mcBut.veNgay() : false } })
  await ctx.close()
  const kh = tk(D.khung), xl = tk(D.xlKhung.filter((v) => v > 0))
  return { cpu, veNgayDau: cheDo, veNgaySau: D.veNgaySau, giay: lam(giay, 1), soNet: D.soNet, mauGui: sk.length, mauNhan: D.mau, suKienMove: D.pm, mauGopMoiMove: lam(D.gop / (D.pm || 1)), suKienRaw: D.raw, khungMoiGiay: lam(1000 / (kh.trungBinh || 1), 1), khungTreHon20Ms: D.khung.filter((v) => v > 20).length, tongKhung: kh.n, msMoiMau: lam(D.xlMau / (D.mau || 1), 4), msTheoLoai: Object.fromEntries(Object.entries(D.theoLoai).map(([k, v]) => [k, lam(v, 1)])), msMoiKhung: { trungBinh: xl.trungBinh, p95: xl.p95, lonNhat: xl.lonNhat } }
}

if (LA_CHINH) {
  const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
  const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
  const loi = []
  const ban = []
  if (thamSo.goc) ban.push(['cu', await taoTo(resolve(thamSo.goc), 'to-cu')])
  ban.push(['moi', await taoTo(GOC, 'to-moi')])
  const bai = baiChuNho({ nhanh: NHANH }), that = duongThat(bai)
  const kq = { luc: new Date().toISOString(), may: 'Chromium headless /opt/pw-browsers, 1920 × 1080 (1 px màn = 1 px ở màn 1920)', bai: `«Anh yêu em» · «mm mm» · «KMnO4 + H2SO4.» — chữ cao 18 / 15 / 16 px, ${bai.length} nét, viết ${lam(bai.reduce((s, q) => s + q.t[q.t.length - 1], 0) / 1000, 1)} giây (tốc độ tay × ${NHANH})`, trungThuc: [], tre: [], khung: [] }

  if (!thamSo['chi-khung'] && !thamSo['chi-tre']) for (const [ten, tep] of ban) for (const [tb] of THIET_BI) for (const hz of HZ) {
    const r = await doMot(trinh, tep, loi, bai, that, tb, hz)
    kq.trungThuc.push({ ban: ten, ...r })
    console.log(`${ten.padEnd(3)} ${tb.padEnd(5)} ${String(hz).padStart(3)} Hz · lệch lớn nhất ${String(r.lechLonNhat).padStart(5)} px (mất dáng ${r.matDang} · vượt ${r.vuot}) · trung bình ${r.lechTrungBinh} · nét ${r.soNetVe}/${r.soNetThat} (dính ${r.netDinh}, vỡ ${r.netVo}) · đuôi thừa ${r.duoiThua} · sàn thiết bị ${r.sanThietBi}`)
  }
  // (iii) trễ đầu nét: bút có lực. Bản mới đo cả hai chế độ: vẽ ngay khi nhận mẫu / vẽ theo khung + dự đoán.
  if (!thamSo['chi-khung']) for (const [ten, tep] of ban) for (const hz of HZ) for (const cd of ten === 'cu' ? [{}, { duDoan: true }] : [{ veNgay: true }, { duDoan: true }, {}]) {
    const r = await doMot(trinh, tep, loi, bai, that, 'but', hz, { doTre: true, ...cd })
    const nhan = ten === 'cu' ? (cd.duDoan ? 'cũ + dự đoán' : 'cũ') : cd.veNgay ? 'mới · vẽ ngay khi nhận mẫu' : cd.duDoan ? 'mới · vẽ theo khung + dự đoán' : 'mới · vẽ theo khung'
    kq.tre.push({ ban: ten, cheDo: nhan, hz, ...r.tre, lechLonNhat: r.lechLonNhat, soNetVe: r.soNetVe })
    // viết xong: lớp sống sạch; ba chế độ của bản mới in ra lớp tĩnh đúng cùng một hình (so số điểm ảnh có mực + tổng độ đậm)
    if (r.tre.mucLopSong[0]) loi.push(`${nhan} ${hz} Hz: lớp sống còn ${r.tre.mucLopSong[0]} điểm ảnh mực sau khi viết xong`)
    const dau = kq.tre.find((x) => x.ban === ten && x.hz === hz)
    if (dau.mucLopTinh.join() !== r.tre.mucLopTinh.join()) loi.push(`${nhan} ${hz} Hz: lớp tĩnh khác hình với chế độ «${dau.cheDo}» (${dau.mucLopTinh} ≠ ${r.tre.mucLopTinh})`)
    console.log(`trễ ${nhan.padEnd(30)} ${String(hz).padStart(3)} Hz · sau mẫu: ${r.tre.sauMau.mauTrungBinh} mẫu (${r.tre.sauMau.msTrungBinh} ms, ${r.tre.sauMau.pxTrungBinh} px; nhiều nhất ${r.tre.sauMau.mauLonNhat} mẫu) · sau khung: ${r.tre.sauKhung.mauTrungBinh} mẫu, tới mẫu mới nhất ${r.tre.sauKhung.phanTramToiMauMoiNhat} % số khung · bút khựng lại ${r.tre.butDungLai} lần, mực thò ra phía trước ${r.tre.duoiDoanNamLai} lần`)
  }
  // (iv) khung hình + thời gian xử lý, phát thật 200 Hz. Máy đo dùng chung ⇒ ba lượt xen kẽ, lấy trung vị.
  if (!thamSo['bo-khung'] && !thamSo['chi-tre']) {
    const dai = [...bai, ...baiChuNho({ nhanh: NHANH, hat: 2222, y0: 470 }), ...baiChuNho({ nhanh: NHANH, hat: 3333, y0: 640 })]
    // ba cấu hình: bản cũ · bản mới như khi phát hành (mỗi khung vẽ một lần) · bản mới BẬT thử chế độ vẽ ngay khi mẫu tới (để thấy vì sao mặc định tắt)
    const cauHinh = [...ban.map(([ten, tep]) => [ten, tep, undefined]), ['moi-ve-ngay', ban[ban.length - 1][1], true]]
    const lan = []
    for (let l = 0; l < +(thamSo.luot ?? 3); l++) for (const [ten, tep, vn] of cauHinh) for (const cpu of [1, 4]) { const r = await doKhung(trinh, tep, loi, dai, cpu, vn); lan.push({ ban: ten, ...r }); console.log(`khung ${ten} ×${cpu} lượt ${l + 1}: ${r.khungMoiGiay} khung/giây · trễ > 20 ms: ${r.khungTreHon20Ms} · mỗi mẫu ${r.msMoiMau} ms · mỗi khung tb ${r.msMoiKhung.trungBinh} p95 ${r.msMoiKhung.p95} lớn nhất ${r.msMoiKhung.lonNhat} ms · raw ${r.suKienRaw} · gộp ${r.mauGopMoiMove} · nét ${r.soNet} · vẽ ngay ${r.veNgayDau} → ${r.veNgaySau} · ${JSON.stringify(r.msTheoLoai)}`) }
    const giua = (ds) => [...ds].sort((a, b) => a - b)[ds.length >> 1]
    for (const [ten] of cauHinh) for (const cpu of [1, 4]) {
      const ds = lan.filter((r) => r.ban === ten && r.cpu === cpu)
      kq.khung.push({ ban: ten, cpu: '×' + cpu, luot: ds.length, veNgayDau: ds[0].veNgayDau, veNgaySau: ds[0].veNgaySau, mauGui: ds[0].mauGui, soNet: ds[0].soNet, khungMoiGiay: giua(ds.map((r) => r.khungMoiGiay)), khungTreHon20Ms: giua(ds.map((r) => r.khungTreHon20Ms)), tongKhung: giua(ds.map((r) => r.tongKhung)), msMoiMau: giua(ds.map((r) => r.msMoiMau)), msMoiKhung: { trungBinh: giua(ds.map((r) => r.msMoiKhung.trungBinh)), p95: giua(ds.map((r) => r.msMoiKhung.p95)), lonNhat: giua(ds.map((r) => r.msMoiKhung.lonNhat)) }, suKienRaw: giua(ds.map((r) => r.suKienRaw)), mauGopMoiMove: giua(ds.map((r) => r.mauGopMoiMove)) })
    }
  }
  await trinh.close()
  mkdirSync(dirname(RA), { recursive: true })
  writeFileSync(RA, JSON.stringify(kq, null, 2) + '\n')
  console.log('ghi', RA)
  if (loi.length) { console.error('LỖI TRANG:', [...new Set(loi)]); process.exit(1) }
}
