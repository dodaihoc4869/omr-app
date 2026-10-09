// @vitest-environment node
// Hành trình 09/10 — (4) Sảnh gửi thêm `hanhTrinh.bai` (tầng từng bài theo cây Dạy học); (5) bật lại "Thử sức thêm" cho em chạy Hành trình.
// Hợp đồng + ngữ nghĩa: docs/hanh-trinh-bai-thu-suc-0910.md. D1 thật = node:sqlite (tests/_d1-that.ts), kho giả tests/omni-3-ke-hoach-chung.ts.
import { afterEach, describe, expect, it } from 'vitest'
import { dongBoBaHanhTrinh } from '../server/src/hanh-trinh-hop-nhat'
import { layKeHoachHomNay, qidGoc, sanh2, thuSucThem, xoaDemChienDich } from '../server/src/srs2-d1'
import { hoa2Action, startDao2 } from '../server/src/srs2-game'
import { xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { coLoThuSucHanhTrinh, mucNgayHanhTrinh, tangCuaCau, type BaiHanhTrinh } from '../server/src/hanh-trinh-ngay'
import { baiHanhTrinh, chonLoThem } from '../server/src/hanh-trinh-bai'
import type { CauSrs, TrangThaiCau } from '../server/src/srs2-loi'
import type { Env } from '../server/src/kieu'
import { taoKhoOmni, themChienDich, lam, lucVn, T_SANG, HOM_NAY, type KhoOmni } from './omni-3-ke-hoach-chung'

type D = KhoOmni['d']
const PHUT = 60_000
afterEach(() => { xoaDemChienDich(); xoaDemPhamVi(); xoaDemCaBaoVe() })

/** Tick bài (bai_da_day) và bài đứng trước (pham_vi_lop) của lớp 12A1 — thứ tự CHÈN cố ý lộn để kiểm sắp theo cây. */
function tick(d: D, khoa: string, ten: string, viTri: number, to: string[]) {
  d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)').run(`T-${khoa}`, '12A1', khoa, ten, viTri, JSON.stringify(to), '2026-10-01T00:00:00.000Z')
}
function truoc(d: D, khoa: string, ten: string, viTri: number, to: string[]) {
  d.sql.prepare('INSERT INTO pham_vi_lop(lop,khoa_bai,ten_bai,vi_tri,ma_de_json,nguon,cap_nhat_luc) VALUES(?,?,?,?,?,?,?)').run('12A1', khoa, ten, viTri, JSON.stringify(to), 'truoc', 'x')
}
/** Mọi câu của tờ về mức NB (tầng nền) — kho đủ lớn cho sàn 24 + các lô thêm. */
function veNen(d: D, maDe: string) {
  const rows = d.sql.prepare('SELECT qid,json FROM game_v2_question WHERE ma_de=?').all(maDe) as { qid: string; json: string }[]
  for (const r of rows) d.sql.prepare('UPDATE game_v2_question SET json=? WHERE qid=?').run(JSON.stringify({ ...JSON.parse(r.json), mucDo: 'NB' }), r.qid)
}
/** Em làm ĐÚNG mọi câu còn lại của kế hoạch hôm nay. */
async function lamHet(env: Env, nay: number): Promise<string[]> {
  const { kh } = await layKeHoachHomNay(env, 'S1', nay)
  const khoa = [...kh.conDoan, ...kh.conDao]
  for (const [i, k] of khoa.entries()) await lam(env, 'S1', qidGoc(k), nay + i, true)
  return khoa
}
const hang = (d: D) => d.sql.prepare("SELECT dao_json, doan_json, tong FROM srs2_ke_hoach WHERE sbd = 'S1' AND ngay = ?").get(HOM_NAY) as { dao_json: string; doan_json: string; tong: number }
const khoaCua = (d: D) => { const h = hang(d); return [...JSON.parse(h.dao_json), ...JSON.parse(h.doan_json)] as string[] }
const tss = async (env: Env, nay: number) => (await sanh2(env, 'S1', nay)).thuSucThem as { duoc: boolean; soCau: number }

/** Kho Thử sức: DH-B1 60 câu NB trong phạm vi (tick), DH-B3 12 câu NB NGOÀI phạm vi; Hành trình khối 12 đã gộp. */
async function khoThuSuc(): Promise<KhoOmni> {
  const k = taoKhoOmni({ 'DH-B0': 0, 'DH-B1': 60, 'DH-B2': 0, 'DH-B3': 12, 'KHO-A': 0 })
  veNen(k.d, 'DH-B1'); veNen(k.d, 'DH-B3')
  themChienDich(k.d, { id: 'nguon', maDe: ['DH-B1'], qids: k.qids('DH-B1'), sbd: ['S1', 'S2'], taoLuc: '2026-10-01T02:00:00Z', hanNop: '2026-10-09' })
  tick(k.d, 'B1', 'Bài 1. Este', 1, ['DH-B1'])
  await dongBoBaHanhTrinh(k.env, T_SANG)
  return k
}
/** Làm đủ sàn (24) + mở rương. */
async function duSanVaMoRuong(k: KhoOmni, nay: number) {
  const first = await layKeHoachHomNay(k.env, 'S1', nay)
  expect(first.kh.hanhTrinh).toMatchObject({ toiThieu: 24, daXep: 24 })
  await lamHet(k.env, nay + PHUT)
  expect(await hoa2Action(k.env, 'S1', 'hoa2-ruong-mo', {}, nay + 2 * PHUT)).toMatchObject({ ok: true })
  return first.kh
}

describe('(4) hanhTrinh.bai — tầng từng bài theo cây Dạy học', () => {
  it('mỗi bài thầy đã dạy, xếp theo vị trí trên cây, tên lưu sẵn; tangMo đúng cổng ≥ 80% của động cơ', async () => {
    const k = taoKhoOmni({ 'DH-B0': 8, 'DH-B1': 12, 'DH-B2': 10, 'DH-B3': 8, 'KHO-A': 0 })
    themChienDich(k.d, { id: 'nguon', maDe: ['DH-B0', 'DH-B1', 'DH-B2', 'DH-B3'], qids: [...k.qids('DH-B0'), ...k.qids('DH-B1'), ...k.qids('DH-B2'), ...k.qids('DH-B3')], sbd: ['S1'], taoLuc: '2026-10-01T02:00:00Z', hanNop: '2026-10-09' })
    // Chèn lộn thứ tự: tick bài 3 trước, rồi bài 2, bài 1 (đứng trước). DH-B3 không thuộc phạm vi.
    tick(k.d, 'B2', 'Bài 3. Ba', 3, ['DH-B2'])
    truoc(k.d, 'B1', 'Bài 2. Hai', 2, ['DH-B1'])
    truoc(k.d, 'B0', 'Bài 1. Một', 1, ['DH-B0'])
    // Bài 2: mọi nhóm nội dung tầng nền (NB: câu 0, 4, 8) vững (đúng hai ngày khác nhau) ⇒ mở tầng 2; tầng 2 (TH) chưa vững ⇒ dừng ở 2.
    for (const i of [0, 4, 8]) { await lam(k.env, 'S1', `DH-B1-${i}`, lucVn('2026-10-02'), true); await lam(k.env, 'S1', `DH-B1-${i}`, lucVn('2026-10-04'), true) }
    // Bài 3: chỉ 1/3 nhóm nền vững (< 80%) ⇒ vẫn tầng 1.
    for (const d of ['2026-10-02', '2026-10-04']) await lam(k.env, 'S1', 'DH-B2-0', lucVn(d), true)
    await dongBoBaHanhTrinh(k.env, T_SANG)
    const s = await sanh2(k.env, 'S1', T_SANG)
    const bai = (s.hanhTrinh as { bai?: BaiHanhTrinh[] }).bai
    expect(bai).toEqual([
      { khoa: 'B0', ten: 'Bài 1. Một', tangMo: 1, vung: null },
      { khoa: 'B1', ten: 'Bài 2. Hai', tangMo: 2, vung: null },
      { khoa: 'B2', ten: 'Bài 3. Ba', tangMo: 1, vung: null },
    ])
    // Không lộ mã nội bộ khác / ước lượng Thử sức (trường chỉ máy chủ).
    expect(Object.keys(s.hanhTrinh as object).sort()).toEqual(['bai', 'cauTrongChang', 'changHienTai', 'conThieu', 'daLam', 'daXep', 'soChang', 'tang', 'toiThieu'])
    expect(JSON.stringify(s)).not.toContain('thuSucHanhTrinh')
    k.d.sql.close()
  })

  it('vắng khi không phải Hành trình; Hành trình mà lớp chưa có phạm vi ⇒ không có `bai` (không bịa tên)', async () => {
    const k = taoKhoOmni({ 'DH-B0': 0, 'DH-B1': 12, 'DH-B2': 0, 'DH-B3': 0, 'KHO-A': 0 })
    themChienDich(k.d, { id: 'cd-thuong', maDe: ['DH-B1'], qids: k.qids('DH-B1'), sbd: ['S1'], taoLuc: '2026-10-01T02:00:00Z', hanNop: '2026-10-09' })
    tick(k.d, 'B1', 'Bài 1. Este', 1, ['DH-B1'])
    const thuong = await sanh2(k.env, 'S1', T_SANG)
    expect(thuong.ok).toBe(true)
    expect(thuong.hanhTrinh).toBeUndefined()
    k.d.sql.close()
    const k2 = taoKhoOmni({ 'DH-B0': 0, 'DH-B1': 12, 'DH-B2': 0, 'DH-B3': 0, 'KHO-A': 0 })
    themChienDich(k2.d, { id: 'nguon', maDe: ['DH-B1'], qids: k2.qids('DH-B1'), sbd: ['S1'], taoLuc: '2026-10-01T02:00:00Z', hanNop: '2026-10-09' })
    await dongBoBaHanhTrinh(k2.env, T_SANG)
    const ht = await sanh2(k2.env, 'S1', T_SANG)
    expect(ht.hanhTrinh).toMatchObject({ toiThieu: 24 })
    expect((ht.hanhTrinh as { bai?: unknown }).bai).toBeUndefined()
    k2.d.sql.close()
  })

  it('thuần: bài không có câu ứng viên ⇒ tầng 1; một bài lên tầng không kéo bài khác', () => {
    const c = (qid: string, mucDo: string): CauSrs => ({ qid, phan: 'I', mucDo, dang: null, nguon: 'chien_dich' })
    const cau = [c('a1', 'NB'), c('a2', 'NB'), c('a3', 'TH'), c('b1', 'NB'), c('b2', 'TH')]
    const maDe = new Map([['a1', 'X-B1-TN'], ['a2', 'X-B1'], ['a3', 'X-B1'], ['b1', 'X-B2'], ['b2', 'X-B2']])
    const vung = { laMoi: false, thanhThao: true } as TrangThaiCau
    const tt = new Map<string, TrangThaiCau>([['a1', vung], ['a2', vung]])
    const bai = { khoaBai: '', tenBai: '', viTri: 0 }
    const pv = { maDe: new Set(['X-B1', 'X-B2', 'X-B9']), baiTheoMaDe: new Map([['X-B1', { ...bai, khoaBai: 'k1', tenBai: 'Bài 1', viTri: 1 }], ['X-B2', { ...bai, khoaBai: 'k2', tenBai: 'Bài 2', viTri: 2 }], ['X-B9', { ...bai, khoaBai: 'k9', tenBai: 'Bài 9', viTri: 9 }]]), baiDaTick: [] }
    expect(baiHanhTrinh(pv, cau, (q) => maDe.get(q), tt, new Map())).toEqual([
      { khoa: 'k1', ten: 'Bài 1', tangMo: 2, vung: null }, { khoa: 'k2', ten: 'Bài 2', tangMo: 1, vung: null }, { khoa: 'k9', ten: 'Bài 9', tangMo: 1, vung: null },
    ])
    expect(baiHanhTrinh(null, cau, (q) => maDe.get(q), tt, new Map())).toBeNull()
  })
})

describe('(5) Thử sức thêm khi chạy Hành trình', () => {
  it('chưa đủ mức tối thiểu ⇒ không mở; đủ sàn + mở rương ⇒ một chặng 6 câu hợp lệ, không trùng, Đảo phát đúng lô', async () => {
    const k = await khoThuSuc()
    expect(await tss(k.env, T_SANG)).toEqual({ duoc: false, soCau: 0 })
    expect(await thuSucThem(k.env, 'S1', T_SANG)).toMatchObject({ ok: false, ma: 'chua_xong' })
    const san = await duSanVaMoRuong(k, T_SANG)
    // Em tự làm thêm một câu ngoài kế hoạch hôm nay (kênh luyện) ⇒ câu ấy không được vào lô.
    const ngoai = k.qids('DH-B1').find((q) => !san.dao.includes(q) && !san.doan.includes(q))!
    await lam(k.env, 'S1', ngoai, T_SANG + 3 * PHUT, true, { nguon: 'luyen', maNguon: 'luyen-x' })
    const nay = T_SANG + 4 * PHUT
    expect(await tss(k.env, nay)).toEqual({ duoc: true, soCau: 6 })
    const truocKhi = khoaCua(k.d)
    expect(await thuSucThem(k.env, 'S1', nay)).toEqual({ ok: true, them: 6 })
    const sau = khoaCua(k.d)
    const lo = sau.slice(truocKhi.length)
    expect(sau.slice(0, truocKhi.length).sort()).toEqual([...truocKhi].sort()) // phần đã làm giữ nguyên
    expect(lo).toHaveLength(6)
    const nhom = new Map((k.d.sql.prepare('SELECT qid, content_group g FROM game_v2_question').all() as { qid: string; g: string }[]).map((r) => [r.qid, r.g]))
    const daCo = new Set([...truocKhi.map(qidGoc), ngoai])
    for (const q of lo) {
      expect(q.startsWith('DH-B1-')).toBe(true) // đúng phạm vi đã dạy (DH-B3 ngoài phạm vi), đúng khối
      expect(q).not.toBe('DH-B1-TL') // không tự luận
      expect(daCo.has(q)).toBe(false) // không trùng câu đã xếp / đã làm hôm nay
      expect([...daCo].some((x) => nhom.get(x) === nhom.get(q))).toBe(false) // mỗi nội dung một lần/ngày
    }
    expect(new Set(lo.map((q) => nhom.get(q))).size).toBe(6)
    expect(hang(k.d).tong).toBe(sau.length)
    // Sảnh: còn đúng lô, sàn chốt đầu ngày không đổi; không bấm tiếp được tới khi làm xong; Đảo phát câu của lô.
    const s = await sanh2(k.env, 'S1', nay + 1)
    expect(s.theLuc).toEqual({ con: 6, tong: sau.length })
    expect(s.hanhTrinh).toMatchObject({ toiThieu: 24, tang: 1 })
    expect(s.thuSucThem).toEqual({ duoc: false, soCau: 0 })
    expect(await thuSucThem(k.env, 'S1', nay + 2)).toMatchObject({ ok: false, ma: 'chua_xong' })
    expect(k.d.sql.prepare('SELECT tang, toi_thieu FROM hanh_trinh_v3_ngay WHERE sbd=? AND ngay=?').get('S1', HOM_NAY)).toEqual({ tang: 1, toi_thieu: 24 })
    const dao = await startDao2(k.env, 'S1', nay + 3)
    const qs = (dao.questions as { qid: string }[]).map((q) => q.qid)
    expect(qs.length).toBeGreaterThan(0)
    for (const q of qs) expect(lo).toContain(q)
    k.d.sql.close()
  })

  it('lô thêm được GIỮ khi động cơ chọn lại sau lần sai mới; làm xong lô ⇒ mở lô tiếp, tới trần 2 × sàn thì dừng', async () => {
    const k = await khoThuSuc()
    await duSanVaMoRuong(k, T_SANG)
    let nay = T_SANG + 5 * PHUT
    expect(await thuSucThem(k.env, 'S1', nay)).toEqual({ ok: true, them: 6 })
    // Sai một câu của lô ⇒ động cơ tính lại phần chưa làm (luật "sai mới") — không được cắt lô về sàn 24.
    const { kh } = await layKeHoachHomNay(k.env, 'S1', nay + 1)
    await lam(k.env, 'S1', qidGoc(kh.conDao[0]!), nay + 2, false)
    const lai = await layKeHoachHomNay(k.env, 'S1', nay + PHUT)
    expect(lai.kh.tong).toBe(30)
    expect(lai.kh.conDao.length + lai.kh.conDoan.length).toBe(5)
    expect(lai.kh.hanhTrinh).toMatchObject({ toiThieu: 24, daXep: 30, daLam: 25, conThieu: 0 })
    // Bấm nhiều lần, mỗi lần một chặng, tới trần 48 câu.
    const loDaThay: number[] = []
    for (let lan = 0; lan < 6; lan++) {
      nay += 10 * PHUT
      await lamHet(k.env, nay)
      const t = await tss(k.env, nay + PHUT)
      if (!t.duoc) break
      const r = await thuSucThem(k.env, 'S1', nay + PHUT)
      expect(r).toMatchObject({ ok: true })
      loDaThay.push(Number(r.them))
    }
    expect(loDaThay).toEqual([6, 6, 6])
    expect(hang(k.d).tong).toBe(48)
    expect(await thuSucThem(k.env, 'S1', nay + 2 * PHUT)).toMatchObject({ ok: false, ma: 'du_tran' })
    // Sổ điểm / sàn ngày không đổi vì Thử sức thêm.
    expect(k.d.sql.prepare('SELECT tang, toi_thieu FROM hanh_trinh_v3_ngay WHERE sbd=? AND ngay=?').get('S1', HOM_NAY)).toEqual({ tang: 1, toi_thieu: 24 })
    k.d.sql.close()
  })

  it('hai máy bấm cùng lúc ⇒ chỉ MỘT lô vào kế hoạch', async () => {
    const k = await khoThuSuc()
    await duSanVaMoRuong(k, T_SANG)
    const nay = T_SANG + 5 * PHUT
    // D1 thật chạy từng lô (batch) nguyên tử, lần lượt; node:sqlite giả không lồng được BEGIN ⇒ xếp hàng lô, mọi lệnh khác vẫn xen kẽ như hai máy.
    const db = k.env.DB as unknown as { batch: (ds: unknown[]) => Promise<unknown[]> }
    let hangLo: Promise<unknown> = Promise.resolve()
    const DB = { ...db, batch: (ds: unknown[]) => { const p = hangLo.then(() => db.batch(ds)); hangLo = p.catch(() => undefined); return p }, withSession: () => DB }
    const env = { ...k.env, DB } as unknown as Env
    const [a, b] = await Promise.all([thuSucThem(env, 'S1', nay), thuSucThem(env, 'S1', nay)])
    expect([a, b].filter((r) => r.them === 6)).toHaveLength(1)
    // Máy thua: hoặc thấy kế hoạch vừa đổi lúc ghi (so-khớp hỏng ⇒ tải lại Sảnh), hoặc đọc sau khi lô đã vào (còn câu chưa làm).
    const thua = [a, b].find((r) => r.them !== 6)!
    expect(thua.lapLai === true && thua.them === 0 || thua.ma === 'chua_xong').toBe(true)
    expect(Number(a.them ?? 0) + Number(b.them ?? 0)).toBe(6)
    expect(hang(k.d).tong).toBe(30)
    expect(new Set(khoaCua(k.d).map(qidGoc)).size).toBe(30)
    k.d.sql.close()
  })

  it('máy khác đổi kế hoạch giữa lúc chọn và lúc ghi ⇒ không ghi đè, trả lapLai', async () => {
    const k = await khoThuSuc()
    await duSanVaMoRuong(k, T_SANG)
    const cu = hang(k.d)
    const daoKhac = JSON.stringify([...JSON.parse(cu.dao_json), 'DH-B1-59'])
    const db = k.env.DB as unknown as { prepare: (q: string) => unknown }
    let daDoi = false
    const DB = { ...db, prepare: (q: string) => {
      if (!daDoi && q === 'SELECT dao_json, doan_json FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?') {
        daDoi = true
        k.d.sql.prepare("UPDATE srs2_ke_hoach SET dao_json=?, tong=tong+1 WHERE sbd='S1' AND ngay=?").run(daoKhac, HOM_NAY)
      }
      return db.prepare(q)
    }, withSession: () => DB }
    expect(await thuSucThem({ ...k.env, DB } as unknown as Env, 'S1', T_SANG + 5 * PHUT)).toEqual({ ok: true, them: 0, lapLai: true })
    expect(daDoi).toBe(true)
    expect(hang(k.d)).toEqual({ dao_json: daoKhac, doan_json: cu.doan_json, tong: cu.tong + 1 })
    k.d.sql.close()
  })

  it('chưa mở rương ⇒ chưa cho (lô thêm không khoá lại rương); không phải Hành trình ⇒ luật cũ giữ nguyên', async () => {
    const k = await khoThuSuc()
    await layKeHoachHomNay(k.env, 'S1', T_SANG)
    await lamHet(k.env, T_SANG + PHUT)
    expect(await tss(k.env, T_SANG + 2 * PHUT)).toEqual({ duoc: false, soCau: 0 })
    expect(await thuSucThem(k.env, 'S1', T_SANG + 2 * PHUT)).toMatchObject({ ok: false, ma: 'chua_mo_ruong' })
    k.d.sql.close()
  })

  it('thuần: lô thêm bỏ câu bảo vệ (qid lẫn nhóm), tự luận, ngoài phạm vi, nhóm đã có, tầng chưa mở, ôn chưa đến hạn', () => {
    const c = (qid: string, mucDo = 'NB'): CauSrs => ({ qid, phan: 'I', mucDo, dang: null, nguon: 'chien_dich' })
    const moi = { laMoi: true, thanhThao: false } as TrangThaiCau
    const ds = ['ok1', 'ok2', 'bv', 'bvNhom', 'tl', 'ngoai', 'cungNhom', 'th', 'onSom']
    const cau = [...ds.filter((q) => q !== 'th').map((q) => c(q)), c('th', 'TH')]
    const tt = new Map<string, TrangThaiCau>(ds.map((q) => [q, moi]))
    tt.set('onSom', { laMoi: false, thanhThao: true, henOn: '2026-10-09' } as TrangThaiCau)
    const nhom = new Map(ds.map((q) => [q, `g-${q}`]))
    nhom.set('cungNhom', 'g-da'); nhom.set('daXep', 'g-da'); nhom.set('bvNhom', 'g-bv')
    const lo = chonLoThem({ ngay: HOM_NAY, tang: 1, daCo: ['daXep'], soCau: 6, cau, tt, nhom, chan: new Set(['bv', 'g-bv']), tangSanSang: new Map(ds.map((q) => [q, 1 as const])),
      phamVi: new Set(['X-B1']), maDeCua: (q) => (q === 'ngoai' ? 'X-B9' : 'X-B1-TN'), tuLuan: (q) => q === 'tl' })
    expect([...lo.dao, ...lo.doan].sort()).toEqual(['ok1', 'ok2'])
    expect(tangCuaCau(c('th', 'TH'))).toBe(2)
    expect(chonLoThem({ ngay: HOM_NAY, tang: 1, daCo: [], soCau: 0, cau, tt, nhom, chan: new Set(), tangSanSang: new Map(), maDeCua: () => 'X-B1', tuLuan: () => false })).toEqual({ dao: [], doan: [] })
    // Trần: một chặng, tổng ≤ 2 × sàn; khi chọn lại giữ phần đã lấy thêm.
    expect(coLoThuSucHanhTrinh(24, 24)).toBe(6)
    expect(coLoThuSucHanhTrinh(24, 45)).toBe(3)
    expect(coLoThuSucHanhTrinh(36, 72)).toBe(0)
    expect(mucNgayHanhTrinh(24, 18)).toBe(24)
    expect(mucNgayHanhTrinh(24, 30)).toBe(30)
    expect(mucNgayHanhTrinh(24, 90)).toBe(48)
  })
})

describe('hoa2-sanh giữ chi phí mở lại khi có nguồn dự phòng', () => {
  it('mở lại và sau đủ sàn không thêm lệnh; lần đầu chỉ thêm tối đa hai lệnh chuẩn bị nguồn', async () => {
    const k = await khoThuSuc()
    const dem = async (nay: number) => { const truoc = k.d.soLenh.prepare; await sanh2(k.env, 'S1', nay); return k.d.soLenh.prepare - truoc }
    const dau = await dem(T_SANG)
    const moLai = await dem(T_SANG + 1000)
    await lamHet(k.env, T_SANG + PHUT)
    await sanh2(k.env, 'S1', T_SANG + 2 * PHUT) // chọn lại sau chặng (động cơ chạy)
    const sauSan = await dem(T_SANG + 2 * PHUT + 1000)
    // Bảng chỉ-thêm và biên nhận nguồn là chi phí lạnh; đọc nguồn được gộp vào truy vấn có sẵn.
    expect(dau).toBeLessThanOrEqual(SO_LENH_SANH.dau + 2)
    expect({ moLai, sauSan }).toEqual({moLai:SO_LENH_SANH.moLai,sauSan:SO_LENH_SANH.sauSan})
    k.d.sql.close()
  })
})
// Đo trên bản TRƯỚC khi thêm `bai` / Thử sức thêm Hành trình (69a0731) với cùng kịch bản.
// Gộp main 113000a (tối ưu CPU: không dựng lại tầng theo bài khi đã có dòng chốt tầng) ⇒ mở lại / sau đủ sàn còn 30 lệnh (trước 36).
// Gộp main #217 (Hành trình v6: bảng chọn v6, chẩn đoán, kiểm đầu/tuần) ⇒ đo lại 09/10 12:20: cùng kịch bản chạy RIÊNG một tệp cho 151/38/38 trên CẢ main 4346618
// lẫn nhánh này (phần thêm `bai` / Thử sức thêm = 0 lệnh); trong tệp này lượt đầu ngày +1 lệnh do đệm mô-đun còn từ test chạy trước.
const SO_LENH_SANH = { dau: 152, moLai: 38, sauSan: 38 }
