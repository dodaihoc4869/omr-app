// OMNI 3 · ĐẢO 2.0 PHÍA HỌC SINH (làn C2, 05/10) — hợp đồng docs/hop-dong-omni-3.md mục A.
// Chỉ khi `hoa2-sanh` có `omni`: `answer` thêm `msLam` (+ `tuTin:'chua_chac'` khi chip bật); chip "Chưa chắc" cạnh chip Trợ giúp, đặt lại mỗi câu,
// gợi ý một lần mỗi ngày; kết quả có `omni.loiNhan` ⇒ một dòng nhỏ; `chacMaSai` ⇒ khối lời giải tự mở vào tầm mắt; lướt / vé thử thách ⇒ KHÔNG trừ Máu;
// Trạm hồi phục mở hộp câu nền sẵn có rồi gọi `hoa2-omni-tram-xong`, thay đúng ải; đề thử không lộ đáp án trước khi nộp. Cờ tắt ⇒ y hệt cũ.
// Chữ mong đợi dựng bằng CHÍNH hàm/hằng của src/lib/omni-chu.ts.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure, within } from '@testing-library/react'
vi.mock('../src/lib/loi-giai-api', async (goc) => ({ ...(await goc<typeof import('../src/lib/loi-giai-api')>()), luyenNen: vi.fn(async () => ({ ok: true, ten: 'Cân bằng hệ số', cau: [] })) }))
import Dao2 from '../src/game/than-thu-v2/dao2/Dao2'
import { CHU_MIEN_MAU } from '../src/game/than-thu-v2/dao2/TrongAi'
import { NUT_LAM_CAU_NEN } from '../src/game/than-thu-v2/dao2/TramHoiPhuc'
import { NUT_NOP_DE_THU } from '../src/game/than-thu-v2/dao2/DeThu'
import { learningBattle } from '../src/game/than-thu-v2/learning-battle'
import { luyenNen } from '../src/lib/loi-giai-api'
import { KHOA_OMNI_DAO, docKetQuaOmni, thanOmniTraLoi } from '../src/lib/omni-hs'
import { CHIP_CHUA_CHAC, CHU_CHAC_MA_SAI, CHU_LUOT, GOI_Y_CHIP_CHUA_CHAC, TIEU_DE_TRAM, chuTram, diemChu } from '../src/lib/omni-chu'
import type { CauDao2 } from '../src/game/than-thu-v2/dao2/dao2-core'
import type { DaoKetQua, DaoProfile } from '../src/game/than-thu-v2/dao/kieu'

configure({ asyncUtilTimeout: 8000 })
let cuon: Element[] = []
beforeEach(() => {
  sessionStorage.clear(); localStorage.clear(); cuon = []
  Element.prototype.scrollIntoView = function (this: Element) { cuon.push(this) } as unknown as Element['scrollIntoView']
})
afterEach(() => { cleanup(); vi.clearAllMocks() })

const hoSo: DaoProfile = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 7, exp: 0, wallet: 0, mastery: [] }
const cau = (i: number, vai: string | null = 'moi', them: Partial<CauDao2> = {}): CauDao2 => ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: `Câu hỏi số ${i + 1}`, choices: ['Một', 'Hai', 'Ba', 'Bốn'], ideas: [], hinhAnh: [], dang: 'D', tenDang: 'Chất béo', mucDo: 'biet', sao: 1, kienThuc: [], ...(vai ? { vai } : {}), ...them })
const OMNI = { bat: true, baiDangLuyen: [], dangVung: { a: 2, b: 9 }, conDangDe8: 3, sEm: 0.06, sMucTieu: 0.07, chungChi: [], ve: { con: 1, tong: 2 }, choBaiMoi: false, onBaiCu: 0, metGio: null, nhatKy: null, deThu: { duoc: false, soCau: 14, phut: 25 } }
const sanh = (omni?: object) => ({ ok: true, cheDo2: true, ngay: '2026-10-05', chienDich: { id: 'cd1', ten: 'Ester', hanNop: '2026-10-12', D: 7, tong: 120, coXat: 50, thanhThao: 10, canDayLai: 0, thanhThaoTangTu: null },
  theLuc: { con: 20, tong: 40 }, huyetChien: false, doan: { con: 0 }, dao: { con: 20 }, khoaDao: false, ruong: { daLam: 20, tong: 40, moDuoc: false, daMo: false }, ...(omni ? { omni } : {}) })
const SAI = { correct: false, answer: 'A', traLoi: 'B', solution: { chot: 'Chốt lời giải' }, reward: 0, stage: 0 }
const omniKq = (o: object) => ({ nhanTocDo: null, msLam: 4000, msKyVong: 60000, luot: false, chacMaSai: false, loiNhan: null, ...o })

type Kich = Record<string, (d: Record<string, unknown>) => unknown>
function dung(o: { omni?: object; kich?: Kich } = {}) {
  const nhat: [string, Record<string, unknown>][] = []
  const kich: Kich = {
    'hoa2-cau-da-lam': () => ({ cau: [] }), resume: () => ({ questions: [] }), sync: () => ({ remaining: 0 }),
    start: () => ({ id: 's1', questions: [cau(0), cau(1)] }), answer: () => SAI, complete: () => ({}),
    ...o.kich,
  }
  const call = vi.fn(async (action: string, data: Record<string, unknown> = {}): Promise<DaoKetQua> => { nhat.push([action, data]); return { ok: true, ...((kich[action]?.(data) as object) ?? {}) } as DaoKetQua })
  const r = render(<Dao2 sbd="S1" profile={hoSo} call={call} doanMo={false} sanhDau={sanh(o.omni)} onMoDoan={() => {}} onMoSoTay={() => {}} onDong={() => {}} />)
  return { ...r, nhat, call, than: (lenh: string, i = 0) => nhat.filter(n => n[0] === lenh)[i]?.[1] }
}
async function lenDuong(tong = 2) {
  const nut = await screen.findByRole('button', { name: /LÊN ĐƯỜNG/ }) as HTMLButtonElement
  await waitFor(() => expect(nut.disabled).toBe(false))
  fireEvent.click(nut)
  await screen.findByText(new RegExp(`^ẢI 1/${tong}`))
}
function chot(chu = /^B\./) {
  fireEvent.click(screen.getByRole('button', { name: chu }))
  fireEvent.click(screen.getByRole('button', { name: 'CHỐT ĐÁP ÁN · TUNG CHIÊU' }))
}
const nutSang = (sau: number) => screen.findByRole('button', { name: `ĐÃ ĐỌC LỜI GIẢI · SANG ẢI ${sau}` })

describe('Đảo 2.0 · cờ OMNI tắt ⇒ y hệt hôm nay', () => {
  it('không chip "Chưa chắc"; thân answer KHÔNG có msLam / tuTin', async () => {
    const m = dung()
    await lenDuong()
    expect(screen.queryByRole('switch', { name: CHIP_CHUA_CHAC })).toBeNull()
    expect(m.container.querySelector('[data-khoi="chua-chac"]')).toBeNull()
    chot()
    await nutSang(2)
    expect(m.than('answer')).toEqual({ session: 's1', qid: 'q0', answer: 'B', assisted: false })
    expect(m.container.querySelector('[data-khoi="omni-loi-nhan"]')).toBeNull()
  })
  it('máy chủ lỡ gửi omni trong answer khi cờ tắt ⇒ bỏ qua (không dòng nhắn, vẫn trừ Máu như cũ)', async () => {
    const m = dung({ kich: { answer: () => ({ ...SAI, omni: omniKq({ luot: true, loiNhan: CHU_LUOT }) }) } })
    await lenDuong()
    chot()
    fireEvent.click(await nutSang(2))
    expect(m.container.querySelector('[data-khoi="omni-loi-nhan"]')).toBeNull()
    expect(await screen.findByText('Lửa Nhỏ · Máu 82/100')).toBeTruthy()
  })
})

describe('Đảo 2.0 · OMNI bật: msLam + chip Chưa chắc', () => {
  it('chip nằm cạnh chip Trợ giúp, mặc định tắt; bật ⇒ answer có tuTin "chua_chac" + msLam (ms nguyên ≥ 0); gợi ý hiện MỘT lần mỗi ngày; sang ải chip về tắt', async () => {
    const m = dung({ omni: OMNI, kich: { answer: d => ({ correct: true, answer: d.answer, traLoi: d.answer, solution: { chot: 'Chốt' }, reward: 2, stage: 1 }) } })
    await lenDuong()
    const chip = screen.getByRole('switch', { name: CHIP_CHUA_CHAC }) as HTMLInputElement
    expect(chip.checked).toBe(false)
    expect(chip.closest('.dao2-chan-hang')?.querySelector('[aria-label="Câu này em có trợ giúp"]')).toBeTruthy()
    expect(chip.closest('label')?.className).toBe('dao2-tro') // cùng kiểu chip sẵn có
    expect(screen.queryByText(GOI_Y_CHIP_CHUA_CHAC)).toBeNull()
    fireEvent.click(chip)
    expect(chip.checked).toBe(true)
    expect(screen.getByText(GOI_Y_CHIP_CHUA_CHAC)).toBeTruthy()
    chot()
    fireEvent.click(await nutSang(2))
    const b1 = m.than('answer')!
    expect(b1).toMatchObject({ session: 's1', qid: 'q0', answer: 'B', assisted: false, tuTin: 'chua_chac' })
    expect(Number.isInteger(b1.msLam)).toBe(true)
    expect(b1.msLam as number).toBeGreaterThanOrEqual(0)
    await screen.findByText(/^ẢI 2\/2/)
    const chip2 = screen.getByRole('switch', { name: CHIP_CHUA_CHAC }) as HTMLInputElement
    expect(chip2.checked).toBe(false) // đặt lại mỗi câu
    fireEvent.click(chip2); fireEvent.click(chip2) // bật rồi tắt: cùng ngày ⇒ không hiện gợi ý lần hai
    expect(screen.queryByText(GOI_Y_CHIP_CHUA_CHAC)).toBeNull()
    chot()
    await screen.findByRole('button', { name: 'ĐÃ ĐỌC LỜI GIẢI · HOÀN THÀNH CHUYẾN' })
    const b2 = m.than('answer', 1)!
    expect('tuTin' in b2).toBe(false) // chip tắt = chắc ⇒ không gửi
    expect(typeof b2.msLam).toBe('number')
  })
  it('thanOmniTraLoi: tắt ⇒ {}; bật ⇒ làm tròn, không âm', () => {
    expect(thanOmniTraLoi(false, 1234.6, true)).toEqual({})
    expect(thanOmniTraLoi(true, 1234.6, false)).toEqual({ msLam: 1235 })
    expect(thanOmniTraLoi(true, -5, true)).toEqual({ msLam: 0, tuTin: 'chua_chac' })
  })
})

describe('Đảo 2.0 · OMNI bật: sau kết quả', () => {
  it('omni.loiNhan ⇒ MỘT dòng nhỏ dưới dải kết quả; chacMaSai ⇒ khối LỜI GIẢI tự mở vào tầm mắt (cả bố cục dọc)', async () => {
    const m = dung({ omni: OMNI, kich: { answer: () => ({ ...SAI, omni: omniKq({ chacMaSai: true, loiNhan: CHU_CHAC_MA_SAI }) }) } })
    await lenDuong()
    chot()
    await nutSang(2)
    const dong = m.container.querySelectorAll('[data-khoi="omni-loi-nhan"]')
    expect(dong).toHaveLength(1)
    expect(dong[0]!.textContent).toBe(CHU_CHAC_MA_SAI)
    expect(dong[0]!.closest('.dao2-ket-qua')).toBeTruthy()
    expect(m.container.querySelector('.dao2-the-giai[data-mo-loi-giai]')).toBeTruthy()
    await waitFor(() => expect(cuon.some(el => el.classList.contains('loi-giai'))).toBe(true))
  })
  it('không chắc-mà-sai ⇒ bố cục dọc không tự cuộn tới lời giải (như cũ)', async () => {
    const m = dung({ omni: OMNI, kich: { answer: () => ({ ...SAI, omni: omniKq({}) }) } })
    await lenDuong()
    chot()
    await nutSang(2)
    expect(m.container.querySelector('[data-mo-loi-giai]')).toBeNull()
    expect(cuon.some(el => el.classList.contains('loi-giai'))).toBe(false)
  })
  it('lướt (omni.luot) ⇒ KHÔNG trừ Máu, dải kết quả không "quái phản đòn"; câu sai thường vẫn trừ 18 như cũ', async () => {
    const m = dung({ omni: OMNI, kich: { answer: d => (d.qid === 'q0' ? { ...SAI, omni: omniKq({ luot: true, loiNhan: CHU_LUOT }) } : { ...SAI, omni: omniKq({}) }) } })
    await lenDuong()
    chot()
    fireEvent.click(await nutSang(2))
    expect(await screen.findByText('Lửa Nhỏ · Máu 100/100')).toBeTruthy()
    chot()
    await screen.findByRole('button', { name: 'ĐÃ ĐỌC LỜI GIẢI · HOÀN THÀNH CHUYẾN' })
    expect(m.container.querySelector('.dao2-ket-qua strong')?.textContent).toBe('Chưa đúng · quái phản đòn')
    expect(m.container.querySelector('.dao2-ket-qua-so')?.textContent).toBe('−18')
  })
  it('dải kết quả của lượt lướt: chữ "không mất Máu", không số trừ, có dòng nhắn của máy chủ', async () => {
    const m = dung({ omni: OMNI, kich: { answer: () => ({ ...SAI, omni: omniKq({ luot: true, loiNhan: CHU_LUOT }) }) } })
    await lenDuong()
    chot()
    await nutSang(2)
    expect(m.container.querySelector('.dao2-ket-qua strong')?.textContent).toBe(CHU_MIEN_MAU.luot)
    expect(m.container.querySelector('.dao2-ket-qua-so')).toBeNull()
    expect(m.container.querySelector('[data-khoi="omni-loi-nhan"]')?.textContent).toBe(CHU_LUOT)
  })
  it('learningBattle: câu "miễn" không trừ Máu, không hồi Máu ở câu đúng kế, chuỗi đúng liền về 0', () => {
    expect(learningBattle([{ qid: 'a', correct: false, mien: true }], 6)).toMatchObject({ hp: 100, damage: 0, streak: 0 })
    expect(learningBattle([{ qid: 'a', correct: false }, { qid: 'b', correct: false, mien: true }, { qid: 'c', correct: true }], 6)).toMatchObject({ hp: 82, heal: 0 })
    expect(learningBattle([{ qid: 'a', correct: true }, { qid: 'b', correct: true }, { qid: 'c', correct: false, mien: true }, { qid: 'd', correct: true }], 6).rage).toBe(false)
    expect(learningBattle([{ qid: 'a', correct: false }], 6).hp).toBe(82) // vắng cờ ⇒ luật cũ
  })
  it('docKetQuaOmni đọc chặt: rác ⇒ null; trạm thiếu chữ ⇒ bỏ trạm; không nhãn câu nền ⇒ coCauNen false', () => {
    expect(docKetQuaOmni('x')).toBeNull()
    expect(docKetQuaOmni({ luot: 'true' })).toMatchObject({ luot: false, chacMaSai: false, loiNhan: null })
    expect(docKetQuaOmni({ tram: { coCauNen: true } })?.tram).toBeUndefined()
    expect(docKetQuaOmni({ tram: { coCauNen: true, nhan: '', chu: 'x' } })?.tram?.coCauNen).toBe(false)
  })
})

describe('Đảo 2.0 · vé thử thách (cửa vào từ Sảnh)', () => {
  it('khoá cửa vào = ve + OMNI bật ⇒ start kèm ve:"auto" (khoá tự xoá); câu sai của chuyến vé KHÔNG trừ Máu', async () => {
    sessionStorage.setItem(KHOA_OMNI_DAO, 've')
    const m = dung({ omni: OMNI, kich: { start: d => ({ id: 'sv', questions: d.ve ? [cau(0, null), cau(1, null), cau(2, null)] : [cau(0), cau(1)] }) } })
    await waitFor(() => expect(m.than('start')).toBeTruthy())
    expect(m.than('start')).toEqual({ mode: 'adventure', ve: 'auto' })
    expect(sessionStorage.getItem(KHOA_OMNI_DAO)).toBeNull()
    await lenDuong(3)
    chot()
    await nutSang(2)
    expect(m.container.querySelector('.dao2-ket-qua strong')?.textContent).toBe(CHU_MIEN_MAU.ve)
    fireEvent.click(await nutSang(2))
    expect(await screen.findByText('Lửa Nhỏ · Máu 100/100')).toBeTruthy()
  })
  it('cờ OMNI tắt ⇒ khoá vé bị bỏ qua: start y hệt cũ (không gọi lệnh mới)', async () => {
    sessionStorage.setItem(KHOA_OMNI_DAO, 've')
    const m = dung()
    await waitFor(() => expect(m.than('start')).toBeTruthy())
    expect(m.than('start')).toEqual({ mode: 'adventure' })
  })
})

describe('Đảo 2.0 · Trạm hồi phục', () => {
  const TRAM = { vkn: 'v1', ten: 'Cân bằng hệ số', tenLoi: 'cân bằng hệ số', nhan: 'can_bang', coCauNen: true, chu: chuTram('cân bằng hệ số', true) }
  const CAU_THAY = cau(9, 'moi', { text: 'Câu dễ hơn một bậc' })
  it('omni.tram ⇒ thẻ thông báo kính sẵn có (tiêu đề + chữ máy chủ + "Làm 3 câu nền") ⇒ mở ĐÚNG hộp câu nền với nhãn ⇒ đóng ⇒ tram-xong {session} MỘT lần ⇒ ải kế được thay; Máu không đổi vì trạm', async () => {
    const m = dung({ omni: OMNI, kich: { answer: d => (d.qid === 'q0' ? { ...SAI, omni: omniKq({ tram: TRAM }) } : SAI), 'hoa2-omni-tram-xong': () => ({ cau: CAU_THAY, viTri: 1 }) } })
    await lenDuong()
    chot()
    await nutSang(2)
    const the = m.container.querySelector('[data-khoi="tram-hoi-phuc"]') as HTMLElement
    expect(the.className).toBe('dao2-kinh dao2-het-tran')
    expect(the.textContent).toContain(TIEU_DE_TRAM)
    expect(the.textContent).toContain(TRAM.chu)
    expect(the.textContent).not.toMatch(/vi kỹ năng/i)
    expect(m.than('hoa2-omni-tram-xong')).toBeUndefined() // chưa xong trạm thì chưa gọi
    fireEvent.click(within(the).getByRole('button', { name: NUT_LAM_CAU_NEN }))
    const hop = await screen.findByRole('dialog', { name: /Luyện kiến thức nền/ })
    expect(luyenNen).toHaveBeenCalledWith('can_bang')
    fireEvent.click(within(hop).getByRole('button', { name: 'Đóng' }))
    await waitFor(() => expect(m.than('hoa2-omni-tram-xong')).toEqual({ session: 's1' }))
    await waitFor(() => expect(within(the).queryByRole('button', { name: NUT_LAM_CAU_NEN })).toBeNull())
    fireEvent.click(await nutSang(2))
    expect(await screen.findByText('Câu dễ hơn một bậc')).toBeTruthy()
    expect(screen.getByText('Lửa Nhỏ · Máu 82/100')).toBeTruthy() // chỉ câu sai thường trừ; trạm không trừ thêm
    expect(m.nhat.filter(n => n[0] === 'hoa2-omni-tram-xong')).toHaveLength(1)
  })
  it('không có câu nền ⇒ chỉ báo chữ (không nút), tram-xong gọi ngay một lần', async () => {
    const tram = { ...TRAM, nhan: null, coCauNen: false, chu: chuTram(null, false) }
    const m = dung({ omni: OMNI, kich: { answer: () => ({ ...SAI, omni: omniKq({ tram }) }), 'hoa2-omni-tram-xong': () => ({ cau: null, viTri: null }) } })
    await lenDuong()
    chot()
    await nutSang(2)
    const the = m.container.querySelector('[data-khoi="tram-hoi-phuc"]') as HTMLElement
    expect(the.textContent).toContain(tram.chu)
    expect(within(the).queryByRole('button')).toBeNull()
    await waitFor(() => expect(m.nhat.filter(n => n[0] === 'hoa2-omni-tram-xong')).toHaveLength(1))
  })
  it('em sang ải luôn không làm câu nền ⇒ tram-xong gọi trước khi sang ải; câu thay hiện ở ải kế', async () => {
    const m = dung({ omni: OMNI, kich: { answer: d => (d.qid === 'q0' ? { ...SAI, omni: omniKq({ tram: TRAM }) } : SAI), 'hoa2-omni-tram-xong': () => ({ cau: CAU_THAY, viTri: 1 }) } })
    await lenDuong()
    chot()
    fireEvent.click(await nutSang(2))
    expect(await screen.findByText('Câu dễ hơn một bậc')).toBeTruthy()
    expect(m.nhat.filter(n => n[0] === 'hoa2-omni-tram-xong')).toHaveLength(1)
  })
})

describe('Đảo 2.0 · đề thử (cửa vào từ Sảnh)', () => {
  it('không lộ đáp án trước khi nộp; làm đủ ⇒ "Nộp đề thử" (hỏi lại) ⇒ hoa2-omni-de-thu-nop; kết quả bằng thẻ lời giải sẵn có', async () => {
    sessionStorage.setItem(KHOA_OMNI_DAO, 'de-thu')
    const het = new Date(Date.now() + 25 * 60_000).toISOString()
    const m = dung({
      omni: { ...OMNI, deThu: { duoc: true, soCau: 14, phut: 25 } },
      kich: {
        'hoa2-omni-de-thu': () => ({ id: 'dt1', cau: [cau(0), cau(1, null, { phan: 'III', choices: [], text: 'Tính số mol' })], phut: 25, hetLuc: het }),
        'hoa2-omni-de-thu-nop': () => ({ diem: 7.5, dung: 1, tong: 2, cau: [{ qid: 'q0', dung: true, traLoi: 'B', dapAn: 'B', loiGiai: { chot: 'Chốt câu một' } }, { qid: 'q1', dung: false, traLoi: '2,5', dapAn: '3', loiGiai: { chot: 'Chốt câu hai' } }] }),
      },
    })
    await screen.findByRole('heading', { name: /Đề thử 2 câu/ })
    expect(m.nhat.map(n => n[0])).not.toContain('start') // không soạn chuyến
    const dongHo = screen.getByRole('timer')
    expect(dongHo.textContent).toMatch(/Còn lại\s*2[45]:\d\d/)
    expect(m.container.querySelector('.loi-giai')).toBeNull()
    expect(m.container.textContent).not.toContain('Chốt câu một')
    expect(m.container.querySelector('[data-kq], .pa-dung, .pa-sai')).toBeNull()
    const nop = screen.getByRole('button', { name: 'Còn 2 câu chưa làm' }) as HTMLButtonElement
    expect(nop.disabled).toBe(true)
    const c1 = screen.getByRole('region', { name: 'Câu 1 trên 2' }), c2 = screen.getByRole('region', { name: 'Câu 2 trên 2' })
    fireEvent.click(within(c1).getByRole('button', { name: /^B\./ }))
    fireEvent.change(within(c2).getByLabelText('Đáp án của em'), { target: { value: '2,5' } })
    fireEvent.click(screen.getByRole('button', { name: NUT_NOP_DE_THU }))
    const hoi = await screen.findByRole('alertdialog')
    fireEvent.click(within(hoi).getByRole('button', { name: NUT_NOP_DE_THU }))
    await waitFor(() => expect(m.than('hoa2-omni-de-thu-nop')).toEqual({ id: 'dt1', traLoi: { q0: 'B', q1: '2,5' } }))
    expect(await screen.findByText(`Điểm đề thử: ${diemChu(7.5)}`)).toBeTruthy()
    expect(screen.getByText(/Đúng 1\/2 câu/)).toBeTruthy()
    expect(m.container.querySelectorAll('.dao2-the-giai')).toHaveLength(2)
    expect(m.container.querySelector('.loi-giai')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'VỀ SẢNH' })).toBeTruthy()
    expect(cuon.some(el => el.classList.contains('loi-giai'))).toBe(false) // danh sách kết quả không tự cuộn nhảy
  })
  it('hết giờ theo hạn máy chủ ⇒ tự nộp MỘT lần phần đã làm (không hỏi lại)', async () => {
    sessionStorage.setItem(KHOA_OMNI_DAO, 'de-thu')
    const m = dung({
      omni: { ...OMNI, deThu: { duoc: true, soCau: 14, phut: 25 } },
      kich: {
        'hoa2-omni-de-thu': () => ({ id: 'dt2', cau: [cau(0)], phut: 25, hetLuc: new Date(Date.now() + 300).toISOString() }),
        'hoa2-omni-de-thu-nop': () => ({ diem: 0, dung: 0, tong: 1, cau: [{ qid: 'q0', dung: false, traLoi: '', dapAn: 'B', loiGiai: { chot: 'Chốt' } }] }),
      },
    })
    await waitFor(() => expect(m.than('hoa2-omni-de-thu-nop')).toEqual({ id: 'dt2', traLoi: { q0: '' } }), { timeout: 5000 })
    expect(await screen.findByText(`Điểm đề thử: ${diemChu(0)}`)).toBeTruthy()
    expect(m.nhat.filter(n => n[0] === 'hoa2-omni-de-thu-nop')).toHaveLength(1)
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })
  it('khoá đề thử nhưng máy chủ chưa cho (deThu.duoc false) ⇒ Đảo soạn chuyến như thường, không gọi hoa2-omni-de-thu', async () => {
    sessionStorage.setItem(KHOA_OMNI_DAO, 'de-thu')
    const m = dung({ omni: OMNI })
    await waitFor(() => expect(m.than('start')).toBeTruthy())
    expect(m.nhat.map(n => n[0])).not.toContain('hoa2-omni-de-thu')
  })
})
