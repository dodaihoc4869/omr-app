// BÌNH PHẢN ỨNG — CHỌN CÂU ⇒ MÀN ĐUA NGAY (thầy 10/11 lần 2 «vẫn bị load vào màn hình cũ mới vào đến top, load hẳn vào màn hình top thật mượt mà»).
// Dựng lại lỗi với độ trễ phòng 300–1200 ms (bộ thử Chromium): từ lúc bấm câu tới lúc lượt mới về, bảng còn vẽ theo view CŨ — tờ dựng xong thì `diemDanh`
// hết cờ mà lượt chưa về ⇒ nhánh của lượt cũ (lượt đang «gọi / làm bảng» sau khi tải lại trang ⇒ đề trên giấy bên trái; không có lượt ⇒ màn điểm danh),
// chỉ còn bảng chọn câu che (thanh trên vẫn lộ «Lượt 1 · Trắc nghiệm» của lượt cũ; bảng chọn đóng sớm là lộ hẳn).
// Cách sửa: bấm câu ⇒ đóng bảng chọn NGAY và bảng vẽ màn đua (ThapLua) bằng LƯỢT CHỜ dựng sẵn từ câu vừa chọn + số liệu cũ (ống, Bảng vàng giữ nguyên,
// «0/N em đã gửi»); lượt thật về (cùng câu, khác lượt cũ) ⇒ thay vào, cùng số lượt ⇒ không dựng lại cảnh. Tờ lỗi / quá lâu ⇒ thôi chờ, báo một dòng.
// Không gửi lệnh phòng nào ở đây (lượt vẫn do tờ báo câu ⇒ gan-gv ⇒ bảng mở lượt như cũ).
import { useCallback, useEffect, useState } from 'react'
import type { ViewBang } from '../../lib/bpu/phong'
import type { CauDayHoc } from '../../lib/day-hoc-len-bang'

type Luot = NonNullable<ViewBang['luot']>
export interface ChoLuot { qid: string; khoa: string; luot: Luot }
/** Quá ngần này mà lượt chưa về ⇒ thôi chờ (bảng vẽ theo view thật). */
export const CHO_TOI_DA_MS = 12_000
const khoaLuot = (l: Luot | null | undefined): string => (l ? `${l.so}:${l.batDau}` : '')

/** Lượt chờ dựng từ câu vừa chọn: pha «cả lớp đang làm», chưa em nào gửi. Số lượt đoán theo luật phòng (lượt dở rỗng bị bỏ ⇒ dùng lại số; `bo` ⇒ số mới). */
export function luotCho(v: ViewBang | null, c: CauDayHoc, bo: boolean, nay = Date.now()): Luot {
  const l = v?.luot ?? null
  const rong = !!l && !bo && l.pha !== 'mo' && !l.goi && !l.daGui.length
  return {
    so: rong ? l!.so : (v?.soLuot ?? 0) + 1, qid: c.qid, phan: c.phan, tuLuan: !!(c as { tuLuan?: boolean }).tuLuan, cau: c.q as unknown as Luot['cau'],
    batDau: nay, han: null, pha: 'tra-loi', roiMe: [], kich: false, daGui: [], chuaBiet: [], goi: null,
  } as Luot
}
/** Lượt thật của câu đang chờ đã về chưa (cùng câu, khác lượt lúc bấm). */
export const daVe = (v: ViewBang | null, c: ChoLuot): boolean => !!v?.luot && v.luot.qid === c.qid && khoaLuot(v.luot) !== c.khoa

/** `chieu` thay `onChieuCau` cho bảng chọn câu; `cho` khác null ⇒ bảng vẽ `cho.luot` (màn đua) thay lượt của view. `bo` = lượt mới sẽ bỏ lượt dở (đang có câu). */
export function useChoLuot(v: ViewBang | null, onChieuCau: ((ds: CauDayHoc[]) => Promise<string>) | undefined, dongChon: () => void, baoLoi: (chu: string) => void, bo: boolean) {
  const [cho, setCho] = useState<ChoLuot | null>(null)
  useEffect(() => { if (cho && daVe(v, cho)) setCho(null) }, [v, cho])
  useEffect(() => { if (!cho) return; const h = setTimeout(() => setCho(null), CHO_TOI_DA_MS); return () => clearTimeout(h) }, [cho])
  const chieu = useCallback(async (ds: CauDayHoc[]): Promise<string> => {
    if (!onChieuCau) return ''
    const c = ds[0]
    // Mở từ điểm danh mà phòng đang có lượt CHÍNH câu này ⇒ bảng nối lại lượt ấy (không có lượt mới để chờ).
    const noiLai = !bo && v?.luot?.qid === c?.qid
    if (c && !noiLai) { setCho({ qid: c.qid, khoa: khoaLuot(v?.luot), luot: luotCho(v, c, bo) }); dongChon() }
    const chu = await onChieuCau(ds)
    if (chu && c && !noiLai) { setCho(null); baoLoi(chu) }
    return chu
  }, [onChieuCau, v, bo, dongChon, baoLoi])
  return { cho, chieu }
}
