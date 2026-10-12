// HỢP ĐỒNG: TỔNG QUAN VỀ CON CHO PHỤ HUYNH (thầy 12/10: "cho phụ huynh biết nhiều thông tin cần thiết nữa về con, số câu làm đúng, làm sai,
// thời gian làm từng câu gợi ý nhắc … để phụ huynh theo dõi được con toàn diện").
// `POST /ph/con-tong-quan {pass|sbd}` — LỆNH PHỤ HUYNH, CHỈ ĐỌC (máy chủ `server/src/ph-con-tong-quan.ts`, app `src/lib/ph-v3/con-tong-quan.ts`).
// Xác thực đúng như mọi lệnh `/ph/*` của app phụ huynh mới (`sbdCuaPhuHuynh` + `CHI_NHAN_TOKEN`): có `pass` ⇒ danh tính lấy từ liên kết riêng, `sbd` trong
// thân bị bỏ qua (liên kết của con A không đọc được con B). Dùng chung cho máy chủ và app (app chỉ import KIỂU).
//
// LUẬT DỮ LIỆU (không bịa số):
//   · Chỉ sổ `su_kien_hoc` của đúng con đó, từ `tuNgay` (= sớm hơn trong hai mốc: 12/10/2026 và 13 ngày trước hôm nay) tới hôm nay, tối đa 5000 lượt mới nhất.
//   · BỎ: sự kiện còn giấu (`visibility = 'embargoed'`), sự kiện "đọc lời giải" và mọi dòng không phải lần làm (`SQL_LA_LAN_LAM`), lượt ca kiểm tra
//     CHƯA công bố (`SQL_DA_CONG_BO`) — không trả nội dung nào của ca chưa công bố. KHÔNG trả đáp án đúng, đáp án con chọn, mã câu, đề bài.
//   · Số giây: cột `giay` ⇒ `raw_json.ms` ⇒ `chi_tiet_cau.giay` (ca đã công bố) ⇒ ước tính của lượt game (`nguonGiay: 'uoc'`) ⇒ null (= "chưa đo giờ").
//   · Mức tối thiểu từng ngày: mức ĐÃ LƯU của kế hoạch ngày đang chấm (`hanh_trinh_v3_ngay.toi_thieu`, như thẻ Nhịp học của thầy); ngày không có mức
//     đã lưu ⇒ quy tắc hiện hành (sàn theo tầng `CAU_TOI_THIEU` 24/30/36/36, tầng gần nhất đã lưu, chưa có ⇒ tầng 1) và gắn `mucUocTinh: true`.
import type { NguonGiay } from './lich-su-lam-cau-kieu'

export type { NguonGiay }

/** Mốc bắt đầu theo dõi bài hằng ngày thầy chốt (12/10/2026). */
export const MOC_THEO_DOI = '2026-10-12'
/** Lượt làm dưới số giây này (đo thật hoặc ước tính) là "làm quá nhanh". */
export const GIAY_NHANH = 8
/** Số lượt gần nhất trả về cho danh sách "câu gần đây". */
export const SO_LUOT_GAN_DAY = 30
/** Số câu sai gần đây tối đa trả về. */
export const SO_CAU_SAI_TOI_DA = 12
/** Số gợi ý nhắc tối đa. */
export const SO_GOI_Y_TOI_DA = 5

/** Đếm một khoảng thời gian. Một lượt = một lần con trả lời một câu (câu làm lại tính thêm một lượt). */
export interface DemCau {
  /** Lượt có kết quả + lượt bỏ trống (ca kiểm tra). */
  soLuot: number
  dung: number
  sai: number
  boTrong: number
  /** Số câu khác nhau (theo câu gốc). */
  soCau: number
  /** Trung bình giây mỗi lượt đo được (gồm ước tính); không lượt nào đo được ⇒ null. */
  giayTb: number | null
}

export type TrangThaiNgay = 'du' | 'thieu' | 'khong'

/** Một ngày học (giờ Việt Nam). */
export interface NgayHoc {
  /** `YYYY-MM-DD`. */
  ngay: string
  dung: number
  sai: number
  boTrong: number
  /** Số câu khác nhau con làm trong ngày (mọi nguồn). */
  soCau: number
  /** Mức tối thiểu của ngày (câu). */
  muc: number
  /** true ⇒ ngày ấy không có mức đã lưu, `muc` tính theo quy tắc hiện hành. */
  mucUocTinh: boolean
  /** Số câu kế hoạch đã chốt của ngày (kể cả phần con tự lấy thêm); không có kế hoạch đã chốt ⇒ null. */
  daXep: number | null
  /** Số câu cần làm để đủ mức: `muc`, hoặc ít hơn khi kế hoạch đã chốt xếp ít câu hơn mức (thiếu câu phù hợp). */
  canLam: number
  /** Số câu tính vào mức: câu của kế hoạch đã chốt con đã làm trong ngày; không có kế hoạch ⇒ `soCau`. */
  daLam: number
  /** du: daLam ≥ canLam · thieu: có làm nhưng chưa đủ · khong: không làm câu nào. Hôm nay chưa hết ngày ⇒ xem `homNay`. */
  trangThai: TrangThaiNgay
  homNay: boolean
}

/** Một khoảng của phân bố số giây (lượt đo được trong 7 ngày gần nhất). `den` = null ⇒ không chặn trên. */
export interface KhoangGiay {
  tu: number
  den: number | null
  so: number
  sai: number
}

export interface ThoiGianLam {
  /** Trung bình giây mỗi lượt đo được (7 ngày); null ⇒ chưa đo được lượt nào. */
  giayTb: number | null
  /** Trung vị giây (7 ngày). */
  giayGiua: number | null
  soDo: number
  soUoc: number
  /** Lượt không đo được giờ (7 ngày). */
  soChuaDo: number
  phanBo: KhoangGiay[]
  /** Lượt dưới `GIAY_NHANH` giây (7 ngày) và số lượt sai trong đó. */
  nhanh: { so: number; sai: number }
}

/** Một lượt gần đây (mới trước). KHÔNG mã câu, KHÔNG đáp án. */
export interface LuotGanDay {
  /** ISO giờ máy chủ. */
  luc: string
  /** "Câu 25 · Hiệu suất ester hoá"; không tra được tên dạng ⇒ "Câu 25" hoặc chuỗi rỗng. */
  tieuDe: string
  /** Nơi làm bằng chữ đời thường: "Ca kiểm tra" · "Bài luyện trên app" · "Ôn lại" · "Tu luyện"… (không tên trò chơi). */
  noi: string
  dung: boolean | null
  giay: number | null
  nguonGiay: NguonGiay
  /** Con đã dùng gợi ý ở lượt này. */
  coGoiY: boolean
}

/** Một câu con từng sai trong khoảng đọc (gom theo câu gốc: làm đúng ở bản khác của cùng câu cũng là đã sửa). */
export interface CauSaiCon {
  tieuDe: string
  soSai: number
  /** ISO lần làm gần nhất. */
  lanCuoi: string
  /** Lần gần nhất đúng ⇒ con đã sửa được. */
  daSua: boolean
}

export type MaGoiY = 'con-cau-hom-nay' | 'chua-lam-hom-nay' | 'nhanh-sai' | 'sai-chua-sua' | 'thieu-ngay' | 'lam-khuya' | 'ti-le-giam' | 'dung-goi-y'
export interface GoiYNhac {
  ma: MaGoiY
  chu: string
}

export interface KetQuaConTongQuan {
  ok: true
  serverNow: number
  /** Hôm nay theo giờ Việt Nam. */
  homNay: string
  moc: string
  /** Ngày đầu của khoảng đọc. */
  tuNgay: string
  dem: { homNay: DemCau; bayNgay: DemCau; tuMoc: DemCau }
  /** Cũ → mới, đủ từng ngày từ `tuNgay` tới hôm nay. */
  ngay: NgayHoc[]
  thoiGian: ThoiGianLam
  ganDay: LuotGanDay[]
  cauSai: { tong: number; daSua: number; chuaSua: number; ds: CauSaiCon[] }
  /** 7 ngày gần nhất: số ngày và số lượt con làm trong khung 23:00–04:59. */
  khuya: { soNgay: number; soLuot: number }
  /** 7 ngày gần nhất: số lượt có dùng gợi ý. */
  goiYDaDung: { so: number; tong: number }
  /** 3–5 câu nhắc sinh theo luật (`sinhGoiYNhac`); không đủ dữ liệu ⇒ ít hơn, không độn. */
  goiY: GoiYNhac[]
  /** Sổ của con vượt 5000 lượt trong khoảng đọc ⇒ chỉ tính 5000 lượt mới nhất. */
  catBot: boolean
}

export type TraLoiConTongQuan = KetQuaConTongQuan | { ok: false; error: string }
