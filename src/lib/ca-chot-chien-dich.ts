// CA CHỐT CỦA CHIẾN DỊCH (Game Hóa 2.0) — cầu nối giữa nút "Mở ca chốt" ở Buổi chữa và màn Mở ca kiểm tra.
// Buổi chữa ghi vào bộ nhớ PHIÊN (sessionStorage) một gói nhỏ: chiến dịch nào, lớp nào, danh sách mã câu MÁY CHỦ
// (`<tờ gốc>-<phần>-<số>`). Màn Mở ca đọc gói MỘT LẦN khi mở, tích sẵn đúng các tờ (đã tách theo phần) có các câu ấy,
// đặt bộ rút = đúng các câu ấy, rồi xoá gói — mở lại màn Mở ca lần sau là như thường.
// KHÔNG rút câu tự luận (luật 21/09): câu tự luận trong danh sách bị bỏ và được đếm để báo thầy.
// Tệp này nhẹ (không kéo component chiến dịch nào) để màn Mở ca import mà không phình mảnh.
import type { TeacherExamSource } from '../data/examContent'
import { laCauRutDuoc } from './cau-tu-luan'
import { qidMayChuCuaIdCau } from './lich-su-cau-len-bang'
import type { SoCauPhan } from './rut-de'

/** Khoá phiên (sessionStorage) màn Mở ca kiểm tra đọc để chọn sẵn câu của ca chốt. */
export const KHOA_CA_CHOT = 'ddh.caChotChienDich'

export interface GoiCaChot {
  chienDichId: string
  ten: string
  lop: string | null
  /** Mã câu máy chủ, đúng thứ tự Buổi chữa xếp. */
  qids: string[]
  /** OMNI 3 (05/10): câu lấy từ `/gv/omni ca-chot` (ca chốt 50/50: nửa câu của bài, nửa câu chưa gặp cùng ô từ TU LUYỆN) ⇒ màn Mở ca mở xong
   *  gọi thêm `gan-ca-chot` để máy chủ chấm điều kiện T của chứng chỉ. Vắng ⇒ gói cũ, màn Mở ca như trước. */
  omni?: boolean
}

/** Đọc gói ca chốt (không xoá). Sai dạng / không có / máy chặn bộ nhớ ⇒ null. */
export function docGoiCaChot(kho: Pick<Storage, 'getItem'> | undefined = globalThis.sessionStorage): GoiCaChot | null {
  try {
    const s = kho?.getItem(KHOA_CA_CHOT)
    if (!s) return null
    const j = JSON.parse(s) as Partial<GoiCaChot>
    const qids = Array.isArray(j.qids) ? j.qids.map(String).filter((q) => q.trim() !== '') : []
    if (qids.length === 0) return null
    return {
      chienDichId: String(j.chienDichId ?? ''),
      ten: String(j.ten ?? '').trim(),
      lop: typeof j.lop === 'string' && j.lop.trim() ? j.lop.trim() : null,
      qids,
      ...(j.omni === true ? { omni: true } : {}),
    }
  } catch {
    return null
  }
}

/** Xoá gói (gọi ngay sau khi màn Mở ca đã đọc). */
export function xoaGoiCaChot(kho: Pick<Storage, 'removeItem'> | undefined = globalThis.sessionStorage): void {
  try {
    kho?.removeItem(KHOA_CA_CHOT)
  } catch {
    /* máy chặn bộ nhớ: không có gì để xoá */
  }
}

export interface ChonSanCaChot {
  /** Mã tờ (đã tách theo phần) cần tích. */
  maDe: string[]
  /** Id câu (theo Ngân hàng đề trên máy) — bộ rút của ca. */
  ids: Set<string>
  soCau: SoCauPhan
  /** Số mã câu của gói tìm thấy trong Ngân hàng đề (không tính câu tự luận bị bỏ). */
  soKhop: number
  /** Số mã câu không tìm thấy trên máy này. */
  soThieu: number
  /** Số câu tự luận bị bỏ. */
  soTuLuan: number
}

/** Từ các tờ đã tách theo phần (`tachNhieuTheoPhan`) tìm đúng các câu của ca chốt. Mỗi mã câu lấy MỘT câu (tờ đầu tiên có). */
export function chonSanCaChot(dsDeTach: readonly TeacherExamSource[], qids: readonly string[]): ChonSanCaChot {
  const can = new Set(qids)
  const daGap = new Set<string>()
  const tuLuan = new Set<string>()
  const maDe: string[] = []
  const ids = new Set<string>()
  const soCau: SoCauPhan = { I: 0, II: 0, III: 0 }
  for (const s of dsDeTach) {
    let coCau = false
    const xet = (phan: 'I' | 'II' | 'III', ds: readonly { id: string }[] | undefined) => {
      for (const q of ds ?? []) {
        const k = qidMayChuCuaIdCau(q.id)
        if (!k || !can.has(k) || daGap.has(k)) continue
        daGap.add(k)
        if (!laCauRutDuoc(q, phan)) {
          tuLuan.add(k)
          continue
        }
        ids.add(q.id)
        soCau[phan] += 1
        coCau = true
      }
    }
    xet('I', s.phanI)
    xet('II', s.phanII)
    xet('III', s.phanIII)
    if (coCau && !maDe.includes(s.maDe)) maDe.push(s.maDe)
  }
  return { maDe, ids, soCau, soKhop: ids.size, soThieu: can.size - daGap.size, soTuLuan: tuLuan.size }
}

/** Dòng báo trên màn Mở ca. */
export function chuBaoCaChot(goi: GoiCaChot, kq: ChonSanCaChot | null): string {
  const dau = `Đang mở ca chốt cho chiến dịch ${goi.ten || 'không tên'}`
  if (!kq) return `${dau} · đang tìm ${goi.qids.length} câu trong Ngân hàng đề…`
  const phu: string[] = [`đã chọn sẵn ${kq.soKhop}/${goi.qids.length} câu`]
  if (kq.soThieu > 0) phu.push(`${kq.soThieu} câu không có trong Ngân hàng đề trên máy này`)
  if (kq.soTuLuan > 0) phu.push(`bỏ ${kq.soTuLuan} câu tự luận`)
  return `${dau} · ${phu.join(' · ')}`
}
