// @vitest-environment node
// Bình Phản Ứng — lớp có ca kiểm tra mở SAU lúc điểm danh ⇒ phím P (mở lượt) KHÔNG gửi câu xuống máy em (không cướp màn phòng chờ / đang thi).
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvBpuLuot } from '../server/src/phong-binh-phan-ung'
import type { Env } from '../server/src/kieu'

describe('mở lượt khi lớp có ca mở', () => {
  it('chặn với lyDo ca-mo, phòng không mở lượt', async () => {
    const d = taoD1That()
    d.sql.exec("CREATE TABLE IF NOT EXISTS buoi_hoc (id TEXT PRIMARY KEY, ten TEXT, lop TEXT, bi_mat TEXT, mo_luc TEXT, het_han TEXT, dong_luc TEXT, cap_nhat_luc TEXT)")
    d.sql.exec("INSERT INTO buoi_hoc (id, ten, lop, bi_mat, mo_luc, het_han, cap_nhat_luc) VALUES ('b1', 'Buổi', '12A1', 'x', '2026-11-07T00:00:00Z', '2099-01-01T00:00:00Z', '2026-11-07T00:00:00Z')")
    // Cột NOT NULL không mặc định của bảng `ca` (lược đồ thật) ⇒ điền giá trị rỗng; bốn cột cần cho phép thử điền đúng.
    const cotCa = d.sql.prepare("SELECT name, type, \"notnull\" AS nn, dflt_value AS md FROM pragma_table_info('ca')").all() as { name: string; type: string; nn: number; md: unknown }[]
    const can: Record<string, string | number> = { ma_ca: 'CA1', lop: '12A1', trang_thai: 'mo', loai: 'thi' }
    const cot = cotCa.filter((c) => c.name in can || (c.nn && c.md == null))
    d.sql.prepare(`INSERT INTO ca (${cot.map((c) => c.name).join(', ')}) VALUES (${cot.map(() => '?').join(', ')})`).run(...cot.map((c) => can[c.name] ?? (/INT|REAL|NUM/i.test(c.type) ? 0 : '')))
    // SỬA CÓ CHỦ ĐÍCH 13/11 (nạp sẵn câu, server/src/bpu-nap-san.ts): Worker hỏi phòng `/luot-nhanh` TRƯỚC; phòng giả này không trả `nhanh: true`
    // ⇒ Worker đi đường cũ ⇒ gặp ca mở ⇒ chặn. Khoá giữ nguyên tinh thần: phòng KHÔNG được mở lượt (`/luot`).
    let goiPhong = 0
    const env = { ...d.env, MA_BI_MAT: 'x', PHONG_BPU: { idFromName: (t: string) => ({ toString: () => t }), get: () => ({ fetch: async (r: Request) => { if (new URL(r.url).pathname === '/luot') goiPhong++; return new Response('{"ok":true}') } }) } } as unknown as Env
    const r = await gvBpuLuot(env, { buoiId: 'b1', qid: 'q-khong-co', hanGiay: 60 })
    expect(r.ok).toBe(false)
    expect(r.lyDo).toBe('ca-mo')
    expect(goiPhong).toBe(0)
  })
})
