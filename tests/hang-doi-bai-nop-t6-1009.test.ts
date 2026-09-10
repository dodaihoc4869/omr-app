// T6 — BÀI NỘP KHÔNG ĐƯỢC PHÉP MẤT (KHACPHUCTREOHANGLOAT.md).
//
// Hai nửa. Nửa thứ nhất đã có từ trước và phép kiểm này canh cho nó khỏi mất:
// bài được ghi xuống IndexedDB với `pendingSubmit: true` TRƯỚC lượt gọi mạng
// đầu tiên, nên máy chủ chết hay mạng đứt cũng không mất bài.
//
// Nửa thứ hai là chỗ vừa vá. `listPendingAttempts` nằm trong `exam-db.ts` từ
// lâu mà KHÔNG một chỗ nào gọi tới — nghĩa là đường thử lại chỉ sống trong lúc
// màn ca ấy còn mở. Em nộp lúc mất mạng, tắt app, hôm sau mở lại để xem điểm:
// bài nằm im trong hàng đợi mãi mãi, và không ai biết vì màn hình vẫn hiện
// "đã nộp".
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')
const DB = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-db.ts'), 'utf8')

describe('NỬA MỘT — ghi xuống máy TRƯỚC khi gọi mạng', () => {
  it('`saveAttempt` với pendingSubmit chạy TRƯỚC `trySend`', () => {
    const i = MAN.indexOf('submitted: true, submittedAt: new Date().toISOString(), pendingSubmit: true }')
    expect(i).toBeGreaterThan(0)
    const sau = MAN.slice(i, i + 1400)
    const iLuu = sau.indexOf('await saveAttempt(updated)')
    const iGui = sau.indexOf('trySend(updated)')
    expect(iLuu).toBeGreaterThan(0)
    expect(iGui).toBeGreaterThan(iLuu)
  })

  it('hàng đợi đọc được — có hàm lọc `pendingSubmit`', () => {
    expect(DB).toContain('export async function listPendingAttempts()')
    expect(DB).toContain('all.filter((a) => a.pendingSubmit)')
  })
})

describe('NỬA HAI — mở app là quét hàng đợi', () => {
  it('màn làm bài THẬT SỰ gọi `listPendingAttempts` — không để hàm chết', () => {
    expect(MAN).toContain('listPendingAttempts()')
    // và import đàng hoàng, không phải chỉ nhắc trong ghi chú
    expect(MAN).toMatch(/import \{[\s\S]{0,600}listPendingAttempts,[\s\S]{0,600}\} from '\.\.\/lib\/exam-db'/)
  })

  it('quét chạy MỘT LẦN lúc mở, không lặp theo mỗi lần vẽ lại', () => {
    const i = MAN.indexOf('listPendingAttempts()')
    const sau = MAN.slice(i, i + 1800)
    expect(sau).toMatch(/\}, \[\]\)/)
  })

  it('bỏ qua bài của CHÍNH ca đang mở — ca ấy đã có đường thử lại riêng', () => {
    const i = MAN.indexOf('listPendingAttempts()')
    const sau = MAN.slice(i, i + 1600)
    expect(sau).toContain('dang.maCa === bai.maCa && dang.sbd === bai.sbd')
  })

  it('CA ĐÃ KHOÁ ⇒ xoá khỏi hàng đợi, không thử lại tới hết đời', () => {
    const i = MAN.indexOf('listPendingAttempts()')
    const sau = MAN.slice(i, i + 2200)
    expect(sau).toContain("loi.includes('Ca đã khoá')")
    expect(sau).toContain('pendingSubmit: false')
  })

  it('LỖI MẠNG ⇒ GIỮ trong hàng đợi — đây mới là chỗ không được phép sai', () => {
    const i = MAN.indexOf('listPendingAttempts()')
    const sau = MAN.slice(i, i + 2400)
    // Chỉ được xoá khỏi hàng đợi ở đúng HAI chỗ: gửi xong, và ca đã khoá.
    const soLanXoa = (sau.match(/pendingSubmit: false/g) || []).length
    expect(soLanXoa).toBe(2)
  })

  it('IndexedDB bị chặn thì THÔI, không nổ giữa lúc em đang vào thi', () => {
    const i = MAN.indexOf('listPendingAttempts()')
    const sau = MAN.slice(i - 200, i + 400)
    expect(sau).toMatch(/try \{[\s\S]{0,120}listPendingAttempts\(\)[\s\S]{0,80}\} catch \{/)
  })

  it('gửi lại chỉ AN TOÀN vì máy chủ có khoá chống trùng — hai thứ phải cùng tồn tại', () => {
    const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')
    expect(GS).toContain('function nopTrungRoi_(')
    expect(GS).toContain('if (nopTrungRoi_(luotCu, khoaLuotNop))')
  })
})
