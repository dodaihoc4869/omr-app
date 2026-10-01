// XOAY NGANG KHÔNG ĐỔI BỐ CỤC (thầy 01/10: "chế độ xoay ngang điện thoại không hoạt động").
// Nguyên nhân: mảnh LamBaiNgang nằm NGOÀI precache; máy còn bản cũ sau một lượt phát hành (mảnh cũ đã bị thay) hay mạng yếu lúc xoay ⇒ nạp hỏng,
// React.lazy nhớ luôn lỗi và BoLuiDoc giữ bố cục dọc mãi. Chặn tái phát: mảnh phải ở trong precache, và lỗi nạp phải dựng lại lazy mới.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

const vite = fs.readFileSync('vite.config.ts', 'utf8')
const man = fs.readFileSync('src/screens/ExamTakeScreen.tsx', 'utf8')

describe('Màn làm bài ngang luôn nạp được', () => {
  it('mảnh LamBaiNgang không bị loại khỏi precache', () => {
    const boQua = vite.slice(vite.indexOf('globIgnores'), vite.indexOf('],', vite.indexOf('globIgnores')))
    expect(boQua).not.toMatch(/LamBaiNgang/)
  })
  it('nạp hỏng ⇒ thử lại một lần và dựng lazy mới cho lần xoay sau', () => {
    expect(man).toMatch(/const napNgang = \(\) => import\('\.\/LamBaiNgang'\)\.catch\(/)
    expect(man).toMatch(/let LamBaiNgang = lazy\(napNgang\)/)
    expect(man).toMatch(/<BoLuiDoc duPhong=\{manDoc\} onLoi=\{lamMoiManhNgang\}>/)
    expect(man).toMatch(/componentDidCatch\(\) \{\s*this\.props\.onLoi\?\.\(\)/)
  })
})
