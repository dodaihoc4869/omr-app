// CỜ GAME HÓA 2.0 CỦA APP THẦY — một nguồn cho thanh bên, App (chọn màn), Gọi lên bảng, màn ca và Cài đặt.
// Nguồn thật là máy chủ (`/gv/chien-dich` `co-doc`). Bản nhớ trên máy (`localStorage`) chỉ để lần mở sau KHÔNG nháy
// thanh bên kiểu cũ rồi mới đổi — máy chủ trả lời là ghi đè ngay. Không đọc được gì ⇒ coi như TẮT (app thầy như cũ).
import { create } from 'zustand'
import { docCo, luuCo, type CoHoa2 } from './api'

const KHOA_NHO = 'ddh.coHoa2'

function docNho(): CoHoa2 | null {
  try {
    const s = globalThis.localStorage?.getItem(KHOA_NHO)
    if (!s) return null
    const j = JSON.parse(s) as Partial<CoHoa2>
    return { bat: j.bat === true, lop: Array.isArray(j.lop) ? j.lop.map(String) : [], sbd: Array.isArray(j.sbd) ? j.sbd.map(String) : [] }
  } catch {
    return null
  }
}
function ghiNho(co: CoHoa2 | null) {
  try {
    if (co) globalThis.localStorage?.setItem(KHOA_NHO, JSON.stringify(co))
    else globalThis.localStorage?.removeItem(KHOA_NHO)
  } catch {
    /* máy chặn bộ nhớ: chỉ mất tiện lợi */
  }
}

interface TrangThaiCo {
  /** `null` = chưa biết (chưa đọc được máy chủ, máy chưa nhớ gì) ⇒ app như cũ. */
  co: CoHoa2 | null
  dangDoc: boolean
  /** Câu báo khi đọc hỏng (rỗng = không lỗi). */
  loi: string
  doc: () => Promise<void>
  /** Lưu lên máy chủ; trả câu lỗi (rỗng = xong). */
  luu: (co: CoHoa2) => Promise<string>
  /** Chỉ cho test / chỗ đã có cờ trong tay. */
  dat: (co: CoHoa2 | null) => void
}

export const useCoHoa2 = create<TrangThaiCo>((set, get) => ({
  co: docNho(),
  dangDoc: false,
  loi: '',
  doc: async () => {
    if (get().dangDoc) return
    set({ dangDoc: true })
    const r = await docCo()
    if (r.ok) {
      ghiNho(r.du)
      set({ co: r.du, dangDoc: false, loi: '' })
    } else {
      // Máy chủ chưa có lệnh ⇒ chắc chắn chưa bật: bỏ bản nhớ cũ. Mất mạng / chậm ⇒ giữ bản nhớ (không đổi app giữa buổi).
      if (r.loai === 'chua_co_lenh') {
        ghiNho(null)
        set({ co: null, dangDoc: false, loi: r.chu })
      } else set({ dangDoc: false, loi: r.chu })
    }
  },
  luu: async (co) => {
    const r = await luuCo(co)
    if (!r.ok) return r.chu
    ghiNho(r.du)
    set({ co: r.du, loi: '' })
    return ''
  },
  dat: (co) => {
    ghiNho(co)
    set({ co, loi: '' })
  },
}))

/** Cờ đang BẬT (cả trung tâm hoặc theo lớp) ⇒ app thầy chạy chế độ 2.0. */
export const chonBat = (s: { co: CoHoa2 | null }): boolean => s.co?.bat === true

/** Tiện dụng cho component: `true` khi Game Hóa 2.0 đang bật. */
export function useHoa2Bat(): boolean {
  return useCoHoa2(chonBat)
}
