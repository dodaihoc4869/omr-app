// GAME HÓA 2.0 · Đoàn Hộ Tống — BỐ CỤC NGANG (thầy chốt bản vẽ docs/ban-ve-ngang-2809, 28/09).
// jsdom không tính @media ⇒ kiểm (1) CẤU TRÚC hai cột mà CSS ngang dựa vào, (2) chính tệp CSS: đúng điểm ngắt, dọc không đổi (`display:contents`),
// chỉ nằm dưới `.dh2`, không hex thô. Cờ 2.0 tắt ⇒ không có cột nào (giao diện cũ y nguyên).
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { render, screen, cleanup, waitFor, configure } from '@testing-library/react'
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
import DoanHoTong from '../src/game/than-thu-v2/DoanHoTong'
import type { DoanXem } from '../src/game/than-thu-v2/doan-kieu'
import { HP_QUAI } from '../src/game/than-thu-v2/doan-core'

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(() => cleanup())

const em: DoanXem['ghe'][number] = { ghe: 0, ten: 'Minh', pet: 2, cap: 32, laMay: false, roi: false, laEm: true, trangThai: 'dang_lam', tinHieu: null }
const ban: DoanXem['ghe'][number] = { ghe: 1, ten: 'Lan', pet: 1, cap: 10, laMay: false, roi: false, laEm: false, trangThai: 'dang_lam', tinHieu: null }
const tran = (o: Partial<NonNullable<DoanXem['tran']>> = {}) => ({ tenChang: 'Đèo', hiep: 2, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 90, toiDa: 100 },
  quai: [{ ma: 1, loai: 'bun_acid', hp: 10 }, { ma: 2, loai: 'bun_acid', hp: 24 }], trumVoGiap: [], nangLuong: 0, daNhanTiepSuc: 0, giay: 40, moSauMs: 0, conMs: 30000,
  tenQuai: ['Bùn Acid', 'Khói'], loaiQuai: ['bun_acid', 'bun_acid'], tenTrum: ['Chúa tể Kết Tủa', 'y'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'], ...o }) as DoanXem['tran']
const deI = { qid: 'Q7', maDe: 'D', version: 'v', group: 'g', phan: 'I' as const, text: 'Muối thu được khi thuỷ phân ethyl acetate trong NaOH là', choices: ['C2H5ONa', 'HCOONa', 'CH3COONa', 'CH3ONa'], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Thuỷ phân ester', mucDo: 'biet', sao: 1, kienThuc: [] }
const deII = { ...deI, qid: 'Q9', phan: 'II' as const, text: 'Cho ethyl acetate tác dụng với NaOH.', choices: [], ideas: ['Tạo muối sodium acetate.', 'Thuận nghịch.', 'Tạo ethanol.', 'Cần 2 mol NaOH.'] }
const xemThuong = (): DoanXem => ({ ma: 'DH7', revision: 5, laChu: true, batDau: true, ghe: [em, ban], gioMayChu: 0, tran: tran(), cau: { qid: 'Q7', nhan: 'toi_han_on', de: deI } } as DoanXem)
const xemTrum = (): DoanXem => ({ ma: 'DH7', revision: 5, laChu: true, batDau: true, ghe: [em, ban], gioMayChu: 0, tran: tran({ hiep: 4, laTrum: true, quai: [], giay: 60 }),
  trum: { coCau: true, giaoY: [0, 1, 0, 1], yCuaEm: [0, 2], yDaChot: [false, false, false, false], qid: 'Q9', tenDang: 'Thuỷ phân ester', de: deII } } as DoanXem)

function dung(x: DoanXem, hoa2 = true) {
  sessionStorage.setItem('doan:S1', x.ma)
  const call = vi.fn(async (lenh: string) => {
    if (lenh === 'hoa2-sanh') return hoa2 ? { ok: true, cheDo2: true, doan: { con: 3 }, dao: { con: 10 } } : { ok: true, cheDo2: false }
    if (lenh === 'doan-xem') return { ok: true, doan: x }
    return { ok: true }
  })
  render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={vi.fn()} onVeBangNhiemVu={vi.fn()} />)
}
const man = () => document.querySelector('.dh') as HTMLElement

describe('Đoàn 2.0 · bố cục ngang: cấu trúc hai cột', () => {
  it('trong trận: cột trái = chiến trường (thanh hiệp, thần thú, đồng đội, quái); cột phải = câu + đòn + CHỐT ĐÒN, đúng thứ tự', async () => {
    dung(xemThuong())
    await screen.findByText('HCOONa')
    await waitFor(() => expect(man().className).toContain('dh2'))
    const khung = document.querySelector('.dh-khung.dh2-tran') as HTMLElement
    // 28/09: giữa hai cột có thanh kéo đổi độ rộng (role=separator)
    const [trai, keo, phai] = [...khung.children] as HTMLElement[]
    expect(trai.className).toContain('dh2-cot-trai'); expect(phai.className).toContain('dh2-cot-phai')
    expect(keo.className).toContain('dh2-keo'); expect(keo.getAttribute('role')).toBe('separator')
    expect(khung.children).toHaveLength(3)
    expect(trai.querySelector('[data-vung="canh-2"]')).toBeTruthy()
    expect(trai.textContent).toContain('HIỆP 2/8')
    expect(trai.querySelector('[aria-label="Đồng đội"]')?.textContent).toContain('Lan')
    expect(trai.querySelector('.bl-arena[data-thu="2"] canvas')).toBeTruthy() // thú em và bạn do sân diễn hoạt vẽ chung
    expect(trai.querySelector('.dh2-ban .dh-thu')).toBeTruthy()
    // Cột phải: thẻ câu → ba đòn → nút chốt (nút chính ở ĐÁY cột)
    const giay = phai.querySelector('.dh-giay')!, don = phai.querySelector('.dh-don')!, chot = screen.getByRole('button', { name: /CHỌN ĐÁP ÁN ĐỂ CHỐT ĐÒN/ })
    expect(phai.contains(chot)).toBe(true)
    expect(giay.compareDocumentPosition(don) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(don.compareDocumentPosition(chot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(don.textContent).toMatch(/Đánh.*Chắn/)
    expect(khung.className).not.toContain('dh2-tran-trum')
  })

  it('nhãn Máu từng quái có chữ + số đủ nhãn, nằm trong tranh (lớp trên hình, CSS ngang mới hiện)', async () => {
    dung(xemThuong())
    await screen.findByText('HCOONa')
    const ds = document.querySelector('[data-vung="mau-quai"]') as HTMLElement
    expect(ds).toBeTruthy()
    expect([...ds.querySelectorAll('li')].map(l => l.textContent)).toEqual([`Bùn Acid · Máu 10/${HP_QUAI}`, `Bùn Acid · Máu 24/${HP_QUAI}`])
    expect(ds.closest('.dh2-ve')).toBeTruthy()
  })

  it('hiệp trùm: khung mang lớp đảo cột (câu 4 ý sang trái), không có nhãn máu quái', async () => {
    dung(xemTrum())
    await screen.findByText('Tạo muối sodium acetate.')
    const khung = document.querySelector('.dh-khung.dh2-tran') as HTMLElement
    expect(khung.className).toContain('dh2-tran-trum')
    expect(khung.querySelector('.dh2-cot-phai')!.textContent).toContain('CÂU CHUNG CẢ ĐỘI')
    expect(document.querySelector('[data-vung="mau-quai"]')).toBeNull()
  })

  it('cờ 2.0 tắt: không bọc cột, không nhãn máu quái — giao diện cũ y nguyên', async () => {
    dung(xemThuong(), false)
    await screen.findByText('HCOONa')
    expect(man().className).not.toContain('dh2')
    expect(document.querySelector('.dh2-cot')).toBeNull()
    expect(document.querySelector('[data-vung="mau-quai"]')).toBeNull()
  })
})

describe('Đoàn 2.0 · bố cục ngang: tệp CSS', () => {
  const ngang = readFileSync('src/game/than-thu-v2/doan2/doan2-ngang.css', 'utf8')
  const doan2 = readFileSync('src/game/than-thu-v2/doan2/doan2.css', 'utf8')
  const hoTong = readFileSync('src/game/than-thu-v2/DoanHoTong.tsx', 'utf8')

  it('điểm ngắt đúng bản vẽ: ≥ 1024 px HOẶC xoay ngang ≥ 700 px; nạp SAU doan2.css', () => {
    expect(ngang).toContain('@media (min-width:1024px),(orientation:landscape) and (min-width:700px){')
    expect(ngang).toMatch(/grid-template-columns:minmax\(0,7fr\) minmax\(0,5fr\)/)
    expect(hoTong.indexOf("import './doan2/doan2-ngang.css'")).toBeGreaterThan(hoTong.indexOf("import './doan2/doan2.css'"))
  })

  it('màn dọc không đổi: cột bọc là display:contents ngoài @media; nhãn máu quái ẩn ở dọc', () => {
    expect(doan2).toMatch(/\.dh2-cot\{display:contents\}/)
    expect(doan2).toMatch(/\.dh2-nhan-quai\{display:none\}/)
    // thẻ câu vẫn gối lên mép cảnh ở màn dọc dù cảnh nằm trong cột bọc
    expect(doan2).toContain('.dh2-tran .dh2-cot-trai+.dh2-cot-phai>.dh-giay:first-child{position:relative;z-index:3;margin-top:-22px}')
  })

  it('mọi luật ngang nằm dưới .dh2 (cờ tắt ⇒ không hiệu lực), không hex thô, không cuộn trang ở màn chơi', () => {
    const luat = ngang.replace(/\/\*[\s\S]*?\*\//g, '').match(/[^{};]+\{[^{}]*\}/g) ?? []
    const boChon = luat.map(l => l.slice(0, l.indexOf('{')).trim()).filter(b => b && !/^(\d+%|from|to)$/.test(b) && !b.startsWith('@'))
    expect(boChon.length).toBeGreaterThan(20)
    for (const b of boChon) for (const phan of b.split(',')) expect(phan.trim(), phan).toMatch(/^\.dh2\s/)
    expect(ngang).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(ngang).toMatch(/\.dh2 \.dh2-tran \.dh2-cot-phai>\.dh-giay\{flex:0 1 auto;min-height:0\}/) // 28/09: câu ngắn ôm nội dung; dài thì co bằng cột và cuộn bên trong
  })
})
