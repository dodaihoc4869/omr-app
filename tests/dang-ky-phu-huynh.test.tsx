// ĐĂNG KÝ PHỤ HUYNH — hai lỗi thầy chụp màn hình:
//
// 1. App chỉ dùng 4 chữ số NĂM để sinh mã phụ huynh, nhưng ô lại bắt nhập NGÀY
//    SINH đầy đủ. Ngày và tháng thu về rồi vứt đi — thu thập quá mức cần cho
//    tính năng, mà đây là dữ liệu của trẻ vị thành niên. Lại còn lệch với ô
//    "Năm sinh" mà chính em đã điền lúc đăng ký.
// 2. Thông báo nền màu đặc, chữ đậm, bo tròn, nằm ngay dưới nút "Đăng ký" —
//    nhìn hệt một nút thứ hai.
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Toast from '../src/components/Toast'
import { useAppStore } from '../src/store/appStore'
import manParent from '../src/screens/ParentScreen.tsx?raw'
import manStudent from '../src/screens/StudentProfileScreen.tsx?raw'
import maToast from '../src/components/Toast.tsx?raw'

describe('Ô năm sinh của con', () => {
  it('màn phụ huynh hỏi NĂM SINH, không hỏi ngày sinh đầy đủ', () => {
    expect(manParent).toContain('Năm sinh của con')
    expect(manParent).not.toContain('Ngày sinh của con')
    expect(manParent).not.toContain('type="date"')
  })

  it('cùng cách hỏi với màn học sinh — hai bên không lệch nhau', () => {
    for (const ma of [manParent, manStudent]) {
      expect(ma).toContain('Vd 2010')
    }
  })

  it('chỉ nhận 4 chữ số, chặn chữ và ký tự lạ ngay khi gõ', () => {
    expect(manParent).toContain("replace(/[^0-9]/g, '')")
    expect(manParent).toContain('maxLength={4}')
    expect(manParent).toContain('/^\\d{4}$/')
  })
})

describe('Thông báo không được nhìn như nút bấm', () => {
  const hien = (kind: 'success' | 'warn' | 'error', text: string) => {
    useAppStore.getState().showToast(text, kind)
    return render(<Toast />)
  }

  it('là vùng thông báo cho trình đọc màn hình, không phải nút', () => {
    const { container } = hien('warn', 'Chưa có hồ sơ với số điện thoại này')
    expect(container.querySelector('[role="status"]')).toBeTruthy()
    expect(container.querySelectorAll('button').length).toBe(0)
    expect(screen.getByText('Chưa có hồ sơ với số điện thoại này')).toBeTruthy()
  })

  it('nền dùng màu MỰC, khác hẳn nút chính — không lẫn được', () => {
    const { container } = hien('error', 'Đăng ký thất bại')
    const hop = container.querySelector('[role="status"] > div') as HTMLElement
    expect(hop.style.background).toBe('var(--muc)')
  })

  it('mỗi loại một biểu tượng riêng, không chỉ khác mỗi màu nền', () => {
    for (const k of ['success', 'warn', 'error'] as const) {
      const { container } = hien(k, 'thử')
      expect(container.querySelector('svg'), k).toBeTruthy()
    }
  })

  it('không tự đóng quá nhanh — phụ huynh lớn tuổi cần thời gian đọc', () => {
    expect(maToast).toContain('2600')
  })
})
