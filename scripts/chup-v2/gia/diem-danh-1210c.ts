// LÀN ĐIỂM DANH 12/10C — máy chủ GIẢ cho cảnh `?man=gv-nhip&ht2=1&dd12c=1` (Hành trình › Dạy học & đầu giờ, bước 1 Điểm danh theo bản vẽ GV-DiemDanh
// + hai bản chiếu + tấm Hồ sơ làm bài). Chỉ trả lời khi `dd12c=1` (mọi cảnh khác đi tiếp máy giả chung — ảnh cũ không đổi). Tên em là tên GIẢ.
//   · buổi đang mở của lớp "12 Nhóm 10 điểm" (38 em của bộ Nhịp học giả gia/nhip-hoc.ts — CÙNG em, cùng số ⇒ nhóm Chăm / Lười trên ảnh đúng luật);
//     em thứ 3, 8, 13 … vắng; em có mặt điểm danh lần lượt từ 17:52 (giờ Việt Nam), em thứ 4 do thầy thêm;
//   · `/gv/ho-so-thai-do` + `/gv/lich-su-lam-cau` của đúng em ấy (tấm Hồ sơ làm bài đủ số); `/gv/dau-gio`: chưa gọi em nào (buổi vừa điểm danh).
import type { EmNhipHoc } from '../../../server/src/nhip-hoc-kieu'
import { lichSuGia } from './lich-su-lam-cau'
import { hoSoTuNhip, nhipHocGia, tenEmNhip } from './nhip-hoc'

export const LA_DD12C = new URLSearchParams(globalThis.location?.search ?? '').get('dd12c') === '1'

/** Thanh Mức làm ở bảng điểm danh (thầy 20/10, bản vẽ 03): chỉ khi `&mlo=1` — ảnh cũ của cảnh dd12c KHÔNG đổi. */
export const LA_MLO = LA_DD12C && new URLSearchParams(globalThis.location?.search ?? '').get('mlo') === '1'
const MAU_MUC: { m: [number, number, number, number]; chua: number; uoc: number }[] = [
  { m: [6, 9, 30, 7], chua: 3, uoc: 0 },
  { m: [2, 2, 10, 2], chua: 0, uoc: 4 },
  { m: [0, 0, 0, 0], chua: 40, uoc: 0 },
  { m: [0, 0, 0, 0], chua: 0, uoc: 0 },
  { m: [8, 12, 14, 0], chua: 5, uoc: 0 },
  { m: [1, 3, 9, 4], chua: 0, uoc: 0 },
]
/** Mức làm 14 ngày GIẢ của một em (xác định theo SBD): đủ các trạng thái — có đo, ≈ ước tính, toàn chưa có số đo, không lượt nào. */
function mucLamGia(sbd: string) {
  let h = 0
  for (const c of sbd) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const x = MAU_MUC[h % MAU_MUC.length]!
  return { soDo: x.m[0] + x.m[1] + x.m[2] + x.m[3], chuaCoSoDo: x.chua, m: x.m, soUocTinh: x.uoc }
}

const LOP = '12 Nhóm 10 điểm'
const MO_LUC = '2026-10-12T10:52:00Z' // 17:52 giờ Việt Nam
const BUOI = { id: 'BH-DD12C', ten: `Buổi học 12/10 · ${LOP}`, lop: LOP, moLuc: MO_LUC, hetHan: '2026-10-13T10:52:00Z', dongLuc: null, dangMo: true }

type KQ = { ok: true; du: Record<string, unknown> } | { ok: false; loai: string; chu: string }
const du = (o: Record<string, unknown>): KQ => ({ ok: true, du: { ok: true, ...o } })

function emLop(): EmNhipHoc[] {
  const r = nhipHocGia()
  return r.ok ? (r.du.em as EmNhipHoc[]).filter((e) => e.lop === LOP) : []
}

function trangThai() {
  const ds = emLop()
  const vang = new Set(ds.filter((_, i) => i % 5 === 2).map((e) => e.sbd))
  const coMat = ds
    .filter((e) => !vang.has(e.sbd))
    .map((e, i) => ({ sbd: e.sbd, hoTen: e.hoTen, luc: new Date(Date.parse(MO_LUC) + 60_000 + i * 21_000).toISOString(), cach: i === 3 ? 'thay' : 'ma' }))
  return { buoi: BUOI, ma: '482915', doiMaLuc: 1, coMat, siSo: ds.length, lopEm: ds.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, tenLop: LOP })) }
}

/** Trả lời một lệnh của cảnh dd12c; `null` ⇒ để máy giả khác trả lời (`/gv/nhip-hoc` = bộ giả Nhịp học chung). */
export function traLoiDd12c(duong: string, b: Record<string, unknown>): KQ | null {
  if (!LA_DD12C) return null
  if (duong === '/gv/buoi-hoc') {
    if (b.action === 'dang-mo') return du({ buoi: [BUOI] })
    if (b.action === 'gan-day') return null
    return du(trangThai())
  }
  if (duong === '/gv/muc-lam-lo' && LA_MLO) return du({ tu: '2026-09-29', den: '2026-10-12', em: Object.fromEntries((Array.isArray(b.sbds) ? (b.sbds as string[]) : []).map((x) => [x, mucLamGia(String(x))])) })
  if (duong === '/gv/dau-gio') return b.action === 'xem' ? du({ daKetThuc: false, luot: [] }) : du({ ketQua: [] })
  const sbd = String(b.sbd ?? '')
  if (duong === '/gv/ho-so-thai-do' && tenEmNhip(sbd)) return { ok: true, du: hoSoTuNhip(sbd) as unknown as Record<string, unknown> }
  if (duong === '/gv/lich-su-lam-cau' && tenEmNhip(sbd)) return { ok: true, du: lichSuGia(sbd, tenEmNhip(sbd)!) as unknown as Record<string, unknown> }
  return null
}
