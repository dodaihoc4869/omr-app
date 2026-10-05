// FSRS-6 (ts-fsrs 5.4.2): lịch theo ngày VN, replay từ sổ gốc, không lưu state mới vào D1.
//
// CNH-1.0 (P04) — trạng thái phải ĐỦ để dựng lại và không được lệch giữa các đường gọi:
//   · KHOÁ TRÍ NHỚ = học sinh × `content_group` × `memory_version` (02 §4.1). Bản sao nguyên nội dung dùng
//     CHUNG một card; đổi đáp án/nội dung có ý nghĩa (đổi `question_version`) tạo memory_version mới ⇒ card mới.
//   · MỘT quan sát ĐỘC LẬP mỗi card mỗi ngày VN; trong ngày: có sai hợp lệ thì Again thắng, chỉ đúng thì Good.
//   · Lần làm lại có HỖ TRỢ (`assisted`) KHÔNG thêm Good và KHÔNG đẩy mốc xa — chỉ ghi nhận.
//   · Thiếu trả lời (bỏ trống) không cập nhật card.
//   · Không đọc đồng hồ; không `Math.random`.
//   · OMNI 3 (đặc tả 4.5) — HẠNG 4 MỨC chỉ khi nơi gọi đưa `hang` (suy từ tự tin + nhãn tốc độ ĐÃ GHI lúc chấm, `hangFsrsTu`):
//     sai → Again · đúng + chưa chắc → Hard · đúng + chắc → Good · đúng + chắc + trôi chảy → Easy. Vắng `hang` ⇒ Again/Good như cũ.
//     PHIEN_BAN_FSRS KHÔNG đổi: sự kiện cũ không có tự tin/nhãn tốc độ ⇒ hạng Again/Good y hệt ⇒ state dựng từ sổ cũ vẫn đúng từng bit;
//     lịch FSRS không lưu D1 (phát lại mỗi lần đọc) nên không có state cũ nào cần dựng lại.
import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs'

/** Đổi cấu hình này phải tăng PHIEN_BAN_KE_HOACH để dựng lại hồ sơ đã lưu. */
export const CAU_HINH_FSRS = Object.freeze({ request_retention: 0.9, enable_fuzz: false, enable_short_term: false })

/**
 * PHIÊN BẢN LỊCH NHỚ: thư viện + mô hình + cấu hình đã khoá (01 §1: giữ ts-fsrs 5.4.2, FSRS-6,
 * retention 0,9, fuzz tắt, short-term tắt). Đổi bất kỳ thành phần nào ⇒ tăng số này và dựng lại state.
 */
export const PHIEN_BAN_FSRS = 'fsrs6-ts5.4.2-ret0.9-cfg1'

/**
 * KHOÁ TRÍ NHỚ của một câu: `content_group#memory_version` (02 §4.1). Hai qid khác nhau nhưng cùng
 * `content_group` và cùng phiên bản ⇒ CÙNG một khoá ⇒ cùng một card (bản sao không tính thêm).
 * Thiếu `content_group` (kho chưa gắn) thì dùng chính `qid` — KHÔNG gộp bừa hai câu khác nhau.
 */
export function khoaTriNho(contentGroup: string | null | undefined, version: string | null | undefined): string {
  const cg = (contentGroup ?? '').trim()
  const v = (version ?? '').trim()
  return cg ? `${cg}#${v || 'v0'}` : ''
}

export interface LichOnFsrs {
  card: Card
  truocNgay: Card
  ngay: string
  daSai: boolean
  lucDauNgay: number
  // --- CNH-1.0: phần ĐỦ STATE để dựng lại và giải thích (02 §4.1 "Lưu đủ Card và dữ liệu gộp đầu ngày"). ---
  /** Khoá trí nhớ (`content_group#version`); rỗng khi nơi gọi chưa có nhóm nội dung. */
  khoa: string
  /** Phiên bản lịch nhớ (`PHIEN_BAN_FSRS`) — state cũ khác phiên bản thì dựng lại, không trộn. */
  phienBan: string
  /** Thời điểm GỐC tạo card (ms) — không đổi qua các lần quan sát. */
  lucGoc: number
  /** Khoá sự kiện cuối cùng đã dùng để cập nhật card (con trỏ replay). */
  cursor: string
  /** Quan sát đang giữ có phải lần TỰ LÀM (độc lập) không. */
  docLap: boolean
  /** Số lần được HỖ TRỢ đã ghi nhận cho card này (không đẩy mốc). */
  soLanHoTro: number
}

export const ngayVnFsrs = (ms: number): string => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)

/** Hạng một quan sát (OMNI 3, 4 mức). */
export type HangFsrs = 'again' | 'hard' | 'good' | 'easy'
/**
 * Hạng 4 mức từ kết quả + tự tin + nhãn tốc độ đã ghi lúc chấm (`su_kien_hoc.raw_json` `{tt, td}`). Thiếu CẢ hai ⇒ undefined (Again/Good như cũ).
 * Thiếu tự tin nhưng có nhãn ⇒ coi là "chắc" (mặc định của hợp đồng). Thuần.
 */
export function hangFsrsTu(ketQua: 0 | 1, tuTin: unknown, nhanTocDo: unknown): HangFsrs | undefined {
  const coTuTin = tuTin === 'chac' || tuTin === 'chua_chac'
  const coNhan = typeof nhanTocDo === 'string' && nhanTocDo !== ''
  if (!coTuTin && !coNhan) return undefined
  if (ketQua === 0) return 'again'
  if (tuTin === 'chua_chac') return 'hard'
  return nhanTocDo === 'troi_chay' ? 'easy' : 'good'
}
/** Điểm FSRS của một quan sát: sai (hoặc hạng 'again') ⇒ Again; đúng ⇒ theo hạng, vắng hạng ⇒ Good (hành vi cũ). */
const diemFsrs = (ketQua: 0 | 1, hang: HangFsrs | undefined): Grade =>
  ketQua === 0 || hang === 'again' ? Rating.Again : hang === 'hard' ? Rating.Hard : hang === 'easy' ? Rating.Easy : Rating.Good

/** Tuỳ chọn của một quan sát: khoá trí nhớ, con trỏ và có phải lần tự làm hay không. */
export interface QuanSatFsrs {
  /** Có phải lần TỰ LÀM (máy chủ chưa cấp gợi ý/lời giải). Mặc định `true` (giữ nguyên hành vi cũ). */
  docLap?: boolean
  /** Khoá trí nhớ của câu; khác khoá cũ ⇒ bắt đầu card MỚI (memory_version mới). */
  khoa?: string
  /** Khoá sự kiện (để giải thích "đã dùng bằng chứng nào"). */
  cursor?: string
  /** OMNI 3: hạng 4 mức của quan sát (`hangFsrsTu`). Vắng ⇒ Again/Good theo kết quả (hành vi cũ). */
  hang?: HangFsrs
}

/**
 * Một quan sát/ngày: có sai thì dùng Again trên state đầu ngày; đúng lặp trong ngày không tăng mốc (quan sát ĐẦU ngày quyết định hạng).
 * Bỏ trống không gọi hàm này. Hard/Easy chỉ khi nơi gọi đưa `hang` (OMNI 3).
 * Quan sát có HỖ TRỢ (`docLap:false`) chỉ được ĐẾM, KHÔNG đổi card và KHÔNG đẩy mốc.
 */
export function taoLichOnFsrs(retention: number = CAU_HINH_FSRS.request_retention) {
  if (!Number.isFinite(retention) || retention <= 0 || retention >= 1) throw new RangeError('Mức nhớ FSRS phải nằm giữa 0 và 1')
  const scheduler = fsrs({ ...CAU_HINH_FSRS, request_retention: retention })
  return (cu: LichOnFsrs | undefined, luc: number, ketQua: 0 | 1, quanSat: QuanSatFsrs = {}): LichOnFsrs => {
    const ngay = ngayVnFsrs(luc)
    const khoa = quanSat.khoa ?? cu?.khoa ?? ''
    const docLap = quanSat.docLap !== false
    const cursor = quanSat.cursor ?? cu?.cursor ?? ''
    const phienBan = PHIEN_BAN_FSRS
    // Vào card MỚI: chưa có, ĐỔI KHOÁ TRÍ NHỚ (memory_version mới), hoặc state của phiên bản lịch khác.
    const vaoCardMoi = !cu || (!!khoa && !!cu.khoa && khoa !== cu.khoa) || cu.phienBan !== phienBan
    const moi: LichOnFsrs = {
      card: createEmptyCard<Card>(new Date(luc)), truocNgay: createEmptyCard<Card>(new Date(luc)), ngay,
      daSai: false, lucDauNgay: luc, khoa, phienBan, lucGoc: luc, cursor, docLap: true, soLanHoTro: 0,
    }
    if (vaoCardMoi) {
      if (!docLap) return { ...moi, docLap: false, soLanHoTro: 1 }
      const diem = diemFsrs(ketQua, quanSat.hang)
      const card = scheduler.next(moi.truocNgay, new Date(luc), diem).card
      return { ...moi, card, daSai: diem === Rating.Again, cursor }
    }
    const c = cu
    if (!docLap) return { ...c, docLap: false, soLanHoTro: c.soLanHoTro + 1, cursor } // hỗ trợ: KHÔNG đẩy mốc
    const diem = diemFsrs(ketQua, quanSat.hang)
    if (c.ngay === ngay && (c.daSai || diem !== Rating.Again)) return c
    const cungNgay = c.ngay === ngay
    const truocNgay = (cungNgay ? c.truocNgay : c.card) ?? createEmptyCard<Card>(new Date(luc))
    const lucDauNgay = cungNgay ? c.lucDauNgay : luc
    const card = scheduler.next(truocNgay, new Date(lucDauNgay), diem).card
    return { card, truocNgay, ngay, daSai: diem === Rating.Again, lucDauNgay, khoa: c.khoa, phienBan, lucGoc: c.lucGoc, cursor, docLap: true, soLanHoTro: c.soLanHoTro }
  }
}

