// BÁO CÁO PHỤ HUYNH V3 — nghiệm thu theo PHIEU-PHU-HUYNH-V3.md mục 8.
//
// Mỗi phép kiểm dưới đây ứng với một dòng trong bảng "định nghĩa hoàn thành"
// của đặc tả. Thứ tự giữ nguyên thứ tự bảng để đối chiếu cho nhanh.
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import PhieuScreen from '../src/screens/PhieuScreen'
import { BAN_PHIEU, BAN_PHIEU_DOC_DUOC, dongCachTinhDiem, dungCauSai, type PhieuDayDu } from '../src/lib/phieu-du-lieu'
import { cauHinhPhieu, duocHienHang, NGUONG_LOP_CUNG_SAI } from '../src/lib/cau-hinh-phieu'
import type { ChiTietCauRow } from '../src/lib/exam-api'

const V3 = fs.readFileSync(path.join(process.cwd(), 'src/screens/PhieuV3.tsx'), 'utf8')

function goi(sua: Partial<PhieuDayDu> = {}): PhieuDayDu {
  return {
    v: BAN_PHIEU,
    hoTen: 'Kiều Minh Gia Huy',
    sbd: '12026',
    lop: '12',
    tenCa: '2009 - L1',
    maCa: '248567',
    ngay: '2026-09-07T12:15:00.000Z',
    diem: 6.69,
    diemPhan: { I: 3.94, II: 2.0, III: 0.75 },
    tranPhan: { I: 4.5, II: 4, III: 1.5 },
    soCauSai: 4,
    tongSoCau: 12,
    hang: 10,
    siSo: 21,
    chuyenDeCa: [
      { ten: 'Ester – lipid', soCau: 6, soSai: 3 },
      { ten: 'Carbohydrate', soCau: 6, soSai: 0 },
    ],
    chuyenDeTong: [],
    lichSu: [],
    diemLop: [],
    vieCanLam: 'Tối nay con làm 10 câu ester trong phiếu kèm.',
    thongKe: null,
    tinHieu: [],
    ducKet: [],
    cauSai: [],
    dai: [],
    ...sua,
  } as PhieuDayDu
}

describe('bảng nghiệm thu mục 8', () => {
  it('BẢN CŨ VẪN MỞ ĐƯỢC — v2 ra bố cục cũ, không lỗi', () => {
    expect(BAN_PHIEU).toBe(3)
    expect([...BAN_PHIEU_DOC_DUOC]).toEqual([2, 3])
    render(<PhieuScreen duCoSan={goi({ v: 2 })} />)
    // Bố cục cũ có nhãn "TRÊN 10" của vòng điểm; bố cục mới không có vòng nào.
    expect(document.querySelector('.bc')).not.toBeNull()
    expect(document.querySelector('.v3')).toBeNull()
  })

  it('BA TẦNG CÓ MẶT — đủ ba nhãn Phần 1, 2, 3', () => {
    render(<PhieuScreen duCoSan={goi()} />)
    expect(document.querySelector('.v3')).not.toBeNull()
    const chu = document.body.textContent ?? ''
    expect(chu).toContain('Phần 1 · Việc cần làm')
    expect(chu).toContain('Phần 2 · Điều gì đã đổi')
    expect(chu).toContain('Phần 3 · Từng câu sai')
  })

  it('BỎ HẲN VÒNG ĐIỂM CHẠY SỐ — số vẽ thẳng, không requestAnimationFrame', () => {
    // Đây là lỗi đo được 07/09: thẻ không ở trước mặt thì vòng đứng ở 0,00
    // trong khi dữ liệu là 5,75.
    // Bỏ dòng chú thích ra trước khi soi: chú thích có NHẮC TÊN vòng lặp đó
    // để người sau biết vì sao nó bị bỏ, nhưng mã thì không được gọi.
    const ma = V3.replace(/^\s*\/\/.*$/gm, '')
    expect(ma).not.toContain('requestAnimationFrame')
    expect(ma).not.toContain('setInterval')
    render(<PhieuScreen duCoSan={goi({ diem: 5.75 })} />)
    expect(screen.getByText('5,75')).toBeTruthy()
  })

  it('HẠNG ĐÃ TẮT theo mặc định', () => {
    render(<PhieuScreen duCoSan={goi()} />)
    expect(document.body.textContent ?? '').not.toContain('hạng 10/21')
  })

  it('bật HIEN_HANG_LOP thì hiện hạng', () => {
    render(<PhieuScreen duCoSan={goi({ cauHinh: { HIEN_HANG_LOP: true } })} />)
    expect(document.body.textContent ?? '').toContain('hạng 10/21')
  })

  it('CA ĐỀ RIÊNG TẮT HẠNG kể cả khi cờ đang bật', () => {
    // Mỗi em một bộ câu thì so điểm với nhau không còn nghĩa.
    expect(duocHienHang(cauHinhPhieu({ HIEN_HANG_LOP: true }), true)).toBe(false)
    render(<PhieuScreen duCoSan={goi({ cauHinh: { HIEN_HANG_LOP: true }, deRieng: true })} />)
    expect(document.body.textContent ?? '').not.toContain('hạng 10/21')
  })

  it('SPARKLINE 1 BÀI thì ẩn hẳn, không vẽ đoạn thẳng', () => {
    const mot = render(<PhieuScreen duCoSan={goi({ lichSu: [{ maCa: 'a', tenCa: '', ngay: '2026-09-01T00:00:00Z', tong: 5, hang: null, siSo: null }] })} />)
    expect(mot.container.querySelector('.v3-spark')).toBeNull()
    mot.unmount()
    const hai = render(
      <PhieuScreen
        duCoSan={goi({
          lichSu: [
            { maCa: 'a', tenCa: '', ngay: '2026-09-01T00:00:00Z', tong: 5, hang: null, siSo: null },
            { maCa: 'b', tenCa: '', ngay: '2026-09-07T00:00:00Z', tong: 6.69, hang: null, siSo: null },
          ],
        })}
      />,
    )
    expect(hai.container.querySelector('.v3-spark')).not.toBeNull()
  })

  it('DÒNG TÍNH ĐIỂM KHỚP điểm thật, tính lại từ rows', () => {
    const rows: ChiTietCauRow[] = [
      { phan: 'I', soCau: 1, qid: 'q1', chuyenDe: '', mucDo: '', dapAnChon: 'A', dapAnDung: 'A', dungSai: true, giay: 5 },
      { phan: 'I', soCau: 2, qid: 'q2', chuyenDe: '', mucDo: '', dapAnChon: 'B', dapAnDung: 'C', dungSai: false, giay: 5 },
      { phan: 'I', soCau: 3, qid: 'q3', chuyenDe: '', mucDo: '', dapAnChon: '', dapAnDung: 'C', dungSai: false, giay: 5 },
    ] as ChiTietCauRow[]
    const dong = dongCachTinhDiem(rows, { I: 1.5, II: 0, III: 0 }, { I: 4.5, II: 4, III: 1.5 })
    expect(dong).toContain('đúng 1/3 câu')
    expect(dong).toContain('1,50 trên 4,50')
    expect(dong).toContain('Câu bỏ trống tính như câu sai')
    // Thiếu trần từng phần thì KHÔNG dựng dòng nửa vời.
    expect(dongCachTinhDiem(rows, { I: 1.5, II: 0, III: 0 }, null)).toBe('')
  })

  it('CHIP "mấy bạn cùng sai" chỉ hiện khi tới ngưỡng, và đếm bằng số thật', () => {
    expect(NGUONG_LOP_CUNG_SAI).toBe(0.5)
    const rowsLop = [
      { phan: 'I', soCau: 1, qid: 'q1', chuyenDe: '', mucDo: '', dapAnChon: 'B', dapAnDung: 'C', dungSai: false, giay: 1, sbd: '1' },
      { phan: 'I', soCau: 1, qid: 'q1', chuyenDe: '', mucDo: '', dapAnChon: 'B', dapAnDung: 'C', dungSai: false, giay: 1, sbd: '2' },
      { phan: 'I', soCau: 1, qid: 'q1', chuyenDe: '', mucDo: '', dapAnChon: 'C', dapAnDung: 'C', dungSai: true, giay: 1, sbd: '3' },
    ] as unknown as ChiTietCauRow[]
    const rows = [rowsLop[0]] as ChiTietCauRow[]
    const banks = [{ maDe: 'x', phanI: [{ id: 'q1', text: 'đề', choices: ['a', 'b', 'c', 'd'], correct: 'C' }], phanII: [], phanIII: [] }]
    const ra = dungCauSai(rows, banks as never, true, { rowsLop })
    expect(ra).toHaveLength(1)
    expect(ra[0].soLopSai).toBe(2)
    expect(ra[0].siSoLop).toBe(3)
    expect(ra[0].tiLeLopSai).toBeCloseTo(2 / 3, 5)
    // Không có bảng chấm cả lớp thì ba trường về null, KHÔNG về 0.
    const khong = dungCauSai(rows, banks as never, true, null)
    expect(khong[0].tiLeLopSai).toBeNull()
    expect(khong[0].soLopSai).toBeNull()
  })

  it('KHỐI RÚT BÀI DÙNG CHUNG một bản với bố cục cũ, không phải bản chép', () => {
    // Thầy chốt 07/09: "giữ nguyên mục rút bài trong phiếu mới đầy đủ như trong
    // phiếu cũ". Hai bản sao thì sớm muộn lệch nhau.
    const cu = fs.readFileSync(path.join(process.cwd(), 'src/screens/PhieuScreen.tsx'), 'utf8')
    expect(cu).toContain("import NutTaiBaiTap from '../components/KhoiBaiLuyen'")
    expect(V3).toContain("import NutTaiBaiTap from '../components/KhoiBaiLuyen'")
    // Và khối đó chỉ tồn tại ở đúng một tệp.
    expect(cu).not.toContain('function NutTaiBaiTap')
    expect(V3).not.toContain('function NutTaiBaiTap')
  })

  it('CẤM MÀU ĐƠN ĐỘC — chip bẫy luôn kèm chữ', () => {
    const than = V3.slice(V3.indexOf('v3-chip bay'), V3.indexOf('</span>', V3.indexOf('v3-chip bay')))
    expect(than).toContain('bạn cùng sai')
  })

  it('không dùng màu nào ngoài bảng mục 3', () => {
    // Mọi màu trong bố cục v3 phải là token; mã màu # nằm ở tokens.css.
    expect(V3).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})
