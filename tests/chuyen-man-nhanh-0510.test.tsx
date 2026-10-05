// CHUYỂN MÀN NHANH APP HỌC SINH (05/10 — thầy: "nhanh gấp 2 lần", giữ nguyên giao diện): bộ dụng cụ nạp trước / gọi sớm
// (src/components/hoa2/nap-truoc-man.ts, man-sanh-luoi.ts) và luật "SỐ LỆNH TỚI MÁY CHỦ KHÔNG ĐỔI": lệnh bắn sớm lúc em chạm cửa
// được màn nhận lại ở lượt gọi đầu, không gọi lần hai; Game hỏi `profile` và `hoa2-sanh` song song (trước nối tiếp).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, render, screen, waitFor } from '@testing-library/react'
import { Suspense } from 'react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'http://may-chu.thu' }))
vi.mock('../src/game/than-thu-v2/EscortRoom', () => ({ default: () => null }))
vi.mock('../src/game/than-thu-v2/DoanHoTong', () => ({ default: () => <div data-testid="doan-ho-tong" /> }))
vi.mock('../src/game/than-thu-v2/ProgressChart', () => ({ default: () => null }))
vi.mock('../src/game/than-thu-v2/LearningBattle', () => ({ default: () => null, SpellPreview: () => null }))
import { boNap, lazyNapTruoc, napTruocLanLuot, nenNapTruoc, taoGoiSom } from '../src/components/hoa2/nap-truoc-man'
import { boCuaNhanh, dungNapTruocManSanh, napManCauDaLam, napTruocManSanh } from '../src/components/hoa2/man-sanh-luoi'
import Game, { goiSomGame } from '../src/game/than-thu-v2/Game'
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

  it('napTruocManSanh: em đã chạm một cửa (dungNapTruocManSanh) ⇒ không nạp trước nữa trong lượt mở trang này', async () => {
    dungNapTruocManSanh()
    const goc = (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback
    const hen = vi.fn()
    ;(globalThis as { requestIdleCallback?: unknown }).requestIdleCallback = hen
    try {
      await napTruocManSanh(false)
      expect(hen).not.toHaveBeenCalled()
    } finally {
      ;(globalThis as { requestIdleCallback?: unknown }).requestIdleCallback = goc
    }
  })
})

const hoSo = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null }
/** Máy chủ giả của game: lệnh nào cũng TREO tới khi `traHet()` (để xem lệnh nào đã đi trước khi lệnh khác về); `tuDong()` ⇒ từ đó trả ngay. */
function mayChuGame() {
  const goi: string[] = []
  const cho: (() => void)[] = []
  let ngay = false
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const lenh = String(url).split('/').pop() ?? ''
      goi.push(lenh)
      const them = lenh === 'hoa2-sanh' ? { cheDo2: false } : { profile: hoSo, revision: 1, tasks: [], suggestions: [], doanMo: true }
      const tra = { json: async () => ({ ok: true, ...them }) }
      return ngay ? Promise.resolve(tra) : new Promise((ok) => cho.push(() => ok(tra)))
    }),
  )
  return {
    goi,
    dem: (lenh: string) => goi.filter((g) => g === lenh).length,
    tuDong: () => {
      ngay = true
      while (cho.length) cho.shift()!()
    },
  }
}
const daMoDao = () => document.querySelector('.dao-nav button[aria-current="page"]')?.textContent === 'Đảo'

describe('Game: profile + hoa2-sanh song song; lệnh bắn sớm lúc chạm cửa được nhận lại — số lệnh không đổi', () => {
  it('không gọi sớm: hoa2-sanh đi CÙNG LÚC với profile (không chờ hồ sơ về); mỗi lệnh đúng một lần', async () => {
    const may = mayChuGame()
    render(<Game sbd="S1" token="t" onDong={() => {}} />)
    await waitFor(() => expect(may.dem('profile')).toBe(1))
    expect(may.dem('hoa2-sanh')).toBe(1) // chưa lệnh nào về mà hoa2-sanh đã đi
    may.tuDong()
    await waitFor(() => expect(daMoDao()).toBe(true))
    expect(may.dem('profile')).toBe(1)
    expect(may.dem('hoa2-sanh')).toBe(1)
  })

  it('goiSomGame lúc chạm cửa rồi Game mở ⇒ Game nhận lại hai lệnh ấy, không gọi thêm: profile 1 lần, hoa2-sanh 1 lần', async () => {
    const may = mayChuGame()
    goiSomGame('S1', 't', '')
    await waitFor(() => expect(may.goi).toEqual(['profile', 'hoa2-sanh']))
    render(<Game sbd="S1" token="t" onDong={() => {}} />)
    may.tuDong()
    await waitFor(() => expect(daMoDao()).toBe(true))
    expect(may.dem('profile')).toBe(1)
    expect(may.dem('hoa2-sanh')).toBe(1)
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
