// BÀI HẰNG NGÀY + HỒ SƠ THÁI ĐỘ LÀM BÀI (thầy 12/10; mốc tính từ 01/10 — `NGAY_BAT_DAU_BAI_HANG_NGAY`). Hợp đồng ĐÃ CHỐT + luật mức / đã làm / ngưỡng: `bai-hang-ngay-kieu.ts` (đọc trước).
//
// `POST /gv/bai-hang-ngay {tu?, den?, khoi?, lop?}` — LỆNH THẦY, CHỈ ĐỌC (sau cổng `laThay`, chạy trên `envDoc`). Không ghi, không DDL.
//   · Em: mọi em của các Hành trình khối đang chạy (`chien_dich` id `hanh-trinh-v3-khoi-*`) ∪ em có Gói bài 7 ngày (khi cờ bật); bỏ tài khoản thử
//     12121212 và em bị khoá. Không đọc được bảng Hành trình ⇒ lùi về danh sách lớp (cảnh báo nói thật).
//   · Gom em theo LÔ 100 SBD (một tham số JSON, `json_each`) — mỗi lô ≤ 8 truy vấn (12/10 thêm 2: mức chốt + lịch câu mới Gói 7), mọi truy vấn sổ lọc `sbd IN (…) AND ngay_vn BETWEEN …`
//     ⇒ đi chỉ mục `idx_skh_em_ngay (sbd, ngay_vn)`; số đếm Gói 7 GOM SẴN trong SQL (COUNT DISTINCT theo em × ngày) ⇒ ~300 em × 14 ngày trả ≤ 4200 dòng.
//     Mỗi lô chỉ đọc phần ngày cần cho từng chế độ: sổ Gói 7 từ ngày gói sớm nhất của lô, kế hoạch Hành trình tới trước ngày gói muộn nhất của lô
//     (em chưa có gói ⇒ tới `den`) — khoảng từ 01/10 dài hơn nhưng không đọc thừa những ngày chế độ kia không dùng.
//   · Mỗi ngày: `mucToiThieu` (thật `da-chot` / ước tính theo quy tắc hiện hành — Gói 7: `goi_bai_7_muc_ngay` / `uoc-goi7`, xem `mucCuaNgay`), `daLam`, `thieu`, `datMuc`. Hôm nay chưa hết ngày ⇒ không tính vào
//     tổng. Xếp em: số ngày thiếu ↓ → tổng câu thiếu ↓ → (hoà) câu còn thiếu hôm nay ↓ → tên.
// `POST /gv/ho-so-thai-do {sbd, tu?, den?}` — LỆNH THẦY, CHỈ ĐỌC. Lịch hoạt động + số đếm + 6 tín hiệu có số và ngưỡng + kết luận theo luật
//   `LUAT_KET_LUAN` + danh sách Câu đúng / Câu đã ôn (Câu sai và Toàn bộ lịch sử vẫn ở `/gv/lich-su-lam-cau`).
//   · Sổ một em (lọc `sbd`, tối đa `TOI_DA_LUOT_HO_SO` = 10 000 lượt gần nhất), bỏ sự kiện còn giấu. "Lượt làm" = như kế hoạch đếm (`SQL_LA_LAN_LAM`: bỏ đọc lời giải, lướt,
//     chẩn đoán, gỡ bước); dòng "đọc lời giải" chỉ dùng cho tín hiệu (d).
//   · Số giây (không bịa, như `/gv/lich-su-lam-cau`): cột `giay` ⇒ `raw_json.ms` ⇒ ca thi `chi_tiet_cau.giay` ⇒ game ước tính từ mốc trả lời ⇒ null.
//   · 12/10F: lõi `hoSoThaiDoCuaEm` dùng chung cho lệnh EM `/hs/ho-so-thai-do` (ho-so-em-hs.ts — SBD từ token, khoảng mặc định, thêm bỏ lượt ca chưa công bố).
import type { Env } from './kieu'
import type {
  CauTomTat, CheDoNgay, DemThaiDo, EmBaiHangNgay, KetLuanThaiDo, LopBaiHangNgay, NgayBaiEm, NgayHoatDong, NguonMuc, NhomGiay,
  TinHieuThaiDo, TraLoiBaiHangNgay, TraLoiHoSoThaiDo,
} from './bai-hang-ngay-kieu'
import { NGAY_BAT_DAU_BAI_HANG_NGAY, NGUONG_THAI_DO as NG, TEN_NHAN_THAI_DO, TOI_DA_SO_NGAY_BAI_HANG_NGAY } from './bai-hang-ngay-kieu'
import { CAU_TOI_THIEU } from './hanh-trinh-ngay'
import { SQL_LUOT_GOI7, sqlTenLopHs } from './goi-bai-7'
import { mucNgayGoi7 } from './goi-bai-7-loi'
import { SQL_TC } from './lam-lai-so'
import { idDaLam } from './hanh-trinh-nguon-cau'
import { tachSongSinh } from './loi-hoc-luat'
import { tenLopCuaEm } from './ten-lop'
import { SBD_THU } from './gv-bang-tin'
import { chiTietCauCuaLuot, giayDoCuaLuot, giayUocTinhGame } from './ai-sai-cau'
import { chonTuGiaTri, chuanMucDo, sqlLuotCaDaCongBo, tieuDeCau, type NguoiDocSo } from './lich-su-lam-cau'
import { docCauKho, tenCuaDang } from './omni-d1'
import { chuoiDuGanNhat, laLuoiTheoTiLe, tomTatNhip } from './nhip-hoc-luat'

type Row = Record<string, unknown>
type Tang = 1 | 2 | 3 | 4
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x)).trim()

/** Số SBD mỗi lô truy vấn. */
export const LO_EM_BAI_HANG_NGAY = 100
/** Số lượt gần nhất đọc cho hồ sơ một em. Thầy 12/10 dời mốc về 01/10 ⇒ khoảng xem dài dần (tới 62 ngày × ~50 lượt/ngày, em chăm hơn
 *  gấp mấy lần) ⇒ nâng gấp đôi mức cũ 5000 để mọi lượt TRONG khoảng xem đều được đọc; vẫn cắt ⇒ `catBot` + cảnh báo nói rõ. */
export const TOI_DA_LUOT_HO_SO = 10_000
export const TOI_DA_CAU_DANH_SACH = 500

async function hoi(env: Env, sql: string, ...bind: unknown[]): Promise<Row[] | null> {
  try {
    return (await env.DB.prepare(sql).bind(...bind).all<Row>()).results ?? []
  } catch {
    return null
  }
}

// ------------------------------------------------------------------ NGÀY (giờ Việt Nam)
const NGAY_RE = /^\d{4}-\d{2}-\d{2}$/
export const ngayVnCua = (ms: number): string => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
export const congNgayBhn = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
/** "01/10" từ "2026-10-01" (đúng cách ghi ngày của app thầy). */
const ngayNganBhn = (ngay: string): string => `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`
const laNgayThat = (s: string): boolean => NGAY_RE.test(s) && Number.isFinite(Date.parse(`${s}T00:00:00Z`)) && congNgayBhn(s, 0) === s
/** Các ngày `tu` … `den` (gồm hai đầu). */
export function cacNgay(tu: string, den: string): string[] {
  const ra: string[] = []
  for (let d = tu; d <= den && ra.length <= 400; d = congNgayBhn(d, 1)) ra.push(d)
  return ra
}

/** Khoảng ngày của một lệnh: `tu` mặc định `NGAY_BAT_DAU_BAI_HANG_NGAY` (01/10), `den` mặc định (và tối đa) hôm nay; quá `TOI_DA_SO_NGAY` ⇒ cắt bớt đầu, kèm cảnh báo. */
export function khoangNgay(b: Row, nowMs: number): { tu: string; den: string; homNay: string; canhBao: string[] } | { error: string } {
  const homNay = ngayVnCua(nowMs)
  const canhBao: string[] = []
  const tuVao = str(b.tu)
  const denVao = str(b.den)
  if (tuVao && !laNgayThat(tuVao)) return { error: 'Ngày bắt đầu phải có dạng YYYY-MM-DD.' }
  if (denVao && !laNgayThat(denVao)) return { error: 'Ngày kết thúc phải có dạng YYYY-MM-DD.' }
  let den = denVao || homNay
  if (den > homNay) den = homNay
  let tu = tuVao || NGAY_BAT_DAU_BAI_HANG_NGAY
  if (tu > den) {
    if (tuVao) return { error: 'Ngày bắt đầu đang sau ngày kết thúc.' }
    tu = den
  }
  if (cacNgay(tu, den).length > TOI_DA_SO_NGAY_BAI_HANG_NGAY) {
    tu = congNgayBhn(den, -(TOI_DA_SO_NGAY_BAI_HANG_NGAY - 1))
    canhBao.push(`Mỗi lần xem tối đa ${TOI_DA_SO_NGAY_BAI_HANG_NGAY} ngày — đang hiện từ ${tu} đến ${den}.`)
  }
  return { tu, den, homNay, canhBao }
}

// ------------------------------------------------------------------ MỨC + ĐÃ LÀM (phép thuần — test gọi thẳng)
const tangHopLe = (v: unknown): Tang => {
  const t = Math.floor(Number(v))
  return t >= 1 && t <= 4 ? (t as Tang) : 1
}
/** Dòng `hanh_trinh_v3_ngay` đã đọc của một em. */
export interface ChotNgay { ngay: string; tang: Tang; toiThieu: number }

/** Gói 7 của một em, một ngày: dòng chốt `goi_bai_7_muc_ngay` (nếu có) + Σ `goi_bai_7_ngay.quota` ngày ấy (để ước tính ngày chưa chốt). */
export interface Goi7Ngay { chot?: { tang: Tang; muc: number } | null; quota?: number }

/**
 * MỨC CỦA MỘT NGÀY — HÀM DUY NHẤT mọi màn thầy / phụ huynh / Nhịp học đọc (`docNgayCacEm` ⇒ `/gv/bai-hang-ngay`, `/gv/ho-so-thai-do`, `/gv/nhip-hoc`,
 * `/hs/nhip-hoc`, `/ph/con-tong-quan`). App học sinh đọc cùng số chốt qua `chotMucNgay7` (goi-bai-7.ts) / `hanh_trinh_v3_ngay` (Hành trình).
 *   · Hành trình + có dòng chốt đúng ngày ⇒ số thật. Ngày em không mở kế hoạch ⇒ QUY TẮC HIỆN HÀNH `CAU_TOI_THIEU[tầng]` với tầng gần nhất đã ghi
 *     (ngày gần nhất ≤ ngày ấy, không có thì ngày sớm nhất sau), chưa ghi ⇒ tầng 1.
 *   · Gói 7 (thầy 12/10 "một con số"): có dòng chốt `goi_bai_7_muc_ngay` ⇒ đúng M em thấy (`da-chot`). Chưa có (ngày trước khi có bảng / em chưa mở
 *     bài ngày ấy) ⇒ ƯỚC TÍNH M = `mucNgayGoi7(CAU_TOI_THIEU[1], Σ quota ngày ấy)`, tầng 1, `uoc-goi7` — tầng tính trên phạm vi câu của bài mới nên
 *     những ngày đầu bài gần như chắc là tầng 1; KHÔNG dùng tầng Hành trình (lỗi cũ: 36 câu trong khi em được giao 24).
 * `chot` đã sắp theo ngày tăng dần.
 */
export function mucCuaNgay(ngay: string, cheDo: CheDoNgay, chot: readonly ChotNgay[], goi7?: Goi7Ngay): { muc: number; tang: Tang; nguon: NguonMuc; uoc: boolean } {
  if (cheDo === 'goi7') {
    const c = goi7?.chot
    if (c && c.muc > 0) return { muc: c.muc, tang: c.tang, nguon: 'da-chot', uoc: false }
    return { muc: mucNgayGoi7(CAU_TOI_THIEU[1], goi7?.quota ?? 0), tang: 1, nguon: 'uoc-goi7', uoc: true }
  }
  const dung = chot.find((c) => c.ngay === ngay)
  if (dung && dung.toiThieu > 0) return { muc: dung.toiThieu, tang: dung.tang, nguon: 'da-chot', uoc: false }
  let gan: ChotNgay | undefined
  for (const c of chot) if (c.ngay <= ngay) gan = c
  gan ??= chot.find((c) => c.ngay > ngay)
  if (!gan) return { muc: CAU_TOI_THIEU[1], tang: 1, nguon: 'mac-dinh', uoc: true }
  return { muc: CAU_TOI_THIEU[gan.tang], tang: gan.tang, nguon: 'tang-gan-nhat', uoc: true }
}

const gocKeHoach = (q: string) => q.replace(/#\d+$/, '')
const mangChuoi = (v: unknown): string[] => {
  try {
    const a: unknown = JSON.parse(str(v) || '[]')
    return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}
/** Hành trình: số câu của kế hoạch ngày đã làm — đúng phép đếm `bangHanhTrinh` (`idDaLam` quy về câu gốc / bản bù của kế hoạch). */
export function daLamKeHoach(keHoach: { dao: readonly string[]; doan: readonly string[] } | undefined, luot: readonly { qid: unknown; tc?: unknown }[]): number {
  if (!keHoach) return 0
  const qs = [...keHoach.dao, ...keHoach.doan].map(gocKeHoach)
  const tap = new Set(qs)
  const xong = new Set(luot.map((r) => idDaLam(r, tap)))
  return qs.filter((q) => xong.has(q)).length
}

/** Tóm tắt dãy ngày của một em. Hôm nay CHƯA HẾT ngày ⇒ không tính là ngày thiếu (chỉ `thieuHomNay` để xếp khi hoà). Ngày thiếu nhiều nhất:
 *  hoà ⇒ ngày gần đây hơn. */
export function tomTatNgay(ngay: readonly NgayBaiEm[]): Omit<EmBaiHangNgay, 'sbd' | 'hoTen' | 'lop' | 'khoi' | 'ngay'> {
  const qua = ngay.filter((n) => !n.homNay)
  let lon: { ngay: string; thieu: number } | null = null
  for (const n of qua) if (n.thieu > 0 && (!lon || n.thieu >= lon.thieu)) lon = { ngay: n.ngay, thieu: n.thieu }
  return {
    soNgayThieu: qua.filter((n) => !n.datMuc).length,
    tongCauThieu: qua.reduce((t, n) => t + n.thieu, 0),
    ngayThieuNhieuNhat: lon,
    soNgayDu: ngay.filter((n) => n.datMuc).length,
    soNgayKhongLam: qua.filter((n) => n.daLam === 0).length,
    tongDaLam: ngay.reduce((t, n) => t + n.daLam, 0),
    thieuHomNay: ngay.find((n) => n.homNay)?.thieu ?? 0,
  }
}

/** Thứ tự thầy chốt: thiếu nhiều NGÀY nhất lên đầu → thiếu nhiều CÂU nhất → (hoà) còn thiếu nhiều câu hôm nay → tên. */
export function xepEmBaiHangNgay(a: EmBaiHangNgay, b: EmBaiHangNgay): number {
  return b.soNgayThieu - a.soNgayThieu || b.tongCauThieu - a.tongCauThieu || b.thieuHomNay - a.thieuHomNay || a.hoTen.localeCompare(b.hoTen, 'vi') || a.sbd.localeCompare(b.sbd)
}

// ------------------------------------------------------------------ ĐỌC SỔ THEO LÔ
/** Em của danh sách Bài hằng ngày (xuất cho `/gv/nhip-hoc` dùng chung — nhip-hoc.ts). */
export interface EmGoc { sbd: string; hoTen: string; lop: string; khoi: string; goi7Tu: string | null }

/** Lỗi đọc sổ chính — cả lệnh trả lỗi (không trả số sai). */
export class LoiDocSo extends Error {}

export const SQL_DEM_GOI7 = `SELECT sbd, ngay_vn AS ngay, COUNT(DISTINCT qid) AS n FROM su_kien_hoc
  WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay_vn BETWEEN ?2 AND ?3 AND ket_qua IS NOT NULL AND ${SQL_LUOT_GOI7}
  GROUP BY sbd, ngay_vn`
// Câu học có hướng dẫn (Gói 7) ngày ấy mà sổ chưa có ⇒ cộng thêm (lapGoi7 gộp hai tập mã câu).
const SQL_DEM_GAP = `SELECT g.sbd AS sbd, date(g.luc, '+7 hours') AS ngay, COUNT(DISTINCT g.qid) AS n FROM goi_bai_7_gap g
  WHERE g.sbd IN (SELECT value FROM json_each(?1)) AND date(g.luc, '+7 hours') BETWEEN ?2 AND ?3
    AND NOT EXISTS (SELECT 1 FROM su_kien_hoc WHERE su_kien_hoc.sbd = g.sbd AND su_kien_hoc.ngay_vn = date(g.luc, '+7 hours') AND su_kien_hoc.qid = g.qid
      AND su_kien_hoc.ket_qua IS NOT NULL AND ${SQL_LUOT_GOI7})
  GROUP BY g.sbd, date(g.luc, '+7 hours')`
/** Mức hôm nay đã chốt của ngày Gói 7 (`chotMucNgay7`) — đúng số em thấy trên app. */
const SQL_MUC_GOI7 = 'SELECT sbd, ngay, tang, muc FROM goi_bai_7_muc_ngay WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay BETWEEN ?2 AND ?3'
/** Σ lịch câu mới các gói của em mỗi ngày — chỉ dùng ƯỚC TÍNH ngày Gói 7 chưa có dòng chốt. */
const SQL_QUOTA_GOI7 = 'SELECT sbd, ngay, SUM(quota) AS q FROM goi_bai_7_ngay WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay BETWEEN ?2 AND ?3 GROUP BY sbd, ngay'
const SQL_KE_HOACH = 'SELECT sbd, ngay, dao_json, doan_json FROM srs2_ke_hoach WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay BETWEEN ?2 AND ?3'
export const SQL_LUOT_KE_HOACH = `SELECT sbd, ngay_vn AS ngay, qid, ${SQL_TC} AS tc FROM su_kien_hoc
  WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay_vn BETWEEN ?2 AND ?3 AND ket_qua IS NOT NULL AND ${SQL_LUOT_GOI7}
    AND EXISTS (SELECT 1 FROM srs2_ke_hoach k WHERE k.sbd = su_kien_hoc.sbd AND k.ngay = su_kien_hoc.ngay_vn)
  GROUP BY sbd, ngay_vn, qid, tc`
const SQL_CHOT_TRONG = 'SELECT sbd, ngay, tang, toi_thieu FROM hanh_trinh_v3_ngay WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay BETWEEN ?2 AND ?3'
const SQL_CHOT_TRUOC = 'SELECT sbd, MAX(ngay) AS ngay, tang, toi_thieu FROM hanh_trinh_v3_ngay WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay < ?2 GROUP BY sbd'

/**
 * Khoảng ngày một lô cần đọc cho từng chế độ (ngày `d` của em là Gói 7 khi `goi7Tu ≤ d`, còn lại Hành trình):
 *   · `tuGoi` = ngày gói sớm nhất của lô (không sớm hơn `tu`) — trước đó không em nào ở Gói 7;
 *   · `denHt` = ngày cuối còn ở Hành trình muộn nhất của lô (em chưa có gói ⇒ `den`; có gói ⇒ trước ngày gói một ngày; không muộn hơn `den`).
 * Lô không có em ở chế độ ấy ⇒ trả `den` / `tu` (bên gọi đã bỏ truy vấn). Chỉ thu hẹp phần đọc — số mỗi ngày không đổi.
 */
export function khoangDocTheoCheDo(lo: readonly Pick<EmGoc, 'goi7Tu'>[], tu: string, den: string): { tuGoi: string; denHt: string } {
  let tuGoi = den
  let denHt = tu
  for (const e of lo) {
    if (e.goi7Tu !== null && e.goi7Tu <= den) {
      const t = e.goi7Tu > tu ? e.goi7Tu : tu
      if (t < tuGoi) tuGoi = t
    }
    if (e.goi7Tu === null || e.goi7Tu > tu) {
      const d = e.goi7Tu === null || e.goi7Tu > den ? den : congNgayBhn(e.goi7Tu, -1)
      if (d > denHt) denHt = d
    }
  }
  return { tuGoi, denHt }
}

/** Dãy ngày (mức + đã làm) của các em, đọc theo lô. Ném `LoiDocSo` khi không đọc được sổ chính. */
export async function docNgayCacEm(env: Env, em: readonly EmGoc[], tu: string, den: string, homNay: string, canhBao: string[]): Promise<Map<string, NgayBaiEm[]>> {
  const ngay = cacNgay(tu, den)
  const ra = new Map<string, NgayBaiEm[]>()
  const baoMot = (chu: string) => { if (!canhBao.includes(chu)) canhBao.push(chu) }
  for (let i = 0; i < em.length; i += LO_EM_BAI_HANG_NGAY) {
    const lo = em.slice(i, i + LO_EM_BAI_HANG_NGAY)
    const goi = lo.filter((e) => e.goi7Tu !== null && e.goi7Tu <= den)
    const ht = lo.filter((e) => e.goi7Tu === null || e.goi7Tu > tu)
    const { tuGoi, denHt } = khoangDocTheoCheDo(lo, tu, den)
    const j = (ds: readonly EmGoc[]) => JSON.stringify(ds.map((e) => e.sbd))
    const rong = Promise.resolve([] as Row[])
    const [rTrong, rTruoc, rGoi, rGap, rKh, rLuot, rMuc7, rQuota7] = await Promise.all([
      hoi(env, SQL_CHOT_TRONG, j(lo), tu, den),
      hoi(env, SQL_CHOT_TRUOC, j(lo), tu),
      goi.length ? hoi(env, SQL_DEM_GOI7, j(goi), tuGoi, den) : rong,
      goi.length ? hoi(env, SQL_DEM_GAP, j(goi), tuGoi, den) : rong,
      ht.length ? hoi(env, SQL_KE_HOACH, j(ht), tu, denHt) : rong,
      ht.length ? hoi(env, SQL_LUOT_KE_HOACH, j(ht), tu, denHt) : rong,
      goi.length ? hoi(env, SQL_MUC_GOI7, j(goi), tuGoi, den) : rong,
      goi.length ? hoi(env, SQL_QUOTA_GOI7, j(goi), tuGoi, den) : rong,
    ])
    // Sổ chính hỏng ⇒ cả lệnh báo lỗi (không trả số sai). Bảng kế hoạch không đọc được ⇒ lượt kế hoạch cũng không đọc được: chỉ cảnh báo.
    if (rGoi === null || (rLuot === null && rKh !== null)) throw new LoiDocSo('Không đọc được sổ học của các em.')
    if (rTrong === null || rTruoc === null) baoMot('Chưa đọc được mức đã chốt theo ngày — mọi ô dùng mức ước tính theo quy tắc hiện hành.')
    if (rGap === null) baoMot('Chưa đọc được câu học có hướng dẫn của Gói bài 7 ngày — số đã làm chỉ tính câu trong sổ.')
    if (rKh === null) baoMot('Chưa đọc được kế hoạch Hành trình theo ngày — ngày Hành trình tính là chưa làm câu nào của kế hoạch.')
    if (rMuc7 === null || rQuota7 === null) baoMot('Chưa đọc được mức đã chốt của Gói bài 7 ngày — ô Gói 7 dùng mức ước tính (24 câu hoặc lịch câu mới của ngày nếu nhiều hơn).')
    const chot = new Map<string, ChotNgay[]>()
    for (const x of [...(rTruoc ?? []), ...(rTrong ?? [])]) {
      const s = str(x.sbd)
      if (!str(x.ngay)) continue
      ;(chot.get(s) ?? chot.set(s, []).get(s)!).push({ ngay: str(x.ngay), tang: tangHopLe(x.tang), toiThieu: Math.max(0, Math.floor(Number(x.toi_thieu) || 0)) })
    }
    for (const ds of chot.values()) ds.sort((a, b) => a.ngay.localeCompare(b.ngay))
    const k = (s: unknown, d: unknown) => `${str(s)}|${str(d)}`
    const demGoi = new Map((rGoi ?? []).map((x) => [k(x.sbd, x.ngay), Number(x.n) || 0]))
    const demGap = new Map((rGap ?? []).map((x) => [k(x.sbd, x.ngay), Number(x.n) || 0]))
    const keHoach = new Map((rKh ?? []).map((x) => [k(x.sbd, x.ngay), { dao: mangChuoi(x.dao_json), doan: mangChuoi(x.doan_json) }]))
    const muc7 = new Map((rMuc7 ?? []).map((x) => [k(x.sbd, x.ngay), { tang: tangHopLe(x.tang), muc: Math.max(0, Math.floor(Number(x.muc) || 0)) }]))
    const quota7 = new Map((rQuota7 ?? []).map((x) => [k(x.sbd, x.ngay), Math.max(0, Math.floor(Number(x.q) || 0))]))
    const luot = new Map<string, { qid: unknown; tc: unknown }[]>()
    for (const x of rLuot ?? []) (luot.get(k(x.sbd, x.ngay)) ?? luot.set(k(x.sbd, x.ngay), []).get(k(x.sbd, x.ngay))!).push({ qid: x.qid, tc: x.tc })
    for (const e of lo) {
      const c = chot.get(e.sbd) ?? []
      ra.set(e.sbd, ngay.map((d) => {
        const cheDo: CheDoNgay = e.goi7Tu !== null && e.goi7Tu <= d ? 'goi7' : 'hanh-trinh'
        const m = mucCuaNgay(d, cheDo, c, cheDo === 'goi7' ? { chot: muc7.get(k(e.sbd, d)) ?? null, quota: quota7.get(k(e.sbd, d)) ?? 0 } : undefined)
        const daLam = cheDo === 'goi7' ? (demGoi.get(k(e.sbd, d)) ?? 0) + (demGap.get(k(e.sbd, d)) ?? 0) : daLamKeHoach(keHoach.get(k(e.sbd, d)), luot.get(k(e.sbd, d)) ?? [])
        return { ngay: d, mucToiThieu: m.muc, daLam, thieu: Math.max(0, m.muc - daLam), datMuc: daLam >= m.muc, mucUocTinh: m.uoc, nguonMuc: m.nguon, tang: m.tang, cheDo, homNay: d === homNay }
      }))
    }
  }
  return ra
}

/**
 * Dãy ngày (mức + đã làm) của MỘT em — ĐÚNG phép tính bảng "Bài hằng ngày" của thầy. App phụ huynh (`/ph/con-tong-quan`) dùng chung hàm này để
 * phụ huynh và thầy luôn thấy cùng một số "đã làm / mức" mỗi ngày. Đọc thiếu bất kỳ bảng nào (có cảnh báo) hoặc lỗi ⇒ null (bên gọi giữ cách tính riêng).
 */
export async function ngayBaiCuaMotEm(env: Env, sbd: string, tu: string, den: string, homNay: string): Promise<NgayBaiEm[] | null> {
  const goi7 = await docGoi7Em(env, sbd)
  if (!goi7) return null
  const canhBao: string[] = []
  try {
    const ra = await docNgayCacEm(env, [{ sbd, hoTen: sbd, lop: '', khoi: '', goi7Tu: goi7.get(sbd) ?? null }], tu, den, homNay, canhBao)
    return canhBao.length ? null : (ra.get(sbd) ?? null)
  } catch {
    return null
  }
}

// ------------------------------------------------------------------ DANH SÁCH EM
const khoiTuChu = (v: unknown): string => /(1[012])/.exec(str(v))?.[1] ?? ''

async function docCoGoi7(env: Env): Promise<boolean> {
  const r = await hoi(env, "SELECT gia_tri FROM cau_hinh WHERE khoa = 'goi_bai_7_v1'")
  try {
    return (JSON.parse(str(r?.[0]?.gia_tri)) as { bat?: unknown }).bat === true
  } catch {
    return false
  }
}
// Đúng điều kiện `docGoiCuaEm7`: so lớp gói (TÊN LỚP) với TÊN LỚP hiệu lực của em (`sqlTenLopHs`) — trước 12/10 so `h.lop` (KHỐI) nên em khối 12 lớp
// "12 - Lớp Thường" bị tính theo Hành trình phía thầy trong khi máy em đang ở Gói 7.
const SQL_GOI7_EM = `SELECT e.sbd AS sbd, MIN(e.bat_dau) AS bat_dau FROM goi_bai_7_em e JOIN goi_bai_7 g ON g.id = e.goi_id
  JOIN hoc_sinh h ON h.sbd = e.sbd AND ${sqlTenLopHs('h')} = g.lop JOIN bai_da_day b ON b.id = g.tick_id AND b.bo_tick_luc IS NULL`
/** sbd → ngày bắt đầu Gói 7 sớm nhất (đúng điều kiện `docGoiCuaEm7`). Cờ tắt ⇒ rỗng. Lỗi đọc ⇒ null. */
async function docGoi7Em(env: Env, sbd?: string): Promise<Map<string, string> | null> {
  if (!(await docCoGoi7(env))) return new Map()
  const r = sbd ? await hoi(env, `${SQL_GOI7_EM} WHERE e.sbd = ? GROUP BY e.sbd`, sbd) : await hoi(env, `${SQL_GOI7_EM} GROUP BY e.sbd`)
  if (!r) return null
  return new Map(r.filter((x) => NGAY_RE.test(str(x.bat_dau))).map((x) => [str(x.sbd), str(x.bat_dau)]))
}

async function docHoSoLop(env: Env): Promise<{ hs: Row[]; ds: Row[] } | null> {
  const [hsCo, ds] = await Promise.all([hoi(env, 'SELECT sbd, ho_ten, lop, ten_lop, trang_thai FROM hoc_sinh'), hoi(env, 'SELECT sbd, ho_ten, lop FROM danh_sach')])
  const hs = hsCo ?? (await hoi(env, 'SELECT sbd, ho_ten, lop, NULL AS ten_lop, trang_thai FROM hoc_sinh'))
  if (!hs && !ds) return null
  return { hs: hs ?? [], ds: ds ?? [] }
}

export async function docDanhSachEm(env: Env, canhBao: string[]): Promise<EmGoc[] | null> {
  const [lop, cd, goi7] = await Promise.all([
    docHoSoLop(env),
    hoi(env, "SELECT id, sbd_json FROM chien_dich WHERE trang_thai = 'dang_chay' AND id LIKE 'hanh-trinh-v3-khoi-%'"),
    docGoi7Em(env),
  ])
  if (!lop) return null
  if (!goi7) canhBao.push('Chưa đọc được Gói bài 7 ngày — các em tính theo kế hoạch Hành trình.')
  const hsTheo = new Map(lop.hs.map((x) => [str(x.sbd), x]))
  const dsTheo = new Map(lop.ds.map((x) => [str(x.sbd), x]))
  const khoiHt = new Map<string, string>()
  if (cd) {
    for (const r of cd) for (const s of mangChuoi(r.sbd_json)) if (!khoiHt.has(s)) khoiHt.set(s, khoiTuChu(/khoi-(1[012])$/.exec(str(r.id))?.[1]))
  } else canhBao.push('Chưa đọc được danh sách Hành trình — đang hiện mọi em trong danh sách lớp.')
  const sbd = cd ? new Set([...khoiHt.keys(), ...(goi7?.keys() ?? [])]) : new Set([...dsTheo.keys(), ...hsTheo.keys()])
  const ra: EmGoc[] = []
  for (const s of sbd) {
    if (!s || s === SBD_THU) continue
    const h = hsTheo.get(s), d = dsTheo.get(s)
    if (str(h?.trang_thai) === 'khoa' || (!h && !d)) continue
    ra.push({
      sbd: s,
      hoTen: str(d?.ho_ten) || str(h?.ho_ten) || s,
      lop: tenLopCuaEm(str(h?.lop) || str(d?.lop), h?.ten_lop),
      khoi: khoiHt.get(s) || khoiTuChu(h?.lop) || khoiTuChu(d?.lop),
      goi7Tu: goi7?.get(s) ?? null,
    })
  }
  return ra
}

/** `POST /gv/bai-hang-ngay` — xem đầu tệp. */
export async function gvBaiHangNgay(env: Env, b: Row, nowMs = Date.now()): Promise<TraLoiBaiHangNgay> {
  const kh = khoangNgay(b, nowMs)
  if ('error' in kh) return { ok: false, error: kh.error }
  const { tu, den, homNay, canhBao } = kh
  const tatCa = await docDanhSachEm(env, canhBao)
  if (!tatCa) return { ok: false, error: 'Không đọc được danh sách học sinh.' }
  const dem = new Map<string, LopBaiHangNgay>()
  for (const e of tatCa) {
    const l = dem.get(e.lop) ?? { tenLop: e.lop, khoi: e.khoi, soEm: 0 }
    l.soEm++
    dem.set(e.lop, l)
  }
  const lop = [...dem.values()].sort((a, c) => c.khoi.localeCompare(a.khoi) || a.tenLop.localeCompare(c.tenLop, 'vi'))
  const khoi = khoiTuChu(b.khoi)
  const tenLop = str(b.lop)
  const chon = tatCa.filter((e) => (!khoi || e.khoi === khoi) && (!tenLop || e.lop === tenLop))
  let ngayEm: Map<string, NgayBaiEm[]>
  try {
    ngayEm = await docNgayCacEm(env, chon, tu, den, homNay, canhBao)
  } catch (e) {
    return { ok: false, error: e instanceof LoiDocSo ? e.message : 'Không đọc được sổ học của các em.' }
  }
  const em: EmBaiHangNgay[] = chon.map((e) => {
    const ngay = ngayEm.get(e.sbd) ?? []
    return { sbd: e.sbd, hoTen: e.hoTen, lop: e.lop, khoi: e.khoi, ngay, ...tomTatNgay(ngay) }
  })
  em.sort(xepEmBaiHangNgay)
  const o = em.flatMap((e) => e.ngay)
  return { ok: true, tu, den, homNay, ngay: cacNgay(tu, den), em, lop, soOUocTinh: o.filter((x) => x.mucUocTinh).length, soO: o.length, canhBao }
}

// ------------------------------------------------------------------ HỒ SƠ THÁI ĐỘ (phép thuần — test gọi thẳng)

/** Một lượt làm câu trong khoảng xem (đã quy câu gốc, đã có số giây / đáp án chọn). */
export interface LuotThaiDo {
  luc: string
  ngay: string
  goc: string
  dung: boolean | null
  giay: number | null
  /** 'tu-tinh' = Phần III (trả lời ngắn) · 'trac-nghiem' = còn lại. */
  loai: 'trac-nghiem' | 'tu-tinh'
  chon: string | null
}

const phanTram = (tu: number, mau: number): number | null => (mau > 0 ? Math.round((100 * tu) / mau) : null)
const giayNhanh = (l: Pick<LuotThaiDo, 'loai'>): number => (l.loai === 'tu-tinh' ? NG.giayNhanhTuTinh : NG.giayNhanhTracNghiem)
const laNhanh = (l: LuotThaiDo): boolean => l.giay !== null && l.giay < giayNhanh(l)
/** Giờ Việt Nam (0–23) của một mốc ISO; hỏng ⇒ null. */
export const gioVn = (iso: string): number | null => {
  const t = Date.parse(iso)
  return Number.isFinite(t) ? new Date(t + 7 * 3_600_000).getUTCHours() : null
}
const laKhuya = (iso: string): boolean => {
  const g = gioVn(iso)
  return g !== null && (g >= NG.gioKhuyaTu || g < NG.gioKhuyaDen)
}

/** Chuỗi chọn lặp: lượt trắc nghiệm có MỘT chữ A–D, sắp theo thời gian, cùng ngày, liên tiếp cùng chữ dài ≥ `NG.chuoiLap`. */
export function chuoiChonLap(luot: readonly LuotThaiDo[]): { tong: number; trongChuoi: number; dai: number; chu: string } {
  const ds = luot
    .map((l) => ({ ...l, c: str(l.chon).toUpperCase() }))
    .filter((l) => l.loai === 'trac-nghiem' && /^[A-D]$/.test(l.c))
    .sort((a, b) => a.luc.localeCompare(b.luc))
  let trongChuoi = 0, dai = 0, chu = ''
  let i = 0
  while (i < ds.length) {
    let j = i
    while (j + 1 < ds.length && ds[j + 1]!.c === ds[i]!.c && ds[j + 1]!.ngay === ds[i]!.ngay) j++
    const n = j - i + 1
    if (n >= NG.chuoiLap) trongChuoi += n
    if (n > dai) { dai = n; chu = ds[i]!.c }
    i = j + 1
  }
  return { tong: ds.length, trongChuoi, dai, chu }
}

const NHOM_GIAY: readonly [string, number, number | null][] = [
  ['Dưới 8 giây', 0, 8], ['8–14 giây', 8, 15], ['15–29 giây', 15, 30], ['30–59 giây', 30, 60], ['1–2 phút', 60, 120], ['2–5 phút', 120, 300], ['Từ 5 phút', 300, null],
]
export function phanBoGiay(luot: readonly LuotThaiDo[]): NhomGiay[] {
  return NHOM_GIAY.map(([nhan, tu, den]) => {
    const o = luot.filter((l) => l.giay !== null && l.giay >= tu && (den === null || l.giay < den))
    return { nhan, tu, den, soLuot: o.length, soDung: o.filter((l) => l.dung === true).length, soNhanh: o.filter(laNhanh).length }
  })
}

/** Sáu tín hiệu + kết luận. `ngay` = lịch kế hoạch trong khoảng; `cauDaLam` / `cauHoTro` = tập câu gốc trong khoảng. */
export function tinhThaiDo(a: {
  ngay: readonly NgayBaiEm[]
  luot: readonly LuotThaiDo[]
  cauDaLam: ReadonlySet<string>
  cauHoTro: ReadonlySet<string>
  den: string
}): { tinHieu: TinHieuThaiDo[]; ketLuan: KetLuanThaiDo } {
  const t: TinHieuThaiDo[] = []
  // (a) ngày đủ mức — ngày đã hết, cộng hôm nay khi hôm nay đã đủ (hôm nay chưa hết thì chưa tính là thiếu).
  const tinh = a.ngay.filter((n) => !n.homNay || n.datMuc)
  const du = tinh.filter((n) => n.datMuc).length
  const pA = phanTram(du, tinh.length)
  t.push({
    ma: 'ngay-du-muc', ten: 'Ngày đủ mức', tu: du, mau: tinh.length, giaTri: pA,
    muc: tinh.length < NG.soNgayToiThieu ? 'chua-du' : pA! >= NG.ngayDuTot ? 'tot' : pA! >= NG.ngayDuChuY ? 'chu-y' : 'xau',
    chu: tinh.length ? `Đủ mức ${du}/${tinh.length} ngày (${pA}%)` : 'Chưa có ngày nào đã hết để tính',
    nguong: `Chăm từ ${NG.ngayDuTot}% · Lười từ ${NG.ngayDuLuoi}% trở xuống hoặc ${NG.ngayLienKhongLam} ngày liền không làm, thoát Lười khi đủ mức ${NG.ngayLienThoatLuoi} ngày liền · ở giữa là chưa đều; cần ít nhất ${NG.soNgayToiThieu} ngày`,
  })
  // (b) quá nhanh
  const coGiay = a.luot.filter((l) => l.giay !== null)
  const nhanh = coGiay.filter(laNhanh)
  const thuong = coGiay.filter((l) => !laNhanh(l))
  const pB = phanTram(nhanh.length, coGiay.length)
  const coKq = (ds: readonly LuotThaiDo[]) => ds.filter((l) => l.dung !== null)
  const dungNhanh = phanTram(nhanh.filter((l) => l.dung === true).length, coKq(nhanh).length)
  const dungThuong = phanTram(thuong.filter((l) => l.dung === true).length, coKq(thuong).length)
  t.push({
    ma: 'qua-nhanh', ten: 'Trả lời quá nhanh', tu: nhanh.length, mau: coGiay.length, giaTri: pB,
    muc: coGiay.length < NG.soLuotGiayToiThieu ? 'chua-du'
      : pB! >= NG.nhanXau && dungNhanh !== null && dungNhanh < NG.nhanDungThap ? 'xau'
      : pB! >= NG.nhanChuY ? 'chu-y' : 'tot',
    chu: coGiay.length
      ? `Quá nhanh ${nhanh.length}/${coGiay.length} lượt (${pB}%)${dungNhanh !== null ? ` · nhóm quá nhanh đúng ${dungNhanh}%` : ''}${dungThuong !== null ? ` · lượt thường đúng ${dungThuong}%` : ''}`
      : 'Chưa có lượt nào đo được số giây',
    nguong: `Quá nhanh: dưới ${NG.giayNhanhTracNghiem} giây (trắc nghiệm), dưới ${NG.giayNhanhTuTinh} giây (tự tính). Đáng lo khi từ ${NG.nhanXau}% lượt mà nhóm ấy đúng dưới ${NG.nhanDungThap}% (đoán bừa) · chú ý từ ${NG.nhanChuY}%; cần ít nhất ${NG.soLuotGiayToiThieu} lượt có số giây`,
  })
  // (c) dồn bài khuya
  const khuya = a.luot.filter((l) => laKhuya(l.luc)).length
  const pC = phanTram(khuya, a.luot.length)
  t.push({
    ma: 'don-bai', ten: 'Dồn bài cuối ngày', tu: khuya, mau: a.luot.length, giaTri: pC,
    muc: a.luot.length < NG.soLuotDonToiThieu ? 'chua-du' : pC! >= NG.donXau ? 'xau' : pC! >= NG.donChuY ? 'chu-y' : 'tot',
    chu: a.luot.length ? `${khuya}/${a.luot.length} lượt làm trong 23:00–04:59 (${pC}%)` : 'Chưa có lượt làm câu nào',
    nguong: `Đáng lo từ ${NG.donXau}% lượt làm 23:00–04:59 · chú ý từ ${NG.donChuY}%; cần ít nhất ${NG.soLuotDonToiThieu} lượt`,
  })
  // (d) gợi ý / đọc lời giải
  const hoTro = [...a.cauDaLam].filter((q) => a.cauHoTro.has(q)).length
  const pD = phanTram(hoTro, a.cauDaLam.size)
  t.push({
    ma: 'goi-y', ten: 'Dùng gợi ý, đọc lời giải', tu: hoTro, mau: a.cauDaLam.size, giaTri: pD,
    muc: a.cauDaLam.size < NG.soCauGoiYToiThieu ? 'chua-du' : pD! >= NG.goiYXau ? 'xau' : pD! >= NG.goiYChuY ? 'chu-y' : 'tot',
    chu: a.cauDaLam.size ? `${hoTro}/${a.cauDaLam.size} câu có dùng gợi ý hoặc đọc lời giải (${pD}%)` : 'Chưa có câu nào',
    nguong: `Đáng lo từ ${NG.goiYXau}% số câu · chú ý từ ${NG.goiYChuY}%; cần ít nhất ${NG.soCauGoiYToiThieu} câu`,
  })
  // (e) chọn lặp một phương án
  const lap = chuoiChonLap(a.luot)
  const pE = phanTram(lap.trongChuoi, lap.tong)
  t.push({
    ma: 'chon-lap', ten: 'Chọn lặp một phương án', tu: lap.trongChuoi, mau: lap.tong, giaTri: pE,
    muc: lap.tong < NG.soLuotLapToiThieu ? 'chua-du' : pE! >= NG.lapXau ? 'xau' : pE! >= NG.lapChuY ? 'chu-y' : 'tot',
    chu: lap.tong
      ? `${lap.trongChuoi}/${lap.tong} lượt trắc nghiệm nằm trong chuỗi chọn lặp (${pE}%) · chuỗi dài nhất ${lap.dai} lượt chọn ${lap.chu}`
      : 'Chưa có lượt trắc nghiệm nào ghi đáp án chọn',
    nguong: `Chuỗi lặp: từ ${NG.chuoiLap} lượt liên tiếp cùng một chữ. Đáng lo khi từ ${NG.lapXau}% lượt nằm trong chuỗi · chú ý từ ${NG.lapChuY}%; cần ít nhất ${NG.soLuotLapToiThieu} lượt`,
  })
  // (f) độ đúng 7 ngày gần nhất so với trước đó (trong khoảng xem)
  const moc = congNgayBhn(a.den, -(NG.soNgayGan - 1))
  const gan = a.luot.filter((l) => l.dung !== null && l.ngay >= moc)
  const truoc = a.luot.filter((l) => l.dung !== null && l.ngay < moc)
  const dGan = phanTram(gan.filter((l) => l.dung).length, gan.length)
  const dTruoc = phanTram(truoc.filter((l) => l.dung).length, truoc.length)
  const duF = gan.length >= NG.soLuotXuHuongToiThieu && truoc.length >= NG.soLuotXuHuongToiThieu
  const chenh = duF ? dGan! - dTruoc! : null
  t.push({
    ma: 'xu-huong', ten: 'Độ đúng theo thời gian', tu: gan.length, mau: truoc.length, giaTri: chenh,
    muc: !duF ? 'chua-du' : chenh! <= -NG.giamXau ? 'xau' : chenh! <= -NG.giamChuY ? 'chu-y' : 'tot',
    chu: `7 ngày gần nhất đúng ${dGan ?? '—'}${dGan !== null ? '%' : ''} (${gan.length} lượt) · trước đó ${dTruoc ?? '—'}${dTruoc !== null ? '%' : ''} (${truoc.length} lượt)${chenh !== null ? ` · ${chenh >= 0 ? 'tăng' : 'giảm'} ${Math.abs(chenh)} điểm %` : ''}`,
    nguong: `Đáng lo khi giảm từ ${NG.giamXau} điểm % · chú ý khi giảm từ ${NG.giamChuY}; mỗi bên cần ít nhất ${NG.soLuotXuHuongToiThieu} lượt`,
  })
  // Chuỗi ngày liền không làm câu nào dài nhất — chỉ ngày ĐÃ HẾT (hôm nay chưa hết không tính), cùng phép đếm Nhịp học ở Hôm nay.
  let chuoi = 0
  for (let i = 0, dai = 0; i < a.ngay.length; i++) {
    const n = a.ngay[i]!
    if (n.homNay) continue
    dai = n.daLam > 0 ? 0 : dai + 1
    if (dai > chuoi) chuoi = dai
  }
  // Chuỗi ngày đủ mức liền gần nhất (thầy 12/10: "6 ngày liền làm đủ mới thoát nhóm lười") — cùng phép thuần với Nhịp học (nhip-hoc-luat.ts).
  const homNay = a.ngay.find((n) => n.homNay)?.ngay ?? congNgayBhn(a.den, 1)
  const chuoiDu = chuoiDuGanNhat(a.ngay.map((n) => ({ ngay: n.ngay, muc: n.mucToiThieu, lam: n.daLam })), homNay)
  return { tinHieu: t, ketLuan: ketLuanThaiDo(t, chuoi, chuoiDu) }
}

/** Luật kết luận `LUAT_KET_LUAN` (kieu). Lý do luôn bằng số. */
/** `chuoiKhongLam` = số ngày liền không làm câu nào dài nhất (ngày đã hết) — nhánh "Lười" (cùng luật Nhịp học ở Hôm nay).
 *  `chuoiDuGanNhat` (THÊM 12/10, mặc định 0) = chuỗi ngày đủ mức liền gần nhất — từ `NG.ngayLienThoatLuoi` (6) ngày thì thoát nhánh "Lười". */
export function ketLuanThaiDo(t: readonly TinHieuThaiDo[], chuoiKhongLam = 0, chuoiDuGanNhat = 0): KetLuanThaiDo {
  const m = (ma: TinHieuThaiDo['ma']) => t.find((x) => x.ma === ma)!
  const xau = (x: TinHieuThaiDo) => x.muc === 'xau'
  const khongTot = (x: TinHieuThaiDo) => x.muc === 'xau' || x.muc === 'chu-y'
  const a = m('ngay-du-muc'), b = m('qua-nhanh'), c = m('don-bai'), d = m('goi-y'), e = m('chon-lap'), f = m('xu-huong')
  const lyDo = (x: TinHieuThaiDo) => `${x.ten}: ${x.chu}.`
  const doiPho = [xau(b) ? b : null, xau(e) ? e : null, xau(d) && khongTot(f) ? d : null].filter((x): x is TinHieuThaiDo => x !== null)
  const tra = (nhan: KetLuanThaiDo['nhan'], ds: readonly TinHieuThaiDo[], them: string[] = []): KetLuanThaiDo => ({ nhan, chu: TEN_NHAN_THAI_DO[nhan], lyDo: [...ds.map(lyDo), ...them] })
  if (doiPho.length) return tra('doi-pho', [...doiPho, ...(xau(d) && khongTot(f) ? [f] : [])], a.muc !== 'chua-du' ? [lyDo(a)] : [])
  if (a.muc === 'chua-du') return tra('chua-du-du-lieu', [a], [`Cần ít nhất ${NG.soNgayToiThieu} ngày đã hết để kết luận.`])
  // Lười — CÙNG phép thuần với Nhịp học (`laLuoiTheoTiLe`, nhip-hoc-luat.ts): du × 100 ≤ 40 × số ngày, hoặc 3 ngày liền không làm; đủ mức 6 ngày
  // liền gần nhất ⇒ thoát (thầy 12/10).
  const theoTiLe = laLuoiTheoTiLe(a.mau, a.tu, chuoiKhongLam)
  if (theoTiLe && chuoiDuGanNhat < NG.ngayLienThoatLuoi) {
    return tra('luoi', [a], chuoiKhongLam >= NG.ngayLienKhongLam ? [`${chuoiKhongLam} ngày liền không làm câu nào.`] : [])
  }
  const thoat = theoTiLe ? [`Đủ mức ${chuoiDuGanNhat} ngày liền gần nhất — đã ra khỏi nhóm Lười (cần ${NG.ngayLienThoatLuoi} ngày liền).`] : []
  if (a.muc !== 'tot' || xau(c)) return tra('chua-deu', [a, ...(xau(c) ? [c] : [])], thoat)
  const khongDau = [b, e, d].filter((x) => x.muc !== 'chua-du').map((x) => x.ten.toLocaleLowerCase('vi'))
  return tra('cham-chi', [a], [...thoat, ...(khongDau.length ? [`Không có dấu hiệu đối phó (${khongDau.join(', ')} trong ngưỡng).`] : [])])
}

// ------------------------------------------------------------------ HỒ SƠ THÁI ĐỘ (đọc D1)
const LA_LAN_LAM = (purpose: string) => !['xem_loi_giai', 'luot', 'chan_doan', 'chua_buoc'].includes(purpose)
function docRaw(raw: unknown): Row | null {
  if (raw === null || raw === undefined || raw === '') return null
  try {
    const j = JSON.parse(String(raw)) as unknown
    return j && typeof j === 'object' && !Array.isArray(j) ? (j as Row) : null
  } catch {
    return null
  }
}
interface DongSo {
  qid: string; goc: string; nguon: string; maNguon: string; lanThu: number; ketQua: number | null; luc: string; ngay: string
  maDang: string; mucDo: string; purpose: string; hoTro: boolean; attemptId: string; giayCot: unknown; raw: Row | null
}

/** `POST /gv/ho-so-thai-do` — xem đầu tệp. */
export async function gvHoSoThaiDo(env: Env, b: Row, nowMs = Date.now()): Promise<TraLoiHoSoThaiDo> {
  const sbd = str(b.sbd)
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  if (sbd.length > 40) return { ok: false, error: 'Số báo danh quá dài' }
  return hoSoThaiDoCuaEm(env, sbd, b, nowMs, 'thay')
}

/** LÕI hồ sơ thái độ của MỘT em (12/10F: tách để lệnh EM `/hs/ho-so-thai-do` — ho-so-em-hs.ts — dùng CÙNG phép tính, không bản thứ hai).
 *  `sbd` đã kiểm ở nơi gọi (thầy ⇒ thân lệnh; em ⇒ token). `nguoiDoc` 'hoc-sinh' (xem `NguoiDocSo`, lich-su-lam-cau.ts): sổ THÊM bỏ lượt ca kiểm tra
 *  chưa công bố / đã xoá, không lùi câu lệnh không lọc; `canhBao` chỉ giữ dòng "sổ bị cắt" (các dòng khác là ghi chú nội bộ cho thầy). */
export async function hoSoThaiDoCuaEm(env: Env, sbd: string, b: Row, nowMs: number, nguoiDoc: NguoiDocSo): Promise<TraLoiHoSoThaiDo> {
  const kh = khoangNgay(b, nowMs)
  if ('error' in kh) return { ok: false, error: kh.error }
  const { tu, den, homNay, canhBao } = kh

  // 1 · em + chế độ Gói 7
  const [rDs, rHs, goi7] = await Promise.all([
    hoi(env, 'SELECT ho_ten, lop FROM danh_sach WHERE sbd = ?', sbd),
    hoi(env, 'SELECT ho_ten, lop, ten_lop FROM hoc_sinh WHERE sbd = ?', sbd).then((r) => r ?? hoi(env, 'SELECT ho_ten, lop, NULL AS ten_lop FROM hoc_sinh WHERE sbd = ?', sbd)),
    docGoi7Em(env, sbd),
  ])
  if (!rDs && !rHs) return { ok: false, error: 'Không đọc được học sinh' }
  const ds0 = rDs?.[0], hs0 = rHs?.[0]
  if (!ds0 && !hs0) return { ok: false, error: 'Không tìm thấy học sinh' }
  if (!goi7) canhBao.push('Chưa đọc được Gói bài 7 ngày — các ngày tính theo kế hoạch Hành trình.')
  const em = {
    sbd,
    hoTen: str(ds0?.ho_ten) || str(hs0?.ho_ten) || sbd,
    lop: tenLopCuaEm(str(hs0?.lop) || str(ds0?.lop), hs0?.ten_lop),
    khoi: khoiTuChu(hs0?.lop) || khoiTuChu(ds0?.lop),
  }

  // 2 · lịch kế hoạch (cùng phép tính với bảng Bài hằng ngày) + sổ một em (song song)
  const COT = 'qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, muc_do'
  const SAU = `ORDER BY ngay_vn DESC, luc DESC LIMIT ${TOI_DA_LUOT_HO_SO + 1}`
  const locEm = nguoiDoc === 'hoc-sinh' ? ` AND ${sqlLuotCaDaCongBo('su_kien_hoc')}` : ''
  let keHoach: NgayBaiEm[]
  let rSo: Row[] | null
  try {
    ;[keHoach, rSo] = await Promise.all([
      docNgayCacEm(env, [{ ...em, goi7Tu: goi7?.get(sbd) ?? null }], tu, den, homNay, canhBao).then((m) => m.get(sbd) ?? []),
      hoi(env, `SELECT ${COT}, purpose, assistance, attempt_id, CASE WHEN json_valid(raw_json) THEN raw_json END AS raw_json FROM su_kien_hoc
          WHERE sbd = ? AND COALESCE(visibility, '') <> 'embargoed'${locEm} ${SAU}`, sbd)
        .then((r) => r ?? (nguoiDoc === 'thay' ? hoi(env, `SELECT ${COT} FROM su_kien_hoc WHERE sbd = ? ${SAU}`, sbd) : null)),
    ])
  } catch (e) {
    return { ok: false, error: e instanceof LoiDocSo ? e.message : 'Không đọc được sổ học của em.' }
  }
  if (!rSo) return { ok: false, error: 'Không đọc được sổ học của em.' }
  const catBot = rSo.length > TOI_DA_LUOT_HO_SO
  // Dòng đầu tiên bị bỏ (sổ xếp ngày giảm dần) còn trong khoảng xem ⇒ các số "từ … đến …" cũng thiếu lượt cũ nhất của khoảng.
  const catTrongKhoang = catBot && str(rSo[TOI_DA_LUOT_HO_SO]?.ngay_vn) >= tu
  const dong: DongSo[] = rSo.slice(0, TOI_DA_LUOT_HO_SO).map((x) => {
    const raw = docRaw(x.raw_json)
    const qid = str(x.qid)
    const kq = x.ket_qua === null || x.ket_qua === undefined || x.ket_qua === '' ? null : Number(x.ket_qua)
    const luc = str(x.luc)
    return {
      qid,
      goc: str(raw?.tc) ? tachSongSinh(str(raw?.tc)).goc : tachSongSinh(qid).goc,
      nguon: str(x.nguon), maNguon: str(x.ma_nguon), lanThu: Number(x.lan) || 1,
      ketQua: kq === null || !Number.isFinite(kq) ? null : kq,
      luc, ngay: str(x.ngay_vn) || (Number.isFinite(Date.parse(luc)) ? ngayVnCua(Date.parse(luc)) : ''),
      maDang: str(x.ma_dang), mucDo: chuanMucDo(x.muc_do), purpose: str(x.purpose), hoTro: str(x.assistance) === 'assisted',
      attemptId: str(x.attempt_id), giayCot: x.giay, raw,
    }
  })
  dong.sort((a, c) => a.luc.localeCompare(c.luc)) // cũ → mới
  const lam = dong.filter((d) => LA_LAN_LAM(d.purpose))
  const trong = (d: DongSo) => d.ngay >= tu && d.ngay <= den
  const lamTrong = lam.filter(trong)

  // 3 · tra phụ cho lượt TRONG khoảng: số giây (ca thi / game), đáp án chọn lượt game, kho câu (phần + tên), lời giải đã hỏi
  const tuIso = new Date(Date.parse(`${tu}T00:00:00+07:00`)).toISOString()
  const denIso = new Date(Date.parse(`${congNgayBhn(den, 1)}T00:00:00+07:00`)).toISOString()
  const doThat = new Map(lamTrong.map((d) => [d, giayDoCuaLuot(d.giayCot, d.raw?.ms)]))
  const caThi = [...new Set(lamTrong.filter((d) => d.nguon === 'thi').map((d) => d.maNguon))]
  const gameThieu = lamTrong.filter((d) => d.nguon === 'game' && doThat.get(d) === null).map((d) => ({ sbd, phien: d.maNguon }))
  const gameCanChon = [...new Set(lamTrong.filter((d) => d.nguon === 'game' && chonTuGiaTri(d.raw?.chon ?? d.raw?.traLoi) === null).map((d) => d.attemptId || `${d.maNguon}|${d.qid}`))]
  type KhoGon = { phan: string | null; tenDang: string | null; mucDo: string | null }
  const [kho, ct, uoc, rAtt, rHoi] = await Promise.all([
    docCauKho(env, [...new Set(lam.map((d) => d.goc).filter(Boolean))]).catch(() => new Map<string, KhoGon>()) as Promise<Map<string, KhoGon>>,
    chiTietCauCuaLuot(env, caThi, [sbd]).catch(() => new Map<string, { chon: string | null; giay: number | null }>()),
    giayUocTinhGame(env, gameThieu).catch(() => new Map<string, number>()),
    gameCanChon.length
      ? hoi(env, "SELECT id, CASE WHEN json_valid(json) THEN COALESCE(json_extract(json, '$.traLoiGoc'), json_extract(json, '$.traLoi')) END AS tra_loi FROM game_v2_attempt WHERE sbd = ? AND id IN (SELECT value FROM json_each(?))", sbd, JSON.stringify(gameCanChon))
      : Promise.resolve([] as Row[]),
    hoi(env, 'SELECT DISTINCT qid FROM loi_giai_hoi WHERE sbd = ? AND luc >= ? AND luc < ?', sbd, tuIso, denIso),
  ])
  const traLoiGame = new Map((rAtt ?? []).map((x) => [str(x.id), chonTuGiaTri(x.tra_loi)]))
  const ctCua = (d: DongSo) => {
    const k = `${d.maNguon}|${sbd}|${d.qid}`
    return ct.get(`${k}|${d.lanThu}`) ?? ct.get(`${k}|*`)
  }
  const phanCua = (d: DongSo): string => str(kho.get(d.goc)?.phan) || (/-(III|II|I)-\d+$/.exec(d.goc)?.[1] ?? '')
  const luot: LuotThaiDo[] = lamTrong.map((d) => {
    let giay = doThat.get(d) ?? null
    if (giay === null && d.nguon === 'thi') giay = ctCua(d)?.giay ?? null
    if (giay === null && d.nguon === 'game') giay = uoc.get(`${d.maNguon}|${Date.parse(d.luc)}`) ?? null
    let chon = chonTuGiaTri(d.raw?.chon ?? d.raw?.traLoi)
    if (chon === null && d.nguon === 'game') chon = traLoiGame.get(d.attemptId || `${d.maNguon}|${d.qid}`) ?? null
    if (chon === null && d.nguon === 'thi') chon = ctCua(d)?.chon ?? null
    return { luc: d.luc, ngay: d.ngay, goc: d.goc, dung: d.ketQua === null ? null : d.ketQua === 1, giay, loai: phanCua(d) === 'III' ? 'tu-tinh' : 'trac-nghiem', chon }
  })

  // 4 · ôn: lượt Ôn lại / Khắc phục, hoặc làm lại câu (gốc) đã từng sai TRƯỚC lượt ấy — xét trên mọi lượt đã đọc (cũ → mới).
  const tungSai = new Set<string>()
  const laOn = new Map<DongSo, boolean>()
  for (const d of lam) {
    laOn.set(d, d.nguon === 'on_lai' || d.nguon === 'khac_phuc' || tungSai.has(d.goc))
    if (d.ketQua === 0) tungSai.add(d.goc)
  }

  // 5 · số đếm trong khoảng
  const cauDaLam = new Set(lamTrong.map((d) => d.goc))
  const cauHoTro = new Set<string>([
    ...dong.filter((d) => trong(d) && (d.hoTro || d.purpose === 'xem_loi_giai')).map((d) => d.goc),
    ...(rHoi ?? []).map((x) => tachSongSinh(str(x.qid)).goc),
  ])
  const giayCo = luot.map((l) => l.giay).filter((g): g is number => g !== null).sort((x, y) => x - y)
  const dem: DemThaiDo = {
    soLuot: luot.length,
    soCau: cauDaLam.size,
    soDung: luot.filter((l) => l.dung === true).length,
    soSai: luot.filter((l) => l.dung === false).length,
    soBoTrong: luot.filter((l) => l.dung === null).length,
    soCauOn: new Set(lamTrong.filter((d) => laOn.get(d)).map((d) => d.goc)).size,
    soLuotOn: lamTrong.filter((d) => laOn.get(d)).length,
    giayTb: giayCo.length ? Math.round(giayCo.reduce((t, g) => t + g, 0) / giayCo.length) : null,
    giayTrungVi: giayCo.length ? giayCo[Math.floor((giayCo.length - 1) / 2)]! : null,
    soLuotCoGiay: giayCo.length,
  }
  const ngay: NgayHoatDong[] = keHoach.map((n) => {
    const o = luot.filter((l) => l.ngay === n.ngay)
    const dung = o.filter((l) => l.dung === true).length, sai = o.filter((l) => l.dung === false).length
    return { ...n, soLuot: o.length, soDung: dung, soSai: sai, tiLeDung: phanTram(dung, dung + sai) }
  })
  const { tinHieu, ketLuan } = tinhThaiDo({ ngay: keHoach, luot, cauDaLam, cauHoTro, den })
  // 5b · CHỈ THÊM 12/10: nhóm Nhịp học — CÙNG phép thuần với Hôm nay › Nhịp học (`tomTatNhip`), tính từ ngày em vào học như `/gv/nhip-hoc`
  // (`docNgayVao`, nạp động để không vòng nhập tĩnh với nhip-hoc.ts); đọc ngày vào hỏng ⇒ tính từ `tu` (đúng lối lùi của `/gv/nhip-hoc`).
  const vao = await import('./nhip-hoc')
    .then((m) => m.docNgayVao(env, [{ ...em, goi7Tu: null }], tu))
    .then((m) => m.get(sbd) ?? tu)
    .catch(() => tu)
  const nhip = tomTatNhip(keHoach.filter((n) => n.ngay >= vao).map((n) => ({ ngay: n.ngay, muc: n.mucToiThieu, lam: n.daLam })), homNay)

  // 6 · Câu đúng / Câu đã ôn (toàn bộ sổ đã đọc, quy câu gốc)
  const theoGoc = new Map<string, DongSo[]>()
  for (const d of lam) (theoGoc.get(d.goc) ?? theoGoc.set(d.goc, []).get(d.goc)!).push(d)
  const tenTuKho = (q: string) => str(kho.get(q)?.tenDang)
  const maDangThieu = [...new Set(lam.filter((d) => !tenTuKho(d.goc) && d.maDang).map((d) => d.maDang))]
  const tenDang = maDangThieu.length ? await tenCuaDang(env, maDangThieu).catch(() => new Map<string, string>()) : new Map<string, string>()
  const tomTat: CauTomTat[] = [...theoGoc].map(([goc, ds]) => {
    const cuoi = ds[ds.length - 1]!
    return {
      qid: goc,
      tieuDe: tieuDeCau(goc, tenTuKho(goc) || str(tenDang.get(ds.find((d) => d.maDang)?.maDang ?? ''))),
      mucDo: ds.find((d) => d.mucDo)?.mucDo || chuanMucDo(kho.get(goc)?.mucDo),
      soLan: ds.length,
      soDung: ds.filter((d) => d.ketQua === 1).length,
      soSai: ds.filter((d) => d.ketQua === 0).length,
      dungLanDau: ds[0]!.ketQua === 1,
      lanCuoiDung: cuoi.ketQua === 1,
      lanCuoi: cuoi.luc,
      soLanOn: ds.filter((d) => laOn.get(d)).length,
    }
  })
  const moiTruoc = (a: CauTomTat, c: CauTomTat) => c.lanCuoi.localeCompare(a.lanCuoi) || a.qid.localeCompare(c.qid)
  const cauDung = tomTat.filter((c) => c.soDung > 0).sort(moiTruoc).slice(0, TOI_DA_CAU_DANH_SACH)
  const cauDaOn = tomTat.filter((c) => c.soLanOn > 0).sort((a, c) => Number(a.lanCuoiDung) - Number(c.lanCuoiDung) || moiTruoc(a, c)).slice(0, TOI_DA_CAU_DANH_SACH)
  const soLuotChu = String(TOI_DA_LUOT_HO_SO).replace(/\B(?=(\d{3})+(?!\d))/g, '.') // "10.000" — không phụ thuộc Intl của Worker
  const chuCat = catTrongKhoang
    ? `Riêng từ ${ngayNganBhn(tu)} đến ${ngayNganBhn(den)} em đã có hơn ${soLuotChu} lượt — các số của khoảng này chỉ tính ${soLuotChu} lượt gần nhất.`
    : catBot ? `Sổ của em vượt ${soLuotChu} lượt — danh sách câu tính trên ${soLuotChu} lượt gần nhất.` : ''
  if (chuCat) canhBao.push(chuCat)
  return {
    ok: true, em, tu, den, homNay, ketLuan, tinHieu, dem, ngay, phanBoGiay: phanBoGiay(luot), cauDung, cauDaOn, catBot,
    // Bản học sinh: bỏ ghi chú nội bộ của thầy (Gói 7 chưa đọc được, khoảng ngày bị nắn, sổ Hành trình…), chỉ giữ dòng "sổ bị cắt" nói với em.
    canhBao: nguoiDoc === 'hoc-sinh' ? (chuCat ? [chuCat] : []) : canhBao,
    nhomNhip: nhip.nhom, coDoiPho: ketLuan.nhan === 'doi-pho', chuoiDuGanNhat: nhip.chuoiDuGanNhat,
  }
}

