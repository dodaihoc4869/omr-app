/**
 * SỔ EXP NĂM NGUỒN + POPUP LẤP LÁNH.
 *
 * Thầy chốt 15-09: hoàn thành nhiệm vụ thì popup lấp lánh báo được bao nhiêu
 * EXP, và có bảng tóm tắt cộng/trừ theo từng nhiệm vụ, tất cả dồn vào ống.
 *
 * Bất biến quan trọng nhất ở đây: **tổng sổ phải bằng đúng EXP đã vào ống**.
 * Sổ ghi nhiều hơn thực rót là nói dối em; ghi ít hơn là giấu công của em.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ThanThuHoaHocGame from '../src/components/ThanThuHoaHocGame'
import PopupThuongExp from '../src/components/PopupThuongExp'
import {
  NGUON_EXP, DS_NGUON_EXP, TEN_NGUON_EXP, soExpRong, vaSoExp, tongSoExp, SUC_CHUA_ONG,
} from '../src/game/than-thu-hoa-hoc/kinh-nghiem'
import { vaHoSo, KHOA_LUU_THAN_THU } from '../src/game/than-thu-hoa-hoc/he-thong-pet'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

const doc = () => JSON.parse(localStorage.getItem(KHOA_LUU_THAN_THU) ?? '{}')

function gan(p: { dsLichSu?: unknown[]; dsBtvn?: unknown[]; dsMom?: unknown[] } = {}) {
  localStorage.setItem(KHOA_LUU_THAN_THU, JSON.stringify({ idThanhThuChon: 'hoa_long' }))
  return render(
    <ThanThuHoaHocGame
      dsLichSu={(p.dsLichSu ?? []) as { tong?: number; maCa?: string }[]}
      dsBtvn={(p.dsBtvn ?? []) as { daNop?: boolean; id?: string }[]}
      dsMom={(p.dsMom ?? []) as { id?: string; trangThai?: string; diem?: number }[]}
      onDong={() => {}} onChuyenSangKhacPhuc={() => {}}
      onChuyenSangBtvn={() => {}} onChuyenSangVaoThi={() => {}}
    />,
  )
}

describe('Năm nguồn EXP', () => {
  it('đúng năm nguồn, nguồn nào cũng có tên tiếng Việt', () => {
    expect(DS_NGUON_EXP).toHaveLength(5)
    for (const k of DS_NGUON_EXP) expect(TEN_NGUON_EXP[k].length).toBeGreaterThan(4)
    expect(DS_NGUON_EXP).toContain('mom')
  })

  it('nộp bài MOM nặng hơn bài tập về nhà — bài dài hai tiếng có người nhà ngồi cạnh', () => {
    expect(NGUON_EXP.nopMom(0)).toBeGreaterThan(NGUON_EXP.nopBtvn() * 0.7)
    expect(NGUON_EXP.nopMom(10)).toBe(400)
    expect(NGUON_EXP.nopMom(8)).toBe(350)
  })

  it('điểm âm hoặc rác không làm EXP âm', () => {
    expect(NGUON_EXP.nopMom(-5)).toBe(150)
    expect(NGUON_EXP.caThi(-3)).toBe(0)
  })
})

describe('Sổ EXP đọc từ máy', () => {
  it('sổ rỗng có đủ năm khoá bằng 0', () => {
    const so = soExpRong()
    expect(Object.keys(so).sort()).toEqual([...DS_NGUON_EXP].sort())
    expect(tongSoExp(so)).toBe(0)
  })
  it('hồ sơ cũ chưa có sổ thì về sổ rỗng, không ra NaN', () => {
    expect(tongSoExp(vaHoSo({ capDo: 2 }).soExp)).toBe(0)
  })
  it('khoá lạ và số âm bị loại', () => {
    const so = vaSoExp({ caThi: 500, linhTinh: 900, btvn: -20 })
    expect(so.caThi).toBe(500)
    expect(so.btvn).toBe(0)
    expect(tongSoExp(so)).toBe(500)
    expect((so as Record<string, number>).linhTinh).toBeUndefined()
  })
})

describe('Quy đổi ghi vào ĐÚNG nguồn', () => {
  it('ca thi, bài tập và MOM vào ba dòng riêng, tổng sổ khớp ống', async () => {
    gan({
      dsLichSu: [{ tong: 5, maCa: 'c1' }],                       // 300
      dsBtvn: [{ daNop: true, id: 'b1' }],                        // 200
      dsMom: [{ id: 'm1', trangThai: 'da_nop', diem: 8 }],        // 350
    })
    fireEvent.click(screen.getByText('Rót việc học vào ống'))
    await waitFor(() => expect(doc().khoExp).toBe(850))
    const so = doc().soExp
    expect(so.caThi).toBe(300)
    expect(so.btvn).toBe(200)
    expect(so.mom).toBe(350)
    expect(tongSoExp(so)).toBe(doc().khoExp)
  })

  it('bài MOM chưa nộp thì KHÔNG tính', async () => {
    gan({ dsMom: [{ id: 'm1', trangThai: 'dang_lam', diem: 9 }] })
    fireEvent.click(screen.getByText('Rót việc học vào ống'))
    await waitFor(() => expect(screen.getByText(/Chưa có việc học nào mới/)).toBeTruthy())
    expect(doc().khoExp ?? 0).toBe(0)
  })

  it('cùng một bài MOM không quy đổi hai lần', async () => {
    gan({ dsMom: [{ id: 'm1', trangThai: 'da_nop', diem: 10 }] })
    const nut = () => screen.getByText('Rót việc học vào ống')
    fireEvent.click(nut())
    await waitFor(() => expect(doc().khoExp).toBe(400))
    fireEvent.click(nut())
    await waitFor(() => expect(screen.getByText(/Chưa có việc học nào mới/)).toBeTruthy())
    expect(doc().khoExp).toBe(400)
    expect(doc().soExp.mom).toBe(400)
  })

  it('ống đầy thì sổ CHỈ ghi phần rót được — không vênh với ống', async () => {
    const nhieu = Array.from({ length: 9 }, (_, i) => ({ tong: 10, maCa: 'c' + i })) // 5 400
    gan({ dsLichSu: nhieu })
    fireEvent.click(screen.getByText('Rót việc học vào ống'))
    await waitFor(() => expect(doc().khoExp).toBeGreaterThan(0))
    expect(doc().khoExp).toBeLessThanOrEqual(SUC_CHUA_ONG)
    expect(tongSoExp(doc().soExp)).toBe(doc().khoExp)
  })

  it('nạp vào thần thú KHÔNG xoá sổ — sổ là lịch sử, không phải số dư', async () => {
    gan({ dsLichSu: [{ tong: 6, maCa: 'c1' }] })   // 360
    fireEvent.click(screen.getByText('Rót việc học vào ống'))
    await waitFor(() => expect(doc().khoExp).toBe(360))
    fireEvent.click(screen.getByText(/Nạp 360 tinh lực/))
    await waitFor(() => expect(doc().khoExp).toBe(0))
    expect(doc().soExp.caThi).toBe(360)
  })
})

describe('Popup lấp lánh', () => {
  it('không có tin thì không vẽ gì', () => {
    const { container } = render(<PopupThuongExp tin={null} onDong={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('hiện số EXP, tên nhiệm vụ và việc vừa làm', () => {
    render(
      <PopupThuongExp
        tin={{ exp: 420, nguon: 'leoThap', viec: 'Hạ trùm tầng 7', lan: 1 }}
        onDong={() => {}}
      />,
    )
    expect(screen.getByText('+420')).toBeTruthy()
    expect(screen.getByText('EXP vào ống nghiệm')).toBeTruthy()
    expect(screen.getByText('Leo tháp tri thức')).toBeTruthy()
    expect(screen.getByText('Hạ trùm tầng 7')).toBeTruthy()
  })

  it('bấm nền là tắt ngay', () => {
    const dong = vi.fn()
    render(<PopupThuongExp tin={{ exp: 100, nguon: 'mom', viec: 'x', lan: 1 }} onDong={dong} />)
    fireEvent.click(screen.getByLabelText('Đóng thông báo thưởng'))
    expect(dong).toHaveBeenCalled()
  })

  it('bật ra khi quy đổi việc học xong', async () => {
    gan({ dsMom: [{ id: 'm1', trangThai: 'da_nop', diem: 10 }] })
    fireEvent.click(screen.getByText('Rót việc học vào ống'))
    // "+400" hiện ở CẢ popup lẫn bảng tóm tắt — đúng ý đồ, nên khớp nhiều phần tử.
    await waitFor(() => expect(screen.getAllByText('+400').length).toBeGreaterThanOrEqual(1))
    expect(screen.getAllByText('Nộp bài cho MOM').length).toBeGreaterThanOrEqual(1)
  })
})

describe('Bảng tóm tắt nằm trong thẻ Buff Sức Mạnh', () => {
  it('đủ năm dòng nhiệm vụ, có cột cộng và cột trừ', async () => {
    gan({ dsLichSu: [{ tong: 7, maCa: 'c1' }] })
    fireEvent.click(screen.getByText('Rót việc học vào ống'))
    await waitFor(() => expect(doc().khoExp).toBe(420))

    expect(screen.getByText('Buff Sức Mạnh Từ Học Tập')).toBeTruthy()
    expect(screen.getByText('EXP đã kiếm theo nhiệm vụ')).toBeTruthy()
    for (const k of DS_NGUON_EXP) {
      expect(screen.getAllByText(TEN_NGUON_EXP[k]).length, k).toBeGreaterThanOrEqual(1)
    }
    expect(screen.getByText('Cộng')).toBeTruthy()
    expect(screen.getByText('Trừ')).toBeTruthy()
    expect(screen.getAllByText('+420').length).toBeGreaterThanOrEqual(1)
    // Bốn nhiệm vụ chưa làm hiện dấu gạch, không hiện 0 cho ra vẻ.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4)
    // Nói thẳng là chưa có mục nào trừ — không để em đoán.
    expect(screen.getByText(/chưa có nhiệm vụ nào lấy EXP của em đi/i)).toBeTruthy()
  })
})
