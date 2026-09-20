// G5 · Giao bài tập về nhà + các màn thầy còn lại (Mở ca, Danh sách lớp, Học sinh hỏi, Ngân hàng đề, Bảng tin thầy) — 21/09.
//  (1) LÔ BTVN: khối "BTVN đang chạy · chia lô theo hạn nộp" dùng chung Hôm nay + Giao BTVN, đọc `dangChay` của lệnh Hôm nay (chỉ đọc).
//  (2) "Giao bài riêng" ở hồ sơ một em → màn Giao BTVN mở sẵn chế độ chọn từng em, đã tick em ấy.
//  (3) Sáu tệp hết mã hex (83 chỗ): màu đi qua token M3, chữ trên nền đặc đi cặp on-*.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import KhoiBtvnLo from '../src/components/KhoiBtvnLo'
import { useAppStore } from '../src/store/appStore'
import type { HomNay } from '../src/lib/hom-nay-api'

afterEach(() => cleanup())
const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')

const BT: NonNullable<HomNay['btvn']> = {
  soEmCoLo: 100,
  soEmDungNhip: 86,
  dangChay: [
    { ma: 'b1', ten: 'Chương 1 · Ester – Lipid', lop: '12A1', soEm: 34, loHienTai: 3, tongLo: 5, soEmKip: 30, han: '2026-09-25T09:00:00' },
    { ma: 'b2', ten: 'Ôn giữa kỳ', lop: '12A2', soEm: 30, loHienTai: 1, tongLo: 4, soEmKip: 15, han: null },
  ],
}

describe('KhoiBtvnLo — lô BTVN', () => {
  it('mỗi bài một dòng: tên · lớp, dải lô (số chấm đầy = lô hiện tại), "lô x/y", % kịp, hạn', () => {
    const { container } = render(<KhoiBtvnLo bt={BT} tai={false} lyDo="đang chờ máy chủ" />)
    const dong = [...container.querySelectorAll('.hn-btvn')]
    expect(dong).toHaveLength(2)
    expect(dong[0].querySelector('.hn-btvn-ten')?.textContent).toBe('Chương 1 · Ester – Lipid · 12A1')
    expect(dong[0].querySelector('.hn-lo')?.getAttribute('aria-label')).toBe('Lô 3 trên 5')
    expect(dong[0].querySelectorAll('.hn-lo i')).toHaveLength(5)
    expect(dong[0].querySelectorAll('.hn-lo i.da')).toHaveLength(3)
    expect(dong[0].querySelector('.hn-btvn-lo')?.textContent).toBe('lô 3/5')
    expect(dong[0].querySelector('.hn-btvn-kip')?.textContent).toBe('88% kịp') // 30/34
    expect(dong[0].querySelector('.hn-btvn-han')?.textContent).toBe('hạn thứ Sáu')
    expect(dong[1].querySelector('.hn-btvn-han')?.textContent).toBe('') // không hạn → không bịa
    expect(container.querySelector('.hn-lien-ket')).toBeNull() // không truyền onGiaoMoi ⇒ không có nút Giao bài mới (đã đứng ở màn Giao bài)
  })

  it('chưa có số: đang tải · lý do máy chủ kèm · chưa có bài nào — không bịa dòng', () => {
    const { rerender, container } = render(<KhoiBtvnLo bt={undefined} tai lyDo="x" />)
    expect(screen.getByText('Đang tải…')).toBeTruthy()
    rerender(<KhoiBtvnLo bt={null as never} tai={false} lyDo="Chưa có kế hoạch ngày hôm nay" />)
    expect(screen.getByText('BTVN đang chạy: Chưa có kế hoạch ngày hôm nay.')).toBeTruthy()
    rerender(<KhoiBtvnLo bt={{ soEmCoLo: 0, soEmDungNhip: 0, dangChay: [] }} tai={false} lyDo="" />)
    expect(screen.getByText('Chưa có bài tập về nhà nào đang chạy.')).toBeTruthy()
    expect(container.querySelectorAll('.hn-btvn')).toHaveLength(0)
  })

  it('nút "Giao bài mới" chỉ có khi được truyền (Hôm nay có, Giao BTVN không)', () => {
    let bam = 0
    render(<KhoiBtvnLo bt={BT} tai={false} lyDo="" onGiaoMoi={() => bam++} />)
    screen.getByRole('button', { name: 'Giao bài mới' }).click()
    expect(bam).toBe(1)
  })

  it('cả hai màn dùng đúng một khối: Hôm nay (có nút Giao bài mới) và Giao BTVN — tab theo dõi, đọc lệnh Hôm nay chỉ đọc', () => {
    expect(doc('src/screens/HomNayScreen.tsx')).toContain('<KhoiBtvnLo bt={bt} tai={tai} lyDo={lyDo(\'btvn\')} onGiaoMoi={() => setScreen(\'giaobtvn\')} />')
    const pc = doc('src/screens/PhanCongScreen.tsx')
    expect(pc).toContain("tabBtvn === 'theodoi' && <KhoiBtvnLo")
    expect(pc).toContain('layHomNay()')
    expect(pc).toContain("homNay?.lyDoThieu?.btvn || 'đang chờ máy chủ'")
  })
})

describe('Giao bài riêng → màn Giao BTVN chọn sẵn em', () => {
  it('store: datSbdGiaoRieng đặt sbd; màn Giao BTVN đọc một lần rồi xoá; đặt chế độ "theo_em" + tab Giao bài mới', () => {
    expect(useAppStore.getState().sbdGiaoRieng).toBe('')
    useAppStore.getState().datSbdGiaoRieng('12121007')
    expect(useAppStore.getState().sbdGiaoRieng).toBe('12121007')
    useAppStore.getState().datSbdGiaoRieng('')
    const pc = doc('src/screens/PhanCongScreen.tsx')
    expect(pc).toContain("setTabBtvn('giao')")
    expect(pc).toContain("setCheDo('theo_em')")
    expect(pc).toContain('setSbdChonTheoEm(new Set([sbdGiaoRieng]))')
    expect(pc).toContain("useAppStore.getState().datSbdGiaoRieng('')")
  })
})

describe('sáu tệp thầy hết mã hex (G5)', () => {
  const TEP = ['src/screens/PhanCongScreen.tsx', 'src/components/BangTinGiaoVien.tsx', 'src/screens/ExamSetupScreen.tsx', 'src/screens/ClassListScreen.tsx', 'src/screens/CauHoiScreen.tsx', 'src/screens/NganHangDeScreen.tsx']
  it.each(TEP)('%s: không mã hex, không hover:bg-[#…]', (f) => {
    expect(doc(f)).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
  it('nền đặc dùng token đi cặp chữ on-* (không để chữ trắng cố định trên nền token đổi theo chế độ tối)', () => {
    for (const f of TEP) {
      for (const dong of doc(f).split('\n')) {
        if (/bg-\[color:var\(--m3-(?:primary|error|tertiary)\)\]/.test(dong) && /\btext-white\b/.test(dong)) throw new Error(`${f}: nền token + text-white cùng dòng: ${dong.trim().slice(0, 120)}`)
      }
    }
  })
})
