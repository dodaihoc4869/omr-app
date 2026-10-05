// @vitest-environment node
// CHẶN CÂU KHÁC KHỐI — LUẬT CHUNG + CỔNG CUỐI (điều phối 05/10/2026, lỗi trên app đang chạy). Lệnh thầy 05/10 (nguyên văn):
//   1) "rất nhiều cấu thuộc lớp 10 nhưng bị rút nhầm sang lớp 11, bạn phải chặn chuẩn 100% không được rút nhầm kho khác khối cho tôi nhé"
//   2) "mục câu cần chữa của khối 11 khi chiếu lên bảng thì rất nhiều câu của lớp 10 bị chèn vào, bạn xem mọi chỗ chặn triệt để rút nhầm câu của kho khối khác"
// Tệp này: luật chung `src/lib/khoi-cau.ts` (ĐÚNG khối, mâu thuẫn/không rõ ⇒ null, khối theo CHƯƠNG) + cổng `server/src/chan-khac-khoi.ts` (đếm theo lý do,
// làm giàu nguồn khối từ D1, luật A cho em / luật B cho lớp). Từng kênh rút câu & danh sách chữa bài: tests/chan-khac-khoi-kenh-0510.test.ts (+ OMNI: -omni-0510).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mulberry32 } from '../src/lib/exam-shuffle'
import { CAC_KHOI, KHOI_THEO_MA_CHUONG, cauHopKhoi, khoiCuaCau, khoiCuaChuong, khoiCuaEm, khoiCuaMaDe, locCauKemDem, lyDoChanKhoi, phanTichKhoiCau, type Khoi } from '../src/lib/khoi-cau'
import { DS_CHUONG, TEN_CHUONG } from '../src/lib/tu-vung-dang'
import { BO_CHIA_KHOA } from '../src/lib/loi-giai-bo'
import { chanKhacKhoiEm, chanKhacKhoiLop, chanKhacKhoiTheoEm, chanMetaKhacKhoi, congKhoi, demChanKhoi, docKhoiChungCacEm, docKhoiLopCong, khoiDichLop, xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { taoD1That } from './_d1-that'

afterEach(() => { vi.restoreAllMocks(); xoaDemChanKhoi() })

describe('Bảng CHƯƠNG → KHỐI (chương trình Hoá 2018, thầy 05/10)', () => {
  it('đủ 21 mã chương của từ vựng đóng `tu-vung-dang.ts`, mỗi mã đúng khối bộ chìa khoá `loi-giai-bo.ts` ghi', () => {
    expect(Object.keys(KHOI_THEO_MA_CHUONG).sort()).toEqual([...DS_CHUONG].sort())
    for (const [ma, bo] of Object.entries(BO_CHIA_KHOA)) expect(KHOI_THEO_MA_CHUONG[ma], ma).toBe(Number(bo.lop))
    for (const [ma, ten] of Object.entries(TEN_CHUONG)) expect(khoiCuaChuong(ten), `${ma}: ${ten}`).toBe(KHOI_THEO_MA_CHUONG[ma])
  })
  it.each([
    ['Cấu tạo nguyên tử', 10], ['Bảng tuần hoàn', 10], ['Liên kết hoá học', 10], ['Phản ứng oxi hoá – khử', 10], ['Năng lượng hoá học', 10], ['Tốc độ phản ứng', 10], ['Halogen', 10],
    ['Cân bằng hoá học', 11], ['Nitrogen – sulfur', 11], ['Đại cương hoá học hữu cơ', 11], ['Hydrocarbon', 11], ['Dẫn xuất halogen – alcohol – phenol', 11], ['Hợp chất carbonyl – carboxylic acid', 11],
    ['Ester – lipid', 12], ['Carbohydrate', 12], ['Hợp chất chứa nitrogen', 12], ['Polymer', 12], ['Pin điện và điện phân', 12], ['Đại cương kim loại', 12], ['Kim loại nhóm IA, IIA', 12],
    ['Sơ lược dãy kim loại chuyển tiếp thứ nhất và phức chất', 12],
  ])('tên chương thầy liệt kê: %s ⇒ lớp %s', (ten, k) => expect(khoiCuaChuong(ten)).toBe(k))
  it('mã dạng 3 tầng ⇒ chương ở đoạn đầu; "CD:<tên>"; hoá/hóa như nhau; đối tượng {ma}; chữ tự do / mã lạ ⇒ null (không đoán)', () => {
    expect(khoiCuaChuong('CAN_BANG.DIEN_LI.NHAN_DANG')).toBe(11)
    expect(khoiCuaChuong('ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG')).toBe(12)
    expect(khoiCuaChuong('NGUYEN_TU')).toBe(10)
    expect(khoiCuaChuong('CD:Cân bằng hóa học')).toBe(11)
    expect(khoiCuaChuong({ ma: 'HALOGEN.X.Y', ten: 'Halogen' })).toBe(10)
    for (const v of ['Este', 'Amin', 'Điện phân', 'A.1', 'HSE', 'D1', '12 · Ester', '', null, undefined, 12, {}]) expect(khoiCuaChuong(v), String(v)).toBeNull()
  })
})

describe('phanTichKhoiCau — mọi nguồn phải KHỚP (mâu thuẫn ⇒ null, không lấy khối cao nhất như luật 21/09)', () => {
  it('rõ: mã tờ + mã câu + cột lop + nhóm + chương cùng một khối', () => {
    expect(phanTichKhoiCau({ qid: 'DH-11-C2-B1-I-3', maDe: 'DH-11-C2-B1', lop: '11', nhom: '11 · DẠY HỌC/C2', dang: 'CAN_BANG.CAN_BANG.NHAN_DANG' })).toEqual({ khoi: 11, tinhTrang: 'ro', cacKhoi: [11] })
    expect(khoiCuaCau({ qid: '100-III-5', maDe: '100', dang: 'CARBOHYDRATE.X.Y' })).toBe(12) // tờ "100" không có khối trong mã: chương cứu
    expect(khoiCuaCau('DH-12-C1-B2-I-49~ss0')).toBe(12) // câu song sinh theo câu gốc
  })
  it.each([
    [{ qid: 'DH-10-C1-B1-I-1', maDe: 'DH-11-C1-B1' }, [10, 11]],
    [{ maDe: 'DH-11-C2', lop: '10' }, [10, 11]],
    [{ qid: 'Q1', dang: 'CAN_BANG.CAN_BANG.NHAN_DANG', chuong: 'Carbohydrate' }, [11, 12]], // chỉ có chương mà hai chương hai khối
    [{ maDe: 'DH-11-C1', nhom: '10 · DẠY HỌC/C1' }, [10, 11]],
    [{ maDe: 'DH-11-C1,DH-10-C1' }, [10, 11]],
  ])('mâu thuẫn %j ⇒ null', (c, cacKhoi) => {
    expect(phanTichKhoiCau(c)).toEqual({ khoi: null, tinhTrang: 'mau_thuan', cacKhoi })
    expect(khoiCuaCau(c)).toBeNull()
  })
  it('chương CHỈ cứu câu tờ không có khối — đề ôn khối 12 có câu kiến thức lớp 10/11 vẫn là câu kho khối 12 (không mâu thuẫn)', () => {
    expect(phanTichKhoiCau({ maDe: 'DH-12-C1', dang: 'CAN_BANG.CAN_BANG.NHAN_DANG' })).toEqual({ khoi: 12, tinhTrang: 'ro', cacKhoi: [12] })
    expect(phanTichKhoiCau({ qid: '12-KT-C1-D1-I-3', maDe: '12-KT-C1-D1', chuong: 'Phản ứng oxi hoá – khử' })).toEqual({ khoi: 12, tinhTrang: 'ro', cacKhoi: [12] })
    expect(cauHopKhoi(11, { maDe: 'DH-12-C1', dang: 'CAN_BANG.CAN_BANG.NHAN_DANG' })).toBe(false) // em lớp 11 vẫn không nhận câu kho khối 12
    expect(cauHopKhoi(12, { maDe: 'DH-12-C1', dang: 'CAN_BANG.CAN_BANG.NHAN_DANG' })).toBe(true)
    expect(khoiCuaCau({ qid: '100-III-5', maDe: '100', dang: 'CARBOHYDRATE.X.Y' })).toBe(12) // tờ không có khối: chương cứu
  })
  it('không rõ: không nguồn nào đọc ra', () => {
    for (const c of [{ qid: 'Q1', maDe: 'D1' }, { qid: 'HS1', maDe: 'DH-B1', dang: 'HSE' }, '100-I-1', {}, null]) expect(phanTichKhoiCau(c).tinhTrang, JSON.stringify(c)).toBe('khong_ro')
  })
  it('khối em: hai nguồn khác nhau ⇒ null; "12A1" ⇒ 12', () => {
    expect(khoiCuaEm({ lop: '12A1' })).toBe(12)
    expect(khoiCuaEm({ lop: '11', tenLop: '11 - Tinh Hoa' })).toBe(11)
    expect(khoiCuaEm({ lop: '12', tenLop: '11 - Tinh Hoa' })).toBeNull()
  })
})

describe('cauHopKhoi / lyDoChanKhoi — ĐÚNG khối, lý do chặn', () => {
  it('lý do: khác khối (thấp hay cao) · không rõ · mâu thuẫn · em không rõ', () => {
    expect(lyDoChanKhoi(11, { maDe: 'DH-11-C1' })).toBeNull()
    expect(lyDoChanKhoi(11, { maDe: 'DH-10-C1' })).toBe('khac_khoi')
    expect(lyDoChanKhoi(11, { maDe: 'DH-12-C1' })).toBe('khac_khoi')
    expect(lyDoChanKhoi(11, { maDe: 'TO-LA' })).toBe('khong_ro')
    expect(lyDoChanKhoi(11, { maDe: 'DH-11-C1', qid: 'DH-10-C1-I-1' })).toBe('mau_thuan')
    expect(lyDoChanKhoi(null, { maDe: 'DH-11-C1' })).toBe('em_khong_ro')
    expect(lyDoChanKhoi(undefined, { maDe: 'DH-11-C1' })).toBe('em_khong_ro')
  })
  it('tính chất trên 3 000 câu ngẫu nhiên (hạt 0510): hợp ⇔ mọi nguồn đọc được (chương chỉ khi tờ/mã câu/cột lớp không nói khối) cùng MỘT khối và khối ấy = khối em', () => {
    const r = mulberry32(510)
    const chuong: Record<Khoi, string[]> = { 10: [], 11: [], 12: [] }
    for (const [ma, k] of Object.entries(KHOI_THEO_MA_CHUONG)) chuong[k].push(`${ma}.X.Y`)
    const chon = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)]!
    for (let i = 0; i < 3000; i++) {
      const e = chon([10, 11, 12, null] as const)
      const nguon: Array<Khoi | null> = [chon([...CAC_KHOI, null]), chon([...CAC_KHOI, null]), chon([...CAC_KHOI, null]), chon([...CAC_KHOI, null])]
      const [kMa, kQid, kLop, kChuong] = nguon
      const c = {
        maDe: kMa ? `${r() < 0.5 ? 'DH' : 'DB'}-${kMa}-C1-B${i}` : `TO${i}`,
        qid: kQid ? `${kQid}-C1-B${i}-I-${i}` : `Q${i}`,
        ...(kLop ? { lop: String(kLop) } : {}),
        ...(kChuong ? { dang: chon(chuong[kChuong]) } : {}),
      }
      const chinh = new Set([kMa, kQid, kLop].filter((x): x is Khoi => x !== null))
      const doc = chinh.size ? chinh : new Set([kChuong].filter((x): x is Khoi => x !== null))
      const mongDoi = e !== null && doc.size === 1 && doc.has(e)
      expect(cauHopKhoi(e, c), `#${i} em ${e} câu ${JSON.stringify(c)}`).toBe(mongDoi)
    }
  })
  it('locCauKemDem đếm theo lý do và giữ thứ tự', () => {
    const ds = [{ qid: 'a', maDe: 'DH-11-C1' }, { qid: 'b', maDe: 'DH-10-C1' }, { qid: 'c', maDe: 'X' }, { qid: 'DH-12-Z-I-1', maDe: 'DH-11-C1' }, { qid: 'e', maDe: 'DH-11-C2' }]
    expect(locCauKemDem(11, ds)).toEqual({ giu: [ds[0], ds[4]], khacKhoi: 1, khongRo: 1, mauThuan: 1, emKhongRo: 0, boCao: 3 })
  })
})

describe('Cổng cuối `chan-khac-khoi.ts` — luật A (em), luật B (lớp), đếm + console', () => {
  const ds = [
    { qid: 'DH-11-C1-B1-I-1', maDe: 'DH-11-C1-B1' }, // đúng khối 11
    { qid: 'DH-10-C1-B1-I-1', maDe: 'DH-10-C1-B1' }, // khác khối (thấp hơn)
    { qid: 'DH-12-C1-B1-I-1', maDe: 'DH-12-C1-B1' }, // khác khối (cao hơn)
    { qid: 'TO-LA-I-1', maDe: 'TO-LA' }, // không rõ
    { qid: 'DH-10-C9-I-1', maDe: 'DH-11-C9' }, // mâu thuẫn
  ]
  it('luật A: em 11 chỉ còn câu khối 11; đếm khác khối 2 · không rõ 1 · mâu thuẫn 1; ghi một dòng console có tên kênh', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    expect(congKhoi('em', 'thu', 11, ds)).toEqual([ds[0]])
    expect(demChanKhoi()['em:thu']).toMatchObject({ giu: 1, khac_khoi: 2, khong_ro: 1, mau_thuan: 1, em_khong_ro: 0 })
    expect(log).toHaveBeenCalledWith('[chan-khac-khoi]', expect.stringContaining('"kenh":"thu"'))
  })
  it('luật A: em không rõ khối ⇒ không câu nào, trừ câu nơi gọi đánh dấu THẦY GIAO TRỰC TIẾP', () => {
    expect(congKhoi('em', 'thu', null, ds)).toEqual([])
    expect(congKhoi('em', 'thu', null, ds, { thayGiao: (x) => x.qid === 'DH-10-C1-B1-I-1' })).toEqual([ds[1]])
    expect(demChanKhoi()['em:thu']).toMatchObject({ em_khong_ro: 9, qua_thay_giao: 1 })
  })
  it('luật B: lớp 11 chặn khác khối + mâu thuẫn, GIỮ câu không rõ khối (có đếm); lớp chưa rõ khối ⇒ giữ hết', () => {
    expect(congKhoi('lop', 'ds', 11, ds)).toEqual([ds[0], ds[3]])
    expect(congKhoi('lop', 'ds', [], ds)).toEqual(ds)
    expect(demChanKhoi()['lop:ds']).toMatchObject({ khac_khoi: 2, mau_thuan: 1, qua_khong_ro: 6 })
  })
  it('khối đích lớp: tên lớp đọc ra khối; không ⇒ khối của các em; khối CHUNG của đội (lẫn khối ⇒ null)', async () => {
    const d = taoD1That()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,cap_nhat_luc) VALUES('A','A','11','11 - Tinh Hoa','x'),('B','B','11',NULL,'x'),('C','C','10',NULL,'x'),('D','D','12',' 11 - Lệch','x')")
    expect(khoiDichLop('11 - Tinh Hoa')).toEqual([11])
    expect(khoiDichLop('Lớp thử', [10, null, 12, 10])).toEqual([10, 12])
    expect(await docKhoiLopCong(d.env, { lop: 'Lớp thử', sbd: ['A', 'B'] })).toEqual([11])
    expect(await docKhoiLopCong(d.env, { lop: '12A1', sbd: ['A'] })).toEqual([12])
    expect(await docKhoiChungCacEm(d.env, ['A', 'B'])).toBe(11)
    expect(await docKhoiChungCacEm(d.env, ['A', 'C'])).toBeNull() // đội lẫn khối ⇒ không câu chung
    expect(await docKhoiChungCacEm(d.env, ['A', 'D'])).toBeNull() // em D: lop 12 nhưng tên lớp 11 ⇒ không rõ
    expect(await docKhoiChungCacEm(d.env, ['A', 'KHONG-CO'])).toBeNull()
  })
  it('D1: làm giàu nguồn khối (de_kho.lop, cau_hoi.lop, nhiều tờ) — câu tự thân không rõ được CỨU khi de_kho nói đúng khối; tờ hai khối ⇒ mâu thuẫn', async () => {
    const d = taoD1That()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S11','Em','11','x')")
    d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,da_xoa,cap_nhat_luc) VALUES('100','Bộ đề','11',1,0,'x'),('DH-11-C7','T','10',1,0,'x')")
    const q = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
    q.run('100', '100-I-1', 'v', 'g1', 'A.1', '{}')
    q.run('DH-11-C7', 'DH-11-C7-I-1', 'v', 'g2', 'A.1', '{}')
    q.run('DH-11-C8', 'DH-11-C8-I-1', 'v', 'g3', 'A.1', '{}')
    q.run('DH-10-C8', 'DH-11-C8-I-1', 'v', 'g3', 'A.1', '{}') // CÙNG qid ở tờ khối 10
    const vao = ['100-I-1', 'DH-11-C7-I-1', 'DH-11-C8-I-1', 'DH-11-C9-I-1']
    expect(await chanKhacKhoiEm(d.env, 'giau', 'S11', vao, { lamGiau: 'luon' })).toEqual(['100-I-1', 'DH-11-C9-I-1'])
    expect(demChanKhoi()['em:giau']).toMatchObject({ giu: 2, mau_thuan: 2 })
    // mặc định cổng em chỉ làm giàu câu không rõ ⇒ vẫn cứu `100-I-1`, không tốn truy vấn cho câu đã rõ
    expect(await chanKhacKhoiEm(d.env, 'giau2', { khoiEm: 11 }, ['100-I-1', 'DH-11-C9-I-1'])).toEqual(['100-I-1', 'DH-11-C9-I-1'])
    // cổng lớp mặc định làm giàu mọi câu
    expect(await chanKhacKhoiLop(d.env, 'giau3', { lop: '11 - A' }, vao)).toEqual(['100-I-1', 'DH-11-C9-I-1'])
  })
  it('nhiều em một lượt (Kiểm tra đầu giờ / hồ sơ ôn ca): mỗi em chỉ còn câu đúng khối CỦA EM ẤY', async () => {
    const d = taoD1That()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('E10','A','10','x'),('E11','B','11','x'),('ELA','C','Chưa xếp','x')")
    const cau = ['DH-10-C1-I-1', 'DH-11-C1-I-1', 'DH-12-C1-I-1']
    const ra = await chanKhacKhoiTheoEm(d.env, 'nhieu', new Map([['E10', cau], ['E11', cau], ['ELA', cau]]))
    expect(Object.fromEntries(ra)).toEqual({ E10: ['DH-10-C1-I-1'], E11: ['DH-11-C1-I-1'], ELA: [] })
  })
  it('hồ sơ Hoá 2.0: `chanMetaKhacKhoi` xoá câu khác khối khỏi meta; em chưa rõ khối giữ câu thầy giao trực tiếp; cổng cuối nhớ hồ sơ đã lọc (0 truy vấn)', async () => {
    const d = taoD1That()
    const meta = new Map<string, unknown>([['a', { qid: 'a', maDe: 'DH-11-C1' }], ['b', { qid: 'b', maDe: 'DH-10-C1' }], ['c', { qid: 'c', maDe: 'X' }]])
    expect(await chanMetaKhacKhoi(d.env, 'hs', 11, meta)).toBe(2)
    expect([...meta.keys()]).toEqual(['a'])
    const meta2 = new Map<string, unknown>([['a', { qid: 'a', maDe: 'DH-11-C1' }], ['b', { qid: 'b', maDe: 'DH-10-C1' }]])
    expect(await chanMetaKhacKhoi(d.env, 'hs', null, meta2, (q) => q === 'b')).toBe(1)
    expect([...meta2.keys()]).toEqual(['b'])
    d.soLenh.prepare = 0
    expect(await chanKhacKhoiEm(d.env, 'cuoi', { meta: meta2 }, [{ qid: 'b', maDe: 'DH-10-C1' }, { qid: 'z', maDe: 'DH-11-C1' }])).toEqual([{ qid: 'b', maDe: 'DH-10-C1' }])
    expect(d.soLenh.prepare).toBe(0)
  })
  it('em lẫn khối / lỗi đọc D1 ⇒ không rõ khối ⇒ chặn (thà thiếu câu còn hơn lọt câu khác khối)', async () => {
    const d = taoD1That()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,cap_nhat_luc) VALUES('L','A','12','11 - Tinh Hoa','x')")
    expect(await chanKhacKhoiEm(d.env, 'lech', 'L', ['DH-11-C1-I-1', 'DH-12-C1-I-1'])).toEqual([])
    const hong = { ...d.env, DB: { ...d.env.DB, prepare: () => { throw new Error('D1 sập') } } } as unknown as typeof d.env
    expect(await chanKhacKhoiEm(hong, 'hong', 'L', ['DH-11-C1-I-1'])).toEqual([])
  })
})

describe('Bất biến khối trên nhiều hạt giống: mọi khối em × mọi kho trộn 3 khối + không rõ + mâu thuẫn ⇒ cổng em KHÔNG BAO GIỜ cho qua câu sai khối', () => {
  it('2 000 kho ngẫu nhiên', () => {
    for (let hat = 0; hat < 2000; hat++) {
      const r = mulberry32(5100 + hat)
      const kho = Array.from({ length: 12 }, (_, i) => {
        const x = r()
        const k = CAC_KHOI[Math.floor(r() * 3)]!
        if (x < 0.15) return { qid: `LA-${i}`, maDe: 'LA' } // không rõ
        if (x < 0.3) return { qid: `DH-${k}-C1-I-${i}`, maDe: `DH-${k === 12 ? 11 : k + 1}-C1` } // mâu thuẫn
        return { qid: `DH-${k}-C1-I-${i}`, maDe: `DH-${k}-C1` }
      })
      const e = ([10, 11, 12, null] as const)[hat % 4]!
      for (const c of congKhoi('em', 'bat_bien', e, kho)) {
        expect(e).not.toBeNull()
        expect(phanTichKhoiCau(c), `hạt ${hat} em ${e} ${JSON.stringify(c)}`).toEqual({ khoi: e, tinhTrang: 'ro', cacKhoi: [e] })
      }
    }
  })
})
