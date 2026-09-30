// @vitest-environment node
// SỔ NỢ + ĐAN XEN (thầy chốt 29/09, docs/DAC-TA-KIEM-TRA-DAU-GIO-SO-NO-2909.md mục A, B4, E1–E2; hợp đồng docs/so-no-2909/HOP-DONG.md).
import { describe, expect, it } from 'vitest'
import {
  chiaLuot, danXenLuot, danXenNgay, henOnSau, lapKeHoachNgay, laNo, nhanNo, phanLoaiDanXen, phatLaiCau, soNgayTraNo, soSanhNo,
  HEN_DUY_TRI, HEN_DUY_TRI_2_SAO, type CauDanXen, type CauSrs, type LanLam, type TrangThaiCau,
} from '../server/src/srs2-loi'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { docHoSo2, docLichSuCoNguon, ghiMocDayLai, layKeHoachHomNay } from '../server/src/srs2-d1'
import { startDoan2 } from '../server/src/srs2-game'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const lan = (qid: string, ngay: string, dung: boolean, nguon?: string, gio = '03'): LanLam => ({ qid, ngay, luc: `${ngay}T${gio}:00:00Z`, dung, coGoiY: false, ...(nguon ? { nguon } : {}) })

describe('E1 · câu sai hôm nay ⇒ tới lịch NGÀY MAI ở mọi nguồn', () => {
  for (const nguon of ['thi', 'len_bang', 'dau_gio', 'game']) {
    it(`nguồn ${nguon}: trong chiến dịch, sau hạn và không chiến dịch`, () => {
      expect(phatLaiCau('q', [lan('q', '2026-09-29', false, nguon)], '2026-10-10').henOn).toBe('2026-09-30')
      expect(phatLaiCau('q', [lan('q', '2026-09-29', false, nguon)], '2026-09-20').henOn).toBe('2026-09-30')
      const t = phatLaiCau('q', [lan('q', '2026-09-29', false, nguon)], null)
      expect(t.henOn).toBe('2026-09-30')
      expect(laNo(t)).toBe(true)
      expect(t.ngayVaoNo).toBe('2026-09-29')
    })
  }
  it('kế hoạch ngày mai (không chiến dịch) có câu vừa sai', () => {
    const t = phatLaiCau('q', [lan('q', '2026-09-29', false, 'len_bang')], null)
    const kh = lapKeHoachNgay([{ qid: 'q', phan: 'I', mucDo: 'TH', dang: 'A', nguon: 'no_cu' }], new Map([['q', t]]), { homNay: '2026-09-30', hanNop: null })
    expect(kh.doan).toEqual(['q'])
  })
})

describe('B4 · Kiểm tra đầu giờ (nguồn dau_gio)', () => {
  it('Đạt ⇒ thành thạo NGAY kể cả câu 2 sao; hẹn duy trì 14 ngày (2 sao) / 30 ngày (thường)', () => {
    const ls = [lan('q', '2026-09-20', false, 'thi'), lan('q', '2026-09-29', true, 'dau_gio')]
    const sao2 = phatLaiCau('q', ls, null, [], { sao: 2, phan: 'I', mucDo: 'VDC' })
    expect(sao2.thanhThao).toBe(true)
    expect(sao2.henOn).toBe('2026-10-13')
    expect(sao2.ngayVaoNo).toBeUndefined()
    const thuong = phatLaiCau('q', ls, null, [], { sao: 0, phan: 'I', mucDo: 'TH' })
    expect(thuong.thanhThao).toBe(true)
    expect(thuong.henOn).toBe('2026-10-29')
    // Trong chiến dịch: không ôn lại trước hạn nộp.
    expect(phatLaiCau('q', ls, '2026-11-30', [], { sao: 0 }).henOn).toBe('2026-12-01')
    // Game đúng một lần KHÔNG đủ thành thạo câu 2 sao (đối chứng).
    expect(phatLaiCau('q', [lan('q', '2026-09-20', false), lan('q', '2026-09-29', true, 'game')], null, [], { sao: 2 }).thanhThao).toBe(false)
  })
  it('Chưa đạt ⇒ sai như thường: mất thành thạo, nợ, ngày mai', () => {
    const t = phatLaiCau('q', [lan('q', '2026-09-25', true, 'dau_gio'), lan('q', '2026-09-29', false, 'dau_gio')], null)
    expect(t.thanhThao).toBe(false)
    expect(laNo(t)).toBe(true)
    expect(t.henOn).toBe('2026-09-30')
  })
  it('"Thầy đã chữa" (mốc dạy lại) ⇒ đếm sai về 0, rời cắt tỉa, hôm sau vào kế hoạch; nhãn có ngày chữa', () => {
    const ls = ['2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23'].map((d) => lan('q', d, false))
    expect(phatLaiCau('q', ls, null).catTia).toBe(true)
    const t = phatLaiCau('q', ls, null, ['2026-09-29T02:00:00Z'])
    expect(t.catTia).toBe(false)
    expect(t.lanSai).toBe(0)
    expect(t.henOn).toBe('2026-09-30')
    expect(t.ngayChua).toBe('2026-09-29')
    expect(nhanNo(t.lichSu, t.ngayChua)).toBe('Sai 4 lần · Sai 21/09 · Sai 22/09 · Sai 23/09 · Thầy đã chữa 29/09')
  })
})

describe('Câu 2 sao đã thành thạo: duy trì 14 ngày', () => {
  it('henOnSau sau hạn và luồng đúng 2 ngày khác nhau', () => {
    expect(HEN_DUY_TRI_2_SAO).toBe(14)
    expect(henOnSau('2026-09-29', 7, null, true, HEN_DUY_TRI_2_SAO)).toBe('2026-10-13')
    expect(HEN_DUY_TRI).toBe(30)
    expect(henOnSau('2026-09-29', 7, null, true)).toBe('2026-10-29')
    const ls = [lan('q', '2026-09-28', true), lan('q', '2026-09-29', true)]
    expect(phatLaiCau('q', ls, null, [], { sao: 2 }).henOn).toBe('2026-10-13')
    expect(phatLaiCau('q', ls, null, [], { sao: 0, phan: 'I', mucDo: 'TH' }).henOn).toBe('2026-10-29')
  })
})

// ---------------------------------------------------------------- E2: trần nợ, thứ tự nợ
const HOM_NAY = '2026-10-01'
function noDenLich(qid: string, soSai: number, ngayDau: string, tuyChon: { sao?: number } = {}, moc: string[] = []): TrangThaiCau {
  const ls = Array.from({ length: soSai }, (_, i) => lan(qid, ngayDau, false, 'game', String(1 + i).padStart(2, '0')))
  return phatLaiCau(qid, ls, null, moc, tuyChon)
}
function boCau(soNo: number, soMoi: number, phan: 'I' | 'II' = 'I') {
  const cau: CauSrs[] = []
  const tt = new Map<string, TrangThaiCau>()
  for (let i = 0; i < soNo; i++) {
    const q = `n${String(i).padStart(3, '0')}`
    cau.push({ qid: q, phan, mucDo: 'TH', dang: 'A', nguon: 'no_cu' })
    tt.set(q, noDenLich(q, 1, '2026-09-20'))
  }
  for (let i = 0; i < soMoi; i++) {
    const q = `m${String(i).padStart(3, '0')}`
    cau.push({ qid: q, phan, mucDo: 'NB', dang: 'A', nguon: 'chien_dich' })
    tt.set(q, phatLaiCau(q, [], '2026-10-30'))
  }
  return { cau, tt }
}
const soNoTrong = (ds: string[]) => ds.filter((q) => q.startsWith('n')).length

describe('E2 · trần nợ 50% khi có chiến dịch, 100% khi không', () => {
  it('có chiến dịch: nợ ≤ 50% lượt ngày, nợ ĐỨNG TRƯỚC câu mới trong phần được chọn', () => {
    const { cau, tt } = boCau(50, 100)
    const kh = lapKeHoachNgay(cau, tt, { homNay: HOM_NAY, hanNop: '2026-10-30', tranNgay: 40 })
    const ds = [...kh.dao, ...kh.doan]
    expect(ds).toHaveLength(40)
    expect(soNoTrong(ds)).toBe(20)
  })
  it('nợ ít hơn 50% ⇒ câu mới được thêm; tổng vẫn đủ lượt ngày', () => {
    const { cau, tt } = boCau(5, 100)
    const kh = lapKeHoachNgay(cau, tt, { homNay: HOM_NAY, hanNop: '2026-10-30', tranNgay: 40 })
    expect(soNoTrong(kh.doan)).toBe(5)
    expect(kh.dao).toHaveLength(35)
  })
  it('không chiến dịch: nợ tới 100% trần (trần do nơi gọi đưa — thể lực chiến dịch vừa đóng)', () => {
    const { cau, tt } = boCau(50, 0)
    expect(soNoTrong(lapKeHoachNgay(cau, tt, { homNay: HOM_NAY, hanNop: null }).doan)).toBe(40)
    expect(lapKeHoachNgay(cau, tt, { homNay: HOM_NAY, hanNop: null, tranNgay: 12 }).doan).toHaveLength(12)
  })
  it('chiến dịch đã giao hết câu mới ⇒ nợ lấp chỗ trống (vượt 50%)', () => {
    const { cau, tt } = boCau(50, 4)
    const kh = lapKeHoachNgay(cau, tt, { homNay: HOM_NAY, hanNop: '2026-10-30', tranNgay: 40 })
    expect(soNoTrong(kh.doan)).toBe(36)
  })
  it('Huyết Chiến tính CẢ lượt nợ cũ', () => {
    const { cau, tt } = boCau(40, 30)
    // D = 3, trần 30: câu mới 60 lượt ≤ 0,9 × 90 = 81 — thêm 40 nợ × 2 lượt = 140 > 81 ⇒ Huyết Chiến.
    expect(lapKeHoachNgay(cau.filter((c) => c.nguon === 'chien_dich'), tt, { homNay: HOM_NAY, hanNop: '2026-10-03', tranNgay: 30 }).huyetChien).toBe(false)
    const kh = lapKeHoachNgay(cau, tt, { homNay: HOM_NAY, hanNop: '2026-10-03', tranNgay: 30 })
    expect(kh.huyetChien).toBe(true)
    expect(kh.khoiLuong).toBe(60 + 80)
  })
})

describe('E2 · thứ tự nợ: sai nhiều → nợ lâu → vừa chữa; 2 sao ngang sai 2 lần', () => {
  it('xếp đúng thứ tự và cắt đúng phần vượt trần sang ngày sau', () => {
    const tt = new Map<string, TrangThaiCau>([
      ['a1', noDenLich('a1', 1, '2026-09-25')],
      ['a3', noDenLich('a3', 3, '2026-09-28')],
      ['a2cu', noDenLich('a2cu', 2, '2026-09-10')],
      ['a2moi', noDenLich('a2moi', 2, '2026-09-26')],
      ['sao2', noDenLich('sao2', 1, '2026-09-27', { sao: 2 })],
      ['chua', noDenLich('chua', 1, '2026-09-25', {}, ['2026-09-30T02:00:00Z'])],
    ])
    const cau: CauSrs[] = [...tt.keys()].map((q) => ({ qid: q, phan: 'I', mucDo: 'TH', dang: 'A', nguon: 'no_cu', ...(q === 'sao2' ? { sao: 2 } : {}) }))
    const xep = [...cau].sort((a, b) => soSanhNo(a, b, tt, HOM_NAY)).map((c) => c.qid)
    // sai 3 → (sai 2 hoặc 2 sao: nợ lâu trước: 10/09, 26/09, 27/09) → sai 1: cùng ngày 25/09 thì câu vừa chữa trước.
    expect(xep).toEqual(['a3', 'a2cu', 'a2moi', 'sao2', 'chua', 'a1'])
    // Không chiến dịch, trần 4 ⇒ lấy 4 câu đầu theo thứ tự ưu tiên; phần còn lại dời sang ngày sau.
    const kh = lapKeHoachNgay(cau, tt, { homNay: HOM_NAY, hanNop: null, tranNgay: 4 })
    expect(new Set(kh.doan)).toEqual(new Set(['a3', 'a2cu', 'a2moi', 'sao2']))
  })
})

describe('Nhãn nợ', () => {
  it('"Sai N lần · <nguồn ngày> · …", gộp cùng nguồn + ngày, chiến dịch cũ, câu chưa sai ⇒ null', () => {
    const ls = [
      { ngay: '2026-09-26', dung: false, nguon: 'thi' }, { ngay: '2026-09-27', dung: true, nguon: 'doan' },
      { ngay: '2026-09-28', dung: false, nguon: 'len_bang' }, { ngay: '2026-09-28', dung: false, nguon: 'len_bang' },
    ]
    expect(nhanNo(ls)).toBe('Sai 3 lần · Ca 26/09 · Lên bảng 28/09')
    expect(nhanNo([{ ngay: '2026-09-29', dung: false, nguon: 'dau_gio' }], null, { ten: 'Ester', hanNop: '2026-09-25' })).toBe("Sai 1 lần · Đầu giờ 29/09 · Chiến dịch 'Ester' · 25/09")
    expect(nhanNo([{ ngay: '2026-09-29', dung: true, nguon: 'bia' }])).toBeNull()
  })
  it('số ngày trả nợ trong trần 50%', () => {
    expect(soNgayTraNo(0, 40)).toBe(0)
    expect(soNgayTraNo(80, 40)).toBe(4)
    expect(soNgayTraNo(7, 6)).toBe(3)
  })
})

// ---------------------------------------------------------------- ĐAN XEN (thầy 29/09)
const mk = (qid: string, x: Partial<CauDanXen>): CauDanXen => ({ qid, no: false, kho: false, de: false, muc: 1, ...x })
function ngayYeu(): CauDanXen[] {
  // 20 câu nợ (8 khó: sai ≥ 2 lần) trước + 20 câu mới Nhận biết — đúng thứ tự chọn của kế hoạch.
  const no = Array.from({ length: 20 }, (_, i) => (i < 8 ? mk(`k${i}`, { no: true, kho: true, muc: 2 }) : mk(`n${i}`, { no: true, de: true })))
  const moi = Array.from({ length: 20 }, (_, i) => mk(`m${i}`, { de: true, muc: 0 }))
  return [...no, ...moi]
}
function kiemLuot(l: CauDanXen[], tranKho: number) {
  expect(l.filter((x) => x.kho).length).toBeLessThanOrEqual(tranKho)
  if (l.some((x) => x.de)) expect(l[0]!.de).toBe(true)
  for (let i = 1; i < l.length; i++) {
    expect(l[i - 1]!.kho && l[i]!.kho, `2 khó liền nhau: ${l.map((x) => x.qid)}`).toBe(false)
    const conKhac = l.some((x) => !x.no)
    if (conKhac && l.filter((x) => x.no).length * 2 <= l.length + 1) expect(l[i - 1]!.no && l[i]!.no, `2 nợ liền nhau: ${l.map((x) => x.qid)}`).toBe(false)
  }
}

describe('ĐAN XEN câu trong ngày', () => {
  it('em yếu, 20 nợ (8 khó) + 20 mới: mỗi lượt ≤ 1 khó, không 2 khó / 2 nợ liền nhau, mở và kết bằng câu dễ; tổng câu không đổi', () => {
    const ds = ngayYeu()
    const luot = chiaLuot(ds, 'yeu', 6).map((l) => danXenLuot(l, 'yeu'))
    expect(luot.length).toBeGreaterThanOrEqual(8) // 8 câu nợ khó ⇒ ít nhất 8 lượt, không dồn
    expect(luot.flat().map((x) => x.qid).sort()).toEqual(ds.map((x) => x.qid).sort())
    for (const l of luot) {
      expect(l.length).toBeLessThanOrEqual(6)
      kiemLuot(l, 1)
      expect(l[l.length - 1]!.de).toBe(true)
      // Câu khó đặt giữa lượt, ngay sau một câu dễ.
      l.forEach((x, i) => { if (x.kho) { expect(i).toBeGreaterThan(0); expect(i).toBeLessThan(l.length - 1); expect(l[i - 1]!.de).toBe(true) } })
    }
    // Nợ khó ưu tiên cao nằm ở lượt sớm (không dời ra cuối ngày).
    expect(luot[0]!.some((x) => x.qid === 'k0')).toBe(true)
    // Tất định.
    expect(danXenNgay(ds, 'yeu').map((x) => x.qid)).toEqual(danXenNgay(ds, 'yeu').map((x) => x.qid))
  })
  it('em TB: ≤ 2 nợ khó mỗi lượt; em giỏi: lượt đầy 6 câu, không hạn mật độ nhưng vẫn không 2 khó liền nhau', () => {
    const ds = ngayYeu()
    for (const l of chiaLuot(ds, 'tb', 6)) expect(l.filter((x) => x.kho).length).toBeLessThanOrEqual(2)
    const kha = chiaLuot(ds, 'kha', 6)
    expect(kha.map((l) => l.length)).toEqual([6, 6, 6, 6, 6, 6, 4])
    const dayKho = [mk('a', { kho: true, no: true }), mk('b', { kho: true, no: true }), mk('c', { kho: true, no: true }), mk('d', { de: true }), mk('e', { de: true }), mk('f', {})]
    const mot = chiaLuot(dayKho, 'kha', 6)
    expect(mot).toHaveLength(1) // 3 khó cùng một lượt: không bị tách
    kiemLuot(danXenLuot(mot[0]!, 'kha'), 3)
  })
  it('Boss 29/09: em yếu, 20 nợ khó, 0 câu dễ ⇒ ≈ ceil(20/6) chặng, không chặng nào < 4 câu; hai câu khó nhất tách qua hiệp trùm', () => {
    const ds = Array.from({ length: 20 }, (_, i) => mk(`k${i}`, { no: true, kho: true, muc: i % 3 === 0 ? 3 : 2 }))
    const luot = chiaLuot(ds, 'yeu', 6)
    expect(luot).toHaveLength(Math.ceil(20 / 6))
    luot.slice(0, -1).forEach((l) => expect(l.length).toBeGreaterThanOrEqual(4))
    expect(luot.flat()).toHaveLength(20)
    const l = danXenLuot(luot[0]!, 'yeu')
    const nua = Math.ceil(l.length / 2)
    expect(l.slice(0, nua).some((x) => x.muc === 3)).toBe(true)
    expect(l.slice(nua).some((x) => x.muc === 3)).toBe(true)
    // Có ít câu dễ: vẫn không lượt nào < 4 câu (trừ lượt cuối).
    const it2 = [...Array.from({ length: 12 }, (_, i) => mk(`h${i}`, { no: true, kho: true })), mk('d1', { de: true }), mk('d2', { de: true })]
    chiaLuot(it2, 'yeu', 6).slice(0, -1).forEach((x) => expect(x.length).toBeGreaterThanOrEqual(4))
  })
  it('em khá/giỏi ở Đảo (chuyến đủ 6): ải cuối là câu khó nhất (Trùm, thầy 28/09)', () => {
    const l = [mk('a', { de: true, muc: 0 }), mk('b', { de: true, muc: 0 }), mk('c', { muc: 1 }), mk('d', { kho: true, muc: 3 }), mk('e', { muc: 1 }), mk('f', { kho: true, muc: 2 })]
    const x = danXenLuot(l, 'kha', { trumKho: true })
    expect(x[5]!.qid).toBe('d')
    expect(x[0]!.de).toBe(true)
  })
  it('kế hoạch ngày: đan xen KHÔNG đổi tập câu đã chọn (em yếu ≡ em giỏi về tập câu)', () => {
    const { cau, tt } = boCau(20, 60, 'II')
    const a = lapKeHoachNgay(cau, tt, { homNay: HOM_NAY, hanNop: '2026-10-30', tranNgay: 40, hangChung: 'L1' })
    const b = lapKeHoachNgay(cau, tt, { homNay: HOM_NAY, hanNop: '2026-10-30', tranNgay: 40, hangChung: 'L4' })
    expect([...a.dao].sort()).toEqual([...b.dao].sort())
    // Lượt đầu (6 câu) của em yếu không phải 6 câu nợ liền nhau như trước.
    expect(soNoTrong(a.dao.slice(0, 6))).toBeLessThanOrEqual(3)
  })
  it('phân loại: 2 sao / Vận dụng / sai ≥ 2 lần là khó; câu mới Nhận biết và câu ôn cc=1 là dễ', () => {
    expect(phanLoaiDanXen('q', undefined, { mucDo: 'VD' }).kho).toBe(true)
    expect(phanLoaiDanXen('q', undefined, { mucDo: 'NB', sao: 2 }).kho).toBe(true)
    expect(phanLoaiDanXen('q', undefined, { mucDo: 'NB' }).de).toBe(true)
    expect(phanLoaiDanXen('q', noDenLich('q', 2, '2026-09-20'), { mucDo: 'NB' }).kho).toBe(true)
    const cc1 = phatLaiCau('q', [lan('q', '2026-09-20', false), lan('q', '2026-09-21', true)], null)
    expect(phanLoaiDanXen('q', cc1, { mucDo: 'TH' })).toMatchObject({ de: true, no: true, kho: false })
  })
})

// ---------------------------------------------------------------- tích hợp D1 thật
const T0 = Date.parse('2026-09-30T07:59:00Z') // 14:59 VN 30/09
const NGAY = 86_400_000
function cauJson(qid: string, phan: 'I' | 'II' | 'III', mucDo: string, sao = 0) {
  return JSON.stringify({
    qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
    hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo, sao, kienThuc: ['k'], correct: phan === 'I' ? 'B' : phan === 'II' ? 'DSDS' : '4', reviewed: true, solution: { chot: 'x', tungPa: {} },
  })
}
function fixture() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','x'),('S2','Trần Bảo','12A1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= 10; i++) st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, 'D1', cauJson(`Q${i}`, 'I', 'TH', i === 2 ? 2 : 0))
  for (let i = 1; i <= 30; i++) st.run('DE2', `P${i}`, 'v1', `g-P${i}`, 'D1', cauJson(`P${i}`, 'I', 'NB'))
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  return { d, env }
}
const sk = (sbd: string, qid: string, msLuc: number, dung: boolean, nguon: SuKien['nguon'] = 'game', maNguon = `phien-${msLuc}`): SuKien => ({
  nguon, maNguon, sbd, qid, lan: 1, ketQua: dung ? 1 : 0, luc: new Date(msLuc).toISOString(),
})
const giao = async (env: Env, maDe: string, hanNop: string, nowMs: number, theLucNgay = 40) => {
  const r = await gvChienDich(env, { action: 'tao', ten: `CD ${maDe}`, lop: '12A1', maDe: [maDe], hanNop, theLucNgay }, nowMs)
  expect(r.ok).toBe(true)
  return String(r.id)
}

describe('Sổ nợ trên D1 thật', () => {
  it('sai khi Lên bảng (câu NGOÀI chiến dịch) ⇒ kế hoạch ngày mai có câu, nhãn đúng nguồn; không chiến dịch ⇒ trần = thể lực chiến dịch vừa đóng', async () => {
    const { d, env } = fixture()
    const id = await giao(env, 'DE1', '2026-09-28', T0 - 5 * NGAY, 12)
    d.sql.exec(`UPDATE chien_dich SET trang_thai = 'da_dong' WHERE id = '${id}'`)
    // Nợ cũ: 10 câu chiến dịch cũ sai trong game; 1 câu ngoài chiến dịch sai khi lên bảng hôm nay.
    await ghiSuKien(env, Array.from({ length: 10 }, (_, i) => sk('S1', `Q${i + 1}`, T0 - 4 * NGAY + i, false)))
    await ghiSuKien(env, [sk('S1', 'P30', T0 - 60_000, false, 'len_bang', 'lb')])
    const { kh, hs } = await layKeHoachHomNay(env, 'S1', T0 + NGAY)
    expect(hs.chienDich).toBeNull()
    expect(hs.theLucNoCu).toBe(12)
    expect(kh.tong).toBe(11)
    expect(kh.doan).toContain('P30')
    // Nhãn nợ ở chặng Đoàn: câu lên bảng mang "Lên bảng 30/09".
    const ls = await docLichSuCoNguon(env, 'S1', ['P30', 'Q1'])
    expect(ls!.get('P30')!.map((x) => x.nguon)).toEqual(['len_bang'])
    const doan = await startDoan2(env, 'S1', T0 + NGAY)
    const qs = doan.questions as { qid: string; nhanNo?: string }[]
    expect(qs.length).toBeGreaterThan(0)
    for (const q of qs) expect(q.nhanNo).toMatch(/^Sai 1 lần · (Đảo|Lên bảng) \d\d\/\d\d · Chiến dịch 'CD DE1' · 28\/09$|^Sai 1 lần · Lên bảng 30\/09$/)
  })

  it('Kiểm tra đầu giờ: Đạt ⇒ thành thạo ngay câu 2 sao; Chưa đạt ⇒ nợ; ghiMocDayLai đưa câu cắt tỉa về kế hoạch hôm sau', async () => {
    const { env } = fixture()
    await giao(env, 'DE1', '2026-10-20', T0 - 5 * NGAY)
    await ghiSuKien(env, [sk('S1', 'Q2', T0 - 3 * NGAY, false), sk('S1', 'Q2', T0 - 60_000, true, 'dau_gio', 'dg1')])
    await ghiSuKien(env, [sk('S1', 'Q3', T0 - 3 * NGAY, true), sk('S1', 'Q3', T0 - 60_000, false, 'dau_gio', 'dg1')])
    await ghiSuKien(env, [1, 2, 3, 4].map((k) => sk('S1', 'Q4', T0 - k * NGAY, false)))
    let hs = await docHoSo2(env, 'S1', '2026-09-30')
    expect(hs.tt.get('Q2')!.thanhThao).toBe(true)
    expect(laNo(hs.tt.get('Q3')!)).toBe(true)
    expect(hs.tt.get('Q3')!.henOn).toBe('2026-10-01')
    expect(hs.tt.get('Q4')!.catTia).toBe(true)
    await ghiMocDayLai(env, 'S1', 'Q4', new Date(T0).toISOString())
    hs = await docHoSo2(env, 'S1', '2026-10-01')
    expect(hs.tt.get('Q4')!.catTia).toBe(false)
    const { kh } = await layKeHoachHomNay(env, 'S1', T0 + NGAY, hs)
    expect(kh.doan).toEqual(expect.arrayContaining(['Q3', 'Q4']))
  })

  it('giao chiến dịch mới: Tự tính / khối lượng TÍNH CẢ lượt nợ cũ; Bảng chiến dịch báo "Em X còn N câu nợ cũ — cần ≈ K ngày"', async () => {
    const { d, env } = fixture()
    const cu = await giao(env, 'DE1', '2026-09-28', T0 - 5 * NGAY, 40)
    d.sql.exec(`UPDATE chien_dich SET trang_thai = 'da_dong' WHERE id = '${cu}'`)
    await ghiSuKien(env, Array.from({ length: 10 }, (_, i) => sk('S1', `Q${i + 1}`, T0 - 4 * NGAY + i, false)))
    const sc = await gvChienDich(env, { action: 'suc-chua', lop: '12A1', maDe: ['DE2'], hanNop: '2026-10-09', theLucNgay: 6 }, T0)
    // S1: 30 câu mới × 2 + 10 nợ × 2 = 80; S2: 60 ⇒ trung vị 70; em nặng nhất 80 ⇒ Tự tính ≥ ⌈80 / 10⌉ = 8.
    expect(sc.khoiLuongTrungVi).toBe(70)
    expect(Number(sc.theLucDeXuat)).toBeGreaterThanOrEqual(10)
    expect((sc.noCu as { sbd: string; cau: string }[]).map((x) => x.cau)).toEqual(['Em Nguyễn An còn 10 câu nợ cũ — cần ≈ 7 ngày để trả hết'])
    const id = await giao(env, 'DE2', '2026-10-09', T0, 6)
    const bang = await gvChienDich(env, { action: 'bang', id }, T0)
    expect((bang.noCu as { sbd: string; soCau: number; soNgay: number }[])).toMatchObject([{ sbd: 'S1', soCau: 10, soNgay: 7 }])
    // Kế hoạch em: 80 lượt (có 20 lượt nợ cũ) > 0,9 × 10 × 6 ⇒ Quá tải (trần 12); nợ ≤ 50%.
    const { kh } = await layKeHoachHomNay(env, 'S1', T0)
    expect(kh.huyetChien).toBe(true)
    // 30/09: chiến dịch mới mặc định RẢI ĐỀU câu mới ⇒ 6 nợ (50 %) + 5 câu mới (quota ⌈30 / (10 − 3)⌉), lượt thứ 12 bỏ trống (không đổ thêm nợ/câu mới).
    expect(kh.tong).toBe(11)
    expect([...kh.dao, ...kh.doan].filter((q) => q.startsWith('Q')).length).toBe(6)
  })
})
