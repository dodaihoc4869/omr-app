// @vitest-environment node
// Soát độc lập: SQL SQLite thật, không giả lập tải/concurrency Cloudflare D1.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { Q, seedChua } from './_chua-cau-sai-fixture'
import { hsMoKiemHoiThay, hsNopKiemHoiThay, docCauHoiThayDenHan } from '../server/src/hoi-thay-kiem-chung'
import { docNguonKiemHoiThay } from '../server/src/hoi-thay-kiem-chung-nguon'
import { hsGuiThayHoiThay } from '../server/src/hoi-thay-can-giup'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { docCauKhoHienTai } from '../server/src/cau-y-ds'
import { danhSach } from '../server/src/chua-cau-sai'

const NOW = Date.parse('2026-10-16T03:00:00Z'), NGAY = 86_400_000
let d: D1That, token: string
const mo = () => hsMoKiemHoiThay(d.env, { token, qid: Q }) as Promise<any>
const snapshot = (id: string) => JSON.parse((d.sql.prepare('SELECT snapshot_json FROM hoi_thay_kiem WHERE id=?').get(id) as any).snapshot_json)
const nop = (id: string, dap: string, ma = `doc-lap-${id}`) => hsNopKiemHoiThay(d.env, { token, phienId: id, traLoi: dap, attemptId: ma }) as Promise<any>
function suaGoc(f: (q: any) => void) {
  const q = JSON.parse((d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(Q) as any).json)
  f(q)
  d.sql.prepare('UPDATE game_v2_question SET json=?,version=?,content_group=? WHERE qid=?').run(JSON.stringify(q), q.version, q.group, Q)
  return q
}
function caNhanDangLam() {
  d.sql.prepare("INSERT INTO kiem_tra_ca_nhan(id,sbd,lop,ngay,mo_luc,han_luc,trang_thai,json,cap_nhat_luc) VALUES('kt-doc-lap','HS1','12','2026-10-16',?,?,'hen','{}',?)").run(NOW - 1000, NOW + 60_000, NOW)
  d.sql.prepare("INSERT INTO kiem_tra_ca_nhan_chang(bai_id,stt,bat_dau,han) VALUES('kt-doc-lap',0,?,?)").run(NOW - 1000, NOW + 60_000)
}
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW)
  d = taoD1That(); token = await seedChua(d.env)
})
afterEach(() => { d.sql.close(); vi.useRealTimers(); vi.restoreAllMocks() })

describe('Hỏi thầy · soát độc lập trước phát hành', () => {
  it('câu gốc còn trong phiên chưa nộp không mở kiểm chứng dù máy em tự gọi API', async () => {
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)')
      .run('dang-lam-doc-lap', 'HS1', JSON.stringify({ questions: [{ qid: Q }] }), new Date(NOW).toISOString())
    expect(await mo()).toMatchObject({ ok: false })
    expect(d.dem('hoi_thay_kiem')).toBe(0)
  })

  it('KTCN đang làm chặn mở/nộp kiểm chứng và yêu cầu giúp, không ghi hoặc trả đáp án', async () => {
    const a = await mo(), dap = snapshot(a.phienId).q.correct
    caNhanDangLam()
    for (const r of [await mo(), await nop(a.phienId, dap), await hsGuiThayHoiThay(d.env, { token, qid: Q })]) {
      expect(r.ok).toBe(false)
      expect(JSON.stringify(r)).not.toMatch(/"(?:correct|solution|snapshot_json|dapAn)"/)
    }
    expect(d.dem('su_kien_hoc', "nguon='chua_loi'")).toBe(0)
    expect(d.dem('hoi_thay_can_giup')).toBe(0)
  })

  it('lịch sử cũ không mở được câu khác khối khi lớp em vừa đổi', async () => {
    d.sql.prepare("UPDATE hoc_sinh SET lop='11' WHERE sbd='HS1'").run()
    expect(await mo()).toMatchObject({ ok: false })
    expect(d.dem('hoi_thay_kiem')).toBe(0)
  })

  it('ca đã đóng nhưng chưa công bố vẫn bảo vệ nội dung, kể cả khi em từng làm câu ấy', async () => {
    d.objects.set('key/ca-doc-lap.json', { ma_de: 'DH-12-C1-B1', cau: [{ qid: Q, phan: 'III', de: 'Tính M(LiOH), Li=7, O=16, H=1.', dap_an: '24' }] })
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,lop,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CA-DOC-LAP','Ca','12','dong',?,?,60,'thi','khong','key/ca-doc-lap.json','doc-lap')")
      .run(new Date(NOW - NGAY).toISOString(), new Date(NOW - 60_000).toISOString())
    xoaDemCaBaoVe()
    expect(await mo()).toMatchObject({ ok: false })
    expect(d.dem('hoi_thay_kiem')).toBe(0)
  })

  it('trợ giúp tới giữa lần đọc và giao dịch nộp không được ghi là none', async () => {
    const a = await mo(), dap = snapshot(a.phienId).q.correct
    const batch = d.env.DB.batch.bind(d.env.DB)
    let chen = false
    vi.spyOn(d.env.DB, 'batch').mockImplementation(async ds => {
      const laNop = ds.some(s => /UPDATE hoi_thay_kiem SET trang_thai='da_nop'/.test((s as any)._q ?? ''))
      if (laNop && !chen) {
        chen = true
        // Một yêu cầu Hỏi thầy khác vừa commit trước giao dịch nộp; thời gian máy chủ cùng ms.
        d.sql.prepare("INSERT INTO loi_giai_hoi(sbd,qid,luc,co_ho_so,nguon) VALUES('HS1',?,?,0,'doc-lap:tro-ly')")
          .run(Q, new Date(Date.now()).toISOString())
      }
      return batch(ds)
    })
    const r = await nop(a.phienId, dap)
    expect(chen).toBe(true)
    if (r.ok) {
      expect(r.trangThai).toBe('cho_kiem_lai')
      expect(d.sql.prepare("SELECT assistance FROM su_kien_hoc WHERE nguon='chua_loi'").get()).toMatchObject({ assistance: 'assisted' })
    } else expect(d.dem('su_kien_hoc', "nguon='chua_loi'")).toBe(0)
  })

  it('đã đóng lỗi ở phiên bản cũ không xác nhận phiên bản gốc mới chỉ sau một bản tự làm', async () => {
    const a = await mo(); await nop(a.phienId, snapshot(a.phienId).q.correct)
    vi.setSystemTime(NOW + 25 * 3_600_000)
    const b = await mo(); await nop(b.phienId, snapshot(b.phienId).q.correct)
    expect((await mo()).trangThai).toBe('da_xac_nhan')
    vi.setSystemTime(NOW + 3 * NGAY)
    suaGoc(q => { q.version = 'v2'; q.text += ' (bản cập nhật)' })
    const h = JSON.parse((d.sql.prepare('SELECT hoc_lieu_json FROM chua_loi_hoc_lieu WHERE qid_chuan=?').get(Q) as any).hoc_lieu_json)
    h.contentVersion = 'v2'
    for (const [i, p] of [...h.banGhepBai, ...h.banKiemChung].entries()) {
      p.phienBan = 'v2'; p.noiDungTrucTiep.hoi += ` (đề mới ${i})`
    }
    d.sql.prepare("UPDATE chua_loi_hoc_lieu SET content_version='v2',hoc_lieu_json=?,phien_ban_duyet='v2'").run(JSON.stringify(h))
    const c = await mo(); expect(c.trangThai).toBe('co_cau')
    expect((await nop(c.phienId, snapshot(c.phienId).q.correct)).ok).toBe(true)
    expect((await mo()).trangThai).not.toBe('da_xac_nhan')
  })

  it('bản kiểm có cùng nội dung và đáp án câu gốc không trở thành bằng chứng tương đương mới', async () => {
    const goc = suaGoc(() => undefined)
    const h = JSON.parse((d.sql.prepare('SELECT hoc_lieu_json FROM chua_loi_hoc_lieu WHERE qid_chuan=?').get(Q) as any).hoc_lieu_json)
    h.banGhepBai[0].noiDungTrucTiep.hoi = goc.text
    h.banGhepBai[0].noiDungTrucTiep.dapAn = goc.correct
    d.sql.prepare('UPDATE chua_loi_hoc_lieu SET hoc_lieu_json=?').run(JSON.stringify(h))
    const nguon = await docNguonKiemHoiThay(d.env, goc)
    expect(nguon.cau.some(c => c.q.text === goc.text && c.q.correct === goc.correct)).toBe(false)
  })

  it('sau xác nhận không tiếp tục thêm yêu cầu kiểm mỗi24h ngoài lịch duy trì', async () => {
    const a = await mo(); await nop(a.phienId, snapshot(a.phienId).q.correct)
    vi.setSystemTime(NOW + 25 * 3_600_000)
    const b = await mo(); await nop(b.phienId, snapshot(b.phienId).q.correct)
    expect((await mo()).trangThai).toBe('da_xac_nhan')
    const danh = await (await danhSach(d.env, { token })).json() as any
    expect(danh.dem.can).toBe(0)
    expect(danh.ds.filter((m: any) => m.qid === Q).every((m: any) => m.trangThai === 'da_tu_sua')).toBe(true)
    vi.setSystemTime(NOW + 50 * 3_600_000)
    expect(await docCauHoiThayDenHan(d.env, 'HS1')).not.toContain(Q)
  })

  it('fallback Đúng/Sai lấy bốn ý mới đúng băm, giữ đáp án riêng và chấm từng ý ở máy chủ', async () => {
    const de = 'Xét các phát biểu về ethanol.'
    suaGoc(q => { q.phan = 'II'; q.text = de; q.correct = 'DSDS'; q.ideas = ['Ý gốc a', 'Ý gốc b', 'Ý gốc c', 'Ý gốc d'] })
    d.sql.prepare('DELETE FROM chua_loi_hoc_lieu').run()
    d.objects.set('kho/DH-12-C1-B1.json', { cau: [{ qid: Q, phan: 'II', de, y: { a: 'Ý gốc a', b: 'Ý gốc b', c: 'Ý gốc c', d: 'Ý gốc d' }, dap_an: 'DSDS' }] })
    const ht = await docCauKhoHienTai(d.env, Q)
    expect(ht).toBeTruthy()
    d.sql.prepare("INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,lop,cap_nhat_luc) VALUES(?,?,'DH-12-C1-B1','ds','12','doc-lap')").run(Q, ht!.bam)
    d.sql.prepare("INSERT INTO loi_giai(bam,qid_mau,dang,trang_thai,r2_khoa,soan_luc) VALUES(?,?,'ds','da_duyet','khong-phat-loi-giai','doc-lap')").run(ht!.bam, Q)
    for (let i = 0; i < 4; i++) d.sql.prepare("INSERT INTO cau_y_ds(bam,khoa_y,stt,noi_dung,gia_tri,ly_do,nguon,luc,qid_mau,ma_de,lop) VALUES(?,?,?,?,?,?,'may_soan_2_luot','doc-lap',?,'DH-12-C1-B1','12')")
      .run(ht!.bam, `y-doc-lap-${i}`, i + 1, `Ý mới độc lập ${i + 1}`, 'SDDS'[i], 'Lý do đã kiểm riêng.', Q)
    const a = await mo()
    expect(a).toMatchObject({ ok: true, trangThai: 'co_cau', cau: { phan: 'II', ideas: ['Ý mới độc lập 1', 'Ý mới độc lập 2', 'Ý mới độc lập 3', 'Ý mới độc lập 4'] } })
    expect(JSON.stringify(a)).not.toContain('SDDS')
    expect((await nop(a.phienId, 'SDDS')).dung).toBe(true)
    const event = d.sql.prepare("SELECT subitem_json,raw_json FROM su_kien_hoc WHERE nguon='chua_loi'").get() as any
    expect(JSON.parse(event.subitem_json)).toEqual([1, 1, 1, 1])
    expect(JSON.parse(event.raw_json).tc).toBe(Q)
  })
})
