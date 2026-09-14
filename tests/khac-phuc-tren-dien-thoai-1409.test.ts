// KHẮC PHỤC CÂU SAI PHẢI CHẠY ĐƯỢC TRÊN MÁY HỌC SINH.
//
// Thầy 14/09 kèm ảnh iPhone: ca Test6, 10 câu làm sai, modal hiện "Luyện thêm
// dạng câu sai (Tỷ lệ tối đa: 0 câu)" và "Số câu rút luyện tập: 0 / 0 câu";
// bấm "Bắt đầu làm bài" thì không có gì xảy ra.
//
// TRUY RA HAI LỖI RỜI NHAU, cả hai đều có mặt trên máy em:
//
// LỖI 1 — VÒNG KÍN, đây là lỗi làm "không chạy".
//   `BaoCaoCaThiHocSinhModal` nhận tờ phiếu qua `onTaoPhieuXong(html)` rồi VỨT
//   html đi, chỉ gọi `onBatDauKhacPhuc(maCa)`. Nhánh ấy bên `StudentPortalScreen`
//   đi tải lại câu sai và MỞ LẠI ĐÚNG modal em vừa bấm. Bấm "Bắt đầu làm bài"
//   là quay về chính nó — không đường nào mở ra đề.
//
// LỖI 2 — "Tỷ lệ tối đa: 0 câu".
//   Chế độ 2 và 3 rút câu từ `loadExamSources()`, tức kho đề trong IndexedDB
//   của CHÍNH MÁY ĐANG MỞ. Kho ấy chỉ do `dongBoNganHang` nạp, mà hàm ấy đòi
//   mã bí mật của thầy (`src/lib/exam-sync.ts`). Máy em không có mã ⇒ kho LUÔN
//   rỗng ⇒ mọi tỷ lệ ra 0. Chế độ 2 có đường lui (làm lại câu sai gốc) nên vẫn
//   ra câu, nhưng màn hình thì hiện 0/0 — em không hiểu gì.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  taoDeLamLaiCauSai,
  phanTichTyLeDang,
  rutLuyenThemDangCauSai,
  type CauSaiDauVao,
} from '../src/lib/thuat-toan-rut-cau-sai'

/** Mười câu sai như máy chủ trả cho máy em (ca Test6 trong ảnh của thầy). */
const DS_CAU_SAI: CauSaiDauVao[] = Array.from({ length: 10 }, (_, i) => ({
  qid: `T6-I-${i + 1}`,
  soCau: i + 1,
  phan: 'I',
  chuyenDe: 'Ester – lipid',
  mucDo: 'hieu',
  dapAnChon: 'A',
  dapAnDung: 'C',
  text: `Nhận định nào sau đây về ester là đúng (mục ${i + 1})?`,
  choices: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
  loiGiai: JSON.stringify({
    chot: 'Ester no đơn chức mạch hở có công thức chung CnH2nO2.',
    tung_pa: { C: { dung: true, vi_sao: 'Đúng công thức chung.' } },
  }),
  dang: { ma: 'ESTER.CAU_TAO.DEM_NGUYEN_TU', ten: 'Cấu tạo — đếm nguyên tử' },
  maCa: '814335',
  tenCa: 'Test6',
}))

const doc = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const boChuThich = (s: string) => s.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

describe('LỖI 1 — vòng kín "Bắt đầu làm bài"', () => {
  const bc = boChuThich(doc('src/components/BaoCaoCaThiHocSinhModal.tsx'))
  const cong = boChuThich(doc('src/screens/StudentPortalScreen.tsx'))

  it('báo cáo ca thi trao TỜ PHIẾU lên, không vứt đi', () => {
    expect(bc).toContain('onTaoPhieuXong={(html) => {')
    expect(bc).toContain('onBatDauKhacPhuc(baiThi.maCa, html)')
    // Bản cũ gọi không tham số — đó chính là chỗ tờ phiếu bị rơi.
    expect(bc).not.toContain('onBatDauKhacPhuc(baiThi.maCa)')
  })

  it('cổng học sinh có phiếu thì mở thẳng, không gọi lại taoDeKhacPhuc', () => {
    const i = cong.indexOf('onBatDauKhacPhuc={(maCa, html)')
    expect(i).toBeGreaterThan(-1)
    const khoi = cong.slice(i, i + 600)
    expect(khoi).toContain('setPhieuHtml(html)')
    // `return` phải đứng TRƯỚC lượt gọi lại, nếu không vẫn mở lại modal cũ.
    expect(khoi.indexOf('return')).toBeLessThan(khoi.indexOf('taoDeKhacPhuc([maCa])'))
  })
})

describe('LỖI 2 — máy học sinh không có kho đề', () => {
  it('TÁI HIỆN: kho rỗng thì tỷ lệ tối đa đúng bằng 0', () => {
    const { tongToiDa, thongKe } = phanTichTyLeDang(DS_CAU_SAI, [])
    expect(tongToiDa).toBe(0)
    expect(thongKe).toHaveLength(10)
  })

  it('chế độ 2 lui về đúng 10 câu sai gốc, không trả đề trắng', () => {
    const { dsCau } = rutLuyenThemDangCauSai(DS_CAU_SAI, [], 0, { hoTen: 'Em A', sbd: '12109' })
    expect(dsCau).toHaveLength(10)
  })

  it('chế độ 1 ra đủ 10 câu vì nội dung câu sai đi kèm báo cáo', () => {
    const { dsCau, html } = taoDeLamLaiCauSai(DS_CAU_SAI, { hoTen: 'Em A', sbd: '12109' })
    expect(dsCau).toHaveLength(10)
    expect(html).toContain('Nhận định nào sau đây về ester là đúng (mục 1)?')
    expect(html).toContain('Nhận định nào sau đây về ester là đúng (mục 10)?')
  })

  const modal = boChuThich(doc('src/components/ModalKhacPhucCauSai.tsx'))

  it('modal mặc định vào chế độ 1, chỉ nâng lên 2 khi kho thật sự có đề', () => {
    expect(modal).toContain('useState<1 | 2 | 3>(1)')
    expect(modal).not.toContain('useState<1 | 2 | 3>(2)')
    expect(modal).toContain('if (sources.length > 0) setCheDo(')
  })

  it('khoá thẻ 2 và thẻ 3 khi kho rỗng và nói rõ vì sao', () => {
    expect(modal).toContain('const coKhoDe = khoDe.length > 0')
    expect(modal).toContain('onClick={() => coKhoDe && setCheDo(2)}')
    expect(modal).toContain('onClick={() => coKhoDe && setCheDo(3)}')
    expect(modal).toContain('KHONG_CO_KHO')
  })

  it('rút ra 0 câu thì báo lý do, không mở phiếu trắng', () => {
    expect(modal).toContain('if (dsCauKetQua.length === 0)')
    expect(modal).toContain('setLoiRut(')
  })
})
