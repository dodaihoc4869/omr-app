// HỒ SƠ TỰ MÂU THUẪN — đầu màn in điểm, ngay dưới bảo "chưa chấm".
//
// Thầy chụp được 10/09, em Đinh Thị Hà Giang (SBD 10016):
//
//     5,60  điểm ca này  · 1 ca đã làm
//     Tiến bộ qua các bài → "Em chưa có bài nào đã chấm điểm."
//     Gửi phụ huynh      → "Em chưa có ca nào đã chấm điểm — chưa soạn được phiếu."
//
// Ba dòng, cùng một màn, chỏi nhau.
//
// NGUYÊN NHÂN GỐC, đo trên máy chủ: ca 890691 của em có `DiemI/II/III/Tong`
// RỖNG — em đã nộp nhưng thầy chưa bấm ghi điểm. Con số 5,60 là điểm màn Ca thi
// TỰ CHẤM tại chỗ bằng ngân hàng có đáp án trên máy thầy, rồi truyền xuống hai
// khối kia. Cả hai khối đều VỨT nó đi:
//
//   · `chuoiTienBo` lọc `typeof c.tong === 'number'` TRƯỚC rồi mới áp `deTheoCa`
//     ⇒ ca bị loại trước khi kịp nhận con số. `deTheoCa` chết đúng ở ca duy nhất
//     nó sinh ra để phục vụ.
//   · `chonCa` đòi `x.tong !== null` khi dò theo `maCa` ⇒ bỏ đúng ca thầy đang
//     đứng, lui về `caGanNhat`; em mới có một ca thì lui về rỗng.
//
// Cả hai cùng một giả định sai: coi ô Sheet rỗng là "chưa chấm", trong khi màn
// ĐANG cầm điểm tự chấm trong tay.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { chuoiTienBo } from '../src/lib/tien-bo'
import type { HoSoEm } from '../src/lib/exam-api'

/** Đúng dáng dữ liệu của em 10016 sáng 10/09: nộp rồi, `tong` rỗng. */
const CA_CHUA_GHI_DIEM = [
  { maCa: '890691', tenCa: 'Ca 890691', nopLuc: '2026-09-10T08:40:30.466Z', tong: null, hang: null, siSo: null },
] as unknown as HoSoEm['ca']

const CA_DA_GHI_DIEM = [
  { maCa: '111111', tenCa: 'Ca cũ', nopLuc: '2026-09-01T08:00:00.000Z', tong: 7.5, hang: 2, siSo: 30 },
] as unknown as HoSoEm['ca']

describe('BIỂU ĐỒ TIẾN BỘ — điểm tự chấm phải được tính', () => {
  it('ca CHƯA ghi điểm nhưng CÓ điểm tự chấm ⇒ vẫn vào biểu đồ, đúng con số 5,60', () => {
    const ds = chuoiTienBo(CA_CHUA_GHI_DIEM, { '890691': 5.6 })
    expect(ds).toHaveLength(1)
    expect(ds[0].diem).toBe(5.6)
    expect(ds[0].maCa).toBe('890691')
  })

  it('KHÔNG có điểm tự chấm thì vẫn loại như cũ — không bịa ra điểm 0', () => {
    expect(chuoiTienBo(CA_CHUA_GHI_DIEM, null)).toHaveLength(0)
    expect(chuoiTienBo(CA_CHUA_GHI_DIEM, {})).toHaveLength(0)
    // Và map có ca KHÁC cũng không cứu được ca này.
    expect(chuoiTienBo(CA_CHUA_GHI_DIEM, { '999999': 9 })).toHaveLength(0)
  })

  it('điểm tự chấm ĐÈ LÊN ô Sheet khi có cả hai — ô Sheet là số máy em ghi được', () => {
    const ds = chuoiTienBo(CA_DA_GHI_DIEM, { '111111': 6.25 })
    expect(ds[0].diem).toBe(6.25)
  })

  it('ca đã ghi điểm mà không có điểm tự chấm ⇒ giữ nguyên ô Sheet', () => {
    expect(chuoiTienBo(CA_DA_GHI_DIEM, null)[0].diem).toBe(7.5)
    expect(chuoiTienBo(CA_DA_GHI_DIEM, { '999999': 9 })[0].diem).toBe(7.5)
  })

  it('giá trị rác trong map không được lọt vào biểu đồ', () => {
    expect(chuoiTienBo(CA_CHUA_GHI_DIEM, { '890691': NaN })).toHaveLength(0)
    expect(chuoiTienBo(CA_CHUA_GHI_DIEM, { '890691': Infinity })).toHaveLength(0)
  })

  it('VẪN XẾP THEO NGÀY NỘP sau khi đổi thứ tự lọc — không đảo lộn đường tiến bộ', () => {
    const ca = [
      { maCa: 'c3', tenCa: '', nopLuc: '2026-09-03T00:00:00.000Z', tong: 8, hang: null, siSo: null },
      { maCa: 'c1', tenCa: '', nopLuc: '2026-09-01T00:00:00.000Z', tong: null, hang: null, siSo: null },
      { maCa: 'c2', tenCa: '', nopLuc: '2026-09-02T00:00:00.000Z', tong: 6, hang: null, siSo: null },
    ] as unknown as HoSoEm['ca']
    const ds = chuoiTienBo(ca, { c1: 5 })
    expect(ds.map((d) => d.maCa)).toEqual(['c1', 'c2', 'c3'])
    expect(ds.map((d) => d.diem)).toEqual([5, 6, 8])
  })
})

describe('PHIẾU GỬI PHỤ HUYNH — không bỏ đúng ca thầy đang đứng', () => {
  const ma = fs.readFileSync(path.join(process.cwd(), 'src/components/PhieuZaloEm.tsx'), 'utf8')

  it('`chonCa` nhận cờ có-điểm-tự-chấm, không đòi ô Sheet vô điều kiện', () => {
    expect(ma).toContain('function chonCa(hoSo: HoSoEm, maCa?: string, coDiemChamLai = false)')
    expect(ma).toContain('(coDiemChamLai || x.tong !== null)')
    // Bản cũ đòi vô điều kiện — không được quay lại.
    expect(ma).not.toContain('x.maCa === maCa && x.tong !== null')
  })

  it('chỗ gọi truyền đúng cờ ấy từ `diemChamLai`', () => {
    expect(ma).toContain("chonCa(hoSo, maCa, typeof diemChamLai?.tong === 'number')")
  })

  it('BƯỚC LUI vẫn còn cho màn KHÔNG có điểm tự chấm', () => {
    // Bỏ hẳn điều kiện thì màn Học sinh sẽ chọn phải một ca chưa chấm rồi kẹt
    // y như cũ — chỉ khác chỗ kẹt.
    expect(ma).toContain('return hoSo.caGanNhat')
  })
})
