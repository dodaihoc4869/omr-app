// @vitest-environment node
// CHỮA CÂU GỌN (thầy 25/10, server/src/chua-gon-lenh.ts): mở câu không lộ đáp án; máy chủ chấm; đúng lần 1 qua luật tự làm ⇒ Đã tự sửa NGAY;
// sai ⇒ gợi ý ⇒ lần 2; trần 2 lần / ngày; bấm lặp trả kết quả cũ; không nộp được bản lạ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { goiWorker, taoD1That } from './_d1-that'
import worker from '../server/src/index'
import { seedChua, Q } from './_chua-cau-sai-fixture'
import { danhSach, moDot } from '../server/src/chua-cau-sai'
import { gonMo, gonNop } from '../server/src/chua-gon-lenh'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'

const T = Date.parse('2026-10-07T03:00:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T); xoaDemCaBaoVe() })
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

type D = Awaited<ReturnType<typeof dung>>
async function dung() {
  const d = taoD1That()
  const token = await seedChua(d.env)
  const dotId = (await (await moDot(d.env, { token, qid: Q })).json()).dotId as string
  return { ...d, token, dotId }
}
const mo = async (d: D) => (await gonMo(d.env, { token: d.token, dotId: d.dotId })).json() as Promise<Record<string, any>>
let n = 0
const nop = async (d: D, traLoi: string, ban = Q, khoa = `k${++n}`) => {
  const r = await gonNop(d.env, { token: d.token, dotId: d.dotId, ban, traLoi, khoa })
  return { status: r.status, j: (await r.json()) as Record<string, any> }
}
const tt = (d: D) => (d.sql.prepare('SELECT trang_thai_day FROM chua_loi_dot WHERE id=?').get(d.dotId) as { trang_thai_day: string }).trang_thai_day

describe('Chữa câu gọn — mở câu và nộp', () => {
  it('27/10 tốc độ: mo-dot `gon:true` ⇒ mở đợt + bản làm lại CÙNG một lượt (trường `gon` = đúng thân gon-mo); không cờ ⇒ không kèm', async () => {
    const d = taoD1That()
    const token = await seedChua(d.env)
    const j = await goiWorker(worker, d.env, '/hs/chua-cau-sai/mo-dot', { token, qid: Q, gon: true }) as Record<string, any>
    expect(j.ok).toBe(true)
    expect(j.gon).toMatchObject({ ok: true, ban: Q, lan: 1, status: 200 })
    expect(JSON.stringify(j.gon)).not.toMatch(/"correct"|"solution"|dapAn|loiGiai|bí mật lời giải/)
    const rieng = await (await gonMo(d.env, { token, dotId: j.dotId })).json() as Record<string, any>
    const { status: _s, ...gon } = j.gon
    expect(gon).toEqual(rieng)
    const khong = await goiWorker(worker, d.env, '/hs/chua-cau-sai/mo-dot', { token, qid: Q }) as Record<string, any>
    expect(khong.ok).toBe(true)
    expect(khong.gon).toBeUndefined()
  })
  it('mở câu: đề công khai, KHÔNG đáp án / lời giải; đúng bây giờ sẽ tính Đã tự sửa (sai từ ngày trước)', async () => {
    const d = await dung()
    const j = await mo(d)
    expect(j.ok).toBe(true)
    expect(j.ban).toBe(Q)
    expect(j.lan).toBe(1)
    expect(j.tuSuaNeuDung).toBe(true)
    expect(j.de.text).toContain('LiOH')
    const s = JSON.stringify(j)
    expect(s).not.toMatch(/"correct"|"solution"|dapAn|loiGiai|bí mật lời giải/)
  })
  it('đúng lần 1 ⇒ Đã tự sửa ngay: đóng đợt, ghi sổ (chua_loi / repair), mở lời giải, dấu đọc lời giải; danh sách đếm hôm nay', async () => {
    const d = await dung()
    const { j } = await nop(d, '24')
    expect(j).toMatchObject({ ok: true, dung: true, ket: 'tu_sua', trangThai: 'da_tu_sua' })
    expect(j.chiTiet.dapAn).toBe('24')
    expect(tt(d)).toBe('da_tu_sua')
    const sk = d.sql.prepare("SELECT nguon,purpose,ket_qua,assistance FROM su_kien_hoc WHERE nguon='chua_loi'").all()
    expect(sk).toEqual([{ nguon: 'chua_loi', purpose: 'repair', ket_qua: 1, assistance: 'none' }])
    expect(d.dem('loi_giai_hoi')).toBe(1)
    const ds = await (await danhSach(d.env, { token: d.token })).json()
    expect(ds.dem.xongHomNay).toBe(1)
    // Mở lại câu đã tự sửa ⇒ báo trạng thái, không phát câu.
    expect((await mo(d)).trangThai).toBe('da_tu_sua')
  })
  it('sai lần 1 ⇒ gợi ý (bước 1 bài luyện), KHÔNG đáp án; đúng lần 2 ⇒ chỉ "xong phần" (có gợi ý), đợt vẫn mở', async () => {
    const d = await dung()
    const a = await nop(d, '40')
    expect(a.j).toMatchObject({ ok: true, dung: false, ket: 'goi_y', goiY: 'Công thức có mấy nguyên tố?' })
    expect(JSON.stringify(a.j)).not.toMatch(/chiTiet|"24"|bí mật/)
    expect(d.dem('loi_giai_hoi')).toBe(0)
    expect((await mo(d)).lan).toBe(2)
    const b = await nop(d, '24')
    expect(b.j).toMatchObject({ dung: true, ket: 'xong_phan', lyDo: 'co_goi_y' })
    expect(b.j.chiTiet.dapAn).toBe('24')
    expect(tt(d)).not.toBe('da_tu_sua')
    expect(d.sql.prepare("SELECT lan,assistance FROM su_kien_hoc WHERE nguon='chua_loi' ORDER BY lan").all()).toEqual([{ lan: 1, assistance: 'none' }, { lan: 2, assistance: 'assisted' }])
  })
  it('sai hai lần ⇒ lời giải đầy đủ; lần thứ ba trong ngày không chấm thêm (trả kết quả đã khép), chỉ 2 dòng', async () => {
    const d = await dung()
    await nop(d, '40')
    const b = await nop(d, '41')
    expect(b.j).toMatchObject({ dung: false, ket: 'loi_giai' })
    expect(b.j.chiTiet.dapAn).toBe('24')
    const c = await nop(d, '24')
    expect(c.j).toMatchObject({ ket: 'loi_giai', daKhepHomNay: true })
    expect(d.dem('chua_gon_lan')).toBe(2)
    expect(tt(d)).not.toBe('da_tu_sua')
    expect((await mo(d)).daKhepHomNay).toBe(true)
  })
  it('bấm lặp cùng khoá ⇒ đúng kết quả cũ, một dòng', async () => {
    const d = await dung()
    const a = await nop(d, '40', Q, 'cung')
    const b = await nop(d, '24', Q, 'cung')
    expect(b.j.ket).toBe(a.j.ket)
    expect(d.dem('chua_gon_lan')).toBe(1)
  })
  it('bản lạ (không dựng được từ câu gốc của đợt) ⇒ từ chối, không ghi', async () => {
    const d = await dung()
    const r = await nop(d, '24', 'CAU-KHAC')
    expect(r.status).toBe(409)
    expect(r.j.ma).toBe('SAI_BAN')
    expect(d.dem('chua_gon_lan')).toBe(0)
    expect(tt(d)).not.toBe('da_tu_sua')
  })
  it('vừa sai câu gốc HÔM NAY ⇒ đúng chỉ "xong phần" (cùng ngày); đọc lời giải 12 giờ trước ⇒ cũng chỉ "xong phần"', async () => {
    const d = await dung()
    d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,visibility,purpose) VALUES('sai-nay','HS1',?,'game','G9',1,0,'2026-10-07T01:00:00.000Z','2026-10-07','none','released','repair')").run(Q)
    expect((await mo(d)).tuSuaNeuDung).toBe(false)
    expect((await nop(d, '24')).j).toMatchObject({ ket: 'xong_phan', lyDo: 'cung_ngay' })
    const e = await dung()
    e.sql.prepare("INSERT INTO loi_giai_hoi(sbd,qid,luc,co_ho_so,nguon) VALUES('HS1',?,'2026-10-07T00:00:00.000Z',0,'x')").run(Q)
    expect((await nop(e, '24')).j).toMatchObject({ ket: 'xong_phan', lyDo: 'doc_loi_giai' })
  })
})
