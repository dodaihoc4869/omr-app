// CÁI THƯỚC — ĐẶT SỐ CỦA GOOGLE SHEET CẠNH SỐ CỦA MÁY CHỦ MỚI.
//
// VIỆC ĐẦU TIÊN CỦA CẢ ĐỢT BỎ APPS SCRIPT, trước khi chuyển một lệnh nào.
//
// VÌ SAO: ngày 11/09 tôi đưa ra BỐN đường nhanh. Cả bốn đều có mặt trong mã,
// chạy đúng logic, và KHÔNG đường nào thật sự phục vụ được ai:
//
//   1. máy học sinh không có đường nào biết địa chỉ máy chủ mới;
//   2. tôi đo bằng trang do chính Worker phục vụ nên lúc nào cũng 0 lỗi;
//   3. cờ `sinh_tai_d1` chỉ bật cho ca mở TỪ NAY, 88 ca cũ không ca nào được;
//   4. cửa `xinKeyBank` chặn đường nhanh vĩnh viễn trên điện thoại thầy.
//
// Cả bốn lần chỉ lộ ra khi ĐẾM ở chỗ dữ liệu của người dùng đọng lại. Không có
// cái thước này thì mỗi lần cắt một khối là một lần tin lời nhau.
//
// CHỈ ĐỌC. Không hàm nào trong tệp này ghi một dòng nào, ở cả hai đầu.
import type { CauHinhMayChu } from './cau-hinh-may-chu'

export interface SoMayChuMoi {
  ca: number
  caChuaXoa: number
  luot: number
  luotCoDiem: number
  luotCoTen: number
  luotChuaVeSheet: number
  danhSach: number
  phongCho: number
  trangThai: number
  chanVao: number
  caSinhTaiD1: number
  chiTietCau: number
  banDoSai: number
  tienDoHs: number
}

/** Một dòng trong bảng đối chiếu. `sheet` là `null` khi Apps Script không có số
 * tương ứng — nói thẳng "không đối chiếu được" thay vì bịa một số 0. */
export interface DongDoiChieu {
  ten: string
  sheet: number | null
  mayChuMoi: number
  /** `true` khi hai bên khớp, `false` khi lệch, `null` khi không đối chiếu được. */
  khop: boolean | null
  /** Vì sao dòng này quan trọng — hiện ngay dưới, để thầy biết lệch thì mất gì. */
  nghia: string
}

/** Bảng chưa dựng thì Worker trả -1. Đừng hiện "0 dòng" cho một bảng chưa tồn
 * tại — đó là hai chuyện khác hẳn nhau. */
export const CHUA_DUNG = -1

export async function laySoMayChuMoi(ch: CauHinhMayChu, maBiMat: string): Promise<SoMayChuMoi | null> {
  if (!ch.URL) return null
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), 20000)
  try {
    const res = await fetch(`${ch.URL}/doi-chieu`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': maBiMat },
      body: JSON.stringify({}),
      signal: bo.signal,
    })
    if (!res.ok) return null
    const j = (await res.json()) as { ok?: boolean; so?: SoMayChuMoi }
    return j?.ok ? (j.so ?? null) : null
  } catch {
    return null
  } finally {
    clearTimeout(hen)
  }
}

/** Dựng bảng đối chiếu từ hai bộ số. Thuần tính, không chạm mạng — để phép kiểm
 * canh được từng luật một. */
export function dungBangDoiChieu(
  sheet: { soCa: number; soCaChuaXoa: number; soLuot: number; soDanhSach: number | null },
  moi: SoMayChuMoi,
): DongDoiChieu[] {
  const dong = (ten: string, s: number | null, m: number, nghia: string): DongDoiChieu => ({
    ten,
    sheet: s,
    mayChuMoi: m,
    // Bảng chưa dựng ⇒ chưa đối chiếu được, KHÔNG phải lệch.
    khop: m === CHUA_DUNG || s === null ? null : s === m,
    nghia,
  })

  return [
    dong('Ca kiểm tra (kể cả đã xoá)', sheet.soCa, moi.ca, 'Lệch là màn Ca thi hiện thiếu ca hoặc thừa ca.'),
    dong('Ca chưa xoá', sheet.soCaChuaXoa, moi.caChuaXoa, 'Lệch là ca thầy đã xoá vẫn còn hiện, hoặc ngược lại.'),
    dong('Lượt thi', sheet.soLuot, moi.luot, 'Lệch là có bài của em chỉ nằm một bên.'),
    dong('Danh sách lớp', sheet.soDanhSach, moi.danhSach, 'Lệch là cổng chặn số báo danh lạ hai bên không giống nhau.'),
    dong('Lượt ĐÃ CÓ ĐIỂM', null, moi.luotCoDiem, 'Khối A chưa xong thì số này còn nhỏ hơn số lượt.'),
    dong('Lượt CHƯA về Sheet', null, moi.luotChuaVeSheet, 'Khác 0 là có bài em nộp chưa tới Google Sheet — bấm Đồng bộ ngược.'),
    dong('Ca đọc thẳng được máy chủ mới', null, moi.caSinhTaiD1, 'Ca có cờ này thì Chi tiết ca mở tức thì; ca chưa có thì đọc một lần rồi tự có.'),
    dong('Chi tiết từng câu', null, moi.chiTietCau, 'Khối A — chưa dựng thì chấm lại vẫn phải đi Apps Script.'),
    dong('Bản đồ câu sai', null, moi.banDoSai, 'Khối A — chưa dựng thì rút câu sai vẫn đi Apps Script.'),
    dong('Tiến độ mạnh–yếu', null, moi.tienDoHs, 'Khối B — chưa dựng thì hồ sơ em vẫn đi Apps Script.'),
  ]
}

/** Đã chuyển xong hẳn chưa: mọi dòng ĐỐI CHIẾU ĐƯỢC đều khớp, và không bảng nào
 * còn thiếu. Dùng cho câu trả lời một dòng ở đầu khối. */
export function daChuyenXong(bang: DongDoiChieu[]): boolean {
  return bang.every((d) => d.khop !== false) && bang.every((d) => d.mayChuMoi !== CHUA_DUNG)
}
