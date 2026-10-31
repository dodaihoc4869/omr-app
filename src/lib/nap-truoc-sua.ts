// NẠP TRƯỚC CÂU SỬA KẾ TIẾP (thầy 29/10, video 08:25 «Mở câu quá lâu»: «Đang mở câu…» ~3,3 s mỗi lần bấm một câu ở Tự sửa lỗi).
// Việc hôm nay đã biết câu CHƯA XONG kế tiếp ⇒ lúc em còn đang xem danh sách / đang làm câu trước, máy em đã mở sẵn câu ấy ở máy chủ (cùng lệnh `mo-dot` kèm bản làm lại như khi bấm thật).
// Bấm vào ⇒ dùng ngay kết quả đã về (hoặc đang về), không còn màn chờ.
// An toàn: `mo-dot` là lệnh MỞ (không chấm, không ghi tiến độ của em — chỉ giao đợt nếu chưa có, đã có thì không đổi gì); đề về chỉ là đề công khai, đáp án vẫn chỉ ra sau khi nộp.
// Dùng MỘT lần rồi bỏ (lần mở lại sau khi làm / lần «Thử lại» luôn hỏi tươi ⇒ số «lần làm» không bao giờ cũ); quá hạn HAN_NAP_TRUOC_MS ⇒ bỏ. Chỉ nạp kết quả `ok` — lỗi không nằm lại.
// Nơi gọi: màn Tự sửa lỗi (câu kế của Việc hôm nay, loại câu đang mở) và Lộ trình (câu đầu tiên chưa xong). Mảnh nạp lười — không cộng byte lượt mở cổng.
// 31/10 (thầy «làm cả cho tự sửa lỗi»): TẢI SẴN PHẦN HÔM NAY — một lượt mở sẵn tới 12 câu chưa xong (`gon-mo-ngay`), giữ cả ngày trên máy (bộ nhớ + localStorage) ⇒ bấm câu nào
// cũng vào ngay, mất mạng vẫn làm được (gói `dm` cho máy em chấm tại chỗ — sua-loi-may.ts). Lần nộp không gửi được vì mất mạng ⇒ xếp hàng trên máy, có mạng gửi lại
// theo đúng thứ tự (máy chủ chống trùng theo khoá) — `xepSuaChoGui` / `guiLaiSuaCho`.
import { apiGonMoNgay, apiGonNop, apiMoDot, type KetQuaGon } from './chua-cau-sai-api'
import { docSbdHs, ghiXongHomNay } from './tu-sua-viec-hom-nay'
import { luuXemLai } from './xem-lai-sua'

type KetQuaMo = Awaited<ReturnType<typeof apiMoDot>>
/** Tuổi tối đa của kết quả nạp trước (ms) — bằng hạn đệm câu của máy chủ (server/src/chua-gon-nho.ts). */
export const HAN_NAP_TRUOC_MS = 3 * 60_000
/** Số câu nạp trước giữ cùng lúc. */
const TOI_DA = 3
const KHO = new Map<string, { p: Promise<KetQuaMo>; luc: number; kq?: KetQuaMo }>()
const khoa = (token: string, qid: string) => `${token}|${qid}`

/** Bắt đầu mở sẵn câu `qid` (không chờ). Đã có bản còn mới ⇒ không làm gì. */
export function napTruocCauSua(token: string, qid: string, nayMs = Date.now()): void {
  if (!token || !qid || coSuaNgay(qid, nayMs)) return // phần hôm nay đã tải sẵn câu này
  const k = khoa(token, qid)
  const co = KHO.get(k)
  if (co && nayMs - co.luc < HAN_NAP_TRUOC_MS) return
  const p = apiMoDot(token, qid, undefined, false, true).catch((): KetQuaMo => ({ ok: false }))
  KHO.delete(k)
  KHO.set(k, { p, luc: nayMs })
  while (KHO.size > TOI_DA) KHO.delete(KHO.keys().next().value as string)
  // Kết quả lỗi không nằm lại: lần bấm thật sẽ hỏi tươi. Kết quả tốt được giữ kèm bản ĐÃ VỀ (`kq`) để màn sửa câu dựng thẳng ở lần vẽ đầu (xem `layNapTruocCauSuaNgay`).
  void p.then((r) => { const e = KHO.get(k); if (e?.p !== p) return; if (r.ok) e.kq = r; else KHO.delete(k) })
}

/** Kết quả nạp trước ĐÃ VỀ và còn mới ⇒ trả ĐỒNG BỘ (và bỏ); chưa về / hết hạn ⇒ null (nơi gọi dùng `layNapTruocCauSua`). Màn sửa câu dựng ngay ở lần vẽ đầu — không khung chờ (29/10, video 11:00 «khựng chỗ mở câu»). */
export function layNapTruocCauSuaNgay(token: string, qid: string, nayMs = Date.now()): KetQuaMo | null {
  const k = khoa(token, qid)
  const co = KHO.get(k)
  if (!co?.kq || nayMs - co.luc >= HAN_NAP_TRUOC_MS) return layNgay(qid, nayMs)
  KHO.delete(k)
  boNgay(qid, nayMs)
  return co.kq
}

/** Lấy (và bỏ) kết quả nạp trước của câu `qid` còn mới; không có ⇒ null (nơi gọi hỏi tươi). Có thể còn đang về — chờ `await`. */
export function layNapTruocCauSua(token: string, qid: string, nayMs = Date.now()): Promise<KetQuaMo> | null {
  const k = khoa(token, qid)
  const co = KHO.get(k)
  if (!co) { const n = layNgay(qid, nayMs); return n ? Promise.resolve(n) : null }
  KHO.delete(k)
  boNgay(qid, nayMs)
  return nayMs - co.luc < HAN_NAP_TRUOC_MS ? co.p : null
}

/** Bỏ mọi kết quả nạp trước (em vừa làm xong một câu / đổi tài khoản / test). */
export function xoaNapTruocCauSua(): void { KHO.clear(); NGAY.clear(); ngayDaDoc = '' }

// ---------------------------------------------------------------------------- PHẦN HÔM NAY (giữ cả ngày, dùng một lần mỗi câu)
const ngayVnCua = (ms: number) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
const KHOA_NGAY = (sbd: string) => `omr_sua_ngay_${sbd}`
/** Kho phần hôm nay của em đang đăng nhập: qid → kết quả mở (như `apiMoDot(…, gon = true)`). */
const NGAY = new Map<string, KetQuaMo>()
let ngayDaDoc = ''
/** Lượt tải gần nhất: không hỏi lại cùng câu trong 2 phút. */
const daXin = new Map<string, number>()
/** Trần cỡ bản lưu trên máy (ký tự) — đề có ảnh nhúng lớn ⇒ chỉ giữ trong bộ nhớ. */
const TRAN_LUU = 1_500_000

function docKhoNgay(nayMs: number): string {
  const sbd = docSbdHs(), n = ngayVnCua(nayMs), dau = `${sbd}|${n}`
  if (!sbd) return ''
  if (ngayDaDoc === dau) return dau
  NGAY.clear(); ngayDaDoc = dau
  try {
    const o = JSON.parse(localStorage.getItem(KHOA_NGAY(sbd)) ?? 'null') as { n?: string; ds?: Record<string, KetQuaMo> } | null
    if (o?.n === n && o.ds && typeof o.ds === 'object') for (const [q, v] of Object.entries(o.ds)) if (v?.ok && v.gon?.ok) NGAY.set(q, v)
  } catch { /* máy không cho đọc ⇒ chỉ bộ nhớ */ }
  return dau
}
function luuKhoNgay(nayMs: number): void {
  const sbd = docSbdHs()
  if (!sbd) return
  try {
    const t = JSON.stringify({ n: ngayVnCua(nayMs), ds: Object.fromEntries(NGAY) })
    if (t.length > TRAN_LUU) localStorage.removeItem(KHOA_NGAY(sbd))
    else localStorage.setItem(KHOA_NGAY(sbd), t)
  } catch { /* đầy / bị chặn ⇒ chỉ bộ nhớ */ }
}
function layNgay(qid: string, nayMs: number): KetQuaMo | null {
  if (!docKhoNgay(nayMs)) return null
  const v = NGAY.get(qid)
  if (!v) return null
  NGAY.delete(qid); luuKhoNgay(nayMs)
  return v
}
function boNgay(qid: string, nayMs: number): void {
  if (docKhoNgay(nayMs) && NGAY.delete(qid)) luuKhoNgay(nayMs)
}
/** Câu đã có bản tải sẵn hôm nay (còn chưa dùng)? */
export const coSuaNgay = (qid: string, nayMs = Date.now()): boolean => !!docKhoNgay(nayMs) && NGAY.has(qid)

/** TẢI SẴN các câu `qids` (Việc hôm nay, chưa xong) — một lượt, không chờ. Câu đã có bản / vừa hỏi trong 2 phút ⇒ bỏ qua. Lỗi ⇒ thôi (bấm câu vẫn mở như cũ). */
export function napTruocSuaNgay(token: string, qids: string[], nayMs = Date.now()): Promise<number> {
  if (!token || !docKhoNgay(nayMs) || (typeof navigator !== 'undefined' && navigator.onLine === false)) return Promise.resolve(0)
  const can = [...new Set(qids)].filter((q) => !!q && !NGAY.has(q) && !KHO.has(khoa(token, q)) && nayMs - (daXin.get(q) ?? 0) >= 2 * 60_000).slice(0, 12)
  if (!can.length) return Promise.resolve(0)
  for (const q of can) daXin.set(q, nayMs)
  const dau = ngayDaDoc
  return apiGonMoNgay(token, can).then((ds) => {
    if (ngayDaDoc !== dau) return 0
    let n = 0
    for (const d of ds) if (d.kq.ok && d.kq.gon?.ok && !NGAY.has(d.qid)) { NGAY.set(d.qid, d.kq); n++ }
    if (n) luuKhoNgay(Date.now())
    return n
  }, () => 0)
}

// ---------------------------------------------------------------------------- LẦN NỘP CHỜ GỬI (mất mạng)
const KHOA_CHO = (sbd: string) => `omr_sua_cho_${sbd}`
export interface SuaChoGui { dotId: string; ban: string; traLoi: string; khoa: string; qid: string; luc: number }
const docCho = (sbd: string): SuaChoGui[] => { try { const a = JSON.parse(localStorage.getItem(KHOA_CHO(sbd)) ?? '[]') as SuaChoGui[]; return Array.isArray(a) ? a.filter((x) => !!x?.khoa && !!x.dotId) : [] } catch { return [] } }
const ghiCho = (sbd: string, a: SuaChoGui[]) => { try { if (a.length) localStorage.setItem(KHOA_CHO(sbd), JSON.stringify(a.slice(-50))); else localStorage.removeItem(KHOA_CHO(sbd)) } catch { /* bị chặn */ } }
/** Xếp lần nộp chưa gửi được (mất mạng) — giữ thứ tự, trùng khoá ⇒ một. */
export function xepSuaChoGui(x: SuaChoGui): void {
  const sbd = docSbdHs()
  if (!sbd) return
  const a = docCho(sbd)
  if (!a.some((y) => y.khoa === x.khoa)) a.push(x)
  ghiCho(sbd, a)
}
/** Có lần nộp đang chờ gửi? */
export const coSuaChoGui = (): boolean => { const sbd = docSbdHs(); return !!sbd && docCho(sbd).length > 0 }
let dangGui: Promise<number> | null = null
const KHEP = new Set(['tu_sua', 'xong_phan', 'loi_giai'])
/** Gửi lại các lần nộp đang chờ, ĐÚNG thứ tự (máy chủ đếm lần theo dòng đã ghi). Mất mạng tiếp ⇒ dừng, giữ phần còn lại. Trả số lần đã gửi được. */
export function guiLaiSuaCho(token: string): Promise<number> {
  if (dangGui) return dangGui
  const sbd = docSbdHs()
  if (!token || !sbd || !docCho(sbd).length) return Promise.resolve(0)
  dangGui = (async () => {
    let n = 0
    for (;;) {
      const x = docCho(sbd)[0]
      if (!x) break
      const r: KetQuaGon = await apiGonNop(token, x.dotId, x.ban, x.traLoi, x.khoa, x.qid)
      if (!r.ok && !r.ma) break // còn mất mạng / máy chủ bận ⇒ lần sau
      ghiCho(sbd, docCho(sbd).filter((y) => y.khoa !== x.khoa))
      if (r.ok) { n++; if (r.ket && KHEP.has(r.ket)) { ghiXongHomNay(x.dotId); ghiXongHomNay(x.qid); luuXemLai(sbd, x.qid, { ...r, dotId: x.dotId }) } }
    }
    return n
  })().finally(() => { dangGui = null })
  return dangGui
}
