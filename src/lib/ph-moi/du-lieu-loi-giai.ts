// APP PHỤ HUYNH MỚI — đọc LỜI GIẢI một câu (`POST /ph/chi-tiet-cau-ve-con`). Tách khỏi `du-lieu.ts` (27/10 tốc độ): bộ chuẩn lời giải chung
// (chuan-hoa-loi-giai, nằm trong mảnh lời giải ~12 KB nén) chỉ cần khi phụ huynh mở chi tiết câu ⇒ `api.ts` nạp lười tệp này song song với lệnh máy chủ.
import { chuanHoaLoiGiaiCau } from '../chuan-hoa-loi-giai'
import type { ChiTietCau, LoiGiaiCT, LyDoChe } from './du-lieu'

// Bốn hàm đọc nhỏ CHÉP y hệt `du-lieu.ts` (không nhập từ đó: nhập chéo làm Rolldown xẻ du-lieu thành mảnh riêng, thêm tệp precache).
const laDoiTuong = (x: unknown): x is Record<string, unknown> => x !== null && typeof x === 'object' && !Array.isArray(x)
const chuoi = (x: unknown, tran = 400): string => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim().slice(0, tran) : '')
const lyDoChe = (x: unknown): LyDoChe | null => (x === 'chua_cong_bo' || x === 'chua_nop' ? x : null)
const lapDanh = <T,>(x: unknown, doc: (e: unknown) => T | null, toiDa: number): T[] => {
  const ra: T[] = []
  for (const e of Array.isArray(x) ? x : []) {
    const v = doc(e)
    if (v) ra.push(v)
    if (ra.length >= toiDa) break
  }
  return ra
}

/**
 * Máy chủ (`ph-tat-ca-ve-con.ts`) gửi `loiGiai` = CHUỖI JSON của lời giải có cấu trúc ({chot, buoc[], ketQua, tung_pa…}); nhiều câu chỉ có chữ thường.
 * Chuỗi bắt đầu bằng `{` ⇒ đọc bằng bộ chuẩn CHUNG chuanHoaLoiGiaiCau (không tự nghĩ ra nội dung); đọc hỏng ⇒ KHÔNG hiện chuỗi rác (chữ rỗng ⇒ màn nói "chưa có lời giải").
 */
export function docLoiGiai(raw: unknown): { loiGiai: string; loiGiaiCT: LoiGiaiCT | null } {
  const s = typeof raw === 'string' ? raw.trim().slice(0, 8000) : ''
  if (!s) return { loiGiai: '', loiGiaiCT: null }
  if (!s.startsWith('{') && !s.startsWith('[')) return { loiGiai: s, loiGiaiCT: null }
  let obj: unknown
  try {
    obj = JSON.parse(s)
  } catch {
    return { loiGiai: '', loiGiaiCT: null }
  }
  if (!laDoiTuong(obj)) return { loiGiai: '', loiGiaiCT: null }
  const c = chuanHoaLoiGiaiCau(obj)
  const ketQua = chuoi(obj.ketQua ?? obj.ket_qua ?? obj.dapAn, 240)
  if (c.thieu && !ketQua) return { loiGiai: '', loiGiaiCT: null }
  const sach = (t: string) => !t.includes('[object Object]') // bộ chuẩn chung ép String() mọi phần tử: phần tử là object ⇒ bỏ, không in rác
  const ct: LoiGiaiCT = { chot: sach(c.chot) ? c.chot : '', buoc: (c.buoc ?? []).filter(sach), ketQua, lyDo: (c.lyDo ?? []).filter((l) => l.ly && sach(l.ly)) }
  const chu = [ct.chot, ...ct.buoc.map((b, i) => `Bước ${i + 1}: ${b}`), ct.ketQua ? `Kết quả: ${ct.ketQua}` : ''].filter(Boolean).join('\n')
  return { loiGiai: chu, loiGiaiCT: chu ? ct : null }
}

/** Thân `/ph/chi-tiet-cau-ve-con`. `ok:false` ⇒ từ chối kèm LỜI THẬT của máy chủ; thân lạ ⇒ null. */
export function docChiTietCau(raw: unknown): ChiTietCau | null {
  if (!laDoiTuong(raw)) return null
  if (raw.ok === false) return { kieu: 'tu_choi', chu: chuoi(raw.error, 240) || 'Chưa xem được lời giải của câu này.', che: lyDoChe(raw.che) }
  if (raw.ok !== true) return null
  const de = chuoi(raw.de, 4000)
  const dapAn = chuoi(raw.dapAn, 80)
  if (!de || !dapAn) return null
  return { kieu: 'ok', de, phuongAn: lapDanh(raw.phuongAn, (e) => (typeof e === 'string' && e.trim() ? chuoi(e, 600) : null), 8), dapAn, tenDang: chuoi(raw.tenDang, 140), ...docLoiGiai(raw.loiGiai) }
}
