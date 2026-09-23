// MỤC TIÊU CORE CỦA MỘT PLAN NGÀY — CNH-1.0 P05 (02 §5.2 + §6).
//
// VÌ SAO tệp này: kế hoạch ngày đang có nhiều "việc" nhưng CHƯA có MỘT MỤC TIÊU CORE có role + required_task_ids
// + min_success + policy_version + revision, và chưa có luật "mục tiêu đã chốt thì KHÔNG tăng ngầm". Tệp này
// dựng đúng hợp đồng 02 §6 để phần đạt/không đạt và phần revision của P05 có chỗ dựa:
//   · MỘT mục tiêu core chính, các việc còn lại chỉ là hỗ trợ (không tự thêm điều kiện đạt).
//   · n = số task có CƠ HỘI ĐỘC LẬP trong `requiredTaskIds`; KHÔNG đếm bài mẫu/retry/probe/câu tranh chấp bị loại.
//   · `n = 0` ⇒ `NO_VALID_CORE_TASKS`, KHÔNG bao giờ tự `achieved`.
//   · Revision chỉ đổi được phần CHƯA MỞ, phải CÓ LÝ DO, và KHÔNG làm tăng điều kiện đạt (min_success).
//   · Family: KHO THẬT CHƯA GẮN NHÃN ⇒ KHÔNG bịa family; nhánh "ít nhất 1 family xác minh" ghi rõ là CHƯA ÁP
//     được (đúng tinh thần T40 "không gán family giả"), và trả `thieuNhanFamily: true` cho giáo viên thấy.
export type RoleCore = 'maintenance' | 'consolidation' | 'repair' | 'homework_slice' | 'return'

export type TrangThaiNgay = 'achieved' | 'studied' | 'none'

/** Phiên bản chính sách mục tiêu core (đổi khi đổi công thức điều kiện đạt — ghi vào plan để nghiệm thu được). */
export const POLICY_MUC_TIEU = 'cnh1-p05-v1'

export interface MucTieuCore {
  role: RoleCore
  /** Thứ tự nhiệm vụ BẮT BUỘC của core (đây mới là mẫu số của điều kiện đạt). */
  requiredTaskIds: string[]
  /** Số đơn vị có cơ hội độc lập (đã loại bài mẫu/retry/probe/tranh chấp). */
  n: number
  /** Điều kiện đạt ĐÃ KHOÁ lúc giao (số đơn vị độc lập đúng tối thiểu). */
  minSuccess: number
  policyVersion: string
  revision: number
  /** Lý do của revision hiện tại ('' = revision gốc). */
  lyDoRevision: string
  /** Số task bị loại khỏi mẫu số kèm lý do (thầy xem được; KHÔNG lộ nội dung đề). */
  daLoai: { taskId: string; lyDo: string }[]
  /** Nhánh family chưa áp được vì kho chưa gắn nhãn (không bịa family). */
  thieuNhanFamily?: boolean
}

export interface DauVaoMucTieu {
  /** Việc ứng viên cho core theo thứ tự ưu tiên đã có của kế hoạch. */
  taskIds: readonly string[]
  /** Gián đoạn ≥ 3 ngày và người học NHẬN chặng quay lại (điều kiện `return`). */
  coChangQuayLai: boolean
  /** Có BTVN giáo viên giao đến hạn với ĐỦ nguồn câu cho một chặng. */
  coBtvnDenHanDuNguon: boolean
  /** Có episode dạy lại đang mở VÀ đủ ngân sách cho bài mẫu + kiểm tra. */
  coRepairDuNganSach: boolean
  /** Có card đến hạn (maintenance). */
  coCardDenHan: boolean
  /** Bao nhiêu task là unit ĐỘC LẬP (loại bài mẫu/retry/probe/tranh chấp) — nơi gọi đếm từ dữ liệu thật. */
  soDonViDocLap: number
  /** Task bị loại khỏi mẫu số kèm lý do (bài mẫu/retry/probe/câu sai đề bị tranh chấp…). */
  daLoai?: readonly { taskId: string; lyDo: string }[]
  /** Kho CÓ nhãn family không? (kho thật: KHÔNG ⇒ nhánh family không áp, không bịa). */
  coNhanFamily: boolean
  /** Revision đang có (giữ nguyên khi chốt lại trong cùng ngày). */
  revision?: number
}


/** Bậc điều kiện đạt tối thiểu của một role, tính từ n (đúng bảng 02 §6). */
export function minSuccessCua(role: RoleCore, n: number): number {
  if (n <= 0) return 0
  if (role === 'maintenance') return Math.ceil(0.8 * n)
  if (role === 'consolidation') return Math.ceil(0.6 * n)
  // repair/homework_slice/return: "≥1 đơn vị độc lập đúng" (phần hướng dẫn/nộp chặng do nơi gọi kiểm riêng).
  return 1
}

/**
 * Chọn role core theo ĐÚNG thứ tự 02 §6: return → homework_slice → repair → maintenance → consolidation.
 * Không chọn role khi thiếu điều kiện: thà KHÔNG có core (n=0 ⇒ `NO_VALID_CORE_TASKS`) còn hơn mục tiêu bất khả thi.
 */
export function chonRoleCore(dv: Pick<DauVaoMucTieu, 'coChangQuayLai' | 'coBtvnDenHanDuNguon' | 'coRepairDuNganSach' | 'coCardDenHan'>): RoleCore {
  if (dv.coChangQuayLai) return 'return'
  if (dv.coBtvnDenHanDuNguon) return 'homework_slice'
  if (dv.coRepairDuNganSach) return 'repair'
  if (dv.coCardDenHan) return 'maintenance'
  return 'consolidation'
}

/** Dựng mục tiêu core (điều kiện đạt KHOÁ ngay lúc giao; không tự thêm điều kiện). */
export function dungMucTieuCore(dv: DauVaoMucTieu): MucTieuCore {
  const role = chonRoleCore(dv)
  const n = Math.max(0, Math.floor(dv.soDonViDocLap))
  const mt: MucTieuCore = {
    role,
    requiredTaskIds: [...dv.taskIds],
    n,
    minSuccess: minSuccessCua(role, n),
    policyVersion: POLICY_MUC_TIEU,
    revision: Math.max(1, Math.floor(dv.revision ?? 1)),
    lyDoRevision: '',
    daLoai: [...(dv.daLoai ?? [])],
  }
  // consolidation cần "ít nhất 1 family xác minh nếu kho có family" — kho thật CHƯA gắn nhãn ⇒ ghi rõ, KHÔNG bịa.
  if (role === 'consolidation' && !dv.coNhanFamily) mt.thieuNhanFamily = true
  return mt
}

export interface KetQuaTaskCore {
  taskId: string
  /** Task này có phải đơn vị ĐỘC LẬP (bài mẫu/retry/probe/tranh chấp bị loại khỏi mẫu số). */
  docLap: boolean
  /** Đã nộp/hoàn tất (kể cả làm có trợ giúp — trợ giúp vẫn tính HOÀN THÀNH việc, không tính độc lập đúng). */
  daNop: boolean
  /** Độc lập và đúng (assisted KHÔNG vào số này). */
  docLapDung: boolean
  /** Lần làm có trợ giúp (ghi hoàn tất việc nhưng không vào số độc lập đúng — 02 §6). */
  assisted?: boolean
  /** Đang chờ giáo viên xác minh (giữ nhãn riêng, không tự tính là bằng chứng độc lập). */
  choXacMinh?: boolean
}

export interface DanhGiaCore {
  trangThai: TrangThaiNgay
  /** Số đơn vị độc lập đúng thực tế (đã trừ bài mẫu/retry/probe/tranh chấp). */
  dung: number
  n: number
  minSuccess: number
  /** Lý do máy chủ trả khi không thể xét đạt (không tự achieved). */
  lyDo?: 'NO_VALID_CORE_TASKS'
  /** Có ít nhất một bằng chứng học đã xác minh (để phân biệt `studied` với `none`). */
  coBangChungHoc: boolean
  /** Có mục đang chờ giáo viên xác minh (giữ riêng, không tính bằng chứng độc lập). */
  choXacMinh: boolean
}

function dieuKienDat(role: RoleCore, v: { daNopHet: boolean; dung: number; n: number }): boolean {
  if (role === 'maintenance') return v.daNopHet && v.dung >= Math.ceil(0.8 * v.n)
  if (role === 'consolidation') return v.daNopHet && v.dung >= Math.ceil(0.6 * v.n)
  if (role === 'homework_slice' || role === 'return') return v.daNopHet && v.dung >= 1
  return v.dung >= 1 // repair: hướng dẫn cần thiết + 1 kiểm tra biến thể độc lập đúng
}

/**
 * Đánh giá ngày theo MỤC TIÊU ĐÃ CHỐT (02 §6): chỉ phụ thuộc `requiredTaskIds` + điều kiện đã khoá.
 * `n = 0` ⇒ `NO_VALID_CORE_TASKS` và KHÔNG bao giờ `achieved` (không cấp ngày miễn phí).
 */
export function danhGiaCore(mt: MucTieuCore, ketQua: readonly KetQuaTaskCore[]): DanhGiaCore {
  const theoId = new Map(ketQua.map((k) => [k.taskId, k]))
  const trongCore = mt.requiredTaskIds.map((id) => theoId.get(id)).filter((k): k is KetQuaTaskCore => Boolean(k))
  const docLap = trongCore.filter((k) => k.docLap)
  const dung = docLap.filter((k) => k.docLapDung).length
  const daNopHet = trongCore.length > 0 && trongCore.every((k) => k.daNop)
  const coBangChungHoc = trongCore.some((k) => k.daNop || k.docLapDung)
  const choXacMinh = trongCore.some((k) => k.choXacMinh === true)
  const n = docLap.length
  if (n === 0) {
    return { trangThai: 'none', dung, n: 0, minSuccess: mt.minSuccess, lyDo: 'NO_VALID_CORE_TASKS', coBangChungHoc: false, choXacMinh }
  }
  const duDieuKien = dieuKienDat(mt.role, { daNopHet, dung, n })
  const trangThai: TrangThaiNgay = duDieuKien ? 'achieved' : coBangChungHoc ? 'studied' : 'none'
  return { trangThai, dung, n, minSuccess: mt.minSuccess, coBangChungHoc, choXacMinh }
}

/**
 * REVISION có lý do (02 §6): loại task lỗi khỏi MẪU SỐ, KHÔNG được làm tăng điều kiện đạt, và chỉ được đổi
 * phần CHƯA MỞ. `giuQuyen` = trước đó đã đạt ⇒ giữ quyền đã kiếm vì lỗi hệ thống (ghi adjustment).
 */
export function boTaskLoi(
  mt: MucTieuCore, boTaskIds: readonly string[], lyDo: string, daMoTaskIds: readonly string[] = [],
): { mucTieu: MucTieuCore; giuQuyen: boolean; chanLyDo?: 'TASK_DA_MO' | 'THIEU_LY_DO' } {
  if (!lyDo.trim()) return { mucTieu: mt, giuQuyen: false, chanLyDo: 'THIEU_LY_DO' }
  const daMo = new Set(daMoTaskIds)
  const bo = new Set(boTaskIds)
  if ([...bo].some((id) => daMo.has(id))) return { mucTieu: mt, giuQuyen: false, chanLyDo: 'TASK_DA_MO' }
  const requiredTaskIds = mt.requiredTaskIds.filter((id) => !bo.has(id))
  const n = Math.max(0, mt.n - [...bo].filter((id) => mt.requiredTaskIds.includes(id)).length)
  // Điều kiện đạt của revision mới KHÔNG được cao hơn điều kiện đã khoá.
  const minSuccess = Math.min(mt.minSuccess, minSuccessCua(mt.role, n))
  return {
    mucTieu: {
      ...mt, requiredTaskIds, n, minSuccess, revision: mt.revision + 1, lyDoRevision: lyDo.trim(),
      daLoai: [...mt.daLoai, ...[...bo].map((taskId) => ({ taskId, lyDo: lyDo.trim() }))],
    },
    giuQuyen: mt.minSuccess > 0 && mt.n > 0,
  }
}

/**
 * CARRY-OVER (quyền đã cấp): việc dồn sang ngày mới CHỈ được thay một task CHƯA MỞ cùng mục tiêu khi thời gian
 * bằng hoặc ít hơn; không thì thành việc TUỲ CHỌN — KHÔNG tự tăng mục tiêu core.
 */
export function carryOver(
  vao: { taskId: string; taskSeconds: number; cungMucTieu: boolean },
  thayThe: { taskId: string; taskSeconds: number; daMo: boolean } | null,
): { ketQua: 'thay_task' | 'tuy_chon' | 'tu_choi'; lyDo: string; boTaskId?: string } {
  if (!vao.cungMucTieu) return { ketQua: 'tuy_chon', lyDo: 'KHAC_MUC_TIEU' }
  if (!thayThe) return { ketQua: 'tuy_chon', lyDo: 'KHONG_CO_TASK_CHUA_MO' }
  if (thayThe.daMo) return { ketQua: 'tu_choi', lyDo: 'TASK_DA_MO' }
  if (thayThe.taskSeconds < vao.taskSeconds) return { ketQua: 'tu_choi', lyDo: 'TON_THOI_GIAN_HON' }
  return { ketQua: 'thay_task', lyDo: 'CUNG_MUC_TIEU_BANG_HOAC_IT_HON', boTaskId: thayThe.taskId }
}

/** Mục tiêu core đã chốt có bị ĐỔI ĐIỀU KIỆN ĐẠT không (luật "không tăng target sau khi gần xong"). */
export function doiDieuKienDat(cu: MucTieuCore, moi: MucTieuCore): boolean {
  return moi.minSuccess > cu.minSuccess || moi.n > cu.n
}
