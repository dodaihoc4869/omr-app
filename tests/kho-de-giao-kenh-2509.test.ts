// @vitest-environment node
// KHO ĐỀ GIAO THEO TUẦN — CẮM 3 KÊNH (bước 3, 26/09/2026): Ôn lại · Kế hoạch ngày · Khắc phục.
// Em CÓ giao đang hiệu lực ⇒ chỉ còn câu thuộc đề đã tick; KHÔNG cấu hình ⇒ như cũ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { layCauChoEm } from '../server/src/cau-theo-qid'
import { cauKhacPhucGoi } from '../server/src/goi-cu'
import { xoaDemKhoDeGiao } from '../server/src/kho-de-giao'
import { taoD1That, type D1That } from './_d1-that'

const GIAO = '2026-10-01T00:00:00+07:00'
const HAN = '2026-10-10T00:00:00+07:00'
const TRONG = '2026-10-05T12:00:00+07:00'
const MA_A = 'DH-12-CA-TN'
const MA_B = 'DH-12-CB-TN'
const CAU = (qid: string, maDe: string) => ({ qid, maDe, version: 'v', group: `g-${qid}`, phan: 'I', text: 'x', choices: ['A', 'B', 'C', 'D'], ideas: [], hinhAnh: [], dang: 'ES.A', tenDang: 'A', mucDo: 'biet', sao: 0, kienThuc: ['k'], correct: 'B', solution: '', reviewed: true })
const gio = (s: string) => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(s)) }
const ghiGiao = (d: D1That, o: Record<string, unknown> = {}) =>
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kho_de_giao',?,'x')").run(JSON.stringify({ ma: 'kho_de_giao', bat: true, khoi: 12, lop: '12', sbd: ['S1'], maDe: [MA_A], giaoLuc: GIAO, deadline: HAN, ...o }))
beforeEach(() => xoaDemKhoDeGiao())
afterEach(() => { vi.useRealTimers(); xoaDemKhoDeGiao() })

describe('Ôn lại — layCauChoEm chỉ trả câu trong đề đã giao', () => {
  function dung(): D1That {
    const d = taoD1That()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,lop,cap_nhat_luc) VALUES('S1','Một','mk','12','x')")
    for (const ma of [MA_A, MA_B]) {
      d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,0,?)').run(ma, ma, '12', 2, `kho/${ma}.json`, 'v1')
      d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(ma)
      for (let i = 1; i <= 2; i++) {
        const qid = `${ma}-I-${i}`
        d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(ma, qid, 'v', `g-${qid}`, 'ES.A', JSON.stringify(CAU(qid, ma)))
        d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES(?,?,?,'btvn','B',1,0,'2026-09-01T00:00:00Z','2026-09-01')").run(`S1|${qid}`, 'S1', qid)
      }
    }
    return d
  }
  const xin = [`${MA_A}-I-1`, `${MA_B}-I-1`]
  it('trong danh sách + trong hạn ⇒ chỉ trả câu tờ A', async () => {
    const d = dung(); ghiGiao(d); xoaDemKhoDeGiao(); gio(TRONG)
    expect((await layCauChoEm(d.env, 'S1', xin)).cau.map((c) => c.qid)).toEqual([`${MA_A}-I-1`])
  })
  it('KHÔNG cấu hình ⇒ trả cả hai (hành vi cũ)', async () => {
    const d = dung(); gio(TRONG)
    expect((await layCauChoEm(d.env, 'S1', xin)).cau.map((c) => c.qid).sort()).toEqual([...xin].sort())
  })
})

describe('Khắc phục — cauKhacPhucGoi chỉ giữ câu trong đề đã giao', () => {
  const ma = 'ES.A.X'
  async function dung(): Promise<D1That> {
    const d = taoD1That()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Một','12','x')")
    const raw = [1, 2].map((so) => ({ phan: 'I', so, de: `Câu ${so}`, pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'B', dang: { ma }, mucDo: 'hieu', kienThuc: ['A'] }))
    for (const m of [MA_A, MA_B]) {
      d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,0,?)').run(m, m, '12', 2, `kho/${m}.json`, 'v1')
      d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(m)
      for (const c of raw) {
        const qid = `${m}-I-${c.so}`
        d.sql.prepare("INSERT INTO cau_hoi(qid,ma_de,chuyen_de,muc_do,phan,lop,co_loi_giai,cap_nhat_luc) VALUES(?,?,'CD1','hieu','I','12',1,'x')").run(qid, m)
        d.sql.prepare('INSERT INTO game_v2_question VALUES(?,?,?,?,?,?)').run(m, qid, 'v', `g${qid}`, ma, JSON.stringify({ qid, dang: ma, kienThuc: ['A'] }))
      }
      await d.env.DE.put(`kho/${m}.json`, JSON.stringify({ ma_de: m, cau: raw }))
    }
    return d
  }
  it('trong danh sách + trong hạn ⇒ thứ tự chỉ còn câu tờ A', async () => {
    const d = await dung(); ghiGiao(d); xoaDemKhoDeGiao(); gio(TRONG)
    const r = (await cauKhacPhucGoi(d.env, { sbd: 'S1', chuyenDe: ['CD1'], soCau: 10 })) as { thuTu: string[] }
    expect([...new Set(r.thuTu.map((q) => q.replace(/-I-\d+$/, '')))]).toEqual([MA_A])
  })
})
