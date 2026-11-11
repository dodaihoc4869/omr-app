// @vitest-environment jsdom
// THẺ «NỢ CÂU» trên màn Hôm nay (thầy 11/11 duyệt bản vẽ docs/ban-ve-lam-bu-1111; «Ghi rõ nợ câu»; «Tính lãi như ngân hàng luôn»).
// Khoá: bộ đọc chặt · số sống theo «đã làm hôm nay» cùng luật máy chủ · bốn trạng thái của thẻ · bấm ô chọn gửi đúng lệnh rồi nạp lại Sảnh.
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { docNoCau, laiDem, noCauLuc, type NoCau } from '../src/lib/no-cau-doc'
import { tomTatNo, laiNo } from '../server/src/no-cau'
import { docTomTatGoi7 } from '../src/lib/goi-bai-7'

const goi = vi.hoisted(() => vi.fn())
vi.mock('../src/components/hoa2/api', () => ({ goiHoa2: goi }))
import TheNoCau from '../src/components/hoc-tap/TheNoCau'

afterEach(() => { cleanup(); goi.mockReset() })
const MAY_CHU = tomTatNo({ no: 42, lan: 0, loai: { moi: 20, sua: 14, on: 6, lai: 2 }, den: '2026-11-11' }, { kieu: 'toi_thieu', so: 11 }, 0, 39)!
const nc = docNoCau(MAY_CHU)!

describe('bộ đọc + số sống', () => {
  it('đọc đúng tóm tắt máy chủ; lệch kiểu ⇒ null (không vẽ thẻ)', () => {
    expect(nc).toEqual({ no: 42, theoLoai: { moi: 20, sua: 14, on: 6, lai: 2 }, toiThieu: 11, lan: 0, phaiTraHet: false, kieu: 'toi_thieu', so: 11, lai: 5 })
    for (const x of [null, undefined, 'x', {}, { ...MAY_CHU, no: 0 }, { ...MAY_CHU, kieu: 'bua' }, { ...MAY_CHU, so: 99 }, { ...MAY_CHU, lan: 'ba' }, { ...MAY_CHU, lai: -1 }]) expect(docNoCau(x)).toBeNull()
  })
  it('tóm tắt Gói 7 giữ nguyên trường noCau', () => {
    const t = docTomTatGoi7({ bat: true, ngay: '2026-11-12', toiThieu: 39, daLamHomNay: 0, tuLamCon: 39, tiepCanCon: 0, thieuPhu: 0, thieuNgay: 0, canHoTro: false, kienThucCu: { tong: 0, dat: 0, tyLe: null },
      goi: [{ id: 'g', ten: 'Bài 8', batDau: '2026-11-08', han: '2026-11-17', tong: 10, daGap: 0, con: 10, quota: 5, gapHomNay: 0, quaHan: false, canBoSung: 0, to: ['A'], nguonDayDu: true }], diemDaDo: [], noCau: MAY_CHU })
    expect(docNoCau(t?.noCau)).toEqual(nc)
  })
  it('số sống khớp máy chủ ở mọi số câu đã làm; lãi khớp', () => {
    for (const lam of [0, 5, 11, 20, 39, 45, 80]) {
      const m = tomTatNo({ no: 42, lan: 0, loai: { moi: 42, sua: 0, on: 0, lai: 0 }, den: 'x' }, { kieu: 'toi_thieu', so: 11 }, lam, 39)!
      expect(noCauLuc(nc, lam, 39)).toMatchObject({ daTra: m.daTra, con: m.con })
    }
    expect(noCauLuc(nc, 5, 39)).toEqual({ daTra: 5, con: 37, conTra: 6 })
    expect(noCauLuc(nc, 11, 39)).toEqual({ daTra: 11, con: 31, conTra: 0 })
    for (const c of [0, 1, 19, 20, 31, 84]) expect(laiDem(c, 5)).toBe(laiNo(c))
  })
})

describe('thẻ', () => {
  const ve = (x: NoCau, lam: number, muc: number, them: { duMuc?: boolean; onDoi?: () => void } = {}) => {
    const l = noCauLuc(x, lam, muc)
    return render(<TheNoCau nc={x} daTra={l.daTra} con={l.con} gon={l.conTra === 0} duMuc={!!them.duMuc} token="tk" onDoi={them.onDoi} />)
  }
  it('còn phải trả: ghi rõ nợ câu, theo loại (có lãi), hai ô chọn, luật tối thiểu + lãi đêm nay', () => {
    const { container } = ve(nc, 0, 39)
    const the = container.querySelector('.nc-the')!
    expect(the.getAttribute('aria-label')).toBe('Nợ câu')
    expect(the.querySelector('.nc-nhan')!.textContent).toBe('Nợ câu')
    expect(the.querySelector('.nc-chip')!.textContent).toBe('Trả tối thiểu: lần 1/3')
    expect(the.querySelector('.nc-so')!.textContent).toBe('42câu đang nợ')
    expect(the.querySelector('.nc-loai')!.textContent).toBe('Câu mới 20 · Câu sửa 14 · Câu ôn 6 · Lãi 2')
    const nut = [...the.querySelectorAll('.nc-nut')]
    expect(nut.map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([['Trả tối thiểu11 câu', 'true'], ['Trả hết42 câu', 'false']])
    expect(the.querySelector('.nc-ghi')!.textContent).toBe('Tối thiểu = 25 % số nợ, ít nhất 6 câu. Phần còn nợ tính lãi 5 % mỗi đêm: đêm nay cộng 2 câu. Câu lãi là câu ôn dạng em hay sai.')
  })
  it('bấm «Trả hết» gửi lệnh hoc-tap-no-cau-chon rồi nạp lại Sảnh; bấm ô đang chọn không gửi gì; lỗi thì báo, không nạp lại', async () => {
    const onDoi = vi.fn()
    goi.mockResolvedValueOnce({ ok: true })
    const { container } = ve(nc, 0, 39, { onDoi })
    const [toiThieu, het] = [...container.querySelectorAll<HTMLButtonElement>('.nc-nut')]
    fireEvent.click(toiThieu!)
    expect(goi).not.toHaveBeenCalled()
    fireEvent.click(het!)
    expect(goi).toHaveBeenCalledWith('hoc-tap-no-cau-chon', 'tk', { kieu: 'het' })
    expect(het!.getAttribute('aria-pressed')).toBe('true') // chọn ngay trên màn trong lúc chờ
    await waitFor(() => expect(onDoi).toHaveBeenCalledTimes(1))
    goi.mockRejectedValueOnce(new Error('Mất mạng rồi.'))
    fireEvent.click(het!)
    await waitFor(() => expect(container.querySelector('[role="alert"]')!.textContent).toBe('Mất mạng rồi.'))
    expect(onDoi).toHaveBeenCalledTimes(1)
  })
  it('đang trả dở: số nợ giảm theo từng câu, dòng dưới ghi đã trả x/N', () => {
    const { container } = ve(nc, 5, 39)
    expect(container.querySelector('.nc-so')!.textContent).toBe('37câu đang nợ')
    expect(container.querySelector('.nc-loai')!.textContent).toBe('Hôm nay đã trả 5/11 câu')
  })
  it('đã trả đủ số đã chọn: thẻ gọn «Còn nợ … câu», lãi đêm nay, nút «Trả hết»; đủ mức hôm nay ⇒ nhắc học thêm, không còn nút', () => {
    const a = ve(nc, 11, 39)
    const the = a.container.querySelector('.nc-the')!
    expect(the.getAttribute('data-muc')).toBe('gon')
    expect(the.textContent).toBe('Còn nợ 31 câuHôm nay đã trả 11 câu · đêm nay cộng 2 câu lãiTrả hết')
    cleanup()
    const b = ve(nc, 39, 39, { duMuc: true })
    expect(b.container.querySelector('.nc-the')!.textContent).toBe('Còn nợ 31 câuHôm nay đã trả 11 câu · đêm nay cộng 2 câu lãi · học thêm câu nào, nợ giảm câu ấy')
    expect(b.container.querySelector('button')).toBeNull()
  })
  it('hết 3 lần trả tối thiểu: thẻ màu báo sai, chỉ còn «Trả hết»; nợ ≤ 6 câu cũng chỉ một ô', () => {
    const het = docNoCau(tomTatNo({ no: 20, lan: 3, loai: { moi: 0, sua: 9, on: 8, lai: 3 }, den: 'x' }, { kieu: 'het', so: 20 }, 0, 48))!
    const a = ve(het, 0, 48)
    const the = a.container.querySelector('.nc-the')!
    expect(the.getAttribute('data-muc')).toBe('het')
    expect(the.querySelector('.nc-chip')!.textContent).toBe('Hết 3 lần trả tối thiểu')
    expect([...the.querySelectorAll('.nc-nut')].map((b) => b.textContent)).toEqual(['Trả hết20 câu'])
    expect(the.querySelector('.nc-ghi')!.textContent).toContain('Em đã trả tối thiểu 3 lần')
    cleanup()
    const nho = docNoCau(tomTatNo({ no: 4, lan: 1, loai: { moi: 3, sua: 0, on: 0, lai: 1 }, den: 'x' }, { kieu: 'toi_thieu', so: 4 }, 0, 32))!
    expect([...ve(nho, 0, 32).container.querySelectorAll('.nc-nut')].map((b) => b.textContent)).toEqual(['Trả hết4 câu'])
  })
})
