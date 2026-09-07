// CHẤM LẠI MỘT CA RỒI GHI ĐIỂM MỚI LÊN SHEET.
//
// VÌ SAO CẦN.
//
// Điểm nằm trên Sheet là điểm MÁY EM tính lúc nộp bài. Sửa luật chấm ở app thì
// phiếu dựng lại đúng ngay (phiếu chấm lại từ đáp án thô trên máy thầy), nhưng
// bảng điểm, thứ hạng và bản xuất Excel vẫn giữ con số cũ — hai chỗ nói hai
// điểm khác nhau cho cùng một bài.
//
// Màn Theo dõi vẫn tự ghi lại điểm khi thầy mở nó ra, nhưng đó là việc phải
// nhớ làm. Lệnh này làm thẳng và BÁO RA từng em đổi từ bao nhiêu sang bao
// nhiêu, để thầy đối chiếu chứ không phải tin lời "đã đồng bộ".
//
// Không tự nghĩ điểm: chấm lại bằng đúng `gomCa` mà phiếu đang dùng, nên điểm
// ghi lên Sheet và điểm in trong phiếu chắc chắn là một.
import { ghiDiem } from './exam-api'
import { taoBaiGhiDiem } from './chi-tiet-cau'
import { gomCa } from './phieu-ca-ca'
import type { QuotaPhan, SoCauBaPhan } from '../engine/score'

export interface DiemBaPhan {
  I: number | null
  II: number | null
  III: number | null
  tong: number | null
}

export interface DoiDiemMotEm {
  sbd: string
  hoTen: string
  cu: DiemBaPhan
  moi: DiemBaPhan
  /** Điểm tổng có đổi không — thầy chỉ cần soi những em này. */
  doi: boolean
}

export interface KetQuaChamLaiCa {
  maCa: string
  tenCa: string
  soCau: SoCauBaPhan
  /** Trần điểm từng phần của ca này, tính bằng cents (1/100 điểm). */
  quota: QuotaPhan
  em: DoiDiemMotEm[]
  soDoi: number
  daGhi: string[]
  tuChoi: string[]
}

/** Chấm lại MỌI em đã nộp của một ca bằng luật chấm hiện tại, rồi ghi điểm mới
 * lên Sheet. Trả bảng đối chiếu cũ → mới. */
export async function chamLaiCa(url: string, mat: string, maCa: string): Promise<KetQuaChamLaiCa> {
  const goi = await gomCa(url, mat, maCa)
  const em: DoiDiemMotEm[] = goi.daCham.map((e) => {
    const s = e.graded.score
    const cu: DiemBaPhan = {
      I: e.moiNhat.diemI,
      II: e.moiNhat.diemII,
      III: e.moiNhat.diemIII,
      tong: e.moiNhat.tong,
    }
    const moi: DiemBaPhan = { I: s.phanIScore, II: s.phanIIScore, III: s.phanIIIScore, tong: s.total }
    return { sbd: e.sbd, hoTen: e.hoTen, cu, moi, doi: cu.tong !== moi.tong }
  })

  const bai = goi.daCham.map((e) =>
    taoBaiGhiDiem(goi.keyBank, maCa, e.sbd, e.moiNhat.lanThu, e.moiNhat.dapAn!, e.graded, e.moiNhat.giayCau),
  )
  const kq = await ghiDiem(url, mat, maCa, bai)

  const dau = goi.daCham[0]?.graded.score
  return {
    maCa,
    tenCa: goi.ca.tenCa,
    soCau: {
      I: goi.keyBank.phanI.length,
      II: goi.keyBank.phanII.length,
      III: goi.keyBank.phanIII.length,
    },
    quota: dau ? dau.quota : { I: 0, II: 0, III: 0 },
    em,
    soDoi: em.filter((x) => x.doi).length,
    daGhi: kq.daGhi,
    tuChoi: kq.tuChoi,
  }
}
