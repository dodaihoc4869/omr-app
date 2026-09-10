// NĂM VIỆC THẦY BÁO NGÀY 08/09, ĐỢT 3.
//
//   1. "ca mới vừa tạo vẫn bị lỗi mở câu khắc phục chưa đóng lời giải"
//   2. "vẫn chưa bấm chọn đáp án ngay trên đề được"
//   3. "tôi chọn rút ca gần nhất nhưng chỗ này báo là rút 3 ca gần nhất"
//   4. "chỗ rút 3 ca bạn rút ngẫu nhiên 3 ca trước đó bất kì không cần gần nhất"
//   5. "học sinh thi xong nhưng chưa thống kê là đã làm sai câu trước"
//   6. "màu của phiếu html … 7 màu 7 sắc cầu vồng để hiển thị lần lượt rồi quay vòng"
//
// (1) và (2) CÙNG MỘT GỐC: cả thanh nộp, cả ô bấm chọn, cả khoá lời giải đều
// bật bằng `nop`; `nop` cần mã phiếu, mã phiếu phải đi xin máy chủ nên về SAU
// khi màn hình đã hiện. Em bấm nhanh hơn mạng là dựng ra phiếu không mã.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { dungPhieu } from '../src/lib/html-phieu'
import { chonCaTheoPhamVi } from '../src/lib/de-rieng-nguon'
import { CAU_HINH_DE_RIENG_MAC_DINH, TEN_PHAM_VI_HOI_LAI } from '../src/lib/cau-hinh-de-rieng'
import { demLapCuaEm } from '../src/lib/de-rieng-goi'
import { dungPhieuMayEm } from '../src/lib/phieu-du-lieu'
import type { ChiTietCauRow } from '../src/lib/exam-api'
import type { TeacherExamSource } from '../src/data/examContent'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const goc = join(__dirname, '..')
const doc = (p: string) => readFileSync(join(goc, p), 'utf8')
const KHOI = doc('src/components/KhoiBaiLuyen.tsx')
const MAN_THI = doc('src/screens/ExamTakeScreen.tsx')
const MAN_CA = doc('src/screens/ExamMonitorScreen.tsx')
const GS = doc('docs/apps-script-kiem-tra.gs')

// ---------------------------------------------------------------- 1 và 2
describe('PHIẾU KHẮC PHỤC: chờ xin xong mã rồi mới dựng', () => {
  it('khối bài luyện nhận đường đi xin mã, không chỉ đọc link đã chở sẵn', () => {
    expect(KHOI).toContain('xinLink?: () => Promise<string>')
    // CẬP NHẬT 09/09: vẫn CHỜ xin xong mới dựng (ý định gốc, giữ nguyên), nhưng
    // không còn `catch` trần — lời máy chủ được giữ lại để đưa vào dòng nhắc
    // đầu phiếu. `catch` trần đó là thứ đã khiến tôi phải suy đoán bốn vòng.
    expect(KHOI).toContain('if (!link && xinLink) {')
    expect(KHOI).toContain('await xinLink().catch((e: unknown) => {')
    expect(KHOI).not.toContain("xinLink().catch(() => '')")
    // Mã phiếu đọc từ link VỪA XIN, không đọc lại `du.linkBaiTap` cũ.
    expect(KHOI).toContain("const maPhieu = link ? docLinkPhieu(link.slice(link.indexOf('#') + 1)).ma : ''")
  })

  it('màn thi truyền đường xin đó xuống báo cáo của em', () => {
    expect(MAN_THI).toContain('<PhieuScreen duCoSan={phieuCuaEmCoLink} laCuaEm xinLink={xinLinkBaiTap} />')
  })

  it('xin HỎNG thì xoá dấu để lần bấm sau xin lại — không treo một lời hứa hỏng', () => {
    expect(MAN_THI).toContain('if (maBaiTapRef.current && maBaiTapRef.current.khoa === khoa) maBaiTapRef.current = null')
  })

  it('hai chỗ cùng cần link thì dùng CHUNG một lượt gọi máy chủ', () => {
    expect(MAN_THI).toContain('maBaiTapRef.current = { khoa, hua }')
    expect(MAN_THI).toContain('void xinLinkBaiTap()')
  })
})

// ------------------------------------------------------------------- 3 và 4
describe('PHẠM VI RÚT CÂU HỎI LẠI', () => {
  const ca = (m: string) => ({ maCa: m })
  const ds = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'].map(ca)

  it('gan_nhat: giữ CẢ thư mục năm sinh, theo thứ tự', () => {
    // VIẾT LẠI 10/09 — thầy đổi PHẠM VI, không phải mã hỏng.
    //
    //   "khi chọn ca thi rút câu sai, bạn phải quét hết thư mục năm sinh đó,
    //    tìm ra lần thi gần nhất của từng học sinh"
    //
    // Giả định cũ "chỉ quét ngược 3 ca" nay sai theo đúng nghĩa: em nghỉ ba
    // buổi liền là mất sạch câu lặp và lặng lẽ rơi về nhãn "mới vào". Tệ hơn,
    // ba ca gần nhất tính trên MỌI khối nên ca 2011 rút phải câu sai của ca
    // 2009. Phạm vi nay là CẢ THƯ MỤC NĂM SINH (`docCacCaTruoc` lọc trước),
    // `TRAN_CA_QUET` chỉ còn là trần an toàn.
    const ra = chonCaTheoPhamVi(ds, 'moi', { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: 'gan_nhat' })
    // Bản cũ cắt còn ['c1','c2','c3'].
    expect(ra.map((c) => c.maCa)).toEqual(ds.map((c) => c.maCa))
  })

  it('ba_ca: bốc ĐÚNG 3 ca, và KHÔNG phải 3 ca gần nhất', () => {
    const ra = chonCaTheoPhamVi(ds, 'moi', { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: 'ba_ca' })
    expect(ra.length).toBe(3)
    expect(new Set(ra.map((c) => c.maCa)).size).toBe(3)
    expect(ra.map((c) => c.maCa)).not.toEqual(['c1', 'c2', 'c3'])
    for (const c of ra) expect(ds.some((x) => x.maCa === c.maCa)).toBe(true)
  })

  it('ba_ca: CÙNG MỘT CA thì lần nào cũng ra đúng bộ ấy — biên bản đối chiếu được', () => {
    const ch = { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: 'ba_ca' as const }
    const a = chonCaTheoPhamVi(ds, 'moi', ch).map((c) => c.maCa)
    const b = chonCaTheoPhamVi(ds, 'moi', ch).map((c) => c.maCa)
    expect(a).toEqual(b)
  })

  it('ba_ca: ca KHÁC thì bộ khác — không phải lúc nào cũng một bộ', () => {
    const ch = { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: 'ba_ca' as const }
    const bo = new Set(['a', 'b', 'c', 'd', 'e'].map((m) => chonCaTheoPhamVi(ds, m, ch).map((c) => c.maCa).join(',')))
    expect(bo.size).toBeGreaterThan(1)
  })

  it('ba_ca: kho chỉ có 2 ca thì lấy cả 2, không bịa thêm', () => {
    const ra = chonCaTheoPhamVi(ds.slice(0, 2), 'moi', { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: 'ba_ca' })
    expect(ra.map((c) => c.maCa)).toEqual(['c1', 'c2'])
  })

  it('không có ca nào trước đó thì trả rỗng, cả hai chế độ', () => {
    for (const pv of ['gan_nhat', 'ba_ca'] as const) {
      expect(chonCaTheoPhamVi([], 'moi', { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: pv })).toEqual([])
    }
  })

  it('tên nút nói đúng việc: 3 ca NGẪU NHIÊN, không phải 3 ca gần nhất', () => {
    expect(TEN_PHAM_VI_HOI_LAI.ba_ca).toBe('3 ca ngẫu nhiên')
    expect(TEN_PHAM_VI_HOI_LAI.gan_nhat).toBe('Ca gần nhất')
  })
})

describe('BIÊN BẢN nói đúng phạm vi thầy chọn', () => {
  it('cất phạm vi và ca thật sự lấy của từng em vào biên bản', () => {
    expect(MAN_CA).toContain('phamVi: pv')
    expect(MAN_CA).toContain('tuCaCua: ra.tuCaCua')
  })

  it('chế độ gần nhất KHÔNG còn in chữ "quét 3 ca gần nhất"', () => {
    expect(MAN_CA).not.toContain('quét ${bb.caDaQuet.length} ca gần nhất')
    expect(MAN_CA).toContain('`bốc 3 ca ngẫu nhiên: ${bb.caDaQuet.join(\' · \')}`')
    expect(MAN_CA).toContain('lấy ca gần nhất em có nộp — đã dò')
  })

  it('mỗi em in ra ca THẬT SỰ lấy câu sai, không chỉ danh sách ca đã dò', () => {
    expect(MAN_CA).toContain('lấy từ ca ${maCaLay(bb, sbd)}')
    expect(MAN_CA).toContain('· sai {sai} câu')
  })
})

describe('MÀN CA THI chấm bằng bản đồ MÁY CHỦ, không phải bản đồ của một máy', () => {
  it('chiTietCa trả bộ câu từng em của ca', () => {
    expect(doc('src/lib/exam-api.ts')).toContain('boTheoEmCa?: Record<string, string[]>')
    expect(doc('src/lib/exam-api.ts')).toContain('boTheoEmCa: goiDR.bo ??')
  })

  it('cả màn dùng ĐÚNG MỘT bản đồ, máy chủ trước máy này sau', () => {
    expect(MAN_CA).toContain('const boTheoEmDung = chiTiet?.boTheoEmCa ?? deRiengCa?.boTheoEm')
    // Không còn chỗ nào đọc thẳng bản đồ của riêng máy này để chấm.
    expect(MAN_CA).not.toContain('soCauCa, deRiengCa?.boTheoEm')
    expect(MAN_CA).not.toContain('gradeSubmissionFull(teacherBank, chiTiet.ca.maCa, sbd, moiNhat.dapAn, soCauCa, deRiengCa?.boTheoEm)')
  })
})

// ----------------------------------------------------------------------- 5
describe('BÁO CÁO SAU THI: thống kê câu em đã sai buổi trước', () => {
  const ESTER = 'Ester – lipid'
  const cauI = (so: number) => ({
    id: `CA-I-${so}`,
    text: `Câu ${so}`,
    choices: ['a', 'b', 'c', 'd'] as [string, string, string, string],
    correct: 'A' as const,
    chuyenDe: ESTER,
    mucDo: 'hieu',
    loiGiai: { chot: 'Chốt.' },
  })
  const BANK: TeacherExamSource = { maDe: 'CA', phanI: [cauI(1), cauI(2), cauI(3)], phanII: [], phanIII: [] }
  const hang = (qid: string, dung: boolean): ChiTietCauRow =>
    ({ phan: 'I', soCau: 1, qid, chuyenDe: ESTER, mucDo: 'hieu', dapAnChon: 'A', dapAnDung: dung ? 'A' : 'B', dungSai: dung, giay: null })
  const ROWS = [hang('CA-I-1', true), hang('CA-I-2', false), hang('CA-I-3', true)]
  const dung = (lapCua?: Record<string, number> | null) =>
    dungPhieuMayEm({ hoTen: 'Em Thử', sbd: '100001', maCa: 'CA1', nopLuc: '2026-09-08T02:00:00Z', diem: 5, rows: ROWS, banks: [BANK], lapCua })

  it('CÓ bản đồ: đếm đúng số câu lặp, tách riêng câu em ĐÃ SỬA ĐƯỢC', () => {
    const p = dung({ 'CA-I-1': 2, 'CA-I-2': 1 })
    expect(p.soCauLap).toBe(2)
    expect(p.daSuaDuoc?.map((c) => c.qid)).toEqual(['CA-I-1'])
    expect(p.dongCauLap).toBeTruthy()
  })

  it('câu lặp làm SAI TIẾP thì cộng thêm một lần, không tính là đã sửa được', () => {
    const p = dung({ 'CA-I-2': 1 })
    const c = p.cauSai.find((x) => x.qid === 'CA-I-2')
    expect(c?.laCauLap).toBe(true)
    expect(c?.soLanSai).toBe(2)
    expect(c?.daSuaDuoc).toBe(false)
    expect(p.daSuaDuoc).toEqual([])
  })

  it('CA THƯỜNG (không bản đồ): báo cáo không mọc thêm mục nào', () => {
    const p = dung(null)
    expect(p.soCauLap).toBe(0)
    expect(p.daSuaDuoc).toEqual([])
    expect(p.cauSai.every((c) => c.laCauLap === undefined)).toBe(true)
  })

  it('máy chủ gửi bản đồ số lần sai của CHÍNH EM, và màn thi cất lại', () => {
    expect(GS).toContain('function demLapCuaEm_(ref, sbd)')
    expect(GS).toContain('out.demLap = demLapCuaEm_(ca.boTheoEmRef, sbd)')
    expect(MAN_THI).toContain('lapCua: attempt.demLap && Object.keys(attempt.demLap).length > 0 ? attempt.demLap : null,')
  })

  it('máy chủ bản CŨ không gửi dem thì vẫn gắn được nhãn, chỉ thiếu số lần', () => {
    expect(demLapCuaEm(null, ['q1', 'q2'])).toEqual({ q1: 0, q2: 0 })
    expect(demLapCuaEm({ q1: 3 }, ['q1', 'q2'])).toEqual({ q1: 3, q2: 0 })
    expect(demLapCuaEm(undefined, [])).toEqual({})
  })
})

// ----------------------------------------------------------------------- 6
describe('PHIẾU HTML: bảy sắc cầu vồng, xoay vòng', () => {
  const cau = (id: string): CauLuyen =>
    ({
      id,
      phan: 'I',
      text: 'Câu ' + id,
      luaChon: ['a', 'b', 'c', 'd'],
      dapAn: 'A',
      mucDo: 'biet',
      chuyenDe: 'Ester – lipid',
      loiGiai: { buoc: ['Bước 1'], dapAn: 'A' },
    }) as unknown as CauLuyen
  const tt = { hoTen: 'Đỗ Đại Học', sbd: '12121212', ngay: new Date('2026-09-08'), tenChuyenDe: 'Ester – lipid', ketQua: '', hienDapAn: false }
  const html = dungPhieu(tt, [cau('q1')])

  it('đủ BẢY sắc, không thiếu không thừa', () => {
    for (let i = 1; i <= 7; i++) expect(html).toContain(`body[data-mau="${i}"] {`)
    expect(html).not.toContain('body[data-mau="8"]')
    expect((html.match(/body\[data-mau="\d"\] \{/g) || []).length).toBe(7)
  })

  it('mỗi sắc đổi ĐỦ năm biến màu thương hiệu', () => {
    for (let i = 1; i <= 7; i++) {
      const d = html.slice(html.indexOf(`body[data-mau="${i}"] {`))
      const khoi = d.slice(0, d.indexOf('}'))
      for (const bien of ['--nav:', '--nav-2:', '--luc:', '--luc-2:', '--vang:']) expect(khoi).toContain(bien)
    }
  })

  it('ĐÚNG/SAI giữ nguyên ở mọi sắc — đây là phiếu chấm bài', () => {
    for (let i = 1; i <= 7; i++) {
      const d = html.slice(html.indexOf(`body[data-mau="${i}"] {`))
      const khoi = d.slice(0, d.indexOf('}'))
      for (const bien of ['--dung:', '--sai:', '--dung-nen:', '--sai-nen:']) expect(khoi).not.toContain(bien)
    }
  })

  it('mở phiếu là NHÍCH sang sắc kế tiếp, hết 7 quay về 1', () => {
    expect(html).toContain('var SO_MAU = 7;')
    expect(html).toContain('var v = ((Number(n) - 1) % SO_MAU + SO_MAU) % SO_MAU + 1;')
    expect(html).toContain('mauHienTai = datMau(mauHienTai + 1);')
    expect(html).toContain("document.body.setAttribute('data-mau', String(v));")
  })

  it('nhớ sắc đang dùng, và máy chặn localStorage thì vẫn chạy', () => {
    expect(html).toContain("var KHOA_MAU = 'ddh.phieu.mau';")
    expect(html).toContain('try { localStorage.setItem(KHOA_MAU, String(v)); } catch (eM) {}')
    expect(html).toContain('catch (eM0) { mauHienTai = 0; }')
  })

  it('có nút Đổi màu ngay trên thanh, bấm là nhích một sắc', () => {
    expect(html).toContain('id="doi-mau"')
    expect(html).toContain("if (nutMau) nutMau.addEventListener('click', function () { mauHienTai = datMau(mauHienTai + 1); });")
  })

  it('nút Đổi màu KHÔNG bị giấu lúc chưa nộp — đổi màu không lộ đáp án', () => {
    const khoa = dungPhieu(tt, [cau('q1')], { nop: { ma: 'abcd1234', sbd: '12121212', url: 'https://x' } })
    expect(khoa).toContain('<body class="co-lam chua-nop">')
    expect(khoa).toContain('id="doi-mau"')
    const giau = khoa.slice(khoa.indexOf('body.chua-nop #mo-het'))
    expect(giau.slice(0, giau.indexOf('}'))).not.toContain('#doi-mau')
  })
})
