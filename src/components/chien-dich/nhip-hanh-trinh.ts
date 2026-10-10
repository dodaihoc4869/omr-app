// NHỊP HÀNH TRÌNH — phép tính THUẦN dùng chung cho màn Hành trình (`HanhTrinhV2`) và màn Hôm nay của thầy (`GvHomNayScreen`, 09/10).
// Tách khỏi HanhTrinhV2 để màn Hôm nay không phải tải cả mảnh Hành trình (cây kho DẠY HỌC, bảng em…). Không IO.
import type { BangChienDich, ChienDichTom } from './api'

export type EmNhip = NonNullable<BangChienDich['hanhTrinhNgay']>['em'][number]

/** Khối từ nhãn lớp của hành trình ("Khối 12") — không đọc được ⇒ null. */
export function khoiCuaHanhTrinh(cd: Pick<ChienDichTom, 'lop' | 'ten'>): '10' | '11' | '12' | null {
  const m = /(1[012])/.exec(`${cd.lop ?? ''} ${cd.ten}`)
  return m ? (m[1] as '10' | '11' | '12') : null
}

/** Bốn chỉ số đếm được từ bảng hôm nay (không suy diễn): đủ mức · chưa làm · thiếu câu phù hợp · tầng Vận dụng trở lên. */
export function chiSoNhip(em: readonly EmNhip[]) {
  const coMuc = em.filter((e) => e.toiThieu !== null && e.toiThieu > 0)
  return {
    tong: em.length,
    duMuc: coMuc.filter((e) => e.daLam >= (e.toiThieu ?? 0)).length,
    coMuc: coMuc.length,
    chuaLam: em.filter((e) => e.daLam === 0).length,
    thieuCau: em.filter((e) => e.conThieu > 0).length,
    tangCao: em.filter((e) => (e.tang ?? 0) >= 3).length,
  }
}
export type ChiSoNhip = ReturnType<typeof chiSoNhip>

// ------------------------------------------------------------------ THẺ NHỊP HỌC (thầy 09/10 khuya)
// "hành trình để lại chỗ nhịp học, học sinh chưa làm và chưa hoàn thành đủ ưu tiên hiện lên đầu nhé". Bốn nhóm, đúng thứ tự trên màn:
//   · Chưa làm câu nào — daLam = 0 (KỂ CẢ em chưa có mức tối thiểu: cùng phép đếm `chiSoNhip.chuaLam` mà Hôm nay ghi "N em chưa làm câu nào
//     hôm nay" ⇒ bấm "Xem danh sách" thấy đúng N em ở nhóm đầu — một con số ở mọi nơi). Em có mức đứng trước em chưa có mức, rồi theo tên.
//   · Chưa đủ mức — có mức, 0 < daLam < toiThieu; ít câu nhất đứng trước, rồi theo tên.
//   · Đủ mức — có mức, daLam ≥ toiThieu; ít câu nhất đứng trước, rồi theo tên.
//   · Chưa có mức hôm nay — toiThieu null/0 mà đã làm ít nhất một câu (không xếp chung "Đủ mức": chưa có mức thì không nói là đủ).
export type LoaiNhomNhip = 'chua-lam' | 'chua-du' | 'du' | 'chua-co-muc'
export const THU_TU_NHOM_NHIP: readonly LoaiNhomNhip[] = ['chua-lam', 'chua-du', 'du', 'chua-co-muc']
export const TEN_NHOM_NHIP: Record<LoaiNhomNhip, string> = {
  'chua-lam': 'Chưa làm câu nào',
  'chua-du': 'Chưa đủ mức',
  du: 'Đủ mức',
  'chua-co-muc': 'Chưa có mức hôm nay',
}

type EmXep = Pick<EmNhip, 'sbd' | 'ten' | 'daLam' | 'toiThieu'>
/** Em có mức tối thiểu hôm nay (cùng điều kiện `coMuc` của `chiSoNhip`). */
export const coMucNhip = (e: Pick<EmNhip, 'toiThieu'>): boolean => e.toiThieu !== null && e.toiThieu > 0

export function nhomNhipCuaEm(e: EmXep): LoaiNhomNhip {
  if (e.daLam <= 0) return 'chua-lam'
  if (!coMucNhip(e)) return 'chua-co-muc'
  return e.daLam >= (e.toiThieu ?? 0) ? 'du' : 'chua-du'
}

const theoTen = (a: EmXep, b: EmXep) => (a.ten || a.sbd).localeCompare(b.ten || b.sbd, 'vi') || a.sbd.localeCompare(b.sbd)

/** Chia em thành các nhóm ưu tiên (bỏ nhóm rỗng), đúng thứ tự `THU_TU_NHOM_NHIP`. Thuần — test gọi thẳng. */
export function xepNhomNhip<T extends EmXep>(em: readonly T[]): { loai: LoaiNhomNhip; em: T[] }[] {
  const nhom = new Map<LoaiNhomNhip, T[]>(THU_TU_NHOM_NHIP.map((l) => [l, []]))
  for (const e of em) nhom.get(nhomNhipCuaEm(e))!.push(e)
  return THU_TU_NHOM_NHIP.map((loai) => {
    const ds = nhom.get(loai)!
    ds.sort(loai === 'chua-lam' ? (a, b) => Number(coMucNhip(b)) - Number(coMucNhip(a)) || theoTen(a, b) : (a, b) => a.daLam - b.daLam || theoTen(a, b))
    return { loai, em: ds }
  }).filter((n) => n.em.length > 0)
}

/** Một em trên bảng Nhịp học: dòng của `hanhTrinhNgay.em` + khối của Hành trình chứa em. */
export interface DongNhip extends EmNhip {
  khoi: '10' | '11' | '12' | null
}

export const TEN_TANG = ['Nền', 'Hiểu', 'Vận dụng', 'Tổng hợp'] as const
export const tenTang = (tang: number | null): string => (tang ? (TEN_TANG[tang - 1] ?? `Tầng ${tang}`) : 'Chưa xếp tầng')
/** Chữ "Hôm nay" của một em: "21/36 câu" (có mức) · "5 câu" (chưa có mức). */
export const chuHomNay = (e: Pick<EmNhip, 'daLam' | 'toiThieu'>): string => (coMucNhip(e) ? `${e.daLam}/${e.toiThieu} câu` : `${e.daLam} câu`)
export const tenKhoi = (k: DongNhip['khoi']): string => (k ? `Khối ${k}` : 'Chưa rõ khối')
/** Hai chữ cái của ô ảnh đại diện ("Nguyễn Minh Anh" ⇒ "MA"). */
export function chuCaiTen(ten: string): string {
  const chu = ten.trim().split(/\s+/).filter(Boolean)
  return ((chu.length >= 2 ? chu[chu.length - 2]![0]! : '') + (chu[chu.length - 1]?.[0] ?? '')).toLocaleUpperCase('vi')
}

/** Bỏ dấu tiếng Việt + chữ thường — ô tìm khớp "nguyen" với "Nguyễn". */
export const boDau = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi')

/** Em khớp ô tìm (tên có/không dấu, hoặc SBD). Ô rỗng ⇒ mọi em. */
export function khopTim(e: Pick<EmNhip, 'sbd' | 'ten'>, tim: string): boolean {
  const q = boDau(tim.trim())
  if (!q) return true
  return boDau(e.ten).includes(q) || e.sbd.toLocaleLowerCase('vi').includes(q)
}
