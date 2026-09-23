// @vitest-environment node
// P05 mục 4 + SỬA RV01/RV02 (rà soát độc lập 01) — GIỮ CHỖ THEO ĐƠN VỊ NỘI DUNG + TÁCH LIFECYCLE.
//
// RUNTIME CỦA BỘ KIỂM NÀY: `node:sqlite` TRONG BỘ NHỚ (không phải Cloudflare D1, không phải workerd).
// Vì vậy nó chứng minh ĐÚNG hình dạng bảng + luật SQL/CAS ở tầng câu lệnh, KHÔNG chứng minh runtime D1 hay
// tải thật (RV06). Để kiểm interleaving, bộ kiểm bọc `env.DB` bằng một lớp `await` trước MỖI câu lệnh để hai
// luồng giữ chỗ xen kẽ nhau thật sự (không chỉ `Promise.all` trên hai promise đã chạy xong).
import { describe, expect, it } from 'vitest'
import { docCho, docMotCho, docTheoNhom, giuCho, nhaCho, HAN_GIU_CHO_GIAY, HAN_TASK_GIAY } from '../server/src/giu-cho'
import { taoD1That, type D1That } from './_d1-that'
import type { Env } from '../server/src/kieu'

const NGAY = '2026-09-23'
const T0 = Date.parse('2026-09-23T12:00:00+07:00')
const dung = (): D1That => taoD1That()

/** Bọc `env.DB` để NHƯỜNG luồng trước mỗi câu lệnh ⇒ hai lời gọi giữ chỗ xen kẽ nhau thật. */
function dbXenKe(env: Env): Env {
  const DB = {
    prepare(sql: string) {
      const st = env.DB.prepare(sql) as unknown as Record<string, unknown>
      const chay = <T>(f: () => Promise<T>): Promise<T> => new Promise<T>((res, rej) => setImmediate(() => f().then(res, rej)))
      const boc = (o: Record<string, unknown>): Record<string, unknown> => ({
        ...o,
        bind: (...a: unknown[]) => boc((o.bind as (...x: unknown[]) => unknown)(...a) as Record<string, unknown>),
        run: () => chay(() => (o.run as () => Promise<unknown>)()),
        first: () => chay(() => (o.first as () => Promise<unknown>)()),
        all: () => chay(() => (o.all as () => Promise<unknown>)()),
      })
      return boc(st) as unknown as ReturnType<Env['DB']['prepare']>
    },
  }
  return { ...env, DB } as Env
}


describe('P05/RV01 — giữ chỗ theo ĐƠN VỊ NỘI DUNG (`content_group`), không theo qid [node:sqlite, KHÔNG phải D1]', () => {
  it('hai qid KHÁC nhau cùng `content_group`, khác kênh: task cũ CÒN MỞ ⇒ chỉ nó giữ đơn vị', async () => {
    const d = dung()
    const nhom = new Map([['Q-original', 'CG-shared'], ['Q-copy', 'CG-shared']])
    const a = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'TASK-A', qids: ['Q-original'], nowMs: T0, nguon: 'game', nhomTheoQid: nhom, hanTaskGiay: 7200 })
    expect(a.thang).toEqual(['Q-original'])
    // Kênh khác (btvn), qid BẢN SAO khác — vẫn cùng đơn vị nội dung ⇒ KHÔNG dành được.
    const b = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'TASK-B', qids: ['Q-copy'], nowMs: T0, nguon: 'btvn', nhomTheoQid: nhom, hanTaskGiay: 7200 })
    expect(b.thang).toEqual([])
    expect(b.thua).toEqual(['Q-copy'])
    expect(b.dangMo.get('Q-copy')).toBe('TASK-A') // trả lại nhiệm vụ đang mở (RV02)
    expect(Number((d.sql.prepare('SELECT COUNT(*) AS n FROM giu_cho').get() as { n: number }).n)).toBe(1) // MỘT đơn vị = MỘT dòng
  })

  it('câu KHÔNG có nhãn nhóm ⇒ khoá riêng `qid:<qid>` (không bịa nhóm, không chặn oan nhau)', async () => {
    const d = dung()
    const a = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T1', qids: ['X1', 'X2'], nowMs: T0 })
    expect([...a.thang].sort()).toEqual(['X1', 'X2'])
    const goc = d.sql.prepare("SELECT content_group FROM giu_cho WHERE qid = 'X1'").get() as { content_group: string }
    expect(goc.content_group).toBe('qid:X1')
  })

  it('cùng một task gọi lại ⇒ GIA HẠN (không sinh dòng/task mới)', async () => {
    const d = dung()
    const nhom = new Map([['Q1', 'CG1']])
    await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T1', qids: ['Q1'], nowMs: T0, nhomTheoQid: nhom })
    const lai = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T1', qids: ['Q1'], nowMs: T0 + 60_000, nhomTheoQid: nhom })
    expect(lai.thang).toEqual(['Q1'])
    expect(lai.dangMo.size).toBe(0)
    expect((await docTheoNhom(d.env, 'S1', NGAY, 'CG1'))!.taskId).toBe('T1')
  })
})

describe('P05/RV02 — hết LEASE thiết bị KHÔNG sinh nhiệm vụ mới khi nhiệm vụ còn hiệu lực', () => {
  it('lease 1 giây hết sau 2 giây nhưng NHIỆM VỤ còn hạn ⇒ không ai chiếm được, chủ cũ giữ nguyên', async () => {
    const d = dung()
    const nhom = new Map([['Q-lease', 'CG-lease']])
    const old = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'STILL-ISSUED', qids: ['Q-lease'], nowMs: T0, hanGiay: 1, hanTaskGiay: 7200, nhomTheoQid: nhom })
    expect(old.thang).toEqual(['Q-lease'])
    const moi = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'NEW-ATTEMPT', qids: ['Q-lease'], nowMs: T0 + 2000, hanGiay: 900, hanTaskGiay: 7200, nhomTheoQid: nhom })
    expect(moi.thang).toEqual([]) // KHÔNG tạo attempt mới
    expect(moi.dangMo.get('Q-lease')).toBe('STILL-ISSUED') // phải RESUME task cũ
    expect((await docTheoNhom(d.env, 'S1', NGAY, 'CG-lease'))!.taskId).toBe('STILL-ISSUED')
  })

  it('NHIỆM VỤ đã kết thúc (hết hạn task + hết lease) ⇒ tiếp quản được bằng CAS', async () => {
    const d = dung()
    const nhom = new Map([['Q-lease', 'CG-lease']])
    await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'TASK-CU', qids: ['Q-lease'], nowMs: T0, hanGiay: 1, hanTaskGiay: 1, nhomTheoQid: nhom })
    const sau = T0 + 5000
    const moi = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'TASK-MOI', qids: ['Q-lease'], nowMs: sau, hanGiay: 900, hanTaskGiay: 7200, nhomTheoQid: nhom })
    expect(moi.thang).toEqual(['Q-lease'])
    const row = await docTheoNhom(d.env, 'S1', NGAY, 'CG-lease')
    expect(row!.taskId).toBe('TASK-MOI')
    expect(row!.hetHanTask).toBe(sau + 7200 * 1000)
  })

  it('HAI luồng giữ chỗ XEN KẼ nhau (nhường luồng trước mỗi câu lệnh) ⇒ đúng MỘT luồng thắng', async () => {
    const d = dung()
    const nhom = new Map([['Q7', 'CG7']])
    const env = dbXenKe(d.env)
    const [a, b] = await Promise.all([
      giuCho(env, { sbd: 'S1', ngay: NGAY, taskId: 'T-1', qids: ['Q7'], nowMs: T0, nhomTheoQid: nhom, hanTaskGiay: 7200 }),
      giuCho(env, { sbd: 'S1', ngay: NGAY, taskId: 'T-2', qids: ['Q7'], nowMs: T0, nhomTheoQid: nhom, hanTaskGiay: 7200 }),
    ])
    expect([...a.thang, ...b.thang]).toEqual(['Q7'])
    expect(Number((d.sql.prepare("SELECT COUNT(*) AS n FROM giu_cho WHERE content_group = 'CG7'").get() as { n: number }).n)).toBe(1)
  })

  it('nhả chỗ chỉ mở đúng đơn vị của task mình; giữ chỗ tách theo NGÀY và theo EM', async () => {
    const d = dung()
    const nhom = new Map([['Q1', 'CG1'], ['Q2', 'CG2'], ['Q3', 'CG3']])
    await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T-A', qids: ['Q1', 'Q2'], nowMs: T0, nhomTheoQid: nhom })
    await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T-B', qids: ['Q3'], nowMs: T0, nhomTheoQid: nhom })
    expect(await nhaCho(d.env, 'S1', NGAY, 'T-A', ['Q1'])).toBe(1)
    expect([...(await docCho(d.env, 'S1', NGAY)).keys()].sort()).toEqual(['Q2', 'Q3'])
    const homKhac = await giuCho(d.env, { sbd: 'S1', ngay: '2026-09-24', taskId: 'T2', qids: ['Q1'], nowMs: T0, nhomTheoQid: nhom })
    const emKhac = await giuCho(d.env, { sbd: 'S2', ngay: NGAY, taskId: 'T3', qids: ['Q1'], nowMs: T0, nhomTheoQid: nhom })
    expect(homKhac.thang).toEqual(['Q1'])
    expect(emKhac.thang).toEqual(['Q1'])
  })

  it('chưa áp migration (không có bảng) ⇒ coi như KHÔNG giữ được, KHÔNG tự cho là đã chốt', async () => {
    const d = dung()
    d.sql.exec('DROP TABLE giu_cho')
    const r = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T', qids: ['Q1'], nowMs: T0 })
    expect(r.thang).toEqual([])
    expect(r.thua).toEqual(['Q1'])
    expect(r.dangMo.size).toBe(0)
    expect(await docCho(d.env, 'S1', NGAY)).toEqual(new Map())
    expect(await docMotCho(d.env, 'S1', NGAY, 'Q1')).toBeNull()
    expect(await nhaCho(d.env, 'S1', NGAY, 'T')).toBe(0)
  })

  it('hằng số hạn đúng hợp đồng: lease thiết bị 900 giây, hạn nhiệm vụ 24 giờ (04 §8)', () => {
    expect(HAN_GIU_CHO_GIAY).toBe(900)
    expect(HAN_TASK_GIAY).toBe(24 * 3600)
  })
})

