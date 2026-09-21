// `POST /gv/bao-cao-ca {maCa}` (tổng quan CẢ LỚP của một ca) và `POST /gv/bao-cao-ca-em {maCa, sbd}` (báo cáo MỘT em trong ca) — BÁO CÁO CHI TIẾT SAU KIỂM TRA cho THẦY.
// Hợp đồng: docs/hop-dong-xem-diem-v2-2109.md mục 2 (thân báo cáo một em) và mục 4 (lệnh của thầy) — Code 3 → Code 2, Code 4 (21/09/2026). Cổng mã bí mật của thầy do `index.ts` chặn; ở đây chỉ nhận `b`.
//
// ĐỌC-CHỈ: chỉ SELECT, không ghi, không AI, không đổi luật chấm / luật công bố / luật vào thi. Hai lệnh thầy KHÔNG bị chặn công bố (thầy xem mọi ca) nhưng LUÔN trả khối `congBo` (nhãn "chưa công bố").
// `baoCaoMotEm` là bộ dựng DÙNG CHUNG cho báo cáo một em: lệnh `/hs/bao-cao-ca` và `/ph/bao-cao-ca` về sau chỉ gọi lại với `chanCongBo: true` (ca chưa công bố ⇒ CHỈ `ca` + `congBo`, không một số/đáp án nào),
// `coExp: false` cho phụ huynh (app phụ huynh KHÔNG BAO GIỜ có EXP) và `choThay: false` (không `hangTrongLop`, không `em`).
//
// VẮNG, KHÔNG SỐ 0 GIẢ (JSON không có khoá): khối nào thiếu số thật thì bỏ hẳn khoá. Cụ thể —
//   · lớp: chưa em nào có điểm ⇒ không có `tongQuan` và các khối lớp; ca chưa có bảng chấm (`chi_tiet_cau`) ⇒ không `phanTb`, `dangCaLopVap`, `cauSaiNhieu`, `aiDaLo`;
//   · em: không có bảng chấm ⇒ chỉ điểm (các `soCau*`, `phan`, `dang`, `cauCanXemLai` vắng); không có ca công bố trước ⇒ không `truoc`; sổ học không có sự kiện của CHÍNH ca này ⇒ không `bacTruoc/bacSau/doiBac`;
//     mã dạng không rõ ⇒ câu không vào dòng dạng nào; tên dạng không biết ⇒ dòng dạng vẫn có nhưng không khoá `ten` (màn hiện "dạng chưa đặt tên"); `tbGiay` chỉ khi ≥ 5 em có số; `expDaCong` chỉ khi > 0;
//   · `dangBuoiChuaXepSan` (lớp) KHÔNG làm: cần đúng luật xếp của `/gv/buoi-chua-de-xuat` (12 truy vấn) nên để vắng thay vì đoán.
// CÂU TỰ LUẬN không bao giờ vào `de` / `cauCanXemLai` / `cauSaiNhieu` và không có `loiGiai`: kiểm hai lớp bằng ĐÚNG hàm dùng chung `laCauTuLuan` (dòng bảng chấm: qid + đáp án; và JSON kho câu khi đọc được).
//
// SỐ LIỆU LỚP: mỗi em một lượt — lượt đã nộp MỚI NHẤT của ca (`nop_luc` khác rỗng, `trang_thai` da_nop|khoa), điểm `luot.tong`. Bỏ tài khoản thử 12121212 và em bị khoá (`hoc_sinh.trang_thai = 'khoa'`) khỏi MỌI số của lớp.
// `diemTruoc` / `doi` = điểm của CHÍNH em ở ca ĐÃ CÔNG BỐ (cùng luật `SQL_DA_CONG_BO`) mà em nộp ngay trước lượt này.
//
// CHI PHÍ D1: `/gv/bao-cao-ca` 8 truy vấn, `/gv/bao-cao-ca-em` 11 (trần đề bài 12; mỗi truy vấn không UNION, danh sách truyền MỘT tham số `json_each`). Đọc chừng: lượt + bảng chấm của ca (~30–60 em × ~28 câu ≈ 1–2 nghìn dòng),
// QUÉT BẢNG `luot` một lần để tìm điểm lần trước (không có chỉ mục theo sbd; vài nghìn dòng), hồ sơ `nam_kt_*` của các em (vài trăm–nghìn dòng), sổ học của MỘT em (lệnh `-em`, vài trăm–vài nghìn dòng)
// ⇒ chừng 4–8 nghìn dòng mỗi lần; thầy mở vài lần mỗi ca ⇒ ≪ 0,1 triệu dòng/ngày. Lỗi đọc bất kỳ truy vấn nào ⇒ `{ok:false, lyDo:'loi_doc'}` (không trả kết quả nửa vời).
import type { Env } from './kieu'
import { cheDoCongBo, laSanSangCongBo, SQL_DA_CONG_BO, type TrangThaiCongBoCa } from './cong-bo-diem'
import { docCauTuJson, laCauTuLuan } from './cam-tu-luan'
import { demTuChiTiet } from './goi-cu'
import { SBD_THU } from './gv-bang-tin'
import { BAC_DANG_BAT_DAU } from './ho-so-cau-hinh'
import { dangYeu, docSuKienDoc, phatLaiSuKien, themNgay, type NamKtDang, type SuKienDoc, type TraCuuCau } from './ho-so-nam-kt'
import { chuyenDeThat, laBoTrong } from './su-kien-hoc'
import { tenCuaCacDang } from './ten-dang-bo-nao'
import { quotaPhan, type SoCauBaPhan } from '../../src/engine/score'

type Hang = Record<string, unknown>
type Phan = 'I' | 'II' | 'III'
const CAC_PHAN: readonly Phan[] = ['I', 'II', 'III']
const KHOA_DIEM = { I: 'diemI', II: 'diemII', III: 'diemIII' } as const
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
const so = (v: unknown): number => Number(v) || 0
const soHuuHan = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const tron = (n: number, k = 2): number => Math.round(n * 10 ** k) / 10 ** k
const GIO_VN_MS = 7 * 3_600_000
const homNayVn = (ms: number): string => new Date(ms + GIO_VN_MS).toISOString().slice(0, 10)
const ngayVnCua = (iso: string): string | null => {
  const t = Date.parse(iso)
  return Number.isFinite(t) ? homNayVn(t) : null
}
const khoaPhan = (p: string): number => CAC_PHAN.indexOf(p as Phan)
const trungVi = (ds: readonly number[]): number => {
  if (ds.length === 0) return 0
  const s = [...ds].sort((a, b) => a - b)
  const g = s.length >> 1
  return s.length % 2 ? s[g]! : (s[g - 1]! + s[g]!) / 2
}
const soSanhTen = (a: string, b: string): number => a.localeCompare(b, 'vi')

// ---------------------------------------------------------------- HẰNG SỐ (chỉ chọn CÁI GÌ hiện, không đổi luật chấm / công bố) ----------------------------------------------------------------
/** Dòng "dạng" của báo cáo một em (hợp đồng: ≤ 12). */
export const TOI_DA_DANG_EM = 12
/** "Câu cần xem lại": sai + đúng-nhưng-lâu (hợp đồng: ≤ 8, sai trước). */
export const TOI_DA_CAU_XEM_LAI = 8
/** Câu ĐÚNG mà `giay` ≥ ngần này × trung vị `giay` cả ca của em thì vào "cần xem lại". */
export const HE_SO_CAU_LAU = 2
/** `tbGiay` chỉ hiện khi ≥ ngần này em có số (không lộ từng em). */
export const SAN_EM_TB_GIAY = 5
export const DE_TOI_DA_KY_TU = 160
/** Em cần để ý: điểm giảm ≥ 1,5 so với lần trước của CHÍNH em, hoặc điểm DƯỚI 5 (nửa thang); tối đa 5 em. */
export const GIAM_DIEM_CAN_Y = 1.5
export const DIEM_CAN_Y = 5
export const TOI_DA_EM_CAN_Y = 5
/** Câu sai nhiều và dạng cả lớp vấp: ≥ 3 em sai VÀ ≥ 30 % số em làm câu/dạng ấy sai (cùng ngưỡng `/gv/buoi-chua-de-xuat`). Dạng xếp tỉ lệ đúng thấp nhất trước (≤ 8 dòng); câu xếp số em sai nhiều nhất trước (≤ 10 câu). */
export const SAN_SO_EM_SAI = 3
export const SAN_TI_LE_SAI_CHUC = 3
export const TOI_DA_DANG_VAP = 8
export const TOI_DA_CAU_SAI_NHIEU = 10
/** Dạng nhiều em yếu nhất sau ca (theo hồ sơ `dangYeu`): cần ≥ 3 em yếu; ≤ 3 dạng ở lớp, ≤ 3 dạng ở một em. */
export const SAN_SO_EM_YEU_DANG = 3
export const TOI_DA_DANG_BAI_TAP_KE = 3
export const SO_CA_TIEN_BO = 5
export const TOI_DA_DANG_LEN_BAC = 3

// ---------------------------------------------------------------- KIỂU + ĐỌC D1 (mỗi hàm đúng MỘT truy vấn) ----------------------------------------------------------------
interface CaDoc {
  maCa: string
  tenCa: string
  loai: string
  trangThai: string
  lop: string
  thoiGianPhut: number | null
  congBo: TrangThaiCongBoCa
}
interface LuotDoc {
  sbd: string
  lanThu: number
  vaoLuc: string
  nopLuc: string
  trangThai: string
  diemI: number | null
  diemII: number | null
  diemIII: number | null
  tong: number | null
  hoTen: string
  /** Tài khoản thử hoặc em bị khoá: không tính vào số liệu lớp. */
  loaTru: boolean
}
interface DongCau {
  sbd: string
  lanThu: number
  phan: string
  soCau: number
  qid: string
  chuyenDe: string
  chon: string
  dapAnDung: string
  dungSai: 0 | 1 | null
  giay: number | null
  raw: Hang
}
interface KhoCau {
  qid: string
  dang: string
  /** JSON câu (đã bỏ ảnh lớn) — chỉ có cho các câu ứng viên hiện ra màn. */
  cau: Hang | null
}
interface DiemCu {
  maCa: string
  tenCa: string
  nopLuc: string
  tong: number
  t: number
}
interface NamKtCauDoc {
  maDang: string
  chuyenDe: string
  trangThai: string
  mocOnKe: string
}

const daNopLuot = (l: LuotDoc): boolean => l.nopLuc !== '' && (l.trangThai === 'da_nop' || l.trangThai === 'khoa')
const trongLichOn = (c: NamKtCauDoc | undefined): c is NamKtCauDoc => !!c && (c.trangThai === 'moi_sai' || c.trangThai === 'dang_on') && c.mocOnKe !== ''

async function docCa(env: Env, maCa: string): Promise<CaDoc | null> {
  const x = await env.DB.prepare(
    `SELECT c.ma_ca, c.ten_ca, c.trang_thai, c.loai, c.lop, c.cong_bo, c.thoi_gian_phut,
            (SELECT COUNT(*) FROM luot l WHERE l.ma_ca = c.ma_ca) AS da_vao,
            (SELECT COUNT(*) FROM luot l WHERE l.ma_ca = c.ma_ca AND l.trang_thai = 'da_nop') AS da_nop
       FROM ca c WHERE c.ma_ca = ?`,
  )
    .bind(maCa)
    .first<Hang>()
  if (!x || chuoi(x.trang_thai) === 'da_xoa') return null
  const congBo = cheDoCongBo(x.cong_bo)
  const soEmDaVao = so(x.da_vao)
  const soEmDaNop = so(x.da_nop)
  const phut = soHuuHan(x.thoi_gian_phut)
  return {
    maCa,
    tenCa: chuoi(x.ten_ca) || `Ca ${maCa}`,
    loai: chuoi(x.loai),
    trangThai: chuoi(x.trang_thai),
    lop: chuoi(x.lop),
    thoiGianPhut: phut !== null && phut > 0 ? phut : null,
    congBo: { maCa, congBo, daCongBo: laSanSangCongBo(congBo, chuoi(x.trang_thai), soEmDaVao, soEmDaNop), soEmDaNop, soEmDaVao },
  }
}

/** Mọi lượt của ca (hoặc chỉ của một em) kèm tên em và cờ loại khỏi số liệu lớp. */
async function docLuotCaLop(env: Env, maCa: string, sbd?: string): Promise<LuotDoc[]> {
  const r = await env.DB.prepare(
    `SELECT l.sbd, l.lan_thu, l.vao_luc, l.nop_luc, l.trang_thai, l.diem_i, l.diem_ii, l.diem_iii, l.tong,
            COALESCE(NULLIF(h.ho_ten, ''), l.ho_ten) AS ho_ten, h.trang_thai AS hs_trang_thai
       FROM luot l LEFT JOIN hoc_sinh h ON h.sbd = l.sbd
      WHERE l.ma_ca = ?${sbd ? ' AND l.sbd = ?' : ''}`,
  )
    .bind(...(sbd ? [maCa, sbd] : [maCa]))
    .all<Hang>()
  return (r.results ?? []).map((x) => {
    const s = chuoi(x.sbd)
    return {
      sbd: s,
      lanThu: so(x.lan_thu),
      vaoLuc: chuoi(x.vao_luc),
      nopLuc: chuoi(x.nop_luc),
      trangThai: chuoi(x.trang_thai),
      diemI: soHuuHan(x.diem_i),
      diemII: soHuuHan(x.diem_ii),
      diemIII: soHuuHan(x.diem_iii),
      tong: soHuuHan(x.tong),
      hoTen: chuoi(x.ho_ten),
      loaTru: s === SBD_THU || chuoi(x.hs_trang_thai) === 'khoa',
    }
  })
}

/** Mỗi em một lượt: lượt đã nộp mới nhất (lan_thu lớn nhất). */
function luotCuoiMoiEm(ds: readonly LuotDoc[], boLoaTru: boolean): Map<string, LuotDoc> {
  const ra = new Map<string, LuotDoc>()
  for (const l of ds) {
    if (!daNopLuot(l) || (boLoaTru && l.loaTru)) continue
    const cu = ra.get(l.sbd)
    if (!cu || l.lanThu > cu.lanThu) ra.set(l.sbd, l)
  }
  return ra
}

const dongCau = (x: Hang): DongCau => {
  const g = soHuuHan(x.giay)
  return {
    sbd: chuoi(x.sbd),
    lanThu: so(x.lan_thu),
    phan: chuoi(x.phan),
    soCau: so(x.so_cau),
    qid: chuoi(x.qid),
    chuyenDe: chuoi(x.chuyen_de),
    chon: chuoi(x.dap_an_chon),
    dapAnDung: chuoi(x.dap_an_dung),
    dungSai: x.dung_sai === null || x.dung_sai === undefined ? null : Number(x.dung_sai) === 1 ? 1 : 0,
    giay: g !== null && g > 0 ? g : null,
    raw: x,
  }
}
const CHON_CT = 'SELECT sbd, lan_thu, phan, so_cau, qid, chuyen_de, dap_an_chon, dap_an_dung, dung_sai, giay FROM chi_tiet_cau WHERE ma_ca = ?'
const xepDong = (a: DongCau, b: DongCau): number => khoaPhan(a.phan) - khoaPhan(b.phan) || a.soCau - b.soCau

/** Bảng chấm của CẢ ca (lọc theo lượt đã chọn ở nơi gọi). */
async function docChiTietCa(env: Env, maCa: string): Promise<DongCau[]> {
  const r = await env.DB.prepare(CHON_CT).bind(maCa).all<Hang>()
  return (r.results ?? []).map(dongCau)
}
/** Bảng chấm của MỘT lượt (đi chỉ mục idx_ctc_em). */
async function docChiTietEm(env: Env, maCa: string, sbd: string, lanThu: number): Promise<DongCau[]> {
  const r = await env.DB.prepare(`${CHON_CT} AND sbd = ? AND lan_thu = ?`).bind(maCa, sbd, lanThu).all<Hang>()
  return (r.results ?? []).map(dongCau).sort(xepDong)
}

/** Kho câu (`game_v2_question`, đi chỉ mục qid): mã dạng của MỌI câu + JSON (bỏ ảnh lớn) của các câu ứng viên. */
async function docKho(env: Env, tatCa: readonly string[], ungVien: readonly string[]): Promise<Map<string, KhoCau>> {
  const ra = new Map<string, KhoCau>()
  if (tatCa.length === 0) return ra
  const r = await env.DB.prepare(
    `SELECT q.qid, q.dang,
            CASE WHEN q.qid IN (SELECT value FROM json_each(?)) THEN json_remove(q.json, '$.imageDataUrl', '$.thanCauImg') END AS j
       FROM game_v2_question q WHERE q.qid IN (SELECT value FROM json_each(?))`,
  )
    .bind(JSON.stringify(ungVien), JSON.stringify(tatCa))
    .all<Hang>()
  for (const x of r.results ?? []) {
    const qid = chuoi(x.qid)
    const cu = ra.get(qid)
    const cau = docCauTuJson(x.j)
    if (!cu) ra.set(qid, { qid, dang: chuoi(x.dang), cau })
    else {
      if (!cu.dang) cu.dang = chuoi(x.dang)
      if (!cu.cau) cu.cau = cau
    }
  }
  return ra
}

const dangNamKt = (x: Hang): NamKtDang => ({
  sbd: chuoi(x.sbd),
  maDang: chuoi(x.ma_dang),
  soGap: so(x.so_gap),
  soSai: so(x.so_sai),
  soDaKhacPhuc: so(x.so_da_khac_phuc),
  soMoiSai: so(x.so_moi_sai),
  soChuaThaySai: so(x.so_chua_thay_sai),
  bac: so(x.bac),
  mocOnKe: x.moc_on_ke ? chuoi(x.moc_on_ke) : null,
  mocMoiSai: x.moc_moi_sai ? chuoi(x.moc_moi_sai) : null,
})
/** Hồ sơ dạng của các em (idx_nkd_em). */
async function docNamKtDang(env: Env, dsSbd: readonly string[]): Promise<NamKtDang[]> {
  const r = await env.DB.prepare(
    'SELECT sbd, ma_dang, so_gap, so_sai, so_da_khac_phuc, so_moi_sai, so_chua_thay_sai, bac, moc_on_ke, moc_moi_sai FROM nam_kt_dang WHERE sbd IN (SELECT value FROM json_each(?))',
  )
    .bind(JSON.stringify(dsSbd))
    .all<Hang>()
  return (r.results ?? []).map(dangNamKt)
}
/** Hồ sơ câu của MỘT em (idx_nkc_em_moc): mã dạng, trạng thái, mốc ôn kế. */
async function docNamKtCauCuaEm(env: Env, sbd: string): Promise<Map<string, NamKtCauDoc>> {
  const r = await env.DB.prepare('SELECT qid, ma_dang, chuyen_de, trang_thai, moc_on_ke FROM nam_kt_cau WHERE sbd = ?').bind(sbd).all<Hang>()
  const ra = new Map<string, NamKtCauDoc>()
  for (const x of r.results ?? []) ra.set(chuoi(x.qid), { maDang: chuoi(x.ma_dang), chuyenDe: chuoi(x.chuyen_de), trangThai: chuoi(x.trang_thai), mocOnKe: chuoi(x.moc_on_ke) })
  return ra
}
/** (em, câu) đã nằm trong lịch ôn — tra thẳng khoá chính `sbd|qid`. Trả mã em của từng dòng. */
async function docLichOnTheoKhoa(env: Env, khoa: readonly string[]): Promise<string[]> {
  if (khoa.length === 0) return []
  const r = await env.DB.prepare(
    "SELECT sbd FROM nam_kt_cau WHERE khoa IN (SELECT value FROM json_each(?)) AND trang_thai IN ('moi_sai', 'dang_on') AND moc_on_ke IS NOT NULL AND moc_on_ke <> ''",
  )
    .bind(JSON.stringify(khoa))
    .all<Hang>()
  return (r.results ?? []).map((x) => chuoi(x.sbd))
}

/** Điểm các ca ĐÃ CÔNG BỐ mà các em từng nộp (cùng luật `SQL_DA_CONG_BO`); `boMaCa` = bỏ ca này. Không có chỉ mục theo sbd ⇒ quét `luot` một lần. */
async function docLichSuDiem(env: Env, dsSbd: readonly string[], boMaCa: string | null): Promise<Map<string, DiemCu[]>> {
  const r = await env.DB.prepare(
    `SELECT l.sbd, l.ma_ca, c.ten_ca, l.nop_luc, l.tong
       FROM luot l JOIN ca c ON c.ma_ca = l.ma_ca
      WHERE l.sbd IN (SELECT value FROM json_each(?))${boMaCa ? ' AND l.ma_ca <> ?' : ''}
        AND COALESCE(l.nop_luc, '') <> '' AND l.trang_thai IN ('da_nop', 'khoa') AND l.tong IS NOT NULL
        AND c.trang_thai <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')}`,
  )
    .bind(...(boMaCa ? [JSON.stringify(dsSbd), boMaCa] : [JSON.stringify(dsSbd)]))
    .all<Hang>()
  const ra = new Map<string, DiemCu[]>()
  for (const x of r.results ?? []) {
    const t = Date.parse(chuoi(x.nop_luc))
    const tong = soHuuHan(x.tong)
    if (!Number.isFinite(t) || tong === null) continue
    const s = chuoi(x.sbd)
    const ds = ra.get(s) ?? []
    ds.push({ maCa: chuoi(x.ma_ca), tenCa: chuoi(x.ten_ca) || `Ca ${chuoi(x.ma_ca)}`, nopLuc: chuoi(x.nop_luc), tong, t })
    ra.set(s, ds)
  }
  return ra
}
/** Mỗi ca một điểm (lượt nộp muộn nhất của ca), cũ → mới. */
function diemMoiCa(ds: readonly DiemCu[] | undefined): DiemCu[] {
  const theoCa = new Map<string, DiemCu>()
  for (const d of ds ?? []) {
    const cu = theoCa.get(d.maCa)
    if (!cu || d.t > cu.t) theoCa.set(d.maCa, d)
  }
  return [...theoCa.values()].sort((a, b) => a.t - b.t)
}
/** Điểm ca đã công bố liền TRƯỚC lượt nộp `t1` (ca khác `maCa`). */
function diemLanTruoc(ds: readonly DiemCu[] | undefined, maCa: string, nopLuc: string): DiemCu | null {
  const t1 = Date.parse(nopLuc)
  if (!Number.isFinite(t1)) return null
  let tot: DiemCu | null = null
  for (const d of diemMoiCa(ds)) if (d.maCa !== maCa && d.t < t1 && (!tot || d.t > tot.t)) tot = d
  return tot
}

/** Tên dạng (`tenCuaCacDang`): mã không biết tên vắng khỏi bản đồ. */
async function tenDang(env: Env, ma: Iterable<string>): Promise<Map<string, string>> {
  const ds = [...new Set([...ma].filter(Boolean))]
  return ds.length ? tenCuaCacDang(env, ds) : new Map<string, string>()
}

// ---------------------------------------------------------------- HÀM THUẦN ----------------------------------------------------------------
/** Câu tự luận theo DÒNG BẢNG CHẤM (qid, phần, đáp án đúng) — cùng hàm dùng chung `laCauTuLuan`. */
const tuLuanTheoDong = (d: DongCau): boolean => laCauTuLuan({ qid: d.qid, phan: d.phan, dapAn: d.dapAnDung })
/** Câu tự luận theo JSON kho câu khi đọc được (không đọc được ⇒ không kết tội). */
const tuLuanTheoKho = (k: KhoCau | undefined): boolean => (k?.cau ? laCauTuLuan(k.cau) : false)

/** Đầu đề rút gọn ≤ 160 ký tự (đếm điểm mã, không cắt đôi cặp thay thế). Không có chữ ⇒ ''. */
export function deRutGon(cau: Hang | null | undefined): string {
  const t = chuoi(cau?.text).replace(/\s+/g, ' ')
  const cp = Array.from(t)
  return cp.length <= DE_TOI_DA_KY_TU ? t : `${cp.slice(0, DE_TOI_DA_KY_TU - 1).join('').trimEnd()}…`
}
const loiGiaiCua = (cau: Hang | null | undefined): string => (typeof cau?.solution === 'string' ? cau.solution.trim() : '')

/** Mã dạng của câu: kho câu (`game_v2_question.dang`), rồi chuyên đề thật `CD:<tên>` — cùng thứ tự ưu tiên khi dựng hồ sơ. */
function maDangTuKho(qid: string, chuyenDe: string, kho: ReadonlyMap<string, KhoCau>): string {
  const k = kho.get(qid)
  if (k?.dang) return k.dang
  const cd = chuyenDeThat(chuyenDe)
  return cd ? `CD:${cd}` : ''
}

const demSoCauBaPhan = (ds: readonly DongCau[]): SoCauBaPhan => ({
  I: ds.filter((d) => d.phan === 'I').length,
  II: ds.filter((d) => d.phan === 'II').length,
  III: ds.filter((d) => d.phan === 'III').length,
})

const khoiCongBo = (ca: CaDoc) => ({ congBo: ca.congBo.congBo, daCongBo: ca.congBo.daCongBo, soEmDaNop: ca.congBo.soEmDaNop, soEmDaVao: ca.congBo.soEmDaVao })

/** Thời gian làm = nộp − vào (giây); thiếu / sai mốc ⇒ null (vắng). */
function thoiGianLamGiay(l: LuotDoc): number | null {
  const v = Date.parse(l.vaoLuc)
  const n = Date.parse(l.nopLuc)
  return Number.isFinite(v) && Number.isFinite(n) && n > v ? Math.round((n - v) / 1000) : null
}

/** Bậc của mọi dạng sau khi phát lại các sự kiện `ds` (dạng chưa từng gặp ⇒ vắng khỏi bản đồ). */
function bacQuaSo(ds: readonly SuKienDoc[], tra: TraCuuCau): Map<string, number> {
  return new Map(phatLaiSuKien(ds, tra).dang.map((d) => [d.maDang, d.bac]))
}

// ---------------------------------------------------------------- BÁO CÁO MỘT EM (bộ dựng chung) ----------------------------------------------------------------
export interface TuyChonBaoCaoEm {
  maCa: string
  sbd: string
  /** Vắng ⇒ lượt đã nộp mới nhất của em. */
  lanThu?: number
  nowMs: number
  /** true (HS/PH) ⇒ ca CHƯA công bố chỉ trả `ca` + `congBo`. Lệnh thầy: false. */
  chanCongBo: boolean
  /** Có `expDaCong` (HS và thầy có; phụ huynh KHÔNG BAO GIỜ). */
  coExp: boolean
  /** Lệnh thầy: thêm `em`, `hangTrongLop` và `aiDaLo` mở rộng (`dangUuTien`, `ngayOnLai`). */
  choThay: boolean
}

const LOI_DOC = { ok: false, lyDo: 'loi_doc', error: 'Chưa đọc được báo cáo ca. Thử lại sau.' }

export async function baoCaoMotEm(env: Env, o: TuyChonBaoCaoEm): Promise<Hang> {
  const maCa = chuoi(o.maCa)
  const sbd = chuoi(o.sbd)
  if (!maCa) return { ok: false, lyDo: 'thieu', error: 'Thiếu mã ca.' }
  if (!sbd) return { ok: false, lyDo: 'thieu', error: 'Thiếu số báo danh.' }
  try {
    return await dungBaoCaoEm(env, o, maCa, sbd)
  } catch (e) {
    console.error('[bao-cao-ca-em] lỗi đọc (không trả nửa vời):', e instanceof Error ? e.message : e)
    return { ...LOI_DOC }
  }
}

async function dungBaoCaoEm(env: Env, o: TuyChonBaoCaoEm, maCa: string, sbd: string): Promise<Hang> {
  const ca = await docCa(env, maCa)
  if (!ca) return { ok: false, lyDo: 'khong_co_ca', error: 'Không tìm thấy ca này.' }
  const luotCa = await docLuotCaLop(env, maCa, o.choThay ? undefined : sbd)
  const cuaEm = luotCa.filter((l) => l.sbd === sbd && daNopLuot(l))
  const lanXin = Number(o.lanThu)
  const luot = lanXin >= 1 ? cuaEm.find((l) => l.lanThu === lanXin) : cuaEm.reduce<LuotDoc | undefined>((a, l) => (!a || l.lanThu > a.lanThu ? l : a), undefined)
  if (!luot) return { ok: false, lyDo: 'chua_nop', error: 'Em chưa nộp bài ca này' }

  const giayLam = thoiGianLamGiay(luot)
  const ra: Hang = {
    ok: true,
    serverNow: o.nowMs,
    ca: {
      maCa,
      tenCa: ca.tenCa,
      lanThu: luot.lanThu,
      nopLuc: luot.nopLuc,
      ...(ca.thoiGianPhut !== null ? { thoiGianPhut: ca.thoiGianPhut } : {}),
      ...(giayLam !== null ? { thoiGianLamGiay: giayLam } : {}),
    },
  }
  if (o.choThay) ra.em = { sbd, ...(luot.hoTen ? { hoTen: luot.hoTen } : {}) }
  ra.congBo = khoiCongBo(ca)
  // Luật công bố đứng đầu: ca chưa công bố (lệnh HS/PH) ⇒ dừng ở đây, KHÔNG một điểm / đáp án nào.
  if (o.chanCongBo && !ca.congBo.daCongBo) return ra

  const dong = await docChiTietEm(env, maCa, sbd, luot.lanThu)
  const homNay = homNayVn(o.nowMs)

  // Câu ứng viên "cần xem lại": sai trước (theo phần, số câu), rồi đúng-nhưng-lâu (lâu nhất trước). Lấy dư để lọc tự luận theo JSON kho.
  const trungViGiay = trungVi(dong.flatMap((d) => (d.giay !== null ? [d.giay] : [])))
  const coQid = (d: DongCau): boolean => d.qid !== '' && !tuLuanTheoDong(d)
  const saiUng = dong.filter((d) => d.dungSai === 0 && coQid(d))
  const lauUng = trungViGiay > 0
    ? dong.filter((d) => d.dungSai === 1 && d.giay !== null && d.giay >= HE_SO_CAU_LAU * trungViGiay && coQid(d)).sort((a, b) => (b.giay ?? 0) - (a.giay ?? 0) || xepDong(a, b))
    : []
  const ungVien = [...saiUng, ...lauUng].slice(0, 2 * TOI_DA_CAU_XEM_LAI)
  const qidUng = [...new Set(ungVien.map((d) => d.qid))]
  const qidTatCa = [...new Set(dong.map((d) => d.qid).filter(Boolean))]

  // Không có bảng chấm ⇒ chỉ điểm: không đọc hồ sơ / sổ / kho (các khối ấy vắng).
  const coBang = dong.length > 0
  const [tbGiayMap, namKtCau, namKtDang, suKien, kho, exp, lichSu] = await Promise.all([
    docTbGiayCau(env, maCa, qidUng),
    coBang ? docNamKtCauCuaEm(env, sbd) : Promise.resolve(new Map<string, NamKtCauDoc>()),
    coBang ? docNamKtDang(env, [sbd]) : Promise.resolve<NamKtDang[]>([]),
    coBang ? docSuKienDoc(env, [sbd]) : Promise.resolve<SuKienDoc[]>([]),
    docKho(env, qidTatCa, qidUng),
    o.coExp && coBang ? docExp(env, sbd, maCa) : Promise.resolve(0),
    docLichSuDiem(env, [sbd], null),
  ])

  // ---- ketQua + phan (từ bảng chấm của CHÍNH lượt này) ----
  const soCau = demSoCauBaPhan(dong)
  const quota = quotaPhan(soCau)
  const dem = demTuChiTiet(dong.map((d) => d.raw))
  const ketQua: Hang = {}
  if (luot.tong !== null) ketQua.tong = tron(luot.tong)
  if (luot.diemI !== null) ketQua.diemI = tron(luot.diemI)
  if (luot.diemII !== null) ketQua.diemII = tron(luot.diemII)
  if (luot.diemIII !== null) ketQua.diemIII = tron(luot.diemIII)
  if (dong.length > 0) Object.assign(ketQua, { soCau: dem.tong, soCauDung: dem.dung, soCauSai: dem.sai, soCauMotPhan: dem.motPhan, soCauBoTrong: dem.trong })
  if (Object.keys(ketQua).length > 0) ra.ketQua = ketQua

  // ---- truoc + tienBo (điểm ca ĐÃ CÔNG BỐ của chính em) ----
  const lichSuEm = diemMoiCa(lichSu.get(sbd)).filter((d) => d.maCa !== maCa)
  const truoc = diemLanTruoc(lichSuEm, maCa, luot.nopLuc)
  if (truoc) ra.truoc = { maCa: truoc.maCa, tenCa: truoc.tenCa, nopLuc: truoc.nopLuc, tong: tron(truoc.tong), ...(luot.tong !== null ? { doi: tron(luot.tong - truoc.tong) } : {}) }

  const phan: Hang[] = []
  for (const ma of CAC_PHAN) {
    const rs = dong.filter((d) => d.phan === ma)
    if (rs.length === 0) continue
    const d = demTuChiTiet(rs.map((x) => x.raw))
    const diem = luot[KHOA_DIEM[ma]]
    phan.push({ ma, dung: d.dung, tong: d.tong, motPhan: d.motPhan, ...(diem !== null ? { diem: tron(diem) } : {}), toiDa: quota[ma] / 100 })
  }
  if (phan.length > 0) ra.phan = phan

  // ---- dang (nhóm theo mã dạng; bậc trước/sau ca bằng PHÁT LẠI SỔ) ----
  const maDangCua = (d: DongCau): string => namKtCau.get(d.qid)?.maDang || maDangTuKho(d.qid, d.chuyenDe, kho)
  const nhom = new Map<string, { dung: number; tong: number }>()
  for (const d of dong) {
    const ma = d.qid ? maDangCua(d) : ''
    if (!ma) continue
    const n = nhom.get(ma) ?? { dung: 0, tong: 0 }
    n.tong++
    if (d.dungSai === 1) n.dung++
    nhom.set(ma, n)
  }
  // Bảng tra cho phát lại: mã dạng theo kho câu, hồ sơ `nam_kt_cau` ĐÈ LÊN (cùng thứ tự ưu tiên khi dựng hồ sơ) — hồ sơ còn thiếu dòng thì kho vẫn cho mã dạng của các câu ca này.
  const tra: TraCuuCau = {
    dang: new Map<string, string>([
      ...qidTatCa.flatMap((q): [string, string][] => (kho.get(q)?.dang ? [[q, kho.get(q)!.dang]] : [])),
      ...[...namKtCau].filter(([, v]) => v.maDang).map(([q, v]): [string, string] => [q, v.maDang]),
    ]),
    chuyenDe: new Map([...namKtCau].filter(([, v]) => v.chuyenDe).map(([q, v]): [string, string] => [q, v.chuyenDe])),
  }
  const t0 = Date.parse(luot.vaoLuc)
  const t1 = Date.parse(luot.nopLuc)
  // "Có sổ của CHÍNH ca này": sự kiện nguồn `thi` mang mã ca (khoá sổ `thi|<mã ca>|<sbd>|<qid>|<lần>`) do `ghiSuKienThi` ghi với giờ = giờ nộp. Không có ⇒ bậc trước/sau ca vắng (không giả "giữ bậc").
  const coSoCuaCa = Number.isFinite(t0) && Number.isFinite(t1) && suKien.some((e) => e.nguon === 'thi' && e.khoa.startsWith(`thi|${maCa}|${sbd}|`) && Date.parse(e.luc) >= t0 && Date.parse(e.luc) <= t1)
  const bacTruoc = coSoCuaCa ? bacQuaSo(suKien.filter((e) => Date.parse(e.luc) < t0), tra) : null
  const bacSau = coSoCuaCa ? bacQuaSo(suKien.filter((e) => Date.parse(e.luc) <= t1), tra) : null
  const dangHienTai = new Map(namKtDang.map((d) => [d.maDang, d]))
  const dangYeuEm = namKtDang
    .filter((d) => dangYeu(d, homNay))
    .sort((a, b) => b.soMoiSai - a.soMoiSai || b.soSai - a.soSai || (a.maDang < b.maDang ? -1 : a.maDang > b.maDang ? 1 : 0))
    .slice(0, TOI_DA_DANG_BAI_TAP_KE)
  const dsDang = [...nhom]
    .map(([ma, n]) => ({ ma, ...n }))
    .sort((a, b) => a.dung / a.tong - b.dung / b.tong || b.tong - a.tong || (a.ma < b.ma ? -1 : a.ma > b.ma ? 1 : 0))
    .slice(0, TOI_DA_DANG_EM)

  const ten = await tenDang(env, [...dsDang.map((d) => d.ma), ...dangYeuEm.map((d) => d.maDang)])
  const dang: Hang[] = dsDang.map((d) => {
    const tu = bacTruoc ? (bacTruoc.get(d.ma) ?? BAC_DANG_BAT_DAU) : null
    const den = bacSau ? (bacSau.get(d.ma) ?? BAC_DANG_BAT_DAU) : null
    const hienTai = dangHienTai.get(d.ma)
    return {
      ma: d.ma,
      ...(ten.has(d.ma) ? { ten: ten.get(d.ma) } : {}),
      dung: d.dung,
      tong: d.tong,
      ...(hienTai ? { bac: hienTai.bac } : {}),
      ...(den !== null && tu !== null ? { bacSau: den, bacTruoc: tu, doiBac: den > tu ? 'len' : den < tu ? 'xuong' : 'giu' } : {}),
    }
  })
  if (dang.length > 0) ra.dang = dang

  // ---- cauCanXemLai ----
  const giu = ungVien.filter((d) => !tuLuanTheoKho(kho.get(d.qid))).slice(0, TOI_DA_CAU_XEM_LAI)
  const cauCanXemLai = giu.map((d) => {
    const k = kho.get(d.qid)
    const de = deRutGon(k?.cau)
    const loiGiai = loiGiaiCua(k?.cau)
    const tb = tbGiayMap.get(d.qid)
    const on = namKtCau.get(d.qid)
    return {
      qid: d.qid,
      phan: d.phan,
      soCau: d.soCau,
      ...(de ? { de } : {}),
      ...(!laBoTrong(d.chon) ? { dapAnChon: d.chon } : {}),
      ...(d.dapAnDung ? { dapAnDung: d.dapAnDung } : {}),
      ...(loiGiai ? { loiGiai } : {}),
      ...(d.giay !== null ? { giay: d.giay } : {}),
      ...(tb !== undefined ? { tbGiay: tb } : {}),
      laDungNhungLau: d.dungSai === 1,
      ...(trongLichOn(on) ? { ngayOnLai: on.mocOnKe } : {}),
    }
  })
  if (cauCanXemLai.length > 0) ra.cauCanXemLai = cauCanXemLai

  // ---- aiDaLo: CHỈ điều chắc chắn (câu sai đã vào lịch ôn, mốc ôn, dạng ưu tiên, EXP đã cộng) ----
  const ngayMai = themNgay(homNay, 1)
  const saiVaoLich = [...new Set(dong.filter((d) => d.dungSai === 0 && d.qid).map((d) => d.qid))].flatMap((q) => {
    const c = namKtCau.get(q)
    return trongLichOn(c) ? [c] : []
  })
  const ngayOnGanNhat = saiVaoLich.reduce<string>((m, c) => (m === '' || c.mocOnKe < m ? c.mocOnKe : m), '')
  const soCauOnNgayMai = [...namKtCau.values()].filter((c) => trongLichOn(c) && c.mocOnKe <= ngayMai).length
  const dangBaiTapKe = dangYeuEm.map((d) => ({ ma: d.maDang, ...(ten.has(d.maDang) ? { ten: ten.get(d.maDang) } : {}) }))
  const aiDaLo: Hang = {
    ...(saiVaoLich.length > 0 ? { cauSaiVaoLichOn: saiVaoLich.length } : {}),
    ...(ngayOnGanNhat ? { ngayOnGanNhat } : {}),
    ...(soCauOnNgayMai > 0 ? { soCauOnNgayMai } : {}),
    ...(dangBaiTapKe.length > 0 ? { dangBaiTapKe } : {}),
    ...(o.coExp && exp > 0 ? { expDaCong: exp } : {}),
  }
  if (o.choThay) {
    if (dangBaiTapKe.length > 0) aiDaLo.dangUuTien = dangBaiTapKe
    if (ngayOnGanNhat) aiDaLo.ngayOnLai = { ngay: ngayOnGanNhat, soCau: saiVaoLich.filter((c) => c.mocOnKe === ngayOnGanNhat).length }
  }
  if (Object.keys(aiDaLo).length > 0) ra.aiDaLo = aiDaLo

  // ---- tienBo: ≤ 5 ca đã công bố gần nhất (cũ → mới, gồm ca này) + ≤ 3 dạng lên bậc ở ca này ----
  const diemTienBo = [
    ...lichSuEm.filter((d) => d.t <= t1).map((d) => ({ ngay: ngayVnCua(d.nopLuc), diem: tron(d.tong), maCa: d.maCa, t: d.t })),
    ...(luot.tong !== null && Number.isFinite(t1) ? [{ ngay: ngayVnCua(luot.nopLuc), diem: tron(luot.tong), maCa, t: t1 }] : []),
  ]
    .sort((a, b) => a.t - b.t)
    .slice(-SO_CA_TIEN_BO)
    .map(({ ngay, diem, maCa: m }) => ({ ...(ngay ? { ngay } : {}), diem, maCa: m }))
  const dangLenBac = dang
    .filter((d) => typeof d.bacSau === 'number' && typeof d.bacTruoc === 'number' && d.bacSau > d.bacTruoc)
    .sort((a, b) => (b.bacSau as number) - (b.bacTruoc as number) - ((a.bacSau as number) - (a.bacTruoc as number)))
    .slice(0, TOI_DA_DANG_LEN_BAC)
    .map((d) => ({ ma: d.ma, ...(d.ten !== undefined ? { ten: d.ten } : {}), tu: d.bacTruoc, den: d.bacSau }))
  if (diemTienBo.length > 0 || dangLenBac.length > 0) ra.tienBo = { ...(diemTienBo.length > 0 ? { diem: diemTienBo } : {}), ...(dangLenBac.length > 0 ? { dangLenBac } : {}) }

  // ---- hangTrongLop (chỉ lệnh thầy) ----
  if (o.choThay) {
    const lop = [...luotCuoiMoiEm(luotCa, true).values()].filter((l) => l.tong !== null)
    const cua = lop.find((l) => l.sbd === sbd)
    if (cua && cua.tong !== null) ra.hangTrongLop = { hang: 1 + lop.filter((l) => (l.tong as number) > (cua.tong as number)).length, siSo: lop.length }
  }
  return ra
}

/** Trung bình giây của từng câu qua các em đã nộp ca (lượt nộp mới nhất của mỗi em; bỏ tài khoản thử + em khoá), CHỈ câu có ≥ 5 em có số — MỘT truy vấn gộp. */
async function docTbGiayCau(env: Env, maCa: string, qids: readonly string[]): Promise<Map<string, number>> {
  const ra = new Map<string, number>()
  if (qids.length === 0) return ra
  const r = await env.DB.prepare(
    `SELECT c.qid, COUNT(DISTINCT c.sbd) AS so_em, AVG(c.giay) AS tb
       FROM chi_tiet_cau c
       JOIN luot l ON l.ma_ca = c.ma_ca AND l.sbd = c.sbd AND l.lan_thu = c.lan_thu
       LEFT JOIN hoc_sinh h ON h.sbd = c.sbd
      WHERE c.ma_ca = ? AND c.giay > 0 AND c.qid IN (SELECT value FROM json_each(?))
        AND COALESCE(l.nop_luc, '') <> '' AND l.trang_thai IN ('da_nop', 'khoa')
        AND l.lan_thu = (SELECT MAX(x.lan_thu) FROM luot x WHERE x.ma_ca = l.ma_ca AND x.sbd = l.sbd AND COALESCE(x.nop_luc, '') <> '' AND x.trang_thai IN ('da_nop', 'khoa'))
        AND c.sbd <> ? AND COALESCE(h.trang_thai, '') <> 'khoa'
      GROUP BY c.qid HAVING COUNT(DISTINCT c.sbd) >= ?`,
  )
    .bind(maCa, JSON.stringify(qids), SBD_THU, SAN_EM_TB_GIAY)
    .all<Hang>()
  for (const x of r.results ?? []) if (so(x.so_em) >= SAN_EM_TB_GIAY) ra.set(chuoi(x.qid), Math.round(so(x.tb)))
  return ra
}
/** Tổng EXP trong sổ gắn mã ca của em (`exp_so.ma_nguon = maCa`). */
async function docExp(env: Env, sbd: string, maCa: string): Promise<number> {
  const r = await env.DB.prepare('SELECT COALESCE(SUM(exp), 0) AS tong FROM exp_so WHERE sbd = ? AND ma_nguon = ?').bind(sbd, maCa).first<Hang>()
  return so(r?.tong)
}

// ---------------------------------------------------------------- LỆNH THẦY ----------------------------------------------------------------
/** `POST /gv/bao-cao-ca-em {maCa, sbd}` — báo cáo MỘT em (thân mục 2) + `em`, `hangTrongLop`; KHÔNG chặn công bố (vẫn có `congBo`). */
export async function gvBaoCaoCaEm(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa)
  const sbd = chuoi(b.sbd)
  if (!maCa) return { ok: false, lyDo: 'thieu', error: 'Thiếu mã ca.' }
  if (!sbd) return { ok: false, lyDo: 'thieu', error: 'Thiếu số báo danh.' }
  return baoCaoMotEm(env, { maCa, sbd, nowMs, chanCongBo: false, coExp: true, choThay: true })
}

interface ThongKeCau {
  qid: string
  phan: string
  soCau: number
  chuyenDe: string
  soEm: number
  soEmSai: number
  dapAnDung: string
  saiTheoDapAn: Map<string, number>
}

/** `POST /gv/bao-cao-ca {maCa}` — tổng quan CẢ LỚP của ca (mục 4). KHÔNG chặn công bố. */
export async function gvBaoCaoCa(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa)
  if (!maCa) return { ok: false, lyDo: 'thieu', error: 'Thiếu mã ca.' }
  try {
    return await dungBaoCaoCa(env, maCa, nowMs)
  } catch (e) {
    console.error('[bao-cao-ca] lỗi đọc (không trả nửa vời):', e instanceof Error ? e.message : e)
    return { ...LOI_DOC }
  }
}

async function dungBaoCaoCa(env: Env, maCa: string, nowMs: number): Promise<Hang> {
  const ca = await docCa(env, maCa)
  if (!ca) return { ok: false, lyDo: 'khong_co_ca', error: 'Không tìm thấy ca này.' }
  const ra: Hang = {
    ok: true,
    serverNow: nowMs,
    ca: { maCa, tenCa: ca.tenCa, ...(ca.loai ? { loai: ca.loai } : {}), trangThai: ca.trangThai, ...(ca.lop ? { lop: ca.lop } : {}) },
    congBo: khoiCongBo(ca),
  }
  const luotCa = await docLuotCaLop(env, maCa)
  const coDiem = [...luotCuoiMoiEm(luotCa, true).values()].filter((l) => l.tong !== null)
  if (coDiem.length === 0) return ra // chưa em nào có điểm: không số 0 giả
  const dsSbd = coDiem.map((l) => l.sbd)
  const chon = new Map(coDiem.map((l) => [l.sbd, l.lanThu]))
  const homNay = homNayVn(nowMs)

  const [dongTatCa, lichSu, namKtDang] = await Promise.all([docChiTietCa(env, maCa), docLichSuDiem(env, dsSbd, maCa), docNamKtDang(env, dsSbd)])
  const dong = dongTatCa.filter((d) => chon.get(d.sbd) === d.lanThu)
  const dongTheoEm = new Map<string, DongCau[]>()
  for (const d of dong) dongTheoEm.set(d.sbd, [...(dongTheoEm.get(d.sbd) ?? []), d])

  // ---- tongQuan ----
  const diem = coDiem.map((l) => l.tong as number)
  const phoDiem = Array.from({ length: 10 }, (_, i) => ({ tu: i, den: i + 1, so: 0 }))
  for (const t of diem) phoDiem[Math.min(9, Math.max(0, Math.floor(tron(t))))]!.so++
  const tongQuan: Hang = {
    soEm: coDiem.length,
    tb: tron(diem.reduce((a, c) => a + c, 0) / diem.length),
    cao: tron(Math.max(...diem)),
    thap: tron(Math.min(...diem)),
    phoDiem,
  }
  // phanTb: theo DẠNG ĐỀ PHỔ BIẾN NHẤT (số câu ba phần; hoà ⇒ dạng nhiều câu hơn); trần điểm = quotaPhan/100 của chính dạng ấy.
  const theoDang = new Map<string, { soCau: SoCauBaPhan; n: number }>()
  for (const ds of dongTheoEm.values()) {
    const sc = demSoCauBaPhan(ds)
    const khoa = `${sc.I}/${sc.II}/${sc.III}`
    const cu = theoDang.get(khoa)
    if (cu) cu.n++
    else theoDang.set(khoa, { soCau: sc, n: 1 })
  }
  const phoBien = [...theoDang.entries()].sort(([ka, a], [kb, bb]) => bb.n - a.n || bb.soCau.I + bb.soCau.II + bb.soCau.III - (a.soCau.I + a.soCau.II + a.soCau.III) || (ka < kb ? -1 : ka > kb ? 1 : 0))[0]?.[1]
  if (phoBien) {
    const quota = quotaPhan(phoBien.soCau)
    const soEmCoCau = dongTheoEm.size
    const phanTb: Hang[] = []
    for (const ma of CAC_PHAN) {
      if (phoBien.soCau[ma] <= 0) continue
      const dungTong = [...dongTheoEm.values()].reduce((a, ds) => a + ds.filter((d) => d.phan === ma && d.dungSai === 1).length, 0)
      const diemPhan = coDiem.flatMap((l) => {
        const v = l[KHOA_DIEM[ma]]
        return v === null ? [] : [v]
      })
      phanTb.push({
        ma,
        ...(diemPhan.length > 0 ? { diemTb: tron(diemPhan.reduce((a, c) => a + c, 0) / diemPhan.length) } : {}),
        dungTb: tron(dungTong / soEmCoCau),
        tong: phoBien.soCau[ma],
        toiDa: quota[ma] / 100,
      })
    }
    if (phanTb.length > 0) tongQuan.phanTb = phanTb
  }
  ra.tongQuan = tongQuan

  // ---- thống kê từng câu + từng dạng (từ bảng chấm của lượt đã chọn) ----
  const cau = new Map<string, ThongKeCau>()
  for (const d of [...dong].sort(xepDong)) {
    if (!d.qid || tuLuanTheoDong(d)) continue
    const t = cau.get(d.qid) ?? { qid: d.qid, phan: d.phan, soCau: d.soCau, chuyenDe: d.chuyenDe, soEm: 0, soEmSai: 0, dapAnDung: '', saiTheoDapAn: new Map<string, number>() }
    t.soEm++
    if (!t.dapAnDung && d.dapAnDung) t.dapAnDung = d.dapAnDung
    if (d.dungSai === 0) {
      t.soEmSai++
      if (!laBoTrong(d.chon)) t.saiTheoDapAn.set(d.chon, (t.saiTheoDapAn.get(d.chon) ?? 0) + 1)
    }
    cau.set(d.qid, t)
  }
  const ungVienSai = [...cau.values()]
    .filter((t) => t.soEmSai >= SAN_SO_EM_SAI && t.soEmSai * 10 >= t.soEm * SAN_TI_LE_SAI_CHUC)
    .sort((a, c) => c.soEmSai - a.soEmSai || c.soEmSai / c.soEm - a.soEmSai / a.soEm || (a.qid < c.qid ? -1 : a.qid > c.qid ? 1 : 0))
    .slice(0, TOI_DA_CAU_SAI_NHIEU + 4)
  const cauSaiTruoc = dong.filter((d) => d.dungSai === 0 && d.qid).map((d) => `${d.sbd}|${d.qid}`)
  const [kho, emCoLichOn] = await Promise.all([
    docKho(env, [...new Set(dong.map((d) => d.qid).filter(Boolean))], ungVienSai.map((t) => t.qid)),
    docLichOnTheoKhoa(env, cauSaiTruoc),
  ])
  const cauSaiNhieu = ungVienSai.filter((t) => !tuLuanTheoKho(kho.get(t.qid))).slice(0, TOI_DA_CAU_SAI_NHIEU)

  const nhom = new Map<string, { dung: number; tong: number; em: Set<string>; emSai: Set<string> }>()
  for (const d of dong) {
    const ma = d.qid ? maDangTuKho(d.qid, d.chuyenDe, kho) : ''
    if (!ma) continue
    const n = nhom.get(ma) ?? { dung: 0, tong: 0, em: new Set<string>(), emSai: new Set<string>() }
    n.tong++
    n.em.add(d.sbd)
    if (d.dungSai === 1) n.dung++
    if (d.dungSai === 0) n.emSai.add(d.sbd)
    nhom.set(ma, n)
  }
  const dangVap = [...nhom]
    .filter(([, n]) => n.emSai.size >= SAN_SO_EM_SAI && n.emSai.size * 10 >= n.em.size * SAN_TI_LE_SAI_CHUC)
    .map(([ma, n]) => ({ ma, tiLe: n.dung / n.tong, soEmSai: n.emSai.size, soEm: n.em.size }))
    .sort((a, c) => a.tiLe - c.tiLe || c.soEmSai - a.soEmSai || (a.ma < c.ma ? -1 : a.ma > c.ma ? 1 : 0))
    .slice(0, TOI_DA_DANG_VAP)

  // dạng nhiều em yếu nhất sau ca (theo hồ sơ `dangYeu`)
  const yeuTheoDang = new Map<string, number>()
  for (const d of namKtDang) if (dangYeu(d, homNay)) yeuTheoDang.set(d.maDang, (yeuTheoDang.get(d.maDang) ?? 0) + 1)
  const dangBaiTapKe = [...yeuTheoDang]
    .filter(([, n]) => n >= SAN_SO_EM_YEU_DANG)
    .sort(([ma, a], [mb, c]) => c - a || (ma < mb ? -1 : ma > mb ? 1 : 0))
    .slice(0, TOI_DA_DANG_BAI_TAP_KE)

  const ten = await tenDang(env, [...dangVap.map((d) => d.ma), ...cauSaiNhieu.map((t) => maDangTuKho(t.qid, t.chuyenDe, kho)), ...dangBaiTapKe.map(([ma]) => ma)])

  if (dangVap.length > 0) {
    ra.dangCaLopVap = dangVap.map((d) => ({ ma: d.ma, ...(ten.has(d.ma) ? { ten: ten.get(d.ma) } : {}), tiLeDung: tron(d.tiLe), soEmSai: d.soEmSai, soEm: d.soEm }))
  }
  if (cauSaiNhieu.length > 0) {
    ra.cauSaiNhieu = cauSaiNhieu.map((t) => {
      const k = kho.get(t.qid)
      const de = deRutGon(k?.cau)
      const tenD = ten.get(maDangTuKho(t.qid, t.chuyenDe, kho))
      const nhieuNhat = [...t.saiTheoDapAn].sort(([a, na], [c, nc]) => nc - na || (a < c ? -1 : a > c ? 1 : 0))[0]
      return {
        qid: t.qid,
        phan: t.phan,
        soCau: t.soCau,
        ...(de ? { de } : {}),
        ...(tenD ? { dang: tenD } : {}),
        soEmSai: t.soEmSai,
        soEm: t.soEm,
        ...(t.dapAnDung ? { dapAnDung: t.dapAnDung } : {}),
        ...(nhieuNhat ? { dapAnSaiNhieu: { dapAn: nhieuNhat[0], soEm: nhieuNhat[1] } } : {}),
      }
    })
  }

  // ---- emCanYY + hocSinh ----
  const hocSinh = coDiem
    .map((l) => {
      const truoc = diemLanTruoc(lichSu.get(l.sbd), maCa, l.nopLuc)
      const ds = dongTheoEm.get(l.sbd)
      const giayLam = thoiGianLamGiay(l)
      const tong = tron(l.tong as number)
      return {
        sbd: l.sbd,
        ...(l.hoTen ? { hoTen: l.hoTen } : {}),
        tong,
        ...(truoc ? { diemTruoc: tron(truoc.tong), doi: tron(tong - truoc.tong) } : {}),
        ...(giayLam !== null ? { thoiGianLamGiay: giayLam } : {}),
        ...(ds ? { soCauDung: ds.filter((d) => d.dungSai === 1).length, soCau: ds.length } : {}),
      }
    })
    .sort((a, c) => c.tong - a.tong || soSanhTen(a.hoTen ?? '', c.hoTen ?? '') || (a.sbd < c.sbd ? -1 : a.sbd > c.sbd ? 1 : 0))
  const emCanYY = hocSinh
    .filter((h) => h.tong < DIEM_CAN_Y || (h.doi !== undefined && h.doi <= -GIAM_DIEM_CAN_Y))
    .sort((a, c) => a.tong - c.tong || (a.doi ?? 0) - (c.doi ?? 0) || (a.sbd < c.sbd ? -1 : a.sbd > c.sbd ? 1 : 0))
    .slice(0, TOI_DA_EM_CAN_Y)
    .map((h) => ({ sbd: h.sbd, ...(h.hoTen !== undefined ? { hoTen: h.hoTen } : {}), tong: h.tong, ...(h.diemTruoc !== undefined ? { diemTruoc: h.diemTruoc, doi: h.doi } : {}) }))
  if (emCanYY.length > 0) ra.emCanYY = emCanYY
  ra.hocSinh = hocSinh

  // ---- aiDaLo (lớp): điều chắc chắn ----
  const soCauSaiVaoLichOn = emCoLichOn.length
  const soEmCoLichOn = new Set(emCoLichOn).size
  const aiDaLo: Hang = {
    ...(soCauSaiVaoLichOn > 0 ? { soCauSaiVaoLichOn, soEmCoLichOn } : {}),
    ...(dangBaiTapKe.length > 0 ? { dangBaiTapKe: dangBaiTapKe.map(([ma, soEm]) => ({ ma, ...(ten.has(ma) ? { ten: ten.get(ma) } : {}), soEm })) } : {}),
  }
  if (Object.keys(aiDaLo).length > 0) ra.aiDaLo = aiDaLo
  return ra
}
