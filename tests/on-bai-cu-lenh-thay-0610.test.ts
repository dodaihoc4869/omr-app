// @vitest-environment node
// LỆNH THẦY chỉnh tỉ lệ ôn bài cũ theo lớp (thầy 06/10) — `POST /gv/omni` action `on-bai-cu-doc` / `on-bai-cu-luu` (server/src/omni-gv.ts), ghi `cau_hinh.on_bai_cu_ti_le`:
// cần mã thầy · kiểm kiểu (SỐ trong [0; 0,6]) · chỉ ghi phần của LỚP ấy (giữ mac_dinh + lớp khác) · ghi xong xoá đệm cờ (isolate này thấy ngay). D1 thật node:sqlite.
import { describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import worker from '../server/src/index'
import { gvOmni } from '../server/src/omni-gv'
import { docTiLeHieuLucCuaLop, docTiLeRiengCuaLop, onBaiCuDeuBat } from '../server/src/omni-on-bai-cu-d1'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'

const T0 = Date.parse('2026-10-06T09:00:00+07:00')
const luu = (env: Env, b: Record<string, unknown>) => gvOmni(env, { action: 'on-bai-cu-luu', ...b }, T0)
const doc = (env: Env, b: Record<string, unknown> = {}) => gvOmni(env, { action: 'on-bai-cu-doc', ...b }, T0)
const gocLuu = (d: D1That): unknown => {
  const r = d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa = 'on_bai_cu_ti_le'").get() as { gia_tri: string } | undefined
  return r ? JSON.parse(r.gia_tri) : null
}
const dung = () => { const d = taoD1That(); return { d, env: d.env as unknown as Env } }

describe('on-bai-cu-doc', () => {
  it('chưa cấu hình ⇒ mặc định chung 20 % / 40 %, không lớp nào; kèm trần 0,6 và bước 0,05; hỏi một lớp ⇒ hiệu lực của lớp ấy', async () => {
    const { env } = dung()
    expect(await doc(env)).toEqual({ ok: true, macDinh: { thuong: 0.2, cuoi: 0.4 }, lop: {}, toiDa: 0.6, buoc: 0.05 })
    expect(await doc(env, { lop: '12A1' })).toMatchObject({ ok: true, hieuLuc: { thuong: 0.2, cuoi: 0.4 } })
  })
  it('đọc cấu hình có sẵn: lớp có dòng ⇒ số đầy đủ (thiếu trường lấy mac_dinh rồi hằng cũ); trường hỏng bị bỏ', async () => {
    const { d, env } = dung()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('on_bai_cu_ti_le',?,'x')").run(JSON.stringify({ mac_dinh: { cuoi: 0.5 }, lop: { '12A1': { thuong: 0.3 }, '11B': { thuong: 0.9, cuoi: 'x' } } }))
    const r = await doc(env, { lop: '12A1' })
    expect(r).toMatchObject({ macDinh: { thuong: 0.2, cuoi: 0.5 }, hieuLuc: { thuong: 0.3, cuoi: 0.5 } })
    expect((r as { lop: Record<string, unknown> }).lop).toEqual({ '12A1': { thuong: 0.3, cuoi: 0.5 } }) // 11B toàn trường hỏng ⇒ không có dòng
  })
})

describe('on-bai-cu-luu', () => {
  it('lưu một lớp: ghi đúng cau_hinh.on_bai_cu_ti_le; lưu lớp thứ hai GIỮ lớp thứ nhất và mac_dinh', async () => {
    const { d, env } = dung()
    expect(await luu(env, { lop: '12A1', thuong: 0.3, cuoi: 0.5 })).toEqual({ ok: true, lop: '12A1', tiLe: { thuong: 0.3, cuoi: 0.5 } })
    expect(gocLuu(d)).toEqual({ lop: { '12A1': { thuong: 0.3, cuoi: 0.5 } } })
    d.sql.prepare("UPDATE cau_hinh SET gia_tri = ? WHERE khoa = 'on_bai_cu_ti_le'").run(JSON.stringify({ mac_dinh: { thuong: 0.25, cuoi: 0.45 }, lop: { '12A1': { thuong: 0.3, cuoi: 0.5 } } }))
    expect(await luu(env, { lop: '  12A2  ', thuong: 0, cuoi: 0.6 })).toMatchObject({ ok: true, lop: '12A2', tiLe: { thuong: 0, cuoi: 0.6 } }) // 0 và 0,6 là biên hợp lệ; tên lớp cắt khoảng trắng
    expect(gocLuu(d)).toEqual({ mac_dinh: { thuong: 0.25, cuoi: 0.45 }, lop: { '12A1': { thuong: 0.3, cuoi: 0.5 }, '12A2': { thuong: 0, cuoi: 0.6 } } })
    // lưu lại lớp đầu ⇒ thay đúng phần của lớp ấy
    await luu(env, { lop: '12A1', thuong: 0.35, cuoi: 0.55 })
    expect((gocLuu(d) as { lop: Record<string, unknown> }).lop).toEqual({ '12A1': { thuong: 0.35, cuoi: 0.55 }, '12A2': { thuong: 0, cuoi: 0.6 } })
  })
  it('làm tròn 4 chữ số thập phân (chống nhiễu dấu phẩy động: 0,35000000000000003 ⇒ 0,35)', async () => {
    const { d, env } = dung()
    await luu(env, { lop: '12A1', thuong: 0.1 + 0.25, cuoi: 0.2 + 0.1 })
    expect(gocLuu(d)).toEqual({ lop: { '12A1': { thuong: 0.35, cuoi: 0.3 } } })
  })
  it.each([
    ['ngoài khoảng (0,61)', { lop: '12A1', thuong: 0.61, cuoi: 0.4 }],
    ['ngoài khoảng (1)', { lop: '12A1', thuong: 0.2, cuoi: 1 }],
    ['âm', { lop: '12A1', thuong: -0.05, cuoi: 0.4 }],
    ['sai kiểu (chuỗi)', { lop: '12A1', thuong: '0.2', cuoi: 0.4 }],
    ['sai kiểu (null)', { lop: '12A1', thuong: 0.2, cuoi: null }],
    ['thiếu trường', { lop: '12A1', thuong: 0.2 }],
    ['NaN', { lop: '12A1', thuong: Number.NaN, cuoi: 0.4 }],
    ['Infinity', { lop: '12A1', thuong: 0.2, cuoi: Number.POSITIVE_INFINITY }],
  ])('từ chối, KHÔNG ghi: %s', async (_ten, b) => {
    const { d, env } = dung()
    const r = await luu(env, b)
    expect(r.ok).toBe(false)
    expect(String(r.error)).toBe('Tỉ lệ ôn bài cũ phải là số từ 0 đến 60 %.')
    expect(gocLuu(d)).toBeNull()
  })
  it('từ chối thiếu lớp / tên lớp quá dài', async () => {
    const { d, env } = dung()
    expect(await luu(env, { thuong: 0.2, cuoi: 0.4 })).toEqual({ ok: false, error: 'Chưa chọn lớp.' })
    expect(await luu(env, { lop: '   ', thuong: 0.2, cuoi: 0.4 })).toEqual({ ok: false, error: 'Chưa chọn lớp.' })
    expect(await luu(env, { lop: 'x'.repeat(81), thuong: 0.2, cuoi: 0.4 })).toEqual({ ok: false, error: 'Tên lớp quá dài.' })
    expect(gocLuu(d)).toBeNull()
  })
  it('ghi xong XOÁ ĐỆM: đọc có đệm ngay trước đó (null) rồi lưu ⇒ đọc lại thấy số mới tức thì, không phải chờ 15 s', async () => {
    const { env } = dung()
    expect(await docTiLeRiengCuaLop(env, '12A1')).toBeNull() // nạp đệm: chưa cấu hình
    expect(await docTiLeHieuLucCuaLop(env, '12A1')).toEqual({ thuong: 0.2, cuoi: 0.4 })
    await luu(env, { lop: '12A1', thuong: 0.3, cuoi: 0.5 })
    expect(await docTiLeRiengCuaLop(env, '12A1')).toEqual({ thuong: 0.3, cuoi: 0.5 })
    expect(await docTiLeHieuLucCuaLop(env, '12A1')).toEqual({ thuong: 0.3, cuoi: 0.5 })
    expect(await docTiLeRiengCuaLop(env, '12A9')).toBeNull() // lớp khác không bị ảnh hưởng
  })
  it('hành động lạ ⇒ lỗi như mọi lệnh /gv/omni', async () => {
    const { env } = dung()
    expect(await gvOmni(env, { action: 'on-bai-cu-xoa' }, T0)).toEqual({ ok: false, error: 'Hành động không hợp lệ.' })
  })
})

describe('công tắc chia đều: đọc có đệm, xoá đệm theo khoá', () => {
  it('vắng ⇒ BẬT; {"bat":false} ⇒ TẮT sau khi đệm được xoá; trở lại BẬT khi dòng bị sửa', async () => {
    const { d, env } = dung()
    expect(await onBaiCuDeuBat(env)).toBe(true)
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('on_bai_cu_deu','{\"bat\":false}','x')").run()
    expect(await onBaiCuDeuBat(env)).toBe(true) // còn trong đệm 15 s của isolate này
    xoaDemCauHinh(env, 'on_bai_cu_deu')
    expect(await onBaiCuDeuBat(env)).toBe(false)
    d.sql.prepare("UPDATE cau_hinh SET gia_tri = '{\"bat\":true}' WHERE khoa = 'on_bai_cu_deu'").run()
    xoaDemCauHinh(env)
    expect(await onBaiCuDeuBat(env)).toBe(true)
  })
})

describe('qua worker: cần mã thầy (POST /gv/omni)', () => {
  const goi = async (env: Env, than: Record<string, unknown>, mat?: string) => {
    const r = await worker.fetch(new Request('https://omr.test/gv/omni', { method: 'POST', headers: { 'content-type': 'application/json', ...(mat ? { 'x-ma-bi-mat': mat } : {}) }, body: JSON.stringify(than) }), env, { waitUntil() {}, passThroughOnException() {} } as never)
    return { status: r.status, j: (await r.json()) as Record<string, unknown> }
  }
  it('không / sai mã ⇒ 403 và KHÔNG ghi; đúng mã ⇒ lưu + đọc lại được', async () => {
    const { d, env } = dung()
    const body = { action: 'on-bai-cu-luu', lop: '12A1', thuong: 0.3, cuoi: 0.5 }
    expect((await goi(env, body)).status).toBe(403)
    expect((await goi(env, body, 'sai-ma')).status).toBe(403)
    expect(gocLuu(d)).toBeNull()
    const ok = await goi(env, body, 'bi-mat-thu')
    expect(ok.status).toBe(200)
    expect(ok.j).toMatchObject({ ok: true, lop: '12A1', tiLe: { thuong: 0.3, cuoi: 0.5 } })
    expect(gocLuu(d)).toEqual({ lop: { '12A1': { thuong: 0.3, cuoi: 0.5 } } })
    expect((await goi(env, { action: 'on-bai-cu-doc', lop: '12A1' }, 'bi-mat-thu')).j).toMatchObject({ ok: true, hieuLuc: { thuong: 0.3, cuoi: 0.5 } })
  })
})
