// MÁY BÙ CHỖ của trò «Sinh Tồn» (đặc tả docs/dac-ta-sinh-ton-1211.md mục 4) — LÕI THUẦN, chạy trong phòng (Durable Object) ở nhịp 250 ms sẵn có.
// Mỗi đội luôn đủ 4 trên sân: thiếu em thật thì máy bù, em vào thì máy rời. Máy yếu hơn người: bắn chậm (sinh-ton-loi `HE_MAY`), ngắm trễ 2 nhịp,
// súng tối đa cấp 3 (Súng Bọt — bản 2, 13/11), không nhặt hộp tiếp tế. Máy mang TÊN như học sinh (./ten-may.ts): mã `~<chỉ số tên>-<số thứ tự>`.
import {
  BAT_TU_MS, BK_NV, CAP_MAY_TOI_DA, CHAY_MS, HOI_CHO_MS, HOI_SINH_MS, MAU_DAY, TOC_DO_MAY, choTrai, chonMucTieu, dangNghi, diChuyen, matChay, ngoaiVong, satThuong, timDuong,
  trongBui, vong, type BanDo, type Diem, type NhanVat,
} from './sinh-ton-loi'
import { KHO_TEN, chiSoTen, khoTenGoi, maMay, soThuTuMay, tenGoi } from './ten-may'

export const SO_MOI_DOI = 4
export interface May {
  id: string; doi: number; x: number; y: number; mau: number; cap: number; t: string
  chetDen: number; batTuDen: number; lucTrung: number
  /** Đang cháy (trúng Súng Lửa Màu) tới lúc này; 0 = không. `chayAi` = kẻ châm lửa gần nhất (cháy hết máu ⇒ tính lượt hạ cho kẻ này). */ chayDen: number; chayAi: string
  /** Đối thủ vừa lọt tầm + số nhịp đã thấy liên tiếp (ngắm trễ). */ ungVien: string; nhipThay: number
  duong: Diem[]; dich: Diem | null; lucDuong: number; lucDich: number
}
/** Số máy mỗi đội cần có, theo số em thật đang chơi của từng đội. */
export const soMayCan = (soEm: readonly number[]): number[] => [0, 1, 2, 3].map((d) => Math.max(0, SO_MOI_DOI - (soEm[d] ?? 0)))
export function taoMay(bd: BanDo, id: string, doi: number, nay: number, hat: number): May {
  const p = choTrai(bd, doi, hat, nay)
  return { id, doi, x: p.x, y: p.y, mau: MAU_DAY, cap: 1, t: '', chetDen: 0, batTuDen: nay + BAT_TU_MS, lucTrung: 0, chayDen: 0, chayAi: '', ungVien: '', nhipThay: 0, duong: [], dich: null, lucDuong: 0, lucDich: 0 }
}
/** Chọn chỉ số tên cho máy mới: không trùng tên máy khác đang trên sân, không trùng tên gọi (hai chữ cuối) của em nào trong `tranh`. Hết tên sạch ⇒ chỉ
 *  tránh tên máy khác; vẫn hết (không xảy ra: kho > 16 máy) ⇒ chỉ số bất kỳ (mã vẫn duy nhất nhờ số thứ tự). */
function chonTen(dangDung: ReadonlySet<number>, tranh: ReadonlySet<string>, rnd: () => number): number {
  const sach: number[] = [], conLai: number[] = [], goi = khoTenGoi()
  for (let i = 0; i < KHO_TEN.length; i++) if (!dangDung.has(i)) (tranh.has(goi[i]) ? conLai : sach).push(i)
  const ds = sach.length ? sach : conLai
  return ds.length ? ds[Math.floor(rnd() * ds.length) % ds.length] : Math.floor(rnd() * KHO_TEN.length) % KHO_TEN.length
}
/** Cho khớp số máy với số em thật: thừa ⇒ máy ÍT MÁU nhất của đội rời sân; thiếu ⇒ thêm máy ở trại, mang tên mới (xem `chonTen`). Trả danh sách mới.
 *  `tenTranh` = tên em thật cần tránh (phòng live: cả danh sách lớp; phòng ca: em trong phòng) — chỉ gọi khi thật sự phải thêm máy. */
export function khopMay(bd: BanDo, may: readonly May[], soEm: readonly number[], nay: number, rnd: () => number, tenTranh?: () => Iterable<string>): May[] {
  const can = soMayCan(soEm), kq: May[] = []
  let dungTen: Set<number> | null = null, dungSo: Set<number> | null = null, tranh: Set<string> | null = null
  for (let d = 0; d < 4; d++) {
    const cua = may.filter((m) => m.doi === d).sort((a, b) => b.mau - a.mau).slice(0, can[d])
    for (let i = cua.length; i < can[d]; i++) {
      if (!dungTen || !dungSo || !tranh) {
        // Máy cũ (cả máy sắp rời — tránh tái dùng tên ngay trong một nhịp) giữ tên + số thứ tự của nó.
        dungTen = new Set(may.map((m) => chiSoTen(m.id))); dungSo = new Set(may.map((m) => soThuTuMay(m.id)))
        tranh = new Set()
        if (tenTranh) for (const t of tenTranh()) if (typeof t === 'string' && t.trim()) tranh.add(tenGoi(t))
      }
      let so = 0
      while (dungSo.has(so)) so++
      const ten = chonTen(dungTen, tranh, rnd)
      dungTen.add(ten); dungSo.add(so)
      cua.push(taoMay(bd, maMay(ten, so), d, nay, (cua.length * 0.25 + rnd() * 0.12) % 1))
    }
    kq.push(...cua)
  }
  return kq
}
export const mayThanh = (m: May): NhanVat => ({ id: m.id, x: m.x, y: m.y, mau: m.mau, doi: m.doi, cap: m.cap, t: m.t })
/** Tâm các bụi của từng bản đồ (nướng một lần — sân 4 × 4 có ~250 bụi). */
const NHO_TAM_BUI = new WeakMap<BanDo, Diem[]>()
const tamBui = (bd: BanDo): Diem[] => {
  let kq = NHO_TAM_BUI.get(bd)
  if (!kq) NHO_TAM_BUI.set(bd, (kq = bd.bui.map((b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 }))))
  return kq
}

/** Một nhịp của MỘT máy (đổi tại chỗ). `ds` = mọi nhân vật KHÁC trên sân. Trả mã kẻ vừa hạ máy này ('' = còn sống). */
export function buocMay(bd: BanDo, m: May, ds: readonly NhanVat[], nay: number, dtMs: number, rnd: () => number): string {
  if (m.chetDen > nay) return ''
  if (m.chetDen) { const p = choTrai(bd, m.doi, rnd(), nay); Object.assign(m, { x: p.x, y: p.y, mau: MAU_DAY, cap: 1, t: '', chetDen: 0, batTuDen: nay + BAT_TU_MS, chayDen: 0, chayAi: '', duong: [], dich: null, ungVien: '', nhipThay: 0 }) }
  const dt = dtMs / 1000, v = vong(bd, nay), nghi = dangNghi(nay)
  // 1. Trúng đạn / cháy / hồi máu / ngoài vòng. Cháy: trừ phần còn nợ của khoảng vừa trôi TRƯỚC, rồi mới châm lại từ phát trúng của nhịp này (cùng thứ tự với máy em).
  if (!nghi && nay >= m.batTuDen) {
    const don = satThuong(m, ds, dt)
    const chay = matChay(m.chayDen, nay, dtMs)
    let mat = don.tong + chay
    if (don.chay) { m.chayDen = nay + CHAY_MS; m.chayAi = don.chay }
    if (ngoaiVong(v, m.x, m.y)) mat += 8 * dt
    if (mat > 0) {
      m.mau -= mat; m.lucTrung = nay
      if (m.mau <= 0) { const ai = don.ai || (chay > 0 ? m.chayAi : ''); m.mau = 0; m.t = ''; m.duong = []; m.dich = null; m.chayDen = 0; m.chetDen = nay + HOI_SINH_MS; return ai }
    }
  }
  if (m.mau < MAU_DAY && nay - m.lucTrung >= HOI_CHO_MS) m.mau = Math.min(MAU_DAY, m.mau + 15 * dt)
  // 2. Ngắm: phải thấy cùng một đối thủ 2 nhịp liền mới bắn (phản ứng chậm hơn người). Đang lui về nấp trong bụi thì ngừng bắn để ẩn.
  const luiVe = m.mau < 35
  const thay = nghi ? '' : chonMucTieu(bd, m, ds)
  if (thay && thay === m.ungVien) m.nhipThay++; else { m.ungVien = thay; m.nhipThay = thay ? 1 : 0 }
  m.t = thay && m.nhipThay >= 2 && !(luiVe && trongBui(bd, m.x, m.y)) ? thay : ''
  // 3. Chọn đích đến.
  const doiThu = thay ? ds.find((n) => n.id === thay) : undefined
  let dich: Diem | null = null
  if (ngoaiVong(v, m.x, m.y)) dich = { x: v.cx + (m.x - v.cx) * 0.5, y: v.cy + (m.y - v.cy) * 0.5 }
  else if (luiVe) {
    // Máu thấp: lui về bụi gần nhất cách xa đối thủ; không có thì về trại.
    let gan = Infinity
    for (const b of tamBui(bd)) {
      const d = Math.hypot(b.x - m.x, b.y - m.y)
      if (d < gan && !ngoaiVong(v, b.x, b.y) && (!doiThu || Math.hypot(b.x - doiThu.x, b.y - doiThu.y) > 150)) { gan = d; dich = b }
    }
    dich ??= bd.trai[m.doi]
  } else if (doiThu) {
    const d = Math.hypot(doiThu.x - m.x, doiThu.y - m.y)
    if (d > 200) dich = { x: doiThu.x, y: doiThu.y }
    else if (d < 120) dich = { x: m.x + (m.x - doiThu.x), y: m.y + (m.y - doiThu.y) }
  } else {
    // Không thấy ai: đi cùng em thật gần nhất của đội (mỗi máy đứng lệch một phía để không chồng lên nhau); không có em nào thì tuần quanh giữa sân.
    let gan = Infinity
    const lech = (m.id.charCodeAt(m.id.length - 1) % 8) * (Math.PI / 4)
    for (const n of ds) {
      if (n.doi !== m.doi || n.mau <= 0 || n.id.charCodeAt(0) === 126) continue
      const d = Math.hypot(n.x - m.x, n.y - m.y)
      if (d >= gan) continue
      gan = d
      const cho = { x: n.x + Math.cos(lech) * 80, y: n.y + Math.sin(lech) * 60 }
      dich = Math.hypot(cho.x - m.x, cho.y - m.y) > 45 ? cho : null
    }
    if (gan === Infinity) {
      if (!m.dich || nay - m.lucDich > 6000 || Math.hypot(m.dich.x - m.x, m.dich.y - m.y) < 50) {
        m.lucDich = nay
        m.dich = { x: v.cx + (rnd() - 0.5) * v.rx * 1.1, y: v.cy + (rnd() - 0.5) * v.ry * 1.1 }
        m.lucDuong = 0
      }
      dich = m.dich
    }
  }
  if (!dich) { m.duong = []; m.dich = null; return '' }
  // 4. Tìm đường mỗi giây (hoặc khi đích đổi xa), rồi đi một nhịp.
  if (!m.dich || nay - m.lucDuong >= 1000 || Math.hypot(m.dich.x - dich.x, m.dich.y - dich.y) > 120) {
    m.dich = dich; m.lucDuong = nay
    m.duong = timDuong(bd, m.x, m.y, Math.min(bd.rong - BK_NV, Math.max(BK_NV, dich.x)), Math.min(bd.cao - BK_NV, Math.max(BK_NV, dich.y)))
  }
  let con = TOC_DO_MAY * dt
  while (con > 0 && m.duong.length) {
    const d = m.duong[0], kc = Math.hypot(d.x - m.x, d.y - m.y)
    if (kc <= con) { m.x = d.x; m.y = d.y; con -= kc; m.duong.shift(); continue }
    const p = diChuyen(bd, m.x, m.y, ((d.x - m.x) / kc) * con, ((d.y - m.y) / kc) * con)
    if (p.x === m.x && p.y === m.y) m.duong = []
    m.x = p.x; m.y = p.y; con = 0
  }
  return ''
}
/** Máy vừa hạ được một đối thủ ⇒ súng lên một cấp (tối đa cấp 3 — Súng Bọt). */
export const mayLenCap = (m: May): void => { m.cap = Math.min(CAP_MAY_TOI_DA, m.cap + 1) }
