// BÀI KIỂM TRA: Giao bài tập về nhà cho từng học sinh có ô tick
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const PC = doc('src/screens/PhanCongScreen.tsx')
const BTVN_LIB = doc('src/lib/btvn-may-chu-moi.ts')
const SERVER = doc('server/src/index.ts')

describe('GIAO BTVN CHO TỪNG HỌC SINH', () => {
  it('PhanCongScreen có 2 chế độ: Theo ca thi và Cho từng học sinh', () => {
    expect(PC).toContain('Theo ca thi (cả lớp)')
    expect(PC).toContain('Cho từng học sinh')
    expect(PC).toContain("const [cheDo, setCheDo] = useState<'ca' | 'hoc_sinh'>('ca')")
  })

  it('PhanCongScreen ẩn chọn ca thi khi ở chế độ giao cho từng học sinh', () => {
    expect(PC).toContain("{cheDo === 'ca' && (")
    expect(PC).toContain('disabled={dangGiao || sbdChon.size === 0 || daChon.size === 0}')
  })

  it('PhanCongScreen hiển thị ô danh sách học sinh có ô tick và tìm kiếm', () => {
    expect(PC).toContain('Danh sách học sinh — tick ô vuông để giao bài tập')
    expect(PC).toContain('Chọn tất cả')
    expect(PC).toContain('Bỏ chọn')
    expect(PC).toContain('Tìm theo số báo danh, họ tên, lớp...')
    expect(PC).toContain('toggleSbd(e.sbd)')
  })

  it('giaoBtvn ở client thư viện hỗ trợ dsSbd và cho phép ca rỗng', () => {
    expect(BTVN_LIB).toContain('dsSbd?: string[]')
    expect(BTVN_LIB).toContain('coSbd')
    expect(BTVN_LIB).toContain('if (dsMaCa.length === 0 && !coSbd)')
  })

  it('Server giaoBtvn tiếp nhận dsSbd và lọc đúng học sinh được chọn', () => {
    expect(SERVER).toContain('const dsSbd = Array.isArray(b.dsSbd)')
    expect(SERVER).toContain('if (dsMaCa.length === 0 && dsSbd.length > 0)')
    expect(SERVER).toContain('setSbd.has(String(e.sbd))')
  })
})
