// LỊCH SỬ CA KIỂM TRA của em trên Sảnh bản đồ (thầy lệnh 28/09: "app học sinh cần có chỗ hiển thị điểm ca thi gần nhất, bấm vào
// hiện lịch sử các ca, bấm từng ca hiện báo cáo chi tiết"). THUẦN: nhận đúng khuôn `/hs/lich-su` (items = ca ĐÃ công bố,
// `chuaCongBo[]` = ca chưa công bố — luật `cong-bo-diem.ts` phía máy chủ), trả dữ liệu để VẼ. Không gọi mạng, không bịa số.
// Ca chưa công bố: KHÔNG điểm, KHÔNG số câu — kể cả nếu ai lỡ nhét vào.
import { soVn } from './ket-qua-sau-nop'
import { gioDayDu } from './ngay-gio-24'
import { tenCaThe } from './the-ca-gan-nhat'

export interface CaDaCongBoHs {
  maCa: string
  tenCa?: string
  nopLuc?: string
  tong?: number | null
  soCauDung?: number | null
  tongCau?: number | null
  [k: string]: unknown
}
export interface CaChuaCongBoHs {
  maCa: string
  tenCa?: string
  nopLuc?: string
  [k: string]: unknown
}

export type DongLichSuCa =
  | {
      kieu: 'da_cong_bo'
      maCa: string
      ten: string
      nopLuc: string
      /** "09:42 · Thứ Bảy 26/09/2026"; mốc hỏng ⇒ "". */
      gio: string
      diem: number
      /** "7,25" */
      chuDiem: string
      /** Số câu đúng TRỌN / tổng — chỉ khi đủ hai số hợp lệ. */
      dung: number | null
      tong: number | null
      /** Chênh điểm so với ca ĐÃ CÔNG BỐ liền trước (cũ hơn); null = ca đầu tiên. */
      xuHuong: number | null
      /** Dòng gốc của máy chủ — chuyển nguyên cho báo cáo chi tiết. */
      goc: CaDaCongBoHs
    }
  | { kieu: 'cho_cong_bo'; maCa: string; ten: string; nopLuc: string; gio: string }

const so = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const ms = (s: unknown): number => (typeof s === 'string' && s.trim() ? Date.parse(s) : NaN)
const mocXep = (s: unknown): number => (Number.isFinite(ms(s)) ? ms(s) : -Infinity)

/** "26/09" giờ Việt Nam; mốc hỏng ⇒ "". */
export function ngayThangVn(moc: unknown): string {
  const t = ms(moc)
  if (!Number.isFinite(t)) return ''
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit' }).formatToParts(new Date(t))
  const d = p.find((x) => x.type === 'day')?.value ?? ''
  const m = p.find((x) => x.type === 'month')?.value ?? ''
  return d && m ? `${d}/${m}` : ''
}

/** Mỗi ca một dòng (lấy lượt nộp muộn nhất), mới nhất trên cùng; ca chưa công bố xen đúng chỗ theo giờ nộp. */
export function dungLichSuCa(daCongBo: readonly CaDaCongBoHs[] | null | undefined, chuaCongBo: readonly CaChuaCongBoHs[] | null | undefined): DongLichSuCa[] {
  const da = new Map<string, CaDaCongBoHs>()
  for (const c of daCongBo ?? []) {
    if (!c || !c.maCa || so(c.tong) === null) continue
    const cu = da.get(c.maCa)
    if (!cu || mocXep(c.nopLuc) > mocXep(cu.nopLuc)) da.set(c.maCa, c)
  }
  const cho = new Map<string, CaChuaCongBoHs>()
  for (const c of chuaCongBo ?? []) if (c && c.maCa && !da.has(c.maCa) && !cho.has(c.maCa)) cho.set(c.maCa, c)

  // Ca đã công bố, cũ → mới, để tính xu hướng so với ca liền trước.
  const daXep = [...da.values()].sort((a, b) => mocXep(a.nopLuc) - mocXep(b.nopLuc))
  const dongDa: DongLichSuCa[] = daXep.map((c, i) => {
    const diem = so(c.tong)!
    const truoc = i > 0 ? so(daXep[i - 1]!.tong) : null
    const dung = so(c.soCauDung)
    const tong = so(c.tongCau)
    const hopLe = dung !== null && tong !== null && tong > 0 && dung >= 0 && dung <= tong
    return {
      kieu: 'da_cong_bo',
      maCa: c.maCa,
      ten: tenCaThe(c.maCa, c.tenCa),
      nopLuc: c.nopLuc ?? '',
      gio: gioDayDu(c.nopLuc, ''),
      diem,
      chuDiem: soVn(diem),
      dung: hopLe ? dung : null,
      tong: hopLe ? tong : null,
      xuHuong: truoc === null ? null : Math.round((diem - truoc) * 100) / 100,
      goc: c,
    }
  })
  const dongCho: DongLichSuCa[] = [...cho.values()].map((c) => ({ kieu: 'cho_cong_bo', maCa: c.maCa, ten: tenCaThe(c.maCa, c.tenCa), nopLuc: c.nopLuc ?? '', gio: gioDayDu(c.nopLuc, '') }))
  // Mới nhất trên cùng; hoà giờ ⇒ ca đã công bố trước.
  return [...dongDa, ...dongCho].sort((a, b) => mocXep(b.nopLuc) - mocXep(a.nopLuc) || (a.kieu === 'da_cong_bo' ? -1 : 1) - (b.kieu === 'da_cong_bo' ? -1 : 1))
}

/** Chữ thẻ nhỏ trên Sảnh: CHỈ ca đã công bố. `null` = đang tải/chưa biết (không vẽ số). */
export function chuTheCaGanNhat(ds: readonly DongLichSuCa[]): { chu: string; coDiem: boolean } {
  const c = ds.find((x) => x.kieu === 'da_cong_bo')
  if (!c || c.kieu !== 'da_cong_bo') return { chu: 'Chưa có ca đã công bố', coDiem: false }
  const ngay = ngayThangVn(c.nopLuc)
  return { chu: `Ca kiểm tra gần nhất: ${c.chuDiem} điểm${ngay ? ` · ${ngay}` : ''}`, coDiem: true }
}
