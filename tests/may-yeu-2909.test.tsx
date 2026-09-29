// CHẾ ĐỘ MÁY YẾU + BỚT MÃ NẠP SỚM Ở /hs (thầy 29/09: "máy cấu hình yếu có vào mượt được không").
import { describe, it, expect, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { render, waitFor } from '@testing-library/react'
import { laMayYeu, docPhienBanIos, batCheDoMayYeu, docDauHieuMay, giamHieuUng, dangCheDoMayYeu, LOP_MAY_YEU } from '../src/lib/may-yeu'
import { giamChuyenDong, hat } from '../src/components/hoa2/hieu-ung-sanh'
import { giamChuyenDong as giamChuong } from '../src/game/than-thu-v2/dao2/ChuongTranDau'
import ExperimentDemo from '../src/components/ExperimentDemo'

const doc = (p: string) => readFileSync(p, 'utf8')

function cuaSoGia(nav: Record<string, unknown>, giam = false): Window {
  const lop = new Set<string>()
  return {
    navigator: nav,
    matchMedia: (q: string) => ({ matches: giam && q.includes('reduce') }),
    document: { documentElement: { classList: { add: (c: string) => lop.add(c), contains: (c: string) => lop.has(c) } } },
  } as unknown as Window
}

afterEach(() => document.documentElement.classList.remove(LOP_MAY_YEU))

describe('laMayYeu — bốn dấu hiệu, thiếu số thì không đoán', () => {
  it('RAM ≤ 3 GB, ≤ 4 luồng, giảm chuyển động, tiết kiệm dữ liệu ⇒ yếu', () => {
    expect(laMayYeu({ boNhoGb: 2 })).toBe(true)
    expect(laMayYeu({ boNhoGb: 3 })).toBe(true)
    expect(laMayYeu({ boNhoGb: 8, soLoi: 4 })).toBe(true)
    expect(laMayYeu({ soLoi: 2 })).toBe(true)
    expect(laMayYeu({ soLoi: 2, boNhoGb: 8 })).toBe(true)
    expect(laMayYeu({ giamChuyenDong: true, boNhoGb: 8, soLoi: 8 })).toBe(true)
    expect(laMayYeu({ tietKiemDuLieu: true, boNhoGb: 8, soLoi: 8 })).toBe(true)
  })
  it('máy khoẻ hoặc không đọc được gì ⇒ KHÔNG yếu', () => {
    expect(laMayYeu({ boNhoGb: 4, soLoi: 8 })).toBe(false)
    expect(laMayYeu({ boNhoGb: 8, soLoi: 6, giamChuyenDong: false, tietKiemDuLieu: false })).toBe(false)
    expect(laMayYeu({})).toBe(false)
    expect(laMayYeu({ boNhoGb: 0, soLoi: 0 })).toBe(false)
    expect(laMayYeu({ boNhoGb: Number.NaN })).toBe(false)
    // không có deviceMemory (Safari/Firefox): 4 luồng KHÔNG đủ để coi là yếu
    expect(laMayYeu({ soLoi: 4 })).toBe(false)
  })
  const IOS17 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
  const IOS15 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1'
  const ANDROID = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36'
  it('Boss soát 29/09 — bốn ca thật', () => {
    // iPhone iOS 17, 6 lõi, không deviceMemory ⇒ KHÔNG
    expect(batCheDoMayYeu(cuaSoGia({ userAgent: IOS17, hardwareConcurrency: 6 }))).toBe(false)
    // iPhone iOS 15 (iPhone 7–8) ⇒ CÓ
    expect(batCheDoMayYeu(cuaSoGia({ userAgent: IOS15, hardwareConcurrency: 2 }))).toBe(true)
    expect(laMayYeu({ phienBanIos: 15, soLoi: 6 })).toBe(true)
    // Android 2 GB ⇒ CÓ
    expect(batCheDoMayYeu(cuaSoGia({ userAgent: ANDROID, deviceMemory: 2, hardwareConcurrency: 8 }))).toBe(true)
    // Android 8 GB 8 lõi ⇒ KHÔNG
    expect(batCheDoMayYeu(cuaSoGia({ userAgent: ANDROID, deviceMemory: 8, hardwareConcurrency: 8 }))).toBe(false)
  })
  it('đọc phiên bản iOS/iPadOS từ userAgent; máy khác ⇒ undefined', () => {
    expect(docPhienBanIos(IOS17)).toBe(17)
    expect(docPhienBanIos(IOS15)).toBe(15)
    expect(docPhienBanIos('Mozilla/5.0 (iPad; CPU OS 14_8 like Mac OS X) AppleWebKit/605.1.15')).toBe(14)
    expect(docPhienBanIos(ANDROID)).toBeUndefined()
    expect(docPhienBanIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15')).toBeUndefined()
    expect(docPhienBanIos(undefined)).toBeUndefined()
  })
  it('batCheDoMayYeu gắn lớp may-yeu lên <html> chỉ khi máy yếu; đọc được navigator.connection.saveData', () => {
    const yeu = cuaSoGia({ deviceMemory: 2, hardwareConcurrency: 8 })
    expect(batCheDoMayYeu(yeu)).toBe(true)
    expect(yeu.document.documentElement.classList.contains(LOP_MAY_YEU)).toBe(true)
    const khoe = cuaSoGia({ deviceMemory: 8, hardwareConcurrency: 8 })
    expect(batCheDoMayYeu(khoe)).toBe(false)
    expect(khoe.document.documentElement.classList.contains(LOP_MAY_YEU)).toBe(false)
    expect(docDauHieuMay(cuaSoGia({ hardwareConcurrency: 8, connection: { saveData: true } })).tietKiemDuLieu).toBe(true)
    expect(batCheDoMayYeu(cuaSoGia({ hardwareConcurrency: 8 }, true))).toBe(true)
  })
})

describe('công tắc hiệu ứng nặng đọc chế độ máy yếu', () => {
  it('không có lớp ⇒ như cũ (jsdom không giảm); có lớp ⇒ Sảnh, chương trận đấu đều giảm', () => {
    expect(dangCheDoMayYeu()).toBe(false)
    expect(giamHieuUng()).toBe(false)
    expect(giamChuyenDong()).toBe(false)
    document.documentElement.classList.add(LOP_MAY_YEU)
    expect(giamHieuUng()).toBe(true)
    expect(giamChuyenDong()).toBe(true)
    expect(giamChuong()).toBe(true)
  })
  it('máy yếu: hạt sáng của Sảnh không sinh phần tử nào', () => {
    const cha = document.createElement('div')
    document.documentElement.classList.add(LOP_MAY_YEU)
    hat(cha, 10, 10, 12, ['rgb(255 255 255)'])
    expect(cha.childElementCount).toBe(0)
  })
  it('thị sai Đảo 2.0 tắt theo cùng công tắc', () => {
    expect(doc('src/game/than-thu-v2/dao2/CanhDao3D.tsx')).toMatch(/giamHieuUng\(\)\)return/)
  })
})

describe('CSS máy yếu + nơi bật', () => {
  const css = doc('src/styles/may-yeu.css')
  it('tắt kính mờ, hoạt ảnh lặp chạy một lượt, bóng lớn thu nhỏ — mọi quy tắc đều nằm dưới html.may-yeu', () => {
    expect(css).toMatch(/html\.may-yeu \*,[\s\S]*?backdrop-filter: none !important/)
    expect(css).toMatch(/-webkit-backdrop-filter: none !important/)
    expect(css).toMatch(/animation-iteration-count: 1 !important/)
    expect(css).toMatch(/html\.may-yeu \.shadow-2xl/)
    const boChon = css.replace(/\/\*[\s\S]*?\*\//g, '').split('{').slice(0, -1).map((k) => k.split('}').pop()!.trim())
    for (const k of boChon) for (const phan of k.split(',')) expect(phan.trim().startsWith('html.may-yeu'), phan).toBe(true)
  })
  it('giữ vòng quay / khung xương chờ tải để em biết app đang tải', () => {
    for (const lop of ['animate-spin', 'animate-pulse', 'm3-xuong', 'bnv-xuong', 'btm-quay', 'btg-quay']) expect(css).toContain(`:not(.${lop})`)
  })
  it('main.tsx nạp may-yeu.css và chỉ bật cho đường vào của học sinh / phụ huynh (không phải máy thầy)', () => {
    const m = doc('src/main.tsx')
    expect(m).toContain("import './styles/may-yeu.css'")
    expect(m).toMatch(/if \(dv\.vai === 'hocsinh' \|\| dv\.vai === 'phuhuynh'[^\n]*\) batCheDoMayYeu\(\)/)
    expect(m).not.toMatch(/vai === 'gv'[^\n]*batCheDoMayYeu/)
  })
})

describe('bớt mã nạp sớm ở /hs', () => {
  it('cổng học sinh không nhập tĩnh Bảng tin và hộp Khắc phục câu sai — nạp lười qua cong-hs-nap-luoi', () => {
    const c = doc('src/screens/StudentPortalScreen.tsx')
    expect(c).not.toMatch(/^import BangTinPhuHuynh /m)
    expect(c).not.toMatch(/^import ModalKhacPhucCauSai /m)
    expect(c).toContain("import('../components/cong-hs-nap-luoi')")
    expect(c).toMatch(/<Suspense fallback=[^\n]*>\s*<BangTinPhuHuynh/)
    expect(c).toMatch(/<Suspense fallback=[^\n]*>\s*<ModalKhacPhucCauSai/)
  })
  it('phần nhẹ của minh hoạ thí nghiệm không kéo catalog (≈ 77 KB)', () => {
    const nhe = doc('src/lib/experiments/nhe.ts')
    expect(nhe).not.toMatch(/from '\.\/catalog'|from '\.\/scene'/)
    const demo = doc('src/components/ExperimentDemo.tsx')
    expect(demo).not.toMatch(/from '\.\.\/lib\/experiments\/render'/)
    expect(demo).toContain("import('../lib/experiments/render')")
  })
  it('câu có cảnh thí nghiệm: nạp lười rồi vẽ đúng cảnh (không mất minh hoạ)', async () => {
    const text = 'Khi cho glucose phản ứng với Cu(OH)₂ trong môi trường kiềm đun nóng, hiện tượng nào sau đây sẽ xảy ra?'
    const { container } = render(<ExperimentDemo text={text} />)
    await waitFor(() => expect(container.innerHTML).toContain('Cu₂O'))
    expect(container.innerHTML).toContain('class="ex-demo" open')
  })
  it('hai minh hoạ đã duyệt (Rutherford) vẫn vẽ NGAY, không chờ nạp', () => {
    const text = 'Trong thí nghiệm bắn phá lá vàng của Rutherford, hầu hết các hạt alpha xuyên thẳng qua lá vàng mà không bị lệch hướng. Điều này chứng tỏ:'
    const { container } = render(<ExperimentDemo text={text} />)
    expect(container.innerHTML).toContain('ex-demo')
  })
})
