// PHIẾU BÀI TẬP HTML V2 — nghiệm thu theo PHIEU-BAI-TAP-V2.md mục 8.
//
// Mỗi phép kiểm ứng với một dòng trong bảng "định nghĩa hoàn thành", giữ đúng
// thứ tự bảng để đối chiếu cho nhanh.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { biaHtml, dungPhieu, oGiaiHtml, theCauHtml, tongQuanHtml, CSS_PHIEU } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const MA = fs.readFileSync(path.join(process.cwd(), 'src/lib/html-phieu.ts'), 'utf8')

function cauI(sua: Partial<CauLuyen> = {}): CauLuyen {
  return {
    id: 'q1',
    phan: 'I',
    text: 'Ester X có công thức C4H8O2. Tên gọi của X là',
    luaChon: ['ethyl acetate', 'methyl propanoate', 'propyl formate', 'butanoic acid'],
    dapAn: 'A',
    mucDo: 'hieu',
    chuyenDe: 'Ester – lipid',
    chot: 'Đếm số C của gốc acid trước.',
    lyDo: [
      { khoa: 'A', dung: true, ly: 'Đúng: CH3COOC2H5 có 4 C.' },
      { khoa: 'B', dung: false, ly: 'Sai vì gốc acid có 3 C.' },
      { khoa: 'C', dung: false, ly: 'Sai vì gốc acid chỉ có 1 C.' },
      { khoa: 'D', dung: false, ly: 'Sai vì đây là acid, không phải ester.' },
    ],
    buoc: ['Đếm C', 'Đối chiếu tên'],
    ketQua: 'Chọn A',
    ...sua,
  } as CauLuyen
}

describe('bảng nghiệm thu mục 8', () => {
  it('HẾT GÕ CỨNG CÔNG THỨC — phép grep của đặc tả ra 0 kết quả', () => {
    expect(MA).not.toMatch(/RCOOR'|C<sub>9<\/sub>H<sub>8<\/sub>O<sub>4<\/sub>|Hóa học Hữu cơ/)
    expect(MA).not.toContain('cover-molecule')
    expect(MA).not.toContain('cover-chemical')
    expect(MA).not.toContain('congThucBia')
  })

  it('LÝ DO GẮN VÀO PHƯƠNG ÁN, và KHÔNG còn khối "Vì sao" riêng', () => {
    const h = theCauHtml(cauI(), 1)
    // Lý do của A nằm TRONG ô phương án A.
    const oA = h.slice(h.indexOf('ethyl acetate'), h.indexOf('methyl propanoate'))
    expect(oA).toContain('COOC<sub>2</sub>H<sub>5</sub> có 4 C')
    const oB = h.slice(h.indexOf('methyl propanoate'), h.indexOf('propyl formate'))
    expect(oB).toContain('gốc acid có 3 C')
    // Khối cũ biến mất khỏi cả thẻ câu lẫn ô lời giải.
    expect(h).not.toContain('Vì sao chọn / không chọn từng phương án')
    expect(oGiaiHtml(cauI())).not.toContain('Vì sao chọn / không chọn từng phương án')
    expect(oGiaiHtml(cauI())).not.toContain('Vì sao từng ý đúng / sai')
  })

  it('KHÔNG MÀU ĐƠN ĐỘC — mỗi lý do kèm dấu ✓ hoặc ✗', () => {
    const h = theCauHtml(cauI(), 1)
    expect(h).toContain('✓')
    expect(h).toContain('✗')
    // Và dấu đó nằm trong chính dòng lý do, không phải ở đâu khác.
    expect(h).toMatch(/opt-ly dung[\s\S]{0,120}✓/)
    expect(h).toMatch(/opt-ly sai[\s\S]{0,120}✗/)
  })

  it('phần II: mỗi ý mang lý do của chính nó', () => {
    const c = cauI({
      phan: 'II',
      luaChon: ['Ý a', 'Ý b', 'Ý c', 'Ý d'],
      dapAn: 'DSDS',
      lyDo: [
        { khoa: 'a', dung: true, ly: 'a đúng vì thế' },
        { khoa: 'b', dung: false, ly: 'b sai vì thế' },
        { khoa: 'c', dung: true, ly: 'c đúng vì thế' },
        { khoa: 'd', dung: false, ly: 'd sai vì thế' },
      ],
    })
    const h = theCauHtml(c, 1)
    const oA = h.slice(h.indexOf('Ý a'), h.indexOf('Ý b'))
    expect(oA).toContain('a đúng vì thế')
    expect(oA).toContain('✓')
  })

  it('CHỈ HAI MÀU MANG NGHĨA — bỏ hết chip màu phần và mức độ', () => {
    for (const lop of ['type-mc', 'type-tf', 'type-sa', 'level-1', 'level-2', 'level-3']) {
      expect(CSS_PHIEU).not.toContain(`.q-tag.${lop}`)
    }
    // Chip duy nhất còn màu là chip chữa.
    expect(CSS_PHIEU).toContain('.q-tag.chua')
    const h = theCauHtml(cauI(), 1)
    expect(h).toContain('class="q-meta"')
    expect(h).toContain('Trắc nghiệm · Thông hiểu · Ester – lipid')
  })

  it('LỌC VẪN CHẠY — ba cụm phần giữ nguyên data-loc và aria-pressed', () => {
    const tq = tongQuanHtml([cauI(), cauI({ id: 'q2', phan: 'II' }), cauI({ id: 'q3', phan: 'III' })])
    expect(tq).toContain('data-loc="phan:I"')
    expect(tq).toContain('data-loc="phan:II"')
    expect(tq).toContain('data-loc="phan:III"')
    expect(tq).toContain('data-loc="tat"')
    expect(tq).toContain('aria-pressed="false"')
    // Panel bốn ô và bảng phân loại đã thu thành MỘT dòng.
    expect(tq).not.toContain('stats-grid')
    expect(tq).not.toContain('topics-list')
    expect(tq.split('\n').filter((d) => d.trim()).length).toBeLessThanOrEqual(3)
  })

  it('phần 0 câu là chữ chết, không bấm được', () => {
    const tq = tongQuanHtml([cauI()])
    expect(tq).toContain('0 đúng sai')
    expect(tq).not.toContain('data-loc="phan:II"')
  })

  it('Ô KẾT QUẢ CÓ NHÃN — không truyền oBia thì hiện "Bài trước"', () => {
    const h = biaHtml({ hoTen: 'A', sbd: '1', ngay: new Date('2026-09-07'), tenChuyenDe: 'Ester', ketQua: 'Sai 2/12 câu', hienDapAn: false }, 10)
    expect(h).toContain('Bài trước')
    expect(h).not.toMatch(/cover-info-label">Kết quả</)
  })

  it('`anGiai` VẪN SẠCH — không đáp án, không chốt, không bước, không lý do', () => {
    const h = dungPhieu({ hoTen: 'A', sbd: '1', ngay: new Date('2026-09-07'), tenChuyenDe: 'Ester', ketQua: '', hienDapAn: false }, [cauI()], { anGiai: true })
    expect(h).not.toContain('có 4 C')
    expect(h).not.toContain('Đếm số C của gốc acid')
    expect(h).not.toContain('Chọn A')
    // Tìm trong THÂN phiếu, không tìm trong CSS: tên lớp `.opt-ly` luôn có mặt
    // trong bảng kiểu, còn thẻ thật thì không được dựng.
    expect(theCauHtml(cauI(), 1, false, true)).not.toContain('opt-ly')
  })

  it('KÍCH THƯỚC — phiếu 10 câu không ảnh dưới 120 KB', () => {
    const cau = Array.from({ length: 10 }, (_, i) => cauI({ id: `q${i}` }))
    const h = dungPhieu({ hoTen: 'Nguyễn Văn A', sbd: '12050', ngay: new Date('2026-09-07'), tenChuyenDe: 'Ester – lipid', ketQua: '', hienDapAn: false }, cau)
    const kb = Buffer.byteLength(h, 'utf8') / 1024
    expect(kb).toBeLessThanOrEqual(120)
  })

  it('CHỮ KÝ HÀM XUẤT RA KHÔNG ĐỔI — chỗ gọi chạy tiếp không sửa', () => {
    for (const ten of ['dungPhieu', 'biaHtml', 'theCauHtml', 'oGiaiHtml', 'tongQuanHtml', 'thanhHtml', 'taiLieuHtml', 'boLoiGiai', 'CSS_PHIEU', 'JS_PHIEU']) {
      expect(MA).toMatch(new RegExp(`export (function|const) ${ten}\\b`))
    }
  })

  it('KHÔNG ĐỤNG bộ vẽ PDF riêng', () => {
    // `ve-bai-tap-pdf.ts` là bộ vẽ jsPDF độc lập; sửa nhầm là hỏng phiếu in
    // giấy vốn đang chạy tốt.
    expect(MA).not.toContain('ve-bai-tap-pdf')
  })
})
