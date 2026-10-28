// TÊN DẠNG BÀI NHỚ TRONG ISOLATE (28/10 tối, giờ cao điểm). Đo D1 8 phút: «SELECT dang, MIN(json_extract(json,'$.tenDang')) FROM game_v2_question … GROUP BY dang»
// 36 lần × 163 ms (quét cột json của kho câu — có câu 290 KB) ≈ 6 giây D1 chỉ để lấy cái TÊN. Tên dạng gần như không đổi trong ngày ⇒ nhớ theo mã dạng 30 phút;
// mỗi lần chỉ hỏi D1 các mã CHƯA có. Đọc lỗi (null) ⇒ không nhớ gì, trả những tên đã có.
type Dong = Record<string, unknown>
const HAN_MS = 30 * 60_000, TOI_DA = 3000
const nho = new Map<string, { ten: string; luc: number }>()
export const SQL_TEN_DANG = "SELECT dang AS ma, MIN(json_extract(json, '$.tenDang')) AS ten FROM game_v2_question WHERE dang IN (SELECT value FROM json_each(?)) GROUP BY dang"
export function xoaTenDangNho(): void { nho.clear() }
/** `hoi(json)` chạy đúng `SQL_TEN_DANG` với danh sách mã còn thiếu. Trả các dòng `{ma, ten}` (cả từ bộ nhớ) như câu gốc — mã không có tên thì vắng. */
export async function tenDangCoNho(ds: readonly string[], hoi: (json: string) => Promise<Dong[] | null>, now = Date.now()): Promise<Dong[]> {
  const ma = [...new Set(ds.filter(Boolean))]
  const ra: Dong[] = [], thieu: string[] = []
  for (const m of ma) { const c = nho.get(m); if (c && now - c.luc < HAN_MS && now >= c.luc) ra.push({ ma: m, ten: c.ten }); else thieu.push(m) }
  if (thieu.length) {
    const r = await hoi(JSON.stringify(thieu))
    for (const x of r ?? []) {
      const m = String(x.ma ?? ''), ten = typeof x.ten === 'string' ? x.ten : ''
      if (!m || !ten) continue
      nho.delete(m); nho.set(m, { ten, luc: now }); ra.push({ ma: m, ten })
    }
    while (nho.size > TOI_DA) nho.delete(nho.keys().next().value as string)
  }
  return ra
}
