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
import { cauLuyenTuBoCau, chonCauLuyen, type CauLuyen } from './bai-tap-pdf'
import { mocRoiMan } from './chong-gian-lan'

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

/** BẰNG CHỨNG RỜI MÀN LÀM BÀI, kèm trong báo cáo gửi phụ huynh.
 *
 * Thầy chốt 04-09: bấm "Báo phụ huynh" thì báo cáo phải có nút Vi phạm nhấp
 * nháy, bấm vào ra ĐÚNG những gì máy đo được. Trước đây thầy phải gõ tay lại
 * số lần, số giây vào tin nhắn, mà phụ huynh vẫn không có mốc giờ để đối chiếu.
 *
 * Máy CHỈ đo được em rời khỏi màn làm bài, không biết vì sao — cuộc gọi đến
 * cũng cho đúng tín hiệu này. Nên gói này chở DỮ KIỆN, và trang báo cáo phải
 * nói rõ điều đó thay vì kết luận gian lận. */
export interface ViPhamRoiMan {
  soLan: number
  tongGiay: number
  /** Bài đã bị máy khoá và tự nộp. */
  daKhoa: boolean
  /** BAOMATCATHI thêm bốn lý do mới; báo cáo phải chở được cả sáu, không thì
   * bài khoá vì dấu vết chụp lại hiện ra như khoá vì rời app. */
  lyDoKhoa?: LyDoKhoaBai | ''
  /** Ngưỡng thầy đặt cho ca — để phụ huynh biết mốc nào là quá. */
  nguong?: { lan: number; giay: number } | null
  /** Từng lần rời, theo thứ tự. Cắt bớt nếu quá dài (xem MOC_TOI_DA). */
  moc: { luc: string; giay: number | null }[]
  /** Số mốc bị cắt khỏi `moc` vì quá dài — nói ra chứ không giấu. */
  mocBiCat?: number
}

/** Số mốc rời màn tối đa nhét vào báo cáo. Đủ để phụ huynh thấy nhịp, mà không
 * biến gói báo cáo thành nhật ký hàng trăm dòng. */
export const MOC_TOI_DA = 40

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
  /** LINK PHIẾU BÀI TẬP đã cất sẵn trên kho, để phụ huynh copy gửi thẳng cho
   * con — con mở link là làm bài, không phải mở báo cáo của phụ huynh.
   *
   * Link do MÁY THẦY tạo lúc dựng báo cáo (chỗ duy nhất có mã bí mật). Trang
   * báo cáo chỉ việc copy, không ghi được gì lên máy chủ. */
  linkBaiTap?: string
  /** MÃ BÀI TẬP TỰ LUYỆN thầy tạo sẵn cho em lúc dựng báo cáo (LINK-BAI-LUYEN).
   *
   * Khác `linkBaiTap` (tờ phiếu chỉ để đọc): mã này mở ra một BÀI LÀM ĐƯỢC —
   * con chọn đáp án, bấm nộp, máy chủ chấm và hiện lời giải ngay. Trang báo cáo
   * chỉ ghép mã thành link; nó không có mã bí mật nên không tạo bài mới được.
   *
   * Gói chở tới 40 câu: phụ huynh chọn N câu, lần giao sau dịch sang cửa sổ kế
   * tiếp nên giao lần 2 không ra đúng đề cũ. */
  maTuLuyen?: string
  /** Bằng chứng rời màn — chỉ có khi ca ghi nhận em rời khỏi bài làm. */
  viPham?: ViPhamRoiMan | null
  /** TRỌN BỘ ĐỀ EM ĐÃ LÀM, kèm lời giải — để phụ huynh mở đúng thứ con vừa
   * thi, giống hệt màn "đã nộp bài" của em. Mỗi em một bộ câu riêng nên không
   * gửi chung đề của ca được.
   *
   * Trường TUỲ CHỌN: gói báo cáo có hạn cỡ (Apps Script cất vào ô của Sheet),
   * ca nhiều hình mà nhét cả đề vào là quá cỡ. Chỗ gửi tự bỏ trường này ra khi
   * gói quá nặng (xem `giamGoiPhieu`), báo cáo vẫn gửi được, chỉ thiếu nút xem
   * đề. */
  deCuaEm?: CauLuyen[]
}

/** Gói báo cáo lớn nhất còn gửi lên máy chủ được (byte). Phải khớp với
 * `CO_TOI_DA_PHIEU` trong exam-api.ts. */
const CO_TOI_DA = 4 * 1024 * 1024

/** BỎ BỚT PHẦN PHỤ KHI GÓI QUÁ NẶNG, thay vì để cả báo cáo gửi hỏng.
 *
 * Báo cáo nhúng ảnh cắt từ đề dưới dạng data URL, nên ca nhiều hình có thể
 * phình vài MB. Thứ tự hy sinh đi từ ít quan trọng nhất:
 *   1. `deCuaEm` — nút xem đề, phụ huynh vẫn còn cả báo cáo.
 *   2. `baiTap` — bài luyện kèm sẵn.
 * Bỏ hết mà vẫn quá cỡ thì trả về nguyên gói, để chỗ gửi báo lỗi rõ ràng chứ
 * không âm thầm cắt mất phần chấm bài. */
export function giamGoiPhieu(p: PhieuDayDu, toiDa: number = CO_TOI_DA): { phieu: PhieuDayDu; daBo: string[] } {
  const co = (x: unknown) => new Blob([JSON.stringify(x)]).size
  if (co(p) <= toiDa) return { phieu: p, daBo: [] }
  const daBo: string[] = []
  let ra: PhieuDayDu = p
  if (ra.deCuaEm && ra.deCuaEm.length > 0) {
    ra = { ...ra, deCuaEm: undefined }
    daBo.push('đề của em')
    if (co(ra) <= toiDa) return { phieu: ra, daBo }
  }
  if (ra.baiTap && ra.baiTap.length > 0) {
    ra = { ...ra, baiTap: undefined }
    daBo.push('bài tập kèm sẵn')
  }
  return { phieu: ra, daBo }
}

/** Dựng bộ câu em đã làm theo ĐÚNG thứ tự máy đã gán, kèm đáp án và lời giải.
 * Rỗng khi thiếu bảng chấm hoặc thiếu ngân hàng. */
export function deCuaEmTuRows(rows: ChiTietCauRow[], banks: TeacherExamSource[]): CauLuyen[] {
  if (rows.length === 0 || banks.length === 0) return []
  const tra = timCauTheoQid(banks)
  const bo: { phan: 'I' | 'II' | 'III'; q: CauBatKy }[] = []
  for (const r of rows) {
    const q = tra.get(r.qid)
    if (q) bo.push({ phan: r.phan, q })
  }
  return bo.length > 0 ? cauLuyenTuBoCau(bo as never) : []
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

/** Sáu lý do khoá bài — hai của luật rời app, bốn của BAOMATCATHI. */
export type LyDoKhoaBai = 'qua_so_lan' | 'roi_qua_lau' | 'cua_so_noi' | 'thu_nho_man' | 'thoat_toan_man' | 'dau_vet_chup'

/** Nhật ký thô một lượt thi, đúng những trường cả máy thầy lẫn máy em đều có. */
export interface NguonViPham {
  soLan: number
  tongGiay: number
  daKhoa: boolean
  lyDoKhoa?: LyDoKhoaBai | null
  nguong?: { lan: number; giay: number } | null
  events?: { type: string; at: string }[] | null
}

/** Dựng khối bằng chứng. Trả `null` khi em KHÔNG rời màn lần nào và bài không
 * bị khoá — không có chuyện gì thì báo cáo không được mọc ra một nút Vi phạm
 * rồi mở ra trống rỗng. */
export function dungViPham(n: NguonViPham | null | undefined): ViPhamRoiMan | null {
  if (!n) return null
  const soLan = Math.max(0, Math.floor(Number(n.soLan) || 0))
  const daKhoa = Boolean(n.daKhoa)
  if (soLan === 0 && !daKhoa) return null
  const tatCa = mocRoiMan(n.events)
  const moc = tatCa.slice(0, MOC_TOI_DA)
  return {
    soLan,
    tongGiay: Math.max(0, Math.round(Number(n.tongGiay) || 0)),
    daKhoa,
    lyDoKhoa: n.lyDoKhoa || '',
    nguong: n.nguong ?? null,
    moc,
    mocBiCat: tatCa.length > moc.length ? tatCa.length - moc.length : undefined,
  }
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
  /** Nhật ký rời màn của lượt này. Không có thì báo cáo không có nút Vi phạm. */
  viPham?: NguonViPham | null
  /** Link phiếu bài tập đã cất sẵn trên kho (máy thầy tạo). */
  linkBaiTap?: string | null
  /** Mã bài tự luyện máy thầy vừa tạo cho em (xem `PhieuDayDu.maTuLuyen`). */
  maTuLuyen?: string | null
}

/** Số câu luyện RÚT SẴN vào báo cáo.
 *
 * Thầy chốt 04-09 tối: phụ huynh tự chọn con mình làm 10 đến 40 câu. Nên rút
 * sẵn đủ 40 rồi để trang báo cáo cắt xuống theo con số phụ huynh chọn — cắt ở
 * máy phụ huynh thì đổi số câu không phải ghi thêm phiếu nào lên máy chủ.
 *
 * Rút theo thứ tự dễ lên khó, nên lấy 10 câu đầu vẫn đúng là 10 câu dễ nhất
 * của đúng chuyên đề em yếu — không phải 10 câu ngẫu nhiên trong 40. */
export const SO_CAU_BAI_TAP_KEM = 40

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
  /** Nhật ký rời màn của chính lượt em vừa nộp (máy em giữ đủ). */
  viPham?: NguonViPham | null
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
    viPham: dungViPham(n.viPham),
    // KHÔNG kèm `deCuaEm`, KHÔNG kèm bài tập: thầy chốt 04-09 khuya "mục này của
    // xem báo cáo sau thi cắt luôn". Trên máy em, sau khi nộp chỉ còn điểm, câu
    // sai kèm lời giải và bằng chứng rời màn; đề đầy đủ và bài luyện chỉ đi
    // theo báo cáo thầy gửi phụ huynh.
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
    viPham: dungViPham(n.viPham),
    baiTap,
    linkBaiTap: n.linkBaiTap || undefined,
    maTuLuyen: n.maTuLuyen || undefined,
    deCuaEm: deCuaEmTuRows(rows, banks),
  }
}
