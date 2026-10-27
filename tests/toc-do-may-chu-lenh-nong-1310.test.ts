// @vitest-environment node
// LUẬT THƯỜNG TRỰC (thầy 13/10): "Khi bạn sửa bất kì cái gì thì luôn phải đảm bảo sau khi sửa xong tốc độ load app và tốc độ máy chủ phải nhanh hơn".
// Cổng MÁY CHỦ: đo số ĐỢT CHỜ D1 NỐI TIẾP (mỗi đợt = một lượt đi-về D1, các lệnh chạy song song trong cùng đợt tính một) trên đường trả lời của bốn lệnh
// nóng của học sinh, đi qua đúng cửa thật `worker.fetch` — Sảnh, Mở chặng, Nộp câu, Đếm hôm nay. Con số tất định (không phụ thuộc máy chạy test):
// bộ bọc D1 giữ mọi lệnh lại, chờ mã chạy hết phần tính toán, rồi trả CẢ hàng một lúc = một đợt. Việc phụ sau phản hồi (`ctx.waitUntil`) không tính.
// Mốc lưu ở `docs/moc-toc-do.json` (đo trên bản đang chạy thật trước khi sửa). Vượt mốc ⇒ ĐỎ: phải làm lại cho nhanh bằng/hơn trước rồi mới được đẩy.
// Thấp hơn mốc ⇒ xanh và in gợi ý hạ mốc (mốc chỉ được HẠ, không được nâng).
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import worker from '../server/src/index'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_SAN_SANG } from '../server/src/san-sang'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { gameToken } from '../server/src/game-v2-auth'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-12T13:30:00Z') // 20:30 giờ VN — giờ cao điểm
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })

type Lenh = { first?: unknown; all?: unknown; run?: unknown; bind?: unknown }
/** Bọc D1 đếm đợt: mỗi lần chạy (first/all/run/batch) xếp hàng; `chay` trả cả hàng khi mã đã rảnh (một đợt). */
function boDemDot(goc: Env['DB']) {
  const hang: (() => void)[] = []
  const that = new WeakMap<object, unknown>()
  let lan = 0
  const cho = <T,>(f: () => Promise<T>) => new Promise<T>((ok, loi) => { lan++; hang.push(() => { f().then(ok, loi) }) })
  const boc = (st: Lenh & object): unknown => {
    const b = {
      bind: (...a: unknown[]) => boc((st.bind as (...x: unknown[]) => Lenh & object)(...a)),
      first: (...a: unknown[]) => cho(() => (st.first as (...x: unknown[]) => Promise<unknown>)(...a)),
      all: () => cho(() => (st.all as () => Promise<unknown>)()),
      run: () => cho(() => (st.run as () => Promise<unknown>)()),
      raw: (...a: unknown[]) => cho(() => ((st as { raw: (...x: unknown[]) => Promise<unknown> }).raw)(...a)),
    }
    that.set(b, st)
    return b
  }
  const g = goc as unknown as { prepare(q: string): Lenh & object; batch(ds: unknown[]): Promise<unknown> }
  const db: Record<string, unknown> = {
    prepare: (q: string) => boc(g.prepare(q)),
    batch: (ds: object[]) => cho(() => g.batch(ds.map((x) => that.get(x) ?? x))),
  }
  db.withSession = () => db
  const raNgoai = () => new Promise<void>((r) => setImmediate(r))
  /** Chạy `viec` tới khi có phản hồi; trả số đợt chờ D1 nối tiếp và tổng số lệnh D1 trên đường trả lời. Sau đó xả hết việc phụ (không tính). */
  async function chay<T>(viec: () => Promise<T>, viecPhu: Promise<unknown>[]): Promise<{ kq: T; dot: number; lenh: number }> {
    let xong = false, dot = 0
    const lan0 = lan
    const p = viec().finally(() => { xong = true })
    p.catch(() => {})
    for (;;) {
      await raNgoai()
      if (xong) break
      if (hang.length) { dot++; for (const f of hang.splice(0)) f() }
    }
    const lenh = lan - lan0 - hang.length
    let phuXong = false
    const phu = Promise.allSettled(viecPhu).finally(() => { phuXong = true })
    for (let i = 0; i < 10_000 && !(phuXong && !hang.length); i++) { await raNgoai(); for (const f of hang.splice(0)) f() }
    await phu
    return { kq: await p, dot, lenh }
  }
  return { db: db as unknown as Env['DB'], chay }
}

/** Kho như học sinh thật giờ cao điểm: lớp 12 · Bài 8 (24 câu) vừa tick · gói bài 7 bật · một đợt hành trình. */
async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  for (const q of SQL_SAN_SANG) k.d.sql.exec(q) // bảng bản sẵn (san-sang.ts) có sẵn như bản sống
  k.d.sql.exec('CREATE TABLE IF NOT EXISTS chien_dich_em (chien_dich_id TEXT NOT NULL, sbd TEXT NOT NULL, them_luc TEXT, bot_luc TEXT, PRIMARY KEY (chien_dich_id, sbd))') // có ở bản sống
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
  const bo = boDemDot(k.env.DB)
  const env = { ...k.env, DB: bo.db } as Env
  return { env, bo, token: await gameToken(k.env, 'S1') }
}

async function goi(k: Awaited<ReturnType<typeof kho>>, lenh: string, than: Record<string, unknown>) {
  const viecPhu: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { viecPhu.push(p) }, passThroughOnException() {} }
  const r = await k.bo.chay(async () => {
    const res = await worker.fetch(new Request(`https://test/game-v2/${lenh}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, token: k.token }) }), k.env, ctx as never)
    return (await res.json()) as Record<string, unknown>
  }, viecPhu)
  return r
}

const MOC = path.resolve(__dirname, '../docs/moc-toc-do.json')

it('bốn lệnh nóng của học sinh: số đợt chờ D1 không vượt mốc bản trước', async () => {
  const k = await kho()
  const do_: Record<string, { dot: number; lenh: number }> = {}
  const ghi = (ten: string, r: { kq: Record<string, unknown>; dot: number; lenh: number }) => { expect(r.kq.ok, `${ten}: ${JSON.stringify(r.kq).slice(0, 200)}`).toBe(true); do_[ten] = { dot: r.dot, lenh: r.lenh } }
  ghi('sanh-lan-dau', await goi(k, 'hoc-tap-sanh', {}))
  vi.setSystemTime(NOW + 20_000)
  ghi('sanh-lan-sau', await goi(k, 'hoc-tap-sanh', {}))
  vi.setSystemTime(NOW + 40_000)
  const s = await goi(k, 'hoc-tap-start', {})
  ghi('mo-chang', s)
  const cau = (s.kq.questions as { qid: string; phan: string }[])[0]!
  const tra = cau.phan === 'I' ? 'A' : cau.phan === 'II' ? 'DSDD' : '4' // một câu sai (đường ghi đủ: ghi lỗi để sửa)
  vi.setSystemTime(NOW + 100_000)
  ghi('nop-cau', await goi(k, 'answer', { session: s.kq.id, qid: cau.qid, answer: tra, assisted: false, msLam: 30_000 }))
  vi.setSystemTime(NOW + 101_000)
  ghi('dem-hom-nay', await goi(k, 'hoc-tap-dem', {}))
  const moc = JSON.parse(fs.readFileSync(MOC, 'utf8')) as { mayChu: Record<string, { dot: number; lenh: number }> }
  if (process.env.GHI_MOC_TOC_DO) fs.writeFileSync(process.env.GHI_MOC_TOC_DO, JSON.stringify(do_, null, 1))
  const vuot: string[] = [], ha: string[] = []
  for (const [ten, m] of Object.entries(moc.mayChu)) {
    const d = do_[ten]
    expect(d, `thiếu số đo ${ten}`).toBeTruthy()
    if (d!.dot > m.dot) vuot.push(`${ten}: ${d!.dot} đợt (mốc ${m.dot})`)
    if (d!.lenh > m.lenh) vuot.push(`${ten}: ${d!.lenh} lệnh D1 (mốc ${m.lenh})`)
    if (d!.dot < m.dot || d!.lenh < m.lenh) ha.push(`${ten}: ${d!.dot} đợt / ${d!.lenh} lệnh (mốc ${m.dot} / ${m.lenh})`)
  }
  if (ha.length) console.info(`Nhanh hơn mốc — hạ mốc trong docs/moc-toc-do.json:\n  ${ha.join('\n  ')}`)
  expect(vuot, 'CHẬM HƠN bản trước — làm lại cho nhanh bằng/hơn rồi mới đẩy').toEqual([])
})
