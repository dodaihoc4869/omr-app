// XEM LẠI LIVE — MÁY TÍNH «Đỗ Đại Học FX4869» CỦA THẦY (thầy 13/11: «máy tính không hiện trong video, hôm qua live có bật máy tính»). Thuần: không mạng, không đồng hồ.
// Lúc live thầy phát trạng thái máy tính qua kênh lớp (`k: 'mt'`, src/components/may-tinh/dong-bo.ts), phòng chỉ chuyển tiếp, KHÔNG nhớ ⇒ buổi trước 13/11
// không có dữ liệu máy tính để dựng lại. Từ 13/11 phòng GHI các lần đổi vào nhật ký riêng (`xl:mt:<i>`), bộ dựng đưa vào `buoi.json` (`mayTinh`), trình phát
// hiện máy tính chỉ-xem đúng lúc, đúng chỗ, đúng nội dung.
//   · `taoLocMayTinh` (máy chủ): lọc tin của thầy trước khi ghi — bấm phím / mở / cất ghi NGAY; chỉ đổi chỗ (đang kéo) dồn 200 ms; tin nhắc lại y như cũ
//     (mỗi 4 giây) chỉ ghi một dòng «còn» ngắn mỗi 3,5 giây (để biết thầy còn đó); trần 8000 dòng một buổi.
//   · `dungMayTinh` (bộ dựng): giờ phòng ⇒ trục tiếng; thầy im quá 13 giây / tắt live ⇒ cất (đúng luật máy em lúc live); bỏ dòng «còn»; màn hình chỉ ghi khi đổi.
import { HET_HAN_MS, docTin, type TinMayTinh } from '../../components/may-tinh/dong-bo'
import type { MocMayTinh } from './xem-lai-kieu'

/** Một dòng nhật ký máy tính của phòng (giờ PHÒNG, ms): `x` = gói đã làm sạch · `c: 1` = thầy nhắc lại y như cũ (máy tính vẫn đang hiện). */
export type MucMayTinhXl = { t: number; x: TinMayTinh } | { t: number; c: 1 }
export const MT_NHIP_KEO_MS = 200, MT_NHIP_CON_MS = 3500, MT_TRAN_MUC = 8000
/** Số dòng mỗi mảnh storage của phòng (một dòng ≤ ~2 KB ⇒ mảnh ≤ ~80 KB, dưới trần 128 KB một giá trị). */
export const MT_MOI_MANH = 40

const khoaCho = (d: TinMayTinh): string => `${Math.round((d.x ?? 0) * 400)}|${Math.round((d.y ?? 0) * 400)}|${Math.round((d.w ?? 0) * 400)}`

/** Bộ lọc phía phòng: đưa từng tin `mt` của THẦY vào, nhận các dòng cần ghi (thường rỗng). Giữ trong bộ nhớ; phòng ngủ dậy ⇒ lọc mới ⇒ tin đầu ghi đủ. */
export function taoLocMayTinh() {
  let mo = false, noiDung = '', cho = '', lucGhi = -1e12, lucCon = -1e12, lucNghe = -1e12, dem = 0
  let dangCho: { t: number; x: TinMayTinh } | null = null
  return {
    nhan(tho: unknown, nay: number): MucMayTinhXl[] {
      const d = docTin(tho)
      if (!d || dem >= MT_TRAN_MUC) return []
      if (!d.mo) {
        dangCho = null
        if (!mo) return []
        mo = false; dem += 1
        return [{ t: nay, x: { mo: false } }]
      }
      const ra: MucMayTinhXl[] = []
      // thầy vừa im quá hạn (máy em đã tự cất) rồi quay lại ⇒ coi như mở mới
      if (mo && nay - lucNghe > HET_HAN_MS) mo = false
      lucNghe = nay
      // chỗ mới đang dồn đã đủ nhịp ⇒ ghi với đúng giờ lúc NHẬN nó
      if (dangCho && nay - lucGhi >= MT_NHIP_KEO_MS) { ra.push(dangCho); cho = khoaCho(dangCho.x); lucGhi = dangCho.t; dangCho = null }
      const nd = JSON.stringify([d.mh, d.n]), vt = khoaCho(d)
      if (!mo || nd !== noiDung) { mo = true; noiDung = nd; cho = vt; dangCho = null; lucGhi = lucCon = nay; ra.push({ t: nay, x: d }) }
      else if (vt !== cho) {
        if (nay - lucGhi >= MT_NHIP_KEO_MS) { cho = vt; dangCho = null; lucGhi = lucCon = nay; ra.push({ t: nay, x: d }) }
        else dangCho = { t: nay, x: d }
      } else if (nay - lucCon >= MT_NHIP_CON_MS) { lucCon = nay; ra.push({ t: nay, c: 1 }) }
      dem += ra.length
      return ra
    },
  }
}
export type LocMayTinh = ReturnType<typeof taoLocMayTinh>

const tron = (v: number | undefined, mac: number): number => Math.round((typeof v === 'number' && Number.isFinite(v) ? v : mac) * 1e4) / 1e4
/** Nhật ký máy tính của phòng ⇒ dòng thời gian trên TRỤC TIẾNG cho `buoi.json`. `tat` = giờ phòng các lần tắt live; `F` đổi giờ phòng ⇒ ms trục tiếng
 *  (khoảng đã cắt dồn về mép cắt); `trongLive` = giờ phòng có nằm trong một lần live không. */
export function dungMayTinh(muc: readonly MucMayTinhXl[], tat: readonly number[], F: (w: number) => number, trongLive: (w: number) => boolean): MocMayTinh[] {
  type Dong = { w: number; x: TinMayTinh | null; tat: boolean }
  const ds: Dong[] = []
  for (const m of muc) if (m && typeof m.t === 'number' && Number.isFinite(m.t)) ds.push({ w: m.t, x: 'x' in m && m.x ? m.x : null, tat: false })
  for (const w of tat) ds.push({ w, x: null, tat: true })
  ds.sort((a, b) => a.w - b.w)
  // 1 · trạng thái ĐẦY ĐỦ tại từng mốc (null = đã cất); nhiều dòng rơi vào cùng một mili-giây của trục tiếng ⇒ giữ dòng cuối
  const day: { t: number; tin: TinMayTinh | null }[] = []
  let dang: TinMayTinh | null = null, con = -Infinity
  const them = (w: number, tin: TinMayTinh | null): void => {
    const t = Math.max(0, Math.round(F(w))), c = day[day.length - 1]
    if (c && c.t >= t) c.tin = tin; else day.push({ t, tin })
    dang = tin
  }
  for (const e of ds) {
    if (dang && e.w - con > HET_HAN_MS) them(con + HET_HAN_MS, null) // thầy im quá 13 giây ⇒ máy em lúc live đã tự cất
    if (e.tat) { if (dang) them(e.w, null); continue }
    if (!trongLive(e.w)) continue
    con = e.w
    if (!e.x) continue // dòng «còn»
    if (!e.x.mo) { if (dang) them(e.w, null) } else if (e.x.mh) them(e.w, e.x)
  }
  if (dang) them(con + HET_HAN_MS, null)
  // 2 · nén: màn hình chỉ ghi khi đổi, phím chỉ ghi ở lần bấm mới
  const ra: MocMayTinh[] = []
  let mo = false, mhCu = '', nCu = -1
  for (const d of day) {
    if (!d.tin) { if (mo) ra.push({ t: d.t, mo: 0 }); mo = false; continue }
    const x = d.tin, mh = JSON.stringify(x.mh), m: MocMayTinh = { t: d.t, mo: 1, x: tron(x.x, 0.8), y: tron(x.y, 0.5), w: tron(x.w, 0.25) }
    if (!mo || mh !== mhCu) m.mh = x.mh
    if (x.p && (x.n ?? 0) !== nCu) { m.p = x.p; m.n = x.n ?? 0 }
    nCu = x.n ?? nCu; mhCu = mh; mo = true
    ra.push(m)
  }
  return ra
}
