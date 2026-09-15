/**
 * MÀN ĐẤU PHẢI CÓ CON THÚ, VÀ CÂU HỎI PHẢI LÀ CÂU CỦA CHÍNH EM.
 *
 * Hai lỗi bản trước, cả hai đều chỉ lộ khi mở màn hình thật:
 *  · canvas thần thú chỉ có ở tab Đảo Thần Thú; vào tháp đánh nhau thì con thú
 *    biến mất, còn ba cờ hiệu ứng `dangDanh` / `dangBiDanh` / `dangTungNo` thì
 *    luôn truyền `false`;
 *  · câu hỏi lấy từ kho chung, không liên quan gì tới phần em đã học.
 *
 * Phép kiểm này gắn màn hình thật bằng jsdom rồi bấm đúng như em bấm.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ThanThuHoaHocGame from '../src/components/ThanThuHoaHocGame'
import type { CauSaiTho } from '../src/game/than-thu-hoa-hoc/cau-hoi-cua-em'

const CAU_SAI_CUA_EM: CauSaiTho[] = [
  {
    qid: 'qA', maCa: '111111', tenCa: 'Ca 12 — Ester', phan: 'I', soCau: 7,
    chuyenDe: 'Ester', mucDo: 'Nhận biết', dapAnDung: 'B', dapAnChon: 'D',
    text: 'CÂU RIÊNG CỦA EM VỀ ESTER',
    choices: ['Methyl acetate', 'Isoamyl acetate', 'Ethyl formate', 'Ethyl butyrate'],
    loiGiai: 'Isoamyl acetate cho mùi chuối chín.',
    dang: 'Nhận biết ester theo mùi', dangMa: 'HC-ES-01',
  },
  {
    qid: 'qB', maCa: '111111', tenCa: 'Ca 12 — Ester', phan: 'I', soCau: 9,
    chuyenDe: 'Điện phân', mucDo: 'Vận dụng cao', dapAnDung: 'A',
    text: 'CÂU RIÊNG CỦA EM VỀ ĐIỆN PHÂN',
    choices: ['Cu', 'Na', 'K', 'Ba'],
    loiGiai: 'Cation kim loại sau Al mới bị khử ở catot.',
    dang: 'Điện phân dung dịch', dangMa: 'VC-DP-03',
  },
  // Câu phần II: phải bị loại, không được lọt vào khung bốn nút.
  {
    qid: 'qC', maCa: '111111', phan: 'II', soCau: 1, dapAnDung: 'ĐSĐS',
    text: 'CÂU ĐÚNG SAI KHÔNG ĐƯỢC LỌT VÀO GAME', ideas: ['a', 'b', 'c', 'd'],
  },
]

function gan(layCauSai?: () => Promise<CauSaiTho[]>) {
  return render(
    <ThanThuHoaHocGame
      dsLichSu={[{ tong: 8, soCauSai: 3, maCa: '111111' }]}
      dsBtvn={[{ daNop: true, id: 'bt1' }]}
      layCauSaiCuaEm={layCauSai}
      onDong={() => {}}
      onChuyenSangKhacPhuc={() => {}}
      onChuyenSangBtvn={() => {}}
      onChuyenSangVaoThi={() => {}}
    />,
  )
}

beforeEach(() => {
  localStorage.clear()
  // Từ 15-09 em phải chọn thần thú ở màn đầu mới vào được các tab. Các phép kiểm
  // dưới đây kiểm việc khác, nên nạp sẵn một hồ sơ đã chọn rồi.
  localStorage.setItem('omr_than_thu_hoa_hoc_data', JSON.stringify({ idThanhThuChon: 'hoa_long' }))
  // jsdom không dựng được WebGL. Màn 3D tự rơi về canvas 2D khi gặp máy như vậy;
  // ở đây bật thẳng cờ đó để phép kiểm khỏi phải chờ lazy-load three.js.
  localStorage.setItem('omr_than_thu_khong_3d', '1')
  // jsdom không dựng được ngữ cảnh 2D; hook vẽ đã tự thoát khi không có ctx,
  // nên chỉ cần chặn cảnh báo "not implemented".
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('Canvas thần thú trong màn đấu', () => {
  it('tab Đảo Thần Thú có đúng một canvas', () => {
    const { container } = gan()
    expect(container.querySelectorAll('canvas')).toHaveLength(1)
  })

  it('vào tháp và khiêu chiến thì canvas thần thú hiện ra trong màn đấu', async () => {
    const { container } = gan(() => Promise.resolve(CAU_SAI_CUA_EM))
    fireEvent.click(screen.getByText('Leo Tháp Tri Thức'))
    // Chưa vào trận: màn chờ không có canvas.
    expect(container.querySelectorAll('canvas')).toHaveLength(0)

    await waitFor(() => expect(screen.getByText(/Khiêu Chiến Tầng/)).toBeTruthy())
    fireEvent.click(screen.getByText(/Khiêu Chiến Tầng/))

    await waitFor(() => {
      expect(container.querySelectorAll('canvas')).toHaveLength(1)
    })
  })

  it('màn đấu gọi đúng tên chiêu của thần thú đang chọn', async () => {
    gan(() => Promise.resolve(CAU_SAI_CUA_EM))
    fireEvent.click(screen.getByText('Leo Tháp Tri Thức'))
    await waitFor(() => expect(screen.getByText(/Khiêu Chiến Tầng/)).toBeTruthy())
    fireEvent.click(screen.getByText(/Khiêu Chiến Tầng/))
    await waitFor(() => {
      expect(screen.getByText('Phun Lửa Nhiệt Nhôm')).toBeTruthy()
      expect(screen.getByText('Thiêu Đốt Phân Tử Cấp Độ 4')).toBeTruthy()
    })
  })
})

describe('Câu hỏi lấy từ chính bài làm của em', () => {
  it('tháp hỏi bằng câu của em, không phải câu kho chung', async () => {
    gan(() => Promise.resolve(CAU_SAI_CUA_EM))
    fireEvent.click(screen.getByText('Leo Tháp Tri Thức'))
    await waitFor(() =>
      expect(screen.getByText(/2 câu chính em từng làm sai/)).toBeTruthy(),
    )
    fireEvent.click(screen.getByText(/Khiêu Chiến Tầng/))
    await waitFor(() => {
      const de = screen.queryByText('CÂU RIÊNG CỦA EM VỀ ESTER')
        ?? screen.queryByText('CÂU RIÊNG CỦA EM VỀ ĐIỆN PHÂN')
      expect(de).toBeTruthy()
    })
    // Câu phần II không bao giờ được hiện.
    expect(screen.queryByText('CÂU ĐÚNG SAI KHÔNG ĐƯỢC LỌT VÀO GAME')).toBeNull()
  })

  it('nói rõ chuyên đề đã nhận ra, không giấu số câu bị bỏ', async () => {
    gan(() => Promise.resolve(CAU_SAI_CUA_EM))
    fireEvent.click(screen.getByText('Leo Tháp Tri Thức'))
    await waitFor(() => expect(screen.getByText(/Chuyên đề: Điện phân · Ester/)).toBeTruthy())
    expect(screen.getByText(/Đã bỏ 1 câu/)).toBeTruthy()
  })

  it('không lấy được câu sai thì NÓI LÀ ĐANG MƯỢN KHO CHUNG, không giả vờ', async () => {
    gan(() => Promise.reject(new Error('máy chủ bận')))
    fireEvent.click(screen.getByText('Leo Tháp Tri Thức'))
    await waitFor(() => expect(screen.getByText(/máy chủ bận/)).toBeTruthy())
    expect(screen.getByText(/kho câu chung/)).toBeTruthy()
  })

  it('em chưa có câu sai nào thì cũng nói rõ đang dùng kho chung', async () => {
    gan(() => Promise.resolve([]))
    fireEvent.click(screen.getByText('Leo Tháp Tri Thức'))
    await waitFor(() =>
      expect(screen.getByText(/Chưa lấy được câu sai nào của em/)).toBeTruthy(),
    )
  })
})

describe('Săn Boss Câu Sai — không có nút tự khai EXP nữa', () => {
  it('không còn nút "Quy đổi câu đã sửa"', async () => {
    gan(() => Promise.resolve(CAU_SAI_CUA_EM))
    fireEvent.click(screen.getByText('Săn Boss Câu Sai'))
    await waitFor(() => expect(screen.getByText(/Quái chưa hạ/)).toBeTruthy())
    expect(screen.queryByText('Quy đổi câu đã sửa')).toBeNull()
  })

  it('trả lời SAI thì không được EXP và quái vẫn còn', async () => {
    gan(() => Promise.resolve(CAU_SAI_CUA_EM))
    fireEvent.click(screen.getByText('Săn Boss Câu Sai'))
    await waitFor(() => expect(screen.getByText('2 câu')).toBeTruthy())
    fireEvent.click(screen.getByText('Khiêu chiến quái tiếp theo'))

    // Bấm phương án A. Với câu Ester đáp án đúng là B, với câu Điện phân là A —
    // nên kiểm theo chữ hiện ra, không đoán.
    await waitFor(() => expect(screen.getByText(/^A\.$/)).toBeTruthy())
    const laEster = screen.queryByText('CÂU RIÊNG CỦA EM VỀ ESTER') !== null
    const nut = screen.getByText(laEster ? 'Methyl acetate' : 'Na')
    fireEvent.click(nut)

    await waitFor(() => expect(screen.getByText(/Vẫn sai\. Không có EXP câu này/)).toBeTruthy())
    expect(screen.getByText('2 câu')).toBeTruthy()
  })

  it('trả lời ĐÚNG thì hạ quái, số quái còn lại giảm một', async () => {
    gan(() => Promise.resolve(CAU_SAI_CUA_EM))
    fireEvent.click(screen.getByText('Săn Boss Câu Sai'))
    await waitFor(() => expect(screen.getByText('2 câu')).toBeTruthy())
    fireEvent.click(screen.getByText('Khiêu chiến quái tiếp theo'))

    await waitFor(() => expect(screen.getByText(/^A\.$/)).toBeTruthy())
    const laEster = screen.queryByText('CÂU RIÊNG CỦA EM VỀ ESTER') !== null
    fireEvent.click(screen.getByText(laEster ? 'Isoamyl acetate' : 'Cu'))

    await waitFor(() => expect(screen.getByText(/Hạ quái! \+100 EXP\./)).toBeTruthy())
    await waitFor(() => expect(screen.getByText('1 câu')).toBeTruthy())
  })

  it('cùng một câu không trả EXP lần hai — bấm lại đúng cũng không cộng thêm', async () => {
    gan(() => Promise.resolve([CAU_SAI_CUA_EM[0]!]))
    fireEvent.click(screen.getByText('Săn Boss Câu Sai'))
    await waitFor(() => expect(screen.getByText('1 câu')).toBeTruthy())
    fireEvent.click(screen.getByText('Khiêu chiến quái tiếp theo'))
    await waitFor(() => expect(screen.getByText('Isoamyl acetate')).toBeTruthy())
    fireEvent.click(screen.getByText('Isoamyl acetate'))
    await waitFor(() => expect(screen.getByText('0 câu')).toBeTruthy())

    // Hết quái: nút khiêu chiến biến mất, thay bằng câu đã sạch.
    fireEvent.click(screen.getByText('Rời sàn'))
    await waitFor(() =>
      expect(screen.getByText(/đã làm đúng lại toàn bộ 1 câu từng sai/)).toBeTruthy(),
    )
    expect(screen.queryByText('Khiêu chiến quái tiếp theo')).toBeNull()
  })
})
