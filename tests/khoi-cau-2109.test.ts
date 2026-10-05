// @vitest-environment node
// CÂU HỢP KHỐI VỚI EM (Code 1, 21/09/2026; Boss chốt sau P0 thầy báo 20:28: học sinh khối 11 nhận câu khối 12). Hàm THUẦN ở src/lib/khoi-cau.ts — máy chủ, máy thầy, máy em cùng import.
// Luật 21/09 (cũ): chỉ câu của khối em đang học hoặc khối THẤP hơn; không bao giờ khối cao hơn (kể cả trùng mã dạng, kể cả câu "sửa lỗi"); không biết ⇒ không kết tội.
// LUẬT THẦY 05/10 (thay luật 21/09 — kỳ vọng các test dưới đây đã SỬA theo lệnh này, không xoá/không bỏ qua test nào). Nguyên văn:
//   "rất nhiều cấu thuộc lớp 10 nhưng bị rút nhầm sang lớp 11, bạn phải chặn chuẩn 100% không được rút nhầm kho khác khối cho tôi nhé"
//   "mục câu cần chữa của khối 11 khi chiếu lên bảng thì rất nhiều câu của lớp 10 bị chèn vào, bạn xem mọi chỗ chặn triệt để rút nhầm câu của kho khối khác"
// ⇒ chỉ câu ĐÚNG KHỐI em; khác khối (thấp hay cao) ⇒ chặn; câu không rõ khối / nguồn khối mâu thuẫn ⇒ chặn; em không rõ khối ⇒ chặn.
import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../src/lib/exam-shuffle'
import { CAC_KHOI, cauHopKhoi, demCauKhongRoKhoi, khoiCaoHon, khoiCuaCau, khoiCuaEm, khoiCuaLop, khoiCuaMaDe, locCauHopKhoi, locCauKemDem, type Khoi } from '../src/lib/khoi-cau'

describe('khoiCuaMaDe — đọc khối từ mã tờ / mã câu (đoạn thứ 2)', () => {
  it.each([
    ['DH-12-C2-B6-TN', 12], ['DB-12-B8-D1', 12], ['DH-11-III-1', 11], ['DH-10-C1-B1', 10], ['DH-12-C1-B2-I-49', 12], ['dh-11-c2', 11], ['ESTE-11-A', 11], ['DH-12', 12],
    // dạng SỐ-ĐẦU (38 % kho thật): khối ở đoạn đầu
    ['12-C1-B2-D1', 12], ['10-C1-B1', 10], ['12-KT-C1-D1', 12], ['11-BD1-2', 11], ['10-C1-B1-I-1', 10], ['12-C1-B2-D1-III-7', 12],
  ])('%s ⇒ %s', (ma, khoi) => expect(khoiCuaMaDe(ma)).toBe(khoi))
  it.each([['D1'], ['DE1'], ['BTVN240921'], ['DH-120-A'], ['DH-9-A'], ['DH-13-A'], ['120-C1-B1'], ['9-C1-B1'], ['13-C1'], ['1-12-C1'], [''], [null], [undefined], [12], [{}]])('KHÔNG đọc ra khối: %s', (ma) => expect(khoiCuaMaDe(ma)).toBeNull())
  it('danh sách mã (phẩy / chấm phẩy / khoảng trắng): cùng khối ⇒ khối ấy; KHÁC khối ⇒ null (mâu thuẫn — luật thầy 05/10, trước đây lấy khối CAO NHẤT); một mã lạ trong danh sách không làm mất khối của mã còn lại', () => {
    expect(khoiCuaMaDe('DH-11-C2-B4-TN,DH-12-C2-B4-DS')).toBeNull()
    expect(khoiCuaMaDe('DH-11-C2-B4-TN; DH-10-C2-B4-DS')).toBeNull()
    expect(khoiCuaMaDe('X1,DH-11-C2')).toBe(11)
    expect(khoiCuaMaDe('11-C2-B4,12-C2-B4')).toBeNull() // danh sách dạng số-đầu, hai khối
    expect(khoiCuaMaDe('DH-12-C2-B4-TN,12-C2-B4-DS')).toBe(12)
  })
})

describe('khoiCuaLop / khoiCuaEm', () => {
  it.each([['12', 12], [' 11 ', 11], [12, 12], ['Lớp 10', 10], ['khối 11', 11], ['12 - Tinh Hoa', 12], ['12 - Lớp Thường', 12], ['11A2', 11], ['12 · DẠNG BÀI/B8', 12]])('%s ⇒ %s', (v, k) => expect(khoiCuaLop(v)).toBe(k))
  it.each([['Chưa xếp lớp'], [''], [null], ['9'], ['120'], ['13'], ['Tinh Hoa 12']])('không rõ: %s', (v) => expect(khoiCuaLop(v)).toBeNull())
  it('em: hoc_sinh.lop là khối; tên lớp cũng bắt đầu bằng khối; thiếu một nguồn vẫn đọc nguồn kia', () => {
    expect(khoiCuaEm({ lop: '11' })).toBe(11)
    expect(khoiCuaEm({ lop: '', tenLop: '12 - Tinh Hoa' })).toBe(12)
    expect(khoiCuaEm({ lop: '11', ten_lop: null })).toBe(11)
    expect(khoiCuaEm('10')).toBe(10)
    expect(khoiCuaEm({ lop: null, tenLop: 'Chưa xếp lớp' })).toBeNull()
    expect(khoiCuaEm(null)).toBeNull()
  })
  it('em: hai nguồn KHÁC nhau ⇒ KHÔNG RÕ khối (null — luật thầy 05/10, trước đây lấy khối THẤP hơn): không đoán, kênh tự động không đưa câu', () => {
    expect(khoiCuaEm({ lop: '12', tenLop: '11 - Tinh Hoa' })).toBeNull()
    expect(khoiCuaEm({ lop: '10', tenLop: '12 - Lớp Thường' })).toBeNull()
    expect(khoiCuaEm({ lop: '12A1', tenLop: '12 - Tinh Hoa' })).toBe(12)
  })
})

describe('khoiCuaCau — mọi khuôn câu', () => {
  it('câu game (maDe), dòng D1 (ma_de + lop của de_kho), tờ kho R2 (nhom), mã câu BTVN (qid), chuỗi mã', () => {
    expect(khoiCuaCau({ qid: 'Q1', maDe: 'DH-12-C1-B2' })).toBe(12)
    expect(khoiCuaCau({ ma_de: 'DH-11-C2', lop: '11' })).toBe(11)
    expect(khoiCuaCau({ maDe: 'X', nhom: '12 · DẠNG BÀI/B8' })).toBe(12)
    expect(khoiCuaCau({ qid: 'DH-12-C1-B2-I-49' })).toBe(12)
    expect(khoiCuaCau({ id: 'DH-10-C1-B1-I-3' })).toBe(10)
    expect(khoiCuaCau('DB-12-B8-D1')).toBe(12)
    expect(khoiCuaCau({ khoi: '11' })).toBe(11)
  })
  it('nhiều nguồn KHÁC nhau ⇒ MÂU THUẪN ⇒ null (luật thầy 05/10, trước đây lấy khối CAO NHẤT): mã tờ nói 11, cột lop của de_kho nói 12 ⇒ null', () => {
    expect(khoiCuaCau({ maDe: 'DH-11-C2', lop: '12' })).toBeNull()
    expect(khoiCuaCau({ maDe: 'DH-12-C2', qid: 'DH-11-C2-I-1' })).toBeNull()
    expect(khoiCuaCau({ maDe: 'DH-12-C2', qid: 'DH-12-C2-I-1', lop: '12' })).toBe(12)
  })
  it('không đọc ra ⇒ null (mã lạ, thiếu trường, không phải đối tượng)', () => {
    for (const c of [{ qid: 'Q1', maDe: 'D1' }, {}, null, undefined, 5, [], { maDe: '' }]) expect(khoiCuaCau(c)).toBeNull()
  })
})

describe('cauHopKhoi — MỘT định nghĩa (luật thầy 05/10): ĐÚNG khối em, khác khối thấp hay cao đều chặn', () => {
  const cauKhoi = (k: number) => ({ qid: `Q${k}`, maDe: `DH-${k}-C1-B1-TN`, dang: 'Ứng dụng — nhận dạng' }) // CÙNG mã dạng ở mọi khối
  it('ma trận 3 × 3: em 10 chỉ nhận 10; em 11 chỉ nhận 11; em 12 chỉ nhận 12 (luật thầy 05/10 — trước đây em 11 nhận cả 10, em 12 nhận cả ba)', () => {
    const cho: Record<number, number[]> = { 10: [10], 11: [11], 12: [12] }
    for (const e of CAC_KHOI) for (const k of CAC_KHOI) expect(cauHopKhoi(e, cauKhoi(k)), `em ${e} câu ${k}`).toBe(cho[e]!.includes(k))
  })
  it('em 11 và em 10 KHÔNG BAO GIỜ nhận câu tờ khối cao hơn — kể cả trùng mã dạng, kể cả nhãn "sửa lỗi" / "tới hạn ôn" (nhãn vai không đổi khối)', () => {
    for (const vai of ['yeu', 'toi_han', 'thu_thach', 'moi', 'lap', 'trum', 'sua_loi']) {
      expect(cauHopKhoi(11, { ...cauKhoi(12), role: vai }), `em 11 vai ${vai}`).toBe(false)
      expect(cauHopKhoi(10, { ...cauKhoi(11), role: vai }), `em 10 vai ${vai}`).toBe(false)
      expect(cauHopKhoi(10, { ...cauKhoi(12), role: vai }), `em 10 vai ${vai}`).toBe(false)
    }
  })
  it('KHÔNG BIẾT ⇒ CHẶN (luật thầy 05/10, trước đây "không biết ⇒ không kết tội"): khối em không rõ hoặc khối câu không rõ ⇒ false; mã lạ mà cột lop nói đúng khối em ⇒ true', () => {
    expect(cauHopKhoi(null, cauKhoi(12))).toBe(false)
    expect(cauHopKhoi(undefined, cauKhoi(12))).toBe(false)
    expect(cauHopKhoi(11, { qid: 'Q', maDe: 'D1' })).toBe(false)
    expect(cauHopKhoi(11, null)).toBe(false)
    expect(cauHopKhoi(11, { qid: 'Q', maDe: 'D1', lop: '12' })).toBe(false) // mã lạ nhưng cột lop của de_kho nói 12
    expect(cauHopKhoi(12, { qid: 'Q', maDe: 'D1', lop: '12' })).toBe(true) // mã lạ, cột lop nói 12 ⇒ khối 12 (một nguồn, không mâu thuẫn)
  })
  it('tính chất trên 2 000 ca ngẫu nhiên: khối em e, khối câu k đều rõ ⇒ hợp ⇔ k = e (luật thầy 05/10, trước đây k ≤ e); tờ dạng DB- và DH-, qid hay maDe đều như nhau', () => {
    const r = mulberry32(2109)
    for (let i = 0; i < 2000; i++) {
      const e = CAC_KHOI[Math.floor(r() * 3)]!, k = CAC_KHOI[Math.floor(r() * 3)]!
      const ma = `${r() < 0.5 ? 'DH' : 'DB'}-${k}-C${1 + Math.floor(r() * 3)}-B${1 + Math.floor(r() * 9)}`
      const cau = r() < 0.5 ? { maDe: ma, qid: `${ma}-I-${i}` } : { qid: `${ma}-III-${i}` }
      expect(cauHopKhoi(e, cau), `#${i} em ${e} câu ${ma}`).toBe(k === e)
    }
  })
})

describe('locCauHopKhoi / demCauKhongRoKhoi / khoiCaoHon (luật thầy 05/10: khối phải chặn = MỌI khối khác)', () => {
  const kho = [
    { qid: 'a', maDe: 'DH-10-C1' }, { qid: 'b', maDe: 'DH-12-C1' }, { qid: 'c', maDe: 'DH-11-C1' }, { qid: 'd', maDe: 'D1' }, { qid: 'e', maDe: 'DB-12-B8-D1' }, { qid: 'f', maDe: 'DH-11-C2' },
  ]
  it('em 11: bỏ tờ khối 12, khối 10 VÀ câu chưa rõ khối (luật thầy 05/10); chỉ giữ 11; GIỮ NGUYÊN thứ tự; không sửa đầu vào', () => {
    const goc = JSON.stringify(kho)
    expect(locCauHopKhoi(11, kho).map((c) => c.qid)).toEqual(['c', 'f'])
    expect(JSON.stringify(kho)).toBe(goc)
  })
  it('em 10 chỉ còn khối 10; em 12 chỉ còn khối 12; em không rõ khối ⇒ không câu nào (luật thầy 05/10); không phải mảng ⇒ []', () => {
    expect(locCauHopKhoi(10, kho).map((c) => c.qid)).toEqual(['a'])
    expect(locCauHopKhoi(12, kho).map((c) => c.qid)).toEqual(['b', 'e'])
    expect(locCauHopKhoi(null, kho)).toHaveLength(0)
    expect(locCauHopKhoi(11, null as unknown as never[])).toEqual([])
  })
  it('đếm câu không rõ khối; các khối phải CHẶN = mọi khối khác khối em (luật thầy 05/10, trước đây chỉ khối cao hơn); không rõ khối em ⇒ chặn mọi khối', () => {
    expect(demCauKhongRoKhoi(kho)).toBe(1)
    expect(demCauKhongRoKhoi(null as unknown as never[])).toBe(0)
    expect(khoiCaoHon(10)).toEqual([11, 12])
    expect(khoiCaoHon(11)).toEqual([10, 12])
    expect(khoiCaoHon(12)).toEqual([10, 11])
    expect(khoiCaoHon(null)).toEqual([10, 11, 12])
    expect(khoiCaoHon(9 as unknown as Khoi)).toEqual([10, 11, 12])
  })
})

describe('locCauKemDem — lọc kèm ĐẾM để máy chủ đo (luật thầy 05/10: tờ không rõ khối bị CHẶN và được đếm riêng; trước đây vẫn cho)', () => {
  const kho = [
    { qid: 'a', maDe: 'DH-10-C1' }, { qid: 'b', maDe: 'DH-12-C1' }, { qid: 'c', maDe: 'DH-11-C1' }, { qid: 'd', maDe: 'D1' }, { qid: 'e', maDe: 'DB-12-B8-D1' }, { qid: 'f', maDe: 'TO-LA' },
  ]
  it('em 11: chỉ giữ c (thứ tự cũ); chặn 3 câu khác khối (a lớp 10, b và e lớp 12) và 2 câu không rõ khối (d,f) — đếm theo lý do', () => {
    const r = locCauKemDem(11, kho)
    expect(r.giu.map((c) => c.qid)).toEqual(['c'])
    expect(r.khacKhoi).toBe(3)
    expect(r.khongRo).toBe(2)
    expect(r.boCao).toBe(5)
  })
  it('em không rõ khối ⇒ chặn hết, đếm vào emKhongRo (luật thầy 05/10); em 12 ⇒ giữ b,e; chặn a,c (khác khối) và d,f (không rõ)', () => {
    expect(locCauKemDem(null, kho)).toMatchObject({ boCao: 6, emKhongRo: 6, khongRo: 0 })
    expect(locCauKemDem(undefined, kho).giu).toHaveLength(0)
    expect(locCauKemDem(12, kho)).toMatchObject({ boCao: 4, khacKhoi: 2, khongRo: 2 })
    expect(locCauKemDem(12, kho).giu.map((c) => c.qid)).toEqual(['b', 'e'])
  })
  it('em 10: chặn b,c,e (khác khối) và d,f (không rõ); giữ a; đầu vào không phải mảng ⇒ rỗng, không ném lỗi; không sửa đầu vào', () => {
    const goc = JSON.stringify(kho)
    expect(locCauKemDem(10, kho)).toMatchObject({ boCao: 5, khacKhoi: 3, khongRo: 2 })
    expect(JSON.stringify(kho)).toBe(goc)
    expect(locCauKemDem(10, null as unknown as never[])).toEqual({ giu: [], khacKhoi: 0, khongRo: 0, mauThuan: 0, emKhongRo: 0, boCao: 0 })
  })
  it('khớp locCauHopKhoi: cùng tập câu được giữ, với mọi khối em', () => {
    for (const e of [null, 10, 11, 12] as Array<Khoi | null>) expect(locCauKemDem(e, kho).giu).toEqual(locCauHopKhoi(e, kho))
  })
})
