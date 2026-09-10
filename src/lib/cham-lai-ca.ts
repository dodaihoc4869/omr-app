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

/** Số em ghi điểm trong MỘT lượt gọi máy chủ. Xem ghi chú ở `chamLaiCa`.
 *
 * 5 → 3 (08/09 khuya): đo bằng hook `fetch`, một lô 5 em của ca 248567 chết ở
 * 25,3 giây. Máy chủ nay xoá dòng chi tiết cũ theo KHỐI thay vì từng dòng nên
 * đã nhanh hơn nhiều, nhưng bảng ChiTietCau còn tiếp tục dài ra theo mỗi ca —
 * lô nhỏ giữ cho mỗi lượt gọi luôn có biên an toàn, đổi lại vài lượt gọi thêm. */
const CO_LO = 3

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
  // MẪU SỐ đã dùng để chấm lô này — khai lên máy chủ để nó đối chiếu với số câu
  // thật của ca. Xem ghi chú dài ở `ghiDiem`.
  //
  // PHẢI LÀ `keyBank.soCau`, KHÔNG PHẢI ĐỘ DÀI KHO (thầy bắt được 10/09).
  //
  // `mergeKeepAnswers` trả về CẢ KHO trong `phanI/II/III` và để số câu MỖI EM
  // ở thuộc tính `soCau`. Ca đề riêng rút 8/2/2 từ kho 24/6/6: lấy độ dài kho
  // là khai 24/6/6 trong khi thật sự chấm bằng 8/2/2. Máy chủ đối chiếu thấy
  // lệch nên TỪ CHỐI cả lô — đúng như chốt an toàn thêm sau vụ lệch điểm ca
  // 447479 — và `chamLaiCa` KHÔNG BAO GIỜ chạy được trên ca dùng bộ câu con.
  //
  // Lần chấm lại ca 248567 hỏng hôm 07/09 từng bị quy cho hạn chờ 25 giây; hạn
  // chờ có thật, nhưng đây mới là chỗ chặn thật sự.
  //
  // Ca thường không có `soCau` thì cả kho CHÍNH LÀ đề em làm — lúc ấy độ dài
  // kho là mẫu số đúng, nên vẫn giữ làm đường lui.
  const soCauCham = goi.keyBank.soCau ?? {
    I: goi.keyBank.phanI.length,
    II: goi.keyBank.phanII.length,
    III: goi.keyBank.phanIII.length,
  }
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
  // GHI THEO LÔ NHỎ. Gói `ghiDiem` mang cả chi tiết TỪNG CÂU của từng em; ca
  // 21 em gửi một lần là quá 25 giây và `postJson` cắt ngang — đo được 07/09,
  // lượt đầu chấm lại ca 248567 hỏng đúng vì lý do này. Tuần tự chứ không song
  // song: Apps Script khoá script theo từng lượt ghi.
  const kq = { daGhi: [] as string[], tuChoi: [] as string[] }
  for (let i = 0; i < bai.length; i += CO_LO) {
    const phan = await ghiDiem(url, mat, maCa, bai.slice(i, i + CO_LO), soCauCham)
    kq.daGhi.push(...phan.daGhi)
    kq.tuChoi.push(...phan.tuChoi)
  }

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
