// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, lam } from './omni-3-ke-hoach-chung'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { damBaoGoi7, docGoiCuaEm7 } from '../server/src/goi-bai-7'
import { gvGoi7 } from '../server/src/goi-bai-7-thay'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { dongBaiDangGiao, goiDangGiao, TOI_DA_DONG_GIAO } from '../src/components/chien-dich/buoi-day-ui'
import type { DuGoi7, GoiDu } from '../src/components/chien-dich/goi7-ui'

const NOW = Date.parse('2026-10-13T13:00:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi() })

async function kho(n = 2) {
  const k = taoKhoOmni({ 'DH-B1': 3 }, 3)
  await damBaoBangBaiDaDay(k.env)
  await damBaoGoi7(k.env)
  k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x');
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B1','Bài 1',3,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B1','v1','x');
    UPDATE hoc_sinh SET lop='11' WHERE sbd='S3'`)
  for (let i = 1; i <= n; i++) {
    const id = `g${i}`, lop = i === 2 ? '11' : '12A1'
    k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)').run(id, lop, id, `Bài ${i}`, i, '["DH-B1"]', '2026-10-10T00:00:00Z')
    k.d.sql.prepare('INSERT INTO goi_bai_7(id,tick_id,lop,khoa_bai,ten,bat_dau,han,tao_luc) VALUES(?,?,?,?,?,?,?,?)').run(id, id, lop, id, `Bài ${i}`, '2026-10-10', '2026-10-16', 'x')
    for (const qid of k.qids('DH-B1')) k.d.sql.prepare('INSERT INTO goi_bai_7_cau(goi_id,qid,version,ma_de,meta_json) VALUES(?,?,?,?,?)').run(id, qid, 'v1', 'DH-B1', JSON.stringify({ qid, version: 'v1', maDe: 'DH-B1', group: qid, phan: 'I', kho: false, tinhToan: false, kyNang: ['dang:a'], hopLe: true }))
    // Một em đã chuyển lớp vẫn còn trong bảng gói cũ: thống kê phải theo lớp hiện tại như màn chi tiết.
    for (const sbd of i === 2 ? ['S3'] : ['S1', 'S2', 'S3']) k.d.sql.prepare('INSERT INTO goi_bai_7_em(goi_id,sbd,bat_dau,han) VALUES(?,?,?,?)').run(id, sbd, '2026-10-10', '2026-10-16')
  }
  return k
}

it('tổng hợp khớp chi tiết: đếm câu gốc/bản hiện tại, gặp có hỗ trợ, tự làm, lặp câu và em chuyển lớp', async () => {
  const k = await kho(), [a, b, c] = k.qids('DH-B1')
  await lam(k.env, 'S1', a!, NOW - 1000, true, { cauVersion: 'v1' })
  await lam(k.env, 'S1', a!, NOW, false, { cauVersion: 'v1' })
  await lam(k.env, 'S1', b!, NOW, false, { cauVersion: 'v1', assistance: 'assisted' })
  await lam(k.env, 'S1', c!, NOW, true, { cauVersion: 'v1' })
  k.d.sql.prepare('INSERT INTO loi_giai_hoi(sbd,qid,luc) VALUES(?,?,?)').run('S1', c!, new Date(NOW - 1000).toISOString())
  await lam(k.env, 'S2', b!, NOW, true, { cauVersion: 'v0' })
  await lam(k.env, 'S2', c!, NOW, null, { cauVersion: 'v1' })
  await lam(k.env, 'S3', a!, NOW, true, { cauVersion: 'v1' })
  const gap = k.d.sql.prepare('INSERT INTO goi_bai_7_gap(receipt,goi_id,sbd,qid,version,kieu,luc) VALUES(?,?,?,?,?,?,?)')
  gap.run('1', 'g1', 'S2', a!, 'v1', 'cho_thay', 'x')
  gap.run('2', 'g1', 'S2', a!, 'v1', 'co_ho_tro', 'x')
  gap.run('3', 'g1', 'S2', b!, 'v0', 'co_ho_tro', 'x')
  gap.run('4', 'g2', 'S2', c!, 'v1', 'co_ho_tro', 'x')
  const r = await gvGoi7(k.env, { action: 'tong_hop' })
  expect(r).not.toHaveProperty('cau'); expect(r).not.toHaveProperty('em')
  expect(r.thongKe).toMatchObject({ g1: { soEm: 2, pGap: 67, pTuLam: 17 }, g2: { soEm: 1, pGap: 33, pTuLam: 33 } })
  for (const g of r.goi as GoiDu[]) {
    const du = await gvGoi7(k.env, { action: 'danh_sach', goiId: g.id })
    const d = dongBaiDangGiao(g, du as unknown as DuGoi7)
    expect((r.thongKe as Record<string, unknown>)[g.id]).toEqual({ soEm: d.soEm, pGap: d.pGap, pTuLam: d.pTuLam })
  }
})

it('lọc lớp/bỏ tick, không đếm lần xem, embargoed hoặc ca chưa công bố; gói không câu/em có số null', async () => {
  const k = await kho(), qid = k.qids('DH-B1')[0]!
  await lam(k.env, 'S1', qid, NOW, true, { cauVersion: 'v1', purpose: 'xem_loi_giai' })
  await lam(k.env, 'S1', qid, NOW, true, { cauVersion: 'v1', visibility: 'embargoed' })
  await lam(k.env, 'S1', qid, NOW, true, { cauVersion: 'v1', nguon: 'thi', maNguon: 'chua-cong-bo' })
  let r = await gvGoi7(k.env, { action: 'tong_hop', lop: '12A1' })
  expect((r.goi as GoiDu[]).map(g => g.id)).toEqual(['g1'])
  expect(r.thongKe).toEqual({ g1: { soEm: 2, pGap: 0, pTuLam: 0 } })
  k.d.sql.exec("DELETE FROM goi_bai_7_cau WHERE goi_id='g1'; UPDATE bai_da_day SET bo_tick_luc='x' WHERE id='g2'")
  r = await gvGoi7(k.env, { action: 'tong_hop' })
  expect(r.thongKe).toEqual({ g1: { soEm: 2, pGap: null, pTuLam: null } })
  k.d.sql.exec("UPDATE hoc_sinh SET lop='10' WHERE sbd IN('S1','S2')")
  expect((await gvGoi7(k.env, { action: 'tong_hop' })).thongKe).toEqual({ g1: { soEm: 0, pGap: null, pTuLam: null } })
})

it('5 gói chỉ hai truy vấn metadata/số tổng hợp; không trả JSON đề, sổ em, OMNI hay lời chữa', async () => {
  const k = await kho(5)
  await gvGoi7(k.env, { action: 'tong_hop' }) // Cờ/DDL đã ấm như isolate đang chạy.
  const before = k.d.soLenh.prepare
  const r = await gvGoi7(k.env, { action: 'tong_hop' })
  expect(k.d.soLenh.prepare - before).toBe(2)
  expect(r.goi).toHaveLength(5)
  const start = k.d.soLenh.prepare
  for (const g of r.goi as GoiDu[]) await gvGoi7(k.env, { action: 'danh_sach', goiId: g.id })
  expect(k.d.soLenh.prepare - start).toBe(45)
  expect(JSON.stringify(r).length).toBeLessThan(2500)
})

it('thống kê chỉ 12 dòng nhìn thấy theo đúng thứ tự UI; bài quá hạn ẩn không bị đọc sổ', async () => {
  const k = await kho(20)
  k.d.sql.exec("UPDATE goi_bai_7 SET han='2026-10-12' WHERE CAST(SUBSTR(id,2) AS INT)>=5")
  const r = await gvGoi7(k.env, { action: 'tong_hop' }), goi = r.goi as GoiDu[]
  expect(goi).toHaveLength(20)
  expect(Object.keys(r.thongKe as object).sort()).toEqual(['g1', 'g2', 'g3', 'g4'])
  const x = await gvGoi7(k.env, { action: 'tong_hop', caCu: true })
  const visible = [...goiDangGiao(goi, '2026-10-13'), ...goi.filter(g => g.han < '2026-10-13').sort((a, b) => b.han.localeCompare(a.han))].slice(0, TOI_DA_DONG_GIAO)
  expect(Object.keys(x.thongKe as object).sort()).toEqual(visible.map(g => g.id).sort())
  expect(Object.keys(x.thongKe as object)).toHaveLength(TOI_DA_DONG_GIAO)
  k.d.sql.exec("UPDATE goi_bai_7 SET han='2026-10-12'")
  const truoc = k.d.soLenh.prepare
  expect((await gvGoi7(k.env, { action: 'tong_hop' })).thongKe).toEqual({})
  expect(k.d.soLenh.prepare - truoc).toBe(1)
})

const doi = (goi: { goiId: string; hanCu: string }[], han = '2026-10-19') => ({ action: 'sua_han_hang_loat', goi, han })

it('sửa đồng thời nhiều lớp, phản hồi từng id/hạn; xoá chỉ cache từ hôm nay, giữ lịch sử/nháp/đề công bố', async () => {
  const k = await kho(), qid = k.qids('DH-B1')[0]!
  await lam(k.env, 'S1', qid, NOW, true, { cauVersion: 'v1' })
  k.d.sql.exec(`INSERT INTO goi_bai_7_ngay VALUES('g1','S1','2026-10-12',99),('g1','S1','2026-10-13',12),('g2','S3','2026-10-14',12),('other','S9','2026-10-14',18);
    INSERT INTO goi_bai_7_muc_ngay VALUES('S1','2026-10-13',1,24,12,24,'x'),('S9','2026-10-13',1,24,18,24,'x');
    INSERT INTO goi_bai_7_kiem(id,goi_id,sbd,ma_de,json,tao_luc) VALUES('de','g1','S1','DH-B1','{"cau":[]}','x')`)
  const r = await gvGoi7(k.env, doi([{ goiId: 'g1', hanCu: '2026-10-16' }, { goiId: 'g2', hanCu: '2026-10-16' }]))
  expect(r).toMatchObject({ ok: true, daDoi: true, tuDongTinhLai: true, ketQua: [{ ok: true, goiId: 'g1', han: '2026-10-19' }, { ok: true, goiId: 'g2', han: '2026-10-19' }] })
  expect(k.d.sql.prepare('SELECT DISTINCT han FROM goi_bai_7_em').all()).toEqual([{ han: '2026-10-19' }])
  expect(k.d.sql.prepare('SELECT goi_id,ngay FROM goi_bai_7_ngay ORDER BY goi_id').all()).toEqual([{ goi_id: 'g1', ngay: '2026-10-12' }, { goi_id: 'other', ngay: '2026-10-14' }])
  expect(k.d.sql.prepare('SELECT sbd FROM goi_bai_7_muc_ngay').all()).toEqual([{ sbd: 'S9' }])
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM su_kien_hoc').get()!.n).toBe(1)
  expect(k.d.sql.prepare('SELECT json FROM goi_bai_7_kiem').get()!.json).toBe('{"cau":[]}')
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM goi_bai_7_sua_han').get()!.n).toBe(2)
  expect((await docGoiCuaEm7(k.env, 'S1', NOW, true))[0]).toMatchObject({ han: '2026-10-19' })
})

it('danh sách sai/trùng, hạn sai, bài bỏ tick hoặc một bản cũ sai đều không lưu bất kỳ lớp nào', async () => {
  const k = await kho(), ds = [{ goiId: 'g1', hanCu: '2026-10-16' }, { goiId: 'g2', hanCu: '2026-10-16' }]
  for (const han of ['2026-02-30', '2026-10-12', 'x']) await expect(gvGoi7(k.env, doi(ds, han))).rejects.toThrow()
  for (const goi of [[], [ds[0]!, ds[0]!], [...ds, { goiId: 'khong-co', hanCu: '2026-10-16' }], [ds[0]!, { goiId: 'g2', hanCu: '2026-10-17' }]]) await expect(gvGoi7(k.env, doi(goi))).rejects.toThrow()
  k.d.sql.exec("UPDATE bai_da_day SET bo_tick_luc='x' WHERE id='g2'")
  await expect(gvGoi7(k.env, doi(ds))).rejects.toThrow('không còn được tick')
  expect(k.d.sql.prepare('SELECT DISTINCT han FROM goi_bai_7').all()).toEqual([{ han: '2026-10-16' }])
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM goi_bai_7_sua_han').get()!.n).toBe(0)
})

it('CAS trong giao dịch chặn máy khác vừa sửa/mở ca sau bước đọc: không lưu nửa chừng', async () => {
  for (const race of ['han', 'ca']) {
    const k = await kho(), batch = k.env.DB.batch.bind(k.env.DB)
    k.env.DB.batch = (stmts) => {
      if (race === 'han') k.d.sql.exec("UPDATE goi_bai_7 SET han='2026-10-17' WHERE id='g2'")
      else k.d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('MO','Ca','mo','x','x',45,'thi','khong','de/x','x')")
      return batch(stmts)
    }
    await expect(gvGoi7(k.env, doi([{ goiId: 'g1', hanCu: '2026-10-16' }, { goiId: 'g2', hanCu: '2026-10-16' }]))).rejects.toThrow('vừa thay đổi')
    expect(k.d.sql.prepare("SELECT han FROM goi_bai_7 WHERE id='g1'").get()!.han).toBe('2026-10-16')
    expect(k.d.sql.prepare('SELECT COUNT(*) n FROM goi_bai_7_sua_han').get()!.n).toBe(0)
  }
})

it('hai máy lưu đồng thời: chỉ một giao dịch thắng; bấm lại bản cũ không ghi lại và giữ hạn cuối', async () => {
  const k = await kho(), ds = [{ goiId: 'g1', hanCu: '2026-10-16' }, { goiId: 'g2', hanCu: '2026-10-16' }]
  const r = await Promise.allSettled([gvGoi7(k.env, doi(ds, '2026-10-19')), gvGoi7(k.env, doi(ds, '2026-10-20'))])
  expect(r.filter(x => x.status === 'fulfilled')).toHaveLength(1)
  expect(r.filter(x => x.status === 'rejected')).toHaveLength(1)
  expect(k.d.sql.prepare('SELECT COUNT(DISTINCT han) n FROM goi_bai_7').get()!.n).toBe(1)
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM goi_bai_7_sua_han').get()!.n).toBe(2)
})

it('lỗi ghi giữa giao dịch được rollback cả hạn và biên nhận; giữ nguyên cache kế hoạch', async () => {
  const k = await kho(), batch = k.env.DB.batch.bind(k.env.DB)
  k.d.sql.exec("INSERT INTO goi_bai_7_ngay VALUES('g1','S1','2026-10-13',12)")
  k.env.DB.batch = stmts => batch([...stmts.slice(0, 2), k.env.DB.prepare('UPDATE bang_khong_ton_tai SET x=1'), ...stmts.slice(2)])
  await expect(gvGoi7(k.env, doi([{ goiId: 'g1', hanCu: '2026-10-16' }, { goiId: 'g2', hanCu: '2026-10-16' }]))).rejects.toThrow()
  expect(k.d.sql.prepare('SELECT DISTINCT han FROM goi_bai_7').all()).toEqual([{ han: '2026-10-16' }])
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM goi_bai_7_sua_han').get()!.n).toBe(0)
  expect(k.d.sql.prepare('SELECT quota FROM goi_bai_7_ngay').get()!.quota).toBe(12)
})

it('lưu hạn không đổi không ghi lại hoặc xoá cache; cờ tắt chặn cả sửa một lớp và hàng loạt', async () => {
  const k = await kho(), goi = [{ goiId: 'g1', hanCu: '2026-10-16' }, { goiId: 'g2', hanCu: '2026-10-16' }]
  k.d.sql.exec("INSERT INTO goi_bai_7_ngay VALUES('g1','S1','2026-10-13',12)")
  expect(await gvGoi7(k.env, doi(goi, '2026-10-16'))).toMatchObject({ ok: true, daDoi: false, ketQua: [{ ok: true, goiId: 'g1', han: '2026-10-16' }, { ok: true, goiId: 'g2', han: '2026-10-16' }] })
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM goi_bai_7_sua_han').get()!.n).toBe(0)
  expect(k.d.sql.prepare('SELECT quota FROM goi_bai_7_ngay').get()!.quota).toBe(12)
  k.d.sql.exec("UPDATE cau_hinh SET gia_tri='{\"bat\":false}' WHERE khoa='goi_bai_7_v1'")
  xoaDemCauHinh(k.env)
  await expect(gvGoi7(k.env, doi(goi))).rejects.toThrow('tạm dừng')
  await expect(gvGoi7(k.env, { action: 'sua_han', goiId: 'g1', hanCu: '2026-10-16', han: '2026-10-19' })).rejects.toThrow('tạm dừng')
  expect(await gvGoi7(k.env, { action: 'tong_hop' })).toEqual({ ok: true, bat: false, goi: [], thongKe: {} })
})
