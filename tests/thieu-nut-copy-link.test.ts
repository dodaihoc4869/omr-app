// BÁO CÁO THIẾU HAI NÚT COPY LINK — thầy báo 06/09, lần thứ hai.
//
// TRIỆU CHỨNG: mở báo cáo TRONG APP thì thấy hai nút "Copy link gửi ĐỀ" và
// "Copy link gửi LỜI GIẢI"; bấm chính link đó từ Zalo thì mất hai nút, mà khối
// bài luyện (thanh kéo, nút "Xem trước N câu") vẫn còn.
//
// CHẨN ĐOÁN: hai nút chỉ phụ thuộc `du.linkBaiTap` (PhieuScreen). Bản trên máy
// chủ có `baiTap` mà không có `linkBaiTap` — `dungPhieu` tự dựng `baiTap` từ
// kho, còn `linkBaiTap` phải gắn riêng sau khi cất được phiếu bài tập. Chỉ MỘT
// chỗ trong code đẻ ra được đúng trạng thái lệch đó: khối `try/catch` ở
// `PhieuZaloEm` bắt lỗi cất phiếu rồi bỏ qua im lặng.
//
// Test này khoá hai điều: không nuốt lỗi nữa, và thầy được báo.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const goc = resolve(__dirname, '..')
const doc = (f: string) => readFileSync(resolve(goc, f), 'utf8')

describe('không gửi lặng lẽ một báo cáo thiếu nút', () => {
  const zalo = doc('src/components/PhieuZaloEm.tsx')

  it('1. khối cất phiếu bài tập KHÔNG còn catch rỗng', () => {
    const dau = zalo.indexOf('const dsBaiTap = phieu.baiTap')
    const cuoi = zalo.indexOf('const { phieu: goiGui } = giamGoiPhieu(phieu)')
    expect(dau).toBeGreaterThan(0)
    expect(cuoi).toBeGreaterThan(dau)
    const than = zalo.slice(dau, cuoi)
    // catch rỗng là đúng cái đã giấu lỗi này suốt hai vòng báo lỗi
    expect(than).not.toMatch(/catch\s*\{\s*(\/\/[^\n]*\n\s*)*\}/)
    expect(than).toContain('setThieuNutBaiTap(true)')
  })

  it('2. có thử lại một nhịp trước khi chịu thua', () => {
    const dau = zalo.indexOf('const dsBaiTap = phieu.baiTap')
    const cuoi = zalo.indexOf('const { phieu: goiGui } = giamGoiPhieu(phieu)')
    const than = zalo.slice(dau, cuoi)
    expect(than.split('await catPhieuBaiTap()').length - 1).toBe(2)
  })

  it('3. cất được thì cờ phải tắt, không để cảnh báo ma nằm lại', () => {
    expect(zalo).toContain('if (con && phieu.linkBaiTap) setThieuNutBaiTap(false)')
  })

  it('4. màn hình NÓI RA, và nói đúng thứ bị thiếu', () => {
    expect(zalo).toContain('{link && thieuNutBaiTap && (')
    const dau = zalo.indexOf('{link && thieuNutBaiTap && (')
    const doan = zalo.slice(dau, dau + 700)
    expect(doan).toContain('thiếu hai nút copy link đề và lời giải')
    // phải chỉ ra việc cần làm, không chỉ than
    expect(doan).toContain('Dựng lại')
  })

  it('5. link vẫn gắn TRƯỚC khi gói phiếu kết quả — thứ tự này là cả lỗi cũ', () => {
    // Gói xong mới gắn link thì bản lên máy chủ vĩnh viễn thiếu trường.
    const gan = zalo.indexOf('phieu.linkBaiTap = btRef.current?.link')
    const goi = zalo.indexOf('const { phieu: goiGui } = giamGoiPhieu(phieu)')
    expect(gan).toBeGreaterThan(0)
    expect(goi).toBeGreaterThan(gan)
  })

  it('6. lõi dựng phiếu cả ca cũng giữ đúng thứ tự đó', () => {
    const ca = doc('src/lib/phieu-ca-ca.ts')
    const gan = ca.indexOf('phieu.linkBaiTap = taoLinkPhieu(goc, maBt)')
    const goi = ca.indexOf('const { phieu: goiGui } = giamGoiPhieu(phieu)')
    expect(gan).toBeGreaterThan(0)
    expect(goi).toBeGreaterThan(gan)
  })

  it('7. hai nút trong báo cáo vẫn chỉ phụ thuộc đúng linkBaiTap', () => {
    // Nếu ai đó thêm điều kiện khác (clipboard, vai người xem) thì lỗi "trong
    // app có, ngoài Zalo không" sẽ quay lại dưới dạng khác.
    // 07/09: khối rút bài tách sang `components/KhoiBaiLuyen` để bố cục v3 và
    // bố cục cũ dùng CHUNG một bản. Luật không đổi, chỉ đổi tệp.
    const man = doc('src/components/KhoiBaiLuyen.tsx')
    // 08/09: link có thể là bản chở sẵn trong báo cáo HOẶC bản vừa xin được
    // tại chỗ; `linkBai` gộp đúng hai nguồn đó và không thêm điều kiện nào.
    expect(man).toContain('const linkBai = du.linkBaiTap || linkTuXin')
    expect(man).toContain('{linkBai && (')
    const dau = man.indexOf('{linkBai && (')
    const doan = man.slice(dau, dau + 800)
    expect(doan).toContain('Copy link gửi ĐỀ cho con')
    expect(doan).toContain('Copy link gửi LỜI GIẢI cho con')
  })
})
