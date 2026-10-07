// Cửa vận hành tạm: chỉ giao theo luật máy chủ, không nhận SQL/danh tính/đáp án.
import type { Env } from '../server/src/kieu'
import { giaoPilot } from '../server/src/chua-cau-sai-thay'
import { docCauHinh, xoaDemChua } from '../server/src/chua-cau-sai-cau-hinh'

export type EnvGiao = Env & { CHUA_KEY: string; CHUA_HAN: string }
export async function giaoVanHanh(request: Request, env: EnvGiao): Promise<Response> {
  const headers = { 'cache-control': 'no-store' }
  if (!/^[a-f0-9]{64}$/.test(env.CHUA_KEY ?? '') || request.headers.get('authorization') !== `Bearer ${env.CHUA_KEY}` || !Number.isFinite(Number(env.CHUA_HAN)) || Date.now() >= Number(env.CHUA_HAN))
    return Response.json({ ok: false }, { status: 401, headers })
  if (request.method !== 'POST' || new URL(request.url).pathname !== '/giao')
    return Response.json({ ok: false }, { status: 404, headers })
  let offset: unknown
  try { offset = ((await request.json()) as { offset?: unknown }).offset } catch {
    return Response.json({ ok: false }, { status: 400, headers })
  }
  if (!Number.isSafeInteger(offset) || Number(offset) < 0 || Number(offset) > 100000)
    return Response.json({ ok: false }, { status: 400, headers })
  try {
    const ca = await env.DB.prepare("SELECT COUNT(*) AS n FROM ca WHERE trang_thai='mo'").first<{ n: number }>()
    xoaDemChua(env)
    const config = await docCauHinh(env)
    if (!ca || ca.n !== 0 || !config.bat || config.phamVi !== 'tat_ca')
      return Response.json({ ok: false }, { status: 409, headers })
    const response = await giaoPilot(env, { offset })
    const result = await response.json() as { ok?: boolean; ds?: { ok: boolean; ma?: string }[]; tiepOffset?: number; con?: boolean }
    if (!response.ok || !result.ok || !Array.isArray(result.ds) || result.ds.some(x => !x.ok && x.ma !== 'CHUA_CO_LOI'))
      return Response.json({ ok: false }, { status: 503, headers })
    // Không chuyển sbd/qid/dotId hoặc bất kỳ câu trả lời nào ra nhật ký runner.
    return Response.json({ ok: true, soCap: result.ds.length, tiepOffset: result.tiepOffset, con: result.con }, { headers })
  } catch {
    return Response.json({ ok: false }, { status: 503, headers })
  }
}
