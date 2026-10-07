// TU LUYỆN — máy chủ (29/09/2026). Hợp đồng: docs/hop-dong-tu-luyen-2909.md. Bảng: server/migration-2909-tu-luyen.sql.
//
// Thầy chốt: "đặt ở sảnh bật lại 4 chế độ, giữ nguyên thuật toán của từng chế độ … hiển thị đáp án đúng chuẩn … tu luyện cho hs
// luyện thủ công không tính exp gì không liên quan gì đến các câu trong game, độc lập một chỗ, có thêm tổng hợp đánh giá".
//
// KHÁC khối Khắc phục cũ (KhoiKhacPhuc3CheDo.tsx): khối cũ tải NGUYÊN gói kho (có đáp án) xuống máy em rồi rút + chấm tại máy.
// Ở đây MÁY CHỦ rút bằng ĐÚNG các hàm cũ (src/lib/thuat-toan-rut-cau-sai.ts: rutDsThemDangCauSai · rutDsDangBai · rutDsTuDo);
// riêng CHẾ ĐỘ 1 đổi luật theo lệnh thầy 30/09 (tu-luyen-cau-sai.ts: kho câu sai từ 29/09 ở ca kiểm tra + chiến dịch, chọn câu chưa/ít luyện, trộn dễ/khó), gửi máy em CÂU CÔNG KHAI (không đáp án, không lời giải), cất phần riêng trong `tu_luyen_luot`,
// và CHẤM khi em nộp bằng luật chung (`chamCauTuLuyen` → `khopPhanIII`). Sau nộp mới trả đáp án + lời giải.
//
// v3 (30/09, thầy duyệt "LÀM LUÔN"): KHO CÂU SAI CHUNG (tu-luyen-cau-sai.ts `docKhoCauSai`: ca đã công bố + chiến dịch/game + Luyện đề cấu trúc
// + Tu luyện, từ 29/09) là nguồn của chế độ 1, 2, 4; KHÔNG chế độ nào còn "Đang khoá" vì kho trống (dự phòng 3 tầng ở chế độ 2, toàn kho ở chế độ 4);
// "Chấm từng câu" (`cham-cau`) và ÔN CÁCH QUÃNG cho câu trong kho (bảng `tu_luyen_khac_phuc`).
//
// ĐỘC LẬP: chỉ đọc (su_kien_hoc · cauKhacPhucGoi · deTheoDangBai · danhMucDangBai — mấy lệnh ấy đã gỡ câu của ca đang bảo vệ và câu tự luận)
// và chỉ ghi bảng riêng `tu_luyen_*` (lượt, câu, chấm từng câu, khắc phục). KHÔNG EXP/vàng/mảnh, KHÔNG su_kien_hoc, KHÔNG kế hoạch ngày,
// KHÔNG qid_da_lam, KHÔNG trần game — nên không ảnh hưởng chọn câu của Đảo / Đoàn / Bi-a hay chiến dịch.
import { dongBoTuLuyen, nhanKetQuaTuLuyenChung } from './chua-cau-sai-tu-luyen'
import type { Env } from './kieu'
import { gameIdentity } from './game-v2-auth'
import { docKhoiEm } from './game-v2-bank'
import { dbGoc } from './cau-hinh-dem'
import { coCaDangMo } from './bi-a'
import { docBaoVeKho, LOI_CHUA_KIEM_BAO_VE } from './bao-ve-kho-cong-khai'
import { cauKhacPhucGoi, danhMucDangBai, deTheoDangBai } from './goi-cu'
import { omniBat } from './omni-d1'
import { thuMucCuaMaDe } from './kho-thu-muc'
import type { TeacherExamSource } from '../../src/data/examContent'
import type { CauLuyen } from '../../src/lib/bai-tap-pdf'
import { buildTeacherSourceFromKhoDe, parseKhoDeJson } from '../../src/lib/exam-kho-de-import'
import { duocChonLop, lopEmDuocChon, nguonHopKhoi } from '../../src/lib/khac-phuc-khoi'
import { khoiCuaCau, khoiCuaMaDe, type Khoi } from '../../src/lib/khoi-cau'
import { chanKhacKhoiEm } from './chan-khac-khoi'
import { thayCauSaiTheoThang } from './tu-luyen-thang'
import { hopLeDeRut } from '../../src/lib/loc-cau-rut'
import { laCauTuLuan } from '../../src/lib/cau-tu-luan'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import {
  SQL_BANG_KHAC_PHUC,
  capNhatKhacPhuc,
  cauLuyenTuCauGame,
  chonCauSai,
  chuSauCham,
  docKhacPhuc,
  docKhoCauSai,
  docLanLuyen,
  docNoiDung,
  lenhGhiKhacPhuc,
  nhanConMotLan,
  nhanLanLuyen,
  nhanSaiGoc,
  qidGoc,
  saiCuoiMs,
  tranSoCauCheDo1,
  tron,
  type KhoCauSai,
  type TrangThaiKhacPhuc,
} from './tu-luyen-cau-sai'
import { LOI_CHUA_CHON_NGUON, demTheoNguon, docDsNguon, locTheoNguon, type LoaiNguonSai } from './tu-luyen-cau-sai'
import {
  phanTichTyLeDang,
  rutDsDangBai,
  rutDsThemDangCauSai,
  rutDsTuDo,
  ungVienTuDo,
  khopBoLocTuDo,
  demCauDangBai,
  type CauSaiDauVao,
} from '../../src/lib/thuat-toan-rut-cau-sai-loi'
import {
  SO_CAU_MAC_DINH,
  TEN_CHE_DO,
  TRAN_CAU_TU_LUYEN,
  cauCongKhaiTu,
  chamCauTuLuyen,
  loiGiaiTuCauRieng,
  type CauCongKhai,
  type CauRieng,
  type CheDoTuLuyen,
  type KetQuaCau,
  type LopDangBaiTL,
} from '../../src/lib/tu-luyen'

type Obj = Record<string, unknown>
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v))
const LUA_CHON_TU_DO = new Set(['ngau_nhien', 'sao_2', 'sao_1', 'ly_thuyet', 'bai_tap'])
/** Gói câu xin kho mỗi lượt — đúng số máy em cũ xin (`SO_CAU_XIN_KHO` của kho-cho-may-em.ts). */
const SO_CAU_XIN_KHO = 200
export const LOI_CHUA_BAT = 'Máy chủ chưa bật Tu luyện. Em quay lại sau nhé.'
export const LOI_DANG_THI = 'Em đang có ca kiểm tra mở nên Tu luyện tạm khoá. Làm xong ca kiểm tra rồi luyện tiếp nhé.'

// ------------------------------------------------------------------ bảng (dựng tại chỗ)
/**
 * CI deploy KHÔNG tự chạy migration ⇒ dựng bảng CHỈ-THÊM ngay tại chỗ, y hệt `server/migration-2909-tu-luyen.sql` (mẫu `damBaoBangBia`).
 * `IF NOT EXISTS` nên chạy lại vô hại; mỗi CSDL một lần mỗi isolate; lỗi ⇒ lượt sau thử lại. Test khoá: câu ở đây = câu trong tệp migration.
 */
export const SQL_BANG_TU_LUYEN: readonly string[] = [
  'CREATE TABLE IF NOT EXISTS tu_luyen_luot ( id TEXT PRIMARY KEY, sbd TEXT NOT NULL, che_do INTEGER NOT NULL, tieu_de TEXT NOT NULL DEFAULT \'\', tham_so_json TEXT NOT NULL DEFAULT \'{}\', de_rieng_json TEXT NOT NULL DEFAULT \'[]\', de_cong_khai_json TEXT NOT NULL DEFAULT \'[]\', so_cau INTEGER NOT NULL DEFAULT 0, so_dung INTEGER NOT NULL DEFAULT 0, diem REAL, giay INTEGER NOT NULL DEFAULT 0, trang_thai TEXT NOT NULL DEFAULT \'dang_lam\', tao_luc INTEGER NOT NULL, nop_luc INTEGER )',
  'CREATE INDEX IF NOT EXISTS idx_tu_luyen_luot_sbd ON tu_luyen_luot(sbd, tao_luc)',
  'CREATE TABLE IF NOT EXISTS tu_luyen_cau ( luot_id TEXT NOT NULL, sbd TEXT NOT NULL, che_do INTEGER NOT NULL, qid TEXT NOT NULL, phan TEXT NOT NULL, dung INTEGER NOT NULL DEFAULT 0, diem REAL NOT NULL DEFAULT 0, tra_loi TEXT NOT NULL DEFAULT \'\', dang_ma TEXT NOT NULL DEFAULT \'\', dang_ten TEXT NOT NULL DEFAULT \'\', bai TEXT NOT NULL DEFAULT \'\', lop TEXT NOT NULL DEFAULT \'\', sao INTEGER NOT NULL DEFAULT 0, giay INTEGER NOT NULL DEFAULT 0, co_goi_y INTEGER NOT NULL DEFAULT 0, nop_luc INTEGER NOT NULL, PRIMARY KEY (luot_id, qid) )',
  'CREATE INDEX IF NOT EXISTS idx_tu_luyen_cau_sbd ON tu_luyen_cau(sbd, nop_luc)',
]
const bangDaDung = new WeakMap<object, Promise<void>>()
export function damBaoBangTuLuyen(env: Env): Promise<void> {
  const db = dbGoc(env.DB as unknown as object) // bản session/bộ đếm bọc D1 ⇒ vẫn MỘT lần mỗi isolate
  let p = bangDaDung.get(db)
  if (!p) {
    p = env.DB.batch([...SQL_BANG_TU_LUYEN, ...SQL_BANG_KHAC_PHUC].map((s) => env.DB.prepare(s))).then(() => undefined)
    p.catch(() => bangDaDung.delete(db))
    bangDaDung.set(db, p)
  }
  return p
}

/** Xác thực: SBD LUÔN lấy từ token của em (không nhận `sbd` trần). */
async function emCua(env: Env, b: Obj): Promise<string> {
  return gameIdentity(env, b)
}

// ------------------------------------------------------------------ OMNI 3: câu MỚI chỉ từ tờ TU LUYỆN (kho-thu-muc.ts)
// Luật kho (DAC-TA-BUILD-OMNI-3-0510.md mục 2): khi OMNI bật cho em, câu mới / câu rút thêm / câu bù kho của MỌI chế độ chỉ lấy từ tờ thư mục
// TU LUYỆN (tờ DẠY HỌC dành cho tick bài và game); kho CÂU SAI của em giữ nguyên mọi nguồn (chế độ 1 và câu sai làm "mồi" ở chế độ 2, 4).
// Cờ tắt (hoặc đọc cờ lỗi) ⇒ không một truy vấn nào thêm, Tu luyện y hệt cũ.

/** OMNI bật cho em? (omni-d1 `omniBat`; lỗi ⇒ tắt). */
const omniCuaEm = (env: Env, sbd: string): Promise<boolean> => omniBat(env, sbd).catch(() => false)

/** Giữ phần tử thuộc tờ TU LUYỆN (thư mục tra theo mã gốc; thiếu dòng ⇒ luật lùi: mã "DH-" là DẠY HỌC). */
async function chiToTuLuyen<T>(env: Env, ds: readonly T[], maCua: (x: T) => string): Promise<T[]> {
  if (!ds.length) return []
  const tm = await thuMucCuaMaDe(env, [...new Set(ds.map(maCua))])
  return ds.filter((x) => tm.get(maCua(x)) === 'TU_LUYEN')
}

/** qid các câu thuộc tờ KHÔNG phải TU LUYỆN trong các chuyên đề — đưa vào `loaiTru` để `cauKhacPhucGoi` không phí chỗ (200 câu, 8–40 tờ) cho câu DẠY HỌC. */
async function qidNgoaiTuLuyen(env: Env, chuyenDe: readonly string[]): Promise<string[]> {
  if (!chuyenDe.length) return []
  const r = await env.DB.prepare(`SELECT c.qid, c.ma_de FROM cau_hoi c JOIN de_kho d ON d.ma_de = c.ma_de
      WHERE d.da_xoa = 0 AND c.chuyen_de IN (SELECT value FROM json_each(?)) LIMIT 3000`).bind(JSON.stringify(chuyenDe)).all<Obj>().catch(() => ({ results: [] as Obj[] }))
  const dong = (r.results ?? []).map((x) => ({ qid: str(x.qid), maDe: str(x.ma_de) })).filter((x) => x.qid && x.maDe)
  if (!dong.length) return []
  const tm = await thuMucCuaMaDe(env, [...new Set(dong.map((x) => x.maDe))])
  return dong.filter((x) => tm.get(x.maDe) !== 'TU_LUYEN').map((x) => x.qid)
}

/** Danh mục Dạng bài chỉ còn dạng (tờ DB-…) thuộc TU LUYỆN; bài/lớp rỗng thì bỏ. */
async function danhMucTuLuyen(env: Env, lops: LopDangBaiTL[]): Promise<LopDangBaiTL[]> {
  const ma = [...new Set(lops.flatMap((l) => l.bais.flatMap((b) => b.dangs.map((d) => d.ma))))]
  if (!ma.length) return lops
  const tm = await thuMucCuaMaDe(env, ma)
  return lops
    .map((l) => ({ ...l, bais: l.bais.map((b) => ({ ...b, dangs: b.dangs.filter((d) => tm.get(d.ma) === 'TU_LUYEN') })).filter((b) => b.dangs.length) }))
    .filter((l) => l.bais.length)
}

// ------------------------------------------------------------------ nạp nguồn (y hệt đường của máy em cũ, nhưng chạy ở máy chủ)

/** Chuyên đề của từng câu (bảng `cau_hoi`; thiếu thì lấy cột chuyen_de của sổ). Cần cho `cauKhacPhucGoi` (xin kho theo chuyên đề). */
async function docChuyenDe(env: Env, qids: string[]): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  if (!qids.length) return ra
  const j = JSON.stringify(qids.slice(0, 800))
  const r = await env.DB.prepare('SELECT qid, chuyen_de FROM cau_hoi WHERE qid IN (SELECT value FROM json_each(?))').bind(j).all<Obj>().catch(() => ({ results: [] as Obj[] }))
  for (const x of r.results ?? []) if (str(x.chuyen_de).trim()) ra.set(str(x.qid), str(x.chuyen_de).trim())
  if (ra.size < qids.length) {
    const s = await env.DB.prepare("SELECT qid, MAX(chuyen_de) AS chuyen_de FROM su_kien_hoc WHERE qid IN (SELECT value FROM json_each(?)) AND COALESCE(chuyen_de, '') <> '' GROUP BY qid")
      .bind(j).all<Obj>().catch(() => ({ results: [] as Obj[] }))
    for (const x of s.results ?? []) if (!ra.has(str(x.qid))) ra.set(str(x.qid), str(x.chuyen_de).trim())
  }
  return ra
}

/** Câu (chỉ mục game, CÓ đáp án) → đầu vào `CauSaiDauVao` của thuật toán cũ (phanTichTyLeDang / rutDsThemDangCauSai / khoTheoCauSai). */
function cauSaiDauVaoTu(ds: readonly PrivateQuestion[], chuyenDe: Map<string, string>): CauSaiDauVao[] {
  return ds.map((q, i) => ({
    qid: q.qid,
    soCau: i + 1,
    phan: q.phan,
    chuyenDe: chuyenDe.get(q.qid) ?? '',
    mucDo: q.mucDo ?? undefined,
    dapAnDung: str(q.correct),
    text: q.text,
    ...(q.phan === 'I' ? { choices: q.choices, choiceImgs: q.choiceImgs } : q.phan === 'II' ? { ideas: q.ideas, ideaImgs: q.ideaImgs } : {}),
    table: q.table,
    thanCauImg: q.thanCauImg,
    imageDataUrl: q.imageDataUrl,
    hinhAnh: q.hinhAnh,
    dangMa: q.dang ?? undefined,
    dang: q.tenDang || q.dang || undefined,
    kienThuc: q.kienThuc,
    maCa: q.maDe,
  }))
}

/** Kho câu sai (kho chung) ⇒ `CauSaiDauVao` — đã qua cửa `hopLeDeRut` như khối cũ. */
async function cauSaiTuKho(env: Env, kho: KhoCauSai): Promise<CauSaiDauVao[]> {
  const cd = await docChuyenDe(env, kho.ds.map((c) => c.qid))
  return cauSaiDauVaoTu(kho.ds.map((c) => c.q), cd).filter((c) => hopLeDeRut({ phan: c.phan, maDe: c.maCa, dapAnDung: c.dapAnDung, text: c.text, choices: c.choices || c.ideas }))
}

// ------------------------------------------------------------------ DỰ PHÒNG khi kho câu sai trống (thầy 30/09: "không bao giờ khoá")

export type KieuNguonDang = 'cau_sai' | 'yeu' | 'chuong' | 'pho_bien'
export const NHAN_NGUON_DANG: Record<KieuNguonDang, string> = {
  cau_sai: 'Theo câu sai của em',
  yeu: 'Theo dạng em còn yếu',
  chuong: 'Theo chương đang học',
  pho_bien: 'Theo dạng phổ biến của lớp em',
}
export const LOI_KHONG_LOP = 'Tài khoản của em chưa có lớp nên chưa chọn được câu để luyện. Em báo thầy thêm lớp nhé.'
/** Số dạng tối đa mỗi tầng dự phòng, số câu đại diện tối đa mỗi dạng. */
const SO_DANG_DU_PHONG = 5
const SO_DAI_DIEN = 6
const qidsTuJson = (v: unknown): string[] => {
  try { const a = JSON.parse(str(v) || '[]'); return Array.isArray(a) ? [...new Set(a.map(str).filter(Boolean))] : [] } catch { return [] }
}

/** Tầng 1 — DẠNG EM ĐÚNG ÍT NHẤT theo hồ sơ (sổ su_kien_hoc, cả game), mỗi dạng ≥ 3 lần làm. Trả mã dạng + câu em đã làm ở dạng ấy. */
async function dangYeuTheoHoSo(env: Env, sbd: string): Promise<{ ma: string; qids: string[] }[]> {
  const r = await env.DB.prepare(`SELECT ma_dang, json_group_array(qid) AS qids FROM su_kien_hoc
      WHERE sbd = ? AND COALESCE(ma_dang, '') <> '' AND ket_qua IS NOT NULL AND COALESCE(qid, '') <> ''
      GROUP BY ma_dang HAVING COUNT(*) >= 3
      ORDER BY (1.0 * SUM(CASE WHEN ket_qua = 1 THEN 1 ELSE 0 END) / COUNT(*)) ASC, COUNT(*) DESC LIMIT ?`).bind(sbd, SO_DANG_DU_PHONG).all<Obj>().catch(() => ({ results: [] as Obj[] }))
  return (r.results ?? []).map((x) => ({ ma: str(x.ma_dang), qids: qidsTuJson(x.qids).slice(-SO_DAI_DIEN) }))
}

/** Tầng 2 — dạng của CHƯƠNG ĐANG HỌC: câu của chiến dịch đang chạy mới nhất có em, gom theo dạng (nhiều câu trước). */
async function dangTheoChienDich(env: Env, sbd: string): Promise<{ ma: string; qids: string[] }[]> {
  const cd = await env.DB.prepare("SELECT qid_json FROM chien_dich WHERE trang_thai = 'dang_chay' AND EXISTS (SELECT 1 FROM json_each(chien_dich.sbd_json) WHERE value = ?) ORDER BY tao_luc DESC LIMIT 1")
    .bind(sbd).first<Obj>().catch(() => null)
  const qids = cd ? qidsTuJson(cd.qid_json) : []
  if (!qids.length) return []
  const r = await env.DB.prepare(`SELECT dang, json_group_array(qid) AS qids FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?)) AND COALESCE(dang, '') <> ''
      GROUP BY dang ORDER BY COUNT(*) DESC LIMIT ?`).bind(JSON.stringify(qids.slice(0, 1500)), SO_DANG_DU_PHONG).all<Obj>().catch(() => ({ results: [] as Obj[] }))
  return (r.results ?? []).map((x) => ({ ma: str(x.dang), qids: qidsTuJson(x.qids).slice(0, SO_DAI_DIEN) }))
}

/** Tầng 3 — DẠNG PHỔ BIẾN của lớp em: dạng nhiều câu nhất trong các tờ ĐÚNG khối em (không có thì khối thấp hơn). Không rõ khối ⇒ rỗng. */
async function dangPhoBienCuaLop(env: Env, khoiEm: Khoi | null): Promise<{ ma: string; qids: string[] }[]> {
  if (khoiEm === null) return []
  const r = await env.DB.prepare(`SELECT q.ma_de, q.dang, COUNT(*) AS n FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de
      JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc
     WHERE COALESCE(d.da_xoa, 0) = 0 AND COALESCE(q.dang, '') <> '' GROUP BY q.ma_de, q.dang`).all<Obj>().catch(() => ({ results: [] as Obj[] }))
  const dong = (r.results ?? []).map((x) => ({ maDe: str(x.ma_de), dang: str(x.dang), n: Number(x.n) || 0, k: khoiCuaMaDe(str(x.ma_de)) }))
  const dungKhoi = dong.filter((x) => x.k === khoiEm)
  const chon = dungKhoi // LUẬT THẦY 05/10: chỉ dạng của tờ ĐÚNG khối em (trước đây thiếu thì lấy tờ khối thấp hơn)
  const tong = new Map<string, { n: number; maDe: Set<string> }>()
  for (const x of chon) {
    const t = tong.get(x.dang) ?? { n: 0, maDe: new Set<string>() }
    t.n += x.n
    t.maDe.add(x.maDe)
    tong.set(x.dang, t)
  }
  const top = [...tong.entries()].sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0])).slice(0, SO_DANG_DU_PHONG)
  const ra: { ma: string; qids: string[] }[] = []
  for (const [ma, t] of top) {
    const q = await env.DB.prepare('SELECT qid FROM game_v2_question WHERE dang = ? AND ma_de IN (SELECT value FROM json_each(?)) LIMIT ?')
      .bind(ma, JSON.stringify([...t.maDe]), SO_DAI_DIEN).all<Obj>().catch(() => ({ results: [] as Obj[] }))
    ra.push({ ma, qids: (q.results ?? []).map((x) => str(x.qid)) })
  }
  return ra
}

/** Câu ĐẠI DIỆN của các dạng dự phòng ⇒ đầu vào của thuật toán cũ (mỗi dạng một nhóm câu thật, không bịa câu). */
async function daiDienDang(env: Env, dsDang: { ma: string; qids: string[] }[]): Promise<CauSaiDauVao[]> {
  const nd = await docNoiDung(env, [...new Set(dsDang.flatMap((d) => d.qids))])
  const cau: PrivateQuestion[] = []
  for (const d of dsDang) for (const qid of d.qids) {
    const x = nd.get(qid)
    if (x && !laCauTuLuan(x.q) && (x.q.dang ?? '') === d.ma) cau.push(x.q)
  }
  const cd = await docChuyenDe(env, cau.map((q) => q.qid))
  return cauSaiDauVaoTu(cau, cd).filter((c) => c.chuyenDe && hopLeDeRut({ phan: c.phan, maDe: c.maCa, dapAnDung: c.dapAnDung, text: c.text, choices: c.choices || c.ideas }))
}

/**
 * CHẾ ĐỘ 2 — nguồn "câu sai" cho thuật toán CŨ theo thứ tự: kho câu sai chung → dạng em còn yếu → chương đang học → dạng phổ biến của lớp.
 * Mỗi tầng chạy ĐÚNG `phanTichTyLeDang` trên kho cùng chuyên đề; tầng nào rút được câu (tongToiDa > 0) thì dùng tầng ấy.
 */
async function nguonCheDo2(env: Env, sbd: string, khoiEm: Khoi | null, kho: KhoCauSai, omni = false): Promise<{ kieu: KieuNguonDang; dsCauSai: CauSaiDauVao[]; khoDe: TeacherExamSource[] } | { loi: string }> {
  let loi = ''
  const tang: [KieuNguonDang, () => Promise<CauSaiDauVao[]>][] = [
    ['cau_sai', () => (kho.ds.length ? cauSaiTuKho(env, kho) : Promise.resolve([]))],
    ['yeu', async () => daiDienDang(env, await dangYeuTheoHoSo(env, sbd))],
    ['chuong', async () => daiDienDang(env, await dangTheoChienDich(env, sbd))],
    ['pho_bien', async () => daiDienDang(env, await dangPhoBienCuaLop(env, khoiEm))],
  ]
  for (const [kieu, lay] of tang) {
    const dsCauSai = await lay()
    if (!dsCauSai.length) continue
    const k = await khoTheoCauSai(env, sbd, dsCauSai, khoiEm, omni)
    if (!k.kho.length) { loi = loi || k.loi; continue }
    if (phanTichTyLeDang(dsCauSai, k.kho).tongToiDa > 0) return { kieu, dsCauSai, khoDe: k.kho }
  }
  return { loi: khoiEm === null ? LOI_KHONG_LOP : loi || 'Kho đề chưa có câu nào hợp với em. Em thử chế độ Dạng bài nhé.' }
}

/**
 * CHẾ ĐỘ 4 dự phòng — TOÀN KHO theo lớp ≤ khối em (giữ bộ lọc sao / lý thuyết–bài tập / ngẫu nhiên của `khopBoLocTuDo`, bỏ tự luận,
 * bỏ câu đang bảo vệ, khử trùng nhóm nội dung). Đọc một mẫu NGẪU NHIÊN của chỉ mục (không tải cả kho).
 */
const MAU_TOAN_KHO = 400
async function ungVienToanKho(env: Env, khoiEm: Khoi | null, loc: ReadonlySet<string>, omni = false): Promise<{ ds: CauLuyen[]; dang: Map<string, { ma: string; ten: string }>; loi: string }> {
  const dang = new Map<string, { ma: string; ten: string }>()
  if (khoiEm === null) return { ds: [], dang, loi: LOI_KHONG_LOP }
  const baoVe = await docBaoVeKho(env)
  if (!baoVe) return { ds: [], dang, loi: LOI_CHUA_KIEM_BAO_VE }
  const r = await env.DB.prepare(`SELECT q.qid, q.content_group, q.json, q.ma_de FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de
      JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc
     WHERE COALESCE(d.da_xoa, 0) = 0 ORDER BY RANDOM() LIMIT ?`).bind(MAU_TOAN_KHO).all<Obj>().catch(() => ({ results: [] as Obj[] }))
  // OMNI 3: mẫu toàn kho chỉ giữ câu của tờ TU LUYỆN.
  const dong = omni ? await chiToTuLuyen(env, r.results ?? [], (x) => str(x.ma_de)) : r.results ?? []
  const nhom = new Set<string>()
  const ds: CauLuyen[] = []
  for (const x of dong) {
    let q: PrivateQuestion
    try { q = JSON.parse(str(x.json)) as PrivateQuestion } catch { continue }
    const k = khoiCuaCau(q) // LUẬT THẦY 05/10: mọi nguồn khối của câu (mã tờ, mã câu, chương) phải KHỚP và ĐÚNG khối em
    const g = str(x.content_group)
    if (k !== khoiEm || laCauTuLuan(q) || baoVe.has(q.qid) || (g && baoVe.has(g)) || (g && nhom.has(g))) continue
    if (!hopLeDeRut({ phan: q.phan, maDe: q.maDe, dapAnDung: q.correct, text: q.text, choices: q.phan === 'II' ? q.ideas : q.choices })) continue
    const c = cauLuyenTuCauGame(q)
    if (!khopBoLocTuDo(loc, c)) continue
    if (g) nhom.add(g)
    ds.push(c)
    dang.set(c.id, { ma: str(q.dang), ten: str(q.tenDang) })
  }
  return { ds, dang, loi: ds.length ? '' : 'Không tìm thấy câu hợp với lựa chọn của em.' }
}

/** Kho câu cùng chuyên đề/dạng với câu sai — `napKhoChoMayEm` chuyển sang máy chủ (gọi thẳng `cauKhacPhucGoi`).
 *  `omni` (OMNI 3): chỉ câu của tờ TU LUYỆN — loại câu tờ khác ngay từ `loaiTru`, rồi lọc lại tờ trả về (lưới an toàn). */
async function khoTheoCauSai(env: Env, sbd: string, dsCauSai: CauSaiDauVao[], khoiEm: Khoi | null, omni = false): Promise<{ kho: TeacherExamSource[]; loi: string }> {
  const chuyenDe = [...new Set(dsCauSai.map((c) => str(c.chuyenDe).trim()).filter(Boolean))]
  if (chuyenDe.length === 0) return { kho: [], loi: 'Các câu sai chưa gắn chuyên đề nên chưa tìm được câu cùng dạng.' }
  const maCa = str(dsCauSai.find((c) => c.maCa)?.maCa)
  const loaiTruSai = dsCauSai.map((c) => str(c.qid)).filter(Boolean)
  const loaiTru = omni ? [...new Set([...loaiTruSai, ...(await qidNgoaiTuLuyen(env, chuyenDe))])] : loaiTruSai
  const dsDang = [...new Set(dsCauSai.map((c) => str(c.dangMa).trim()).filter(Boolean))]
  const kq = await cauKhacPhucGoi(env, { maCa, sbd, chuyenDe, loaiTru, soCau: SO_CAU_XIN_KHO, ...(dsDang.length ? { dsDang } : {}) })
  if (kq.ok === false) return { kho: [], loi: str(kq.error) || 'Không xin được kho từ máy chủ.' }
  const nguon: TeacherExamSource[] = []
  for (const x of Array.isArray(kq.items) ? kq.items : []) {
    const doc = parseKhoDeJson(x)
    if (!doc.ok || !doc.json) continue
    const dung = buildTeacherSourceFromKhoDe(doc.json)
    if (dung.errors.length === 0) nguon.push(dung.source)
  }
  const khoHop = nguonHopKhoi(khoiEm, nguon)
  const kho = omni ? await chiToTuLuyen(env, khoHop, (s) => str(s.maDe)) : khoHop
  return { kho, loi: kho.length ? '' : 'Chưa tìm được câu nào cùng dạng trong kho.' }
}

/** Danh mục Lớp → Bài → Dạng, CHỈ lớp em được chọn (không vượt khối em — luật Boss 21/09). */
function locDanhMuc(kq: Obj, khoiEm: Khoi | null): { lops: LopDangBaiTL[]; loi: string } {
  if (kq.ok === false) return { lops: [], loi: str(kq.error) || 'Chưa đọc được danh mục dạng bài.' }
  return { lops: lopEmDuocChon(khoiEm, (Array.isArray(kq.lops) ? kq.lops : []) as LopDangBaiTL[]), loi: '' }
}

/** Tờ dạng bài (DB-…) → nguồn. Chỉ nhận mã có trong danh mục của em. */
async function khoDangBai(env: Env, dsMa: string[], khoiEm: Khoi | null): Promise<{ kho: TeacherExamSource[]; loi: string }> {
  const nguon: TeacherExamSource[] = []
  let loi = ''
  for (const ma of dsMa) {
    const kq = await deTheoDangBai(env, { ma })
    if (!kq.de) { loi = loi || str(kq.error); continue }
    const doc = parseKhoDeJson(kq.de)
    if (!doc.ok || !doc.json) continue
    const dung = buildTeacherSourceFromKhoDe(doc.json)
    if (dung.errors.length === 0) nguon.push(dung.source)
  }
  const kho = nguonHopKhoi(khoiEm, nguon)
  return { kho, loi: kho.length ? '' : loi || 'Dạng bài này chưa có câu trong kho.' }
}

// ------------------------------------------------------------------ tham số từ máy em (đọc CHẶT, kẹp lại)

interface ThamSo {
  cheDo: CheDoTuLuyen
  soCau: number
  dsMaCa: string[]
  dsDang: string[]
  mucDo: string[]
  /** Chế độ 1: nguồn câu sai em tick (null = máy bản cũ không gửi ⇒ mọi nguồn). */
  nguon: Set<LoaiNguonSai> | null
}
function docThamSo(b: Obj): ThamSo | null {
  const cheDo = Number(b.cheDo)
  if (![1, 2, 3, 4].includes(cheDo)) return null
  const mang = (v: unknown, tran: number) => (Array.isArray(v) ? v.map((x) => str(x).trim()).filter(Boolean).slice(0, tran) : [])
  const soCau = Math.max(1, Math.min(TRAN_CAU_TU_LUYEN, Math.floor(Number(b.soCau)) || SO_CAU_MAC_DINH))
  return {
    cheDo: cheDo as CheDoTuLuyen,
    soCau,
    dsMaCa: mang(b.dsMaCa, 40),
    dsDang: mang(b.dsDang, 30).filter((m) => /^DB-[A-Za-z0-9-]+$/.test(m)),
    mucDo: mang(b.mucDo, 5).filter((m) => LUA_CHON_TU_DO.has(m)),
    nguon: cheDo === 1 ? docDsNguon(b.nguon) : null,
  }
}

/** Mã dạng trong danh mục của em ⇒ { tên dạng, bài, lớp }. */
function banDoDanhMuc(lops: LopDangBaiTL[]): Map<string, { ten: string; bai: string; lop: string }> {
  const m = new Map<string, { ten: string; bai: string; lop: string }>()
  for (const l of lops) for (const b of l.bais) for (const d of b.dangs) m.set(d.ma, { ten: d.ten, bai: b.tenBai, lop: l.lop })
  return m
}

/** Nhãn dạng của từng câu trong kho: khoá `<mã đề>|<qid>` ⇒ { mã, tên } (đúng cách `nhanKho` của thuật toán cũ khoá câu). */
function nhanDangKho(kho: TeacherExamSource[]): Map<string, { ma: string; ten: string }> {
  const m = new Map<string, { ma: string; ten: string }>()
  for (const de of kho) for (const q of [...de.phanI, ...de.phanII, ...de.phanIII]) {
    const ma = str(q.dang?.ma).trim(), ten = str(q.dang?.ten).trim()
    if (ma || ten) m.set(`${de.maDe}|${q.id}`, { ma, ten: ten || ma })
  }
  return m
}

// ------------------------------------------------------------------ /hs/tu-luyen/nguon — thứ em cần để chọn chế độ (KHÔNG đáp án)

/** Dạng nên luyện (cho nút gợi ý ở trạng thái chúc mừng của chế độ 1): dạng em còn yếu, không có thì dạng của chương đang học. */
async function dangNenLuyen(env: Env, ds: readonly { ma: string }[]): Promise<{ ma: string; ten: string } | null> {
  const d = ds[0]
  if (!d) return null
  const r = await env.DB.prepare("SELECT json_extract(json, '$.tenDang') AS ten FROM game_v2_question WHERE dang = ? AND COALESCE(json_extract(json, '$.tenDang'), '') <> '' LIMIT 1")
    .bind(d.ma).first<Obj>().catch(() => null)
  return { ma: d.ma, ten: str(r?.ten) || d.ma }
}

export async function tuLuyenNguon(env: Env, sbd: string): Promise<Obj> {
  // MỌI lượt đọc chạy SONG SONG (quét tối ưu 30/09): khối em ‖ danh mục thô ‖ kho câu sai chung ‖ ca đang mở; danh mục lọc theo khối ở bước cuối.
  // Hai tầng dự phòng đầu (dạng yếu, chương đang học) đọc CÙNG đợt để thẻ ghi đúng nguồn mà không thêm đợt D1.
  const [khoiEm, dmTho, kcs, dangThi, yeu, chuong, omni] = await Promise.all([
    docKhoiEm(env, sbd).catch(() => null),
    danhMucDangBai(env).catch((e) => ({ ok: false, error: e instanceof Error ? e.message : '' }) as Obj),
    docKhoCauSai(env, sbd).catch((e): KhoCauSai => ({ ds: [], tuCa: 0, tuChienDich: 0, tuLuyenDe: 0, tuTuLuyen: 0, tong: 0, daKhacPhuc: 0, lichSu: [], loi: e instanceof Error ? 'Chưa đọc được kho câu sai. Em thử lại sau.' : '' })),
    coCaDangMo(env, sbd, Date.now()).catch(() => false),
    dangYeuTheoHoSo(env, sbd).catch(() => []),
    dangTheoChienDich(env, sbd).catch(() => []),
    omniCuaEm(env, sbd),
  ])
  const dm0 = locDanhMuc(dmTho, khoiEm)
  // OMNI 3: danh mục chế độ Dạng bài chỉ còn dạng của thư mục TU LUYỆN (đúng luật rút ở `chayCheDo`).
  const dm = omni ? { ...dm0, lops: await danhMucTuLuyen(env, dm0.lops) } : dm0
  const kieu2: KieuNguonDang | null = kcs.ds.length ? 'cau_sai' : yeu.length ? 'yeu' : chuong.length ? 'chuong' : khoiEm === null ? null : 'pho_bien'
  const nenLuyen = kcs.ds.length ? null : await dangNenLuyen(env, [...yeu, ...chuong]).catch(() => null)
  const now = Date.now()
  return {
    ok: true,
    khoi: khoiEm,
    // Trường cũ (máy em bản trước): nay tính từ KHO CÂU SAI CHUNG, không còn tick theo ca.
    cacCa: [],
    soCauSai: kcs.ds.length,
    loiCauSai: kcs.loi,
    danhMuc: dm.lops,
    loiDanhMuc: dm.loi,
    // KHO CÂU SAI CHUNG từ 29/09 (chế độ 1, 2, 4): còn trong kho + bộ đếm khắc phục.
    khoCauSai: {
      tong: kcs.ds.length, tuCa: kcs.tuCa, tuChienDich: kcs.tuChienDich, tuLuyenDe: kcs.tuLuyenDe, tuTuLuyen: kcs.tuTuLuyen, loi: kcs.loi,
      tongTuMoc: kcs.tong, daKhacPhuc: kcs.daKhacPhuc,
      // Chọn nguồn (30/09): đếm theo từng nguồn + theo mặt nạ nguồn ⇒ máy em tính ngay tổng câu duy nhất khi em tick.
      ...demTheoNguon(kcs.ds),
      toiHan: kcs.ds.filter((c) => c.khacPhuc?.soDungLien === 1 && (c.khacPhuc.henLai ?? 0) <= now).length,
      choHen: kcs.ds.filter((c) => c.khacPhuc?.soDungLien === 1 && (c.khacPhuc.henLai ?? 0) > now).length,
    },
    // Chế độ 2: nguồn dạng đang dùng (thẻ ghi rõ). null ⇒ thật sự không thể (tài khoản chưa có lớp).
    dangCauSai: kieu2 ? { kieu: kieu2, nhan: NHAN_NGUON_DANG[kieu2] } : { kieu: '', nhan: '', loi: LOI_KHONG_LOP },
    // Chế độ 4: kho trống ⇒ rút từ toàn kho lớp ≤ khối em; không rõ khối ⇒ khoá có lý do.
    tuDo: kcs.ds.length ? { kieu: 'cau_sai', nhan: 'Theo câu sai của em' } : khoiEm !== null ? { kieu: 'toan_kho', nhan: `Toàn kho lớp ${khoiEm}` } : { kieu: '', nhan: '', loi: LOI_KHONG_LOP },
    dangNenLuyen: nenLuyen,
    dangThi,
  }
}

// ------------------------------------------------------------------ xem trước (số câu tối đa cho thanh chọn) + rút

interface KetQuaRutTho {
  dsCau: CauLuyen[]
  tongToiDa: number
  tieuDe: string
  meta: Map<string, { dangMa: string; dangTen: string; bai: string; lop: string }>
  loi: string
  /** Chế độ 2: thống kê theo dạng câu sai (để màn chọn nói rõ). */
  thongKe?: { tenDang: string; soCauSai: number; soUngVien: number }[]
  /** Chế độ 1: nhãn từng câu (theo mã câu trong lượt) — "Luyện lại lần K" + "Sai gốc: …" (+ "Còn 1 lần đúng nữa là khắc phục"). */
  nhan?: Map<string, { nhanLuyen: string; saiGoc: string; conMotLan: string; saiCuoi: number }>
  /**
   * Chế độ 1 (06/10, thang làm lại — tu-luyen-thang.ts): chỗ nào câu hiển thị là BẢN KHÁC của câu sai (hoặc nguyên văn có đếm) — theo mã câu trong lượt:
   * `tc` = câu sai gốc (đơn vị tiến độ: ôn cách quãng, số lần luyện), `hien` = qid câu em THẬT SỰ làm, `bac` = bậc thang. Ghi vào `de_rieng_json` của lượt.
   */
  thay?: Map<string, { tc: string; hien: string; bac: 'song_sinh' | 'anh_em' | 'xao' | 'nguyen_van' }>
  /** Chế độ 2: nguồn dạng đang dùng (câu sai / dạng còn yếu / chương đang học / dạng phổ biến). Chế độ 4: nguồn câu. */
  nguonDang?: { kieu: string; nhan: string }
}

/** Chạy ĐÚNG thuật toán của chế độ. `rut = false` ⇒ chỉ đếm (xem trước), không rút. */
async function chayCheDo(env: Env, sbd: string, t: ThamSo, rut: boolean): Promise<KetQuaRutTho> {
  // Khối em đọc SONG SONG với nguồn của từng chế độ (quét tối ưu 30/09) — chế độ 1 không cần khối nên không phải chờ thêm một đợt D1.
  const khoiP = docKhoiEm(env, sbd).catch(() => null)
  // OMNI 3 (cờ đọc song song): chế độ 2, 3, 4 lấy câu MỚI chỉ từ tờ TU LUYỆN; chế độ 1 là kho câu sai của em ⇒ không cần cờ.
  const omniP = t.cheDo === 1 ? Promise.resolve(false) : omniCuaEm(env, sbd)
  const meta = new Map<string, { dangMa: string; dangTen: string; bai: string; lop: string }>()
  const rong = (loi: string): KetQuaRutTho => ({ dsCau: [], tongToiDa: 0, tieuDe: '', meta, loi })
  const lopCua = (c: CauLuyen) => { const k = khoiCuaCau({ qid: c.id, maDe: c.maDe }); return k ? String(k) : '' }

  if (t.cheDo === 1) {
    // LUẬT 30/09 + v3: KHO CÂU SAI CHUNG từ 29/09 (ca đã công bố + chiến dịch/game + Luyện đề + Tu luyện); ưu tiên câu TỚI HẠN hẹn lại →
    // chưa luyện → luyện ít → lâu; câu đang chờ hẹn chỉ lấy khi kho cạn; thiếu thì lặp; trộn dễ/khó.
    const lanP = rut ? docLanLuyen(env, sbd) : null
    lanP?.catch(() => undefined) // lỗi đọc ⇒ ném đúng chỗ `await` dưới như cũ, không thành lỗi "chưa bắt"
    // Chọn nguồn (30/09): em tick 0 nguồn ⇒ không rút gì; chỉ lấy câu có ít nhất một lần sai thuộc nguồn đã tick.
    if (t.nguon && t.nguon.size === 0) return rong(LOI_CHUA_CHON_NGUON)
    const kho = await docKhoCauSai(env, sbd)
    if (kho.ds.length === 0) return rong(kho.loi)
    const dsKho = locTheoNguon(kho.ds, t.nguon)
    if (dsKho.length === 0) return rong('Nguồn em chọn không còn câu sai nào. Em chọn thêm nguồn khác.')
    if (!rut || !lanP) return { dsCau: [], tongToiDa: dsKho.length, tieuDe: '', meta, loi: '' }
    const lan = await lanP
    const theo = new Map(dsKho.map((c) => [c.qid, c]))
    const now = Date.now()
    const chon = chonCauSai(
      dsKho.map((c) => {
        const kp = c.khacPhuc
        const cho = !!kp && kp.soDungLien === 1 && !kp.daKhacPhucLuc
        return {
          qid: c.qid, kho: c.kho, soLanLuyen: lan.get(c.qid)?.n ?? 0, lanCuoi: lan.get(c.qid)?.cuoi ?? 0,
          toiHan: cho && (kp!.henLai ?? 0) <= now, choHen: cho && (kp!.henLai ?? 0) > now,
        }
      }),
      Math.min(t.soCau, tranSoCauCheDo1(dsKho.length, TRAN_CAU_TU_LUYEN)),
      Math.random,
    )
    const nhan = new Map<string, { nhanLuyen: string; saiGoc: string; conMotLan: string; saiCuoi: number }>()
    const thay = new Map<string, { tc: string; hien: string; bac: 'song_sinh' | 'anh_em' | 'xao' | 'nguyen_van' }>()
    const dsCau: CauLuyen[] = []
    // 06/10 THANG làm lại câu sai (tu-luyen-thang.ts): thứ tự + số câu + nhãn GIỮ NGUYÊN; câu đang trong cửa sổ lỗi hiển thị BẢN KHÁC (câu anh em đúng khối / song sinh / xáo),
    // không có bản khác ⇒ nguyên văn (lệnh thầy 30/09). Mã câu trong lượt vẫn là câu GỐC (đơn vị ôn cách quãng, đếm lần luyện, nhãn) — chỉ NỘI DUNG câu đổi.
    const hien = await thayCauSaiTheoThang(env, sbd, chon.map((x) => theo.get(x.qid)!.q), now)
    for (const [i, x] of chon.entries()) {
      const c = theo.get(x.qid)!
      const id = x.lap > 0 ? `${c.qid}~${x.lap + 1}` : c.qid
      const th = hien[i] ?? { q: c.q }
      const cl = { ...cauLuyenTuCauGame(th.q), id }
      dsCau.push(cl)
      meta.set(id, { dangMa: str(th.q.dang), dangTen: str(th.q.tenDang), bai: '', lop: lopCua({ ...cl, id: c.qid }) })
      nhan.set(id, { nhanLuyen: nhanLanLuyen(x.soLanLuyen + 1 + x.lap), saiGoc: nhanSaiGoc(c.lanSai, t.nguon), conMotLan: nhanConMotLan(c.khacPhuc), saiCuoi: saiCuoiMs(c.lanSai) })
      const bac = th.lamLai?.tc ? 'anh_em' : th.lamLai?.xt ? 'xao' : th.lamLai?.nv ? 'nguyen_van' : th.q.qid !== c.qid ? 'song_sinh' : null
      if (bac) thay.set(id, { tc: c.qid, hien: th.q.qid, bac })
    }
    return { dsCau, tongToiDa: dsKho.length, tieuDe: `Sửa câu sai · ${dsCau.length} câu`, meta, loi: '', nhan, ...(thay.size ? { thay } : {}) }
  }

  if (t.cheDo === 2 || t.cheDo === 4) {
    const [khoSai, khoiEm, omni] = await Promise.all([docKhoCauSai(env, sbd), khoiP, omniP])
    if (t.cheDo === 2) {
      // Chế độ 2 GIỮ thuật toán cũ (phanTichTyLeDang → rutDsThemDangCauSai), chỉ đổi NGUỒN: kho câu sai chung; kho trống ⇒ dự phòng 3 tầng.
      const ng = await nguonCheDo2(env, sbd, khoiEm, khoSai, omni)
      if ('loi' in ng) return rong(ng.loi)
      const nguonDang = { kieu: ng.kieu, nhan: NHAN_NGUON_DANG[ng.kieu] }
      const nhan = nhanDangKho(ng.khoDe)
      const pt = phanTichTyLeDang(ng.dsCauSai, ng.khoDe)
      const gom = new Map<string, { tenDang: string; soCauSai: number; soUngVien: number }>()
      for (const x of pt.thongKe) {
        const g = gom.get(x.nhanDan) ?? { tenDang: x.tenDang, soCauSai: 0, soUngVien: 0 }
        g.soCauSai++
        g.soUngVien = Math.max(g.soUngVien, x.soUngVienToiDa)
        gom.set(x.nhanDan, g)
      }
      const thongKe = [...gom.values()].sort((a, b) => b.soCauSai - a.soCauSai)
      if (!rut) return { dsCau: [], tongToiDa: pt.tongToiDa, tieuDe: '', meta, loi: '', thongKe, nguonDang }
      const { dsCau, tongToiDa } = rutDsThemDangCauSai(ng.dsCauSai, ng.khoDe, t.soCau)
      for (const c of dsCau) {
        const n = nhan.get(`${c.maDe}|${c.id}`)
        meta.set(c.id, { dangMa: n?.ma || str(c.chuaCho?.maDang), dangTen: n?.ten || str(c.chuaCho?.tenDang), bai: '', lop: lopCua(c) })
      }
      const tieuDe = ng.kieu === 'cau_sai' ? `Dạng câu sai · ${dsCau.length} câu cùng dạng` : `Dạng câu sai · ${NHAN_NGUON_DANG[ng.kieu].toLowerCase()} · ${dsCau.length} câu`
      return { dsCau, tongToiDa, tieuDe, meta, loi: dsCau.length ? '' : 'Kho đề chưa có câu nào cùng dạng câu sai của em.', thongKe, nguonDang }
    }
    // Chế độ 4 — bộ lọc cũ (sao / lý thuyết–bài tập / ngẫu nhiên) trên kho cùng chuyên đề với KHO CÂU SAI CHUNG; kho trống ⇒ TOÀN KHO lớp ≤ khối em.
    const loc = new Set(t.mucDo.length ? t.mucDo : ['ngau_nhien'])
    const nhanLoc = loc.has('ngau_nhien') ? ['Ngẫu nhiên'] : [loc.has('sao_2') && '2 sao', loc.has('sao_1') && '1 sao', loc.has('ly_thuyet') && 'Lý thuyết', loc.has('bai_tap') && 'Bài tập'].filter(Boolean)
    if (khoSai.ds.length) {
      const dsCauSai = await cauSaiTuKho(env, khoSai)
      const { kho } = dsCauSai.length ? await khoTheoCauSai(env, sbd, dsCauSai, khoiEm, omni) : { kho: [] as TeacherExamSource[] }
      if (kho.length && ungVienTuDo(kho, loc).length) {
        const nguonDang = { kieu: 'cau_sai', nhan: 'Theo câu sai của em' }
        if (!rut) return { dsCau: [], tongToiDa: ungVienTuDo(kho, loc).length, tieuDe: '', meta, loi: '', nguonDang }
        const nhan = nhanDangKho(kho)
        const { dsCau, tong } = rutDsTuDo(kho, loc, t.soCau)
        for (const c of dsCau) {
          const n = nhan.get(`${c.maDe}|${c.id}`)
          meta.set(c.id, { dangMa: n?.ma || str(c.chuaCho?.maDang), dangTen: n?.ten || str(c.chuaCho?.tenDang), bai: '', lop: lopCua(c) })
        }
        return { dsCau, tongToiDa: tong, tieuDe: `Tự do · ${nhanLoc.join(' + ')}`, meta, loi: dsCau.length ? '' : 'Không tìm thấy câu hợp với lựa chọn của em.', nguonDang }
      }
    }
    const tk = await ungVienToanKho(env, khoiEm, loc, omni)
    const nguonDang = { kieu: 'toan_kho', nhan: khoiEm !== null ? `Toàn kho lớp ${khoiEm}` : '' }
    if (!tk.ds.length) return { ...rong(tk.loi), nguonDang }
    if (!rut) return { dsCau: [], tongToiDa: tk.ds.length, tieuDe: '', meta, loi: '', nguonDang }
    const dsCau = tron(tk.ds, Math.random).slice(0, Math.min(t.soCau, tk.ds.length))
    for (const c of dsCau) meta.set(c.id, { dangMa: tk.dang.get(c.id)?.ma ?? '', dangTen: tk.dang.get(c.id)?.ten ?? '', bai: '', lop: lopCua(c) })
    return { dsCau, tongToiDa: tk.ds.length, tieuDe: `Tự do · ${nhanLoc.join(' + ')} · toàn kho`, meta, loi: '', nguonDang }
  }

  // Chế độ 3: Dạng bài — chỉ mã trong danh mục CỦA EM (không vượt khối).
  if (t.dsDang.length === 0) return rong('Em chọn ít nhất 1 dạng bài.')
  const [dmTho, khoiEm, omni] = await Promise.all([danhMucDangBai(env).catch((e) => ({ ok: false, error: e instanceof Error ? e.message : '' }) as Obj), khoiP, omniP])
  const dm = locDanhMuc(dmTho, khoiEm)
  // OMNI 3: chỉ dạng (tờ DB-…) thuộc TU LUYỆN mới rút được.
  const banDo = banDoDanhMuc(omni ? await danhMucTuLuyen(env, dm.lops) : dm.lops)
  const hopLe = t.dsDang.filter((m) => banDo.has(m) && duocChonLop(khoiEm, banDo.get(m)!.lop))
  if (hopLe.length === 0) return rong(dm.loi || 'Dạng bài em chọn không có trong danh mục lớp của em.')
  const { kho, loi } = await khoDangBai(env, hopLe, khoiEm)
  if (kho.length === 0) return rong(loi)
  if (!rut) return { dsCau: [], tongToiDa: demCauDangBai(kho), tieuDe: '', meta, loi: '' }
  const { dsCau, tong } = rutDsDangBai(kho, t.soCau)
  for (const c of dsCau) {
    const d = banDo.get(c.maDe)
    meta.set(c.id, { dangMa: c.maDe, dangTen: d?.ten ?? '', bai: d?.bai ?? '', lop: d?.lop ?? lopCua(c) })
  }
  const dau = banDo.get(hopLe[0])!
  const tieuDe = hopLe.length === 1 ? `Dạng bài · ${dau.ten}` : `Dạng bài · ${hopLe.length} dạng · Lớp ${dau.lop}`
  return { dsCau, tongToiDa: tong, tieuDe, meta, loi: dsCau.length ? '' : 'Không tìm thấy câu nào thuộc dạng bài đã chọn.' }
}

export async function tuLuyenXemTruoc(env: Env, sbd: string, b: Obj): Promise<Obj> {
  const t = docThamSo(b)
  if (!t) return { ok: false, error: 'Chế độ luyện không hợp lệ.' }
  const r = await chayCheDo(env, sbd, t, false)
  const them = { ...(r.thongKe ? { thongKe: r.thongKe } : {}), ...(r.nguonDang ? { nguonDang: r.nguonDang } : {}) }
  if (r.loi && r.tongToiDa === 0) return { ok: true, tongToiDa: 0, loi: r.loi, ...them }
  return { ok: true, tongToiDa: r.tongToiDa, ...them }
}

/** Bản câu công khai cất để XEM LẠI lượt cũ. Dòng D1 ≤ 2 MB ⇒ quá 1,5 triệu ký tự thì bỏ ẢNH nhúng data: (chữ đề vẫn đủ). */
export function congKhaiDeLuu(ds: CauCongKhai[]): string {
  const day = JSON.stringify(ds)
  if (day.length <= 1_500_000) return day
  const laData = (s: string | undefined) => !!s && s.startsWith('data:')
  return JSON.stringify(ds.map((c) => ({
    ...c,
    anhThanCau: laData(c.anhThanCau) ? undefined : c.anhThanCau,
    anhLuaChon: c.anhLuaChon?.map((a) => (laData(a) ? undefined : a)),
    hinh: c.hinh?.filter((h) => !laData(h.src)),
  })))
}

/** Mã lượt: 16 ký tự ngẫu nhiên (không đoán được). */
function maLuot(): string {
  const a = new Uint8Array(10)
  crypto.getRandomValues(a)
  return 'tl_' + [...a].map((x) => x.toString(36).padStart(2, '0')).join('').slice(0, 16)
}

export async function tuLuyenRut(env: Env, sbd: string, b: Obj): Promise<Obj> {
  const t = docThamSo(b)
  if (!t) return { ok: false, error: 'Chế độ luyện không hợp lệ.' }
  if (await coCaDangMo(env, sbd, Date.now()).catch(() => false)) return { ok: false, khoa: 'dang_kiem_tra', error: LOI_DANG_THI }
  // Lưới an toàn cuối: gỡ câu thuộc ca kiểm tra đang bảo vệ (qid) — các lệnh nguồn đã gỡ, ở đây gỡ lần nữa cho chắc (cả chế độ 1).
  const baoVe = await docBaoVeKho(env)
  if (!baoVe) return { ok: false, error: LOI_CHUA_KIEM_BAO_VE }
  const r = await chayCheDo(env, sbd, t, true)
  // `hien` (06/10): câu em THẬT SỰ làm (bản khác của câu sai) — cổng khối kiểm đúng câu ấy, không kiểm mã câu gốc.
  const dsCau = (await chanKhacKhoiEm(env, 'tu_luyen', sbd, r.dsCau.filter((c) => !laCauTuLuan(c) && !baoVe.has(qidGoc(c.id))), { cauCua: (c) => ({ qid: r.thay?.get(c.id)?.hien ?? qidGoc(c.id), maDe: c.maDe, dang: r.meta.get(c.id)?.dangMa }) })).slice(0, TRAN_CAU_TU_LUYEN) // LUẬT THẦY 05/10: cổng cuối — chỉ câu đúng khối em
  if (dsCau.length === 0) return { ok: false, error: r.loi || 'Không rút được câu nào. Em đổi lựa chọn rồi thử lại.' }

  const congKhai: CauCongKhai[] = []
  const rieng: (CauRieng & { tc?: string; hien?: string; bac?: string })[] = [] // + `tc`/`hien`/`bac`: ghi sổ thang làm lại (chỉ ở phần riêng của lượt, không xuống máy em)
  const daCo = new Set<string>()
  for (const c of dsCau) {
    if (daCo.has(c.id)) continue
    daCo.add(c.id)
    const m = r.meta.get(c.id) ?? { dangMa: '', dangTen: '', bai: '', lop: '' }
    const nh = r.nhan?.get(c.id)
    congKhai.push({ ...cauCongKhaiTu(c, m.dangTen), ...(nh ? { nhanLuyen: nh.nhanLuyen, saiGoc: nh.saiGoc, ...(nh.conMotLan ? { conMotLan: nh.conMotLan } : {}) } : {}) })
    rieng.push({
      qid: c.id, phan: c.phan, dapAn: c.dapAn, chot: c.chot, lyDo: c.lyDo, buoc: c.buoc, ketQua: c.ketQua,
      dangMa: m.dangMa, dangTen: m.dangTen, bai: m.bai, lop: m.lop, sao: c.sao === 2 || c.sao === 1 ? c.sao : 0,
      ...(nh ? { khoSai: true as const, saiCuoi: nh.saiCuoi } : {}),
      ...(r.thay?.get(c.id) ?? {}),
    })
  }
  const id = maLuot()
  const nay = Date.now()
  const tieuDe = r.tieuDe || TEN_CHE_DO[t.cheDo]
  try {
    await env.DB.prepare(
      `INSERT INTO tu_luyen_luot (id, sbd, che_do, tieu_de, tham_so_json, de_rieng_json, de_cong_khai_json, so_cau, trang_thai, tao_luc) VALUES (?,?,?,?,?,?,?,?, 'dang_lam', ?)`,
    ).bind(id, sbd, t.cheDo, tieuDe, JSON.stringify({ soCau: t.soCau, dsMaCa: t.dsMaCa, dsDang: t.dsDang, mucDo: t.mucDo, ...(t.nguon ? { nguon: [...t.nguon] } : {}) }), JSON.stringify(rieng), congKhaiDeLuu(congKhai), rieng.length, nay).run()
  } catch (e) {
    if (/no such table/i.test(String(e))) return { ok: false, error: LOI_CHUA_BAT }
    throw e
  }
  return { ok: true, luotId: id, cheDo: t.cheDo, tieuDe, taoLuc: nay, tongToiDa: r.tongToiDa, cau: congKhai, ...(r.nguonDang ? { nguonDang: r.nguonDang } : {}) }
}

// ------------------------------------------------------------------ nộp: CHẤM ở máy chủ, rồi mới trả đáp án + lời giải

/** 30/09 luật tự luận chặt: câu của lượt ĐANG LÀM mà nay là tự luận (đáp án không phải một số, mã -TL…) ⇒ bỏ qua: không chấm, không tính sai,
 *  không vào sổ, không cập nhật ôn cách quãng. Câu cất trong lượt không mang chữ đề ⇒ xét theo phần + qid + đáp án (đủ cho luật đáp án). */
export const cauRiengTuLuan = (c: Pick<CauRieng, 'phan' | 'qid' | 'dapAn'>): boolean => laCauTuLuan({ phan: c.phan, qid: qidGoc(c.qid), dapAn: c.dapAn })

function docRieng(json: unknown): CauRieng[] {
  try {
    const a = JSON.parse(str(json))
    return Array.isArray(a) ? (a as CauRieng[]) : []
  } catch {
    return []
  }
}

export async function tuLuyenNop(env: Env, sbd: string, b: Obj): Promise<Obj> {
  const luotId = str(b.luotId).trim()
  if (!/^tl_[a-z0-9]{6,20}$/.test(luotId)) return { ok: false, error: 'Không tìm thấy lượt luyện này.' }
  let dong: Obj | null
  try {
    dong = await env.DB.prepare('SELECT * FROM tu_luyen_luot WHERE id = ? AND sbd = ?').bind(luotId, sbd).first<Obj>()
  } catch (e) {
    if (/no such table/i.test(String(e))) return { ok: false, error: LOI_CHUA_BAT }
    throw e
  }
  if (!dong) return { ok: false, error: 'Không tìm thấy lượt luyện này.' }
  const daNopTruoc = str(dong.trang_thai) === 'da_nop'
  // Lượt đã nộp: trả đúng kết quả đã chốt (kể cả câu cũ). Lượt đang làm: bỏ câu tự luận (không chấm, không tính sai).
  const rieng = docRieng(dong.de_rieng_json).filter((c) => daNopTruoc || !cauRiengTuLuan(c))
  const traLoiVao = (b.traLoi && typeof b.traLoi === 'object' ? b.traLoi : {}) as Obj
  const giayCauVao = (b.giayCau && typeof b.giayCau === 'object' ? b.giayCau : {}) as Obj
  const coGoiY = new Set((Array.isArray(b.coGoiY) ? b.coGoiY : []).map(str))
  const daNop = str(dong.trang_thai) === 'da_nop'
  const baoVe = (await docBaoVeKho(env)) ?? null

  // Đã nộp rồi ⇒ trả lại ĐÚNG kết quả đã chốt (nộp lại không đổi gì — không chấm lần hai).
  let daChot = new Map<string, { traLoi: string; dung: boolean; diem: number }>()
  if (daNop) {
    const r = await env.DB.prepare('SELECT qid, tra_loi, dung, diem FROM tu_luyen_cau WHERE luot_id = ?').bind(luotId).all<Obj>()
    daChot = new Map((r.results ?? []).map((x) => [str(x.qid), { traLoi: str(x.tra_loi), dung: Number(x.dung) === 1, diem: Number(x.diem) || 0 }]))
  }
  // "Chấm từng câu": câu đã chấm trong lượt là KHOÁ — lúc nộp dùng đúng câu trả lời + kết quả đã chấm (máy em gửi khác cũng không đổi).
  const daChamCau = daNop ? new Map<string, { traLoi: string; dung: boolean; diem: number }>() : await docChamCau(env, luotId)
  const khacPhuc = rieng.some((c) => c.khoSai) ? await docKhacPhuc(env, sbd) : new Map<string, TrangThaiKhacPhuc>()
  const nay = daNop ? Number(dong.nop_luc) || Date.now() : Date.now()
  const giay = daNop ? Number(dong.giay) || 0 : Math.max(0, Math.min(6 * 3600, Math.round(Number(b.giay) || 0)))
  const ketQua: KetQuaCau[] = []
  const ghi = []
  const receiptNop=crypto.randomUUID()
  const congNop={sql:"EXISTS(SELECT 1 FROM tu_luyen_luot WHERE id=? AND sbd=? AND json_extract(tham_so_json,'$.chuaReceiptNop')=?)",params:[luotId,sbd,receiptNop]}
  let soDung = 0, tongDiem = 0
  for (const c of rieng) {
    const daCham = daChamCau.get(c.qid)
    const traLoi = daNop ? daChot.get(c.qid)?.traLoi ?? '' : daCham ? daCham.traLoi : str(traLoiVao[c.qid]).slice(0, 40)
    const cham = chamCauTuLuyen(c.phan, c.dapAn, traLoi)
    const dung = daNop ? daChot.get(c.qid)?.dung ?? cham.dung : daCham ? daCham.dung : cham.dung
    const diem = daNop ? daChot.get(c.qid)?.diem ?? cham.diem : daCham ? daCham.diem : cham.diem
    // ÔN CÁCH QUÃNG: câu của kho câu sai chưa chấm từng câu ⇒ cập nhật trạng thái ngay trong batch nộp (câu đã chấm từng câu đã cập nhật lúc chấm).
    let chuKhacPhuc = ''
    if (c.khoSai) {
      const goc = qidGoc(c.qid)
      if (!daNop && !daCham) {
        const moi = capNhatKhacPhuc(khacPhuc.get(goc), dung, nay, Number(c.saiCuoi) || 0)
        khacPhuc.set(goc, moi)
        ghi.push(lenhGhiKhacPhuc(env, sbd, goc, moi,congNop))
      }
      const tt = khacPhuc.get(goc)
      if (tt) chuKhacPhuc = chuSauCham(tt, dung)
    }
    if (dung) soDung++
    tongDiem += diem
    const an = !baoVe || baoVe.has(qidGoc(c.qid))
    ketQua.push({
      qid: c.qid, phan: c.phan, dung, diem, traLoi,
      dapAn: an ? '' : c.dapAn,
      ...(c.phan === 'II' ? { yDung: cham.yDung } : {}),
      ...(an ? { anDapAn: true as const } : { loiGiai: loiGiaiTuCauRieng(c) }),
      ...(chuKhacPhuc ? { khacPhuc: chuKhacPhuc } : {}),
    })
    if (!daNop) {
      ghi.push(env.DB.prepare(
        `INSERT OR IGNORE INTO tu_luyen_cau (luot_id, sbd, che_do, qid, phan, dung, diem, tra_loi, dang_ma, dang_ten, bai, lop, sao, giay, co_goi_y, nop_luc)
         SELECT ?,?,?,?,?,COALESCE((SELECT dung FROM tu_luyen_cham_cau WHERE luot_id=? AND qid=?),?),COALESCE((SELECT diem FROM tu_luyen_cham_cau WHERE luot_id=? AND qid=?),?),COALESCE((SELECT tra_loi FROM tu_luyen_cham_cau WHERE luot_id=? AND qid=?),?),?,?,?,?,?,?,?,? WHERE ${congNop.sql}`,
      ).bind(luotId, sbd, Number(dong.che_do), c.qid, c.phan,luotId,c.qid, dung ? 1 : 0,luotId,c.qid, diem,luotId,c.qid, traLoi, c.dangMa, c.dangTen, c.bai, c.lop, c.sao,
        Math.max(0, Math.min(3600, Math.round(Number(giayCauVao[c.qid]) || 0))), coGoiY.has(c.qid) ? 1 : 0, nay,...congNop.params))
    }
  }
  const diem10 = rieng.length ? Math.round((tongDiem / rieng.length) * 1000) / 100 : 0
  if (!daNop) {
    // Khoá lượt + mọi câu trong MỘT batch. Marker riêng khiến lượt thua không ghi đè receipt/tiến độ.
    try { await env.DB.batch([
      env.DB.prepare(`UPDATE tu_luyen_luot SET trang_thai='da_nop',nop_luc=?,so_dung=?,diem=?,giay=?,tham_so_json=json_set(CASE WHEN json_valid(tham_so_json) THEN tham_so_json ELSE '{}' END,'$.chuaReceiptNop',?) WHERE id=? AND sbd=? AND trang_thai='dang_lam'`).bind(nay,soDung,diem10,giay,receiptNop,luotId,sbd),
      ...ghi,
      env.DB.prepare(`UPDATE tu_luyen_luot SET so_dung=(SELECT COALESCE(SUM(dung),0) FROM tu_luyen_cau WHERE luot_id=?),diem=(SELECT CASE WHEN COUNT(*)>0 THEN ROUND(SUM(diem)*10/COUNT(*),2) ELSE 0 END FROM tu_luyen_cau WHERE luot_id=?) WHERE id=? AND sbd=? AND json_extract(tham_so_json,'$.chuaReceiptNop')=?`).bind(luotId,luotId,luotId,sbd,receiptNop),
    ]) } catch { return {ok:false,error:'Chưa lưu được lượt luyện. Câu trả lời vẫn ở máy em; em thử nộp lại.'} }
    // Trả bản đã khoá của người thắng, gồm cả câu chấm riêng đến trong khe trước batch.
    return tuLuyenNop(env,sbd,b)
  }
  if (!await dongBoTuLuyen(env,sbd,luotId)) return {ok:false,error:'Kết quả đã được giữ, đang chờ đồng bộ sổ học. Em gửi lại để hoàn tất.'}
  await nhanKetQuaTuLuyenChung(env,sbd,rieng,ketQua)
  return {
    ok: true,
    luotId,
    cheDo: Number(dong.che_do),
    tieuDe: str(dong.tieu_de),
    soCau: rieng.length,
    soDung,
    diem: diem10,
    giay,
    nopLuc: nay,
    cau: ketQua,
  }
}

/** Câu đã "chấm từng câu" trong một lượt (bảng chưa có ⇒ rỗng). */
async function docChamCau(env: Env, luotId: string): Promise<Map<string, { traLoi: string; dung: boolean; diem: number }>> {
  const r = await env.DB.prepare('SELECT qid, tra_loi, dung, diem FROM tu_luyen_cham_cau WHERE luot_id = ?').bind(luotId).all<Obj>().catch(() => ({ results: [] as Obj[] }))
  return new Map((r.results ?? []).map((x) => [str(x.qid), { traLoi: str(x.tra_loi), dung: Number(x.dung) === 1, diem: Number(x.diem) || 0 }]))
}

/**
 * CHẤM TỪNG CÂU (v3): em bấm "Kiểm tra" một câu ⇒ máy chủ chấm ĐÚNG câu ấy của lượt ĐANG LÀM (của chính em), KHOÁ câu (ghi `tu_luyen_cham_cau`,
 * chấm lại / gửi đáp án khác ⇒ trả đúng kết quả đã khoá), trả đáp án + lời giải của RIÊNG câu đó. Câu chưa chấm không lộ gì.
 * Câu của kho câu sai ⇒ cập nhật ôn cách quãng ngay.
 */
export async function tuLuyenChamCau(env: Env, sbd: string, b: Obj): Promise<Obj> {
  const luotId = str(b.luotId).trim()
  const qid = str(b.qid).trim()
  if (!/^tl_[a-z0-9]{6,20}$/.test(luotId) || !qid) return { ok: false, error: 'Không tìm thấy câu này trong lượt của em.' }
  const dong = await env.DB.prepare('SELECT trang_thai, de_rieng_json FROM tu_luyen_luot WHERE id = ? AND sbd = ?').bind(luotId, sbd).first<Obj>().catch(() => null)
  if (!dong) return { ok: false, error: 'Không tìm thấy lượt luyện này.' }
  if (str(dong.trang_thai) !== 'dang_lam') return { ok: false, error: 'Lượt này đã nộp rồi. Em xem kết quả ở màn kết quả nhé.' }
  const c = docRieng(dong.de_rieng_json).find((x) => x.qid === qid)
  if (!c) return { ok: false, error: 'Không tìm thấy câu này trong lượt của em.' }
  if (cauRiengTuLuan(c)) return { ok: false, tuLuan: true, error: 'Câu tự luận — không chấm tự động. Em bỏ qua câu này, máy không tính sai.' }
  const nay = Date.now()
  let chot = (await docChamCau(env, luotId)).get(qid)
  let khoaMoi = false
  if (!chot) {
    const traLoi = str(b.traLoi).slice(0, 40)
    if (!traLoi.replace(/-/g, '').trim()) return { ok: false, error: 'Em chọn đáp án rồi mới bấm Kiểm tra nhé.' }
    const cham = chamCauTuLuyen(c.phan, c.dapAn, traLoi)
    const r = await env.DB.prepare("INSERT OR IGNORE INTO tu_luyen_cham_cau (luot_id, sbd, qid, tra_loi, dung, diem, luc) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM tu_luyen_luot WHERE id=? AND sbd=? AND trang_thai='dang_lam')")
      .bind(luotId, sbd, qid, traLoi, cham.dung ? 1 : 0, cham.diem, nay,luotId,sbd).run()
    khoaMoi = Number(r.meta?.changes ?? 0) > 0
    chot = khoaMoi ? { traLoi, dung: cham.dung, diem: cham.diem } : (await docChamCau(env, luotId)).get(qid)
    if (!chot) return { ok: false, error: 'Chưa chấm được câu này. Em thử lại.' }
  }
  let chuKhacPhuc = ''
  if (c.khoSai) {
    const goc = qidGoc(qid)
    const cu = (await docKhacPhuc(env, sbd)).get(goc)
    // Chỉ lần chấm ĐẦU ghi trạng thái; bấm lại chỉ đọc (không cộng hai lần).
    const tt = khoaMoi ? capNhatKhacPhuc(cu, chot.dung, nay, Number(c.saiCuoi) || 0) : cu
    if (khoaMoi && tt) await lenhGhiKhacPhuc(env, sbd, goc, tt).run()
    if (tt) chuKhacPhuc = chuSauCham(tt, chot.dung)
  }
  const baoVe = await docBaoVeKho(env)
  const an = !baoVe || baoVe.has(qidGoc(qid))
  const cham = chamCauTuLuyen(c.phan, c.dapAn, chot.traLoi)
  const ketQua: KetQuaCau = {
    qid, phan: c.phan, dung: chot.dung, diem: chot.diem, traLoi: chot.traLoi,
    dapAn: an ? '' : c.dapAn,
    ...(c.phan === 'II' ? { yDung: cham.yDung } : {}),
    ...(an ? { anDapAn: true as const } : { loiGiai: loiGiaiTuCauRieng(c) }),
    ...(chuKhacPhuc ? { khacPhuc: chuKhacPhuc } : {}),
  }
  if (!await dongBoTuLuyen(env,sbd,luotId)) return {ok:false,error:'Câu trả lời đã được giữ, đang chờ đồng bộ sổ học. Em bấm kiểm tra lại để hoàn tất.'}
  await nhanKetQuaTuLuyenChung(env,sbd,[c],[ketQua])
  return { ok: true, khoa: true, ketQua }
}

/** XEM LẠI một lượt ĐÃ NỘP (bấm trong "Lượt gần đây"): câu công khai đã cất + kết quả đã chốt (đi đúng nhánh "đã nộp" của `tuLuyenNop`,
 * không chấm lại, không ghi gì). Lượt chưa nộp ⇒ từ chối (không trả đáp án khi em chưa nộp). */
export async function tuLuyenXemLuot(env: Env, sbd: string, b: Obj): Promise<Obj> {
  const luotId = str(b.luotId).trim()
  if (!/^tl_[a-z0-9]{6,20}$/.test(luotId)) return { ok: false, error: 'Không tìm thấy lượt luyện này.' }
  const dong = await env.DB.prepare('SELECT trang_thai, de_cong_khai_json FROM tu_luyen_luot WHERE id = ? AND sbd = ?').bind(luotId, sbd).first<Obj>()
  if (!dong) return { ok: false, error: 'Không tìm thấy lượt luyện này.' }
  if (str(dong.trang_thai) !== 'da_nop') return { ok: false, error: 'Lượt này chưa nộp nên chưa xem lại được.' }
  let cauCongKhai: CauCongKhai[] = []
  try { const a = JSON.parse(str(dong.de_cong_khai_json)); if (Array.isArray(a)) cauCongKhai = a as CauCongKhai[] } catch { /* bản cũ không cất ⇒ rỗng */ }
  if (cauCongKhai.length === 0) return { ok: false, error: 'Lượt này không còn bản đề để xem lại.' }
  const kq = await tuLuyenNop(env, sbd, { luotId })
  if (kq.ok !== true) return kq
  return { ...kq, cauCongKhai }
}

// ------------------------------------------------------------------ tổng hợp đánh giá (dữ liệu thô; máy em tính bằng `tongHopTuLuyen`)

export async function tuLuyenTongHop(env: Env, sbd: string): Promise<Obj> {
  try {
    const [l, c] = await Promise.all([
      env.DB.prepare(`SELECT id, che_do, tieu_de, tao_luc, nop_luc, so_cau, so_dung, giay FROM tu_luyen_luot
        WHERE sbd = ? AND trang_thai = 'da_nop' ORDER BY nop_luc DESC LIMIT 500`).bind(sbd).all<Obj>(),
      env.DB.prepare(`SELECT luot_id, che_do, nop_luc, qid, phan, dung, dang_ma, dang_ten, bai, lop, sao, giay FROM tu_luyen_cau
        WHERE sbd = ? ORDER BY nop_luc DESC LIMIT 6000`).bind(sbd).all<Obj>(),
    ])
    const [luyenDe, kho] = await Promise.all([docLuyenDeTongHop(env, sbd), docKhoCauSai(env, sbd).catch(() => null)])
    return {
      ok: true,
      luyenDe,
      khacPhuc: kho ? { tong: kho.tong, daKhacPhuc: kho.daKhacPhuc, lichSu: kho.lichSu.map((x) => ({ vao: x.vao, khacPhucLuc: x.khacPhucLuc })) } : null,
      luot: (l.results ?? []).map((x) => ({ id: str(x.id), cheDo: Number(x.che_do), tieuDe: str(x.tieu_de), taoLuc: Number(x.tao_luc), nopLuc: Number(x.nop_luc), soCau: Number(x.so_cau), soDung: Number(x.so_dung), giay: Number(x.giay) })),
      cau: (c.results ?? []).map((x) => ({
        luotId: str(x.luot_id), cheDo: Number(x.che_do), luc: Number(x.nop_luc), qid: str(x.qid), phan: str(x.phan), dung: Number(x.dung) === 1,
        dangMa: str(x.dang_ma), dangTen: str(x.dang_ten), bai: str(x.bai), lop: str(x.lop), sao: Number(x.sao) === 2 ? 2 : Number(x.sao) === 1 ? 1 : 0, giay: Number(x.giay) || 0,
      })),
    }
  } catch (e) {
    if (/no such table/i.test(String(e))) return { ok: true, luot: [], cau: [], luyenDe: await docLuyenDeTongHop(env, sbd), khacPhuc: null, chuaBat: true }
    throw e
  }
}

/**
 * LUYỆN ĐỀ CẤU TRÚC trong Tổng hợp (v3): các đề ĐÃ NỘP (bảng luyen_de_2026, chỉ đọc) — lúc nộp, điểm, và số câu đúng THEO PHẦN.
 * Phần suy từ kết quả chấm đã lưu (`result.detail`: đáp án dạng mảng ⇒ Phần II; chữ A–D ⇒ Phần I; còn lại ⇒ Phần III), đúng khi đủ điểm câu.
 */
export async function docLuyenDeTongHop(env: Env, sbd: string): Promise<Obj[]> {
  const r = await env.DB.prepare("SELECT id, created_at, updated_at, result FROM luyen_de_2026 WHERE sbd = ? AND status = 'submitted' AND result IS NOT NULL ORDER BY created_at DESC LIMIT 60")
    .bind(sbd).all<Obj>().catch(() => ({ results: [] as Obj[] }))
  const ra: Obj[] = []
  for (const x of r.results ?? []) {
    let kq: { score?: unknown; detail?: Record<string, { correct?: unknown; points?: unknown }> }
    try { kq = JSON.parse(str(x.result)) } catch { continue }
    const theoPhan = { I: { soCau: 0, soDung: 0 }, II: { soCau: 0, soDung: 0 }, III: { soCau: 0, soDung: 0 } }
    for (const d of Object.values(kq.detail ?? {})) {
      const phan = Array.isArray(d?.correct) ? 'II' : /^[A-D]$/.test(str(d?.correct).trim()) ? 'I' : 'III'
      const du = phan === 'II' ? 1 : 0.25
      theoPhan[phan].soCau++
      if ((Number(d?.points) || 0) >= du - 1e-9) theoPhan[phan].soDung++
    }
    ra.push({ id: str(x.id), luc: Number(x.updated_at) || Number(x.created_at) || 0, diem: Number(kq.score) || 0, theoPhan })
  }
  return ra
}

/** Định tuyến `/hs/tu-luyen/<lệnh>` (index.ts). Lỗi xác thực ⇒ trả lời có chữ, không ném ra ngoài. */
export async function tuLuyen(env: Env, lenh: string, b: Obj): Promise<Obj> {
  let sbd: string
  try {
    sbd = await emCua(env, b)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Em đăng nhập lại nhé.' }
  }
  await damBaoBangTuLuyen(env) // CI deploy không chạy migration ⇒ dựng bảng CHỈ-THÊM tại chỗ (một lần mỗi isolate)
  if (lenh === 'nguon') return tuLuyenNguon(env, sbd)
  if (lenh === 'xem-luot') return tuLuyenXemLuot(env, sbd, b)
  if (lenh === 'xem-truoc') return tuLuyenXemTruoc(env, sbd, b)
  if (lenh === 'rut') return tuLuyenRut(env, sbd, b)
  if (lenh === 'nop') return tuLuyenNop(env, sbd, b)
  if (lenh === 'cham-cau') return tuLuyenChamCau(env, sbd, b)
  if (lenh === 'tong-hop') return tuLuyenTongHop(env, sbd)
  return { ok: false, error: 'Lệnh Tu luyện không có.' }
}
