// BÌNH PHẢN ỨNG — MỌI ĐƯỜNG VÀO LƯỢT MỚI ⇒ MÀN ĐUA NGAY (thầy 10/11 lần 2 «vẫn bị load vào màn hình cũ mới vào đến top»; lần 3 «Vẫn chưa load hẳn vào đua top»).
// Lần 2 chỉ sửa đường «chọn câu». Lần 3 dựng lại TỪNG đường bằng bộ thử Chromium (phòng trễ 300–1500 ms, tờ nạp chậm 1–3 s, hai buổi đang mở):
//   · tờ báo câu ⇒ gan-gv hỏi lại máy chủ «buổi nào đang mở» và lấy buổi ĐẦU danh sách (≠ buổi của bảng khi thầy còn buổi khác mở trong 4 giờ) ⇒ bảng dựng
//     lại cho buổi khác: «Đang mở…» → lượt cũ của phòng kia (đề trên giấy / mời lên bảng / điểm danh) → mới tới màn đua (gan-gv nay dùng buổi của bảng);
//   · «Câu tiếp» / → / ← ⇒ bảng đứng ở lượt cũ 1–3 s tới khi lượt mới về;
//   · tải lại trang ⇒ phòng còn lượt CÙNG câu (đang làm / gọi em / đã mở đáp án) ⇒ bảng chọn đứng chờ, rồi đề trên giấy (nối lại lượt «gọi em» mà bảng không
//     còn nhớ đã giao tờ) hoặc màn mở đáp án cũ.
// Cách sửa (một chỗ cho mọi đường): bảng biết trước lượt mới sắp tới (chọn câu · Câu tiếp · tờ báo câu mới) ⇒ vẽ màn đua bằng LƯỢT CHỜ dựng từ số liệu đang có
// («0/N em đã gửi», ống, Bảng vàng giữ nguyên) tới khi lượt thật về thì thay vào; CẢNH giữ nguyên khoá ⇒ không dựng lại / không mờ dần lần hai.
// Nối lại đúng câu đang làm (giữ bài các em đã gửi) ⇒ màn đua của lượt ấy ngay. Tờ lỗi / quá lâu / hết câu ⇒ thôi chờ. Không gửi lệnh phòng nào ở đây.
import { useCallback, useEffect, useState } from 'react'
import type { ViewBang } from '../../lib/bpu/phong'
import type { CauDayHoc } from '../../lib/day-hoc-len-bang'

type Luot = NonNullable<ViewBang['luot']>
export interface ChoLuot { qid: string; khoa: string; luot: Luot; canh: string; han: number }
/** Quá ngần này mà lượt chưa về ⇒ thôi chờ (bảng vẽ theo view thật). «Câu tiếp» chờ ngắn hơn (tờ không trả lời ⇒ về lượt đang có). */
export const CHO_TOI_DA_MS = 12_000
export const CHO_TIEP_MS = 6_000
export const khoaLuot = (l: Luot | null | undefined): string => (l ? `${l.so}:${l.batDau}` : '')
/** View lúc chưa có tin phòng (mã + QR hiện ngay; lượt chờ vẽ được màn đua). `soLuot` −1 = chưa phải view thật. */
export const viewRong = (buoiId: string): ViewBang => ({ t: 'bang', buoiId, lop: '', soLuot: -1, ketThuc: false, doiThuong: [0, 0, 0, 0], doiDu: null, soDoi: 4, vuaVao: [], lichSu: [], ds: [], luot: null })
export const laThat = (v: ViewBang | null): v is ViewBang => !!v && v.soLuot >= 0
/** Mở lại tờ / bấm P trên ĐÚNG câu đang chạy ⇒ nối lại lượt đang có (giữ giờ, giữ bài đã gửi). Câu đã mở đáp án: tin tự động chỉ nối lại; thầy bấm P ⇒ lượt mới. */
export const noiLaiLuot = (v: ViewBang | null, qid: string, bo: boolean, tuDong: boolean): boolean =>
  laThat(v) && !!v.luot && v.luot.qid === qid && !bo && (v.luot.pha !== 'mo' || tuDong)

type CauCho = Partial<Pick<CauDayHoc, 'phan' | 'q'>> & { qid: string; tuLuan?: boolean }
/** Lượt chờ: pha «cả lớp đang làm», chưa em nào gửi. Số lượt đoán theo luật phòng (lượt dở rỗng bị bỏ ⇒ dùng lại số; `bo` ⇒ số mới). `c` null = câu kế của tờ. */
export function luotCho(v: ViewBang | null, c: CauCho | null, bo: boolean, nay = Date.now()): Luot {
  const l = v?.luot ?? null
  const rong = !!l && !bo && l.pha !== 'mo' && !l.goi && !l.daGui.length
  return {
    so: rong ? l!.so : Math.max(0, v?.soLuot ?? 0) + 1, qid: c?.qid ?? '', phan: c?.phan ?? l?.phan ?? 'I', tuLuan: !!c?.tuLuan, cau: (c?.q ?? {}) as unknown as Luot['cau'],
    batDau: nay, han: null, pha: 'tra-loi', roiMe: [], kich: false, daGui: [], chuaBiet: [], goi: null,
  } as Luot
}
/** Lượt thật của lượt chờ đã về chưa (đúng câu — hay câu bất kì khi chờ «câu kế» — và khác lượt lúc bắt đầu chờ). */
export const daVe = (v: ViewBang | null, c: ChoLuot): boolean => laThat(v) && !!v.luot && (!c.qid || v.luot.qid === c.qid) && khoaLuot(v.luot) !== c.khoa
function taoCho(v: ViewBang | null, c: CauCho | null, bo: boolean, han = CHO_TOI_DA_MS): ChoLuot {
  const luot = luotCho(v, c, bo)
  return { qid: luot.qid, khoa: khoaLuot(laThat(v) ? v.luot : null), luot, canh: `c${luot.so}:${luot.batDau}`, han }
}

export interface TuyChonCho {
  v: ViewBang | null
  /** Câu / lần chiếu gan-gv đang giao (tờ báo câu) — đổi ⇒ lượt mới sắp tới (trừ khi nối lại). */
  qid?: string | null
  luot: number
  /** Lượt mới bỏ lượt dở (prop `bo` của bảng). */
  bo: boolean
  tuDong: boolean
  /** Bảng đang có câu (không còn ở điểm danh) ⇒ chọn câu = lượt mới bỏ lượt dở. */
  coCau: boolean
  onChieuCau?: (ds: CauDayHoc[], moi?: boolean) => Promise<string>
  dongChon: () => void
  baoLoi: (chu: string) => void
}
/** `cho` khác null ⇒ bảng vẽ `cho.luot` (màn đua) thay lượt của view. `chieu` thay `onChieuCau` cho bảng chọn; `tiep()` khi thầy bấm sang câu; `daChon` = đã rời điểm danh;
 *  `canh` = khoá cảnh (giữ nguyên từ lượt chờ sang lượt thật). */
export function useChoLuot(o: TuyChonCho) {
  const { v, onChieuCau, dongChon, baoLoi, coCau } = o
  const [cho, setCho] = useState<ChoLuot | null>(null)
  const [daChon, setDaChon] = useState(false)
  const [nho, setNho] = useState({ props: '', khoa: '', canh: '' })
  // Tờ báo câu mới (gan-gv đổi props) ⇒ lượt chờ NGAY trong lần vẽ này (không đợi hiệu ứng ⇒ không một khung nào của lượt cũ). Đang chờ đúng câu / câu kế ⇒ giữ cảnh.
  let c = cho
  const kp = o.qid ? `${o.qid}|${o.luot}` : ''
  if (kp !== nho.props) {
    const q = o.qid
    if (q && !noiLaiLuot(v, q, o.bo, o.tuDong)) c = cho?.qid === q ? cho : cho && !cho.qid ? { ...cho, qid: q, luot: { ...cho.luot, qid: q } } : taoCho(v, { qid: q }, o.bo)
    setNho({ ...nho, props: kp })
    if (c !== cho) setCho(c)
  }
  useEffect(() => {
    if (!cho) return
    // Lượt chờ dựng trước tin phòng đầu tiên (khoá rỗng): phòng đang có lượt ĐÚNG câu này mà sẽ không nối lại (đã mở đáp án / bỏ lượt dở) ⇒ chờ lượt MỚI hơn nó.
    if (!cho.khoa && cho.qid && laThat(v) && v.luot?.qid === cho.qid && !noiLaiLuot(v, cho.qid, o.bo, o.tuDong)) { setCho({ ...cho, khoa: khoaLuot(v.luot) }); return }
    if (daVe(v, cho)) { setNho((x) => ({ ...x, khoa: khoaLuot(v!.luot), canh: cho.canh })); setCho(null) }
  }, [v, cho, o.bo, o.tuDong])
  useEffect(() => { if (!cho) return; const h = setTimeout(() => setCho(null), cho.han); return () => clearTimeout(h) }, [cho])
  // Tờ báo đã hết câu theo hướng thầy bấm (gan-gv `baoHetCau`) ⇒ thôi chờ câu kế.
  useEffect(() => { const het = () => setCho((x) => (x && !x.qid ? null : x)); window.addEventListener('bpu-het-cau', het); return () => window.removeEventListener('bpu-het-cau', het) }, [])
  const chieu = useCallback(async (ds: CauDayHoc[]): Promise<string> => {
    if (!onChieuCau) return ''
    const c0 = ds[0]
    const l = laThat(v) ? v.luot : null, cung = !!c0 && !coCau && l?.qid === c0.qid
    // Mở từ điểm danh mà phòng đang có lượt CHÍNH câu này: còn đang làm / gọi em ⇒ nối lại (màn đua của lượt ấy ngay); đã mở đáp án ⇒ hỏi lại cả lớp (lượt mới).
    const moi = cung && l!.pha === 'mo'
    if (c0) { setDaChon(true); dongChon(); if (!cung || moi) setCho(taoCho(v, c0, coCau || moi)) }
    const chu = await onChieuCau(ds, moi)
    if (chu && c0) { setCho(null); setDaChon(false); baoLoi(chu) }
    return chu
  }, [onChieuCau, v, coCau, dongChon, baoLoi])
  const tiep = useCallback(() => { if (laThat(v) && v.luot) setCho(taoCho(v, null, false, CHO_TIEP_MS)) }, [v])
  const lk = khoaLuot(laThat(v) ? v.luot : null)
  return { cho: c, chieu, tiep, daChon, canh: c ? c.canh : lk === nho.khoa ? nho.canh : lk }
}
