// CÁI THƯỚC — ĐẾM Ở CHỖ DỮ LIỆU CỦA NGƯỜI DÙNG ĐỌNG LẠI.
//
// 12/09: Google đã bị cắt hẳn, nên không còn "bên kia" để đặt cạnh. Cái thước
// giữ nguyên công dụng thật của nó — ĐẾM — và bỏ cột so sánh: bảng nào đã dựng,
// bảng nào còn rỗng, và một dòng rỗng nghĩa là màn nào chưa chạy được.
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

/** Một dòng của bảng đếm. */
export interface DongDoiChieu {
  ten: string
  mayChuMoi: number
  /** Vì sao dòng này quan trọng — hiện ngay dưới, để thầy biết rỗng thì mất gì. */
  nghia: string
  /** `true` khi bảng đã có dữ liệu, `false` khi CHƯA DỰNG. Không còn nghĩa
   * "khớp hai bên" — từ 12/09 chỉ còn một bên. */
  daDung: boolean
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
export function dungBangDoiChieu(moi: SoMayChuMoi): DongDoiChieu[] {
  const dong = (ten: string, m: number, nghia: string): DongDoiChieu => ({
    ten,
    mayChuMoi: m,
    nghia,
    daDung: m !== CHUA_DUNG,
  })

  return [
    dong('Ca kiểm tra (kể cả đã xoá)', moi.ca, 'Đây là số ca màn Ca thi đọc ra.'),
    dong('Ca chưa xoá', moi.caChuaXoa, 'Số ca đang hiện cho thầy chọn.'),
    dong('Lượt thi', moi.luot, 'Mỗi lượt là một lần em vào làm bài.'),
    dong('Danh sách lớp', moi.danhSach, 'Bảng RỖNG thì cổng chặn số báo danh lạ không hoạt động — ai có mã ca cũng vào được.'),
    dong('Lượt ĐÃ CÓ ĐIỂM', moi.luotCoDiem, 'Nhỏ hơn số lượt nghĩa là còn bài chưa chấm.'),
    dong('Ca đọc thẳng được máy chủ mới', moi.caSinhTaiD1, 'Ca có cờ này thì Chi tiết ca mở tức thì.'),
    dong('Chi tiết từng câu', moi.chiTietCau, 'Nguồn của bảng câu sai từng em.'),
    dong('Bản đồ câu sai', moi.banDoSai, 'Nguồn của rút câu khắc phục và đề riêng.'),
    dong('Tiến độ mạnh–yếu', moi.tienDoHs, 'Nguồn bảng chuyên đề trong hồ sơ em.'),
  ]
}

/** Máy chủ đã sẵn sàng chưa: không bảng nào còn ở trạng thái CHƯA DỰNG.
 *
 * Bảng RỖNG (0 dòng) KHÔNG phải là chưa sẵn sàng — sau khi thầy xoá sạch ca để
 * tuần sau thi lại từ đầu thì rỗng là đúng. Chưa dựng mới là hỏng. */
export function daChuyenXong(bang: DongDoiChieu[]): boolean {
  return bang.every((d) => d.daDung)
}
