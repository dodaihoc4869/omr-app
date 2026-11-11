// XEM LẠI LIVE — MÁY EM: kiểu + hằng dùng chung giữa trang buổi, thẻ câu và trình phát (tách riêng để tệp thành phần chỉ xuất thành phần).
import type { Question } from '../../../game/than-thu-v2/core'
import type { CauBuoiLive } from '../../../lib/live/xem-lai-kieu'

/** Các thành phần câu của màn làm chặng (nạp lười cùng mảnh ManLamBaiTap — app học sinh đã tải ngầm sẵn; Bình Phản Ứng và lớp bảng live cũng dùng bộ này). */
export type MangChang = typeof import('../../../components/hoc-tap/ManLamBaiTap')['PHAN_CAU_CHANG']
/** Tên bốn đội khi buổi không có bảng vàng (đúng thứ tự đội 0..3 của phòng). */
export const TEN_DOI_MAC_DINH: readonly string[] = ['Đội Natri', 'Đội Kali', 'Đội Đồng', 'Đội Canxi']
/** Buổi đang dựng ⇒ danh sách tự hỏi lại sau chừng này. */
export const HOI_LAI_DANG_DUNG_MS = 6000
/** Dải điều khiển của trình phát tự ẩn sau chừng này khi đang phát. */
export const AN_SAU_MS = 3000
/** `CauBuoiLive.cau` (nguyên dạng phòng gửi máy em) ⇒ `Question`, bù các mảng thiếu để thành phần đề không vấp. */
export const thanhCau = (c: CauBuoiLive): Question => ({ choices: [], ideas: [], hinhAnh: [], kienThuc: [], text: '', ...(c.cau as object), qid: c.qid, phan: c.phan } as unknown as Question)
