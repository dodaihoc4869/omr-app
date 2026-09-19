// LỊCH LÔ BTVN — thay "3 Vòng Phân Tầng" bằng dãn câu theo ngày/giờ tính từ hạn.
//
// Yêu cầu gốc (19/09, mục 3 SO-VIEC.md): "bỏ vòng 1 và vòng 2 đi... tính toán
// theo thời gian deadline tách luôn câu hiển thị lên bảng tin theo ngày hoặc
// theo giờ dãn cách thông minh hiệu quả cùng với các nhiệm vụ khác để học
// sinh không bị quá tải mà vẫn hoàn thành deadline hiệu quả, nếu chưa hoàn
// thành nhiệm vụ trước thì gán nhãn khẩn cấp hơn, chỉ khi nào hoàn thành xong
// nhiệm vụ trước thì nhiệm vụ mới mới hiển thị."
//
// KHÁC VÒNG CŨ Ở ĐÂU: vòng cũ chia câu theo ĐỘ KHÓ (Lõi/Trọng tâm/Thử thách),
// hiện dần theo % đã làm, hạn mềm Vòng 2 = xong Vòng 1 + CỐ ĐỊNH 24h. Lô mới
// chia câu theo THỜI GIAN — mỗi lô gắn một mốc ngày/giờ cụ thể tính NGƯỢC từ
// hạn nộp, cỡ lô co giãn theo em đang bận bao nhiêu nhiệm vụ khác.
//
// THUẦN LOGIC, KHÔNG ĐỌC Date.now(): mọi hàm nhận `now`/`giaoLuc`/`hanNop` từ
// bên ngoài để test dựng được đủ ca mà không cần chờ đồng hồ thật, và để
// "lô nào đang mở" tính lại lúc nào cũng ra đúng một kết quả (tất định) —
// KHÔNG lưu mốc mở từng lô ở đâu cả, chỉ lưu duy nhất `loDaXong` (server).
import { mocThoiGian } from './han-bai-tap'

export const SO_CAU_MOI_LO_TOI_THIEU = 3
const MOT_NGAY_MS = 24 * 3600_000
const MOT_GIO_MS = 3600_000

export interface LoBtvn {
  /** Số thứ tự lô, 0-based. */
  chiSo: number
  /** Số câu TRONG lô này (cộng dồn `soCau` của mọi lô = tổng câu bài tập). */
  soCau: number
  /** Mốc ISO lô này SẴN SÀNG hiện lên bảng tin — không sớm hơn `giaoLuc`. */
  moDuKienLuc: string
}

export interface LichLoBtvn {
  cacLo: LoBtvn[]
  donViDan: 'ngay' | 'gio'
}

/** Đầu vào tính lịch — thuần số, không phụ thuộc kiểu dữ liệu BTVN thật. */
export interface ThamSoLichLoBtvn {
  soCau: number
  giaoLuc: string
  hanNop: string
  /** Ngân sách câu/ngày CHUNG của em — lấy nguyên từ `tinhNganSachNgay` đã có
   * (8–16 câu/ngày, chống quá tải), KHÔNG tính lại ở đây để hai chỗ không ra
   * hai con số. */
  nganSachNgay: number
  /** Câu em đang nợ ở CÁC nhiệm vụ khác (không tính bài này) — bài này phải
   * nhường bớt phần ngân sách ngày cho chúng, lô co lại tương ứng. */
  taiKhac: number
}

/**
 * DỰNG LỊCH LÔ CHO MỘT BÀI TẬP VỀ NHÀ.
 *
 * Khung ≥ 24h ⇒ dãn theo NGÀY (một lô cách nhau ~1 ngày). Khung ngắn hơn (bài
 * gấp, hạn trong vài giờ) ⇒ dãn theo GIỜ — đúng câu thầy cho phép "theo ngày
 * hoặc theo giờ". Số lô KHÔNG BAO GIỜ vượt số mốc ngày/giờ có trong khung —
 * xong đúng hạn quan trọng hơn đúng nhịp, giữ đúng lời hứa "vẫn hoàn thành
 * deadline hiệu quả".
 *
 * Dữ liệu hỏng/thiếu (hạn không sau lúc giao, không câu nào) ⇒ trả một lô duy
 * nhất chứa hết câu, mở ngay — KHÔNG BAO GIỜ khoá em khỏi bài vì lịch tính lỗi.
 */
export function tinhLichLoBtvn(t: ThamSoLichLoBtvn): LichLoBtvn {
  const soCau = Math.max(0, Math.floor(Number(t.soCau) || 0))
  const giaoMs = mocThoiGian(t.giaoLuc)
  const hanMs = mocThoiGian(t.hanNop)
  const motLoDuyNhat = (): LichLoBtvn => ({
    cacLo: soCau > 0 ? [{ chiSo: 0, soCau, moDuKienLuc: t.giaoLuc || new Date(0).toISOString() }] : [],
    donViDan: 'ngay',
  })
  if (soCau === 0 || giaoMs === undefined || hanMs === undefined || hanMs <= giaoMs) return motLoDuyNhat()

  const khungMs = hanMs - giaoMs
  const theoNgay = khungMs >= MOT_NGAY_MS
  const donVi = theoNgay ? MOT_NGAY_MS : Math.max(MOT_GIO_MS, khungMs / 6)
  const soMocToiDa = Math.max(1, Math.floor(khungMs / donVi))

  // Ngân sách còn lại DÀNH RIÊNG cho bài này sau khi trừ tải các nhiệm vụ khác.
  const phanConLai = Math.max(SO_CAU_MOI_LO_TOI_THIEU, Math.round((Number(t.nganSachNgay) || 0) - (Number(t.taiKhac) || 0)))
  const soCauMoiLoMongMuon = Math.max(SO_CAU_MOI_LO_TOI_THIEU, Math.min(soCau, phanConLai))
  const soLo = Math.min(Math.max(1, Math.ceil(soCau / soCauMoiLoMongMuon)), soMocToiDa, soCau)

  const cacLo: LoBtvn[] = []
  let conLai = soCau
  for (let i = 0; i < soLo; i++) {
    const soLoConLai = soLo - i
    const soCauLo = i === soLo - 1 ? conLai : Math.max(1, Math.round(conLai / soLoConLai))
    conLai -= soCauLo
    const mocMs = soLo <= 1 ? giaoMs : giaoMs + Math.round((i * khungMs) / soLo)
    cacLo.push({ chiSo: i, soCau: soCauLo, moDuKienLuc: new Date(mocMs).toISOString() })
  }
  return { cacLo, donViDan: theoNgay ? 'ngay' : 'gio' }
}

export interface TrangThaiLoHienTai {
  /** Chỉ số lô em đang phải làm (0-based) — chính là `loDaXong` truyền vào. */
  chiSo: number
  soCau: number
  /** Đã tới mốc dự kiến của lô này chưa — CHƯA tới thì KHÔNG hiện nhiệm vụ
   * này lên bảng tin (đúng "chỉ khi nào hoàn thành xong nhiệm vụ trước thì
   * nhiệm vụ mới mới hiển thị" — ở đây là "chưa tới nhịp thì chưa hiển thị"). */
  daToiMoc: boolean
  /** Đã quá mốc dự kiến LÔ TIẾP THEO mà lô này vẫn chưa xong — nghĩa là em
   * đang trễ hơn MỘT nhịp trở lên, phải gán nhãn khẩn cấp hơn hẳn. */
  treNhip: boolean
  moDuKienLuc: string
}

/**
 * LÔ EM ĐANG PHẢI LÀM, ứng với `loDaXong` máy chủ đã ghi.
 *
 * Trả `null` khi đã xong hết mọi lô bắt buộc (chỗ gọi tự quyết có mở thêm "lô
 * thử thách" tuỳ chọn hay không — hàm này không biết gì về thử thách).
 */
export function loDangCho(lich: LichLoBtvn, loDaXong: number, now: number): TrangThaiLoHienTai | null {
  const lo = lich.cacLo[loDaXong]
  if (!lo) return null
  const mocMs = mocThoiGian(lo.moDuKienLuc) ?? now
  const mocLoSau = lich.cacLo[loDaXong + 1]
  const mocLoSauMs = mocLoSau ? mocThoiGian(mocLoSau.moDuKienLuc) : undefined
  return {
    chiSo: lo.chiSo,
    soCau: lo.soCau,
    daToiMoc: now >= mocMs,
    treNhip: mocLoSauMs !== undefined && now >= mocLoSauMs,
    moDuKienLuc: lo.moDuKienLuc,
  }
}

/** Tổng số câu CỘNG DỒN tính tới hết lô `denChiSo` (dùng cho `soCauSang` cũ:
 * bao nhiêu câu trong phiếu được phép "sáng" tính tới lô hiện tại). */
export function tongCauDenLo(lich: LichLoBtvn, denChiSo: number): number {
  let tong = 0
  for (const lo of lich.cacLo) {
    if (lo.chiSo > denChiSo) break
    tong += lo.soCau
  }
  return tong
}
