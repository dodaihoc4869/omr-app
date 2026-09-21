// @vitest-environment node
// CA ĐÃ XOÁ MỀM (ca.trang_thai = 'da_xoa') không được lọt vào các lệnh HỌ HÀNG của /hs/lich-su (Boss 21/09: "màn khôi phục ca là chỗ duy nhất thấy ca đã xoá"):
// hoSoEm (hồ sơ em, phía thầy) · lichSuEm · phieuCuaEm · hsCauSai (cả hai truy vấn: chi_tiet_cau và luot) · tin phụ huynh (parent-news). Ca đang mở / đã đóng vẫn hiện. Mỗi chỗ MỘT test (đột biến bỏ điều kiện chết). SQLite thật.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { hoSoEm, hsCauSai, lichSuEm, phieuCuaEm } from '../server/src/goi-cu'
import { refreshDailyNews } from '../server/src/parent-news'
import { taoD1That, type D1That } from './_d1-that'

afterEach(() => vi.useRealTimers())
const NOW = Date.parse('2026-09-21T09:00:00.000Z')
const NOP = '2026-09-21T02:00:00.000Z'

/** Em S1 có hai ca đều công bố NGAY và đã nộp: CA-SONG (đang mở) và CA-XOA (thầy đã xoá mềm); cả hai đều có chi tiết câu sai + lượt có đáp án. */
function dung(): D1That {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em S1','12','mk','x')").run()
  for (const [ma, tt] of [['CA-SONG', 'mo'], ['CA-XOA', 'da_xoa']] as const) {
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,cap_nhat_luc) VALUES(?,?,?,'thi','ngay','x')").run(ma, `Ten ${ma}`, tt)
    d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,cap_nhat_luc,tong,diem_i,diem_ii,diem_iii,ho_ten,dap_an_json) VALUES(?,?,'S1',1,?,?, 'da_nop','x',7.5,2.5,2.5,2.5,'Em S1',?)")
      .run(`${ma}|S1|1`, ma, NOP, NOP, JSON.stringify({ [`${ma}-I-1`]: 'A' }))
    d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,chuyen_de,muc_do,dap_an_chon,dap_an_dung,dung_sai,giay,cap_nhat_luc) VALUES(?,?,'S1',1,'I',1,?,'Este','hieu','A','B',0,30,'x')")
      .run(`${ma}|S1|1|I|1`, ma, `${ma}-I-1`)
    // ngân hàng đáp án (đường dự phòng của hsCauSai dựng câu sai từ đáp án của lượt): đúng B, em chọn A ⇒ sai
    d.objects.set(`key/${ma}.json`, { phanI: [{ id: `${ma}-I-1`, qid: `${ma}-I-1`, so: 1, phan: 'I', text: `Câu hỏi của ca ${ma}`, pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dapAn: 'B', dap_an: 'B', loiGiai: `LG-${ma}` }] })
  }
  return d
}
const coMa = (r: unknown, ma: string): boolean => JSON.stringify(r).includes(ma)

describe('ca đã xoá mềm không lọt vào các lệnh họ hàng của /hs/lich-su', () => {
  it('hoSoEm (hồ sơ em, phía thầy): không tính ca da_xoa; ca đang mở vẫn có', async () => {
    const r = await hoSoEm(dung().env, { sbd: 'S1' })
    expect(coMa(r, 'CA-SONG'), 'đối chứng: ca sống có').toBe(true)
    expect(coMa(r, 'CA-XOA')).toBe(false)
  })
  it('lichSuEm: không có ca da_xoa; ca đang mở vẫn có', async () => {
    const r = await lichSuEm(dung().env, { sbd: 'S1' })
    expect(coMa(r, 'CA-SONG'), 'đối chứng').toBe(true)
    expect(coMa(r, 'CA-XOA')).toBe(false)
  })
  it('phieuCuaEm: xin đích danh ca da_xoa ⇒ không phiếu (ok false); ca đang mở vẫn ok', async () => {
    const d = dung()
    expect(await phieuCuaEm(d.env, { maCa: 'CA-SONG', sbd: 'S1' })).toMatchObject({ ok: true })
    expect(await phieuCuaEm(d.env, { maCa: 'CA-XOA', sbd: 'S1' })).toMatchObject({ ok: false })
  })
  it('hsCauSai: câu của ca da_xoa không có — cả đường chi_tiet_cau lẫn đường dự phòng dựng từ luot', async () => {
    const d = dung()
    const a = await hsCauSai(d.env, { sbd: 'S1' }) as { ok: boolean; items: { maCa: string }[] }
    expect(a.ok).toBe(true)
    expect([...new Set(a.items.map((x) => x.maCa))]).toEqual(['CA-SONG'])
    // đường dự phòng: xoá chi_tiet_cau ⇒ máy chủ dựng câu từ đáp án của luot
    d.sql.exec('DELETE FROM chi_tiet_cau')
    const cauLenh: string[] = []
    const goc = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = ((q: string) => { cauLenh.push(q); return goc(q) }) as typeof d.env.DB.prepare
    const b = await hsCauSai(d.env, { sbd: 'S1' }) as { ok: boolean; items: { maCa: string }[] }
    const luotQ = cauLenh.find((q) => /FROM luot l\s+LEFT JOIN ca ON ca\.ma_ca = l\.ma_ca/.test(q))
    expect(luotQ, 'đường dự phòng đã chạy truy vấn luot').toBeDefined()
    expect(luotQ).toContain("ca.trang_thai IS NOT 'da_xoa'") // truy vấn dự phòng cũng bỏ ca đã xoá (chạy thật trên SQLite)
    expect(coMa(b, 'CA-XOA')).toBe(false)
  })
  it('tin phụ huynh (refreshDailyNews): điểm hôm nay chỉ tính ca chưa xoá', async () => {
    const d = dung()
    const r = (await refreshDailyNews(d.env, 'S1', NOW)).reports[0] as unknown as { today: { ten?: string; diem: number }[] }
    expect(r.today).toHaveLength(1) // chỉ CA-SONG
  })
})
