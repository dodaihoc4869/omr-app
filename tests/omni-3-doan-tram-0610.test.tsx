// TRẠM HỒI PHỤC · ĐOÀN MỘT MÌNH (thầy 06/10: "Làm sai 3 câu liên tiếp có cho vào trạm hồi phục không? Tôi làm thử chiến dịch sai 3 câu liên tiếp trong đoàn không thấy về trạm hồi phục").
// Đặc tả gốc: "chuyến Đảo / chặng Đoàn MỘT MÌNH" có Trạm (Đoàn nhiều người không). Máy chủ chỉ trả `omni.tram` khi phòng còn một người thật và có câu nền; máy em vẽ thẻ Trạm
// ngay dưới kết quả câu (quãng nghỉ, hiệp kế chờ "ĐÁNH TIẾP"), nút "Làm 3 câu nền" mở ĐÚNG hộp câu nền sẵn có (`/hs/luyen-nen`). KHÔNG gọi `hoa2-omni-tram-xong` (Đoàn không đổi ải kế).
// Vắng `omni.tram` ⇒ DOM y hệt hôm nay. Chữ dựng bằng CHÍNH hằng của src/lib/omni-chu.ts.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen, fireEvent, cleanup, waitFor, configure, within } from '@testing-library/react'
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
vi.mock('../src/lib/loi-giai-api', async (goc) => ({ ...(await goc<typeof import('../src/lib/loi-giai-api')>()), luyenNen: vi.fn(async () => ({ ok: true, ten: 'Cân bằng hệ số', cau: [] })) }))
import DoanHoTong from '../src/game/than-thu-v2/DoanHoTong'
import type { DoanXem } from '../src/game/than-thu-v2/doan-kieu'
import { luyenNen } from '../src/lib/loi-giai-api'
import { NUT_LAM_CAU_NEN, TIEU_DE_TRAM, chuTram } from '../src/lib/omni-chu'

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(() => { cleanup(); vi.clearAllMocks() })

const ghe: DoanXem['ghe'] = [
  { ghe: 0, ten: 'Minh', pet: 2, cap: 32, laMay: false, roi: false, laEm: true, trangThai: 'dang_lam', tinHieu: null },
  { ghe: 1, ten: 'Thu Hà', pet: 1, cap: 30, laMay: false, roi: false, laEm: false, trangThai: 'da_chot', tinHieu: null },
]
const tran = { tenChang: 'Đèo Hoàng Hôn', hiep: 3, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 80, toiDa: 100 }, quai: [{ ma: 5, loai: 'bun_acid', hp: 9 }], trumVoGiap: [],
  nangLuong: 2, daNhanTiepSuc: 0, giay: 40, moSauMs: 0, conMs: 26000, tenQuai: ['Bùn Acid', 'Khói Oxi Hoá'], loaiQuai: ['bun_acid', 'khoi_oxi_hoa'], tenTrum: ['Chúa tể Kết Tủa', 'Bá chủ Ăn Mòn'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'] } as DoanXem['tran']
const deI = { qid: 'Q1', maDe: 'D', version: 'v', group: 'g', phan: 'I' as const, text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng NaOH dư. Khối lượng muối là', choices: ['4,1 gam', '8,2 gam', '9,6 gam', '6,8 gam'], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Thuỷ phân ester', mucDo: 'hieu', sao: 2, kienThuc: [] }
const deIII = { ...deI, qid: 'Q3', phan: 'III' as const, text: 'Tính khối lượng muối thu được (gam).', choices: [] }
const xem = (de: typeof deI, o: Partial<DoanXem> = {}): DoanXem => ({ ma: 'DH2', revision: 5, laChu: true, batDau: true, ghe, gioMayChu: 0, tran, cau: { qid: de.qid, nhan: 'toi_han_on', de } as DoanXem['cau'], ...o })
const OMNI = { bat: true, baiDangLuyen: [], dangVung: { a: 0, b: 0 }, conDangDe8: null, sEm: null, sMucTieu: 0.07, chungChi: [], ve: { con: 2, tong: 2 }, choBaiMoi: false, onBaiCu: 0, metGio: null, nhatKy: null, deThu: { duoc: false, soCau: 14, phut: 25 } }
const omniKq = (o: object) => ({ nhanTocDo: 'thuong', msLam: 40_000, msKyVong: 60_000, luot: false, chacMaSai: false, loiNhan: null, ...o })


const TRAM = { vkn: 'nen:cb', ten: 'Cân bằng hệ số', tenLoi: 'cân bằng hệ số', nhan: 'can_bang', coCauNen: true, chu: chuTram('cân bằng hệ số', true) }

function dung(o: { omni?: object; omniKq?: object } = { omni: OMNI }) {
  const de = deI
  const x = xem(de)
  sessionStorage.setItem('doan:S1', x.ma)
  const call = vi.fn(async (lenh: string, _b: Record<string, unknown> = {}) => lenh === 'hoa2-sanh' ? { ok: true, cheDo2: true, doan: { con: 4 }, dao: { con: 28 }, ...(o.omni ? { omni: o.omni } : {}) }
    : lenh === 'doan-xem' ? { ok: true, doan: x }
      : lenh === 'doan-nop' ? { ok: true, doan: xem(de, { revision: 6, cau: { qid: de.qid, daChot: true, hanhDong: 'danh', ketQua: null } }),
        ketQuaCau: { correct: false, answer: 'B', solution: { chot: 'Muối là CH3COONa' } }, omni: omniKq(o.omniKq ?? {}) }
        : { ok: true })
  render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={vi.fn()} onVeBangNhiemVu={vi.fn()} />)
  return { call, goi: (lenh: string) => call.mock.calls.filter(c => c[0] === lenh).map(c => c[1] as Record<string, unknown>) }
}
const man = () => document.querySelector('.dh') as HTMLElement
const coThe = () => document.querySelector('[data-khoi="tram-hoi-phuc"]') as HTMLElement | null
async function vaoDoan() {
  await waitFor(() => expect(man().className).toContain('dh2'))
  await new Promise(r => setTimeout(r, 20))
}
async function chotSai() {
  await screen.findByText('8,2 gam')
  await vaoDoan()
  fireEvent.click(await screen.findByRole('button', { name: /9,6 gam/ }))
  fireEvent.click(await screen.findByRole('button', { name: /CHỐT ĐÒN ĐÁNH/ }))
  await screen.findByText('Chưa đúng — em xem lời giải để sửa câu này.')
}

describe('Đoàn một mình · thẻ Trạm hồi phục', () => {
  it('omni.tram có câu nền ⇒ thẻ đủ chữ máy chủ ngay dưới kết quả câu (trong thẻ câu, ngoài hộp kết quả); nút mở ĐÚNG hộp câu nền; đóng hộp ⇒ hết nút; KHÔNG gọi tram-xong', async () => {
    const m = dung({ omni: OMNI, omniKq: { tram: TRAM } })
    await chotSai()
    const the = await waitFor(() => { const t = coThe(); expect(t).toBeTruthy(); return t! })
    expect(within(the).getByText(TIEU_DE_TRAM)).toBeTruthy()
    expect(the.textContent).toContain(TRAM.chu)
    expect(the.textContent).not.toMatch(/nen:|dang:|vi kỹ năng/i)
    expect(the.closest('.dh-giay')).toBeTruthy()
    expect(the.closest('.dh-ket-qua-cau')).toBeNull()
    expect([...the.querySelectorAll('button')].map(b => b.textContent)).toEqual([NUT_LAM_CAU_NEN])
    expect(the.querySelector('button')!.className).toBe('dh-xin') // chip sẵn có của Đoàn
    fireEvent.click(within(the).getByRole('button', { name: NUT_LAM_CAU_NEN }))
    const hop = await screen.findByRole('dialog', { name: /Luyện kiến thức nền/ })
    expect(luyenNen).toHaveBeenCalledWith('can_bang')
    expect(hop.closest('.dh-tram-hop')).toBeTruthy() // cổng ra body, nâng trên lớp phủ Đoàn
    fireEvent.click(within(hop).getByRole('button', { name: 'Đóng' }))
    await waitFor(() => expect(within(the).queryByRole('button', { name: NUT_LAM_CAU_NEN })).toBeNull())
    expect(screen.queryByRole('dialog', { name: /Luyện kiến thức nền/ })).toBeNull()
    expect(m.goi('hoa2-omni-tram-xong')).toHaveLength(0) // Đoàn không đổi ải kế
    expect(m.goi('doan-nop')).toHaveLength(1)
  })

  it('vắng omni.tram ⇒ KHÔNG thẻ Trạm (DOM y hệt hôm nay)', async () => {
    dung({ omni: OMNI, omniKq: {} })
    await chotSai()
    expect(coThe()).toBeNull()
    expect(screen.queryByText(TIEU_DE_TRAM)).toBeNull()
  })

  it('omni.tram không có câu nền (coCauNen false) ⇒ máy em không dựng thẻ (Đoàn không đổi được ải kế, thẻ sẽ hứa suông)', async () => {
    dung({ omni: OMNI, omniKq: { tram: { ...TRAM, nhan: null, coCauNen: false, chu: chuTram('cân bằng hệ số', false) } } })
    await chotSai()
    expect(coThe()).toBeNull()
  })

  it('OMNI tắt ở hoa2-sanh ⇒ không đọc omni của kết quả, không thẻ', async () => {
    dung({ omniKq: { tram: TRAM } })
    await screen.findByText('8,2 gam')
    await vaoDoan()
    fireEvent.click(await screen.findByRole('button', { name: /9,6 gam/ }))
    fireEvent.click(await screen.findByRole('button', { name: /CHỐT ĐÒN ĐÁNH/ }))
    await screen.findByText('Chưa đúng — em xem lời giải để sửa câu này.')
    expect(coThe()).toBeNull()
  })
})

describe('CSS thẻ Trạm ở Đoàn', () => {
  const css = readFileSync(resolve(__dirname, '../src/game/than-thu-v2/doan2/doan2.css'), 'utf8')
  const doanCss = readFileSync(resolve(__dirname, '../src/game/than-thu-v2/doan.css'), 'utf8')
  const khoi = css.slice(css.indexOf('THẺ TRẠM HỒI PHỤC Ở ĐOÀN MỘT MÌNH'))
  it('nút Trạm trên thẻ giấy: màu CHỈ qua biến (không #hex, không rgb/rgba thô) + chữ mực', () => {
    expect(khoi.length).toBeGreaterThan(200)
    expect(khoi).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(khoi).not.toMatch(/rgba?\(/)
    expect(khoi).toMatch(/\.dh-tram button\.dh-xin\[type=button\]\{[^}]*background:var\(--the-2\)[^}]*color:var\(--muc\)/)
  })
  it('hộp câu nền nằm TRÊN lớp phủ Đoàn (z-index lớn hơn của `.dh`)', () => {
    const zDoan = Number(/\.dh\b[^{]*\{[^}]*z-index:(\d+)/.exec(doanCss)?.[1])
    const zHop = Number(/\.dh-tram-hop \.lg-hop-nen\{z-index:(\d+)\}/.exec(khoi)?.[1])
    expect(zDoan).toBeGreaterThan(1_000_000)
    expect(zHop).toBeGreaterThan(zDoan)
  })
})
