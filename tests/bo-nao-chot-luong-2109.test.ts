// BỘ NÃO — CHỐT LUỒNG CẢ LỚP (`chotLuongCaLop`, `tinhDangCaLopYeu`, `phanLuong` có điểm ưu tiên; Code 1, 21/09/2026, theo Boss sau lượt lay.mjs thật: 220 em có thẻ, 115 vào luồng SÂU).
// (1) dạng cả lớp cùng sai ⇒ MỘT dòng `dangCaLopYeu`, không đẩy từng em vào sâu · (2) trần luồng sâu ≤ 25 % số em có thẻ, chọn theo điểm ưu tiên · tất định, chạy lại cùng kết quả.
import { describe, expect, it } from 'vitest'
import { hashSeed } from '../src/lib/exam-shuffle'
import { NGUONG_BO_NAO, chotLuongCaLop, phanLuong, tinhBucTranhLop, tinhDangCaLopYeu, toiLuotSoiKy, type CoThuatToan, type Luong, type TheNgan } from '../src/lib/bo-nao-dac-trung'

const NGAY = '2026-09-22'

/** Thẻ tối thiểu hợp lệ; ghi đè từng phần. */
function mkThe(o: Partial<TheNgan> & { sai?: Record<string, number>; vang?: number } = {}): TheNgan {
  const { sai, vang, ...con } = o
  return {
    ngay: NGAY,
    maDang: [],
    bacCuaMaDang: [],
    hoatDong: { ngayCoBai7: 5, soNgayVang: vang ?? 0, soNgayTuLucDau: 30 },
    cau: { lam7: 40, dung7: 30, sai7: 10, tiLe7: 0.75, lam3: 18, tiLe3: 0.75, lam4Truoc: 22, lamHomQua: 6, dungHomQua: 4 },
    xuHuong: 'on',
    giay: { trungVi7: 40, homQua: 40 },
    nguon: { btvn7: 30, btvn2: 12, onLai7: 10, game7: 0, khac7: 0 },
    chuoi: 0,
    datNgay7: 0,
    ngayNghi7: 0,
    btvn: { baiMo: 0, changXong: 0, tongChang: null },
    noOn: 0,
    exp: { tong: null, cap: null },
    ca: null,
    dangChuY: Object.entries(sai ?? {}).map(([ma, s]) => ({ ma, gap: 10, sai: s, bac: 0 as const, tiLeKhacPhuc: 0.3, lam7: s + 2, sai7: s })),
    co: [],
    mocDangKhen: [],
    luotSoiKyTuan: false,
    khiNaoVietPhuHuynh: [],
    loiNhanGanDay: [],
    homQuaDc: null,
    ...con,
  } as TheNgan
}
const saiLap = (sai: Record<string, number>, o: Partial<TheNgan> = {}) => mkThe({ sai, co: ['sai_lap'], ...o })
interface E { sbd: string; luong: Luong; the: TheNgan }
const ds = (n: number, mk: (i: number) => TheNgan, luong: Luong = 'sau', dau = 'e'): E[] => Array.from({ length: n }, (_, i) => ({ sbd: `${dau}${String(i).padStart(3, '0')}`, luong, the: mk(i) }))
const soSau = (m: Map<string, { luong: Luong }>) => [...m.values()].filter((x) => x.luong === 'sau').length

describe('dạng CẢ LỚP cùng sai (≥ 30 % em có hoạt động, ≥ 3 em)', () => {
  it('47 em cùng sai một dạng trong 129 em có hoạt động (36 %) ⇒ ghi MỘT lần; em vắng không tính vào mẫu số', () => {
    const cacEm: E[] = [
      ...ds(47, () => saiLap({ 'DON.CHAT.NITROGEN': 4 }), 'sau', 'a'),
      ...ds(82, () => mkThe(), 'nhanh', 'b'),
      ...ds(91, () => mkThe({ vang: 4 }), 'vang', 'v'),
      ...ds(47, () => mkThe(), 'bo_qua', 'q'),
    ]
    const r = tinhDangCaLopYeu(cacEm)
    expect(r).toEqual([{ ma: 'DON.CHAT.NITROGEN', soEm: 47, phanTram: 36, tongSai: 188 }])
    // nếu tính cả em vắng vào mẫu số (47/220 = 21 %) thì KHÔNG đủ ngưỡng — khoá lý do chọn mẫu số
    expect(47 / 220).toBeLessThan(NGUONG_BO_NAO.TI_LE_DANG_CA_LOP)
  })
  it('ngưỡng đúng biên: 30 % được, dưới 30 % không; dưới 3 em không bao giờ', () => {
    const n = (k: number) => [...ds(k, () => saiLap({ D1: 3 }), 'sau', 'a'), ...ds(10 - k, () => mkThe(), 'nhanh', 'b')]
    expect(tinhDangCaLopYeu(n(3)).map((x) => x.ma)).toEqual(['D1']) // 3/10
    expect(tinhDangCaLopYeu(n(2))).toEqual([]) // 20 % và < 3 em
    const nho = [...ds(2, () => saiLap({ D1: 3 }), 'sau', 'a')]
    expect(tinhDangCaLopYeu(nho)).toEqual([]) // 100 % nhưng chỉ 2 em
    const chin = [...ds(9, () => saiLap({ D2: 3 }), 'sau', 'a'), ...ds(31, () => mkThe(), 'nhanh', 'b')]
    expect(tinhDangCaLopYeu(chin)).toEqual([]) // 9/40 = 22,5 %
    const muoi = [...ds(12, () => saiLap({ D2: 3 }), 'sau', 'a'), ...ds(28, () => mkThe(), 'nhanh', 'b')]
    expect(tinhDangCaLopYeu(muoi).map((x) => x.soEm)).toEqual([12]) // 12/40 = 30 % đúng
  })
  it('sai dưới 3 lần/7 ngày không tính là sai lặp; nhiều dạng ⇒ nhiều em nhất trước rồi mã dạng', () => {
    const cacEm = [
      ...ds(6, () => saiLap({ B: 3, A: 3 }), 'sau', 'a'),
      ...ds(2, () => saiLap({ C: 3 }), 'sau', 'c'),
      ...ds(4, () => saiLap({ A: 2 }), 'nhanh', 'd'),
      ...ds(2, () => mkThe(), 'nhanh', 'e'),
    ]
    expect(tinhDangCaLopYeu(cacEm).map((x) => `${x.ma}:${x.soEm}`)).toEqual(['A:6', 'B:6'])
  })
  it('BỨC TRANH LỚP mang `dangCaLopYeu` và `soEmHoatDong` (con số lấy cho bản tin của AI)', () => {
    const cacEm = [...ds(5, () => saiLap({ D1: 4 }), 'sau', 'a'), ...ds(5, () => mkThe(), 'nhanh', 'b'), ...ds(3, () => mkThe({ vang: 3 }), 'vang', 'v')]
    const lop = tinhBucTranhLop(NGAY, cacEm.map((e) => ({ ...e, lop: 'x' })))
    expect(lop.soEmHoatDong).toBe(10)
    expect(lop.dangCaLopYeu).toEqual([{ ma: 'D1', soEm: 5, phanTram: 50, tongSai: 20 }])
  })
})

describe('phanLuong: sai lặp dạng cả lớp không còn là lý do; điểm ưu tiên', () => {
  const luong = (the: TheNgan, sbd = 'x', dangCaLop?: ReadonlySet<string>) => phanLuong(the, { sbd, ngay: NGAY }, { dangCaLop })
  it('không có tuỳ chọn ⇒ hành vi cũ (sai lặp ⇒ sâu); có dạng cả lớp ⇒ em chỉ sai lặp dạng ấy về nhanh; em còn dạng RIÊNG vẫn sâu', () => {
    const chiCaLop = saiLap({ CL: 4 })
    const sbdKhongLuot = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'].find((x) => !toiLuotSoiKy(x, NGAY))!
    expect(luong(chiCaLop, sbdKhongLuot).luong).toBe('sau')
    expect(luong(chiCaLop, sbdKhongLuot, new Set(['CL']))).toEqual({ luong: 'nhanh', lyDo: [] })
    const them = saiLap({ CL: 4, RIENG: 3 })
    const r = luong(them, sbdKhongLuot, new Set(['CL']))
    expect(r.luong).toBe('sau')
    expect(r.lyDo).toEqual(['sai lặp: dạng RIENG sai 3/5 lần trong 7 ngày'])
  })
  it('điểm ưu tiên: xấu đi > bỏ dở = tụt nhịp > làm cho xong = đúng nhanh > sai lặp riêng > vừa thi > xoay vòng; nhiều lý do cộng chút để hoà', () => {
    const sbd = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'].find((x) => !toiLuotSoiKy(x, NGAY))!
    const diem = (co: CoThuatToan[], extra: Partial<TheNgan> = {}) => luong(mkThe({ co, ...extra }), sbd).diem!
    const D = NGUONG_BO_NAO
    expect(Math.floor(diem(['xau_di_hom_qua']))).toBe(D.DIEM_XAU_DI)
    expect(Math.floor(diem(['bo_do'], { btvn: { baiMo: 1, changXong: 1, tongChang: 3 } }))).toBe(D.DIEM_BO_DO)
    expect(Math.floor(diem(['tut_nhip']))).toBe(D.DIEM_TUT_NHIP)
    expect(Math.floor(diem(['lam_cho_xong']))).toBe(D.DIEM_LAM_CHO_XONG)
    expect(Math.floor(diem(['dung_nhanh']))).toBe(D.DIEM_DUNG_NHANH)
    expect(Math.floor(diem(['sai_lap'], { dangChuY: [{ ma: 'X', gap: 9, sai: 3, bac: 0, tiLeKhacPhuc: 0.2, lam7: 5, sai7: 3 }] }))).toBe(D.DIEM_SAI_LAP_RIENG)
    expect(Math.floor(diem(['vua_thi'], { ca: { diem: 6, ngayTruoc: 2 } }))).toBe(D.DIEM_VUA_THI)
    expect(D.DIEM_XAU_DI).toBeGreaterThan(D.DIEM_BO_DO)
    expect(D.DIEM_TUT_NHIP).toBeGreaterThan(D.DIEM_SAI_LAP_RIENG)
    expect(D.DIEM_SAI_LAP_RIENG).toBeGreaterThan(D.DIEM_VUA_THI)
    expect(D.DIEM_VUA_THI).toBeGreaterThan(D.DIEM_XOAY_VONG)
    // hai lý do ⇒ điểm cao hơn một lý do cùng loại cao nhất
    expect(diem(['tut_nhip', 'vua_thi'], { ca: { diem: 6, ngayTruoc: 2 } })).toBeGreaterThan(diem(['tut_nhip']))
  })
  it('xoay vòng: chỉ khi không có lý do nào khác; điểm thấp nhất', () => {
    const sbdLuot = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'].find((x) => toiLuotSoiKy(x, NGAY))!
    const r = luong(mkThe(), sbdLuot)
    expect(r.luong).toBe('sau')
    expect(Math.floor(r.diem!)).toBe(NGUONG_BO_NAO.DIEM_XOAY_VONG)
  })
})

describe('chotLuongCaLop: trần luồng sâu 25 %', () => {
  it('220 em có thẻ (129 hoạt động: 115 lẽ ra sâu; 91 vắng): sâu ≤ 55; đúng em điểm cao nhất được giữ; phần còn lại về nhanh', () => {
    const cacEm: E[] = [
      ...ds(10, () => mkThe({ co: ['tut_nhip'] }), 'sau', 'a'), // điểm 100
      ...ds(20, () => saiLap({ RIENG: 3 }), 'sau', 'b'), // điểm 50
      ...ds(20, () => mkThe({ co: ['vua_thi'], ca: { diem: 6, ngayTruoc: 2 } }), 'sau', 'c'), // điểm 30
      ...ds(65, () => mkThe(), 'sau', 'd'), // xoay vòng hoặc nhanh
      ...ds(14, () => mkThe(), 'nhanh', 'e'),
      ...ds(91, () => mkThe({ vang: 4 }), 'vang', 'v'),
    ]
    const r = chotLuongCaLop(NGAY, cacEm)
    expect(r.tran).toMatchObject({ soEmCoThe: 220, toiDaSau: 55 })
    expect(soSau(r.luong)).toBeLessThanOrEqual(55)
    expect(r.tran.soSau).toBe(soSau(r.luong))
    // 10 em tụt nhịp (điểm cao nhất) + 20 em sai lặp riêng + 20 em vừa thi = 50 ≤ 55 ⇒ đều được giữ; còn 5 chỗ cho xoay vòng
    for (const e of cacEm.slice(0, 50)) expect(r.luong.get(e.sbd)!.luong, e.sbd).toBe('sau')
    expect(r.luong.get('v000')!.luong).toBe('vang')
  })
  it('THỨ TỰ nhường chỗ khi dư: cap 4/16 ⇒ giữ 4 em điểm cao nhất (tụt nhịp trước, rồi sai lặp riêng, rồi vừa thi), bất kể thứ tự đưa vào', () => {
    const mk = (): E[] => [
      ...ds(3, () => mkThe({ co: ['vua_thi'], ca: { diem: 6, ngayTruoc: 2 } }), 'sau', 'v'),
      ...ds(3, () => saiLap({ R: 3 }), 'sau', 'r'),
      ...ds(3, () => mkThe({ co: ['tut_nhip'] }), 'sau', 't'),
      ...ds(1, () => mkThe({ co: ['xau_di_hom_qua'] }), 'sau', 'x'),
      ...ds(6, () => mkThe(), 'nhanh', 'n'),
    ]
    const xuoi = mk()
    const nguoc = [...mk()].reverse()
    const a = chotLuongCaLop(NGAY, xuoi)
    const b = chotLuongCaLop(NGAY, nguoc)
    expect(a.tran.toiDaSau).toBe(4)
    const giu = (m: Map<string, { luong: Luong }>) => [...m.entries()].filter(([, x]) => x.luong === 'sau').map(([k]) => k).sort()
    expect(giu(a.luong)).toEqual(giu(b.luong)) // không phụ thuộc thứ tự đầu vào
    expect(giu(a.luong)).toEqual(['t000', 't001', 't002', 'x000']) // xấu đi + 3 tụt nhịp
  })
  it('HOÀ ĐIỂM: giữ theo băm `sbd|ngày` (không dồn về SBD nhỏ nhất): 20 em cùng điểm ⇒ cap 5 ⇒ đúng 5 em băm nhỏ nhất', () => {
    const lop20 = ds(20, () => mkThe({ co: ['tut_nhip'] }), 'sau', 'h')
    const r = chotLuongCaLop(NGAY, lop20)
    expect(r.tran.toiDaSau).toBe(5)
    const mongDoi = [...lop20].sort((a, b) => hashSeed(`${a.sbd}|${NGAY}`) - hashSeed(`${b.sbd}|${NGAY}`)).slice(0, 5).map((e) => e.sbd).sort()
    expect([...r.luong.entries()].filter(([, x]) => x.luong === 'sau').map(([k]) => k).sort()).toEqual(mongDoi)
    expect(mongDoi).not.toEqual(['h000', 'h001', 'h002', 'h003', 'h004']) // không phải 5 SBD đầu bảng
  })
  it('em bị nhường chỗ về `nhanh` KHÔNG kèm lý do; em còn lại vẫn kèm lý do bằng số; nhiều lý do hơn thì điểm nhỉnh hơn', () => {
    const cacEm: E[] = [
      { sbd: 'm1', luong: 'sau', the: mkThe({ co: ['tut_nhip'] }) },
      { sbd: 'm2', luong: 'sau', the: mkThe({ co: ['tut_nhip', 'vua_thi'], ca: { diem: 6, ngayTruoc: 2 } }) },
      ...ds(6, () => mkThe(), 'nhanh', 'n'),
    ]
    const r = chotLuongCaLop(NGAY, cacEm) // 8 em ⇒ cap 2: cả hai giữ;
    expect(r.luong.get('m2')!.lyDo).toHaveLength(2)
    const r2 = chotLuongCaLop(NGAY, cacEm.slice(0, 2).concat(ds(2, () => mkThe(), 'nhanh', 'k'))) // 4 em ⇒ cap 1 ⇒ m2 (nhiều lý do) thắng m1 (hoà 100)
    expect(r2.luong.get('m2')!.luong).toBe('sau')
    expect(r2.luong.get('m1')).toEqual({ luong: 'nhanh', lyDo: [] })
  })
  it('lớp nhỏ: ít nhất 1 chỗ sâu (3 em có thẻ ⇒ 1); không em nào có thẻ ⇒ 0; toàn vắng/bỏ qua ⇒ 0 sâu', () => {
    expect(chotLuongCaLop(NGAY, ds(3, () => mkThe({ co: ['tut_nhip'] }))).tran.toiDaSau).toBe(1)
    expect(chotLuongCaLop(NGAY, []).tran).toEqual({ soEmCoThe: 0, toiDaSau: 0, soUngVienSau: 0, soSau: 0 })
    const toanVang = chotLuongCaLop(NGAY, ds(5, () => mkThe({ vang: 4 }), 'vang'))
    expect(soSau(toanVang.luong)).toBe(0)
    expect([...toanVang.luong.values()].every((x) => x.luong === 'vang')).toBe(true)
    const boQua = chotLuongCaLop(NGAY, ds(4, () => mkThe(), 'bo_qua'))
    expect(boQua.tran.soEmCoThe).toBe(0)
  })
  it('cap tính trên MỌI em có thẻ (kể cả vắng) — không tính em bỏ qua', () => {
    const cacEm = [...ds(8, () => mkThe({ co: ['tut_nhip'] }), 'sau', 'a'), ...ds(4, () => mkThe({ vang: 3 }), 'vang', 'v'), ...ds(50, () => mkThe(), 'bo_qua', 'q')]
    const r = chotLuongCaLop(NGAY, cacEm)
    expect(r.tran.soEmCoThe).toBe(12)
    expect(r.tran.toiDaSau).toBe(3)
    expect(soSau(r.luong)).toBe(3)
    expect(r.tran.soUngVienSau).toBe(8)
  })
  it('TẤT ĐỊNH và IDEMPOTENT: cùng đầu vào cùng kết quả; đưa KẾT QUẢ (luồng đã chốt) làm đầu vào lần nữa ra y hệt (chỉ đọc thẻ)', () => {
    const cacEm: E[] = [...ds(30, (i) => mkThe({ co: i % 3 === 0 ? ['tut_nhip'] : i % 3 === 1 ? ['vua_thi'] : [], ca: i % 3 === 1 ? { diem: 5, ngayTruoc: 1 } : null }), 'sau', 'a'), ...ds(30, () => mkThe(), 'nhanh', 'b'), ...ds(10, () => mkThe({ vang: 3 }), 'vang', 'v')]
    const a = chotLuongCaLop(NGAY, cacEm)
    expect([...chotLuongCaLop(NGAY, cacEm).luong]).toEqual([...a.luong])
    const daChot = cacEm.map((e) => ({ ...e, luong: a.luong.get(e.sbd)!.luong }))
    expect([...chotLuongCaLop(NGAY, daChot).luong]).toEqual([...a.luong])
  })
  it('DẠNG CẢ LỚP: 40 em chỉ sai lặp cùng một dạng ⇒ không ai vào sâu vì lý do đó (trừ xoay vòng); dạng có trong dangCaLopYeu', () => {
    const cacEm: E[] = [...ds(40, () => saiLap({ CL: 5 }), 'sau', 'a'), ...ds(60, () => mkThe(), 'nhanh', 'b')]
    const r = chotLuongCaLop(NGAY, cacEm)
    expect(r.dangCaLopYeu.map((d) => d.ma)).toEqual(['CL'])
    for (const e of cacEm.slice(0, 40)) {
      const kq = r.luong.get(e.sbd)!
      if (kq.luong === 'sau') expect(kq.lyDo, e.sbd).toEqual(['tới lượt soi kỹ xoay vòng hằng tuần'])
    }
    expect(soSau(r.luong)).toBeLessThanOrEqual(25)
  })
  it('TÍNH CHẤT ngẫu nhiên: sâu ≤ trần; sâu ⊆ em có lý do; em điểm cao hơn không bị nhường chỗ cho em điểm thấp hơn', () => {
    let a = 20260921
    const rnd = () => ((a = (Math.imul(a, 1664525) + 1013904223) | 0), (a >>> 0) / 4294967296)
    const cos: CoThuatToan[] = ['tut_nhip', 'bo_do', 'vua_thi', 'lam_cho_xong', 'dung_nhanh', 'xau_di_hom_qua']
    for (let vong = 0; vong < 60; vong++) {
      const n = 4 + Math.floor(rnd() * 80)
      const cacEm: E[] = Array.from({ length: n }, (_, i) => {
        const co = cos.filter(() => rnd() < 0.15)
        return { sbd: `r${vong}-${i}`, luong: (rnd() < 0.2 ? 'vang' : 'sau') as Luong, the: mkThe({ co, ca: co.includes('vua_thi') ? { diem: 6, ngayTruoc: 2 } : null, btvn: { baiMo: 1, changXong: 1, tongChang: 3 }, vang: 0 }) }
      })
      const r = chotLuongCaLop(NGAY, cacEm)
      const soCoThe = cacEm.length
      expect(soSau(r.luong)).toBeLessThanOrEqual(Math.max(1, Math.floor(0.25 * soCoThe)))
      // em sâu có điểm ≥ mọi em ứng viên bị loại
      const diemCua = (sbd: string) => phanLuong(cacEm.find((e) => e.sbd === sbd)!.the, { sbd, ngay: NGAY }).diem ?? 0
      const giu = cacEm.filter((e) => r.luong.get(e.sbd)!.luong === 'sau').map((e) => diemCua(e.sbd))
      const bo = cacEm.filter((e) => e.luong === 'sau' && r.luong.get(e.sbd)!.luong === 'nhanh' && phanLuong(e.the, { sbd: e.sbd, ngay: NGAY }).luong === 'sau').map((e) => diemCua(e.sbd))
      if (giu.length && bo.length) expect(Math.min(...giu)).toBeGreaterThanOrEqual(Math.max(...bo))
    }
  })
})
