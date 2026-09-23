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
