// CỬA VÀO CA — một chỗ duy nhất trả lời "em còn vào được không".
//
// Cửa đóng vì HAI lý do khác nhau, và thầy nhìn màn phải phân biệt được:
//   - thầy bấm khoá        → trangThai = 'dong' (hoặc ca đã xoá)
//   - quá hạn vào phòng    → trangThai vẫn 'mo', máy chủ chặn ở `quyetDinhVaoThi_`
//
// Trước 05/09 màn coi thi chỉ nhìn `trangThai`, nên ca quá giờ vào vẫn hiện
// "đang mở" trong khi em đến muộn bấm link thì bị chặn. Nút MỞ CA gỡ cả hai
// (máy chủ xoá luôn HetHanVao), nên trạng thái cũng phải tính cả hai.

export interface CaCuaVao {
  trangThai: string
  /** ISO. Rỗng = không giới hạn giờ vào. */
  hetHanVao?: string
}

export type NhanCuaVao = 'ĐANG MỞ' | 'ĐÃ QUÁ GIỜ VÀO' | 'ĐÃ KHOÁ'

export interface CuaVao {
  /** Em còn vào được không. */
  moCua: boolean
  /** Đóng vì hết hạn giờ vào (chứ không phải thầy bấm khoá). */
  quaGioVao: boolean
  /** Thầy bấm khoá, hoặc ca đã xoá. */
  daKhoa: boolean
  nhan: NhanCuaVao
  /** Bấm MỞ CA có việc để làm không. */
  moDuoc: boolean
  /** Bấm KHOÁ CA có việc để làm không. */
  khoaDuoc: boolean
}

export function cuaVaoCa(ca: CaCuaVao | null | undefined, now: number): CuaVao {
  if (!ca) return { moCua: false, quaGioVao: false, daKhoa: true, nhan: 'ĐÃ KHOÁ', moDuoc: false, khoaDuoc: false }
  const daKhoa = ca.trangThai === 'dong' || ca.trangThai === 'da_xoa'
  const han = ca.hetHanVao ? new Date(ca.hetHanVao).getTime() : NaN
  const coHan = Number.isFinite(han)
  const quaGioVao = coHan && now > han
  const moCua = !daKhoa && !quaGioVao
  return {
    moCua,
    quaGioVao,
    daKhoa,
    // Thầy bấm khoá thắng: ca vừa khoá vừa quá giờ thì lý do thầy cần biết là
    // "đã khoá", vì đó là cái thầy tự làm.
    nhan: daKhoa ? 'ĐÃ KHOÁ' : quaGioVao ? 'ĐÃ QUÁ GIỜ VÀO' : 'ĐANG MỞ',
    // Ca đã xoá thì không mở lại bằng nút này — phải khôi phục ca trước.
    moDuoc: ca.trangThai !== 'da_xoa' && (daKhoa || coHan),
    khoaDuoc: !daKhoa,
  }
}
