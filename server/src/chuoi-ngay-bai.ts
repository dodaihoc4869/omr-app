// CHUỖI NGÀY THEO BÀI + BÌNH GIỮ CHUỖI (B3 kiểu Duolingo; thầy chốt 26/10 — hợp đồng docs/hop-dong-duolingo-2610.md mục 4–5). HÀM THUẦN, tính lại từ
// nhật ký mỗi lần (không lưu số chuỗi ⇒ không lệch, không cần chốt đêm). Một định nghĩa cho cả học sinh (/hs) và phụ huynh (/ph).
//   · NGÀY ĐẠT: em xong ≥ 1 bài (≥ CAU_MOT_BAI câu có kết quả trong ngày VN, mọi nguồn) HOẶC tự sửa xong ≥ 1 câu.
//   · NGÀY VẮNG CÓ PHÉP (thầy ghi ở điểm danh): giữ chuỗi, không tốn bình, không cộng ngày.
//   · BÌNH GIỮ CHUỖI: mang tối đa 2 (đạt mốc 100 ngày ⇒ 3); mỗi thứ Hai tặng 1 nếu chưa đầy; chuỗi chạm mốc 30 ngày tặng 1; bình mua (ví của đặc tả điểm
//     thưởng) cộng vào ngày mua. Lỡ ngày (không đạt, không phép, không phải hôm nay) ⇒ tự dùng 1 bình: chuỗi giữ, không cộng ngày.
//   · CỨU CHUỖI: lỡ ngày khi hết bình ⇒ chuỗi tắt; ngay NGÀY HÔM SAU (≈ 24 giờ) em xong 1 + 2 bài bù (≥ 3 × CAU_MOT_BAI câu) ⇒ chuỗi sống lại đúng số cũ
//     (ngày lỡ không cộng). Tối đa 1 lần mỗi tuần (tuần tính từ thứ Hai của ngày lỡ). Hôm sau chính là hôm nay mà chưa đủ ⇒ trả `cuu` để giao diện nhắc.
//   · HÔM NAY chưa đạt ⇒ chuỗi giữ tới hôm qua (không về 0 lúc sáng sớm), lịch ghi 'cho'.
// Chừa sẵn cho chuỗi đôi («Học cùng bạn», chưa build): gọi `chuoiNgayCuaEm` cho từng em rồi so lịch.

export const CAU_MOT_BAI = 6
export const BAI_CUU = 2
export const SUC_CHUA_GOC = 2
export const SUC_CHUA_100 = 3
export const MOC_TANG_BINH = 30
export const MOC_SUC_CHUA = 100
/** Số ngày đọc lùi (đủ cho mọi chuỗi thực tế, chặn truy vấn). */
export const SO_NGAY_DOC = 400

export type KieuNgay = 'hoc' | 'binh' | 'phep' | 'cuu' | 'tat' | 'cho'
export interface NhatKyChuoi {
  /** ngày VN → số câu (khác nhau) có kết quả trong ngày, mọi nguồn */
  soCau: ReadonlyMap<string, number>
  /** ngày VN em tự sửa xong ít nhất một câu */
  tuSua: ReadonlySet<string>
  /** ngày VN em vắng có phép */
  phep: ReadonlySet<string>
  /** bình mua theo ngày VN */
  mua?: ReadonlyMap<string, number>
}
export interface ChuoiNgay {
  so: number
  giuChuoi: number
  sucChua: number
  lich7: { ngay: string; kieu: KieuNgay }[]
  cuu?: { hetHan: string; daLam: number; can: number; soCu: number }
  binhVuaDo?: string
}

const NGAY = 86_400_000
const ms = (ngay: string) => Date.parse(`${ngay}T00:00:00Z`)
const congNgay = (ngay: string, n: number) => new Date(ms(ngay) + n * NGAY).toISOString().slice(0, 10)
export const ngayVn = (luc: number) => new Date(luc + 7 * 3_600_000).toISOString().slice(0, 10)
/** Thứ Hai đầu tuần của ngày (VN). */
export const thuHaiCua = (ngay: string) => { const d = new Date(ms(ngay)).getUTCDay(); return congNgay(ngay, -((d + 6) % 7)) }
const laThuHai = (ngay: string) => new Date(ms(ngay)).getUTCDay() === 1

/** Chuỗi của MỘT em tại ngày `homNay` (VN) từ nhật ký. */
export function chuoiNgayCuaEm(nk: NhatKyChuoi, homNay: string): ChuoiNgay {
  const dat = (d: string) => (nk.soCau.get(d) ?? 0) >= CAU_MOT_BAI || nk.tuSua.has(d)
  const coHoatDong = [...nk.soCau.keys(), ...nk.tuSua, ...nk.phep].filter(d => d <= homNay).sort()
  const batDau = coHoatDong.length ? (coHoatDong[0]! > congNgay(homNay, -SO_NGAY_DOC) ? coHoatDong[0]! : congNgay(homNay, -SO_NGAY_DOC)) : homNay
  let so = 0, binh = 0, sucChua = SUC_CHUA_GOC, binhVuaDo: string | undefined
  let cuu: ChuoiNgay['cuu']
  const tuanDaCuu = new Set<string>(), lich = new Map<string, KieuNgay>()
  for (let d = batDau; d <= homNay; d = congNgay(d, 1)) {
    if (laThuHai(d)) binh = Math.min(sucChua, binh + 1)
    const mua = nk.mua?.get(d) ?? 0
    if (mua > 0) binh = Math.min(sucChua, binh + mua)
    if (dat(d)) {
      so++
      lich.set(d, 'hoc')
      if (so === MOC_TANG_BINH) binh = Math.min(sucChua, binh + 1)
      if (so >= MOC_SUC_CHUA) sucChua = SUC_CHUA_100
      continue
    }
    if (d === homNay) { lich.set(d, 'cho'); continue } // hôm nay chưa xong ⇒ chuỗi giữ tới hôm qua
    if (nk.phep.has(d)) { lich.set(d, 'phep'); continue }
    if (so === 0) { lich.set(d, 'tat'); continue }
    if (binh > 0) { binh--; binhVuaDo = d; lich.set(d, 'binh'); continue }
    // Hết bình: cứu bằng 2 bài bù ngay hôm sau (một lần mỗi tuần).
    const sau = congNgay(d, 1), tuan = thuHaiCua(d)
    const soSau = nk.soCau.get(sau) ?? 0
    if (!tuanDaCuu.has(tuan) && soSau >= (1 + BAI_CUU) * CAU_MOT_BAI) { tuanDaCuu.add(tuan); lich.set(d, 'cuu'); continue }
    if (sau === homNay && !tuanDaCuu.has(tuan)) {
      // Còn trong hạn cứu: chuỗi tạm tắt, giao diện nhắc học bù. Bài của hôm nay tính bài đầu; phần dư mới là bài bù.
      cuu = { hetHan: new Date(ms(homNay) + NGAY - 7 * 3_600_000).toISOString(), daLam: Math.max(0, Math.floor(soSau / CAU_MOT_BAI) - 1), can: BAI_CUU, soCu: so }
    }
    so = 0
    lich.set(d, 'tat')
  }
  const lich7 = Array.from({ length: 7 }, (_, i) => congNgay(homNay, i - 6)).map(ngay => ({ ngay, kieu: lich.get(ngay) ?? 'tat' as KieuNgay }))
  return { so, giuChuoi: binh, sucChua, lich7, ...(cuu ? { cuu } : {}), ...(binhVuaDo ? { binhVuaDo } : {}) }
}
