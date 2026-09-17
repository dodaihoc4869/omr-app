import { describe, expect, it } from 'vitest'
import { phanTichGianLanBtvn, ThiThatBaseline, ThongTinHocSinhBtvn } from '../server/src/gian-lan-btvn'

describe('Thuật toán phát hiện gian lận nộp BTVN', () => {
  it('Không gắn cờ gian lận cho học sinh học thật thi thật điểm cao', () => {
    const dsEm: ThongTinHocSinhBtvn[] = [
      {
        sbd: '11001',
        hoTen: 'Trần Văn Giỏi',
        nopLuc: '2026-09-17T20:00:00.000Z',
        soDung: 30,
        soCau: 32,
        thuHoi: false,
        dap_an_json: JSON.stringify({
          'DH-11-I-1': 'A',
          'DH-11-I-2': 'B',
          'DH-11-III-1': '45',
          'DH-11-III-2': '12.5',
        }),
      },
    ]

    const mapThiThat = new Map<string, ThiThatBaseline>()
    mapThiThat.set('11001', {
      sbd: '11001',
      diemTB: 8.75,
      diemMax: 9.25,
      soCa: 3,
      tongRoiMan: 0,
    })

    const ketQua = phanTichGianLanBtvn(dsEm, mapThiThat)
    const em = ketQua.get('11001')!
    expect(em.gianLan).toBe(false)
    expect(em.xacSuatGianLan).toBeLessThan(40)
  })

  it('Phát hiện độ lệch năng lực bất thường khi thi thật 4.0đ mà BTVN 9.5đ', () => {
    const dsEm: ThongTinHocSinhBtvn[] = [
      {
        sbd: '11002',
        hoTen: 'Lê Văn Lệch',
        nopLuc: '2026-09-17T20:10:00.000Z',
        soDung: 31,
        soCau: 32, // ~9.69 điểm
        thuHoi: false,
        dap_an_json: JSON.stringify({
          'DH-11-I-1': 'A',
          'DH-11-I-2': 'B',
          'DH-11-III-1': '45',
          'DH-11-III-2': '12.5',
        }),
      },
    ]

    const mapThiThat = new Map<string, ThiThatBaseline>()
    mapThiThat.set('11002', {
      sbd: '11002',
      diemTB: 4.25,
      diemMax: 4.5,
      soCa: 2,
      tongRoiMan: 4,
    })

    const ketQua = phanTichGianLanBtvn(dsEm, mapThiThat)
    const em = ketQua.get('11002')!
    expect(em.gianLan).toBe(true)
    expect(em.xacSuatGianLan).toBeGreaterThanOrEqual(70)
    expect(em.lyDoGianLan).toContain('Lệch ca thi')
  })

  it('Phát hiện 2 học sinh chép bài nhau nộp cách nhau 5 phút', () => {
    const dapAnChung = {
      'DH-11-I-1': 'A',
      'DH-11-I-2': 'C',
      'DH-11-I-3': 'D',
      'DH-11-I-4': 'B',
      'DH-11-II-1': 'DDSS',
      'DH-11-II-2': 'SDDD',
      'DH-11-III-1': '78',
      'DH-11-III-2': '5',
      'DH-11-III-3': '0.39',
      'DH-11-III-4': '100',
    }

    const dsEm: ThongTinHocSinhBtvn[] = [
      {
        sbd: '11060',
        hoTen: 'Nguyễn Thị Phương Chúc',
        nopLuc: '2026-09-17T22:49:00.000Z',
        soDung: 28,
        soCau: 32,
        thuHoi: false,
        dap_an_json: JSON.stringify(dapAnChung),
      },
      {
        sbd: '11067',
        hoTen: 'Trần Thị Thu Ngân',
        nopLuc: '2026-09-17T22:44:00.000Z', // nộp cách 5 phút
        soDung: 28,
        soCau: 32,
        thuHoi: false,
        dap_an_json: JSON.stringify(dapAnChung),
      },
    ]

    const mapThiThat = new Map<string, ThiThatBaseline>()
    mapThiThat.set('11060', {
      sbd: '11060',
      diemTB: 8.0,
      diemMax: 8.25,
      soCa: 2,
      tongRoiMan: 0,
    })
    mapThiThat.set('11067', {
      sbd: '11067',
      diemTB: 5.5,
      diemMax: 5.5,
      soCa: 1,
      tongRoiMan: 0,
    })

    const ketQua = phanTichGianLanBtvn(dsEm, mapThiThat)
    const em67 = ketQua.get('11067')!
    const em60 = ketQua.get('11060')!

    expect(em67.gianLan).toBe(true)
    expect(em67.xacSuatGianLan).toBeGreaterThanOrEqual(80)
    expect(em67.lyDoGianLan).toContain('Khớp')
    expect(em67.lyDoGianLan).toContain('11060')

    expect(em60.gianLan).toBe(true)
    expect(em60.xacSuatGianLan).toBeGreaterThanOrEqual(80)
    expect(em60.lyDoGianLan).toContain('11067')
  })
})
