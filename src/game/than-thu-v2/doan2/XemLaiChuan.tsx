// ĐOÀN HỘ TỐNG · GAME HÓA 2.0 — XEM LẠI CÂU SAU KHI CHỐT bằng KHỐI CHUẨN của app (thầy yêu cầu lời giải ở mọi chỗ đúng chuẩn):
// thẻ `TheCau` chế độ `xem_lai` (✓ đáp án đúng · ✗ em chọn sai · LỜI GIẢI → Kiến thức cốt lõi → từng phương án/ý, Phần III từng bước + kết quả),
// lời giải đọc qua `chuanHoaLoiGiaiCau` (một bộ đọc cho mọi app). Chỉ dựng SAU khi máy chủ trả đáp án (em đã chốt) — không bao giờ trước.
import TheCau from '../../../components/TheCau'
import { HinhTaiViTri } from '../../../components/QuestionMedia'
import { chuanHoaLoiGiaiCau, CHUA_CO_LOI_GIAI } from '../../../lib/chuan-hoa-loi-giai'
import type { HinhAnh, LoiGiaiCauTruc, LyDoY } from '../../../data/examContent'
import type { Question } from '../core'

type Chu = 'A' | 'B' | 'C' | 'D'
type DS = 'D' | 'S'
const bon = (a: readonly string[] | undefined): [string, string, string, string] => [a?.[0] ?? '', a?.[1] ?? '', a?.[2] ?? '', a?.[3] ?? '']
const bonTuyChon = (a: readonly (string | undefined)[] | undefined): [string?, string?, string?, string?] | undefined => (a && a.some(Boolean) ? [a[0] || undefined, a[1] || undefined, a[2] || undefined, a[3] || undefined] : undefined)

/** Lời giải thô của kho → đúng khuôn `LoiGiaiCauTruc` mà `TheCau` vẽ. Kho thiếu lời giải ⇒ câu chung `CHUA_CO_LOI_GIAI`, không dựng chữ thay. */
export function loiGiaiChoTheCau(solution: unknown, phan: Question['phan'], dapAn: string): { loiGiai?: LoiGiaiCauTruc; explanation?: string } {
  const lg = chuanHoaLoiGiaiCau(solution, phan, dapAn)
  if (lg.thieu) return { explanation: CHUA_CO_LOI_GIAI }
  const ra: LoiGiaiCauTruc = { chot: lg.chot }
  if (lg.lyDo) {
    const tung = (mau: RegExp) => Object.fromEntries(lg.lyDo!.filter(x => mau.test(x.khoa)).map(x => [x.khoa, { dung: x.dung, viSao: x.ly } satisfies LyDoY]))
    if (phan === 'I') ra.tungPa = tung(/^[ABCD]$/)
    else if (phan === 'II') ra.tungY = tung(/^[abcd]$/)
  }
  if (lg.buoc) ra.buoc = lg.buoc
  if (lg.ketQua) ra.ketQua = lg.ketQua
  return { loiGiai: ra }
}

export interface XemLaiChuanProps {
  q: Question; /** Đáp án em đã gửi ('' = bỏ trống). */ chon: string; /** Đáp án đúng — CHỈ có sau khi em chốt. */ dapAn: string
  solution: unknown; solutionImages?: HinhAnh[]; /** Số trên đầu thẻ: hiệp của câu. */ stt: number; onZoom: (src: string) => void
}

export default function XemLaiChuan({ q, chon, dapAn, solution, solutionImages, stt, onZoom }: XemLaiChuanProps) {
  const { loiGiai, explanation } = loiGiaiChoTheCau(solution, q.phan, dapAn)
  const chung = { cheDo: 'xem_lai' as const, stt, tieuDe: q.tenDang || 'Hoá học', text: q.text, thanCauImg: q.thanCauImg, table: q.table, imageDataUrl: q.imageDataUrl, hinhAnh: q.hinhAnh as HinhAnh[], loiGiai, explanation, onZoom }
  const the = q.phan === 'I' ? (
    <TheCau {...chung} phan="I" choices={bon(q.choices)} choiceImgs={bonTuyChon(q.choiceImgs)} choicePerm={[0, 1, 2, 3]}
      selected={/^[ABCD]$/.test(chon) ? chon as Chu : null} correct={/^[ABCD]$/.test(dapAn) ? dapAn as Chu : undefined} />
  ) : q.phan === 'II' ? (
    <TheCau {...chung} phan="II" ideas={bon(q.ideas)} ideaImgs={bonTuyChon(q.ideaImgs)}
      selected={[0, 1, 2, 3].map(i => (chon[i] === 'D' || chon[i] === 'S' ? chon[i] as DS : null))}
      correct={/^[DS]{4}$/.test(dapAn) ? dapAn.split('') as [DS, DS, DS, DS] : undefined} />
  ) : (
    <TheCau {...chung} phan="III" selected={chon.trim() || null} correct={dapAn} />
  )
  return (
    <div className="dh2-xem-lai" data-vung="loi-giai-chuan">
      {the}
      <HinhTaiViTri hinhAnh={solutionImages ?? []} viTri="sau_loi_giai" nhan="lời giải" onZoom={onZoom} />
    </div>
  )
}
