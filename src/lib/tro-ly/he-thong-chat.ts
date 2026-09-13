/**
 * HỆ THỐNG TRUNG TÂM TIN NHẮN 3 CHIỀU: GIÁO VIÊN ↔ HỌC SINH ↔ PHỤ HUYNH ↔ BẠN BÈ
 *
 * Đồng bộ thời gian thực qua BroadcastChannel và localStorage.
 * Hỗ trợ:
 * - Học sinh ↔ Trợ lý AI Gemini Hoá học
 * - Học sinh ↔ Thầy Đỗ Đại Học
 * - Học sinh ↔ Phụ huynh (Bố / Mẹ)
 * - Học sinh ↔ Học sinh khác (nhắn tin theo Số Báo Danh)
 * - Phụ huynh ↔ Thầy Đỗ Đại Học (Tab: Nhắn cho Thầy)
 * - Phụ huynh ↔ Con (Tab: Nhắn cho Con theo SBD)
 * - Giáo viên ↔ Học sinh & Phụ huynh
 */

export type VaiNguoiDung = 'gv' | 'hs' | 'ph' | 'ai'

export interface NguoiDungChat {
  vai: VaiNguoiDung
  sbd?: string
  hoTen?: string
  lop?: string
}

export interface TinNhanChat {
  id: string
  thoiGian: number // Unix ms
  nguoiGui: NguoiDungChat
  nguoiNhan: NguoiDungChat
  noiDung: string
  html?: string
  anhUrl?: string
  tenTep?: string
  daDoc?: boolean
}

const KHOA_STORAGE = 'omr_he_thong_chat_v2'
const KENH_BROADCAST = 'omr_chat_sync_channel_v2'

let broadcastChannel: BroadcastChannel | null = null
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(KENH_BROADCAST)
  }
} catch {
  broadcastChannel = null
}

/** Đọc toàn bộ kho tin nhắn từ localStorage */
export function docTatCaTinNhan(): TinNhanChat[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(KHOA_STORAGE)
    if (!raw) return []
    const ds = JSON.parse(raw)
    return Array.isArray(ds) ? ds : []
  } catch {
    return []
  }
}

/** Lưu toàn bộ kho tin nhắn vào localStorage và phát sóng sync */
function luuTatCaTinNhan(ds: TinNhanChat[], tinMoi?: TinNhanChat) {
  if (typeof localStorage === 'undefined') return
  try {
    // Giới hạn 2000 tin gần nhất để tiết kiệm bộ nhớ
    const gioiHan = ds.slice(-2000)
    localStorage.setItem(KHOA_STORAGE, JSON.stringify(gioiHan))
    if (broadcastChannel && tinMoi) {
      broadcastChannel.postMessage({ loai: 'tin_moi', tin: tinMoi })
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('omr_tin_nhan_moi', { detail: tinMoi }))
    }
  } catch {
    // localStorage đầy hoặc bị chặn
  }
}

/** Gửi một tin nhắn mới vào hệ thống */
export function guiTinNhan(tin: Omit<TinNhanChat, 'id' | 'thoiGian'>): TinNhanChat {
  const tinHoanChinh: TinNhanChat = {
    ...tin,
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    thoiGian: Date.now(),
    daDoc: false,
  }

  const dsHienTai = docTatCaTinNhan()
  dsHienTai.push(tinHoanChinh)
  luuTatCaTinNhan(dsHienTai, tinHoanChinh)
  return tinHoanChinh
}

/** Lấy cuộc trò chuyện giữa hai đối tượng */
export function layHoiThoai(
  nguoiDung: NguoiDungChat,
  doiPhuong: NguoiDungChat,
): TinNhanChat[] {
  const ds = docTatCaTinNhan()
  return ds.filter((t) => {
    // Chiều 1: nguoiDung gửi -> doiPhuong nhận
    const chieu1 =
      t.nguoiGui.vai === nguoiDung.vai &&
      (!nguoiDung.sbd || t.nguoiGui.sbd === nguoiDung.sbd) &&
      t.nguoiNhan.vai === doiPhuong.vai &&
      (!doiPhuong.sbd || t.nguoiNhan.sbd === doiPhuong.sbd)

    // Chiều 2: doiPhuong gửi -> nguoiDung nhận
    const chieu2 =
      t.nguoiGui.vai === doiPhuong.vai &&
      (!doiPhuong.sbd || t.nguoiGui.sbd === doiPhuong.sbd) &&
      t.nguoiNhan.vai === nguoiDung.vai &&
      (!nguoiDung.sbd || t.nguoiNhan.sbd === nguoiDung.sbd)

    return chieu1 || chieu2
  })
}

/** Đăng ký lắng nghe tin nhắn mới thời gian thực */
export function dangKyNhanTinNhan(cb: (tin: TinNhanChat) => void): () => void {
  const handlerBroadcast = (e: MessageEvent) => {
    if (e.data && e.data.loai === 'tin_moi' && e.data.tin) {
      cb(e.data.tin)
    }
  }

  const handlerCustom = (e: Event) => {
    const custom = e as CustomEvent
    if (custom.detail) {
      cb(custom.detail)
    }
  }

  const handlerStorage = (e: StorageEvent) => {
    if (e.key === KHOA_STORAGE && e.newValue) {
      try {
        const ds = JSON.parse(e.newValue)
        if (Array.isArray(ds) && ds.length > 0) {
          cb(ds[ds.length - 1])
        }
      } catch {
        // ignore
      }
    }
  }

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handlerBroadcast)
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('omr_tin_nhan_moi', handlerCustom)
    window.addEventListener('storage', handlerStorage)
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handlerBroadcast)
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('omr_tin_nhan_moi', handlerCustom)
      window.removeEventListener('storage', handlerStorage)
    }
  }
}

/** Đánh dấu đã đọc các tin nhắn từ đối phương gửi cho mình */
export function danhDauDocHoiThoai(nguoiDung: NguoiDungChat, doiPhuong: NguoiDungChat): void {
  const ds = docTatCaTinNhan()
  let coDoi = false
  for (const t of ds) {
    if (
      t.nguoiGui.vai === doiPhuong.vai &&
      (!doiPhuong.sbd || t.nguoiGui.sbd === doiPhuong.sbd) &&
      t.nguoiNhan.vai === nguoiDung.vai &&
      (!nguoiDung.sbd || t.nguoiNhan.sbd === nguoiDung.sbd) &&
      !t.daDoc
    ) {
      t.daDoc = true
      coDoi = true
    }
  }
  if (coDoi) {
    luuTatCaTinNhan(ds)
  }
}

/** Đếm số tin chưa đọc gửi cho một người dùng */
export function demSoTinChuaDoc(nguoiDung: NguoiDungChat): number {
  const ds = docTatCaTinNhan()
  return ds.filter(
    (t) =>
      t.nguoiNhan.vai === nguoiDung.vai &&
      (!nguoiDung.sbd || t.nguoiNhan.sbd === nguoiDung.sbd) &&
      !t.daDoc,
  ).length
}
