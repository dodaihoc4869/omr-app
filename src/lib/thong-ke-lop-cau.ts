// THỐNG KÊ LỚP CỦA MỘT CÂU cho tờ chiếu Lên bảng (phím T, bản vẽ 28/09). Tệp nhỏ riêng để màn Gọi lên bảng nạp tĩnh được
// mà không kéo `html-phieu.ts` / tờ chiếu (nạp động) vào gói của màn.

/** Số GỘP của cả lớp cho một câu — từ bài làm của ca đã có (`baiLamCoGiayTuCa`). Không tên em, không số báo danh. */
export type ThongKeLopCau =
  | { kieu: 'pa'; bai: number; dung: string; tiLe: Record<string, number> }
  | { kieu: 'y'; bai: number; tiLe: Record<string, number> }
  | { kieu: 'so'; bai: number; dung: number; saiHay: { dap: string; tiLe: number }[] }

/** Dựng thống kê một câu từ các bài làm của lớp. Không có bài nào ⇒ `null` (dải T nói "chưa có bài làm", không bịa). */
export function thongKeLopCau(phan: string, ds: readonly { dung: boolean; chon?: string; dapAnDung?: string }[]): ThongKeLopCau | null {
  const bai = ds.length
  if (!bai) return null
  const pt = (n: number) => Math.round((n / bai) * 100)
  if (phan === 'I') {
    const dem: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 }
    for (const x of ds) { const c = String(x.chon ?? '').trim().toUpperCase(); if (c in dem) dem[c]!++ }
    const dung = String(ds.find((x) => x.dapAnDung)?.dapAnDung ?? '').trim().toUpperCase()
    return { kieu: 'pa', bai, dung, tiLe: Object.fromEntries(Object.entries(dem).map(([k, v]) => [k, pt(v)])) }
  }
  if (phan === 'II') {
    const y = ['a', 'b', 'c', 'd']
    const chuan = (s: string) => s.toUpperCase().replace(/Đ/g, 'D').replace(/[^DS]/g, '')
    const dem = [0, 0, 0, 0]
    for (const x of ds) {
      const c = chuan(String(x.chon ?? '')), d = chuan(String(x.dapAnDung ?? ''))
      for (let i = 0; i < 4; i++) if (c[i] && d[i] && c[i] === d[i]) dem[i]!++
    }
    return { kieu: 'y', bai, tiLe: Object.fromEntries(y.map((k, i) => [k, pt(dem[i]!)])) }
  }
  const sai = new Map<string, number>()
  for (const x of ds) if (!x.dung) { const c = String(x.chon ?? '').trim(); if (c) sai.set(c, (sai.get(c) ?? 0) + 1) }
  const saiHay = [...sai.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([dap, n]) => ({ dap, tiLe: pt(n) }))
  return { kieu: 'so', bai, dung: pt(ds.filter((x) => x.dung).length), saiHay }
}


/** Chỉ số GỘP một câu từ máy chủ (`/gv/thong-ke-lop-cau`, sổ su_kien_hoc — buổi chữa KHÔNG từ ca). Không tên em. */
export interface SoGopCauLop {
  bai: number
  dung: number
  coChon: number
  chon: Record<string, number>
  chonSai: Record<string, number>
}

/** Dựng thống kê dải T từ số gộp. Phần I/II cần ĐỦ đáp án chọn của mọi em mới vẽ % từng phương án / từng ý; thiếu thì lùi về
 * "Đúng x% · sai hay gặp" (không bịa phần trăm). Không em nào làm ⇒ `null` (tờ ẩn dải, báo "chưa có số liệu lớp"). */
export function thongKeTuSoGop(phan: string, g: SoGopCauLop | null | undefined, dapAnDung = ''): ThongKeLopCau | null {
  if (!g || !(g.bai > 0)) return null
  const pt = (n: number) => Math.round((n / g.bai) * 100)
  const du = g.coChon === g.bai
  if ((phan === 'I' || phan === 'II') && du && (phan === 'I' || dapAnDung)) {
    const ds = Object.entries(g.chon).flatMap(([chon, n]) => Array.from({ length: n }, () => ({ dung: false, chon, dapAnDung })))
    const t = thongKeLopCau(phan, ds)
    if (t && t.kieu === 'pa') return { ...t, dung: String(dapAnDung).trim().toUpperCase() }
    return t
  }
  const saiHay = Object.entries(g.chonSai ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([dap, n]) => ({ dap, tiLe: pt(n) }))
  return { kieu: 'so', bai: g.bai, dung: pt(g.dung), saiHay }
}
