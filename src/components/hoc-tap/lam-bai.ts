// MÀN LÀM BÀI CỦA HỌC SINH (thầy 12/10 duyệt bản vẽ dot13: "trùng tu lại giao diện làm bài … tối ưu tối đa cho màn hình dọc") — các phép THUẦN
// (không React, không DOM) để test kỹ: bàn phím số của ô Trả lời ngắn, số "đã làm/M câu hôm nay" lấy từ Sảnh, chữ phản hồi sau khi nộp.
import type { KetQuaSanh } from '../hoa2/api'
import { DAU_AM, coPhay, doiDau, laAm } from '../../lib/nhap-dap-so'
import { SO_O_PHIEU } from '../../lib/so-o-tra-loi-ngan'

// ───────────────────────────── Ô TRẢ LỜI NGẮN: số ô máy chủ gửi kèm câu (thiếu ⇒ 4 như phiếu) + bàn phím số riêng ─────────────────────────────

/** Phiếu Phần III có 4 ô: mỗi chữ số, dấu phẩy, dấu trừ chiếm một ô. Máy chủ gửi kèm mỗi câu `soO` = đúng số kí tự đáp số ("24" ⇒ 2, "10000" ⇒ 5;
 *  `soOCuaCau`); câu thiếu `soO` ⇒ 4. */
export const TOI_DA_KY_TU = SO_O_PHIEU
export type PhimSo = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | '-' | 'xoa' | 'xoa-het'
export const LA_CHU_SO = (p: PhimSo) => p.length === 1 && p >= '0' && p <= '9'

/**
 * Một lần bấm phím → chuỗi mới. ĐÚNG quy ước của ô đáp số cũ (`OSoTraLoi chuanViet` + `src/lib/nhap-dap-so.ts`): dấu âm là "-" (U+002D) ở ĐẦU số,
 * dấu thập phân là "," và chỉ MỘT dấu; không tự chuẩn hoá thêm (em bấm gì gửi nấy, máy chủ chấm bằng `khopPhanIII`).
 *  · chữ số / "," nối vào cuối khi còn chỗ (≤ `soO` kí tự, mặc định 4); "," chỉ khi chưa có dấu thập phân;
 *  · "-" BẬT/TẮT dấu âm ở đầu (bấm "1" rồi "−" ⇒ "-1", bấm lại ⇒ "1"); thêm dấu mà vượt `soO` kí tự ⇒ giữ nguyên;
 *  · "xoa" xoá một kí tự cuối; "xoa-het" xoá hết.
 * 15/10 (em Lê Công: đáp án 10000 chỉ nhập được 1000; thầy: "hiển thị đúng số ô cần điền"): `soO` = số ô của CÂU (máy chủ gửi kèm, 1..8).
 */
export function nhanPhim(v: string, phim: PhimSo, soO: number = TOI_DA_KY_TU): string {
  const s = String(v ?? '')
  if (phim === 'xoa') return s.slice(0, -1)
  if (phim === 'xoa-het') return ''
  if (phim === '-') { const moi = doiDau(s); return laAm(s) || moi.length <= soO ? moi : s }
  return s.length >= soO ? s : phim === ',' ? (coPhay(s) ? s : s + ',') : s + phim
}

/** Phím này bấm có đổi được gì không (để làm mờ phím hết tác dụng). */
export function phimCoTacDung(v: string, phim: PhimSo, soO: number = TOI_DA_KY_TU): boolean {
  return nhanPhim(v, phim, soO) !== String(v ?? '')
}

/** Phím của máy tính → phím của bàn phím số (gõ số trên máy tính vẫn nhập được). Không phải phím của ô ⇒ null. */
export function phimTuBanPhim(key: string): PhimSo | null {
  return /^[0-9]$/.test(key) ? key as PhimSo : key === ',' || key === '.' || key === 'Decimal' ? ',' : key === '-' || key === '−' || key === 'Subtract' ? '-' : key === 'Backspace' ? 'xoa' : key === 'Delete' ? 'xoa-het' : null
}

/** Chữ hiện trong từng ô: dấu trừ in "−" (U+2212) cho dễ nhìn, giá trị gửi đi vẫn "-". */
export const kyTuHien = (c: string) => (c === DAU_AM ? '−' : c)



// ───────────────────────────── SỐ "ĐÃ LÀM/M CÂU HÔM NAY" — đúng như vòng tròn Hôm nay (HocTapHomNay.tsx) ─────────────────────────────

export interface SoHomNay {
  /** Số câu đã làm hôm nay. */
  daLam: number
  /** Mức tối thiểu hôm nay (M). */
  muc: number
  /** Chặng em đang ở (1…soChang) — null khi không suy được từ dữ liệu. */
  chang: number | null
  /** Số chặng của hôm nay (mỗi chặng tối đa 6 câu). */
  soChang: number
  /** Chặng đang làm dở (1…soChang) chưa tới màn báo hoàn thành chặng ⇒ chưa tính xong chặng đó (chưa tích ✓). */
  changDangDo?: number | null
  /** (30/10) Chặng đang làm dở trên máy: số câu THẬT của chặng · số câu đã nộp — vòng tiến độ chia đúng bấy nhiêu đoạn (vắng ⇒ theo ranh 6 câu). */
  cauChang?: number
  daCauChang?: number
  /** (31/10, ảnh thầy «Bài 7 · 6/7 chặng · Đã làm hết câu được giao», nút Bắt đầu khoá): ĐÃ ĐỦ MỨC và máy chủ HẾT việc xếp được (`theLuc.con` = 0) ⇒ mọi chặng
   *  tính xong. Chặng cuối lấy chẵn 6 câu (mức 40 ⇒ chặng 7 tới câu 42) nên khi kho hết câu nó không bao giờ đủ ⇒ em kẹt ở «6/7». */
  duNgay?: boolean
}
/** Mỗi chặng tối đa 6 câu — cùng hằng với máy chủ (`server/src/hanh-trinh-ngay.ts` CAU_MOI_CHANG) và vạch chặng ở Hôm nay. */
export const CAU_MOI_CHANG = 6

/**
 * Cùng chuỗi nguồn với vòng tròn Hôm nay: Gói 7 ngày (`goi7.daLamHomNay`/`toiThieu`) → Hành trình (`hanhTrinh.daLam`/`toiThieu`) → thể lực của Sảnh
 * → tiến độ kế hoạch ngày cũ. Thiếu số (hoặc M ≤ 0) ⇒ null (màn ẩn ô ấy — không bịa). Chặng: Hành trình có `changHienTai` của máy chủ;
 * nguồn khác suy đúng như vạch chặng ở Hôm nay (xong chặng i khi đã làm ≥ 6·i câu).
 * KHẨN 12/10 21h30 (thầy: "lúc chiều thì hiện 31 câu giờ lại hiện 2 chặng"):
 *  · Ở nhánh Gói 7, `theLuc.tong` KHÔNG phải mức ngày — nó là đã làm + số việc kế hoạch XẾP ĐƯỢC (kho thiếu câu ⇒ 7 + 1 = 8 thay vì M = 32). Sảnh có
 *    `goi7` thô mà cốt lõi hỏng thì `docSanh` đã trả LỖI, nên tới đây Sảnh nhánh gói luôn có `goi7` và M lấy từ `goi7.toiThieu`.
 *  · `tienDoCu` (mức kế hoạch ngày cũ, kẹp 8–16 câu) CHỈ dùng khi Sảnh ĐÃ VỀ và không có số Sảnh (chế độ cũ). Sảnh chưa về / lỗi lần đầu ⇒ chưa biết
 *    em học Gói 7 hay Hành trình ⇒ null (khung xương / "Thử lại"), không vẽ "7/8" của kế hoạch cũ thành số hôm nay.
 */
export function soHomNay(kq: KetQuaSanh | null | undefined, tienDoCu?: { daLam: number; mucTieu: number }): SoHomNay | null {
  const s = kq && kq.cheDo2 && 'sanh' in kq ? kq.sanh : null, g = s?.goi7, ht = s?.hanhTrinh, cu = kq ? tienDoCu : undefined
  const daLam = g?.daLamHomNay ?? ht?.daLam ?? (s ? Math.max(0, s.theLuc.tong - s.theLuc.con) : cu?.daLam ?? null)
  const muc = g?.toiThieu ?? ht?.toiThieu ?? s?.theLuc.tong ?? cu?.mucTieu ?? null
  if (daLam === null || muc === null || !Number.isFinite(daLam) || !Number.isFinite(muc) || muc <= 0) return null
  const soChang = (g ? null : ht?.soChang) ?? Math.ceil(muc / CAU_MOI_CHANG)
  const chang = soChang <= 0 ? null : ht && !g ? (ht.changHienTai >= 1 ? Math.min(ht.changHienTai, soChang) : null) : Math.min(soChang, ((daLam / CAU_MOI_CHANG) | 0) + 1)
  return { daLam, muc, chang, soChang }
}


/** Số chặng đã xong hôm nay — cùng luật vạch chặng ở Hôm nay; chặng đang dở chưa qua màn báo hoàn thành (`changDangDo`) chưa được tính là xong. */
export function soChangXong(s: SoHomNay): number {
  if (s.duNgay) return s.soChang
  let x = 0
  const tongCau = Math.max(s.muc, s.soChang * CAU_MOI_CHANG)
  for (let i = 0; i < s.soChang; i++) {
    const ranh = i === s.soChang - 1 ? tongCau : Math.min((i + 1) * CAU_MOI_CHANG, tongCau)
    if (s.daLam >= ranh) x++
  }
  return s.changDangDo && x >= s.changDangDo ? s.changDangDo - 1 : x
}

// ───────────────────────────── CHỮ PHẢN HỒI ─────────────────────────────

/** "Làm trong 41 giây" · "Làm trong 1 phút 05 giây". Không đo được ⇒ ''. */
export function chuThoiGian(ms: number | undefined): string {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return ''
  const g = Math.max(1, Math.round(ms / 1000))
  return g < 60 ? `Làm trong ${g} giây` : `Làm trong ${Math.floor(g / 60)} phút ${String(g % 60).padStart(2, '0')} giây`
}


export interface YSoSanh {
  /** Chữ cái ý: a b c d. */
  chu: 'a' | 'b' | 'c' | 'd'
  /** Em chọn (null khi em chưa chọn — ví dụ câu học cách giải). */
  chon: 'D' | 'S' | null
  dapAn: 'D' | 'S' | null
  dung: boolean
}
/** Đúng–sai: so từng ý em chọn với đáp án máy chủ trả SAU khi nộp ("DSDS"). */
export function soSanhDungSai(tra: string, dapAn: string): YSoSanh[] {
  const da = String(dapAn ?? '').toUpperCase().replace(/Đ/g, 'D')
  return (['a', 'b', 'c', 'd'] as const).map((chu, i) => {
    const c = tra[i] === 'D' || tra[i] === 'S' ? (tra[i] as 'D' | 'S') : null
    const d = da[i] === 'D' || da[i] === 'S' ? (da[i] as 'D' | 'S') : null
    return { chu, chon: c, dapAn: d, dung: c !== null && c === d }
  })
}
export const chuDS = (v: 'D' | 'S' | null) => (v === 'D' ? 'Đúng' : v === 'S' ? 'Sai' : '')
