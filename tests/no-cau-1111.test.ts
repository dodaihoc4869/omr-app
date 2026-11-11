// @vitest-environment node
// NỢ CÂU — luật thuần (thầy 11/11: «cộng dồn và bắt làm bù trước … trả tối thiểu giống ngân hàng … tối đa 3 ngày nợ tối thiểu, ngày thứ tư phải trả hết»;
// «Ghi rõ nợ câu»; «Tính lãi như ngân hàng luôn»). Đặc tả: docs/ban-ve-lam-bu-1111/DAC-TA.md.
import { expect, it } from 'vitest'
import { TRAN_NO, chonMacDinh, chotNgay, chotNo, laiNo, phaiTraHet, soCuaKieu, soNoRong, toiThieuNo, tomTatNo, type NgayNo, type SoNo } from '../server/src/no-cau'
import { SUAT_28, suatTheoTong, rut28, O_28 } from '../server/src/rut-28'
import { chonGoi7, type CauGoi7 } from '../server/src/goi-bai-7-loi'

const no = (n: number, lan = 0, loai: Partial<SoNo['loai']> = {}): SoNo => ({ no: n, lan, loai: { moi: n, sua: 0, on: 0, lai: 0, ...loai }, den: '2026-11-11' })
const ngay = (d: Partial<NgayNo>): NgayNo => ({ ngay: '2026-11-12', muc: 28, so: 0, kieu: null, lam: 0, kt: null, loai: 'moi', ...d })

it('trả tối thiểu = 25 % số nợ, làm tròn lên, sàn 6 câu; nợ ≤ 6 thì trả hết', () => {
  expect([42, 31, 23, 84, 24, 7, 6, 5, 1, 0].map(toiThieuNo)).toEqual([11, 8, 6, 21, 6, 6, 6, 5, 1, 0])
})
it('lãi 5 % mỗi đêm trên số nợ còn lại, làm tròn lên; hết nợ thì không lãi', () => {
  expect([31, 24, 19, 20, 60, 1, 0].map(laiNo)).toEqual([2, 2, 1, 1, 3, 1, 0])
})
it('ví dụ của thẻ: nợ 42, ba lần trả tối thiểu (11 · 9 · 7) có lãi, ngày thứ tư phải trả hết 20 câu', () => {
  let s = no(42)
  const qua: [number, number, number][] = []
  for (let i = 0; i < 3; i++) {
    const c = chonMacDinh(s)
    expect(c.kieu).toBe('toi_thieu')
    const M = 28 + c.so
    s = chotNgay(s, ngay({ muc: M, so: c.so, kieu: c.kieu, lam: M }), 28)
    qua.push([c.so, s.no, s.lan])
  }
  expect(qua).toEqual([[11, 33, 1], [9, 26, 2], [7, 20, 3]]) // còn 31 + lãi 2 · còn 24 + lãi 2 · còn 19 + lãi 1
  expect(phaiTraHet(s)).toBe(true)
  expect(chonMacDinh(s)).toEqual({ kieu: 'het', so: 20 })
  expect(soCuaKieu(s, 'toi_thieu')).toBeNull()
  s = chotNgay(s, ngay({ muc: 48, so: 20, kieu: 'het', lam: 48 }), 28)
  expect(s).toMatchObject({ no: 0, lan: 0, loai: { moi: 0, sua: 0, on: 0, lai: 0 } }) // trả hết ⇒ không lãi, đếm lại từ 0
})
it('thiếu câu của ngày thành nợ theo loại ngày, miễn lãi đêm đầu; hôm sau còn nợ mới tính lãi', () => {
  let s = chotNgay(soNoRong('2026-11-10'), ngay({ ngay: '2026-11-11', lam: 20, loai: 'sua' }), 28)
  expect(s).toMatchObject({ no: 8, lan: 0, loai: { moi: 0, sua: 8, on: 0, lai: 0 }, den: '2026-11-11' })
  s = chotNgay(s, ngay({ muc: null, loai: 'moi' }), 28) // hôm sau em không mở app: 8 + lãi 1 + 28 câu mới
  expect(s).toMatchObject({ no: 37, lan: 0, loai: { moi: 28, sua: 8, on: 0, lai: 1 } })
})
it('làm đủ 28 câu và không nợ ⇒ không phát sinh gì', () => {
  expect(chotNgay(soNoRong('2026-11-10'), ngay({ lam: 28 }), 28)).toMatchObject({ no: 0, lan: 0 })
  expect(chotNgay(soNoRong('2026-11-10'), ngay({ lam: 40 }), 28)).toMatchObject({ no: 0, lan: 0 })
})
it('trần nợ 84 câu: lãi và phần thiếu không đẩy nợ quá trần', () => {
  const s = chotNo(soNoRong('2026-11-10'), ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'].map((d) => ngay({ ngay: d, muc: null })), 28)
  expect(s.no).toBe(TRAN_NO)
  expect(Object.values(s.loai).reduce((a, b) => a + b, 0)).toBe(TRAN_NO)
  expect(chotNgay(s, ngay({ muc: null }), 28).no).toBe(TRAN_NO)
})
it('trả trước, bài hôm nay sau: làm chưa đủ số tối thiểu ⇒ trừ đúng số đã làm, cả 28 câu hôm nay thành nợ; vẫn tính một lần trả tối thiểu', () => {
  const s = chotNgay(no(42), ngay({ muc: 39, so: 11, kieu: 'toi_thieu', lam: 5 }), 28)
  expect(s).toMatchObject({ no: 37 + 2 + 28, lan: 1 }) // còn 37, lãi 2, thiếu 28
  const t = chotNgay(no(42), ngay({ muc: 39, so: 11, kieu: 'toi_thieu', lam: 30 }), 28)
  expect(t).toMatchObject({ no: 31 + 2 + 9, lan: 1 }) // trả đủ 11, làm 19/28 câu hôm nay
})
it('ngày em không làm câu nào không mất lần trả tối thiểu; nợ vẫn tăng', () => {
  expect(chotNgay(no(42, 2), ngay({ muc: 39, so: 11, kieu: 'toi_thieu', lam: 0 }), 28)).toMatchObject({ no: 42 + 3 + 28, lan: 2 })
  expect(chotNgay(no(42, 2), ngay({ muc: null }), 28)).toMatchObject({ no: 42 + 3 + 28, lan: 2 })
})
it('làm vượt mức hôm nay bao nhiêu câu thì nợ giảm thêm bấy nhiêu', () => {
  expect(chotNgay(no(42), ngay({ muc: 39, so: 11, kieu: 'toi_thieu', lam: 45 }), 28)).toMatchObject({ no: 25 + 2, lan: 1 }) // trả 11 + 6
  expect(chotNgay(no(10), ngay({ muc: 34, so: 6, kieu: 'toi_thieu', lam: 60 }), 28)).toMatchObject({ no: 0, lan: 0 })
})
it('kho hết câu (mức đã hạ) mà em làm đủ mức ⇒ coi như trả đủ số đã chọn, không thiếu', () => {
  expect(chotNgay(no(42), ngay({ muc: 5, so: 11, kieu: 'toi_thieu', lam: 5 }), 28)).toMatchObject({ no: 31 + 2, lan: 1 })
})
it('ngày Kiểm tra ôn tập: đã nộp ⇒ không đổi, không lãi; lỡ bài ⇒ 28 câu ôn thành nợ, không lãi, không mất lần', () => {
  expect(chotNgay(no(42, 1), ngay({ kt: 'da_nop', muc: 39, so: 11, kieu: 'toi_thieu' }), 28)).toMatchObject({ no: 42, lan: 1 })
  expect(chotNgay(no(42, 1), ngay({ kt: 'chua' }), 28)).toMatchObject({ no: 70, lan: 1, loai: { moi: 42, sua: 0, on: 28, lai: 0 } })
})
it('trả nợ trừ lãi trước rồi mới tới gốc', () => {
  const s = chotNgay(no(20, 0, { moi: 10, sua: 4, on: 3, lai: 3 }), ngay({ muc: 28 + 6, so: 6, kieu: 'toi_thieu', lam: 34 }), 28)
  expect(s.loai).toEqual({ moi: 7, sua: 4, on: 3, lai: 1 }) // trả 6: lãi 3 + mới 3; lãi đêm nay 1 (5 % của 14)
  expect(s.no).toBe(15)
})
it('tóm tắt gửi app: câu làm đầu tiên trong ngày tính vào trả nợ', () => {
  const s = no(42, 1)
  expect(tomTatNo(soNoRong('x'), { kieu: 'toi_thieu', so: 0 }, 0, 28)).toBeNull()
  expect(tomTatNo(s, { kieu: 'toi_thieu', so: 11 }, 0, 39)).toMatchObject({ no: 42, con: 42, toiThieu: 11, lan: 1, phaiTraHet: false, kieu: 'toi_thieu', so: 11, daTra: 0, lai: 5, laiDemNay: 3 })
  expect(tomTatNo(s, { kieu: 'toi_thieu', so: 11 }, 7, 39)).toMatchObject({ con: 35, daTra: 7 })
  expect(tomTatNo(s, { kieu: 'toi_thieu', so: 11 }, 30, 39)).toMatchObject({ con: 31, daTra: 11, laiDemNay: 2 })
  expect(tomTatNo(s, { kieu: 'het', so: 42 }, 70, 70)).toMatchObject({ con: 0, daTra: 42, laiDemNay: 0 })
  expect(tomTatNo(no(42, 3), { kieu: 'het', so: 42 }, 0, 70)).toMatchObject({ phaiTraHet: true })
})
it('mức hôm nay > 28 (có câu trả nợ): suất chia đúng tỉ lệ đề 28; ≤ 28 giữ nguyên 28 suất', () => {
  expect(suatTheoTong()).toEqual([...SUAT_28])
  expect(suatTheoTong(28)).toEqual([...SUAT_28])
  expect(suatTheoTong(12)).toEqual([...SUAT_28])
  expect(suatTheoTong(39)).toEqual([17, 5, 3, 3, 3, 4, 4])
  expect(suatTheoTong(56)).toEqual(SUAT_28.map((x) => x * 2))
  for (let t = 29; t <= 112; t++) {
    const s = suatTheoTong(t)
    expect(s.reduce((a, b) => a + b, 0)).toBe(t)
    s.forEach((x, i) => expect(Math.abs(x - SUAT_28[i]! * t / 28)).toBeLessThan(1))
  }
  // đề 39 câu rút từ kho dư mọi ô ⇒ đúng 17 · 5 · 3 · 3 · 3 · 4 · 4
  const ung = O_28.flatMap((o) => Array.from({ length: 40 }, (_, i) => ({ qid: `${o}#${i}`, o, tang: 1 })))
  const de = rut28({ ung, can: 39, tong: 39 })
  expect(O_28.map((o) => de.filter((q) => q.startsWith(`${o}#`)).length)).toEqual([17, 5, 3, 3, 3, 4, 4])
  expect(rut28({ ung, can: 28 })).toEqual(rut28({ ung, can: 28, tong: 28 }))
})

// CÂU LÃI LẤY TỪ ĐÂU (thầy 11/11: «số câu lãi lấy từ đâu cho hợp lý và cá nhân hoá cho học sinh nhất»): từ hàng ÔN của chính em (đã xếp theo nợ ôn dạng), đứng đầu đề.
const O_CUA = (q: string) => q.split('#')[0]!
const KHO: CauGoi7[] = O_28.flatMap((o) => Array.from({ length: 30 }, (_, i) => ({ qid: `${o}#m${i}`, group: `${o}#m${i}`, maDe: 'x', version: 'v1', phan: o.split('|')[0]!, kho: false, tinhToan: false, kyNang: ['a'] } as unknown as CauGoi7)))
const ON = ['I|biet#on0', 'III|hieu#on1', 'II|hieu#on2', 'I|hieu#on3', 'I|biet#on4'], SAI = ['I|van_dung#sai0', 'III|van_dung#sai1']
const vao = (them: Partial<Parameters<typeof chonGoi7>[0]> & { lai?: number }) => chonGoi7({ cau: KHO, daGap: new Set(), daLamNgay: new Set(), quotaCon: 999, chan: new Set(), sua: SAI, on: ON,
  sanSang: new Set([...KHO.map((c) => c.qid), ...ON, ...SAI, 'I|biet#som0', 'II|van_dung#som1', 'III|hieu#som2']), mucTieuNgay: 39, chiTrongMuc: true, loaiNgay: 'moi',
  nhomPhu: [{ qids: KHO.map((c) => c.qid), quota: 999 }], suat: { oCua: O_CUA, daLamO: [], tong: 39, lai: them.lai }, ...them })
it('câu lãi = câu ôn của chính em, đúng thứ tự nợ ôn dạng, đứng ĐẦU đề; tổng số câu của ngày không đổi; không có lãi thì đề như cũ', () => {
  const khong = vao({ lai: 0 })
  expect(khong.viec).toHaveLength(39)
  expect(khong.viec[0]!.vai).toBe('moi') // ngày Học mới: câu mới đứng đầu
  const co = vao({ lai: 3 })
  expect(co.viec).toHaveLength(39)
  expect(co.viec.slice(0, 3).map((v) => [v.qid, v.vai])).toEqual([[ON[0], 'on'], [ON[1], 'on'], [ON[2], 'on']])
  expect(co.viec[3]!.vai).toBe('moi')
  expect(co.viec.filter((v) => v.vai === 'moi').length).toBeGreaterThanOrEqual(28) // 28 câu của hôm nay vẫn đủ chỗ
  expect(co.lech ?? 0).toBe(khong.lech ?? 0)
})
it('hàng ôn đến hạn không đủ câu lãi: báo lệch để nơi gọi nạp ôn sớm; có ôn sớm thì lấy tiếp theo nợ ôn dạng; hết cả ôn mới tới câu em đang sai', () => {
  const thieu = vao({ lai: 7, onSom: undefined })
  expect(thieu.lech).toBeGreaterThanOrEqual(2) // 5 câu ôn đến hạn < 7 câu lãi, ôn sớm chưa nạp
  expect(thieu.viec.slice(0, 5).map((v) => v.qid)).toEqual(ON)
  const som = vao({ lai: 7, onSom: ['I|biet#som0', 'II|van_dung#som1', 'III|hieu#som2'] })
  expect(som.viec.slice(0, 7).map((v) => v.qid)).toEqual([...ON, 'I|biet#som0', 'II|van_dung#som1'])
  expect(som.viec.slice(0, 7).every((v) => v.vai === 'on')).toBe(true)
  const het = vao({ lai: 9, onSom: ['I|biet#som0'] })
  expect(het.viec.slice(0, 8).map((v) => [v.qid, v.vai])).toEqual([...ON.map((q) => [q, 'on']), ['I|biet#som0', 'on'], [SAI[0], 'sua'], [SAI[1], 'sua']])
  expect(het.viec).toHaveLength(39)
})
