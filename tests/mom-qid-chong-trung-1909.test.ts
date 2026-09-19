// @vitest-environment node
// Sửa lỗi: em thấy CÙNG MỘT câu ở hai nơi — việc "ôn lại" của kế hoạch ngày và bài Mom/daily_ chưa nộp (0.Planer 19/09).
// Cách sửa: `mom_bai.qid_json` (cột chỉ-thêm) lưu mã câu của bài; kế hoạch loại các qid đó khỏi việc on_lai.
import { describe, it, expect, vi } from 'vitest'
import worker from '../server/src/index'
import { lapKeHoachNgay, type DauVaoKeHoach } from '../server/src/ke-hoach-ngay'
import { mom, qidCuaBai } from '../server/src/mom'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

vi.mock('../server/src/game-v2-auth', async (orig) => ({ ...(await orig<typeof import('../server/src/game-v2-auth')>()), gameIdentity: async () => 'S1' }))

const NOW = Date.parse('2026-09-20T05:00:00.000Z')
const H = 3_600_000
const iso = (gio: number) => new Date(NOW + gio * H).toISOString()
const dv = (o: Partial<DauVaoKeHoach> = {}): DauVaoKeHoach => ({
  sbd: 'S1', now: NOW, homNay: '2026-09-20', phutNgay: null, mauGiay: [], btvn: [], mom: [], cauToiHan: [], soCauChuaKhacPhuc: 0, dang: [],
  nhiemVuThanThu: [], caSapToi: [], lichSu: [], daLamHomNay: { soCau: 0, lenBac: 0, tutBac: 0 }, homNayLaNgayNghi: false, ...o,
})
const han = (qid: string, moc = '2026-09-19') => ({ qid, maDang: 'AA.BB', mocOnKe: moc, lanSai: 1 })
const onLai = (kh: ReturnType<typeof lapKeHoachNgay>) => (kh.viec.find((v) => v.loai === 'on_lai')?.chiTiet.qid ?? []) as string[]

describe('qidCuaBai: mã câu thật của một bài Mom', () => {
  it('lấy id/qid, bỏ cau_N, rỗng, không phải chữ; khử trùng, giữ thứ tự', () => {
    expect(qidCuaBai([{ id: 'A-I-1' }, { qid: 'A-I-2' }, { id: 'cau_3' }, { id: '' }, { id: 7 }, { id: ' A-I-1 ' }, {}, { id: 'B-II-4' }])).toEqual(['A-I-1', 'A-I-2', 'B-II-4'])
    expect(qidCuaBai([])).toEqual([])
  })
})

describe('hàm thuần: việc ôn lại không trùng câu với bài Mom chưa nộp', () => {
  const cau = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'].map((q) => han(q))

  it('câu nằm trong bài Mom CHƯA bắt đầu / đang làm bị loại khỏi on_lai; câu ngoài bài vẫn ở lại', () => {
    const truoc = lapKeHoachNgay(dv({ cauToiHan: cau }))
    expect(onLai(truoc).length).toBeGreaterThan(0)
    const khoa = onLai(truoc).slice(0, 2)
    const chua = lapKeHoachNgay(dv({ cauToiHan: cau, mom: [{ id: 'daily_2026-09-20', soCau: 2, taoLuc: iso(-1), batDauLuc: null, qid: khoa }] }))
    const dang = lapKeHoachNgay(dv({ cauToiHan: cau, mom: [{ id: 'M1', soCau: 2, taoLuc: iso(-3), batDauLuc: iso(-0.5), qid: khoa }] }))
    for (const kh of [chua, dang]) {
      for (const q of khoa) expect(onLai(kh)).not.toContain(q)
      for (const q of onLai(kh)) expect(cau.map((c) => c.qid)).toContain(q)
      expect(new Set(onLai(kh)).size).toBe(onLai(kh).length)
    }
  })

  it('bài Mom đã hết hạn (bắt đầu quá 120 phút) chỉ ở quaHan, câu của nó quay lại theo mốc ôn', () => {
    const kh = lapKeHoachNgay(dv({ cauToiHan: cau, mom: [{ id: 'M-HET', soCau: 6, taoLuc: iso(-9), batDauLuc: iso(-3), qid: cau.map((c) => c.qid) }] }))
    expect(kh.quaHan.map((x) => x.ma)).toEqual(['M-HET'])
    expect(onLai(kh).length).toBeGreaterThan(0)
  })

  it('bài đã nộp không có trong d.mom nên câu của nó không bị loại (quay lại theo mốc ôn bình thường)', () => {
    const khongMom = lapKeHoachNgay(dv({ cauToiHan: cau }))
    expect(onLai(khongMom)).toEqual(onLai(lapKeHoachNgay(dv({ cauToiHan: cau, mom: [] }))))
  })

  it('bài cũ không có qid (trước migration) không làm hỏng gì và không chống trùng', () => {
    const a = lapKeHoachNgay(dv({ cauToiHan: cau, mom: [{ id: 'CU', soCau: 3, taoLuc: iso(-3), batDauLuc: null }] }))
    const b = lapKeHoachNgay(dv({ cauToiHan: cau, mom: [{ id: 'CU', soCau: 3, taoLuc: iso(-3), batDauLuc: null, qid: [] }] }))
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('không đếm hai lần: tải cứng = số câu của bài Mom; on_lai + bù + tuỳ chọn + tải cứng không vượt mục tiêu ngày', () => {
    const khoa = ['Q1', 'Q2', 'Q3', 'Q4']
    const kh = lapKeHoachNgay(dv({ cauToiHan: cau, mom: [{ id: 'daily_2026-09-20', soCau: 4, taoLuc: iso(-1), batDauLuc: null, qid: khoa }] }))
    expect(kh.tai.cung).toBe(4)
    expect(kh.tai.cung + kh.tai.bu + kh.tai.tuyChon).toBeLessThanOrEqual(kh.nganSach.mucTieuCau)
    for (const q of khoa) expect(onLai(kh)).not.toContain(q)
    expect(onLai(kh).length).toBeLessThanOrEqual(2) // chỉ còn Q5, Q6
  })

  it('tất định và không đổi khi đảo thứ tự qid/câu tới hạn', () => {
    const d = dv({ cauToiHan: cau, mom: [{ id: 'M', soCau: 3, taoLuc: iso(-1), batDauLuc: null, qid: ['Q3', 'Q1', 'Q2'] }] })
    const dao = dv({ cauToiHan: [...cau].reverse(), mom: [{ id: 'M', soCau: 3, taoLuc: iso(-1), batDauLuc: null, qid: ['Q2', 'Q3', 'Q1'] }] })
    expect(JSON.stringify(lapKeHoachNgay(d))).toBe(JSON.stringify(lapKeHoachNgay(dao)))
  })
})

describe('D1 thật: mom create lưu qid_json; kế hoạch loại câu trùng', () => {
  const themHs = (d: D1That) => d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES('S1','x','x')").run()
  /** Câu tới hạn thật trong hồ sơ: dựng bằng sổ + dựng lại hồ sơ (như đường thật). */
  async function emCoCauToiHan(d: D1That, qids: string[]) {
    const { ghiSuKien } = await import('../server/src/su-kien-hoc')
    themHs(d)
    const r = await ghiSuKien(d.env, qids.map((q, i) => ({ nguon: 'btvn' as const, maNguon: 'B', sbd: 'S1', qid: q, lan: i + 1, ketQua: 0 as const, luc: new Date(Date.now() - 72 * H).toISOString() })))
    expect(r.ok).toBe(true)
  }
  const kh = async (d: D1That) => goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
  const qidOnLai = (r: Record<string, any>) => ((r.viec as { loai: string; chiTiet: { qid?: string[] } }[]).find((v) => v.loai === 'on_lai')?.chiTiet.qid ?? [])

  it('mom create ghi qid_json (bỏ cau_N); gọi lại không đổi', async () => {
    const d = taoD1That()
    themHs(d)
    const b = { sbd: 'S1', id: 'mom_1', tieuDe: 't', dsCau: [{ id: 'X-I-1', dapAn: 'A' }, { id: 'cau_2', dapAn: 'B' }, { id: 'X-I-3', dapAn: 'C' }] }
    await mom(d.env, 'create', b)
    const dong = () => d.sql.prepare("SELECT qid_json, question_count FROM mom_bai WHERE id='mom_1'").get() as { qid_json: string; question_count: number }
    expect(JSON.parse(dong().qid_json)).toEqual(['X-I-1', 'X-I-3'])
    expect(dong().question_count).toBe(3)
    await mom(d.env, 'create', { ...b, dsCau: [{ id: 'KHAC-I-1', dapAn: 'A' }] })
    expect(JSON.parse(dong().qid_json)).toEqual(['X-I-1', 'X-I-3'])
  })

  it('giao bài chứa câu tới hạn → việc on_lai không còn qid trùng; nộp bài xong → qid quay lại theo mốc ôn', async () => {
    const d = taoD1That()
    const cau = ['A-I-1', 'A-I-2', 'A-I-3', 'A-I-4', 'A-I-5', 'A-I-6']
    await emCoCauToiHan(d, cau)
    const truoc = qidOnLai(await kh(d))
    expect(truoc.length).toBeGreaterThan(0)
    // Phụ huynh giao một bài Mom gồm đúng các câu mà on_lai đang chọn.
    await mom(d.env, 'create', { sbd: 'S1', id: 'daily_' + new Date(Date.now() + 7 * H - 60_000).toISOString().slice(0, 10), tieuDe: 't', dsCau: truoc.map((id) => ({ id, dapAn: 'A' })) })
    const sau = await kh(d)
    for (const q of truoc) expect(qidOnLai(sau)).not.toContain(q)
    expect((sau.viec as { loai: string }[]).some((v) => v.loai === 'mom')).toBe(true) // bài mới hiện ở viec[] (việc nhỏ 1)
    // Nộp bài (đánh dấu đã nộp): câu quay lại theo mốc ôn.
    d.sql.prepare("UPDATE mom_bai SET started_at = ?, submitted_at = ? WHERE sbd = 'S1'").run(new Date().toISOString(), new Date().toISOString())
    const nop = qidOnLai(await kh(d))
    expect(nop).toEqual(truoc)
  })

  it('chưa chạy migration (thiếu cột qid_json): tạo bài và lập kế hoạch vẫn chạy, chỉ là không chống trùng', async () => {
    const d = taoD1That()
    const cau = ['B-I-1', 'B-I-2', 'B-I-3']
    await emCoCauToiHan(d, cau)
    d.sql.exec('ALTER TABLE mom_bai DROP COLUMN qid_json')
    await mom(d.env, 'create', { sbd: 'S1', id: 'mom_2', tieuDe: 't', dsCau: cau.map((id) => ({ id, dapAn: 'A' })) })
    expect(d.sql.prepare("SELECT COUNT(*) n FROM mom_bai WHERE id='mom_2'").get()).toEqual({ n: 1 })
    const r = await kh(d)
    expect(r.ok).toBe(true)
    expect((r.viec as { id: string }[]).map((v) => v.id)).toContain('mom:mom_2')
    expect(qidOnLai(r).length).toBeGreaterThan(0)
  })

  it('cột qid_json chứa rác không làm hỏng kế hoạch', async () => {
    const d = taoD1That()
    await emCoCauToiHan(d, ['C-I-1', 'C-I-2'])
    d.sql.prepare("INSERT INTO mom_bai(sbd,id,title,created_at,question_count,bank_key,qid_json) VALUES('S1','rac','t',?,3,'k','{không phải json')").run(new Date().toISOString())
    const r = await kh(d)
    expect(r.ok).toBe(true)
    expect(qidOnLai(r).length).toBeGreaterThan(0)
  })
})
