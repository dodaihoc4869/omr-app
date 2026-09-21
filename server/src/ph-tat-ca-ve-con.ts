// `POST /ph/tat-ca-ve-con {pass}` — thẻ "Ca kiểm tra gần nhất của con" + trang "Tất cả về con" của phụ huynh (hợp đồng docs/hop-dong-xem-diem-v2-2109.md mục 6 + bổ sung `homNay`, `manhYeu` của điều phối 21/09).
// ĐỌC-CHỈ, không AI, ≤ 12 truy vấn D1 cho phần dữ liệu + 3 cho `doCham` (hangChamCuaEm dùng chung với lệnh thi đua) = ≤ 15 tổng (kể cả xác thực; đo trong test). KHÔNG trường nào của game (không thần thú, EXP, khiên, chuỗi game, đoàn, đảo, võ đài), không xếp hạng, không so với bạn.
// Khối nào không có số thật thì VẮNG (không số 0 giả, không mảng bịa).
//
// LUẬT CHE (đứng trên mọi khối; luật công bố ở `cong-bo-diem.ts`): sự kiện học của ca CHƯA công bố, của bài tập về nhà CHƯA NỘP, của gói "gia đình giao" CHƯA NỘP bị CHE — nó KHÔNG vào bất kỳ con số nào có đúng/sai
// (tổng quan, nhịp học, dạng vấp, bậc dạng, lịch ôn, tiến bộ), và ở `homNay.cau[]` chỉ còn `{luc, nguon, che, giay?}` (không đề, không đáp án, không đúng/sai, không tên dạng, KHÔNG mã câu `qid`). Điện thoại phụ huynh không được thành đường lộ đáp án cho con.
// Ca chưa công bố ở `caGanNhat`: chỉ `congBo` + `soEmDaNop/soEmDaVao` (không điểm, số câu, phần, so với lần trước); `tienBo.diem` chỉ gồm ca ĐÃ công bố.
// Hồ sơ nắm kiến thức (bậc, lịch ôn) ở đây được PHÁT LẠI từ sổ học ĐÃ BỎ sự kiện bị che (bằng chính `phatLaiSuKien` của hồ sơ) — bảng `nam_kt_*` dựng từ toàn bộ sổ nên đếm câu sai của ca chưa công bố; đọc thẳng chúng là lộ điểm.
// Xác thực: `sbdCuaPhuHuynh` nhận token HOẶC SBD trần (hằng `CHI_NHAN_TOKEN`; như `/ph/giao-them` sau da5b5b5). Việc DUY NHẤT có ghi D1 là dòng đếm truy cập `ph_truy_cap` của chính hàm xác thực đó (không phải của tệp này).
import type { Env } from './kieu'
import { laDatNgay } from '../../src/lib/dat-nhiem-vu-ngay'
import { GIAO_THEM } from '../../src/lib/giao-them-cho-con'
import { phutUocTinhChang } from '../../src/lib/btvn-nang-do-lich'
import type { CauHinhBoNao } from './bo-nao'
import { docBoNaoAiChoPhuHuynh } from './bo-nao-doc'
import { laCauTuLuan } from './cam-tu-luan'
import { coChuGame } from './chu-game'
import { chuoiLoiGiai } from './goi-cu'
import { docTrangThaiCongBo, type TrangThaiCongBoCa } from './cong-bo-diem'
import { BAC_DANG_BAT_DAU } from './ho-so-cau-hinh'
import { phatLaiSuKien, themNgay, type SuKienDoc, type TraCuuCau } from './ho-so-nam-kt'
import { sbdCuaPhuHuynh } from './ph-truy-cap'
import { ngayVn } from './su-kien-hoc'
import { tenCuaCacDang } from './ten-dang-bo-nao'
import { hangChamCuaEm } from './thi-dua-hom-nay'

type Row = Record<string, unknown>

// ------------------------------------------------------------------ hằng số (test khoá từng con số) ------------------------------------------------------------------
/** Chỉ nhận TOKEN liên kết riêng? `false` (hiện nay): có `pass` ⇒ danh tính từ token và BỎ `sbd` trong thân; không có ⇒ nhận SBD trần như `/parent-news`, `/mom`, `/ph/giao-them` (sổ `ph_truy_cap` thật 21/09: 100 % phụ huynh vào bằng SBD trần, chưa ai có token — chỉ-token thì không ai mở được bảng).
 *  Siết lại khi thầy phát liên kết riêng: đổi thành `true` (test khoá cả hai hướng cách nối `chiToken`). Token sai/hết hạn KHÔNG bao giờ rơi xuống SBD trần. */
export const CHI_NHAN_TOKEN = false
export const SO_NGAY_NHIP = 14
export const TOI_DA_DIEM_TIEN_BO = 8
export const TOI_DA_DANG_TIEN_BO_NHAT = 3
export const TOI_DA_DANG = 5 // bacTheoDang, dangVap, vuaLenBac
export const TOI_DA_BAI_GAN = 5
export const TOI_DA_BAI_DANG_CHAY = 5
export const TOI_THIEU_LUOT_GIO_THUONG_HOC = 20
export const DANG_VAP_TOI_THIEU_LUOT = 3
export const DANG_VAP_TI_LE_DUNG_TOI_DA = 0.5
export const LAM_TOT_TI_LE_DUNG_TOI_THIEU = 0.8
export const TOI_DA_MANH_YEU = 3
export const SO_NGAY_VUA_LEN_BAC = 3
export const PHIEN_CACH_TOI_DA_PHUT = 10
export const TOI_DA_CAU_HOM_NAY = 120
export const DE_RUT_GON_TOI_DA = 160
export const TOI_DA_TRUY_VAN = 12
const MOI_GIAY_MAC_DINH = 90

const so = (v: unknown): number => Number(v) || 0
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
const soHoacNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const tron = (n: number, k: number): number => Math.round(n * 10 ** k) / 10 ** k
const json = (v: unknown): string => JSON.stringify(v)
const parse = <T>(v: unknown, mac: T): T => {
  try { return typeof v === 'string' && v ? (JSON.parse(v) as T) : mac } catch { return mac }
}
const gioVn = (luc: string): number => new Date(Date.parse(luc) + 7 * 3_600_000).getUTCHours()

// ------------------------------------------------------------------ truy vấn có đếm ------------------------------------------------------------------
const thieuBang = (e: unknown): boolean => /no such (table|column)/i.test(e instanceof Error ? e.message : String(e))

function boHoi(env: Env) {
  return {
    /** Truy vấn ĐỌC. Thiếu bảng/cột (migration chưa chạy) ⇒ `null` (khối liên quan vắng); lỗi khác vẫn ném (không nuốt lỗi D1 thật). */
    async hoi(sql: string, ...bind: unknown[]): Promise<Row[] | null> {
      try {
        return (await env.DB.prepare(sql).bind(...bind).all<Row>()).results ?? []
      } catch (e) {
        if (thieuBang(e)) return null
        throw e
      }
    },
  }
}

// ------------------------------------------------------------------ cấu hình Bộ não (đọc chung một truy vấn gộp) ------------------------------------------------------------------
/**
 * Cùng luật với `docCauHinhTangDoc` (bo-nao-doc.ts) nhưng từ CHUỖI đã đọc sẵn (tiết kiệm một truy vấn): `null` khi tầng đọc phải im (tắt, hoặc không lớp nào ở chế độ THẬT).
 * Test khoá hai đường cho cùng kết quả trên nhiều cấu hình.
 */
export function cauHinhTangDocTuChuoi(giaTri: unknown): CauHinhBoNao | null {
  const o = parse<Row>(giaTri, {})
  const lop = Array.isArray(o.lopThat) ? o.lopThat.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 60).slice(0, 50) : []
  const ch: CauHinhBoNao = { bat: typeof o.bat === 'boolean' ? o.bat : true, cheDo: o.cheDo === 'that' ? 'that' : 'bong', lopThat: [...new Set(lop)], thuThach: o.thuThach !== false }
  if (!ch.bat) return null
  if (ch.cheDo !== 'that' && ch.lopThat.length === 0) return null
  return ch
}

// ------------------------------------------------------------------ luật che ------------------------------------------------------------------
export type LyDoChe = 'chua_cong_bo' | 'chua_nop'

/** Sự kiện học kèm mã nguồn + lượt (để che và nối `chi_tiet_cau`). */
interface Sk extends SuKienDoc {
  maNguon: string
  lan: number
  che: LyDoChe | null
}

function cheCua(e: Pick<Sk, 'nguon' | 'maNguon'>, congBo: ReadonlyMap<string, TrangThaiCongBoCa>, btvnDaNop: ReadonlyMap<string, boolean>, momDaNop: ReadonlyMap<string, boolean>): LyDoChe | null {
  // Không biết trạng thái ⇒ CHE (đóng cửa khi thiếu tin).
  if (e.nguon === 'thi') return congBo.get(e.maNguon)?.daCongBo ? null : 'chua_cong_bo'
  if (e.nguon === 'btvn' || e.nguon === 'btvn_lo') return btvnDaNop.get(e.maNguon) ? null : 'chua_nop'
  if (e.nguon === 'mom') return momDaNop.get(e.maNguon) ? null : 'chua_nop'
  return null
}

/** Nhãn NGUỒN hiển thị cho phụ huynh — không một chữ nào của game. `null` = bỏ khỏi dòng thời gian / danh sách câu. */
export function nhanNguon(nguon: string): string | null {
  switch (nguon) {
    case 'on_lai': return 'on_lai'
    case 'btvn': case 'btvn_lo': return 'btvn'
    case 'thu_thach_rieng': return 'thu_thach_rieng'
    case 'game': return 'luyen_dang_vap'
    case 'mom': return 'gia_dinh_giao'
    case 'thi': return 'ca_kiem_tra'
    case 'len_bang': return 'len_bang'
    case 'khac_phuc': return 'khac_phuc'
    case 'luyen': return 'luyen_de'
    default: return null
  }
}

/** Đề rút gọn ≤ `toiDa` ký tự, giữ công thức: không cắt giữa một cặp `$…$`. */
export function deRutGon(text: unknown, toiDa: number = DE_RUT_GON_TOI_DA): string {
  const s = chuoi(text).replace(/\s+/g, ' ')
  if (s.length <= toiDa) return s
  let c = s.slice(0, toiDa - 1)
  if ((c.match(/\$/g) ?? []).length % 2 === 1) c = c.slice(0, c.lastIndexOf('$'))
  return `${c.trimEnd()}…`
}

/** Khung 2 giờ (giờ VN, mỗi giờ tròn là một điểm bắt đầu) có nhiều lượt chấm nhất; ít hơn `TOI_THIEU_LUOT_GIO_THUONG_HOC` lượt ⇒ `undefined`. */
export function gioThuongHoc(cacLuc: readonly string[]): string | undefined {
  if (cacLuc.length < TOI_THIEU_LUOT_GIO_THUONG_HOC) return undefined
  const theoGio = new Array<number>(24).fill(0)
  for (const l of cacLuc) theoGio[gioVn(l)]!++
  let tot = 0
  let n = -1
  for (let h = 0; h < 24; h++) {
    const c = theoGio[h]! + theoGio[(h + 1) % 24]!
    // nhiều lượt nhất; hoà ⇒ khung mở đầu bằng giờ có nhiều lượt hơn (khung ôm đúng chỗ học); vẫn hoà ⇒ khung sớm hơn
    if (c > n || (c === n && theoGio[h]! > theoGio[tot]!)) { n = c; tot = h }
  }
  const hh = (x: number): string => `${String(x % 24).padStart(2, '0')}:00`
  return `${hh(tot)}–${hh(tot + 2)}`
}

const TEN_BAC = ['biet', 'hieu', 'van_dung'] as const

// ------------------------------------------------------------------ dòng thời gian ------------------------------------------------------------------
interface Phien { key: string; ev: Sk[] }
function gomPhien(homNayEv: readonly Sk[]): Phien[] {
  const nhom = new Map<string, Sk[]>()
  for (const e of homNayEv) {
    const k = `${e.nguon}|${e.maNguon}`
    const l = nhom.get(k)
    if (l) l.push(e)
    else nhom.set(k, [e])
  }
  const ra: Phien[] = []
  for (const [key, ds] of nhom) {
    const xep = [...ds].sort((a, b) => (Date.parse(a.luc) || 0) - (Date.parse(b.luc) || 0) || (a.khoa < b.khoa ? -1 : 1))
    let cur: Sk[] = [xep[0]!]
    for (let i = 1; i < xep.length; i++) {
      const cach = (Date.parse(xep[i]!.luc) || 0) - (Date.parse(xep[i - 1]!.luc) || 0)
      if (cach <= PHIEN_CACH_TOI_DA_PHUT * 60_000) cur.push(xep[i]!)
      else { ra.push({ key, ev: cur }); cur = [xep[i]!] }
    }
    ra.push({ key, ev: cur })
  }
  return ra.sort((a, b) => (Date.parse(a.ev[0]!.luc) || 0) - (Date.parse(b.ev[0]!.luc) || 0) || (a.key < b.key ? -1 : 1))
}

// ------------------------------------------------------------------ TRUY VẤN GỘP ------------------------------------------------------------------
interface PhanHoSo { bang: string; batBuoc: boolean; sql: string; bind: (sbd: string, homNay: string) => unknown[] }
const PHAN_HO_SO: PhanHoSo[] = [
  { bang: 'hoc_sinh', batBuoc: true, sql: "SELECT 'em' AS k, ho_ten AS a, lop AS b, NULL AS c FROM hoc_sinh WHERE sbd = ?", bind: (s) => [s] },
  { bang: 'cau_hinh', batBuoc: true, sql: "SELECT 'cfg', gia_tri, NULL, NULL FROM cau_hinh WHERE khoa = 'bo_nao'", bind: () => [] },
  { bang: 'ph_giao_them', batBuoc: false, sql: "SELECT 'gt', COUNT(*), NULL, NULL FROM ph_giao_them WHERE sbd = ? AND ngay_vn = ?", bind: (s, n) => [s, n] },
  { bang: 'ke_hoach_ngay', batBuoc: false, sql: "SELECT 'kh', ngan_sach_json, viec_json, la_ngay_nghi FROM ke_hoach_ngay WHERE sbd = ? AND ngay = ?", bind: (s, n) => [s, n] },
  { bang: 'nam_kt_cau', batBuoc: false, sql: "SELECT 'cau', qid, ma_dang, chuyen_de FROM nam_kt_cau WHERE sbd = ?", bind: (s) => [s] },
]

async function docHoSo(hoi: ReturnType<typeof boHoi>['hoi'], sbd: string, homNay: string): Promise<Row[]> {
  let con = [...PHAN_HO_SO]
  for (;;) {
    const r = await hoi(con.map((p) => p.sql).join(' UNION ALL '), ...con.flatMap((p) => p.bind(sbd, homNay)))
    if (r !== null) return r
    // `hoi` trả null khi thiếu bảng/cột (migration chưa chạy): bỏ dần các phần không bắt buộc (từ cuối lên) rồi thử lại.
    const boi = [...con].reverse().find((p) => !p.batBuoc)
    if (!boi) return []
    con = con.filter((p) => p !== boi)
  }
}

function sqlBtvn(nangDo: boolean, coMom: boolean): string {
  const cotNangDo = nangDo
    ? 'be.so_chang, COALESCE(be.lo_da_xong, 0) AS lo_da_xong, be.so_cau_em, COALESCE(b.ca_nhan, 0) AS ca_nhan'
    : 'NULL AS so_chang, COALESCE(be.lo_da_xong, 0) AS lo_da_xong, NULL AS so_cau_em, 0 AS ca_nhan'
  const bt = `SELECT 'bt' AS k, x.ma_btvn AS c1, x.nop_luc AS c2, x.so_dung AS c3, x.em_so_cau AS c4, x.han_nop AS c5, x.giao_luc AS c6, x.so_cau_bai AS c7, x.ten AS c8, x.so_chang AS c9, x.lo_da_xong AS c10, x.so_cau_em AS c11, x.ca_nhan AS c12
    FROM (SELECT be.ma_btvn, be.nop_luc, be.so_dung, be.so_cau AS em_so_cau, b.han_nop, b.giao_luc, b.so_cau AS so_cau_bai, COALESCE(NULLIF(TRIM(c.ten_ca), ''), NULLIF(TRIM(d.ten_de), ''), '') AS ten, ${cotNangDo}
            FROM btvn_em be JOIN btvn b ON b.ma_btvn = be.ma_btvn LEFT JOIN ca c ON c.ma_ca = b.ma_ca LEFT JOIN de_kho d ON d.ma_de = b.ma_de
           WHERE be.sbd = ? AND be.thu_hoi = 0 AND b.da_xoa = 0 ORDER BY b.giao_luc DESC LIMIT 200) x`
  const mom = " UNION ALL SELECT 'mom', id, submitted_at, title, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL FROM mom_bai WHERE sbd = ? AND id IN (SELECT value FROM json_each(?))"
  return coMom ? bt + mom : bt
}

/** BTVN + gói mom (gộp một truy vấn). Thiếu cột nâng đỡ ⇒ lùi; thiếu bảng mom ⇒ bỏ nhánh mom; thiếu bảng BTVN ⇒ `null`. */
async function docBtvnVaMom(hoi: ReturnType<typeof boHoi>['hoi'], sbd: string, dsMom: string[]): Promise<Row[] | null> {
  for (const [nangDo, coMom] of [[true, true], [false, true], [true, false], [false, false]] as const) {
    const r = await hoi(sqlBtvn(nangDo, coMom), sbd, ...(coMom ? [sbd, json(dsMom)] : []))
    if (r !== null) return r
  }
  return null
}

// ------------------------------------------------------------------ LỆNH ------------------------------------------------------------------
export async function phTatCaVeCon(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Row> {
  const { sbd } = await sbdCuaPhuHuynh(env, b, 'ph-tat-ca-ve-con', { chiToken: CHI_NHAN_TOKEN })
  const { hoi } = boHoi(env)
  const homNay = ngayVn(nowMs)
  const homQua = themNgay(homNay, -1)
  const ngayMai = themNgay(homNay, 1)
  const dau14 = themNgay(homNay, -(SO_NGAY_NHIP - 1))
  const ra: Row = { ok: true, serverNow: nowMs, hoTen: '' }

  // 1 · truy vấn gộp: tên em, cấu hình Bộ não, số lượt giao thêm hôm nay, kế hoạch hôm nay, (qid → dạng) của hồ sơ
  let hoTen = ''
  let cfgBoNao: unknown
  let daGiaoThem: number | null = null
  let kh: Row | null = null
  let coHoSo = false
  const tra: { dang: Map<string, string>; chuyenDe: Map<string, string> } = { dang: new Map(), chuyenDe: new Map() }
  for (const x of await docHoSo(hoi, sbd, homNay)) {
    if (x.k === 'em') hoTen = chuoi(x.a)
    else if (x.k === 'cfg') cfgBoNao = x.a
    else if (x.k === 'gt') daGiaoThem = so(x.a)
    else if (x.k === 'kh') kh = x
    else if (x.k === 'cau') {
      coHoSo = true
      if (chuoi(x.b)) tra.dang.set(chuoi(x.a), chuoi(x.b))
      if (chuoi(x.c)) tra.chuyenDe.set(chuoi(x.a), chuoi(x.c))
    }
  }
  ra.hoTen = hoTen

  // 2 · sổ học (mọi nguồn) của em
  const rSk = (await hoi('SELECT khoa, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd = ? ORDER BY luc, khoa', sbd)) ?? []
  const skTho: Sk[] = rSk.filter((x) => chuoi(x.qid) && chuoi(x.ngay_vn)).map((x) => ({
    khoa: chuoi(x.khoa), sbd, qid: chuoi(x.qid), nguon: chuoi(x.nguon), maNguon: chuoi(x.ma_nguon), lan: so(x.lan) || 1,
    ketQua: x.ket_qua === null || x.ket_qua === undefined ? null : Number(x.ket_qua) === 1 ? 1 : 0, giay: soHoacNull(x.giay),
    luc: chuoi(x.luc), ngayVn: chuoi(x.ngay_vn), maDang: chuoi(x.ma_dang) || null, chuyenDe: chuoi(x.chuyen_de), che: null,
  }))

  // 3 · các lượt nộp của em (ca kiểm tra; loại ca bài tập/đã xoá) — mới nhất trước
  const rLuot = (await hoi(
    `SELECT l.ma_ca, l.lan_thu, l.vao_luc, l.nop_luc, l.tong, l.diem_i, l.diem_ii, l.diem_iii, COALESCE(c.ten_ca, '') AS ten_ca
       FROM luot l LEFT JOIN ca c ON c.ma_ca = l.ma_ca
      WHERE l.sbd = ? AND l.nop_luc IS NOT NULL AND l.nop_luc <> '' AND COALESCE(c.loai, 'thi') <> 'baitap' AND COALESCE(c.trang_thai, '') <> 'da_xoa'
      ORDER BY l.nop_luc DESC, l.lan_thu DESC LIMIT 100`,
    sbd,
  )) ?? []
  const luotCuaCa = new Map<string, Row>() // mỗi ca giữ lượt nộp MỚI NHẤT
  for (const x of rLuot) if (!luotCuaCa.has(chuoi(x.ma_ca))) luotCuaCa.set(chuoi(x.ma_ca), x)
  const dsCa = [...luotCuaCa.values()] // mới → cũ

  // 4 · trạng thái công bố (MỘT truy vấn, luật ở cong-bo-diem.ts) cho ca của các lượt VÀ ca của mọi sự kiện thi
  const dsMaCa = [...new Set([...dsCa.map((x) => chuoi(x.ma_ca)), ...skTho.filter((e) => e.nguon === 'thi').map((e) => e.maNguon)])]
  const congBo = await docTrangThaiCongBo(env, dsMaCa)

  // 5 · BTVN + gói gia đình giao (nộp hay chưa; bài đang chạy; bài đã nộp)
  const rBt = await docBtvnVaMom(hoi, sbd, [...new Set(skTho.filter((e) => e.nguon === 'mom').map((e) => e.maNguon))])
  const btvnDaNop = new Map<string, boolean>()
  const momDaNop = new Map<string, boolean>()
  const tenPhien = new Map<string, string>() // `${nguon}|${maNguon}` → tên bài
  for (const x of rBt ?? []) {
    if (x.k === 'bt') { btvnDaNop.set(chuoi(x.c1), chuoi(x.c2) !== ''); if (chuoi(x.c8)) tenPhien.set(`btvn|${chuoi(x.c1)}`, chuoi(x.c8)) }
    else if (x.k === 'mom') { momDaNop.set(chuoi(x.c1), chuoi(x.c2) !== ''); if (chuoi(x.c4)) tenPhien.set(`mom|${chuoi(x.c1)}`, chuoi(x.c4)) }
  }
  for (const x of dsCa) tenPhien.set(`thi|${chuoi(x.ma_ca)}`, chuoi(x.ten_ca) || `Ca ${chuoi(x.ma_ca)}`)

  // LUẬT CHE áp lên MỌI sự kiện; `skRo` = phần không bị che (nguồn của mọi con số có đúng/sai)
  for (const e of skTho) e.che = cheCua(e, congBo, btvnDaNop, momDaNop)
  const skRo = skTho.filter((e) => e.che === null)
  const dangCuaSk = (e: SuKienDoc): string => {
    const cd = e.chuyenDe || tra.chuyenDe.get(e.qid) || ''
    return e.maDang || tra.dang.get(e.qid) || (cd ? `CD:${cd}` : '')
  }
  const traCuu: TraCuuCau = tra

  // ── caGanNhat · truoc · tienBo.diem ────────────────────────────────────────────────────────────────────────────────────
  const trangThaiCa = (ma: string) => {
    const t = congBo.get(ma)
    return { congBo: t?.congBo ?? 'khong', daCongBo: t?.daCongBo === true, soEmDaNop: t?.soEmDaNop ?? 0, soEmDaVao: t?.soEmDaVao ?? 0 }
  }
  const tenCa = (x: Row): string => chuoi(x.ten_ca) || `Ca ${chuoi(x.ma_ca)}`
  const gan = dsCa[0]
  const cacCaDaCongBo = dsCa.filter((x) => trangThaiCa(chuoi(x.ma_ca)).daCongBo)
  const dsChiTietCa = new Set<string>([
    ...(gan && trangThaiCa(chuoi(gan.ma_ca)).daCongBo ? [chuoi(gan.ma_ca)] : []),
    ...skTho.filter((e) => e.nguon === 'thi' && e.ngayVn === homNay && e.che === null).map((e) => e.maNguon),
  ])
  const rCt = dsChiTietCa.size > 0
    ? ((await hoi('SELECT ma_ca, lan_thu, phan, qid, dap_an_chon, dap_an_dung, dung_sai FROM chi_tiet_cau WHERE sbd = ? AND ma_ca IN (SELECT value FROM json_each(?))', sbd, json([...dsChiTietCa]))) ?? [])
    : []

  if (gan) {
    const maCa = chuoi(gan.ma_ca)
    const tt = trangThaiCa(maCa)
    const lam = (Date.parse(chuoi(gan.nop_luc)) - Date.parse(chuoi(gan.vao_luc))) / 1000
    const caGanNhat: Row = {
      maCa, tenCa: tenCa(gan), nopLuc: chuoi(gan.nop_luc),
      ...(Number.isFinite(lam) && lam > 0 ? { thoiGianLamGiay: Math.round(lam) } : {}),
      congBo: { congBo: tt.congBo, daCongBo: tt.daCongBo, soEmDaNop: tt.soEmDaNop, soEmDaVao: tt.soEmDaVao },
    }
    if (tt.daCongBo) {
      const cua = rCt.filter((x) => chuoi(x.ma_ca) === maCa && so(x.lan_thu) === so(gan.lan_thu))
      const tong = soHoacNull(gan.tong)
      const soCau = cua.filter((x) => ['I', 'II', 'III'].includes(chuoi(x.phan))).length
      const soCauDung = cua.filter((x) => ['I', 'II', 'III'].includes(chuoi(x.phan)) && x.dung_sai !== null && Number(x.dung_sai) === 1).length
      if (tong !== null || soCau > 0) caGanNhat.ketQua = { ...(tong !== null ? { tong } : {}), ...(soCau > 0 ? { soCau, soCauDung } : {}) }
      const truoc = cacCaDaCongBo.find((x) => chuoi(x.ma_ca) !== maCa && soHoacNull(x.tong) !== null)
      if (tong !== null && truoc) caGanNhat.truoc = { tong: soHoacNull(truoc.tong), doi: tron(tong - so(truoc.tong), 2) }
      const diemPhan: Record<string, number | null> = { I: soHoacNull(gan.diem_i), II: soHoacNull(gan.diem_ii), III: soHoacNull(gan.diem_iii) }
      const phan = (['I', 'II', 'III'] as const).map((ma) => {
        const c = cua.filter((x) => chuoi(x.phan) === ma)
        return { ma, dung: c.filter((x) => x.dung_sai !== null && Number(x.dung_sai) === 1).length, tong: c.length, ...(diemPhan[ma] !== null ? { diem: diemPhan[ma] } : {}) }
      }).filter((p) => p.tong > 0)
      if (phan.length > 0) caGanNhat.phan = phan
    }
    ra.caGanNhat = caGanNhat
  }

  const diem = cacCaDaCongBo.filter((x) => soHoacNull(x.tong) !== null).slice(0, TOI_DA_DIEM_TIEN_BO).reverse()
    .map((x) => ({ ngay: ngayVn(chuoi(x.nop_luc)), diem: so(x.tong), maCa: chuoi(x.ma_ca), tenCa: tenCa(x) }))

  // ── nhịp học · dạng · bậc · lịch ôn (chỉ từ sổ KHÔNG bị che) ─────────────────────────────────────────────────────────
  const chamTrong14 = skRo.filter((e) => e.ketQua !== null && e.ngayVn >= dau14 && e.ngayVn <= homNay)
  const theoNgay = new Map<string, { soCau: number; soCauDung: number }>()
  for (const e of chamTrong14) {
    const c = theoNgay.get(e.ngayVn) ?? { soCau: 0, soCauDung: 0 }
    c.soCau++
    if (e.ketQua === 1) c.soCauDung++
    theoNgay.set(e.ngayVn, c)
  }
  const ngayCoHoc = [...theoNgay.keys()].sort().map((ngay) => ({ ngay, ...theoNgay.get(ngay)! }))
  if (ngayCoHoc.length > 0) {
    const gio = gioThuongHoc(chamTrong14.map((e) => e.luc))
    ra.nhipHoc = { ngay: ngayCoHoc, ...(gio ? { gioThuongHoc: gio } : {}) }
  }

  const theoDang = new Map<string, { dung: number; tong: number; luot: number }>() // 14 ngày, theo mã dạng
  for (const e of skRo.filter((x) => x.ngayVn >= dau14 && x.ngayVn <= homNay)) {
    const ma = dangCuaSk(e)
    if (!ma) continue
    const c = theoDang.get(ma) ?? { dung: 0, tong: 0, luot: 0 }
    c.luot++
    if (e.ketQua !== null) { c.tong++; if (e.ketQua === 1) c.dung++ }
    theoDang.set(ma, c)
  }
  const tiLeDung = (c: { dung: number; tong: number }): number => c.dung / c.tong
  const dangVapTho = [...theoDang].filter(([, c]) => c.tong >= DANG_VAP_TOI_THIEU_LUOT && tiLeDung(c) <= DANG_VAP_TI_LE_DUNG_TOI_DA)
    .sort((a, c) => tiLeDung(a[1]) - tiLeDung(c[1]) || c[1].tong - a[1].tong || (a[0] < c[0] ? -1 : 1))
  const lamTotTho = [...theoDang].filter(([, c]) => c.tong >= DANG_VAP_TOI_THIEU_LUOT && tiLeDung(c) >= LAM_TOT_TI_LE_DUNG_TOI_THIEU)
    .sort((a, c) => tiLeDung(c[1]) - tiLeDung(a[1]) || c[1].tong - a[1].tong || (a[0] < c[0] ? -1 : 1))

  const coSo = skRo.length > 0 && coHoSo
  const bacTai = (ngay: string): Map<string, number> => {
    const m = new Map<string, number>()
    for (const d of phatLaiSuKien(skRo.filter((e) => e.ngayVn <= ngay), traCuu).dang) m.set(d.maDang, d.bac)
    return m
  }
  const bacDau = (m: ReadonlyMap<string, number>, ma: string): number => m.get(ma) ?? BAC_DANG_BAT_DAU
  // bậc CUỐI NGÀY của SO_NGAY_VUA_LEN_BAC + 1 ngày gần nhất (cũ → mới): [D-3, D-2, D-1, D]
  const bacCacNgay = coSo ? Array.from({ length: SO_NGAY_VUA_LEN_BAC + 1 }, (_, i) => bacTai(themNgay(homNay, -(SO_NGAY_VUA_LEN_BAC - i)))) : []
  const rongBac = new Map<string, number>()
  const bacNay = bacCacNgay[bacCacNgay.length - 1] ?? rongBac
  const bacHomQua = bacCacNgay[bacCacNgay.length - 2] ?? rongBac
  const bacCuaSo = bacCacNgay[0] ?? rongBac
  const bacHaiTuan = coSo ? bacTai(themNgay(homNay, -SO_NGAY_NHIP)) : rongBac // bậc cuối ngày cách đây 14 ngày
  const cacDangCoBac = [...bacNay.keys()]

  const dangLenBacTho = cacDangCoBac.filter((ma) => bacDau(bacNay, ma) > bacDau(bacHaiTuan, ma))
    .sort((a, c) => (bacDau(bacNay, c) - bacDau(bacHaiTuan, c)) - (bacDau(bacNay, a) - bacDau(bacHaiTuan, a)) || (a < c ? -1 : 1))
  const vuaLenTho = cacDangCoBac.filter((ma) => bacDau(bacNay, ma) > bacDau(bacCuaSo, ma)).map((ma) => {
    // ngày GẦN NHẤT mà bậc cuối ngày cao hơn bậc cuối ngày liền trước
    let ngay = homNay
    for (let k = bacCacNgay.length - 1; k >= 1; k--) {
      if (bacDau(bacCacNgay[k]!, ma) > bacDau(bacCacNgay[k - 1]!, ma)) { ngay = themNgay(homNay, -(bacCacNgay.length - 1 - k)); break }
    }
    return { ma, ngay }
  }).sort((a, c) => (a.ngay < c.ngay ? 1 : a.ngay > c.ngay ? -1 : a.ma < c.ma ? -1 : 1))
  const lenBacHomNayTho = cacDangCoBac.filter((ma) => bacDau(bacNay, ma) > bacDau(bacHomQua, ma)).sort()

  // ── homNay: câu (≤ 120, mới nhất trước), dòng thời gian, tổng quan ─────────────────────────────────────────────────────
  const homNayEv = skTho.filter((e) => e.ngayVn === homNay && nhanNguon(e.nguon) !== null)
  const cauMoiNhat = [...homNayEv].sort((a, c) => (Date.parse(c.luc) || 0) - (Date.parse(a.luc) || 0) || (a.khoa < c.khoa ? 1 : -1)).slice(0, TOI_DA_CAU_HOM_NAY)
  const qidCanDoc = [...new Set(cauMoiNhat.filter((e) => e.che === null).map((e) => e.qid))]

  // 6 · tên dạng (mọi khối) — MỘT truy vấn, tối đa 60 mã
  const maCanTen = [...new Set([
    ...dangVapTho.slice(0, 12).map((x) => x[0]), ...lamTotTho.slice(0, 12).map((x) => x[0]),
    ...[...theoDang].sort((a, c) => c[1].luot - a[1].luot || (a[0] < c[0] ? -1 : 1)).slice(0, 12).map((x) => x[0]),
    ...vuaLenTho.slice(0, 12).map((x) => x.ma), ...dangLenBacTho.slice(0, 12), ...lenBacHomNayTho.slice(0, 12),
    ...cauMoiNhat.filter((e) => e.che === null).map((e) => dangCuaSk(e)).filter(Boolean),
  ])].slice(0, 60)
  const ten = maCanTen.length > 0 ? await tenCuaCacDang(env, maCanTen) : new Map<string, string>()
  const coTen = (ma: string): boolean => ten.has(ma)

  // 7 · đề của các câu ĐƯỢC PHÉP hiện (câu bị che không bao giờ được đọc từ kho)
  const kho = new Map<string, Row>()
  if (qidCanDoc.length > 0) {
    for (const x of (await hoi('SELECT qid, MIN(json) AS json FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?)) GROUP BY qid', json(qidCanDoc))) ?? []) {
      const q = parse<Row | null>(x.json, null)
      if (q) kho.set(chuoi(x.qid), q)
    }
  }
  const chiTietCua = (e: Sk): Row | undefined => rCt.find((x) => chuoi(x.ma_ca) === e.maNguon && so(x.lan_thu) === e.lan && chuoi(x.qid) === e.qid)

  const cau: Row[] = []
  for (const e of cauMoiNhat) {
    const nguon = nhanNguon(e.nguon)!
    if (e.che !== null) {
      cau.push({ luc: e.luc, nguon, che: e.che, ...(e.giay && e.giay > 0 ? { giay: e.giay } : {}) })
      continue
    }
    const q = kho.get(e.qid)
    if (!q || laCauTuLuan(q)) continue // không có đề trong kho, hoặc TỰ LUẬN ⇒ không vào danh sách
    const ct = e.nguon === 'thi' ? chiTietCua(e) : undefined
    const ma = dangCuaSk(e)
    const tenDang = (ma && ten.get(ma)) || chuoi(q.tenDang)
    const conChon = ct && chuoi(ct.dap_an_chon) && !/^[-–—_\s]+$/.test(chuoi(ct.dap_an_chon)) ? chuoi(ct.dap_an_chon) : ''
    const dapAn = (ct && chuoi(ct.dap_an_dung)) || chuoi(q.correct)
    cau.push({
      // `qid` CHỈ ở câu KHÔNG bị che (để màn gọi /ph/chi-tiet-cau-ve-con); câu bị che ở trên không bao giờ có mã câu.
      luc: e.luc, nguon, qid: e.qid, ...(tenDang ? { tenDang } : {}), deRutGon: deRutGon(q.text),
      ...(conChon ? { conChon } : {}), ...(dapAn ? { dapAn } : {}), ...(e.ketQua !== null ? { dung: e.ketQua === 1 } : {}),
      ...(e.giay && e.giay > 0 ? { giay: e.giay } : {}), coLoiGiai: chuoi(typeof q.solution === 'string' ? q.solution : q.solution ? json(q.solution) : '') !== '',
    })
  }

  const dongThoiGian: Row[] = []
  for (const p of gomPhien(homNayEv)) {
    const dau = p.ev[0]!
    const nguon = nhanNguon(dau.nguon)!
    const che = dau.che
    const giay = p.ev.reduce((t, e) => t + (e.giay && e.giay > 0 ? e.giay : 0), 0)
    const span = ((Date.parse(p.ev[p.ev.length - 1]!.luc) || 0) - (Date.parse(dau.luc) || 0)) / 60_000
    const phut = Math.max(1, Math.round(giay > 0 ? giay / 60 : span))
    const khacNhau = new Set(p.ev.map((e) => e.qid))
    const dung = new Set(p.ev.filter((e) => e.ketQua === 1).map((e) => e.qid))
    const tenBai = tenPhien.get(`${dau.nguon === 'btvn_lo' ? 'btvn' : dau.nguon}|${dau.maNguon}`)
    let ghiChu = ''
    if ((dau.nguon === 'btvn' || dau.nguon === 'btvn_lo') && che === null) {
      const bt = (rBt ?? []).find((x) => x.k === 'bt' && chuoi(x.c1) === dau.maNguon)
      const nop = Date.parse(chuoi(bt?.c2))
      const han = Date.parse(chuoi(bt?.c5))
      if (Number.isFinite(nop) && Number.isFinite(han) && ngayVn(nop) === homNay) ghiChu = nop <= han ? 'Nộp đúng hạn' : 'Nộp sau hạn'
    }
    dongThoiGian.push({
      batDau: dau.luc, nguon, ...(tenBai ? { ten: tenBai } : {}), ...(che === null ? { soCau: khacNhau.size, soDung: dung.size } : { che }),
      phut, ...(ghiChu ? { ghiChu } : {}),
    })
  }

  const rHomNay = skRo.filter((e) => e.ngayVn === homNay && nhanNguon(e.nguon) !== null && e.ketQua !== null)
  const soCauHomNay = new Set(rHomNay.map((e) => e.qid)).size
  const soDungHomNay = new Set(rHomNay.filter((e) => e.ketQua === 1).map((e) => e.qid)).size
  const giayHomNay = homNayEv.reduce((t, e) => t + (e.giay && e.giay > 0 ? e.giay : 0), 0)
  const tongQuan: Row = {}
  if (soCauHomNay > 0) { tongQuan.soCau = soCauHomNay; tongQuan.soDung = soDungHomNay }
  if (giayHomNay > 0) tongQuan.phutHoc = Math.round(giayHomNay / 60)
  if (soCauHomNay > 0 && kh && so(kh.c) !== 1) {
    const truocHomNay = new Map<string, { sai: boolean }>()
    for (const e of skRo) if (e.ngayVn < homNay) { const c = truocHomNay.get(e.qid) ?? { sai: false }; if (e.ketQua !== 1) c.sai = true; truocHomNay.set(e.qid, c) }
    const lenBac = new Set(rHomNay.filter((e) => e.ketQua === 1 && truocHomNay.get(e.qid)?.sai === true).map((e) => e.qid)).size
    const ngan = parse<Row>(kh.a, {})
    const viec = parse<{ tienBo?: { soCauToiHan?: unknown; treNhip?: unknown } }>(kh.b, {})
    tongQuan.datNhiemVu = laDatNgay({ daLam: soCauHomNay, lenBac, toiThieu: Number(ngan.toiThieuCau) || 4, treNhip: viec.tienBo?.treNhip === true, soCauToiHan: Number(viec.tienBo?.soCauToiHan) || 0, ngayVn: homNay, soCauDungHomNay: soDungHomNay })
  }
  if (skRo.some((e) => e.ketQua !== null)) {
    const ngayCoHocSet = new Set(skRo.filter((e) => e.ketQua !== null && nhanNguon(e.nguon) !== null).map((e) => e.ngayVn))
    let d = ngayCoHocSet.has(homNay) ? homNay : homQua
    let chuoiNgay = 0
    while (ngayCoHocSet.has(d)) { chuoiNgay++; d = themNgay(d, -1) }
    if (chuoiNgay > 0) tongQuan.chuoiNgayHoc = chuoiNgay
  }
  const quaHomQua = skRo.filter((e) => e.ngayVn === homQua && nhanNguon(e.nguon) !== null && e.ketQua !== null)
  if (quaHomQua.length > 0) {
    const sc = new Set(quaHomQua.map((e) => e.qid)).size
    const sd = new Set(quaHomQua.filter((e) => e.ketQua === 1).map((e) => e.qid)).size
    tongQuan.soVoiHomQua = { soCau: sc, tiLeDung: tron(sd / sc, 3) }
  }
  const homNayKhoi: Row = {}
  if (Object.keys(tongQuan).length > 0) homNayKhoi.tongQuan = tongQuan
  if (dongThoiGian.length > 0) homNayKhoi.dongThoiGian = dongThoiGian
  if (cau.length > 0) homNayKhoi.cau = cau
  if (Object.keys(homNayKhoi).length > 0) ra.homNay = homNayKhoi

  // ── tienBo · bacTheoDang · dangVap · vuaLenBac · manhYeu ───────────────────────────────────────────────────────────────
  const dangTienBoNhat = dangLenBacTho.filter(coTen).slice(0, TOI_DA_DANG_TIEN_BO_NHAT).map((ma) => ({ ma, ten: ten.get(ma)!, tu: bacDau(bacHaiTuan, ma), den: bacDau(bacNay, ma) }))
  if (diem.length > 0 || dangTienBoNhat.length > 0) ra.tienBo = { ...(diem.length > 0 ? { diem } : {}), ...(dangTienBoNhat.length > 0 ? { dangTienBoNhat } : {}) }

  const bacTheoDang = [...theoDang].filter(([ma]) => bacNay.has(ma) && coTen(ma)).sort((a, c) => c[1].luot - a[1].luot || (a[0] < c[0] ? -1 : 1)).slice(0, TOI_DA_DANG)
    .map(([ma]) => ({ ma, ten: ten.get(ma)!, bac: bacNay.get(ma)! }))
  if (bacTheoDang.length > 0) ra.bacTheoDang = bacTheoDang
  const dangVap = dangVapTho.filter(([ma]) => coTen(ma)).slice(0, TOI_DA_DANG).map(([ma, c]) => ({ ma, ten: ten.get(ma)!, dung: c.dung, tong: c.tong }))
  if (dangVap.length > 0) ra.dangVap = dangVap
  const vuaLenBac = vuaLenTho.filter((x) => coTen(x.ma)).slice(0, TOI_DA_DANG).map((x) => ({ ma: x.ma, ten: ten.get(x.ma)!, tu: bacDau(bacCuaSo, x.ma), den: bacDau(bacNay, x.ma), ngay: x.ngay }))
  if (vuaLenBac.length > 0) ra.vuaLenBac = vuaLenBac

  const tenBac = (ma: string): 'biet' | 'hieu' | 'van_dung' => TEN_BAC[Math.max(0, Math.min(2, bacDau(bacNay, ma)))]!
  const lamTot = lamTotTho.filter(([ma]) => coTen(ma)).slice(0, TOI_DA_MANH_YEU).map(([ma, c]) => ({ tenDang: ten.get(ma)!, dung: c.dung, tong: c.tong, bac: tenBac(ma) }))
  const conVap = dangVapTho.filter(([ma]) => coTen(ma)).slice(0, TOI_DA_MANH_YEU).map(([ma, c]) => ({ tenDang: ten.get(ma)!, dung: c.dung, tong: c.tong, bac: tenBac(ma) }))
  const lenBacHomNay = lenBacHomNayTho.filter(coTen).map((ma) => ({ tenDang: ten.get(ma)! }))
  if (lamTot.length + conVap.length + lenBacHomNay.length > 0) {
    ra.manhYeu = { ...(lamTot.length > 0 ? { lamTot } : {}), ...(conVap.length > 0 ? { conVap } : {}), ...(lenBacHomNay.length > 0 ? { lenBacHomNay } : {}) }
  }

  // ── bài tập về nhà ──────────────────────────────────────────────────────────────────────────────────────────────────────
  const baiTho = (rBt ?? []).filter((x) => x.k === 'bt')
  const tenBtvn = (x: Row): string => chuoi(x.c8) || 'Bài tập về nhà'
  const dangChay = baiTho.filter((x) => chuoi(x.c2) === '' && Date.parse(chuoi(x.c5)) > nowMs)
    .sort((a, c) => Date.parse(chuoi(a.c5)) - Date.parse(chuoi(c.c5)) || (chuoi(a.c1) < chuoi(c.c1) ? -1 : 1)).slice(0, TOI_DA_BAI_DANG_CHAY)
    .map((x) => {
      const chang = so(x.c9)
      return { maBtvn: chuoi(x.c1), ten: tenBtvn(x), hanNop: chuoi(x.c5), ...(chang > 0 ? { changXong: Math.min(chang, so(x.c10)), changTong: chang } : {}) }
    })
  const ganNop = baiTho.filter((x) => chuoi(x.c2) !== '').sort((a, c) => (chuoi(a.c2) < chuoi(c.c2) ? 1 : chuoi(a.c2) > chuoi(c.c2) ? -1 : 0)).slice(0, TOI_DA_BAI_GAN)
    .map((x) => {
      const soDung = soHoacNull(x.c3)
      const caNhan = so(x.c12) === 1
      const soCau = caNhan ? so(x.c4) || so(x.c11) : so(x.c7) || so(x.c4)
      const nop = Date.parse(chuoi(x.c2))
      const han = Date.parse(chuoi(x.c5))
      return {
        maBtvn: chuoi(x.c1), ten: tenBtvn(x), nopLuc: chuoi(x.c2), ...(Number.isFinite(nop) && Number.isFinite(han) ? { dungHan: nop <= han } : {}),
        ...(soDung !== null && soCau > 0 ? { diem: Math.round((soDung / soCau) * 1000) / 100 } : {}),
      }
    })
  if (dangChay.length > 0 || ganNop.length > 0) ra.baiTapVeNha = { ...(dangChay.length > 0 ? { dangChay } : {}), ...(ganNop.length > 0 ? { gan: ganNop } : {}) }

  // ── lịch ôn (chỉ khi con có hồ sơ nắm kiến thức) ───────────────────────────────────────────────────────────────────────
  let lichOn: { homNay: number; ngayMai: number; daKhacPhuc14Ngay: number; conSaiChuaKhacPhuc: number } | null = null
  if (coSo) {
    const cauHs = phatLaiSuKien(skRo, traCuu).cau
    const denHan = cauHs.filter((c) => (c.trangThai === 'moi_sai' || c.trangThai === 'dang_on' || c.trangThai === 'da_khac_phuc') && !c.canDayLai && c.mocOnKe)
    lichOn = {
      homNay: denHan.filter((c) => c.mocOnKe! <= homNay).length,
      ngayMai: denHan.filter((c) => c.mocOnKe === ngayMai).length,
      daKhacPhuc14Ngay: cauHs.filter((c) => c.trangThai === 'da_khac_phuc' && ngayVn(c.lucCuoi) >= dau14).length,
      conSaiChuaKhacPhuc: cauHs.filter((c) => c.trangThai === 'moi_sai' || c.trangThai === 'dang_on').length,
    }
    ra.lichOn = lichOn
  }

  // ── lời cho phụ huynh: mẫu có số thật, xưng "con" ───────────────────────────────────────────────────────────────────────
  if (lichOn) {
    const giay = skRo.filter((e) => e.ngayVn >= dau14 && e.giay !== null && e.giay >= 5 && e.giay <= 1200).map((e) => e.giay as number).sort((a, c) => a - c)
    const giayMoiCau = giay.length >= 5 ? giay[Math.floor(giay.length / 2)]! : MOI_GIAY_MAC_DINH
    const cau1: string[] = []
    if (lichOn.homNay > 0) cau1.push(`Nhắc con làm ${lichOn.homNay} câu ôn lại hôm nay, khoảng ${phutUocTinhChang(lichOn.homNay, giayMoiCau)} phút.`)
    if (lichOn.ngayMai > 0) cau1.push(`Nhắc con làm ${lichOn.ngayMai} câu ôn lại vào ngày mai, khoảng ${phutUocTinhChang(lichOn.ngayMai, giayMoiCau)} phút.`)
    if (cau1.length > 0) ra.phuHuynhLamGi = cau1.slice(0, 2)
  }

  // ── lời Bộ não dành cho phụ huynh (chế độ THẬT, đã qua kiểm khuôn; không chữ game) ─────────────────────────────────────
  const chBoNao = cauHinhTangDocTuChuoi(cfgBoNao)
  const boNao = chBoNao ? await docBoNaoAiChoPhuHuynh(env, sbd, homNay, chBoNao) : null
  if (boNao) {
    const loi = coChuGame(boNao.loiNhan) ? '' : boNao.loiNhan
    const thuTuan = coChuGame(boNao.thuTuan) ? '' : boNao.thuTuan
    if (loi || thuTuan) ra.loiBoNao = { ...(loi ? { loi } : {}), ngay: boNao.ngay, ...(thuTuan ? { thuTuan } : {}) }
  }

  // ── giao thêm ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
  if (daGiaoThem !== null) ra.giaoThem = { conLaiHomNay: Math.max(0, GIAO_THEM.SO_LUOT_TOI_DA - daGiaoThem) }

  // ── độ chăm hôm nay ("Con đang hạng 9 trong 42 bạn về độ chăm hôm nay"): DÙNG CHUNG hàm xếp hạng của lệnh thi đua (thi-dua-hom-nay.ts), 3 truy vấn thêm.
  // Chỉ hai con số hạng + sĩ số — không tên bạn nào, không thần thú. Con chưa học hôm nay / chưa xác định được lớp / đọc lỗi ⇒ VẮNG (không hạng bịa).
  const doCham = await hangChamCuaEm(env, sbd, nowMs)
  if (doCham) ra.doCham = { hang: doCham.hang, siSo: doCham.siSo }

  // ── `no` (Dồn về đích, thầy chốt 21/09): { theoNgay:[{ngay, loai, ten, soCau, phut}], tongCau, tongPhut } — Code 3 cấp hàm tính nợ ở W3; CHỜ NỐI TẠI ĐÂY, KHÔNG tự tính lại ở tệp này.
  return ra
}

// ------------------------------------------------------------------ LỆNH CON: lời giải của MỘT câu ------------------------------------------------------------------
/**
 * `POST /ph/chi-tiet-cau-ve-con {pass, qid}` — lời giải của MỘT câu khi phụ huynh mở câu ấy trong `homNay.cau[]`. Xác thực y hệt lệnh chính; CÙNG luật che:
 * con phải ĐÃ làm câu này (có sự kiện trong sổ) và MỌI lần con làm câu ấy đều KHÔNG bị che (ca đã công bố; bài tập về nhà / gói gia đình giao đã nộp) — không thì từ chối `{ok:false, che}` và không lộ gì.
 * Không tự luận. Không ghi (ngoài dòng đếm truy cập của hàm xác thực). ≤ 9 truy vấn D1 kể cả xác thực.
 */
export async function phChiTietCauVeCon(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Row> {
  const { sbd } = await sbdCuaPhuHuynh(env, b, 'ph-chi-tiet-cau-ve-con', { chiToken: CHI_NHAN_TOKEN })
  const qid = chuoi(b.qid)
  if (!qid || qid.length > 200) return { ok: false, error: 'Thiếu mã câu.' }
  const { hoi } = boHoi(env)
  const lanLam = ((await hoi('SELECT nguon, ma_nguon FROM su_kien_hoc WHERE sbd = ? AND qid = ?', sbd, qid)) ?? [])
    .map((x) => ({ nguon: chuoi(x.nguon), maNguon: chuoi(x.ma_nguon) })).filter((e) => nhanNguon(e.nguon) !== null)
  if (lanLam.length === 0) return { ok: false, error: 'Con chưa làm câu này.' }
  const dsThi = [...new Set(lanLam.filter((e) => e.nguon === 'thi').map((e) => e.maNguon))]
  const dsBtvn = [...new Set(lanLam.filter((e) => e.nguon === 'btvn' || e.nguon === 'btvn_lo').map((e) => e.maNguon))]
  const dsMom = [...new Set(lanLam.filter((e) => e.nguon === 'mom').map((e) => e.maNguon))]
  const congBo = await docTrangThaiCongBo(env, dsThi)
  const rBt = dsBtvn.length > 0 ? ((await hoi('SELECT ma_btvn AS ma, nop_luc AS nop FROM btvn_em WHERE sbd = ? AND ma_btvn IN (SELECT value FROM json_each(?))', sbd, json(dsBtvn))) ?? []) : []
  const rMom = dsMom.length > 0 ? ((await hoi('SELECT id AS ma, submitted_at AS nop FROM mom_bai WHERE sbd = ? AND id IN (SELECT value FROM json_each(?))', sbd, json(dsMom))) ?? []) : []
  const btvnDaNop = new Map(rBt.map((x) => [chuoi(x.ma), chuoi(x.nop) !== ''] as const))
  const momDaNop = new Map(rMom.map((x) => [chuoi(x.ma), chuoi(x.nop) !== ''] as const))
  const che = lanLam.map((e) => cheCua(e, congBo, btvnDaNop, momDaNop)).find((c) => c !== null)
  if (che) return { ok: false, che, error: che === 'chua_cong_bo' ? 'Ca này chưa công bố điểm nên chưa xem được lời giải.' : 'Bài này con chưa nộp nên chưa xem được lời giải.' }
  const r = (await hoi('SELECT MIN(json) AS json FROM game_v2_question WHERE qid = ?', qid)) ?? []
  const q = parse<Row | null>(r[0]?.json, null)
  if (!q) return { ok: false, error: 'Chưa có lời giải của câu này.' }
  if (laCauTuLuan(q)) return { ok: false, error: 'Câu này là câu tự luận, chưa có lời giải máy.' }
  const loiGiai = chuoiLoiGiai(q.solution)
  const phuongAn = Array.isArray(q.choices) ? q.choices.map(chuoi).filter(Boolean) : []
  return {
    ok: true, serverNow: nowMs, de: chuoi(q.text), ...(phuongAn.length > 0 ? { phuongAn } : {}), dapAn: chuoi(q.correct),
    ...(chuoi(q.tenDang) ? { tenDang: chuoi(q.tenDang) } : {}), ...(loiGiai ? { loiGiai } : {}),
  }
}
