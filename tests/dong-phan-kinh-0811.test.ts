// @vitest-environment node
// ĐỒNG PHÂN THEO SKILL THẦY 08/11 — lõi tính lại (src/lib/loi-giai-kinh/dong-phan.ts) + bộ kiểm Lời giải Kính dùng khối `dongPhan`.
import { describe, expect, it } from 'vitest'
import { docDongPhan, lietKeMach, moiKhung, tinhK } from '../src/lib/loi-giai-kinh/dong-phan'
import { chuCam, kiemBanKinh } from '../src/lib/loi-giai-kinh/kiem'

const k = (chinh: number, nhanh: { o: number; dai: number }[] = []) => ({ chinh, nhanh })
const dem = (khung: ReturnType<typeof k>[], dat: { loai: 'nhom' | 'oh' | 'doi' | 'ba' | 'xeton' | 'chen'; nhan: string }[]) =>
  khung.reduce((a, x) => { const r = lietKeMach({ khung: x, dat })!; return { cau: a.cau + r.soChat, hh: a.hh + r.hinhHoc } }, { cau: 0, hh: 0 })

describe('lõi đồng phân', () => {
  it('K và số khung carbon', () => {
    expect(tinhK({ C: 4, H: 8 })).toBe(1)
    expect(tinhK({ C: 4, H: 11, N: 1 })).toBe(0)
    expect([4, 5, 6, 7, 8].map((n) => moiKhung(n).length)).toEqual([2, 3, 5, 9, 18])
  })
  it('đếm đúng các ca SGK', () => {
    expect(dem([k(4), k(3, [{ o: 2, dai: 1 }])], [{ loai: 'doi', nhan: 'C=C' }])).toEqual({ cau: 3, hh: 1 }) // C4H8: 3 cấu tạo + 1 hình học
    expect(dem([k(5), k(4, [{ o: 2, dai: 1 }]), k(3, [{ o: 2, dai: 1 }, { o: 2, dai: 1 }])], [{ loai: 'doi', nhan: 'C=C' }])).toEqual({ cau: 5, hh: 1 }) // C5H10 anken
    expect(dem([k(4), k(3, [{ o: 2, dai: 1 }])], [{ loai: 'oh', nhan: 'OH' }]).cau).toBe(4) // ancol C4H10O
    expect(dem([k(4), k(3, [{ o: 2, dai: 1 }])], [{ loai: 'chen', nhan: 'O' }]).cau).toBe(3) // ether C4H10O
    expect(dem([k(5), k(4, [{ o: 2, dai: 1 }])], [{ loai: 'xeton', nhan: 'CO' }]).cau).toBe(3) // ketone C5H10O
    expect(dem([k(3)], [{ loai: 'nhom', nhan: 'Cl' }, { loai: 'nhom', nhan: 'Cl' }]).cau).toBe(4) // C3H6Cl2
    expect(dem([k(4), k(3, [{ o: 2, dai: 1 }])], [{ loai: 'doi', nhan: 'C=C' }, { loai: 'nhom', nhan: 'Cl' }]).cau).toBe(8) // C4H7Cl
  })
  it('phân loại: trùng do đối xứng, thừa hoá trị, enol', () => {
    const r = lietKeMach({ khung: k(4), dat: [{ loai: 'doi', nhan: 'C=C' }] })!
    expect(r.toHop.map((t) => t.ket)).toEqual(['moi', 'moi', 'trung'])
    expect(r.toHop[1]!.gon).toBe('CH3-CH=CH-CH3')
    const x = lietKeMach({ khung: k(3, [{ o: 2, dai: 1 }, { o: 2, dai: 1 }]), dat: [{ loai: 'doi', nhan: 'C=C' }] })!
    expect(x.toHop.every((t) => t.ket === 'thua')).toBe(true)
  })
})

const DP4 = { ctpt: 'C_4H_8', nguyenTu: { C: 4, H: 8 }, K: 1, hoi: 'dong-phan', tong: 4,
  mach: [{ so: '4', khung: k(4), dat: [{ loai: 'doi', nhan: 'C=C' }], soChat: 2 }, { so: '3+1', khung: k(3, [{ o: 2, dai: 1 }]), dat: [{ loai: 'doi', nhan: 'C=C' }], soChat: 1 }] }

describe('kiểm khối dongPhan', () => {
  it('đạt khi mọi số đúng; báo quên mạch, sai K, sai tổng, phép tính mạch sai', () => {
    expect(docDongPhan(DP4).loi).toBeNull()
    expect(docDongPhan({ ...DP4, mach: [DP4.mach[0]], tong: 3 }).loi).toMatch(/quên mạch 3\+1/)
    expect(docDongPhan({ ...DP4, K: 2 }).loi).toMatch(/K = /)
    expect(docDongPhan({ ...DP4, tong: 5 }).loi).toMatch(/cộng lại được 4/)
    expect(docDongPhan({ ...DP4, hoi: 'cau-tao', tong: 3 }).loi).toBeNull()
    expect(docDongPhan({ ...DP4, mach: [DP4.mach[0]], tong: 3, khungCoDinh: 'đề cho sẵn mạch 4' }).loi).toBeNull() // đề cho sẵn mạch
    expect(docDongPhan({ ...DP4, mach: [DP4.mach[0], { ...DP4.mach[1], so: '4' }] }).loi).toMatch(/phép tính phải là 3\+1/)
    expect(docDongPhan({ ...DP4, mach: [{ ...DP4.mach[0], khung: k(3, [{ o: 1, dai: 1 }]), so: '3+1' }, DP4.mach[1]] }).loi).toMatch(/mạch dài nhất/)
  })
  it('bảng phần cố định: ester, amine, arene', () => {
    const este = { ctpt: 'C_4H_8O_2', nguyenTu: { C: 4, H: 8, O: 2 }, K: 1, hoi: 'cau-tao', tong: 4, bang: { loai: 'este', tieuDe: 'x', cot: [], hang: [{ phan: [0, 3], soCach: [1, 2], tich: 2 }, { phan: [1, 2], soCach: [1, 1], tich: 1 }, { phan: [2, 1], soCach: [1, 1], tich: 1 }] } }
    expect(docDongPhan(este).loi).toBeNull()
    expect(docDongPhan({ ...este, bang: { ...este.bang, hang: [{ phan: [0, 3], soCach: [1, 1], tich: 1 }] }, tong: 1 }).loi).toMatch(/số gốc/)
    const amin = { ctpt: 'C_4H_11N', nguyenTu: { C: 4, H: 11, N: 1 }, K: 0, hoi: 'cau-tao', tong: 8, bang: { loai: 'amin', tieuDe: 'x', cot: [], hang: [{ phan: [4], soCach: [4], tich: 4 }, { phan: [1, 3], soCach: [1, 2], tich: 2 }, { phan: [2, 2], soCach: [1, 1], tich: 1 }, { phan: [1, 1, 2], soCach: [1, 1, 1], tich: 1 }] } }
    expect(docDongPhan(amin).loi).toBeNull()
    const aren = { ctpt: 'C_9H_12', nguyenTu: { C: 9, H: 12 }, K: 4, hoi: 'cau-tao', tong: 8, bang: { loai: 'aren', tieuDe: 'x', cot: [], hang: [{ phan: [3], soCach: [2], tich: 2 }, { phan: [1, 2], soCach: [1, 1], tich: 3 }, { phan: [1, 1, 1], soCach: [1, 1, 1], tich: 3 }] } }
    expect(docDongPhan(aren).loi).toBeNull()
  })
  it('bản Kính: tổng phải khớp đáp án kho; máy chủ đánh lệch khối sai, app chỉ bỏ khối', () => {
    const ban = { cotLoi: { chu: 'Bước 1 tính K, bước 2 lập mạch đại số.', chip: [] }, phim: [{ chu: 'Tính K = 1.' }, { chu: 'Mạch 4 và 3+1.' }, { chu: 'Cộng 4.' }],
      thanChu: [], lyDo: [], hayNham: [{ nghi: 'đếm cả vị trí đối xứng', dung: 'đối xứng chỉ tính một' }], tuHoi: { hoi: 'Vì sao?', tra: 'Vì đối xứng.' }, theNho: [{ truoc: 'Bước 1?', sau: 'Tính K' }],
      phepTinh: [{ ten: 'Tổng', bieuThuc: '2+1+1', ketQua: '4', laDapSo: true }], dongPhan: DP4 }
    const nguon = { thanChu: [], thayNoi: [], meo: [] }
    const dat = kiemBanKinh(ban, { phan: 'III', dapAn: '4', qid: 'q', nguon, chatDongPhan: true })
    expect(dat.ket).toBe('dat')
    expect(dat.ban?.dongPhan?.tong).toBe(4)
    const lechKho = kiemBanKinh({ ...ban, phepTinh: [{ ten: 'Tổng', bieuThuc: '2+1', ketQua: '3', laDapSo: true }], dongPhan: { ...DP4, hoi: 'cau-tao', tong: 3 } }, { phan: 'III', dapAn: '4', qid: 'q', nguon, chatDongPhan: true })
    expect(lechKho.ket).toBe('lech')
    const hong = { ...ban, dongPhan: { ...DP4, tong: 9 } }
    expect(kiemBanKinh(hong, { phan: 'III', dapAn: '4', qid: 'q', nguon, chatDongPhan: true }).ket).toBe('lech')
    const app = kiemBanKinh(hong, { phan: 'III', dapAn: '4', qid: 'q', nguon })
    expect(app.ket).toBe('dat')
    expect(app.ban?.dongPhan).toBeUndefined()
    // Phần I: phương án đúng là một số
    const p1 = kiemBanKinh({ ...ban, phepTinh: undefined, lyDo: ['A', 'B', 'C', 'D'].map((x) => ({ khoa: x, dung: x === 'C', chu: 'vì vậy' })) },
      { phan: 'I', dapAn: 'C', qid: 'q', nguon, chatDongPhan: true, luaChon: { A: '2', B: '3', C: '5', D: '6' } })
    expect(p1.ket).toBe('lech')
  })
  it('K hoa được dùng, k thường và «độ bất bão hoà» vẫn cấm', () => {
    expect(chuCam({ a: 'Bước 1 tính K = 1' })).toBeNull()
    expect(chuCam({ a: 'ta có k = 1' })).toMatch(/k thường/)
    expect(chuCam({ a: 'độ bất bão hoà bằng 1' })).toMatch(/bất bão hoà/)
  })
})
