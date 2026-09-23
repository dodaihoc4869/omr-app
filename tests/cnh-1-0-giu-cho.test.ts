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
    expect((await docTheoNhom(d.env, 'S1', 'CG1'))!.taskId).toBe('T1')
  })
  it('RV01-followup: đơn vị ĐANG PHÁT giữ nguyên QUA NỬA ĐÊM VN (khoá không theo ngày)', async () => {
    const d = dung()
    const nhom = new Map([['Q1', 'GROUP'], ['Q2', 'GROUP']])
    // 23:59 giờ VN ngày 23/09 — nhiệm vụ A giữ đơn vị GROUP (hạn nhiệm vụ 24 giờ).
    const t1 = Date.parse('2026-09-23T16:59:00Z')
    const a = await giuCho(d.env, { sbd: 'S1', ngay: '2026-09-23', taskId: 'A', qids: ['Q1'], nowMs: t1, nhomTheoQid: nhom, hanTaskGiay: 24 * 3600 })
    expect(a.thang).toEqual(['Q1'])
    // 00:01 giờ VN NGÀY HÔM SAU: vẫn CÙNG đơn vị nội dung, nhiệm vụ A còn hiệu lực ⇒ B KHÔNG dành được.
    const b = await giuCho(d.env, { sbd: 'S1', ngay: '2026-09-24', taskId: 'B', qids: ['Q2'], nowMs: t1 + 120_000, nhomTheoQid: nhom, hanTaskGiay: 24 * 3600 })
    expect(b.thang).toEqual([])
    expect(b.dangMo.get('Q2')).toBe('A')
    expect(Number((d.sql.prepare('SELECT COUNT(*) AS n FROM giu_cho').get() as { n: number }).n)).toBe(1) // MỘT dòng cho MỘT đơn vị
    // Nhiệm vụ A kết thúc (quá hạn nhiệm vụ) ⇒ B tiếp quản được, và dòng CHUYỂN ngày hoạt động.
    const c = await giuCho(d.env, { sbd: 'S1', ngay: '2026-09-24', taskId: 'B', qids: ['Q2'], nowMs: t1 + 25 * 3600 * 1000, nhomTheoQid: nhom, hanTaskGiay: 24 * 3600 })
    expect(c.thang).toEqual(['Q2'])
    const row = await docTheoNhom(d.env, 'S1', 'GROUP')
    expect(row!.taskId).toBe('B')
    // Ngày HOẠT ĐỘNG GẦN NHẤT đã chuyển sang ngày mới (khoá thì vẫn là đơn vị nội dung).
    const ngayHoatDong = d.sql.prepare("SELECT ngay FROM giu_cho WHERE sbd='S1' AND content_group='GROUP'").get() as { ngay: string }
    expect(ngayHoatDong.ngay).toBe('2026-09-24')
    expect(Number((d.sql.prepare("SELECT COUNT(*) AS n FROM giu_cho WHERE sbd='S1' AND content_group='GROUP'").get() as { n: number }).n)).toBe(1)
  })

  it('RV02-followup: chủ đổi GIỮA hai bước ⇒ bản gia hạn KHÔNG báo thắng (CAS kiểm chủ + revision, có kiểm changes)', async () => {
    const d = dung()
    const nhom = new Map([['Q1', 'CGX']])
    await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'A', qids: ['Q1'], nowMs: T0, nhomTheoQid: nhom, hanTaskGiay: 7200 })
    // Chèn ĐỔI CHỦ ngay trước câu UPDATE gia hạn (xen kẽ có kiểm soát, như repro của giám sát).
    let doiChu = true
    const env = {
      ...d.env,
      DB: {
        prepare(sql: string) {
          const st = d.env.DB.prepare(sql) as unknown as Record<string, unknown>
          const boc = (o: Record<string, unknown>): Record<string, unknown> => ({
            ...o,
            bind: (...a: unknown[]) => boc((o.bind as (...x: unknown[]) => unknown)(...a) as Record<string, unknown>),
            run: () => {
              if (doiChu && String(sql).startsWith('UPDATE giu_cho SET lease_until')) {
                doiChu = false
                d.sql.prepare("UPDATE giu_cho SET task_id='OTHER-OWNER', revision=revision+1 WHERE sbd='S1' AND content_group='CGX'").run()
              }
              return (o.run as () => Promise<unknown>)()
            },
            first: () => (o.first as () => Promise<unknown>)(),
            all: () => (o.all as () => Promise<unknown>)(),
          })
          return boc(st) as unknown as ReturnType<Env['DB']['prepare']>
        },
      },
    } as Env
    const lai = await giuCho(env, { sbd: 'S1', ngay: NGAY, taskId: 'A', qids: ['Q1'], nowMs: T0 + 1000, nhomTheoQid: nhom, hanTaskGiay: 7200 })
    expect(lai.thang).toEqual([]) // KHÔNG báo thắng khi chủ đã đổi
    expect(lai.dangGiu.get('Q1')).toBe('OTHER-OWNER')
    const row = d.sql.prepare("SELECT task_id, lease_until FROM giu_cho WHERE sbd='S1' AND content_group='CGX'").get() as { task_id: string; lease_until: number }
    expect(row.task_id).toBe('OTHER-OWNER') // không bị ghi đè về A
  })

  it('RV02-followup: gia hạn KHÔNG kéo dài HẠN NỘP đã chốt từ lúc phát (`het_han_task` bất biến)', async () => {
    const d = dung()
    const nhom = new Map([['Q1', 'CGY']])
    await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'A', qids: ['Q1'], nowMs: T0, nhomTheoQid: nhom, hanGiay: 60, hanTaskGiay: 7200 })
    const truoc = d.sql.prepare("SELECT het_han_task FROM giu_cho WHERE sbd='S1' AND content_group='CGY'").get() as { het_han_task: number }
    const lai = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'A', qids: ['Q1'], nowMs: T0 + 30_000, nhomTheoQid: nhom, hanGiay: 900, hanTaskGiay: 7200, revision: 1 })
    expect(lai.thang).toEqual(['Q1']) // cùng chủ, cùng revision ⇒ gia hạn thắng
    const sau = d.sql.prepare("SELECT het_han_task, lease_until FROM giu_cho WHERE sbd='S1' AND content_group='CGY'").get() as { het_han_task: number; lease_until: number }
    expect(sau.het_han_task).toBe(truoc.het_han_task) // hạn nộp KHÔNG đổi
    expect(sau.lease_until).toBe(T0 + 30_000 + 900 * 1000) // lease được gia hạn
    // Nhiệm vụ ĐÃ HẾT HẠN ⇒ gia hạn không được hồi sinh nó.
    const chet = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'A', qids: ['Q1'], nowMs: T0 + 8000_000, nhomTheoQid: nhom, hanGiay: 900, hanTaskGiay: 7200 })
    expect(chet.thang).toEqual([])
    expect(chet.dangMo.size).toBe(0) // không còn hiệu lực ⇒ không báo "đang mở"
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
    expect((await docTheoNhom(d.env, 'S1', 'CG-lease'))!.taskId).toBe('STILL-ISSUED')
  })

  it('NHIỆM VỤ đã kết thúc (hết hạn task + hết lease) ⇒ tiếp quản được bằng CAS', async () => {
    const d = dung()
    const nhom = new Map([['Q-lease', 'CG-lease']])
    await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'TASK-CU', qids: ['Q-lease'], nowMs: T0, hanGiay: 1, hanTaskGiay: 1, nhomTheoQid: nhom })
    const sau = T0 + 5000
    const moi = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'TASK-MOI', qids: ['Q-lease'], nowMs: sau, hanGiay: 900, hanTaskGiay: 7200, nhomTheoQid: nhom })
    expect(moi.thang).toEqual(['Q-lease'])
    const row = await docTheoNhom(d.env, 'S1', 'CG-lease')
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
    expect(await nhaCho(d.env, 'S1', 'T-A', ['Q1'])).toBe(1)
    expect([...(await docCho(d.env, 'S1', T0)).keys()].sort()).toEqual(['Q2', 'Q3'])
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
    expect(await docCho(d.env, 'S1', T0)).toEqual(new Map())
    expect(await docMotCho(d.env, 'S1', 'Q1')).toBeNull()
    expect(await nhaCho(d.env, 'S1', 'T')).toBe(0)
  })

  it('hằng số hạn đúng hợp đồng: lease thiết bị 900 giây, hạn nhiệm vụ 24 giờ (04 §8)', () => {
    expect(HAN_GIU_CHO_GIAY).toBe(900)
    expect(HAN_TASK_GIAY).toBe(24 * 3600)
  })
})

