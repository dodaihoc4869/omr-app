// Phần THUẦN (không React) của "Dòng thời gian" + "Từng câu con đã làm" kiểu Apple: gom câu vào từng LẦN NGỒI HỌC, cờ đúng/sai/làm lâu/che, phân bổ phút theo giờ, chữ của phiên bị che.
// Nguồn logic: BangMoiThu.tsx (gomNhomCau, NhomCau, ngưỡng) — chữ ký/hành vi giữ nguyên; MỞ RỘNG: nhóm theo `lan` máy chủ trả, cờ `lamLau` máy chủ, nhóm bị che. Mẫu: docs/ban-ve-ph-apple-2109/ph-d-bang-day-du.html.
import { gioVn, tachVn } from '../../../lib/ph-moi/dinh-dang'
import type { CauChe, CauHomNay, LyDoChe, MocThoiGian, NguonHien, PhMoi } from '../../../lib/ph-moi/du-lieu'
import { NHAN_NGUON, tenMoc } from '../nhan'

/** Ngưỡng DỰ PHÒNG khi máy chủ chưa trả cờ `lamLau` cho câu: từ chừng này giây trở lên là "làm lâu" (máy chủ tính cùng ngưỡng: NGUONG_LAM_LAU_GIAY = 120). */
export const NGUONG_LAM_LAU_GIAY = 120
/** Ít hơn hoặc bằng chừng này câu ⇒ mở sẵn nhóm mới nhất; nhiều hơn ⇒ đóng hết, mở dần theo nhóm (danh sách dài vẫn nhẹ). */
export const NGUONG_NHOM_LAZY = 40
/** Nhóm mở có hơn (XEM_TRUOC + 2) câu ⇒ chỉ hiện XEM_TRUOC câu đầu, phần còn lại sau nút "Hiện đủ N câu". */
export const SO_CAU_XEM_TRUOC = 4
/** Trần số ô che vẽ ra khi chỉ có con số của máy chủ (không có dòng câu). */
const TRAN_O_CHE = 120

export interface NhomCau {
  id: string
  gio: string
  ten: string
  cau: CauHomNay[]
  soCau: number | null
  soDung: number | null
  phut: number | null
  /** Nguồn của mốc (nhóm riêng theo nguồn: nguồn của các câu). */
  nguon: NguonHien | null
  /** Lý do che của MỐC (null: mốc không bị che hoặc nhóm không có mốc). */
  che: LyDoChe | null
  /** Số câu con đã làm ở mốc BỊ CHE (máy chủ trả; không có ⇒ null, màn bỏ số). */
  soCauDaLam: number | null
  /** Giờ bắt đầu (ISO) của mốc; nhóm riêng: giờ câu đầu. */
  batDau: string
}

export const laLamLau = (c: CauHomNay): boolean => (typeof c.lamLau === 'boolean' ? c.lamLau : c.giay !== null && c.giay >= NGUONG_LAM_LAU_GIAY)
export const laSai = (c: CauHomNay): boolean => c.kieu === 'thuong' && c.dung === false
export const laChe = (c: CauHomNay): c is CauChe => c.kieu === 'che'
/** Câu làm lâu ĐỂ LỌC/ĐẾM: câu bị che không có dòng hiện ra nên không tính. */
export const laLamLauThuong = (c: CauHomNay): boolean => c.kieu === 'thuong' && laLamLau(c)

/** Chú thích ô "Làm lâu" — số lấy từ chính hằng ngưỡng (không gõ tay): "Làm lâu: từ 2 phút trở lên một câu". */
export const chuNguongLamLau = (): string => `Làm lâu: từ ${NGUONG_LAM_LAU_GIAY / 60} phút trở lên một câu`

/** Gom câu vào NHÓM MỐC. Câu có `lan` hợp lệ (số nguyên trong dòng thời gian) ⇒ vào đúng mốc thứ `lan`. Thiếu `lan` ⇒ thuật toán cũ: mốc cùng nguồn có giờ bắt đầu gần nhất trước nó (không có ⇒ mốc bất kỳ gần nhất trước nó; không có nữa ⇒ nhóm riêng theo nguồn). Mốc không có câu nào vẫn giữ. */
export function gomNhomCau(pm: Pick<PhMoi, 'dongThoiGian' | 'cau'>): NhomCau[] {
  const moc: MocThoiGian[] = pm.dongThoiGian ?? []
  const nhom: NhomCau[] = moc.map((m, i) => ({
    id: `moc-${i + 1}`,
    gio: gioVn(m.batDau),
    ten: tenMoc(m),
    cau: [],
    soCau: m.soCau,
    soDung: m.soDung,
    phut: m.phut,
    nguon: m.nguon,
    che: m.che ?? null,
    soCauDaLam: m.soCauDaLam ?? null,
    batDau: m.batDau,
  }))
  const rieng = new Map<string, NhomCau>()
  for (const c of [...(pm.cau ?? [])].sort((a, b) => Date.parse(a.luc) - Date.parse(b.luc))) {
    const t = Date.parse(c.luc)
    let chon = -1
    if (typeof c.lan === 'number' && Number.isInteger(c.lan) && c.lan >= 0 && c.lan < moc.length) chon = c.lan
    else {
      for (let i = 0; i < moc.length; i++) if (Date.parse(moc[i]!.batDau) <= t + 60_000 && moc[i]!.nguon === c.nguon) chon = i
      if (chon < 0) for (let i = 0; i < moc.length; i++) if (Date.parse(moc[i]!.batDau) <= t + 60_000) chon = i
    }
    if (chon >= 0) nhom[chon]!.cau.push(c)
    else {
      let n = rieng.get(c.nguon)
      if (!n) {
        n = { id: `moc-r-${c.nguon}`, gio: gioVn(c.luc), ten: NHAN_NGUON[c.nguon], cau: [], soCau: null, soDung: null, phut: null, nguon: c.nguon, che: null, soCauDaLam: null, batDau: c.luc }
        rieng.set(c.nguon, n)
      }
      n.cau.push(c)
    }
  }
  return [...nhom, ...rieng.values()]
}

/** Nhóm CHỈ gồm câu bị che (hoặc mốc bị che chưa có dòng câu nào): màn KHÔNG dựng dòng câu, chỉ một dòng khoá + dải ô che. */
export const laNhomChe = (n: NhomCau): boolean => (n.cau.length > 0 ? n.cau.every(laChe) : n.che !== null)

/** Lý do che của nhóm: ưu tiên mốc; không có thì lý do của câu che đầu tiên. */
export function lyDoCheNhom(n: NhomCau): LyDoChe | null {
  if (n.che) return n.che
  const c = n.cau.find(laChe)
  return c && c.kieu === 'che' ? c.che : null
}

/** "Con đã làm 6 câu · kết quả hiện sau khi con nộp bài" / "… khi Thầy công bố điểm". Không có số câu (hoặc 0) ⇒ bỏ số. KHÔNG đúng/sai, không đề. */
export function chuKetQuaChe(che: LyDoChe, soCauDaLam: number | null): string {
  const khi = che === 'chua_nop' ? 'sau khi con nộp bài' : 'khi Thầy công bố điểm'
  return `Con đã làm${soCauDaLam !== null && soCauDaLam > 0 ? ` ${soCauDaLam} câu` : ''} · kết quả hiện ${khi}`
}

/** Số ô che vẽ cho nhóm bị che: số của máy chủ nếu có, không thì số dòng câu che đã có. */
export function soOChe(n: NhomCau): number {
  const so = n.soCauDaLam !== null && n.soCauDaLam > 0 ? n.soCauDaLam : n.cau.length
  return Math.min(TRAN_O_CHE, so)
}

/** Nhóm mở sẵn lúc vào bảng: ít câu (≤ NGUONG_NHOM_LAZY) ⇒ nhóm mới nhất có câu; nhiều câu ⇒ không nhóm nào. */
export function nhomMoSan(nhom: readonly NhomCau[]): string[] {
  const co = nhom.filter((n) => n.cau.length > 0)
  const tong = co.reduce((s, n) => s + n.cau.length, 0)
  return tong > 0 && tong <= NGUONG_NHOM_LAZY && co.length > 0 ? [co[co.length - 1]!.id] : []
}

/** Phút học của từng giờ trong ngày (24 ô, giờ VN): phút của mỗi mốc chia theo phần thật rơi vào từng giờ (mốc vắt qua giờ thì chia đôi); phần sau nửa đêm bỏ. */
export function phutTheoGio(moc: readonly Pick<MocThoiGian, 'batDau' | 'phut'>[]): number[] {
  const ra: number[] = Array.from({ length: 24 }, () => 0)
  for (const m of moc) {
    const t = tachVn(m.batDau)
    if (!t || !(m.phut > 0)) continue
    const dau = t.h * 60 + t.p
    const cuoi = dau + m.phut // vòng lặp dừng ở giờ 23 ⇒ phần sau nửa đêm tự bị bỏ
    for (let k = Math.floor(dau / 60); k < 24 && k * 60 < cuoi; k++) ra[k]! += Math.min(cuoi, (k + 1) * 60) - Math.max(dau, k * 60)
  }
  return ra
}

/** "B" · "A, C" · "AC" ⇒ ["B"] · ["A","C"] · ["A","C"]; chuỗi không chỉ gồm chữ phương án A–D (số, "Đúng", "ĐSĐS"…) ⇒ []. */
export function tachChuCai(s: string): string[] {
  const t = s.trim()
  return /^[A-Da-d]([\s,;·+&/-]*[A-Da-d])*$/.test(t) ? [...t.toUpperCase().replace(/[^A-D]/g, '')] : []
}
