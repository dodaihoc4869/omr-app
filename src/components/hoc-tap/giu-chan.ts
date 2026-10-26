// GIỮ CHÂN KHI THOÁT + ĐỘNG VIÊN GIỮA BÀI kiểu Duolingo (thầy 27/10, ảnh cú Duo «Đừng đi mà, chỉ 1 phút nữa thôi…»: «Mọi chỗ phải giống để kích thích học
// sinh học»). HÀM THUẦN — chỉ dựng chữ từ số liệu THẬT của chặng; test gọi thẳng (tests/giu-chan-2710.test.tsx). Không gọi mạng.
//
// LUẬT THƯỞNG PHẠT ĐÃ KIỂM TRONG MÃ MÁY CHỦ (không bịa lời doạ):
//   · Nguyên tử TỪNG CÂU vào sổ ngay lúc chấm (server/src/thuong-tra-loi.ts: «nguyên tử vào sổ exp_so … gộp lô chấm») ⇒ thoát giữa chặng KHÔNG mất nguyên
//     tử đã nhận ⇒ tấm KHÔNG BAO GIỜ nói «em mất +X nguyên tử».
//   · Thưởng «Hoàn hảo» (+NT_HOAN_HAO, server/src/exp-hoc-tap.ts `ketBaiNguyenTu`) chỉ tính khi bài XONG, mọi câu đúng tự làm, được tính, bài ≥ 3 câu ⇒ chỉ
//     nhắc khi các câu đã chấm đều đạt (nói «giữ tới cuối là có», không nói «mất»).
//   · Bài xong (mục tiêu ngày x/y bài) ghi khi MỌI câu của phiên đã chấm (`xongBai`) ⇒ vòng làm lại diễn ra SAU khi bài đã tính ⇒ trong vòng làm lại không
//     nhắc chuỗi / mục tiêu / hoàn hảo.
//   · Chuỗi ngày (server/src/chuoi-ngay-bai.ts): hôm nay ĐẠT khi có ≥ CAU_MOT_BAI (6) câu có kết quả trong ngày; lịch hôm nay 'cho' = chưa đạt ⇒ chỉ nhắc
//     chuỗi khi làm xong chặng CHẮC CHẮN đủ 6 câu hôm nay.

/** = CAU_MOT_BAI của máy chủ (server/src/chuoi-ngay-bai.ts): số câu có kết quả trong ngày để hôm nay giữ chuỗi. */
export const CAU_GIU_CHUOI = 6
/** = NT_HOAN_HAO_TOI_THIEU_CAU (server/src/exp-cau-hinh.ts): bài ít hơn chừng này câu không có thưởng Hoàn hảo. */
export const CAU_TOI_THIEU_HOAN_HAO = 3

/** Kết quả một câu đã chấm của chặng, đủ để xét giữ chân / động viên. */
export interface CauDaCham {
  /** đúng */
  d: boolean
  /** tự làm (không gợi ý / hỏi thầy / học cách giải / lượt chưa tính) */
  tu: boolean
  /** máy chủ tính câu này (thưởng `tinh !== false`; vắng thưởng ⇒ true) */
  tinh: boolean
  /** câu khó (thưởng `cauKho`; vắng ⇒ false) */
  kho?: boolean
}

export interface SoLieuGiuChan {
  /** số câu CÒN PHẢI LÀM tới hết chặng (gồm câu đang hiện nếu chưa chấm) */
  conLai: number
  /** đang ở vòng làm lại cuối chặng */
  lamLai: boolean
  /** số câu của chặng (không gồm làm lại) */
  soCau: number
  /** các câu của chặng đã chấm, theo thứ tự */
  daCham: readonly CauDaCham[]
  /** máy chủ có gửi thưởng nguyên tử cho chặng này (công tắc thưởng bật) */
  coThuong: boolean
  /** chuỗi ngày hiện tại + hôm nay đã đạt chưa (bản tổng quan gần nhất ở máy; vắng ⇒ không nhắc chuỗi) */
  chuoi?: { so: number; homNayDat: boolean } | null
  /** số câu hôm nay đã làm (bộ đếm Hôm nay, gồm câu vừa chấm) — vắng ⇒ chỉ dựa vào số câu của chặng */
  cauHomNay?: number | null
  /** mục tiêu ngày (bài) — bản tổng quan gần nhất ở máy */
  mucTieu?: { daXong: number; can: number } | null
}

/** Bấm thoát mà ĐÃ làm ít nhất một câu và chặng chưa xong ⇒ mở tấm giữ chân; chưa làm câu nào ⇒ thoát thẳng. */
export const canGiuChan = (soDaCham: number, xong: boolean): boolean => soDaCham >= 1 && !xong

const hoanHaoDangGiu = (s: SoLieuGiuChan): boolean =>
  s.coThuong && s.soCau >= CAU_TOI_THIEU_HOAN_HAO && s.daCham.length > 0 && s.daCham.every((c) => c.d && c.tu && c.tinh)

/** Chữ của tấm giữ chân: tiêu đề to + tối đa hai dòng phụ, chỉ điều ĐÚNG với số liệu. */
export function loiGiuChan(s: SoLieuGiuChan): { tieuDe: string; phu: string[] } {
  const n = Math.max(1, Math.floor(s.conLai))
  if (s.lamLai) {
    return {
      tieuDe: n <= 1 ? 'Đừng đi mà, chỉ 1 câu làm lại nữa thôi!' : `Đừng đi mà, chỉ còn ${n} câu làm lại nữa thôi!`,
      phu: ['Làm lại ngay câu cùng dạng giúp em nhớ cách giải lâu hơn.'],
    }
  }
  const tieuDe = n <= 1 ? 'Đừng đi mà, chỉ 1 câu nữa thôi là xong chặng rồi!' : `Đừng đi mà, chỉ còn ${n} câu nữa là xong chặng rồi!`
  const phu: string[] = []
  const c = s.chuoi
  const homNay = Math.max(0, Math.floor(s.cauHomNay ?? 0))
  // Xong chặng chắc chắn đủ 6 câu hôm nay: cả chặng (làm hôm nay) ≥ 6, hoặc số đã làm hôm nay + số còn lại ≥ 6.
  const xongLaDuChuoi = Math.max(s.soCau, homNay + n) >= CAU_GIU_CHUOI
  if (c && c.so > 0 && !c.homNayDat && homNay < CAU_GIU_CHUOI && xongLaDuChuoi) phu.push(`Hôm nay em chưa giữ chuỗi ${c.so} ngày. Xong chặng này là giữ được.`)
  const mt = s.mucTieu
  if (mt && mt.can > 0 && mt.daXong < mt.can && mt.daXong + 1 >= mt.can) phu.push('Xong chặng này là em đạt mục tiêu hôm nay.')
  else if (hoanHaoDangGiu(s)) phu.push(`Em đang đúng cả ${s.daCham.length} câu. Giữ tới cuối chặng là có thưởng Hoàn hảo.`)
  return { tieuDe, phu: phu.slice(0, 2) }
}

/**
 * Lời Bi động viên trong tấm kết quả SAI: chỉ khi đây là câu sai thứ hai LIỀN (hai câu tự làm, được tính, cùng sai). Câu khó (máy chủ đánh dấu) ⇒ nói khó;
 * không biết độ khó ⇒ không nói «câu này khó».
 */
export function loiDongVien(daCham: readonly CauDaCham[]): string {
  const a = daCham[daCham.length - 2], b = daCham[daCham.length - 1]
  const saiThat = (c?: CauDaCham) => !!c && !c.d && c.tinh
  if (!saiThat(a) || !saiThat(b)) return ''
  return b!.kho ? 'Không sao, câu này khó. Đọc kĩ dữ kiện nhé.' : 'Không sao, sai để nhớ lâu. Câu sau đọc kĩ dữ kiện nhé.'
}

/** Băng nhắc nhỏ dưới thanh trên: mở chặng («Chặng 3 · 6 câu») và trước câu cuối («Còn 1 câu là xong chặng!»). Rỗng ⇒ không hiện. */
export function loiBangNhac(x: { viTri: number; soCau: number; chang: number | null; lamLai: boolean; daCham: boolean }): string {
  if (x.lamLai || x.daCham || x.soCau < 1) return ''
  if (x.viTri === 0) return `${x.chang ? `Chặng ${x.chang} · ` : ''}${x.soCau} câu · bắt đầu nào!`
  if (x.soCau >= 3 && x.viTri === x.soCau - 1) return 'Còn 1 câu là xong chặng!'
  return ''
}

/** Lịch 7 ngày (tổng quan thưởng) ⇒ chuỗi + hôm nay đã đạt. Không có ô hôm nay (bản cũ của hôm qua) ⇒ null (không nhắc chuỗi). */
export function chuoiHomNay(chuoiNgay: { so: number; lich7: readonly { ngay: string; kieu: string }[] } | undefined, ngay: string): { so: number; homNayDat: boolean } | null {
  if (!chuoiNgay) return null
  const o = chuoiNgay.lich7.find((x) => x.ngay === ngay)
  if (!o) return null
  return { so: chuoiNgay.so, homNayDat: o.kieu !== 'cho' }
}
