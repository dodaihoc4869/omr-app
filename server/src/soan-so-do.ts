// MÁY SOẠN «LỜI GIẢI KIỂU SƠ ĐỒ CỦA THẦY ĐỖ ĐẠI HỌC» THEO LÔ (làn D, thầy chốt build 26/10: «thay luôn toàn bộ lời giải tính toán trong app
// bằng lời giải kiểu sơ đồ này của tôi»). Hợp đồng: src/lib/goi-y-cham/kieu.ts (`BanSoDo`). Đặc tả: docs/ban-ve-doc-de-2610/DAC-TA.md.
//
//   · `soanSoDoLo(env, thamSo)` — route quản trị `POST /quan-tri/soan-so-do-lo` (làn C đăng ký, cổng mã bí mật) gọi; workflow
//     .github/workflows/soan-so-do-2610.yml gọi lặp theo con trỏ.
//   · Chọn câu TÍNH TOÁN trong kho đang dùng (game_v2_question của tờ chưa xoá, chỉ mục đúng bản): Phần I / Phần III, đề có SỐ + ĐƠN VỊ,
//     không tự luận; Phần III đáp án phải là một số; Phần I phương án đúng phải có số. Phần II bỏ.
//   · Gọi Gemini (JSON) với lời dặn cố định server/src/soan-so-do-loi-dan.ts ⇒ kiểm khuôn ⇒ `kiemCong` (server/src/so-do-cong.ts, làn C).
//     TỰ SỬA (thầy 26/10): `lech` / `lo_dap_an` / JSON hỏng ⇒ thử lại tới 4 lượt (từ lượt 3 model mạnh), kèm lý do; còn lệch ⇒ vòng sửa `chiSuaLoi`.
//   · Ghi bảng CHỈ-THÊM `loi_giai_so_do` (`INSERT … ON CONFLICT(qid) DO UPDATE`), KHÔNG đụng `game_v2_question` / q.json. Bản `dat` đúng phiên
//     bản câu không bao giờ bị lượt sau ghi đè bằng kết quả kém hơn. Chỉ `dat` mới được hiện (luật đọc của làn C).
//   · TỰ SỬA ĐÁP ÁN KHO (thầy 26/10: «Nếu lệch đáp án tự động lấy đáp án bạn giải ko cần hỏi tôi điều gì»): câu cuối cùng vẫn lệch mà 2 lần giải MÙ
//     cùng ra một số khác kho ⇒ `suaDapAnKho` (sua-dap-an-kho.ts) đổi đáp án của đúng câu trong gói R2 (có nhật ký lùi `dap_an_kho_sua`, tự từ chối khi
//     Phần II / câu bảo vệ / ca thi mở / chặng KTCN đang làm) ⇒ soạn lại câu theo đáp án mới. Làm TUẦN TỰ sau mỗi đợt song song (các câu cùng tờ ghi
//     cùng một gói R2). Tắt bằng `tuSuaDapAn: false`.
//   · `thuKhong` ⇒ không ghi gì (kể cả không tạo bảng, không sửa kho), chỉ trả kết quả + bản soạn.
//   · Lô nhỏ, song song có giới hạn, ngân sách giờ mỗi lượt gọi; hết giờ ⇒ trả `conTro`, lượt sau tiếp đúng chỗ.
//   · Không chạy 19–24h giờ VN (giờ cao điểm, DAC-TA mục 6) trừ khi `choChayGioCaoDiem`.
import type { D1PreparedStatement, Env } from './kieu'
import type { BanSoDo, BuocTinh, HienTuong, KetQuaCong, NutSoDo, SoDo, ThuaSo } from '../../src/lib/goi-y-cham/kieu'
import { LY_DO_THIEU_SO_DO, docSo, kiemCong } from './so-do-cong'
import { suaDapAnKho } from './sua-dap-an-kho'
import { quaTram } from './tram-gemini'
import { docCauEmSai } from './hoc-lieu-may-soan'
import { laCauTuLuan, laMotSoPhanIII } from '../../src/lib/cau-tu-luan'
import { PHIEN_BAN_SO_DO, chuCauHoi, chuCauHoiMu, chuThuLai, chuThuLaiKhuon, chuThuLaiLo, chuThuLaiThieu, loiDanSoDo, type CauCanSoan } from './soan-so-do-loi-dan'

type Obj = Record<string, unknown>
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v)).trim()

// ---------------------------------------------------------------- bảng

/** Bảng CHỈ-THÊM (tự tạo lúc ghi lần đầu). Cột: xem báo cáo làn D — làn C đọc `ban_json` khi `ket = 'dat'` và `version` khớp câu đang phát. */
export const SQL_BANG_SO_DO: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS loi_giai_so_do (qid TEXT PRIMARY KEY, ma_de TEXT NOT NULL, version TEXT NOT NULL, phien_ban INTEGER NOT NULL,
    ban_json TEXT NOT NULL, cong TEXT NOT NULL, ly_do TEXT, gia_tri TEXT, so_lan INTEGER NOT NULL DEFAULT 1, model TEXT,
    token_vao INTEGER NOT NULL DEFAULT 0, token_ra INTEGER NOT NULL DEFAULT 0, tao_luc TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL,
    dap_an_may TEXT, nghi_dap_an INTEGER NOT NULL DEFAULT 0)`,
  'CREATE INDEX IF NOT EXISTS loi_giai_so_do_cong ON loi_giai_so_do(cong)',
]

const SQL_GHI = `INSERT INTO loi_giai_so_do (qid, ma_de, version, phien_ban, ban_json, cong, ly_do, gia_tri, so_lan, model, token_vao, token_ra, tao_luc, cap_nhat_luc, dap_an_may, nghi_dap_an)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  ON CONFLICT(qid) DO UPDATE SET ma_de = excluded.ma_de, version = excluded.version, phien_ban = excluded.phien_ban, ban_json = excluded.ban_json,
    cong = excluded.cong, ly_do = excluded.ly_do, gia_tri = excluded.gia_tri, so_lan = excluded.so_lan, model = excluded.model,
    token_vao = excluded.token_vao, token_ra = excluded.token_ra, cap_nhat_luc = excluded.cap_nhat_luc, dap_an_may = excluded.dap_an_may, nghi_dap_an = excluded.nghi_dap_an
  WHERE excluded.cong = 'dat' OR loi_giai_so_do.cong <> 'dat' OR loi_giai_so_do.version <> excluded.version`

// ---------------------------------------------------------------- chọn câu

/** Số liền ngay một đơn vị (M chỉ là đơn vị khi đứng sát sau số: «0,5M», «1 M»; «kim loại M», «Giá trị của m» không tính). */
const RE_SO_DON_VI = /\d\s*(?:gam|g|kg|mg|tấn|mol|mmol|lít|L|l|mL|ml|m3|m³|cm3|cm³|dm3|dm³|M|%)(?![\p{L}\d])/u
const boThe = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')

export interface CauKho extends CauCanSoan { maDe: string; version: string; tuLuan?: boolean; reviewed?: boolean }

/** Câu tính toán đáng soạn sơ đồ: Phần I / III, đề có số + đơn vị, không tự luận; Phần III đáp án là số; Phần I phương án đúng có số. */
export function laCauTinhToan(q: CauKho): boolean {
  if (q.phan !== 'I' && q.phan !== 'III') return false
  if (q.tuLuan === true || laCauTuLuan(q)) return false
  if (!RE_SO_DON_VI.test(boThe(q.text))) return false
  if (q.phan === 'III') return laMotSoPhanIII(q.correct)
  const i = 'ABCD'.indexOf(q.correct.trim().toUpperCase())
  return i >= 0 && /\d/.test(boThe(str(q.choices[i])))
}

const SQL_CAU = `SELECT q.ma_de, q.qid, q.version, q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de
  JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc WHERE COALESCE(d.da_xoa, 0) = 0`

function cauTuDong(x: Obj): CauKho | null {
  try {
    const j = JSON.parse(str(x.json)) as Obj
    const phan = str(j.phan)
    if (phan !== 'I' && phan !== 'II' && phan !== 'III') return null
    return {
      qid: str(x.qid), maDe: str(x.ma_de), version: str(x.version), phan, text: str(j.text),
      choices: Array.isArray(j.choices) ? j.choices.map((c) => String(c ?? '')) : [], correct: str(j.correct), solution: j.solution ?? null,
      tuLuan: j.tuLuan === true, reviewed: j.reviewed !== false,
    }
  } catch { return null }
}

/** Đọc câu kho đang dùng theo danh sách qid (giữ thứ tự danh sách). */
async function docCauTheoQid(env: Env, qids: readonly string[]): Promise<Map<string, CauKho>> {
  const ra = new Map<string, CauKho>()
  for (let i = 0; i < qids.length; i += 90) {
    const r = await env.DB.prepare(`${SQL_CAU} AND q.qid IN (SELECT value FROM json_each(?))`).bind(JSON.stringify(qids.slice(i, i + 90))).all<Obj>()
    for (const x of r.results ?? []) { const c = cauTuDong(x); if (c && !ra.has(c.qid)) ra.set(c.qid, c) }
  }
  return ra
}

/** Trạng thái đã soạn (bảng chưa có ⇒ rỗng; KHÔNG tạo bảng). */
async function docDaSoan(env: Env, qids: readonly string[]): Promise<Map<string, { version: string; phienBan: number; ket: string }>> {
  const ra = new Map<string, { version: string; phienBan: number; ket: string }>()
  for (let i = 0; i < qids.length; i += 90) {
    const r = await env.DB.prepare('SELECT qid, version, phien_ban, cong AS ket FROM loi_giai_so_do WHERE qid IN (SELECT value FROM json_each(?))')
      .bind(JSON.stringify(qids.slice(i, i + 90))).all<Obj>().catch(() => ({ results: [] as Obj[] }))
    for (const x of r.results ?? []) ra.set(str(x.qid), { version: str(x.version), phienBan: Number(x.phien_ban) || 0, ket: str(x.ket) })
  }
  return ra
}

// ---------------------------------------------------------------- mô hình

export type KetQuaMoHinh = { ok: true; chu: string; model: string; vao: number; ra: number } | { ok: false; loi: string; http?: number }
export type LuotHoi = { vai: 'user' | 'model'; chu: string }
export type GoiMoHinh = (yc: { heThong: string; luot: readonly LuotHoi[]; model: string }) => Promise<KetQuaMoHinh>

/** Mặc định Flash (không Lite): chuỗi thừa số phải nhân ra đúng đáp án — cần suy luận số chắc hơn bản Lite của Hỏi thầy. Ghi đè bằng `thamSo.model`. */
export const MODEL_MAC_DINH = 'gemini-flash-latest'
/** 404/410 (tên model không còn) ⇒ thử lần lượt. `gemini-3.5-flash-lite` đã chạy thật ở Hỏi thầy 13/10. */
const MODEL_DU_PHONG: readonly string[] = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest']
/** TỰ SỬA CÂU LỆCH (thầy 26/10: «Tự động sửa mọi câu lệch, tôi ko phải làm gì»): từ lượt thứ 3 của một câu dùng model mạnh hơn (404 ⇒ lùi về chuỗi dự phòng). */
export const MODEL_MANH = 'gemini-pro-latest'
/** Số lượt tối đa cho MỘT câu: lượt sau đọc lý do lệch / lộ / hỏng khuôn của lượt trước. */
export const SO_LUOT_MOT_CAU = 4
/** Câu vòng sửa soạn lại: lệch / lộ, và câu tính bị trả THIẾU sơ đồ / bước tính (27/10). Chuỗi hằng, không chèn dữ liệu ngoài. */
export const SQL_CAN_SUA = `cong IN ('lech', 'lo_dap_an') OR (cong = 'khong_kiem_duoc' AND ly_do = '${LY_DO_THIEU_SO_DO}')`
const RE_CHAN_VI_TRI = /location is not supported/i
const ngu = (ms: number) => new Promise((ok) => setTimeout(ok, ms))

/** Bộ gọi Gemini RIÊNG cho lô (không dùng chung `goiMotModel` của Hỏi thầy: bộ ấy có gọi kép 8 s, trần 25 s và nhớ «lược đồ cũ» toàn isolate
 *  — một lần Google từ chối lược đồ ở lô sẽ đổi khuôn Hỏi thầy của học sinh thật trong 10 phút). Dùng chung trạm vượt chặn vị trí `quaTram`. */
export function taoGoiGeminiLo(env: Env, hanMs = 60_000): GoiMoHinh {
  const key = str(env.GEMINI_API_KEY)
  const tram = env.TRAM_GEMINI ? quaTram(env.TRAM_GEMINI) : null
  const motLan = async (model: string, body: string): Promise<KetQuaMoHinh> => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
    const ac = new AbortController()
    const hen = setTimeout(() => ac.abort(), hanMs)
    try {
      const init: RequestInit = { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body, signal: ac.signal }
      let r = await fetch(url, init)
      if (tram && r.status === 400 && RE_CHAN_VI_TRI.test(await r.clone().text().catch(() => ''))) r = await tram(url, init)
      const j = (await r.json().catch(() => null)) as Obj | null
      if (!r.ok) return { ok: false, http: r.status, loi: `HTTP ${r.status} ${str((j?.error as Obj | undefined)?.message).slice(0, 160)}` }
      const ung = (j?.candidates as Obj[] | undefined)?.[0]
      const chu = (((ung?.content as Obj | undefined)?.parts as Obj[] | undefined) ?? []).filter((p) => p.thought !== true).map((p) => str(p.text)).join('').trim()
      const u = (j?.usageMetadata ?? {}) as Obj
      if (!chu) return { ok: false, loi: `rỗng finishReason=${str(ung?.finishReason)}` }
      return { ok: true, chu, model, vao: Number(u.promptTokenCount) || 0, ra: (Number(u.candidatesTokenCount) || 0) + (Number(u.thoughtsTokenCount) || 0) }
    } catch (e) {
      return { ok: false, loi: ac.signal.aborted ? `quá ${Math.round(hanMs / 1000)} s` : e instanceof Error ? e.message.slice(0, 160) : 'lỗi mạng' }
    } finally { clearTimeout(hen) }
  }
  return async ({ heThong, luot, model }) => {
    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: heThong }] },
      contents: luot.map((l) => ({ role: l.vai, parts: [{ text: l.chu }] })),
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: 'application/json' },
    })
    let kq: KetQuaMoHinh = { ok: false, loi: 'chưa gọi' }
    for (const m of [model, ...MODEL_DU_PHONG.filter((x) => x !== model)]) {
      kq = await motLan(m, body)
      if (!kq.ok && (kq.http === 429 || kq.http === 503)) { await ngu(3000); kq = await motLan(m, body) }
      if (kq.ok || (kq.http !== 404 && kq.http !== 410)) return kq
    }
    return kq
  }
}

// ---------------------------------------------------------------- kiểm khuôn

const chuoiKhongRong = (v: unknown, tran = 600): string | null => (typeof v === 'string' || typeof v === 'number') && str(v) ? str(v).slice(0, tran) : null

/** JSON mô hình ⇒ `BanSoDo` đúng khuôn (máy chủ tự gắn qid/phienBan), hoặc lý do hỏng. Bỏ `thiNghiem` (mã mẫu thuộc thư viện giao diện). */
export function docBanSoDo(chu: string, qid: string): { ban: BanSoDo } | { loi: string } {
  let o: unknown
  try { o = JSON.parse(chu.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')) } catch { return { loi: 'JSON không đọc được' } }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return { loi: 'không phải đối tượng JSON' }
  const j = o as Obj
  const deNoiGi = chuoiKhongRong(j.deNoiGi)
  if (!deNoiGi) return { loi: 'thiếu deNoiGi' }
  if (!Array.isArray(j.buoc) || j.buoc.length < 1 || j.buoc.length > 3) return { loi: 'buoc phải có 1–3 bước' }
  const buoc: BuocTinh[] = []
  for (const b of j.buoc as unknown[]) {
    const x = (b ?? {}) as Obj
    const ten = chuoiKhongRong(x.ten, 120)
    if (!ten || !Array.isArray(x.thuaSo) || !x.thuaSo.length || x.thuaSo.length > 16) return { loi: 'bước thiếu tên hoặc thừa số' }
    const thuaSo: ThuaSo[] = []
    for (const t of x.thuaSo as unknown[]) {
      const y = (t ?? {}) as Obj
      const so = chuoiKhongRong(y.so, 60), nghia = chuoiKhongRong(y.nghia, 300)
      if (!so || !nghia) return { loi: 'thừa số thiếu so hoặc nghia' }
      const denDay = chuoiKhongRong(y.denDay, 200)
      thuaSo.push(denDay ? { so, nghia, denDay } : { so, nghia })
    }
    const kq = chuoiKhongRong(x.ketQua, 40), dv = chuoiKhongRong(x.donVi, 20)
    buoc.push({ ten, thuaSo, ...(kq ? { ketQua: kq } : {}), ...(dv ? { donVi: dv } : {}) })
  }
  let soDo: SoDo | undefined
  if (j.soDo !== undefined && j.soDo !== null) {
    const s = j.soDo as Obj
    if (!Array.isArray(s.nut) || s.nut.length < 2 || s.nut.length > 3) return { loi: 'soDo phải có 2–3 nút' }
    if (!Array.isArray(s.muiTen) || s.muiTen.length !== s.nut.length - 1) return { loi: 'muiTen phải ít hơn nut đúng 1' }
    if (s.chieu !== 'xuoi' && s.chieu !== 'nguoc') return { loi: 'chieu phải là xuoi/nguoc' }
    const nut: NutSoDo[] = []
    for (const n of s.nut as unknown[]) {
      const x = (n ?? {}) as Obj
      const chat = chuoiKhongRong(x.chat, 60)
      if (!chat || !Array.isArray(x.soLieu)) return { loi: 'nút thiếu chat hoặc soLieu' }
      const tong = chuoiKhongRong(x.tong, 80)
      nut.push({ ...(tong ? { tong } : {}), chat, soLieu: x.soLieu.map((v) => str(v).slice(0, 60)).filter(Boolean).slice(0, 6) })
    }
    const muiTen = (s.muiTen as unknown[]).map((m) => {
      const H = Number((m as Obj | null)?.H)
      return (m as Obj | null)?.H !== undefined && Number.isFinite(H) && H > 0 && H <= 100 ? { H } : {}
    })
    soDo = { nut, muiTen, chieu: s.chieu }
  }
  let hienTuong: HienTuong | undefined
  const ht = j.hienTuong as Obj | undefined
  if (ht && Array.isArray(ht.giaiThich)) {
    const g = ht.giaiThich.map((v) => str(v).slice(0, 300)).filter(Boolean).slice(0, 4)
    if (g.length) hienTuong = { giaiThich: g }
  }
  const chiaKhoa = chuoiKhongRong(j.chiaKhoa), cauTuHoi = chuoiKhongRong(j.cauTuHoi), ketQua = chuoiKhongRong(j.ketQua, 40)
  return { ban: {
    qid, phienBan: PHIEN_BAN_SO_DO, deNoiGi, ...(soDo ? { soDo } : {}), buoc, ...(hienTuong ? { hienTuong } : {}),
    ...(chiaKhoa ? { chiaKhoa } : {}), ...(cauTuHoi ? { cauTuHoi } : {}), ...(ketQua ? { ketQua } : {}),
  } }
}

// ---------------------------------------------------------------- lô

export interface ThamSoSoDo { qids?: string[]; gioiHan?: number; chiCauSaiNhieu?: boolean; thuKhong?: boolean; /** mặc định true (lệnh thầy 26/10); false ⇒ chỉ đánh dấu nghi */ tuSuaDapAn?: boolean }
interface ThamSoDayDu extends ThamSoSoDo {
  /** con trỏ lượt trước trả (`conTro`) */
  conTro?: string
  /** soạn lại cả câu đã soạn cùng bản (bản `dat` vẫn không bị hạ) */
  lamLai?: boolean
  model?: string
  songSong?: number
  nganSachGiay?: number
  soEmToiThieu?: number
  choChayGioCaoDiem?: boolean
  /** VÒNG SỬA: chỉ soạn lại các câu đang `lech` / `lo_dap_an` trong bảng (tự bật `lamLai`) */
  chiSuaLoi?: boolean
  /** chỉ quét một phần (vd 'I' để soạn lại Phần I sau khi sửa cổng đọc phương án 26/10) */
  chiPhan?: 'I' | 'III'
}
type KetCuoi = KetQuaCong | 'hong' | 'loi_goi'
export interface DongKetQua {
  qid: string; ket: KetCuoi; lyDo?: string; giaTri?: string; lanThu: number; model?: string; dapAnMay?: string; nghiDapAn?: boolean
  /** đã đổi đáp án kho theo số máy giải (id dòng `dap_an_kho_sua` để lùi) */ daSuaDapAn?: boolean; maSuaDapAn?: string
  /** nghi nhưng KHÔNG sửa: lý do (mã từ chối của suaDapAnKho / không chọn được đáp án mới) */ khongSua?: string
}
export type KiemCong = (ban: BanSoDo, ctx: { phan: 'I' | 'II' | 'III'; dapAn: string; luaChon: readonly string[] }) =>
  { ket: KetQuaCong; lyDo?: string; giaTri?: unknown } | Promise<{ ket: KetQuaCong; lyDo?: string; giaTri?: unknown }>
/** Phụ thuộc thay được (test): mô hình giả, cổng giả, đồng hồ. */
export interface PhuSoDo { goiMoHinh?: GoiMoHinh; kiemCong?: KiemCong; bayGio?: () => number }

const tra = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } })
const kep = (v: unknown, md: number, min: number, max: number) => { const n = Number(v); return v !== undefined && v !== null && v !== '' && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : md }
const RE_QID = /^[A-Za-z0-9][A-Za-z0-9._~:-]{0,120}$/
export const SO_EM_SAI_TOI_THIEU = 5
const TRAN_QUET = 3000
const TRANG_QUET = 300

function docThamSo(t: unknown): ThamSoDayDu | string {
  if (t !== undefined && t !== null && (typeof t !== 'object' || Array.isArray(t))) return 'thamSo phải là đối tượng'
  const o = (t ?? {}) as Obj
  let qids: string[] | undefined
  if (o.qids !== undefined) {
    if (!Array.isArray(o.qids)) return 'qids phải là mảng'
    qids = [...new Set(o.qids.map(str).filter(Boolean))]
    if (qids.some((q) => !RE_QID.test(q))) return 'qid không hợp lệ'
    if (qids.length > 2000) return 'tối đa 2000 qid'
  }
  const model = str(o.model)
  if (model && !/^[a-z0-9][a-z0-9.\-]{2,60}$/i.test(model)) return 'model không hợp lệ'
  return {
    ...(qids ? { qids } : {}), gioiHan: kep(o.gioiHan, 10, 1, 50), chiCauSaiNhieu: o.chiCauSaiNhieu === true, thuKhong: o.thuKhong === true,
    conTro: str(o.conTro), lamLai: o.lamLai === true, model: model || MODEL_MAC_DINH, songSong: kep(o.songSong, 4, 1, 8),
    nganSachGiay: kep(o.nganSachGiay, 40, 5, 110), soEmToiThieu: kep(o.soEmToiThieu, SO_EM_SAI_TOI_THIEU, 1, 1000), choChayGioCaoDiem: o.choChayGioCaoDiem === true,
    chiSuaLoi: o.chiSuaLoi === true, ...(o.chiPhan === 'I' || o.chiPhan === 'III' ? { chiPhan: o.chiPhan } : {}), ...(o.chiSuaLoi === true ? { lamLai: true } : {}), tuSuaDapAn: o.tuSuaDapAn !== false,
  }
}

/** 19:00–23:59 giờ VN (UTC+7). */
export const laGioCaoDiem = (ms: number) => (new Date(ms).getUTCHours() + 7) % 24 >= 19

type MucHang = { vt: string; q: CauKho | null; boQua?: string }

/** Gom hàng việc cho lượt này: tối đa `gioiHan` câu cần soạn, kèm các câu bỏ qua phía trước (để con trỏ đi qua chúng). */
async function gomHang(env: Env, ts: ThamSoDayDu, het: () => boolean): Promise<{ hang: MucHang[]; nguonHet: boolean }> {
  const hang: MucHang[] = []
  let canLam = 0
  const xet = (q: CauKho | null, vt: string, daSoan: Map<string, { version: string; phienBan: number; ket: string }>) => {
    if (!q) { hang.push({ vt, q: null, boQua: 'không có trong kho đang dùng' }); return }
    if (!laCauTinhToan(q)) { hang.push({ vt, q: null, boQua: 'không phải câu tính toán' }); return }
    if (!q.reviewed) { hang.push({ vt, q: null, boQua: 'câu chưa duyệt đáp án' }); return }
    const d = daSoan.get(q.qid)
    // Đã soạn cùng phiên bản câu + cùng bản lời dặn ⇒ bỏ (trừ `lamLai`). Bản lời dặn mới ⇒ soạn lại; bản `dat` vẫn không bị hạ (WHERE của SQL_GHI).
    if (d && d.version === q.version && d.phienBan >= PHIEN_BAN_SO_DO && !ts.lamLai) { hang.push({ vt, q: null, boQua: `đã soạn (${d.ket})` }); return }
    hang.push({ vt, q }); canLam++
  }
  // Nguồn DANH SÁCH: qid thầy chỉ định, hoặc câu nhiều em sai (≥ soEmToiThieu em, nhiều trước).
  let ds: string[] | null = ts.qids ?? null
  if (!ds && ts.chiSuaLoi) {
    const r = await env.DB.prepare(`SELECT qid FROM loi_giai_so_do WHERE ${SQL_CAN_SUA} ORDER BY qid`).all<Obj>().catch(() => ({ results: [] as Obj[] }))
    ds = (r.results ?? []).map((x) => str(x.qid)).filter(Boolean)
  }
  if (!ds && ts.chiCauSaiNhieu) {
    const sai = await docCauEmSai(env)
    ds = [...sai.entries()].filter(([, s]) => s.size >= (ts.soEmToiThieu ?? SO_EM_SAI_TOI_THIEU))
      .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0])).map(([q]) => q)
  }
  if (ds) {
    let i = /^#\d+$/.test(ts.conTro ?? '') ? Number(ts.conTro!.slice(1)) : 0
    while (i < ds.length && canLam < (ts.gioiHan ?? 10) && !het()) {
      const phan = ds.slice(i, i + 60)
      const [cau, daSoan] = await Promise.all([docCauTheoQid(env, phan), docDaSoan(env, phan)])
      for (const qid of phan) {
        if (canLam >= (ts.gioiHan ?? 10)) break
        i++
        xet(cau.get(qid) ?? null, `#${i}`, daSoan)
      }
    }
    return { hang, nguonHet: i >= ds.length }
  }
  // Nguồn QUÉT KHO theo khoá chính (ma_de, qid); con trỏ «ma_de|qid».
  const [m0, q0] = (ts.conTro ?? '').includes('|') ? (ts.conTro ?? '').split('|') as [string, string] : ['', '']
  let maDe = m0, qid = q0, daQuet = 0, nguonHet = false
  while (canLam < (ts.gioiHan ?? 10) && daQuet < TRAN_QUET && !het()) {
    const r = await env.DB.prepare(`${SQL_CAU} AND json_extract(q.json, '$.phan') IN (${ts.chiPhan ? `'${ts.chiPhan}'` : `'I', 'III'`}) AND (q.ma_de > ? OR (q.ma_de = ? AND q.qid > ?))
      ORDER BY q.ma_de, q.qid LIMIT ${TRANG_QUET}`).bind(maDe, maDe, qid).all<Obj>()
    const dong = r.results ?? []
    if (!dong.length) { nguonHet = true; break }
    const cau = dong.map(cauTuDong)
    const daSoan = await docDaSoan(env, cau.filter((c): c is CauKho => !!c && laCauTinhToan(c)).map((c) => c.qid))
    let k = 0
    for (; k < dong.length && canLam < (ts.gioiHan ?? 10); k++) {
      maDe = str(dong[k]!.ma_de); qid = str(dong[k]!.qid)
      xet(cau[k] ?? null, `${maDe}|${qid}`, daSoan)
    }
    daQuet += k
    if (dong.length < TRANG_QUET && k >= dong.length) { nguonHet = true; break }
  }
  return { hang, nguonHet }
}

/** Đơn vị viết theo một con số trong phương án (như cổng: «10,2 gam», «0,5M», «25%»). */
const DON_VI_PA = /^[\p{L}%°³²/·.\s]{0,12}$/u
const gan = (a: number, b: number) => Math.abs(a - b) <= 0.01 * Math.max(Math.abs(a), Math.abs(b), 1e-12)

/**
 * Đáp án kho MỚI từ số máy giải (`dapAnMay`, dấu phẩy thập phân). Không chọn được ⇒ null (không sửa).
 *   · Phần III: làm tròn theo số chữ số thập phân của đáp án kho cũ (đáp án cũ phải là số thường «76,8» / «70»), dấu phẩy; làm tròn lệch > 1% ⇒ null.
 *   · Phần I: đúng MỘT phương án có giá trị số lệch ≤ 1% so với số máy; 0 hoặc ≥ 2 phương án khớp ⇒ null.
 *   · Trùng đáp án cũ ⇒ null.
 */
export function dapAnMoiTuMay(q: Pick<CauKho, 'phan' | 'correct' | 'choices'>, dapAnMay: string): string | null {
  const v = Number(str(dapAnMay).replace(',', '.'))
  if (!Number.isFinite(v)) return null
  if (q.phan === 'III') {
    const cu = q.correct.trim()
    const m = /^-?\d+(?:[.,](\d+))?$/.exec(cu)
    if (!m) return null
    const moi = v.toFixed(m[1]?.length ?? 0).replace('.', ',').replace(/^-(0(?:,0+)?)$/, '$1')
    if (!gan(Number(moi.replace(',', '.')), v) || moi === cu.replace('.', ',')) return null
    return moi
  }
  if (q.phan !== 'I') return null
  const khop: string[] = []
  q.choices.slice(0, 4).forEach((c, i) => {
    const d = docSo(boThe(str(c)).replace(/\$/g, '').trim())
    if (d && DON_VI_PA.test(d.donVi) && gan(d.v, v)) khop.push('ABCD'[i]!)
  })
  if (khop.length !== 1 || khop[0] === q.correct.trim().toUpperCase()) return null
  return khop[0]!
}

/** Soạn một câu: gọi mô hình ⇒ kiểm khuôn ⇒ cổng. TỰ SỬA (thầy 26/10): `lech` / `lo_dap_an` / JSON hỏng ⇒ thử lại tới SO_LUOT_MOT_CAU lượt,
 *  mỗi lượt kèm lý do của lượt trước; từ lượt 3 dùng MODEL_MANH. Giữ bản tốt nhất: `dat` > `khong_kiem_duoc` > `lo_dap_an` > `lech`. */
async function soanMotCau(q: CauKho, ts: ThamSoDayDu, goi: GoiMoHinh, cong: KiemCong, heThong: string):
  Promise<{ dong: DongKetQua; ban?: BanSoDo; token: { vao: number; ra: number } }> {
  const token = { vao: 0, ra: 0 }
  const luot: LuotHoi[] = [{ vai: 'user', chu: chuCauHoi(q) }]
  const ctx = { phan: q.phan, dapAn: q.correct, luaChon: q.choices }
  const HANG: Record<string, number> = { dat: 3, khong_kiem_duoc: 2, lo_dap_an: 1, lech: 0 }
  // Bản THIẾU sơ đồ / bước tính (27/10) xếp dưới cả `lech`: vô dụng làm lời giải; `lech` còn được giải mù + vòng sửa.
  const thieuSoDo = (b: { ket: string; lyDo?: string }) => b.ket === 'khong_kiem_duoc' && b.lyDo === LY_DO_THIEU_SO_DO
  const hang = (b: { ket: string; lyDo?: string }) => (thieuSoDo(b) ? -1 : HANG[b.ket] ?? -1)
  let tot: { ban: BanSoDo; ket: KetQuaCong; lyDo?: string; giaTri?: string; model: string; lan: number } | null = null
  let loiCuoi: DongKetQua | null = null
  for (let lan = 1; lan <= SO_LUOT_MOT_CAU; lan++) {
    const model = lan >= 3 ? MODEL_MANH : ts.model ?? MODEL_MAC_DINH
    const kq = await goi({ heThong, luot: [...luot], model })
    if (!kq.ok) { loiCuoi = { qid: q.qid, ket: 'loi_goi', lyDo: kq.loi, lanThu: lan }; if (lan >= 2) break; continue }
    token.vao += kq.vao; token.ra += kq.ra
    const doc = docBanSoDo(kq.chu, q.qid)
    if ('loi' in doc) {
      loiCuoi = { qid: q.qid, ket: 'hong', lyDo: doc.loi, lanThu: lan, model: kq.model }
      luot.push({ vai: 'model', chu: kq.chu.slice(0, 6000) }, { vai: 'user', chu: chuThuLaiKhuon(doc.loi) })
      continue
    }
    const c = await cong(doc.ban, ctx)
    const giaTri = c.giaTri === undefined || c.giaTri === null ? undefined : String(c.giaTri).slice(0, 40)
    const ban = { ban: doc.ban, ket: c.ket, ...(c.lyDo ? { lyDo: str(c.lyDo).slice(0, 300) } : {}), ...(giaTri ? { giaTri } : {}), model: kq.model, lan }
    if (!tot || hang(ban) > hang(tot)) tot = ban
    if (c.ket === 'dat' || (c.ket === 'khong_kiem_duoc' && !thieuSoDo(ban))) break
    luot.push({ vai: 'model', chu: kq.chu }, {
      vai: 'user',
      chu: thieuSoDo(ban) ? chuThuLaiThieu()
        : c.ket === 'lo_dap_an' ? chuThuLaiLo(ban.lyDo ?? 'phần trước nộp chứa đáp án') : chuThuLai(ban.lyDo ?? 'tích các thừa số không ra đáp án kho', giaTri),
    })
  }
  if (!tot) return { dong: loiCuoi ?? { qid: q.qid, ket: 'loi_goi', lyDo: 'không gọi được mô hình', lanThu: 1 }, token }
  // GIẢI MÙ (thầy 26/10: «Nếu lệch đáp án tự động lấy đáp án bạn giải»): còn `lech` ⇒ giải lại 2 lần MÙ (không đưa đáp án / lời giải kho), 2 model khác nhau.
  //   · lần mù nào ĐẠT cổng (ra đúng đáp án kho) ⇒ lấy luôn bản đó làm lời giải;
  //   · cả hai cùng ra một số (lệch ≤ 1%) và khác kho ⇒ đánh dấu `nghi_dap_an` + `dap_an_may`. Hàm này KHÔNG ghi kho: `soanSoDoLo` sửa đáp án kho
  //     TUẦN TỰ sau đợt (suaDapAnKho — chỉ đúng câu ấy, không đụng khoá đáp án ca, không chấm lại lượt cũ) rồi soạn lại theo đáp án mới.
  let nghi: { dapAnMay: string } | null = null
  if (tot.ket === 'lech') {
    const giaTriMu: number[] = []
    for (const model of [ts.model ?? MODEL_MAC_DINH, MODEL_MANH]) {
      const kq = await goi({ heThong, luot: [{ vai: 'user', chu: chuCauHoiMu(q) }], model })
      if (!kq.ok) continue
      token.vao += kq.vao; token.ra += kq.ra
      const doc = docBanSoDo(kq.chu, q.qid)
      if ('loi' in doc) continue
      const c = await cong(doc.ban, ctx)
      if (c.ket === 'dat') { tot = { ban: doc.ban, ket: 'dat', model: kq.model, lan: tot.lan + 1 }; break }
      const v = Number(String(c.giaTri ?? '').replace(',', '.'))
      if (c.ket === 'lech' && Number.isFinite(v)) giaTriMu.push(v)
    }
    if (tot.ket === 'lech' && giaTriMu.length === 2) {
      const [a, b] = giaTriMu as [number, number]
      if (Math.abs(a - b) <= 0.01 * Math.max(Math.abs(a), Math.abs(b), 1e-12)) nghi = { dapAnMay: String(Number(a.toPrecision(6))).replace('.', ',') }
    }
  }
  return { dong: { qid: q.qid, ...(nghi ? { nghiDapAn: true, dapAnMay: nghi.dapAnMay } : {}), ket: tot.ket, ...(tot.lyDo ? { lyDo: tot.lyDo } : {}), ...(tot.giaTri ? { giaTri: tot.giaTri } : {}), lanThu: tot.lan, model: tot.model }, ban: tot.ban, token }
}

/**
 * Route quản trị `POST /quan-tri/soan-so-do-lo`.
 * `thamSo`: `{ qids?, gioiHan? (mỗi lượt, mặc định 10, ≤ 50), chiCauSaiNhieu?, thuKhong?, conTro?, lamLai?, model?, songSong?, nganSachGiay?,
 *   soEmToiThieu?, choChayGioCaoDiem? }`.
 * Trả `{ ok, xong, conTro, dem, ketQua[], token, ms, thuKhong, ban?[] (chỉ khi thuKhong) }`.
 */
export async function soanSoDoLo(env: Env, thamSo: unknown, phu: PhuSoDo = {}): Promise<Response> {
  const ts = docThamSo(thamSo)
  if (typeof ts === 'string') return tra({ ok: false, error: ts }, 400)
  const bayGio = phu.bayGio ?? Date.now
  const batDau = bayGio()
  if (laGioCaoDiem(batDau) && !ts.choChayGioCaoDiem) return tra({ ok: false, ma: 'gio_cao_diem', error: 'Không soạn lô trong 19–24h giờ VN (giờ cao điểm). Chạy lại ngoài giờ ấy.' }, 409)
  if (!phu.goiMoHinh && !str(env.GEMINI_API_KEY)) return tra({ ok: false, error: 'Máy chủ chưa có khoá GEMINI_API_KEY.' }, 503)
  const goi = phu.goiMoHinh ?? taoGoiGeminiLo(env)
  // Cổng làn C đọc phương án theo khoá A–D (`luaChon['B']`); câu kho mang mảng ⇒ đổi mảng thành {A,B,C,D}. Trước 26/10 truyền thẳng mảng ⇒ cổng không thấy
  // phương án đúng ⇒ MỌI câu Phần I ra `khong_kiem_duoc` («Phương án đúng không phải số»), không bao giờ `dat` / `lech`.
  const cong: KiemCong = phu.kiemCong ?? ((ban, ctx) => kiemCong(ban, {
    phan: ctx.phan, dapAn: ctx.dapAn, luaChon: Object.fromEntries(ctx.luaChon.slice(0, 4).map((s, i) => ['ABCD'[i]!, String(s ?? '')])),
  }))
  const nganSach = (ts.nganSachGiay ?? 40) * 1000
  const het = () => bayGio() - batDau >= nganSach

  const { hang, nguonHet } = await gomHang(env, ts, het)
  const dem: Record<KetCuoi | 'bo_qua' | 'nghi_dap_an' | 'da_sua_dap_an', number> = { dat: 0, lech: 0, khong_kiem_duoc: 0, lo_dap_an: 0, hong: 0, loi_goi: 0, bo_qua: 0, nghi_dap_an: 0, da_sua_dap_an: 0 }
  const ketQua: DongKetQua[] = []
  const banThu: { qid: string; ket: KetCuoi; ban: BanSoDo }[] = []
  const token = { vao: 0, ra: 0 }
  const heThong = loiDanSoDo()
  let daTaoBang = false
  let conTro = ts.conTro ?? ''
  let i = 0
  while (i < hang.length) {
    if (i > 0 && het()) break
    const dot: CauKho[] = []
    let j = i
    for (; j < hang.length && dot.length < (ts.songSong ?? 4); j++) {
      const m = hang[j]!
      if (m.q) dot.push(m.q); else dem.bo_qua++
    }
    const xong = await Promise.all(dot.map((q) => soanMotCau(q, ts, goi, cong, heThong)))
    // TỰ SỬA ĐÁP ÁN KHO — TUẦN TỰ (các câu cùng tờ ghi chung một gói R2): nghi ⇒ chọn đáp án mới ⇒ suaDapAnKho ⇒ soạn lại câu theo đáp án mới (version mới).
    if (!ts.thuKhong && ts.tuSuaDapAn !== false) {
      const daSua: { k: number; id: string }[] = []
      for (const [k, r] of xong.entries()) {
        if (!r.dong.nghiDapAn || !r.dong.dapAnMay) continue
        const q = dot[k]!
        const moi = dapAnMoiTuMay(q, r.dong.dapAnMay)
        if (!moi) { r.dong.khongSua = 'khong_chon_duoc'; continue }
        let kq: Awaited<ReturnType<typeof suaDapAnKho>>
        try {
          kq = await suaDapAnKho(env, { maDe: q.maDe, qid: q.qid, dapAnMoi: moi, nguon: 'soan-so-do', lyDo: `2 lần giải mù cùng ra ${r.dong.dapAnMay} (kho ${q.correct})` }, bayGio())
        } catch (e) { r.dong.khongSua = `loi: ${(e instanceof Error ? e.message : String(e)).slice(0, 80)}`; continue }
        if (!kq.ok) { r.dong.khongSua = kq.ma; continue }
        dot[k] = { ...q, correct: kq.moi, version: kq.versionMoi }
        daSua.push({ k, id: kq.id })
        dem.da_sua_dap_an++
      }
      // Soạn lại SONG SONG (chỉ ghi R2 mới phải tuần tự) — giữ lượt gọi ngắn, kho đã ghi xong trước khi gọi mô hình.
      const lai = await Promise.all(daSua.map(({ k }) => soanMotCau(dot[k]!, ts, goi, cong, heThong)))
      for (const [i, { k, id }] of daSua.entries()) {
        const r = xong[k]!, l = lai[i]!
        xong[k] = { dong: { ...l.dong, daSuaDapAn: true, maSuaDapAn: id }, ...(l.ban ? { ban: l.ban } : {}), token: { vao: r.token.vao + l.token.vao, ra: r.token.ra + l.token.ra } }
      }
    }
    const ghi: D1PreparedStatement[] = []
    const luc = new Date(bayGio()).toISOString()
    for (const [k, r] of xong.entries()) {
      const q = dot[k]!
      dem[r.dong.ket]++
      if (r.dong.nghiDapAn || r.dong.daSuaDapAn) dem.nghi_dap_an++ // câu đã sửa kho vẫn tính là một câu nghi (dòng ghi bảng thì không còn cờ nghi)
      ketQua.push(r.dong)
      token.vao += r.token.vao; token.ra += r.token.ra
      if (!r.ban || r.dong.ket === 'hong' || r.dong.ket === 'loi_goi') continue
      if (ts.thuKhong) { banThu.push({ qid: q.qid, ket: r.dong.ket, ban: r.ban }); continue }
      ghi.push(env.DB.prepare(SQL_GHI).bind(q.qid, q.maDe, q.version, PHIEN_BAN_SO_DO, JSON.stringify(r.ban), r.dong.ket, r.dong.lyDo ?? null,
        r.dong.giaTri ?? null, r.dong.lanThu, r.dong.model ?? null, r.token.vao, r.token.ra, luc, luc, r.dong.dapAnMay ?? null, r.dong.nghiDapAn ? 1 : 0))
    }
    if (ghi.length) {
      if (!daTaoBang) { await env.DB.batch(SQL_BANG_SO_DO.map((s) => env.DB.prepare(s))); daTaoBang = true }
      await env.DB.batch(ghi)
    }
    conTro = hang[j - 1]!.vt
    i = j
  }
  const xongHet = nguonHet && i >= hang.length
  return tra({
    ok: true, xong: xongHet, conTro: xongHet ? '' : conTro, daXuLy: ketQua.length, dem, ketQua, token, ms: bayGio() - batDau,
    thuKhong: !!ts.thuKhong, model: ts.model, phienBan: PHIEN_BAN_SO_DO, ...(ts.thuKhong ? { ban: banThu } : {}),
  })
}
