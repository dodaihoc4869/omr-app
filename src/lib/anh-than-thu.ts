/**
 * ẢNH THẦN THÚ CHO TỜ CHIẾU LÊN BẢNG.
 *
 * Thầy chốt 15-09: *"nối thông tin hình ảnh của thú, cấp độ, các thông tin cần
 * thiết vào góc bên phải của mục chiếu lên bảng, để mỗi khi lên bảng thần thú
 * của mỗi học sinh xuất hiện."*
 *
 * ───────────────────────────────────────────────────────────────────────────
 * VẼ RA PNG, KHÔNG NHÚNG GAME. Tờ chiếu là một tài liệu HTML rời, mở ở cửa sổ
 * khác — không có React, không có three.js. Nhét cả bộ dựng 3D vào đó là thêm
 * 600 KB cho một cái ảnh bằng bao diêm. Nên: vẽ bằng bộ vẽ canvas 2D sẵn có,
 * xuất thành `data:` URL, tờ chiếu chỉ việc gắn vào thẻ `<img>`. Không tệp
 * ảnh, không lượt tải thêm, và mở được cả khi mất mạng.
 *
 * KHÔNG BỊA MỘT CON SỐ NÀO. Chỉ in những gì hồ sơ thật sự cất: thần thú em đã
 * chọn, cấp, tên hình thái, tầng tháp cao nhất, số câu sai đã thanh tẩy.
 * KHÔNG in lực chiến — lực chiến tính từ điểm trung bình và tỉ lệ nộp bài, hai
 * con số màn này không có; tính bằng giá trị rỗng là in ra một con số sai.
 */

import { vaHoSo, DANH_SACH_THAN_THU, TEN_HE_DAY_DU } from '../game/than-thu-hoa-hoc/he-thong-pet'
import { layHinhThai } from '../game/than-thu-hoa-hoc/hinh-thai'
import { veThanThuCanvas, khungVeThanThu } from '../game/than-thu-hoa-hoc/ve-than-thu'

export interface ThanThuChieu {
  /** PNG dạng `data:` — nhúng thẳng vào `<img src>`. */
  anh: string
  ten: string
  danhHieu: string
  he: string
  capDo: number
  hinhThai: string
  tangThapCaoNhat: number
  soCauDaThanhTay: number
}

/**
 * Vẽ con thú ra PNG vuông. Máy không dựng được canvas thì trả chuỗi rỗng.
 *
 * `co` là cỡ ẢNH, cố ý gấp đôi cỡ hiển thị trên tờ chiếu (108px): máy chiếu
 * thường 1080p trở lên, vẽ đúng cỡ hiển thị thì viền thú răng cưa thấy rõ.
 */
export function veThanThuRaAnh(idThu: string, capDo: number, co = 240): string {
  const info = DANH_SACH_THAN_THU[idThu]
  if (info === undefined) return ''
  try {
    const c = document.createElement('canvas')
    c.width = co
    c.height = co
    const ctx = c.getContext('2d')
    if (ctx === null) return ''
    const k = khungVeThanThu(co, co, 3)
    veThanThuCanvas(ctx, k.cx, k.cy, k.banKinh, info, capDo, {
      thoiGian: 0, dangDanh: false, dangBiDanh: false, dangTungNo: false,
    })
    return c.toDataURL('image/png')
  } catch {
    return ''
  }
}

/**
 * Đọc hồ sơ thần thú của một em rồi dựng gói thông tin cho tờ chiếu.
 *
 * `doc` là hàm gọi máy chủ do màn cha truyền xuống — tệp này không tự biết địa
 * chỉ máy chủ, cũng không tự biết em là ai ngoài số báo danh.
 *
 * Trả `null` khi: em chưa chọn thần thú, máy chủ không trả được, hoặc quá hạn
 * chờ. **Không bao giờ ném lỗi** — tờ chiếu phải mở được kể cả khi mất mạng.
 */
export async function thanThuChoToChieu(
  doc: (sbd: string) => Promise<unknown>,
  sbd: string,
  hanCho = 3500,
): Promise<ThanThuChieu | null> {
  let tho: unknown = null
  try {
    tho = await Promise.race([
      doc(sbd),
      new Promise((thoi) => setTimeout(() => thoi(null), hanCho)),
    ])
  } catch {
    return null
  }
  if (tho === null || tho === undefined) return null

  const h = vaHoSo(tho)
  // Chưa chọn thần thú thì KHÔNG dựng con mặc định — in ra là bịa.
  if (h.idThanhThuChon === '') return null
  const info = DANH_SACH_THAN_THU[h.idThanhThuChon]
  if (info === undefined) return null

  return {
    anh: veThanThuRaAnh(h.idThanhThuChon, h.capDo),
    ten: info.ten,
    danhHieu: info.danhHieu,
    he: TEN_HE_DAY_DU[info.he] ?? '',
    capDo: h.capDo,
    hinhThai: layHinhThai(h.capDo).ten,
    tangThapCaoNhat: h.tangThapCaoNhat,
    soCauDaThanhTay: h.soCauDaThanhTay,
  }
}
