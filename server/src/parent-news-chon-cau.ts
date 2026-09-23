// KÊNH 5 (phụ huynh giao bài hằng ngày) — PHẦN THUẦN, GĐ 5 (DE-XUAT-CA-NHAN-HOA-1909.md mục 2, "Kênh 5").
//
// Hai việc, cả hai không đọc đồng hồ và không Math.random (phá thế cân bằng bằng `hashSeed`):
//   1. `tomTatKeHoach` / `soCauPhanDu`: số câu phụ huynh được giao = PHẦN DƯ của ngân sách ngày trong kế hoạch ngày.
//   2. `chonCauChoPhuHuynh`: thứ tự chọn câu: ôn tới hạn → câu mới cùng dạng yếu → bù trong dạng đã học của chính em.
//
// Chỉ nhận ID câu và nhãn, KHÔNG có nội dung/đáp án — lớp D1 (`parent-news.ts`) đọc nội dung sau khi đã chọn.
import { hashSeed } from '../../src/lib/exam-shuffle'
import type { KeHoachNgay } from './ke-hoach-ngay'

/** Bậc dạng theo thứ tự tăng dần; trùng `LEVELS` của game v2 (`src/game/than-thu-v2/core.ts`). */
export const THU_TU_MUC_DO = ['biet', 'hieu', 'van_dung'] as const

/** Số ngày gần đây mà câu đã có sự kiện thì không giao lại làm câu MỚI/BÙ (đề xuất mục 2, Kênh 5). */
export const SO_NGAY_KHONG_GIAO_LAI = 3

export interface KeHoachChoPhuHuynh {
  mucTieuCau: number
  /** Câu bắt buộc còn phải làm hôm nay (BTVN, Mom), KHÔNG tính chính bài hằng ngày của phụ huynh. */
  taiCung: number
  /** Câu đã làm hôm nay, mọi nguồn, khử trùng theo câu. */
  daLamCau: number
  /** Câu từng sai (`moi_sai`/`dang_on`) đã tới mốc ôn. */
  toiHanSai: number
  /** Câu `da_khac_phuc` đã tới mốc ôn duy trì. */
  toiHanDuyTri: number
  /** Câu `moi_sai`/`dang_on`, tính cả câu chưa tới mốc. */
  chuaKhacPhuc: number
  /** Số giây/câu đã đo (hoặc mặc định) trong kế hoạch. */
  vanTocGiay: number
}

export interface DemHoSo {
  toiHanSai: number
  toiHanDuyTri: number
  chuaKhacPhuc: number
}

/** Bài hằng ngày của chính hôm nay không được tính là "việc đã giao" — nó là phần đang được tính ra. */
export function tomTatKeHoach(
  kh: Pick<KeHoachNgay, 'nganSach' | 'tai' | 'tienBo' | 'viec'>,
  hoSo: DemHoSo,
  maBaiHangNgay: string,
): KeHoachChoPhuHuynh {
  const chinhNo = kh.viec.find((v) => v.loai === 'mom' && v.nguon === maBaiHangNgay)?.soCau ?? 0
  return {
    mucTieuCau: kh.nganSach.mucTieuCau,
    taiCung: Math.max(0, kh.tai.cung - chinhNo),
    daLamCau: kh.tienBo.daLamCau,
    toiHanSai: hoSo.toiHanSai,
    toiHanDuyTri: hoSo.toiHanDuyTri,
    chuaKhacPhuc: hoSo.chuaKhacPhuc,
    vanTocGiay: kh.nganSach.vanTocGiay,
  }
}

/** Phần dư = mục tiêu − việc bắt buộc còn lại − số câu đã làm. Không âm. */
export function soCauPhanDu(k: KeHoachChoPhuHuynh): number {
  return Math.max(0, k.mucTieuCau - k.taiCung - k.daLamCau)
}

// --- Chọn câu -------------------------------------------------------------------------

export interface UngVien {
  qid: string
  /** Mã dạng thật (`CHUYEN_DE.DANG.KIEU`) hoặc null. */
  dang: string | null
  mucDo: string | null
  group?: string
}

export interface CauToiHan {
  qid: string
  mocOnKe: string
  lanSai: number
}

export interface DangCanLuyen {
  maDang: string
  /** 0 biết · 1 hiểu · 2 vận dụng (`nam_kt_dang.bac`). */
  bac: number
}

export type NguonCau = 'on_toi_han' | 'cung_dang' | 'bu_kho'

export interface ChonCauVao {
  soCan: number
  /** Seed tất định: nơi gọi truyền `hashSeed(sbd|ngày|…)`. */
  seed: number
  /** Câu có nội dung sẵn và đã lọc hợp lệ (đúng lớp, không thuộc đề thi đang bảo vệ, không câu có hình rời). */
  ungVien: UngVien[]
  /** Câu tới mốc ôn (đã lọc bỏ `can_day_lai`). */
  toiHan: CauToiHan[]
  /** Dạng yếu, yếu nhất trước. */
  dangYeu: DangCanLuyen[]
  /** Dạng có bằng chứng học của chính em; không mở rộng theo chuyên đề/lớp. */
  dangDaHoc?: ReadonlySet<string>
  nhomGanDay?: ReadonlySet<string>
  /** qid có sự kiện trong `SO_NGAY_KHONG_GIAO_LAI` ngày qua (gồm hôm nay): không giao lại làm câu mới/bù. */
  suKienGanDay: ReadonlySet<string>
}

export interface CauChon {
  qid: string
  nguon: NguonCau
}

const bacMucDo = (m: string | null): number => (m === null ? -1 : (THU_TU_MUC_DO as readonly string[]).indexOf(m))

/** Đoạn đầu của mã dạng = chuyên đề (`CARBOHYDRATE.UNG_DUNG.CHON_PHAT_BIEU` → `CARBOHYDRATE`). */
export const chuyenDeCuaDang = (dang: string | null): string => (dang ? dang.split('.')[0]! : '')

/** Xoay vòng giữa các nhóm, mỗi vòng lấy một câu từ mỗi nhóm theo thứ tự nhóm đã sắp; không vượt `soCan`. */
function xoayVong<T>(nhom: T[][], soCan: number): T[] {
  const ra: T[] = []
  const ban = nhom.map((n) => [...n])
  while (ra.length < soCan && ban.some((n) => n.length > 0)) {
    for (const n of ban) {
      const x = n.shift()
      if (x !== undefined) ra.push(x)
      if (ra.length >= soCan) break
    }
  }
  return ra
}

/**
 * Thứ tự: (1) ôn tới hạn: mốc sớm nhất trước, sai nhiều trước, hoà thì theo seed;
 *         (2) câu mới cùng dạng yếu, mức độ ≤ bậc của dạng, xoay vòng qua các dạng yếu (dạng yếu nhất trước);
 *         (3) bù từ kho: ưu tiên cùng chuyên đề với những gì đã chọn, xoay vòng theo dạng.
 * Không sắp theo số sao (sắp theo sao dồn mọi câu dễ của mọi chuyên đề lên đầu, phá việc rải chuyên đề).
 */
export function chonCauChoPhuHuynh(v: ChonCauVao): CauChon[] {
  const soCan = Math.max(0, Math.floor(v.soCan))
  if (soCan === 0) return []
  const coNoiDung = new Map(v.ungVien.map((u) => [u.qid, u]))
  const ban = new Set<string>()
  const nhomDaChon = new Set<string>()
  const daHoc = v.dangDaHoc ?? new Set(v.dangYeu.map((d) => d.maDang))
  const nhom = (qid: string) => coNoiDung.get(qid)?.group || `qid:${qid}`
  const ra: CauChon[] = []
  const lay = (qid: string, nguon: NguonCau) => {
    ban.add(qid)
    nhomDaChon.add(nhom(qid))
    ra.push({ qid, nguon })
  }
  const bam = (qid: string) => hashSeed(`${v.seed}|${qid}`)

  // 1. Ôn tới hạn.
  const toiHan = v.toiHan
    .filter((c) => coNoiDung.has(c.qid))
    .map((c) => ({ c, h: bam(c.qid) }))
    .sort((a, b) => a.c.mocOnKe.localeCompare(b.c.mocOnKe) || b.c.lanSai - a.c.lanSai || a.h - b.h || a.c.qid.localeCompare(b.c.qid))
  for (const { c } of toiHan) {
    if (ra.length >= soCan) break
    if (!ban.has(c.qid) && !nhomDaChon.has(nhom(c.qid))) lay(c.qid, 'on_toi_han')
  }

  const duocPhep = (u: UngVien) => !!u.dang && daHoc.has(u.dang) && !ban.has(u.qid) && !nhomDaChon.has(nhom(u.qid)) && !v.suKienGanDay.has(u.qid) && !v.nhomGanDay?.has(nhom(u.qid))
  const sapXep = (a: UngVien, b: UngVien, uuTien: (u: UngVien) => number) =>
    uuTien(a) - uuTien(b) || bam(a.qid) - bam(b.qid) || a.qid.localeCompare(b.qid)

  // 2. Câu mới cùng dạng yếu, ở bậc của dạng (đúng bậc trước, thấp hơn sau), xoay vòng qua các dạng.
  if (ra.length < soCan) {
    const nhom = v.dangYeu.map((d) =>
      v.ungVien
        .filter((u) => u.dang === d.maDang && bacMucDo(u.mucDo) >= 0 && bacMucDo(u.mucDo) <= d.bac && duocPhep(u))
        .sort((a, b) => sapXep(a, b, (u) => d.bac - bacMucDo(u.mucDo))),
    )
    for (const u of xoayVong(nhom, v.ungVien.length)) {
      if (ra.length >= soCan) break
      if (duocPhep(u)) lay(u.qid, 'cung_dang')
    }
  }

  // 3. Bù trong dạng đã học: ưu tiên cùng chuyên đề; chỉ mức biết/hiểu có nhãn.
  if (ra.length < soCan) {
    const uaChuyenDe = new Set<string>([
      ...v.dangYeu.map((d) => chuyenDeCuaDang(d.maDang)),
      ...ra.map((c) => chuyenDeCuaDang(coNoiDung.get(c.qid)?.dang ?? null)),
    ].filter(Boolean))
    const ung = v.ungVien
      .filter((u) => duocPhep(u) && bacMucDo(u.mucDo) >= 0 && bacMucDo(u.mucDo) <= 1)
      .sort((a, b) => sapXep(a, b, (u) => (uaChuyenDe.has(chuyenDeCuaDang(u.dang)) ? 0 : 1)))
    // Nhóm theo dạng (không có dạng thì nhóm riêng), giữ thứ tự xuất hiện đã sắp.
    const theoNhom = new Map<string, UngVien[]>()
    for (const u of ung) theoNhom.set(u.dang ?? '', [...(theoNhom.get(u.dang ?? '') ?? []), u])
    for (const u of xoayVong([...theoNhom.values()], v.ungVien.length)) {
      if (ra.length >= soCan) break
      if (duocPhep(u)) lay(u.qid, 'bu_kho')
    }
  }
  return ra
}
