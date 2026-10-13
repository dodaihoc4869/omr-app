// ĐỆM DÙNG CHUNG GIỮA CÁC ISOLATE CÙNG COLO (khác `dem-chung.ts` = DemTTL trong MỘT isolate) (thầy 13/10 ~21:45: "tất cả mọi chỗ rút câu rất là lag, bạn tối ưu máy chủ chuyên sâu cho app hoạt động mượt mà và
// tức thì ngay và luôn"). Số đo thật giờ cao điểm 13/10 (20:52–21:37): 19.234 yêu cầu/45 phút, p99 3,75 s; đệm trong MỘT isolate (WeakMap theo D1 gốc)
// phải dựng lại ở MỖI isolate mới (giờ cao điểm nhiều isolate + mỗi lần phát hành xoá sạch) ⇒ siêu dữ liệu câu 21.982 lần/ngày × 30,7 ms, danh mục
// Hành trình 4.708 lần × 54 ms (26.000 dòng/lần). Lớp này = Cache API `caches.default`: dùng chung mọi isolate CÙNG colo, sống qua khởi động lạnh.
// LUẬT: chỉ đặt dữ liệu tính ĐƠN THUẦN từ kho câu (không dữ liệu riêng của em, không đáp án), KHOÁ theo dấu kho (`dauKhoCau`) ⇒ kho đổi là khoá đổi.
// Node test không có `caches` ⇒ mọi hàm trả null / không làm gì ⇒ đường cũ y nguyên. Lỗi Cache API ⇒ coi như trượt (không bao giờ chặn đường chính).

type CacheStorageCF = CacheStorage & { default?: Cache }

/**
 * Đệm chung của colo THẬT SỰ GHI/ĐỌC ĐƯỢC; không ⇒ null.
 * LƯU Ý (đã tra tài liệu Cloudflare 13/10): trên tên miền `*.workers.dev` Cache API TỒN TẠI nhưng mọi `put`/`match` KHÔNG có tác dụng ("Cache API operations
 * … in any *.workers.dev deployments will have no impact") — Worker của app đang chạy ở workers.dev. Vì vậy mỗi isolate DÒ MỘT LẦN (ghi một mục mồi rồi đọc
 * lại): đọc không ra ⇒ coi như không có đệm chung ⇒ mọi nơi gọi đi đường cũ, KHÔNG tốn thêm lượt nào. Gắn tên miền riêng / route cho Worker ⇒ lớp này tự bật.
 * Node test không có `caches` ⇒ null; test gán `globalThis.caches` giả để kiểm lớp này.
 */
let doCache: { c: Cache; p: Promise<boolean> } | null = null
export async function cacheChung(): Promise<Cache | null> {
  const cs = (typeof caches === 'undefined' ? undefined : caches) as CacheStorageCF | undefined
  const c = cs?.default
  if (!c) return null
  if (!doCache || doCache.c !== c) {
    const moi = `https://cache.omr/dem-chung/do/${Date.now()}-${Math.random().toString(36).slice(2)}`
    doCache = { c, p: c.put(moi, new Response('1', { headers: { 'cache-control': 'max-age=60' } })).then(() => c.match(moi)).then((r) => !!r, () => false) }
  }
  return (await doCache.p) ? c : null
}

const url = (khoa: string) => `https://cache.omr/dem-chung/${khoa.split('/').map(encodeURIComponent).join('/')}`

/** Đọc một mục; vắng / lỗi / JSON hỏng ⇒ null. */
export async function docChung<T>(khoa: string): Promise<T | null> {
  const c = await cacheChung()
  if (!c) return null
  try {
    const r = await c.match(url(khoa))
    return r ? ((await r.json()) as T) : null
  } catch {
    return null
  }
}

/** Ghi một mục, sống tối đa `giay` giây. Lỗi ⇒ bỏ qua (lần sau ghi lại). */
export async function ghiChung(khoa: string, giaTri: unknown, giay: number): Promise<void> {
  const c = await cacheChung()
  if (!c) return
  try {
    await c.put(url(khoa), new Response(JSON.stringify(giaTri), { headers: { 'content-type': 'application/json', 'cache-control': `max-age=${Math.max(1, Math.floor(giay))}` } }))
  } catch {
    /* đệm chung chỉ là tăng tốc */
  }
}

/** Ngăn (0..n-1) của một mã câu — băm FNV-1a 32 bit, tất định. */
export function nganCua(qid: string, n: number): number {
  let h = 0x811c9dc5
  for (let i = 0; i < qid.length; i++) { h ^= qid.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h % n
}
