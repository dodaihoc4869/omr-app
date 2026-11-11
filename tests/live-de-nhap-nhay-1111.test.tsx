// @vitest-environment jsdom
// LIVE BẢNG — «ĐỀ NHẤP NHÁY LÊN XUỐNG» (thầy 11/11 trên bản sống #1618: «khi chuyển câu bấm L lên bảng thì máy học sinh vào màn hình live, đề nhấp nháy lên xuống»).
// GỐC (đo Chromium: scripts/thu-live-1011/do-nhap-nhay-1111.mjs, số ở docs/do-live-1011.md): tấm giấy đề dựng thường (`GiayDe`) tính hệ số phóng theo chính
// chiều cao vừa đổi ⇒ vòng phản hồi không có điểm dừng khi số dòng chữ nhảy bậc ⇒ khối đề đổi cỡ MỖI KHUNG HÌNH. Khoá:
//   · `chonHeSoGiay` (vua-giay.ts) là hàm thuần, dò MỘT lượt: cùng nội dung ⇒ cùng kết quả, không dao động — kể cả với nội dung làm phép tính cũ nhảy qua lại;
//   · bảng live đang hiện: 30 view / trạng thái liên tiếp chỉ khác số em xem, số nét, mức mạng, tiếng ⇒ nút DOM của khối đề là CÙNG một nút, không đổi lớp,
//     không đổi style, không thêm / gỡ nút nào trong ô giấy.
import { act, render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { _datLaiTatMan } from '../src/components/bpu/tat-man'
import { NAC_DO, chonHeSoGiay } from '../src/components/live/vua-giay'

type Tt = Record<string, unknown>
const NEN: Tt = { duocXem: true, san: true, bat: true, tu: 1, tieng: 'co', nghe: true, kenhNet: 'ws', duBang: true, bang: true, duocMoMic: false, duocMoi: false, tay: false, hangTay: null, mic: 'tat', banNoi: null, nghi: false }
let dat: (o: Tt) => void = () => {}
vi.mock('../src/lib/live', () => ({
  taoLiveEm: (tuy: { khiTrangThai?: (t: Tt) => void }) => {
    let tt = { ...NEN }
    dat = (o) => { tt = { ...tt, ...o }; act(() => { tuy.khiTrangThai?.({ ...tt }) }) }
    setTimeout(() => dat({}), 0)
    return {
      trangThai: () => ({ ...tt }), nhanView() {}, nhanTinPhong() {}, khiNoiLai() {}, moKhoaTieng: async () => true, datTieng() {}, datRoiMan() {},
      bang: () => ({ trang: '', tiLe: 16 / 9, net: [], cuoi: 0, lichSu: [], ghep: null }), khung: () => ({ dau: [], tro: null }), mucAm: () => 0, mucAmMic: () => 0, mucAmBan: () => 0, soDo: () => ({ kenhNet: 'ws', mang: 0 }), huy() {},
      batMicLenBang: async () => ({ ok: true }), tatMic() {}, dangChoQuyenMic: () => false, gioTay() {}, deSau() {}, datGiayLech() {}, datHienBang() {}, treUocTinh: () => null,
    }
  },
}))
beforeEach(() => { _datLaiTatMan() })

/** Khối đề giả: chữ dài `dai` px xuống dòng theo bề ngang ⇒ cao = số dòng × 30 + 40 (nhảy bậc theo số dòng — đúng thứ làm phép tính cũ dao động). */
const khoi = (rong: number, dai: number) => (k: number): number => Math.ceil(dai / ((rong - 36) / k)) * 30 + 40

describe('chọn hệ số phóng cho tấm giấy đề: dò một lượt, không dao động', () => {
  it('phép tính CŨ (k = (cao − 28) / cao khối, tính lại theo chính kết quả) nhảy qua lại mãi với khối đề có số dòng nhảy bậc — đây là gốc «đề nhấp nháy»', () => {
    const cao = 600, kep = (v: number) => Math.max(1.3, Math.min(2.1, v))
    let coDaoDong = false
    for (const dai of [2600, 3100, 3700, 4300, 5200, 6100]) {
      const h = khoi(1000, dai)
      let k = 2
      const vet: number[] = []
      for (let i = 0; i < 40; i++) { k = kep((cao - 28) / h(k)); vet.push(Math.round(k * 1000)) }
      if (new Set(vet.slice(20)).size > 1) coDaoDong = true
    }
    expect(coDaoDong).toBe(true)
  })
  it('phép dò MỚI: cùng nội dung ⇒ cùng kết quả (gọi lại bao nhiêu lần cũng thế); kết quả là nấc LỚN NHẤT còn vừa chiều cao giấy, không vừa thì nấc nhỏ nhất', () => {
    const cao = 600
    for (const dai of [400, 2600, 3100, 3700, 4300, 5200, 6100, 20000]) {
      const h = khoi(1000, dai), r = chonHeSoGiay(h, cao, 1.3, 2.1)
      for (let i = 0; i < 5; i++) expect(chonHeSoGiay(h, cao, 1.3, 2.1)).toEqual(r)
      expect(r.h).toBe(h(r.k))
      const vua = r.h * r.k <= cao - 28
      if (vua) {
        // nấc lớn hơn kế đó (nếu có) không vừa
        const buoc = (2.1 - 1.3) / NAC_DO
        if (r.k < 2.1 - 1e-9) expect(h(r.k + buoc) * (r.k + buoc)).toBeGreaterThan(cao - 28)
      } else expect(r.k).toBeCloseTo(1.3, 9)
    }
    expect(chonHeSoGiay(khoi(1000, 400), cao, 1.3, 2.1).k).toBe(2.1) // đề ngắn ⇒ cỡ lớn nhất
    expect(chonHeSoGiay(() => 0, cao, 1.3, 2.1).k).toBe(2.1) // chưa đo được (cao 0) ⇒ không vỡ
  })
  it('số lần đo có trần (≤ 9 lần cho mỗi câu) — không phải vòng lặp theo khung hình', () => {
    let dem = 0
    chonHeSoGiay((k) => { dem++; return khoi(1000, 20000)(k) }, 600, 1.3, 2.1)
    expect(dem).toBe(NAC_DO + 1)
  })
})

describe('bảng live đang hiện: cập nhật live không chạm cây DOM của đề', () => {
  it('30 view + 30 trạng thái liên tiếp (số nét, số em, mức tiếng, giơ tay, bạn nói) ⇒ khối đề là CÙNG một nút, 0 lần thêm / gỡ nút, 0 lần đổi lớp / style trong ô giấy', async () => {
    const { default: LopLive } = await import('../src/components/live/LopLive')
    const de = <div className="de-thu"><p>Thủy phân peptide là một phản ứng hóa học quan trọng.</p><p>a. Phản ứng thủy phân peptide chỉ xảy ra bởi xúc tác acid hoặc base.</p></div>
    const view = (i: number) => ({ duocXem: true, san: true, bat: true, tu: 1, phien: 1, ss: null, tieng: 'tat', soNet: i, bang: true, emTay: false, hangTay: null, emDuocMoi: false, emNoi: false, noi: [], xem: 100 + i, nghe: 40 + i }) as never
    const ve = (i: number) => <LopLive ve="ve" goc="https://may-chu" guiTho={() => {}} dangKy={dangKy} view={view(i)} che="bang" de={de} khoaDe="q9" doi={{ ten: 'Đội Kali', ky: 'K', kj: 120 + i }} matMang={false} roi={false} />
    const r = render(ve(0))
    await waitFor(() => expect(document.querySelector('.lv-de-trong')).toBeTruthy())
    await act(async () => { await new Promise((x) => setTimeout(x, 30)) })
    const giay = document.querySelector('.lv-giay')!, khoiDe = document.querySelector<HTMLElement>('.lv-de-trong')!, noiDung = document.querySelector('.de-thu')!
    const kieu = khoiDe.getAttribute('style'), lop = khoiDe.className
    const doi: MutationRecord[] = []
    const mo = new MutationObserver((ds) => { doi.push(...ds) })
    mo.observe(giay, { subtree: true, childList: true, attributes: true, characterData: true })
    for (let i = 1; i <= 30; i++) {
      r.rerender(ve(i))
      dat({ hangTay: i % 3 ? null : i, tay: i % 3 === 0, banNoi: i % 5 === 0 ? { ten: 'Lê Gia Huy', doi: 1 } : null, nghe: i % 2 === 0 })
    }
    await act(async () => { await new Promise((x) => setTimeout(x, 30)) })
    doi.push(...mo.takeRecords()); mo.disconnect()
    expect(document.querySelector('.lv-de-trong')).toBe(khoiDe)
    expect(document.querySelector('.de-thu')).toBe(noiDung)
    expect(khoiDe.getAttribute('style')).toBe(kieu); expect(khoiDe.className).toBe(lop)
    expect(doi.filter((m) => m.type === 'childList').length).toBe(0)
    expect(doi.filter((m) => m.type !== 'childList').length).toBe(0)
  })
})
const dangKy = () => {}
