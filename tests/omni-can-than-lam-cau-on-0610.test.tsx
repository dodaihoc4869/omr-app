// CHƯƠNG TRÌNH "CẨN THẬN" · LÀM CÂU ÔN (đặc tả 4.6(b); thầy 06/10 "Làm nốt đi tất cả") — LÀN B, đợt 2 sáng 06/10.
// CHỈ khi cổng học sinh truyền `canThan` (`hoa2-sanh` → omni.canThan: OMNI bật ∧ Sơ ý > 7%): câu PHẦN III có ô một chạm "Soát lại đơn vị và số liệu" dưới ô đáp số
// — KHÔNG bắt buộc, không chặn nút Nộp, không thêm gì vào thân `/hs/on-lai/nop`. Vắng `canThan` ⇒ DOM + thân lệnh y hệt hôm nay.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import LamCauOn from '../src/components/bang-nhiem-vu/LamCauOn'
import { CHU_SOAT_LAI } from '../src/lib/omni-chu'
import { canThanTuSanh, docSanh } from '../src/components/hoa2/api'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const CAU = [
  { qid: 'on1', phan: 'I', text: 'Este X có tên gọi là gì?', choices: ['etyl axetat', 'metyl propionat', 'propyl fomat', 'isopropyl fomat'], ideas: [], hinhAnh: [], tenDang: 'Danh pháp este' },
  { qid: 'on2', phan: 'II', text: 'Xét đúng sai từng ý:', choices: [], ideas: ['ý một', 'ý hai', 'ý ba', 'ý bốn'], hinhAnh: [] },
  { qid: 'on3', phan: 'III', text: 'Tính V (ml).', choices: [], ideas: [], hinhAnh: [] },
  { qid: 'on4', phan: 'III', text: 'Tính m (gam).', choices: [], ideas: [], hinhAnh: [] },
]
const KQ3 = { qid: 'on3', dung: true, dapAnDung: '125', loiGiai: { chot: 'n = 0,125 mol.', buoc: ['V = 125 ml.'] }, anhLoiGiai: [] }

type Goi = { url: string; body: Record<string, unknown> }
let goi: Goi[]
beforeEach(() => {
  goi = []
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    const u = new URL(String(url)).pathname
    const body = JSON.parse(String(init.body || '{}')) as Record<string, unknown>
    goi.push({ url: u, body })
    const d = u === '/hs/cau-theo-qid' ? { ok: true, cau: CAU, khongCo: [] } : u === '/hs/on-lai/nop' ? { ok: true, ketQua: [KQ3], khongCo: [], chuaLam: [], tienBo: null, exp: 0 } : {}
    return { ok: true, status: 200, json: async () => d }
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

const dung = (extra: Partial<React.ComponentProps<typeof LamCauOn>> = {}) =>
  render(<LamCauOn token="tok-hs" sbd="12121212" viecId="on_lai:2026-10-06" qid={['on1', 'on2', 'on3', 'on4']} tieuDe="Ôn 4 câu" onXong={vi.fn()} {...extra} />)
const the = (i: number) => document.querySelectorAll<HTMLElement>('.lco-the')[i]!
const soat = (i: number) => within(the(i)).queryByRole('checkbox', { name: CHU_SOAT_LAI }) as HTMLInputElement | null
const gõ = (i: number, t: string) => fireEvent.change(within(the(i)).getByRole('textbox'), { target: { value: t } })
const nutNop = () => screen.getByRole('button', { name: /^Nộp/ }) as HTMLButtonElement

describe('Làm câu ôn · (b) ô "Soát lại đơn vị và số liệu"', () => {
  it('canThan VẮNG ⇒ KHÔNG ô nào (DOM như hôm nay)', async () => {
    dung()
    await screen.findByText('Tính V (ml).')
    expect(document.querySelectorAll('.lco-soat')).toHaveLength(0)
    expect(screen.queryByText(CHU_SOAT_LAI)).toBeNull()
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
  })

  it('canThan sai (false) ⇒ KHÔNG ô nào', async () => {
    dung({ canThan: false })
    await screen.findByText('Tính V (ml).')
    expect(document.querySelectorAll('.lco-soat')).toHaveLength(0)
  })

  it('canThan ⇒ ô CHỈ ở câu Phần III (mỗi câu một ô), đúng chữ, mặc định tắt, dùng hàng chọn lco-lua sẵn có; chạm bật/tắt riêng từng câu', async () => {
    dung({ canThan: true })
    await screen.findByText('Tính V (ml).')
    expect(document.querySelectorAll('.lco-soat')).toHaveLength(2) // câu 3 và câu 4 (Phần III)
    expect(soat(0)).toBeNull() // Phần I
    expect(soat(1)).toBeNull() // Phần II
    const o3 = soat(2)!, o4 = soat(3)!
    expect(o3.checked).toBe(false)
    expect(o3.closest('label')?.className).toBe('lco-lua lco-soat')
    expect(o3.closest('label')?.textContent).toBe(CHU_SOAT_LAI)
    expect(CHU_SOAT_LAI).toBe('Soát lại đơn vị và số liệu')
    fireEvent.click(o3)
    expect(o3.checked).toBe(true)
    expect(o3.closest('label')?.hasAttribute('data-chon')).toBe(true)
    expect(o4.checked).toBe(false) // câu 4 không bị kéo theo
    fireEvent.click(o3)
    expect(o3.checked).toBe(false)
  })

  it('KHÔNG bắt buộc: không chạm ô vẫn nộp được; chạm ô KHÔNG đổi thân /hs/on-lai/nop; nộp xong ô biến mất', async () => {
    const nop = async (chamO: boolean) => {
      goi = []
      cleanup()
      dung({ canThan: true })
      await screen.findByText('Tính V (ml).')
      gõ(2, '125')
      if (chamO) fireEvent.click(soat(2)!)
      expect(nutNop().disabled).toBe(false) // đã có câu trả lời ⇒ nộp được, dù chưa soát
      fireEvent.click(nutNop())
      await waitFor(() => expect(goi.some((g) => g.url === '/hs/on-lai/nop')).toBe(true))
      return goi.find((g) => g.url === '/hs/on-lai/nop')!.body
    }
    const khongCham = await nop(false)
    const coCham = await nop(true)
    expect(coCham).toEqual(khongCham) // không gửi thêm trường nào
    expect(Object.keys(coCham).sort()).toEqual(Object.keys(khongCham).sort())
    // sau khi nộp (câu 3 đã chấm): ô của câu 3 biến mất, câu 4 chưa chấm vẫn còn
    await screen.findByText(/Đáp án đúng/)
    await waitFor(() => expect(soat(2)).toBeNull())
    expect(soat(3)).toBeTruthy()
  })
})

describe('cổng học sinh · canThanTuSanh (hoa2-sanh → omni.canThan) quyết việc truyền `canThan` cho Làm câu ôn', () => {
  const OMNI = { bat: true, baiDangLuyen: [], dangVung: { a: 0, b: 0 }, conDangDe8: null, sEm: 0.11, sMucTieu: 0.07, chungChi: [], ve: { con: 2, tong: 2 }, choBaiMoi: false, onBaiCu: 0, metGio: null, nhatKy: null, deThu: { duoc: false, soCau: 14, phut: 25 } }
  const sanh = (omni?: object) => docSanh({ ok: true, cheDo2: true, ngay: '2026-10-06', chienDich: null, theLuc: { con: 3, tong: 40 }, huyetChien: false, doan: { con: 0 }, dao: { con: 3 }, khoaDao: false, ruong: { daLam: 1, tong: 2, moDuoc: false, daMo: false }, ...(omni ? { omni } : {}) })
  it('CHỈ khi Sảnh có omni.canThan === true', () => {
    expect(canThanTuSanh(sanh({ ...OMNI, canThan: true }))).toBe(true)
    expect(canThanTuSanh(sanh(OMNI))).toBe(false) // OMNI bật, Sơ ý ≤ 7%
    expect(canThanTuSanh(sanh({ ...OMNI, canThan: 'true' }))).toBe(false)
    expect(canThanTuSanh(sanh())).toBe(false) // OMNI tắt
    expect(canThanTuSanh(docSanh({ ok: true, cheDo2: false }))).toBe(false) // Hoá 2.0 tắt
    expect(canThanTuSanh(null)).toBe(false)
    expect(canThanTuSanh(undefined)).toBe(false)
  })
})
