// OMNI 3 · PHÍA MÁY HỌC SINH (Sảnh 2.0, Đảo 2.0, Đoàn Hộ Tống) — hợp đồng docs/hop-dong-omni-3.md mục A, kiểu server/src/omni-kieu.ts.
// Chỉ ĐỌC CHẶT phần `omni` máy chủ trả (thiếu / sai kiểu ⇒ bỏ, KHÔNG bịa số), dựng phần thân THÊM của lệnh trả lời (msLam, tuTin),
// nhớ "chạm chip Chưa chắc lần đầu trong ngày" và cửa vào Đảo từ Sảnh (vé thử thách, đề thử) bằng khoá đọc MỘT lần như `game-v2:man-dau`.
// Cờ OMNI tắt ⇒ máy chủ không gửi `omni` ⇒ mọi hàm đọc trả null, thân lệnh không thêm trường nào: app y hệt hôm nay.
// Chữ hiển thị KHÔNG viết ở đây — một nguồn `src/lib/omni-chu.ts`.
import { CAC_KHUNG_GIO, THAM_SO_OMNI, type KetQuaOmniTraLoi, type KhungGio, type NhanTocDo, type SanhOmni, type TramHoiPhuc } from '../../server/src/omni-kieu'

const vat = (x: unknown): Record<string, unknown> | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : null)
const chuCo = (x: unknown): string | null => (typeof x === 'string' && x.trim() ? x.trim() : null)
const soNguyen = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? Math.floor(x) : 0)
const soHuuHan = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
/** Tỉ lệ 0..1 (kẹp); không phải số ⇒ null. */
const tiLe = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : null)
const laNgay = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)

// ─────────────────────────────── Sảnh (`hoa2-sanh` → `omni`)
/** Đọc CHẶT `omni` của `hoa2-sanh`. Chỉ khi `bat === true` mới có; còn lại null ⇒ Sảnh y hệt hôm nay. */
export function docSanhOmni(x: unknown): SanhOmni | null {
  const o = vat(x)
  if (!o || o.bat !== true) return null
  const dv = vat(o.dangVung), ve = vat(o.ve), dt = vat(o.deThu), mg = vat(o.metGio)
  const baiDangLuyen = (Array.isArray(o.baiDangLuyen) ? o.baiDangLuyen : [])
    .map(vat)
    .filter((b): b is Record<string, unknown> => !!b && !!chuCo(b.ten))
    .map((b) => ({ id: typeof b.id === 'string' ? b.id : String(b.id ?? ''), ten: chuCo(b.ten)!, hanNop: laNgay(b.hanNop) ? b.hanNop : '' }))
  const chungChi = (Array.isArray(o.chungChi) ? o.chungChi : [])
    .map(vat)
    .filter((c): c is Record<string, unknown> => !!c && !!chuCo(c.ten) && tiLe(c.doTin) !== null)
    .map((c) => ({ ten: chuCo(c.ten)!, doTin: tiLe(c.doTin)!, ngay: chuCo(c.ngay) ?? '' }))
  const khung = CAC_KHUNG_GIO.includes(mg?.khung as KhungGio) ? (mg!.khung as KhungGio) : null
  const metGio = mg && khung && tiLe(mg.tiLe) !== null && tiLe(mg.tiLeTot) !== null ? { khung, tiLe: tiLe(mg.tiLe)!, tiLeTot: tiLe(mg.tiLeTot)!, coTheDoi: mg.coTheDoi === true } : null
  const nhatKy = Array.isArray(o.nhatKy) ? o.nhatKy.map(chuCo).filter((d): d is string => !!d) : []
  const soCauThu = soNguyen(dt?.soCau)
  return {
    bat: true,
    baiDangLuyen,
    dangVung: { a: soNguyen(dv?.a), b: soNguyen(dv?.b) },
    conDangDe8: soHuuHan(o.conDangDe8) === null ? null : Math.max(0, Math.floor(o.conDangDe8 as number)),
    sEm: tiLe(o.sEm),
    sMucTieu: tiLe(o.sMucTieu) ?? THAM_SO_OMNI.C_SO_Y,
    chungChi,
    ve: { con: soNguyen(ve?.con), tong: soNguyen(ve?.tong) },
    choBaiMoi: o.choBaiMoi === true,
    onBaiCu: soNguyen(o.onBaiCu),
    metGio,
    nhatKy: nhatKy.length ? nhatKy : null,
    deThu: { duoc: dt?.duoc === true && soCauThu > 0, soCau: soCauThu || THAM_SO_OMNI.DE_THU.soCau, phut: soNguyen(dt?.phut) || THAM_SO_OMNI.DE_THU.phut },
  }
}

// ─────────────────────────────── kết quả một câu (`answer` / `doan-nop` → `omni`)
const NHAN_TOC_DO: readonly NhanTocDo[] = ['troi_chay', 'thuong', 'cham', 'luot']

/** Đọc CHẶT Trạm hồi phục. Thiếu chữ ⇒ null (không dựng chữ thay máy chủ). Không có nhãn câu nền ⇒ coi như không có câu nền. */
export function docTram(x: unknown): TramHoiPhuc | null {
  const o = vat(x)
  const chu = chuCo(o?.chu)
  if (!o || !chu) return null
  const nhan = chuCo(o.nhan)
  return { vkn: chuCo(o.vkn), ten: chuCo(o.ten), tenLoi: chuCo(o.tenLoi), nhan, coCauNen: o.coCauNen === true && !!nhan, chu }
}

/** Đọc CHẶT phần `omni` của phản hồi trả lời. Vắng / sai dạng ⇒ null ⇒ màn kết quả y hệt hôm nay. */
export function docKetQuaOmni(x: unknown): KetQuaOmniTraLoi | null {
  const o = vat(x)
  if (!o) return null
  const tram = docTram(o.tram)
  return {
    nhanTocDo: NHAN_TOC_DO.includes(o.nhanTocDo as NhanTocDo) ? (o.nhanTocDo as NhanTocDo) : null,
    msLam: soHuuHan(o.msLam),
    msKyVong: soHuuHan(o.msKyVong),
    luot: o.luot === true,
    chacMaSai: o.chacMaSai === true,
    ...(tram ? { tram } : {}),
    loiNhan: chuCo(o.loiNhan),
  }
}

/**
 * Phần thân THÊM vào `answer` (Đảo) / `doan-nop` (Đoàn) khi OMNI bật cho em: `msLam` = mili-giây từ lúc câu hiện tới lúc gửi (máy chủ kẹp
 * [0, 900 000], chỉ dùng để THA lượt lướt, không phạt) + `tuTin: 'chua_chac'` khi em bật chip "Chưa chắc" (vắng = chắc). OMNI tắt ⇒ {}.
 */
export function thanOmniTraLoi(bat: boolean, msLam: number, chuaChac: boolean): { msLam?: number; tuTin?: 'chua_chac' } {
  if (!bat) return {}
  const ms = Number.isFinite(msLam) ? Math.max(0, Math.round(msLam)) : 0
  return chuaChac ? { msLam: ms, tuTin: 'chua_chac' } : { msLam: ms }
}

// ─────────────────────────────── chip "Chưa chắc": gợi ý một lần mỗi ngày
/** Ngày Việt Nam 'YYYY-MM-DD' của một thời điểm (ms). */
export const ngayVn = (ms: number): string => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
const khoaGoiYChip = (sbd: string) => `omni:goi-y-chua-chac:${sbd}`
/** Em chạm chip "Chưa chắc" LẦN ĐẦU trong ngày (trên máy này) ⇒ true MỘT lần rồi ghi nhớ. Máy chặn lưu ⇒ true (gợi ý chỉ là chữ nhỏ). */
export function lanDauChamChip(sbd: string, now = Date.now()): boolean {
  const hom = ngayVn(now)
  try {
    if (localStorage.getItem(khoaGoiYChip(sbd)) === hom) return false
    localStorage.setItem(khoaGoiYChip(sbd), hom)
  } catch {
    /* máy chặn lưu: vẫn hiện gợi ý */
  }
  return true
}

// ─────────────────────────────── cửa vào Đảo từ Sảnh (vé thử thách · đề thử)
/** Khoá sessionStorage: Sảnh đặt rồi mở game; Đảo 2.0 đọc MỘT lần lúc mở rồi tự xoá (cùng hợp đồng với `game-v2:man-dau`). */
export const KHOA_OMNI_DAO = 'game-v2:omni-dao'
export type ViecOmniDao = 've' | 'de-thu'
export function datViecOmniDao(v: ViecOmniDao): void {
  try {
    sessionStorage.setItem(KHOA_OMNI_DAO, v)
  } catch {
    /* máy chặn lưu: Đảo mở như thường */
  }
}
export function layViecOmniDao(): ViecOmniDao | null {
  let v: string | null = null
  try {
    v = sessionStorage.getItem(KHOA_OMNI_DAO)
    sessionStorage.removeItem(KHOA_OMNI_DAO)
  } catch {
    /* máy chặn lưu */
  }
  return v === 've' || v === 'de-thu' ? v : null
}
