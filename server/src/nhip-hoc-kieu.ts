// HỢP ĐỒNG: NHỊP HỌC TRÊN "HÔM NAY CỦA THẦY" (thầy 12/10 duyệt bản vẽ: "Mục hôm nay hiển thị rõ cho tôi vô cùng đẹp Nhịp học, phải làm rất đẹp, tôi
// nhìn vào thấy ngay học sinh nào chăm học sinh nào lười" · "duyệt bản vẽ, buid và đẩy luôn nhé").
// MỘT lệnh thầy CHỈ ĐỌC (mã bí mật, chạy trên `envDoc`), máy chủ `server/src/nhip-hoc.ts`, app thầy `src/lib/nhip-hoc-thay.ts`:
//   · `POST /gv/nhip-hoc {}` ⇒ `TraLoiNhipHoc` — mọi em đang nhận bài hằng ngày (cùng danh sách + cùng phép tính mức / đã làm với `/gv/bai-hang-ngay`),
//     mỗi em: ngày bắt đầu tính (em vào muộn), dãy [mức, đã làm] từng ngày từ 01/10 tới hôm nay, cờ "Có dấu hiệu đối phó" tính THEO LÔ.
// App lọc khối / lớp và chia nhóm (luật `LUAT_NHOM_NHIP`, hàm thuần `src/lib/nhip-hoc-thay.ts`). Dùng chung cho máy chủ và app thầy (app CHỈ ĐỌC kiểu).
//
// NGÀY BẮT ĐẦU TÍNH CỦA EM (`ngayVao`) — "không phạt những ngày trước khi em có mặt":
//   bảng `hoc_sinh` CÓ cột ngày tạo (`tao_luc`, nhưng hai lối nhập em cũ không ghi ⇒ có thể rỗng) ⇒ ngày có mặt sớm nhất = SỚM NHẤT trong:
//   ngày tạo tài khoản (`hoc_sinh.tao_luc`, đổi sang ngày giờ Việt Nam) và dấu vết sớm nhất của em ở `hanh_trinh_v3_ngay` · `srs2_ke_hoach` ·
//   `goi_bai_7_em.bat_dau` · `su_kien_hoc.ngay_vn`. `ngayVao = max(tu, ngày có mặt sớm nhất)`; không có nguồn nào ⇒ `tu` (em có trong danh sách
//   Hành trình mà chưa từng có dấu vết thì vẫn tính từ đầu — đó đúng là em chưa làm). Lấy SỚM NHẤT (không lấy riêng ngày tạo) vì có em được nhập
//   lại tài khoản sau khi đã học: dấu vết thật có trước thì tính từ dấu vết.
//
// CỜ ĐỐI PHÓ THEO LÔ (`doiPho`) — đúng ngưỡng `NGUONG_THAI_DO` (bai-hang-ngay-kieu.ts), đúng hai tín hiệu nặng của hồ sơ một em:
//   (b) quá nhanh: ≥ `soLuotGiayToiThieu` lượt có số giây, ≥ `nhanXau`% lượt quá nhanh (dưới 8 giây · câu tự tính Phần III dưới 15 giây) VÀ nhóm quá
//       nhanh đúng dưới `nhanDungThap`%;
//   (e) chọn lặp: ≥ `soLuotLapToiThieu` lượt trắc nghiệm có chữ A–D, ≥ `lapXau`% lượt nằm trong chuỗi ≥ `chuoiLap` lượt liền (cùng ngày) cùng chữ.
//   Theo lô chỉ đọc số giây và đáp án ĐÃ GHI TRONG SỔ (`su_kien_hoc.giay`, `raw_json.ms`, `raw_json.chon|traLoi`) — lượt ca kiểm tra chỉ có số giây ở bảng
//   chi tiết ca, lượt game cũ không ghi số giây thì không vào mẫu (hồ sơ một em đọc thêm các nguồn ấy nên số có thể nhỉnh hơn). Không đọc được
//   phần chọn lặp ⇒ chỉ dùng quá nhanh, `doiPhoDaTinh.chonLap = false` + một câu cảnh báo.
import type { LopBaiHangNgay } from './bai-hang-ngay-kieu'

/** LUẬT NHÓM (thầy 12/10 duyệt cùng bản vẽ) — tính trên các ngày ĐÃ QUA (không tính hôm nay), từ `ngayVao` của em tới hôm qua. Mọi tỉ lệ là %. */
export const LUAT_NHOM_NHIP = {
  /** Chăm: số ngày đủ mức ≥ 80% số ngày đã qua. */
  chamTu: 80,
  /** Lười: số ngày đủ mức ≤ 40% số ngày đã qua … */
  luoiDen: 40,
  /** … HOẶC có từ 3 ngày liền không làm câu nào. */
  ngayLienKhongLam: 3,
  /** Chưa đủ dữ liệu: em có dưới 3 ngày đã qua được tính. */
  soNgayToiThieu: 3,
} as const

export type NhomNhip = 'cham' | 'chua-deu' | 'luoi' | 'chua-du'

/** Tín hiệu (b) đã vượt ngưỡng. Tỉ lệ đúng làm tròn %, nhóm không có lượt có kết quả ⇒ null. */
export interface DoiPhoQuaNhanh {
  nhanh: number
  coGiay: number
  dungNhanh: number | null
  dungThuong: number | null
  /** Có lượt câu tự tính (Phần III) 8–14 giây được tính là quá nhanh ⇒ câu lý do ghi kèm ngưỡng 15 giây. */
  coTuTinh: boolean
}
/** Tín hiệu (e) đã vượt ngưỡng. `dai` / `chu` = chuỗi dài nhất. */
export interface DoiPhoChonLap {
  trongChuoi: number
  tong: number
  dai: number
  chu: string
}
export interface DoiPhoEm {
  quaNhanh: DoiPhoQuaNhanh | null
  chonLap: DoiPhoChonLap | null
  /** Lý do bằng số, mỗi tín hiệu vượt ngưỡng một câu ("23/54 lượt trả lời dưới 8 giây, nhóm này đúng 28% (lượt thường đúng 78%)"). */
  lyDo: string[]
}

export interface EmNhipHoc {
  sbd: string
  hoTen: string
  /** Tên lớp hiệu lực (như `/gv/bai-hang-ngay`). */
  lop: string
  /** '10' | '11' | '12' | ''. */
  khoi: string
  /** Ngày đầu tính cho em (≥ `tu`) — xem đầu tệp. */
  ngayVao: string
  /** Mức tối thiểu từng ngày `tu` … `den` (cùng thứ tự `KetQuaNhipHoc.ngay`; đúng `mucToiThieu` của bảng Bài hằng ngày). */
  muc: number[]
  /** Số câu đã làm từng ngày (đúng `daLam` của bảng Bài hằng ngày). */
  lam: number[]
  /** null = không có dấu hiệu đối phó (hoặc chưa đủ lượt để đo). */
  doiPho: DoiPhoEm | null
}

export interface KetQuaNhipHoc {
  ok: true
  tu: string
  den: string
  /** Hôm nay giờ Việt Nam lúc trả lời (ngày cuối của `ngay`, chưa hết ngày). */
  homNay: string
  ngay: string[]
  em: EmNhipHoc[]
  /** Mọi lớp có em (app dựng ô Lớp). */
  lop: LopBaiHangNgay[]
  /** Tín hiệu đối phó đã tính được ở lần này. */
  doiPhoDaTinh: { quaNhanh: boolean; chonLap: boolean }
  /** Phần đọc phụ hỏng — câu tiếng Việt nói thật; số khác vẫn đúng. */
  canhBao: string[]
}
export type TraLoiNhipHoc = KetQuaNhipHoc | { ok: false; error: string }
