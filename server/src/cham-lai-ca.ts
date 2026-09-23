// CHẤM LẠI MỘT CA CŨ Ở MÁY CHỦ rồi GHI LẠI D1 (việc còn lại của MỤC 3, thầy chốt 23/09/2026).
//
// VÌ SAO CẦN. Ngày 23/09 luật chấm Phần III của CA THI đổi sang chính sách `so_hoc` dùng chung
// (`src/lib/cham-so.ts` — "0,540" = "0,54", "2,5×10^-3", "12 g/mol", "0,54."). Luật mới chỉ áp cho
// các lượt NỘP SAU đó: điểm của ca đã nộp trước vẫn nằm nguyên con số cũ (chấm sai) trên D1, trên
// bảng điểm của thầy và trên phiếu gửi phụ huynh. Đường này chấm lại bằng ĐÚNG luật hiện hành rồi
// ghi kết quả mới lên D1, và TRẢ RA bảng đối chiếu từng em cũ → mới (thầy soi, không phải tin lời
// "đã đồng bộ").
//
// HAI PHẦN, một hàm thuần một hàm đọc:
//   · `chamLaiMotCa` — THUẦN: nhận thông tin ca + ngân hàng đáp án + các lượt, chấm lại, trả bảng
//     đối chiếu + gói `bai` để ghi.
//   · `chuanBiChamLaiCa` — đọc `ca` (D1) + `key/<mã ca>.json` (R2) + bảng `luot` rồi gọi hàm thuần.
//
// KHÔNG tự viết đường ghi D1: chỗ gọi dùng lại `chamDiem` trong `index.ts` — MỘT đường ghi duy nhất
// cho ca thi (cập nhật `luot`, dựng lại `chi_tiet_cau`, `ban_do_sai`, `qid_da_lam`, `tien_do_ca/hs`,
// ghi sổ `su_kien_hoc`). Hai đường ghi là hai chỗ để điểm lệch nhau.
//
// LÕI CHẤM LÀ CỦA APP, KHÔNG CHÉP LẠI: `assignStudentQuestions` (rút đúng bộ câu của em) +
// `scoreStudent` (`src/engine/score.ts`) — hai hàm KHÔNG phụ thuộc giao diện nên máy chủ import thẳng
// được. Tệp này chỉ dựng phần "keo" (gói đáp án + dòng chi tiết câu). KHÔNG import `exam-grade.ts` /
// `chi-tiet-cau.ts` của app: hai tệp ấy kéo theo `exam-api.ts`/`exam-db.ts` (idb + cả cây giao diện),
// mà `server/tsconfig.json` không có `DOM`/`vite/client` nên `npx tsc -p server` sẽ đỏ hàng loạt vì
// các tệp giao diện của khách.
import type { Env, DongCa } from './kieu'
import { caDaXong, docTrangThaiCongBo } from './cong-bo-diem'
import { assignStudentQuestions } from '../../src/lib/exam-assign'
import { boCauTuBaiLam } from '../../src/lib/bo-cau-tu-bai-lam'
import { khopPhanIII } from '../../src/lib/cham-so'
import { scoreStudent, type AnswerKey, type Choice, type DS, type GradedItem, type ScoreResult, type SoCauBaPhan, type StudentAnswers } from '../../src/engine/score'
import type { SoCauMoiPhan, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../../src/data/examContent'

/** Ngân hàng CÓ ĐÁP ÁN của ca — đúng thứ `mergeKeepAnswers` cất lên R2 lúc mở ca (`key/<mã ca>.json`).
 *  `soCau` là mẫu số; `boTheoEm` là bản đồ câu của từng em của ca ĐỀ RIÊNG (chốt lúc phát đề). */
export interface NganHangDapAn {
  phanI: TeacherMcqQuestion[]
  phanII: TeacherTrueFalseQuestion[]
  phanIII: TeacherShortAnswerQuestion[]
  soCau?: SoCauMoiPhan
  boTheoEm?: Record<string, string[]> | Record<string, unknown>
}

/** Bài làm của một em trong `luot.dap_an_json` — CÙNG hình dạng `AnswerRecord` của app, khai lại tại
 *  đây để máy chủ không phải kéo `exam-db.ts` (IndexedDB) vào. */
export interface BaiLamEm {
  phanI: Record<string, 'A' | 'B' | 'C' | 'D'>
  phanII: Record<string, ('D' | 'S' | null)[]>
  phanIII: Record<string, string>
}

/** MỘT dòng chi tiết câu — đúng khuôn bảng `chi_tiet_cau` mà `chamDiem` ghi (và khuôn `ChiTietCauRow`). */
export interface DongChiTietCau {
  phan: 'I' | 'II' | 'III'
  soCau: number
  qid: string
  chuyenDe: string
  mucDo: string
  dapAnChon: string
  dapAnDung: string
  dungSai: boolean | null
  giay: number | null
}

/** Gói MỘT lượt để `/cham-diem` ghi — y hệt `BaiGhiDiem` của app. */
export interface GoiGhiDiem {
  sbd: string
  lanThu: number
  hoTen?: string
  diem: { I: number; II: number; III: number; tong: number }
  cau: DongChiTietCau[]
}

export interface DiemBaPhan {
  I: number | null
  II: number | null
  III: number | null
  tong: number | null
}

/** Một lượt đã đọc từ D1, đủ để chấm lại. */
export interface LuotChoCham {
  sbd: string
  hoTen: string
  lanThu: number
  trangThai: string
  dapAn: BaiLamEm | null
  giayCau: Record<string, number> | null
  /** Điểm ĐANG nằm trên D1 (bản cũ) — để đối chiếu. */
  diem: DiemBaPhan
}

export interface DoiDiemMotEm {
  sbd: string
  hoTen: string
  cu: DiemBaPhan
  moi: DiemBaPhan
  /** Điểm tổng có đổi không — thầy chỉ cần soi những em này. */
  doi: boolean
}

export interface KetQuaChamLaiMotCa {
  maCa: string
  tenCa: string
  soCau: SoCauBaPhan
  em: DoiDiemMotEm[]
  soDoi: number
  /** Gói để `/cham-diem` ghi — MỘT phần tử cho mỗi em đã nộp. */
  bai: GoiGhiDiem[]
  /** Em không chấm lại được (khóa đáp án hỏng / bài làm sai khuôn) — nói thẳng, KHÔNG ghi đè. */
  tuChoi: { sbd: string; viSao: string }[]
}

/** Đếm số câu mỗi phần của ngân hàng khi ca không khai `soCau`. */
function demSoCau(nh: NganHangDapAn): SoCauBaPhan {
  return { I: nh.phanI?.length ?? 0, II: nh.phanII?.length ?? 0, III: nh.phanIII?.length ?? 0 }
}

/** Đếm số giây của một câu — làm tròn, không âm; thiếu ⇒ null (không ghi 0 giả). Giống `chi-tiet-cau.ts`. */
function giayCua(giayCau: Record<string, number> | null | undefined, qid: string): number | null {
  const v = giayCau?.[qid]
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return null
  return Math.round(v)
}

/**
 * DỰNG LẠI BỘ CÂU CỦA MỖI EM TỪ BÀI LÀM khi ngân hàng không có `boTheoEm`.
 *
 * Ca đề riêng rút 8 câu từ kho 26 câu: không có bản đồ thì `assignStudentQuestions` rút lại bằng
 * hạt giống trên KHO HIỆN TẠI và ra một bộ KHÁC HẲN bộ em đã làm — sai điểm mà không báo gì (đã dính
 * ca 890691: cả 28 em tụt điểm). Đây là cùng luật `gomCa` đang dùng ở máy thầy, và cùng hàm
 * `boCauTuBaiLam` mà app dùng.
 */
function dungBoTuBaiLam(maCa: string, nh: NganHangDapAn, dsLuot: LuotChoCham[], soCau: SoCauBaPhan): Record<string, string[]> {
  const ra: Record<string, string[]> = {}
  for (const l of dsLuot) {
    if (!l.dapAn) continue
    ra[l.sbd] = boCauTuBaiLam(nh, maCa, l.sbd, l.dapAn, l.giayCau, soCau)
  }
  return ra
}

interface BankDaChuan {
  phanI: TeacherMcqQuestion[]
  phanII: TeacherTrueFalseQuestion[]
  phanIII: TeacherShortAnswerQuestion[]
  soCau: SoCauBaPhan
  boTheoEm: Record<string, string[]>
}

/**
 * CHẤM MỘT EM bằng ĐÚNG lõi chấm của app (`assignStudentQuestions` + `scoreStudent`) và dựng luôn
 * dòng chi tiết câu. Ném lỗi khi khóa đáp án hỏng — chỗ gọi bắt lấy và TỪ CHỐI ghi.
 *
 * PHẦN III dùng `khopPhanIII` (một luật với điểm). `chi-tiet-cau.ts` của app hiện còn so CHUỖI đã
 * chuẩn hoá ở chỗ này nên "0,540" ≠ "0,54" — LỆCH với `scoreStudent`; đường chấm lại KHÔNG lặp lại
 * lỗi ấy, đã báo để chủ tệp sửa (xem chú thích ở đầu tệp).
 */
function chamMotEm(bank: BankDaChuan, maCa: string, sbd: string, answers: BaiLamEm, giayCau: Record<string, number> | null): { score: ScoreResult; cau: DongChiTietCau[] } {
  const asg = assignStudentQuestions(bank, maCa, sbd)
  const key: AnswerKey = {
    madeThi: maCa,
    phanI: asg.phanI.map((a) => (a.question as TeacherMcqQuestion).correct),
    phanII: asg.phanII.map((a) => (a.question as TeacherTrueFalseQuestion).correct),
    phanIII: asg.phanIII.map((a) => (a.question as TeacherShortAnswerQuestion).correct),
  }
  const phanI: GradedItem<Choice>[] = asg.phanI.map((a) => ({ value: (answers.phanI[a.qid] as Choice | undefined) ?? null, flag: null }))
  const phanII: GradedItem<DS>[][] = asg.phanII.map((a) => {
    const row = answers.phanII[a.qid] ?? [null, null, null, null]
    return row.map((v) => ({ value: (v as DS | null) ?? null, flag: null }))
  })
  const phanIII: GradedItem<string>[] = asg.phanIII.map((a) => ({ value: answers.phanIII[a.qid] ?? null, flag: null }))
  const studentAnswers: StudentAnswers = { sbd, madeThi: maCa, phanI, phanII, phanIII }
  const score = scoreStudent(studentAnswers, key)

  const cau: DongChiTietCau[] = []
  asg.phanI.forEach((a, i) => {
    const q = a.question as TeacherMcqQuestion
    const chon = answers.phanI[a.qid] ?? ''
    cau.push({ phan: 'I', soCau: i + 1, qid: a.qid, chuyenDe: q.chuyenDe ?? '', mucDo: q.mucDo ?? '', dapAnChon: chon, dapAnDung: q.correct, dungSai: chon ? chon === q.correct : false, giay: giayCua(giayCau, a.qid) })
  })
  asg.phanII.forEach((a, i) => {
    const q = a.question as TeacherTrueFalseQuestion
    const row = answers.phanII[a.qid] ?? [null, null, null, null]
    const chon = row.map((v) => v ?? '-').join('')
    const dung = q.correct.join('')
    cau.push({ phan: 'II', soCau: i + 1, qid: a.qid, chuyenDe: q.chuyenDe ?? '', mucDo: q.mucDo ?? '', dapAnChon: chon, dapAnDung: dung, dungSai: chon === dung, giay: giayCua(giayCau, a.qid) })
  })
  asg.phanIII.forEach((a, i) => {
    const q = a.question as TeacherShortAnswerQuestion
    const chon = answers.phanIII[a.qid] ?? ''
    cau.push({ phan: 'III', soCau: i + 1, qid: a.qid, chuyenDe: q.chuyenDe ?? '', mucDo: q.mucDo ?? '', dapAnChon: chon, dapAnDung: q.correct, dungSai: khopPhanIII(chon, q.correct), giay: giayCua(giayCau, a.qid) })
  })
  return { score, cau }
}

/**
 * CHẤM LẠI MỘT CA — HÀM THUẦN. Mỗi em lấy LƯỢT NỘP MỚI NHẤT (giống màn Chi tiết ca): lượt `dang_lam`
 * chưa có bài thì BỎ QUA, nên chấm lại giữa ca cũng không đụng em đang làm.
 * Lượt nào chấm lỗi (khóa đáp án hỏng…) thì vào `tuChoi`, KHÔNG ghi đè điểm cũ.
 */
export function chamLaiMotCa(
  maCa: string,
  tenCa: string,
  nh: NganHangDapAn,
  dsLuot: LuotChoCham[],
  soCauCa?: SoCauBaPhan | null,
): KetQuaChamLaiMotCa {
  const soCau = soCauCa && soCauCa.I + soCauCa.II + soCauCa.III > 0 ? soCauCa : nh.soCau ?? demSoCau(nh)
  // Bản đồ câu của ca đề riêng: bản đã chốt lúc phát đề (trong ngân hàng); thiếu thì dựng lại từ bài làm.
  const boTheoEm: Record<string, string[]> =
    (nh.boTheoEm as Record<string, string[]> | undefined) ?? dungBoTuBaiLam(maCa, nh, dsLuot, soCau)
  const bank: BankDaChuan = { ...nh, soCau, boTheoEm }

  const theoSbd = new Map<string, LuotChoCham[]>()
  for (const l of dsLuot) {
    const arr = theoSbd.get(l.sbd)
    if (arr) arr.push(l)
    else theoSbd.set(l.sbd, [l])
  }

  const em: DoiDiemMotEm[] = []
  const bai: GoiGhiDiem[] = []
  const tuChoi: KetQuaChamLaiMotCa['tuChoi'] = []
  let soDoi = 0
  theoSbd.forEach((arr, sbd) => {
    const moiNhat = [...arr].sort((a, b) => b.lanThu - a.lanThu)[0]!
    if (!moiNhat.dapAn || (moiNhat.trangThai !== 'da_nop' && moiNhat.trangThai !== 'khoa')) return
    let kq: ReturnType<typeof chamMotEm>
    try {
      kq = chamMotEm(bank, maCa, sbd, moiNhat.dapAn, moiNhat.giayCau)
    } catch (e) {
      tuChoi.push({ sbd, viSao: e instanceof Error ? e.message : 'Không chấm được' })
      return
    }
    const moi: DiemBaPhan = {
      I: kq.score.phanIScore,
      II: kq.score.phanIIScore,
      III: kq.score.phanIIIScore,
      tong: kq.score.total,
    }
    const doi = moiNhat.diem.tong !== moi.tong
    if (doi) soDoi++
    em.push({ sbd, hoTen: moiNhat.hoTen, cu: moiNhat.diem, moi, doi })
    bai.push({ sbd, lanThu: moiNhat.lanThu, hoTen: moiNhat.hoTen, diem: { I: moi.I!, II: moi.II!, III: moi.III!, tong: moi.tong! }, cau: kq.cau })
  })

  return { maCa, tenCa, soCau, em, soDoi, bai, tuChoi }
}

// ---------------------------------------------------------------------------
// ĐỌC D1 / R2 rồi gọi hàm thuần.

function docJson(v: unknown): unknown {
  const t = String(v ?? '')
  if (!t) return null
  try {
    return JSON.parse(t)
  } catch {
    return null
  }
}

/** Bài làm trong `luot.dap_an_json` — chuẩn hoá ba phần về `{}` để hàm chấm không nổ vì thiếu khoá. */
function docBaiLam(v: unknown): BaiLamEm | null {
  const j = docJson(v)
  if (!j || typeof j !== 'object') return null
  const o = j as Record<string, unknown>
  return {
    phanI: (o.phanI && typeof o.phanI === 'object' ? o.phanI : {}) as BaiLamEm['phanI'],
    phanII: (o.phanII && typeof o.phanII === 'object' ? o.phanII : {}) as BaiLamEm['phanII'],
    phanIII: (o.phanIII && typeof o.phanIII === 'object' ? o.phanIII : {}) as BaiLamEm['phanIII'],
  }
}

export type KetQuaChuanBiChamLai =
  | ({ ok: true; soEmDaVao: number; soEmDaNop: number } & KetQuaChamLaiMotCa)
  | {
      ok: false
      lyDo: 'khong_co_ca' | 'ca_chua_xong' | 'chua_noi_r2' | 'chua_co_dap_an' | 'dap_an_hong'
      error: string
      soEmDaVao?: number
      soEmDaNop?: number
    }

/**
 * Đọc một ca CŨ đủ dữ liệu để chấm lại. CỔNG AN TOÀN:
 *   · Ca chưa xong (chưa đóng và còn em chưa nộp) ⇒ TỪ CHỐI — "ca cũ" nghĩa là đã xong.
 *   · Chưa cất ngân hàng đáp án lên R2 ⇒ TỪ CHỐI — không có khóa thì không chấm được.
 * Lượt chưa nộp nằm lại, không ghi gì: chỗ gọi chỉ ghi phần `bai` trả về.
 */
export async function chuanBiChamLaiCa(env: Env, maCa: string): Promise<KetQuaChuanBiChamLai> {
  const ca = await env.DB.prepare('SELECT * FROM ca WHERE ma_ca = ?').bind(maCa).first<DongCa>()
  if (!ca) return { ok: false, lyDo: 'khong_co_ca', error: 'Không có ca này' }

  const t = (await docTrangThaiCongBo(env, [maCa])).get(maCa)
  const soEmDaVao = t?.soEmDaVao ?? 0
  const soEmDaNop = t?.soEmDaNop ?? 0
  if (!caDaXong(String(ca.trang_thai ?? ''), soEmDaVao, soEmDaNop)) {
    return { ok: false, lyDo: 'ca_chua_xong', error: 'Ca chưa xong — chỉ chấm lại được ca đã đóng hoặc đã đủ lớp nộp', soEmDaVao, soEmDaNop }
  }
  if (!env.DE) return { ok: false, lyDo: 'chua_noi_r2', error: 'Chưa nối R2 — chưa đọc được ngân hàng đáp án' }
  const o = await env.DE.get(`key/${maCa}.json`)
  if (!o?.body) return { ok: false, lyDo: 'chua_co_dap_an', error: 'Ca này chưa cất ngân hàng đáp án — không có khóa thì không chấm lại được' }
  let nh: NganHangDapAn
  try {
    nh = (await new Response(o.body).json()) as NganHangDapAn
  } catch {
    return { ok: false, lyDo: 'dap_an_hong', error: 'Ngân hàng đáp án của ca không đọc được' }
  }
  if (!nh || !Array.isArray(nh.phanI) || !Array.isArray(nh.phanII) || !Array.isArray(nh.phanIII)) {
    return { ok: false, lyDo: 'dap_an_hong', error: 'Ngân hàng đáp án của ca sai khuôn' }
  }

  const r = await env.DB.prepare(
    'SELECT sbd, ho_ten, lan_thu, trang_thai, dap_an_json, giay_cau_json, diem_i, diem_ii, diem_iii, tong FROM luot WHERE ma_ca = ?',
  )
    .bind(maCa)
    .all<Record<string, unknown>>()
  const soHoacNull = (v: unknown): number | null => {
    const n = Number(v)
    return v === null || v === undefined || !Number.isFinite(n) ? null : n
  }
  const dsLuot: LuotChoCham[] = (r.results ?? []).map((l) => ({
    sbd: String(l.sbd ?? ''),
    hoTen: String(l.ho_ten ?? ''),
    lanThu: Number(l.lan_thu) || 1,
    trangThai: String(l.trang_thai ?? ''),
    dapAn: docBaiLam(l.dap_an_json),
    giayCau: (docJson(l.giay_cau_json) ?? null) as Record<string, number> | null,
    diem: { I: soHoacNull(l.diem_i), II: soHoacNull(l.diem_ii), III: soHoacNull(l.diem_iii), tong: soHoacNull(l.tong) },
  }))

  const soCauCa = docJson(ca.so_cau_json) as SoCauBaPhan | null
  const kq = chamLaiMotCa(maCa, String(ca.ten_ca ?? ''), nh, dsLuot, soCauCa)
  return { ok: true, soEmDaVao, soEmDaNop, ...kq }
}
