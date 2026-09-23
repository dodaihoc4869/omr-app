// NĂNG LỰC THEO BẰNG CHỨNG — CNH-1.0 (P03).
//
// Nguồn quyết định: docs/cline-ca-nhan-hoa-2309/02-HOC-TAP-VA-RUT-CAU.md §3 và 04 §3/§6,
// tham số: THAM-SO.json `learning`, vector: MAU-KET-QUA.json V47/V48.
//
// LUẬT CỨNG (khoá bằng tests/cnh-1-0-nang-luc-t05-t06.test.ts và tests/cnh-1-0-replay-t32.test.ts):
//   · MỘT đơn vị bằng chứng = skill × difficulty × family × learning_day, CHỈ lấy lần ĐỘC LẬP ĐẦU TIÊN.
//     Làm lại cùng family trong cùng ngày KHÔNG đổi một lần sai thành đúng; bản sao (cùng
//     content_group) chỉ tính một lần. Câu nhiều kỹ năng: mỗi kỹ năng nhận đúng kết quả của mình,
//     KHÔNG nhân trọng lượng theo số nhãn.
//   · Bằng chứng `assisted`/`unknown` GIỮ lại cho phần hỗ trợ nhưng KHÔNG vào mẫu tăng bậc (§3.1).
//   · Một lần đúng trong ngày KHÔNG đủ lên mức: xác nhận mức d cần ≥5 family Ở ĐÚNG mức d, bằng chứng
//     qua ≥2 ngày VN, ≥4/5 recent5 đúng, và KHÔNG có đợt dạy lại đang mở ở skill hoặc nền của câu.
//   · `confidence` là ĐỘ ĐỦ BẰNG CHỨNG, không phải xác suất làm đúng: min(family/5,1)×min(ngày/2,1).
//   · Cấp thần thú KHÔNG tham gia công thức nào ở đây.
//   · HÀM THUẦN: không đọc đồng hồ, không `Math.random`; sắp `(receivedAt, eventId)` tăng dần nên
//     cùng một tập sự kiện ⇒ cùng một hồ sơ, kể cả khi tới theo thứ tự khác (replay ổn định).
//
// Bản ghi kèm `nhatKy` (sự kiện của kỹ năng trong cửa sổ) chỉ là ĐỆM để gộp tiếp; nguồn sự thật vẫn
// là sổ `su_kien_hoc`. Correction/tới-muộn ⇒ đánh dấu dirty và nơi gọi dựng lại kỹ năng đó từ sổ.
import {
  CUA_SO_BANG_CHUNG_NGAY as CUA_SO_NGAY,
  CUA_SO_LOI_NGAY,
  GIAY_CACH_STABLE,
  GIAY_HOAT_DONG_PHUC_HOI,
  MUC_KHOI_DAU,
  NHIEM_VU_CACH_PHUC_HOI,
  POLICY_VERSION,
  SO_DUNG_TRONG_RECENT5,
  SO_FAMILY_LOI,
  SO_FAMILY_XAC_NHAN,
  SO_LOI_MO_DOT,
  SO_NGAY_BANG_CHUNG,
} from './ho-so-cau-hinh'

export { POLICY_VERSION }

export type MucDoCau = 0 | 1 | 2
export type Assistance = 'none' | 'assisted' | 'unknown'
export type Visibility = 'embargoed' | 'released'

/** Một sự kiện học ĐÃ CHUẨN HOÁ (ánh xạ từ một dòng `su_kien_hoc`). */
export interface SuKienNL {
  /** Khoá bất biến của dòng sổ — dùng để sắp và trích dẫn ("event_id đã chọn"). */
  eventId: string
  /** Cơ hội làm do máy chủ cấp, độc lập với `request_id` gửi lại. Thiếu ⇒ chính bằng `eventId`. */
  attemptId: string
  sbd: string
  qid: string
  contentGroup: string
  /** Family chưa xác minh giữ `null` — KHÔNG bịa thành qid (02 §1.1). */
  familyId: string | null
  skillIds: string[]
  prerequisiteIds: string[]
  difficulty: MucDoCau
  /** Ngày VN YYYY-MM-DD do MÁY CHỦ quyết định. */
  learningDay: string
  /** Giờ máy chủ tiếp nhận (epoch ms) — thứ tự replay. */
  receivedAt: number
  /** `null` = bỏ trống/chưa chấm ⇒ KHÔNG là sai và KHÔNG là bằng chứng. */
  correct: boolean | null
  assistance: Assistance
  visibility: Visibility
  /** Sự kiện bị sửa bởi dòng này (correction), hoặc `null`. */
  correctionOf: string | null
  /** Giây hoạt động hợp lệ (dùng cho mốc phục hồi), `null` nếu không đo. */
  activeSeconds: number | null
  /** Mục đích nhiệm vụ (`maintenance`/`repair`/`probe`…) — dùng nhận diện lần hướng dẫn. */
  purpose: string | null
}

/** Một ĐƠN VỊ bằng chứng đã chọn (skill × difficulty × family × ngày, lần độc lập đầu). */
export interface DonViBangChung {
  skillId: string
  difficulty: MucDoCau
  familyId: string | null
  contentGroup: string
  learningDay: string
  correct: boolean
  eventId: string
  receivedAt: number
}

/** Một mục của `recent5`: family + bằng chứng NGÀY GẦN NHẤT của family ấy trong cửa sổ. */
export interface MucRecent5 {
  familyId: string
  correct: boolean
  learningDay: string
  eventId: string
}

export type TrangThaiDot = 'needs_teaching' | 'practicing' | 'recovered' | 'stable'

/** Đợt cần dạy lại của một kỹ năng (§3.3). */
export interface DotDayLai {
  skillId: string
  state: TrangThaiDot
  /** Giờ mở đợt (ms) và `eventId` của lỗi thứ ba — để giải thích cho giáo viên. */
  moLuc: number
  /** Mức thấp nhất trong ba lỗi — mốc "working_level đã điều chỉnh" để nhận một biến thể phục hồi. */
  mucLoi: number
  loiEventIds: string[]
  contentGroupLoi: string[]
  /** Lần hướng dẫn gần nhất (practicing) và lần tự làm đúng biến thể (recovered), nếu có. */
  huongDanLuc: number | null
  huongDanEventId: string | null
  phucHoiLuc: number | null
  phucHoiEventId: string | null
  /** `content_group` của lần phục hồi — lần `stable` phải KHÁC (không phải bản sao). */
  phucHoiContentGroup: string | null
  stableLuc: number | null
  /** Số nhiệm vụ khác hoàn tất giữa lần hướng dẫn và lần tự làm đúng (≥2 ⇒ đủ điều kiện). */
  nhiemVuCach: number
  /** Tổng giây hoạt động hợp lệ giữa lần hướng dẫn và lần tự làm đúng (≥300 ⇒ đủ điều kiện). */
  giayCach: number
}

/** Hồ sơ năng lực MỘT kỹ năng của một em. */
export interface NangLucSkill {
  sbd: string
  skillId: string
  policyVersion: string
  /** Mức đang dùng để luyện hôm nay (§3.2). Bắt đầu 0 khi chưa có bằng chứng. */
  workingLevel: number
  /** Mức đã có bằng chứng tự giải phù hợp; `null` khi chưa đủ (KHÔNG hiển thị thành "không biết gì"). */
  validatedLevel: number | null
  /** Độ ĐỦ bằng chứng (0..1) — nhãn UI phải nói đúng tên này. */
  confidence: number
  familyCount: number
  dayCount: number
  lastValidatedAt: string | null
  /** Bằng chứng ngoài cửa sổ 30 ngày: giữ mức đã từng xác nhận nhưng cần kiểm lại (§3.2.6). */
  canKiemLai: boolean
  /** Ngày VN dùng để tính cửa sổ của lần phát lại này. */
  denNgay: string
  recent5: MucRecent5[]
  /** `eventId` của các đơn vị bằng chứng đã chọn (để giải thích; không lộ cho học sinh khác). */
  evidenceRefs: string[]
  /** Đợt cần dạy lại ĐANG MỞ (needs_teaching/practicing) chặn xác nhận mức. */
  dotDangMo: DotDayLai | null
  /** Đợt gần nhất kể cả đã đóng (recovered/stable) — thầy xem được đường phục hồi. */
  dot: DotDayLai | null
  /** Các kỹ năng nền của bằng chứng trong cửa sổ (để kiểm "nền không có đợt mở"). */
  kyNangNen: string[]
}

export interface BangNangLuc {
  sbd: string
  policyVersion: string
  /** Con trỏ replay: sự kiện cuối đã gộp. `null` khi chưa có bằng chứng nào. */
  cursor: { receivedAt: number; eventId: string } | null
  revision: number
  denNgay: string
  skills: NangLucSkill[]
}

export interface TuyChonNangLuc {
  /** Ngày VN hiện tại (server) — bắt buộc, hàm thuần không đọc đồng hồ. */
  denNgay: string
  /** Phiên bản chính sách (mặc định `POLICY_VERSION`). */
  policyVersion?: string
  /** Mức do giáo viên xác nhận rõ (nếu có), ghi đè mức khởi đầu. */
  mucThayXacNhan?: ReadonlyMap<string, number>
}

// --- Sắp và lọc ---------------------------------------------------------------

/** Thứ tự replay bắt buộc: `(receivedAt, eventId)` tăng dần (04 §6). */
export const sapSuKien = (a: SuKienNL, b: SuKienNL): number => {
  if (a.receivedAt !== b.receivedAt) return a.receivedAt - b.receivedAt
  return a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0
}

/** Sự kiện không dùng được làm bằng chứng: thiếu danh tính/ngày, chưa chấm, hoặc ĐANG CHE (embargo). */
export const dungDuocLamBangChung = (e: SuKienNL): boolean =>
  !!e.sbd && !!e.eventId && !!e.learningDay && Number.isFinite(e.receivedAt) && e.correct !== null && e.visibility === 'released'

/** Bằng chứng ĐỘC LẬP: máy chủ chưa cấp gợi ý/lời giải (01 §2 "independent"). */
export const laDocLap = (e: SuKienNL): boolean => e.assistance === 'none'

/**
 * ÁP DỤNG SỬA ĐIỂM (correction — 04 §2 `correctionOf`, T20/T32): dòng sửa THAY kết quả của dòng gốc,
 * và GIỮ VỊ TRÍ THỜI GIAN của dòng gốc (bài nộp hôm nào vẫn là bằng chứng của hôm ấy), nhưng danh tính
 * lấy theo dòng sửa (`eventId`) để trích dẫn đúng "bằng chứng đang có hiệu lực".
 * · Nhiều dòng sửa cùng một gốc ⇒ dòng MỚI NHẤT theo `(receivedAt, eventId)` thắng.
 * · Dòng sửa trỏ tới gốc KHÔNG có trong tập (bị cắt cửa sổ) ⇒ giữ nguyên nó như một sự kiện riêng,
 *   KHÔNG bỏ dữ liệu.
 * Hàm thuần: cùng tập đầu vào ⇒ cùng đầu ra.
 */
export function apDungSuaDiem(ds: readonly SuKienNL[]): SuKienNL[] {
  const sap = [...ds].sort(sapSuKien)
  const coGoc = new Set(sap.map((e) => e.eventId))
  const sua = new Map<string, SuKienNL>()
  for (const e of sap) {
    if (!e.correctionOf) continue
    const cu = sua.get(e.correctionOf)
    if (!cu || sapSuKien(e, cu) > 0) sua.set(e.correctionOf, e)
  }
  const ra: SuKienNL[] = []
  for (const e of sap) {
    // Dòng SỬA đã được gộp vào dòng gốc ngay dưới ⇒ không đứng riêng (không đếm hai lần).
    // Ngoại lệ: dòng sửa trỏ tới gốc KHÔNG có trong tập thì vẫn là một sự kiện thật (không bỏ dữ liệu).
    if (e.correctionOf && coGoc.has(e.correctionOf)) continue
    const s = sua.get(e.eventId)
    if (!s) { ra.push(e); continue }
    ra.push({
      ...e, eventId: s.eventId, correct: s.correct, assistance: s.assistance,
      activeSeconds: s.activeSeconds, correctionOf: s.correctionOf, visibility: s.visibility,
      purpose: s.purpose ?? e.purpose,
    })
  }
  return ra
}

/** Khử trùng theo `eventId`, giữ bản đầu theo thứ tự replay (cho fixture; sổ đã khoá duy nhất). */
export function locSuKienSach(ds: readonly SuKienNL[]): SuKienNL[] {
  const daCo = new Set<string>()
  const ra: SuKienNL[] = []
  for (const e of apDungSuaDiem(ds)) {
    if (daCo.has(e.eventId)) continue
    daCo.add(e.eventId)
    ra.push(e)
  }
  return ra
}

/** Danh tính một đơn vị: skill × difficulty × family × ngày (family chưa xác minh ⇒ theo content_group). */
const khoaDonVi = (skillId: string, difficulty: number, familyId: string | null, contentGroup: string, ngay: string): string =>
  `${skillId}|${difficulty}|${familyId ?? `#${contentGroup}`}|${ngay}`

/**
 * ĐƠN VỊ BẰNG CHỨNG của một tập sự kiện: lần ĐỘC LẬP đầu tiên cho mỗi skill × difficulty × family × ngày.
 * Bằng chứng assisted/unknown KHÔNG vào đây (mẫu tăng bậc chỉ nhận bằng chứng độc lập), nhưng vẫn
 * được giữ trong `nhatKy` của kỹ năng để kiểm đợt dạy lại/hỗ trợ.
 */
export function donViBangChung(ds: readonly SuKienNL[]): DonViBangChung[] {
  const daChon = new Set<string>()
  const ra: DonViBangChung[] = []
  for (const e of locSuKienSach(ds)) {
    if (!dungDuocLamBangChung(e) || !laDocLap(e) || e.correct === null) continue
    for (const skillId of new Set(e.skillIds)) {
      const k = khoaDonVi(skillId, e.difficulty, e.familyId, e.contentGroup, e.learningDay)
      if (daChon.has(k)) continue
      daChon.add(k)
      ra.push({
        skillId, difficulty: e.difficulty, familyId: e.familyId, contentGroup: e.contentGroup,
        learningDay: e.learningDay, correct: e.correct, eventId: e.eventId, receivedAt: e.receivedAt,
      })
    }
  }
  return ra
}

/** Ngày VN lùi `n` ngày (cửa sổ 30 ngày); không đọc đồng hồ. */
export function luiNgay(ngay: string, n: number): string {
  const ms = Date.parse(`${ngay}T00:00:00Z`)
  if (!Number.isFinite(ms)) return ngay
  return new Date(ms - n * 86_400_000).toISOString().slice(0, 10)
}

/** Đơn vị còn trong cửa sổ 30 ngày VN tính đến `denNgay` (gồm cả `denNgay`). */
export function trongCuaSo(ds: readonly DonViBangChung[], denNgay: string): DonViBangChung[] {
  const tu = luiNgay(denNgay, CUA_SO_NGAY - 1)
  return ds.filter((u) => u.learningDay >= tu && u.learningDay <= denNgay)
}



// --- recent5, confidence, xác nhận mức ----------------------------------------

/**
 * `recent5`: năm FAMILY khác nhau có bằng chứng GẦN NHẤT ở đúng kỹ năng và đúng độ khó trong cửa sổ.
 * Mỗi family lấy bằng chứng ngày gần nhất; ghi lại `eventId` đã chọn để giải thích.
 */
export function recent5CuaSkill(units: readonly DonViBangChung[], skillId: string, difficulty: MucDoCau): MucRecent5[] {
  const theoFamily = new Map<string, DonViBangChung>()
  for (const u of units) {
    if (u.skillId !== skillId || u.difficulty !== difficulty || !u.familyId) continue
    const cu = theoFamily.get(u.familyId)
    if (!cu || sapTheoBangChung(u, cu) > 0) theoFamily.set(u.familyId, u)
  }
  return [...theoFamily.values()]
    .sort((a, b) => sapTheoBangChung(b, a) || (a.familyId! < b.familyId! ? -1 : 1))
    .slice(0, SO_FAMILY_XAC_NHAN)
    .map((u) => ({ familyId: u.familyId!, correct: u.correct, learningDay: u.learningDay, eventId: u.eventId }))
}

/** So hai đơn vị theo thứ tự replay (dùng chọn "gần nhất"). */
const sapTheoBangChung = (a: DonViBangChung, b: DonViBangChung): number =>
  a.receivedAt !== b.receivedAt ? a.receivedAt - b.receivedAt : a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0

/**
 * `confidence` = ĐỘ ĐỦ BẰNG CHỨNG (không phải xác suất làm đúng): min(family/5,1) × min(ngày/2,1).
 * Khớp vector MAU-KET-QUA.json V47 (4 family, 1 ngày ⇒ 0,4) và V48 (5 family, 2 ngày ⇒ 1).
 */
export function confidenceBangChung(familyCount: number, dayCount: number): number {
  return Math.min(familyCount / SO_FAMILY_XAC_NHAN, 1) * Math.min(dayCount / SO_NGAY_BANG_CHUNG, 1)
}

/** Số family ĐÃ XÁC MINH (khác nhau) có bằng chứng ở đúng độ khó trong cửa sổ. */
export function soFamily(units: readonly DonViBangChung[], skillId: string, difficulty: MucDoCau): number {
  const s = new Set<string>()
  for (const u of units) if (u.skillId === skillId && u.difficulty === difficulty && u.familyId) s.add(u.familyId)
  return s.size
}

/** Số ngày VN khác nhau có bằng chứng độc lập ở kỹ năng này trong cửa sổ. */
export function soNgay(units: readonly DonViBangChung[], skillId: string): number {
  const s = new Set<string>()
  for (const u of units) if (u.skillId === skillId) s.add(u.learningDay)
  return s.size
}

/**
 * Xác nhận `validated_level = d`: ≥5 family Ở ĐÚNG mức d · bằng chứng qua ≥2 ngày VN ·
 * ≥4/5 recent5 đúng · không có đợt dạy lại đang mở ở kỹ năng HOẶC ở nền của câu.
 * (Mức 2 chỉ xác nhận bằng dữ liệu mức 2 — chính vì điều kiện "đúng mức d".)
 */
export function xacNhanMuc(units: readonly DonViBangChung[], skillId: string, d: MucDoCau, coDotMo: boolean): boolean {
  if (coDotMo) return false
  if (soFamily(units, skillId, d) < SO_FAMILY_XAC_NHAN) return false
  if (soNgay(units, skillId) < SO_NGAY_BANG_CHUNG) return false
  const r5 = recent5CuaSkill(units, skillId, d)
  if (r5.length < SO_FAMILY_XAC_NHAN) return false
  return r5.filter((x) => x.correct).length >= SO_DUNG_TRONG_RECENT5
}

/** Mức cao nhất đã được xác nhận bằng bằng chứng (trong cửa sổ), hoặc `null`. */
export function mucDaXacNhan(units: readonly DonViBangChung[], skillId: string, coDotMo: boolean): MucDoCau | null {
  for (const d of [2, 1, 0] as const) if (xacNhanMuc(units, skillId, d, coDotMo)) return d
  return null
}

/**
 * `working_level` = mức ĐANG DÙNG để luyện hôm nay:
 *   · mức đã xác nhận, nếu có;
 *   · cộng một bậc khi có probe độc lập ĐÚNG ở bậc trên, ở BUỔI SAU (ngày khác lần xác nhận) — chưa
 *     xác nhận mức mới; probe SAI giữ nguyên mức (không hạ vì probe tự chọn);
 *   · bằng chứng quá 30 ngày: giữ mức đã từng xác nhận (kèm `canKiemLai`) nhưng luyện ở một mức
 *     thấp hơn, tối thiểu 0, để chẩn đoán lại.
 */
export function tinhWorkingLevel(
  units: readonly DonViBangChung[],
  skillId: string,
  validated: MucDoCau | null,
  ngayXacNhan: string | null,
  mucKhoiDau: number,
): number {
  const coBangChungTrongCua = units.some((u) => u.skillId === skillId)
  if (validated === null) return Math.max(0, coBangChungTrongCua ? mucKhoiDau : MUC_KHOI_DAU)
  if (!coBangChungTrongCua) return Math.max(0, validated - 1)
  const bacTren = (validated + 1) as MucDoCau
  if (bacTren <= 2) {
    const probeDung = units.find((u) => u.skillId === skillId && u.difficulty === bacTren && u.correct && (!ngayXacNhan || u.learningDay > ngayXacNhan))
    if (probeDung) return bacTren
  }
  return validated
}

/** Ngày VN của bằng chứng mới nhất đã dùng để xác nhận mức (dùng so BUỔI SAU của probe). */
export function ngayBangChungMuc(units: readonly DonViBangChung[], skillId: string, d: MucDoCau): string | null {
  let ngay: string | null = null
  for (const u of units) {
    if (u.skillId !== skillId || u.difficulty !== d) continue
    if (!ngay || u.learningDay > ngay) ngay = u.learningDay
  }
  return ngay
}

// --- Máy trạng thái đợt cần dạy lại (§3.3) -------------------------------------

/** Lần HƯỚNG DẪN: máy chủ đã cấp gợi ý/lời giải, hoặc nhiệm vụ chữa bài/bài mẫu đã hoàn tất. */
export const laHuongDan = (e: SuKienNL): boolean =>
  e.assistance === 'assisted' || e.purpose === 'repair' || e.purpose === 'repair_complete'

const MS_NGAY = 86_400_000

/**
 * Đợt cần dạy lại của MỘT kỹ năng, tính trên sự kiện ĐÃ CÔNG BỐ (`released`) có kết quả.
 * `needs_teaching → practicing → recovered → stable`:
 *   · needs_teaching: ba CƠ HỘI ĐỘC LẬP gần nhất đều SAI, khác content_group, trong 7 ngày, ≥2 family
 *     đã xác minh, và không có lần TỰ LÀM ĐÚNG biến thể MỚI ở giữa.
 *   · practicing: có lần hướng dẫn sau khi mở (gợi ý/lời giải của máy chủ hoặc bài mẫu/bài chữa).
 *   · recovered: tự làm đúng một BIẾN THỂ (content_group không nằm trong ba lỗi) ở mức đã điều chỉnh,
 *     cách lần hướng dẫn ≥2 nhiệm vụ khác HOẶC ≥300 giây hoạt động hợp lệ.
 *   · stable: thêm một lần độc lập đúng ở NGÀY KHÁC, cách `recovered` ≥24 giờ, cùng mức hoặc cao hơn,
 *     không phải bản sao (content_group khác lần phục hồi).
 * `dotDangMo` = `needs_teaching`/`practicing` (chặn xác nhận mức); hết `needs_teaching` ngay khi `recovered`.
 */
export function tinhDotDayLai(skillId: string, dsSkill: readonly SuKienNL[]): DotDayLai | null {
  // Giữ cả sự kiện HƯỚNG DẪN không có kết quả (máy chủ cấp gợi ý rồi em chưa nộp): đó chính là mốc
  // `practicing`. Sự kiện chưa chấm KHÁC (bỏ trống) không dùng được cho việc gì ở đây.
  const ev = locSuKienSach(dsSkill).filter(
    (e) => e.qid && e.visibility === 'released' && (e.correct !== null || laHuongDan(e)) && e.skillIds.includes(skillId),
  )
  let mo: DotDayLai | null = null
  let ganNhat: DotDayLai | null = null
  let loi: SuKienNL[] = []
  let cgGiua = new Set<string>()
  let giayGiua = 0

  for (const e of ev) {
    if (mo) {
      if (mo.state === 'needs_teaching') {
        if (laHuongDan(e)) {
          mo.state = 'practicing'
          mo.huongDanLuc = e.receivedAt
          mo.huongDanEventId = e.eventId
          cgGiua = new Set()
          giayGiua = 0
          continue
        }
        if (e.activeSeconds && e.activeSeconds > 0) giayGiua += e.activeSeconds
        continue
      }
      if (mo.state === 'practicing') {
        if (laDocLap(e) && e.correct === true && !mo.contentGroupLoi.includes(e.contentGroup) && e.difficulty >= mo.mucLoi) {
          // Ứng viên PHỤC HỒI: phải cách lần hướng dẫn ≥2 nhiệm vụ khác HOẶC ≥300 giây hoạt động hợp lệ.
          mo.nhiemVuCach = cgGiua.size
          mo.giayCach = giayGiua + (e.activeSeconds ?? 0)
          if (cgGiua.size >= NHIEM_VU_CACH_PHUC_HOI || mo.giayCach >= GIAY_HOAT_DONG_PHUC_HOI) {
            mo.state = 'recovered'
            mo.phucHoiLuc = e.receivedAt
            mo.phucHoiEventId = e.eventId
            mo.phucHoiContentGroup = e.contentGroup
            continue
          }
        }
        // Chưa đủ giãn: câu này tính là một nhiệm vụ khác đã hoàn tất (và cộng giây hoạt động).
        cgGiua.add(e.contentGroup)
        if (e.activeSeconds && e.activeSeconds > 0) giayGiua += e.activeSeconds
        continue
      }
      if (mo.state === 'recovered') {
        if (
          laDocLap(e) && e.correct === true && e.contentGroup && e.contentGroup !== mo.phucHoiContentGroup &&
          e.difficulty >= mo.mucLoi && mo.phucHoiLuc !== null &&
          e.receivedAt - mo.phucHoiLuc >= GIAY_CACH_STABLE &&
          e.learningDay !== ngayCua(mo.phucHoiLuc)
        ) {
          mo.state = 'stable'
          mo.stableLuc = e.receivedAt
        }
        continue
      }
      continue // stable: đợt đã đóng, không mở lại chính đợt này
    }

    // Chưa có đợt mở: theo dõi chuỗi lỗi độc lập.
    const docLap = laDocLap(e)
    if (docLap && e.correct === true && loi.length > 0 && !loi.some((x) => x.contentGroup === e.contentGroup)) {
      loi = [] // tự làm đúng một BIẾN THỂ MỚI ở giữa ⇒ ba lỗi cũ không còn là "liên tiếp"
    }
    if (docLap && e.correct === false) loi.push(e)
    if (loi.length > 0) {
      const cuoi = loi[loi.length - 1]!
      loi = loi.filter((x) => Date.parse(`${cuoi.learningDay}T00:00:00Z`) - Date.parse(`${x.learningDay}T00:00:00Z`) <= CUA_SO_LOI_NGAY * MS_NGAY)
    }
    if (loi.length >= SO_LOI_MO_DOT) {
      const ba = loi.slice(-SO_LOI_MO_DOT)
      const family = new Set(ba.map((x) => x.familyId).filter((x): x is string => !!x))
      const cg = new Set(ba.map((x) => x.contentGroup))
      if (family.size >= SO_FAMILY_LOI && cg.size === ba.length) {
        mo = {
          skillId, state: 'needs_teaching', moLuc: ba[ba.length - 1]!.receivedAt,
          mucLoi: Math.min(...ba.map((x) => x.difficulty)),
          loiEventIds: ba.map((x) => x.eventId), contentGroupLoi: ba.map((x) => x.contentGroup),
          huongDanLuc: null, huongDanEventId: null, phucHoiLuc: null, phucHoiEventId: null, phucHoiContentGroup: null,
          stableLuc: null, nhiemVuCach: 0, giayCach: 0,
        }
        ganNhat = mo
        loi = [] // ba lỗi đã thuộc đợt này; lỗi mới phải là chuỗi mới
      }
    }
  }
  return mo ?? ganNhat
}

/** Ngày VN của một thời điểm (CHỈ dùng cho mốc `stable` — ngày VN lệch 7 giờ). */
function ngayCua(ms: number): string {
  return new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
}

// --- Phát lại: một hàm tính dùng cho CẢ hai đường (đầy đủ và tăng dần) ----------

/** Trạng thái đã lưu của một kỹ năng — cần để GIỮ mức đã từng xác nhận khi bằng chứng quá hạn (§3.2.6). */
export interface TrangThaiTruoc {
  validatedLevel: number | null
  lastValidatedAt: string | null
}

/** Một bản ghi sự kiện theo từng kỹ năng (kỹ năng → sự kiện có kỹ năng ấy, theo thứ tự replay). */
export type SuKienTheoKyNang = Map<string, SuKienNL[]>

/** Chia sự kiện của MỘT em theo kỹ năng (mỗi kỹ năng thấy sự kiện của mình, đúng thứ tự replay). */
export function chiaTheoKyNang(ds: readonly SuKienNL[]): SuKienTheoKyNang {
  const ra: SuKienTheoKyNang = new Map()
  for (const e of locSuKienSach(ds)) {
    for (const k of new Set(e.skillIds)) {
      const l = ra.get(k)
      if (l) l.push(e)
      else ra.set(k, [e])
    }
  }
  return ra
}

const viTriCuoi = (ds: readonly SuKienNL[]): { receivedAt: number; eventId: string } | null => {
  let cuoi: SuKienNL | null = null
  for (const e of ds) if (!cuoi || sapSuKien(e, cuoi) > 0) cuoi = e
  return cuoi ? { receivedAt: cuoi.receivedAt, eventId: cuoi.eventId } : null
}

const soSanhViTri = (a: { receivedAt: number; eventId: string }, b: { receivedAt: number; eventId: string }): number =>
  a.receivedAt !== b.receivedAt ? a.receivedAt - b.receivedAt : a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0

/** Hồ sơ năng lực của MỘT em từ sự kiện đã chia theo kỹ năng (hàm thuần, tất định). */
export function tinhBangNangLuc(
  sbd: string,
  theoKyNang: SuKienTheoKyNang,
  tuy: TuyChonNangLuc,
  trangThaiTruoc?: ReadonlyMap<string, TrangThaiTruoc>,
): BangNangLuc {
  const tatCa: SuKienNL[] = []
  for (const l of theoKyNang.values()) tatCa.push(...l)
  const units = trongCuaSo(donViBangChung(tatCa), tuy.denNgay)

  const kyNang = [...theoKyNang.keys()].sort()
  const dot = new Map<string, DotDayLai | null>()
  const nen = new Map<string, string[]>()
  for (const k of kyNang) {
    dot.set(k, tinhDotDayLai(k, theoKyNang.get(k)!))
    const s = new Set<string>()
    for (const e of theoKyNang.get(k)!) for (const p of e.prerequisiteIds) if (p !== k) s.add(p)
    nen.set(k, [...s].sort())
  }

  const skills: NangLucSkill[] = []
  for (const k of kyNang) {
    const d = dot.get(k) ?? null
    const dMo = dotDangMo(d) !== null
    // "không có đợt cần dạy lại đang mở ở skill hoặc NỀN của câu" (§3.2.2)
    const coDotMoNen = nen.get(k)!.some((p) => dotDangMo(dot.get(p) ?? null) !== null)
    const coDotMo = dMo || coDotMoNen
    const truoc = trangThaiTruoc?.get(`${sbd}|${k}`)
    const coBangChung = units.some((u) => u.skillId === k)

    let validated = mucDaXacNhan(units, k, coDotMo)
    let dayXacNhan = validated !== null ? ngayBangChungMuc(units, k, validated) : null
    let canKiemLai = false
    if (validated === null && !coBangChung && truoc?.validatedLevel != null) {
      // Bằng chứng quá hạn: GIỮ mức đã từng xác nhận (không xoá thành tích), đánh dấu cần kiểm lại.
      validated = Math.max(0, Math.min(2, truoc.validatedLevel)) as MucDoCau
      dayXacNhan = truoc.lastValidatedAt
      canKiemLai = true
    }
    const mucDanhGia = validated ?? ((units.some((u) => u.skillId === k) ? Math.max(...units.filter((u) => u.skillId === k).map((u) => u.difficulty)) : 0) as MucDoCau)
    const coBang = units.filter((u) => u.skillId === k && u.difficulty === mucDanhGia)
    const familyCount = new Set(coBang.map((u) => u.familyId).filter((x): x is string => !!x)).size
    const dayCount = new Set(coBang.map((u) => u.learningDay)).size
    skills.push({
      sbd, skillId: k, policyVersion: tuy.policyVersion ?? POLICY_VERSION,
      workingLevel: tinhWorkingLevel(units, k, validated, dayXacNhan, MUC_KHOI_DAU),
      validatedLevel: validated,
      confidence: confidenceBangChung(familyCount, dayCount),
      familyCount, dayCount, lastValidatedAt: dayXacNhan, canKiemLai, denNgay: tuy.denNgay,
      recent5: recent5CuaSkill(units, k, mucDanhGia),
      evidenceRefs: units.filter((u) => u.skillId === k).sort(sapTheoBangChung).map((u) => u.eventId),
      dotDangMo: dotDangMo(d), dot: d, kyNangNen: nen.get(k)!,
    })
  }
  return {
    sbd, policyVersion: tuy.policyVersion ?? POLICY_VERSION,
    cursor: viTriCuoi(tatCa), revision: 1, denNgay: tuy.denNgay, skills,
  }
}

/** Đợt đang CHẶN xác nhận mức (chưa phục hồi). */
export const dotDangMo = (d: DotDayLai | null): DotDayLai | null =>
  d && (d.state === 'needs_teaching' || d.state === 'practicing') ? d : null

/**
 * PHÁT LẠI ĐẦY ĐỦ: mọi sự kiện của mọi em trong `ds` → hồ sơ năng lực từng em.
 * Cùng một tập sự kiện ⇒ cùng một hồ sơ, bất kể thứ tự đầu vào (đã sắp `(receivedAt, eventId)`).
 */
export function phatLaiNangLuc(
  ds: readonly SuKienNL[],
  tuy: TuyChonNangLuc,
  trangThaiTruoc?: ReadonlyMap<string, TrangThaiTruoc>,
): Map<string, BangNangLuc> {
  const theoEm = new Map<string, SuKienNL[]>()
  for (const e of locSuKienSach(ds)) {
    if (!e.sbd) continue
    const l = theoEm.get(e.sbd)
    if (l) l.push(e)
    else theoEm.set(e.sbd, [e])
  }
  const ra = new Map<string, BangNangLuc>()
  for (const sbd of [...theoEm.keys()].sort()) ra.set(sbd, tinhBangNangLuc(sbd, chiaTheoKyNang(theoEm.get(sbd)!), tuy, trangThaiTruoc))
  return ra
}

// --- Snapshot/cursor + replay TĂNG DẦN (04 §6) --------------------------------

/** Ảnh chụp năng lực một em + ĐỆM sự kiện theo kỹ năng (đệm KHÔNG phải nguồn sự thật). */
export interface AnhChupNangLuc {
  bang: BangNangLuc
  nhatKy: Record<string, SuKienNL[]>
}

/** Dựng ảnh chụp (kèm đệm) cho một em từ sổ sự kiện của chính em. */
export function anhChupTuSuKien(sbd: string, ds: readonly SuKienNL[], tuy: TuyChonNangLuc, trangThaiTruoc?: ReadonlyMap<string, TrangThaiTruoc>): AnhChupNangLuc {
  const ev = locSuKienSach(ds.filter((e) => e.sbd === sbd))
  const theo = chiaTheoKyNang(ev)
  const nhatKy: Record<string, SuKienNL[]> = {}
  for (const [k, l] of theo) nhatKy[k] = l
  return { bang: tinhBangNangLuc(sbd, theo, tuy, trangThaiTruoc), nhatKy }
}

/** Sự kiện của một kỹ năng nằm ở vị trí ≤ cursor ⇒ "tới muộn" (đã đi qua con trỏ) ⇒ phải dựng lại kỹ năng. */
const laToiMuon = (e: SuKienNL, cursor: { receivedAt: number; eventId: string } | null): boolean =>
  !!cursor && soSanhViTri({ receivedAt: e.receivedAt, eventId: e.eventId }, cursor) <= 0

/** Correction và sự kiện tới muộn làm dơ kỹ năng: phải dựng lại từ SỔ, không gộp bằng đệm. */
export function kyNangDirty(anh: AnhChupNangLuc, suKienMoi: readonly SuKienNL[]): Set<string> {
  const dirty = new Set<string>()
  for (const e of locSuKienSach(suKienMoi)) {
    if (!e.sbd || e.sbd !== anh.bang.sbd) continue
    if (e.correctionOf || laToiMuon(e, anh.bang.cursor)) for (const k of e.skillIds) dirty.add(k)
  }
  // Lan sang kỹ năng có NỀN nằm trong tập dơ: xác nhận mức của chúng phụ thuộc đợt dạy lại của nền.
  let them = true
  while (them) {
    them = false
    for (const s of anh.bang.skills) {
      if (dirty.has(s.skillId)) continue
      if (s.kyNangNen.some((p) => dirty.has(p))) { dirty.add(s.skillId); them = true }
    }
  }
  return dirty
}

/** Sự kiện còn cần giữ trong đệm: trong cửa sổ, hoặc thuộc đợt dạy lại chưa đóng. */
function nenGiuTrongDem(e: SuKienNL, tu: string, dot: DotDayLai | null): boolean {
  if (e.learningDay >= tu) return true
  if (!dot) return false
  if (dot.loiEventIds.includes(e.eventId)) return true
  const moc = dot.huongDanEventId ?? dot.phucHoiEventId
  return moc === e.eventId
}

/**
 * GỘP TĂNG DẦN: thêm sự kiện MỚI vào ảnh chụp mà không đọc lại cả sổ.
 *   · Sự kiện mới ở sau con trỏ ⇒ nối vào đệm rồi tính lại ĐÚNG kỹ năng ấy bằng cùng hàm tính.
 *   · Correction / sự kiện tới muộn / đổi trạng thái embargo ⇒ kỹ năng đó DƠ ⇒ dựng lại từ SỔ
 *     (`suKienDungLai`) rồi tính lại — nếu không có sổ thì NÉM LỖI, không im lặng trả số sai.
 * Kết quả phải BẰNG `phatLaiNangLuc` trên đúng tập sự kiện ấy (test T32 khoá tính chất này).
 */
export function gopTangDan(
  anh: AnhChupNangLuc,
  suKienMoi: readonly SuKienNL[],
  tuy: TuyChonNangLuc,
  suKienDungLai?: (skillId: string) => readonly SuKienNL[],
  trangThaiTruoc?: ReadonlyMap<string, TrangThaiTruoc>,
): AnhChupNangLuc {
  const moi = locSuKienSach(suKienMoi).filter((e) => e.sbd === anh.bang.sbd)
  const dirty = kyNangDirty(anh, moi)
  const tu = luiNgay(tuy.denNgay, CUA_SO_NGAY - 1)
  const kyNang = [...new Set([...Object.keys(anh.nhatKy), ...moi.flatMap((e) => e.skillIds)])].sort()

  const nhatKy: Record<string, SuKienNL[]> = {}
  for (const k of kyNang) {
    const cu = anh.nhatKy[k] ?? []
    if (dirty.has(k)) {
      // DỰNG LẠI từ SỔ. Hợp nhất thêm `moi` để KHÔNG BAO GIỜ bỏ mất sự kiện vừa tới (kể cả khi ảnh chụp
      // sổ của nơi gọi còn cũ); sổ đứng TRƯỚC nên bản trong sổ thắng khi cùng `eventId`.
      if (!suKienDungLai) throw new Error(`Kỹ năng ${k} bị đánh dấu dơ (correction/tới muộn) nhưng thiếu sổ để dựng lại.`)
      const tuSo = [...suKienDungLai(k)].filter((e) => e.sbd === anh.bang.sbd)
      nhatKy[k] = locSuKienSach([...tuSo, ...moi.filter((e) => e.skillIds.includes(k))])
      continue
    }
    const dot = anh.bang.skills.find((s) => s.skillId === k)?.dot ?? null
    const gop = locSuKienSach([...cu, ...moi.filter((e) => e.skillIds.includes(k))])
    nhatKy[k] = gop.filter((e) => nenGiuTrongDem(e, tu, dot))
  }
  const theo: SuKienTheoKyNang = new Map()
  for (const k of kyNang) if (nhatKy[k]!.length > 0) theo.set(k, nhatKy[k]!)
  const bang = tinhBangNangLuc(anh.bang.sbd, theo, tuy, trangThaiTruoc)
  bang.revision = anh.bang.revision + 1
  return { bang, nhatKy }
}

