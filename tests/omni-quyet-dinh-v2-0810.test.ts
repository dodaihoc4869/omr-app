// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { chamCauQuyetDinhV2, chamTapQuyetDinhV2, doTinVkn, xacSuatConNho } from '../server/src/omni-quyet-dinh-v2'
import type { HoSoOmniEm, HoSoVkn, QCau } from '../server/src/omni-kieu'

const vkn = (id: string, p: number, n = 10, ngayCuoi = '2026-10-07'): HoSoVkn => ({
  vkn: id, p, nTuLam: n, nCau: Math.min(n, 6), nNgay: Math.min(n, 4), nTroiChay: 2,
  nCauLaDung: 2, diemSprt: 0, trangThai: 'dang_do', ngayCuoi, dayLai: false,
})
const hs = (vs: HoSoVkn[]): HoSoOmniEm => ({
  sbd: '11010', vkn: Object.fromEntries(vs.map((x) => [x.vkn, x])), sEm: .08, nVung: 0, nSaiVung: 0,
  tau: 0, nTau: 0, khungGio: { truoc18: { n: 0, soY: 0 }, '18_20': { n: 0, soY: 0 }, '20_22': { n: 0, soY: 0 }, '22_24': { n: 0, soY: 0 }, sau24: { n: 0, soY: 0 } },
  luotHomNay: 0, cursor: '', phienBan: 'test',
})
const cau = (qid: string, nen: string): QCau => ({ qid, phan: 'I', maDang: 'D1', mucDo: 'hieu', vkn: [`nen:${nen}`], nguon: 'thay' })

describe('Decision Engine OMNI–ZPD v2', () => {
  it('co mẫu nhỏ và giảm xác suất nhớ theo thời gian', () => {
    expect(doTinVkn(vkn('nen:x', .8, 2))).toBeLessThan(doTinVkn(vkn('nen:x', .8, 20)))
    const h = vkn('nen:x', .9, 8, '2026-09-20')
    expect(xacSuatConNho(h, '2026-10-08')).toBeLessThan(h.p)
  })

  it('hạ câu nâng cao khi thiếu tiền quyết và ưu tiên câu mở khoá yếu', () => {
    const em = hs([
      vkn('nen:ti_le_mol_phuong_trinh', .82),
      vkn('nen:can_bang_phuong_trinh', .35),
      vkn('nen:doi_mol_khoi_luong', .4),
    ])
    const nangCao = chamCauQuyetDinhV2(em, cau('q-advanced', 'ti_le_mol_phuong_trinh'), '2026-10-08')
    const nenYeu = chamCauQuyetDinhV2(em, cau('q-foundation', 'can_bang_phuong_trinh'), '2026-10-08')
    expect(nangCao.sanSangTienQuyet).toBeLessThan(.5)
    expect(nenYeu.thuongMoKhoa).toBeGreaterThan(0)
    expect(nenYeu.diemMoi).toBeGreaterThan(nangCao.diemMoi)
  })

  it('tính tất định và dùng thời gian để tối ưu giá trị/phút trong cùng hồ sơ', () => {
    const em = hs([vkn('nen:tinh_chat_hoa_hoc', .7)])
    const q1 = cau('q1', 'tinh_chat_hoa_hoc'), q2 = cau('q2', 'tinh_chat_hoa_hoc')
    const beta = new Map([['q1', Math.log(30_000)], ['q2', Math.log(120_000)]])
    const a = chamTapQuyetDinhV2(em, [q1, q2], '2026-10-08', beta)
    const b = chamTapQuyetDinhV2(em, [q1, q2], '2026-10-08', beta)
    expect(a).toEqual(b)
    expect(a.diem.q1).toBeGreaterThan(a.diem.q2)
  })
})
