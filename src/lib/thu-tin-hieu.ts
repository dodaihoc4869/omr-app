// BỘ THU TÍN HIỆU — lớp mỏng gắn tám kênh vào DOM, dùng cho trang /do (Đợt 0).
//
// Mọi luật nằm ở `do-dau-vet.ts` và có test. Ở đây chỉ là dây nối: nghe sự kiện,
// đo con số, đẩy ra `onPhieu`. KHÔNG khoá gì, KHÔNG gửi gì lên máy chủ.
//
// Chuỗi gia tốc chỉ sống trong cửa sổ trượt 2 giây trong bộ nhớ máy em — đúng
// luật dữ liệu tầng đỏ: người dùng cuối là vị thành niên, không thu thập quá
// mức cần cho tính năng.
import {
  MS_CUA_SO_CHUYEN_DONG,
  MS_LECH_QUAN_SAT,
  MS_NHIP_KIEM_CO_MAN,
  MS_RAF_QUAN_SAT,
  NGUONG_XUNG_QUAN_SAT,
  nhanDangXungBop,
  type MauChuyenDong,
  type PhieuKenh,
} from './do-dau-vet'

export interface BoiCanhLucDo {
  hienTrang: boolean
  coTieuDiem: boolean
  rong: number
  cao: number
  dangChamMan: boolean
}

export interface TuyChonThu {
  onPhieu: (p: PhieuKenh, boiCanh: BoiCanhLucDo) => void
  /** Báo lại kết quả xin quyền chuyển động để màn hiện nhãn cho thầy. */
  onQuyenChuyenDong?: (cho: boolean) => void
}

/** Trạng thái quyền cảm biến chuyển động. `khong_ho_tro` = máy tính, hoặc trình
 * duyệt không có `DeviceMotionEvent`. */
export type QuyenChuyenDong = 'chua_hoi' | 'cho' | 'tu_choi' | 'khong_ho_tro'

interface CoRequestPermission {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>
}

/** iOS 13+ bắt gọi trong một cử chỉ chạm — nút "Tôi đã hiểu" chính là cử chỉ đó.
 *
 * Em từ chối là MỘT TÍN HIỆU, không phải ngõ cụt: chỗ gọi ghi lại và hiện nhãn
 * vàng cho thầy, chứ không im lặng bỏ qua kênh 8. */
export async function xinQuyenChuyenDong(): Promise<QuyenChuyenDong> {
  if (typeof DeviceMotionEvent === 'undefined') return 'khong_ho_tro'
  const d = DeviceMotionEvent as unknown as CoRequestPermission
  if (typeof d.requestPermission !== 'function') return 'cho'
  try {
    return (await d.requestPermission()) === 'granted' ? 'cho' : 'tu_choi'
  } catch {
    return 'tu_choi'
  }
}

/** Gắn cả tám kênh. Trả về hàm gỡ — gọi khi rời màn, kẻo gia tốc kế chạy mãi. */
export function thuTinHieu(o: TuyChonThu): () => void {
  const bo: (() => void)[] = []
  let dangChamMan = 0

  const boiCanh = (): BoiCanhLucDo => ({
    hienTrang: document.visibilityState === 'visible',
    coTieuDiem: document.hasFocus(),
    rong: window.innerWidth,
    cao: window.innerHeight,
    // 400 ms để bao trọn một nhát cuộn — xem MS_KHONG_CHAM_QUANH_PHIEU.
    dangChamMan: performance.now() - dangChamMan < 400,
  })
  const bao = (kenh: PhieuKenh['kenh'], chiTiet: string, luc = performance.now()) => o.onPhieu({ kenh, luc, chiTiet }, boiCanh())

  const nghe = <K extends keyof WindowEventMap>(dich: Window | Document, ten: K | string, fn: EventListenerOrEventListenerObject, opt?: AddEventListenerOptions) => {
    dich.addEventListener(ten as string, fn, opt)
    bo.push(() => dich.removeEventListener(ten as string, fn, opt))
  }

  // Ghi mốc chạm màn cho kênh 8 loại nhát gõ ngón tay.
  const chamMan: number[] = []
  const ghiCham = () => {
    dangChamMan = performance.now()
    chamMan.push(dangChamMan)
    while (chamMan.length && chamMan[0] < dangChamMan - MS_CUA_SO_CHUYEN_DONG * 2) chamMan.shift()
  }
  nghe(document, 'touchstart', ghiCham, { passive: true })
  nghe(document, 'touchmove', ghiCham, { passive: true })

  // ---- KÊNH 1: ẩn trang
  nghe(document, 'visibilitychange', () => bao('an_trang', document.visibilityState === 'visible' ? 'trang hiện lại' : 'trang bị ẩn'))

  // ---- KÊNH 2: tiêu điểm
  nghe(window, 'blur', () => bao('tieu_diem', 'mất tiêu điểm'))
  nghe(window, 'focus', () => bao('tieu_diem', 'nhận lại tiêu điểm'))

  // ---- KÊNH 3: toàn màn hình
  nghe(document, 'fullscreenchange', () => bao('toan_man', document.fullscreenElement ? 'vào toàn màn hình' : 'thoát toàn màn hình'))

  // ---- KÊNH 4: kích thước. Mốc TỰ NÂNG khi cửa sổ về sau to hơn, không bao giờ
  // hạ — so diện tích chứ không so `screen.*` nên xoay ngang không bị tính là
  // thu nhỏ.
  let mocDienTich = window.innerWidth * window.innerHeight
  const kiemCo = () => {
    const nay = window.innerWidth * window.innerHeight
    if (nay > mocDienTich) {
      mocDienTich = nay
      return
    }
    const tiLe = mocDienTich > 0 ? nay / mocDienTich : 1
    if (tiLe < 1) bao('kich_thuoc', `diện tích còn ${Math.round(tiLe * 100)}% mốc (${window.innerWidth}×${window.innerHeight})`)
  }
  nghe(window, 'resize', kiemCo)
  const nhip = window.setInterval(kiemCo, MS_NHIP_KIEM_CO_MAN)
  bo.push(() => window.clearInterval(nhip))

  // ---- KÊNH 7: phím chụp (máy tính)
  nghe(window, 'keyup', (e) => {
    const ev = e as KeyboardEvent
    if (ev.key === 'PrintScreen') bao('phim_chup', 'PrintScreen')
    else if (ev.shiftKey && (ev.metaKey || ev.key === 'S') && ev.metaKey) bao('phim_chup', 'Win+Shift+S')
  })

  // ---- KÊNH 5: nhịp vẽ khung. Khoảng trống rAF = trang ngừng được vẽ.
  let khungTruoc = performance.now()
  let chayRaf = true
  const dapRaf = () => {
    if (!chayRaf) return
    const nay = performance.now()
    const gap = nay - khungTruoc
    if (gap >= MS_RAF_QUAN_SAT) bao('nhip_ve', `gap ${Math.round(gap)} ms`, nay)
    khungTruoc = nay
    requestAnimationFrame(dapRaf)
  }
  requestAnimationFrame(dapRaf)
  bo.push(() => {
    chayRaf = false
  })

  // ---- KÊNH 6: lệch đồng hồ. `AudioContext` chạy trên luồng âm thanh riêng,
  // KHÔNG bị hệ điều hành đóng băng cùng luồng chính — nó là đồng hồ tham chiếu
  // duy nhất còn chạy khi trang bị treo.
  let ctx: AudioContext | null = null
  try {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as typeof AudioContext | undefined
    if (AC) ctx = new AC()
  } catch {
    ctx = null
  }
  if (ctx) {
    const c = ctx
    let mocAm = c.currentTime * 1000
    let mocChinh = performance.now()
    const soDongHo = window.setInterval(() => {
      const am = c.currentTime * 1000
      const chinh = performance.now()
      const lech = am - mocAm - (chinh - mocChinh)
      if (Math.abs(lech) >= MS_LECH_QUAN_SAT) bao('lech_dong_ho', `lệch ${Math.round(lech)} ms`, chinh)
      mocAm = am
      mocChinh = chinh
    }, 250)
    bo.push(() => {
      window.clearInterval(soDongHo)
      void c.close().catch(() => {})
    })
  }

  // ---- KÊNH 8: xung chuyển động. Cửa sổ trượt 2 giây, mảng cố định, không cấp
  // phát mới mỗi khung — kênh này không được làm tụt tốc độ cuộn.
  const mau: MauChuyenDong[] = []
  const nghiXung = (e: Event) => {
    const ev = e as DeviceMotionEvent
    const r = ev.rotationRate
    const a = ev.accelerationIncludingGravity
    if (!r && !a) return
    const nay = performance.now()
    // Xoắn quanh trục dọc: alpha (quanh z) và gamma (quanh y). Lấy biên độ lớn
    // hơn — bóp hai cạnh máy làm máy vặn quanh một trong hai trục đó.
    const xoan = Math.max(Math.abs(r?.alpha ?? 0), Math.abs(r?.gamma ?? 0)) * (Math.PI / 180)
    // Trừ trọng trường để z còn lại là gia tốc thật theo phương vuông góc màn.
    const z = Math.abs((a?.z ?? 0) - 9.81)
    mau.push({ luc: nay, xoan, z })
    while (mau.length && mau[0].luc < nay - MS_CUA_SO_CHUYEN_DONG) mau.shift()

    const kq = nhanDangXungBop(mau, chamMan, NGUONG_XUNG_QUAN_SAT)
    const moi = kq.khop[kq.khop.length - 1]
    if (moi && moi.ketThuc === nay) {
      bao('xung_chuyen_dong', `xoắn ${moi.dinhXoan.toFixed(2)} rad/s trong ${Math.round(moi.ketThuc - moi.batDau)} ms · z ${moi.dinhZ.toFixed(1)}`, nay)
    }
  }
  nghe(window, 'devicemotion', nghiXung as EventListener)

  return () => {
    for (const g of bo) g()
    bo.length = 0
  }
}
