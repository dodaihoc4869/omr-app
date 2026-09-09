// MÀN GỬI ZALO ĐỌC THẲNG Ô ĐIỂM TRÊN SHEET — thầy báo khuya 08/09, ảnh chụp.
//
// Tin nhắn gửi phụ huynh in "ĐIỂM: 3,50/10, xếp loại Yếu · Phần I 1,50 ·
// Phần II 1,50 · Phần III 0,50" cho em Bùi Hồng Hân, trong khi chấm lại bài
// thật của em ra 7,88. Ảnh phiếu kèm theo cũng in 3,50, và link mới dựng
// (`p#iiBopoadsq`) cất luôn con số 3,50 vào phiếu.
//
// NGUYÊN NHÂN GỐC: `PhieuZaloEm` lấy `ca.tong` — ô điểm trên Sheet. Ô đó KHÔNG
// đáng tin: máy học sinh cũng ghi được vào đó, và máy bản cũ ghi bằng thang
// tuyệt đối cũ. Đo lúc 08/09 khuya: chấm lại cả ca xong, mở lại `chiTietCa` thì
// cả 36 ô điểm đã quay về thang cũ (cao nhất đúng 4,50 = trần thang cũ của ca
// 8/2/2). Chốt chặn ở máy chủ chưa triển khai được nên ô đó còn bị đè.
//
// SỬA: khối này vốn ĐÃ tải đáp án của em, bộ đề CÓ đáp án, số câu của ca và bản
// đồ đề riêng — đủ để tự chấm. Nay chấm lại tại chỗ (thuần tính toán, không
// thêm lượt gọi máy chủ nào) và mọi thứ gửi phụ huynh lấy số TỰ TÍNH. Ô Sheet
// chỉ còn là đường lùi khi không chấm lại được.
//
// Nhờ vậy phụ huynh nhận đúng điểm KỂ CẢ KHI ô trên Sheet đang sai.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { hangTheoDiem } from '../src/components/PhieuZaloEm'

const ZALO = fs.readFileSync(path.join(process.cwd(), 'src/components/PhieuZaloEm.tsx'), 'utf8')

describe('PhieuZaloEm KHÔNG còn tin ô điểm trên Sheet', () => {
  it('có chấm lại tại chỗ bằng đúng lõi chấm của app', () => {
    expect(ZALO).toContain("import { gradeSubmissionFull } from '../lib/exam-grade'")
    expect(ZALO).toContain('gradeSubmissionFull(bank, ca.maCa, sbd, dapAn, soCau, rieng?.boTheoEm).score')
  })

  it('điểm dùng chung lấy số chấm lại TRƯỚC, ô Sheet chỉ là đường lùi', () => {
    expect(ZALO).toContain('const diemDung = them?.diemMoi ?? null')
    expect(ZALO).toContain('const tongDung = diemDung?.tong ?? ca?.tong ?? null')
  })

  it('TIN NHẮN gửi phụ huynh dùng số chấm lại', () => {
    const than = ZALO.slice(ZALO.indexOf('const duPhieu: DuLieuPhieu'), ZALO.indexOf('const [viec, setViec]'))
    expect(than).toContain('diem: tongDung')
    expect(than).toContain('xepLoai: classify(tongDung)')
    expect(than).toContain('diemPhan: diemDung')
    // Không được còn đường nào lấy thẳng ca.tong làm điểm.
    expect(than).not.toContain('diem: ca.tong')
    expect(than).not.toContain('classify(ca.tong)')
  })

  it('ẢNH PHIẾU dùng số chấm lại, và hạng cũng tính lại', () => {
    const dau = ZALO.indexOf('const duAnh: DuLieuAnhPhieu')
    expect(dau).toBeGreaterThan(0)
    // Cắt tới hết mảng phụ thuộc của chính useMemo này, không đoán bằng số ký tự.
    const cuoi = ZALO.indexOf('}, [ca, chuyenDeCa, duPhieu, hoSo, viec', dau)
    expect(cuoi).toBeGreaterThan(dau)
    const anh = ZALO.slice(dau, cuoi)
    expect(anh).toContain('diem: tongDung')
    expect(anh).toContain('xepLoai: classify(tongDung)')
    expect(anh).toContain('hang: hangDung')
    expect(anh).toContain('siSo: siSoDung')
    expect(anh).not.toContain('diem: ca.tong')
    expect(anh).not.toContain('hang: ca.hang')
  })

  it('BẢNG ĐIỂM LỚP (nguồn của hạng) cũng là điểm chấm lại', () => {
    expect(ZALO).toContain('diemLop: diemLopMoi')
    expect(ZALO).not.toContain('diemLop: ct.luot.map((l) => l.tong)')
  })

  it('DÒNG TIÊU ĐỀ trên màn thầy nhìn cũng là số chấm lại — hai chỗ không nói hai số', () => {
    expect(ZALO).toContain("{tongDung.toFixed(2).replace('.', ',')} điểm")
    expect(ZALO).not.toContain("{ca.tong.toFixed(2).replace('.', ',')} điểm")
  })

  it('em không chấm lại được vẫn giữ ô Sheet, không rơi khỏi bảng xếp hạng', () => {
    expect(ZALO).toContain("(chamLai(String(l.sbd), l.dapAn)?.tong ?? l.tong)")
  })
})

describe('hangTheoDiem — cùng điểm thì cùng hạng', () => {
  it('hạng nhất khi cao nhất', () => {
    expect(hangTheoDiem(9, [9, 7, 5])).toEqual({ hang: 1, siSo: 3 })
  })

  it('hạng chót khi thấp nhất', () => {
    expect(hangTheoDiem(5, [9, 7, 5])).toEqual({ hang: 3, siSo: 3 })
  })

  it('hai em BẰNG ĐIỂM thì CÙNG hạng, không hơn kém vì thứ tự mảng', () => {
    const lop = [9, 8, 8, 7]
    expect(hangTheoDiem(8, lop).hang).toBe(2)
    expect(hangTheoDiem(8, [...lop].reverse()).hang).toBe(2)
  })

  it('ba em cùng hạng nhất thì em kế tiếp là hạng 4', () => {
    expect(hangTheoDiem(6, [9, 9, 9, 6]).hang).toBe(4)
  })

  it('sai số dấu phẩy động không đẩy lệch hạng', () => {
    // 0,1 + 0,2 !== 0,3 — điểm bằng nhau về mặt bài làm phải cùng hạng.
    expect(hangTheoDiem(0.1 + 0.2, [0.3, 0.3, 0.1]).hang).toBe(1)
  })

  it('lớp một em', () => {
    expect(hangTheoDiem(7.88, [7.88])).toEqual({ hang: 1, siSo: 1 })
  })

  it('ĐÚNG CA THẬT 447479: 7,88 đứng hạng mấy trong 36 em đã chấm lại', () => {
    // 36 điểm chấm lại của ca, lấy nguyên từ lượt `chamLaiCa` chạy 08/09.
    const lop = [
      5.06, 4.72, 7.31, 10, 5.85, 5.62, 9, 5.85, 5.62, 4.16, 3.94, 8.88, 3.6, 8.88, 4.72, 9,
      10, 3.94, 10, 5.62, 7.88, 4.5, 4.5, 7.88, 5.06, 6.19, 6.19, 6.44, 5.06, 7.88, 5.06, 7.88,
      8.44, 6.44, 6.44, 5.62,
    ]
    expect(lop.length).toBe(36)
    const r = hangTheoDiem(7.88, lop)
    expect(r.siSo).toBe(36)
    // 4 em trên 7,88 (ba em 10 và một em 9… đếm lại cho chắc):
    const tren = lop.filter((d) => d > 7.88 + 0.0001).length
    expect(r.hang).toBe(tren + 1)
  })
})
