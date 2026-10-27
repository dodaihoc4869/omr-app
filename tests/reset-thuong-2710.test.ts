// @vitest-environment node
// RESET × THƯỞNG PHẠT (27/10): mọi bảng thưởng phạt (phần A migration-2610-thuong-phat.sql + phần B migration-2610-giai-ban.sql) phải được phân loại để
// một lần reset không để sót trạng thái chơi lệch với dữ liệu đã xoá. Chỉ kiểm DANH SÁCH (không chạy reset nào trên dữ liệu thật).
//   · reset Hóa 2.0 (phân loại thật): trạng thái chơi XOÁ cùng sổ tinh thể `vang_so` / sổ nguyên tử `exp_so`; bảng xếp tuần (nhãn thầy / PH) GIỮ.
//   · reset 21/09 (job đã xong, không chạy lại): bảng sinh sau ⇒ GIỮ = không đụng.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BANG_GIU_HOA2, BANG_XOA_HOA2 } from '../server/src/reset-hoa2'
import { BANG_GIU, BANG_XOA } from '../server/src/reset-toan-app'

const bangTrong = (tep: string) => [...readFileSync(`server/${tep}`, 'utf8').matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map((m) => m[1]!)
const THUONG = [...bangTrong('migration-2610-thuong-phat.sql'), ...bangTrong('migration-2610-giai-ban.sql')].filter((t) => !t.startsWith('buoi_hoc'))

describe('reset × bảng thưởng phạt', () => {
  it('reset Hóa 2.0: trạng thái chơi thưởng phạt XOÁ (cùng exp_so / vang_so), bảng xếp tuần GIỮ', () => {
    expect(BANG_XOA_HOA2).toEqual(expect.arrayContaining(['exp_so', 'vang_so']))
    for (const t of ['nhiem_vu_ngay', 'ruong_ngay', 'huy_hieu_em', 'cuoc_chuoi', 'kim_cuong_phien', 'thong_bao_thuong', 'thuong_bai_xong', 'giai_tuan', 'ban_hoc', 'go_cua', 'chuoi_binh_mua']) {
      expect(BANG_XOA_HOA2, t).toContain(t); expect(BANG_GIU_HOA2, t).not.toContain(t)
    }
    expect(BANG_GIU_HOA2).toContain('danh_gia_em_tuan'); expect(BANG_XOA_HOA2).not.toContain('danh_gia_em_tuan')
  })
  it('mọi bảng của hai tệp migration thưởng phạt đều đã phân loại ở CẢ HAI danh sách reset (không bảng nào sót)', () => {
    expect(THUONG.length).toBeGreaterThanOrEqual(13)
    for (const t of THUONG) {
      expect([...BANG_XOA_HOA2, ...BANG_GIU_HOA2], t).toContain(t)
      expect([...BANG_XOA, ...BANG_GIU], t).toContain(t)
    }
  })
})
