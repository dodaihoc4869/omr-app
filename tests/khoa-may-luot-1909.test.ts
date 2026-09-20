// @vitest-environment node
// `khoaMay` (chỉ-thêm) trên MỖI dòng lượt của POST /ca/chi-tiet và POST /ca/luot: lượt có ghi id thiết bị = đang khoá máy. CHỈ có/không, KHÔNG trả mã máy.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const MA_MAY = 'thiet-bi-BI-MAT-123'
function dung(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cap_nhat_luc) VALUES('C1','Ca 1','mo','thi','x')").run()
  const luot = (sbd: string, may: string | null) =>
    d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,id_thiet_bi,vao_luc,trang_thai,cap_nhat_luc) VALUES(?,?,?,1,?,'x','dang_lam','x')").run(`C1|${sbd}|1`, 'C1', sbd, may)
  luot('A', MA_MAY); luot('B', null); luot('C', ''); luot('D', '   ')
  return d
}
const khoa = (r: { luot?: { sbd: string; khoaMay: boolean }[]; ds?: { sbd: string; khoaMay: boolean }[] }) => Object.fromEntries((r.luot ?? r.ds ?? []).map((x) => [x.sbd, x.khoaMay]))

describe('khoaMay trên lượt của ca', () => {
  it('/ca/chi-tiet: true chỉ ở lượt có id thiết bị; null, rỗng, khoảng trắng ⇒ false; KHÔNG lộ mã máy', async () => {
    const d = dung()
    const r = await goiWorker(worker, d.env, '/ca/chi-tiet', { maCa: 'C1' }, true)
    expect(r.ok).toBe(true)
    expect(khoa(r)).toEqual({ A: true, B: false, C: false, D: false })
    expect(JSON.stringify(r)).not.toContain(MA_MAY)
    for (const l of r.luot) expect(typeof l.khoaMay).toBe('boolean')
  })
  it('/ca/luot: như trên', async () => {
    const d = dung()
    const r = await goiWorker(worker, d.env, '/ca/luot', { maCa: 'C1' }, true)
    expect(r.ok).toBe(true)
    expect(khoa(r)).toEqual({ A: true, B: false, C: false, D: false })
    expect(JSON.stringify(r)).not.toContain(MA_MAY)
  })
  it('mở khoá máy xong thì khoaMay về false ở lần đọc sau; vẫn đòi mã bí mật', async () => {
    const d = dung()
    d.sql.prepare("UPDATE luot SET id_thiet_bi = NULL WHERE sbd = 'A'").run()
    expect(khoa(await goiWorker(worker, d.env, '/ca/luot', { maCa: 'C1' }, true)).A).toBe(false)
    expect((await goiWorker(worker, d.env, '/ca/chi-tiet', { maCa: 'C1' })).ok).not.toBe(true)
    expect((await goiWorker(worker, d.env, '/ca/luot', { maCa: 'C1' })).ok).not.toBe(true)
  })
})
