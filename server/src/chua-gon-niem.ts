// TEM NIÊM PHONG CHO MÀN SỬA CÂU (thầy 29/10, video 09:47 «Bấm kiểm tra còn quá lâu. Phải tức thì luôn»: Tự sửa lỗi — Kiểm tra ~1,5 s khi sai, ~3,5 s khi đúng, «Làm lại» ~1,5–2 s).
// Cùng ý với niem-phong.ts (câu học tập), áp cho gon-mo / gon-nop (chua-gon-lenh.ts):
//  · gon-mo (mở bản làm lại) gắn `sk` — tem AES-GCM chứa kết quả CỦA CẢ HAI ĐÁP ÁN (đúng / sai) cho LẦN này: đáp án, lời giải, ảnh sau lời giải, gợi ý (lần 1), có tính «Đã tự sửa» không…
//    Máy em chỉ giữ chuỗi mờ (không có khoá) — đáp án vẫn chỉ ra sau khi em nộp.
//  · gon-nop `luong: 1` + `sk` ⇒ NDJSON: DÒNG 1 (`tam: true`) = kết quả suy từ tem, KHÔNG đợt D1 nào (isolate nào đón cũng đi ngay); DÒNG 2 = phản hồi `gon-nop` đầy đủ như cũ
//    (chạy trong cùng yêu cầu, giữ bằng `ctx.waitUntil`: ghi lần nộp, đóng đợt, thưởng; trần 2 lần / khoá chống lặp vẫn do máy chủ chốt). Dòng 2 khác dòng 1 ⇒ máy em lấy dòng 2.
//  · Sai ở lần 1 ⇒ dòng 1 kèm `sk2` (tem của LẦN 2, cùng bản) ⇒ «Làm lại câu này» mở ngay tại máy em, khỏi gọi gon-mo.
// Luật an toàn như niem-phong.ts: tem gắn (SBD, đợt, bản) qua AAD, hạn 45 phút; tem hỏng / hết hạn / khác em / khác đợt / khác bản ⇒ bỏ (đường thường); chỉ chấm bằng tem khi
// tới từ lệnh có chữ ký token hợp lệ; lời giải + đáp án trong dòng 1 CHỈ khi kết quả là «đúng» hoặc «hết lần thử» — đúng như phản hồi đầy đủ (gợi ý lần 1 không lộ đáp án).
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { chamCauTuLuyen } from '../../src/lib/tu-luyen'
import { gameSbdDaKy } from './game-v2-auth'
import { moMa, niemMa } from './niem-phong'
import { phatLuongNdjson } from './nop-luong'
import type { Env } from './kieu'
import { dmChuoi } from './dap-an-may'
import { kemSuaMay, type GoiSuaMay } from '../../src/lib/sua-loi-may'

type Obj = Record<string, unknown>
export const SO_LAN_MOI_NGAY = 2

/** Nội dung tem Sửa câu (khoá một chữ cái cho ngắn). */
export interface NiemSua {
  v: number; e: number
  /** Mã đợt. */ d: string
  /** Mã bản làm lại. */ b: string
  /** Phần I / II / III. */ p: 'I' | 'II' | 'III'
  /** Đáp án đúng của bản. */ c: string
  /** Lần thứ mấy hôm nay (1 hoặc 2). */ L: number
  /** Đúng ở lần này ⇒ tính «Đã tự sửa» (0 / 1). */ tu: 0 | 1
  /** Em vừa xem lời giải (lý do «xong phần») 0 / 1. */ dg: 0 | 1
  /** Gợi ý sau lần sai đầu (chỉ khi L < SO_LAN_MOI_NGAY). */ gy?: string
  /** Lời giải. */ l: unknown
  /** Ảnh sau lời giải. */ h: unknown[]
}

const aadSua = (sbd: string, dotId: string, ban: string) => `chua|${sbd}|${dotId}|${ban}`

type LanSua = { dotId: string; ban: PrivateQuestion; lan: number; tuSua: boolean; docGan: boolean; goiY?: string }
/** Phần chấm của lần `lan` (chung cho tem `sk` và gói `dm`). Câu không chấm tự động được ⇒ null. */
function noiDungSua(x: LanSua): GoiSuaMay | null {
  if (!x.dotId || !x.ban?.qid || !String(x.ban.correct ?? '').trim()) return null
  const p = x.ban.phan
  if (p !== 'I' && p !== 'II' && p !== 'III') return null
  return {
    d: x.dotId, b: x.ban.qid, p, c: x.ban.correct, L: x.lan, tu: x.tuSua ? 1 : 0, dg: x.docGan ? 1 : 0, ...(x.goiY ? { gy: x.goiY } : {}),
    l: x.ban.solution, h: (x.ban.hinhAnh ?? []).filter((h) => h.viTri === 'sau_loi_giai'),
  }
}

/** Tem cho lần `lan` của bản `ban` trong đợt `dotId`. Không bao giờ ném. */
export async function niemSua(env: Env, sbd: string, x: LanSua, nayMs = Date.now()): Promise<string | undefined> {
  try {
    const nd = sbd ? noiDungSua(x) : null
    return nd ? await niemMa(env, aadSua(sbd, x.dotId, x.ban.qid), nd, nayMs) : undefined
  } catch { return undefined }
}

/** ĐÁP ÁN TRÊN MÁY (31/10, src/lib/sua-loi-may.ts): cùng phần chấm như tem, mã hoá bằng khoá riêng em + ngày (dap-an-may.ts), kèm đợt + bản ⇒ máy em chấm NGAY.
 *  Nơi gọi đã xét công tắc `cau_hinh.dap_an_tren_may`. Không bao giờ ném. */
export async function dmSua(env: Env, sbd: string, x: LanSua, nayMs = Date.now()): Promise<string | undefined> {
  try {
    const nd = sbd ? noiDungSua(x) : null
    return nd ? await dmChuoi(env, sbd, kemSuaMay(nd.d, nd.b), JSON.stringify(nd), nayMs) : undefined
  } catch { return undefined }
}

/** Mở tem Sửa câu của em `sbd` (đợt + bản máy em đang nộp). Không bao giờ ném. */
export async function moNiemSua(env: Env, sbd: string, dotId: string, ban: string, tem: unknown, nayMs = Date.now()): Promise<NiemSua | null> {
  if (!sbd || !dotId || !ban) return null
  const nd = await moMa<NiemSua>(env, aadSua(sbd, dotId, ban), tem, nayMs)
  if (!nd || nd.d !== dotId || nd.b !== ban) return null
  if (nd.p !== 'I' && nd.p !== 'II' && nd.p !== 'III') return null
  if (typeof nd.c !== 'string' || !nd.c || !Number.isFinite(nd.L)) return null
  return nd
}

/**
 * DÒNG 1 của gon-nop từ tem: đúng cách `gonNop` quyết định `ket` (đúng ⇒ tự sửa / xong phần; sai ⇒ gợi ý khi lần < 2, ngược lại lời giải).
 * `ct` (đáp án + lời giải + ảnh sau lời giải) CHỈ khi `ket` ≠ gợi ý. Lần 1 sai ⇒ `sk2` = tem lần 2. Câu lạ (chưa có đáp án ⇒ tem không có) ⇒ null.
 */
export async function dong1Sua(env: Env, sbd: string, nd: NiemSua, traLoi: string, nayMs = Date.now()): Promise<Obj> {
  const dung = chamCauTuLuyen(nd.p, nd.c, traLoi).dung
  const tuSua = dung && nd.tu === 1
  const ket = dung ? (tuSua ? 'tu_sua' : 'xong_phan') : nd.L < SO_LAN_MOI_NGAY ? 'goi_y' : 'loi_giai'
  const o: Obj = {
    ok: true, tam: true, dotId: nd.d, lan: nd.L, ban: nd.b, dung, ket,
    ...(ket === 'tu_sua' ? { trangThai: 'da_tu_sua' } : {}),
    ...(ket === 'xong_phan' ? { lyDo: nd.L > 1 ? 'co_goi_y' : nd.dg === 1 ? 'doc_loi_giai' : 'cung_ngay' } : {}),
    ...(ket === 'goi_y' && nd.gy ? { goiY: nd.gy } : {}),
  }
  if (ket !== 'goi_y') o.ct = { dapAn: nd.c, loiGiai: nd.l, hinhSau: nd.h }
  else {
    // Lần 2 hôm nay làm lại ĐÚNG bản này, không còn «tự sửa» (đã sai lần 1 ⇒ đúng ở lần 2 là «xong phần có gợi ý»), không gợi ý nữa.
    const sk2 = await niemMa(env, aadSua(sbd, nd.d, nd.b), { d: nd.d, b: nd.b, p: nd.p, c: nd.c, L: nd.L + 1, tu: 0, dg: nd.dg, l: nd.l, h: nd.h }, nayMs)
    if (sk2) o.sk2 = sk2
  }
  return o
}

/**
 * `gon-nop` THEO LUỒNG. `chay` = lệnh `gon-nop` đầy đủ (trả thân JSON); `trangTri` thêm `serverNow` / làm sạch lời lỗi như `ra()`.
 * Trả `null` khi KHÔNG đi đường luồng (không xin luồng / không có tem / tem không dùng được / công tắc tắt): nơi gọi chạy đường thường.
 */
export async function gonNopLuong(env: Env, b: Obj, headers: Record<string, string>, chay: () => Promise<Obj>, trangTri: (r: Obj) => Obj,
  ctx?: { waitUntil(p: Promise<unknown>): void }): Promise<Response | null> {
  if (!ctx || b.luong !== 1 || typeof b.sk !== 'string' || !b.sk) return null
  const e = env as unknown as Obj
  if (e.TAT_NOP_LUONG || e.TAT_TAM_SOM) return null
  const dotId = typeof b.dotId === 'string' ? b.dotId : '', ban = typeof b.ban === 'string' ? b.ban : '', khoa = typeof b.khoa === 'string' ? b.khoa : ''
  const traLoi = (typeof b.traLoi === 'string' ? b.traLoi : '').trim().slice(0, 200)
  if (!dotId || dotId.length > 160 || !ban || ban.length > 160 || !khoa || khoa.length > 80 || !traLoi) return null
  const t0 = Date.now()
  let sbd: string
  try { sbd = await gameSbdDaKy(env, b) } catch { return null }
  const nd = await moNiemSua(env, sbd, dotId, ban, b.sk, t0)
  if (!nd) return null
  const dong1 = await dong1Sua(env, sbd, nd, traLoi, t0)
  const du = (async () => { try { return { r: await chay() } } catch (err) { return { r: { ok: false, error: err instanceof Error ? err.message : 'Lỗi máy chủ' } as Obj } } })()
  return phatLuongNdjson(dong1, du, 'chua-niem', t0, headers, trangTri, ctx, (r) => r.ok === true && r.dung === dong1.dung && r.ket === dong1.ket)
}
