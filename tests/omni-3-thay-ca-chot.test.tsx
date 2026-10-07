// OMNI 3 · C1 — CA CHỐT 50/50 trên đường "Mở ca chốt" sẵn có (Buổi chữa → màn Mở ca kiểm tra).
// Khoá: OMNI áp cho lớp ⇒ câu lấy từ `/gv/omni {action:'ca-chot'}` thay danh sách cũ (gói ghi `omni: true`); màn Mở ca tạo xong ca từ gói ấy ⇒ gọi
// thêm MỘT lệnh `gan-ca-chot {chienDichId, maCa}` (không đổi màn). OMNI tắt / lỗi ⇒ đúng đường cũ, không gọi gì thêm.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

const m = vi.hoisted(() => ({ goi: vi.fn(), publish: vi.fn(), address: vi.fn(), save: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => m.goi(duong, body) }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: m.address }))
vi.mock('../src/lib/exam-api', async (goc) => ({ ...(await goc<Record<string, unknown>>()), danhSachEm: async () => [], publishSession: m.publish }))
const de = (maDe: string, nI: number, nII: number): TeacherExamSource => ({
  maDe,
  nhom: '12 · C1 - Ester lipid',
  nguon: `Nguồn ${maDe}`,
  phanI: Array.from({ length: nI }, (_, i) => ({ id: `${maDe}-I-${i + 1}`, text: `Câu ${maDe} phần I số ${i + 1}`, choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester' })) as never,
  phanII: Array.from({ length: nII }, (_, i) => ({ id: `${maDe}-II-${i + 1}`, text: `Câu ${maDe} phần II số ${i + 1}`, ideas: ['a', 'b', 'c', 'd'], correct: 'DDDD' })) as never,
  phanIII: [],
})
const KHO = [de('12-C1-B2', 10, 4), de('11-C1-B1', 8, 2)]
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  loadScriptUrl: async () => '',
  loadTeacherSecret: async () => 'test-only',
  loadExamSources: async () => KHO,
  loadAllSessionTeacherBanks: async () => [],
  docSoCauCa: async () => undefined,
  luuSoCauCa: vi.fn(async () => undefined),
  saveSessionTeacherBank: m.save,
}))
vi.mock('../src/lib/exam-sync', () => ({ dongBoNganHang: async () => null }))
vi.mock('../src/components/NutDongBo', () => ({ default: () => null }))

import BuoiChua, { KHOA_CA_CHOT } from '../src/components/chien-dich/BuoiChua'
import LenBangChienDich from '../src/components/chien-dich/LenBangChienDich'
import type { BuoiChuaMayChu, CauBuoiChua, EmTen } from '../src/components/chien-dich/api'
import { docGoiCaChot } from '../src/lib/ca-chot-chien-dich'
import { useAppStore } from '../src/store/appStore'

const E = (s: string): EmTen => ({ sbd: s, ten: `Em ${s}` })
const cau = (stt: number, dang: string): CauBuoiChua => ({ qid: `DE-A-I-${stt}`, stt, dang, phan: 'I', mucDo: 'VD', soChuaThanhThao: 2, soCanDayLai: 1, diemChua: 4, giaiMau: E('01'), emSua: [E('02')] })
const BUOI: BuoiChuaMayChu = {
  chienDich: { id: 'cd-1', ten: 'Bài 6 · Tinh bột', hanNop: '2026-10-04', lop: '12A1' },
  hetHan: true,
  soEm: 2,
  lop: { coXat: 0.96, thanhThao: 0.51 },
  cau: [cau(17, 'Thuỷ phân'), cau(23, 'Danh pháp')],
}
const QIDS_OMNI = Array.from({ length: 28 }, (_, i) => `Q-${i + 1}`)

beforeEach(() => {
  m.goi.mockReset()
  sessionStorage.clear()
})
afterEach(cleanup)

describe('Buổi chữa: nút "Mở ca chốt"', () => {
  const ve = (caChotOmni?: { qids: string[]; soLa: number; soCu: number } | null) =>
    render(
      <BuoiChua
        du={BUOI}
        dsEm={[E('01'), E('02')]}
        coMat={['01', '02']}
        canDayLai={[]}
        homNay="2026-10-05"
        tra={new Map()}
        dangChieu={false}
        onChieu={vi.fn(async () => true)}
        onDoiCoMat={vi.fn()}
        onDaChua={vi.fn()}
        caChotOmni={caChotOmni}
      />,
    )
  it('có gói ca chốt 50/50 ⇒ nút đếm đúng số câu OMNI, gói ghi câu OMNI + `omni: true`; màn con không tự gọi lệnh nào', () => {
    ve({ qids: QIDS_OMNI, soLa: 14, soCu: 14 })
    const nut = screen.getByRole('button', { name: 'Mở ca chốt · 28 câu' })
    expect(nut.getAttribute('title')).toContain('14 câu của bài + 14 câu chưa gặp')
    fireEvent.click(nut)
    const goi = JSON.parse(sessionStorage.getItem(KHOA_CA_CHOT) ?? '{}')
    expect(goi).toEqual({ chienDichId: 'cd-1', ten: 'Bài 6 · Tinh bột', lop: '12A1', qids: QIDS_OMNI, omni: true })
    expect(docGoiCaChot()?.omni).toBe(true)
    expect(useAppStore.getState().screen).toBe('examsetup')
    expect(m.goi).not.toHaveBeenCalled()
  })
  it('không có gói OMNI ⇒ đúng danh sách cũ, gói KHÔNG có cờ omni', () => {
    ve(null)
    fireEvent.click(screen.getByRole('button', { name: /^Mở ca chốt · \d+ câu$/ }))
    const goi = JSON.parse(sessionStorage.getItem(KHOA_CA_CHOT) ?? '{}')
    expect(goi.omni).toBeUndefined()
    expect(goi.qids).toEqual(['DE-A-I-17', 'DE-A-I-23'])
    expect(docGoiCaChot()?.omni).toBeUndefined()
  })
})

describe('màn Lên bảng: chiến dịch hết hạn ⇒ đọc sẵn gói ca chốt khi OMNI áp cho lớp', () => {
  const DS = { homNay: '2026-10-05', chienDich: [{ id: 'cd-1', ten: 'Bài 6 · Tinh bột', lop: '12A1', maDe: ['DE-A'], hanNop: '2026-10-04', theLucNgay: 40, huyetChien: true, maCa: null, taoLuc: '2026-09-27', trangThai: 'dang_chay', soCau: 40, soEm: 2, hetHan: true }] }
  const BANG = { chienDich: { ...DS.chienDich[0] }, homNay: '2026-10-05', hetHan: true, lop: { coXat: 0.9, thanhThao: 0.5, huyetChien: 0, canDayLaiCau: 0, canDayLaiLuot: 0 }, dang: ['Thuỷ phân'], em: [{ sbd: '01', ten: 'Em 01', coXat: 1, thanhThao: 1, canDayLai: 0, treNhip: 0, huyetChien: false, theoDang: {} }], canDayLai: [] }
  const mock = (co: Record<string, unknown>) =>
    m.goi.mockImplementation(async (d: string, b: Record<string, unknown>) => {
      if (d === '/gv/chien-dich' && b.action === 'danh-sach') return { ok: true, du: { ok: true, ...DS } }
      if (d === '/gv/chien-dich' && b.action === 'bang') return { ok: true, du: { ok: true, ...BANG } }
      if (d === '/gv/chien-dich' && b.action === 'buoi-chua') return { ok: true, du: { ok: true, ...BUOI } }
      if (d === '/gv/omni' && b.action === 'co-doc') return { ok: true, du: { ok: true, co } }
      if (d === '/gv/omni' && b.action === 'ca-chot') return { ok: true, du: { ok: true, qids: QIDS_OMNI, soLa: 14, soCu: 14 } }
      return { ok: false, loai: 'tu_choi', chu: 'lệnh lạ' }
    })
  it('OMNI bật cho lớp 12A1 ⇒ `ca-chot {chienDichId}` và nút "Mở ca chốt · 28 câu"', async () => {
    mock({ bat: true, lop: ['12A1'], sbd: [] })
    render(<LenBangChienDich />)
    fireEvent.click(await screen.findByRole('button', { name: 'Điểm danh 1 học sinh' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Chốt 1 em có mặt' }))
    expect(await screen.findByRole('button', { name: 'Mở ca chốt · 28 câu' })).toBeTruthy()
    expect(m.goi).toHaveBeenCalledWith('/gv/omni', { action: 'ca-chot', chienDichId: 'cd-1' })
  })
  it('OMNI không áp cho lớp ⇒ không hỏi `ca-chot`, nút dùng danh sách cũ', async () => {
    mock({ bat: true, lop: ['11B'], sbd: [] })
    render(<LenBangChienDich />)
    fireEvent.click(await screen.findByRole('button', { name: 'Điểm danh 1 học sinh' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Chốt 1 em có mặt' }))
    expect(await screen.findByRole('button', { name: 'Mở ca chốt · 2 câu' })).toBeTruthy()
    await waitFor(() => expect(m.goi.mock.calls.some(([d, b]) => d === '/gv/omni' && b.action === 'co-doc')).toBe(true))
    expect(m.goi.mock.calls.some(([, b]) => b.action === 'ca-chot')).toBe(false)
  })
})

describe('màn Mở ca kiểm tra: tạo xong ca từ gói ca chốt 50/50 ⇒ `gan-ca-chot`', () => {
  const GOI = { chienDichId: 'cd1', ten: 'Bài 6 · Tinh bột', lop: '12A1', qids: ['12-C1-B2-I-3', '12-C1-B2-I-7', '11-C1-B1-II-2'] }
  beforeEach(() => {
    m.address.mockResolvedValue('https://test.example')
    m.publish.mockResolvedValue({ batDau: '2026-10-05T10:00:00Z', hetHanVao: '' })
    m.save.mockResolvedValue(undefined)
    m.goi.mockResolvedValue({ ok: true, du: { ok: true } })
  })
  const moCa = async () => {
    const { default: ExamSetupScreen } = await import('../src/screens/ExamSetupScreen')
    render(<ExamSetupScreen />)
    const nut = await screen.findByRole('button', { name: /Mở ca kiểm tra ngay/ })
    await waitFor(() => expect((nut as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(nut)
    expect(await screen.findByRole('heading', { name: 'Ca đã mở' })).toBeTruthy()
    return m.publish.mock.calls[0]![1] as string
  }
  it('gói có `omni: true` ⇒ đúng MỘT lệnh gan-ca-chot với mã ca vừa mở', async () => {
    sessionStorage.setItem(KHOA_CA_CHOT, JSON.stringify({ ...GOI, omni: true }))
    const maCa = await moCa()
    expect(maCa).toBeTruthy()
    await waitFor(() => expect(m.goi).toHaveBeenCalledWith('/gv/omni', { action: 'gan-ca-chot', chienDichId: 'cd1', maCa }))
    expect(m.goi.mock.calls.filter(([, b]) => b.action === 'gan-ca-chot')).toHaveLength(1)
  })
  it('gói cũ (không omni) ⇒ màn như trước, không gọi gan-ca-chot', async () => {
    sessionStorage.setItem(KHOA_CA_CHOT, JSON.stringify(GOI))
    await moCa()
    await new Promise((r) => setTimeout(r, 20))
    expect(m.goi.mock.calls.some(([, b]) => b?.action === 'gan-ca-chot')).toBe(false)
  })
})
