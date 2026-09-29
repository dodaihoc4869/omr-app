// MÁY YẾU TOÀN DIỆN (thầy 29/09: "đẩy lên máy cấu hình yếu cũng phải chạy mượt mọi thứ"). Số đo trước/sau: scripts/do-may-yeu.mjs.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { act, fireEvent, render } from '@testing-library/react'
import { memo, useState } from 'react'
import { bangGiaTriProp, bangPropsBoQuaHam } from '../src/lib/so-sanh-props'
import { CSS_MAY_YEU_TRANG_NHUNG, LOP_MAY_YEU, dprToiDa, themCssMayYeu } from '../src/lib/may-yeu'
import { gioPhutNay } from '../src/components/VanTay'
import ExperimentDemo from '../src/components/ExperimentDemo'
import { giamChuyenDong as giamShop } from '../src/game/than-thu-v2/shop/chung'
import { giamChuyenDong as giamBangTin } from '../src/components/bang-tin/hooks'

const dem = vi.hoisted(() => ({ tach: 0 }))
vi.mock('../src/lib/tach-dong-cau', async (goc) => {
  const m = await goc<typeof import('../src/lib/tach-dong-cau')>()
  return {
    ...m,
    tachDongTheoY: (s: string | null | undefined) => {
      dem.tach++
      return m.tachDongTheoY(s)
    },
  }
})
import TheCau from '../src/components/TheCau'

const doc = (p: string) => readFileSync(p, 'utf8')
afterEach(() => document.documentElement.classList.remove(LOP_MAY_YEU))

describe('so props bỏ qua hàm (memo thẻ câu màn thi)', () => {
  it('hàm coi như bằng; chuỗi/số so Object.is; mảng và object thường so nông', () => {
    expect(bangGiaTriProp(() => 1, () => 2)).toBe(true)
    expect(bangGiaTriProp('a', 'a')).toBe(true)
    expect(bangGiaTriProp('a', 'b')).toBe(false)
    expect(bangGiaTriProp([null, null, 'D', null], [null, null, 'D', null])).toBe(true)
    expect(bangGiaTriProp([null, 'S'], [null, 'D'])).toBe(false)
    expect(bangGiaTriProp([1], [1, 2])).toBe(false)
    expect(bangGiaTriProp({}, {})).toBe(true)
    expect(bangGiaTriProp({ ngay: '28/09' }, { ngay: '28/09' })).toBe(true)
    expect(bangGiaTriProp({ ngay: '28/09' }, { ngay: '29/09' })).toBe(false)
    expect(bangGiaTriProp(undefined, {})).toBe(false)
    const bang = [['a']]
    expect(bangGiaTriProp(bang, [bang[0]])).toBe(true)
    expect(bangGiaTriProp([['a']], [['a']])).toBe(false) // mảng lồng khác tham chiếu ⇒ vẽ lại (an toàn)
  })
  it('phần tử React (children) không bao giờ coi là bằng', () => {
    expect(bangGiaTriProp(<b />, <b />)).toBe(false)
  })
  it('thêm / bớt khoá ⇒ khác', () => {
    expect(bangPropsBoQuaHam({ a: 1 }, { a: 1, b: undefined } as { a: number })).toBe(false)
    expect(bangPropsBoQuaHam({ a: 1, f: () => 0 }, { a: 1, f: () => 1 })).toBe(true)
  })
})

describe('màn thi: chạm một phương án chỉ vẽ lại đúng thẻ đó', () => {
  const TheCauThi = memo(TheCau, bangPropsBoQuaHam)
  const CAU = [0, 1, 2].map((i) => ({ qid: `q${i}`, text: `Câu ${i}: chất nào là ester?`, choices: ['CH3COOCH3', 'CH3COOH', 'C2H5OH', 'CH3CHO'] as [string, string, string, string] }))
  function ManGia() {
    const [chon, setChon] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({})
    return (
      <>
        {CAU.map((c, i) => (
          <TheCauThi
            key={c.qid}
            cheDo="thi"
            phan="I"
            stt={i + 1}
            id={`cau-${i + 1}`}
            cauHoiLai={undefined}
            daLamO={undefined}
            text={c.text}
            choices={c.choices}
            choicePerm={[0, 1, 2, 3]}
            selected={chon[c.qid] ?? null}
            // Hàm MỚI mỗi lần vẽ, như màn thi thật.
            onSelect={(o) => setChon((cu) => ({ ...cu, [c.qid]: o }))}
          />
        ))}
      </>
    )
  }
  it('lần đầu dựng 3 thẻ; chọn ở thẻ 2 chỉ thẻ 2 chạy lại, đáp án hiện đúng', () => {
    dem.tach = 0
    const { container } = render(<ManGia />)
    const moiThe = dem.tach / 3
    expect(moiThe).toBeGreaterThan(0)
    dem.tach = 0
    const hang = container.querySelectorAll('#cau-2 .pa-hang')
    act(() => {
      fireEvent.click(hang[1])
    })
    expect(dem.tach).toBe(moiThe) // đúng MỘT thẻ vẽ lại
    // Thẻ 2 nhận đúng lựa chọn B; thẻ 1, 3 vẫn trống.
    const trangThai = (stt: number) => [...container.querySelectorAll(`#cau-${stt} .pa-hang`)].map((h) => h.getAttribute('data-trang-thai'))
    expect(trangThai(2)).toEqual(['trong', 'chon', 'trong', 'trong'])
    expect(trangThai(1)).toEqual(['trong', 'trong', 'trong', 'trong'])
    dem.tach = 0
    act(() => {
      fireEvent.click(container.querySelectorAll('#cau-3 .pa-hang')[0])
    })
    expect(dem.tach).toBe(moiThe)
    // Hàm cũ thẻ 2 giữ lại (memo bỏ qua hàm) vẫn ghi ĐÚNG câu và không xoá chọn của câu khác (setState dạng hàm).
    act(() => {
      fireEvent.click(container.querySelectorAll('#cau-2 .pa-hang')[3])
    })
    expect(trangThai(2)).toEqual(['trong', 'trong', 'trong', 'chon'])
    expect(trangThai(3)).toEqual(['chon', 'trong', 'trong', 'trong'])
  })
  it('ExamTakeScreen dùng thẻ memo cho cả ba phần khi làm bài (không dùng cho màn xem lại lời giải)', () => {
    const m = doc('src/screens/ExamTakeScreen.tsx')
    expect(m).toContain('const TheCauThi = memo(TheCau, bangPropsBoQuaHam)')
    expect(m.match(/<TheCauThi\n\s+key=\{item\.qid\}\n\s+cheDo="thi"/g)?.length).toBe(3)
    expect(m).not.toMatch(/<TheCauThi[^>]*cheDo="xem_lai"/)
  })
  it('minh hoạ thí nghiệm là memo (thẻ vẽ lại mà đề không đổi thì khỏi băm lại đề)', () => {
    expect((ExperimentDemo as unknown as { $$typeof: symbol }).$$typeof).toBe(Symbol.for('react.memo'))
  })
})

describe('vân tay màn thi: giờ:phút dùng lại một bộ định dạng', () => {
  it('cùng kết quả với toLocaleTimeString cũ', () => {
    for (const d of [new Date(2026, 8, 29, 7, 5), new Date(2026, 8, 29, 23, 59), new Date(2026, 0, 1, 0, 0)])
      expect(gioPhutNay(d)).toBe(d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }))
  })
})

describe('trang nhúng (phiếu HTML) + độ phân giải canvas ở chế độ máy yếu', () => {
  const html = '<!doctype html><html><head><style>.a{}</style></head><body>x</body></html>'
  it('máy thường: phiếu giữ nguyên văn', () => {
    expect(themCssMayYeu(html)).toBe(html)
  })
  it('máy yếu: chèn CSS bỏ kính mờ / bộ lọc ngay trước </head>, không đổi phần thân', () => {
    document.documentElement.classList.add(LOP_MAY_YEU)
    const moi = themCssMayYeu(html)
    expect(moi).toContain(`<style data-may-yeu>${CSS_MAY_YEU_TRANG_NHUNG}</style></head>`)
    expect(moi.endsWith('<body>x</body></html>')).toBe(true)
    expect(CSS_MAY_YEU_TRANG_NHUNG).toContain('backdrop-filter:none')
    expect(CSS_MAY_YEU_TRANG_NHUNG).not.toMatch(/display:\s*none|visibility/)
  })
  it('KhungXemPhieu và PhieuScreen đi qua themCssMayYeu', () => {
    expect(doc('src/components/KhungXemPhieu.tsx')).toContain('srcDoc: themCssMayYeu(html)')
    expect(doc('src/screens/PhieuScreen.tsx')).toContain('srcDoc={themCssMayYeu(phieuBt)}')
  })
  it('dprToiDa: máy thường giữ trần nơi gọi, máy yếu ≤ 1,5', () => {
    const cu = window.devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', { value: 3, configurable: true })
    try {
      expect(dprToiDa()).toBe(2)
      expect(dprToiDa(99)).toBe(3)
      document.documentElement.classList.add(LOP_MAY_YEU)
      expect(dprToiDa(99)).toBe(1.5)
      expect(dprToiDa(1)).toBe(1)
    } finally {
      Object.defineProperty(window, 'devicePixelRatio', { value: cu, configurable: true })
    }
  })
})

describe('hoạt ảnh số / cuộn mượt nghe chế độ máy yếu', () => {
  it('cửa hàng phụ kiện + số đếm bảng tin: máy yếu ⇒ nhảy thẳng số cuối', () => {
    const mm = window.matchMedia
    window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
    try {
      expect(giamShop()).toBe(false)
      expect(giamBangTin()).toBe(false)
      document.documentElement.classList.add(LOP_MAY_YEU)
      expect(giamShop()).toBe(true)
      expect(giamBangTin()).toBe(true)
    } finally {
      window.matchMedia = mm
    }
  })
})

describe('Đoàn Hộ Tống: đồng hồ trận chỉ vẽ lại khi số giây đổi', () => {
  it('nhịp 250 ms so chuỗi giây hiện trên màn trước khi setNhip', () => {
    const m = doc('src/game/than-thu-v2/DoanHoTong.tsx')
    expect(m).toMatch(/if \(hienSo === cu\) return\s+cu = hienSo\s+setNhip\(n => n \+ 1\)/)
    expect(m).not.toContain('setInterval(() => setNhip(n => n + 1), 250)')
  })
})

describe('tải KaTeX nối sau mảnh màn em (3G)', () => {
  it('vào thi / cổng học sinh: KaTeX chờ mảnh màn; xem điểm / phiếu vẫn tải ngay', () => {
    const m = doc('src/main.tsx')
    expect(m).toContain("const noiSauManEm = (!!dv.maCa && dv.vai !== 'diem') || dv.vai === 'hocsinh'")
    expect(m).toContain('if (huaMan) void huaMan.then(napKatex, napKatex)')
    expect(m).toContain('else if (canCongThucNgay) void napKatex()')
  })
})
