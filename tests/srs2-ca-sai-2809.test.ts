// @vitest-environment node
// LUẬT THẦY 05/10 ("chặn chuẩn 100% không được rút nhầm kho khác khối"): kênh tự động chặn câu KHÔNG RÕ khối ⇒ câu trong kho giả ghi khối `lop` (đúng khối em).
// Thầy chốt 28/09: ca kiểm tra ĐÃ CÔNG BỐ ⇒ câu em SAI / BỎ TRỐNG tự vào hàng ôn của Đoàn (nguồn thứ 3 `ca_sai`, server/src/srs2-d1.ts), kể cả câu không thuộc chiến dịch nào.
// Luật thời điểm: kế hoạch hôm nay đã chốt KHÔNG đổi; câu sai của ca vào từ lần lập kế hoạch kế tiếp (ngày hôm sau).
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { docHoSo2, docQidSaiCaDaCongBo, layKeHoachHomNay } from '../server/src/srs2-d1'
import { gvCongBoCa } from '../server/src/ca-thi-them'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-09-30T02:00:00Z') // 09:00 VN 30/09
const NGAY = 86_400_000
const cau = (qid: string, tuLuan = false) => JSON.stringify({
  qid, maDe: 'DE1', lop: '12', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'NB',
  correct: 'B', reviewed: true, solution: { chot: 'c' }, ...(tuLuan ? { kieu: 'tu_luan' } : {}),
})
function dung(congBo = 'khong') {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x')`)
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= 12; i++) st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, 'D1', cau(`Q${i}`))
  st.run('DE9', 'TL1', 'v1', 'g-TL1', 'D1', cau('TL1', true))
  st.run('DE9', 'X1', 'v1', 'g-X1', 'D1', cau('X1'))
  st.run('DE9', 'X2', 'v1', 'g-X2', 'D1', cau('X2'))
  // ca C1 đã ĐÓNG, luật công bố theo tham số; em S1: sai X1, bỏ trống X2, đúng Q12, sai TL1 (tự luận), sai Q1 (thuộc chiến dịch sau này)
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,cong_bo,thoi_gian_phut,cap_nhat_luc) VALUES('C1','KT','dong','thi','12',?,45,'x')").run(congBo)
  const luc = '2026-09-29T02:30:00.000Z'
  const sk = d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES (?,?,?,'thi','C1',1,?,30,?,'2026-09-29')")
  for (const [q, kq] of [['X1', 0], ['X2', null], ['Q12', 1], ['TL1', 0], ['Q1', 0]] as const) sk.run(`thi|C1|S1|${q}`, 'S1', q, kq, luc)
  return { d, env }
}
const moiCau = (kh: { dao: string[]; doan: string[] }) => [...kh.dao, ...kh.doan].map((k) => k.replace(/#\d+$/, ''))

describe('nguồn ca_sai — câu sai của ca đã công bố vào hàng ôn Đoàn', () => {
  it('(1) ca CHƯA công bố ⇒ không câu nào vào', async () => {
    const { env } = dung('khong')
    expect((await docQidSaiCaDaCongBo(env, 'S1')).size).toBe(0)
    const hs = await docHoSo2(env, 'S1', '2026-09-30')
    expect(hs.cau.map((c) => c.qid)).not.toContain('X1')
  })
  it('(2) công bố ⇒ sai + bỏ trống vào (không câu đúng); (4) câu tự luận KHÔNG vào', async () => {
    const { env } = dung('ngay')
    const m = await docQidSaiCaDaCongBo(env, 'S1')
    expect([...m.keys()].sort()).toEqual(['Q1', 'X1', 'X2'])
    const hs = await docHoSo2(env, 'S1', '2026-09-30')
    const q = hs.cau.map((c) => c.qid)
    expect(q).toContain('X1'); expect(q).toContain('X2'); expect(q).not.toContain('TL1'); expect(q).not.toContain('Q12')
    expect(hs.cau.find((c) => c.qid === 'X1')?.nguon).toBe('no_cu')
  })
  it('(2) thầy bấm Công bố điểm (ca "công bố sau") ⇒ ngày SAU kế hoạch có câu sai của ca ở Đoàn', async () => {
    const { env } = dung('khong')
    await gvCongBoCa(env, { maCa: 'C1' }, T0)
    const mai = await layKeHoachHomNay(env, 'S1', T0 + NGAY)
    expect(mai.kh.doan.map((k) => k.replace(/#\d+$/, ''))).toEqual(expect.arrayContaining(['X1', 'X2']))
  })
  it('(3) kế hoạch hôm nay đã CHỐT trước khi công bố thì KHÔNG đổi; ngày sau mới có', async () => {
    const { env } = dung('khong')
    await gvChienDich(env, { action: 'tao', ten: 'CD', sbd: ['S1'], maDe: ['DE1'], hanNop: '2026-10-05' }, T0)
    const truoc = await layKeHoachHomNay(env, 'S1', T0)
    await gvCongBoCa(env, { maCa: 'C1' }, T0 + 60_000)
    const sau = await layKeHoachHomNay(env, 'S1', T0 + 120_000)
    expect(moiCau(sau.kh)).toEqual(moiCau(truoc.kh))
    expect(moiCau(sau.kh)).not.toContain('X1')
    const mai = await layKeHoachHomNay(env, 'S1', T0 + NGAY)
    expect(moiCau(mai.kh)).toContain('X1')
  })
  it('(5) câu vừa thuộc chiến dịch vừa sai trong ca ⇒ giữ nguồn chiến dịch, KHÔNG nhân đôi', async () => {
    const { env } = dung('ngay')
    await gvChienDich(env, { action: 'tao', ten: 'CD', sbd: ['S1'], maDe: ['DE1'], hanNop: '2026-10-05' }, T0)
    const hs = await docHoSo2(env, 'S1', '2026-09-30')
    const q1 = hs.cau.filter((c) => c.qid === 'Q1')
    expect(q1).toHaveLength(1)
    expect(q1[0]!.nguon).toBe('chien_dich')
    expect(hs.qidCaSai?.has('Q1')).toBe(false)
    expect(hs.qidCaSai?.has('X1')).toBe(true)
  })
})
