// EXP HỌC TẬP + MẢNH KHIÊN — HÀM THUẦN (DE-XUAT-EXP-MANH-KHIEN-1909.md). Không đọc đồng hồ, không đọc D1, không Math.random.
//
// EXP = công sức × độ khó × chất lượng × đúng nhịp; MỌI EXP do máy chủ tính từ sổ `su_kien_hoc` và các bảng phụ, KHÔNG có EXP nào do máy em khai.
// Tất định: cùng đầu vào → cùng danh sách; thứ tự theo `luc`, hoà thì theo `khoa`. Mọi khoản có KHOÁ idempotent; khoá nằm trong `daCoKhoa` thì
// KHÔNG sinh lại (gọi lại/nạp lại sổ không cộng trùng).
import {
  EXP_BTVN_DUNG_HAN, EXP_CAU, EXP_CHUOI_HE_SO, EXP_CHUOI_TOI_DA, EXP_DAT_NGAY, EXP_DIEM_CA_HE_SO, EXP_KHAC_PHUC, EXP_LEN_BAC, EXP_LEN_BANG_CHUA_DAT,
  EXP_LEN_BANG_DAT, EXP_LO_DUNG_NHIP, EXP_LO_TRE_NHIP, EXP_MOM_XONG, KHIEN_REN_TOI_DA, MANH_CHUOI_BOI_SO, MANH_CHUOI_BOI_SO_THUONG, MANH_DANG_ROI_YEU,
  MANH_DAT_NGAY, MANH_MOI_KHIEN, MANH_TOI_DA, TRAN_MEM_HE_SO, TRAN_MEM_TY_LE,
} from './exp-cau-hinh'

/** Nguồn cho EXP câu: mọi nguồn TRỪ game (game giữ 20/40/40 theo mastery, tránh thưởng đôi) và trừ `len_bang` (có thưởng riêng). */
export const NGUON_EXP_CAU: readonly string[] = ['thi', 'btvn', 'btvn_lo', 'khac_phuc', 'mom', 'on_lai', 'luyen']

export type LoaiExp = 'cau' | 'lo' | 'btvn' | 'mom' | 'len_bac' | 'khac_phuc' | 'len_bang' | 'diem_ca' | 'dat_ngay' | 'chuoi'

export interface SuKienExp {
  khoa: string
  nguon: string
  maNguon: string
  qid: string
  lan: number
  ketQua: 0 | 1 | null
  /** ISO. */
  luc: string
}

export interface MetaCauExp {
  phan: 'I' | 'II' | 'III'
  sao: 0 | 1 | 2
}

export interface VaoTinhExp {
  /** Ngày VN (YYYY-MM-DD) đang tính. */
  ngay: string
  /** Sự kiện của ngày `ngay` (mọi nguồn). */
  suKien: SuKienExp[]
  /** qid → phần/sao. Thiếu qid ⇒ phần suy từ hậu tố `-I-`/`-II-`/`-III-` của qid (mặc định I), sao 0. */
  metaCau: Readonly<Record<string, MetaCauExp>>
  /** `nganSach.mucTieuCau` của ngày (8–16). */
  mucTieuCau: number
  /** qid LÊN BẬC trong ngày (đúng lại câu từng sai/trống ở NGÀY KHÁC, luật Leitner). */
  lenBac: string[]
  /** Câu vừa đạt `da_khac_phuc` trong ngày; `lan` = lần đạt thứ mấy (tái phát rồi khắc phục lại → lần mới). */
  khacPhuc: { qid: string; lan: number; luc: string }[]
  /** Lô BTVN xong trong ngày; `dungNhip` = xong trước mốc lô kế. */
  loXong: { maBtvn: string; chiSo: number; dungNhip: boolean; luc: string }[]
  /** Nộp cả bài BTVN (lần nộp ĐẦU); `dungHan` = trước hạn. */
  baiBtvnNop: { maBtvn: string; dungHan: boolean; luc: string }[]
  /** Bài Mẹ giao / daily_ hoàn thành trong ngày. */
  momXong: { id: string; luc: string }[]
  /** Ca thi ĐÃ CÔNG BỐ nộp trong ngày. */
  diemCa: { maCa: string; lanThu: number; diem: number; luc: string }[]
  /** "Đạt nhiệm vụ ngày" chuyển true hôm nay: `chuoi` = số ngày đạt liên tiếp GỒM hôm nay (≥ 1). null = chưa đạt. */
  datNgay: { chuoi: number; luc: string } | null
  /** Dạng vừa RỜI danh sách dạng yếu trong ngày; `lan` = lần rời thứ mấy. */
  dangRoiYeu: { maDang: string; lan: number; luc: string }[]
  /** Khoá đã ghi trong `exp_so`/`manh_khien_so` — không sinh lại. */
  daCoKhoa: ReadonlySet<string>
}

export interface KhoanExp {
  khoa: string
  loai: LoaiExp
  exp: number
  ngay: string
  qid?: string
  maNguon?: string
  luc: string
  /** Tiếng Việt sẵn in, kèm số. */
  ghiChu: string
}

export type LoaiManh = 'dat' | 'chuoi7' | 'dang'

export interface KhoanManh {
  khoa: string
  loai: LoaiManh
  so: number
  ngay: string
  luc: string
  ghiChu: string
}

const phanTuQid = (qid: string): 'I' | 'II' | 'III' => {
  const m = /-(III|II|I)-\d+$/.exec(qid)
  return (m?.[1] as 'I' | 'II' | 'III' | undefined) ?? 'I'
}

const sapXep = <T extends { luc: string; khoa: string }>(a: T[]): T[] => [...a].sort((x, y) => x.luc.localeCompare(y.luc) || x.khoa.localeCompare(y.khoa))

/** EXP một câu đúng theo bảng; sao lạ ⇒ 0. */
export function expMotCau(phan: 'I' | 'II' | 'III', sao: number): number {
  const s = sao === 1 || sao === 2 ? sao : 0
  return EXP_CAU[phan][s]!
}

/** Sau ngưỡng trần mềm: 25% làm tròn lên, tối thiểu 1. */
export const expSauTran = (goc: number): number => Math.max(1, Math.ceil(goc * TRAN_MEM_TY_LE))

export function tinhExp(v: VaoTinhExp): { khoan: KhoanExp[]; manh: KhoanManh[] } {
  const khoan: KhoanExp[] = []
  const manh: KhoanManh[] = []
  const them = (k: KhoanExp) => {
    if (k.exp > 0 && !v.daCoKhoa.has(k.khoa)) khoan.push(k)
  }

  // 1. Câu ĐÚNG: mỗi qid MỘT lần mỗi ngày VN (lần đúng ĐẦU trong ngày, theo `luc` rồi `khoa`). Trần mềm xét theo THỨ TỰ trong ngày của TOÀN BỘ câu-được-thưởng
  //    (kể cả câu đã có khoá từ lần gọi trước) nên kết quả không phụ thuộc số lần gọi.
  const dung = sapXep(v.suKien.filter((e) => e.ketQua === 1 && e.qid && NGUON_EXP_CAU.includes(e.nguon)))
  const daTinh = new Set<string>()
  const nguong = TRAN_MEM_HE_SO * Math.max(0, Math.floor(v.mucTieuCau))
  let thuTu = 0
  for (const e of dung) {
    if (daTinh.has(e.qid)) continue
    daTinh.add(e.qid)
    const meta = v.metaCau[e.qid]
    const phan = meta?.phan ?? phanTuQid(e.qid)
    const goc = expMotCau(phan, meta?.sao ?? 0)
    const qua = thuTu >= nguong
    thuTu++
    const exp = qua ? expSauTran(goc) : goc
    them({ khoa: `cau|${e.qid}|${v.ngay}`, loai: 'cau', exp, ngay: v.ngay, qid: e.qid, maNguon: e.maNguon, luc: e.luc, ghiChu: `Câu đúng Phần ${phan}${meta?.sao ? `, ${meta.sao} sao` : ''}: +${exp}${qua ? ' (đã quá mục tiêu ngày, tính 25%)' : ''}` })
  }

  // 2. Thưởng theo việc (không bị trần).
  for (const l of v.loXong) {
    const exp = l.dungNhip ? EXP_LO_DUNG_NHIP : EXP_LO_TRE_NHIP
    them({ khoa: `lo|${l.maBtvn}|${l.chiSo}`, loai: 'lo', exp, ngay: v.ngay, maNguon: l.maBtvn, luc: l.luc, ghiChu: l.dungNhip ? `Xong lô ${l.chiSo + 1} đúng nhịp: +${exp}` : `Xong lô ${l.chiSo + 1} (trễ nhịp): +${exp}` })
  }
  for (const b of v.baiBtvnNop) {
    if (b.dungHan) them({ khoa: `btvn|${b.maBtvn}`, loai: 'btvn', exp: EXP_BTVN_DUNG_HAN, ngay: v.ngay, maNguon: b.maBtvn, luc: b.luc, ghiChu: `Nộp cả bài BTVN đúng hạn: +${EXP_BTVN_DUNG_HAN}` })
  }
  for (const m of v.momXong) them({ khoa: `mom|${m.id}`, loai: 'mom', exp: EXP_MOM_XONG, ngay: v.ngay, maNguon: m.id, luc: m.luc, ghiChu: `Xong bài được giao: +${EXP_MOM_XONG}` })
  for (const qid of [...new Set(v.lenBac)].sort()) {
    const luc = v.suKien.filter((e) => e.qid === qid && e.ketQua === 1).map((e) => e.luc).sort()[0] ?? `${v.ngay}T00:00:00.000Z`
    them({ khoa: `bac|${qid}|${v.ngay}`, loai: 'len_bac', exp: EXP_LEN_BAC, ngay: v.ngay, qid, luc, ghiChu: `Câu ôn lên bậc: +${EXP_LEN_BAC}` })
  }
  for (const k of v.khacPhuc) them({ khoa: `kp|${k.qid}|${k.lan}`, loai: 'khac_phuc', exp: EXP_KHAC_PHUC, ngay: v.ngay, qid: k.qid, luc: k.luc, ghiChu: `Khắc phục xong một câu (đúng 3 mốc): +${EXP_KHAC_PHUC}` })
  for (const e of sapXep(v.suKien.filter((x) => x.nguon === 'len_bang' && x.ketQua !== null))) {
    const dat = e.ketQua === 1
    const exp = dat ? EXP_LEN_BANG_DAT : EXP_LEN_BANG_CHUA_DAT
    them({ khoa: `lb|${e.khoa}`, loai: 'len_bang', exp, ngay: v.ngay, qid: e.qid, luc: e.luc, ghiChu: dat ? `Lên bảng, đạt: +${exp}` : `Lên bảng, chưa đạt: +${exp}` })
  }
  for (const c of v.diemCa) {
    const exp = Math.round(Math.max(0, Math.min(10, c.diem))) * EXP_DIEM_CA_HE_SO
    them({ khoa: `diem|${c.maCa}|${c.lanThu}`, loai: 'diem_ca', exp, ngay: v.ngay, maNguon: c.maCa, luc: c.luc, ghiChu: `Điểm ca thi ${c.diem}: +${exp}` })
  }

  // 3. Đạt nhiệm vụ ngày + chuỗi (trao CÙNG LÚC) và mảnh khiên tương ứng.
  if (v.datNgay) {
    const { chuoi, luc } = v.datNgay
    them({ khoa: `dat|${v.ngay}`, loai: 'dat_ngay', exp: EXP_DAT_NGAY, ngay: v.ngay, luc, ghiChu: `Đạt nhiệm vụ ngày: +${EXP_DAT_NGAY}` })
    const nhan = Math.min(Math.max(1, chuoi), EXP_CHUOI_TOI_DA)
    them({ khoa: `chuoi|${v.ngay}`, loai: 'chuoi', exp: EXP_CHUOI_HE_SO * nhan, ngay: v.ngay, luc, ghiChu: `Chuỗi ${chuoi} ngày đạt: +${EXP_CHUOI_HE_SO * nhan}` })
    if (!v.daCoKhoa.has(`manh|dat|${v.ngay}`)) manh.push({ khoa: `manh|dat|${v.ngay}`, loai: 'dat', so: MANH_DAT_NGAY, ngay: v.ngay, luc, ghiChu: `Đạt nhiệm vụ ngày: +${MANH_DAT_NGAY} mảnh khiên` })
    if (chuoi > 0 && chuoi % MANH_CHUOI_BOI_SO === 0 && !v.daCoKhoa.has(`manh|chuoi7|${v.ngay}`)) {
      manh.push({ khoa: `manh|chuoi7|${v.ngay}`, loai: 'chuoi7', so: MANH_CHUOI_BOI_SO_THUONG, ngay: v.ngay, luc, ghiChu: `Chuỗi ${chuoi} ngày (bội ${MANH_CHUOI_BOI_SO}): +${MANH_CHUOI_BOI_SO_THUONG} mảnh khiên` })
    }
  }
  for (const d of v.dangRoiYeu) {
    const khoa = `manh|dang|${d.maDang}|${d.lan}`
    if (!v.daCoKhoa.has(khoa)) manh.push({ khoa, loai: 'dang', so: MANH_DANG_ROI_YEU, ngay: v.ngay, luc: d.luc, ghiChu: `Một dạng không còn yếu: +${MANH_DANG_ROI_YEU} mảnh khiên` })
  }

  return { khoan: sapXep(khoan), manh: sapXep(manh) }
}

// --- Khiên rèn -----------------------------------------------------------------------------------

export interface KhienRen {
  /** Mảnh đang giữ (chưa đủ một khiên). */
  manh: number
  /** Tổng khiên rèn đã RÈN được (không giảm khi dùng). */
  daRen: number
}

/**
 * Cộng mảnh rồi TỰ RÈN: đủ `MANH_MOI_KHIEN` mảnh → rèn 1 khiên, trừ 12 mảnh, lặp. Khiên rèn CHƯA dùng (`khienRenChuaDung`, do nơi gọi tính từ
 * `shieldRemaining`) đã chạm `KHIEN_REN_TOI_DA` thì KHÔNG rèn thêm; mảnh vẫn cộng nhưng kẹp ở `MANH_TOI_DA`. Mảnh không âm, không mua được bằng EXP.
 */
export function congManh(k: KhienRen, them: number, khienRenChuaDung: number): KhienRen {
  let manh = Math.max(0, k.manh) + Math.max(0, Math.floor(them))
  let daRen = Math.max(0, k.daRen)
  let chuaDung = Math.max(0, khienRenChuaDung)
  while (manh >= MANH_MOI_KHIEN && chuaDung < KHIEN_REN_TOI_DA) {
    manh -= MANH_MOI_KHIEN
    daRen++
    chuaDung++
  }
  return { manh: Math.min(manh, MANH_TOI_DA), daRen }
}
