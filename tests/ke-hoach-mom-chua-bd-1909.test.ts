// @vitest-environment node
// Sửa lỗi (0.Planer báo từ phiên Giao diện): bài Mẹ mới giao (chưa bắt đầu) BIẾN MẤT khỏi `viec[]` nên trang chủ học sinh không thấy.
// Luật đã chốt: hạn 120 phút của Mom chỉ tính TỪ LÚC BẮT ĐẦU. Bài chưa bắt đầu vì vậy không có hạn cứng, nhưng vẫn là việc BẮT BUỘC.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { lapKeHoachNgay, ngayHocMom, type DauVaoKeHoach } from '../server/src/ke-hoach-ngay'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const NOW = Date.parse('2026-09-20T05:00:00.000Z') // 12:00 giờ VN, 20/09
const H = 3_600_000
const iso = (gio: number) => new Date(NOW + gio * H).toISOString()
const dv = (o: Partial<DauVaoKeHoach> = {}): DauVaoKeHoach => ({
  sbd: 'S1', now: NOW, homNay: '2026-09-20', phutNgay: null, mauGiay: [], btvn: [], mom: [], cauToiHan: [], soCauChuaKhacPhuc: 0, dang: [],
  nhiemVuThanThu: [], caSapToi: [], lichSu: [], daLamHomNay: { soCau: 0, lenBac: 0, tutBac: 0 }, homNayLaNgayNghi: false, ...o,
})
const chua = (id: string, soCau: number, taoGio = -5) => ({ id, soCau, taoLuc: iso(taoGio), batDauLuc: null })
const bat = (id: string, soCau: number, batGio: number) => ({ id, soCau, taoLuc: iso(-9), batDauLuc: iso(batGio) })
const cauHan = (n: number) => Array.from({ length: n }, (_, i) => ({ qid: `Q${i}`, maDang: 'AA.BB', mocOnKe: '2026-09-19', lanSai: 1 }))
const ids = (kh: ReturnType<typeof lapKeHoachNgay>) => kh.viec.map((v) => v.id)

describe('hàm thuần: Mom chưa bắt đầu là việc bắt buộc, không hạn cứng', () => {
  it('có mặt trong viec[]: loai mom, batBuoc, hanCung null, không khẩn, không nhãn', () => {
    const kh = lapKeHoachNgay(dv({ mom: [chua('M2', 6)] }))
    const m = kh.viec.find((v) => v.id === 'mom:M2')!
    expect(m).toBeDefined()
    expect(m).toMatchObject({ loai: 'mom', batBuoc: true, hanCung: null, hanMem: null, khan: false, nhan: null, nguon: 'M2', soCau: 6, trangThai: 'cho' })
    expect(m.chiTiet).toMatchObject({ id: 'M2', chuaBatDau: true })
  })

  it('tính vào tai.cung (và làm em quá tải nếu vượt mục tiêu ngày)', () => {
    const khong = lapKeHoachNgay(dv())
    const co = lapKeHoachNgay(dv({ mom: [chua('M2', 6)] }))
    expect(co.tai.cung).toBe(khong.tai.cung + 6)
    const nhieu = lapKeHoachNgay(dv({ mom: [chua('MA', 20), chua('MB', 20)], cauToiHan: cauHan(10) }))
    expect(nhieu.tai.cung).toBe(40)
    expect(nhieu.tai.vuot).toBeGreaterThan(0)
    expect(nhieu.canhBao.some((c) => c.loai === 'qua_tai')).toBe(true)
    // Việc bắt buộc giữ nguyên, việc mềm bị cắt (đúng luật quá tải cũ).
    expect(ids(nhieu)).toEqual(expect.arrayContaining(['mom:MA', 'mom:MB']))
    expect(nhieu.viec.every((v) => v.batBuoc)).toBe(true)
  })

  it('thứ tự EDF: việc có hạn cứng (lô BTVN, Mom đã bắt đầu) đứng TRƯỚC; rồi Mom chưa bắt đầu; rồi việc mềm', () => {
    const kh = lapKeHoachNgay(dv({
      btvn: [{ ma: 'B1', soCau: 10, giaoLuc: iso(-24), hanNop: iso(48), loDaXong: 0, daNop: false }],
      mom: [chua('M-CHUA', 4), bat('M-DANG', 3, -0.5)],
      cauToiHan: cauHan(6),
    }))
    const thuTu = ids(kh)
    const iChua = thuTu.indexOf('mom:M-CHUA')
    expect(iChua).toBeGreaterThanOrEqual(0)
    for (const id of ['mom:M-DANG', ...thuTu.filter((x) => x.startsWith('btvn_lo:'))]) expect(thuTu.indexOf(id)).toBeLessThan(iChua)
    for (const v of kh.viec.filter((x) => !x.batBuoc)) expect(thuTu.indexOf(v.id)).toBeGreaterThan(iChua)
    // Mom đã bắt đầu (hạn 90 phút nữa) đứng trước mọi Mom chưa bắt đầu.
    expect(thuTu.indexOf('mom:M-DANG')).toBeLessThan(iChua)
    // thuTu và cong liền nhau.
    kh.viec.forEach((v, i) => {
      expect(v.thuTu).toBe(i + 1)
      expect(v.cong).toBe(i === 0 ? null : kh.viec[i - 1]!.id)
    })
  })

  it('cổng: Mom chưa bắt đầu sau một việc bắt buộc thì CHƯA hiện (hien=false), không khẩn nên không vượt cổng', () => {
    const kh = lapKeHoachNgay(dv({ mom: [bat('M-DANG', 3, -0.5), chua('M-CHUA', 4)] }))
    expect(kh.viec.find((v) => v.id === 'mom:M-DANG')!.hien).toBe(true)
    expect(kh.viec.find((v) => v.id === 'mom:M-CHUA')!.hien).toBe(false)
    const mot = lapKeHoachNgay(dv({ mom: [chua('M-CHUA', 4)] }))
    expect(mot.viec[0]).toMatchObject({ id: 'mom:M-CHUA', hien: true, cong: null })
  })

  it('nhiều Mom chưa bắt đầu: cũ giao trước đứng trước, cùng lúc thì theo id; không phụ thuộc thứ tự đầu vào', () => {
    const a = [chua('Mc', 3, -2), chua('Ma', 3, -8), chua('Mb', 3, -8)]
    const kh = lapKeHoachNgay(dv({ mom: a }))
    expect(ids(kh).filter((x) => x.startsWith('mom:'))).toEqual(['mom:Ma', 'mom:Mb', 'mom:Mc'])
    expect(JSON.stringify(lapKeHoachNgay(dv({ mom: [...a].reverse() })))).toBe(JSON.stringify(kh))
  })

  it('daily_ của NGÀY CŨ chưa bắt đầu vẫn bị bỏ; daily_ của hôm nay được giữ; Mom tay cũ chưa bắt đầu vẫn tính', () => {
    expect(ngayHocMom(NOW)).toBe('2026-09-20')
    const kh = lapKeHoachNgay(dv({ mom: [chua('daily_2026-09-19', 8, -30), chua('daily_2026-09-20', 6, -2), chua('mom_1789712595089', 5, -90)] }))
    expect(ids(kh)).not.toContain('mom:daily_2026-09-19')
    expect(ids(kh)).toEqual(expect.arrayContaining(['mom:daily_2026-09-20', 'mom:mom_1789712595089']))
  })

  it('daily_ ngày cũ ĐÃ bắt đầu và còn trong 120 phút vẫn là việc khẩn như trước', () => {
    const kh = lapKeHoachNgay(dv({ mom: [{ id: 'daily_2026-09-19', soCau: 8, taoLuc: iso(-30), batDauLuc: iso(-0.5) }] }))
    expect(kh.viec.find((v) => v.id === 'mom:daily_2026-09-19')).toMatchObject({ khan: true, hanCung: iso(1.5), nhan: 'khan_cap' })
  })

  it('đêm 23:59–00:01 VN: ngày học đổi lúc 00:01 như bảng tin phụ huynh (ngayHocMom)', () => {
    expect(ngayHocMom(Date.parse('2026-09-19T17:00:59Z'))).toBe('2026-09-19')
    expect(ngayHocMom(Date.parse('2026-09-19T17:01:00Z'))).toBe('2026-09-20')
  })

  it('bài 0 câu hoặc âm không thành việc', () => {
    expect(ids(lapKeHoachNgay(dv({ mom: [chua('M0', 0)] })))).toEqual([])
  })
})

// ===========================================================================
describe('D1 thật: Mom chưa nộp vào /hs/ke-hoach-ngay', () => {
  const themHs = (d: D1That, sbd: string) => d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES(?,'x','x')").run(sbd)
  const g = (gio: number) => new Date(Date.now() + gio * H).toISOString()
  const themMom = (d: D1That, sbd: string, id: string, soCau: number, batGio: number | null, nopGio: number | null = null, taoGio = -30) =>
    d.sql.prepare('INSERT INTO mom_bai(sbd,id,title,created_at,question_count,bank_key,started_at,submitted_at) VALUES(?,?,?,?,?,?,?,?)')
      .run(sbd, id, 't', g(taoGio), soCau, `mom/${sbd}/${id}.json`, batGio === null ? null : g(batGio), nopGio === null ? null : g(nopGio))
  const homNayDaily = () => `daily_${ngayHocMom(Date.now())}`

  it('Mom mới giao (chưa bắt đầu) có trong viec[]; bài đã nộp không có; bài đã bắt đầu vẫn khẩn', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    themMom(d, 'S1', 'MOI', 6, null)
    themMom(d, 'S1', 'NOP', 5, -3, -2.5) // đã bắt đầu và đã nộp
    themMom(d, 'S1', 'NOP-CHUA-BD', 5, null, -1) // (dữ liệu lạ) có ngày nộp nhưng chưa bắt đầu: đã nộp thì không nợ
    themMom(d, 'S1', 'DANG', 4, -0.5)
    const r = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(r.ok).toBe(true)
    const viec = r.viec as { id: string; loai: string; khan: boolean; hanCung: string | null; batBuoc: boolean }[]
    expect(viec.find((v) => v.id === 'mom:MOI')).toMatchObject({ loai: 'mom', batBuoc: true, khan: false, hanCung: null })
    expect(viec.find((v) => v.id === 'mom:DANG')).toMatchObject({ loai: 'mom', khan: true })
    expect(viec.map((v) => v.id)).not.toContain('mom:NOP')
    expect(viec.map((v) => v.id)).not.toContain('mom:NOP-CHUA-BD')
    // Việc có hạn cứng (DANG) đứng trước MOI.
    expect(viec.findIndex((v) => v.id === 'mom:DANG')).toBeLessThan(viec.findIndex((v) => v.id === 'mom:MOI'))
    expect(r.tai.cung).toBe(6 + 4)
  })

  it('daily_ của ngày cũ chưa bắt đầu bị bỏ (SQL lọc từ gốc); daily_ hôm nay và Mom tay giữ', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    themMom(d, 'S1', 'daily_2020-01-01', 8, null)
    themMom(d, 'S1', homNayDaily(), 6, null)
    themMom(d, 'S1', 'mom_tay', 5, null)
    const r = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    const id = (r.viec as { id: string }[]).map((v) => v.id)
    expect(id).not.toContain('mom:daily_2020-01-01')
    expect(id).toEqual(expect.arrayContaining([`mom:${homNayDaily()}`, 'mom:mom_tay']))
    expect(r.tai.cung).toBe(6 + 5)
  })

  it('Mom đã bắt đầu quá 120 phút vẫn chỉ nằm ở quaHan, không thành việc', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    themMom(d, 'S1', 'HET', 7, -3)
    const r = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect((r.viec as { id: string }[]).map((v) => v.id)).not.toContain('mom:HET')
    expect(r.quaHan).toEqual([expect.objectContaining({ loai: 'mom', ma: 'HET', conLai: 7 })])
  })

  it('lập kế hoạch cả lô em một truy vấn Mom (không nhân theo số em)', async () => {
    const d = taoD1That()
    for (const s of ['S1', 'S2', 'S3']) { themHs(d, s); themMom(d, s, `M-${s}`, 5, null) }
    const { lapVaLuuKeHoach } = await import('../server/src/ke-hoach-ngay-d1')
    const kh = await lapVaLuuKeHoach(d.env, ['S1', 'S2', 'S3'], Date.now())
    for (const s of ['S1', 'S2', 'S3']) expect(kh.get(s)!.viec.map((v) => v.id)).toContain(`mom:M-${s}`)
  })
})
