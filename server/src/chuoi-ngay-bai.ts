// CHUỖI NGÀY THEO BÀI + BÌNH GIỮ CHUỖI (B3 kiểu Duolingo; thầy chốt 26/10 — hợp đồng docs/hop-dong-duolingo-2610.md mục 4–5). HÀM THUẦN, tính lại từ
// nhật ký mỗi lần (không lưu số chuỗi ⇒ không lệch, không cần chốt đêm). Một định nghĩa cho cả học sinh (/hs) và phụ huynh (/ph).
//   · NGÀY ĐẠT: em xong ≥ 1 bài (≥ CAU_MOT_BAI câu có kết quả trong ngày VN, mọi nguồn) HOẶC tự sửa xong ≥ 1 câu.
//   · NGÀY VẮNG CÓ PHÉP (thầy ghi ở điểm danh): TRƯỚC 27/10 giữ chuỗi, không tốn bình; từ 27/10 tính như ngày thường.
//   · BÌNH GIỮ CHUỖI: mang tối đa 2 (đạt mốc 100 ngày ⇒ 3); (trước 27/10: mỗi thứ Hai tặng 1); chuỗi chạm mốc 30 ngày tặng 1; bình mua (ví của đặc tả điểm
//     thưởng) cộng vào ngày mua. Lỡ ngày (không đạt, không phép, không phải hôm nay) ⇒ tự dùng 1 bình: chuỗi giữ, không cộng ngày.
//   · CỨU CHUỖI: lỡ ngày khi hết bình ⇒ chuỗi tắt; ngay NGÀY HÔM SAU (≈ 24 giờ) em xong 1 + 2 bài bù (≥ 3 × CAU_MOT_BAI câu) ⇒ chuỗi sống lại đúng số cũ
//     (ngày lỡ không cộng). Tối đa 1 lần mỗi tuần (tuần tính từ thứ Hai của ngày lỡ). Hôm sau chính là hôm nay mà chưa đủ ⇒ trả `cuu` để giao diện nhắc.
//   · HÔM NAY chưa đạt ⇒ chuỗi giữ tới hôm qua (không về 0 lúc sáng sớm), lịch ghi 'cho'.
// Chừa sẵn cho chuỗi đôi («Học cùng bạn», chưa build): gọi `chuoiNgayCuaEm` cho từng em rồi so lịch.
// LUẬT MỚI 27/10 (thầy: «1 tuần kiếm được 1 bình thôi», «Bỏ phần thầy duyệt đi») — áp TỪ ngày NGAY_LUAT_BINH_MOI, ngày đã qua tính như cũ (không sửa chuỗi cũ):
//   · BỎ tặng bình thứ Hai (thứ Hai trước mốc vẫn tặng như cũ, để số bình / ngày bình đỡ trong quá khứ không đổi);
//   · BỎ «vắng có phép giữ chuỗi»: từ mốc, ngày vắng có phép tính như ngày thường (không học ⇒ dùng bình / tắt / cứu). Dữ liệu điểm danh giữ nguyên.
//   · ĐẶT LẠI BÌNH (thầy duyệt 27/10, lặp lại 28/10 00:01): dòng `chuoi_binh_mua` nguồn bắt đầu TIEN_TO_DAT_LAI_BINH ⇒ ngày đó số bình về 0 (bình mua SAU
//     lúc đặt lại vẫn cộng — nơi đọc lọc). Nhiều lần đặt lại ⇒ vòng lặp ngày gặp từng lần theo thứ tự, lần sau cùng (luc lớn nhất) quyết định.

import { laNgayBaoTri } from './ngay-bao-tri'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'

/** (28/10) Điều kiện một dòng `su_kien_hoc` (KHÔNG bí danh) được tính vào MỨC HÔM NAY — đúng tập «đã làm hôm nay» của Gói 7 (`docDaLamNgay7`): bỏ KTCN,
 *  lướt / chẩn đoán / xem lời giải, câu Tự sửa lỗi, câu đang giấu, câu ca thi chưa công bố. Viết lại ở đây (không nhập goi-bai-7 ⇒ không vòng nhập). */
// (30/10, thầy: «Phần chặng tính số câu riêng nha, hs làm trong tu luyện là phần chặng tự nhiên xong») câu TỰ LUYỆN (`nguon 'tu_luyen'`, tu-luyen.ts ghi sổ
//  qua chua-cau-sai-tu-luyen.ts) cũng là phần riêng như Tự sửa lỗi ⇒ không tính vào mức hôm nay / chặng (trước đây cộng ⇒ chặng trên Lộ trình tự «xong»).
export const SQL_KHONG_TU_SUA = "COALESCE(nguon,'') NOT IN ('chua_loi','tu_luyen')"
// (29/10, thầy: «Phần học tiếp ở dưới chưa làm câu nào thanh đã báo rồi» — Lộ trình báo chặng sau đã làm dở dù em chưa động tới) MỘT chặng = 6 câu em ĐÃ TRẢ LỜI trong chặng:
//  · câu LÀM LẠI CUỐI CHẶNG (game-v2.ts ghi sổ `raw.ll = 1`) là phần thêm của chặng ấy — KHÔNG tính vào mức hôm nay (trước đây cộng ⇒ ranh chặng lệch, chặng sau «đã làm dở»);
//  · câu LƯỚT OMNI (`purpose 'luot'`, kết quả rỗng) em ĐÃ được phát và đã trả lời, chỉ không tính đúng / sai ⇒ vẫn là một câu của chặng (trước đây không cộng ⇒ chặng đủ 6 câu mà vạch báo 4/6).
// Đúng MỘT định nghĩa cho Lộ trình (`docDaLamVaVuaLam7`), lịch ngày (`bai-hang-ngay.ts`) và chuỗi «đủ mức hôm nay» (SQL_CAU_TINH_MUC) — ba nơi phải ra cùng một số.
export const SQL_KHONG_LAM_LAI = "COALESCE(json_extract(raw_json,'$.ll'),0)=0"
/** Dòng sổ là LƯỢT LƯỚT của chặng học (câu đã phát + đã trả lời, chưa tính đúng / sai). */
export const SQL_LA_LUOT_CHANG = "(nguon='game' AND purpose='luot')"
/** Dòng sổ có kết quả HOẶC là lượt lướt của chặng — thay cho `ket_qua IS NOT NULL` ở các nơi đếm «câu của chặng hôm nay». */
export const SQL_CO_KET_QUA_HOAC_LUOT = `(ket_qua IS NOT NULL OR ${SQL_LA_LUOT_CHANG})`
export const SQL_CAU_TINH_MUC = `ma_nguon NOT LIKE 'ktcn:%' AND ${SQL_KHONG_TU_SUA} AND ${SQL_KHONG_LAM_LAI} AND (${SQL_LA_LUOT_CHANG} OR (${SQL_LA_LAN_LAM} AND COALESCE(visibility,'')<>'embargoed' AND (nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=su_kien_hoc.ma_nguon AND c.trang_thai<>'da_xoa' AND ${SQL_DA_CONG_BO('c')}))))`
// MỘT MỨC, MỘT SỐ ĐẾM (02/11, thầy: «Kiểm tra xem có học sinh nào làm đủ bị mất chuỗi không? Nếu có khôi phục chuỗi cho học sinh nhé»). Đo dữ liệu thật
//  (scripts/kiem-chuoi-0211.ts): 31/10 và 01/11 có 17 + 42 em màn báo «Đủ x/y câu hôm nay!» (máy chủ đã trả thưởng «đạt mục tiêu ngày») mà chuỗi TẮT. Lý do: từ
//  #520 (7915b8b, luật chuỗi «đủ mức» 28/10) chuỗi chỉ đếm SỔ HỌC, còn Lộ trình / vòng «Đủ mức» (`docDaLamVaVuaLam7`) và lịch ngày (bai-hang-ngay `SQL_DEM_GAP`)
//  cộng thêm CÂU HỌC CÁCH GIẢI (`goi_bai_7_gap`: em bấm học lời giải — câu ấy không đi qua `answer` nên sổ không có dòng). Nay chuỗi đếm đúng tập ấy.
/** Số câu học cách giải của em `sbd` trong ngày VN `ngay` mà sổ CHƯA có dòng tính mức (y `SQL_DEM_GAP` của bai-hang-ngay). `sbd` / `ngay` là biểu thức trỏ ra
 *  truy vấn ngoài (vd `su_kien_hoc.sbd`, `goi_bai_7_muc_ngay.ngay`); tầng trong chỉ dùng `g` và bảng sổ của chính nó. Chỉ mục goi_bai_7_gap_sbd_luc(sbd, luc). */
export const sqlCauHocCachGiai = (sbd: string, ngay: string): string => `(SELECT COUNT(DISTINCT g.qid) FROM goi_bai_7_gap g WHERE g.sbd = ${sbd}
    AND g.luc >= strftime('%Y-%m-%dT%H:%M:%fZ', ${ngay}, '-7 hours') AND g.luc < strftime('%Y-%m-%dT%H:%M:%fZ', ${ngay}, '+17 hours')
    AND NOT EXISTS (SELECT 1 FROM su_kien_hoc WHERE su_kien_hoc.sbd = g.sbd AND su_kien_hoc.ngay_vn = date(g.luc, '+7 hours') AND su_kien_hoc.qid = g.qid
      AND ${SQL_CO_KET_QUA_HOAC_LUOT} AND ${SQL_CAU_TINH_MUC}))`
/** SỐ CÂU TÍNH MỨC của nhóm (sbd, ngay_vn) trong câu `… FROM su_kien_hoc WHERE … AND SQL_CO_KET_QUA_HOAC_LUOT GROUP BY sbd, ngay_vn` (bảng không bí danh):
 *  câu trong sổ + câu học cách giải chưa có trong sổ — ĐÚNG con số «Đủ x/y câu» của Lộ trình. Một nguồn cho chuỗi em (B3), bảng thầy / bạn bè / phụ huynh, cược. */
export const SQL_SO_CAU_MUC = `(COUNT(DISTINCT CASE WHEN ${SQL_CAU_TINH_MUC} THEN qid END) + ${sqlCauHocCachGiai('su_kien_hoc.sbd', 'su_kien_hoc.ngay_vn')})`
/** Dòng mức hôm nay `t` (bảng goi_bai_7_muc_ngay, tên hoặc bí danh) mà em ĐÃ ĐỦ: số câu tính mức (cùng phép SQL_SO_CAU_MUC) ≥ mức. Dùng khi xoá mức để chốt lại
 *  (giao bài mới #708 / sửa hạn / sửa danh sách em): em đã thấy «Đủ x/y» thì GIỮ mức đã đủ — không để mức nhảy lên rồi chuỗi tính theo mức mới (một mức thống nhất). */
export const sqlDaDuMuc = (t: string): string => `((SELECT COUNT(DISTINCT qid) FROM su_kien_hoc WHERE su_kien_hoc.sbd = ${t}.sbd AND su_kien_hoc.ngay_vn = ${t}.ngay
    AND ${SQL_CO_KET_QUA_HOAC_LUOT} AND ${SQL_CAU_TINH_MUC}) + ${sqlCauHocCachGiai(`${t}.sbd`, `${t}.ngay`)} >= ${t}.muc)`

export const CAU_MOT_BAI = 6
export const BAI_CUU = 2
export const SUC_CHUA_GOC = 2
export const SUC_CHUA_100 = 3
export const MOC_TANG_BINH = 30
export const MOC_SUC_CHUA = 100
/** Số ngày đọc lùi (đủ cho mọi chuỗi thực tế, chặn truy vấn). */
export const SO_NGAY_DOC = 400
/** Ngày VN bắt đầu luật bình mới 27/10 (bỏ tặng thứ Hai + bỏ giữ chuỗi vì vắng có phép). Ngày TRƯỚC mốc giữ luật cũ. */
export const NGAY_LUAT_BINH_MOI = '2026-10-27'
/** Nguồn của dòng đặt lại bình (bảng `chuoi_binh_mua`, `so` = −số bình em có lúc đặt lại, chỉ để truy vết) — lần 27/10. */
export const NGUON_DAT_LAI_BINH = 'tt-binh-reset-2710'
/** Tiền tố MỌI lần đặt lại bình (thầy 27/10: «00h01 đêm nay reset bình về 0 hết» ⇒ `tt-binh-reset-2810`, …). Mỗi lần một nguồn có hậu tố ngày ⇒ id
 *  `<sbd>|<nguồn>` không trùng lần trước. Nhiều lần: mỗi ngày có dòng đặt lại bình về 0 (lần SAU cùng thắng — luc lớn nhất), bình mua sau mốc vẫn cộng. */
export const TIEN_TO_DAT_LAI_BINH = 'tt-binh-reset'
/** Nguồn đặt lại theo ngày VN (`2026-10-28` ⇒ `tt-binh-reset-2810`). */
export const nguonDatLaiBinh = (ngayVn: string): string => `${TIEN_TO_DAT_LAI_BINH}-${ngayVn.slice(8, 10)}${ngayVn.slice(5, 7)}`
/**
 * Hai cột đọc bình theo ngày VN từ `chuoi_binh_mua` bí danh `m` (nơi gọi thêm FROM/WHERE/GROUP BY theo `n`): `s` = số bình mua (ngày có đặt lại: chỉ bình mua
 * SAU lúc đặt lại), `r` = 1 khi ngày đó có dòng đặt lại. Một nguồn cho cả đọc một em (B3) lẫn đọc nhiều em (phần B).
 */
export const SQL_COT_BINH_MUA = `date(m.luc, '+7 hours') AS n,
    SUM(CASE WHEN m.nguon LIKE '${TIEN_TO_DAT_LAI_BINH}%' THEN 0
      WHEN EXISTS (SELECT 1 FROM chuoi_binh_mua r WHERE r.sbd = m.sbd AND r.nguon LIKE '${TIEN_TO_DAT_LAI_BINH}%' AND r.luc >= m.luc AND date(r.luc, '+7 hours') = date(m.luc, '+7 hours')) THEN 0
      ELSE m.so END) AS s,
    MAX(m.nguon LIKE '${TIEN_TO_DAT_LAI_BINH}%') AS r`
/**
 * LUẬT CHUỖI 28/10 (thầy 27/10: «Chuỗi phải làm xong chặng mới tính chuỗi. Hiện tại đang làm xong chặng 1 là được tính chuỗi»): từ ngày này một ngày giữ
 * chuỗi khi em LÀM ĐỦ MỨC HÔM NAY — số câu Gói 7 đã làm (`soCau7`, cùng thước đo vòng «Đủ mức» / thẻ «Đủ x/y câu») ≥ mức câu đã chốt của ngày
 * (`goi_bai_7_muc_ngay.muc`). Ngày chưa chốt mức ⇒ đủ 1 chặng (CAU_MOT_BAI câu). Tự sửa riêng KHÔNG còn giữ chuỗi. Ngày trước mốc giữ luật cũ.
 * Cứu chuỗi: hôm sau đủ mức + 2 chặng bù (BAI_CUU × CAU_MOT_BAI câu).
 */
export const NGAY_CHUOI_DU_MUC = '2026-10-28'
/** TRẦN BÌNH 28/10 (thầy: «mỗi tuần học sinh chăm nhất cũng chỉ có 1 bình»): mọi đường (mua, quà mốc 30 ngày) chung trần 1 bình / tuần VN. */
export const BINH_TOI_DA_TUAN = 1
/** Ngày `ngay` còn được tặng bình thứ Hai? (chỉ thứ Hai TRƯỚC mốc luật mới) */
export const conTangThuHai = (ngay: string): boolean => ngay < NGAY_LUAT_BINH_MOI && new Date(Date.parse(`${ngay}T00:00:00Z`)).getUTCDay() === 1
/** Vắng có phép ngày `ngay` còn giữ chuỗi? (chỉ ngày TRƯỚC mốc luật mới) */
export const phepConGiuChuoi = (ngay: string): boolean => ngay < NGAY_LUAT_BINH_MOI

/**
 * LÀM BÙ CỨU CHUỖI (thầy 11/11: «phần làm bù cứu chuỗi bạn tính toán thông minh nhất hiệu quả nhất cho từng học sinh để học sinh mất chuỗi có thể làm bù cứu
 * chuỗi. Áp dụng luôn cho tất cả hs mất chuỗi từ hôm qua»). Áp cho NGÀY LỠ từ `NGAY_CUU_BU` (09/11 — em mất chuỗi hôm qua 10/11 là em lỡ ngày 09/11 hoặc 10/11):
 *   · THIẾU BAO NHIÊU BÙ BẤY NHIÊU: ngày lỡ ghi đúng số câu em còn thiếu của ngày ấy (mức gốc − đã làm; nghỉ cả ngày = 28; lỡ bài Kiểm tra ôn tập = 28).
 *   · CÂU BÙ = câu em làm VƯỢT mức gốc của một ngày sau đó (mức gốc = mức hôm ấy trừ phần trả nợ câu ⇒ câu TRẢ NỢ CÂU chính là câu bù; em không có nợ câu
 *     thì bù bằng «Học thêm» sau khi đủ mức). Ngày lỡ cũ nhất được bù trước. Bù hết ⇒ ngày lỡ thành 'cuu', chuỗi nối lại đúng số cũ + các ngày đạt từ đó.
 *   · HẠN: hết ngày thứ `HAN_CUU_NGAY` (4) sau ngày lỡ — khớp nợ câu (3 lần trả tối thiểu, lần thứ tư trả hết). Quá hạn chưa bù xong ⇒ ngày ấy 'tat',
 *     chuỗi tính lại từ các ngày đạt sau nó.
 *   · KHÔNG giới hạn mỗi tuần một lần, không cần bình. Bình còn thì vẫn tự đỡ trước như cũ. Luật cứu cũ (hôm sau đủ mức + 2 chặng, 1 lần / tuần) vẫn được nhận
 *     ⇒ không em nào thiệt so với trước.
 */
export const NGAY_CUU_BU = '2026-11-09'
export const HAN_CUU_NGAY = 4
/** Mức của ngày không có dòng mức (em không mở app) khi tính số câu thiếu. */
export const MUC_NGAY_VANG = 28
/** Từ ngày này ngày Kiểm tra ôn tập chỉ còn 28 câu kiểm tra, không kèm bài tập (= NGAY_DE_28 của rut-28.ts; test khoá hai hằng bằng nhau) ⇒ ĐÃ NỘP bài là ngày đạt. */
export const NGAY_KT_CHI_28 = '2026-11-11'
/** Cột «ngày Kiểm tra ôn tập»: 1 = đã nộp · 0 = có bài mà chưa nộp · NULL = không phải ngày kiểm tra. `sbd` / `ngay` là biểu thức của truy vấn ngoài. */
export const sqlCotKt = (sbd: string, ngay: string): string =>
  `(SELECT MAX(CASE WHEN k.trang_thai = 'da_nop' THEN 1 ELSE 0 END) FROM kiem_tra_ca_nhan k WHERE k.sbd = ${sbd} AND k.ngay = ${ngay} AND k.ngay >= '${NGAY_KT_CHI_28}' AND k.trang_thai <> 'cho_nguon')`
/** Cột «số câu trả nợ câu đã chọn của ngày» (goi_bai_7_no_chon.so — phần đã cộng vào mức hôm ấy). */
export const sqlCotTraNo = (sbd: string, ngay: string): string => `(SELECT c.so FROM goi_bai_7_no_chon c WHERE c.sbd = ${sbd} AND c.ngay = ${ngay})`

export type KieuNgay = 'hoc' | 'binh' | 'phep' | 'cuu' | 'tat' | 'cho'
export interface NhatKyChuoi {
  /** ngày VN → số câu (khác nhau) có kết quả trong ngày, mọi nguồn */
  soCau: ReadonlyMap<string, number>
  /** ngày VN em tự sửa xong ít nhất một câu */
  tuSua: ReadonlySet<string>
  /** ngày VN em vắng có phép */
  phep: ReadonlySet<string>
  /** bình mua theo ngày VN (ngày có đặt lại: chỉ bình mua SAU lúc đặt lại) */
  mua?: ReadonlyMap<string, number>
  /** ngày VN bình được đặt lại về 0 (dòng nguồn NGUON_DAT_LAI_BINH) */
  datLai?: ReadonlySet<string>
  /** (28/10) ngày VN → số câu khác nhau tính MỨC (đúng tập «đã làm hôm nay» của Gói 7: bỏ KTCN, lướt, câu chưa công bố). Vắng ⇒ dùng `soCau`. */
  soCau7?: ReadonlyMap<string, number>
  /** (28/10) ngày VN → mức câu đã chốt (`goi_bai_7_muc_ngay.muc`). */
  muc?: ReadonlyMap<string, number>
  /** (11/11) ngày VN → số câu TRẢ NỢ CÂU đã cộng vào mức hôm ấy (mức gốc = muc − traNo). */
  traNo?: ReadonlyMap<string, number>
  /** (11/11) ngày Kiểm tra ôn tập (từ NGAY_KT_CHI_28): true = em đã nộp bài · false = có bài mà chưa nộp. */
  kt?: ReadonlyMap<string, boolean>
}
export interface ChuoiNgay {
  so: number
  giuChuoi: number
  sucChua: number
  lich7: { ngay: string; kieu: KieuNgay }[]
  /** Cứu chuỗi đang chờ. Luật cũ: `daLam` / `can` tính theo CHẶNG. Luật làm bù 11/11 (`cau: true`): tính theo CÂU — `can` = tổng câu thiếu của các ngày lỡ
   *  đang chờ, `daLam` = đã bù, `ngayLo` = ngày lỡ cũ nhất, `soNgay` = số ngày lỡ đang chờ; `so` (ngoài) = chuỗi chắc chắn còn nếu không bù kịp. */
  cuu?: { hetHan: string; daLam: number; can: number; soCu: number; cau?: true; ngayLo?: string; soNgay?: number }
  binhVuaDo?: string
  /** (CHỈ-THÊM 26/10, chỉ khi nơi gọi xin `thang`) lịch 30 ngày gần nhất + chuỗi dài nhất trong cửa sổ đọc — cùng vòng lặp, không đọc thêm. */
  lich30?: { ngay: string; kieu: KieuNgay }[]
  daiNhat?: number
  /** (28/10) số bình em ĐÃ NHẬN trong tuần VN hiện tại (mua + quà), tính từ lần đặt lại gần nhất — trần BINH_TOI_DA_TUAN. */
  binhTuanNay: number
  /** (28/10) mức câu hôm nay để giữ chuỗi + số câu đã làm (thước đo vòng «Đủ mức»). */
  homNay?: { can: number; da: number }
}

const NGAY = 86_400_000
const ms = (ngay: string) => Date.parse(`${ngay}T00:00:00Z`)
const congNgay = (ngay: string, n: number) => new Date(ms(ngay) + n * NGAY).toISOString().slice(0, 10)
export const ngayVn = (luc: number) => new Date(luc + 7 * 3_600_000).toISOString().slice(0, 10)
/** Thứ Hai đầu tuần của ngày (VN). */
export const thuHaiCua = (ngay: string) => { const d = new Date(ms(ngay)).getUTCDay(); return congNgay(ngay, -((d + 6) % 7)) }

/** Câu tính mức / mức cần của ngày `d` (luật 28/10). */
export const cauMucNgay = (nk: NhatKyChuoi, d: string): number => (nk.soCau7 ?? nk.soCau).get(d) ?? 0
export const canMucNgay = (nk: NhatKyChuoi, d: string): number => Math.max(1, nk.muc?.get(d) ?? CAU_MOT_BAI)
/** Ngày `d` giữ chuỗi? Trước 28/10: ≥ 1 chặng hoặc tự sửa xong · từ 28/10: ĐỦ MỨC HÔM NAY. Một định nghĩa cho chuỗi em, lửa đôi, cược. */
export const ngayDatChuoi = (nk: NhatKyChuoi, d: string): boolean =>
  d < NGAY_CHUOI_DU_MUC ? (nk.soCau.get(d) ?? 0) >= CAU_MOT_BAI || nk.tuSua.has(d) : cauMucNgay(nk, d) >= canMucNgay(nk, d) || nk.kt?.get(d) === true
/** Mức GỐC của ngày `d` (không gồm phần trả nợ câu); ngày không có dòng mức ⇒ MUC_NGAY_VANG. */
export const mucGocNgay = (nk: NhatKyChuoi, d: string): number => { const m = nk.muc?.get(d); return m ? Math.max(1, m - (nk.traNo?.get(d) ?? 0)) : MUC_NGAY_VANG }
/** Số câu em còn THIẾU của ngày `d` (phần của chính ngày ấy). Ngày Kiểm tra ôn tập: đã nộp 0 · chưa nộp MUC_NGAY_VANG. */
export const cauThieuNgay = (nk: NhatKyChuoi, d: string): number => nk.kt?.has(d) ? (nk.kt.get(d) ? 0 : MUC_NGAY_VANG) : Math.max(0, mucGocNgay(nk, d) - cauMucNgay(nk, d))
/** Số câu em làm VƯỢT mức gốc của ngày `d` = câu làm bù (ngày Kiểm tra ôn tập không có câu bù). */
export const cauBuNgay = (nk: NhatKyChuoi, d: string): number => nk.kt?.has(d) ? 0 : Math.max(0, cauMucNgay(nk, d) - mucGocNgay(nk, d))

/** Chuỗi của MỘT em tại ngày `homNay` (VN) từ nhật ký. */
export function chuoiNgayCuaEm(nk: NhatKyChuoi, homNay: string, thang = false): ChuoiNgay {
  const cau7 = (d: string) => cauMucNgay(nk, d)
  const canMuc = (d: string) => canMucNgay(nk, d)
  const dat = (d: string) => ngayDatChuoi(nk, d)
  const tuanNhan = new Map<string, number>() // tuần VN → số bình đã nhận (mua + quà), xoá khi đặt lại
  const nhan = (d: string, n: number) => { const t = thuHaiCua(d); tuanNhan.set(t, (tuanNhan.get(t) ?? 0) + n) }
  const coHoatDong = [...nk.soCau.keys(), ...nk.tuSua, ...nk.phep].filter(d => d <= homNay).sort()
  const batDau = coHoatDong.length ? (coHoatDong[0]! > congNgay(homNay, -SO_NGAY_DOC) ? coHoatDong[0]! : congNgay(homNay, -SO_NGAY_DOC)) : homNay
  let so = 0, binh = 0, sucChua = SUC_CHUA_GOC, binhVuaDo: string | undefined, daiNhat = 0
  let cuu: ChuoiNgay['cuu']
  const tuanDaCuu = new Set<string>(), lich = new Map<string, KieuNgay>()
  // LÀM BÙ CỨU CHUỖI (11/11): hàng các ngày lỡ đang chờ bù, cũ nhất trước. Trong lúc chờ, `so` = chuỗi NẾU bù kịp; `sau` = số ngày đạt kể từ ngày lỡ ấy
  // (= chuỗi còn lại nếu ngày ấy hết hạn mà chưa bù xong).
  const hang: { ngay: string; con: number; can: number; han: string; sau: number }[] = []
  let soLucCho = 0
  const tangMoc = (d: string) => { if (d < NGAY_CHUOI_DU_MUC || (tuanNhan.get(thuHaiCua(d)) ?? 0) < BINH_TOI_DA_TUAN) { binh = Math.min(sucChua, binh + 1); nhan(d, 1) } }
  /** Ngày lỡ đầu hàng đã bù đủ ⇒ 'cuu'. Hàng vừa hết ⇒ chuỗi nối lại thật: cập nhật kỷ lục, quà mốc 30 ngày nếu vừa vượt mốc trong lúc chờ. */
  const chotDauHang = (d: string) => {
    if (!hang.length) return
    while (hang.length && hang[0]!.con <= 0) lich.set(hang.shift()!.ngay, 'cuu')
    if (!hang.length) { if (so > daiNhat) daiNhat = so; if (soLucCho < MOC_TANG_BINH && so >= MOC_TANG_BINH) tangMoc(d); if (so >= MOC_SUC_CHUA) sucChua = SUC_CHUA_100 }
  }
  const apBu = (d: string) => { let n = cauBuNgay(nk, d); for (const c of hang) { if (n <= 0) break; const x = Math.min(c.con, n); c.con -= x; n -= x } chotDauHang(d) }
  for (let d = batDau; d <= homNay; d = congNgay(d, 1)) {
    // ngày lỡ đầu hàng QUÁ HẠN mà chưa bù xong ⇒ tắt hẳn: chuỗi chỉ còn các ngày đạt sau nó
    while (hang.length && hang[0]!.han < d) {
      const c = hang.shift()!
      lich.set(c.ngay, 'tat'); so = c.sau; soLucCho = 0
      // ngày lỡ trẻ hơn mà không còn che chắn ngày đạt nào (chuỗi nếu bù = chuỗi chắc chắn) ⇒ bỏ khỏi hàng, khỏi nhắc em bù cho một chuỗi đã mất
      for (let i = hang.length - 1; i >= 0; i--) if (hang[i]!.sau >= so) { lich.set(hang[i]!.ngay, 'tat'); hang.splice(i, 1) }
      chotDauHang(d)
    }
    if (conTangThuHai(d)) binh = Math.min(sucChua, binh + 1)
    if (nk.datLai?.has(d)) { binh = 0; tuanNhan.set(thuHaiCua(d), 0) }
    const mua = nk.mua?.get(d) ?? 0
    if (mua > 0) { binh = Math.min(sucChua, binh + mua); nhan(d, mua) }
    if (dat(d)) {
      so++
      lich.set(d, 'hoc')
      if (hang.length) { for (const c of hang) c.sau++; apBu(d); continue } // đang chờ bù: kỷ lục / quà mốc chỉ tính khi chuỗi nối lại thật (chotDauHang)
      if (so > daiNhat) daiNhat = so
      // Quà mốc 30 ngày: từ 28/10 chung trần 1 bình/tuần với bình mua (tuần đã nhận bình ⇒ không tặng thêm).
      if (so === MOC_TANG_BINH) tangMoc(d)
      if (so >= MOC_SUC_CHUA) sucChua = SUC_CHUA_100
      continue
    }
    if (d === homNay) { lich.set(d, 'cho'); if (hang.length) apBu(d); continue } // hôm nay chưa xong ⇒ chuỗi giữ tới hôm qua; câu vượt mức gốc hôm nay vẫn tính bù
    if (nk.phep.has(d) && phepConGiuChuoi(d)) { lich.set(d, 'phep'); continue }
    // Ngày bảo trì (ngay-bao-tri.ts): không làm vẫn giữ chuỗi, không tốn bình (vẽ như ngày được đỡ). Đã làm đủ thì đã tính ở trên (lửa +1).
    if (laNgayBaoTri(d)) { lich.set(d, 'phep'); continue }
    if (so === 0) { lich.set(d, 'tat'); continue }
    if (binh > 0) { binh--; binhVuaDo = d; lich.set(d, 'binh'); continue }
    // Hết bình: cứu bằng 2 bài bù ngay hôm sau (một lần mỗi tuần).
    const sau = congNgay(d, 1), tuan = thuHaiCua(d)
    const soSau = sau < NGAY_CHUOI_DU_MUC ? nk.soCau.get(sau) ?? 0 : cau7(sau)
    const nenSau = sau < NGAY_CHUOI_DU_MUC ? CAU_MOT_BAI : canMuc(sau) // phần «đủ mức của hôm đó»; bù = BAI_CUU chặng NGOÀI phần này
    if (!tuanDaCuu.has(tuan) && soSau >= nenSau + BAI_CUU * CAU_MOT_BAI) { tuanDaCuu.add(tuan); lich.set(d, 'cuu'); continue }
    if (d >= NGAY_CUU_BU) { // LÀM BÙ: xếp ngày lỡ vào hàng chờ với đúng số câu em còn thiếu; câu vượt mức gốc của chính ngày này (đủ bài nhưng chưa đủ phần trả nợ) bù cho ngày cũ hơn
      if (!hang.length) soLucCho = so
      const thieu = cauThieuNgay(nk, d)
      hang.push({ ngay: d, con: thieu, can: thieu, han: congNgay(d, HAN_CUU_NGAY), sau: 0 })
      lich.set(d, 'tat')
      apBu(d)
      continue
    }
    if (sau === homNay && !tuanDaCuu.has(tuan)) {
      // Còn trong hạn cứu: chuỗi tạm tắt, giao diện nhắc học bù. Bài của hôm nay tính bài đầu; phần dư mới là bài bù.
      cuu = { hetHan: new Date(ms(homNay) + NGAY - 7 * 3_600_000).toISOString(), daLam: Math.max(0, Math.floor((soSau - nenSau) / CAU_MOT_BAI)), can: BAI_CUU, soCu: so }
    }
    so = 0
    lich.set(d, 'tat')
  }
  if (hang.length) { // còn ngày lỡ đang chờ bù: `so` gửi đi = chuỗi chắc chắn còn (các ngày đạt sau ngày lỡ mới nhất); `cuu.soCu` = chuỗi nếu bù kịp
    const can = hang.reduce((t, c) => t + c.can, 0), con = hang.reduce((t, c) => t + c.con, 0)
    cuu = { hetHan: new Date(ms(hang[0]!.han) + NGAY - 7 * 3_600_000).toISOString(), daLam: can - con, can, soCu: so, cau: true, ngayLo: hang[0]!.ngay, soNgay: hang.length }
    so = hang[hang.length - 1]!.sau
  }
  const lichN = (n: number) => Array.from({ length: n }, (_, i) => congNgay(homNay, i - n + 1)).map(ngay => ({ ngay, kieu: lich.get(ngay) ?? 'tat' as KieuNgay }))
  const lich7 = lichN(7)
  const homNayMuc = homNay >= NGAY_CHUOI_DU_MUC ? { can: canMuc(homNay), da: cau7(homNay) } : undefined
  return { so, giuChuoi: binh, sucChua, lich7, ...(cuu ? { cuu } : {}), ...(binhVuaDo ? { binhVuaDo } : {}), ...(thang ? { lich30: lichN(30), daiNhat } : {}),
    binhTuanNay: tuanNhan.get(thuHaiCua(homNay)) ?? 0, ...(homNayMuc ? { homNay: homNayMuc } : {}) }
}
