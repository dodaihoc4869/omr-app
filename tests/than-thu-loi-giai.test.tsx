/**
 * LỜI GIẢI PHẢI RA CHỮ, KHÔNG RA JSON.
 *
 * Thầy bắt được trên bản live 15-09: màn hình in nguyên
 *   {"chot":"Van der Waals…","tung_pa":{"A":{"dung":false,"vi_sao":"…"}},…}
 * cho học sinh đọc. Phép kiểm này chặn đúng chỗ đó, và chặn cả việc tự nhảy câu
 * khi em chưa kịp đọc.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ThanThuHoaHocGame from '../src/components/ThanThuHoaHocGame'
import KhungLoiGiaiGame, { docCoDoiChieu } from '../src/components/KhungLoiGiaiGame'
import { doiCauSaiThanhCauChoi, type CauSaiTho } from '../src/game/than-thu-hoa-hoc/cau-hoi-cua-em'

/** Đúng hình dạng kho trả về, chép từ ảnh thầy chụp. */
const LOI_GIAI_KHO = JSON.stringify({
  chot: 'Van der Waals xuất hiện giữa cả nguyên tử lẫn phân tử.',
  tung_pa: {
    A: { dung: false, vi_sao: 'Thiếu vế phân tử, trong khi phần lớn ví dụ là giữa các phân tử.' },
    B: { dung: false, vi_sao: 'Thiếu vế nguyên tử, khí hiếm cũng có tương tác này.' },
    C: { dung: true, vi_sao: 'Đúng định nghĩa đầy đủ trong sách giáo khoa.' },
    D: { dung: false, vi_sao: 'Van der Waals còn xuất hiện giữa các phân tử không phân cực.' },
  },
  dap_an_de: 'C',
  dap_an_tu_giai: 'C',
  trang_thai: 'khop',
  ghi_chu: 'Lời giải do máy tự giải từ đề bài; đáp án đối chiếu với tác giả đề.',
})

const PA = ['Chỉ giữa nguyên tử', 'Chỉ giữa phân tử', 'Giữa cả nguyên tử lẫn phân tử', 'Chỉ giữa phân tử phân cực']

const CAU_SAI: CauSaiTho[] = [
  {
    qid: 'q1', maCa: '111', tenCa: 'Test6', phan: 'I', soCau: 7,
    chuyenDe: 'Liên kết hoá học', mucDo: 'Nhận biết',
    dapAnDung: 'C', dapAnChon: 'A',
    text: 'Tương tác van der Waals xuất hiện giữa những đối tượng nào?',
    choices: PA, loiGiai: LOI_GIAI_KHO, dang: 'Lý thuyết — nhận dạng', dangMa: 'LT-01',
  },
  {
    qid: 'q2', maCa: '111', tenCa: 'Test6', phan: 'I', soCau: 9,
    chuyenDe: 'Ester', mucDo: 'Thông hiểu', dapAnDung: 'B', dapAnChon: 'D',
    text: 'Xà phòng được điều chế bằng cách nào?',
    choices: ['Thuỷ phân chất béo trong acid', 'Thuỷ phân chất béo trong base', 'Hoà tan trong dung môi', 'Hydrogen hoá dầu'],
    loiGiai: JSON.stringify({
      chot: 'Xà phòng điều chế bằng thuỷ phân chất béo trong môi trường base.',
      tungPa: {
        A: { dung: false, viSao: 'Môi trường acid cho acid béo tự do, không cho muối.' },
        B: { dung: true, viSao: 'Đúng: thuỷ phân chất béo trong môi trường base.' },
        C: { dung: false, viSao: 'Hoà tan không làm biến đổi hoá học.' },
        D: { dung: false, viSao: 'Hydrogen hoá chỉ làm no gốc acid béo.' },
      },
    }),
    dang: 'Ứng dụng — nhận dạng', dangMa: 'UD-02',
  },
]

beforeEach(() => {
  localStorage.clear()
  // Từ 15-09 em phải chọn thần thú ở màn đầu mới vào được các tab. Các phép kiểm
  // dưới đây kiểm việc khác, nên nạp sẵn một hồ sơ đã chọn rồi.
  localStorage.setItem('omr_than_thu_hoa_hoc_data', JSON.stringify({ idThanhThuChon: 'hoa_long' }))
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

function gan() {
  return render(
    <ThanThuHoaHocGame
      dsLichSu={[{ tong: 8, soCauSai: 2, maCa: '111' }]}
      dsBtvn={[]}
      layCauSaiCuaEm={() => Promise.resolve(CAU_SAI)}
      onDong={() => {}}
      onChuyenSangKhacPhuc={() => {}}
      onChuyenSangBtvn={() => {}}
      onChuyenSangVaoThi={() => {}}
    />,
  )
}

describe('Bộ đổi câu KHÔNG được ép lời giải thành chuỗi', () => {
  it('giữ nguyên lời giải thô, và giaiThich không bao giờ là JSON', () => {
    const kq = doiCauSaiThanhCauChoi(CAU_SAI)
    expect(kq.dsCau).toHaveLength(2)
    for (const c of kq.dsCau) {
      expect(c.loiGiaiTho).toBeTruthy()
      expect(c.giaiThich).not.toContain('{')
      expect(c.giaiThich).not.toContain('"chot"')
      expect(c.giaiThich).not.toContain('tung_pa')
    }
    expect(kq.dsCau[0]!.daChonTruoc).toBe('A')
  })
})

describe('KhungLoiGiaiGame', () => {
  it('dựng đủ bốn khối: đáp án, kiến thức cốt lõi, vì sao từng phương án', () => {
    render(
      <KhungLoiGiaiGame loiGiaiTho={LOI_GIAI_KHO} dapAnDung={2} daChon={0} phuongAn={PA} />,
    )
    expect(screen.getByText('Đáp án: C')).toBeTruthy()
    expect(screen.getByText('Em chọn: A')).toBeTruthy()
    expect(screen.getByText('Kiến thức cốt lõi')).toBeTruthy()
    expect(screen.getByText(/Van der Waals xuất hiện giữa cả nguyên tử lẫn phân tử/)).toBeTruthy()
    expect(screen.getByText('Vì sao chọn / không chọn')).toBeTruthy()
    expect(screen.getByText(/Thiếu vế phân tử/)).toBeTruthy()
    expect(screen.getByText(/Thiếu vế nguyên tử/)).toBeTruthy()
    expect(screen.getByText(/Đúng định nghĩa đầy đủ/)).toBeTruthy()
    expect(screen.getByText(/không phân cực/)).toBeTruthy()
    expect(screen.getByText(/em đã chọn ý này/)).toBeTruthy()
  })

  it('KHÔNG in một ký tự ngoặc nhọn nào ra màn hình', () => {
    const { container } = render(
      <KhungLoiGiaiGame loiGiaiTho={LOI_GIAI_KHO} dapAnDung={2} daChon={0} phuongAn={PA} />,
    )
    const chu = container.textContent ?? ''
    expect(chu).not.toContain('{')
    expect(chu).not.toContain('"dung":')
    expect(chu).not.toContain('vi_sao')
    expect(chu).not.toContain('dap_an_de')
  })

  it('đọc được cả khoá camelCase (tungPa / viSao)', () => {
    render(
      <KhungLoiGiaiGame
        loiGiaiTho={CAU_SAI[1]!.loiGiai}
        dapAnDung={1}
        daChon={3}
        phuongAn={CAU_SAI[1]!.choices!}
      />,
    )
    expect(screen.getByText(/Môi trường acid cho acid béo tự do/)).toBeTruthy()
    expect(screen.getByText(/Hydrogen hoá chỉ làm no gốc acid béo/)).toBeTruthy()
  })

  it('hết giờ thì nói hết giờ, không nói em chọn gì', () => {
    render(<KhungLoiGiaiGame loiGiaiTho={LOI_GIAI_KHO} dapAnDung={2} daChon={-1} phuongAn={PA} />)
    expect(screen.getByText(/Hết giờ, chưa kịp chọn/)).toBeTruthy()
    expect(screen.queryByText(/^Em chọn:/)).toBeNull()
  })

  it('kho thiếu lời giải thì NÓI LÀ THIẾU, không bịa', () => {
    render(<KhungLoiGiaiGame loiGiaiTho={undefined} dapAnDung={2} daChon={0} phuongAn={PA} />)
    expect(screen.getByText(/chưa có lời giải|Thầy bổ sung/)).toBeTruthy()
  })
})

describe('docCoDoiChieu — lệch đáp án phải cờ hoá', () => {
  it('khớp thì không cờ', () => {
    expect(docCoDoiChieu(LOI_GIAI_KHO).lech).toBe(false)
  })
  it('trang_thai lệch thì cờ', () => {
    expect(docCoDoiChieu(JSON.stringify({ chot: 'x', trang_thai: 'lech' })).lech).toBe(true)
  })
  it('hai đáp án khác nhau thì cờ, dù không ghi trang_thai', () => {
    expect(docCoDoiChieu(JSON.stringify({ chot: 'x', dap_an_de: 'C', dap_an_tu_giai: 'A' })).lech).toBe(true)
  })
  it('chữ thô không phải JSON thì không cờ bừa', () => {
    expect(docCoDoiChieu('Lời giải viết tay').lech).toBe(false)
  })
  it('câu lệch hiện cảnh báo trên màn', () => {
    render(
      <KhungLoiGiaiGame
        loiGiaiTho={JSON.stringify({ chot: 'x', dap_an_de: 'C', dap_an_tu_giai: 'A' })}
        dapAnDung={2} daChon={0} phuongAn={PA}
      />,
    )
    expect(screen.getByText(/đang lệch đáp án/)).toBeTruthy()
  })
})

describe('Leo tháp: dừng lại cho em đọc, không tự nhảy câu', () => {
  it('trả lời xong thì hiện nút đi tiếp, và câu hỏi biến mất', async () => {
    gan()
    fireEvent.click(screen.getByText('Leo Tháp Tri Thức'))
    await waitFor(() => expect(screen.getByText(/Khiêu Chiến Tầng/)).toBeTruthy())
    fireEvent.click(screen.getByText(/Khiêu Chiến Tầng/))
    await waitFor(() => expect(screen.getByText(/^A\.$/)).toBeTruthy())

    // Bấm phương án A — sai ở cả hai câu trong bộ này (đáp án C và B).
    fireEvent.click(screen.getByText(/^A\.$/).parentElement!)
    await waitFor(() =>
      expect(
        screen.queryByText('Câu tiếp theo →') ?? screen.queryByText(/Lên tầng/) ?? screen.queryByText('Về Đảo Thần Thú'),
      ).toBeTruthy(),
    )
    expect(screen.getByText('Vì sao chọn / không chọn')).toBeTruthy()
    // Khung bốn nút trả lời đã biến mất — không bấm nhầm khi đang đọc.
    expect(screen.queryByText('⚡ CÂU HỎI KÍCH HOẠT TUYỆT KỸ')).toBeNull()
  })

  it('màn đấu không in JSON ra bất cứ đâu', async () => {
    const { container } = gan()
    fireEvent.click(screen.getByText('Leo Tháp Tri Thức'))
    await waitFor(() => expect(screen.getByText(/Khiêu Chiến Tầng/)).toBeTruthy())
    fireEvent.click(screen.getByText(/Khiêu Chiến Tầng/))
    await waitFor(() => expect(screen.getByText(/^A\.$/)).toBeTruthy())
    fireEvent.click(screen.getByText(/^A\.$/).parentElement!)
    await waitFor(() => expect(screen.getByText('Vì sao chọn / không chọn')).toBeTruthy())
    const chu = container.textContent ?? ''
    expect(chu).not.toContain('"chot"')
    expect(chu).not.toContain('tung_pa')
    expect(chu).not.toContain('dap_an_tu_giai')
  })
})

describe('Săn Boss Câu Sai: lời giải cũng phải ra chữ', () => {
  it('trả lời xong hiện khung lời giải chuẩn, không JSON', async () => {
    const { container } = gan()
    fireEvent.click(screen.getByText('Săn Boss Câu Sai'))
    await waitFor(() => expect(screen.getByText('Khiêu chiến quái tiếp theo')).toBeTruthy())
    fireEvent.click(screen.getByText('Khiêu chiến quái tiếp theo'))
    await waitFor(() => expect(screen.getByText(/^A\.$/)).toBeTruthy())
    fireEvent.click(screen.getByText(/^A\.$/).parentElement!)
    await waitFor(() => expect(screen.getByText('Vì sao chọn / không chọn')).toBeTruthy())
    const chu = container.textContent ?? ''
    expect(chu).not.toContain('"viSao"')
    expect(chu).not.toContain('tungPa')
    expect(chu).not.toContain('{')
  })
})
