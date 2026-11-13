// NHẬT KÝ BÀI DẠY — KIỂM KỊCH BẢN THEO LƯỢC ĐỒ (./luoc-do.json, bản sao đúng docs/ban-ve-nhat-ky-bai-day-1311/luoc-do.json — test khoá hai bản trùng nhau).
// Bộ kiểm NHỎ cho đúng tập từ khoá lược đồ đang dùng (type, const, enum, required, properties, additionalProperties false, items, minItems, $ref #/$defs, anyOf)
// ⇒ không kéo thư viện kiểm lược đồ vào Worker. Từ khoá khác bị bỏ qua (lược đồ không dùng). Thuần.
import LUOC_DO from './luoc-do.json'

type Sch = Record<string, unknown>
const laObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

function dungKieu(t: string, v: unknown): boolean {
  if (t === 'string') return typeof v === 'string'
  if (t === 'number') return typeof v === 'number' && Number.isFinite(v)
  if (t === 'integer') return typeof v === 'number' && Number.isInteger(v)
  if (t === 'boolean') return typeof v === 'boolean'
  if (t === 'object') return laObj(v)
  if (t === 'array') return Array.isArray(v)
  if (t === 'null') return v === null
  return true
}

/** Lỗi đầu tiên tìm thấy ở mỗi nhánh (đường dẫn kiểu `/canh/2/duLieu/pha`). Rỗng = hợp lệ. Tối đa `toiDa` lỗi. */
export function kiemTheoLuocDo(goc: Sch, v: unknown, toiDa = 12): string[] {
  const loi: string[] = []
  const defs = (goc.$defs ?? {}) as Record<string, Sch>
  const di = (s: Sch, x: unknown, duong: string, ra: string[]): void => {
    if (ra.length >= toiDa) return
    if (typeof s.$ref === 'string') {
      const ten = s.$ref.replace(/^#\/\$defs\//, '')
      const d = defs[ten]
      if (!d) { ra.push(`${duong || '/'}: lược đồ thiếu ${s.$ref}`); return }
      di(d, x, duong, ra); return
    }
    if (Array.isArray(s.anyOf)) {
      let tot: string[] | null = null
      for (const nhanh of s.anyOf as Sch[]) { const r: string[] = []; di(nhanh, x, duong, r); if (!r.length) return; if (!tot || r.length < tot.length) tot = r }
      ra.push(`${duong || '/'}: không khớp dạng nào (gần nhất: ${(tot ?? []).slice(0, 2).join('; ')})`); return
    }
    if ('const' in s && x !== s.const) { ra.push(`${duong || '/'}: phải là ${JSON.stringify(s.const)}`); return }
    if (Array.isArray(s.enum) && !(s.enum as unknown[]).includes(x)) { ra.push(`${duong || '/'}: phải là một trong ${JSON.stringify(s.enum)}`); return }
    if (s.type !== undefined) {
      const ds = Array.isArray(s.type) ? (s.type as string[]) : [String(s.type)]
      if (!ds.some((t) => dungKieu(t, x))) { ra.push(`${duong || '/'}: cần kiểu ${ds.join(' | ')}`); return }
    }
    if (laObj(x) && (s.properties || s.required || s.additionalProperties === false)) {
      const p = (s.properties ?? {}) as Record<string, Sch>
      for (const k of (s.required ?? []) as string[]) if (!(k in x)) ra.push(`${duong}/${k}: thiếu`)
      for (const k of Object.keys(x)) {
        if (p[k]) di(p[k]!, x[k], `${duong}/${k}`, ra)
        else if (s.additionalProperties === false) ra.push(`${duong}/${k}: trường lạ`)
        if (ra.length >= toiDa) return
      }
    }
    if (Array.isArray(x)) {
      if (typeof s.minItems === 'number' && x.length < s.minItems) ra.push(`${duong || '/'}: cần ít nhất ${s.minItems} phần tử`)
      if (laObj(s.items)) for (let i = 0; i < x.length && ra.length < toiDa; i++) di(s.items as Sch, x[i], `${duong}/${i}`, ra)
    }
  }
  di(goc, v, '', loi)
  return loi
}

/** Phần MÁY điền (không nằm trong lược đồ): đầu tệp `buoi`, `nguon`, `ghiChu`, `mau`; `canh[].nguon.vung`; `tong-ket` `y[].giay`. Bỏ trước khi kiểm. */
export function boPhanMay(kb: unknown): unknown {
  if (!laObj(kb)) return kb
  const x = JSON.parse(JSON.stringify(kb)) as Record<string, unknown>
  for (const k of ['buoi', 'nguon', 'ghiChu', 'mau']) delete x[k]
  if (Array.isArray(x.canh)) for (const c of x.canh as Record<string, unknown>[]) {
    if (laObj(c) && laObj(c.nguon)) delete (c.nguon as Record<string, unknown>).vung
    if (laObj(c) && c.khuon === 'tong-ket' && laObj(c.duLieu) && Array.isArray((c.duLieu as Record<string, unknown>).y)) for (const y of (c.duLieu as { y: unknown[] }).y) if (laObj(y)) delete y.giay
  }
  return x
}

/** Kịch bản văn phòng gửi (đã bỏ phần máy điền) có đúng lược đồ «Nhật ký bài dạy» không. */
export const kiemKichBan = (kb: unknown): string[] => kiemTheoLuocDo(LUOC_DO as Sch, kb)
export { LUOC_DO }
