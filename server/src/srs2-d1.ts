// THUẬT TOÁN 2.0 — LỚP D1 (đọc chiến dịch, sổ sự kiện; chốt kế hoạch ngày; số liệu Sảnh; Rương Bát Linh).
// Lõi thuần ở `srs2-loi.ts`. Công tắc `cau_hinh.game_hoa_2` (mặc định TẮT ⇒ mọi đường cũ giữ nguyên):
//   {"bat":true}                         ⇒ toàn trung tâm
//   {"bat":true,"lop":["12A1"]}          ⇒ chỉ các lớp này
//   {"bat":true,"sbd":["12001","12002"]} ⇒ chỉ các em này (chạy thử)
import type { Env } from './kieu'
import {
  lapKeHoachNgay, tranHuyetChienTheo, phatLaiCau, canGoiY, moDuocRuong, tiLeChienDich, ngayThanhThaoSomNhat, soNgayConLai,
  gopThongKeDang, tinhHangTheoDang,
  type CauSrs, type HangEm, type TuyChonKeHoach, type HoSoDangTho, type LanLam, type TrangThaiCau, type Phan,
} from './srs2-loi'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { jsonLaTuLuan } from './cam-tu-luan'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
const GIO_VN_MS = 7 * 3_600_000
export const ngayVnCua = (ms: number): string => new Date(ms + GIO_VN_MS).toISOString().slice(0, 10)
const parseMang = (v: unknown): string[] => {
  try {
    const a = JSON.parse(str(v) || '[]') as unknown
    return Array.isArray(a) ? a.map(String).filter(Boolean) : []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------- công tắc
export interface CoHoa2 { bat: boolean; lop: string[]; sbd: string[] }
export const KHOA_CO_HOA2 = 'game_hoa_2'
export function docCoHoa2Tu(giaTri: unknown): CoHoa2 {
  try {
    const o = typeof giaTri === 'string' ? (JSON.parse(giaTri) as Row) : ((giaTri ?? {}) as Row)
    return { bat: o.bat === true || o.bat === 1 || o.bat === '1', lop: parseMang(JSON.stringify(o.lop ?? [])), sbd: parseMang(JSON.stringify(o.sbd ?? [])) }
  } catch {
    return { bat: false, lop: [], sbd: [] }
  }
}
export async function docCoHoa2(env: Env): Promise<CoHoa2> {
  const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_CO_HOA2).first<{ gia_tri: string }>().catch(() => null)
  return docCoHoa2Tu(r?.gia_tri)
}
/** Em này đang ở chế độ Game Hóa 2.0? Lỗi đọc ⇒ `false` (đường cũ). */
export async function cheDo2(env: Env, sbd: string): Promise<boolean> {
  const co = await docCoHoa2(env)
  if (!co.bat) return false
  if (co.sbd.includes(sbd)) return true
  if (!co.lop.length && !co.sbd.length) return true
  if (!co.lop.length) return false
  const r = await env.DB.prepare('SELECT lop FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<{ lop: string }>().catch(() => null)
  return !!r && co.lop.includes(str(r.lop))
}

// ---------------------------------------------------------------- chiến dịch
export interface ChienDich {
  id: string
  ten: string
  lop: string | null
  sbd: string[]
  maDe: string[]
  qids: string[]
  hanNop: string
  theLucNgay: number
  huyetChien: boolean
  maCa: string | null
  taoLuc: string
  trangThai: 'dang_chay' | 'da_dong' | 'da_huy'
  /** NGÀY BẮT ĐẦU (thầy 28/09, `YYYY-MM-DD` giờ VN). Không đặt ⇒ ngày tạo (hành vi cũ). */
  batDau: string
  /**
   * MỐC BẮT ĐẦU (ISO) = max(`tao_luc`, 00:00 VN của ngày bắt đầu) — thay `taoLuc` ở MỌI chỗ tính (số ngày, sức chứa, lần làm được tính,
   * nhịp lớp, thống kê). Không đặt ngày bắt đầu ⇒ đúng bằng `taoLuc`.
   */
  mocBatDau: string
}
/** 00:00 giờ VN của một ngày `YYYY-MM-DD`, dạng ISO (UTC) để so chuỗi với `tao_luc`/`luc`. */
export const dauNgayVn = (ngay: string): string => new Date(Date.parse(`${ngay}T00:00:00Z`) - GIO_VN_MS).toISOString()
const NGAY_RE = /^\d{4}-\d{2}-\d{2}$/
/** Ngày bắt đầu + mốc bắt đầu từ `tao_luc` và `bat_dau` (có thể vắng). */
export function batDauCua(taoLuc: string, batDau: unknown): { batDau: string; mocBatDau: string } {
  const ms = Date.parse(taoLuc)
  const ngayTao = Number.isFinite(ms) ? ngayVnCua(ms) : taoLuc.slice(0, 10)
  const bd = str(batDau)
  if (!NGAY_RE.test(bd) || bd <= ngayTao) return { batDau: ngayTao, mocBatDau: taoLuc }
  const moc = dauNgayVn(bd)
  return { batDau: bd, mocBatDau: moc > taoLuc ? moc : taoLuc }
}
export const docChienDichTuDong = (r: Row): ChienDich => ({
  ...batDauCua(str(r.tao_luc), r.bat_dau),
  id: str(r.id), ten: str(r.ten), lop: r.lop == null ? null : str(r.lop), sbd: parseMang(r.sbd_json), maDe: parseMang(r.ma_de_json), qids: parseMang(r.qid_json),
  hanNop: str(r.han_nop), theLucNgay: Number(r.the_luc_ngay) || 40, huyetChien: Number(r.huyet_chien ?? 1) !== 0, maCa: r.ma_ca == null ? null : str(r.ma_ca),
  taoLuc: str(r.tao_luc), trangThai: (['dang_chay', 'da_dong', 'da_huy'].includes(str(r.trang_thai)) ? str(r.trang_thai) : 'dang_chay') as ChienDich['trangThai'],
})

// ---------------------------------------------------------------- ngày bắt đầu (thầy 28/09)
/** Bảng phụ tạo lúc chạy (CI không chạy migration; KHÔNG ALTER `chien_dich`). Không có dòng ⇒ bắt đầu = ngày tạo. */
export const LENH_TAO_BANG_BAT_DAU = 'CREATE TABLE IF NOT EXISTS chien_dich_bat_dau (id TEXT PRIMARY KEY, bat_dau TEXT NOT NULL)'
export async function ghiBatDau(env: Env, id: string, batDau: string): Promise<void> {
  await env.DB.prepare(LENH_TAO_BANG_BAT_DAU).run()
  await env.DB.prepare('INSERT INTO chien_dich_bat_dau (id, bat_dau) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET bat_dau = excluded.bat_dau').bind(id, batDau).run()
}
/** Ngày bắt đầu đã đặt của các chiến dịch. Bảng chưa có / lỗi đọc ⇒ rỗng (hành vi cũ). */
export async function docBatDauMap(env: Env, ids: readonly string[]): Promise<Map<string, string>> {
  if (!ids.length) return new Map()
  const r = await env.DB.prepare('SELECT id, bat_dau FROM chien_dich_bat_dau WHERE id IN (SELECT value FROM json_each(?))').bind(JSON.stringify([...new Set(ids)])).all<Row>().catch(() => ({ results: [] as Row[] }))
  return new Map((r.results ?? []).map((x) => [str(x.id), str(x.bat_dau)]))
}
/** Đọc dòng `chien_dich` kèm ngày bắt đầu (một truy vấn phụ cho cả danh sách). */
export async function docChienDichKemBatDau(env: Env, rows: readonly Row[]): Promise<ChienDich[]> {
  const bd = await docBatDauMap(env, rows.map((r) => str(r.id)))
  return rows.map((r) => docChienDichTuDong({ ...r, bat_dau: bd.get(str(r.id)) ?? null }))
}
/** Chiến dịch chưa tới ngày bắt đầu? */
export const chuaBatDau = (cd: ChienDich, homNay: string): boolean => cd.batDau > homNay

/** Mọi chiến dịch (chưa huỷ) có em này, mới giao trước. */
export async function docChienDichCuaEm(env: Env, sbd: string): Promise<ChienDich[]> {
  const r = await env.DB.prepare("SELECT * FROM chien_dich WHERE trang_thai <> 'da_huy' AND EXISTS (SELECT 1 FROM json_each(chien_dich.sbd_json) WHERE value = ?) ORDER BY tao_luc DESC")
    .bind(sbd).all<Row>().catch(() => ({ results: [] as Row[] }))
  return docChienDichKemBatDau(env, r.results ?? [])
}
/**
 * SỬA CHIẾN DỊCH (thầy 28/09, `srs2-sua.ts`): em được THÊM vào chiến dịch đang chạy chỉ tính lần làm TỪ LÚC ĐƯỢC THÊM (như em giao từ đầu).
 * Bảng `chien_dich_em` (tạo lúc chạy, chỉ-thêm) có thể chưa có ⇒ rỗng: mốc = lúc giao chiến dịch như cũ.
 */
export async function docMocThemCuaEm(env: Env, sbd: string): Promise<Map<string, string>> {
  const r = await env.DB.prepare('SELECT chien_dich_id, them_luc FROM chien_dich_em WHERE sbd = ? AND them_luc IS NOT NULL').bind(sbd).all<Row>().catch(() => ({ results: [] as Row[] }))
  return new Map((r.results ?? []).map((x) => [str(x.chien_dich_id), str(x.them_luc)]))
}
/** Mốc được thêm của từng em trong MỘT chiến dịch (em giao từ đầu không có mốc). */
export async function docMocThemCaLop(env: Env, chienDichId: string): Promise<Map<string, string>> {
  const r = await env.DB.prepare('SELECT sbd, them_luc FROM chien_dich_em WHERE chien_dich_id = ? AND them_luc IS NOT NULL').bind(chienDichId).all<Row>().catch(() => ({ results: [] as Row[] }))
  return new Map((r.results ?? []).map((x) => [str(x.sbd), str(x.them_luc)]))
}
/** Mốc tính lần làm của em với một chiến dịch: lúc giao, hoặc lúc em được thêm nếu muộn hơn. */
export const mocTinhCua = (taoLuc: string, themLuc: string | undefined): string => (themLuc && themLuc > taoLuc ? themLuc : taoLuc)

/** Chiến dịch đang chạy của em (giao gần nhất, còn hạn, ĐÃ tới ngày bắt đầu). */
export const chienDichDangChay = (ds: readonly ChienDich[], homNay: string): ChienDich | null => ds.find((c) => c.trangThai === 'dang_chay' && c.hanNop >= homNay && !chuaBatDau(c, homNay)) ?? null
/** Chiến dịch SẮP bắt đầu gần nhất của em (chưa tới ngày bắt đầu) — Sảnh HS báo ngày, KHÔNG phát câu. */
export const chienDichSapBatDau = (ds: readonly ChienDich[], homNay: string): ChienDich | null =>
  ds.filter((c) => c.trangThai === 'dang_chay' && c.hanNop >= homNay && chuaBatDau(c, homNay)).sort((a, b) => (a.batDau < b.batDau ? -1 : a.batDau > b.batDau ? 1 : 0))[0] ?? null

// ---------------------------------------------------------------- câu và sổ
/** `sao`: số sao "cần chữa" của câu trong kho (`canChua.sao` → `sao` trong json câu game): 2 = vận dụng cao đánh dấu 2 sao. */
export interface MetaCau { qid: string; maDe: string; version: string; group: string; phan: Phan; mucDo: string | null; dang: string | null; tenDang: string | null; sao: number }
/** Siêu dữ liệu câu (không đáp án, không lời giải). Câu có ở nhiều tờ: ưu tiên tờ thuộc `uuTienMaDe`. */
export async function docMetaCau(env: Env, qids: readonly string[], uuTienMaDe: readonly string[] = []): Promise<Map<string, MetaCau>> {
  const ra = new Map<string, MetaCau>()
  if (!qids.length) return ra
  const r = await env.DB.prepare(`SELECT qid, ma_de, version, content_group, dang, json_extract(json,'$.phan') AS phan, json_extract(json,'$.mucDo') AS muc_do, json_extract(json,'$.tenDang') AS ten_dang, json_extract(json,'$.sao') AS sao
      FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?))`).bind(JSON.stringify([...new Set(qids)])).all<Row>()
  const uuTien = new Set(uuTienMaDe)
  for (const x of r.results ?? []) {
    const qid = str(x.qid)
    const cu = ra.get(qid)
    if (cu && (uuTien.has(cu.maDe) || !uuTien.has(str(x.ma_de)))) continue
    const phan = (['I', 'II', 'III'].includes(str(x.phan)) ? str(x.phan) : 'I') as Phan
    ra.set(qid, { qid, maDe: str(x.ma_de), version: str(x.version), group: str(x.content_group), phan, mucDo: x.muc_do == null ? null : str(x.muc_do), dang: x.dang == null ? null : str(x.dang), tenDang: x.ten_dang == null ? null : str(x.ten_dang), sao: Number(x.sao) || 0 })
  }
  return ra
}

/** Loại câu cho luật THÀNH THẠO LẦN ĐẦU (thầy chốt 28/09): phần, mức độ, số sao (lớn nhất nếu câu có ở nhiều tờ). */
export interface LoaiCau { sao: number; phan: Phan; mucDo: string | null }
export async function docLoaiCau(env: Env, qids: readonly string[]): Promise<Map<string, LoaiCau>> {
  const ra = new Map<string, LoaiCau>()
  if (!qids.length) return ra
  const r = await env.DB.prepare(`SELECT qid, MAX(COALESCE(CAST(json_extract(json,'$.sao') AS INTEGER), 0)) AS sao, json_extract(json,'$.phan') AS phan, json_extract(json,'$.mucDo') AS muc_do
      FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?)) GROUP BY qid`)
    .bind(JSON.stringify([...new Set(qids)])).all<Row>().catch(() => ({ results: [] as Row[] }))
  for (const x of r.results ?? []) {
    const phan = (['I', 'II', 'III'].includes(str(x.phan)) ? str(x.phan) : 'I') as Phan
    ra.set(str(x.qid), { sao: Number(x.sao) || 0, phan, mucDo: x.muc_do == null ? null : str(x.muc_do) })
  }
  return ra
}

/** Lần làm của em với các câu (mọi nguồn). Bỏ sự kiện CHE (ca chưa công bố); bỏ trống tính là sai; `assistance='assisted'` ⇒ có gợi ý. */
export async function docLanLam(env: Env, sbd: string, qids: readonly string[]): Promise<LanLam[]> {
  if (!qids.length) return []
  const ds = JSON.stringify([...new Set(qids)])
  let rows: Row[]
  try {
    rows = (await env.DB.prepare(`SELECT qid, ngay_vn, luc, ket_qua, assistance, visibility FROM su_kien_hoc WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?))`).bind(sbd, ds).all<Row>()).results ?? []
  } catch {
    rows = (await env.DB.prepare(`SELECT qid, ngay_vn, luc, ket_qua FROM su_kien_hoc WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?))`).bind(sbd, ds).all<Row>()).results ?? []
  }
  return rows
    .filter((x) => str(x.visibility) !== 'embargoed')
    .map((x) => ({ qid: str(x.qid), ngay: str(x.ngay_vn), luc: str(x.luc), dung: Number(x.ket_qua) === 1, coGoiY: str(x.assistance) === 'assisted' }))
}

/** Thời điểm thầy bấm "Chữa xong" cho từng câu của em. */
export async function docMocDayLai(env: Env, sbd: string): Promise<Map<string, string[]>> {
  const ra = new Map<string, string[]>()
  const r = await env.DB.prepare('SELECT qid, luc FROM srs2_day_lai WHERE sbd = ?').bind(sbd).all<Row>().catch(() => ({ results: [] as Row[] }))
  for (const x of r.results ?? []) {
    const k = str(x.qid)
    ra.set(k, [...(ra.get(k) ?? []), str(x.luc)])
  }
  return ra
}

export interface HoSo2 {
  chienDich: ChienDich | null
  /** Mọi câu trong phạm vi luyện, kèm nguồn. */
  cau: CauSrs[]
  meta: Map<string, MetaCau>
  tt: Map<string, TrangThaiCau>
  /** Trạng thái câu của chiến dịch đang chạy. */
  ttChienDich: TrangThaiCau[]
  /** Lần làm câu của chiến dịch đang chạy, từ lúc giao (chỉ-thêm 28/09 — để xếp hạng theo dạng khi bốc câu mới). */
  lanLamChienDich?: LanLam[]
  /** Câu vào hàng ôn CHỈ vì em sai/bỏ trống trong ca kiểm tra ĐÃ CÔNG BỐ (nguồn thứ 3 `ca_sai`, chỉ-thêm 28/09). */
  qidCaSai?: Set<string>
  /** Chiến dịch chưa tới ngày bắt đầu gần nhất (chỉ-thêm 28/09) — câu của nó KHÔNG vào kế hoạch. */
  sapBatDau?: ChienDich | null
}

/**
 * NGUỒN THỨ 3 — `ca_sai` (thầy chốt 28/09): câu em làm SAI hoặc BỎ TRỐNG trong ca kiểm tra ĐÃ CÔNG BỐ (sổ `su_kien_hoc` nguồn 'thi',
 * không bị che, ca chưa xoá, luật công bố `SQL_DA_CONG_BO`) ⇒ vào hàng ôn của Đoàn như câu ôn thường, KỂ CẢ câu không thuộc chiến dịch nào.
 * Trả qid → lúc làm SỚM NHẤT trong ca (mốc `tuLuc`: lần làm trong ca được tính). Câu tự luận (JSON kho) và câu đã rút khỏi kho bị bỏ.
 * Lỗi đọc (bảng/cột thiếu) ⇒ rỗng: không làm hỏng kế hoạch.
 */
export async function docQidSaiCaDaCongBo(env: Env, sbd: string): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  const cau = (coVis: boolean) =>
    `SELECT s.qid, MIN(s.luc) AS luc FROM su_kien_hoc s JOIN ca c ON c.ma_ca = s.ma_nguon
      WHERE s.sbd = ? AND s.nguon = 'thi' AND COALESCE(s.ket_qua, 0) <> 1 AND c.trang_thai <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')}
        ${coVis ? "AND COALESCE(s.visibility, '') <> 'embargoed'" : ''}
      GROUP BY s.qid`
  let rows: Row[]
  try {
    rows = (await env.DB.prepare(cau(true)).bind(sbd).all<Row>()).results ?? []
  } catch {
    try {
      rows = (await env.DB.prepare(cau(false)).bind(sbd).all<Row>()).results ?? []
    } catch {
      return ra
    }
  }
  const qids = [...new Set(rows.map((x) => str(x.qid)).filter(Boolean))]
  if (!qids.length) return ra
  const kho = await env.DB.prepare('SELECT qid, json FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?))').bind(JSON.stringify(qids)).all<Row>().catch(() => ({ results: [] as Row[] }))
  const tuLuan = new Set<string>()
  const coKho = new Set<string>()
  for (const x of kho.results ?? []) {
    coKho.add(str(x.qid))
    if (jsonLaTuLuan(x.json)) tuLuan.add(str(x.qid))
  }
  for (const x of rows) {
    const q = str(x.qid)
    if (q && coKho.has(q) && !tuLuan.has(q)) ra.set(q, str(x.luc))
  }
  return ra
}

/** Toàn bộ trạng thái luyện của em: chiến dịch đang chạy + nợ cũ + ôn duy trì của chiến dịch trước. */
export async function docHoSo2(env: Env, sbd: string, homNay: string): Promise<HoSo2> {
  const [ds, mocThem] = await Promise.all([docChienDichCuaEm(env, sbd), docMocThemCuaEm(env, sbd)])
  const dangChay = chienDichDangChay(ds, homNay)
  const hanTheoQid = new Map<string, string>()
  // Thầy 28/09: "khi giao chiến dịch đầu tiên tất cả không có câu ôn, không được lấy câu ôn trước đó" ⇒ câu của một chiến dịch chỉ tính lần làm TỪ LÚC GIAO chiến dịch ấy.
  const tuLucTheoQid = new Map<string, string>()
  const nguonTheoQid = new Map<string, 'chien_dich' | 'cu'>()
  if (dangChay) for (const q of dangChay.qids) { hanTheoQid.set(q, dangChay.hanNop); nguonTheoQid.set(q, 'chien_dich'); tuLucTheoQid.set(q, mocTinhCua(dangChay.mocBatDau, mocThem.get(dangChay.id))) }
  for (const c of ds) {
    if (c === dangChay || chuaBatDau(c, homNay)) continue // chiến dịch chưa bắt đầu: không phát câu nào của nó
    for (const q of c.qids) if (!nguonTheoQid.has(q)) { hanTheoQid.set(q, c.hanNop); nguonTheoQid.set(q, 'cu'); tuLucTheoQid.set(q, mocTinhCua(c.mocBatDau, mocThem.get(c.id))) }
  }
  // Nguồn thứ 3 `ca_sai`: câu sai/bỏ trống trong ca ĐÃ CÔNG BỐ. Câu đã thuộc chiến dịch ⇒ GIỮ nguồn chiến dịch (không nhân đôi).
  const qidCaSai = new Set<string>()
  for (const [q, luc] of await docQidSaiCaDaCongBo(env, sbd)) {
    if (nguonTheoQid.has(q)) continue
    nguonTheoQid.set(q, 'cu')
    tuLucTheoQid.set(q, luc)
    qidCaSai.add(q)
  }
  const qids = [...nguonTheoQid.keys()]
  const [meta, lanLam, moc] = await Promise.all([docMetaCau(env, qids, dangChay?.maDe ?? []), docLanLam(env, sbd, qids), docMocDayLai(env, sbd)])
  const theoQid = new Map<string, LanLam[]>()
  for (const x of lanLam) if (x.luc >= (tuLucTheoQid.get(x.qid) ?? '')) theoQid.set(x.qid, [...(theoQid.get(x.qid) ?? []), x])
  const tt = new Map<string, TrangThaiCau>()
  const cau: CauSrs[] = []
  for (const qid of qids) {
    const m = meta.get(qid)
    if (!m) continue // câu đã rút khỏi kho
    const t = phatLaiCau(qid, theoQid.get(qid) ?? [], hanTheoQid.get(qid) ?? null, moc.get(qid) ?? [], { sao: m.sao, phan: m.phan, mucDo: m.mucDo })
    tt.set(qid, t)
    const nguon = nguonTheoQid.get(qid) === 'chien_dich' ? 'chien_dich' : t.thanhThao ? 'duy_tri' : t.laMoi ? null : 'no_cu'
    if (!nguon) continue // câu chiến dịch cũ em chưa từng gặp: không kéo sang
    cau.push({ qid, phan: m.phan, mucDo: m.mucDo, dang: m.dang, nguon })
  }
  const lanLamChienDich = dangChay ? dangChay.qids.flatMap((q) => theoQid.get(q) ?? []) : []
  return { chienDich: dangChay, cau, meta, tt, ttChienDich: dangChay ? dangChay.qids.map((q) => tt.get(q)).filter((x): x is TrangThaiCau => !!x) : [], lanLamChienDich, qidCaSai, sapBatDau: chienDichSapBatDau(ds, homNay) }
}

// ---------------------------------------------------------------- hạng theo dạng (bốc câu mới cá nhân hoá, thầy 28/09)
/** Hồ sơ dạng (`nam_kt_dang`) của nhiều em. Lỗi đọc (bảng/cột thiếu) ⇒ rỗng: em coi như chưa có dữ liệu (L2 hoặc theo lần làm trong chiến dịch). */
export async function docHoSoDangCaLop(env: Env, dsSbd: readonly string[]): Promise<Map<string, HoSoDangTho[]>> {
  const ra = new Map<string, HoSoDangTho[]>()
  if (!dsSbd.length) return ra
  const arr = JSON.stringify([...new Set(dsSbd)])
  const r = await env.DB.prepare("SELECT sbd, ma_dang, so_gap, so_sai, cap_nhat_luc FROM nam_kt_dang WHERE sbd IN (SELECT value FROM json_each(?)) AND ma_dang NOT LIKE 'CD:%'").bind(arr).all<Row>()
    .catch(() => env.DB.prepare("SELECT sbd, ma_dang, so_gap, so_sai FROM nam_kt_dang WHERE sbd IN (SELECT value FROM json_each(?)) AND ma_dang NOT LIKE 'CD:%'").bind(arr).all<Row>())
    .catch(() => ({ results: [] as Row[] }))
  for (const x of r.results ?? []) {
    const k = str(x.sbd)
    ra.set(k, [...(ra.get(k) ?? []), { maDang: str(x.ma_dang), soGap: Number(x.so_gap) || 0, soSai: Number(x.so_sai) || 0, capNhatLuc: x.cap_nhat_luc == null ? null : str(x.cap_nhat_luc) }])
  }
  return ra
}

/** Hạng theo dạng của MỘT em từ hồ sơ dạng + lần làm trong chiến dịch (bỏ lượt có gợi ý). Tính lại mỗi lần lập kế hoạch ⇒ tự cập nhật mỗi sáng. */
export function hangTuHoSo(hoSoDang: readonly HoSoDangTho[], lanLam: readonly LanLam[], meta: ReadonlyMap<string, MetaCau>, qidsChienDich: readonly string[], tuLuc = ''): { hangTheoDang: Record<string, HangEm>; hangChung: HangEm } {
  const tk = gopThongKeDang(hoSoDang, lanLam.map((x) => ({ dang: meta.get(x.qid)?.dang ?? null, luc: x.luc, dung: x.dung, coGoiY: x.coGoiY })), tuLuc)
  const dangCan = [...new Set(qidsChienDich.map((q) => meta.get(q)?.dang).filter((d): d is string => !!d))]
  return tinhHangTheoDang(tk, dangCan)
}

/** Hạng theo dạng của em cho kế hoạch hôm nay (chỉ khi có chiến dịch đang chạy). */
export async function docHangEm(env: Env, sbd: string, hs: HoSo2): Promise<{ hangTheoDang: Record<string, HangEm>; hangChung: HangEm } | null> {
  const cd = hs.chienDich
  if (!cd) return null
  const hoSoDang = (await docHoSoDangCaLop(env, [sbd])).get(sbd) ?? []
  return hangTuHoSo(hoSoDang, hs.lanLamChienDich ?? [], hs.meta, cd.qids, cd.mocBatDau)
}

// ---------------------------------------------------------------- kế hoạch ngày (chốt một lần)
export interface KeHoachDaChot {
  ngay: string
  chienDichId: string | null
  /** Khoá câu theo thứ tự phục vụ; `qid#2` = lần làm thứ 2 trong ngày (ngày cuối trước hạn). */
  dao: string[]
  doan: string[]
  huyetChien: boolean
  tong: number
  conDao: string[]
  conDoan: string[]
}

/** Bỏ hậu tố lần-làm-trong-ngày (`qid#2`). */
export const qidGoc = (k: string): string => k.replace(/#\d+$/, '')
const lanThu = (k: string): number => Number(/#(\d+)$/.exec(k)?.[1] ?? 1)

/** Số lần em đã làm mỗi câu hôm nay trong game. */
async function docDemHomNay(env: Env, sbd: string, ngay: string): Promise<Map<string, number>> {
  const r = await env.DB.prepare("SELECT qid, COUNT(*) AS n FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND nguon = 'game' GROUP BY qid").bind(sbd, ngay).all<Row>().catch(() => ({ results: [] as Row[] }))
  return new Map((r.results ?? []).map((x) => [str(x.qid), Number(x.n) || 0]))
}

const hoanThien = (ngay: string, id: string | null, dao: string[], doan: string[], huyetChien: boolean, dem: ReadonlyMap<string, number>): KeHoachDaChot => {
  const chua = (k: string) => (dem.get(qidGoc(k)) ?? 0) < lanThu(k)
  return { ngay, chienDichId: id, dao, doan, huyetChien, tong: dao.length + doan.length, conDao: dao.filter(chua), conDoan: doan.filter(chua) }
}
const tuDong = (r: Row, ngay: string, dem: ReadonlyMap<string, number>) =>
  hoanThien(ngay, r.chien_dich_id == null ? null : str(r.chien_dich_id), parseMang(r.dao_json), parseMang(r.doan_json), Number(r.huyet_chien) === 1, dem)

/** Gắn hậu tố cho câu đã có trong kế hoạch (lần làm thứ n trong ngày). */
function themLanLam(cu: readonly string[], moi: readonly string[]): string[] {
  const n = new Map<string, number>()
  for (const k of cu) n.set(qidGoc(k), Math.max(n.get(qidGoc(k)) ?? 0, lanThu(k)))
  return moi.map((q) => {
    const k = (n.get(q) ?? 0) + 1
    n.set(q, k)
    return k === 1 ? q : `${q}#${k}`
  })
}

/**
 * CHỈ ĐỌC (app phụ huynh mới 28/09): kế hoạch hôm nay ĐÃ CHỐT của em, kèm câu còn lại. Chưa chốt (em chưa mở app hôm nay) ⇒ null.
 * KHÔNG lập, KHÔNG ghi — phụ huynh mở app không được chốt kế hoạch thay con (khác `layKeHoachHomNay`). Lỗi đọc ⇒ null.
 */
export async function docKeHoachDaChot(env: Env, sbd: string, nowMs: number): Promise<KeHoachDaChot | null> {
  const ngay = ngayVnCua(nowMs)
  const cu = await env.DB.prepare('SELECT * FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>().catch(() => null)
  if (!cu) return null
  return tuDong(cu, ngay, await docDemHomNay(env, sbd, ngay))
}

/**
 * Kế hoạch HÔM NAY của em: lần mở đầu tiên trong ngày thì lập và CHỐT (bảng `srs2_ke_hoach`), các lần sau đọc lại —
 * Thể lực là con số thật, không nhảy. Ngoại lệ luật B.7: ngày cuối trước hạn, làm hết kế hoạch mà trần ngày còn chỗ và
 * có câu đến lịch lại trong ngày (câu vừa sai) thì BỔ SUNG, không vượt trần.
 */
export async function layKeHoachHomNay(env: Env, sbd: string, nowMs: number, hs?: HoSo2): Promise<{ kh: KeHoachDaChot; hs: HoSo2 }> {
  const ngay = ngayVnCua(nowMs)
  const hoSo = hs ?? (await docHoSo2(env, sbd, ngay))
  const dem = await docDemHomNay(env, sbd, ngay)
  const cd = hoSo.chienDich
  const tranNgay = cd?.theLucNgay
  const cu = await env.DB.prepare('SELECT * FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>().catch(() => null)
  const tuyChonGoc = { homNay: ngay, hanNop: cd?.hanNop ?? null, ...(tranNgay ? { tranNgay } : {}), ...(cd ? { tranHuyetChien: cd.huyetChien ? tranHuyetChienTheo(cd.theLucNgay) : cd.theLucNgay } : {}) }
  // Bốc câu mới cá nhân hoá (thầy 28/09): hạng theo dạng CHỈ đọc khi thật sự lập kế hoạch (kế hoạch đã chốt thì khỏi đọc).
  // Lỗi đọc hồ sơ ⇒ không có hạng ⇒ hành vi cũ (dễ trước), không làm hỏng kế hoạch.
  const tuyChonLap = async (): Promise<TuyChonKeHoach> => ({ ...tuyChonGoc, ...((await docHangEm(env, sbd, hoSo).catch(() => null)) ?? {}) })
  if (cu) {
    let kh = tuDong(cu, ngay, dem)
    // Thầy 28/09 ("đã giao chiến dịch test nhưng không bấm vào làm được"): kế hoạch chốt LÚC CHƯA CÓ chiến dịch (hoặc chiến dịch khác)
    // thì LẬP LẠI theo chiến dịch hiện tại — giữ các câu đã làm hôm nay (vẫn trừ vào thể lực), thêm câu mới của kế hoạch.
    // Kế hoạch đã chốt có câu ÔN (Đoàn) mà theo luật hiện tại là câu MỚI (thầy 28/09: bỏ câu ôn lấy từ lịch sử trước chiến dịch) ⇒ cũng lập lại.
    const onSaiLuat = kh.conDoan.some((k) => hoSo.tt.get(qidGoc(k))?.laMoi)
    if ((kh.chienDichId ?? null) !== (cd?.id ?? null) || onSaiLuat) {
      const xongDao = kh.dao.filter((k) => !kh.conDao.includes(k))
      const xongDoan = kh.doan.filter((k) => !kh.conDoan.includes(k))
      const lap = lapKeHoachNgay(hoSo.cau, hoSo.tt, await tuyChonLap(), xongDao.length + xongDoan.length)
      const dao = [...xongDao, ...themLanLam([...xongDao, ...xongDoan], lap.dao)]
      const doan = [...xongDoan, ...themLanLam([...dao, ...xongDoan], lap.doan)]
      await env.DB.prepare('UPDATE srs2_ke_hoach SET chien_dich_id = ?, dao_json = ?, doan_json = ?, huyet_chien = ?, tong = ? WHERE sbd = ? AND ngay = ?')
        .bind(cd?.id ?? null, JSON.stringify(dao), JSON.stringify(doan), lap.huyetChien ? 1 : 0, dao.length + doan.length, sbd, ngay).run()
      return { kh: hoanThien(ngay, cd?.id ?? null, dao, doan, lap.huyetChien, dem), hs: hoSo }
    }
    if (cd && cd.hanNop === ngay && kh.conDao.length + kh.conDoan.length === 0) {
      // Bổ sung ngày cuối KHÔNG kéo câu `ca_sai` vào kế hoạch đã chốt: câu sai của ca vào từ lần lập kế hoạch kế tiếp (thầy 28/09).
      const them = lapKeHoachNgay(hoSo.cau.filter((c) => !hoSo.qidCaSai?.has(c.qid)), hoSo.tt, await tuyChonLap(), kh.tong)
      if (them.dao.length + them.doan.length) {
        const dao = [...kh.dao, ...themLanLam([...kh.dao, ...kh.doan], them.dao)]
        const doan = [...kh.doan, ...themLanLam([...dao, ...kh.doan], them.doan)]
        await env.DB.prepare('UPDATE srs2_ke_hoach SET dao_json = ?, doan_json = ?, tong = ? WHERE sbd = ? AND ngay = ?').bind(JSON.stringify(dao), JSON.stringify(doan), dao.length + doan.length, sbd, ngay).run()
        kh = hoanThien(ngay, kh.chienDichId, dao, doan, kh.huyetChien, dem)
      }
    }
    return { kh, hs: hoSo }
  }
  const lap = lapKeHoachNgay(hoSo.cau, hoSo.tt, await tuyChonLap())
  await env.DB.prepare('INSERT OR IGNORE INTO srs2_ke_hoach (sbd, ngay, chien_dich_id, dao_json, doan_json, huyet_chien, tong, tao_luc) VALUES (?,?,?,?,?,?,?,?)')
    .bind(sbd, ngay, cd?.id ?? null, JSON.stringify(lap.dao), JSON.stringify(lap.doan), lap.huyetChien ? 1 : 0, lap.dao.length + lap.doan.length, new Date(nowMs).toISOString()).run()
  // Hai yêu cầu song song: bản ghi thắng là bản CHỐT, đọc lại để cả hai trả cùng một kế hoạch.
  const chot = await env.DB.prepare('SELECT * FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>()
  return { kh: chot ? tuDong(chot, ngay, dem) : hoanThien(ngay, cd?.id ?? null, lap.dao, lap.doan, lap.huyetChien, dem), hs: hoSo }
}

// ---------------------------------------------------------------- màn Sảnh
export const LOI_KHOA_DAO = 'Có xe hàng đang bị phục kích, hãy hoàn thành Hộ Tống trước khi ra Đảo nhé!'

export async function sanh2(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  const { kh, hs } = await layKeHoachHomNay(env, sbd, nowMs)
  const cd = hs.chienDich
  const tl = tiLeChienDich(hs.ttChienDich)
  const conLai = kh.conDao.length + kh.conDoan.length
  const ruong = await env.DB.prepare('SELECT mo_luc, qua_json FROM ruong_bat_linh WHERE sbd = ? AND ngay = ?').bind(sbd, kh.ngay).first<Row>().catch(() => null)
  return {
    ok: true,
    cheDo2: true,
    ngay: kh.ngay,
    // Chiến dịch chưa tới ngày bắt đầu (thầy 28/09): chỉ báo tên + ngày, KHÔNG lộ câu.
    sapBatDau: hs.sapBatDau ? { id: hs.sapBatDau.id, ten: hs.sapBatDau.ten, batDau: hs.sapBatDau.batDau, hanNop: hs.sapBatDau.hanNop } : null,
    chienDich: cd ? { id: cd.id, ten: cd.ten, hanNop: cd.hanNop, D: soNgayConLai(kh.ngay, cd.hanNop), tong: tl.tong, coXat: tl.coXat, thanhThao: tl.thanhThao, canDayLai: tl.canDayLai, thanhThaoTangTu: tl.thanhThao ? null : ngayThanhThaoSomNhat(hs.ttChienDich) } : null,
    theLuc: { con: conLai, tong: kh.tong },
    huyetChien: kh.huyetChien,
    doan: { con: kh.conDoan.length },
    dao: { con: kh.conDao.length },
    khoaDao: kh.conDoan.length > 0,
    ...(kh.conDoan.length > 0 ? { loiKhoaDao: LOI_KHOA_DAO } : {}),
    ruong: { daLam: kh.tong - conLai, tong: kh.tong, moDuoc: moDuocRuong(kh.tong, kh.tong - conLai), daMo: !!ruong, ...(ruong ? { qua: JSON.parse(str(ruong.qua_json) || '{}') } : {}) },
  }
}

/** Gợi ý M3 cho lần phục vụ tới của câu. */
export const coGoiY = (t: TrangThaiCau | undefined): boolean => !!t && canGoiY(t)

/** CHẨN ĐOÁN (thầy, CHỈ ĐỌC — không ghi kế hoạch): máy chủ thấy gì với một em hôm nay. Dùng khi Sảnh báo "chưa có câu nào". */
export async function chanDoanEm(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  const ngay = ngayVnCua(nowMs)
  const hoSo = await docHoSo2(env, sbd, ngay)
  const cd = hoSo.chienDich
  const dsCd = await docChienDichCuaEm(env, sbd)
  const hang = await docHangEm(env, sbd, hoSo).catch(() => null)
  const tuyChon = { homNay: ngay, hanNop: cd?.hanNop ?? null, ...(cd?.theLucNgay ? { tranNgay: cd.theLucNgay } : {}), ...(cd ? { tranHuyetChien: cd.huyetChien ? tranHuyetChienTheo(cd.theLucNgay) : cd.theLucNgay } : {}), ...(hang ?? {}) }
  const lap = lapKeHoachNgay(hoSo.cau, hoSo.tt, tuyChon)
  const cu = await env.DB.prepare('SELECT chien_dich_id, tong, tao_luc, dao_json, doan_json FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>().catch((e) => ({ loi: String(e) }) as Row)
  const cauCd = hoSo.cau.filter((c) => c.nguon === 'chien_dich')
  return {
    ok: true, ngay, sbd,
    coHoa2: await cheDo2(env, sbd),
    chienDichCuaEm: dsCd.map((c) => ({ id: c.id, ten: c.ten, trangThai: c.trangThai, hanNop: c.hanNop, batDau: c.batDau, soCau: c.qids.length })),
    chienDichDangChay: cd ? { id: cd.id, hanNop: cd.hanNop, theLucNgay: cd.theLucNgay, soQid: cd.qids.length } : null,
    soMetaTimThay: hoSo.meta.size,
    soCauTrongHoSo: hoSo.cau.length,
    soCauChienDich: cauCd.length,
    soCauMoi: cauCd.filter((c) => hoSo.tt.get(c.qid)?.laMoi).length,
    keHoachDaChot: cu ? { chienDichId: cu.chien_dich_id ?? null, tong: cu.tong ?? null, taoLuc: cu.tao_luc ?? null, loi: (cu as Row).loi ?? null } : null,
    lapLaiSeRa: { dao: lap.dao.length, doan: lap.doan.length, huyetChien: lap.huyetChien },
    hangTheoDang: hang?.hangTheoDang ?? null,
    hangChung: hang?.hangChung ?? null,
  }
}
