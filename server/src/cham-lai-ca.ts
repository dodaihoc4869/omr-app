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
import { giaiBoCauEm, hopNhatBo, LoiBoCauError, type BoCauChuan } from '../../src/lib/bo-cau-chuan'
import { khopPhanIII } from '../../src/lib/cham-so'
import { boSungKeyTuKhoCaThem, docKhoCaThem } from './key-bank-bo-sung'
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
  /** Em không chấm lại được (khóa đáp án hỏng / bộ câu không khớp bài làm / bài làm sai khuôn) — nói thẳng, KHÔNG ghi đè. */
  tuChoi: { sbd: string; viSao: string }[]
  /** Em chấm được nhưng bộ câu có điểm cần để ý (vd bộ được bù câu, hash lệch bài làm) — để thầy soi, không chặn ghi. */
  canhBao: { sbd: string; ma: string[] }[]
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

interface BankDaChuan {
  phanI: TeacherMcqQuestion[]
  phanII: TeacherTrueFalseQuestion[]
  phanIII: TeacherShortAnswerQuestion[]
  soCau: SoCauBaPhan
}

/** Kết quả chấm MỘT em: điểm, dòng chi tiết từng câu, và bộ câu đã dùng (nguồn + cảnh báo). */
export interface KetQuaChamMotEm {
  score: ScoreResult
  cau: DongChiTietCau[]
  boCau: BoCauChuan
}

/**
 * CHẤM MỘT EM bằng ĐÚNG lõi chấm của app (`giaiBoCauEm` → `assignStudentQuestions` → `scoreStudent`) và dựng luôn
 * dòng chi tiết câu. MỘT hàm cho mọi đường chấm ở máy chủ: chấm lại cả ca, kiểm chấm chỉ-đọc, và chấm lúc đọc
 * (`danhGiaLuot`) — trước đây `danhGiaLuot` là bộ chấm THỨ HAI (so chuỗi Phần III, bù câu theo thứ tự kho), hai bộ lệch nhau.
 *
 * `boGhi` = bộ câu ĐÃ GHI cho em (D1 sống ưu tiên, rồi bản đồ trong tờ đáp án). Bộ câu không khớp dấu vết bài làm, hoặc có
 * câu không còn trong kho đáp án ⇒ ném `LoiBoCauError` (chỗ gọi TỪ CHỐI, không ghi đè điểm). Khóa đáp án hỏng ⇒ ném lỗi của `scoreStudent`.
 *
 * PHẦN III dùng `khopPhanIII` (một luật với điểm).
 */
export function chamBaiMotEm(
  bank: BankDaChuan,
  maCa: string,
  sbd: string,
  answers: BaiLamEm,
  giayCau: Record<string, number> | null,
  boGhi?: readonly string[] | null,
): KetQuaChamMotEm {
  const boCau = giaiBoCauEm(bank, maCa, sbd, { dapAn: answers, giayCau }, boGhi)
  if (boCau.loi) throw new LoiBoCauError(boCau.loi)
  // Chỉ bộ câu CỦA EM NÀY đi vào `assignStudentQuestions` — không để bản đồ cả lớp lọt vào và đổi nghĩa.
  const asg = assignStudentQuestions({ ...bank, boTheoEm: boCau.qids ? { [sbd]: boCau.qids } : undefined }, maCa, sbd)
  return { ...chamTheoBoCauDaChon(asg, maCa, sbd, answers, giayCau), boCau }
}

/** Phần SAU khi đã có bộ câu: điểm + dòng chi tiết. Tách ra để công cụ kiểm chấm dựng lại được đúng cách chấm CŨ mà không chép logic. */
export function chamTheoBoCauDaChon(
  asg: ReturnType<typeof assignStudentQuestions>,
  maCa: string,
  sbd: string,
  answers: BaiLamEm,
  giayCau: Record<string, number> | null,
): { score: ScoreResult; cau: DongChiTietCau[] } {
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
 * Lượt nào chấm lỗi (khóa đáp án hỏng, bộ câu không khớp bài làm…) thì vào `tuChoi`, KHÔNG ghi đè điểm cũ.
 *
 * `boD1` = bản đồ đề riêng SỐNG ở D1 (`ca.bo_theo_em_json`): em vào muộn / em thi lại chỉ có ở đó, KHÔNG có trong bản chụp
 * `nh.boTheoEm` của tờ đáp án (cất lúc mở ca). D1 sống THẮNG bản chụp theo từng em.
 */
export function chamLaiMotCa(
  maCa: string,
  tenCa: string,
  nh: NganHangDapAn,
  dsLuot: LuotChoCham[],
  soCauCa?: SoCauBaPhan | null,
  boD1?: unknown,
): KetQuaChamLaiMotCa {
  const soCau = soCauCa && soCauCa.I + soCauCa.II + soCauCa.III > 0 ? soCauCa : nh.soCau ?? demSoCau(nh)
  const bank: BankDaChuan = { ...nh, soCau }
  const boHieuLuc = hopNhatBo(nh.boTheoEm, boD1)

  const theoSbd = new Map<string, LuotChoCham[]>()
  for (const l of dsLuot) {
    const arr = theoSbd.get(l.sbd)
    if (arr) arr.push(l)
    else theoSbd.set(l.sbd, [l])
  }

  const em: DoiDiemMotEm[] = []
  const bai: GoiGhiDiem[] = []
  const tuChoi: KetQuaChamLaiMotCa['tuChoi'] = []
  const canhBao: KetQuaChamLaiMotCa['canhBao'] = []
  let soDoi = 0
  theoSbd.forEach((arr, sbd) => {
    const moiNhat = [...arr].sort((a, b) => b.lanThu - a.lanThu)[0]!
    if (!moiNhat.dapAn || (moiNhat.trangThai !== 'da_nop' && moiNhat.trangThai !== 'khoa')) return
    let kq: KetQuaChamMotEm
    try {
      kq = chamBaiMotEm(bank, maCa, sbd, moiNhat.dapAn, moiNhat.giayCau, boHieuLuc[sbd])
    } catch (e) {
      tuChoi.push({ sbd, viSao: e instanceof Error ? e.message : 'Không chấm được' })
      return
    }
    if (kq.boCau.canhBao.length > 0) canhBao.push({ sbd, ma: kq.boCau.canhBao })
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

  return { maCa, tenCa, soCau, em, soDoi, bai, tuChoi, canhBao }
}

// ---------------------------------------------------------------------------
// CHẤM LÚC ĐỌC — dùng cho `danhGiaLuot` (goi-cu.ts): em xem lịch sử / câu sai khi ca chưa có dòng chi tiết.

/** Chuẩn hoá một gói đề CÓ ĐÁP ÁN đọc từ R2 (`key/…` hoặc `de/…`) về `NganHangDapAn`: id lấy từ `id` hoặc `qid`. Gói không có mảng câu ⇒ null. */
function chuanHoaNganHang(bData: unknown): NganHangDapAn | null {
  if (!bData || typeof bData !== 'object') return null
  const o = bData as Record<string, unknown>
  const lay = <T>(x: unknown): T[] =>
    (Array.isArray(x) ? x : [])
      .filter((q): q is Record<string, unknown> => !!q && typeof q === 'object')
      .map((q) => ({ ...q, id: String(q.id ?? q.qid ?? '') }))
      .filter((q) => q.id !== '') as unknown as T[]
  const phanI = lay<TeacherMcqQuestion>(o.phanI)
  const phanII = lay<TeacherTrueFalseQuestion>(o.phanII)
  const phanIII = lay<TeacherShortAnswerQuestion>(o.phanIII)
  if (phanI.length + phanII.length + phanIII.length === 0) return null
  return { phanI, phanII, phanIII, soCau: (o.soCau as SoCauMoiPhan | undefined) ?? undefined, boTheoEm: (o.boTheoEm as NganHangDapAn['boTheoEm']) ?? undefined }
}

/** Bài làm đọc từ `luot.dap_an_json`; chấp nhận cả dạng cũ phẳng (cả đối tượng là bản đồ Phần I). */
function chuanHoaBaiLamLinhHoat(v: unknown): BaiLamEm | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const coPhan = 'phanI' in o || 'phanII' in o || 'phanIII' in o
  const obj = (x: unknown) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {})
  return {
    phanI: (coPhan ? obj(o.phanI) : obj(o)) as BaiLamEm['phanI'],
    phanII: obj(o.phanII) as BaiLamEm['phanII'],
    phanIII: obj(o.phanIII) as BaiLamEm['phanIII'],
  }
}

/**
 * CHẤM MỘT LƯỢT TỪ GÓI ĐỀ + BÀI LÀM, đúng lõi `chamBaiMotEm` (cùng luật Phần III, cùng bộ câu chuẩn).
 * Trả `null` khi KHÔNG chấm được chính xác: gói không có đáp án (gói công khai), khóa hỏng, bộ câu không khớp bài làm,
 * bài làm sai khuôn — chỗ gọi khi ấy KHÔNG ghi gì (không bịa dòng chi tiết).
 */
export function chamLuotTuNganHang(
  bData: unknown,
  caRow: Record<string, unknown> | null,
  dapAnObj: unknown,
  sbd: string,
  maCa: string,
  giayCau: Record<string, number> | null = null,
): KetQuaChamMotEm | null {
  const nh = chuanHoaNganHang(bData)
  const dapAn = chuanHoaBaiLamLinhHoat(dapAnObj)
  if (!nh || !dapAn) return null
  const soCauD1 = docJson(caRow?.so_cau_json) as SoCauBaPhan | null
  const soCau: SoCauBaPhan = soCauD1 && soCauD1.I + soCauD1.II + soCauD1.III > 0 ? soCauD1 : nh.soCau ?? demSoCau(nh)
  const boHieuLuc = hopNhatBo(nh.boTheoEm, docJson(caRow?.bo_theo_em_json))
  try {
    return chamBaiMotEm({ ...nh, soCau } as BankDaChuan, maCa, sbd, dapAn, giayCau, boHieuLuc[sbd])
  } catch {
    return null
  }
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

/** Nguyên liệu ĐÃ ĐỌC của một ca đã xong — dùng chung cho chấm lại (ghi) và kiểm chấm (chỉ đọc). */
export interface NguonChamLai {
  ca: DongCa
  nh: NganHangDapAn
  dsLuot: LuotChoCham[]
  soCauCa: SoCauBaPhan | null
  /** Bản đồ đề riêng SỐNG ở D1 (`ca.bo_theo_em_json`), chưa làm phẳng. */
  boD1: unknown
  soEmDaVao: number
  soEmDaNop: number
  /** Số câu NỐI THÊM đã bổ sung vào `nh` từ bảng `kho_ca_them` (chỉ khi gọi với `boSungKhoCaThem`; xem key-bank-bo-sung.ts). 0 = tờ đáp án R2 đủ. */
  soBoSungKhoCaThem: number
  soBoQuaKhoCaThem: number
}

export type KetQuaDocNguon =
  | ({ ok: true } & NguonChamLai)
  | {
      ok: false
      lyDo: 'khong_co_ca' | 'ca_chua_xong' | 'chua_noi_r2' | 'chua_co_dap_an' | 'dap_an_hong'
      error: string
      soEmDaVao?: number
      soEmDaNop?: number
    }

export type KetQuaChuanBiChamLai =
  | ({ ok: true; soEmDaVao: number; soEmDaNop: number } & KetQuaChamLaiMotCa)
  | Extract<KetQuaDocNguon, { ok: false }>

/**
 * Đọc một ca CŨ đủ dữ liệu để chấm lại. CỔNG AN TOÀN:
 *   · Ca chưa xong (chưa đóng và còn em chưa nộp) ⇒ TỪ CHỐI — "ca cũ" nghĩa là đã xong.
 *   · Chưa cất ngân hàng đáp án lên R2 ⇒ TỪ CHỐI — không có khóa thì không chấm được.
 * CHỈ ĐỌC — không ghi gì.
 */
export async function docNguonChamLai(
  env: Env,
  maCa: string,
  /** `boSungKhoCaThem`: thêm vào tờ đáp án (CHỈ trong bộ nhớ) các câu nối thêm mà R2 đã mất nhưng `kho_ca_them` còn đáp án — dành cho công cụ kiểm chỉ-đọc. */
  tuyChon: { boQuaCongCaDaXong?: boolean; boSungKhoCaThem?: boolean } = {},
): Promise<KetQuaDocNguon> {
  const ca = await env.DB.prepare('SELECT * FROM ca WHERE ma_ca = ?').bind(maCa).first<DongCa>()
  if (!ca) return { ok: false, lyDo: 'khong_co_ca', error: 'Không có ca này' }

  const t = (await docTrangThaiCongBo(env, [maCa])).get(maCa)
  const soEmDaVao = t?.soEmDaVao ?? 0
  const soEmDaNop = t?.soEmDaNop ?? 0
  // Cổng "ca đã xong" bảo vệ ĐƯỜNG GHI (không chấm lại giữa giờ thi). Kiểm chấm chỉ-đọc được bỏ qua cổng này để soi cả ca đang mở.
  if (!tuyChon.boQuaCongCaDaXong && !caDaXong(String(ca.trang_thai ?? ''), soEmDaVao, soEmDaNop)) {
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
  let soBoSungKhoCaThem = 0
  let soBoQuaKhoCaThem = 0
  if (tuyChon.boSungKhoCaThem) {
    const bs = boSungKeyTuKhoCaThem(nh, await docKhoCaThem(env, maCa))
    if (bs) {
      nh = bs.giaTri as unknown as NganHangDapAn
      soBoSungKhoCaThem = bs.soBoSung
      soBoQuaKhoCaThem = bs.soBoQua
    }
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

  return { ok: true, ca, nh, dsLuot, soCauCa: docJson(ca.so_cau_json) as SoCauBaPhan | null, boD1: docJson(ca.bo_theo_em_json), soEmDaVao, soEmDaNop, soBoSungKhoCaThem, soBoQuaKhoCaThem }
}

/**
 * Chuẩn bị chấm lại một ca CŨ: đọc nguyên liệu rồi gọi hàm thuần. Lượt chưa nộp nằm lại, không ghi gì:
 * chỗ gọi chỉ ghi phần `bai` trả về.
 */
export async function chuanBiChamLaiCa(env: Env, maCa: string): Promise<KetQuaChuanBiChamLai> {
  const n = await docNguonChamLai(env, maCa)
  if (n.ok !== true) return n
  const kq = chamLaiMotCa(maCa, String(n.ca.ten_ca ?? ''), n.nh, n.dsLuot, n.soCauCa, n.boD1)
  return { ok: true, soEmDaVao: n.soEmDaVao, soEmDaNop: n.soEmDaNop, ...kq }
}
