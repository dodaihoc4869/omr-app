import { expect, it } from 'vitest'
import { chuKinhHtml } from '../src/lib/loi-giai-kinh/kinh-chieu'
it('chỉ số', () => {
  expect(chuKinhHtml('CH_3COOH')).toBe('CH<sub>3</sub>COOH')
  expect(chuKinhHtml('C_nH_{2n}O_2')).toBe('C<sub>n</sub>H<sub>2n</sub>O<sub>2</sub>')
  expect(chuKinhHtml('HCOOCH3, n ≥ 2')).toBe('HCOOCH<sub>3</sub>, n ≥ 2')
  expect(chuKinhHtml('Fe(OH)3 và 0,2 mol H2SO4; **13,2 g**')).toBe('Fe(OH)<sub>3</sub> và 0,2 mol H<sub>2</sub>SO<sub>4</sub>; <b>13,2 g</b>')
  expect(chuKinhHtml('Fe^{3+}')).toBe('Fe<sup>3+</sup>')
})

it('tờ chiếu vẽ đủ khối Kính theo thứ tự app; lý do theo đúng thứ tự đang chiếu', async () => {
  const { kinhChieuHtml } = await import('../src/lib/loi-giai-kinh/kinh-chieu')
  const ban = { qid: 'q', phienBan: 1, phan: 'I', cotLoi: { chu: 'Cốt lõi **đậm**', chip: [{ nhan: 'No', chu: 'không π' }] }, phim: [{ chu: 'Bước một' }, { chu: 'Bước hai' }, { chu: 'Bước ba' }],
    thanChu: ['Tăng thu, giảm toả'], thayNoi: 'Thầy nói câu này.', lyDo: [{ khoa: 'A', dung: false, chu: 'lý A' }, { khoa: 'B', dung: true, chu: 'lý B' }, { khoa: 'C', dung: false, chu: 'lý C' }, { khoa: 'D', dung: false, chu: 'lý D' }],
    hayNham: [{ nghi: 'nghĩ sai', dung: 'đúng là' }], tuHoi: { hoi: 'h', tra: 't' }, theNho: [{ truoc: 'a', sau: 'b' }] } as never
  const h = kinhChieuHtml(ban, { phan: 'I', dapAn: 'B', luaChon: ['x', 'y', 'z', 't'] })
  const vt = ['Kiến thức cốt lõi', 'Thầy dẫn từng bước', 'Thầy giảng dạng này', 'Vì sao chọn', 'Chỗ hay nhầm'].map((x) => h.indexOf(x))
  expect(vt.every((x, i) => x > 0 && (i === 0 || x > vt[i - 1]!))).toBe(true)
  expect(h).toContain('<b>đậm</b>')
  expect(h).toMatch(/sol-pa chon"><strong>B\.<\/strong>/)
})
it('chỉ số chữ: m_ester', () => { expect(chuKinhHtml('m_ester = 13,2')).toBe('m<sub>ester</sub> = 13,2') })
