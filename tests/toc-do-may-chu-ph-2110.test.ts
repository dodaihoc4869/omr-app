// @vitest-environment node
// CỔNG TỐC ĐỘ MÁY CHỦ CHO CỔNG PHỤ HUYNH (thầy 21/10: "tối ưu tốc độ phản hồi mọi chỗ"; luật thầy 13/10: sửa xong tốc độ máy chủ phải nhanh hơn).
// Cổng cũ `toc-do-may-chu-lenh-nong-1310` chỉ đo bốn lệnh `/game-v2/` của học sinh — lệnh `/ph/*` (mở app phụ huynh = 6 lệnh song song, rồi 5 lệnh mỗi nhịp
// 180 s) chưa ai bảo vệ. Cùng cách đo: số ĐỢT CHỜ D1 NỐI TIẾP + tổng số lệnh D1 trên đường trả lời, đi qua đúng cửa thật `worker.fetch`; việc phụ sau phản hồi
// (`ctx.waitUntil`: ghi truy cập) không tính. Mốc ở `docs/moc-toc-do.json` mục `mayChuPh` (tách khỏi `mayChu` để cổng cũ không đòi số đo của lệnh `/ph`); vượt mốc ⇒ ĐỎ; thấp hơn ⇒ xanh + gợi ý hạ mốc (CHỈ HẠ).
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import worker from '../server/src/index'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { gameToken, parentPass } from '../server/src/game-v2-auth'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-12T13:30:00Z') // 20:30 giờ VN — giờ cao điểm
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })

type Lenh = { first?: unknown; all?: unknown; run?: unknown; bind?: unknown }
/** Bọc D1 đếm đợt: mỗi lần chạy (first/all/run/batch) xếp hàng; `chay` trả cả hàng khi mã đã rảnh (một đợt). Giống cổng cũ để hai cổng cùng thước đo. */
function boDemDot(goc: Env['DB']) {
  const hang: (() => void)[] = []
  const nhanHang: string[] = [] // chỉ để in khi IN_SQL_DOT=1: SQL của từng lệnh trong đợt
  const that = new WeakMap<object, unknown>()
  const sqlCua = new WeakMap<object, string>()
  let lan = 0
  const cho = <T,>(f: () => Promise<T>, nhan = '') => new Promise<T>((ok, loi) => { lan++; nhanHang.push(nhan); hang.push(() => { f().then(ok, loi) }) })
  const boc = (st: Lenh & object, q = ''): unknown => {
    const b = {
      bind: (...a: unknown[]) => boc((st.bind as (...x: unknown[]) => Lenh & object)(...a), q),
      first: (...a: unknown[]) => cho(() => (st.first as (...x: unknown[]) => Promise<unknown>)(...a), q),
      all: () => cho(() => (st.all as () => Promise<unknown>)(), q),
      run: () => cho(() => (st.run as () => Promise<unknown>)(), q),
      raw: (...a: unknown[]) => cho(() => ((st as { raw: (...x: unknown[]) => Promise<unknown> }).raw)(...a), q),
    }
    that.set(b, st)
    sqlCua.set(b, q)
    return b
  }
  const g = goc as unknown as { prepare(q: string): Lenh & object; batch(ds: unknown[]): Promise<unknown> }
  const db: Record<string, unknown> = {
    prepare: (q: string) => boc(g.prepare(q), q),
    batch: (ds: object[]) => cho(() => g.batch(ds.map((x) => that.get(x) ?? x)), `BATCH[${ds.map((x) => (sqlCua.get(x) ?? '?').replace(/\s+/g, ' ').slice(0, 50)).join(' ; ')}]`),
  }
  db.withSession = () => db
  const raNgoai = () => new Promise<void>((r) => setImmediate(r))
  async function chay<T>(viec: () => Promise<T>, viecPhu: Promise<unknown>[]): Promise<{ kq: T; dot: number; lenh: number }> {
    let xong = false, dot = 0
    const lan0 = lan
    const p = viec().finally(() => { xong = true })
    p.catch(() => {})
    for (;;) {
      await raNgoai()
      if (xong) break
      if (hang.length) {
        dot++
        if (process.env.IN_SQL_DOT) console.info(`đợt ${dot}: ${nhanHang.splice(0).map((x) => x.replace(/\s+/g, ' ').slice(0, 90)).join('  ||  ')}`)
        else nhanHang.splice(0)
        for (const f of hang.splice(0)) f()
      }
    }
    const lenh = lan - lan0 - hang.length
    let phuXong = false
    const phu = Promise.allSettled(viecPhu).finally(() => { phuXong = true })
    for (let i = 0; i < 10_000 && !(phuXong && !hang.length); i++) { await raNgoai(); nhanHang.splice(0); for (const f of hang.splice(0)) f() } // xả thầm: xoá cả nhãn để lần in sau không mang nhãn cũ
    await phu
    return { kq: await p, dot, lenh }
  }
  return { db: db as unknown as Env['DB'], chay }
}

/** Em thật giờ cao điểm: lớp 12 · Bài 8 (24 câu) · gói bài 7 bật · một đợt hành trình · đã làm vài câu (có sổ học, có câu sai) · có mật khẩu (token PH mang `pk`). */
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
  const bo = boDemDot(k.env.DB)
  const env = { ...k.env, DB: bo.db } as Env
  return { env, bo, token: await gameToken(k.env, 'S1'), pass: await parentPass(k.env, 'S1') }
}

async function goiRaw(k: Awaited<ReturnType<typeof kho>>, duong: string, than: Record<string, unknown>) {
  if (process.env.IN_SQL_DOT) console.info(`>>> ${duong}`)
  const viecPhu: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { viecPhu.push(p) }, passThroughOnException() {} }
  return k.bo.chay(async () => {
    const res = await worker.fetch(new Request(`https://test${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(than) }), k.env, ctx as never)
    return (await res.json()) as Record<string, unknown>
  }, viecPhu)
}

const MOC = path.resolve(__dirname, '../docs/moc-toc-do.json')
const LENH_PH: [string, string][] = [
  ['ph-tat-ca-ve-con', '/ph/tat-ca-ve-con'],
  ['ph-hoc-2', '/ph/hoc-2'],
  ['ph-con-tong-quan', '/ph/con-tong-quan'],
  ['ph-loi-thay', '/ph/loi-thay'],
  ['ph-nhip-hoc', '/ph/nhip-hoc'],
  ['ph-xac-dinh', '/ph/xac-dinh'],
]

it('lệnh mở app phụ huynh: số đợt chờ D1 không vượt mốc bản trước', async () => {
  const k = await kho()
  // Em làm vài câu trước (không đo) để các lệnh đọc có sổ học thật: mở chặng + nộp một câu sai.
  const dem = async (lenh: string, than: Record<string, unknown>) => (await goiRaw(k, `/game-v2/${lenh}`, { ...than, token: k.token })).kq
  const s = await dem('hoc-tap-start', {})
  const cau = (s.questions as { qid: string; phan: string }[])[0]!
  vi.setSystemTime(NOW + 60_000)
  await dem('answer', { session: s.id, qid: cau.qid, answer: cau.phan === 'I' ? 'A' : cau.phan === 'II' ? 'DSDD' : '4', assisted: false, msLam: 30_000 })
  vi.setSystemTime(NOW + 3_600_000)

  const do_: Record<string, { dot: number; lenh: number }> = {}
  for (const [ten, duong] of LENH_PH) {
    const r = await goiRaw(k, duong, { pass: k.pass })
    expect(r.kq.ok, `${ten}: ${JSON.stringify(r.kq).slice(0, 240)}`).toBe(true)
    do_[ten] = { dot: r.dot, lenh: r.lenh }
  }
  if (process.env.GHI_MOC_TOC_DO) fs.writeFileSync(process.env.GHI_MOC_TOC_DO, JSON.stringify(do_, null, 1))
  const moc = JSON.parse(fs.readFileSync(MOC, 'utf8')) as { mayChuPh: Record<string, { dot: number; lenh: number }> }
  const vuot: string[] = [], ha: string[] = [], thieuMoc: string[] = []
  for (const ten of Object.keys(do_)) {
    const m = moc.mayChuPh[ten], d = do_[ten]!
    if (!m) { thieuMoc.push(`${ten}: ${d.dot} đợt / ${d.lenh} lệnh`); continue }
    if (d.dot > m.dot) vuot.push(`${ten}: ${d.dot} đợt (mốc ${m.dot})`)
    if (d.lenh > m.lenh) vuot.push(`${ten}: ${d.lenh} lệnh D1 (mốc ${m.lenh})`)
    if (d.dot < m.dot || d.lenh < m.lenh) ha.push(`${ten}: ${d.dot} đợt / ${d.lenh} lệnh (mốc ${m.dot} / ${m.lenh})`)
  }
  if (thieuMoc.length) console.info(`Chưa có mốc — thêm vào docs/moc-toc-do.json mục mayChuPh:\n  ${thieuMoc.join('\n  ')}`)
  if (ha.length) console.info(`Nhanh hơn mốc — hạ mốc trong docs/moc-toc-do.json:\n  ${ha.join('\n  ')}`)
  expect(vuot, 'CHẬM HƠN bản trước — làm lại cho nhanh bằng/hơn rồi mới đẩy').toEqual([])
})
