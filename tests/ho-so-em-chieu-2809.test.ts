// @vitest-environment node
// HỒ SƠ EM CHO TỜ CHIẾU (bản vẽ LenBang-Moi 28/09): `/gv/ho-so-len-bang` CHỈ ĐỌC, số thật từ sổ — trên D1 thật (node:sqlite).
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvHoSoLenBang, hangTuTiLeDung, tenNguon } from '../server/src/ho-so-em-chieu'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-09-28T12:00:00Z') // 19:00 giờ VN

function fixture() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Nguyễn Minh Anh','12','x')")
  d.sql.exec(`INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('DE1','Q1','v1','g1','D1','{"tenDang":"Este – lipit"}')`)
  return { d, env }
}

describe('/gv/ho-so-len-bang', () => {
  it('khối "Câu này": số lần, đúng/sai, nguồn, gợi ý, giây, đáp án em chọn (raw_json · game_v2_attempt · chi_tiet_cau)', async () => {
    const { d, env } = fixture()
    await ghiSuKien(env, [
      { nguon: 'game', maNguon: 'P1', sbd: 'S1', qid: 'Q1', lan: 1, ketQua: 0, giay: 52, luc: new Date(T0 - 3 * 864e5).toISOString(), maDang: 'D1', attemptId: 'P1|Q1', raw: { chon: 'B' } },
      { nguon: 'game', maNguon: 'P2', sbd: 'S1', qid: 'Q1', lan: 1, ketQua: 1, giay: 31, luc: new Date(T0 - 2 * 864e5).toISOString(), maDang: 'D1', attemptId: 'P2|Q1', assistance: 'assisted' },
      { nguon: 'thi', maNguon: 'CA9', sbd: 'S1', qid: 'Q1', lan: 1, ketQua: 1, luc: new Date(T0 - 864e5).toISOString(), maDang: 'D1' },
      { nguon: 'len_bang', maNguon: 'LB', sbd: 'S1', qid: 'Q1', lan: 1, ketQua: 0, luc: new Date(T0 - 1000).toISOString(), maDang: 'D1' },
    ])
    d.sql.exec(`INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES('P2','S1','{"doan":"x"}','x')`)
    d.sql.exec(`INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES('P2|Q1','S1','P2','Q1','g1','{"traLoi":"A"}','x')`)
    d.sql.exec(`INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,dap_an_chon,dung_sai,cap_nhat_luc) VALUES('k','CA9','S1',1,'I',3,'Q1','A',1,'x')`)
    d.sql.exec(`INSERT INTO len_bang(sbd,qid,dat,luc) VALUES('S1','Q1',0,'2026-09-27T12:00:00Z')`)
    const r = await gvHoSoLenBang(env, { sbd: 'S1', qid: 'Q1' }, T0)
    expect(r.ok).toBe(true)
    const c = r.cauNay as { soLan: number; soDung: number; soSai: number; lan: { nguon: string; chon: string | null; coGoiY: boolean; giay: number | null }[] }
    expect([c.soLan, c.soDung, c.soSai]).toEqual([4, 2, 2])
    expect(c.lan.map((x) => x.nguon)).toEqual(['Đảo', 'Đoàn', 'Ca kiểm tra', 'Lên bảng'])
    expect(c.lan.map((x) => x.chon)).toEqual(['B', 'A', 'A', null])
    expect(c.lan[1]!.coGoiY).toBe(true)
    expect(c.lan[0]!.giay).toBe(52)
    expect((r.lenBang as unknown[]).length).toBe(1)
    expect((r.ngay14 as unknown[]).length).toBe(14)
    expect((r.saiGanNhat as { dang: string }[])[0]!.dang).toBe('Este – lipit')
    expect((r.em as { hoTen: string }).hoTen).toBe('Nguyễn Minh Anh')
  })
  it('em không có ⇒ ok:false; mốc hạng 40/65/85; tên nguồn', async () => {
    const { env } = fixture()
    expect((await gvHoSoLenBang(env, { sbd: 'KHONG' }, T0)).ok).toBe(false)
    expect([0.39, 0.4, 0.65, 0.85, 0.86].map(hangTuTiLeDung)).toEqual(['L1', 'L2', 'L3', 'L3', 'L4'])
    expect(tenNguon('game', true)).toBe('Đoàn')
  })
})
