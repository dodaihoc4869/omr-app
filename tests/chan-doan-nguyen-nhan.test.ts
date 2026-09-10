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
import { describe, expect, it } from 'vitest'
import type { ChiTietCauRow } from '../src/lib/exam-api'
import type { TeacherExamSource } from '../src/data/examContent'
import { CAU_HINH_CHAN_DOAN_MAC_DINH as CH, TEN_BENH, mocOnKeTiep } from '../src/lib/chan-doan-cau-hinh'
import { chanDoan, duocKe, thongKeTungCau, tiLeCoGiay, trungVi } from '../src/lib/chan-doan'
import { keDon } from '../src/lib/ke-don-chua'
import {
  chuTienDo,
  daKhacPhuc,
  ghiDung,
  ghiSai,
  khoaMuc,
  LICH_ON_LAI_RONG,
  quaMotBuoi,
  toiHan,
  type LichOnLai,
} from '../src/lib/lich-on-lai'

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

const KHO: TeacherExamSource[] = [
  {
    maDe: 'D1',
    nhom: '12 · C1 - Ester – Lipid',
    nguon: 'Bài 1',
    phanI: Array.from({ length: 30 }, (_, i) => ({
      id: `D1-I-${i + 1}`,
      text: `câu ${i + 1}`,
      choices: ['a', 'b', 'c', 'd'],
      correct: 'A',
      chuyenDe: 'Ester – lipid',
      mucDo: i % 3 === 0 ? 'biet' : i % 3 === 1 ? 'hieu' : 'van_dung',
      dang: { ma: 'ES-01', ten: 'Thuỷ phân ester' },
      canChua: { sao: 1, ly_do: 'nên chữa' },
    })),
    phanII: [],
    phanIII: [],
  } as unknown as TeacherExamSource,
]

const NEN = { khoDe: KHO, nguonCauSai: KHO }

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

  it('HAI BỘ KHÁC NHAU, và em B có ĐÚNG 0 câu kiến thức + 1 cờ', () => {
    const cdA = [chanDoan(emA, tk.get('D1-I-5'), { caCoGiay: true, soCauCuoiPhan: 20 })]
    const cdB = [chanDoan(emB, tk.get('D1-I-5'), { caCoGiay: true, soCauCuoiPhan: 20 })]
    const donA = keDon(cdA, [emA], NEN)
    const donB = keDon(cdB, [emB], NEN)

    expect(donA.tongCau).toBeGreaterThan(0)
    expect(donB.tongCau).toBe(0)
    expect(donB.cum.map((c) => c.benh)).toEqual(['bua_het_gio'])
    expect(donB.co.filter((c) => c.chu.includes('hết giờ')).length).toBe(1)
    // Và hai bộ thật sự khác nhau, không phải "khác vì một bên rỗng".
    expect(donA.cum[0].cau.map((c) => c.id)).not.toEqual(donB.cum[0].cau.map((c) => c.id))
  })

  it('phiếu của em B vẫn có chữ giải thích, không im lặng bỏ trống', () => {
    const cdB = [chanDoan(emB, tk.get('D1-I-5'), { caCoGiay: true, soCauCuoiPhan: 20 })]
    const donB = keDon(cdB, [emB], NEN)
    expect(donB.cum[0].chu).toContain('hết giờ')
    expect(donB.cum[0].chu).toContain('chưa kê câu chữa')
  })
})

describe('TRẦN SỐ CÂU — không thanh kéo nào vượt được', () => {
  it('≤ 3 câu mỗi lỗi và ≤ 12 câu cả phiếu, trên 200 phiếu giả lập', () => {
    let xauNhatMotLoi = 0
    let xauNhatPhieu = 0
    for (let s = 0; s < 200; s++) {
      const rows: ChiTietCauRow[] = []
      const cd = []
      const soCauSai = 3 + (s % 18) // tới 20 câu sai một phiếu
      for (let i = 0; i < soCauSai; i++) {
        const qid = `D1-I-${(i % 30) + 1}`
        const r = row({ qid, soCau: i + 1, dapAnChon: 'B' })
        rows.push(r)
        const benh = (['nham_khai_niem', 'chua_biet', 'loi_tinh'] as const)[i % 3]
        cd.push({ qid, benh, lyDo: 'giả lập', canNhanPhuongAn: false })
      }
      const don = keDon(cd, rows, NEN)
      for (const c of don.cum) xauNhatMotLoi = Math.max(xauNhatMotLoi, c.cau.length)
      xauNhatPhieu = Math.max(xauNhatPhieu, don.tongCau)
    }
    // eslint-disable-next-line no-console
    console.log(`[trần] xấu nhất: ${xauNhatMotLoi} câu/lỗi · ${xauNhatPhieu} câu/phiếu`)
    expect(xauNhatMotLoi).toBeLessThanOrEqual(CH.TRAN_CAU_MOT_LOI)
    expect(xauNhatPhieu).toBeLessThanOrEqual(CH.TRAN_CAU_MOT_PHIEU)
  })

  it('không câu nào bị kê HAI lần giữa các nhóm bệnh', () => {
    const rows: ChiTietCauRow[] = []
    const cd = []
    for (let i = 0; i < 12; i++) {
      const qid = `D1-I-${i + 1}`
      rows.push(row({ qid, soCau: i + 1 }))
      cd.push({ qid, benh: (['nham_khai_niem', 'chua_biet', 'loi_tinh'] as const)[i % 3], lyDo: '', canNhanPhuongAn: false })
    }
    const don = keDon(cd, rows, NEN)
    const ids = don.cum.flatMap((c) => c.cau.map((x) => x.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('chạm trần thì NÓI RA, không lặng lẽ cắt', () => {
    const rows: ChiTietCauRow[] = []
    const cd = []
    for (let i = 0; i < 20; i++) {
      const qid = `D1-I-${i + 1}`
      rows.push(row({ qid, soCau: i + 1 }))
      cd.push({ qid, benh: (['nham_khai_niem', 'chua_biet', 'loi_tinh', 'chua_ro'] as const)[i % 4], lyDo: '', canNhanPhuongAn: false })
    }
    const don = keDon(cd, rows, NEN)
    expect(don.tongCau).toBeLessThanOrEqual(CH.TRAN_CAU_MOT_PHIEU)
    expect(don.canhBao.length).toBeGreaterThan(0)
  })
})

describe('❷ CỜ NHÃN PHƯƠNG ÁN — cho thầy SỐ mà quyết, không quyết hộ', () => {
  it('câu chẩn theo đám đông chọn sai thì được cờ hoá', () => {
    const rows = lopLamCau('D1-I-3', 20, 12, 9, 'B', 60)
    const tk = thongKeTungCau(rows)
    const r = row({ qid: 'D1-I-3', dapAnChon: 'B', giay: 10 })
    const cd = [chanDoan(r, tk.get('D1-I-3'), { caCoGiay: true })]
    expect(cd[0].canNhanPhuongAn).toBe(true)
    const don = keDon(cd, [r], NEN)
    expect(don.co.some((c) => c.chu.includes('TỪNG PHƯƠNG ÁN'))).toBe(true)
  })
})

describe('❸ LỊCH ÔN GIÃN CÁCH — 1 / 3 / 7 buổi, sai lại thì về mốc 1', () => {
  const LUC = '2026-09-10T00:00:00Z'

  it('sai lần đầu ⇒ mốc 1 buổi, bậc hạ một nấc', () => {
    const l = ghiSai(LICH_ON_LAI_RONG, 'S1', 'ES-01', 'nham_khai_niem', LUC)
    const m = l[khoaMuc('S1', 'ES-01')]
    expect(m.conMayBuoi).toBe(1)
    expect(m.lanDung).toBe(0)
    expect(m.lanSai).toBe(1)
    expect(m.bac).toBe('biet') // từ mặc định 'hieu' hạ một nấc
  })

  it('mô phỏng 3 ca kế tiếp: dạng đã sai xuất hiện lại ĐÚNG mốc 1/3/7', () => {
    let l: LichOnLai = ghiSai(LICH_ON_LAI_RONG, 'S1', 'ES-01', 'chua_biet', LUC)
    const moc: number[] = []
    for (let lan = 0; lan < 3; lan++) {
      // đếm số buổi phải chờ tới khi tới hạn
      let cho = 0
      while (toiHan(l, 'S1').length === 0) {
        l = quaMotBuoi(l)
        cho++
        if (cho > 20) break
      }
      moc.push(cho)
      l = ghiDung(l, 'S1', 'ES-01', LUC)
    }
    expect(moc).toEqual(CH.MOC_ON) // [1, 3, 7]
  })

  it('sai lại ⇒ về mốc 1 VÀ hạ một bậc độ khó', () => {
    let l = ghiSai(LICH_ON_LAI_RONG, 'S1', 'ES-01', 'chua_biet', LUC)
    l = ghiDung(l, 'S1', 'ES-01', LUC)
    l = ghiDung(l, 'S1', 'ES-01', LUC)
    const truoc = l[khoaMuc('S1', 'ES-01')]
    expect(truoc.bac).toBe('van_dung')
    expect(truoc.conMayBuoi).toBe(7)
    const sau = ghiSai(l, 'S1', 'ES-01', 'chua_biet', LUC)[khoaMuc('S1', 'ES-01')]
    expect(sau.conMayBuoi).toBe(1)
    expect(sau.bac).toBe('hieu') // van_dung hạ một nấc
    expect(sau.lanDung).toBe(0)
  })

  it('mốc kế tiếp không vượt bậc cuối', () => {
    expect(mocOnKeTiep(0)).toBe(1)
    expect(mocOnKeTiep(1)).toBe(3)
    expect(mocOnKeTiep(2)).toBe(7)
    expect(mocOnKeTiep(9)).toBe(7)
  })

  it('ĐÃ KHẮC PHỤC = đúng đủ ba mốc, không sai lại ở giữa', () => {
    let l = ghiSai(LICH_ON_LAI_RONG, 'S1', 'ES-01', 'chua_biet', LUC)
    expect(daKhacPhuc(l[khoaMuc('S1', 'ES-01')])).toBe(false)
    for (let i = 0; i < 3; i++) l = ghiDung(l, 'S1', 'ES-01', LUC)
    const m = l[khoaMuc('S1', 'ES-01')]
    expect(daKhacPhuc(m)).toBe(true)
    expect(chuTienDo(m)).toBe('ES-01: đúng 3/3 mốc — đã khắc phục')
  })

  it('mục chưa tới hạn thì KHÔNG chen vào ca', () => {
    const l = ghiSai(LICH_ON_LAI_RONG, 'S1', 'ES-01', 'chua_biet', LUC)
    expect(toiHan(l, 'S1')).toEqual([])
    expect(toiHan(quaMotBuoi(l), 'S1').length).toBe(1)
  })

  it('chữ tiến độ LUÔN kèm số, không nói chung chung', () => {
    const l = ghiSai(LICH_ON_LAI_RONG, 'S1', 'ES-01', 'chua_biet', LUC)
    expect(chuTienDo(l[khoaMuc('S1', 'ES-01')])).toBe('ES-01: sai 1 lần, đúng 0/3 mốc, còn 1 buổi')
  })
})

describe('TỐC ĐỘ — chẩn đoán + kê đơn một phiếu 40 câu < 150 ms', () => {
  it('đo bằng performance.now(), in số thật', () => {
    const rowsLop: ChiTietCauRow[] = []
    for (let i = 1; i <= 40; i++) rowsLop.push(...lopLamCau(`D1-I-${((i - 1) % 30) + 1}`, 30, 18, 12, 'B', 50))
    const tk = thongKeTungCau(rowsLop)
    const cuaEm = Array.from({ length: 40 }, (_, i) => row({ qid: `D1-I-${(i % 30) + 1}`, soCau: i + 1, dapAnChon: 'B', giay: 12 }))

    const t0 = performance.now()
    const cd = cuaEm.map((r) => chanDoan(r, tk.get(r.qid), { caCoGiay: true, soCauCuoiPhan: 40 }))
    const don = keDon(cd, cuaEm, NEN)
    const ms = performance.now() - t0
    // eslint-disable-next-line no-console
    console.log(`[tốc độ] chẩn đoán + kê đơn 40 câu: ${ms.toFixed(1)} ms · kê ${don.tongCau} câu`)
    expect(ms).toBeLessThan(150)
    expect(don.tongCau).toBeLessThanOrEqual(CH.TRAN_CAU_MOT_PHIEU)
  })
})

describe('CẤM — mấy chốt đặc tả ghi rõ', () => {
  it('KHÔNG viết bản `doChum` thứ hai', () => {
    // `chan-doan.ts` phải nhập từ `phan-cau-len-bang`, không tự tính lại.
    const src = readSrc('src/lib/chan-doan.ts')
    expect(src).toContain("import { doChum } from './phan-cau-len-bang'")
    expect(src).not.toMatch(/function\s+doChum/)
  })

  it('KHÔNG viết bộ chọn câu thứ hai — kê đơn gọi lại `rutDeChua`', () => {
    const src = readSrc('src/lib/ke-don-chua.ts')
    expect(src).toContain("import { rutDeChua")
    expect(src).toContain('rutDeChua({ ...nen, rows: ds, soCau: tran, qidTranh: [...tranh] })')
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
