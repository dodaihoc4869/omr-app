// KIỂU của thư viện live MÁY THẦY (tách khỏi thay.ts 11/11 tối — tệp ấy sát trần cổng cỡ tệp). thay.ts xuất lại đúng các tên này.
import type { NetBut } from '../but-bang-loi'
import type { KenhPhong, MoiTruongLive, TuyChonOpus } from './sfu'
import type { KieuChuoi, MucLocOn } from './chuoi-tieng'

export interface TuyChonLiveThay {
  /** Vé phòng vai thầy (`/gv/bpu/mo` trả về). */
  ve: string
  /** Gốc máy chủ, vd. `https://omr.ttadodaihoc.workers.dev`. */
  goc: string
  kenh: KenhPhong
  /** Ảnh trạng thái của trang đang viết: `{ trang: __mcBut.trang(), ...__mcBut.xuat() }` — dùng khi bật live sau khi đã viết, và khi phòng xin (sổ quá dài). */
  layAnh?: () => AnhBang | null
  khiTrangThai?: (tt: TrangThaiLiveThay) => void
  opus?: TuyChonOpus
  /** Chế độ «Lọc tiếng ồn + khử vọng» thầy đã chọn lần trước (mặc định `tu` = tự động theo đường vọng). */
  loc?: CheDoLoc
  /** false ⇒ KHÔNG dùng chuỗi làm rõ tiếng (gửi thẳng track mic) — công tắc lùi khẩn + để đo «trước / sau». Mặc định bật. */
  chuoi?: boolean
  /** Kiểu nâng mức của chuỗi: 'khung' (mặc định — từng khung 10 ms trong Worker, không đệm) · 'nhanh' (worklet Web Audio) · 'nen' (hai bộ nén Web Audio). */
  chuoiKieu?: KieuChuoi
  /** Lọc ồn RIÊNG trong chuỗi (bỏ trống = 'vua'). */
  locOn?: MucLocOn
  /** Tự chỉnh âm lượng của TRÌNH DUYỆT ở bậc mở đầu (bỏ trống = bật). */
  agc?: boolean
  /** Tên mic thầy đã chọn (nhớ ở máy) — mã thiết bị đổi (cắm cổng USB khác) thì tìm lại mic ấy theo tên (thang-mic.ts). */
  micTen?: string
  /** Đã tìm lại mic đã chọn dưới MÃ MỚI ⇒ lớp giao diện nhớ mã mới. */
  khiMicMoi?: (id: string) => void
  /** Danh sách mic của máy vừa đổi (cắm / rút) ⇒ lớp giao diện đọc lại `dsMic()`. */
  khiThietBi?: () => void
  moiTruong?: Partial<MoiTruongLive>
}
/** Tình trạng mic: chua = chưa mở · tot · bi-tat = thiết bị / hệ điều hành đang tắt tiếng mic (`track.muted`) · im = mic mở được nhưng ra toàn số 0 dù đã thử
 *  nới ràng buộc · mat = mic vừa bị rút / luồng kết thúc. */
export type TinhMic = 'chua' | 'tot' | 'bi-tat' | 'im' | 'mat'
/** «Lọc tiếng ồn + khử vọng»: tu = tự động (chỉ bật khi có đường vọng) · bat = luôn bật · tat = luôn tắt. */
export type CheDoLoc = 'tu' | 'bat' | 'tat'
/** Một dòng chẩn đoán mic để thầy chụp gửi khi còn lỗi. */
export interface ChanDoanMic {
  ten: string
  /** live · muted (thiết bị tắt tiếng) · ended (đã rút) · tat (thầy tắt tiếng / tạm dừng) · khong (chưa mở). */
  track: 'live' | 'muted' | 'ended' | 'tat' | 'khong'
  /** Mức âm tại mic 0..1 (AudioContext; null = bộ đo đang treo). */
  muc: number | null
  /** Mức âm ĐANG GỬI cho lớp 0..1 (số đo của bộ gửi; null = chưa gửi). */
  mucGui: number | null
  kbps: number | null
  /** Bộ gửi đang cầm đúng track mic (không phải track câm giữ chỗ). */
  gan: boolean
  sfu: boolean
  loc: boolean
  /** Bậc ràng buộc đang dùng (0 = theo luật lọc … 3 = mic thô, thiết bị chỉ là «ưu tiên»). */
  bac: number
  ctx: string
  /** Cấu hình trình duyệt ĐANG chạy cho mic (`getSettings()`): tần số lấy mẫu, số kênh, khử vọng, lọc ồn, tự chỉnh âm lượng. */
  hz: number | null
  kenh: number | null
  vong: boolean | null
  on: boolean | null
  agc: boolean | null
  /** Thầy để «Mặc định của máy» nhưng mục ấy câm ⇒ đang mở THẲNG thiết bị thật đứng sau nó. */
  the: boolean
  /** Kiểu nâng mức đang chạy ('nhanh' / 'nen' / 'cho' / 'khong'), tần số lấy mẫu của bộ xử lý, bộ đệm thu trình duyệt báo (ms). */
  kieu: string
  /** Mức lọc ồn riêng thầy chọn + tình trạng thật ('chay' / 'tai' / 'tat' / 'loi' / 'khong' = máy này không chạy được bộ lọc riêng). */
  locOn: MucLocOn
  locOnChay: string
  hzXuLy: number | null
  treThu: number | null
  /** Chuỗi làm rõ tiếng (cộng kênh, lọc 80 Hz, nén nâng mức, chặn đỉnh) đang chạy; false = đang gửi thẳng track mic. */
  chuoi: boolean
  /** Lưới an toàn phía gửi đã bỏ chuỗi vì ra CÂM (lý do, '' = chưa). */
  luoi?: string
}
/** Một trang của bộ máy bút: khoá trang, tỉ lệ ngang / dọc vùng viết, mọi nét đang có. */
export interface AnhBang { trang: string; tiLe: number; net: NetBut[] }
export interface TrangThaiLiveThay {
  /** chua = chưa nối · dang-noi · san = đã sẵn sàng (bấm Live là live ngay) · dang-bat · live */
  pha: 'chua' | 'dang-noi' | 'san' | 'dang-bat' | 'live'
  /** chua-cau-hinh = Worker chưa có khoá SFU · chua = chưa nối · cam = đang phát track câm · mic = đang phát mic · khong = live không tiếng · loi = nối SFU hỏng */
  tieng: 'chua-cau-hinh' | 'chua' | 'cam' | 'mic' | 'khong' | 'loi'
  /** Điểm đang viết đi đường nào: dc = DataChannel qua SFU · ws = WebSocket của phòng. */
  kenhNet: 'dc' | 'ws'
  /** Mic đang tắt tiếng tạm (thầy bấm tắt tiếng). */
  micTat: boolean
  /** Đang live mà mic im quá 20 giây. */
  micIm: boolean
  /** Số em đang xem + số em trong đó nhận điểm qua WebSocket (phòng báo). */
  xem: number
  xemWs: number
  /** Số em ĐANG NGHE: máy em báo loa đang phát tiếng thầy thật (không tắt tiếng, không bị trình duyệt chặn phát). */
  xemNghe: number
  /** Giờ bật live theo phòng (ms) — cho đồng hồ trên viên Live. */
  tu: number | null
  /** Máy thầy khác đang live buổi này ⇒ máy này chỉ điều khiển. */
  mayKhacLive: boolean
  /** Máy em đang HIỆN BẢNG LIVE (tự bật khi thầy gọi em lên bảng, tự tắt khi mở lượt mới; `dat({ bang })` để bật / tắt tay). false mà đang live ⇒ lớp chỉ nghe tiếng. */
  bang: boolean
  /** Em đang phát mic trên bảng (một em mỗi lúc); `xa` = em ở xa. null = không ai. */
  emNoi: { sbd: string; ten: string; doi: number; xa: boolean } | null
  /** Máy thầy có phát tiếng của em ra loa không. Mặc định: CHỈ khi em ở xa (em đứng trong lớp mà loa lớp phát lại giọng em thì hú); `datNgheEm` để đổi. */
  ngheEm: boolean
  /** Thầy đang TẠM DỪNG live (11/11): mic tắt tiếng, nét không gửi; phiên giữ nguyên. */
  nghi: boolean
  /** Tình trạng mic + tên mic đang dùng + khử vọng / lọc ồn có đang ÁP không (11/11). */
  micTinh: TinhMic
  micTen: string
  /** Tên mic thầy đã chọn mà KHÔNG mở được (không có trên máy) ⇒ đang dùng mic mặc định `micTen`; '' / vắng = đang dùng đúng mic đã chọn. */
  micKhac?: string
  /** Tiếng em nói tới máy thầy mà thẻ phát bị trình duyệt chặn / đứng (lưới an toàn nghe-chac.ts) ⇒ cần một lần bấm vào cửa sổ app. */
  amEmKet?: boolean
  loc: boolean
  loi?: string
}
export type KetQuaBat = { ok: true } | { ok: false; lyDo: 'mic-tu-choi' | 'khong-mic' | 'mic-loi' | 'mic-ban' | 'dang-live' | 'chua-san' }
