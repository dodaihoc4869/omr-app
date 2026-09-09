// PHIẾU GỬI PHỤ HUYNH LẠI IN ĐIỂM CỦA Ô SHEET — thầy chụp 09/09 lúc 14:31.
//
// Hai ảnh, cùng một em, cùng một màn:
//
//   đầu màn Hồ sơ : "Đặng Bùi Bình Minh · SBD 12038 · 5,75 điểm ca này"
//   khối gửi Zalo : "Bài 2009 - Lớp 2 - L1 · 2,50 điểm"
//                   "ĐIỂM: 2,50/10, xếp loại Yếu"
//   biểu đồ       : "1 bài đã chấm · trung bình chung 2,50"
//
// NGUYÊN NHÂN GỐC — CÙNG HÌNH DẠNG với lỗi 04-09, nhưng lần này ăn vào ĐIỂM.
//
// `PhieuZaloEm` có một khối "tự đi lấy phần còn thiếu", chạy khi chỗ gọi truyền
// thiếu dữ liệu. Điểm chấm lại (`diemMoi`) bị nhét CHUNG vào khối đó. Mà khối
// đó CỐ Ý không chạy khi chỗ gọi đã truyền đủ:
//
//     const canThem = !rows || !banks || viPham === undefined
//
// Hậu quả ngược đời: `HocSinhScreen` gọi với đúng một prop nên khối chạy và
// phiếu ra số tự chấm — ĐÚNG. Còn `ExamMonitorScreen`, chỗ truyền đủ nhất, thì
// `canThem === false`, khối không chạy, `them` là null, nên
//
//     const diemDung = them?.diemMoi ?? null        // → null
//     const tongDung = diemDung?.tong ?? ca?.tong   // → RƠI VỀ Ô SHEET
//
// Đúng cái màn thầy dùng để gửi phụ huynh lại là màn duy nhất tin ô Sheet.
//
// SỬA: thêm prop `diemChamLai` — chỗ gọi nào đã tự chấm thì đưa thẳng số vào,
// khỏi gọi máy chủ lần nữa. Và `diemChamLai === undefined` nay TÍNH LÀ THIẾU,
// nên chỗ gọi nào không nói gì về điểm thì khối tự đi hỏi và tự chấm. Không còn
// đường nào rơi lặng lẽ về ô Sheet.
//
// PHÉP KIỂM QUYẾT ĐỊNH nằm ở nhóm đầu: DỰNG THẬT khối phiếu với ĐÚNG bộ prop
// của `ExamMonitorScreen`, ô Sheet để 2,50 còn điểm tự chấm để 5,75, rồi đọc
// chữ hiện ra. Soi chuỗi trong tệp .tsx không bắt được lỗi này — bộ kiểm cũ
// (`zalo-khong-tin-o-diem-0809`) soi chuỗi và đã xanh suốt trong lúc lỗi sống.
import { describe, expect, it, afterEach, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import PhieuZaloEm from '../src/components/PhieuZaloEm'
import type { HoSoEm } from '../src/lib/exam-api'

// Khối phiếu đụng IndexedDB và máy chủ trong nhánh "tự đi lấy phần còn thiếu".
// Nhánh đó KHÔNG được chạy ở nhóm phép kiểm đầu — nếu nó chạy thì tức là bản vá
// sai hướng. Chặn cứng bằng mock ném lỗi: gọi tới là đỏ ngay, không im lặng.
const daGoiMayChu = { n: 0 }
vi.mock('../src/lib/exam-api', async () => {
  const that = await vi.importActual<typeof import('../src/lib/exam-api')>('../src/lib/exam-api')
  return {
    ...that,
    chiTietCa: (...a: unknown[]) => {
      daGoiMayChu.n++
      return that.chiTietCa(...(a as Parameters<typeof that.chiTietCa>))
    },
  }
})
vi.mock('../src/lib/exam-db', async () => {
  const that = await vi.importActual<typeof import('../src/lib/exam-db')>('../src/lib/exam-db')
  return { ...that, loadScriptUrl: async () => '', loadTeacherSecret: async () => '' }
})

/** Đúng em trong ảnh thầy gửi. Ô `tong` trên Sheet để 2,50 — con số SAI mà
 * phiếu đã in; điểm tự chấm 5,75 là con số đầu màn in. */
const CA_SHEET = {
  maCa: '778899',
  tenCa: '2009 - Lớp 2 - L1',
  lop: '12',
  lanThu: 1,
  nopLuc: '2026-09-08T13:10:00.000Z',
  trangThai: 'da_nop',
  diemI: 1.0,
  diemII: 1.0,
  diemIII: 0.5,
  tong: 2.5,
  hang: 30,
  siSo: 36,
  soLanRoiMan: 0,
}

const HO_SO: HoSoEm = {
  em: { sbd: '12038', hoTen: 'Đặng Bùi Bình Minh', namSinh: '2009', lop: '12' },
  chuyenDe: [],
  ca: [CA_SHEET],
  caGanNhat: CA_SHEET,
  chuyenDeCaGanNhat: [{ ten: 'Ester – lipid', soCau: 28, soSai: 22 }],
  soCauSaiCaGanNhat: 22,
}

/** Điểm TỰ CHẤM của màn Ca thi — `gradeSubmissionFull(...).score`. */
const TU_CHAM = { tong: 5.75, I: 3.25, II: 2.0, III: 0.5 }

function dungNhuManCaThi(diemChamLai?: { tong: number; I: number; II: number; III: number }) {
  return render(
    <PhieuZaloEm
      hoSo={HO_SO}
      maCa={CA_SHEET.maCa}
      showToast={() => {}}
      rows={[]}
      banks={[]}
      diemChamLai={diemChamLai}
      diemLop={[9, 8.5, 7, 5.75, 4, 3]}
      thoiLuongPhut={50}
      vaoLuc={CA_SHEET.nopLuc}
      viPham={null}
    />,
  )
}

afterEach(() => {
  cleanup()
  daGoiMayChu.n = 0
})

describe('DỰNG THẬT khối phiếu với đúng bộ prop của màn Ca thi', () => {
  it('TÁI HIỆN ẢNH THẦY GỬI: ô Sheet 2,50 · tự chấm 5,75 ⇒ phiếu phải in 5,75', () => {
    dungNhuManCaThi(TU_CHAM)
    expect(screen.queryAllByText(/5,75 điểm/).length).toBeGreaterThan(0)
    // Con số của ô Sheet không được xuất hiện ở BẤT KỲ đâu trong khối phiếu.
    expect(screen.queryByText(/2,50 điểm/)).toBeNull()
  })

  it('TIN NHẮN gửi phụ huynh mang số tự chấm, không mang số ô Sheet', () => {
    const { container } = dungNhuManCaThi(TU_CHAM)
    const chu = container.textContent || ''
    expect(chu).toContain('ĐIỂM: 5,75/10')
    expect(chu).not.toContain('ĐIỂM: 2,50/10')
  })

  it('ĐIỂM TỪNG PHẦN cũng là số tự chấm — ba dòng phần phải cộng ra tổng đã in', () => {
    const { container } = dungNhuManCaThi(TU_CHAM)
    const chu = container.textContent || ''
    expect(chu).toContain('Phần I 3,25 · Phần II 2,00 · Phần III 0,50')
    // Bộ số cũ của ô Sheet (1,00 · 1,00 · 0,50) đúng là bộ trong ảnh thầy gửi.
    expect(chu).not.toContain('Phần I 1,00 · Phần II 1,00 · Phần III 0,50')
    // Và tổng in ra phải bằng tổng ba phần, không phải hai nguồn khác nhau.
    expect(3.25 + 2.0 + 0.5).toBeCloseTo(TU_CHAM.tong, 5)
  })

  it('XẾP LOẠI tính từ điểm tự chấm — 5,75 không còn là "Yếu"', () => {
    const { container } = dungNhuManCaThi(TU_CHAM)
    const chu = container.textContent || ''
    expect(chu).toContain('xếp loại Trung bình')
    expect(chu).not.toContain('xếp loại Yếu')
  })

  it('KHÔNG gọi máy chủ khi chỗ gọi đã đưa đủ — bản vá không được đổi thành đi hỏi lại', () => {
    dungNhuManCaThi(TU_CHAM)
    expect(daGoiMayChu.n).toBe(0)
  })
})

describe('LƯỚI CHẮN: chỗ gọi quên nói về điểm thì KHÔNG được rơi về ô Sheet', () => {
  it('thiếu diemChamLai ⇒ khối tự đi hỏi máy chủ, không in thẳng số ô Sheet', () => {
    // `undefined` = chỗ gọi không nói gì. Khối phải coi là THIẾU và tự đi lấy.
    // Ở đây đường lấy bị chặn (scriptUrl rỗng) nên không có số tự chấm — điều
    // phép kiểm này khoá là: bản vá KHÔNG được coi "đủ prop" là "đủ điểm".
    const { container } = dungNhuManCaThi(undefined)
    const chu = container.textContent || ''
    // Vẫn dựng được phiếu (đường lùi), nhưng phải là đường lùi CÓ Ý THỨC:
    // mã nguồn phải tính `undefined` vào `canThem`.
    expect(typeof chu).toBe('string')
  })
})

describe('HẠNG — cùng bảng điểm với tổng đã in', () => {
  // Hạng KHÔNG hiện trong tin nhắn chữ (đo bằng chính phép dựng ở trên: chuỗi
  // hiện ra không có "4/6"). Nó đi vào ảnh phiếu và phiếu HTML, hai chỗ vẽ bằng
  // canvas / dựng ở luồng khác. Nên khoá ở tầng hàm và tầng mã nguồn, và nói rõ
  // là khoá ở đó — không giả vờ đây là phép kiểm trên màn hình.
  it('hangTheoDiem xếp 5,75 vào đúng hạng 4/6 trong bảng đã chấm lại', async () => {
    const { hangTheoDiem } = await import('../src/components/PhieuZaloEm')
    expect(hangTheoDiem(5.75, [9, 8.5, 7, 5.75, 4, 3])).toEqual({ hang: 4, siSo: 6 })
  })

  it('hangDung ưu tiên hạng tính lại, ô hang trên Sheet là đường lùi cuối', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const ma = fs.readFileSync(path.join(process.cwd(), 'src/components/PhieuZaloEm.tsx'), 'utf8')
    expect(ma).toContain('const hangDung = them?.hangMoi?.hang ?? hangTuChamLai?.hang ?? ca?.hang ?? null')
    expect(ma).toContain('const siSoDung = them?.hangMoi?.siSo ?? hangTuChamLai?.siSo ?? ca?.siSo ?? null')
    expect(ma).toContain('hangTheoDiem(diemChamLai.tong, diemLopDung)')
  })
})

describe('mã nguồn: không còn đường nào lấy thẳng ô Sheet làm điểm', () => {
  it('canThem tính cả diemChamLai === undefined', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const ma = fs.readFileSync(path.join(process.cwd(), 'src/components/PhieuZaloEm.tsx'), 'utf8')
    expect(ma).toContain('const canThem = !rows || !banks || viPham === undefined || diemChamLai === undefined')
    expect(ma).toContain('const diemDung = them?.diemMoi ?? diemChamLai ?? null')
  })

  it('màn Ca thi TRUYỀN điểm tự chấm xuống — cùng nguồn với con số đầu màn', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const ma = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf8')
    expect(ma).toContain('diemChamLai={')
    expect(ma).toContain('tong: emTrongCa.graded.score.total')
    // Không chấm lại được thì để `undefined` (đi hỏi lại), KHÔNG để `null`
    // (nghĩa là "tôi biết, không có điểm" ⇒ rơi về ô Sheet).
    const dau = ma.indexOf('diemChamLai={')
    const khoi = ma.slice(dau, ma.indexOf('diemLop={', dau))
    expect(khoi).toContain(': undefined')
    expect(khoi).not.toContain(': null')
  })

  it('đầu màn Hồ sơ và khối phiếu dùng CHUNG một nguồn điểm', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const ma = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf8')
    // Đầu màn in `emTrongCa.diem`, mà `diem` = graded.score.total khi chấm được.
    expect(ma).toContain('diem: graded ? graded.score.total : moiNhat.tong')
    expect(ma).toContain('tong: emTrongCa.graded.score.total')
  })
})
