// GOM LINK PHIẾU CỦA CẢ MỘT CA để dán một lượt vào Zalo.
//
// Trước đây gửi phiếu cho 27 phụ huynh là mở phiếu từng em, bấm Copy, dán, quay
// lại, mở em kế tiếp — hai mươi bảy lần. Máy chủ đã có sẵn mã phiếu theo mã ca
// (`phieuTheoCa`), nên chỗ này chỉ còn ba việc thuần logic, tách riêng để kiểm
// được bằng số:
//
//   1. MỘT EM MỘT PHIẾU. Thầy tạo lại phiếu cho một em là có hai dòng cùng SBD;
//      chỉ dòng MỚI NHẤT còn đúng. Dòng cũ vẫn mở được nhưng nội dung cũ.
//   2. TÁCH LOẠI. Phiếu kết quả và phiếu bài tập cùng một ca, cùng một em —
//      gửi nhầm loại là phụ huynh mở ra không thấy điểm đâu.
//   3. NÊU RÕ EM CHƯA CÓ PHIẾU. Im lặng bỏ qua là thầy gửi thiếu mà không biết.
import { taoLinkPhieu, type CheDoPhieu } from './phieu-link'
import type { LoaiPhieu, PhieuCuaCa } from './exam-api'

export interface EmCanPhieu {
  sbd: string
  hoTen: string
}

export interface DongLinkPhieu {
  sbd: string
  hoTen: string
  ma: string
  link: string
  /** Số lần phụ huynh đã mở link — 0 nghĩa là chưa ai xem. */
  soLanXem: number
  taoLuc: string
}

export interface GomLinkPhieu {
  dong: DongLinkPhieu[]
  /** Em có trong ca nhưng chưa tạo phiếu — thầy phải biết để không gửi thiếu. */
  chuaCoPhieu: EmCanPhieu[]
}

/** Mốc thời gian của một phiếu, dùng để so mới/cũ. Thiếu hoặc hỏng → 0 (cũ nhất). */
function moc(taoLuc: string): number {
  const t = new Date(taoLuc || '').getTime()
  return Number.isFinite(t) ? t : 0
}

/** MỖI SBD MỘT PHIẾU — bản mới nhất của đúng loại đang cần. */
export function phieuMoiNhatTheoEm(ds: PhieuCuaCa[], loai: LoaiPhieu = 'ketqua'): Map<string, PhieuCuaCa> {
  const ra = new Map<string, PhieuCuaCa>()
  for (const p of ds) {
    if (p.loai !== loai) continue
    const cu = ra.get(p.sbd)
    if (!cu || moc(p.taoLuc) >= moc(cu.taoLuc)) ra.set(p.sbd, p)
  }
  return ra
}

/** Dựng danh sách link theo ĐÚNG thứ tự em trong ca, kèm danh sách em còn thiếu.
 *
 * `dsEm` là em thầy định gửi (thường là em đã chấm). Em không có trong `dsEm`
 * nhưng có phiếu thì bỏ qua — thầy đã chủ động lọc rồi. */
export function gomLinkPhieu(
  dsEm: EmCanPhieu[],
  phieu: PhieuCuaCa[],
  goc: string,
  loai: LoaiPhieu = 'ketqua',
  soCau?: number | null,
  cheDo?: CheDoPhieu,
): GomLinkPhieu {
  const theoEm = phieuMoiNhatTheoEm(phieu, loai)
  const dong: DongLinkPhieu[] = []
  const chuaCoPhieu: EmCanPhieu[] = []
  for (const em of dsEm) {
    const p = theoEm.get(em.sbd)
    if (!p) {
      chuaCoPhieu.push(em)
      continue
    }
    dong.push({
      sbd: em.sbd,
      hoTen: em.hoTen || p.hoTen,
      ma: p.ma,
      link: taoLinkPhieu(goc, p.ma, soCau, cheDo),
      soLanXem: p.soLanXem,
      taoLuc: p.taoLuc,
    })
  }
  return { dong, chuaCoPhieu }
}

/** Văn bản dán thẳng vào Zalo: MỖI EM MỘT DÒNG, tên rồi link.
 *
 * Không thêm lời chào, không thêm câu dẫn: thầy dán vào rồi tự cắt từng dòng
 * gửi từng phụ huynh, thêm chữ vào chỉ tổ phải xoá. */
export function vanBanLinkPhieu(g: GomLinkPhieu): string {
  const d = g.dong.map((x) => `${x.hoTen || `SBD ${x.sbd}`}: ${x.link}`)
  if (g.chuaCoPhieu.length) {
    d.push('', `Chưa có phiếu (${g.chuaCoPhieu.length} em): ${g.chuaCoPhieu.map((e) => e.hoTen || e.sbd).join(', ')}`)
  }
  return d.join('\n')
}

/** Câu tóm tắt hiện dưới nút — thầy đọc là biết bấm ra được gì. */
export function tomTatLinkPhieu(g: GomLinkPhieu): string {
  const chuaXem = g.dong.filter((d) => d.soLanXem === 0).length
  const phan = [`${g.dong.length} link`]
  if (chuaXem > 0) phan.push(`${chuaXem} chưa ai mở`)
  if (g.chuaCoPhieu.length > 0) phan.push(`${g.chuaCoPhieu.length} em chưa có phiếu`)
  return phan.join(' · ')
}
