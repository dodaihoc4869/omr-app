// @vitest-environment node
import { describe, expect, it } from 'vitest'
import worker from '../scripts/chua-giao-worker'
import { raCuaSo } from '../scripts/chua-giao-cua-so'
import { taoD1That } from './_d1-that'
import { seedChua } from './_chua-cau-sai-fixture'
import type { EnvGiao } from '../scripts/chua-giao-van-hanh'
const KEY = 'a'.repeat(64)
function request(offset: unknown = 0, key = KEY) {
  return new Request('https://test/giao', { method: 'POST', headers: { authorization: `Bearer ${key}` }, body: JSON.stringify({ offset }) })
}
async function dung() {
  const d = taoD1That()
  await seedChua(d.env)
  d.sql.prepare("UPDATE cau_hinh SET gia_tri=? WHERE khoa='chua_cau_sai_v1'").run(JSON.stringify({ bat: true, phamVi: 'tat_ca' }))
  return { ...d, env: { ...d.env, CHUA_KEY: KEY, CHUA_HAN: String(Date.now() + 60000) } as EnvGiao }
}
describe('Cửa giao tạm cạnh D1', () => {
  it('thiếu/sai key hoặc hết hạn bị chặn trước khi chạm DB', async () => {
    const e = { CHUA_KEY: KEY, CHUA_HAN: String(Date.now() + 60000) } as EnvGiao
    expect((await worker.fetch(request(0, ''), e)).status).toBe(401)
    expect((await worker.fetch(request(0, 'b'.repeat(64)), e)).status).toBe(401)
    expect((await worker.fetch(request(), { ...e, CHUA_HAN: '0' })).status).toBe(401)
    expect((await worker.fetch(request(), { ...e, CHUA_KEY: '' })).status).toBe(401)
  })
  it('chặn mã em/SQL/offset ngoài hợp đồng, không có route tuỳ ý', async () => {
    const e = { CHUA_KEY: KEY, CHUA_HAN: String(Date.now() + 60000) } as EnvGiao
    for (const x of [-1, 0.5, '0', 100001, null, 'DROP TABLE hoc_sinh'])
      expect((await worker.fetch(request(x), e)).status).toBe(400)
    expect((await worker.fetch(new Request('https://test/sql', { headers: { authorization: `Bearer ${KEY}` } }), e)).status).toBe(404)
  })
  it('chạy lại giữ ngày giao và không trả danh tính/đáp án hoặc ghi kết quả học', async () => {
    const d = await dung()
    const before = d.sql.prepare('SELECT giao_luc,chot_do_luc FROM chua_loi_dot WHERE sbd=?').get('HS1')
    const events = d.dem('su_kien_hoc')
    const first = await worker.fetch(request(), d.env)
    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({ ok: true, soCap: 1, tiepOffset: 1, con: false })
    const second = await worker.fetch(request(), d.env)
    expect(second.headers.get('cache-control')).toBe('no-store')
    expect(JSON.stringify(await second.json())).not.toMatch(/sbd|qid|dotId|HS1|dapAn|traLoi/)
    expect(d.sql.prepare('SELECT giao_luc,chot_do_luc FROM chua_loi_dot WHERE sbd=?').get('HS1')).toEqual(before)
    expect(d.dem('su_kien_hoc')).toBe(events)
    expect(d.dem('chua_loi_dot')).toBe(1)
  })
  it('ca thi mở hoặc thầy tắt cờ phải dừng ngay cả khi có cache cũ', async () => {
    const d = await dung()
    expect((await worker.fetch(request(), d.env)).status).toBe(200)
    d.sql.exec("UPDATE cau_hinh SET gia_tri='{}' WHERE khoa='chua_cau_sai_v1'")
    expect((await worker.fetch(request(), d.env)).status).toBe(409)
    d.sql.prepare("UPDATE cau_hinh SET gia_tri=? WHERE khoa='chua_cau_sai_v1'").run(JSON.stringify({ bat: true, phamVi: 'tat_ca' }))
    d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,lop,trang_thai,cap_nhat_luc) VALUES('RPC-CA','Thử','12','mo','x')")
    expect((await worker.fetch(request(), d.env)).status).toBe(409)
  })
  it('lỗi native không bị ghi hoàn tất và không lộ lỗi SQL', async () => {
    const d = await dung()
    d.sql.exec('DROP TABLE su_kien_hoc')
    const r = await worker.fetch(request(), d.env)
    expect(r.status).toBe(503)
    expect(await r.json()).toEqual({ ok: false })
  })
})
describe('Checkpoint cửa sổ giao', () => {
  it('kết quả về lệch thứ tự vẫn chỉ chốt sau khi đủ sáu lô', async () => {
    let completed = 0
    const r = await raCuaSo(100, async offset => {
      await new Promise(r => setTimeout(r, 112 - offset))
      completed++
      return { ok: true, soCap: 2, tiepOffset: offset + 2, con: true }
    })
    expect(completed).toBe(6)
    expect(r).toEqual({ tiepOffset: 112, con: true, soCap: 12 })
  })
  it('lô cuối một cặp rồi lô rỗng giữ đúng vị trí cuối', async () => {
    const r = await raCuaSo(100, async offset => ({ ok: true, soCap: offset < 104 ? 2 : offset === 104 ? 1 : 0, tiepOffset: offset + (offset < 104 ? 2 : offset === 104 ? 1 : 0), con: offset < 104 }))
    expect(r).toEqual({ tiepOffset: 105, con: false, soCap: 5 })
  })
  it('lỗi giữa cửa sổ đợi các lô còn lại xong rồi giữ checkpoint cũ', async () => {
    let completed = 0
    await expect(raCuaSo(100, async offset => {
      await new Promise(r => setTimeout(r, 5))
      completed++
      if (offset === 102) throw new Error('mạng lỗi')
      return { ok: true, soCap: 2, tiepOffset: offset + 2, con: true }
    })).rejects.toThrow('giữ checkpoint')
    expect(completed).toBe(6)
  })
  it('không chốt khi offset/con sai hoặc còn dữ liệu sau trang cuối', async () => {
    await expect(raCuaSo(0, async offset => ({ ok: true, soCap: 2, tiepOffset: offset, con: true }))).rejects.toThrow('giữ checkpoint')
    await expect(raCuaSo(0, async offset => ({ ok: true, soCap: 0, tiepOffset: offset, con: true }))).rejects.toThrow('giữ checkpoint')
    await expect(raCuaSo(0, async offset => ({ ok: true, soCap: offset === 0 ? 0 : 2, tiepOffset: offset + (offset === 0 ? 0 : 2), con: offset !== 0 }))).rejects.toThrow('giữ checkpoint')
  })
})
