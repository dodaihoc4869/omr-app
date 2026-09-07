// 07/09: khối rút bài đã tách khỏi `PhieuScreen` sang `components/KhoiBaiLuyen`
// để bố cục v3 dùng CHUNG một bản với bố cục cũ (thầy chốt "giữ nguyên mục rút
// bài trong phiếu mới đầy đủ như trong phiếu cũ"). Luật không đổi, chỉ đổi tệp.
// BA LỰA CHỌN DẠNG CÂU Ở MỌI CHỖ RÚT + RANH GIỚI CHUYÊN ĐỀ CỦA CA.
// Thầy chốt 06/09:
//   · "Lúc tạo đề cho tôi mục chọn chỉ rút những câu lý thuyết, hoặc chỉ rút
//     những câu bài tập, hoặc ngẫu nhiên."
//   · "Trong tất cả mục rút bài báo cáo phụ huynh và học sinh cũng phải có 3
//     lựa chọn này."
//   · "Chỉ rút bài tập từ những chuyên đề được chọn của ca đó, theo điểm mạnh
//     yếu của ca thi đó, không rút theo mạnh yếu cộng dồn."
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { chonCauLuyen } from '../src/lib/bai-tap-pdf'
import { khopLoc, rutBaiTap } from '../src/lib/bai-tap'
import { dungUngVien, locTheoYeuCau, demDangUngVien } from '../src/lib/rut-de'
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion } from '../src/data/examContent'

const doc = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8')

const lyThuyet = (id: string, cd: string): TeacherMcqQuestion => ({
  id,
  text: 'Phản ứng thuận nghịch là phản ứng hoá học mà',
  choices: ['cùng điều kiện.', 'mọi điều kiện.', 'nhiệt độ cao.', 'áp suất cao.'],
  correct: 'A',
  chuyenDe: cd,
  mucDo: 'biet',
})
const baiTapIII = (id: string, cd: string): TeacherShortAnswerQuestion => ({
  id,
  text: 'Cho 5,6 gam Fe tan hết trong HCl dư. Tính số mol khí thu được là bao nhiêu mol?',
  correct: '0,1',
  chuyenDe: cd,
  mucDo: 'van_dung',
})

/** Kho hai chuyên đề: "Trong ca" và "Ngoài ca". */
function kho(): TeacherExamSource[] {
  return [
    {
      maDe: 'D1',
      phanI: [lyThuyet('lt-trong-1', 'Trong ca'), lyThuyet('lt-trong-2', 'Trong ca'), lyThuyet('lt-ngoai-1', 'Ngoài ca'), lyThuyet('lt-ngoai-2', 'Ngoài ca')],
      phanII: [],
      phanIII: [baiTapIII('bt-trong-1', 'Trong ca'), baiTapIII('bt-ngoai-1', 'Ngoài ca')],
    } as unknown as TeacherExamSource,
  ]
}

describe('ranh giới chuyên đề của ca — bài luyện kèm báo cáo', () => {
  it('1. em KHÔNG SAI chuyên đề nào vẫn chỉ rút trong phạm vi ca', () => {
    // ĐÂY LÀ LỖI THẦY BÁO. Trước đây danh sách chuyên đề yếu rỗng ⇒ hàm hiểu
    // rỗng là "lấy toàn kho", nên bài luyện lôi cả chuyên đề ca đó chưa đụng.
    const kq = chonCauLuyen(kho(), { chuyenDe: [], chuyenDeCa: ['Trong ca'], soCau: 10, ngauNhien: () => 0 })
    expect(kq.cau.length).toBeGreaterThan(0)
    for (const c of kq.cau) expect(c.chuyenDe).toBe('Trong ca')
  })

  it('2. chuyên đề em sai NHIỀU NHẤT trong ca này được lấy trước', () => {
    const kq = chonCauLuyen(kho(), {
      chuyenDe: [{ ten: 'Trong ca', tiLeSai: 0.8 }],
      chuyenDeCa: ['Trong ca', 'Ngoài ca'],
      soCau: 2,
      ngauNhien: () => 0,
    })
    expect(kq.cau.length).toBe(2)
    for (const c of kq.cau) expect(c.chuyenDe).toBe('Trong ca')
  })

  it('3. KHÔNG truyền phạm vi ca thì giữ nguyên hành vi cũ, ca cũ không vỡ', () => {
    const kq = chonCauLuyen(kho(), { chuyenDe: [], soCau: 10, ngauNhien: () => 0 })
    expect(new Set(kq.cau.map((c) => c.chuyenDe)).size).toBeGreaterThan(1)
  })

  it('3b. CẢ HAI đường dựng báo cáo đều truyền danh sách ĐẦY ĐỦ, không lọc trước', () => {
    // LỖ TÌM RA 06/09 khi thầy hỏi lại "đã hoàn thành cái này chưa":
    // `phieu-ca-ca.ts` (dựng cả ca) truyền `cd` đầy đủ — đúng. Nhưng
    // `PhieuZaloEm.tsx` (dựng từng em) lọc `soSai > 0` NGAY TỪ memo rồi mới
    // truyền xuống, nên em làm đúng hết thì ranh giới rỗng và bài luyện lại
    // rút toàn kho — đúng lỗi thầy báo, chỉ là ở đường khác.
    const zalo = doc('src/components/PhieuZaloEm.tsx')
    expect(zalo).toContain('const chuyenDeCaDayDu = hoSo.chuyenDeCaGanNhat')
    expect(zalo).toContain('chuyenDeCa: chuyenDeCaDayDu,')
    // danh sách ĐÃ LỌC chỉ còn dùng cho câu chữ, không phải cho ranh giới
    expect(zalo).toContain('chuyenDeCaDayDu.filter((c) => c.soSai > 0)')

    const caCa = doc('src/lib/phieu-ca-ca.ts')
    expect(caCa).toContain('chuyenDeCa: cd,')
    // và ở đó danh sách lọc được đặt tên riêng, không nhầm vào chỗ ranh giới
    expect(caCa).toContain('const cdSai = cd.filter((c) => c.soSai > 0)')
  })

  it('3c. RANH GIỚI CHẶT NHẤT là MÃ ĐỀ của ca — chuyên đề gộp cả chương nên không đủ', () => {
    // Thầy bắt được 06/09: em Tuân chỉ thi Ester bài 1, bài luyện ra câu xà
    // phòng. Câu đó KHÔNG sai nhãn — nó đúng chuyên đề "Ester – lipid". Chuyên
    // đề trong kho là cả chương, gộp ester với xà phòng làm một.
    const nguon: TeacherExamSource[] = [
      { maDe: 'ESTER-B1', phanI: [lyThuyet('e1', 'Ester – lipid'), lyThuyet('e2', 'Ester – lipid')], phanII: [], phanIII: [] } as unknown as TeacherExamSource,
      { maDe: 'ESTER-B3', phanI: [lyThuyet('x1', 'Ester – lipid'), lyThuyet('x2', 'Ester – lipid')], phanII: [], phanIII: [] } as unknown as TeacherExamSource,
    ]
    // Lọc theo CHUYÊN ĐỀ: cả bốn câu đều lọt — đúng là lỗi thầy thấy.
    const theoChuyenDe = chonCauLuyen(nguon, { chuyenDe: [], chuyenDeCa: ['Ester – lipid'], soCau: 10, ngauNhien: () => 0 })
    expect(theoChuyenDe.cau.map((c) => c.id).sort()).toEqual(['e1', 'e2', 'x1', 'x2'])
    // Lọc theo MÃ ĐỀ: chỉ còn đúng bài thầy chọn.
    const theoMaDe = chonCauLuyen(nguon, { chuyenDe: [], chuyenDeCa: ['Ester – lipid'], maDeCa: ['ESTER-B1'], soCau: 10, ngauNhien: () => 0 })
    expect(theoMaDe.cau.map((c) => c.id).sort()).toEqual(['e1', 'e2'])
  })

  it('3d. hết câu trong bài thì BÁO THIẾU, KHÔNG tự nới ra cả chuyên đề', () => {
    // Giả định đã ghi rõ: nới âm thầm chính là thứ đẻ ra câu xà phòng.
    const nguon: TeacherExamSource[] = [
      { maDe: 'ESTER-B1', phanI: [lyThuyet('e1', 'Ester – lipid')], phanII: [], phanIII: [] } as unknown as TeacherExamSource,
      { maDe: 'ESTER-B3', phanI: [lyThuyet('x1', 'Ester – lipid'), lyThuyet('x2', 'Ester – lipid')], phanII: [], phanIII: [] } as unknown as TeacherExamSource,
    ]
    const kq = chonCauLuyen(nguon, { chuyenDe: [], maDeCa: ['ESTER-B1'], soCau: 5, ngauNhien: () => 0 })
    expect(kq.cau.map((c) => c.id)).toEqual(['e1'])
    expect(kq.thieu).toBe(4)
  })

  it('3e. báo cáo CHƯA bó theo mã đề — và đó là cố ý, có lý do ghi tại chỗ', () => {
    // Suy mã đề từ `banks` cho ra rỗng (mã đề của ngân hàng ca khác mã đề của
    // kho) ⇒ bài luyện rỗng ⇒ mất `linkBaiTap` ⇒ báo cáo mất hai nút copy.
    // Nguồn đúng là danh sách đề thầy đã tích lúc mở ca, cất riêng.
    const lib = doc('src/lib/phieu-du-lieu.ts')
    expect(lib).not.toContain('maDeCa,')
    expect(lib).toContain('RANH GIỚI THEO MÃ ĐỀ: CHƯA nối ở đây, cố ý.')
  })

  it('4. báo cáo truyền MỌI chuyên đề của ca làm ranh giới, không chỉ chuyên đề sai', () => {
    const lib = doc('src/lib/phieu-du-lieu.ts')
    expect(lib).toContain('const phamViCa = n.chuyenDeCa.map((c) => c.ten).filter(Boolean)')
    expect(lib).toContain('chuyenDeCa: phamViCa')
    // và tỉ lệ sai vẫn tính từ CHÍNH ca đó
    expect(lib).toContain('tiLeSai: c.soSai / Math.max(1, c.soCau)')
  })
})

describe('ba lựa chọn dạng câu ở mọi chỗ rút', () => {
  it('5. bài luyện: chỉ lý thuyết thì không dính câu bài tập', () => {
    const kq = chonCauLuyen(kho(), { chuyenDe: [], chuyenDeCa: ['Trong ca'], dang: 'ly_thuyet', soCau: 10, ngauNhien: () => 0 })
    expect(kq.cau.length).toBeGreaterThan(0)
    for (const c of kq.cau) expect(c.dang).toBe('ly_thuyet')
  })

  it('6. bài luyện: chỉ bài tập thì không dính câu lý thuyết', () => {
    const kq = chonCauLuyen(kho(), { chuyenDe: [], chuyenDeCa: ['Trong ca'], dang: 'bai_tap', soCau: 10, ngauNhien: () => 0 })
    expect(kq.cau.length).toBeGreaterThan(0)
    for (const c of kq.cau) expect(c.dang).toBe('bai_tap')
  })

  it('7. giao bài tập: bộ lọc dạng ăn vào cả ba phần', () => {
    const chiLt = rutBaiTap(kho(), { chuyenDe: [], mucDo: 'tron', dang: 'ly_thuyet', soCau: 10, ngauNhien: () => 0 })
    expect(chiLt.keyBank.phanIII.length).toBe(0) // Phần III luôn là bài tập
    expect(chiLt.keyBank.phanI.length).toBeGreaterThan(0)
    const chiBt = rutBaiTap(kho(), { chuyenDe: [], mucDo: 'tron', dang: 'bai_tap', soCau: 10, ngauNhien: () => 0 })
    expect(chiBt.keyBank.phanI.length).toBe(0)
    expect(chiBt.keyBank.phanIII.length).toBeGreaterThan(0)
  })

  it('8. khopLoc mặc định KHÔNG lọc dạng — chỗ gọi cũ không đổi hành vi', () => {
    expect(khopLoc(lyThuyet('x', 'A'), [], 'tron')).toBe(true)
    expect(khopLoc(baiTapIII('y', 'A'), [], 'tron')).toBe(true)
  })

  it('9. rút đề: ứng viên mang dạng, và bộ lọc cắt đúng', () => {
    const uv = dungUngVien(kho())
    const dem = demDangUngVien(uv)
    expect(dem.ly_thuyet).toBe(4)
    expect(dem.bai_tap).toBe(2)
    const chiLt = locTheoYeuCau(uv.I, { chuyenDe: [], mucDo: [], dang: 'ly_thuyet' })
    expect(chiLt.length).toBe(4)
    expect(locTheoYeuCau(uv.III, { chuyenDe: [], mucDo: [], dang: 'ly_thuyet' }).length).toBe(0)
    // không truyền dạng = ngẫu nhiên = nhận hết
    expect(locTheoYeuCau(uv.I, { chuyenDe: [], mucDo: [] }).length).toBe(4)
  })
})

describe('ba lựa chọn có mặt trên cả ba màn', () => {
  it('10. màn Rút đề', () => {
    const man = doc('src/components/KhoiRutDe.tsx')
    expect(man).toContain('MOI_LOC_DANG.map')
    expect(man).toContain('dang: chonDang')
    // hiện thẳng ba con số để thầy biết chọn chặt thì còn bao nhiêu câu
    expect(man).toContain('soCauDung(demDang, d)')
  })

  it('11. màn Giao bài tập — NutBaiTapPdf, cái thật sự chạy', () => {
    // BÀI HỌC 06/09: lần đầu tôi thêm ba nút vào `GiaoBaiTap.tsx` rồi kiểm bản
    // live thì không thấy chữ nào. Hoá ra file đó KHÔNG được import ở đâu —
    // code chết, bị tree-shake khỏi bundle. Màn thầy thật sự bấm là
    // `NutBaiTapPdf`, dùng ở HocSinhScreen và ExamMonitorScreen.
    const man = doc('src/components/NutBaiTapPdf.tsx')
    expect(man).toContain('MOI_LOC_DANG.map')
    // Đặc tả RÚT ĐỀ CHỮA CÂU SAI đổi đường đi: component không gọi thẳng
    // `chonCauLuyen` nữa, mọi đường qua cổng `rut-de-chua.ts`.
    expect(man).toContain('rutTuDo(nguon, { chuyenDe: dungDe, chuyenDeCa: phamVi, dang,')
    expect(man).not.toMatch(/\bchonCauLuyen\s*\(/)
  })

  it('11b. NutBaiTapPdf phải còn được dùng thật — kẻo lại sửa nhầm code chết', () => {
    const dung = ['src/screens/HocSinhScreen.tsx', 'src/screens/ExamMonitorScreen.tsx']
    for (const f of dung) expect(doc(f)).toContain('<NutBaiTapPdf')
  })

  it('12. báo cáo phụ huynh và học sinh', () => {
    const man = doc('src/components/KhoiBaiLuyen.tsx')
    expect(man).toContain('MOI_LOC_DANG.map')
    expect(man).toContain('hopDang(dangCuaCau(c), locDang)')
  })

  it('13. BÁO CÁO CŨ cũng có ba nút — phân loại tại chỗ, không ghi đè máy chủ', () => {
    // Thầy hỏi "đẩy luôn lên cả báo cáo cũ các ca thi trước". Báo cáo cũ không
    // mang nhãn `dang`, nhưng mang đủ `phan · text · luaChon · dapAn · mucDo`
    // để phân loại ngay lúc mở. Không chép thêm trường vào bản ghi cũ, và
    // KHÔNG chạy lại báo cáo hàng loạt — mỗi bản ghi mang nhận xét thầy tự gõ.
    const man = doc('src/components/KhoiBaiLuyen.tsx')
    expect(man).toContain('const dangCuaCau = (c: CauLuyen) =>')
    // nhãn cất sẵn vẫn được ưu tiên hơn suy đoán
    expect(man).toContain('c.dang ?? dangCua({')
    // hàng nút hiện theo CÓ BÀI TẬP, không theo có nhãn
    expect(man).toContain('{(du.baiTap?.length ?? 0) > 0 && (')
    expect(man).not.toContain('coNhanDang')
  })
})
