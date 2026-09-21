// THẺ "CA KIỂM TRA GẦN NHẤT CỦA CON" ở đầu Bảng nhiệm vụ phụ huynh (thầy lệnh 21/09; mẫu ph-3, Boss soát ĐẠT). Luật công bố đứng đầu: ca chưa công bố ⇒ thẻ trung tính, KHÔNG điểm/số câu/phần.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import TheCaGanNhatCua from '../src/components/xem-diem/TheCaGanNhat'
import { chonTheCaGanNhat, tenCaThe, type CaChuaCongBo, type CaDaCongBo } from '../src/lib/the-ca-gan-nhat'

configure({ asyncUtilTimeout: 8000 })
const mocks = vi.hoisted(() => ({ ls: { ok: true, items: [] as any[], chuaCongBo: [] as any[] } }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'Đỗ Minh', lop: '12A1', tenCa: '' }),
  hsLichSuCaApi: async () => mocks.ls,
  hsCauSaiApi: async () => ({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: [] }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), migrateMom: async () => {}, momApi: async () => ({ ok: true, items: [] }) }))

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const CA_MOI: CaDaCongBo = { maCa: 'CA-2', tenCa: 'Kiểm tra 45 phút · Ester – lipid', nopLuc: '2026-09-19T02:12:00Z', tong: 7.5, diemI: 3.75, diemII: 2.75, diemIII: 1, soCauDung: 21, tongCau: 28 }
const CA_CU: CaDaCongBo = { maCa: 'CA-1', tenCa: 'Kiểm tra 60 phút · Ancol – phenol', nopLuc: '2026-09-12T02:12:00Z', tong: 6.75, diemI: 3, diemII: 2.5, diemIII: 1.25, soCauDung: 27, tongCau: 40 }
const CHUA_LOP: CaChuaCongBo = { maCa: 'CA-3', tenCa: 'Kiểm tra 20 phút · Amin', nopLuc: '2026-09-20T03:00:00Z', congBo: 'ca_lop_xong', soEmDaNop: 27, soEmDaVao: 32 }
const CHUA_KHONG: CaChuaCongBo = { maCa: 'CA-4', tenCa: 'Kiểm tra 10 phút · Polime', nopLuc: '2026-09-20T04:00:00Z', congBo: 'khong', soEmDaNop: 1, soEmDaVao: 32 }
const CAM = /thần thú|EXP|khiên|Đoàn|Đảo|Võ đài|hạng|\bMáy\b/i

beforeEach(() => {
  mocks.ls = { ok: true, items: [], chuaCongBo: [] }
  window.history.replaceState(null, '', '/?vai=phuhuynh')
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, items: [], winners: [] }), text: async () => '{}' })))
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

describe('chonTheCaGanNhat — chọn ca + luật công bố (thuần)', () => {
  it('không ca nào ⇒ null (không vẽ thẻ)', () => {
    expect(chonTheCaGanNhat([], [])).toBeNull()
  })

  it('chỉ ca đã công bố: chọn ca nộp MUỘN NHẤT; so với lần trước CỦA CHÍNH CON (+0,75 so với 6,75); số câu, ba phần', () => {
    const t = chonTheCaGanNhat([CA_CU, CA_MOI], [])!
    expect(t.kieu).toBe('da_cong_bo')
    if (t.kieu !== 'da_cong_bo') return
    expect(t).toMatchObject({ maCa: 'CA-2', tenCa: 'Kiểm tra 45 phút · Ester – lipid', diem: 7.5, dung: 21, tong: 28 })
    expect(t.ss).toEqual({ hieu: 0.75, truoc: 6.75 })
    expect(t.phan).toEqual([{ ma: 'I', ten: 'Phần I', diem: 3.75 }, { ma: 'II', ten: 'Phần II', diem: 2.75 }, { ma: 'III', ten: 'Phần III', diem: 1 }])
  })

  it('ca đầu tiên (không có ca công bố nào trước, cũng không ca chưa công bố nào trước) ⇒ ss = null ("chưa có lần trước")', () => {
    const t = chonTheCaGanNhat([CA_CU], [])!
    expect(t.kieu === 'da_cong_bo' && t.ss).toBeNull()
  })

  it('có ca CHƯA công bố nộp TRƯỚC ca này mà chưa có ca công bố trước ⇒ ẨN chip (không dám nói "ca đầu tiên")', () => {
    const t = chonTheCaGanNhat([CA_MOI], [{ ...CHUA_LOP, nopLuc: '2026-09-10T03:00:00Z' }])!
    expect(t.kieu).toBe('da_cong_bo')
    expect(t.kieu === 'da_cong_bo' && t.ss).toBeUndefined()
  })

  it('LUẬT CÔNG BỐ: ca chưa công bố nộp MUỘN HƠN ⇒ thẻ trung tính, KHÔNG điểm/số câu/phần của bất kỳ ca nào; chờ cả lớp ⇒ ca_lop + 27/32; thầy chưa công bố ⇒ khong', () => {
    const a = chonTheCaGanNhat([CA_CU, CA_MOI], [CHUA_LOP])!
    expect(a).toEqual({ kieu: 'ca_lop', maCa: 'CA-3', tenCa: 'Kiểm tra 20 phút · Amin', nopLuc: CHUA_LOP.nopLuc, nop: 27, si: 32 })
    const b = chonTheCaGanNhat([CA_CU, CA_MOI], [CHUA_LOP, CHUA_KHONG])!
    expect(b.kieu).toBe('khong') // CA-4 nộp muộn nhất
    for (const t of [a, b]) {
      expect(Object.keys(t).sort()).toEqual(['kieu', 'maCa', 'nop', 'nopLuc', 'si', 'tenCa'])
      expect(JSON.stringify(t)).not.toMatch(/7[.,]5|6[.,]75|diem|dung|phan/)
    }
  })

  it('ca chưa công bố CŨ HƠN ca đã công bố ⇒ vẫn thẻ điểm của ca mới nhất đã công bố', () => {
    const t = chonTheCaGanNhat([CA_MOI], [{ ...CHUA_KHONG, nopLuc: '2026-09-01T00:00:00Z' }])!
    expect(t.kieu).toBe('da_cong_bo')
  })

  it('chỉ nói SỐ THẬT: thiếu phần/điểm phần ⇒ bỏ; số câu không hợp lệ (đúng > tổng, tổng 0, thiếu) ⇒ ẩn dòng; điểm tổng thiếu ⇒ không thẻ (không đoán)', () => {
    const t = chonTheCaGanNhat([{ ...CA_MOI, diemI: null, diemII: undefined, diemIII: 1 }], [])!
    expect(t.kieu === 'da_cong_bo' && t.phan).toEqual([{ ma: 'III', ten: 'Phần III', diem: 1 }])
    for (const xau of [{ soCauDung: 30, tongCau: 28 }, { soCauDung: 5, tongCau: 0 }, { soCauDung: null, tongCau: 28 }, { soCauDung: -1, tongCau: 28 }]) {
      const u = chonTheCaGanNhat([{ ...CA_MOI, ...xau }], [])!
      expect(u.kieu === 'da_cong_bo' && [u.dung, u.tong]).toEqual([null, null])
    }
    expect(chonTheCaGanNhat([{ ...CA_MOI, tong: null }], [])).toBeNull()
  })

  it('mốc giờ hỏng/thiếu không làm hỏng việc chọn; hoà mốc ⇒ ưu tiên ca đã công bố; tên ca thiếu ⇒ "Ca kiểm tra mã <mã>"', () => {
    expect(chonTheCaGanNhat([{ ...CA_MOI, nopLuc: 'hỏng' }], [CHUA_LOP])!.kieu).toBe('ca_lop') // ca hợp lệ thắng ca mốc hỏng
    expect(chonTheCaGanNhat([CA_MOI], [{ ...CHUA_KHONG, nopLuc: CA_MOI.nopLuc }])!.kieu).toBe('da_cong_bo')
    expect(tenCaThe('CA-9', '')).toBe('Ca kiểm tra mã CA-9')
    expect(tenCaThe('CA-9', 'Ca CA-9')).toBe('Ca kiểm tra mã CA-9') // máy chủ điền "Ca <mã>" khi thiếu tên
    expect(tenCaThe('CA-9', 'Kiểm tra Este')).toBe('Kiểm tra Este')
  })
})

describe('TheCaGanNhatCua — vẽ thẻ', () => {
  it('đã công bố: điểm/10 to, tên ca, giờ nộp, "đúng 21/28 câu", so với lần trước của CON, ba phần có SỐ ĐIỂM, "Xem báo cáo ca này"; MỘT nút bấm được', () => {
    const onMo = vi.fn()
    const { container } = render(<TheCaGanNhatCua the={chonTheCaGanNhat([CA_CU, CA_MOI], [])} onMo={onMo} />)
    const nut = screen.getByRole('button', { name: /Ca kiểm tra gần nhất của con: Kiểm tra 45 phút · Ester – lipid, 7,5 trên 10 điểm, đúng 21 trên 28 câu\. Xem báo cáo ca này\./ })
    const chu = container.textContent || ''
    for (const m of [/7,5/, /trên 10 điểm/, /Kiểm tra 45 phút · Ester – lipid/, /Nộp 09:12/, /Con làm đúng 21\/28 câu/, /\+0,75 điểm so với lần trước của con \(6,75\)/, /Phần I3,75điểm/, /Phần II2,75điểm/, /Phần III1điểm/, /Đã có điểm/, /Xem báo cáo ca này/]) expect(chu).toMatch(m)
    expect(container.querySelectorAll('button').length).toBe(1) // cả thẻ là MỘT nút
    expect(chu).not.toMatch(CAM)
    fireEvent.click(nut)
    expect(onMo).toHaveBeenCalledTimes(1)
  })

  it('ca đầu tiên ⇒ chip "Đây là ca đầu tiên của con nên chưa có lần trước để so"; ss vắng ⇒ không chip so sánh', () => {
    const { container, rerender } = render(<TheCaGanNhatCua the={chonTheCaGanNhat([CA_CU], [])} onMo={() => {}} />)
    expect(container.textContent).toContain('Đây là ca đầu tiên của con nên chưa có lần trước để so')
    rerender(<TheCaGanNhatCua the={chonTheCaGanNhat([CA_MOI], [{ ...CHUA_LOP, nopLuc: '2026-09-10T03:00:00Z' }])} onMo={() => {}} />)
    expect(container.querySelector('.xd-ss')).toBeNull()
  })

  it('thiếu số câu / thiếu điểm phần ⇒ ẩn dòng và ẩn ô phần (không số bịa)', () => {
    const { container } = render(<TheCaGanNhatCua the={chonTheCaGanNhat([{ ...CA_MOI, soCauDung: null, diemI: null, diemII: null, diemIII: null }], [])} onMo={() => {}} />)
    expect(container.textContent).not.toMatch(/Con làm đúng|Phần I/)
    expect(container.querySelector('.xd-tcg__phan')).toBeNull()
    expect(container.textContent).toMatch(/7,5/)
  })

  it('CHƯA công bố: thẻ trung tính — "Chưa có điểm", KHÔNG điểm, KHÔNG số câu, KHÔNG phần; chờ cả lớp nói 27/32 em; thầy chưa công bố nói thật', () => {
    const a = render(<TheCaGanNhatCua the={chonTheCaGanNhat([CA_CU, CA_MOI], [CHUA_LOP])} onMo={() => {}} />)
    const ca = a.container.textContent || ''
    expect(ca).toMatch(/Chờ cả lớp nộp/)
    expect(ca).toMatch(/Điểm hiện khi cả lớp nộp xong \(27\/32 em đã nộp\)/)
    expect(ca).toMatch(/Chưa có điểm/)
    expect(ca).not.toMatch(/7,5|6,75|Con làm đúng|Phần I|trên 10/)
    expect(a.container.querySelector('.xd-tcg__phan')).toBeNull()
    a.unmount()
    const mo = vi.fn()
    const b = render(<TheCaGanNhatCua the={chonTheCaGanNhat([CA_CU, CA_MOI], [CHUA_KHONG])} onMo={mo} />)
    expect(b.container.textContent).toMatch(/Thầy chưa công bố điểm/)
    expect(b.container.textContent).toMatch(/Con đã nộp bài lúc 11:00/) // 04:00Z = 11:00 giờ Việt Nam
    expect(b.container.textContent).not.toMatch(/7,5|6,75|Con làm đúng|Phần I|trên 10|\d+\/\d+ em/)
    // Ca CHƯA công bố: KHÔNG có gì để mở (một màn một nút, 21/09) ⇒ thẻ là nhóm trung tính, KHÔNG phải nút, không dải "Xem báo cáo ca này".
    expect(b.container.querySelector('button')).toBeNull()
    const nhom = screen.getByRole('group', { name: /Ca kiểm tra gần nhất của con: .*Thầy chưa công bố điểm\.$/ })
    expect(nhom.getAttribute('aria-label')).not.toMatch(/\d,\d|trên 10|Xem báo cáo/)
    expect(b.container.textContent).not.toMatch(/Xem báo cáo ca này|Xem tất cả về con/)
    fireEvent.click(nhom)
    expect(mo).not.toHaveBeenCalled()
  })

  it('null ⇒ không vẽ gì', () => {
    const { container } = render(<TheCaGanNhatCua the={null} onMo={() => {}} />)
    expect(container.innerHTML).toBe('')
  })
})

describe('Bảng nhiệm vụ phụ huynh — thẻ ở ĐẦU, bấm mở báo cáo của ĐÚNG ca đó', () => {
  it('ca đã công bố: thẻ nằm NGAY DƯỚI khối tiến độ và TRÊN việc/lời Bộ não; bấm thẻ ⇒ mở hộp báo cáo của đúng ca (không còn tab Xem điểm)', async () => {
    mocks.ls = { ok: true, items: [CA_CU, CA_MOI], chuaCongBo: [] } as any
    localStorage.setItem('omr_ph_sbd', '12121212')
    const { container } = render(<ParentPortalScreen />)
    const the = await waitFor(() => {
      const e = container.querySelector('[data-vung="the-ca-gan-nhat"]')
      expect(e).toBeTruthy()
      return e as HTMLElement
    })
    const tienDo = container.querySelector('[data-vung="tien-do"]')!
    expect(tienDo.compareDocumentPosition(the) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy() // thẻ SAU tiến độ
    const sauThe = container.querySelector('[data-vung="the-ca-gan-nhat"] ~ *')
    expect(sauThe).toBeTruthy()
    expect(the.textContent).toMatch(/7,5/)
    expect(the.textContent).not.toMatch(CAM)
    fireEvent.click(the.querySelector('button')!)
    // Hộp báo cáo của CHÍNH ca ở thẻ (CA_MOI), chỉ để xem: không tab Xem điểm, không nút "Tạo bài luyện khắc phục"
    await waitFor(() => expect(document.body.textContent).toContain(CA_MOI.tenCa))
    expect(screen.queryByText('Báo Cáo Điểm Tất Cả Các Ca Kiểm Tra')).toBeNull()
    expect(screen.queryByText(/Tạo bài luyện khắc phục cho con/)).toBeNull()
  })

  it('ca mới nhất CHƯA công bố (chuaCongBo[] của máy chủ) ⇒ thẻ trung tính, không điểm ở thẻ', async () => {
    mocks.ls = { ok: true, items: [CA_CU, CA_MOI], chuaCongBo: [CHUA_LOP] } as any
    localStorage.setItem('omr_ph_sbd', '12121212')
    const { container } = render(<ParentPortalScreen />)
    const the = await waitFor(() => {
      const e = container.querySelector('[data-vung="the-ca-gan-nhat"]')
      expect(e).toBeTruthy()
      return e as HTMLElement
    })
    expect(the.getAttribute('data-kieu')).toBe('ca_lop')
    expect(the.textContent).toMatch(/27\/32 em đã nộp/)
    expect(the.textContent).not.toMatch(/7,5|6,75|Con làm đúng/)
    expect(the.querySelector('button')).toBeNull() // không có gì để mở
  })

  it('con chưa nộp ca nào ⇒ KHÔNG thẻ; máy chủ cũ (không có chuaCongBo) vẫn chạy', async () => {
    mocks.ls = { ok: true, items: [], chuaCongBo: undefined } as any
    localStorage.setItem('omr_ph_sbd', '12121212')
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('.bnv')).toBeTruthy())
    expect(container.querySelector('[data-vung="the-ca-gan-nhat"]')).toBeNull()
    cleanup()
    mocks.ls = { ok: true, items: [CA_MOI], chuaCongBo: undefined } as any
    const b = render(<ParentPortalScreen />)
    await waitFor(() => expect(b.container.querySelector('[data-vung="the-ca-gan-nhat"]')).toBeTruthy())
  })
})

describe('khoá nguồn', () => {
  it('CardCaThiGanNhat.tsx mồ côi ĐÃ XOÁ; thẻ mới chỉ nằm ở vai phụ huynh (`laPh && theCaGanNhat`) và đứng sau khối tiến độ', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'src/components/CardCaThiGanNhat.tsx'))).toBe(false)
    const b = doc('src/components/bang-nhiem-vu/BangNhiemVu.tsx')
    expect(b).toContain('{laPh && theCaGanNhat}')
    expect(b.indexOf('data-vung="tien-do"')).toBeLessThan(b.indexOf('{laPh && theCaGanNhat}'))
    expect(b.indexOf('{laPh && theCaGanNhat}')).toBeLessThan(b.indexOf('THỬ THÁCH RIÊNG HÔM NAY'))
  })
  it('ca đã công bố: cả thẻ là MỘT <button> ≥ 48 px (dải "Xem báo cáo ca này" 52 px); ca chưa công bố: <div role="group"> (không nút); không lồng nút/liên kết, dùng bộ xd-* và biến m3', () => {
    const t = doc('src/components/xem-diem/TheCaGanNhat.tsx')
    expect((t.match(/<button/g) || []).length).toBe(1) // chỉ nhánh ĐÃ công bố có nút
    expect(t).toContain('role="group"')
    expect(t).not.toMatch(/<a\s/)
    expect(doc('src/components/xem-diem/xem-diem.css')).toMatch(/\.xd-tcg__duoi \{[^}]*min-height: 52px/)
    expect(t).toContain("import { ChipCongBo, SoSanh } from './thanh-phan'")
  })
  it('màn phụ huynh nạp `chuaCongBo` từ lịch sử; thẻ ĐÃ công bố mở hộp báo cáo của đúng ca (`moBaoCaoCa`), thẻ chưa công bố không bấm được; không còn tab Xem điểm', () => {
    const p = doc('src/screens/ParentPortalScreen.tsx')
    expect(p).toContain('setDsChuaCongBo(Array.isArray(ls.chuaCongBo) ? ls.chuaCongBo : [])')
    expect(p).toContain("onMo={theCaGanNhat?.kieu === 'da_cong_bo' ? moBaoCaoCa : undefined}")
    expect(p).not.toContain('setTabPh')
    expect(p).toContain('khongGiaoBai')
  })
})
