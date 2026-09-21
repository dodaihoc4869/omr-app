// TÊN GỌI NGẮN của em trong một khối của Bảng tin sàn: HAI CHỮ CUỐI ("Thanh Thảo") — không cắt đuôi bằng "…" (mất đúng chữ dùng để gọi em). Hai em khác nhau mà trùng tên gọi ⇒ thêm chữ đứng trước
// cho tới khi khác nhau (tối đa cả họ tên). Cùng một em xuất hiện hai lần (vd Dẫn đầu và Tiến bộ nhất) không tính là trùng.
export interface EmTen {
  sbd: string
  hoTen: string
}

const chu = (hoTen: string): string[] => hoTen.trim().split(/\s+/).filter(Boolean)

/** `sbd` → tên gọi. Em không có chữ nào ⇒ tên gọi rỗng (nơi dùng lấy sbd). */
export function tenGoiKhongTrung(ds: readonly EmTen[]): Map<string, string> {
  const em = new Map<string, string[]>()
  for (const e of ds) if (!em.has(e.sbd)) em.set(e.sbd, chu(e.hoTen))
  const n = new Map<string, number>([...em].map(([sbd, w]) => [sbd, Math.min(2, w.length)]))
  const goi = (sbd: string): string => em.get(sbd)!.slice(-(n.get(sbd) || 0)).join(' ')
  for (let vong = 0; vong < 12; vong++) {
    const nhom = new Map<string, string[]>()
    for (const sbd of em.keys()) {
      const k = goi(sbd).toLocaleLowerCase('vi')
      nhom.set(k, [...(nhom.get(k) ?? []), sbd])
    }
    let doi = false
    for (const sbds of nhom.values()) {
      if (sbds.length < 2) continue
      for (const sbd of sbds) {
        const w = em.get(sbd)!
        if ((n.get(sbd) ?? 0) < w.length) { n.set(sbd, (n.get(sbd) ?? 0) + 1); doi = true }
      }
    }
    if (!doi) break
  }
  return new Map([...em.keys()].map((sbd) => [sbd, goi(sbd)]))
}
