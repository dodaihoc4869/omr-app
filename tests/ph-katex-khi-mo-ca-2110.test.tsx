// KaTeX ở cổng phụ huynh (21/10): không tải nền khi mở app (/ph); màn Chi tiết ca kiểm tra tự tải ngay lúc mở, song song với lượt tải báo cáo.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'

const nap = vi.hoisted(() => ({ napKatex: vi.fn(() => Promise.resolve({} as never)) }))
vi.mock('../src/lib/chem-format', async (goc) => ({ ...(await goc<typeof import('../src/lib/chem-format')>()), napKatex: nap.napKatex }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/ph-token', () => ({ docPass: () => '' }))
afterEach(() => { cleanup(); vi.unstubAllGlobals(); nap.napKatex.mockClear() })

const doc = (p: string) => fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8')

describe('KaTeX cổng phụ huynh', () => {
  it('mở màn Chi tiết ca ⇒ gọi napKatex NGAY (trước khi báo cáo về), đúng một lần', async () => {
    let traBaoCao!: (r: Response) => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((r) => { traBaoCao = r })))
    const { default: ManChiTietCa } = await import('../src/components/ph-v3/ManChiTietCa')
    render(<ManChiTietCa sbd="A" maCa="CA-1" />)
    await waitFor(() => expect(nap.napKatex).toHaveBeenCalledTimes(1))
    // báo cáo chưa về mà KaTeX đã bắt đầu tải
    expect(screen.queryByText('Ca đã công bố')).toBeNull()
    traBaoCao(Response.json({ ok: true, ca: { maCa: 'CA-1', tenCa: 'Ca đã công bố', nopLuc: '2026-10-13T10:00:00Z' }, congBo: { congBo: 'ngay', daCongBo: true, soEmDaNop: 1, soEmDaVao: 1 }, ketQua: { tong: 7, soCau: 1, soCauDung: 0 }, cauCanXemLai: [] }))
    await waitFor(() => expect(screen.queryByText(/Đang mở báo cáo/)).toBeNull())
    expect(nap.napKatex).toHaveBeenCalledTimes(1)
  })
  it('napKatex hỏng (mạng) không làm sập màn: lỗi bị nuốt', async () => {
    nap.napKatex.mockImplementationOnce(() => Promise.reject(new Error('mất mạng')))
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})))
    const { default: ManChiTietCa } = await import('../src/components/ph-v3/ManChiTietCa')
    expect(() => render(<ManChiTietCa sbd="A" maCa="CA-2" />)).not.toThrow()
    await waitFor(() => expect(nap.napKatex).toHaveBeenCalled())
  })
  it('main.tsx: /ph không còn tải KaTeX nền; học sinh / thi / phiếu / đường khác giữ nguyên', () => {
    const m = doc('src/main.tsx')
    expect(m).toContain("else if (dv.vai === 'phuhuynh') { /* không tải KaTeX nền */ }")
    const nhanh = m.indexOf("else if (dv.vai === 'phuhuynh') { /* không tải KaTeX nền */ }")
    expect(nhanh).toBeGreaterThan(m.indexOf('else if (canCongThucNgay) void napKatex()'))
    expect(nhanh).toBeLessThan(m.lastIndexOf('else napKhiRanh()'))
    // các nhánh khác y như cũ (khoá cũ ở may-yeu-mo-app-1310)
    expect(m).toContain("if (huaMan && dv.vai === 'hocsinh') void huaMan.then(napKhiRanh, napKhiRanh)")
    expect(m).toContain('else if (huaMan) void huaMan.then(napKatex, napKatex)')
    expect(m).toContain('const canCongThucNgay = !!dv.maCa || dv.vai === \'diem\' || dv.vai === \'hocsinh\' || dv.vai === \'phieu\' || laHoiThay')
  })
  it('ManChiTietCa là màn DUY NHẤT của app phụ huynh vẽ công thức (không có chỗ nào khác phụ thuộc KaTeX nền)', () => {
    const dung = ['src/components/ph-v3', 'src/lib/ph-moi', 'src/lib/ph-v3', 'src/components/ph-moi'].flatMap((d) => {
      const abs = path.resolve(__dirname, '..', d)
      return fs.existsSync(abs) ? fs.readdirSync(abs).filter((f) => /\.(tsx?|ts)$/.test(f)).filter((f) => /chem-format|ChemText|katex/i.test(fs.readFileSync(path.join(abs, f), 'utf8'))).map((f) => `${d}/${f}`) : []
    })
    expect(dung.sort()).toEqual(['src/components/ph-v3/AppPhuHuynh.tsx', 'src/components/ph-v3/ManChiTietCa.tsx'])
  })
})
