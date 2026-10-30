// MỞ CHẶNG TRƯỚC (thầy 16/10, ảnh "Chặng học của em — Đang chuẩn bị những câu phù hợp với em…": "phần này load lâu quá, quét và tối ưu tốc độ tức thì").
// Màn làm bài chỉ chờ MỘT lệnh: `hoc-tap-start` (máy chủ lập kế hoạch Gói 7, đọc câu, lưu phiên). Gọi lệnh ấy SỚM, lúc em gần như chắc sẽ bấm học:
//   · Hôm nay đã có số và nút "Học tiếp" bấm được (không phải ngày kiểm tra riêng, còn việc xếp được);
//   · em vừa xong chặng (màn "Học tiếp chặng N" — câu cuối đã nộp xong nên kế hoạch đã tính câu ấy).
// Em bấm ⇒ màn làm bài dùng lại ĐÚNG lời hứa đang bay / đã xong ⇒ câu hiện ngay. Kết quả GIỐNG HỆT gọi lúc bấm: máy chủ tự dùng lại phiên chưa làm xong
// (cùng mã phiên, trong 2 giờ — goi-bai-7.ts `startGoi7`), trần câu/ngày đếm theo câu đã TRẢ LỜI chứ không theo phiên ⇒ mở trước không tốn suất của em.
// Mỗi lời hứa dùng MỘT lần; quá TUOI_MO_TRUOC_MS, khác token hoặc lời hứa lỗi mạng ⇒ màn làm bài gọi lại như cũ.
import { goiHoa2 } from '../hoa2/api'
import { danhDauDaNhan, xemHoiSomDaVe } from '../../lib/hoi-som'

type KetQuaMo = Record<string, unknown>
/** Tuổi tối đa của một lượt mở trước (máy chủ giữ phiên 2 giờ; 10 phút để kế hoạch không cũ khi em rời đi lâu). */
export const TUOI_MO_TRUOC_MS = 10 * 60_000
/** Thời hạn chờ máy chủ của lệnh mở chặng — đúng số giây màn làm bài vẫn dùng. */
export const GIAY_CHO_MO_CHANG = 40

let dangCo: { token: string; luc: number; p: Promise<KetQuaMo>; kq?: KetQuaMo } | null = null
/** Bộ test mặc định TẮT (lượt mở trước sống theo mô-đun ⇒ test sau dùng nhầm máy chủ giả của test trước); test của tính năng bật bằng `batMoChangTruoc(true)`. */
let bat = !(globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITEST
export function batMoChangTruoc(b: boolean): void { bat = b; dangCo = null }

/** Bắt đầu mở chặng trước cho `token` (đã có lượt còn hạn cho token này ⇒ không gọi thêm). Không bao giờ ném.
 *  Gói cả ngày (dưới): máy em đã có chặng trong gói ⇒ KHÔNG mở trước bằng `hoc-tap-start` (màn làm bài hiện câu từ gói, không cần lượt ấy). */
export function moChangTruoc(token: string, goi: typeof goiHoa2 = goiHoa2, now: number = Date.now()): void {
  if (!bat || !token) return
  if (coChangGoiCua(token, now)) return
  if (dangCo && dangCo.token === token && now - dangCo.luc < TUOI_MO_TRUOC_MS) return
  const p = goi('hoc-tap-start', token, {}, GIAY_CHO_MO_CHANG)
  const muc: { token: string; luc: number; p: Promise<KetQuaMo>; kq?: KetQuaMo } = { token, luc: now, p }
  p.then((r) => { if (r && r.ok === true && Array.isArray(r.questions)) muc.kq = r }, () => {}) // lỗi để lượt dùng xử lý (gọi lại)
  dangCo = muc
}

/** Đọc ĐỒNG BỘ (và XOÁ) lượt mở trước ĐÃ VỀ thành công của `token` ⇒ mở câu đầu tức thì 0 ms (không chớp khung chờ). Chưa về / lỗi ⇒ null (nhường `layChangMoTruoc`). */
// `chiXem` (29/10 khuya, đo máy yếu): lượt dựng ĐẦU của màn làm bài chỉ XEM (không xoá) — React có thể bỏ lượt dựng ấy rồi dựng lại (Suspense), nếu đã xoá thì lượt dựng
// thật mất kết quả mở trước và phải gọi máy chủ lại từ đầu («Đang chuẩn bị…»). Màn đã hiện thật (effect) mới LẤY (xoá).
export function layChangMoTruocNgay(token: string, now: number = Date.now(), chiXem = false): KetQuaMo | null {
  const c = dangCo
  if (c && c.token === token && now - c.luc < TUOI_MO_TRUOC_MS && c.kq) {
    if (!chiXem) dangCo = null
    return c.kq
  }
  if (!bat || !token) return null
  const than = JSON.stringify({ token })
  const som = xemHoiSomDaVe('/game-v2/hoc-tap-start', than)
  if (som && som.ok && som.text) {
    try {
      const r = JSON.parse(som.text) as KetQuaMo
      if (r && r.ok === true && Array.isArray(r.questions)) {
        if (!chiXem) { danhDauDaNhan('/game-v2/hoc-tap-start', than); if (c && c.token === token) dangCo = null }
        return r
      }
    } catch { /* bỏ qua */ }
  }
  return null
}

/** Lấy (và XOÁ) lượt mở trước còn hạn của `token`; không có ⇒ null. Lượt lỗi mạng ⇒ lời hứa trả về tự gọi lại MỘT lần như cũ. */
export function layChangMoTruoc(token: string, goi: typeof goiHoa2 = goiHoa2, now: number = Date.now()): Promise<KetQuaMo> | null {
  const c = dangCo
  dangCo = null
  if (!c || c.token !== token || now - c.luc >= TUOI_MO_TRUOC_MS) return null
  return c.p.catch(() => goi('hoc-tap-start', token, {}, GIAY_CHO_MO_CHANG))
}

/** Bỏ lượt mở trước (đăng xuất / test). */
export function boChangMoTruoc(): void { dangCo = null }

// BÁO RỜI APP GIỮA CHỪNG (thầy 29/10 «mở app tức thì mọi lúc»): em làm dở chặng rồi khoá máy / đổi ứng dụng ⇒ bản lập sẵn Sảnh + chặng trên máy chủ đã hết hạn (dấu đổi vì em vừa
// làm câu). Báo một lần cho máy chủ lập lại NỀN (server/src/san-sang.ts `chuanBiKhiThoat`) ⇒ lần mở app sau Sảnh có ngay, không lập kế hoạch ~3 s. Tối đa 1 lượt / 60 s; lỗi mạng bỏ qua.
// Em bấm «thoát» về Hôm nay thì KHÔNG báo ở đây: Hôm nay tự hỏi lại Sảnh và máy chủ lập sẵn sau lượt ấy. (Cùng tệp này để khỏi thêm một mảnh vào precache.)
const HAN_BAO_ROI_MS = 60_000
let cuoiBaoRoi = 0
export function baoRoiAppGiuaChung(token: string, now: number = Date.now(), goi: typeof goiHoa2 = goiHoa2): void {
  if (!token || now - cuoiBaoRoi < HAN_BAO_ROI_MS) return
  cuoiBaoRoi = now
  goi('hoc-tap-chuan-bi', token, {}, 10).catch(() => {})
}
/** Gắn khi màn đang làm: app bị ẩn mà `coTienDo()` đúng ⇒ báo. Trả hàm gỡ. */
export function nghePhanAnRoiApp(coTienDo: () => boolean, token: string): () => void {
  const f = () => { if (document.visibilityState === 'hidden' && coTienDo()) baoRoiAppGiuaChung(token) }
  document.addEventListener('visibilitychange', f)
  return () => document.removeEventListener('visibilitychange', f)
}
/** Chỉ cho test. */
export const datLaiBaoRoiApp = (): void => { cuoiBaoRoi = 0 }

// GÓI BÀI CẢ NGÀY TRÊN MÁY EM (thầy 29/10 22:05 «tìm mọi cách, cách khác hoàn toàn để app hs load tức thì ở mọi thời điểm, kể cả giờ cao điểm» · «bắt buộc, tới lúc
// nào load được tức thì tại mọi thời điểm mới được dừng lại»; máy chủ server/src/goi-ngay.ts). Máy em giữ SẴN các chặng còn lại của hôm nay (đề công khai + bộ ref
// niêm phong `ve` — máy em không đọc / sửa được; đáp án KHÔNG có trong gói). Mở chặng ⇒ câu hiện NGAY từ máy; phiên mở NỀN (`hoc-tap-mo-goi`, nhẹ: không lập kế
// hoạch); «Kiểm tra» trước khi phiên về thì tự đợi phiên. Gói lập lại NỀN sau mỗi chặng (câu sửa lỗi mới, bài thầy vừa giao) — KHÔNG lập lúc mở app: chặng đầu khi chưa có
// gói đi lượt mở trước (đã có bản sẵn cron, nhẹ) ⇒ mở app không thêm lệnh nặng nào giờ cao điểm; có gói ⇒ không lệnh nào ngoài lệnh nhẹ mở phiên.
// Máy chủ tắt / em chưa được bật (`tat`) ⇒ nhớ 30 phút, mọi thứ y như cũ. Không có gói / gói hỏng / máy chủ từ chối ⇒ đường mở chặng cũ.
type ChangGoi = { ve: string; questions: KetQuaMo[] }
type GoiNgay = { ngay: string; luc: number; chang: ChangGoi[]; goi7?: unknown }
/** Trạng thái chặng em đang làm dở trên máy (thầy 30/10 «Khi hs thoát app bất thình lình … phải load lại đúng chỗ em đang dở. Lưu đúng chỗ đó.»). */
export type ChangDangLam = {
  sbd: string
  ngay: string
  moLuc: number
  luc: number
  phien: string
  cau: KetQuaMo[]
  soGoc: number
  viTri: number
  ket: Record<string, unknown>
  tra?: string
  chang: number | null
  goi7?: unknown
  dem?: { daLam: number; muc: number } | null
  moi?: { qids: string[]; tiep: number; d0: number; ngay: string }
  tuLam?: boolean
  goiY?: boolean
  moLoiGiai?: boolean
  msCau?: Record<string, number>
  dhMs?: number
  dhT?: { v: number; a: number; l: number; n: number; lang: number }
  daXinLamLai?: boolean
  luotChang?: number
  daHoiThay?: string
  hoTroCham?: string
}
// SBD bỏ khoảng trắng hai đầu: phiên lưu trên máy có thể mang khoảng trắng (mo-app-hs-nhanh-0510), máy chủ trả SBD sạch ⇒ cùng một khoá.
const khoaGoi = (sbd: string) => `omr_goi_ngay_${sbd.trim()}`, khoaXong = (sbd: string) => `omr_goi_ngay_xong_${sbd.trim()}`, khoaDang = (sbd: string) => `omr_chang_dang_lam_${sbd.trim()}`
const KHOA_CUA = 'omr_goi_ngay_cua', KHOA_TAT = 'omr_goi_ngay_tat'
const ngayMay = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)
/** Lập lại gói tối đa một lần mỗi chừng này (trừ lượt sau chặng: luôn lập lại). */
export const TUOI_GOI_MS = 10 * 60_000
const HAN_TAT_MS = 30 * 60_000
/** Phiên trên máy chủ sống 2 giờ (`startGoi7`); giữ chặng đang dở 105 phút trên máy để mở lại tức thì 0 ms đúng câu đang làm. */
export const HAN_CHANG_DANG_MS = 105 * 60_000
/** Số câu một chặng (máy chủ goi-ngay.ts `CAU_MOI_CHANG`). */
export const CAU_MOI_CHANG_GOI = 6
const nhoGoi = new Map<string, GoiNgay>(), nhoXong = new Map<string, { n: string; q: Set<string> }>(), nhoDang = new Map<string, ChangDangLam>()
let napDang: Promise<void> | null = null, napCuoi = { token: '', luc: 0 }
/** Bộ test mặc định TẮT (như `bat` ở trên: các test cũ đếm đúng số lệnh gửi máy chủ); test của gói bật bằng `batGoiNgay(true)`. */
let batGoi = !(globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITEST
const duoiToken = (t: string) => t.slice(-16)
const docJson = (k: string): unknown => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch { return null } }
const ghiJson = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* đầy / bị chặn: vẫn dùng bản trong bộ nhớ */ } }

function docGoi(sbd: string): GoiNgay | null {
  sbd = sbd.trim()
  const m = nhoGoi.get(sbd)
  if (m) return m
  const g = docJson(khoaGoi(sbd)) as GoiNgay | null
  if (!g || typeof g.ngay !== 'string' || !Array.isArray(g.chang)) return null
  nhoGoi.set(sbd, g)
  return g
}
function docXong(sbd: string, ngay: string): Set<string> {
  sbd = sbd.trim()
  const m = nhoXong.get(sbd)
  if (m && m.n === ngay) return m.q
  const x = docJson(khoaXong(sbd)) as { n?: unknown; q?: unknown } | null
  const q = new Set(x && x.n === ngay && Array.isArray(x.q) ? x.q.filter((v): v is string => typeof v === 'string') : [])
  nhoXong.set(sbd, { n: ngay, q })
  return q
}

/** Lập lại gói NỀN (không bao giờ ném). `luon` = sau chặng: bỏ qua nhịp 10 phút. */
export function napGoiNgay(token: string, goi: typeof goiHoa2 = goiHoa2, now: number = Date.now(), luon = false): Promise<void> {
  if (!batGoi || !token) return Promise.resolve()
  if (napDang) return napDang
  const tat = Number(docJson(KHOA_TAT)) || 0
  if (now < tat) return Promise.resolve()
  if (!luon && napCuoi.token === token && now - napCuoi.luc < TUOI_GOI_MS) return Promise.resolve()
  napCuoi = { token, luc: now }
  napDang = Promise.resolve().then(() => goi('hoc-tap-goi-ngay', token, {}, 60)).then((r) => {
    if (r.ok !== true || typeof r.sbd !== 'string' || !r.sbd) return
    if (r.tat === true) { ghiJson(KHOA_TAT, now + HAN_TAT_MS); boGoiNgay(r.sbd); return }
    if (typeof r.ngay !== 'string' || !Array.isArray(r.chang)) return
    const chang = (r.chang as ChangGoi[]).filter((c) => c && typeof c.ve === 'string' && Array.isArray(c.questions) && c.questions.length > 0)
    const g: GoiNgay = { ngay: r.ngay, luc: now, chang, goi7: r.goi7 }
    nhoGoi.set(r.sbd.trim(), g)
    ghiJson(khoaGoi(r.sbd), g)
    ghiJson(KHOA_CUA, { sbd: r.sbd, t: duoiToken(token) })
    napAnhSan(chang.flatMap((c) => c.questions).slice(0, CAU_MOI_CHANG_GOI))
  }).catch(() => {}).finally(() => { napDang = null })
  return napDang
}

/** Nạp sẵn ẢNH ĐỀ của chặng kế (hình đề, thân câu, hình phương án / ý — không hình lời giải) lúc máy rảnh: mở chặng là hình có ngay, mạng yếu không chờ tải. */
function napAnhSan(qs: KetQuaMo[]): void {
  if (typeof Image === 'undefined') return
  const ds: string[] = []
  for (const q of qs) {
    const hinh = Array.isArray(q.hinhAnh) ? (q.hinhAnh as { src?: unknown; viTri?: unknown }[]).filter((h) => h && h.viTri !== 'sau_loi_giai').map((h) => h.src) : []
    for (const src of [...hinh, q.thanCauImg, ...(Array.isArray(q.choiceImgs) ? q.choiceImgs : []), ...(Array.isArray(q.ideaImgs) ? q.ideaImgs : [])])
      if (typeof src === 'string' && src && !src.startsWith('data:') && !ds.includes(src)) ds.push(src)
  }
  if (!ds.length) return
  const chay = () => { for (const src of ds) { const im = new Image(); im.decoding = 'async'; im.src = src } }
  const w = globalThis as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }
  if (w.requestIdleCallback) w.requestIdleCallback(chay, { timeout: 5000 }); else setTimeout(chay, 1500)
}

/** Chặng kế tiếp trong gói của em: `so` câu đầu (theo thứ tự gói) máy này CHƯA làm hôm nay — ghép qua ranh các chặng của gói (gói lập lại giữa chừng vẫn đủ một
 *  chặng); `ves` = bộ ref niêm phong của các chặng góp câu. Không có / khác ngày ⇒ null. */
export function layChangGoi(sbd: string, now: number = Date.now(), so = CAU_MOI_CHANG_GOI): { ves: string[]; questions: KetQuaMo[]; goi7: unknown } | null {
  if (!batGoi || !sbd) return null
  const g = docGoi(sbd)
  if (!g || g.ngay !== ngayMay(now)) return null
  const xong = docXong(sbd, g.ngay), questions: KetQuaMo[] = [], ves: string[] = []
  for (const c of g.chang) {
    for (const q of c.questions) {
      if (questions.length >= so) break
      if (typeof q.qid !== 'string' || xong.has(q.qid) || questions.some((x) => x.qid === q.qid)) continue
      questions.push(q)
      if (!ves.includes(c.ve)) ves.push(c.ve)
    }
  }
  return questions.length ? { ves, questions, goi7: g.goi7 } : null
}
function coChangGoiCua(token: string, now: number): boolean {
  const c = docJson(KHOA_CUA) as { sbd?: unknown; t?: unknown } | null
  return !!c && typeof c.sbd === 'string' && c.t === duoiToken(token) && (!!docChangDangLam(c.sbd, now) || !!layChangGoi(c.sbd, now))
}

/** Lưu trạng thái chặng em đang làm dở trên máy — thoát bất thình lình mở lại đúng câu, đúng tiến độ tức thì 0 ms. */
export function luuChangDangLam(sbd: string, b: Omit<ChangDangLam, 'sbd' | 'ngay' | 'luc'>, now: number = Date.now()): void {
  sbd = sbd.trim()
  if (!batGoi || !sbd || !Array.isArray(b.cau) || !b.cau.length) return
  const moLuc = typeof b.moLuc === 'number' && b.moLuc > 0 ? b.moLuc : now
  const d: ChangDangLam = { ...b, sbd, ngay: ngayMay(now), moLuc, luc: now }
  nhoDang.set(sbd, d)
  ghiJson(khoaDang(sbd), d)
  ghiJson('omr_chang_dang_cua', d)
  if (b.ket && Object.keys(b.ket).length > 0) try { localStorage.removeItem('ddh.khung-tinh-hs') } catch { /* bỏ qua */ }
}

/** Đọc trạng thái chặng đang làm dở của `sbd`; khác ngày / quá hạn phiên / dữ liệu hỏng ⇒ xoá và trả null. */
export function docChangDangLam(sbd: string, now: number = Date.now()): ChangDangLam | null {
  sbd = sbd.trim()
  if (!batGoi || !sbd) return null
  const m = nhoDang.get(sbd) ?? (docJson(khoaDang(sbd)) as ChangDangLam | null)
  if (!m || m.sbd !== sbd || m.ngay !== ngayMay(now) || typeof m.moLuc !== 'number' || now - m.moLuc >= HAN_CHANG_DANG_MS || !Array.isArray(m.cau) || !m.cau.length || typeof m.viTri !== 'number' || m.viTri < 0 || m.viTri >= m.cau.length) {
    if (m) xoaChangDangLam(sbd)
    return null
  }
  nhoDang.set(sbd, m)
  return m
}

/** Xoá chặng đang làm dở (khi em đã hoàn thành chặng hoặc chặng rỗng). */
export function xoaChangDangLam(sbd: string): void {
  sbd = sbd.trim()
  if (!sbd) return
  nhoDang.delete(sbd)
  try { localStorage.removeItem(khoaDang(sbd)); localStorage.removeItem('omr_chang_dang_cua') } catch { /* bỏ qua */ }
}

/** Câu em vừa làm xong (đã chấm) — chặng kế trong gói bỏ câu này. */
export function ghiCauXong(sbd: string, qid: string, now: number = Date.now()): void {
  if (!batGoi || !sbd || !qid) return
  const n = ngayMay(now), q = docXong(sbd, n)
  if (q.has(qid)) return
  q.add(qid)
  ghiJson(khoaXong(sbd), { n, q: [...q] })
}

/** Bỏ gói (máy chủ từ chối gói: hết hạn / bài đổi / em đã làm hết) — lần sau đi đường cũ tới khi gói mới về. */
export function boGoiNgay(sbd: string): void {
  nhoGoi.delete(sbd.trim())
  try { localStorage.removeItem(khoaGoi(sbd)) } catch { /* bỏ qua */ }
}
/** Chỉ cho test. */
export const datLaiGoiNgay = (): void => { nhoGoi.clear(); nhoXong.clear(); nhoDang.clear(); napDang = null; napCuoi = { token: '', luc: 0 } }
export function batGoiNgay(b: boolean): void { batGoi = b; datLaiGoiNgay() }
