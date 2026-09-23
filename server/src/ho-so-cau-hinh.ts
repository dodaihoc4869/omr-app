// HẰNG SỐ CỦA HỒ SƠ NẮM KIẾN THỨC — MỘT NGUỒN (DE-XUAT-CA-NHAN-HOA-1909.md mục 1.2).
//
// Cấm rải các con số này ra chỗ khác. Ba hằng số có bản song song ở nơi khác và
// được `tests/ho-so-nam-kt-1909.test.ts` soi để hai bản không bao giờ lệch nhau:
//   MOC_ON         ↔ `MOC_ON` của `src/lib/chan-doan-cau-hinh.ts` (ở đó tính bằng BUỔI, ở đây
//                    bằng NGÀY — thầy chốt 19/09 câu 3: theo ngày, khớp mastery game v2)
//   SO_CAU_DU_TIN  ↔ `SO_CAU_DU_TIN` của `src/components/HoSoEmView.tsx`
//   NGUONG_DANG_YEU: ngưỡng MỚI, thay 5 định nghĩa "chuyên đề yếu" đang rải rác.

/** Dãy mốc cũ cho chẩn đoán theo buổi; hồ sơ lịch ngày dùng lich-on-fsrs.ts từ 23/09. */
export const MOC_ON: readonly number[] = [1, 3, 7]

/** Số ngày ĐÚNG khác nhau để một câu từng sai được coi là đã khắc phục. */
export const SO_MOC_KHAC_PHUC = 3

/** Dạng có dưới bấy nhiêu câu đã gặp thì chưa đủ căn cứ kết luận yếu/mạnh. */
export const SO_CAU_DU_TIN = 4

/** Dạng yếu khi (câu đã khắc phục + câu chưa từng sai) / câu đã gặp thấp hơn mức này. */
export const NGUONG_DANG_YEU = 0.7

/** Trần số lần một câu được giao lại trong cùng một kỳ (dùng ở kế hoạch ngày, GĐ 2+). */
export const TRAN_LAP_MOT_CAU = 3

/** Sai từng này lần mà chưa đúng lại lần nào ⇒ nhãn `can_day_lai` (rơi khỏi mọi kênh tự động). */
export const SO_LAN_SAI_DAY_LAI = 3

/** Bậc dạng: 0 biết · 1 hiểu · 2 vận dụng. Chưa có hồ sơ thì bắt đầu ở "hiểu" (như `lich-on-lai.ts`). */
export const BAC_DANG_BAT_DAU = 1
export const BAC_DANG_TOI_DA = 2
export const TEN_BAC_DANG = ['biet', 'hieu', 'van_dung'] as const

// --- Kế hoạch ngày (GĐ 2) ------------------------------------------------------
// Ngân sách ngày vẫn do `tinhNganSachNgay` (src/lib/tro-ly-ca-nhan.ts, test đang khoá 8–16); ở đây chỉ là
// các hằng số của bộ điều phối bao quanh nó. Không viết lại hàm đó — chỉ sửa ĐẦU VÀO và hạ/nâng có trần.

/** Đổi công thức xếp việc thì tăng số này: kế hoạch cũ trong D1 còn nhận ra là bản cũ. */
export const PHIEN_BAN_KE_HOACH = 2

export const NGAN_SACH_SAN = 8
export const NGAN_SACH_TRAN = 16

/** Phút học/ngày khi em/phụ huynh chưa đặt (thầy chốt 19/09 câu 1). */
export const PHUT_NGAY_MAC_DINH = 20
export const PHUT_NGAY_TOI_THIEU = 10
export const PHUT_NGAY_TOI_DA = 45

/** Tốc độ (giây/câu): trung vị các lần có đo trong 30 ngày, lọc [5, 1200] s, cần ≥ SO_MAU_GIAY_TOI_THIEU mẫu, kẹp [45, 240]. */
export const VAN_TOC_MAC_DINH = 90
export const SO_MAU_GIAY_TOI_THIEU = 5
export const GIAY_MOT_CAU_TOI_THIEU = 5
export const GIAY_MOT_CAU_TOI_DA = 1200
export const VAN_TOC_SAN = 45
export const VAN_TOC_TRAN = 240
export const SO_NGAY_DO_VAN_TOC = 30

/** Điều chỉnh theo 7 ngày gần nhất: ≥ 3 ngày không đạt → −2; 7/7 đạt mà nhanh hơn ngưỡng dưới → +2. */
export const SO_NGAY_LICH_SU = 7
export const SO_NGAY_KHONG_DAT_DE_GIAM = 3
export const BUOC_DIEU_CHINH = 2
export const VAN_TOC_NHANH_DE_TANG = 75

/** Câu tối thiểu mỗi ngày = clamp(round(mụcTiêu/2), 4, 8). */
export const TOI_THIEU_CAU_SAN = 4
export const TOI_THIEU_CAU_TRAN = 8

/** Ôn tới hạn chiếm tối đa bấy nhiêu phần mục tiêu ngày. */
export const TY_LE_ON_TOI_DA = 0.4
/** Nhiệm vụ thần thú giao theo bội số này (một lượt game 6 câu). */
export const BOI_THAN_THU = 6
export const TRAN_THAN_THU_MOT_LUOT = 12
/** Ôn thi: số câu cho ca sắp tới trong vòng bấy nhiêu ngày. */
export const CAU_ON_THI = 4
export const NGAY_ON_THI = 3
/** Bài quá hạn quá bấy nhiêu ngày thì thôi liệt kê. */
export const NGAY_LIET_KE_QUA_HAN = 14

/**
 * Mom CHƯA BẮT ĐẦU vào `viec[]` (việc bắt buộc) chỉ khi bài được giao trong bấy nhiêu NGÀY VN gần nhất (gồm hôm nay) và tối đa bấy nhiêu
 * bài (mới nhất trước). Phần còn lại là "tồn cũ" (`tonCu[]`): đứng riêng, KHÔNG tính tải, KHÔNG gây quá tải, KHÔNG vào cổng.
 * Lý do (0.Planer 19/09): bài cũ chưa mở dồn lại (di chứng nút 1-click giao lại cùng vài câu) sẽ khoá em sau hàng chục việc bắt buộc.
 * Bài ĐÃ bắt đầu (đồng hồ 120 phút đang chạy) luôn vào `viec[]`, không giới hạn.
 */
export const MOM_CHUA_BAT_DAU_SO_NGAY = 3
export const MOM_CHUA_BAT_DAU_TOI_DA = 3

/** Số nhiệm vụ thần thú MỞ tối đa của một em (gồm cả nhiệm vụ phụ huynh nhắc). Kế hoạch ngày tự sinh nhiệm vụ mới chỉ khi còn dưới mức này. */
export const NHIEM_VU_THAN_THU_MO_TOI_DA = 3

// --- Năng lực theo bằng chứng (CNH-1.0 P03) ------------------------------------
// Nguồn: docs/cline-ca-nhan-hoa-2309/THAM-SO.json `learning` + 02-HOC-TAP-VA-RUT-CAU.md §3.
// ĐÂY LÀ BẢN DUY NHẤT của các hằng số này trên máy chủ: `server/src/nang-luc.ts` KHÔNG tự khai lại.
// Vector nghiệm thu tương ứng: MAU-KET-QUA.json V47/V48 (confidence) — công thức ở `confidenceBangChung`.

/** Cửa sổ bằng chứng tính bằng ngày VN (V47/V48 và §3.1: "cửa sổ 30 ngày VN gần nhất"). */
export const CUA_SO_BANG_CHUNG_NGAY = 30
/** Phiên bản chính sách CNH-1.0 — một nguồn cho sổ sự kiện và hồ sơ năng lực. */
export const POLICY_VERSION = 'CNH-1.0'
/** Số family khác nhau tối thiểu ở ĐÚNG một mức để xác nhận mức ấy (§3.2.2). */
export const SO_FAMILY_XAC_NHAN = 5
/** Số ngày VN khác nhau tối thiểu có bằng chứng (§3.2.2). */
export const SO_NGAY_BANG_CHUNG = 2
/** Trong 5 family gần nhất, ít nhất bấy nhiêu phải đúng (§3.2.2: 4/5). */
export const SO_DUNG_TRONG_RECENT5 = 4
/** Mức khởi đầu trong phần đã học khi chưa có bằng chứng (§3.2.1 — `validated_level` vẫn là null). */
export const MUC_KHOI_DAU = 0
/** Đếm lỗi trên ba cơ hội độc lập gần nhất, trong bấy nhiêu ngày, mới mở đợt cần dạy lại (§3.3). */
export const CUA_SO_LOI_NGAY = 7
export const SO_LOI_MO_DOT = 3
/** Ít nhất bấy nhiêu family đã xác minh trong ba lỗi đó (§3.3). */
export const SO_FAMILY_LOI = 2
/** Hai câu chính liên tiếp sai trong lượt ⇒ giảm độ khó phần chưa mở (§3.3). */
export const SAI_LIEN_TIEP_CAN_HO_TRO = 2
/** Phục hồi: cách lần hướng dẫn ≥ bấy nhiêu nhiệm vụ khác (§3.3). */
export const NHIEM_VU_CACH_PHUC_HOI = 2
/** Phục hồi: HOẶC ≥ bấy nhiêu giây hoạt động hợp lệ kể từ lần hướng dẫn (§3.3). */
export const GIAY_HOAT_DONG_PHUC_HOI = 300
/** `stable`: lần độc lập đúng ở NGÀY KHÁC, cách `recovered` ≥ 24 giờ (§3.3, THAM-SO `stableGapSeconds`). */
export const GIAY_CACH_STABLE = 86_400_000
/** Mỗi skill chỉ mở một đợt cần dạy lại tại một thời điểm (§3.3), và mỗi skill/ngày tối đa một probe (§3.2.3). */
export const SO_DOT_MO_MOI_SKILL = 1
export const SO_PROBE_MOI_SKILL_NGAY = 1

// --- Điểm chọn câu §7.2 (P05) ---------------------------------------------------
// Nguồn: 02 §7.2 + THAM-SO.json `planning.scoreWeights`. BẢN DUY NHẤT — `bo-chon-diem.ts` không tự khai lại.
/** Trọng số điểm chọn: repair 0,30 · review 0,25 · transfer 0,20 · fit 0,15 · coverage 0,10 (rồi TRỪ fatigue). */
export const DIEM_CHON = Object.freeze({ repair: 0.3, review: 0.25, transfer: 0.2, fit: 0.15, coverage: 0.1 })
/** `reviewNeed` cộng nền rồi chia cho hệ số này (§7.2: "cộng nền 0,5 rồi chia 1,5"). */
export const NEN_REVIEW = 0.5
export const CHIA_REVIEW = 1.5
/** Khoảng ôn tối thiểu dùng khi tính `reviewNeed` (giây). */
export const GIAY_TOI_THIEU_ON = 86_400
/** `fatigue`: 0,2 nếu cùng part với hai task liền trước; +0,2 nếu solveSeconds>180 và task trước cũng >180; trần 0,4. */
export const MOI_MET_MOI_LAN = 0.2
export const MOI_MET_TRAN = 0.4
export const GIAY_DAI = 180

// --- Ước lượng thời gian theo CNH-1.0 §5.1 (P05) --------------------------------
// Nguồn: docs/cline-ca-nhan-hoa-2309/02-HOC-TAP-VA-RUT-CAU.md §5.1 + THAM-SO.json `planning`.
// BẢN DUY NHẤT: `server/src/uoc-luong-thoi-gian.ts` KHÔNG tự khai lại các số này.
// KHÁC bộ hằng số cũ (`VAN_TOC_*`, `GIAY_MOT_CAU_*` phía trên): bộ cũ là "trung vị giây/câu" cho ước
// lượng thô đang chạy; bộ dưới là công thức theo PART × difficulty tính lại được (giữ cả hai, không trộn).

/** Giây gốc cho một câu theo phần và mức độ (THAM-SO `baseSeconds`). */
export const GIAY_CO_SO: Readonly<Record<'I' | 'II' | 'III', readonly [number, number, number]>> = Object.freeze({
  I: Object.freeze([75, 105, 150] as const),
  II: Object.freeze([150, 210, 300] as const),
  III: Object.freeze([120, 180, 240] as const),
})
/** Đọc đề: quá `NGUONG_KY_TU_DOC` ký tự thì mỗi bước `BUOC_KY_TU_DOC` cộng `GIAY_MOI_BUOC_DOC`, trần `TRAN_DOC`. */
export const NGUONG_KY_TU_DOC = 300
export const BUOC_KY_TU_DOC = 120
export const GIAY_MOI_BUOC_DOC = 10
export const TRAN_DOC = 120
/** Bảng/hình: mỗi cái `GIAY_MOI_HINH`, trần `TRAN_HINH`. */
export const GIAY_MOI_HINH = 30
export const TRAN_HINH = 90
/** Hệ số theo tốc độ THẬT của em: cần `MAU_TOI_THIEU` mẫu hợp lệ, kẹp [`HE_SO_SAN`, `HE_SO_TRAN`]. */
export const MAU_TOI_THIEU = 5
export const MAU_TOI_DA = 20
export const NGAY_MAU_TOI_DA = 30
export const GIAY_MAU_TOI_THIEU = 10
export const GIAY_MAU_TOI_DA = 900
export const HE_SO_SAN = 0.75
export const HE_SO_TRAN = 2
/** Phản hồi mỗi câu: `TY_LE_PHAN_HOI` thời gian giải, sàn `GIAY_PHAN_HOI_TOI_THIEU`. */
export const TY_LE_PHAN_HOI = 0.25
export const GIAY_PHAN_HOI_TOI_THIEU = 30
/** Chữa lỗi có bài mẫu: cộng thêm thời gian bài mẫu (02 §3.3 + §5.1). */
export const GIAY_BAI_MAU = 90
