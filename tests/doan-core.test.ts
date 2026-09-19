// ĐOÀN HỘ TỐNG — bước 1: lõi thuần. Mọi con số dưới đây TÍNH TAY từ luật ở mục 7 bản đề xuất
// (nền 16 × 1,5 × Liên Kích 2 × ấn thạch 1,25; quái 24 máu, đánh Linh Tâm 4; Chắn 8 dù đúng hay sai, sai thì đòn tự thành Chắn;
// Linh Tâm 40 + 20 × số ghế; trùm vỡ giáp từ 3/4 ý, không vỡ thì đánh 8 × số đoạn giáp còn).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  moChang, giaiHiep, satThuongDon, kiemHanhDong, kiemTiepSuc, banMayNop, banMayDungY, roiTran, datGiaoY, chiaY, kichBanChang,
  tomTatChang, khungNhinHiep, hiepLaTrum, giayCuaHiep, hetGioHiep, hpLinhTamToiDa, CHIEU, QUAI, TRUM, QUAI_TOI_DA, NHAN_TIEP_SUC_TOI_DA,
  type Chang, type NopHiep, type HanhDong,
} from '../src/game/than-thu-v2/doan-core'

const nguoi = (n: number, pets = [2, 0, 1, 3]) => Array.from({ length: n }, (_, i) => ({ id: `hs${i}`, ten: `Em ${i}`, pet: pets[i]! }))
const doi = (n: number, hatGiong = 'chang-thu', pets?: number[]) => moChang({ hatGiong, nguoi: nguoi(n, pets) })
const nop = (ghe: number, dung: boolean, hanhDong: HanhDong = 'danh', them: Partial<NopHiep> = {}): NopHiep => ({ ghe, dung, hanhDong, ...them })
const caDoi = (c: Chang, dung: boolean, hanhDong: HanhDong = 'danh') => c.ghe.map((_, i) => nop(i, dung, hanhDong))
const trumDung = (c: Chang, soY: number) => c.giaoY.map((ghe, y) => ({ ghe, y, dung: y < soY }))
const cuoi = (c: Chang) => c.lichSu.at(-1)!
/** Đi hết chặng: hiệp thường cả đội đúng + Đánh, hiệp trùm đúng `yTrum` ý. */
function diHet(c: Chang, yTrum = 4) { while (!c.ketThuc) c = hiepLaTrum(c.hiep) ? giaiHiep(c, { trum: trumDung(c, yTrum) }) : giaiHiep(c, { nop: caDoi(c, true) }); return c }

describe('Đoàn Hộ Tống · công thức sát thương (bảng tính tay)', () => {
  it.each([
    [{ dung: true }, 24],
    [{ dung: true, lienKich: true }, 48],
    [{ dung: true, anThach: true }, 30],
    [{ dung: true, lienKich: true, anThach: true }, 60],
    [{ dung: false }, 0],
    [{ dung: false, lienKich: true, anThach: true }, 0],
  ])('%j → %i', (d, mong) => expect(satThuongDon(d)).toBe(mong))
})

describe('Đoàn Hộ Tống · mở chặng', () => {
  it('đi một mình → thêm đúng một bạn máy dắt thần thú khác; Linh Tâm 80; hai quái 24 máu', () => {
    const c = doi(1)
    expect(c.ghe.map(g => g.laMay)).toEqual([false, true])
    expect(c.ghe[1]!.pet).not.toBe(c.ghe[0]!.pet)
    expect(c.linhTam).toEqual({ hp: 80, toiDa: 80 })
    expect(c.quai.map(q => q.hp)).toEqual([24, 24])
    expect([c.hiep, c.ketThuc, c.thang]).toEqual([1, false, null])
  })
  it('2–4 em thật → không có bạn máy; Linh Tâm 80 / 100 / 120; số quái mỗi hiệp = số ghế', () => {
    for (const n of [2, 3, 4]) { const c = doi(n); expect(c.ghe.every(g => !g.laMay)).toBe(true); expect(c.linhTam.toiDa).toBe(hpLinhTamToiDa(n)); expect(c.quai).toHaveLength(n) }
    expect([2, 3, 4].map(hpLinhTamToiDa)).toEqual([80, 100, 120])
  })
  it('từ chối 0 hoặc 5 bạn, trùng ghế, thần thú lạ, thiếu hạt giống — bằng lời tiếng Việt', () => {
    expect(() => moChang({ hatGiong: 'x', nguoi: [] })).toThrow('1 đến 4')
    expect(() => moChang({ hatGiong: 'x', nguoi: nguoi(4).concat({ id: 'hs9', ten: '', pet: 0 }) })).toThrow('1 đến 4')
    expect(() => moChang({ hatGiong: 'x', nguoi: [{ id: 'a', pet: 0 }, { id: 'a', pet: 1 }] })).toThrow('hai ghế')
    expect(() => moChang({ hatGiong: 'x', nguoi: [{ id: 'a', pet: 8 }] })).toThrow('Thần thú')
    expect(() => moChang({ hatGiong: '', nguoi: nguoi(2) })).toThrow('hạt giống')
  })
  it('kịch bản chặng rút từ hạt giống: hai loại quái khác nhau, hai trùm khác nhau, tên chặng theo đoạn đầu', () => {
    const k = kichBanChang('chang-thu')
    expect(k.quai[0]!.id).not.toBe(k.quai[1]!.id); expect(k.trum[0]!.id).not.toBe(k.trum[1]!.id)
    expect(QUAI.map(q => q.id)).toContain(k.quai[0]!.id); expect(TRUM.map(t => t.id)).toContain(k.trum[1]!.id)
    expect(doi(2).tenChang).toBe(k.quai[0]!.chang); expect(doi(2).quai[0]!.loai).toBe(k.quai[0]!.id)
  })
})

describe('Đoàn Hộ Tống · hiệp thường (tính tay)', () => {
  it('3 em cùng đúng + Đánh: 72 sát thương hạ cả 3 quái, Linh Tâm nguyên 100, sang hiệp 2 có 3 quái mới', () => {
    const c = giaiHiep(doi(3), { nop: caDoi(doi(3), true) }), h = cuoi(c)
    expect([h.tongSatThuong, h.quaiHaGuc, h.quaiConLai, h.linhTamMat]).toEqual([72, 3, 0, 0])
    expect(h.ghe.map(r => [r.satThuong, r.haGuc])).toEqual([[24, 1], [24, 1], [24, 1]])
    expect([c.hiep, c.linhTam.hp, c.quai.length]).toEqual([2, 100, 3])
    expect(c.ghe.map(g => g.nangLuong)).toEqual([1, 1, 1])
  })
  it('2 đúng, 1 bạn KHÔNG chốt: còn 1 quái đánh Linh Tâm 4 → 96; bạn không chốt không gây gì, không có năng lượng', () => {
    const c = giaiHiep(doi(3), { nop: [nop(0, true), nop(1, true)] }), h = cuoi(c)
    expect([h.tongSatThuong, h.quaiConLai, h.linhTamMat, c.linhTam.hp]).toEqual([48, 1, 4, 96])
    expect(h.ghe[2]).toMatchObject({ nop: false, dung: false, satThuong: 0, chan: 0, haGuc: 0 })
    expect(c.ghe.map(g => g.nangLuong)).toEqual([1, 1, 0])
    expect(c.quai).toHaveLength(4) // 1 con tồn + 3 con mới
  })
  it('Chắn 8 đỡ đúng đòn của 2 quái còn lại (8); đúng mà chắn được +2 năng lượng (chỉ mình em thấy)', () => {
    const c = giaiHiep(doi(3), { nop: [nop(0, true), nop(1, true, 'chan')] }), h = cuoi(c)
    expect([h.quaiConLai, h.tongChan, h.linhTamMat, c.linhTam.hp]).toEqual([2, 8, 0, 100])
    expect(h.ghe[1]).toMatchObject({ chan: 8, satThuong: 0, tenChieu: 'Chắn' }); expect(c.ghe.map(g => g.nangLuong)).toEqual([1, 2, 0])
  })
  it('SAI thì đòn tự chuyển thành Chắn, khiên vẫn 8 (không yếu hơn), không có năng lượng; khiên dư không hồi máu', () => {
    const c = giaiHiep(doi(3), { nop: [nop(0, false), nop(1, false, 'chan')] }), h = cuoi(c)
    expect(h.ghe.map(r => [r.hanhDong, r.satThuong, r.chan])).toEqual([['chan', 0, 8], ['chan', 0, 8], [null, 0, 0]])
    expect([h.tongChan, h.quaiConLai, h.linhTamMat, c.linhTam.hp]).toEqual([16, 3, 0, 100]); expect(c.ghe.map(g => g.nangLuong)).toEqual([0, 0, 0])
  })
  it('cả đội sai liên tục: không hạ được quái nào, quái dồn lại 2 → 4 → 6; tới hiệp 3 thì 6 × 4 = 24 vượt 2 khiên × 8 → Linh Tâm bắt đầu mất máu', () => {
    let c = doi(2); for (let i = 0; i < 3; i++) c = giaiHiep(c, { nop: caDoi(c, false) })
    expect(c.lichSu.map(h => [h.quaiConLai, h.linhTamMat])).toEqual([[2, 0], [4, 0], [6, 8]]); expect(c.linhTam.hp).toBe(72)
  })
  it('sát thương dư tràn sang quái kế; số quái trên sân không vượt trần', () => {
    let c = doi(4)
    for (let i = 0; i < 3; i++) c = giaiHiep(c) // không ai chốt 3 hiệp liền: 4 → 8 (kẹp trần) → 8
    expect(QUAI_TOI_DA).toBe(8); expect(cuoi(c).quaiConLai).toBe(8)
    expect(c.lichSu.map(h => h.linhTamMat)).toEqual([16, 32, 32]); expect(c.linhTam.hp).toBe(120 - 80)
  })
  it('chốt rồi không đổi: lần chốt đầu tiên của một ghế mới được tính', () => {
    const h = cuoi(giaiHiep(doi(2), { nop: [nop(0, false), nop(0, true), nop(1, true)] }))
    expect(h.ghe[0]!.dung).toBe(false); expect(h.tongSatThuong).toBe(24)
  })
})

describe('Đoàn Hộ Tống · Tiếp sức và Liên Kích', () => {
  it('bạn được tiếp sức làm lại ĐÚNG → cả hai ×2 (48 + 48); người giúp +1 năng lượng; câu được giúp không là "tự làm"', () => {
    const c = giaiHiep(doi(3), { nop: [nop(0, true), nop(1, true, 'danh', { tiepSucBoi: 0 }), nop(2, false)] }), h = cuoi(c)
    expect(h.ghe.map(r => r.satThuong)).toEqual([48, 48, 0])
    expect(h.ghe[0]).toMatchObject({ lienKich: true, tuLam: true, giup: 1, giupThanhCong: true, heSo: { dung: 1.5, lienKich: 2, anThach: 1 } })
    expect(h.ghe[1]).toMatchObject({ lienKich: true, tuLam: false, duocGiupBoi: 0 })
    expect(c.ghe.map(g => g.nangLuong)).toEqual([2, 1, 0]); expect(c.ghe[1]!.daNhanTiepSuc).toBe(1)
    expect(h.quaiHaGuc).toBe(3) // 96 sát thương đổ vào 3 quái 24 máu, dư 24 bỏ
  })
  it('bạn làm lại vẫn SAI → không Liên Kích, người giúp vẫn 24, bạn chắn 8, câu vẫn tính là đã được giúp', () => {
    const c = giaiHiep(doi(2), { nop: [nop(0, true), nop(1, false, 'danh', { tiepSucBoi: 0 })] }), h = cuoi(c)
    expect(h.ghe.map(r => [r.satThuong, r.chan, r.lienKich])).toEqual([[24, 0, false], [0, 8, false]])
    expect(h.ghe[0]).toMatchObject({ giup: 1, giupThanhCong: false }); expect(h.ghe[1]!.tuLam).toBe(false)
    expect(c.ghe[0]!.nangLuong).toBe(1); expect(c.ghe[1]!.daNhanTiepSuc).toBe(1)
  })
  it('Liên Kích nhân đôi cả khiên: Chắn đúng sau tiếp sức = 16', () => {
    const h = cuoi(giaiHiep(doi(2), { nop: [nop(0, true), nop(1, true, 'chan', { tiepSucBoi: 0 })] }))
    expect(h.ghe[1]!.chan).toBe(16); expect(h.ghe[0]!.satThuong).toBe(48)
  })
  it('mỗi hiệp giúp được MỘT bạn; không tự giúp mình; hiệp trùm không có thẻ; bạn máy không nhận', () => {
    const c = doi(3)
    expect(() => kiemTiepSuc(c, 0, 1, [0])).toThrow('một bạn'); expect(() => kiemTiepSuc(c, 1, 1)).toThrow('bạn khác'); expect(() => kiemTiepSuc(c, 0, 9)).toThrow('bạn khác')
    expect(() => kiemTiepSuc(doi(1), 0, 1)).toThrow('máy đỡ'); expect(() => kiemTiepSuc(doi(1), 1, 0)).not.toThrow() // bạn máy GIÚP em thì được
    const h = cuoi(giaiHiep(c, { nop: [nop(0, true), nop(1, true, 'danh', { tiepSucBoi: 0 }), nop(2, true, 'danh', { tiepSucBoi: 0 })] }))
    expect(h.ghe.map(r => r.satThuong)).toEqual([48, 48, 24]); expect(h.ghe[2]).toMatchObject({ tuLam: false, lienKich: false, duocGiupBoi: null })
    let t = doi(2); for (let i = 0; i < 3; i++) t = giaiHiep(t, { nop: caDoi(t, true) })
    expect(() => kiemTiepSuc(t, 0, 1)).toThrow('Hiệp trùm')
  })
  it(`mỗi chặng một em chỉ NHẬN tối đa ${NHAN_TIEP_SUC_TOI_DA} lần: lần thứ ba bị từ chối, không ×2, vẫn không là tự làm`, () => {
    let c = doi(2)
    for (let i = 0; i < 2; i++) c = giaiHiep(c, { nop: [nop(0, true), nop(1, true, 'danh', { tiepSucBoi: 0 })] })
    expect(c.ghe[1]!.daNhanTiepSuc).toBe(2); expect(() => kiemTiepSuc(c, 0, 1)).toThrow('tối đa 2')
    const h = cuoi(giaiHiep(c, { nop: [nop(0, true), nop(1, true, 'danh', { tiepSucBoi: 0 })] }))
    expect(h.ghe.map(r => [r.satThuong, r.tuLam])).toEqual([[24, true], [24, false]])
  })
})

describe('Đoàn Hộ Tống · Kỹ năng và năng lượng', () => {
  /** Hai em (Viêm Sư nhóm công, Thạch Quy nhóm thủ) đúng hai hiệp đầu → mỗi em 2 năng lượng, sân sạch, vào hiệp 3 có 2 quái mới. */
  const vaoHiep3 = (pets = [2, 0]) => { let c = doi(2, 'chang-thu', pets); for (let i = 0; i < 2; i++) c = giaiHiep(c, { nop: caDoi(c, true) }); return c }
  it('kỹ năng cần 2 năng lượng; mỗi câu đúng +1, tối đa 3', () => {
    expect(() => kiemHanhDong(doi(2), 0, 'ky_nang')).toThrow('2 năng lượng'); expect(() => kiemHanhDong(doi(2), 0, 'danh')).not.toThrow()
    expect(() => kiemHanhDong(doi(2), 5, 'danh')).toThrow('ghế'); expect(() => kiemHanhDong(doi(2), 0, 'bay' as HanhDong)).toThrow('Đánh, Chắn')
    const c = vaoHiep3(); expect(c.ghe.map(g => g.nangLuong)).toEqual([2, 2]); expect(() => kiemHanhDong(c, 0, 'ky_nang')).not.toThrow()
    const d = giaiHiep(giaiHiep(c, { nop: caDoi(c, true) }), { trum: [] }); expect(d.ghe.map(g => g.nangLuong)).toEqual([3, 3])
    expect(giaiHiep(d, { nop: caDoi(d, true) }).ghe.map(g => g.nangLuong)).toEqual([3, 3])
  })
  it('ấn thạch sáng: kỹ năng 30 hạ quái 1, dư 6 sang quái 2; bạn nhóm thủ 24 + khiên 12; tốn 2, đúng +1 → còn 1', () => {
    const c = giaiHiep(vaoHiep3(), { nop: [nop(0, true, 'ky_nang', { anThach: true }), nop(1, true, 'ky_nang')] }), h = cuoi(c)
    expect(h.ghe[0]).toMatchObject({ satThuong: 30, haGuc: 1, lan: 0, tenChieu: 'Liệt Diễm Xuyên Giáp', heSo: { dung: 1.5, lienKich: 1, anThach: 1.25 } })
    expect(h.ghe[1]).toMatchObject({ satThuong: 24, haGuc: 1, chan: 12, tenChieu: 'Địa Tinh Thuẫn' })
    expect([h.quaiConLai, h.linhTamMat]).toEqual([0, 0]); expect(c.ghe.map(g => g.nangLuong)).toEqual([1, 1])
  })
  it('đòn lan nhóm công: quái 2 còn 18 sau đòn chính, lan trừ thêm 6 → 12; bạn không chốt nên quái ấy đánh Linh Tâm 4 → 76', () => {
    const c = giaiHiep(vaoHiep3(), { nop: [nop(0, true, 'ky_nang', { anThach: true })] }), h = cuoi(c)
    expect(h.ghe[0]).toMatchObject({ satThuong: 30, lan: 6, haGuc: 1 }); expect(h.tongSatThuong).toBe(36)
    expect(c.quai[0]!.hp).toBe(12); expect(c.linhTam.hp).toBe(76)
  })
  it('ấn thạch chỉ tính khi dùng KỸ NĂNG (Đánh thường vẫn 24); kỹ năng mà SAI: 0 sát thương, không mất năng lượng', () => {
    const c = vaoHiep3()
    expect(cuoi(giaiHiep(c, { nop: [nop(0, true, 'danh', { anThach: true })] })).ghe[0]!.satThuong).toBe(24)
    const d = giaiHiep(c, { nop: [nop(0, false, 'ky_nang', { anThach: true })] })
    expect(cuoi(d).ghe[0]).toMatchObject({ hanhDong: 'chan', satThuong: 0, lan: 0, chan: 8 }); expect(d.ghe[0]!.nangLuong).toBe(2)
  })
  it('gửi "kỹ năng" khi thiếu năng lượng → lõi coi là Đánh, không làm hỏng phòng', () => {
    expect(cuoi(giaiHiep(doi(2), { nop: [nop(0, true, 'ky_nang', { anThach: true })] })).ghe[0]).toMatchObject({ hanhDong: 'danh', satThuong: 24, tenChieu: CHIEU[2]!.chuong })
  })
  it('nhóm hồi: +10 máu Linh Tâm, tính gộp với máu mất và không vượt tối đa', () => {
    let c = doi(2, 'chang-thu', [1, 0]); c = giaiHiep(c) // không ai chốt: 2 quái → 72
    for (let i = 0; i < 2; i++) c = giaiHiep(c, { nop: [nop(0, true), nop(1, true)] })
    // vào trùm: 72 − 8 − 8 = 56 (mỗi hiệp 2 đòn đúng hạ 2 trong 4 quái); qua trùm 4/4 quét sạch
    expect(c.linhTam.hp).toBe(56); c = giaiHiep(c, { trum: trumDung(c, 4) })
    const d = giaiHiep(c, { nop: [nop(0, true, 'ky_nang'), nop(1, true)] })
    expect(cuoi(d)).toMatchObject({ linhTamHoi: 10, linhTamMat: 0, linhTamSau: 66 })
    const day = giaiHiep(vaoHiep3([1, 0]), { nop: [nop(0, true, 'ky_nang'), nop(1, true)] }); expect(day.linhTam.hp).toBe(80)
  })
  it('hồi và mất tính GỘP rồi mới kẹp: đầy máu 80 − 4 + 10 vẫn 80; còn 3 máu − 4 + 10 = 9, Linh Tâm không vỡ', () => {
    const c = vaoHiep3([1, 0]), bai = { nop: [nop(0, true, 'ky_nang')] } // hạ 1 quái; bạn không chốt nên còn 1 quái đánh 4
    expect(cuoi(giaiHiep(c, bai))).toMatchObject({ linhTamMat: 4, linhTamHoi: 10, linhTamSau: 80 })
    const mong = giaiHiep({ ...c, linhTam: { hp: 3, toiDa: 80 } }, bai); expect([mong.linhTam.hp, mong.ketThuc]).toEqual([9, false])
  })
})

describe('Đoàn Hộ Tống · Trùm câu chung', () => {
  const vaoTrum = (n: number) => { let c = doi(n); for (let i = 0; i < 3; i++) c = giaiHiep(c, { nop: caDoi(c, true).slice(1) }); return c } // ghế 0 không chốt → mỗi hiệp tồn thêm 1 quái
  it('hiệp 4 và 8 là trùm, 60 giây; các hiệp khác 40 giây; hết giờ theo đồng hồ nơi gọi đưa vào', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].filter(hiepLaTrum)).toEqual([4, 8]); expect([giayCuaHiep(3), giayCuaHiep(4)]).toEqual([40, 60])
    expect(hetGioHiep(1000, 40999, 1)).toBe(false); expect(hetGioHiep(1000, 41000, 1)).toBe(true); expect(hetGioHiep(1000, 41000, 8)).toBe(false)
  })
  it('4 ý chia vòng tròn cho các ghế, ai cũng có phần; máy chủ giao lại được nhưng phải đủ 4 ý, đúng ghế', () => {
    for (const n of [2, 3, 4]) { const g = chiaY('hat', 4, n); expect(g).toHaveLength(4); expect(new Set(g).size).toBe(n); expect(g).toEqual(chiaY('hat', 4, n)) }
    const c = vaoTrum(3); expect(c.hiep).toBe(4); expect(c.giaoY).toEqual(chiaY('chang-thu', 4, 3))
    expect(datGiaoY(c, [2, 2, 1, 0]).giaoY).toEqual([2, 2, 1, 0])
    expect(() => datGiaoY(c, [0, 1, 2])).toThrow('Mỗi ý'); expect(() => datGiaoY(c, [0, 1, 2, 3])).toThrow('Mỗi ý'); expect(() => datGiaoY(doi(3), [0, 1, 2, 0])).toThrow('hiệp trùm')
    expect(() => kiemHanhDong(c, 0, 'danh')).toThrow('Hiệp trùm')
  })
  it('đúng 3/4 ý → vỡ giáp: quét sạch 3 quái tồn, Linh Tâm không mất máu', () => {
    const c = vaoTrum(3); expect(c.quai).toHaveLength(3); expect(c.linhTam.hp).toBe(100 - 4 - 8 - 12)
    const d = giaiHiep(c, { trum: trumDung(c, 3) }), h = cuoi(d)
    expect(h.trum).toMatchObject({ yDung: 3, voGiap: true, giapConLai: 1 }); expect([h.quaiHaGuc, h.linhTamMat, d.linhTam.hp]).toEqual([3, 0, 76])
    expect(d.trumVoGiap).toEqual([true]); expect([d.hiep, d.quai.length]).toEqual([5, 3]) // sang đoạn 2: chỉ có 3 quái mới
    expect(d.quai[0]!.loai).toBe(kichBanChang('chang-thu').quai[1]!.id)
  })
  it('chỉ đúng 2/4 ý → trùm đánh 2 × 8 = 16, thêm 3 quái tồn × 4 = 12 → 76 − 28 = 48', () => {
    const c = vaoTrum(3), d = giaiHiep(c, { trum: trumDung(c, 2) }), h = cuoi(d)
    expect(h.trum).toMatchObject({ yDung: 2, voGiap: false, giapConLai: 2 }); expect([h.linhTamMat, d.linhTam.hp]).toEqual([28, 48])
    expect(d.quai).toHaveLength(6) // 3 tồn + 3 mới
  })
  it('chỉ ghế GIỮ ý mới trả lời được ý đó; ý không ai chốt = sai; chốt rồi không đổi', () => {
    const c = datGiaoY(vaoTrum(3), [0, 1, 2, 0])
    const h = cuoi(giaiHiep(c, { trum: [{ ghe: 1, y: 0, dung: true }, { ghe: 1, y: 1, dung: true }, { ghe: 2, y: 2, dung: false }, { ghe: 2, y: 2, dung: true }] }))
    expect(h.trum!.yDung).toBe(1)
    expect(h.ghe.map(r => [r.nop, r.yGiu, r.yDung])).toEqual([[false, [0, 3], []], [true, [1], [1]], [true, [2], []]])
  })
  it('hiệp trùm không đổi năng lượng, không tính vào số câu của em', () => {
    const c = vaoTrum(2), d = giaiHiep(c, { trum: trumDung(c, 4) })
    expect(d.ghe.map(g => g.nangLuong)).toEqual(c.ghe.map(g => g.nangLuong)); expect(tomTatChang(d).ghe.map(g => g.soCau)).toEqual([0, 3])
  })
})

describe('Đoàn Hộ Tống · thắng, thua, sao, tóm tắt', () => {
  it('cả đội làm đúng hết: 8 hiệp, VƯỢT CHẶNG 3 sao, Linh Tâm đầy, hạ 18 quái, vỡ giáp hai trùm', () => {
    const c = diHet(doi(3)), t = tomTatChang(c)
    expect([c.ketThuc, c.thang, c.hiep]).toEqual([true, true, 8])
    expect(t).toMatchObject({ thang: true, sao: 3, soHiepDaChoi: 8, linhTam: { hp: 100, toiDa: 100 }, trumVoGiap: [true, true], quaiHaGuc: 18, soLienKich: 0 })
    expect(t.ghe[0]).toMatchObject({ soCau: 6, soDung: 6, soTuLamDung: 6, satThuong: 144, haGuc: 6, soLanGiup: 0, soLanDuocGiup: 0 })
    expect(() => giaiHiep(c)).toThrow('kết thúc'); expect(() => kiemHanhDong(c, 0, 'danh')).toThrow('kết thúc')
  })
  it('hỏng một trùm (2/4 ý) vẫn về đích nhưng chỉ 2 sao', () => {
    let c = doi(3); while (c.hiep < 8) c = hiepLaTrum(c.hiep) ? giaiHiep(c, { trum: trumDung(c, 4) }) : giaiHiep(c, { nop: caDoi(c, true) })
    c = giaiHiep(c, { trum: trumDung(c, 2) })
    expect(tomTatChang(c)).toMatchObject({ thang: true, sao: 2, trumVoGiap: [true, false], linhTam: { hp: 84 } }) // trùm đánh 16, sân không còn quái
  })
  it('về đích dưới nửa máu và hỏng trùm → 1 sao', () => {
    let c = doi(2); c = giaiHiep(c); c = giaiHiep(c) // 80 − 8 − 16 = 56, sân 4 quái
    while (!c.ketThuc) c = hiepLaTrum(c.hiep) ? giaiHiep(c, { trum: trumDung(c, 2) }) : giaiHiep(c, { nop: caDoi(c, true) })
    // hiệp 3: hạ 2 trong 6 → còn 4 → −16 = 40; trùm 4: −16 −16 = 8; hiệp 5–7: hạ 2 trong 6 → còn 4 → −16 → Linh Tâm vỡ ở hiệp 5
    expect([c.thang, c.hiep, tomTatChang(c).sao]).toEqual([false, 5, 0])
    let d = doi(2); d = giaiHiep(d); while (!d.ketThuc) d = hiepLaTrum(d.hiep) ? giaiHiep(d, { trum: trumDung(d, d.hiep === 4 ? 4 : 0) }) : giaiHiep(d, { nop: caDoi(d, true) })
    // 80 − 8 = 72; hiệp 2, 3: hạ 2 trong 4 → −8, −8 = 56; trùm 4 vỡ giáp; hiệp 5–7 sạch; trùm 8 trượt cả 4 ý: −32 → 24 < nửa 40
    expect(tomTatChang(d)).toMatchObject({ thang: true, sao: 1, linhTam: { hp: 24 } })
  })
  it('không ai làm gì: 80 → 72 → 56 → 32, trùm 0/4 đánh 32 + 6 quái × 4 → Linh Tâm vỡ ở hiệp 4; thua 0 sao và dừng hẳn', () => {
    let c = doi(2); while (!c.ketThuc) c = giaiHiep(c)
    expect(c.lichSu.map(h => h.linhTamSau)).toEqual([72, 56, 32, 0]); expect([c.thang, c.hiep]).toEqual([false, 4])
    expect(tomTatChang(c)).toMatchObject({ thang: false, sao: 0, soHiepDaChoi: 4, trumVoGiap: [false] })
  })
  it('tóm tắt đếm đúng tiếp sức: giúp 2 lần, thành công 1; Liên Kích của chặng = số lần giúp thành công', () => {
    let c = doi(2)
    c = giaiHiep(c, { nop: [nop(0, true), nop(1, true, 'danh', { tiepSucBoi: 0 })] })
    c = giaiHiep(c, { nop: [nop(0, true), nop(1, false, 'chan', { tiepSucBoi: 0 })] })
    const t = tomTatChang(c)
    expect(t.ghe[0]).toMatchObject({ soLanGiup: 2, soLanGiupThanhCong: 1, soLienKich: 1, soTuLamDung: 2, satThuong: 72 })
    expect(t.ghe[1]).toMatchObject({ soLanDuocGiup: 2, soDung: 1, soTuLamDung: 0, satThuong: 48, chan: 8 }); expect(t.soLienKich).toBe(1)
  })
})

describe('Đoàn Hộ Tống · công bằng theo nỗ lực', () => {
  it('cấp thần thú và độ khó không có đường vào lõi: ghế không giữ cấp, thêm "level" vào đầu vào cũng không đổi gì', () => {
    const thuong = moChang({ hatGiong: 'cb', nguoi: [{ id: 'yeu', pet: 0 }, { id: 'gioi', pet: 0 }] })
    const coCap = moChang({ hatGiong: 'cb', nguoi: [{ id: 'yeu', pet: 0, level: 1, sao: 0 }, { id: 'gioi', pet: 0, level: 100, sao: 2 }] as never })
    expect(coCap).toEqual(thuong); expect(JSON.stringify(coCap)).not.toMatch(/level|"sao"|mucDo/)
    const h = cuoi(giaiHiep(coCap, { nop: [{ ...nop(0, true), level: 1, sao: 0 } as never, { ...nop(1, true), level: 100, sao: 2 } as never] }))
    expect(h.ghe[0]!.satThuong).toBe(24); expect(h.ghe[1]!.satThuong).toBe(h.ghe[0]!.satThuong)
  })
  it('8 thần thú: Đánh đúng đều 24; kỹ năng đúng đều 24 sát thương chính + đúng MỘT hiệu ứng phụ', () => {
    for (let pet = 0; pet < 8; pet++) {
      let c = moChang({ hatGiong: 'pet', nguoi: [{ id: 'a', pet }, { id: 'b', pet: (pet + 1) % 8 }] })
      expect(cuoi(giaiHiep(c, { nop: [nop(0, true)] })).ghe[0]!.satThuong).toBe(24)
      for (let i = 0; i < 2; i++) c = giaiHiep(c, { nop: [nop(0, true), nop(1, false)] }) // ghế 1 sai để sân còn quái cho đòn lan
      const r = cuoi(giaiHiep(c, { nop: [nop(0, true, 'ky_nang')] })).ghe[0]!
      expect(r.satThuong).toBe(24); expect(r.tenChieu).toBe(CHIEU[pet]!.kyNang)
      expect([r.chan > 0, r.hoi > 0, r.lan > 0].filter(Boolean)).toHaveLength(1)
      expect({ thu: r.chan, hoi: r.hoi, cong: r.lan > 0 ? 1 : 0 }[CHIEU[pet]!.nhom]).toBeGreaterThan(0)
    }
  })
})

describe('Đoàn Hộ Tống · bạn máy và rời trận', () => {
  it('bạn máy tất định theo (hạt giống, hiệp, ghế); đúng khoảng 75%; có 2 năng lượng thì dùng kỹ năng', () => {
    const c = doi(1); expect(banMayNop(c, 1)).toEqual(banMayNop(doi(1), 1)); expect(banMayNop(c, 1).hanhDong).toBe('danh')
    let dung = 0; for (let i = 0; i < 400; i++) if (banMayNop(doi(1, `hat-${i}`), 1).dung) dung++
    expect(dung).toBeGreaterThan(260); expect(dung).toBeLessThan(340)
    expect(banMayNop({ ...c, ghe: c.ghe.map(g => ({ ...g, nangLuong: 2 })) }, 1).hanhDong).toBe('ky_nang')
  })
  it('Linh Tâm còn từ 40% trở xuống và sân còn quái → bạn máy chuyển sang Chắn', () => {
    const c = doi(1)
    expect(banMayNop({ ...c, linhTam: { hp: 32, toiDa: 80 } }, 1).hanhDong).toBe('chan'); expect(banMayNop({ ...c, linhTam: { hp: 33, toiDa: 80 } }, 1).hanhDong).toBe('danh')
    expect(banMayNop({ ...c, linhTam: { hp: 10, toiDa: 80 }, quai: [] }, 1).hanhDong).toBe('danh')
  })
  it('đi một mình trọn chặng: lõi tự đánh thay bạn máy (kể cả ý trùm), bỏ qua mọi thứ gửi hộ ghế máy', () => {
    let c = doi(1); const may = banMayNop(c, 1)
    c = giaiHiep(c, { nop: [nop(0, true), nop(1, !may.dung, 'chan')] })
    expect(cuoi(c).ghe[1]).toMatchObject({ nop: true, dung: may.dung, hanhDong: may.dung ? 'danh' : 'chan' })
    while (!c.ketThuc) {
      if (!hiepLaTrum(c.hiep)) { c = giaiHiep(c, { nop: [nop(0, true)] }); continue }
      const mong = c.giaoY.filter((ghe, y) => ghe === 0 || banMayDungY(c, y)).length
      c = giaiHiep(c, { trum: c.giaoY.map((ghe, y) => ({ ghe, y, dung: true })) }) // gửi "đúng" hộ cả ý của máy → phải bị bỏ qua
      expect(cuoi(c).trum!.yDung).toBe(mong)
    }
    expect(c.lichSu).toHaveLength(8); expect(tomTatChang(c).ghe[1]).toMatchObject({ laMay: true, soCau: 6 })
  })
  it('rời trận → máy đỡ thay từ hiệp ấy, đội không bị phạt; bài gửi của ghế đã rời bị bỏ qua', () => {
    const c = roiTran(doi(2), 'hs1'), may = banMayNop(c, 1)
    expect(c.ghe[1]).toMatchObject({ roi: true, laMay: false }); expect(c.linhTam.hp).toBe(80)
    expect(cuoi(giaiHiep(c, { nop: [nop(0, true), nop(1, !may.dung, 'chan')] })).ghe[1]).toMatchObject({ dung: may.dung, hanhDong: may.dung ? may.hanhDong : 'chan' })
    expect(roiTran(c, 'khong-co')).toEqual(c)
  })
})

describe('Đoàn Hộ Tống · tất định và thuần', () => {
  const kichBan = (hat: string) => { let c = doi(1, hat); while (!c.ketThuc) c = hiepLaTrum(c.hiep) ? giaiHiep(c, { trum: trumDung(c, 3) }) : giaiHiep(c, { nop: [nop(0, c.hiep % 2 === 1, c.hiep === 3 ? 'chan' : 'danh')] }); return c }
  it('cùng hạt giống + cùng đầu vào → cùng diễn biến từng byte; khác hạt giống → khác', () => {
    expect(JSON.stringify(kichBan('hat-a'))).toBe(JSON.stringify(kichBan('hat-a')))
    const khac = new Set(Array.from({ length: 12 }, (_, i) => JSON.stringify(kichBan(`hat-${i}`).lichSu))); expect(khac.size).toBeGreaterThan(1)
  })
  it('giaiHiep, roiTran, datGiaoY không sửa trạng thái đầu vào; trạng thái đi qua JSON nguyên vẹn', () => {
    const dong = <T>(x: T): T => { Object.values(x as object).forEach(v => v && typeof v === 'object' && dong(v)); return Object.freeze(x) }
    const c = dong(doi(3)), truoc = JSON.stringify(c)
    giaiHiep(c, { nop: [nop(0, true), nop(1, true, 'danh', { tiepSucBoi: 0 })] }); roiTran(c, 'hs0'); expect(JSON.stringify(c)).toBe(truoc)
    const giua = giaiHiep(c, { nop: caDoi(c, true) }); expect(giaiHiep(JSON.parse(JSON.stringify(giua)), { nop: caDoi(giua, true) })).toEqual(giaiHiep(giua, { nop: caDoi(giua, true) }))
  })
  it('lõi không đọc đồng hồ, không Math.random, không React', () => {
    const ma = readFileSync('src/game/than-thu-v2/doan-core.ts', 'utf8').replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')
    expect(ma).not.toMatch(/Date\.now|new Date|Math\.random|performance\.|from 'react'|document\.|window\./)
  })
})

describe('Đoàn Hộ Tống · khung nhìn gửi xuống máy em', () => {
  it('về bạn chỉ có ra đòn / chắn / giữ vị trí (= không chốt); không lộ đúng/sai, hệ số, tự làm', () => {
    const h = cuoi(giaiHiep(doi(4), { nop: [nop(0, true), nop(1, false), nop(2, false, 'chan')] })), k = khungNhinHiep(h, 0)
    expect(k.cuaEm).toMatchObject({ ghe: 0, dung: true, satThuong: 24 })
    expect(k.ban).toEqual([
      { ghe: 1, ra: 'chan', tenChieu: '', satThuong: 0, haGuc: 0, lienKich: false },
      { ghe: 2, ra: 'chan', tenChieu: '', satThuong: 0, haGuc: 0, lienKich: false },
      { ghe: 3, ra: 'giu', tenChieu: '', satThuong: 0, haGuc: 0, lienKich: false },
    ])
    expect(JSON.stringify(k.ban)).not.toMatch(/dung|tuLam|heSo|duocGiup|yDung/); expect('ghe' in k).toBe(false)
    expect(khungNhinHiep(h, 1).ban[0]).toEqual({ ghe: 0, ra: 'don', tenChieu: CHIEU[2]!.chuong, satThuong: 24, haGuc: 1, lienKich: false })
  })
  it('KHÔNG SUY RA ĐƯỢC bạn sai — kể cả khi chỉ MỘT bạn chắn: đúng-rồi-chắn, sai-khi-Đánh, sai-khi-Chắn, sai-khi-Kỹ-năng cho khung nhìn Y HỆT nhau', () => {
    // Đội 2 bạn, hiệp 3, bạn ghế 1 đang có 2 năng lượng (để "kỹ năng" là lựa chọn thật). Người xem là ghế 0.
    let c = doi(2); for (let i = 0; i < 2; i++) c = giaiHiep(c, { nop: caDoi(c, true) })
    const nhin = (ban: NopHiep) => JSON.stringify(khungNhinHiep(cuoi(giaiHiep(c, { nop: [nop(0, true), ban] })), 0))
    const dungRoiChan = nhin(nop(1, true, 'chan'))
    for (const sai of [nop(1, false, 'danh'), nop(1, false, 'chan'), nop(1, false, 'ky_nang'), nop(1, false, 'ky_nang', { anThach: true })]) expect(nhin(sai)).toBe(dungRoiChan)
    // …và mọi con số công khai của sân (máu Linh Tâm, khiên, quái) cũng y hệt → không suy ngược được từ thanh máu
    const san = (ban: NopHiep) => { const d = giaiHiep(c, { nop: [nop(0, true), ban] }); return JSON.stringify([d.linhTam, d.quai, cuoi(d).tongChan, cuoi(d).linhTamMat, cuoi(d).tongSatThuong]) }
    expect(san(nop(1, false, 'danh'))).toBe(san(nop(1, true, 'chan')))
    expect(nhin(nop(1, true, 'danh'))).not.toBe(dungRoiChan) // còn bạn ĐÚNG và ra đòn thì thấy được — đó là tin vui, không phải tin xấu
  })
  it('hiệp trùm: em chỉ thấy ý CỦA EM đúng hay sai; về bạn chỉ có tổng số ý đúng của cả đội', () => {
    let c = doi(4); for (let i = 0; i < 3; i++) c = giaiHiep(c, { nop: caDoi(c, true) })
    const h = cuoi(giaiHiep(c, { trum: trumDung(c, 3) })), gheGiuY0 = c.giaoY[0]!, k = khungNhinHiep(h, gheGiuY0)
    expect(k.cuaEm).toMatchObject({ yGiu: [0], yDung: [0] }); expect(k.trum).toEqual({ loai: kichBanChang('chang-thu').trum[0]!.id, yDung: 3, voGiap: true, giapConLai: 1 })
    expect(JSON.stringify(k.ban)).not.toMatch(/yGiu|yDung/); expect(k.ban).toHaveLength(3)
  })
})
