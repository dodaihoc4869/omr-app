// HỎI THÊM THẦY (AI theo lời giải của Thầy, máy chủ server/src/hoi-tro-ly.ts) — tách khỏi loi-giai-api.ts (đợt 22, luật tốc độ 13/10):
// chỉ `HoiThemThay` (tải lười) dùng ⇒ hàm này đi cùng khung, không vào lượt mở app.
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { docTokenHs } from './loi-giai-api'

export type KetQuaHoiThem =
  | { ok: true; traLoi: string; conLai: number; ngoaiPhamVi: boolean }
  | { ok: false; loi: string; ma: string; conLai?: number }

/** Em nhắn một câu hỏi về câu đang mở lời giải. Chờ tối đa 45 giây (Thầy suy nghĩ rồi mới trả lời). */
export async function hoiThemThay(qid: string, nguon: string, cauHoi: string, dapAnEm = ''): Promise<KetQuaHoiThem> {
  const token = docTokenHs()
  if (!token) return { ok: false, ma: 'dang_nhap', loi: 'Em đăng nhập lại để hỏi Thầy.' }
  const dk = new AbortController()
  const t = setTimeout(() => dk.abort(), 45_000)
  try {
    const url = await layDiaChiMayChu()
    if (!url) return { ok: false, ma: 'mang', loi: 'Chưa nối được máy chủ. Em thử lại sau.' }
    const r = await fetch(`${url}/hs/hoi-tro-ly`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, qid, nguon, cauHoi, dapAnEm }), signal: dk.signal })
    const j = (await r.json()) as Record<string, unknown>
    const conLai = typeof j.conLai === 'number' ? j.conLai : undefined
    if (j.ok === true) return { ok: true, traLoi: String(j.traLoi ?? ''), conLai: conLai ?? 0, ngoaiPhamVi: j.ngoaiPhamVi === true }
    return { ok: false, ma: String(j.ma ?? 'loi'), loi: String(j.error ?? 'Thầy chưa trả lời được. Em thử lại sau.'), ...(conLai !== undefined ? { conLai } : {}) }
  } catch {
    return { ok: false, ma: dk.signal.aborted ? 'cham' : 'mang', loi: dk.signal.aborted ? 'Thầy trả lời chưa kịp. Em gửi lại câu hỏi nhé.' : 'Chưa nối được máy chủ. Em thử lại sau.' }
  } finally {
    clearTimeout(t)
  }
}
