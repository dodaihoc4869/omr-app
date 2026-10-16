// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { taoD1That, goiWorker, type D1That } from './_d1-that'
import worker from '../server/src/index'
import { docHoTroHoiThay, guiCanGiupHoiThay, gvGhiHoTroHoiThay, gvSoCanGiupHoiThay } from '../server/src/hoi-thay-can-giup'
import { SQL_HOI_THAY_CAN_GIUP } from '../server/src/hoi-thay-can-giup-schema'

let d: D1That
const Q = '12-THU-I-1', now = Date.parse('2026-10-16T01:00:00Z')
beforeEach(() => { d = taoD1That() })
afterEach(() => d.sql.close())
const gui = (sbd = '12000001', at = now) => guiCanGiupHoiThay(d.env, { sbd, qid: Q, lyDo: 'Em còn vướng ở phép tính.', nowMs: at, tieuDe: 'Tính lượng <b>muối</b>' })
const nop = (rev = 0, id = 'gui-ho-tro-1610-000001', text = 'Em viết phương trình rồi kiểm đơn vị mol.') => ({ qid: Q, requestId: id, loiGo: text, em: [{ sbd: '12000001', revision: rev }] })

describe('chuyển thầy: dữ liệu thật, phân trang và biên nhận nguyên tử', () => {
  it('schema chạy lặp không xoá yêu cầu; chỉ mục riêng, không đổi sổ học', async () => {
    await gui()
    for (const sql of SQL_HOI_THAY_CAN_GIUP) d.sql.exec(sql)
    expect(d.sql.prepare('SELECT count(*) n FROM hoi_thay_can_giup').get()).toMatchObject({ n: 1 })
    expect(SQL_HOI_THAY_CAN_GIUP.every(s => /^CREATE (TABLE|INDEX) IF NOT EXISTS hoi_thay_|^CREATE INDEX IF NOT EXISTS ht_cg_/.test(s))).toBe(true)
    expect(SQL_HOI_THAY_CAN_GIUP.join(' ')).not.toContain('ON su_kien_hoc')
  })

  it('tên câu thoát HTML, nhóm đúng em và lớp; số tổng không bị giới hạn 100', async () => {
    for (let i = 0; i < 103; i++) {
      const sbd = `12${String(i).padStart(6, '0')}`
      d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES(?,?,'12A','x')").run(sbd, `Em ${i}`)
      await gui(sbd)
    }
    const mot = await gvSoCanGiupHoiThay(d.env, {})
    expect(mot.tong).toBe(103)
    expect(mot.ds).toHaveLength(100)
    expect(mot.ds[0].tieuDe).toBe('Tính lượng muối')
    const hai = await gvSoCanGiupHoiThay(d.env, { sau: mot.sau })
    expect(hai.ds).toHaveLength(3)
    expect(hai.sau).toBeUndefined()
    expect(new Set([...mot.ds, ...hai.ds].map(x => x.sbd)).size).toBe(103)
    expect((await gvSoCanGiupHoiThay(d.env, { lop: '11A' })).tong).toBe(0)
  })

  it('gửi lời thầy giữ nguyên điểm/sổ; retry cùng receipt không gửi lại hay tăng revision', async () => {
    await gui()
    expect(await gvGhiHoTroHoiThay(d.env, nop(), now + 100)).toMatchObject({ ok: true, soEm: 1 })
    expect(await gvGhiHoTroHoiThay(d.env, nop(), now + 500)).toMatchObject({ ok: true, idempotent: true })
    expect(d.sql.prepare('SELECT revision,trang_thai,loi_luc FROM hoi_thay_can_giup').get()).toMatchObject({ revision: 1, trang_thai: 'da_ho_tro', loi_luc: now + 100 })
    expect(d.sql.prepare('SELECT COUNT(*) n FROM su_kien_hoc').get()).toMatchObject({ n: 0 })
    expect(d.sql.prepare('SELECT COUNT(*) n FROM loi_giai_hoi').get()).toMatchObject({ n: 0 })
    expect((await gvSoCanGiupHoiThay(d.env, {})).tong).toBe(0)
  })

  it('cùng mã receipt nhưng đổi lời thầy bị từ chối', async () => {
    await gui()
    await gvGhiHoTroHoiThay(d.env, nop(), now)
    expect(await gvGhiHoTroHoiThay(d.env, nop(0, 'gui-ho-tro-1610-000001', 'Nội dung khác'), now)).toMatchObject({ ok: false, ma: 'khac_noi_dung' })
  })

  it('CAS: một em thay đổi thì không gửi dở nửa lô và không tạo receipt giả', async () => {
    await gui()
    await gui('12000002')
    await gui('12000002', now + 1)
    const body = { ...nop(), em: [{ sbd: '12000001', revision: 0 }, { sbd: '12000002', revision: 0 }] }
    expect(await gvGhiHoTroHoiThay(d.env, body, now + 2)).toMatchObject({ ok: false, ma: 'tien_do_doi' })
    expect(d.sql.prepare("SELECT COUNT(*) n FROM hoi_thay_can_giup WHERE loi_thay<>''").get()).toMatchObject({ n: 0 })
    expect(d.sql.prepare('SELECT COUNT(*) n FROM hoi_thay_ho_tro_receipt').get()).toMatchObject({ n: 0 })
  })

  it('chỉ em nhận lời thầy mới đọc được; phục vụ lần đầu ghi hỗ trợ một lần, không tự nâng năng lực', async () => {
    await gui()
    await gvGhiHoTroHoiThay(d.env, nop(), now + 10)
    expect(await docHoTroHoiThay(d.env, 'EM-KHAC', Q, now + 20)).toEqual({})
    expect(await docHoTroHoiThay(d.env, '12000001', Q, now + 20)).toMatchObject({ loiThay: nop().loiGo, capNhatLuc: now + 10 })
    await docHoTroHoiThay(d.env, '12000001', Q, now + 40)
    expect(d.sql.prepare('SELECT sbd,qid,nguon,co_ho_so FROM loi_giai_hoi').all()).toEqual([{ sbd: '12000001', qid: Q, nguon: 'hoi_thay:thay_go', co_ho_so: 0 }])
    expect(d.sql.prepare('SELECT count(*) n FROM su_kien_hoc').get()).toMatchObject({ n: 0 })
  })

  it('lời mới cùng mili giây xen lúc đọc không bị đánh dấu đã đọc hoặc trả lời cũ', async () => {
    await gui()
    await gvGhiHoTroHoiThay(d.env, nop(), now + 10)
    const batch = d.env.DB.batch.bind(d.env.DB)
    let chen = false
    d.env.DB.batch = async ds => {
      if (!chen && ds.some(s => String((s as unknown as { _q: string })._q).startsWith('UPDATE hoi_thay_can_giup SET doc_luc'))) {
        chen = true
        d.sql.prepare("UPDATE hoi_thay_can_giup SET loi_thay='Lời mới',loi_luc=?,doc_luc=0,revision=revision+1 WHERE sbd=? AND qid=?").run(now + 10, '12000001', Q)
      }
      return batch(ds)
    }
    await expect(docHoTroHoiThay(d.env, '12000001', Q, now + 20)).rejects.toThrow('Lời thầy vừa thay đổi')
    expect(d.sql.prepare('SELECT loi_thay,doc_luc FROM hoi_thay_can_giup').get()).toMatchObject({ loi_thay: 'Lời mới', doc_luc: 0 })
    expect(d.sql.prepare('SELECT COUNT(*) n FROM loi_giai_hoi').get()).toMatchObject({ n: 0 })
  })

  it('không chấp nhận lô trùng em/quá lớn, thiếu revision, hoặc mã câu chèn SQL', async () => {
    expect(await gvGhiHoTroHoiThay(d.env, { ...nop(), em: [{ sbd: '12000001' }] })).toMatchObject({ ok: false })
    expect(await gvGhiHoTroHoiThay(d.env, { ...nop(), em: [nop().em[0], nop().em[0]] })).toMatchObject({ ok: false })
    expect(await gvGhiHoTroHoiThay(d.env, { ...nop(), em: Array.from({ length: 51 }, (_, i) => ({ sbd: String(i), revision: 0 })) })).toMatchObject({ ok: false })
    expect(await gvGhiHoTroHoiThay(d.env, { ...nop(), qid: "' OR 1=1 --" })).toMatchObject({ ok: false })
  })

  it('đường thầy thực sự nằm sau cổng mã bí mật; em không được đọc hoặc ghi hộ', async () => {
    for (const p of ['/gv/hoi-tro-ly/can-giup', '/gv/hoi-tro-ly/ho-tro']) {
      const r = await goiWorker(worker, d.env, p, nop())
      expect(r.ok).toBe(false)
    }
    expect(d.sql.prepare('SELECT COUNT(*) n FROM hoi_thay_ho_tro_receipt').get()).toMatchObject({ n: 0 })
  })
})
