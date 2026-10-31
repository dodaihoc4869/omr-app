// NGĂN RIÊNG TỪNG HỌC SINH (thầy 30/10 22:30: «PHẢI SỬA NHƯ DOLIGO … HÀNG TRĂM NGHÌN HS LÀM MỘT LÚC CÒN ĐƯỢC, ĐÂY CÓ MẤY TRĂM HỌC SINH KO LÀM NỔI»).
// Đo máy thật 30/10 21:40 (wrangler tail 95 giây): Cloudflare rải lệnh ra ≥ 200 isolate, mỗi isolate ~1 lệnh / phút (`[bo-nho]` soYc p50 = 1) ⇒ mọi đệm
// trong isolate (Sảnh, kế hoạch, kho câu, xác thực …) gần như KHÔNG BAO GIỜ trúng: lệnh nào cũng là «lần đầu» và đọc lại D1 (Sảnh lần đầu 148 câu SQL,
// lần sau 3 câu — đo tests/do-tai-nong-3010.test.ts). D1 chính nghẽn ⇒ «Máy chủ đang bận», «Chưa nộp được câu».
// Cách các app lớn làm trên Cloudflare: MỖI EM MỘT Durable Object (idFromName(sbd)) — mọi lệnh của em luôn vào CÙNG một chỗ chạy ⇒ đệm của em luôn ấm,
// D1 chỉ còn phần thật sự đổi. Mã xử lý KHÔNG đổi: ngăn gọi lại đúng `fetch` của Worker (dấu `x-trong-ngan-hs` ⇒ đi thẳng, không vòng lại).
// An toàn: thiếu binding (test, bản cũ) / công tắc `TAT_NGAN_HS` / không đọc được SBD ⇒ đường cũ y nguyên; ngăn lỗi ⇒ tự quay về đường cũ với ĐÚNG thân gói.
// Không đi qua ngăn: đăng nhập, thi (vào thi / lưu tạm / nộp), lệnh thầy / phụ huynh, GET.
import type { DurableObjectState, Env, ExecutionContext, KhoEm, SqlNgan } from './kieu'
import { gomD1, type D1Gom, type DemLenhD1 } from './gom-d1'

type XuLy = (req: Request, env: Env, ctx?: ExecutionContext) => Promise<Response>
let xuLy: XuLy | null = null
/** index.ts gán `fetch` của Worker (tránh vòng nhập). */
export const datXuLyNgan = (f: XuLy): void => { xuLy = f }
export const DAU_TRONG_NGAN = 'x-trong-ngan-hs'
/** SBD của ngăn (Worker ghi khi chuyển vào) — kho riêng chỉ phục vụ đúng em này. */
export const DAU_SBD_NGAN = 'x-ngan-sbd'
/** Tiền tố tên ngăn: đổi ⇒ mọi em sang ngăn mới (tạo lại đúng vùng theo `locationHint`). */
export const TIEN_TO_NGAN = 'apac|'

// NGĂN SÁT D1 (31/10, đo máy thật `[ngan-do]`: ngăn của em nằm ở NRT / KIX còn D1 chính ở Hồng Kông ⇒ MỖI vòng D1 50–60 ms; Sảnh lần đầu 12 vòng ≈ 0,7 s).
// `locationHint: 'apac'` chỉ chọn VÙNG; Cloudflare tạo ngăn «gần nơi gọi get() lần đầu». Cách đặt ngăn sát D1: (1) bốc thăm vài ngăn TRUNG CHUYỂN `dinh|i`
// (gợi ý apac), mỗi ngăn tự đo một vòng `SELECT 1` tới D1 — giữ các ngăn đo nhanh nhất (cùng trạm với D1) vào `cau_hinh.ngan_dinh`; (2) ngăn của em mang tên
// mới `d1|<sbd>`, lần đầu được TẠO bởi ngăn trung chuyển (get() không gợi ý ⇒ tạo ngay cạnh trung chuyển = cạnh D1). Đã tạo rồi thì Worker gọi thẳng.
// Chưa có danh sách (máy mới / chưa đo xong) ⇒ đường `apac|` như cũ và bốc thăm ở nền. Công tắc `TAT_NGAN_DINH` ⇒ đường cũ.
/** Tiền tố ngăn sát D1 (tạo qua ngăn trung chuyển). */
export const TIEN_TO_NGAN_D1 = 'd1|'
/** Worker → ngăn trung chuyển: tên ngăn của em cần tạo / gọi (chỉ Worker đặt; Worker luôn xoá giá trị máy khách gửi tới). */
export const DAU_CHUYEN_NGAN = 'x-ngan-chuyen'
/** Lệnh đo vị trí của ngăn (chỉ gọi được qua binding — Worker không chuyển đường này vào ngăn). */
export const DUONG_DO_VI_TRI = '/__ngan/vi-tri'
export const KHOA_NGAN_DINH = 'ngan_dinh'
export const KHOA_NGAN_DINH_KHOA = 'ngan_dinh_khoa'
const RE_TEN_DINH = /^dinh\|(k\|)?\d{1,4}$/
/** Tiền tố ngăn sát D1 hợp lệ (`d1|`, `d2|` …) — đổi khi bốc thăm tìm được chỗ gần D1 hơn hẳn ⇒ mọi em sang ngăn mới đúng chỗ. */
const RE_TIEN_D1 = /^d\d{1,2}\|$/
/** Phiên bản bốc thăm: cấu hình cũ hơn ⇒ bốc thăm lại ở nền (vẫn dùng danh sách cũ trong lúc chờ). */
export const BAN_BOC_THAM = 3

/**
 * KHO RIÊNG CỦA EM trong SQLite của ngăn: dòng sổ (`su_kien_hoc` của em, đúng các cột omni-d1 đọc) + mốc (n = số dòng, r = received_at lớn nhất).
 * Đệm trong bộ nhớ isolate có trần dòng (chống tràn 128 MB) nên em ngoài đệm phải đọc lại CẢ SỔ từ D1 (1.256 dòng TB, 8.473 lần / 2,5 giờ cao điểm 30/10);
 * kho này nằm trên đĩa của ngăn ⇒ không tốn bộ nhớ, còn nguyên sau khi ngăn ngủ ⇒ chỉ đọc phần MỚI từ D1. Lỗi bất kỳ ⇒ null / bỏ qua (đọc D1 như cũ).
 */
export function taoKhoEm(sql: SqlNgan, sbd: string): KhoEm {
  let san = false
  const dung = () => {
    if (san) return
    sql.exec('CREATE TABLE IF NOT EXISTS so(khoa TEXT PRIMARY KEY, tt INTEGER NOT NULL, j TEXT NOT NULL)')
    sql.exec('CREATE TABLE IF NOT EXISTS so_moc(id INTEGER PRIMARY KEY, sbd TEXT NOT NULL, n INTEGER NOT NULL, r INTEGER NOT NULL)')
    san = true
  }
  return {
    sbd,
    docSo() {
      try {
        dung()
        const m = sql.exec('SELECT sbd, n, r FROM so_moc WHERE id = 1').toArray()[0]
        if (!m || m.sbd !== sbd) return null
        const rows = sql.exec('SELECT j FROM so ORDER BY tt').toArray().map((x) => JSON.parse(String(x.j)) as Record<string, unknown>)
        const n = Number(m.n), r = Number(m.r)
        return rows.length === n ? { rows, n, r } : null
      } catch (e) {
        console.error('[ngan-hs] đọc kho sổ lỗi:', e instanceof Error ? e.message : e)
        return null
      }
    },
    ghiSo(rows, n, r, chiThem) {
      try {
        dung()
        let tt = 0
        if (chiThem) tt = Number(sql.exec('SELECT COALESCE(MAX(tt), -1) + 1 AS t FROM so').toArray()[0]?.t ?? 0)
        else sql.exec('DELETE FROM so')
        for (const x of rows) sql.exec('INSERT OR REPLACE INTO so(khoa, tt, j) VALUES (?, ?, ?)', String(x.khoa), tt++, JSON.stringify(x))
        sql.exec('INSERT OR REPLACE INTO so_moc(id, sbd, n, r) VALUES (1, ?, ?, ?)', sbd, n, r)
      } catch (e) {
        console.error('[ngan-hs] ghi kho sổ lỗi:', e instanceof Error ? e.message : e)
        try { sql.exec('DELETE FROM so_moc') } catch { /* kho hỏng ⇒ lần sau đọc D1 */ }
      }
    },
  }
}

/**
 * MỘT `env` dùng chung cho mọi ngăn trong isolate: đệm của máy chủ khoá theo đối tượng D1 gốc (`dbGoc`) — nếu mỗi ngăn mang `env` riêng thì dữ liệu CHUNG
 * (kho câu, siêu dữ liệu câu, chiến dịch …) bị nhân bản theo từng em ⇒ tràn 128 MB của isolate. Ràng buộc (D1, R2, biến) như nhau ở mọi ngăn cùng lớp.
 */
let envChung: Env | null = null
export const xoaEnvChungNgan = (): void => { envChung = null }

/**
 * ĐO VỊ TRÍ NGĂN (31/10 sáng: lưu một câu Kiểm tra ôn tập 1,1–2,1 s dù ít em ⇒ nghi ngăn đặt XA D1, mỗi vòng D1 đi xa). Mỗi isolate: trạm Cloudflare đang chạy
 * (`/cdn-cgi/trace`, một lần) + thời gian một câu `SELECT 1` tới D1 (tối đa một lần / phút). Gắn vào phản hồi dạng header — không lộ gì của em.
 */
let tram = ''
let d1Ms = '-', d1Luc = 0
function doViTri(env: Env, ctx: ExecutionContext): void {
  const now = Date.now()
  // Dấu chờ PHẢI là ASCII: giá trị header chỉ nhận byte ≤ 255 (31/10: «…» làm lệnh đầu của mỗi isolate ngăn ném TypeError ⇒ Worker chạy lại đường cũ).
  if (!tram) { tram = '~'; ctx.waitUntil(fetch('https://cloudflare.com/cdn-cgi/trace').then((r) => r.text()).then((t) => { tram = /colo=([A-Z]+)/.exec(t)?.[1] ?? '?' }).catch(() => { tram = '?' })) }
  // Hai câu nối tiếp: câu đầu có thể mang thời gian mở kết nối (isolate mới) — ghi «lần đầu/lần hai».
  if (now - d1Luc > 60_000) { d1Luc = now; ctx.waitUntil((async () => { let t0 = Date.now(); await env.DB.prepare('SELECT 1').first(); const a = Date.now() - t0; t0 = Date.now(); await env.DB.prepare('SELECT 1').first(); d1Ms = `${a}/${Date.now() - t0}` })().catch(() => {})) }
}

/** Trạm Cloudflare của isolate (đợi tối đa 2 giây). */
async function docTram(): Promise<string> {
  if (tram && tram !== '~') return tram
  try {
    const t = await (await fetch('https://cloudflare.com/cdn-cgi/trace', { signal: AbortSignal.timeout(2000) })).text()
    tram = /colo=([A-Z]+)/.exec(t)?.[1] ?? '?'
  } catch { tram = tram || '?' }
  return tram
}

/**
 * ĐỆM PHẢN HỒI LỆNH HỎI ĐỊNH KỲ trong ngăn của em (31/10, đo `[gom-lenh]` thử tải 2000 em: ca thi đang mở · buổi học · bài mẹ giao · thông báo · thưởng · cờ chữa
 * câu sai ≈ 1/5 số yêu cầu D1 — máy em hỏi lại theo nhịp dù không có gì đổi; D1 giới hạn số yêu cầu mỗi giây). Chỉ đệm khi lệnh KHÔNG phát câu ghi nào (bộ gom
 * báo) và trả 200 JSON; em có lệnh ghi bất kỳ (kể cả việc phụ sau phản hồi) ⇒ bỏ hết đệm của em ngay. Thứ thầy đổi (mở ca, giao bài) tới chậm tối đa thời hạn
 * dưới đây. Trả lại đúng thân cũ, `serverNow` làm mới. Công tắc `TAT_DEM_PHAN_HOI`.
 */
export const HAN_DEM_PHAN_HOI: Readonly<Record<string, number>> = {
  '/hs/ca-dang-mo': 10_000, '/hs/buoi-hoc': 20_000, '/mom/list': 20_000, '/notifications/list': 20_000, '/hs/thuong': 15_000, '/hs/chua-cau-sai/co': 20_000,
}
type DemPh = { luc: number; han: number; headers: [string, string][]; than: string }

export class NganHocSinh {
  private kho: KhoEm | null = null
  private demPh = new Map<string, DemPh>()
  constructor(private readonly state: DurableObjectState, private readonly env: Env) {}
  async fetch(req: Request): Promise<Response> {
    const duong = new URL(req.url).pathname
    // Đo vị trí (bốc thăm ngăn trung chuyển): trạm + bốn vòng `SELECT 1` nối tiếp tới D1 (vòng đầu có thể mang thời gian mở kết nối).
    if (duong === DUONG_DO_VI_TRI) {
      const ms: number[] = []
      try { for (let i = 0; i < 4; i++) { const t0 = Date.now(); await this.env.DB.prepare('SELECT 1').first(); ms.push(Date.now() - t0) } } catch { /* D1 lỗi ⇒ ms thiếu, bên đo bỏ ngăn này */ }
      // 31/10 (v3): cùng phép đo qua BẢN SAO ĐỌC gần nhất (Sessions API 'first-unconstrained', mỗi vòng một phiên mới) — biết bản sao có nằm gần ngăn hơn bản chính
      // không (D1 thật bật bản sao 'auto'; mỗi bản sao có hạn mức yêu cầu riêng). Chỉ ĐO, chưa đổi đường đọc.
      const msBs: number[] = []
      try { if (this.env.DB.withSession) for (let i = 0; i < 4; i++) { const t0 = Date.now(); await this.env.DB.withSession('first-unconstrained').prepare('SELECT 1').first(); msBs.push(Date.now() - t0) } } catch { /* không có bản sao ⇒ bỏ */ }
      return new Response(JSON.stringify({ tram: await docTram(), ms, msBs }), { headers: { 'content-type': 'application/json' } })
    }
    // NGĂN TRUNG CHUYỂN: chuyển nguyên lệnh sang ngăn sát D1 của em (get() KHÔNG gợi ý ⇒ ngăn mới tạo cạnh trung chuyển). Chỉ nhận đúng tên `d1|<sbd của lệnh>`.
    const chuyen = req.headers.get(DAU_CHUYEN_NGAN)
    if (chuyen) {
      const ns = this.env.NGAN_HS
      const h = new Headers(req.headers)
      h.delete(DAU_CHUYEN_NGAN)
      const lai = new Request(req.url, { method: req.method, headers: h, body: req.method === 'GET' ? undefined : await req.arrayBuffer() })
      const m = /^(d\d{1,2}\|)(.+)$/.exec(chuyen)
      if (ns && m && RE_TIEN_D1.test(m[1]!) && m[2] === (req.headers.get(DAU_SBD_NGAN) ?? '')) return ns.get(ns.idFromName(chuyen)).fetch(lai)
      req = lai // tên lạ ⇒ tự xử lý như một ngăn thường (kết quả vẫn đúng, chỉ không sát D1)
    }
    if (!xuLy) return new Response(JSON.stringify({ ok: false, error: 'Máy chủ đang khởi động, em thử lại nhé.', maLoi: 'MAY_CHU_BAN' }), { status: 503, headers: { 'content-type': 'application/json' } })
    const state = this.state
    const ctx = { waitUntil: (p: Promise<unknown>) => state.waitUntil(p), passThroughOnException() {} } as unknown as ExecutionContext
    const sbd = req.headers.get(DAU_SBD_NGAN) ?? ''
    if (sbd && state.storage?.sql && (!this.kho || this.kho.sbd !== sbd)) this.kho = taoKhoEm(state.storage.sql, sbd)
    // Gom lệnh D1 (gom-d1.ts): mọi ngăn trong isolate dùng chung MỘT bộ gom ⇒ câu đọc của nhiều em trong cùng lượt cũng đi chung một lô.
    const env = (envChung ??= this.env.TAT_GOM_D1 || !this.env.DB ? this.env : { ...this.env, DB: gomD1(this.env.DB) })
    doViTri(env, ctx)
    const t0 = Date.now()
    const han = this.env.TAT_DEM_PHAN_HOI ? 0 : HAN_DEM_PHAN_HOI[duong] ?? 0
    let khoaPh = ''
    if (han && req.method === 'POST') {
      const than = await req.text()
      req = new Request(req.url, { method: 'POST', headers: req.headers, body: than })
      khoaPh = `${duong}\u0001${than}`
      const c = this.demPh.get(khoaPh)
      if (c && t0 - c.luc >= 0 && t0 - c.luc < c.han) {
        const h = new Headers(c.headers)
        h.set('x-ngan-do', `${tram || '-'};d1=${d1Ms};xl=0;dem=1`)
        return new Response(c.than.replace(/"serverNow":\d+/, `"serverNow":${Date.now()}`), { status: 200, headers: h })
      }
    }
    // ĐO THEO LỆNH (31/10): mọi lệnh mang bộ đếm câu / vòng D1 (+ cờ «đã ghi» cho đệm phản hồi); 1/10 lệnh ghi log `[gom-lenh] <đường> cau=… vong=… xl=…`
    // (wrangler tail gom theo đường) — không SBD. Lệnh của em có câu GHI ⇒ bỏ đệm phản hồi của em (cả khi ghi ở việc phụ sau phản hồi).
    const coXem = !!(env.DB as Partial<D1Gom>).voiDem
    const dem: DemLenhD1 = { cau: 0, vong: new Set(), khiGhi: () => this.demPh.clear() }
    const envLenh = coXem ? { ...env, DB: (env.DB as D1Gom).voiDem(dem) } : env
    const res = await xuLy(req, this.kho ? { ...envLenh, KHO_EM: this.kho } : envLenh, ctx)
    if (coXem && Math.random() < 0.1) console.log('[gom-lenh]', duong, `cau=${dem.cau}`, `vong=${dem.vong.size}`, `xl=${Date.now() - t0}`)
    // Dấu «đã qua ngăn» (đo được trên máy thật, không lộ gì): 1 = ngăn có kho sổ · trạm chạy ngăn · ms một vòng D1 · ms xử lý trong ngăn.
    const h = new Headers(res.headers)
    h.set('x-ngan', this.kho ? '1' : '0')
    h.set('x-ngan-do', `${tram || '-'};d1=${d1Ms};xl=${Date.now() - t0}`)
    const ex = h.get('access-control-expose-headers'); h.set('access-control-expose-headers', ex ? `${ex}, x-ngan, x-ngan-do` : 'x-ngan, x-ngan-do')
    if (khoaPh && coXem && res.status === 200 && !dem.ghi && /json/.test(res.headers.get('content-type') ?? '') && !/ndjson/.test(res.headers.get('content-type') ?? '')) {
      const than = await res.text()
      if (!dem.ghi) {
        if (this.demPh.size >= 16) this.demPh.delete(this.demPh.keys().next().value!)
        this.demPh.set(khoaPh, { luc: t0, han, headers: [...h], than })
      }
      return new Response(than, { status: 200, statusText: res.statusText, headers: h })
    }
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h })
  }
}

/** Đường của app HỌC SINH đi qua ngăn (đều mang `token` game của em). */
export const laDuongNgan = (p: string): boolean =>
  (p.startsWith('/game-v2/') || (p.startsWith('/hs/') && p !== '/hs/dang-nhap') || p === '/presence' || p.startsWith('/notifications/') || p.startsWith('/mom/'))

/** SBD trong phần dữ liệu (chưa kiểm chữ ký — chỉ để CHỌN NGĂN; ngăn vẫn kiểm token đầy đủ như cũ). */
export function sbdChonNgan(b: unknown): string | null {
  if (!b || typeof b !== 'object') return null
  const t = (b as { token?: unknown }).token
  if (typeof t === 'string' && t.includes('.')) {
    try {
      const j = JSON.parse(atob(t.slice(0, t.indexOf('.')))) as { sbd?: unknown }
      if (typeof j.sbd === 'string' && /^[0-9A-Za-z_-]{1,40}$/.test(j.sbd)) return j.sbd
    } catch { /* token hỏng ⇒ đường cũ trả lời lỗi như trước */ }
  }
  return null
}

async function docThan(buf: ArrayBuffer, req: Request): Promise<unknown> {
  const u8 = new Uint8Array(buf)
  if ((u8.length >= 2 && u8[0] === 0x1f && u8[1] === 0x8b) || req.headers.get('content-encoding') === 'gzip') {
    return new Response(new Response(buf).body!.pipeThrough(new DecompressionStream('gzip'))).json()
  }
  return JSON.parse(new TextDecoder().decode(buf))
}

// ---------------------------------------------------------------- ngăn trung chuyển (sát D1)
/** Danh sách ngăn trung chuyển trong isolate (đọc `cau_hinh.ngan_dinh`, 10 phút; hết hạn ⇒ dùng bản cũ, đọc lại ở nền). */
interface CauHinhDinh { ds: string[]; tien: string; v: number }
let dinh: (CauHinhDinh & { luc: number }) | null = null
let dangDocDinh: Promise<CauHinhDinh> | null = null
const HAN_DINH_MS = 10 * 60_000
/** Ngăn `d1|` đã tạo (Worker gọi thẳng, khỏi qua trung chuyển). Tối đa 20.000 tên / isolate. */
const daTaoNgan = new Set<string>()
let daThuChon = false
export function xoaDemNganDinh(): void { dinh = null; dangDocDinh = null; daTaoNgan.clear(); daThuChon = false }

/** `{"ds":["dinh|3",…]}` ⇒ tên hợp lệ; hỏng ⇒ rỗng. */
export function docDsDinh(gt: unknown): string[] {
  return docCauHinhDinh(gt).ds
}
/** Cấu hình ngăn trung chuyển: danh sách + tiền tố ngăn em (`d1|` mặc định) + phiên bản bốc thăm (vắng ⇒ 1). */
export function docCauHinhDinh(gt: unknown): CauHinhDinh {
  try {
    const j = JSON.parse(String(gt ?? '')) as { ds?: unknown; tien?: unknown; v?: unknown }
    const ds = Array.isArray(j.ds) ? j.ds.filter((x): x is string => typeof x === 'string' && RE_TEN_DINH.test(x)).slice(0, 64) : []
    return { ds, tien: typeof j.tien === 'string' && RE_TIEN_D1.test(j.tien) ? j.tien : TIEN_TO_NGAN_D1, v: Number(j.v) || 1 }
  } catch { return { ds: [], tien: TIEN_TO_NGAN_D1, v: 0 } }
}

/** Băm SBD ⇒ chọn ngăn trung chuyển (ổn định, chia đều). */
function bamSbd(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

async function dsDinh(env: Env, ctx?: ExecutionContext): Promise<CauHinhDinh> {
  const now = Date.now()
  if (dinh && now - dinh.luc < HAN_DINH_MS) return dinh
  const doc = (dangDocDinh ??= env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_NGAN_DINH).first<{ gia_tri: string }>()
    .then((r) => {
      const c = docCauHinhDinh(r?.gia_tri)
      dinh = { ...c, luc: c.ds.length ? Date.now() : Date.now() - HAN_DINH_MS + 60_000 } // chưa bốc thăm xong ⇒ hỏi lại sau 1 phút
      // Bốc thăm phiên bản cũ ⇒ bốc lại ở nền (một lần / isolate, khoá D1 10 phút); trong lúc chờ vẫn dùng danh sách cũ.
      if (c.ds.length && c.v < BAN_BOC_THAM && ctx && !daThuChon && !env.TAT_NGAN_DINH) { daThuChon = true; ctx.waitUntil(chonNganDinhNeuCan(env).catch((e) => console.error('[ngan-dinh] bốc thăm lỗi:', e instanceof Error ? e.message : e))) }
      return c
    })
    .catch(() => { const c = dinh ?? { ds: [], tien: TIEN_TO_NGAN_D1, v: 0 }; dinh = { ...c, luc: Date.now() - HAN_DINH_MS + 60_000 }; return c }) // lỗi đọc ⇒ thử lại sau 1 phút
    .finally(() => { dangDocDinh = null }))
  if (dinh) { ctx?.waitUntil(doc); return dinh } // bản cũ dùng ngay
  return doc
}

/**
 * BỐC THĂM ngăn trung chuyển: `so` ngăn `dinh|i` (gợi ý apac) + `soKhong` ngăn `dinh|k|i` KHÔNG gợi ý (tạo cạnh nơi đang chạy — lệnh của em ở Việt Nam ⇒
 * trạm biên SIN / HKG, có thể sát D1 hơn hẳn vùng apac: máy thật 31/10 gợi ý apac chỉ ra NRT / KIX, tốt nhất 53 ms). Mỗi ngăn đo bốn vòng `SELECT 1`; giữ tối đa
 * 16 ngăn đo nhanh nhất (≤ max(8 ms, tốt nhất + 5 ms)) ⇒ ghi `cau_hinh.ngan_dinh`. Tìm được chỗ < 15 ms ⇒ tiền tố ngăn em `d2|` (mọi em sang ngăn mới sát D1);
 * không ⇒ giữ `d1|` (ngăn đang có giữ nguyên). Trả tóm tắt (không lộ gì của em).
 */
export async function chonNganDinh(env: Env, so = 32, soKhong = 16): Promise<{ ds: string[]; tot: number; theoTram: Record<string, number>; tien: string } | null> {
  const ns = env.NGAN_HS
  if (!ns) return null
  const kq: { ten: string; tram: string; ms: number; msBs: number | null }[] = []
  const ten = (i: number) => (i < so ? `dinh|${i}` : `dinh|k|${i - so}`)
  for (let i = 0; i < so + soKhong; i += 8) {
    const lo = await Promise.all(Array.from({ length: Math.min(8, so + soKhong - i) }, async (_, j) => {
      const t = ten(i + j)
      try {
        const r = await (i + j < so ? ns.get(ns.idFromName(t), { locationHint: 'apac' }) : ns.get(ns.idFromName(t))).fetch(new Request(`https://ngan${DUONG_DO_VI_TRI}`, { method: 'POST' }))
        const x = (await r.json()) as { tram?: unknown; ms?: unknown; msBs?: unknown }
        const ms = Array.isArray(x.ms) ? x.ms.map(Number).filter(Number.isFinite) : []
        const msBs = Array.isArray(x.msBs) ? x.msBs.map(Number).filter(Number.isFinite) : []
        return ms.length >= 2 ? { ten: t, tram: String(x.tram ?? '?'), ms: Math.min(...ms.slice(1)), msBs: msBs.length ? Math.min(...msBs) : null } : null
      } catch { return null }
    }))
    for (const x of lo) if (x) kq.push(x)
  }
  if (!kq.length) return null
  const tot = Math.min(...kq.map((x) => x.ms))
  const ds = kq.filter((x) => x.ms <= Math.max(8, tot + 5)).sort((a, b) => a.ms - b.ms).slice(0, 16).map((x) => x.ten)
  const theoTram: Record<string, number> = {}
  for (const x of kq) theoTram[x.tram] = (theoTram[x.tram] ?? 0) + 1
  const tien = tot < 15 ? 'd2|' : TIEN_TO_NGAN_D1
  const luc = new Date().toISOString()
  await env.DB.prepare('INSERT INTO cau_hinh(khoa, gia_tri, cap_nhat_luc) VALUES(?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
    .bind(KHOA_NGAN_DINH, JSON.stringify({ v: BAN_BOC_THAM, ds, tien, tot, theoTram, tramChon: [...new Set(kq.filter((x) => ds.includes(x.ten)).map((x) => x.tram))], banSao: banSaoTheoTram(kq) }), luc).run()
  dinh = { ds, tien, v: BAN_BOC_THAM, luc: Date.now() }
  console.log('[ngan-dinh] bốc thăm', JSON.stringify({ so: kq.length, chon: ds.length, tot, tien, theoTram }))
  return { ds, tot, theoTram, tien }
}

/** Đo bản sao theo trạm (v3): trạm → [ms tốt nhất tới bản chính, ms tốt nhất qua bản sao gần nhất]. */
function banSaoTheoTram(kq: readonly { tram: string; ms: number; msBs: number | null }[]): Record<string, [number, number | null]> {
  const ra: Record<string, [number, number | null]> = {}
  for (const x of kq) {
    const o = ra[x.tram]
    const bs = x.msBs
    if (!o) ra[x.tram] = [x.ms, bs]
    else ra[x.tram] = [Math.min(o[0], x.ms), bs === null ? o[1] : o[1] === null ? bs : Math.min(o[1], bs)]
  }
  return ra
}

/** Chưa có danh sách ⇒ bốc thăm ở nền, mỗi lúc một nơi (khoá `ngan_dinh_khoa` 10 phút trong D1). */
async function chonNganDinhNeuCan(env: Env): Promise<void> {
  const now = Date.now()
  const r = await env.DB.prepare(`INSERT INTO cau_hinh(khoa, gia_tri, cap_nhat_luc) VALUES(?1, ?2, ?3) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc
    WHERE CAST(cau_hinh.gia_tri AS INTEGER) < ?4`).bind(KHOA_NGAN_DINH_KHOA, String(now), new Date(now).toISOString(), now - HAN_DINH_MS).run()
  if (!(r.meta?.changes ?? 0)) return
  await chonNganDinh(env)
}

/**
 * Lệnh của học sinh ⇒ chuyển vào ngăn của em, trả `Response`. Không thuộc ngăn ⇒ `null` (dùng `req` gốc). Đã đọc thân mà không vào được ngăn ⇒ trả
 * `Request` mới cùng thân để đường cũ xử lý.
 */
export async function vaoNgan(req: Request, env: Env, ctx?: ExecutionContext): Promise<Response | Request | null> {
  const ns = env.NGAN_HS
  if (!ns || env.TAT_NGAN_HS || req.method !== 'POST' || req.headers.has(DAU_TRONG_NGAN)) return null
  const p = new URL(req.url).pathname
  if (!laDuongNgan(p)) return null
  const buf = await req.arrayBuffer()
  const lai = () => new Request(req.url, { method: 'POST', headers: req.headers, body: buf })
  let sbd: string | null = null
  try { sbd = sbdChonNgan(await docThan(buf, req)) } catch { /* thân hỏng ⇒ đường cũ báo lỗi JSON như trước */ }
  if (!sbd) return lai()
  const h = new Headers(req.headers)
  h.set(DAU_TRONG_NGAN, '1')
  h.set(DAU_SBD_NGAN, sbd)
  h.delete(DAU_CHUYEN_NGAN)
  try {
    const cd = env.TAT_NGAN_DINH ? null : await dsDinh(env, ctx)
    const dsD = cd?.ds ?? []
    let stub: ReturnType<typeof ns.get>
    const tenD1 = `${cd?.tien ?? TIEN_TO_NGAN_D1}${sbd}`
    if (dsD.length) {
      if (daTaoNgan.has(tenD1)) stub = ns.get(ns.idFromName(tenD1))
      else { stub = ns.get(ns.idFromName(dsD[bamSbd(sbd) % dsD.length]!)); h.set(DAU_CHUYEN_NGAN, tenD1) }
    } else {
      // 31/10 (đo x-ngan-do: ngăn tạo theo trạm của lượt gọi ĐẦU TIÊN — ngăn thử nằm ở IAD (Mỹ), mỗi vòng D1 233 ms ⇒ lưu một câu > 1 giây): ngăn LUÔN ở châu Á
      // (vùng APAC). Gợi ý vị trí chỉ có tác dụng lúc TẠO ngăn ⇒ đổi tên ngăn (`apac|`) để mọi em có ngăn mới đúng chỗ; ngăn cũ bỏ (kho sổ chỉ là đệm).
      stub = ns.get(ns.idFromName(`${TIEN_TO_NGAN}${sbd}`), { locationHint: 'apac' })
      if (ctx && !daThuChon && !env.TAT_NGAN_DINH) { daThuChon = true; ctx.waitUntil(chonNganDinhNeuCan(env).catch((e) => console.error('[ngan-dinh] bốc thăm lỗi:', e instanceof Error ? e.message : e))) }
    }
    const res = await stub.fetch(new Request(req.url, { method: 'POST', headers: h, body: buf }))
    if (dsD.length && res.headers.has('x-ngan')) { if (daTaoNgan.size >= 20_000) daTaoNgan.clear(); daTaoNgan.add(tenD1) }
    // Mẫu 1/20 lượt: trạm ngăn + ms một vòng D1 + ms xử lý (wrangler tail gom) — không SBD.
    if (Math.random() < 0.05) console.log('[ngan-do]', new URL(req.url).pathname, res.headers.get('x-ngan-do') ?? '-')
    return res
  } catch (e) {
    console.error('[ngan-hs] không vào được ngăn, chạy đường cũ:', e instanceof Error ? e.message : e)
    return lai()
  }
}
