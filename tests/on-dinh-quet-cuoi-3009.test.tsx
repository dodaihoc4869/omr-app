// ỔN ĐỊNH — QUÉT LẦN CUỐI 30/09 (thầy: "quét toàn bộ một lượt … ổn định"). Ba lỗ đã bịt:
//  1. Màn đang dở (ải Đảo 2.0, chặng Đoàn, lượt Tu luyện, Luyện đề cấu trúc) KHÔNG giữ trang ⇒ thầy phát hành giữa giờ là máy em tự tải lại giữa bài
//     (chỉ màn thi và Bi-a #95 có giữ). Nay cả bốn gọi `giuTrangKhongTaiLai()` khi đang dở, thả khi xong.
//  2. Lệnh game (`Game.tsx`, mọi lệnh Đảo/Đoàn) gọi fetch KHÔNG hạn ⇒ mạng treo là nút bận mãi (khoá `running` chặn mọi lệnh sau). Nay hạn 25 s.
//  3. Lỗi nạp mảnh mã (máy giữ bản cũ) lọt vào `ChanLoi` ⇒ hiện "Màn … gặp lỗi" và đứng đó. Nay tự tải lại một lần + lời đúng.
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ChanLoi, { laLoiNapManh } from '../src/components/ChanLoi'
import { dangLamBaiKhong, giuTrangKhongTaiLai } from '../src/lib/cap-nhat-app'

const doc = (p: string) => readFileSync(p, 'utf8')

describe('Màn đang dở giữ trang (không tự tải lại vì bản mới)', () => {
  it.each([
    ['src/game/than-thu-v2/dao2/Dao2.tsx', /useEffect\(\(\)=>pha==='ai'\?giuTrangKhongTaiLai\(\):undefined,\[pha\]\)/],
    ['src/game/than-thu-v2/DoanHoTong.tsx', /useEffect\(\(\) => \(dangDi \? giuTrangKhongTaiLai\(\) : undefined\), \[dangDi\]\)/],
    ['src/components/luyen-de/dung-luyen-de.ts', /useEffect\(\(\) => \(dangLam \? giuTrangKhongTaiLai\(\) : undefined\), \[dangLam\]\)/],
    ['src/components/tu-luyen/ManTuLuyen.tsx', /useEffect\(\(\) => \(coBai \? giuTrangKhongTaiLai\(\) : undefined\), \[coBai\]\)/],
  ])('%s', (tep, mau) => {
    expect(doc(tep)).toMatch(mau)
  })

  it('giữ ⇒ dangLamBaiKhong() = true; thả ⇒ false (hàm dọn của useEffect)', () => {
    expect(dangLamBaiKhong()).toBe(false)
    const tha = giuTrangKhongTaiLai()
    expect(dangLamBaiKhong()).toBe(true)
    tha()
    tha() // gọi hai lần vô hại
    expect(dangLamBaiKhong()).toBe(false)
  })
})

describe('Lệnh game có hạn chờ', () => {
  it('Game.tsx: fetch mang AbortController, hạn 25 s, lời báo tiếng Việt', () => {
    const s = doc('src/game/than-thu-v2/Game.tsx')
    expect(s).toMatch(/hetHan=new AbortController\(\);const hen=setTimeout\(\(\)=>hetHan\.abort\(\),25_000\)/)
    expect(s).toMatch(/signal:hetHan\.signal/)
    expect(s).toMatch(/finally\{clearTimeout\(hen\)\}/)
    expect(s).toContain('Máy chủ trả lời chậm. Em bấm lại nhé.')
  })
})

function VoManh(): React.ReactElement {
  throw new TypeError('Failed to fetch dynamically imported module: https://x/assets/ManTuLuyen-abc.js')
}
function VoLazy(): React.ReactElement {
  throw new Error('Element type is invalid. Received a promise that resolves to: undefined. Lazy element type must resolve to a class or function.')
}

describe('ChanLoi: thiếu mảnh mã ⇒ tự tải lại một lần', () => {
  afterEach(() => { try { sessionStorage.clear() } catch { /* */ } })
  it('nhận đúng họ lỗi', () => {
    expect(laLoiNapManh(new TypeError('Failed to fetch dynamically imported module: a.js'))).toBe(true)
    expect(laLoiNapManh(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(laLoiNapManh(new Error('Lazy element type must resolve to a class or function.'))).toBe(true)
    expect(laLoiNapManh(new Error('r.lop.trim is not a function'))).toBe(false)
  })
  it.each([['mảnh không tải được', VoManh], ['mảnh lười trả undefined (vite:preloadError đã chặn)', VoLazy]])('%s: báo "Đang tải bản mới", ghi mốc tải lại', (_t, Vo) => {
    const im = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ChanLoi o="Cổng học sinh"><Vo /></ChanLoi>)
    expect(screen.getByText('Đang tải bản mới của app')).toBeTruthy()
    expect(screen.queryByText(/gặp lỗi/)).toBeNull()
    expect(Number(sessionStorage.getItem('napLaiVìThieuManh'))).toBeGreaterThan(0) // taiLaiMotLan đã chạy (chặn vòng lặp 30 s)
    im.mockRestore()
  })
})
