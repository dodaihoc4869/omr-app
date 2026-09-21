// G9 · HỘP XÁC NHẬN M3 của app giáo viên (components/HopXacNhan.tsx) — thay confirm()/prompt() của trình duyệt.
// Luật soi: nút xác nhận mang TÊN VIỆC; tiêu điểm vào Huỷ (an toàn) hoặc ô gõ; Esc/nền = Huỷ (trừ lúc đang làm); Tab quay vòng; trả tiêu điểm về nút đã mở;
// việc nguy hiểm cần gõ ĐÚNG giá trị (cắt khoảng trắng) mới bật nút; Enter ở ô gõ chỉ xác nhận khi khớp.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import HopXacNhan from '../src/components/HopXacNhan'

afterEach(() => cleanup())

const ve = (o: Partial<Parameters<typeof HopXacNhan>[0]> = {}) => {
  const onXacNhan = vi.fn()
  const onHuy = vi.fn()
  const r = render(<HopXacNhan tieuDe="Đặt lại mật khẩu?" noiDung={<p>Nội dung hỏi.</p>} nhanXacNhan="Đặt lại mật khẩu" onXacNhan={onXacNhan} onHuy={onHuy} {...o} />)
  return { ...r, onXacNhan, onHuy }
}

describe('HopXacNhan · khung và nút', () => {
  it('là alertdialog có tên = tiêu đề và mô tả = nội dung; nút Huỷ + nút mang tên việc (không "OK"/"Cancel")', () => {
    ve()
    const hop = screen.getByRole('alertdialog', { name: 'Đặt lại mật khẩu?' })
    expect(hop.getAttribute('aria-modal')).toBe('true')
    expect(hop.getAttribute('aria-describedby')).toBeTruthy()
    expect(document.getElementById(hop.getAttribute('aria-describedby')!)!.textContent).toBe('Nội dung hỏi.')
    expect(screen.getByRole('button', { name: 'Huỷ' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Đặt lại mật khẩu' })).toBeTruthy()
    expect(hop.textContent).not.toMatch(/\bOK\b|Cancel/)
  })

  it('bấm nút xác nhận gọi onXacNhan; bấm Huỷ gọi onHuy; tên nút Huỷ đổi được', () => {
    const r = ve({ nhanHuy: 'Không xoá' })
    fireEvent.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }))
    expect(r.onXacNhan).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Không xoá' }))
    expect(r.onHuy).toHaveBeenCalledTimes(1)
  })

  it('việc nguy hiểm: nút xác nhận có lớp nguy hiểm; việc thường thì không', () => {
    ve({ nguyHiem: true })
    expect(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }).className).toContain('hxn-nut--nguy-hiem')
    cleanup()
    ve()
    expect(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }).className).not.toContain('hxn-nut--nguy-hiem')
  })

  it('bấm nền = Huỷ (nút nền ẩn khỏi trình đọc màn hình, ngoài vòng Tab)', () => {
    const r = ve()
    const nen = document.querySelector('.hxn-man') as HTMLButtonElement
    expect(nen.tabIndex).toBe(-1)
    expect(nen.getAttribute('aria-hidden')).toBe('true')
    fireEvent.click(nen)
    expect(r.onHuy).toHaveBeenCalledTimes(1)
  })
})

describe('HopXacNhan · bàn phím và tiêu điểm', () => {
  it('mở ra thì tiêu điểm vào nút Huỷ (lựa chọn an toàn); đóng thì trả tiêu điểm về nút đã mở hộp', () => {
    const nutMo = document.createElement('button')
    document.body.appendChild(nutMo)
    nutMo.focus()
    const r = ve()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Huỷ' }))
    r.unmount()
    expect(document.activeElement).toBe(nutMo)
    nutMo.remove()
  })

  it('Esc = Huỷ; phím khác không; gỡ bộ nghe khi đóng', () => {
    const r = ve()
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(r.onHuy).not.toHaveBeenCalled()
    const khongChan = fireEvent.keyDown(document, { key: 'Escape' })
    expect(khongChan).toBe(false) // Esc đã được xử lý ở đây, không để trình duyệt/lớp dưới xử lý thêm
    expect(r.onHuy).toHaveBeenCalledTimes(1)
    r.unmount()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(r.onHuy).toHaveBeenCalledTimes(1)
  })

  it('Tab quay vòng trong hộp: từ nút cuối về nút đầu, Shift+Tab từ nút đầu về nút cuối', () => {
    ve()
    const huy = screen.getByRole('button', { name: 'Huỷ' })
    const viec = screen.getByRole('button', { name: 'Đặt lại mật khẩu' })
    viec.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(huy)
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(viec)
    // Shift+Tab ở nút CUỐI (đang đi ngược) và Tab ở nút ĐẦU: để trình duyệt tự đi, không chặn, không nhảy vòng
    viec.focus()
    expect(fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })).toBe(true)
    expect(document.activeElement).toBe(viec)
    huy.focus()
    expect(fireEvent.keyDown(document, { key: 'Tab' })).toBe(true)
    expect(document.activeElement).toBe(huy)
    // giữa hộp thì để trình duyệt tự đi (không chặn)
    huy.focus()
  })

  it('đang làm: Esc, nền và Huỷ đều KHÔNG đóng; nút xác nhận tắt và hiện chữ đang làm (tuỳ chỉnh được)', () => {
    const r = ve({ dangLam: true, nhanDangLam: 'Đang đặt lại…' })
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(document.querySelector('.hxn-man') as HTMLElement)
    expect((screen.getByRole('button', { name: 'Huỷ' }) as HTMLButtonElement).disabled).toBe(true)
    expect(r.onHuy).not.toHaveBeenCalled()
    const nut = screen.getByRole('button', { name: 'Đang đặt lại…' }) as HTMLButtonElement
    expect(nut.disabled).toBe(true)
    fireEvent.click(nut)
    expect(r.onXacNhan).not.toHaveBeenCalled()
  })

  it('đang làm không có chữ riêng ⇒ "Đang làm…"; Tab lúc mọi nút đều tắt không lỗi và không bị chặn', () => {
    ve({ dangLam: true })
    expect(screen.getByRole('button', { name: 'Đang làm…' })).toBeTruthy()
    expect(fireEvent.keyDown(document, { key: 'Tab' })).toBe(true)
  })
})

describe('HopXacNhan · bắt gõ đúng giá trị', () => {
  const co = (o: Partial<Parameters<typeof HopXacNhan>[0]> = {}) => ve({ nhanXacNhan: 'Xoá khỏi danh sách', tieuDe: 'Xoá?', yeuCauGo: { nhan: 'Gõ đúng số báo danh 12345 để xoá', giaTri: '12345' }, ...o })

  it('có ô gõ có nhãn; tiêu điểm vào ô gõ; nút xác nhận tắt cho tới khi gõ ĐÚNG (bỏ khoảng trắng đầu/cuối, phân biệt từng ký tự)', () => {
    const r = co()
    const o = screen.getByLabelText('Gõ đúng số báo danh 12345 để xoá') as HTMLInputElement
    expect(document.activeElement).toBe(o)
    const nut = screen.getByRole('button', { name: 'Xoá khỏi danh sách' }) as HTMLButtonElement
    expect(nut.disabled).toBe(true)
    for (const sai of ['', '1234', '123456', '12346', ' 1 2345']) {
      fireEvent.change(o, { target: { value: sai } })
      expect(nut.disabled, `"${sai}"`).toBe(true)
    }
    fireEvent.click(nut)
    expect(r.onXacNhan).not.toHaveBeenCalled()
    fireEvent.change(o, { target: { value: '  12345  ' } })
    expect(nut.disabled).toBe(false)
    fireEvent.click(nut)
    expect(r.onXacNhan).toHaveBeenCalledTimes(1)
  })

  it('Enter ở ô gõ: chỉ xác nhận khi đã khớp; chưa khớp thì không làm gì', () => {
    const r = co()
    const o = screen.getByLabelText('Gõ đúng số báo danh 12345 để xoá')
    fireEvent.keyDown(o, { key: 'Enter' })
    expect(r.onXacNhan).not.toHaveBeenCalled()
    fireEvent.change(o, { target: { value: '12345' } })
    fireEvent.keyDown(o, { key: 'Enter' })
    expect(r.onXacNhan).toHaveBeenCalledTimes(1)
  })

  it('Tab quay vòng qua cả ô gõ (ô → Huỷ → nút xác nhận khi đã bật)', () => {
    co()
    const o = screen.getByLabelText('Gõ đúng số báo danh 12345 để xoá')
    fireEvent.change(o, { target: { value: '12345' } })
    const viec = screen.getByRole('button', { name: 'Xoá khỏi danh sách' })
    viec.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(o) // vòng về phần tử đầu = ô gõ
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(viec)
  })

  it('không có yeuCauGo ⇒ không có ô gõ và nút xác nhận bật ngay', () => {
    ve()
    expect(document.querySelector('.hxn-go')).toBeNull()
    expect((screen.getByRole('button', { name: 'Đặt lại mật khẩu' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('đang làm thì Enter không xác nhận lần hai', () => {
    const r = co({ dangLam: true })
    const o = screen.getByLabelText('Gõ đúng số báo danh 12345 để xoá')
    fireEvent.change(o, { target: { value: '12345' } })
    fireEvent.keyDown(o, { key: 'Enter' })
    expect(r.onXacNhan).not.toHaveBeenCalled()
  })
})

describe('HopXacNhan · nguồn', () => {
  it('CSS: không mã màu thô; đích chạm ≥ 48 px; chữ ≥ 14 px; hoạt ảnh ≤ 300 ms và chỉ khi không giảm chuyển động', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/components/hop-xac-nhan.css'), 'utf8')
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).toMatch(/\.hxn-nut \{[^}]*min-height: 48px/)
    expect(css).toMatch(/\.hxn-go input \{[^}]*min-height: 48px/)
    const cx = [...css.matchAll(/font-size: (\d+)px/g)].map((m) => Number(m[1]))
    expect(Math.min(...cx)).toBeGreaterThanOrEqual(14)
    const ms = [...css.matchAll(/animation: [\w-]+ (\d+)ms/g)].map((m) => Number(m[1]))
    expect(ms.length).toBeGreaterThan(0)
    expect(Math.max(...ms)).toBeLessThanOrEqual(300)
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\) \{\s*\.hxn-hop \{/)
  })

  it('component không dùng div/span bấm được (mọi thứ bấm là button)', () => {
    const tsx = fs.readFileSync(path.join(process.cwd(), 'src/components/HopXacNhan.tsx'), 'utf8')
    expect(tsx).not.toMatch(/<(div|span)[^>]*onClick/)
  })
})
