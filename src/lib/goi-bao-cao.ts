// GÓI DỮ LIỆU CHO MÀN BÁO CÁO — MỘT CỬA DUY NHẤT CHO CẢ BA APP.
//
// Thầy bắt được 14/09: cùng một ca Test4, ba chỗ mở báo cáo ra ba con số khác
// nhau — "Sai 10 câu · 2 câu đúng một phần", "Sai 10 câu · Bỏ trống 2 câu", và
// "Sai 12 câu". Cùng MỘT component `BaoCaoCaThiHocSinhModal`, nhưng bốn chỗ gọi
// tự tay nhặt trường rồi truyền vào, mỗi chỗ nhặt thiếu một kiểu:
//
//   · Cổng học sinh   — truyền đủ bảy con số máy chủ trả.
//   · Màn Hồ sơ thầy  — bỏ bốn con số mới, lại còn tự tính
//                       `soCauSai = tongCau - soCauDung`, nên hai câu phần II
//                       đúng một phần rơi thành "bỏ trống".
//   · Màn theo dõi ca — truyền bộ khác nữa.
//
// Nay CẤM nhặt tay. Mọi chỗ gọi đưa nguyên gói máy chủ trả vào `goiBaiThi`, và
// hàm này quyết định tất cả. Thêm một con số mới chỉ phải sửa đúng ở đây.
import type { ThongTinBaiThiHocSinh } from '../components/BaoCaoCaThiHocSinhModal'

/** Nguồn có thể là item của `hsLichSuCa`, của `lichSuEm`, hay một ca trong
 * `hoSoEm` — ba gói khác tên trường ở vài chỗ, giống nhau ở phần đếm câu. */
export interface NguonBaiThi {
  maCa?: unknown
  tenCa?: unknown
  nopLuc?: unknown
  ngay?: unknown
  ngayNop?: unknown
  tong?: unknown
  diem?: unknown
  diemI?: unknown
  diemII?: unknown
  diemIII?: unknown
  lanThu?: unknown
  thoiGianPhut?: unknown
  tongCau?: unknown
  tongSoCau?: unknown
  soCauDung?: unknown
  soCauSai?: unknown
  soCauDungMotPhan?: unknown
  soCauBoTrong?: unknown
  soYDungII?: unknown
  soYTongII?: unknown
}

const so = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const chu = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

/** Gói một ca thành ĐÚNG dạng màn báo cáo cần. Không tự tính con số nào. */
export function goiBaiThi(x: NguonBaiThi | null | undefined, ngayThi?: string): ThongTinBaiThiHocSinh {
  const maCa = chu(x?.maCa)
  const tongCau = so(x?.tongCau) ?? so(x?.tongSoCau)
  return {
    maCa,
    tenCa: chu(x?.tenCa) || `Ca ${maCa}`,
    ngayThi: ngayThi ?? (chu(x?.nopLuc) || chu(x?.ngay) || chu(x?.ngayNop) || undefined),
    diem: so(x?.tong) ?? so(x?.diem) ?? 0,
    diemI: so(x?.diemI),
    diemII: so(x?.diemII),
    diemIII: so(x?.diemIII),
    thoiGianPhut: so(x?.thoiGianPhut) ?? undefined,
    lanThu: so(x?.lanThu) ?? undefined,
    // BẢY CON SỐ ĐẾM CÂU — chép nguyên, CẤM suy ra cái nào từ cái nào. Suy ra
    // là mỗi chỗ suy một kiểu, và đó đúng là lỗi thầy vừa bắt.
    tongCau: tongCau ?? undefined,
    soCauDung: so(x?.soCauDung) ?? undefined,
    soCauSai: so(x?.soCauSai) ?? undefined,
    soCauDungMotPhan: so(x?.soCauDungMotPhan),
    soCauBoTrong: so(x?.soCauBoTrong),
    soYDungII: so(x?.soYDungII),
    soYTongII: so(x?.soYTongII),
  }
}
