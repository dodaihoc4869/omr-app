// PHẦN TÍNH THUẦN của các màn chiến dịch (không IO, có test): màu ô bảng chiến dịch, mức đồng hồ sức chứa,
// xếp buổi chữa (≤ 90 phút, mỗi em có mặt ≥ 1 lượt), tờ đề của một ca, xếp tên em.
import { maDeGocMayChu } from '../../lib/btvn-nang-do-thay'
import { CAU_HINH_LEN_BANG_MAC_DINH } from '../../lib/len-bang-cau-hinh'
import type { CauBuoiChua, EmTen, MucSucChua } from './api'

// ---------------------------------------------------------------- màu
/** Ô màu theo % câu thành thạo của dạng: ≥ 70 xanh đậm · 40–69 xanh nhạt · 20–39 vàng · < 20 đỏ. */
export type MucO = 'xd' | 'xg' | 'xv' | 'xr' | 'trong'
export function mucO(tiLe: number | null | undefined): MucO {
  if (typeof tiLe !== 'number' || !Number.isFinite(tiLe)) return 'trong'
  const p = Math.round(tiLe * 100)
  return p >= 70 ? 'xd' : p >= 40 ? 'xg' : p >= 20 ? 'xv' : 'xr'
}
export const CHU_GIAI_O: { muc: Exclude<MucO, 'trong'>; chu: string }[] = [
  { muc: 'xd', chu: '≥ 70%' },
  { muc: 'xg', chu: '40–69%' },
  { muc: 'xv', chu: '20–39%' },
  { muc: 'xr', chu: 'dưới 20%' },
]

/** Mức đồng hồ sức chứa: xanh ≤ 70% · vàng 70–90% · đỏ > 90% (cùng luật `sucChua` của máy chủ). */
export function mucSucChua(tiLe: number): MucSucChua {
  return tiLe <= 0.7 ? 'xanh' : tiLe <= 0.9 ? 'vang' : 'do'
}
export const CHU_MUC: Record<MucSucChua, string> = { xanh: 'vừa sức', vang: 'sát', do: 'quá tải' }

// ---------------------------------------------------------------- tờ đề của ca
/** Mã tờ kho (máy chủ) của các câu trong bộ đề một ca: id câu `X-I-3` / `X-TN-I-3` ⇒ `X`. Giữ thứ tự gặp đầu. */
export function maDeTuBoCau(ids: readonly string[]): string[] {
  const ra: string[] = []
  for (const id of ids) {
    const m = /^(.*)-(?:III|II|I)-\d+$/.exec(String(id ?? '').trim())
    const goc = m ? maDeGocMayChu(m[1] ?? '') : ''
    if (goc && !ra.includes(goc)) ra.push(goc)
  }
  return ra
}

// ---------------------------------------------------------------- tên em
/** Tên gọi = từ cuối của họ tên ("Nguyễn Văn An" ⇒ "An"). */
export const tenGoi = (hoTen: string): string => hoTen.trim().split(/\s+/).pop() ?? hoTen
/** Xếp theo tên gọi rồi cả họ tên (thói quen sổ điểm), so chữ tiếng Việt. */
export function sapTheoTen<T extends { ten: string }>(ds: readonly T[]): T[] {
  return [...ds].sort((a, b) => tenGoi(a.ten).localeCompare(tenGoi(b.ten), 'vi') || a.ten.localeCompare(b.ten, 'vi'))
}

// ---------------------------------------------------------------- buổi chữa
export interface DongBuoiChua {
  cau: CauBuoiChua
  /** Em giải mẫu; `null` = chưa em nào thành thạo câu này ⇒ thầy giải mẫu. */
  giaiMau: EmTen | null
  sua: EmTen[]
  /** Giây ước lượng của dòng (giải mẫu + các em sửa). */
  giay: number
}
export interface KetQuaBuoiChua {
  dong: DongBuoiChua[]
  tongGiay: number
  nganSachGiay: number
  soEmCoMat: number
  soEmCoLuot: number
  /** Tổng vẫn vượt ngân sách dù chỉ còn một câu (lớp quá đông) — màn phải nói thật. */
  vuotNganSach: boolean
  /** Câu máy chủ đề xuất nhưng bỏ bớt cho vừa giờ. */
  boCau: CauBuoiChua[]
}
export interface TuyChonXep {
  nganSachGiay?: number
  /** Mỗi em lên sửa một chỗ sai trên bài giải mẫu. */
  giayMoiEmSua?: number
  /** Lượt đầu: tối đa bấy nhiêu em sửa mỗi câu; em còn thiếu lượt mới dồn thêm. */
  toiDaSuaDau?: number
}
export const GIAY_MOI_EM_SUA = 60

/** XẾP BUỔI CHỮA từ đề xuất của máy chủ (`buoi-chua`: mỗi dạng một câu, giảm dần theo điểm chữa).
 *  1. Mỗi câu: em giải mẫu (máy chủ chọn, nếu có mặt) + tối đa `toiDaSuaDau` em sửa: em cần dạy lại câu ấy trước, rồi em chưa có lượt.
 *  2. Em có mặt chưa có lượt nào ⇒ vào câu em ấy chưa thành thạo đang ít người nhất (không có thì câu ít người nhất).
 *  3. Tổng giờ > ngân sách (90 phút) ⇒ bỏ câu điểm chữa thấp nhất rồi xếp lại, còn ít nhất một câu.
 *  Thuần và tất định: cùng đầu vào ra cùng bảng. */
export function xepBuoiChua(cau: readonly CauBuoiChua[], coMat: readonly EmTen[], uocGiay: (c: CauBuoiChua) => number, tuy: TuyChonXep = {}): KetQuaBuoiChua {
  const nganSachGiay = tuy.nganSachGiay ?? CAU_HINH_LEN_BANG_MAC_DINH.NGAN_SACH_PHUT * 60
  const giaySua = tuy.giayMoiEmSua ?? GIAY_MOI_EM_SUA
  const tranDau = tuy.toiDaSuaDau ?? 3
  // Em có mặt: danh sách thầy chốt; rỗng ⇒ mọi em xuất hiện trong đề xuất.
  const dsCoMat: EmTen[] = coMat.length ? [...coMat] : []
  if (!dsCoMat.length) {
    const da = new Set<string>()
    for (const c of cau) for (const e of [...(c.giaiMau ? [c.giaiMau] : []), ...c.emSua]) if (!da.has(e.sbd)) { da.add(e.sbd); dsCoMat.push(e) }
  }
  const coMatSet = new Set(dsCoMat.map((e) => e.sbd))

  const xep = (dsCau: readonly CauBuoiChua[]): DongBuoiChua[] => {
    const dong = dsCau.map((c) => ({ cau: c, giaiMau: c.giaiMau && coMatSet.has(c.giaiMau.sbd) ? c.giaiMau : null, sua: [] as EmTen[], giay: 0 }))
    const coLuot = new Set(dong.flatMap((d) => (d.giaiMau ? [d.giaiMau.sbd] : [])))
    for (const d of dong) {
      // Máy chủ xếp em CẦN DẠY LẠI đứng đầu `emSua` (đúng `soCanDayLai` em): các em ấy luôn được sửa câu của mình (kể cả đã có lượt ở câu khác);
      // chỗ còn lại dành cho em chưa thành thạo CHƯA có lượt nào — để lượt lên bảng rải đều cả lớp.
      const dayLai = new Set(d.cau.emSua.slice(0, Math.max(0, d.cau.soCanDayLai)).map((e) => e.sbd))
      for (const e of d.cau.emSua) {
        if (d.sua.length >= tranDau) break
        if (!coMatSet.has(e.sbd) || e.sbd === d.giaiMau?.sbd || d.sua.some((x) => x.sbd === e.sbd)) continue
        if (!dayLai.has(e.sbd) && coLuot.has(e.sbd)) continue
        d.sua.push(e)
        coLuot.add(e.sbd)
      }
    }
    for (const e of dsCoMat) {
      if (coLuot.has(e.sbd) || !dong.length) continue
      const nguoi = (d: DongBuoiChua) => d.sua.length + (d.giaiMau ? 1 : 0)
      const ungVien = dong.filter((d) => d.cau.emSua.some((x) => x.sbd === e.sbd))
      const tap = ungVien.length ? ungVien : dong
      let chon = tap[0]!
      for (const d of tap) if (nguoi(d) < nguoi(chon)) chon = d
      chon.sua.push(e)
      coLuot.add(e.sbd)
    }
    for (const d of dong) d.giay = Math.max(0, Math.round(uocGiay(d.cau))) + giaySua * d.sua.length
    return dong
  }

  let dsCau = [...cau]
  let dong = xep(dsCau)
  const tong = (ds: DongBuoiChua[]) => ds.reduce((s, d) => s + d.giay, 0)
  while (tong(dong) > nganSachGiay && dsCau.length > 1) {
    dsCau = dsCau.slice(0, -1)
    dong = xep(dsCau)
  }
  const coLuot = new Set(dong.flatMap((d) => [...(d.giaiMau ? [d.giaiMau.sbd] : []), ...d.sua.map((e) => e.sbd)]))
  return {
    dong,
    tongGiay: tong(dong),
    nganSachGiay,
    soEmCoMat: dsCoMat.length,
    soEmCoLuot: dsCoMat.filter((e) => coLuot.has(e.sbd)).length,
    vuotNganSach: tong(dong) > nganSachGiay,
    boCau: cau.slice(dsCau.length),
  }
}

/** "Sửa: Lê Chi, Hoàng Giang, Ngô Nam" · quá 3 em ⇒ "Sửa: Vũ Hà, Lý Quân +2 em". */
export function chuNguoiSua(sua: readonly EmTen[]): string {
  if (!sua.length) return ''
  if (sua.length <= 3) return `Sửa: ${sua.map((e) => e.ten).join(', ')}`
  return `Sửa: ${sua.slice(0, 2).map((e) => e.ten).join(', ')} +${sua.length - 2} em`
}

/** Sao đáng chữa suy từ mức độ câu (nhãn kho: Nhận biết/Thông hiểu/Vận dụng, hoặc NB/TH/VD/VDC). */
export function saoTuMucDo(mucDo: string | null | undefined): 0 | 1 | 2 {
  const m = String(mucDo ?? '').trim().toLowerCase()
  if (!m) return 0
  if (m.startsWith('vd') || m.includes('vận dụng')) return 2
  if (m === 'th' || m.includes('thông hiểu')) return 1
  return 0
}

/** Câu cho ca chốt: câu của buổi chữa trước, rồi câu cần dạy lại; không trùng; tối đa `tran` câu. */
export function cauCaChot(buoiChua: readonly { qid: string }[], canDayLai: readonly { qid: string }[], tran = 25): string[] {
  const ra: string[] = []
  for (const c of [...buoiChua, ...canDayLai]) if (!ra.includes(c.qid) && ra.length < tran) ra.push(c.qid)
  return ra
}
