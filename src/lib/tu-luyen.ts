// BÀI TẬP TỰ LUYỆN — LINK-BAI-LUYEN.md v2, thầy duyệt 05/09.
//
// Thầy ở hồ sơ một em, chọn số câu, bấm Copy link, gửi Zalo. Em mở link, làm
// bài, bấm Nộp: hiện điểm và lời giải từng câu ngay tại đó.
//
// TÁCH HẲN KHỎI CA THI — MỘT SHEET DUY NHẤT.
//
// SỬA 05/09, thầy chốt sau khi đọc bản đầu: bài tự luyện KHÔNG cộng dồn vào
// bảng mạnh–yếu. Lý do đứng vững: em làm ở nhà, được mở sách vở tra cứu, nên tỉ
// lệ sai ở đây không cùng thang đo với bài làm trong lớp có người coi. Trộn hai
// thang vào một bảng là bảng mạnh–yếu nói dối thầy — mà bảng đó đi thẳng vào
// phiếu gửi phụ huynh.
//
// Vậy nên bài tự luyện KHÔNG đụng: `TienDoCa` · `TienDoHS` · `QidDaLam` ·
// `LuotThi` · `CaKiemTra` · `ChiTietCau` · điểm số · xếp hạng · phân bố điểm
// lớp · Lịch sử ca thi · `BangDiem.xlsx` · `dulieu.json`.
//
// Số liệu đi vào báo cáo phụ huynh bằng MỘT KHỐI BIỂU ĐỒ RIÊNG, đặt tách khỏi
// phần mạnh–yếu của ca thi, và mỗi lần gửi báo cáo đều lấy bản mới nhất.
//
// Bản v1 định dùng ca `Loai=baitap` rồi vá ba chỗ để nó khỏi làm hỏng số. Phải
// vá ba chỗ là dấu hiệu đặt sai chỗ; tách hẳn thì ba chỗ vá đó không tồn tại.
import type { CauLuyen } from './bai-tap-pdf'

// ---------------------------------------------------------------------------
// MỘT NGUỒN SỰ THẬT CẤU HÌNH (mục 3). Cấm rải số vào màn hình.

export const SO_CAU_MAC_DINH = 10
export const SO_CAU_TOI_DA = 60
export const SO_CAU_TOI_THIEU = 5

/** Mã 10 ký tự, dùng lại đúng bộ sinh mã của `layPhieu` (`sinhMaPhieu`). */
export const DAI_MA = 10

/** Số lần làm gần nhất giữ lại để vẽ đường tiến bộ. Ô Sheet chỉ chứa được
 * 50.000 ký tự, nên lịch sử phải có trần. */
export const SO_LAN_GIU_LICH_SU = 10

/** Số bài tự luyện gần nhất đưa vào khối biểu đồ của báo cáo phụ huynh.
 *
 * 6 bài: đủ để nhìn ra xu hướng trên một cột biểu đồ hẹp của điện thoại, mà
 * chưa tới mức cột nào cũng bé không đọc nổi nhãn. */
export const SO_BAI_VAO_BAO_CAO = 6

/** Bài tự luyện giữ trên máy chủ bấy lâu rồi dọn; gói Drive dọn cùng. */
export const NGAY_GIU_BAI = 180

/** Cùng định dạng mã phiếu — mã sai định dạng và mã không tồn tại phải trả về
 * CÙNG MỘT CÂU, không để ai dò ra quy tắc mã qua thông điệp lỗi. */
export const RE_MA_TU_LUYEN = /^[A-Za-z0-9_-]{8,40}$/

export const LOI_KHONG_TIM_THAY = 'Không tìm thấy bài luyện'

/** Năm khoá phải bị gỡ sạch khỏi đề trước khi gửi xuống máy em (mục 2.3).
 *
 * VÌ SAO: cách dễ nhất là nhét cả gói có đáp án xuống máy em rồi chấm tại chỗ.
 * Em mở công cụ nhà phát triển, hoặc chỉ cần xem phản hồi mạng, là thấy toàn bộ
 * đáp án TRƯỚC KHI LÀM. Bài tự luyện mà biết trước đáp án thì dữ liệu mạnh–yếu
 * thu về là số rác — mà số rác đó lại đi thẳng vào phiếu gửi phụ huynh.
 *
 * Khác phiếu PDF: tờ giấy có đáp án ở trang sau là bình thường vì thầy cầm tờ
 * giấy. Bản online thì không. */
export const KHOA_BI_MAT = ['dapAn', 'chot', 'lyDo', 'buoc', 'ketQua'] as const

// ---------------------------------------------------------------------------
// KIỂU DỮ LIỆU

/** Câu đã gỡ sạch đáp án và lời giải — đúng thứ máy em được nhận trước khi nộp. */
export type CauTuLuyenAn = Omit<CauLuyen, 'dapAn' | 'chot' | 'lyDo' | 'buoc' | 'ketQua'>

/** Gói đầy đủ, chỉ sống trên Drive của máy chủ. */
export interface GoiTuLuyen {
  v: number
  sbd: string
  hoTen: string
  taoLuc: string
  cau: CauLuyen[]
}

export const BAN_TU_LUYEN = 1

/** Lựa chọn của em: qid → chuỗi.
 *
 * Phần I  = một chữ 'A'|'B'|'C'|'D'
 * Phần II = bốn ký tự theo ý a,b,c,d, mỗi ký tự 'D' | 'S' | '-' (chưa chọn)
 * Phần III = chuỗi em gõ */
export type ChonTuLuyen = Record<string, string>

/** Một câu trong kết quả trả về sau khi nộp. */
export interface CauDaCham {
  qid: string
  phan: 'I' | 'II' | 'III'
  chuyenDe: string
  mucDo: string
  chon: string
  dapAn: string
  dung: boolean
}

export interface KetQuaTuLuyen {
  soCau: number
  soDung: number
  lanThu: number
  cham: CauDaCham[]
  /** Bản đầy đủ có đáp án + lời giải, chỉ trả về SAU khi nộp. */
  cau: CauLuyen[]
}

// ---------------------------------------------------------------------------
// LINK

/** `https://…/tl#<mã>~<số câu>`. Mã nằm SAU dấu `#` nên không rơi vào log của
 * GitHub Pages lẫn bộ đọc link của Zalo — cùng lý do với link phiếu phụ huynh.
 *
 * Số câu đi trong link chứ không ghi lên máy chủ: trang báo cáo phụ huynh không
 * có mã bí mật để ghi, mà phụ huynh vẫn phải tự chọn con làm bao nhiêu câu. Dấu
 * `~` không nằm trong bảng chữ sinh mã nên không lẫn với mã. */
export function taoLinkTuLuyen(goc: string, ma: string, soCau?: number | null): string {
  const g = goc.endsWith('/') ? goc : goc + '/'
  const n = Number(soCau)
  return `${g}tl#${ma}${Number.isFinite(n) && n > 0 ? `~${Math.round(n)}` : ''}`
}

export function docLinkTuLuyen(hash: string): { ma: string; soCau: number | null } {
  const s = (hash || '').trim().replace(/^#/, '')
  const i = s.indexOf('~')
  const ma = i >= 0 ? s.slice(0, i) : s
  if (!RE_MA_TU_LUYEN.test(ma)) return { ma: '', soCau: null }
  const m = /^(\d{1,3})$/.exec(i >= 0 ? s.slice(i + 1) : '')
  return { ma, soCau: m ? Math.max(1, Math.min(SO_CAU_TOI_DA, Number(m[1]))) : null }
}

export function docMaTuLuyen(hash: string): string {
  return docLinkTuLuyen(hash).ma
}

/** Cửa sổ N câu bắt đầu từ `batDau`, QUAY VÒNG khi chạm cuối gói. Bản đối chứng
 * của `cuaCauTuLuyen_` trong Apps Script — hai bên phải cắt giống hệt, nếu
 * không thì em làm câu này mà máy chủ chấm câu khác.
 *
 * Quay vòng chứ không cắt cụt: em làm tới lần thứ năm mà gói chỉ đủ bốn cửa sổ
 * thì thà gặp lại đề cũ, còn hơn nhận một bài rỗng. */
export function cuaCau<T>(cau: T[], batDau: number, soCau: number): T[] {
  const n = cau.length
  if (n === 0) return []
  if (!soCau || soCau <= 0 || soCau >= n) return cau
  const d = ((Math.round(batDau) % n) + n) % n
  return Array.from({ length: soCau }, (_, i) => cau[(d + i) % n])
}

/** Lần giao thứ mấy thì bắt đầu từ câu nào. Lần 1 (`lanThu = 0`) lấy từ đầu;
 * mỗi lần sau dịch sang cửa sổ kế tiếp, nên giao lần 2 KHÔNG ra đúng đề cũ. */
export function batDauCuaLan(lanThu: number, soCau: number): number {
  return Math.max(0, Math.round(lanThu)) * Math.max(1, Math.round(soCau))
}

/** Nhãn nút gửi link ở báo cáo phụ huynh. Con nộp rồi thì lần bấm sau là GIAO
 * TIẾP, không phải giao lại cùng một thứ. */
export function nhanNutGiao(lanThu: number): string {
  return lanThu > 0 ? `Giao tiếp lần ${lanThu + 1}` : 'Copy link gửi ĐỀ cho con'
}

// ---------------------------------------------------------------------------
// KIỂM TRA RÒ ĐÁP ÁN — phép kiểm quan trọng nhất của cả đặc tả (mục 8.1)

/** Quét THẲNG chuỗi JSON, không duyệt cây: một khoá bí mật lọt vào bất cứ tầng
 * nào cũng bị bắt. Trả về danh sách khoá đã rò; rỗng = sạch. */
export function khoaBiRo(payload: unknown): string[] {
  const s = JSON.stringify(payload ?? null)
  return KHOA_BI_MAT.filter((k) => s.includes(`"${k}"`))
}

/** Gỡ năm khoá bí mật khỏi một câu. Dùng ở máy chủ; ở máy thầy chỉ để test
 * đối chứng rằng hai bên hiểu giống nhau. */
export function goDapAn(cau: CauLuyen[]): CauTuLuyenAn[] {
  return cau.map((c) => {
    const ra = { ...c } as Record<string, unknown>
    for (const k of KHOA_BI_MAT) delete ra[k]
    return ra as unknown as CauTuLuyenAn
  })
}

// ---------------------------------------------------------------------------
// CHẤM — bản đối chứng của `chamTuLuyen_` trong Apps Script
//
// Máy chủ mới là nơi chấm thật (mục 2.3). Bản này tồn tại để test so khớp hai
// bên: nếu một ngày luật chấm ở .gs đi lệch, test đối chứng gãy ngay.
//
// Luật phải TRÙNG KHỚP `taoChiTietCau` của ca thi, không được nới cũng không
// được siết: cùng một hiểu biết mà hai đường cho ra hai tỉ lệ sai khác nhau thì
// bảng mạnh–yếu vô nghĩa.

/** Phần III: bỏ khoảng trắng hai đầu, dấu phẩy thập phân thành dấu chấm. */
export function chuanSo(s: string): string {
  return String(s ?? '').trim().replace(',', '.')
}

export function cauDung(phan: 'I' | 'II' | 'III', chon: string, dapAn: string): boolean {
  const c = String(chon ?? '')
  const d = String(dapAn ?? '')
  if (phan === 'I') return c !== '' && c === d
  // Phần II đúng khi CẢ BỐN Ý khớp — đúng luật `taoChiTietCau` của ca thi.
  if (phan === 'II') return c === d
  return chuanSo(c) !== '' && chuanSo(c) === chuanSo(d)
}

export function chamTuLuyen(cau: CauLuyen[], chon: ChonTuLuyen): CauDaCham[] {
  return cau.map((c) => {
    const ch = String(chon[c.id] ?? '')
    return {
      qid: c.id,
      phan: c.phan,
      chuyenDe: String(c.chuyenDe || ''),
      mucDo: String(c.mucDo || ''),
      chon: ch,
      dapAn: String(c.dapAn || ''),
      dung: cauDung(c.phan, ch, String(c.dapAn || '')),
    }
  })
}

// ---------------------------------------------------------------------------
// TỔNG HỢP — MỘT BỘ SỐ, HAI CHỖ DÙNG
//
// Thầy chốt 05/09, hai lệnh liền nhau:
//   · mỗi lần gửi báo cáo phụ huynh đều kèm khối phân tích bài tự luyện;
//   · và ĐẦU TRANG mỗi link bài luyện luôn có biểu đồ tổng hợp mạnh–yếu, cách
//     làm bài của tất cả các buổi trước.
//
// Hai chỗ đó cần đúng một bộ số, nên chỉ có một hàm dựng nó: `tomTatTuLuyen`.
// Dựng hai lần ở hai nơi là hai nơi nói khác nhau về cùng một em.
//
// Khối này ĐỨNG RIÊNG, không trộn vào phần mạnh–yếu của ca thi: ở nhà em được
// mở sách vở tra cứu, trong lớp thì không — hai thang đo khác nhau.

/** Một câu trong lịch sử — đủ để đếm, không có nội dung, không có đáp án. */
export interface CauNhe {
  qid: string
  phan: 'I' | 'II' | 'III'
  chuyenDe: string
  mucDo: string
  chon: string
  dung: boolean
}

/** Một lần em nộp, đọc từ cột ChiTietJson. */
export interface LanLamTuLuyen {
  lanThu: number
  nopLuc: string
  soDung: number
  soCau: number
  cau: CauNhe[]
}

/** Một buổi đã làm — dạng máy chủ gửi kèm khi em mở link (`lichSuEm`). */
export interface BuoiTuLuyen {
  ma: string
  nopLuc: string
  soCau: number
  soDung: number
  lanThu: number
  cau: CauNhe[]
}

/** Một dòng sheet `BaiTuLuyen` như `danhSachTuLuyen` trả về (máy thầy). */
export interface BaiTuLuyenRow {
  ma: string
  sbd: string
  hoTen: string
  taoLuc: string
  soCau: number
  /** Số câu mỗi chuyên đề LÚC TẠO — có cả khi em chưa làm. */
  chuyenDe: Record<string, number>
  lanThu: number
  nopLuc: string
  soDung: number | null
  soCauLam: number | null
  lichSu: LanLamTuLuyen[]
}

export interface CotBuoi {
  ma: string
  nhan: string
  soCau: number
  soDung: number
  tiLeDung: number
}

export interface NhomDem {
  ten: string
  soCau: number
  soDung: number
  tiLeDung: number
}

export interface TomTatTuLuyen {
  soBuoi: number
  tongCau: number
  tongDung: number
  tiLeDung: number
  /** Từng buổi, CŨ → MỚI. Đường tiến bộ. */
  cot: CotBuoi[]
  /** Buổi mới nhất — số liệu chính của khối trong báo cáo phụ huynh. */
  moiNhat: CotBuoi | null
  /** Chuyên đề cộng dồn MỌI buổi, yếu nhất lên trước. */
  chuyenDe: NhomDem[]
  /** Cách làm bài: theo mức độ nhận thức, và theo phần đề. */
  theoMucDo: NhomDem[]
  theoPhan: NhomDem[]
}

/** Số buổi gần nhất vẽ thành cột. Nhiều hơn thì cột bé không đọc nổi nhãn trên
 * điện thoại 360 px. */
export const SO_BUOI_VE_COT = 8

export const TEN_MUC_DO: Record<string, string> = { biet: 'Nhận biết', hieu: 'Thông hiểu', van_dung: 'Vận dụng' }
export const THU_TU_MUC_DO = ['biet', 'hieu', 'van_dung']
export const TEN_PHAN: Record<string, string> = { I: 'Trắc nghiệm', II: 'Đúng/Sai', III: 'Trả lời ngắn' }

/** Nhãn cột: ngày/tháng. Ngắn vì cột biểu đồ trên điện thoại rất hẹp. */
export function nhanNgay(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function dem(cau: CauNhe[], khoa: (c: CauNhe) => string, ten: (k: string) => string): Map<string, NhomDem> {
  const m = new Map<string, NhomDem>()
  for (const c of cau) {
    const k = khoa(c)
    const g = m.get(k) ?? { ten: ten(k), soCau: 0, soDung: 0, tiLeDung: 0 }
    g.soCau++
    if (c.dung) g.soDung++
    m.set(k, g)
  }
  for (const g of m.values()) g.tiLeDung = g.soCau > 0 ? g.soDung / g.soCau : 0
  return m
}

/** Dựng bộ số từ danh sách buổi ĐÃ LÀM, cũ → mới.
 *
 * Buổi chưa làm không vào đây: một cột rỗng nói dối rằng em làm sai hết. */
export function tomTatTuLuyen(buoi: BuoiTuLuyen[]): TomTatTuLuyen {
  const theoThoiGian = [...buoi].sort((a, b) => new Date(a.nopLuc).getTime() - new Date(b.nopLuc).getTime())
  const moiCau = theoThoiGian.flatMap((b) => b.cau)

  const cot: CotBuoi[] = theoThoiGian.slice(-SO_BUOI_VE_COT).map((b) => ({
    ma: b.ma,
    nhan: nhanNgay(b.nopLuc),
    soCau: b.soCau,
    soDung: b.soDung,
    tiLeDung: b.soCau > 0 ? b.soDung / b.soCau : 0,
  }))

  const tongCau = theoThoiGian.reduce((n, b) => n + b.soCau, 0)
  const tongDung = theoThoiGian.reduce((n, b) => n + b.soDung, 0)

  const cd = dem(
    moiCau,
    (c) => (c.chuyenDe || '').trim() || '(chưa phân loại)',
    (k) => k,
  )
  const md = dem(
    moiCau,
    (c) => String(c.mucDo || ''),
    (k) => TEN_MUC_DO[k] ?? 'Chưa xếp mức',
  )
  const ph = dem(
    moiCau,
    (c) => c.phan,
    (k) => TEN_PHAN[k] ?? k,
  )

  return {
    soBuoi: theoThoiGian.length,
    tongCau,
    tongDung,
    tiLeDung: tongCau > 0 ? tongDung / tongCau : 0,
    cot,
    moiNhat: cot.length > 0 ? cot[cot.length - 1] : null,
    // Yếu nhất lên trước: dòng đầu là chỗ cần kèm.
    chuyenDe: [...cd.values()].sort((a, b) => a.tiLeDung - b.tiLeDung || b.soCau - a.soCau),
    // Mức độ giữ đúng thứ tự nhận thức, không xếp theo số — đọc theo bậc mới có nghĩa.
    theoMucDo: [...md.entries()].sort((a, b) => THU_TU_MUC_DO.indexOf(a[0]) - THU_TU_MUC_DO.indexOf(b[0])).map(([, v]) => v),
    theoPhan: [...ph.entries()].sort((a, b) => ['I', 'II', 'III'].indexOf(a[0]) - ['I', 'II', 'III'].indexOf(b[0])).map(([, v]) => v),
  }
}

/** Đổi các dòng sheet (máy thầy đọc được cả bài chưa làm) sang danh sách buổi.
 * Mỗi bài chỉ lấy LẦN LÀM CUỐI — làm lại năm lượt mà đếm cả năm thì đường tiến
 * bộ nói dối. */
export function buoiTuDongSheet(rows: BaiTuLuyenRow[]): BuoiTuLuyen[] {
  const ra: BuoiTuLuyen[] = []
  for (const r of rows) {
    if (!r.nopLuc || !r.lichSu?.length) continue
    const cuoi = [...r.lichSu].sort((a, b) => a.lanThu - b.lanThu).pop()
    if (!cuoi) continue
    ra.push({ ma: r.ma, nopLuc: r.nopLuc, soCau: cuoi.soCau, soDung: cuoi.soDung, lanThu: cuoi.lanThu, cau: cuoi.cau ?? [] })
  }
  return ra
}
