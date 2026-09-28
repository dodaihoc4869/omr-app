// SỐ ĐẾM CẠNH MỤC THANH BÊN (Game Hóa 2.0 · bản vẽ docs/ban-ve-gv-2809/GV-ThanhBen): "1 mở" cạnh Ca kiểm tra, số chiến dịch
// đang chạy cạnh Chiến dịch luyện, số câu cần dạy lại cạnh Chữa trên lớp.
// Thanh bên KHÔNG tự gọi máy chủ: màn nào đã tải dữ liệu (Tổng quan, Ca kiểm tra, Chiến dịch luyện) thì ghi số vào đây.
// `null` = chưa biết ⇒ thanh bên không vẽ số (không đoán, không vẽ 0 giả).
import { create } from 'zustand'

/** Thầy bấm "Giao" ở một ca chưa có chiến dịch (Tổng quan) ⇒ màn Chiến dịch luyện mở sẵn khung giao cho ca ấy. */
export interface GiaoTuCa {
  maCa: string
  lop: string
  ten: string
}

interface SoDemGv {
  caMo: number | null
  chienDichChay: number | null
  canDayLai: number | null
  giaoTuCa: GiaoTuCa | null
  datSo: (so: Partial<Pick<SoDemGv, 'caMo' | 'chienDichChay' | 'canDayLai'>>) => void
  datGiaoTuCa: (g: GiaoTuCa | null) => void
}

export const useSoDemGv = create<SoDemGv>((set) => ({
  caMo: null,
  chienDichChay: null,
  canDayLai: null,
  giaoTuCa: null,
  datSo: (so) => set(so),
  datGiaoTuCa: (g) => set({ giaoTuCa: g }),
}))
