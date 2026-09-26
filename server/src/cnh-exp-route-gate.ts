// CNH-1.0 — EXP_ONLY (Cline, 24/09/2026). SỔ KIỂM TÍCH HỢP "ROUTE THẬT → P07" + CỬA KÍCH HOẠT.
//
// VÌ SAO CÓ TỆP NÀY: P07 (`cnh-exp-submit/ledger/policy/task/grade/assistance`) đã được Boss nghiệm thu
// là **substrate CHƯA KÍCH HOẠT** (`BOSS-CODE2-M08-REVIEW.md`). Việc kế tiếp Boss giao là
// "inventory authenticated route-to-P07 integration and activation gates against deployed release".
// Tệp này làm ĐÚNG việc đó ở dạng MÁY ĐỌC ĐƯỢC:
//   · KHAI BÁO mọi route đã xác thực của bản aa08c74 có đụng TIỀN (EXP/ví/chi), vai tương ứng trong P07,
//     nguồn khoá idempotency, và trạng thái nối (`đã nối` / `đề xuất patch cho Boss` / `ngoài lát này`).
//   · KIỂM CỬA KÍCH HOẠT (fail-closed): chưa đủ bảng, sai phiên bản chính sách, hoặc HAI đường tiền cùng bật
//     (04 §5: "không vừa cộng ledger trực tiếp vừa chạy cron SUM(sổ) cộng lại") ⇒ TỪ CHỐI.
//   · KHẲNG ĐỊNH strict/new AI metadata là HOÃN: cửa **không** được đòi nó như phụ thuộc bắt buộc.
//
// ⚠️ TỆP NÀY KHÔNG NỐI ROUTE, KHÔNG BẬT CỜ, KHÔNG GHI/KHÔNG ĐỌC D1, KHÔNG ĐỔI HÀNH VI.
// Mọi thay đổi ở route dùng chung (`server/src/game-v2*.ts`, `server/src/index.ts`, UI) là **đề xuất patch**
// để Boss tích hợp — không sửa chồng lên việc của Aider.
import { PHIEN_BAN_CHINH_SACH, LENH_QUYET_TOAN_CORE } from './cnh-exp-ledger'

/** Vai của một route trong dây chuyền P07. */
export type VaiTichHop =
  | 'doc_so_du' // chỉ đọc/ hiển thị số (không đổi tiền)
  | 'phat_anh_chup' // phát câu kèm ảnh chụp bất biến (snapshot) — chưa cộng tiền
  | 'nop_bai' // nhận bài làm + receipt idempotent
  | 'quyet_toan_core' // chốt quyền core (settlement) — nơi DUY NHẤT được cộng ví
  | 'chi_tieu' // tiêu/ hấp thụ/ rèn (ví hoặc vàng GIẢM)
  | 'sua_diem' // sửa điểm có correction ⇒ khoản bù (03 §1.3)
  | 'cong_bo' // công bố kết quả (đổi quyền xem, không đổi tiền)

/** Tác động tiền của route: cộng ví/quyền, chi/tiêu, hay không. */
export type AnhHuongTien = 'cong' | 'chi' | 'khong'

/** Một dòng sổ kiểm: route THẬT của bản đang chạy + cách nối P07. */
export interface DongSoTichHop {
  /** Đường thật (đúng chuỗi/ tiền tố trong `server/src/index.ts`). */
  duong: string
  /** Hàm xử lý (hoặc tên lệnh con của route tiền tố) đang phục vụ đường này. */
  xuLy: string
  vai: readonly VaiTichHop[]
  tien: AnhHuongTien
  /** Nguồn khoá idempotency hiện có (`null` = không đổi tiền nên không cần). */
  khoaIdempotency: string | null
  trangThai: 'da_noi' | 'de_xuat_patch' | 'ngoai_lat_nay'
  ghiChu: string
}


/**
 * SỔ KIỂM — 14 dòng, mỗi dòng đã đối chiếu mã thật của bản `aa08c74`.
 * Bất biến (test canh): mọi dòng có `tien !== 'khong'` PHẢI có `khoaIdempotency`; mọi dòng
 * `trangThai: 'de_xuat_patch'` phải nằm trong danh sách patch trình Boss (`deXuatPatch`).
 */
export const SO_TICH_HOP: readonly DongSoTichHop[] = Object.freeze([
  { duong: '/game-v2/answer', xuLy: "gameV2 action==='answer'", vai: ['nop_bai'], tien: 'cong', khoaIdempotency: 'attempt (session|qid) — khoá LƯỢT LÀM, không phải khoá request', trangThai: 'de_xuat_patch', ghiChu: 'Trả lời một câu game; tiền chỉ trả ở bước chốt. Cần receipt P07 theo request trước khi bật quỹ mới.' },
  { duong: '/game-v2/complete', xuLy: "gameV2 action==='complete'", vai: ['quyet_toan_core'], tien: 'cong', khoaIdempotency: 'khoá khoản sổ `sbd|<mã chặng/lượt>` (exp_so)', trangThai: 'de_xuat_patch', ghiChu: 'Chốt lượt ⇒ ghi khoản EXP game. Nơi phải thay bằng `settle_core_entitlement` + receipt.' },
  { duong: '/game-v2/invest', xuLy: "gameV2 action==='invest'", vai: ['chi_tieu'], tien: 'chi', khoaIdempotency: 'revision hồ sơ (CAS)', trangThai: 'de_xuat_patch', ghiChu: 'Hấp thụ ví ⇒ tiền GIẢM. Phải đi cùng một giao dịch với tài khoản P07 khi chuyển quyền ví.' },
  { duong: '/game-v2/khien-ren', xuLy: "gameV2 action==='khien-ren'", vai: ['chi_tieu'], tien: 'chi', khoaIdempotency: 'revision hồ sơ (CAS)', trangThai: 'de_xuat_patch', ghiChu: 'Rèn khiên (mảnh + EXP dự trữ) ⇒ chi; giữ luật thưởng theo đặc tả, không tự cấp quà.' },
  { duong: '/game-v2/doan-nop', xuLy: "doanAction action==='doan-nop'", vai: ['nop_bai'], tien: 'cong', khoaIdempotency: 'CAS phòng (revision) + khoá khoản `doan_chang|<mã>`', trangThai: 'ngoai_lat_nay', ghiChu: 'ĐOÀN thuộc Aider (worktree riêng). Ở đây CHỈ ghi nhận cho sổ kiểm đủ dòng; KHÔNG đề xuất sửa.' },
  { duong: '/btvn/nop', xuLy: 'nopBtvn → nopBtvnQuaPhieu', vai: ['nop_bai', 'quyet_toan_core'], tien: 'cong', khoaIdempotency: 'lan (khoá lượt làm theo bài|em)', trangThai: 'de_xuat_patch', ghiChu: 'Nộp phiếu BTVN ⇒ capNhatExp. Cần khoá request + receipt trước khi bật.' },
  { duong: '/btvn/xong-lo', xuLy: 'xongLoBtvn → capNhatExpSauNopLo', vai: ['quyet_toan_core'], tien: 'cong', khoaIdempotency: 'mã lô|chặng (btvn_lo)', trangThai: 'de_xuat_patch', ghiChu: 'Chốt lô ⇒ cập nhật EXP/kế hoạch; phải idempotent theo lô khi bật quỹ mới.' },
  { duong: '/hs/on-lai/nop', xuLy: 'hsOnLaiNop → chamVaGhiTraLoi', vai: ['nop_bai', 'quyet_toan_core'], tien: 'cong', khoaIdempotency: '`on_lai:<ngày>` + lan=1 (sổ su_kien_hoc)', trangThai: 'de_xuat_patch', ghiChu: 'ĐÃ chứng minh retry/cạnh tranh không cộng hai lần (ca của tôi). Vẫn phải đổi sang receipt P07 khi chuyển quyền ví.' },
  { duong: '/hs/thu-thach-hom-nay/nop', xuLy: 'hsThuThachNop → chamVaGhiTraLoi', vai: ['nop_bai'], tien: 'cong', khoaIdempotency: '`thu_thach:<ngày>` + lan=1', trangThai: 'de_xuat_patch', ghiChu: 'Đi đường chấm của ôn lại; cùng luật khoá.' },
  { duong: '/mom/submit', xuLy: "mom action==='submit' → ghiHocMom", vai: ['nop_bai'], tien: 'cong', khoaIdempotency: '`submitted_at` của bài Mom (giữ lần đầu)', trangThai: 'de_xuat_patch', ghiChu: 'Nộp bài gia đình ⇒ ghi sổ học; không trả thêm ngoài tổng core (03 §2).' },
  { duong: '/parent-news/assign', xuLy: "parentNews action==='assign'", vai: ['phat_anh_chup'], tien: 'khong', khoaIdempotency: 'id `daily_<ngày>`', trangThai: 'de_xuat_patch', ghiChu: 'Giao bài hằng ngày: chỉ PHÁT; tiền ghi lúc nộp. Ảnh chụp phải phát trước khi em làm.' },
  { duong: '/ph/giao-them', xuLy: 'phGiaoThem', vai: ['phat_anh_chup'], tien: 'khong', khoaIdempotency: '`sbd|ngày|phút` + trần 3 lượt/ngày', trangThai: 'de_xuat_patch', ghiChu: 'Gói gia đình giao thêm: chỉ phát.' },
  { duong: '/ca/cham-lai', xuLy: 'chamLaiCaRoute', vai: ['sua_diem', 'cong_bo'], tien: 'cong', khoaIdempotency: '`correction_id` — ĐÃ cài trong `cnh-exp-correction.ts` (suaDiemMotLan), CHƯA nối route', trangThai: 'de_xuat_patch', ghiChu: 'Sửa điểm ⇒ khoản BÙ DƯƠNG còn thiếu đúng một lần (03 §1.3): substrate `cnh-exp-correction.ts` đã có (retry/cạnh tranh/khoá mâu thuẫn/rollback đều có ca D1); route `/ca/cham-lai` còn phải nối + truyền `correction_id` do giáo viên xác nhận.' },
  { duong: '/hs/ke-hoach-ngay', xuLy: 'dungKeHoachEm', vai: ['doc_so_du'], tien: 'khong', khoaIdempotency: null, trangThai: 'da_noi', ghiChu: 'Chỉ ĐỌC số để hiển thị; không đổi tiền — giữ nguyên, không cần P07.' },
])

/** Số dòng có tác động tiền (cong|chi) — test canh để không ai thêm đường tiền mà quên khai báo. */
export const SO_DONG_TIEN = SO_TICH_HOP.filter((d) => d.tien !== 'khong').length

/** Tra một đường. KHÔNG có ⇒ `null`; nơi gọi PHẢI fail-closed (xem `kiemTichHopRoute`). */
export function timDong(duong: string): DongSoTichHop | null {
  return SO_TICH_HOP.find((d) => d.duong === duong) ?? null
}

// ───────────────────────── CỬA KÍCH HOẠT (THUẦN, FAIL-CLOSED) ─────────────────────────

export type MaCua = 'CHO_PHEP' | 'THIEU_BANG' | 'SAI_PHIEN_BAN' | 'HAI_DUONG_TIEN' | 'THIEU_ANH_CHUP' | 'CUA_KHONG_HOP_LE'

export interface KetQuaCua { choPhep: boolean; ma: MaCua; lyDo: string }

/** Trạng thái hạ tầng mà Boss đọc lúc chuẩn bị kích hoạt. Không đọc D1 ở đây (thuần, kiểm được). */
export interface CauHinhKichHoat {
  /** Phiên bản chính sách đang chạy. Phải TRÙNG `PHIEN_BAN_CHINH_SACH` của ledger. */
  phienBanChinhSach: string
  /** `migration-2309-cnh-exp-{ledger,submit,task}.sql` đã chạy trên D1 của môi trường đó. */
  bangDaChay: boolean
  /** Đường tiền CŨ (`exp_so` + cron SUM / `game_v2_profile`) còn đang cộng. */
  duongCuConBat: boolean
  /** `cnh_exp_account` đã là chủ ví DUY NHẤT (`cnh_exp_grant_ledger` chạy khoá). */
  viMoiLaChu: boolean
  /** Ảnh chụp bất biến đã phát được trước lúc em làm (điều kiện để chấm/ quyết toán). */
  anhChupDaNoi: boolean
  /** Strict/new AI metadata — ĐÃ HOÃN: **không** được thành điều kiện bắt buộc (xem `lyDo`). */
  strictMetadata: boolean
}

/**
 * Quyết định kích hoạt quỹ ví mới cho MỘT môi trường. Thứ tự kiểm là thứ tự an toàn: thiếu bảng → sai
 * phiên bản → hai đường tiền → thiếu ảnh chụp. `strictMetadata` KHÔNG tham gia quyết định.
 */
export function kiemCuaKichHoat(c: CauHinhKichHoat): KetQuaCua {
  if (!c || typeof c !== 'object') return { choPhep: false, ma: 'CUA_KHONG_HOP_LE', lyDo: 'Thiếu cấu hình cửa kích hoạt.' }
  if (c.bangDaChay !== true) return { choPhep: false, ma: 'THIEU_BANG', lyDo: 'Chưa chạy migration-2309-cnh-exp-*.sql trên D1 này ⇒ không bật quỹ ví mới.' }
  if (c.phienBanChinhSach !== PHIEN_BAN_CHINH_SACH) return { choPhep: false, ma: 'SAI_PHIEN_BAN', lyDo: `Phiên bản chính sách "${c.phienBanChinhSach}" ≠ "${PHIEN_BAN_CHINH_SACH}" ⇒ không quyết toán bằng bộ luật khác.` }
  if (c.duongCuConBat && c.viMoiLaChu) return { choPhep: false, ma: 'HAI_DUONG_TIEN', lyDo: 'Đường tiền CŨ còn bật trong khi ví mới đã làm chủ ⇒ có thể cộng hai lần (04 §5). Phải tắt đường cũ trước.' }
  if (c.anhChupDaNoi !== true) return { choPhep: false, ma: 'THIEU_ANH_CHUP', lyDo: 'Chưa phát được ảnh chụp bất biến ⇒ không đủ căn cứ chấm/quyết toán.' }
  return { choPhep: true, ma: 'CHO_PHEP', lyDo: `Đủ cửa cho ${LENH_QUYET_TOAN_CORE}. Strict metadata (${c.strictMetadata ? 'bật' : 'tắt'}) KHÔNG phải điều kiện kích hoạt.` }
}

/**
 * Cửa cho MỘT route: fail-closed khi route lạ/ ngoài lát; route thuộc Aider (`ngoai_lat_nay`) cũng bị từ chối
 * ở lát này để KHÔNG sửa chồng. Trả kèm dòng sổ kiểm để Boss thấy căn cứ.
 */
export function kiemTichHopRoute(duong: string, c: CauHinhKichHoat): KetQuaCua & { dong?: DongSoTichHop } {
  const dong = timDong(duong)
  if (!dong) return { choPhep: false, ma: 'CUA_KHONG_HOP_LE', lyDo: `Đường "${duong}" không có trong sổ kiểm ⇒ fail-closed, không tự nối.` }
  if (dong.trangThai === 'ngoai_lat_nay') return { choPhep: false, ma: 'CUA_KHONG_HOP_LE', lyDo: `"${duong}" ngoài lát EXP này (${dong.ghiChu})`, dong }
  return { ...kiemCuaKichHoat(c), dong }
}

/** Tệp DÙNG CHUNG phải sửa để nối P07 — CHỈ ĐỀ XUẤT, Boss tích hợp sau khi chốt hash (không sửa chồng với Aider). */
export const TEP_DE_XUAT_PATCH: Readonly<Record<string, string>> = Object.freeze({
  '/game-v2/answer': 'server/src/game-v2.ts (nhánh answer: khoá request + receipt)',
  '/game-v2/complete': 'server/src/game-v2.ts (nhánh complete: gọi quyết toán có receipt)',
  '/game-v2/invest': 'server/src/game-v2.ts (nhánh invest: chi ví trong cùng giao dịch tài khoản)',
  '/game-v2/khien-ren': 'server/src/game-v2.ts (nhánh khien-ren: chi ví cùng giao dịch)',
  '/btvn/nop': 'server/src/index.ts + server/src/btvn-nang-do-d1.ts (nopBtvnQuaPhieu)',
  '/btvn/xong-lo': 'server/src/index.ts + server/src/exp-d1.ts (capNhatExpSauNopLo)',
  '/hs/on-lai/nop': 'server/src/index.ts (route) + server/src/on-lai-nop.ts (chamVaGhiTraLoi)',
  '/hs/thu-thach-hom-nay/nop': 'server/src/thu-thach-rieng.ts (hsThuThachNop)',
  '/mom/submit': 'server/src/mom.ts (nhánh submit → ghiHocMom)',
  '/parent-news/assign': 'server/src/parent-news.ts (phát ảnh chụp trước khi chốt câu)',
  '/ph/giao-them': 'server/src/ph-giao-them.ts (phát ảnh chụp cho gói gia đình)',
  '/ca/cham-lai': 'server/src/index.ts (chamLaiCaRoute) + bổ sung correction_id trong P07',
})

/** Danh sách patch trình Boss: mỗi dòng `de_xuat_patch` phải có tệp đích (test canh). */
export function deXuatPatch(): { duong: string; xinSua: string; viec: string }[] {
  return SO_TICH_HOP.filter((d) => d.trangThai === 'de_xuat_patch').map((d) => ({ duong: d.duong, xinSua: TEP_DE_XUAT_PATCH[d.duong] ?? '', viec: d.ghiChu }))
}

// ───────── BẢN ĐỒ NỐI P08 (§6–§9 + §7.2) — phần CHO BOSS/AIDER TÍCH HỢP ─────────
//
// ⚠️ Đây là ĐỀ XUẤT, không phải code đang chạy: các route ở `SO_TICH_HOP` vẫn `de_xuat_patch` và
// **Cline KHÔNG sửa** `game-v2*.ts` / `index.ts` (charter ở đầu tệp). Bảng dưới chỉ ra LỆNH P08 nào
// thay hành vi nào, để lúc nối không phải đoán.
//
// Vì sao cần: P08 đã có đủ LỆNH (`cnh-exp-p08-lenh.ts`) + CHUYỂN ĐỔI (`cnh-exp-p08-chuyen-doi.ts`)
// + ADAPTER ĐỌC CŨ (`cnh-exp-p08-legacy.ts`), nhưng chưa đường nào gọi. Không có bảng này thì người
// nối phải tự suy từ `03`, dễ nối thiếu (ví dụ quên `ghiManhNgayDat` ⇒ kho mảnh KHÔNG BAO GIỜ lớn).
export interface DongNoiP08 {
  /** Hành vi/đường cũ đang chạy. */
  cu: string
  /** Lệnh P08 phải gọi thay. */
  moi: string
  /** Điều khoản. */
  dieuKhoan: string
  /** Lưu ý sống còn khi nối. */
  luuY: string
}

export const BAN_DO_NOI_P08: readonly DongNoiP08[] = Object.freeze([
  {
    cu: '/game-v2/invest — hấp thụ ví vào cấp',
    moi: 'hapThuCore',
    dieuKhoan: '03 §6',
    luuY: 'Hạn mức là CỦA NGÀY VN; "sang ngày mới" phải truyền `learningDay` mới. Trần chặn theo TỔNG đường tới cấp 120 (không phải thanh hiện tại).',
  },
  {
    cu: 'Ngày ĐẠT nhiệm vụ ⇒ +1 mảnh',
    moi: 'ghiManhNgayDat',
    dieuKhoan: '03 §7.1',
    luuY: 'PHẢI gọi, nếu không `fragment_balance` mãi bằng 0 ⇒ không bao giờ đủ 21 mảnh để đổi khiên. Khoá tự nhiên theo NGÀY, `request_id` khác vẫn phát lại.',
  },
  {
    cu: '/game-v2/khien-ren + nút quà tiến hoá — đổi khiên',
    moi: 'renKhienCore',
    dieuKhoan: '03 §7.1',
    luuY: 'MỘT lệnh cho CẢ quà và rèn (§7.1 "các nút quà/rèn chỉ là adapter vào command này"). `later` cần ví ≥ 700; kho đã 5 ⇒ từ chối, không trừ.',
  },
  {
    cu: 'Đổi EXP thừa lấy vàng (`vang-doi`)',
    moi: 'doiVangCore',
    dieuKhoan: '03 §8',
    luuY: 'Giữ dự trữ 400. Lệnh GHI CẢ `vang_so` để cửa hàng hiện có thấy số dư mới.',
  },
  {
    cu: 'Cửa hàng mua đồ (`shop-mua`)',
    moi: '(GIỮ NGUYÊN `game-v2-shop.ts`)',
    dieuKhoan: '03 §8',
    luuY: 'Đã đủ §8: khoá sở hữu một-lần, suất giới hạn, mua vàng thuần KHÔNG kiểm dự trữ EXP. Chỉ cần `doiVangCore` ghi vào `vang_so` (đã làm).',
  },
  {
    cu: 'Dùng một khiên trong game',
    moi: 'dungKhienCore',
    dieuKhoan: '03 §7.2',
    luuY: 'CHỈ trừ khiên do tác dụng game được người chơi dùng, kèm usage receipt. KHÔNG có cron giảm khiên vì vắng học.',
  },
  {
    cu: 'Chuyển hồ sơ cũ sang CNH-1.0',
    moi: 'chuyenDoiTuLegacy (đọc cũ) → chuyenDoiP08',
    dieuKhoan: '03 §9.1/§9.2',
    luuY: 'Chạy `dryRun` trước rồi mới ghi. TIỀN ĐỀ: ví PHẢI đã ở `cnh_exp_account` (lệnh KHÔNG chuyển ví). Hiệu lực phải đúng 00:00 ngày VN kế tiếp.',
  },
  {
    cu: 'Đối chiếu em ở nhánh `legacy_unresolved`',
    moi: 'giaiQuyetKhiendau',
    dieuKhoan: '03 §9.2',
    luuY: 'Cần giáo viên + `legacy_resolution_id`. `con_thieu` cấp MỘT voucher và VẪN tôn trọng kho 5.',
  },
  {
    cu: 'Cửa kích hoạt (đọc `cau_hinh`)',
    moi: 'docCauHinhKichHoat + moCuaRoute',
    dieuKhoan: '04 §5',
    luuY: 'Fail-closed: thiếu/hỏng cờ ⇒ ĐÓNG. Bật cờ là quyết định của Boss, không tự bật.',
  },
])

