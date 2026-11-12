// «CHỈ GIỌNG THẦY» (Live, 12/11 — đường thử chỉ-thầy, mặc định tắt; src/lib/live/chi-thay.ts): tệp mô hình tách giọng riêng thầy (.tgt ≈ 2 MB) nằm trong
// R2 ở MỘT khoá cố định. Giọng thầy là dữ liệu riêng ⇒ CHỈ trả khi có mã thầy (`laThay` của index.ts — cùng cách mọi lệnh thầy), không đệm ở đâu cả.
//   GET  /gv/mo-hinh-thay — app thầy tải mô hình (một lượt đọc R2, KHÔNG chạm D1).
//   POST /gv/mo-hinh-thay — thầy / phiên Claude thay tệp mô hình (thân = tệp .tgt; chỉ nhận đúng dạng 'TGT1', ≤ 16 MB) — cùng khoá, bản mới đè bản cũ.
import { CORS } from './cors'
import type { Env } from './kieu'

export const DUONG_MO_HINH_THAY = '/gv/mo-hinh-thay'
export const KHOA_MO_HINH_THAY = 'mo-hinh-thay/thu.tgt'
const TOI_DA = 16 * 1024 * 1024

export async function moHinhThay(req: Request, env: Env, laThay: boolean): Promise<Response> {
  const dau = { ...CORS, 'cache-control': 'no-store' }
  const json = (status: number, du: Record<string, unknown>): Response => new Response(JSON.stringify(du), { status, headers: { ...dau, 'content-type': 'application/json;charset=utf-8' } })
  if (req.method !== 'GET' && req.method !== 'POST') return json(405, { ok: false, error: 'Chỉ GET / POST.' })
  if (!laThay) return json(403, { ok: false, error: 'Cần mã bí mật của thầy.' })
  if (!env.DE) return json(503, { ok: false, error: 'Máy chủ chưa có kho tệp.' })
  if (req.method === 'POST') {
    const b = await req.arrayBuffer()
    const u8 = new Uint8Array(b, 0, Math.min(4, b.byteLength))
    if (b.byteLength < 16 || b.byteLength > TOI_DA || String.fromCharCode(...u8) !== 'TGT1') return json(400, { ok: false, error: 'Tệp mô hình sai dạng.' })
    await env.DE.put(KHOA_MO_HINH_THAY, b, { httpMetadata: { contentType: 'application/octet-stream' } })
    return json(200, { ok: true, khoa: KHOA_MO_HINH_THAY, kich: b.byteLength })
  }
  const o = await env.DE.get(KHOA_MO_HINH_THAY)
  if (!o) return json(404, { ok: false, error: 'Chưa có mô hình.' })
  return new Response(o.body, { headers: { ...dau, 'content-type': 'application/octet-stream', ...(typeof o.size === 'number' ? { 'content-length': String(o.size) } : {}) } })
}
