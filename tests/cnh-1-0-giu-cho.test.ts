// @vitest-environment node
// P05 mục 4 — GIỮ CHỖ có UNIQUENESS + CAS (04 §4.1/§5). Chạy trên D1 THẬT (node:sqlite, đúng schema +
// mọi migration). Chứng minh: giành chỗ là NGUYÊN TỬ; lượt thua KHÔNG chiếm được câu đã chốt và phải
// chọn lại phần chưa chốt; hết hạn thì tiếp quản bằng CAS; nhả chỗ mở lại đúng câu của mình.
import { describe, expect, it } from 'vitest'
import { docCho, docMotCho, giuCho, nhaCho, HAN_GIU_CHO_GIAY } from '../server/src/giu-cho'
import { taoD1That, type D1That } from './_d1-that'

const NGAY = '2026-09-22'
const T0 = Date.parse('2026-09-22T12:00:00+07:00')
const dung = (): D1That => taoD1That()

describe('P05 — giữ chỗ bằng SQL có uniqueness/CAS (D1 thật)', () => {
  it('lượt đầu giành được đúng các câu yêu cầu; lượt thứ hai THUA toàn bộ và biết ai đang giữ', async () => {
    const d = dung()
    const a = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T-A', qids: ['Q1', 'Q2'], nowMs: T0 })
    expect(a.thang).toEqual(['Q1', 'Q2'])
    expect(a.thua).toEqual([])
    expect(Number((d.sql.prepare('SELECT COUNT(*) n FROM giu_cho').get() as { n: number }).n)).toBe(2)

    const b = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T-B', qids: ['Q2', 'Q3'], nowMs: T0 })
    expect(b.thang).toEqual(['Q3']) // chỉ giành được phần CHƯA chốt
    expect(b.thua).toEqual(['Q2']) // câu đã bị lượt khác giữ
    expect(b.dangGiu.get('Q2')).toBe('T-A')
  })

  it('KHÔNG đọc-rồi-ghi: hai lời gọi liên tiếp cho cùng câu ⇒ đúng MỘT dòng, MỘT lượt thắng', async () => {
    const d = dung()
    const [a, b] = [await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T-1', qids: ['Q7'], nowMs: T0 }),
      await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T-2', qids: ['Q7'], nowMs: T0 })]
    expect(a.thang).toEqual(['Q7'])
    expect(b.thang).toEqual([])
    expect(b.thua).toEqual(['Q7'])
    expect(Number((d.sql.prepare("SELECT COUNT(*) n FROM giu_cho WHERE qid = 'Q7'").get() as { n: number }).n)).toBe(1)
  })

  it('hết hạn (lease_until < now) ⇒ lượt khác TIẾP QUẢN bằng CAS, và hạn mới được ghi', async () => {
    const d = dung()
    await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T-CU', qids: ['Q9'], nowMs: T0, hanGiay: 1 })
    const sauHan = T0 + 2000
    const moi = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T-MOI', qids: ['Q9'], nowMs: sauHan })
    expect(moi.thang).toEqual(['Q9'])
    const row = await docMotCho(d.env, 'S1', NGAY, 'Q9')
    expect(row!.taskId).toBe('T-MOI')
    expect(row!.leaseUntil).toBe(sauHan + HAN_GIU_CHO_GIAY * 1000)
  })

  it('CHƯA hết hạn thì KHÔNG tiếp quản được (điều kiện hạn là phần CAS)', async () => {
    const d = dung()
    await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T-1', qids: ['Q8'], nowMs: T0, hanGiay: 900 })
    const xin = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T-2', qids: ['Q8'], nowMs: T0 + 1000 })
    expect(xin.thua).toEqual(['Q8'])
    expect((await docMotCho(d.env, 'S1', NGAY, 'Q8'))!.taskId).toBe('T-1')
  })

  it('nhả chỗ CHỈ mở đúng câu của task mình; sau đó lượt khác giành được', async () => {
    const d = dung()
    await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T-A', qids: ['Q1', 'Q2'], nowMs: T0 })
    await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T-B', qids: ['Q3'], nowMs: T0 })
    expect(await nhaCho(d.env, 'S1', NGAY, 'T-A', ['Q1'])).toBe(1) // chỉ nhả Q1
    const conLai = await docCho(d.env, 'S1', NGAY)
    expect([...conLai.keys()].sort()).toEqual(['Q2', 'Q3'])
    const c = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T-C', qids: ['Q1', 'Q2'], nowMs: T0 })
    expect(c.thang).toEqual(['Q1'])
    expect(c.thua).toEqual(['Q2'])
  })

  it('giữ chỗ TÁCH theo NGÀY và theo EM (không khoá chéo)', async () => {
    const d = dung()
    await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T1', qids: ['Q1'], nowMs: T0 })
    const homKhac = await giuCho(d.env, { sbd: 'S1', ngay: '2026-09-23', taskId: 'T2', qids: ['Q1'], nowMs: T0 })
    const emKhac = await giuCho(d.env, { sbd: 'S2', ngay: NGAY, taskId: 'T3', qids: ['Q1'], nowMs: T0 })
    expect(homKhac.thang).toEqual(['Q1'])
    expect(emKhac.thang).toEqual(['Q1'])
  })

  it('chưa áp migration (không có bảng) ⇒ coi như KHÔNG giữ được, KHÔNG tự cho là đã chốt', async () => {
    const d = dung()
    d.sql.exec('DROP TABLE giu_cho')
    const r = await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T', qids: ['Q1'], nowMs: T0 })
    expect(r.thang).toEqual([])
    expect(r.thua).toEqual(['Q1'])
    expect(await docCho(d.env, 'S1', NGAY)).toEqual(new Map())
    expect(await nhaCho(d.env, 'S1', NGAY, 'T')).toBe(0)
  })
})
