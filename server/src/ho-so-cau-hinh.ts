// HẰNG SỐ CỦA HỒ SƠ NẮM KIẾN THỨC — MỘT NGUỒN (DE-XUAT-CA-NHAN-HOA-1909.md mục 1.2).
//
// Cấm rải các con số này ra chỗ khác. Ba hằng số có bản song song ở nơi khác và
// được `tests/ho-so-nam-kt-1909.test.ts` soi để hai bản không bao giờ lệch nhau:
//   MOC_ON         ↔ `MOC_ON` của `src/lib/chan-doan-cau-hinh.ts` (ở đó tính bằng BUỔI, ở đây
//                    bằng NGÀY — thầy chốt 19/09 câu 3: theo ngày, khớp mastery game v2)
//   SO_CAU_DU_TIN  ↔ `SO_CAU_DU_TIN` của `src/components/HoSoEmView.tsx`
//   NGUONG_DANG_YEU: ngưỡng MỚI, thay 5 định nghĩa "chuyên đề yếu" đang rải rác.

/** Sau lần đúng thứ 1, 2, 3+ (ở NGÀY khác nhau) bấy nhiêu ngày nữa thì ôn lại. Sai thì về mốc đầu. */
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
