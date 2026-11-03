// Gắn BẢN KÍNH vào các ô của tờ chiếu TRƯỚC khi dựng HTML (thầy 03/11 «Hiển thị lời giải mới cho tất cả phần chiếu lên bảng»). MỘT lệnh /gv/loi-giai-kinh
// cho cả tờ (sau cổng mã bí mật của thầy). Bản xếp theo ĐÚNG thứ tự phương án / ý đang chiếu (`xepTheoCauPhat`); xếp không được ⇒ ô giữ lời giải cũ.
// Lỗi mạng / máy chủ ⇒ tờ y như cũ (không chặn buổi dạy). Nơi gọi nạp lười tệp này: `await import('…/kinh-chieu-gan')`.
import type { CauLuyen } from '../bai-tap-pdf'
import { docKinhChieu } from '../loi-giai-gv-api'
import { qidMayChuCuaIdCau } from '../lich-su-cau-len-bang'
import { xepTheoCauPhat } from './kiem'

export async function ganKinhChoBang<T extends { qid?: string; cau: CauLuyen }>(ds: T[]): Promise<T[]> {
  const ung = (o: T) => [...new Set([o.qid, o.cau.id, qidMayChuCuaIdCau(o.qid ?? ''), qidMayChuCuaIdCau(o.cau.id)].filter((x): x is string => !!x))]
  const qids = [...new Set(ds.flatMap(ung))].slice(0, 200)
  if (!qids.length) return ds
  const r = await docKinhChieu(qids).catch(() => null)
  const ban = (r && r.ok === true && r.ban && typeof r.ban === 'object' ? r.ban : {}) as Record<string, unknown>
  return ds.map((o) => {
    const tho = ung(o).map((q) => ban[q]).find(Boolean)
    if (!tho) return o
    const lc = o.cau.luaChon ?? undefined
    const x = xepTheoCauPhat(tho, { phan: o.cau.phan, choices: o.cau.phan === 'I' ? lc : undefined, ideas: o.cau.phan === 'II' ? lc : undefined, correct: o.cau.dapAn })
    return x ? { ...o, cau: { ...o.cau, kinh: x } } : o
  })
}
