// Gọi Apps Script Web App (doGet/doPost trong docs/apps-script-kiem-tra.gs).
// Dùng Content-Type: text/plain cho POST để tránh trình duyệt gửi preflight
// OPTIONS — Apps Script Web App không xử lý OPTIONS, preflight sẽ lỗi CORS
// nếu dùng application/json.
import type { PublicExamBank, TeacherExamSource } from '../data/examContent'
import type { AnswerRecord, IntegrityLog } from './exam-db'
import { dongBoGioMayChu } from './gio-may-chu'

/** Ngân hàng gộp CÓ đáp án (chỉ dùng nội bộ cho tính năng "xem điểm ngay"). */
export interface KeyBank {
  phanI: TeacherExamSource['phanI']
  phanII: TeacherExamSource['phanII']
  phanIII: TeacherExamSource['phanIII']
}

export interface SessionConfig {
  found: boolean
  maCa?: string
  lop?: string
  thoiGianPhut?: number
  bank?: PublicExamBank
}

async function postJson(scriptUrl: string, body: unknown): Promise<any> {
  const res = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const r = await res.json()
  // Mọi phản hồi có serverNow → hiệu chỉnh đồng hồ theo máy chủ ngay tại đây,
  // màn hình không phải nhớ gọi.
  if (r && typeof r.serverNow === 'number') dongBoGioMayChu(r.serverNow)
  return r
}

// ============================================================================
// VÀO THI — một SBD một lượt mỗi ca + 3 mốc thời gian (QUANLYCATHI.md mục 1, 3)
// ============================================================================

/** Lý do máy chủ KHÔNG cho vào (xem quyetDinhVaoThi_ trong Apps Script). */
export type LyDoChan =
  | 'khong_co_ca'
  | 'da_xoa'
  | 'da_dong'
  | 'dang_lam_may_khac'
  | 'da_nop'
  | 'chua_mo'
  | 'het_han_vao'
  | 'chua_co_ho_so'
  | 'khong_thuoc_khoi'
  | 'khong_trong_danh_sach'
  | 'thieu'

/** Phạm vi gửi ca (QUANLYCATHI mục 4): tu_do = ai có mã đều vào · khoi = theo
 * năm sinh (hồ sơ HocSinh) · chon = danh sách SBD thầy tích. Máy chủ kiểm tra. */
export type PhamViCa = 'tu_do' | 'khoi' | 'chon'

/** Khối lớp suy từ năm sinh theo năm học hiện tại (vào lớp 1 lúc 6 tuổi; năm
 * học mới tính từ tháng 9). 2010 → lớp 11 trong năm học 2026–2027. */
export function khoiTuNamSinh(namSinh: string | number, now: Date = new Date()): number | null {
  const ns = Number(namSinh)
  if (!Number.isFinite(ns) || ns < 1990 || ns > now.getFullYear()) return null
  const namHoc = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  return namHoc - ns - 5
}

export type KetQuaVaoThi =
  | {
      ok: true
      /** moi = lượt mới · khoi_phuc = mở lại cùng máy (rớt mạng) · duyet_lai = thầy đã duyệt cho thi lại */
      cach: 'moi' | 'khoi_phuc' | 'duyet_lai'
      lop: string
      thoiGianPhut: number
      congBo: CongBoDiem
      lanThu: number
      vaoLuc: string
      hetGioLuc: string
      /** Ngưỡng chống gian lận của ca (QUANLYCATHI mục 6): số lần rời màn → khoá; một lần rời quá N giây → khoá. */
      nguongLan: number
      nguongGiay: number
      /** Bài tập về nhà: không đồng hồ đếm ngược, chỉ hiện hạn nộp; nộp muộn vẫn nhận. */
      loai: LoaiCa
      hanNop: string
      tenCa: string
      /** true = thầy vừa mở khoá lượt này (máy em còn giữ cờ khoá) → bỏ khoá, làm tiếp. */
      daMoKhoa: boolean
      bank?: PublicExamBank
    }
  | { ok: false; lyDo: LyDoChan; nopLuc?: string; lanThu?: number; batDau?: string; hetHanVao?: string; namSinh?: string; error?: string }

/** Xin vào thi: máy chủ kiểm tra (mã ca, SBD, id thiết bị) rồi tạo/khôi phục
 * lượt và trả mốc giờ (vaoLuc, hetGioLuc theo giờ máy chủ). canBank=true khi
 * máy em chưa có đề trong cache → nhận luôn đề (không đáp án) trong cùng 1 lượt gọi. */
export async function vaoThi(scriptUrl: string, maCa: string, sbd: string, idThietBi: string, canBank: boolean): Promise<KetQuaVaoThi> {
  const r = await postJson(scriptUrl, { action: 'vaoThi', maCa, sbd, idThietBi, canBank })
  if (r.ok) {
    return {
      ok: true,
      cach: r.cach,
      lop: String(r.lop ?? ''),
      thoiGianPhut: Number(r.thoiGianPhut) || 45,
      congBo: r.congBo ?? 'khong',
      lanThu: Number(r.lanThu) || 1,
      vaoLuc: String(r.vaoLuc),
      hetGioLuc: String(r.hetGioLuc),
      nguongLan: Number(r.nguongLan) || 3,
      nguongGiay: Number(r.nguongGiay) || 10,
      loai: r.loai === 'baitap' ? 'baitap' : 'thi',
      hanNop: String(r.hanNop ?? ''),
      tenCa: String(r.tenCa ?? ''),
      daMoKhoa: r.daMoKhoa === true,
      bank: r.bank ?? undefined,
    }
  }
  return { ok: false, lyDo: r.lyDo ?? 'thieu', nopLuc: r.nopLuc, lanThu: r.lanThu, batDau: r.batDau, hetHanVao: r.hetHanVao, namSinh: r.namSinh, error: r.error }
}

/** Thông điệp cho học sinh khi bị chặn — nêu rõ lý do + việc cần làm, không vòng vo. */
export function thongDiepChan(kq: Extract<KetQuaVaoThi, { ok: false }>, gio: (iso: string) => string): string {
  switch (kq.lyDo) {
    case 'khong_co_ca':
      return 'Không tìm thấy ca kiểm tra — kiểm tra lại mã ca.'
    case 'da_xoa':
      return 'Ca kiểm tra này đã bị thầy xoá.'
    case 'da_dong':
      return 'Ca kiểm tra này đã đóng.'
    case 'dang_lam_may_khac':
      return 'Số báo danh này đang làm bài ở máy khác. Nếu đúng là em, mở lại trên máy đã bắt đầu; nếu không, báo thầy ngay.'
    case 'da_nop':
      return `Em đã nộp bài ca này${kq.nopLuc ? ` lúc ${gio(kq.nopLuc)}` : ''}${kq.lanThu && kq.lanThu > 1 ? ` (lần ${kq.lanThu})` : ''}. Muốn thi lại, xin thầy duyệt.`
    case 'chua_mo':
      return `Ca thi chưa mở${kq.batDau ? ` — bắt đầu lúc ${gio(kq.batDau)}` : ''}. Đợi đến giờ rồi bấm Vào thi lại.`
    case 'het_han_vao':
      return `Đã quá giờ vào phòng thi${kq.hetHanVao ? ` (hết hạn ${gio(kq.hetHanVao)})` : ''} — mã ca không còn hiệu lực.`
    case 'chua_co_ho_so':
      return `Ca này chỉ dành cho khối ${khoiTuNamSinh(kq.namSinh ?? '') ?? '?'} (sinh ${kq.namSinh}) — em chưa đăng ký hồ sơ (năm sinh). Vào mục Hồ sơ đăng ký rồi bấm Vào thi lại.`
    case 'khong_thuoc_khoi':
      return `Ca này dành cho khối ${khoiTuNamSinh(kq.namSinh ?? '') ?? '?'} (sinh ${kq.namSinh}). Số báo danh của em không thuộc khối này.`
    case 'khong_trong_danh_sach':
      return 'Ca này thầy chỉ mở cho một số em — số báo danh của em không có trong danh sách.'
    default:
      return kq.error || 'Không vào được ca thi.'
  }
}

/** Thầy MỞ KHOÁ lượt bị khoá vì rời màn (mục 6): trạng thái về dang_lam, em mở lại link trên cùng máy là làm tiếp. */
export async function moKhoa(scriptUrl: string, secret: string, maCa: string, sbd: string, nguoiMo = 'thầy'): Promise<void> {
  const r = await postJson(scriptUrl, { action: 'moKhoa', secret, maCa, sbd, nguoiMo })
  if (!r.ok) throw new Error(r.error || 'Không mở khoá được')
}

/** Thầy cho 1 em thi lại (cần mã bí mật) — máy chủ tạo lượt mới trạng thái duoc_duyet_lai. */
export async function duyetThiLai(scriptUrl: string, secret: string, maCa: string, sbd: string, nguoiDuyet = 'thầy'): Promise<number> {
  const r = await postJson(scriptUrl, { action: 'duyetThiLai', secret, maCa, sbd, nguoiDuyet })
  if (!r.ok) throw new Error(r.error || 'Không duyệt được')
  return Number(r.lanThu) || 1
}

/** Cách công bố điểm cho học sinh của 1 ca:
 * - khong: không công bố trên máy em — thầy chấm ở màn Theo dõi rồi gửi nhận xét.
 * - ngay: server trả keyBank (CÓ đáp án) ĐÚNG 1 LẦN trong response lần nộp của
 *   chính em đó (submitAnswers) — không có cách lấy đáp án trước khi nộp.
 * - ca_lop_xong: em nộp xong chỉ thấy "đang chờ cả lớp"; app tự hỏi lại
 *   (fetchKetQua) và server chỉ trả keyBank khi MỌI em đã vào thi đều đã nộp,
 *   hoặc mọi em đều đã hết giờ — tránh em nộp sớm đọc đáp án cho em đang làm.
 * Hai chế độ sau đều gửi keyBank lên máy chủ — thầy tự cân nhắc. */
export type CongBoDiem = 'khong' | 'ngay' | 'ca_lop_xong'

/** 3 mốc thời gian của ca (QUANLYCATHI.md mục 3). batDau/hetHanVao là ISO
 * tuyệt đối; rỗng = "mở ngay" (máy chủ lấy giờ của nó) / "không giới hạn giờ
 * vào". Thời lượng (phút) tính từ lúc TỪNG EM vào, không phải giờ chung. */
export interface MocThoiGianCa {
  batDau?: string
  hetHanVao?: string
  /** Số phút sau BẮT ĐẦU (tính theo giờ máy chủ) còn cho vào phòng — ưu tiên hơn hetHanVao. 0/undefined = dùng hetHanVao (rỗng = không giới hạn). */
  hanVaoPhut?: number
  tenCa?: string
  /** Phạm vi gửi ca (mục 4). khoi → danhSachMoi = năm sinh (chuỗi) · chon → danhSachMoi = mảng SBD. */
  phamVi?: PhamViCa
  danhSachMoi?: string | string[]
  /** Chống gian lận theo mức (mục 6): rời màn lần thứ N → khoá; rời quá N giây → khoá. Trống = mặc định máy chủ (3 / 30). */
  nguongLan?: number
  nguongGiay?: number
  /** BA-APP đợt 3: 'baitap' = bài tập về nhà (không đồng hồ, nộp muộn vẫn nhận,
   * xem lời giải ngay). Trống/'thi' = ca kiểm tra như cũ. */
  loai?: LoaiCa
  /** Hạn nộp bài tập (ISO). Chỉ có nghĩa với loai='baitap'. */
  hanNop?: string
}

/** Loại ca: kiểm tra hay bài tập về nhà. Dùng CHUNG mọi thứ, khác nhau bằng cờ này. */
export type LoaiCa = 'thi' | 'baitap'

export async function publishSession(
  scriptUrl: string,
  maCa: string,
  lop: string,
  thoiGianPhut: number,
  bank: PublicExamBank,
  congBoDiem: CongBoDiem = 'khong',
  keyBank?: KeyBank,
  moc: MocThoiGianCa = {},
): Promise<{ batDau: string; hetHanVao: string }> {
  const result = await postJson(scriptUrl, {
    action: 'publish',
    maCa,
    lop,
    thoiGianPhut,
    bank,
    // Cột ImmediateFeedback trên sheet: 'true' | 'false' | 'calop' (bản cũ chỉ có true/false).
    immediateFeedback: congBoDiem === 'ngay' ? true : congBoDiem === 'ca_lop_xong' ? 'calop' : false,
    keyBank: congBoDiem === 'khong' ? undefined : keyBank,
    batDau: moc.batDau || '',
    hetHanVao: moc.hetHanVao || '',
    hanVaoPhut: moc.hanVaoPhut || 0,
    tenCa: moc.tenCa || '',
    phamVi: moc.phamVi || 'tu_do',
    danhSachMoi: moc.phamVi === 'chon' ? (Array.isArray(moc.danhSachMoi) ? moc.danhSachMoi : []) : moc.phamVi === 'khoi' ? String(moc.danhSachMoi ?? '') : '',
    loai: moc.loai || 'thi',
    hanNop: moc.hanNop || '',
    nguongLan: moc.nguongLan || 0,
    nguongGiay: moc.nguongGiay || 0,
  })
  if (!result.ok) throw new Error(result.error || 'Mở ca kiểm tra thất bại')
  return { batDau: String(result.batDau || ''), hetHanVao: String(result.hetHanVao || '') }
}

/** Cập nhật bản CÓ đáp án + lời giải của một ca ĐÃ MỞ (thầy chốt đáp án, hoặc
 * lời giải mới về máy) — học sinh xem lại thấy bản mới. Cần mã bí mật. */
export async function capNhatKeyBank(scriptUrl: string, secret: string, maCa: string, keyBank: KeyBank): Promise<CongBoDiem> {
  const r = await postJson(scriptUrl, { action: 'capNhatKeyBank', secret, maCa, keyBank })
  if (!r.ok) throw new Error(r.error || 'Không cập nhật được ca ' + maCa)
  return r.congBo
}

/** Kết quả hỏi lại sau khi nộp (chế độ ca_lop_xong, hoặc mở lại app sau khi
 * đã nộp): sanSang=true kèm keyBank khi đã được phép xem. */
export interface KetQuaCongBo {
  congBo: CongBoDiem
  sanSang: boolean
  daNop: number
  daVao: number
  keyBank: KeyBank | null
}

export async function fetchKetQua(scriptUrl: string, maCa: string, sbd: string): Promise<KetQuaCongBo> {
  const url = `${scriptUrl}?action=ketQua&maCa=${encodeURIComponent(maCa)}&sbd=${encodeURIComponent(sbd)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const r = await res.json()
  if (!r.ok) throw new Error(r.error || 'Không hỏi được kết quả')
  return { congBo: r.congBo, sanSang: !!r.sanSang, daNop: r.daNop ?? 0, daVao: r.daVao ?? 0, keyBank: r.keyBank ?? null }
}

export async function fetchSession(scriptUrl: string, maCa: string): Promise<SessionConfig> {
  const url = `${scriptUrl}?action=session&maCa=${encodeURIComponent(maCa)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  return res.json()
}

export async function submitAnswers(
  scriptUrl: string,
  maCa: string,
  sbd: string,
  maDe: string,
  dapAn: AnswerRecord,
  integrity: IntegrityLog,
  lanThu = 1,
  idThietBi = '',
  giayCau?: Record<string, number>,
): Promise<{ keyBank: KeyBank | null; congBo: CongBoDiem }> {
  const result = await postJson(scriptUrl, { action: 'submit', maCa, sbd, maDe, dapAn, integrity, lanThu, idThietBi, giayCau })
  if (!result.ok) throw new Error(result.error || 'Nộp bài thất bại')
  return { keyBank: result.keyBank ?? null, congBo: result.congBo ?? (result.keyBank ? 'ngay' : 'khong') }
}

/** Trạng thái 1 lượt thi trên máy chủ (sheet LuotThi). */
export type TrangThaiLuot = 'dang_lam' | 'da_nop' | 'khoa' | 'duoc_duyet_lai'

export interface SubmissionRow {
  sbd: string
  hoTen?: string
  maDe: string
  /** Lượt thứ mấy của em trong ca (thi lại = 2, 3…). Bản cũ không có → 1. */
  lanThu?: number
  trangThai?: TrangThaiLuot
  vaoLuc?: string
  hetGioLuc?: string
  thoiGianNop: string
  dapAn: AnswerRecord | null
  integrity?: IntegrityLog | null
  ghiChu?: string
  duyetBoi?: string
  /** Giây làm từng câu (qid → giây) em gửi lúc nộp — mục 5. */
  giayCau?: Record<string, number> | null
  /** Điểm đã ghi trên máy chủ (ghiDiem / sendFeedback) — null nếu chưa. */
  tong?: number | null
}

/** Lượt MỚI NHẤT của mỗi SBD trong ca — mọi trạng thái (đang làm, đã nộp, bị
 * khoá, đã duyệt thi lại). Màn Theo dõi tự lọc đã nộp để chấm. */
export async function listSubmissions(scriptUrl: string, maCa: string): Promise<SubmissionRow[]> {
  const url = `${scriptUrl}?action=listSubmissions&maCa=${encodeURIComponent(maCa)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const data = await res.json()
  if (typeof data.serverNow === 'number') dongBoGioMayChu(data.serverNow)
  return (data.rows || []).map((r: SubmissionRow) => ({ ...r, lanThu: Number(r.lanThu) || 1, trangThai: r.trangThai || 'da_nop' }))
}

// ============================================================================
// PHỤ HUYNH — đăng ký, xem nhận xét sau khi nộp, theo dõi làm bài thời gian thực
// ============================================================================

export interface ParentFeedbackItem {
  maCa: string
  maDe: string
  thoiGianNop: string
  diem: number
  xepLoai: string
  cauSai: string // JSON stringify {phanI:number[], phanII:number[], phanIII:number[]}
}

export interface ParentFeedbackResult {
  found: boolean
  sdt?: string
  hoTenPhuHuynh?: string
  sbd?: string
  lop?: string
  hoTenHocSinh?: string
  items?: ParentFeedbackItem[]
}

export async function sendParentFeedback(
  scriptUrl: string,
  sbd: string,
  maCa: string,
  maDe: string,
  thoiGianNop: string,
  diem: number,
  xepLoai: string,
  cauSai: { phanI: number[]; phanII: number[]; phanIII: number[] },
  diemPhan?: { I: number; II: number; III: number },
): Promise<void> {
  const result = await postJson(scriptUrl, { action: 'sendFeedback', sbd, maCa, maDe, thoiGianNop, diem, xepLoai, cauSai, diemPhan })
  if (!result.ok) throw new Error(result.error || 'Gửi nhận xét thất bại')
}

/** Học sinh tự động gửi lên định kỳ trong lúc làm bài + ngay mỗi lần rời màn
 * hình, để phụ huynh xem gần-thời-gian-thực và nhận cảnh báo rời màn hình
 * sớm nhất có thể (không phải push thật, phụ huynh tự poll lại). */
export async function pushExamStatus(
  scriptUrl: string,
  status: {
    sbd: string
    maCa: string
    lop: string
    dangLam: boolean
    batDauLuc: string
    daLamCauHoi: number
    tongCauHoi: number
    soLanRoiApp: number
    blocked: boolean
  },
): Promise<void> {
  try {
    await postJson(scriptUrl, { action: 'examStatus', ...status })
  } catch {
    // Cập nhật trạng thái theo dõi không phải luồng chính — mất mạng thì bỏ
    // qua, không chặn học sinh làm bài, lần đẩy tiếp theo sẽ tự bù.
  }
}

export interface ParentStatus {
  found: boolean
  hoTenHocSinh?: string
  sbd?: string
  status: {
    maCa: string
    lop: string
    dangLam: boolean
    batDauLuc: string
    daLamCauHoi: number
    tongCauHoi: number
    soLanRoiApp: number
    blocked: boolean
    capNhatLuc: string
  } | null
}

/** Xoá đăng ký phụ huynh (theo SĐT) — dùng khi đăng ký nhầm, cho đăng ký lại từ đầu. */
export async function deleteParentRegistration(scriptUrl: string, secret: string, sdt: string): Promise<void> {
  const result = await postJson(scriptUrl, { action: 'deleteParent', secret, sdt })
  if (!result.ok) throw new Error(result.error || 'Xoá đăng ký thất bại')
}

// ============================================================================
// HỌC SINH — đăng ký hồ sơ 1 lần (SBD + họ tên + năm sinh), dùng để tự điền
// sẵn SBD lúc vào thi và để nhắn tin cho thầy có tên hiển thị rõ ràng.
// ============================================================================

export interface StudentProfile {
  found: boolean
  sbd?: string
  hoTen?: string
  namSinh?: string
  lop?: string
}

/** Xoá đăng ký hồ sơ học sinh (theo SBD) — dùng khi đăng ký nhầm, cho đăng ký lại từ đầu. */
export async function deleteStudentRegistration(scriptUrl: string, secret: string, sbd: string): Promise<void> {
  const result = await postJson(scriptUrl, { action: 'deleteStudent', secret, sbd })
  if (!result.ok) throw new Error(result.error || 'Xoá đăng ký thất bại')
}

// ============================================================================
// TIN NHẮN PHỤ HUYNH/HỌC SINH ↔ THẦY — nhắn trực tiếp qua app, thầy xem chung 1 hộp thư
// ============================================================================

/** Học sinh nhắn tin cho thầy — hiển thị tên theo đúng cấu trúc hồ sơ đã đăng
 * ký ("Năm sinh - Họ Tên Học Sinh"), để thầy phân biệt được với tin nhắn phụ huynh. */
export async function sendStudentMessage(scriptUrl: string, sbd: string, hoTenHienThi: string, lop: string, noiDung: string): Promise<void> {
  const result = await postJson(scriptUrl, {
    action: 'sendMessage',
    sdt: '',
    hoTenPhuHuynh: '',
    sbd,
    lop,
    hoTenHocSinh: hoTenHienThi,
    noiDung,
    nguoiGui: 'hocsinh',
  })
  if (!result.ok) throw new Error(result.error || 'Gửi tin nhắn thất bại')
}

export interface ParentMessage {
  id: string
  sdt: string
  hoTenPhuHuynh: string
  sbd: string
  lop: string
  hoTenHocSinh: string
  noiDung: string
  thoiGian: string
  daDoc: boolean
  nguoiGui: 'phuhuynh' | 'hocsinh'
}

export async function listParentMessages(scriptUrl: string, secret: string): Promise<ParentMessage[]> {
  const url = `${scriptUrl}?action=listMessages&secret=${encodeURIComponent(secret)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const data = await res.json()
  return data.items || []
}

export async function markMessagesRead(scriptUrl: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const result = await postJson(scriptUrl, { action: 'markMessagesRead', ids })
  if (!result.ok) throw new Error(result.error || 'Đánh dấu đã đọc thất bại')
}

// ============================================================================
// TIN NHẮN THẦY → PHỤ HUYNH/HỌC SINH (chiều ngược lại) — thầy chọn đúng 1 em
// theo SBD (không suy đoán/khớp mờ tên) rồi gửi, phụ huynh/học sinh của em đó
// tự poll lại thấy tin.
// ============================================================================

export async function sendTeacherMessage(scriptUrl: string, secret: string, sbd: string, noiDung: string): Promise<void> {
  const result = await postJson(scriptUrl, { action: 'sendTeacherMessage', secret, sbd, noiDung })
  if (!result.ok) throw new Error(result.error || 'Gửi tin nhắn thất bại')
}

export interface TeacherMessage {
  id: string
  sbd: string
  noiDung: string
  thoiGian: string
  daXem: boolean
}

// ============================================================================
// QUẢN LÝ ĐĂNG KÝ (chỉ thầy dùng) — xem + xoá phụ huynh/học sinh đã đăng ký.
// Phụ huynh/học sinh KHÔNG có nút tự xoá trong app của họ — đăng ký xong là
// cố định, chỉ thầy xoá được ở màn này để cho đăng ký lại.
// ============================================================================

export interface RegisteredParent {
  sdt: string
  hoTenPhuHuynh: string
  sbd: string
  lop: string
  hoTenHocSinh: string
  dangKyLuc: string
  token?: string
  trangThai?: string
}

export async function listRegisteredParents(scriptUrl: string, secret: string): Promise<RegisteredParent[]> {
  const url = `${scriptUrl}?action=listParents&secret=${encodeURIComponent(secret)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const data = await res.json()
  return data.items || []
}

export interface RegisteredStudent {
  sbd: string
  hoTen: string
  namSinh: string
  lop: string
  dangKyLuc: string
  sdt?: string
  sdtPhuHuynh?: string
  token?: string
  trangThai?: string
}

export async function listRegisteredStudents(scriptUrl: string, secret: string): Promise<RegisteredStudent[]> {
  const url = `${scriptUrl}?action=listStudents&secret=${encodeURIComponent(secret)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const data = await res.json()
  return data.items || []
}

export interface FeedbackSummary {
  sbd: string
  maCa: string
  maDe: string
  thoiGianNop: string
  diem: number
  xepLoai: string
}

/** Toàn bộ điểm đã chấm — dùng để thầy tra nhanh theo tên rồi gửi lại cho phụ huynh. */
export async function listAllFeedback(scriptUrl: string, secret: string): Promise<FeedbackSummary[]> {
  const url = `${scriptUrl}?action=listAllFeedback&secret=${encodeURIComponent(secret)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const data = await res.json()
  return data.items || []
}

// ============================================================================
// BA VAI TRÒ — TOKEN & DUYỆT HỒ SƠ (BA-APP.md đợt 1)
// Máy em/phụ huynh vào bằng link riêng /hs/<token> · /ph/<token>. Máy chủ tra
// token ra SBD; app KHÔNG bao giờ tự khai mình là SBD nào.
// ============================================================================

export interface HoSoHocSinhToken {
  ok: boolean
  found: boolean
  sbd?: string
  hoTen?: string
  namSinh?: string
  lop?: string
  trangThai?: string
  error?: string
}

export interface HoSoPhuHuynhToken {
  ok: boolean
  found: boolean
  sdt?: string
  hoTenPhuHuynh?: string
  sbd?: string
  lop?: string
  hoTenHocSinh?: string
  trangThai?: string
  error?: string
}

export type LoaiHoSo = 'hs' | 'ph'

export interface HoSoChoDuyet {
  hocSinh: RegisteredStudent[]
  phuHuynh: RegisteredParent[]
}

/** Danh sách hồ sơ (cả chờ duyệt lẫn đã duyệt) — chỉ thầy gọi được. */
export async function danhSachChoDuyet(scriptUrl: string, secret: string): Promise<HoSoChoDuyet> {
  const r = await postJson(scriptUrl, { action: 'danhSachChoDuyet', secret })
  if (!r.ok) throw new Error(r.error || 'Không lấy được danh sách hồ sơ')
  return { hocSinh: (r.hocSinh || []).map((x: RegisteredStudent) => ({ ...x, sbd: String(x.sbd) })), phuHuynh: (r.phuHuynh || []).map((x: RegisteredParent) => ({ ...x, sdt: String(x.sdt), sbd: String(x.sbd) })) }
}

/** Thầy duyệt hồ sơ → máy chủ cấp token, trả về đuôi link riêng ("hs/<token>"). */
export async function duyetHoSo(scriptUrl: string, secret: string, loai: LoaiHoSo, khoa: string): Promise<{ token: string; duong: string }> {
  const r = await postJson(scriptUrl, { action: 'duyetHoSo', secret, loai, khoa })
  if (!r.ok) throw new Error(r.error || 'Không duyệt được hồ sơ')
  return { token: String(r.token), duong: String(r.duong) }
}

/** Cấp lại token (mất máy, lộ link) — token cũ mất hiệu lực ngay lập tức. */
export async function capLaiToken(scriptUrl: string, secret: string, loai: LoaiHoSo, khoa: string): Promise<{ token: string; duong: string }> {
  const r = await postJson(scriptUrl, { action: 'capLaiToken', secret, loai, khoa })
  if (!r.ok) throw new Error(r.error || 'Không cấp lại được link')
  return { token: String(r.token), duong: String(r.duong) }
}

/** Thu hồi quyền vào mà giữ nguyên hồ sơ và điểm (em nghỉ học, đăng ký nhầm). */
export async function huyDuyetHoSo(scriptUrl: string, secret: string, loai: LoaiHoSo, khoa: string): Promise<void> {
  const r = await postJson(scriptUrl, { action: 'huyDuyet', secret, loai, khoa })
  if (!r.ok) throw new Error(r.error || 'Không thu hồi được')
}

// ============================================================================
// HỒ SƠ HỌC SINH (BA-APP.md đợt 2) — chuyên đề mạnh/yếu + lịch sử ca thi.
// Máy chủ tổng hợp sẵn (TienDoHS/TienDoCa) nên một lệnh là đủ.
// ============================================================================

export type XuHuong = 'tot' | 'xau' | 'deu' | 'chua_du'

export interface ChuyenDeEm {
  ten: string
  soCau: number
  soSai: number
  tiLeSai: number
  xuHuong: XuHuong
}

export interface CaCuaEm {
  maCa: string
  tenCa: string
  lop: string
  lanThu: number
  nopLuc: string
  trangThai: string
  diemI: number | null
  diemII: number | null
  diemIII: number | null
  tong: number | null
  hang: number | null
  siSo: number | null
  soLanRoiMan: number
}

export interface HoSoEm {
  em: { sbd: string; hoTen: string; namSinh: string; lop: string }
  /** Chuyên đề CỘNG DỒN mọi ca — dùng cho bảng mạnh/yếu. */
  chuyenDe: ChuyenDeEm[]
  ca: CaCuaEm[]
  /** Ca gần nhất ĐÃ CHẤM (null nếu chưa có) — phiếu gửi phụ huynh dùng số của
   * riêng ca này, không dùng số cộng dồn. */
  caGanNhat: CaCuaEm | null
  chuyenDeCaGanNhat: { ten: string; soCau: number; soSai: number }[]
  soCauSaiCaGanNhat: number
}

/** Ai gọi: thầy (secret + sbd) · em (tokenHS) · phụ huynh (tokenPH). */
export interface QuyenHoSo {
  secret?: string
  sbd?: string
  tokenHS?: string
  tokenPH?: string
}

export async function hoSoEm(scriptUrl: string, quyen: QuyenHoSo): Promise<HoSoEm> {
  const r = await postJson(scriptUrl, { action: 'hoSoEm', ...quyen })
  if (!r.ok) throw new Error(r.error || 'Không lấy được hồ sơ')
  return {
    em: { ...r.em, sbd: String(r.em.sbd) },
    chuyenDe: r.chuyenDe || [],
    ca: (r.ca || []).map((c: CaCuaEm) => ({ ...c, maCa: String(c.maCa) })),
    caGanNhat: r.caGanNhat ? { ...r.caGanNhat, maCa: String(r.caGanNhat.maCa) } : null,
    chuyenDeCaGanNhat: r.chuyenDeCaGanNhat || [],
    soCauSaiCaGanNhat: Number(r.soCauSaiCaGanNhat) || 0,
  }
}

export interface EmTomTat {
  sbd: string
  hoTen: string
  namSinh: string
  lop: string
  trangThai: string
  coLinkRieng: boolean
  soCa: number
  diemGanNhat: number | null
  caGanNhat: string
  nopGanNhat: string
}

export async function danhSachEm(scriptUrl: string, secret: string): Promise<EmTomTat[]> {
  const r = await postJson(scriptUrl, { action: 'danhSachEm', secret })
  if (!r.ok) throw new Error(r.error || 'Không lấy được danh sách học sinh')
  return (r.items as EmTomTat[]).map((x) => ({ ...x, sbd: String(x.sbd) }))
}

// ============================================================================
// BÀI TẬP VỀ NHÀ (BA-APP.md đợt 3) — là một CA loại 'baitap', giao đích danh.
// ============================================================================

/** Trạng thái bài tập nhìn từ phía em. */
export type TrangThaiBaiTap = 'chua_lam' | 'dang_lam' | 'da_nop' | 'qua_han'

export interface BaiTapCuaEm {
  maCa: string
  tenCa: string
  giaoLuc: string
  hanNop: string
  trangThai: TrangThaiBaiTap
  nopLuc: string
  tong: number | null
}

/** Bài tập của một em. Quyền: tokenHS (em) · tokenPH (phụ huynh) · secret+sbd (thầy). */
export async function baiTapCuaEm(scriptUrl: string, quyen: QuyenHoSo): Promise<BaiTapCuaEm[]> {
  const r = await postJson(scriptUrl, { action: 'baiTapCuaEm', ...quyen })
  if (!r.ok) throw new Error(r.error || 'Không lấy được danh sách bài tập')
  return (r.items as BaiTapCuaEm[]).map((x) => ({ ...x, maCa: String(x.maCa) }))
}

/** Tập câu em ĐÃ từng làm — để rút bài tập tránh câu cũ (chỉ thầy gọi được). */
export async function qidDaLam(scriptUrl: string, secret: string, sbd: string): Promise<string[]> {
  const r = await postJson(scriptUrl, { action: 'qidDaLam', secret, sbd })
  if (!r.ok) throw new Error(r.error || 'Không lấy được danh sách câu đã làm')
  return (r.qids as string[]).map(String)
}

// ============================================================================
// YÊU CẦU GIAO BÀI (BA-APP.md đợt 4) — phụ huynh bấm "Đồng ý giao bài" trên
// phiếu kết quả; MÁY THẦY là nơi rút câu nên yêu cầu nằm chờ ở máy chủ cho tới
// khi máy thầy mở app (kho đề nằm trong Drive, Apps Script đọc rất chậm).
// ============================================================================

export interface YeuCauGiaoBai {
  id: string
  sbd: string
  hoTen: string
  chuyenDe: string[]
  soCau: number
  taoLuc: string
  taoBoi: string
  trangThai: 'cho' | 'xong' | 'huy'
  maCa: string
}

export async function danhSachYeuCau(scriptUrl: string, secret: string, tatCa = false): Promise<YeuCauGiaoBai[]> {
  const r = await postJson(scriptUrl, { action: 'danhSachYeuCau', secret, tatCa })
  if (!r.ok) throw new Error(r.error || 'Không lấy được hàng chờ giao bài')
  return (r.items as YeuCauGiaoBai[]).map((x) => ({ ...x, sbd: String(x.sbd) }))
}

export async function danhDauYeuCau(scriptUrl: string, secret: string, id: string, trangThai: 'xong' | 'huy', maCa = ''): Promise<void> {
  const r = await postJson(scriptUrl, { action: 'danhDauYeuCau', secret, id, trangThai, maCa })
  if (!r.ok) throw new Error(r.error || 'Không cập nhật được yêu cầu')
}

// ---------------------------------------------------------------------------
// KHO ĐỀ trên Apps Script (NAPDETUDONG.md, hướng A): pipeline "Nạp đề mới"
// đẩy đề đầy đủ (đáp án + lời giải + ảnh) lên đây bằng MÃ BÍ MẬT; app trên
// máy thầy tự tải về ngân hàng. Mã bí mật thầy nhập 1 lần, lưu IndexedDB máy
// thầy (không nhúng trong code). Tất cả đi qua POST để mã không lọt vào URL.
// ---------------------------------------------------------------------------
export interface KhoDeItem {
  maDe: string
  nguon: string
  ngayNap: string
  soCau: number
  soNghi: number
  capNhatLuc: string
  /** Nhóm đề (thư mục con trong kho-de/moi/) — rỗng nếu không có. */
  nhom?: string
}

export async function danhSachDe(scriptUrl: string, secret: string): Promise<KhoDeItem[]> {
  const r = await postJson(scriptUrl, { action: 'danhSachDe', secret })
  if (!r.ok) throw new Error(r.error || 'Không lấy được danh sách đề')
  return (r.items as KhoDeItem[]).map((x) => ({ ...x, maDe: String(x.maDe), ngayNap: String(x.ngayNap ?? ''), nguon: String(x.nguon ?? '') }))
}

/** Trả về JSON đề nguyên dạng pipeline đã đẩy (khuôn KhoDeJson, xem exam-kho-de-import.ts). */
export async function layDe(scriptUrl: string, secret: string, maDe: string): Promise<unknown> {
  const r = await postJson(scriptUrl, { action: 'layDe', secret, maDe })
  if (!r.ok) throw new Error(r.error || `Không lấy được đề ${maDe}`)
  return r.de
}

export async function luuDe(scriptUrl: string, secret: string, de: unknown): Promise<{ maDe: string; soCau: number; soNghi: number }> {
  const r = await postJson(scriptUrl, { action: 'luuDe', secret, de })
  if (!r.ok) throw new Error(r.error || 'Đẩy đề thất bại')
  return { maDe: String(r.maDe), soCau: Number(r.soCau), soNghi: Number(r.soNghi) }
}

export async function xoaDe(scriptUrl: string, secret: string, maDe: string): Promise<void> {
  const r = await postJson(scriptUrl, { action: 'xoaDe', secret, maDe })
  if (!r.ok) throw new Error(r.error || 'Xoá đề thất bại')
}

// ============================================================================
// LỊCH SỬ CA THI + CHI TIẾT + XOÁ MỀM + GHI ĐIỂM/CHI TIẾT CÂU (QUANLYCATHI 2, 5)
// Tất cả cần MA_BI_MAT (máy thầy); ghiDiem chấp nhận thêm idThietBi của chính lượt (máy em).
// ============================================================================

export interface CaTomTat {
  maCa: string
  tenCa: string
  lop: string
  thoiGianPhut: number
  moLuc: string
  batDau: string
  hetHanVao: string
  trangThai: 'mo' | 'dong' | 'da_xoa'
  phamVi: PhamViCa
  congBo: CongBoDiem
  /** 'baitap' = bài tập về nhà (BA-APP đợt 3). Ca cũ không có cột này → 'thi'. */
  loai: LoaiCa
  hanNop: string
  /** Thời điểm bị xoá mềm (chỉ có khi lấy danh sách ca đã xoá). */
  xoaLuc?: string
  daVao: number
  daNop: number
  canhBao: number
}

/** daXoa = true → lấy các ca ĐÃ XOÁ (thùng rác) thay vì ca đang dùng. */
export async function danhSachCa(scriptUrl: string, secret: string, daXoa = false): Promise<CaTomTat[]> {
  const r = await postJson(scriptUrl, { action: 'danhSachCa', secret, daXoa })
  if (!r.ok) throw new Error(r.error || 'Không lấy được danh sách ca')
  return (r.items as CaTomTat[]).map((c) => ({ ...c, maCa: String(c.maCa), lop: String(c.lop ?? ''), tenCa: String(c.tenCa ?? ''), loai: c.loai === 'baitap' ? 'baitap' : 'thi', hanNop: String(c.hanNop ?? '') }))
}

export interface LuotThiRow {
  sbd: string
  hoTen: string
  lanThu: number
  trangThai: TrangThaiLuot
  vaoLuc: string
  hetGioLuc: string
  nopLuc: string
  soLanRoiMan: number
  tongGiayRoiMan: number
  diemI: number | null
  diemII: number | null
  diemIII: number | null
  tong: number | null
  duyetBoi: string
  duyetLuc: string
  ghiChu: string
  dapAn: AnswerRecord | null
  integrity: IntegrityLog | null
  giayCau: Record<string, number> | null
}

export interface ChiTietCa {
  ca: Omit<CaTomTat, 'daVao' | 'daNop' | 'canhBao'> & { danhSachMoi: string | string[]; nguoiTao: string; nguongLan?: number; nguongGiay?: number }
  luot: LuotThiRow[]
}

export async function chiTietCa(scriptUrl: string, secret: string, maCa: string): Promise<ChiTietCa> {
  const r = await postJson(scriptUrl, { action: 'chiTietCa', secret, maCa })
  if (!r.ok) throw new Error(r.error || 'Không lấy được chi tiết ca')
  return { ca: { ...r.ca, maCa: String(r.ca.maCa), lop: String(r.ca.lop ?? '') }, luot: (r.luot as LuotThiRow[]).map((l) => ({ ...l, sbd: String(l.sbd), lanThu: Number(l.lanThu) || 1 })) }
}

/** Xoá MỀM một ca — phải gõ lại đúng mã ca (xacNhan). Bài làm/điểm giữ nguyên trên Sheet. */
export async function xoaCa(scriptUrl: string, secret: string, maCa: string, xacNhan: string): Promise<void> {
  const r = await postJson(scriptUrl, { action: 'xoaCa', secret, maCa, xacNhan })
  if (!r.ok) throw new Error(r.error || 'Không xoá được ca')
}

/** Khôi phục một ca đã xoá mềm — bài làm vẫn còn nguyên nên lấy lại được. */
export async function khoiPhucCa(scriptUrl: string, secret: string, maCa: string): Promise<void> {
  const r = await postJson(scriptUrl, { action: 'khoiPhucCa', secret, maCa })
  if (!r.ok) throw new Error(r.error || 'Không khôi phục được ca')
}

/** Kết quả xoá hàng loạt: ca nào xoá được, ca nào không kèm lý do. */
export interface KetQuaXoaNhieu {
  ok: string[]
  loi: { maCa: string; loi: string }[]
}

/** Xoá MỀM nhiều ca một lượt. Gọi tuần tự (Apps Script ghi Sheet, chạy song song
 * dễ chèn nhau); mỗi ca tự lấy mã của nó làm xacNhan vì thầy đã tích chọn ca đó
 * trên màn hình. Một ca lỗi KHÔNG chặn các ca còn lại. */
export async function xoaNhieuCa(scriptUrl: string, secret: string, dsMaCa: string[]): Promise<KetQuaXoaNhieu> {
  const kq: KetQuaXoaNhieu = { ok: [], loi: [] }
  for (const maCa of dsMaCa) {
    try {
      await xoaCa(scriptUrl, secret, maCa, maCa)
      kq.ok.push(maCa)
    } catch (e) {
      kq.loi.push({ maCa, loi: e instanceof Error ? e.message : 'lỗi không rõ' })
    }
  }
  return kq
}

/** Một dòng ChiTietCau (mục 5). soCau = số thứ tự em nhìn thấy (1..n trong phần). */
export interface ChiTietCauRow {
  phan: 'I' | 'II' | 'III'
  soCau: number
  qid: string
  chuyenDe: string
  mucDo: string
  dapAnChon: string
  dapAnDung: string
  dungSai: boolean | null
  giay: number | null
}

export interface BaiGhiDiem {
  sbd: string
  lanThu: number
  idThietBi?: string
  diem: { I: number; II: number; III: number; tong: number }
  cau: ChiTietCauRow[]
}

/** Ghi điểm + chi tiết từng câu cho nhiều lượt trong 1 lần gọi (máy thầy: secret;
 * máy em: secret rỗng + idThietBi của lượt). Trả về SBD đã ghi / bị từ chối. */
export async function ghiDiem(scriptUrl: string, secret: string, maCa: string, bai: BaiGhiDiem[]): Promise<{ daGhi: string[]; tuChoi: string[] }> {
  if (bai.length === 0) return { daGhi: [], tuChoi: [] }
  const r = await postJson(scriptUrl, { action: 'ghiDiem', secret, maCa, bai })
  if (!r.ok) throw new Error(r.error || 'Không ghi được điểm')
  return { daGhi: r.daGhi ?? [], tuChoi: r.tuChoi ?? [] }
}
