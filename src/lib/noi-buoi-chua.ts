// LƯU BUỔI CHỮA + TỰ NỐI BUỔI SAU (M4, 21/09/2026).
//
// Thầy chốt: "nếu không chữa hết tự động tiếp tục được vào buổi sau". Buổi chữa chỉ nằm trong state React nên tắt app
// là mất; ở đây là phần THUẦN của việc nhớ và nối: khoá buổi, bản ghi lưu, hạn 14 ngày, phần CÒN LẠI, và em nào được giữ
// lại khi nối. Lưu/đọc IndexedDB nằm ở `exam-db.ts` (`luuBuoiChua`…); màn hình ở `GoiLenBangScreen.tsx`.
//
// KHOÁ BUỔI = `mocReset | lớp | mã ca`. `mocReset` là mốc reset dữ liệu học sinh đã dọn trên máy này (`docMocResetDaDon`):
// buổi lưu TRƯỚC reset mang mốc khác (hoặc đã bị dọn hẳn) nên không bao giờ nối sang dữ liệu của lần làm mới.
//
// PHẦN CÒN LẠI = mọi câu từng vào kế hoạch của buổi − câu đã có kết quả. "Đã có kết quả" lấy từ HAI nguồn để không mất khi
// đổi máy: (1) ô thầy đã bấm Đạt / Chưa đạt trên máy này (`daGhi`), (2) lịch sử lên bảng của MÁY CHỦ — em trong kế hoạch có
// `qid` ấy trong `lichSuLenBang` với lần cuối SAU lúc buổi bắt đầu (lịch sử chỉ có `qids` và `lanCuoi` của em, không có giờ
// từng câu, nên phải chặn theo giờ bắt đầu buổi để câu em chữa từ tuần trước không bị tính nhầm).

import type { LichSuLenBangEm } from './exam-api'

/** Buổi lưu hết hạn sau bấy nhiêu ngày kể từ lần lưu gần nhất. */
export const HAN_BUOI_CHUA_NGAY = 14
const MS_NGAY = 86_400_000

export type CachLayCauBuoi = 'san' | 'tu_chon' | 'theo_dang' | 'btvn_gan_nhat'

/** Nguồn câu của buổi — đủ để dựng lại ĐÚNG danh sách câu khi nối (câu lấy theo bài thầy tích, theo dạng, hay bộ rút sẵn của ca). */
export interface NguonCauBuoi {
  cachLayCau: CachLayCauBuoi
  maDeChon: string[]
  soCauChua: number
  /** Bộ lọc sao / dạng của phần "rút theo dạng" (giữ nguyên dạng đối tượng của màn hình). */
  locSao: unknown
  locDang: unknown
}

/** Một ô của kế hoạch: em nào lên chữa câu nào. */
export interface OKeHoachLuu {
  qid: string
  sbd: string
}

export interface BuoiChuaLuu {
  phienBan: 1
  khoa: string
  moc: string
  lop: string
  maCa: string
  tenCa: string
  /** Lúc buổi BẮT ĐẦU (lần xếp đầu tiên) — mốc để đối chiếu lịch sử máy chủ; không đổi khi nối. */
  batDauLuc: string
  /** Lần lưu gần nhất; hạn tính từ đây. */
  luuLuc: string
  hetHan: string
  nguon: NguonCauBuoi
  /** MỌI câu từng vào kế hoạch (cộng dồn qua các lần nối). */
  cauBuoi: string[]
  /** Câu đã có ít nhất một ô ghi kết quả (cộng dồn). */
  daChua: string[]
  /** Câu bắt buộc của buổi (cộng dồn) — khi nối, câu bắt buộc CHƯA chữa đứng đầu. */
  batBuoc: string[]
  /** Ô lên bảng của LẦN XẾP GẦN NHẤT — để giữ nguyên em còn có mặt khi nối. */
  kehoach: OKeHoachLuu[]
  /** Kết quả đã ghi, theo `sbd|qid` (cộng dồn). */
  daGhi: Record<string, 'dat' | 'khong_dat'>
}

export const khoaO = (sbd: string, qid: string): string => `${sbd}|${qid}`

/** Khoá buổi: mốc reset | lớp | mã ca. Trống thì thay bằng "-" để khoá không bao giờ có đoạn rỗng. */
export function khoaBuoiChua(moc: string, lop: string, maCa: string): string {
  const s = (x: string) => (x ?? '').trim().replace(/\|/g, '/') || '-'
  return `${s(moc)}|${s(lop)}|${s(maCa)}`
}

export function hetHanTu(luuLuc: Date): string {
  return new Date(luuLuc.getTime() + HAN_BUOI_CHUA_NGAY * MS_NGAY).toISOString()
}

/** Buổi còn hạn: `hetHan` đọc được và chưa qua. Bản ghi hỏng (không có hạn, hạn rác) coi như HẾT HẠN — không nối nhầm dữ liệu lạ. */
export function conHan(b: Pick<BuoiChuaLuu, 'hetHan'>, nay: Date): boolean {
  const h = Date.parse(b.hetHan)
  return Number.isFinite(h) && nay.getTime() < h
}

/** Bản ghi đọc từ máy có ĐÚNG hình dạng buổi chữa không (đọc từ IndexedDB nên không tin kiểu). */
export function laBuoiChuaHopLe(v: unknown): v is BuoiChuaLuu {
  if (!v || typeof v !== 'object') return false
  const b = v as Record<string, unknown>
  const mangChuoi = (x: unknown) => Array.isArray(x) && x.every((y) => typeof y === 'string')
  return (
    b.phienBan === 1 &&
    typeof b.khoa === 'string' &&
    typeof b.maCa === 'string' &&
    typeof b.batDauLuc === 'string' &&
    typeof b.hetHan === 'string' &&
    !!b.nguon &&
    typeof b.nguon === 'object' &&
    mangChuoi(b.cauBuoi) &&
    mangChuoi(b.daChua) &&
    mangChuoi(b.batBuoc) &&
    Array.isArray(b.kehoach) &&
    (b.kehoach as unknown[]).every((o) => !!o && typeof (o as OKeHoachLuu).qid === 'string' && typeof (o as OKeHoachLuu).sbd === 'string') &&
    !!b.daGhi &&
    typeof b.daGhi === 'object'
  )
}

export interface DauVaoLuuBuoi {
  moc: string
  lop: string
  maCa: string
  tenCa: string
  nguon: NguonCauBuoi
  /** Câu của lần xếp này (đã vào kế hoạch), kèm cờ bắt buộc. */
  cauTrongBuoi: { qid: string; batBuoc: boolean }[]
  /** Ô lên bảng của lần xếp này. */
  kehoach: OKeHoachLuu[]
  /** Kết quả thầy đã bấm TRONG PHIÊN này, theo `sbd|qid`. */
  ketQua: Record<string, 'dat' | 'khong_dat'>
  nay: Date
  /** Lúc buổi bắt đầu khi CHƯA có bản ghi cũ để kế thừa (giữ ổn định qua các lần lưu trong phiên); có bản ghi cũ thì dùng của nó. */
  batDauLuc?: string
}

const hop = (a: string[], b: string[]) => [...new Set([...a, ...b])]

/** Dựng bản ghi để lưu: `cu` là bản ghi đang nối (hoặc null nếu buổi mới) — `batDauLuc`, câu cộng dồn và kết quả cũ được giữ. */
export function taoBanGhiBuoi(cu: BuoiChuaLuu | null, d: DauVaoLuuBuoi): BuoiChuaLuu {
  const daGhi = { ...(cu?.daGhi ?? {}), ...d.ketQua }
  const qidDaGhi = Object.keys(daGhi).map((k) => k.slice(k.indexOf('|') + 1))
  return {
    phienBan: 1,
    khoa: khoaBuoiChua(d.moc, d.lop, d.maCa),
    moc: d.moc,
    lop: d.lop,
    maCa: d.maCa,
    tenCa: d.tenCa,
    batDauLuc: cu?.batDauLuc ?? d.batDauLuc ?? d.nay.toISOString(),
    luuLuc: d.nay.toISOString(),
    hetHan: hetHanTu(d.nay),
    nguon: d.nguon,
    cauBuoi: hop(cu?.cauBuoi ?? [], d.cauTrongBuoi.map((c) => c.qid)),
    daChua: hop(cu?.daChua ?? [], qidDaGhi),
    batBuoc: hop(cu?.batBuoc ?? [], d.cauTrongBuoi.filter((c) => c.batBuoc).map((c) => c.qid)),
    kehoach: d.kehoach,
    daGhi,
  }
}

export interface TinhTrangBuoi {
  /** Câu đã chữa (cộng cả những câu máy chủ xác nhận). */
  daChua: string[]
  /** Câu CÒN LẠI cần chữa tiếp — bắt buộc chưa chữa đứng đầu. */
  conLai: string[]
  /** Trong `daChua`, bao nhiêu câu là do MÁY CHỦ xác nhận (thầy chữa ở máy khác). */
  soTuMayChu: number
}

/** Còn lại bao nhiêu câu, đã chữa bao nhiêu. `lichSu` = `lichSuLenBang` của máy chủ (null = chưa đọc được: chỉ dựa vào máy này). */
export function tinhTrangBuoi(b: BuoiChuaLuu, lichSu: { theoEm: Record<string, LichSuLenBangEm> } | null): TinhTrangBuoi {
  const da = new Set(b.daChua)
  let tuMayChu = 0
  if (lichSu) {
    const batDau = Date.parse(b.batDauLuc)
    for (const o of b.kehoach) {
      if (da.has(o.qid)) continue
      const h = lichSu.theoEm[o.sbd]
      if (!h || !Array.isArray(h.qids) || !h.qids.includes(o.qid)) continue
      const cuoi = Date.parse(h.lanCuoi)
      // Không đọc được giờ ⇒ KHÔNG tin (câu có thể là của tuần trước); lịch sử phải mới hơn lúc buổi bắt đầu.
      if (!Number.isFinite(cuoi) || !Number.isFinite(batDau) || cuoi < batDau) continue
      da.add(o.qid)
      tuMayChu++
    }
  }
  const bb = new Set(b.batBuoc)
  const conLai = b.cauBuoi.filter((q) => !da.has(q))
  // bắt buộc chưa chữa lên đầu, còn lại giữ nguyên thứ tự kế hoạch
  conLai.sort((x, y) => Number(bb.has(y)) - Number(bb.has(x)))
  return { daChua: [...da], conLai, soTuMayChu: tuMayChu }
}

/** Khi nối: câu nào còn lại mà em đã định ở lần xếp trước CÒN CÓ MẶT hôm nay thì giữ nguyên em ấy (qid → sbd). Em vắng thì
 * KHÔNG có mặt trong kết quả — máy xếp lại câu ấy cho em có mặt hợp nhất (`diemHopCau`). */
export function emGiuKhiNoi(b: BuoiChuaLuu, conLai: string[], coMat: ReadonlySet<string>): Record<string, string> {
  const con = new Set(conLai)
  const ra: Record<string, string> = {}
  for (const o of b.kehoach) {
    if (!con.has(o.qid) || !o.sbd || !coMat.has(o.sbd)) continue
    if (b.daGhi[khoaO(o.sbd, o.qid)]) continue // ô đã có kết quả thì không giữ (đã chữa)
    ra[o.qid] = o.sbd
  }
  return ra
}

/** Câu chữ cho thẻ "Tiếp tục buổi trước". */
export function chuTheTiepTuc(t: TinhTrangBuoi): string {
  return `Tiếp tục buổi trước · còn ${t.conLai.length} câu (đã chữa ${t.daChua.length})`
}
