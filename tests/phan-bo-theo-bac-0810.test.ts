// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  PHAN_BO_BAC, chiaTheoTrongSoCoTran, doTinHoSo, phanBoTheoBacHocSinh,
  trongSoTheoBac, xepCauMoiTheoZpd, type BacCauChienDich, type CauZpd,
} from '../src/lib/phan-bo-theo-bac'
import { phanBoMaTran2026 } from '../src/lib/rut-de-da-dung'

const tong = (x: ReturnType<typeof phanBoTheoBacHocSinh>) => Object.values(x).reduce((s, p) => s + p.biet + p.hieu + p.van_dung, 0)

describe('trọng số ZPD', () => {
  it.each([
    [0, [[0, .6], [1, .1]]],
    [.5, [[0, .6], [1, .25]]],
    [1, [[0, .6], [1, .35]]],
  ] as const)('T=0, v=%s đúng công thức và bỏ T-1', (v, muon) => {
    expect(trongSoTheoBac(0, v).map((x) => [x.bac, x.w])).toEqual(muon)
  })

  it('T=1 có đủ ba dải và T=2 bỏ T+1 ngoài thang 3 mức', () => {
    expect(trongSoTheoBac(1, .5)).toEqual([
      { bac: 0, w: .15 }, { bac: 1, w: .6 }, { bac: 2, w: .25 },
    ])
    expect(trongSoTheoBac(2, 1)).toEqual([{ bac: 2, w: .6 }])
  })

  it('độ tin tăng từ 4 tới 8 mẫu, không để hồ sơ mỏng lấn phân bố nền', () => {
    expect([0, 3, 4, 6, 8, 20].map(doTinHoSo)).toEqual([0, 0, .2, .6, 1, 1])
  })

  it('khóa hằng số quan trọng', () => {
    expect(PHAN_BO_BAC).toMatchObject({ W_LOI: .6, TRAN_THU_THACH: .2, ALPHA_MAC_DINH: .35, SO_CAU_DU_TIN: 4 })
  })
})

describe('phân bổ xem trước theo ma trận', () => {
  const dangTheoPhan = { D1: { phan: 'I' as const }, D2: { phan: 'II' as const }, D3: { phan: 'III' as const } }
  const hoSoTheoDang = Object.fromEntries(Object.keys(dangTheoPhan).map((d) => [d, { bacDich: 1 as const, tiLeKhacPhuc: .8, soGap: 10 }]))

  it.each([0, 1, 14, 28, 40, 100, 1000])('tổng luôn đúng n=%s', (n) => {
    expect(tong(phanBoTheoBacHocSinh({ n, dangTheoPhan, hoSoTheoDang }))).toBe(n)
  })

  it('thiếu hồ sơ và alpha=1 đều y hệt phân bổ cũ', () => {
    expect(phanBoTheoBacHocSinh({ n: 28, dangTheoPhan, hoSoTheoDang: {} })).toEqual(phanBoMaTran2026(28))
    expect(phanBoTheoBacHocSinh({ n: 28, dangTheoPhan, hoSoTheoDang, alpha: 1 })).toEqual(phanBoMaTran2026(28))
  })

  it('không đổi tổng câu từng phần và luôn tất định', () => {
    const a = phanBoTheoBacHocSinh({ n: 40, dangTheoPhan, hoSoTheoDang, alpha: 0 })
    const b = phanBoTheoBacHocSinh({ n: 40, dangTheoPhan, hoSoTheoDang, alpha: 0 })
    const nen = phanBoMaTran2026(40)
    expect(a).toEqual(b)
    for (const p of ['I', 'II', 'III'] as const) expect(a[p].biet + a[p].hieu + a[p].van_dung).toBe(nen[p].biet + nen[p].hieu + nen[p].van_dung)
  })
})

describe('bộ chọn ZPD trên kho chiến dịch thật', () => {
  const kho = (): CauZpd[] => {
    const ra: CauZpd[] = []
    for (const phan of ['I', 'II', 'III'] as const) for (let bac = 0 as BacCauChienDich; bac <= 3; bac = (bac + 1) as BacCauChienDich) {
      for (let i = 0; i < 20; i++) ra.push({ qid: `${phan}-${bac}-${i}`, phan, dang: `${phan}-D`, bac })
    }
    return ra
  }
  const hs = Object.fromEntries(['I', 'II', 'III'].map((p) => [`${p}-D`, { bacDich: 1 as const, tiLeKhacPhuc: .8, soGap: 10 }]))

  it('chọn đủ, không vượt T+1 và T+1 không quá 20%', () => {
    const r = xepCauMoiTheoZpd(kho(), 50, hs, .35)
    const chon = r.thuTu.slice(0, 50)
    expect(chon).toHaveLength(50)
    expect(Math.max(...chon.map((c) => c.bac))).toBe(2)
    expect(r.tomTat.thuThach).toBeLessThanOrEqual(Math.ceil(50 * .2))
    expect(r.tomTat.theoBac.reduce((s, n) => s + n, 0)).toBe(50)
  })

  it('hồ sơ chưa đủ tin giữ nguyên thứ tự nền', () => {
    const ds = kho()
    const mong = ds.slice(0, 20).map((c) => c.qid)
    const r = xepCauMoiTheoZpd(ds, 20, { 'I-D': { bacDich: 0, tiLeKhacPhuc: null, soGap: 3 } })
    expect(r.thuTu.slice(0, 20).map((c) => c.qid)).toEqual(mong)
  })

  it('thiếu ô vẫn bù đủ theo sức chứa và kết quả tất định', () => {
    const ds = kho().filter((c) => c.bac !== 1 || c.phan === 'I')
    const a = xepCauMoiTheoZpd(ds, 40, hs, 0)
    const b = xepCauMoiTheoZpd(ds, 40, hs, 0)
    expect(a.thuTu.slice(0, 40).map((c) => c.qid)).toEqual(b.thuTu.slice(0, 40).map((c) => c.qid))
    expect(a.tomTat.tong).toBe(40)
  })

  it('chia có trần luôn đúng tổng khi kho còn sức chứa', () => {
    expect(chiaTheoTrongSoCoTran(10, [9, 1, 0], [2, 20, 20]).reduce((s, n) => s + n, 0)).toBe(10)
  })
})

