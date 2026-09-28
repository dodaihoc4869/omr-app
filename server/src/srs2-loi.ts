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
/** Thầy 28/09: trần Huyết Chiến TỰ TÍNH theo thể lực của chiến dịch = GẤP ĐÔI thể lực/ngày (giữ tỉ lệ gốc 40 → 80), không cố định 80. */
export const tranHuyetChienTheo = (theLucNgay: number): number => 2 * Math.max(1, Math.floor(theLucNgay))
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
  /**
   * BỐC CÂU MỚI CÁ NHÂN HOÁ (thầy chốt 28/09) — hạng của em THEO TỪNG DẠNG (khoá = `dang` của câu). Vắng ⇒ hành vi cũ
   * (Nhận biết → Vận dụng cao cho mọi em). Dạng không có trong bảng ⇒ `hangChung`.
   */
  hangTheoDang?: Readonly<Record<string, HangEm>>
  /** Hạng chung của em (gộp mọi dạng) cho dạng chưa có dữ liệu. Vắng ⇒ L2. */
  hangChung?: HangEm
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

export const HANG_MUC_DO: Record<string, number> = {
  NB: 0, 'Nhận biết': 0, biet: 0, TH: 1, 'Thông hiểu': 1, hieu: 1, VD: 2, 'Vận dụng': 2, van_dung: 2, VDC: 3, 'Vận dụng cao': 3, van_dung_cao: 3,
}
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

// ---------------------------------------------------------------- BỐC CÂU MỚI CÁ NHÂN HOÁ (thầy chốt 28/09)
/** Hạng của em ở một dạng: L1 Yếu · L2 Trung bình · L3 Khá · L4 Giỏi. */
export type HangEm = 'L1' | 'L2' | 'L3' | 'L4'
/** Thống kê một dạng: số lần gặp và số lần đúng (hồ sơ `nam_kt_dang` + lần làm trong chiến dịch, bỏ lượt có gợi ý). */
export interface ThongKeDang { gap: number; dung: number }

/** Tỉ lệ đúng đã làm trơn: p = (đúng + 2) / (gặp + 4) — ít dữ liệu thì kéo về 0,5. */
export const tiLeLamTron = (dung: number, gap: number): number => (Math.max(0, dung) + 2) / (Math.max(0, gap) + 4)
/** Ngưỡng hạng: p < 0,40 → L1; < 0,65 → L2; ≤ 0,85 → L3; > 0,85 → L4. */
export const hangTuTiLe = (p: number): HangEm => (p < 0.4 ? 'L1' : p < 0.65 ? 'L2' : p <= 0.85 ? 'L3' : 'L4')

/**
 * Hạng theo từng dạng của em. Dạng có dữ liệu (gặp > 0) ⇒ hạng từ p của dạng; dạng chưa có ⇒ `hangChung` (p gộp mọi dạng);
 * em không có dữ liệu gì ⇒ L2.
 */
export function tinhHangTheoDang(thongKe: ReadonlyMap<string, ThongKeDang>, dangCan: readonly string[] = []): { hangTheoDang: Record<string, HangEm>; hangChung: HangEm } {
  let gap = 0, dung = 0
  for (const t of thongKe.values()) { gap += Math.max(0, t.gap); dung += Math.max(0, t.dung) }
  const hangChung: HangEm = gap > 0 ? hangTuTiLe(tiLeLamTron(dung, gap)) : 'L2'
  const hangTheoDang: Record<string, HangEm> = {}
  for (const d of new Set([...thongKe.keys(), ...dangCan])) {
    const t = thongKe.get(d)
    hangTheoDang[d] = t && t.gap > 0 ? hangTuTiLe(tiLeLamTron(t.dung, t.gap)) : hangChung
  }
  return { hangTheoDang, hangChung }
}

/** Một dòng hồ sơ dạng (`nam_kt_dang`): `soGap` câu đã gặp, `soSai` câu từng sai; `capNhatLuc` = lúc dựng hồ sơ (ISO). */
export interface HoSoDangTho { maDang: string; soGap: number; soSai: number; capNhatLuc: string | null }

/**
 * Gộp thống kê theo dạng để XẾP HẠNG: hồ sơ `nam_kt_dang` (đúng = gặp − sai) + lần làm TRONG chiến dịch (sau lúc giao,
 * bỏ lượt có gợi ý). Lần làm trước lúc dựng hồ sơ của dạng đã nằm trong hồ sơ ⇒ không cộng lại (tránh đếm đôi).
 * Bỏ dòng tổng chuyên đề `CD:…`.
 */
export function gopThongKeDang(
  hoSo: readonly HoSoDangTho[],
  lanLam: readonly { dang: string | null; luc: string; dung: boolean; coGoiY: boolean }[],
  tuLuc = '',
): Map<string, ThongKeDang> {
  const ra = new Map<string, ThongKeDang>()
  const moc = new Map<string, string>()
  for (const d of hoSo) {
    if (!d.maDang || d.maDang.startsWith('CD:')) continue
    const gap = Math.max(0, Number(d.soGap) || 0)
    ra.set(d.maDang, { gap, dung: Math.max(0, gap - Math.max(0, Number(d.soSai) || 0)) })
    if (d.capNhatLuc) moc.set(d.maDang, d.capNhatLuc)
  }
  for (const x of lanLam) {
    if (!x.dang || x.coGoiY || x.luc < tuLuc) continue
    const m = moc.get(x.dang)
    if (m && x.luc <= m) continue
    const t = ra.get(x.dang) ?? { gap: 0, dung: 0 }
    ra.set(x.dang, { gap: t.gap + 1, dung: t.dung + (x.dung ? 1 : 0) })
  }
  return ra
}

/** Mức câu cho bốc cá nhân: NB 0 … VDC 3; nhãn lạ/thiếu coi là Thông hiểu (không để câu không nhãn nhảy lên đầu nhóm "khó trước"). */
const mucCaNhan = (m: string | null): number => (m != null && m in HANG_MUC_DO ? HANG_MUC_DO[m]! : 1)

/** Chia `n` theo trọng số (phần dư lớn nhất), mỗi phần không vượt `tran[i]`; phần thừa dồn sang phần còn chỗ theo trọng số. */
function chiaTheoTrongSo(n: number, trongSo: readonly number[], tran: readonly number[]): number[] {
  const ra = trongSo.map(() => 0)
  let con = Math.min(n, tran.reduce((s, x) => s + x, 0))
  while (con > 0) {
    const mo = trongSo.map((w, i) => (ra[i]! < tran[i]! ? Math.max(0, w) : 0))
    const dung = mo.some((w) => w > 0) ? mo : tran.map((t, i) => (ra[i]! < t ? 1 : 0))
    const tong = dung.reduce((s, x) => s + x, 0)
    const thuc = dung.map((w) => (con * w) / tong)
    const phan = thuc.map((x, i) => Math.min(Math.floor(x), tran[i]! - ra[i]!))
    let da = phan.reduce((s, x) => s + x, 0)
    const du = thuc
      .map((x, i) => [x - Math.floor(x), i] as const)
      .filter(([, i]) => dung[i]! > 0 && ra[i]! + phan[i]! < tran[i]!)
      .sort((a, b) => b[0] - a[0] || a[1] - b[1])
    for (const [, i] of du) {
      if (da >= con) break
      phan[i]!++
      da++
    }
    phan.forEach((x, i) => { ra[i]! += x })
    if (da === 0) break
    con -= da
  }
  return ra
}

/**
 * Hạng L3 — BẬC THANG: số câu mức m hôm nay ∝ N_m × max(0, 1 + t·(μ − m)), μ = mức trung bình của phần còn lại,
 * t = min(0,6; 0,3·(K − 2)) với K = số ngày giao câu mới còn lại (kể cả hôm nay). Đầu kỳ nghiêng về câu dễ, t giảm dần
 * về 0 ở hai ngày giao cuối (chia đều phần còn lại) ⇒ câu khó tăng dần và HẾT mọi mức đúng ngày giao cuối (ngày cuối lấy hết).
 * Ví dụ kho 24/62/84, 5 ngày × 34: 9/15/10 · 7/15/12 · 4/12/18 · 2/10/22 · 2/10/22.
 */
export function chiaBacThang(soTheoMuc: ReadonlyMap<number, number>, n: number, K: number): Map<number, number> {
  const muc = [...soTheoMuc.keys()].sort((a, b) => a - b)
  const N = muc.map((m) => soTheoMuc.get(m)!)
  const tong = N.reduce((s, x) => s + x, 0)
  if (n >= tong) return new Map(muc.map((m, i) => [m, N[i]!]))
  const t = Math.min(0.6, Math.max(0, 0.3 * (K - 2)))
  const mu = muc.reduce((s, m, i) => s + m * N[i]!, 0) / tong
  const w = muc.map((m, i) => N[i]! * Math.max(0, 1 + t * (mu - m)))
  const ra = chiaTheoTrongSo(n, w, N)
  return new Map(muc.map((m, i) => [m, ra[i]!]))
}

/** Số câu khởi động (dễ hơn 1 bậc) mỗi ngày của hạng L4: ~1/6 lượng câu mới trong ngày. */
export const soCauKhoiDong = (n: number): number => Math.round(n / 6)

/** Xếp câu đã chọn trong ngày: rải đều các mức (mỗi chuyến 6 câu có đủ dễ/khó theo đúng tỉ lệ ngày); hoà ⇒ mức dễ trước, rồi thứ tự gốc. */
function raiDeuTheoMuc(ds: readonly CauSrs[], viTri: ReadonlyMap<string, number>): CauSrs[] {
  const theoMuc = new Map<number, CauSrs[]>()
  for (const c of ds) {
    const m = mucCaNhan(c.mucDo)
    if (!theoMuc.has(m)) theoMuc.set(m, [])
    theoMuc.get(m)!.push(c)
  }
  const khoa = new Map<string, number>()
  for (const cs of theoMuc.values()) {
    cs.sort((a, b) => viTri.get(a.qid)! - viTri.get(b.qid)!)
    cs.forEach((c, i) => khoa.set(c.qid, (i + 0.5) / cs.length))
  }
  return [...ds].sort((a, b) => khoa.get(a.qid)! - khoa.get(b.qid)! || mucCaNhan(a.mucDo) - mucCaNhan(b.mucDo) || viTri.get(a.qid)! - viTri.get(b.qid)!)
}

/**
 * Chọn `soLay` câu mới HÔM NAY theo hạng của em ở dạng của từng câu, rồi nối phần còn lại (thứ tự cũ, dễ trước) để lấp chỗ trống.
 * - `moi`: câu mới đã xếp kiểu cũ (`xepCauMoi` — dễ trước, xen dạng). `tatCa`: mọi câu chiến dịch (để biết mức "vừa sức" của nhóm L4).
 * - `K`: số ngày giao câu mới còn lại, kể cả hôm nay (D − 3; sát hạn = 1).
 * - Chia `soLay` cho ba nhóm (L1+L2 · L3 · L4) theo tỉ lệ câu mới còn lại ⇒ mọi nhóm cùng giao hết vào ngày giao cuối.
 * - L1, L2: dễ trước. L3: bậc thang (`chiaBacThang`). L4: vừa sức (mức cao nhất của nhóm) trước, giữ `soCauKhoiDong` câu
 *   ở mức ngay dưới làm khởi động; hết câu mức ấy thì lấy tiếp theo thứ tự khó → dễ.
 */
export function bocCauMoiCaNhan(
  moi: readonly CauSrs[],
  soLay: number,
  K: number,
  hangCua: (c: CauSrs) => HangEm,
  tatCa: readonly CauSrs[] = moi,
): CauSrs[] {
  const viTri = new Map(moi.map((c, i) => [c.qid, i]))
  const nhomCua = (c: CauSrs): 0 | 1 | 2 => {
    const h = hangCua(c)
    return h === 'L4' ? 2 : h === 'L3' ? 1 : 0
  }
  const nhom: CauSrs[][] = [[], [], []]
  for (const c of moi) nhom[nhomCua(c)]!.push(c)
  const soNhom = chiaTheoTrongSo(Math.max(0, Math.min(soLay, moi.length)), nhom.map((g) => g.length), nhom.map((g) => g.length))
  const chon: CauSrs[] = []
  // Nhóm L1 + L2: dễ trước (đúng thứ tự cũ).
  chon.push(...nhom[0]!.slice(0, soNhom[0]))
  // Nhóm L3: bậc thang theo mức.
  if (soNhom[1]! > 0) {
    const theoMuc = new Map<number, CauSrs[]>()
    for (const c of nhom[1]!) {
      const m = mucCaNhan(c.mucDo)
      if (!theoMuc.has(m)) theoMuc.set(m, [])
      theoMuc.get(m)!.push(c)
    }
    const so = chiaBacThang(new Map([...theoMuc].map(([m, cs]) => [m, cs.length])), soNhom[1]!, K)
    for (const [m, cs] of theoMuc) chon.push(...cs.slice(0, so.get(m) ?? 0))
  }
  // Nhóm L4: vừa sức trước + câu khởi động.
  if (soNhom[2]! > 0) {
    const n = soNhom[2]!
    const nhomTatCa = tatCa.filter((c) => nhomCua(c) === 2)
    const mucCo = [...new Set((nhomTatCa.length ? nhomTatCa : nhom[2]!).map((c) => mucCaNhan(c.mucDo)))].sort((a, b) => b - a)
    const mucKhoiDong = mucCo[1] // mức ngay dưới mức vừa sức (mức cao nhất của nhóm trong chiến dịch)
    const khoTruoc = [...nhom[2]!].sort((a, b) => mucCaNhan(b.mucDo) - mucCaNhan(a.mucDo) || viTri.get(a.qid)! - viTri.get(b.qid)!)
    const daLay = new Set<string>()
    const kd = mucKhoiDong == null ? 0 : soCauKhoiDong(n)
    for (const c of khoTruoc) {
      if (daLay.size >= n - kd) break
      daLay.add(c.qid)
    }
    for (const c of khoTruoc) {
      if (daLay.size >= n) break
      if (mucCaNhan(c.mucDo) === mucKhoiDong) daLay.add(c.qid)
    }
    for (const c of khoTruoc) {
      if (daLay.size >= n) break
      daLay.add(c.qid)
    }
    chon.push(...khoTruoc.filter((c) => daLay.has(c.qid)))
  }
  const daChon = new Set(chon.map((c) => c.qid))
  // Chỉ có câu nhóm L1/L2 ⇒ giữ đúng thứ tự cũ (dễ trước); có nhóm L3/L4 ⇒ rải đều mức để mỗi chuyến có câu khởi động và câu trùm.
  const ngay = chon.every((c) => nhomCua(c) === 0) ? moi.filter((c) => daChon.has(c.qid)) : raiDeuTheoMuc(chon, viTri)
  return [...ngay, ...moi.filter((c) => !daChon.has(c.qid))]
}

/**
 * Thứ tự câu trong MỘT chuyến Bát Linh Đảo: câu ôn (Đúng–sai) đi trước như cũ; câu mới xếp dễ → khó ⇒ ải 1–2 là câu mới dễ
 * nhất, ải cuối (Trùm, chuyến đủ 6 ải) là câu mới khó nhất, giữa là phần còn lại. Hoà mức ⇒ giữ thứ tự kế hoạch.
 */
export function xepChuyenDao<T>(ds: readonly T[], laMoi: (x: T) => boolean, mucDo: (x: T) => string | null): T[] {
  const on = ds.filter((x) => !laMoi(x))
  const moi = ds
    .map((x, i) => [x, i] as const)
    .filter(([x]) => laMoi(x))
    .sort((a, b) => hangMucDo(mucDo(a[0])) - hangMucDo(mucDo(b[0])) || a[1] - b[1])
    .map(([x]) => x)
  return [...on, ...moi]
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
  // Bốc câu mới cá nhân hoá (thầy 28/09): chỉ khi có `hangTheoDang`; số câu mới/ngày giữ nguyên quota.
  const hangCua = (c: CauSrs): HangEm => tc.hangTheoDang?.[c.dang ?? ''] ?? tc.hangChung ?? 'L2'
  const thuTuMoi = tc.hangTheoDang ? bocCauMoiCaNhan(moi, layMoi, D > NGAY_DEM ? D - NGAY_DEM : 1, hangCua, cauChienDich) : moi
  const chonMoi = thuTuMoi.slice(0, layMoi + Math.max(0, conDu))
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

