// HỒ SƠ 6 MỨC (thầy duyệt bản vẽ docs/ban-ve-ho-so-em-2210, 22/10) — hàm THUẦN gộp `mucLam6` từ các lượt đã xếp mức (`lichSuLamCauCuaEm` gọi; trang chụp
// và test giao diện gọi thẳng). Không D1, không mạng. Hợp đồng: `MucLam6` trong ./lich-su-lam-cau-kieu.
import type { LanLamCau, Lam7, MucLam6, NgayCoTinh, NgayMucLam } from './lich-su-lam-cau-kieu'
import { tongMucLam } from './muc-lam'

/** "YYYY-MM-DD" theo giờ Việt Nam (UTC+7) của một mốc ISO. */
const ngayVnTuLuc = (luc: string): string => new Date(Date.parse(luc) + 7 * 3_600_000).toISOString().slice(0, 10)
const NGAY_MS = 86_400_000
/** "YYYY-MM-DD" lùi `n` ngày lịch (thuần, không phụ thuộc múi giờ máy). */
const luiNgay = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) - n * NGAY_MS).toISOString().slice(0, 10)
/** Bằng chứng Mức 6: tối đa từng ấy lượt mỗi ngày (giao diện ghi "+N lượt" phần còn lại). */
export const TOI_DA_LUOT_BANG_CHUNG = 12

/** Gộp 6 mức trên tập lượt em được xem (`lan` mới trước). `laThay`: thêm bằng chứng Mức 6 — bản học sinh/phụ huynh không bao giờ có.
 *  `moiLuot`: MỌI lượt (kể cả lượt bản học sinh ẩn mức) cho số đếm `lam7`; vắng ⇒ `lan`. Thuần. */
export function mucLam6(lan: readonly LanLamCau[], nowMs: number, laThay: boolean, moiLuot: readonly LanLamCau[] = lan): MucLam6 {
  const den = ngayVnTuLuc(new Date(nowMs).toISOString())
  const tu = luiNgay(den, 6)
  const bayLuot = lan.filter((l) => l.ngay >= tu && l.ngay <= den)
  const bayMoi = moiLuot.filter((l) => l.ngay >= tu && l.ngay <= den)
  const coGiay = bayMoi.filter((l) => l.giay !== null && !l.mucLam?.treo)
  const lam7: Lam7 = {
    soLuot: bayMoi.length,
    soCau: new Set(bayMoi.map((l) => l.qid)).size,
    soDung: bayMoi.filter((l) => l.dung === true).length,
    soSai: bayMoi.filter((l) => l.dung === false).length,
    soBoTrong: bayMoi.filter((l) => l.dung === null).length,
    giayTb: coGiay.length ? Math.round(coGiay.reduce((t, l) => t + (l.giay ?? 0), 0) / coGiay.length) : null,
    soLuotCoGiay: coGiay.length,
    soTreo: bayMoi.filter((l) => !!l.mucLam?.treo).length,
  }
  const treoDungSai = { treo: { dung: 0, sai: 0 }, coTinh: { dung: 0, sai: 0 } }
  const theoNgay = new Map<string, NgayMucLam>()
  for (let i = 6; i >= 0; i--) { const n = luiNgay(den, i); theoNgay.set(n, { ngay: n, dem: [0, 0, 0, 0, 0, 0], chuaCoSoDo: 0, soChuaDoTreo: 0 }) }
  const coTinh = new Map<string, NgayCoTinh>()
  for (const l of bayLuot) {
    const m = l.mucLam, o = theoNgay.get(l.ngay)!
    if (!m) { o.chuaCoSoDo++; continue }
    if (m.treo) {
      o.dem[m.treo === 'co_tinh' ? 5 : 4]++
      const d = treoDungSai[m.treo === 'co_tinh' ? 'coTinh' : 'treo']
      if (l.dung === true) d.dung++
      else d.sai++
      if (m.treo === 'co_tinh' && laThay) {
        const c = coTinh.get(l.ngay) ?? coTinh.set(l.ngay, { ngay: l.ngay, so: 0, luot: [] }).get(l.ngay)!
        c.so++
        if (c.luot.length < TOI_DA_LUOT_BANG_CHUNG) c.luot.push({ luc: l.luc, giayTreo: m.giayTreo ?? 0, tieuDe: l.tieuDe })
      }
      continue
    }
    o.dem[m.ma - 1]++
    if (!m.daDoTreo) o.soChuaDoTreo++
  }
  return {
    tu,
    den,
    bay: tongMucLam(bayLuot, { tachTreo: true }),
    toanBo: tongMucLam(lan, { tachTreo: true }),
    treoDungSai,
    theoNgay: [...theoNgay.values()],
    lam7,
    ...(laThay ? { ngayCoTinh: [...coTinh.values()].sort((a, c) => (a.ngay < c.ngay ? 1 : -1)).map((c) => ({ ...c, luot: [...c.luot].reverse() })) } : {}),
  }
}
