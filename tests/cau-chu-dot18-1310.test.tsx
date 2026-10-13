// ĐỢT 18 · LÀN I (thầy 13/10: "Tối ưu lại câu từ cho dễ hiểu ở mọi màn. Bỏ hết các gợi ý hướng dẫn để học sinh phụ huynh không bị phân tâm.")
// Khoá: app phụ huynh không còn đoạn "Gia đình hỗ trợ", dòng chữ nhỏ giải thích cách tính, câu "Từ ca thứ hai…"; khối "Gợi ý nhắc con" thành "Cần nhắc con"
// (chỉ câu số liệu, không dòng trùng khối chính). Màn học sinh: bỏ khối "Cách làm bài tập về nhà", câu giải thích ở thẻ trống, khẩu hiệu màn đăng nhập.
// Nhãn chính (Câu đúng · Câu sai · Trung bình · Lịch học tuần này · Đúng và sai theo ngày · Thời gian làm câu · Câu sai gần đây) vẫn còn.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import { chuSoLieuNhac, dongCanNhac } from '../src/components/ph-v3/ConTongQuan'
import BtvnM3 from '../src/components/bang-nhiem-vu/BtvnM3'
import LichSuCaM3 from '../src/components/bang-nhiem-vu/LichSuCaM3'
import { PH_OK } from './_ph-moi/du-lieu-mau'
import { conTongQuanGia } from '../scripts/chup-v2/gia/ph-con-tong-quan'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({ ...(await original<any>()), tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'Nguyễn Minh Khôi', lop: '12A1', tenCa: '' }) }))
vi.mock('../src/lib/tai-thong-tin-ph', () => ({ taiThongTinPhuHuynh: async () => ({ canhBao: [] }) }))

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

beforeEach(() => {
  window.history.replaceState(null, '', '/?vai=phuhuynh')
  localStorage.setItem('omr_ph_sbd', '12121212')
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const duong = String(url).replace('https://may.test', '')
    const js = (t: unknown) => ({ ok: true, status: 200, json: async () => t, text: async () => JSON.stringify(t) })
    if (duong === '/ph/tat-ca-ve-con') return js(PH_OK)
    if (duong === '/ph/hoc-2') return js({ ok: true, cheDo2: true, ngay: '2026-10-16', homNay: { tong: 30, daLam: 12 } })
    if (duong === '/ph/con-tong-quan') return js(conTongQuanGia())
    return js({ ok: true })
  }))
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

describe('Cần nhắc con — chỉ câu số liệu', () => {
  it('chuSoLieuNhac giữ câu đầu, bỏ vế khuyên; dòng trùng khối chính bị bỏ', () => {
    expect(chuSoLieuNhac('Có 3 câu con làm sai chưa sửa được. Nhắc con vào mục Tự sửa lỗi để làm lại.')).toBe('Có 3 câu con làm sai chưa sửa được.')
    expect(chuSoLieuNhac('Tỉ lệ đúng 7 ngày qua là 60%, thấp hơn 7 ngày trước đó (72%). Hỏi con phần nào đang khó để báo Thầy.')).toBe('Tỉ lệ đúng 7 ngày qua là 60%, thấp hơn 7 ngày trước đó (72%).')
    expect(chuSoLieuNhac('Một câu không dấu chấm')).toBe('Một câu không dấu chấm')
    const ds = dongCanNhac([
      { ma: 'con-cau-hom-nay', chu: 'Hôm nay con còn 18 câu chưa làm (đã làm 12/30 câu).' },
      { ma: 'lam-khuya', chu: 'Con hay làm bài sau 23 giờ (3 trong 7 ngày qua). Nhắc con học sớm hơn để đủ giấc.' },
    ])
    expect(ds).toEqual([{ ma: 'lam-khuya', chu: 'Con hay làm bài sau 23 giờ (3 trong 7 ngày qua).' }])
  })
})

describe('app phụ huynh — bỏ chữ hướng dẫn, giữ nhãn', () => {
  it('Hôm nay: không "Gia đình hỗ trợ", không chữ nhỏ cách tính; còn Câu đúng · Câu sai · Trung bình · Cần nhắc con · Lịch học tuần này', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="goi-y-nhac"]')).toBeTruthy())
    await waitFor(() => expect(container.querySelector('[data-vung="lich-tuan"]')).toBeTruthy())
    const chu = container.textContent!
    for (const bo of ['Gia đình hỗ trợ', 'Gợi ý nhắc con', 'Theo số liệu đến', 'Đúng, sai tính theo từng lần', 'theo quy tắc hiện hành', 'Nhắc con đọc kỹ đề', 'Gặp câu với hỗ trợ'])
      expect(chu).not.toContain(bo)
    for (const giu of ['Câu đúng', 'Câu sai', 'Trung bình', 'Cần nhắc con', 'Lịch học tuần này']) expect(chu).toContain(giu)
  })

  it('Tiến bộ: không câu giải thích dưới tiêu đề khối; ba khối số liệu vẫn có tên', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="goi-y-nhac"]')).toBeTruthy())
    await act(async () => {
      window.history.replaceState(null, '', '/?vai=phuhuynh#tien-bo')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    await waitFor(() => expect(container.querySelector('[data-vung="dung-sai-ngay"]')).toBeTruthy())
    const chu = container.textContent!
    for (const bo of ['đã sửa là lần làm lại', 'số trên cột là số câu con làm', 'tính từ lúc con trả lời câu liền trước', 'không tính vào trung bình', 'Mỗi dạng có ba bậc', 'Từ ca thứ hai'])
      expect(chu).not.toContain(bo)
    for (const giu of ['Đúng và sai theo ngày', 'Thời gian làm câu', 'Câu sai gần đây', 'Trung bình mỗi câu']) expect(chu).toContain(giu)
  })
})

describe('màn học sinh — bỏ khối hướng dẫn, giữ tiêu đề và trạng thái', () => {
  it('Bài tập về nhà: không còn khối "Cách làm…"; thẻ trống chỉ nói một câu', () => {
    const { container } = render(<BtvnM3 dangTai={false} ds={[]} now={Date.now()} dangMoId={null} ngayGio={() => ''} onMo={() => {}} onTaiLai={() => {}} />)
    expect(container.textContent).not.toMatch(/Cách làm bài tập về nhà|CHẶNG ĐANG MỞ|Mỗi bài chia thành các chặng|Hiện tại Thầy chưa giao/)
    expect(screen.getByRole('heading', { name: 'Bài tập về nhà' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Chưa có bài tập về nhà nào' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tải lại danh sách' })).toBeTruthy()
  })

  it('Lịch sử ca kiểm tra (Kết quả): không dòng giải thích; thẻ trống giữ tiêu đề', () => {
    const { container } = render(<LichSuCaM3 dangTai={false} ds={[]} ngayGio={() => ''} dongDem={() => null} dangMoDe={false} onXemBaoCao={() => {}} onXemDe={() => {}} />)
    expect(container.textContent).not.toMatch(/Xem điểm chi tiết và báo cáo|chưa được đồng bộ/)
    expect(screen.getByRole('heading', { name: 'Lịch sử ca kiểm tra' })).toBeTruthy()
    expect(screen.getByText('Chưa có ca kiểm tra nào')).toBeTruthy()
  })

  it('đăng nhập + lịch sử ca: bỏ khẩu hiệu và câu chỉ đường; giữ cách lấy lại mật khẩu', () => {
    const dn = doc('src/screens/DangNhapHocSinh.tsx')
    expect(dn).not.toContain('Học từng chặng ngắn')
    expect(dn).toContain('Quên mật khẩu: nhắn thầy để đặt lại.')
    expect(doc('src/components/bat-linh/LoiChao.tsx')).not.toMatch(/Hiểu bài sâu hơn|Nhìn thấy nỗ lực/)
    expect(doc('src/screens/ParentPortalScreen.tsx')).not.toContain('Theo dõi nhịp học, kết quả đã công bố')
    expect(doc('src/components/hoa2/LichSuCaEm.tsx')).not.toContain('em vào thi từ nút Vào kiểm tra')
  })
})
