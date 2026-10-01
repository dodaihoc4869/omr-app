// @vitest-environment node
// THẦY BÁO 01/10 (ảnh): em còn câu cuối, bấm LÊN ĐƯỜNG thì hiện "Đoàn vừa đổi. Em mở lại chặng nhé." mãi.
// Gốc: em RỜI chặng đang đi (doan-roi ⇒ lượt của em có ket_luc) nhưng chặng vẫn `dang_di` và vẫn đứng tên em (`chu`), nên
// `gianhChangDoan` chặn mở chặng mới (điều kiện `c2.chu = em`) trong khi `timDangDo` (cần lượt CHƯA kết) không thấy chặng nào để trả lại.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { gianhChangDoan, type PhongDoan } from '../server/src/game-v2-doan'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { daHocDang } from './_pham-vi-ca-nhan'

const T0 = Date.parse('2026-09-22T12:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())

const cau = (qid: string, dang: string) => ({
  qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Đề ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: [],
  hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo: 'biet', sao: 1, kienThuc: ['K1'], correct: 'B', solution: `LG-${qid}`, reviewed: true,
})
function dung(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong',?,'x')").run(JSON.stringify({ toanBo: true }))
  const ds = Array.from({ length: 30 }, (_, i) => cau(`A-${i}`, 'A.1'))
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',?,'kho/DE1.json',0,'v1')").run(ds.length)
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  const them = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const q of ds) them.run('DE1', q.qid, q.version, q.group, q.dang, JSON.stringify(q))
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','12','mk','x')").run()
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)')
    .run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  daHocDang(d, 'S1', 'A.1')
  return d
}
it('GỐC LỖI: chặng em ĐÃ RỜI (lượt có ket_luc) mà vẫn dang_di đứng tên em ⇒ vẫn giành được chặng mới', async () => {
  const d = dung()
  const nay = new Date(T0).toISOString(), truoc = new Date(T0 - 10 * 60_000).toISOString()
  d.sql.prepare("INSERT INTO doan_chang(ma,json,chu,trang_thai,tao_luc) VALUES('DHCU','{}','S1','dang_di',?)").run(truoc)
  d.sql.prepare("INSERT INTO doan_luot(ma_chang,sbd,ngay_vn,lop,ghe,vao_luc,ket_luc) VALUES('DHCU','S1','2026-09-22','12',0,?,?)").run(truoc, nay)
  const phong = { kind: 'doan-phong', chu: 'S1', taoLuc: T0, nguoi: [], chang: null } as unknown as PhongDoan
  expect(await gianhChangDoan(d.env, 'DHMOI', phong, 'S1', '12', T0)).toBe(true)
})

it('chặng em CÒN đang ngồi (lượt chưa kết) ⇒ vẫn chặn mở chặng thứ hai (chống phát trùng giữ nguyên)', async () => {
  const d = dung()
  const truoc = new Date(T0 - 10 * 60_000).toISOString()
  d.sql.prepare("INSERT INTO doan_chang(ma,json,chu,trang_thai,tao_luc) VALUES('DHCU','{}','S1','dang_di',?)").run(truoc)
  d.sql.prepare("INSERT INTO doan_luot(ma_chang,sbd,ngay_vn,lop,ghe,vao_luc) VALUES('DHCU','S1','2026-09-22','12',0,?)").run(truoc)
  const phong = { kind: 'doan-phong', chu: 'S1', taoLuc: T0, nguoi: [], chang: null } as unknown as PhongDoan
  expect(await gianhChangDoan(d.env, 'DHMOI', phong, 'S1', '12', T0)).toBe(false)
})

it('chặng cũ còn dang_di, KHÔNG có sổ lượt (dữ liệu cũ) ⇒ vẫn chặn như trước', async () => {
  const d = dung()
  d.sql.prepare("INSERT INTO doan_chang(ma,json,chu,trang_thai,tao_luc) VALUES('DHCU','{}','S1','dang_di',?)").run(new Date(T0 - 60_000).toISOString())
  const phong = { kind: 'doan-phong', chu: 'S1', taoLuc: T0, nguoi: [], chang: null } as unknown as PhongDoan
  expect(await gianhChangDoan(d.env, 'DHMOI', phong, 'S1', '12', T0)).toBe(false)
})

it('ĐƯỜNG THẬT: em văng ra (doan-roi) giữa chặng chỉ còn bạn máy ⇒ chặng đóng ngay (huy), không còn chặng treo đứng tên em', async () => {
  const d = dung()
  const goi = async (duong: string, than: Record<string, unknown>) =>
    (await goiWorker(worker, d.env, duong, { token: await gameToken(d.env, 'S1'), ...than })) as Record<string, any>
  const a = await goi('/game-v2/doan-mo', { cheDo: 'phong' })
  const ma = String(a.doan.ma)
  expect((await goi('/game-v2/doan-bat-dau', { ma })).ok).toBe(true)
  expect((d.sql.prepare('SELECT trang_thai FROM doan_chang WHERE ma=?').get(ma) as { trang_thai: string }).trang_thai).toBe('dang_di')
  expect((await goi('/game-v2/doan-roi', { ma })).daRoi).toBe(true)
  const sau = d.sql.prepare('SELECT trang_thai, ket_luc FROM doan_chang WHERE ma=?').get(ma) as { trang_thai: string; ket_luc: string | null }
  expect(sau.trang_thai).toBe('huy')
  expect(sau.ket_luc).toBeTruthy()
  const phong = { kind: 'doan-phong', chu: 'S1', taoLuc: T0, nguoi: [], chang: null } as unknown as PhongDoan
  expect(await gianhChangDoan(d.env, 'DHMOI', phong, 'S1', '12', T0 + 60_000)).toBe(true)
})
