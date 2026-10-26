// HỢP ĐỒNG DỮ LIỆU «Chạm để hiểu đề» + «Gợi ý 3 tầng» + «Lời giải kiểu sơ đồ của thầy» (thầy chốt build 26/10).
// Đặc tả + bản vẽ thầy đã duyệt: docs/ban-ve-doc-de-2610/ (DAC-TA.md, bang/*.jpg). Tư duy dạy: docs/tu-duy-day-hoa-thay-2610.md.
// MỘT bản soạn cho mỗi câu (`BanSoDo`) nuôi CẢ HAI chỗ:
//   - TRƯỚC khi nộp: gợi ý tầng 1–3 (đề nói gì · tóm tắt · phép tính) — KHÔNG kèm kết quả số (`ketQua` bị máy chủ cắt).
//   - SAU khi nộp: lời giải kiểu sơ đồ (đủ chuỗi + kết quả), THAY phần lời giải tính toán cũ khi câu có bản đã qua cổng kiểm.
// Dữ liệu cũ (`q.json.$.solution`) KHÔNG bị ghi đè; bản sơ đồ nằm ở bảng riêng `loi_giai_so_do`.

/** Loại vùng chạm trong đề (tô màu sẵn, chạm ra thẻ giải nghĩa). */
export type LoaiCham = 'cho' | 'hoi' | 'chat' | 'khoa'
/** Một vùng chạm phát hiện được trong chữ đề (vị trí theo ký tự của chữ đề THÔ, đã bỏ thẻ HTML). */
export type VungCham = { loai: LoaiCham; tu: number; den: number; chu: string; /** khoá tra từ điển: mã đơn vị / công thức chuẩn / mã từ then chốt */ khoa?: string }

/** Thẻ giải nghĩa khi chạm (từ điển trên máy, không gọi mạng). */
export type TheGiaiNghia = {
  ten: string // vd «M · nồng độ mol», «sodium hydroxide», «Cô cạn»
  nhan: 'Đơn vị' | 'Chất' | 'Công thức' | 'Từ then chốt' | 'Đề hỏi'
  doan: string[] // 1–3 câu ngắn, chữ thường (không HTML)
  congThuc?: string // vd «n = C_M × V (V tính bằng lít)»
  tenCu?: string // tên cũ / tên thường gọi của chất
  M?: number // khối lượng mol, MÁY TÍNH từ công thức (không gõ tay)
  nhoDoi?: string // vd «1000 mL = 1 L»
}

/** Một nút của sơ đồ: [tổng lượng │] chất, dưới chất các số liệu đề cho xếp cột dọc. */
export type NutSoDo = {
  tong?: string // bên TRÁI vạch dọc: «1 tấn quặng», «1000 m³»; có «?» nếu là đại lượng hỏi
  chat: string // công thức, dùng _ và ^ kiểu đơn giản: «FeS_2», «H_2SO_4», «CO_2»
  soLieu: string[] // xếp dọc dưới chất: «8%», «D = 1,07 g/cm³», «m kg = ?» (có «?» ⇒ tô Đề hỏi)
}
/** Mũi tên giữa hai nút liên tiếp; hiệu suất ghi TRÊN mũi tên. Không ghi hệ số, không «bảo toàn …» (thầy 26/10). */
export type MuiSoDo = { H?: number }
/** Sơ đồ: N nút (2 nút thường gặp; thêm MỘT nhịp nếu có chất trung gian quan trọng — thầy 26/10). muiTen.length === nut.length - 1. */
export type SoDo = { nut: NutSoDo[]; muiTen: MuiSoDo[]; chieu: 'xuoi' | 'nguoc' }

/** Một thừa số trong phép tính; chạm vào ⇒ «từ đầu tới đây là gì». */
export type ThuaSo = {
  so: string // hiển thị: «10^6», «8/100», «1/120», «2», «64», «90/100», «10^-6», «24,79»
  nghia: string // theo tư duy thầy: «đổi ra tiền nhà FeS₂ (chia M = 120)», «nhà SO₂ giàu gấp 2», «bị đánh thuế: × H/100»…
  denDay?: string // «tới đây là: số mol SO₂» (tuỳ chọn)
}
/** Một bước tính (1 bước là chuẩn; khó hiểu thì tách 2, TỐI ĐA 3). Bước sau có thể dùng tên kết quả bước trước. */
export type BuocTinh = { ten: string; thuaSo: ThuaSo[]; /** chỉ có SAU khi nộp */ ketQua?: string; donVi?: string }

/** Hiện tượng – bản chất cho bài khó / dài (tuỳ chọn). */
export type HienTuong = {
  giaiThich: string[] // 2–4 câu ngắn
  thiNghiem?: { mau: string; khung: { tieuDe: string; moTa: string }[] } // `mau` = mã mẫu thí nghiệm ảo trong thư viện giao diện
}

export type BanSoDo = {
  qid: string
  phienBan: number
  deNoiGi: string // tầng 1: đề đang nói gì (1–2 câu, theo tư duy thầy)
  soDo?: SoDo // tầng 2 (bài tính)
  buoc: BuocTinh[] // tầng 3, 1–3 bước
  hienTuong?: HienTuong
  /** câu lý thuyết: chìa khoá + câu tự hỏi thay cho sơ đồ/phép tính */
  chiaKhoa?: string
  cauTuHoi?: string
  /** chỉ có SAU khi nộp: kết quả cuối, đã làm tròn như kho */
  ketQua?: string
}

/** Dạng máy chủ trả: trước nộp (`truoc`) đã cắt mọi `ketQua`; sau nộp (`sau`) đủ. */
export type GoiYTraVe = { ok: true; co: false } | { ok: true; co: true; giaiDoan: 'truoc' | 'sau'; ban: BanSoDo }

/** Trạng thái cổng kiểm lưu cùng bản (máy chủ). Chỉ `dat` mới được hiện. */
export type KetQuaCong = 'dat' | 'lech' | 'khong_kiem_duoc' | 'lo_dap_an'
