// HỢP ĐỒNG: BÀI HẰNG NGÀY + HỒ SƠ THÁI ĐỘ LÀM BÀI (thầy 12/10, nguyên văn: "tôi cần biết lịch sử học sinh làm bài tập hàng ngày, tính từ
// 12/10. Học sinh thiếu nhiều ngày nhất hiển thị lên đầu, làm thiếu nhiều câu nhất trong từng ngày" · "Khi tôi bấm vào học sinh tôi muốn biết mọi
// thông tin làm bài của học sinh, câu sai, câu đúng, câu đã làm, câu đã ôn tôi muốn biết rõ học sinh đó chăm chỉ hay lười biếng hay đối phó").
// Hai lệnh thầy CHỈ ĐỌC (mã bí mật, chạy trên `envDoc`), máy chủ `server/src/bai-hang-ngay.ts`, app thầy `src/lib/bai-hang-ngay-api.ts`:
//   · `POST /gv/bai-hang-ngay {tu?, den?, khoi?, lop?}`  ⇒ `TraLoiBaiHangNgay`
//   · `POST /gv/ho-so-thai-do {sbd, tu?, den?}`         ⇒ `TraLoiHoSoThaiDo`
// Dùng chung cho máy chủ và app thầy (app CHỈ ĐỌC kiểu). Không đổi schema.
//
// MỨC TỐI THIỂU MỖI NGÀY (`mucToiThieu`) — đúng luật đang chấm "đủ mức":
//   · Kế hoạch Hành trình: mức của ngày là `hanh_trinh_v3_ngay.toi_thieu` CHỐT đầu ngày khi em mở kế hoạch (`lapChotHanhTrinh`) ⇒ `nguonMuc 'da-chot'`,
//     số THẬT. Ngày em không mở kế hoạch thì máy chủ không có dòng ấy.
//   · Gói bài 7 ngày (đang bật từ 10/10): mức = `CAU_TOI_THIEU[tầng]` tính LẠI mỗi lần em mở (`lapGoi7`), KHÔNG lưu theo ngày.
//   ⇒ Ngày không có mức đã lưu: dùng ĐÚNG quy tắc hiện hành `CAU_TOI_THIEU` (tầng 1 → 24 · 2 → 30 · 3 → 36 · 4 → 36 câu) với tầng gần nhất đã ghi
//     của em (`hanh_trinh_v3_ngay.tang` ngày gần nhất, ưu tiên ngày trước) ⇒ `nguonMuc 'tang-gan-nhat'`; chưa ghi tầng nào ⇒ tầng 1 (24 câu, đúng
//     mức máy chủ khởi tạo cho ngày mới) ⇒ `nguonMuc 'mac-dinh'`. Hai trường hợp này `mucUocTinh = true`. Không bịa số khác.
// SỐ CÂU ĐÃ LÀM (`daLam`) — cùng nguồn sự kiện, cùng cách loại "đọc lời giải" với kế hoạch đang chấm em ngày ấy:
//   · Gói 7 (`cheDo 'goi7'`, đúng `lapGoi7`): số mã câu KHÁC NHAU trong sổ `su_kien_hoc` ngày ấy có kết quả, là lượt làm (`SQL_LA_LAN_LAM`: bỏ đọc lời
//     giải / lướt / chẩn đoán / gỡ bước), không còn giấu, ca kiểm tra chỉ tính khi đã công bố và chưa xoá (`SQL_LUOT_GOI7`) + câu học có hướng dẫn
//     (`goi_bai_7_gap`) ngày ấy chưa có trong sổ.
//   · Hành trình (`cheDo 'hanh-trinh'`, đúng `bangHanhTrinh`): số câu của kế hoạch ngày ấy (`srs2_ke_hoach`) đã làm — cùng bộ lọc sự kiện như trên,
//     quy về câu gốc / bản bù bằng `idDaLam`. Ngày không có kế hoạch ⇒ 0.
//   Em vào chế độ Gói 7 từ ngày bắt đầu gói sớm nhất của em khi cờ `goi_bai_7_v1` bật (như `hoc-tap-sanh`), các ngày khác là Hành trình.

/** Ngày bắt đầu theo dõi bài hằng ngày (thầy 12/10: "tính từ 12/10"). */
export const NGAY_BAT_DAU_BAI_HANG_NGAY = '2026-10-12'
/** Số ngày tối đa một lần hỏi (≈ 2 tháng) — giữ lệnh trong sức một Worker với ~300 em. */
export const TOI_DA_SO_NGAY_BAI_HANG_NGAY = 62
/** Quy tắc mức tối thiểu hiện hành theo tầng (bản sao chỉ để app ghi chú — máy chủ dùng `CAU_TOI_THIEU` của `hanh-trinh-ngay.ts`). */
export const MUC_THEO_TANG: Readonly<Record<1 | 2 | 3 | 4, number>> = { 1: 24, 2: 30, 3: 36, 4: 36 }

export type CheDoNgay = 'goi7' | 'hanh-trinh'
/** 'da-chot' = mức thật đã chốt của đúng ngày · 'tang-gan-nhat' = ước tính theo tầng gần nhất đã ghi · 'mac-dinh' = ước tính tầng 1. */
export type NguonMuc = 'da-chot' | 'tang-gan-nhat' | 'mac-dinh'

/** Một ngày của một em. `thieu = max(0, mucToiThieu − daLam)`, `datMuc = daLam ≥ mucToiThieu`. */
export interface NgayBaiEm {
  ngay: string
  mucToiThieu: number
  daLam: number
  thieu: number
  datMuc: boolean
  mucUocTinh: boolean
  nguonMuc: NguonMuc
  /** Tầng dùng để tính mức (1 Nền · 2 Hiểu · 3 Vận dụng · 4 Tổng hợp). */
  tang: 1 | 2 | 3 | 4
  cheDo: CheDoNgay
  /** Ngày hôm nay (giờ Việt Nam) — số tính tới lúc máy chủ trả lời, ngày chưa hết. */
  homNay: boolean
}

export interface EmBaiHangNgay {
  sbd: string
  hoTen: string
  /** Tên lớp hiệu lực ("12 - Tinh Hoa"; chưa gán ⇒ mặc định theo khối). */
  lop: string
  /** '10' | '11' | '12' | '' (không đọc được khối). */
  khoi: string
  /** Từ `tu` đến `den`, cũ → mới, đúng thứ tự `KetQuaBaiHangNgay.ngay`. */
  ngay: NgayBaiEm[]
  /** Số ngày chưa đủ mức (gồm hôm nay khi hôm nay còn thiếu). */
  soNgayThieu: number
  /** Tổng số câu còn thiếu so với mức qua mọi ngày. */
  tongCauThieu: number
  /** Ngày thiếu nhiều câu nhất (hoà ⇒ ngày gần đây hơn); không thiếu ngày nào ⇒ null. */
  ngayThieuNhieuNhat: { ngay: string; thieu: number } | null
  soNgayDu: number
  /** Số ngày không làm câu nào (`daLam = 0`). */
  soNgayKhongLam: number
  tongDaLam: number
}

export interface LopBaiHangNgay {
  tenLop: string
  khoi: string
  soEm: number
}

/** Em xếp: `soNgayThieu` giảm dần → `tongCauThieu` giảm dần → họ tên (tiếng Việt) → SBD. */
export interface KetQuaBaiHangNgay {
  ok: true
  tu: string
  den: string
  /** Ngày hôm nay giờ Việt Nam lúc trả lời. */
  homNay: string
  /** Danh sách ngày `tu` … `den`. */
  ngay: string[]
  em: EmBaiHangNgay[]
  /** Mọi lớp có em trong danh sách (trước khi lọc khối/lớp) — app dựng ô lọc. */
  lop: LopBaiHangNgay[]
  /** Số ô (em × ngày) đang dùng mức ước tính / tổng số ô. */
  soOUocTinh: number
  soO: number
  /** Phần đọc phụ hỏng (vd chưa đọc được Gói 7) — câu tiếng Việt nói thật; các số khác vẫn đúng. */
  canhBao: string[]
}
export type TraLoiBaiHangNgay = KetQuaBaiHangNgay | { ok: false; error: string }

// ------------------------------------------------------------------ HỒ SƠ THÁI ĐỘ LÀM BÀI CỦA MỘT EM

/** NGƯỠNG — một chỗ, app in nguyên văn trong phần "Cách tính". Mọi tỉ lệ là phần trăm (0–100). */
export const NGUONG_THAI_DO = {
  /** Lượt "quá nhanh": dưới 8 giây với câu trắc nghiệm (Phần I, Đúng–sai), dưới 15 giây với câu tự tính (Phần III — trả lời ngắn). */
  giayNhanhTracNghiem: 8,
  giayNhanhTuTinh: 15,
  /** (a) ngày đủ mức: tốt từ 80% · chú ý 50–79% · xấu dưới 50%; cần ≥ 3 ngày đã tính. */
  ngayDuTot: 80,
  ngayDuChuY: 50,
  soNgayToiThieu: 3,
  /** (b) quá nhanh: xấu khi ≥ 30% lượt quá nhanh VÀ nhóm ấy đúng dưới 50% · chú ý khi ≥ 15%; cần ≥ 20 lượt có số giây. */
  nhanXau: 30,
  nhanChuY: 15,
  nhanDungThap: 50,
  soLuotGiayToiThieu: 20,
  /** (c) dồn bài: lượt làm 23:00–04:59 (giờ VN, 60 phút cuối ngày và sau đó) — xấu ≥ 50% · chú ý ≥ 25%; cần ≥ 20 lượt. */
  gioKhuyaTu: 23,
  gioKhuyaDen: 5,
  donXau: 50,
  donChuY: 25,
  soLuotDonToiThieu: 20,
  /** (d) gợi ý / xem lời giải: câu có dùng gợi ý hoặc đọc lời giải ÷ câu đã làm — xấu ≥ 50% · chú ý ≥ 25%; cần ≥ 10 câu. */
  goiYXau: 50,
  goiYChuY: 25,
  soCauGoiYToiThieu: 10,
  /** (e) chọn lặp: chuỗi ≥ 6 lượt trắc nghiệm liên tiếp (cùng ngày) chọn CÙNG một chữ — xấu khi lượt trong chuỗi ≥ 10% · chú ý ≥ 5%; cần ≥ 15 lượt
   *  trắc nghiệm có chữ chọn. (Đáp án đúng rải đều A–D: chuỗi 6 cùng chữ do tình cờ rất hiếm — xác suất mỗi vị trí (1/4)^5 ≈ 0,1%.) */
  chuoiLap: 6,
  lapXau: 10,
  lapChuY: 5,
  soLuotLapToiThieu: 15,
  /** (f) độ đúng 7 ngày gần nhất so với trước đó (trong khoảng xem): giảm ≥ 15 điểm % ⇒ xấu · giảm ≥ 5 ⇒ chú ý; mỗi bên cần ≥ 20 lượt có kết quả. */
  soNgayGan: 7,
  giamXau: 15,
  giamChuY: 5,
  soLuotXuHuongToiThieu: 20,
} as const

export type MaTinHieu = 'ngay-du-muc' | 'qua-nhanh' | 'don-bai' | 'goi-y' | 'chon-lap' | 'xu-huong'
/** 'tot' trong ngưỡng · 'chu-y' cần để mắt · 'xau' vượt ngưỡng · 'chua-du' chưa đủ dữ liệu để đo. */
export type MucTinHieu = 'tot' | 'chu-y' | 'xau' | 'chua-du'

export interface TinHieuThaiDo {
  ma: MaTinHieu
  /** Tên tín hiệu ("Ngày đủ mức"). */
  ten: string
  muc: MucTinHieu
  /** Số chính (phần trăm, làm tròn); chưa đo được ⇒ null. Với 'xu-huong': chênh điểm % (âm = giảm). */
  giaTri: number | null
  /** Tử / mẫu của số chính (vd 6/7 ngày). */
  tu: number
  mau: number
  /** Câu số liệu đầy đủ ("Đủ mức 6/7 ngày (86%)"). */
  chu: string
  /** Ngưỡng bằng chữ ("Tốt từ 80% · chú ý 50–79% · dưới 50% là chưa đều"). */
  nguong: string
}

export type NhanThaiDo = 'cham-chi' | 'chua-deu' | 'doi-pho' | 'chua-du-du-lieu'
export const TEN_NHAN_THAI_DO: Readonly<Record<NhanThaiDo, string>> = {
  'cham-chi': 'Chăm chỉ',
  'chua-deu': 'Chưa đều',
  'doi-pho': 'Có dấu hiệu đối phó',
  'chua-du-du-lieu': 'Chưa đủ dữ liệu',
}
/** LUẬT KẾT LUẬN (minh bạch, theo thứ tự):
 *  1. "Có dấu hiệu đối phó" khi (b) quá nhanh ở mức xấu, HOẶC (e) chọn lặp ở mức xấu, HOẶC (d) gợi ý ở mức xấu VÀ (f) độ đúng đang giảm (chú ý/xấu).
 *  2. "Chưa đủ dữ liệu" khi (a) chưa đủ 3 ngày đã tính.
 *  3. "Chưa đều" khi (a) dưới 80% ngày đủ mức, HOẶC (c) dồn bài ở mức xấu.
 *  4. Còn lại: "Chăm chỉ" (≥ 80% ngày đủ mức, không dồn bài, không dấu hiệu đối phó). */
export const LUAT_KET_LUAN: readonly string[] = [
  'Có dấu hiệu đối phó: quá nhanh mà đúng thấp, hoặc chọn lặp một phương án, hoặc dựa nhiều vào gợi ý/lời giải trong khi độ đúng đang giảm.',
  'Chưa đủ dữ liệu: chưa đủ 3 ngày để tính tỉ lệ ngày đủ mức.',
  'Chưa đều: dưới 80% số ngày đủ mức, hoặc từ 50% lượt làm dồn vào 23:00–04:59.',
  'Chăm chỉ: từ 80% số ngày đủ mức, không dồn bài, không dấu hiệu đối phó.',
]

export interface KetLuanThaiDo {
  nhan: NhanThaiDo
  /** Chữ nhãn (`TEN_NHAN_THAI_DO`). */
  chu: string
  /** Lý do bằng số, câu ngắn, theo thứ tự quan trọng. */
  lyDo: string[]
}

/** Một ngày trên lịch hoạt động: số kế hoạch (mức/đã làm) + mọi lượt làm câu trong sổ ngày ấy. */
export interface NgayHoatDong extends NgayBaiEm {
  /** Số lượt làm câu (mọi nơi) ngày ấy. */
  soLuot: number
  soDung: number
  soSai: number
  /** % đúng trên lượt có kết quả đúng/sai; không có ⇒ null. */
  tiLeDung: number | null
}

/** Một nhóm số giây trên biểu đồ phân bố. `soNhanh` = số lượt trong nhóm bị tính "quá nhanh" (theo ngưỡng của loại câu). */
export interface NhomGiay {
  /** "Dưới 8 giây" · "8–14 giây" · … */
  nhan: string
  tu: number
  /** Không chặn trên ⇒ null. */
  den: number | null
  soLuot: number
  soDung: number
  soNhanh: number
}

/** Một câu (quy về câu gốc) trong danh sách Câu đúng / Câu đã ôn. */
export interface CauTomTat {
  qid: string
  tieuDe: string
  mucDo: string
  soLan: number
  soDung: number
  soSai: number
  /** Lần đầu đã đúng. */
  dungLanDau: boolean
  /** Lần gần nhất đúng. */
  lanCuoiDung: boolean
  /** ISO lần gần nhất. */
  lanCuoi: string
  /** Số lượt ôn (Ôn lại / Khắc phục, hoặc làm lại sau khi từng sai). */
  soLanOn: number
}

export interface DemThaiDo {
  /** Lượt làm câu trong khoảng (mọi nơi). */
  soLuot: number
  /** Số câu khác nhau (câu gốc). */
  soCau: number
  soDung: number
  soSai: number
  soBoTrong: number
  /** Số câu (gốc) có ít nhất một lượt ôn trong khoảng. */
  soCauOn: number
  soLuotOn: number
  /** Giây trung bình / trung vị (lượt có số giây — đo thật hoặc ước tính); không có ⇒ null. */
  giayTb: number | null
  giayTrungVi: number | null
  soLuotCoGiay: number
}

export interface KetQuaHoSoThaiDo {
  ok: true
  em: { sbd: string; hoTen: string; lop: string; khoi: string }
  tu: string
  den: string
  homNay: string
  ketLuan: KetLuanThaiDo
  tinHieu: TinHieuThaiDo[]
  dem: DemThaiDo
  /** Lịch hoạt động theo ngày `tu` … `den`. */
  ngay: NgayHoatDong[]
  phanBoGiay: NhomGiay[]
  /** Câu từng làm đúng (toàn bộ sổ đã đọc): lần gần nhất mới trước; tối đa 500. */
  cauDung: CauTomTat[]
  /** Câu đã ôn (toàn bộ sổ đã đọc): chưa đúng lại trước, rồi gần đây trước; tối đa 500. */
  cauDaOn: CauTomTat[]
  /** Sổ vượt 5000 lượt ⇒ danh sách câu chỉ tính 5000 lượt gần nhất. */
  catBot: boolean
  canhBao: string[]
}
export type TraLoiHoSoThaiDo = KetQuaHoSoThaiDo | { ok: false; error: string }
