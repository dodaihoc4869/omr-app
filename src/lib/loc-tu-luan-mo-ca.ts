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
