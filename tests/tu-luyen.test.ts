// ĐỊNH NGHĨA HOÀN THÀNH của LINK-BAI-LUYEN.md mục 8.
//
// Phép kiểm số 1 là quan trọng nhất: phản hồi `layTuLuyen` KHÔNG được chứa một
// chuỗi đáp án nào. Em mở công cụ nhà phát triển là thấy phản hồi mạng; còn một
// khoá lọt ra là lộ đáp án trước khi làm, và số liệu thu về thành rác.
import { describe, expect, it } from 'vitest'
import gsCode from '../docs/apps-script-kiem-tra.gs?raw'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'
import {
  KHOA_BI_MAT,
  RE_MA_TU_LUYEN,
  SO_BUOI_VE_COT,
  batDauCuaLan,
  cauDung,
  chamTuLuyen,
  cuaCau,
  docLinkTuLuyen,
  goDapAn,
  khoaBiRo,
  nhanNutGiao,
  taoLinkTuLuyen,
  tomTatTuLuyen,
  type BuoiTuLuyen,
  type CauNhe,
} from '../src/lib/tu-luyen'

interface Gs {
  goDapAnTuLuyen_: (cau: unknown[]) => Record<string, unknown>[]
  chamTuLuyen_: (cau: unknown[], chon: Record<string, string>) => { qid: string; dung: boolean }[]
  cauDungTuLuyen_: (phan: string, chon: string, dapAn: string) => boolean
  cuaCauTuLuyen_: <T>(cau: T[], batDau: number, soCau: number) => T[]
  TULUYEN_HEADERS: string[]
  TULUYEN_KHOA_BI_MAT: string[]
}
const gs: Gs = new Function(
  `${gsCode}\nreturn { goDapAnTuLuyen_, chamTuLuyen_, cauDungTuLuyen_, cuaCauTuLuyen_, TULUYEN_HEADERS, TULUYEN_KHOA_BI_MAT }`,
)()

function cau(id: string, phan: 'I' | 'II' | 'III', dapAn: string, chuyenDe = 'Este', mucDo: 'biet' | 'hieu' | 'van_dung' = 'hieu'): CauLuyen {
  return {
    phan,
    id,
    chuyenDe,
    mucDo,
    text: `Đề ${id}`,
    luaChon: phan === 'III' ? null : ['a', 'b', 'c', 'd'],
    dapAn,
    chot: `Chốt ${id}`,
    lyDo: null,
    buoc: [`Bước 1 của ${id}`],
    ketQua: `KQ ${id}`,
  }
}

const BO: CauLuyen[] = [
  cau('q1', 'I', 'A'),
  cau('q2', 'I', 'C'),
  cau('q3', 'II', 'DSDS', 'Amin'),
  cau('q4', 'III', '12,5', 'Amin', 'van_dung'),
  cau('q5', 'I', 'B', 'Este', 'biet'),
]

describe('1. KHÔNG RÒ ĐÁP ÁN — phép kiểm quan trọng nhất (mục 2.3)', () => {
  it('goDapAn gỡ sạch năm khoá, quét thẳng chuỗi JSON', () => {
    const an = goDapAn(BO)
    expect(khoaBiRo(an)).toEqual([])
    // còn đủ thứ em cần để làm bài
    expect(an[0].text).toBe('Đề q1')
    expect(an[0].luaChon).toEqual(['a', 'b', 'c', 'd'])
    expect(an[2].chuyenDe).toBe('Amin')
  })

  it('bản đầy đủ thì khoaBiRo phải BẮT được — nếu không thì phép kiểm vô dụng', () => {
    expect(khoaBiRo(BO).sort()).toEqual([...KHOA_BI_MAT].sort())
  })

  it('Apps Script gỡ giống hệt máy thầy — hai bên không được hiểu khác nhau', () => {
    const anGs = gs.goDapAnTuLuyen_(BO as unknown as unknown[])
    expect(khoaBiRo(anGs)).toEqual([])
    expect(JSON.parse(JSON.stringify(anGs))).toEqual(JSON.parse(JSON.stringify(goDapAn(BO))))
    expect(gs.TULUYEN_KHOA_BI_MAT.sort()).toEqual([...KHOA_BI_MAT].sort())
  })

  it('khoá lọt ở tầng sâu cũng bị bắt — quét chuỗi chứ không duyệt một tầng', () => {
    expect(khoaBiRo({ a: { b: [{ dapAn: 'A' }] } })).toEqual(['dapAn'])
  })
})

describe('2. CHẤM ĐÚNG — tay tính lại', () => {
  // q1 chọn A (đúng) · q2 chọn D (sai) · q3 chọn DSDS (đúng) · q4 gõ "12.5"
  // (đúng, dấu phẩy quy về dấu chấm) · q5 bỏ trống (sai) ⇒ 3/5.
  const chon = { q1: 'A', q2: 'D', q3: 'DSDS', q4: '12.5' }

  it('máy thầy chấm ra 3/5', () => {
    const c = chamTuLuyen(BO, chon)
    expect(c.filter((x) => x.dung).length).toBe(3)
    expect(c.map((x) => x.dung)).toEqual([true, false, true, true, false])
  })

  it('Apps Script chấm ra ĐÚNG KẾT QUẢ ẤY — máy chủ mới là nơi chấm thật', () => {
    const c = gs.chamTuLuyen_(BO as unknown as unknown[], chon)
    expect(c.filter((x) => x.dung).length).toBe(3)
    expect(c.map((x) => x.dung)).toEqual([true, false, true, true, false])
  })

  it('luật từng phần khớp taoChiTietCau của ca thi, không nới không siết', () => {
    // I: phải chọn, và chọn đúng chữ
    expect(cauDung('I', '', 'A')).toBe(false)
    expect(cauDung('I', 'A', 'A')).toBe(true)
    // II: đúng khi CẢ BỐN Ý khớp
    expect(cauDung('II', 'DSDS', 'DSDS')).toBe(true)
    expect(cauDung('II', 'DSD-', 'DSDS')).toBe(false)
    expect(cauDung('II', 'DSDD', 'DSDS')).toBe(false)
    // III: bỏ trống là sai; dấu phẩy quy về dấu chấm
    expect(cauDung('III', '', '12.5')).toBe(false)
    expect(cauDung('III', ' 12,5 ', '12.5')).toBe(true)
    expect(cauDung('III', '12.50', '12.5')).toBe(false)
    for (const [p, c, d] of [
      ['I', '', 'A'],
      ['II', 'DSD-', 'DSDS'],
      ['III', ' 12,5 ', '12.5'],
    ] as const) {
      expect(gs.cauDungTuLuyen_(p, c, d)).toBe(cauDung(p, c, d))
    }
  })
})

describe('CỬA SỔ CÂU — giao lần 2 không ra đúng đề cũ', () => {
  const ds = ['a', 'b', 'c', 'd', 'e']

  it('mỗi lần giao dịch sang cửa sổ kế tiếp', () => {
    expect(batDauCuaLan(0, 2)).toBe(0)
    expect(batDauCuaLan(1, 2)).toBe(2)
    expect(batDauCuaLan(3, 10)).toBe(30)
    expect(cuaCau(ds, batDauCuaLan(0, 2), 2)).toEqual(['a', 'b'])
    expect(cuaCau(ds, batDauCuaLan(1, 2), 2)).toEqual(['c', 'd'])
  })

  it('quay vòng khi hết gói, không trả bài rỗng', () => {
    expect(cuaCau(ds, 4, 2)).toEqual(['e', 'a'])
    expect(cuaCau(ds, 12, 3)).toEqual(['c', 'd', 'e'])
  })

  it('soCau ≤ 0 hoặc lớn hơn gói ⇒ lấy trọn gói', () => {
    expect(cuaCau(ds, 0, 0)).toEqual(ds)
    expect(cuaCau(ds, 2, 99)).toEqual(ds)
    expect(cuaCau([], 0, 3)).toEqual([])
  })

  it('Apps Script cắt giống hệt — lệch là em làm câu này mà máy chủ chấm câu khác', () => {
    for (const [b, n] of [
      [0, 2],
      [2, 2],
      [4, 2],
      [12, 3],
      [0, 0],
      [2, 99],
    ] as const) {
      expect(gs.cuaCauTuLuyen_(ds, b, n)).toEqual(cuaCau(ds, b, n))
    }
  })
})

describe('LINK', () => {
  it('đường /tl, mã sau dấu #, số câu sau dấu ~', () => {
    expect(taoLinkTuLuyen('https://vi.du/omr-app/', 'Abc123XyZq', 10)).toBe('https://vi.du/omr-app/tl#Abc123XyZq~10')
    expect(taoLinkTuLuyen('https://vi.du/omr-app', 'Abc123XyZq')).toBe('https://vi.du/omr-app/tl#Abc123XyZq')
  })

  it('đọc lại được cả mã lẫn số câu', () => {
    expect(docLinkTuLuyen('#Abc123XyZq~10')).toEqual({ ma: 'Abc123XyZq', soCau: 10 })
    expect(docLinkTuLuyen('Abc123XyZq')).toEqual({ ma: 'Abc123XyZq', soCau: null })
  })

  it('10. mã sai định dạng và mã không tồn tại trả CÙNG MỘT câu — không lộ quy tắc mã', () => {
    // Bên máy: mã hỏng thì trả mã rỗng, màn hiện đúng câu "Không tìm thấy".
    expect(docLinkTuLuyen('#abc').ma).toBe('')
    expect(docLinkTuLuyen('#' + 'x'.repeat(60)).ma).toBe('')
    expect(docLinkTuLuyen('#Abc 123').ma).toBe('')
    // Bên máy chủ: cùng một chuỗi lỗi cho cả hai ca.
    const soLanLoi = (gsCode.match(/error: TULUYEN_LOI/g) || []).length
    expect(soLanLoi).toBeGreaterThanOrEqual(4)
    expect(RE_MA_TU_LUYEN.test('Abc123XyZq')).toBe(true)
  })
})

describe('5 + 6. TÁCH HẲN KHỎI CA THI — không đụng bảng nào của ca', () => {
  const khoiTuLuyen = gsCode.slice(gsCode.indexOf("if (action === 'taoTuLuyen')"), gsCode.indexOf("if (action === 'diemTuLuyen')"))

  it('nộp bài tự luyện KHÔNG tạo LuotThi, KHÔNG tạo ca, KHÔNG ghi điểm', () => {
    for (const cam of ['SHEET_LUOT', 'SHEET_CA', 'SHEET_CHITIET', 'sheetCa_', 'docLuot_']) {
      expect(khoiTuLuyen).not.toContain(cam)
    }
  })

  it('KHÔNG cộng dồn sang bảng mạnh–yếu của ca thi (thầy chốt 05/09)', () => {
    // Ở nhà em được mở sách vở tra cứu; trong lớp thì không. Trộn hai thang đo
    // vào một bảng là bảng mạnh–yếu nói dối thầy.
    for (const cam of ['ghiTienDo_', 'SHEET_TIENDO_CA', 'SHEET_TIENDO_HS', 'SHEET_QID']) {
      expect(khoiTuLuyen).not.toContain(cam)
    }
  })

  it('sheet riêng đủ mười bốn cột', () => {
    expect(gs.TULUYEN_HEADERS).toEqual([
      'Ma', 'SBD', 'HoTen', 'TaoLuc', 'SoCau', 'ChuyenDeJson', 'HanXem', 'LanThu', 'NopLuc', 'SoDung', 'SoCauLam', 'ChiTietJson', 'IdThietBi', 'GhiChu',
    ])
  })

  it('layTuLuyen và nopTuLuyen KHÔNG đòi mã bí mật; taoTuLuyen và danhSachTuLuyen thì có', () => {
    const cat = (a: string, b: string) => gsCode.slice(gsCode.indexOf(a), gsCode.indexOf(b))
    expect(cat("if (action === 'taoTuLuyen')", "if (action === 'layTuLuyen'")).toContain('kiemTraMaBiMat_')
    expect(cat("if (action === 'layTuLuyen'", "if (action === 'diemTuLuyen')")).not.toContain('kiemTraMaBiMat_')
    expect(cat("if (action === 'diemTuLuyen')", "if (action === 'danhSachTuLuyen')")).not.toContain('kiemTraMaBiMat_')
    expect(cat("if (action === 'danhSachTuLuyen')", "if (action === 'xoaTuLuyen')")).toContain('kiemTraMaBiMat_')
  })
})

describe('TỔNG HỢP — một bộ số cho cả biểu đồ đầu trang lẫn báo cáo phụ huynh', () => {
  const c = (chuyenDe: string, mucDo: string, phan: 'I' | 'II' | 'III', dung: boolean): CauNhe => ({
    qid: `${chuyenDe}-${mucDo}-${phan}-${dung}-${Math.random()}`,
    phan,
    chuyenDe,
    mucDo,
    chon: 'A',
    dung,
  })
  const buoi: BuoiTuLuyen[] = [
    { ma: 'm1', nopLuc: '2026-09-01T10:00:00Z', soCau: 4, soDung: 1, lanThu: 1, cau: [c('Este', 'biet', 'I', true), c('Este', 'hieu', 'I', false), c('Amin', 'van_dung', 'III', false), c('Amin', 'hieu', 'II', false)] },
    { ma: 'm2', nopLuc: '2026-09-03T10:00:00Z', soCau: 4, soDung: 3, lanThu: 1, cau: [c('Este', 'biet', 'I', true), c('Este', 'hieu', 'I', true), c('Amin', 'van_dung', 'III', false), c('Amin', 'hieu', 'II', true)] },
  ]

  it('tổng và tỉ lệ đúng là tay tính lại', () => {
    const t = tomTatTuLuyen(buoi)
    expect(t.soBuoi).toBe(2)
    expect(t.tongCau).toBe(8)
    expect(t.tongDung).toBe(4)
    expect(t.tiLeDung).toBe(0.5)
  })

  it('cột xếp CŨ → MỚI, buổi mới nhất đứng cuối', () => {
    const t = tomTatTuLuyen(buoi)
    expect(t.cot.map((x) => x.ma)).toEqual(['m1', 'm2'])
    expect(t.moiNhat?.ma).toBe('m2')
    expect(t.moiNhat?.tiLeDung).toBe(0.75)
  })

  it('chuyên đề cộng cả hai buổi, YẾU NHẤT lên trước', () => {
    const t = tomTatTuLuyen(buoi)
    // Este 3/4 · Amin 1/4 ⇒ Amin đứng trước
    expect(t.chuyenDe.map((x) => [x.ten, x.soDung, x.soCau])).toEqual([
      ['Amin', 1, 4],
      ['Este', 3, 4],
    ])
  })

  it('mức độ giữ đúng thứ tự nhận thức, không xếp theo số', () => {
    const t = tomTatTuLuyen(buoi)
    expect(t.theoMucDo.map((x) => x.ten)).toEqual(['Nhận biết', 'Thông hiểu', 'Vận dụng'])
  })

  it('theo phần đề giữ thứ tự I · II · III', () => {
    const t = tomTatTuLuyen(buoi)
    expect(t.theoPhan.map((x) => x.ten)).toEqual(['Trắc nghiệm', 'Đúng/Sai', 'Trả lời ngắn'])
  })

  it('chưa buổi nào thì trả bộ RỖNG, không bịa số', () => {
    const t = tomTatTuLuyen([])
    expect(t).toMatchObject({ soBuoi: 0, tongCau: 0, tongDung: 0, tiLeDung: 0, moiNhat: null })
    expect(t.cot).toEqual([])
    expect(t.chuyenDe).toEqual([])
  })

  it('nhiều buổi hơn trần thì chỉ vẽ những buổi gần nhất', () => {
    const nhieu = Array.from({ length: SO_BUOI_VE_COT + 4 }, (_, i) => ({
      ma: `m${i}`,
      nopLuc: new Date(Date.UTC(2026, 8, i + 1)).toISOString(),
      soCau: 2,
      soDung: 1,
      lanThu: 1,
      cau: [c('Este', 'hieu', 'I', true), c('Este', 'hieu', 'I', false)],
    }))
    const t = tomTatTuLuyen(nhieu)
    expect(t.cot).toHaveLength(SO_BUOI_VE_COT)
    expect(t.soBuoi).toBe(SO_BUOI_VE_COT + 4) // tổng vẫn đếm đủ
    expect(t.cot[t.cot.length - 1].ma).toBe(`m${SO_BUOI_VE_COT + 3}`)
  })
})

describe('NHÃN NÚT GIAO — con nộp rồi thì lần sau là giao TIẾP', () => {
  it('lần đầu là copy link, các lần sau đánh số', () => {
    expect(nhanNutGiao(0)).toBe('Copy link gửi ĐỀ cho con')
    expect(nhanNutGiao(1)).toBe('Giao tiếp lần 2')
    expect(nhanNutGiao(4)).toBe('Giao tiếp lần 5')
  })
})

describe('MÀN LÀM BÀI — không mang luật ca thi sang', () => {
  it('CẤM khoá bài, CẤM giữ để đọc, CẤM đồng hồ đếm ngược', async () => {
    const man = (await import('../src/screens/TuLuyenScreen.tsx?raw')).default
    for (const cam of ['khoaVi', 'man-thi-sach', 'giu-de-doc', 'chong-gian-lan', 'do-dau-vet', 'remaining']) {
      expect(man).not.toContain(cam)
    }
  })

  it('dùng chung TheCau với màn thi — không dựng thẻ câu thứ hai', async () => {
    const man = (await import('../src/screens/TuLuyenScreen.tsx?raw')).default
    expect(man).toContain("import TheCau from '../components/TheCau'")
    expect(man).toContain('cheDo: (xemLai ? \'xem_lai\' : \'thi\')')
  })

  it('biểu đồ tổng hợp các buổi trước luôn ở ĐẦU TRANG (thầy chốt 05/09)', async () => {
    const man = (await import('../src/screens/TuLuyenScreen.tsx?raw')).default
    const iBieuDo = man.indexOf('<BieuDoTuLuyen')
    const iCau = man.indexOf('de.cau.map')
    expect(iBieuDo).toBeGreaterThan(0)
    expect(iBieuDo).toBeLessThan(iCau)
  })

  it('lời giải CHỈ dựng từ dữ liệu trả về SAU khi nộp', async () => {
    const man = (await import('../src/screens/TuLuyenScreen.tsx?raw')).default
    expect(man).toContain('loiGiai: dayDu ?')
    expect(man).toContain('dayDuTheoQid = new Map((kq?.cau ?? [])')
  })
})
