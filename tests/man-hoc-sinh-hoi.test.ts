// MÀN "HỌC SINH HỎI" — ô riêng ngoài màn chính (thầy chốt 06/09).
//
// Trước đó câu hỏi của em nằm lẫn trong Chi tiết ca: thầy phải nhớ ca nào rồi
// mở đúng ca đó mới thấy. Nay một ô ngoài màn chính là thấy ca nào đang có em
// chờ chữa.
//
// Phép kiểm quan trọng nhất ở đây là THỨ TỰ: ca còn em chưa được chữa phải
// đứng trước, vì đó là việc thầy phải làm hôm nay.
import { describe, expect, it } from 'vitest'
import { gomTheoCa, type CauHoiCuaEm } from '../src/lib/hoi-bai'

function d(maCa: string, sbd: string, qids: string[], guiLuc: string, daChua = false, tenCa = ''): CauHoiCuaEm {
  return { maCa, tenCa, sbd, hoTen: `Em ${sbd}`, qids, ghiChu: '', guiLuc, daChua, chuaLuc: '' }
}

describe('Gom câu hỏi theo ca', () => {
  it('gom đúng số em và số CÂU KHÁC NHAU của từng ca', () => {
    const ra = gomTheoCa([
      d('CA1', '1', ['q1', 'q2'], '2026-09-01T10:00:00Z', false, 'Ester'),
      d('CA1', '2', ['q2', 'q3'], '2026-09-01T10:05:00Z'),
      d('CA2', '1', ['q9'], '2026-09-02T10:00:00Z', false, 'Amine'),
    ])
    const ca1 = ra.find((c) => c.maCa === 'CA1')!
    expect(ca1.soEm).toBe(2)
    // q2 hai em cùng hỏi — đếm MỘT câu, không cộng dồn thành 4.
    expect(ca1.soCau).toBe(3)
    expect(ca1.tenCa).toBe('Ester')
    expect(ra.find((c) => c.maCa === 'CA2')!.soCau).toBe(1)
  })

  it('CA CÒN EM CHƯA CHỮA ĐỨNG TRƯỚC, dù ca đó cũ hơn', () => {
    const ra = gomTheoCa([
      // Ca mới nhất nhưng đã chữa xong.
      d('MOI', '1', ['q1'], '2026-09-05T10:00:00Z', true),
      // Ca cũ nhưng còn em chờ.
      d('CU', '2', ['q2'], '2026-09-01T10:00:00Z', false),
    ])
    expect(ra.map((c) => c.maCa)).toEqual(['CU', 'MOI'])
    expect(ra[0].chuaChua).toBe(1)
    expect(ra[1].chuaChua).toBe(0)
  })

  it('cùng trạng thái thì ca MỚI GỬI GẦN NHẤT đứng trước', () => {
    const ra = gomTheoCa([
      d('A', '1', ['q1'], '2026-09-01T10:00:00Z'),
      d('C', '1', ['q1'], '2026-09-03T10:00:00Z'),
      d('B', '1', ['q1'], '2026-09-02T10:00:00Z'),
    ])
    expect(ra.map((c) => c.maCa)).toEqual(['C', 'B', 'A'])
  })

  it('mốc mới nhất lấy lần gửi SAU CÙNG trong ca, không lấy dòng đầu', () => {
    const ra = gomTheoCa([
      d('CA1', '1', ['q1'], '2026-09-01T10:00:00Z'),
      d('CA1', '2', ['q1'], '2026-09-01T18:30:00Z'),
    ])
    expect(ra[0].moiNhat).toBe('2026-09-01T18:30:00Z')
  })

  it('không có câu hỏi nào thì trả mảng rỗng, không dựng ca ma', () => {
    expect(gomTheoCa([])).toEqual([])
  })
})

describe('Màn dựng đúng cách', () => {
  it('MỘT lệnh gọi cho cả màn, không gọi từng ca một', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const man = readFileSync(resolve(__dirname, '../src/screens/CauHoiScreen.tsx'), 'utf8')
    // Mã ca rỗng = lấy mọi dòng, rồi gom tại máy. Gọi từng ca là ba chục lệnh
    // cho một lần mở màn — đi ngược hẳn việc giảm tải đã làm.
    expect(man).toContain("danhSachCauHoi(u.trim(), m.trim(), '')")
    expect(man).toContain('gomTheoCa(items)')
  })

  it('chi tiết một ca dùng ĐÚNG khối đã thiết kế, không dựng kiểu thứ hai', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const man = readFileSync(resolve(__dirname, '../src/screens/CauHoiScreen.tsx'), 'utf8')
    expect(man).toContain('<KhoiCauHoiEm')
    expect(man).toContain('moSan')
    // Bản đề CÓ đáp án lấy từ máy này, không xin lại máy chủ.
    expect(man).toContain('loadSessionTeacherBank(mo.maCa)')
  })

  it('có ô Học sinh hỏi ở màn chính và ở thanh bên', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const hub = readFileSync(resolve(__dirname, '../src/screens/ExamHubScreen.tsx'), 'utf8')
    expect(hub).toContain('Học sinh hỏi')
    expect(hub).toContain("setScreen('cauhoi')")
    const ben = readFileSync(resolve(__dirname, '../src/components/ThanhBenTrai.tsx'), 'utf8')
    expect(ben).toContain("id: 'cauhoi'")
  })
})
