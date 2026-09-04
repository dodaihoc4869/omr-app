// PHIẾU CHỈ CÓ ĐỀ (link `~20d`) — thầy chốt 04-09 khuya: tách nút gửi link cho
// con thành hai, một gửi ĐỀ, một gửi LỜI GIẢI.
//
// Luật sống còn: bản đề KHÔNG được chứa đáp án ở bất kỳ đâu trong HTML — em tò
// mò "xem mã nguồn" là lộ hết. Giấu bằng CSS không tính.
import { describe, expect, it } from 'vitest'
import { dungPhieu, boLoiGiai, thanhHtml } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'
import { parseKhoDeJsonText, buildTeacherSourceFromKhoDe } from '../src/lib/exam-kho-de-import'

const tt = { hoTen: 'Em A', sbd: '01', ngay: new Date('2026-09-04'), tenChuyenDe: 'Ester', ketQua: '', hienDapAn: false }
const cau: CauLuyen[] = [
  { phan: 'I', id: 'q1', chuyenDe: 'Ester', mucDo: 'biet', text: 'Câu TN', luaChon: ['a1', 'b1', 'c1', 'd1'], dapAn: 'B', chot: 'CHOTBIMAT', lyDo: [{ khoa: 'B', dung: true, ly: 'LYDOBIMAT' }], buoc: null, ketQua: '' },
  { phan: 'II', id: 'q2', chuyenDe: 'Ester', mucDo: 'hieu', text: 'Câu ĐS', luaChon: ['ya', 'yb', 'yc', 'yd'], dapAn: 'DSDS', chot: '', lyDo: null, buoc: null, ketQua: '' },
  { phan: 'III', id: 'q3', chuyenDe: 'Ester', mucDo: 'van_dung', text: 'Câu TLN', luaChon: null, dapAn: '4,5', chot: '', lyDo: null, buoc: ['BUOCBIMAT'], ketQua: '4,5', hinh: [{ src: 'data:image/png;base64,ANHGIAI', viTri: 'sau_loi_giai' }, { src: 'data:image/png;base64,ANHDE', viTri: 'sau_de' }] },
]

describe('phiếu chỉ có đề', () => {
  it('không còn đáp án, lời giải, ảnh lời giải hay nút "Xem lời giải" trong HTML', () => {
    const h = dungPhieu(tt, cau, { anGiai: true })
    for (const bi of ['CHOTBIMAT', 'LYDOBIMAT', 'BUOCBIMAT', 'ANHGIAI', '4,5', 'Xem lời giải', 'In kèm lời giải', 'q-opt dung', 'class="sa-answer"']) expect(h).not.toContain(bi)
    // Đề bài và ảnh đề vẫn còn nguyên.
    for (const co of ['Câu TN', 'Câu ĐS', 'Câu TLN', 'ANHDE', 'In đề']) expect(h).toContain(co)
  })
  it('bản có lời giải vẫn như cũ', () => {
    const h = dungPhieu(tt, cau)
    for (const co of ['CHOTBIMAT', 'BUOCBIMAT', 'Xem lời giải', 'In kèm lời giải']) expect(h).toContain(co)
  })
  it('boLoiGiai xoá sạch dữ liệu đáp án trên từng câu', () => {
    const c = boLoiGiai(cau[2])
    expect(c.dapAn).toBe('')
    expect(c.buoc).toBeNull()
    expect(c.hinh?.map((h) => h.viTri)).toEqual(['sau_de'])
  })
  it('thanh công cụ bản đề không có nút mở tất cả', () => {
    expect(thanhHtml(0, true)).not.toContain('mo-het')
    expect(thanhHtml(3)).toContain('mo-het')
  })
})

describe('nạp kho: lời giải không có câu chốt vẫn được giữ', () => {
  it('phần III chỉ có buoc + ket_qua, phần II chỉ có tung_y — trước đây bị vứt cả lời giải', () => {
    const json = {
      ma_de: 'T-1', nguon: 't', ngay_nap: '2026-09-04', nhom: 'x',
      cau: [
        { phan: 'III', so: 1, de: 'Tính', dap_an: '3', loi_giai: { chot: '', buoc: ['b1', 'b2'], ket_qua: '3', trang_thai: 'khop' } },
        { phan: 'II', so: 1, de: 'ĐS', dap_an: 'DDSS', y: { a: '1', b: '2', c: '3', d: '4' }, loi_giai: { chot: '', tung_y: { a: { dung: true, vi_sao: 'vì a' }, b: { dung: true, vi_sao: 'vì b' }, c: { dung: false, vi_sao: 'vì c' }, d: { dung: false, vi_sao: 'vì d' } } } },
        { phan: 'I', so: 1, de: 'TN', dap_an: 'A', pa: { A: '1', B: '2', C: '3', D: '4' }, loi_giai: { chot: '', tung_pa: { A: { dung: true, vi_sao: 'vì A' } } } },
      ],
    }
    const r = parseKhoDeJsonText(JSON.stringify(json))
    expect(r.errors).toEqual([])
    const b = buildTeacherSourceFromKhoDe(r.json!)
    expect(b.source.phanIII[0].loiGiai?.buoc).toEqual(['b1', 'b2'])
    expect(b.source.phanIII[0].loiGiai?.ketQua).toBe('3')
    expect(b.source.phanII[0].loiGiai?.tungY?.b?.viSao).toBe('vì b')
    expect(b.source.phanI[0].loiGiai?.tungPa?.A?.viSao).toBe('vì A')
  })
})
