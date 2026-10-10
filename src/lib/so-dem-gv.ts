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

/** Các thẻ của màn Hành trình: Dạy học · Bài mới trong 7 ngày · Nhịp học · Kiểm tra đầu giờ · Cần thầy chữa.
 *  10/10 thêm bài 7 ngày ngay sau Dạy học. `chien-dich` KHÔNG phải thẻ: là trang quản lý "Chiến dịch đã
 *  giao" của cùng màn (lối vào chữ nhỏ ở Cài đặt, hoặc Tổng quan › "Giao" cho một ca). */
export type TheHanhTrinh = 'day-hoc' | 'goi-7' | 'nhip' | 'dau-gio' | 'can-chua' | 'chien-dich'

/** Màn Hôm nay bấm một việc ⇒ Hành trình mở sẵn đúng thẻ (đọc một lần rồi xoá — như `giaoTuCa`). */
export interface MoHanhTrinh {
  the: TheHanhTrinh
  /** "Bổ sung bài": cuộn tới bước Bài hôm nay trong thẻ Dạy học. */
  boSungBai?: boolean
  /** Thẻ Nhịp học: khối chọn sẵn ở thanh phân đoạn (Hôm nay bấm dòng "Khối 12" của thẻ Đủ mức tối thiểu). Vắng ⇒ Tất cả. */
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
