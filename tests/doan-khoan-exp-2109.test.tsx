// ĐỢT 2 THẦN THÚ · MÀN KẾT CHUYẾN ĐOÀN HỘ TỐNG có TỪNG KHOẢN EXP (Điều 9: "Thắng chuyến 3 sao +15 EXP", "Vỡ giáp 2 trùm +6 EXP", "Tiếp sức 2 lần +10 EXP"; đủ trần ⇒ "+0 EXP · hôm nay em đã đủ 120 EXP từ game. Muốn {tên thú} ăn no thì làm bài tập về nhà hoặc phần ôn lại.").
// Máy chủ gửi doan.ketChang.expChang (chỉ-thêm); máy cũ không gửi ⇒ ô "EXP vào ví" cũ. Nhãn dựng từ `loai` + số (không in ghiChu của máy chủ: còn chữ "chặng"). Thuần + màn thật.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import DoanKetChang from '../src/game/than-thu-v2/DoanKetChang'
import { chuDuTran, coKhoanBiCat, dongKhoanExp, tongKhoanExp } from '../src/game/than-thu-v2/doan-khoan-exp'

afterEach(cleanup)
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

const ketChang = (them: Record<string, unknown> = {}) => ({
  thang: true, sao: 3, linhTam: { hp: 8, toiDa: 10 }, trumVoGiap: [true, true, false], quaiHaGuc: 14, soLienKich: 2,
  cuaEm: { soLanGiup: 2, soLanGiupThanhCong: 1 }, tienBo: { tuLamDung: 7, soCau: 9, lenBac: null, duocGiup: 0 }, doanLop: null, anThach: null, ban: [], ...them,
})
const xem = (k: Record<string, unknown>) => ({ ghe: [{ ghe: 0, ten: 'Em', pet: 0, cap: 5, laMay: false, roi: false, laEm: true, trangThai: 'san_sang', tinHieu: null }], ketChang: k }) as never
const ve = (k: Record<string, unknown>, expNhan = 0) => render(<DoanKetChang xem={xem(k)} expNhan={expNhan} ve={2} onVe={() => {}} onDiTiep={() => {}} ban={false} />)
const dongCua = (c: HTMLElement) => [...c.querySelectorAll('.dh-khoan li')].map((l) => l.textContent)

describe('dongKhoanExp — hàm thuần', () => {
  it('gộp ≤ 3 dòng từ loai + số: chuyến, giáp, tiếp sức (n lần = số dòng tiepsuc); nhãn có số sao / số trùm', () => {
    const ds = [{ loai: 'doan_chang', exp: 15, ghiChu: 'Thắng chặng 3 sao +15 EXP' }, { loai: 'doan_giap', exp: 6, ghiChu: '' }, { loai: 'tiepsuc', exp: 5, ghiChu: '' }, { loai: 'tiepsuc', exp: 5, ghiChu: '' }]
    const d = dongKhoanExp(ds, 3, 2)
    expect(d.map((x) => `${x.nhan} +${x.exp}`)).toEqual(['Thắng chuyến 3 sao +15', 'Vỡ giáp 2 trùm +6', 'Tiếp sức 2 lần +10'])
    expect(tongKhoanExp(d)).toBe(31)
    expect(JSON.stringify(d)).not.toMatch(/chặng/) // không lấy chữ của máy chủ
    // hai dòng cùng loại (chưa gặp thật, khoá sổ chống trùng) vẫn cộng dồn chứ không ghi đè
    expect(dongKhoanExp([{ loai: 'doan_chang', exp: 10, ghiChu: '' }, { loai: 'doan_chang', exp: 5, ghiChu: '' }], 2, 0)[0]!.exp).toBe(15)
  })
  it('sạch dữ liệu: không phải mảng / phần tử lạ / loại lạ / số âm, chữ, NaN ⇒ bỏ; vắng ⇒ []; khoản 0 giữ (đủ trần)', () => {
    for (const v of [undefined, null, 'x', 5, {}, []]) expect(dongKhoanExp(v, 3, 1)).toEqual([])
    expect(dongKhoanExp([null, 7, 'x', { loai: 'la', exp: 9 }, { loai: 'doan_chang', exp: -4 }, { loai: 'doan_giap', exp: 'x' }, { loai: 'tiepsuc', exp: NaN }], 2, 1).map((x) => `${x.ma}:${x.exp}`)).toEqual(['chuyen:0', 'giap:0', 'tiep-suc:0'])
    const d = dongKhoanExp([{ loai: 'doan_chang', exp: 0, ghiChu: '' }], 1, 0)
    expect(d).toEqual([{ ma: 'chuyen', nhan: 'Thắng chuyến 1 sao', exp: 0 }])
    expect(coKhoanBiCat(d)).toBe(true)
    expect(coKhoanBiCat([{ ma: 'chuyen', nhan: 'x', exp: 15 }])).toBe(false)
    expect(dongKhoanExp([{ loai: 'doan_chang', exp: 9_999_999_999 }], 3, 0)[0]!.exp).toBe(100_000) // kẹp
    expect(dongKhoanExp([{ loai: 'doan_chang', exp: 15 }], 9, 0)[0]!.nhan).toBe('Thắng chuyến 3 sao') // sao kẹp 1–3
  })
  it('câu đủ trần nêu đúng số 120 và tên thú; không tên ⇒ "thần thú"', () => {
    expect(chuDuTran('Viêm Sư')).toBe('hôm nay em đã đủ 120 EXP từ game. Muốn Viêm Sư ăn no thì làm bài tập về nhà hoặc phần ôn lại.')
    expect(chuDuTran('')).toContain('Muốn thần thú ăn no')
  })
})

describe('DoanKetChang — từng khoản EXP', () => {
  it('có expChang: từng khoản có nhãn + số, tổng cộng; KHÔNG còn ô "EXP vào ví" trùng; Liên Kích giữ', () => {
    const { container } = ve(ketChang({ expChang: [{ loai: 'doan_chang', exp: 15, ghiChu: '' }, { loai: 'doan_giap', exp: 6, ghiChu: '' }, { loai: 'tiepsuc', exp: 5, ghiChu: '' }, { loai: 'tiepsuc', exp: 5, ghiChu: '' }] }), 26)
    expect(dongCua(container)).toEqual(['Thắng chuyến 3 sao+15 EXP', 'Vỡ giáp 2 trùm+6 EXP', 'Tiếp sức 2 lần+10 EXP'])
    expect(container.querySelector('.dh-khoan-tong')!.textContent).toBe('Tổng cộng+31 EXP')
    expect(container.textContent).not.toContain('EXP vào ví thần thú')
    expect(container.querySelector('[data-vung="khoan-du-tran"]')).toBeNull()
    expect(container.textContent).toContain('lần Liên Kích của cả đội')
    expect(container.textContent).not.toMatch(/chặng/i)
  })
  it('có khoản bị cắt về 0 (đủ trần 120/ngày): câu nói thật với tên thú của em; tổng 0', () => {
    const { container } = ve(ketChang({ expChang: [{ loai: 'doan_chang', exp: 0, ghiChu: '' }, { loai: 'doan_giap', exp: 0, ghiChu: '' }] }))
    expect(dongCua(container)).toEqual(['Thắng chuyến 3 sao+0 EXP', 'Vỡ giáp 2 trùm+0 EXP'])
    expect(container.querySelector('[data-vung="khoan-du-tran"]')!.textContent).toBe('+0 EXP · hôm nay em đã đủ 120 EXP từ game. Muốn Thạch Quy ăn no thì làm bài tập về nhà hoặc phần ôn lại.')
  })
  it('máy chủ cũ (không expChang) hoặc rỗng/sai dạng ⇒ giữ ô "EXP vào ví thần thú" như trước; không EXP không Liên Kích ⇒ không mục Phần thưởng', () => {
    for (const v of [undefined, [], 'x', [{ loai: 'la', exp: 9 }]]) {
      const { container, unmount } = ve(ketChang({ expChang: v }), 12)
      expect(container.querySelector('.dh-khoan')).toBeNull()
      expect(container.textContent).toContain('EXP vào ví thần thú')
      unmount()
    }
    const { container } = ve(ketChang({ soLienKich: 0 }), 0)
    expect(container.querySelector('[aria-label="Phần thưởng"]')).toBeNull()
  })
  it('khoá nguồn: nhãn dựng từ loai + số, KHÔNG in ghiChu của máy chủ; CSS khoản nằm ở doan.css với tiền tố dh-khoan; không màu thô', () => {
    const tsx = doc('src/game/than-thu-v2/DoanKetChang.tsx')
    expect(tsx).not.toMatch(/ghiChu/)
    const css = doc('src/game/than-thu-v2/doan.css')
    expect(css).toMatch(/\.dh-khoan\{/)
    expect(css).toMatch(/\.dh-khoan-tong\{/)
    expect(doc('src/game/than-thu-v2/doan-khoan-exp.ts').replace(/\/\/.*$/gm, '')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    // không va chạm: `.dh-khoan*` chỉ được định nghĩa ở doan.css (bài học hotfix P0 — tiền tố riêng, kiểm mỗi lần)
    const duyet = (d: string): string[] => fs.readdirSync(path.join(process.cwd(), d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === 'node_modules' || e.name === 'graphify-out' ? [] : duyet(`${d}/${e.name}`)) : e.name.endsWith('.css') ? [`${d}/${e.name}`] : []))
    const co = duyet('src').filter((f) => /\.dh-khoan(?![\w-]*\w)|\.dh-khoan-/.test(doc(f).replace(/\/\*[\s\S]*?\*\//g, '')))
    expect(co).toEqual(['src/game/than-thu-v2/doan.css'])
  })
})
