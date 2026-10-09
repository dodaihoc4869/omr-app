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
