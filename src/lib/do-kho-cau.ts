// ĐỘ KHÓ CỦA MỘT CÂU — BA NGUỒN ĐO ĐƯỢC, KHÔNG NGUỒN NÀO LÀ DỰ ĐOÁN.
//
// Đặc tả: GOI-LEN-BANG-80-PHUT.md mục 4.2 và 4.3.
//
//   N1  lớp này vừa làm CHÍNH CÂU ĐÓ ở ca đầu giờ   — tin nhất
//   N2  câu đó đã chạy ở ca trước, bất kỳ lớp nào    — theo cỡ mẫu
//   N3  nhãn thầy đã chấm trong kho (`sao`)          — luôn có (4 271/4 271 câu)
//
// HAI CHỖ BẢN PROMPT VIẾT LỆCH, sửa ở đây chứ không chép theo:
//
//  · "n = số em nộp của ca" — SAI từ khi có đề riêng từng em. Ca 335663 có 41 em
//    nhưng 84 qid khác nhau, mỗi câu chỉ vài em làm. Nên `n` tính theo TỪNG CÂU.
//  · "N2 cần ≥ 30 lượt" — hôm nay đúng 1/814 qid đạt. Thay bằng cận dưới Wilson,
//    có tác dụng từ 8 lượt mà vẫn tự dè chừng khi mẫu bé.
//
// LUẬT VÀNG CỦA TỆP NÀY: mọi con số ra ngoài đều đi kèm CỠ MẪU và TÊN NGUỒN.
// Không có dạng chữ thứ tư ngoài ba dạng ở `chuNguon`.
import { chuanChuyenDe, type CauChua, type MucDo } from './phan-cong'
import { BAC } from './goi-len-bang'
import {
  canDuoiWilson,
  CAU_HINH_LEN_BANG_MAC_DINH,
  type CauHinhLenBang,
  type NguyenNhanSai,
} from './len-bang-cau-hinh'

/** Một em làm một câu, kèm giây nếu ca có ghi. */
export interface BaiLamCoGiay {
  sbd: string
  idCau: string
  dung: boolean
  chon?: string
  dapAnDung?: string
  giay?: number | null
}

/** Kho lịch sử: qid → đã chạy bao nhiêu lượt, đúng bao nhiêu. */
export interface MucKhoDoKho {
  soLuot: number
  soDung: number
  soCa?: number
  capNhatLuc?: string
}
export type KhoDoKho = Record<string, MucKhoDoKho>

export type TenNguon = 'N1' | 'N2' | 'N3'

export interface DoKhoCau {
  cau: CauChua
  /** Ca đầu giờ. `null` = không đủ cỡ mẫu để kết luận. */
  n1: { n: number; sai: number } | null
  /** Lịch sử. `null` = không đủ cỡ mẫu. */
  n2: { n: number; dung: number; canDuoi: number; soCa: number } | null
  /** 1 − tỉ lệ đúng (đã dè chừng theo cỡ mẫu). */
  doKho: number
  /** sao / 2. */
  cotLoi: number
  /** 0,6·doKho + 0,4·cotLoi — giá trị nội dung của câu, chưa tính em nào. */
  giaTri: number
  nguon: TenNguon
  batBuoc: boolean
  viSaoBatBuoc: string
  /** Dòng chữ để in ra giáo án. LUÔN có cỡ mẫu. */
  chuNguon: string
}

/** Trung vị. Mảng rỗng trả 0. */
export function trungVi(xs: number[]): number {
  if (!xs.length) return 0
  const a = [...xs].sort((x, y) => x - y)
  const g = Math.floor(a.length / 2)
  return a.length % 2 ? a[g] : (a[g - 1] + a[g]) / 2
}

/** Ca này có đủ dữ liệu thời gian để đọc nguyên nhân sai không.
 *
 * Đo 10/09: bốn ca lớn nhất có 99%, 98%, 71%, 12% số dòng còn giây. Ca 12% mà
 * vẫn lấy trung vị ra chấm nguyên nhân là chấm bằng rác — nên đo trước, rồi mới
 * quyết có bật hai luật đọc thời gian hay không. */
export function caCoDuGiay(baiLam: BaiLamCoGiay[], ch: CauHinhLenBang = CAU_HINH_LEN_BANG_MAC_DINH): boolean {
  if (!baiLam.length) return false
  const co = baiLam.filter((b) => typeof b.giay === 'number' && (b.giay as number) > 0).length
  return co / baiLam.length >= ch.TI_LE_CO_GIAY_TOI_THIEU
}

// --------------------------------------------------------------- ba nguồn số

/** Dựng độ khó cho từng câu. `khoDoKho` rỗng thì N2 tự tắt, không phải lỗi. */
export function dungDoKho(
  dsCau: CauChua[],
  baiLam: BaiLamCoGiay[],
  kho: KhoDoKho,
  ch: CauHinhLenBang = CAU_HINH_LEN_BANG_MAC_DINH,
): DoKhoCau[] {
  const theoCau = new Map<string, BaiLamCoGiay[]>()
  for (const b of baiLam) {
    const a = theoCau.get(b.idCau)
    if (a) a.push(b)
    else theoCau.set(b.idCau, [b])
  }

  return dsCau.map((cau) => {
    const bl = theoCau.get(cau.id) || []
    // CỠ MẪU CỦA CHÍNH CÂU NÀY, không phải số em nộp của ca.
    const nN1 = bl.length
    const saiN1 = bl.filter((b) => !b.dung).length
    const n1 = nN1 >= ch.N1_CO_MAU_TOI_THIEU ? { n: nN1, sai: saiN1 } : null

    const k = kho[cau.id]
    const n2 =
      k && k.soLuot >= ch.N2_CO_MAU_TOI_THIEU
        ? {
            n: k.soLuot,
            dung: k.soDung,
            canDuoi: canDuoiWilson(k.soDung, k.soLuot, ch.DO_TIN_WILSON),
            soCa: k.soCa ?? 0,
          }
        : null

    const cotLoi = cau.sao / 2
    let doKho: number
    let nguon: TenNguon
    let chuNguon: string
    if (n1) {
      // N1 dùng cận dưới Wilson y như N2: 8 em cũng là mẫu bé.
      doKho = 1 - canDuoiWilson(n1.n - n1.sai, n1.n, ch.DO_TIN_WILSON)
      nguon = 'N1'
      chuNguon = `lớp vừa rồi: ${n1.sai}/${n1.n} em sai`
    } else if (n2) {
      doKho = 1 - n2.canDuoi
      nguon = 'N2'
      chuNguon = `lịch sử: ${n2.dung}/${n2.n} lượt đúng (${Math.round((100 * n2.dung) / n2.n)}%, cận dưới ${Math.round(100 * n2.canDuoi)}%)${n2.soCa ? ` qua ${n2.soCa} ca` : ''}`
    } else {
      // Không N1, không N2 ⇒ chỉ còn nhãn kho. KHÔNG suy ra độ khó từ đâu khác.
      doKho = cotLoi
      nguon = 'N3'
      chuNguon = `kho: sao ${cau.sao}${cau.lyDoSao ? ` — "${cau.lyDoSao}"` : ''}`
    }

    const giaTri = 0.6 * doKho + 0.4 * cotLoi

    let batBuoc = false
    let viSaoBatBuoc = ''
    if (cau.sao === 2) {
      batBuoc = true
      viSaoBatBuoc = `kho: sao 2${cau.lyDoSao ? ` — "${cau.lyDoSao}"` : ''}`
    } else if (n1 && n1.sai / n1.n >= ch.N1_TI_LE_SAI_BAT_BUOC) {
      batBuoc = true
      viSaoBatBuoc = `lớp vừa rồi: ${n1.sai}/${n1.n} em sai`
    } else if (n2 && n2.canDuoi <= ch.N2_CAN_DUOI_WILSON) {
      batBuoc = true
      viSaoBatBuoc = `lịch sử: ${n2.dung}/${n2.n} lượt đúng, cận dưới ${Math.round(100 * n2.canDuoi)}%`
    }

    return { cau, n1, n2, doKho, cotLoi, giaTri, nguon, batBuoc, viSaoBatBuoc, chuNguon }
  })
}

/** Câu không N1, không N2 và sao 0 ⇒ không đủ căn cứ gọi là khó ⇒ chỉ đọc đáp
 * án. Đây là chốt chặn "cấm mọi con số không thuộc N1/N2/N3". */
export function khongDuCanCu(d: DoKhoCau): boolean {
  return !d.n1 && !d.n2 && d.cau.sao === 0
}

// ------------------------------------------------------- nguyên nhân em sai

export interface VapCuaEm {
  sbd: string
  idCau: string
  chuyenDe: string
  mucDo: MucDo | ''
  nguyenNhan: NguyenNhanSai
  chon: string
  /** Bao nhiêu em cùng chọn phương án sai ấy / bao nhiêu em làm câu ấy. */
  cungChon: number
  soEmLam: number
}

/** Phương án sai được nhiều em chọn nhất ở một câu, và số em chọn nó. */
function damDongSai(bl: BaiLamCoGiay[]): { chon: string; dem: number } {
  const dem = new Map<string, number>()
  for (const b of bl) if (!b.dung && b.chon) dem.set(b.chon, (dem.get(b.chon) || 0) + 1)
  let chon = ''
  let n = 0
  for (const [c, d] of dem) if (d > n) [chon, n] = [c, d]
  return { chon, dem: n }
}

function soHoc(s: string | undefined): number | null {
  if (!s) return null
  const v = Number(String(s).replace(',', '.').trim())
  return Number.isFinite(v) ? v : null
}

/** ĐỌC NGUYÊN NHÂN EM SAI MỘT CÂU.
 *
 * `coGiay = false` ⇒ BỎ HẲN hai luật đọc thời gian (`tinh_sai` theo lệch số vẫn
 * giữ vì nó không dùng đồng hồ; `doan` thì tắt). Không đoán bừa khi thiếu dữ
 * liệu — đó là luật "không lặng lẽ sai". */
export function nguyenNhanSai(
  b: BaiLamCoGiay,
  cau: CauChua,
  bl: BaiLamCoGiay[],
  tbGiay: number,
  coGiay: boolean,
): NguyenNhanSai {
  if (b.dung) return 'khong_ro'
  const chon = (b.chon || '').trim()
  if (!chon) return 'chua_biet'

  const g = typeof b.giay === 'number' ? b.giay : null
  if (coGiay && g !== null && tbGiay > 0) {
    if (g < 0.35 * tbGiay) return 'doan'
    if (g > 2.5 * tbGiay) return 'chua_biet'
  }

  const dd = damDongSai(bl)
  const trongDai = !coGiay || g === null || tbGiay <= 0 || (g >= 0.5 * tbGiay && g <= 2 * tbGiay)
  if (dd.chon && chon === dd.chon && dd.dem >= 2 && trongDai) return 'hieu_nham'

  // Phần III: lệch dưới 15% đáp án ⇒ phương pháp đúng, hỏng một bước tính.
  // (Nửa còn lại của luật gốc — "chọn phương án là kết quả một bước tính hỏng
  // điển hình" — cần mô hình lời giải, chưa làm; không đoán thay.)
  if (cau.phan === 'III') {
    const c = soHoc(chon)
    const d = soHoc(b.dapAnDung)
    if (c !== null && d !== null && d !== 0 && Math.abs(c - d) / Math.abs(d) < 0.15) return 'tinh_sai'
  }

  return 'khong_ro'
}

/** Toàn bộ chỗ vấp của cả lớp trong ca này, gom theo SBD. */
export function vapCuaLop(
  dsCau: CauChua[],
  baiLam: BaiLamCoGiay[],
  ch: CauHinhLenBang = CAU_HINH_LEN_BANG_MAC_DINH,
): { theoEm: Map<string, VapCuaEm[]>; coGiay: boolean } {
  const coGiay = caCoDuGiay(baiLam, ch)
  const theoCau = new Map<string, BaiLamCoGiay[]>()
  for (const b of baiLam) {
    const a = theoCau.get(b.idCau)
    if (a) a.push(b)
    else theoCau.set(b.idCau, [b])
  }
  const theoEm = new Map<string, VapCuaEm[]>()
  for (const cau of dsCau) {
    const bl = theoCau.get(cau.id) || []
    if (!bl.length) continue
    const tb = trungVi(bl.map((b) => (typeof b.giay === 'number' ? b.giay : 0)).filter((g) => g > 0))
    const dd = damDongSai(bl)
    for (const b of bl) {
      if (b.dung) continue
      const nn = nguyenNhanSai(b, cau, bl, tb, coGiay)
      const v: VapCuaEm = {
        sbd: b.sbd,
        idCau: cau.id,
        chuyenDe: cau.chuyenDe,
        mucDo: cau.mucDo,
        nguyenNhan: nn,
        chon: (b.chon || '').trim(),
        cungChon: (b.chon || '').trim() && (b.chon || '').trim() === dd.chon ? dd.dem : 0,
        soEmLam: bl.length,
      }
      const a = theoEm.get(b.sbd)
      if (a) a.push(v)
      else theoEm.set(b.sbd, [v])
    }
  }
  return { theoEm, coGiay }
}

/** Giao câu THẤP HƠN ĐÚNG MỘT BẬC chỗ em vấp — bảng là chỗ công khai. */
export function heSoCapDo(cauMucDo: MucDo | '', vapMucDo: MucDo | '', ch: CauHinhLenBang): number {
  if (!cauMucDo || !vapMucDo) return ch.HE_SO_CAP_DO.cung_bac
  const d = BAC.indexOf(cauMucDo) - BAC.indexOf(vapMucDo)
  if (d < 0) return ch.HE_SO_CAP_DO.thap_hon
  if (d === 0) return ch.HE_SO_CAP_DO.cung_bac
  return ch.HE_SO_CAP_DO.cao_hon
}

export interface HopVoiEm {
  diem: number
  vap: VapCuaEm | null
  moi: number
}

/** HỢP VỚI EM = nguyên nhân × cấp độ × mới.
 *
 * `moi(e) = 1 / (1 + số lần lên bảng 30 ngày qua)`. Hôm nay máy chủ có 0 dòng
 * lịch sử lên bảng (`ghiTienDo_` không giữ cột nào cho việc ấy), nên `soLanLenBang`
 * vào đây bằng 0 cho mọi em và `moi = 1`. Màn phải NÓI RA điều đó, cấm in một
 * ngày lên bảng giả. */
export function hopVoiEm(
  cau: CauChua,
  vapCuaEmNay: VapCuaEm[],
  soLanLenBang: number,
  ch: CauHinhLenBang = CAU_HINH_LEN_BANG_MAC_DINH,
): HopVoiEm {
  const moi = 1 / (1 + Math.max(0, soLanLenBang))
  const cd = chuanChuyenDe(cau.chuyenDe)
  const cungCd = vapCuaEmNay.filter((v) => chuanChuyenDe(v.chuyenDe) === cd && v.idCau !== cau.id)
  if (!cungCd.length) return { diem: ch.HE_SO_KHONG_VAP * moi, vap: null, moi }

  let tot: { d: number; v: VapCuaEm } | null = null
  for (const v of cungCd) {
    const d = ch.HE_SO_NGUYEN_NHAN[v.nguyenNhan] * heSoCapDo(cau.mucDo, v.mucDo, ch)
    if (!tot || d > tot.d) tot = { d, v }
  }
  return { diem: (tot as { d: number; v: VapCuaEm }).d * moi, vap: (tot as { d: number; v: VapCuaEm }).v, moi }
}
