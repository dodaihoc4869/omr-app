// @vitest-environment node
// PHÂN BỔ CÂU THEO HỒ SƠ 08/10: số lượng riêng, bắt buộc tối đa năng lực + 1, nợ sai không bị lọc, thẻ nâng bậc.
import { describe, expect, it } from 'vitest'
import {
  bacThuThachTiepTheo, lapKeHoachNgay, mucCaNhan, phatLaiCau, tranNgayTheoHoSo,
  type CauSrs, type HangEm, type TrangThaiCau,
} from '../server/src/srs2-loi'
import { tinhThuSucThem, type KeHoachDaChot, type MetaCau } from '../server/src/srs2-d1'

const HOM_NAY = '2026-10-08'
const HAN = '2026-11-08'
const MUC = ['NB', 'TH', 'VD', 'VDC'] as const

function khoMoi(soMoiMuc = 20): { cau: CauSrs[]; tt: Map<string, TrangThaiCau> } {
  const cau: CauSrs[] = []
  const tt = new Map<string, TrangThaiCau>()
  for (let m = 0; m < MUC.length; m++) for (let i = 0; i < soMoiMuc; i++) {
    const qid = `${MUC[m]}-${i}`
    cau.push({ qid, phan: 'II', mucDo: MUC[m], dang: 'D1', nguon: 'chien_dich' })
    tt.set(qid, phatLaiCau(qid, [], HAN))
  }
  return { cau, tt }
}

const hang = (h: HangEm) => ({ hangTheoDang: { D1: h }, hangChung: h, phanBoTheoHoSo: true as const })

describe('phần bắt buộc cá nhân hoá', () => {
  it('trần lớp 40 thành 24 / 30 / 36 / 40 theo L1 → L4', () => {
    expect((['L1', 'L2', 'L3', 'L4'] as const).map((h) => tranNgayTheoHoSo(40, h))).toEqual([24, 30, 36, 40])
    expect(tranNgayTheoHoSo(49, 'L1')).toBe(30)
    expect(tranNgayTheoHoSo(49, 'L2')).toBe(42)
    expect(tranNgayTheoHoSo(5, 'L1')).toBe(5)
  })

  it.each([
    ['L1', 24, 1],
    ['L2', 30, 2],
    ['L3', 36, 3],
    ['L4', 40, 3],
  ] as const)('%s nhận đúng ngân sách và không có câu mới vượt năng lực + 1', (h, soCau, mucToiDa) => {
    const { cau, tt } = khoMoi()
    const kh = lapKeHoachNgay(cau, tt, { homNay: HOM_NAY, hanNop: HAN, tranNgay: 40, tranHuyetChien: 40, raiDeu: false, ...hang(h) })
    const theo = new Map(cau.map((c) => [c.qid, c]))
    const ds = [...kh.dao, ...kh.doan].map((q) => theo.get(q)!)
    expect(ds).toHaveLength(soCau)
    expect(Math.max(...ds.map((c) => mucCaNhan(c.mucDo)))).toBeLessThanOrEqual(mucToiDa)
    expect(kh.tran).toBe(soCau)
  })

  it('hạng theo từng dạng: cùng một em, dạng yếu dừng ở TH còn dạng khá được tới VDC', () => {
    const { cau, tt } = khoMoi(10)
    const them: CauSrs[] = cau.filter((c) => c.mucDo === 'VDC').map((c) => ({ ...c, qid: `B-${c.qid}`, dang: 'D2' }))
    for (const c of them) tt.set(c.qid, phatLaiCau(c.qid, [], HAN))
    const kh = lapKeHoachNgay([...cau, ...them], tt, {
      homNay: HOM_NAY, hanNop: HAN, tranNgay: 40, tranHuyetChien: 40, raiDeu: false,
      hangChung: 'L2', hangTheoDang: { D1: 'L1', D2: 'L3' }, phanBoTheoHoSo: true,
    })
    const theo = new Map([...cau, ...them].map((c) => [c.qid, c]))
    const ds = [...kh.dao, ...kh.doan].map((q) => theo.get(q)!)
    expect(ds.filter((c) => c.dang === 'D1').every((c) => mucCaNhan(c.mucDo) <= 1)).toBe(true)
    expect(ds.some((c) => c.dang === 'D2' && mucCaNhan(c.mucDo) === 3)).toBe(true)
  })

  it('câu đã sai VDC vẫn đi trước với em L1: giới hạn độ khó chỉ lọc câu mới, không cắt siêu vòng lặp', () => {
    const { cau, tt } = khoMoi()
    const qid = 'NO-VDC'
    cau.unshift({ qid, phan: 'II', mucDo: 'VDC', dang: 'D1', nguon: 'chien_dich' })
    tt.set(qid, phatLaiCau(qid, [{ qid, ngay: '2026-10-07', luc: '2026-10-07T03:00:00Z', dung: false, coGoiY: false }], HAN))
    const kh = lapKeHoachNgay(cau, tt, { homNay: HOM_NAY, hanNop: HAN, tranNgay: 40, tranHuyetChien: 40, raiDeu: false, ...hang('L1') })
    expect([...kh.dao, ...kh.doan]).toContain(qid)
    expect([...kh.dao, ...kh.doan].filter((q) => q !== qid).map((q) => cau.find((c) => c.qid === q)!).every((c) => mucCaNhan(c.mucDo) <= 1)).toBe(true)
  })
})

describe('thẻ nâng bậc sau khi hoàn thành', () => {
  const kh: KeHoachDaChot = {
    ngay: HOM_NAY, chienDichId: 'CD', dao: ['xong'], doan: [], huyetChien: false, tong: 1, conDao: [], conDoan: [],
  }
  const taoHoSo = () => {
    const { cau, tt } = khoMoi(8)
    const meta = new Map<string, MetaCau>(cau.map((c) => [c.qid, {
      qid: c.qid, maDe: 'DE', version: 'v1', group: `g-${c.qid}`, phan: c.phan, mucDo: c.mucDo,
      dang: c.dang ?? null, tenDang: c.dang ?? null, sao: 0, tuLuan: false,
    }]))
    return {
      cau, tt, meta, qidCaSai: new Set<string>(),
      chienDich: { id: 'CD', ten: 'CD', sbd: new Set(['S1']), maDe: ['DE'], qids: cau.map((c) => c.qid), hanNop: HAN, theLucNgay: 40, huyetChien: false, raiDeu: false, trangThai: 'dang_chay' as const, taoLuc: '', mocBatDau: '', batDau: HOM_NAY },
    }
  }

  it.each([
    ['L1', 'Thông hiểu'], ['L2', 'Vận dụng'], ['L3', 'Vận dụng cao'],
  ] as const)('%s chỉ được mời đúng một bậc cao hơn: %s', (h, nhan) => {
    const hs = taoHoSo()
    const r = tinhThuSucThem(kh, hs, true, new Set(), { hangChung: h, hangTheoDang: { D1: h } })
    expect(r.duoc).toBe(true)
    expect(r.mucDo).toBe(nhan)
    expect(r.ung.every((c) => mucCaNhan(c.mucDo) === bacThuThachTiepTheo(h))).toBe(true)
  })

  it('L4 tiếp tục bằng biến thể Vận dụng cao mới thay vì bịa ra bậc thứ năm', () => {
    const r = tinhThuSucThem(kh, taoHoSo(), true, new Set(), { hangChung: 'L4', hangTheoDang: { D1: 'L4' } })
    expect(r).toMatchObject({ duoc: true, mucDo: 'Vận dụng cao' })
    expect(r.ung.every((c) => c.mucDo === 'VDC')).toBe(true)
  })
})
