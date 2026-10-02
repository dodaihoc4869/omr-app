// @vitest-environment node
// Luật đóng lỗi chung v2 (GĐ3): một luật cho mọi kênh, chỉ tính từ 29/09 (thầy 02/10).
import { describe, expect, it } from 'vitest'
import { phatLaiLoi, tachSongSinh, type LanLamLoi } from '../server/src/loi-hoc-luat'

const L = (ngay: string, kq: 0 | 1 | null, o: Partial<LanLamLoi> = {}): LanLamLoi => ({ luc: `${ngay}T03:00:00.000Z`, ngayVn: ngay, ketQua: kq, coHoTro: false, songSinh: false, nguon: 'thi', ...o })

describe('phatLaiLoi', () => {
  it('sai trước 29/09 không tính; đúng khi chưa từng sai ⇒ không phải lỗi', () => {
    expect(phatLaiLoi([L('2026-09-20', 0)], [], true, '2026-10-02').trangThai).toBe('khong_loi')
    expect(phatLaiLoi([L('2026-09-30', 1)], [], true, '2026-10-02').trangThai).toBe('khong_loi')
  })
  it('sai ⇒ mở, hạn hôm sau, lượt kế là song sinh; bỏ trống cũng là sai', () => {
    const r = phatLaiLoi([L('2026-09-30', null)], [], true, '2026-09-30')
    expect(r).toMatchObject({ trangThai: 'mo', saiCuoi: '2026-09-30', soLanSai: 1, denHan: '2026-10-01', nenSongSinh: true, nguonSai: 'thi' })
    expect(phatLaiLoi([L('2026-09-30', 0)], [], true, '2026-10-05').denHan).toBe('2026-10-05') // quá hạn ⇒ hôm nay
  })
  it('đóng: 2 ngày đúng tự làm, ≥1 song sinh, lượt cuối cách lần sai ≥3 ngày', () => {
    const a = [L('2026-09-30', 0), L('2026-10-01', 1, { songSinh: true })]
    expect(phatLaiLoi(a, [], true, '2026-10-01')).toMatchObject({ trangThai: 'cho_kiem', denHan: '2026-10-03', nenSongSinh: false })
    expect(phatLaiLoi([...a, L('2026-10-02', 1)], [], true, '2026-10-02').trangThai).toBe('cho_kiem') // mới cách 2 ngày
    const d = phatLaiLoi([...a, L('2026-10-03', 1)], [], true, '2026-10-03')
    expect(d).toMatchObject({ trangThai: 'dong', dongNgay: '2026-10-03', denHan: '2026-10-17' })
  })
  it('chưa đúng song sinh ⇒ chưa đóng (nếu kho có song sinh); không có song sinh ⇒ miễn', () => {
    const a = [L('2026-09-30', 0), L('2026-10-01', 1), L('2026-10-04', 1)]
    expect(phatLaiLoi(a, [], true, '2026-10-04').trangThai).toBe('cho_kiem')
    expect(phatLaiLoi(a, [], false, '2026-10-04').trangThai).toBe('dong')
  })
  it('cùng một ngày đúng hai lần chỉ tính một ngày', () => {
    const a = [L('2026-09-30', 0), L('2026-10-03', 1, { songSinh: true }), { ...L('2026-10-03', 1), luc: '2026-10-03T09:00:00.000Z' }]
    expect(phatLaiLoi(a, [], true, '2026-10-03')).toMatchObject({ trangThai: 'cho_kiem', ngayDung: ['2026-10-03'] })
  })
  it('lượt có hỗ trợ và lượt trong 12 giờ sau khi đọc lời giải không tính', () => {
    const a = [L('2026-09-30', 0), L('2026-10-01', 1, { songSinh: true }), L('2026-10-04', 1, { coHoTro: true })]
    expect(phatLaiLoi(a, [], true, '2026-10-04').trangThai).toBe('cho_kiem')
    const b = [L('2026-09-30', 0), L('2026-10-01', 1, { songSinh: true }), L('2026-10-04', 1)]
    expect(phatLaiLoi(b, ['2026-10-04T00:00:00.000Z'], true, '2026-10-04').trangThai).toBe('cho_kiem')
    expect(phatLaiLoi(b, ['2026-10-03T00:00:00.000Z'], true, '2026-10-04').trangThai).toBe('dong') // đọc từ 27 giờ trước
    // lượt SAI ngay sau khi đọc cũng không tính (có hỗ trợ ⇒ không tính đúng, không tính sai)
    expect(phatLaiLoi([L('2026-10-01', 0)], ['2026-10-01T01:00:00.000Z'], true, '2026-10-01').trangThai).toBe('khong_loi')
  })
  it('sai lại sau khi đã đúng ⇒ mở lại từ đầu; duy trì 14 rồi 30 ngày', () => {
    const a = [L('2026-09-30', 0), L('2026-10-01', 1, { songSinh: true }), L('2026-10-02', 0)]
    expect(phatLaiLoi(a, [], true, '2026-10-02')).toMatchObject({ trangThai: 'mo', soLanSai: 2, ngayDung: [] })
    const d = [L('2026-09-30', 0), L('2026-10-01', 1, { songSinh: true }), L('2026-10-03', 1)]
    expect(phatLaiLoi([...d, L('2026-10-17', 1)], [], true, '2026-10-17')).toMatchObject({ trangThai: 'dong', mocDuyTri: 1, denHan: '2026-11-02' })
    expect(phatLaiLoi([...d, L('2026-10-17', 1), L('2026-11-02', 1)], [], true, '2026-11-02')).toMatchObject({ trangThai: 'duy_tri', denHan: '' })
    expect(phatLaiLoi([...d, L('2026-10-17', 0)], [], true, '2026-10-17')).toMatchObject({ trangThai: 'mo', soLanSai: 2 })
  })
})

describe('tachSongSinh', () => {
  it('gốc, song sinh, hậu tố lượt game', () => {
    expect(tachSongSinh('12-KT-I-6')).toEqual({ goc: '12-KT-I-6', songSinh: null })
    expect(tachSongSinh('12-KT-I-6~ss1')).toEqual({ goc: '12-KT-I-6', songSinh: 1 })
    expect(tachSongSinh('12-KT-I-6~ss0#3')).toEqual({ goc: '12-KT-I-6', songSinh: 0 })
  })
})
