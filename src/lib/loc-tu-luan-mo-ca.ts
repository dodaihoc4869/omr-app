// CẤM RÚT CÂU TỰ LUẬN — BỘ LỌC Ở MÀN MỞ CA (máy thầy; Code 1, 21/09/2026). Đề bài `prompt-cam-rut-tu-luan.md`.
//
// Chỉ đụng bước RÚT TỰ ĐỘNG. Ở màn Mở ca có hai chỗ app tự chọn câu thay thầy:
//   • `luon`     — kho rộng để app rút bộ câu cho TỪNG EM (đề riêng, ca có phòng chờ, mã trận 2026…): câu tự luận KHÔNG BAO GIỜ vào kho ấy.
//   • `khi_co_cat` — thầy chọn nguyên tờ (không bấm Rút đề): nếu số câu của một phần LỚN HƠN số câu mỗi em phải làm thì mỗi em bị cắt ngẫu nhiên (seed `maCa:sbd`) — tức app rút thay thầy,
//                  nên câu tự luận bị bỏ khỏi phần ấy; phần vừa đủ (không cắt) thì GIỮ NGUYÊN — đó là bộ thầy tự chọn, hiện đúng như thầy chọn.
// THUẦN: nhận các nguồn đề, trả nguồn mới (cùng tham chiếu nếu không bỏ câu nào). Không đụng Gọi lên bảng / tờ chiếu (chúng không đi qua đây).
import type { SoCauMoiPhan, TeacherExamSource } from '../data/examContent'
import { laCauRutDuoc, type PhanCau } from './cau-tu-luan'

/** Số câu mỗi em phải làm khi ca chưa ghi `soCau` (luật 18/4/6 cũ của `exam-assign.ts`). */
export const SO_CAU_MAC_DINH_MOI_EM: SoCauMoiPhan = { I: 18, II: 4, III: 6 }

export type CheDoLocMoCa = 'luon' | 'khi_co_cat'

export interface KetQuaLocMoCa {
  nguon: TeacherExamSource[]
  /** Số câu tự luận đã bỏ, tổng và theo phần. */
  soBo: number
  soBoTheoPhan: SoCauMoiPhan
}

type CauMo = { id?: string } & Record<string, unknown>

const KHOA_PHAN: Record<PhanCau, 'phanI' | 'phanII' | 'phanIII'> = { I: 'phanI', II: 'phanII', III: 'phanIII' }

/** Bỏ câu tự luận khỏi các nguồn theo chế độ. Không bỏ gì ⇒ trả CHÍNH mảng vào (`nguon === vao`). */
export function locTuLuanKhiMoCa(nguon: TeacherExamSource[], can: SoCauMoiPhan | undefined, cheDo: CheDoLocMoCa): KetQuaLocMoCa {
  const soBoTheoPhan: SoCauMoiPhan = { I: 0, II: 0, III: 0 }
  const phanCanLoc = new Set<PhanCau>()
  for (const p of ['I', 'II', 'III'] as PhanCau[]) {
    if (cheDo === 'luon') {
      phanCanLoc.add(p)
      continue
    }
    const tong = nguon.reduce((s, x) => s + ((x[KHOA_PHAN[p]] as unknown[] | undefined)?.length ?? 0), 0)
    const can1 = Math.max(0, Math.floor(can?.[p] ?? SO_CAU_MAC_DINH_MOI_EM[p]))
    if (tong > can1) phanCanLoc.add(p) // có cắt ngẫu nhiên ⇒ app tự rút ⇒ lọc
  }
  if (phanCanLoc.size === 0) return { nguon, soBo: 0, soBoTheoPhan }
  let coDoi = false
  const moi = nguon.map((x) => {
    const ra = { ...x } as TeacherExamSource
    for (const p of phanCanLoc) {
      const goc = (x[KHOA_PHAN[p]] as unknown as CauMo[] | undefined) ?? []
      const giu = goc.filter((q) => laCauRutDuoc(q, p))
      if (giu.length !== goc.length) {
        soBoTheoPhan[p] += goc.length - giu.length
        coDoi = true
        ;(ra as unknown as Record<string, unknown>)[KHOA_PHAN[p]] = giu
      }
    }
    return ra
  })
  if (!coDoi) return { nguon, soBo: 0, soBoTheoPhan }
  return { nguon: moi, soBo: soBoTheoPhan.I + soBoTheoPhan.II + soBoTheoPhan.III, soBoTheoPhan }
}

/** Số câu từng phần trong các nguồn (đã khử trùng bên ngoài). */
export function demCauTheoPhan(nguon: TeacherExamSource[]): SoCauMoiPhan {
  const d: SoCauMoiPhan = { I: 0, II: 0, III: 0 }
  for (const x of nguon) for (const p of ['I', 'II', 'III'] as PhanCau[]) d[p] += (x[KHOA_PHAN[p]] as unknown[] | undefined)?.length ?? 0
  return d
}

/** Câu chữ RÕ cho màn Mở ca khi bộ lọc bỏ câu: "Đã bỏ 4 câu tự luận (phần I: 1 · phần III: 3)". Không bỏ câu nào ⇒ chuỗi rỗng. */
export function chuBoTuLuanChiTiet(kq: Pick<KetQuaLocMoCa, 'soBo' | 'soBoTheoPhan'>): string {
  if (kq.soBo <= 0) return ''
  const chiTiet = (['I', 'II', 'III'] as PhanCau[]).filter((p) => kq.soBoTheoPhan[p] > 0).map((p) => `phần ${p}: ${kq.soBoTheoPhan[p]}`)
  return `Đã bỏ ${kq.soBo} câu tự luận (${chiTiet.join(' · ')}) — chỉ rút câu trắc nghiệm, đúng sai, trả lời ngắn`
}

/**
 * CẢNH BÁO THIẾU SAU LỌC (bằng lời, cho thầy thấy ngay ở bước chọn đề — không âm thầm thiếu câu): phần nào BỊ BỎ câu tự luận mà số câu còn lại ít hơn số câu mỗi em phải làm.
 * `can` = số câu mỗi em làm (ca đã rút/mã trận 2026), không ghi ⇒ luật 18/4/6. Phần không bị bỏ câu nào thì không cảnh báo (thiếu sẵn từ đề, không do bộ lọc).
 */
export function canhBaoThieuSauLoc(kq: KetQuaLocMoCa, can: SoCauMoiPhan | undefined): string[] {
  const con = demCauTheoPhan(kq.nguon)
  const ra: string[] = []
  for (const p of ['I', 'II', 'III'] as PhanCau[]) {
    const canP = Math.max(0, Math.floor(can?.[p] ?? SO_CAU_MAC_DINH_MOI_EM[p]))
    if (kq.soBoTheoPhan[p] > 0 && con[p] < canP) ra.push(`Phần ${p} chỉ còn ${con[p]} câu sau khi bỏ câu tự luận, ít hơn ${canP} câu mỗi em phải làm — chọn thêm đề hoặc giảm số câu ở bước Rút câu.`)
  }
  return ra
}
