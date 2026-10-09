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

/** Bốn thẻ của màn Hành trình (bản vẽ tối giản 09/10). */
export type TheHanhTrinh = 'nhip' | 'can-chua' | 'bai-da-day' | 'chien-dich'

/** Màn Hôm nay bấm một việc ⇒ Hành trình mở sẵn đúng thẻ (đọc một lần rồi xoá — như `giaoTuCa`). */
export interface MoHanhTrinh {
  the: TheHanhTrinh
  /** Hành trình (khối) chọn sẵn ở thẻ Nhịp hôm nay. */
  chienDichId?: string
  /** "Bổ sung bài": cuộn tới bước Bài hôm nay trong thẻ Bài đã dạy. */
  boSungBai?: boolean
}

interface SoDemGv {
  caMo: number | null
  chienDichChay: number | null
  canDayLai: number | null
  /** Số chỗ "Cần thầy chữa" (câu sai từ 4 lần · câu có thẻ nút thắt · em sơ ý cao) — màn Hôm nay cộng từ các chiến dịch đang chạy. */
  canThayChua: number | null
  giaoTuCa: GiaoTuCa | null
  moHanhTrinh: MoHanhTrinh | null
  datSo: (so: Partial<Pick<SoDemGv, 'caMo' | 'chienDichChay' | 'canDayLai' | 'canThayChua'>>) => void
  datGiaoTuCa: (g: GiaoTuCa | null) => void
  datMoHanhTrinh: (m: MoHanhTrinh | null) => void
}

export const useSoDemGv = create<SoDemGv>((set) => ({
  caMo: null,
  chienDichChay: null,
  canDayLai: null,
  canThayChua: null,
  giaoTuCa: null,
  moHanhTrinh: null,
  datSo: (so) => set(so),
  datGiaoTuCa: (g) => set({ giaoTuCa: g }),
  datMoHanhTrinh: (m) => set({ moHanhTrinh: m }),
}))
