// @vitest-environment node
// ĐO TREO MÁY CA THI — MÁY CHỦ (thầy 22/10, docs/dac-ta-muc-lam-6-muc-2210.md mục 3; migration-2210-do-giay-luot.sql).
// /nop lưu cụm `doGiay` đã làm sạch (lamSachDo từng câu, CHỈ câu có cụm treo — có g hợp lệ) vào luot.do_giay_json, chung câu UPDATE sẵn có.
// Không gửi / rác ⇒ NULL; điểm, đáp án, giây cũ y như trước.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'

function dung() {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,thoi_gian_phut,cap_nhat_luc) VALUES('C1','x','mo','thi',45,'x')").run()
  for (const s of ['S1', 'S2', 'S3']) d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,het_gio_luc,trang_thai,cap_nhat_luc) VALUES(?,'C1',?,1,'x',?,'dang_lam','x')").run(`C1|${s}|1`, s, new Date(Date.now() + 600_000).toISOString())
  return d
}
const dong = (d: ReturnType<typeof taoD1That>, sbd: string) =>
  d.sql.prepare('SELECT dap_an_json, giay_cau_json, do_giay_json, trang_thai FROM luot WHERE sbd = ?').get(sbd) as { dap_an_json: string; giay_cau_json: string | null; do_giay_json: string | null; trang_thai: string }

describe('/nop — lưu đo treo máy ca thi', () => {
  it('lưu câu có g + cụm treo hợp lệ; bỏ câu thiếu g / rác; kẹp khoảng (l ≤ v)', async () => {
    const d = dung()
    const r = await goiWorker(worker, d.env, '/nop', {
      maCa: 'C1', sbd: 'S1', lanThu: 1, dapAn: { q1: 'A' }, integrity: {}, giayCau: { q1: 40, q2: 3 },
      doGiay: { q1: { g: 40, v: 40, a: 9e9, l: 999, n: 2, w: 1 }, q2: { v: 3, a: 0, l: 3, n: 0, w: 0 }, q3: 'rác' },
    })
    expect(r).toMatchObject({ ok: true })
    const l = dong(d, 'S1')
    expect(l.trang_thai).toBe('da_nop')
    const luu = JSON.parse(l.do_giay_json!)
    expect(Object.keys(luu)).toEqual(['q1'])
    expect(luu.q1).toMatchObject({ giay: 40, dh: 1, treo: { v: 40, a: 7200, l: 40, n: 2, w: 1 } })
  })

  it('không gửi doGiay / gửi rác ⇒ do_giay_json NULL; đáp án + giây cũ y như bản không đo', async () => {
    const d = dung()
    const than = { maCa: 'C1', lanThu: 1, dapAn: { q1: 'B' }, integrity: {}, giayCau: { q1: 12 } }
    const a = await goiWorker(worker, d.env, '/nop', { ...than, sbd: 'S2' })
    const b = await goiWorker(worker, d.env, '/nop', { ...than, sbd: 'S3', doGiay: [1, 2, 3] })
    expect(a).toMatchObject({ ok: true })
    expect(b).toMatchObject({ ok: true })
    for (const s of ['S2', 'S3']) {
      const l = dong(d, s)
      expect(l.do_giay_json).toBeNull()
      expect(l.dap_an_json).toBe(JSON.stringify({ q1: 'B' }))
      expect(l.giay_cau_json).toBe(JSON.stringify({ q1: 12 }))
    }
  })
})
