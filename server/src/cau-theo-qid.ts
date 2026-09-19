// POST /hs/cau-theo-qid — nội dung câu để em LÀM đúng những câu mà việc `on_lai`/`on_thi` của kế hoạch ngày đã chọn (`viec[].chiTiet.qid`).
//
// LUẬT ĐỎ "đáp án không đi đường công khai": đường này công khai (như `/hs/ke-hoach-ngay`, SBD hoặc token), nên nó KHÔNG BAO GIỜ trả đáp án,
// lời giải, nhãn `reviewed`. Vì vậy nguồn là `game_v2_question` (chỉ mục game, cùng nguồn với game `start`) và đầu ra là DANH SÁCH TRƯỜNG
// ĐƯỢC PHÉP (whitelist), không phải `...spread`: trường lạ nào có trong JSON nguồn cũng không lọt ra. Lệnh rút câu khắc phục cũ
// (`cauKhacPhucGoi`) trả NGUYÊN tờ kho kèm `dap_an`/`loiGiai` — cố ý KHÔNG bắt chước hình dạng đó.
//
// Không cho dò kho: chỉ trả qid mà CHÍNH em này đã từng gặp (có dòng trong `su_kien_hoc`). Kế hoạch hôm nay chỉ chọn qid từ hồ sơ, mà hồ sơ
// dựng từ chính sổ ấy, nên "thuộc kế hoạch hôm nay" là tập con của "đã từng gặp". Câu của đề thi CHƯA công bố (`protectedQuestions`) bị loại,
// kể cả khi em đã gặp: người khác biết SBD của em ấy không được lấy đề thi ra sớm.
import type { Env } from './kieu'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { gameIdentity } from './game-v2-auth'
import { protectedQuestions } from './game-v2-bank'

export const TOI_DA_QID_MOT_LUOT = 20
export const DAI_QID_TOI_DA = 120
const KHONG_TIM_THAY = 'Không tìm thấy học sinh'

/**
 * "PHỤC VỤ ĐƯỢC" — MỘT ĐỊNH NGHĨA cho cả hai nơi (kế hoạch ngày chọn qid cho việc `on_lai`, và lệnh lấy đề này). Một qid phục vụ được khi:
 *   (1) có trong chỉ mục game của một tờ kho CÒN và đã lập chỉ mục đúng phiên bản (`game_v2_question` ⋈ `de_kho` ⋈ `game_v2_index`), và
 *   (2) không nằm trong đề thi đang bảo vệ (`protectedQuestions`, theo cả qid lẫn nhóm nội dung).
 * Kế hoạch mà chọn qid ngoài định nghĩa này thì việc "Ôn N câu" không bao giờ xong (19/09: 12121212 có 2/3 câu chết). Hai chỗ dùng chung
 * đoạn SQL dưới và `khongBiBaoVe` để không bao giờ lệch nhau.
 */
const TU_CHI_MUC_GAME = `FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de
       JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc
      WHERE COALESCE(d.da_xoa, 0) = 0 AND q.qid IN (SELECT value FROM json_each(?))`

export const khongBiBaoVe = (q: { qid: string; group: string }, baoVe: ReadonlySet<string>): boolean => !baoVe.has(q.qid) && !baoVe.has(q.group)

export interface PhucVuDuoc {
  /** qid phục vụ được. Nếu `kiemDuocBaoVe` = false thì chỉ mới qua (1). */
  duoc: Set<string>
  /** Không đọc được phạm vi đề đang bảo vệ (R2 lỗi): lệnh lấy đề đóng cửa, kế hoạch không lọc theo (2) để một lỗi tạm không làm trống việc ôn. */
  kiemDuocBaoVe: boolean
  /** Lý do loại, để đo: qid không có trong chỉ mục / qid bị đề bảo vệ. */
  khongCoChiMuc: string[]
  biBaoVe: string[]
}

/** Trong các `qids`, những qid PHỤC VỤ ĐƯỢC (không đọc nội dung, không cần R2 ngoài phạm vi bảo vệ đã có đệm). Không ném lỗi. */
export async function qidPhucVuDuoc(env: Env, qids: string[]): Promise<PhucVuDuoc> {
  const xin = [...new Set(qids.filter((q) => q !== ''))]
  const ra: PhucVuDuoc = { duoc: new Set(), kiemDuocBaoVe: true, khongCoChiMuc: [], biBaoVe: [] }
  if (xin.length === 0) return ra
  const nhom = new Map<string, string>()
  // Chia mỗi 800 qid một truy vấn: một tham số JSON nhưng không để chuỗi phình vô hạn khi cả lô 50 em có hàng nghìn câu tới hạn.
  for (let i = 0; i < xin.length; i += 800) {
    const rc = await env.DB.prepare(`SELECT q.qid, q.content_group ${TU_CHI_MUC_GAME}`).bind(JSON.stringify(xin.slice(i, i + 800))).all<{ qid: string; content_group: string }>()
    for (const x of rc.results ?? []) if (!nhom.has(String(x.qid))) nhom.set(String(x.qid), String(x.content_group))
  }
  ra.khongCoChiMuc = xin.filter((q) => !nhom.has(q))
  let baoVe: Set<string> | null = null
  try {
    baoVe = await protectedQuestions(env)
  } catch (e) {
    console.error('[phuc-vu] không kiểm được đề bảo vệ:', e instanceof Error ? e.message : e)
    ra.kiemDuocBaoVe = false
  }
  for (const [qid, group] of nhom) {
    if (baoVe && !khongBiBaoVe({ qid, group }, baoVe)) ra.biBaoVe.push(qid)
    else ra.duoc.add(qid)
  }
  return ra
}

/** Câu như máy em nhận: chỉ các trường này. KHÔNG có `correct`, `solution`, `reviewed`, `version`, `group`. */
export function cauCongKhai(q: PrivateQuestion) {
  return {
    qid: q.qid,
    maDe: q.maDe,
    phan: q.phan,
    text: q.text,
    choices: q.choices ?? [],
    ideas: q.ideas ?? [],
    table: q.table,
    thanCauImg: q.thanCauImg,
    imageDataUrl: q.imageDataUrl,
    choiceImgs: q.choiceImgs,
    ideaImgs: q.ideaImgs,
    // Ảnh của lời giải (`sau_loi_giai`) không được ra ngoài trước khi em nộp.
    hinhAnh: (q.hinhAnh ?? []).filter((h) => h.viTri !== 'sau_loi_giai'),
    dang: q.dang,
    tenDang: q.tenDang,
    mucDo: q.mucDo,
    sao: q.sao,
    kienThuc: q.kienThuc ?? [],
  }
}

/**
 * NHẶT câu CHO ĐÚNG EM NÀY (dùng chung với `/hs/on-lai/nop`, để "câu nộp được" và "câu xin được" là MỘT tập, không lệch nhau):
 * đúng 3 truy vấn D1 (em có thật + đã gặp; nội dung; đề bảo vệ), không R2. Trả câu RIÊNG (có đáp án) — NƠI GỌI phải tự lược sạch
 * (`cauCongKhai`) trước khi ra đường công khai. `loi` có giá trị thì KHÔNG có câu nào (SBD lạ, hoặc không kiểm được đề bảo vệ: đóng cửa).
 */
export async function layCauChoEm(env: Env, sbd: string, xin: string[]): Promise<{ loi?: string; cau: PrivateQuestion[]; khongCo: string[] }> {
  if (sbd.length > 40) return { loi: KHONG_TIM_THAY, cau: [], khongCo: xin }
  // Truy vấn 1: em có thật không, và trong các qid xin, em đã từng gặp những câu nào. (Em có thật = như `laHocSinhThat`.)
  const r = await env.DB.prepare(
    `SELECT CASE WHEN EXISTS (SELECT 1 FROM hoc_sinh WHERE sbd = ?) OR EXISTS (SELECT 1 FROM danh_sach WHERE sbd = ?) OR EXISTS (SELECT 1 FROM luot WHERE sbd = ?)
                 THEN 1 ELSE 0 END AS co,
            (SELECT json_group_array(qid) FROM (SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?)))) AS da_gap`,
  ).bind(sbd, sbd, sbd, sbd, JSON.stringify(xin)).first<{ co: number; da_gap: string | null }>()
  if (Number(r?.co) !== 1) return { loi: KHONG_TIM_THAY, cau: [], khongCo: xin }
  let daGap: string[] = []
  try {
    daGap = (JSON.parse(r?.da_gap ?? '[]') as unknown[]).filter((x): x is string => typeof x === 'string')
  } catch { /* coi như chưa gặp câu nào */ }
  const duoc = xin.filter((q) => daGap.includes(q))
  if (duoc.length === 0) return { cau: [], khongCo: xin }

  // Truy vấn 2: nội dung từ chỉ mục game.
  const rc = await env.DB.prepare(`SELECT q.json ${TU_CHI_MUC_GAME}`).bind(JSON.stringify(duoc)).all<{ json: string }>()
  const theoQid = new Map<string, PrivateQuestion>()
  for (const x of rc.results ?? []) {
    try {
      const q = JSON.parse(x.json) as PrivateQuestion
      if (q?.qid && !theoQid.has(q.qid)) theoQid.set(q.qid, q)
    } catch { /* dòng hỏng: bỏ */ }
  }
  if (theoQid.size === 0) return { cau: [], khongCo: xin }

  // Truy vấn 3: đề thi đang bảo vệ. Không kiểm được thì KHÔNG trả gì (đóng cửa), thay vì trả câu có thể là đề chưa công bố.
  let baoVe: Set<string>
  try {
    baoVe = await protectedQuestions(env)
  } catch {
    return { loi: 'Chưa kiểm tra xong phạm vi đề thi đang bảo vệ. Em thử lại sau.', cau: [], khongCo: xin }
  }
  const cau = xin.flatMap((qid) => {
    const q = theoQid.get(qid)
    return q && khongBiBaoVe(q, baoVe) ? [q] : []
  })
  const co = new Set(cau.map((c) => c.qid))
  return { cau, khongCo: xin.filter((q) => !co.has(q)) }
}

/** Dọn danh sách qid do máy em gửi: chỉ chữ, bỏ rỗng/trùng/quá dài, giữ thứ tự. */
export function donQid(ds: unknown[]): string[] {
  return [...new Set(ds.map((x) => (typeof x === 'string' ? x.trim() : '')).filter((x) => x !== '' && x.length <= DAI_QID_TOI_DA))]
}

/**
 * `{ token | sbd, qid: string[] (≤ 20) }` → `{ ok, cau: [câu công khai theo đúng thứ tự xin], khongCo: [qid xin mà không trả được] }`.
 * `khongCo` gộp mọi lý do (chưa từng gặp, không có trong chỉ mục, đề đang bảo vệ) để không lộ câu nào có trong kho.
 */
export async function hsCauTheoQid(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = b.token ? await gameIdentity(env, b) : String(b.sbd ?? '').trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  if (sbd.length > 40) return { ok: false, error: KHONG_TIM_THAY }
  if (!Array.isArray(b.qid)) return { ok: false, error: 'Thiếu danh sách câu (qid)' }
  if (b.qid.length > TOI_DA_QID_MOT_LUOT) return { ok: false, error: `Mỗi lần xin tối đa ${TOI_DA_QID_MOT_LUOT} câu` }
  const r = await layCauChoEm(env, sbd, donQid(b.qid))
  if (r.loi) return { ok: false, error: r.loi }
  return { ok: true, cau: r.cau.map(cauCongKhai), khongCo: r.khongCo }
}

/**
 * ĐO ĐỘ PHỦ "phục vụ được" trên dữ liệu THẬT (lệnh của thầy, chỉ đọc): trong các câu ĐANG TỚI HẠN ÔN của cả trường (`nam_kt_cau`), bao nhiêu qid và bao nhiêu cặp
 * (em, qid) mà `/hs/cau-theo-qid` không phục vụ được, vì sao (không có trong chỉ mục / bị đề thi bảo vệ), và bao nhiêu em bị ảnh hưởng.
 * Không trả SBD hay qid nào, chỉ SỐ ĐẾM.
 */
export async function docDoPhuPhucVu(env: Env, homNay: string): Promise<Record<string, unknown>> {
  const r = await env.DB.prepare(
    `SELECT sbd, qid FROM nam_kt_cau WHERE trang_thai IN ('moi_sai','dang_on','da_khac_phuc') AND can_day_lai = 0 AND moc_on_ke IS NOT NULL AND moc_on_ke <= ?`,
  ).bind(homNay).all<{ sbd: string; qid: string }>()
  const cap = (r.results ?? []).map((x) => ({ sbd: String(x.sbd), qid: String(x.qid) }))
  const pv = await qidPhucVuDuoc(env, cap.map((x) => x.qid))
  const chetChiMuc = new Set(pv.khongCoChiMuc)
  const chetBaoVe = new Set(pv.biBaoVe)
  const tongQid = new Set(cap.map((x) => x.qid)).size
  const theoEm = new Map<string, { tong: number; chet: number }>()
  let capChet = 0
  for (const x of cap) {
    const e = theoEm.get(x.sbd) ?? { tong: 0, chet: 0 }
    e.tong++
    if (!pv.duoc.has(x.qid)) { e.chet++; capChet++ }
    theoEm.set(x.sbd, e)
  }
  const pt = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0)
  return {
    ok: true,
    ngay: homNay,
    kiemDuocBaoVe: pv.kiemDuocBaoVe,
    qidToiHan: tongQid,
    qidPhucVuDuoc: pv.duoc.size,
    qidKhongCoChiMuc: chetChiMuc.size,
    qidBiDeBaoVe: chetBaoVe.size,
    tiLeQidKhongPhucVuPhanTram: pt(tongQid - pv.duoc.size, tongQid),
    capEmQid: cap.length,
    capEmQidKhongPhucVu: capChet,
    tiLeCapKhongPhucVuPhanTram: pt(capChet, cap.length),
    soEm: theoEm.size,
    soEmCoCauKhongPhucVu: [...theoEm.values()].filter((e) => e.chet > 0).length,
    soEmMatHetCauToiHan: [...theoEm.values()].filter((e) => e.tong > 0 && e.chet === e.tong).length,
  }
}
