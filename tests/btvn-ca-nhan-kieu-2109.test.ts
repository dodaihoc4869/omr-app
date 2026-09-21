// KHOÁ RANH GIỚI MÁY CHỦ ↔ TRÌNH DUYỆT của lõi BTVN "nâng đỡ" (Boss 21/09: `tsc -p server` đỏ vì localStorage).
// `bai-tap-pdf.ts` → `cau-hinh-chua.ts` được biên dịch cả phía máy chủ (không có localStorage/window/document). Nên:
//  · `btvn-ca-nhan-kieu.ts` (kiểu + hàm thuần) TUYỆT ĐỐI không đụng API trình duyệt;
//  · mọi tệp có thể bị kéo sang máy chủ chỉ import từ `-kieu`, không import `btvn-ca-nhan-em` (có localStorage).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import * as kieu from '../src/lib/btvn-ca-nhan-kieu'
import * as em from '../src/lib/btvn-ca-nhan-em'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
/** Bỏ chú thích để chỉ soi MÃ. */
const boChuThich = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '')

describe('lõi thuần không đụng API trình duyệt', () => {
  it('btvn-ca-nhan-kieu.ts không có localStorage / sessionStorage / window / document / navigator / indexedDB', () => {
    const ma = boChuThich(doc('src/lib/btvn-ca-nhan-kieu.ts'))
    expect(ma).not.toMatch(/\b(localStorage|sessionStorage|window|document|navigator|indexedDB|location)\b/)
  })

  it('tệp thuần không import tệp nào của trình duyệt (chỉ tự đứng một mình)', () => {
    const ma = boChuThich(doc('src/lib/btvn-ca-nhan-kieu.ts'))
    // ĐÚNG MỘT import được phép: './ngay-gio-24' (hàm thuần định dạng ngày giờ VN, không API trình duyệt) cho `hanChu`
    const dong = ma.match(/^\s*import\s.*$/gm) ?? []
    expect(dong).toHaveLength(1)
    expect(dong[0]).toMatch(/from '\.\/ngay-gio-24'/)
  })

  it('tệp lưu máy (btvn-ca-nhan-em.ts) mới là nơi có localStorage, và tái xuất trọn tệp thuần', () => {
    expect(boChuThich(doc('src/lib/btvn-ca-nhan-em.ts'))).toMatch(/localStorage/)
    for (const ten of Object.keys(kieu)) expect((em as Record<string, unknown>)[ten], ten).toBe((kieu as Record<string, unknown>)[ten])
    expect(typeof em.luuKetQuaChang).toBe('function')
    expect(typeof em.docKetQuaChangDaLuu).toBe('function')
    expect(Object.keys(kieu)).not.toContain('luuKetQuaChang')
  })
})

describe('tệp có thể bị kéo sang máy chủ chỉ import từ btvn-ca-nhan-kieu', () => {
  for (const p of ['src/lib/bai-tap-pdf.ts', 'src/lib/html-phieu-ca-nhan.ts', 'src/lib/btvn-may-chu-moi.ts', 'src/components/bang-nhiem-vu/TheCuoiChang.tsx']) {
    it(p, () => {
      const ma = boChuThich(doc(p))
      expect(ma).not.toMatch(/btvn-ca-nhan-em['"]/)
      expect(ma).toMatch(/btvn-ca-nhan-kieu['"]/)
    })
  }
})
