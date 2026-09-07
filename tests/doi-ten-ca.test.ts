// ĐỔI TÊN CA THI — thầy báo 07/09: "cho tôi sửa được tên của mỗi ca thi".
//
// Tên ca đi theo ca suốt đời: in trong phiếu gửi phụ huynh, trong bảng điểm,
// trong hồ sơ em. Gõ vội một lần là sai mãi. Ba thứ phải khoá:
//
//   1. Chuỗi thầy gõ được DỌN trước khi xuống ô Sheet — nhất là chuỗi mở đầu
//      bằng `=` `+` `@`, vì ô Sheet nuốt nó thành CÔNG THỨC và tên ca biến mất
//      thành `#NAME?`.
//   2. Gói gửi đi đúng lệnh, đúng ba trường, không kèm gì thừa.
//   3. Màn hình lấy tên MÁY CHỦ TRẢ VỀ mà hiện, không lấy chuỗi vừa gõ.
import { describe, expect, it, vi, afterEach } from 'vitest'
import { chuanTenCa, tenHienCua, TEN_CA_TOI_DA } from '../src/lib/ten-ca'
import { doiTenCa } from '../src/lib/exam-api'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('chuanTenCa — dọn tên trước khi ghi Sheet', () => {
  it('gộp xuống dòng, tab và khoảng trắng thừa', () => {
    expect(chuanTenCa('  2009  -  L1 \n L1  ')).toBe('2009 - L1 L1')
    expect(chuanTenCa('Kiểm tra\tgiữa kì')).toBe('Kiểm tra giữa kì')
  })

  it('CẮT `=` `+` `@` ở đầu — ô Sheet nuốt chuỗi đó thành công thức', () => {
    // Đây là lý do cả hàm này tồn tại: đặt tên "=Ca 1" thì ô TenCa hiện #NAME?
    // và tên ca mất hẳn, không có dấu hiệu gì báo cho thầy.
    expect(chuanTenCa('=Ca 1')).toBe('Ca 1')
    expect(chuanTenCa('+Ca 1')).toBe('Ca 1')
    expect(chuanTenCa('@Ca 1')).toBe('Ca 1')
    expect(chuanTenCa('== Ca 1')).toBe('Ca 1')
    // Dấu `=` ở GIỮA tên là chữ bình thường, không được đụng.
    expect(chuanTenCa('Ca 1 = ôn tập')).toBe('Ca 1 = ôn tập')
  })

  it('cắt còn 80 ký tự, không để lại khoảng trắng cụt ở đuôi', () => {
    const dai = 'A'.repeat(200)
    expect(chuanTenCa(dai)).toHaveLength(TEN_CA_TOI_DA)
    const cutSpace = 'B'.repeat(79) + ' CDE'
    expect(chuanTenCa(cutSpace)).toBe('B'.repeat(79))
  })

  it('tên rỗng là HỢP LỆ — ca quay về gọi theo mã', () => {
    expect(chuanTenCa('')).toBe('')
    expect(chuanTenCa('   ')).toBe('')
    expect(chuanTenCa(null)).toBe('')
    expect(chuanTenCa(undefined)).toBe('')
    expect(tenHienCua('', '248567')).toBe('Ca 248567')
    expect(tenHienCua(null, '248567')).toBe('Ca 248567')
    expect(tenHienCua('  ', '248567')).toBe('Ca 248567')
    expect(tenHienCua('2009 - L1', '248567')).toBe('2009 - L1')
  })

  it('giữ nguyên dấu tiếng Việt', () => {
    expect(chuanTenCa('Kiểm tra Hoá 12 — đợt 1')).toBe('Kiểm tra Hoá 12 — đợt 1')
  })
})

describe('doiTenCa — lệnh gửi máy chủ', () => {
  function gia(tra: unknown) {
    const goi = vi.fn(async () => ({ ok: true, json: async () => tra }))
    vi.stubGlobal('fetch', goi)
    return goi
  }

  it('gửi đúng lệnh, đúng bốn trường, và tên đã dọn sẵn', async () => {
    const goi = gia({ ok: true, maCa: '248567', tenCa: 'Ca 1' })
    await doiTenCa('https://x', 'MAT', '248567', '  =Ca   1 \n')
    const b = JSON.parse((goi.mock.calls[0][1] as { body: string }).body)
    expect(b).toEqual({ action: 'doiTenCa', secret: 'MAT', maCa: '248567', tenCa: 'Ca 1' })
  })

  it('lấy tên MÁY CHỦ trả về, không lấy chuỗi vừa gõ', async () => {
    // Máy chủ chuẩn hoá lần cuối. Nếu màn hình tin chuỗi của mình thì thầy nhìn
    // thấy một tên còn ô Sheet giữ một tên khác.
    gia({ ok: true, tenCa: 'MAY CHU DAT LAI' })
    const kq = await doiTenCa('https://x', 'MAT', '248567', 'thầy gõ cái này')
    expect(kq.tenCa).toBe('MAY CHU DAT LAI')
  })

  it('máy chủ không trả tenCa thì hiểu là tên rỗng, không trả undefined', async () => {
    gia({ ok: true })
    expect((await doiTenCa('https://x', 'MAT', '248567', '')).tenCa).toBe('')
  })

  it('sai mã bí mật hoặc không có ca thì ném đúng câu của máy chủ', async () => {
    gia({ ok: false, error: 'Sai mã bí mật' })
    await expect(doiTenCa('https://x', 'SAI', '248567', 'A')).rejects.toThrow(/Sai mã bí mật/)
    gia({ ok: false, error: 'Không có ca 999999' })
    await expect(doiTenCa('https://x', 'MAT', '999999', 'A')).rejects.toThrow(/Không có ca 999999/)
  })
})

describe('máy chủ dọn tên bằng ĐÚNG luật của máy khách', () => {
  // `doiTenCa` trong Apps Script chép lại luật của `chuanTenCa`. Chép tay thì
  // sớm muộn cũng lệch, nên đọc thẳng đoạn mã .gs ra mà chạy thử.
  it('cùng đầu vào ⇒ cùng đầu ra', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const src = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')
    const doan = src.slice(src.indexOf("if (action === 'doiTenCa')"))
    expect(doan).toContain("replace(/^[=+@]+\\s*/, '')")
    expect(doan).toContain('slice(0, 80)')
    expect(doan).toContain('getRange(caRowDT, 11)') // cột TenCa
    expect(doan).toContain('kiemTraMaBiMat_(body)') // lệnh của thầy, phải có mã bí mật

    // Chạy đúng đoạn dọn chuỗi của máy chủ trên vài ca thật.
    const mayChu = (v: unknown) => {
      let t = String(v == null ? '' : v)
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^\s+|\s+$/g, '')
      t = t.replace(/^[=+@]+\s*/, '').replace(/^\s+|\s+$/g, '')
      if (t.length > 80) t = t.slice(0, 80).replace(/\s+$/, '')
      return t
    }
    for (const v of ['=Ca 1', '  2009  -  L1 \n L1  ', '', '   ', 'A'.repeat(200), 'B'.repeat(79) + ' CDE', 'Ca 1 = ôn tập', 'Kiểm tra Hoá 12 — đợt 1']) {
      expect(mayChu(v)).toBe(chuanTenCa(v))
    }
  })
})
