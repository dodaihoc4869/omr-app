// BTVN "NÂNG ĐỠ" — LỚP D1 (đặc tả: docs/hop-dong-btvn-nang-do-2109.md; lõi thuần: src/lib/btvn-nang-do.ts của Code 1).
//
// Bài `btvn.ca_nhan = 1`: mỗi em nhận BỘ CÂU RIÊNG (lõi chung + phần riêng theo hồ sơ), chia CHẶNG mỗi ngày, điểm tính trên câu CỦA EM.
// Bài `ca_nhan = 0` và mọi bài cũ KHÔNG đi qua tệp này — `index.ts`/`goi-cu.ts` chỉ rẽ nhánh khi `Number(bt.ca_nhan) === 1`.
//
// LUẬT CỨNG (mỗi luật có test khoá, tests/btvn-nang-do-*.test.ts):
//   · Đáp án + lời giải KHÔNG xuống máy em trước khi nộp chặng: `boDapAn` là DANH SÁCH CHO PHÉP (không phải danh sách cấm).
//   · Bộ câu CHỐT MỘT LẦN (`btvn_em.chot_luc`): hai lượt mở đồng thời chỉ một bên thắng, bên thua đọc lại đúng bộ đã ghi.
//   · Nộp chặng: đáp án ĐẦU khoá; đáp án + lời giải chỉ đi ra SAU khi ghi sổ thành công; câu chưa trả lời không chấm, không lời giải.
//   · Câu THƯỞNG (`thu_thach`, `loi_cao`): đúng ⇒ vào cả tử và mẫu; sai ⇒ KHÔNG vào mẫu.
import type { D1PreparedStatement, Env } from './kieu'
import { answerText, gradeHomework, homeworkKeys, homeworkQuestions, isAnswerCorrect } from './btvn-grading'
import {
  chonBoCuaEm, chonLoi, maDangCua, mucTuChu, theTienBo, thichNghiChangSau,
  type BoCuaEm, type CauGiao, type DieuChinhEm, type HoSoEmRut, type Muc, type NganSachBai, type NhanCau, type PhanCau, type Sao, type TienBo, type TomTatBo,
} from '../../src/lib/btvn-nang-do'
import { thanhExp } from '../../src/game/than-thu-hoa-hoc/kinh-nghiem'
import { capNhatExp, docExpHomNay, expNhanCuaKetQua, manhNhanCuaKetQua } from './exp-d1'
import { PHUT_NGAY_TOI_DA, PHUT_NGAY_TOI_THIEU, SO_NGAY_DO_VAN_TOC, SO_NGAY_LICH_SU, TY_LE_ON_TOI_DA } from './ho-so-cau-hinh'
import { dungLaiHoSo, themNgay } from './ho-so-nam-kt'
import { tinhNganSach, tinhVanToc, type DauVaoKeHoach } from './ke-hoach-ngay'
import { chuyenDeThat, ghiSuKien, ngayVn, phanTuQid, suKienChamBai, suKienTuKetQuaCham, cauTuKho } from './su-kien-hoc'
import { daTraLoi } from './on-lai-nop'
import { docDieuChinhHieuLuc, type DieuChinhHieuLuc } from './bo-nao-doc'
import { docLichDaLuu, LAN_MOI_LUOT, moLucChang, trangThaiCacChang, type LichDaLuu } from './btvn-nang-do-chang'
import { canhBaoHanNgan, cheDoLich, sucChua, xepLichChang, type SucChua } from '../../src/lib/btvn-nang-do-lich'

type Hang = Record<string, unknown>

export const TOI_DA_CAU_GIAO = 300
export const TOI_DA_EM_XEM_TRUOC = 50
export const SO_LOI_TOI_THIEU_SO_LOP = 6
const MOT_NGAY_MS = 86_400_000
const GIOI_HAN_DAP_AN = 40

const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v))
const soHoac = (v: unknown, dpr = 0): number => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : dpr)
const json = (v: unknown): string => JSON.stringify(v)
/** Câu thưởng: nhãn `thu_thach` hoặc `loi_cao` — đúng thì tính, sai thì KHÔNG vào mẫu điểm. */
export const laCauThuong = (nhan: unknown): boolean => nhan === 'thu_thach' || nhan === 'loi_cao'

// ================================================================== CỜ + LƯỢC ĐỒ ==================================================================

/** Cờ tắt toàn cục `cau_hinh.btvn_ca_nhan`: vắng = BẬT; `false` / `0` / `tat` / `{"tat":true}` / `{"bat":false}` = TẮT. Hỏng thì BẬT (giữ hành vi mặc định). */
export function docCoCaNhan(giaTri: unknown): boolean {
  if (giaTri === null || giaTri === undefined) return true
  const s = chuoi(giaTri).trim().toLowerCase()
  if (s === '') return true
  if (s === 'false' || s === '0' || s === 'tat') return false
  try {
    const o = JSON.parse(s) as unknown
    if (o === false || o === 0) return false
    if (o && typeof o === 'object' && ((o as Hang).tat === true || (o as Hang).bat === false)) return false
  } catch {
    /* không đọc được: giữ BẬT */
  }
  return true
}

export async function coBatCaNhan(env: Env): Promise<boolean> {
  try {
    const r = await env.DB.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa = 'btvn_ca_nhan'").first<{ gia_tri: string }>()
    return docCoCaNhan(r?.gia_tri)
  } catch {
    return true
  }
}

/** Đã chạy migration-2109-btvn-nang-do.sql chưa? (chỉ gọi khi thầy xin giao `caNhan` — bài cũ không tốn truy vấn này) */
export async function daCoBangCaNhan(env: Env): Promise<boolean> {
  try {
    await env.DB.prepare('SELECT ca_nhan, hat_giong, so_loi FROM btvn LIMIT 1').first()
    await env.DB.prepare('SELECT ma_btvn FROM btvn_cau LIMIT 1').first()
    await env.DB.prepare('SELECT chot_luc, so_cau_em FROM btvn_em LIMIT 1').first()
    await env.DB.prepare('SELECT khoa FROM btvn_em_cau LIMIT 1').first()
    return true
  } catch {
    return false
  }
}

export const laBaiCaNhan = (bt: Hang | null | undefined): boolean => Number(bt?.ca_nhan) === 1

// ================================================================== GIAO: dựng câu + lõi ==================================================================

const kepMuc = (v: unknown): Muc => {
  if (typeof v === 'string' && !/^\s*\d+\s*$/.test(v)) return mucTuChu(v)
  const n = Math.round(Number(v))
  return (n >= 2 ? 2 : n === 1 ? 1 : 0) as Muc
}
const kepSao = (v: unknown): Sao => {
  const n = Math.round(Number(v))
  return (n >= 2 ? 2 : n === 1 ? 1 : 0) as Sao
}

/**
 * Đối chiếu `cau[]` máy thầy gửi với CÂU THẬT của tờ (`homeworkQuestions`): qid lạ hoặc câu không có đáp án bị bỏ (`boQuaQid`); câu của tờ mà thầy
 * không gửi được điền từ chính tờ kho (dạng `dang.ma`, mức `muc_do`, sao `can_chua.sao`, chuyên đề) — thiếu nữa thì `{dang:null, mucDo:0, sao:0}` (đếm ở `thieuMeta`).
 * THỨ TỰ = thứ tự tờ đề (không theo thứ tự thầy gửi) để lõi/bộ tất định.
 */
export function chuanHoaCauGiao(tho: Hang[], raw: unknown): { cau: CauGiao[]; boQuaQid: string[]; thieuMeta: number } {
  const khoa = homeworkKeys(tho)
  const hopLe = tho.filter((c) => khoa.has(chuoi(c.qid)))
  const coTrongTo = new Set(hopLe.map((c) => chuoi(c.qid)))
  const cuaThay = new Map<string, Hang>()
  if (Array.isArray(raw)) {
    for (const x of raw) {
      if (!x || typeof x !== 'object') continue
      const q = chuoi((x as Hang).qid).trim()
      if (q && !cuaThay.has(q)) cuaThay.set(q, x as Hang)
    }
  }
  const boQuaQid = [...cuaThay.keys()].filter((q) => !coTrongTo.has(q))
  let thieuMeta = 0
  const cau = hopLe.map((c): CauGiao => {
    const qid = chuoi(c.qid)
    const m = cuaThay.get(qid)
    if (!m) thieuMeta++
    const dangKho = c.dang && typeof c.dang === 'object' ? chuoi((c.dang as Hang).ma).trim() : ''
    const dangThay = m ? chuoi(m.dang).trim() : ''
    const canChua = c.can_chua && typeof c.can_chua === 'object' ? (c.can_chua as Hang) : null
    const phanTho = chuoi(c.phan)
    return {
      qid,
      dang: dangThay || dangKho || null,
      chuyenDe: (m ? chuyenDeThat(m.chuyenDe) : '') || chuyenDeThat(c.chuyen_de ?? c.chuyenDe),
      mucDo: m && m.mucDo !== undefined && m.mucDo !== null ? kepMuc(m.mucDo) : kepMuc(c.muc_do ?? c.mucDo),
      sao: m && m.sao !== undefined && m.sao !== null ? kepSao(m.sao) : kepSao(canChua?.sao),
      phan: (phanTho === 'I' || phanTho === 'II' || phanTho === 'III' ? phanTho : phanTuQid(qid)) as PhanCau,
    }
  })
  return { cau, boQuaQid, thieuMeta }
}

export interface BaiGiaoDung {
  ok: true
  cau: CauGiao[]
  loi: string[]
  ghim: string[]
  boQuaQid: string[]
  thieuMeta: number
  canhBao?: 'loi_it_hon_6'
}

/** Từ `dsMaDe` + `cau[]` + `ghim[]` của thầy: câu chuẩn, lõi (`chonLoi`), ghim hợp lệ. Dùng chung cho `/btvn/giao` và `/btvn/xem-truoc` (a). */
export async function dungBaiGiao(env: Env, dsMaDe: string[], rawCau: unknown, rawGhim: unknown): Promise<BaiGiaoDung | { ok: false; error: string }> {
  if (Array.isArray(rawCau) && rawCau.length > TOI_DA_CAU_GIAO) return { ok: false, error: `Danh sách câu tối đa ${TOI_DA_CAU_GIAO}, thầy gửi ${rawCau.length}` }
  let tho: Hang[]
  try {
    tho = await homeworkQuestions(env, dsMaDe.join(','))
  } catch {
    return { ok: false, error: 'Chưa tải đủ đề để cá nhân hoá. Thầy thử lại.' }
  }
  const { cau, boQuaQid, thieuMeta } = chuanHoaCauGiao(tho, rawCau)
  if (cau.length === 0) return { ok: false, error: 'Tờ đề chưa có câu nào chấm được để cá nhân hoá.' }
  const coQid = new Set(cau.map((c) => c.qid))
  const ghim = [...new Set((Array.isArray(rawGhim) ? rawGhim : []).map((x) => chuoi(x).trim()).filter((q) => coQid.has(q)))]
  const loi = chonLoi(cau, ghim)
  return { ok: true, cau, loi, ghim, boQuaQid, thieuMeta, ...(loi.length < SO_LOI_TOI_THIEU_SO_LOP ? { canhBao: 'loi_it_hon_6' as const } : {}) }
}

/** Câu lệnh ghi `btvn_cau` cho MỘT lượt giao (một tham số JSON duy nhất — tránh trần 100 tham số của D1). */
export function lenhGhiCauBai(env: Env, maBtvn: string, cau: CauGiao[], loi: string[], ghim: string[]): D1PreparedStatement {
  const loiSet = new Set(loi)
  const ghimSet = new Set(ghim)
  const hang = cau.map((c, i) => ({ q: c.qid, t: i, d: c.dang, c: c.chuyenDe, m: c.mucDo, s: c.sao, p: c.phan, l: loiSet.has(c.qid) ? 1 : 0, g: ghimSet.has(c.qid) ? 1 : 0 }))
  return env.DB.prepare(
    `INSERT INTO btvn_cau (ma_btvn, qid, thu_tu, dang, chuyen_de, muc_do, sao, phan, loi, ghim)
     SELECT ?, json_extract(j.value,'$.q'), json_extract(j.value,'$.t'), json_extract(j.value,'$.d'), json_extract(j.value,'$.c'),
            json_extract(j.value,'$.m'), json_extract(j.value,'$.s'), json_extract(j.value,'$.p'), json_extract(j.value,'$.l'), json_extract(j.value,'$.g')
       FROM json_each(?) j`,
  ).bind(maBtvn, json(hang))
}

export interface BaiNangDo {
  cau: CauGiao[]
  loi: string[]
  ghim: string[]
}

const docCauGiaoTuHang = (x: Hang): CauGiao => ({
  qid: chuoi(x.qid),
  dang: x.dang ? chuoi(x.dang) : null,
  chuyenDe: chuoi(x.chuyen_de),
  mucDo: kepMuc(x.muc_do),
  sao: kepSao(x.sao),
  phan: (['I', 'II', 'III'].includes(chuoi(x.phan)) ? chuoi(x.phan) : phanTuQid(chuoi(x.qid))) as PhanCau,
})

/** Câu + lõi + ghim của một lượt giao, theo thứ tự đề. `null` = không có dòng nào (bài chưa sẵn sàng). */
export async function docBaiNangDo(env: Env, maBtvn: string): Promise<BaiNangDo | null> {
  const r = await env.DB.prepare('SELECT qid, dang, chuyen_de, muc_do, sao, phan, loi, ghim FROM btvn_cau WHERE ma_btvn = ? ORDER BY thu_tu').bind(maBtvn).all<Hang>()
  const ds = r.results ?? []
  if (ds.length === 0) return null
  return { cau: ds.map(docCauGiaoTuHang), loi: ds.filter((x) => Number(x.loi) === 1).map((x) => chuoi(x.qid)), ghim: ds.filter((x) => Number(x.ghim) === 1).map((x) => chuoi(x.qid)) }
}

/** Hạt giống của bài: máy thầy gửi (chung với xem trước) hoặc mã bài. Hạt của EM = `<hạt bài>|<sbd>`. */
export const hatGiongCuaBai = (bt: Hang): string => chuoi(bt.hat_giong).trim() || chuoi(bt.ma_btvn)

// ================================================================== ĐỌC HỒ SƠ + NGÂN SÁCH (theo lô em) ==================================================================

export interface HoSoRutCuaEm {
  hoSo: HoSoEmRut
  coHoSo: boolean
  chuaKhacPhuc: number
  toiHan: number
}

const hoSoRong = (): HoSoRutCuaEm => ({ hoSo: { dang: {}, cau: {} }, coHoSo: false, chuaKhacPhuc: 0, toiHan: 0 })

/**
 * HỒ SƠ RÚT của các em, chỉ phần liên quan tới các câu của bài: MỘT truy vấn (UNION ALL) cho cả lô ≤ 50 em.
 * `dang` theo `maDangCua` (dạng, không có thì `CD:<chuyên đề>`), `tiLeKhacPhuc` = (khắc phục + chưa từng sai) / đã gặp khi đã gặp ≥ 4 câu, ngược lại null.
 * Cũng đếm số câu chưa khắc phục (vào ngân sách) và số câu tới hạn ôn (vào phần ôn lại mỗi ngày).
 */
export async function docHoSoRut(env: Env, dsSbd: string[], cau: CauGiao[], now: number): Promise<Map<string, HoSoRutCuaEm>> {
  const ra = new Map<string, HoSoRutCuaEm>(dsSbd.map((s) => [s, hoSoRong()]))
  if (dsSbd.length === 0) return ra
  const arr = json(dsSbd)
  const dsDang = json([...new Set(cau.map((c) => maDangCua(c)))])
  const dsQid = json(cau.map((c) => c.qid))
  const homNay = ngayVn(now)
  let r: { results?: Hang[] }
  try {
    r = await env.DB.prepare(
      `SELECT 'd' AS k, sbd, ma_dang AS a, bac AS b, so_gap AS c, so_sai AS d, so_da_khac_phuc AS e, so_chua_thay_sai AS f
         FROM nam_kt_dang WHERE sbd IN (SELECT value FROM json_each(?)) AND ma_dang IN (SELECT value FROM json_each(?))
       UNION ALL
       SELECT 'c', sbd, qid, trang_thai, ngay_dung_khac_nhau, lan_sai, NULL, NULL
         FROM nam_kt_cau WHERE sbd IN (SELECT value FROM json_each(?)) AND qid IN (SELECT value FROM json_each(?))
       UNION ALL
       SELECT 't', sbd, NULL,
              SUM(CASE WHEN trang_thai IN ('moi_sai','dang_on') THEN 1 ELSE 0 END),
              SUM(CASE WHEN trang_thai IN ('moi_sai','dang_on','da_khac_phuc') AND can_day_lai = 0 AND moc_on_ke IS NOT NULL AND moc_on_ke <= ? THEN 1 ELSE 0 END),
              NULL, NULL, NULL
         FROM nam_kt_cau WHERE sbd IN (SELECT value FROM json_each(?)) GROUP BY sbd`,
    ).bind(arr, dsDang, arr, dsQid, homNay, arr).all<Hang>()
  } catch {
    return ra // hồ sơ không đọc được ⇒ bộ dựng từ hồ sơ RỖNG (lõi + Biết/Hiểu), không lỗi
  }
  for (const x of r.results ?? []) {
    const e = ra.get(chuoi(x.sbd))
    if (!e) continue
    if (x.k === 'd') {
      const soGap = soHoac(x.c)
      const bac = Math.max(0, Math.min(2, Math.round(soHoac(x.b)))) as Muc
      e.hoSo.dang[chuoi(x.a)] = {
        bac,
        soGap,
        soSai: soHoac(x.d),
        tiLeKhacPhuc: soGap >= 4 ? (soHoac(x.e) + soHoac(x.f)) / soGap : null,
      }
      e.coHoSo = true
    } else if (x.k === 'c') {
      e.hoSo.cau[chuoi(x.a)] = { trangThai: chuoi(x.b) as HoSoEmRut['cau'][string]['trangThai'], ngayDungKhacNhau: soHoac(x.c), lanSai: soHoac(x.d) }
      e.coHoSo = true
    } else if (x.k === 't') {
      e.chuaKhacPhuc = soHoac(x.b)
      e.toiHan = soHoac(x.c)
    }
  }
  return ra
}

export interface DauVaoNganSach {
  mauGiay: number[]
  phutNgay: number | null
  lichSu: { ngay: string; ketQua: 'dat' | 'mot_phan' | 'khong' | null }[]
  soBaiChuaNop: number
}

/** Đầu vào NGÂN SÁCH ngày của các em (tốc độ đo được, phút/ngày em đặt, lịch sử ngày đạt, số bài chưa nộp): MỘT truy vấn cho cả lô. */
export async function docDauVaoNganSach(env: Env, dsSbd: string[], now: number): Promise<Map<string, DauVaoNganSach>> {
  const ra = new Map<string, DauVaoNganSach>(dsSbd.map((s) => [s, { mauGiay: [], phutNgay: null, lichSu: [], soBaiChuaNop: 0 }]))
  if (dsSbd.length === 0) return ra
  const arr = json(dsSbd)
  const homNay = ngayVn(now)
  const ngay30 = themNgay(homNay, -SO_NGAY_DO_VAN_TOC)
  const ngayLs = themNgay(homNay, -SO_NGAY_LICH_SU)
  let r: { results?: Hang[] }
  try {
    r = await env.DB.prepare(
      `SELECT 'g' AS k, sbd, giay AS v, NULL AS w FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND giay IS NOT NULL AND ngay_vn >= ?
       UNION ALL
       SELECT 'p', sbd, minutes, NULL FROM study_preferences WHERE sbd IN (SELECT value FROM json_each(?))
       UNION ALL
       SELECT 'h', sbd, ngay, ket_qua FROM ke_hoach_ngay WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay < ? AND ngay >= ?
       UNION ALL
       SELECT 'b', be.sbd, COUNT(*), NULL FROM btvn_em be JOIN btvn b ON b.ma_btvn = be.ma_btvn
        WHERE be.sbd IN (SELECT value FROM json_each(?)) AND be.thu_hoi = 0 AND b.da_xoa = 0 AND be.nop_luc IS NULL AND b.han_nop > ? GROUP BY be.sbd`,
    ).bind(arr, ngay30, arr, arr, homNay, ngayLs, arr, new Date(now).toISOString()).all<Hang>()
  } catch {
    return ra // không đọc được ⇒ tốc độ mặc định, không lịch sử (ngân sách vẫn tính được)
  }
  for (const x of r.results ?? []) {
    const e = ra.get(chuoi(x.sbd))
    if (!e) continue
    if (x.k === 'g') e.mauGiay.push(soHoac(x.v))
    else if (x.k === 'p') e.phutNgay = Math.max(PHUT_NGAY_TOI_THIEU, Math.min(PHUT_NGAY_TOI_DA, soHoac(x.v))) || null
    else if (x.k === 'h') e.lichSu.push({ ngay: chuoi(x.v), ketQua: x.w === 'dat' || x.w === 'mot_phan' || x.w === 'khong' ? x.w : null })
    else if (x.k === 'b') e.soBaiChuaNop = soHoac(x.v)
  }
  for (const e of ra.values()) e.lichSu.sort((a, b) => (a.ngay < b.ngay ? 1 : a.ngay > b.ngay ? -1 : 0))
  return ra
}

export interface NganSachVaSucChua {
  /** Ngân sách đưa cho LÕI (`chonBoCuaEm`): hạn dài = số ngày × câu/ngày (Y HỆT trước); hạn NGẮN = số PHIÊN × câu/phiên (`soNgay: soPhien`, ôn lại 0). */
  nganSach: NganSachBai
  /** Ngân sách GỐC mỗi ngày của em (đưa cho `xepLichChang`). */
  goc: { cauMoiNgay: number; onLaiMoiNgay: number }
  giay: number
  /** Sức chứa các phiên học tới hạn (bản 1.1): hạn dài = một chặng/ngày; hạn ngắn ≤ 48 giờ = chia theo giờ trong cửa sổ 20:00–23:59. */
  sc: SucChua
}

/**
 * Ngân sách của MỘT em cho bài này (bản 1.1): `cauMoiNgay` theo tốc độ thật (8–16, luật `tinhNganSach` của kế hoạch ngày); phần ôn lại = ≤ 40 % và ≤ số câu tới hạn;
 * số ngày/phiên và tổng bộ theo SỨC CHỨA (`sucChua` của Code 1). Hạn dài cho đúng số cũ (test khoá); hạn ngắn ⇒ bộ nhỏ hơn cho vừa các phiên còn lại (lõi vẫn giữ đủ).
 */
export function nganSachVaSucChua(sbd: string, now: number, hanMs: number, dv: DauVaoNganSach, hs: Pick<HoSoRutCuaEm, 'chuaKhacPhuc' | 'toiHan'>): NganSachVaSucChua {
  const d: DauVaoKeHoach = {
    sbd, now, homNay: ngayVn(now), phutNgay: dv.phutNgay, mauGiay: dv.mauGiay, btvn: [], mom: [], cauToiHan: [], soCauChuaKhacPhuc: hs.chuaKhacPhuc, dang: [],
    nhiemVuThanThu: [], caSapToi: [], lichSu: dv.lichSu, daLamHomNay: { soCau: 0, lenBac: 0, tutBac: 0 }, homNayLaNgayNghi: false,
  }
  const cauMoiNgay = tinhNganSach(d, Math.max(1, dv.soBaiChuaNop)).mucTieuCau
  const onLaiMoiNgay = Math.max(0, Math.min(hs.toiHan, Math.floor(TY_LE_ON_TOI_DA * cauMoiNgay)))
  const giay = tinhVanToc(dv.mauGiay).giay
  const soNgayCu = Math.max(1, Math.ceil((hanMs - now) / MOT_NGAY_MS))
  let sc: SucChua
  try {
    sc = sucChua({ chotLuc: new Date(now).toISOString(), hanNop: new Date(hanMs).toISOString(), cauMoiNgay, onLaiMoiNgay, giayMoiCau: giay })
  } catch {
    sc = { cheDo: 'dai', soNgay: soNgayCu, soPhien: soNgayCu, cauMoiPhien: Math.max(1, cauMoiNgay - onLaiMoiNgay), soCauToiDa: soNgayCu * Math.max(1, cauMoiNgay - onLaiMoiNgay) }
  }
  const nganSach: NganSachBai = sc.cheDo === 'ngan' ? { soNgay: sc.soPhien, cauMoiNgay: sc.cauMoiPhien, onLaiMoiNgay: 0 } : { soNgay: sc.soNgay, cauMoiNgay, onLaiMoiNgay }
  return { nganSach, goc: { cauMoiNgay, onLaiMoiNgay }, giay, sc }
}

/** Tương thích: chỉ phần ngân sách đưa cho lõi. */
export const nganSachChoEm = (sbd: string, now: number, hanMs: number, dv: DauVaoNganSach, hs: Pick<HoSoRutCuaEm, 'chuaKhacPhuc' | 'toiHan'>): NganSachBai => nganSachVaSucChua(sbd, now, hanMs, dv, hs).nganSach

/** Lịch mở từng chặng (MỘT lần, lúc chốt) bằng `xepLichChang`; lỗi thời gian ⇒ `null` (dùng `moLucChang` cũ). Trả cả chuỗi JSON để lưu ở `chang_mo_json`. */
export function xepLichChoBo(chotLuc: string, hanNop: string, chang: string[][], goc: { cauMoiNgay: number; onLaiMoiNgay: number }, giay: number): { json: string; lich: LichDaLuu } | null {
  try {
    const p = { chotLuc, hanNop, soCauTungChang: chang.map((c) => c.length), cauMoiNgay: goc.cauMoiNgay, onLaiMoiNgay: goc.onLaiMoiNgay, giayMoiCau: giay }
    const l = xepLichChang(p)
    if (l.length !== chang.length) return null
    const j = JSON.stringify({ cheDo: cheDoLich(p), chang: l.map(({ chiSo, moLuc, dungNhipTruoc }) => ({ chiSo, moLuc, dungNhipTruoc })) })
    const lich = docLichDaLuu(j, chang.length)
    return lich ? { json: j, lich } : null
  } catch {
    return null
  }
}

// ================================================================== CHỐT BỘ CÂU CỦA EM ==================================================================

export interface BoDaChot {
  chotLuc: string
  chang: string[][]
  nhan: Record<string, NhanCau>
  tomTat: TomTatBo | null
  soCauEm: number
  soChang: number
  /** Lịch đã lưu (bản 1.1); `null` ⇒ bài chốt trước bản 1.1 hoặc lỗi thời gian: dùng `moLucChang`. */
  lich: LichDaLuu | null
}

/** Bộ đã chốt của em (từ `btvn_em_cau`), theo chặng rồi thứ tự trong chặng. Không có dòng ⇒ `null`. */
export async function docBoDaChot(env: Env, maBtvn: string, sbd: string): Promise<{ chang: string[][]; nhan: Record<string, NhanCau> } | null> {
  const r = await env.DB.prepare('SELECT qid, chang, nhan FROM btvn_em_cau WHERE ma_btvn = ? AND sbd = ? ORDER BY chang, thu_tu').bind(maBtvn, sbd).all<Hang>()
  const ds = r.results ?? []
  if (ds.length === 0) return null
  const soChang = Math.max(...ds.map((x) => soHoac(x.chang))) + 1
  const chang: string[][] = Array.from({ length: soChang }, () => [])
  const nhan: Record<string, NhanCau> = {}
  for (const x of ds) {
    chang[soHoac(x.chang)].push(chuoi(x.qid))
    nhan[chuoi(x.qid)] = chuoi(x.nhan) as NhanCau
  }
  return { chang, nhan }
}

/** Dựng bộ cho một em từ hồ sơ + ngân sách đã đọc (thuần — dùng chung với xem trước, nên bộ xem trước = bộ thật khi hồ sơ không đổi). */
export function dungBoChoEm(bai: BaiNangDo, hatGiongBai: string, sbd: string, now: number, hanMs: number, dv: DauVaoNganSach, hs: HoSoRutCuaEm, dieuChinh?: DieuChinhEm): { bo: BoCuaEm; nganSach: NganSachBai; goc: NganSachVaSucChua['goc']; giay: number; sc: SucChua } {
  const { nganSach, goc, giay, sc } = nganSachVaSucChua(sbd, now, hanMs, dv, hs)
  // `dieuChinh` (Bộ não A.I chế độ THẬT) là cổng TUỲ CHỌN của lõi: vắng ⇒ Y HỆT không có cổng (test của Code 1 + test bóng ở `tests/bo-nao-doc-2109.test.ts`).
  return { bo: chonBoCuaEm(bai.cau, bai.loi, hs.hoSo, nganSach, `${hatGiongBai}|${sbd}`, dieuChinh), nganSach, goc, giay, sc }
}

/**
 * CHỐT bộ của em (một lần): ghi `btvn_em_cau` + các cột `btvn_em`. Thua cuộc đua (đã có người chốt) ⇒ đọc lại bộ đã ghi.
 * `null` = không chốt được (bài không có câu / em bị thu hồi) — người gọi báo lỗi bằng lời.
 */
export async function chotBoChoEm(env: Env, bt: Hang, sbd: string, now: number): Promise<BoDaChot | null> {
  const maBtvn = chuoi(bt.ma_btvn)
  const khoa = `${maBtvn}|${sbd}`
  const hanMs = Date.parse(chuoi(bt.han_nop))
  const [bai, hs, dvAll, dcAll] = await Promise.all([docBaiNangDo(env, maBtvn), docHoSoRutSauKhiCoBai(env, maBtvn, sbd, now), docDauVaoNganSach(env, [sbd], now), docDieuChinhHieuLuc(env, [sbd], ngayVn(now))])
  if (!bai || !hs) return null
  const dv = dvAll.get(sbd)!
  const dc = dcAll.get(sbd)
  const { bo, nganSach, goc, giay } = dungBoChoEm(bai, hatGiongCuaBai(bt), sbd, now, Number.isFinite(hanMs) ? hanMs : now + MOT_NGAY_MS, dv, hs.get(sbd)!, dc?.dieuChinh)
  const chotLuc = new Date(now).toISOString()
  // LỊCH CHẶNG (bản 1.1): tính MỘT lần cùng bộ, lưu ở `chang_mo_json`. Hạn dài Y HỆT `moLucChang` cũ; hạn ngắn chia theo giờ trong cửa sổ học.
  const xep = Number.isFinite(hanMs) ? xepLichChoBo(chotLuc, new Date(hanMs).toISOString(), bo.chang, goc, giay) : null
  let thuTu = 0
  const hang = bo.chang.flatMap((qs, c) => qs.map((q) => ({ q, c, n: bo.nhan[q], t: thuTu++ })))
  const soChang = bo.chang.length
  const kq = await env.DB.batch([
    env.DB.prepare(
      `UPDATE btvn_em SET chot_luc = ?, so_cau_em = ?, so_chang = ?, tom_tat_json = ?, ngan_sach_json = ?, chang_mo_json = ? WHERE khoa = ? AND chot_luc IS NULL AND thu_hoi = 0`,
    ).bind(chotLuc, hang.length, soChang, json(bo.tomTat), json({ ...nganSach, ...(dc ? { dieuChinh: dc.dieuChinh, dieuChinhNgay: dc.ngay } : {}) }), xep?.json ?? null, khoa),
    env.DB.prepare(
      `INSERT OR IGNORE INTO btvn_em_cau (khoa, ma_btvn, sbd, qid, chang, nhan, thu_tu)
       SELECT ? || '|' || json_extract(j.value,'$.q'), ?, ?, json_extract(j.value,'$.q'), json_extract(j.value,'$.c'), json_extract(j.value,'$.n'), json_extract(j.value,'$.t')
         FROM json_each(?) j
        WHERE EXISTS (SELECT 1 FROM btvn_em WHERE khoa = ? AND chot_luc = ?)`,
    ).bind(khoa, maBtvn, sbd, json(hang), khoa, chotLuc),
  ])
  if (Number((kq[0] as { meta?: { changes?: number } })?.meta?.changes ?? 0) > 0) {
    return { chotLuc, chang: bo.chang, nhan: bo.nhan, tomTat: bo.tomTat, soCauEm: hang.length, soChang, lich: xep?.lich ?? null }
  }
  // Thua cuộc đua hoặc đã chốt từ trước: đọc lại đúng bộ đã ghi.
  const em = await env.DB.prepare('SELECT chot_luc, tom_tat_json, so_cau_em, so_chang, chang_mo_json FROM btvn_em WHERE khoa = ? AND thu_hoi = 0').bind(khoa).first<Hang>()
  if (!em?.chot_luc) return null
  const da = await docBoDaChot(env, maBtvn, sbd)
  if (!da) return null
  return { chotLuc: chuoi(em.chot_luc), chang: da.chang, nhan: da.nhan, tomTat: docTomTat(em.tom_tat_json), soCauEm: da.chang.flat().length, soChang: da.chang.length, lich: docLichDaLuu(em.chang_mo_json, da.chang.length) }
}

/** `docHoSoRut` cần danh sách câu của bài; ở đường chốt đã có `bai` nên chỉ cần một lượt đọc — bọc lại để chạy song song với `docBaiNangDo`. */
async function docHoSoRutSauKhiCoBai(env: Env, maBtvn: string, sbd: string, now: number): Promise<Map<string, HoSoRutCuaEm> | null> {
  const bai = await docBaiNangDo(env, maBtvn)
  if (!bai) return null
  return docHoSoRut(env, [sbd], bai.cau, now)
}

export function docTomTat(v: unknown): TomTatBo | null {
  try {
    const o = JSON.parse(chuoi(v)) as unknown
    return o && typeof o === 'object' ? (o as TomTatBo) : null
  } catch {
    return null
  }
}

// ================================================================== CHẶNG ==================================================================

export { LAN_MOI_LUOT, moLucChang, trangThaiCacChang, type TrangThaiChang } from './btvn-nang-do-chang'

// ================================================================== BÓC ĐÁP ÁN ==================================================================

/** DANH SÁCH CHO PHÉP: chỉ những trường máy em cần để HIỂN THỊ câu. Mọi khoá khác (đáp án, lời giải, bẫy, kiến thức, nhãn sao…) bị bỏ. */
const TRUONG_CHO_EM = ['qid', 'phan', 'so', 'de', 'pa', 'y', 'bang', 'hinh', 'tieu_de', 'can_xem', 'chuyen_de', 'muc_do', 'kieu'] as const

export function boDapAn(c: Hang): Hang {
  const ra: Hang = {}
  for (const k of TRUONG_CHO_EM) {
    if (!(k in c)) continue
    ra[k] = k === 'hinh' && Array.isArray(c.hinh) ? (c.hinh as Hang[]).filter((h) => !h || h.vi_tri !== 'sau_loi_giai') : c[k]
  }
  return ra
}

// ================================================================== MỞ BÀI (btvnCuaEm) ==================================================================

/**
 * PHẦN THÊM CHO `/btvn/cua-em` của bài `ca_nhan = 1`. Trả `{ok:false,…}` nếu không dựng được, hoặc các trường ĐÈ/THÊM vào phản hồi cũ.
 * Lần mở đầu chốt bộ (≈ 7 truy vấn); mở lại đọc `btvn_em_cau` (3 truy vấn kể cả `bt`, `em` đã đọc ở ngoài).
 */
export async function phanHoiMoBaiCaNhan(env: Env, bt: Hang, em: Hang, sbd: string, now: number): Promise<Hang> {
  const maBtvn = chuoi(bt.ma_btvn)
  let chotLuc = em.chot_luc ? chuoi(em.chot_luc) : ''
  let chang: string[][]
  let nhan: Record<string, NhanCau>
  let tomTat: TomTatBo | null
  if (!chotLuc) {
    const c = await chotBoChoEm(env, bt, sbd, now)
    if (!c) return { ok: false, lyDo: 'bai_chua_san_sang', error: 'Bài này chưa sẵn sàng. Em thử lại sau ít phút.' }
    ;({ chotLuc, chang, nhan, tomTat } = c)
  } else {
    const da = await docBoDaChot(env, maBtvn, sbd)
    if (!da) return { ok: false, lyDo: 'bai_chua_san_sang', error: 'Bài này chưa sẵn sàng. Em thử lại sau ít phút.' }
    ;({ chang, nhan } = da)
    tomTat = docTomTat(em.tom_tat_json)
  }
  let tho: Hang[]
  try {
    tho = await homeworkQuestions(env, chuoi(bt.ma_de))
  } catch {
    return { ok: false, error: 'Chưa tải đủ đề bài tập. Em thử lại.' }
  }
  const daNop = !!em.nop_luc
  const loDaXong = Math.min(chang.length, soHoac(em.lo_da_xong))
  const tt = trangThaiCacChang(chang, chotLuc, loDaXong, daNop, now)
  const theoQid = new Map(tho.map((c) => [chuoi(c.qid), c]))
  const dsQidMo = chang.flatMap((qs, k) => (tt.chang[k].daMo ? qs : []))
  const nhanMo: Record<string, NhanCau> = {}
  for (const q of dsQidMo) nhanMo[q] = nhan[q]
  return {
    ok: true,
    caNhan: true,
    soCau: chang.flat().length,
    soCauCuaEm: chang.flat().length,
    soChang: chang.length,
    loDaXong,
    changDangMo: tt.changDangMo,
    chang: tt.chang,
    nhan: nhanMo,
    tomTat,
    de: { ma_de: chuoi(bt.ma_de), cau: dsQidMo.filter((q) => theoQid.has(q)).map((q) => boDapAn(theoQid.get(q)!)), khongDapAn: true },
  }
}

// ================================================================== NỘP CHẶNG (/btvn/xong-lo cho bài ca_nhan) ==================================================================

const docDapAnDaLuu = (v: unknown): Record<string, string> => {
  try {
    const o = JSON.parse(chuoi(v)) as unknown
    if (!o || typeof o !== 'object' || Array.isArray(o)) return {}
    return Object.fromEntries(Object.entries(o as Hang).map(([q, a]) => [q, answerText(a)]))
  } catch {
    return {}
  }
}

const cat = (s: string) => s.slice(0, GIOI_HAN_DAP_AN)

async function tenDangTheoMa(env: Env, ds: string[]): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  const that = ds.filter((m) => !m.startsWith('CD:'))
  for (const m of ds) if (m.startsWith('CD:')) ra.set(m, m.slice(3))
  if (that.length === 0) return ra
  try {
    const r = await env.DB.prepare(`SELECT dang, MAX(json_extract(json,'$.tenDang')) AS ten FROM game_v2_question WHERE dang IN (SELECT value FROM json_each(?)) GROUP BY dang`).bind(json(that)).all<Hang>()
    for (const x of r.results ?? []) if (chuoi(x.ten).trim()) ra.set(chuoi(x.dang), chuoi(x.ten).trim())
  } catch {
    /* không tra được tên dạng: thẻ dùng mã dạng */
  }
  return ra
}

/** Còn bao nhiêu EXP để thú lên cấp; `null` khi em chưa có thú (không bịa một con mặc định). */
export async function docConLaiLenCap(env: Env, sbd: string): Promise<number | null> {
  try {
    const r = await env.DB.prepare(
      `SELECT json_extract(json,'$.cap') AS cap, json_extract(json,'$.exp') AS exp, json_extract(json,'$.choice') AS choice, json_type(json,'$.pet') AS pet_kieu FROM game_v2_profile WHERE sbd = ?`,
    ).bind(sbd).first<Hang>()
    if (!r || Number(r.choice) === 1 || r.pet_kieu !== 'text') return null
    const can = thanhExp(Math.max(1, Math.round(soHoac(r.cap, 1))))
    return can <= 0 ? 0 : Math.max(0, can - Math.max(0, Math.round(soHoac(r.exp))))
  } catch {
    return null
  }
}

/**
 * NỘP MỘT CHẶNG của bài `ca_nhan`. `dapAnTho` = `{qid: đáp án}` của các câu chặng (máy em gửi); rỗng/vắng ⇒ chỉ báo trạng thái.
 * Luật: chỉ câu ĐÃ TRẢ LỜI (`daTraLoi`) mới chấm/ghi sổ/khoá/nhận lời giải; đáp án ĐẦU khoá; đáp án + lời giải CHỈ ra sau khi đã ghi sổ.
 */
export async function nopChangCaNhan(env: Env, bt: Hang, sbd: string, chiSoTho: number, dapAnTho: Hang | null, now: number): Promise<Hang> {
  const maBtvn = chuoi(bt.ma_btvn)
  const khoa = `${maBtvn}|${sbd}`
  const chiSo = Math.floor(chiSoTho)
  let em = await env.DB.prepare('SELECT * FROM btvn_em WHERE khoa = ?').bind(khoa).first<Hang>()
  if (!em || em.thu_hoi) return { ok: false, error: 'Em không có bài tập này.' }
  if (!em.chot_luc) return { ok: false, lyDo: 'chua_chot', error: 'Em mở bài trước rồi mới nộp chặng được.' }
  const soChang = soHoac(em.so_chang)
  const hanMs = Date.parse(chuoi(bt.han_nop))
  if (Number.isFinite(hanMs) && now > hanMs && !em.nop_luc) return { ok: false, lyDo: 'qua_han', error: 'Bạn đã quá hạn nộp BTVN' }
  const chotLuc = chuoi(em.chot_luc)
  const loDaXong = Math.min(soChang, soHoac(em.lo_da_xong))
  if (chiSo < 0 || chiSo >= soChang) return { ok: false, lyDo: 'chang_chua_mo', error: 'Chặng này chưa mở.' }
  const moLuc = moLucChang(chotLuc, soChang)
  if (!(chiSo === 0 || (chiSo <= loDaXong && now >= Date.parse(moLuc[chiSo])))) return { ok: false, lyDo: 'chang_chua_mo', error: 'Chặng này chưa mở.' }
  if (em.nop_luc && chiSo >= loDaXong) return { ok: false, lyDo: 'da_nop', error: 'Em đã nộp bài này rồi.' }

  const rows = await env.DB.prepare('SELECT qid, nhan FROM btvn_em_cau WHERE ma_btvn = ? AND sbd = ? AND chang = ? ORDER BY thu_tu').bind(maBtvn, sbd, chiSo).all<Hang>()
  const dsQid = (rows.results ?? []).map((x) => chuoi(x.qid))
  const ganChang = (lo: number): number | null => {
    const d = Math.min(soChang, lo)
    return d < soChang && (d === 0 || now >= Date.parse(moLuc[d])) ? d : null
  }

  const co = dapAnTho && typeof dapAnTho === 'object' && !Array.isArray(dapAnTho) ? Object.keys(dapAnTho).length > 0 : false
  if (!co) return { ok: true, loDaXong, changDangMo: ganChang(loDaXong), chuaLam: dsQid }

  let tho: Hang[]
  try {
    tho = await homeworkQuestions(env, chuoi(bt.ma_de))
  } catch {
    return { ok: false, error: 'Chưa tải đủ đề bài tập. Em thử lại.' }
  }
  const theoQid = new Map(tho.map((c) => [chuoi(c.qid), c]))
  const cauChang = dsQid.filter((q) => theoQid.has(q)).map((q) => theoQid.get(q)!)
  const phanCua = (c: Hang) => chuoi(c.phan) || phanTuQid(chuoi(c.qid))
  const hoSoTruoc = await docHoSoTheoCauCuaBai(env, maBtvn, sbd, dsQid, now)

  // GỘP đáp án: đáp án ĐẦU khoá (đã trả lời rồi thì giữ); CAS trên `dap_an_json` để hai lượt gọi đồng thời không đè nhau (thử lại một lần).
  let gop: Record<string, string> = {}
  let daDoi = false
  for (let lan = 0; lan < 2; lan++) {
    const luu = docDapAnDaLuu(em.dap_an_json)
    const moi: Record<string, string> = {}
    for (const c of cauChang) {
      const q = chuoi(c.qid)
      const cu = luu[q] ?? ''
      if (cu && daTraLoi(phanCua(c), cu)) continue
      const v = cat(answerText((dapAnTho as Hang)[q]))
      if (v && daTraLoi(phanCua(c), v)) moi[q] = v
    }
    gop = { ...luu, ...moi }
    daDoi = Object.keys(moi).length > 0
    const xong = cauChang.length > 0 && cauChang.every((c) => daTraLoi(phanCua(c), gop[chuoi(c.qid)] ?? ''))
    if (!daDoi) {
      if (xong && loDaXong <= chiSo) await env.DB.prepare('UPDATE btvn_em SET lo_da_xong = MAX(COALESCE(lo_da_xong, 0), ?) WHERE khoa = ? AND thu_hoi = 0').bind(chiSo + 1, khoa).run()
      break
    }
    const cuChuoi = em.dap_an_json === null || em.dap_an_json === undefined ? null : chuoi(em.dap_an_json)
    const r = await env.DB.prepare(
      'UPDATE btvn_em SET dap_an_json = ?, lo_da_xong = MAX(COALESCE(lo_da_xong, 0), ?) WHERE khoa = ? AND thu_hoi = 0 AND dap_an_json IS ?',
    ).bind(json(gop), xong ? chiSo + 1 : 0, khoa, cuChuoi).run()
    if (r.meta.changes) break
    if (lan === 1) return { ok: false, error: 'Vừa có một lần nộp khác của chặng này. Em tải lại rồi nộp lại nhé.' }
    em = (await env.DB.prepare('SELECT * FROM btvn_em WHERE khoa = ?').bind(khoa).first<Hang>()) ?? em
  }

  const daLam = cauChang.filter((c) => daTraLoi(phanCua(c), gop[chuoi(c.qid)] ?? ''))
  const chuaLam = cauChang.filter((c) => !daTraLoi(phanCua(c), gop[chuoi(c.qid)] ?? '')).map((c) => chuoi(c.qid))
  if (daLam.length === 0) return { ok: true, loDaXong, changDangMo: ganChang(loDaXong), chuaLam: dsQid }

  // GHI SỔ (idempotent, khoá đầu thắng) — chưa ghi được thì KHÔNG có đáp án nào đi ra.
  const luc = new Date(now).toISOString()
  // `lan` của sổ = chỉ số chặng ở lượt 1; lượt làm lại (thầy bấm "Cho làm lại") cộng 1000 mỗi lượt để khoá sổ khác đi, kết quả lượt mới không bị nuốt.
  const lanSo = chiSo + LAN_MOI_LUOT * (Math.max(1, soHoac(em.so_lan_lam, 1)) - 1)
  const ghi = await ghiSuKien(env, suKienChamBai('btvn_lo', maBtvn, sbd, lanSo, luc, cauTuKho(daLam), gop))
  if (!ghi.ok) return { ok: false, error: 'Chưa ghi được bài làm. Em nộp lại nhé.' }
  try {
    await dungLaiHoSo(env, [sbd], luc)
  } catch (e) {
    console.error('[btvn-nang-do] dựng lại hồ sơ lỗi (sổ đã ghi, kế hoạch sau sẽ tự dựng lại):', e instanceof Error ? e.message : e)
  }
  const hoSoSau = await docHoSoTheoCauCuaBai(env, maBtvn, sbd, dsQid, now)
  const tien = theTienBo(hoSoTruoc, hoSoSau)
  const ten = await tenDangTheoMa(env, tien.dangLenBac.map((d) => d.ma))
  const xong = chuaLam.length === 0
  const loMoi = xong ? Math.max(loDaXong, chiSo + 1) : loDaXong
  // CHẶNG CUỐI XONG (mọi câu của bài đã có đáp án) ⇒ máy chủ TỰ CHỐT NỘP bài bằng đáp án đã lưu: em không cần (và không phải) gọi thêm `/btvn/nop`.
  // Gọi thêm `/btvn/nop` với `dapAn: {}` vẫn an toàn — idempotent (`daNhan`), không chấm hai lần. Nộp TRƯỚC khi tính EXP để khoản "nộp đúng hạn" tính ngay lượt này.
  let nop: Hang | null = null
  if (xong && loMoi >= soChang && !em.nop_luc) {
    const n = await nopBaiCaNhan(env, bt, sbd, {}, now)
    if (n.ok) nop = { daNop: true, nopLuc: n.nopLuc, soDung: n.soDung, soCau: n.soCau, soCauCuaEm: n.soCauCuaEm, soCauThuongSai: n.soCauThuongSai, qidSai: n.qidSai }
  }
  // BỘ NÃO A.I chế độ THẬT: em có điều chỉnh còn hạn ⇒ sau chặng vừa XONG chạy `thichNghiChangSau` cho các chặng CHƯA MỞ. Chạy thử/tắt/không có điều chỉnh ⇒ KHÔNG gọi (bộ y nguyên).
  if (xong && !nop && loMoi < soChang) {
    const dc = (await docDieuChinhHieuLuc(env, [sbd], ngayVn(now))).get(sbd)
    if (dc) {
      const dung: Record<string, boolean> = {}
      for (const c of daLam) dung[chuoi(c.qid)] = isAnswerCorrect(gop[chuoi(c.qid)], answerText(c.dap_an ?? c.dapAn), phanTuQid(chuoi(c.qid), phanCua(c)))
      await thichNghiSauChang(env, bt, em, sbd, chiSo, loMoi, dung, dc, now)
    }
  }
  const moiExp = await capNhatExp(env, sbd, now)
  const ketQua = daLam.map((c) => {
    const q = chuoi(c.qid)
    const dungDapAn = answerText(c.dap_an ?? c.dapAn)
    return {
      qid: q,
      dung: isAnswerCorrect(gop[q], dungDapAn, phanTuQid(q, phanCua(c))),
      dapAnDung: dungDapAn,
      loiGiai: c.loi_giai ?? c.loiGiai ?? null,
      anhLoiGiai: (Array.isArray(c.hinh) ? (c.hinh as Hang[]) : []).filter((h) => h && h.vi_tri === 'sau_loi_giai'),
    }
  })
  const homNay = await docExpHomNay(env, sbd, now)
  return {
    ok: true,
    ...(nop ? { nop } : {}),
    loDaXong: loMoi,
    changDangMo: ganChang(loMoi),
    chang: { chiSo, soCau: dsQid.length, soDung: ketQua.filter((k) => k.dung).length, xong },
    ketQua,
    chuaLam,
    exp: { homNay: homNay.homNay, conLaiLenCap: await docConLaiLenCap(env, sbd) },
    tienBo: { ...tien, dangLenBac: tien.dangLenBac.map((d) => ({ ...d, ten: ten.get(d.ma) ?? d.ma })) } satisfies TienBo & { dangLenBac: { ma: string; ten: string; tu: Muc; den: Muc }[] },
    ...(moiExp.bat ? { expNhan: expNhanCuaKetQua(moiExp), manhNhan: manhNhanCuaKetQua(moiExp) } : {}),
  }
}

/** Hồ sơ RÚT của một em chỉ theo các câu (qid) đã cho — dùng để so TRƯỚC/SAU một chặng cho thẻ tiến bộ. Đọc `btvn_cau` để biết mã dạng của từng câu. */
async function docHoSoTheoCauCuaBai(env: Env, maBtvn: string, sbd: string, dsQid: string[], now: number): Promise<HoSoEmRut> {
  if (dsQid.length === 0) return { dang: {}, cau: {} }
  const r = await env.DB.prepare('SELECT qid, dang, chuyen_de, muc_do, sao, phan FROM btvn_cau WHERE ma_btvn = ? AND qid IN (SELECT value FROM json_each(?))').bind(maBtvn, json(dsQid)).all<Hang>()
  const cau = (r.results ?? []).map(docCauGiaoTuHang)
  return (await docHoSoRut(env, [sbd], cau, now)).get(sbd)!.hoSo
}

// ================================================================== NỘP CUỐI (/btvn/nop) cho bài ca_nhan ==================================================================

/**
 * CHẤM VÀ GHI LƯỢT NỘP của bài `ca_nhan` — chỉ trên câu CỦA EM. Điểm = đúng / mẫu × 10, mẫu = |bộ| − câu thưởng SAI.
 * Đáp án đã khoá ở chặng thắng đáp án gửi kèm; đáp án ngoài bộ bị bỏ. Đã nộp thì KHÔNG làm lại (đáp án chặng đã khoá và đã hiện lời giải).
 */
export async function nopBaiCaNhan(env: Env, bt: Hang, sbd: string, lam: Hang, now: number): Promise<Hang> {
  const maBtvn = chuoi(bt.ma_btvn)
  const khoa = `${maBtvn}|${sbd}`
  const cu = await env.DB.prepare('SELECT dap_an_json, nop_luc, chot_luc, so_cau_em, COALESCE(so_lan_lam, 1) AS so_lan_lam FROM btvn_em WHERE khoa = ? AND thu_hoi = 0').bind(khoa).first<Hang>()
  if (!cu) return { ok: false, lyDo: 'khong_duoc_giao', error: 'Em không có bài tập của lượt này' }
  if (!cu.chot_luc) return { ok: false, lyDo: 'chua_chot', error: 'Em mở bài trước rồi mới nộp được.' }
  const bo = await docBoDaChot(env, maBtvn, sbd)
  if (!bo) return { ok: false, lyDo: 'bai_chua_san_sang', error: 'Bài này chưa sẵn sàng. Em thử lại sau ít phút.' }
  let tho: Hang[]
  try {
    tho = await homeworkQuestions(env, chuoi(bt.ma_de))
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Không chấm được bài.' }
  }
  const dsQid = new Set(bo.chang.flat())
  const chiCauCuaEm = tho.filter((c) => dsQid.has(chuoi(c.qid)))
  const keys = homeworkKeys(chiCauCuaEm)
  // Đáp án đã khoá ở chặng THẮNG đáp án gửi kèm; đáp án ngoài bộ bị bỏ (không lỗi).
  const luu = docDapAnDaLuu(cu.dap_an_json)
  const phanCua = new Map(chiCauCuaEm.map((c) => [chuoi(c.qid), chuoi(c.phan) || phanTuQid(chuoi(c.qid))]))
  const gui: Hang = {}
  for (const [q, v] of Object.entries(lam)) if (keys.has(q)) gui[q] = cat(answerText(v))
  for (const [q, v] of Object.entries(luu)) if (keys.has(q) && v && daTraLoi(phanCua.get(q) ?? 'I', v)) gui[q] = v
  let graded
  try {
    graded = gradeHomework(keys, gui, chuoi(bt.ma_de))
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Không chấm được bài.' }
  }
  const soCauCuaEm = keys.size
  const thuongSai = graded.qidSai.filter((q) => laCauThuong(bo.nhan[q]))
  const mau = soCauCuaEm - thuongSai.length
  const luuLam = JSON.stringify(graded.answers)
  const chung = { caNhan: true, soCauCuaEm, soCauThuongSai: thuongSai.length }
  if (cu.nop_luc) {
    if (String(cu.dap_an_json) === luuLam) return { ok: true, lanThu: soHoac(cu.so_lan_lam, 1), soCau: mau, soDung: graded.soDung, qidSai: graded.qidSai, nopLuc: cu.nop_luc, daNhan: true, ...chung }
    return { ok: false, error: 'Bài cá nhân hoá đã nộp, không làm lại được.', daHetLuot: true }
  }
  const nay = new Date(now).toISOString()
  const luot = Math.max(1, soHoac(cu.so_lan_lam, 1)) // lượt làm hiện tại (tăng khi thầy bấm "Cho làm lại")
  const saved = await env.DB.prepare('UPDATE btvn_em SET nop_luc = ?, so_dung = ?, so_cau = ?, dap_an_json = ? WHERE khoa = ? AND thu_hoi = 0 AND nop_luc IS NULL')
    .bind(nay, graded.soDung, mau, luuLam, khoa).run()
  if (!saved.meta.changes) return { ok: false, error: 'Bài vừa được cập nhật từ một lần nộp khác. Em tải lại để xem kết quả.' }
  // Sổ: mọi câu của em (kể cả thưởng sai — hồ sơ cần biết). Câu đã ghi qua chặng (`btvn_lo`) không ghi đôi.
  await ghiSuKien(env, suKienTuKetQuaCham('btvn', maBtvn, sbd, luot, nay, graded), { tranhTrungLo: true })
  return { ok: true, lanThu: luot, soCau: mau, soDung: graded.soDung, qidSai: graded.qidSai, nopLuc: nay, soLanLamLaiConLai: 0, ...chung }
}

// ================================================================== XEM TRƯỚC PHÂN BỔ (thầy, CHỈ ĐỌC) ==================================================================

const layDsSbd = (v: unknown): string[] => [...new Set((Array.isArray(v) ? v : []).map((x) => chuoi(x).trim()).filter(Boolean))]

/**
 * `POST /btvn/xem-truoc` — bảng phân bổ từng em cho thầy. KHÔNG GHI gì (test khoá: chụp mọi bảng trước/sau, không đổi).
 *   (a) TRƯỚC khi giao: `{dsMaDe|maDe, cau[], ghim?, hanNop, hatGiong, dsSbd}` — bộ TÍNH THỬ bằng cùng hàm, cùng hạt giống với lượt giao thật.
 *   (b) SAU khi giao: `{maBtvn, dsSbd}` — em đã chốt thì trả ĐÚNG bộ đã ghi; em chưa chốt thì bộ tính thử theo hồ sơ hiện tại.
 * `sbdChiTiet` (một em) kèm danh sách câu theo chặng + nhãn; các em khác chỉ có con số (giữ payload nhỏ). ≤ 50 em, ≤ 8 truy vấn.
 */
export async function xemTruocBtvn(env: Env, b: Hang, now: number): Promise<Hang> {
  const dsSbd = layDsSbd(b.dsSbd)
  if (dsSbd.length === 0) return { ok: false, error: 'Thiếu danh sách học sinh (dsSbd).' }
  if (dsSbd.length > TOI_DA_EM_XEM_TRUOC) return { ok: false, error: `Mỗi lượt xem trước tối đa ${TOI_DA_EM_XEM_TRUOC} học sinh, thầy gửi ${dsSbd.length}.` }
  const sbdChiTiet = chuoi(b.sbdChiTiet).trim()
  const maBtvn = chuoi(b.maBtvn).trim()

  let bai: BaiNangDo | null
  let hatGiong: string
  let hanMs: number
  let daChotCua = new Map<string, Hang>() // sbd → dòng btvn_em (chỉ ở chế độ (b))
  let coTrongBai: Set<string> | null = null
  let canhBao: string | undefined
  let doiChieu: { boQuaQid: string[]; thieuMeta: number } | undefined
  if (maBtvn) {
    const bt = await env.DB.prepare('SELECT * FROM btvn WHERE ma_btvn = ? AND da_xoa = 0').bind(maBtvn).first<Hang>()
    if (!bt) return { ok: false, error: 'Bài không còn được giao.' }
    if (!laBaiCaNhan(bt)) return { ok: false, error: 'Bài này không cá nhân hoá.' }
    bai = await docBaiNangDo(env, maBtvn)
    if (!bai) return { ok: false, lyDo: 'bai_chua_san_sang', error: 'Bài này chưa có danh sách câu.' }
    hatGiong = hatGiongCuaBai(bt)
    hanMs = Date.parse(chuoi(bt.han_nop))
    const r = await env.DB.prepare(
      'SELECT sbd, ho_ten, chot_luc, so_cau_em, so_chang, tom_tat_json, ngan_sach_json FROM btvn_em WHERE ma_btvn = ? AND thu_hoi = 0 AND sbd IN (SELECT value FROM json_each(?))',
    ).bind(maBtvn, json(dsSbd)).all<Hang>()
    for (const x of r.results ?? []) daChotCua.set(chuoi(x.sbd), x)
    coTrongBai = new Set(daChotCua.keys())
  } else {
    const dsMaDe = layDsSbd(Array.isArray(b.dsMaDe) ? b.dsMaDe : [b.maDe])
    if (dsMaDe.length === 0) return { ok: false, error: 'Thiếu tờ đề (maDe/dsMaDe) hoặc mã bài (maBtvn).' }
    const dung = await dungBaiGiao(env, dsMaDe, b.cau, b.ghim)
    if (!dung.ok) return dung
    bai = { cau: dung.cau, loi: dung.loi, ghim: dung.ghim }
    canhBao = dung.canhBao
    doiChieu = { boQuaQid: dung.boQuaQid, thieuMeta: dung.thieuMeta }
    hatGiong = chuoi(b.hatGiong).trim().slice(0, 40) || 'xem-truoc'
    hanMs = b.hanNop ? Date.parse(chuoi(b.hanNop)) : now + 48 * 3_600_000
    if (!Number.isFinite(hanMs) || hanMs <= now) return { ok: false, error: 'Hạn nộp phải là thời điểm trong tương lai.' }
  }
  const dsXet = coTrongBai ? dsSbd.filter((s) => coTrongBai!.has(s)) : dsSbd
  const [hoSo, dv, ten, dcAll] = await Promise.all([
    docHoSoRut(env, dsXet, bai.cau, now),
    docDauVaoNganSach(env, dsXet, now),
    moiEmDaCoTen(daChotCua) ? Promise.resolve(new Map<string, string>()) : docTenEm(env, dsXet),
    docDieuChinhHieuLuc(env, dsXet, ngayVn(now)), // Bộ não THẬT: bộ tính thử theo cùng điều chỉnh như lúc chốt; chạy thử/tắt ⇒ rỗng
  ])
  const ds: Hang[] = []
  let chiTiet: Hang | undefined
  for (const sbd of dsXet) {
    const da = daChotCua.get(sbd)
    const daChot = !!da?.chot_luc
    const hs = hoSo.get(sbd)!
    if (daChot) {
      ds.push({ sbd, hoTen: chuoi(da!.ho_ten), daChot: true, coHoSo: hs.coHoSo, nganSach: docJsonHang(da!.ngan_sach_json), tomTat: docTomTat(da!.tom_tat_json) })
      if (sbd === sbdChiTiet) {
        const bo = await docBoDaChot(env, maBtvn, sbd)
        if (bo) chiTiet = { sbd, chang: bo.chang, nhan: bo.nhan }
      }
    } else {
      const { bo, nganSach } = dungBoChoEm(bai, hatGiong, sbd, now, hanMs, dv.get(sbd)!, hs, dcAll.get(sbd)?.dieuChinh)
      ds.push({ sbd, hoTen: chuoi(da?.ho_ten) || ten.get(sbd) || '', daChot: false, coHoSo: hs.coHoSo, nganSach, tomTat: bo.tomTat })
      if (sbd === sbdChiTiet) chiTiet = { sbd, chang: bo.chang, nhan: bo.nhan }
    }
  }
  return {
    ok: true,
    hatGiong,
    soCauBai: bai.cau.length,
    soLoi: bai.loi.length,
    loi: bai.loi,
    ds,
    ...(chiTiet ? { chiTiet } : {}),
    ...(coTrongBai ? { khongCoTrongBai: dsSbd.filter((s) => !coTrongBai!.has(s)) } : {}),
    ...(canhBao ? { canhBao } : {}),
    ...(doiChieu ?? {}),
  }
}

const moiEmDaCoTen = (m: Map<string, Hang>): boolean => m.size > 0 && [...m.values()].every((x) => chuoi(x.ho_ten).trim() !== '')

const docJsonHang = (v: unknown): Hang | null => {
  try {
    const o = JSON.parse(chuoi(v)) as unknown
    return o && typeof o === 'object' ? (o as Hang) : null
  } catch {
    return null
  }
}

/** Tên em (best-effort) cho bảng xem trước TRƯỚC khi giao: danh sách lớp → hồ sơ học sinh → tên ghi ở lượt thi. */
async function docTenEm(env: Env, dsSbd: string[]): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  try {
    const r = await env.DB.prepare(
      `SELECT x.value AS sbd, COALESCE(NULLIF((SELECT ho_ten FROM danh_sach WHERE sbd = x.value), ''), NULLIF((SELECT ho_ten FROM hoc_sinh WHERE sbd = x.value), ''), NULLIF((SELECT MAX(ho_ten) FROM luot WHERE sbd = x.value), ''), '') AS ten
         FROM json_each(?) x`,
    ).bind(json(dsSbd)).all<Hang>()
    for (const x of r.results ?? []) ra.set(chuoi(x.sbd), chuoi(x.ten))
  } catch {
    /* không có tên thì để trống, bảng vẫn dùng được */
  }
  return ra
}

// ================================================================== HỒ SƠ LÊN BẢNG: chỉ tính câu CỦA EM ==================================================================

/**
 * Với các lượt giao `dsMaBtvn` và các em `dsSbd`: lượt nào là `ca_nhan` và bộ CÂU của từng em (khoá `<maBtvn>|<sbd>`).
 * Chưa chạy migration ⇒ trả rỗng (mọi lượt coi là bài cũ). Em chưa chốt thì không có khoá — chỗ gọi bỏ lượt ấy, không tính "chưa làm 80 câu".
 */
export async function docBoCuaCacEm(env: Env, dsMaBtvn: string[], dsSbd: string[]): Promise<{ caNhan: Set<string>; bo: Map<string, Set<string>> }> {
  const ra = { caNhan: new Set<string>(), bo: new Map<string, Set<string>>() }
  if (dsMaBtvn.length === 0 || dsSbd.length === 0) return ra
  try {
    const [c, r] = await Promise.all([
      env.DB.prepare('SELECT ma_btvn FROM btvn WHERE ca_nhan = 1 AND ma_btvn IN (SELECT value FROM json_each(?))').bind(json(dsMaBtvn)).all<Hang>(),
      env.DB.prepare('SELECT ma_btvn, sbd, qid FROM btvn_em_cau WHERE sbd IN (SELECT value FROM json_each(?)) AND ma_btvn IN (SELECT value FROM json_each(?))').bind(json(dsSbd), json(dsMaBtvn)).all<Hang>(),
    ])
    for (const x of c.results ?? []) ra.caNhan.add(chuoi(x.ma_btvn))
    for (const x of r.results ?? []) {
      const k = `${chuoi(x.ma_btvn)}|${chuoi(x.sbd)}`
      const s = ra.bo.get(k)
      if (s) s.add(chuoi(x.qid))
      else ra.bo.set(k, new Set([chuoi(x.qid)]))
    }
  } catch {
    /* chưa có bảng/cột: mọi lượt là bài cũ */
  }
  return ra
}

// ================================================================== THEO DÕI + BÀI LÀM (thầy) ==================================================================

export interface ThongKeCaNhanEm {
  soCauCuaEm: number | null
  soChang: number | null
  loDaXong: number
  soDungLoi: number
  soCauLoi: number
  diemLoi: number | null
  soCauThuongSai: number
}

const docLam = (v: unknown): Record<string, string> => docDapAnDaLuu(v)

/**
 * Thống kê thêm cho `/btvn/theo-doi` của MỘT bài `ca_nhan`: theo em (số câu của em, chặng, đúng/lõi, câu thưởng sai) + tập lõi (để chống chép bài CHỈ so trên lõi).
 * `diemLoi` = đúng lõi / số câu lõi × 10, chỉ có khi em đã nộp (chưa nộp thì null — chưa làm hết thì con số so lớp vô nghĩa). Lõi tính `loi_cao` BÌNH THƯỜNG.
 */
export async function thongKeTheoDoiCaNhan(env: Env, bt: Hang, dsEm: Hang[]): Promise<{ soLoi: number; loi: Set<string>; theoEm: Map<string, ThongKeCaNhanEm> }> {
  const maBtvn = chuoi(bt.ma_btvn)
  const [rEm, rCau, rBo] = await Promise.all([
    env.DB.prepare('SELECT sbd, so_cau_em, so_chang, lo_da_xong, chot_luc FROM btvn_em WHERE ma_btvn = ?').bind(maBtvn).all<Hang>(),
    env.DB.prepare('SELECT qid FROM btvn_cau WHERE ma_btvn = ? AND loi = 1').bind(maBtvn).all<Hang>(),
    env.DB.prepare('SELECT sbd, qid, nhan FROM btvn_em_cau WHERE ma_btvn = ?').bind(maBtvn).all<Hang>(),
  ])
  const loi = new Set((rCau.results ?? []).map((x) => chuoi(x.qid)))
  let khoa = new Map<string, string>()
  try {
    khoa = homeworkKeys(await homeworkQuestions(env, chuoi(bt.ma_de)))
  } catch {
    /* không đọc được tờ: bỏ các con số cần đáp án */
  }
  const nhanCuaEm = new Map<string, Map<string, string>>()
  for (const x of rBo.results ?? []) {
    const s = chuoi(x.sbd)
    if (!nhanCuaEm.has(s)) nhanCuaEm.set(s, new Map())
    nhanCuaEm.get(s)!.set(chuoi(x.qid), chuoi(x.nhan))
  }
  const trangThai = new Map((rEm.results ?? []).map((x) => [chuoi(x.sbd), x]))
  const dung = (lam: Record<string, string>, q: string): boolean => {
    const v = lam[q]
    return !!v && khoa.has(q) && isAnswerCorrect(v, khoa.get(q)!, phanTuQid(q))
  }
  const theoEm = new Map<string, ThongKeCaNhanEm>()
  for (const x of dsEm) {
    const sbd = chuoi(x.sbd)
    const t = trangThai.get(sbd)
    const daChot = !!t?.chot_luc
    const lam = docLam(x.dap_an_json)
    const nhan = nhanCuaEm.get(sbd)
    const soDungLoi = daChot ? [...loi].filter((q) => dung(lam, q)).length : 0
    const daNop = !!x.nop_luc
    theoEm.set(sbd, {
      soCauCuaEm: daChot ? soHoac(t!.so_cau_em) : null,
      soChang: daChot ? soHoac(t!.so_chang) : null,
      loDaXong: soHoac(t?.lo_da_xong),
      soDungLoi,
      soCauLoi: daChot ? loi.size : 0,
      diemLoi: daChot && daNop && loi.size > 0 ? Math.round((soDungLoi / loi.size) * 1000) / 100 : null,
      soCauThuongSai: daChot && daNop && nhan ? [...nhan].filter(([q, n]) => laCauThuong(n) && !dung(lam, q)).length : 0,
    })
  }
  return { soLoi: loi.size, loi, theoEm }
}

/** `dap_an_json` chỉ gồm các câu LÕI — để `phanTichGianLanBtvn` so chép bài trên mẫu chung (lõi < 6 câu chung ⇒ tự không đủ mẫu, không gắn cờ). */
export function chiGiuCauLoi(dapAnJson: unknown, loi: Set<string>): string | null {
  if (typeof dapAnJson !== 'string') return null
  try {
    const o = JSON.parse(dapAnJson) as unknown
    if (!o || typeof o !== 'object' || Array.isArray(o)) return dapAnJson
    return JSON.stringify(Object.fromEntries(Object.entries(o as Hang).filter(([q]) => loi.has(q))))
  } catch {
    return dapAnJson
  }
}

/** `/btvn/bai-lam` của bài `ca_nhan`: chỉ câu CỦA EM (kèm đáp án — đây là màn của thầy), chấm theo mẫu, kèm chặng và nhãn. */
export async function baiLamCaNhan(env: Env, em: Hang): Promise<Hang> {
  const maBtvn = chuoi(em.ma_btvn)
  const sbd = chuoi(em.sbd)
  const bo = await docBoDaChot(env, maBtvn, sbd)
  if (!bo) return { ok: false, error: 'Em chưa mở bài nên chưa có bộ câu riêng.' }
  try {
    const tho = await homeworkQuestions(env, chuoi(em.ma_de))
    const theoQid = new Map(tho.map((c) => [chuoi(c.qid), c]))
    const cau = bo.chang.flat().filter((q) => theoQid.has(q)).map((q) => theoQid.get(q)!)
    const graded = gradeHomework(homeworkKeys(cau), docLam(em.dap_an_json), chuoi(em.ma_de))
    const thuongSai = graded.qidSai.filter((q) => laCauThuong(bo.nhan[q]))
    return {
      ok: true, hoTen: em.ho_ten, sbd: em.sbd, nopLuc: em.nop_luc, ...graded, soCau: graded.soCau - thuongSai.length, soCauCuaEm: graded.soCau, soCauThuongSai: thuongSai.length,
      caNhan: true, chang: bo.chang, nhan: bo.nhan, de: { ma_de: em.ma_de, cau },
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Chưa mở được bài.' }
  }
}

// ================================================================== THẦY CHO LÀM LẠI (bài cá nhân hoá) ==================================================================

/**
 * `POST /btvn/cho-lam-lai {maBtvn, sbd}` (thầy). Bài cá nhân hoá KHÔNG tự cho làm lại; thầy bấm nút cho MỘT em ĐÃ NỘP, còn hạn.
 * Chép kết quả hiện tại vào `btvn_em_lich_su`, `so_lan_lam + 1`, xoá nộp/đáp án/điểm, `lo_da_xong = 0`; GIỮ bộ câu đã chốt (`btvn_em_cau`, `chot_luc`) và hạn nộp.
 * Sổ lượt mới ghi với `lan` mới (`LAN_MOI_LUOT`); EXP dùng khoá idempotent sẵn có nên không cộng đôi trong cùng ngày. Ra `{ok, soLanLam}`.
 */
export async function choLamLaiCaNhan(env: Env, b: Hang, now: number): Promise<Hang> {
  const maBtvn = chuoi(b.maBtvn).trim()
  const sbd = chuoi(b.sbd).trim()
  if (!maBtvn || !sbd) return { ok: false, error: 'Thiếu mã bài hoặc số báo danh.' }
  const bt = await env.DB.prepare('SELECT * FROM btvn WHERE ma_btvn = ? AND da_xoa = 0').bind(maBtvn).first<Hang>()
  if (!bt) return { ok: false, error: 'Bài không còn được giao.' }
  if (!laBaiCaNhan(bt)) return { ok: false, lyDo: 'khong_ca_nhan', error: 'Bài này không cá nhân hoá — bài thường dùng nút làm lại có sẵn.' }
  const hanMs = Date.parse(chuoi(bt.han_nop))
  if (Number.isFinite(hanMs) && hanMs <= now) return { ok: false, lyDo: 'qua_han', error: 'Bài đã quá hạn nộp. Thầy gia hạn nộp trước rồi cho em làm lại.' }
  const khoa = `${maBtvn}|${sbd}`
  const em = await env.DB.prepare('SELECT * FROM btvn_em WHERE khoa = ?').bind(khoa).first<Hang>()
  if (!em || em.thu_hoi) return { ok: false, error: 'Học sinh không có trong lượt giao này.' }
  if (!em.nop_luc) return { ok: false, lyDo: 'chua_nop', error: 'Em chưa nộp bài nên chưa cần cho làm lại.' }
  const soLanLam = Math.max(1, soHoac(em.so_lan_lam, 1)) + 1
  // MỘT batch: bản chép lịch sử CHỈ ghi khi dòng còn đúng bản đã đọc (bấm đúp/hai máy thầy: bên sau không ghi thêm gì).
  const kq = await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO btvn_em_lich_su (id, khoa, luu_luc, hanh_dong, du_lieu)
       SELECT ?, ?, ?, 'cho-lam-lai', ? WHERE EXISTS (SELECT 1 FROM btvn_em WHERE khoa = ? AND thu_hoi = 0 AND nop_luc = ?)`,
    ).bind(crypto.randomUUID(), khoa, new Date(now).toISOString(), json(em), khoa, chuoi(em.nop_luc)),
    env.DB.prepare(
      `UPDATE btvn_em SET nop_luc = NULL, so_dung = NULL, so_cau = NULL, dap_an_json = NULL, so_lan_lam = ?, xong_vong1_luc = NULL, lo_da_xong = 0
        WHERE khoa = ? AND thu_hoi = 0 AND nop_luc = ?`,
    ).bind(soLanLam, khoa, chuoi(em.nop_luc)),
  ])
  if (!Number((kq[1] as { meta?: { changes?: number } })?.meta?.changes ?? 0)) return { ok: false, lyDo: 'da_thay_doi', error: 'Bài của em vừa được cập nhật ở nơi khác. Thầy tải lại rồi thử lại.' }
  return { ok: true, soLanLam }
}

// ================================================================== BỘ NÃO A.I: thích nghi các chặng CHƯA MỞ ==================================================================

/**
 * Sau chặng `chiSo` (đã xong): gọi `thichNghiChangSau` của lõi với điều chỉnh CÒN HẠN của em và LƯU bộ mới. Trả số thay đổi đã lưu.
 * BẤT BIẾN kiểm lại ở đây trước khi ghi (lõi cũng khoá bằng test — kiểm thêm để một lỗi lõi không bao giờ chạm tới em): số chặng không đổi (⇒ mốc mở + HẠN NỘP không đổi), chặng ĐÃ MỞ
 * không đổi một câu, lõi và thử thách còn nguyên, mọi chặng còn lõi chưa làm. Vi phạm ⇒ bỏ cả thay đổi (ghi log), em giữ bộ cũ.
 */
export async function thichNghiSauChang(env: Env, bt: Hang, em: Hang, sbd: string, chiSo: number, loDaXongMoi: number, dung: Record<string, boolean>, dc: DieuChinhHieuLuc, now: number): Promise<number> {
  const maBtvn = chuoi(bt.ma_btvn)
  const khoa = `${maBtvn}|${sbd}`
  const [bai, da] = await Promise.all([docBaiNangDo(env, maBtvn), docBoDaChot(env, maBtvn, sbd)])
  const tomTat = docTomTat(em.tom_tat_json)
  if (!bai || !da || !tomTat || !em.chot_luc) return 0
  const viTri = new Map(bai.cau.map((c, i) => [c.qid, i]))
  const theoDe = (ds: string[]) => [...ds].sort((a, b) => (viTri.get(a) ?? 0) - (viTri.get(b) ?? 0))
  const tatCa = da.chang.flat()
  const loiSet = new Set(bai.loi)
  const bo: BoCuaEm = {
    loi: theoDe(tatCa.filter((q) => loiSet.has(q))),
    rieng: theoDe(tatCa.filter((q) => !loiSet.has(q) && da.nhan[q] !== 'thu_thach')),
    thuThach: theoDe(tatCa.filter((q) => da.nhan[q] === 'thu_thach')),
    chang: da.chang,
    nhan: da.nhan,
    tomTat,
  }
  const soChangDaMo = trangThaiCacChang(da.chang, chuoi(em.chot_luc), loDaXongMoi, false, now).chang.filter((c) => c.daMo).length
  const hoSo = (await docHoSoRut(env, [sbd], bai.cau, now)).get(sbd)!.hoSo
  const kq = thichNghiChangSau(bo, bai.cau, hoSo, chiSo, { dung }, { soChangDaMo, dieuChinh: dc.dieuChinh })
  if (kq.doi.length === 0) return 0
  const moi = kq.bo
  const giuNguyen =
    moi.chang.length === da.chang.length &&
    da.chang.every((qs, c) => c >= Math.max(chiSo + 1, soChangDaMo) || JSON.stringify(qs) === JSON.stringify(moi.chang[c])) &&
    bo.loi.every((q) => moi.chang.flat().includes(q)) &&
    bo.thuThach.every((q) => moi.chang.flat().includes(q))
  if (!giuNguyen) {
    console.error('[btvn-nang-do] thích nghi vi phạm bất biến — bỏ thay đổi, em giữ bộ cũ', maBtvn, sbd)
    return 0
  }
  let thuTu = 0
  const hang = moi.chang.flatMap((qs, c) => qs.map((q) => ({ q, c, n: moi.nhan[q], t: thuTu++ })))
  await env.DB.batch([
    env.DB.prepare('DELETE FROM btvn_em_cau WHERE ma_btvn = ? AND sbd = ? AND EXISTS (SELECT 1 FROM btvn_em WHERE khoa = ? AND nop_luc IS NULL)').bind(maBtvn, sbd, khoa),
    env.DB.prepare(
      `INSERT OR IGNORE INTO btvn_em_cau (khoa, ma_btvn, sbd, qid, chang, nhan, thu_tu)
       SELECT ? || '|' || json_extract(j.value,'$.q'), ?, ?, json_extract(j.value,'$.q'), json_extract(j.value,'$.c'), json_extract(j.value,'$.n'), json_extract(j.value,'$.t')
         FROM json_each(?) j WHERE EXISTS (SELECT 1 FROM btvn_em WHERE khoa = ? AND nop_luc IS NULL)`,
    ).bind(khoa, maBtvn, sbd, json(hang), khoa),
    env.DB.prepare('UPDATE btvn_em SET so_cau_em = ?, tom_tat_json = ? WHERE khoa = ? AND nop_luc IS NULL').bind(hang.length, json(moi.tomTat), khoa),
  ])
  return kq.doi.length
}
