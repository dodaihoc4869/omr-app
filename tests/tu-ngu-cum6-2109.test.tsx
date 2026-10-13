// TỪ NGỮ · CỤM 6 (nút, hộp thoại, emoji — bảng duyệt docs/ra-soat-tu-ngu-2109-code2.md, 21/09): khoá chữ mới ở Võ đài, Đoàn Hộ Tống,
// Khiên, bài Mom, phiếu; và khoá "không emoji" ở các tệp chữ hiện cho học sinh (biểu tượng nét thay vào).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { it, expect, vi, afterEach, describe } from 'vitest'
import { render, screen, fireEvent, cleanup, within, configure } from '@testing-library/react'
import { JS_PHIEU } from '../src/lib/html-phieu'

// Chạy chung cả bộ 8000 test máy rất nặng: nới hạn chờ của findBy để không đỏ oan vì chậm (không đo thời gian ở đây).
configure({ asyncUtilTimeout: 8000 })
afterEach(() => { cleanup(); sessionStorage.clear() })

const doc = (tep: string) => readFileSync(resolve(__dirname, '..', tep), 'utf8')
// Chữ tượng hình (emoji) + vài ký hiệu hay bị máy vẽ thành emoji. Chỉ soi tệp có chữ HIỆN cho học sinh/phụ huynh.
const EMOJI = /[\u{1F300}-\u{1FAFF}✨⏳⚔❤⚡✅❌]/u
const DONG_LENH = /^\s*(\/\/|\*|\/\*|\{\/\*)/

describe('cụm 6 · không còn emoji ở chữ hiện cho em', () => {
  const TEP = [
    'src/components/bang-nhiem-vu/MomM3.tsx',
    'src/lib/html-phieu.ts',
  ]
  for (const t of TEP) {
    it(`${t} không có emoji`, () => {
      const dong = doc(t).split('\n').map((d, i) => ({ d, i: i + 1 })).filter(x => !DONG_LENH.test(x.d) && EMOJI.test(x.d))
      expect(dong.map(x => `${x.i}: ${x.d.trim().slice(0, 80)}`)).toEqual([])
    })
  }
  it('cổng học sinh: hai chip Mom "Đã nộp" / "Đang làm" không dùng ✓ và ⏳', () => {
    const s = doc('src/screens/StudentPortalScreen.tsx')
    expect(s).not.toContain('✓ Đã nộp')
    expect(s).not.toContain('⏳ Đang làm')
  })
  it('phiếu: kịch bản mở toàn bộ câu dùng biểu tượng SVG kèm chữ, không dùng ✨', () => {
    expect(JS_PHIEU).not.toContain('✨')
  })
})

describe('cụm 6 · nút phiếu (H40)', () => {
  it('nút trên phiếu nói việc sẽ làm: "Ẩn lời giải", "Mở hết lời giải", "Đóng hết lời giải"', () => {
    const s = doc('src/lib/html-phieu.ts')
    expect(s).toContain('<span class="chu-mo">Ẩn lời giải</span><span class="chu-dong">Hiện cả lời giải</span>')
    expect(s).toContain('<span class="chu-mo">Mở hết lời giải</span><span class="chu-dong">Đóng hết lời giải</span>')
    expect(s).not.toContain('<span class="chu-mo">Hiện đề</span>')
    expect(s).not.toContain('<span class="chu-mo">Mở tất cả</span>')
  })
})
