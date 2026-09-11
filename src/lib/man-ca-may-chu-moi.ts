// MÀN CA THI ĐỌC THẲNG MÁY CHỦ MỚI — đợt 5B, 11/09.
//
// Thầy báo: "ca thi vẫn tải trên google sheet, chuyển hết sang máy chủ mới đi
// cho nhanh". Đo thật từ trình duyệt của thầy cùng ngày:
//
//   Apps Script, chi phí cố định (gọi một lệnh KHÔNG tồn tại):  1 552–1 798 ms
//   Máy chủ mới, `/khoe`:                                          109–547 ms
//
// Tức mỗi lần mở màn Ca thi, gần hai giây trôi qua TRƯỚC khi Apps Script đọc
// một ô nào. Đó là chi phí cố định của nền tảng, không sửa được bằng mã.
//
// ======================================================================
// CỔNG AN TOÀN — đọc kỹ trước khi sửa bất cứ gì trong tệp này
// ======================================================================
//
// Danh sách ca KHÔNG chỉ là tên ca: nó mang cả cột "đã vào / đã nộp / cảnh
// báo", đếm từ `LuotThi`. D1 hôm nay có 1 ca (ca đo tải) và 0 lượt — mọi ca cũ
// và mọi bài đã nộp đều nằm ở Sheet.
//
// Đổi chỗ đọc mà chưa chuyển dữ liệu sang là màn Ca thi hiện THIẾU CA và ĐẾM
// SAI SỐ EM. Sai số liệu tệ hơn chậm: thầy nhìn "12/36 đã nộp" rồi đi nhắc
// nhầm hai mươi tư phụ huynh.
//
// Nên luật là: **app chỉ đọc D1 khi trên D1 có dấu `ca_day_du`**, và dấu ấy chỉ
// được ghi sau khi CHÍNH APP đã đối chiếu số ca và số lượt hai bên khớp nhau.
// Chuyển dữ liệu hỏng nửa chừng ⇒ không có dấu ⇒ app đọc đường cũ y như hôm
// nay. Không có trạng thái nào ở giữa.
import type { CauHinhMayChu } from './cau-hinh-may-chu'

/** Hạn chờ cho lệnh của thầy trên máy chủ mới. Rộng hơn đường nóng của em vì
 * lượt chuyển dữ liệu đẩy hàng trăm dòng một lượt. */
export const HAN_MAN_CA_GIAY = 30

export interface DauDongBo {
  ma: string
  luc: string
  so_ca: number
  so_luot: number
  ghi_chu?: string | null
}

export interface CaDayNhieu {
  maCa: string
  tenCa?: string
  lop?: string
  thoiGianPhut?: number
  moLuc?: string
  batDau?: string
  hetHanVao?: string
  trangThai?: string
  phamVi?: string
  congBo?: string
  loai?: string
  hanNop?: string
  lenBang?: boolean
  giuDeDoc?: boolean
  anHanGiay?: number
  phongCho?: boolean
  batDauThiLuc?: string
  xoaLuc?: string
  /** BA SỐ ĐẾM chép nguyên từ Apps Script — đã vào / đã nộp / cảnh báo.
   *
   * Máy chủ mới lấy SỐ LỚN HƠN giữa ba số này và số đếm sống từ bảng `luot`,
   * nên ca cũ (D1 không có dòng lượt nào) vẫn hiện đúng, còn ca đang chạy
   * trên máy chủ mới thì đếm sống thắng vì nó mới hơn Sheet. */
  daVao?: number
  daNop?: number
  canhBao?: number
}

export interface LuotDayNhieu {
  maCa: string
  sbd: string
  lanThu?: number
  trangThai?: string
  vaoLuc?: string
  hetGioLuc?: string
  nopLuc?: string
  soLanRoiMan?: number
  tongGiayRoiMan?: number
}

async function goi<T>(
  ch: CauHinhMayChu,
  maBiMat: string,
  duong: string,
  than: unknown,
  giay = HAN_MAN_CA_GIAY,
): Promise<T | null> {
  if (!ch.BAT || !ch.URL) return null
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), giay * 1000)
  try {
    const res = await fetch(`${ch.URL}${duong}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': maBiMat },
      body: JSON.stringify(than),
      signal: bo.signal,
    })
    if (!res.ok) return null
    const j = (await res.json()) as { ok?: boolean } & Record<string, unknown>
    if (!j?.ok) return null
    return j as T
  } catch {
    return null
  } finally {
    clearTimeout(hen)
  }
}

/** ĐỌC DANH SÁCH CA TỪ D1. `null` nghĩa là "hỏi đường cũ" — mọi chỗ không chắc
 * đều trả `null`, kể cả khi máy chủ trả lời được nhưng CHƯA CÓ DẤU đồng bộ. */
export async function danhSachCaMoi(
  ch: CauHinhMayChu,
  maBiMat: string,
  daXoa: boolean,
): Promise<{ items: Record<string, unknown>[]; dau: DauDongBo; soDongLuot: number } | null> {
  const r = await goi<{ items?: unknown; dauDongBo?: unknown; soDongLuot?: number }>(ch, maBiMat, '/ca/danh-sach', { daXoa })
  if (!r) return null
  const dau = (r.dauDongBo ?? null) as DauDongBo | null
  // CHƯA CHUYỂN DỮ LIỆU XONG ⇒ ĐI ĐƯỜNG CŨ. Đây là cổng an toàn của cả đợt.
  if (!dau || dau.ma !== 'ca_day_du') return null
  const items = Array.isArray(r.items) ? (r.items as Record<string, unknown>[]) : []
  return { items, dau, soDongLuot: Number(r.soDongLuot) || 0 }
}

/** ĐẨY MỘT LÔ CA VÀ LƯỢT. Trả số câu đã ghi, `null` là hỏng. */
export async function dayNhieuCaMoi(
  ch: CauHinhMayChu,
  maBiMat: string,
  lo: { ca?: CaDayNhieu[]; luot?: LuotDayNhieu[] },
): Promise<{ soCa: number; soLuot: number } | null> {
  if ((lo.ca?.length ?? 0) === 0 && (lo.luot?.length ?? 0) === 0) return { soCa: 0, soLuot: 0 }
  const r = await goi<{ soCa?: number; soLuot?: number }>(ch, maBiMat, '/ca/nhieu', {
    ca: lo.ca ?? [],
    luot: lo.luot ?? [],
  })
  if (!r) return null
  return { soCa: Number(r.soCa) || 0, soLuot: Number(r.soLuot) || 0 }
}

/** GHI hoặc XOÁ dấu đồng bộ. Chỉ gọi sau khi app đã tự đối chiếu xong. */
export async function datDauDongBo(
  ch: CauHinhMayChu,
  maBiMat: string,
  dau: { soCa: number; soLuot: number; ghiChu?: string } | null,
): Promise<boolean> {
  const than = dau === null
    ? { ma: 'ca_day_du', xoa: true }
    : { ma: 'ca_day_du', soCa: dau.soCa, soLuot: dau.soLuot, ghiChu: dau.ghiChu ?? '' }
  const r = await goi<{ ok?: boolean }>(ch, maBiMat, '/dong-bo/dau', than)
  return r !== null
}

/** ĐỌC DANH SÁCH CA **KHÔNG ĐÒI DẤU ĐỒNG BỘ** — chỉ dùng cho lượt đối chiếu sau
 * khi chuyển dữ liệu. Màn Ca thi KHÔNG được gọi hàm này: nó là cửa duy nhất bỏ
 * qua cổng an toàn, và bỏ qua cổng ấy là mở đường cho màn Ca thi đếm sai. */
export async function danhSachCaMoiThoDoiChieu(
  ch: CauHinhMayChu,
  maBiMat: string,
  daXoa: boolean,
): Promise<{ items: Record<string, unknown>[]; soDongLuot: number } | null> {
  const r = await goi<{ items?: unknown; soDongLuot?: number }>(ch, maBiMat, '/ca/danh-sach', { daXoa })
  if (!r) return null
  return {
    items: Array.isArray(r.items) ? (r.items as Record<string, unknown>[]) : [],
    soDongLuot: Number(r.soDongLuot) || 0,
  }
}
