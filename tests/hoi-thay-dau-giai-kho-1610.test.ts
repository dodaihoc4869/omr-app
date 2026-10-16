// @vitest-environment node
// Theo đường mở lời giải thật: nhận đáp án/lời giải kho là có hỗ trợ, mở hộp hỏi trống thì chưa.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { Q, seedChua } from './_chua-cau-sai-fixture'
import { hsHoiThay } from '../server/src/loi-giai'
import { hsMoKiemHoiThay, hsNopKiemHoiThay } from '../server/src/hoi-thay-kiem-chung'
import { SQL_DAU_HO_TRO_CHUA } from '../server/src/chua-cau-sai-adapter'

let d: D1That, token: string
const NOW = Date.parse('2026-10-16T03:00:00Z')
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW)
  d = taoD1That(); token = await seedChua(d.env)
})
afterEach(() => { d.sql.close(); vi.restoreAllMocks(); vi.useRealTimers() })
function kho(khac: Record<string, unknown> = {}) {
  d.objects.set('kho/DH-12-C1-B1.json', { cau: [{ qid: Q, phan: 'III', so: 1, de: 'Tính M(LiOH), Li=7, O=16, H=1.', dap_an: '24', loi_giai: { chot: 'Cộng các nguyên tử khối: 7+16+1=24 g/mol.' }, ...khac }] })
}
const hoi = (chiHoi = false, nguon = 'hoc_tap') => hsHoiThay(d.env, { token, qid: Q, chiHoi, nguon })
async function tuThu() {
  const a = await hsMoKiemHoiThay(d.env, { token, qid: Q }) as any
  expect(a).toMatchObject({ ok: true, trangThai: 'co_cau' })
  const s = JSON.parse((d.sql.prepare('SELECT snapshot_json FROM hoi_thay_kiem WHERE id=?').get(a.phienId) as any).snapshot_json)
  return hsNopKiemHoiThay(d.env, { token, phienId: a.phienId, attemptId: 'kiem-sau-giai-kho', traLoi: s.q.correct })
}
const markers = () => d.sql.prepare(`SELECT nguon,co_ho_so FROM loi_giai_hoi WHERE sbd='HS1' AND ${SQL_DAU_HO_TRO_CHUA}`).all()

describe('Hỏi thầy · dấu lời giải kho đúng nội dung đã trả', () => {
  it('nhận lời giải kho được ghi hỗ trợ dù chưa có hồ sơ và không tự nâng co_ho_so', async () => {
    kho()
    expect(await hoi()).toMatchObject({ ok: true, coLoiGiai: false, loiGiaiChu: { dapAn: '24', chot: expect.stringContaining('24 g/mol') } })
    expect(markers()).toEqual([{ nguon: 'hoc_tap:giai_kho', co_ho_so: 0 }])
    expect(await tuThu()).toMatchObject({ ok: true, dung: true, trangThai: 'cho_kiem_lai' })
    expect(d.sql.prepare("SELECT assistance FROM su_kien_hoc WHERE nguon='chua_loi'").get()).toMatchObject({ assistance: 'assisted' })
  })
  it('chỉ đáp án kho vẫn là hỗ trợ vì khung hiển thị đáp án ấy', async () => {
    kho({ loi_giai: null })
    expect(await hoi()).toMatchObject({ ok: true, loiGiaiChu: { dapAn: '24', chot: '', buoc: [] } })
    expect(markers()).toEqual([{ nguon: 'hoc_tap:giai_kho', co_ho_so: 0 }])
    expect(await tuThu()).toMatchObject({ ok: true, dung: true, trangThai: 'cho_kiem_lai' })
  })
  it('chiHoi trước nộp chỉ có đề, không lời giải/đáp án và không một marker', async () => {
    kho()
    const r = await hoi(true)
    expect(r).toMatchObject({ ok: true, chiHoi: true })
    expect(r).not.toHaveProperty('loiGiaiChu')
    expect(r).not.toHaveProperty('hoSo')
    expect(d.dem('loi_giai_hoi')).toBe(0)
    expect(await tuThu()).toMatchObject({ ok: true, dung: true, trangThai: 'da_tu_lam' })
  })
  it('khung thật sự không có đáp án/hướng dẫn không tạo marker hỗ trợ', async () => {
    kho({ dap_an: '', loi_giai: null })
    expect(await hoi()).toMatchObject({ ok: true, loiGiaiChu: { dapAn: '', chot: '', ketQua: '', buoc: [], tung: [] } })
    expect(markers()).toEqual([])
    expect(d.sql.prepare('SELECT nguon,co_ho_so FROM loi_giai_hoi').get()).toMatchObject({ nguon: 'hoc_tap', co_ho_so: 0 })
  })
  it('nguồn dài giữ trọn hậu tố hỗ trợ, tối đa40 ký tự', async () => {
    kho()
    await hoi(false, 'nguon-hop-lai-rat-dai-'.repeat(4))
    const r = markers()[0] as { nguon: string; co_ho_so: number }
    expect(r.nguon.endsWith(':giai_kho')).toBe(true); expect(r.nguon.length).toBeLessThanOrEqual(40)
    expect(r.co_ho_so).toBe(0)
  })
})
