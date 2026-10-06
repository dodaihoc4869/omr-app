// ĐỆM ISOLATE CHO ĐƯỜNG NÓNG CA KIỂM TRA (tối ưu ca 30/09, docs/do-toi-uu-ca-3009.md).
//
// Vì sao: thầy bấm Bắt đầu ⇒ ~300 máy em cùng tải `GET /de/:maCa` trong vài giây, và lúc nộp dồn mỗi lượt `/nop` của ca
// "công bố ngay" đọc lại NGUYÊN tờ đáp án `key/<maCa>.json` từ R2 rồi JSON.parse — cùng một tệp, ba trăm lần.
//
// HAI LUẬT ĐỘ TƯƠI (không bao giờ phục vụ bản cũ quá lâu):
//   1. GÓI ĐỀ `de/…` (công khai, KHÔNG có đáp án): khoá theo (bank_r2, cap_nhat_luc) — MỌI đường ghi gói đề (dayCa, nối kho đề riêng
//      goi-cu) đều ghi R2 TRƯỚC rồi mới đổi `ca.cap_nhat_luc`, nên đổi đề ⇒ đổi khoá ⇒ đọc lại ngay (cùng khoá với đệm protectedQuestions
//      ở game-v2-bank.ts). Thêm một lớp an toàn: bản đệm quá HAN_DE_MS thì hỏi lại R2 CÓ ĐIỀU KIỆN (etag) — không đổi thì không tải thân.
//   2. TỜ ĐÁP ÁN `key/…` (chỉ trả cho em SAU khi nộp, hoặc cho thầy): có đường ghi KHÔNG đổi `cap_nhat_luc` (capNhatKeyBank) ⇒ LẦN NÀO
//      cũng hỏi R2 có điều kiện `etagDoesNotMatch`; R2 trả "không đổi" (không thân) thì dùng bản đã parse. Luôn tươi như đọc thẳng.
// Lượt đọc đang bay được chia sẻ (300 em cùng lúc ⇒ MỘT lượt R2). Tổng dung lượng đệm có trần; vượt trần bỏ bản cũ nhất.
// Đệm nằm trong bộ nhớ Worker, KHÔNG đi đâu khác: đáp án vẫn chỉ ra khỏi máy chủ ở đúng hai chỗ cũ (`/nop` ca công bố ngay, lệnh thầy).
import type { Env } from './kieu'

export const HAN_DE_MS = 10_000
const TRAN_BYTE = 32 * 1024 * 1024

interface BanDe { phien: string; than: ArrayBuffer; etag: string; httpEtag: string; kiemLuc: number }
interface BanKey { etag: string; tho: string | null; giaTri: unknown }

/** Đệm RIÊNG theo từng đối tượng R2 (WeakMap): R2 giả trong test / bucket khác nhau không bao giờ lẫn nhau. */
interface KhoDem { de: Map<string, BanDe>; deBay: Map<string, Promise<BanDe | null>>; key: Map<string, BanKey>; keyBay: Map<string, Promise<BanKey | null>>; byte: number }
let theoR2 = new WeakMap<object, KhoDem>()
function khoCua(env: Env): KhoDem {
  const r = env.DE as unknown as object
  let k = theoR2.get(r)
  if (!k) { k = { de: new Map(), deBay: new Map(), key: new Map(), keyBay: new Map(), byte: 0 }; theoR2.set(r, k) }
  return k
}

function donChoTrong(k: KhoDem, them: number): void {
  k.byte += them
  while (k.byte > TRAN_BYTE && (k.de.size || k.key.size)) {
    const d = k.de.keys().next().value as string | undefined
    if (d !== undefined) { k.byte -= k.de.get(d)!.than.byteLength; k.de.delete(d); continue }
    const kk = k.key.keys().next().value as string
    k.byte -= (k.key.get(kk)!.tho ?? '').length * 2
    k.key.delete(kk)
  }
}

type R2Doc = { body?: ReadableStream; etag?: string; httpEtag?: string; arrayBuffer?: () => Promise<ArrayBuffer> }

async function thanCua(o: R2Doc): Promise<ArrayBuffer> {
  if (typeof o.arrayBuffer === 'function') return await o.arrayBuffer()
  return await new Response(o.body).arrayBuffer()
}
/** `R2Bucket.get` có tuỳ chọn `onlyIf` (kiểu tối giản ở kieu.ts chưa khai) — không có thân khi điều kiện không đạt. */
type R2CoDieuKien = { get(key: string, tuyChon?: { onlyIf: { etagDoesNotMatch: string } }): Promise<unknown> }
const r2 = (env: Env): R2CoDieuKien => env.DE as unknown as R2CoDieuKien

/** GÓI ĐỀ CÔNG KHAI của ca (`ca.bank_r2`), đệm theo `phien` = `ca.cap_nhat_luc`. `null` ⇒ R2 không có tệp. */
export async function docGoiDeDem(env: Env, bankR2: string, phien: string, nay = Date.now()): Promise<{ than: ArrayBuffer; httpEtag: string } | null> {
  const kho = khoCua(env)
  const cu = kho.de.get(bankR2)
  if (cu && cu.phien === phien && nay - cu.kiemLuc < HAN_DE_MS) return cu
  const khoaBay = `${bankR2}|${phien}`
  const dang = kho.deBay.get(khoaBay)
  if (dang) return dang
  const p = (async (): Promise<BanDe | null> => {
    const coDieuKien = cu && cu.phien === phien
    const o = (await r2(env).get(bankR2, coDieuKien ? { onlyIf: { etagDoesNotMatch: cu.etag } } : undefined)) as R2Doc | null
    if (!o) {
      if (cu && kho.de.get(bankR2) === cu) { kho.byte -= cu.than.byteLength; kho.de.delete(bankR2) }
      return null
    }
    if (coDieuKien && !o.body && String(o.etag ?? '') === cu.etag) {
      cu.kiemLuc = Date.now()
      return cu
    }
    const than = await thanCua(o)
    const moi: BanDe = { phien, than, etag: String(o.etag ?? ''), httpEtag: String(o.httpEtag ?? ''), kiemLuc: Date.now() }
    const dangCo = kho.de.get(bankR2)
    if (dangCo) { kho.byte -= dangCo.than.byteLength; kho.de.delete(bankR2) }
    kho.de.set(bankR2, moi)
    donChoTrong(kho, than.byteLength)
    return moi
  })()
  kho.deBay.set(khoaBay, p)
  try { return await p } finally { kho.deBay.delete(khoaBay) }
}

/** TỜ ĐÁP ÁN `key/<maCa>.json`: `{ giaTri, tho }` — `giaTri` là JSON đã parse (hỏng/không có ⇒ `null`, y như đọc thẳng cũ),
 *  `tho` là nguyên văn JSON hợp lệ (để ghép thẳng vào phản hồi, khỏi stringify lại) hoặc `null`. Mỗi lần gọi đều hỏi R2 có điều kiện. */
export async function docKeyBankDem(env: Env, maCa: string): Promise<{ giaTri: unknown; tho: string | null }> {
  if (!env.DE) return { giaTri: null, tho: null }
  const khoa = `key/${maCa}.json`
  const kho = khoCua(env)
  const cu = kho.key.get(khoa)
  // Chưa có bản nào ⇒ các lượt cùng lúc dùng chung MỘT lượt tải trọn. Đã có bản ⇒ MỖI lượt tự hỏi R2 có điều kiện (không dùng chung
  // lượt đang bay: lượt bắt đầu trước một lần ghi không được trả cho lượt tới sau lần ghi ấy).
  if (!cu) {
    const dang = kho.keyBay.get(khoa)
    if (dang) { const b = await dang; return b ? { giaTri: b.giaTri, tho: b.tho } : { giaTri: null, tho: null } }
  }
  const p = (async (): Promise<BanKey | null> => {
    const o = (await r2(env).get(khoa, cu ? { onlyIf: { etagDoesNotMatch: cu.etag } } : undefined)) as R2Doc | null
    if (!o) {
      if (cu && kho.key.get(khoa) === cu) { kho.byte -= (cu.tho ?? '').length * 2; kho.key.delete(khoa) }
      return null
    }
    if (cu && !o.body && String(o.etag ?? '') === cu.etag) return cu
    if (!o.body) return null
    const tho = new TextDecoder().decode(new Uint8Array(await thanCua(o)))
    let giaTri: unknown = null
    let hopLe = true
    try { giaTri = JSON.parse(tho) } catch { giaTri = null; hopLe = false }
    const moi: BanKey = { etag: String(o.etag ?? ''), tho: hopLe ? tho : null, giaTri }
    const dangCo = kho.key.get(khoa)
    if (dangCo) { kho.byte -= (dangCo.tho ?? '').length * 2; kho.key.delete(khoa) }
    kho.key.set(khoa, moi)
    donChoTrong(kho, (moi.tho ?? '').length * 2)
    return moi
  })()
  if (!cu) kho.keyBay.set(khoa, p)
  try {
    const b = await p
    return b ? { giaTri: b.giaTri, tho: b.tho } : { giaTri: null, tho: null }
  } finally {
    if (!cu && kho.keyBay.get(khoa) === p) kho.keyBay.delete(khoa)
  }
}

/** GỢI Ý "ca này công bố ngay" nhớ từ lần đọc `ca` gần nhất trong isolate — CHỈ để bắt đầu tải tờ đáp án SONG SONG với câu D1 của `/nop`.
 *  Quyết định trả đáp án hay không LUÔN theo `cong_bo` vừa đọc từ D1 trong chính lượt ấy; gợi ý sai chỉ tốn một lượt R2 bỏ đi. */
const goiYCongBo = new Map<string, string>()
export function nhoCongBo(maCa: string, congBo: unknown): void {
  if (!maCa) return
  if (goiYCongBo.size > 256 && !goiYCongBo.has(maCa)) goiYCongBo.delete(goiYCongBo.keys().next().value as string)
  goiYCongBo.set(maCa, String(congBo ?? ''))
}
export function doanCongBoNgay(maCa: string): boolean {
  return goiYCongBo.get(maCa) === 'ngay'
}
