// PHẦN THÊM CỦA MÁY THẦY bọc quanh `taoLiveThay` — để ngoài thay.ts vì tệp ấy sát trần cỡ tệp (cổng kiem:co-tep):
//  · «Loa» (đầu ra âm thanh) cho tiếng app phát trên máy thầy — tiếng em nói + tiếng thử; cảnh báo loa mặc định trùng thiết bị với mic (loa.ts).
import { boLoa } from './loa'
import { taoLiveThay as taoGoc, type TuyChonLiveThay } from './thay'

export function taoLiveThay(tuy: TuyChonLiveThay) {
  const goc = taoGoc(tuy)
  return {
    ...goc,
    /** Loa: `coLoa()` false ⇒ trình duyệt không chọn được đầu ra (ẩn ô chọn). `loaTrungMic(ten)` = tên loa mặc định nếu trùng thiết bị với mic `ten`. */
    coLoa: boLoa.co, dsLoa: boLoa.ds, loa: boLoa.id, datLoa: boLoa.dat, thuLoa: boLoa.thu, loaTrungMic: boLoa.trungMic,
  }
}
export type LiveThay = ReturnType<typeof taoLiveThay>
