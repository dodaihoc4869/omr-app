// THẺ "MỨC TIẾN BỘ" — MỘT BẢN DUY NHẤT CHO MỌI BÁO CÁO, MỌI APP.
//
// Thầy chốt 14/09: "Báo cáo cho thêm 1 thẻ mức tiến bộ, vẽ biểu đồ điểm các ca
// thi và đánh giá mức độ tiến bộ, đồng bộ vào mọi báo cáo, mọi ca thi, mọi app."
//
// Trước đây mỗi màn tự vẽ một kiểu tiến bộ: cổng học sinh một khối, cổng phụ
// huynh một khối khác, màn Ca thi lại chèn thêm một thẻ nữa gần trùng tên. Cùng
// một em, cùng bốn ca, ra ba hình khác nhau. Nay đúng một thẻ, đúng một biểu đồ.
import { useMemo } from 'react'
import BieuDoTienBoGoogle from './BieuDoTienBoGoogle'
import type { HoSoEm } from '../lib/exam-api'

/** Một ca trong lịch sử, đọc lỏng vì ba lệnh máy chủ đặt tên trường hơi khác. */
export interface CaLichSu {
  maCa?: unknown
  tenCa?: unknown
  nopLuc?: unknown
  ngay?: unknown
  ngayNop?: unknown
  tong?: unknown
  diemI?: unknown
  diemII?: unknown
  diemIII?: unknown
  lanThu?: unknown
  tongCau?: unknown
  soCauDung?: unknown
  soCauSai?: unknown
}

export interface CaDangMo {
  maCa: string
  tenCa: string
  ngayThi?: string
  diem: number
  diemI?: number | null
  diemII?: number | null
  diemIII?: number | null
  lanThu?: number
  tongCau?: number | null
  soCauDung?: number | null
  soCauSai?: number | null
}

const so = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const chu = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

/** Gộp lịch sử máy chủ với CA ĐANG MỞ về đúng dạng `chuoiTienBo` cần.
 *
 * Ca đang mở luôn phải có mặt: thầy mở báo cáo ngay sau khi em nộp thì lịch sử
 * máy chủ còn chưa kịp có ca ấy, và một biểu đồ thiếu đúng cái cột vừa thi
 * trông như hỏng. */
export function gomCaChoBieuDo(lichSu: CaLichSu[] | null | undefined, dangMo: CaDangMo): HoSoEm['ca'] {
  const ds = (lichSu ?? [])
    .filter((c) => c && chu(c.maCa))
    .map((c) => ({
      maCa: chu(c.maCa),
      tenCa: chu(c.tenCa),
      lop: '',
      lanThu: so(c.lanThu) ?? 1,
      nopLuc: chu(c.nopLuc) || chu(c.ngay) || chu(c.ngayNop),
      trangThai: 'da_nop',
      diemI: so(c.diemI),
      diemII: so(c.diemII),
      diemIII: so(c.diemIII),
      tong: so(c.tong),
      tongCau: so(c.tongCau),
      soCauDung: so(c.soCauDung),
      soCauSai: so(c.soCauSai),
      hang: null,
      siSo: null,
      soLanRoiMan: 0,
    }))
  if (!ds.some((c) => c.maCa === dangMo.maCa)) {
    ds.push({
      maCa: dangMo.maCa,
      tenCa: dangMo.tenCa,
      lop: '',
      lanThu: dangMo.lanThu ?? 1,
      nopLuc: dangMo.ngayThi || new Date().toISOString(),
      trangThai: 'da_nop',
      diemI: dangMo.diemI ?? null,
      diemII: dangMo.diemII ?? null,
      diemIII: dangMo.diemIII ?? null,
      tong: dangMo.diem,
      tongCau: dangMo.tongCau ?? null,
      soCauDung: dangMo.soCauDung ?? null,
      soCauSai: dangMo.soCauSai ?? null,
      hang: null,
      siSo: null,
      soLanRoiMan: 0,
    })
  }
  return ds as unknown as HoSoEm['ca']
}

export default function TheTienBo({ lichSu, dangMo }: { lichSu: CaLichSu[] | null | undefined; dangMo: CaDangMo }) {
  const ca = useMemo(() => gomCaChoBieuDo(lichSu, dangMo), [lichSu, dangMo])
  // Điểm của ca ĐANG MỞ đè lên bản máy chủ: máy thầy vừa chấm lại tại chỗ thì
  // con số trước mắt mới là con số đúng.
  const diemDe = useMemo(() => ({ [dangMo.maCa]: dangMo.diem }), [dangMo.maCa, dangMo.diem])
  return (
    <div className="animate-google-fade">
      <BieuDoTienBoGoogle ca={ca} diemDe={diemDe} />
    </div>
  )
}
