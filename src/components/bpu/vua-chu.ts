// BÌNH PHẢN ỨNG — CHỮ TÊN VỪA Ô (thầy 10/11 «thẻ tên co vừa với tên … tên đầy đủ phải đọc được; tên dài thì tự thu cỡ chữ cho vừa, không cắt "…"»).
// Dùng cho mọi chỗ hiện tên em trên bảng chiếu (dải tên theo đội, Bảng vàng, chuỗi đúng, ô tên điểm danh, thẻ em lên bảng). Chỉ đọc / ghi cỡ chữ;
// ô đã vừa với đúng chữ + đúng bề ngang lần trước thì BỎ QUA (đọc một lượt rồi mới ghi ⇒ không đo đi đo lại cả bảng mỗi lần phòng cập nhật).

const KHOA = 'vuaChu'

/** Hạ cỡ chữ `el` từng px tới khi chữ nằm trọn bề ngang (tối thiểu `min` px). `haiDong`: thu một dòng mà nhỏ hơn 85% cỡ gốc ⇒ thử xuống hai dòng
 *  (ngắt ở dấu cách, không bẻ giữa chữ) nếu ô cha đủ cao — lấy cách nào chữ to hơn. */
export function vuaChu(el: HTMLElement, min: number, haiDong = false): void {
  el.style.fontSize = ''; el.style.whiteSpace = ''; el.style.lineHeight = ''
  const goc = parseFloat(getComputedStyle(el).fontSize) || 24
  let co = goc
  while (el.scrollWidth > el.clientWidth + 1 && co > min) { co -= 1; el.style.fontSize = `${co}px` }
  if (!haiDong || co >= goc * 0.85 || !(el.textContent ?? '').trim().includes(' ')) return
  const H = (el.parentElement?.clientHeight ?? 0) - 6
  el.style.whiteSpace = 'normal'; el.style.lineHeight = '1.04'
  let c2 = Math.min(goc, Math.floor(H / 2.1))
  el.style.fontSize = `${c2}px`
  while ((el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > H) && c2 > min) { c2 -= 1; el.style.fontSize = `${c2}px` }
  if (c2 <= co) { el.style.whiteSpace = ''; el.style.lineHeight = ''; el.style.fontSize = co === goc ? '' : `${co}px` }
}

/** Vừa chữ cho mọi phần tử khớp `chon` trong `goc`; chỉ những ô đổi chữ / đổi bề ngang / đổi cỡ gốc từ lần trước. */
export function vuaChuTrong(goc: ParentNode | null | undefined, chon: string, min: number, haiDong = false, coGoc = ''): void {
  if (!goc) return
  const ds = [...goc.querySelectorAll<HTMLElement>(chon)]
  // Đọc hết trước (một lần bố cục), rồi mới ghi.
  // Lớp của ô cha vào khoá: em vừa gửi ⇒ ô đổi lớp (chữ đậm hơn, rộng hơn) ⇒ đo lại.
  const khoa = ds.map((el) => `${el.textContent}|${el.parentElement?.className ?? ''}|${el.parentElement?.clientWidth ?? 0}|${el.parentElement?.clientHeight ?? 0}|${coGoc}`)
  ds.forEach((el, i) => { if (el.dataset[KHOA] === khoa[i]) return; vuaChu(el, min, haiDong); el.dataset[KHOA] = khoa[i] })
}

/** MỘT CỠ CHỮ CHUNG cho cả nhóm ô (10/11: dải tên theo đội — mỗi ô một cỡ trông lộn xộn): cỡ = cỡ lớn nhất mà tên DÀI NHẤT vẫn nằm trọn một dòng
 *  (không dưới `min`). Đọc hết một lượt (đo ở cỡ gốc), rồi ghi một lượt. Nhóm không đổi chữ / bề ngang / cỡ gốc ⇒ bỏ qua. */
export function vuaChuDeu(goc: ParentNode | null | undefined, chon: string, min: number, coGoc = ''): void {
  if (!goc) return
  const ds = [...goc.querySelectorAll<HTMLElement>(chon)]
  if (!ds.length) return
  const khoa = ds.map((el) => `${el.textContent}|${el.parentElement?.className ?? ''}|${el.clientWidth}`).join('¦') + `|${coGoc}`
  const dau = ds[0]!
  if (dau.dataset[KHOA] === khoa) return
  for (const el of ds) { el.style.fontSize = ''; el.style.whiteSpace = ''; el.style.lineHeight = '' }
  let co = Infinity
  for (const el of ds) {
    const g = parseFloat(getComputedStyle(el).fontSize) || 24
    co = Math.min(co, el.scrollWidth > el.clientWidth + 1 ? Math.floor(g * (el.clientWidth / el.scrollWidth)) : g)
  }
  const c = `${Math.max(min, co)}px`
  for (const el of ds) el.style.fontSize = c
  dau.dataset[KHOA] = khoa
}
