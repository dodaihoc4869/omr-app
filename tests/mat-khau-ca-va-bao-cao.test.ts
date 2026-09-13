import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { chuHtml } from '../src/lib/html-phieu'
import { chuanHoaBaiMom } from '../src/screens/StudentPortalScreen'

describe('1. Mật khẩu ca thi', () => {
  it('vaoThiMoi gửi cả matKhau và matKhauCa đã trim', () => {
    const file = fs.readFileSync(path.join(__dirname, '../src/lib/may-chu-moi.ts'), 'utf-8')
    expect(file).toContain('matKhau: (danhTinh.matKhau ?? \'\').trim()')
    expect(file).toContain('matKhauCa: (danhTinh.matKhau ?? \'\').trim()')
  })

  it('server/src/index.ts kiểm tra cả b.matKhauCa và b.matKhau không phân biệt hoa thường', () => {
    const file = fs.readFileSync(path.join(__dirname, '../server/src/index.ts'), 'utf-8')
    expect(file).toContain('const nhapMatKhau = String(b.matKhauCa ?? b.matKhau ?? \'\').trim()')
    expect(file).toContain('nhapMatKhau.toLowerCase() !== matKhauCa.toLowerCase()')
  })
})

describe('2. Ẩn bong bóng chat trong màn làm bài thi của học sinh', () => {
  it('ExamTakeScreen không còn chứa BongBongChatHocSinh', () => {
    const file = fs.readFileSync(path.join(__dirname, '../src/screens/ExamTakeScreen.tsx'), 'utf-8')
    expect(file).not.toContain('BongBongChatHocSinh')
  })
})

describe('3. Xử lý HTML khắc phục câu sai không bị [object Object]', () => {
  it('chuHtml không bao giờ in ra [object Object] khi đầu vào là object', () => {
    const obj = { chot: 'Este có nhiệt độ sôi thấp hơn ancol', tungPa: { A: { dung: true } } }
    const out = chuHtml(obj)
    expect(out).not.toContain('[object Object]')
    expect(out).toContain('Este')
  })

  it('chuHtml lọc sạch chuỗi [object Object]', () => {
    expect(chuHtml('[object Object]')).toBe('')
    expect(chuHtml('  [object Object]  ')).toBe('')
  })

  it('chuHtml phân tích chuỗi JSON nếu có', () => {
    const jsonStr = JSON.stringify({ chot: 'Cấu hình electron của Fe là 3d6 4s2' })
    const out = chuHtml(jsonStr)
    expect(out).toContain('Fe')
    expect(out).not.toContain('[object Object]')
  })
})

describe('4. Học sinh bấm vào làm bài của Mom không bị lỗi undefined length', () => {
  it('chuanHoaBaiMom xử lý an toàn dữ liệu từ ParentPortalScreen với key cau hoặc dsCau', () => {
    const rawBaiTuPhuHuynh = {
      id: 'mom_123',
      tieuDe: 'Bài của Mom giao (5 câu)',
      taoLuc: '2026-09-13T16:00:00.000Z',
      cau: [
        { id: 'q1', text: 'Chất nào sau đây là este?', choices: ['HCOOCH3', 'CH3COOH'], dapAn: 'A' },
        { id: 'q2', text: 'Kim loại nào có nhiệt độ nóng chảy cao nhất?', choices: ['W', 'Fe'], dapAn: 'A' },
      ],
    }

    const chuan = chuanHoaBaiMom(rawBaiTuPhuHuynh)
    expect(chuan.dsCau).toBeDefined()
    expect(Array.isArray(chuan.dsCau)).toBe(true)
    expect(chuan.dsCau.length).toBe(2)
    expect(chuan.cau?.length).toBe(2)
    expect(chuan.tieuDe).toContain('Bài của Mom giao')
  })

  it('chuanHoaBaiMom xử lý dữ liệu rỗng mà không bị crash', () => {
    const chuan = chuanHoaBaiMom(null)
    expect(chuan.dsCau).toEqual([])
    expect(chuan.dsCau.length).toBe(0)
  })
})

describe('5. Modal báo cáo học tập ca thi của con cho phụ huynh chuẩn Google', () => {
  it('BaoCaoCaThiPhuHuynhModal tồn tại và không chứa mã màu hex', () => {
    const file = fs.readFileSync(path.join(__dirname, '../src/components/BaoCaoCaThiPhuHuynhModal.tsx'), 'utf-8')
    expect(file).toContain('export default function BaoCaoCaThiPhuHuynhModal')
    expect(file).not.toMatch(/#[0-9a-fA-F]{3,8}/)
  })

  it('ParentPortalScreen đã tích hợp BaoCaoCaThiPhuHuynhModal', () => {
    const file = fs.readFileSync(path.join(__dirname, '../src/screens/ParentPortalScreen.tsx'), 'utf-8')
    expect(file).toContain('<BaoCaoCaThiPhuHuynhModal')
    expect(file).toContain('setCaDangXem(b)')
  })
})
