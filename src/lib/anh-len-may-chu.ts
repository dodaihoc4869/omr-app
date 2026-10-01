// ẢNH ĐỀ LÊN KHO ẢNH MÁY CHỦ trước khi mở ca (thầy 01/10: "tối ưu để việc mở ca nhanh nhất có thể").
//
// Ảnh câu hỏi là data URL base64 nhúng trong gói ca — ca 30/09: 6,1 MB ảnh trong gói đề 6,6 MB, có mặt cả ở đề lẫn tờ đáp án. Nay:
//   1. gom mọi data URL ảnh trong đề + tờ đáp án, băm SHA-256 (trùng nội dung = một ảnh);
//   2. hỏi máy chủ ảnh nào chưa có (`/anh/co`) — ảnh của kho đề dùng lại qua các ca nên thường chỉ thiếu vài ảnh mới;
//   3. đẩy ảnh thiếu theo LÔ NHỎ (≤ ~1,5 MB/lô, 3 lô song song) — lô nhỏ chịu được mạng trường chập chờn;
//   4. thay data URL bằng `<máy chủ>/anh/<băm>` ⇒ gói ca còn ≈ 1 MB.
// Bất kỳ bước nào hỏng ⇒ ném lỗi; chỗ gọi giữ NGUYÊN gói cũ (ảnh nhúng) — mở ca không bao giờ tệ hơn trước.

const LA_ANH = (s: string) => s.length >= 64 && s.startsWith('data:image/')
const CO_LO = 1_500_000
const SONG_SONG = 3
const HAN_GIAY = 30

export async function bamChuoi(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/** Mọi data URL ảnh (không trùng) nằm ở bất kỳ đâu trong các gói. */
export function gomAnhNhung(...goi: unknown[]): string[] {
  const tap = new Set<string>()
  const di = (v: unknown): void => {
    if (typeof v === 'string') { if (LA_ANH(v)) tap.add(v); return }
    if (Array.isArray(v)) { for (const x of v) di(x); return }
    if (v && typeof v === 'object') for (const x of Object.values(v as Record<string, unknown>)) di(x)
  }
  for (const g of goi) di(g)
  return [...tap]
}

/** Bản sao gói, mọi data URL có trong `thay` đổi thành đường dẫn. */
export function thayAnh<T>(goi: T, thay: Map<string, string>): T {
  if (goi === undefined || goi === null) return goi
  return JSON.parse(JSON.stringify(goi, (_k, v) => (typeof v === 'string' && thay.has(v) ? thay.get(v) : v))) as T
}

async function goi(url: string, than: unknown): Promise<Record<string, unknown>> {
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), HAN_GIAY * 1000)
  try {
    // text/plain: không preflight trên điện thoại (cùng cách `/ca/day`); mã bí mật đi trong thân.
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify(than), signal: bo.signal })
    const j = (await r.json().catch(() => null)) as Record<string, unknown> | null
    if (!r.ok || !j || j.ok !== true) throw new Error(String(j?.error ?? `HTTP ${r.status}`))
    return j
  } finally {
    clearTimeout(hen)
  }
}

export interface KetQuaDoiAnh<B, K> {
  bank: B
  keyBank: K
  soAnh: number
  soAnhMoi: number
}

/** Đẩy ảnh thiếu lên kho ảnh rồi trả gói đã thay đường dẫn. Không có ảnh ⇒ trả nguyên gói, không gọi mạng. */
export async function doiAnhSangKho<B, K>(mayChu: string, secret: string, bank: B, keyBank: K): Promise<KetQuaDoiAnh<B, K>> {
  const goc = mayChu.replace(/\/+$/, '')
  const ds = gomAnhNhung(bank, keyBank)
  if (ds.length === 0) return { bank, keyBank, soAnh: 0, soAnhMoi: 0 }
  const bam = await Promise.all(ds.map(bamChuoi))
  const theoBam = new Map(bam.map((h, i) => [h, ds[i]]))
  const thieu = new Set<string>()
  for (let i = 0; i < bam.length; i += 1000) {
    const j = await goi(`${goc}/anh/co`, { secret, ds: bam.slice(i, i + 1000) })
    for (const h of (j.thieu as string[] | undefined) ?? []) thieu.add(h)
  }
  // Lô ≤ CO_LO ký tự; ảnh lớn hơn một lô đi lô riêng.
  const lo: { h: string; d: string }[][] = []
  let cur: { h: string; d: string }[] = [], co = 0
  for (const h of thieu) {
    const d = theoBam.get(h)
    if (!d) continue
    if (cur.length && co + d.length > CO_LO) { lo.push(cur); cur = []; co = 0 }
    cur.push({ h, d }); co += d.length
  }
  if (cur.length) lo.push(cur)
  let k = 0
  await Promise.all(Array.from({ length: Math.min(SONG_SONG, lo.length) }, async () => {
    while (k < lo.length) {
      const motLo = lo[k++]
      const j = await goi(`${goc}/anh/day`, { secret, ds: motLo })
      if (((j.da as string[] | undefined) ?? []).length !== motLo.length) throw new Error('Máy chủ chưa cất đủ ảnh')
    }
  }))
  const thay = new Map(bam.map((h, i) => [ds[i], `${goc}/anh/${h}`]))
  return { bank: thayAnh(bank, thay), keyBank: thayAnh(keyBank, thay), soAnh: ds.length, soAnhMoi: thieu.size }
}

/** Máy em: tải sẵn mọi ảnh của đề ngay khi nhận gói (trình duyệt cất theo đệm 1 năm) — mất mạng giữa bài vẫn thấy ảnh. */
export function taiSanAnhDe(goi: unknown): void {
  if (typeof Image === 'undefined') return
  const ds = new Set<string>()
  const di = (v: unknown): void => {
    if (typeof v === 'string') { if (/^https?:\/\/[^\s"]+\/anh\/[0-9a-f]{64}$/.test(v)) ds.add(v); return }
    if (Array.isArray(v)) { for (const x of v) di(x); return }
    if (v && typeof v === 'object') for (const x of Object.values(v as Record<string, unknown>)) di(x)
  }
  di(goi)
  const hang = [...ds]
  let i = 0
  const tiep = () => {
    if (i >= hang.length) return
    const img = new Image()
    img.decoding = 'async'
    img.onload = img.onerror = tiep
    img.src = hang[i++]
  }
  for (let n = 0; n < Math.min(6, hang.length); n++) tiep()
}
