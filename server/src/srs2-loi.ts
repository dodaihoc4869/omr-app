// THUẬT TOÁN 2.0 (Game Hóa 2.0, thầy chốt 27/09/2026) — LÕI THUẦN, không đụng D1.
// Đặc tả: prompt-game-hoa-2-0.md mục B. Trạng thái từng câu KHÔNG lưu riêng: suy lại từ sổ `su_kien_hoc`
// (mọi nguồn: ca kiểm tra, game, lên bảng) bằng `phatLaiCau` — một nguồn sự thật, xoá đệm dựng lại vẫn ra y hệt.
//
// Bản tối ưu so với đặc tả gốc (đã trình thầy): so lịch theo NGÀY giờ VN; chuỗi đúng = 1 cũng hẹn lại;
// sai thì bỏ cờ thành thạo; đúng lần hai cùng ngày không cộng (trừ ngày cuối); câu đã thành thạo không ép ôn
// hằng ngày sát hạn; cắt tỉa = rời hẳn kế hoạch sang "Cần thầy dạy lại"; câu mới giữ chỗ để phủ 100% trước hạn 3 ngày;
// Huyết Chiến đếm theo LƯỢT cần (không đếm câu) và có trần 80.

export type Phan = 'I' | 'II' | 'III'

/** Câu thuộc phạm vi luyện của em. `nguon`: câu của chiến dịch đang chạy, nợ cũ, hay ôn duy trì. */
export interface CauSrs {
  qid: string
  phan: Phan
  mucDo: string | null
  dang: string | null
  nguon?: 'chien_dich' | 'no_cu' | 'duy_tri'
}

/** Một lần làm câu, đã lọc sẵn (bỏ sự kiện ca chưa công bố). `coGoiY` = máy chủ đã cho gợi ý M3 trước khi em trả lời. */
export interface LanLam {
  qid: string
  /** Ngày giờ Việt Nam YYYY-MM-DD. */
  ngay: string
  /** ISO 8601 — chỉ để xếp thứ tự trong ngày. */
  luc: string
  dung: boolean
  coGoiY: boolean
}

export interface TrangThaiCau {
  qid: string
  laMoi: boolean
  /** Chuỗi đúng liên tiếp (tính theo ngày khác nhau). */
  cc: number
  /** Số lần sai kể từ lần thầy dạy lại gần nhất. */
  lanSai: number
  thanhThao: boolean
  /** Ngày đến lịch ôn lại (ngày VN). `null` = chưa làm, hoặc không cần ôn thêm trước hạn nộp. */
  henOn: string | null
  ngayDungCuoi: string | null
  lanCuoiDung: boolean | null
  /** Sai ≥ 4 lần và lần cuối vẫn sai ⇒ rời kế hoạch, chờ thầy dạy lại. */
  catTia: boolean
  lichSu: { ngay: string; dung: boolean; coGoiY: boolean }[]
}

export const TRAN_NGAY = 40
export const TRAN_HUYET_CHIEN = 80
export const NGAY_DEM = 3
export const NGUONG_CAT_TIA = 4
export const TI_LE_DUY_TRI = 0.2
const HEN_DUNG_1 = 3
const HEN_DUNG_2 = 7
const HEN_DUNG_3 = 14
export const HEN_DUY_TRI = 30

// ---------------------------------------------------------------- ngày VN dạng chuỗi
const MOT_NGAY = 86_400_000
const msNgay = (ngay: string): number => Date.parse(`${ngay}T00:00:00Z`)
export const congNgay = (ngay: string, so: number): string => new Date(msNgay(ngay) + so * MOT_NGAY).toISOString().slice(0, 10)
/** Số ngày từ `a` tới `b` (b − a). */
export const soNgayGiua = (a: string, b: string): number => Math.round((msNgay(b) - msNgay(a)) / MOT_NGAY)
/** D: số ngày còn lại tới hạn nộp, TÍNH CẢ hôm nay (hạn nộp là 23:59 của ngày `hanNop`). Tối thiểu 1. */
export const soNgayConLai = (homNay: string, hanNop: string): number => Math.max(1, soNgayGiua(homNay, hanNop) + 1)

// ---------------------------------------------------------------- phát lại lịch sử một câu
/**
 * Hẹn ôn theo luật "ép chín sát hạn".
 * - Trước hạn: khoảng chuẩn nếu còn đủ ngày; không đủ ⇒ câu chưa thành thạo ôn ngày mai (ngày cuối: ngay trong ngày),
 *   câu đã thành thạo ôn chốt MỘT lần vào ngày áp chót (hết chỗ ⇒ không ôn thêm trước hạn).
 * - Sau hạn (nợ cũ, ôn duy trì): khoảng chuẩn, không nén; câu đã thành thạo hẹn ≥ 30 ngày.
 */
export function henOnSau(ngay: string, soNgayChuan: number, hanNop: string | null, daThanhThao: boolean): string {
  if (!hanNop || ngay > hanNop) return congNgay(ngay, daThanhThao ? Math.max(soNgayChuan, HEN_DUY_TRI) : soNgayChuan)
  const D = soNgayConLai(ngay, hanNop)
  if (D > soNgayChuan) return congNgay(ngay, soNgayChuan)
  if (daThanhThao) {
    const apChot = congNgay(hanNop, -1)
    // Hết chỗ ôn chốt trước hạn ⇒ không ôn thêm trong chiến dịch; sau hạn vào ôn duy trì.
    return apChot > ngay ? apChot : congNgay(ngay, HEN_DUY_TRI)
  }
  return D > 1 ? congNgay(ngay, 1) : ngay
}

/**
 * Trạng thái MỘT câu từ các lần làm (mọi nguồn). `mocDayLai`: các thời điểm thầy bấm "Chữa xong" cho câu này —
 * đếm sai về 0 và hẹn ôn ngày hôm sau.
 */
export function phatLaiCau(qid: string, lanLam: readonly LanLam[], hanNop: string | null, mocDayLai: readonly string[] = []): TrangThaiCau {
  const ds = [...lanLam].filter((x) => x.qid === qid).sort((a, b) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : 0))
  const moc = [...mocDayLai].sort()
  let iMoc = 0
  const tt: TrangThaiCau = { qid, laMoi: true, cc: 0, lanSai: 0, thanhThao: false, henOn: null, ngayDungCuoi: null, lanCuoiDung: null, catTia: false, lichSu: [] }
  const quaMoc = (den: string) => {
    while (iMoc < moc.length && moc[iMoc]! <= den) {
      tt.lanSai = 0
      tt.catTia = false
      if (!tt.laMoi) tt.henOn = congNgay(moc[iMoc]!.slice(0, 10), 1)
      iMoc++
    }
  }
  for (const x of ds) {
    quaMoc(x.luc)
    const D = hanNop && x.ngay <= hanNop ? soNgayConLai(x.ngay, hanNop) : Number.POSITIVE_INFINITY
    if (x.dung) {
      if (tt.laMoi || x.coGoiY) tt.cc = 1
      else if (tt.ngayDungCuoi !== x.ngay || D <= 1) tt.cc += 1
      tt.ngayDungCuoi = x.ngay
      tt.thanhThao = tt.cc >= 2
      const so = tt.cc >= 3 ? HEN_DUNG_3 : tt.cc === 2 ? HEN_DUNG_2 : HEN_DUNG_1
      tt.henOn = henOnSau(x.ngay, so, hanNop, tt.thanhThao)
    } else {
      tt.cc = 0
      tt.lanSai += 1
      tt.thanhThao = false
      tt.henOn = henOnSau(x.ngay, 1, hanNop, false)
    }
    tt.laMoi = false
    tt.lanCuoiDung = x.dung
    tt.lichSu.push({ ngay: x.ngay, dung: x.dung, coGoiY: x.coGoiY })
    tt.catTia = tt.lanSai >= NGUONG_CAT_TIA && !x.dung
  }
  quaMoc('9999')
  return tt
}

/** Bật gợi ý M3 cho lần làm tới: lần cuối sai, đã sai ≥ 2 lần, chưa cắt tỉa. */
export const canGoiY = (t: TrangThaiCau): boolean => !t.laMoi && t.lanCuoiDung === false && t.lanSai >= 2 && !t.catTia

// ---------------------------------------------------------------- kế hoạch ngày
export interface TuyChonKeHoach {
  homNay: string
  /** Hạn nộp của chiến dịch đang chạy (ngày VN). `null` ⇒ không có chiến dịch: chỉ ôn. */
  hanNop: string | null
  tranNgay?: number
  tranHuyetChien?: number
}

export interface KeHoachNgay {
  /** Câu cho Bát Linh Đảo: câu ôn Đúng–sai trước, rồi câu mới. Đúng thứ tự phục vụ. */
  dao: string[]
  /** Câu cho Đoàn Hộ Tống: câu ôn Trắc nghiệm, Trả lời ngắn. */
  doan: string[]
  huyetChien: boolean
  /** Số lượt tối thiểu còn cần để mọi câu (chưa cắt tỉa) thành thạo. */
  khoiLuong: number
  /** D × trần ngày. */
  sucChua: number
  D: number
  tran: number
  catTia: string[]
}

/** Băm tất định (FNV-1a) — hoà điểm xếp theo khoá, không dùng Math.random. */
export function bam(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

const HANG_MUC_DO: Record<string, number> = { NB: 0, 'Nhận biết': 0, TH: 1, 'Thông hiểu': 1, VD: 2, 'Vận dụng': 2, VDC: 3, 'Vận dụng cao': 3 }
const hangMucDo = (m: string | null): number => (m != null && m in HANG_MUC_DO ? HANG_MUC_DO[m]! : 9)

/** Trọng số câu ôn đến lịch: 50 + 20 × số ngày trễ + 80 nếu sắp chín (cc = 1) hoặc + 60 nếu vừa sai (cc = 0). */
export function trongSoOn(t: TrangThaiCau, homNay: string): number {
  const tre = t.henOn ? Math.max(0, soNgayGiua(t.henOn, homNay)) : 0
  return 50 + 20 * tre + (t.cc === 1 ? 80 : t.cc === 0 ? 60 : 0)
}

/** Lượt tối thiểu còn cần: câu mới 2, câu đang ôn 2 − cc; bỏ câu đã thành thạo và câu cắt tỉa. */
export function khoiLuongCan(ds: readonly TrangThaiCau[]): number {
  let s = 0
  for (const t of ds) {
    if (t.catTia || t.thanhThao) continue
    s += t.laMoi ? 2 : Math.max(0, 2 - t.cc)
  }
  return s
}

/** Câu mới: Nhận biết → Thông hiểu → Vận dụng; trong cùng mức xen kẽ dạng; hoà thì băm theo ngày. */
function xepCauMoi(ds: readonly CauSrs[], homNay: string): CauSrs[] {
  const theoMuc = new Map<number, CauSrs[]>()
  for (const c of ds) {
    const k = hangMucDo(c.mucDo)
    if (!theoMuc.has(k)) theoMuc.set(k, [])
    theoMuc.get(k)!.push(c)
  }
  const ra: CauSrs[] = []
  for (const k of [...theoMuc.keys()].sort((a, b) => a - b)) {
    const theoDang = new Map<string, CauSrs[]>()
    for (const c of theoMuc.get(k)!) {
      const d = c.dang ?? ''
      if (!theoDang.has(d)) theoDang.set(d, [])
      theoDang.get(d)!.push(c)
    }
    const hang = [...theoDang.entries()]
      .sort((a, b) => bam(`${homNay}|${a[0]}`) - bam(`${homNay}|${b[0]}`))
      .map(([, cs]) => cs.sort((a, b) => bam(`${homNay}|${a.qid}`) - bam(`${homNay}|${b.qid}`)))
    for (let i = 0; hang.some((h) => i < h.length); i++) for (const h of hang) if (i < h.length) ra.push(h[i]!)
  }
  return ra
}

/**
 * Lập kế hoạch MỘT ngày cho một em. `trangThai` phải có đủ mọi câu trong `cau` (câu chưa làm ⇒ trạng thái mới).
 * `daLamHomNay`: số câu của kế hoạch hôm nay em đã làm (trừ vào trần).
 */
export function lapKeHoachNgay(cau: readonly CauSrs[], trangThai: ReadonlyMap<string, TrangThaiCau>, tc: TuyChonKeHoach, daLamHomNay = 0): KeHoachNgay {
  const tranNgay = tc.tranNgay ?? TRAN_NGAY
  const tranHuyet = tc.tranHuyetChien ?? TRAN_HUYET_CHIEN
  const coChienDich = !!tc.hanNop && tc.homNay <= tc.hanNop
  const D = coChienDich ? soNgayConLai(tc.homNay, tc.hanNop!) : 1
  const tt = (c: CauSrs) => trangThai.get(c.qid)!
  const catTia = cau.filter((c) => tt(c).catTia).map((c) => c.qid)
  const song = cau.filter((c) => !tt(c).catTia)
  const cauChienDich = song.filter((c) => (c.nguon ?? 'chien_dich') === 'chien_dich')
  const khoiLuong = coChienDich ? khoiLuongCan(cauChienDich.map(tt)) : 0
  const huyetChien = coChienDich && khoiLuong > 0.9 * D * tranNgay
  const tran = Math.max(0, (huyetChien ? tranHuyet : tranNgay) - daLamHomNay)

  const moi = coChienDich ? xepCauMoi(cauChienDich.filter((c) => tt(c).laMoi), tc.homNay) : []
  const denLich = (c: CauSrs) => {
    const t = tt(c)
    return !t.laMoi && !!t.henOn && t.henOn <= tc.homNay
  }
  const xepOn = (ds: CauSrs[]) =>
    ds.sort((a, b) => trongSoOn(tt(b), tc.homNay) - trongSoOn(tt(a), tc.homNay) || bam(`${tc.homNay}|${a.qid}`) - bam(`${tc.homNay}|${b.qid}`))
  const on = xepOn(song.filter((c) => (c.nguon ?? 'chien_dich') !== 'duy_tri' && denLich(c)))
  const duyTri = xepOn(song.filter((c) => c.nguon === 'duy_tri' && denLich(c)))

  const quota = D > NGAY_DEM ? Math.ceil(moi.length / (D - NGAY_DEM)) : moi.length
  const layMoi = Math.min(moi.length, quota, tran)
  const layOn = Math.min(on.length, tran - layMoi)
  const layDuyTri = Math.min(duyTri.length, Math.floor(tran * TI_LE_DUY_TRI), tran - layMoi - layOn)
  const conDu = tran - layMoi - layOn - layDuyTri
  const chonMoi = moi.slice(0, layMoi + Math.max(0, conDu))
  const chonOn = [...on.slice(0, layOn), ...duyTri.slice(0, layDuyTri)]

  return {
    // Câu ôn Đúng–sai đứng TRƯỚC câu mới: dọn nợ cũ trước (cùng tinh thần khoá Đảo khi Đoàn còn câu ôn).
    dao: [...chonOn.filter((c) => c.phan === 'II').map((c) => c.qid), ...chonMoi.map((c) => c.qid)],
    doan: chonOn.filter((c) => c.phan !== 'II').map((c) => c.qid),
    huyetChien,
    khoiLuong,
    sucChua: D * tranNgay,
    D,
    tran: huyetChien ? tranHuyet : tranNgay,
    catTia,
  }
}

/** Huyết Chiến: từ câu thứ 41 trong ngày không rơi EXP, không rơi vật phẩm. `thuTu` đếm từ 1. */
export const duocThuongCauThu = (thuTu: number, tranNgay = TRAN_NGAY): boolean => thuTu <= tranNgay

/** Rương Bát Linh: mở khi xong trọn kế hoạch ngày (kế hoạch rỗng thì không có rương). */
export const moDuocRuong = (tongKeHoach: number, daLam: number): boolean => tongKeHoach > 0 && daLam >= tongKeHoach

/** Gợi ý M3 Phần I: gạch 2 trong 3 phương án sai, tất định theo khoá (em + câu + ngày). Không bao giờ gạch đáp án đúng. */
export function chonPhuongAnGach(dung: string, khoa: string): string[] {
  const sai = ['A', 'B', 'C', 'D'].filter((x) => x !== dung.toUpperCase())
  const giu = sai[bam(khoa) % sai.length]
  return sai.filter((x) => x !== giu)
}

// ---------------------------------------------------------------- tỉ lệ cho màn hình
export function tiLeChienDich(ds: readonly TrangThaiCau[]): { tong: number; coXat: number; thanhThao: number; canDayLai: number } {
  return {
    tong: ds.length,
    coXat: ds.filter((t) => !t.laMoi).length,
    thanhThao: ds.filter((t) => t.thanhThao).length,
    canDayLai: ds.filter((t) => t.catTia).length,
  }
}

/** Ngày đầu tiên thanh Thành thạo có thể tăng (câu đúng lần đầu sớm nhất + khoảng hẹn), để màn nói thật "tăng từ ngày …". */
export function ngayThanhThaoSomNhat(ds: readonly TrangThaiCau[]): string | null {
  let min: string | null = null
  for (const t of ds) if (!t.thanhThao && t.cc === 1 && t.henOn && (!min || t.henOn < min)) min = t.henOn
  return min
}

/** Sức chứa cho màn giao chiến dịch: tỉ lệ khối lượng / (D × trần). */
export function sucChua(khoiLuong: number, D: number, tranNgay = TRAN_NGAY): { tiLe: number; muc: 'xanh' | 'vang' | 'do' } {
  const tiLe = D * tranNgay > 0 ? khoiLuong / (D * tranNgay) : Number.POSITIVE_INFINITY
  return { tiLe, muc: tiLe <= 0.7 ? 'xanh' : tiLe <= 0.9 ? 'vang' : 'do' }
}

