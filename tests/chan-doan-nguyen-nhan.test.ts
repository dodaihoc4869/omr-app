// ĐỊNH NGHĨA HOÀN THÀNH của RUT-CAU-CHUA-THEO-NGUYEN-NHAN.md.
//
// Mỗi `describe` là một dòng trong bảng nghiệm thu của đặc tả. Không dòng nào là
// lời hứa.
//
// ============ BA CÂU HỎI CUỐI ĐẶC TẢ — TÔI TỰ CHỐT, KHAI Ở ĐÂY ==============
//
// Đặc tả kết bằng ba câu hỏi cho thầy; thầy giao "tự sửa sao cho hợp lý nhất,
// không cần hỏi". Chốt và căn cứ nằm đầy đủ trong `chan-doan-cau-hinh.ts`:
//   ❶ dùng số giây, nhưng qua HAI cổng (cả ca, và từng em theo `TongGiayRoiMan`);
//   ❷ chưa cho AI gán nhãn mức từng phương án — cờ hoá để thầy có số mà quyết;
//   ❸ câu ôn lại CHỜ THẦY DUYỆT, không tự chèn vào ca.
// Và một chốt nữa: hàng đợi ôn cất ở máy thầy, KHÔNG thêm cột vào `TienDoHS`.
//
// 27/10: bộ kê đơn `ke-don-chua` và lịch ôn `lich-on-lai` gỡ vì không màn nào dùng ⇒ các mục chỉ chạy hai tệp ấy bỏ theo.
import { describe, expect, it } from 'vitest'
import type { ChiTietCauRow } from '../src/lib/exam-api'
import { CAU_HINH_CHAN_DOAN_MAC_DINH as CH, TEN_BENH, mocOnKeTiep } from '../src/lib/chan-doan-cau-hinh'
import { chanDoan, duocKe, thongKeTungCau, tiLeCoGiay, trungVi } from '../src/lib/chan-doan'

// --------------------------------------------------------------- dựng dữ liệu

function row(o: Partial<ChiTietCauRow> & { qid: string }): ChiTietCauRow {
  return {
    phan: 'I',
    soCau: 1,
    chuyenDe: 'Ester – lipid',
    mucDo: 'hieu',
    dapAnChon: 'B',
    dapAnDung: 'A',
    dungSai: false,
    giay: 40,
    ...o,
  }
}

/** Cả lớp làm một câu: `n` em, `soSai` em sai, trong đó `soChum` em cùng chọn `pa`.
 *
 * Phần sai CÒN LẠI phải rải đều BA phương án chứ không phải hai — đây là chỗ tôi
 * viết hụt lần đầu và một phép kiểm đỏ oan: rải hai phương án thì 12 em sai ra
 * 5/5, độ chụm 0,42 > ngưỡng 0,35, tức "rải rác" của tôi vẫn là chụm. Rải ba thì
 * 12 em sai ra 4/4/4 = 0,33, dưới ngưỡng, đúng nghĩa rải rác. */
function lopLamCau(qid: string, n: number, soSai: number, soChum: number, pa = 'B', giay = 40): ChiTietCauRow[] {
  const SAI3 = ['B', 'C', 'D']
  const KHAC = SAI3.filter((x) => x !== pa)
  const ra: ChiTietCauRow[] = []
  for (let i = 0; i < n; i++) {
    const sai = i < soSai
    // `soChum === 0` = KHÔNG có đám đông: rải đều CẢ BA phương án sai.
    // `soChum > 0`   = đúng `soChum` em chọn `pa`, phần còn lại rải HAI phương án
    //                  kia, nên độ chụm ra đúng `soChum / soSai` chứ không lệch.
    const chon = sai ? (soChum === 0 ? SAI3[i % 3] : i < soChum ? pa : KHAC[(i - soChum) % 2]) : 'A'
    ra.push(row({ qid, dungSai: !sai, dapAnChon: chon, giay }))
  }
  return ra
}

// =========================================================================
describe('CÔNG CỤ NỀN — sai ở đây thì mọi chẩn đoán sai theo', () => {
  it('trung vị đúng với mảng chẵn và lẻ', () => {
    expect(trungVi([10, 20, 30])).toBe(20)
    expect(trungVi([10, 20, 30, 40])).toBe(25)
    expect(trungVi([])).toBe(0)
  })

  it('tỉ lệ có giây đếm đúng — cổng CẢ CA dựa vào nó', () => {
    expect(tiLeCoGiay([{ giay: 10 }, { giay: null }, { giay: 20 }, { giay: 0 }])).toBe(0.5)
    expect(tiLeCoGiay([])).toBe(0)
  })

  it('thống kê từng câu: số em làm, trung vị, phương án đám đông sai', () => {
    const tk = thongKeTungCau(lopLamCau('Q1', 20, 12, 9, 'B', 30)).get('Q1')!
    expect(tk.soEmLam).toBe(20)
    expect(tk.trungViGiay).toBe(30)
    expect(tk.chumChon).toBe('B')
    expect(tk.doChum).toBeCloseTo(9 / 12, 6)
  })
})

describe('KHÔNG ĐOÁN — thiếu dữ liệu thì nói thiếu, không kết luận', () => {
  it('lớp dưới 8 em ⇒ `thieu_du_lieu`, không tính độ chụm', () => {
    const rows = lopLamCau('Q1', 5, 4, 4)
    const tk = thongKeTungCau(rows).get('Q1')
    const kq = chanDoan(rows[0], tk, { caCoGiay: true })
    expect(kq.benh).toBe('thieu_du_lieu')
    expect(kq.lyDo).toContain('dưới 8')
  })

  it('ca thiếu giây ⇒ TẮT luật thời gian, chỉ còn tín hiệu phương án', () => {
    const rows = lopLamCau('Q1', 20, 12, 9, 'B')
    const tk = thongKeTungCau(rows).get('Q1')
    const nham = chanDoan(row({ qid: 'Q1', dapAnChon: 'B' }), tk, { caCoGiay: false })
    expect(nham.benh).toBe('nham_khai_niem')
    expect(nham.lyDo).toContain('ca này thiếu số giây làm bài')
    // Không trùng đám đông thì KHÔNG được đoán bừa.
    const raiRac = chanDoan(row({ qid: 'Q1', dapAnChon: 'D' }), tk, { caCoGiay: false })
    expect(raiRac.benh).toBe('chua_ro')
  })

  it('❶ CỔNG TỪNG EM: em rời màn quá lâu thì giây của em ấy hết nghĩa', () => {
    // 12 em sai rải đều ba phương án ⇒ độ chụm 0,33 < 0,35, đúng nghĩa rải rác.
    const rows = lopLamCau('Q1', 20, 12, 0, 'B', 100)
    const tk = thongKeTungCau(rows).get('Q1')
    expect(tk!.doChum).toBeLessThan(CH.CHUM_TI_LE)
    const bc = { caCoGiay: true, soCauCuoiPhan: 10 }
    // Làm 5 giây trên trung vị 100, cuối bài, phương án rải rác ⇒ bừa/hết giờ.
    const coGio = chanDoan(row({ qid: 'Q1', dapAnChon: 'D', giay: 5, soCau: 10 }), tk, bc)
    expect(coGio.benh).toBe('bua_het_gio')
    // Cùng dữ liệu ấy nhưng em rời màn 300 giây ⇒ KHÔNG được kết luận theo giờ.
    const roiMan = chanDoan(row({ qid: 'Q1', dapAnChon: 'D', giay: 5, soCau: 10 }), tk, { ...bc, giayRoiMan: 300 })
    expect(roiMan.benh).toBe('chua_ro')
    expect(roiMan.lyDo).toContain('rời màn 300 giây')
  })

  it('bỏ trống luôn là `chua_biet`, không cần đồng hồ', () => {
    const rows = lopLamCau('Q1', 20, 12, 9)
    const tk = thongKeTungCau(rows).get('Q1')
    expect(chanDoan(row({ qid: 'Q1', dapAnChon: '' }), tk, { caCoGiay: false }).benh).toBe('chua_biet')
  })
})

describe('BỐN LOẠI LỖI — bảng lõi của đặc tả', () => {
  const rows = lopLamCau('Q1', 20, 12, 9, 'B', 60)
  const tk = thongKeTungCau(rows).get('Q1')

  it('nhanh + trùng phương án đám đông sai ⇒ NHẦM KHÁI NIỆM', () => {
    const kq = chanDoan(row({ qid: 'Q1', dapAnChon: 'B', giay: 10 }), tk, { caCoGiay: true })
    expect(kq.benh).toBe('nham_khai_niem')
    expect(kq.canNhanPhuongAn).toBe(true)
  })

  it('nhanh + rải rác + cuối bài ⇒ BỪA / HẾT GIỜ', () => {
    const kq = chanDoan(row({ qid: 'Q1', dapAnChon: 'D', giay: 10, soCau: 19 }), tk, { caCoGiay: true, soCauCuoiPhan: 20 })
    expect(kq.benh).toBe('bua_het_gio')
  })

  it('nhanh + rải rác nhưng ĐẦU bài ⇒ chưa rõ, KHÔNG gán bừa', () => {
    const kq = chanDoan(row({ qid: 'Q1', dapAnChon: 'D', giay: 10, soCau: 2 }), tk, { caCoGiay: true, soCauCuoiPhan: 20 })
    expect(kq.benh).toBe('chua_ro')
  })

  it('chậm + Phần III lệch dưới 15% ⇒ LỖI TÍNH', () => {
    const kq = chanDoan(
      row({ qid: 'Q1', phan: 'III', dapAnChon: '5,4', dapAnDung: '5,7', giay: 200 }),
      tk,
      { caCoGiay: true },
    )
    expect(kq.benh).toBe('loi_tinh')
  })

  it('chậm + lệch XA đáp án ⇒ KHÔNG phải lỗi tính', () => {
    const kq = chanDoan(
      row({ qid: 'Q1', phan: 'III', dapAnChon: '99', dapAnDung: '5,7', giay: 200 }),
      tk,
      { caCoGiay: true, soCauSaiCungDang: 3 },
    )
    expect(kq.benh).toBe('chua_biet')
  })

  it('chậm + sai ≥ 2 câu cùng dạng ⇒ CHƯA BIẾT', () => {
    const kq = chanDoan(row({ qid: 'Q1', dapAnChon: 'D', giay: 200 }), tk, { caCoGiay: true, soCauSaiCungDang: 2 })
    expect(kq.benh).toBe('chua_biet')
  })

  it('chỉ ba bệnh được kê câu; hai bệnh thiếu dữ liệu thì không', () => {
    expect(duocKe('nham_khai_niem')).toBe(true)
    expect(duocKe('loi_tinh')).toBe(true)
    expect(duocKe('chua_biet')).toBe(true)
    expect(duocKe('bua_het_gio')).toBe(false)
    expect(duocKe('thieu_du_lieu')).toBe(false)
    expect(duocKe('chua_ro')).toBe(false)
  })
})

describe('CÙNG CÂU, KHÁC NGUYÊN NHÂN ⇒ KHÁC BỘ CHỮA — tiêu chí số 1', () => {
  const rows = lopLamCau('D1-I-5', 20, 12, 9, 'B', 60)
  const tk = thongKeTungCau(rows)

  const emA = row({ qid: 'D1-I-5', dapAnChon: 'B', giay: 10, soCau: 5 }) // nhanh + trùng đám đông
  const emB = row({ qid: 'D1-I-5', dapAnChon: 'D', giay: 8, soCau: 19 }) // rất nhanh + rải rác + cuối bài

  it('em A ra nhầm khái niệm, em B ra bừa/hết giờ', () => {
    expect(chanDoan(emA, tk.get('D1-I-5'), { caCoGiay: true, soCauCuoiPhan: 20 }).benh).toBe('nham_khai_niem')
    expect(chanDoan(emB, tk.get('D1-I-5'), { caCoGiay: true, soCauCuoiPhan: 20 }).benh).toBe('bua_het_gio')
  })

})

describe('❷ CỜ NHÃN PHƯƠNG ÁN — cho thầy SỐ mà quyết, không quyết hộ', () => {
  it('câu chẩn theo đám đông chọn sai thì được cờ hoá', () => {
    const rows = lopLamCau('D1-I-3', 20, 12, 9, 'B', 60)
    const tk = thongKeTungCau(rows)
    const r = row({ qid: 'D1-I-3', dapAnChon: 'B', giay: 10 })
    const cd = [chanDoan(r, tk.get('D1-I-3'), { caCoGiay: true })]
    expect(cd[0].canNhanPhuongAn).toBe(true)
  })
})

describe('❸ LỊCH ÔN GIÃN CÁCH — 1 / 3 / 7 buổi, sai lại thì về mốc 1', () => {
  it('mốc kế tiếp không vượt bậc cuối', () => {
    expect(mocOnKeTiep(0)).toBe(1)
    expect(mocOnKeTiep(1)).toBe(3)
    expect(mocOnKeTiep(2)).toBe(7)
    expect(mocOnKeTiep(9)).toBe(7)
  })

})

describe('TỐC ĐỘ — chẩn đoán một phiếu 40 câu < 150 ms (phần kê đơn `ke-don-chua` đã gỡ 27/10)', () => {
  it('đo bằng performance.now(), in số thật', () => {
    const rowsLop: ChiTietCauRow[] = []
    for (let i = 1; i <= 40; i++) rowsLop.push(...lopLamCau(`D1-I-${((i - 1) % 30) + 1}`, 30, 18, 12, 'B', 50))
    const tk = thongKeTungCau(rowsLop)
    const cuaEm = Array.from({ length: 40 }, (_, i) => row({ qid: `D1-I-${(i % 30) + 1}`, soCau: i + 1, dapAnChon: 'B', giay: 12 }))

    const t0 = performance.now()
    const cd = cuaEm.map((r) => chanDoan(r, tk.get(r.qid), { caCoGiay: true, soCauCuoiPhan: 40 }))
    const ms = performance.now() - t0
    // eslint-disable-next-line no-console
    console.log(`[tốc độ] chẩn đoán 40 câu: ${ms.toFixed(1)} ms · ${cd.length} chẩn đoán`)
    expect(ms).toBeLessThan(150)
  })
})

describe('CẤM — mấy chốt đặc tả ghi rõ', () => {
  it('KHÔNG viết bản `doChum` thứ hai', () => {
    // `chan-doan.ts` phải nhập từ `phan-cau-len-bang`, không tự tính lại.
    const src = readSrc('src/lib/chan-doan.ts')
    expect(src).toContain("import { doChum } from './phan-cau-len-bang'")
    expect(src).not.toMatch(/function\s+doChum/)
  })

  it('KHÔNG thêm cột nào vào `TienDoHS` — chốt của tôi thay cho đặc tả', () => {
    const gs = readSrc('docs/apps-script-kiem-tra.gs')
    expect(gs).toContain("const TIENDO_HS_HEADERS = ['SBD', 'ChuyenDe', 'SoCau', 'SoSai', 'CapNhatLuc']")
    expect(gs).not.toContain('MocOn')
    expect(gs).not.toContain('LanDung')
  })

  it('mọi tên bệnh đều có chữ tiếng Việt để hiện ra màn', () => {
    for (const b of Object.keys(TEN_BENH)) expect(TEN_BENH[b as keyof typeof TEN_BENH].length).toBeGreaterThan(3)
  })
})

function readSrc(p: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs') as typeof import('node:fs')
  const path = require('node:path') as typeof import('node:path')
  return fs.readFileSync(path.join(process.cwd(), p), 'utf8')
}
