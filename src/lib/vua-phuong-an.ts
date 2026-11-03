// PHƯƠNG ÁN VỪA VẶN (thầy 03/11, ảnh 4 phương án amino axit: «CH₃CH₂CH(NH₂)C | OOH.», «CH₃CH(NH₂)COOH | .» — «tất cả công thức kiểu này phải hiển
// thị đẹp vừa vặn»). Gốc lỗi: nội dung phương án có `overflow-wrap: break-word` ⇒ một TỪ (công thức viết liền, kể cả dấu chấm cuối) dài hơn ô thì trình duyệt
// cắt ngay giữa công thức. Cách sửa: đo mỗi nhóm phương án với `overflow-wrap: normal` — từ nào tràn ô?
//   1) tràn ít (thu cỡ chữ ≥ CO_LUOI là vừa) ⇒ thu CỠ CHỮ CẢ NHÓM cùng một hệ số (bốn phương án cùng cỡ, không lệch nhau);
//   2) lưới 2 cột mà phải thu nhiều hơn ⇒ chuyển 1 cột rồi đo lại;
//   3) 1 cột vẫn tràn ⇒ thu tới CO_MIN; dài hơn nữa (hiếm) ⇒ để trình duyệt ngắt như cũ (không bao giờ tràn khỏi ô).
// Đọc hết rồi mới ghi (một lượt tính bố cục mỗi lần đo); đo lại khi khung đổi bề rộng, nội dung đổi (KaTeX nạp lười thay chỗ giữ), phông web nạp xong.
/** Nội dung phương án: màn Kính (LamCau.tsx) · thẻ câu màn thi / kiểm tra (TheCau.tsx). */
const CHU = '.ht2-lam-pa-chu, .pa-noi-dung'
/** Lưới 2 cột: thu cỡ chữ tối đa tới đây (dưới nữa ⇒ đổi 1 cột cho chữ to, dễ đọc). */
export const CO_LUOI = 0.86
/** Cỡ chữ nhỏ nhất so với cỡ gốc. */
export const CO_MIN = 0.72

/** Hệ số cỡ chữ cho cả nhóm từ tỉ lệ (bề rộng ô / bề rộng chữ cần) của từng phương án: 1 = không thu; < sàn ⇒ null (không đủ chỗ ở sàn này). */
export function heSoCo(tiLe: readonly number[], san: number): number | null {
  const k = Math.min(1, ...tiLe.filter((x) => x > 0 && Number.isFinite(x)))
  if (k >= 1) return 1
  const kk = Math.floor(k * 0.99 * 100) / 100
  return kk >= san ? kk : null
}

const doTiLe = (ds: HTMLElement[]): number[] => ds.map((e) => (e.scrollWidth > e.clientWidth + 0.5 && e.clientWidth > 0 ? e.clientWidth / e.scrollWidth : 1))
/** Lúc đo: công thức viết liền KHÔNG được cắt (thấy từ nào tràn ô) — kiểu đặt thẳng lên phần tử rồi trả lại (không thêm luật CSS vào tờ kiểu chung). */
const datDo = (ds: HTMLElement[], bat: boolean): void => { for (const e of ds) e.style.setProperty('overflow-wrap', bat ? 'normal' : '', bat ? 'important' : '') }

/** Căn NHIỀU nhóm phương án một lượt (màn thi vẽ hàng chục câu): ghi hết → đọc hết → ghi hết ⇒ 1–2 lượt tính bố cục cho cả trang, không phải mỗi câu một lượt.
 *  Lưới 2 cột (đọc số cột THẬT của khung — mọi luật CSS: data-luoi, chặng ngang, tranh phân tử…) phải thu quá CO_LUOI ⇒ ép 1 cột (kiểu thẳng trên khung). */
export function vuaNhieu(ds0: Iterable<HTMLElement>): void {
  const nhom = Array.from(ds0, (khung) => ({ khung, ds: Array.from(khung.querySelectorAll<HTMLElement>(CHU)), hai: false, k: 1 as number | null }))
    .filter((n) => n.ds.length && n.khung.isConnected)
  for (const n of nhom) { for (const e of n.ds) e.style.fontSize = ''; n.khung.style.gridTemplateColumns = ''; datDo(n.ds, true) }
  for (const n of nhom) { n.hai = getComputedStyle(n.khung).gridTemplateColumns.trim().split(/\s+/).length > 1; n.k = heSoCo(doTiLe(n.ds), n.hai ? CO_LUOI : CO_MIN) }
  const doi = nhom.filter((n) => n.k === null && n.hai)
  for (const n of doi) n.khung.style.gridTemplateColumns = 'minmax(0,1fr)'
  for (const n of doi) n.k = heSoCo(doTiLe(n.ds), CO_MIN)
  const co = nhom.map((n) => (n.k !== null && n.k < 1 ? n.ds.map((e) => parseFloat(getComputedStyle(e).fontSize) || 0) : null))
  nhom.forEach((n, i) => {
    datDo(n.ds, false)
    const c = co[i]
    if (c) n.ds.forEach((e, j) => { if (c[j]) e.style.fontSize = `${(c[j]! * n.k!).toFixed(2)}px` }) // vừa sẵn / dài quá sàn ⇒ để như cũ
  })
}

/** Căn một nhóm phương án `khung` cho vừa ô. */
export function vuaPhuongAn(khung: HTMLElement): void { vuaNhieu([khung]) }

const cho = new Set<HTMLElement>()
let hen = 0
/** Hẹn đo `khung` ở khung hình kế — gộp mọi nhóm cùng hẹn vào một lượt. */
function henDo(khung: HTMLElement): void {
  cho.add(khung)
  if (hen) return
  hen = requestAnimationFrame(() => { hen = 0; const ds = [...cho]; cho.clear(); vuaNhieu(ds) })
}

/** Gắn căn phương án cho một `khung`. Trả hàm gỡ. */
export function ganVua(khung: HTMLElement): () => void {
  if (typeof ResizeObserver !== 'function' || typeof requestAnimationFrame !== 'function') return () => {}
  let rong = -1
  const ro = new ResizeObserver((ds) => { const r = ds[0]?.contentRect.width ?? -1; if (r !== rong) { rong = r; henDo(khung) } }) // chỉ khi đổi BỀ RỘNG (đổi cỡ chữ đổi chiều cao — không lặp)
  ro.observe(khung)
  const mo = typeof MutationObserver === 'function' ? new MutationObserver(() => henDo(khung)) : null
  mo?.observe(khung, { subtree: true, childList: true, characterData: true })
  const phong = () => henDo(khung)
  document.fonts?.addEventListener?.('loadingdone', phong)
  return () => { cho.delete(khung); ro.disconnect(); mo?.disconnect(); document.fonts?.removeEventListener?.('loadingdone', phong) }
}

/** Khung nhóm phương án: màn Kính `.ht2-lam-tn`; thẻ câu (TheCau) = hộp cha của các `.pa-hang`. */
const timKhung = (goc: ParentNode, ra: Set<HTMLElement>): void => {
  if (goc instanceof HTMLElement && goc.matches('.ht2-lam-tn')) ra.add(goc)
  if (goc instanceof HTMLElement && goc.matches('.pa-hang') && goc.parentElement) ra.add(goc.parentElement)
  goc.querySelectorAll?.<HTMLElement>('.ht2-lam-tn').forEach((e) => ra.add(e))
  goc.querySelectorAll?.<HTMLElement>('.pa-hang').forEach((e) => { if (e.parentElement) ra.add(e.parentElement) })
}
let daGan = false
/** TỰ DÒ mọi nhóm phương án trên trang (có sẵn + vẽ thêm về sau) và căn từng nhóm. Gọi từ mảnh NẠP LƯỜI sau khi mở app — src/components/cong-hs-nap-luoi.ts
 *  (app học sinh), src/lib/do-treo-may-thi.ts (màn thi) — nên lượt tải mở app không mang thêm byte nào (luật tốc độ). Gọi lại ⇒ không làm gì. */
export function ganToanTrang(): void {
  if (daGan || typeof document === 'undefined' || typeof MutationObserver !== 'function') return
  daGan = true
  const dang = new Map<HTMLElement, () => void>()
  const quet = (goc: ParentNode) => { const ra = new Set<HTMLElement>(); timKhung(goc, ra); for (const k of ra) if (!dang.has(k)) dang.set(k, ganVua(k)) }
  quet(document)
  new MutationObserver((ds) => {
    let bot = false
    for (const d of ds) { for (const n of d.addedNodes) if (n.nodeType === 1) quet(n as Element); if (d.removedNodes.length) bot = true }
    if (bot) for (const [k, go] of dang) if (!k.isConnected) { go(); dang.delete(k) }
  }).observe(document.body, { childList: true, subtree: true })
}
