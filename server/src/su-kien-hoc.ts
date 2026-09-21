// SỔ SỰ KIỆN HỌC — GĐ 0 của "tiến bộ từng ngày" (DE-XUAT-CA-NHAN-HOA-1909.md mục 1.1).
//
// MỘT hàm ghi duy nhất (`ghiSuKien`) cho cả bảy nguồn kết quả. Bảy chỗ chấm bài
// đã cầm sẵn đáp án trong tay; chỉ thiếu một dòng gọi hàm này. Kênh nào chấm thì
// kênh đó ghi sổ — không kênh nào phải "đồng bộ" từ kênh khác.
//
// LUẬT (khoá bằng tests/su-kien-hoc-1909.test.ts):
//   - Bỏ trống = NULL, KHÔNG phải sai (khớp dem-ket-qua-test4 và bảng lên bảng).
//   - Đúng/sai chấm bằng `isAnswerCorrect` — một luật duy nhất cho sổ. Điểm bài
//     đã công bố vẫn giữ hàm cũ của từng nguồn; sổ không đổi điểm của ai.
//   - Ghi lại cùng một khoá thì KHÔNG thêm dòng (idempotent). Riêng ca thi:
//     chấm lại (đổi đáp án đúng) thì cập nhật kết quả, vì `chamDiem` cũng ghi đè.
//   - Ghi sổ KHÔNG BAO GIỜ làm hỏng lượt nộp: lỗi (vd. chưa chạy migration) chỉ
//     được báo qua console và giá trị trả về; đường `/ho-so/nap-lai` vá chỗ hụt.
//   - Hàm thuần (`suKien*`) không đọc đồng hồ: `luc` do nơi gọi truyền vào.
import type { D1PreparedStatement, Env } from './kieu'
import { answerText, homeworkQuestions, isAnswerCorrect } from './btvn-grading'

export type NguonSuKien = 'thi' | 'btvn' | 'btvn_lo' | 'khac_phuc' | 'mom' | 'len_bang' | 'game' | 'luyen' | 'on_lai' | 'thu_thach_rieng'

export const CAC_NGUON: readonly NguonSuKien[] = ['thi', 'btvn', 'btvn_lo', 'khac_phuc', 'mom', 'len_bang', 'game', 'luyen', 'on_lai', 'thu_thach_rieng']

export interface SuKien {
  nguon: NguonSuKien
  /** Mã bài gốc: ma_ca · ma_btvn · mã phiếu · id bài Mom · session game · id luyện đề. */
  maNguon: string
  sbd: string
  qid: string
  /** Lần làm trong cùng nguồn: lượt thi · lượt làm BTVN · chỉ số lô · lượt nộp khắc phục. */
  lan: number
  /** 1 đúng · 0 sai · null bỏ trống/chưa làm. */
  ketQua: 0 | 1 | null
  giay?: number | null
  /** ISO 8601. */
  luc: string
  maDang?: string | null
  chuyenDe?: string
  mucDo?: string
}

// --- Số nhỏ ----------------------------------------------------------------

/** Số dòng sự kiện trong MỘT câu lệnh SQL (đọc qua `json_each`, một tham số). */
export const DONG_MOI_LENH = 40
/** Số câu lệnh trong MỘT lượt `batch` gửi D1. */
export const LENH_MOI_GOI = 25

const GIO_VN_MS = 7 * 3600_000

/** Ngày lịch Việt Nam (+07:00) `YYYY-MM-DD` của một thời điểm; '' nếu không đọc được. */
export function ngayVn(luc: string | number | Date): string {
  const ms = luc instanceof Date ? luc.getTime() : typeof luc === 'number' ? luc : Date.parse(luc)
  if (!Number.isFinite(ms)) return ''
  return new Date(ms + GIO_VN_MS).toISOString().slice(0, 10)
}

export function khoaSuKien(e: Pick<SuKien, 'nguon' | 'maNguon' | 'sbd' | 'qid' | 'lan'>): string {
  return `${e.nguon}|${e.maNguon}|${e.sbd}|${e.qid}|${e.lan}`
}

/** Phần I/II/III đọc từ đuôi mã câu (`<đề>-II-3`); không có đuôi thì dùng `macDinh`. */
export function phanTuQid(qid: string, macDinh: string = 'I'): string {
  return /-(III|II|I)-\d+$/.exec(qid)?.[1] ?? macDinh
}

/** Ô chọn bỏ trống: rỗng, hoặc chỉ toàn gạch (`----` là Phần II chưa chọn ý nào). */
export function laBoTrong(chon: unknown): boolean {
  const s = String(chon ?? '').trim()
  return s === '' || /^[-–—_\s]+$/.test(s)
}

/** Nhãn "Hoá học" là chữ điền tạm của app Mom khi câu không có chuyên đề — không phải chuyên đề thật. */
export function chuyenDeThat(v: unknown): string {
  const s = String(v ?? '').trim()
  return s === 'Hoá học' || s === 'Hóa học' ? '' : s
}

// --- Dựng sự kiện từ từng nguồn (thuần) -----------------------------------

export interface CauThi {
  qid?: unknown
  chuyenDe?: unknown
  mucDo?: unknown
  dapAnChon?: unknown
  /** true/1 đúng · false/0 sai · null/undefined chưa chấm. */
  dungSai?: unknown
  giay?: unknown
}

/** Ca thi: đọc thẳng từ dòng chi tiết đã chấm. Chưa chấm (`dungSai` null) thì không có sự kiện. */
export function suKienThi(maCa: string, sbd: string, lanThu: number, luc: string, cau: CauThi[]): SuKien[] {
  const ra: SuKien[] = []
  for (const c of cau) {
    const qid = String(c.qid ?? '').trim()
    if (!qid) continue
    const ds = c.dungSai
    if (ds === null || ds === undefined) continue
    const dung = ds === true || ds === 1
    ra.push({
      nguon: 'thi',
      maNguon: maCa,
      sbd,
      qid,
      lan: lanThu,
      ketQua: laBoTrong(c.dapAnChon) ? null : dung ? 1 : 0,
      giay: Number(c.giay) > 0 ? Math.round(Number(c.giay)) : null,
      luc,
      chuyenDe: chuyenDeThat(c.chuyenDe),
      mucDo: String(c.mucDo ?? '').trim(),
    })
  }
  return ra
}

/** Một câu có đáp án đúng, dùng để chấm lại bằng `isAnswerCorrect`. */
export interface CauChamBai {
  qid: string
  dapAnDung: string
  chuyenDe?: string
  mucDo?: string
  phan?: string
}

/** Câu trong tờ kho (`homeworkQuestions`) → câu chấm được. Không có đáp án thì bỏ — không đoán. */
export function cauTuKho(cau: Record<string, unknown>[]): CauChamBai[] {
  const ra: CauChamBai[] = []
  for (const c of cau) {
    const qid = String(c.qid ?? c.id ?? '').trim()
    const dung = answerText(c.dap_an ?? c.dapAn) // cùng nguồn đáp án với `homeworkKeys`
    if (!qid || !dung) continue
    ra.push({
      qid,
      dapAnDung: dung,
      chuyenDe: chuyenDeThat(c.chuyen_de ?? c.chuyenDe),
      mucDo: String(c.muc_do ?? c.mucDo ?? '').trim(),
      phan: typeof c.phan === 'string' ? c.phan : undefined,
    })
  }
  return ra
}

/** Nguồn nộp bài có đáp án cả tờ: BTVN, khắc phục, Mom, lô BTVN. Bỏ trống → NULL. */
export function suKienChamBai(
  nguon: NguonSuKien,
  maNguon: string,
  sbd: string,
  lan: number,
  luc: string,
  cau: CauChamBai[],
  dapAn: Record<string, unknown>,
): SuKien[] {
  const ra: SuKien[] = []
  for (const c of cau) {
    const qid = c.qid.trim()
    if (!qid) continue
    const chon = answerText(dapAn[qid])
    ra.push({
      nguon,
      maNguon,
      sbd,
      qid,
      lan,
      ketQua: laBoTrong(chon) ? null : isAnswerCorrect(chon, c.dapAnDung, phanTuQid(qid, c.phan ?? 'I')) ? 1 : 0,
      luc,
      chuyenDe: chuyenDeThat(c.chuyenDe),
      mucDo: (c.mucDo ?? '').trim(),
    })
  }
  return ra
}

/** Ném khi lượt nạp lại hết ngân sách đọc R2 — phải đi thẳng lên `napLaiTuR2`, không bị nuốt. */
export class HetLuotDoc extends Error {}

/** Mã tờ kho gốc của một qid (`DH-12-C1-B2-I-49` → `DH-12-C1-B2`). */
export function gocTuQid(qid: string): string {
  return qid.replace(/-(III|II|I)-\d+$/, '')
}

/**
 * Khắc phục không có phiếu trên R2 (phiếu `sua_loi_*` do máy em tự sinh — cả 189 bài đã nộp tính
 * đến 19/09 đều rơi vào đây, `so_cau = 0`): chấm bằng CHÍNH tờ kho theo qid, như BTVN. Chỉ lấy đúng
 * những câu em đã gửi lên (không biết phiếu còn câu nào khác). Tờ kho thiếu thì bỏ câu đó, không đoán.
 */
export async function cauTuKhoTheoQid(
  env: Env,
  qids: string[],
  docKho: (goc: string) => Promise<Record<string, unknown>[]> = (g) => homeworkQuestions(env, g),
): Promise<CauChamBai[]> {
  const can = new Set(qids.filter((q) => /-(III|II|I)-\d+$/.test(q)))
  const goc = [...new Set([...can].map(gocTuQid))]
  const ra: CauChamBai[] = []
  for (const g of goc) {
    try {
      ra.push(...cauTuKho(await docKho(g)).filter((c) => can.has(c.qid)))
    } catch (e) {
      if (e instanceof HetLuotDoc) throw e
      console.warn('[su-kien-hoc] không đọc được tờ kho', g, e instanceof Error ? e.message : e)
    }
  }
  return ra
}

/**
 * BTVN cả bài: dựng sự kiện từ CHÍNH kết quả `gradeHomework` (đường chấm cũ, giữ nguyên) — không
 * đọc lại tờ kho. `qidSai` = câu sai HOẶC bỏ trống; câu đúng chắc chắn có đáp án, nên hợp của hai
 * tập ra đủ mọi câu có đáp án của tờ. Bỏ trống (kể cả `----` Phần II) → NULL, còn lại sai → 0.
 * Chuyên đề/mức độ để trống: GĐ 1 tra theo qid từ `cau_hoi` / `game_v2_question`.
 */
export function suKienTuKetQuaCham(
  nguon: NguonSuKien,
  maNguon: string,
  sbd: string,
  lan: number,
  luc: string,
  graded: { answers: Record<string, string>; qidSai: string[] },
): SuKien[] {
  const sai = new Set(graded.qidSai)
  const ra: SuKien[] = []
  for (const qid of new Set([...graded.qidSai, ...Object.keys(graded.answers)])) {
    ra.push({
      nguon, maNguon, sbd, qid, lan, luc,
      ketQua: laBoTrong(graded.answers[qid]) ? null : sai.has(qid) ? 0 : 1,
    })
  }
  return ra
}

// --- Ghi sổ ----------------------------------------------------------------

export interface TuyChonGhi {
  /** Cập nhật kết quả khi khoá đã có. CHỈ ca thi dùng (chấm lại ghi đè chi_tiet_cau). */
  capNhat?: boolean
  /** BTVN lượt 1: bỏ qua câu đã có sự kiện `btvn_lo` cùng bài — nộp cả bài không ghi trùng lô. */
  tranhTrungLo?: boolean
}

export interface KetQuaGhi {
  ok: boolean
  /** Số dòng đã gửi D1 (sau khi bỏ dòng hỏng và dòng trùng khoá trong cùng lượt). */
  soGui: number
  /** Số dòng bị bỏ vì thiếu qid/sbd hoặc `luc` không đọc được. */
  boQua: number
  loi?: string
}

const COT =
  'khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de, muc_do'

/** Đọc một dòng từ JSON (một tham số duy nhất — tránh giới hạn 100 tham số của D1). */
const CHON_TU_JSON = `SELECT json_extract(j.value,'$.k'), json_extract(j.value,'$.s'), json_extract(j.value,'$.q'),
       json_extract(j.value,'$.n'), json_extract(j.value,'$.m'), json_extract(j.value,'$.l'),
       json_extract(j.value,'$.r'), json_extract(j.value,'$.g'), json_extract(j.value,'$.t'),
       json_extract(j.value,'$.d'), json_extract(j.value,'$.a'), json_extract(j.value,'$.c'),
       json_extract(j.value,'$.u')
  FROM json_each(?) j`

const SQL_BO_QUA_TRUNG = `INSERT OR IGNORE INTO su_kien_hoc (${COT}) ${CHON_TU_JSON}`

const SQL_TRANH_TRUNG_LO = `INSERT OR IGNORE INTO su_kien_hoc (${COT}) ${CHON_TU_JSON}
 WHERE NOT EXISTS (SELECT 1 FROM su_kien_hoc x
                    WHERE x.nguon = 'btvn_lo' AND x.ma_nguon = json_extract(j.value,'$.m')
                      AND x.sbd = json_extract(j.value,'$.s') AND x.qid = json_extract(j.value,'$.q'))`

// `WHERE 1` là bắt buộc: SQLite cần nó để phân biệt `ON CONFLICT` của INSERT với của phép nối.
const SQL_CAP_NHAT = `INSERT INTO su_kien_hoc (${COT}) ${CHON_TU_JSON}
 WHERE 1
 ON CONFLICT(khoa) DO UPDATE SET
   ket_qua = excluded.ket_qua,
   giay = COALESCE(excluded.giay, su_kien_hoc.giay),
   luc = excluded.luc,
   ngay_vn = excluded.ngay_vn,
   chuyen_de = COALESCE(NULLIF(excluded.chuyen_de, ''), su_kien_hoc.chuyen_de),
   muc_do = COALESCE(NULLIF(excluded.muc_do, ''), su_kien_hoc.muc_do)`

let daBaoThieuBang = false

/** Ghi sổ. KHÔNG BAO GIỜ ném lỗi ra ngoài — xem đầu tệp. */
export async function ghiSuKien(env: Env, ds: SuKien[], tuy: TuyChonGhi = {}): Promise<KetQuaGhi> {
  const hang = new Map<string, Record<string, unknown>>()
  let boQua = 0
  for (const e of ds) {
    const ngay = ngayVn(e.luc)
    if (!e.sbd || !e.qid || !ngay) {
      boQua++
      continue
    }
    const k = khoaSuKien(e)
    // Trong cùng một lượt gọi: chế độ cập nhật thì dòng sau thắng, còn lại dòng đầu thắng —
    // đúng thứ SQL sẽ làm nếu gửi từng dòng một.
    if (hang.has(k) && !tuy.capNhat) continue
    hang.set(k, {
      k, s: e.sbd, q: e.qid, n: e.nguon, m: e.maNguon, l: e.lan,
      r: e.ketQua, g: e.giay ?? null, t: e.luc, d: ngay,
      a: e.maDang ?? null, c: e.chuyenDe ?? '', u: e.mucDo ?? '',
    })
  }
  const dong = [...hang.values()]
  if (dong.length === 0 || !env.DB) return { ok: true, soGui: 0, boQua }

  const sql = tuy.capNhat ? SQL_CAP_NHAT : tuy.tranhTrungLo ? SQL_TRANH_TRUNG_LO : SQL_BO_QUA_TRUNG
  const lenh: D1PreparedStatement[] = []
  for (let i = 0; i < dong.length; i += DONG_MOI_LENH) {
    lenh.push(env.DB.prepare(sql).bind(JSON.stringify(dong.slice(i, i + DONG_MOI_LENH))))
  }
  try {
    for (let i = 0; i < lenh.length; i += LENH_MOI_GOI) await env.DB.batch(lenh.slice(i, i + LENH_MOI_GOI))
    return { ok: true, soGui: dong.length, boQua }
  } catch (e) {
    const loi = e instanceof Error ? e.message : String(e)
    if (/no such table/i.test(loi)) {
      if (!daBaoThieuBang) {
        daBaoThieuBang = true
        console.warn('[su-kien-hoc] chưa có bảng su_kien_hoc — chạy server/migration-1909-su-kien-hoc.sql. Lượt nộp vẫn được lưu bình thường.')
      }
    } else {
      console.error('[su-kien-hoc] không ghi được sổ:', loi)
    }
    return { ok: false, soGui: 0, boQua, loi }
  }
}

// --- Ghi sổ cho ca thi (dùng chung bởi `chamDiem` và `luuChiTietCauNeuChuaCo`) ----

export interface LuotThi {
  sbd: string
  lanThu: number
  cau: CauThi[]
}

/**
 * Sự kiện thi mang giờ NỘP BÀI của lượt (`luot.nop_luc`), không phải giờ chấm:
 * thầy chấm lại sau vài ngày thì bằng chứng vẫn nằm đúng ngày em làm. Một câu
 * truy vấn cho cả lô lượt; không có `nop_luc` thì dùng `luc` dự phòng.
 */
export async function ghiSuKienThi(env: Env, maCa: string, ds: LuotThi[], lucDuPhong: string): Promise<KetQuaGhi> {
  if (ds.length === 0 || !env.DB) return { ok: true, soGui: 0, boQua: 0 }
  const nop = new Map<string, string>()
  try {
    const rieng = [...new Set(ds.map((x) => x.sbd))]
    const cho = rieng.map(() => '?').join(',')
    const r = await env.DB.prepare(`SELECT sbd, lan_thu, nop_luc FROM luot WHERE ma_ca = ? AND sbd IN (${cho}) AND nop_luc IS NOT NULL`)
      .bind(maCa, ...rieng)
      .all<{ sbd: string; lan_thu: number; nop_luc: string }>()
    for (const x of r.results ?? []) nop.set(`${x.sbd}|${x.lan_thu}`, String(x.nop_luc))
  } catch {
    /* Không tra được giờ nộp thì dùng giờ dự phòng — sổ vẫn ghi. */
  }
  const dsSk: SuKien[] = []
  for (const l of ds) {
    const luc = nop.get(`${l.sbd}|${l.lanThu}`) ?? lucDuPhong
    dsSk.push(...suKienThi(maCa, l.sbd, l.lanThu, Number.isFinite(Date.parse(luc)) ? luc : lucDuPhong, l.cau))
  }
  return ghiSuKien(env, dsSk, { capNhat: true })
}

// --- Lô BTVN: máy em gửi kèm đáp án của lô khi báo "xong lô" ---------------------

/**
 * Chấm và ghi sổ đáp án của MỘT lô. Chỉ chấm những câu máy em gửi lên (đúng
 * là các câu của lô — máy chủ chưa cắt lô ở GĐ 0). Không đọc được tờ kho thì
 * ghi nhận lỗi, KHÔNG làm hỏng việc báo xong lô.
 */
export async function ghiSuKienLoBtvn(
  env: Env,
  maBtvn: string,
  sbd: string,
  chiSoLo: number,
  dapAn: Record<string, unknown>,
): Promise<KetQuaGhi> {
  try {
    const bt = await env.DB.prepare('SELECT ma_de FROM btvn WHERE ma_btvn = ? AND da_xoa = 0')
      .bind(maBtvn)
      .first<{ ma_de: string }>()
    if (!bt) return { ok: false, soGui: 0, boQua: 0, loi: 'Không có bài tập này' }
    const cau = cauTuKho(await homeworkQuestions(env, String(bt.ma_de))).filter((c) => Object.hasOwn(dapAn, c.qid))
    return await ghiSuKien(env, suKienChamBai('btvn_lo', maBtvn, sbd, chiSoLo, new Date().toISOString(), cau, dapAn))
  } catch (e) {
    const loi = e instanceof Error ? e.message : String(e)
    console.error('[su-kien-hoc] không ghi được sổ lô BTVN:', loi)
    return { ok: false, soGui: 0, boQua: 0, loi }
  }
}

// --- Luyện đề: chấm bằng chamDeChuan, sổ lấy đúng kết quả từng câu đó ---------------

interface CauLuyen { id: string; chuyenDe?: unknown; dang?: { ma?: unknown } | null; mucDo?: unknown }

/**
 * `chiTiet[qid].points` là điểm câu (Phần I/III 0,25 · Phần II 0/0,1/0,25/0,5/1). Đúng = được
 * trọn điểm câu; ô bỏ trống → NULL. Đề luyện dùng thang riêng nên mốc "trọn" theo từng phần.
 */
export function suKienLuyenDe(
  sbd: string,
  idBai: string,
  luc: string,
  nguon: { phanI: CauLuyen[]; phanII: CauLuyen[]; phanIII: CauLuyen[] }[],
  dapAn: Record<string, string>,
  chiTiet: Record<string, { points: number }>,
): SuKien[] {
  const ra: SuKien[] = []
  const DIEM_TRON = { I: 0.25, II: 1, III: 0.25 } as const
  for (const s of nguon) {
    for (const phan of ['I', 'II', 'III'] as const) {
      for (const q of s[`phan${phan}`]) {
        const qid = String(q.id ?? '').trim()
        if (!qid) continue
        const v = String(dapAn[qid] ?? '')
        const diem = chiTiet[qid]?.points
        ra.push({
          nguon: 'luyen',
          maNguon: idBai,
          sbd,
          qid,
          lan: 1,
          ketQua: laBoTrong(v) ? null : typeof diem === 'number' && diem >= DIEM_TRON[phan] - 1e-9 ? 1 : 0,
          luc,
          maDang: q.dang?.ma ? String(q.dang.ma) : null,
          chuyenDe: chuyenDeThat(q.chuyenDe),
          mucDo: String(q.mucDo ?? '').trim(),
        })
      }
    }
  }
  return ra
}
