// Nút "Hỏi thầy" (src/components/loi-giai/NutHoiThay.tsx): không phiên học sinh ⇒ không hiện; bấm ⇒ gọi /hs/hoi-thay đúng qid + nguồn;
// câu chưa có hồ sơ ⇒ hộp lời giải chữ (đáp án + lý do từng ý); máy chủ khoá (đang kiểm tra) ⇒ nói đúng lý do, không mở gì; `onHoi` chỉ gọi khi đã mở.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
import NutHoiThay from '../src/components/loi-giai/NutHoiThay'

const CAU = { qid: '12-A-II-4', so: 'Câu 4', nguon: '12-A', chuong: 'Ester – lipid', de: '<p>Đề thử</p>', y: { a: 'ý a', b: 'ý b', c: 'ý c', d: 'ý d' } }
let tra: unknown
const goi: { url: string; body: Record<string, unknown> }[] = []

beforeEach(() => {
  goi.length = 0
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'E1', token: 'tok' }))
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    goi.push({ url, body: JSON.parse(String(init.body)) })
    return new Response(JSON.stringify(tra), { headers: { 'content-type': 'application/json' } })
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear() })

describe('NutHoiThay', () => {
  it('không có phiên học sinh ⇒ không hiện nút', () => {
    localStorage.clear()
    render(<NutHoiThay qid="12-A-II-4" nguon="on_lai" />)
    expect(screen.queryByRole('button', { name: /Hỏi thầy/ })).toBeNull()
  })

  it('câu chưa có hồ sơ ⇒ KHÔNG hiện lời giải ngắn, chỉ báo thầy đang soạn; gọi đúng lệnh + qid + nguồn; không tính trợ giúp (thầy chốt 29/09)', async () => {
    tra = { ok: true, coLoiGiai: false, cau: CAU, loiGiaiChu: { dapAn: 'DSSD', chot: 'Chốt thử', tung: [{ id: 'a', dung: true, viSao: 'vì a' }], buoc: [], ketQua: '' } }
    const onHoi = vi.fn()
    render(<NutHoiThay qid="12-A-II-4" nguon="on_lai" onHoi={onHoi} />)
    fireEvent.click(screen.getByRole('button', { name: /Hỏi thầy/ }))
    await waitFor(() => expect(screen.getByText(/Thầy đang soạn lời giải từng bước cho câu này/)).toBeTruthy())
    const hoi = goi.find(x=>x.url==='https://may.test/hs/hoi-thay')
    expect(hoi).toBeTruthy()
    expect(hoi!.body).toEqual({ token: 'tok', qid: '12-A-II-4', nguon: 'on_lai' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('Chốt thử')).toBeNull()
    expect(onHoi).not.toHaveBeenCalled()
  })
  it('có hồ sơ ⇒ mở khung lời giải từng bước (iframe sandbox, không allow-same-origin)', async () => {
    tra = { ok: true, coLoiGiai: true, cau: CAU, hoSo: { qid: CAU.qid, bam: 'b', dang: 'ds', ten: 'T', co: [] } }
    render(<NutHoiThay qid="12-A-II-4" nguon="game" />)
    fireEvent.click(screen.getByRole('button', { name: /Hỏi thầy/ }))
    const khung = await waitFor(() => { const k = document.querySelector('iframe'); if (!k) throw new Error('chưa mở'); return k })
    expect(khung.getAttribute('sandbox')).toBe('allow-scripts')
    expect(khung.getAttribute('src')).toContain('loi-giai/khung.html')
  })

  it('máy chủ khoá (đang có ca kiểm tra) ⇒ nói đúng lý do, không mở gì, không gọi onHoi', async () => {
    tra = { ok: false, khoa: 'dang_kiem_tra', error: 'Em đang có ca kiểm tra mở nên nút Hỏi thầy tạm khoá.' }
    const onHoi = vi.fn()
    render(<NutHoiThay qid="12-A-II-4" nguon="dao" onHoi={onHoi} />)
    fireEvent.click(screen.getByRole('button', { name: /Hỏi thầy/ }))
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('ca kiểm tra mở'))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onHoi).not.toHaveBeenCalled()
  })
})

describe('KHÔNG có nút Hỏi thầy trong lúc kiểm tra (khoá nguồn)', () => {
  it('màn thi và thẻ câu dùng chung của màn thi không gắn nút / không gọi /hs/hoi-thay', async () => {
    const fs = await import('node:fs')
    const ma = fs.readFileSync('src/screens/ExamTakeScreen.tsx', 'utf8')
    expect(ma).not.toMatch(/NutHoiThay|hoi-thay|hoiThay/)
    // SỬA CÓ CHỦ Ý 30/09 (thầy: nút chỉ hiện khi lời giải đang hiện): TheCau vẽ nút TRONG khối LỜI GIẢI (chỉ chế độ xem_lai)
    // và chỉ khi nơi gọi truyền `hoiThay` — màn thi không truyền (kiểm ở trên). Không gọi /hs/hoi-thay trực tiếp.
    const the = fs.readFileSync('src/components/TheCau.tsx', 'utf8')
    expect(the).not.toMatch(/hoi-thay/)
    expect(the).toContain('{xemLai && <LoiGiai props={props}')
    const lg = the.slice(the.indexOf('function LoiGiai('), the.indexOf('export default function TheCau'))
    expect(lg).toContain('<NutHoiThay')
    expect(the.split('<NutHoiThay').length).toBe(2)
  })
})
