// HỢP ĐỒNG DỮ LIỆU «LỜI GIẢI KÍNH» (thầy chốt bản vẽ 02/11: docs/ban-ve-loi-giai-0211/, «chốt, làm vào app và giải lại toàn bộ kho»,
// «100% phải hiển thị lời giải mới», «Không cần trích dẫn video», «bấm vào số nào thì hiện ra ý nghĩa»).
// MỘT bản mỗi câu (`BanKinh`), máy soạn viết DỮ LIỆU, app vẽ bằng một khung cố định + thư viện cảnh mẫu (không SVG trong dữ liệu).
// Phần III / câu tính toán dùng lại hợp đồng sơ đồ + thừa số có nghĩa của src/lib/goi-y-cham/kieu.ts (`SoDo`, `BuocTinh`, `ThuaSo.nghia`).
// Nguồn nội dung bắt buộc: skill lý thuyết của thầy (mục kiến thức + bộ thần chú), skill giải bài (sơ đồ + một phép tính), skill ôn tập.
import type { BuocTinh, SoDo } from '../goi-y-cham/kieu'

/** Đổi khuôn / lời dặn đáng kể ⇒ tăng để máy soạn lại các câu soạn bằng bản cũ. */
export const PHIEN_BAN_KINH = 1

export type PhanKinh = 'I' | 'II' | 'III'

/** Một nhịp phim «thầy dẫn từng bước»: một ý một nhịp, đúng thứ tự các bước của mục kiến thức. */
export interface NhipPhim {
  /** câu chính (in đậm được bằng **…**), ≤ 160 ký tự */
  chu: string
  /** dòng phụ nhỏ, tuỳ chọn */
  phu?: string
  /** biểu tượng minh hoạ của nhịp (thư viện app) */
  hinh?: HinhNhip
}
export const HINH_NHIP = ['binh', 'ong-nghiem', 'dun', 'chiet', 'loc', 'can', 'khi', 'ket-tua', 'mau', 'nhiet', 'ap-suat', 'xuc-tac', 'nguyen-tu', 'phan-tu', 'lien-ket', 'dien', 'pin', 'do-thi', 'mui-ten', 'kinh-lup', 'so-sanh', 'cong-thuc'] as const
export type HinhNhip = (typeof HINH_NHIP)[number]

/** CẢNH MẪU có tham số — chỉ dùng khi đúng chuyện của câu; không hợp thì bỏ (app không ép hình). */
export type CanhKinh =
  | {
      /** cân bằng: bấm tác động, bi trượt về chiều chuyển dịch */
      loai: 'can-bang'
      trai: string // «N_2 + 3H_2»
      phai: string // «2NH_3»
      nhanTrai?: string // «4 mol khí»
      nhanPhai?: string
      tacDong: { nut: string; chieu: 'thuan' | 'nghich' | 'khong'; chu: string }[] // 1–4
    }
  | {
      /** ống nghiệm: các bước thí nghiệm, mỗi bước một trạng thái chất lỏng (1–2 lớp) */
      loai: 'ong-nghiem'
      buoc: { chu: string; lop: { mau: MauLop; nhan: string }[]; dun?: boolean; khi?: boolean; ketTua?: boolean }[] // 2–5
    }
  | {
      /** so sánh hai vế (hai chất / hai trường hợp) */
      loai: 'so-sanh'
      trai: { ten: string; y: string[] }
      phai: { ten: string; y: string[] }
    }
  | {
      /** GỌI TÊN theo đúng ba bước của thầy (03/11): mạch chính đã đánh số (C1 = đầu ưu tiên chức → π → nhánh) + các mảnh tên theo công thức
       *  nhánh + mạch chính + liên kết + chức (ester: gốc R′ + gốc RCOO). Vắng `soC` ⇒ chỉ lắp mảnh. */
      loai: 'danh-phap'
      soC?: number
      chuc?: { viTri: number; ten: string }
      nhanh: { viTri: number; ten: string }[]
      pi: { viTri: number; loai: 'doi' | 'ba' }[]
      manh: { loai: ManhTen; chu: string; giai: string }[]
      ten: string
    }
  | {
      /** ĐIỆN DI (thầy 03/11, skill 10.C3): ở pH đã cho, mỗi chất mang các nhóm tích điện (NH₃⁺ +1, COO⁻ −1, nhóm trung hoà 0) ⇒ cộng ⇒ chạy về cực. */
      loai: 'dien-di'
      pH: number
      chat: { ten: string; pI?: number; nhom: { ten: string; dien: number }[] }[]
    }
  | {
      /** ĐỘ TAN (thầy 03/11): hàng chuẩn 100 g nước theo S(t), các hàng thật (gam chất tan / gam nước) — kết tinh: trước = tách ra + còn lại. */
      loai: 'do-tan'
      chat: string
      S: { t: number; S: number }[]
      hang: { nhan: string; ct: number; nuoc: number; baoHoa?: number; tachRa?: boolean }[]
    }
/** ĐỒNG PHÂN (thầy 08/11 «từ giờ phần đồng phân phải qua skill này», docs/skill-dong-phan-thay/SKILL.md). Trường RIÊNG `dongPhan` (không nằm trong
 *  `canh`: app cũ gặp `canh.loai` lạ sẽ vẽ nhầm cảnh so sánh) — app cũ bỏ qua trường lạ. Mọi con số máy chủ TÍNH LẠI (src/lib/loi-giai-kinh/dong-phan.ts). */
export type DatDP = 'nhom' | 'oh' | 'doi' | 'ba' | 'xeton' | 'chen'
/** khung carbon của một mạch đại số: mạch chính `chinh` C + nhánh thẳng `dai` C gắn ở C số `o` */
export interface KhungDP { chinh: number; nhanh: { o: number; dai: number }[] }
export interface MachDP {
  /** phép tính mạch đại số: «4», «3+1», «5+1+1» (số đầu = mạch chính) */
  so: string
  khung: KhungDP
  /** 1–2 thứ cắm lên khung: nhom (răng giả cần một H: Cl, CHO, COOH, NH2…) · oh (OH: chỉ C no, mỗi C một OH) · doi / ba (nối đôi / ba) ·
   *  xeton (nhóm CO giữa mạch) · chen (O / NH chen vào liên kết C–C: ete, amine bậc 2) */
  dat: { loai: DatDP; nhan: string }[]
  /** chỉ các tổ hợp (số thứ tự liệt kê) thoả điều kiện đề; vắng = mọi tổ hợp */
  chon?: number[]
  /** điều kiện đề khi có `chon` (vd «ancol bậc I») */
  loc?: string
  soChat: number
}
export interface BangDP {
  /** este: R (được là H) – R′ · amin: các gốc quanh N · aren: các nhánh trên vòng (2 nhánh × 3 vị trí o, m, p) · khac: đếm chay (peptide, chất béo) */
  loai: 'este' | 'amin' | 'aren' | 'khac'
  tieuDe: string
  cot: string[]
  hang: { phan: number[]; soCach: number[]; tich: number; ghi?: string }[]
}
export interface DongPhanKinh {
  /** «C_4H_8O» */
  ctpt: string
  nguyenTu: { C: number; H: number; N?: number; X?: number; O?: number }
  K: number
  /** tách K gốc / K chức, một câu */
  tachK?: string
  /** đề hỏi: cau-tao (chỉ công thức cấu tạo) · dong-phan (tính cả hình học) */
  hoi: 'cau-tao' | 'dong-phan'
  mach?: MachDP[]
  bang?: BangDP
  tong: number
}
export const MANH_TEN =['nhanh', 'mach', 'lien-ket', 'chuc', 'goc-ancol', 'goc-acid'] as const
export type ManhTen = (typeof MANH_TEN)[number]
export const MAU_LOP = ['trong', 'xanh', 'cam', 'vang', 'hong', 'tim', 'nau', 'trang-duc'] as const
export type MauLop = (typeof MAU_LOP)[number]

export interface LyDoKinh {
  /** «A»–«D» (Phần I) hoặc «a»–«d» (Phần II) — CHỮ GỐC của kho */
  khoa: string
  dung: boolean
  chu: string
}
/** Một phép tính có tên: biểu thức chỉ số, + - * / ngoặc, dấu chấm thập phân; `ketQua` dấu phẩy; mục cuối của Phần III `laDapSo`. */
export interface PhepTinhKinh { ten: string; bieuThuc: string; ketQua: string; laDapSo?: boolean; nghia?: string }
export interface HayNham { nghi: string; dung: string }
export interface TheNho { truoc: string; sau: string; viSao?: string }

export interface BanKinh {
  qid: string
  phienBan: number
  phan: PhanKinh
  /** câu tự luận (thầy 03/11): không có phương án / ý; chiếu lên bảng lúc dạy học */
  tuLuan?: true
  /** KIẾN THỨC CỐT LÕI: câu chốt + (tuỳ chọn) công thức lớn + 1–3 chip ý chốt */
  cotLoi: { chu: string; congThuc?: string; chip: { nhan: string; chu: string }[] }
  /** phim thầy dẫn: 3–6 nhịp */
  phim: NhipPhim[]
  canh?: CanhKinh
  /** câu viết / đếm đồng phân: K → mạch đại số → hình học → cộng (thầy 08/11) */
  dongPhan?: DongPhanKinh
  /** thần chú: CHỈ chữ có trong bảng thần chú của thầy (máy chủ đối chiếu) */
  thanChu: string[]
  /** một câu thầy nói NGUYÊN VĂN, có trong mục kiến thức đã gửi máy soạn (máy chủ đối chiếu), không kèm video */
  thayNoi?: string
  /** mẹo của thầy (chép từ mục kiến thức) */
  meo?: string
  lyDo: LyDoKinh[]
  /** Phần III / câu tính: sơ đồ cột dọc + MỘT phép tính (thừa số có nghĩa, em chạm số nào hiện nghĩa số đó) */
  soDo?: SoDo
  buoc?: BuocTinh[]
  /** bài không xích được thành một phép nhân (hệ phương trình, hỗn hợp): các phép tính có tên, máy chủ TÍNH LẠI từng biểu thức */
  phepTinh?: PhepTinhKinh[]
  /** kết quả cuối (chỉ sau nộp) */
  ketQua?: string
  /** kiểm bằng cách khác, một câu */
  kiemLai?: string
  hayNham: HayNham[]
  tuHoi: { hoi: string; tra: string }
  theNho: TheNho[]
}

/** Trạng thái cổng lưu cùng bản ở máy chủ. Chỉ `dat` được hiện. */
export type CongKinh = 'dat' | 'lech' | 'thieu' | 'khong_kiem_duoc' | 'lo_dap_an'
