// CẤU HÌNH NỘP PHIẾU KHẮC PHỤC — NOP-PHIEU-KHAC-PHUC.md mục 3.
//
// MỘT NGUỒN SỰ THẬT. Bốn cờ này đi THEO TỆP PHIẾU: phiếu mở trên máy em, không
// đọc được IndexedDB của thầy, nên cờ phải được chốt lúc DỰNG phiếu và nằm luôn
// trong tệp.

export interface CauHinhNopKhacPhuc {
  /** Em nộp lại được bao nhiêu lần tuỳ ý. Mỗi lượt ghi một hàng, không đè. */
  CHO_NOP_LAI: boolean
  /** Nộp xong mở lời giải MỌI câu (thầy chốt 08/09: "bấm nộp bài xong cho xem
   * lời giải luôn"). Em vừa làm xong là lúc em muốn biết vì sao nhất. */
  HIEN_GIAI_SAU_NOP: boolean
  /** Cho mở lời giải TRƯỚC khi nộp. MẶC ĐỊNH TẮT — mở sẵn thì bài luyện thành
   * bài chép. */
  HIEN_GIAI_TRUOC_NOP: boolean
  /** Bắt làm hết mới cho nộp. MẶC ĐỊNH TẮT: bỏ trống vẫn nộp được và tính là
   * sai, vì chặn nộp là em bỏ luôn cả bài. */
  CAN_LAM_HET_MOI_NOP: boolean
}

export const CAU_HINH_NOP_MAC_DINH: CauHinhNopKhacPhuc = {
  CHO_NOP_LAI: true,
  HIEN_GIAI_SAU_NOP: true,
  HIEN_GIAI_TRUOC_NOP: false,
  CAN_LAM_HET_MOI_NOP: false,
}

export function cauHinhNop(luu?: Partial<CauHinhNopKhacPhuc> | null): CauHinhNopKhacPhuc {
  const c = luu ?? {}
  return {
    CHO_NOP_LAI: c.CHO_NOP_LAI !== false,
    HIEN_GIAI_SAU_NOP: c.HIEN_GIAI_SAU_NOP !== false,
    HIEN_GIAI_TRUOC_NOP: c.HIEN_GIAI_TRUOC_NOP === true,
    CAN_LAM_HET_MOI_NOP: c.CAN_LAM_HET_MOI_NOP === true,
  }
}

/** CHẤM MỘT LƯỢT LÀM — dùng chung giữa máy em (hiện ngay) và test.
 *
 * Máy chủ chấm LẠI bằng đúng ba luật này; hai nơi lệch nhau là em thấy một số,
 * thầy thấy số khác. Câu bỏ trống tính SAI, không tính là chưa làm. */
export function chamKhacPhuc(
  cau: { id: string; phan: 'I' | 'II' | 'III'; dapAn: string }[],
  daChon: Record<string, string>,
): { soCau: number; soDung: number; qidSai: string[]; soBoTrong: number } {
  const chuanIII = (v: unknown) => String(v ?? '').trim().replace(',', '.')
  let soDung = 0
  let soBoTrong = 0
  const qidSai: string[] = []
  for (const c of cau) {
    const qid = String(c.id || '').trim()
    if (!qid) continue
    const chon = String(daChon[qid] ?? '').trim()
    if (!chon) soBoTrong += 1
    const dung = String(c.dapAn ?? '').trim()
    const khop = !chon ? false : c.phan === 'III' ? chuanIII(chon) === chuanIII(dung) : chon.toUpperCase() === dung.toUpperCase()
    if (khop) soDung += 1
    else qidSai.push(qid)
  }
  return { soCau: cau.length, soDung, qidSai, soBoTrong }
}
