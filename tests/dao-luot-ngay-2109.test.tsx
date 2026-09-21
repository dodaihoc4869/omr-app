// ĐỢT 2 THẦN THÚ MỖI NGÀY · MÀN (Code 2; Boss 21/09): DẢI LƯỢT trong ngày (đọc `luot` của máy chủ: đã đi · lượt kế · chưa tới · Lượt trùm · cách mở thêm lượt), MÀN HẾT LƯỢT "Mai {tên thú} chờ em: N dạng mới · M câu tới hạn ôn",
// nhãn ải theo `roleV2` (Dạng mới / Lượt trùm). Màn chỉ ĐỌC và nói: không tự tính lượt; máy chủ cũ (không gửi luot) ⇒ không dải, nút vẫn LÊN ĐƯỜNG.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import DaoCuaEm from '../src/game/than-thu-v2/dao/DaoCuaEm'
import { chuLuotConLai, chuMaiCho, chuMoThemLuot, docLuotNgay, docMaiCho, nhanLuot, tenNhomAi, trangLuot } from '../src/game/than-thu-v2/dao/dao-core'
import type { DaoProfile } from '../src/game/than-thu-v2/dao/kieu'

afterEach(cleanup)
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const hoSo = (them: Partial<DaoProfile> = {}): DaoProfile => ({ nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 34, exp: 640, wallet: 0, mastery: [], ...them })
const LUOT = {
  tongLuotMo: 5, daLam: 2, conLai: 3, tran: 6, tongCauToiDa: 36,
  danhSach: [{ so: 1, loai: 'khoi_dong', thuong: false }, { so: 2, loai: 'kham_pha', thuong: false }, { so: 3, loai: 'kham_pha', thuong: false }, { so: 4, loai: 'kham_pha', thuong: true }, { so: 5, loai: 'trum', thuong: true }],
  luotTiepTheo: { so: 3, loai: 'kham_pha', thuong: false },
  khoa: [{ ma: 'chang', daMo: true, moKhi: 'Em xong chặng bài tập về nhà của hôm nay' }, { ma: 'dat', daMo: false, moKhi: 'Em đạt nhiệm vụ ngày' }, { ma: 'trum', daMo: true, moKhi: 'Em đúng từ 80 % trong ít nhất 12 câu thần thú hôm nay (hôm nay 12/12 câu)' }], // KHỚP LUẬT MÁY CHỦ: danhSach có lượt trùm ⇒ khoá trùm đã mở
}
const HET = { ...LUOT, daLam: 5, conLai: 0, luotTiepTheo: null }
const nhan = <T,>(o: T): T => JSON.parse(JSON.stringify(o))
const ve = (them: Partial<DaoProfile> = {}, props: Record<string, unknown> = {}) => render(<DaoCuaEm profile={hoSo(them)} onLenDuong={() => {}} {...(props as object)} />)

describe('docLuotNgay / docMaiCho — đọc chặt', () => {
  it('thân đúng ⇒ LuotNgay; luotTiepTheo null hợp lệ (hết lượt); khoá có moKhi', () => {
    const l = docLuotNgay(LUOT)!
    expect(l).toMatchObject({ tongLuotMo: 5, daLam: 2, conLai: 3, tran: 6 })
    expect(l.danhSach).toHaveLength(5)
    expect(l.luotTiepTheo).toEqual({ so: 3, loai: 'kham_pha', thuong: false })
    expect(l.khoa.map((k) => [k.ma, k.daMo])).toEqual([['chang', true], ['dat', false], ['trum', true]])
    expect(docLuotNgay(HET)!.luotTiepTheo).toBeNull()
  })
  it('sai dạng ⇒ null (ẩn dải): không phải đối tượng, thiếu số, số âm/lẻ, tongLuotMo > tran, danh sách rỗng/loại lạ', () => {
    for (const x of [null, undefined, 'x', [], {}, { ...LUOT, conLai: -1 }, { ...LUOT, daLam: 1.5 }, { ...LUOT, tongLuotMo: 9 }, { ...LUOT, tran: 0 }, { ...LUOT, danhSach: [] }, { ...LUOT, danhSach: [{ so: 1, loai: 'la', thuong: false }] }, { ...LUOT, tongLuotMo: undefined }]) expect(docLuotNgay(x), JSON.stringify(x)).toBeNull()
  })
  it('khoá lạ / thiếu moKhi bị bỏ (không in chữ rỗng); danh sách cắt theo trần; số câu tối đa thiếu ⇒ 0', () => {
    const l = docLuotNgay({ ...LUOT, khoa: [{ ma: 'la', daMo: false, moKhi: 'x' }, { ma: 'dat', daMo: false, moKhi: '   ' }, { ma: 'dat', daMo: false, moKhi: 'Em đạt nhiệm vụ ngày' }], tongCauToiDa: undefined })!
    expect(l.khoa).toHaveLength(1)
    expect(l.tongCauToiDa).toBe(0)
    const nhieu = nhan(LUOT)
    nhieu.danhSach = Array.from({ length: 9 }, (_, i) => ({ so: i + 1, loai: 'kham_pha', thuong: false }))
    expect(docLuotNgay(nhieu)!.danhSach).toHaveLength(6)
  })
  it('docMaiCho: hai số nguyên ≥ 0; thiếu / sai ⇒ null', () => {
    expect(docMaiCho({ dangMoi: 3, toiHan: 4 })).toEqual({ dangMoi: 3, toiHan: 4 })
    expect(docMaiCho({ dangMoi: 0, toiHan: 0 })).toEqual({ dangMoi: 0, toiHan: 0 })
    for (const x of [null, {}, { dangMoi: 3 }, { dangMoi: -1, toiHan: 1 }, { dangMoi: 1.5, toiHan: 1 }, [], 'x']) expect(docMaiCho(x), JSON.stringify(x)).toBeNull()
  })
})

describe('chữ thuần', () => {
  it('chuLuotConLai · trangLuot · nhanLuot · chuMoThemLuot · chuMaiCho', () => {
    const l = docLuotNgay(LUOT)!
    expect(chuLuotConLai(l)).toBe('Hôm nay còn 3 trên 5 lượt')
    expect(chuLuotConLai(docLuotNgay(HET)!)).toBe('Hôm nay em đã dùng hết 5 lượt')
    expect([1, 2, 3, 4, 5].map((n) => trangLuot(l, n))).toEqual(['xong', 'xong', 'tiep', 'cho', 'cho'])
    expect(nhanLuot({ so: 5, loai: 'trum', thuong: true })).toBe('Lượt trùm')
    expect(nhanLuot({ so: 4, loai: 'kham_pha', thuong: true })).toBe('Lượt thưởng 4')
    expect(nhanLuot({ so: 2, loai: 'kham_pha', thuong: false })).toBe('Lượt 2')
    expect(chuMoThemLuot({ moKhi: 'Em đạt nhiệm vụ ngày' })).toBe('Mở thêm 1 lượt khi em đạt nhiệm vụ ngày')
    expect(chuMaiCho('Lửa Nhỏ', { dangMoi: 3, toiHan: 4 })).toBe('Mai Lửa Nhỏ chờ em: 3 dạng mới · 4 câu tới hạn ôn.')
    expect(chuMaiCho('Lửa Nhỏ', { dangMoi: 0, toiHan: 4 })).toBe('Mai Lửa Nhỏ chờ em: 4 câu tới hạn ôn.')
    expect(chuMaiCho('Lửa Nhỏ', { dangMoi: 2, toiHan: 0 })).toBe('Mai Lửa Nhỏ chờ em: 2 dạng mới.')
    expect(chuMaiCho('Lửa Nhỏ', null)).toBe('Mai Lửa Nhỏ chờ em.')
    expect(chuMaiCho('Lửa Nhỏ', { dangMoi: 0, toiHan: 0 })).toBe('Mai Lửa Nhỏ chờ em.')
  })
  it('tenNhomAi: vai mới "moi" = Dạng mới, "trum" = Lượt trùm; vai cũ giữ tên; lạ/vắng = Luyện đều', () => {
    expect(tenNhomAi('moi')).toBe('Dạng mới')
    expect(tenNhomAi('trum')).toBe('Lượt trùm')
    expect(tenNhomAi('yeu')).toBe('Sửa lỗi')
    expect(tenNhomAi('thu_thach')).toBe('Trùm ải')
    expect(tenNhomAi(undefined)).toBe('Luyện đều')
    expect(tenNhomAi('gi_do')).toBe('Luyện đều')
  })
})

describe('DaoCuaEm — dải lượt + màn hết lượt', () => {
  it('có luot: dải "Hôm nay còn 3 trên 5 lượt", 5 ô (2 đã đi · 1 lượt kế · 2 chưa tới), Lượt trùm có nhãn, cách MỞ THÊM lượt chỉ cho khoá chưa mở; nút vẫn LÊN ĐƯỜNG', () => {
    const { container } = ve({}, { luotNgay: docLuotNgay(LUOT) })
    const d = container.querySelector('[data-vung="luot-ngay"]') as HTMLElement
    expect(d.querySelector('.dao-luot-chu')!.textContent).toBe('Hôm nay còn 3 trên 5 lượt')
    const o = [...d.querySelectorAll('.dao-luot-ds li')]
    expect(o.map((x) => x.getAttribute('data-trang'))).toEqual(['xong', 'xong', 'tiep', 'cho', 'cho'])
    expect(o[2]!.getAttribute('aria-label')).toBe('Lượt 3: lượt kế tiếp')
    expect(o[4]!.getAttribute('aria-label')).toBe('Lượt trùm: chưa tới')
    expect(o[4]!.textContent).toContain('Trùm')
    expect(o[3]!.textContent).toContain('Thưởng')
    const mo = [...d.querySelectorAll('.dao-luot-mo')].map((p) => p.textContent)
    expect(mo).toEqual(['Mở thêm 1 lượt khi em đạt nhiệm vụ ngày.']) // chỉ khoá 'dat' chưa mở
    expect(d.querySelector('.dao-luot-mo[data-ma="chang"]')).toBeNull() // khoá đã mở ⇒ không nhắc
    expect(d.querySelector('.dao-luot-mo[data-ma="trum"]')).toBeNull() // luật máy chủ: lượt trùm CHỈ có trong danh sách khi khoá trùm đã mở ⇒ hết nhắc
    expect(container.querySelector('[data-vung="het-luot"]')).toBeNull()
    expect(screen.getByRole('button', { name: 'LÊN ĐƯỜNG' })).toBeTruthy()
  })
  it('HẾT LƯỢT: dải nói "Hôm nay em đã dùng hết 5 lượt", thẻ chỉ "Mai Lửa Nhỏ chờ em: 3 dạng mới · 4 câu tới hạn ôn."; nút mờ "HẾT LƯỢT HÔM NAY"; chưa có maiCho ⇒ "Mai Lửa Nhỏ chờ em."', () => {
    const a = ve({}, { luotNgay: docLuotNgay(HET), maiCho: docMaiCho({ dangMoi: 3, toiHan: 4 }) })
    const het = a.container.querySelector('[data-vung="het-luot"]') as HTMLElement
    expect(het.getAttribute('role')).toBe('status')
    expect(het.textContent).not.toContain('đã dùng hết lượt') // không lặp câu của dải
    expect(het.textContent).toContain('Mai Lửa Nhỏ chờ em: 3 dạng mới · 4 câu tới hạn ôn.')
    const nut = screen.getByRole('button', { name: 'HẾT LƯỢT HÔM NAY' }) as HTMLButtonElement
    expect(nut.disabled).toBe(true)
    expect(a.container.querySelector('.dao-chuyen-ta')!.textContent).not.toContain('200 câu') // hết LƯỢT ≠ hết 200 câu
    expect(a.container.querySelector('.dao-luot-chu')!.textContent).toBe('Hôm nay em đã dùng hết 5 lượt')
    a.unmount()
    const b = ve({}, { luotNgay: docLuotNgay(HET) })
    expect(b.container.querySelector('[data-vung="het-luot"] p')!.textContent).toBe('Mai Lửa Nhỏ chờ em.')
  })
  it('MÁY CHỦ CŨ (không luot): không dải lượt, không thẻ hết lượt; nút LÊN ĐƯỜNG bấm được; thú tên loài khi không có biệt danh', () => {
    const { container } = ve({}, {})
    expect(container.querySelector('[data-vung="luot-ngay"]')).toBeNull()
    expect(container.querySelector('[data-vung="het-luot"]')).toBeNull()
    expect((screen.getByRole('button', { name: 'LÊN ĐƯỜNG' }) as HTMLButtonElement).disabled).toBe(false)
    cleanup()
    const t = ve({ nickname: '' }, { luotNgay: docLuotNgay(HET) })
    expect(t.container.querySelector('[data-vung="het-luot"] p')!.textContent).toMatch(/^Mai .+ chờ em\.$/)
  })
  it('không chữ cũ "200 câu" cho lượt; không EXP/khiên trong dải; không emoji', () => {
    const { container } = ve({}, { luotNgay: docLuotNgay(LUOT) })
    const d = container.querySelector('[data-vung="luot-ngay"]')!.textContent!
    expect(d).not.toMatch(/EXP|khiên|\b200\b/)
    expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(d)).toBe(false)
  })
})

describe('khoá nguồn', () => {
  it('DaoThanThu đọc luot/maiCho từ recommendations và start bằng docLuotNgay/docMaiCho (máy chủ cũ: undefined ⇒ không đổi); ThamHiem gọi tenNhomAi(roleV2 ?? role)', () => {
    const d = doc('src/game/than-thu-v2/dao/DaoThanThu.tsx')
    expect(d).toContain('if(r.luot!==undefined)setLuotNgay(docLuotNgay(r.luot))')
    expect(d).toContain('if(s.luot!==undefined)setLuotNgay(docLuotNgay(s.luot));if(s.maiCho!==undefined)setMaiCho(docMaiCho(s.maiCho))')
    expect(d).toContain('luotNgay={luotNgay} maiCho={maiCho}')
    const t = doc('src/game/than-thu-v2/dao/ThamHiem.tsx')
    expect(t).toContain('tenNhomAi(c.roleV2??c.role)')
    expect(t).toContain('tenNhomAi(q.roleV2??q.role)')
    expect(doc('src/game/than-thu-v2/dao/dao.css')).toMatch(/\.dao \.dao-luot-ds li\[data-trang="tiep"\] b\{/)
  })
})
