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
  /** Quét ngược mấy ca để tìm ca gần nhất em CÓ NỘP. Em nghỉ buổi trước thì
   * lùi tiếp một ca, không lấy bừa ca gần nhất của lớp. */
  SO_CA_TRA_NGUOC: number
  /** Một câu lặp đủ số lần này mà em vẫn sai thì THÔI LẶP. Lặp lần thứ tư là
   * đang thay việc dạy lại bằng việc hỏi lại. */
  TRAN_LAP_MOT_CAU: number
  /** Có tính câu BỎ TRỐNG là "đã sai" hay không. Mặc định tắt: bỏ trống do hết
   * giờ không phải là không làm được, lặp lại là lặp nhầm. */
  CHO_LAP_CAU_BO_TRONG: boolean
}

export const CAU_HINH_DE_RIENG_MAC_DINH: CauHinhDeRieng = {
  TI_LE_CAU_LAP: 0.3,
  SO_CA_TRA_NGUOC: 3,
  TRAN_LAP_MOT_CAU: 3,
  CHO_LAP_CAU_BO_TRONG: false,
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
    SO_CA_TRA_NGUOC: soDuong(c.SO_CA_TRA_NGUOC, CAU_HINH_DE_RIENG_MAC_DINH.SO_CA_TRA_NGUOC),
    TRAN_LAP_MOT_CAU: soDuong(c.TRAN_LAP_MOT_CAU, CAU_HINH_DE_RIENG_MAC_DINH.TRAN_LAP_MOT_CAU),
    CHO_LAP_CAU_BO_TRONG: c.CHO_LAP_CAU_BO_TRONG === true,
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
