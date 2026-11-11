// NỢ CÂU — luật thuần (thầy 11/11: «hiện thẻ làm bù … cộng dồn và bắt làm bù trước rồi mới đến câu mới … đếm theo câu … làm tối thiểu giống như trả tối
// thiểu của ngân hàng … tối đa 3 ngày nợ tối thiểu, đến ngày thứ tư phải trả hết»; «Ghi rõ nợ câu»; «Tính lãi như ngân hàng luôn»).
// Đặc tả + bản vẽ thầy duyệt: docs/ban-ve-lam-bu-1111/DAC-TA.md. Tệp này KHÔNG đọc D1 — phần D1 ở no-cau-d1.ts.
//
// MỘT CON SỐ: mức hôm nay M = mức gốc của ngày (28) + số câu trả nợ đã chọn. Câu em làm ĐẦU TIÊN trong ngày tính vào trả nợ cho tới khi đủ số đã chọn.
// CHỐT MỖI ĐÊM (tính lại ở lần lập đầu tiên của ngày sau):
//   1. trả = số câu em làm tính vào nợ (tối đa số đã chọn; làm VƯỢT mức M bao nhiêu thì trừ thêm bấy nhiêu);
//   2. LÃI = 5 % số nợ CÒN LẠI sau phần trả, làm tròn lên (còn nợ là có ít nhất 1 câu lãi). Trả hết ⇒ không lãi. Ngày Kiểm tra ôn tập không tính lãi
//      (ngày ấy em không trả nợ được);
//   3. thiếu = phần 28 câu của chính ngày ấy em chưa làm ⇒ cộng vào nợ, MIỄN LÃI đêm đầu (như khoản mới phát sinh của thẻ ngân hàng);
//   4. nợ không vượt TRẦN 84 câu (3 ngày).
// CÂU LÃI LÀ CÂU NÀO: câu ÔN của chính em — dạng em vừa sai / lâu chưa chạm trước (nợ ôn theo dạng, rut-28.ts), đứng đầu đề của ngày (goi-bai-7-loi.ts).
// TRẢ TỐI THIỂU = 25 % số nợ, làm tròn lên, không dưới 6 câu (nợ ≤ 6 ⇒ trả hết). Tối đa 3 lần; lần thứ tư phải trả hết. Trả hết nợ ⇒ đếm lại từ 0.

/** Nợ phát sinh từ ngày này (ngày phát hành) cho mọi em có bài. */
export const NGAY_NO_CAU = '2026-11-11'
/** Ngày ngay trước mốc: sổ nợ của MỌI em coi như đã chốt tới ngày này (thầy 11/11 «áp dụng luôn cho học sinh») ⇒ ngày 11/11 của em nào cũng được tính, kể cả em
 *  hôm ấy không mở app (số thật 12:41 11/11: mới 124 / 275 em có sổ — 151 em còn lại nếu chờ «lần đầu mở app» sẽ bị tính chậm một ngày). */
export const NGAY_TRUOC_NO_CAU = '2026-11-10'
export const TRAN_NO = 84
export const TOI_THIEU_PHAN_TRAM = 25
export const TOI_THIEU_SAN = 6
export const LAN_TOI_THIEU_TOI_DA = 3
export const LAI_PHAN_TRAM = 5

export type LoaiNo = 'moi' | 'sua' | 'on' | 'lai'
export type KieuTra = 'toi_thieu' | 'het'
export interface SoNo { /** nợ đầu ngày kế tiếp sau `den` */ no: number; /** số lần đã trả tối thiểu kể từ lần hết nợ gần nhất */ lan: number; loai: Record<LoaiNo, number>; /** đã chốt tới hết ngày này */ den: string }
export interface NgayNo {
  ngay: string
  /** dòng mức đã chốt của ngày (đã gồm số trả nợ đã chọn); null = ngày ấy không có dòng mức (em không mở app) */
  muc: number | null
  /** số câu trả nợ đã chọn của ngày (0 = không có lựa chọn) */
  so: number
  kieu: KieuTra | null
  /** số câu em đã làm của ngày (cùng số với «đã làm hôm nay») */
  lam: number
  /** ngày Kiểm tra ôn tập: 'da_nop' | 'chua' (lỡ / chưa nộp); null = ngày thường */
  kt: 'da_nop' | 'chua' | null
  /** loại ngày ⇒ nhãn của phần thiếu */
  loai: Exclude<LoaiNo, 'lai'>
}

const nguyen = (v: unknown): number => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0 }
export const soNoRong = (den: string): SoNo => ({ no: 0, lan: 0, loai: { moi: 0, sua: 0, on: 0, lai: 0 }, den })

/** Số câu trả tối thiểu của một khoản nợ: 25 %, làm tròn lên, sàn 6 câu; nợ ≤ 6 ⇒ trả hết. */
export function toiThieuNo(no: number): number {
  const n = nguyen(no)
  return n <= TOI_THIEU_SAN ? n : Math.max(TOI_THIEU_SAN, Math.ceil(n * TOI_THIEU_PHAN_TRAM / 100))
}
/** Lãi một đêm trên số nợ còn lại (5 %, làm tròn lên). */
export const laiNo = (du: number): number => { const n = nguyen(du); return n ? Math.ceil(n * LAI_PHAN_TRAM / 100) : 0 }
/** Hết 3 lần trả tối thiểu ⇒ phải trả hết. */
export const phaiTraHet = (s: Pick<SoNo, 'lan'>): boolean => s.lan >= LAN_TOI_THIEU_TOI_DA
/** Lựa chọn mặc định của ngày: trả tối thiểu; hết lần ⇒ trả hết. */
export function chonMacDinh(s: SoNo): { kieu: KieuTra; so: number } {
  return phaiTraHet(s) ? { kieu: 'het', so: s.no } : { kieu: 'toi_thieu', so: toiThieuNo(s.no) }
}
/** Số câu của một lựa chọn (null = không hợp lệ: hết lần mà chọn tối thiểu, hoặc không nợ). */
export function soCuaKieu(s: SoNo, kieu: KieuTra): number | null {
  if (s.no <= 0) return null
  if (kieu === 'het') return s.no
  return phaiTraHet(s) ? null : toiThieuNo(s.no)
}

const THU_TU_TRU: readonly LoaiNo[] = ['lai', 'moi', 'sua', 'on']
/** Trả nợ: trừ lãi trước rồi tới gốc (như ngân hàng). */
function tru(loai: Record<LoaiNo, number>, so: number): void {
  let con = so
  for (const k of THU_TU_TRU) { const x = Math.min(loai[k], con); loai[k] -= x; con -= x }
}

/** Chốt MỘT ngày đã qua. `mucVang` = mức của ngày không có dòng mức (em không mở app). */
export function chotNgay(s: SoNo, d: NgayNo, mucVang: number): SoNo {
  let no = nguyen(s.no), lan = nguyen(s.lan)
  const loai: Record<LoaiNo, number> = { moi: nguyen(s.loai.moi), sua: nguyen(s.loai.sua), on: nguyen(s.loai.on), lai: nguyen(s.loai.lai) }
  let tra = 0, thieu = 0, loaiThieu: Exclude<LoaiNo, 'lai'> = d.loai
  if (d.kt) { thieu = d.kt === 'da_nop' ? 0 : nguyen(mucVang); loaiThieu = 'on' }
  else if (d.muc === null) thieu = nguyen(mucVang)
  else {
    const M = nguyen(d.muc), lam = nguyen(d.lam), so = Math.min(nguyen(d.so), no), goc = Math.max(0, M - nguyen(d.so))
    if (lam >= M) tra = Math.min(no, so + (lam - M)) // đủ mức (kể cả mức đã hạ vì kho hết câu): trả đủ số đã chọn; làm vượt mức ⇒ trừ thêm
    else { tra = Math.min(so, lam); thieu = Math.max(0, goc - (lam - tra)) }
  }
  tru(loai, tra)
  no -= tra
  if (no <= 0) { no = 0; lan = 0 }
  else if (d.kieu === 'toi_thieu' && !d.kt && d.muc !== null && nguyen(d.lam) > 0) lan = Math.min(LAN_TOI_THIEU_TOI_DA, lan + 1) // ngày em không làm câu nào không mất lần
  const lai = d.kt ? 0 : Math.min(TRAN_NO - no, laiNo(no))
  loai.lai += lai
  no += lai
  const them = Math.min(TRAN_NO - no, thieu)
  loai[loaiThieu] += them
  no += them
  return { no, lan, loai, den: d.ngay }
}
/** Chốt lần lượt các ngày đã qua (xếp theo ngày tăng dần). */
export const chotNo = (s: SoNo, ds: readonly NgayNo[], mucVang: number): SoNo => ds.reduce((x, d) => chotNgay(x, d, mucVang), s)

export interface TomTatNo {
  /** nợ đầu ngày hôm nay */ no: number
  /** còn nợ lúc này (đã trừ câu trả hôm nay) */ con: number
  theoLoai: Record<LoaiNo, number>
  /** số câu trả tối thiểu hôm nay */ toiThieu: number
  /** số lần đã trả tối thiểu (0–3) */ lan: number
  /** hết lần ⇒ chỉ còn trả hết */ phaiTraHet: boolean
  kieu: KieuTra
  /** số câu trả nợ đã chọn hôm nay */ so: number
  /** đã trả hôm nay */ daTra: number
  /** lãi mỗi đêm (%) */ lai: number
  /** lãi sẽ cộng đêm nay nếu em dừng ở đây */ laiDemNay: number
  /** mức hôm nay (đã gồm số trả) */ muc: number
}
/** Tóm tắt gửi app: `daLam` = số câu em đã làm hôm nay, `muc` = mức hôm nay (đã gồm số trả). */
export function tomTatNo(s: SoNo, chon: { kieu: KieuTra; so: number }, daLam: number, muc: number): TomTatNo | null {
  if (s.no <= 0) return null
  const so = Math.min(nguyen(chon.so), s.no), lam = nguyen(daLam), M = nguyen(muc)
  const daTra = lam >= M && M > 0 ? Math.min(s.no, so + (lam - M)) : Math.min(so, lam), con = s.no - daTra
  return { no: s.no, con, theoLoai: { ...s.loai }, toiThieu: toiThieuNo(s.no), lan: s.lan, phaiTraHet: phaiTraHet(s), kieu: chon.kieu, so, daTra, lai: LAI_PHAN_TRAM, laiDemNay: laiNo(con), muc: M }
}
