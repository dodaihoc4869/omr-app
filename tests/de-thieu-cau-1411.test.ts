// THẦY 14/11: «đề hiển thị trên app gv nhiều câu bị thiếu đề, app hs thì đủ … thiếu nhiều câu kiểm tra kĩ khắc phục triệt để».
// GỐC (đo trên kho máy chủ bằng .github/workflows/do-de-thieu-cau-1411.yml: 21 đề Dạy học mất 83 câu):
//  (1) `khoDayHoc` khử trùng câu GIỮA các đề phổ thông của nhánh, «cùng hạng thì bản tới trước giữ» ⇒ đề ôn `-D1/-D2` (chép câu từ các bài trước,
//      mã đứng sau) bị rút ruột: DH-12-C1-B3-D1 còn 17/28, DH-10-C1-B4-D1 còn 11/18 — máy em lấy kho máy chủ nên vẫn đủ.
//  (2) `napBangTra` (tờ chiếu chữa / chiến dịch) dựng BẢNG TRA THEO MÃ từ kho đã khử trùng ⇒ mã của bản chép thứ hai tra ra rỗng ⇒ tờ mất đề.
import { describe, expect, it, vi } from 'vitest'
import type { TeacherExamSource } from '../src/data/examContent'
import { cauTuDeChon, khoDayHoc } from '../src/lib/day-hoc-len-bang'
import { khuTrungNguon } from '../src/lib/khu-trung-cau'
import { tachNhieuTheoPhan } from '../src/lib/tach-phan-de'

const q = (id: string, text: string) => ({ id, text, choices: ['A1', 'B1', 'C1', 'D1'], correct: 'A' as const })
const de = (maDe: string, cau: [string, string][]): TeacherExamSource => ({ maDe, nhom: '12 · DẠY HỌC/C1 - Ester lipid', nguon: maDe, phanI: cau.map(([i, t]) => q(i, t)), phanII: [], phanIII: [] })

// Đúng hình kho thật: đề ôn D1 của bài 3 chép nguyên văn 2 câu của bài 2 (mã DH-12-C1-B2 đứng TRƯỚC DH-12-C1-B3-D1 theo khoá IndexedDB).
const KHO: TeacherExamSource[] = [
  de('DH-12-C1-B2', [['DH-12-C1-B2-I-1', 'Chất béo là'], ['DH-12-C1-B2-I-2', 'Xà phòng hoá tristearin thu được']]),
  de('DH-12-C1-B3-D1', [['DH-12-C1-B3-D1-I-1', 'Chất béo là'], ['DH-12-C1-B3-D1-I-2', 'Xà phòng hoá tristearin thu được'], ['DH-12-C1-B3-D1-I-3', 'Chất giặt rửa tổng hợp là']]),
]

vi.mock('../src/lib/exam-db', () => ({
  loadExamSources: async () => KHO,
  loadAllSessionTeacherBanks: async () => [],
}))

describe('đề Dạy học trên máy thầy đủ câu như máy em (14/11)', () => {
  it('(1) khoDayHoc: đề ôn chép câu của bài trước vẫn giữ ĐỦ câu của nó; bài trước cũng đủ', () => {
    const ds = khoDayHoc(KHO, khuTrungNguon, tachNhieuTheoPhan)
    const so = Object.fromEntries(ds.map((s) => [s.maDe, s.phanI.length + s.phanII.length + s.phanIII.length]))
    expect(so).toEqual({ 'DH-12-C1-B2': 2, 'DH-12-C1-B3-D1': 3 })
  })

  it('(1) kho giữ y như máy chủ (kể cả câu chép lặp trong một đề); bước chọn mới hiện câu trùng một lần (thầy 05/10)', () => {
    const lap = [de('DH-12-C1-B4', [['DH-12-C1-B4-I-1', 'Ester X'], ['DH-12-C1-B4-I-2', 'Ester X'], ['DH-12-C1-B4-I-3', 'Ester Y']])]
    const kho = khoDayHoc(lap, khuTrungNguon, tachNhieuTheoPhan)
    expect(kho[0]!.phanI.map((c) => c.id)).toEqual(['DH-12-C1-B4-I-1', 'DH-12-C1-B4-I-2', 'DH-12-C1-B4-I-3'])
    expect(cauTuDeChon(kho, new Set(['DH-12-C1-B4'])).map((c) => c.khoa)).toEqual(['DH-12-C1-B4-I-1', 'DH-12-C1-B4-I-3'])
    const ds = khoDayHoc(KHO, khuTrungNguon, tachNhieuTheoPhan)
    expect(cauTuDeChon(ds, new Set(['DH-12-C1-B3-D1'])).length).toBe(3)
    expect(cauTuDeChon(ds, new Set(['DH-12-C1-B2', 'DH-12-C1-B3-D1'])).length).toBe(3)
  })

  it('(2) napBangTra: tra được MỌI mã câu, kể cả bản chép ở đề thứ hai', async () => {
    const { napBangTra, traChinhXac } = await import('../src/components/chien-dich/to-chieu')
    const tra = await napBangTra()
    for (const s of KHO) for (const c of s.phanI) expect(traChinhXac(tra, c.id)?.q.text, c.id).toBe(c.text)
  })
})
