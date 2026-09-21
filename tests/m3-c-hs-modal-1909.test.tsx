// Việc C · nhóm C, phần BaoCaoCaThiHocSinhModal (Code 4). Tệp này thuộc LUỒNG THI THẬT (ExamTakeScreen import nó) và còn được
// app GIÁO VIÊN mở (HocSinhScreen, ExamMonitorScreen) nên commit RIÊNG, xin 0.Planer soát diff trước khi lên máy chủ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import BaoCaoCaThiHocSinhModal from '../src/components/BaoCaoCaThiHocSinhModal'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const datDuong = (d: string) => window.history.replaceState(null, '', d)
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  datDuong('/')
})
const CAU_SAI = [
  { qid: 'q1', soCau: 7, phan: 'I', chuyenDe: 'Ancol', mucDo: 'Nhận biết', dapAnChon: 'A', dapAnDung: 'B', text: 'Ancol nào là ancol bậc II?', choices: ['a', 'b', 'c', 'd'], maCa: 'CA-ANCOL' },
  { qid: 'q3', soCau: 9, phan: 'III', chuyenDe: 'Este', mucDo: 'Vận dụng', dapAnChon: '4,48', dapAnDung: '4,96', text: 'Tính V.', maCa: 'CA-ANCOL' },
]
const LICH_SU = [
  { maCa: 'CA-HALO', tenCa: 'Ca Halogen', tong: 6.5, tongCau: 28, soCauDung: 17, soCauSai: 11, nopLuc: '2026-09-08T10:00:00Z' },
  { maCa: 'CA-ESTE', tenCa: 'Ca Este', tong: 8.25, tongCau: 28, soCauDung: 23, soCauSai: 5, nopLuc: '2026-09-12T10:00:00Z' },
]
const BAI = { maCa: 'CA-ANCOL', tenCa: 'Ca Ancol 15/09', ngayThi: '15/09/2026', diem: 9.5, diemI: 4.5, diemII: 3.5, diemIII: 1.5, thoiGianPhut: 41, soCauDung: 26, soCauSai: 2, tongCau: 28, soCauDungMotPhan: 0, soCauBoTrong: 0, soYDungII: 14, soYTongII: 16, lanThu: 1 }
function giaLapMayChu() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const u = new URL(String(url)).pathname
      const ok = (b: unknown) => ({ ok: true, status: 200, json: async () => b, text: async () => JSON.stringify(b) })
      if (u.endsWith('/hs/lich-su')) return ok({ ok: true, items: LICH_SU })
      if (u.endsWith('/hs/cau-sai')) return ok({ ok: true, items: CAU_SAI })
      return ok({ ok: true, items: [] })
    }),
  )
}
const dungHS = (onClose = vi.fn(), tab = 'tong_quan') =>
  render(<BaoCaoCaThiHocSinhModal baiThi={BAI as any} hoTen="Minh" sbd="12001" lop="12A1" scriptUrl="https://may.test" onClose={onClose} onBatDauKhacPhuc={() => {}} tabMacDinh={tab} />)

describe('BaoCaoCaThiHocSinhModal (dùng chung với app giáo viên)', () => {
  it('đường học sinh (?vai=hocsinh): gốc `m3`, dải 4 màu ẩn, nút KHẮC PHỤC NGAY là nút chính M3, đóng bấm được', async () => {
    datDuong('/?vai=hocsinh')
    giaLapMayChu()
    const onClose = vi.fn()
    dungHS(onClose)
    const goc = document.querySelector('.fixed.inset-0') as HTMLElement
    expect(goc.classList.contains('m3')).toBe(true)
    expect(document.querySelector('.m3-an')).toBeTruthy()
    const cta = await screen.findByRole('button', { name: 'KHẮC PHỤC NGAY 2 CÂU SAI' })
    await waitFor(() => expect((cta as HTMLButtonElement).disabled).toBe(false))
    expect(cta.className).toContain('m3-nut-chinh')
    expect(cta.className).not.toContain('bg-gradient')
    fireEvent.click(screen.getByRole('button', { name: 'Đóng báo cáo' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('đường màn thi (?examCode=): em vừa nộp bài cũng thấy bản M3', () => {
    datDuong('/?examCode=123456')
    giaLapMayChu()
    dungHS()
    expect((document.querySelector('.fixed.inset-0') as HTMLElement).classList.contains('m3')).toBe(true)
  })

  it('đường GIÁO VIÊN (/): KHÔNG lớp m3 nào; nút KHẮC PHỤC NGAY giữ gradient rose→amber của bản cũ', async () => {
    datDuong('/')
    giaLapMayChu()
    dungHS()
    expect(document.querySelector('.m3')).toBeNull()
    expect(document.querySelector('[class*="m3-"]')).toBeNull()
    const cta = await screen.findByRole('button', { name: 'KHẮC PHỤC NGAY 2 CÂU SAI' })
    expect(cta.className).toContain('from-rose-600 via-rose-500 to-amber-500')
  })

  it('4 thẻ đổi được; câu sai hiện đủ; mô tả mức nhận thức KHÔNG còn chữ "Vòng 1/2/3" của hệ BTVN cũ', async () => {
    datDuong('/?vai=hocsinh')
    giaLapMayChu()
    dungHS()
    fireEvent.click(await screen.findByRole('button', { name: /Câu sai cần chữa \(2\)/ }))
    expect(await screen.findByText(/Câu 7/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Mức độ nhận thức' }))
    expect(screen.getByText('Lý thuyết cơ bản, công thức, khái niệm')).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/Vòng [123]|Lõi Căn Bản|Trọng Tâm Cá Nhân|Thử Thách Bứt Phá/)
    fireEvent.click(screen.getByRole('button', { name: 'Mức tiến bộ' }))
    expect(await screen.findByText('Mức độ tiến bộ qua các ca kiểm tra')).toBeTruthy()
  })
})


describe('câu chữ và luật đã khoá ở nơi khác vẫn nguyên (modal học sinh)', () => {
  it('không còn mô tả 3 vòng; logic/nhãn test khoá còn đủ', () => {
    const nd = doc('src/components/BaoCaoCaThiHocSinhModal.tsx')
    expect(nd).not.toMatch(/Vòng [123]:|Lõi Căn Bản|Trọng Tâm Cá Nhân|Thử Thách Bứt Phá/)
    expect(nd).toContain('Câu sai cần chữa ({soKhacPhuc})')
    expect(nd).toContain('<DongCauSai key={c.qid')
    expect(nd).toContain('KHẮC PHỤC NGAY ${soKhacPhuc} CÂU SAI')
  })
})
