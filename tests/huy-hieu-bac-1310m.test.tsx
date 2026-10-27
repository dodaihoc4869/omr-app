// @vitest-environment jsdom
// HUY HIỆU 12 BẬC + TẤM ĐỦ 12 BẬC + DANH SÁCH EM THEO BẬC (đợt 19 làn M, thầy 13/10: "chỗ bấm vào bậc này cho hiện đủ 12 bậc để học sinh biết rõ bao nhiêu
// bậc … thiết kế lại biểu tượng từng bậc … để học sinh phải wow" · "phần này cho tôi bấm vào từng bậc sẽ hiện ra danh sách siêu đẹp của từng học sinh đó").
// Khoá:
//   · HuyHieuBac: đủ 12 huy hiệu, đúng data-bac, aria-hidden, khung theo nhóm (Lười tròn · Chưa đều lục giác · Chăm viền kép), 10–12 có tia sáng,
//     11 có sao, 12 có nguyệt quế + lấp lánh; id gradient riêng từng huy hiệu; số ngoài 1–12 ⇒ không vẽ;
//   · KHÔNG còn emoji ở chip / chip nhỏ / thang / dải đếm / tờ chiếu điểm danh;
//   · chip bậc là NÚT (≥ 44 px do CSS) ⇒ dialog đủ 12 dòng, đúng 3 nhóm 5/2/5, dòng hiện tại đánh dấu + "Em/Con đang ở đây", "Còn N điểm lên …" đúng;
//   · Esc / nút Đóng / bấm nền đóng và trả tiêu điểm về chip; Esc trên tấm bậc KHÔNG lan tới tấm Hồ sơ phía dưới;
//   · vắng bacCham ⇒ không có nút;
//   · thầy: bấm ô dải đếm ⇒ tấm "Bậc N · Tên · K em" đúng danh sách em (điểm chăm thấp → cao), ô 0 em không bấm được; bấm em ⇒ mở hồ sơ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'

const ph = vi.hoisted(() => ({ nhip: vi.fn() }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/ho-so-con-ph-api', async (goc) => ({ ...(await goc<typeof import('../src/lib/ho-so-con-ph-api')>()), layNhipHocCon: (sbd: string) => ph.nhip(sbd) }))
vi.mock('../src/components/chien-dich/HoSoLamCauEm', () => ({ default: ({ em }: { em: { ten: string } }) => <div role="dialog" aria-label={`Hồ sơ làm bài ${em.ten}`} /> }))
vi.mock('../src/components/chien-dich/TheBaiHangNgay', () => ({ default: () => <section aria-label="Bảng giả" /> }))

import { BAC_CHAM_CHI, bacChamChi, type KetQuaBac } from '../server/src/bac-cham-chi'
import { tomTatNhip } from '../server/src/nhip-hoc-luat'
import type { EmNhipHoc, KetQuaNhipHoc } from '../server/src/nhip-hoc-kieu'
import { demTheoBac, phanNhomEm, xepTheoBac } from '../src/lib/nhip-hoc-thay'
import { nhipTheoSbd, thongKeBuoi } from '../src/lib/diem-danh-nhip'
import type { TrangThaiBuoi } from '../src/lib/buoi-hoc-api'
import { bacTheoSanh, chuKhoangDiem } from '../src/components/bac-cham-chi/bac'
import HuyHieuBac from '../src/components/bac-cham-chi/HuyHieuBac'
import ChipBac from '../src/components/bac-cham-chi/ChipBac'
import ThangBac from '../src/components/bac-cham-chi/ThangBac'
import DaiDemBac from '../src/components/bac-cham-chi/DaiDemBac'
import { NutBac } from '../src/components/bac-cham-chi/ChipBac'
import { CHU_CACH_TINH } from '../src/components/bac-cham-chi/TamMuoiHaiBac'
import NhipHocThay from '../src/components/hom-nay-thay/NhipHocThay'
import BanChieuDiemDanh from '../src/components/day-hoc/BanChieuDiemDanh'
import { NHIP_EM_LUOI } from '../scripts/chup-v2/gia/nhip-hoc-em'

afterEach(() => {
  cleanup()
  ph.nhip.mockReset()
  document.body.style.overflow = ''
})

const EMOJI = /\p{Extended_Pictographic}/u

// ---------------------------------------------------------------- dữ liệu: 12 ngày, hôm nay 12/10; bậc tính bằng ĐÚNG phép máy chủ
const NGAY = Array.from({ length: 12 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
const HOM_NAY = '2026-10-12'
const em = (sbd: string, hoTen: string, lam: number[], o: Partial<EmNhipHoc> = {}): EmNhipHoc => {
  const e: EmNhipHoc = { sbd, hoTen, lop: '12A1', khoi: '12', ngayVao: NGAY[0]!, muc: NGAY.map(() => 10), lam, doiPho: null, ...o }
  const dai = NGAY.map((ngay, i) => ({ ngay, muc: e.muc[i]!, lam: e.lam[i]! })).filter((x) => x.ngay >= e.ngayVao)
  const b = bacChamChi(dai, HOM_NAY, tomTatNhip(dai, HOM_NAY))
  return b ? { ...e, bacCham: b } : e
}
const DS_EM = [
  em('A1', 'An Bình', NGAY.map(() => 0)),
  em('A2', 'Bảo Châu', [10, 0, 0, 0, 10, 0, 0, 0, 10, 0, 4, 0]),
  em('A3', 'Cẩm Dung', [10, 10, 0, 10, 10, 0, 10, 10, 4, 10, 10, 0]),
  em('A4', 'Duy Khang', NGAY.map(() => 10)),
  em('A5', 'Gia Hân', [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 12, 0]),
  em('A7', 'Khánh Linh', NGAY.map(() => 10), { lop: '12A2' }),
  em('A6', 'Hà My', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 10], { ngayVao: NGAY[10]! }),
]
const KQ: KetQuaNhipHoc = { ok: true, tu: NGAY[0]!, den: HOM_NAY, homNay: HOM_NAY, ngay: NGAY, em: DS_EM, lop: [{ tenLop: '12A1', khoi: '12', soEm: DS_EM.length }], doiPhoDaTinh: { quaNhanh: true, chonLap: true }, canhBao: [] }

describe('HuyHieuBac — 12 huy hiệu vẽ riêng', () => {
  it('đủ 12 huy hiệu, đúng data-bac, aria-hidden, khung theo nhóm, viewBox 64', () => {
    const { container } = render(
      <>
        {BAC_CHAM_CHI.map((b) => (
          <HuyHieuBac key={b.so} bac={b.so} co={32} />
        ))}
      </>,
    )
    const svg = [...container.querySelectorAll('svg.bcc-hh')]
    expect(svg).toHaveLength(12)
    expect(svg.map((x) => x.getAttribute('data-bac'))).toEqual(BAC_CHAM_CHI.map((b) => String(b.so)))
    for (const x of svg) {
      expect(x.getAttribute('aria-hidden')).toBe('true')
      expect(x.getAttribute('viewBox')).toBe('0 0 64 64')
      expect(x.textContent).toBe('')
    }
    expect(svg.map((x) => x.getAttribute('data-khung'))).toEqual(['1', '1', '1', '1', '1', '2', '2', '3', '3', '3', '3', '3'])
    // hình trong khác nhau từng bậc
    const hinh = svg.map((x) => x.querySelector('.hh-net')!.innerHTML)
    expect(new Set(hinh).size).toBe(12)
    // lên hạng: 10–12 có tia sáng, 11 có sao, 12 có nguyệt quế + lấp lánh; dưới 10 không có
    expect(svg.map((x) => !!x.querySelector('.hh-tia'))).toEqual(BAC_CHAM_CHI.map((b) => b.so >= 10))
    expect(svg.map((x) => !!x.querySelector('.hh-nq'))).toEqual(BAC_CHAM_CHI.map((b) => b.so === 12))
    expect(svg.map((x) => !!x.querySelector('.hh-lap'))).toEqual(BAC_CHAM_CHI.map((b) => b.so === 12))
    expect(svg[10]!.querySelector('path.hh-v.hh-vien')).toBeTruthy()
    // hiệu ứng chỉ bậc 10–12 (cỡ ≥ 24 px)
    expect(svg.map((x) => x.hasAttribute('data-dong'))).toEqual(BAC_CHAM_CHI.map((b) => b.so >= 10))
  })
  it('mỗi huy hiệu một bộ id gradient riêng (hai huy hiệu cùng bậc không giẫm màu nhau)', () => {
    const { container } = render(
      <>
        <HuyHieuBac bac={8} />
        <HuyHieuBac bac={8} />
      </>,
    )
    const id = [...container.querySelectorAll('linearGradient')].map((g) => g.id)
    expect(new Set(id).size).toBe(id.length)
    for (const svg of container.querySelectorAll('svg')) for (const el of svg.querySelectorAll('[fill^="url(#"]')) {
      const ref = el.getAttribute('fill')!.slice(5, -1)
      expect(svg.querySelector(`[id="${ref}"]`)).toBeTruthy()
    }
  })
  it('cỡ nhỏ (< 24 px) đứng yên; số ngoài 1–12 ⇒ không vẽ', () => {
    const { container, rerender } = render(<HuyHieuBac bac={12} co={20} />)
    expect(container.querySelector('svg')!.hasAttribute('data-dong')).toBe(false)
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('20')
    rerender(<HuyHieuBac bac={0} />)
    expect(container.innerHTML).toBe('')
    rerender(<HuyHieuBac bac={13} />)
    expect(container.innerHTML).toBe('')
    rerender(<HuyHieuBac bac={2.5} />)
    expect(container.innerHTML).toBe('')
  })
  it('màu CHỈ từ biến chuẩn: không mã màu thô trong tệp vẽ / CSS; hiệu ứng chỉ transform/opacity, tắt khi giảm chuyển động + máy yếu', () => {
    const tsx = readFileSync('src/components/bac-cham-chi/HuyHieuBac.tsx', 'utf8')
    const css = readFileSync('src/components/bac-cham-chi/bac-cham-chi.css', 'utf8') + readFileSync('src/components/bac-cham-chi/tam-bac.css', 'utf8')
    for (const s of [tsx, css]) {
      expect(s).not.toMatch(/#[0-9a-fA-F]{3,8}\b(?![^'"]*\$\{)/)
      expect(s).not.toMatch(/\brgba?\(|\bhsla?\(/)
    }
    expect(tsx).not.toMatch(/\b(fill|stroke|stopColor|stop-color)="(?!url\(|none)/)
    const khung = [...css.matchAll(/@keyframes [\w-]+ \{([\s\S]*?)\n\}/g)].map((m) => m[1]).join('')
    expect(khung.replace(/transform|opacity|translate\w*\([^)]*\)|scale\([^)]*\)/g, '')).not.toMatch(/[a-z-]+\s*:/)
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{ \.bcc-hh \.hh-luot, \.bcc-hh \.hh-lap \{ animation: none; \}/)
    expect(css).toMatch(/html\.may-yeu \.bcc-hh \.hh-luot, html\.may-yeu \.bcc-hh \.hh-lap \{ animation: none; \}/)
  })
})

describe('không còn emoji ở mọi chỗ hiện bậc', () => {
  it('chip thường, chip nhỏ, thang, dải đếm: huy hiệu đúng bậc, không emoji', () => {
    const { container } = render(
      <>
        {BAC_CHAM_CHI.map((b) => (
          <span key={b.so}>
            <ChipBac bac={b.so} />
            <ChipBac bac={b.so} nho />
          </span>
        ))}
        <ThangBac kq={{ bac: 3, diem: 20, diemLenBac: 6 }} />
        <DaiDemBac dem={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} coTen />
      </>,
    )
    expect(EMOJI.test(container.textContent!)).toBe(false)
    const chip = [...container.querySelectorAll('.bcc-chip')]
    expect(chip).toHaveLength(24)
    for (const c of chip) expect(c.querySelector('svg.bcc-hh')!.getAttribute('data-bac')).toBe(c.getAttribute('data-bac'))
    for (const o of container.querySelectorAll('.bcc-dem-o')) expect(o.querySelector('svg.bcc-hh')!.getAttribute('data-bac')).toBe(o.getAttribute('data-bac'))
    expect(container.querySelector('.bcc-o[data-hien] svg.bcc-hh')!.getAttribute('data-bac')).toBe('3')
  })
  it('tờ chiếu điểm danh: chip từng em + dải chú giải dùng huy hiệu, không emoji, không nút bấm bậc', () => {
    const BUOI = { id: 'BH-1', ten: 'Buổi học 12/10 · 12A1', lop: '12A1', moLuc: '2026-10-12T10:50:00Z', hetHan: '2026-10-13T10:50:00Z', dongLuc: null, dangMo: true }
    const CO_MAT = ['A1', 'A3', 'A4'].map((sbd, i) => ({ sbd, hoTen: DS_EM.find((e) => e.sbd === sbd)!.hoTen, luc: `2026-10-12T10:5${i}:00Z`, cach: 'ma' as const }))
    const TT: TrangThaiBuoi = { buoi: BUOI, ma: '482915', doiMaLuc: 1, coMat: CO_MAT, siSo: DS_EM.length, lopEm: DS_EM.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, tenLop: '12A1' })) }
    for (const cheDo of ['diem-danh', 'nhip-lop'] as const) {
      const { unmount } = render(
        <BanChieuDiemDanh cheDo={cheDo} tt={TT} tk={thongKeBuoi(TT, nhipTheoSbd(KQ))} nhip={{ kq: KQ, dangTai: false, loi: '' }} goc="https://app.test" matKetNoi={false} hoSoMo={false}
          onDoiCheDo={() => {}} onDong={() => {}} onMoEm={() => {}} onThuLaiNhip={() => {}} />,
      )
      // SỬA CÓ CHỦ ĐÍCH 13/10 (đợt 19 làn Q): bản A nay là thẻ em (huy hiệu lớn) + thang 12 bậc `.ddc-thang` thay chip nhỏ + dải `.bcc-dem`
      // SỬA CÓ CHỦ ĐÍCH 23/10 (bản nền sáng, thầy chốt): A = thẻ `.ddv-the` + dải 12 bậc `.ddv-thang`; B = huy hiệu đầu mỗi dòng em (không còn dải chú giải 12 bậc)
      const phan = [...document.querySelectorAll('.ddv-the, .ddv-thang, .ddv-dong-em')]
      expect(phan.length).toBeGreaterThan(1)
      expect(EMOJI.test(phan.map((x) => x.textContent).join(''))).toBe(false)
      if (cheDo === 'diem-danh') expect(document.querySelectorAll('.ddv-thang svg.bcc-hh')).toHaveLength(12)
      else expect(document.querySelectorAll('.ddv-dong-em .ddv-dong-hh svg.bcc-hh').length).toBeGreaterThan(0)
      expect(document.querySelector('.bcc-dem-nut, .bcc-nut')).toBeNull()
      unmount()
    }
  })
})

describe('khoảng điểm của từng bậc (đọc NGUONG_BAC của máy chủ)', () => {
  it('đầu nhóm "dưới", giữa nhóm "a–b", cuối nhóm "từ"; bậc 12 thêm chuỗi 7 ngày', () => {
    expect(BAC_CHAM_CHI.map((b) => chuKhoangDiem(b.so))).toEqual([
      'điểm dưới 8', 'điểm 8–15', 'điểm 16–25', 'điểm 26–35', 'điểm từ 36',
      'điểm dưới 55', 'điểm từ 55',
      'điểm dưới 72', 'điểm 72–81', 'điểm 82–89', 'điểm 90–97', 'điểm từ 98 và đủ mức 7 ngày liền',
    ])
    expect(chuKhoangDiem(0)).toBe('')
  })
})

describe('chip bậc bấm được ⇒ tấm đủ 12 bậc', () => {
  const moTam = async (kq: KetQuaBac, xung?: 'em' | 'con') => {
    render(<NutBac kq={kq} xung={xung} />)
    const nut = screen.getByRole('button', { name: /^Bậc \d+\/12 · .*, xem đủ 12 bậc$/ })
    nut.focus()
    fireEvent.click(nut)
    const tam = await screen.findByRole('dialog', { name: '12 bậc từ Lười đến Chăm' })
    return { nut, tam }
  }
  it('dialog đủ 12 dòng, đúng 3 nhóm 5/2/5, dòng hiện tại đánh dấu + "Em đang ở đây"; "Còn N điểm lên …" đúng; khoá cuộn nền', async () => {
    const { nut, tam } = await moTam({ bac: 3, diem: 23, diemLenBac: 3 })
    expect(tam.getAttribute('aria-modal')).toBe('true')
    expect(nut.getAttribute('aria-haspopup')).toBe('dialog')
    expect(nut.getAttribute('aria-expanded')).toBe('true')
    expect(tam.querySelectorAll('.bcc-tam-bac')).toHaveLength(12)
    const nhom = [...tam.querySelectorAll('.bcc-tam-nhom')]
    expect(nhom.map((n) => n.querySelector('h3')!.textContent)).toEqual(['Lười bậc 1–5', 'Chưa đều bậc 6–7', 'Chăm bậc 8–12'])
    expect(nhom.map((n) => n.querySelectorAll('.bcc-tam-bac').length)).toEqual([5, 2, 5])
    const dong = [...tam.querySelectorAll('.bcc-tam-bac')]
    expect(dong.map((d) => d.getAttribute('data-bac'))).toEqual(BAC_CHAM_CHI.map((b) => String(b.so)))
    for (const [i, d] of dong.entries()) {
      const b = BAC_CHAM_CHI[i]!
      expect(d.textContent).toContain(`Bậc ${b.so}${b.ten}${chuKhoangDiem(b.so)}`)
      expect(d.querySelector('svg.bcc-hh')!.getAttribute('data-bac')).toBe(String(b.so))
    }
    const hien = dong.filter((d) => d.getAttribute('aria-current') === 'true')
    expect(hien).toHaveLength(1)
    expect(hien[0]!.getAttribute('data-bac')).toBe('3')
    expect(hien[0]!.textContent).toContain('Em đang ở đây')
    expect(dong.filter((d) => d.getAttribute('data-trang') === 'qua').map((d) => d.getAttribute('data-bac'))).toEqual(['1', '2'])
    expect(dong.filter((d) => !d.hasAttribute('data-trang'))).toHaveLength(9)
    expect(dong[11]!.textContent).toContain('điểm từ 98 và đủ mức 7 ngày liền')
    // đầu tấm
    const dau = tam.querySelector('.bcc-tam-hien')!
    expect(dau.querySelector(':scope > svg.bcc-hh')!.getAttribute('width')).toBe('80')
    expect(dau.textContent).toContain('Bậc 3/12 · Vua Ngủ Nướng')
    expect(dau.textContent).toContain('Điểm chăm 23/100')
    expect(dau.querySelector('.bcc-len')!.textContent).toBe('Còn 3 điểm lên Chúa Tể Trì Hoãn')
    expect(dau.querySelector('.bcc-len svg.bcc-hh')!.getAttribute('data-bac')).toBe('4')
    expect(tam.querySelector('.bcc-tam-cach')!.textContent).toBe(CHU_CACH_TINH)
    expect(EMOJI.test(tam.textContent!)).toBe(false)
    // tiêu điểm vào nút Đóng, nền khoá cuộn
    expect(document.activeElement).toBe(within(tam).getByRole('button', { name: 'Đóng' }))
    expect(document.body.style.overflow).toBe('hidden')
  })
  it('diemLenBac = null ⇒ không dòng "Còn N điểm"; phụ huynh ⇒ "Con đang ở đây"', async () => {
    const { tam } = await moTam({ bac: 5, diem: 40, diemLenBac: null }, 'con')
    expect(tam.querySelector('.bcc-len')).toBeNull()
    expect(tam.querySelector('[aria-current="true"]')!.textContent).toContain('Con đang ở đây')
    expect(tam.textContent).not.toContain('Em đang ở đây')
  })
  it('Esc đóng và trả tiêu điểm về chip; Esc KHÔNG lan tới tấm Hồ sơ nghe phím ở document', async () => {
    const hoSo = vi.fn()
    document.addEventListener('keydown', hoSo)
    const { nut, tam } = await moTam({ bac: 11, diem: 95, diemLenBac: 3 })
    fireEvent.keyDown(tam, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(hoSo).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(nut)
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    expect(document.body.style.overflow).toBe('')
    document.removeEventListener('keydown', hoSo)
  })
  it('nút Đóng và bấm nền cũng đóng + trả tiêu điểm; Tab vòng trong tấm', async () => {
    const { nut, tam } = await moTam({ bac: 7, diem: 60, diemLenBac: null })
    const dong = within(tam).getByRole('button', { name: 'Đóng' })
    fireEvent.keyDown(dong, { key: 'Tab' })
    expect(document.activeElement).toBe(dong)
    fireEvent.click(dong)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(nut)
    fireEvent.click(nut)
    const tam2 = await screen.findByRole('dialog')
    fireEvent.click(tam2.parentElement!.querySelector('.bcc-tam-che')!)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(nut)
  })
})

describe('thầy · bấm ô dải đếm ⇒ danh sách em của bậc', () => {
  const dong = () => DS_EM.map((e) => phanNhomEm(e, NGAY, HOM_NAY))
  it('ô có em là nút; ô 0 em không bấm được; bấm ⇒ tấm "Bậc N · Tên · K em" đúng em, điểm thấp → cao; bấm em ⇒ hồ sơ; Esc ⇒ về ô', async () => {
    render(<NhipHocThay du={{ ok: true, kq: KQ }} dangTai={false} onThuLai={() => {}} />)
    const the = screen.getByRole('region', { name: '12 bậc từ Lười đến Chăm' })
    const dem = demTheoBac(dong())
    const o = [...the.querySelectorAll('.bcc-dem-o')]
    expect(o).toHaveLength(12)
    o.forEach((x, i) => {
      const nut = x.querySelector('button.bcc-dem-nut')
      if (dem[i]! > 0) {
        expect(nut).toBeTruthy()
        expect(nut!.textContent).toContain(`${dem[i]} em ở Bậc ${i + 1}/12 · ${BAC_CHAM_CHI[i]!.ten} — xem danh sách em`)
      } else {
        expect(nut).toBeNull()
        expect(x.querySelector('button')).toBeNull()
      }
    })
    // bậc có nhiều em nhất
    const i = dem.indexOf(Math.max(...dem))
    const bac = i + 1
    const nut = o[i]!.querySelector<HTMLButtonElement>('button.bcc-dem-nut')!
    nut.focus()
    fireEvent.click(nut)
    const tam = await screen.findByRole('dialog', { name: `Bậc ${bac} · ${BAC_CHAM_CHI[i]!.ten} · ${dem[i]} em` })
    const mong = dong().filter((d) => d.bacCham?.bac === bac).sort(xepTheoBac)
    const the2 = [...tam.querySelectorAll<HTMLButtonElement>('.bcc-ds-em')]
    expect(the2.map((b) => b.getAttribute('data-sbd'))).toEqual(mong.map((d) => d.sbd))
    const diem = mong.map((d) => d.bacCham!.diem)
    expect([...diem].sort((a, b) => a - b)).toEqual(diem)
    for (const [k, b] of the2.entries()) {
      const d = mong[k]!
      expect(b.textContent).toContain(d.hoTen)
      expect(b.textContent).toContain(`${d.bacCham!.diem}điểm chăm`)
      expect(b.textContent).toContain(`Đủ mức ${d.soNgayDu}/${d.soNgayQua} ngày · Chuỗi ${d.chuoiDuGanNhat} ngày`)
    }
    expect(tam.querySelector('.bcc-tam-hien svg.bcc-hh')!.getAttribute('data-bac')).toBe(String(bac))
    // bấm em ⇒ hồ sơ chồng lên; tấm nhường phím (inert)
    fireEvent.click(the2[0]!)
    expect(await screen.findByRole('dialog', { name: `Hồ sơ làm bài ${mong[0]!.hoTen}` })).toBeTruthy()
    expect(tam.closest('.bcc-tam-khung')!.hasAttribute('inert')).toBe(true)
    cleanup()
  })
  it('Esc đóng tấm danh sách và trả tiêu điểm về đúng ô', async () => {
    render(<NhipHocThay du={{ ok: true, kq: KQ }} dangTai={false} onThuLai={() => {}} />)
    const nut = document.querySelector<HTMLButtonElement>('.bcc-dem-nut')!
    nut.focus()
    fireEvent.click(nut)
    const tam = await screen.findByRole('dialog', { name: /^Bậc \d+ · .* · \d+ em$/ })
    fireEvent.keyDown(tam, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(nut)
  })
})
