import { describe, it, expect } from 'vitest'
import { hopLeDeRut, laCauTuLuan } from '../src/lib/loc-cau-rut'
import { hopLe3DangChuan } from '../server/src/loc-cau-chuan'

describe('Bộ lọc rút câu chuẩn — Khóa vĩnh viễn mọi câu tự luận', () => {
  it('Khóa câu tự luận ghép cột orbital (như ảnh media_1789659149194)', () => {
    const cauGhepCot = {
      phan: 'I',
      text: 'Câu 18: Ghép mỗi biểu diễn ô orbital sau ở trạng thái cơ bản với các nguyên tố tương ứng (cột A với cột B):',
      dapAnDung: '1-a, 2-b, 3-c',
      choices: ['A', 'B', 'C', 'D'],
    }
    expect(laCauTuLuan(cauGhepCot.phan, cauGhepCot.dapAnDung, cauGhepCot.text)).toBe(true)
    expect(hopLeDeRut(cauGhepCot)).toBe(false)
    expect(hopLe3DangChuan(cauGhepCot)).toBe(false)
  })

  it('Khóa câu tự luận có câu hỏi mở "được không?" và chia ý con a, b, c (như ảnh media_1789659156242)', () => {
    const cauHoiMo = {
      phan: 'III',
      text: 'Câu 16: Cho khối lượng nguyên tử... a) Tính phần trăm... b) Tính tỉ lệ... c) Từ kết quả đó có thể coi khối lượng của nguyên tử hầu như tập trung ở hạt nhân được không?',
      dapAnDung: 'có',
    }
    expect(laCauTuLuan(cauHoiMo.phan, cauHoiMo.dapAnDung, cauHoiMo.text)).toBe(true)
    expect(hopLeDeRut(cauHoiMo)).toBe(false)
    expect(hopLe3DangChuan(cauHoiMo)).toBe(false)
  })

  it('Khóa câu trả lời ngắn có đáp án khoảng giá trị hoặc không phải 1 số đơn nhất (như ảnh media_1789659163192)', () => {
    const cauKhoangGiaTri = {
      phan: 'III',
      text: 'Câu 5: Nhiệt độ sôi của chất nằm trong khoảng nào?',
      dapAnDung: '1000-2000',
    }
    expect(laCauTuLuan(cauKhoangGiaTri.phan, cauKhoangGiaTri.dapAnDung, cauKhoangGiaTri.text)).toBe(true)
    expect(hopLeDeRut(cauKhoangGiaTri)).toBe(false)
    expect(hopLe3DangChuan(cauKhoangGiaTri)).toBe(false)
  })

  it('Chấp nhận Phần I chuẩn: trắc nghiệm 4 lựa chọn, đáp án A, B, C hoặc D', () => {
    const cauPhanI = {
      phan: 'I',
      text: 'Chất nào sau đây là este?',
      dapAnDung: 'A',
      choices: ['CH3COOC2H5', 'CH3COOH', 'C2H5OH', 'CH3CHO'],
    }
    expect(laCauTuLuan(cauPhanI.phan, cauPhanI.dapAnDung, cauPhanI.text, { choices: cauPhanI.choices })).toBe(false)
    expect(hopLeDeRut(cauPhanI)).toBe(true)
    expect(hopLe3DangChuan(cauPhanI)).toBe(true)
  })

  it('Chấp nhận Phần II chuẩn: Đúng / Sai 4 ý, đáp án dạng 4 ký tự Đ/S', () => {
    const cauPhanII = {
      phan: 'II',
      text: 'Cho các phát biểu sau về glucose:',
      dapAnDung: 'ĐSĐS',
      ideas: ['Ý 1', 'Ý 2', 'Ý 3', 'Ý 4'],
    }
    expect(laCauTuLuan(cauPhanII.phan, cauPhanII.dapAnDung, cauPhanII.text, { ideas: cauPhanII.ideas })).toBe(false)
    expect(hopLeDeRut(cauPhanII)).toBe(true)
    expect(hopLe3DangChuan(cauPhanII)).toBe(true)
  })

  it('Chấp nhận Phần III chuẩn: trả lời ngắn có đáp án là 1 con số duy nhất', () => {
    const cauPhanIII = {
      phan: 'III',
      text: 'Tính khối lượng mol của este X biết phân tử khối...',
      dapAnDung: '99,97',
    }
    expect(laCauTuLuan(cauPhanIII.phan, cauPhanIII.dapAnDung, cauPhanIII.text)).toBe(false)
    expect(hopLeDeRut(cauPhanIII)).toBe(true)
    expect(hopLe3DangChuan(cauPhanIII)).toBe(true)

    const cauSoNguyen = {
      phan: 'III',
      text: 'Số đồng phân cấu tạo của amin có công thức C3H9N là bao nhiêu?',
      dapAnDung: '4',
    }
    expect(laCauTuLuan(cauSoNguyen.phan, cauSoNguyen.dapAnDung, cauSoNguyen.text)).toBe(false)
    expect(hopLeDeRut(cauSoNguyen)).toBe(true)
    expect(hopLe3DangChuan(cauSoNguyen)).toBe(true)
  })

  it('Khóa câu thuộc Ví dụ minh hoạ hoặc Dạng toán trọng tâm', () => {
    const cauViDu = {
      phan: 'I',
      maDe: '12-C1-B1-VD',
      text: 'Ví dụ 1: Tính khối lượng este...',
      dapAnDung: 'A',
      choices: ['A', 'B', 'C', 'D'],
    }
    expect(hopLeDeRut(cauViDu)).toBe(false)
    expect(hopLe3DangChuan(cauViDu)).toBe(false)
  })
})
