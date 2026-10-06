// BÀN GỠ NÚT THẮT — Vòng học khép kín v2, Giai đoạn 2 phía THẦY (thầy 02/10: "tôi chỉ phải chữa bước cuối cùng gỡ nút thắt những câu học
// sinh đã nỗ lực thật sự nhưng không thể làm được khi đã đọc kĩ lời giải").
//
// Em đi hết thang tự gỡ mà vẫn vướng ⇒ một THẺ trong `nut_that` (hợp đồng: nut-that.ts — tệp này CHỈ đọc/ghi bảng ấy, không đổi lược đồ).
// Tệp này lo phần thầy:
//   · `/gv/nut-that/ds`  — thẻ 'cho' GOM theo (băm câu, bước vướng), xếp ưu tiên; nhóm phụ "cùng kiến thức nền"; khối "Kèm riêng".
//                          Lười: trước khi gom, phát lại sổ để chuyển thẻ 'da_go' → 'kem_rieng' / thẻ đã đóng lỗi → 'xong'.
//   · `/gv/nut-that/go`  — thầy gỡ một (băm, bước): INSERT `loi_go`, mọi thẻ 'cho' của (băm, bước) → 'da_go'.
//   · `/hs/loi-go`       — em đọc lời thầy gỡ của câu (theo băm), ghi `loi_go_doc`.
//
// LÊN BẢNG: app CHƯA có danh sách "gọi lên bảng" lưu theo buổi (buổi học chỉ có điểm danh `buoi_hoc_diem_danh`; app thầy tự chọn em
// trong số em CÓ MẶT — buoi-hoc.ts). Ghi em vào điểm danh là khai man "có mặt" ⇒ KHÔNG làm. Gỡ kiểu 'lop' ghi `buoi_hoc` vào `loi_go`
// và trả danh sách em cần gọi (`emCanGoi`) để thầy thấy ngay trên màn.
//
// Bảng mới duy nhất: `loi_go_doc` (CHỈ THÊM, tự tạo lần đầu dùng; bản SQL ở server/migration-0210-v2.sql; reset ⇒ GIỮ).
import type { D1PreparedStatement, Env } from './kieu'
import { damBaoBangNutThat, type TrangThaiNut } from './nut-that'
import { docBoTro, type BoTro } from './cau-bo-tro'
import { cacQidSongSinh, phatLaiLoi, tachSongSinh, TU_NGAY, type LanLamLoi } from './loi-hoc-luat'
import { SQL_TC } from './lam-lai-so'
import { gameIdentity } from './game-v2-auth'
import { protectedQuestions } from './game-v2-bank'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { ngayVn } from './su-kien-hoc'
import { MUC_DICH_CHAN_DOAN, MUC_DICH_LUOT } from './omni-kieu'
import { cauTrongGoi, chuHtml, deHtml, type CauKho } from '../../src/lib/loi-giai-kiem'

type Obj = Record<string, unknown>
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v)).trim()
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0)

// ---------------------------------------------------------------- bảng riêng

const TAO_BANG_DOC = ['CREATE TABLE IF NOT EXISTS loi_go_doc (sbd TEXT NOT NULL, go_id TEXT NOT NULL, luc TEXT NOT NULL, PRIMARY KEY (sbd, go_id, luc))']
const daTao = new WeakMap<object, Promise<void>>()
function damBaoBangDoc(env: Env): Promise<void> {
  const k = env.DB as unknown as object
  let p = daTao.get(k)
  if (!p) {
    p = env.DB.batch(TAO_BANG_DOC.map((s) => env.DB.prepare(s))).then(() => undefined)
    p.catch(() => daTao.delete(k))
    daTao.set(k, p)
  }
  return p
}

async function hoi(env: Env, sql: string, ...bind: unknown[]): Promise<Obj[]> {
  return (await env.DB.prepare(sql).bind(...bind).all<Obj>()).results ?? []
}
async function hoiAnToan(env: Env, sql: string, ...bind: unknown[]): Promise<Obj[] | null> {
  try { return await hoi(env, sql, ...bind) } catch { return null }
}

// ---------------------------------------------------------------- hằng số

/** Quá ngần này thẻ trong một ngày ⇒ gắn cờ nhóm đông em (thầy nên sửa lời giải một lần thay vì gỡ từng em). */
export const TRAN_THE_NGAY_THAY = 15
/** Nhóm có ít nhất ngần này em vướng cùng bước ⇒ đủ để gắn cờ `nhieuEmVuong` khi quá tải. */
export const SAN_NHIEU_EM = 4
/** Sau lời gỡ, em còn TỰ LÀM sai câu ấy ngần này lần ⇒ kèm riêng trên lớp. */
export const SAN_SAI_SAU_GO = 2
const TOI_DA_THE_CHO = 500
const TOI_DA_THE_PHAT_LAI = 300
const TOI_DA_NOI_DUNG = 4000

// ---------------------------------------------------------------- sổ: các lần em làm câu (gốc + song sinh)

interface DongSo { sbd: string; goc: string; luc: string; ngayVn: string; ketQua: 0 | 1 | null; coHoTro: boolean; songSinh: boolean; nguon: string; chon: string }

/** Câu gốc mà dòng câu anh em làm thay (`raw_json.tc`, lam-lai-so.ts); không có ⇒ ''. */
function tcTuRaw(raw: unknown): string {
  if (!raw) return ''
  try {
    const j = JSON.parse(str(raw)) as Obj
    return typeof j.tc === 'string' ? j.tc : ''
  } catch {
    return ''
  }
}

/** Đáp án em chọn đọc từ `raw_json` (`{chon}` hoặc `{traLoi}`) — như ho-so-em-chieu.ts. */
function chonTuRaw(raw: unknown): string {
  if (!raw) return ''
  try {
    const j = JSON.parse(str(raw)) as Obj
    return str(j.chon ?? j.traLoi).slice(0, 40)
  } catch {
    return ''
  }
}

/**
 * Các lần làm (từ `TU_NGAY`) của các cặp (em, câu gốc), kể cả song sinh `<qid>~ss0..3` và hậu tố lượt game `#n`. MỘT truy vấn (danh sách
 * em và danh sách qid đi qua `json_each`, mỗi thứ một tham số). Bỏ sự kiện bị che (ca chưa công bố). Cột chuẩn chưa có ⇒ đọc bản cũ.
 */
async function docSo(env: Env, cap: readonly { sbd: string; goc: string }[]): Promise<Map<string, DongSo[]>> {
  const ra = new Map<string, DongSo[]>()
  if (!cap.length) return ra
  const sbds = [...new Set(cap.map((x) => x.sbd))]
  const gocs = [...new Set(cap.map((x) => x.goc))]
  const qids = gocs.flatMap(cacQidSongSinh)
  const can = new Set(cap.map((x) => `${x.sbd}|${x.goc}`))
  // Tham số đánh số: ?1 danh sách em, ?2 danh sách qid (gốc + song sinh), ?3 mốc ngày, ?4 (chỉ bản mới) danh sách câu gốc cho dòng "thay cho".
  const loc = (tc: string) => `sbd IN (SELECT value FROM json_each(?1)) AND ngay_vn >= ?3
      AND (qid IN (SELECT value FROM json_each(?2)) OR (instr(qid, '#') > 0 AND substr(qid, 1, instr(qid, '#') - 1) IN (SELECT value FROM json_each(?2)))${tc})`
  // 05/10 (cau-anh-em.ts): dòng CÂU ANH EM làm thay câu gốc (`raw_json.tc`) là một lượt song sinh của câu gốc — như docLanLam của em, để thẻ
  // đóng ('xong') khi em đã sửa câu bằng câu anh em, không nằm chờ thầy chữa.
  const sqlMoi = `SELECT sbd, qid, ket_qua, luc, ngay_vn, nguon, assistance, purpose, raw_json FROM su_kien_hoc
    WHERE ${loc(` OR (${SQL_TC} IS NOT NULL AND ${SQL_TC} IN (SELECT value FROM json_each(?4)))`)} AND COALESCE(visibility, '') <> 'embargoed' ORDER BY luc`
  const sqlCu = `SELECT sbd, qid, ket_qua, luc, ngay_vn, nguon FROM su_kien_hoc WHERE ${loc('')} ORDER BY luc`
  const tham = [JSON.stringify(sbds), JSON.stringify(qids), TU_NGAY]
  const rows = (await hoiAnToan(env, sqlMoi, ...tham, JSON.stringify(gocs))) ?? (await hoiAnToan(env, sqlCu, ...tham)) ?? []
  for (const x of rows) {
    // 06/10: dòng CÂU CHẨN ĐOÁN bước sai (chan-doan-buoc-sai.ts — purpose 'chan_doan', tc = câu lỗi) không phải một lần làm của câu lỗi.
    if (str(x.purpose) === MUC_DICH_CHAN_DOAN) continue
    const t = tachSongSinh(str(x.qid))
    const nguon = str(x.nguon)
    const kq = x.ket_qua === null || x.ket_qua === undefined ? null : num(x.ket_qua) === 1 ? 1 : 0
    // Bỏ trống chỉ tính sai ở ca kiểm tra (kênh khác NULL có thể là "chưa làm") — đúng luật hàng chữa lỗi.
    if (kq === null && nguon !== 'thi') continue
    const chung: Omit<DongSo, 'goc' | 'songSinh' | 'chon'> = {
      sbd: str(x.sbd), luc: str(x.luc), ngayVn: str(x.ngay_vn), ketQua: kq,
      // OMNI 3: dòng lướt (purpose 'luot') không phải một lần làm — như đọc lời giải: không tính đúng, không tính sai.
      coHoTro: str(x.assistance) === 'assisted' || str(x.purpose) === 'xem_loi_giai' || str(x.purpose) === MUC_DICH_LUOT, nguon,
    }
    const k = `${str(x.sbd)}|${t.goc}`
    if (can.has(k)) ra.set(k, [...(ra.get(k) ?? []), { ...chung, goc: t.goc, songSinh: t.songSinh !== null, chon: chonTuRaw(x.raw_json) }])
    const tc = tcTuRaw(x.raw_json)
    const kTc = `${str(x.sbd)}|${tc}`
    // Đáp án em chọn ở dòng câu anh em là của câu KHÁC ⇒ không đưa lên thẻ câu gốc.
    if (tc && tc !== t.goc && can.has(kTc)) ra.set(kTc, [...(ra.get(kTc) ?? []), { ...chung, goc: tc, songSinh: true, chon: '' }])
  }
  return ra
}

/** Mốc em đọc lời giải (Hỏi thầy) — lượt làm trong 12 giờ sau mốc không tính tự làm (luật chung). */
async function docMocDoc(env: Env, sbds: readonly string[]): Promise<Map<string, string[]>> {
  const ra = new Map<string, string[]>()
  if (!sbds.length) return ra
  const r = (await hoiAnToan(env, 'SELECT sbd, qid, luc FROM loi_giai_hoi WHERE sbd IN (SELECT value FROM json_each(?)) AND luc >= ?', JSON.stringify([...new Set(sbds)]), `${TU_NGAY}T00:00:00`)) ?? []
  for (const x of r) { const k = `${str(x.sbd)}|${tachSongSinh(str(x.qid)).goc}`; ra.set(k, [...(ra.get(k) ?? []), str(x.luc)]) }
  return ra
}

const sangLanLam = (d: DongSo): LanLamLoi => ({ luc: d.luc, ngayVn: d.ngayVn, ketQua: d.ketQua, coHoTro: d.coHoTro, songSinh: d.songSinh, nguon: d.nguon })
/** Lượt TỰ LÀM sai (sai hoặc bỏ trống ở ca kiểm tra), không hỗ trợ. */
const laTuLamSai = (d: DongSo) => !d.coHoTro && d.ketQua !== 1

// ---------------------------------------------------------------- KÈM RIÊNG / XONG (lười)

interface DongThe { id: string; sbd: string; qid: string; bam: string; buoc: number; trang_thai: TrangThaiNut; go_id: string | null }

/**
 * Phát lại sổ cho các thẻ còn mở ('cho' · 'da_go' · 'kem_rieng') và chuyển trạng thái:
 *   · lỗi của (em, câu) đã ĐÓNG theo luật chung (`phatLaiLoi` → 'dong' | 'duy_tri') ⇒ 'xong' (mọi thẻ còn mở);
 *   · thẻ 'da_go' mà em còn ≥ 2 lần TỰ LÀM sai câu ấy (kể cả song sinh) SAU lúc thầy gỡ ⇒ 'kem_rieng'.
 * Trả số thẻ đã chuyển. Không xoá gì, chỉ đổi `trang_thai` (UPDATE có điều kiện trạng thái cũ — gọi trùng không ghi đôi).
 */
async function phatLaiThe(env: Env, the: readonly DongThe[], homNay: string): Promise<number> {
  if (!the.length) return 0
  const cap = the.map((t) => ({ sbd: t.sbd, goc: tachSongSinh(t.qid).goc }))
  const [so, mocDoc, boTro] = await Promise.all([
    docSo(env, cap),
    docMocDoc(env, cap.map((x) => x.sbd)),
    docBoTro(env, the.map((t) => t.bam)).catch(() => new Map<string, BoTro>()),
  ])
  const goIds = [...new Set(the.map((t) => t.go_id).filter((x): x is string => !!x))]
  const lucGo = new Map<string, string>()
  if (goIds.length) for (const x of (await hoiAnToan(env, 'SELECT id, luc FROM loi_go WHERE id IN (SELECT value FROM json_each(?))', JSON.stringify(goIds))) ?? []) lucGo.set(str(x.id), str(x.luc))
  const nay = new Date().toISOString()
  const lenh: D1PreparedStatement[] = []
  for (const t of the) {
    const goc = tachSongSinh(t.qid).goc
    const ds = so.get(`${t.sbd}|${goc}`) ?? []
    const coSongSinh = (boTro.get(t.bam)?.songSinh.length ?? 0) > 0
    const loi = phatLaiLoi(ds.map(sangLanLam), mocDoc.get(`${t.sbd}|${goc}`) ?? [], coSongSinh, homNay)
    let moi: TrangThaiNut | null = null
    if (loi.trangThai === 'dong' || loi.trangThai === 'duy_tri') moi = 'xong'
    else if (t.trang_thai === 'da_go' && t.go_id && lucGo.has(t.go_id)) {
      const moc = lucGo.get(t.go_id)!
      if (ds.filter((d) => d.luc > moc && laTuLamSai(d)).length >= SAN_SAI_SAU_GO) moi = 'kem_rieng'
    }
    if (moi && moi !== t.trang_thai) {
      lenh.push(env.DB.prepare('UPDATE nut_that SET trang_thai = ?, cap_nhat_luc = ? WHERE id = ? AND trang_thai = ?').bind(moi, nay, t.id, t.trang_thai))
    }
  }
  for (let i = 0; i < lenh.length; i += 50) await env.DB.batch(lenh.slice(i, i + 50))
  return lenh.length
}

const COT_THE = 'id, sbd, qid, bam, buoc, trang_thai, go_id'
const sangDongThe = (x: Obj): DongThe => ({ id: str(x.id), sbd: str(x.sbd), qid: str(x.qid), bam: str(x.bam), buoc: num(x.buoc), trang_thai: str(x.trang_thai) as TrangThaiNut, go_id: str(x.go_id) || null })

/** Kèm riêng cho MỘT em × MỘT câu (gốc hoặc song sinh): phát lại sổ các thẻ còn mở của em ở câu ấy. Trả số thẻ đã chuyển trạng thái. */
export async function danhDauKemRieng(env: Env, sbd: string, qid: string, nowMs: number = Date.now()): Promise<number> {
  await damBaoBangNutThat(env)
  const goc = tachSongSinh(qid).goc
  const the = (await hoi(env, `SELECT ${COT_THE} FROM nut_that WHERE sbd = ? AND (qid = ? OR qid LIKE ? OR qid LIKE ? OR qid LIKE ?) AND trang_thai IN ('cho', 'da_go', 'kem_rieng')`, sbd, goc, `${goc}~ss%`, `${goc}~bt%`, `${goc}~yd%`)).map(sangDongThe)
  return phatLaiThe(env, the, ngayVn(nowMs))
}

// ---------------------------------------------------------------- câu kho (đề, chữ bước)

async function docGoi(env: Env, maDe: string): Promise<unknown | null> {
  try {
    const o = await env.DE.get(`kho/${maDe}.json`)
    return o ? await new Response(o.body).json() : null
  } catch {
    return null
  }
}

/** Câu hiện tại trong kho theo qid (gói R2 của đề ghi trong `loi_giai_cau`; thiếu thì suy từ qid). `boNho`: đệm gói theo mã đề. */
async function cauKho(env: Env, qid: string, boNho: Map<string, unknown>): Promise<CauKho | null> {
  const maDe = str((await hoiAnToan(env, 'SELECT ma_de FROM loi_giai_cau WHERE qid = ?', qid))?.[0]?.ma_de) || (/^(.+)-(?:III|II|I)-\d+$/.exec(qid)?.[1] ?? '')
  if (!maDe) return null
  let goi = boNho.get(maDe)
  if (goi === undefined) { goi = await docGoi(env, maDe); boNho.set(maDe, goi) }
  return cauTrongGoi(maDe, goi).find((x) => x.qid === qid) ?? null
}

/** Chữ bước `buoc` trong một danh sách bước. QUY ƯỚC CHỐT (02/10): bước đánh số TỪ 0 ở mọi dữ liệu (nut_that, loi_go, cau_kiem_lam,
 *  cau_bo_tro.cau_kiem/nhan_nen, chỉ số mảng buoc[]); chỉ màn hình hiện "Bước buoc+1". Ngoài phạm vi ⇒ chuỗi rỗng. */
function chuCuaBuoc(ds: readonly string[], buoc: number): string {
  return Number.isInteger(buoc) && buoc >= 0 && buoc < ds.length ? str(ds[buoc]) : ''
}

/** Chữ bước từ hồ sơ lời giải từng bước (R2 `giai/<băm>.json`, mảng `dung` [{t, p}]). */
async function chuBuocHoSo(env: Env, bam: string, buoc: number): Promise<string> {
  try {
    const o = await env.DE.get(`giai/${bam}.json`)
    if (!o) return ''
    const h = (await new Response(o.body).json()) as Obj
    const dung = Array.isArray(h.dung) ? (h.dung as Obj[]) : []
    const b = Number.isInteger(buoc) && buoc >= 0 ? dung[buoc] : undefined // bước đánh số từ 0
    return b ? [str(b.t), str(b.p)].filter(Boolean).join(': ') : ''
  } catch {
    return ''
  }
}

const buocKho = (c: CauKho | null): string[] => {
  const lg = (c?.loiGiai ?? {}) as Obj
  return Array.isArray(lg.buoc) ? (lg.buoc as unknown[]).map((x) => (typeof x === 'string' ? x : str((x as Obj)?.noi_dung ?? (x as Obj)?.t))) : []
}

// ---------------------------------------------------------------- /gv/nut-that/ds

export interface EmVuong { sbd: string; hoTen: string; dapAnChon: string; kiem: { traLoi: string; dung: boolean; luc: string }[]; viet: string; soLanThu: number; guiLuc: string }
export interface NhomNut {
  khoa: string; bam: string; buoc: number; qidMau: string; so: string; de: string; chuBuoc: string; nhanNen: string; cauKiemHoi: string
  soEm: number; em: EmVuong[]; soCauCungChuyenDe: number; hanGanNhat: string | null; diem: number; nhieuEmVuong: boolean
}

/**
 * THỨ TỰ ƯU TIÊN (cao trước):  diem = soEm × hayGap × gap
 *   · soEm   — số em (khác nhau) vướng đúng (câu, bước) này;
 *   · hayGap — mức hay gặp của dạng: 1 + log2(1 + n), n = số câu khác trong kho (`cau_hoi`) cùng chuyên đề với câu mẫu (không biết ⇒ n = 0 ⇒ 1);
 *   · gap    — hạn chiến dịch gần nhất đang chạy chứa câu (bất kỳ qid nào của nhóm): còn d ngày ⇒ 1 + 3 / (1 + d)
 *              (hạn hôm nay ×4, ngày mai ×2,5, 3 ngày ×1,75); không thuộc chiến dịch nào ⇒ 1.
 *   Hoà điểm ⇒ thẻ gửi sớm hơn trước.
 */
export function diemUuTien(soEm: number, soCauCungChuyenDe: number, soNgayDenHan: number | null): number {
  const hayGap = 1 + Math.log2(1 + Math.max(0, soCauCungChuyenDe))
  const gap = soNgayDenHan === null ? 1 : 1 + 3 / (1 + Math.max(0, soNgayDenHan))
  return Math.round(soEm * hayGap * gap * 100) / 100
}

const cachNgay = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000)

export async function gvNutThatDs(env: Env, _b: Obj, nowMs: number = Date.now()) {
  await damBaoBangNutThat(env)
  const homNay = ngayVn(nowMs)
  // 1) Lười: chuyển thẻ đã gỡ / đã đóng lỗi trước khi gom.
  const mo = (await hoi(env, `SELECT ${COT_THE} FROM nut_that WHERE trang_thai IN ('cho', 'da_go', 'kem_rieng') ORDER BY cap_nhat_luc DESC LIMIT ?`, TOI_DA_THE_PHAT_LAI)).map(sangDongThe)
  await phatLaiThe(env, mo, homNay).catch(() => 0)

  // 2) Thẻ chờ.
  const cho = await hoi(env, `SELECT id, sbd, qid, bam, buoc, viet, bang_chung_json, gui_luc, ngay_vn FROM nut_that WHERE trang_thai = 'cho' ORDER BY gui_luc LIMIT ?`, TOI_DA_THE_CHO)
  const kemRiengDong = await hoi(env, `SELECT sbd, qid, bam, buoc, cap_nhat_luc FROM nut_that WHERE trang_thai = 'kem_rieng' ORDER BY cap_nhat_luc DESC LIMIT 200`)
  const sbds = [...new Set([...cho, ...kemRiengDong].map((x) => str(x.sbd)))]
  const bams = [...new Set([...cho, ...kemRiengDong].map((x) => str(x.bam)))]
  const hoTen = new Map<string, string>()
  if (sbds.length) for (const x of (await hoiAnToan(env, 'SELECT sbd, ho_ten FROM hoc_sinh WHERE sbd IN (SELECT value FROM json_each(?))', JSON.stringify(sbds))) ?? []) hoTen.set(str(x.sbd), str(x.ho_ten))
  const boTro = await docBoTro(env, bams).catch(() => new Map<string, BoTro>())
  const boNho = new Map<string, unknown>()

  // Khối "Kèm riêng" (thầy xem trên lớp).
  const kemRieng = [] as { sbd: string; hoTen: string; qid: string; buoc: number; so: string; chuBuoc: string }[]
  for (const x of kemRiengDong) {
    const qid = str(x.qid), bam = str(x.bam), buoc = num(x.buoc)
    const c = await cauKho(env, tachSongSinh(qid).goc, boNho)
    kemRieng.push({ sbd: str(x.sbd), hoTen: hoTen.get(str(x.sbd)) || str(x.sbd), qid, buoc, so: c ? `Câu ${c.so}` : '', chuBuoc: chuCuaBuoc(boTro.get(bam)?.buoc ?? [], buoc) || chuCuaBuoc(buocKho(c), buoc) })
  }

  if (!cho.length) return { ok: true, nhom: [] as NhomNut[], cungNen: [], kemRieng, tong: { soThe: 0, soNhom: 0, theNgayDongNhat: 0, quaTai: false } }

  // 3) Dữ liệu từng em: sổ (đáp án chọn lần sai cuối, số lần sai), câu kiểm đã trả lời.
  const so = await docSo(env, cho.map((x) => ({ sbd: str(x.sbd), goc: tachSongSinh(str(x.qid)).goc })))
  const kiem = (await hoiAnToan(env, 'SELECT sbd, bam, buoc, tra_loi, dung, luc FROM cau_kiem_lam WHERE bam IN (SELECT value FROM json_each(?)) AND sbd IN (SELECT value FROM json_each(?)) ORDER BY luc', JSON.stringify(bams), JSON.stringify(sbds))) ?? []

  // 4) Gom theo (băm, bước).
  const nhomMap = new Map<string, Obj[]>()
  for (const x of cho) { const k = `${str(x.bam)}|${num(x.buoc)}`; nhomMap.set(k, [...(nhomMap.get(k) ?? []), x]) }

  // 5) Mức hay gặp (chuyên đề câu mẫu) + hạn chiến dịch.
  const qidMauCua = (bam: string, ds: Obj[]) => boTro.get(bam)?.qidMau || tachSongSinh(str(ds[0]!.qid)).goc
  const qidMau = [...nhomMap.entries()].map(([k, ds]) => qidMauCua(k.split('|')[0]!, ds))
  const cungChuyenDe = new Map<string, number>()
  for (const x of (await hoiAnToan(env, `SELECT q.qid, (SELECT COUNT(*) FROM cau_hoi c2 WHERE c2.chuyen_de = q.chuyen_de AND c2.qid <> q.qid) AS n
      FROM cau_hoi q WHERE q.qid IN (SELECT value FROM json_each(?)) AND COALESCE(q.chuyen_de, '') <> ''`, JSON.stringify(qidMau))) ?? []) cungChuyenDe.set(str(x.qid), num(x.n))
  const chienDich = ((await hoiAnToan(env, "SELECT han_nop, qid_json FROM chien_dich WHERE trang_thai = 'dang_chay' AND han_nop >= ?", homNay)) ?? []).map((x) => {
    let q: string[] = []
    try { const v = JSON.parse(str(x.qid_json)); if (Array.isArray(v)) q = v.map(String) } catch { /* bỏ */ }
    return { han: str(x.han_nop), q: new Set(q) }
  })

  const nhom: NhomNut[] = []
  for (const [k, ds] of nhomMap) {
    const bam = k.split('|')[0]!, buoc = num(k.split('|')[1])
    const bt = boTro.get(bam)
    const mau = qidMauCua(bam, ds)
    const c = await cauKho(env, mau, boNho)
    const chuBuoc = chuCuaBuoc(bt?.buoc ?? [], buoc) || (await chuBuocHoSo(env, bam, buoc)) || chuCuaBuoc(buocKho(c), buoc)
    const qCuaNhom = new Set([mau, ...ds.map((x) => tachSongSinh(str(x.qid)).goc)])
    const han = chienDich.filter((cd) => [...qCuaNhom].some((q) => cd.q.has(q))).map((cd) => cd.han).sort()[0] ?? null
    // Một em có thể gửi hai thẻ cùng (câu, bước) ở hai ngày ⇒ giữ thẻ mới nhất của em.
    const theoEm = new Map<string, Obj>()
    for (const x of ds) { const s = str(x.sbd); const cu = theoEm.get(s); if (!cu || str(x.gui_luc) > str(cu.gui_luc)) theoEm.set(s, x) }
    const em: EmVuong[] = [...theoEm.values()].map((x) => {
      const sbd = str(x.sbd)
      const lan = so.get(`${sbd}|${tachSongSinh(str(x.qid)).goc}`) ?? []
      const sai = lan.filter(laTuLamSai)
      let bc: Obj = {}
      try { const v = JSON.parse(str(x.bang_chung_json) || '{}'); if (v && typeof v === 'object') bc = v as Obj } catch { /* bỏ */ }
      return {
        sbd, hoTen: hoTen.get(sbd) || sbd,
        dapAnChon: [...sai].reverse().find((d) => d.chon)?.chon || str(bc.chon ?? bc.dapAnChon).slice(0, 40),
        kiem: kiem.filter((y) => str(y.sbd) === sbd && str(y.bam) === bam && num(y.buoc) === buoc).map((y) => ({ traLoi: str(y.tra_loi), dung: num(y.dung) === 1, luc: str(y.luc) })),
        viet: str(x.viet),
        soLanThu: sai.length,
        guiLuc: str(x.gui_luc),
      }
    }).sort((a, b) => a.guiLuc.localeCompare(b.guiLuc))
    const n = cungChuyenDe.get(mau) ?? 0
    nhom.push({
      khoa: k, bam, buoc, qidMau: mau, so: c ? `Câu ${c.so}` : '', de: c ? deHtml(c) : '', chuBuoc: chuBuoc ? chuHtml(chuBuoc) : '',
      nhanNen: bt?.nhanNen.find((x) => x.buoc === buoc)?.nen ?? '', cauKiemHoi: bt?.cauKiem.find((x) => x.buoc === buoc)?.hoi ?? '',
      soEm: em.length, em, soCauCungChuyenDe: n, hanGanNhat: han,
      diem: diemUuTien(em.length, n, han ? cachNgay(homNay, han) : null), nhieuEmVuong: false,
    })
  }
  const sauNhat = (n: NhomNut) => n.em.map((e) => e.guiLuc).sort()[0] ?? ''
  nhom.sort((a, b) => b.diem - a.diem || sauNhat(a).localeCompare(sauNhat(b)))

  // 6) Quá tải: ngày đông nhất của các thẻ đang chờ > 15 thẻ ⇒ nhóm ≥ 4 em gắn cờ (gợi thầy sửa lời giải một lần).
  const demNgay = new Map<string, number>()
  for (const x of cho) demNgay.set(str(x.ngay_vn), (demNgay.get(str(x.ngay_vn)) ?? 0) + 1)
  const theNgayDongNhat = Math.max(0, ...demNgay.values())
  const quaTai = theNgayDongNhat > TRAN_THE_NGAY_THAY
  if (quaTai) for (const g of nhom) g.nhieuEmVuong = g.soEm >= SAN_NHIEU_EM

  // 7) Nhóm phụ "cùng kiến thức nền": các nhóm cùng nhãn nền (≥ 2 câu) — "12 em vướng bảo toàn electron ở 5 câu".
  const theoNen = new Map<string, NhomNut[]>()
  for (const g of nhom) if (g.nhanNen) theoNen.set(g.nhanNen, [...(theoNen.get(g.nhanNen) ?? []), g])
  const cungNen = [...theoNen.entries()]
    .map(([nen, gs]) => ({ nen, soEm: new Set(gs.flatMap((g) => g.em.map((e) => e.sbd))).size, soCau: new Set(gs.map((g) => g.bam)).size, khoa: gs.map((g) => g.khoa) }))
    .filter((x) => x.soCau >= 2)
    .sort((a, b) => b.soEm - a.soEm || b.soCau - a.soCau)

  return { ok: true, nhom, cungNen, kemRieng, tong: { soThe: cho.length, soNhom: nhom.length, theNgayDongNhat, quaTai } }
}

// ---------------------------------------------------------------- /gv/nut-that/go

const KIEU_GO = new Set(['ngan', 'lop', 'sua'])

export async function gvNutThatGo(env: Env, b: Obj, nowMs: number = Date.now()) {
  await damBaoBangNutThat(env)
  const bam = str(b.bam), buoc = Number(b.buoc), kieu = str(b.kieu)
  const noiDung = str(b.noiDung).slice(0, TOI_DA_NOI_DUNG)
  const buoiHoc = str(b.buoiHoc).slice(0, 80)
  if (!bam || !Number.isInteger(buoc) || buoc < 0) return { ok: false, error: 'Thiếu câu hoặc bước cần gỡ.' }
  if (!KIEU_GO.has(kieu)) return { ok: false, error: 'Cách gỡ không rõ.' }
  if (kieu !== 'lop' && !noiDung) return { ok: false, error: kieu === 'sua' ? 'Thầy ghi nội dung cần sửa trước khi lưu.' : 'Thầy gõ lời gỡ trước khi gửi.' }
  if (kieu === 'lop' && !buoiHoc && !noiDung) return { ok: false, error: 'Thầy chọn buổi học hoặc ghi buổi sẽ dạy.' }
  let tenBuoi = ''
  if (kieu === 'lop' && buoiHoc) {
    const r = await hoiAnToan(env, 'SELECT ten FROM buoi_hoc WHERE id = ?', buoiHoc)
    if (!r?.length) return { ok: false, error: 'Không tìm thấy buổi học này.' }
    tenBuoi = str(r[0]!.ten)
  }
  const the = await hoi(env, "SELECT id, sbd FROM nut_that WHERE bam = ? AND buoc = ? AND trang_thai = 'cho'", bam, buoc)
  if (!the.length) return { ok: false, error: 'Các thẻ của bước này đã được gỡ rồi.' }
  const id = crypto.randomUUID()
  const luc = new Date(nowMs).toISOString()
  const kq = await env.DB.batch([
    env.DB.prepare('INSERT INTO loi_go (id, bam, buoc, kieu, noi_dung, tep_khoa, buoi_hoc, luc) VALUES (?,?,?,?,?,NULL,?,?)').bind(id, bam, buoc, kieu, noiDung || null, kieu === 'lop' && buoiHoc ? buoiHoc : null, luc),
    env.DB.prepare("UPDATE nut_that SET trang_thai = 'da_go', go_id = ?, cap_nhat_luc = ? WHERE bam = ? AND buoc = ? AND trang_thai = 'cho'").bind(id, luc, bam, buoc),
  ])
  const soThe = Number(kq[1]?.meta?.changes ?? the.length)
  if (kieu !== 'lop') return { ok: true, soThe, goId: id }
  // Dạy trên lớp: chưa có danh sách "gọi lên bảng" lưu theo buổi ⇒ trả danh sách em cần gọi (đã ghi buổi vào loi_go).
  const sbds = [...new Set(the.map((x) => str(x.sbd)))]
  const ten = new Map(((await hoiAnToan(env, 'SELECT sbd, ho_ten FROM hoc_sinh WHERE sbd IN (SELECT value FROM json_each(?))', JSON.stringify(sbds))) ?? []).map((x) => [str(x.sbd), str(x.ho_ten)]))
  return { ok: true, soThe, goId: id, tenBuoi, emCanGoi: sbds.map((s) => ({ sbd: s, hoTen: ten.get(s) || s })) }
}

// ---------------------------------------------------------------- /hs/loi-go

/** Câu (hoặc bản cùng nội dung) đang nằm trong ca chưa công bố / còn làm được ⇒ khoá. Lỗi đọc ⇒ coi như đang bảo vệ (như loi-giai.ts). */
async function dangBaoVe(env: Env, qid: string, bam: string): Promise<boolean> {
  try {
    const tap = await protectedQuestions(env)
    if (tap.has(qid)) return true
    return (await hoi(env, 'SELECT qid FROM loi_giai_cau WHERE bam = ?', bam)).some((r) => tap.has(str(r.qid)))
  } catch {
    return true
  }
}

/**
 * `/hs/loi-go {token, qid}` — các lời thầy gỡ của câu (theo băm nội dung) để em đọc. Chỉ lời gỡ 'ngan' và 'lop' (lời 'sua' là ghi chú thầy
 * sửa lời giải/đề — không gửi em). Em được đọc khi: em có thẻ nút thắt ở câu này, hoặc đã tự làm câu ở chỗ luyện, hoặc câu nằm trong ca của
 * em đã công bố; và câu không đang được bảo vệ (ca chưa công bố). Ghi `loi_go_doc` cho mỗi lời gỡ trả về.
 */
export async function hsLoiGo(env: Env, b: Obj, nowMs: number = Date.now()) {
  await damBaoBangNutThat(env)
  await damBaoBangDoc(env)
  const sbd = await gameIdentity(env, b)
  const qid = tachSongSinh(str(b.qid)).goc
  if (!qid) return { ok: false, error: 'Thiếu câu.' }
  const bam = str((await hoiAnToan(env, 'SELECT bam FROM loi_giai_cau WHERE qid = ?', qid))?.[0]?.bam)
  if (!bam) return { ok: true, loiGo: [] }
  if (await dangBaoVe(env, qid, bam)) return { ok: false, error: 'Câu này đang nằm trong một ca kiểm tra chưa công bố kết quả. Thầy công bố xong em xem lại nhé.' }
  const coThe = (await hoiAnToan(env, 'SELECT 1 AS co FROM nut_that WHERE sbd = ? AND bam = ? LIMIT 1', sbd, bam))?.length
  const daLuyen = coThe ? 1 : (await hoiAnToan(env, `SELECT 1 AS co FROM su_kien_hoc WHERE sbd = ? AND (qid = ? OR qid LIKE ? OR qid LIKE ? OR qid LIKE ?) AND nguon <> 'thi' LIMIT 1`, sbd, qid, `${qid}~ss%`, `${qid}~bt%`, `${qid}~yd%`))?.length
  const daCongBo = coThe || daLuyen ? 1 : (await hoiAnToan(env, `SELECT 1 AS co FROM chi_tiet_cau t JOIN ca c ON c.ma_ca = t.ma_ca WHERE t.sbd = ? AND t.qid = ? AND c.trang_thai IS NOT 'da_xoa' AND ${SQL_DA_CONG_BO('c')} LIMIT 1`, sbd, qid))?.length
  if (!coThe && !daLuyen && !daCongBo) return { ok: false, error: 'Lời thầy gỡ mở sau khi em tự làm câu này.' }
  const rows = await hoi(env, "SELECT g.id, g.buoc, g.kieu, g.noi_dung, g.buoi_hoc, g.luc FROM loi_go g WHERE g.bam = ? AND g.kieu IN ('ngan', 'lop') ORDER BY g.buoc, g.luc", bam)
  const tenBuoi = new Map<string, string>()
  const idBuoi = [...new Set(rows.map((x) => str(x.buoi_hoc)).filter(Boolean))]
  if (idBuoi.length) for (const x of (await hoiAnToan(env, 'SELECT id, ten FROM buoi_hoc WHERE id IN (SELECT value FROM json_each(?))', JSON.stringify(idBuoi))) ?? []) tenBuoi.set(str(x.id), str(x.ten))
  if (rows.length) {
    const luc = new Date(nowMs).toISOString()
    await env.DB.batch(rows.map((x) => env.DB.prepare('INSERT OR IGNORE INTO loi_go_doc (sbd, go_id, luc) VALUES (?,?,?)').bind(sbd, str(x.id), luc))).catch(() => null)
  }
  return {
    ok: true,
    loiGo: rows.map((x) => ({ buoc: num(x.buoc), kieu: str(x.kieu) as 'ngan' | 'lop', noiDung: str(x.noi_dung), luc: str(x.luc), ...(str(x.buoi_hoc) ? { buoiHoc: tenBuoi.get(str(x.buoi_hoc)) || '' } : {}) })),
  }
}
