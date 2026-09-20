// DỌN BỘ NHỚ TRONG MÁY KHI MÁY CHỦ ĐẶT LẠI MÙA. Phạm vi reset THẦY CHỐT LẠI 21/09: máy chủ chỉ xoá BTVN, bài Mẹ giao, luyện đề, kế hoạch ngày,
// game/thần thú/EXP, vinh danh, bảng tin; GIỮ toàn bộ ca thi + hồ sơ + tài khoản. Máy học sinh/phụ huynh chỉ dọn bản nhớ của phần ĐÃ XOÁ:
// để nguyên thì hiện thần thú/EXP/bài cũ, hoặc gửi bài làm dở của BTVN không còn (bị từ chối). Phần thuộc CA THI (`ddh.lam.*` bài làm dở/chờ gửi
// của phiếu, `ddh.khacphuc.history.*` lịch sử khắc phục, `ddh.xemlai.*` dấu "Xem lại sau" của màn thi) KHÔNG dọn — ca còn thì bản nhớ còn có nghĩa.
//
// LUẬT (0.Planer duyệt bảng DỌN/GIỮ 19/09):
//  · Máy chủ báo `mocReset` = chuỗi "YYYY-MM-DD" trong /hs/ke-hoach-ngay và /hs/ca-dang-mo. VẮNG/RỖNG/SAI KIỂU ⇒ KHÔNG LÀM GÌ (máy chủ
//    chưa chạy xong job reset; nếu dọn sớm là xoá nháp của học sinh ngay tối Chủ nhật).
//  · Mốc ≠ mốc đã lưu (`ddh.mocReset`; chưa có = máy chưa từng thấy mốc) và không cũ hơn mốc đã lưu ⇒ dọn rồi lưu mốc. Chạy lần hai với cùng
//    mốc ⇒ không làm gì.
//  · CHỈ dọn theo danh sách dưới. GIỮ phiên đăng nhập, id thiết bị, cài đặt giao diện. KHÔNG bao giờ dọn `ddh_id_thiet_bi` (máy chủ dựa vào
//    đó cho "một SBD một lượt mỗi ca"), cũng KHÔNG đụng IndexedDB `omr-exam` (khoá bằng mã ca; máy chủ giữ danh sách mã ca đã dùng để không cấp lại).
//  · Không tải lại trang, không ném lỗi: storage bị chặn/đầy thì bỏ qua từng khoá. Chỉ được gọi từ lớp gọi máy chủ của HAI CỔNG học sinh/phụ huynh
//    (may-chu.ts) — app giáo viên và màn thi không bao giờ gọi.

export const KHOA_MOC_RESET = 'ddh.mocReset'

/** localStorage — dữ liệu học sinh theo SBD/ca/bài (server đã xoá). Khớp theo TIỀN TỐ. */
export const TIEN_TO_LOCAL_DON: readonly string[] = [
  'omr_bnv_ke_hoach:', // bản nhớ kế hoạch ngày của Bảng nhiệm vụ
  'omr_cauon:', // nháp màn Ôn câu
  'omr_mom_draft_', // nháp bài Mẹ giao
  'omr_mom_btvn_', // bản nhớ BTVN của Mom
  'omr_mom_sent_', // phụ huynh: bài Mom đã gửi
  'ddh.btvn.draft.', // nháp BTVN
  'ddh.luyen2026.', // luyện đề chuẩn
]

/** localStorage — khoá đơn lẻ cần dọn (V1 game cũ lưu thú/EXP cục bộ; lịch sử trò chuyện trợ lý nhắc tới bài đã xoá). */
export const KHOA_LOCAL_DON: readonly string[] = ['omr_than_thu_hoa_hoc_data', 'omr_than_thu_da_nhan_exp', 'omr_than_thu_qid_thanh_tay', 'omr_he_thong_chat_v2']

/** sessionStorage — trạng thái game đang chạy (chỉ sống tới khi đóng tab). */
export const TIEN_TO_SESSION_DON: readonly string[] = ['game-v2:', 'game-room:', 'escort:']

/** BẢO HIỂM CUỐI: dù một tiền tố nào đó sau này lỡ khớp, các khoá này KHÔNG BAO GIỜ bị xoá. */
export const KHOA_LOCAL_GIU: readonly string[] = [
  'omr_student_portal_auth', // phiên đăng nhập học sinh
  'omr_ph_sbd', // SBD con của phụ huynh
  'ddh_id_thiet_bi', // máy chủ dựa vào đây: "một SBD một lượt mỗi ca", khôi phục bài đang thi
  'ddh.vai',
  'ddh.boQuaCaiApp',
  'ddh.phienBanDuLieu',
  'ddh.phieu.mau',
  'omr.settings.v1',
  'omr_msgfab_pos_v1',
  'rongBenTrai',
  'game-v2-low',
  'game-battle-quiet',
  'game-battle-muted',
  'omr_than_thu_khong_3d',
  'omr_gemini_key',
  'mc-projector-palette',
  'mc-projector-scale',
  KHOA_MOC_RESET,
]
export const KHOA_SESSION_GIU: readonly string[] = ['omr_presence_session']

const KIEU_MOC = /^\d{4}-\d{2}-\d{2}$/

/** Đã dọn cho mốc nào trong phiên trang này (phòng khi ghi được mốc vào storage bị chặn ⇒ khỏi dọn lặp mỗi 60 s). */
let motDaDon: string | null = null

function lietKe(kho: Storage): string[] {
  const ds: string[] = []
  try {
    for (let i = 0; i < kho.length; i++) {
      const k = kho.key(i)
      if (k !== null) ds.push(k)
    }
  } catch {
    /* storage hỏng: coi như rỗng */
  }
  return ds
}

function xoaTheo(kho: Storage, khoa: readonly string[], tienTo: readonly string[], giu: readonly string[]): number {
  let n = 0
  for (const k of lietKe(kho)) {
    if (giu.includes(k)) continue
    if (khoa.includes(k) || tienTo.some((t) => k.startsWith(t))) {
      try {
        kho.removeItem(k)
        n++
      } catch {
        /* bỏ qua khoá này */
      }
    }
  }
  return n
}

/** Chỉ để test: quên mốc đã dọn trong phiên trang. */
export function quenMocDaDonTrongPhien(): void {
  motDaDon = null
}

export interface KetQuaDon {
  don: boolean
  soKhoa: number
}

/**
 * `moc` lấy từ máy chủ. Trả `{ don: true, soKhoa }` khi VỪA dọn; mọi trường hợp còn lại `{ don: false, soKhoa: 0 }`.
 * `kho` cho test truyền storage giả; mặc định là localStorage/sessionStorage của trình duyệt.
 */
export function donKhiDoiMocReset(moc: unknown, kho?: { local: Storage; session: Storage }): KetQuaDon {
  const chua = { don: false, soKhoa: 0 }
  if (typeof moc !== 'string' || !KIEU_MOC.test(moc)) return chua
  try {
    const local = kho?.local ?? localStorage
    const session = kho?.session ?? sessionStorage
    if (motDaDon !== null && motDaDon >= moc) return chua
    let daLuu: string | null = null
    try {
      daLuu = local.getItem(KHOA_MOC_RESET)
    } catch {
      daLuu = null
    }
    // Đã lưu đúng mốc này, hoặc lưu mốc MỚI hơn (máy chủ lùi về mốc cũ): không làm gì.
    if (daLuu !== null && KIEU_MOC.test(daLuu) && daLuu >= moc) {
      motDaDon = daLuu
      return chua
    }
    let n = xoaTheo(local, KHOA_LOCAL_DON, TIEN_TO_LOCAL_DON, KHOA_LOCAL_GIU)
    n += xoaTheo(session, [], TIEN_TO_SESSION_DON, KHOA_SESSION_GIU)
    try {
      local.setItem(KHOA_MOC_RESET, moc)
    } catch {
      /* không ghi được mốc: motDaDon vẫn chặn dọn lặp trong phiên này */
    }
    motDaDon = moc
    return { don: true, soKhoa: n }
  } catch {
    return chua
  }
}
