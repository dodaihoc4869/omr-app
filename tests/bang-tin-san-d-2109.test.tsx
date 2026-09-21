// BẢNG TIN KIỂU SÀN GIAO DỊCH · cụm (d): HÀNG DƯỚI — sổ lệnh bài tập về nhà (đếm ngược), bản đồ nhiệt mỗi em một ô, dẫn đầu + em cần để ý, cột A.I (Boss giao 21/09).
// Khoá: đếm ngược đúng từng giây · thanh ba đoạn khớp số em · nháy khi có em nộp · bản đồ nhiệt (số ô = số em, màu theo số câu, viền vấp, không đè nhãn, rê/chạm ⇒ Toàn cảnh) ·
// dẫn đầu (hạng trượt, mũi tên, chạm tên) · em cần để ý (mức) · cột A.I (số nhảy, không vẽ 0 giả) · số KHỚP nhau · thiếu khối ⇒ ẩn.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { datKhungGia } from './_khung-gia-2109'
import fs from 'node:fs'
import path from 'node:path'
import { taoDuLieuGia } from '../src/lib/bang-tin-san/mau-gia'
import { chotSo } from '../src/lib/bang-tin-san/trang-thai'
import type { DanDauSan, EmNhiet, LopSan } from '../src/lib/bang-tin-san/kieu'
import type { BangTin, BaiTapBangTin, EmCanDeY } from '../src/lib/bang-tin-thay'
import BangTinSan from '../src/components/bang-tin-san/BangTinSan'
import { SoLenhBai, chuDoan, conLaiHan } from '../src/components/bang-tin-san/SoLenhBai'
import { BanDoNhiet, CAO_NHAN, boTriNhiet, gomTheoLop, veNhiet, type NhomNhiet } from '../src/components/bang-tin-san/BanDoNhiet'
import { DanDau, mucCanDeY } from '../src/components/bang-tin-san/DanDau'
import { CotAI } from '../src/components/bang-tin-san/CotAI'
import type { MauSan } from '../src/components/bang-tin-san/hooks'

const NAY = Date.parse('2026-09-21T08:28:36.000Z')
const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')
const MAU: MauSan = {
  nen: 'rgb(255,255,255)', mat: 'rgb(2,2,2)', 'mat-2': 'rgb(3,3,3)', vien: 'rgb(4,4,4)', chu: 'rgb(5,5,5)', 'chu-phu': 'rgb(6,6,6)', 'chu-mo': 'rgb(7,7,7)', duong: 'rgb(8,8,255)',
  la: 'rgb(0,200,0)', do: 'rgb(200,0,0)', vang: 'rgb(200,200,0)', 'xam-o': 'rgb(120,120,120)', luoi: 'rgb(14,14,14)', 'tren-gia': 'rgb(15,15,15)',
}
const bai = (o: Partial<BaiTapBangTin> = {}): BaiTapBangTin => ({ ma: 'B1', ten: 'Este – Lipid', tenLop: '12 - Lớp Thường', nhieuLop: false, hanNop: new Date(NAY + 2 * 86_400_000 + (20 * 3600 + 33 * 60 + 7) * 1000).toISOString(), quaHan: false, tong: 54, chuaMo: 21, dangLam: 19, daNop: 14, chang: null, nhac: null, ...o })
const em = (sbd: string, hoTen: string, lop: string, soCau: number, soCauDung = soCau, dangVap = false): EmNhiet => ({ sbd, hoTen, lop, soCau, soCauDung, dangVap })
const lop = (ten: string, siSo: number, daHoc: number, soCau = 0, dung = 0): LopSan => ({ lop: ten, siSo, daHoc, soCau, soCauDung: dung })

let khung = datKhungGia()
beforeEach(() => { vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }); khung = datKhungGia() })
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('conLaiHan — đếm ngược tới hạn nộp', () => {
  it('còn ≥ 1 ngày ⇒ "N ngày HH:MM:SS"; dưới 1 ngày ⇒ "HH:MM:SS"; chưa quá hạn', () => {
    expect(conLaiHan(new Date(NAY + 2 * 86_400_000 + (20 * 3600 + 33 * 60 + 7) * 1000).toISOString(), NAY)).toEqual({ qua: false, chu: '2 ngày 20:33:07' })
    expect(conLaiHan(new Date(NAY + (5 * 3600 + 41 * 60 + 45) * 1000).toISOString(), NAY)).toEqual({ qua: false, chu: '05:41:45' })
    expect(conLaiHan(new Date(NAY + 86_400_000).toISOString(), NAY)).toEqual({ qua: false, chu: '1 ngày 00:00:00' })
    expect(conLaiHan(new Date(NAY + 1000).toISOString(), NAY)).toEqual({ qua: false, chu: '00:00:01' })
  })
  it('đúng lúc hạn ⇒ 00:00:00 (chưa "quá"); sau hạn ⇒ quá hạn, đếm thời gian ĐÃ trôi (không âm)', () => {
    expect(conLaiHan(new Date(NAY).toISOString(), NAY)).toEqual({ qua: false, chu: '00:00:00' })
    expect(conLaiHan(new Date(NAY - (2 * 3600 + 5) * 1000).toISOString(), NAY)).toEqual({ qua: true, chu: '02:00:05' })
    expect(conLaiHan(new Date(NAY - 3 * 86_400_000 - 61_000).toISOString(), NAY)).toEqual({ qua: true, chu: '3 ngày 00:01:01' })
  })
  it('hạn hỏng / rỗng ⇒ null (không bịa); phần lẻ mili-giây bị cắt xuống (không làm tròn lên)', () => {
    expect(conLaiHan('không phải giờ', NAY)).toBeNull()
    expect(conLaiHan('', NAY)).toBeNull()
    expect(conLaiHan(new Date(NAY + 1999).toISOString(), NAY)).toEqual({ qua: false, chu: '00:00:01' })
  })
  it('chuDoan chỉ là số em (nhãn ở chú giải)', () => { expect(chuDoan(14)).toBe('14') })
})

describe('SoLenhBai', () => {
  it('tên bài + lớp, thanh ba đoạn đúng số em (flex-grow = số em), hạn còn, lượt nhắc kế, chú giải chưa mở/đang làm/đã nộp; "N em đã nộp" ở đầu khối', () => {
    const b = bai({ nhac: { soEm: 12, soPhuHuynh: 9, luotKe: new Date(NAY + 3600_000).toISOString() } })
    const { container } = render(<SoLenhBai baiTap={[b]} nowMs={NAY} />)
    expect(container.querySelector('h2')!.textContent).toBe('Bài tập về nhà đang chạy')
    expect(container.querySelector('.bts-the-phu')!.textContent).toBe('14 em đã nộp')
    expect(container.querySelector('.bts-bai-ten')!.textContent).toBe('Este – Lipid · 12 - Lớp Thường')
    const doan = [...container.querySelectorAll<HTMLElement>('.bts-thanh i')]
    expect(doan.map((e) => e.textContent)).toEqual(['21', '19', '14'])
    expect(doan.map((e) => e.style.flexGrow)).toEqual(['21', '19', '14'])
    expect(doan.map((e) => e.getAttribute('title'))).toEqual(['21 em chưa mở', '19 em đang làm', '14 em đã nộp'])
    expect(container.querySelector('.bts-thanh')!.getAttribute('aria-label')).toBe('21 em chưa mở, 19 em đang làm, 14 em đã nộp')
    expect(container.querySelector('.bts-bai-chan')!.textContent).toBe('Hạn nộp còn 2 ngày 20:33:07lượt nhắc kế 16:28')
    expect(container.querySelector('.bts-chu-giai-bai')!.textContent).toBe('chưa mởđang làmđã nộp')
  })

  it('đếm ngược chạy theo giờ đưa vào (mỗi giây một số); quá hạn ⇒ "Quá hạn" + thời gian đã trôi; không có lượt nhắc ⇒ không dòng nhắc; hạn hỏng ⇒ không dòng hạn', () => {
    const { container, rerender } = render(<SoLenhBai baiTap={[bai()]} nowMs={NAY} />)
    const han = () => container.querySelector('.bts-bai-chan span')!.textContent
    expect(han()).toBe('Hạn nộp còn 2 ngày 20:33:07')
    rerender(<SoLenhBai baiTap={[bai()]} nowMs={NAY + 1000} />)
    expect(han()).toBe('Hạn nộp còn 2 ngày 20:33:06')
    rerender(<SoLenhBai baiTap={[bai({ hanNop: new Date(NAY - 3_600_000).toISOString(), quaHan: true })]} nowMs={NAY} />)
    expect(han()).toBe('Quá hạn 01:00:00')
    expect(container.querySelectorAll('.bts-bai-chan span')).toHaveLength(1)
    rerender(<SoLenhBai baiTap={[bai({ hanNop: 'xxx' })]} nowMs={NAY} />)
    expect(han()).toBe('')
  })

  it('tối đa 4 bài, xếp theo hạn GẦN nhất; còn lại ⇒ "+N bài nữa"; không có dòng đó khi ≤ 4 bài', () => {
    const ds = Array.from({ length: 6 }, (_, i) => bai({ ma: `B${i}`, ten: `Bài ${i}`, hanNop: new Date(NAY + (6 - i) * 3600_000).toISOString() }))
    const { container } = render(<SoLenhBai baiTap={ds} nowMs={NAY} />)
    expect([...container.querySelectorAll('.bts-bai-ten b')].map((e) => e.textContent)).toEqual(['Bài 5', 'Bài 4', 'Bài 3', 'Bài 2']) // hạn gần nhất trước
    expect(container.querySelector('.bts-them')!.textContent).toContain('+2 bài nữa')
    cleanup()
    expect(render(<SoLenhBai baiTap={ds.slice(0, 4)} nowMs={NAY} />).container.querySelector('.bts-them')).toBeNull()
  })

  it('tổng "em đã nộp" cộng mọi bài (kể cả bài không hiện)', () => {
    const ds = Array.from({ length: 6 }, (_, i) => bai({ ma: `B${i}`, daNop: 10 }))
    expect(render(<SoLenhBai baiTap={ds} nowMs={NAY} />).container.querySelector('.bts-the-phu')!.textContent).toBe('60 em đã nộp')
  })

  it('có em NỘP THÊM ⇒ đoạn "đã nộp" nháy sáng; lần hiện đầu KHÔNG nháy; số không tăng ⇒ không nháy', () => {
    const { container, rerender } = render(<SoLenhBai baiTap={[bai()]} nowMs={NAY} />)
    expect(container.querySelector('.bts-nhay')).toBeNull()
    rerender(<SoLenhBai baiTap={[bai()]} nowMs={NAY + 1000} />)
    expect(container.querySelector('.bts-nhay')).toBeNull()
    rerender(<SoLenhBai baiTap={[bai({ daNop: 15, dangLam: 18 })]} nowMs={NAY + 2000} />)
    expect(container.querySelectorAll('.bts-nhay')).toHaveLength(1)
    expect(container.querySelector('.bts-nhay')!.className).toContain('bts-d-nop')
    expect(container.querySelector('.bts-nhay')!.textContent).toBe('15')
    rerender(<SoLenhBai baiTap={[bai({ daNop: 15, dangLam: 18, ma: 'B1' })]} nowMs={NAY + 3000} />)
    const doanNop = container.querySelector('.bts-d-nop')
    rerender(<SoLenhBai baiTap={[bai({ daNop: 10, dangLam: 23, ma: 'B1' })]} nowMs={NAY + 4000} />) // số nộp GIẢM (thu hồi bài) ⇒ KHÔNG nháy lại (đoạn không bị dựng lại)
    expect(container.querySelector('.bts-d-nop')).toBe(doanNop)
    rerender(<SoLenhBai baiTap={[bai({ daNop: 12, dangLam: 21, ma: 'B1' })]} nowMs={NAY + 5000} />) // nộp thêm so với 10 ⇒ nháy lại (đoạn dựng lại để chạy lại hoạt ảnh)
    expect(container.querySelector('.bts-d-nop')).not.toBe(doanNop)
  })
})

describe('gomTheoLop · boTriNhiet — bố cục bản đồ nhiệt', () => {
  it('theo thứ tự lớp của theoLop; lớp lạ ở cuối; lớp không có em bị bỏ; đếm "đã học" theo em có câu', () => {
    const nhiet = [em('1', 'A', 'L2', 5), em('2', 'B', 'L1', 0), em('3', 'C', 'L2', 0), em('4', 'D', 'LA', 1)]
    const g = gomTheoLop(nhiet, [lop('L1', 1, 0), lop('L2', 2, 1), lop('L3', 9, 0)])
    expect(g.map((n) => [n.ten, n.em.length, n.daHoc])).toEqual([['L1', 1, 0], ['L2', 2, 1], ['LA', 1, 1]])
    expect(gomTheoLop(nhiet, null).map((n) => n.ten)).toEqual(['L2', 'L1', 'LA'])
  })
  it('không giới hạn cao ⇒ cỡ ô theo bề rộng (11, hoặc 10 khi < 330); có giới hạn cao ⇒ co ô (≥ 5) cho vừa; vẫn không vừa thì giữ 5', () => {
    const nhom = [{ em: new Array(62) }, { em: new Array(71) }, { em: new Array(38) }, { em: new Array(54) }, { em: new Array(27) }, { em: new Array(12) }]
    expect(boTriNhiet(300, nhom, 0).s).toBe(10)
    expect(boTriNhiet(400, nhom, 0).s).toBe(11)
    const b = boTriNhiet(400, nhom, 200)
    expect(b.s).toBeLessThan(15)
    expect(b.s).toBeGreaterThanOrEqual(5)
    expect(b.H).toBeLessThanOrEqual(200)
    expect(boTriNhiet(400, nhom, 40).s).toBe(5)
    const to = boTriNhiet(400, [{ em: new Array(3) }], 300) // ít em ⇒ ô to nhất (15)
    expect(to.s).toBe(15)
    expect(boTriNhiet(200, nhom, 0).nhanW).toBe(98)
    expect(boTriNhiet(400, nhom, 0).nhanW).toBe(106)
  })
  it('mỗi khối lớp chiếm TỐI THIỂU một dòng nhãn (CAO_NHAN) dù chỉ có một hàng ô nhỏ — chữ không đè lên lớp kế', () => {
    const b1 = boTriNhiet(500, [{ em: new Array(2) }, { em: new Array(2) }], 0)
    expect(b1.H).toBeGreaterThanOrEqual(2 * CAO_NHAN + b1.gN - b1.g)
  })
})

describe('veNhiet — những gì được vẽ', () => {
  const ghi = () => {
    const chu: { t: string; y: number }[] = []
    const fill: string[] = []
    const stroke: string[] = []
    const ctx: Record<string, unknown> = { fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '' }
    for (const m of ['beginPath', 'moveTo', 'arcTo', 'closePath']) ctx[m] = () => {}
    ctx.fill = () => fill.push(String(ctx.fillStyle))
    ctx.stroke = () => stroke.push(String(ctx.strokeStyle))
    ctx.fillText = (t: string, _x: number, y: number) => chu.push({ t, y })
    return { ctx: ctx as unknown as CanvasRenderingContext2D, chu, fill, stroke }
  }
  const nhom = (): NhomNhiet[] => [
    { ten: 'Khối 10', daHoc: 2, em: [em('1', 'A', 'Khối 10', 40), em('2', 'B', 'Khối 10', 0), em('3', 'C', 'Khối 10', 120, 100, true), em('4', 'D', 'Khối 10', 0)] },
    { ten: 'Khối 11', daHoc: 0, em: [em('5', 'E', 'Khối 11', 0)] },
  ]
  it('MỖI em một ô (số ô trả về = số em); chưa học ⇒ xám; đã học ⇒ xanh đậm dần theo số câu (kẹp ở 85 câu); đang vấp ⇒ viền đỏ', () => {
    const g = ghi()
    const r = veNhiet(g.ctx, 400, 120, nhom(), MAU, new Map(), 0, true, false)
    expect(r.o).toHaveLength(5)
    expect(r.o.map((c) => c.idx)).toEqual([0, 1, 2, 3, 4])
    const xam = g.fill.filter((f) => f === MAU['xam-o'])
    expect(xam).toHaveLength(3) // B, D, E chưa học
    const xanh = g.fill.filter((f) => f.startsWith('rgba(8,8,255'))
    expect(xanh).toEqual([`rgba(8,8,255,${0.26 + 0.74 * (40 / 85)})`, 'rgba(8,8,255,1)']) // 40 câu, 120 câu (kẹp 85)
    expect(g.stroke).toEqual([MAU.do]) // đúng MỘT em đang vấp
  })
  it('ô nằm trong một lưới đều: x tăng theo cột, y theo hàng; hai lớp KHÔNG chồng ô', () => {
    const r = veNhiet(ghi().ctx, 400, 200, nhom(), MAU, new Map(), 0, true, false)
    const toaDo = r.o.map((c) => `${c.x},${c.y}`)
    expect(new Set(toaDo).size).toBe(5)
    const ys = r.o.map((c) => c.y)
    expect(ys[4]!).toBeGreaterThan(ys[0]!) // lớp thứ hai nằm dưới lớp thứ nhất
  })
  it('nhãn lớp: khối đủ cao ⇒ hai dòng (tên + "đã học/sĩ số"); khối thấp ⇒ MỘT dòng tên, không có dòng đã học (không đè chữ)', () => {
    const cao = ghi()
    veNhiet(cao.ctx, 240, 400, nhom(), MAU, new Map(), 0, true, false) // hẹp ⇒ nhiều hàng ⇒ cao
    const tenCao = cao.chu.map((c) => c.t)
    expect(tenCao).toContain('Khối 10')
    const thap = ghi()
    veNhiet(thap.ctx, 900, 40, nhom(), MAU, new Map(), 0, true, false) // rộng ⇒ một hàng ⇒ thấp
    expect(thap.chu.map((c) => c.t)).toEqual(['Khối 10', 'Khối 11'])
    // hai nhãn KHÔNG cùng y
    expect(new Set(thap.chu.map((c) => c.y)).size).toBe(2)
    expect(thap.chu[1]!.y - thap.chu[0]!.y).toBeGreaterThanOrEqual(CAO_NHAN)
    const ep = ghi() // khung CỰC thấp (ô ép xuống 5 px): hai khối lớp vẫn cách nhau ≥ một dòng nhãn
    veNhiet(ep.ctx, 900, 22, nhom(), MAU, new Map(), 0, true, true)
    expect(ep.chu[1]!.y - ep.chu[0]!.y).toBeGreaterThanOrEqual(CAO_NHAN)
  })
  it('em vừa làm câu (còn trong thời gian lóe) ⇒ vẽ thêm vòng sáng + phủ mờ; giảm chuyển động ⇒ KHÔNG lóe; hết giờ lóe ⇒ không lóe', () => {
    const loe = new Map([['1', 1000]])
    const a = ghi()
    veNhiet(a.ctx, 400, 120, nhom(), MAU, loe, 500, false, false)
    const b = ghi()
    veNhiet(b.ctx, 400, 120, nhom(), MAU, loe, 500, true, false)
    const c = ghi()
    veNhiet(c.ctx, 400, 120, nhom(), MAU, loe, 1500, false, false)
    expect(a.stroke.length).toBe(b.stroke.length + 1)
    expect(a.fill.length).toBe(b.fill.length + 1)
    expect(c.stroke.length).toBe(b.stroke.length)
  })
})

describe('BanDoNhiet — khối', () => {
  const nhiet = [em('1', 'Lê Văn An', 'Khối 10', 40, 30), em('2', 'Trần Bình', 'Khối 10', 0), em('3', 'Phạm Cường', 'Khối 11', 12, 6, true)]
  const theoLop = [lop('Khối 10', 2, 1, 40, 30), lop('Khối 11', 1, 1, 12, 6)]
  const soLieu = { soEmHoc: 2, tongEm: 3, chuaHoc: 1 }
  const dung = (o: { onMoEm?: (s: string) => void; itDong?: boolean } = {}) => {
    const hcn = { width: 400, height: 200, left: 0, top: 0, right: 400, bottom: 200, x: 0, y: 0, toJSON() {} } as DOMRect
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(hcn)
    const g = { fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '' } as Record<string, unknown>
    for (const m of ['setTransform', 'clearRect', 'beginPath', 'moveTo', 'arcTo', 'closePath', 'fill', 'fillText']) g[m] = () => {}
    g.stroke = () => { dem.stroke++; dem.kieu.push(String(g.strokeStyle)) }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(g as unknown as CanvasRenderingContext2D)
    const ve = (nh: readonly EmNhiet[]) => <BanDoNhiet nhiet={nh} theoLop={theoLop} soLieu={soLieu} mau={MAU} phienBanMau={1} itDong={o.itDong ?? true} nowMs={0} motMan onMoEm={o.onMoEm ?? (() => {})} />
    return { ...render(ve(nhiet)), ve }
  }
  const dem = { stroke: 0, kieu: [] as string[] }
  const vong = () => dem.kieu.filter((k) => k.startsWith('rgba(8,8,255')).length // nét vẽ của vòng lóe (màu duong có độ trong suốt)
  afterEach(() => { vi.restoreAllMocks(); dem.stroke = 0; dem.kieu = [] })

  it('tiêu đề nêu SĨ SỐ; chú giải chưa học / ít → nhiều câu / đang vấp; chân: "Chưa học hôm nay" và "Đã học" đúng số đã cho; canvas có nhãn đọc được', () => {
    const { container } = dung()
    expect(container.querySelector('h2')!.textContent).toBe('Bản đồ nhiệt 3 em')
    expect(container.querySelector('.bts-nhiet-giai')!.textContent).toBe('chưa họcít → nhiều câuđang vấp')
    expect(container.querySelector('.bts-nhiet-chan')!.textContent).toBe('Chưa học hôm nay: 1 emĐã học: 2 em')
    expect(container.querySelector('canvas')!.getAttribute('aria-label')).toContain('2 em đã học, 1 em chưa học')
    expect(container.querySelector('canvas')!.getAttribute('aria-label')).toContain('Enter để mở toàn cảnh')
  })

  it('rê chuột lên ô ⇒ gợi ý: tên + lớp + số câu + tỉ lệ đúng (+ "đang vấp"); ô chưa học ⇒ "chưa học hôm nay"; rời ⇒ ẩn', async () => {
    const { container } = dung()
    const hop = container.querySelector('.bts-nhiet-hop')!
    // ô đầu (em 1) ở x = nhanW(106), y = 1 (lớp Khối 10) — theo boTriNhiet
    fireEvent.pointerMove(hop, { clientX: 110, clientY: 4 })
    await waitFor(() => expect(container.querySelector('.bts-goi-y')).toBeTruthy())
    expect(container.querySelector('.bts-goi-y')!.textContent).toContain('Lê Văn An · Khối 10')
    expect(container.querySelector('.bts-goi-y')!.textContent).toContain('40 câu hôm nay · đúng 75 %')
    fireEvent.pointerMove(hop, { clientX: 110 + 18, clientY: 4 }) // ô kế (em 2 chưa học)
    await waitFor(() => expect(container.querySelector('.bts-goi-y')!.textContent).toContain('chưa học hôm nay'))
    fireEvent.pointerLeave(hop)
    await waitFor(() => expect(container.querySelector('.bts-goi-y')).toBeNull())
  })

  it('lần vẽ ĐẦU không lóe ô nào (chỉ có viền vấp đỏ); có em LÀM THÊM câu ⇒ lần vẽ kế có vòng sáng quanh em ấy', async () => {
    const { rerender, ve } = dung({ itDong: false })
    await khung.chay(1)
    expect(dem.kieu.length).toBeGreaterThanOrEqual(1)
    expect(dem.kieu.every((k) => k === MAU.do)).toBe(true) // toàn bộ nét vẽ đầu = viền vấp
    expect(vong()).toBe(0)
    rerender(ve(nhiet.map((e) => (e.sbd === '1' ? { ...e, soCau: 41, soCauDung: 31 } : e)))) // em 1 vừa làm thêm
    await khung.chay(2)
    expect(vong()).toBeGreaterThan(0)
  })

  it('BÀN PHÍM: Tab vào bản đồ ⇒ ô đầu được chọn (gợi ý hiện); mũi tên đổi ô; Enter mở Toàn cảnh ĐÚNG em; Home/End; Escape và rời ô ⇒ bỏ chọn; ô chọn có viền dày', async () => {
    const onMoEm = vi.fn()
    const { container } = dung({ onMoEm })
    const cv = container.querySelector('canvas')!
    expect(cv.getAttribute('tabindex')).toBe('0')
    fireEvent.focus(cv)
    await waitFor(() => expect(container.querySelector('.bts-goi-y')!.textContent).toContain('Lê Văn An'))
    fireEvent.keyDown(cv, { key: 'ArrowRight' })
    await waitFor(() => expect(container.querySelector('.bts-goi-y')!.textContent).toContain('Trần Bình'))
    fireEvent.keyDown(cv, { key: 'Enter' })
    expect(onMoEm).toHaveBeenLastCalledWith('2')
    fireEvent.keyDown(cv, { key: 'End' })
    fireEvent.keyDown(cv, { key: ' ' })
    expect(onMoEm).toHaveBeenLastCalledWith('3')
    fireEvent.keyDown(cv, { key: 'Home' })
    fireEvent.keyDown(cv, { key: 'ArrowLeft' }) // đã ở ô đầu: không lùi quá
    fireEvent.keyDown(cv, { key: 'Enter' })
    expect(onMoEm).toHaveBeenLastCalledWith('1')
    expect(dem.kieu).toContain(MAU.chu) // viền chọn dày màu chữ
    fireEvent.keyDown(cv, { key: 'Escape' })
    await waitFor(() => expect(container.querySelector('.bts-goi-y')).toBeNull())
    fireEvent.keyDown(cv, { key: 'Enter' }) // không có ô chọn ⇒ không mở
    expect(onMoEm).toHaveBeenCalledTimes(3)
    fireEvent.focus(cv)
    fireEvent.blur(cv)
    await waitFor(() => expect(container.querySelector('.bts-goi-y')).toBeNull())
  })

  it('BÀN PHÍM: mũi tên xuống / lên nhảy đúng MỘT HÀNG ô (số cột do bố cục quyết định), không nhảy 1 ô', async () => {
    const nhieu = Array.from({ length: 60 }, (_, i) => em(`s${i}`, `Em ${String(i + 1).padStart(2, '0')} Mẫu`, 'Khối 10', i % 3))
    const hcn = { width: 400, height: 200, left: 0, top: 0, right: 400, bottom: 200, x: 0, y: 0, toJSON() {} } as DOMRect
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(hcn)
    const g = { fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '' } as Record<string, unknown>
    for (const m of ['setTransform', 'clearRect', 'beginPath', 'moveTo', 'arcTo', 'closePath', 'fill', 'stroke', 'fillText']) g[m] = () => {}
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(g as unknown as CanvasRenderingContext2D)
    const { container } = render(<BanDoNhiet nhiet={nhieu} theoLop={[lop('Khối 10', 60, 40)]} soLieu={{ soEmHoc: 40, tongEm: 60, chuaHoc: 20 }} mau={MAU} phienBanMau={1} itDong nowMs={0} motMan onMoEm={() => {}} />)
    const cot = boTriNhiet(400, gomTheoLop(nhieu, [lop('Khối 10', 60, 40)]), 198).cot
    expect(cot).toBeGreaterThan(3)
    const cv = container.querySelector('canvas')!
    fireEvent.focus(cv)
    fireEvent.keyDown(cv, { key: 'ArrowDown' })
    await waitFor(() => expect(container.querySelector('.bts-goi-y')!.textContent).toContain(`Em ${String(cot + 1).padStart(2, '0')} Mẫu`))
    fireEvent.keyDown(cv, { key: 'ArrowUp' })
    await waitFor(() => expect(container.querySelector('.bts-goi-y')!.textContent).toContain('Em 01 Mẫu'))
  })

  it('chạm/bấm ô ⇒ mở Toàn cảnh ĐÚNG em (sbd); bấm chỗ trống ⇒ không gọi; ô bắt được cả ở MÉP TRÁI của nó', () => {
    const onMoEm = vi.fn()
    const { container } = dung({ onMoEm })
    const hop = container.querySelector('.bts-nhiet-hop')!
    fireEvent.click(hop.querySelector('canvas')!, { clientX: 110 + 18, clientY: 4 })
    expect(onMoEm).toHaveBeenCalledWith('2')
    onMoEm.mockClear()
    fireEvent.click(hop.querySelector('canvas')!, { clientX: 106, clientY: 1 }) // đúng mép trái ô đầu (nhãn lớp rộng 106 px)
    expect(onMoEm).toHaveBeenCalledWith('1')
    onMoEm.mockClear()
    fireEvent.click(hop.querySelector('canvas')!, { clientX: 1, clientY: 190 })
    expect(onMoEm).not.toHaveBeenCalled()
  })
})

describe('DanDau — dẫn đầu, tiến bộ nhất, em cần để ý', () => {
  const dd = (sbd: string, ten: string, soCau: number, tienBo: number): DanDauSan => ({ sbd, hoTen: ten, tenLop: '12 - Tinh Hoa', soCau, tienBo })
  const DS = [dd('1', 'Lê Thanh Thư', 61, 9), dd('2', 'Vũ Thu Sơn', 50, -3), dd('3', 'Phạm Kim An', 49, 0)]
  const canDeY = (sbd: string, loai: string, chu = 'Lý do'): EmCanDeY => ({ sbd, hoTen: `Em ${sbd} Mẫu`, tenLop: 'Khối 11', lyDo: loai ? [{ loai, chu, so: null, tong: null }] : [] })
  const bt = (ds: EmCanDeY[] = [], tienBo: BangTin['tienBo'] = []): BangTin => ({ ...taoDuLieuGia(NAY).bt!, canDeY: { ds, conLai: 0 }, tienBo })

  it('hạng theo THỨ TỰ đã cho; tên gọi = hai từ cuối (họ tên đầy đủ ở title); số câu; tiến bộ có dấu + / − / +0 %; chạm ⇒ Toàn cảnh', () => {
    const onMoEm = vi.fn()
    const { container } = render(<DanDau danDau={DS} bt={null} onMoEm={onMoEm} />)
    const hang = [...container.querySelectorAll('.bts-dd-hang')]
    expect(hang.map((h) => h.querySelector('.bts-dd-thu')!.textContent)).toEqual(['1', '2', '3'])
    expect(hang.map((h) => h.querySelector('.bts-dd-ten')!.childNodes[0]!.textContent!.trim())).toEqual(['Thanh Thư', 'Thu Sơn', 'Kim An'])
    expect(hang[0]!.querySelector('.bts-dd-ten')!.getAttribute('title')).toBe('Lê Thanh Thư')
    expect(hang.map((h) => h.querySelector('.bts-dd-cau')!.textContent)).toEqual(['61 câu', '50 câu', '49 câu'])
    expect(hang.map((h) => h.querySelector('.bts-dd-tb')!.textContent)).toEqual(['+9 %', '−3 %', '+0 %'])
    expect(hang[1]!.querySelector('.bts-dd-tb')!.getAttribute('data-am')).toBe('1')
    expect(hang[0]!.getAttribute('aria-label')).toBe('Hạng 1: Lê Thanh Thư, 12 - Tinh Hoa — 61 câu — mở toàn cảnh')
    fireEvent.click(hang[1]!)
    expect(onMoEm).toHaveBeenCalledWith('2')
    expect((hang[2] as HTMLElement).style.transform).toBe('translateY(calc(var(--bts-cao-hang) * 2))')
  })

  it('không so em này với em khác: tiêu đề nói rõ "so với chính em ấy, 7 ngày"; không có chữ xếp loại kém / yếu / cuối', () => {
    const { container } = render(<DanDau danDau={DS} bt={bt([canDeY('9', 'qua_han')], [])} onMoEm={() => {}} />)
    expect(container.querySelector('.bts-the-phu')!.textContent).toBe('so với chính em ấy, 7 ngày')
    expect(container.textContent).not.toMatch(/kém|yếu|cuối bảng|hạng bét/i)
  })

  it('hạng đổi ⇒ mũi tên LÊN / XUỐNG ở đúng em, tự tắt sau 4,2 giây; lần hiện đầu không có mũi tên', () => {
    vi.useFakeTimers()
    const { container, rerender } = render(<DanDau danDau={DS} bt={null} onMoEm={() => {}} />)
    const doi = () => [...container.querySelectorAll('.bts-dd-hang')].map((h) => h.getAttribute('data-doi'))
    expect(doi()).toEqual([null, null, null])
    rerender(<DanDau danDau={[DS[1]!, DS[0]!, DS[2]!]} bt={null} onMoEm={() => {}} />)
    expect(doi()).toEqual(['len', 'xuong', null]) // hàng theo THỨ TỰ mới: em 2 lên, em 1 xuống
    act(() => { vi.advanceTimersByTime(4300) })
    expect(doi()).toEqual([null, null, null])
  })

  it('"Tiến bộ nhất" lấy từ khối tiến bộ của máy chủ (tên gọi + chữ máy chủ soạn); vắng ⇒ không dòng', () => {
    const tb = [{ loai: 'tien_bo_nhat' as const, sbd: '7', hoTen: 'Trần Duy Mẫu', tenLop: 'Khối 10', so: 23, chu: 'đúng 54 → 77 %', anh: '' }, { loai: 'cham_nhat' as const, sbd: '8', hoTen: 'Khác', tenLop: 'x', so: 1, chu: 'x', anh: '' }]
    const { container } = render(<DanDau danDau={DS} bt={bt([], tb)} onMoEm={() => {}} />)
    expect(container.querySelector('.bts-tien-bo')!.textContent).toContain('Duy Mẫu')
    expect(container.querySelector('.bts-tien-bo')!.textContent).toContain('đúng 54 → 77 %')
    cleanup()
    expect(render(<DanDau danDau={DS} bt={bt([], [tb[1]!])} onMoEm={() => {}} />).container.querySelector('.bts-tien-bo')).toBeNull()
  })

  it('em cần để ý: quá hạn / sai nhiều ⇒ "Cần để ý" (đỏ); chưa mở bài / khác / không lý do ⇒ "Theo dõi" (vàng); tối đa 3 em; chạm tên ⇒ Toàn cảnh', () => {
    expect(mucCanDeY(canDeY('1', 'qua_han'))).toBe('do')
    expect(mucCanDeY(canDeY('1', 'sai_nhieu'))).toBe('do')
    expect(mucCanDeY(canDeY('1', 'chua_mo_bai'))).toBe('vang')
    expect(mucCanDeY(canDeY('1', 'gi_do_la'))).toBe('vang')
    expect(mucCanDeY(canDeY('1', ''))).toBe('vang')
    const onMoEm = vi.fn()
    const ds = [canDeY('1', 'qua_han', 'Chưa nộp bài A'), canDeY('2', 'chua_mo_bai', 'Chưa mở bài B'), canDeY('3', 'sai_nhieu', 'Sai 4/5'), canDeY('4', 'qua_han')]
    const { container } = render(<DanDau danDau={null} bt={bt(ds)} onMoEm={onMoEm} />)
    const li = [...container.querySelectorAll('.bts-chu-y li')]
    expect(li).toHaveLength(3)
    expect(li.map((x) => x.querySelector('.bts-muc')!.textContent)).toEqual(['Cần để ý', 'Theo dõi', 'Cần để ý'])
    expect(li[0]!.querySelector('.bts-cy-ly')!.textContent).toBe('Chưa nộp bài A')
    fireEvent.click(li[1]!.querySelector('button')!)
    expect(onMoEm).toHaveBeenCalledWith('2')
    expect(li[1]!.querySelector('button')!.getAttribute('aria-label')).toBe('Em 2 Mẫu · Khối 11 — mở toàn cảnh')
  })

  it('thiếu khối ⇒ ẩn: không có dẫn đầu thì không danh sách; không có em cần để ý thì không tiêu đề "Em cần thầy để ý"', () => {
    const { container } = render(<DanDau danDau={[]} bt={bt()} onMoEm={() => {}} />)
    expect(container.querySelector('.bts-dan-dau')).toBeNull()
    expect(container.querySelector('.bts-muc-phu')).toBeNull()
  })
})

describe('CotAI — A.I Đỗ Đại Học đã tự làm', () => {
  const goc = () => taoDuLieuGia(NAY).bt!
  it('tiêu đề đúng; ≤ 3 việc có số; số tách riêng để nhảy; Bộ não 3 con số; dạng vấp "N / M em vấp" + thanh theo %; chân "Hệ thống bình thường"', () => {
    const { container } = render(<CotAI bt={goc()} />)
    expect(container.querySelector('h2')!.textContent).toBe('A.I Đỗ Đại Học đã tự làm hôm nay')
    expect([...container.querySelectorAll('.bts-ai-ds li')].map((l) => l.textContent)).toEqual(['Đưa 128 câu sai về lịch ôn lại', 'Rút bộ câu riêng cho 23 em', 'Nhắc 44 em chưa mở bài'])
    expect([...container.querySelectorAll('.bts-ai-ds b')].map((b) => b.textContent)).toEqual(['128', '23', '44'])
    expect([...container.querySelectorAll('.bts-nao div')].map((d) => d.textContent)).toEqual(['220em được soi', '0em được chỉnh bài', '47lời nhắn'])
    expect([...container.querySelectorAll('.bts-vap li')].map((l) => l.querySelector('.bts-vap-dong')!.textContent)).toEqual(['Chuyển dịch cân bằng14 / 36 em vấp', 'Phản ứng tráng bạc9 / 30 em vấp'])
    expect([...container.querySelectorAll<HTMLElement>('.bts-vap-thanh i')].map((i) => i.style.transform)).toEqual(['scaleX(0.389)', 'scaleX(0.300)'])
    expect(container.querySelector('.bts-ai-chan')!.textContent).toBe('Hệ thống bình thường · thầy không cần làm gì')
  })
  it('số ĐỔI ⇒ nháy nền một nhịp (bts-vua) rồi tắt; số không đổi ⇒ không nháy', async () => {
    const b = goc()
    const { container, rerender } = render(<CotAI bt={b} />)
    expect(container.querySelector('.bts-vua')).toBeNull()
    rerender(<CotAI bt={{ ...b, mayDaLam: b.mayDaLam.map((v) => (v.loai === 'on_lai' ? { ...v, so: 129, chu: 'Đưa 129 câu sai về lịch ôn lại' } : v)) }} />)
    expect(container.querySelectorAll('.bts-vua').length).toBeGreaterThan(0) // vừa đổi ⇒ đang nháy
    expect(container.querySelector('.bts-ai-ds li')!.textContent).toBe('Đưa 129 câu sai về lịch ôn lại')
    await khung.chay(2) // tắt sau HAI khung hình (khung giả, không đoán theo thời gian)
    expect(container.querySelector('.bts-vua')).toBeNull()
  })
  it('KHÔNG vẽ 0 giả: Bộ não thiếu số nào bỏ số ấy; không Bộ não ⇒ không khối; không dạng vấp / không việc / không sức khoẻ ⇒ bỏ khối ấy', () => {
    const b = goc()
    const a = render(<CotAI bt={{ ...b, boNao: { ...b.boNao!, soEmDieuChinh: null } }} />).container
    expect([...a.querySelectorAll('.bts-nao div span')].map((s) => s.textContent)).toEqual(['em được soi', 'lời nhắn'])
    cleanup()
    const c = render(<CotAI bt={{ ...b, boNao: null, dangVap: [], mayDaLam: [], sucKhoe: null }} />).container
    for (const k of ['.bts-nao', '.bts-vap', '.bts-ai-ds', '.bts-ai-chan']) expect(c.querySelector(k), k).toBeNull()
    expect(c.querySelector('h2')!.textContent).toBe('A.I Đỗ Đại Học đã tự làm hôm nay')
  })
  it('sức khoẻ cần để ý ⇒ chân mang mức (vàng/đỏ) để đổi màu chấm; chữ do máy chủ soạn giữ nguyên', () => {
    const c = render(<CotAI bt={{ ...goc(), sucKhoe: { muc: 'do', chu: 'Có lỗi: cron nhắc chưa chạy' } }} />).container
    expect(c.querySelector('.bts-ai-chan')!.getAttribute('data-muc')).toBe('do')
    expect(c.querySelector('.bts-ai-chan')!.textContent).toBe('Có lỗi: cron nhắc chưa chạy')
  })
  it('dạng vấp chưa ai gặp (soEmGap = 0) ⇒ thanh 0 %, không chia cho 0; thanh không vượt 100 %', () => {
    const b = goc()
    const c = render(<CotAI bt={{ ...b, dangVap: [{ ma: 'X', ten: 'X', soEmVap: 0, soEmGap: 0 }, { ma: 'Y', ten: 'Y', soEmVap: 9, soEmGap: 3 }] }} />).container
    expect([...c.querySelectorAll<HTMLElement>('.bts-vap-thanh i')].map((i) => i.style.transform)).toEqual(['scaleX(0.000)', 'scaleX(1.000)'])
  })
})

describe('BangTinSan — hàng dưới trong khung', () => {
  it('đủ dữ liệu ⇒ bốn khối; số "Chưa học hôm nay" = sĩ số − đã học (một nguồn) và khớp ô "Em đã học hôm nay"', () => {
    const d = taoDuLieuGia(NAY)
    const { container } = render(<BangTinSan du={d} nayMs={NAY} />)
    for (const k of ['bai-tap', 'ban-do-nhiet', 'dan-dau', 'cot-ai']) expect(container.querySelector(`[data-khoi="${k}"]`), k).toBeTruthy()
    const so = chotSo(d)
    expect(container.querySelector('.bts-nhiet-chan')!.textContent).toBe(`Chưa học hôm nay: ${so.chuaHoc} emĐã học: ${so.soEmHoc} em`)
    expect(so.chuaHoc).toBe(so.tongEm - so.soEmHoc)
    expect(container.querySelector('[data-khoi="em-hoc"] .bts-so-lan')!.getAttribute('aria-label')).toBe(String(so.soEmHoc))
    expect(container.querySelector('[data-khoi="ban-do-nhiet"] h2')!.textContent).toBe(`Bản đồ nhiệt ${so.tongEm} em`)
  })
  it('THIẾU KHỐI ⇒ ẨN từng khối: không bt ⇒ chỉ bản đồ nhiệt + dẫn đầu; không nhiệt ⇒ không bản đồ nhiệt; không gì cả ⇒ không hàng dưới; bài tập rỗng ⇒ không sổ lệnh', () => {
    const d = taoDuLieuGia(NAY)
    const a = render(<BangTinSan du={{ ...d, bt: null }} nayMs={NAY} />).container
    expect(['bai-tap', 'cot-ai'].map((k) => !!a.querySelector(`[data-khoi="${k}"]`))).toEqual([false, false])
    expect(['ban-do-nhiet', 'dan-dau'].map((k) => !!a.querySelector(`[data-khoi="${k}"]`))).toEqual([true, true])
    cleanup()
    const b = render(<BangTinSan du={{ ...d, nhiet: null }} nayMs={NAY} />).container
    expect(b.querySelector('[data-khoi="ban-do-nhiet"]')).toBeNull()
    expect(b.querySelector('[data-khoi="cot-ai"]')).toBeTruthy()
    cleanup()
    const vr = render(<BangTinSan du={{ ...d, nhiet: [] }} nayMs={NAY} />).container
    expect(vr.querySelector('[data-khoi="ban-do-nhiet"]')).toBeNull() // mảng rỗng cũng là THIẾU
    cleanup()
    const c = render(<BangTinSan du={{ ...d, bt: null, nhiet: null, danDau: null }} nayMs={NAY} />).container
    expect(c.querySelector('[data-khoi="hang-duoi"]')).toBeNull()
    cleanup()
    const e = render(<BangTinSan du={{ ...d, bt: { ...d.bt!, baiTap: [] } }} nayMs={NAY} />).container
    expect(e.querySelector('[data-khoi="bai-tap"]')).toBeNull()
  })
  it('chạm tên em (dẫn đầu, cần để ý, ô nhiệt) ⇒ onMoEm với đúng sbd', () => {
    const d = taoDuLieuGia(NAY)
    const onMoEm = vi.fn()
    const { container } = render(<BangTinSan du={d} nayMs={NAY} onMoEm={onMoEm} />)
    fireEvent.click(container.querySelector('.bts-dd-hang')!)
    expect(onMoEm).toHaveBeenLastCalledWith(d.danDau![0]!.sbd)
    fireEvent.click(container.querySelector('.bts-cy')!)
    expect(onMoEm).toHaveBeenLastCalledWith(d.bt!.canDeY.ds[0]!.sbd)
  })
  it('tên trong dữ liệu mẫu là tên GIẢ RÕ RÀNG ("… Mẫu …") — không lộ em thật', () => {
    const d = taoDuLieuGia(NAY)
    for (const e of d.nhiet!) expect(e.hoTen).toMatch(/ Mẫu /)
    for (const e of d.danDau!) expect(e.hoTen).toMatch(/ Mẫu /)
    for (const e of d.bt!.canDeY.ds) expect(e.hoTen).toMatch(/ Mẫu /)
  })
})

describe('nguồn (d)', () => {
  const css = doc('src/components/bang-tin-san/bang-tin-san.css')
  it('CSS hàng dưới: chữ ≥ 12 px, không mã màu thô; hàng dẫn đầu cao ≥ 44 px trên điện thoại (chạm được); cột A.I dùng token --bts-ai-*', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    for (const m of css.matchAll(/font-size:\s*([\d.]+)px/g)) expect(Number(m[1]), m[0]).toBeGreaterThanOrEqual(12)
    expect(css).toMatch(/--bts-cao-hang: 44px/)
    expect(css).toMatch(/\.bts-the-ai \{[^}]*var\(--bts-ai-nen\)/)
  })
  it('không mạng / không localStorage / không Math.random trong khối hàng dưới; chỉ ĐỌC (mọi nút chỉ gọi onMoEm)', () => {
    for (const f of ['SoLenhBai', 'BanDoNhiet', 'DanDau', 'CotAI']) {
      const t = doc(`src/components/bang-tin-san/${f}.tsx`)
      expect(t, f).not.toMatch(/fetch\(|goiLenh|localStorage|Math\.random|XMLHttpRequest/)
      expect(t, f).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    }
    expect(doc('src/components/bang-tin-san/DanDau.tsx')).not.toMatch(/nhắc|giao bài|gửi/i)
  })
})
