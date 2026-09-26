// ĐOÀN HỘ TỐNG — lõi thuần của lối chơi hợp tác (DE-XUAT-HO-TONG-LINH-TAM-1909.md, mục 7).
//
// KHÔNG React, KHÔNG đọc đồng hồ, KHÔNG Math.random: mọi thứ "ngẫu nhiên" rút từ hạt giống của chặng
// qua hashSeed/mulberry32 → cùng hạt giống + cùng đầu vào = cùng diễn biến (máy chủ và máy em tính ra y hệt).
//
// Lõi KHÔNG biết câu hỏi, đáp án, cấp thần thú hay độ khó của câu: nó chỉ nhận "đúng / sai" do máy chủ
// đã chấm. Vì vậy không có đường nào để cấp hay độ khó lọt vào sát thương — em yếu làm đúng câu vừa sức
// gây sát thương NGANG em giỏi (mọi câu trong chặng đều do máy chủ chọn vừa sức từ hồ sơ của chính em).
//
// Một chặng = 8 hiệp. Hiệp 1–3 và 5–7 là hiệp thường (mỗi em một câu riêng, 40 giây, làm ĐỒNG THỜI, rồi
// cả đội ra đòn cùng lúc). Hiệp 4 và 8 là TRÙM: cả đội chung một câu Phần II, mỗi ghế giữ một số ý.
import { hashSeed, mulberry32 } from '../../lib/exam-shuffle'
import { giayGocCuaCau } from '../../lib/giay-co-so'
import { BATTLE_SKINS } from './learning-battle'

// ───────────────────────── Hằng số luật chơi (đổi một chỗ) ─────────────────────────
export const SO_HIEP = 8
export const HIEP_TRUM: readonly number[] = [4, 8]
export const GIAY_MOI_HIEP = 40
/** Hiệp trùm cho thêm giờ để các em ngồi cạnh nhau kịp bàn bạc. */
export const GIAY_HIEP_TRUM = 60
export const SO_GHE_TOI_THIEU = 2
export const SO_GHE_TOI_DA = 4

// Công thức sát thương đã chốt: nền 16 × (đúng ? 1,5 : 0) × (Liên Kích ? 2 : 1) × (kỹ năng ấn thạch ? 1,25 : 1), làm tròn.
export const SAT_THUONG_NEN = 16
export const HE_DUNG = 1.5
export const HE_LIEN_KICH = 2
export const HE_AN_THACH = 1.25

/** Một đòn đúng (24) hạ đúng một quái: em làm đúng một câu là nhìn thấy ngay một Tạp Chất gục. */
export const HP_QUAI = 24
/** Mỗi quái còn sống cuối hiệp đánh Linh Tâm từng này. */
export const CONG_QUAI = 4
export const QUAI_TOI_DA = 8
// KHÔNG AI SUY RA ĐƯỢC BẠN SAI: khiên của Chắn bằng nhau dù em đúng hay sai, và đòn của em SAI tự chuyển thành Chắn ("sai vẫn được Chắn").
// Nhờ vậy một bạn đã chốt mà trên sân chỉ thấy "chắn 8" thì có thể là: đúng và chủ động chắn, hoặc sai — không phân biệt được.
// Phần thưởng cho việc làm ĐÚNG khi chắn là thứ chỉ mình em thấy: +2 năng lượng thay vì +1.
export const CHAN = 8
export const NL_TOI_DA = 3
export const NL_KY_NANG = 2
export const NL_CHAN_DUNG = 2
export const HIEU_UNG_LAN = 6
export const HIEU_UNG_CHAN = 12
export const HIEU_UNG_HOI = 10

export const SO_Y_TRUM = 4
/** Đúng từ 3/4 ý → vỡ giáp trùm. */
export const Y_VO_GIAP = 3
/** Không vỡ giáp: trùm đánh Linh Tâm theo số đoạn giáp còn lại. */
export const CONG_TRUM_MOI_GIAP = 8

/** Chống lạm dụng: xin tiếp sức là ×2 sát thương, nên mỗi chặng mỗi em chỉ được NHẬN từng này lần. */
export const NHAN_TIEP_SUC_TOI_DA = 2
export const TI_LE_MAY_DUNG = 0.75
/** Bạn máy chuyển sang Chắn khi Linh Tâm còn từ 40% trở xuống. */
const MAY_CHAN_KHI_HP_PHAN_TRAM = 40

/** Linh Tâm dày hơn khi đội đông hơn, vì số quái mỗi hiệp cũng tăng theo số ghế. 3 ghế = 100. */
export const hpLinhTamToiDa = (soGhe: number) => 40 + 20 * soGhe

export const QUAI = [
  { id: 'bun_acid', ten: 'Bùn Acid', chang: 'Vượt Đầm Bùn Acid' },
  { id: 'khoi_oxi_hoa', ten: 'Khói Oxi Hoá', chang: 'Xuyên Màn Khói Oxi Hoá' },
  { id: 'tinh_the_ket_tua', ten: 'Tinh Thể Kết Tủa', chang: 'Băng Qua Bãi Kết Tủa' },
] as const
export const TRUM = [
  { id: 'chua_te_ket_tua', ten: 'Chúa tể Kết Tủa' },
  { id: 'ba_chu_an_mon', ten: 'Bá chủ Ăn Mòn' },
  { id: 'lanh_chua_khoi_doc', ten: 'Lãnh chúa Khói Độc' },
] as const

export type NhomKyNang = 'cong' | 'thu' | 'hoi'
// Kỹ năng KHÔNG tăng chỉ số thô: sát thương chính vẫn theo đúng công thức, mỗi nhóm chỉ thêm một lựa chọn
// chiến thuật (đòn lan khi quái tồn nhiều / khiên cho Linh Tâm / hồi máu Linh Tâm).
const NHOM: readonly NhomKyNang[] = ['thu', 'hoi', 'cong', 'cong', 'thu', 'hoi', 'hoi', 'cong']
// Tên kỹ năng viết lại cho lối chơi mới (tên cũ tả bàn cờ ô: "đẩy lùi", "vượt cầu"… không còn đúng nghĩa).
const KY_NANG = ['Địa Tinh Thuẫn', 'Dòng Nước Tiếp Sức', 'Liệt Diễm', 'Phong Bộ', 'Tinh Quang Liên Kết', 'Ái Tâm Hồi Phục', 'Vườn Ân Lộc', 'Minh Quang']
/** Biến thể mở ra khi ẤN THẠCH của dạng bài đã sáng (em khắc phục xong dạng ấy theo hồ sơ thật). */
const KY_NANG_AN = ['Địa Tinh Trấn Sơn', 'Băng Long Trảo', 'Liệt Diễm Xuyên Giáp', 'Phong Bộ Cuồng Lốc', 'Tinh Quang Thiên Võng', 'Ái Tâm Trường Xuân', 'Ân Lộc Mãn Khai', 'Minh Quang Phá Ám']
/** Tên đòn + nhóm kỹ năng của 8 thần thú (tên chưởng dùng lại của màn luyện tập). */
export const CHIEU = BATTLE_SKINS.map((s, i) => ({ chuong: s.move as string, kyNang: KY_NANG[i]!, kyNangAn: KY_NANG_AN[i]!, nhom: NHOM[i]! }))

// ───────────────────────── Kiểu dữ liệu (đều là JSON thuần, lưu thẳng vào phòng) ─────────────────────────
export type HanhDong = 'danh' | 'chan' | 'ky_nang'
/** Ghế KHÔNG có cấp thần thú: cấp không cho chỉ số trong trận (giữ luật cũ). */
export interface GheDoan { id: string; ten: string; pet: number; laMay: boolean; roi: boolean; nangLuong: number; daNhanTiepSuc: number }
export interface Quai { ma: number; loai: string; hp: number }
export interface Chang {
  kind: 'doan'; hatGiong: string; tenChang: string
  hiep: number; ketThuc: boolean; thang: boolean | null
  ghe: GheDoan[]; linhTam: { hp: number; toiDa: number }
  quai: Quai[]; maQuaiKe: number
  /** Chỉ có nghĩa ở hiệp trùm: giaoY[j] = ghế giữ ý thứ j. */
  giaoY: number[]
  trumVoGiap: boolean[]
  lichSu: KetQuaHiep[]
}
export interface NguoiVaoChang { id: string; ten?: string; pet: number }
/** Một em chốt hiệp thường. `dung` do MÁY CHỦ chấm; `anThach` = câu thuộc dạng em đã khắc phục xong (máy chủ đọc hồ sơ). */
export interface NopHiep { ghe: number; dung: boolean; hanhDong: HanhDong; anThach?: boolean; tiepSucBoi?: number }
export interface NopTrum { ghe: number; y: number; dung: boolean }
export interface DauVaoHiep { nop?: NopHiep[]; trum?: NopTrum[] }
export interface HeSoDon { dung: number; lienKich: number; anThach: number }
export interface KetQuaGhe {
  ghe: number; nop: boolean; dung: boolean
  /** false = có nhận thẻ tiếp sức → máy chủ KHÔNG ghi bằng chứng học cho câu này. */
  tuLam: boolean
  hanhDong: HanhDong | null; tenChieu: string
  satThuong: number; heSo: HeSoDon; lienKich: boolean
  chan: number; hoi: number; lan: number; haGuc: number
  /** `giup` = ghế em đã đưa thẻ tiếp sức (dù bạn làm lại đúng hay chưa); `giupThanhCong` = bạn làm lại đúng → Liên Kích nổ. */
  giup: number | null; giupThanhCong: boolean; duocGiupBoi: number | null
  nangLuongSau: number
  /** Hiệp trùm: các ý ghế này giữ và kết quả từng ý (riêng tư — không gửi cho bạn khác). */
  yGiu: number[]; yDung: number[]
}
export interface KetQuaHiep {
  hiep: number; laTrum: boolean; ghe: KetQuaGhe[]
  tongSatThuong: number; tongChan: number; quaiHaGuc: number; quaiConLai: number
  linhTamMat: number; linhTamHoi: number; linhTamSau: number
  trum: { loai: string; yDung: number; voGiap: boolean; giapConLai: number } | null
}

// ───────────────────────── Hàm nhỏ ─────────────────────────
export const hiepLaTrum = (hiep: number) => HIEP_TRUM.includes(hiep)

/** THỜI GIAN ĐỌC THÊM của một câu — M6 (23/09/2026), CÙNG CÔNG THỨC với tờ chiếu M1
 *  (`src/lib/thoi-gian-len-bang.ts`: T_đọc = 8 + 0,35 × sốTừ + 10 nếu có hình/bảng).
 *
 *  VÌ SAO CÓ: hạn của hiệp trước đây CHỈ theo (phần, bậc) — câu Phần II dài 90 từ có bảng
 *  ảnh được đúng hạn bằng câu Phần I ba dòng cùng bậc. Em đọc chưa xong đề đã hết giờ, và
 *  đó là "phần thưởng/phạt" không do năng lực Hoá của em.
 *
 *  KẸP 0..60 s và LÀM TRÒN 5 s cho đồng hồ dễ đọc. Trả 0 khi KHÔNG có số đo độ dài (lõi thuần
 *  gọi không kèm văn bản, test cũ, dữ liệu cũ) — nhờ vậy mọi hạn đang chạy KHÔNG đổi giá trị. */
export const GIAY_DOC_NEN = 8
export const GIAY_MOI_TU = 0.35
export const GIAY_CO_HINH = 10
export const GIAY_DOC_TOI_DA = 60
export function giayDocThem(q: { soTu?: number | null; coHinh?: boolean | null }): number {
  const tu = typeof q.soTu === 'number' && Number.isFinite(q.soTu) && q.soTu > 0 ? q.soTu : 0
  const hinh = q.coHinh === true
  if (tu === 0 && !hinh) return 0
  const g = GIAY_DOC_NEN + GIAY_MOI_TU * tu + (hinh ? GIAY_CO_HINH : 0)
  return Math.max(0, Math.min(GIAY_DOC_TOI_DA, Math.round(g / 5) * 5))
}

/** HẠN MỀM MỘT CÂU cho một em — 02 §8: `ceil(1,25 × solveSeconds)`, TỐI THIỂU 60 giây.
 *  KHÔNG chặn cứng ở 180 giây: câu dài/nhiều bảng hình được giãn theo đúng công thức, và nơi gọi có dữ liệu
 *  tốc độ riêng của em thì truyền `solveSeconds` đã đo để hạn mềm bám theo em đó.
 *  `solveSeconds` vắng ⇒ lấy giây gốc (phần × mức) + THỜI GIAN ĐỌC (M6). */
export function hanMemMotCau(
  cau: { phan?: string; mucDo?: string | null; soTu?: number | null; coHinh?: boolean | null; solveSeconds?: number | null } = {},
): number {
  const do_ = typeof cau.solveSeconds === 'number' && Number.isFinite(cau.solveSeconds) && cau.solveSeconds > 0
    ? cau.solveSeconds
    : giayGocCuaCau(cau.phan, cau.mucDo) + giayDocThem(cau)
  return Math.max(60, Math.ceil(do_ * 1.25))
}

/** TRẦN ĐỒNG HỒ ĐỘI: tối đa 300 giây một hiệp (02 §8) — task cần lâu hơn thì giao vai cá nhân dài, hoàn tất sau hiệp. */
export const TRAN_GIAY_HIEP = 300

/** Hạn của cả đội lấy câu cần nhiều thời gian nhất, để mọi ghế có cùng một đồng hồ:
 *  `min(300, max(hạn mềm một câu của các nhiệm vụ đang mở))` (02 §8). */
export const giayCuaHiep = (hiep: number, cau?: readonly { phan?: string; mucDo?: string | null; soTu?: number | null; coHinh?: boolean | null; solveSeconds?: number | null }[]) => {
  // Không có câu (dữ liệu cũ / lõi thuần gọi trần) ⇒ giữ hằng số cũ, KHÔNG rơi vào `Math.max()` rỗng.
  if (!cau || cau.length === 0) return hiepLaTrum(hiep) ? GIAY_HIEP_TRUM : GIAY_MOI_HIEP
  const lonNhat = Math.max(...cau.map((q) => hanMemMotCau(q)))
  if (!Number.isFinite(lonNhat)) return hiepLaTrum(hiep) ? GIAY_HIEP_TRUM : GIAY_MOI_HIEP
  return Math.min(TRAN_GIAY_HIEP, lonNhat)
}
// ───────── `02` §8 (CNH-1.0): HẠN MỀM THEO DỰ BÁO CÁ NHÂN + ĐỒNG HỒ ĐỘI THEO TASK ĐANG MỞ ─────────
//
// §8 nguyên văn: *"Bình thường dùng hạn mềm = ceil(1,25 × solveSeconds), tối thiểu 60 giây; KHÔNG
// chặn cứng ở 180 giây nếu dự báo cá nhân cần lâu hơn. … Đồng hồ đội dùng max soft time của các
// nhiệm vụ ĐANG MỞ, tối đa 300 giây/hiệp."*
//
// ⚠️ CỜ MẶC ĐỊNH TẮT: `giayCuaHiep` ở trên (kẹp 60..180, theo CÂU) vẫn là đường ĐANG CHẠY. Ba hàm
// dưới đây là đường MỚI (theo `solveSeconds` §5.1 + danh sách task ĐANG MỞ); chỉ bật khi Boss quyết,
// vì đổi chúng là đổi NHỊP GAME ĐANG SỐNG. Gọi đến chúng là việc của nơi nối (cùng lúc với mô hình
// vòng đời task `TaskDoan`).
export const DUNG_DONG_HO_MEM_THEO_8 = false
/** Hạn mềm tối thiểu 60 giây (§8). */
export const GIAY_MEM_TOI_THIEU = 60
/** Trần đồng hồ đội 300 giây/hiệp (§8). */
export const GIAY_DONG_HOI_TOI_DA = 300

/** HẠN MỀM một task = `max(60, ceil(1,25 × solveSeconds))` (§8). KHÔNG kẹp ở 180. */
export const giayMemMotTask = (solve: number): number => {
  if (!Number.isFinite(solve) || solve < 0) throw new Error(`solveSeconds phải >= 0, nhận ${String(solve)}`)
  return Math.max(GIAY_MEM_TOI_THIEU, Math.ceil(1.25 * solve))
}

/** ĐỒNG HỒ ĐỘI = `min(300, max(hạn mềm của các task ĐANG MỞ))`; không có task mở ⇒ `0` (§8). */
export const giayDongHoiMoCua = (giayMemCacTaskMo: readonly number[]): number =>
  giayMemCacTaskMo.length === 0 ? 0 : Math.min(GIAY_DONG_HOI_TOI_DA, Math.max(...giayMemCacTaskMo))

/**
 * CHỌN ĐƯỜNG THEO CỜ — nơi nối gọi hàm này thay cho việc tự rẽ nhánh:
 *   * Cờ TẮT (mặc định) ⇒ `giayCuaHiep(hiep, cau)` — NGUYÊN nhịp cũ.
 *   * Cờ BẬT **và** có danh sách hạn mềm của task đang mở ⇒ §8: `min(300, max(hạn mềm))`.
 *   * Cờ BẬT nhưng danh sách RỖNG (chưa có mô hình task đang mở) ⇒ **quay về nhịp CŨ**, KHÔNG trả `0`
 *     (§8 không cho phép hết giờ tức thì; trả 0 sẽ làm mọi hiệp hết giờ ngay — đó là lý do cờ còn TẮT).
 */
export const giayHiepTheoCo = (
  hiep: number,
  cau: readonly { phan?: string; mucDo?: string | null; soTu?: number | null; coHinh?: boolean | null }[] | undefined,
  giayMemCacTaskMo: readonly number[],
  /** Cờ — mặc định hằng số trên; tham số hoá để TEST được cả hai đường (cờ BẬT vẫn không bật trên thật). */
  co: boolean = DUNG_DONG_HO_MEM_THEO_8,
): number => (co && giayMemCacTaskMo.length > 0 ? giayDongHoiMoCua(giayMemCacTaskMo) : giayCuaHiep(hiep, cau))

/**
 * Đồng hồ do nơi gọi đưa vào (mili giây) — lõi không tự đọc giờ.
 * `cau` và `giayMemCacTaskMo` là TUỲ CHỌN: chỉ có tác dụng khi cờ §8 BẬT **và** có task đang mở
 * (xem `giayHiepTheoCo`). Không truyền gì ⇒ NGUYÊN hành vi cũ (nhịp theo CÂU).
 */
export const hetGioHiep = (
  batDauLuc: number,
  bayGio: number,
  hiep: number,
  cau?: readonly { phan?: string; mucDo?: string | null; soTu?: number | null; coHinh?: boolean | null }[],
  giayMemCacTaskMo: readonly number[] = [],
) => bayGio - batDauLuc >= giayHiepTheoCo(hiep, cau, giayMemCacTaskMo) * 1000

// ───────────────────── VÒNG ĐỜI TASK CÁ NHÂN (02 §8) ─────────────────────
// `phat` → (chốt) `da_nop` · (hiệp chuyển khi chưa chốt) `continuing` → (quá hạn session) `expired_unanswered`.
// Task `continuing` VẪN NỘP ĐƯỢC tới hạn session; hết hạn thì KHÔNG tính là sai (không cập nhật lỗi học thuật) và
// KHÔNG phát lại cùng câu — mở lại phải là một attempt MỚI do máy chủ kiểm phạm vi.
export type TrangThaiTask = 'phat' | 'da_nop' | 'continuing' | 'expired_unanswered'
export interface TaskDoan {
  tt: TrangThaiTask
  /** Lúc MÁY CHỦ phát câu (ms) — mốc tính hạn session. */
  phatLuc: number
  /** Hạn session = `phatLuc + 24 giờ` (§8). */
  hanSession: number
  qid: string | null
  /** Lúc em nộp task (audit cho thầy) — chỉ có ở task `da_nop`. */
  lucNop?: number
  /** Lúc mở lại bằng câu mới (audit) — chỉ có ở task được mở lại. */
  lucMoLai?: number
  /** Phiên game MỚI cấp câu mở lại (khi bộ của chặng đã hết) — em làm ở phiên này, không phát lại câu cũ. */
  phien?: string
}
/** Hạn session của một task: 24 giờ từ lúc phát (§8). */
export const HAN_SESSION_MS = 24 * 60 * 60 * 1000
export const khoaTask = (ghe: number, hiep: number) => `${ghe}|${hiep}`

export function moTask(ghe: number, hiep: number, qid: string | null, now: number): TaskDoan {
  void ghe
  void hiep
  return { tt: 'phat', phatLuc: now, hanSession: now + HAN_SESSION_MS, qid }
}

/** Em chốt đòn của mình. Task đã hết hạn/hỏng thì giữ nguyên (không hồi sinh bằng đường nộp). */
export const chotTask = (t: TaskDoan): TaskDoan => (t.tt === 'phat' || t.tt === 'continuing' ? { ...t, tt: 'da_nop' } : t)

/** HIỆP CHUYỂN: task chưa chốt ⇒ `continuing` (vẫn nộp được tới hạn session) — KHÔNG ghi thành sai. */
export const chuyenHiepTask = (t: TaskDoan): TaskDoan => (t.tt === 'phat' ? { ...t, tt: 'continuing' } : t)

/** Quét hạn session: quá hạn mà chưa nộp ⇒ `expired_unanswered` (không cập nhật lỗi học thuật). */
export const hetHanTask = (t: TaskDoan, now: number): TaskDoan =>
  (t.tt === 'phat' || t.tt === 'continuing') && now >= t.hanSession ? { ...t, tt: 'expired_unanswered' } : t

/** Còn nộp được không: chỉ khi chưa chốt VÀ chưa quá hạn session. */
export const conNopDuoc = (t: TaskDoan | undefined, now: number): boolean =>
  !!t && (t.tt === 'phat' || t.tt === 'continuing') && now < t.hanSession

/**
 * MỞ LẠI task đã `expired_unanswered`: chỉ khi có CÂU MỚI do máy chủ kiểm phạm vi cấp (`qidMoi` khác câu cũ).
 * Trả `null` khi không có câu mới ⇒ vẫn hết hạn (KHÔNG phát lại cùng câu).
 */
export function moLaiTask(t: TaskDoan, qidMoi: string | null, now: number): TaskDoan | null {
  if (t.tt !== 'expired_unanswered') return null
  if (!qidMoi || qidMoi === t.qid) return null
  return moTask(0, 0, qidMoi, now)
}
const rut = (hatGiong: string, nhan: string) => mulberry32(hashSeed(`${hatGiong}|${nhan}`))()
const saoChep = <T>(x: T): T => JSON.parse(JSON.stringify(x))
const gheDoMay = (g: GheDoan) => g.laMay || g.roi

/** CÔNG THỨC SÁT THƯƠNG đã chốt. Sai / bỏ trống = 0. */
export function satThuongDon(d: { dung: boolean; lienKich?: boolean; anThach?: boolean }): number {
  return Math.round(SAT_THUONG_NEN * (d.dung ? HE_DUNG : 0) * (d.lienKich ? HE_LIEN_KICH : 1) * (d.anThach ? HE_AN_THACH : 1))
}

/** Thứ tự loại quái hai đoạn đường + hai trùm của chặng, rút từ hạt giống. */
export function kichBanChang(hatGiong: string) {
  const q = Math.floor(rut(hatGiong, 'quai') * QUAI.length), t = Math.floor(rut(hatGiong, 'trum') * TRUM.length)
  return { quai: [QUAI[q]!, QUAI[(q + 1) % QUAI.length]!], trum: [TRUM[t]!, TRUM[(t + 1) % TRUM.length]!] }
}
/** Chia 4 ý cho các ghế theo vòng tròn, ghế bắt đầu rút từ hạt giống. Máy chủ có thể giao lại theo bậc bằng `datGiaoY`. */
export function chiaY(hatGiong: string, hiep: number, soGhe: number): number[] {
  const dau = Math.floor(rut(hatGiong, `y|${hiep}`) * soGhe)
  return Array.from({ length: SO_Y_TRUM }, (_, j) => (dau + j) % soGhe)
}

// ───────────────────────── Mở chặng ─────────────────────────
function sinhQuai(c: Chang) {
  const loai = kichBanChang(c.hatGiong).quai[c.hiep < HIEP_TRUM[0]! ? 0 : 1]!.id
  for (let i = 0; i < c.ghe.length && c.quai.length < QUAI_TOI_DA; i++) c.quai.push({ ma: c.maQuaiKe++, loai, hp: HP_QUAI })
}
function vaoHiep(c: Chang) {
  if (hiepLaTrum(c.hiep)) c.giaoY = chiaY(c.hatGiong, c.hiep, c.ghe.length)
  else { c.giaoY = []; sinhQuai(c) }
}
/** 1–4 em thật. Đi một mình → thêm MỘT bạn đồng hành do máy điều khiển (tất định), để luôn có "đội". */
export function moChang(cfg: { hatGiong: string; nguoi: NguoiVaoChang[] }): Chang {
  const { hatGiong, nguoi } = cfg
  if (!hatGiong) throw new Error('Thiếu hạt giống của chuyến.')
  if (nguoi.length < 1 || nguoi.length > SO_GHE_TOI_DA) throw new Error('Một chuyến có từ 1 đến 4 bạn.')
  if (new Set(nguoi.map(n => n.id)).size !== nguoi.length) throw new Error('Một bạn không thể ngồi hai ghế.')
  const petHopLe = (p: number) => Number.isInteger(p) && p >= 0 && p < CHIEU.length
  if (!nguoi.every(n => petHopLe(n.pet))) throw new Error('Thần thú không hợp lệ.')
  const ghe: GheDoan[] = nguoi.map(n => ({ id: n.id, ten: n.ten || BATTLE_SKINS[n.pet]!.name, pet: n.pet, laMay: false, roi: false, nangLuong: 0, daNhanTiepSuc: 0 }))
  for (let k = 1; ghe.length < SO_GHE_TOI_THIEU; k++) {
    // Bạn máy dắt một thần thú KHÁC của em để hai tia chiêu thức không trùng màu.
    const pet = (nguoi[0]!.pet + 1 + Math.floor(rut(hatGiong, `pet-may|${k}`) * (CHIEU.length - 1))) % CHIEU.length
    ghe.push({ id: `may:${k}`, ten: 'Bạn máy', pet, laMay: true, roi: false, nangLuong: 0, daNhanTiepSuc: 0 })
  }
  const toiDa = hpLinhTamToiDa(ghe.length)
  const c: Chang = { kind: 'doan', hatGiong, tenChang: kichBanChang(hatGiong).quai[0]!.chang, hiep: 1, ketThuc: false, thang: null, ghe, linhTam: { hp: toiDa, toiDa }, quai: [], maQuaiKe: 1, giaoY: [], trumVoGiap: [], lichSu: [] }
  vaoHiep(c)
  return c
}
/** Rời trận giữa chừng → bạn máy đỡ thay từ hiệp này, đội không bị phạt. */
export function roiTran(chang: Chang, id: string): Chang {
  const c = saoChep(chang), g = c.ghe.find(x => x.id === id)
  if (g) g.roi = true
  return c
}
/** Máy chủ giao lại ý trùm cho hợp bậc từng em. Mỗi ý phải có đúng một ghế giữ. */
export function datGiaoY(chang: Chang, giaoY: number[]): Chang {
  if (chang.ketThuc || !hiepLaTrum(chang.hiep)) throw new Error('Chỉ giao ý ở hiệp trùm.')
  if (giaoY.length !== SO_Y_TRUM || !giaoY.every(g => Number.isInteger(g) && g >= 0 && g < chang.ghe.length)) throw new Error('Mỗi ý của câu chung phải có một bạn giữ.')
  return { ...saoChep(chang), giaoY: [...giaoY] }
}

// ───────────────────────── Kiểm lệnh (máy chủ gọi lúc em bấm; lời báo in thẳng cho em) ─────────────────────────
export function kiemHanhDong(c: Chang, ghe: number, hanhDong: HanhDong) {
  const g = c.ghe[ghe]
  if (c.ketThuc) throw new Error('Chuyến đã kết thúc.')
  if (!g) throw new Error('Em không có ghế trong chuyến này.')
  if (hiepLaTrum(c.hiep)) throw new Error('Hiệp trùm không chọn đòn — cả đội cùng giải câu chung.')
  if (!['danh', 'chan', 'ky_nang'].includes(hanhDong)) throw new Error('Chọn Đánh, Chắn hoặc Kỹ năng.')
  if (hanhDong === 'ky_nang' && g.nangLuong < NL_KY_NANG) throw new Error(`Kỹ năng cần ${NL_KY_NANG} năng lượng — mỗi câu đúng cho em 1 năng lượng.`)
}
/** `daGiup` = các ghế đã tiếp sức ai đó trong hiệp này (máy chủ giữ). */
export function kiemTiepSuc(c: Chang, tu: number, den: number, daGiup: number[] = []) {
  const a = c.ghe[tu], b = c.ghe[den]
  if (c.ketThuc) throw new Error('Chuyến đã kết thúc.')
  if (hiepLaTrum(c.hiep)) throw new Error('Hiệp trùm cả đội bàn chung, không dùng thẻ tiếp sức.')
  if (!a || !b || tu === den) throw new Error('Chọn một bạn khác trong đội để tiếp sức.')
  if (gheDoMay(b)) throw new Error('Bạn này đang được máy đỡ thay, không cần tiếp sức.')
  if (daGiup.includes(tu)) throw new Error('Mỗi hiệp em tiếp sức được một bạn.')
  if (b.daNhanTiepSuc >= NHAN_TIEP_SUC_TOI_DA) throw new Error(`Mỗi chuyến một bạn nhận tối đa ${NHAN_TIEP_SUC_TOI_DA} lần tiếp sức — bạn ấy sẽ tự làm câu này.`)
}

// ───────────────────────── Bạn máy (tất định; không bao giờ tạo bằng chứng học) ─────────────────────────
export function banMayNop(c: Chang, ghe: number): NopHiep {
  const g = c.ghe[ghe]!
  const dung = rut(c.hatGiong, `may|${c.hiep}|${ghe}`) < TI_LE_MAY_DUNG
  const nguy = c.quai.length > 0 && c.linhTam.hp * 100 <= c.linhTam.toiDa * MAY_CHAN_KHI_HP_PHAN_TRAM
  return { ghe, dung, hanhDong: nguy ? 'chan' : g.nangLuong >= NL_KY_NANG ? 'ky_nang' : 'danh' }
}
export const banMayDungY = (c: Chang, y: number) => rut(c.hatGiong, `may-y|${c.hiep}|${y}`) < TI_LE_MAY_DUNG

// ───────────────────────── Giải một hiệp ─────────────────────────
const kqTrong = (ghe: number, g: GheDoan): KetQuaGhe => ({ ghe, nop: false, dung: false, tuLam: true, hanhDong: null, tenChieu: '', satThuong: 0, heSo: { dung: 0, lienKich: 1, anThach: 1 }, lienKich: false, chan: 0, hoi: 0, lan: 0, haGuc: 0, giup: null, giupThanhCong: false, duocGiupBoi: null, nangLuongSau: g.nangLuong, yGiu: [], yDung: [] })

function giaiHiepThuong(c: Chang, nopVao: NopHiep[]): KetQuaHiep {
  // Ghế máy (hoặc đã rời) do lõi tự đánh và được xếp vào TRƯỚC, nên bài ai đó gửi hộ ghế máy tự bị bỏ qua;
  // ghế người lấy lần chốt ĐẦU TIÊN (chốt rồi không đổi).
  const nop = new Map<number, NopHiep>()
  c.ghe.forEach((g, i) => { if (gheDoMay(g)) nop.set(i, banMayNop(c, i)) })
  for (const n of nopVao) if (c.ghe[n.ghe] && !nop.has(n.ghe)) nop.set(n.ghe, n)

  // Liên Kích: bạn được tiếp sức làm lại ĐÚNG → cả người giúp và người được giúp ×2.
  const lienKich = new Set<number>(), daGiup = new Set<number>()
  const kq = c.ghe.map((g, i) => kqTrong(i, g))
  for (const [i, n] of [...nop].sort((a, b) => a[0] - b[0])) {
    if (n.tiepSucBoi === undefined) continue
    kq[i]!.tuLam = false // đã nhận thẻ thì dù nối có hợp lệ hay không cũng không tính là tự làm
    try { kiemTiepSuc(c, n.tiepSucBoi, i, [...daGiup]) } catch { continue }
    daGiup.add(n.tiepSucBoi); c.ghe[i]!.daNhanTiepSuc++
    kq[i]!.duocGiupBoi = n.tiepSucBoi; kq[n.tiepSucBoi]!.giup = i
    if (n.dung) { lienKich.add(i); lienKich.add(n.tiepSucBoi); kq[n.tiepSucBoi]!.giupThanhCong = true }
  }

  let tongChan = 0, linhTamHoi = 0, quaiHaGuc = 0
  const lan: number[] = []
  for (const [i, n] of [...nop].sort((a, b) => a[0] - b[0])) {
    const g = c.ghe[i]!, r = kq[i]!, lk = lienKich.has(i)
    // Sai / bỏ trống → đòn tự chuyển thành Chắn (kỹ năng không bị trừ năng lượng). Thiếu năng lượng mà vẫn gửi "kỹ năng"
    // (máy chủ lẽ ra đã chặn) → coi như Đánh, không làm hỏng phòng.
    const hanhDong: HanhDong = !n.dung || n.hanhDong === 'chan' ? 'chan' : n.hanhDong === 'ky_nang' && g.nangLuong >= NL_KY_NANG ? 'ky_nang' : 'danh'
    const chieu = CHIEU[g.pet]!, an = hanhDong === 'ky_nang' && !!n.anThach
    Object.assign(r, { nop: true, dung: n.dung, hanhDong, lienKich: lk && n.dung })
    r.tenChieu = hanhDong === 'chan' ? 'Chắn' : hanhDong === 'danh' ? chieu.chuong : an ? chieu.kyNangAn : chieu.kyNang
    if (hanhDong === 'chan') r.chan = CHAN * (lk && n.dung ? HE_LIEN_KICH : 1)
    else {
      r.satThuong = satThuongDon({ dung: n.dung, lienKich: lk, anThach: an })
      r.heSo = { dung: n.dung ? HE_DUNG : 0, lienKich: lk && n.dung ? HE_LIEN_KICH : 1, anThach: an && n.dung ? HE_AN_THACH : 1 }
    }
    if (hanhDong === 'ky_nang' && n.dung) {
      g.nangLuong -= NL_KY_NANG
      if (chieu.nhom === 'thu') r.chan += HIEU_UNG_CHAN
      if (chieu.nhom === 'hoi') r.hoi = HIEU_UNG_HOI
      if (chieu.nhom === 'cong') lan.push(i)
    }
    if (n.dung) g.nangLuong = Math.min(NL_TOI_DA, g.nangLuong + (hanhDong === 'chan' ? NL_CHAN_DUNG : 1))
    tongChan += r.chan; linhTamHoi += r.hoi
  }
  // Người tiếp sức thành công được thêm 1 năng lượng: dạy bạn cũng là một cách nạp chiêu.
  for (const r of kq) if (r.giupThanhCong) c.ghe[r.ghe]!.nangLuong = Math.min(NL_TOI_DA, c.ghe[r.ghe]!.nangLuong + 1)

  // Cả đội ra đòn cùng lúc: sát thương đổ vào hàng quái từ con đứng đầu, dư thì tràn sang con kế.
  for (const r of kq) {
    let con = r.satThuong
    for (const q of c.quai) { if (con <= 0) break; if (q.hp <= 0) continue; const tru = Math.min(q.hp, con); q.hp -= tru; con -= tru; if (q.hp === 0) r.haGuc++ }
  }
  for (const i of lan) for (const q of c.quai) if (q.hp > 0) { const tru = Math.min(q.hp, HIEU_UNG_LAN); q.hp -= tru; kq[i]!.lan += tru; if (q.hp === 0) kq[i]!.haGuc++ }
  for (const r of kq) { quaiHaGuc += r.haGuc; r.nangLuongSau = c.ghe[r.ghe]!.nangLuong }
  c.quai = c.quai.filter(q => q.hp > 0)

  const linhTamMat = Math.max(0, c.quai.length * CONG_QUAI - tongChan)
  return { hiep: c.hiep, laTrum: false, ghe: kq, tongSatThuong: kq.reduce((s, r) => s + r.satThuong + r.lan, 0), tongChan, quaiHaGuc, quaiConLai: c.quai.length, linhTamMat, linhTamHoi, linhTamSau: 0, trum: null }
}

function giaiHiepTrum(c: Chang, nopVao: NopTrum[]): KetQuaHiep {
  const kq = c.ghe.map((g, i) => kqTrong(i, g))
  let yDung = 0
  c.giaoY.forEach((ghe, y) => {
    const g = c.ghe[ghe]!, r = kq[ghe]!
    // Chỉ ghế GIỮ ý mới trả lời được ý đó; lấy lần chốt đầu tiên. Ý không ai chốt = sai.
    const n = gheDoMay(g) ? { dung: banMayDungY(c, y) } : nopVao.find(x => x.y === y && x.ghe === ghe)
    r.yGiu.push(y)
    if (n) r.nop = true
    if (n?.dung) { r.yDung.push(y); yDung++ }
  })
  for (const r of kq) r.dung = r.yGiu.length > 0 && r.yDung.length === r.yGiu.length
  const voGiap = yDung >= Y_VO_GIAP, giapConLai = SO_Y_TRUM - yDung
  // Vỡ giáp: trùm gục, sóng xung kích quét sạch quái tồn, Linh Tâm không mất máu hiệp này.
  const quaiHaGuc = voGiap ? c.quai.length : 0
  if (voGiap) c.quai = []
  const linhTamMat = voGiap ? 0 : giapConLai * CONG_TRUM_MOI_GIAP + c.quai.length * CONG_QUAI
  c.trumVoGiap.push(voGiap)
  const loai = kichBanChang(c.hatGiong).trum[HIEP_TRUM.indexOf(c.hiep)]!.id
  return { hiep: c.hiep, laTrum: true, ghe: kq, tongSatThuong: 0, tongChan: 0, quaiHaGuc, quaiConLai: c.quai.length, linhTamMat, linhTamHoi: 0, linhTamSau: 0, trum: { loai, yDung, voGiap, giapConLai } }
}

/** Giải hiệp hiện tại rồi sang hiệp kế. Trả về trạng thái MỚI (không sửa đầu vào); kết quả hiệp nằm ở cuối `lichSu`. */
export function giaiHiep(chang: Chang, dauVao: DauVaoHiep = {}): Chang {
  if (chang.ketThuc) throw new Error('Chuyến đã kết thúc.')
  const c = saoChep(chang)
  const kq = hiepLaTrum(c.hiep) ? giaiHiepTrum(c, dauVao.trum ?? []) : giaiHiepThuong(c, dauVao.nop ?? [])
  // Hồi và mất tính GỘP: Linh Tâm chỉ vỡ khi máu sau cả hai vẫn ≤ 0.
  c.linhTam.hp = Math.max(0, Math.min(c.linhTam.toiDa, c.linhTam.hp - kq.linhTamMat + kq.linhTamHoi))
  kq.linhTamSau = c.linhTam.hp
  c.lichSu.push(kq)
  if (c.linhTam.hp <= 0) { c.ketThuc = true; c.thang = false }
  else if (c.hiep >= SO_HIEP) { c.ketThuc = true; c.thang = true }
  else { c.hiep++; vaoHiep(c) }
  return c
}

// ───────────────────────── Kết chặng ─────────────────────────
export interface TomTatGhe { ghe: number; id: string; laMay: boolean; soCau: number; soDung: number; soTuLamDung: number; satThuong: number; chan: number; haGuc: number; soLanGiup: number; soLanGiupThanhCong: number; soLanDuocGiup: number; soLienKich: number }
export interface TomTatChang { thang: boolean; sao: number; soHiepDaChoi: number; linhTam: { hp: number; toiDa: number }; trumVoGiap: boolean[]; quaiHaGuc: number; soLienKich: number; ghe: TomTatGhe[] }
/** Sao: về đích 1 · Linh Tâm còn từ nửa máu +1 · vỡ giáp CẢ HAI trùm +1. Thua = 0 sao, không mất gì. */
export function tomTatChang(c: Chang): TomTatChang {
  const thuong = c.lichSu.filter(h => !h.laTrum)
  const ghe = c.ghe.map((g, i): TomTatGhe => {
    const cua = thuong.map(h => h.ghe[i]!).filter(r => r.nop)
    return { ghe: i, id: g.id, laMay: g.laMay, soCau: cua.length, soDung: cua.filter(r => r.dung).length, soTuLamDung: cua.filter(r => r.dung && r.tuLam).length,
      satThuong: cua.reduce((s, r) => s + r.satThuong + r.lan, 0), chan: cua.reduce((s, r) => s + r.chan, 0), haGuc: cua.reduce((s, r) => s + r.haGuc, 0),
      soLanGiup: cua.filter(r => r.giup !== null).length, soLanGiupThanhCong: cua.filter(r => r.giupThanhCong).length, soLanDuocGiup: cua.filter(r => r.duocGiupBoi !== null).length, soLienKich: cua.filter(r => r.lienKich).length }
  })
  const thang = c.thang === true
  const sao = !thang ? 0 : 1 + (c.linhTam.hp * 2 >= c.linhTam.toiDa ? 1 : 0) + (c.trumVoGiap.length === HIEP_TRUM.length && c.trumVoGiap.every(Boolean) ? 1 : 0)
  return { thang, sao, soHiepDaChoi: c.lichSu.length, linhTam: { ...c.linhTam }, trumVoGiap: [...c.trumVoGiap], quaiHaGuc: c.lichSu.reduce((s, h) => s + h.quaiHaGuc, 0), soLienKich: ghe.reduce((s, g) => s + g.soLanGiupThanhCong, 0), ghe }
}

// ───────────────────────── EXP thưởng kết chặng (thầy chốt 21/09 · Điều 9, Đợt 2) ─────────────────────────
/** Thắng chặng: 1 · 2 · 3 sao ⇒ 5 · 10 · 15 EXP. Chặng thắng ĐẦU TIÊN trong ngày VN nhận đủ; các chặng sau nhận MỘT NỬA (làm tròn lên: 3 · 5 · 8). Thua = 0 sao = 0 EXP, không mất gì. */
export const THUONG_KET_CHANG = [5, 10, 15] as const
/** Cả đội làm vỡ giáp một trùm: +3 EXP cho TỪNG bạn trong đội, mỗi trùm một lần (tính cả khi chặng sau đó thua — vỡ giáp là việc đã làm được). */
export const THUONG_VO_GIAP = 3
export function thuongKetChang(sao: number, laChangThangDauNgay: boolean): number {
  const s = Number.isFinite(sao) ? Math.min(3, Math.floor(sao)) : 0
  if (s < 1) return 0
  const goc = THUONG_KET_CHANG[s - 1]!
  return laChangThangDauNgay ? goc : Math.ceil(goc / 2)
}
export const thuongVoGiap = (trumVoGiap: readonly boolean[]): number => THUONG_VO_GIAP * trumVoGiap.filter(Boolean).length
export interface KhoanKetChang { chang: number; voGiap: number; tong: number }
/** Các khoản EXP của MỘT em trong đội sau chặng (chưa qua trần 120/ngày của game — Code 3 kẹp bằng `tranExpGameNgay`). `sao` chỉ tính khi thắng. */
export function khoanKetChang(tt: Pick<TomTatChang, 'thang' | 'sao' | 'trumVoGiap'>, laChangThangDauNgay: boolean): KhoanKetChang {
  const chang = tt.thang ? thuongKetChang(tt.sao, laChangThangDauNgay) : 0
  const voGiap = thuongVoGiap(tt.trumVoGiap)
  return { chang, voGiap, tong: chang + voGiap }
}

// ───────────────────────── Khung nhìn gửi xuống máy từng em ─────────────────────────
/** Điều một em được thấy về BẠN sau hiệp: bạn ra đòn / chắn / giữ vị trí (= không chốt). Không có "sai", không có hệ số, không có ý trùm. */
export interface GheBanThay { ghe: number; ra: 'don' | 'chan' | 'giu'; tenChieu: string; satThuong: number; haGuc: number; lienKich: boolean }
export interface KhungNhinHiep extends Omit<KetQuaHiep, 'ghe'> { cuaEm: KetQuaGhe | null; ban: GheBanThay[] }
/** Không ai thấy bạn SAI gì: bạn đã chốt mà không ra đòn thì luôn hiện "chắn" với cùng một khiên — đúng-rồi-chắn và sai trông Y HỆT nhau. */
export function khungNhinHiep(kq: KetQuaHiep, gheXem: number): KhungNhinHiep {
  const { ghe, ...chung } = kq
  const ban = ghe.filter(r => r.ghe !== gheXem).map((r): GheBanThay => {
    const don = r.satThuong + r.lan > 0
    const ra = don ? 'don' : r.hanhDong === 'chan' ? 'chan' : 'giu'
    return { ghe: r.ghe, ra, tenChieu: don ? r.tenChieu : '', satThuong: r.satThuong + r.lan, haGuc: r.haGuc, lienKich: r.lienKich }
  })
  return { ...chung, cuaEm: ghe.find(r => r.ghe === gheXem) ?? null, ban }
}
