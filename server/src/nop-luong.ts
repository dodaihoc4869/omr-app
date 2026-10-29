// NỘP CÂU THEO LUỒNG (thầy 28/10 «Bấm kiểm tra vẫn bị chậm, chưa tức thì ngay») — xem cham-nhanh.ts.
// `POST /game-v2/answer` với `luong: 1` ⇒ NDJSON hai dòng: dòng 1 (`tam: true`) đúng / sai đi NGAY; dòng 2 = phản hồi `answer` đầy đủ như cũ, cùng yêu cầu, giữ sống bằng `ctx.waitUntil`.
// Hai nguồn của dòng 1:
//   (a) ĐỆM isolate (`chamNhanh`): chấm từ bộ nhớ, 0 đợt D1 — khi phiên / câu / phạm vi đã nằm trong isolate này.
//   (b) ĐƯỜNG THƯỜNG SỚM (29/10, thầy «Bấm kiểm tra vẫn chưa tức thì»): đệm trượt (giờ cao điểm nhiều isolate ⇒ câu chưa ở isolate này) ⇒ chạy lệnh đầy đủ NHƯNG game-v2.ts gửi
//       dòng 1 ngay khi chấm xong sau đợt đọc đầu (`phatTamSom`) — không chờ OMNI + lô ghi. Lệnh xong trước khi có dòng 1 (lỗi, câu lướt, phiên đặc biệt…) ⇒ JSON thường như cũ
//       (lỗi ném ra như cũ ⇒ mã trạng thái y hệt).
// Công tắc khẩn: biến môi trường `TAT_NOP_LUONG` có giá trị thật ⇒ luôn JSON thường (máy em đọc được cả hai kiểu); `TAT_TAM_SOM` chỉ tắt nguồn (b).
import { gameSbdDaKy } from './game-v2-auth'
import { chamNhanh, dangKyTamSom, nhoDaLo, type DongNhanh } from './cham-nhanh'
import { KIEU_LUONG_DANG_NHAP } from './dang-nhap-kem-sanh'
import type { Env } from './kieu'

type Obj = Record<string, unknown>

const coGiaTri = (v: unknown): boolean => v !== undefined && v !== null && v !== '' && v !== '0' && v !== 'false' && v !== false
export const nopLuongBiTat = (env: unknown): boolean => coGiaTri((env as Obj | null | undefined)?.TAT_NOP_LUONG)
export const tamSomBiTat = (env: unknown): boolean => coGiaTri((env as Obj | null | undefined)?.TAT_TAM_SOM)

type KetLenh = { r: Obj } | { e: unknown }
const loiThanh = (e: unknown): Obj => {
  const ma = (e as { ma?: unknown } | null)?.ma
  return { ok: false, error: e instanceof Error ? e.message : 'Lỗi máy chủ', ...(typeof ma === 'string' ? { ma } : {}) }
}

/** Trả luồng NDJSON: dòng 1 ngay, rồi (khi lệnh đầy đủ xong) dòng 2. Máy em ngắt giữa chừng ⇒ lệnh vẫn chạy xong (`ctx.waitUntil`). */
function phatLuong(dong1: DongNhanh, du: Promise<KetLenh>, nguon: 'nho' | 'som', t0: number, headers: Record<string, string>, trangTri: (r: Obj) => Obj, ctx: { waitUntil(p: Promise<unknown>): void }): Response {
  const msDong1 = Date.now() - t0
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const w = writable.getWriter()
  const mh = new TextEncoder()
  const viec = (async () => {
    try {
      await w.write(mh.encode(JSON.stringify(trangTri(dong1 as unknown as Obj)) + '\n'))
      const x = await du
      const r = 'r' in x ? x.r : loiThanh(x.e)
      await w.write(mh.encode(JSON.stringify(trangTri(r)) + '\n'))
      await w.close()
      console.log('[nop-luong]', JSON.stringify({ nguon, dong1Ms: msDong1, duMs: Date.now() - t0, ok: r.ok === true, khop: r.ok === true ? r.correct === dong1.correct : null }))
    } catch {
      try { await w.abort() } catch { /* máy em đã ngắt */ }
      await du.catch(() => null) // máy em ngắt: lượt ghi vẫn chạy xong
    }
  })()
  ctx.waitUntil(viec)
  return new Response(readable, { status: 200, headers: { ...headers, 'content-type': KIEU_LUONG_DANG_NHAP, 'cache-control': 'no-store, no-transform' } })
}

/**
 * `chay` = đúng lệnh `answer` đầy đủ (index.ts truyền `gameV2`); `trangTri` thêm `serverNow` / `nhipDeNghi` như `ra()`; `raThuong` dựng phản hồi JSON thường (đúng `ra()`).
 * Không bao giờ ném vì LỖI XÁC THỰC / ĐỆM (⇒ `null`: đường thường lo); lỗi của chính lệnh đầy đủ ném ra như đường thường.
 */
export async function traLoiNopLuong(env: Env, b: Obj, headers: Record<string, string>, chay: () => Promise<Obj>, trangTri: (r: Obj) => Obj,
  ctx?: { waitUntil(p: Promise<unknown>): void }, raThuong?: (r: Obj) => Response): Promise<Response | null> {
  if (nopLuongBiTat(env) || !ctx) return null
  const t0 = Date.now()
  let sbd: string
  try { sbd = await gameSbdDaKy(env, b) } catch { return null }
  const dong1 = chamNhanh(sbd, b, t0)
  if (dong1) {
    // Đáp án đã xuống máy em ⇒ mọi lượt chấm lại câu này ở isolate (dòng 2 lỗi rồi gửi lại…) chấm đúng đáp án vừa nộp.
    nhoDaLo(`${String(b.session ?? '')}|${String(b.qid ?? '')}`, String(b.answer ?? ''))
    // Lệnh đầy đủ bắt đầu NGAY (song song với lúc dòng 1 đi) — y như yêu cầu `answer` thường.
    const du: Promise<KetLenh> = (async () => { try { return { r: await chay() } } catch (e) { return { r: loiThanh(e) } } })()
    return phatLuong(dong1, du, 'nho', t0, headers, trangTri, ctx)
  }
  // (b) Đệm trượt: chạy lệnh đầy đủ, chờ dòng 1 SỚM của đường thường (hoặc kết quả cuối, cái nào tới trước).
  if (tamSomBiTat(env) || !raThuong) return null
  let phat: (d: DongNhanh) => void = () => {}
  const tam = new Promise<DongNhanh>((ok) => { phat = ok })
  dangKyTamSom(b, (d) => phat(d))
  const du: Promise<KetLenh> = (async () => { try { return { r: await chay() } } catch (e) { return { e } } })()
  const dau = await Promise.race([tam.then((d) => d as DongNhanh | null), du.then(() => null)])
  if (dau) {
    // Từ đây lệnh lỗi ⇒ dòng 2 mang lời lỗi (đã phát đúng / sai thì không còn ném được mã trạng thái).
    const duLuong: Promise<KetLenh> = du.then((x) => ('e' in x ? { r: loiThanh(x.e) } : x))
    return phatLuong(dau, duLuong, 'som', t0, headers, trangTri, ctx)
  }
  const x = await du
  if ('e' in x) throw x.e
  return raThuong(x.r)
}
