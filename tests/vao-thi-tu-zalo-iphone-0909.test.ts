// IPHONE MỞ LINK TỪ ZALO THÌ KHÔNG BẤM ĐƯỢC "VÀO THI" — thầy chụp 17:34 09/09,
// giữa lúc ca 522123 đang mở.
//
// Ảnh cho thấy đủ ba dấu hiệu: góc trên trái ghi "◄ Zalo" (đang ở trình duyệt
// NHÚNG của Zalo, không phải Safari), khối cam ghi "Chỉ vào thi được khi app ở
// toàn màn hình. Thêm app vào màn hình chính (hướng dẫn ở trên) rồi mở lại từ
// đó", và nút "Vào thi" xám.
//
// NGUYÊN NHÂN GỐC — ba cái cộng lại thành bế tắc KHÔNG CÓ LỐI RA:
//   1. trình duyệt nhúng không phải standalone ⇒ `dangToanManHinh()` sai;
//   2. iOS không cho phần tử vào toàn màn hình ⇒ `coTheBatToanManHinh()` sai,
//      nên không có nút nào để bấm;
//   3. Zalo KHÔNG có mục "Thêm vào Màn hình chính" ⇒ làm đúng theo dòng chữ app
//      đang hiện cũng không ra.
// Em nhận link qua Zalo rồi bấm thẳng vào — đường đi tự nhiên nhất — và mất bài
// thi vì một quy tắc chống gian lận, trong khi gian lận thì không hề xảy ra.
//
// SỬA: toàn màn hình là KHUYÊN, không phải CỬA. Nút không còn bị khoá; dòng
// hướng dẫn nói đúng việc LÀM ĐƯỢC ở đúng chỗ em đang đứng; và em vào ngoài
// toàn màn hình thì máy ghi một dấu vào nhật ký để thầy đọc.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { loiKhuyenToanManHinh } from '../src/screens/ExamTakeScreen'

const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')

describe('nút Vào thi KHÔNG còn bị khoá vì toàn màn hình', () => {
  it('nút chỉ khoá khi đang tra số báo danh — không khoá vì toàn màn hình', () => {
    expect(MAN).toContain('<NutChinh onClick={() => void traTenRoiHoi()} disabled={dangTraTen}>')
    expect(MAN).not.toContain('disabled={!toanManHinh || dangTraTen}')
  })

  it('gõ Enter cũng vào được — gỡ một đường mà quên đường kia là lệch', () => {
    const dau = MAN.indexOf("if (e.key !== 'Enter') return")
    expect(dau).toBeGreaterThan(0)
    const than = MAN.slice(dau, dau + 120)
    expect(than).toContain('if (laXemDiem || dangTraTen) return')
    expect(than).not.toContain('!toanManHinh')
  })

  it('ô nhắc đổi từ CHẶN sang KHUYÊN', () => {
    expect(MAN).toContain('Nên để app ở <b>toàn màn hình</b> khi làm bài.')
    expect(MAN).not.toContain('Chỉ vào thi được khi app ở <b>toàn màn hình</b>')
  })

  it('ô nhắc vẫn hiện khi chưa toàn màn hình — bỏ chặn không phải bỏ nhắc', () => {
    expect(MAN).toContain('{!laXemDiem && !toanManHinh && (')
  })
})

describe('lời khuyên phải nói việc LÀM ĐƯỢC ở đúng chỗ em đang đứng', () => {
  it('máy bật được toàn màn hình (Android/Chrome) ⇒ chỉ vào nút', () => {
    const t = loiKhuyenToanManHinh(true, false, false)
    expect(t).toContain('Bấm nút dưới')
    expect(t).not.toContain('Safari')
  })

  it('TÁI HIỆN ẢNH THẦY GỬI: iPhone trong Zalo ⇒ bảo mở bằng Safari TRƯỚC', () => {
    const t = loiKhuyenToanManHinh(false, true, true)
    expect(t).toContain('Mở trong Safari')
    expect(t).toContain('Thêm vào Màn hình chính')
    // Thứ tự phải đúng: Safari trước, thêm vào màn hình chính sau. Nói ngược là
    // lại chỉ em làm một việc không có ở nơi em đang đứng.
    expect(t.indexOf('Safari')).toBeLessThan(t.indexOf('Thêm vào Màn hình chính'))
  })

  it('iPhone trong Safari thường ⇒ chỉ thẳng nút Chia sẻ, không nhắc Safari nữa', () => {
    const t = loiKhuyenToanManHinh(false, false, true)
    expect(t).toContain('Chia sẻ')
    expect(t).toContain('Thêm vào Màn hình chính')
    expect(t).not.toContain('Mở trong Safari')
  })

  it('máy khác ⇒ vẫn còn đường lùi, không rơi ra chuỗi rỗng', () => {
    const t = loiKhuyenToanManHinh(false, false, false)
    expect(t.length).toBeGreaterThan(20)
  })

  it('không lời khuyên nào là chuỗi rỗng — em luôn có việc để làm', () => {
    for (const a of [true, false]) for (const b of [true, false]) for (const c of [true, false]) {
      expect(loiKhuyenToanManHinh(a, b, c).trim().length).toBeGreaterThan(10)
    }
  })
})

describe('nhận dạng trình duyệt nhúng — chỉ đổi CHỮ, không đổi quyền vào thi', () => {
  /** Chạy đúng hàm trong tệp màn, không chép lại luật. */
  function laTrongUngDung(ua: string): boolean {
    const dau = MAN.indexOf('function laTrinhDuyetTrongUngDung(')
    expect(dau).toBeGreaterThan(0)
    const than = MAN.slice(dau, MAN.indexOf('\n}', dau) + 2)
    const ma = than.replace('function laTrinhDuyetTrongUngDung(nav: Navigator = navigator): boolean', 'function f(nav)').replace(/: \w+/g, '')
    return new Function(`${ma}; return f`)()({ userAgent: ua })
  }

  it('bắt được Zalo — đúng cái trong ảnh', () => {
    expect(laTrongUngDung('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 Zalo/23.09.01')).toBe(true)
  })

  it('bắt được Messenger và Facebook', () => {
    expect(laTrongUngDung('Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/430.0]')).toBe(true)
    expect(laTrongUngDung('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 FB_IAB/FB4A')).toBe(true)
  })

  it('KHÔNG bắt nhầm Safari và Chrome thường', () => {
    expect(laTrongUngDung('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1')).toBe(false)
    expect(laTrongUngDung('Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 Chrome/119 Mobile Safari/537.36')).toBe(false)
  })

  it('user agent rỗng hay rác thì trả false, không nổ', () => {
    for (const ua of ['', 'linh tinh', 'null']) expect(laTrongUngDung(ua)).toBe(false)
  })
})

describe('KHÔNG LẶNG LẼ: vào ngoài toàn màn hình thì máy ghi lại', () => {
  it('lượt mới mang dấu vao_ngoai_toan_man khi chưa toàn màn hình', () => {
    expect(MAN).toContain("events: [{ type: 'vao_ngoai_toan_man', at: new Date().toISOString() }]")
    expect(MAN).toContain('integrity: dangToanManHinh()')
  })

  it('toàn màn hình thì nhật ký sạch — không đẻ dấu vô cớ', () => {
    const dau = MAN.indexOf('integrity: dangToanManHinh()')
    const than = MAN.slice(dau, dau + 220)
    expect(than).toContain('? emptyIntegrityLog()')
  })

  it('dấu này KHÔNG bị tính là rời màn — em không bị khoá oan', async () => {
    const { mocRoiMan } = await import('../src/lib/chong-gian-lan')
    const moc = mocRoiMan([{ type: 'vao_ngoai_toan_man', at: '2026-09-09T10:34:00.000Z' }])
    expect(moc).toEqual([])
  })
})
