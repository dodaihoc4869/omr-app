// SỬA LỖI (0.Planer 19/09, luật thầy chốt 18/09 áp cho MỌI màn phụ huynh): báo cáo ca thi chỉ NÓI SỐ LIỆU, không kết luận năng lực
// của con từ một điểm số — "không coi số câu nộp là bằng chứng đã nắm chắc kiến thức". Tái hiện: bản cũ ghi "Nắm rất chắc nền tảng",
// "Khả năng tư duy hóa học và phản xạ giải toán rất chắc chắn", "giữ vững phong độ đỉnh cao" chỉ từ điểm >= 8 / >= 9.
// 27/10: hộp BaoCaoCaThiPhuHuynhModal và lib/danh-gia-bai đã gỡ khỏi src/ vì không màn nào dùng ⇒ chỉ còn soát báo cáo em bản mới.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { CA_MAU, TEP_BAO_CAO_EM_MOI, veBaoCaoEmMoi } from './_bao-cao-em-moi'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

// các cụm kết luận năng lực bị cấm (không phân biệt hoa thường)
const CAM = /nắm (rất )?chắc|nắm vững|nắm chặt|bịt sạch|thành thạo|rất chắc chắn|vững phong độ|phong độ đỉnh cao/i
// bỏ chú thích: chú thích được phép NHẮC luật (kể cả trích cụm bị cấm); chỉ chữ hiển thị mới bị kiểm
const doc = (p: string) =>
  fs
    .readFileSync(path.join(process.cwd(), p), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

describe('báo cáo ca thi không kết luận năng lực từ điểm số', () => {
  it('mã nguồn báo cáo em bản mới không còn các cụm bị cấm', () => {
    // 28/09: modal học sinh cũ ĐÃ XOÁ — báo cáo của em nay là BaoCaoCaCuaEm → BaoCaoChiTiet chế độ em (lib/bao-cao-cua-em)
    for (const f of [...TEP_BAO_CAO_EM_MOI]) {
      expect(doc(f).match(CAM)?.[0] ?? null, f).toBeNull()
    }
  })

  for (const diem of [9.75, 8.5, 5.25]) {
    it(`báo cáo em bản mới ở điểm ${diem}: chỉ nói số liệu, không cụm kết luận năng lực`, () => {
      const { container } = veBaoCaoEmMoi({ ...CA_MAU, tong: diem })
      const chu = container.textContent || ''
      expect(chu).toContain(String(diem).replace('.', ','))
      expect(chu.match(CAM)?.[0] ?? null).toBeNull()
      expect(chu.match(/năng lực|nền tảng|lỗ hổng/i)?.[0] ?? null).toBeNull()
    })
  }
})
