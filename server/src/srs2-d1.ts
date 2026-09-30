// THUẬT TOÁN 2.0 — LỚP D1 (đọc chiến dịch, sổ sự kiện; chốt kế hoạch ngày; số liệu Sảnh; Rương Bát Linh).
// Lõi thuần ở `srs2-loi.ts`. Công tắc `cau_hinh.game_hoa_2` (mặc định TẮT ⇒ mọi đường cũ giữ nguyên):
//   {"bat":true}                         ⇒ toàn trung tâm
//   {"bat":true,"lop":["12A1"]}          ⇒ chỉ các lớp này
//   {"bat":true,"sbd":["12001","12002"]} ⇒ chỉ các em này (chạy thử)
import type { Env } from './kieu'
import { docCauHinhDem } from './cau-hinh-dem'
import { DemTTL } from './dem-chung'
import { chayDdlMotLan } from './ddl-mot-lan'
import {
  lapKeHoachNgay, laNo, nhanNo, khoiLuongCan, TRAN_NGAY, type NguonNhan, tranHuyetChienTheo, phatLaiCau, canGoiY, moDuocRuong, tiLeChienDich, ngayThanhThaoSomNhat, soNgayConLai,
  gopThongKeDang, tinhHangTheoDang,
  type CauSrs, type HangEm, type TuyChonKeHoach, type HoSoDangTho, type LanLam, type TrangThaiCau, type Phan,
} from './srs2-loi'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { protectedQuestions } from './game-v2-bank'
import { jsonLaTuLuan, lyDoTuLuan } from './cam-tu-luan'

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
  // Đệm 15 s trong isolate (cau-hinh-dem.ts): Sảnh/start/Đoàn/Bi-a đọc cờ này nhiều lần mỗi request.
  return docCoHoa2Tu(await docCauHinhDem(env, KHOA_CO_HOA2))
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
  /**
   * RẢI ĐỀU CÂU MỚI THEO NGÀY (thầy chốt 30/09): bật ⇒ câu mới/ngày dừng đúng quota, lượt dư để ôn (srs2-loi `TuyChonKeHoach.raiDeu`).
   * Lưu ở bảng phụ `chien_dich_tuy_chon` (chỉ-thêm, tạo lúc chạy); KHÔNG có dòng (null) ⇒ BẬT — chiến dịch cũ đang chạy cũng bật.
   */
  raiDeu: boolean
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
  raiDeu: r.rai_deu == null ? true : Number(r.rai_deu) !== 0,
})

// ---------------------------------------------------------------- ngày bắt đầu (thầy 28/09)
/** Bảng phụ tạo lúc chạy (CI không chạy migration; KHÔNG ALTER `chien_dich`). Không có dòng ⇒ bắt đầu = ngày tạo. */
export const LENH_TAO_BANG_BAT_DAU = 'CREATE TABLE IF NOT EXISTS chien_dich_bat_dau (id TEXT PRIMARY KEY, bat_dau TEXT NOT NULL)'
export async function ghiBatDau(env: Env, id: string, batDau: string): Promise<void> {
  await chayDdlMotLan(env, 'chien_dich_bat_dau', [LENH_TAO_BANG_BAT_DAU]) // một lần mỗi isolate (ddl-mot-lan.ts)
  await env.DB.prepare('INSERT INTO chien_dich_bat_dau (id, bat_dau) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET bat_dau = excluded.bat_dau').bind(id, batDau).run()
  xoaDemChienDich()
}
/** Ngày bắt đầu đã đặt của các chiến dịch. Bảng chưa có / lỗi đọc ⇒ rỗng (hành vi cũ). */
export async function docBatDauMap(env: Env, ids: readonly string[]): Promise<Map<string, string>> {
  if (!ids.length) return new Map()
  const r = await env.DB.prepare('SELECT id, bat_dau FROM chien_dich_bat_dau WHERE id IN (SELECT value FROM json_each(?))').bind(JSON.stringify([...new Set(ids)])).all<Row>().catch(() => ({ results: [] as Row[] }))
  return new Map((r.results ?? []).map((x) => [str(x.id), str(x.bat_dau)]))
}
// ---------------------------------------------------------------- rải đều câu mới (thầy 30/09)
/** Bảng phụ tạo lúc chạy (như `chien_dich_bat_dau`; KHÔNG ALTER `chien_dich`). Không có dòng ⇒ rải đều BẬT. */
export const LENH_TAO_BANG_TUY_CHON = 'CREATE TABLE IF NOT EXISTS chien_dich_tuy_chon (id TEXT PRIMARY KEY, rai_deu INTEGER NOT NULL, cap_nhat_luc TEXT NOT NULL)'
export async function ghiRaiDeu(env: Env, id: string, bat: boolean, nowMs: number): Promise<void> {
  await chayDdlMotLan(env, 'chien_dich_tuy_chon', [LENH_TAO_BANG_TUY_CHON])
  await env.DB.prepare('INSERT INTO chien_dich_tuy_chon (id, rai_deu, cap_nhat_luc) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET rai_deu = excluded.rai_deu, cap_nhat_luc = excluded.cap_nhat_luc')
    .bind(id, bat ? 1 : 0, new Date(nowMs).toISOString()).run()
  xoaDemChienDich()
}
/** Cờ rải đều đã đặt của các chiến dịch (0/1). Bảng chưa có / lỗi đọc ⇒ rỗng (= bật). */
export async function docRaiDeuMap(env: Env, ids: readonly string[]): Promise<Map<string, number>> {
  if (!ids.length) return new Map()
  const r = await env.DB.prepare('SELECT id, rai_deu FROM chien_dich_tuy_chon WHERE id IN (SELECT value FROM json_each(?))').bind(JSON.stringify([...new Set(ids)])).all<Row>().catch(() => ({ results: [] as Row[] }))
  return new Map((r.results ?? []).map((x) => [str(x.id), Number(x.rai_deu)]))
}
/** Đọc dòng `chien_dich` kèm ngày bắt đầu + cờ rải đều (hai truy vấn phụ song song cho cả danh sách). */
export async function docChienDichKemBatDau(env: Env, rows: readonly Row[]): Promise<ChienDich[]> {
  const ids = rows.map((r) => str(r.id))
  const [bd, rd] = await Promise.all([docBatDauMap(env, ids), docRaiDeuMap(env, ids)])
  return rows.map((r) => docChienDichTuDong({ ...r, bat_dau: bd.get(str(r.id)) ?? null, rai_deu: rd.get(str(r.id)) ?? null }))
}
/** Chiến dịch chưa tới ngày bắt đầu? */
export const chuaBatDau = (cd: ChienDich, homNay: string): boolean => cd.batDau > homNay

/** Mọi chiến dịch (chưa huỷ) có em này, mới giao trước. */
/**
 * CAO ĐIỂM 20h–24h (29/09): danh sách chiến dịch chưa huỷ + ngày bắt đầu là dữ liệu CHUNG mọi em (bảng nhỏ) nhưng trước đây MỖI lệnh Sảnh / start / Đoàn của
 * MỖI em quét lại cả bảng và bung `sbd_json` của mọi chiến dịch (json_each) để lọc một em. Nay đọc CẢ danh sách một lần, đệm 15 s trong isolate (lượt đọc đang bay được
 * chia sẻ), lọc em bằng tập sbd dựng sẵn. Thầy tạo / đóng / huỷ / sửa chiến dịch hay đặt ngày bắt đầu ⇒ `xoaDemChienDich()` ngay (isolate ấy); isolate khác trễ ≤ 15 s.
 * Lỗi đọc ⇒ rỗng như cũ và KHÔNG đệm.
 */
type DsChienDich = { ds: { row: Row; sbd: Set<string> }[]; bd: Map<string, string>; rd: Map<string, number> }
const demChienDich = new DemTTL<Promise<DsChienDich>>(15_000, 2)
export function xoaDemChienDich(): void { demChienDich.xoa() }
function docMoiChienDich(env: Env): Promise<DsChienDich> {
  const nay = Date.now()
  const co = demChienDich.doc('ds', nay)
  if (co) return co
  let loi = false
  // Không JOIN: bảng `chien_dich_bat_dau` tạo lúc chạy, có thể chưa có ⇒ lỗi riêng câu phụ, danh sách vẫn đúng (hành vi cũ).
  const p = Promise.all([
    env.DB.prepare("SELECT * FROM chien_dich WHERE trang_thai <> 'da_huy' ORDER BY tao_luc DESC").all<Row>().catch(() => { loi = true; return { results: [] as Row[] } }),
    // bảng tạo lúc chạy: chưa có (chưa ai đặt ngày bắt đầu) là BÌNH THƯỜNG ⇒ rỗng, vẫn đệm (`ghiBatDau` xoá đệm khi tạo)
    env.DB.prepare("SELECT id, bat_dau FROM chien_dich_bat_dau WHERE id IN (SELECT id FROM chien_dich WHERE trang_thai <> 'da_huy')").all<Row>().catch(() => ({ results: [] as Row[] })),
    // rải đều (30/09): bảng tạo lúc chạy, chưa có = mọi chiến dịch BẬT ⇒ rỗng (`ghiRaiDeu` xoá đệm khi đổi)
    env.DB.prepare("SELECT id, rai_deu FROM chien_dich_tuy_chon WHERE id IN (SELECT id FROM chien_dich WHERE trang_thai <> 'da_huy')").all<Row>().catch(() => ({ results: [] as Row[] })),
  ]).then(([r, bd, rd]) => {
    if (loi && demChienDich.doc('ds', Date.now()) === p) demChienDich.xoaKhoa('ds')
    return {
      // đúng ngữ nghĩa `json_each(sbd_json) … value = ?`: chỉ phần tử CHUỖI trùng khớp tuyệt đối
      ds: (r.results ?? []).map((row) => { let a: unknown = []; try { a = JSON.parse(str(row.sbd_json) || '[]') } catch { /* sbd_json hỏng ⇒ không em nào */ } return { row, sbd: new Set((Array.isArray(a) ? a : []).filter((x): x is string => typeof x === 'string')) } }),
      bd: new Map((bd.results ?? []).map((x) => [str(x.id), str(x.bat_dau)])),
      rd: new Map((rd.results ?? []).map((x) => [str(x.id), Number(x.rai_deu)])),
    }
  })
  demChienDich.ghi('ds', nay, p)
  return p
}
export async function docChienDichCuaEm(env: Env, sbd: string): Promise<ChienDich[]> {
  const { ds, bd, rd } = await docMoiChienDich(env)
  return ds.filter((x) => x.sbd.has(sbd)).map((x) => docChienDichTuDong({ ...x.row, bat_dau: bd.get(str(x.row.id)) ?? null, rai_deu: rd.get(str(x.row.id)) ?? null }))
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
export interface MetaCau {
  qid: string; maDe: string; version: string; group: string; phan: Phan; mucDo: string | null; dang: string | null; tenDang: string | null; sao: number
  /**
   * CÂU TỰ LUẬN (luật chặt #107, 30/09) — MỘT chỗ dùng chung cho kế hoạch ngày / rương / Sảnh / Bi-a: cờ `tuLuan` của chỉ mục (kho gắn nhãn `kieu: tu_luan`)
   * HOẶC luật `lyDoTuLuan` tính trên phần rút gọn (phần, đáp án, đề, số phương án/ý) cho chỉ mục cũ chưa mang cờ. Câu tự luận KHÔNG vào kế hoạch,
   * không đếm vào thể lực/rương (sửa lỗi 30/09 "Chưa tải được câu hôm nay" + rương kẹt 48/49).
   */
  tuLuan: boolean
}
/** Cờ tự luận từ các cột rút gọn của chỉ mục (không đọc cả JSON — tránh ảnh). Phương án/ý độn theo số lượng: chỉ cần "đủ 4" là rút được. */
export function tuLuanTuMeta(x: Row, qid: string, phan: Phan): boolean {
  if (x.tu_luan === 1 || x.tu_luan === true || x.tu_luan === '1') return true
  const nPa = x.n_pa == null ? null : Number(x.n_pa), nY = x.n_y == null ? null : Number(x.n_y)
  return lyDoTuLuan({
    qid, maDe: str(x.ma_de), phan,
    ...(x.correct == null ? {} : { correct: typeof x.correct === 'string' ? x.correct : String(x.correct) }),
    ...(x.text_cau == null ? {} : { text: str(x.text_cau) }),
    ...(nPa == null ? {} : { choices: Array.from({ length: Math.max(0, nPa) }, () => 'x') }),
    ...(nY == null ? {} : { ideas: Array.from({ length: Math.max(0, nY) }, () => 'x') }),
  }) !== null
}
/**
 * Siêu dữ liệu câu (không đáp án xuống máy em, không lời giải). Câu có ở nhiều tờ: ưu tiên tờ thuộc `uuTienMaDe`.
 * 30/09: bỏ dòng JSON hỏng (`json_valid`) hoặc JSON không mang đúng `qid`/`version` của cột (khoá nạp `maDe|qid|version` ở `napDayDuMem` không khớp ⇒ câu ấy
 * KHÔNG nạp được ⇒ coi như đã rút khỏi kho). `maDe` không so: chỉ mục chỉ có một đường ghi (`lapChiMucTo`) nên luôn khớp cột.
 */
export async function docMetaCau(env: Env, qids: readonly string[], uuTienMaDe: readonly string[] = []): Promise<Map<string, MetaCau>> {
  const ra = new Map<string, MetaCau>()
  if (!qids.length) return ra
  const r = await env.DB.prepare(`SELECT qid, ma_de, version, content_group, dang, json_extract(json,'$.phan') AS phan, json_extract(json,'$.mucDo') AS muc_do, json_extract(json,'$.tenDang') AS ten_dang, json_extract(json,'$.sao') AS sao,
        json_extract(json,'$.tuLuan') AS tu_luan, json_extract(json,'$.correct') AS correct, json_extract(json,'$.text') AS text_cau, json_array_length(json,'$.choices') AS n_pa, json_array_length(json,'$.ideas') AS n_y,
        json_extract(json,'$.qid') AS j_qid, json_extract(json,'$.version') AS j_version
      FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?)) AND json_valid(json)`).bind(JSON.stringify([...new Set(qids)])).all<Row>()
  const uuTien = new Set(uuTienMaDe)
  for (const x of r.results ?? []) {
    const qid = str(x.qid)
    if (str(x.j_qid) !== qid || str(x.j_version) !== str(x.version)) continue // JSON lệch cột ⇒ không nạp được ⇒ như đã rút
    const cu = ra.get(qid)
    if (cu && (uuTien.has(cu.maDe) || !uuTien.has(str(x.ma_de)))) continue
    const phan = (['I', 'II', 'III'].includes(str(x.phan)) ? str(x.phan) : 'I') as Phan
    ra.set(qid, { qid, maDe: str(x.ma_de), version: str(x.version), group: str(x.content_group), phan, mucDo: x.muc_do == null ? null : str(x.muc_do), dang: x.dang == null ? null : str(x.dang), tenDang: x.ten_dang == null ? null : str(x.ten_dang), sao: Number(x.sao) || 0, tuLuan: tuLuanTuMeta(x, qid, phan) })
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
    rows = (await env.DB.prepare(`SELECT qid, ngay_vn, luc, ket_qua, assistance, visibility, nguon FROM su_kien_hoc WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?))`).bind(sbd, ds).all<Row>()).results ?? []
  } catch {
    rows = (await env.DB.prepare(`SELECT qid, ngay_vn, luc, ket_qua, nguon FROM su_kien_hoc WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?))`).bind(sbd, ds).all<Row>()).results ?? []
  }
  return rows.filter((x) => str(x.visibility) !== 'embargoed').map(lanLamTuDong)
}
/** Một dòng sổ → lần làm (kèm `nguon` — chỉ-thêm 29/09: `dau_gio` Đạt ⇒ thành thạo ngay). */
export const lanLamTuDong = (x: Row): LanLam => ({
  qid: str(x.qid), ngay: str(x.ngay_vn), luc: str(x.luc), dung: Number(x.ket_qua) === 1, coGoiY: str(x.assistance) === 'assisted',
  ...(x.nguon != null && str(x.nguon) ? { nguon: str(x.nguon) } : {}),
})

/**
 * HỢP ĐỒNG với Kiểm tra đầu giờ (docs/so-no-2909/HOP-DONG.md): thầy tích "Thầy đã chữa" cho MỘT em + MỘT câu ⇒ ghi một mốc dạy lại
 * (cùng bảng `srs2_day_lai` của nút "Chữa xong"): đếm sai về 0, bỏ cắt tỉa, câu quay lại kế hoạch NGÀY HÔM SAU. Chỉ-thêm; ghi lại
 * cùng (em, câu, lúc) không thêm dòng. `luc` ISO — ghi SAU sự kiện sổ của cùng lần chấm (mốc ≥ lúc sự kiện).
 */
export async function ghiMocDayLai(env: Env, sbd: string, qid: string, luc: string, chienDichId: string | null = null): Promise<void> {
  if (!sbd || !qid || !luc) throw new Error('Thiếu em, câu hoặc thời điểm chữa.')
  await chayDdlMotLan(env, 'srs2_day_lai', [LENH_TAO_BANG_DAY_LAI])
  await env.DB.prepare('INSERT OR IGNORE INTO srs2_day_lai (sbd, qid, luc, chien_dich_id) VALUES (?,?,?,?)').bind(sbd, qid, luc, chienDichId).run()
}
/** Bảng mốc dạy lại (đã có từ migration-2709-game-hoa-2.sql) — tạo lúc chạy nếu thiếu, CHỈ-THÊM. */
export const LENH_TAO_BANG_DAY_LAI = 'CREATE TABLE IF NOT EXISTS srs2_day_lai (sbd TEXT NOT NULL, qid TEXT NOT NULL, luc TEXT NOT NULL, chien_dich_id TEXT, PRIMARY KEY (sbd, qid, luc))'

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
  /** SỔ NỢ (29/09): câu vào sổ nợ vì em sai khi Lên bảng / Kiểm tra đầu giờ, KHÔNG thuộc chiến dịch hay ca nào. */
  qidSaiTaiLop?: Set<string>
  /** SỔ NỢ: câu nợ của chiến dịch ĐÃ ĐÓNG/hết hạn → tên + hạn (nhãn "Chiến dịch 'Tên' · 25/09"). */
  chienDichCuCuaCau?: Map<string, { ten: string; hanNop: string }>
  /** SỔ NỢ: trần lượt/ngày khi KHÔNG có chiến dịch = thể lực của chiến dịch vừa đóng gần nhất (mặc định 40). */
  theLucNoCu?: number
}

/** Thể lực/ngày của chiến dịch vừa đóng (hoặc hết hạn) gần nhất của em — trần kế hoạch ôn nợ khi không có chiến dịch. Không có ⇒ 40. */
export function theLucChienDichVuaDong(ds: readonly ChienDich[], homNay: string): number {
  const xong = ds.filter((c) => c.trangThai === 'da_dong' || (c.trangThai === 'dang_chay' && c.hanNop < homNay))
  xong.sort((a, b) => (a.hanNop > b.hanNop ? -1 : a.hanNop < b.hanNop ? 1 : a.taoLuc > b.taoLuc ? -1 : 1))
  return xong[0]?.theLucNgay || TRAN_NGAY
}

/**
 * SỔ NỢ (thầy chốt 29/09): câu em làm SAI khi Lên bảng (`len_bang`) hoặc Kiểm tra đầu giờ (`dau_gio`) ⇒ vào sổ nợ NGAY, kể cả câu không
 * thuộc chiến dịch nào. Trả qid → lúc sai SỚM NHẤT. Chỉ câu có trong kho game, không tự luận. Lỗi đọc ⇒ rỗng.
 */
export async function docQidSaiTaiLop(env: Env, sbd: string): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  const rows = (await env.DB.prepare(`SELECT qid, MIN(luc) AS luc FROM su_kien_hoc WHERE sbd = ? AND nguon IN ('len_bang','dau_gio') AND ket_qua = 0 AND COALESCE(qid,'') <> '' GROUP BY qid`)
    .bind(sbd).all<Row>().catch(() => ({ results: [] as Row[] }))).results ?? []
  if (!rows.length) return ra
  const hopLe = await cauKhoKhongTuLuan(env, rows.map((x) => str(x.qid)))
  for (const x of rows) if (hopLe.has(str(x.qid))) ra.set(str(x.qid), str(x.luc))
  return ra
}
/** Câu có trong kho game và KHÔNG tự luận. */
async function cauKhoKhongTuLuan(env: Env, qids: readonly string[]): Promise<Set<string>> {
  const ra = new Set<string>()
  if (!qids.length) return ra
  const kho = await env.DB.prepare('SELECT qid, json FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?))').bind(JSON.stringify([...new Set(qids)])).all<Row>().catch(() => ({ results: [] as Row[] }))
  const tuLuan = new Set<string>()
  for (const x of kho.results ?? []) {
    if (jsonLaTuLuan(x.json)) tuLuan.add(str(x.qid))
    else ra.add(str(x.qid))
  }
  for (const q of tuLuan) ra.delete(q)
  return ra
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
  // Tối ưu 28/09: câu sai của ca đã công bố (không phụ thuộc chiến dịch) đọc CÙNG ĐỢT với chiến dịch + mốc thêm.
  const [ds, mocThem, qidSaiCa, qidSaiLop] = await Promise.all([docChienDichCuaEm(env, sbd), docMocThemCuaEm(env, sbd), docQidSaiCaDaCongBo(env, sbd), docQidSaiTaiLop(env, sbd)])
  const dangChay = chienDichDangChay(ds, homNay)
  const hanTheoQid = new Map<string, string>()
  // Thầy 28/09: "khi giao chiến dịch đầu tiên tất cả không có câu ôn, không được lấy câu ôn trước đó" ⇒ câu của một chiến dịch chỉ tính lần làm TỪ LÚC GIAO chiến dịch ấy.
  const tuLucTheoQid = new Map<string, string>()
  const nguonTheoQid = new Map<string, 'chien_dich' | 'cu'>()
  if (dangChay) for (const q of dangChay.qids) { hanTheoQid.set(q, dangChay.hanNop); nguonTheoQid.set(q, 'chien_dich'); tuLucTheoQid.set(q, mocTinhCua(dangChay.mocBatDau, mocThem.get(dangChay.id))) }
  const cdCuaQid = new Map<string, ChienDich>()
  for (const c of ds) {
    if (c === dangChay || chuaBatDau(c, homNay)) continue // chiến dịch chưa bắt đầu: không phát câu nào của nó
    for (const q of c.qids) if (!nguonTheoQid.has(q)) { hanTheoQid.set(q, c.hanNop); nguonTheoQid.set(q, 'cu'); tuLucTheoQid.set(q, mocTinhCua(c.mocBatDau, mocThem.get(c.id))); cdCuaQid.set(q, c) }
  }
  // Nguồn thứ 3 `ca_sai`: câu sai/bỏ trống trong ca ĐÃ CÔNG BỐ. Câu đã thuộc chiến dịch ⇒ GIỮ nguồn chiến dịch (không nhân đôi).
  const qidCaSai = new Set<string>()
  for (const [q, luc] of qidSaiCa) {
    if (nguonTheoQid.has(q)) continue
    nguonTheoQid.set(q, 'cu')
    tuLucTheoQid.set(q, luc)
    qidCaSai.add(q)
  }
  // SỔ NỢ (29/09): câu sai khi Lên bảng / Kiểm tra đầu giờ ngoài mọi chiến dịch và ca ⇒ nợ (tính lần làm từ lần sai đầu).
  const qidSaiTaiLop = new Set<string>()
  for (const [q, luc] of qidSaiLop) {
    if (nguonTheoQid.has(q)) continue
    nguonTheoQid.set(q, 'cu')
    tuLucTheoQid.set(q, luc)
    qidSaiTaiLop.add(q)
  }
  const qids = [...nguonTheoQid.keys()]
  const [meta, lanLam, moc] = await Promise.all([docMetaCau(env, qids, dangChay?.maDe ?? []), docLanLam(env, sbd, qids), docMocDayLai(env, sbd)])
  const theoQid = new Map<string, LanLam[]>()
  for (const x of lanLam) if (x.luc >= (tuLucTheoQid.get(x.qid) ?? '')) theoQid.set(x.qid, [...(theoQid.get(x.qid) ?? []), x])
  const tt = new Map<string, TrangThaiCau>()
  const cau: CauSrs[] = []
  for (const qid of qids) {
    const m = meta.get(qid)
    if (!m || m.tuLuan) continue // câu đã rút khỏi kho / câu tự luận (30/09: không vào kế hoạch, không đếm thể lực; meta vẫn giữ để tra)
    const t = phatLaiCau(qid, theoQid.get(qid) ?? [], hanTheoQid.get(qid) ?? null, moc.get(qid) ?? [], { sao: m.sao, phan: m.phan, mucDo: m.mucDo })
    tt.set(qid, t)
    const nguon = nguonTheoQid.get(qid) === 'chien_dich' ? 'chien_dich' : t.thanhThao ? 'duy_tri' : t.laMoi ? null : 'no_cu'
    if (!nguon) continue // câu chiến dịch cũ em chưa từng gặp: không kéo sang
    cau.push({ qid, phan: m.phan, mucDo: m.mucDo, dang: m.dang, nguon, ...(m.sao ? { sao: m.sao } : {}) })
  }
  const chienDichCuCuaCau = new Map<string, { ten: string; hanNop: string }>()
  for (const [q, c] of cdCuaQid) if (c.trangThai === 'da_dong' || c.hanNop < homNay) chienDichCuCuaCau.set(q, { ten: c.ten, hanNop: c.hanNop })
  const lanLamChienDich = dangChay ? dangChay.qids.flatMap((q) => theoQid.get(q) ?? []) : []
  return { chienDich: dangChay, cau, meta, tt, ttChienDich: dangChay ? dangChay.qids.map((q) => tt.get(q)).filter((x): x is TrangThaiCau => !!x) : [], lanLamChienDich, qidCaSai, sapBatDau: chienDichSapBatDau(ds, homNay), qidSaiTaiLop, chienDichCuCuaCau, theLucNoCu: theLucChienDichVuaDong(ds, homNay) }
}

// ---------------------------------------------------------------- SỔ NỢ: lịch sử có nguồn + nhãn nợ (thầy chốt 29/09)
/** Một lần làm kèm nguồn đã phân loại (game tách Bi-a / Đoàn / Đảo theo phiên). */
export interface LanLamCoNguon { qid: string; ngay: string; luc: string; dung: boolean; nguon: NguonNhan }
const phanLoaiNguon = (nguon: string, bia: unknown, doan: unknown): NguonNhan =>
  nguon === 'thi' ? 'thi' : nguon === 'len_bang' ? 'len_bang' : nguon === 'dau_gio' ? 'dau_gio' : nguon !== 'game' ? 'khac' : Number(bia) === 1 ? 'bia' : doan != null ? 'doan' : 'dao'
/**
 * HỢP ĐỒNG (Kiểm tra đầu giờ đọc để hiện "Sai 20/09 (Ca) · Đúng 22/09 (Đoàn)"): TOÀN BỘ lịch sử làm các câu của em, theo giờ, bỏ lần bị che
 * (ca chưa công bố); bỏ trống tính là sai (như `docLanLam`). Lỗi đọc ⇒ `null`.
 */
export async function docLichSuCoNguon(env: Env, sbd: string, qids: readonly string[]): Promise<Map<string, LanLamCoNguon[]> | null> {
  const ra = new Map<string, LanLamCoNguon[]>()
  if (!qids.length) return ra
  const ds = JSON.stringify([...new Set(qids)])
  const sql = (coVis: boolean) => `SELECT s.qid, s.luc, s.ngay_vn, s.ket_qua, s.nguon, ${coVis ? 's.visibility' : 'NULL AS visibility'},
      COALESCE(json_extract(g.json, '$.bia'), 0) AS bia, json_extract(g.json, '$.doan') AS doan
    FROM su_kien_hoc s LEFT JOIN game_v2_session g ON s.nguon = 'game' AND g.id = s.ma_nguon
    WHERE s.sbd = ? AND s.qid IN (SELECT value FROM json_each(?)) ORDER BY s.luc`
  const r = await env.DB.prepare(sql(true)).bind(sbd, ds).all<Row>().catch(() => env.DB.prepare(sql(false)).bind(sbd, ds).all<Row>()).catch(() => null)
  if (!r) return null
  for (const x of r.results ?? []) {
    if (str(x.visibility) === 'embargoed') continue
    const q = str(x.qid)
    ra.set(q, [...(ra.get(q) ?? []), { qid: q, luc: str(x.luc), ngay: str(x.ngay_vn), dung: Number(x.ket_qua) === 1, nguon: phanLoaiNguon(str(x.nguon), x.bia, x.doan) }])
  }
  return ra
}
/**
 * Gắn nguồn vào `lichSu` (phatLaiCau) của một câu: `lichSu` = ĐUÔI của lịch sử đầy đủ (cắt từ mốc chiến dịch) ⇒ ghép theo số lần cuối.
 * Lịch sử đầy đủ ngắn hơn (lệch dữ liệu) ⇒ `null` (không gắn).
 */
export function ganNguonDuoi<T extends object>(lichSu: readonly T[], day: readonly { nguon: NguonNhan }[] | undefined): (T & { nguon: NguonNhan })[] | null {
  const ns = day ?? []
  if (ns.length < lichSu.length) return null
  const duoi = ns.slice(ns.length - lichSu.length)
  return lichSu.map((l, i) => ({ ...l, nguon: duoi[i]!.nguon }))
}
/**
 * Nhãn nợ của các câu (chỉ câu đã làm mà chưa thành thạo, kể cả "Cần thầy dạy lại"): "Sai 2 lần · Ca 26/09 · Lên bảng 28/09 · …".
 * Một truy vấn sổ. Lỗi đọc ⇒ nhãn không có nguồn ("Sai 2 lần · Sai 26/09"). Câu không nợ ⇒ không có trong kết quả.
 */
export async function docNhanNo(env: Env, sbd: string, hs: HoSo2, qids: readonly string[]): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  const can = [...new Set(qids)].filter((q) => { const t = hs.tt.get(q); return !!t && (laNo(t) || t.catTia) })
  if (!can.length) return ra
  const ls = await docLichSuCoNguon(env, sbd, can).catch(() => null)
  for (const q of can) {
    const t = hs.tt.get(q)!
    const lich = (ls && ganNguonDuoi(t.lichSu, ls.get(q))) ?? t.lichSu
    const n = nhanNo(lich, t.ngayChua ?? null, hs.chienDichCuCuaCau?.get(q) ?? null)
    if (n) ra.set(q, n)
  }
  return ra
}

// ---------------------------------------------------------------- SỔ NỢ cả lớp: ước lượt nợ cũ (Giao / Sửa chiến dịch, báo thầy)
/** Nợ cũ của một em: số câu nợ và số lượt tối thiểu còn cần (≈ 2 − cc lượt/câu, `khoiLuongCan`). */
export interface NoCuEm { soCau: number; luot: number }
/** Câu sai của NHIỀU em ngoài chiến dịch: ca ĐÃ CÔNG BỐ + Lên bảng / Kiểm tra đầu giờ. sbd → qid → lúc sai sớm nhất. Lỗi đọc ⇒ rỗng. */
async function docSaiNgoaiCaLop(env: Env, dsSbd: readonly string[]): Promise<Map<string, Map<string, string>>> {
  const ra = new Map<string, Map<string, string>>()
  const arr = JSON.stringify([...new Set(dsSbd)])
  const ca = (coVis: boolean) => `SELECT s.sbd, s.qid, MIN(s.luc) AS luc FROM su_kien_hoc s JOIN ca c ON c.ma_ca = s.ma_nguon
      WHERE s.sbd IN (SELECT value FROM json_each(?)) AND s.nguon = 'thi' AND COALESCE(s.ket_qua, 0) <> 1 AND c.trang_thai <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')}
        ${coVis ? "AND COALESCE(s.visibility, '') <> 'embargoed'" : ''} GROUP BY s.sbd, s.qid`
  const rCa = await env.DB.prepare(ca(true)).bind(arr).all<Row>().catch(() => env.DB.prepare(ca(false)).bind(arr).all<Row>()).catch(() => ({ results: [] as Row[] }))
  const rLop = await env.DB.prepare(`SELECT sbd, qid, MIN(luc) AS luc FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND nguon IN ('len_bang','dau_gio') AND ket_qua = 0 AND COALESCE(qid,'') <> '' GROUP BY sbd, qid`)
    .bind(arr).all<Row>().catch(() => ({ results: [] as Row[] }))
  const rows = [...(rCa.results ?? []), ...(rLop.results ?? [])]
  const hopLe = await cauKhoKhongTuLuan(env, rows.map((x) => str(x.qid)))
  for (const x of rows) {
    const s = str(x.sbd), q = str(x.qid), luc = str(x.luc)
    if (!hopLe.has(q)) continue
    const m = ra.get(s) ?? new Map<string, string>()
    if (!m.has(q) || luc < m.get(q)!) m.set(q, luc)
    ra.set(s, m)
  }
  return ra
}
/**
 * NỢ CŨ của nhiều em (thầy chốt 29/09): câu đã làm mà chưa thành thạo, chưa cắt tỉa, NGOÀI câu `boQids` và chiến dịch `boChienDichId`
 * (chiến dịch đang giao/sửa) — từ mọi chiến dịch khác đã bắt đầu + câu sai ở ca đã công bố / lên bảng / đầu giờ. Cùng luật `docHoSo2`
 * (lần làm tính từ mốc chiến dịch; mốc em được thêm; mốc dạy lại). Dùng để "Tự tính", trần Quá tải, Huyết Chiến, tự nâng khi Sửa
 * TÍNH CẢ lượt nợ cũ, và để báo thầy "Em X còn N câu nợ cũ — cần ≈ K ngày". Lỗi đọc ⇒ em không có nợ (hành vi cũ).
 */
export async function noCuCaLop(env: Env, dsSbd: readonly string[], homNay: string, boQids: Iterable<string>, boChienDichId: string | null = null): Promise<Map<string, NoCuEm>> {
  const ra = new Map<string, NoCuEm>(dsSbd.map((s) => [s, { soCau: 0, luot: 0 }]))
  if (!dsSbd.length) return ra
  const arr = JSON.stringify([...new Set(dsSbd)])
  const bo = new Set(boQids)
  const [rCd, rThem, saiNgoai, rMoc] = await Promise.all([
    env.DB.prepare("SELECT * FROM chien_dich WHERE trang_thai <> 'da_huy' AND EXISTS (SELECT 1 FROM json_each(chien_dich.sbd_json) WHERE value IN (SELECT value FROM json_each(?))) ORDER BY tao_luc DESC").bind(arr).all<Row>().catch(() => ({ results: [] as Row[] })),
    env.DB.prepare('SELECT sbd, chien_dich_id, them_luc FROM chien_dich_em WHERE sbd IN (SELECT value FROM json_each(?)) AND them_luc IS NOT NULL').bind(arr).all<Row>().catch(() => ({ results: [] as Row[] })),
    docSaiNgoaiCaLop(env, dsSbd).catch(() => new Map<string, Map<string, string>>()),
    env.DB.prepare('SELECT sbd, qid, luc FROM srs2_day_lai WHERE sbd IN (SELECT value FROM json_each(?))').bind(arr).all<Row>().catch(() => ({ results: [] as Row[] })),
  ])
  const dsCd = (await docChienDichKemBatDau(env, rCd.results ?? [])).filter((c) => c.id !== boChienDichId && !chuaBatDau(c, homNay))
  const them = new Map((rThem.results ?? []).map((x) => [`${str(x.sbd)}|${str(x.chien_dich_id)}`, str(x.them_luc)]))
  const moc = new Map<string, string[]>()
  for (const x of rMoc.results ?? []) { const k = `${str(x.sbd)}|${str(x.qid)}`; moc.set(k, [...(moc.get(k) ?? []), str(x.luc)]) }
  // Phạm vi từng em: qid → (hạn, mốc tính).
  const phamVi = new Map<string, Map<string, { han: string | null; tu: string }>>()
  const tatCa = new Set<string>()
  for (const s of dsSbd) {
    const m = new Map<string, { han: string | null; tu: string }>()
    for (const c of dsCd) {
      if (!c.sbd.includes(s)) continue
      for (const q of c.qids) if (!bo.has(q) && !m.has(q)) m.set(q, { han: c.hanNop, tu: mocTinhCua(c.mocBatDau, them.get(`${s}|${c.id}`)) })
    }
    for (const [q, luc] of saiNgoai.get(s) ?? []) if (!bo.has(q) && !m.has(q)) m.set(q, { han: null, tu: luc })
    for (const q of m.keys()) tatCa.add(q)
    phamVi.set(s, m)
  }
  if (!tatCa.size) return ra
  const qs = JSON.stringify([...tatCa])
  const [rLan, loai] = await Promise.all([
    env.DB.prepare(`SELECT sbd, qid, ngay_vn, luc, ket_qua, assistance, visibility, nguon FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND qid IN (SELECT value FROM json_each(?))`).bind(arr, qs).all<Row>()
      .catch(() => env.DB.prepare(`SELECT sbd, qid, ngay_vn, luc, ket_qua, nguon FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND qid IN (SELECT value FROM json_each(?))`).bind(arr, qs).all<Row>())
      .catch(() => ({ results: [] as Row[] })),
    docLoaiCau(env, [...tatCa]),
  ])
  const lan = new Map<string, LanLam[]>()
  for (const x of rLan.results ?? []) {
    if (str(x.visibility) === 'embargoed') continue
    const k = `${str(x.sbd)}|${str(x.qid)}`
    lan.set(k, [...(lan.get(k) ?? []), lanLamTuDong(x)])
  }
  for (const s of dsSbd) {
    const ds: TrangThaiCau[] = []
    for (const [q, pv] of phamVi.get(s)!) {
      const l = loai.get(q)
      if (!l) continue // câu đã rút khỏi kho
      const t = phatLaiCau(q, (lan.get(`${s}|${q}`) ?? []).filter((x) => x.luc >= pv.tu), pv.han, moc.get(`${s}|${q}`) ?? [], l)
      if (laNo(t)) ds.push(t)
    }
    ra.set(s, { soCau: ds.length, luot: khoiLuongCan(ds) })
  }
  return ra
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

/** Hạng theo dạng của em cho kế hoạch hôm nay (không chiến dịch ⇒ chỉ từ hồ sơ dạng). */
export async function docHangEm(env: Env, sbd: string, hs: HoSo2): Promise<{ hangTheoDang: Record<string, HangEm>; hangChung: HangEm } | null> {
  const cd = hs.chienDich
  const hoSoDang = (await docHoSoDangCaLop(env, [sbd])).get(sbd) ?? []
  // Không chiến dịch (Sổ nợ 29/09): vẫn cần hạng CHUNG để đan xen câu nợ theo sức em — chỉ từ hồ sơ dạng.
  if (!cd) return hangTuHoSo(hoSoDang, [], hs.meta, [], '')
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
  /**
   * Câu còn lại TẠM HOÃN hôm nay (sửa lỗi 29/09 "Đảo báo nhầm ca kiểm tra", rương kẹt 42/46): đã bỏ khỏi `dao/doan/con*` và `tong`.
   * `ca` = đang bảo vệ cho ca kiểm tra chưa công bố (`protectedQuestions`), `kho` = đã rút khỏi kho / JSON không nạp được,
   * `tuLuan` (30/09) = chỉ mục nay xem là câu tự luận (không phục vụ, lặng lẽ bỏ). Vắng = không có câu nào.
   */
  tamHoan?: { ca: number; kho: number; tuLuan?: number }
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
/**
 * Kế hoạch hôm nay cho game/rương/thể lực: kế hoạch ĐÃ CHỐT (`layKeHoachChot`, không đổi bản ghi) trừ đi câu CÒN LẠI không làm được lúc này
 * (`tamHoanCauKhoa`): đang bảo vệ cho ca kiểm tra, hoặc đã rút khỏi kho. Nhờ vậy em không bị kẹt (Đảo rỗng, Đảo khoá chờ Đoàn, rương 42/46);
 * câu bảo vệ vẫn KHÔNG ra máy em. Ca công bố xong ⇒ câu tự quay lại kế hoạch hôm nay (không ghi gì vào `srs2_ke_hoach`).
 */
export async function layKeHoachHomNay(env: Env, sbd: string, nowMs: number, hs?: HoSo2): Promise<{ kh: KeHoachDaChot; hs: HoSo2 }> {
  // 29/09 (cao điểm 20h–24h): tập câu bảo vệ ca thi (dùng chung mọi em, đệm 5 s trong isolate) đọc SONG SONG với kế hoạch — trước: một đợt D1 nối tiếp sau kế hoạch.
  const chanSom = protectedQuestions(env).catch(() => new Set<string>())
  const r = await layKeHoachChot(env, sbd, nowMs, hs)
  return { kh: await tamHoanCauKhoa(env, r.kh, r.hs, chanSom), hs: r.hs }
}

/** Câu CÒN LẠI không phục vụ được vì kho: đã rút / JSON không nạp được (`kho`) hay chỉ mục nay xem là tự luận (`tuLuan`). Câu bị ca khoá KHÔNG tính ở đây. */
export const lyDoKhongPhucVu = (m: MetaCau | undefined): 'kho' | 'tuLuan' | null => (!m ? 'kho' : m.tuLuan ? 'tuLuan' : null)
/**
 * Bỏ câu CÒN LẠI đang bị ca khoá / đã rút khỏi kho / tự luận (30/09) khỏi kế hoạch (câu đã làm giữ nguyên) — thể lực, rương, trần Bi-a đều theo `tong` sau khi bỏ.
 * Lỗi đọc bảo vệ ⇒ không bỏ câu ca (nơi phát câu vẫn tự chặn). Không ghi gì vào `srs2_ke_hoach`.
 */
export async function tamHoanCauKhoa(env: Env, kh: KeHoachDaChot, hs: Pick<HoSo2, 'meta'>, chanSom?: Promise<Set<string>>): Promise<KeHoachDaChot> {
  if (!kh.conDao.length && !kh.conDoan.length) return kh
  const chan = await (chanSom ?? protectedQuestions(env).catch(() => new Set<string>()))
  let ca = 0, kho = 0, tuLuan = 0
  const bo = new Set<string>()
  for (const k of [...kh.conDao, ...kh.conDoan]) {
    const q = qidGoc(k), m = hs.meta.get(q)
    const ly = lyDoKhongPhucVu(m)
    if (ly === 'kho') { bo.add(k); kho++ } else if (ly === 'tuLuan') { bo.add(k); tuLuan++ } else if (chan.has(q) || chan.has(m!.group)) { bo.add(k); ca++ }
  }
  if (!bo.size) return kh
  const dao = kh.dao.filter((k) => !bo.has(k)), doan = kh.doan.filter((k) => !bo.has(k))
  return { ...kh, dao, doan, tong: dao.length + doan.length, conDao: kh.conDao.filter((k) => !bo.has(k)), conDoan: kh.conDoan.filter((k) => !bo.has(k)), tamHoan: { ca, kho, ...(tuLuan ? { tuLuan } : {}) } }
}

async function layKeHoachChot(env: Env, sbd: string, nowMs: number, hs?: HoSo2): Promise<{ kh: KeHoachDaChot; hs: HoSo2 }> {
  const ngay = ngayVnCua(nowMs)
  // Tối ưu 28/09: hồ sơ, số lần làm hôm nay và kế hoạch đã chốt là ba lượt ĐỌC độc lập ⇒ chạy SONG SONG (trước: ba đợt nối tiếp).
  const [hoSo, dem, cu] = await Promise.all([
    hs ?? docHoSo2(env, sbd, ngay),
    docDemHomNay(env, sbd, ngay),
    env.DB.prepare('SELECT * FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>().catch(() => null),
  ])
  const cd = hoSo.chienDich
  // SỔ NỢ (29/09): không chiến dịch ⇒ trần = thể lực của chiến dịch vừa đóng gần nhất (mặc định 40).
  const tranNgay = cd?.theLucNgay ?? hoSo.theLucNoCu
  const tuyChonGoc = { homNay: ngay, hanNop: cd?.hanNop ?? null, ...(tranNgay ? { tranNgay } : {}), ...(cd ? { tranHuyetChien: cd.huyetChien ? tranHuyetChienTheo(cd.theLucNgay) : cd.theLucNgay, raiDeu: cd.raiDeu } : {}) }
  // Bốc câu mới cá nhân hoá (thầy 28/09): hạng theo dạng CHỈ đọc khi thật sự lập kế hoạch (kế hoạch đã chốt thì khỏi đọc).
  // Lỗi đọc hồ sơ ⇒ không có hạng ⇒ hành vi cũ (dễ trước), không làm hỏng kế hoạch.
  const tuyChonLap = async (): Promise<TuyChonKeHoach> => ({ ...tuyChonGoc, ...((await docHangEm(env, sbd, hoSo).catch(() => null)) ?? {}) })
  if (cu) {
    let kh = tuDong(cu, ngay, dem)
    // Thầy 28/09 ("đã giao chiến dịch test nhưng không bấm vào làm được"): kế hoạch chốt LÚC CHƯA CÓ chiến dịch (hoặc chiến dịch khác)
    // thì LẬP LẠI theo chiến dịch hiện tại — giữ các câu đã làm hôm nay (vẫn trừ vào thể lực), thêm câu mới của kế hoạch.
    // Kế hoạch đã chốt có câu ÔN (Đoàn) mà theo luật hiện tại là câu MỚI (thầy 28/09: bỏ câu ôn lấy từ lịch sử trước chiến dịch) ⇒ cũng lập lại.
    const onSaiLuat = kh.conDoan.some((k) => hoSo.tt.get(qidGoc(k))?.laMoi)
    // 30/09 (sửa lỗi "Chưa tải được câu hôm nay", rương kẹt 48/49): kế hoạch chốt còn câu KHÔNG PHỤC VỤ ĐƯỢC (chỉ mục nay xem là tự luận / đã rút khỏi kho)
    // ⇒ cũng lập lại bằng đúng cơ chế này: giữ câu đã làm, câu hỏng bị thay bằng câu hợp lệ theo luật ngày (quota rải đều trừ phần câu mới đã làm).
    const coCauKhongPhucVu = [...kh.conDao, ...kh.conDoan].some((k) => lyDoKhongPhucVu(hoSo.meta.get(qidGoc(k))) !== null)
    if ((kh.chienDichId ?? null) !== (cd?.id ?? null) || onSaiLuat || coCauKhongPhucVu) {
      const xongDao = kh.dao.filter((k) => !kh.conDao.includes(k))
      const xongDoan = kh.doan.filter((k) => !kh.conDoan.includes(k))
      // Câu MỚI của kế hoạch hôm nay em đã làm: lần làm đầu tiên (từ mốc chiến dịch) rơi đúng hôm nay ⇒ quota rải đều hôm nay trừ đi phần này.
      const moiDaLamHomNay = new Set([...xongDao, ...xongDoan].map(qidGoc).filter((q) => hoSo.tt.get(q)?.lichSu[0]?.ngay === ngay)).size
      const lap = lapKeHoachNgay(hoSo.cau, hoSo.tt, { ...(await tuyChonLap()), moiDaLamHomNay }, xongDao.length + xongDoan.length)
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
  // Tối ưu 28/09: rương hôm nay (khoá theo ngày VN, không phụ thuộc kế hoạch) đọc SONG SONG với kế hoạch.
  const [{ kh, hs }, ruong] = await Promise.all([
    layKeHoachHomNay(env, sbd, nowMs),
    env.DB.prepare('SELECT mo_luc, qua_json FROM ruong_bat_linh WHERE sbd = ? AND ngay = ?').bind(sbd, ngayVnCua(nowMs)).first<Row>().catch(() => null),
  ])
  const cd = hs.chienDich
  const tl = tiLeChienDich(hs.ttChienDich)
  const conLai = kh.conDao.length + kh.conDoan.length
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
    // 30/09: số câu CÒN LẠI đang tạm giữ vì ca kiểm tra mở — CHỈ số, không qid/mã ca (Sảnh báo rõ thay vì "chưa có câu").
    ...((kh.tamHoan?.ca ?? 0) > 0 ? { tamGiu: { ca: kh.tamHoan!.ca } } : {}),
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
  const tranNgay = cd?.theLucNgay ?? hoSo.theLucNoCu
  const tuyChon = { homNay: ngay, hanNop: cd?.hanNop ?? null, ...(tranNgay ? { tranNgay } : {}), ...(cd ? { tranHuyetChien: cd.huyetChien ? tranHuyetChienTheo(cd.theLucNgay) : cd.theLucNgay, raiDeu: cd.raiDeu } : {}), ...(hang ?? {}) }
  const lap = lapKeHoachNgay(hoSo.cau, hoSo.tt, tuyChon)
  const cu = await env.DB.prepare('SELECT chien_dich_id, tong, tao_luc, dao_json, doan_json FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>().catch((e) => ({ loi: String(e) }) as Row)
  const cauCd = hoSo.cau.filter((c) => c.nguon === 'chien_dich')
  return {
    ok: true, ngay, sbd,
    coHoa2: await cheDo2(env, sbd),
    chienDichCuaEm: dsCd.map((c) => ({ id: c.id, ten: c.ten, trangThai: c.trangThai, hanNop: c.hanNop, batDau: c.batDau, soCau: c.qids.length })),
    chienDichDangChay: cd ? { id: cd.id, hanNop: cd.hanNop, theLucNgay: cd.theLucNgay, soQid: cd.qids.length, raiDeu: cd.raiDeu } : null,
    soMetaTimThay: hoSo.meta.size,
    soCauTuLuanBiBo: [...hoSo.meta.values()].filter((m) => m.tuLuan).length,
    soCauTrongHoSo: hoSo.cau.length,
    soCauChienDich: cauCd.length,
    soCauMoi: cauCd.filter((c) => hoSo.tt.get(c.qid)?.laMoi).length,
    keHoachDaChot: cu ? { chienDichId: cu.chien_dich_id ?? null, tong: cu.tong ?? null, taoLuc: cu.tao_luc ?? null, loi: (cu as Row).loi ?? null } : null,
    lapLaiSeRa: { dao: lap.dao.length, doan: lap.doan.length, huyetChien: lap.huyetChien, raiDeu: lap.raiDeu },
    hangTheoDang: hang?.hangTheoDang ?? null,
    hangChung: hang?.hangChung ?? null,
  }
}
