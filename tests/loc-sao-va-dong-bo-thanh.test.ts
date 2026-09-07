// HAI YÊU CẦU CỦA THẦY 07/09, mỗi cái một khối nghiệm thu.
//
//   1. "tất cả chỗ rút đề thêm lựa chọn câu 2 sao (khó) 1 sao (bản chất) nữa"
//   2. "đồng bộ phần rút câu ở đây sang hai chỗ báo cáo phụ huynh và học sinh"
//
// Yêu cầu 2 KHÔNG đo được bằng cách so hai ảnh màn hình. Đo bằng cách chặn ở
// gốc: cả ba màn phải lấy số và câu chữ từ đúng một file, và không màn nào
// được tự viết lại công thức sàn/trần hay tự gõ lại câu giải thích.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { hopSao, demSao, soCauHopSao, LOC_SAO_MAC_DINH, MOI_LOC_SAO, TEN_LOC_SAO } from '../src/lib/loc-sao'
import { soLieuThanhChua, cauGiaiThichThanh, cauCanhBaoHetHang, cauKhongRutDuoc } from '../src/lib/noi-dung-thanh-chua'
import { rutDeChua } from '../src/lib/rut-de-chua'
import { rutBaiTap } from '../src/lib/bai-tap'
import { chonCauLuyen } from '../src/lib/bai-tap-pdf'
import type { TeacherExamSource } from '../src/data/examContent'
import type { ChiTietCauRow } from '../src/lib/exam-api'

const doc = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8')
const MA = 'ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG'
const TEN = 'Thuỷ phân ester trong base, tính khối lượng'

const cau = (id: string, sao: 0 | 1 | 2) => ({
  id,
  text: `Đề ${id}`,
  choices: ['a', 'b', 'c', 'd'] as [string, string, string, string],
  correct: 'A' as const,
  chuyenDe: 'Ester – lipid',
  mucDo: 'hieu' as const,
  dang: { ma: MA, ten: TEN },
  canChua: { sao, dk: [], ly_do: '', bay: null },
})

const kho = (cs: unknown[]): TeacherExamSource[] =>
  [{ maDe: 'D1', ngayNap: '2026-09-07', phanI: cs, phanII: [], phanIII: [] } as unknown as TeacherExamSource]

const row = (soCau: number, qid: string, dung = false): ChiTietCauRow => ({
  phan: 'I',
  soCau,
  qid,
  chuyenDe: 'Ester – lipid',
  mucDo: 'hieu',
  dapAnChon: 'B',
  dapAnDung: 'A',
  dungSai: dung,
  giay: 30,
})

// ---------------------------------------------------------------- yêu cầu 1
describe('lọc sao — 2 sao (khó) và 1 sao (bản chất)', () => {
  it('ba lựa chọn, mặc định KHÔNG lọc', () => {
    expect(MOI_LOC_SAO).toEqual(['moi', 'sao_2', 'sao_1'])
    expect(LOC_SAO_MAC_DINH).toBe('moi')
    // Mặc định lọc sẵn là âm thầm bỏ mất phần lớn kho mà không ai bấm gì.
    expect(hopSao(0, LOC_SAO_MAC_DINH)).toBe(true)
    expect(TEN_LOC_SAO.sao_2).toContain('2 sao')
    expect(TEN_LOC_SAO.sao_1).toContain('1 sao')
  })

  it('hopSao nhận đúng mức, câu chưa gắn sao chỉ vào khi Mọi mức', () => {
    expect(hopSao(2, 'sao_2')).toBe(true)
    expect(hopSao(1, 'sao_2')).toBe(false)
    expect(hopSao(0, 'sao_2')).toBe(false)
    expect(hopSao(1, 'sao_1')).toBe(true)
    expect(hopSao(undefined, 'sao_1')).toBe(false)
    expect(hopSao(undefined, 'moi')).toBe(true)
  })

  it('đếm từng mức để màn hình báo TRƯỚC khi thầy bấm', () => {
    const d = demSao([{ sao: 2 }, { sao: 2 }, { sao: 1 }, { sao: 0 }, {}])
    expect(d).toEqual({ sao2: 2, sao1: 1, sao0: 2 })
    expect(soCauHopSao(d, 'sao_2')).toBe(2)
    expect(soCauHopSao(d, 'sao_1')).toBe(1)
    expect(soCauHopSao(d, 'moi')).toBe(5)
  })

  it('CỔNG RÚT CÂU CHỮA lọc theo sao, và trần tụt theo', () => {
    const k = kho([cau('s1', 0), cau('a1', 2), cau('a2', 2), cau('b1', 1), cau('c1', 0)])
    const moi = rutDeChua({ khoDe: k, rows: [row(2, 's1')], soCau: 10 })
    expect(moi.tongUngVien).toBe(4)
    const hai = rutDeChua({ khoDe: k, rows: [row(2, 's1')], soCau: 10, locSao: 'sao_2' })
    expect(hai.tongUngVien).toBe(2)
    expect(hai.cau.filter((c) => !c.chuaCho?.laLamLai).map((c) => c.id).sort()).toEqual(['a1', 'a2'])
    const mot = rutDeChua({ khoDe: k, rows: [row(2, 's1')], soCau: 10, locSao: 'sao_1' })
    expect(mot.cau.filter((c) => !c.chuaCho?.laLamLai).map((c) => c.id)).toEqual(['b1'])
  })

  it('câu sai KHÔNG bị lọc theo sao — em sai câu 0 sao vẫn phải được chữa', () => {
    // `s1` là 0 sao. Lọc "chỉ 2 sao" mà loại luôn câu sai thì em mất chữa hẳn.
    const k = kho([cau('s1', 0), cau('a1', 2), cau('a2', 2)])
    const kq = rutDeChua({ khoDe: k, rows: [row(2, 's1')], soCau: 10, locSao: 'sao_2' })
    expect(kq.poolTheoCauSai[0].pool).toBe(2)
    expect(kq.thieu.map((t) => t.vi).join(' ')).not.toContain('chưa gắn dạng')
  })

  it('RÚT TỰ DO cũng lọc theo sao', () => {
    const k = kho([cau('a1', 2), cau('b1', 1), cau('c1', 0)])
    const chiHai = chonCauLuyen(k, { chuyenDe: [], sao: 'sao_2', soCau: 10, ngauNhien: () => 0 })
    expect(chiHai.cau.map((c) => c.id)).toEqual(['a1'])
  })

  it('RÚT ĐỀ CHO CA cũng lọc theo sao', () => {
    const k = kho([cau('a1', 2), cau('b1', 1), cau('c1', 0)])
    const kq = rutBaiTap(k, { chuyenDe: [], mucDo: 'tron', sao: 'sao_1', soCau: 10, ngauNhien: () => 0 })
    expect(kq.bank.phanI.map((c) => c.id)).toEqual(['b1'])
  })

  it('mọi màn rút câu đều có hàng nút Mức sao', () => {
    for (const f of [
      'src/components/NutBaiTapPdf.tsx',
      'src/components/GiaoBaiTap.tsx',
      'src/components/KhoiRutDe.tsx',
      'src/screens/GoiLenBangScreen.tsx',
      'src/screens/PhieuScreen.tsx',
    ]) {
      expect(doc(f), `${f} thiếu hàng nút Mức sao`).toContain('MOI_LOC_SAO')
    }
  })
})

// ---------------------------------------------------------------- yêu cầu 2
describe('ba màn rút câu nói cùng một con số và cùng một câu chữ', () => {
  it('sàn – trần – kim: một hàm duy nhất', () => {
    expect(soLieuThanhChua({ soCau: 10, soCauSai: 3, coSan: 60 })).toEqual({ san: 3, tran: 60, n: 10, hienThanh: true })
    // Kim không được tụt dưới sàn.
    expect(soLieuThanhChua({ soCau: 10, soCauSai: 16, coSan: 60 }).n).toBe(16)
    // Kho không đủ hàng: sàn và trần cùng tụt, thanh không còn gì để kéo.
    expect(soLieuThanhChua({ soCau: 10, soCauSai: 16, coSan: 5 })).toEqual({ san: 5, tran: 5, n: 5, hienThanh: false })
  })

  it('câu giải thích nói ĐỦ trần, sàn, và gói mang sẵn bao nhiêu', () => {
    const c = cauGiaiThichThanh({ tongUngVien: 103, soCauSai: 16, san: 16, coSan: 60, xung: 'con' })
    expect(c).toContain('103 câu cùng dạng')
    expect(c).toContain('16 câu con sai')
    expect(c).toContain('mang sẵn 60 câu')
    expect(c).toContain('Ít nhất 16 câu')
  })

  it('gói chở đủ thì KHÔNG nói thừa câu "mang sẵn"', () => {
    expect(cauGiaiThichThanh({ tongUngVien: 40, soCauSai: 3, san: 3, coSan: 40 })).not.toContain('mang sẵn')
  })

  it('cảnh báo hết hàng kèm PHẦN, và đổi xưng hô theo màn', () => {
    const pool = [
      { qid: 'x', soCau: 2, phan: 'III' as const, tenDang: TEN, pool: 0 },
      { qid: 'y', soCau: 2, phan: 'I' as const, tenDang: TEN, pool: 5 },
    ]
    const em = cauCanhBaoHetHang(pool)
    expect(em).toContain('câu 2 phần III')
    // "câu 2 phần III" CHỨA chuỗi con "câu 2 phần I" nên `not.toContain` ở đây
    // luôn đỏ dù mã đúng — bản đầu tôi viết đúng cái bẫy đó. Kiểm bằng danh
    // sách thật: chỉ đúng MỘT câu được nêu, câu pool > 0 không lọt vào.
    expect(em.match(/câu \d+ phần (I{1,3})/g)).toEqual(['câu 2 phần III'])
    expect(cauCanhBaoHetHang(pool, 'con')).toContain('con làm sai')
    expect(cauCanhBaoHetHang([])).toBe('')
  })

  it('không rút được câu nào thì nói lý do, không im', () => {
    expect(cauKhongRutDuoc([])).toEqual(['Ca này chưa có câu nào sai.'])
    expect(cauKhongRutDuoc([{ soCau: 1, phan: 'I', qid: 'q', tenDang: '', vi: 'lý do A' }])).toEqual(['lý do A'])
  })

  it('KHÔNG màn nào tự viết lại công thức sàn hay tự gõ lại câu giải thích', () => {
    for (const f of ['src/components/ThanhSoCauChua.tsx', 'src/screens/PhieuScreen.tsx']) {
      const t = doc(f)
      expect(t, `${f} phải lấy số từ noi-dung-thanh-chua`).toContain('soLieuThanhChua')
      expect(t, `${f} phải lấy câu chữ từ noi-dung-thanh-chua`).toContain('cauGiaiThichThanh')
      // Tự gõ lại chuỗi là chỗ hai màn bắt đầu lệch nhau.
      expect(t, `${f} tự gõ lại câu "Kho có ..."`).not.toMatch(/Kho có \{/)
      expect(t, `${f} tự gõ lại câu "Ít nhất ..."`).not.toMatch(/Ít nhất \{/)
    }
  })

  it('gói báo cáo chở ĐỦ dữ liệu để trang phiếu dựng lại đúng khối đó', () => {
    const t = doc('src/lib/phieu-du-lieu.ts')
    for (const k of ['poolChua', 'thieuChuaChiTiet', 'tongUngVien']) expect(t).toContain(k)
  })
})

// ---------------------------------------------------------------------------
// LỌC LÝ THUYẾT / BÀI TẬP PHẢI ĐI QUA CỔNG — thầy bắt được 07/09:
//
//   "dạng câu ngẫu nhiên lý thuyết bài tập tôi bấm vào nó không báo có bao
//    nhiêu câu giống với những câu làm sai"
//   "chỗ rút câu của tôi chọn lý thuyết vẫn rút ra bài tập"
//
// Cùng MỘT gốc: `rutDeChua` không biết tới lọc dạng. Lọc ấy trước chỉ ăn ở
// đường rút TỰ DO (`chonCauLuyen`), nên ở màn có câu sai — tức đường đi qua
// cổng — bấm nút xong con số đứng im và phiếu vẫn ra câu bài tập.
import { LOC_DANG_MAC_DINH } from '../src/lib/dang-cau'

const cauKieu = (id: string, kieu: 'ly_thuyet' | 'bai_tap') => ({
  ...cau(id, 0),
  kieu,
})

describe('lọc lý thuyết / bài tập ở CỔNG rút câu chữa', () => {
  const k = () =>
    kho([
      cauKieu('s1', 'ly_thuyet'),
      cauKieu('lt1', 'ly_thuyet'),
      cauKieu('lt2', 'ly_thuyet'),
      cauKieu('bt1', 'bai_tap'),
      cauKieu('bt2', 'bai_tap'),
      cauKieu('bt3', 'bai_tap'),
    ])

  it('chọn Chỉ lý thuyết thì KHÔNG câu bài tập nào lọt vào phiếu', () => {
    const kq = rutDeChua({ khoDe: k(), rows: [row(2, 's1')], soCau: 10, locDang: 'ly_thuyet' })
    const ids = kq.cau.filter((c) => !c.chuaCho?.laLamLai).map((c) => c.id).sort()
    expect(ids).toEqual(['lt1', 'lt2'])
    for (const c of kq.cau) expect(c.dang, `câu ${c.id} lọt vào dù không phải lý thuyết`).not.toBe('bai_tap')
  })

  it('chọn Chỉ bài tập thì ngược lại', () => {
    const kq = rutDeChua({ khoDe: k(), rows: [row(2, 's1')], soCau: 10, locDang: 'bai_tap' })
    expect(kq.cau.filter((c) => !c.chuaCho?.laLamLai).map((c) => c.id).sort()).toEqual(['bt1', 'bt2', 'bt3'])
  })

  it('TRẦN THANH KÉO đổi theo nút vừa bấm — đây là cái thầy nói "không báo"', () => {
    const rows = [row(2, 's1')]
    const moi = rutDeChua({ khoDe: k(), rows, soCau: 0 }).tongUngVien
    const lt = rutDeChua({ khoDe: k(), rows, soCau: 0, locDang: 'ly_thuyet' }).tongUngVien
    const bt = rutDeChua({ khoDe: k(), rows, soCau: 0, locDang: 'bai_tap' }).tongUngVien
    expect(moi).toBe(5)
    expect(lt).toBe(2)
    expect(bt).toBe(3)
  })

  it('mặc định KHÔNG lọc — ca cũ và chỗ gọi chưa cập nhật giữ nguyên hành vi', () => {
    const rows = [row(2, 's1')]
    expect(rutDeChua({ khoDe: k(), rows, soCau: 0 }).tongUngVien).toBe(
      rutDeChua({ khoDe: k(), rows, soCau: 0, locDang: LOC_DANG_MAC_DINH }).tongUngVien,
    )
  })

  it('hai bộ lọc CHỒNG nhau, không thay nhau', () => {
    const k2 = kho([
      { ...cau('s1', 0), kieu: 'ly_thuyet' },
      { ...cau('a', 2), kieu: 'ly_thuyet' },
      { ...cau('b', 2), kieu: 'bai_tap' },
      { ...cau('c', 1), kieu: 'ly_thuyet' },
    ])
    const kq = rutDeChua({ khoDe: k2, rows: [row(2, 's1')], soCau: 10, locDang: 'ly_thuyet', locSao: 'sao_2' })
    expect(kq.cau.filter((c) => !c.chuaCho?.laLamLai).map((c) => c.id)).toEqual(['a'])
  })

  it('MÀN THẦY và MÀN GỌI LÊN BẢNG đều truyền lọc dạng vào cổng', () => {
    for (const f of ['src/components/NutBaiTapPdf.tsx', 'src/screens/GoiLenBangScreen.tsx']) {
      expect(doc(f), `${f} không truyền locDang vào rutDeChua`).toMatch(/rutDeChua\([^)]*locDang/)
    }
  })
})
