// MÀN HÀNH TRÌNH — MỘT TRANG 4 BƯỚC (thầy 21/10, bản vẽ docs/ban-ve-hanh-trinh-2110 đã duyệt: "bỏ thẻ dạy học và đầu giờ và thẻ chữa bài đi …
// 1 điểm danh, 2 là gọi lên bảng đầu giờ, 3 dạy học, 4 chữa câu khó và tính toán" + "các bước sau đều lấy danh sách điểm danh ở bước 1, các bước
// sau chọn độc lập được theo chức năng") — phép THUẦN, không IO:
//   · bốn bước + trạng thái từng bước (xong / đang mở / chưa làm) — mỗi bước tự có cờ xong, KHÔNG khoá theo thứ tự;
//   · bước mở mặc định khi vào màn; chữ của ô "Buổi dạy";
//   · bảng "Bài đang giao": gói bài 7 ngày còn hạn (lệnh `/gv/goi-bai-7`, máy chủ `server/src/goi-bai-7-thay.ts`) ⇒ một dòng mỗi lớp/gói, hai tỉ lệ
//     "Đã gặp câu gốc" ⊇ "Đã tự làm" cộng đúng như `tomTatLop` của thẻ Bài mới trong 7 ngày (không bịa số; lớp chưa em nào nhận ⇒ không tỉ lệ).
import type { BuoiHoc } from '../../lib/buoi-hoc-api'
import { chuConLai, phanTram, tomTatLop, type DuGoi7, type GoiDu } from './goi7-ui'
import { ngayNgan, thuDu, thuNgan } from './bai-hang-ngay-ui'

// ------------------------------------------------------------------ bốn bước
export type SoBuoc = 1 | 2 | 3 | 4
export type TrangThaiBuoc = 'xong' | 'dang' | 'cho'
export const TEN_BUOC = ['Điểm danh', 'Gọi lên bảng đầu giờ', 'Dạy học', 'Chữa câu khó & tính toán'] as const
/** Tên ngắn cho thước tiến trình nằm ngang (điện thoại, màn ngang). */
export const TEN_NGAN_BUOC = ['Điểm danh', 'Đầu giờ', 'Dạy học', 'Chữa câu'] as const
export const CHU_TRANG_THAI_BUOC: Record<TrangThaiBuoc, string> = { xong: 'đã xong', dang: 'đang mở', cho: 'chưa làm' }

/** `xong[i]` = cờ xong của CHÍNH bước i+1; `mo` = bước đang mở. Bước đang mở là "dang"; bước khác xong hay chưa theo cờ của nó (bước độc lập). */
export function trangThaiBuoc(xong: readonly boolean[], mo: number | null): TrangThaiBuoc[] {
  return xong.map((x, i) => (i + 1 === mo ? 'dang' : x ? 'xong' : 'cho'))
}

/** Bước mở khi vào màn: lối vào chỉ định (Hôm nay › Cần thầy chữa ⇒ 4) thắng; chưa có em có mặt ⇒ 1; có rồi ⇒ bước thầy mở lần trước trong buổi
 *  này (nhớ trên máy), không có ⇒ 2. Còn đang tìm buổi ⇒ null (chưa chọn — tránh mở bước 1 rồi nhảy). */
export function buocMacDinh(o: { chiDinh: SoBuoc | null; dangTai: boolean; coMat: number; nho: SoBuoc | null }): SoBuoc | null {
  if (o.chiDinh) return o.chiDinh
  if (o.dangTai) return null
  if (o.coMat <= 0) return 1
  return o.nho ?? 2
}

// ------------------------------------------------------------------ ô "Buổi dạy"
const LECH_VN_MS = 7 * 3600_000
/** "12 - Lớp Thường · Thứ Hai 12/10 · 18:00" (giờ Việt Nam, 24 giờ). Buổi "Mọi lớp" ⇒ "Mọi lớp"; buổi đã kết thúc ⇒ thêm "(đã kết thúc)". */
export function chuBuoi(b: Pick<BuoiHoc, 'lop' | 'moLuc' | 'dangMo'>): string {
  const ms = Date.parse(b.moLuc)
  const lop = b.lop.trim() || 'Mọi lớp'
  const luc = Number.isFinite(ms) ? new Date(ms + LECH_VN_MS).toISOString() : ''
  const ngayGio = luc ? `${thuDu(luc.slice(0, 10))} · ${luc.slice(11, 16)}` : ''
  return [lop, ngayGio].filter(Boolean).join(' · ') + (b.dangMo ? '' : ' (đã kết thúc)')
}

// ------------------------------------------------------------------ bảng "Bài đang giao"
/** Tối đa ngần này dòng (mỗi dòng một lệnh đọc chi tiết gói). */
export const TOI_DA_DONG_GIAO = 12

/** Gói còn hạn (hạn nộp từ hôm nay trở đi, giờ Việt Nam), hạn gần trước rồi theo tên lớp. Gói hạn không đọc được ⇒ bỏ (không đoán). */
export function goiDangGiao(goi: readonly GoiDu[], homNay: string): GoiDu[] {
  return goi
    .filter((g) => /^\d{4}-\d{2}-\d{2}$/.test(String(g.han ?? '').slice(0, 10)) && g.han.slice(0, 10) >= homNay)
    .sort((a, b) => a.han.localeCompare(b.han) || a.lop.localeCompare(b.lop, 'vi') || a.ten.localeCompare(b.ten, 'vi'))
}

export interface DongBaiDangGiao {
  id: string
  lop: string
  ten: string
  han: string
  /** Số em đã nhận gói (máy chủ `soEm`). 0 ⇒ chưa em nào nhận — KHÔNG có tỉ lệ. */
  soEm: number
  /** % phần câu gốc cả lớp đã gặp / đã tự làm (gặp ⊇ tự làm); null khi chưa em nào nhận hoặc gói chưa có câu. */
  pGap: number | null
  pTuLam: number | null
}
/** Một dòng từ chi tiết gói máy chủ trả. */
export function dongBaiDangGiao(g: GoiDu, du: Pick<DuGoi7, 'em' | 'cau'> & { soEm?: number }): DongBaiDangGiao {
  const em = Array.isArray(du.em) ? du.em : []
  const tt = tomTatLop({ em, cau: Array.isArray(du.cau) ? du.cau : [] })
  const soEm = typeof du.soEm === 'number' && Number.isFinite(du.soEm) ? Math.max(du.soEm, em.length) : em.length
  return {
    id: g.id,
    lop: g.lop,
    ten: g.ten,
    han: g.han,
    soEm,
    pGap: soEm ? phanTram(tt.gap, tt.tong) : null,
    pTuLam: soEm ? phanTram(tt.tuLam, tt.tong) : null,
  }
}

/** "T6 16/10" (cột hẹp) + "còn 4 ngày" (mốc thật, luật A1.6); chữ đủ "23:59 · Thứ Sáu 16/10" cho trình đọc màn hình. */
export function chuHanDong(han: string, homNay: string): { ngan: string; con: string | null; du: string } {
  const h = han.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(h)) return { ngan: han, con: null, du: han }
  return { ngan: `${thuNgan(h)} ${ngayNgan(h)}`, con: chuConLai(h, homNay), du: `23:59 · ${thuDu(h)}` }
}

/** "Bài đang giao · 5 lớp" — nhiều gói cùng một lớp ⇒ "6 bài ở 5 lớp". */
export function chuDemGiao(dong: readonly Pick<DongBaiDangGiao, 'lop'>[]): string {
  const soLop = new Set(dong.map((d) => d.lop)).size
  return dong.length === soLop ? `${soLop} lớp` : `${dong.length} bài ở ${soLop} lớp`
}
