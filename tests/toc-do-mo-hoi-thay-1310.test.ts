// @vitest-environment node
// TỐC ĐỘ MỞ HỘP HỎI THẦY (thầy 13/10: "Tốc độ bấm vào hỏi thầy hơi chậm tối ưu lại tốc độ nhanh nhất"): đếm số ĐỢT CHỜ D1 NỐI TIẾP
// của `/hs/hoi-thay` (mỗi đợt = một lượt đi-về D1; các lệnh chạy song song trong cùng đợt tính một) — cùng cách đếm với
// tests/toc-do-may-chu-lenh-nong-1310.test.ts. "Lần đầu": máy chủ vừa thức (bảng DDL, cấu hình chưa đệm); "lần sau": như học sinh bấm
// câu kế tiếp (đệm 30–60 s đã có). Bản trước khi sửa (main 4f1c5f89, đo 13/10): có hồ sơ 12 / 6 đợt, đang làm (chiHoi) 8 / 3 đợt. MỐC CHỈ HẠ.
import { expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import type { Env } from '../server/src/kieu'

const MOC = { coHoSo: [5, 2], chiHoi: [4, 2] }

type Lenh = { first?: unknown; all?: unknown; run?: unknown; bind?: unknown }
/** Bọc D1 đếm đợt: mỗi lần chạy (first/all/run/batch) xếp hàng; `chay` thả cả hàng khi mã đã rảnh (một đợt). */
function boDemDot(goc: Env['DB']) {
  const hang: (() => void)[] = []
  const that = new WeakMap<object, unknown>()
  const cho = <T,>(f: () => Promise<T>) => new Promise<T>((ok, loi) => { hang.push(() => { f().then(ok, loi) }) })
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
    exec: (q: string) => cho(() => (goc as unknown as { exec(q: string): Promise<unknown> }).exec(q)),
  }
  db.withSession = () => db
  const raNgoai = () => new Promise<void>((r) => setImmediate(r))
  async function chay<T>(viec: () => Promise<T>, viecPhu: Promise<unknown>[]): Promise<{ kq: T; dot: number }> {
    let xong = false, dot = 0
    const p = viec().finally(() => { xong = true })
    p.catch(() => {})
    for (;;) {
      await raNgoai()
      if (xong) break
      if (hang.length) { dot++; for (const f of hang.splice(0)) f() }
    }
    let phuXong = false
    const phu = Promise.allSettled(viecPhu).finally(() => { phuXong = true })
    for (let i = 0; i < 10_000 && !(phuXong && !hang.length); i++) { await raNgoai(); for (const f of hang.splice(0)) f() }
    await phu
    return { kq: await p, dot }
  }
  return { db: db as unknown as Env['DB'], chay }
}

const GOC = path.resolve(__dirname, '..')
const MAU = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json'), 'utf8')) as Record<string, { cau: Record<string, unknown> }>
const RA2 = path.join(GOC, 'docs/loi-giai-a/chay-thu-2/ra')
const DE = '12-THU-TD'
const Q_DS = `${DE}-II-4`
const thay = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b, true)

async function chuanBi() {
  const d = taoD1That()
  ;(d.env as { GEMINI_API_KEY?: string }).GEMINI_API_KEY = 'khoa-thu'
  await thay(d, '/kho/day', { maDe: DE, lop: '12', de: { cau: [{ ...MAU['12-KT-C1-D4-II-4']!.cau, so: 4 }] }, cau: [] })
  const l = await thay(d, '/kho/loi-giai/viec', { so: 5 })
  for (const v of l.viec as { qid: string; bam: string }[]) {
    const { canThayChot: _c, de: _de, ...h } = JSON.parse(fs.readFileSync(path.join(RA2, '04-12-KT-C1-D4-II-4.json'), 'utf8'))
    expect(await thay(d, '/kho/loi-giai/nop', { qid: v.qid, bam: v.bam, hoSo: { ...h, qid: v.qid, bam: v.bam, co: [] } })).toMatchObject({ ok: true })
  }
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S-TD','Thử','12','mk','x')").run()
  return { d, token: await gameToken(d.env, 'S-TD') }
}

async function doMo(than: Record<string, unknown>) {
  const { d, token } = await chuanBi()
  const bo = boDemDot(d.env.DB)
  const env = { ...d.env, DB: bo.db } as Env
  const mot = () => {
    const viecPhu: Promise<unknown>[] = []
    const ctx = { waitUntil: (p: Promise<unknown>) => { viecPhu.push(p) }, passThroughOnException() {} }
    return bo.chay(async () => {
      const res = await worker.fetch(new Request('https://test/hs/hoi-thay', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, token }) }), env, ctx as never)
      return (await res.json()) as Record<string, unknown>
    }, viecPhu)
  }
  await import('../server/src/hoi-tro-ly') // trên Worker thật mảnh này nằm sẵn trong gói; ở đây nạp trước để không đếm thời gian dịch mã
  return [await mot(), await mot()] as const
}

it('mở hộp Hỏi thầy (câu có lời giải từng bước) — số đợt chờ D1 không vượt mốc', async () => {
  const [dau, sau] = await doMo({ qid: Q_DS, nguon: 'luyen' })
  for (const r of [dau, sau]) expect(r.kq).toMatchObject({ ok: true, coLoiGiai: true, hoiThem: true })
  console.info(`mở Hỏi thầy (có hồ sơ): lần đầu ${dau.dot} đợt, lần sau ${sau.dot} đợt (mốc ${MOC.coHoSo.join(' / ')})`)
  expect([dau.dot, sau.dot]).toEqual([Math.min(dau.dot, MOC.coHoSo[0]!), Math.min(sau.dot, MOC.coHoSo[1]!)])
})

it('mở hộp Hỏi thầy lúc em ĐANG LÀM (chiHoi) — số đợt chờ D1 không vượt mốc', async () => {
  const [dau, sau] = await doMo({ qid: Q_DS, nguon: 'luyen', chiHoi: true })
  for (const r of [dau, sau]) expect(r.kq).toMatchObject({ ok: true, chiHoi: true, hoiThem: true })
  console.info(`mở Hỏi thầy (đang làm): lần đầu ${dau.dot} đợt, lần sau ${sau.dot} đợt (mốc ${MOC.chiHoi.join(' / ')})`)
  expect([dau.dot, sau.dot]).toEqual([Math.min(dau.dot, MOC.chiHoi[0]!), Math.min(sau.dot, MOC.chiHoi[1]!)])
})
