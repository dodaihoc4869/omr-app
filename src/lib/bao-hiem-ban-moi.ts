// LỚP BẢO HIỂM "MÁY EM ĐANG KẸT BẢN CŨ" (Boss ra lệnh P1 21/09; thầy chụp iPhone 12:13 vẫn thấy chữ của bản trước 513f408 sau ≥ 3 giờ, 8 lượt Pages).
//
// Vì sao cần: dây chuyền cũ (cap-nhat-app.ts + sw.ts) phụ thuộc VÀO service worker: nó chỉ chạy khi `registration.update()` cài xong bản mới. Precache của ta là
// TẤT-CẢ-HOẶC-KHÔNG — mạng di động yếu rớt một tệp là lượt cài hỏng, máy ở lại bản cũ mãi; iOS PWA nằm nền lại ít bắn `visibilitychange`/chạy `setInterval`.
// Lớp này KHÔNG trông vào service worker cho việc PHÁT HIỆN: tự hỏi `sw-version.json` (no-store) rồi so với `builtAt` đóng ngay trong gói JS đang chạy.
//
// Luồng (mở app · quay lại app · có mạng lại · mỗi 10 phút · vừa rời màn làm bài):
//   1. Máy chủ mới hơn gói này? Không ⇒ thôi. Có ⇒ `registration.update()` (đường bình thường: SW mới cài → chiếm quyền → trang tự tải lại, xem `tuTaiLaiKhiDoiBan`).
//   2. Sau 20 giây trang VẪN còn sống và VẪN cũ ⇒ đường bình thường đã hỏng ⇒ ÉP: xoá caches + huỷ đăng ký service worker + nạp lại bằng `?_moi=` (SW không chặn
//      đường có `_moi`, xem KHONG_DUNG trong sw.ts). Cùng cách nút "Lấy bản mới" của app thầy đã dùng (NutCapNhatApp).
//
// NĂM RÀO (mỗi rào có test + đột biến):
//   · Em đang làm bài / thầy đang mở khoá mà không giữ được phiên (`phaiHoanBanMoi`) ⇒ KHÔNG ép, chờ lượt sau (rời màn làm bài cũng gọi lại). Bài làm vốn lưu IndexedDB.
//   · KHÔNG đụng IndexedDB, localStorage, sessionStorage của bài làm/đăng nhập — chỉ CacheStorage của service worker và đăng ký SW.
//   · Mỗi `builtAt` chỉ ép tối đa 2 lần (đếm trong sessionStorage — sống qua lần nạp lại trong cùng tab): máy chủ phục vụ lệch bản cũng không thành vòng lặp.
//   · Trước khi xoá kho, kiểm mạng đưa được trang MỚI ngay lúc này (`?_moi=` no-store, phải ok); không ok ⇒ GIỮ nguyên bản cũ đang chạy được offline.
//   · Chạy thử (`builtAt` = 0, tức vite dev) ⇒ tắt hẳn.
import { BAN_DUNG_LUC_GIAY, dangKyKhiXongBai, dangLamBaiKhong, dangMoKhoaKhong, phaiHoanBanMoi } from './cap-nhat-app'
import { coGoiPhien } from './khoa-phien'

export const NHIP_BAO_HIEM_MS = 10 * 60 * 1000
export const CHO_BAN_MOI_TU_LEN_MS = 20_000
export const TOI_DA_EP_MOI_BAN = 2
/** Hai lượt kiểm liền nhau (mở app, quay lại, có mạng…) cách nhau ít nhất chừng này — chống bật tắt màn hình dồn dập. */
export const GIAN_CACH_KIEM_MS = 30_000
const KHOA_DEM = 'omr_ep_ban_moi'

export type KetQuaBaoHiem = 'chay-thu' | 'hoan' | 'loi-mang' | 'cung-ban' | 'da-ep' | 'het-luot' | 'ep-khong-duoc'

export interface MoiTruongBaoHiem {
  /** `builtAt` (giây) của gói đang chạy; 0 = chạy thử. */
  banDangChay: number
  /** `builtAt` máy chủ đang phục vụ; `null` = không hỏi được (mất mạng, sai dạng). */
  layBanMayChu: () => Promise<number | null>
  capNhatSW: () => Promise<unknown>
  /** Xoá kho + huỷ SW + nạp lại. Trả `false` khi KHÔNG ép được (mạng không đưa được trang mới) — bản cũ còn nguyên. */
  epLen: () => Promise<boolean>
  /** Em đang làm bài / thầy đang mở khoá không giữ được phiên. */
  hoan: () => boolean
  cho: (ms: number) => Promise<void>
  kho: Pick<Storage, 'getItem' | 'setItem'> | null
}

function docDem(kho: MoiTruongBaoHiem['kho'], ban: number): number {
  try {
    const o = JSON.parse(kho?.getItem(KHOA_DEM) || '{}') as Record<string, unknown>
    const n = Number(o?.[String(ban)])
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}
function ghiDem(kho: MoiTruongBaoHiem['kho'], ban: number, n: number): void {
  try {
    // Chỉ giữ bộ đếm của bản đang xét — không để tích tụ.
    kho?.setItem(KHOA_DEM, JSON.stringify({ [String(ban)]: n }))
  } catch {
    /* máy chặn lưu: mất bộ đếm, vẫn còn rào "20 giây" và "mạng phải ok" */
  }
}

/** MỘT LƯỢT KIỂM. Thuần logic (môi trường truyền vào) để test được từng nhánh. */
export async function kiemTraBanMoi(env: MoiTruongBaoHiem): Promise<KetQuaBaoHiem> {
  if (!(env.banDangChay > 0)) return 'chay-thu'
  if (env.hoan()) return 'hoan'
  const may = await env.layBanMayChu()
  if (may === null) return 'loi-mang'
  if (!(may > env.banDangChay)) return 'cung-ban'

  // Đường bình thường: SW mới cài xong → chiếm quyền → trang tự tải lại (lúc đó hàm này không còn chạy tiếp).
  await Promise.resolve(env.capNhatSW()).catch(() => undefined)
  await env.cho(CHO_BAN_MOI_TU_LEN_MS)

  // Còn sống tới đây = vẫn gói cũ. Xét lại từ đầu vì 20 giây là dài: em có thể vừa vào làm bài, máy chủ có thể vừa đổi bản nữa.
  if (env.hoan()) return 'hoan'
  const may2 = await env.layBanMayChu()
  if (may2 === null) return 'loi-mang'
  if (!(may2 > env.banDangChay)) return 'cung-ban'
  const dem = docDem(env.kho, may2)
  if (dem >= TOI_DA_EP_MOI_BAN) return 'het-luot'
  ghiDem(env.kho, may2, dem + 1)
  return (await env.epLen()) ? 'da-ep' : 'ep-khong-duoc'
}

/** ÉP LÊN BẢN MỚI: xoá MỌI kho của service worker, huỷ đăng ký, nạp lại có `_moi`. KHÔNG đụng IndexedDB/localStorage. */
export async function epLenBanMoi(
  moi: {
    fetch: (u: string, o: { cache: 'no-store' }) => Promise<{ ok: boolean }>
    caches?: { keys: () => Promise<string[]>; delete: (k: string) => Promise<boolean> }
    layDangKy: () => Promise<ReadonlyArray<{ unregister: () => Promise<boolean> }>>
    diaChi: () => string
    nap: (u: string) => void
    now: () => number
  } = {
    fetch: (u, o) => fetch(u, o),
    caches: typeof caches === 'undefined' ? undefined : caches,
    layDangKy: async () => (await navigator.serviceWorker?.getRegistrations?.()) ?? [],
    diaChi: () => location.href,
    nap: (u) => location.replace(u),
    now: () => Date.now(),
  },
): Promise<boolean> {
  const t = moi.now()
  const goc = new URL(moi.diaChi())
  goc.searchParams.set('_moi', String(t))
  // Mạng phải đưa được trang MỚI ngay lúc này; không thì đừng phá kho cũ (đang còn chạy được, cả offline).
  try {
    const r = await moi.fetch(goc.toString(), { cache: 'no-store' })
    if (!r.ok) return false
  } catch {
    return false
  }
  try {
    const ten = (await moi.caches?.keys()) ?? []
    await Promise.all(ten.map((k) => moi.caches!.delete(k).catch(() => false)))
  } catch {
    /* kho không xoá được thì vẫn huỷ SW + nạp lại; `_moi` đã vượt SW */
  }
  try {
    for (const d of await moi.layDangKy()) await d.unregister().catch(() => false)
  } catch {
    /* như trên */
  }
  moi.nap(goc.toString())
  return true
}

/** Môi trường THẬT (mạng, service worker, sessionStorage, rào làm bài có sẵn). Xuất ra để test khoá dây nối với `phaiHoanBanMoi`. */
export function moiTruongThat(): MoiTruongBaoHiem {
  const goc = import.meta.env.BASE_URL || '/'
  return {
    banDangChay: BAN_DUNG_LUC_GIAY,
    layBanMayChu: async () => {
      try {
        const r = await fetch(`${goc}sw-version.json?t=${Date.now()}`, { cache: 'no-store' })
        if (!r.ok) return null
        const n = Number(((await r.json()) as { builtAt?: unknown })?.builtAt)
        return Number.isFinite(n) && n > 0 ? n : null
      } catch {
        return null
      }
    },
    capNhatSW: async () => (await navigator.serviceWorker?.getRegistration())?.update(),
    epLen: () => epLenBanMoi(),
    hoan: () => phaiHoanBanMoi(dangLamBaiKhong(), dangMoKhoaKhong(), coGoiPhien()),
    cho: (ms) => new Promise((xong) => setTimeout(xong, ms)),
    kho: typeof sessionStorage === 'undefined' ? null : sessionStorage,
  }
}

/**
 * Bật lớp bảo hiểm: kiểm ngay lúc mở app (sau 2 giây cho khỏi tranh việc với lúc khởi động), rồi khi quay lại app, có mạng lại, hiện lại từ bộ nhớ đệm trang (iOS),
 * vừa rời màn làm bài, và mỗi 10 phút. Trả hàm gỡ (test).
 */
export function batBaoHiemBanMoi(
  env: MoiTruongBaoHiem = moiTruongThat(),
  cua: Pick<Window, 'addEventListener' | 'removeEventListener'> & { document?: Pick<Document, 'visibilityState'> } = window,
  now: () => number = () => Date.now(),
  hen: { datNhip: (f: () => void, ms: number) => number; goNhip: (id: number) => void; datHen: (f: () => void, ms: number) => number; goHen: (id: number) => void } = {
    datNhip: (f, ms) => setInterval(f, ms) as unknown as number,
    goNhip: (id) => clearInterval(id),
    datHen: (f, ms) => setTimeout(f, ms) as unknown as number,
    goHen: (id) => clearTimeout(id),
  },
): () => void {
  if (!(env.banDangChay > 0)) return () => undefined
  let dangKiem = false
  let lanCuoi = -Infinity
  const chay = (bo: boolean = false) => {
    if (dangKiem) return
    const t = now()
    if (!bo && t - lanCuoi < GIAN_CACH_KIEM_MS) return
    lanCuoi = t
    dangKiem = true
    void kiemTraBanMoi(env)
      .catch(() => undefined)
      .finally(() => {
        dangKiem = false
      })
  }
  const khiHienLai = () => {
    if (cua.document?.visibilityState === 'hidden') return
    chay()
  }
  const khiPageShow = () => chay()
  cua.addEventListener('visibilitychange', khiHienLai)
  cua.addEventListener('focus', khiHienLai)
  cua.addEventListener('pageshow', khiPageShow)
  cua.addEventListener('online', khiPageShow)
  const goXongBai = dangKyKhiXongBai(() => chay(true))
  const nhip = hen.datNhip(() => chay(true), NHIP_BAO_HIEM_MS)
  const mo = hen.datHen(() => chay(true), 2000)
  return () => {
    cua.removeEventListener('visibilitychange', khiHienLai)
    cua.removeEventListener('focus', khiHienLai)
    cua.removeEventListener('pageshow', khiPageShow)
    cua.removeEventListener('online', khiPageShow)
    goXongBai()
    hen.goNhip(nhip)
    hen.goHen(mo)
  }
}
