// @vitest-environment node
// 24/10 (em SBD 10044 «Vẫn lỗi»: Tự sửa lỗi · Việc hôm nay, câu «Cấu trúc bảng tuần hoàn…» mở ra khung «Chưa mở được câu này — Câu này chưa có lỗi
// đang mở đã công bố»). Nguyên nhân gốc: danh sách (`danhSach`) xếp câu vào «cần sửa» theo hàng đợt chữa còn mở, còn lệnh mở đợt dựng lại lỗi từ sổ học
// sống; sổ đã đóng lỗi (em tự làm lại đúng đủ ngày + song sinh) mà hàng đợt chưa kịp đóng ⇒ danh sách mời, mở thì 404 ⇒ chặng kẹt mãi.
// Khoá: lệch ấy ⇒ máy chủ ĐÓNG hàng đợt (da_tu_sua) và báo kèm mã đợt để máy em tính xong phần; sổ không thấy lần sai nào ⇒ KHÔNG đóng.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { seedChua, Q } from './_chua-cau-sai-fixture'
import { moDot, danhSach } from '../server/src/chua-cau-sai'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'

const T = Date.parse('2026-10-07T03:00:00Z')
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(T)
  xoaDemCaBaoVe()
})
afterEach(() => {
  vi.useRealTimers()
  xoaDemCaBaoVe()
})
const dung = (khoa: string, qid: string, ngay: string) =>
  `INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,visibility,purpose) VALUES('${khoa}','HS1','${qid}','game','G1',1,1,'${ngay}T03:00:00Z','${ngay}','none','released','repair')`
async function dot(d: ReturnType<typeof taoD1That>) {
  return await d.env.DB.prepare("SELECT id,trang_thai_day,dong_luc FROM chua_loi_dot WHERE sbd='HS1'").first<{ id: string; trang_thai_day: string; dong_luc: number | null }>()
}
describe('Danh sách mời mà mở đợt báo «chưa có lỗi»', () => {
  it('sổ học đã đóng lỗi, hàng đợt còn mở ⇒ đóng hàng đợt, trả mã đợt, danh sách chuyển sang «xong»', async () => {
    const d = taoD1That()
    const token = await seedChua(d.env)
    const truoc = await dot(d)
    expect(truoc?.dong_luc).toBeNull()
    await d.env.DB.batch([
      d.env.DB.prepare(dung('d1', Q, '2026-10-02')),
      d.env.DB.prepare(dung('d2', `${Q}~ss0`, '2026-10-03')),
    ])
    const r = await moDot(d.env, { token, qid: Q })
    const j = (await r.json()) as Record<string, unknown>
    expect(j.ma).toBe('CHUA_CO_LOI')
    expect(j.dotId).toBe(truoc!.id)
    const sau = await dot(d)
    expect(sau?.trang_thai_day).toBe('da_tu_sua')
    expect(sau?.dong_luc).not.toBeNull()
    const ds = (await (await danhSach(d.env, { token })).json()) as { dem: { can: number; xong: number } }
    expect(ds.dem.can).toBe(0)
    expect(ds.dem.xong).toBe(1)
  })
  it('sổ học không thấy lần sai nào (vd lần sai chưa công bố) ⇒ giữ nguyên hàng đợt, vẫn báo mã đợt', async () => {
    const d = taoD1That()
    const token = await seedChua(d.env)
    await d.env.DB.prepare("UPDATE su_kien_hoc SET visibility='embargoed' WHERE sbd='HS1'").run()
    const truoc = await dot(d)
    const j = (await (await moDot(d.env, { token, qid: Q })).json()) as Record<string, unknown>
    expect(j.ma).toBe('CHUA_CO_LOI')
    expect(j.dotId).toBe(truoc!.id)
    expect((await dot(d))?.dong_luc).toBeNull()
  })
})
