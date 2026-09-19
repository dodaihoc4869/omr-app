// ĐOÀN HỘ TỐNG — bước 4: THẺ GỢI Ý của Tiếp sức. Hàm THUẦN, máy chủ soạn từ dữ liệu CÓ SẴN của chính câu hỏi; không sinh nội dung mới.
//
//   · "Nhắc công thức"      ← trường kiến thức của câu (`kienThuc`); thiếu thì dùng câu chốt của lời giải có cấu trúc.
//   · "Loại 1 phương án"    ← máy gạch MỘT phương án SAI (chỉ Phần I). Không cần lời giải.
//   · "Chỉ bước đầu"        ← bước ĐẦU của lời giải nhiều bước.
//
// BA CHỐT AN TOÀN, thẻ nào không qua thì KHÔNG phát (thà thiếu thẻ còn hơn lộ bài):
//   1. không chứa đáp án đúng (chữ cái, nội dung phương án đúng, đáp số, chuỗi Đ/S);
//   2. không phải toàn bộ lời giải (dài không quá `TI_LE_TOI_DA` toàn văn lời giải);
//   3. câu không có lời giải → chỉ còn thẻ "Loại 1 phương án".
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { chuanHoaLoiGiaiCau } from '../../src/lib/chuan-hoa-loi-giai'
import { hashSeed } from '../../src/lib/exam-shuffle'

export type LoaiThe = 'nhac_cong_thuc' | 'loai_phuong_an' | 'buoc_dau'
export interface TheGoiY { loai: LoaiThe; tieuDe: string; noiDung: string }
/** Thứ người tiếp sức thấy khi chọn thẻ: chỉ tên + mô tả, KHÔNG thấy nội dung thẻ (để không đọc hộ bạn). */
export const MO_TA_THE: Record<LoaiThe, { tieuDe: string; moTa: string }> = {
  nhac_cong_thuc: { tieuDe: 'Nhắc công thức', moTa: 'Gửi bạn kiến thức gốc của câu' },
  loai_phuong_an: { tieuDe: 'Loại 1 phương án', moTa: 'Máy gạch một đáp án sai' },
  buoc_dau: { tieuDe: 'Chỉ bước đầu', moTa: 'Hé bước đầu của lời giải' },
}
export const THU_TU_THE: readonly LoaiThe[] = ['nhac_cong_thuc', 'loai_phuong_an', 'buoc_dau']
export const TI_LE_TOI_DA = 0.6
export const THE_DAI_TOI_DA = 240

const gon = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
const thoat = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Toàn văn lời giải (để đo "không phải toàn bộ lời giải"). */
export function toanVanLoiGiai(q: PrivateQuestion): string {
  const lg = chuanHoaLoiGiaiCau(q.solution, q.phan, q.correct)
  return [lg.chot, ...(lg.lyDo ?? []).map(x => x.ly), ...(lg.buoc ?? [])].filter(Boolean).join(' ').trim()
}

/** Chữ này có làm lộ đáp án của câu không? Thà bắt nhầm còn hơn bỏ sót. */
export function loDapAn(chu: string, q: PrivateQuestion): boolean {
  const t = gon(chu), dung = q.correct.trim()
  if (!t || !dung) return false
  if (q.phan === 'I') {
    const L = dung.toUpperCase(), noiDung = gon(q.choices['ABCD'.indexOf(L)] ?? '')
    if (noiDung.length >= 2 && t.includes(noiDung)) return true
    const l = L.toLowerCase()
    return new RegExp(`(đáp án|chọn|phương án đúng|đúng là|kết quả)[^.;\\n]{0,12}\\b${l}\\b|\\b${l}\\b\\s*(là\\s*)?(đúng|đáp án)|\\b${l}\\s*[✓✔]`, 'i').test(t)
  }
  if (q.phan === 'II') {
    if (/[✓✔✗✘]/.test(chu)) return true
    // Dãy Đ/S viết liền ("ĐSĐS", "DSDS") hoặc rời ("Đúng, Sai, Đúng, Sai" / "Đ - S - Đ - S") trùng đáp án.
    const dapAn = dung.toUpperCase().replace(/Đ/g, 'D')
    const day = t.split(/[^\p{L}]+/u).map(w => (w === 'đúng' || w === 'đ' || w === 'd' ? 'D' : w === 'sai' || w === 's' ? 'S' : /^[đds]{4}$/.test(w) ? w.toUpperCase().replace(/Đ/g, 'D') : ' ')).join('')
    if (day.includes(dapAn)) return true
    return /(^|[^\p{L}])(ý\s*)?[abcd]\s*[).:–-]?\s*(là\s*)?(đúng|sai)([^\p{L}]|$)|(^|[^\p{L}])(đúng|sai)\s*[:–-]?\s*ý\s*[abcd]([^\p{L}]|$)/iu.test(t)
  }
  // Phần III: đáp số xuất hiện như một con số trọn vẹn (chấp cả dấu phẩy lẫn dấu chấm thập phân).
  const so = dung.replace(',', '.').replace(/\s+/g, '')
  if (!/\d/.test(so)) return t.includes(gon(dung))
  const mau = thoat(so).replace('\\.', '[.,]')
  return new RegExp(`(^|[^\\d.,])${mau}($|[^\\d]|[.,](?!\\d))`).test(t.replace(/\s+/g, ' '))
}

function quaChot(noiDung: string, q: PrivateQuestion, toanVan: string): boolean {
  const n = noiDung.trim()
  if (!n || n.length > THE_DAI_TOI_DA || loDapAn(n, q)) return false
  return !toanVan || (gon(n) !== gon(toanVan) && n.length <= toanVan.length * TI_LE_TOI_DA)
}

/** Các thẻ PHÁT ĐƯỢC cho câu này, theo thứ tự cố định. `hatGiong` quyết định phương án sai nào bị gạch (tất định). */
export function soanThe(q: PrivateQuestion, hatGiong: string): TheGoiY[] {
  const lg = chuanHoaLoiGiaiCau(q.solution, q.phan, q.correct), toanVan = toanVanLoiGiai(q), ra: TheGoiY[] = []
  const coPhanKhac = !!(lg.lyDo?.length || lg.buoc?.length)

  const kt = [...new Set(q.kienThuc.map(k => k.trim()).filter(Boolean))].slice(0, 3)
  const nhac = kt.length ? `Kiến thức gốc của câu này: ${kt.join(' · ')}.` : coPhanKhac ? lg.chot : ''
  // Kiến thức lấy từ trường `kienThuc` không thuộc lời giải nên không so với toàn văn; câu chốt của lời giải thì phải qua đủ ba chốt.
  if (nhac && (kt.length ? nhac.length <= THE_DAI_TOI_DA && !loDapAn(nhac, q) : quaChot(nhac, q, toanVan))) ra.push({ loai: 'nhac_cong_thuc', tieuDe: MO_TA_THE.nhac_cong_thuc.tieuDe, noiDung: nhac })

  if (q.phan === 'I' && /^[ABCD]$/.test(q.correct.trim().toUpperCase())) {
    const sai = 'ABCD'.split('').filter(c => c !== q.correct.trim().toUpperCase())
    const gach = sai[hashSeed(`${hatGiong}|${q.qid}|gach`) % sai.length]!
    ra.push({ loai: 'loai_phuong_an', tieuDe: MO_TA_THE.loai_phuong_an.tieuDe, noiDung: `Phương án ${gach} không đúng — em gạch đi, còn ba phương án.` })
  }

  const buocDau = lg.buoc && lg.buoc.length >= 2 ? lg.buoc[0]! : ''
  if (buocDau && quaChot(buocDau, q, toanVan)) ra.push({ loai: 'buoc_dau', tieuDe: MO_TA_THE.buoc_dau.tieuDe, noiDung: `Bước đầu: ${buocDau}` })

  return THU_TU_THE.flatMap(l => ra.filter(t => t.loai === l))
}

/** Phần đề cho người tiếp sức xem: CHỈ thân câu, rút gọn — không phương án, không ý, không ảnh, không gì của bạn. */
export function deRutGon(q: PrivateQuestion, toiDa = 200): string {
  const s = q.text.replace(/\s+/g, ' ').trim()
  return s.length <= toiDa ? s : `${s.slice(0, toiDa).replace(/\s+\S*$/, '')}…`
}
