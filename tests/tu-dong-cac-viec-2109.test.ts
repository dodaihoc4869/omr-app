// @vitest-environment node
// CỜ TẮT CHUNG của các việc máy tự làm B7–B11: `cau_hinh.tu_dong_cac_viec` {vinhDanh, mungMoc, keoLai, suKhoe}; mặc định BẬT trừ keoLai (chạy khô); lệnh thầy `/gv/tu-dong-cac-viec` đọc/ghi; cờ suKhoe tắt canhBao ở bảng tin.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { CO_TU_DONG_MAC_DINH, docCoTuDong } from '../server/src/tu-dong-cac-viec'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { gio } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())
const goi = (d: D1That, b: Record<string, unknown> = {}, thay = true) => goiWorker(worker, d.env, '/gv/tu-dong-cac-viec', b, thay)
const luuTru = (d: D1That) => d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa = 'tu_dong_cac_viec'").get() as { gia_tri: string } | undefined

describe('docCoTuDong', () => {
  it('vắng / hỏng ⇒ mặc định (vinhDanh, mungMoc, suKhoe BẬT; keoLai TẮT)', () => {
    expect(CO_TU_DONG_MAC_DINH).toEqual({ vinhDanh: true, mungMoc: true, keoLai: false, suKhoe: true })
    for (const v of [undefined, null, '', 'rác', '[]', 5, '5']) expect(docCoTuDong(v), String(v)).toEqual(CO_TU_DONG_MAC_DINH)
    expect(docCoTuDong('{}')).toEqual(CO_TU_DONG_MAC_DINH)
  })
  it('chỉ `false` tắt cờ mặc định BẬT; chỉ `true` bật keoLai (0, "true", null, chuỗi không đổi gì)', () => {
    expect(docCoTuDong({ vinhDanh: false, mungMoc: 0, suKhoe: 'false' })).toEqual({ vinhDanh: false, mungMoc: true, keoLai: false, suKhoe: true })
    expect(docCoTuDong('{"keoLai":true,"suKhoe":false}')).toEqual({ vinhDanh: true, mungMoc: true, keoLai: true, suKhoe: false })
    expect(docCoTuDong({ keoLai: 'true' }).keoLai).toBe(false)
    expect(docCoTuDong({ keoLai: 1 }).keoLai).toBe(false)
  })
})

describe('/gv/tu-dong-cac-viec', () => {
  it('cần mã bí mật; đọc mặc định KHÔNG ghi gì', async () => {
    const d = taoD1That()
    expect((await goi(d, {}, false)).ok).toBe(false)
    expect(await goi(d)).toMatchObject({ ok: true, co: CO_TU_DONG_MAC_DINH })
    expect(luuTru(d)).toBeUndefined()
  })
  it('ghi gộp từng cờ (cờ không gửi giữ nguyên), lưu JSON đủ 4 cờ; giá trị không phải boolean bị từ chối và KHÔNG ghi', async () => {
    const d = taoD1That()
    expect(await goi(d, { keoLai: true })).toMatchObject({ ok: true, co: { vinhDanh: true, mungMoc: true, keoLai: true, suKhoe: true } })
    expect(await goi(d, { vinhDanh: false })).toMatchObject({ co: { vinhDanh: false, keoLai: true } })
    expect(JSON.parse(luuTru(d)!.gia_tri)).toEqual({ vinhDanh: false, mungMoc: true, keoLai: true, suKhoe: true })
    const truoc = luuTru(d)
    expect(await goi(d, { suKhoe: 'false' })).toMatchObject({ ok: false, error: 'Mỗi cờ chỉ nhận true hoặc false.' })
    expect(await goi(d, { mungMoc: 0 })).toMatchObject({ ok: false })
    expect(luuTru(d)).toEqual(truoc)
    expect(await goi(d, { khoaLa: true })).toMatchObject({ ok: true, co: { vinhDanh: false } }) // khoá lạ bị bỏ qua, không ghi
  })
})

describe('cờ suKhoe ở bảng tin', () => {
  it('tắt cờ suKhoe ⇒ canhBao rỗng và muc xanh (dù có lỗi máy); bật lại ⇒ cảnh báo hiện', async () => {
    gio(new Date('2026-09-21T13:10:00+07:00'))
    const d = taoD1That()
    d.sql.prepare("INSERT INTO nhat_ky_may(luc,nguon,muc,chu) VALUES(?,'nhac_nop_bai','loi','x')").run(new Date('2026-09-21T13:00:00+07:00').toISOString())
    const bt = () => goiWorker(worker, d.env, '/gv/bang-tin', {}, true).then((r) => r.sucKhoe as { muc: string; canhBao: unknown[] })
    expect((await bt()).canhBao.length).toBeGreaterThan(0)
    await goi(d, { suKhoe: false })
    expect(await bt()).toMatchObject({ muc: 'xanh', canhBao: [] })
    await goi(d, { suKhoe: true })
    expect((await bt()).canhBao.length).toBeGreaterThan(0)
  })
})
