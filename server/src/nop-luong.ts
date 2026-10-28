// NỘP CÂU THEO LUỒNG (thầy 28/10 «Bấm kiểm tra vẫn bị chậm, chưa tức thì ngay») — xem cham-nhanh.ts.
// `POST /game-v2/answer` với `luong: 1`: chấm được từ bộ nhớ ⇒ NDJSON hai dòng (dòng 1 đúng / sai đi NGAY, 0 đợt D1; dòng 2 = phản hồi `answer` đầy đủ như cũ,
// cùng yêu cầu, giữ sống bằng `ctx.waitUntil`). Không chấm được từ bộ nhớ ⇒ `null` ⇒ index.ts trả JSON thường như cũ.
// Công tắc khẩn: biến môi trường `TAT_NOP_LUONG` có giá trị thật ⇒ luôn JSON thường (máy em đọc được cả hai kiểu).
import { gameSbdDaKy } from './game-v2-auth'
import { chamNhanh, nhoDaLo } from './cham-nhanh'
import { KIEU_LUONG_DANG_NHAP } from './dang-nhap-kem-sanh'
import type { Env } from './kieu'

type Obj = Record<string, unknown>

export const nopLuongBiTat = (env: unknown): boolean => {
  const v = (env as Obj | null | undefined)?.TAT_NOP_LUONG
  return v !== undefined && v !== null && v !== '' && v !== '0' && v !== 'false' && v !== false
}

/**
 * `chay` = đúng lệnh `answer` đầy đủ (index.ts truyền `gameV2`); `trangTri` thêm `serverNow` / `nhipDeNghi` như `ra()`. Không bao giờ ném: lỗi xác thực / đệm thiếu ⇒ `null`.
 */
export async function traLoiNopLuong(env: Env, b: Obj, headers: Record<string, string>, chay: () => Promise<Obj>, trangTri: (r: Obj) => Obj,
  ctx?: { waitUntil(p: Promise<unknown>): void }): Promise<Response | null> {
  if (nopLuongBiTat(env) || !ctx) return null
  const t0 = Date.now()
  let sbd: string
  try { sbd = await gameSbdDaKy(env, b) } catch { return null }
  const dong1 = chamNhanh(sbd, b, t0)
  if (!dong1) return null
  // Đáp án đã xuống máy em ⇒ mọi lượt chấm lại câu này ở isolate (dòng 2 lỗi rồi gửi lại…) chấm đúng đáp án vừa nộp.
  nhoDaLo(`${String(b.session ?? '')}|${String(b.qid ?? '')}`, String(b.answer ?? ''))
  const msDong1 = Date.now() - t0
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const w = writable.getWriter()
  const mh = new TextEncoder()
  // Lệnh đầy đủ bắt đầu NGAY (song song với lúc dòng 1 đi) — y như yêu cầu `answer` thường.
  const du = (async (): Promise<Obj> => {
    try { return await chay() } catch (e) {
      const ma = (e as { ma?: unknown } | null)?.ma
      return { ok: false, error: e instanceof Error ? e.message : 'Lỗi máy chủ', ...(typeof ma === 'string' ? { ma } : {}) }
    }
  })()
  const viec = (async () => {
    try {
      await w.write(mh.encode(JSON.stringify(trangTri(dong1 as unknown as Obj)) + '\n'))
      const r = await du
      await w.write(mh.encode(JSON.stringify(trangTri(r)) + '\n'))
      await w.close()
      console.log('[nop-luong]', JSON.stringify({ dong1Ms: msDong1, duMs: Date.now() - t0, ok: r.ok === true, khop: r.ok === true ? r.correct === dong1.correct : null }))
    } catch {
      try { await w.abort() } catch { /* máy em đã ngắt */ }
      await du.catch(() => null) // máy em ngắt: lượt ghi vẫn chạy xong
    }
  })()
  ctx.waitUntil(viec)
  return new Response(readable, { status: 200, headers: { ...headers, 'content-type': KIEU_LUONG_DANG_NHAP, 'cache-control': 'no-store, no-transform' } })
}
