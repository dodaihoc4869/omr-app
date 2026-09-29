// @vitest-environment node
// MÁY TỰ DUYỆT hồ sơ lời giải (thầy chốt 29/09: "Giữ hiện luôn, máy duyệt luôn. Tôi không làm gì cả.") — server/src/loi-giai.ts.
//   (1) Nộp qua đủ 6 khoá + không còn cờ đáp án (cờ đã sang daChot / loiDe / hienThi vẫn là sạch) ⇒ 'da_duyet' NGAY, ghi giờ + "máy duyệt".
//   (2) Còn cờ đáp án ⇒ KHÔNG duyệt, KHÔNG hiện với học sinh; nằm trong danh sách /gv/loi-giai/sua-kho để cuối đợt báo thầy.
//   (3) Lệnh bù /gv/loi-giai/may-duyet-bu: chỉ đổi trạng thái hồ sơ sạch đang chờ ⇒ đã duyệt; không xoá, không đụng hồ sơ khác.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const GOC = path.resolve(__dirname, '..')
const MAU = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json'), 'utf8')) as Record<string, { cau: Record<string, unknown> }>
const RA2 = path.join(GOC, 'docs/loi-giai-a/chay-thu-2/ra')
const cauThat = (qid: string, so: number) => ({ ...MAU[qid].cau, so })
const DE_A = '12-THU-A'
const GOI_A = { cau: [cauThat('12-KT-C1-D4-I-6', 6), cauThat('12-KT-C1-D4-II-4', 4), cauThat('12-KT-C1-D2-III-6', 6)] }
const QA = { tn: `${DE_A}-I-6`, ds: `${DE_A}-II-4`, tln: `${DE_A}-III-6` }
const TEP: Record<string, string> = { [QA.tn]: '02-12-KT-C1-D4-I-6.json', [QA.ds]: '04-12-KT-C1-D4-II-4.json', [QA.tln]: '06-12-KT-C1-D2-III-6.json' }

const thay = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b, true)
const em = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b)
const bamCua = (d: D1That, qid: string) => (d.sql.prepare('SELECT bam FROM loi_giai_cau WHERE qid=?').get(qid) as { bam: string }).bam
const dong = (d: D1That, bam: string) => d.sql.prepare('SELECT trang_thai, duyet_luc, ghi_chu, so_co_dap_an FROM loi_giai WHERE bam=?').get(bam) as
  { trang_thai: string; duyet_luc: string | null; ghi_chu: string | null; so_co_dap_an: number }

function hoSo(qid: string, bam: string, them: Record<string, unknown> = {}) {
  const { canThayChot: _c, de: _de, ...r } = JSON.parse(fs.readFileSync(path.join(RA2, TEP[qid]), 'utf8'))
  void _c; void _de
  return { ...r, qid, bam, co: [], ...them }
}
async function chuanBi() {
  const d = taoD1That()
  await thay(d, '/kho/day', { maDe: DE_A, lop: '12', de: GOI_A, cau: [] })
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('E1','Em E1','12','mk','x')").run()
  return { d, token: await gameToken(d.env, 'E1') }
}
const nop = (d: D1That, qid: string, them: Record<string, unknown> = {}) => {
  const bam = bamCua(d, qid)
  return thay(d, '/kho/loi-giai/nop', { qid, bam, hoSo: hoSo(qid, bam, them) })
}

describe('máy tự duyệt lúc nộp', () => {
  it('hồ sơ sạch ⇒ đã duyệt ngay (giờ duyệt + "máy duyệt"); màn thầy thấy "máy duyệt", không lẫn với ghi chú trả lại', async () => {
    const { d, token } = await chuanBi()
    expect(await nop(d, QA.ds)).toMatchObject({ ok: true, sach: true, daDuyet: true })
    const r = dong(d, bamCua(d, QA.ds))
    expect(r.trang_thai).toBe('da_duyet')
    expect(r.duyet_luc).toMatch(/^\d{4}-\d\d-\d\dT/)
    expect(r.ghi_chu).toBe('máy duyệt')
    const m = await thay(d, '/gv/loi-giai/cho-duyet', { maDe: DE_A })
    expect(m.tong).toMatchObject({ daDuyet: 1, choDuyet: 0, sach: 0 })
    expect((m.cau as { qid: string }[]).find((c) => c.qid === QA.ds)).toMatchObject({ trangThai: 'da_duyet', mayDuyet: true, ghiChu: '' })
    expect(await em(d, '/hs/hoi-thay', { token, qid: QA.ds, nguon: 'game' })).toMatchObject({ ok: true, coLoiGiai: true })
  })

  it('cờ đã chuyển sang hiển thị / đề in sai / daChot vẫn là sạch ⇒ máy duyệt', async () => {
    const { d } = await chuanBi()
    const r = await nop(d, QA.tn, { co: [{ loai: 'hienThi', ghi: 'Độ ghi "90o" nên là "90°"' }], daChot: [{ ghi: 'Ý b nghi đáp án', chot: 'Giữ đáp án kho: đúng theo SGK' }] })
    expect(r).toMatchObject({ ok: true, daDuyet: true })
    expect(dong(d, bamCua(d, QA.tn)).trang_thai).toBe('da_duyet')
  })

  it('còn cờ đáp án ⇒ KHÔNG duyệt, KHÔNG hiện với học sinh; vào danh sách báo thầy (đã chốt / chưa chốt), lọc đúng đề', async () => {
    const { d, token } = await chuanBi()
    expect(await nop(d, QA.tln, { co: [{ loai: 'dapAn', ghi: 'Kho ghi 5', chot: 'Đáp án đúng là 2' }] })).toMatchObject({ ok: true, sach: false, daDuyet: false })
    expect(await nop(d, QA.ds, { co: [{ loai: 'dapAn', ghi: 'Ý a nghi sai' }] })).toMatchObject({ ok: true, daDuyet: false })
    for (const q of [QA.tln, QA.ds]) {
      const r = dong(d, bamCua(d, q))
      expect(r, q).toMatchObject({ trang_thai: 'cho_duyet', duyet_luc: null, ghi_chu: null })
      expect(await em(d, '/hs/hoi-thay', { token, qid: q, nguon: 'game' }), q).toMatchObject({ ok: true, coLoiGiai: false })
    }
    const ds = await thay(d, '/gv/loi-giai/sua-kho', {})
    expect(ds.dapAnSai).toEqual([expect.objectContaining({ qid: QA.tln, maDe: DE_A, chot: 'Đáp án đúng là 2' })])
    expect(ds.chuaChot).toEqual([expect.objectContaining({ qid: QA.ds, maDe: DE_A, ghi: 'Ý a nghi sai' })])
    const khac = await thay(d, '/gv/loi-giai/sua-kho', { maDe: '12-DE-KHAC' })
    expect(khac).toMatchObject({ ok: true, sua: [], dapAnSai: [], chuaChot: [] })
  })

  it('hồ sơ máy đã duyệt không bị ghi đè bởi lần nộp sau (trừ ghiDe)', async () => {
    const { d } = await chuanBi()
    await nop(d, QA.ds)
    expect(await nop(d, QA.ds)).toMatchObject({ ok: false })
    expect(dong(d, bamCua(d, QA.ds)).trang_thai).toBe('da_duyet')
  })
})

describe('lệnh bù /gv/loi-giai/may-duyet-bu — hồ sơ sạch nộp trước khi có máy duyệt', () => {
  function hoSoCu(d: D1That, bam: string, trangThai: string, soCo: number, duyetLuc: string | null = null, ghiChu: string | null = null) {
    d.sql.prepare(`INSERT INTO loi_giai (bam, qid_mau, dang, bo, lop, tang, trang_thai, so_co_dap_an, co_json, r2_khoa, soan_luc, duyet_luc, ghi_chu)
      VALUES (?, 'Q-' || ?, 'ds', 'ESTER', '12', 'du', ?, ?, '[]', 'giai/' || ? || '.json', '2026-09-29T01:00:00Z', ?, ?)`).run(bam, bam, trangThai, soCo, bam, duyetLuc, ghiChu)
  }

  it('cần mã bí mật của thầy', async () => {
    const { d } = await chuanBi()
    expect(await em(d, '/gv/loi-giai/may-duyet-bu', {})).toMatchObject({ ok: false, error: 'Sai mã bí mật' })
  })

  it('thử ⇒ chỉ đếm; chạy ⇒ chỉ đổi hồ sơ SẠCH đang chờ; không xoá dòng nào, không đụng hồ sơ khác; chạy lại ⇒ 0', async () => {
    const { d } = await chuanBi()
    hoSoCu(d, 's1', 'cho_duyet', 0)
    hoSoCu(d, 's2', 'cho_duyet', 0, null, 'Bước 2 thiếu hiệu suất')
    hoSoCu(d, 'co', 'cho_duyet', 1)
    hoSoCu(d, 'tl', 'tra_lai', 0, '2026-09-29T02:00:00Z', 'thầy trả lại')
    hoSoCu(d, 'dd', 'da_duyet', 0, '2026-09-29T03:00:00Z')
    const truoc = d.dem('loi_giai')

    expect(await thay(d, '/gv/loi-giai/may-duyet-bu', { thu: true })).toMatchObject({ ok: true, thu: true, soCau: 2, conCoDapAn: 1 })
    expect(dong(d, 's1').trang_thai).toBe('cho_duyet')

    expect(await thay(d, '/gv/loi-giai/may-duyet-bu', {})).toMatchObject({ ok: true, soCau: 2, conCoDapAn: 1 })
    expect(dong(d, 's1')).toMatchObject({ trang_thai: 'da_duyet', ghi_chu: 'máy duyệt' })
    expect(dong(d, 's1').duyet_luc).toMatch(/^\d{4}-/)
    expect(dong(d, 's2')).toMatchObject({ trang_thai: 'da_duyet', ghi_chu: 'máy duyệt · Bước 2 thiếu hiệu suất' })
    expect(dong(d, 'co')).toMatchObject({ trang_thai: 'cho_duyet', duyet_luc: null, ghi_chu: null })
    expect(dong(d, 'tl')).toMatchObject({ trang_thai: 'tra_lai', duyet_luc: '2026-09-29T02:00:00Z', ghi_chu: 'thầy trả lại' })
    expect(dong(d, 'dd')).toMatchObject({ trang_thai: 'da_duyet', duyet_luc: '2026-09-29T03:00:00Z', ghi_chu: null })
    expect(d.dem('loi_giai')).toBe(truoc)

    expect(await thay(d, '/gv/loi-giai/may-duyet-bu', {})).toMatchObject({ ok: true, soCau: 0 })
  })
})
