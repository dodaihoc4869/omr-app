// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { chonEmGiaiMau, gvChienDich, type UngVienGiaiMau } from '../server/src/srs2-gv'
import { TO, dungKho, ghiSai } from './_kho-3-khoi-0510'

const u = (sbd: string, soLanDung: number, hang: UngVienGiaiMau['hang'], vuotMuc = false): UngVienGiaiMau => ({ sbd, soLanDung, hang, vuotMuc })

describe('chọn học sinh chữa mẫu sau điểm danh', () => {
  it('chỉ nhận em đã tự làm đúng và ưu tiên số lần đúng cao nhất', () => {
    expect(chonEmGiaiMau([u('chua-dung', 0, 'L4', true), u('dung-1', 1, 'L2'), u('dung-3', 3, 'L1')])?.sbd).toBe('dung-3')
    expect(chonEmGiaiMau([u('a', 0, 'L4', true), u('b', 0, 'L4', true)])).toBeNull()
  })

  it('bằng số lần đúng thì ưu tiên năng lực vượt mức câu, rồi hạng cao hơn', () => {
    expect(chonEmGiaiMau([u('khong-vuot', 2, 'L3'), u('vuot', 2, 'L3', true)])?.sbd).toBe('vuot')
    expect(chonEmGiaiMau([u('L2', 2, 'L2'), u('L4', 2, 'L4')])?.sbd).toBe('L4')
  })

  it('chỉ dùng số lượt đã được gọi làm tiêu chí cân bằng sau các ưu tiên chuyên môn', () => {
    const daGoi = new Map([['a', 2], ['b', 0]])
    expect(chonEmGiaiMau([u('a', 2, 'L3', true), u('b', 2, 'L3', true)], daGoi)?.sbd).toBe('b')
    expect(chonEmGiaiMau([u('a', 3, 'L2'), u('b', 2, 'L4', true)], daGoi)?.sbd).toBe('a')
  })

  it('D1 thật: chưa điểm danh không xếp; sau điểm danh chỉ xét em có mặt và bỏ lượt đúng có gợi ý', async () => {
    const d = await dungKho()
    const t0 = Date.parse('2026-10-07T10:00:00+07:00')
    const tao = await gvChienDich(d.env, { action: 'tao', ten: 'Chọn chữa mẫu', lop: '11', maDe: [TO[11]], hanNop: '2026-10-20', theLucNgay: 40, raiDeu: false }, t0 - 2 * 86_400_000)
    expect(tao.ok).toBe(true)
    const id = String(tao.id)
    const qid = `${TO[11]}-I-1`
    const chen = d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance) VALUES(?,?,?,'game',?,1,1,?,?,?)")
    for (let i = 0; i < 3; i++) chen.run(`S1-${i}`, 'S1', qid, `M1-${i}`, new Date(t0 - 80_000 + i * 1000).toISOString(), '2026-10-07', 'none')
    chen.run('S2-tu-lam', 'S2', qid, 'M2-0', new Date(t0 - 70_000).toISOString(), '2026-10-07', 'none')
    for (let i = 0; i < 5; i++) chen.run(`S2-goi-y-${i}`, 'S2', qid, `M2-${i + 1}`, new Date(t0 - 60_000 + i * 1000).toISOString(), '2026-10-07', 'assisted')
    await ghiSai(d, 'S4', [qid], t0 - 50_000, { soLan: 5, nguon: ['game'] })

    const dong = (r: Record<string, any>) => (r.cau as Record<string, any>[]).find((c) => c.qid === qid)!
    const chuaDiemDanh = await gvChienDich(d.env, { action: 'buoi-chua', id }, t0) as Record<string, any>
    expect(dong(chuaDiemDanh).giaiMau).toBeNull()

    const du = await gvChienDich(d.env, { action: 'buoi-chua', id, coMat: ['S1', 'S2', 'S4'] }, t0) as Record<string, any>
    expect(dong(du).giaiMau).toMatchObject({ sbd: 'S1', soLanDung: 3 })

    const vangS1 = await gvChienDich(d.env, { action: 'buoi-chua', id, coMat: ['S2', 'S4'] }, t0) as Record<string, any>
    expect(dong(vangS1).giaiMau).toMatchObject({ sbd: 'S2', soLanDung: 1 })

    const khongAiDung = await gvChienDich(d.env, { action: 'buoi-chua', id, coMat: ['S4'] }, t0) as Record<string, any>
    expect(dong(khongAiDung).giaiMau).toBeNull()
  })
})
