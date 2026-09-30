// TU LUYỆN (thầy chốt 29/09: "đặt ở sảnh bật lại 4 chế độ, giữ nguyên thuật toán của từng chế độ … phần này ghi là tu luyện cho hs
// luyện thủ công không tính exp gì không liên quan gì đến các câu trong game, độc lập một chỗ, có thêm tổng hợp đánh giá").
//
// Tệp DÙNG CHUNG máy chủ (server/src/tu-luyen.ts) và máy em (src/components/tu-luyen/**):
//   · kiểu dữ liệu của hợp đồng /hs/tu-luyen/* (câu CÔNG KHAI không đáp án; kết quả sau nộp có đáp án + lời giải);
//   · CHẤM một câu bằng luật chung của app (Phần III: `khopPhanIII` — một luật cho mọi kênh);
//   · đổi CauLuyen → câu công khai / lời giải có cấu trúc cho `TheCau`;
//   · thanh chọn số câu (giữ đúng luật kẹp của khối Khắc phục cũ);
//   · TỔNG HỢP ĐÁNH GIÁ (hàm thuần, test được): tỉ lệ đúng theo tuần / dạng / sao / phần, chuỗi ngày, gợi ý dạng nên luyện.
// KHÔNG có chữ EXP, vàng, mảnh ở đây: Tu luyện độc lập hoàn toàn với game và kế hoạch ngày.
import type { LoiGiaiCauTruc } from '../data/examContent'
import type { CauLuyen, HinhCau } from './bai-tap-pdf'
import { khopPhanIII } from './cham-so'

export type CheDoTuLuyen = 1 | 2 | 3 | 4
export type PhanCau = 'I' | 'II' | 'III'

export const TEN_CHE_DO: Record<CheDoTuLuyen, string> = {
  1: 'Sửa câu sai',
  2: 'Dạng câu sai',
  3: 'Dạng bài',
  4: 'Tự do',
}
export const NHAN_PHAN_TU_LUYEN: Record<PhanCau, string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }

/** Trần số câu một lượt Tu luyện (máy chủ kẹp lại, không tin máy em). */
export const TRAN_CAU_TU_LUYEN = 100
/** Số câu mặc định của thanh chọn mọi chế độ (v3, thầy 30/09: "mặc định 10 câu/lượt"; thanh chọn vẫn kéo được). */
export const SO_CAU_MAC_DINH = 10

/** Một câu gửi xuống máy em KHI ĐANG LÀM: TUYỆT ĐỐI không có đáp án, lời giải, "em đã chọn … đáp án đúng là …". */
export interface CauCongKhai {
  qid: string
  phan: PhanCau
  text: string
  luaChon: string[] | null
  anhThanCau?: string
  anhLuaChon?: (string | undefined)[]
  hinh?: HinhCau[]
  bang?: string[][] | null
  /** Tên dạng (chữ đời thường, không mã). '' = chưa gắn. */
  tenDang: string
  sao: 0 | 1 | 2
  loai: 'ly_thuyet' | 'bai_tap' | 'chua_ro'
  /** Chế độ 1 (luật 30/09): "Luyện lần đầu" / "Luyện lại lần K". */
  nhanLuyen?: string
  /** Chế độ 1: "Sai gốc: Ca kiểm tra Ester · 29/09" / "Sai gốc: Chiến dịch … · Đoàn Hộ Tống · 30/09 và 2 lần khác". */
  saiGoc?: string
  /** Chế độ 1 (ôn cách quãng v3): "Còn 1 lần đúng nữa là khắc phục" khi câu đã đúng lần 1. */
  conMotLan?: string
}

/** Phần RIÊNG của câu — chỉ nằm trên máy chủ tới lúc em nộp. */
export interface CauRieng {
  qid: string
  phan: PhanCau
  dapAn: string
  chot: string
  lyDo: { khoa: string; dung: boolean; ly: string }[] | null
  buoc: string[] | null
  ketQua: string
  dangMa: string
  dangTen: string
  bai: string
  lop: string
  sao: 0 | 1 | 2
  /** Câu thuộc KHO CÂU SAI (chế độ 1) ⇒ chấm xong cập nhật ôn cách quãng. `saiCuoi` = lần sai gần nhất (ms) lúc rút. */
  khoSai?: true
  saiCuoi?: number
}

/** Kết quả chấm một câu (trả về SAU khi nộp, hoặc khi "Chấm từng câu"). */
export interface KetQuaCau {
  qid: string
  phan: PhanCau
  dung: boolean
  /** 0..1 — Đúng–sai tính theo số ý đúng (1 ý 0,1 · 2 ý 0,25 · 3 ý 0,5 · 4 ý 1). */
  diem: number
  traLoi: string
  dapAn: string
  /** Chỉ Phần II: số ý đúng (0..4). */
  yDung?: number
  loiGiai?: LoiGiaiCauTruc
  /** Câu vừa thuộc một ca kiểm tra đang bảo vệ ⇒ máy chủ chấm nhưng GIỮ đáp án + lời giải lại. */
  anDapAn?: true
  /** Câu của kho câu sai: "Đúng lần 1 — hẹn gặp lại câu này sau 1 ngày" / "Đã khắc phục câu này — rời kho câu sai" / … */
  khacPhuc?: string
}

const chuHoa = (v: unknown) => String(v ?? '').trim().toUpperCase()
/** "ĐSĐS" / "D S D S" / "đ,s,đ,s" → "DSDS" (chỉ còn D/S, Đ đổi D). Ô bỏ trống giữ dấu "-". */
export function chuanDungSai(v: unknown): string {
  return chuHoa(v).replace(/Đ/g, 'D').replace(/[^DS-]/g, '')
}

/** ĐIỂM ĐÚNG–SAI chuẩn chương trình 2018: số ý đúng 1/2/3/4 ⇒ 0,1 / 0,25 / 0,5 / 1. */
export function diemDungSai(yDung: number): number {
  return yDung >= 4 ? 1 : yDung === 3 ? 0.5 : yDung === 2 ? 0.25 : yDung === 1 ? 0.1 : 0
}

/**
 * CHẤM MỘT CÂU TU LUYỆN — luật chung của app:
 *   · Phần I: chữ A–D khớp đáp án (không phân biệt hoa/thường, bỏ dấu chấm/ngoặc thừa);
 *   · Phần II: từng ý Đ/S theo đúng vị trí; ĐÚNG khi đủ 4 ý; điểm theo `diemDungSai`;
 *   · Phần III: `khopPhanIII` (một luật cho mọi kênh — "0,540" = "0,54", "2,5×10^-3", đơn vị viết theo…).
 * Bỏ trống ⇒ sai, 0 điểm.
 */
export function chamCauTuLuyen(phan: PhanCau, dapAn: string, traLoi: string): { dung: boolean; diem: number; yDung?: number } {
  if (phan === 'I') {
    const a = chuHoa(traLoi).replace(/[.)\s]+$/, '')
    const d = chuHoa(dapAn).replace(/[.)\s]+$/, '')
    const dung = /^[A-D]$/.test(a) && a === d
    return { dung, diem: dung ? 1 : 0 }
  }
  if (phan === 'II') {
    const d = chuanDungSai(dapAn), a = chuanDungSai(traLoi)
    let yDung = 0
    for (let i = 0; i < 4; i++) if ((a[i] === 'D' || a[i] === 'S') && a[i] === d[i]) yDung++
    return { dung: yDung === 4, diem: diemDungSai(yDung), yDung }
  }
  const dung = !!String(traLoi ?? '').trim() && khopPhanIII(traLoi, dapAn)
  return { dung, diem: dung ? 1 : 0 }
}

/** CauLuyen (kho, CÓ đáp án) → câu công khai. Chỉ chép trường được phép — không chép `chuaCho` (có "đáp án đúng là …"). */
export function cauCongKhaiTu(c: CauLuyen, tenDang: string): CauCongKhai {
  const ra: CauCongKhai = {
    qid: c.id,
    phan: c.phan,
    text: c.text,
    luaChon: c.luaChon ? [...c.luaChon] : null,
    tenDang,
    sao: c.sao === 2 || c.sao === 1 ? c.sao : 0,
    loai: c.dang === 'ly_thuyet' || c.dang === 'bai_tap' ? c.dang : 'chua_ro',
  }
  if (c.anhThanCau) ra.anhThanCau = c.anhThanCau
  if (c.anhLuaChon && c.anhLuaChon.some(Boolean)) ra.anhLuaChon = [...c.anhLuaChon]
  if (c.hinh && c.hinh.length) ra.hinh = c.hinh.map((h) => ({ src: h.src, viTri: h.viTri, ...(h.alt ? { alt: h.alt } : {}) }))
  if (c.bang && c.bang.length) ra.bang = c.bang
  return ra
}

/** Lời giải của CauLuyen → khuôn có cấu trúc `TheCau` đọc (chế độ xem lại). Không có gì ⇒ undefined (TheCau tự nói "chưa có lời giải"). */
export function loiGiaiTuCauRieng(c: Pick<CauRieng, 'phan' | 'chot' | 'lyDo' | 'buoc' | 'ketQua'>): LoiGiaiCauTruc | undefined {
  const coLy = !!c.lyDo && c.lyDo.some((x) => x.ly.trim())
  if (!c.chot.trim() && !coLy && !(c.buoc && c.buoc.length) && !c.ketQua.trim()) return undefined
  const ra: LoiGiaiCauTruc = { chot: c.chot }
  if (c.lyDo && c.phan === 'I') {
    ra.tungPa = {}
    for (const p of c.lyDo) if (/^[A-D]$/.test(p.khoa)) ra.tungPa[p.khoa as 'A' | 'B' | 'C' | 'D'] = { dung: p.dung, viSao: p.ly }
  }
  if (c.lyDo && c.phan === 'II') {
    ra.tungY = {}
    for (const p of c.lyDo) if (/^[a-d]$/.test(p.khoa)) ra.tungY[p.khoa as 'a' | 'b' | 'c' | 'd'] = { dung: p.dung, viSao: p.ly }
  }
  if (c.buoc && c.buoc.length) ra.buoc = [...c.buoc]
  if (c.phan === 'III' && c.ketQua.trim()) ra.ketQua = c.ketQua
  return ra
}

// ------------------------------------------------------------------ thanh chọn số câu (luật kẹp của khối cũ)

/** Chế độ 2: `min(tối đa, max(1, trước > 0 ? trước : min(tối đa, số câu sai × 2)))`; tối đa 0 ⇒ 0. */
export function kepSoCauCheDo2(truoc: number, tongToiDa: number, soCauSai: number): number {
  if (tongToiDa <= 0) return 0
  return Math.min(tongToiDa, Math.max(1, truoc > 0 ? truoc : Math.min(tongToiDa, soCauSai * 2)))
}
/** Chế độ 3: `min(tối đa, max(5, min(trước, 50)))`. */
export function kepSoCauCheDo3(truoc: number, tongToiDa: number): number {
  if (tongToiDa <= 0) return truoc
  return Math.min(tongToiDa, Math.max(5, Math.min(truoc, 50)))
}
/** Chế độ 4: `min(tối đa, max(1, min(trước > 0 ? trước : 20, 50)))`; tối đa 0 ⇒ 0. */
export function kepSoCauCheDo4(truoc: number, tongToiDa: number): number {
  if (tongToiDa <= 0) return 0
  return Math.min(tongToiDa, Math.max(1, Math.min(truoc > 0 ? truoc : 20, 50)))
}

// ------------------------------------------------------------------ TỔNG HỢP ĐÁNH GIÁ

/** Một câu đã nộp (dòng `tu_luyen_cau`). `luc` = mili-giây lúc nộp. */
export interface DongCauTuLuyen {
  luotId: string
  cheDo: CheDoTuLuyen
  luc: number
  qid: string
  phan: PhanCau
  dung: boolean
  dangMa: string
  dangTen: string
  bai: string
  lop: string
  sao: 0 | 1 | 2
  giay: number
}
/** Một lượt đã nộp (dòng `tu_luyen_luot`). */
export interface DongLuotTuLuyen {
  id: string
  cheDo: CheDoTuLuyen
  tieuDe: string
  taoLuc: number
  nopLuc: number
  soCau: number
  soDung: number
  giay: number
}

export interface TiLe { soCau: number; soDung: number; tiLe: number }
export interface TongHopDang extends TiLe {
  khoa: string
  ma: string
  ten: string
  bai: string
  lop: string
  soLuot: number
  /** Tỉ lệ đúng ở LƯỢT ĐẦU có dạng này và ở LƯỢT GẦN NHẤT. */
  tiLeDau: number
  tiLeCuoi: number
  /** tiLeCuoi − tiLeDau (điểm phần trăm, −100..100); null khi mới luyện một lượt. */
  tienBo: number | null
  lanCuoi: number
}
export interface TuanTuLuyen extends TiLe { batDau: string; nhan: string }
export interface TongHopTuLuyen {
  soLuot: number
  soCau: number
  soDung: number
  tiLe: number
  tongGiay: number
  soNgayLuyen: number
  chuoiHienTai: number
  chuoiDaiNhat: number
  theoTuan: TuanTuLuyen[]
  theoDang: TongHopDang[]
  manhNhat: TongHopDang | null
  yeuNhat: TongHopDang | null
  tienBoNhat: TongHopDang | null
  theoSao: Record<'0' | '1' | '2', TiLe>
  theoPhan: Record<PhanCau, TiLe>
  theoCheDo: Record<CheDoTuLuyen, { soLuot: number } & TiLe>
  goiY: TongHopDang[]
  /** Lượt gần nhất trước (mới → cũ), tối đa 10. */
  ganDay: DongLuotTuLuyen[]
}

const NGAY = 86_400_000
const GIO_VN = 7 * 3_600_000
/** Số ngày (theo giờ Việt Nam) kể từ 01/01/1970. */
export const ngaySoVn = (ms: number): number => Math.floor((ms + GIO_VN) / NGAY)
const phanTram = (dung: number, tong: number) => (tong > 0 ? Math.round((1000 * dung) / tong) / 10 : 0)
const tiLeRong = (): TiLe => ({ soCau: 0, soDung: 0, tiLe: 0 })
const cong = (t: TiLe, dung: boolean) => { t.soCau++; if (dung) t.soDung++; t.tiLe = phanTram(t.soDung, t.soCau) }
const ddmm = (ngaySo: number) => {
  const d = new Date(ngaySo * NGAY)
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
/** Khoá gom dạng: mã khi có, không thì tên (chuẩn hoá khoảng trắng/hoa thường). */
export const khoaDang = (ma: string, ten: string): string => (ma.trim() ? `m:${ma.trim()}` : ten.trim() ? `t:${ten.trim().toLowerCase().replace(/\s+/g, ' ')}` : '')

/** Số câu tối thiểu của một dạng để được xếp "mạnh nhất / yếu nhất" (ít hơn thì con số chưa nói được gì). */
export const CAU_TOI_THIEU_XEP_HANG = 3

/**
 * TỔNG HỢP ĐÁNH GIÁ cho màn Tu luyện — hàm thuần. `now` để tính chuỗi ngày và 8 tuần gần nhất (tuần bắt đầu Thứ Hai, giờ Việt Nam).
 * Chuỗi ngày: số ngày LIỀN có ít nhất một lượt đã nộp, tính tới hôm nay (hoặc hôm qua nếu hôm nay chưa luyện — chuỗi chưa đứt).
 */
export function tongHopTuLuyen(luot: readonly DongLuotTuLuyen[], cau: readonly DongCauTuLuyen[], now: number): TongHopTuLuyen {
  const theoSao: TongHopTuLuyen['theoSao'] = { '0': tiLeRong(), '1': tiLeRong(), '2': tiLeRong() }
  const theoPhan: TongHopTuLuyen['theoPhan'] = { I: tiLeRong(), II: tiLeRong(), III: tiLeRong() }
  const theoCheDo = { 1: { soLuot: 0, ...tiLeRong() }, 2: { soLuot: 0, ...tiLeRong() }, 3: { soLuot: 0, ...tiLeRong() }, 4: { soLuot: 0, ...tiLeRong() } } as TongHopTuLuyen['theoCheDo']
  const tong = tiLeRong()
  for (const l of luot) if (theoCheDo[l.cheDo]) theoCheDo[l.cheDo].soLuot++

  // 8 tuần gần nhất, cũ → mới
  const homNay = ngaySoVn(now)
  const thu = (new Date(homNay * NGAY).getUTCDay() + 6) % 7 // 0 = Thứ Hai
  const dauTuanNay = homNay - thu
  const theoTuan: TuanTuLuyen[] = Array.from({ length: 8 }, (_, i) => {
    const bd = dauTuanNay - (7 - i) * 7
    return { batDau: String(bd), nhan: ddmm(bd), ...tiLeRong() }
  })

  type Gom = { dong: DongCauTuLuyen; theoLuot: Map<string, { luc: number; tl: TiLe }>; tl: TiLe; lanCuoi: number }
  const dang = new Map<string, Gom>()
  for (const c of [...cau].sort((a, b) => a.luc - b.luc)) {
    cong(tong, c.dung)
    const s = String(c.sao === 2 || c.sao === 1 ? c.sao : 0) as '0' | '1' | '2'
    cong(theoSao[s], c.dung)
    if (theoPhan[c.phan]) cong(theoPhan[c.phan], c.dung)
    if (theoCheDo[c.cheDo]) cong(theoCheDo[c.cheDo], c.dung)
    const tuan = Math.floor((ngaySoVn(c.luc) - (dauTuanNay - 49)) / 7)
    if (tuan >= 0 && tuan < 8) cong(theoTuan[tuan], c.dung)
    const k = khoaDang(c.dangMa, c.dangTen)
    if (!k) continue
    let g = dang.get(k)
    if (!g) { g = { dong: c, theoLuot: new Map(), tl: tiLeRong(), lanCuoi: 0 }; dang.set(k, g) }
    cong(g.tl, c.dung)
    g.lanCuoi = Math.max(g.lanCuoi, c.luc)
    if (!g.dong.bai && c.bai) g.dong = { ...g.dong, bai: c.bai }
    if (!g.dong.lop && c.lop) g.dong = { ...g.dong, lop: c.lop }
    let l = g.theoLuot.get(c.luotId)
    if (!l) { l = { luc: c.luc, tl: tiLeRong() }; g.theoLuot.set(c.luotId, l) }
    cong(l.tl, c.dung)
  }

  const theoDang: TongHopDang[] = [...dang.entries()].map(([khoa, g]) => {
    const dsLuot = [...g.theoLuot.values()].sort((a, b) => a.luc - b.luc)
    const dau = dsLuot[0].tl.tiLe, cuoi = dsLuot[dsLuot.length - 1].tl.tiLe
    return {
      khoa,
      ma: g.dong.dangMa,
      ten: g.dong.dangTen || g.dong.dangMa,
      bai: g.dong.bai,
      lop: g.dong.lop,
      ...g.tl,
      soLuot: dsLuot.length,
      tiLeDau: dau,
      tiLeCuoi: cuoi,
      tienBo: dsLuot.length >= 2 ? Math.round((cuoi - dau) * 10) / 10 : null,
      lanCuoi: g.lanCuoi,
    }
  }).sort((a, b) => b.soCau - a.soCau || a.ten.localeCompare(b.ten, 'vi'))

  const duCau = theoDang.filter((d) => d.soCau >= CAU_TOI_THIEU_XEP_HANG)
  const manhNhat = duCau.length ? [...duCau].sort((a, b) => b.tiLe - a.tiLe || b.soCau - a.soCau)[0] : null
  const yeuNhat = duCau.length ? [...duCau].sort((a, b) => a.tiLe - b.tiLe || b.soCau - a.soCau)[0] : null
  const coTienBo = theoDang.filter((d) => d.tienBo !== null && d.tienBo > 0)
  const tienBoNhat = coTienBo.length ? [...coTienBo].sort((a, b) => (b.tienBo ?? 0) - (a.tienBo ?? 0) || b.soCau - a.soCau)[0] : null

  // GỢI Ý: dạng tỉ lệ đúng dưới 80 % (ít nhất 2 câu), thấp nhất trước; bằng nhau thì dạng lâu chưa luyện trước. Tối đa 3.
  const goiY = theoDang
    .filter((d) => d.soCau >= 2 && d.tiLe < 80)
    .sort((a, b) => a.tiLe - b.tiLe || a.lanCuoi - b.lanCuoi)
    .slice(0, 3)

  // Chuỗi ngày
  const ngay = [...new Set(luot.map((l) => ngaySoVn(l.nopLuc)).concat(cau.map((c) => ngaySoVn(c.luc))))].sort((a, b) => a - b)
  let chuoiDaiNhat = 0, dem = 0
  for (let i = 0; i < ngay.length; i++) {
    dem = i > 0 && ngay[i] === ngay[i - 1] + 1 ? dem + 1 : 1
    if (dem > chuoiDaiNhat) chuoiDaiNhat = dem
  }
  const coNgay = new Set(ngay)
  let chuoiHienTai = 0
  let d = coNgay.has(homNay) ? homNay : coNgay.has(homNay - 1) ? homNay - 1 : null
  while (d !== null && coNgay.has(d)) { chuoiHienTai++; d-- }

  const ganDay = [...luot].sort((a, b) => b.nopLuc - a.nopLuc).slice(0, 10)
  return {
    soLuot: luot.length,
    soCau: tong.soCau,
    soDung: tong.soDung,
    tiLe: tong.tiLe,
    tongGiay: luot.reduce((n, l) => n + Math.max(0, l.giay || 0), 0),
    soNgayLuyen: ngay.length,
    chuoiHienTai,
    chuoiDaiNhat,
    theoTuan,
    theoDang,
    manhNhat,
    yeuNhat,
    tienBoNhat,
    theoSao,
    theoPhan,
    theoCheDo,
    goiY,
    ganDay,
  }
}

/** Mục dạng bài trong danh mục Lớp → Bài → Dạng (máy chủ `danhMucDangBai`). */
export interface MucDangBai { ma: string; ten: string; soCau: number }
export interface BaiDangBai { tenBai: string; dangs: MucDangBai[] }
export interface LopDangBaiTL { lop: string; bais: BaiDangBai[] }

const chuanTen = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
/** Tìm dạng trong danh mục (để bấm gợi ý là rút chế độ Dạng bài): khớp MÃ trước, rồi TÊN dạng (bỏ khác biệt hoa/thường, khoảng trắng). */
export function timDangTrongDanhMuc(dm: readonly LopDangBaiTL[], ma: string, ten: string): { lop: string; tenBai: string; dang: MucDangBai } | null {
  const t = chuanTen(ten)
  let theoTen: { lop: string; tenBai: string; dang: MucDangBai } | null = null
  for (const l of dm) for (const b of l.bais) for (const d of b.dangs) {
    if (ma && d.ma === ma) return { lop: l.lop, tenBai: b.tenBai, dang: d }
    if (!theoTen && t && chuanTen(d.ten) === t) theoTen = { lop: l.lop, tenBai: b.tenBai, dang: d }
  }
  return theoTen
}

/** "12 phút 05 giây" / "45 giây" / "1 giờ 03 phút". */
export function chuThoiGian(giay: number): string {
  const g = Math.max(0, Math.round(giay))
  const h = Math.floor(g / 3600), m = Math.floor((g % 3600) / 60), s = g % 60
  if (h > 0) return `${h} giờ ${String(m).padStart(2, '0')} phút`
  if (m > 0) return `${m} phút ${String(s).padStart(2, '0')} giây`
  return `${s} giây`
}
