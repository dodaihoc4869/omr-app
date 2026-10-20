// CHỮA TRỰC TIẾP CÂU GỐC (12/10) — thầy: "mục chữa lỗi hiển thị cho thật chuẩn để học sinh chữa lỗi được".
// Trước: đợt chữa ở trạng thái chờ (thieu_hoc_lieu, can_thay, tam_khoa, cau_thay_doi, cho_gap_lai_2) hoặc không có bước nào chỉ hiện MỘT khung
// chữ ("Cần thêm bài luyện đúng chỗ") — em không làm được gì. Nay mọi trạng thái ấy dựng lối "Chữa trực tiếp câu gốc":
//   1. câu gốc đầy đủ bằng TheCau + đáp án em đã chọn · 2. em TỰ LÀM LẠI (Boss 12/10: làm trước, xem đáp án sau — xem trước là chép) ·
//   3. đáp án đúng + lời giải từng bước — CHỈ mở sau bước 2 và CHỈ khi máy chủ cho.
// QUYỀN XEM ĐÁP ÁN đi đúng đường sẵn có của "Câu đã làm": `POST /game-v2/hoa2-cau-chi-tiet` (server/src/srs2-game.ts `cauChiTiet`) chỉ trả đề +
// đáp án + lời giải cho câu em ĐÃ làm (sổ `su_kien_hoc`, không `embargoed`) và KHÔNG thuộc ca kiểm tra còn làm được / chưa công bố
// (`protectedQuestions`, so cả nhóm nội dung) — câu ấy vào `khoa`, không có đề lẫn đáp án. Màn chỉ gọi lệnh này SAU khi vòng chữa mở được
// (máy chủ vòng chữa đã chặn em đang có ca kiểm tra mở — `quyen` trong server/src/chua-cau-sai.ts). Không có đáp án ⇒ không bước (c), (d).
// TỰ LÀM LẠI: so lựa chọn mới của em với đáp án máy chủ ĐÃ cho xem (cùng luật so của TheCau xem lại: chữ cái / Đ–S / `khopPhanIII`) — lần tự
// kiểm, không ghi sổ, không tính điểm, không đổi lịch ôn (vòng chữa / Tu luyện mới là nơi ghi). Màn nói rõ điều này với em.
import { docChiTiet, goiHoa2, LoiHoa2, type ChiTietCau } from '../components/hoa2/api'
import { khopPhanIII } from './cham-so'
import { gioDayDu } from './ngay-gio-24'
import type { KetQuaDot, TrangThaiChua } from './chua-cau-sai-api'

/** MỘT dòng điều kiện lúc em sắp làm bản mới (thầy 20/10; chỉ nói luật tự làm, không hứa gì về mốc giờ). */
export const LUAT_BAN_MOI = 'Tự làm, không xem gợi ý hay lời giải. Đúng thì câu này tính là đã tự sửa.'

/** Trạng thái đợt không còn bước nào để làm ⇒ chữa trực tiếp trên câu gốc. */
export const TRANG_THAI_TRUC_TIEP: ReadonlySet<TrangThaiChua> = new Set<TrangThaiChua>(['thieu_hoc_lieu', 'can_thay', 'tam_khoa', 'cau_thay_doi', 'cho_gap_lai_2', 'da_tu_sua'])

/** Đợt đã mở mà không có bước để làm (trạng thái chờ, hoặc máy chủ không phát được bước) ⇒ dựng lối chữa trực tiếp. */
export function canChuaTrucTiep(ph: KetQuaDot | null | undefined): boolean {
  if (!ph || ph.canNghi) return false
  return !ph.item || (!!ph.trangThai && TRANG_THAI_TRUC_TIEP.has(ph.trangThai))
}

/** Lời mở đầu của từng trạng thái (đầu khung chữa trực tiếp): nói thật vì sao chưa có bước, và em làm được gì ngay. */
export function loiMoTrucTiep(tt: TrangThaiChua | undefined): { tieuDe: string; chu: string } {
  switch (tt) {
    case 'thieu_hoc_lieu':
      return { tieuDe: 'Bài luyện từng bước đang được chuẩn bị', chu: 'Trong lúc chờ, em chữa ngay trên câu gốc: xem lại câu, tự làm lại rồi đối chiếu đáp án và lời giải. Những bước em đã làm được vẫn được giữ.' }
    case 'cau_thay_doi':
      return { tieuDe: 'Câu vừa được thầy cập nhật', chu: 'Bài luyện từng bước đang làm lại cho bản mới. Em chữa ngay trên câu gốc: xem lại câu, tự làm lại rồi đối chiếu lời giải. Tiến độ cũ vẫn được giữ.' }
    case 'can_thay':
      return { tieuDe: 'Chờ chữa trên lớp', chu: 'Bước còn mắc đã được xếp vào buổi chữa trên lớp, kèm các bước em đã hiểu — em không cần gửi riêng cho thầy. Trong lúc chờ, em tự làm lại câu gốc rồi đối chiếu lời giải.' }
    case 'tam_khoa':
      return { tieuDe: 'Bài luyện từng bước đang tạm khoá', chu: 'Tiến độ của em vẫn được giữ. Em vẫn xem lại và tự làm lại câu gốc ở dưới.' }
    case 'cho_gap_lai_2':
      return { tieuDe: 'Em đã ghép lại được cả bài', chu: 'Lần sau, em tự làm một bản mới của câu này để chắc là đã hiểu.' }
    case 'da_tu_sua':
      return { tieuDe: 'Em đã tự làm được bản mới', chu: 'Em vừa giải bản mới mà không cần gợi ý. Lịch ôn chung sẽ kiểm tiếp ở những ngày khác để xác nhận đã khắc phục bền vững. Em vẫn xem lại câu gốc được.' }
    default:
      return { tieuDe: 'Câu này chưa có bước luyện', chu: 'Em chữa ngay trên câu gốc: xem lại câu, tự làm lại rồi đối chiếu lời giải.' }
  }
}

export type CauGocDaLam =
  | { trangThai: 'co'; ct: ChiTietCau }
  /** Máy chủ giữ đề + đáp án (câu thuộc ca kiểm tra còn làm được / chưa công bố). */
  | { trangThai: 'khoa' }
  /** Máy chủ không trả câu (chưa có trong sổ của em / câu đã rút khỏi kho / Game Hóa 2.0 chưa bật). */
  | { trangThai: 'khong_co' }
  | { trangThai: 'loi'; loi: string }

const goc = (q: string) => q.replace(/(~\d+|#\d+)$/, '').replace(/^tc:/, '')

/** Đề + đáp án + lời giải câu em ĐÃ làm, đúng quyền của máy chủ (xem chú thích đầu tệp). */
export async function taiCauGocDaLam(token: string, qid: string): Promise<CauGocDaLam> {
  try {
    const o = await goiHoa2('hoa2-cau-chi-tiet', token, { qid, traLoiSai: true }, 30)
    const khoa = Array.isArray(o.khoa) ? o.khoa.map(String) : []
    if (khoa.some((k) => k === qid || goc(k) === goc(qid))) return { trangThai: 'khoa' }
    for (const c of Array.isArray(o.cau) ? o.cau : []) {
      const ct = docChiTiet(c)
      if (ct && (ct.de.qid === qid || goc(ct.de.qid) === goc(qid))) return { trangThai: 'co', ct: { ...ct, emTraLoi: traLoiLanSai(ct) } }
    }
    return { trangThai: 'khong_co' }
  } catch (e) {
    return { trangThai: 'loi', loi: e instanceof LoiHoa2 ? e.message : 'Chưa tải được câu gốc. Em thử lại nhé.' }
  }
}

/**
 * "Em đã trả lời lần trước" ở màn tự sửa = câu trả lời của lần SAI đã mở đợt (sửa lỗi 19/10: trước hiện lần làm MỚI NHẤT — em làm đúng 40 sau lần sai
 * 5,88 ở bài kiểm tra ⇒ màn ghi 40 cạnh đáp án 40, em tưởng app chấm nhầm). Máy chủ không tìm được lần sai mà lần mới nhất lại ĐÚNG ⇒ không hiện
 * (màn ghi "chưa lưu") thay vì hiện một câu trả lời đúng như thể là lần sai. Máy chủ cũ (chưa có trường) ⇒ cùng chốt chặn đó.
 */
export function traLoiLanSai(ct: ChiTietCau): string | null {
  if (ct.emTraLoiSai) return ct.emTraLoiSai
  if (!ct.emTraLoi || ct.tuLuan) return ct.emTraLoi
  return soTuLam(ct.de.phan, ct.emTraLoi, ct.dapAn) ? null : ct.emTraLoi
}

const chuan = (s: string | null | undefined) => String(s ?? '').trim().toUpperCase().replace(/Đ/g, 'D')

/** Em đã trả lời đủ chưa (Phần II: đủ 4 ý; Phần I: một chữ cái; Phần III: có số). */
export function daTraLoiDu(phan: 'I' | 'II' | 'III', tra: string): boolean {
  const t = chuan(tra)
  if (phan === 'I') return /^[A-D]$/.test(t)
  if (phan === 'II') return /^[DS]{4}$/.test(t.replace(/[^DS-]/g, ''))
  return t.length > 0
}

/** So lần tự làm lại với đáp án máy chủ đã cho xem — cùng luật so của TheCau xem lại. */
export function soTuLam(phan: 'I' | 'II' | 'III', tra: string, dapAn: string): boolean {
  if (!dapAn.trim()) return false
  if (phan === 'III') return khopPhanIII(tra, dapAn)
  if (phan === 'II') return chuan(tra).replace(/[^DS]/g, '') === chuan(dapAn).replace(/[^DS]/g, '') && chuan(dapAn).replace(/[^DS]/g, '').length === 4
  return chuan(tra) === chuan(dapAn)
}

/** Đáp án viết thành chữ có nhãn: Phần I "B" · Phần II "a) Đúng · b) Sai · c) Đúng · d) Sai" · Phần III giữ nguyên. Trống ⇒ ''. */
export function chuDapAn(phan: 'I' | 'II' | 'III', s: string | null | undefined): string {
  const t = String(s ?? '').trim()
  if (!t) return ''
  if (phan === 'I') return chuan(t)
  if (phan === 'II') {
    const k = chuan(t).replace(/[^DS-]/g, '').padEnd(4, '-').slice(0, 4)
    if (!/[DS]/.test(k)) return ''
    return k.split('').map((x, i) => `${'abcd'[i]}) ${x === 'D' ? 'Đúng' : x === 'S' ? 'Sai' : 'chưa chọn'}`).join(' · ')
  }
  return t
}

/** "còn 5 giờ 20 phút" / "còn 2 ngày 3 giờ" / "còn 12 phút" tới một mốc; đã qua ⇒ ''. */
export function chuConLai(denMs: number, nayMs: number): string {
  const p = Math.ceil((denMs - nayMs) / 60000)
  if (!Number.isFinite(p) || p <= 0) return ''
  const ngay = Math.floor(p / 1440), gio = Math.floor((p % 1440) / 60), phut = p % 60
  if (ngay > 0) return `còn ${ngay} ngày${gio ? ` ${gio} giờ` : ''}`
  if (gio > 0) return `còn ${gio} giờ${phut ? ` ${phut} phút` : ''}`
  return `còn ${phut} phút`
}

/** Mốc hẹn lần gặp lại 2: "14:30 · Thứ Ba 13/10/2026" (giờ Việt Nam) + đã tới chưa. Thiếu mốc hợp lệ ⇒ null. */
export function henGapLai(denHan: string | undefined, nayMs: number): { luc: string; conLai: string; daToi: boolean } | null {
  const ms = denHan ? Date.parse(denHan) : NaN
  if (!Number.isFinite(ms)) return null
  return { luc: gioDayDu(ms, ''), conLai: chuConLai(ms, nayMs), daToi: ms <= nayMs }
}
