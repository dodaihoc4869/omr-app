// SỰ CỐ 07/10: thầy đổi MA_BI_MAT ở Cloudflare, nhập mã mới ở Cài đặt → Kết nối máy chủ → Lưu mà app vẫn 403.
// Gốc: máy có MẬT KHẨU MỞ APP giữ mã trong bộ nhớ phiên (giải từ bản ghi mã hoá) và `loadTeacherSecret()` trả mã ấy, bỏ qua khoá chữ thường;
// nút Lưu cũ chỉ ghi chữ thường ⇒ app gửi mã cũ mãi. Nay Lưu phải: kiểm mã với máy chủ → hỏi mật khẩu mở app → cất BẢN MÃ HOÁ → đặt bộ nhớ phiên.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const m = vi.hoisted(() => ({
  url: { v: 'https://omr.test' },
  mat: { v: 'ma-cu' },
  khoa: { v: null as unknown },
  coPhien: { v: false },
  thuTu: [] as string[],
  saveUrl: vi.fn(),
  saveMat: vi.fn(),
  batKhoa: vi.fn(),
  datPhien: vi.fn(),
  catPhien: vi.fn(),
  kiemMa: vi.fn(),
  moKhoa: vi.fn(),
  datMatKhau: vi.fn(),
  toast: vi.fn(),
}))

vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => m.url.v,
  loadScriptUrlHoacMacDinh: async () => m.url.v || 'https://omr.mac-dinh',
  loadTeacherSecret: async () => m.mat.v,
  loadKhoaApp: async () => m.khoa.v,
  saveScriptUrl: (...a: unknown[]) => m.saveUrl(...a),
  saveTeacherSecret: (...a: unknown[]) => m.saveMat(...a),
  batKhoaApp: async (...a: unknown[]) => {
    m.thuTu.push('batKhoaApp')
    m.batKhoa(...a)
  },
  coMaBiMatPhien: () => m.coPhien.v,
  datMaBiMatPhien: (...a: unknown[]) => m.datPhien(...a),
}))
vi.mock('../src/lib/exam-api', () => ({ lichSuLenBang: (...a: unknown[]) => m.kiemMa(...a) }))
vi.mock('../src/lib/khoa-app', () => ({ moKhoa: (...a: unknown[]) => m.moKhoa(...a), datMatKhau: (...a: unknown[]) => m.datMatKhau(...a) }))
vi.mock('../src/lib/khoa-phien', () => ({
  catPhien: async (...a: unknown[]) => {
    m.thuTu.push('catPhien')
    m.catPhien(...a)
    return true
  },
}))

const { default: KhoiKetNoiKhoDe } = await import('../src/components/KhoiKetNoiKhoDe')

const BAN_GHI = { hoiLai: 'sau_15_phut', soLanSai: 0 }

beforeEach(() => {
  m.url.v = 'https://omr.test'
  m.mat.v = 'ma-cu'
  m.khoa.v = null
  m.coPhien.v = false
  m.thuTu.length = 0
  m.kiemMa.mockResolvedValue({ soNgay: 1, theoEm: {} })
  m.moKhoa.mockResolvedValue('ma-cu')
  m.datMatKhau.mockResolvedValue({ moi: true })
})
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

async function moForm(khoa: unknown = null) {
  m.khoa.v = khoa
  render(<KhoiKetNoiKhoDe showToast={m.toast} />)
  const o = (await screen.findByLabelText('Mã bí mật')) as HTMLInputElement
  await waitFor(() => expect(o.value).toBe('ma-cu'))
  return o
}
const bamLuu = () => fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))

describe('Cài đặt → đổi mã bí mật khi máy ĐÃ đặt mật khẩu mở app', () => {
  it('ô "Mật khẩu mở app" chỉ hiện khi máy có mật khẩu VÀ thầy đang đổi mã', async () => {
    const o = await moForm(BAN_GHI)
    expect(screen.queryByLabelText('Mật khẩu mở app')).toBeNull()
    fireEvent.change(o, { target: { value: 'ma-moi' } })
    expect(screen.getByLabelText('Mật khẩu mở app')).toBeTruthy()
    fireEvent.change(o, { target: { value: 'ma-cu' } })
    expect(screen.queryByLabelText('Mật khẩu mở app')).toBeNull()
  })

  it('máy KHÔNG có mật khẩu: đổi mã không hiện ô mật khẩu mở app', async () => {
    const o = await moForm(null)
    fireEvent.change(o, { target: { value: 'ma-moi' } })
    expect(screen.queryByLabelText('Mật khẩu mở app')).toBeNull()
  })

  it('để trống mật khẩu mở app ⇒ nhắc, KHÔNG gọi máy chủ, KHÔNG cất gì', async () => {
    const o = await moForm(BAN_GHI)
    fireEvent.change(o, { target: { value: 'ma-moi' } })
    bamLuu()
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith(expect.stringMatching(/mật khẩu mở app/), 'warn'))
    expect(m.kiemMa).not.toHaveBeenCalled()
    expect(m.batKhoa).not.toHaveBeenCalled()
    expect(m.saveMat).not.toHaveBeenCalled()
  })

  it('mật khẩu mở app SAI ⇒ báo lỗi, không đổi mã', async () => {
    m.moKhoa.mockResolvedValue(null)
    const o = await moForm(BAN_GHI)
    fireEvent.change(o, { target: { value: 'ma-moi' } })
    fireEvent.change(screen.getByLabelText('Mật khẩu mở app'), { target: { value: 'sai-roi' } })
    bamLuu()
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith(expect.stringMatching(/không đúng/), 'error'))
    expect(m.batKhoa).not.toHaveBeenCalled()
    expect(m.saveMat).not.toHaveBeenCalled()
  })

  it('đúng mật khẩu ⇒ cất BẢN MÃ HOÁ bằng mã mới, không ghi chữ thường, thứ tự bản ghi → chìa phiên, mã mới vào bộ nhớ phiên', async () => {
    const o = await moForm(BAN_GHI)
    fireEvent.change(o, { target: { value: ' ma-moi ' } })
    fireEvent.change(screen.getByLabelText('Mật khẩu mở app'), { target: { value: 'mk-app' } })
    bamLuu()
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith(expect.stringMatching(/Đã lưu mã mới/), 'success'))
    expect(m.kiemMa).toHaveBeenCalledWith('https://omr.test', 'ma-moi', 1)
    expect(m.moKhoa).toHaveBeenCalledWith('mk-app', BAN_GHI)
    expect(m.datMatKhau).toHaveBeenCalledWith('mk-app', 'ma-moi', 'sau_15_phut')
    expect(m.batKhoa).toHaveBeenCalledWith({ moi: true }, 'ma-moi')
    expect(m.saveMat).not.toHaveBeenCalled()
    expect(m.catPhien).toHaveBeenCalledWith('ma-moi')
    expect(m.thuTu).toEqual(['batKhoaApp', 'catPhien'])
    expect(m.datPhien).toHaveBeenLastCalledWith('ma-moi')
    expect(m.saveUrl).toHaveBeenCalledWith('https://omr.test')
    // Ô mật khẩu mở app biến mất sau khi cất xong (mã đã khớp bản mới).
    await waitFor(() => expect(screen.queryByLabelText('Mật khẩu mở app')).toBeNull())
  })

  it('máy chủ đáp 403 ⇒ CHƯA lưu gì, nói rõ mã chưa đúng', async () => {
    m.kiemMa.mockRejectedValue(new Error('Máy chủ trả lỗi HTTP 403'))
    const o = await moForm(BAN_GHI)
    fireEvent.change(o, { target: { value: 'ma-go-nham' } })
    fireEvent.change(screen.getByLabelText('Mật khẩu mở app'), { target: { value: 'mk-app' } })
    bamLuu()
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith(expect.stringMatching(/chưa đúng với máy chủ/), 'error'))
    expect(m.moKhoa).not.toHaveBeenCalled()
    expect(m.batKhoa).not.toHaveBeenCalled()
    expect(m.saveMat).not.toHaveBeenCalled()
    expect(m.saveUrl).not.toHaveBeenCalled()
  })

  it('mạng chậm (lỗi không phải 403) ⇒ vẫn cất, kèm lời nhắc chưa kiểm được', async () => {
    m.kiemMa.mockRejectedValue(new Error('Hết thời gian chờ máy chủ'))
    const o = await moForm(BAN_GHI)
    fireEvent.change(o, { target: { value: 'ma-moi' } })
    fireEvent.change(screen.getByLabelText('Mật khẩu mở app'), { target: { value: 'mk-app' } })
    bamLuu()
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith(expect.stringMatching(/Chưa kiểm được với máy chủ/), 'warn'))
    expect(m.batKhoa).toHaveBeenCalledWith({ moi: true }, 'ma-moi')
    expect(m.saveMat).not.toHaveBeenCalled()
  })

  it('máy có mật khẩu mà CHỈ đổi địa chỉ ⇒ không đòi mật khẩu, không kiểm mã, không ghi chữ thường', async () => {
    await moForm(BAN_GHI)
    fireEvent.change(screen.getByLabelText('Địa chỉ máy chủ'), { target: { value: 'https://omr.khac' } })
    bamLuu()
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith('Đã lưu trên máy này', 'success'))
    expect(m.saveUrl).toHaveBeenCalledWith('https://omr.khac')
    expect(m.kiemMa).not.toHaveBeenCalled()
    expect(m.batKhoa).not.toHaveBeenCalled()
    expect(m.saveMat).not.toHaveBeenCalled()
  })

  it('máy có mật khẩu mà xoá trắng ô mã ⇒ giữ mã cũ, không ghi chữ thường', async () => {
    const o = await moForm(BAN_GHI)
    fireEvent.change(o, { target: { value: '' } })
    bamLuu()
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith(expect.stringMatching(/giữ nguyên mã cũ/), 'warn'))
    expect(m.batKhoa).not.toHaveBeenCalled()
    expect(m.saveMat).not.toHaveBeenCalled()
  })
})

describe('Cài đặt → đổi mã bí mật khi máy CHƯA đặt mật khẩu mở app', () => {
  it('máy chủ đáp 403 ⇒ CHƯA lưu', async () => {
    m.kiemMa.mockRejectedValue(new Error('Máy chủ trả lỗi HTTP 403'))
    const o = await moForm(null)
    fireEvent.change(o, { target: { value: 'ma-go-nham' } })
    bamLuu()
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith(expect.stringMatching(/chưa đúng với máy chủ/), 'error'))
    expect(m.saveMat).not.toHaveBeenCalled()
    expect(m.saveUrl).not.toHaveBeenCalled()
  })

  it('mã đúng ⇒ ghi chữ thường như cũ; bộ nhớ phiên đang giữ mã cũ (vừa gỡ mật khẩu) thì cập nhật luôn', async () => {
    m.coPhien.v = true
    const o = await moForm(null)
    fireEvent.change(o, { target: { value: 'ma-moi' } })
    bamLuu()
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith('Đã lưu trên máy này', 'success'))
    expect(m.saveMat).toHaveBeenCalledWith('ma-moi')
    expect(m.datPhien).toHaveBeenCalledWith('ma-moi')
    expect(m.batKhoa).not.toHaveBeenCalled()
  })

  it('bộ nhớ phiên trống ⇒ không đụng tới bộ nhớ phiên', async () => {
    m.coPhien.v = false
    const o = await moForm(null)
    fireEvent.change(o, { target: { value: 'ma-moi' } })
    bamLuu()
    await waitFor(() => expect(m.saveMat).toHaveBeenCalledWith('ma-moi'))
    expect(m.datPhien).not.toHaveBeenCalled()
  })
})
