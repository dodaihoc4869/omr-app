// MỞ CHẶNG TRƯỚC (thầy 16/10, ảnh "Chặng học của em — Đang chuẩn bị những câu phù hợp với em…": "phần này load lâu quá, quét và tối ưu tốc độ tức thì").
// Màn làm bài chỉ chờ MỘT lệnh: `hoc-tap-start` (máy chủ lập kế hoạch Gói 7, đọc câu, lưu phiên). Gọi lệnh ấy SỚM, lúc em gần như chắc sẽ bấm học:
//   · Hôm nay đã có số và nút "Học tiếp" bấm được (không phải ngày kiểm tra riêng, còn việc xếp được);
//   · em vừa xong chặng (màn "Học tiếp chặng N" — câu cuối đã nộp xong nên kế hoạch đã tính câu ấy).
// Em bấm ⇒ màn làm bài dùng lại ĐÚNG lời hứa đang bay / đã xong ⇒ câu hiện ngay. Kết quả GIỐNG HỆT gọi lúc bấm: máy chủ tự dùng lại phiên chưa làm xong
// (cùng mã phiên, trong 2 giờ — goi-bai-7.ts `startGoi7`), trần câu/ngày đếm theo câu đã TRẢ LỜI chứ không theo phiên ⇒ mở trước không tốn suất của em.
// Mỗi lời hứa dùng MỘT lần; quá TUOI_MO_TRUOC_MS, khác token hoặc lời hứa lỗi mạng ⇒ màn làm bài gọi lại như cũ.
import { goiHoa2 } from '../hoa2/api'

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
export function layChangMoTruocNgay(token: string, now: number = Date.now()): KetQuaMo | null {
  const c = dangCo
  if (!c || c.token !== token || now - c.luc >= TUOI_MO_TRUOC_MS || !c.kq) return null
  dangCo = null
  return c.kq
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
// SBD bỏ khoảng trắng hai đầu: phiên lưu trên máy có thể mang khoảng trắng (mo-app-hs-nhanh-0510), máy chủ trả SBD sạch ⇒ cùng một khoá.
const khoaGoi = (sbd: string) => `omr_goi_ngay_${sbd.trim()}`, khoaXong = (sbd: string) => `omr_goi_ngay_xong_${sbd.trim()}`
const KHOA_CUA = 'omr_goi_ngay_cua', KHOA_TAT = 'omr_goi_ngay_tat'
const ngayMay = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)
/** Lập lại gói tối đa một lần mỗi chừng này (trừ lượt sau chặng: luôn lập lại). */
export const TUOI_GOI_MS = 10 * 60_000
const HAN_TAT_MS = 30 * 60_000
/** Số câu một chặng (máy chủ goi-ngay.ts `CAU_MOI_CHANG`). */
export const CAU_MOI_CHANG_GOI = 6
const nhoGoi = new Map<string, GoiNgay>(), nhoXong = new Map<string, { n: string; q: Set<string> }>()
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
  }).catch(() => {}).finally(() => { napDang = null })
  return napDang
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
  return !!c && typeof c.sbd === 'string' && c.t === duoiToken(token) && !!layChangGoi(c.sbd, now)
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
export const datLaiGoiNgay = (): void => { nhoGoi.clear(); nhoXong.clear(); napDang = null; napCuoi = { token: '', luc: 0 } }
export function batGoiNgay(b: boolean): void { batGoi = b; datLaiGoiNgay() }
