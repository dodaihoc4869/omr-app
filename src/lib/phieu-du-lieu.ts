// DỰNG DỮ LIỆU CHO BÁO CÁO GỬI PHỤ HUYNH.
//
// Gom mọi thứ app biết về một em trong MỘT ca thành một gói duy nhất, để trang
// báo cáo (screens/PhieuScreen.tsx) chỉ việc vẽ, không phải tính lại. Tính ở
// đây có hai cái lợi: test được bằng số thật, và trang báo cáo trên máy phụ
// huynh không phải gọi thêm lệnh nào.
//
// LUẬT: mọi số trong gói này phải lấy từ dữ liệu đã chấm. Thiếu thì để null và
// trang báo cáo GIẤU HẲN mục đó — không có mục nào được đoán, không có mục nào
// hiện ra với số 0 giả.
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import type { CaCuaEm, ChiTietCauRow, ChuyenDeEm, HoSoEm } from './exam-api'
import { ducKetKienThuc, thongKeLamBai, tinHieuLamBai, type DucKetChuyenDe, type ThongKeLamBai, type TinHieuLamBai } from './phan-tich-lam-bai'
import { chonCauLuyen, type CauLuyen } from './bai-tap-pdf'

/** Phiên bản gói báo cáo. Trang đọc từ chối bản lạ thay vì vẽ thiếu mục. */
export const BAN_PHIEU = 2

export interface LyDoPhuongAn {
  khoa: string
  dung: boolean
  ly: string
}

export interface CauSaiChiTiet {
  phan: 'I' | 'II' | 'III'
  soCau: number
  chuyenDe: string
  mucDo: string
  giay: number | null
  de: string
  /** Phần I: bốn phương án A–D. Phần II: bốn ý a–d. Phần III: không có. */
  luaChon: string[] | null
  dapAnDung: string
  dapAnChon: string
  chot: string
  lyDo: LyDoPhuongAn[] | null
  buoc: string[] | null
  ketQua: string
  /** Câu có hình trong đề gốc — báo cáo không kèm ảnh nên phải nói ra. */
  coHinh: boolean
}

export interface DiemMotCa {
  maCa: string
  tenCa: string
  ngay: string
  tong: number
  hang: number | null
  siSo: number | null
}

export interface PhieuDayDu {
  v: number
  hoTen: string
  sbd: string
  lop: string
  tenCa: string
  maCa: string
  ngay: string
  diem: number
  diemPhan: { I: number; II: number; III: number } | null
  soCauSai: number
  tongSoCau: number | null
  hang: number | null
  siSo: number | null
  /** Chuyên đề mất điểm TRONG CA NÀY. */
  chuyenDeCa: { ten: string; soCau: number; soSai: number }[]
  /** Chuyên đề cộng dồn mọi ca, kèm xu hướng — bức tranh dài hạn. */
  chuyenDeTong: ChuyenDeEm[]
  /** Điểm các ca trước để vẽ đường tiến bộ (cũ → mới). */
  lichSu: DiemMotCa[]
  /** Điểm mọi em trong ca, đã bỏ tên — để vẽ phân bố lớp. */
  diemLop: number[]
  vieCanLam: string
  thongKe: ThongKeLamBai | null
  tinHieu: TinHieuLamBai[]
  ducKet: DucKetChuyenDe[]
  cauSai: CauSaiChiTiet[]
  /** Dải thời gian từng câu theo đúng thứ tự em làm — để vẽ biểu đồ nhịp làm
   * bài. Gọn hết mức: nhãn, số giây, đúng hay sai. */
  dai: { nhan: string; giay: number | null; dung: boolean }[]
  /** 10 câu luyện đúng chuyên đề em yếu, kèm sẵn trong báo cáo để phụ huynh bấm
   * một nút là tải được phiếu PDF ngay trên máy mình — không phải chờ thầy gửi
   * thêm file. Rút lúc thầy tạo báo cáo, ở máy thầy, nơi có cả kho đề. */
  baiTap?: CauLuyen[]
}

type CauBatKy = TeacherMcqQuestion | TeacherTrueFalseQuestion | TeacherShortAnswerQuestion

/** Tra câu theo qid trong mọi đề của ca. */
export function timCauTheoQid(banks: TeacherExamSource[]): Map<string, CauBatKy> {
  const m = new Map<string, CauBatKy>()
  for (const s of banks) for (const q of [...s.phanI, ...s.phanII, ...s.phanIII]) m.set(q.id, q)
  return m
}

function coHinh(q: CauBatKy): boolean {
  const x = q as { thanCauImg?: string; choiceImgs?: (string | undefined)[]; ideaImgs?: (string | undefined)[] }
  return Boolean(x.thanCauImg || x.choiceImgs?.some(Boolean) || x.ideaImgs?.some(Boolean))
}

function lyDoCua(q: CauBatKy, phan: 'I' | 'II' | 'III'): LyDoPhuongAn[] | null {
  const lg = q.loiGiai
  if (!lg) return null
  if (phan === 'I' && lg.tungPa) {
    return (['A', 'B', 'C', 'D'] as const)
      .filter((k) => lg.tungPa?.[k])
      .map((k) => ({ khoa: k, dung: Boolean(lg.tungPa?.[k]?.dung), ly: String(lg.tungPa?.[k]?.viSao ?? '') }))
  }
  if (phan === 'II' && lg.tungY) {
    return (['a', 'b', 'c', 'd'] as const)
      .filter((k) => lg.tungY?.[k])
      .map((k) => ({ khoa: k, dung: Boolean(lg.tungY?.[k]?.dung), ly: String(lg.tungY?.[k]?.viSao ?? '') }))
  }
  return null
}

/** Chi tiết từng câu SAI, dựng từ bảng chấm + kho đề CÓ đáp án.
 *
 * KHÔNG kèm ảnh của câu: ảnh trong kho đề là base64, vài câu có hình là gói
 * phình lên hàng trăm KB và phụ huynh chờ tải trên 4G. Câu có hình được đánh
 * dấu `coHinh` để báo cáo nói thẳng là phải xem lại hình trong bài chữa. */
export function dungCauSai(rows: ChiTietCauRow[], banks: TeacherExamSource[]): CauSaiChiTiet[] {
  const tra = timCauTheoQid(banks)
  const ra: CauSaiChiTiet[] = []
  for (const r of rows) {
    if (r.dungSai) continue
    const q = tra.get(r.qid)
    if (!q) continue
    const mcq = q as TeacherMcqQuestion
    const tf = q as TeacherTrueFalseQuestion
    ra.push({
      phan: r.phan,
      soCau: r.soCau,
      chuyenDe: r.chuyenDe || '',
      mucDo: r.mucDo || '',
      giay: r.giay,
      de: q.text || '',
      luaChon: r.phan === 'I' ? [...(mcq.choices ?? [])] : r.phan === 'II' ? [...(tf.ideas ?? [])] : null,
      dapAnDung: r.dapAnDung || '',
      dapAnChon: r.dapAnChon || '',
      chot: q.loiGiai?.chot ?? '',
      lyDo: lyDoCua(q, r.phan),
      buoc: q.loiGiai?.buoc ? [...q.loiGiai.buoc] : null,
      ketQua: q.loiGiai?.ketQua ?? '',
      coHinh: coHinh(q),
    })
  }
  return ra
}

export interface NguonPhieu {
  hoSo: HoSoEm
  ca: CaCuaEm
  chuyenDeCa: { ten: string; soCau: number; soSai: number }[]
  vieCanLam: string
  /** Bảng chấm từng câu của em trong ca này. Không có thì báo cáo bỏ hẳn phần
   * cách làm bài và phần câu sai, chứ không dựng phần rỗng. */
  rows?: ChiTietCauRow[] | null
  banks?: TeacherExamSource[] | null
  /** Điểm mọi em đã nộp trong ca (không kèm tên) để vẽ phân bố lớp. */
  diemLop?: number[] | null
  thoiLuongPhut?: number | null
  vaoLuc?: string | null
  /** Cả kho đề trên máy thầy, để rút sẵn 10 câu luyện kèm vào báo cáo. */
  khoDe?: TeacherExamSource[] | null
  /** Câu em đã làm — tránh khi rút bài luyện. */
  qidDaLam?: string[] | null
}

/** Số câu của phiếu luyện kèm trong báo cáo gửi phụ huynh. Cố định 10: đây là
 * bài chữa lỗi ngay sau một bài kiểm tra, không phải bộ đề ôn cả chương. */
export const SO_CAU_BAI_TAP_KEM = 10

/** Nguồn để dựng báo cáo NGAY TRÊN MÁY HỌC SINH, sau khi em nộp bài.
 *
 * Máy em có đủ bài làm, giây từng câu và ngân hàng CÓ đáp án của ca (khi thầy
 * bật công bố điểm), nên dựng được báo cáo mà KHÔNG gọi thêm lệnh máy chủ nào
 * và không mở thêm đường đọc dữ liệu nào — đây là lý do không làm bằng cách cho
 * máy em hỏi máy chủ "phiếu của em đâu".
 *
 * Những mục cần dữ liệu chỉ thầy có (hạng trong lớp, phân bố điểm cả lớp, lịch
 * sử các ca, bản đồ chuyên đề cả quá trình) thì để trống và trang báo cáo GIẤU
 * HẲN mục đó — không dựng mục rỗng, không bịa số. */
export interface NguonPhieuMayEm {
  hoTen: string
  sbd: string
  lop?: string
  maCa: string
  tenCa?: string
  nopLuc: string
  vaoLuc?: string | null
  thoiLuongPhut?: number | null
  diem: number
  diemPhan?: { I: number; II: number; III: number } | null
  rows: ChiTietCauRow[]
  banks: TeacherExamSource[]
}

export function dungPhieuMayEm(n: NguonPhieuMayEm): PhieuDayDu {
  const cauSai = dungCauSai(n.rows, n.banks)
  const tk = thongKeLamBai(n.rows, { vaoLuc: n.vaoLuc, nopLuc: n.nopLuc, thoiLuongPhut: n.thoiLuongPhut })

  const gom = new Map<string, { ten: string; soCau: number; soSai: number }>()
  for (const r of n.rows) {
    const ten = r.chuyenDe || ''
    if (!ten) continue
    const cu = gom.get(ten) ?? { ten, soCau: 0, soSai: 0 }
    cu.soCau += 1
    if (!r.dungSai) cu.soSai += 1
    gom.set(ten, cu)
  }
  const chuyenDeCa = [...gom.values()]

  return {
    v: BAN_PHIEU,
    hoTen: n.hoTen || '',
    sbd: n.sbd || '',
    lop: n.lop || '',
    tenCa: n.tenCa || '',
    maCa: n.maCa || '',
    ngay: n.nopLuc || '',
    diem: n.diem,
    diemPhan: n.diemPhan ?? null,
    soCauSai: tk.soSai,
    tongSoCau: tk.tongCau,
    // Máy em KHÔNG biết bảng điểm cả lớp — để trống, trang báo cáo tự giấu mục.
    hang: null,
    siSo: null,
    chuyenDeCa,
    chuyenDeTong: [],
    lichSu: [],
    diemLop: [],
    vieCanLam: '',
    thongKe: tk,
    tinHieu: tinHieuLamBai(tk),
    ducKet: ducKetKienThuc(cauSai.map((c) => ({ chuyenDe: c.chuyenDe, chot: c.chot }))),
    cauSai,
    dai: n.rows.map((r) => ({ nhan: `Phần ${r.phan} câu ${r.soCau}`, giay: r.giay, dung: Boolean(r.dungSai) })),
  }
}

export function dungPhieu(n: NguonPhieu): PhieuDayDu {
  const rows = n.rows ?? []
  const banks = n.banks ?? []
  const cauSai = rows.length && banks.length ? dungCauSai(rows, banks) : []
  const tk = rows.length ? thongKeLamBai(rows, { vaoLuc: n.vaoLuc, nopLuc: n.ca.nopLuc, thoiLuongPhut: n.thoiLuongPhut }) : null

  // Bài luyện kèm sẵn: rút theo chuyên đề em sai TRONG CA NÀY, tránh câu em đã
  // làm. Kho đề chỉ có trên máy thầy nên phải rút ở đây, lúc tạo báo cáo.
  const yeuCa = n.chuyenDeCa
    .filter((c) => c.soSai > 0)
    .map((c) => ({ ten: c.ten, tiLeSai: c.soSai / Math.max(1, c.soCau) }))
    .sort((a, b) => b.tiLeSai - a.tiLeSai)
  const kho = n.khoDe ?? []
  const baiTap = kho.length > 0 ? chonCauLuyen(kho, { chuyenDe: yeuCa, qidDaLam: n.qidDaLam ?? [], soCau: SO_CAU_BAI_TAP_KEM }).cau : []

  return {
    v: BAN_PHIEU,
    hoTen: n.hoSo.em.hoTen || '',
    sbd: n.hoSo.em.sbd || '',
    lop: n.hoSo.em.lop || n.ca.lop || '',
    tenCa: n.ca.tenCa || '',
    maCa: n.ca.maCa || '',
    ngay: n.ca.nopLuc || '',
    diem: n.ca.tong ?? 0,
    diemPhan: n.ca.diemI !== null && n.ca.diemII !== null && n.ca.diemIII !== null ? { I: n.ca.diemI, II: n.ca.diemII, III: n.ca.diemIII } : null,
    soCauSai: tk ? tk.soSai : n.hoSo.soCauSaiCaGanNhat,
    tongSoCau: tk ? tk.tongCau : n.chuyenDeCa.reduce((s, c) => s + c.soCau, 0) || null,
    hang: n.ca.hang,
    siSo: n.ca.siSo,
    chuyenDeCa: n.chuyenDeCa.filter((c) => c.soCau > 0),
    chuyenDeTong: n.hoSo.chuyenDe ?? [],
    // Cũ → mới, và chỉ những ca ĐÃ CHẤM: ca chưa có điểm mà vẽ vào đường tiến
    // bộ là bịa ra một cú tụt điểm không có thật.
    lichSu: [...(n.hoSo.ca ?? [])]
      .filter((c) => c.tong !== null)
      .sort((a, b) => new Date(a.nopLuc).getTime() - new Date(b.nopLuc).getTime())
      .map((c) => ({ maCa: c.maCa, tenCa: c.tenCa || '', ngay: c.nopLuc, tong: c.tong as number, hang: c.hang, siSo: c.siSo })),
    diemLop: (n.diemLop ?? []).filter((x) => typeof x === 'number' && Number.isFinite(x)),
    vieCanLam: n.vieCanLam || '',
    thongKe: tk,
    tinHieu: tk ? tinHieuLamBai(tk) : [],
    ducKet: ducKetKienThuc(cauSai.map((c) => ({ chuyenDe: c.chuyenDe, chot: c.chot }))),
    cauSai,
    dai: rows.map((r) => ({ nhan: `Phần ${r.phan} câu ${r.soCau}`, giay: r.giay, dung: Boolean(r.dungSai) })),
    baiTap,
  }
}
