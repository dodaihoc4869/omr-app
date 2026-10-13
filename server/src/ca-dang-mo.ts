// CA KIỂM TRA ĐANG MỞ CỦA EM — một lượt D1 (tách từ bi-a.ts 14/10 khi gỡ Bi-a).
import type { Env, DongCa, DongLuot } from './kieu'
import { quyetDinhVaoThi } from './luat-vao-thi'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))

/**
 * Em đang có ca kiểm tra mở (tách khỏi bi-a.ts 14/10 khi gỡ Bi-a; Sửa từng bước, lời giải, tự luyện, thang tự gỡ dùng để đóng khi có ca). Dùng đúng luật cổng vào thi (`quyetDinhVaoThi`) trên ca `mo` của lớp em — cùng nguồn với `/hs/ca-dang-mo`,
 * nhưng KHÔNG xét phạm vi khối/danh sách chọn (chặt hơn một chút: ca của lớp đang mở là đóng). Lỗi đọc ⇒ coi như không có ca.
 */
export async function coCaDangMo(env: Env, sbd: string, nowMs: number, batBuocKiemDuoc = false): Promise<boolean> {
  try {
    // Tối ưu 05/10: MỘT lượt D1 thay hai lượt nối tiếp (lớp em → ca mở của lớp). Ca `mo` (mọi lớp, thường 0–vài dòng) kèm lớp đã TRIM của ca và lớp của em;
    // lọc lớp ở đây đúng như cũ: lớp em `trim()` của JS, rỗng ⇒ không ca; so BẰNG với TRIM(COALESCE(c.lop,'')) như câu cũ.
    const r = await env.DB.prepare(`SELECT (SELECT COALESCE(NULLIF(h.lop, ''), d.lop, '') FROM (SELECT ? AS sbd) x LEFT JOIN hoc_sinh h ON h.sbd = x.sbd LEFT JOIN danh_sach d ON d.sbd = x.sbd) AS lop_em,
        TRIM(COALESCE(c.lop, '')) AS lop_ca, c.trang_thai, c.loai, c.bat_dau, c.het_han_vao, c.thoi_gian_phut, c.dong_bo_gio, c.bat_dau_thi_luc, c.han_nop,
        (SELECT l.trang_thai FROM luot l WHERE l.ma_ca = c.ma_ca AND l.sbd = ? ORDER BY l.lan_thu DESC LIMIT 1) AS luot_tt
        FROM ca c WHERE c.trang_thai = 'mo' AND COALESCE(c.loai, 'thi') = 'thi'`).bind(sbd, sbd).all<Row>()
    const ds = r.results ?? []
    const lop = ds.length ? str(ds[0]!.lop_em).trim() : ''
    if (!lop) return false
    for (const c of ds.filter((x) => str(x.lop_ca) === lop).map(({ lop_em: _e, lop_ca: _c, ...x }) => x)) {
      const luot = c.luot_tt ? ({ trang_thai: str(c.luot_tt), lan_thu: 1, id_thiet_bi: '' } as unknown as DongLuot) : null
      if (quyetDinhVaoThi(c as unknown as DongCa, luot, '', nowMs).ok) return true
    }
    return false
  } catch (e) { if (batBuocKiemDuoc) throw e; return false }
}
