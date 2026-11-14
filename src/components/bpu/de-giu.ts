// MÀN BÌNH PHẢN ỨNG CỦA EM — phần thuần tách khỏi ManBinhPhanUng.tsx (cổng cỡ tệp 60 KB).
// ĐỀ CỦA LƯỢT GIỮ TRÊN MÁY (14/11, thầy «sửa triệt để hiện tượng lag, sửa tận gốc»): phòng chỉ gửi đề MỘT lần mỗi lượt (`luot.ck` = khoá đề); view sau mang
// `cau: null` + dấu `gon: 1` ⇒ ghép đề đang giữ. Lệch khoá (vừa nối lại / mất tin) ⇒ xin lại cả view TỐI ĐA MỘT lần mỗi khoá (không vòng xin) và bỏ tin này.
// Chỉ view mang dấu `gon` mới là view lược đề — view không có đề thật (lượt rỗng) không bao giờ khiến máy xin lại.

/** Giờ còn «m:ss». */
export const gio = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
/** Giờ trong ngày «hh:mm». */
export const gioPhut = (ms: number | null | undefined) => { if (!ms) return ''; const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }

export function taoDeGiu() {
  let giu: { ck: string; cau: unknown } | null = null, daXin = ''
  return {
    /** Ghép đề vào view (sửa tại chỗ). Trả false ⇒ thiếu đề, đã xin lại ⇒ nơi gọi BỎ tin này. */
    ghep(m: unknown, xin: () => void): boolean {
      const l = (m as { luot?: { ck?: string; cau?: unknown; gon?: number } | null }).luot
      if (!l?.ck) return true
      if (l.cau != null) { giu = { ck: l.ck, cau: l.cau }; return true }
      if (l.gon !== 1) return true
      if (giu?.ck === l.ck) { l.cau = giu.cau; return true }
      if (daXin === l.ck) return true
      daXin = l.ck; xin(); return false
    },
  }
}
