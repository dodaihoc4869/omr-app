// MỘT NGUỒN SỰ THẬT CHO GIÁO ÁN CHỮA 80 PHÚT.
//
// Đặc tả: GOI-LEN-BANG-80-PHUT.md mục 3. Cấm rải mấy con số này ra chỗ khác —
// đổi một ngưỡng phải đổi đúng một chỗ, và màn Cài đặt đọc/ghi đúng object này.

export type Lane = 'L0' | 'L1' | 'L2' | 'L3'

/** Bốn lane, xếp từ rẻ tới đắt. Thứ tự này là thứ tự BẬC — `>= L2` nghĩa là
 * lane nằm từ vị trí của L2 trở đi trong mảng. */
export const LANE: Lane[] = ['L0', 'L1', 'L2', 'L3']

export const TEN_LANE: Record<Lane, string> = {
  L0: 'Đọc lướt đáp án',
  L1: 'Đọc đáp án + nêu bẫy',
  L2: 'Thầy chữa tại chỗ',
  L3: 'Em lên bảng',
}

export type NguyenNhanSai = 'hieu_nham' | 'tinh_sai' | 'chua_biet' | 'doan' | 'khong_ro'

export const TEN_NGUYEN_NHAN: Record<NguyenNhanSai, string> = {
  hieu_nham: 'hiểu nhầm',
  tinh_sai: 'tính sai',
  chua_biet: 'chưa biết',
  doan: 'đoán',
  khong_ro: 'chưa rõ nguyên nhân',
}

export interface CauHinhLenBang {
  /** Cả buổi chữa, tính bằng phút. */
  NGAN_SACH_PHUT: number
  /** Vào lớp, ổn định, trả phiếu. Trừ thẳng khỏi ngân sách chữa. */
  HAO_PHI_MO_DAU_GIAY: number
  /** Chốt mấy ý phải nhớ ở cuối buổi. Cũng trừ thẳng.
   *
   * Tách làm hai chứ không gộp một số 480: giáo án in ra có hai dòng ở hai đầu
   * buổi, gộp lại thì lúc in phải chẻ đôi bằng một tỉ lệ bịa ra ngay trong bộ
   * dựng chữ — đúng thứ "hằng số rải rác" bị cấm. */
  HAO_PHI_CHOT_CUOI_GIAY: number
  /** Giá một lần dùng mỗi lane, tính bằng giây. */
  GIAY_LANE: Record<Lane, number>
  /** TRẦN số em lên bảng. Là trần thầy đặt, KHÔNG phải biến để thuật toán tối ưu. */
  SO_EM_LEN_BANG_TOI_DA: number
  /** SÀN số em lên bảng — thầy chốt 14/09: "trong 90 phút danh sách lớp phải
   * có ít nhất 20 em được lên bảng".
   *
   * Đây là ĐÍCH, không phải lời hứa. Buổi không đủ câu để gọi bấy nhiêu em thì
   * thuật toán phải NÓI THIẾU BAO NHIÊU, cấm bịa thêm em. */
  SO_EM_LEN_BANG_TOI_THIEU: number
  /** GIÂY LÊN BẢNG THEO SAO — thay cho một giá cố định.
   *
   * Vì sao phải tách: 20 em × 420 giây = 8.400 giây, gấp đôi ngân sách 90 phút.
   * Không có cách nào đạt 20 em nếu mọi em lên bảng đều tốn bằng nhau. Câu 2
   * sao đáng 5 phút vì phải chốt bẫy; câu 0 sao gọi nhanh 2 phút là đủ. Đan xen
   * khó–dễ chính là chỗ này. */
  GIAY_LEN_BANG_THEO_SAO: Record<0 | 1 | 2, number>

  /** N1 — lớp vừa rồi sai từ tỉ lệ này trở lên thì câu vào danh sách bắt buộc. */
  N1_TI_LE_SAI_BAT_BUOC: number
  /** Dưới bấy nhiêu em LÀM CHÍNH CÂU ĐÓ thì N1 không được kết luận gì. */
  N1_CO_MAU_TOI_THIEU: number
  /** N2 — cận dưới Wilson của tỉ lệ đúng từ mức này trở xuống thì bắt buộc chữa.
   *
   * VÌ SAO KHÔNG DÙNG "≥ 30 lượt" NHƯ BẢN PROMPT: đo 10/09 trên sheet
   * `ChiTietCau` (3 737 dòng, 32 ca, 814 qid) thì ĐÚNG MỘT qid đạt 30 lượt.
   * Ngưỡng ấy hôm nay gần như không bao giờ bật. Cận dưới Wilson có tác dụng
   * ngay từ 8 lượt mà vẫn tự dè chừng khi mẫu bé. */
  N2_CAN_DUOI_WILSON: number
  N2_CO_MAU_TOI_THIEU: number
  /** Độ tin của khoảng Wilson. 0,90 ⇒ z = 1,6449. */
  DO_TIN_WILSON: number

  /** Hệ số theo nguyên nhân sai (mục 4.4 đặc tả). */
  HE_SO_NGUYEN_NHAN: Record<NguyenNhanSai, number>
  /** Câu giao cho em so với BẬC chỗ em vấp: thấp hơn một bậc là hợp nhất. */
  HE_SO_CAP_DO: { thap_hon: number; cung_bac: number; cao_hon: number }
  /** Em không có chỗ vấp nào ở chuyên đề ấy — không loại hẳn, nhưng xếp cuối. */
  HE_SO_KHONG_VAP: number

  /** Lane L3 vừa dạy cả lớp (như L2) vừa dạy sâu một em. Đây là phần "sâu".
   *
   * Có nó thì L3 mới đáng giá 420 giây so với 150 giây của L2 — và chỉ đáng khi
   * em thật sự hợp câu. Em `chua_biet` (0,25) hay `doan` (0,15) tự động không
   * đủ, đúng luật "lên bảng là bêu — đẩy sang L2". */
  HE_SO_SAU_L3: number

  /** Số vòng tìm nhị phân λ. Ngân sách tính bằng SỐ VÒNG chứ không bằng đồng hồ:
   * cắt theo `Date.now()` thì máy chậm ra giáo án khác máy nhanh. Đã trả giá cho
   * bài học này ở `de-rieng-cau-hinh.ts`. */
  VONG_LAGRANGE: number
  /** Khoảng cách đối ngẫu quá mức này thì màn phải báo, không im. */
  KHOANG_CACH_DOI_NGAU_TOI_DA: number

  /** Ca có dưới tỉ lệ này số dòng còn `giay` thì BỎ HẲN hai luật đọc thời gian
   * (`tinh_sai`, `doan`) và phải nói ra là ca thiếu dữ liệu thời gian.
   *
   * Đo 10/09: bốn ca lớn nhất có 99%, 98%, 71%, 12% số dòng còn giây. Ca 12%
   * mà vẫn lấy trung vị ra chấm nguyên nhân là chấm bằng rác. */
  TI_LE_CO_GIAY_TOI_THIEU: number
}

export const CAU_HINH_LEN_BANG_MAC_DINH: CauHinhLenBang = {
  // 90 phút (thầy chốt 14/09), trừ 480 giây hao phí còn 4.920 giây chữa.
  NGAN_SACH_PHUT: 90,
  HAO_PHI_MO_DAU_GIAY: 180,
  HAO_PHI_CHOT_CUOI_GIAY: 300,
  GIAY_LANE: { L0: 5, L1: 20, L2: 150, L3: 420 },
  // Trần nới theo sàn mới: sàn 20 thì trần không thể còn 8.
  SO_EM_LEN_BANG_TOI_DA: 30,
  SO_EM_LEN_BANG_TOI_THIEU: 20,
  // Phép tính đối chứng cho sàn 20 trong 4.920 giây:
  //   6 câu 2 sao × 300 + 8 câu 1 sao × 180 + 6 câu 0 sao × 120 = 3.960 giây,
  //   còn 960 giây đọc đáp án cho phần còn lại (L0 5 giây, L1 20 giây mỗi câu).
  GIAY_LEN_BANG_THEO_SAO: { 2: 300, 1: 180, 0: 120 },

  N1_TI_LE_SAI_BAT_BUOC: 0.4,
  N1_CO_MAU_TOI_THIEU: 8,
  N2_CAN_DUOI_WILSON: 0.55,
  N2_CO_MAU_TOI_THIEU: 8,
  DO_TIN_WILSON: 0.9,

  HE_SO_NGUYEN_NHAN: { hieu_nham: 1.0, tinh_sai: 0.85, chua_biet: 0.25, doan: 0.15, khong_ro: 0.5 },
  HE_SO_CAP_DO: { thap_hon: 1.0, cung_bac: 0.8, cao_hon: 0.55 },
  HE_SO_KHONG_VAP: 0.1,
  HE_SO_SAU_L3: 2.0,

  VONG_LAGRANGE: 40,
  KHOANG_CACH_DOI_NGAU_TOI_DA: 0.05,
  TI_LE_CO_GIAY_TOI_THIEU: 0.6,
}

/** Hao phí cả buổi — mở đầu cộng chốt cuối. Giây. */
export function haoPhiGiay(ch: CauHinhLenBang): number {
  return ch.HAO_PHI_MO_DAU_GIAY + ch.HAO_PHI_CHOT_CUOI_GIAY
}

/** Giây một em lên bảng chữa câu này — theo SAO của câu, không phải một giá
 * chung. Câu chưa gắn sao tính như 0 sao. */
export function giayLenBang(ch: CauHinhLenBang, sao: 0 | 1 | 2 | undefined): number {
  return ch.GIAY_LEN_BANG_THEO_SAO[sao ?? 0] ?? ch.GIAY_LEN_BANG_THEO_SAO[0]
}

/** THỜI GIAN MỘT EM LÊN BẢNG THEO ĐỘ KHÓ × ĐỘ DÀI × EM — MỘT NGUỒN cho `thoi-gian-len-bang.ts`
 * (0.Planer giao 19/09, thầy chốt: "dựa vào độ khó và đề dài hay ngắn tính toán lại hết thời gian lên bảng, chữa bài").
 *
 *   T = T_đọc + T_làm + T_chữa            (giây, một em)
 *   T_đọc  = DOC_NEN_GIAY + DOC_GIAY_MOI_TU × sốTừ(đề + phương án/ý) + (có hình/bảng ? DOC_HINH_GIAY : 0)
 *   T_làm  = LAM_NEN_GIAY[phần] × HE_SO_SAO[sao] × (1 + HE_SO_LOP_SAI × tỉLệLớpSai) × HE_SO_BAC[bậc em]
 *   T_chữa = (CHUA_NEN_GIAY + CHUA_GIAY_MOI_BUOC × sốBước kẹp [CHUA_BUOC_TOI_THIEU, CHUA_BUOC_TOI_DA])
 *            × (tỉLệLớpSai ≥ CHUA_NGUONG_LOP_SAI ? CHUA_HE_SO_KHO : 1)
 *   T      = kẹp [TOI_THIEU_GIAY, TOI_DA_GIAY] rồi làm tròn LAM_TRON_GIAY
 *   chi phí trong NGÂN SÁCH BUỔI của một em (hai em song song) = làm tròn(T_chữa + HE_LAM_SONG_SONG × (T_đọc + T_làm))
 *
 * Câu KHÔNG có văn bản (test cũ dựng `CauChua` tối giản) rơi về `GIAY_LEN_BANG_THEO_SAO` — 300/180/120 KHÔNG đổi.
 * Đây là điểm xuất phát; muốn đổi con số nào thì đổi Ở ĐÂY và xem lại bảng giá trị trong
 * `tests/thoi-gian-len-bang-1909.test.ts`. */
export const THOI_GIAN_LEN_BANG = {
  DOC_NEN_GIAY: 8,
  DOC_GIAY_MOI_TU: 0.35,
  DOC_HINH_GIAY: 10,
  LAM_NEN_GIAY: { I: 45, II: 120, III: 150 },
  HE_SO_SAO: { 0: 1.0, 1: 1.5, 2: 2.2 },
  HE_SO_LOP_SAI: 0.5,
  HE_SO_BAC: { biet: 1.25, hieu: 1.0, van_dung: 0.85 },
  CHUA_NEN_GIAY: 30,
  CHUA_GIAY_MOI_BUOC: 25,
  CHUA_BUOC_TOI_THIEU: 1,
  CHUA_BUOC_TOI_DA: 6,
  /** Câu 0 sao ("đọc đáp án là đủ") chữa tối đa bấy nhiêu bước trên bảng — câu dễ không cần chữa 6 bước (0.Planer chốt 19/09). */
  CHUA_BUOC_TOI_DA_SAO_0: 3,
  CHUA_NGUONG_LOP_SAI: 0.5,
  CHUA_HE_SO_KHO: 1.3,
  TOI_THIEU_GIAY: 60,
  TOI_DA_GIAY: 480,
  LAM_TRON_GIAY: 15,
  /** PHẦN (T_đọc + T_làm) mà MỖI EM phải gánh trong ngân sách buổi khi hai em lên bảng SONG SONG.
   * Tờ chiếu chạy hai em một đợt: `T_đợt = max(T_đọc+T_làm) + T_chữa_A + T_chữa_B`, nên một em chỉ tốn thêm
   * ≈ nửa giờ làm bài (em kia làm cùng lúc) + trọn giờ chữa của mình. Đặt 1 nếu muốn tính nối tiếp (mỗi em một mình):
   * khi ấy buổi 30 câu thường chỉ xếp nổi ~13 em thay vì 20 — xem bảng trong `tests/thoi-gian-len-bang-1909.test.ts`. */
  HE_LAM_SONG_SONG: 0.5,
} as const

/** Ngân sách thật cho phần chữa, sau khi trừ hao phí. Giây. */
export function nganSachGiay(ch: CauHinhLenBang): number {
  return Math.max(0, ch.NGAN_SACH_PHUT * 60 - haoPhiGiay(ch))
}

/** So bậc hai lane. `>= 0` nghĩa là a không thấp hơn b. */
export function soBacLane(a: Lane, b: Lane): number {
  return LANE.indexOf(a) - LANE.indexOf(b)
}

/** z của khoảng Wilson hai phía. Chỉ ba mức hay dùng — cấm nội suy bừa. */
export function zWilson(doTin: number): number {
  if (doTin >= 0.99) return 2.5758
  if (doTin >= 0.95) return 1.96
  return 1.6449
}

/** CẬN DƯỚI WILSON của tỉ lệ đúng.
 *
 * Vì sao không dùng tỉ lệ thô: 3/8 đúng và 30/80 đúng cùng ra 0,375, nhưng cái
 * đầu chỉ chắc tới 0,17. Lấy cận dưới thì câu ít lượt TỰ ĐỘNG bị dè chừng, khỏi
 * cần ngưỡng cứng "≥ 30 lượt" — thứ hôm nay chỉ đúng cho 1/814 câu.
 *
 * `n = 0` trả 0: không có dữ liệu thì không được coi là câu dễ. */
export function canDuoiWilson(soDung: number, soLuot: number, doTin: number): number {
  if (soLuot <= 0) return 0
  const z = zWilson(doTin)
  const p = soDung / soLuot
  const z2 = z * z
  const mau = 1 + z2 / soLuot
  const tam = p + z2 / (2 * soLuot)
  const bienDo = z * Math.sqrt((p * (1 - p)) / soLuot + z2 / (4 * soLuot * soLuot))
  return Math.max(0, Math.min(1, (tam - bienDo) / mau))
}

/** Giây → "mm:ss" tính từ đầu buổi, cho cột đồng hồ của giáo án. */
export function dongHo(giay: number): string {
  const g = Math.max(0, Math.round(giay))
  const p = Math.floor(g / 60)
  return `${String(Math.floor(p / 60)).padStart(2, '0')}:${String(p % 60).padStart(2, '0')}`
}
