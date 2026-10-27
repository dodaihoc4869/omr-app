// HỘP HỎI THẦY THEO TÔNG KẾT QUẢ CÂU (thầy 27/10: «Nếu trả lời đúng bấm Hỏi thầy thì màu xanh theo màu trả lời đúng; sai thì Hỏi thầy thành màu đỏ cho
// đồng bộ»). Khoá: nút Hỏi thầy ở dải kết quả mở hộp mang `data-tong` (đúng / sai / chưa tính); đang làm (chưa nộp) ⇒ không gắn (tông chính); tờ «Trong»
// đổi bộ biến màu chính theo tông bằng biến bảng màu, không màu thô.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))
import NutHoiThay from '../src/components/loi-giai/NutHoiThay'

beforeEach(() => {
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'thu' }))
  vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(url.endsWith('/hs/hoi-thay')
    ? { ok: true, hoiThem: true, chiHoi: true, cau: { qid: 'Q1', so: 'Câu 1', chuong: '', de: '<p>Đề</p>', y: {} } } : { ok: false })))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear() })
const moHop = async () => { fireEvent.click(screen.getByRole('button', { name: 'Hỏi thầy' })); await screen.findByRole('dialog'); return document.querySelector('.lg-hh-nen')! }

it.each(['dung', 'sai', 'trung'] as const)('mở từ dải kết quả %s ⇒ hộp mang data-tong', async (tong) => {
  render(<NutHoiThay gon chi="hoi" qid="Q1" nguon="bai_hang_ngay" dapAnEm="B" tong={tong} />)
  expect((await moHop()).getAttribute('data-tong')).toBe(tong)
})
it('đang làm (chưa nộp) ⇒ tông chính, không gắn data-tong', async () => {
  render(<NutHoiThay gon chi="hoi" dangLam qid="Q1" nguon="bai_hang_ngay" tong="sai" />)
  expect((await moHop()).hasAttribute('data-tong')).toBe(false)
})
it('tờ «Trong»: mỗi tông đổi đủ bộ biến màu chính bằng biến bảng màu (không màu thô)', () => {
  const css = readFileSync(resolve(__dirname, '../src/styles/trong-hoi-thay.css'), 'utf8')
  for (const [tong, sac] of [['dung', 'dung'], ['sai', 'sai'], ['trung', 'tin']]) {
    const r = new RegExp(`\\.lg-hh-nen\\[data-tong=${tong}\\] \\{([^}]*)\\}`).exec(css)?.[1] ?? ''
    for (const bien of ['--tr-chinh:', '--tr-chinh-nhat:', '--tr-chinh-chu:', '--tr-chinh-nut:', '--tr-tren-chinh:']) expect(r).toContain(bien)
    expect(r).toContain(`var(--tr-${sac}-chu)`)
    expect(r).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(/i)
  }
})
