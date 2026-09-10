// CẤU HÌNH ĐỀ RIÊNG TỪNG EM — DE-RIENG-TUNG-EM mục 3.
//
// MỘT NGUỒN SỰ THẬT. Cấm gõ cứng mấy con số này ở chỗ khác để "chỉnh tạm":
// tỉ lệ câu lặp là lời hứa của cả tính năng, hạ nó ở một chỗ là báo cáo nói
// một đằng đề ra một nẻo.

export interface CauHinhDeRieng {
  /** Tỉ lệ câu lặp trên SỐ CÂU EM SAI Ở CA TRƯỚC (thầy chốt 08/09: "lấy 30% là
   * lấy 30% câu sai của ca thi trước đó, ví dụ ca trước có 10 câu sai thì lấy
   * 3 câu, lẻ thì làm tròn lên").
   *
   * KHÔNG phải tỉ lệ trên tổng số câu của đề — hai cách cho hai con số khác
   * hẳn nhau: em sai 2 câu mà đề 20 câu, tính theo đề là đòi 6 câu lặp trong
   * khi em chỉ có 2. */
  TI_LE_CAU_LAP: number
  /** TRẦN AN TOÀN cho số ca quét ngược, KHÔNG phải phạm vi thường ngày.
   *
   * Thầy chốt 10/09: "phải quét hết thư mục năm sinh đó, tìm ra lần thi gần
   * nhất của từng học sinh". Nên phạm vi mặc định nay là CẢ THƯ MỤC NĂM SINH,
   * còn con số này chỉ để chặn trường hợp một năm có hàng trăm ca làm lượt dựng
   * đề treo. Đặt rộng tay: hết năm học một khối cũng hiếm khi quá ngần này.
   *
   * Bản trước để 3 và dùng nó làm PHẠM VI: em nghỉ đúng ba buổi là mất sạch câu
   * lặp, và tệ hơn — ba ca gần nhất tính trên MỌI khối, nên ca khối 10 rút phải
   * câu sai của ca khối 12. */
  TRAN_CA_QUET: number
  /** Một câu lặp đủ số lần này mà em vẫn sai thì THÔI LẶP. Lặp lần thứ tư là
   * đang thay việc dạy lại bằng việc hỏi lại. */
  TRAN_LAP_MOT_CAU: number
  /** Có tính câu BỎ TRỐNG là "đã sai" hay không. Mặc định tắt: bỏ trống do hết
   * giờ không phải là không làm được, lặp lại là lặp nhầm. */
  CHO_LAP_CAU_BO_TRONG: boolean
  /** LẤY CÂU SAI TỪ ĐÂU (thầy chốt 08/09, hai nút ở màn Mở ca):
   *   · `gan_nhat` — chỉ ca gần nhất em có nộp. Đo đúng buổi vừa dạy. Vẫn quét
   *                  quét cả thư mục năm sinh để TÌM ca đó, nhưng chỉ LẤY một.
   *   · `ba_ca`    — bốc NGẪU NHIÊN 3 ca bất kỳ trong các ca đã thi trước đó,
   *                  không nhất thiết 3 ca gần nhất (thầy chốt 08/09: "chỗ rút
   *                  3 ca bạn rút ngẫu nhiên 3 ca trước đó bất kì không cần
   *                  gần nhất nhé"). Bắt được lỗi cũ em vẫn chưa sửa. */
  PHAM_VI_HOI_LAI: 'gan_nhat' | 'ba_ca'
}

/** Bao nhiêu ca được BỐC khi chọn phạm vi `ba_ca`. */
export const SO_CA_BOC_NGAU_NHIEN = 3

export const TEN_PHAM_VI_HOI_LAI: Record<CauHinhDeRieng['PHAM_VI_HOI_LAI'], string> = {
  gan_nhat: 'Ca gần nhất',
  ba_ca: '3 ca ngẫu nhiên',
}

export const GIAI_THICH_PHAM_VI: Record<CauHinhDeRieng['PHAM_VI_HOI_LAI'], string> = {
  gan_nhat: 'Quét cả thư mục năm sinh, tìm ca GẦN NHẤT TỪNG EM có nộp rồi lấy 30% số câu em sai ở đúng ca đó. Em nghỉ mấy buổi vẫn tìm ra.',
  ba_ca: 'Bốc 3 ca bất kỳ TRONG THƯ MỤC NĂM SINH, gộp câu sai rồi lấy 30%. Bắt được cả lỗi cũ em vẫn chưa sửa.',
}

export const CAU_HINH_DE_RIENG_MAC_DINH: CauHinhDeRieng = {
  TI_LE_CAU_LAP: 0.3,
  TRAN_CA_QUET: 60,
  TRAN_LAP_MOT_CAU: 3,
  CHO_LAP_CAU_BO_TRONG: false,
  PHAM_VI_HOI_LAI: 'gan_nhat',
}

function soDuong(v: unknown, macDinh: number): number {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : macDinh
}

export function cauHinhDeRieng(luu?: Partial<CauHinhDeRieng> | null): CauHinhDeRieng {
  const c = luu ?? {}
  const ti = Number(c.TI_LE_CAU_LAP)
  return {
    // Kẹp trong (0, 1]: tỉ lệ 0 là tắt tính năng mà vẫn bật công tắc, tỉ lệ > 1
    // là đòi nhiều câu lặp hơn số câu của đề.
    TI_LE_CAU_LAP: Number.isFinite(ti) && ti > 0 && ti <= 1 ? ti : CAU_HINH_DE_RIENG_MAC_DINH.TI_LE_CAU_LAP,
    TRAN_CA_QUET: soDuong(c.TRAN_CA_QUET, CAU_HINH_DE_RIENG_MAC_DINH.TRAN_CA_QUET),
    TRAN_LAP_MOT_CAU: soDuong(c.TRAN_LAP_MOT_CAU, CAU_HINH_DE_RIENG_MAC_DINH.TRAN_LAP_MOT_CAU),
    CHO_LAP_CAU_BO_TRONG: c.CHO_LAP_CAU_BO_TRONG === true,
    PHAM_VI_HOI_LAI: c.PHAM_VI_HOI_LAI === 'ba_ca' ? 'ba_ca' : 'gan_nhat',
  }
}

/** SỐ CÂU LẶP CẦN CÓ khi ca trước em sai `soSaiCaTruoc` câu.
 *
 * LÀM TRÒN LÊN, không làm tròn thường: thầy chốt "lẻ thì làm tròn lên". Sai 10
 * câu ra 3; sai 4 câu ra 2 (1,2 → 2), không phải 1.
 *
 * Kẹp trên bằng chính `soSaiCaTruoc`: không thể lặp nhiều câu hơn số câu em đã
 * sai. Em sai 0 câu ⇒ 0 câu lặp, và đó là tin tốt chứ không phải lỗi. */
export function soCauLapCan(soSaiCaTruoc: number, ch: CauHinhDeRieng = CAU_HINH_DE_RIENG_MAC_DINH): number {
  const n = Math.max(0, Math.floor(Number(soSaiCaTruoc) || 0))
  if (n === 0) return 0
  return Math.min(n, Math.ceil(n * ch.TI_LE_CAU_LAP))
}
