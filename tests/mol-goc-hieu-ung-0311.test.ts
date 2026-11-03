// Thầy 03/11 tối: «hiệu ứng của mol mất hết rồi, khôi phục lại đầy đủ hiệu ứng của mol» · «nhớ tải sẵn mọi hiệu ứng cho máy yếu» · «cho Mol to lên cho phù hợp
// và cân đối với bảng» · «khung bong bóng vừa với chữ và có màu nền theo cảm xúc của mol». Gốc lỗi: Mol góc thẻ đầu cỡ 58 px < 64 ⇒ Bi chạy chế độ 'nho' (mặt tĩnh).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { MOL_GOC } from '../src/components/hoc-tap/TrongHs'
import { cheDoBi } from '../src/components/linh-vat/Bi'

const doc = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')

describe('Mol góc thẻ đầu', () => {
  it('cỡ ≥ 64 px ⇒ không rơi vào chế độ «nho» (mất vòng hiệu ứng)', () => {
    expect(MOL_GOC).toBeGreaterThanOrEqual(64)
    expect(cheDoBi(MOL_GOC)).not.toBe('nho')
    expect(doc('src/components/hoc-tap/TrongHs.tsx')).toMatch(/<Bi cam=\{cam\} cap=\{cap\} size=\{MOL_GOC\}/)
  })
  it('bong bóng không giãn hết hàng, đo bề rộng theo dòng dài nhất; nền · viền · chữ theo cảm xúc', () => {
    const css = doc('src/styles/trong-kinh.css')
    expect(css).toMatch(/\.kb-mol \.kb-mol-bong \{[^}]*flex: 0 1 auto/)
    expect(css).toMatch(/\.kb-mol \.kb-mol-bong\[data-cx\][^{]*\{\s*background: var\(--bb-nen/)
    expect(css).toMatch(/\.kb-mol \.kb-mol-bong\[data-cx\] \{ color: var\(--bb-chu/)
    expect(doc('src/components/hoc-tap/TrongHs.tsx')).toMatch(/ref=\{bongGoc\} className="bi-loi-bong kb-mol-bong"/)
    expect(doc('src/components/hoc-tap/TrongHs.tsx')).toMatch(/useBongVuaChu\(!!goc, loi\)/)
  })
  it('máy yếu: vẫn mấp máy miệng khi Mol nói (không tắt sạch hoạt ảnh)', () => {
    expect(doc('src/styles/mol.css')).toMatch(/html\.may-yeu \.mol-svg :not\(\.mol-mieng\) \{ animation: none !important; \}/)
  })
})
