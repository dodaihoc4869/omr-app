// @vitest-environment node
// Thầy 28/09: "Bỏ A.I Đỗ Đại Học thay bằng Thầy Đỗ Đại Học" — "gộp luôn, đổi cả bên học sinh".
// Khoá: (1) bộ lọc chuThay; (2) thông báo CŨ đã lưu trong student_notice (ghi trước 28/09, không ghi đè dữ liệu thật) hiện ra chữ "Thầy";
// (3) mọi tệp màn HỌC SINH + game + tin máy chủ gửi học sinh không còn "A.I Đỗ Đại Học"/"Bộ não A.I" ngoài chú thích.
// App GIÁO VIÊN giữ "A.I Đỗ Đại Học" (docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md bảng A2).
import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../server/src/game-v2-auth', () => ({ gameIdentity: async () => 'S1' }))

import { chuThay } from '../src/lib/chu-thay'
import { notifications } from '../server/src/notifications'
import { MO_TA_THE } from '../server/src/game-v2-doan-the'
import { TIEU_DE_KHIEN, loiDaMat } from '../server/src/khien-mat'
import { TIEU_DE_LUAT_CAP } from '../server/src/game-v2-hap-thu'
import { taoD1That } from './_d1-that'

const boChuThich = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')
const CU = /A\.I Đỗ Đại Học|Bộ não A\.?I/

describe('chuThay — bộ lọc chung app + máy chủ', () => {
  it('đổi ba kiểu chữ cũ, giữ nguyên chữ khác', () => {
    expect(chuThay('A.I Đỗ Đại Học · Khiên của em')).toBe('Thầy Đỗ Đại Học · Khiên của em')
    expect(chuThay('Bộ não A.I hỗ trợ riêng em Minh Anh đã chọn 5 câu.')).toBe('Thầy Đỗ Đại Học đã chọn 5 câu.')
    expect(chuThay('Bộ não A.I: bớt 2 câu/ngày')).toBe('Thầy Đỗ Đại Học: bớt 2 câu/ngày')
    expect(chuThay('Hôm nay em đúng 8/10 câu.')).toBe('Hôm nay em đúng 8/10 câu.')
  })
})

describe('tin máy chủ gửi học sinh', () => {
  it('tin MỚI: tiêu đề/lời khiên, thần thú, thẻ Đoàn đều là "Thầy Đỗ Đại Học"', () => {
    expect(TIEU_DE_KHIEN).toBe('Thầy Đỗ Đại Học · Khiên của em')
    expect(loiDaMat()).toContain('Thầy Đỗ Đại Học đã trừ 1 khiên của em')
    expect(TIEU_DE_LUAT_CAP).toBe('Thầy Đỗ Đại Học · Thần thú của em')
    expect(MO_TA_THE.loai_phuong_an.moTa).toBe('Thầy Đỗ Đại Học gạch một đáp án sai')
  })

  it('tin CŨ đã lưu (chữ A.I) ⇒ danh sách thông báo của em trả chữ "Thầy"; bảng student_notice KHÔNG bị ghi đè', async () => {
    const d = taoD1That()
    d.sql.prepare('INSERT INTO student_notice (id, sbd, title, body, target, created_at) VALUES (?,?,?,?,?,?)')
      .run('khien|S1|1', 'S1', 'A.I Đỗ Đại Học · Khiên của em', 'Em đã nghỉ 7 ngày liên tiếp nên A.I Đỗ Đại Học đã trừ 1 khiên của em.', 'khien', '2026-09-25T01:00:00.000Z')
    const r = await notifications(d.env, 'list', { token: 'x' }) as { ok: boolean; items: { id: string; title: string; body: string }[] }
    const tin = r.items.find((x) => x.id === 'khien|S1|1')!
    expect(tin.title).toBe('Thầy Đỗ Đại Học · Khiên của em')
    expect(tin.body).toBe('Em đã nghỉ 7 ngày liên tiếp nên Thầy Đỗ Đại Học đã trừ 1 khiên của em.')
    expect((d.sql.prepare("SELECT title FROM student_notice WHERE id = 'khien|S1|1'").get() as { title: string }).title).toBe('A.I Đỗ Đại Học · Khiên của em')
  })
})

describe('khoá nguồn màn học sinh', () => {
  const TEP = [
    'src/screens/StudentPortalScreen.tsx', 'src/screens/ExamTakeScreen.tsx', 'src/screens/PhieuScreen.tsx',
    'src/components/KhoiBaiLuyen.tsx', 'src/components/KhungLoiGiaiGame.tsx', 'src/components/xem-diem/KetQuaSauNop.tsx',
    'src/components/bang-nhiem-vu/TheBoNao.tsx', 'src/components/bang-nhiem-vu/TheThuThachRieng.tsx', 'src/components/InfographicHuongDan.tsx',
    'server/src/khien-mat.ts', 'server/src/game-v2-hap-thu.ts', 'server/src/game-v2-doan-the.ts', 'server/src/ph-giao-them.ts',
  ]
  const game = (thu: string): string[] => readdirSync(thu, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? game(`${thu}/${e.name}`) : /\.tsx?$/.test(e.name) ? [`${thu}/${e.name}`] : [])
  it('không còn "A.I Đỗ Đại Học"/"Bộ não A.I" ngoài chú thích', () => {
    for (const t of [...TEP, ...game('src/game')]) expect(boChuThich(readFileSync(t, 'utf8')), t).not.toMatch(CU)
  })
  it('hướng dẫn ở cổng đăng nhập: không còn "Bài gia đình giao" (phụ huynh không giao bài nữa)', () => {
    expect(readFileSync('src/components/InfographicHuongDan.tsx', 'utf8')).not.toContain('Bài gia đình giao')
  })
  it('thẻ học sinh: lời máy soạn đi qua chuThay', () => {
    expect(readFileSync('src/components/bang-nhiem-vu/TheBoNao.tsx', 'utf8')).toContain('chuThay(loiChinh)')
    expect(readFileSync('src/components/bang-nhiem-vu/TheThuThachRieng.tsx', 'utf8')).toContain('chuThay(thuThach.loiMoi)')
  })
})
