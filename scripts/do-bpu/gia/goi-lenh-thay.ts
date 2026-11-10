// GIẢ cho bản đo: không một yêu cầu nào ra ngoài. `/gv/ung-vien-chieu` trả sau ĐỘ TRỄ MẠNG GIẢ (?tre=ms, mặc định 350) và đếm số lần gọi.
const w = window as unknown as { __goi?: Record<string, number> }
export async function goiLenh(duong: string, body: unknown): Promise<unknown> {
  w.__goi ??= {}; w.__goi[duong] = (w.__goi[duong] ?? 0) + 1
  if (duong === '/gv/bpu/mo') return { ok: true, du: { ok: true, ve: 've-gia' } }
  if (duong === '/gv/bpu/luot') return { ok: true, du: { ok: true } }
  if (duong === '/gv/ung-vien-chieu') {
    const tre = Number(new URLSearchParams(location.search).get('tre') ?? 350)
    await new Promise((r) => setTimeout(r, tre))
    const b = body as { sbd?: string[]; qids?: string[] }
    const em: Record<string, unknown> = {}
    for (const s of b.sbd ?? []) em[s] = { ten: `Em ${s}`, soLan14: 1, lanCuoiLenBang: null }
    return { ok: true, du: { ok: true, cau: Object.fromEntries((b.qids ?? []).map((q) => [q, []])), mucDo: {}, em, soSai: {}, bpu: { tenDang: 'este', chuyenDe: 'Este', lbDu: true, em: {} } } }
  }
  return { ok: true, du: { ok: true } }
}
export const CHU_HUONG_DAN_MA = ''
