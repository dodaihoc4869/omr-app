/** SỐ LIỆU MỘT EM cho màn Học sinh của thầy (G3) — chỉ ĐỌC, gọi hai lệnh sẵn có của máy chủ, không ghi gì.
 *   · `/ho-so/xem {sbd}` (mã bí mật thầy)  → hồ sơ nắm kiến thức của em: `cau[]` (từng câu: trạng thái, mốc ôn kế) + `dang[]`.
 *   · kế hoạch hôm nay của em (ngân sách, việc, tiến bộ, thần thú, EXP) — CHỜ lệnh chỉ đọc `/gv/ke-hoach-em` của Code 3 (xem `layKeHoachEm`).
 *  Mọi con số trên màn truy được về một trường của hai lệnh này; lệnh lỗi / chưa có ⇒ `null` và màn hiện "đang chờ máy chủ", KHÔNG bịa số.
 *  Không kết luận năng lực từ điểm: chỉ đếm câu theo trạng thái hồ sơ. Không in "nắm chắc". */
import { layCauHinhMayChu } from './may-chu-moi'
import { loadTeacherSecret } from './exam-db'

export interface CauNamKt {
  qid: string
  trangThai: string
  mocOnKe: string | null
}
export interface HoSoNamKt {
  cau: CauNamKt[]
}

async function goi(duong: string, body: unknown, coMa: boolean): Promise<Record<string, unknown> | null> {
  try {
    const [ch, secret] = await Promise.all([layCauHinhMayChu(), coMa ? loadTeacherSecret() : Promise.resolve('')])
    if (!ch.URL) return null
    const dk = new AbortController()
    const t = setTimeout(() => dk.abort(), 15000)
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (coMa) headers['x-ma-bi-mat'] = secret || ''
    const r = await fetch(`${ch.URL}${duong}`, { method: 'POST', headers, body: JSON.stringify(body), signal: dk.signal })
    clearTimeout(t)
    const j = (await r.json()) as Record<string, unknown>
    return r.ok && j.ok === true ? j : null
  } catch {
    return null
  }
}

export async function layHoSoNamKt(sbd: string): Promise<HoSoNamKt | null> {
  const j = await goi('/ho-so/xem', { sbd }, true)
  if (!j || !Array.isArray(j.cau)) return null
  return {
    cau: (j.cau as Record<string, unknown>[]).map((c) => ({
      qid: String(c.qid ?? ''),
      trangThai: String(c.trangThai ?? ''),
      mocOnKe: c.mocOnKe ? String(c.mocOnKe) : null,
    })),
  }
}

export interface ViecEm {
  id: string
  loai: string
  thuTu?: number
  soCau?: number
  hien?: boolean
  trangThai?: string
  chiTiet?: Record<string, unknown>
}
export interface KeHoachEm {
  ngay?: string
  lanNghi?: boolean
  nganSach?: { mucTieuCau?: number; phutNgay?: number }
  viec?: ViecEm[]
  tienBo?: { daLamCau?: number; lenBac?: number; dat?: boolean }
  chuoiDat?: number
  thanThu?: { pet?: string | null; cap?: number; nickname?: string | null } | null
  exp?: { homNay?: number } | null
}

/** TẠM KHÔNG GỌI MÁY CHỦ (Boss chốt 21/09): `/hs/ke-hoach-ngay` là lệnh CÓ GHI — mỗi lần gọi nó dựng kế hoạch ngày và chạy `capNhatExp`, trả
 *  `expNhan` MỘT LẦN cho em; thầy mở hồ sơ mà gọi nó là NUỐT thông báo EXP của em. Khối "Kế hoạch hôm nay" và "Thần thú · EXP" hiện
 *  "đang chờ máy chủ" cho tới khi Code 3 có lệnh chỉ đọc `/gv/ke-hoach-em {sbd}` (mã bí mật, cùng dạng trường `KeHoachEm`) — lúc đó chỉ đổi
 *  thân hàm này. KHÔNG được nối lại vào `/hs/*`. */
export async function layKeHoachEm(_sbd: string): Promise<KeHoachEm | null> {
  void _sbd
  return null
}

/** Ngày Việt Nam (YYYY-MM-DD) của một thời điểm — cùng mốc "ngày" với `ngay_vn` của máy chủ. */
export function ngayVn(nowMs: number = Date.now()): string {
  return new Date(nowMs + 7 * 3600000).toISOString().slice(0, 10)
}

export interface LichOn {
  moiSai: number
  dangOn: number
  toiHan: number
  daKhacPhuc: number
}

/** Bốn ô đếm của "Lịch ôn 1 · 3 · 7 ngày": câu MỚI SAI · ĐANG ÔN · TỚI HẠN HÔM NAY · ĐÃ KHẮC PHỤC — đếm thẳng từ `trangThai` và `mocOnKe`
 *  của từng câu trong hồ sơ. "Tới hạn" = còn phải ôn (chưa khắc phục) và mốc ôn kế ≤ hôm nay. */
export function lichOn(cau: CauNamKt[], homNay: string): LichOn {
  const kq: LichOn = { moiSai: 0, dangOn: 0, toiHan: 0, daKhacPhuc: 0 }
  for (const c of cau) {
    if (c.trangThai === 'moi_sai') kq.moiSai++
    else if (c.trangThai === 'dang_on') kq.dangOn++
    else if (c.trangThai === 'da_khac_phuc') kq.daKhacPhuc++
    if (c.trangThai !== 'da_khac_phuc' && c.trangThai !== 'chua_thay_sai' && c.mocOnKe && c.mocOnKe.slice(0, 10) <= homNay) kq.toiHan++
  }
  return kq
}

/** MỘT dòng chữ cho mỗi việc trong kế hoạch. Chỉ nói việc và số câu (mã dạng/qid không đưa ra), không kết luận năng lực. */
export function nhanViec(v: ViecEm): string {
  const n = v.soCau && v.soCau > 0 ? `${v.soCau} câu` : ''
  const ct = v.chiTiet ?? {}
  switch (v.loai) {
    case 'btvn_lo': {
      const lo = ct.chiSo != null && ct.tongLo != null ? ` · lô ${ct.chiSo}/${ct.tongLo}` : ''
      return `BTVN${lo}${n ? ` · ${n}` : ''}`
    }
    case 'btvn_nop':
      return 'Nộp bài tập về nhà'
    case 'mom':
      return `Bài Mẹ giao${n ? ` · ${n}` : ''}`
    case 'on_lai':
      return `Ôn ${n || 'câu'} tới hạn`
    case 'on_thi':
      return `Ôn ${n || 'câu'} cho ca${ct.tenCa ? ` ${String(ct.tenCa)}` : ''}`
    case 'than_thu':
      return `Thần thú: luyện ${n || 'câu'} (tuỳ chọn)`
    default:
      return `Việc ${v.loai}${n ? ` · ${n}` : ''}`
  }
}

export interface DongKeHoach {
  thuTu: number
  chu: string
  xong: boolean
  mo: boolean
}
export interface TomTatKeHoach {
  chip: string
  dong: DongKeHoach[]
  tienDo: string
  nghi: boolean
  thanThu: { ten: string; cap: number | null; expHomNay: number | null } | null
}

/** Gọn kế hoạch của em thành vài dòng để thầy liếc. Thứ tự việc GIỮ NGUYÊN như máy chủ đã sắp (EDF), không sắp lại. */
export function tomTatKeHoach(kh: KeHoachEm): TomTatKeHoach {
  const ns = kh.nganSach ?? {}
  const chip = [ns.mucTieuCau ? `${ns.mucTieuCau} câu` : '', ns.phutNgay ? `${ns.phutNgay} phút/ngày` : ''].filter(Boolean).join(' · ')
  const dong = (kh.viec ?? []).slice(0, 4).map((v, i) => ({ thuTu: v.thuTu ?? i + 1, chu: nhanViec(v), xong: v.trangThai === 'xong', mo: v.hien === false }))
  const tb = kh.tienBo
  const tienDo = tb && typeof tb.daLamCau === 'number' ? `Đã làm ${tb.daLamCau} câu hôm nay${typeof tb.lenBac === 'number' && tb.lenBac > 0 ? ` · ${tb.lenBac} câu lên bậc` : ''}` : ''
  const tt = kh.thanThu
  return {
    chip,
    dong,
    tienDo,
    nghi: kh.lanNghi === true,
    thanThu: tt ? { ten: (tt.nickname || tt.pet || '').toString(), cap: typeof tt.cap === 'number' ? tt.cap : null, expHomNay: typeof kh.exp?.homNay === 'number' ? kh.exp.homNay : null } : null,
  }
}
