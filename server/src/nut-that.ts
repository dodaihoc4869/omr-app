// NÚT THẮT — Vòng học khép kín v2, Giai đoạn 2. Câu em đã đi hết thang tự gỡ (đọc lời giải chủ động, làm lại kín ≥ 2 lần, chỉ ra bước
// vướng) mà vẫn sai ⇒ một thẻ gửi thầy. Thầy nhận thẻ GOM theo (nội dung câu, bước vướng) ở "Bàn gỡ nút thắt"; lời thầy gỡ gắn vào
// đúng bước đó của lời giải cho mọi em sau. Tệp này là HỢP ĐỒNG DÙNG CHUNG (bảng + kiểu + ghi/đọc thô) cho:
//   · phía em: `thang-tu-go.ts` (cổng nỗ lực, gửi thầy) — Giai đoạn 2 học sinh;
//   · phía thầy: `ban-go-nut-that.ts` (gom thẻ, gỡ, kèm riêng) — Giai đoạn 2 thầy.
// Bảng CHỈ THÊM, tự tạo lần đầu dùng; bản SQL: server/migration-0210-v2.sql.
import type { Env } from './kieu'

export const TAO_BANG_NUT_THAT = [
  // Một thẻ = một em × một câu (băm nội dung) × một bước vướng. trang_thai: cho (chờ thầy) · da_go (thầy đã gỡ) · kem_rieng (vẫn sai sau
  // lời gỡ ⇒ kèm riêng trên lớp) · xong (lỗi đã đóng theo luật chung).
  `CREATE TABLE IF NOT EXISTS nut_that (id TEXT PRIMARY KEY, sbd TEXT NOT NULL, qid TEXT NOT NULL, bam TEXT NOT NULL, buoc INTEGER NOT NULL,
    viet TEXT, bang_chung_json TEXT, gui_luc TEXT NOT NULL, ngay_vn TEXT NOT NULL, trang_thai TEXT NOT NULL DEFAULT 'cho', go_id TEXT, cap_nhat_luc TEXT NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS nut_that_cho ON nut_that(trang_thai, bam, buoc)',
  'CREATE INDEX IF NOT EXISTS nut_that_em ON nut_that(sbd, ngay_vn)',
  // Lời thầy gỡ, gắn vào (băm câu, bước). kieu: ngan (gõ/ghi âm/ảnh ~1 phút) · lop (dạy trên lớp — buoi_hoc) · sua (sửa lời giải/đề).
  `CREATE TABLE IF NOT EXISTS loi_go (id TEXT PRIMARY KEY, bam TEXT NOT NULL, buoc INTEGER NOT NULL, kieu TEXT NOT NULL, noi_dung TEXT,
    tep_khoa TEXT, buoi_hoc TEXT, luc TEXT NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS loi_go_cau ON loi_go(bam, buoc)',
  // Câu kiểm từng bước em đã trả lời (máy chủ chấm — em không tự khai). Một dòng mỗi lần trả lời.
  `CREATE TABLE IF NOT EXISTS cau_kiem_lam (id INTEGER PRIMARY KEY AUTOINCREMENT, sbd TEXT NOT NULL, qid TEXT NOT NULL, bam TEXT NOT NULL, buoc INTEGER NOT NULL,
    tra_loi TEXT, dung INTEGER NOT NULL, giay INTEGER NOT NULL DEFAULT 0, luc TEXT NOT NULL, ngay_vn TEXT NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS cau_kiem_lam_em ON cau_kiem_lam(sbd, qid)',
]
const daTao = new WeakMap<object, Promise<void>>()
export function damBaoBangNutThat(env: Env): Promise<void> {
  const k = env.DB as unknown as object
  let p = daTao.get(k)
  if (!p) {
    p = env.DB.batch(TAO_BANG_NUT_THAT.map((s) => env.DB.prepare(s))).then(() => undefined)
    p.catch(() => daTao.delete(k))
    daTao.set(k, p)
  }
  return p
}

export type TrangThaiNut = 'cho' | 'da_go' | 'kem_rieng' | 'xong'
export interface NutThat { id: string; sbd: string; qid: string; bam: string; buoc: number; viet: string; bangChung: Record<string, unknown>; guiLuc: string; ngayVn: string; trangThai: TrangThaiNut; goId: string | null }
export interface LoiGo { id: string; bam: string; buoc: number; kieu: 'ngan' | 'lop' | 'sua'; noiDung: string; tepKhoa: string | null; buoiHoc: string | null; luc: string }

/** Trần thẻ một em một ngày (đặc tả v2: "Không gửi bừa"). */
export const TRAN_THE_NGAY = 5
