// @vitest-environment node
// XEM ĐIỂM BẢN 2 · GV-1 — HỢP ĐỒNG HAI PHÍA: THÂN THẬT của `gvBaoCaoCa` (server/src/bao-cao-ca.ts, D1 giả bằng SQLite thật) đi qua bộ đọc của màn (`docBaoCaoCaLopMayChu`) —
// máy chủ đổi tên khoá / kiểu số thì test này đỏ trước khi khối "Báo cáo cả lớp" trắng. Đọc được ⇒ số khớp bảng điểm; dạng vấp / câu sai nhiều / điểm giảm có mặt.
import { describe, expect, it } from 'vitest'
import { gvBaoCaoCa } from '../server/src/bao-cao-ca'
import { taoD1That, type D1That } from './_d1-that'
import { docBaoCaoCaLopMayChu } from '../src/lib/bao-cao-may-chu'
import { KHOANG_DIEM } from '../src/lib/bao-cao-ca-lop'

const NOW = Date.parse('2026-09-22T05:00:00.000Z')
const VAO = '2026-09-20T02:00:00.000Z'
const NOP = '2026-09-20T02:30:00.000Z'
const NOP_CU = '2026-09-10T02:30:00.000Z'

function truong(): D1That {
  const d = taoD1That()
  for (const [ma, tt] of [['C0', 'dong'], ['C1', 'dong']] as const)
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,cong_bo,thoi_gian_phut,cap_nhat_luc) VALUES(?,?,?,'thi','12','ngay',45,'x')").run(ma, `Ca ${ma}`, tt)
  for (const [s, t] of [['A', 'An'], ['B', 'Bình'], ['C', 'Chi'], ['D', 'Dũng'], ['E', 'Em']]) d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,trang_thai,mat_khau,cap_nhat_luc) VALUES(?,?,'12',NULL,'mk','x')").run(s, t)
  const luot = d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,diem_i,diem_ii,diem_iii,tong,cap_nhat_luc) VALUES(?,?,?,1,?,?,'da_nop',?,?,?,?,'x')")
  const ins = d.sql.prepare('INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,chuyen_de,muc_do,dap_an_chon,dap_an_dung,dung_sai,giay,cap_nhat_luc) VALUES(?,?,?,1,?,?,?,?,?,?,?,?,?,?)')
  const q = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  const tong: Record<string, number> = { A: 9.5, B: 8, C: 2.5, D: 4, E: 6.5 }
  const sai: Record<string, number> = { A: 0, B: 1, C: 5, D: 4, E: 2 } // số câu đầu sai (Q1..Qn)
  for (const s of ['A', 'B', 'C', 'D', 'E']) {
    luot.run(`C1|${s}|1`, 'C1', s, VAO, NOP, 2, 2, 1, tong[s])
    for (let i = 1; i <= 6; i++) {
      const lam = i <= sai[s]! ? 0 : 1
      ins.run(`C1|${s}|1|I|${i}`, 'C1', s, 'I', i, `Q${i}`, '', '', lam ? 'B' : 'A', 'B', lam, 30, 'x')
    }
  }
  luot.run('C0|C|1', 'C0', 'C', VAO, NOP_CU, 3, 2, 1, 6) // lần trước của Chi: 6 điểm ⇒ giảm 3,5
  for (let i = 1; i <= 6; i++) q.run('DE', `Q${i}`, 'v', `g${i}`, i <= 3 ? 'D.ESTE' : 'D.AMIN', JSON.stringify({ qid: `Q${i}`, phan: 'I', text: `Câu ${i}`, choices: ['a', 'b', 'c', 'd'], correct: 'B', dang: i <= 3 ? 'D.ESTE' : 'D.AMIN', tenDang: i <= 3 ? 'Thuỷ phân ester' : 'Tính chất amin', solution: 'LG' }))
  return d
}

describe('thân thật của /gv/bao-cao-ca ⇒ docBaoCaoCaLopMayChu', () => {
  it('đọc được; số khớp bảng điểm; dạng vấp, câu sai nhiều, điểm giảm có mặt và đúng hình màn cần', async () => {
    const d = truong()
    const than = (await gvBaoCaoCa(d.env, { maCa: 'C1' }, NOW)) as Record<string, unknown>
    expect(than.ok).toBe(true)
    const b = docBaoCaoCaLopMayChu(than, [{ sbd: 'C', hoTen: 'Chi', lop: '12A1', soLanRoiMan: 4, tongGiayRoiMan: 84 }])
    expect(b, 'bộ đọc từ chối thân thật của máy chủ').not.toBeNull()
    expect([b!.nop, b!.daVao, b!.chuaNop]).toEqual([5, 5, 0])
    expect(b!.tb).toBe(6.1) // (9,5 + 8 + 2,5 + 4 + 6,5) / 5
    expect([b!.cao, b!.thap]).toEqual([9.5, 2.5])
    expect(b!.pho.map((x) => x.nhan)).toEqual(KHOANG_DIEM.map((k) => k[2]))
    expect(b!.pho.reduce((t, x) => t + x.soEm, 0)).toBe(5) // mọi em rơi vào đúng một khoảng
    expect(b!.pho.find((x) => x.nhan === '2–4')!.soEm).toBe(1) // Chi 2,5
    expect(b!.pho.find((x) => x.nhan === '4–5')!.soEm).toBe(1) // Dũng 4
    expect(b!.pho.find((x) => x.nhan === '9–10')!.soEm).toBe(1) // An 9,5
    expect(b!.phutTB).toBe(30)
    expect(b!.baPhan).toHaveLength(1)
    expect(b!.baPhan[0]).toMatchObject({ ma: 'I', tong: 6, toiDa: 10 })
    expect(b!.coBangCham).toBe(true)
    // dạng cả lớp vấp: tỉ lệ đúng đổi sang %, thấp trước
    expect(b!.dang.length).toBeGreaterThan(0)
    for (const x of b!.dang) { expect(Number.isInteger(x.tiLeDung)).toBe(true); expect(x.tiLeDung).toBeGreaterThanOrEqual(0); expect(x.tiLeDung).toBeLessThanOrEqual(100); expect(x.ten).not.toMatch(/^D\./) }
    expect(b!.dang.map((x) => x.tiLeDung)).toEqual([...b!.dang.map((x) => x.tiLeDung)].sort((a, c) => a - c))
    // câu sai nhiều: có đáp án sai nhiều nhất là 'A' (mọi em sai đều chọn A)
    expect(b!.cauSai.length).toBeGreaterThan(0)
    expect(b!.cauSai[0]!.dapAnDung).toBe('B')
    expect(b!.cauSai[0]!.dapAnSaiNhieu?.dapAn).toBe('A')
    // em cần để ý: Chi điểm 2,5 (dưới 5) + giảm 3,5 so với lần trước + rời màn 4 lần; Dũng điểm 4
    const chi = b!.emCanYY.find((e) => e.sbd === 'C')!
    expect(chi.lyDo).toEqual(['Đúng 1/6 câu (17%) — điểm 2,5', 'Điểm giảm 3,5 so với lần trước (6 → 2,5)', 'Rời màn làm bài 4 lần, tổng 1 phút 24 giây'])
    expect(chi.lop).toBe('12A1')
    expect(b!.emCanYY.find((e) => e.sbd === 'D')!.lyDo[0]).toMatch(/^Đúng 2\/6 câu \(33%\) — điểm 4$/)
    expect(b!.emCanYY.some((e) => e.sbd === 'A')).toBe(false)
  })
  it('lỗi mã ca / ca không có ⇒ thân ok:false — bộ đọc không dựng gì từ nó', async () => {
    const d = truong()
    for (const than of [await gvBaoCaoCa(d.env, {}, NOW), await gvBaoCaoCa(d.env, { maCa: 'KHONG-CO' }, NOW)]) {
      expect((than as { ok?: boolean }).ok).toBe(false)
      expect(docBaoCaoCaLopMayChu(than as Record<string, unknown>)).toBeNull()
    }
  })
})
