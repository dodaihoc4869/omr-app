import { describe, it, expect } from 'vitest'
import {
  chuyenCauSaiSangCauLuyen,
  phanTichTyLeDang,
  rutLuyenThemDangCauSai,
  phanTichBoLocCau,
  rutLuyenTheoBoLoc,
  taoDeLamLaiCauSai,
  type CauSaiDauVao,
} from '../src/lib/thuat-toan-rut-cau-sai'
import type { TeacherExamSource } from '../src/data/examContent'

const A = 'ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG'
const B = 'ESTER.ESTER_HOA.TINH_HIEU_SUAT'

const cauKho = (id: string, ma: string, sao = 1, kieu: 'ly_thuyet' | 'bai_tap' = 'ly_thuyet') => ({
  id,
  text: `Câu hỏi trong kho ${id}`,
  choices: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
  correct: 'A',
  chuyenDe: 'Ester – lipid',
  mucDo: 'hieu',
  dang: { ma, ten: ma },
  canChua: { sao, dk: [], ly_do: '', bay: null },
  kieu,
})

const khoMock = (cauList: any[]): TeacherExamSource[] => [
  {
    maDe: 'DE_TEST_1',
    ngayNap: '2026-09-14',
    phanI: cauList,
    phanII: [],
    phanIII: [],
  } as unknown as TeacherExamSource,
]

describe('Thuật toán rút câu sai & khắc phục lỗi sai', () => {
  describe('Lựa chọn 1: Làm lại các câu sai', () => {
    it('chuyển đổi câu sai thành CauLuyen chuẩn hoá kèm lời giải và laLamLai: true', () => {
      const cs: CauSaiDauVao = {
        qid: 'q1',
        soCau: 1,
        phan: 'I',
        chuyenDe: 'Ester',
        mucDo: 'hieu',
        text: 'Thuỷ phân etyl axetat thu được chất nào?',
        choices: ['Etanol', 'Metanol', 'Axit fomic', 'Glyxerol'],
        dapAnDung: 'A',
        dapAnChon: 'B',
        loiGiai: 'Đáp án A vì etyl axetat là CH3COOC2H5 thuỷ phân sinh CH3COOH và C2H5OH.',
      }

      const cl = chuyenCauSaiSangCauLuyen(cs)
      expect(cl.id).toBe('q1')
      expect(cl.chuaCho?.laLamLai).toBe(true)
      expect(cl.chuaCho?.daChon).toBe('B')
      expect(cl.chot).toBeTruthy()
      expect(cl.dapAn).toBe('A')

      const de = taoDeLamLaiCauSai([cs], { hoTen: 'Em Học Sinh', sbd: '001' })
      expect(de.dsCau).toHaveLength(1)
      expect(de.html).toContain('LÀM LẠI CÂU SAI')
      expect(de.html).toContain('Thuỷ phân etyl axetat')
    })
  })

  describe('Lựa chọn 2: Luyện thêm dạng câu sai theo tỷ lệ tối đa', () => {
    it('10 câu sai, mỗi câu có 10 câu giống nhãn dán -> tổng tối đa 100 câu', () => {
      // Dựng 10 câu sai
      const dsCauSai: CauSaiDauVao[] = Array.from({ length: 10 }, (_, i) => ({
        qid: `sai_${i + 1}`,
        soCau: i + 1,
        phan: 'I' as const,
        chuyenDe: 'Ester',
        dang: `DANG_${i + 1}`,
        text: `Câu sai ${i + 1}`,
        dapAnDung: 'A',
      }))

      // Dựng kho: mỗi dạng có đúng 10 câu ứng viên
      const khoCau: any[] = []
      for (let i = 1; i <= 10; i++) {
        for (let j = 1; j <= 10; j++) {
          khoCau.push(cauKho(`c_${i}_${j}`, `DANG_${i}`))
        }
      }

      const { thongKe, tongToiDa, tinhSoCauMoiDang } = phanTichTyLeDang(dsCauSai, khoMock(khoCau))

      // Tổng tối đa phải là 100 câu (10 * 10)
      expect(tongToiDa).toBe(100)
      expect(thongKe).toHaveLength(10)
      expect(thongKe.every((t) => t.soUngVienToiDa === 10)).toBe(true)

      // Khi học sinh kéo số câu rút là 25:
      // Tỷ lệ mỗi câu = 10/100 = 0.1 -> 25 * 0.1 = 2.5 -> làm tròn lên (Math.ceil) = 3 câu
      const phanBo25 = tinhSoCauMoiDang(25)
      for (let i = 1; i <= 10; i++) {
        expect(phanBo25.get(`sai_${i}`)).toBe(3)
      }

      // Khi kéo 100 câu -> mỗi câu nhận đủ 10 câu
      const phanBo100 = tinhSoCauMoiDang(100)
      for (let i = 1; i <= 10; i++) {
        expect(phanBo100.get(`sai_${i}`)).toBe(10)
      }

      // Thực hiện rút đề thực tế
      const res = rutLuyenThemDangCauSai(dsCauSai, khoMock(khoCau), 25, { hoTen: 'Học Sinh', sbd: '123' })
      expect(res.dsCau.length).toBeGreaterThan(0)
      expect(res.html).toContain('LUYỆN DẠNG CÂU SAI')
    })

    it('tỷ lệ không đều: câu nhiều ứng viên được nhiều hơn, lẻ làm tròn lên', () => {
      const dsCauSai: CauSaiDauVao[] = [
        { qid: 's1', soCau: 1, phan: 'I', dang: A, text: 'S1', dapAnDung: 'A' },
        { qid: 's2', soCau: 2, phan: 'I', dang: B, text: 'S2', dapAnDung: 'B' },
      ]

      // Kho: dạng A có 5 câu, dạng B có 15 câu -> tổng tối đa = 20 câu
      const khoCau = [
        ...Array.from({ length: 5 }, (_, i) => cauKho(`a_${i + 1}`, A)),
        ...Array.from({ length: 15 }, (_, i) => cauKho(`b_${i + 1}`, B)),
      ]

      const { tongToiDa, tinhSoCauMoiDang } = phanTichTyLeDang(dsCauSai, khoMock(khoCau))
      expect(tongToiDa).toBe(20)

      // Kéo 8 câu:
      // A (5/20 = 25%): 8 * 0.25 = 2 câu
      // B (15/20 = 75%): 8 * 0.75 = 6 câu
      const phanBo8 = tinhSoCauMoiDang(8)
      expect(phanBo8.get('s1')).toBe(2)
      expect(phanBo8.get('s2')).toBe(6)

      // Kéo 5 câu:
      // A: 5 * 0.25 = 1.25 -> ceil = 2 câu
      // B: 5 * 0.75 = 3.75 -> ceil = 4 câu
      const phanBo5 = tinhSoCauMoiDang(5)
      expect(phanBo5.get('s1')).toBe(2)
      expect(phanBo5.get('s2')).toBe(4)
    })
  })

  describe('Lựa chọn 3: Luyện câu theo bộ lọc (sao & lý thuyết/bài tập)', () => {
    it('lọc chính xác theo mức sao và thể loại, trần thanh trượt tối đa 100 câu', () => {
      const dsCauSai: CauSaiDauVao[] = [
        { qid: 's1', soCau: 1, phan: 'I', dang: A, text: 'S1', dapAnDung: 'A' },
      ]

      // Kho có các mức sao và kiểu khác nhau
      const khoCau = [
        cauKho('c1', A, 2, 'ly_thuyet'), // 2 sao, lý thuyết
        cauKho('c2', A, 2, 'bai_tap'),   // 2 sao, bài tập
        cauKho('c3', A, 1, 'ly_thuyet'), // 1 sao, lý thuyết
        cauKho('c4', A, 0, 'ly_thuyet'), // 0 sao, lý thuyết
      ]

      // Lọc: 2 sao, lý thuyết
      const { thongKe: tk1, tongToiDa: max1 } = phanTichBoLocCau(
        dsCauSai,
        khoMock(khoCau),
        { sao: 'sao_2', dang: 'ly_thuyet' }
      )
      expect(max1).toBe(1)
      expect(tk1[0].ungVien.map((c) => c.id)).toEqual(['c1'])

      // Lọc: 0 sao, mọi dạng
      const { thongKe: tk0, tongToiDa: max0 } = phanTichBoLocCau(
        dsCauSai,
        khoMock(khoCau),
        { sao: 'sao_0', dang: 'tat_ca' }
      )
      expect(max0).toBe(1)
      expect(tk0[0].ungVien.map((c) => c.id)).toEqual(['c4'])

      // Rút thực tế
      const res = rutLuyenTheoBoLoc(
        dsCauSai,
        khoMock(khoCau),
        { sao: 'sao_2', dang: 'ly_thuyet' },
        1,
        { hoTen: 'Học Sinh', sbd: '123' }
      )
      expect(res.dsCau).toHaveLength(1)
      expect(res.dsCau[0].id).toBe('c1')
      expect(res.html).toContain('BỘ LỌC CÂU LUYỆN')
    })
  })
})
