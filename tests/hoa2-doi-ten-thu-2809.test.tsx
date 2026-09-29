// ĐỔI TÊN THẦN THÚ trên Sảnh Game Hóa 2.0 (thầy 28/09): nút bút chì ở HUD ⇒ hộp chung HopXacNhan (ô nhập sẵn tên, đếm x/16,
// "Lưu tên" mờ khi đang gửi, lỗi máy chủ ngay dưới ô) ⇒ lưu xong tên mới hiện ngay. Máy chủ: tests/than-thu-v2.test.ts.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import SanhBanDo, { type SanhBanDoProps, type ThuTrenHud } from '../src/components/hoa2/SanhBanDo'
import { docSanh, doiTenThu, type KetQuaSanh } from '../src/components/hoa2/api'
import { useState } from 'react'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => <div /> }))

const SANH = {
  ok: true,
  cheDo2: true,
  ngay: '2026-09-30',
  chienDich: null,
  theLuc: { con: 32, tong: 40 },
  huyetChien: false,
  doan: { con: 0 },
  dao: { con: 28 },
  khoaDao: false,
  loiKhoaDao: '',
  ruong: { daLam: 8, tong: 40, moDuoc: false, daMo: false },
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/** Vỏ giống StudentPortalScreen: lưu xong phủ tên mới lên HUD. */
function Vo({ onDoiTen, ghiDe = {} }: { onDoiTen: (ten: string) => Promise<void>; ghiDe?: Partial<SanhBanDoProps> }) {
  const [thu, setThu] = useState<ThuTrenHud>({ index: 2, cap: 7, ten: 'Lửa Nhỏ' })
  const props: SanhBanDoProps = {
    ketQua: docSanh(SANH) as KetQuaSanh,
    loi: '',
    dangTai: false,
    thu,
    exp: { homNay: 22, conThieu: 160 },
    chuoiNgay: 5,
    caDangMo: false,
    now: Date.UTC(2026, 8, 30, 7),
    token: 'tk',
    shopBat: false,
    onVaoThi: vi.fn(),
    onPhaPhucKich: vi.fn(),
    onKhamPhaDao: vi.fn(),
    onCauDaLam: vi.fn(),
    onTuiDo: vi.fn(),
    onCuaHang: vi.fn(),
    onMoThanThu: vi.fn(),
    onChonThu: vi.fn(),
    onDangXuat: vi.fn(),
    onTaiLai: vi.fn(),
    onDoiTen: async (ten) => {
      await onDoiTen(ten)
      setThu((t) => ({ ...t, ten }))
    },
    ...ghiDe,
  }
  return <SanhBanDo {...props} />
}

const moHop = () => fireEvent.click(screen.getByRole('button', { name: /Đổi tên thần thú/ }))
const o = () => screen.getByLabelText(/Tên thần thú/) as HTMLInputElement
const nutLuu = () => screen.getByRole('button', { name: 'Lưu tên' }) as HTMLButtonElement

describe('Đổi tên thần thú trên Sảnh', () => {
  it('không truyền onDoiTen ⇒ không có nút bút chì', () => {
    render(<Vo onDoiTen={async () => {}} ghiDe={{ onDoiTen: undefined }} />)
    expect(screen.queryByRole('button', { name: /Đổi tên thần thú/ })).toBeNull()
  })

  it('mở hộp: ô nhập sẵn tên hiện tại, đếm x/16; quá 16 ký tự ⇒ nút Lưu tên tắt', () => {
    render(<Vo onDoiTen={async () => {}} />)
    moHop()
    expect(screen.getByRole('dialog', { name: 'Đổi tên thần thú' })).toBeTruthy()
    expect(o().value).toBe('Lửa Nhỏ')
    expect(screen.getByText('7/16')).toBeTruthy()
    fireEvent.change(o(), { target: { value: '  Thương   Thương Ơi ' } })
    expect(screen.getByText('16/16')).toBeTruthy()
    expect(nutLuu().disabled).toBe(false)
    fireEvent.change(o(), { target: { value: 'Thương Thương Ơii' } })
    expect(screen.getByText('17/16').getAttribute('data-qua')).toBe('true')
    expect(nutLuu().disabled).toBe(true)
  })

  it('lưu: nút mờ khi đang gửi (giữ chữ), xong đóng hộp và tên mới hiện ngay ở HUD', async () => {
    let xong!: () => void
    const goi = vi.fn(() => new Promise<void>((r) => (xong = r)))
    render(<Vo onDoiTen={goi} />)
    moHop()
    fireEvent.change(o(), { target: { value: ' Rồng   Lam ' } })
    fireEvent.click(nutLuu())
    expect(goi).toHaveBeenCalledWith('Rồng Lam')
    expect(nutLuu().disabled).toBe(true)
    expect(nutLuu().textContent).toBe('Lưu tên')
    await act(async () => xong())
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByText('Rồng Lam · Cấp 7')).toBeTruthy()
  })

  it('lỗi máy chủ hiện ngay dưới ô, hộp vẫn mở; gõ lại thì lỗi tắt', async () => {
    const goi = vi.fn(async () => {
      throw new Error('Hôm nay em đã đổi tên 3 lần rồi. Mai em đổi tiếp nhé.')
    })
    render(<Vo onDoiTen={goi} />)
    moHop()
    fireEvent.change(o(), { target: { value: 'Mây Bông' } })
    fireEvent.click(nutLuu())
    expect((await screen.findByRole('alert')).textContent).toMatch(/đã đổi tên 3 lần/)
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(nutLuu().disabled).toBe(false)
    fireEvent.change(o(), { target: { value: 'Mây Bông 2' } })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('tên sai luật / từ tục ⇒ báo ngay ở máy, KHÔNG gọi máy chủ', () => {
    const goi = vi.fn(async () => {})
    render(<Vo onDoiTen={goi} />)
    moHop()
    fireEvent.change(o(), { target: { value: 'Óc Chó' } })
    fireEvent.click(nutLuu())
    expect(screen.getByRole('alert').textContent).toBe('Tên này chưa phù hợp, em chọn tên khác nhé.')
    fireEvent.change(o(), { target: { value: 'Rồng🐉' } })
    fireEvent.click(nutLuu())
    expect(screen.getByRole('alert').textContent).toMatch(/1–16/)
    expect(goi).not.toHaveBeenCalled()
  })

  it('Huỷ / Esc đóng hộp, giữ tên cũ', () => {
    render(<Vo onDoiTen={async () => {}} />)
    moHop()
    fireEvent.change(o(), { target: { value: 'Tên Khác' } })
    fireEvent.click(screen.getByRole('button', { name: 'Huỷ' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('Lửa Nhỏ · Cấp 7')).toBeTruthy()
  })
})

describe('doiTenThu (api)', () => {
  it('gọi POST /game-v2/rename kèm token, trả tên máy chủ đã lưu; ok:false ⇒ ném câu của máy chủ', async () => {
    const f = vi.fn(async (_u: string, init: any) => {
      const b = JSON.parse(init.body)
      if (b.name === 'Óc Chó') return { ok: true, status: 200, json: async () => ({ ok: false, error: 'Tên này chưa phù hợp, em chọn tên khác nhé.' }) }
      return { ok: true, status: 200, json: async () => ({ ok: true, profile: { nickname: b.name } }) }
    })
    vi.stubGlobal('fetch', f)
    expect(await doiTenThu('tk', 'Rồng Lam')).toBe('Rồng Lam')
    expect(f.mock.calls[0][0]).toBe('https://may.test/game-v2/rename')
    expect(JSON.parse((f.mock.calls[0][1] as any).body)).toEqual({ name: 'Rồng Lam', token: 'tk' })
    await expect(doiTenThu('tk', 'Óc Chó')).rejects.toThrow('Tên này chưa phù hợp, em chọn tên khác nhé.')
  })
})
