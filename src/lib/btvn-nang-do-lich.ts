// BTVN "NÂNG ĐỠ" — LỊCH CHẶNG THEO GIỜ + SỨC CHỨA (hàm THUẦN, Code 1, 21/09/2026). Đặc tả: `prompt-btvn-nang-do.md` CẬP NHẬT 2.
//
// Chặng xếp theo PHIÊN HỌC chứ không cứng theo ngày. Mọi giờ tính theo giờ Việt Nam (UTC+7, không có giờ mùa hè) BẰNG SỐ HỌC: không Intl, không đồng hồ, không ngẫu nhiên ⇒ cùng đầu vào, cùng lịch.
//   • HẠN DÀI (tải mỗi ngày ≤ ngân sách × 1,3 và hạn > 48 giờ): một chặng mỗi BUỔI TỐI; chặng 0 mở lúc chốt, chặng k mở 00:00 giờ VN của ngày thứ k (Y HỆT `moLucChang` cũ khi hạn 23:59); "đúng nhịp" = xong trước 23:59 của ngày đó.
//     BẢN 1.3 (hạn rơi buổi trưa/sáng — bài thật 12:00): số buổi = số BUỔI TỐI (cửa sổ học 20:00–23:59) còn TRỌN trước hạn; ngày hạn mà cửa sổ học nằm sau giờ hạn thì KHÔNG tính ⇒ chặng cuối mở chậm nhất tối hôm trước.
//   • HẠN NGẮN (tải mỗi ngày > ngân sách × 1,3 HOẶC hạn ≤ 48 giờ): chia THEO GIỜ trong cửa sổ học (mặc định 20:00–23:59): chặng ≤ ~10 câu, hai chặng cách nhau ≥ 40 phút, dàn ĐỀU trên thời gian còn lại
//     (ví dụ 20:00 · 21:20 · 22:40). Chặng 0 luôn mở NGAY lúc chốt. Chặng cuối phải mở sớm hơn hạn ≥ 1,5 × thời gian làm; thiếu giờ ⇒ BỎ giãn cách (DEADLINE THẮNG). Không chặng nào mở 00:00–05:59; còn cửa sổ sau thì không mở khuya (23:15–23:59) mà dời sang đầu cửa sổ kế.
// Lịch chỉ nói "sớm nhất chặng mở lúc nào"; ai vào muộn vẫn làm được (chặng k mở khi chặng k−1 xong VÀ tới giờ — `trangThaiCacChang`), không bao giờ nhốt em.
// Chỉ nhận CHUỖI ISO (lúc chốt, hạn nộp) và trả chuỗi ISO UTC, như `moLucChang`. Hạn thầy không ghi giờ ⇒ `hanNopMacDinh('YYYY-MM-DD')` = 23:59 giờ VN của ngày ấy.

// ══════════════════════════════ HẰNG SỐ ══════════════════════════════

export const LICH_CHANG = {
  /** Cửa sổ học mặc định (giờ VN, dạng HH:MM). Chặng theo giờ mở trong khoảng này. */
  CUA_SO_TU: '20:00',
  CUA_SO_DEN: '23:59',
  /** Hai chặng theo giờ cách nhau (từ lúc mở này tới lúc mở kia) ít nhất chừng này phút — nghỉ + giãn cách. */
  GIAN_CACH_PHUT: 40,
  /** Một phiên ≤ chừng này câu và ≤ chừng này phút làm (≈ 15–20 phút theo giây/câu thật của em). */
  CAU_TOI_DA_MOI_PHIEN: 10,
  PHUT_TOI_DA_MOI_PHIEN: 20,
  /** Chặng phải mở sớm hơn hạn ít nhất chừng này × thời gian làm ước tính của phần còn lại. */
  HE_SO_DU_GIO: 1.5,
  /** KHÔNG BẮT EM HỌC KHUYA: khi CÒN cửa sổ học sau, chặng phải mở ≤ (cuối cửa sổ − 1,5 × thời gian làm chặng − DU_PHUT) và không bao giờ trong KHUYA_PHUT phút cuối cửa sổ
   * (mặc định 23:15–23:59); không kịp ⇒ dời sang ĐẦU cửa sổ kế. Chỉ phá khi hạn nộp ép (không còn cửa sổ nào). */
  DU_PHUT: 15,
  KHUYA_PHUT: 45,
  /** Hạn ≤ chừng này giờ kể từ lúc chốt ⇒ luôn là hạn ngắn. */
  NGUONG_HAN_NGAN_GIO: 48,
  /** Tải mỗi ngày > ngân sách của em × hệ số này ⇒ hạn ngắn. */
  HE_SO_TAI_NGAN: 1.3,
  /** Sức chứa LÀNH MẠNH của một buổi tối: tối đa từng này phiên, và tối đa (ngân sách/ngày × hệ số) câu. */
  PHIEN_TOI_DA_MOI_NGAY: 3,
  HE_SO_QUA_TAI_LANH_MANH: 1.5,
  /** Giờ chốt mỗi ngày: "xong đúng nhịp" = xong trước 23:59. */
  GIO_CHOT: '23:59',
  /** Giây/câu khi máy chủ chưa biết (hoặc số vô lý). */
  GIAY_MAC_DINH: 90,
  /** Không chặng nào mở trong khoảng này (giờ VN), trừ chặng mở ngay lúc chốt. */
  GIO_CAM_MO_TU: 0,
  GIO_CAM_MO_DEN: 6,
} as const

export type CheDoLich = 'dai' | 'ngan'

export interface CuaSoHoc {
  tu: string
  den: string
}

export interface DauVaoLich {
  /** ISO — lúc em mở bài / chốt bộ. */
  chotLuc: string
  /** ISO — hạn nộp (thầy không ghi giờ ⇒ `hanNopMacDinh`). */
  hanNop: string
  /** Số câu từng chặng (do lõi `chonBoCuaEm` chia). Có thì dùng nguyên; không có thì chia từ `tongCau`. */
  soCauTungChang?: number[]
  tongCau?: number
  /** Ngân sách câu/ngày của em (máy chủ tính từ tốc độ thật) và phần ôn lại mỗi ngày đã trừ khỏi ngân sách. */
  cauMoiNgay: number
  onLaiMoiNgay?: number
  /** Giây/câu thật của em. */
  giayMoiCau: number
  cuaSo?: CuaSoHoc
}

export interface ChangLich {
  chiSo: number
  /** ISO UTC — SỚM NHẤT chặng này mở. */
  moLuc: string
  /** ISO UTC — xong trước lúc này là "đúng nhịp": 23:59 giờ VN của ngày mở chặng (không quá hạn nộp). */
  dungNhipTruoc: string
  soCau: number
}

export interface SucChua {
  cheDo: CheDoLich
  /** Số BUỔI TỐI còn trọn trước hạn tính từ ngày chốt (hạn 23:59 = số ngày lịch từ chốt tới hạn), ≥ 1 — `soNgayToiHan`. */
  soNgay: number
  /** Số chặng tối đa xếp được tới hạn (≥ 1): hạn dài = số ngày; hạn ngắn = số phiên trong các cửa sổ học. */
  soPhien: number
  /** Số câu mỗi phiên (hạn ngắn ≤ 10; hạn dài = ngân sách/ngày sau khi trừ ôn lại). */
  cauMoiPhien: number
  /** Tổng số câu LÀNH MẠNH tới hạn. Lõi có thể vượt số này (vẫn giao đủ lõi, `canhBaoHanNgan` báo thầy). */
  soCauToiDa: number
}

// ══════════════════════════════ GIỜ VIỆT NAM BẰNG SỐ HỌC ══════════════════════════════

const MS_PHUT = 60_000
const MS_GIO = 3_600_000
const MS_NGAY = 86_400_000
const LECH_VN = 7 * MS_GIO
/** Trần số ngày quét cửa sổ (hạn xa vô lý không làm treo máy). */
const SO_NGAY_QUET_TOI_DA = 400

const chiSoNgayVn = (t: number): number => Math.floor((t + LECH_VN) / MS_NGAY)
/** Ms (UTC) của 00:00 giờ VN ngày có chỉ số `i`. */
const dauNgayVn = (i: number): number => i * MS_NGAY - LECH_VN
/** Phút kể từ 00:00 giờ VN (số thực). */
const phutTrongNgayVn = (t: number): number => (((t + LECH_VN) % MS_NGAY) + MS_NGAY) % MS_NGAY / MS_PHUT
const iso = (t: number): string => new Date(t).toISOString()
const lamTronPhut = (t: number): number => Math.floor(t / MS_PHUT) * MS_PHUT
const lamTron5 = (x: number): number => Math.round(x / 5) * 5
const tran5 = (x: number): number => Math.ceil(x / 5) * 5

function docThoiDiem(s: string, ten: string): number {
  const t = Date.parse(s)
  if (!Number.isFinite(t)) throw new RangeError(`${ten} không phải thời điểm ISO hợp lệ: ${String(s).slice(0, 40)}`)
  return t
}

/** 'HH:MM' → số phút trong ngày; sai định dạng ⇒ null. */
function docGio(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s).trim())
  if (!m) return null
  const h = Number(m[1])
  const p = Number(m[2])
  return h <= 23 && p <= 59 ? h * 60 + p : null
}

/** Hạn nộp khi thầy chỉ ghi ngày: 23:59 giờ VN của ngày ấy (ISO UTC). Sai ngày ⇒ RangeError. */
export function hanNopMacDinh(ngay: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngay)
  if (!m) throw new RangeError(`ngày phải có dạng YYYY-MM-DD: ${String(ngay).slice(0, 20)}`)
  const g = docGio(LICH_CHANG.GIO_CHOT)!
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) + g * MS_PHUT - LECH_VN
  if (!Number.isFinite(t)) throw new RangeError(`ngày không hợp lệ: ${ngay}`)
  return iso(t)
}

function cuaSoHieuLuc(cs?: CuaSoHoc): { tu: number; den: number } {
  const tu = cs ? docGio(cs.tu) : null
  const den = cs ? docGio(cs.den) : null
  if (tu !== null && den !== null && den > tu) return { tu, den }
  return { tu: docGio(LICH_CHANG.CUA_SO_TU)!, den: docGio(LICH_CHANG.CUA_SO_DEN)! }
}

function giayHopLe(g: number): number {
  return Number.isFinite(g) && g >= 5 && g <= 900 ? g : LICH_CHANG.GIAY_MAC_DINH
}

/**
 * Số BUỔI TỐI còn TRỌN trước hạn, tính từ ngày chốt (BẢN 1.3): mỗi ngày lịch VN có một buổi tối (cửa sổ học `cuaSo`, mặc định 20:00–23:59); buổi ấy tính khi cửa sổ KẾT THÚC không muộn hơn hạn.
 * Hạn 23:59 (mặc định của ô hạn) hoặc 00:00 ngày sau ⇒ ngày hạn tính (Y HỆT bản cũ = số ngày lịch từ ngày chốt tới ngày hạn); hạn 12:00 ngày D ⇒ ngày D KHÔNG tính (cửa sổ D nằm sau hạn),
 * buổi tối cuối cùng là D−1 nên chặng cuối mở chậm nhất tối hôm trước. Ngày chốt luôn tính (chặng 0 mở ngay lúc chốt). ≥ 1.
 */
export function soNgayToiHan(chotLuc: string, hanNop: string, cuaSo?: CuaSoHoc): number {
  const c = docThoiDiem(chotLuc, 'chotLuc')
  const h = docThoiDiem(hanNop, 'hanNop')
  const { den } = cuaSoHieuLuc(cuaSo)
  const ngayCuoi = Math.floor((h + LECH_VN - den * MS_PHUT) / MS_NGAY) // ngày lớn nhất mà cửa sổ học kết thúc ≤ hạn
  return Math.max(1, ngayCuoi - chiSoNgayVn(c) + 1)
}

// ══════════════════════════════ CHẾ ĐỘ ══════════════════════════════

const nganSachRong = (cauMoiNgay: number, onLai?: number): number => Math.max(1, Math.floor(Number.isFinite(cauMoiNgay) ? cauMoiNgay : 1) - Math.floor(Number.isFinite(onLai ?? 0) ? onLai ?? 0 : 0))

/**
 * HẠN NGẮN hay DÀI. Ngắn khi hạn ≤ 48 giờ kể từ lúc chốt, hoặc tải mỗi ngày (tổng câu / số ngày) > ngân sách × 1,3. Không biết tổng câu ⇒ chỉ xét theo giờ.
 */
export function cheDoLich(p: Pick<DauVaoLich, 'chotLuc' | 'hanNop' | 'cauMoiNgay' | 'onLaiMoiNgay' | 'soCauTungChang' | 'tongCau'> & { cuaSo?: CuaSoHoc }): CheDoLich {
  const c = docThoiDiem(p.chotLuc, 'chotLuc')
  const h = docThoiDiem(p.hanNop, 'hanNop')
  if (h - c <= LICH_CHANG.NGUONG_HAN_NGAN_GIO * MS_GIO) return 'ngan'
  const tong = p.soCauTungChang ? p.soCauTungChang.reduce((a, b) => a + Math.max(0, b), 0) : (p.tongCau ?? 0)
  if (tong > 0 && tong / soNgayToiHan(p.chotLuc, p.hanNop, p.cuaSo) > nganSachRong(p.cauMoiNgay, p.onLaiMoiNgay) * LICH_CHANG.HE_SO_TAI_NGAN) return 'ngan'
  return 'dai'
}

// ══════════════════════════════ CỬA SỔ HỌC ══════════════════════════════

interface CuaSoTg {
  s: number
  e: number
}

/** Các cửa sổ học (ms UTC) nằm trong [m0, hạn), cắt theo lúc chốt và hạn. Cửa sổ rỗng bị bỏ. */
function cacCuaSoHoc(m0: number, han: number, tuP: number, denP: number): CuaSoTg[] {
  const ra: CuaSoTg[] = []
  const d0 = chiSoNgayVn(m0)
  const d1 = Math.min(chiSoNgayVn(han - 1), d0 + SO_NGAY_QUET_TOI_DA)
  for (let d = d0; d <= d1; d++) {
    const s = Math.max(dauNgayVn(d) + tuP * MS_PHUT, m0)
    const e = Math.min(dauNgayVn(d) + denP * MS_PHUT, han)
    if (e > s) ra.push({ s, e })
  }
  return ra
}

/** Phần cuối cửa sổ (ms) mà chặng làm hết `thoiGianLam` ms KHÔNG được mở trong đó khi còn cửa sổ sau: max(KHUYA_PHUT, DU_PHUT + 1,5 × thời gian làm). */
function duTruCuoiCuaSo(thoiGianLam: number): number {
  return Math.max(LICH_CHANG.KHUYA_PHUT * MS_PHUT, LICH_CHANG.DU_PHUT * MS_PHUT + LICH_CHANG.HE_SO_DU_GIO * thoiGianLam)
}

// ══════════════════════════════ SỨC CHỨA ══════════════════════════════

/**
 * SỨC CHỨA các phiên học tới hạn. Hạn dài: mỗi ngày một chặng × ngân sách/ngày. Hạn ngắn: mỗi cửa sổ học tối đa 3 phiên (cách ≥ 40 phút, phiên cuối đủ 1,5 × thời gian làm trước khi hết cửa sổ),
 * mỗi phiên ≤ 10 câu (ít hơn với em làm chậm: ≤ 20 phút), mỗi ngày ≤ 1,5 × ngân sách; nếu chốt ngoài cửa sổ thì chặng 0 mở ngay được tính thêm một phiên.
 * Không truyền `cheDo` ⇒ hạn ngắn khi hạn ≤ 48 giờ.
 */
export function sucChua(p: Pick<DauVaoLich, 'chotLuc' | 'hanNop' | 'cauMoiNgay' | 'onLaiMoiNgay' | 'giayMoiCau' | 'cuaSo'>, cheDo?: CheDoLich): SucChua {
  const m0 = docThoiDiem(p.chotLuc, 'chotLuc')
  const han = docThoiDiem(p.hanNop, 'hanNop')
  const soNgay = soNgayToiHan(p.chotLuc, p.hanNop, p.cuaSo)
  const cd = cheDo ?? (han - m0 <= LICH_CHANG.NGUONG_HAN_NGAN_GIO * MS_GIO ? 'ngan' : 'dai')
  const rong = nganSachRong(p.cauMoiNgay, p.onLaiMoiNgay)
  if (cd === 'dai') return { cheDo: 'dai', soNgay, soPhien: soNgay, cauMoiPhien: rong, soCauToiDa: soNgay * rong }

  const giay = giayHopLe(p.giayMoiCau)
  const cauMoiPhien = Math.max(1, Math.min(LICH_CHANG.CAU_TOI_DA_MOI_PHIEN, Math.floor((LICH_CHANG.PHUT_TOI_DA_MOI_PHIEN * 60) / giay)))
  const thoiGianPhien = cauMoiPhien * giay * 1000
  const tranNgay = Math.max(1, Math.ceil(LICH_CHANG.HE_SO_QUA_TAI_LANH_MANH * rong))
  const { tu, den } = cuaSoHieuLuc(p.cuaSo)
  const cacCuaSo = cacCuaSoHoc(m0, han, tu, den)
  const mNgoai = cacCuaSo.length === 0 || cacCuaSo[0].s !== m0 // chốt ngoài cửa sổ ⇒ chặng 0 mở ngay là phiên riêng
  const theoNgay = new Map<number, number>()
  for (const w of cacCuaSo) {
    const dai = w.e - w.s
    // cửa sổ KHÔNG phải cuối cùng: phiên phải mở sớm để không học khuya (`duTruCuoiCuaSo`); cửa sổ cuối: chỉ cần kịp hạn (1,5 × thời gian làm)
    const can = w === cacCuaSo[cacCuaSo.length - 1] ? LICH_CHANG.HE_SO_DU_GIO * thoiGianPhien : duTruCuoiCuaSo(thoiGianPhien)
    const cho = dai >= can ? Math.floor((dai - can) / (LICH_CHANG.GIAN_CACH_PHUT * MS_PHUT)) + 1 : 0
    theoNgay.set(chiSoNgayVn(w.s), Math.min(LICH_CHANG.PHIEN_TOI_DA_MOI_NGAY, cho))
  }
  // chặng 0 mở NGAY lúc chốt luôn là một phiên: khi chốt ngoài cửa sổ (phiên riêng) hoặc cửa sổ ngày chốt không còn chỗ cho phiên nào
  if (mNgoai || (theoNgay.get(chiSoNgayVn(m0)) ?? 0) === 0) theoNgay.set(chiSoNgayVn(m0), (theoNgay.get(chiSoNgayVn(m0)) ?? 0) + 1)
  let soPhien = 0
  let soCau = 0
  for (const n of theoNgay.values()) {
    soPhien += n
    soCau += Math.min(n * cauMoiPhien, tranNgay)
  }
  return { cheDo: 'ngan', soNgay, soPhien: Math.max(1, soPhien), cauMoiPhien, soCauToiDa: Math.max(1, soCau) }
}

/** NGÂN SÁCH đưa cho lõi `chonBoCuaEm` (`NganSachBai` của `btvn-nang-do.ts`: số chặng tối đa × câu/chặng, ôn lại đã trừ, `tongToiDa` = trần tổng câu). */
export interface NganSachChoLoi {
  soNgay: number
  cauMoiNgay: number
  onLaiMoiNgay: number
  tongToiDa?: number
}

/**
 * NGÂN SÁCH CHO LÕI (bản 1.4, Boss duyệt 21/09, hệ số 1,0: "em mở muộn KHÔNG BAO GIỜ nhận nhiều câu hơn em mở sớm"). Trước đây hạn ngắn đưa `soPhien × cauMoiPhien` (ví dụ 6 phiên × 10 = 60 câu cho em mở 22/09 21:00 trong
 * khi em mở 21/09 20:30 chỉ nhận 36) — trần lành mạnh `soCauToiDa` đã có nhưng không ai dùng.
 *   · HẠN DÀI: trả Y HỆT như cũ (`soNgay`, ngân sách gốc, ôn lại) — không trần.
 *   · HẠN NGẮN: TRẦN TỔNG = min(`soCauToiDa`, ngân sách gốc mỗi buổi × SỐ BUỔI TỐI còn trọn trước hạn) — số cuối là mức em sẽ nhận ở chế độ dài nếu còn từng ấy buổi tối, nên mở muộn hơn không bao giờ nhiều hơn mở sớm hơn
 *     (quét 194 nghìn thời điểm chốt: 0 vi phạm; test tính chất khoá). Trần đi qua `NganSachBai.tongToiDa` (chính xác từng câu, không làm tròn theo số phiên). Số chặng tối đa (`soNgay`) = số phiên; nếu biết số câu LÕI (`soLoi`)
 *     thì chỉ mở đủ phiên cho max(trần, lõi) (mỗi phiên ≤ `cauMoiPhien` câu) để chặng không vụn; không biết ⇒ dùng hết số phiên như cũ.
 * LÕI BẮT BUỘC luôn đủ: `chonBoCuaEm` kẹp tổng ≥ lõi bắt buộc (`canhBaoHanNgan` vẫn báo thầy) — chỉ phần riêng + thử thách bị chặn.
 */
export function nganSachHanNgan(sc: SucChua, p: Pick<DauVaoLich, 'chotLuc' | 'hanNop' | 'cauMoiNgay' | 'onLaiMoiNgay' | 'cuaSo'>, soLoi?: number): NganSachChoLoi {
  if (sc.cheDo !== 'ngan') return { soNgay: sc.soNgay, cauMoiNgay: p.cauMoiNgay, onLaiMoiNgay: p.onLaiMoiNgay ?? 0 }
  const rong = nganSachRong(p.cauMoiNgay, p.onLaiMoiNgay)
  const soBuoi = soNgayToiHan(p.chotLuc, p.hanNop, p.cuaSo)
  const tran = Math.max(1, Math.min(sc.soCauToiDa, rong * soBuoi))
  const canPhien = soLoi === undefined || !Number.isFinite(soLoi) ? sc.soPhien : Math.ceil(Math.max(tran, Math.max(0, Math.floor(soLoi))) / Math.max(1, sc.cauMoiPhien))
  return { soNgay: Math.max(1, Math.min(sc.soPhien, canPhien)), cauMoiNgay: sc.cauMoiPhien, onLaiMoiNgay: 0, tongToiDa: tran }
}

/** Câu chữ cảnh báo cho màn Xem trước của thầy khi LÕI vượt sức chứa lành mạnh (vẫn giao đủ lõi). Không vượt ⇒ null. */
export function canhBaoHanNgan(soCauLoi: number, sc: SucChua): string | null {
  if (sc.cheDo !== 'ngan' || soCauLoi <= sc.soCauToiDa) return null
  return `Hạn ngắn: mỗi em tối thiểu ${soCauLoi} câu lõi trong ${sc.soPhien} phiên — cân nhắc lùi hạn`
}

/** Chia `tong` câu thành các chặng đều nhau (chặng đầu nhiều hơn tối đa 1 câu). Hạn ngắn: ≤ `cauMoiPhien` câu/chặng nếu đủ phiên; lõi vượt ⇒ đúng `soPhien` chặng, mỗi chặng lớn hơn. Hạn dài: ≤ 1 chặng/ngày. */
export function chiaSoCauChang(tong: number, sc: SucChua): number[] {
  const t = Math.max(0, Math.floor(Number.isFinite(tong) ? tong : 0))
  if (t === 0) return []
  const n = Math.max(1, Math.min(t, sc.cheDo === 'ngan' ? Math.min(Math.ceil(t / sc.cauMoiPhien), sc.soPhien) : sc.soNgay))
  const goc = Math.floor(t / n)
  const du = t % n
  return Array.from({ length: n }, (_, k) => goc + (k < du ? 1 : 0))
}

// ══════════════════════════════ MỐC MỞ MUỘN NHẤT ══════════════════════════════

/**
 * Mốc MUỘN NHẤT (ms) để chặng còn `thoiGianConLai` ms cần làm (cộng dồn các chặng từ nó tới cuối) vẫn kịp trước `han`: `han − 1,5 × thoiGianConLai`, làm tròn xuống phút,
 * và nếu rơi vào 00:00–05:59 giờ VN thì lùi về 23:59 hôm trước (không ai bị gọi dậy đêm khuya). Đơn điệu theo `thoiGianConLai` giảm dần.
 */
export function mocMoMuonNhat(han: number, thoiGianConLai: number): number {
  const t = lamTronPhut(han - LICH_CHANG.HE_SO_DU_GIO * thoiGianConLai)
  const p = phutTrongNgayVn(t)
  return p >= LICH_CHANG.GIO_CAM_MO_TU * 60 && p < LICH_CHANG.GIO_CAM_MO_DEN * 60 ? dauNgayVn(chiSoNgayVn(t)) - MS_PHUT : t
}

// ══════════════════════════════ LỊCH HẠN DÀI ══════════════════════════════

/** Mốc mở (ms) của các chặng 1…n−1 ở HẠN DÀI (chỉ số 0 = chặng 0 để trống, `m0` lúc chốt): chặng k mở 00:00 giờ VN của ngày (chốt + min(k, số buổi tối − 1)). Trả đủ `SO_CHANG_TOI_DA` phần tử để dùng cho mọi n. */
const SO_CHANG_TOI_DA = 400
function moLucDai(m0: number, chotLuc: string, hanNop: string, cuaSo?: CuaSoHoc): number[] {
  const soNgay = soNgayToiHan(chotLuc, hanNop, cuaSo)
  const ngayChot = chiSoNgayVn(m0)
  const ra: number[] = [m0]
  for (let k = 1; k < SO_CHANG_TOI_DA; k++) ra.push(dauNgayVn(ngayChot + Math.min(k, soNgay - 1)))
  return ra
}

/**
 * LỊCH ĐÃ LƯU của em chốt TRƯỚC bản 1.3 (hạn dài): chặng CHƯA MỞ được mở SỚM HƠN theo luật buổi tối, KHÔNG BAO GIỜ muộn hơn (không nhốt em). Tính lại khi ĐỌC, không cần migration.
 *   · chặng đã mở (mốc đã lưu ≤ `nayMs`) giữ nguyên; chặng chưa mở: min(mốc đã lưu, mốc tính lại theo bản 1.3); mốc không giảm; không quá hạn − 1 phút;
 *   · CHỈ dùng cho lịch hạn dài (`cheDo` đã lưu = 'dai') — lịch theo giờ (hạn ngắn) của bản 1.2 vốn đã cắt cửa sổ học theo hạn nên không đổi.
 * Hạn 23:59 ⇒ mốc tính lại = mốc đã lưu ⇒ trả y hệt. Không đổi số chặng, hạn nộp, lõi, điểm; áp lại nhiều lần cho cùng kết quả.
 */
export function lichDaiSomHon(moLucCu: readonly string[], p: { chotLuc: string; hanNop: string; cuaSo?: CuaSoHoc }, nayMs: number): string[] {
  const n = moLucCu.length
  if (n === 0) return []
  const cu = moLucCu.map((s, k) => docThoiDiem(s, `moLucCu[${k}]`))
  const m0 = docThoiDiem(p.chotLuc, 'chotLuc')
  const han = docThoiDiem(p.hanNop, 'hanNop')
  if (n === 1 || han <= m0) return [...moLucCu]
  const moi = moLucDai(m0, p.chotLuc, p.hanNop, p.cuaSo)
  const ra: number[] = []
  for (let k = 0; k < n; k++) {
    if (cu[k] <= nayMs) ra.push(cu[k]) // đã mở: giữ nguyên
    else ra.push(Math.max(k > 0 ? ra[k - 1] : m0, Math.min(cu[k], moi[k])))
  }
  return ra.map((t, k) => (t === cu[k] ? moLucCu[k] : iso(t)))
}

// ══════════════════════════════ XẾP LỊCH ══════════════════════════════

/** "Đúng nhịp trước": 23:59 giờ VN của ngày có `t`; nếu `t` đã quá 23:59 thì 23:59 ngày kế; không quá hạn nộp. */
function dungNhipTruocMoc(t: number, han: number): number {
  let d = dauNgayVn(chiSoNgayVn(t)) + docGio(LICH_CHANG.GIO_CHOT)! * MS_PHUT
  if (d <= t) d += MS_NGAY
  return Math.min(d, han)
}

/** Số câu từng chặng: dùng nguyên `soCauTungChang`, nếu không thì chia từ `tongCau` theo chế độ. */
function soCauCacChang(p: DauVaoLich, cheDo: CheDoLich): number[] {
  if (p.soCauTungChang) return p.soCauTungChang.map((x) => Math.max(1, Math.floor(Number.isFinite(x) ? x : 1)))
  return chiaSoCauChang(p.tongCau ?? 0, sucChua(p, cheDo))
}

/**
 * LỊCH MỞ TỪNG CHẶNG. Tính MỘT lần lúc em mở bài và lưu (`btvn_em.chang_mo_json`). Tất định.
 * Quy ước: chặng 0 mở lúc chốt; mọi mốc mở ≤ hạn − 1 phút; các mốc không giảm; hạn ≤ chốt (bài đã quá hạn) ⇒ mọi chặng mở lúc chốt.
 */
export function xepLichChang(p: DauVaoLich): ChangLich[] {
  const m0 = docThoiDiem(p.chotLuc, 'chotLuc')
  const han = docThoiDiem(p.hanNop, 'hanNop')
  const cheDo = cheDoLich(p)
  const soCau = soCauCacChang(p, cheDo)
  const n = soCau.length
  if (n === 0) return []

  const mo: number[] = new Array(n).fill(m0)
  if (han > m0 && n > 1) {
    if (cheDo === 'dai') {
      const dai = moLucDai(m0, p.chotLuc, p.hanNop, p.cuaSo)
      for (let k = 1; k < n; k++) mo[k] = dai[Math.min(k, dai.length - 1)]
    } else {
      const giay = giayHopLe(p.giayMoiCau)
      const con: number[] = new Array(n + 1).fill(0) // con[k] = thời gian làm các chặng k..n−1 (ms)
      for (let k = n - 1; k >= 0; k--) con[k] = con[k + 1] + soCau[k] * giay * 1000
      const { tu, den } = cuaSoHieuLuc(p.cuaSo)
      const cacCuaSo = cacCuaSoHoc(m0, han, tu, den)
      // Trục thời gian CHỈ gồm giờ học: mỗi cửa sổ chiếm chỗ tròn 5 phút (làm tròn lên) để mốc rơi vào giờ đẹp.
      const beDai = cacCuaSo.map((w) => tran5((w.e - w.s) / MS_PHUT))
      const dau: number[] = []
      let tong = 0
      for (const b of beDai) {
        dau.push(tong)
        tong += b
      }
      const trongCuaSo = cacCuaSo.length > 0 && cacCuaSo[0].s === m0 // lúc chốt nằm TRONG một cửa sổ học ⇒ trục giờ học bắt đầu từ lúc chốt
      const buoc = tong / n // mỗi chặng một "ô" đều nhau trên trục giờ học; `somNhat` lo sàn 40 phút
      const veMs = (pos: number): number => {
        for (let i = 0; i < cacCuaSo.length; i++) if (pos < dau[i] + beDai[i]) return Math.min(cacCuaSo[i].s + Math.max(0, pos - dau[i]) * MS_PHUT, cacCuaSo[i].e)
        // Hết giờ học trước hạn mà hạn còn xa (cửa sổ ngắn/hạn có giờ lẻ): kéo dài tiếp NGOÀI cửa sổ để vẫn giữ giãn cách ≥ 40 phút.
        return cacCuaSo.length > 0 ? cacCuaSo[cacCuaSo.length - 1].s + (pos - dau[dau.length - 1]) * MS_PHUT : m0 + pos * MS_PHUT
      }
      /** Mốc rơi vào phần cuối một cửa sổ mà CÒN cửa sổ sau ⇒ dời sang ĐẦU cửa sổ kế (không bắt em học khuya). Chỉ dời MUỘN hơn ⇒ không mất giãn cách. */
      const dichKhuya = (t: number, thoiGianLam: number): number => {
        for (let i = 0; i < cacCuaSo.length - 1; i++) if (t >= cacCuaSo[i].s && t <= cacCuaSo[i].e && t > cacCuaSo[i].e - duTruCuoiCuaSo(thoiGianLam)) return cacCuaSo[i + 1].s
        return t
      }
      /** Đẩy mốc ra khỏi 00:00–05:59 (tới 06:00), chỉ đẩy MUỘN hơn nên không làm mất giãn cách. */
      const traGioCam = (t: number): number => {
        const p = phutTrongNgayVn(t)
        return p >= LICH_CHANG.GIO_CAM_MO_TU * 60 && p < LICH_CHANG.GIO_CAM_MO_DEN * 60 ? dauNgayVn(chiSoNgayVn(t)) + LICH_CHANG.GIO_CAM_MO_DEN * 60 * MS_PHUT : t
      }
      let truoc = 0
      for (let k = 1; k < n; k++) {
        const goc = trongCuaSo ? k * buoc : (k - 1) * buoc
        // Vị trí sớm nhất trên trục giờ học: cách chặng trước ≥ 40 phút. Chặng 1 khi chốt NGOÀI cửa sổ mở từ đầu cửa sổ (còn phải cách lúc chốt ≥ 40 phút: xem `ungVien` bên dưới).
        const somNhat = k === 1 && !trongCuaSo ? 0 : truoc + LICH_CHANG.GIAN_CACH_PHUT
        const pos = Math.max(lamTron5(goc), somNhat)
        truoc = pos
        // DEADLINE THẮNG giãn cách: không muộn hơn mốc muộn nhất của phần việc còn lại; không sớm hơn chặng trước.
        const ungVien = traGioCam(dichKhuya(Math.max(veMs(pos), mo[k - 1] + LICH_CHANG.GIAN_CACH_PHUT * MS_PHUT), soCau[k] * giay * 1000))
        mo[k] = Math.max(mo[k - 1], Math.min(ungVien, mocMoMuonNhat(han, con[k])))
      }
    }
  }
  return mo.map((t, k) => ({ chiSo: k, moLuc: iso(t), dungNhipTruoc: iso(han > t ? dungNhipTruocMoc(t, han) : dungNhipTruocMoc(t, t + MS_NGAY)), soCau: soCau[k] }))
}
