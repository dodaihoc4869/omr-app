// TỰ SỬA ĐÁP ÁN KHO (thầy 26/10, nguyên văn: «Nếu lệch đáp án tự động lấy đáp án bạn giải ko cần hỏi tôi điều gì» · «Tôi bảo sửa luôn theo đáp án mà.
// Bạn thực thi ko hỏi lại»). Máy soạn lời giải sơ đồ (soan-so-do.ts) giải MÙ 2 lần cùng ra một số khác kho ⇒ gọi `suaDapAnKho` đổi đáp án của ĐÚNG câu ấy.
//
//   · NGUỒN đáp án là gói R2 `de_kho.r2_khoa` (mặc định `kho/{maDe}.json`). Hai khuôn gói, tìm câu ĐÚNG như `normalizeBank` (game-v2-bank.ts) sinh qid:
//       - khuôn kho `cau[]` (dayDeKho / kiemGoiDe): qid = `c.qid` (chuỗi khác rỗng) hoặc `{ma_de của gói}-{phan}-{so}`; đáp án ở `dap_an`;
//       - khuôn cũ `phanI/phanII/phanIII`: qid = `c.id ?? c.qid`; đáp án ở `correct`.
//     Đúng MỘT câu khớp mới sửa. Sau khi đổi, chạy lại `normalizeBank` trên gói mới để chắc câu còn đó, đáp án mới đúng là thứ máy chấm đọc.
//   · Ghi dòng nhật ký CHỈ-THÊM `dap_an_kho_sua` (cũ ⇒ mới) TRƯỚC khi ghi R2 ⇒ mọi lần đổi R2 đều lùi được (`luiDapAnKho`).
//   · Ghi R2 (cùng định dạng `JSON.stringify` như dayDeKho), đặt `de_kho.cap_nhat_luc` = bây giờ ⇒ chỉ mục game (`game_v2_question`) dựng lại (`lapChiMucTo`
//     qua `dongBoCacTo`, gọi ngay để tờ không vắng khỏi các phép nối `source_version = cap_nhat_luc`); máy học sinh tải lại tờ vì `capNhatLuc` đổi.
//   · KHÔNG đụng khoá đáp án các ca (R2 `key/{maCa}.json`), KHÔNG chấm lại lượt cũ. Lượt đang mở chứa câu tự bị chặn bằng mã `cau_doi` (version câu đổi).
//   · TỪ CHỐI (không ghi gì): Phần II; câu trong tập bảo vệ (`protectedQuestions`: ca chưa công bố / đang làm / BTVN chấm điểm — so cả qid lẫn nhóm nội dung);
//     đang có ca THI mở; một chặng kiểm tra cá nhân đang làm có chứa câu; không tìm thấy câu. Không kiểm được (lỗi đọc) ⇒ cũng từ chối (đóng cửa).
import type { Env } from './kieu'
import { dongBoCacTo, normalizeBank, protectedQuestions, xoaDemSync } from './game-v2-bank'
import { laMotSoPhanIII } from '../../src/lib/cau-tu-luan'
import { ngoaiKenhSo } from '../../src/lib/so-o-tra-loi-ngan'

type Obj = Record<string, unknown>
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v))
const laObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)

/** Bảng CHỈ-THÊM (cùng câu với server/migration-2610-dap-an-kho-sua.sql), tự tạo lúc ghi lần đầu. */
export const SQL_BANG_SUA: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS dap_an_kho_sua (id TEXT PRIMARY KEY, ma_de TEXT NOT NULL, qid TEXT NOT NULL, phan TEXT NOT NULL, cu TEXT NOT NULL, moi TEXT NOT NULL,
    ly_do TEXT, nguon TEXT NOT NULL, luc TEXT NOT NULL, da_lui INTEGER NOT NULL DEFAULT 0)`,
  'CREATE INDEX IF NOT EXISTS dap_an_kho_sua_qid ON dap_an_kho_sua(qid)',
]

/** Ca đo tải (do-tai.ts): không phải ca thi thật (cùng luật `CA_KHONG_TINH_HOAN` của reset-hoa2.ts). */
const CA_DO_TAI = 'DOTAI'

export type MaTuChoi =
  | 'thieu_tham_so' | 'khong_co_de' | 'khong_co_goi' | 'goi_hong' | 'khong_thay_cau' | 'trung_qid' | 'phan_ii' | 'dap_an_khong_hop_le'
  | 'trung_dap_an_cu' | 'ca_thi_mo' | 'cau_bao_ve' | 'ktcn_dang_lam' | 'khong_kiem_duoc' | 'xung_dot_ghi' | 'loi_ghi'
  | 'khong_co_ban_sua' | 'da_lui' | 'dap_an_da_doi'
export type TuChoi = { ok: false; ma: MaTuChoi; error: string }
export type DaSua = { ok: true; id: string; maDe: string; qid: string; phan: 'I' | 'III'; cu: string; moi: string; versionMoi: string }

const tuChoi = (ma: MaTuChoi, error: string): TuChoi => ({ ok: false, ma, error })

// ---------------------------------------------------------------- tìm câu trong gói

type ViTri = { phan: string; truong: 'dap_an' | 'correct'; doi: (goi: Obj, giaTri: string) => Obj; cu: string }

/** Mọi chỗ trong gói có qid này — đúng cách `normalizeBank` sinh qid (khuôn `cau[]` qua parseKhoDeJson/buildTeacherSourceFromKhoDe, khuôn cũ `c.id ?? c.qid`). */
export function timCauTrongGoi(goi: Obj, qid: string): ViTri[] {
  const ra: ViTri[] = []
  if (Array.isArray(goi.cau)) {
    const maTrongGoi = String(goi.ma_de)
    goi.cau.forEach((c, i) => {
      if (!laObj(c)) return
      const phan = str(c.phan)
      if (phan !== 'I' && phan !== 'II' && phan !== 'III') return
      const q = (typeof c.qid === 'string' && c.qid) || `${maTrongGoi}-${phan}-${str(c.so)}`
      if (q !== qid) return
      ra.push({
        phan, truong: 'dap_an', cu: typeof c.dap_an === 'string' ? c.dap_an.trim() : laObj(c.dap_an) ? JSON.stringify(c.dap_an) : str(c.dap_an).trim(),
        doi: (g, v) => ({ ...g, cau: (g.cau as unknown[]).map((x, j) => (j === i ? { ...(x as Obj), dap_an: v } : x)) }),
      })
    })
    return ra
  }
  for (const phan of ['I', 'II', 'III'] as const) {
    const ds = goi[`phan${phan}`]
    if (!Array.isArray(ds)) continue
    ds.forEach((c, i) => {
      if (!laObj(c) || str(c.id ?? c.qid) !== qid) return
      ra.push({
        phan, truong: 'correct', cu: Array.isArray(c.correct) ? c.correct.join('') : str(c.correct).trim(),
        doi: (g, v) => ({ ...g, [`phan${phan}`]: (g[`phan${phan}`] as unknown[]).map((x, j) => (j === i ? { ...(x as Obj), correct: v } : x)) }),
      })
    })
  }
  return ra
}

// ---------------------------------------------------------------- cổng an toàn

/** Có ca THI đang mở? Chỉ `loai = 'thi'` (như coCaDangMo): BTVN mở hằng tuần, câu BTVN chấm điểm đã nằm trong `protectedQuestions`. */
async function coCaThiMo(env: Env): Promise<string | null> {
  const r = await env.DB.prepare("SELECT ma_ca FROM ca WHERE trang_thai = 'mo' AND COALESCE(loai, 'thi') = 'thi' AND ma_ca <> ? LIMIT 1").bind(CA_DO_TAI).first<Obj>()
  return r ? str(r.ma_ca) : null
}

/** Một chặng kiểm tra cá nhân ĐANG LÀM (bài chưa nộp, chặng chưa chốt, đã mở, còn hạn) có chứa câu? Bảng chưa có ⇒ không. */
async function coChangKtcnChuaCau(env: Env, qid: string, nowMs: number): Promise<boolean> {
  try {
    const r = await env.DB.prepare(`SELECT 1 AS co FROM kiem_tra_ca_nhan k JOIN kiem_tra_ca_nhan_chang c ON c.bai_id = k.id
      WHERE k.nop_luc IS NULL AND c.chot_luc IS NULL AND c.bat_dau <= ? AND c.han > ?
      AND EXISTS (SELECT 1 FROM json_each(k.json, '$.chang[' || c.stt || '].qids') j WHERE j.value = ?) LIMIT 1`).bind(nowMs, nowMs, qid).first<Obj>()
    return !!r
  } catch (e) {
    if (/no such table/i.test(e instanceof Error ? e.message : String(e))) return false
    throw e
  }
}

/** Ba cổng chạy song song; lỗi đọc ⇒ từ chối (đóng cửa). */
async function kiemCong(env: Env, qid: string, nhom: string, nowMs: number): Promise<TuChoi | null> {
  let kq: [string | null, Set<string>, boolean]
  try {
    kq = await Promise.all([coCaThiMo(env), protectedQuestions(env), coChangKtcnChuaCau(env, qid, nowMs)])
  } catch (e) {
    return tuChoi('khong_kiem_duoc', `Không kiểm được ca / câu bảo vệ (${(e instanceof Error ? e.message : String(e)).slice(0, 120)}) — không sửa cho chắc.`)
  }
  const [caMo, baoVe, ktcn] = kq
  if (caMo) return tuChoi('ca_thi_mo', `Đang có ca thi mở (${caMo}) — sửa đáp án kho sau khi đóng ca.`)
  if (baoVe.has(qid) || (nhom && baoVe.has(nhom))) return tuChoi('cau_bao_ve', 'Câu đang được bảo vệ (ca chưa công bố / đang làm / BTVN chấm điểm).')
  if (ktcn) return tuChoi('ktcn_dang_lam', 'Có em đang làm chặng kiểm tra cá nhân chứa câu này.')
  return null
}

// ---------------------------------------------------------------- lõi

type ChuanBi = { ok: true; khoa: string; etag?: string; goiMoi: Obj; phan: 'I' | 'III'; cu: string; moi: string; versionMoi: string; capNhatCu: string }

/** Đọc de_kho + gói, tìm đúng một câu, dựng gói mới, kiểm lại bằng normalizeBank, chạy ba cổng. Không ghi gì. */
async function chuanBi(env: Env, maDe: string, qid: string, dapAnMoi: string, nowMs: number, kiemDang: boolean): Promise<ChuanBi | TuChoi> {
  const d = await env.DB.prepare('SELECT ma_de, r2_khoa, cap_nhat_luc, COALESCE(da_xoa, 0) AS da_xoa FROM de_kho WHERE ma_de = ?').bind(maDe).first<Obj>()
  if (!d || Number(d.da_xoa) !== 0) return tuChoi('khong_co_de', `Không có tờ ${maDe} trong kho (hoặc đã xoá).`)
  const khoa = str(d.r2_khoa) || `kho/${maDe}.json`
  const vat = await env.DE.get(khoa)
  if (!vat) return tuChoi('khong_co_goi', `Không có gói ${khoa} trên R2.`)
  const etag = (vat as unknown as { etag?: string }).etag
  let goi: unknown
  try { goi = JSON.parse(await new Response(vat.body).text()) } catch { return tuChoi('goi_hong', `Gói ${khoa} không đọc được JSON.`) }
  if (!laObj(goi)) return tuChoi('goi_hong', `Gói ${khoa} không phải đối tượng JSON.`)
  const vt = timCauTrongGoi(goi, qid)
  if (!vt.length) return tuChoi('khong_thay_cau', `Không thấy câu ${qid} trong gói ${khoa}.`)
  if (vt.length > 1) return tuChoi('trung_qid', `Gói ${khoa} có ${vt.length} câu cùng qid ${qid} — không sửa.`)
  const c = vt[0]!
  if (c.phan === 'II') return tuChoi('phan_ii', 'Phần II không tự sửa đáp án.')
  const phan = c.phan as 'I' | 'III'
  const moi = phan === 'I' ? dapAnMoi.trim().toUpperCase() : dapAnMoi.trim()
  if (kiemDang) {
    if (phan === 'I' && !/^[ABCD]$/.test(moi)) return tuChoi('dap_an_khong_hop_le', 'Đáp án Phần I phải là A, B, C hoặc D.')
    if (phan === 'III' && (!laMotSoPhanIII(moi) || ngoaiKenhSo({ phan: 'III', correct: moi }))) return tuChoi('dap_an_khong_hop_le', 'Đáp án Phần III phải là một số gõ được trên bàn phím số.')
  } else if (!moi) return tuChoi('dap_an_khong_hop_le', 'Đáp án rỗng.')
  if (moi === c.cu) return tuChoi('trung_dap_an_cu', 'Đáp án mới trùng đáp án đang có.')
  const goiMoi = c.doi(goi, moi)
  // Kiểm lại bằng ĐÚNG bộ đọc của game: câu còn đó, cùng phần, máy chấm đọc ra đúng đáp án mới. Lấy luôn nhóm nội dung (cổng bảo vệ) + version mới.
  let q: Awaited<ReturnType<typeof normalizeBank>>[number] | undefined
  try { q = (await normalizeBank(goiMoi, maDe)).find((x) => x.qid === qid) } catch (e) {
    return tuChoi('goi_hong', `Gói sau khi sửa không qua bộ đọc kho (${(e instanceof Error ? e.message : String(e)).slice(0, 120)}).`)
  }
  if (!q || q.phan !== phan || q.correct.trim() !== moi) return tuChoi('goi_hong', 'Gói sau khi sửa không cho ra đúng câu / đáp án mới.')
  const chan = await kiemCong(env, qid, q.group, nowMs)
  if (chan) return chan
  return { ok: true, khoa, ...(etag ? { etag } : {}), goiMoi, phan, cu: c.cu, moi, versionMoi: q.version, capNhatCu: str(d.cap_nhat_luc) }
}

/** Ghi R2 (có điều kiện etag khi R2 thật trả etag: tờ vừa được đẩy lại giữa chừng ⇒ không ghi đè) ⇒ đặt `cap_nhat_luc` mới ⇒ dựng lại chỉ mục tờ. */
async function ghiGoi(env: Env, maDe: string, cb: ChuanBi, nowMs: number): Promise<TuChoi | null> {
  let r: unknown
  try {
    const put = env.DE.put.bind(env.DE) as (k: string, v: string, o?: unknown) => Promise<unknown>
    r = await put(cb.khoa, JSON.stringify(cb.goiMoi), cb.etag ? { onlyIf: { etagMatches: cb.etag } } : undefined)
  } catch (e) {
    return tuChoi('loi_ghi', `Ghi R2 lỗi (${(e instanceof Error ? e.message : String(e)).slice(0, 120)}).`)
  }
  if (r === null) return tuChoi('xung_dot_ghi', 'Gói vừa đổi trong lúc sửa — không ghi đè, lượt sau thử lại.')
  let luc = new Date(nowMs).toISOString()
  if (luc === cb.capNhatCu) luc = new Date(nowMs + 1).toISOString()
  await env.DB.prepare('UPDATE de_kho SET cap_nhat_luc = ? WHERE ma_de = ?').bind(luc, maDe).run()
  xoaDemSync()
  try { await dongBoCacTo(env, [maDe]) } catch { /* cron / lượt sync sau tự dựng lại */ }
  return null
}

/**
 * Đổi đáp án kho của MỘT câu (`maDe`, `qid`) thành `dapAnMoi`. Trả `{ ok: true, id, cu, moi, versionMoi, … }` hoặc `{ ok: false, ma, error }` (không ghi gì).
 * `id` = dòng `dap_an_kho_sua` để lùi (`luiDapAnKho`).
 */
export async function suaDapAnKho(env: Env, tham: { maDe: string; qid: string; dapAnMoi: string; lyDo?: string; nguon: string }, nowMs = Date.now()): Promise<DaSua | TuChoi> {
  const maDe = str(tham.maDe).trim(), qid = str(tham.qid).trim(), nguon = str(tham.nguon).trim()
  if (!maDe || !qid || !str(tham.dapAnMoi).trim() || !nguon) return tuChoi('thieu_tham_so', 'Thiếu maDe / qid / dapAnMoi / nguon.')
  if (!env.DE) return tuChoi('khong_co_goi', 'Chưa nối R2.')
  const cb = await chuanBi(env, maDe, qid, str(tham.dapAnMoi), nowMs, true)
  if (!cb.ok) return cb
  const ok = cb
  const id = crypto.randomUUID()
  await env.DB.batch(SQL_BANG_SUA.map((s) => env.DB.prepare(s)))
  await env.DB.prepare('INSERT INTO dap_an_kho_sua (id, ma_de, qid, phan, cu, moi, ly_do, nguon, luc, da_lui) VALUES (?,?,?,?,?,?,?,?,?,0)')
    .bind(id, maDe, qid, ok.phan, ok.cu, ok.moi, tham.lyDo ? str(tham.lyDo).slice(0, 500) : null, nguon.slice(0, 60), new Date(nowMs).toISOString()).run()
  const loi = await ghiGoi(env, maDe, ok, nowMs)
  if (loi) {
    // R2 không đổi ⇒ dòng nhật ký coi như đã lùi (không bao giờ «lùi» một lần sửa chưa từng có hiệu lực).
    await env.DB.prepare("UPDATE dap_an_kho_sua SET da_lui = 1, ly_do = COALESCE(ly_do, '') || ' [không áp dụng: ' || ? || ']' WHERE id = ?").bind(loi.ma, id).run()
    return loi
  }
  return { ok: true, id, maDe, qid, phan: ok.phan, cu: ok.cu, moi: ok.moi, versionMoi: ok.versionMoi }
}

/**
 * LÙI một lần sửa (route quản trị `POST /quan-tri/lui-dap-an-kho {id}`): đáp án hiện tại của câu phải ĐÚNG là `moi` của lần sửa ấy (chưa ai sửa / đẩy lại tờ),
 * cùng ba cổng an toàn như lúc sửa. Đánh dấu `da_lui = 1` (một lần) rồi ghi lại `cu` vào gói.
 */
export async function luiDapAnKho(env: Env, id: string, nowMs = Date.now()): Promise<{ ok: true; id: string; maDe: string; qid: string; versionMoi: string } | TuChoi> {
  const ma = str(id).trim()
  if (!ma) return tuChoi('thieu_tham_so', 'Thiếu id.')
  if (!env.DE) return tuChoi('khong_co_goi', 'Chưa nối R2.')
  let dong: Obj | null
  try { dong = await env.DB.prepare('SELECT * FROM dap_an_kho_sua WHERE id = ?').bind(ma).first<Obj>() } catch { dong = null }
  if (!dong) return tuChoi('khong_co_ban_sua', 'Không có lần sửa này.')
  if (Number(dong.da_lui) !== 0) return tuChoi('da_lui', 'Lần sửa này đã lùi rồi.')
  const maDe = str(dong.ma_de), qid = str(dong.qid)
  const cb = await chuanBi(env, maDe, qid, str(dong.cu), nowMs, false)
  if (!cb.ok) return cb.ma === 'trung_dap_an_cu' ? tuChoi('dap_an_da_doi', 'Đáp án kho đã là đáp án cũ.') : cb
  const ok = cb
  if (ok.cu !== str(dong.moi)) return tuChoi('dap_an_da_doi', 'Đáp án kho đã đổi sau lần sửa này (sửa khác / đẩy lại tờ) — không lùi đè.')
  const gianh = await env.DB.prepare('UPDATE dap_an_kho_sua SET da_lui = 1 WHERE id = ? AND da_lui = 0').bind(ma).run()
  if (!Number(gianh.meta?.changes ?? 0)) return tuChoi('da_lui', 'Lần sửa này vừa được lùi.')
  const loi = await ghiGoi(env, maDe, ok, nowMs)
  if (loi) { await env.DB.prepare('UPDATE dap_an_kho_sua SET da_lui = 0 WHERE id = ?').bind(ma).run(); return loi }
  return { ok: true, id: ma, maDe, qid, versionMoi: ok.versionMoi }
}
