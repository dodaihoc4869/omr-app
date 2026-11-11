// XEM LẠI LIVE — TỰ ĐẶT TÊN (đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.6). Thuần. Máy chủ (lúc chốt) và máy khách (danh sách, đổi tên có xem trước) dùng chung.
// Không sinh chữ mới, không bịa: tên bài và tên dạng lấy từ kho; không tra được thì dùng «Buổi live <lớp>» / bỏ khúc giữa.

const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const gon = (s: unknown): string => String(s ?? '').replace(/\s+/g, ' ').trim()

/** «Thứ Ba 10/11» từ `YYYY-MM-DD` (ngày Việt Nam). Sai dạng ⇒ ''. */
export function thuNgay(ngay: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngay)
  if (!m) return ''
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return Number.isNaN(d.getTime()) ? '' : `${THU[d.getUTCDay()]} ${m[3]}/${m[2]}`
}

/** Tên bài tự động từ các câu ĐÃ chiếu: bài nhiều câu nhất; hai bài «A + B»; từ ba bài «A và 2 bài khác»; không tra được bài «Buổi live 12A1». */
export function tenBaiTuDong(cau: readonly { bai: string }[], lop: string): string {
  const dem = new Map<string, number>()
  for (const c of cau) { const b = gon(c.bai); if (b) dem.set(b, (dem.get(b) ?? 0) + 1) }
  // Map giữ thứ tự gặp đầu ⇒ hoà số câu thì bài chiếu trước đứng trước.
  const xep = [...dem.entries()].map(([ten, n], i) => ({ ten, n, i })).sort((a, b) => b.n - a.n || a.i - b.i)
  if (!xep.length) return gon(`Buổi live ${gon(lop)}`)
  if (xep.length === 1) return xep[0]!.ten
  if (xep.length === 2) return `${xep[0]!.ten} + ${xep[1]!.ten}`
  return `${xep[0]!.ten} và ${xep.length - 1} bài khác`
}

export const TEN_THAY_TOI_DA = 80
/** Tên thầy đặt: gọn khoảng trắng, tối đa 80 ký tự; xoá trắng ⇒ null (về tên tự động). */
export function chuanTenThay(v: unknown): string | null {
  const s = gon(v).slice(0, TEN_THAY_TOI_DA).trim()
  return s || null
}
/** Phần tên của buổi: tên thầy đặt nếu có, không thì tên tự động. */
export const phanTenBuoi = (b: { tenTuDong: string; tenThay: string | null }): string => chuanTenThay(b.tenThay) ?? gon(b.tenTuDong)
export const soPhut = (giay: number): number => Math.max(1, Math.round(Math.max(0, giay) / 60))

/** Dòng tên đầy đủ: `<Thứ> <dd/mm> · <lớp> · <tên bài> · <N> câu · <M> phút`. Ngày, lớp, số liệu LUÔN tự ghép (thầy chỉ sửa phần tên). */
export function tenBuoiDayDu(b: { ngay: string; lop: string; tenTuDong: string; tenThay: string | null; soCau: number; giayLive: number }): string {
  return [thuNgay(b.ngay), gon(b.lop), phanTenBuoi(b), `${Math.max(0, Math.round(b.soCau))} câu`, `${soPhut(b.giayLive)} phút`].filter(Boolean).join(' · ')
}

/** Tên gọi hai chữ cuối của em («Nguyễn Thị Minh Anh» ⇒ «Minh Anh»). */
export const tenGoi = (ten: string): string => { const p = gon(ten).split(' '); return p.slice(-2).join(' ') || gon(ten) }

/** Tên đoạn: `Câu <n> · <tên dạng> · <tên gọi> lên bảng` · không gọi ai «… · Thầy chữa» · chưa có tên dạng thì bỏ khúc giữa · phần 2 trở đi thêm «(phần 2)». */
export function tenDoan(d: { so: number; dang: string; loai: 'len_bang' | 'thay_chua'; tenEm?: string | null; phan?: number }): string {
  const cuoi = d.loai === 'len_bang' && gon(d.tenEm) ? `${tenGoi(gon(d.tenEm))} lên bảng` : 'Thầy chữa'
  const ten = [`Câu ${d.so}`, gon(d.dang), cuoi].filter(Boolean).join(' · ')
  return (d.phan ?? 1) >= 2 ? `${ten} (phần ${d.phan})` : ten
}
/** Số câu ở đầu tên đoạn («Câu 3 · …» ⇒ 3); không đúng dạng ⇒ 0. */
export const soCauTuTenDoan = (ten: string): number => { const m = /^Câu (\d+)(?: |$)/.exec(String(ten ?? '')); return m ? Number(m[1]) : 0 }

/** Dung lượng cho người đọc: «121 MB», «0,9 MB», «640 KB». */
export function chuDungLuong(byte: number): string {
  const b = Math.max(0, Number(byte) || 0)
  if (b >= 10 * 1024 * 1024) return `${Math.round(b / 1048576)} MB`
  if (b >= 1024 * 1024) return `${(Math.round(b / 104857.6) / 10).toFixed(1).replace('.', ',')} MB`
  return `${Math.max(b > 0 ? 1 : 0, Math.round(b / 1024))} KB`
}
