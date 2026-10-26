import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, renderHook } from '@testing-library/react'
import AppPhuHuynh from '../src/components/ph-v3/AppPhuHuynh'
import { useTatCaVeCon } from '../src/lib/ph-moi/use-tat-ca-ve-con'
import { KHOA_PH_PASS, luuPass, xoaPass } from '../src/lib/ph-token'
import { hoc2Gia, loiThayGia, nhipGia, tatCaGia, tongQuanGia } from '../scripts/chup-ph-dot19/gia'
import './_ph-nap-trang-cu' // trang cũ nạp lười (26/10): chờ mảnh về trước các test

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => diaChi }))
vi.mock('../src/lib/tai-thong-tin-ph', () => ({ taiThongTinPhuHuynh: async () => ({ canhBao: [] }) }))
let diaChi = 'https://may.test'
let tra: Record<string, unknown>
let goi: { duong: string; url: string; pass: string }[]
let cho: { pass: string; xong: () => void }[]
let giu: boolean
const TAT_CA = '/ph/tat-ca-ve-con'
const PHU = ['/ph/hoc-2', '/ph/con-tong-quan', '/ph/loi-thay', '/ph/nhip-hoc']
beforeEach(() => {
  xoaPass(); localStorage.clear()
  diaChi = 'https://may.test'
  tra = { [TAT_CA]: tatCaGia(), '/ph/hoc-2': hoc2Gia(), '/ph/con-tong-quan': tongQuanGia(), '/ph/loi-thay': loiThayGia(), '/ph/nhip-hoc': nhipGia() }
  goi = []; cho = []; giu = true
  window.history.replaceState(null, '', '/ph')
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} })
  vi.stubGlobal('fetch', vi.fn((url: string, o: RequestInit) => {
    const duong = new URL(url).pathname, pass = JSON.parse(String(o.body)).pass
    goi.push({ duong, url, pass })
    const body = tra[duong], res = { ok: true, status: 200, json: async () => body }
    return giu ? new Promise(resolve => cho.push({ pass, xong: () => resolve(res) })) : Promise.resolve(res)
  }))
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); xoaPass(); localStorage.clear() })
const doi = async () => { await act(async () => {}) }

describe('phiên đọc phụ huynh theo liên kết, dùng các helper thật', () => {
  it.each(['trong-tab', 'tab-khac', 'may-chan-luu'])('cùng SBD đổi pass qua %s nạp ngay đủ năm khối, bỏ cả lượt cũ về muộn', async (kenh) => {
    if (kenh === 'may-chan-luu') vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Máy chặn lưu', 'SecurityError') })
    luuPass('PASS-A')
    const r = render(<AppPhuHuynh sbd="A" hoTen="Em A" lop="12A1" onDoiSbd={() => {}} />)
    await doi()
    expect(goi).toHaveLength(5)
    giu = false
    diaChi = 'https://may-moi.test'
    const nx = loiThayGia()
    tra[TAT_CA] = { ...tatCaGia(), hoTen: 'Nguyễn Minh An' }
    tra['/ph/hoc-2'] = { ...hoc2Gia(), hanhTrinh: { tang: 4, toiThieu: 30 } }
    tra['/ph/con-tong-quan'] = { ...tongQuanGia(), goiY: [{ ma: 'nhanh-sai', chu: 'Số liệu mới của An.' }] }
    tra['/ph/loi-thay'] = { ...nx, nhanXet: [{ ...nx.nhanXet[0], noiDung: 'Nhận xét mới cho An.' }] }
    tra['/ph/nhip-hoc'] = { ...nhipGia(), doTinCay: 95 }
    await act(async () => {
      if (kenh === 'tab-khac') {
        localStorage.setItem(KHOA_PH_PASS, 'PASS-B')
        window.dispatchEvent(new StorageEvent('storage', { key: KHOA_PH_PASS, oldValue: 'PASS-A', newValue: 'PASS-B', storageArea: localStorage }))
      } else luuPass('PASS-B')
    })
    expect(goi).toHaveLength(10)
    for (const d of [TAT_CA, ...PHU]) expect(goi.filter((x) => x.duong === d)).toHaveLength(2)
    expect(goi.slice(5).every(x => x.pass === 'PASS-B' && x.url.startsWith(diaChi))).toBe(true)
    await act(async () => cho.forEach(x => x.xong()))
    expect(r.container.textContent).toContain('Nguyễn Minh An')
    expect(r.container.querySelector('[data-vung="anh-hung"]')?.textContent).toContain('Hành trình của con: tầng Tổng hợp')
    expect(r.container.querySelector('[data-vung="goi-y-nhac"]')?.textContent).toContain('Số liệu mới của An.')
    expect(r.container.querySelector('[data-vung="loi-thay-moi"]')?.textContent).toContain('Nhận xét mới cho An.')
    expect(r.container.querySelector('[data-vung="nhip-hoc-con"]')?.textContent).toContain('95%')
    expect(r.container.textContent).not.toContain('Nguyễn Minh Khôi')
    expect(r.container.outerHTML).not.toMatch(/PASS-A|PASS-B/)
  })

  it('hook dùng riêng cũng không gộp yêu cầu mới vào lượt của pass cũ và không giữ báo cáo cũ', async () => {
    giu = false
    luuPass('PASS-A')
    const { result } = renderHook(() => useTatCaVeCon('A'))
    await doi()
    expect(result.current.pm?.hoTen).toBe('Nguyễn Minh Khôi')
    giu = true
    diaChi = 'https://may-moi.test'
    tra[TAT_CA] = { ...tatCaGia(), hoTen: 'Nguyễn Minh An' }
    await act(async () => luuPass('PASS-B'))
    expect(result.current.pm).toBeNull()
    expect(goi.at(-1)).toMatchObject({ pass: 'PASS-B', url: 'https://may-moi.test/ph/tat-ca-ve-con' })
    const cu = cho.splice(0)
    await act(async () => luuPass('PASS-C'))
    expect(goi).toHaveLength(3)
    await act(async () => cho.forEach(x => x.xong()))
    const pm = result.current.pm
    expect(pm?.hoTen).toBe('Nguyễn Minh An')
    await act(async () => cu.forEach(x => x.xong()))
    expect(result.current.pm).toBe(pm)
  })
})
