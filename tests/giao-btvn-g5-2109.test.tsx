// G5 · Giao bài tập về nhà + các màn thầy còn lại (Mở ca, Danh sách lớp, Học sinh hỏi, Ngân hàng đề, Bảng tin thầy) — 21/09.
//  (1) LÔ BTVN: khối "BTVN đang chạy · chia lô theo hạn nộp" dùng chung Hôm nay + Giao BTVN, đọc `dangChay` của lệnh Hôm nay (chỉ đọc).
//  (2) "Giao bài riêng" ở hồ sơ một em → màn Giao BTVN mở sẵn chế độ chọn từng em, đã tick em ấy.
//  (3) Sáu tệp hết mã hex (83 chỗ): màu đi qua token M3, chữ trên nền đặc đi cặp on-*.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { useAppStore } from '../src/store/appStore'

afterEach(() => cleanup())
const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')

describe('khối lô BTVN (KhoiBtvnLo đã gỡ 27/10 — chỉ còn soát màn sống)', () => {
  it('khối lô BTVN nay CHỈ ở màn Giao BTVN — tab theo dõi, đọc lệnh Hôm nay chỉ đọc; màn Hôm nay bản 2 đã thay bằng ô Việc gấp (thầy lệnh 21/09, sửa CÓ CHỦ Ý)', () => {
    expect(doc('src/screens/HomNayCu.tsx')).not.toContain('KhoiBtvnLo')
    expect(doc('src/screens/HomNayCu.tsx')).toContain('<ViecGap />')
    const pc = doc('src/screens/PhanCongScreen.tsx')
    // Thiết kế lại 21/09 (thầy chốt 18:1x, đề prompt-btvn-da-giao-thiet-ke-lai-2109.md §1.E): mục "Bài tập về nhà đã giao" KHÔNG còn dựng KhoiBtvnLo (bốn bài hiện hai lần) — sửa CÓ CHỦ Ý.
    expect(pc).not.toContain('KhoiBtvnLo')
    expect(pc).not.toContain('layHomNay()')
    expect(pc).toContain('<KhungBtvnDaGiao')
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

describe('năm tệp thầy hết mã hex (G5; BangTinGiaoVien đã xoá 21/09 vì là mã chết)', () => {
  const TEP = ['src/screens/PhanCongScreen.tsx', 'src/screens/ExamSetupScreen.tsx', 'src/screens/ClassListScreen.tsx', 'src/screens/CauHoiScreen.tsx', 'src/screens/NganHangDeScreen.tsx']
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
