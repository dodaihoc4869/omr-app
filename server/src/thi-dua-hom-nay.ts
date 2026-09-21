// THI ĐUA CHĂM HÔM NAY (thầy lệnh 21/09; điều phối giao Code 3): xếp các em CÙNG LỚP theo SỰ CHĂM trong ngày Việt Nam, không theo điểm, không theo game.
//   · `hsThiDuaHomNay`  lệnh của máy em: bảng top 3 (tên gọi rút gọn + thần thú) + vị trí của CHÍNH em. Không trả sbd, họ tên đầy đủ, EXP, khiên, tháp, ví của bất kỳ ai.
//   · `hangChamCuaEm`   hạng chăm của một em (cho lệnh phụ huynh: "Con đang hạng 9 trong 42 bạn về độ chăm hôm nay").
//   · `gvChuaHocHomNay` lệnh của thầy (cổng thầy ở router, KHÔNG kiểm mã ở đây): theo lớp, những em CHƯA làm câu nào hôm nay + tên thật.
//   · Hàm THUẦN (test được, không đọc D1/đồng hồ): `soSanhCham`, `xepHangCham`, `tinhBangThiDua`, `trongNhomCuoi`, `duSauMuoiPhanTram`, `tenRutGon`.
//
// LUẬT XẾP HẠNG (theo thứ tự; bạn nào hơn ở tiêu chí trước thì đứng trên, hoà mới xét tiêu chí sau):
//   1. Số câu KHÁC NHAU (DISTINCT qid) đã làm hôm nay, mọi nguồn, chỉ tính câu có kết quả (`ket_qua IS NOT NULL`: bỏ trống không phải "đã làm"; cùng luật `daLam` của giao thêm). Làm lại một câu không tăng số.
//   2. Đã đạt nhiệm vụ ngày hôm nay (`exp_so`: loai = 'dat_ngay', ngay_vn = hôm nay).
//   3. Chuỗi ngày học liên tiếp: ĐÚNG định nghĩa có sẵn `chuoiNgayHoc` (src/lib/han-bai-tap.ts): số ngày liên tiếp có ≥ 1 câu, tính lùi từ hôm nay (hôm nay chưa học thì tính từ hôm qua). Đọc sổ tối đa 60 ngày.
//   4. Ai đạt số câu đó SỚM hơn (thời điểm câu khác nhau thứ N, N = số câu của em ấy = MAX của "lần đầu làm từng qid" hôm nay).
//   Vẫn hoà hết ⇒ CÙNG hạng (kiểu 1, 1, 3). KHÔNG bao giờ xếp theo tên/sbd để định hạng (sbd chỉ để thứ tự hiển thị ổn định giữa hai em hoà hoàn toàn).
//   Em 0 câu KHÔNG có hạng và KHÔNG được xếp thứ tự với nhau.
// "20 % CUỐI": xếp em đã học theo hạng; nhóm cuối = ceil(số em đã học / 5) vị trí cuối. Đồng hạng ở RANH GIỚI thì CÙNG RA (cả nhóm hoà chỉ tính là nhóm cuối khi TOÀN BỘ nhóm hoà nằm trong các vị trí cuối);
// hạng 1 không bao giờ ở nhóm cuối (cả lớp hoà hết ⇒ không ai là "cuối"; lớp một em ⇒ không ai là "cuối"). `nhomCuoi` chỉ bật khi ≥ 60 % sĩ số đã học (lớp còn vắng nhiều thì "cuối" chưa có nghĩa).
// XEM THỬ: tài khoản thử SBD_THU_NGHIEM (không thuộc lớp nào) được xem bảng của một lớp thật với tư cách NGƯỜI XEM (xem `docLopXemThu`, `xemThu`); không bao giờ lọt vào sĩ số/top/xếp hạng của lớp.
// MỐC HIỂN THỊ (thầy chốt 21/09 15:56, `moc-no.ts`): số câu hôm nay, chuỗi ngày học, "đã học hôm nay" chỉ đếm sự kiện `luc ≥ mốc` (12:00 trưa 21/09) — sự kiện trước mốc KHÔNG vào số hiển thị (chuỗi bắt đầu đếm từ ngày mốc).
// Truy vấn D1 (chỉ đọc, không ghi): xếp hạng 3 (danh sách em + số câu/ngày + đạt nhiệm vụ ngày); thêm 1 truy vấn thần thú của top 3; lệnh thầy 2 truy vấn. Thiếu bảng/cột (chưa migration) ⇒ giá trị an toàn.
import type { Env } from './kieu'
import { gameIdentity } from './game-v2-auth'
import { CAN_DANG_NHAP } from './on-lai-nop'
import { themNgay } from './ho-so-nam-kt'
import { ngayVn } from './su-kien-hoc'
import { docMocHienThi, type MocHienThi } from './moc-no'
import { tenLopCuaEm } from './ten-lop'
import { ALIASES, PETS } from '../../src/game/than-thu-v2/core'
import { chuoiNgayHoc } from '../../src/lib/han-bai-tap'

type Dong = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
const so = (v: unknown): number => Number(v) || 0
const json = (v: unknown): string => JSON.stringify(v)

/**
 * Các em có câu ĐÃ CHẤM hôm nay (từ mốc hiển thị): `bind(mốc ISO, ngày VN)` — THỨ TỰ THAM SỐ (luc trước, ngày sau).
 * Cùng tập em với `SELECT DISTINCT sbd … WHERE ngay_vn = ? AND luc >= ? AND ket_qua IS NOT NULL`, nhưng bọc truy vấn con `LIMIT -1` để SQLite đi chỉ mục phủ `idx_skh_luc(luc, …)` (chỉ các sự kiện hôm nay)
 * thay vì quét cả sổ theo `idx_skh_em_ngay` (DISTINCT ưa chỉ mục đứng đầu bằng sbd): đo 21/09 trên D1 thật 29.156 → ~1,8 nghìn dòng/lần. Thiếu chỉ mục vẫn chạy đúng (chậm hơn).
 */
export const SQL_EM_DA_HOC_HOM_NAY = 'SELECT DISTINCT sbd FROM (SELECT sbd, ngay_vn FROM su_kien_hoc WHERE luc >= ? AND ket_qua IS NOT NULL LIMIT -1) WHERE ngay_vn = ?'
/**
 * Tham số đầu (`luc >= ?`) của `SQL_EM_DA_HOC_HOM_NAY`: MAX(mốc hiển thị, 00:00 hôm nay giờ VN). Mốc đứng yên nhiều ngày; bind thẳng mốc thì truy vấn con đọc MỌI sự kiện từ mốc rồi mới lọc `ngay_vn`
 * (số dòng đọc lớn dần theo ngày). Cùng tập em: `ngay_vn = hôm nay` ⇒ `luc ≥ 00:00 hôm nay`; chi phí luôn chỉ là sự kiện của hôm nay. (ISO cùng định dạng `.000Z` ⇒ so chuỗi = so thời điểm.)
 */
export function tuLucEmDaHoc(mocIso: string, ngay: string): string {
  const dau = new Date(Date.parse(`${ngay}T00:00:00+07:00`)).toISOString()
  return mocIso > dau ? mocIso : dau
}
/** Tài khoản thử của hệ thống — không tính vào lớp (khớp `SBD_THU` của gv-bang-tin.ts; test giữ hai chỗ khớp nhau, không nhập chéo để tránh vòng nhập). */
export const SBD_THU_NGHIEM = '12121212'
export const TOP_TOI_DA = 3
export const PHAN_TRAM_LOP_DA_HOC_TOI_THIEU = 60
export const SO_NGAY_DOC_CHUOI = 60
export const TEN_BAN_HOC = 'Bạn học'
export const LOI_KHONG_XEM_DUOC = 'Chưa xem được bảng thi đua hôm nay. Em thử lại sau nhé.'

// ================================================================== HÀM THUẦN ==================================================================

export interface EmCham {
  sbd: string
  /** Số câu KHÁC NHAU đã làm hôm nay (0 = chưa học). */
  soCau: number
  /** Đã đạt nhiệm vụ ngày hôm nay. */
  datNhiemVu: boolean
  /** Chuỗi ngày học liên tiếp (theo `chuoiNgayHoc`). */
  chuoi: number
  /** Thời điểm (ms) em đạt đủ `soCau` câu khác nhau; vắng/không hợp lệ ⇒ coi là MUỘN nhất. */
  lucDatSoCau?: number | null
}
export interface EmCoHang extends EmCham {
  hang: number
}

const lucCua = (e: EmCham): number => (typeof e.lucDatSoCau === 'number' && Number.isFinite(e.lucDatSoCau) ? e.lucDatSoCau : Infinity)

/** < 0: `a` đứng TRÊN `b`; > 0: `a` đứng dưới; 0: hoà hoàn toàn (cùng hạng). */
export function soSanhCham(a: EmCham, b: EmCham): number {
  if (a.soCau !== b.soCau) return b.soCau - a.soCau
  if (a.datNhiemVu !== b.datNhiemVu) return a.datNhiemVu ? -1 : 1
  if (a.chuoi !== b.chuoi) return b.chuoi - a.chuoi
  const la = lucCua(a)
  const lb = lucCua(b)
  if (la !== lb) return la < lb ? -1 : 1
  return 0
}

/** Chỉ em ≥ 1 câu, theo thứ tự xếp; hạng kiểu thi đấu (hoà hoàn toàn ⇒ cùng hạng, hạng kế nhảy cóc: 1, 1, 3). */
export function xepHangCham(ds: readonly EmCham[]): EmCoHang[] {
  const daHoc = ds.filter((e) => e.soCau >= 1).sort((a, b) => soSanhCham(a, b) || (a.sbd < b.sbd ? -1 : a.sbd > b.sbd ? 1 : 0))
  let hang = 1
  return daHoc.map((e, i) => {
    if (i > 0 && soSanhCham(daHoc[i - 1]!, e) !== 0) hang = i + 1
    return { ...e, hang }
  })
}

/** Số vị trí của nhóm cuối = ceil(20 % số em đã học). Viết bằng số nguyên (`/ 5`) để không phụ thuộc sai số của phép nhân thập phân. */
export const soViTriNhomCuoi = (soDaHoc: number): number => Math.ceil(Math.max(0, soDaHoc) / 5)

/** Em hạng `hang` (kiểu thi đấu) có thuộc 20 % cuối của `soDaHoc` em đã học không? Đồng hạng ở ranh giới ⇒ CÙNG RA; hạng 1 không bao giờ ở nhóm cuối. */
export function trongNhomCuoi(hang: number, soDaHoc: number): boolean {
  if (soDaHoc <= 0 || hang <= 1) return false
  return hang >= soDaHoc - soViTriNhomCuoi(soDaHoc) + 1
}

/** ≥ 60 % sĩ số đã học (số nguyên, không sai số thập phân). */
export function duSauMuoiPhanTram(daHoc: number, siSo: number): boolean {
  return siSo > 0 && daHoc * 100 >= siSo * PHAN_TRAM_LOP_DA_HOC_TOI_THIEU
}

/**
 * Tên gọi rút gọn để hiện cho cả lớp: bỏ từ đầu (họ), còn > 2 từ thì lấy 2 từ cuối, thêm chữ cái đầu của họ.
 * "Trần Minh Anh" ⇒ "Minh Anh T." · "Nguyễn Thị Minh Anh" ⇒ "Minh Anh N." · "Trần Anh" ⇒ "Anh T." · "Anh" (một từ, không họ) ⇒ "Anh" · rỗng ⇒ "Bạn học". KHÔNG bao giờ trả họ tên đầy đủ hay sbd.
 */
export function tenRutGon(hoTen: unknown): string {
  const tu = chuoi(hoTen).split(/\s+/).filter(Boolean)
  if (tu.length === 0) return TEN_BAN_HOC
  if (tu.length === 1) return tu[0]!
  const chuDauHo = [...tu[0]!][0]!.toLocaleUpperCase('vi')
  return `${tu.slice(1).slice(-2).join(' ')} ${chuDauHo}.`
}

export interface ThemDeVuot {
  /** Số câu em cần làm THÊM để vượt nhóm bạn ngay trên. */
  soCau: number
  /** Số bạn em sẽ vượt. */
  soBan: number
}
export interface ViTriCuaEm {
  hang: number | null
  soCau: number
  themDeVuot: ThemDeVuot | null
  nhomCuoi: boolean
  /** Chỉ có khi `nhomCuoi = true`: số câu em cần làm THÊM để ra khỏi nhóm cuối (em chưa học: số câu để vào rồi thoát nhóm cuối). */
  thoatNhomCuoi?: { soCau: number }
}
export interface BangThiDua {
  siSo: number
  daHoc: number
  /** Em đã học, theo thứ tự xếp. */
  thuTu: EmCoHang[]
  cuaEm: ViTriCuaEm
}

/**
 * Số câu THÊM ít nhất để `em` ra khỏi nhóm cuối. Giả lập: em làm thêm `them` câu (lúc đó là MUỘN nhất nên thua mọi bạn hoà tới đây; nhiệm vụ ngày giữ nguyên; em chưa học thì chuỗi +1 vì hôm nay có học),
 * các bạn khác giữ nguyên; lặp `them` = 1, 2, … tới khi em không còn trong nhóm cuối (chắc chắn dừng khi em hơn hết mọi bạn ⇒ hạng 1).
 */
function soCauThoatNhomCuoi(ds: readonly EmCham[], em: EmCham): number {
  const cacBan = ds.filter((e) => e.sbd !== em.sbd)
  const nhieuNhat = cacBan.reduce((t, e) => Math.max(t, e.soCau), 0)
  const gioiHan = Math.max(1, nhieuNhat - em.soCau + 1)
  for (let them = 1; them <= gioiHan; them++) {
    const gia: EmCham = { sbd: em.sbd, soCau: em.soCau + them, datNhiemVu: em.datNhiemVu, chuoi: em.soCau === 0 ? em.chuoi + 1 : em.chuoi, lucDatSoCau: Infinity }
    const xep = xepHangCham([...cacBan, gia])
    if (!trongNhomCuoi(xep.find((e) => e.sbd === em.sbd)!.hang, xep.length)) return them
  }
  return gioiHan
}

/**
 * Vị trí của em `sbdEm` trong lớp `ds` (mọi thành viên của lớp, kể cả em 0 câu; `siSo = ds.length`).
 *   · `themDeVuot` (em có câu): nhóm "ngay trên em" = những bạn XẾP TRÊN em có số câu ÍT NHẤT (gần em nhất; hoà số câu mà hơn ở tiêu chí sau cũng tính là trên) ⇒ soCau = số câu nhóm đó − số câu em + 1, soBan = số bạn trong nhóm. Hạng 1 ⇒ null.
 *   · Em chưa học: hạng null, `themDeVuot` = { số câu của bạn đứng cuối trong em đã học + 1, số bạn ở nhóm cuối ấy }; chưa ai học ⇒ { 1, 0 }.
 */
export function tinhBangThiDua(ds: readonly EmCham[], sbdEm: string): BangThiDua {
  const thuTu = xepHangCham(ds)
  const daHoc = thuTu.length
  const em = ds.find((e) => e.sbd === sbdEm) ?? { sbd: sbdEm, soCau: 0, datNhiemVu: false, chuoi: 0 }
  const emCoHang = thuTu.find((e) => e.sbd === sbdEm)
  let hang: number | null = null
  let themDeVuot: ThemDeVuot | null = null
  if (emCoHang) {
    hang = emCoHang.hang
    if (hang > 1) {
      const tren = thuTu.filter((e) => soSanhCham(e, emCoHang) < 0)
      const gan = Math.min(...tren.map((e) => e.soCau))
      themDeVuot = { soCau: gan - emCoHang.soCau + 1, soBan: tren.filter((e) => e.soCau === gan).length }
    }
  } else if (daHoc === 0) {
    themDeVuot = { soCau: 1, soBan: 0 }
  } else {
    const cuoi = Math.min(...thuTu.map((e) => e.soCau))
    themDeVuot = { soCau: cuoi + 1, soBan: thuTu.filter((e) => e.soCau === cuoi).length }
  }
  const nhomCuoi = duSauMuoiPhanTram(daHoc, ds.length) && (hang === null || trongNhomCuoi(hang, daHoc))
  const cuaEm: ViTriCuaEm = { hang, soCau: emCoHang ? emCoHang.soCau : 0, themDeVuot, nhomCuoi }
  if (nhomCuoi) cuaEm.thoatNhomCuoi = { soCau: soCauThoatNhomCuoi(ds, em) }
  return { siSo: ds.length, daHoc, thuTu, cuaEm }
}

// ================================================================== ĐỌC D1 (CHỈ ĐỌC) ==================================================================

/** Bảng/cột chưa có (migration chưa chạy) ⇒ giá trị mặc định; lỗi khác vẫn ném (cùng cách `tat` của ph-giao-them.ts). */
async function tat<T>(f: () => Promise<T>, mac: T): Promise<T> {
  try {
    return await f()
  } catch (e) {
    if (/no such (table|column)/i.test(e instanceof Error ? e.message : String(e))) return mac
    throw e
  }
}
const rong = { results: [] as Dong[] }

interface EmTrongTruong {
  hoTen: string
  tenLop: string
}

/** Em = hồ sơ (trừ đã khoá) ∪ danh sách cổng, bỏ tài khoản thử; hồ sơ thắng danh sách cổng (cùng cách gvLop/gvBangTin). Chưa có cột `ten_lop` ⇒ mọi em ở lớp mặc định theo khối. 1 truy vấn (2 khi phải lùi). */
async function docTatCaEm(env: Env): Promise<Map<string, EmTrongTruong>> {
  const dauHs = "SELECT sbd, ho_ten, lop, ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, 0 AS uu FROM danh_sach"
  const luiHs = "SELECT sbd, ho_ten, lop, NULL AS ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, 0 AS uu FROM danh_sach"
  let r: Dong[]
  try {
    r = ((await env.DB.prepare(dauHs).all<Dong>()).results ?? []) as Dong[]
  } catch {
    r = ((await env.DB.prepare(luiHs).all<Dong>()).results ?? []) as Dong[]
  }
  const em = new Map<string, EmTrongTruong>()
  for (const x of [...r].sort((a, c) => so(c.uu) - so(a.uu))) {
    const sbd = chuoi(x.sbd)
    if (!sbd || sbd === SBD_THU_NGHIEM) continue
    const co = em.get(sbd)
    if (co) {
      if (!co.hoTen) co.hoTen = chuoi(x.ho_ten) // hồ sơ thiếu tên ⇒ mượn tên ở danh sách cổng
      continue
    }
    em.set(sbd, { hoTen: chuoi(x.ho_ten), tenLop: tenLopCuaEm(chuoi(x.lop), x.ten_lop) })
  }
  return em
}

interface ThanhVienLop extends EmCham {
  hoTen: string
}

/** Lớp của em `sbd` + số liệu chăm hôm nay của cả lớp: 3 truy vấn (danh sách em, số câu/ngày, đạt nhiệm vụ ngày). Em không thuộc danh sách lớp (tài khoản thử, đã khoá) ⇒ null. */
async function docLopHomNay(env: Env, sbd: string, nowMs: number, moc: MocHienThi): Promise<{ lop: string; thanhVien: ThanhVienLop[] } | null> {
  const tatCa = await docTatCaEm(env)
  const emNay = tatCa.get(sbd)
  if (!emNay) return null
  const { thanhVien } = await soLieuCuaLop(env, [...tatCa].filter(([, e]) => e.tenLop === emNay.tenLop), null, nowMs, moc)
  return { lop: emNay.tenLop, thanhVien }
}

/**
 * Số liệu chăm hôm nay của MỘT lớp (2 truy vấn): mỗi (em, ngày) số qid KHÁC NHAU có kết quả + thời điểm của qid thứ N (MAX của "lần đầu làm từng qid"); ngày có dòng = ngày có học (chuỗi); đạt nhiệm vụ ngày.
 * `sbdThem` (chỉ chế độ XEM THỬ của tài khoản thử): đọc thêm số liệu của em này CÙNG hai truy vấn (không thêm truy vấn) và trả riêng ở `rieng` — KHÔNG lẫn vào `thanhVien`.
 */
async function soLieuCuaLop(env: Env, cungLop: [string, EmTrongTruong][], sbdThem: string | null, nowMs: number, moc: MocHienThi): Promise<{ thanhVien: ThanhVienLop[]; rieng: ThanhVienLop | null }> {
  const homNay = ngayVn(nowMs)
  const dsSbd = [...cungLop.map(([s]) => s), ...(sbdThem ? [sbdThem] : [])]
  const rSo = await tat(
    () => env.DB.prepare(
      `SELECT sbd, ngay_vn, COUNT(*) AS n, MAX(luc1) AS luc FROM (
         SELECT sbd, ngay_vn, qid, MIN(luc) AS luc1 FROM su_kien_hoc
          WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay_vn >= ? AND ngay_vn <= ? AND luc >= ? AND ket_qua IS NOT NULL
          GROUP BY sbd, ngay_vn, qid
       ) GROUP BY sbd, ngay_vn`,
    ).bind(json(dsSbd), themNgay(homNay, -(SO_NGAY_DOC_CHUOI - 1)), homNay, moc.iso).all<Dong>(), // `luc >= mốc` ⇒ chuỗi chỉ đếm từ ngày mốc
    rong,
  )
  const rDat = await tat(
    () => env.DB.prepare("SELECT DISTINCT sbd FROM exp_so WHERE ngay_vn = ? AND loai = 'dat_ngay' AND sbd IN (SELECT value FROM json_each(?))").bind(homNay, json(dsSbd)).all<Dong>(),
    rong,
  )
  const ngayCoHoc = new Map<string, string[]>()
  const homNayCua = new Map<string, { n: number; luc: number }>()
  for (const x of rSo.results ?? []) {
    const s = chuoi(x.sbd)
    const nd = chuoi(x.ngay_vn)
    ngayCoHoc.set(s, [...(ngayCoHoc.get(s) ?? []), nd])
    if (nd === homNay) homNayCua.set(s, { n: so(x.n), luc: Date.parse(chuoi(x.luc)) })
  }
  const dat = new Set((rDat.results ?? []).map((x) => chuoi(x.sbd)))
  const dung = (s: string, hoTen: string): ThanhVienLop => {
    const h = homNayCua.get(s)
    return { sbd: s, hoTen, soCau: h?.n ?? 0, datNhiemVu: dat.has(s), chuoi: chuoiNgayHoc(ngayCoHoc.get(s) ?? [], nowMs), lucDatSoCau: h ? h.luc : null }
  }
  return { thanhVien: cungLop.map(([s, e]) => dung(s, e.hoTen)), rieng: sbdThem ? dung(sbdThem, '') : null }
}

/**
 * XEM THỬ (tài khoản thử của hệ thống, `SBD_THU_NGHIEM`, không thuộc lớp nào): để thầy THẤY sản phẩm. Lớp xem = `cau_hinh.thi_dua_lop_xem_thu` nếu là một lớp có thật, không thì lớp có NHIỀU em đã học hôm nay nhất
 * (hoà ⇒ lớp đông hơn, rồi theo tên). Tài khoản thử KHÔNG được tính vào sĩ số/đã học/top/xếp hạng của lớp ấy. Thêm 2 truy vấn (cấu hình + em đã học hôm nay cả trường) so với lệnh của em thật.
 */
async function docLopXemThu(env: Env, nowMs: number, moc: MocHienThi): Promise<{ lop: string; thanhVien: ThanhVienLop[]; rieng: ThanhVienLop } | null> {
  const tatCa = await docTatCaEm(env)
  const soEmCuaLop = new Map<string, number>()
  for (const e of tatCa.values()) soEmCuaLop.set(e.tenLop, (soEmCuaLop.get(e.tenLop) ?? 0) + 1)
  if (soEmCuaLop.size === 0) return null
  const cfg = await tat(() => env.DB.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa = 'thi_dua_lop_xem_thu'").first<Dong>(), null)
  let lop = chuoi(cfg?.gia_tri)
  if (!lop || !soEmCuaLop.has(lop)) {
    const rHoc = await tat(() => env.DB.prepare(SQL_EM_DA_HOC_HOM_NAY).bind(tuLucEmDaHoc(moc.iso, ngayVn(nowMs)), ngayVn(nowMs)).all<Dong>(), rong)
    const daHocCuaLop = new Map<string, number>()
    for (const x of rHoc.results ?? []) {
      const e = tatCa.get(chuoi(x.sbd))
      if (e) daHocCuaLop.set(e.tenLop, (daHocCuaLop.get(e.tenLop) ?? 0) + 1)
    }
    lop = [...soEmCuaLop.keys()].sort((a, c) => (daHocCuaLop.get(c) ?? 0) - (daHocCuaLop.get(a) ?? 0) || (soEmCuaLop.get(c) ?? 0) - (soEmCuaLop.get(a) ?? 0) || a.localeCompare(c, 'vi'))[0]!
  }
  const { thanhVien, rieng } = await soLieuCuaLop(env, [...tatCa].filter(([, e]) => e.tenLop === lop), SBD_THU_NGHIEM, nowMs, moc)
  return { lop, thanhVien, rieng: rieng! }
}

export interface ThuCuaBan {
  /** Mã loài thần thú (id trong PETS, ví dụ 'lua_phuong'). */
  ma: string
  /** Cùng giá trị với `ma`, ĐÚNG tên trường màn học sinh đọc (`docThuBan` ở src/lib/thi-dua.ts đọc `pet ?? id`) — trả cả hai để hai phía luôn khớp. */
  pet: string
  cap: number
}

/**
 * Thần thú của các em trong top (1 truy vấn): mã loài + cấp — cùng luật đọc với `docThanThuSoThat` (thu-thach-rieng.ts): chưa có hồ sơ / chưa chọn thú (`choice = 1`) / loài lạ ⇒ vắng khỏi bản đồ (không bịa thú mặc định).
 * Mã loài cũ được đổi theo ALIASES như game-v2.ts. KHÔNG đọc biệt danh, EXP, khiên, tháp, ví.
 */
async function docThuCuaTop(env: Env, dsSbd: string[]): Promise<Map<string, ThuCuaBan>> {
  const ra = new Map<string, ThuCuaBan>()
  if (dsSbd.length === 0) return ra
  try {
    const r = await env.DB.prepare(
      `SELECT sbd, json_extract(json, '$.pet') AS pet, json_type(json, '$.pet') AS pet_kieu, json_extract(json, '$.cap') AS cap, json_extract(json, '$.choice') AS choice
         FROM game_v2_profile WHERE sbd IN (SELECT value FROM json_each(?))`,
    ).bind(json(dsSbd)).all<Dong>()
    for (const x of r.results ?? []) {
      if (Number(x.choice) === 1 || x.pet_kieu !== 'text') continue
      const id = chuoi(x.pet)
      const loai = PETS.find((p) => p.id === (ALIASES[id] ?? id))
      if (loai) ra.set(chuoi(x.sbd), { ma: loai.id, pet: loai.id, cap: Math.max(1, Math.min(120, Math.round(so(x.cap)) || 1)) })
    }
  } catch (e) {
    console.error('[thi-dua] đọc thần thú của top lỗi (bỏ qua):', e instanceof Error ? e.message : e)
  }
  return ra
}

// ================================================================== LỆNH ==================================================================

export interface DongTop {
  /** Hạng kiểu thi đấu (hoà ⇒ cùng hạng). */
  hang: number
  /** Tên gọi rút gọn, ví dụ "Minh Anh T." — không sbd, không họ tên đầy đủ. */
  ten: string
  soCau: number
  chuoi: number
  thu: ThuCuaBan | null
  /** Dòng này là CHÍNH em đang xem. */
  laEm: boolean
}

/**
 * `POST /hs/thi-dua-hom-nay {token}` — thi đua chăm hôm nay của lớp em (chỉ đọc). Sai đăng nhập ⇒ `{ok:false, error}` cùng chữ với `/hs/thu-thach-hom-nay`.
 * Trả `{ ok, lop, siSo, daHoc, top: DongTop[≤3], cuaEm: ViTriCuaEm, capNhatLuc }`. Em không thuộc danh sách lớp (tài khoản thử/đã khoá) ⇒ `siSo = 0` (app ẩn thẻ).
 */
export async function hsThiDuaHomNay(env: Env, b: Dong, nowMs: number = Date.now()): Promise<Dong> {
  let sbd: string
  try {
    sbd = await gameIdentity(env, b)
  } catch {
    return { ok: false, error: CAN_DANG_NHAP }
  }
  const capNhatLuc = new Date(nowMs).toISOString()
  try {
    const moc = await docMocHienThi(env)
    if (sbd === SBD_THU_NGHIEM) return await xemThu(env, nowMs, capNhatLuc, moc)
    const lop = await docLopHomNay(env, sbd, nowMs, moc)
    if (!lop) return { ok: true, lop: '', siSo: 0, daHoc: 0, top: [], cuaEm: { hang: null, soCau: 0, themDeVuot: null, nhomCuoi: false }, capNhatLuc }
    const bang = tinhBangThiDua(lop.thanhVien, sbd)
    const dau = bang.thuTu.slice(0, TOP_TOI_DA)
    const thu = await docThuCuaTop(env, dau.map((e) => e.sbd))
    const tenCua = new Map(lop.thanhVien.map((t) => [t.sbd, t.hoTen] as const))
    const top: DongTop[] = dau.map((e) => ({ hang: e.hang, ten: tenRutGon(tenCua.get(e.sbd)), soCau: e.soCau, chuoi: e.chuoi, thu: thu.get(e.sbd) ?? null, laEm: e.sbd === sbd }))
    return { ok: true, lop: lop.lop, siSo: bang.siSo, daHoc: bang.daHoc, top, cuaEm: bang.cuaEm, capNhatLuc }
  } catch (e) {
    console.error('[thi-dua] lỗi (báo em thử lại):', e instanceof Error ? e.message : e)
    return { ok: false, error: LOI_KHONG_XEM_DUOC }
  }
}

/**
 * Trả lời cho tài khoản thử (thầy xem sản phẩm): `top` + sĩ số + đã học của lớp thật, KHÔNG có tài khoản thử trong đó (`laEm` luôn false). `cuaEm`: số câu THẬT của tài khoản thử hôm nay;
 * hạng chỉ là GIẢ ĐỊNH "nếu em ở lớp này" (không ghi vào đâu; kẹp ≤ sĩ số vì màn học sinh bỏ ô khi hạng vượt sĩ số); chưa làm câu nào ⇒ hạng null + themDeVuot như em 0 câu; `nhomCuoi`, `thoatNhomCuoi` theo đúng luật xếp.
 * Không có lớp nào trong hệ thống ⇒ `siSo = 0` (màn ẩn ô). Luôn kèm `cheDoXemThu: true`.
 */
async function xemThu(env: Env, nowMs: number, capNhatLuc: string, moc: MocHienThi): Promise<Dong> {
  const lop = await docLopXemThu(env, nowMs, moc)
  if (!lop) return { ok: true, lop: '', siSo: 0, daHoc: 0, top: [], cuaEm: { hang: null, soCau: 0, themDeVuot: null, nhomCuoi: false }, capNhatLuc, cheDoXemThu: true }
  const that = tinhBangThiDua(lop.thanhVien, SBD_THU_NGHIEM) // lớp thật, không có tài khoản thử
  const gia = lop.rieng.soCau > 0 ? tinhBangThiDua([...lop.thanhVien, lop.rieng], SBD_THU_NGHIEM) : that // giả định em ở lớp này
  const dau = that.thuTu.slice(0, TOP_TOI_DA)
  const thu = await docThuCuaTop(env, dau.map((e) => e.sbd))
  const tenCua = new Map(lop.thanhVien.map((t) => [t.sbd, t.hoTen] as const))
  const top: DongTop[] = dau.map((e) => ({ hang: e.hang, ten: tenRutGon(tenCua.get(e.sbd)), soCau: e.soCau, chuoi: e.chuoi, thu: thu.get(e.sbd) ?? null, laEm: false }))
  const cuaEm: ViTriCuaEm = { ...gia.cuaEm, soCau: lop.rieng.soCau, hang: lop.rieng.soCau > 0 && gia.cuaEm.hang !== null ? Math.min(gia.cuaEm.hang, that.siSo) : null }
  return { ok: true, lop: lop.lop, siSo: that.siSo, daHoc: that.daHoc, top, cuaEm, capNhatLuc, cheDoXemThu: true }
}

/** Hạng chăm hôm nay của MỘT em trong lớp em ấy (cùng luật xếp hạng); null nếu em chưa học hôm nay, không xác định được lớp, hoặc đọc lỗi. 3 truy vấn. */
export async function hangChamCuaEm(env: Env, sbd: string, nowMs: number = Date.now(), moc?: MocHienThi): Promise<{ hang: number; siSo: number } | null> {
  try {
    const lop = await docLopHomNay(env, sbd, nowMs, moc ?? (await docMocHienThi(env)))
    if (!lop) return null
    const bang = tinhBangThiDua(lop.thanhVien, sbd)
    return bang.cuaEm.hang === null ? null : { hang: bang.cuaEm.hang, siSo: bang.siSo }
  } catch (e) {
    console.error('[thi-dua] đọc hạng chăm lỗi (bỏ qua):', e instanceof Error ? e.message : e)
    return null
  }
}

const tenGoiCuoi = (hoTen: string): string => hoTen.split(/\s+/).filter(Boolean).pop() ?? ''
const soSanhTen = (a: { sbd: string; hoTen: string }, b: { sbd: string; hoTen: string }): number =>
  tenGoiCuoi(a.hoTen).localeCompare(tenGoiCuoi(b.hoTen), 'vi') || a.hoTen.localeCompare(b.hoTen, 'vi') || (a.sbd < b.sbd ? -1 : a.sbd > b.sbd ? 1 : 0)

/**
 * CHO THẦY (cổng thầy ở router — KHÔNG kiểm mã ở đây): theo lớp, số em CHƯA làm câu nào hôm nay / sĩ số + tên thật. Chỉ lớp có ≥ 1 em chưa học; lớp xếp theo tên; trong lớp xếp theo TÊN (chữ cuối họ tên, rồi cả họ tên). 2 truy vấn.
 * "Đã học" = có ≥ 1 câu có kết quả hôm nay TỪ MỐC HIỂN THỊ (cùng luật với bảng thi đua và số "Em đã học hôm nay" của Bảng tin).
 */
export async function gvChuaHocHomNay(
  env: Env,
  nowMs: number = Date.now(),
  moc?: MocHienThi,
): Promise<{ ngay: string; theoLop: { lop: string; siSo: number; chuaHoc: number; em: { sbd: string; hoTen: string }[] }[] }> {
  const ngay = ngayVn(nowMs)
  const tatCa = await docTatCaEm(env)
  const mocHt = moc ?? (await docMocHienThi(env))
  const rHoc = await tat(() => env.DB.prepare(SQL_EM_DA_HOC_HOM_NAY).bind(tuLucEmDaHoc(mocHt.iso, ngay), ngay).all<Dong>(), rong)
  const daHoc = new Set((rHoc.results ?? []).map((x) => chuoi(x.sbd)))
  const nhom = new Map<string, { siSo: number; em: { sbd: string; hoTen: string }[] }>()
  for (const [sbd, e] of tatCa) {
    const g = nhom.get(e.tenLop) ?? { siSo: 0, em: [] }
    g.siSo++
    if (!daHoc.has(sbd)) g.em.push({ sbd, hoTen: e.hoTen })
    nhom.set(e.tenLop, g)
  }
  const theoLop = [...nhom]
    .filter(([, g]) => g.em.length > 0)
    .map(([lop, g]) => ({ lop, siSo: g.siSo, chuaHoc: g.em.length, em: [...g.em].sort(soSanhTen) }))
    .sort((a, c) => a.lop.localeCompare(c.lop, 'vi'))
  return { ngay, theoLop }
}
