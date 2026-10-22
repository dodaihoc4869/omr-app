// HỒ SƠ 6 MỨC — ĐỌC HỢP ĐỒNG Ở MÁY KHÁCH (thầy duyệt bản vẽ docs/ban-ve-ho-so-em-2210, 22/10). Đặc tả mục 4 + 7:
// `docMucLam` GIỮ treo / giayTreo / daDoTreo (trước đây bỏ mọi trường lạ ⇒ treo rơi mất); `docTongMucLam` đọc soTreo / soCoTinh / soChuaDoTreo và vẫn đòi ĐÚNG 4 dòng;
// `mucLam6` sai khung ⇒ bỏ (giao diện coi như máy chủ cũ: "Chưa đo treo máy"); bản học sinh / phụ huynh: máy khách chặn thêm một lớp Mức 6 ⇒ 5.
import { describe, expect, it } from 'vitest'
import { chuanHoaMucLam, docMucLam, docMucLam6, docTongMucLam } from '../src/components/chien-dich/muc-lam-giao-dien'
import { chuaDoTreoHet, chuTreoEm, chuTreoThay, locLuot, maHien } from '../src/components/chien-dich/ho-so-6-muc'
import { lichSu6MucGia } from '../scripts/chup-v2/gia/lich-su-6-muc'

const M = { ma: 1, giay: 14, giayDoc: 24, sanNghi: 6, ranh2: 24, ranh3: 30 }

describe('docMucLam — trường treo máy', () => {
  it('giữ treo + giayTreo; giữ daDoTreo; vắng cả hai ⇒ lượt cũ (không đoán)', () => {
    expect(docMucLam({ ...M, treo: 'treo', giayTreo: 434 })).toMatchObject({ ma: 1, treo: 'treo', giayTreo: 434 })
    expect(docMucLam({ ...M, treo: 'co_tinh', giayTreo: 660 })).toMatchObject({ treo: 'co_tinh', giayTreo: 660 })
    expect(docMucLam({ ...M, daDoTreo: true })).toMatchObject({ daDoTreo: true })
    const cu = docMucLam(M)!
    expect('treo' in cu || 'daDoTreo' in cu || 'giayTreo' in cu).toBe(false)
  })
  it('giá trị lạ ⇒ bỏ trường; giayTreo không có treo ⇒ bỏ; daDoTreo đi cùng treo ⇒ bỏ (treo đè)', () => {
    const la = docMucLam({ ...M, treo: 'ngu', giayTreo: 'x', daDoTreo: 'co' })!
    expect('treo' in la || 'giayTreo' in la || 'daDoTreo' in la).toBe(false)
    expect('giayTreo' in docMucLam({ ...M, giayTreo: 300 })!).toBe(false)
    expect('daDoTreo' in docMucLam({ ...M, treo: 'treo', daDoTreo: true })!).toBe(false)
  })
})

describe('docTongMucLam / docMucLam6', () => {
  const tong = { soDo: 6, chuaCoSoDo: 1, theoMuc: [1, 2, 3, 4].map((ma) => ({ ma, luot: 1, dung: 1, sai: 0 })), saiLamVoi: 0, saiDuNghi: 0, dungTruocDoc: 0, coBetaThat: true, soUocTinh: 0, soTreo: 1, soCoTinh: 1, soChuaDoTreo: 2 }
  it('đọc soTreo / soCoTinh / soChuaDoTreo; vẫn đòi đúng 4 dòng (máy còn mã cũ không vỡ)', () => {
    expect(docTongMucLam(tong)).toMatchObject({ soTreo: 1, soCoTinh: 1, soChuaDoTreo: 2 })
    expect(docTongMucLam({ ...tong, theoMuc: [...tong.theoMuc, { ma: 5, luot: 1, dung: 0, sai: 1 }] })).toBeUndefined()
    const cu = docTongMucLam({ ...tong, soTreo: undefined, soCoTinh: undefined, soChuaDoTreo: undefined })!
    expect([cu.soTreo, cu.soCoTinh, cu.soChuaDoTreo]).toEqual([0, 0, 0])
    expect(chuaDoTreoHet(cu, false)).toBe(true) // máy chủ cũ (không `mucLam6`) ⇒ "Chưa đo treo máy"
    expect(chuaDoTreoHet({ ...cu, soChuaDoTreo: cu.soDo }, true)).toBe(true) // mọi lượt có số đo đều là lượt cũ
    expect(chuaDoTreoHet(cu, true)).toBe(false) // có `mucLam6`, lượt đã đo treo ⇒ đo được
  })
  it('mucLam6: đọc đủ khung; sai khung (thiếu bay / ngày lạ) ⇒ undefined; theoNgay khác 7 hàng ⇒ ẩn khối', () => {
    const kq = lichSu6MucGia('11010', 'Lý Quang Minh', 'thay')
    const m = docMucLam6(JSON.parse(JSON.stringify(kq.mucLam6)))!
    expect([m.tu, m.den]).toEqual(['2026-10-16', '2026-10-22'])
    expect(m.theoNgay).toHaveLength(7)
    expect(m.bay).toMatchObject({ soTreo: 2, soCoTinh: 4 })
    expect(m.treoDungSai).toEqual({ treo: { dung: 1, sai: 1 }, coTinh: { dung: 1, sai: 3 } })
    expect(m.ngayCoTinh![0]).toMatchObject({ ngay: '2026-10-21', so: 4 })
    expect(m.lam7).toMatchObject({ soLuot: 15, soDung: 6, soTreo: 6 })
    expect(docMucLam6({ ...kq.mucLam6, bay: null })).toBeUndefined()
    expect(docMucLam6({ ...kq.mucLam6, tu: '16/10' })).toBeUndefined()
    expect(docMucLam6({ ...kq.mucLam6, theoNgay: kq.mucLam6!.theoNgay.slice(1) })!.theoNgay).toEqual([])
  })
  it('chuanHoaMucLam(…, false): học sinh / phụ huynh KHÔNG BAO GIỜ còn Mức 6 dù máy chủ lỡ gửi', () => {
    const kq = lichSu6MucGia('11010', 'Lý Quang Minh', 'thay')
    const em = chuanHoaMucLam(JSON.parse(JSON.stringify(kq)), false)
    expect(JSON.stringify(em)).not.toContain('co_tinh')
    expect(em.mucLam6!.ngayCoTinh).toBeUndefined()
    expect(em.mucLam6!.bay).toMatchObject({ soTreo: 6, soCoTinh: 0 })
    expect(em.mucLam6!.treoDungSai).toEqual({ treo: { dung: 2, sai: 4 }, coTinh: { dung: 0, sai: 0 } })
    expect(em.mucLam6!.theoNgay.every((n) => n.dem[5] === 0)).toBe(true)
    const thay = chuanHoaMucLam(JSON.parse(JSON.stringify(kq)))
    expect(thay.lan.filter((l) => l.mucLam?.treo === 'co_tinh')).toHaveLength(4)
    // máy chủ cũ (không mucLam6): nguyên như trước
    const { mucLam6: _bo, ...cu } = kq
    expect('mucLam6' in chuanHoaMucLam(cu as typeof kq)).toBe(false)
  })
})

describe('chữ phút · mức hiện · lọc', () => {
  it('thầy: giây chính xác, từ 60 phút đổi giờ; học sinh: tròn phút', () => {
    expect(chuTreoThay(434)).toBe('7 phút 14 giây')
    expect(chuTreoThay(660)).toBe('11 phút')
    expect(chuTreoThay(45)).toBe('45 giây')
    expect(chuTreoThay(7200)).toBe('2 giờ')
    expect(chuTreoThay(3900)).toBe('1 giờ 5 phút')
    expect(chuTreoEm(434)).toBe('7 phút')
    expect(chuTreoEm(20)).toBe('dưới 1 phút')
    expect(chuTreoEm(7200)).toBe('2 giờ')
  })
  it('treo ĐÈ lên ma; học sinh / phụ huynh hiện 5 cho cả co_tinh', () => {
    expect(maHien({ ma: 1, treo: 'treo' }, true)).toBe(5)
    expect(maHien({ ma: 3, treo: 'co_tinh' }, true)).toBe(6)
    expect(maHien({ ma: 3, treo: 'co_tinh' }, false)).toBe(5)
    expect(maHien({ ma: 4 }, true)).toBe(4)
  })
  it('locLuot: sai · treo (cả ngày) · chưa có số đo', () => {
    const { lan } = lichSu6MucGia('11010', 'Lý Quang Minh', 'thay')
    expect(locLuot(lan, { loai: 'tat-ca' })).toHaveLength(lan.length)
    expect(locLuot(lan, { loai: 'sai' }).every((l) => l.dung === false)).toBe(true)
    expect(locLuot(lan, { loai: 'treo' })).toHaveLength(6)
    expect(locLuot(lan, { loai: 'treo', ngay: '2026-10-21' })).toHaveLength(4)
    expect(locLuot(lan, { loai: 'chua-so-do' }).every((l) => !l.mucLam)).toBe(true)
  })
})
