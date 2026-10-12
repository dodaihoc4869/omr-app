// @vitest-environment node
// ĐỢT 17 (thầy 12/10: "Sau khi làm hết tất cả thì bắt buộc tối ưu máy chủ chuyên sâu để mọi thứ phải load tức thì"). Khoá:
//  1. Động cơ hành trình CHỈ GHI bảng cạnh của em khi cạnh đổi (trước: mỗi lần lập kế hoạch ghi lại ~124 dòng — ~2,5 triệu dòng/ngày); vẫn làm mới
//     mốc ≥ mỗi 20 giờ; em làm câu mới ⇒ ghi lại; bảng cạnh luôn đúng như ghi đầy đủ.
//  2. Mở chặng đọc câu SONG SONG theo lô (trước: từng câu nối tiếp) — cùng bộ câu, cùng thứ tự; số lượt chờ D1 nối tiếp giảm.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich, lam, type KhoOmni } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, lapGoi7, startGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { gan } from '../server/src/cau-hinh-dem'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-12T02:00:00Z') // 09:00 giờ VN
const PHUT = 60_000, GIO = 3_600_000
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe() })

async function kho(): Promise<KhoOmni> {
  const k = taoKhoOmni({ 'DH-B7': 40, 'DH-B8': 60 }, 3)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL;
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8',60,0,'v1'),('DH-B7','Bài 7',40,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x'),('DH-B7','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  const tick = k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
  tick.run('ester', '12 - Lớp Thường', 'B7', 'Bài 7', 7, '["DH-B7"]', '2026-10-01T02:00:00Z')
  tick.run('amine', '12 - Lớp Thường', 'B8', 'Bài 8', 8, '["DH-B8-TN","DH-B8-DS","DH-B8-TLN"]', '2026-10-11T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1', 'S2', 'S3'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  for (const [i, q] of k.qids('DH-B7').slice(0, 8).entries()) await lam(k.env, 'S1', q, NOW - 86400000 + i * PHUT, i % 3 !== 0)
  return k
}
/** D1 đếm lệnh ghi bảng cạnh (cùng D1 gốc ⇒ DDL một lần như máy thật). */
function demGhiCanh(env: Env) {
  const goc = env.DB, dem = { n: 0 }
  const DB = gan({ prepare: (q: string) => { if (/(UPDATE|INSERT INTO) hanh_trinh_v4_canh/.test(q)) dem.n++; return goc.prepare(q) }, batch: goc.batch.bind(goc) }, goc)
  return { env: { ...env, DB } as unknown as Env, dem }
}
const canh = (k: KhoOmni) => JSON.stringify(k.d.sql.prepare("SELECT tu,den,n_co,dung_co,n_chua,dung_chua FROM hanh_trinh_v4_canh WHERE sbd='S1' ORDER BY tu,den").all())

describe('1 · bảng cạnh chỉ ghi khi đổi', () => {
  it('lập lại không có câu mới ⇒ 0 lệnh ghi cạnh, bảng y hệt; làm câu mới ⇒ ghi lại; quá 20 giờ ⇒ làm mới mốc', async () => {
    const k = await kho()
    const { env, dem } = demGhiCanh(k.env)
    await lapGoi7(env, 'S1', NOW)
    expect(dem.n).toBe(2) // lần đầu: ghi đầy đủ (xoá về 0 + chèn)
    const truoc = canh(k)
    dem.n = 0
    await lapGoi7(env, 'S1', NOW + 2 * PHUT)
    await lapGoi7(env, 'S1', NOW + 5 * PHUT)
    expect(dem.n).toBe(0)
    expect(canh(k)).toBe(truoc)
    // Em làm thêm câu ⇒ cạnh có thể đổi ⇒ lần lập sau phải tính & ghi theo bản mới nếu khác
    for (const [i, q] of k.qids('DH-B7').slice(8, 14).entries()) await lam(k.env, 'S1', q, NOW + (6 + i) * PHUT, i % 2 === 0)
    dem.n = 0
    await lapGoi7(env, 'S1', NOW + 20 * PHUT)
    const sauLam = canh(k)
    if (sauLam !== truoc) expect(dem.n).toBe(2)
    // Đối chứng: ghi đầy đủ trên kho sạch cùng sổ học cho ra đúng bảng ấy
    dem.n = 0
    await lapGoi7(env, 'S1', NOW + 21 * GIO)
    expect(dem.n).toBe(2) // quá 20 giờ ⇒ làm mới mốc
  })
})

describe('2 · mở chặng đọc câu song song, cùng bộ câu', () => {
  it('6 câu, đúng thứ tự kế hoạch; các lượt đọc câu chạy chồng nhau (không nối tiếp từng câu)', async () => {
    vi.useRealTimers()
    const k = await kho()
    await startGoi7(k.env, 'S3', NOW) // làm nóng (bảng/chỉ mục) như máy thật
    let dangBay = 0, nhieuNhat = 0
    const goc = k.env.DB
    const tre = <T,>(p: Promise<T>) => new Promise<T>((r, j) => { p.then((v) => setTimeout(() => r(v), 15), (e) => setTimeout(() => j(e), 15)) })
    const boc = (st: ReturnType<typeof goc.prepare>, laCau: boolean): ReturnType<typeof goc.prepare> => new Proxy(st, { get(t, key) {
      if (key === 'bind') return (...a: unknown[]) => boc((t as unknown as { bind: (...x: unknown[]) => typeof st }).bind(...a), laCau)
      if (key === 'first' || key === 'all') return (...a: unknown[]) => {
        if (laCau) { dangBay++; nhieuNhat = Math.max(nhieuNhat, dangBay) }
        return tre((t as unknown as Record<string, (...x: unknown[]) => Promise<unknown>>)[key as string]!(...a)).finally(() => { if (laCau) dangBay-- })
      }
      const v = Reflect.get(t, key); return typeof v === 'function' ? v.bind(t) : v } })
    const env = { ...k.env, DB: gan({ prepare: (q: string) => boc(goc.prepare(q), /^SELECT q\.json FROM game_v2_question q JOIN de_kho/.test(q.trim())), batch: goc.batch.bind(goc) }, goc) } as unknown as Env
    const lap = (await lapGoi7(k.env, 'S1', NOW))!
    const r = (await startGoi7(env, 'S1', NOW)) as { questions: { qid: string }[] }
    expect(r.questions.map((q) => q.qid)).toEqual(lap.plan.viec.slice(0, 6).map((v) => v.qid))
    expect(nhieuNhat).toBeGreaterThanOrEqual(6)
  })
})
