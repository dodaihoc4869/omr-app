// THẺ "CA KIỂM TRA GẦN NHẤT CỦA CON" ở đầu Bảng nhiệm vụ phụ huynh (thầy lệnh 21/09 ~12:40; mẫu docs/ban-ve-xem-diem-2109/ph-3-the-ca-gan-nhat.html, Boss soát ĐẠT).
// THUẦN: nhận lịch sử ca ĐÃ CÔNG BỐ (`/hs/lich-su` items) + ca CHƯA công bố (`chuaCongBo[]` của máy chủ, luật `cong-bo-diem.ts`), trả DUY NHẤT dữ liệu để vẽ thẻ.
// Ca gần nhất = nộp muộn nhất trong CẢ HAI danh sách. Ca chưa công bố ⇒ thẻ trung tính: KHÔNG điểm, KHÔNG số câu, KHÔNG phần (kể cả nếu ai lỡ nhét vào).
// Chỉ nói số THẬT: thiếu thì bỏ dòng đó (không bịa). Ba phần hiện SỐ ĐIỂM từng phần (chưa có trần điểm từng phần ⇒ chưa vẽ thanh — chờ máy chủ trả `toiDa`).
import { soSanhLanTruoc } from './ket-qua-sau-nop'

export interface CaDaCongBo {
  maCa: string
  tenCa?: string
  nopLuc?: string
  tong?: number | null
  diemI?: number | null
  diemII?: number | null
  diemIII?: number | null
  soCauDung?: number | null
  tongCau?: number | null
}
export interface CaChuaCongBo {
  maCa: string
  tenCa?: string
  nopLuc?: string
  /** `ca_lop_xong` (chờ cả lớp nộp) · `khong` (thầy chưa công bố). */
  congBo?: string
  soEmDaNop?: number | null
  soEmDaVao?: number | null
}

export type TheCaGanNhat =
  | {
      kieu: 'da_cong_bo'
      maCa: string
      tenCa: string
      nopLuc: string
      diem: number
      dung: number | null
      tong: number | null
      /** `undefined` = ẨN chip (có ca trước chưa công bố nên không nói "ca đầu tiên"); `null` = ca đầu tiên; số = chênh so với lần trước đã công bố. */
      ss: { hieu: number; truoc: number } | null | undefined
      phan: { ma: 'I' | 'II' | 'III'; ten: string; diem: number }[]
    }
  | { kieu: 'ca_lop' | 'khong'; maCa: string; tenCa: string; nopLuc: string; nop: number | null; si: number | null }

const so = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const ms = (s: unknown): number => (typeof s === 'string' && s.trim() ? Date.parse(s) : NaN)
/** Tên ca không có thì nói "Ca kiểm tra mã <mã>" (mã ca không được làm TÊN — chuẩn từ ngữ). */
export const tenCaThe = (maCa: string, tenCa?: string): string => {
  const t = (tenCa ?? '').trim()
  return t && t !== `Ca ${maCa}` ? t : `Ca kiểm tra mã ${maCa}`
}

/** Chọn ca gần nhất + dựng dữ liệu thẻ; chưa có ca nào ⇒ `null` (không vẽ thẻ). */
export function chonTheCaGanNhat(daCongBo: readonly CaDaCongBo[], chuaCongBo: readonly CaChuaCongBo[]): TheCaGanNhat | null {
  type Ung = { moc: number; da?: CaDaCongBo; chua?: CaChuaCongBo }
  const ung: Ung[] = [
    ...daCongBo.filter((c) => c && c.maCa).map((c): Ung => ({ moc: ms(c.nopLuc), da: c })),
    ...chuaCongBo.filter((c) => c && c.maCa).map((c): Ung => ({ moc: ms(c.nopLuc), chua: c })),
  ]
  if (ung.length === 0) return null
  // Mốc hợp lệ trước (muộn nhất trước); mốc hỏng xuống cuối; hoà ⇒ ca ĐÃ công bố trước (có gì để hiện hơn).
  ung.sort((a, b) => (Number.isFinite(b.moc) ? b.moc : -Infinity) - (Number.isFinite(a.moc) ? a.moc : -Infinity) || (a.da ? -1 : 1) - (b.da ? -1 : 1))
  const dau = ung[0]!
  if (dau.chua) {
    const c = dau.chua
    return { kieu: c.congBo === 'ca_lop_xong' ? 'ca_lop' : 'khong', maCa: c.maCa, tenCa: tenCaThe(c.maCa, c.tenCa), nopLuc: c.nopLuc ?? '', nop: so(c.soEmDaNop), si: so(c.soEmDaVao) }
  }
  const c = dau.da!
  const diem = so(c.tong)
  if (diem === null) return null // đã công bố mà không có điểm: không đoán
  const truoc = soSanhLanTruoc(
    daCongBo.flatMap((x) => (so(x.tong) !== null && x.nopLuc ? [{ maCa: x.maCa, ngay: x.nopLuc, tong: x.tong as number }] : [])),
    c.maCa,
    c.nopLuc,
    diem,
  )
  // Có ca CHƯA công bố nộp TRƯỚC ca này ⇒ không dám nói "ca đầu tiên" (ẩn chip).
  const coChuaTruoc = chuaCongBo.some((x) => Number.isFinite(ms(x.nopLuc)) && ms(x.nopLuc) < ms(c.nopLuc))
  const ss = truoc ?? (coChuaTruoc ? undefined : null)
  const dung = so(c.soCauDung)
  const tong = so(c.tongCau)
  const phan = (
    [
      ['I', 'Phần I', so(c.diemI)],
      ['II', 'Phần II', so(c.diemII)],
      ['III', 'Phần III', so(c.diemIII)],
    ] as const
  ).flatMap(([ma, ten, d]) => (d === null ? [] : [{ ma, ten, diem: d }]))
  return {
    kieu: 'da_cong_bo',
    maCa: c.maCa,
    tenCa: tenCaThe(c.maCa, c.tenCa),
    nopLuc: c.nopLuc ?? '',
    diem,
    // Số câu chỉ khi CÓ ĐỦ hai số hợp lệ (đúng ≤ tổng, tổng > 0); thiếu ⇒ ẩn dòng "đúng x/y câu".
    dung: dung !== null && tong !== null && tong > 0 && dung >= 0 && dung <= tong ? dung : null,
    tong: dung !== null && tong !== null && tong > 0 && dung >= 0 && dung <= tong ? tong : null,
    ss,
    phan,
  }
}
