// LUẬT ĐÓNG LỖI CHUNG — Vòng học khép kín v2, Giai đoạn 3 (thầy 02/10: "đảm bảo tất cả các câu sai phải được xử lý triệt để và
// thông minh hiệu quả" + "chỉ tính từ 29/09 thôi nhé").
//
// MỘT luật cho MỌI kênh (ca thi, Đảo, Đoàn, Bi-a, ôn lại, Lên bảng, đầu giờ…), thay 5 định nghĩa "đã vững" cũ. Hàm THUẦN: nhận các lần làm
// của một em với một câu (đã gộp bản trùng và câu song sinh về câu gốc), trả trạng thái lỗi + ngày đến hạn. Không đọc D1, không ghi gì —
// nguồn duy nhất là sổ `su_kien_hoc` (phát lại mỗi lần đọc, giống srs2) nên không có bảng trạng thái nào lệch được với sổ.
//
// Định nghĩa (đặc tả v2, mục "Đóng lỗi và kiểm chứng"):
//   · Lượt TỰ LÀM: không hỗ trợ (assistance rỗng/none), không phải sự kiện đọc lời giải, và em KHÔNG đọc lời giải câu này trong 12 giờ trước.
//   · Lượt CÓ HỖ TRỢ: không tính đúng, cũng không tính sai.
//   · Bỏ trống (ket_qua NULL ở lượt tự làm có nộp) = sai.
//   · Mở lỗi: lượt tự làm sai/bỏ trống từ ngày VN `TU_NGAY`.
//   · Đóng lỗi: 2 lượt tự làm ĐÚNG ở 2 ngày VN khác nhau SAU lần sai cuối, ít nhất một lượt là câu song sinh (nếu câu có song sinh),
//     lượt cuối cách lần sai cuối ≥ 3 ngày.
//   · Duy trì: đã đóng ⇒ kiểm lại sau 14 rồi 30 ngày; sai ⇒ mở lại (bắt đầu từ bậc 2 của thang tự gỡ).

export const TU_NGAY = '2026-09-29'
export const GIO_DOC_LOI_GIAI_CAM = 12
export const CACH_SAI_CUOI_TOI_THIEU = 3
export const MOC_DUY_TRI = [14, 30] as const

/** Tham số luật — Giai đoạn 5 tự hiệu chỉnh hằng tuần theo tỉ lệ sai lại thực tế (tu-hoan-thien.ts, `cau_hinh` khoá 'v2_tham_so'). */
export interface ThamSoLuat { cachSaiCuoi: number; mocDuyTri: readonly number[]; gioDocLoiGiai: number }
export const THAM_SO_GOC: ThamSoLuat = { cachSaiCuoi: CACH_SAI_CUOI_TOI_THIEU, mocDuyTri: MOC_DUY_TRI, gioDocLoiGiai: GIO_DOC_LOI_GIAI_CAM }

/** Một lần em gặp câu (câu gốc hoặc song sinh của nó). `ketQua`: 1 đúng · 0 sai · null bỏ trống. */
export interface LanLamLoi {
  luc: string // ISO
  ngayVn: string // YYYY-MM-DD
  ketQua: 0 | 1 | null
  coHoTro: boolean // assistance khác none/rỗng, hoặc purpose không phải một lần làm (xem_loi_giai · luot — OMNI 3)
  songSinh: boolean // làm câu song sinh (qid "<gốc>~ss<i>") hoặc CÂU ANH EM (05/10: sổ ghi `raw_json.tc = <gốc>`) thay vì câu gốc
  nguon: string
}

export type TrangThaiLoi = 'mo' | 'cho_kiem' | 'dong' | 'duy_tri' | 'khong_loi'

export interface KetQuaLoi {
  trangThai: TrangThaiLoi
  /** Ngày VN lần sai (tự làm) cuối; rỗng nếu chưa từng sai từ TU_NGAY. */
  saiCuoi: string
  /** Số lần sai tự làm từ TU_NGAY. */
  soLanSai: number
  /** Các ngày VN đã đúng tự làm SAU lần sai cuối (không trùng ngày). */
  ngayDung: string[]
  daDungSongSinh: boolean
  /** Ngày VN đến hạn làm lại / kiểm lại; rỗng = không còn việc. */
  denHan: string
  /** Nên phục vụ câu song sinh ở lượt tới (để em không nhớ đáp án). */
  nenSongSinh: boolean
  /** Ngày đóng lỗi (ngày của lượt đúng thứ hai) — để tính mốc duy trì. */
  dongNgay: string
  /** Số mốc duy trì đã qua (0, 1, 2). */
  mocDuyTri: number
  /** Kênh của lần sai đầu tiên (để thầy biết lỗi đến từ đâu). */
  nguonSai: string
}

const MS_NGAY = 86_400_000
export function congNgayVn(ngay: string, n: number): string {
  const d = new Date(`${ngay}T00:00:00Z`)
  return new Date(d.getTime() + n * MS_NGAY).toISOString().slice(0, 10)
}
export function cachNgay(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / MS_NGAY)
}

/**
 * Phát lại một (em, câu). `docLoiGiaiLuc`: các mốc ISO em đọc lời giải câu này (Hỏi thầy / khung lời giải) — lượt làm trong 12 giờ sau
 * mốc đọc bị coi là có hỗ trợ. `coSongSinh`: kho có câu song sinh cho câu này (không có thì luật "một lượt là song sinh" được miễn).
 */
export function phatLaiLoi(lan: readonly LanLamLoi[], docLoiGiaiLuc: readonly string[], coSongSinh: boolean, homNay: string, ts: ThamSoLuat = THAM_SO_GOC): KetQuaLoi {
  const MOC = ts.mocDuyTri
  const doc = docLoiGiaiLuc.map((x) => Date.parse(x)).filter(Number.isFinite)
  const tuLam = (x: LanLamLoi) => {
    if (x.coHoTro) return false
    const t = Date.parse(x.luc)
    return !doc.some((d) => d <= t && t - d < ts.gioDocLoiGiai * 3_600_000)
  }
  const ds = [...lan].filter((x) => x.ngayVn >= TU_NGAY).sort((a, b) => a.luc.localeCompare(b.luc))
  const kq: KetQuaLoi = { trangThai: 'khong_loi', saiCuoi: '', soLanSai: 0, ngayDung: [], daDungSongSinh: false, denHan: '', nenSongSinh: false, dongNgay: '', mocDuyTri: 0, nguonSai: '' }
  for (const x of ds) {
    if (!tuLam(x)) continue
    if (x.ketQua === 1) {
      if (kq.trangThai === 'khong_loi') continue // đúng trước khi từng sai: không phải việc của hàng chữa lỗi
      if (kq.trangThai === 'dong' || kq.trangThai === 'duy_tri') {
        // Lượt kiểm duy trì đúng ⇒ qua một mốc.
        const moc = MOC[kq.mocDuyTri]
        if (moc !== undefined && cachNgay(kq.dongNgay, x.ngayVn) >= moc) kq.mocDuyTri++
        continue
      }
      if (!kq.ngayDung.includes(x.ngayVn)) kq.ngayDung.push(x.ngayVn)
      if (x.songSinh) kq.daDungSongSinh = true
      const duNgay = kq.ngayDung.length >= 2
      const duSongSinh = kq.daDungSongSinh || !coSongSinh
      const duCach = cachNgay(kq.saiCuoi, x.ngayVn) >= ts.cachSaiCuoi
      if (duNgay && duSongSinh && duCach) {
        kq.trangThai = 'dong'
        kq.dongNgay = x.ngayVn
        kq.mocDuyTri = 0
      } else {
        kq.trangThai = 'cho_kiem'
      }
    } else {
      // Sai hoặc bỏ trống (tự làm) ⇒ mở / mở lại lỗi; mọi tiến độ đúng trước đó bỏ.
      kq.soLanSai++
      if (!kq.nguonSai) kq.nguonSai = x.nguon
      kq.saiCuoi = x.ngayVn
      kq.trangThai = 'mo'
      kq.ngayDung = []
      kq.daDungSongSinh = false
      kq.dongNgay = ''
      kq.mocDuyTri = 0
    }
  }
  if (kq.trangThai === 'dong' && kq.mocDuyTri >= MOC.length) kq.trangThai = 'duy_tri'
  // Hạn: lỗi mở ⇒ làm lại ngay hôm sau lần sai (hôm nay nếu đã quá); chờ kiểm ⇒ ngày sớm nhất đủ điều kiện đóng; đã đóng ⇒ mốc duy trì kế.
  if (kq.trangThai === 'mo') kq.denHan = maxNgay(congNgayVn(kq.saiCuoi, 1), '')
  else if (kq.trangThai === 'cho_kiem') kq.denHan = maxNgay(congNgayVn(kq.ngayDung[kq.ngayDung.length - 1]!, 1), congNgayVn(kq.saiCuoi, ts.cachSaiCuoi))
  else if (kq.trangThai === 'dong') kq.denHan = congNgayVn(kq.dongNgay, MOC[kq.mocDuyTri]!)
  if (kq.denHan && kq.denHan < homNay && kq.trangThai !== 'mo') kq.denHan = homNay
  if (kq.trangThai === 'mo' && kq.denHan < homNay) kq.denHan = homNay
  // Song sinh: lượt kế phục vụ song sinh khi câu có song sinh và em chưa đúng song sinh (lượt mở: song sinh luôn — không nhớ đáp án).
  kq.nenSongSinh = coSongSinh && (kq.trangThai === 'mo' || (kq.trangThai === 'cho_kiem' && !kq.daDungSongSinh) || kq.trangThai === 'dong')
  return kq
}

function maxNgay(a: string, b: string): string {
  return a > b ? a : b
}

/** Mục tiêu số câu song sinh dùng được mỗi câu (thầy 07/10: ít nhất sáu bản, không sinh tự luận). */
export const TRAN_SONG_SINH = 6
/**
 * Số CHỖ dự phòng của mảng song sinh một câu (qid ảo "~ss0" … "~ss11"): máy soạn NỐI thêm tới khi đủ sáu bản DÙNG
 * ĐƯỢC mà vẫn giữ nguyên chỗ các bản cũ (kể cả bản không dùng được). Đọc sổ phải phủ đủ mọi chỗ, nếu không lượt làm bản ở
 * chỗ ≥ 6 sẽ rơi khỏi lịch sử câu gốc. Không đổi chỉ số hoặc cắt các bản lịch sử khi nâng mục tiêu.
 */
export const CHO_SONG_SINH = 2 * TRAN_SONG_SINH
/** qid gốc + các qid ảo song sinh trong số chỗ dự phòng — danh sách để đọc sổ theo chỉ mục (không LIKE). Dùng chung mọi nơi, không tự viết `~ss0`/`~ss1`. */
export const cacQidSongSinh = (goc: string): string[] => [goc, ...Array.from({ length: CHO_SONG_SINH }, (_, i) => `${goc}~ss${i}`)]

/**
 * qid ẢO của câu sai (làm lại bằng bản khác): "<gốc>~ss<i>" song sinh (i = 0 … CHO_SONG_SINH − 1) · "<gốc>~bt<k>" BIẾN THỂ BẰNG MÃ (bien-the-sinh.ts, 06/10)
 * · "<gốc>~yd<k>" bộ ý ĐÚNG–SAI MỚI (cau-y-ds.ts, 06/10); k = số lần em đã làm bản khác loại ấy của câu gốc (đếm từ sổ). Câu game có hậu tố lượt lặp "#n" — bỏ trước.
 * `songSinh` là chỉ số CHỈ khi qid là `~ss` (chỉ số bản trong `cau_bo_tro`); với `~bt` / `~yd` là `k` — nơi cần phân biệt dùng `loaiQidAo`.
 * MỌI nơi đọc sổ rồi quy về câu gốc bằng hàm này (OMNI, hồ sơ lỗi, tự hoàn thiện, nút thắt, chất lượng) tự coi `~bt` / `~yd` là lượt làm của câu gốc, như song sinh.
 */
export function tachSongSinh(qid: string): { goc: string; songSinh: number | null } {
  const q = qid.replace(/#\d+$/, '')
  const m = /^(.*)~(?:ss|bt|yd)(\d+)$/.exec(q)
  return m ? { goc: m[1]!, songSinh: Number(m[2]) } : { goc: q, songSinh: null }
}
/** Loại qid ảo: 'ss' song sinh · 'bt' biến thể bằng mã · 'yd' ý Đúng–Sai mới; qid thường ⇒ null. `k` = số thứ tự sau hậu tố. */
export type LoaiQidAo = 'ss' | 'bt' | 'yd'
export function loaiQidAo(qid: string): { goc: string; loai: LoaiQidAo; k: number } | null {
  const m = /^(.*)~(ss|bt|yd)(\d+)$/.exec(qid.replace(/#\d+$/, ''))
  return m ? { goc: m[1]!, loai: m[2] as LoaiQidAo, k: Number(m[3]) } : null
}
/** qid ảo của bản khác bằng mã (biến thể) / bộ ý Đ–S mới thứ k của câu gốc. */
export const qidBienThe = (goc: string, k: number): string => `${goc}~bt${k}`
export const qidYDsMoi = (goc: string, k: number): string => `${goc}~yd${k}`
