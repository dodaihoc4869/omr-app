// MÀN THI SẠCH — trạng thái che đề và luật khoá theo tín hiệu mới.
// BAOMATCATHI.md mục 3, 4.1, 4.3. Thuần logic, không đụng DOM.
//
// KHÔNG đụng một dòng nào của `chong-gian-lan.ts`: nhánh RỜI APP giữ nguyên
// luật đếm đang chạy tốt. File này chỉ lo bốn tín hiệu MỚI.
//
// ============================================================================
// MỘT CHỖ SỬA SO VỚI ĐẶC TẢ — HỌ KÊNH. Đọc kỹ, đây là chỗ chống khoá oan.
// ============================================================================
// Đặc tả nói "≥ 2 kênh cùng rơi vào một cửa sổ 300 ms ⇒ KHOÁ". Làm đúng nguyên
// văn là khoá oan ngay buổi đầu, vì hai cặp kênh KHÔNG ĐỘC LẬP với nhau:
//
//   · kênh 5 (nhịp vẽ) và kênh 6 (lệch đồng hồ) đo CÙNG MỘT THỨ — luồng chính
//     bị nghẽn. Em cuộn nhanh mười giây là cả hai cùng báo, đủ "2 kênh", khoá
//     oan một em không làm gì.
//   · kênh 1 (ẩn trang) và kênh 2 (tiêu điểm) cũng đi thành cặp: mọi lần
//     chuyển app, mọi cuộc gọi đến đều bắn cả hai.
//
// Nên luật ở đây đếm **HỌ** chứ không đếm kênh: hai kênh cùng đo một hiện tượng
// chỉ được tính MỘT phiếu. Cần ≥ 2 HỌ khác nhau trùng trong 300 ms mới khoá.
//
// Chụp màn hình vẫn bị bắt, mà bắt chắc hơn: bóp nút (họ vật lý) + lớp phủ
// dựng lên (họ che màn) + luồng chính nghẽn khi hệ thống ghi ảnh (họ luồng
// chính) — ba họ độc lập cùng chỉ về một thời điểm. Cuộn nhanh chỉ cho một họ.
import { SO_KENH, TEN_KENH, gomPhieuTrungKhop, type MaKenh, type PhieuKenh, MS_TRUNG_KHOP } from './do-dau-vet'

/** Nhóm kênh đo cùng một hiện tượng. Cùng họ ⇒ chỉ tính một phiếu. */
export type HoKenh = 'che_man' | 'luong_chinh' | 'vat_ly' | 'do_truc_tiep'

export const HO_CUA_KENH: Record<MaKenh, HoKenh> = {
  an_trang: 'che_man',
  tieu_diem: 'che_man',
  nhip_ve: 'luong_chinh',
  lech_dong_ho: 'luong_chinh',
  xung_chuyen_dong: 'vat_ly',
  toan_man: 'do_truc_tiep',
  kich_thuoc: 'do_truc_tiep',
  phim_chup: 'do_truc_tiep',
}

export const TEN_HO: Record<HoKenh, string> = {
  che_man: 'màn bị che',
  luong_chinh: 'luồng chính nghẽn',
  vat_ly: 'chuyển động máy',
  do_truc_tiep: 'số đo trực tiếp',
}

export function soHoKhacNhau(nhom: PhieuKenh[]): number {
  return new Set(nhom.map((p) => HO_CUA_KENH[p.kenh])).size
}

/** Nhóm phiếu nào đủ khoá theo dấu vết chụp: ≥ 2 HỌ khác nhau trong 300 ms. */
export function nhomDuKhoa(ds: PhieuKenh[], ms: number = MS_TRUNG_KHOP): PhieuKenh[][] {
  return gomPhieuTrungKhop(ds, ms).filter((n) => soHoKhacNhau(n) >= 2)
}

/** Câu ghi vào nhật ký cho thầy đọc: kênh nào đã báo. */
export function chuNhomPhieu(nhom: PhieuKenh[]): string {
  const kenh = [...new Set(nhom.map((p) => p.kenh))]
  return kenh.map((k) => `kênh ${SO_KENH[k]} (${TEN_KENH[k].toLowerCase()})`).join(' + ')
}

// ============================================================================
// NGƯỠNG — thầy chốt 05/09 chiều: không đo, lấy giá trị nhạy nhất còn an toàn.
// ============================================================================
// Đây là số SUY RA TỪ CƠ SỞ VẬT LÝ, không phải số đo trên máy thầy. Ghi rõ ở
// đây để lần sau đọc là biết mỗi con số từ đâu ra, và biết chỗ nào cần đo lại.
//
// Vì chưa đo, KHÔNG kênh nào trong ba họ dấu vết chụp được khoá một mình — mọi
// lần khoá đều phải có hai họ độc lập cùng báo. Ngưỡng đoán sai thì hậu quả là
// KHOÁ SÓT, không phải khoá oan. Đó là cách nhạy nhất mà vẫn không khoá oan.

/** Khoảng trống nhịp vẽ coi là trang ngừng được vẽ.
 *
 * 60 khung một giây ⇒ một khung 16,7 ms. Đo trên máy thầy 05/09: chụp màn hình
 * KHÔNG làm rớt khung nào quá 150 ms — Android vẫn vẽ đều trong lúc ghi ảnh.
 * Nên kênh này gần như im khi chụp; hạ xuống 200 ms để nó còn cơ hội góp phiếu,
 * chứ không trông cậy vào nó. */
export const MS_RAF_NGHI_CHOT = 200

/** Lệch giữa đồng hồ âm thanh và luồng chính.
 *
 * ĐO TRÊN MÁY THẦY 05/09, chụp màn hình Android: **K6 lệch −210 ms**, và là
 * kênh DUY NHẤT trong tám kênh phản ứng. Bảy kênh kia im re — kể cả kênh 8, vì
 * máy thầy chụp không phải bằng cách bóp hai nút cứng.
 *
 * Lấy 150 ms: dưới số đo thật 210 để chắc chắn bắt được, mà vẫn cao gấp hàng
 * chục lần jitter bình thường (vài ms). */
export const MS_LECH_DONG_HO_CHOT = 150

/** Xung bóp hai nút cứng.
 *
 * `xoan` 2,0 rad/s ≈ 115 °/s: cầm máy đọc bài, tay run tự nhiên cho dưới
 * 1 rad/s; vặn cổ tay nhanh mới vượt 2. `msMin`/`msMax` 40–200 ms lấy thẳng từ
 * đặc tả (nhát bóp ngắn, không phải rung kéo dài). `tiLeZToiDa` 0,8 nghĩa là
 * gia tốc vuông góc mặt màn phải NHỎ HƠN 80 % biên độ xoắn — gõ ngón tay vào
 * màn hình cho z trội hẳn nên bị loại.
 *
 * Đây là con số kém chắc nhất trong ba con số, vì biên độ phụ thuộc em cầm tay
 * hay đặt máy trên bàn. Nó chỉ góp phiếu, không tự khoá. */
export const NGUONG_XUNG_CHOT = { xoan: 2.0, msMin: 40, msMax: 200, tiLeZToiDa: 0.8 }

/** Diện tích còn dưới tỉ lệ này so với mốc thì coi là thu nhỏ / chia đôi màn.
 *
 * 0,72 lấy từ đặc tả. Chia đôi màn hình Android cho mỗi nửa ~50 %, thu nhỏ cửa
 * sổ còn ít hơn — cả hai rơi xa dưới ngưỡng. Bàn phím ảo ăn khoảng 35–45 %
 * chiều cao, tức còn 55–65 %, nên NẾU không loại trừ ô nhập thì bàn phím sẽ
 * khoá oan; vì vậy `xetCoMan` bỏ qua tuyệt đối khi đang gõ, chứ không hạ ngưỡng. */
export const TI_LE_CO_MAN_CHOT = 0.72

// ------------------------------------------------------------- MỨC NGẶT
export type MucNgat = 'rat_ngat' | 'ngat' | 'binh_thuong'

export const TEN_MUC_NGAT: Record<MucNgat, string> = {
  rat_ngat: 'Rất ngặt',
  ngat: 'Ngặt',
  binh_thuong: 'Bình thường',
}

export const MO_TA_MUC_NGAT: Record<MucNgat, string> = {
  rat_ngat: 'Cửa sổ nổi · thu nhỏ màn · thoát toàn màn · dấu vết chụp đều khoá ngay lần đầu.',
  ngat: 'Như Rất ngặt, nhưng cửa sổ nổi lần đầu chỉ cảnh báo.',
  binh_thuong: 'Giữ nguyên hành vi cũ: chỉ đếm rời app, tín hiệu mới chỉ ghi nhật ký.',
}

/** Ca mở trước bản này không có cột MucNgat ⇒ Bình thường, đúng hành vi cũ,
 * không đổi điểm ca đã gửi phụ huynh. */
export const MUC_NGAT_CA_CU: MucNgat = 'binh_thuong'

/** Ca mở từ bản này trở đi. Thầy chốt: lấy mức nhạy nhất. */
export const MUC_NGAT_MAC_DINH: MucNgat = 'rat_ngat'

export function chuanHoaMucNgat(v: unknown): MucNgat {
  return v === 'rat_ngat' || v === 'ngat' || v === 'binh_thuong' ? v : MUC_NGAT_CA_CU
}

// ------------------------------------------------------- LÝ DO KHOÁ MỚI
export type LyDoKhoaMoi = 'cua_so_noi' | 'thu_nho_man' | 'thoat_toan_man' | 'dau_vet_chup'

/** Câu hiện trên màn khoá. Không có chữ "gian lận", "quay cóp", "vi phạm" —
 * máy đo được DẤU VẾT, không đo được ý định. */
export const LOI_KHOA: Record<LyDoKhoaMoi, string> = {
  cua_so_noi: 'Có cửa sổ khác đè lên bài thi. Em giơ tay gọi Thầy.',
  thu_nho_man: 'Cửa sổ bài thi bị thu nhỏ hoặc chia đôi màn hình. Em giơ tay gọi Thầy.',
  thoat_toan_man: 'Bài thi đã ra khỏi chế độ toàn màn hình. Em giơ tay gọi Thầy.',
  dau_vet_chup: 'Máy ghi nhận dấu vết chụp màn hình. Em giơ tay gọi Thầy.',
}

/** Câu ngắn cho thầy đọc ở Chi tiết ca. */
export const TEN_LY_DO_KHOA: Record<LyDoKhoaMoi, string> = {
  cua_so_noi: 'cửa sổ nổi đè lên',
  thu_nho_man: 'thu nhỏ màn hình',
  thoat_toan_man: 'thoát toàn màn hình',
  dau_vet_chup: 'dấu vết chụp màn hình',
}

/** Tín hiệu này có khoá ở mức ngặt đang đặt không?
 *
 * `lanThu` để phân biệt mức Ngặt: cửa sổ nổi lần đầu chỉ cảnh báo, lần hai khoá. */
export function coKhoa(muc: MucNgat, lyDo: LyDoKhoaMoi, lanThu = 1): boolean {
  if (muc === 'binh_thuong') return false
  if (muc === 'ngat' && lyDo === 'cua_so_noi') return lanThu >= 2
  return true
}

// ============================================================================
// KHOÁ MỘT MÌNH KHI KHÔNG CHẠM MÀN — chốt 05/09 tối từ số đo thật của thầy.
// ============================================================================
// Số đo: chụp màn hình trên Android chỉ làm K6 báo (lệch −210 ms), bảy kênh kia
// im. Luật "≥ 2 họ" vì thế không bao giờ đạt, và chụp màn hình không bị khoá —
// đúng như thầy thấy.
//
// Nhưng dòng nhật ký còn một chi tiết đáng giá hơn cả con số: **"không chạm"**.
// Đó là chỗ tách được chụp màn hình khỏi nhiễu, mà không phải hạ ngưỡng:
//
//   · luồng chính nghẽn KHI TAY ĐANG CHẠM MÀN  = cuộn, gõ đáp án, kéo thả.
//     Chuyện bình thường của một em làm bài. Chỉ góp phiếu.
//   · luồng chính nghẽn KHI KHÔNG AI CHẠM MÀN  = máy tự dừng vẽ một nhịp.
//     Em ngồi yên thì không có lý do gì để nghẽn 200 ms — trừ khi hệ điều hành
//     đang làm việc gì đó nặng, mà việc nặng đúng lúc đang thi thì gần như chỉ
//     có ghi ảnh màn hình. Đủ để khoá một mình.
//
// Đây KHÔNG phải hạ ngưỡng để "có cái mà bắt": ngưỡng giữ nguyên tính chất,
// chỉ thêm một điều kiện PHỦ ĐỊNH rất mạnh mà nhiễu thường ngày không qua nổi.

/** Cửa sổ tránh chạm quanh một phiếu: có ngón tay trên màn trong khoảng này thì
 * phiếu chỉ góp phiếu, không được khoá một mình. Rộng hơn cửa sổ trùng khớp để
 * bao trọn một nhát cuộn. */
export const MS_KHONG_CHAM_QUANH_PHIEU = 400

export interface XetKhoaMotMinh {
  /** Phiếu thuộc họ `luong_chinh` (kênh 5 hoặc kênh 6). */
  hoLuongChinh: boolean
  /** Có ngón tay chạm màn trong ±400 ms quanh phiếu không. */
  coChamMan: boolean
  /** Trang còn hiện và còn tiêu điểm — nếu không thì đã có nhánh cửa sổ nổi /
   * rời app lo, không phải việc của dấu vết chụp. */
  dangLamBaiBinhThuong: boolean
}

export function duKhoaMotMinh(x: XetKhoaMotMinh): boolean {
  return x.hoLuongChinh && !x.coChamMan && x.dangLamBaiBinhThuong
}

// ------------------------------------------------ CỬA SỔ NỔI: XÉT TẠI CHỖ
//
// SỬA 05/09 tối, sau khi thầy thử thật: mở cửa sổ chat Messenger đè lên bài mà
// KHÔNG khoá.
//
// Vì sao bản trước trượt: nó ghi nhớ "đã từng thấy `hidden` chưa" rồi dùng cái
// nhớ đó để loại. Android bắn `hidden` một nhịp lúc lớp phủ dựng lên rồi
// `visible` lại ngay khi trang vẫn nhìn thấy được — thế là cả phiên bị đóng dấu
// "rời app" vĩnh viễn, và cửa sổ nổi không bao giờ khoá.
//
// Bản này xét TRẠNG THÁI TẠI MỐC 900 ms, đúng chữ của đặc tả 4.1: "vẫn ở ngoài,
// màn VẪN HIỆN". Trang còn hiện mà đã mất tiêu điểm gần một giây thì chỉ có một
// cách giải thích: có cái gì đó đè lên trên.
//
// Chuyển app thật thì tại mốc đó trang KHÔNG còn hiện, nên vẫn rơi đúng vào
// nhánh rời app và luật đếm cũ vẫn nguyên.

export interface AnhChupLucXet {
  /** `document.hasFocus()` tại đúng mốc 900 ms. */
  coTieuDiem: boolean
  /** `document.visibilityState === 'visible'` tại đúng mốc 900 ms. */
  manConHien: boolean
}

export function laCuaSoNoi(a: AnhChupLucXet): boolean {
  return !a.coTieuDiem && a.manConHien
}

/** Nhịp soi tiêu điểm. 250 ms để tổng thời gian từ lúc cửa sổ nổi mở tới lúc
 * khoá nằm trong 0,9–1,15 giây — đúng tiêu chí "khoá vì cửa sổ nổi ≤ 1 s" của
 * đặc tả mục 8. Soi thưa hơn thì em có thêm nửa giây đọc đề. */
export const MS_NHIP_SOI_TIEU_DIEM = 250

// --------------------------------------------------- ĐO KÍCH THƯỚC (4.3)

export interface TrangThaiCoMan {
  /** Diện tích lớn nhất từng thấy. TỰ NÂNG, không bao giờ hạ. */
  moc: number
  /** Lúc bắt đầu nhỏ hơn mốc; null = đang bình thường. */
  nhoTu: number | null
}

/** Cách duy nhất không oan: so DIỆN TÍCH với mốc lúc vào bài, không so
 * `screen.*` — nhờ vậy xoay ngang máy không bao giờ bị tính là thu nhỏ.
 *
 * Bỏ qua tuyệt đối khi đang có ô nhập được focus: bàn phím ảo lúc gõ Phần III
 * đổi cả layout viewport. */
export function xetCoMan(
  tt: TrangThaiCoMan,
  d: { rong: number; cao: number; dangGoO: boolean; bayGio: number; tiLe: number; msXacNhan: number },
): { tt: TrangThaiCoMan; khoa: boolean; tiLeHienTai: number } {
  const nay = d.rong * d.cao
  if (d.dangGoO) return { tt: { ...tt, nhoTu: null }, khoa: false, tiLeHienTai: 1 }
  if (nay >= tt.moc) return { tt: { moc: nay, nhoTu: null }, khoa: false, tiLeHienTai: 1 }
  const tiLe = tt.moc > 0 ? nay / tt.moc : 1
  if (tiLe >= d.tiLe) return { tt: { ...tt, nhoTu: null }, khoa: false, tiLeHienTai: tiLe }
  const nhoTu = tt.nhoTu ?? d.bayGio
  return { tt: { ...tt, nhoTu }, khoa: d.bayGio - nhoTu >= d.msXacNhan, tiLeHienTai: tiLe }
}
