// @vitest-environment node
// ĐỔI TÊN 12028 "Nguyễn Công Hy" ⇒ "Nguyễn Công Huy" (thầy lệnh 21/09 ~11:00, Boss soát) bằng TỆP SQL MỘT LẦN (server/doi-ten-2109-12028.sql + lệnh lùi), làm ĐÚNG logic lệnh `/hoc-sinh/doi-ten`
// (server/src/doi-ten-hoc-sinh.ts): kiểm bằng ĐỐI CHỨNG — chạy tệp SQL trên một D1 giả, chạy lệnh thật trên D1 giả y hệt, hai bên phải ra CÙNG kết quả ở mọi bảng.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { doiTenHocSinh } from '../server/src/doi-ten-hoc-sinh'
import { taoD1That, type D1That } from './_d1-that'

const HY = 'Nguyễn Công Hy'
const HUY = 'Nguyễn Công Huy'
const sqlTien = readFileSync('server/doi-ten-2109-12028.sql', 'utf-8')
const sqlLui = readFileSync('server/doi-ten-2109-12028-lui.sql', 'utf-8')
const BANG = ['danh_sach', 'hoc_sinh', 'luot', 'btvn_em', 'phong_cho', 'phieu', 'chan_vao'] as const
const chup = (d: D1That) => JSON.stringify(BANG.map((b) => d.sql.prepare(`SELECT * FROM ${b} ORDER BY 1, 2`).all()))

/** 12028 có mặt ở đủ năm bảng + phieu + chan_vao (phải giữ nguyên); 12029 CÙNG TÊN (không được đổi); một dòng bản chép không có tên (giữ NULL). */
function truong(ten = HY): D1That {
  const d = taoD1That()
  for (const [s, t] of [['12028', ten], ['12029', HY]] as const) {
    d.sql.prepare("INSERT INTO danh_sach(sbd,ho_ten,nam_sinh,lop,cap_nhat_luc) VALUES(?,?,'2008','12','x')").run(s, t)
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,nam_sinh,lop,cap_nhat_luc) VALUES(?,?,'2008','12','x')").run(s, t)
    d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,cap_nhat_luc,ho_ten) VALUES(?,?,?,1,'x','da_nop','x',?)").run(`C1|${s}|1`, 'C1', s, t)
    d.sql.prepare("INSERT INTO phong_cho(khoa,ma_ca,sbd,ho_ten,ghi_luc) VALUES(?,?,?,?,'x')").run(`C1|${s}`, 'C1', s, t)
    d.sql.prepare("INSERT INTO phieu(ma,ma_ca,sbd,ho_ten,luu_luc) VALUES(?,?,?,?,'x')").run(`P-${s}`, 'C1', s, t)
    d.sql.prepare("INSERT INTO chan_vao(ma_ca,sbd,ho_ten_goi,ho_ten_ds,luc) VALUES('C1',?,?,?,'x')").run(s, t, t)
  }
  d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,giao_luc,han_nop,so_cau,da_xoa,cap_nhat_luc) VALUES('B1','C1','DE1','x','2026-09-30T03:00:00.000Z',10,0,'x')").run()
  d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten,so_cau) VALUES('B1|12028','B1','12028',?,10)").run(ten)
  d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten,so_cau) VALUES('B1|12029','B1','12029',?,10)").run(HY)
  d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,cap_nhat_luc,ho_ten) VALUES('C2|12028|1','C2','12028',1,'x','da_nop','x',NULL)").run() // bản chép KHÔNG có tên
  return d
}

describe('tệp SQL đổi tên = ĐÚNG lệnh /hoc-sinh/doi-ten', () => {
  it('ĐỐI CHỨNG: tệp SQL và lệnh thật ra CÙNG trạng thái ở cả 7 bảng; 12028 đổi ở năm bảng, phieu + chan_vao + em 12029 + dòng không tên y nguyên', async () => {
    const a = truong()
    const b = truong()
    const truoc = chup(a)
    a.sql.exec(sqlTien)
    const r = await doiTenHocSinh(b.env, { sbd: '12028', hoTen: HUY })
    expect(r).toMatchObject({ ok: true, tenCu: HY, tenMoi: HUY })
    expect(chup(a)).toBe(chup(b))
    expect(chup(a)).not.toBe(truoc)
    const ten = (d: D1That, bang: string, sbd: string) => (d.sql.prepare(`SELECT ho_ten FROM ${bang} WHERE sbd = ? ORDER BY 1`).all(sbd) as { ho_ten: string | null }[]).map((x) => x.ho_ten)
    for (const bang of ['danh_sach', 'hoc_sinh', 'btvn_em', 'phong_cho']) expect(ten(a, bang, '12028'), bang).toEqual([HUY])
    expect(ten(a, 'luot', '12028')).toEqual([null, HUY]) // dòng không có tên vẫn NULL
    for (const bang of ['phieu']) expect(ten(a, bang, '12028'), bang).toEqual([HY]) // sổ đã phát: giữ lịch sử
    expect(a.sql.prepare("SELECT ho_ten_goi, ho_ten_ds FROM chan_vao WHERE sbd = '12028'").get()).toEqual({ ho_ten_goi: HY, ho_ten_ds: HY })
    for (const bang of BANG.filter((x) => x !== 'chan_vao')) expect(ten(a, bang, '12029'), `12029 ${bang}`).toEqual([HY]) // em cùng tên KHÔNG bị đổi
  })
  it('LÙI đưa về đúng trạng thái ban đầu; chạy tiến / lùi nhiều lần không đổi thêm', () => {
    const d = truong()
    const truoc = chup(d)
    d.sql.exec(sqlTien)
    const sau = chup(d)
    d.sql.exec(sqlTien)
    expect(chup(d)).toBe(sau)
    d.sql.exec(sqlLui)
    expect(chup(d)).toBe(truoc)
    d.sql.exec(sqlLui)
    expect(chup(d)).toBe(truoc)
  })
  it('AN TOÀN: em đang mang tên KHÁC (đã sửa tay) ⇒ tệp tiến không đổi gì, cả các bản chép; tên viết hoa/thiếu dấu cũng không khớp', () => {
    for (const ten of ['Nguyễn Công Hùng', 'Nguyen Cong Hy', 'nguyễn công hy']) {
      const d = truong(ten)
      const truoc = chup(d)
      d.sql.exec(sqlTien)
      expect(chup(d), ten).toBe(truoc)
    }
  })
  it('AN TOÀN cho tệp LÙI: em đã được thầy sửa sang tên khác sau khi đổi ⇒ tệp lùi KHÔNG đè tên mới ở hồ sơ / danh sách / bản chép', () => {
    const d = truong()
    d.sql.exec(sqlTien)
    d.sql.exec("UPDATE hoc_sinh SET ho_ten = 'Tên Sửa Tay' WHERE sbd = '12028'; UPDATE danh_sach SET ho_ten = 'Tên Sửa Tay' WHERE sbd = '12028'")
    const truoc = chup(d)
    d.sql.exec(sqlLui)
    expect(chup(d)).toBe(truoc)
    const e = truong()
    e.sql.exec(sqlTien)
    e.sql.exec("UPDATE hoc_sinh SET ho_ten = 'Tên Sửa Tay' WHERE sbd = '12028'") // chỉ một bảng chính bị sửa tay, bảng kia vẫn là Huy
    e.sql.exec(sqlLui)
    expect((e.sql.prepare("SELECT ho_ten FROM hoc_sinh WHERE sbd = '12028'").get() as { ho_ten: string }).ho_ten).toBe('Tên Sửa Tay')
    expect((e.sql.prepare("SELECT ho_ten FROM danh_sach WHERE sbd = '12028'").get() as { ho_ten: string }).ho_ten).toBe(HY)
  })
  it('chỉ đụng sbd 12028; không DELETE / DROP / INSERT; cả tệp tiến và tệp lùi có câu kiểm; có đúng tên trong tệp', () => {
    for (const sql of [sqlTien, sqlLui]) {
      const lenh = sql.replace(/^--.*$/gm, '')
      expect(lenh).not.toMatch(/\b(DELETE|DROP|INSERT|ALTER|TRUNCATE)\b/i)
      expect([...lenh.matchAll(/UPDATE (\w+) SET ho_ten/g)].map((m) => m[1]).sort()).toEqual(['btvn_em', 'danh_sach', 'hoc_sinh', 'luot', 'phong_cho'])
      for (const l of lenh.split(';').filter((x) => /UPDATE/.test(x))) expect(l).toContain("sbd = '12028'")
      expect(lenh).toMatch(/SELECT 'danh_sach' AS bang/)
    }
    expect(sqlTien).toContain(`SET ho_ten = '${HUY}'`)
    expect(sqlLui).toContain(`SET ho_ten = '${HY}'`)
    expect(HY.normalize('NFC')).toBe(HY)
    expect(HUY.normalize('NFC')).toBe(HUY)
  })
})
