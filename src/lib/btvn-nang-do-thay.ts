/** BTVN "NÂNG ĐỠ" — LỚP NỐI của app thầy (Code 4, đề bài `prompt-btvn-nang-do.md`, thiết kế `DE-XUAT-BTVN-NANG-DO-2109.md`, bản vẽ `docs/ban-ve-btvn-nang-do-2109/`).
 *
 *  Mọi thứ dính tới hợp đồng máy chủ (tên trường, đường, hình dạng phản hồi) nằm ở ĐÂY và ở `giaoBtvn` — màn hình chỉ đọc các kiểu bên dưới. Hợp đồng chính thức
 *  `docs/hop-dong-btvn-nang-do-2109.md` (Code 3) đổi thì đổi tại đây, màn không vỡ. KIỂU dùng chung với lõi thuần của Code 1 (`btvn-nang-do.ts`, chỉ import KIỂU).
 *  Máy chủ chưa có lệnh ⇒ ném lỗi thật, KHÔNG giả số. Chỉ SỐ ĐẾM; không xếp hạng em với em. */
import type { CauGiao, Muc, NhanCau, PhanCau, Sao, TomTatBo } from './btvn-nang-do'
import type { TeacherExamSource } from '../data/examContent'
import { layCauHinhMayChu } from './may-chu-moi'
import { loadTeacherSecret } from './exam-db'
import { laCauRutDuoc } from './cau-tu-luan'

/** Ghim câu "cả lớp bắt buộc": tối đa bấy nhiêu câu (thầy chốt qua bản vẽ 21/09). */
export const GHIM_TOI_DA = 10

export const TEN_MUC: Record<Muc, string> = { 0: 'Biết', 1: 'Hiểu', 2: 'Vận dụng' }

/** Mức độ dạng chữ của câu ('biet' | 'hieu' | 'van_dung') → thang số 0|1|2; chữ lạ/thiếu ⇒ 0 (Biết). Cùng quy ước với `mucTuChu` của Code 1. */
export function mucSo(chu: string | null | undefined): Muc {
  return chu === 'hieu' ? 1 : chu === 'van_dung' ? 2 : 0
}

/** Mã dạng để ĐẾM số dạng của bài: `dang` nếu có, không thì `CD:<chuyên đề>` — cùng quy ước với `maDangCua` của Code 1 (viết lại ở đây để màn không phụ thuộc thân hàm đó). */
export function maDangCuaThay(c: Pick<CauGiao, 'dang' | 'chuyenDe'>): string {
  return c.dang ?? `CD:${c.chuyenDe}`
}

/** Mã tờ kho GỐC của máy chủ: bỏ hậu tố phần `-TN/-DS/-TLN` (server/src/btvn-grading.ts `homeworkQuestions`, giống `goPhanKhoiMaDe` ở index.ts). */
export function maDeGocMayChu(maDe: string): string {
  return maDe.trim().replace(/-(?:TN|DS|TLN)$/, '')
}

/** Máy chủ BỎ HẲN mục dạy học `-VD` / `-DT` khỏi bài tập (homeworkQuestions) — không gửi câu của mục ấy. */
export function mayChuBoMucDayHoc(maDe: string): boolean {
  return /(?:-VD|-DT)(?:-|$)/i.test(maDe.trim())
}

/** Máy chủ BỎ câu phần III có đáp án dạng chữ dài / nhiều ý (không chấm tự động được) — chép đúng điều kiện ở `homeworkQuestions`. Câu bị bỏ thì không gửi, để `boQuaQid` không báo oan. */
export function mayChuBoCauTuLuan(dapAn: string): boolean {
  const da = String(dapAn ?? '').trim()
  return (da.length > 20 && /\s/.test(da)) || /[\n;→⇌:]/.test(da)
}

/** MÃ CÂU gửi máy chủ = mã máy chủ dùng để chấm: `<mã tờ kho gốc>-<phần>-<số câu>` (server/src/btvn-grading.ts:128, hợp đồng dòng 7; ví dụ `DH-12-C1-B2-I-49`).
 *  Máy thầy không giữ trường `so`, chỉ có `q.id`. Khi câu KHÔNG mang mã riêng thì `q.id = <ma_de>-<phần>-<so>` (exam-kho-de-import.ts) ⇒ đuôi chính là `so`, còn tiền tố
 *  có thể là mã gốc hoặc mã đã có hậu tố phần (tờ nạp sẵn theo phần: `X-TN-I-3` ⇒ `X-I-3`). Câu mang mã riêng của tờ KHÁC (tờ ghép) thì đuôi không phải `so` của tờ này
 *  ⇒ trả `null`, KHÔNG đoán (đoán sai ra mã của câu khác = gắn nhãn nhầm): máy chủ tự điền nhãn câu ấy từ tờ kho và đếm vào `thieuMeta`. */
export function qidCuaCau(maDe: string, phan: PhanCau, q: { id: string }): string | null {
  const m = /^(.*)-(III|II|I)-(\d+)$/.exec(String(q.id ?? '').trim())
  if (!m || m[2] !== phan) return null
  if (m[1] !== maDeGocMayChu(maDe) && m[1] !== maDe.trim()) return null
  return `${maDeGocMayChu(maDe)}-${phan}-${Number(m[3])}`
}

type CauTrongDe = { id: string; chuyenDe?: string; mucDo?: 'biet' | 'hieu' | 'van_dung'; dang?: { ma: string; ten: string } | null; canChua?: { sao?: Sao }; correct?: unknown }

/** Các câu của những tờ đề thầy đã tick, đúng THỨ TỰ kho (phần I → II → III), kèm dạng/mức/sao đọc từ `LoiGiaiMeta` trên MÁY THẦY. Thiếu thì để trống/0, không đoán.
 *  CHỈ gồm câu máy chủ thật sự nhận (mã dựng được, không thuộc mục dạy học, không phải câu phần III dạng tự luận, không trùng mã) — máy chủ tự lấy nhãn cho phần còn lại. */
export function taoCauGiao(dsDe: TeacherExamSource[]): CauGiao[] {
  const kq: CauGiao[] = []
  const daCo = new Set<string>()
  for (const de of dsDe) {
    if (mayChuBoMucDayHoc(de.maDe)) continue
    for (const [phan, ds] of [['I', de.phanI], ['II', de.phanII], ['III', de.phanIII]] as [PhanCau, CauTrongDe[]][]) {
      for (const q of ds ?? []) {
        if (phan === 'III' && mayChuBoCauTuLuan(String(q.correct ?? ''))) continue
        if (!laCauRutDuoc(q as Record<string, unknown>, phan)) continue // CẤM RÚT CÂU TỰ LUẬN (thầy lệnh 21/09): định nghĩa chung `cau-tu-luan.ts` (máy chủ dùng cùng hàm)
        const qid = qidCuaCau(de.maDe, phan, q)
        if (!qid || daCo.has(qid)) continue
        daCo.add(qid)
        kq.push({
          qid,
          dang: q.dang?.ma ?? null,
          chuyenDe: q.chuyenDe ?? '',
          mucDo: mucSo(q.mucDo),
          sao: (q.canChua?.sao ?? 0) as Sao,
          phan,
        })
      }
    }
  }
  return kq
}

// ─────────────────────────────── XEM TRƯỚC PHÂN BỔ ───────────────────────────────
// Hợp đồng `docs/hop-dong-btvn-nang-do-2109.md` mục 5 (Code 3): `POST /btvn/xem-truoc`, thầy, CHỈ ĐỌC, ≤ 50 em mỗi lượt.

/** Số em tối đa mỗi lượt gọi `/btvn/xem-truoc`. */
export const EM_MOI_LUOT = 50

/** Hạt giống của MỘT hộp thoại giao: sinh MỘT lần, dùng chung cho `/btvn/xem-truoc` và `/btvn/giao` để bộ xem trước khớp bộ thật (≤ 40 ký tự). */
export function taoHatGiong(): string {
  const ngauNhien = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().replace(/-/g, '').slice(0, 12) : Math.floor(Math.random() * 1e12).toString(36)
  return `g${Date.now().toString(36)}${ngauNhien}`.slice(0, 40)
}

export interface EmXemTruoc {
  sbd: string
  hoTen: string
  /** Em đã mở bài và bộ đã CHỐT (chỉ có ở chế độ sau giao). */
  daChot: boolean
  /** `false` = em chưa có hồ sơ (chặng 1 kiêm chẩn đoán). */
  coHoSo: boolean
  tomTat: TomTatBo
}

/** Danh sách câu của MỘT em (chỉ có cho `sbdChiTiet`). */
export interface ChiTietEmXemTruoc {
  sbd: string
  chang: string[][]
  nhan: Record<string, NhanCau>
  /** BẢN 1.2: mã các câu "THỬ SỨC THÊM · không bắt buộc" của em (lõi cao hơn bậc của em). KHÔNG nằm trong `chang`; máy học sinh xếp thành một nhóm riêng SAU chặng cuối. Vắng / em khá ⇒ []. */
  thuSucThem: string[]
  /** LỊCH MỞ từng chặng (bản 1.1, Code 3): `moLuc` ISO UTC. Có luôn (hạn dài: mỗi ngày một chặng mở 00:00). Vắng ⇒ []. */
  lich: { chiSo: number; moLuc: string; soCau: number }[]
  /** `true` = hạn NGẮN, chia chặng theo GIỜ trong cửa sổ học 20:00–23:59 ⇒ chỉ khi ấy màn hiện giờ từng chặng. */
  theoGio: boolean
}

export interface KetQuaXemTruoc {
  hatGiong: string
  soCauBai: number
  soLoi: number
  /** Cảnh báo của máy chủ lúc xem trước (chỉ chế độ "trước khi giao"): 'loi_it_hon_6' ⇒ lõi < 6 câu. Vắng ⇒ null. */
  canhBao: string | null
  /** Hạn quá ngắn so với sức em (bản 1.1): mỗi em tối thiểu N câu lõi trong M phiên học — cân nhắc lùi hạn. Vắng ⇒ null. */
  canhBaoHanNgan: { soCauLoiToiThieu: number; soPhien: number } | null
  /** qid máy thầy gửi mà tờ kho không có (bị bỏ) · số câu của tờ mà máy thầy không gửi được nhãn (máy chủ tự điền) — cùng nghĩa như ở `/btvn/giao`. */
  boQuaQid: string[]
  thieuMeta: number
  /** Lõi chung (qid) — giống nhau ở mọi em. */
  loi: string[]
  ds: EmXemTruoc[]
  chiTiet: ChiTietEmXemTruoc | null
}

export interface DauVaoXemTruoc {
  /** ≤ 50 em mỗi lượt (`EM_MOI_LUOT`). */
  dsSbd: string[]
  dsMaDe: string[]
  cau: CauGiao[]
  ghim: string[]
  /** ISO — hạn nộp thầy đặt (để trống thì màn dùng mặc định 48 giờ như lúc giao). */
  hanNop: string
  hatGiong: string
  sbdChiTiet?: string
}

const HAN_GIAY = 20

function docLich(v: unknown): { chiSo: number; moLuc: string; soCau: number }[] {
  if (!Array.isArray(v)) return []
  return (v as Record<string, unknown>[])
    .filter((x) => x && typeof x === 'object' && Number.isFinite(Number(x.chiSo)) && typeof x.moLuc === 'string' && Number.isFinite(Date.parse(x.moLuc)))
    .map((x) => ({ chiSo: Number(x.chiSo), moLuc: String(x.moLuc), soCau: Number(x.soCau) || 0 }))
}
function docHanNgan(v: unknown): { soCauLoiToiThieu: number; soPhien: number } | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const n = Number(o.soCauLoiToiThieu)
  const m = Number(o.soPhien)
  return Number.isFinite(n) && n > 0 && Number.isFinite(m) && m > 0 ? { soCauLoiToiThieu: n, soPhien: m } : null
}

/** Lệnh thầy CHỈ ĐỌC `/btvn/xem-truoc` (không ghi gì). Máy chủ chưa có lệnh (404), mất mạng, quá hạn hay từ chối ⇒ NÉM lỗi bằng lời — màn hiện đúng câu ấy. */
export async function xemTruocPhanBo(v: DauVaoXemTruoc): Promise<KetQuaXemTruoc> {
  const [ch, mat] = await Promise.all([layCauHinhMayChu(), loadTeacherSecret()])
  if (!ch.URL) throw new Error('Chưa kết nối được máy chủ.')
  const dk = new AbortController()
  const hen = setTimeout(() => dk.abort(), HAN_GIAY * 1000)
  let res: Response
  try {
    res = await fetch(`${ch.URL}/btvn/xem-truoc`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': mat || '' },
      body: JSON.stringify({ dsSbd: v.dsSbd.slice(0, EM_MOI_LUOT), dsMaDe: v.dsMaDe, cau: v.cau, ghim: v.ghim, hanNop: v.hanNop, hatGiong: v.hatGiong, ...(v.sbdChiTiet ? { sbdChiTiet: v.sbdChiTiet } : {}) }),
      signal: dk.signal,
    })
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') throw new Error('Máy chủ trả lời chậm — chưa xem trước được. Thử lại sau ít phút.')
    throw new Error('Không nối được máy chủ — chưa xem trước được.')
  } finally {
    clearTimeout(hen)
  }
  if (res.status === 404) throw new Error('Máy chủ chưa có lệnh Xem trước phân bổ — chưa có số nào để hiện.')
  let j: Record<string, unknown> = {}
  try {
    j = (await res.json()) as Record<string, unknown>
  } catch {
    throw new Error('Máy chủ trả lời không đọc được — chưa xem trước được.')
  }
  if (!res.ok || j.ok !== true) throw new Error(String(j.error || j.loi || 'Máy chủ không cho xem trước.'))
  const ds = Array.isArray(j.ds) ? (j.ds as Record<string, unknown>[]) : []
  const ct = j.chiTiet as Record<string, unknown> | undefined
  return {
    hatGiong: String(j.hatGiong ?? v.hatGiong),
    soCauBai: Number(j.soCauBai) || v.cau.length,
    soLoi: Number(j.soLoi) || 0,
    canhBao: typeof j.canhBao === 'string' && j.canhBao ? j.canhBao : null,
    canhBaoHanNgan: docHanNgan(j.canhBaoHanNgan),
    boQuaQid: Array.isArray(j.boQuaQid) ? (j.boQuaQid as unknown[]).map(String) : [],
    thieuMeta: Number(j.thieuMeta) || 0,
    loi: Array.isArray(j.loi) ? (j.loi as unknown[]).map(String) : [],
    ds: ds.map((x) => ({ sbd: String(x.sbd ?? ''), hoTen: String(x.hoTen ?? ''), daChot: x.daChot === true, coHoSo: x.coHoSo !== false, tomTat: x.tomTat as TomTatBo })).filter((x) => x.sbd && x.tomTat),
    chiTiet:
      ct && Array.isArray(ct.chang)
        ? { sbd: String(ct.sbd ?? ''), chang: (ct.chang as unknown[][]).map((c) => (Array.isArray(c) ? c.map(String) : [])), nhan: (ct.nhan ?? {}) as Record<string, NhanCau>, thuSucThem: Array.isArray(ct.thuSucThem) ? (ct.thuSucThem as unknown[]).map(String) : [], lich: docLich(ct.lich), theoGio: ct.theoGio === true }
        : null,
  }
}

// ─────────────────────────────── NHÃN CHO THẦY ───────────────────────────────

/** Nhãn của câu THỬ SỨC THÊM (bản 1.2, Boss chốt 21/09): câu lõi cao hơn bậc của em — không bắt buộc, sai không tính, không hẹn ôn. */
export const NHAN_THU_SUC_THEM = 'Câu cốt lõi · thử sức thêm (sai không sao)'

/** BẢN 1.2 — "bắt buộc N câu · thử sức thêm M câu (không bắt buộc)" của MỘT em. Đọc CÓ CHỐNG THIẾU: máy chủ chưa trả `soThuSucThem` ⇒ `thuSucThem = null` (màn giữ cách hiện cũ, không bịa 0).
 *  `batBuoc` = `soBatBuoc` nếu có, không thì `tong` (Code 1: `tong` chính là số câu bắt buộc, không gồm thử sức thêm). */
export function batBuocVaThuSucThem(t: { tong: number; soBatBuoc?: number | null; soThuSucThem?: number | null }): { batBuoc: number; thuSucThem: number | null } {
  return {
    batBuoc: typeof t.soBatBuoc === 'number' ? t.soBatBuoc : t.tong,
    thuSucThem: typeof t.soThuSucThem === 'number' && t.soThuSucThem >= 0 ? t.soThuSucThem : null,
  }
}
/** Câu chữ đúng như Boss chốt. Em không có câu thử sức thêm (em khá, hoặc máy chủ chưa trả) ⇒ '' (không thêm chữ thừa). */
export function chuBatBuoc(batBuoc: number, thuSucThem: number | null): string {
  return thuSucThem != null && thuSucThem > 0 ? `bắt buộc ${batBuoc} câu · thử sức thêm ${thuSucThem} câu (không bắt buộc)` : ''
}

/** Dòng "bộ của em" ở tab theo dõi bài. null ⇒ em chưa mở bài (caller nói "Chưa mở bài — bộ câu chưa chốt"). Bản 1.2: có câu thử sức thêm ⇒ "bắt buộc N câu · thử sức thêm M câu (không bắt buộc)"; không có ⇒ chữ cũ. */
export function chuBoCuaEm(e: { soCauCuaEm?: number | null; soChang?: number | null; loDaXong?: number | null; soThuSucThem?: number | null }): string | null {
  if (e.soCauCuaEm == null) return null
  const chang = e.soChang != null ? ` · chặng ${e.loDaXong ?? 0}/${e.soChang}` : ''
  const bb = chuBatBuoc(e.soCauCuaEm, typeof e.soThuSucThem === 'number' ? e.soThuSucThem : null)
  return bb ? `Bộ của em: ${bb}${chang}` : `Bộ của em: ${e.soCauCuaEm} câu${chang}`
}

/** Nhãn + lý do của một câu trong bộ của em, đúng chữ bản vẽ (Code 2 dùng cùng bộ chữ cho em). Chỉ mô tả CÂU, không đánh giá em. */
export function nhanCuaCau(n: NhanCau | undefined): { chu: string; ly: string; loai: 'khoi_dong' | 'loi' | 'rieng' | 'thu_thach' } {
  switch (n) {
    case 'khoi_dong':
      return { chu: 'Khởi động', ly: 'câu mở đầu chặng', loai: 'khoi_dong' }
    case 'loi':
      return { chu: 'Cốt lõi', ly: 'câu cả lớp cùng làm', loai: 'loi' }
    case 'dang_yeu':
      return { chu: 'Dành riêng cho em', ly: 'dạng em đang yếu · đúng bậc của em', loai: 'rieng' }
    case 'cung_co':
      return { chu: 'Dành riêng cho em', ly: 'củng cố dạng em đang ổn', loai: 'rieng' }
    case 'thu_thach':
      return { chu: 'Thử thách · sai không sao', ly: '+1 bậc, chỉ ở dạng em đang ổn', loai: 'thu_thach' }
    case 'loi_cao':
      return { chu: NHAN_THU_SUC_THEM, ly: 'câu cả lớp cùng làm, cao hơn bậc của em — không bắt buộc, sai không sao', loai: 'thu_thach' }
    default:
      return { chu: 'Câu', ly: '', loai: 'loi' }
  }
}

// ─────────────────────────────── CHO LÀM LẠI (từng em, bài cá nhân hoá) ───────────────────────────────
// Thầy chốt 21/09: bài cá nhân hoá KHÔNG tự cho làm lại; thầy bấm "Cho làm lại" từng em. Lệnh thầy `POST /btvn/cho-lam-lai {maBtvn, sbd}` (mã bí mật) — máy chủ CHỈ nhận bài
// `ca_nhan=1`, em ĐÃ NỘP, bài CHƯA quá hạn (quá hạn ⇒ từ chối bằng lời). Làm: điểm cũ vào lịch sử, `so_lan_lam + 1`, em làm lại từ chặng 1, GIỮ bộ câu + hạn nộp. Ra `{ok, soLanLam}`.

/** Lời xác nhận NÓI THẬT trước khi cho làm lại (đúng chữ Boss/thầy chốt). */
export const LOI_XAC_NHAN_LAM_LAI = 'Em làm lại từ chặng 1, cùng bộ câu, hạn nộp không đổi; điểm mới thay điểm cũ, điểm cũ vẫn lưu trong lịch sử.'

/** Cho MỘT em làm lại. Ném lỗi bằng lời thật: máy chủ chưa có lệnh (404) · quá hạn chờ (CHƯA CHẮC đã làm — lệnh có thể đã tới) · máy chủ từ chối (giữ nguyên câu của máy chủ, gồm "quá hạn"). */
export async function choLamLaiBtvn(maBtvn: string, sbd: string): Promise<{ soLanLam: number | null }> {
  const [ch, mat] = await Promise.all([layCauHinhMayChu(), loadTeacherSecret()])
  if (!ch.URL) throw new Error('Chưa kết nối được máy chủ.')
  const dk = new AbortController()
  const hen = setTimeout(() => dk.abort(), HAN_GIAY * 1000)
  let res: Response
  try {
    res = await fetch(`${ch.URL}/btvn/cho-lam-lai`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': mat || '' }, body: JSON.stringify({ maBtvn, sbd }), signal: dk.signal })
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') throw new Error('Máy chủ trả lời chậm — CHƯA CHẮC đã cho em làm lại. Mở lại tab theo dõi để xem tình trạng thật.')
    throw new Error('Không nối được máy chủ — chưa cho em làm lại được. Kết quả của em vẫn giữ nguyên.')
  } finally {
    clearTimeout(hen)
  }
  if (res.status === 404) throw new Error('Máy chủ chưa có lệnh Cho làm lại — chưa mở lại được bài. Kết quả của em vẫn giữ nguyên.')
  let j: Record<string, unknown> = {}
  try {
    j = (await res.json()) as Record<string, unknown>
  } catch {
    throw new Error('Máy chủ trả lời không đọc được — CHƯA CHẮC đã cho em làm lại. Mở lại tab theo dõi để xem tình trạng thật.')
  }
  if (!res.ok || j.ok !== true) throw new Error(String(j.error || j.loi || 'Máy chủ không cho em làm lại. Kết quả của em vẫn giữ nguyên.'))
  return { soLanLam: typeof j.soLanLam === 'number' && Number.isFinite(j.soLanLam) ? j.soLanLam : null }
}

// ─────────────────────────────── CẢNH BÁO CỦA MÁY CHỦ + HẠN MẶC ĐỊNH ───────────────────────────────

/** Giờ VN của một mốc ISO: "20:00" (cùng ngày với `moc0`) hoặc "25/09 20:00" (khác ngày). Dùng cho lịch chặng theo GIỜ ở Xem trước. */
export function gioMoChang(iso: string, moc0?: string): string {
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return ''
  // Tự ghép từ các phần (định dạng của Intl khác nhau theo máy: "24/09" hay "24-09"), luôn theo giờ Việt Nam.
  const phan = (m: number) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(m).map((x) => [x.type, x.value]))
    return { ngay: `${p.year}-${p.month}-${p.day}`, dm: `${p.day}/${p.month}`, gio: `${p.hour}:${p.minute}` }
  }
  const cua = phan(ms)
  const goc = moc0 ? Date.parse(moc0) : NaN
  if (!Number.isFinite(goc) || phan(goc).ngay === cua.ngay) return cua.gio
  return `${cua.dm} ${cua.gio}`
}

/** Cảnh báo NÓI THẬT từ máy chủ về bộ câu (dùng chung cho lúc GIAO và lúc XEM TRƯỚC): hạn ngắn · lõi < 6 · mã câu bị bỏ · câu thiếu nhãn. Rỗng ⇒ không có gì cần nói. */
export function canhBaoTuMayChu(kq: { canhBao?: string | null; canhBaoHanNgan?: { soCauLoiToiThieu: number; soPhien: number } | null; soLoi?: number; boQuaQid?: string[]; thieuMeta?: number }): string[] {
  const canh: string[] = []
  if (kq.canhBaoHanNgan) canh.push(`Hạn ngắn: mỗi em tối thiểu ${kq.canhBaoHanNgan.soCauLoiToiThieu} câu lõi trong ${kq.canhBaoHanNgan.soPhien} phiên — cân nhắc lùi hạn.`)
  if (kq.canhBao === 'loi_it_hon_6') canh.push(`Lõi chung chỉ có ${kq.soLoi ?? 0} câu (dưới 6): so chống chép bài không đủ mẫu chung — bài vẫn giao.`)
  if ((kq.boQuaQid?.length ?? 0) > 0) canh.push(`Máy chủ không nhận ${kq.boQuaQid!.length} mã câu máy thầy gửi (lệch mã với tờ đề trong kho) nên bỏ qua — nhãn dạng/mức của các câu ấy lấy từ kho, cá nhân hoá có thể kém chính xác.`)
  if ((kq.thieuMeta ?? 0) > 0) canh.push(`${kq.thieuMeta} câu máy thầy không gửi được nhãn dạng/mức — máy chủ lấy từ tờ kho (thiếu nữa thì tính là mức Biết).`)
  return canh
}

/** Hạn nộp MẶC ĐỊNH của ô "Hạn nộp bài mới" (thầy chốt 21/09): giờ chốt mỗi ngày của học sinh là 23:59 (giờ Việt Nam). Giữ khoảng ~2 ngày như trước ("sau 48 giờ"): 23:59 của ngày (hôm nay VN + `soNgay`).
 *  Trả chuỗi cho `<input type="datetime-local">` ('YYYY-MM-DDT23:59'). */
export function hanMacDinhVN(nayMs: number, soNgay = 2): string {
  return `${new Date(nayMs + 7 * 3600_000 + soNgay * 86_400_000).toISOString().slice(0, 10)}T23:59`
}
