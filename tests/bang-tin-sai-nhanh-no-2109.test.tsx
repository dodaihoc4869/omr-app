// BẢNG TIN THẦY · hai khoá máy chủ DỰNG SẴN, ẨN khi máy chủ chưa trả (Boss 21/09, W3b):
//  (1) `saiNhanh` — tín hiệu ĐO "sai rất nhanh rồi làm đúng lại hôm sau" của Code 1 (src/lib/tin-hieu-sai-nhanh.ts): một dòng dưới "Em cần thầy để ý" + tấm bên từng em.
//  (2) `nhip.noTheoLop` — số em ĐANG NỢ chặng (Dồn về đích) theo lớp: dòng phụ ô "Bài tập về nhà đúng nhịp".
// Luật đọc: khoá vắng ⇒ không vẽ gì (không bịa 0); là số đo, không là nhãn về em; chỉ thầy thấy; không thêm nút việc.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { MAU_DAY } from './fixtures/bang-tin-mau'
import { docBangTin, docNoTheoLop, docSaiNhanh } from '../src/lib/bang-tin-thay'
import { chuTinHieuSaiNhanh } from '../src/lib/tin-hieu-sai-nhanh'
import { BonSoLon, chuNoTheoLop, HangNoLop } from '../src/components/bang-tin/cac-khoi'
import BangTinV3 from '../src/components/bang-tin/BangTin'

afterEach(() => cleanup())
const NAY = Date.parse('2026-09-21T07:20:00.000Z')

const EM = (sbd: string, hoTen: string, soCau: number, tenLop = '12A1', extra: Record<string, unknown> = {}) => ({
  sbd, hoTen, tenLop, soCau, nguongSoCau: 8, nguongGiay: 5, cuaSoNgay: 7, tuNgay: '2026-09-15', co: true, ...extra,
})
const SAI_NHANH = { ds: [EM('1', 'Nguyễn An', 9), EM('2', 'Trần Bình', 12, '12A2'), EM('3', 'Lê Chi', 8)] }
const NO = [
  { lop: '12A1', siSo: 30, soEmNo: 3 },
  { lop: '12A2', siSo: 28, soEmNo: 5 },
  { lop: '11B', siSo: 25, soEmNo: 1 },
]

const bt = (extra: Record<string, unknown> = {}, noTheoLop?: unknown) =>
  docBangTin({ ...MAU_DAY, ...extra, ...(noTheoLop !== undefined ? { nhip: { ...(MAU_DAY as { nhip: object }).nhip, noTheoLop } } : {}) } as Record<string, unknown>)!
const dung = (extra: Record<string, unknown> = { saiNhanh: SAI_NHANH }, noTheoLop?: unknown, dungNhip: { soEm: number; soCoLo: number } | null = { soEm: 97, soCoLo: 148 }) => {
  const onMoEm = vi.fn()
  const r = render(<BangTinV3 du={bt(extra, noTheoLop)} nayMs={NAY} dsTraCuu={[]} onMoEm={onMoEm} onMoCa={() => {}} dungNhip={dungNhip} />)
  return { ...r, onMoEm }
}
const dongSai = (c: HTMLElement) => c.querySelector('[data-khoi="sai-nhanh"]') as HTMLElement | null
const oPhu = (c: HTMLElement, nhan: string) => {
  const the = [...c.querySelectorAll('.bt3-so')].find((e) => e.querySelector('.bt3-so-nhan')?.textContent === nhan) as HTMLElement
  return the.querySelector('.bt3-so-phu') as HTMLElement
}

describe('docSaiNhanh — đọc khoá máy chủ, khoan dung nhưng không bịa', () => {
  it('đọc thân {ds} hoặc thẳng mảng; xếp số câu GIẢM dần, cùng số thì theo tên', () => {
    const a = docSaiNhanh(SAI_NHANH)!
    expect(a.map((e) => [e.sbd, e.soCau])).toEqual([['2', 12], ['1', 9], ['3', 8]])
    expect(docSaiNhanh(SAI_NHANH.ds)).toEqual(a)
    const hoa = docSaiNhanh([EM('1', 'Vũ Lan', 9), EM('2', 'An Bình', 9)])!
    expect(hoa.map((e) => e.hoTen)).toEqual(['An Bình', 'Vũ Lan'])
  })

  it('giữ nguyên các số đo của Code 1 (ngưỡng, cửa sổ, từ ngày) cho câu nói thật', () => {
    expect(docSaiNhanh({ ds: [EM('1', 'A', 10, '12A1', { nguongSoCau: 6, nguongGiay: 4, cuaSoNgay: 10, tuNgay: '2026-09-11' })] })![0]).toEqual({
      sbd: '1', hoTen: 'A', tenLop: '12A1', soCau: 10, nguongSoCau: 6, nguongGiay: 4, cuaSoNgay: 10, tuNgay: '2026-09-11', co: true,
    })
  })

  it('chỉ giữ em CÓ tín hiệu: co=false bị bỏ; thiếu co thì suy từ soCau ≥ ngưỡng (máy chủ cũ)', () => {
    expect(docSaiNhanh({ ds: [EM('1', 'A', 9, '12A1', { co: false }), EM('2', 'B', 9)] })!.map((e) => e.sbd)).toEqual(['2'])
    const thieuCo = (soCau: number) => docSaiNhanh({ ds: [{ sbd: '1', hoTen: 'A', tenLop: 'L', soCau, nguongSoCau: 8, nguongGiay: 5, cuaSoNgay: 7, tuNgay: '' }] })
    expect(thieuCo(8)).toHaveLength(1)
    expect(thieuCo(7)).toBeNull()
  })

  it('thiếu ngưỡng ⇒ dùng ngưỡng mặc định của Code 1 (8 câu · 5 giây · 7 ngày), không số 0', () => {
    const [e] = docSaiNhanh({ ds: [{ sbd: '1', hoTen: 'A', soCau: 9, co: true }] })!
    expect(e).toMatchObject({ nguongSoCau: 8, nguongGiay: 5, cuaSoNgay: 7, tenLop: '' })
  })

  it('bỏ em thiếu sbd/tên, số câu < 1 và phần tử rác; không còn ai ⇒ null (ẩn dòng, không nói "không em nào")', () => {
    expect(docSaiNhanh({ ds: [EM('', 'A', 9), EM('2', '', 9), EM('3', 'C', 0, '12A1', { co: true }), null, 7, 'x'] })).toBeNull()
    expect(docSaiNhanh({ ds: [null, EM('9', 'Z', 9)] })!.map((e) => e.sbd)).toEqual(['9'])
    expect(docSaiNhanh({ ds: [] })).toBeNull()
    expect(docSaiNhanh(undefined)).toBeNull()
    expect(docSaiNhanh('x')).toBeNull()
    expect(docSaiNhanh(5)).toBeNull()
  })

  it('tối đa 20 em (lấy 20 em nhiều câu nhất)', () => {
    const nhieu = Array.from({ length: 25 }, (_, i) => EM(String(i + 1), `Em ${String(i + 1).padStart(2, '0')}`, 8 + i))
    const a = docSaiNhanh({ ds: nhieu })!
    expect(a).toHaveLength(20)
    expect(a[0].soCau).toBe(32)
    expect(a[19].soCau).toBe(13)
  })
})

describe('docNoTheoLop — số em đang nợ chặng theo lớp', () => {
  it('đọc mảng lớp; xếp số em nợ GIẢM dần; sĩ số tối thiểu bằng số em nợ', () => {
    expect(docNoTheoLop(NO)!.map((l) => [l.lop, l.soEmNo, l.siSo])).toEqual([['12A2', 5, 28], ['12A1', 3, 30], ['11B', 1, 25]])
    expect(docNoTheoLop([{ lop: 'X', siSo: 1, soEmNo: 4 }])![0]).toEqual({ lop: 'X', siSo: 4, soEmNo: 4 })
    const hoa = docNoTheoLop([{ lop: '12B', siSo: 20, soEmNo: 2 }, { lop: '12A', siSo: 20, soEmNo: 2 }])!
    expect(hoa.map((l) => l.lop)).toEqual(['12A', '12B'])
  })

  it('bỏ lớp thiếu tên hoặc soEmNo < 1 (không ai nợ ⇒ không nêu lớp); phần tử rác không làm hỏng khối; rỗng ⇒ null', () => {
    expect(docNoTheoLop([{ lop: '', siSo: 3, soEmNo: 2 }, { lop: 'M', siSo: 3, soEmNo: 0 }, { lop: 'N', siSo: 3, soEmNo: -2 }])).toBeNull()
    expect(docNoTheoLop([null, 5, 'x', { lop: 'K', siSo: 2, soEmNo: 1 }])!.map((l) => l.lop)).toEqual(['K'])
    expect(docNoTheoLop([])).toBeNull()
    expect(docNoTheoLop(undefined)).toBeNull()
    expect(docNoTheoLop({})).toBeNull()
  })
})

describe('docBangTin — khoá vắng ⇒ null (ẩn); có ⇒ mảng; các khối khác không đổi', () => {
  it('không có khoá nào ⇒ saiNhanh null và nhip.noTheoLop null', () => {
    const b = docBangTin(MAU_DAY as Record<string, unknown>)!
    expect(b.saiNhanh).toBeNull()
    expect(b.nhip.noTheoLop).toBeNull()
  })
  it('có khoá ⇒ đọc đúng, số nhịp khác giữ nguyên', () => {
    const b = bt({ saiNhanh: SAI_NHANH }, NO)
    expect(b.saiNhanh).toHaveLength(3)
    expect(b.nhip.noTheoLop).toHaveLength(3)
    expect(b.nhip.soEmHoc).toBe(57)
  })
})

describe('Bảng tin · dòng "Sai rất nhanh rồi đúng lại"', () => {
  it('có dữ liệu ⇒ MỘT dòng nút trong ô "Em cần thầy để ý": tổng số em + em đầu (số câu, một dòng phụ) + "+N em"', () => {
    const { container } = dung()
    const dong = dongSai(container)!
    expect(dong).toBeTruthy()
    expect(dong.closest('[data-khoi="can-de-y"]')).toBeTruthy()
    expect(dong.tagName).toBe('BUTTON')
    expect(dong.textContent).toContain('Sai rất nhanh rồi đúng lại: 3 em')
    expect(dong.textContent).toContain('Trần Bình 12 câu · +2 em')
    expect(dong.textContent).not.toContain('Nguyễn An')
  })

  it('hai em ⇒ "+1 em"; một em ⇒ chỉ em đó, không có "+"', () => {
    const hai = dung({ saiNhanh: { ds: SAI_NHANH.ds.slice(0, 2) } })
    expect(dongSai(hai.container)!.textContent).toBe('Sai rất nhanh rồi đúng lại: 2 emTrần Bình 12 câu · +1 em')
    cleanup()
    const mot = dung({ saiNhanh: { ds: [EM('1', 'Nguyễn An', 9)] } })
    expect(dongSai(mot.container)!.textContent).toBe('Sai rất nhanh rồi đúng lại: 1 emNguyễn An 9 câu')
  })

  it('máy chủ chưa trả khoá / không em nào có tín hiệu ⇒ KHÔNG có dòng', () => {
    for (const extra of [{}, { saiNhanh: { ds: [] } }, { saiNhanh: { ds: [EM('1', 'A', 9, '12A1', { co: false })] } }]) {
      const { container } = dung(extra)
      expect(dongSai(container)).toBeNull()
      cleanup()
    }
  })

  it('cùng có "Chưa học hôm nay" ⇒ hai dòng, "Chưa học" trước rồi tới "Sai nhanh"; đều là dòng cao 48 px cùng kiểu', () => {
    const chua = { ngay: '2026-09-21', theoLop: [{ lop: '12A1', siSo: 30, chuaHoc: 1, em: [{ sbd: '7', hoTen: 'Hà Giang' }] }] }
    const { container } = dung({ saiNhanh: SAI_NHANH, chuaHocHomNay: chua })
    const dong = [...container.querySelectorAll('[data-khoi="can-de-y"] > button.bt3-chua-hoc')]
    expect(dong.map((d) => d.getAttribute('data-khoi'))).toEqual(['chua-hoc-hom-nay', 'sai-nhanh'])
  })

  it('chưa mở thì trang chính không nêu tên em nào của khối này; dòng không mang nhãn năng lực', () => {
    const { container } = dung()
    expect(container.textContent).not.toContain('Lê Chi')
    expect(container.querySelector('[data-khoi="tam-ben"]')).toBeNull()
    expect(dongSai(container)!.textContent).not.toMatch(/yếu|lười|gian|dối|kém/i)
  })
})

describe('Bảng tin · tấm bên "Sai rất nhanh rồi đúng lại"', () => {
  const mo = () => {
    const r = dung()
    fireEvent.click(dongSai(r.container)!)
    return { ...r, tam: r.container.querySelector('[data-khoi="tam-ben"]') as HTMLElement }
  }

  it('bấm dòng ⇒ tấm bên có tiêu đề, dòng phụ nói ngưỡng thật (từ 8 câu · dưới 5 giây · 7 ngày) và "là số đo, không phải nhận xét"', () => {
    const { tam } = mo()
    expect(tam).toBeTruthy()
    expect(within(tam).getByRole('heading', { name: 'Sai rất nhanh rồi đúng lại' })).toBeTruthy()
    expect(tam.textContent).toContain('Trong 7 ngày gần nhất: từ 8 câu sai dưới 5 giây rồi làm đúng hôm sau.')
    expect(tam.textContent).toContain('Đây là số đo, không phải nhận xét về em.')
  })

  it('ngưỡng lấy từ dữ liệu máy chủ (đổi ngưỡng ở máy chủ thì chữ đổi theo)', () => {
    cleanup()
    const r = dung({ saiNhanh: { ds: [EM('1', 'A', 10, '12A1', { nguongSoCau: 6, nguongGiay: 4, cuaSoNgay: 10 })] } })
    fireEvent.click(dongSai(r.container)!)
    expect(r.container.querySelector('[data-khoi="tam-ben"]')!.textContent).toContain('Trong 10 ngày gần nhất: từ 6 câu sai dưới 4 giây')
  })

  it('mỗi em là MỘT nút có tên đọc rõ; câu nói là ĐÚNG câu của Code 1 (không tự đặt chữ)', () => {
    const { tam } = mo()
    const nut = within(tam).getByRole('button', { name: 'Trần Bình · 12A2 — sai rất nhanh rồi đúng lại, mở toàn cảnh' })
    expect(nut.textContent).toContain(chuTinHieuSaiNhanh(docSaiNhanh(SAI_NHANH)![0]))
    expect(nut.textContent).toContain('Em có 12 câu sai rất nhanh (dưới 5 giây) rồi làm đúng vào hôm sau trong 7 ngày gần nhất.')
    expect(within(tam).getAllByRole('button').filter((b) => b.classList.contains('bt3-em'))).toHaveLength(3)
  })

  it('câu nói dùng màu chữ phụ (số đo, không cảnh báo); em không có tên lớp ⇒ không có dấu "·" treo và tên nút không nhắc lớp', () => {
    cleanup()
    const r = dung({ saiNhanh: { ds: [EM('1', 'Nguyễn An', 9, '')] } })
    fireEvent.click(dongSai(r.container)!)
    const tam = r.container.querySelector('[data-khoi="tam-ben"]') as HTMLElement
    expect(tam.querySelectorAll('.bt3-em-ly--trung')).toHaveLength(1)
    expect(tam.querySelector('.bt3-em-lop')).toBeNull()
    expect(within(tam).getByRole('button', { name: 'Nguyễn An — sai rất nhanh rồi đúng lại, mở toàn cảnh' })).toBeTruthy()
  })

  it('ngưỡng ở dòng phụ lấy từ em đứng ĐẦU danh sách (em có nhiều câu nhất)', () => {
    cleanup()
    const r = dung({ saiNhanh: { ds: [EM('1', 'A', 9, '12A1', { cuaSoNgay: 7 }), EM('2', 'B', 12, '12A1', { cuaSoNgay: 14 })] } })
    fireEvent.click(dongSai(r.container)!)
    expect(r.container.querySelector('[data-khoi="tam-ben"]')!.textContent).toContain('Trong 14 ngày gần nhất')
  })

  it('chạm tên ⇒ đóng tấm bên rồi mở Toàn cảnh đúng em; Esc đóng tấm', () => {
    const { tam, onMoEm, container } = mo()
    fireEvent.click(within(tam).getByRole('button', { name: /Lê Chi/ }))
    expect(onMoEm).toHaveBeenCalledWith('3')
    expect(container.querySelector('[data-khoi="tam-ben"]')).toBeNull()
    fireEvent.click(dongSai(container)!)
    expect(container.querySelector('[data-khoi="tam-ben"]')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(container.querySelector('[data-khoi="tam-ben"]')).toBeNull()
  })
})

describe('chuNoTheoLop — dòng phụ ô "Bài tập về nhà đúng nhịp"', () => {
  const dsNo = docNoTheoLop(NO)!
  it('tổng em nợ (cộng MỌI lớp) + số lớp', () => {
    expect(chuNoTheoLop(dsNo)).toBe('9 em đang nợ chặng · 3 lớp')
    expect(chuNoTheoLop(dsNo.slice(0, 1))).toBe('5 em đang nợ chặng · 1 lớp')
    expect(chuNoTheoLop([{ lop: 'A', siSo: 2000, soEmNo: 1200 }, { lop: 'B', siSo: 5, soEmNo: 1 }])).toBe('1.201 em đang nợ chặng · 2 lớp')
  })
})

describe('Bảng tin · ô "Bài tập về nhà đúng nhịp" với nợ chặng theo lớp', () => {
  const the = (c: HTMLElement) => c.querySelector('[data-khoi="no-chang"]') as HTMLElement | null

  it('có nhip.noTheoLop ⇒ dòng phụ nêu tổng em nợ + số lớp; cả ô là MỘT nút thật (vùng chạm), không còn câu "chậm một chặng"', () => {
    const { container } = dung({}, NO)
    expect(the(container)!.tagName).toBe('BUTTON')
    expect(oPhu(container, 'Bài tập về nhà đúng nhịp').textContent).toBe('9 em đang nợ chặng · 3 lớp')
    expect(container.textContent).not.toContain('chậm một chặng trở lên')
    expect(container.querySelectorAll('.bt3-so--nut')).toHaveLength(1)
  })

  it('khoá vắng ⇒ giữ NGUYÊN câu cũ (không đổi số, không bịa nợ 0) và ô vẫn chỉ để đọc (không phải nút)', () => {
    const { container } = dung({})
    expect(oPhu(container, 'Bài tập về nhà đúng nhịp').textContent).toBe('51 em chậm một chặng trở lên')
    expect(the(container)).toBeNull()
    expect(container.querySelectorAll('.bt3-so')[3].tagName).toBe('DIV')
  })

  it('khoá có mà không lớp nào nợ (mảng rỗng) ⇒ coi như vắng: câu cũ, không nói "0 em nợ", không nút', () => {
    const { container } = dung({}, [])
    expect(oPhu(container, 'Bài tập về nhà đúng nhịp').textContent).toBe('51 em chậm một chặng trở lên')
    expect(the(container)).toBeNull()
  })

  it('chưa có số đúng nhịp (lệnh cũ lỗi) mà máy chủ đã trả nợ theo lớp ⇒ vẫn hiện nợ; không ⇒ "chưa có số liệu đúng nhịp"', () => {
    const co = dung({}, NO, null)
    expect(oPhu(co.container, 'Bài tập về nhà đúng nhịp').textContent).toContain('9 em đang nợ chặng')
    cleanup()
    const khong = dung({}, undefined, null)
    expect(oPhu(khong.container, 'Bài tập về nhà đúng nhịp').textContent).toBe('chưa có số liệu đúng nhịp')
  })

  it('ba ô số còn lại không đổi (chữ, và vẫn không phải nút) khi có nợ chặng', () => {
    const a = dung({})
    const truoc = [...a.container.querySelectorAll('.bt3-so')].slice(0, 3).map((e) => e.textContent)
    cleanup()
    const b = dung({}, NO)
    const ba = [...b.container.querySelectorAll('.bt3-so')].slice(0, 3)
    expect(ba.map((e) => e.textContent)).toEqual(truoc)
    expect(ba.every((e) => e.tagName === 'DIV')).toBe(true)
  })
})

describe('Bảng tin · ô nợ chặng — chi tiết', () => {
  it('ô nút có mũi tên (biết là bấm được); ba ô còn lại và ô chỉ-đọc không có', () => {
    const { container } = dung({}, NO)
    expect(container.querySelectorAll('.bt3-so svg')).toHaveLength(1)
    expect(container.querySelector('[data-khoi="no-chang"] svg')).toBeTruthy()
  })

  it('BonSoLon không được giao việc mở tấm bên ⇒ KHÔNG thành nút dù máy chủ có trả khoá (không có nút chết); rơi về câu cũ', () => {
    const { container } = render(<BonSoLon bt={bt({}, NO)} nayMs={NAY} dungNhip={{ soEm: 97, soCoLo: 148 }} />)
    expect(container.querySelector('button')).toBeNull()
    expect(container.textContent).toContain('51 em chậm một chặng trở lên')
  })

  it('HangNoLop: thanh tỉ lệ = số em nợ / sĩ số (làm tròn %), không vượt 100%, sĩ số 0 ⇒ 0%', async () => {
    const thanh = (l: { lop: string; siSo: number; soEmNo: number }) => {
      const r = render(<ul><HangNoLop l={l} /></ul>)
      return r.container.querySelector('.bt3-dv-thanh i') as HTMLElement
    }
    const a = thanh({ lop: 'A', siSo: 28, soEmNo: 5 })
    await waitFor(() => expect(a.style.transform).toBe('scaleX(0.18)'))
    cleanup()
    const b = thanh({ lop: 'B', siSo: 2, soEmNo: 3 })
    await waitFor(() => expect(b.style.transform).toBe('scaleX(1)'))
    cleanup()
    const c = thanh({ lop: 'C', siSo: 0, soEmNo: 3 })
    await waitFor(() => expect(c.style.transform).toBe('scaleX(0)'))
  })
})

describe('Bảng tin · tấm bên "Em đang nợ chặng, theo lớp"', () => {
  const mo = () => {
    const r = dung({}, NO)
    fireEvent.click(r.container.querySelector('[data-khoi="no-chang"]') as HTMLElement)
    return { ...r, tam: r.container.querySelector('[data-khoi="tam-ben"]') as HTMLElement }
  }

  it('bấm ô ⇒ tấm bên có tiêu đề, dòng phụ (số em nợ / sĩ số · tính đến giờ cập nhật) và MỌI lớp, lớp nợ nhiều nhất trước', () => {
    const { tam } = mo()
    expect(tam).toBeTruthy()
    expect(within(tam).getByRole('heading', { name: 'Em đang nợ chặng, theo lớp' })).toBeTruthy()
    expect(tam.textContent).toMatch(/Số em đang nợ chặng bài tập về nhà \/ sĩ số lớp · tính đến \d{2}:\d{2}\./)
    const hang = [...tam.querySelectorAll('li.bt3-dv--no')].map((li) => li.querySelector('.bt3-dv-ten')!.textContent + '|' + li.querySelector('.bt3-dv-so')!.textContent)
    expect(hang).toEqual(['12A2|5 / 28 em đang nợ', '12A1|3 / 30 em đang nợ', '11B|1 / 25 em đang nợ'])
  })

  it('thanh tỉ lệ có tên đọc rõ; chỉ ĐỌC: không có nút nào ngoài nút Đóng (khoá không mang tên em)', () => {
    const { tam } = mo()
    expect(within(tam).getByRole('img', { name: '5 trên 28 em của lớp 12A2 đang nợ chặng' })).toBeTruthy()
    const nut = within(tam).getAllByRole('button', { hidden: true }).filter((b) => b.classList.contains('bt3-em') || b.closest('li'))
    expect(nut).toHaveLength(0)
  })

  it('Esc đóng tấm bên', () => {
    const { container } = mo()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(container.querySelector('[data-khoi="tam-ben"]')).toBeNull()
  })

  it('chưa bấm ô thì trang chính không có tên lớp nợ nào', () => {
    const { container } = dung({}, NO)
    expect(container.querySelector('[data-khoi="tam-ben"]')).toBeNull()
    expect(container.querySelector('li.bt3-dv--no')).toBeNull()
  })
})

describe('Bảng tin · nguồn', () => {
  const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')
  it('dòng + hàng sai nhanh không có nút "giao/nhắc/gửi" và không đặt lại chữ của tín hiệu (dùng chuTinHieuSaiNhanh)', () => {
    const t = doc('src/components/bang-tin/cac-khoi.tsx')
    const khoi = t.slice(t.indexOf('export function DongSaiNhanh'), t.indexOf('/** Một em chưa học trong tấm bên'))
    expect(khoi).not.toMatch(/nhắc|giao|gửi/i)
    expect(khoi).toMatch(/chuTinHieuSaiNhanh\(e\)/)
    expect(khoi).not.toMatch(/nhanh chóng|bất thường|gian lận/i)
  })
  it('CSS ô nút nợ chặng: có viền tiêu điểm nhìn thấy, chữ ≥ 13 không mã màu thô; thanh nợ dùng màu "đang làm" (không đỏ cảnh báo)', () => {
    const css = doc('src/styles/bang-tin-v3.css')
    const khoi = css.slice(css.indexOf('.bt3-so--nut {'), css.indexOf('/* ── hai hàng ô'))
    expect(khoi).toMatch(/\.bt3-so--nut:focus-visible \{\s*outline: 3px solid var\(--m3-primary\)/)
    expect(khoi).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(khoi).toMatch(/\.bt3-dv--no \.bt3-dv-thanh i \{\s*background: var\(--bt-dang-lam\)/)
  })
  it('CSS: hai dòng liền nhau không cộng lề trên; chữ câu nói sai nhanh KHÔNG dùng màu cảnh báo; không mã màu thô', () => {
    const css = doc('src/styles/bang-tin-v3.css')
    expect(css).toMatch(/\.bt3-chua-hoc \+ \.bt3-chua-hoc \{\s*margin-top: 0;/)
    const m = css.match(/\.bt3-em-ly--trung \{([^}]*)\}/)!
    expect(m[1]).toMatch(/--m3-on-surface-variant/)
    expect(m[1]).not.toMatch(/canh-bao|#[0-9a-fA-F]{3,8}\b/)
  })
})
