/**
 * HAI BỂ EXP — ỐNG NGHIỆM VÀ THANH CẤP ĐỘ.
 *
 * Thầy chốt 15-09: EXP hiện kiểu ống nghiệm, bấm nạp thì ống vơi, kiếm được thì
 * đầy lên. Ba luật phải giữ, và phép kiểm này giữ cả ba:
 *   1. Việc học chỉ đổ vào ỐNG. Không đường nào đổ thẳng vào thần thú.
 *   2. Nút nạp chỉ CHUYỂN chỗ, không sinh ra một điểm EXP nào.
 *   3. Ống đầy thì KHÔNG BAO GIỜ làm mất EXP em đã kiếm — giữ lại cho lần sau.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ThanThuHoaHocGame from '../src/components/ThanThuHoaHocGame'
import OngNghiemExp from '../src/components/OngNghiemExp'
import { SUC_CHUA_ONG, NGUON_EXP, thanhExp } from '../src/game/than-thu-hoa-hoc/kinh-nghiem'
import { vaHoSo, layHoSoThanThuMacDinh, KHOA_LUU_THAN_THU } from '../src/game/than-thu-hoa-hoc/he-thong-pet'

const KHOA_DA_NHAN = 'omr_than_thu_da_nhan_exp'

function hoSoCo(khoExp: number, capDo = 1, exp = 0) {
  return JSON.stringify({ idThanhThuChon: 'hoa_long', capDo, exp, khoExp })
}

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

/** 8 ca thi 10 điểm = 8 × 600 = 4 800 EXP, vượt xa trần ống 2 000. */
const NHIEU_CA = Array.from({ length: 8 }, (_, i) => ({ tong: 10, maCa: 'ca' + i }))

function gan(props: { khoExp?: number; capDo?: number; dsLichSu?: unknown[] } = {}) {
  localStorage.setItem(KHOA_LUU_THAN_THU, hoSoCo(props.khoExp ?? 0, props.capDo ?? 1))
  return render(
    <ThanThuHoaHocGame
      dsLichSu={(props.dsLichSu ?? []) as { tong?: number; maCa?: string }[]}
      dsBtvn={[]}
      onDong={() => {}} onChuyenSangKhacPhuc={() => {}}
      onChuyenSangBtvn={() => {}} onChuyenSangVaoThi={() => {}}
    />,
  )
}

const doc = () => JSON.parse(localStorage.getItem(KHOA_LUU_THAN_THU) ?? '{}')

describe('Hồ sơ có bể thứ nhất', () => {
  it('hồ sơ mới có ống rỗng', () => {
    expect(layHoSoThanThuMacDinh().khoExp).toBe(0)
  })
  it('hồ sơ cũ chưa có trường ống thì về 0, không ra NaN', () => {
    expect(vaHoSo({ capDo: 3, exp: 10 }).khoExp).toBe(0)
  })
  it('ống trong máy vượt trần thì cắt về trần', () => {
    expect(vaHoSo({ khoExp: 999999 }).khoExp).toBe(SUC_CHUA_ONG)
  })
  it('ống âm thì về 0', () => {
    expect(vaHoSo({ khoExp: -500 }).khoExp).toBe(0)
  })
})

describe('Ống nghiệm vẽ đúng mức', () => {
  it('vẽ ra SVG, không dùng tệp ảnh', () => {
    const { container } = render(<OngNghiemExp dangCo={500} sucChua={2000} />)
    expect(container.querySelector('svg')).toBeTruthy()
    expect(container.querySelector('img')).toBeNull()
  })
  it('ống càng nhiều EXP thì mặt nước càng cao', () => {
    const lay = (v: number) => {
      const { container } = render(<OngNghiemExp dangCo={v} sucChua={2000} />)
      const y = Number(container.querySelector('rect[height]')?.getAttribute('y') ?? 0)
      cleanup()
      return y
    }
    // y nhỏ = cao hơn trên màn
    expect(lay(1800)).toBeLessThan(lay(900))
    expect(lay(900)).toBeLessThan(lay(100))
  })
  it('đang rót thì mực về đáy', () => {
    const { container } = render(<OngNghiemExp dangCo={2000} sucChua={2000} dangRot />)
    const y = Number(container.querySelector('rect[height]')?.getAttribute('y') ?? 0)
    cleanup()
    const { container: c2 } = render(<OngNghiemExp dangCo={0} sucChua={2000} />)
    expect(y).toBe(Number(c2.querySelector('rect[height]')?.getAttribute('y') ?? -1))
  })
  it('chia cho 0 không làm vỡ', () => {
    expect(() => render(<OngNghiemExp dangCo={10} sucChua={0} />)).not.toThrow()
  })
})

describe('Việc học chỉ đổ vào ỐNG', () => {
  it('rót việc học thì ống đầy lên, thanh cấp độ KHÔNG đổi', async () => {
    gan({ dsLichSu: [{ tong: 8, maCa: 'c1' }] })   // 8 × 60 = 480 EXP
    fireEvent.click(screen.getByText('Rót việc học vào ống'))
    await waitFor(() => expect(doc().khoExp).toBe(480))
    expect(doc().exp).toBe(0)
    expect(doc().capDo).toBe(1)
  })

  it('nút rót không sinh EXP khi không có việc học mới', async () => {
    gan()
    fireEvent.click(screen.getByText('Rót việc học vào ống'))
    await waitFor(() => expect(screen.getByText(/Chưa có việc học nào mới/)).toBeTruthy())
    expect(doc().khoExp).toBe(0)
  })
})

describe('Nạp tinh lực: chuyển chỗ, không sinh EXP', () => {
  it('bấm nạp thì ống về 0 và thần thú lên cấp', async () => {
    gan({ khoExp: 700 })   // thanh cấp 1 là 300, cấp 2 là 380 -> lên cấp 3, dư 20
    fireEvent.click(screen.getByText(/Nạp 700 tinh lực/))
    await waitFor(() => expect(doc().khoExp).toBe(0))
    expect(doc().capDo).toBe(3)
    expect(doc().exp).toBe(700 - thanhExp(1) - thanhExp(2))
  })

  it('TỔNG EXP BẢO TOÀN — nạp không làm sinh ra hay mất đi điểm nào', async () => {
    gan({ khoExp: 900 })
    const truoc = doc()
    const tongTruoc = truoc.khoExp + truoc.exp
    fireEvent.click(screen.getByText(/Nạp 900 tinh lực/))
    await waitFor(() => expect(doc().khoExp).toBe(0))
    const sau = doc()
    let daTieu = 0
    for (let c = 1; c < sau.capDo; c++) daTieu += thanhExp(c)
    expect(sau.exp + daTieu).toBe(tongTruoc)
  })

  it('ống rỗng thì nút nạp bị khoá', () => {
    gan({ khoExp: 0 })
    const nut = screen.getByText(/Ống rỗng/).closest('button')!
    expect(nut.hasAttribute('disabled')).toBe(true)
  })

  it('bấm nạp hai lần liên tiếp không nhân đôi EXP', async () => {
    gan({ khoExp: 500 })
    const nut = screen.getByText(/Nạp 500 tinh lực/).closest('button')!
    fireEvent.click(nut)
    fireEvent.click(nut)
    await waitFor(() => expect(doc().khoExp).toBe(0))
    let daTieu = 0
    for (let c = 1; c < doc().capDo; c++) daTieu += thanhExp(c)
    expect(doc().exp + daTieu).toBe(500)
  })
})

describe('Ống đầy: KHÔNG BAO GIỜ mất EXP đã kiếm', () => {
  it('rót nhiều hơn trần thì chỉ nhận vừa đủ, phần còn lại GIỮ cho lần sau', async () => {
    gan({ dsLichSu: NHIEU_CA })   // 4 800 EXP, trần 2 000
    fireEvent.click(screen.getByText('Rót việc học vào ống'))
    await waitFor(() => expect(doc().khoExp).toBeGreaterThan(0))
    expect(doc().khoExp).toBeLessThanOrEqual(SUC_CHUA_ONG)

    // Các ca chưa rót được KHÔNG bị đánh dấu đã nhận.
    const daNhan = JSON.parse(localStorage.getItem(KHOA_DA_NHAN) ?? '{}')
    const soDanhDau = Object.keys(daNhan).length
    expect(soDanhDau).toBeLessThan(NHIEU_CA.length)
    expect(soDanhDau * NGUON_EXP.caThi(10)).toBe(doc().khoExp)
  })

  it('nạp xong rót tiếp thì lấy được đúng phần còn lại — tổng không hụt', async () => {
    gan({ dsLichSu: NHIEU_CA })
    const TONG = NHIEU_CA.length * NGUON_EXP.caThi(10)   // 4 800

    let daVao = 0
    for (let vong = 0; vong < 6; vong++) {
      const rot = screen.getByText('Rót việc học vào ống').closest('button')!
      fireEvent.click(rot)
      await waitFor(() => {}, { timeout: 60 }).catch(() => {})
      const kho = doc().khoExp as number
      if (kho > 0) {
        daVao += kho
        const nap = screen.queryByText(/Nạp \d+ tinh lực/)?.closest('button')
        if (!nap) break
        fireEvent.click(nap)
        await waitFor(() => expect(doc().khoExp).toBe(0))
      }
    }
    expect(daVao).toBe(TONG)
  })

  it('ống đã đầy sẵn thì báo cho em nạp trước, không đánh dấu ca nào', async () => {
    gan({ khoExp: SUC_CHUA_ONG, dsLichSu: NHIEU_CA })
    fireEvent.click(screen.getByText('Rót việc học vào ống'))
    await waitFor(() => expect(screen.getByText(/Ống đã đầy/)).toBeTruthy())
    expect(JSON.parse(localStorage.getItem(KHOA_DA_NHAN) ?? '{}')).toEqual({})
    expect(doc().khoExp).toBe(SUC_CHUA_ONG)
  })
})

describe('Mã nguồn: không còn đường tắt vào thần thú', () => {
  it('không còn hàm cộng thẳng EXP cho thú ngoài napVaoThu', async () => {
    const { readFileSync } = await import('node:fs')
    const ma = readFileSync('src/components/ThanThuHoaHocGame.tsx', 'utf8')
    // `nhanExp(` chỉ được gọi đúng một chỗ: trong napVaoThu.
    const soLanGoi = (ma.match(/\bnhanExp\(/g) ?? []).length
    expect(soLanGoi).toBe(1)
    expect(ma.includes('congExp(')).toBe(false)
  })
})
