// BA VIỆC THẦY GIAO 14/09 LƯỢT 2.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { dungHtmlDeVaLoiGiai } from '../src/lib/de-loi-giai-cua-em'
import type { KeyBank, ChiTietCauRow } from '../src/lib/exam-api'

const doc = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')

const BANK = {
  phanI: [
    { id: 'q1', text: 'Nguyên tử X có Z = 11. Cấu hình electron của X là', choices: ['1s2 2s2 2p6', '1s2 2s2 2p6 3s1', '1s2 2s2 2p5', '1s2 2s1'], correct: 'B', chuyenDe: 'Cấu tạo nguyên tử' },
    { id: 'q2', text: 'Số proton của Na là', choices: ['10', '11', '12', '13'], correct: 'B', chuyenDe: 'Cấu tạo nguyên tử' },
  ],
  phanII: [],
  phanIII: [],
  soCau: { I: 2, II: 0, III: 0 },
} as unknown as KeyBank

const ROWS: ChiTietCauRow[] = [
  { qid: 'q1', soCau: 1, phan: 'I', chuyenDe: 'Cấu tạo nguyên tử', mucDo: 'biet', dapAnChon: 'A', dapAnDung: 'B', dungSai: false, giay: 0 },
  { qid: 'q2', soCau: 2, phan: 'I', chuyenDe: 'Cấu tạo nguyên tử', mucDo: 'biet', dapAnChon: 'B', dapAnDung: 'B', dungSai: true, giay: 0 },
] as unknown as ChiTietCauRow[]

describe('1. Xem đề và lời giải — là TỜ ĐỀ, không phải phiếu khắc phục', () => {
  const html = dungHtmlDeVaLoiGiai(BANK, '814335', '12121212', 'Đỗ Đại Học', 'Test4', ROWS)

  it('dựng được phiếu và có đủ cả hai câu', () => {
    expect(html.length).toBeGreaterThan(200)
    expect(html).toContain('Cấu hình electron')
    expect(html).toContain('Số proton của Na')
  })

  it('KHÔNG còn một chữ "khắc phục" nào trên tờ đề', () => {
    // Đo trên phần THÂN trang, bỏ khối <style> — ghi chú trong CSS không phải
    // chữ em đọc thấy.
    const than = html.slice(html.indexOf('<body')).replace(/<style[\s\S]*?<\/style>/g, '')
    expect(than).not.toContain('Khắc phục lỗi sai')
    expect(than).not.toContain('khắc phục')
    expect(than).not.toContain('Phiếu này khắc phục lỗi nào')
  })

  it('câu em sai mang nhãn "Em làm sai câu N phần P" kèm đáp án em đã chọn', () => {
    expect(html).toContain('Em làm sai câu 1 phần I')
    expect(html).toContain('sai-cua-em')
    expect(html).toContain('Em chọn A')
    expect(html).toContain('đáp án đúng B')
  })

  it('câu em làm ĐÚNG không bị dán nhãn sai', () => {
    expect(html).not.toContain('Em làm sai câu 2 phần I')
  })

  it('bìa nói đúng đây là đề và lời giải', () => {
    expect(html).toContain('ĐỀ VÀ LỜI GIẢI')
  })
})

describe('2. Đếm câu — không app nào được tự trừ ngược nữa', () => {
  const nguon = [
    'src/screens/StudentPortalScreen.tsx',
    'src/screens/ParentPortalScreen.tsx',
    'src/components/BaoCaoCaThiHocSinhModal.tsx',
    'src/components/BaoCaoCaThiPhuHuynhModal.tsx',
  ]

  it('cả ba app dùng CHUNG một khuôn DongDemCau', () => {
    for (const f of nguon) expect(doc(f)).toContain('DongDemCau')
  })

  it('không còn công thức "tongCau - soCauDung" ở bất kỳ app nào', () => {
    for (const f of nguon) {
      const t = doc(f)
      expect(t, f).not.toMatch(/tongCau\s*-\s*\(?\s*item\.soCauDung/)
      expect(t, f).not.toMatch(/tongSoCau\s*-\s*b\.soCauDung/)
      expect(t, f).not.toMatch(/Math\.max\(0,\s*tongCau\s*-\s*soDung\)/)
    }
  })

  it('máy chủ KHÔNG còn gộp câu bỏ trống vào câu sai', () => {
    const t = doc('server/src/goi-cu.ts')
    // Chỉ soi CÂU TRUY VẤN, không soi ghi chú giải thích lỗi cũ.
    const sql = t.replace(/^\s*\/\/.*$/gm, '')
    expect(sql).not.toContain('COALESCE(dung_sai, 0) = 0')
    expect(sql).toContain('dung_sai IS NULL')
    expect(sql).toContain('mot_phan')
    expect(sql).toContain('y_dung')
  })

  it('bộ chấm trả về số Ý đúng của từng câu phần II', () => {
    const t = doc('src/engine/score.ts')
    expect(t).toContain('yDung?: number')
    expect(t).toContain('yDung: hasDoubleMark ? 0 : correctIdeas')
  })
})

describe('3. Vào thi — thẳng vào phòng chờ, không qua cửa hỏi lại tên', () => {
  const portal = doc('src/screens/StudentPortalScreen.tsx')
  const thi = doc('src/screens/ExamTakeScreen.tsx')

  it('cổng học sinh trao danh tính bằng THAM SỐ, không nhét vào thanh địa chỉ', () => {
    expect(portal).toContain('setBoVaoThi(')
    expect(portal).toContain('tuCong={boVaoThi ?? undefined}')
    // Dữ liệu cá nhân không được lên URL, và mã ca cũng không cần lên nữa.
    expect(portal).not.toContain("u.searchParams.set('examCode'")
    expect(portal).not.toContain("u.searchParams.set('sbd'")
    expect(portal).not.toContain("u.searchParams.set('matKhau'")
  })

  it('màn làm bài nhận tham số và tự bấm vào thi', () => {
    expect(thi).toContain('export interface TuCongHocSinh')
    expect(thi).toContain('ExamTakeScreen({ tuCong }')
    expect(thi).toContain('daTuVaoRef')
    expect(thi).toContain('void handleJoin()')
    // Coi như đã xác nhận danh tính — cổng vừa xác thực bằng mật khẩu riêng.
    expect(thi).toContain('setXacNhan({ sbd: tuCong.sbd')
  })

  it('vẫn còn chốt máy chủ: `vaoThi` luôn gửi kèm tên và năm sinh để đối chiếu danh sách lớp', () => {
    expect(thi).toContain('hoTen: ten, namSinh: nam, xacNhanTen: xacNhan !== null')
  })

  it('có nút đóng để em quay về cổng học sinh', () => {
    expect(portal).toContain('Đóng phòng thi, về cổng học sinh')
  })
})
