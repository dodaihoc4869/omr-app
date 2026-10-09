// Hành trình giỏi hoá: mức tối thiểu theo ngày, câu khác nhau, chặng ngắn.
// Không dùng hạng L1–L4 (tỉ lệ đúng) thay cho tầng nội dung của bài.
import { HANG_MUC_DO, bam, soSanhNo, type CauSrs, type TrangThaiCau } from './srs2-loi'

export type TangHanhTrinh = 1 | 2 | 3 | 4
export const CAU_TOI_THIEU = { 1: 24, 2: 30, 3: 36, 4: 36 } as const
export const CAU_MOI_CHANG = 6
export interface TienDoHanhTrinh {
  tang: TangHanhTrinh
  toiThieu: number
  daLam: number
  daXep: number
  conThieu: number
  soChang: number
  changHienTai: number
  cauTrongChang: number
}

/** Sao 2 / vận dụng cao là tổng hợp; mức chưa rõ không tự quy thành nền. */
export function tangCuaCau(c: CauSrs): TangHanhTrinh | null {
  const muc = c.mucDo?.trim() ?? ''
  const m = HANG_MUC_DO[muc] ?? ({ biet: 0, hieu: 1, van_dung: 2 } as Record<string, number>)[muc]
  if (m === undefined) return null
  if ((c.sao ?? 0) >= 2 || m >= 3) return 4
  return (m + 1) as TangHanhTrinh
}

/** Mở tầng kế tiếp khi 80% nhóm nội dung ở tầng dưới đã có bằng chứng vững.
 * Khi có OMNI, dạng vững lấy từ SPRT; trạng thái câu vẫn dùng luật đóng lỗi chung.
 * Không có câu ở tầng dưới ⇒ thiếu bằng chứng, không tự mở tầng cao.
 */
export function tangCuaEm(cau: readonly CauSrs[], tt: ReadonlyMap<string, TrangThaiCau>,
  nhom: ReadonlyMap<string, string>, dangVung: readonly string[] = []): TangHanhTrinh {
  const vung = new Set(dangVung)
  let tang: TangHanhTrinh = 1
  for (const t of [1, 2, 3] as const) {
    const ds = new Map<string, boolean>()
    for (const c of cau) {
      if (tangCuaCau(c) !== t) continue
      const k = nhom.get(c.qid) || c.qid
      ds.set(k, (ds.get(k) ?? false) || tt.get(c.qid)?.thanhThao === true || (!!c.dang && vung.has(c.dang)))
    }
    if (!ds.size || [...ds.values()].filter(Boolean).length / ds.size < 0.8) break
    tang = (t + 1) as TangHanhTrinh
  }
  return tang
}

export function tienDoHanhTrinh(tang: TangHanhTrinh, toiThieu: number, daXep: number, daLam: number): TienDoHanhTrinh {
  const xong = Math.min(daXep, Math.max(0, daLam))
  const soChang = Math.ceil(toiThieu / CAU_MOI_CHANG)
  return { tang, toiThieu, daLam: xong, daXep, conThieu: Math.max(0, toiThieu - daXep), soChang,
    changHienTai: Math.min(soChang, Math.floor(xong / CAU_MOI_CHANG) + 1),
    cauTrongChang: xong >= toiThieu ? 0 : Math.min(CAU_MOI_CHANG - xong % CAU_MOI_CHANG, Math.max(0, daXep - xong)) }
}

export interface DauVaoHanhTrinh {
  ngay: string
  tang: TangHanhTrinh
  toiThieu: number
  daLam: readonly string[]
  cau: readonly CauSrs[]
  tt: ReadonlyMap<string, TrangThaiCau>
  nhom: ReadonlyMap<string, string>
  chan: ReadonlySet<string>
  trongSo?: Readonly<Record<string, number>>
  tangSanSang?: ReadonlyMap<string, TangHanhTrinh>
  uuTienCanThiep?: string
}

/** Chọn phần còn lại; không lặp nội dung để đủ sàn, không kéo ôn chưa đến hạn.
 * Nợ nặng ⇒ tăng phần sửa lỗi. Phần trống được chuyển cho nhóm khác hợp lệ.
 */
export function chonCauHanhTrinh(a: DauVaoHanhTrinh): { dao: string[]; doan: string[] } {
  const da = new Set(a.daLam)
  const nhomDa = new Set(a.daLam.map(q => a.nhom.get(q) || q))
  const ung = a.cau.filter(c => {
    const t = a.tt.get(c.qid), tang = tangCuaCau(c)
    if (!t || t.catTia || da.has(c.qid) || nhomDa.has(a.nhom.get(c.qid) || c.qid) || a.chan.has(c.qid)) return false
    if (tang == null || tang > (a.tangSanSang?.get(c.qid) ?? a.tang)) return false
    if (t.laMoi) return true
    return !!t.henOn && t.henOn <= a.ngay
  })
  const tie = (x: CauSrs, y: CauSrs) => bam(`${a.ngay}|${x.qid}`) - bam(`${a.ngay}|${y.qid}`) || x.qid.localeCompare(y.qid)
  const moi = ung.filter(c => a.tt.get(c.qid)!.laMoi).sort((x, y) =>
    (a.trongSo?.[y.qid] ?? 0) - (a.trongSo?.[x.qid] ?? 0) || (tangCuaCau(y)! - tangCuaCau(x)!) || tie(x, y))
  const no = ung.filter(c => !a.tt.get(c.qid)!.laMoi && !a.tt.get(c.qid)!.thanhThao)
    .sort((x, y) => soSanhNo(x, y, a.tt, a.ngay) || (a.trongSo?.[y.qid] ?? 0)-(a.trongSo?.[x.qid] ?? 0) || tie(x, y))
  const on = ung.filter(c => a.tt.get(c.qid)!.thanhThao).sort((x,y)=>(a.trongSo?.[y.qid]??0)-(a.trongSo?.[x.qid]??0) || tie(x,y))
  const n = Math.max(0, a.toiThieu - da.size)
  const chon: CauSrs[] = [], dungNhom = new Set(nhomDa)
  const lay = (ds: readonly CauSrs[], so: number) => {
    let dem = 0
    for (const c of ds) {
      if (chon.length >= n || dem >= so) break
      const k = a.nhom.get(c.qid) || c.qid
      if (dungNhom.has(k)) continue
      dungNhom.add(k); chon.push(c); dem++
    }
  }
  lay(ung.filter(c=>c.qid===a.uuTienCanThiep),1)
  lay(no, Math.ceil(n * (no.length > n / 2 ? 0.5 : 0.3)))
  lay(moi, Math.ceil(n * 0.5))
  lay(on, Math.ceil(n * 0.2))
  lay(no, n); lay(moi, n); lay(on, n)
  // Chưa gặp đi Đảo, ôn Phần II đi Đảo; ôn I/III đi Đoàn như luồng hiện có.
  return { dao: chon.filter(c => a.tt.get(c.qid)!.laMoi || c.phan === 'II').map(c => c.qid),
    doan: chon.filter(c => !a.tt.get(c.qid)!.laMoi && c.phan !== 'II').map(c => c.qid) }
}
