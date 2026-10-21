// SỐ ĐẾM CẠNH MỤC THANH BÊN (Game Hóa 2.0 · bản vẽ docs/ban-ve-gv-2809/GV-ThanhBen): "1 mở" cạnh Ca kiểm tra, số chiến dịch
// đang chạy cạnh Chiến dịch luyện, số câu cần dạy lại cạnh Chữa trên lớp.
// 09/10 (bản vẽ tối giản thầy chốt): thanh bên còn Hôm nay · Hành trình · Ca kiểm tra · Học sinh · Kho đề ⇒ số cạnh Hành trình là
// "Cần thầy chữa" (`canThayChua`, màn Hôm nay đếm); "1 mở" cạnh Ca kiểm tra giữ nguyên.
// Thanh bên KHÔNG tự gọi máy chủ: màn nào đã tải dữ liệu (Hôm nay, Tổng quan, Ca kiểm tra, Chiến dịch luyện) thì ghi số vào đây.
// `null` = chưa biết ⇒ thanh bên không vẽ số (không đoán, không vẽ 0 giả).
import { create } from 'zustand'

/** Thầy bấm "Giao" ở một ca chưa có chiến dịch (Tổng quan) ⇒ màn Chiến dịch luyện mở sẵn khung giao cho ca ấy. */
export interface GiaoTuCa {
  maCa: string
  lop: string
  ten: string
}

/** HAI MỤC của màn Hành trình (thầy 12/10: "chốt lại trong phần này tôi chỉ cần mục dạy học, gọi lên bảng đầu giờ và chữa câu khó tính toán và
 *  câu học sinh cần chữa … thu gọn tối giản hết lại thành 2 mục"): "Dạy học & đầu giờ" (`day-hoc`) · "Chữa bài" (`chua-bai`). */
export type MucHanhTrinh = 'day-hoc' | 'chua-bai'
/** Khoá thẻ của màn Hành trình mà nơi khác được gửi tới (Hôm nay, Cài đặt, ảnh chụp…). Hai mục mới + KHOÁ CŨ vẫn nhận để không gãy lối vào cũ —
 *  `mucHanhTrinh` ánh xạ về hai mục: `can-chua` ⇒ Chữa bài; `dau-gio`, `goi-7`, `nhip`, `bai-hang-ngay` ⇒ Dạy học & đầu giờ (Nhịp học và Bài hằng ngày
 *  nay ở màn Hôm nay; Kiểm tra đầu giờ đã gộp vào mục Dạy học thành bước "Gọi lên bảng đầu giờ"). `chien-dich` KHÔNG phải thẻ: là trang quản lý
 *  "Chiến dịch đã giao" của cùng màn (lối vào chữ nhỏ ở Cài đặt, hoặc Tổng quan › "Giao" cho một ca). */
export type TheHanhTrinh = MucHanhTrinh | 'goi-7' | 'nhip' | 'bai-hang-ngay' | 'dau-gio' | 'can-chua' | 'chien-dich'

/** Khoá thẻ (mới hoặc cũ, kể cả chuỗi lạ) ⇒ một trong hai mục. Không rõ ⇒ Dạy học & đầu giờ (mục mặc định). */
export function mucHanhTrinh(k: TheHanhTrinh | string | null | undefined): MucHanhTrinh {
  return k === 'chua-bai' || k === 'can-chua' ? 'chua-bai' : 'day-hoc'
}

/** Màn Hôm nay bấm một việc ⇒ Hành trình mở sẵn đúng thẻ (đọc một lần rồi xoá — như `giaoTuCa`). */
export interface MoHanhTrinh {
  the: TheHanhTrinh
  /** Lối cũ "Bổ sung bài" (21/10: nút ở Hôm nay mở hộp ngay tại chỗ) ⇒ Hành trình mở hộp "Bổ sung bài hôm nay". */
  boSungBai?: boolean
  /** Khối chọn sẵn (lối vào cũ của thẻ Nhịp học / Bài hằng ngày — hai thẻ ấy nay ở màn Hôm nay; Hành trình bỏ qua trường này). */
  khoi?: number
}

interface SoDemGv {
  caMo: number | null
  chienDichChay: number | null
  canDayLai: number | null
  /** Số chỗ "Cần thầy chữa" (câu sai từ 4 lần · câu có thẻ nút thắt · em sơ ý cao) — màn Hôm nay cộng từ các chiến dịch đang chạy. */
  canThayChua: number | null
  giaoTuCa: GiaoTuCa | null
  moHanhTrinh: MoHanhTrinh | null
  /** Màn Học sinh mở sẵn bộ lọc khối này (đọc một lần rồi xoá). 09/10 khuya: Hôm nay › "Xem danh sách" / dòng khối nay mở Hành trình › Nhịp học
   *  (`moHanhTrinh.khoi`), không còn ghi vào đây — giữ cho lối vào khác của màn Học sinh. */
  khoiHocSinh: number | null
  datSo: (so: Partial<Pick<SoDemGv, 'caMo' | 'chienDichChay' | 'canDayLai' | 'canThayChua'>>) => void
  datGiaoTuCa: (g: GiaoTuCa | null) => void
  datMoHanhTrinh: (m: MoHanhTrinh | null) => void
  datKhoiHocSinh: (k: number | null) => void
}

export const useSoDemGv = create<SoDemGv>((set) => ({
  caMo: null,
  chienDichChay: null,
  canDayLai: null,
  canThayChua: null,
  giaoTuCa: null,
  moHanhTrinh: null,
  khoiHocSinh: null,
  datSo: (so) => set(so),
  datGiaoTuCa: (g) => set({ giaoTuCa: g }),
  datMoHanhTrinh: (m) => set({ moHanhTrinh: m }),
  datKhoiHocSinh: (k) => set({ khoiHocSinh: k }),
}))
