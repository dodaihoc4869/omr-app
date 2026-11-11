// PHẦN THÊM CỦA MÁY THẦY bọc quanh `taoLiveThay` — để ngoài thay.ts vì tệp ấy sát trần cỡ tệp (cổng kiem:co-tep):
//  · «Loa» (đầu ra âm thanh) cho tiếng app phát trên máy thầy — tiếng em nói + tiếng thử; cảnh báo loa mặc định trùng thiết bị với mic (loa.ts);
//  · ĐO TIẾNG TỪ XA (do-tieng.ts): khi đang live, cứ 5 giây đo 2 giây phía gửi (kb/s, mức nguồn) + tiếng em nói tới máy thầy (kb/s, năng lượng, thẻ phát);
//    10 giây một lần gửi phòng `live-do` kèm `ti` (phòng ghi nhật ký máy chủ, giữ bản mới nhất). `tiengMay()` = bản máy thầy + bản các máy em phòng chuyển về.
import { boLoa } from './loa'
import { doTieng } from './do-tieng'
import { sachTieng, type SoTieng } from './so-tieng'
import { taoLiveThay as taoGoc, type TuyChonLiveThay } from './thay'

export function taoLiveThay(tuy: TuyChonLiveThay) {
  const goc = taoGoc(tuy)
  let tiThay: SoTieng | null = null, lucGui = 0, dang = false, het = false
  const hen = setInterval(() => {
    if (het || dang || !goc.nguonDo().dangLive) return
    dang = true
    void doTieng(() => goc.nguonDo(), () => Date.now(), (ms) => new Promise<void>((r) => { setTimeout(r, ms) }))
      .then((t) => { tiThay = t; if (Date.now() - lucGui >= 9_500 && goc.nguonDo().dangLive) { lucGui = Date.now(); tuy.kenh.gui({ t: 'live-do', ti: t }) } }, () => undefined)
      .finally(() => { dang = false })
  }, 5000)
  return {
    ...goc,
    /** Loa: `coLoa()` false ⇒ trình duyệt không chọn được đầu ra (ẩn ô chọn). `loaTrungMic(ten)` = tên loa mặc định nếu trùng thiết bị với mic `ten`. */
    coLoa: boLoa.co, dsLoa: boLoa.ds, loa: boLoa.id, datLoa: boLoa.dat, thuLoa: boLoa.thu, loaTrungMic: boLoa.trungMic,
    /** Đo tiếng từ xa: máy thầy + từng máy em (sbd ⇒ bản tóm tắt, phòng chuyển về trong `live-do`). */
    tiengMay: (): { thay: SoTieng | null; em: { s: string; ti: SoTieng }[]; keo: boolean; loiKeo: string } => {
      const may = (goc.mang().em as { may?: unknown } | null)?.may
      const em = Array.isArray(may) ? may.flatMap((x) => { const o = x as { s?: unknown; ti?: unknown }; const ti = sachTieng(o?.ti); return typeof o?.s === 'string' && ti ? [{ s: o.s, ti }] : [] }) : []
      const ng = goc.nguonDo()
      return { thay: tiThay, em, keo: ng.keo, loiKeo: ng.loiKeo }
    },
    huy: (): void => { het = true; clearInterval(hen); goc.huy() },
  }
}
export type LiveThay = ReturnType<typeof taoLiveThay>
