// TẠO LẠI PHIẾU HÀNG LOẠT + ĐỔI CHỮ NHÃN — thầy chốt 07/09.
//
//   "đẩy hết lên báo cáo cho phụ huynh và cả học sinh nhé"
//   "thay từ chữa câu 1 bằng khắc phục lỗi sai câu 1"
//
// Chỗ dễ hỏng nhất khi dựng lại phiếu cũ: SINH MÃ MỚI. Link thầy đã gửi Zalo
// cho phụ huynh sẽ thành link chết, mà không ai biết cho tới khi phụ huynh bấm.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { theCauHtml, khoiChuaGiHtml } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const doc = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8')
const HS = 'ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG'

const c = (chuaCho?: CauLuyen['chuaCho']): CauLuyen =>
  ({ id: 'x', phan: 'I', de: 'Đề', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', chuyenDe: 'Ester – lipid', mucDo: 'hieu', chuaCho }) as CauLuyen

describe('chữ trên nhãn', () => {
  it('nói "Khắc phục lỗi sai câu N", không còn "Chữa câu N"', () => {
    const h = theCauHtml(c({ qid: 's', soCau: 1, phan: 'I', maDang: HS, tenDang: 'Xà phòng hoá', bac: 1 }), 1)
    expect(h).toContain('Khắc phục lỗi sai câu 1')
    expect(h).not.toMatch(/>Chữa câu 1</)
  })

  it('khối đầu phiếu cũng đổi theo, không để hai lối nói trong một tờ', () => {
    const kh = khoiChuaGiHtml([c({ qid: 's', soCau: 1, phan: 'I', maDang: HS, tenDang: 'Xà phòng hoá', bac: 1 })])
    expect(kh).toContain('Phiếu này khắc phục lỗi nào')
    expect(kh).toContain('1 câu khắc phục')
    expect(kh).toContain('Xà phòng hoá')
    expect(kh).not.toContain(HS) // hiện TÊN dạng, không hiện mã
  })

  it('câu bậc 2 vẫn có chip riêng', () => {
    const h = theCauHtml(c({ qid: 's', soCau: 3, phan: 'I', maDang: HS, tenDang: 'x', bac: 2 }), 1)
    expect(h).toContain('Khắc phục lỗi sai câu 3')
    expect(h).toContain('cùng cơ chế, khác việc')
  })
})

describe('dựng lại phiếu cũ', () => {
  it('GIỮ NGUYÊN mã phiếu — link đã gửi Zalo không được chết', () => {
    // ĐỔI CÁCH ĐO 07/09. Bản cũ quét đúng chuỗi `maCu?.get(sbd)?.ketqua ||
    // sinhMaPhieu()`, tức đo MỘT mã mỗi em. Thầy bắt được trên dữ liệu thật: có
    // em mang HAI phiếu kết quả nên lượt dựng lại chỉ đè được một cái. Nay
    // `maCu` giữ MẢNG mã và đè lên tất cả — hành vi đo bằng test thật ở
    // `tao-phieu-ca-ca.test.ts` ("em có nhiều phiếu cùng loại").
    const t = doc('src/lib/phieu-ca-ca.ts')
    expect(t).toContain('maCu?: Map<string, { ketqua: string[]; baitap: string[] }>')
    expect(t).toContain('const dsKq = maCu?.get(sbd)?.ketqua ?? []')
    expect(t).toContain('const dsBt = maCu?.get(sbd)?.baitap ?? []')
    // Sinh mã mới CHỈ khi em chưa có mã nào.
    expect(t).toContain("const maKq = dsKq[0] || sinhMaPhieu()")
    expect(t).toContain("const maBt = dsBt[0] || sinhMaPhieu()")
  })

  it('chế độ tạo lại dựng cho MỌI em đã chấm, không chỉ em thiếu phiếu', () => {
    const t = doc('src/lib/phieu-ca-ca.ts')
    expect(t).toContain('const thieu = taoLai ? daCham.map((e) => e.sbd) : g.chuaCoPhieu.map((x) => x.sbd)')
  })

  it('cầu nối __ddh cho gọi tạo lại, để chạy hàng loạt mọi ca', () => {
    const t = doc('src/lib/cau-noi-ddh.ts')
    expect(t).toContain('taoPhieuCaCa: (maCa: string, taoLai?: boolean)')
    expect(t).toContain('taoLai === true')
  })

  it('không tạo lại thì vẫn giữ nguyên nết cũ: chỉ dựng cho em chưa có phiếu', () => {
    // Bảo vệ test `tao-phieu-ca-ca` cũ: gọi lần hai KHÔNG được đẻ thêm phiếu.
    const t = doc('src/lib/phieu-ca-ca.ts')
    expect(t).toContain('taoLai = false')
    expect(t).toContain('taoLai ? maCu : undefined')
  })
})
