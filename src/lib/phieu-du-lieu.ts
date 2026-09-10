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
import { cauLuyenTuBoCau, cauLuyenTuNguon, chonCauLuyen, type CauLuyen } from './bai-tap-pdf'
import { rutDeChua, soCauChuaThat, type PoolCauSai, type SuatThieu } from './rut-de-chua'
import { chanDoanChoPhieu, type CoChanDoan, type CumChanDoan } from './chan-doan-phieu'
import { SO_CAU_KEM_PHIEU } from './cau-hinh-chua'
import type { LocDang } from './dang-cau'
import { mocRoiMan } from './chong-gian-lan'
import type { CauHinhPhieu } from './cau-hinh-phieu'

/** Phiên bản gói báo cáo. Trang đọc từ chối bản lạ thay vì vẽ thiếu mục.
 *
 * VỀ LẠI 2 (thầy chốt 08/09: "khôi phục phiếu và html về bản cũ"). Phiếu dựng
 * từ nay mang bố cục cũ. Bản `3` KHÔNG bị xoá khỏi danh sách đọc được ngay
 * dưới: link v3 thầy đã gửi phụ huynh phải còn mở ra đúng như lúc gửi. */
export const BAN_PHIEU = 2

/** Bản gói mà trang báo cáo còn ĐỌC ĐƯỢC. Giữ CẢ HAI bản, theo cả hai chiều:
 * link v2 cũ mở ra bố cục cũ, link v3 đã gửi mở ra bố cục v3. Rút một bản ra
 * khỏi danh sách này là giết mọi link đã gửi mang bản đó. */
export const BAN_PHIEU_DOC_DUOC = [2, 3] as const

export interface LyDoPhuongAn {
  khoa: string
  dung: boolean
  ly: string
}

export interface CauSaiChiTiet {
  phan: 'I' | 'II' | 'III'
  soCau: number
  /** Mã câu trong kho đề — tấm trượt Hỏi bài Thầy gửi đúng mã này lên. */
  qid: string
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
  /** Câu có hình trong đề gốc. Giữ lại kể cả khi đã kèm ảnh: gói quá cỡ thì
   * `giamGoiPhieu` bỏ ảnh ra, và lúc đó báo cáo vẫn phải nói thẳng là câu này
   * có hình chứ không im lặng để phụ huynh tưởng đề chỉ có chữ. */
  coHinh: boolean
  /** ẢNH CỦA CÂU, đi thẳng vào báo cáo (thầy chốt 08/09: "câu làm sai trong
   * báo cáo của học sinh và phụ huynh cũng phải hiển thị hình đầy đủ").
   *
   * Ba trường giống hệt `CauLuyen` để `TheCauChiTiet` dựng một kiểu duy nhất.
   * Ảnh là base64 nên đây là phần NẶNG NHẤT của gói; `giamGoiPhieu` bỏ chúng
   * TRƯỚC mọi thứ khác khi gói vượt cỡ. */
  anhThanCau?: string
  anhLuaChon?: (string | undefined)[]
  hinh?: { src: string; viTri: string; alt?: string }[]
  /** Bao nhiêu phần lớp chọn ĐÚNG phương án sai này (0…1). `null` khi không có
   * bảng chấm cả lớp — v3 mục 4.3: tới NGUONG_LOP_CUNG_SAI thì câu đó là bẫy
   * của đề chứ không phải lỗi riêng của em, và báo cáo phải nói ra. */
  tiLeLopSai?: number | null
  /** Số em cùng chọn phương án sai đó, và sĩ số đã chấm — để in "6/10 bạn cùng
   * sai" bằng số thật chứ không bằng phần trăm làm tròn. */
  soLopSai?: number | null
  siSoLop?: number | null
  /** Cả năm em làm chuyên đề này bao nhiêu câu, sai mấy — nguồn cho dòng lịch
   * sử cuối thẻ câu. `null` khi hồ sơ chưa có số cộng dồn. */
  lichSuChuyenDe?: { soCau: number; soSai: number } | null
  /** CÂU LẶP — chính câu em đã sai ở ca trước, nay hỏi lại (DE-RIENG-TUNG-EM
   * mục 4.4). Câu mới thì trường này vắng mặt, KHÔNG phải `false` giả. */
  laCauLap?: boolean
  /** Tổng số lần em làm sai ĐÚNG câu này, tính cả lần này, đếm qua toàn bộ
   * lịch sử. Chỉ có nghĩa khi `laCauLap`. */
  soLanSai?: number
  /** Câu lặp mà lần này em làm ĐÚNG. Đây là tin tốt duy nhất trong báo cáo mà
   * máy chứng minh được bằng số.
   *
   * CHỈ gắn cho câu lặp: câu mới làm đúng thì không có gì để "sửa". */
  daSuaDuoc?: boolean
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
  /** TRẦN ĐIỂM từng phần của ca này. Thiếu ⇒ phiếu cũ, hiểu là 10 cho cả ba.
   *
   * Bản cũ in "1,69/10" cho từng phần vì mẫu số bị đóng cứng là 10 — sai với
   * mọi ca: Phần I tối đa 4,50 chứ không phải 10. Ca 8/2/2 của thầy (07/09)
   * làm chỗ này lộ ra rõ nhất. */
  tranPhan?: { I: number; II: number; III: number } | null
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
  /** Vì sao chưa đủ câu chữa — nói thật thay vì lấy bừa cho đủ. */
  thieuChua?: string[]
  /** Kho còn bao nhiêu câu cùng dạng với câu em sai (v4 mục 4.2). */
  tongUngVien?: number
  /** Pool riêng từng câu sai — để trang báo cáo dựng ĐÚNG dòng cảnh báo mà màn
   * thầy đang hiện, thay vì một chuỗi đã bị làm phẳng.
   *
   * Thầy chốt 07/09: "đồng bộ phần rút câu ở đây sang hai chỗ báo cáo phụ huynh
   * và học sinh". Gói cũ chỉ chở `thieuChua: string[]` nên trang báo cáo không
   * nói được câu nào hết hàng. */
  poolChua?: PoolCauSai[]
  /** `thieu[]` nguyên cấu trúc, đi kèm `poolChua`. */
  thieuChuaChiTiet?: SuatThieu[]
  /** LINK PHIẾU BÀI TẬP đã cất sẵn trên kho, để phụ huynh copy gửi thẳng cho
   * con — con mở link là làm bài, không phải mở báo cáo của phụ huynh.
   *
   * Link do MÁY THẦY tạo lúc dựng báo cáo (chỗ duy nhất có mã bí mật). Trang
   * báo cáo chỉ việc copy, không ghi được gì lên máy chủ. */
  linkBaiTap?: string
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
  /** CẤU HÌNH CHỐT LÚC DỰNG PHIẾU (v3 mục 3). Báo cáo mở trên máy phụ huynh,
   * không đọc được cài đặt của thầy — nên cờ phải đi theo gói. Gói v2 không có
   * trường này ⇒ `cauHinhPhieu()` trả bản mặc định. */
  cauHinh?: Partial<CauHinhPhieu> | null
  /** Một dòng nói RÕ điểm này ra từ đâu, tính lại từ `rows` (v3 mục 4.4).
   * Nghiên cứu cùng nguồn với mục 3 ghi nhận điều phụ huynh bối rối nhất là
   * "không có thông tin nào về việc làm sao ra được điểm đó". */
  cachTinhDiem?: string
  /** Ca ĐỀ RIÊNG TỪNG EM: mỗi em một bộ câu, nên hạng lớp và phân bố lớp mất
   * nghĩa và bị tắt bất kể `HIEN_HANG_LOP` (DE-RIENG-TUNG-EM mục 2). */
  deRieng?: boolean
  /** CÂU LẶP EM ĐÃ SỬA ĐƯỢC — câu từng sai, ca này làm đúng. Đứng riêng, KHÔNG
   * nằm trong `cauSai`, và hiện thành một khối ngay TRÊN mục Từng câu sai. */
  daSuaDuoc?: CauSaiChiTiet[]
  /** Số câu lặp trong đề của em, và một dòng nói ra chuyện đó cho phụ huynh.
   * Giấu con số này là để phụ huynh hiểu nhầm về tiến bộ (mục 2, hệ quả hai). */
  soCauLap?: number
  dongCauLap?: string
  /** CHẨN ĐOÁN NGUYÊN NHÂN SAI (RUT-CAU-CHUA-THEO-NGUYEN-NHAN mục "màn hình").
   *
   * Một dòng cho mỗi CỤM câu cùng bệnh, viết cho em đọc và luôn kèm số. Vắng
   * mặt khi không đủ căn cứ để chẩn — lúc đó `chanDoanCam` nói rõ vì sao, chứ
   * phiếu không dán nhãn bằng dữ liệu rỗng. */
  chanDoanCum?: CumChanDoan[]
  /** Cờ cho THẦY, hiện ở màn Ca thi — không in cho phụ huynh. */
  chanDoanCo?: CoChanDoan[]
  /** Dòng cam nói thẳng vì sao chưa chẩn được. */
  chanDoanCam?: string[]
  /** Số câu chữa đã BỎ vì kê cho lỗi bừa / hết giờ. Đặc tả cấm kê câu kiến thức
   * cho bệnh này; con số ở đây để không ai bỏ câu trong im lặng. */
  chanDoanDaBo?: number
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
  // ẢNH BỎ TRƯỚC TIÊN. Ảnh là base64, một câu có hình nặng bằng cả trăm câu
  // chỉ có chữ — bỏ nó cứu được gói mà mất ít nhất. Câu vẫn giữ `coHinh` nên
  // báo cáo còn nói được "câu này có hình, xem lại trong bài chữa".
  const coAnh = (c: CauSaiChiTiet) => Boolean(c.anhThanCau || c.hinh?.length || c.anhLuaChon?.some(Boolean))
  const boAnh = (ds: CauSaiChiTiet[]) => ds.map((c) => ({ ...c, anhThanCau: undefined, anhLuaChon: undefined, hinh: undefined }))
  if (ra.cauSai.some(coAnh) || (ra.daSuaDuoc ?? []).some(coAnh)) {
    ra = { ...ra, cauSai: boAnh(ra.cauSai), daSuaDuoc: ra.daSuaDuoc ? boAnh(ra.daSuaDuoc) : ra.daSuaDuoc }
    daBo.push('ảnh của câu sai')
    if (co(ra) <= toiDa) return { phieu: ra, daBo }
  }
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

/** Ảnh của một câu, gom về đúng ba trường `CauSaiChiTiet` mang.
 *
 * Trường nào rỗng thì KHÔNG có mặt trong gói — thêm `undefined` vào JSON chỉ
 * làm gói phình mà không nói thêm gì. */
function anhCua(q: CauBatKy, phan: 'I' | 'II' | 'III'): Pick<CauSaiChiTiet, 'anhThanCau' | 'anhLuaChon' | 'hinh'> {
  const x = q as {
    thanCauImg?: string
    choiceImgs?: (string | undefined)[]
    ideaImgs?: (string | undefined)[]
    hinhAnh?: { src: string; viTri: string; alt?: string }[]
    imageDataUrl?: string
  }
  const hinh: { src: string; viTri: string; alt?: string }[] = [...(x.hinhAnh ?? []).map((h) => ({ src: h.src, viTri: String(h.viTri), alt: h.alt }))]
  if (x.imageDataUrl) hinh.unshift({ src: x.imageDataUrl, viTri: 'sau_de' })
  const anhPa = phan === 'I' ? x.choiceImgs : phan === 'II' ? x.ideaImgs : undefined
  const ra: Pick<CauSaiChiTiet, 'anhThanCau' | 'anhLuaChon' | 'hinh'> = {}
  if (x.thanCauImg) ra.anhThanCau = x.thanCauImg
  if (anhPa && anhPa.some(Boolean)) ra.anhLuaChon = [...anhPa]
  if (hinh.length > 0) ra.hinh = hinh
  return ra
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
/** Số liệu THÊM cho từng câu sai, v3 mục 4.3. Tuỳ chọn: thiếu thì mấy mục dùng
 * nó biến mất khỏi báo cáo, chứ không hiện ra với số 0 giả. */
export interface ThemChoCauSai {
  /** Bảng chấm từng câu của CẢ LỚP trong ca — để đếm bao nhiêu bạn cùng sai
   * đúng phương án đó. Một câu đếm một lần cho một em. */
  rowsLop?: ChiTietCauRow[] | null
  /** Chuyên đề cộng dồn cả năm của em (hồ sơ). */
  chuyenDeTong?: { ten: string; soCau: number; soSai: number }[] | null
  /** CÂU LẶP của em trong ca này: qid → tổng số lần em từng sai câu đó TRƯỚC
   * ca này (DE-RIENG-TUNG-EM mục 4.4). Ca thường không truyền ⇒ không câu nào
   * mang nhãn lặp, đúng như trước. */
  lapCua?: Record<string, number> | null
}

export function dungCauSai(rows: ChiTietCauRow[], banks: TeacherExamSource[], chiCauSai = true, them?: ThemChoCauSai | null): CauSaiChiTiet[] {
  const tra = timCauTheoQid(banks)
  // Đếm CẢ LỚP cùng chọn phương án nào, theo từng câu. Khoá là qid + đáp án
  // chọn; giá trị là số EM khác nhau — một em thi lại hai lần không được tính
  // thành hai bạn.
  const demLop = new Map<string, Set<string>>()
  const emCoCau = new Map<string, Set<string>>()
  for (const r of them?.rowsLop ?? []) {
    if (!r.qid) continue
    const sbd = String((r as { sbd?: string }).sbd ?? '')
    if (!sbd) continue
    const kCau = r.qid
    if (!emCoCau.has(kCau)) emCoCau.set(kCau, new Set())
    emCoCau.get(kCau)!.add(sbd)
    if (r.dungSai !== false) continue
    const k = `${r.qid}|${String(r.dapAnChon ?? '')}`
    if (!demLop.has(k)) demLop.set(k, new Set())
    demLop.get(k)!.add(sbd)
  }
  const cdTong = new Map((them?.chuyenDeTong ?? []).map((c) => [c.ten, c]))
  const ra: CauSaiChiTiet[] = []
  for (const r of rows) {
    // `chiCauSai = false` để tấm trượt Hỏi bài Thầy liệt kê TRỌN đề — em hỏi
    // được cả câu mình làm đúng mà chưa hiểu vì sao đúng.
    if (chiCauSai && r.dungSai) continue
    const q = tra.get(r.qid)
    if (!q) continue
    const mcq = q as TeacherMcqQuestion
    const tf = q as TeacherTrueFalseQuestion
    ra.push({
      phan: r.phan,
      soCau: r.soCau,
      qid: r.qid,
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
      // ẢNH ĐI THEO CÂU. Ba nguồn, đúng như `bai-tap-pdf.doiSang` gom:
      //   · `thanCauImg` — ảnh cắt cả thân câu, THAY chữ đề;
      //   · `choiceImgs` / `ideaImgs` — ảnh riêng từng phương án / từng ý;
      //   · `hinhAnh` + `imageDataUrl` — ảnh chèn theo vị trí trong câu.
      // Gom ở đây chứ không ở màn hình: ba chỗ hiện câu dùng chung một thẻ.
      ...anhCua(q, r.phan),
      ...(() => {
        const siSo = emCoCau.get(r.qid)?.size ?? 0
        if (!siSo) return { tiLeLopSai: null, soLopSai: null, siSoLop: null }
        const cung = demLop.get(`${r.qid}|${String(r.dapAnChon ?? '')}`)?.size ?? 0
        return { tiLeLopSai: cung / siSo, soLopSai: cung, siSoLop: siSo }
      })(),
      lichSuChuyenDe: (() => {
        const c = cdTong.get(r.chuyenDe || '')
        return c && c.soCau > 0 ? { soCau: c.soCau, soSai: c.soSai } : null
      })(),
      // NHÃN CÂU LẶP. Ba trường này đi cùng nhau hoặc cùng vắng mặt — chỗ hiện
      // chỉ đọc, không tự tính, để ba nơi (báo cáo, chi tiết ca, màn em xem
      // lại) nói giống hệt nhau.
      ...(() => {
        const truoc = them?.lapCua?.[r.qid]
        if (typeof truoc !== 'number') return {}
        if (r.dungSai) return { laCauLap: true, soLanSai: truoc, daSuaDuoc: true }
        return { laCauLap: true, soLanSai: truoc + 1, daSuaDuoc: false }
      })(),
    })
  }
  return ra
}

/** CÂU LẶP EM ĐÃ SỬA ĐƯỢC — câu từng sai, ca này làm đúng.
 *
 * Đứng riêng chứ không nằm trong `cauSai`: em làm đúng thì không phải câu sai.
 * `dungCauSai(rows, banks, false, ...)` mới trả cả câu đúng, nên chỗ gọi đưa
 * vào đây danh sách TRỌN đề rồi lọc — một chỗ lọc, không mỗi nơi một kiểu. */
export function cauDaSuaDuoc(tronDe: CauSaiChiTiet[]): CauSaiChiTiet[] {
  return tronDe.filter((c) => c.laCauLap === true && c.daSuaDuoc === true)
}

/** Dòng nói RÕ ca này có câu lặp — DE-RIENG-TUNG-EM mục 2, hệ quả hai.
 *
 * Ba mươi phần trăm đề là câu em đã gặp, nên điểm nhích lên một phần vì gặp
 * lại chứ không hẳn vì giỏi lên. Giấu chuyện đó là để phụ huynh hiểu nhầm về
 * tiến bộ của con. Không có câu lặp thì KHÔNG dựng dòng. */
export function dongCauLap(soLap: number, tongSoCau: number | null): string {
  const n = Math.max(0, Math.floor(Number(soLap) || 0))
  if (n === 0) return ''
  const tong = Number(tongSoCau)
  const phan = Number.isFinite(tong) && tong > 0 ? ` trên ${tong} câu` : ''
  return `Trong đó ${n} câu${phan} là câu con từng sai, nay làm lại.`
}

const TEN_PHAN_DAI: Record<'I' | 'II' | 'III', string> = {
  I: 'trắc nghiệm',
  II: 'đúng/sai',
  III: 'trả lời ngắn',
}

function soVi(x: number, soLe = 2): string {
  return x.toFixed(soLe).replace('.', ',')
}

/** MỘT DÒNG NÓI RÕ ĐIỂM RA TỪ ĐÂU — v3 mục 4.4.
 *
 * Đếm lại từ `rows`, không lấy con số nào có sẵn: dòng này tồn tại để phụ
 * huynh đối chiếu, mà lấy lại chính con số đang cần kiểm thì kiểm cái gì.
 *
 * Trả chuỗi rỗng khi thiếu điểm từng phần hoặc thiếu trần từng phần — thà
 * không có dòng còn hơn có một dòng không cộng ra điểm thật. */
export function dongCachTinhDiem(
  rows: ChiTietCauRow[],
  diemPhan: { I: number; II: number; III: number } | null | undefined,
  tranPhan: { I: number; II: number; III: number } | null | undefined,
): string {
  if (!diemPhan || !tranPhan) return ''
  const phan: ('I' | 'II' | 'III')[] = ['I', 'II', 'III']
  const manh: string[] = []
  let coBoTrong = false
  for (const p of phan) {
    const cua = rows.filter((r) => r.phan === p)
    if (cua.length === 0) continue
    const dung = cua.filter((r) => r.dungSai === true).length
    if (cua.some((r) => r.dungSai !== true && !String(r.dapAnChon ?? '').trim())) coBoTrong = true
    manh.push(`Phần ${p} ${TEN_PHAN_DAI[p]}: đúng ${dung}/${cua.length} câu, được ${soVi(diemPhan[p])} trên ${soVi(tranPhan[p])}`)
  }
  if (manh.length === 0) return ''
  const tong = diemPhan.I + diemPhan.II + diemPhan.III
  return `${manh.join('. ')}. Cộng lại là ${soVi(tong)} trên 10${coBoTrong ? '. Câu bỏ trống tính như câu sai' : ''}.`
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
  /** Chỉ lý thuyết, chỉ bài tập, hay ngẫu nhiên. Mặc định ngẫu nhiên. */
  dangBaiTap?: LocDang
  /** Câu em đã làm — tránh khi rút bài luyện. */
  qidDaLam?: string[] | null
  /** Nhật ký rời màn của lượt này. Không có thì báo cáo không có nút Vi phạm. */
  viPham?: NguonViPham | null
  /** Link phiếu bài tập đã cất sẵn trên kho (máy thầy tạo). */
  linkBaiTap?: string | null
  /** Bảng chấm từng câu của CẢ LỚP trong ca — chỉ để đếm "mấy bạn cùng sai".
   * Không có thì chip đó biến mất khỏi báo cáo, không hiện với số 0 giả. */
  rowsLop?: ChiTietCauRow[] | null
  /** Cấu hình báo cáo thầy đang đặt, đóng vào gói (v3 mục 3). */
  cauHinh?: Partial<CauHinhPhieu> | null
  /** Ca đề riêng từng em — tắt hạng và phân bố lớp bất kể cấu hình. */
  deRieng?: boolean | null
  /** CÂU LẶP của em trong ca này: qid → số lần em từng sai câu đó TRƯỚC ca
   * này. Ca thường không truyền ⇒ báo cáo không có nhãn lặp nào. */
  lapCua?: Record<string, number> | null
}

/** Số câu luyện RÚT SẴN vào báo cáo.
 *
 * Thầy chốt 04-09 tối: phụ huynh tự chọn con mình làm 10 đến 40 câu. Nên rút
 * sẵn đủ 40 rồi để trang báo cáo cắt xuống theo con số phụ huynh chọn — cắt ở
 * máy phụ huynh thì đổi số câu không phải ghi thêm phiếu nào lên máy chủ.
 *
 * Rút theo thứ tự dễ lên khó, nên lấy 10 câu đầu vẫn đúng là 10 câu dễ nhất
 * của đúng chuyên đề em yếu — không phải 10 câu ngẫu nhiên trong 40. */
export const SO_CAU_BAI_TAP_KEM = 60

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
  /** Trần điểm từng phần — xem ghi chú ở `PhieuDuLieu.tranPhan`. */
  tranPhan?: { I: number; II: number; III: number } | null
  rows: ChiTietCauRow[]
  banks: TeacherExamSource[]
  /** Nhật ký rời màn của chính lượt em vừa nộp (máy em giữ đủ). */
  viPham?: NguonViPham | null
  /** Điểm các ca trước CỦA CHÍNH MÁY NÀY — để vẽ đường tiến bộ trong báo cáo
   * của em. Không gọi máy chủ: mở một đường đọc công khai theo số báo danh là
   * cho bất kỳ ai biết SBD đọc được cả lịch sử điểm của em đó. */
  lichSu?: DiemMotCa[]
  /** CÂU KHẮC PHỤC RÚT TỪ KHO ĐỀ của trung tâm (thầy chốt 06/09). Có thì bộ
   * bài tập lấy từ đây; mất mạng hoặc máy chủ từ chối thì rơi về ngân hàng của
   * chính ca vừa thi như trước. */
  khoKhacPhuc?: TeacherExamSource[]
  /** Mã câu theo ĐÚNG thứ tự máy chủ đã xếp (dễ lên khó). Gói trả về gom theo
   * đề nên trong mỗi đề câu nằm theo thứ tự file gốc, không phải thứ tự đã
   * xếp — thiếu cái này là màn báo cáo hứa "dễ lên khó" mà em mở ra thấy câu
   * vận dụng nằm đầu. */
  thuTuKhacPhuc?: string[]
  /** qid → SỐ LẦN em đã sai câu đó TRƯỚC ca này. Đây là nguồn của nhãn "sai
   * lần thứ N" và của mục "Đã sửa được" trong báo cáo.
   *
   * Thầy bắt được 08/09: "học sinh thi xong nhưng chưa thống kê là đã làm sai
   * câu trước" — báo cáo máy em dựng tại chỗ vốn KHÔNG nhận trường này, nên ca
   * đề riêng thi xong là mọi dấu vết câu hỏi lại biến mất ở đúng màn em xem. */
  lapCua?: Record<string, number> | null
}

/** Chuyên đề em vừa MẤT ĐIỂM, xếp theo tỉ lệ sai giảm dần.
 *
 * Một nơi tính, hai nơi dùng: màn Làm bài gửi danh sách này lên máy chủ để rút
 * câu khắc phục, và `dungPhieuMayEm` dùng lại đúng thứ hạng đó khi phải rơi về
 * ngân hàng của ca. Tách đôi là hai đường ra hai thứ tự khác nhau. */
export function xepChuyenDeYeu(rows: ChiTietCauRow[]): { ten: string; tiLeSai: number }[] {
  const gom = new Map<string, { soCau: number; soSai: number }>()
  for (const r of rows) {
    const ten = r.chuyenDe || ''
    if (!ten) continue
    const cu = gom.get(ten) ?? { soCau: 0, soSai: 0 }
    cu.soCau += 1
    if (!r.dungSai) cu.soSai += 1
    gom.set(ten, cu)
  }
  return [...gom.entries()]
    .filter(([, v]) => v.soSai > 0)
    .map(([ten, v]) => ({ ten, tiLeSai: v.soSai / Math.max(1, v.soCau) }))
    .sort((a, b) => b.tiLeSai - a.tiLeSai)
}

/** Danh sách chuyên đề GỬI LÊN MÁY CHỦ để rút câu khắc phục, đã xếp hạng.
 *
 * Chuyên đề em MẤT ĐIỂM đứng trước — đó là chỗ phải luyện. Nhưng chỉ gửi mấy
 * chuyên đề đó thì có bài em chỉ sai đúng một chuyên đề, kho không đủ 60 câu
 * ngoài những câu em vừa làm, thanh kéo dừng ở ba bốn chục (thầy báo 06/09).
 * Nên NỐI THÊM các chuyên đề còn lại CỦA CHÍNH CA đó vào sau: vẫn đúng kiến
 * thức của bài vừa thi, chỉ là ưu tiên thấp hơn. Máy chủ xếp theo đúng thứ tự
 * này nên câu của chuyên đề yếu luôn nằm ở đầu bộ. */
export function chuyenDeXinKho(rows: ChiTietCauRow[]): string[] {
  const yeu = xepChuyenDeYeu(rows).map((x) => x.ten)
  const daCo = new Set(yeu)
  const buThem: string[] = []
  for (const r of rows) {
    const ten = r.chuyenDe || ''
    if (!ten || daCo.has(ten)) continue
    daCo.add(ten)
    buThem.push(ten)
  }
  return [...yeu, ...buThem]
}

/** Xếp lại bộ câu theo đúng thứ tự máy chủ đã chọn. Câu không có trong danh
 * sách thứ tự (dữ liệu lệch) xuống cuối chứ KHÔNG bị vứt — thà sai thứ tự còn
 * hơn mất câu. */
function xepTheoThuTuKho(cau: CauLuyen[], thuTu: string[] | undefined): CauLuyen[] {
  if (!thuTu || thuTu.length === 0) return cau
  const hang = new Map<string, number>()
  thuTu.forEach((id, i) => hang.set(id, i))
  return [...cau].sort((a, b) => (hang.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (hang.get(b.id) ?? Number.MAX_SAFE_INTEGER))
}

export function dungPhieuMayEm(n: NguonPhieuMayEm): PhieuDayDu {
  const themCauSai: ThemChoCauSai = { lapCua: n.lapCua ?? null }
  const cauSai = dungCauSai(n.rows, n.banks, true, themCauSai)
  // TRỌN ĐỀ (kể cả câu đúng) chỉ để lọc ra câu lặp em ĐÃ SỬA ĐƯỢC — giống hệt
  // `dungPhieu`, một luật cho cả hai đường dựng báo cáo.
  const daSuaDuocEm = n.lapCua ? cauDaSuaDuoc(dungCauSai(n.rows, n.banks, false, themCauSai)) : []
  const soCauLapEm = n.rows.filter((r) => typeof n.lapCua?.[r.qid] === 'number').length

  const chuyenDeYeu = xepChuyenDeYeu(n.rows)
  // NGUỒN CÂU KHẮC PHỤC — thầy chốt 06/09: RÚT TỪ KHO ĐỀ.
  //
  // Máy chủ đã chọn sẵn theo đúng chuyên đề em mất điểm và đã bỏ hẳn những câu
  // em vừa làm trong ca, nên ở đây chỉ việc lấy đúng thứ tự đó. Trần thật lúc
  // này là 60 câu chứ không còn là số câu của ca.
  //
  // Không lấy được (mất mạng, máy chủ từ chối, kho chưa có câu nào của chuyên
  // đề đó) thì RƠI VỀ ngân hàng của chính ca vừa thi: chuyên đề em mất điểm
  // xếp trước, phần còn lại của ca nối vào sau. Thà ít câu còn hơn màn trắng.
  const tuKho = xepTheoThuTuKho(n.khoKhacPhuc && n.khoKhacPhuc.length > 0 ? cauLuyenTuNguon(n.khoKhacPhuc) : [], n.thuTuKhacPhuc)
  const daLamTrongCa = new Set(n.rows.map((r) => r.qid).filter(Boolean))
  const uuTien = n.banks.length > 0 && chuyenDeYeu.length > 0 ? chonCauLuyen(n.banks, { chuyenDe: chuyenDeYeu, qidDaLam: [], soCau: SO_CAU_BAI_TAP_KEM }).cau : []
  const daCo = new Set(uuTien.map((c) => c.id))
  const conLai = n.banks.length > 0 ? cauLuyenTuNguon(n.banks).filter((c) => !daCo.has(c.id)) : []
  const duPhong = [...uuTien, ...conLai]
  // QUA CỔNG MÃ DẠNG, giống hệt `dungPhieu` — thầy chốt 07/09: "áp dụng cho tất
  // cả các phiếu". Máy chủ mới chỉ lọc theo CHUYÊN ĐỀ; cổng siết tiếp theo MÃ
  // DẠNG của đúng câu em sai và gắn nhãn "chữa câu mấy".
  //
  // Cùng luật lui như bên kia: cổng rỗng thì vẫn có bài luyện, nhưng những câu
  // đó KHÔNG mang nhãn chữa.
  const coCauSaiEm = n.rows.some((r) => r.dungSai === false)
  const khoChua = n.khoKhacPhuc ?? []
  const kqChuaEm =
    khoChua.length > 0 && coCauSaiEm
      ? rutDeChua({ khoDe: khoChua, rows: n.rows, qidTranh: [...daLamTrongCa], soCau: SO_CAU_KEM_PHIEU, nguonCauSai: n.banks })
      : null
  // Thẻ "làm lại chính câu em sai" (thầy chốt 07/09) là PHẦN THÊM, không phải
  // phần thay. Đếm nó như một câu chữa thì em chỉ nhận đúng một câu thay vì cả
  // bộ luyện — nên chỗ quyết định lui hay không dùng `soCauChuaThat`.
  const lamLaiEm = (kqChuaEm?.cau ?? []).filter((c) => c.chuaCho?.laLamLai)
  // Kho trả về rồi thì KHÔNG trộn thêm câu của ca vào: câu của ca là câu em
  // vừa làm, luyện lại chỉ là nhớ đáp án. Ngoại lệ duy nhất là thẻ làm lại ở
  // trên — chính câu em sai, cố ý đưa lại.
  const baiTapEm =
    soCauChuaThat(kqChuaEm) > 0
      ? (kqChuaEm as NonNullable<typeof kqChuaEm>).cau
      : [...lamLaiEm, ...(tuKho.length > 0 ? tuKho.filter((c) => !daLamTrongCa.has(c.id)) : duPhong)].slice(0, SO_CAU_BAI_TAP_KEM)
  // CHẨN ĐOÁN NGUYÊN NHÂN. Máy em KHÔNG có bảng chấm cả lớp, nên đường này chỉ
  // ra đúng một dòng nói thật thay vì nhãn bịa — xem `chanDoanChoPhieu`.
  const cdEm = chanDoanChoPhieu({
    rows: n.rows,
    rowsLop: null,
    khoDe: n.khoKhacPhuc ?? null,
    nguonCauSai: n.banks,
    giayRoiMan: n.viPham?.tongGiay ?? null,
    cau: baiTapEm,
  })
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
    tranPhan: n.tranPhan ?? null,
    soCauSai: tk.soSai,
    tongSoCau: tk.tongCau,
    // Máy em KHÔNG biết bảng điểm cả lớp — để trống, trang báo cáo tự giấu mục.
    hang: null,
    siSo: null,
    chuyenDeCa,
    chuyenDeTong: [],
    lichSu: n.lichSu ?? [],
    diemLop: [],
    vieCanLam: '',
    thongKe: tk,
    tinHieu: tinHieuLamBai(tk),
    ducKet: ducKetKienThuc(cauSai.map((c) => ({ chuyenDe: c.chuyenDe, chot: c.chot }))),
    cauSai,
    daSuaDuoc: daSuaDuocEm,
    soCauLap: soCauLapEm,
    dongCauLap: dongCauLap(soCauLapEm, tk ? tk.tongCau : n.rows.length || null),
    dai: n.rows.map((r) => ({ nhan: `Phần ${r.phan} câu ${r.soCau}`, giay: r.giay, dung: Boolean(r.dungSai) })),
    viPham: dungViPham(n.viPham),
    // KHÔNG kèm `deCuaEm`: thầy chốt 04-09 khuya "mục này của xem báo cáo sau
    // thi cắt luôn" — đề đầy đủ chỉ đi theo báo cáo thầy gửi phụ huynh.
    //
    // CÓ kèm bài luyện (thầy chốt 06/09): em tự tạo bộ câu khắc phục lỗi sai
    // ngay sau khi nộp, lúc còn nhớ mình vướng chỗ nào.
    baiTap: cdEm.cau,
    chanDoanCum: cdEm.cum.length > 0 ? cdEm.cum : undefined,
    chanDoanCo: cdEm.co.length > 0 ? cdEm.co : undefined,
    chanDoanCam: cdEm.canhBao.length > 0 ? cdEm.canhBao : undefined,
    chanDoanDaBo: cdEm.daBo > 0 ? cdEm.daBo : undefined,
    tongUngVien: kqChuaEm?.tongUngVien,
    poolChua: kqChuaEm?.poolTheoCauSai,
    thieuChuaChiTiet: kqChuaEm?.thieu,
    thieuChua: (() => {
      const ds = kqChuaEm ? kqChuaEm.thieu.map((t) => t.vi.charAt(0).toUpperCase() + t.vi.slice(1)) : []
      if (coCauSaiEm && (!kqChuaEm || kqChuaEm.cau.length === 0)) ds.push('Kho chưa đủ câu cùng dạng với câu em sai — phần dưới là bài luyện chung của chuyên đề, không phải câu chữa.')
      return ds.length > 0 ? ds : undefined
    })(),
  }
}

export function dungPhieu(n: NguonPhieu): PhieuDayDu {
  const rows = n.rows ?? []
  const banks = n.banks ?? []
  const themCauSai: ThemChoCauSai = { rowsLop: n.rowsLop, chuyenDeTong: n.hoSo.chuyenDe ?? [], lapCua: n.lapCua ?? null }
  const cauSai = rows.length && banks.length ? dungCauSai(rows, banks, true, themCauSai) : []
  // TRỌN ĐỀ (kể cả câu đúng) chỉ để lọc ra câu lặp em ĐÃ SỬA ĐƯỢC. Ca thường
  // không có `lapCua` nên bỏ qua luôn, không dựng thừa.
  const daSuaDuoc = n.lapCua && rows.length && banks.length ? cauDaSuaDuoc(dungCauSai(rows, banks, false, themCauSai)) : []
  const soCauLap = rows.filter((r) => typeof n.lapCua?.[r.qid] === 'number').length
  const tk = rows.length ? thongKeLamBai(rows, { vaoLuc: n.vaoLuc, nopLuc: n.ca.nopLuc, thoiLuongPhut: n.thoiLuongPhut }) : null

  // BÀI LUYỆN KÈM SẴN — thầy chốt 06/09: "chỉ rút bài tập từ những chuyên đề
  // được chọn của ca đó, theo điểm mạnh yếu của ca thi đó, không rút theo mạnh
  // yếu cộng dồn".
  //
  // Hai thứ khác nhau, trước đây gộp làm một nên sinh lỗi:
  //   · RANH GIỚI = MỌI chuyên đề của ca (`chuyenDeCa`), kể cả chuyên đề em làm
  //     đúng hết. Trước đây chỉ truyền danh sách chuyên đề SAI, và em không sai
  //     gì thì danh sách rỗng ⇒ `chonCauLuyen` hiểu rỗng là lấy TOÀN KHO.
  //   · ƯU TIÊN = chuyên đề sai nhiều nhất trong CA NÀY lên trước. Tỉ lệ sai
  //     tính từ `n.chuyenDeCa` của đúng ca, không cộng dồn ca cũ.
  const phamViCa = n.chuyenDeCa.map((c) => c.ten).filter(Boolean)
  // RANH GIỚI THEO MÃ ĐỀ: CHƯA nối ở đây, cố ý.
  //
  // Bản nháp 06/09 suy mã đề từ `banks` rồi bó theo đó. Bốn test bắt được ngay:
  // `banks` là ngân hàng của ca, mã đề trong đó KHÔNG khớp mã đề của kho, nên
  // ranh giới cho ra rỗng ⇒ bài luyện rỗng ⇒ phiếu mất `linkBaiTap` ⇒ báo cáo
  // mất hai nút copy. Đúng cơ chế lỗi thầy đang truy.
  //
  // Nguồn đúng là danh sách ĐỀ THẦY ĐÃ TÍCH lúc mở ca, cất riêng — xem đặc tả
  // RUT-DE-CHUA-CAU-SAI mục 2. Nối khi cổng `rutDeChua()` có thật.
  const yeuCa = n.chuyenDeCa
    .filter((c) => c.soSai > 0)
    .map((c) => ({ ten: c.ten, tiLeSai: c.soSai / Math.max(1, c.soCau) }))
    .sort((a, b) => b.tiLeSai - a.tiLeSai)
  const kho = n.khoDe ?? []

  // BÀI LUYỆN ĐI QUA CỔNG `rutDeChua` — thầy chỉ ra 07/09: "em Tuân thi Ester
  // nhưng lại gán câu xà phòng". Đúng: `chonCauLuyen` chỉ bó theo CHUYÊN ĐỀ,
  // mà xà phòng cũng là Ester, nên nó vào phiếu dù em không sai dạng đó. Cổng
  // so MÃ DẠNG của đúng câu em làm sai.
  //
  // BƯỚC LUI, và vì sao nó phải còn.
  //
  // Bản nháp đầu: em có sai mà kho hết câu cùng dạng thì để phiếu TRỐNG. Test
  // `tao-phieu-ca-ca` bắt ngay — trống thì không dựng phiếu bài tập, phiếu kết
  // quả mất `linkBaiTap`, báo cáo mất hai nút copy. Đúng lỗi thầy đã truy mấy
  // hôm liền. Không được đổi một lỗi lấy một lỗi.
  //
  // Nên: cổng ra câu nào thì dùng câu đó, và MỌI câu đó đều mang nhãn chữa. Cổng
  // ra rỗng thì mới lui về bài luyện chung của chuyên đề — những câu ấy KHÔNG
  // mang nhãn chữa, và `thieuChua` nói thẳng đây không phải câu chữa. Thà nói
  // "chưa đủ câu cùng dạng" còn hơn dán nhãn chữa lên một câu khác dạng.
  const coCauSai = rows.some((r) => r.dungSai === false)
  const kqChua =
    kho.length > 0 && coCauSai
      ? rutDeChua({ khoDe: kho, rows, qidTranh: n.qidDaLam ?? [], soCau: SO_CAU_KEM_PHIEU, nguonCauSai: banks })
      : null
  // Xem ghi chú ở `dungPhieuMayEm`: thẻ làm lại KHÔNG phải câu chữa, nên nó
  // không cứu được việc phải lui về bài luyện chung — nó đi kèm bộ ấy.
  const lamLai = (kqChua?.cau ?? []).filter((c) => c.chuaCho?.laLamLai)
  const phaiLui = kho.length > 0 && soCauChuaThat(kqChua) === 0
  const baiTap = phaiLui
    ? [
        ...lamLai,
        ...chonCauLuyen(kho, {
          chuyenDe: yeuCa,
          chuyenDeCa: phamViCa,
          dang: n.dangBaiTap,
          qidDaLam: [...(n.qidDaLam ?? []), ...lamLai.map((c) => c.id)],
          soCau: SO_CAU_BAI_TAP_KEM,
        }).cau,
      ].slice(0, SO_CAU_BAI_TAP_KEM)
    : (kqChua?.cau ?? [])
  const luiCoSai = phaiLui && coCauSai
  // CHẨN ĐOÁN NGUYÊN NHÂN. Đường này chạy trên MÁY THẦY và có `rowsLop`, nên là
  // chỗ duy nhất chẩn được thật: trung vị giây và độ chụm đều cần cả lớp.
  const cd = chanDoanChoPhieu({
    rows,
    rowsLop: n.rowsLop ?? null,
    khoDe: kho,
    nguonCauSai: banks,
    giayRoiMan: n.viPham?.tongGiay ?? null,
    cau: baiTap,
  })

  return {
    v: BAN_PHIEU,
    cauHinh: n.cauHinh ?? null,
    deRieng: n.deRieng === true,
    cachTinhDiem: dongCachTinhDiem(
      rows,
      n.ca.diemI !== null && n.ca.diemII !== null && n.ca.diemIII !== null ? { I: n.ca.diemI, II: n.ca.diemII, III: n.ca.diemIII } : null,
      n.ca.tranPhan ?? null,
    ),
    hoTen: n.hoSo.em.hoTen || '',
    sbd: n.hoSo.em.sbd || '',
    lop: n.hoSo.em.lop || n.ca.lop || '',
    tenCa: n.ca.tenCa || '',
    maCa: n.ca.maCa || '',
    ngay: n.ca.nopLuc || '',
    diem: n.ca.tong ?? 0,
    diemPhan: n.ca.diemI !== null && n.ca.diemII !== null && n.ca.diemIII !== null ? { I: n.ca.diemI, II: n.ca.diemII, III: n.ca.diemIII } : null,
    tranPhan: n.ca.tranPhan ?? null,
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
    daSuaDuoc,
    soCauLap,
    dongCauLap: dongCauLap(soCauLap, tk ? tk.tongCau : rows.length || null),
    dai: rows.map((r) => ({ nhan: `Phần ${r.phan} câu ${r.soCau}`, giay: r.giay, dung: Boolean(r.dungSai) })),
    viPham: dungViPham(n.viPham),
    baiTap: cd.cau,
    chanDoanCum: cd.cum.length > 0 ? cd.cum : undefined,
    chanDoanCo: cd.co.length > 0 ? cd.co : undefined,
    chanDoanCam: cd.canhBao.length > 0 ? cd.canhBao : undefined,
    chanDoanDaBo: cd.daBo > 0 ? cd.daBo : undefined,
    tongUngVien: kqChua?.tongUngVien,
    poolChua: kqChua?.poolTheoCauSai,
    thieuChuaChiTiet: kqChua?.thieu,
    thieuChua: (() => {
      const ds = kqChua ? kqChua.thieu.map((t) => t.vi.charAt(0).toUpperCase() + t.vi.slice(1)) : []
      if (luiCoSai) ds.push('Kho chưa đủ câu cùng dạng với câu em sai — phần dưới là bài luyện chung của chuyên đề, không phải câu chữa.')
      return ds.length > 0 ? ds : undefined
    })(),
    linkBaiTap: n.linkBaiTap || undefined,
    deCuaEm: deCuaEmTuRows(rows, banks),
  }
}
