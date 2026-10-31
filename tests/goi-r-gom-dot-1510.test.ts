// @vitest-environment node
// GÓI R (15/10 — luật thầy 13/10 "sửa xong máy chủ phải nhanh hơn"): KHOÁ các bước gom đợt D1 của Sảnh / Mở chặng / hồ sơ. Bớt đợt chờ nhưng:
//  (1) lệnh ghi DỒN giữ ĐÚNG thứ tự ghi cũ: quota ngày Gói 7 đứng ĐẦU lô ghi cuối của động cơ (không còn lệnh ghi riêng giữa lượt);
//  (2) mở chặng: lô ghi động cơ xong HẲN rồi mới lưu phiên (thứ tự cũ), dù lô ấy chạy song song lượt đọc câu;
//  (3) "đọc lại dòng thắng" sau INSERT OR IGNORE (phân nhóm, hồ sơ game lần đầu) luôn CÙNG lô với lệnh ghi — hai máy cùng mở lần đầu thấy cùng một dòng;
//  (4) lệnh tạo bảng gửi sớm: mỗi nhóm MỘT lô riêng chỉ gồm DDL (lỗi nhóm nào chỉ nhóm ấy, lượt sau tạo lại), nhóm đã gửi không gửi lại.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { gameToken } from '../server/src/game-v2-auth'
import { phanNhom, THU_NGHIEM_HT5 } from '../server/src/hanh-trinh-do-luong'
import { SQL_HANH_TRINH_V5 } from '../server/src/hanh-trinh-v5-schema'
import { loadProfile } from '../server/src/game-v2'
import { chayDdlMotLan, guiDdlSom } from '../server/src/ddl-mot-lan'
import { gopDocD1 } from '../server/src/doc-d1-theo-luot'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-12T13:30:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })

type Su = { loai: string; sql: string[]; bd: number; kt: number }
type Lenh = Record<string, (...a: unknown[]) => unknown>
/** Bọc D1 ghi lại MỌI lượt gọi (loại, câu SQL, số thứ tự lúc bắt đầu / lúc xong) — để khoá thứ tự và cách gom lô. */
function ghiNhan(goc: Env['DB']) {
  const nhat: Su[] = []
  let dem = 0
  const that = new WeakMap<object, unknown>(), sqlCua = new WeakMap<object, string>()
  const g = goc as unknown as { prepare(q: string): Lenh; batch(ds: unknown[]): Promise<unknown> }
  const chay = async <T,>(loai: string, sql: string[], f: () => Promise<T>): Promise<T> => {
    const su: Su = { loai, sql, bd: ++dem, kt: 0 }
    nhat.push(su)
    try { return await f() } finally { su.kt = ++dem }
  }
  const boc = (st: Lenh, sql: string): Lenh => {
    const b: Lenh = {
      bind: (...a) => boc(st.bind!(...a) as Lenh, sql),
      first: (...a) => chay('first', [sql], () => st.first!(...a) as Promise<unknown>),
      all: () => chay('all', [sql], () => st.all!() as Promise<unknown>),
      run: () => chay('run', [sql], () => st.run!() as Promise<unknown>),
    }
    that.set(b, st); sqlCua.set(b, sql)
    return b
  }
  const db: Record<string, unknown> = {
    prepare: (q: string) => boc(g.prepare(q), q),
    batch: (ds: object[]) => chay('batch', ds.map((x) => sqlCua.get(x) ?? '?'), () => g.batch(ds.map((x) => that.get(x) ?? x))),
  }
  db.withSession = () => db
  return { db: db as unknown as Env['DB'], nhat }
}

/** Kho như học sinh thật (cùng kho của cổng tốc độ): lớp 12 · Bài 8 (24 câu) vừa tick · Gói 7 bật · một đợt hành trình. */
async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  await damBaoBangBaiDaDay(k.env)
  const b8 = k.qids('DH-B8')
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',24,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-10-11T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: b8, maDe: ['DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  const gn = ghiNhan(k.env.DB)
  return { ...k, gn, env: { ...k.env, DB: gn.db } as Env, token: await gameToken(k.env, 'S1') }
}

async function goi(k: Awaited<ReturnType<typeof kho>>, lenh: string, than: Record<string, unknown> = {}) {
  const phu: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { phu.push(p) }, passThroughOnException() {} }
  const res = await worker.fetch(new Request(`https://test/game-v2/${lenh}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, token: k.token }) }), k.env, ctx as never)
  await Promise.allSettled(phu)
  return (await res.json()) as Record<string, unknown>
}

it('Sảnh lần đầu: quota ngày đứng ĐẦU lô ghi cuối của động cơ; phân nhóm đọc lại dòng thắng CÙNG lô; DDL mỗi nhóm một lô chỉ gồm DDL', async () => {
  const k = await kho()
  const r = await goi(k, 'hoc-tap-sanh')
  expect(r.ok, JSON.stringify(r).slice(0, 200)).toBe(true)
  const { nhat } = k.gn
  // (1) quota ngày: không còn lệnh ghi riêng giữa lượt; đi ĐẦU lô ghi cuối, trước mọi lệnh ghi của động cơ.
  expect(nhat.filter((s) => s.loai !== 'batch' && s.sql[0]!.includes('goi_bai_7_ngay(')).length).toBe(0)
  const loCuoi = nhat.filter((s) => s.loai === 'batch' && s.sql.some((q) => q.includes('INSERT OR IGNORE INTO goi_bai_7_ngay')))
  expect(loCuoi).toHaveLength(1)
  expect(loCuoi[0]!.sql[0]).toContain('INSERT OR IGNORE INTO goi_bai_7_ngay')
  const iEm = loCuoi[0]!.sql.findIndex((q) => q.includes('INSERT INTO hanh_trinh_v4_em'))
  expect(iEm).toBeGreaterThan(0)
  // Lô ghi cuối là lệnh D1 CUỐI CÙNG của Sảnh bắt đầu sau mọi lượt đọc của động cơ (không lượt đọc nào bị chặn bởi nó).
  expect(nhat.filter((s) => s.bd > loCuoi[0]!.bd && /^\s*SELECT/i.test(s.sql[0]!) && s.sql[0]!.includes('hanh_trinh')).length).toBe(0)
  // (3) phân nhóm thử nghiệm lần đầu: [INSERT OR IGNORE, đọc lại dòng thắng] trong MỘT lô.
  const loNhom = nhat.filter((s) => s.sql.some((q) => q.includes('INSERT OR IGNORE INTO hanh_trinh_v5_phan_nhom')))
  expect(loNhom).toHaveLength(1)
  expect(loNhom[0]!.loai).toBe('batch')
  expect(loNhom[0]!.sql).toHaveLength(2)
  expect(loNhom[0]!.sql[1]).toMatch(/^SELECT nhom,bat_dau,pham_vi,diem_dau,ma_tran_dau FROM hanh_trinh_v5_phan_nhom/)
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_v5_phan_nhom WHERE thu_nghiem=? AND sbd=?').get(THU_NGHIEM_HT5, 'S1')).toMatchObject({ n: 1 })
  // (4) lô có lệnh tạo bảng chỉ gồm lệnh tạo bảng.
  const loDdl = nhat.filter((s) => s.sql.some((q) => /^\s*CREATE\b/i.test(q)))
  expect(loDdl.length).toBeGreaterThan(0)
  for (const s of loDdl) { expect(s.loai).toBe('batch'); for (const q of s.sql) expect(q).toMatch(/^\s*CREATE\b/i) }
  // Mức hôm nay đã chốt đúng số Sảnh trả về.
  const muc = k.d.sql.prepare("SELECT muc FROM goi_bai_7_muc_ngay WHERE sbd='S1'").get() as { muc: number } | undefined
  expect(muc?.muc).toBe((r.goi7 as { toiThieu: number }).toiThieu)
})

it('Mở chặng: lô ghi động cơ (kèm quota ngày) XONG HẲN rồi mới lưu phiên — thứ tự ghi cũ', async () => {
  const k = await kho()
  vi.setSystemTime(NOW + 40_000)
  const r = await goi(k, 'hoc-tap-start')
  expect(r.ok, JSON.stringify(r).slice(0, 200)).toBe(true)
  expect((r.questions as unknown[]).length).toBeGreaterThan(0)
  const { nhat } = k.gn
  const loDongCo = nhat.filter((s) => s.loai === 'batch' && s.sql.some((q) => q.includes('INSERT INTO hanh_trinh_v4_em')))
  const luuPhien = nhat.filter((s) => s.sql[0]!.includes('INSERT INTO game_v2_session'))
  expect(loDongCo).toHaveLength(1)
  expect(luuPhien).toHaveLength(1)
  expect(loDongCo[0]!.sql[0]).toContain('INSERT OR IGNORE INTO goi_bai_7_ngay')
  expect(loDongCo[0]!.kt).toBeLessThan(luuPhien[0]!.bd)
  expect(k.d.sql.prepare("SELECT COUNT(*) n FROM game_v2_session WHERE sbd='S1'").get()).toMatchObject({ n: 1 })
  expect(k.d.sql.prepare("SELECT COUNT(*) n FROM hanh_trinh_v4_em WHERE sbd='S1'").get()).toMatchObject({ n: 1 })
})

it('Phân nhóm lần đầu: hai lượt cùng lúc ⇒ cùng một dòng thắng, mỗi lượt [ghi, đọc lại] trong MỘT lô', async () => {
  const k = await kho()
  await chayDdlMotLan(k.env, 'hanh_trinh_v5', SQL_HANH_TRINH_V5)
  const [a, b] = await Promise.all([phanNhom(k.env, 'S1', NOW, 'pv', true), phanNhom(k.env, 'S1', NOW, 'pv', true)])
  expect(a).toBeTruthy()
  expect(b).toEqual(a)
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_v5_phan_nhom WHERE thu_nghiem=? AND sbd=?').get(THU_NGHIEM_HT5, 'S1')).toMatchObject({ n: 1 })
  const lo = k.gn.nhat.filter((s) => s.sql.some((q) => q.includes('INSERT OR IGNORE INTO hanh_trinh_v5_phan_nhom')))
  expect(lo).toHaveLength(2)
  for (const s of lo) { expect(s.loai).toBe('batch'); expect(s.sql).toHaveLength(2); expect(s.sql[1]).toContain('FROM hanh_trinh_v5_phan_nhom') }
})

it('Hồ sơ game lần đầu: hai lượt cùng lúc ⇒ cùng dòng thắng (cùng revision, cùng hồ sơ), tạo + đọc lại trong MỘT lô', async () => {
  const k = await kho()
  k.d.sql.prepare("INSERT INTO game_v2_settings(key,json) VALUES('season',?)").run(JSON.stringify({ id: 'mua-goi-r' }))
  const envA = { ...k.env, DB: gopDocD1(k.env.DB) } as Env, envB = { ...k.env, DB: gopDocD1(k.env.DB) } as Env
  const [a, b] = await Promise.all([loadProfile(envA, 'S2'), loadProfile(envB, 'S2')])
  expect(b.revision).toBe(a.revision)
  expect(JSON.stringify(b.profile)).toBe(JSON.stringify(a.profile))
  expect(k.d.sql.prepare("SELECT COUNT(*) n FROM game_v2_profile WHERE sbd='S2'").get()).toMatchObject({ n: 1 })
  const lo = k.gn.nhat.filter((s) => s.sql.some((q) => q.includes('INSERT OR IGNORE INTO game_v2_profile')))
  expect(lo).toHaveLength(2)
  for (const s of lo) { expect(s.loai).toBe('batch'); expect(s.sql).toHaveLength(2); expect(s.sql[1]).toContain('SELECT revision,json FROM game_v2_profile') }
})

it('guiDdlSom: mỗi nhóm MỘT lô riêng qua D1 gốc; nhóm đã gửi không gửi lại; nhóm lỗi chỉ hỏng chính nó và được tạo lại lượt sau', async () => {
  const k = await kho()
  const env = { ...k.env, DB: gopDocD1(k.env.DB) } as Env
  const truoc = k.gn.nhat.length
  const A = ['CREATE TABLE IF NOT EXISTS goi_r_a (x TEXT)'], B = ['CREATE TABLE IF NOT EXISTS goi_r_b (x TEXT)', 'CREATE INDEX IF NOT EXISTS goi_r_b_x ON goi_r_b(x)'], LOI = ['CREATE TABLE IF NOT EXISTS (']
  guiDdlSom(env, [['goi_r_a', A], ['goi_r_b', B], ['goi_r_loi', LOI]])
  await expect(chayDdlMotLan(env, 'goi_r_loi', LOI)).rejects.toThrow()
  await chayDdlMotLan(env, 'goi_r_a', A)
  await chayDdlMotLan(env, 'goi_r_b', B)
  // 31/10: isolate đọc tên đối tượng MỘT lần (sqlite_master, ddl-mot-lan.ts) trước khi quyết gửi lô — chỉ một câu đọc, không phải lô
  const docTen = (x: typeof k.gn.nhat) => x.filter((s) => s.sql.some((q) => q.includes('FROM sqlite_master WHERE type IN')))
  const lo = k.gn.nhat.slice(truoc).filter((s) => !docTen([s]).length)
  expect(docTen(k.gn.nhat.slice(truoc))).toHaveLength(1)
  expect(lo.map((s) => s.sql)).toHaveLength(3) // thứ tự gửi không quan trọng (nhóm không đọc được tên gửi ngay, nhóm khác chờ đọc tên)
  expect(lo.map((s) => s.sql)).toEqual(expect.arrayContaining([A, B, LOI]))
  for (const s of lo) expect(s.loai).toBe('batch')
  expect(k.d.sql.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name IN ('goi_r_a','goi_r_b','goi_r_b_x')").get()).toMatchObject({ n: 3 })
  // Nhóm lỗi: cờ "đã chạy" bỏ ⇒ lượt sau gửi lại (và nhận lỗi ở đúng chỗ); nhóm tốt không gửi lại.
  await expect(chayDdlMotLan(env, 'goi_r_loi', LOI)).rejects.toThrow()
  await chayDdlMotLan(env, 'goi_r_a', A)
  const sau = k.gn.nhat.slice(truoc).filter((s) => !docTen([s]).length).map((s) => s.sql)
  expect(sau).toHaveLength(4)
  expect(sau.filter((x) => JSON.stringify(x) === JSON.stringify(LOI))).toHaveLength(2)
  expect(sau.at(-1)).toEqual(LOI)
})
