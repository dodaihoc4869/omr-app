// @vitest-environment jsdom
// LIVE BẢNG — Ô GIẤY LUÔN LÀ «GIẤY ĐỀ» KIỂU TỜ CHIẾU (thầy 11/11, kèm ảnh máy em: «Chuyển câu bấm lên bảng máy hs bị như thế này» — em chưa gửi bị gọi lên
// bảng, ô giấy hiện THẺ LÀM BÀI có cụm nút «Đúng | Sai» mờ). Khoá:
//   · bảng live với câu Phần I / II / III (đường dựng thường): phương án / ý là CHỮ ĐỀ («A. …», «a. …»), có đầu giấy «Câu N · Phần …»; trong ô giấy KHÔNG có
//     nút / ô nhập / điều khiển trả lời nào (hai mũi tên «Thầy đang viết ở dưới / ở trên» của khung giấy không phải điều khiển trả lời);
//   · màn Bình Phản Ứng chỉ đưa THÂN ĐỀ cho bảng live (không còn ChonTracNghiem / ChonDungSai khoá); trình phát Xem lại Live cũng vậy;
//   · em chưa gửi mà thầy đã gọi bạn lên bảng ⇒ khay nói rõ «câu này đã khoá»; em đã gửi / chính em lên bảng ⇒ không có dòng ấy;
//   · ô giấy phủ kín khung của nó (sát lề trái, chạm lề trên / dưới).
import { act, render, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { _datLaiTatMan } from '../src/components/bpu/tat-man'

type Tt = Record<string, unknown>
const NEN: Tt = { duocXem: true, san: true, bat: true, tu: 1, tieng: 'co', nghe: true, kenhNet: 'ws', duBang: true, bang: true, duocMoMic: false, duocMoi: false, tay: false, hangTay: null, mic: 'tat', banNoi: null, nghi: false }
vi.mock('../src/lib/live', () => ({
  taoLiveEm: (tuy: { khiTrangThai?: (t: Tt) => void }) => {
    setTimeout(() => act(() => { tuy.khiTrangThai?.({ ...NEN }) }), 0)
    return {
      trangThai: () => ({ ...NEN }), nhanView() {}, nhanTinPhong() {}, khiNoiLai() {}, moKhoaTieng: async () => true, datTieng() {}, datRoiMan() {},
      bang: () => ({ trang: '', tiLe: 16 / 9, net: [], cuoi: 0, lichSu: [], ghep: null }), khung: () => ({ dau: [], tro: null }), mucAm: () => 0, mucAmMic: () => 0, mucAmBan: () => 0, soDo: () => ({ kenhNet: 'ws', mang: 0 }), huy() {},
      batMicLenBang: async () => ({ ok: true }), tatMic() {}, dangChoQuyenMic: () => false, gioTay() {}, deSau() {}, datGiayLech() {}, datHienBang() {}, treUocTinh: () => null,
    }
  },
}))
const dangKy = () => {}
const Chu = ({ text }: { text: string }) => <>{text}</>
const view = { duocXem: true, san: true, bat: true, tu: 1, phien: 1, ss: null, tieng: 'tat', soNet: 0, bang: true, emTay: false, hangTay: null, emDuocMoi: false, emNoi: false, noi: [] } as never
const Y = ['Phản ứng thủy phân peptide chỉ xảy ra bởi xúc tác bởi acid hoặc base.', 'Bản chất của quá trình thủy phân là cắt đứt các liên kết peptide.', 'Pentapeptide trên được tạo nên từ 5 loại α-amino acid khác nhau.', 'Thu được tối đa 2 loại dipeptide có chứa gốc glycine (Gly).']
const luot = (them: Record<string, unknown>) => ({ l: { pha: 'goi', so: 2, phan: 'II', tuLuan: false, emTra: null, daGui: 3, coMat: 8, goi: { sbd: 'S1', ten: 'Nguyễn Thị Hà', doi: 0, emDoan: null, emTiep: 0, dat: null }, ...them }, sbd: 'S2', doi: 1, daGuiMay: false, ketQuaBang: null, gui: () => undefined }) as never
async function dung(q: Record<string, unknown>, them: Record<string, unknown> = {}) {
  const { default: LopLive } = await import('../src/components/live/LopLive')
  const de = <section className="ht2-lam-de"><p className="ht2-lam-de-chu">Thủy phân peptide là một phản ứng hóa học quan trọng.</p></section>
  render(<LopLive ve="ve" goc="https://may-chu" guiTho={() => {}} dangKy={dangKy} view={view} che="bang" de={de} khoaDe="q9" doi={{ ten: 'Đội Kali', ky: 'K', kj: 120 }} matMang={false} roi={false} q={q as never} Chu={Chu} tuLuan={false} so={2} {...them} />)
  await waitFor(() => expect(document.querySelector('.lv-gd')).toBeTruthy())
  return document.querySelector<HTMLElement>('.lv-giay')!
}
/** Mọi điều khiển trả lời có thể có trong ô giấy (hai mũi tên của khung giấy không tính). */
const dieuKhien = (g: HTMLElement) => [...g.querySelectorAll('button, [role="radio"], [role="radiogroup"], [role="switch"], input, select, textarea, [aria-pressed], [aria-checked]')].filter((e) => !e.classList.contains('lv-mui'))
beforeEach(() => { _datLaiTatMan(); document.body.innerHTML = '' })

describe('ô giấy của bảng live là giấy đề kiểu tờ chiếu, không có điều khiển trả lời', () => {
  it('Phần II (Đúng / Sai), em chưa gửi bị gọi lên bảng: «Câu 2» + «Phần II · Đúng / Sai», thân đề, bốn ý «a. … d.» là CHỮ — không nút «Đúng | Sai» nào', async () => {
    const g = await dung({ phan: 'II', text: 'Thủy phân peptide…', choices: [], ideas: Y }, { luot: luot({}) })
    expect(g.querySelector('.lv-gd-so')!.textContent).toBe('Câu 2'); expect(g.querySelector('.lv-gd-phan')!.textContent).toBe('Phần II · Đúng / Sai')
    expect(g.textContent).toContain('Thủy phân peptide là một phản ứng hóa học quan trọng.')
    const dong = [...g.querySelectorAll('.lv-gd-pa > div')]
    expect(dong.map((d) => d.querySelector('.lv-gd-ky')!.textContent)).toEqual(['a.', 'b.', 'c.', 'd.'])
    expect(dong.map((d) => d.querySelector('span')!.textContent)).toEqual(Y)
    expect(g.querySelector('.lv-gd-pa')!.getAttribute('data-cot')).toBe('1')
    expect(dieuKhien(g)).toEqual([])
    expect(g.textContent).not.toMatch(/Đúng\s*Sai/)
  })
  it('Phần I: «A. … D.» là chữ, phương án ngắn xếp hai cột như tờ chiếu; Phần III: dòng «Trả lời ngắn — …», không có ô nhập', async () => {
    const g = await dung({ phan: 'I', text: 'Alcohol nào bậc II?', choices: ['CH₃–CH₂–OH', 'CH₃–CH(OH)–CH₃', '(CH₃)₃C–OH', 'CH₃–OH'], ideas: [] })
    expect([...g.querySelectorAll('.lv-gd-ky')].map((e) => e.textContent)).toEqual(['A.', 'B.', 'C.', 'D.'])
    expect(g.querySelector('.lv-gd-pa')!.getAttribute('data-cot')).toBe('2'); expect(g.querySelector('.lv-gd-phan')!.textContent).toBe('Phần I · Trắc nghiệm')
    expect(dieuKhien(g)).toEqual([])
    document.body.innerHTML = ''
    const g3 = await dung({ phan: 'III', text: 'Tính khối lượng muối.', choices: [], ideas: [] })
    expect(g3.querySelector('.lv-gd-ngan')!.textContent).toContain('Trả lời ngắn'); expect(g3.querySelector('.lv-gd-pa')).toBeNull()
    expect(dieuKhien(g3)).toEqual([])
  })
  it('ô giấy phủ kín khung của nó: sát lề trái 4 px, chạm lề trên / dưới (khung nhìn jsdom 1024 × 768)', async () => {
    const g = await dung({ phan: 'II', text: 'x', choices: [], ideas: Y })
    expect(parseFloat(g.style.left)).toBe(4); expect(parseFloat(g.style.top)).toBe(4); expect(parseFloat(g.style.height)).toBe(window.innerHeight - 8)
    const b = document.querySelector<HTMLElement>('.lv-bang')!
    expect(parseFloat(b.style.left) + parseFloat(b.style.width)).toBeCloseTo(window.innerWidth - 4, 3)
  })
})

describe('em chưa gửi mà thầy đã gọi bạn lên bảng: khay nói rõ lượt đã khoá', () => {
  const khay = () => document.querySelector('.lv-khay')!.textContent ?? ''
  it('em chưa gửi, bạn khác lên bảng ⇒ có dòng «câu này đã khoá»', async () => {
    await dung({ phan: 'II', text: 'x', choices: [], ideas: Y }, { luot: luot({}) })
    expect(khay()).toContain('Thầy đã gọi bạn lên bảng — câu này đã khoá, em chưa gửi nên để trống.')
  })
  it('em đã gửi ⇒ không có; chính em được gọi lên bảng ⇒ không có; lượt còn đang trả lời ⇒ không có', async () => {
    await dung({ phan: 'II', text: 'x', choices: [], ideas: Y }, { luot: luot({ emTra: { tra: 'DSSD' } }) })
    expect(khay()).not.toContain('đã khoá')
    document.body.innerHTML = ''
    await dung({ phan: 'II', text: 'x', choices: [], ideas: Y }, { luot: luot({ goi: { sbd: 'S2', ten: 'Lê Gia Huy', doi: 1, emDoan: null, emTiep: 0, dat: null } }) })
    expect(khay()).not.toContain('đã khoá')
    document.body.innerHTML = ''
    await dung({ phan: 'II', text: 'x', choices: [], ideas: Y }, { luot: luot({ pha: 'tra-loi', goi: null }) })
    expect(khay()).not.toContain('đã khoá')
  })
})

describe('nguồn: không nơi nào đưa thẻ làm bài (có nút trả lời) vào ô giấy của bảng live / trình phát', () => {
  const doc = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')
  it('màn Bình Phản Ứng: `deLive` chỉ là thân đề (LC.DeCau)', () => {
    const s = doc('src/components/bpu/ManBinhPhanUng.tsx'), a = s.indexOf('const deLive ='), khoi = s.slice(a, s.indexOf('\n', a))
    expect(khoi).toContain('LC.DeCau'); expect(khoi).not.toMatch(/ChonTracNghiem|ChonDungSai|OTraLoiNgan/)
  })
  it('trình phát Xem lại Live: giấy dựng bằng DauGiay + DeCau + PhuongAnTinh, không ChonTracNghiem / ChonDungSai', () => {
    const s = doc('src/screens/live-xem-lai/hs/TrinhPhat.tsx')
    expect(s).toContain('<PhuongAnTinh'); expect(s).not.toMatch(/LC\.ChonTracNghiem|LC\.ChonDungSai/)
  })
})
