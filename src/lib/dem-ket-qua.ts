// ĐẾM KẾT QUẢ MỘT BÀI THI — MỘT NGUỒN SỰ THẬT CHO CẢ BA APP.
//
// Thầy bắt được 14/09, ca 814335 "Test4": em được 2,00 điểm phần II mà báo cáo
// vẫn in "Đúng 0/12 câu · Sai 12 câu". Bảng chấm cho thấy vì sao:
//
//   Phần II câu 1: em chọn SDDS, đáp án DDDS → đúng 3/4 ý
//   Phần II câu 2: em chọn DDDS, đáp án DDDD → đúng 3/4 ý
//
// Sáu ý đúng trên tám, mà `dung_sai` của cả hai câu đều bằng 0 vì luật chấm
// phần II là ĐÚNG CẢ BỐN Ý mới tính câu đúng. Báo cáo đếm theo `dung_sai` nên
// nuốt sạch sáu ý ấy, rồi in ra một con số nói ngược lại chính cột điểm ngay
// bên cạnh. Đó là lặng lẽ sai: hai con số cùng một màn hình chọi nhau.
//
// Luật đếm đúng, dùng chung cho mọi báo cáo của cả ba app:
//
//   · Câu ĐÚNG        — `dungSai === true`.
//   · Câu ĐÚNG MỘT PHẦN — chỉ phần II: `dungSai === false` nhưng có ít nhất
//                       một ý trùng đáp án. Không gộp vào "đúng" (em chưa ăn
//                       trọn điểm câu đó) cũng không gộp vào "sai" (em có
//                       điểm).
//   · Câu SAI         — `dungSai === false` và không ý nào đúng.
//   · Câu BỎ TRỐNG    — `dungSai === null`. Bản cũ đếm nó thành SAI, nên em
//                       hết giờ bỏ trống 5 câu bị báo là làm sai 5 câu.
//
// Và đếm thêm theo Ý cho riêng phần II, vì đó mới là đơn vị máy chấm điểm.

import { PHAN_NGHIN_THEO_Y_DUNG } from '../engine/score'

export type PhanBai = 'I' | 'II' | 'III'

export interface CauDeDem {
  phan: PhanBai | string
  dapAnChon?: string | null
  dapAnDung?: string | null
  /** `true` đúng trọn câu · `false` sai · `null` bỏ trống (chưa làm). */
  dungSai: boolean | null
}

export interface KetQuaDem {
  tongCau: number
  soDung: number
  soDungMotPhan: number
  soSai: number
  soBoTrong: number
  /** Riêng phần II, đếm theo Ý — đơn vị máy chấm điểm. */
  yPhanII: { tong: number; dung: number }
  /** SỐ CÂU CẦN KHẮC PHỤC = mọi câu KHÔNG đúng trọn vẹn.
   *
   * Thầy chốt 14/09: "Câu bỏ trống cũng được tính vào khắc phục câu sai, câu
   * đúng sai mà không đúng hết thì cũng tính vào khắc phục câu sai."
   *
   * Nên đúng bằng `tongCau - soDung`, và cũng đúng bằng số dòng máy chủ trả về
   * ở danh sách câu sai (`hsCauSai` lọc `COALESCE(dung_sai,0) = 0`, tức gộp cả
   * câu bỏ trống lẫn câu phần II chưa trọn ý). Một con số, một luật, ba app. */
  soCanKhacPhuc: number
}

const KY_TU_HOP_LE = new Set(['D', 'S', 'Đ'])

/** Chuẩn hoá một chuỗi đáp án đúng/sai: bỏ khoảng trắng, viết hoa, "Đ" thành "D". */
function chuanY(v: unknown): string {
  return String(v ?? '')
    .trim()
    .toUpperCase()
    .replace(/Đ/g, 'D')
}

/** SỐ Ý ĐÚNG CỦA MỘT CÂU PHẦN II.
 *
 * Ô chưa tô là dấu `-` (máy chủ ghi "----" cho câu bỏ trống hẳn) — dấu ấy không
 * bao giờ được tính là đúng, kể cả khi đáp án cũng là dấu ấy. Chỉ `D` và `S`
 * mới là một lựa chọn thật. */
export function soYDungPhanII(dapAnChon: unknown, dapAnDung: unknown): number {
  const chon = chuanY(dapAnChon)
  const dung = chuanY(dapAnDung)
  if (!chon || !dung) return 0
  let n = 0
  const het = Math.min(chon.length, dung.length, 4)
  for (let i = 0; i < het; i++) {
    const c = chon[i]
    if (!KY_TU_HOP_LE.has(c)) continue
    if (c === dung[i]) n++
  }
  return n
}

/** Số Ý của một câu phần II — theo chính đáp án, kẹp trong 1..4. */
export function soYCuaCau(dapAnDung: unknown): number {
  const dung = chuanY(dapAnDung)
  const n = [...dung].filter((c) => KY_TU_HOP_LE.has(c)).length
  return n > 0 ? Math.min(4, n) : 4
}

export function demKetQua(rows: CauDeDem[]): KetQuaDem {
  const ra: KetQuaDem = { tongCau: 0, soDung: 0, soDungMotPhan: 0, soSai: 0, soBoTrong: 0, yPhanII: { tong: 0, dung: 0 }, soCanKhacPhuc: 0 }
  for (const r of rows) {
    ra.tongCau++
    if (r.phan === 'II') {
      const y = soYDungPhanII(r.dapAnChon, r.dapAnDung)
      ra.yPhanII.tong += soYCuaCau(r.dapAnDung)
      ra.yPhanII.dung += y
      if (r.dungSai === true) ra.soDung++
      else if (r.dungSai === null) ra.soBoTrong++
      else if (y > 0) ra.soDungMotPhan++
      else ra.soSai++
      continue
    }
    if (r.dungSai === true) ra.soDung++
    else if (r.dungSai === null) ra.soBoTrong++
    else ra.soSai++
  }
  ra.soCanKhacPhuc = Math.max(0, ra.tongCau - ra.soDung)
  return ra
}

/** Một dòng chữ tóm tắt, dùng y hệt ở cả ba app.
 *
 * Không bịa: thiếu số thì bỏ hẳn vế đó chứ không in số 0 cho đủ câu. */
/** BIỂU ĐIỂM PHẦN II — ghi rõ mấy ý đúng thì được bao nhiêu điểm.
 *
 * Thầy chốt 14/09: "ghi rõ tính điểm cho mấy ý". Thang này là thang của chương
 * trình 2018, tính theo PHẦN NGHÌN của trần một câu: 1 ý 10%, 2 ý 25%, 3 ý 50%,
 * 4 ý 100%.
 *
 * ĐỌC THẲNG BẢNG CỦA BỘ CHẤM, không gõ lại: gõ lại là màn hình nói một đằng,
 * máy cộng điểm một nẻo — và không ai phát hiện ra cho tới khi phụ huynh hỏi. */
export const PHAN_TRAM_THEO_Y_DUNG: readonly number[] = PHAN_NGHIN_THEO_Y_DUNG.map((p) => p / 10)

/** "đúng 3/4 ý · được 50% điểm câu". Dòng này hiện ngay cạnh câu phần II. */
export function chuDiemTheoY(soYDung: number, soY = 4): string {
  const y = Math.max(0, Math.min(4, Math.floor(soYDung)))
  return `đúng ${y}/${soY} ý · được ${PHAN_TRAM_THEO_Y_DUNG[y] ?? 0}% điểm câu`
}

export function chuTomTat(k: KetQuaDem): string {
  const ve: string[] = [`Đúng ${k.soDung}/${k.tongCau} câu`]
  if (k.soDungMotPhan > 0) ve.push(`${k.soDungMotPhan} câu đúng một phần`)
  if (k.soSai > 0) ve.push(`Sai ${k.soSai} câu`)
  if (k.soBoTrong > 0) ve.push(`Bỏ trống ${k.soBoTrong} câu`)
  return ve.join(' · ')
}
