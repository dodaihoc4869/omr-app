// @vitest-environment node
// MÁY TÍNH «Đỗ Đại Học FX4869» (thầy duyệt bản vẽ 31–34 ngày 12/11: «chốt build toàn bộ chức năng») — đối chiếu KẾT QUẢ từng dãy phím.
// Mỗi con số mong đợi đã tính tay / đối chiếu máy cầm tay; sai một chữ số là đỏ.
import { describe, expect, it } from 'vitest'
import { bam, chuKq, manHinh, taoMay, type TrangThai } from '../src/lib/may-tinh/may'

const go = (day: string, tu: TrangThai = taoMay()): TrangThai => day.split(/\s+/).filter(Boolean).reduce(bam, tu)
const kq = (day: string, tu?: TrangThai): string => { const m = manHinh(go(day, tu)); return m.loi ? `LỖI:${m.loi}` : chuKq(m.kq) }

describe('FX4869 — tính toán', () => {
  it.each([
    ['5 phay 6 ps 5 6 R nhan 2 4 phay 7 9 bang', '2,479'], // 5,6/56 × 24,79 (ví dụ trong bản vẽ)
    ['1 chia 3 bang', '1/3'],
    ['1 chia 3 bang sd', '0,3333333333'],
    ['1 chia 3 bang sd sd', '1/3'],
    ['1 chia 3 SHIFT bang', '0,3333333333'],
    ['2 mu 1 0 R bang', '1024'],
    ['2 mu 1 0 0 R bang', '1,2676506E30'],
    ['can 2 bang', '1,414213562'],
    ['can 1 6 bang', '4'],
    ['SHIFT can 2 7 bang', '3'],
    ['SHIFT mu 4 R 8 1 bang', '3'], // căn bậc 4 của 81
    ['am 2 binh bang', '-4'],
    ['mo am 2 dong binh bang', '4'],
    ['2 SHIFT binh bang', '8'],
    ['4 inv bang', '1/4'],
    ['sin 3 0 bang', '1/2'],
    ['sin 4 5 bang', '0,7071067812'],
    ['cos 9 0 bang', '0'],
    ['cos 6 0 bang', '1/2'],
    ['tan 4 5 bang', '1'],
    ['tan 9 0 bang', 'LỖI:toan'],
    ['SHIFT sin 0 phay 5 bang', '30'],
    ['SHIFT tan 1 bang', '45'],
    ['log 1 0 0 0 bang', '3'],
    ['log 2 bang', '0,3010299957'],
    ['ln ALPHA eng bang', '1'],
    ['SHIFT log am 3 R bang', '1/1000'],
    ['SHIFT ln 1 R bang', '2,718281828'],
    ['6 phay 0 2 e10 2 3 nhan 0 phay 5 bang', '3,01E23'],
    ['1 phay 6 e10 am 1 9 nhan 2 bang', '3,2E-19'],
    ['1 chia 2 0 0 bang', '1/200'],
    ['1 chia 2 0 0 bang sd', '0,005'],
    ['7 SHIFT inv bang', '5040'],
    ['6 9 SHIFT inv bang', '1,711224524E98'],
    ['7 0 SHIFT inv bang', 'LỖI:toan'],
    ['5 SHIFT dms 2 bang', '10'], // 5C2
    ['5 SHIFT am 2 bang', '20'], // 5P2
    ['1 chia 0 bang', 'LỖI:toan'],
    ['nhan bang', 'LỖI:cu-phap'],
    ['2 cong bang', 'LỖI:cu-phap'],
    ['2 SHIFT eng bang', '6,283185307'], // 2π
    ['1 chia 2 SHIFT eng bang', '0,1591549431'], // nhân ngầm ưu tiên hơn ÷ : 1 ÷ (2π)
    ['2 mo 3 cong 4 dong bang', '14'],
    ['SHIFT ps 1 R 1 R 2 bang', '3/2'],
    ['SHIFT ps 1 R 1 R 2 bang SHIFT sd', '1 1/2'],
    ['8 mu 2 ps 3 R R bang', '4'],
    ['mo am 8 dong mu 1 ps 3 R R bang', '-2'],
    ['2 mu 0 phay 5 R bang', '1,414213562'],
    ['0 phay 1 cong 0 phay 2 bang', '0,3'],
    ['1 0 0 SHIFT mo bang', '1'], // 100 %
    ['1 2 3 DEL bang', '12'],
    ['1 3 L 2 bang', '123'],
    ['1 2 3 4 5 bang eng', '12,345E3'],
    ['9 9 mu 9 9 R bang', 'LỖI:toan'],
    ['1 dms 3 0 dms bang', '3/2'],
    ['2 cong 3 bang nhan 4 bang', '20'], // nối tiếp từ Ans
    ['2 cong 3 bang bang', '5'],
    ['3 sto am ALPHA am binh bang', '9'], // 3 → A; A² = 9
    ['5 mc 3 mc ALPHA mc bang', '8'], // M+ hai lần
    ['5 mc 3 SHIFT mc ALPHA mc bang', '2'], // M−
    ['7 sto sin AC SHIFT sto sin', '7'], // RCL C
    ['1 2 chia 5 bang', '12/5'],
    ['1 2 chia 5 bang SHIFT sd', '2 2/5'],
    ['1 2 3 4 5 6 7 nhan 1 2 3 4 5 6 7 bang', '1,524155677E12'],
    ['0 phay 0 0 0 0 1 2 3 bang', '0,0000123'],
    ['2 9 phay 7 5 chia 2 4 phay 7 9 bang', '1,200080678'],
    ['SHIFT dong am 5 dong bang', '5'], // Abs
  ])('%s ⇒ %s', (day, mong) => { expect(kq(day)).toBe(mong) })

  it('cài đặt: Fix 2, radian, số nhỏ kiểu ×10ⁿ', () => {
    expect(kq('MENU 6 3 2 2 chia 3 bang sd')).toBe('0,67')
    expect(kq('MENU 6 3 2 1 phay 0 0 5 nhan 1 bang')).toBe('1,01') // làm tròn nửa lên đúng (không dính sai số nhị phân)
    expect(kq('MENU 6 3 2 MENU 6 4 2 chia 3 bang sd')).toBe('0,6666666667')
    expect(kq('MENU 6 2 sin SHIFT eng chia 6 dong bang')).toBe('0,5')
    expect(kq('MENU 6 2 sin SHIFT eng dong bang')).toBe('0')
    expect(kq('MENU 6 6 1 chia 2 0 0 bang sd')).toBe('5E-3')
    expect(manHinh(go('MENU 6 2')).den).toContain('R')
  })
  it('đèn báo, con trỏ, Ans ở góc phải', () => {
    expect(manHinh(go('SHIFT')).den).toContain('S')
    expect(manHinh(go('SHIFT SHIFT')).den).not.toContain('S')
    expect(manHinh(go('ALPHA')).den).toContain('A')
    expect(manHinh(go('sto')).den).toContain('STO')
    expect(manHinh(go('5 mc')).den).toEqual(expect.arrayContaining(['M', 'M+']))
    const m = manHinh(go('1 chia 4 bang 2'))
    expect(m.phai).toBe('Ans = 0,25')
    expect(m.bt).toEqual(['2'])
    expect(m.ct).toBe(1)
    expect(manHinh(go('1 cong 1 bang')).ct).toBe(-1)
  })
  it('phân số: số đứng trước thành tử; DEL gỡ khung giữ nội dung; ▲ gọi lại phép tính cũ', () => {
    expect(go('1 2 ps').bt).toEqual(['ps{', '1', '2', '|', '}'])
    expect(go('ps').bt).toEqual(['ps{', '|', '}'])
    expect(go('ps').ct).toBe(1)
    expect(go('ps 1 R 2 L L L DEL').bt).toEqual(['1', '2'])
    expect(kq('1 cong 1 bang 5 nhan 5 bang U bang')).toBe('2')
    expect(go('ON').bt).toEqual([])
  })
})

describe('FX4869 — MENU', () => {
  const dong = (t: TrangThai): string[] => { const ra: string[] = []; let s = t; for (let k = 0; k < s.ra.length; k += 1) { const m = manHinh(s); ra.push(`${m.nhan} ${chuKq(m.kq)}`.trim()); s = bam(s, 'bang') } return ra }
  it('phương trình bậc hai: nghiệm hữu tỉ ra phân số, nghiệm vô tỉ ra số thập phân, nghiệm phức ra a ± bi', () => {
    expect(dong(go('MENU 2 2 1 bang am 3 bang 2 bang'))).toEqual(['x₁ = 2', 'x₂ = 1'])
    expect(dong(go('MENU 2 2 2 bang am 3 bang 1 bang'))).toEqual(['x₁ = 1', 'x₂ = 1/2'])
    expect(dong(go('MENU 2 2 1 bang am 2 bang 1 bang'))).toEqual(['x = 1'])
    expect(dong(go('MENU 2 2 1 bang 0 bang am 2 bang'))).toEqual(['x₁ = 1,414213562', 'x₂ = -1,414213562'])
    expect(dong(go('MENU 2 2 1 bang 1 bang 1 bang'))).toEqual(['x₁ = -0,5 + 0,8660254038i', 'x₂ = -0,5 − 0,8660254038i'])
    expect(dong(go('MENU 2 2 1 bang 0 bang 4 bang'))).toEqual(['x₁ = 2i', 'x₂ = -2i'])
    expect(manHinh(go('MENU 2 2 0 bang 1 bang 1 bang')).loi).toBe('toan')
  })
  it('phương trình bậc ba, bậc bốn', () => {
    expect(dong(go('MENU 2 3 1 bang am 6 bang 1 1 bang am 6 bang'))).toEqual(['x₁ = 3', 'x₂ = 2', 'x₃ = 1'])
    expect(dong(go('MENU 2 3 1 bang am 3 bang 3 bang am 1 bang'))).toEqual(['x = 1'])
    expect(dong(go('MENU 2 3 2 bang am 1 bang am 2 bang 1 bang'))).toEqual(['x₁ = 1', 'x₂ = 1/2', 'x₃ = -1'])
    expect(dong(go('MENU 2 3 1 bang 0 bang 0 bang am 2 bang'))).toEqual(['x₁ = 1,25992105', 'x₂ = -0,6299605249 + 1,091123636i', 'x₃ = -0,6299605249 − 1,091123636i'])
    expect(dong(go('MENU 2 4 1 bang am 4 bang 6 bang am 4 bang 1 bang'))).toEqual(['x = 1']) // (x − 1)⁴
    expect(dong(go('MENU 2 3 1 bang am 1 bang am 2 bang 2 bang'))).toEqual(['x₁ = 1,414213562', 'x₂ = 1', 'x₃ = -1,414213562']) // (x − 1)(x² − 2)
    expect(dong(go('MENU 2 4 1 bang 0 bang am 5 bang 0 bang 4 bang'))).toEqual(['x₁ = 2', 'x₂ = 1', 'x₃ = -1', 'x₄ = -2'])
    expect(dong(go('MENU 2 4 1 bang 0 bang 0 bang 0 bang am 4 bang'))).toEqual(['x₁ = 1,414213562', 'x₂ = -1,414213562', 'x₃ = 1,414213562i', 'x₄ = -1,414213562i'])
  })
  it('hệ phương trình', () => {
    expect(dong(go('MENU 3 2 1 bang 1 bang 3 bang 1 bang am 1 bang 1 bang'))).toEqual(['x = 2', 'y = 1'])
    expect(dong(go('MENU 3 2 2 bang 3 bang 1 bang 4 bang 9 bang 5 bang'))).toEqual(['x = -1', 'y = 1'])
    expect(dong(go('MENU 3 2 1 bang 1 bang 1 bang 1 bang 1 bang 2 bang'))).toEqual(['Vô nghiệm'])
    expect(dong(go('MENU 3 2 1 bang 1 bang 1 bang 2 bang 2 bang 2 bang'))).toEqual(['Vô số nghiệm'])
    // x + y + z = 6 ; 2x − y + z = 3 ; x + 2y − z = 2 ⇒ (1 ; 2 ; 3)
    expect(dong(go('MENU 3 3 1 bang 1 bang 1 bang 6 bang 2 bang am 1 bang 1 bang 3 bang 1 bang 2 bang am 1 bang 2 bang'))).toEqual(['x = 1', 'y = 2', 'z = 3'])
    expect(manHinh(go('MENU 3 2 1 bang')).nhan).toBe('b₁ =')
  })
  it('bảng giá trị và thống kê', () => {
    expect(dong(go('MENU 4 ALPHA mo binh bang 1 bang 3 bang 1 bang'))).toEqual(['f(1) = 1', 'f(2) = 4', 'f(3) = 9'])
    expect(dong(go('MENU 4 1 chia ALPHA mo bang 0 bang 1 bang 0 phay 5 bang'))).toEqual(['f(0) = Lỗi toán học', 'f(0,5) = 2', 'f(1) = 1'])
    expect(dong(go('MENU 5 1 bang 2 bang 3 bang 4 bang bang'))).toEqual(['n = 4', 'x̄ = 5/2', 'Σx = 10', 'Σx² = 30', 'σx = 1,118033989', 'sx = 1,290994449', 'min = 1', 'Med = 5/2', 'max = 4'])
    expect(manHinh(go('MENU')).ds.length).toBe(6)
    expect(go('MENU 2 AC').man).toBe('menu')
    expect(go('MENU AC').man).toBe('tinh')
  })
})
