// @vitest-environment node
// Sửa lỗi (0.Planer báo từ phiên Giao diện): bài Mẹ mới giao (chưa bắt đầu) BIẾN MẤT khỏi `viec[]` nên trang chủ học sinh không thấy.
// Luật đã chốt: hạn 120 phút của Mom chỉ tính TỪ LÚC BẮT ĐẦU. Bài chưa bắt đầu vì vậy không có hạn cứng, nhưng vẫn là việc BẮT BUỘC.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { lapKeHoachNgay, ngayHocMom, type DauVaoKeHoach } from '../server/src/ke-hoach-ngay'
import { MOM_CHUA_BAT_DAU_SO_NGAY, MOM_CHUA_BAT_DAU_TOI_DA } from '../server/src/ho-so-cau-hinh'
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
    const kh = lapKeHoachNgay(dv({ mom: [chua('daily_2026-09-19', 8, -30), chua('daily_2026-09-20', 6, -2), chua('mom_1789712595089', 5, -30)] }))
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


// ===========================================================================
// 0.Planer 19/09 (sau khi thấy số liệu thật: 42 bài Mom tay chưa bắt đầu của 5 em, một em 24 bài): Mom chưa bắt đầu chỉ là việc bắt buộc khi
// giao trong 3 ngày VN gần nhất và tối đa 3 bài (mới nhất trước); phần còn lại là `tonCu[]`, đứng riêng, không tính tải/quá tải/cổng.
describe('tồn cũ: Mom chưa bắt đầu giao từ lâu hoặc quá 3 bài', () => {
  const tonMoi = (kh: ReturnType<typeof lapKeHoachNgay>) => kh.viec.filter((v) => v.loai === 'mom')
  // Bài giao `ngay` ngày trước (24 giờ × ngay), chưa bắt đầu.
  const cu = (id: string, soCau: number, ngay: number, dem = 0) => chua(id, soCau, -24 * ngay - dem)

  it('hằng số đúng tên và giá trị 0.Planer đặt', () => {
    expect(MOM_CHUA_BAT_DAU_SO_NGAY).toBe(3)
    expect(MOM_CHUA_BAT_DAU_TOI_DA).toBe(3)
  })

  it('em có 24 bài cũ + 1 bài hôm nay: viec[] đúng 1 mom, tonCuTong.soBai = 24, tai.cung chỉ tính bài hôm nay, không quá tải', () => {
    const cuHai = Array.from({ length: 24 }, (_, i) => cu(`CU${String(i).padStart(2, '0')}`, 5 + (i % 3), 5 + (i % 9), i))
    const kh = lapKeHoachNgay(dv({ mom: [...cuHai, chua('HOMNAY', 4, -1)] }))
    expect(tonMoi(kh).map((v) => v.id)).toEqual(['mom:HOMNAY'])
    expect(kh.tonCuTong).toEqual({ soBai: 24, soCau: cuHai.reduce((t, m) => t + m.soCau, 0) })
    expect(kh.tonCu).toHaveLength(24)
    expect(kh.tai.cung).toBe(4)
    expect(kh.tai.vuot).toBe(0)
    expect(kh.canhBao.some((c) => c.loai === 'qua_tai')).toBe(false)
    expect(kh.viec[0]).toMatchObject({ id: 'mom:HOMNAY', hien: true, cong: null })
  })

  it('tonCu: mới nhất trước, đúng bốn khoá {id, loai, soCau, giaoLuc}, không có hạn/nhãn/thuTu', () => {
    const kh = lapKeHoachNgay(dv({ mom: [cu('A', 3, 5), cu('B', 4, 9), cu('C', 5, 4)] }))
    expect(kh.tonCu.map((x) => x.id)).toEqual(['C', 'A', 'B'])
    expect(kh.tonCu[0]).toEqual({ id: 'C', loai: 'mom', soCau: 5, giaoLuc: iso(-24 * 4) })
    expect(Object.keys(kh.tonCu[0]!).sort()).toEqual(['giaoLuc', 'id', 'loai', 'soCau'])
    expect(kh.viec).toEqual([])
  })

  it('tối đa 3 bài trong 3 ngày: bài thứ 4, 5 (mới hơn bài cũ) cũng rơi vào tonCu, mới nhất trước', () => {
    const gan = ['G1', 'G2', 'G3', 'G4', 'G5'].map((id, i) => chua(id, 2, -1 - i * 2)) // -1h, -3h, -5h, -7h, -9h: cùng hôm nay
    const kh = lapKeHoachNgay(dv({ mom: [...gan, cu('CU', 6, 6)] }))
    expect(tonMoi(kh).map((v) => v.id).sort()).toEqual(['mom:G1', 'mom:G2', 'mom:G3'])
    expect(kh.tonCu.map((x) => x.id)).toEqual(['G4', 'G5', 'CU'])
    expect(kh.tonCuTong).toEqual({ soBai: 3, soCau: 2 + 2 + 6 })
    expect(kh.tai.cung).toBe(6)
  })

  it('ranh giới ngày VN: giao 00:00 VN của ngày thứ 3 (18/09) còn là việc, 23:59 VN ngày 17/09 đã là tồn cũ', () => {
    const vn = (s: string) => ({ id: s, soCau: 3, taoLuc: new Date(`${s}Z`).toISOString(), batDauLuc: null })
    const bien = { ...vn('2026-09-17T17:00:00.000'), id: 'BIEN-TRONG' } // = 00:00 ngày 18/09 giờ VN
    const ngoai = { ...vn('2026-09-17T16:59:00.000'), id: 'BIEN-NGOAI' } // = 23:59 ngày 17/09 giờ VN
    const kh = lapKeHoachNgay(dv({ mom: [bien, ngoai] }))
    expect(tonMoi(kh).map((v) => v.id)).toEqual(['mom:BIEN-TRONG'])
    expect(kh.tonCu.map((x) => x.id)).toEqual(['BIEN-NGOAI'])
  })

  it('bài chưa bắt đầu có ngày giao hỏng/rỗng → tồn cũ, không làm sập', () => {
    const kh = lapKeHoachNgay(dv({ mom: [{ id: 'HONG', soCau: 3, taoLuc: 'không phải ngày', batDauLuc: null }, { id: 'RONG', soCau: 3, taoLuc: '', batDauLuc: null }] }))
    expect(kh.viec).toEqual([])
    expect(kh.tonCu.map((x) => x.id).sort()).toEqual(['HONG', 'RONG'])
  })

  it('bài ĐÃ bắt đầu (120 phút đang chạy) luôn vào viec[], dù giao 5 ngày trước và dù nhiều bài (không giới hạn)', () => {
    const dang = ['D1', 'D2', 'D3', 'D4', 'D5'].map((id, i) => ({ id, soCau: 2, taoLuc: iso(-24 * 5), batDauLuc: iso(-0.2 - i * 0.1) }))
    const kh = lapKeHoachNgay(dv({ mom: [...dang, cu('CHUA-CU', 4, 6)] }))
    expect(tonMoi(kh).map((v) => v.id).sort()).toEqual(['mom:D1', 'mom:D2', 'mom:D3', 'mom:D4', 'mom:D5'])
    for (const v of tonMoi(kh)) expect(v).toMatchObject({ khan: true, batBuoc: true, nhan: 'khan_cap' })
    expect(kh.tonCu.map((x) => x.id)).toEqual(['CHUA-CU'])
  })

  it('bài bắt đầu từ 5 ngày trước (đã hết 120 phút) vẫn chỉ ở quaHan như cũ, không vào viec[] hay tonCu', () => {
    const kh = lapKeHoachNgay(dv({ mom: [{ id: 'HET', soCau: 7, taoLuc: iso(-24 * 6), batDauLuc: iso(-24 * 5) }] }))
    expect(kh.viec).toEqual([])
    expect(kh.tonCu).toEqual([])
    expect(kh.quaHan).toEqual([expect.objectContaining({ loai: 'mom', ma: 'HET' })])
  })

  it('tonCu KHÔNG đổi ngân sách, tải, cảnh báo hay thứ tự việc so với khi không có bài tồn', () => {
    const co = lapKeHoachNgay(dv({ mom: [chua('MOI', 4, -2), ...Array.from({ length: 12 }, (_, i) => cu(`T${i}`, 30, 6 + i))], cauToiHan: cauHan(8) }))
    const khong = lapKeHoachNgay(dv({ mom: [chua('MOI', 4, -2)], cauToiHan: cauHan(8) }))
    expect(co.nganSach).toEqual(khong.nganSach)
    expect(co.tai).toEqual(khong.tai)
    expect(co.canhBao).toEqual(khong.canhBao)
    expect(co.viec).toEqual(khong.viec)
    expect(co.tonCuTong.soBai).toBe(12)
    expect(khong.tonCu).toEqual([])
    expect(khong.tonCuTong).toEqual({ soBai: 0, soCau: 0 })
  })

  it('chống trùng on_lai chỉ theo bài nằm trong viec[]: qid của bài tồn cũ KHÔNG chặn câu ôn', () => {
    const cau = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'].map((q) => ({ qid: q, maDang: 'AA.BB', mocOnKe: '2026-09-19', lanSai: 1 }))
    const goc = lapKeHoachNgay(dv({ cauToiHan: cau }))
    const onLai = (kh: ReturnType<typeof lapKeHoachNgay>) => (kh.viec.find((v) => v.loai === 'on_lai')?.chiTiet.qid ?? []) as string[]
    const chon = onLai(goc)
    expect(chon.length).toBeGreaterThan(0)
    const tonCuCoQid = lapKeHoachNgay(dv({ cauToiHan: cau, mom: [{ ...cu('CU', 229, 6), qid: cau.map((c) => c.qid) }] }))
    expect(onLai(tonCuCoQid)).toEqual(chon) // 229 câu tồn không chặn ôn
    const trongViec = lapKeHoachNgay(dv({ cauToiHan: cau, mom: [{ ...chua('MOI', 2, -1), qid: chon }] }))
    for (const q of chon) expect(onLai(trongViec)).not.toContain(q)
  })

  it('tất định và không phụ thuộc thứ tự đầu vào', () => {
    const mom = [cu('A', 3, 5), chua('N1', 2, -3), cu('B', 4, 8), chua('N2', 2, -6), chua('N3', 2, -9), chua('N4', 2, -12)]
    const a = JSON.stringify(lapKeHoachNgay(dv({ mom })))
    expect(JSON.stringify(lapKeHoachNgay(dv({ mom: [...mom].reverse() })))).toBe(a)
    expect(JSON.stringify(lapKeHoachNgay(dv({ mom })))).toBe(a)
  })
})

describe('D1 thật: tồn cũ trong /hs/ke-hoach-ngay', () => {
  const themHs = (d: D1That, sbd: string) => d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES(?,'x','x')").run(sbd)
  const g = (gio: number) => new Date(Date.now() + gio * H).toISOString()
  const themMom = (d: D1That, sbd: string, id: string, soCau: number, taoGio: number, batGio: number | null = null) =>
    d.sql.prepare('INSERT INTO mom_bai(sbd,id,title,created_at,question_count,bank_key,started_at) VALUES(?,?,?,?,?,?,?)')
      .run(sbd, id, 't', g(taoGio), soCau, `mom/${sbd}/${id}.json`, batGio === null ? null : g(batGio))

  it('em 11037 kiểu thật: 24 bài cũ + 1 bài hôm nay → 1 việc mom, tonCu 24, không qua_tai, cổng không khoá; bài đã lưu kèm tonCu', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    for (let i = 0; i < 24; i++) themMom(d, 'S1', `cu_${String(i).padStart(2, '0')}`, 6, -24 * (4 + (i % 10)) - i)
    themMom(d, 'S1', 'moi_hom_nay', 4, -2)
    const r = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(r.ok).toBe(true)
    const viec = r.viec as { id: string; loai: string; hien: boolean }[]
    expect(viec.filter((v) => v.loai === 'mom').map((v) => v.id)).toEqual(['mom:moi_hom_nay'])
    expect(r.tonCuTong).toEqual({ soBai: 24, soCau: 24 * 6 })
    expect((r.tonCu as unknown[]).length).toBe(24)
    expect(r.tai.cung).toBe(4)
    expect((r.canhBao as { loai: string }[]).some((c) => c.loai === 'qua_tai')).toBe(false)
    expect(viec.every((v) => v.hien)).toBe(true)
    const luu = d.sql.prepare("SELECT viec_json FROM ke_hoach_ngay WHERE sbd='S1'").get() as { viec_json: string }
    expect(JSON.parse(luu.viec_json).tonCuTong).toEqual({ soBai: 24, soCau: 144 })
  })

  it('bài giao 5 ngày trước nhưng em VỪA bắt đầu 30 phút trước vẫn ở viec[] (khẩn); bài cũ chưa bắt đầu ở tonCu', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    themMom(d, 'S1', 'dang_lam', 6, -24 * 5, -0.5)
    themMom(d, 'S1', 'chua_bd_cu', 6, -24 * 5)
    const r = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect((r.viec as { id: string; khan: boolean }[]).find((v) => v.id === 'mom:dang_lam')).toMatchObject({ khan: true })
    expect((r.viec as { id: string }[]).map((v) => v.id)).not.toContain('mom:chua_bd_cu')
    expect((r.tonCu as { id: string }[]).map((x) => x.id)).toEqual(['chua_bd_cu'])
  })

  it('không xoá/sửa dòng nào của mom_bai: em vẫn thấy đủ 25 bài trong danh sách Mom', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    for (let i = 0; i < 25; i++) themMom(d, 'S1', `m_${i}`, 3, -24 * 6 - i)
    const truoc = d.chup('mom_bai')
    await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(d.chup('mom_bai')).toBe(truoc)
    expect(d.dem('mom_bai')).toBe(25)
  })
})
