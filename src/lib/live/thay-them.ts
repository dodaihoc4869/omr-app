// PHẦN THÊM CỦA MÁY THẦY (11/11, lượt 3) bọc quanh `taoLiveThay` — để ngoài thay.ts vì tệp ấy đã sát trần cỡ tệp (cổng kiem:co-tep):
//  · Z3: chẩn đoán có thêm bộ lọc ồn nào đang ra tiếng, trễ khâu lọc, tình trạng + tiến độ bộ lọc sâu; báo lớp giao diện khi tiến độ đổi (`khiLocSau`);
//  · Z2: chọn «Loa» (đầu ra âm thanh) cho tiếng app phát trên máy thầy — tiếng em nói + tiếng thử.
import { tomTatLocOn, type TomTatLocOn } from './chuoi-tieng'
import { boLoa } from './loa'
import { ngheDf3 } from './loc-on/df3'
import { taoLiveThay as taoGoc, type ChanDoanMic as ChanDoanGoc, type TuyChonLiveThay as TuyChonGoc } from './thay'

export type ChanDoanMic = ChanDoanGoc & TomTatLocOn
export interface TuyChonLiveThay extends TuyChonGoc {
  /** Tiến độ / tình trạng bộ lọc sâu vừa đổi ⇒ lớp giao diện vẽ lại. */
  khiLocSau?: () => void
}

export function taoLiveThay(tuy: TuyChonLiveThay) {
  const goc = taoGoc(tuy), thoi = ngheDf3(() => tuy.khiLocSau?.())
  return {
    ...goc,
    chanDoan: (): ChanDoanMic => { const c = goc.chanDoan(); return { ...c, ...tomTatLocOn(c.chuoi && c.locOnChay !== 'khong' ? c.locOn : 'tat') } },
    /** Z2 · loa: `coLoa()` false ⇒ trình duyệt không chọn được đầu ra (ẩn ô chọn). */
    coLoa: boLoa.co, dsLoa: boLoa.ds, loa: boLoa.id, datLoa: boLoa.dat, thuLoa: boLoa.thu,
    huy: (): void => { thoi(); goc.huy() },
  }
}
export type LiveThay = ReturnType<typeof taoLiveThay>
