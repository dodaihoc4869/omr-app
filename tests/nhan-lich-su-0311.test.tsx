// NHÃN «ĐÃ LÀM ĐÚNG / SAI» (thầy 03/11): src/lib/nhan-lich-su.ts (em) + TheoDoiCa (giáo viên).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import TheoDoiCa from '../src/components/ca-thi/TheoDoiCa'
import { NhanCauKt } from '../src/components/kiem-tra-duo/KhungKiemTra'

afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.body.innerHTML = ''; localStorage.clear(); vi.resetModules() })
const doc = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')

async function bat(ds: Record<string, [number, number, number]>) {
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'S1', token: 'tok' }))
  const goi: unknown[] = []
  vi.stubGlobal('fetch', vi.fn(async (_u: string, o: { body: string }) => { goi.push(JSON.parse(o.body)); return new Response(JSON.stringify({ ok: true, ds })) }))
  const m = await import('../src/lib/nhan-lich-su')
  m.ganNhanLichSu()
  return { m, goi }
}

describe('mucLai — 4 kết quả', () => {
  it('lần cuối trước × lần này', async () => {
    const { mucLai } = await import('../src/lib/nhan-lich-su')
    expect(mucLai(1, true)).toBe('dd'); expect(mucLai(0, true)).toBe('sd'); expect(mucLai(1, false)).toBe('ds'); expect(mucLai(0, false)).toBe('ss')
  })
})

describe('bộ quét nhãn', () => {
  it('nhãn có số lần cạnh «Câu N»; câu chưa từng làm không nhãn; gửi đúng tru + gom một lệnh', async () => {
    const { goi } = await bat({ Q1: [2, 1, 1] })
    render(<><NhanCauKt so={1} tong={8} qid="Q1" tru="thi|CA1" /><NhanCauKt so={2} tong={8} qid="Q2" tru="thi|CA1" /></>)
    await waitFor(() => expect(document.querySelectorAll('.duo-kt-ls:not([hidden])')).toHaveLength(1))
    const nl = document.querySelector('.duo-kt-ls:not([hidden])')!
    expect(nl.textContent).toBe('Sai 2 lầnĐúng 1 lần')
    expect(goi).toHaveLength(1)
    expect(goi[0]).toMatchObject({ token: 'tok', tru: { nguon: 'thi', maNguon: 'CA1' } })
    expect((goi[0] as { qids: string[] }).qids.sort()).toEqual(['Q1', 'Q2'])
    expect(document.querySelector('.duo-kt-ls[data-qid="Q2"]')!.hasAttribute('hidden')).toBe(true)
  })
  it('đổi câu ⇒ chỗ giữ cũ ẩn rồi vẽ theo qid mới', async () => {
    await bat({ Q1: [2, 0, 0], Q3: [0, 4, 1] })
    const { rerender } = render(<NhanCauKt so={1} tong={8} qid="Q1" tru="thi|CA1" />)
    await waitFor(() => expect(document.querySelector('.duo-kt-ls')!.textContent).toBe('Sai 2 lần'))
    rerender(<NhanCauKt so={2} tong={8} qid="Q3" tru="thi|CA1" />)
    await waitFor(() => expect(document.querySelector('.duo-kt-ls')!.textContent).toBe('Đúng 4 lần'))
  })
  it('màn kết quả: hàng câu mang 1 trong 4 kết quả; ô tổng hợp đếm đúng; không phiên ⇒ im lặng', async () => {
    await bat({ A: [0, 2, 1], B: [3, 0, 0], C: [1, 1, 1], D: [2, 0, 0] })
    document.body.innerHTML = `<span class="duo-kt-ls" data-qid="A" data-tru="game|K1" data-dung="1" hidden></span><span class="duo-kt-ls" data-qid="B" data-tru="game|K1" data-dung="1" hidden></span>
      <section class="duo-kt-t4" data-tru="game|K1" data-ds="A:1,B:1,C:0,D:0,Z:1" hidden></section>`
    await waitFor(() => expect(document.querySelector('.duo-kt-t4:not([hidden])')).not.toBeNull())
    expect(document.querySelector('.duo-kt-ls[data-qid="A"]')!.textContent).toBe('Đúng → đúng lại')
    expect(document.querySelector('.duo-kt-ls[data-qid="B"]')!.textContent).toBe('Sai → đúng lại')
    const o = [...document.querySelectorAll('.duo-kt-t4 .o')].map((x) => `${x.getAttribute('data-m')}=${x.querySelector('b')!.textContent}`)
    expect(o).toEqual(['sd=1', 'dd=1', 'ds=1', 'ss=1']) // Z chưa từng làm ⇒ không tính
  })
})

describe('màn giáo viên «Từng em»', () => {
  const em = (sbd: string, hoTen: string) => ({ sbd, hoTen, tt: 'da_nop', daLam: 10, tongCau: 10, soLanRoiMan: 0, tongGiayRoiMan: 0, diem: 8 })
  const props = (layLichSu: () => Promise<Record<string, [number, number]> | null>) => ({
    tenCa: 'Ca', maCa: 'C1', link: '', daChepLink: false, onChepLink: () => {}, daChepLinkDiem: false, onChepLinkDiem: () => {}, moLuc: '', hetHanVao: '', thoiGianPhut: 15, congBoChu: '', phamViChu: '', conGiay: 100,
    em: [em('1', 'An'), em('2', 'Bình'), em('3', 'Chi')] as never[], soChuaVao: 0, nguongLan: 3, dangTai: false, dangDuyet: null, onLamMoi: () => {}, onMoKhoa: () => {}, onXemEm: () => {}, onChieuMa: () => {}, onKetThuc: () => {}, onDongCuaVao: () => {}, dangLamNgay: 0, layLichSu,
  })
  it('có dữ liệu ⇒ nhãn sai/đúng dưới tên + xếp em sai nhiều nhất lên trước; tắt xếp ⇒ thứ tự cũ', async () => {
    render(<TheoDoiCa {...(props(async () => ({ '1': [1, 5], '2': [7, 2], '3': [3, 0] })) as never)} />)
    await waitFor(() => expect(screen.getAllByText(/Sai \d+ lần/).length).toBe(3))
    const ten = () => [...document.querySelectorAll('.ct-o-em .ten')].map((x) => x.textContent)
    expect(ten()).toEqual(['Bình', 'Chi', 'An'])
    expect(within(document.querySelector('.ct-o-em')!).getAllByText('Đúng 2 lần')).toHaveLength(1)
    screen.getByRole('button', { name: /Xếp theo: câu đã làm sai nhiều nhất/ }).click()
    await waitFor(() => expect(ten()).toEqual(['An', 'Bình', 'Chi']))
  })
  it('không có dữ liệu / lỗi ⇒ màn y như cũ (không nhãn, không nút xếp)', async () => {
    render(<TheoDoiCa {...(props(async () => null) as never)} />)
    await Promise.resolve(); await Promise.resolve()
    expect(document.querySelector('.ct-ls')).toBeNull()
    expect(screen.queryByRole('button', { name: /Xếp theo/ })).toBeNull()
  })
})

describe('nối vào app', () => {
  it('bộ quét gắn từ mảnh nạp lười; màn chỉ vẽ phần tử rỗng', () => {
    expect(doc('src/components/cong-hs-nap-luoi.ts')).toMatch(/import\('\.\.\/lib\/nhan-lich-su'\)/)
    expect(doc('src/lib/do-treo-may-thi.ts')).toMatch(/import\('\.\/nhan-lich-su'\)/)
    expect(doc('src/components/hoc-tap/ManKiemTraCaNhan.tsx')).toMatch(/duo-kt-t4/)
    expect(doc('src/components/xem-diem/KetQuaSauNop.tsx')).toMatch(/coDiem && p\.maCa && p\.bai && p\.cau/)
    expect(doc('src/screens/ExamMonitorScreen.tsx')).toMatch(/layLichSu=\{layLichSuCaEm\}/)
  })
})
