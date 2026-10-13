// CHUYỂN MÀN NHANH APP HỌC SINH (05/10 — thầy: "nhanh gấp 2 lần", giữ nguyên giao diện): bộ dụng cụ nạp trước / gọi sớm
// (src/components/hoa2/nap-truoc-man.ts, man-sanh-luoi.ts) và luật "SỐ LỆNH TỚI MÁY CHỦ KHÔNG ĐỔI": lệnh bắn sớm lúc em chạm cửa
// được màn nhận lại ở lượt gọi đầu, không gọi lần hai; Game hỏi `profile` và `hoa2-sanh` song song (trước nối tiếp).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, render, screen, waitFor } from '@testing-library/react'
import { Suspense } from 'react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'http://may-chu.thu' }))
import { boNap, lazyNapTruoc, napTruocLanLuot, nenNapTruoc, taoGoiSom } from '../src/components/hoa2/nap-truoc-man'
import { boCuaNhanh, napManCauDaLam } from '../src/components/hoa2/man-sanh-luoi'
import CauDaLam from '../src/components/hoa2/CauDaLam'

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('bộ dụng cụ nạp trước / gọi sớm (nap-truoc-man.ts)', () => {
  it('boNap: gọi nhiều lần vẫn MỘT lượt tải; san() có mô-đun sau khi về; tải hỏng thì quên để lần sau thử lại', async () => {
    const m = { default: 1 }
    const nap = vi.fn<() => Promise<typeof m>>().mockRejectedValueOnce(new Error('mạng')).mockResolvedValue(m)
    const bo = boNap(nap)
    await expect(bo()).rejects.toThrow('mạng')
    expect(bo.san()).toBeNull()
    const [a, b] = await Promise.all([bo(), bo()])
    expect(a).toBe(m)
    expect(b).toBe(m)
    expect(nap).toHaveBeenCalledTimes(2)
    expect(bo.san()).toBe(m)
  })

  it('taoGoiSom: bắn MỘT lần mỗi khoá, nhận MỘT lần; lệnh hỏng / quá hạn ⇒ null (màn tự gọi như cũ); xoa() bỏ hết', async () => {
    const kho = taoGoiSom<number>()
    const goi = vi.fn(async () => 7)
    kho.ban('a', goi)
    kho.ban('a', goi) // chạm hai lần liền: không bắn lại
    expect(goi).toHaveBeenCalledTimes(1)
    const hua = kho.nhan('a')
    expect(hua).not.toBeNull()
    expect(await hua).toBe(7)
    expect(kho.nhan('a')).toBeNull() // nhận rồi thì thôi — lượt gọi sau của màn đi đường thường
    kho.ban('b', async () => {
      throw new Error('mất mạng')
    })
    await new Promise((ok) => setTimeout(ok, 0))
    expect(kho.nhan('b')).toBeNull()
    kho.ban('c', goi)
    kho.xoa()
    expect(kho.nhan('c')).toBeNull()
    const hetHan = taoGoiSom<number>(0)
    hetHan.ban('d', goi)
    expect(hetHan.nhan('d')).toBeNull()
  })

  it('napTruocLanLuot: lần lượt từng mảnh qua `hen`; con() sai ⇒ dừng trước mảnh kế, gọi lại với cùng hàng thì đi tiếp; một mảnh hỏng ⇒ bỏ cả hàng', async () => {
    const thu: string[] = []
    let duoc = true
    const manh = (ten: string, sau?: () => void) => () => {
      thu.push(ten)
      sau?.()
      return Promise.resolve(ten)
    }
    const hen = (viec: () => void) => {
      thu.push('rảnh')
      viec()
    }
    const hang = [manh('a', () => (duoc = false)), manh('b'), manh('c')]
    await napTruocLanLuot(hang, hen, () => duoc)
    expect(thu).toEqual(['rảnh', 'a'])
    expect(hang).toHaveLength(2)
    duoc = true
    await napTruocLanLuot(hang, hen, () => duoc)
    expect(thu).toEqual(['rảnh', 'a', 'rảnh', 'b', 'rảnh', 'c'])
    expect(hang).toHaveLength(0)
    const hong = [() => Promise.reject(new Error('mạng')), manh('y')]
    await napTruocLanLuot(hong, hen)
    expect(thu).not.toContain('y')
    expect(hong).toHaveLength(0)
  })

  it('nenNapTruoc: mất mạng / tiết kiệm dữ liệu / 2G ⇒ không nạp trước; còn lại thì nạp', () => {
    expect(nenNapTruoc({ onLine: false } as Navigator)).toBe(false)
    expect(nenNapTruoc({ onLine: true, connection: { saveData: true } } as unknown as Navigator)).toBe(false)
    expect(nenNapTruoc({ onLine: true, connection: { effectiveType: '2g' } } as unknown as Navigator)).toBe(false)
    expect(nenNapTruoc({ onLine: true, connection: { effectiveType: 'slow-2g' } } as unknown as Navigator)).toBe(false)
    expect(nenNapTruoc({ onLine: true, connection: { effectiveType: '4g' } } as unknown as Navigator)).toBe(true)
    expect(nenNapTruoc({ onLine: true } as Navigator)).toBe(true)
  })

  it('lazyNapTruoc: mảnh chưa nạp ⇒ đi đúng đường lazy cũ (màn chờ rồi mới hiện); mảnh đã nạp ⇒ vẽ thẳng, không màn chờ', async () => {
    const Man = ({ chu }: { chu: string }) => <p>{chu}</p>
    const C = lazyNapTruoc(boNap(async () => ({ default: Man })))
    render(
      <Suspense fallback={<p>đang chờ</p>}>
        <C chu="lần một" />
      </Suspense>,
    )
    expect(screen.getByText('đang chờ')).toBeTruthy()
    await screen.findByText('lần một')
    cleanup()
    await C.napTruoc()
    render(
      <Suspense fallback={<p>đang chờ</p>}>
        <C chu="lần hai" />
      </Suspense>,
    )
    expect(screen.getByText('lần hai')).toBeTruthy()
    expect(screen.queryByText('đang chờ')).toBeNull()
  })
})

describe('Câu đã làm: chạm cửa ở Sảnh bắn ngay lệnh danh sách (mảnh đã nạp trước); màn nhận lại — không tải hai lần', () => {
  it('mảnh CHƯA nạp ⇒ chạm cửa không bắn gì (màn tự tải lúc mở, như cũ); mảnh đã nạp ⇒ hoa2-cau-da-lam đi ngay + gọi đúng hàm cửa cũ; CauDaLam mở ⇒ vẫn MỘT lệnh danh sách', async () => {
    const goi: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const lenh = String(url).split('/').pop() ?? ''
        goi.push(lenh)
        const du = lenh === 'hoa2-cau-da-lam' ? { ok: true, cheDo2: true, chienDich: [{ id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-04', tong: 0 }], cau: [] } : { ok: true, cau: [] }
        return { ok: true, status: 200, json: async () => du }
      }),
    )
    const moCua = vi.fn()
    const p = boCuaNhanh({ token: 't', onCauDaLam: moCua })
    p.onCauDaLam()
    expect(moCua).toHaveBeenCalledTimes(1)
    await new Promise((ok) => setTimeout(ok, 0))
    expect(goi).toEqual([]) // mảnh chưa nạp: không lệnh sớm nào
    await napManCauDaLam()
    p.onCauDaLam()
    expect(moCua).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(goi).toEqual(['hoa2-cau-da-lam']))
    render(<CauDaLam token="t" hoTen="Em A" sbd="S1" onVe={() => {}} />)
    await waitFor(() => expect(document.querySelector('.h2-cdl-xuong')).toBeNull())
    expect(goi.filter((g) => g === 'hoa2-cau-da-lam')).toHaveLength(1)
  })
})
