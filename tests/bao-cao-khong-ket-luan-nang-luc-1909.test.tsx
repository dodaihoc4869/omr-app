// SỬA LỖI (0.Planer 19/09, luật thầy chốt 18/09 áp cho MỌI màn phụ huynh): báo cáo ca thi chỉ NÓI SỐ LIỆU, không kết luận năng lực
// của con từ một điểm số — "không coi số câu nộp là bằng chứng đã nắm chắc kiến thức". Tái hiện: bản cũ ghi "Nắm rất chắc nền tảng",
// "Khả năng tư duy hóa học và phản xạ giải toán rất chắc chắn", "giữ vững phong độ đỉnh cao" chỉ từ điểm >= 8 / >= 9.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import BaoCaoCaThiPhuHuynhModal from '../src/components/BaoCaoCaThiPhuHuynhModal'

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
  it('mã nguồn hai modal báo cáo và danh-gia-bai.ts không còn các cụm bị cấm', () => {
    for (const f of ['src/components/BaoCaoCaThiPhuHuynhModal.tsx', 'src/components/BaoCaoCaThiHocSinhModal.tsx', 'src/lib/danh-gia-bai.ts']) {
      expect(doc(f).match(CAM)?.[0] ?? null, f).toBeNull()
    }
  })

  for (const diem of [9.75, 8.5, 7, 5.25]) {
    it(`modal phụ huynh ở điểm ${diem}: lời khuyên NÊU đúng con số ${diem.toFixed(2)}/10 và không có cụm bị cấm`, () => {
      window.history.replaceState(null, '', '/?vai=phuhuynh')
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, items: [] }), text: async () => '{}' })))
      render(
        <BaoCaoCaThiPhuHuynhModal
          baiThi={{ maCa: 'CA-1', tenCa: 'Ca thử', diem, tongSoCau: 28, soCauDung: 20, soCauSai: 8 } as any}
          hoTenCon="Minh" sbd="12001" scriptUrl="https://may.test" onClose={() => {}} onGiaoBaiChoCon={() => {}} onNhanTinChoThay={() => {}}
        />,
      )
      const chu = document.body.textContent || ''
      expect(chu).toContain(`${diem.toFixed(2)}/10`)
      expect(chu.match(CAM)?.[0] ?? null).toBeNull()
      expect(chu).toContain('Gợi ý hành động')
    })
  }
})
