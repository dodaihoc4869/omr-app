// @vitest-environment node
// LỚP CỦA MỘT EM ĐỌC ĐÚNG DÒNG CỦA EM (31/10, thử tải 2000 em ảo): trước — `lopCuaEm` đọc CẢ bảng hoc_sinh + danh_sach (50.000 dòng / lần) ⇒ D1 quá tải,
// 30% «Máy chủ đang bận». Nay đọc theo khoá chính sbd; kết quả y hệt bảng cả trường (em khoá ⇒ null; danh_sach trước, tên lớp gán ở hoc_sinh; chỉ có hoc_sinh).
import { describe, expect, it } from 'vitest'
import { emCuaLopBai, lopCuaEm } from '../server/src/bai-da-day'
import { xoaMoiDem } from '../server/src/dem-chung'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import type { Env } from '../server/src/kieu'

function kho() {
  xoaMoiDem()
  const k = taoKhoOmni({}, 6)
  k.d.sql.exec(`UPDATE hoc_sinh SET ten_lop='12 - Chuyên' WHERE sbd='S2';
    UPDATE hoc_sinh SET trang_thai='khoa' WHERE sbd='S3';
    INSERT INTO danh_sach(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Em Một','11','x'),('S2','Em Hai','12','x'),('D9','Chỉ danh sách','10','x')`)
  const cau: string[] = []
  const g = k.env.DB as unknown as { prepare(q: string): unknown }
  const goc = g.prepare.bind(g)
  g.prepare = (q: string) => { cau.push(q.replace(/\s+/g, ' ')); return goc(q) }
  return { env: k.env as Env, cau }
}

describe('lớp của một em', () => {
  it('đọc theo sbd, không quét cả bảng; kết quả y hệt bảng cả trường', async () => {
    const { env, cau } = kho()
    const ds = ['S1', 'S2', 'S3', 'S4', 'D9', 'KHONG_CO']
    const motEm = await Promise.all(ds.map((s) => lopCuaEm(env, s)))
    expect(cau.filter((q) => /FROM (hoc_sinh|danh_sach)\b/.test(q) && !/WHERE sbd = \?/.test(q))).toEqual([])
    xoaMoiDem()
    const cacLop = [...new Set(motEm.filter((x): x is string => !!x))]
    const caTruong = new Map<string, string>()
    for (const l of cacLop) for (const e of await emCuaLopBai(env, l)) caTruong.set(e.sbd, l)
    expect(motEm).toEqual(ds.map((s) => caTruong.get(s) ?? null))
    expect(motEm[2]).toBeNull() // em khoá
    expect(motEm[5]).toBeNull()
    expect(motEm[4]).toBeTruthy() // chỉ có trong danh sách lớp
  })

  it('đệm 30 s theo em: hỏi lại không đọc D1; nhiều chỗ hỏi cùng lúc dùng chung một lượt đọc', async () => {
    const { env, cau } = kho()
    await Promise.all([lopCuaEm(env, 'S1'), lopCuaEm(env, 'S1'), lopCuaEm(env, 'S1')])
    const n = cau.length
    expect(n).toBe(2) // hoc_sinh + danh_sach của S1, một lượt
    await lopCuaEm(env, 'S1')
    expect(cau.length).toBe(n)
  })
})
