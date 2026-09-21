// LỚP NỐI "TÊN LỚP" của app thầy (thầy lệnh 21/09: tách khối 12 thành "12 - Tinh Hoa" / "12 - Lớp Thường"; `lop` vẫn là khối, `ten_lop` là tên lớp thật).
// Chỉ tệp này biết hình dạng hai lệnh (hợp đồng docs/hop-dong-ten-lop-2109.md, Code 3, main 98d26c2):
//   POST /gv/lop {}                        → { ok, soEm, lop: [{ tenLop, khoi, soEm, sbd: [..] }], lyDoThieu? }   (đọc; `lyDoThieu` chỉ có khi máy chủ chưa chạy migration ⇒ mọi em ở lớp mặc định theo khối)
//   POST /gv/doi-lop-em {sbd, tenLop}      → { ok, sbd, tenLop }  hoặc { ok:false, error: lời tiếng Việt }         (GHI — đổi tên lớp MỘT em)
// Lệnh chưa có (404) ⇒ mọi chỗ dùng ẨN mục tên lớp, KHÔNG lỗi đỏ.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { goiLenh, type KetQuaLenh } from './goi-lenh-thay'

export interface LopThay {
  tenLop: string
  khoi: string
  soEm: number
  sbd: string[]
}

const chu = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')

/** Đọc CÓ CHỐNG SAI KIỂU: lớp không tên bị bỏ; `soEm` thiếu ⇒ số SBD; SBD trùng trong một lớp bị gộp. */
export function docLop(j: Record<string, unknown>): LopThay[] {
  const ds = Array.isArray(j.lop) ? (j.lop as unknown[]) : []
  const kq: LopThay[] = []
  for (const x of ds) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    if (!chu(o.tenLop)) continue
    const sbd = [...new Set((Array.isArray(o.sbd) ? (o.sbd as unknown[]) : []).map(chu).filter(Boolean))]
    kq.push({ tenLop: chu(o.tenLop), khoi: chu(o.khoi), soEm: typeof o.soEm === 'number' && Number.isFinite(o.soEm) ? o.soEm : sbd.length, sbd })
  }
  return kq
}

/** Danh sách lớp của thầy (lệnh CHỈ ĐỌC). 404 ⇒ lời thật, không danh sách giả. */
export interface DanhSachLop {
  lop: LopThay[]
  /** Máy chủ nói VÌ SAO chưa có tên lớp thật (vd chưa chạy migration) — hiện nguyên văn, không bịa. Vắng ⇒ ''. */
  lyDoThieu: string
}
export async function layLopThay(): Promise<KetQuaLenh<DanhSachLop>> {
  const r = await goiLenh('/gv/lop', {}, 'Máy chủ chưa có lệnh tên lớp.')
  if (!r.ok) return r
  if (!Array.isArray(r.du.lop)) return { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả danh sách lớp không đúng dạng.' }
  return { ok: true, du: { lop: docLop(r.du), lyDoThieu: chu(r.du.lyDoThieu) } }
}

/** Đổi tên lớp của MỘT em (lệnh GHI). Máy chủ từ chối ⇒ giữ nguyên lời của máy chủ; chậm ⇒ nói CHƯA CHẮC. */
export async function doiLopMotEm(sbd: string, tenLop: string): Promise<KetQuaLenh<{ sbd: string; tenLop: string }>> {
  const ten = tenLop.trim()
  if (!sbd.trim() || !ten) return { ok: false, loai: 'tu_choi', chu: 'Chưa chọn em hoặc chưa nhập tên lớp.' }
  const r = await goiLenh(
    '/gv/doi-lop-em',
    { sbd, tenLop: ten },
    'Máy chủ chưa có lệnh đổi lớp — chưa đổi gì.',
    'Máy chủ trả lời chậm — CHƯA CHẮC đã đổi lớp. Mở lại danh sách học sinh để xem tên lớp thật (đừng bấm đổi lần nữa ngay).',
  )
  if (!r.ok) return r
  return { ok: true, du: { sbd: chu(r.du.sbd) || sbd, tenLop: chu(r.du.tenLop) || ten } }
}

export const chuChipLop = (l: Pick<LopThay, 'tenLop' | 'soEm'>) => `${l.tenLop} · ${l.soEm} em`

/** sbd → tên lớp (em nào không có trong danh sách lớp thì không có khoá). */
export function banDoTenLop(ds: LopThay[]): Record<string, string> {
  const m: Record<string, string> = {}
  for (const l of ds) for (const s of l.sbd) m[s] = l.tenLop
  return m
}

// Nhớ ngắn trong bộ nhớ (60 giây) để mở nhanh giữa Giao bài / Học sinh không gọi máy chủ lặp; đổi lớp xong thì xoá.
let nho: { luc: number; r: KetQuaLenh<DanhSachLop> } | null = null
const HAN_NHO_MS = 60_000
export const xoaNhoLop = () => {
  nho = null
}
async function layCoNho(): Promise<KetQuaLenh<DanhSachLop>> {
  if (nho && Date.now() - nho.luc < HAN_NHO_MS) return nho.r
  const r = await layLopThay()
  nho = { luc: Date.now(), r }
  return r
}

/** Hook: danh sách lớp + tên lớp của từng em. `ds === null` ⇒ chưa có (đang tải hoặc lệnh chưa có) — nơi dùng ẩn mục tên lớp. */
export function useLopThay(): { ds: LopThay[] | null; lyDoThieu: string; tenLopCua: (sbd: string) => string; lamMoi: () => void } {
  const [ket, setKet] = useState<KetQuaLenh<DanhSachLop> | undefined>(undefined)
  const [lan, setLan] = useState(0)
  useEffect(() => {
    let con = true
    void layCoNho().then((r) => con && setKet(r))
    return () => {
      con = false
    }
  }, [lan])
  const ds = ket?.ok && ket.du.lop.length > 0 ? ket.du.lop : null
  const ban = useMemo(() => (ds ? banDoTenLop(ds) : {}), [ds])
  const lamMoi = useCallback(() => {
    xoaNhoLop()
    setLan((n) => n + 1)
  }, [])
  return { ds, lyDoThieu: ket?.ok ? ket.du.lyDoThieu : '', tenLopCua: (sbd) => ban[sbd] ?? '', lamMoi }
}
