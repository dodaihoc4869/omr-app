// HÀNG ĐỢI ÔN GIÃN CÁCH — dạng nào em đã sai thì quay lại đúng mốc.
//
// Đặc tả: RUT-CAU-CHUA-THEO-NGUYEN-NHAN.md, mục "luồng chính" phần Lập lịch.
//
// Thước đo không phải "em đã luyện bao nhiêu câu" mà là: *dạng này em sai lần 1,
// lần 2 đúng, lần 3 sau 9 ngày vẫn đúng — đã khắc phục*. Muốn nói được câu ấy
// thì phải nhớ mốc, và nhớ qua nhiều buổi.
//
// CHỖ CẤT: IndexedDB máy thầy, đúng chỗ `khoChuaCa` và `khoDoKho` đang nằm.
//
// Đặc tả viết "thêm cột `MocOn`, `LanDung`, `LanSai` vào sheet `TienDoHS`".
// KHÔNG LÀM THẾ. `TienDoHS` đang có 489 dòng dữ liệu thật và cả đường tiến độ
// đọc theo đúng thứ tự cột hiện có; thêm cột vào giữa là đổi cấu trúc đang chạy.
// Rút đề chỉ xảy ra trên máy thầy, nên hàng đợi không cần đi qua máy chủ — và
// nhờ vậy đợt này KHÔNG phải triển khai Apps Script lần nào. Muốn dùng chung
// nhiều máy về sau thì thêm một SHEET RIÊNG, y như `LenBang` đã làm hôm nay.
import { CAU_HINH_CHAN_DOAN_MAC_DINH, mocOnKeTiep, type Benh, type CauHinhChanDoan } from './chan-doan-cau-hinh'

export type BacKho = 'biet' | 'hieu' | 'van_dung'
const BAC: BacKho[] = ['biet', 'hieu', 'van_dung']

export interface MucOnLai {
  sbd: string
  /** Mã DẠNG bài, không phải chuyên đề — chuyên đề gộp cả chương, quá rộng. */
  maDang: string
  /** Bệnh lần gần nhất, để ca sau kê đúng kiểu thuốc. */
  benh: Benh
  /** Còn bao nhiêu BUỔI nữa thì tới hạn ôn. 0 = tới hạn ngay ca sau. */
  conMayBuoi: number
  /** Đã ôn đúng liên tiếp mấy lần — quyết định mốc kế tiếp. */
  lanDung: number
  lanSai: number
  /** Bậc độ khó sẽ kê ở lần ôn tới. */
  bac: BacKho
  capNhatLuc: string
}

export type LichOnLai = Record<string, MucOnLai>

export const LICH_ON_LAI_RONG: LichOnLai = {}

export const khoaMuc = (sbd: string, maDang: string) => `${sbd}::${maDang}`

/** GHI NHẬN MỘT DẠNG VỪA SAI. Mốc về đầu, bậc hạ một nấc — sai rồi thì kê dễ
 * hơn chứ không kê khó hơn. */
export function ghiSai(
  lich: LichOnLai,
  sbd: string,
  maDang: string,
  benh: Benh,
  luc: string,
  ch: CauHinhChanDoan = CAU_HINH_CHAN_DOAN_MAC_DINH,
): LichOnLai {
  const k = khoaMuc(sbd, maDang)
  const cu = lich[k]
  const bacCu = cu?.bac ?? 'hieu'
  const i = Math.max(0, BAC.indexOf(bacCu) - 1)
  return {
    ...lich,
    [k]: {
      sbd,
      maDang,
      benh,
      conMayBuoi: ch.MOC_ON[0],
      lanDung: 0,
      lanSai: (cu?.lanSai ?? 0) + 1,
      bac: BAC[i],
      capNhatLuc: luc,
    },
  }
}

/** GHI NHẬN MỘT DẠNG VỪA ÔN ĐÚNG. Nới mốc theo bậc, và nâng độ khó một nấc. */
export function ghiDung(
  lich: LichOnLai,
  sbd: string,
  maDang: string,
  luc: string,
  ch: CauHinhChanDoan = CAU_HINH_CHAN_DOAN_MAC_DINH,
): LichOnLai {
  const k = khoaMuc(sbd, maDang)
  const cu = lich[k]
  if (!cu) return lich
  const lanDung = cu.lanDung + 1
  const i = Math.min(BAC.length - 1, BAC.indexOf(cu.bac) + 1)
  return { ...lich, [k]: { ...cu, lanDung, conMayBuoi: mocOnKeTiep(lanDung, ch), bac: BAC[i], capNhatLuc: luc } }
}

/** QUA MỘT BUỔI: mọi mục lùi một buổi. Mục đã tới hạn đứng yên ở 0 cho tới khi
 * được ôn — không để nó trôi thành số âm rồi mất thứ tự. */
export function quaMotBuoi(lich: LichOnLai): LichOnLai {
  const ra: LichOnLai = {}
  for (const [k, m] of Object.entries(lich)) ra[k] = { ...m, conMayBuoi: Math.max(0, m.conMayBuoi - 1) }
  return ra
}

/** DẠNG TỚI HẠN ÔN của một em, mục quá hạn lâu nhất đứng trước. */
export function toiHan(lich: LichOnLai, sbd: string): MucOnLai[] {
  return Object.values(lich)
    .filter((m) => m.sbd === sbd && m.conMayBuoi <= 0)
    .sort((a, b) => a.capNhatLuc.localeCompare(b.capNhatLuc) || a.maDang.localeCompare(b.maDang))
}

/** ĐÃ KHẮC PHỤC CHƯA — đúng câu hỏi đặc tả đặt ra làm thước đo.
 *
 * Đạt khi em ôn đúng đủ số bậc trong `MOC_ON` mà không sai lại ở giữa. Với mốc
 * mặc định 1/3/7 thì nghĩa là: sai lần 1, đúng ở buổi kế, đúng tiếp sau 3 buổi,
 * và đúng lần nữa sau 7 buổi. */
export function daKhacPhuc(m: MucOnLai, ch: CauHinhChanDoan = CAU_HINH_CHAN_DOAN_MAC_DINH): boolean {
  return m.lanDung >= ch.MOC_ON.length
}

/** Dòng chữ cho thầy đọc — luôn kèm SỐ, không nói chung chung. */
export function chuTienDo(m: MucOnLai, ch: CauHinhChanDoan = CAU_HINH_CHAN_DOAN_MAC_DINH): string {
  if (daKhacPhuc(m, ch)) return `${m.maDang}: đúng ${m.lanDung}/${ch.MOC_ON.length} mốc — đã khắc phục`
  const con = m.conMayBuoi <= 0 ? 'tới hạn ôn' : `còn ${m.conMayBuoi} buổi`
  return `${m.maDang}: sai ${m.lanSai} lần, đúng ${m.lanDung}/${ch.MOC_ON.length} mốc, ${con}`
}
