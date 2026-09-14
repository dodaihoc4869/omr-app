import { describe, expect, it } from 'vitest'
import {
  phanTichTyLeDang,
  phanTichBoLocCau,
  layNhanDanCauSai,
  type CauSaiDauVao,
} from '../src/lib/thuat-toan-rut-cau-sai'
import type { TeacherExamSource } from '../src/data/examContent'
import { dungDeRieng } from '../src/lib/de-rieng'
import { dungUngVien } from '../src/lib/rut-de'

describe('Thuật toán khắc phục câu sai 3 chế độ và tính đúng số câu cùng nhãn dán', () => {
  // Giả lập kho đề có 30 câu: 10 câu dạng D1, 10 câu dạng D2, 10 câu dạng D3 (tất cả cùng chuyên đề "Hoá học")
  const khoDeGiaLap: TeacherExamSource[] = [
    {
      maDe: 'de-mau',
      nhom: 'Nhom1',
      phanI: Array.from({ length: 20 }, (_, i) => ({
        id: `q-I-${i + 1}`,
        text: `Câu hỏi trắc nghiệm ${i + 1}`,
        choices: ['A', 'B', 'C', 'D'],
        correct: 'A',
        chuyenDe: 'Hoá học',
        dang: i < 10 ? { ma: 'D1', ten: 'Dạng 1' } : { ma: 'D2', ten: 'Dạng 2' },
        mucDo: 'hieu',
      })),
      phanII: Array.from({ length: 5 }, (_, i) => ({
        id: `q-II-${i + 1}`,
        text: `Câu hỏi đúng sai ${i + 1}`,
        ideas: ['Ý 1', 'Ý 2', 'Ý 3', 'Ý 4'],
        correct: ['D', 'S', 'D', 'S'],
        chuyenDe: 'Hoá học',
        dang: { ma: 'D3', ten: 'Dạng 3' },
        mucDo: 'hieu',
      })),
      phanIII: Array.from({ length: 5 }, (_, i) => ({
        id: `q-III-${i + 1}`,
        text: `Câu trả lời ngắn ${i + 1}`,
        correct: '10',
        chuyenDe: 'Hoá học',
        dang: { ma: 'D3', ten: 'Dạng 3' },
        mucDo: 'hieu',
      })),
    } as unknown as TeacherExamSource,
  ]

  it('1. layNhanDanCauSai lấy đúng nhãn từ mã/tên dạng, không bị lẫn sang chuyenDe', () => {
    const cs1: CauSaiDauVao = {
      qid: 'q-sai-1',
      soCau: 1,
      phan: 'I',
      dang: { ma: 'D1', ten: 'Dạng 1' },
      chuyenDe: 'Este - Lipit',
      dapAnDung: 'A',
      text: 'Câu sai 1',
    }
    const nhan = layNhanDanCauSai(cs1)
    expect(nhan.ma).toBe('D1')
    expect(nhan.ten).toBe('Dạng 1')
  })

  it('2. phanTichTyLeDang: tính đúng tổng số câu cùng nhãn dán, không bị lạm phát vượt kho (không nhảy lên 8800 câu)', () => {
    // Giả sử có 11 câu sai, tất cả cùng chuyên đề "Hoá học" nhưng chỉ thuộc dạng D1
    const dsCauSai: CauSaiDauVao[] = Array.from({ length: 11 }, (_, i) => ({
      qid: `q-sai-${i + 1}`,
      soCau: i + 1,
      phan: 'I',
      dang: { ma: 'D1', ten: 'Dạng 1' },
      chuyenDe: 'Hoá học',
      dapAnDung: 'A',
      text: `Câu sai ${i + 1}`,
      maCa: i < 6 ? 'ca-1' : 'ca-2',
    }))

    const { thongKe, tongToiDa, tinhSoCauMoiDang } = phanTichTyLeDang(dsCauSai, khoDeGiaLap)

    // Kho chỉ có 10 câu dạng D1, nên tongToiDa phải bị chặn trần bởi số câu phân biệt thực tế (10 câu), KHÔNG THỂ là 11 * 10 = 110 hay 8800!
    expect(tongToiDa).toBeLessThanOrEqual(10)
    expect(tongToiDa).toBe(10)

    // Mỗi câu sai có 10 ứng viên
    for (const t of thongKe) {
      expect(t.soUngVienToiDa).toBe(10)
    }

    // Khi kéo 5 câu, phân bổ tính theo tỷ lệ và làm tròn lên
    const phanBo = tinhSoCauMoiDang(5)
    let tongPhanBo = 0
    for (const [, n] of phanBo.entries()) {
      tongPhanBo += n
    }
    expect(tongPhanBo).toBeGreaterThan(0)
  })

  it('3. Lọc theo ca thi ở Chế độ 2: khi bỏ tick ca-2 thì chỉ tính câu sai của ca-1', () => {
    const dsCauSai: CauSaiDauVao[] = [
      { qid: 'q1', soCau: 1, phan: 'I', dang: { ma: 'D1', ten: 'Dạng 1' }, dapAnDung: 'A', text: 'C1', maCa: 'ca-1' },
      { qid: 'q2', soCau: 2, phan: 'I', dang: { ma: 'D2', ten: 'Dạng 2' }, dapAnDung: 'A', text: 'C2', maCa: 'ca-1' },
      { qid: 'q3', soCau: 3, phan: 'I', dang: { ma: 'D3', ten: 'Dạng 3' }, dapAnDung: 'A', text: 'C3', maCa: 'ca-2' },
    ]

    // Nếu chỉ tick ca-1:
    const dsCauSaiCa1 = dsCauSai.filter((c) => c.maCa === 'ca-1')
    const { thongKe, tongToiDa } = phanTichTyLeDang(dsCauSaiCa1, khoDeGiaLap)

    expect(thongKe).toHaveLength(2)
    expect(thongKe.map((t) => t.qid)).toEqual(['q1', 'q2'])
    // D1 có 10 câu, D2 có 10 câu => tổng ứng viên phân biệt = 20
    expect(tongToiDa).toBe(20)
  })

  it('4. phanTichBoLocCau: trần thanh trượt không vượt quá 100 câu và không vượt ứng viên có thật', () => {
    const dsCauSai: CauSaiDauVao[] = [
      { qid: 'q1', soCau: 1, phan: 'I', dang: { ma: 'D1', ten: 'Dạng 1' }, dapAnDung: 'A', text: 'C1' },
    ]
    const { tongToiDa } = phanTichBoLocCau(dsCauSai, khoDeGiaLap, { sao: 'moi', dang: 'tat_ca' })
    expect(tongToiDa).toBeLessThanOrEqual(100)
    expect(tongToiDa).toBe(10)
  })

  it('5. dungDeRieng: cấu hình 8 trắc nghiệm, 2 đúng sai, 2 trả lời ngắn và rút 30% câu sai ca trước thì đề phải ĐỦ 12 CÂU', () => {
    // Giả lập kho gồm đủ câu: 20 câu phần I, 10 câu phần II, 10 câu phần III
    const khoDeLon: TeacherExamSource[] = [
      {
        maDe: 'de-chuan',
        nhom: 'Chuan',
        phanI: Array.from({ length: 20 }, (_, i) => ({
          id: `mcq-${i + 1}`,
          text: `Trắc nghiệm ${i + 1}`,
          choices: ['A', 'B', 'C', 'D'],
          correct: 'A',
          chuyenDe: 'Hoá học',
          mucDo: 'hieu',
        })),
        phanII: Array.from({ length: 10 }, (_, i) => ({
          id: `tf-${i + 1}`,
          text: `Đúng sai ${i + 1}`,
          ideas: ['A', 'B', 'C', 'D'],
          correct: ['D', 'S', 'D', 'S'],
          chuyenDe: 'Hoá học',
          mucDo: 'hieu',
        })),
        phanIII: Array.from({ length: 10 }, (_, i) => ({
          id: `sa-${i + 1}`,
          text: `Trả lời ngắn ${i + 1}`,
          correct: '123',
          chuyenDe: 'Hoá học',
          mucDo: 'hieu',
        })),
      } as unknown as TeacherExamSource,
    ]

    const uv = dungUngVien(khoDeLon)

    // Ca trước em 12345 sai 6 câu trắc nghiệm (mcq-1 .. mcq-6)
    const dsCa = [
      {
        maCa: 'ca-truoc',
        daLamCua: { '12345': ['mcq-1', 'mcq-2', 'mcq-3', 'mcq-4', 'mcq-5', 'mcq-6'] },
        saiCua: { '12345': ['mcq-1', 'mcq-2', 'mcq-3', 'mcq-4', 'mcq-5', 'mcq-6'] },
      },
    ]

    // Ca mới yêu cầu: 8 câu phần I, 2 câu phần II, 2 câu phần III (tổng 12 câu)
    const sc = { I: 8, II: 2, III: 2 }
    const ra = dungDeRieng({
      uv,
      yc: { soCau: sc, chuyenDe: [], mucDo: [], tranhQid: [], seed: 123456 },
      dsSbd: ['12345'],
      dsCa,
      ch: {
        TI_LE_CAU_LAP: 0.3, // 30% của 6 câu sai = 2 câu lặp
        TRAN_CA_QUET: 10,
        TRAN_LAP_MOT_CAU: 3,
        CHO_LAP_CAU_BO_TRONG: false,
        PHAM_VI_HOI_LAI: 'gan_nhat',
      },
    })

    const deCuaEm = ra.boTheoEm['12345']
    expect(deCuaEm).toBeDefined()
    // ĐỀ CỦA EM PHẢI ĐỦ CHÍNH XÁC 12 CÂU (8 phần I, 2 phần II, 2 phần III), KHÔNG BỊ HỤT CÒN 6 CÂU!
    expect(deCuaEm).toHaveLength(12)

    // Trong đó số câu lặp là ceil(6 * 0.3) = 2 câu
    expect(ra.soLapCua['12345']).toBe(2)
    const lapThat = ra.lapTheoEm['12345']
    expect(lapThat).toHaveLength(2)

    // 10 câu còn lại (6 trắc nghiệm, 2 đúng sai, 2 trả lời ngắn) phải là câu mới được rút trong đề
    const cauMoi = deCuaEm.filter((q) => !lapThat.includes(q))
    expect(cauMoi).toHaveLength(10)
  })
})
