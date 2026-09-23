// DTO CHUNG CHO BA APP — CNH-1.0 (P03 mục 4).
//
// VÌ SAO: trước bản này mỗi màn tự suy "bậc/yếu" theo cách riêng (`nam_kt_dang.bac` cho game,
// `NAM_KT_CUA_CAU` cho hồ sơ, `SO_CAU_DU_TIN_DANG` cho lớp). Ba app đọc CÙNG một máy chủ thì phải
// nhận CÙNG một hình dữ liệu và CÙNG một định nghĩa mạnh/yếu — đó là điều 01 §3.2 ("ba app dùng cùng
// trạng thái server") và 01 §4 ("không lấy cấp thú thay năng lực").
//
// Hàm ở đây THUẦN: chỉ đổi hình dữ liệu + gắn nhãn chữ. Không tính lại bằng chứng, không đọc D1.
import { SO_DUNG_TRONG_RECENT5, SO_FAMILY_XAC_NHAN, SO_NGAY_BANG_CHUNG } from './ho-so-cau-hinh'
import type { BangNangLuc, DotDayLai, MucRecent5, NangLucSkill, TrangThaiDot } from './nang-luc'

/** Một kỹ năng trong DTO: đủ để màn học sinh, phụ huynh và giáo viên đọc — KHÔNG chứa đáp án. */
export interface DtoNangLucSkill {
  skillId: string
  workingLevel: number
  /** `null` = CHƯA đủ bằng chứng — UI phải hiện `nhanMuc` ("chưa đủ căn cứ"), KHÔNG hiện "không biết gì".
   *  Cấp thần thú KHÔNG xuất hiện ở đây (không lấy cấp thú thay năng lực). */
  validatedLevel: number | null
  nhanMuc: string
  confidence: number
  /** Nhãn đọc được của `confidence` (độ ĐỦ bằng chứng, không phải xác suất làm đúng). */
  nhanTinCay: string
  familyCount: number
  dayCount: number
  canKiemLai: boolean
  recent5: MucRecent5[]
  /** Đợt cần dạy lại: `state` để ba app hiện cùng một bước đường phục hồi. */
  dot: { state: TrangThaiDot; nhan: string; dangMo: boolean } | null
  /** `eventId` đã chọn — dùng để đối chiếu/giải thích, KHÔNG gửi cho học sinh khác. */
  evidenceRefs: string[]
}

/** Vì sao một kỹ năng CHƯA được xác nhận mức — mã máy đọc được, hiển thị cho giáo viên. */
export type LyDoChuaXacNhan = 'DA_XAC_NHAN' | 'THIEU_FAMILY' | 'THIEU_NGAY' | 'RECENT5_CHUA_DU' | 'DOT_DANG_MO' | 'NEN_DANG_MO'

export interface DtoHoSoHocTap {
  sbd: string
  policyVersion: string
  denNgay: string
  revision: number
  cursor: { receivedAt: number; eventId: string } | null
  skills: DtoNangLucSkill[]
  /** Một chỗ duy nhất nói vì sao chưa xác nhận mức — ba app hiện cùng lý do. */
  lyDo: { skillId: string; lyDo: LyDoChuaXacNhan; thieuFamily: number; thieuNgay: number; dungTrongRecent5: number }[]
}

const TEN_TRANG_THAI: Record<TrangThaiDot, string> = {
  needs_teaching: 'cần dạy lại',
  practicing: 'đang luyện có hướng dẫn',
  recovered: 'đã tự làm lại được',
  stable: 'đã vững',
}

const NHAN_MUC = ['Biết', 'Hiểu', 'Vận dụng'] as const

/** Nhãn mức: `null` KHÔNG được đọc thành "không biết gì" (§3.2.1). */
export function nhanMuc(validated: number | null, working: number): string {
  if (validated === null) return `chưa đủ căn cứ · đang luyện mức ${NHAN_MUC[Math.min(2, Math.max(0, working))]}`
  return NHAN_MUC[Math.min(2, Math.max(0, validated))]
}

/** Nhãn độ tin: nói thẳng là ĐỘ ĐỦ BẰNG CHỨNG (không phải xác suất đúng). */
export function nhanTinCay(confidence: number): string {
  if (confidence >= 1) return 'đủ bằng chứng'
  if (confidence > 0) return `đủ ${Math.round(confidence * 100)}% bằng chứng`
  return 'chưa có bằng chứng'
}

/** Lý do chưa xác nhận mức của một kỹ năng (thuần, dùng cho cả ba app). */
export function lyDoChuaXacNhan(bang: BangNangLuc, s: NangLucSkill): LyDoChuaXacNhan {
  if (s.validatedLevel !== null) return 'DA_XAC_NHAN'
  if (s.dotDangMo) return 'DOT_DANG_MO'
  const nenMo = s.kyNangNen.some((p) => bang.skills.find((x) => x.skillId === p)?.dotDangMo)
  if (nenMo) return 'NEN_DANG_MO'
  if (s.familyCount < SO_FAMILY_XAC_NHAN) return 'THIEU_FAMILY'
  if (s.dayCount < SO_NGAY_BANG_CHUNG) return 'THIEU_NGAY'
  if (s.recent5.filter((x) => x.correct).length < SO_DUNG_TRONG_RECENT5) return 'RECENT5_CHUA_DU'
  return 'THIEU_FAMILY'
}

/** Đổi hồ sơ năng lực máy chủ → DTO chung. Không đọc/không tính lại gì thêm. */
export function dtoNangLuc(bang: BangNangLuc): DtoHoSoHocTap {
  return {
    sbd: bang.sbd, policyVersion: bang.policyVersion, denNgay: bang.denNgay,
    revision: bang.revision, cursor: bang.cursor,
    skills: [...bang.skills].sort((a, b) => a.skillId.localeCompare(b.skillId)).map(dtoSkill),
    lyDo: bang.skills.map((s) => ({
      skillId: s.skillId, lyDo: lyDoChuaXacNhan(bang, s),
      thieuFamily: Math.max(0, SO_FAMILY_XAC_NHAN - s.familyCount),
      thieuNgay: Math.max(0, SO_NGAY_BANG_CHUNG - s.dayCount),
      dungTrongRecent5: s.recent5.filter((x) => x.correct).length,
    })),
  }
}

function dtoSkill(s: NangLucSkill): DtoNangLucSkill {
  const dot: DotDayLai | null = s.dot
  return {
    skillId: s.skillId, workingLevel: s.workingLevel, validatedLevel: s.validatedLevel,
    nhanMuc: nhanMuc(s.validatedLevel, s.workingLevel), confidence: s.confidence,
    nhanTinCay: nhanTinCay(s.confidence), familyCount: s.familyCount, dayCount: s.dayCount,
    canKiemLai: s.canKiemLai, recent5: s.recent5,
    dot: dot ? { state: dot.state, nhan: TEN_TRANG_THAI[dot.state], dangMo: !!s.dotDangMo } : null,
    evidenceRefs: s.evidenceRefs,
  }
}
