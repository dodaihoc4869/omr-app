// TẠO PHIẾU CẢ CA — tiêu chí nghiệm thu 4 của APP-CAN-MO-DUONG-CHO-COWORK.md:
// "mọi em đã nộp đều có mã; gọi lại lần hai KHÔNG tạo thêm phiếu trùng".
//
// Chạy đúng `taoPhieuCaCa` thật, chỉ thay MÁY CHỦ bằng một máy chủ giả giữ
// trong bộ nhớ. Kho đề, phép chấm, phép dựng phiếu đều là hàng thật — mock tới
// đó là còn kiểm được gì nữa.
import { describe, expect, it, beforeEach, vi } from 'vitest'
import type { TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../src/data/examContent'
import { assignStudentQuestions } from '../src/lib/exam-assign'

const MA_CA = '313816'
const GOC = 'https://dodaihoc4869.github.io/omr-app/'

const mcq = (n: number, correct: 'A' | 'B' | 'C' | 'D'): TeacherMcqQuestion => ({
  id: `Q-I-${n}`,
  text: `Câu ${n}`,
  choices: ['a', 'b', 'c', 'd'],
  correct,
  chuyenDe: n % 2 ? 'Este – lipid' : 'Cân bằng hoá học',
  mucDo: 'hieu',
})
const tf = (n: number): TeacherTrueFalseQuestion => ({ id: `Q-II-${n}`, text: `ĐS ${n}`, ideas: ['1', '2', '3', '4'], correct: ['D', 'S', 'D', 'S'], chuyenDe: 'Điện hoá', mucDo: 'hieu' })
const sa = (n: number): TeacherShortAnswerQuestion => ({ id: `Q-III-${n}`, text: `TLN ${n}`, correct: '12,5', chuyenDe: 'Este – lipid', mucDo: 'van_dung' })

const BANK = [{ maDe: MA_CA, phanI: [mcq(1, 'A'), mcq(2, 'B'), mcq(3, 'C')], phanII: [tf(1)], phanIII: [sa(1)] }]

/** KHO ĐỀ để rút bài luyện. Không có kho thì `phieu.baiTap` rỗng và phiếu bài
 * tập không được dựng — đúng hành vi, nên test phải cấp kho thật. */
const KHO = [
  {
    maDe: 'KHO-1',
    phanI: Array.from({ length: 12 }, (_, i) => ({
      id: `K-I-${i}`,
      text: `Câu luyện ${i}`,
      choices: ['a', 'b', 'c', 'd'],
      correct: 'A' as const,
      chuyenDe: i % 2 ? 'Este – lipid' : 'Cân bằng hoá học',
      mucDo: (i < 4 ? 'biet' : i < 8 ? 'hieu' : 'van_dung') as 'biet' | 'hieu' | 'van_dung',
    })),
    phanII: [],
    phanIII: [],
  },
]

/** Bài làm của một em: đúng hết phần I, sai phần III. */
function dapAnCua(sbd: string) {
  const asg = assignStudentQuestions(BANK[0], MA_CA, sbd)
  const phanI: Record<string, string> = {}
  asg.phanI.forEach((a) => {
    phanI[a.qid] = (a.question as TeacherMcqQuestion).correct
  })
  return {
    phanI,
    phanII: { [asg.phanII[0].qid]: ['D', 'S', 'D', 'S'] as ('D' | 'S' | null)[] },
    phanIII: { [asg.phanIII[0].qid]: 'sai' },
  }
}

function luot(sbd: string, hoTen: string) {
  return {
    sbd,
    lanThu: 1,
    hoTen,
    trangThai: 'da_nop' as const,
    nopLuc: '2026-09-06T02:25:23.638Z',
    vaoLuc: '2026-09-06T02:00:00.000Z',
    dapAn: dapAnCua(sbd),
    giayCau: null,
    soLanRoiMan: 0,
    tongGiayRoiMan: 0,
    integrity: null,
    tong: null,
  }
}

// ---------------------------------------------------------------------------
// MÁY CHỦ GIẢ

interface HangPhieu {
  ma: string
  maCa: string
  sbd: string
  hoTen: string
  taoLuc: string
  soLanXem: number
  xemLanCuoi: string
  loai: 'ketqua' | 'baitap'
  phieu: unknown
}
const kho: { phieu: HangPhieu[]; soLanLuu: number; soLanHoSo: number } = { phieu: [], soLanLuu: 0, soLanHoSo: 0 }
const DS_EM = [
  ['11004', 'Nguyễn Sơn Tùng'],
  ['11005', 'Trần Bảo An'],
  ['11006', 'Lê Minh Quân'],
]

vi.mock('../src/lib/exam-db', () => ({
  coMaBiMatPhien: () => true,
  loadTeacherSecret: async () => 'MA-THAT',
  loadScriptUrl: async () => 'https://may-chu-gia/exec',
  docSoCauCa: async () => undefined,
  loadExamSources: async () => KHO,
  loadSessionTeacherBank: async () => BANK,
  luuSoCauCa: async () => {},
  saveSessionTeacherBank: async () => {},
}))

// SBD bị rút khỏi DanhSachLop — tiêu chí 6 đổi biến này chứ không vá module.
let boKhoiDanhSach = ''
vi.mock('../src/lib/classlist-db', () => ({
  loadClassList: async () =>
    DS_EM.filter(([sbd]) => sbd !== boKhoiDanhSach).map(([sbd, hoTen]) => ({ sbd, hoTen, namSinh: '2010', lop: '11A1', sdt: '' })),
}))

vi.mock('../src/lib/exam-api', async () => {
  const that = await vi.importActual<typeof import('../src/lib/exam-api')>('../src/lib/exam-api')
  return {
    ...that,
    chiTietCa: async () => ({
      ca: { maCa: MA_CA, tenCa: 'Test24', lop: '11A1', thoiGianPhut: 45, nguongLan: 3, nguongGiay: 10 },
      luot: DS_EM.map(([sbd, ten]) => luot(sbd, ten)),
      keyBank: null,
    }),
    phieuTheoCa: async () => kho.phieu.map((p) => ({ ...p })),
    hoSoNhieuEm: async (_u: string, _m: string, sbd: string[]) => {
      kho.soLanHoSo += 1
      return sbd.map((s) => ({
        em: { sbd: s, hoTen: DS_EM.find((x) => x[0] === s)?.[1] ?? '', namSinh: '2010', lop: '11A1' },
        chuyenDe: [],
        ca: [],
        caGanNhat: null,
        chuyenDeCaGanNhat: [],
        soCauSaiCaGanNhat: 0,
      }))
    },
    luuNhieuPhieu: async (_u: string, _m: string, ds: { ma: string; maCa: string; sbd: string; hoTen: string; phieu: unknown; loai?: string }[]) => {
      kho.soLanLuu += 1
      const nay = new Date().toISOString()
      for (const d of ds) {
        // ĐÈ THEO MÃ, đúng như máy chủ thật: `luuPhieu` ghi vào hàng có mã đó.
        // Mock cũ luôn `push` nên không đo được việc dựng lại có thật sự thay
        // nội dung của mã cũ hay không.
        const hang = { ma: d.ma, maCa: d.maCa, sbd: d.sbd, hoTen: d.hoTen, taoLuc: nay, soLanXem: 0, xemLanCuoi: '', loai: (d.loai === 'baitap' ? 'baitap' : 'ketqua') as HangPhieu['loai'], phieu: d.phieu }
        const i = kho.phieu.findIndex((x) => x.ma === d.ma)
        if (i >= 0) kho.phieu[i] = { ...kho.phieu[i], ...hang, taoLuc: kho.phieu[i].taoLuc }
        else kho.phieu.push(hang)
      }
      return { daLuu: ds.map((d) => ({ sbd: d.sbd, ma: d.ma })), loi: [] }
    },
  }
})

const { taoPhieuCaCa, hangTrongCa } = await import('../src/lib/phieu-ca-ca')

beforeEach(() => {
  kho.phieu = []
  kho.soLanLuu = 0
  kho.soLanHoSo = 0
  boKhoiDanhSach = ''
})

describe('Tiêu chí 4 — taoPhieuCaCa dựng đủ và KHÔNG dựng trùng', () => {
  it('lần đầu: mọi em đã nộp đều có mã phiếu', async () => {
    const kq = await taoPhieuCaCa('u', 'm', MA_CA, GOC)
    expect(kq.dong).toHaveLength(3)
    expect(kq.soMoi).toBe(3)
    expect(kq.loi).toEqual([])
    for (const d of kq.dong) {
      expect(d.ma).toMatch(/^[A-Za-z0-9_-]{8,40}$/)
      expect(d.link).toBe(`${GOC}p#${d.ma}`)
      expect(d.hoTen).not.toBe('')
    }
    expect(new Set(kq.dong.map((d) => d.ma)).size).toBe(3)
  })

  it('GỌI LẠI LẦN HAI: không tạo thêm phiếu nào, mã giữ nguyên', async () => {
    const lan1 = await taoPhieuCaCa('u', 'm', MA_CA, GOC)
    // Ba em × hai phiếu (kết quả + bài tập).
    expect(kho.phieu).toHaveLength(6)
    const luuSauLan1 = kho.soLanLuu

    const lan2 = await taoPhieuCaCa('u', 'm', MA_CA, GOC)
    expect(lan2.soMoi).toBe(0)
    expect(kho.phieu).toHaveLength(6)
    // Không gọi lệnh lưu lần nào nữa, cũng không xin hồ sơ nữa.
    expect(kho.soLanLuu).toBe(luuSauLan1)
    expect(kho.soLanHoSo).toBe(1)
    // Và mã trả về đúng mã cũ, theo đúng từng em.
    const maLan1 = new Map(lan1.dong.map((d) => [d.sbd, d.ma]))
    for (const d of lan2.dong) expect(d.ma).toBe(maLan1.get(d.sbd))
  })

  it('thêm MỘT em mới thì chỉ dựng cho đúng em đó', async () => {
    await taoPhieuCaCa('u', 'm', MA_CA, GOC)
    kho.phieu = kho.phieu.filter((p) => p.sbd !== '11006')
    kho.soLanLuu = 0
    const kq = await taoPhieuCaCa('u', 'm', MA_CA, GOC)
    expect(kq.soMoi).toBe(1)
    expect(kq.dong).toHaveLength(3)
    expect(kho.soLanLuu).toBe(1)
  })

  it('em đã có phiếu thì giữ số lần xem của bản cũ, không bị đặt lại về 0', async () => {
    await taoPhieuCaCa('u', 'm', MA_CA, GOC)
    const kqCu = kho.phieu.find((p) => p.loai === 'ketqua')!
    kqCu.soLanXem = 4
    const kq = await taoPhieuCaCa('u', 'm', MA_CA, GOC)
    const d = kq.dong.find((x) => x.sbd === kqCu.sbd)!
    expect(d.soLanXem).toBe(4)
  })
})

describe('Tiêu chí 6 — em NGOÀI DanhSachLop không bị bỏ im lặng', () => {
  it('vẫn có dòng và vẫn có phiếu, họ tên lấy từ lượt thi', async () => {
    const { loadClassList } = await import('../src/lib/classlist-db')
    boKhoiDanhSach = '11004'
    // Chứng minh phép thử KHÔNG rỗng: em này thật sự đã biến khỏi danh sách lớp.
    expect((await loadClassList()).some((x) => x.sbd === '11004')).toBe(false)

    const kq = await taoPhieuCaCa('u', 'm', MA_CA, GOC)
    const d = kq.dong.find((x) => x.sbd === '11004')
    expect(d).toBeDefined()
    expect(d!.ma).toMatch(/^[A-Za-z0-9_-]{8,40}$/)
    // Không có trong danh sách lớp thì lấy tên em đã khai lúc vào thi.
    expect(d!.hoTen).toBe('Nguyễn Sơn Tùng')
    expect(kq.dong).toHaveLength(3)
  })
})

describe('Hạng lớp — một chỗ tính, đồng điểm đồng hạng', () => {
  it('ba em 9 · 9 · 7 ra hạng 1 · 1 · 3', () => {
    const h = hangTrongCa([
      { sbd: 'a', diem: 9 },
      { sbd: 'b', diem: 9 },
      { sbd: 'c', diem: 7 },
    ])
    expect(h.get('a')).toBe(1)
    expect(h.get('b')).toBe(1)
    expect(h.get('c')).toBe(3)
  })
})

describe('Màn Chi tiết ca dùng CHUNG lõi này, không chép lại', () => {
  it('ExamMonitorScreen gọi dungPhieuChoEm chứ không tự dựng phiếu', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const man = readFileSync(resolve(__dirname, '../src/screens/ExamMonitorScreen.tsx'), 'utf8')
    expect(man).toContain("import { dungPhieuChoEm } from '../lib/phieu-ca-ca'")
    expect(man).toContain('dungPhieuChoEm(')
    // Không còn bản chép: màn hình không được tự gọi `dungPhieu`/`luuNhieuPhieu`.
    expect(man).not.toContain('luuNhieuPhieu(')
    expect(man).not.toContain('sinhMaPhieu()')
  })
})

describe('Hồi quy 06/09 — báo cáo mất hai nút copy link đề và lời giải', () => {
  it('mỗi em được cất HAI phiếu: kết quả và bài tập', async () => {
    await taoPhieuCaCa('u', 'm', MA_CA, GOC)
    const kq = kho.phieu.filter((p) => p.loai === 'ketqua')
    const bt = kho.phieu.filter((p) => p.loai === 'baitap')
    expect(kq).toHaveLength(3)
    expect(bt).toHaveLength(3)
    // Mã khác nhau hết — không em nào dùng chung một mã cho hai loại.
    expect(new Set(kho.phieu.map((p) => p.ma)).size).toBe(6)
  })

  it('phiếu kết quả MANG linkBaiTap trỏ đúng mã phiếu bài tập của chính em đó', async () => {
    await taoPhieuCaCa('u', 'm', MA_CA, GOC)
    for (const sbd of ['11004', '11005', '11006']) {
      const kq = kho.phieu.find((p) => p.sbd === sbd && p.loai === 'ketqua')!
      const bt = kho.phieu.find((p) => p.sbd === sbd && p.loai === 'baitap')!
      const link = (kq.phieu as { linkBaiTap?: string }).linkBaiTap
      expect(link, sbd).toBe(`${GOC}p#${bt.ma}`)
    }
  })

  it('DÒNG LINK trả về chỉ có phiếu KẾT QUẢ — không lẫn link bài tập', async () => {
    const r = await taoPhieuCaCa('u', 'm', MA_CA, GOC)
    expect(r.dong).toHaveLength(3)
    const maBt = new Set(kho.phieu.filter((p) => p.loai === 'baitap').map((p) => p.ma))
    for (const d of r.dong) expect(maBt.has(d.ma)).toBe(false)
    // Và mỗi em đúng một dòng.
    expect(new Set(r.dong.map((d) => d.sbd)).size).toBe(3)
  })

  it('gói bài tập đủ trường màn báo cáo cần', async () => {
    await taoPhieuCaCa('u', 'm', MA_CA, GOC)
    const bt = kho.phieu.find((p) => p.loai === 'baitap')!
    const g = bt.phieu as { v: number; loai: string; tt: Record<string, unknown>; cau: unknown[] }
    expect(g.loai).toBe('baitap')
    expect(g.v).toBeGreaterThan(0)
    expect(g.cau.length).toBeGreaterThan(0)
    expect(String(g.tt.hoTen)).not.toBe('')
    expect(g.tt.hienDapAn).toBe(false)
  })
})


// ---------------------------------------------------------------------------
// EM CÓ HAI PHIẾU KẾT QUẢ — thầy bắt được 07/09 trên dữ liệu thật.
//
// Có em mang hai phiếu kết quả cho cùng một ca: một cái do lượt dựng hàng loạt
// tạo, một cái do mở hồ sơ riêng của em tạo thêm. Bản cũ chỉ giữ ĐÚNG MỘT mã
// trong `maCu` nên lượt dựng lại chỉ đè được một cái; cái còn lại giữ nguyên
// nội dung cũ.
//
// Đo trên kho thật: 19 phiếu kết quả cho 15 em, và 3 phiếu vẫn mang gói cũ —
// không có `poolChua`, không có `sao`, không có nhãn `chuaCho`. Thầy đã gửi phụ
// huynh mã nào thì không ai biết, nên phải đè lên TẤT CẢ.
describe('em có nhiều phiếu cùng loại', () => {
  it('dựng lại đè lên MỌI mã của em đó, không bỏ sót mã nào', async () => {
    // Lượt 1: dựng phiếu cho cả ca.
    await taoPhieuCaCa('https://may-chu-gia/exec', 'MA-THAT', MA_CA, 'https://app/', () => {})
    const maLan1 = kho.phieu.filter((p) => p.loai === 'ketqua' && p.sbd === '11004').map((p) => p.ma)
    expect(maLan1).toHaveLength(1)

    // Em 11004 được mở hồ sơ riêng, sinh THÊM một phiếu kết quả nữa.
    kho.phieu.push({
      ma: 'MA-CU-THEM',
      maCa: MA_CA,
      sbd: '11004',
      hoTen: 'Nguyễn Sơn Tùng',
      taoLuc: '2020-01-01T00:00:00.000Z',
      soLanXem: 0,
      xemLanCuoi: '',
      loai: 'ketqua',
      phieu: { v: 0, danhDau: 'GOI-CU' },
    })

    // Lượt 2: dựng lại.
    await taoPhieuCaCa('https://may-chu-gia/exec', 'MA-THAT', MA_CA, 'https://app/', () => {}, true)

    const cua11004 = kho.phieu.filter((p) => p.loai === 'ketqua' && p.sbd === '11004')
    // Không đẻ mã mới: vẫn đúng hai mã cũ.
    expect(cua11004.map((p) => p.ma).sort()).toEqual([...maLan1, 'MA-CU-THEM'].sort())
    // CẢ HAI đều phải mang gói mới — không mã nào còn `danhDau: 'GOI-CU'`.
    for (const p of cua11004) {
      expect((p.phieu as { danhDau?: string }).danhDau, `mã ${p.ma} còn giữ gói cũ`).toBeUndefined()
      expect((p.phieu as { sbd?: string }).sbd).toBe('11004')
    }
  })

  it('vẫn chỉ trả MỘT dòng link mỗi em, là mã mới nhất', async () => {
    await taoPhieuCaCa('https://may-chu-gia/exec', 'MA-THAT', MA_CA, 'https://app/', () => {})
    const maMoi = kho.phieu.find((p) => p.loai === 'ketqua' && p.sbd === '11004')!.ma
    // ĐẶT MÃ CŨ LÊN ĐẦU danh sách. Không có chỗ này thì test đúng do ăn may:
    // thứ tự sẵn có đã để mã mới trước, nên bỏ hẳn bước xếp theo `taoLuc` vẫn
    // xanh — tôi đã phá mã để thử và nó lọt.
    kho.phieu.unshift({
      ma: 'MA-CU-2',
      maCa: MA_CA,
      sbd: '11004',
      hoTen: 'Nguyễn Sơn Tùng',
      taoLuc: '2020-01-01T00:00:00.000Z',
      soLanXem: 0,
      xemLanCuoi: '',
      loai: 'ketqua',
      phieu: { v: 0 },
    })
    const kq = await taoPhieuCaCa('https://may-chu-gia/exec', 'MA-THAT', MA_CA, 'https://app/', () => {}, true)
    const dong = kq.dong.filter((d) => d.sbd === '11004')
    expect(dong).toHaveLength(1)
    // Mã mới nhất đứng đầu — `MA-CU-2` có `taoLuc` năm 2020 nên không được chọn.
    expect(dong[0].ma).toBe(maMoi)
  })
})
