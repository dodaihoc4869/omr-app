// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createEmptyCard, fsrs, Rating } from 'ts-fsrs'
import { phatLaiSuKien, dungLaiHoSo, type SuKienDoc } from '../server/src/ho-so-nam-kt'
import { CAU_HINH_FSRS, ngayVnFsrs } from '../server/src/lich-on-fsrs'
import { PHIEN_BAN_KE_HOACH } from '../server/src/ho-so-cau-hinh'
import { docDauVao, lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { taoD1That } from './_d1-that'

const event = (day: number, result: 0 | 1 | null, extra: Partial<SuKienDoc> = {}): SuKienDoc => ({
  khoa: `k${day}`, sbd: 'S1', qid: 'Q1', nguon: 'on_lai', ketQua: result, giay: 60,
  luc: `2026-09-${String(day).padStart(2, '0')}T03:00:00Z`, ngayVn: `2026-09-${String(day).padStart(2, '0')}`, maDang: 'ES.1', chuyenDe: 'Este', ...extra,
})
const one = (ds: SuKienDoc[]) => phatLaiSuKien(ds).cau[0]!
const NOW = Date.parse('2026-09-23T03:00:00Z')

async function fixture() {
  const d = taoD1That()
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES('S1','Em 1','x'); INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('D','Q1','v','g','ES.1','{}')")
  await ghiSuKien(d.env, [{ nguon: 'on_lai', maNguon: 'M', sbd: 'S1', qid: 'Q1', lan: 1, ketQua: 1, luc: '2026-09-01T03:00:00Z', maDang: 'ES.1', chuyenDe: 'Este' }])
  return d
}

describe('FSRS-6 nối thật vào lịch hồ sơ', () => {
  it('mốc trùng thư viện chính thức qua Again/Good với khoảng cách khác nhau; nhãn phục hồi giữ riêng', () => {
    const f = fsrs(CAU_HINH_FSRS), ds = [event(1, 0), event(2, 1), event(8, 1), event(20, 1)]
    let card = createEmptyCard(new Date(ds[0].luc))
    for (let i = 0; i < ds.length; i++) {
      card = f.next(card, new Date(ds[i].luc), ds[i].ketQua === 0 ? Rating.Again : Rating.Good).card
      expect(one(ds.slice(0, i + 1)).mocOnKe).toBe(ngayVnFsrs(card.due.getTime()))
    }
    expect(one(ds)).toMatchObject({ trangThai: 'da_khac_phuc', lanSai: 1, ngayDungKhacNhau: 3 })
  })
  it('cùng kết quả nhưng khác khoảng cách thực cho mốc khác; retention cao hẹn sớm hơn', () => {
    expect(one([event(1, 1), event(2, 1)]).mocOnKe).not.toBe(one([event(1, 1), event(10, 1)]).mocOnKe)
    const ds = [event(1, 1), event(10, 1)]
    expect(phatLaiSuKien(ds, undefined, { retention: .95 }).cau[0].mocOnKe! < phatLaiSuKien(ds, undefined, { retention: .8 }).cau[0].mocOnKe!).toBe(true)
    expect(() => phatLaiSuKien(ds, undefined, { retention: 1 })).toThrow(RangeError)
  })
  it('Good lặp trong ngày không tăng mốc; sai sau đúng chỉ thay quan sát ngày bằng Again', () => {
    const a = event(1, 1), b = event(1, 1, { khoa: 'same-day-2', luc: '2026-09-01T09:00:00Z', giay: 1 })
    expect(one([a, b]).mocOnKe).toBe(one([a]).mocOnKe)
    const wrong = { ...b, ketQua: 0 as const }, later = { ...b, khoa: 'same-day-3', luc: '2026-09-01T10:00:00Z' }
    expect(one([a, wrong, later]).mocOnKe).toBe(one([{ ...a, ketQua: 0 }]).mocOnKe)
    expect(one([a, wrong, later, event(2, 1)]).mocOnKe).toBe(one([{ ...a, ketQua: 0 }, event(2, 1)]).mocOnKe)
  })
  it('bỏ trống không là sai và không dời lịch cũ; các lần bỏ trống không hoãn mãi', () => {
    expect(one([event(1, null), event(2, null), event(3, null)])).toMatchObject({ lanSai: 0, lanTrong: 3, mocOnKe: '2026-09-02', canDayLai: false })
    expect(one([event(1, 1), event(2, null)]).mocOnKe).toBe(one([event(1, 1)]).mocOnKe)
  })
  it('khử khóa trùng, tách học sinh, không đọc đồng hồ/random, không sửa input', () => {
    const a = event(1, 1), b = event(2, 0, { sbd: 'S2' }), ds = [a, b, a], input = JSON.stringify(ds)
    const now = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('clock forbidden') })
    const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('random forbidden') })
    try {
      const out = phatLaiSuKien(ds)
      expect(out).toEqual(phatLaiSuKien([...ds].reverse()))
      expect(out.cau.map(c => [c.sbd, c.lanGap, c.lanSai])).toEqual([['S1', 1, 0], ['S2', 1, 1]])
      expect(JSON.stringify(ds)).toBe(input)
    } finally { now.mockRestore(); random.mockRestore() }
  })
  it('ngày VN lấy từ timestamp; từ 23:30 qua 00:30 là hai ngày, bỏ timestamp sai và sự kiện tương lai', () => {
    const a = event(1, 1, { luc: '2026-09-01T16:30:00Z', ngayVn: 'WRONG' })
    const b = event(2, 1, { luc: '2026-09-01T17:30:00Z', ngayVn: 'WRONG' })
    expect(one([a, b]).ngayDungKhacNhau).toBe(2)
    expect(phatLaiSuKien([a, b, event(3, 0, { luc: 'bad' })], undefined, { denLuc: Date.parse(a.luc) }).cau).toEqual(phatLaiSuKien([a]).cau)
  })
  it('3 lần sai giữ canDayLai, một lần đúng gỡ nhãn mà không bịa đã khắc phục', () => {
    const ds = [event(1, 0), event(2, 0), event(3, 0)]
    expect(one(ds).canDayLai).toBe(true)
    expect(one([...ds, event(4, 1)])).toMatchObject({ canDayLai: false, trangThai: 'dang_on' })
  })
})

describe('D1 migration lười và phục vụ câu tới hạn', () => {
  it('version cũ, số sổ không đổi vẫn dựng một lần; lượt tiếp không đọc lại sổ', async () => {
    const d = await fixture()
    await lapVaLuuKeHoach(d.env, ['S1'], NOW)
    d.sql.exec("UPDATE ke_hoach_ngay SET phien_ban=1; UPDATE nam_kt_cau SET moc_on_ke='2099-01-01'")
    let replayReads = 0
    const prepare = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = q => { if (q.includes('SELECT khoa, sbd, qid, nguon, ket_qua')) replayReads++; return prepare(q) }
    await lapVaLuuKeHoach(d.env, ['S1'], NOW)
    expect(replayReads).toBe(1)
    expect(d.sql.prepare('SELECT phien_ban FROM ke_hoach_ngay').get()).toMatchObject({ phien_ban: PHIEN_BAN_KE_HOACH })
    expect(d.sql.prepare('SELECT moc_on_ke FROM nam_kt_cau').get()).toMatchObject({ moc_on_ke: '2026-09-04' })
    await lapVaLuuKeHoach(d.env, ['S1'], NOW)
    expect(replayReads).toBe(1)
  })
  it('replay lỗi giữ version cũ để lượt sau tự thử lại', async () => {
    const d = await fixture()
    await lapVaLuuKeHoach(d.env, ['S1'], NOW)
    d.sql.exec('UPDATE ke_hoach_ngay SET phien_ban=1')
    const prepare = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = q => { if (q.includes('SELECT khoa, sbd, qid, nguon, ket_qua')) throw new Error('fixture replay unavailable'); return prepare(q) }
    await lapVaLuuKeHoach(d.env, ['S1'], NOW)
    expect(d.sql.prepare('SELECT phien_ban FROM ke_hoach_ngay').get()).toMatchObject({ phien_ban: 1 })
    d.env.DB.prepare = prepare
    await lapVaLuuKeHoach(d.env, ['S1'], NOW)
    expect(d.sql.prepare('SELECT phien_ban FROM ke_hoach_ngay').get()).toMatchObject({ phien_ban: PHIEN_BAN_KE_HOACH })
  })
  it('câu chưa từng sai tới hạn vào hàng ôn, trước hạn không vào; hai đường D1/bộ nhớ khớp', async () => {
    const d = await fixture(), h = await dungLaiHoSo(d.env, ['S1'], new Date(NOW).toISOString())
    expect((await docDauVao(d.env, ['S1'], NOW)).get('S1')!.cauToiHan.map(c => c.qid)).toContain('Q1')
    expect((await docDauVao(d.env, ['S1'], NOW, { hoSoSan: h.hoSo })).get('S1')!.cauToiHan.map(c => c.qid)).toContain('Q1')
    const early = Date.parse('2026-09-02T03:00:00Z')
    expect((await docDauVao(d.env, ['S1'], early)).get('S1')!.cauToiHan).toEqual([])
    d.sql.exec('UPDATE nam_kt_cau SET can_day_lai=1')
    expect((await docDauVao(d.env, ['S1'], NOW)).get('S1')!.cauToiHan).toEqual([])
  })
  it('future log không vào hồ sơ; tới thời điểm thật tự đổi fingerprint và dựng lại', async () => {
    const d = await fixture()
    await ghiSuKien(d.env, [{ nguon: 'on_lai', maNguon: 'M', sbd: 'S1', qid: 'Q1', lan: 2, ketQua: 0, luc: '2026-09-24T03:00:00Z' }])
    await lapVaLuuKeHoach(d.env, ['S1'], NOW)
    expect(d.sql.prepare('SELECT lan_gap,lan_sai FROM nam_kt_cau').get()).toMatchObject({ lan_gap: 1, lan_sai: 0 })
    await lapVaLuuKeHoach(d.env, ['S1'], Date.parse('2026-09-24T04:00:00Z'))
    expect(d.sql.prepare('SELECT lan_gap,lan_sai FROM nam_kt_cau').get()).toMatchObject({ lan_gap: 2, lan_sai: 1 })
  })
})
