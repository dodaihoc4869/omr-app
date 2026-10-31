// NẠP TRƯỚC CÂU SỬA KẾ TIẾP (thầy 29/10, video 08:25 «Mở câu quá lâu»: «Đang mở câu…» ~3,3 s mỗi lần bấm một câu ở Tự sửa lỗi).
// Việc hôm nay đã biết câu CHƯA XONG kế tiếp ⇒ lúc em còn đang xem danh sách / đang làm câu trước, máy em đã mở sẵn câu ấy ở máy chủ (cùng lệnh `mo-dot` kèm bản làm lại như khi bấm thật).
// Bấm vào ⇒ dùng ngay kết quả đã về (hoặc đang về), không còn màn chờ.
// An toàn: `mo-dot` là lệnh MỞ (không chấm, không ghi tiến độ của em — chỉ giao đợt nếu chưa có, đã có thì không đổi gì); đề về chỉ là đề công khai, đáp án vẫn chỉ ra sau khi nộp.
// Dùng MỘT lần rồi bỏ (lần mở lại sau khi làm / lần «Thử lại» luôn hỏi tươi ⇒ số «lần làm» không bao giờ cũ); quá hạn HAN_NAP_TRUOC_MS ⇒ bỏ. Chỉ nạp kết quả `ok` — lỗi không nằm lại.
// Nơi gọi: màn Tự sửa lỗi (câu kế của Việc hôm nay, loại câu đang mở) và Lộ trình (câu đầu tiên chưa xong). Mảnh nạp lười — không cộng byte lượt mở cổng.
// 31/10 (thầy «làm cả cho tự sửa lỗi»): TẢI SẴN PHẦN HÔM NAY — từng lượt 12 câu chưa xong (`gon-mo-ngay`), nối tiếp tới HẾT phần hôm nay, giữ cả ngày trên máy (bộ nhớ + localStorage) ⇒ bấm câu nào
// cũng vào ngay, mất mạng vẫn làm được (gói `dm` cho máy em chấm tại chỗ — sua-loi-may.ts). Lần nộp không gửi được vì mất mạng ⇒ xếp hàng trên máy, có mạng gửi lại
// theo đúng thứ tự (máy chủ chống trùng theo khoá) — `xepSuaChoGui` / `guiLaiSuaCho`.
import { apiGoiSuaNgay, apiGonMoNgay, apiGonNop, apiMoDot, type KetQuaGon } from './chua-cau-sai-api'
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
export function xoaNapTruocCauSua(): void { KHO.clear(); NGAY.clear(); COC.clear(); ngayDaDoc = ''; goiDangHoi = null; if (henTiep) { clearTimeout(henTiep); henTiep = undefined } }

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
/** NGÂN SÁCH BỘ NHỚ của phần tải sẵn (ký tự JSON, ~2 byte/ký tự) — thầy 31/10 video iPhone «Đã có sự cố xảy ra liên tục» lúc bấm «Tiếp tục»: đề Sửa lỗi có thể kèm
 *  ảnh nhúng (data URL) ⇒ 36 câu tải sẵn = hàng chục MB chuỗi + JSON.stringify cả kho mỗi lần đổi ⇒ máy yếu hết bộ nhớ. Vượt ngân sách ⇒ thôi tải thêm (câu còn lại
 *  mở khi bấm như cũ); kho vượt trần lưu ⇒ không dựng chuỗi lưu nữa. */
const NGAN_SACH = 2_500_000
/** Cỡ (ký tự JSON) từng câu đang giữ — cộng dồn thay vì dựng lại chuỗi cả kho. */
const COC = new Map<string, number>()
const tongCo = () => { let t = 0; for (const v of COC.values()) t += v; return t }
const datNgay = (q: string, v: KetQuaMo, co: number) => { NGAY.set(q, v); COC.set(q, co) }
const xoaNgay = (q: string) => { COC.delete(q); return NGAY.delete(q) }
/** Đang ở màn làm bài phủ trên Lộ trình (StudentPortalScreen gắn `data-dang-lam-bai` trên <html>) ⇒ việc nền nặng hoãn tới lúc em về. */
const dangLamBai = () => typeof document !== 'undefined' && document.documentElement.dataset.dangLamBai !== undefined

function docKhoNgay(nayMs: number): string {
  const sbd = docSbdHs(), n = ngayVnCua(nayMs), dau = `${sbd}|${n}`
  if (!sbd) return ''
  if (ngayDaDoc === dau) return dau
  NGAY.clear(); COC.clear(); ngayDaDoc = dau
  try {
    const t = localStorage.getItem(KHOA_NGAY(sbd))
    const o = JSON.parse(t ?? 'null') as { n?: string; ds?: Record<string, KetQuaMo> } | null
    if (o?.n === n && o.ds && typeof o.ds === 'object') {
      const ds = Object.entries(o.ds).filter(([, v]) => v?.ok && v.gon?.ok)
      const moi = ds.length ? Math.ceil((t?.length ?? 0) / ds.length) : 0
      for (const [q, v] of ds) datNgay(q, v, moi)
    }
  } catch { /* máy không cho đọc ⇒ chỉ bộ nhớ */ }
  return dau
}
function luuKhoNgay(nayMs: number): void {
  const sbd = docSbdHs()
  if (!sbd) return
  try {
    // Kho vượt trần ⇒ KHÔNG dựng chuỗi (trước: JSON.stringify cả kho rồi mới so trần — hàng chục MB mỗi lần đổi một câu).
    if (tongCo() > TRAN_LUU) { localStorage.removeItem(KHOA_NGAY(sbd)); return }
    const t = JSON.stringify({ n: ngayVnCua(nayMs), ds: Object.fromEntries(NGAY) })
    if (t.length > TRAN_LUU) localStorage.removeItem(KHOA_NGAY(sbd))
    else localStorage.setItem(KHOA_NGAY(sbd), t)
  } catch { /* đầy / bị chặn ⇒ chỉ bộ nhớ */ }
}
function layNgay(qid: string, nayMs: number): KetQuaMo | null {
  if (!docKhoNgay(nayMs)) return null
  const v = NGAY.get(qid)
  if (!v) return null
  xoaNgay(qid); luuKhoNgay(nayMs)
  return v
}
function boNgay(qid: string, nayMs: number): void {
  if (docKhoNgay(nayMs) && xoaNgay(qid)) luuKhoNgay(nayMs)
}
/** Câu đã có bản tải sẵn hôm nay (còn chưa dùng)? */
export const coSuaNgay = (qid: string, nayMs = Date.now()): boolean => !!docKhoNgay(nayMs) && NGAY.has(qid)

// GÓI ĐÓNG SẴN (31/10, thầy «hs mở app lên là mọi thứ sẵn rồi»; server/src/goi-sua-dem.ts): máy chủ đã đóng sẵn cả phần hôm nay (ban đêm / bù trong ngày) ⇒ mở app
// hỏi NGAY một lượt (rẻ: một lần đọc R2 + một câu đọc D1) ⇒ cả phần hôm nay vào kho. Câu thiếu / chưa có gói ⇒ `napTruocSuaNgay` từng lượt như trước.
// Mỗi phiên hỏi tối đa một lần / ngày; máy chủ báo đã có gói ⇒ nhớ trên máy, các lần mở app sau trong ngày khỏi hỏi lại.
const KHOA_GOI = (sbd: string) => `omr_sua_goi_${sbd}`
let goiDangHoi: { dau: string; p: Promise<number> } | null = null
let henGoi: ReturnType<typeof setTimeout> | undefined
/** Lấy gói đóng sẵn hôm nay (một lượt). Trả số câu mới vào kho; đang hỏi ⇒ dùng chung lượt đang bay. */
export function napGoiSuaDem(token: string, nayMs = Date.now()): Promise<number> {
  const dau = docKhoNgay(nayMs)
  if (!token || !dau || (typeof navigator !== 'undefined' && navigator.onLine === false)) return Promise.resolve(0)
  if (goiDangHoi?.dau === dau) return goiDangHoi.p
  // em đang làm bài (màn phủ) ⇒ hoãn 30 giây (iPhone sập lúc «Tiếp tục», thầy 31/10)
  if (dangLamBai()) { if (!henGoi) henGoi = setTimeout(() => { henGoi = undefined; void napGoiSuaDem(token) }, 30_000); return Promise.resolve(0) }
  const sbd = docSbdHs(), ngay = ngayVnCua(nayMs)
  try { if (localStorage.getItem(KHOA_GOI(sbd)) === ngay) return Promise.resolve(0) } catch { /* máy chặn ⇒ cứ hỏi */ }
  const p = apiGoiSuaNgay(token).then((g) => {
    if (!g || g.n !== ngay || ngayDaDoc !== dau) return 0
    if (g.co) { try { localStorage.setItem(KHOA_GOI(sbd), ngay) } catch { /* bị chặn */ } }
    let n = 0
    for (const d of g.ds) {
      if (!d.kq.ok || !d.kq.gon?.ok || NGAY.has(d.qid) || KHO.has(khoa(token, d.qid))) continue
      const co = JSON.stringify(d.kq).length
      if (tongCo() + co > NGAN_SACH) continue // ngân sách bộ nhớ (iPhone sập 31/10) — câu này mở khi bấm như cũ
      datNgay(d.qid, d.kq, co); n++
    }
    if (n) luuKhoNgay(Date.now())
    return n
  }, () => 0)
  goiDangHoi = { dau, p }
  return p
}

/** Số câu mỗi lượt tải (khớp trần máy chủ `TOI_DA_TAI_SAN_SUA`): mỗi câu tải sẵn tốn ở máy chủ y như em bấm mở câu ⇒ chia lượt nhỏ cho D1 không dồn cục. */
const MOI_LUOT = 12
/** Lượt kế tiếp hẹn sau 3–8 giây (lệch ngẫu nhiên giữa các máy) cho tới khi CẢ phần hôm nay nằm trên máy (thầy 31/10 «Sao lại tải sẵn tối đa 12 câu thôi»). */
let henTiep: ReturnType<typeof setTimeout> | undefined
const canTai = (token: string, qids: string[], nayMs: number) =>
  [...new Set(qids)].filter((q) => !!q && !NGAY.has(q) && !KHO.has(khoa(token, q)) && nayMs - (daXin.get(q) ?? 0) >= 2 * 60_000)

/** TẢI SẴN các câu `qids` (Việc hôm nay, chưa xong) — từng lượt MOI_LUOT câu, lượt sau tự nối tiếp tới hết, không chờ. Câu đã có bản / vừa hỏi trong 2 phút ⇒ bỏ qua.
 *  Lỗi / lượt không về câu nào ⇒ thôi (bấm câu vẫn mở như cũ). Trả số câu của lượt ĐẦU. */
export function napTruocSuaNgay(token: string, qids: string[], nayMs = Date.now()): Promise<number> {
  if (!token || !docKhoNgay(nayMs) || (typeof navigator !== 'undefined' && navigator.onLine === false)) return Promise.resolve(0)
  if (tongCo() >= NGAN_SACH) return Promise.resolve(0)
  // em đang làm bài (màn phủ trên Lộ trình) ⇒ hoãn 30 giây, không tải / phân tích chục MB giữa lúc em bấm «Tiếp tục»
  if (dangLamBai()) { if (henTiep) clearTimeout(henTiep); henTiep = setTimeout(() => { henTiep = undefined; void napTruocSuaNgay(token, qids) }, 30_000); return Promise.resolve(0) }
  const tatCa = canTai(token, qids, nayMs)
  const can = tatCa.slice(0, MOI_LUOT)
  if (!can.length) return Promise.resolve(0)
  if (henTiep) { clearTimeout(henTiep); henTiep = undefined }
  for (const q of can) daXin.set(q, nayMs)
  const dau = ngayDaDoc
  return apiGonMoNgay(token, can).then((ds) => {
    if (ngayDaDoc !== dau) return 0
    let n = 0, day = false
    for (const d of ds) {
      if (!d.kq.ok || !d.kq.gon?.ok || NGAY.has(d.qid)) continue
      const co = JSON.stringify(d.kq).length
      if (tongCo() + co > NGAN_SACH) { day = true; continue }
      datNgay(d.qid, d.kq, co); n++
    }
    if (n) luuKhoNgay(Date.now())
    if (day) return n // hết ngân sách bộ nhớ ⇒ không nối tiếp
    // Còn câu chưa tải ⇒ lượt kế sau 3–8 giây; chỉ còn câu vừa hỏng trong lượt này (đang chờ 2 phút) ⇒ thử lại sau 2 phút. ĐÚNG số câu được phân của em (thầy 31/10
    // «Em nào đc phân bao nhiêu câu thì tải đủ luôn»). Lượt không về câu nào ⇒ dừng (không dội máy chủ lúc bận).
    const conThieu = qids.some((q) => !!q && !NGAY.has(q) && !KHO.has(khoa(token, q)))
    if (n && conThieu) henTiep = setTimeout(() => { henTiep = undefined; void napTruocSuaNgay(token, qids) }, tatCa.length > can.length ? 3000 + Math.random() * 5000 : 2 * 60_000 + Math.random() * 30_000)
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
