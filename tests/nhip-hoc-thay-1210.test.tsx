// NHỊP HỌC TRÊN "HÔM NAY CỦA THẦY" (thầy 12/10 duyệt bản vẽ: "tôi nhìn vào thấy ngay học sinh nào chăm học sinh nào lười").
// Kiểm: LUẬT NHÓM thuần (biên 80% / 40%, 3 ngày liền không làm, chồng lấn ⇒ Lười, em vào muộn, chưa đủ dữ liệu, hôm nay không tính) · đọc trả lời
// máy chủ · số của khối (lọc Khối / Lớp, dòng Hôm nay, Theo lớp) · GIAO DIỆN: hai cột 6 em đúng thứ tự, "Xem đủ" mở rộng tại chỗ + tìm tên,
// bấm em mở tấm Hồ sơ làm bài (nạp lười), lọc khối, Đối phó 3 em + Xem đủ, bảng từng ngày nạp lười, điện thoại có thẻ phân đoạn, lỗi + Thử lại.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { EmNhipHoc, KetQuaNhipHoc } from '../server/src/nhip-hoc-kieu'

vi.mock('../src/components/chien-dich/HoSoLamCauEm', () => ({
  default: (p: { em: { sbd: string; ten: string; lop?: string }; onDong: () => void }) => (
    <div role="dialog" aria-label="Hồ sơ làm bài">
      <p>Giả: hồ sơ {p.em.ten} · {p.em.sbd} · {p.em.lop}</p>
      <button type="button" onClick={p.onDong}>
        Đóng
      </button>
    </div>
  ),
}))
vi.mock('../src/components/chien-dich/TheBaiHangNgay', () => ({ default: (p: { khoiDau?: number | null }) => <section aria-label="Bảng giả">Giả: bảng từng ngày · khối {String(p.khoiDau)}</section> }))

import {
  chuDieuKien, chuLuoi, docNhipHoc, nhomTheoLuat, phanNhomEm, tinhNhipHoc, xepCham, xepLuoi, type DongNhipHoc,
} from '../src/lib/nhip-hoc-thay'
import NhipHocThay from '../src/components/hom-nay-thay/NhipHocThay'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

// 12 ngày 01/10 → 12/10, hôm nay 12/10 (11 ngày đã qua). `ma`: d = đủ (24/24) · i = thiếu ít (14) · n = thiếu nhiều (5) · k = không làm · '-' trước ngày vào.
const NGAY = Array.from({ length: 12 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
const HOM_NAY = '2026-10-12'
const LAM: Record<string, number> = { d: 24, i: 14, n: 5, k: 0, '-': 0 }
const em = (sbd: string, ma: string, o: Partial<EmNhipHoc> = {}): EmNhipHoc => ({
  sbd, hoTen: `Em ${sbd}`, lop: '12A1', khoi: '12', ngayVao: '2026-10-01', muc: NGAY.map(() => 24), lam: ma.split(' ').map((c) => LAM[c]!), doiPho: null, ...o,
})
const dong = (e: EmNhipHoc, ngay = NGAY, homNay = HOM_NAY) => phanNhomEm(e, ngay, homNay)

describe('luật nhóm (thầy đã duyệt) — tính trên các ngày ĐÃ QUA', () => {
  it('biên 80% (Chăm) · 40% (Lười) · giữa là Chưa đều; so số nguyên, không làm tròn', () => {
    expect(nhomTheoLuat(10, 8, 0)).toBe('cham')
    expect(nhomTheoLuat(10, 7, 0)).toBe('chua-deu')
    expect(nhomTheoLuat(10, 5, 0)).toBe('chua-deu')
    expect(nhomTheoLuat(10, 4, 0)).toBe('luoi')
    expect(nhomTheoLuat(11, 9, 0)).toBe('cham') // 81,8%
    expect(nhomTheoLuat(11, 8, 0)).toBe('chua-deu') // 72,7%
    expect(nhomTheoLuat(11, 4, 0)).toBe('luoi') // 36,4%
    expect(nhomTheoLuat(11, 5, 0)).toBe('chua-deu') // 45,5%
  })
  it('3 ngày liền không làm ⇒ Lười (kể cả tỉ lệ ở giữa); 2 ngày liền thì chưa; chồng lấn ≥ 80% mà có 3 ngày liền bỏ ⇒ Lười', () => {
    expect(nhomTheoLuat(10, 6, 3)).toBe('luoi')
    expect(nhomTheoLuat(10, 6, 2)).toBe('chua-deu')
    expect(nhomTheoLuat(15, 12, 3)).toBe('luoi')
    expect(nhomTheoLuat(15, 12, 2)).toBe('cham')
  })
  it('chưa đủ dữ liệu: dưới 3 ngày đã qua được tính (kể cả em không làm câu nào)', () => {
    expect(nhomTheoLuat(2, 0, 2)).toBe('chua-du')
    expect(nhomTheoLuat(0, 0, 0)).toBe('chua-du')
    expect(nhomTheoLuat(3, 0, 3)).toBe('luoi')
  })
  it('một em: hôm nay KHÔNG tính (dù chưa làm câu nào); chuỗi ngày liền không làm dài nhất kèm khoảng ngày; số câu thiếu', () => {
    const d = dong(em('A', 'd d d d d k k k d d d k')) // hôm nay (12/10) chưa làm
    expect(d).toMatchObject({ nhom: 'luoi', soNgayQua: 11, soNgayDu: 8, soNgayThieu: 3, soNgayKhongLam: 3, tongCauThieu: 72, chuoiKhongLam: { dai: 3, tu: '2026-10-06', den: '2026-10-08' }, homNay: { muc: 24, lam: 0 } })
    expect(chuLuoi(d)).toEqual({ chinh: 'Thiếu 3/11 ngày', phu: '3 ngày liền không làm (06–08/10)' })
    // hai ngày cuối đã qua không làm + hôm nay chưa làm ⇒ chuỗi 2, KHÔNG phải 3
    const e = dong(em('B', 'd d d d d d d d d k k k'))
    expect(e.chuoiKhongLam).toMatchObject({ dai: 2 })
    expect(e.nhom).toBe('cham') // 9/11 ngày đủ (81,8%), hai ngày bỏ liền chưa đủ 3
  })
  it('em vào học muộn: ngày trước ngày vào là "chưa vào", không tính vào số ngày ⇒ chưa đủ dữ liệu khi dưới 3 ngày; từ 3 ngày thì xếp nhóm như thường', () => {
    const muon = dong(em('M', '- - - - - - - - - d d k', { ngayVao: '2026-10-10' }))
    expect(muon.o.slice(0, 9).every((x) => x.loai === 'chua-vao')).toBe(true)
    expect(muon).toMatchObject({ nhom: 'chua-du', soNgayQua: 2, soNgayDu: 2, soNgayThieu: 0 })
    const ba = dong(em('N', '- - - - - - - - d d d k', { ngayVao: '2026-10-09' }))
    expect(ba).toMatchObject({ nhom: 'cham', soNgayQua: 3, soNgayDu: 3 })
    expect(chuLuoi(dong(em('Z', '- - - - - - - k k k k k', { ngayVao: '2026-10-08' }))).phu).toBe('0 câu từ 08/10')
  })
  it('ô ngày: bốn mức của bảng nhiệt; hôm nay đang làm tô "thiếu ít" (không coi là thiếu nhiều)', () => {
    const d = dong(em('A', 'd i n k d d d d d d d n'))
    expect(d.o.map((x) => x.loai).slice(0, 4)).toEqual(['du', 'thieu-it', 'thieu-nhieu', 'khong-lam'])
    expect(d.o[11]).toMatchObject({ homNay: true, loai: 'thieu-it', lam: 5 })
  })
  it('chữ điều kiện theo số ngày đã qua (bản vẽ: 9/11 · 5–8 · 4/11)', () => {
    expect(chuDieuKien('cham', 11)).toBe('Đủ mức từ 9/11 ngày trở lên')
    expect(chuDieuKien('chua-deu', 11)).toBe('Đủ mức 5–8 ngày trong 11')
    // SỬA CÓ CHỦ ĐÍCH 12/10 — thầy chốt "6 ngày liền làm đủ mới thoát nhóm lười": chữ điều kiện ô Lười nói thêm đường thoát.
    expect(chuDieuKien('luoi', 11)).toBe('Đủ mức 4/11 ngày trở xuống, hoặc 3 ngày liền không làm · thoát khi đủ mức 6 ngày liền')
    expect(chuDieuKien('luoi', 2)).toBe('Đủ mức từ 40% số ngày trở xuống, hoặc 3 ngày liền không làm · thoát khi đủ mức 6 ngày liền')
    expect(chuDieuKien('chua-deu', 5)).toBe('Đủ mức 3/5 ngày')
    expect(chuDieuKien('cham', 2)).toBe('Đủ mức từ 80% số ngày trở lên')
  })
  it('chữ cột Lười: 0 câu ⇒ "0 câu từ …" · nhiều ngày không làm ⇒ "N ngày không làm · làm X câu" · còn lại ⇒ "thiếu X câu"', () => {
    expect(chuLuoi(dong(em('A', 'k k k k k k k k k k k k')))).toEqual({ chinh: 'Thiếu 11/11 ngày', phu: '0 câu từ 01/10' })
    expect(chuLuoi(dong(em('B', 'k k n k k k n k k k k k')))).toEqual({ chinh: 'Thiếu 11/11 ngày', phu: '9 ngày không làm · làm 10 câu' })
    expect(chuLuoi(dong(em('C', 'n i n d i n i n i n d k')))).toEqual({ chinh: 'Thiếu 9/11 ngày', phu: 'thiếu 135 câu' })
  })
})

// THẦY CHỐT 12/10: "6 ngày liền làm đủ mới thoát nhóm lười nhé" — Lười = (≤ 40% HOẶC ≥ 3 ngày liền bỏ) VÀ chuỗi đủ mức liền GẦN NHẤT < 6;
// chuỗi lùi từ hôm qua, hôm nay đã đủ thì cộng hôm nay; thoát rồi: ≥ 80% Chăm, còn lại Chưa đều.
describe('luật thoát nhóm Lười — 6 ngày liền đủ mức (thầy chốt 12/10)', () => {
  it('nhomTheoLuat: tham số thứ tư tuỳ chọn (mặc định 0 = như cũ); chuỗi 6 ⇒ thoát, 5 ⇒ vẫn Lười; thoát mà ≥ 80% ⇒ Chăm', () => {
    expect(nhomTheoLuat(11, 6, 5)).toBe('luoi')
    expect(nhomTheoLuat(11, 6, 5, 5)).toBe('luoi')
    expect(nhomTheoLuat(11, 6, 5, 6)).toBe('chua-deu')
    expect(nhomTheoLuat(11, 2, 0, 6)).toBe('chua-deu') // 18% mà đủ 6 ngày liền gần nhất ⇒ ra khỏi Lười
    expect(nhomTheoLuat(15, 12, 3, 6)).toBe('cham')
    expect(nhomTheoLuat(15, 12, 3, 5)).toBe('luoi')
    expect(nhomTheoLuat(2, 2, 0, 6)).toBe('chua-du')
  })
  it('một em Lười rồi đủ 6 ngày liền (tới hôm qua) ⇒ thoát, sang Chưa đều', () => {
    const d = dong(em('T6', 'k k k k k d d d d d d k'))
    expect(d).toMatchObject({ nhom: 'chua-deu', soNgayQua: 11, soNgayDu: 6, chuoiDuGanNhat: 6, chuoiKhongLam: { dai: 5 } })
  })
  it('mới 5 ngày liền đủ mức ⇒ vẫn Lười', () => {
    const d = dong(em('T5', 'k k k k k k d d d d d k'))
    expect(d).toMatchObject({ nhom: 'luoi', chuoiDuGanNhat: 5 })
  })
  it('hôm nay đã đủ mức được cộng vào chuỗi (5 ngày tới hôm qua + hôm nay = 6 ⇒ thoát); hôm nay chưa đủ thì không cắt chuỗi', () => {
    expect(dong(em('H6', 'k k k k k k d d d d d d'))).toMatchObject({ nhom: 'chua-deu', chuoiDuGanNhat: 6 })
    expect(dong(em('H5', 'k k k k k k d d d d d i'))).toMatchObject({ nhom: 'luoi', chuoiDuGanNhat: 5 })
  })
  it('chuỗi GẦN NHẤT mới tính: đủ 6 ngày liền trước đây rồi bỏ ngày ⇒ về lại Lười', () => {
    expect(dong(em('Q', 'k k k d d d d d d k n k'))).toMatchObject({ nhom: 'luoi', chuoiDuGanNhat: 0, soNgayDu: 6 })
  })
})

const DS = [
  em('L1', 'k k k k k k k k k k k k', { hoTen: 'Bùi Quang Minh', lop: '12 Lớp Thường' }),
  em('L2', 'k k n k k k n k k k k k', { hoTen: 'Hoàng Đức Huy', lop: '11B', khoi: '11' }),
  em('L3', 'n k k d k k n k k k k k', { hoTen: 'Đỗ Ngọc Ánh', lop: '12 Lớp Thường' }),
  em('L4', 'd d i d n k k k k i k k', { hoTen: 'Lý Gia Hân', lop: '11A2', khoi: '11' }),
  em('L5', 'i n d k k k d k n k k k', { hoTen: 'Ngô Thanh Tâm', lop: '10A2', khoi: '10' }),
  em('L6', 'd i n k d n k k i n k k', { hoTen: 'Chu Thị Hương Cúc', lop: '12 Lớp Thường' }),
  em('L7', 'd n k k k d k k n k k k', { hoTen: 'Phan Văn Bảy', lop: '12 Lớp Thường' }),
  em('C1', 'd d d d d d d d d d d d', { hoTen: 'Nguyễn Minh Anh', lop: '12 Tinh Hoa' }),
  em('C2', 'd d d d d d d d d d d i', { hoTen: 'Trần Gia Bảo', lop: '12 Tinh Hoa' }),
  em('C3', 'd d d i d d d d d d d d', { hoTen: 'Lê Khánh Vy', lop: '11A1', khoi: '11' }),
  em('C4', 'd d d d d d i d d d d d', { hoTen: 'Phạm Thu Trang', lop: '10A1', khoi: '10' }),
  em('C5', 'd d d d n d d d d d d n', { hoTen: 'Đặng Quốc Việt', lop: '12 Lớp Thường' }),
  em('C6', 'd d i d d d d n d d d k', { hoTen: 'Vũ Hải Yến', lop: '11A2', khoi: '11' }),
  em('C7', 'd d i d d d d n d d d k', { hoTen: 'Mai Bảy', lop: '11A2', khoi: '11' }),
  em('D1', 'd i d i d i d i d d i k', { hoTen: 'Đinh Đều', lop: '12 Tinh Hoa' }),
  em('M1', '- - - - - - - - - d d k', { hoTen: 'Tạ Mới', lop: '10A1', khoi: '10', ngayVao: '2026-10-10' }),
]
const DP = (sbd: string, nhanh: number, coGiay: number) => ({ quaNhanh: { nhanh, coGiay, dungNhanh: 28, dungThuong: 78, coTuTinh: false }, chonLap: null, lyDo: [`${nhanh}/${coGiay} lượt trả lời dưới 8 giây, nhóm này đúng 28% (lượt thường đúng 78%)`] })
const DOI = { C5: DP('C5', 23, 54), L3: DP('L3', 41, 96), D1: DP('D1', 20, 60), L7: DP('L7', 10, 30) } as Record<string, EmNhipHoc['doiPho']>
const KQ: KetQuaNhipHoc = {
  ok: true, tu: '2026-10-01', den: HOM_NAY, homNay: HOM_NAY, ngay: NGAY,
  em: DS.map((e) => ({ ...e, doiPho: DOI[e.sbd] ?? null })),
  lop: [
    { tenLop: '12 Lớp Thường', khoi: '12', soEm: 5 }, { tenLop: '12 Tinh Hoa', khoi: '12', soEm: 3 }, { tenLop: '11A1', khoi: '11', soEm: 1 },
    { tenLop: '11A2', khoi: '11', soEm: 3 }, { tenLop: '11B', khoi: '11', soEm: 1 }, { tenLop: '10A1', khoi: '10', soEm: 2 }, { tenLop: '10A2', khoi: '10', soEm: 1 },
  ],
  doiPhoDaTinh: { quaNhanh: true, chonLap: true }, canhBao: [],
}

describe('đọc trả lời + số của khối', () => {
  it('docNhipHoc: thiếu khung ⇒ null; em có mảng số lệch độ dài bị bỏ; ngày vào hỏng ⇒ đầu khoảng', () => {
    expect(docNhipHoc({ tu: '2026-10-01' })).toBeNull()
    const r = docNhipHoc({ ...KQ, em: [{ ...KQ.em[0], ngayVao: 'x' }, { ...KQ.em[1], lam: [1, 2] }, { sbd: '' }] } as unknown as Record<string, unknown>)!
    expect(r.em.map((e) => [e.sbd, e.ngayVao])).toEqual([['L1', '2026-10-01']])
    expect(r.doiPhoDaTinh).toEqual({ quaNhanh: true, chonLap: true })
  })
  it('tinhNhipHoc: đếm nhóm, dòng Hôm nay (đủ / đang làm / chưa làm), lọc khối + lớp; Theo lớp: % lười cao trước', () => {
    const t = tinhNhipHoc(KQ, { khoi: null, lop: '' })
    expect(t.dem).toEqual({ tong: 16, cham: 7, chuaDeu: 1, luoi: 7, chuaDu: 1, doiPho: 4 })
    expect(t.soNgayQua).toBe(11)
    expect(t.homNay).toEqual({ du: 3, dangLam: 2, chuaLam: 11 })
    expect(t.lop.map((l) => [l.tenLop, l.pLuoi])).toEqual([['10A2', 100], ['11B', 100], ['12 Lớp Thường', 80], ['11A2', 33], ['10A1', 0], ['11A1', 0], ['12 Tinh Hoa', 0]])
    expect(tinhNhipHoc(KQ, { khoi: '11', lop: '' }).dem.tong).toBe(5)
    expect(tinhNhipHoc(KQ, { khoi: '12', lop: '12 Tinh Hoa' }).dem).toMatchObject({ tong: 3, cham: 2, chuaDeu: 1 })
  })
  it('xếp: Lười nhất = số ngày thiếu ↓ rồi câu thiếu ↓; Chăm nhất = số ngày đủ ↓ rồi số câu hôm nay ↓', () => {
    const ds = KQ.em.map((e) => dong(e))
    const ten = (x: DongNhipHoc[]) => x.map((d) => d.sbd)
    const luoi = ds.filter((d) => d.nhom === 'luoi').sort(xepLuoi)
    for (let i = 1; i < luoi.length; i++) expect(luoi[i - 1]!.soNgayThieu * 1000 + luoi[i - 1]!.tongCauThieu).toBeGreaterThanOrEqual(luoi[i]!.soNgayThieu * 1000 + luoi[i]!.tongCauThieu)
    expect(luoi.slice(0, 2).map((d) => d.sbd)).toEqual(['L1', 'L2']) // cùng 11/11 ngày thiếu: L1 thiếu 264 câu > L2 254 câu
    const cham = ds.filter((d) => d.nhom === 'cham').sort(xepCham)
    expect(luoi.map((d) => d.sbd)).toEqual(['L1', 'L2', 'L3', 'L7', 'L5', 'L6', 'L4'])
    // 11/11 ngày đủ: hôm nay 24 câu (C1) trước 14 câu (C2) · 10/11 ngày: C3, C4 hôm nay 24 (hoà ⇒ tên) rồi C5 · 9/11 ngày: hôm nay 0 ⇒ tên (Mai trước Vũ)
    expect(cham.map((d) => d.sbd)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C7', 'C6'])
  })
})

describe('giao diện khối Nhịp học (máy tính)', () => {
  it('thẻ Nhịp học: thanh chia nhóm có nhãn, bốn ô có số + % + điều kiện, dòng Hôm nay + câu "Ngày chưa hết nên…"', () => {
    render(<NhipHocThay du={{ ok: true, kq: KQ }} dangTai={false} onThuLai={() => {}} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Nhịp học' })).toBeTruthy()
    expect(screen.getByText(/Từ 01\/10/).textContent).toContain('11 ngày đã qua')
    expect(screen.getByRole('img', { name: '16 em: Chăm 7, Chưa đều 1, Lười 7, Chưa đủ dữ liệu 1' })).toBeTruthy()
    const o = [...document.querySelectorAll('.nht-o-nhom')].map((x) => x.textContent)
    expect(o[0]).toContain('7 em · 44%')
    expect(o[0]).toContain('Đủ mức từ 9/11 ngày trở lên')
    expect(o[2]).toContain('Đủ mức 4/11 ngày trở xuống, hoặc 3 ngày liền không làm · thoát khi đủ mức 6 ngày liền')
    expect(o[3]).toContain('Có dấu hiệu đối phó')
    expect(o[3]).toContain('4 em')
    expect(screen.getByRole('img', { name: /Hôm nay: 3 em đủ mức, 2 em đang làm, 11 em chưa làm câu nào/ })).toBeTruthy()
    expect(screen.getByText(/Ngày chưa hết nên số em chưa làm buổi sáng chưa nói lên điều gì/)).toBeTruthy()
  })

  it('hai cột: Lười nhất 6 em (đúng thứ tự) · Chăm nhất 6 em; dải ô mỗi ngày 01/10 → hôm nay; "Xem đủ N em ›" mở rộng tại chỗ + tìm tên', () => {
    render(<NhipHocThay du={{ ok: true, kq: KQ }} dangTai={false} onThuLai={() => {}} />)
    const luoi = screen.getByRole('region', { name: 'Lười nhất · cần nhắc ngay' })
    const cham = screen.getByRole('region', { name: 'Chăm nhất · đáng khen' })
    const nut = (r: HTMLElement) => within(r).getAllByRole('button').filter((b) => b.classList.contains('nht-em'))
    expect(nut(luoi)).toHaveLength(6)
    expect(nut(luoi)[0]!.getAttribute('aria-label')).toBe('Bùi Quang Minh, 12 Lớp Thường: Thiếu 11/11 ngày, 0 câu từ 01/10 — xem hồ sơ làm bài')
    expect(nut(luoi)[0]!.querySelectorAll('.nht-o')).toHaveLength(12)
    expect(nut(luoi)[0]!.querySelector('.nht-o[data-hom-nay="true"]')?.getAttribute('data-muc')).toBe('hom-nay')
    expect(nut(cham)).toHaveLength(6)
    expect(nut(cham)[0]!.textContent).toContain('11/11 ngày đủ mức')
    expect(nut(cham)[0]!.textContent).toContain('hôm nay 24/24 câu')
    // Xem đủ 7 em lười ⇒ đủ 7 em + ô tìm; tìm "huy" ⇒ một em; Thu gọn ⇒ 6 em
    fireEvent.click(within(luoi).getByRole('button', { name: /Xem đủ 7 em lười/ }))
    expect(nut(luoi)).toHaveLength(7)
    fireEvent.change(within(luoi).getByRole('searchbox'), { target: { value: 'huy' } })
    expect(nut(luoi).map((b) => b.getAttribute('data-sbd'))).toEqual(['L2'])
    fireEvent.click(within(luoi).getByRole('button', { name: /Thu gọn/ }))
    expect(nut(luoi)).toHaveLength(6)
    // chú giải màu dưới hai cột
    const cg = screen.getByRole('list', { name: 'Chú giải màu ô ngày' })
    expect(cg.textContent).toContain('Mỗi ô một ngày, 01/10 → 12/10')
    expect(cg.textContent).toContain('Trước ngày em vào học')
  })

  it('bấm một em ⇒ tấm Hồ sơ làm bài (nạp lười) đúng em; Đóng ⇒ focus về đúng nút', async () => {
    render(<NhipHocThay du={{ ok: true, kq: KQ }} dangTai={false} onThuLai={() => {}} />)
    const nutEm = screen.getByRole('button', { name: /^Hoàng Đức Huy, 11B:/ })
    fireEvent.click(nutEm)
    const tam = await screen.findByRole('dialog', { name: 'Hồ sơ làm bài' })
    expect(tam.textContent).toContain('hồ sơ Hoàng Đức Huy · L2 · 11B')
    fireEvent.click(within(tam).getByRole('button', { name: 'Đóng' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(nutEm)
  })

  it('lọc khối (số em mỗi khối) + ô Lớp chỉ còn lớp của khối; mọi số đổi theo', () => {
    render(<NhipHocThay du={{ ok: true, kq: KQ }} dangTai={false} onThuLai={() => {}} />)
    const khoi = screen.getByRole('radiogroup', { name: 'Khối' })
    expect(within(khoi).getAllByRole('radio').map((r) => r.getAttribute('aria-label') ?? r.textContent)).toEqual(['Tất cả · 16', 'Khối 10 · 3 em', 'Khối 11 · 5 em', 'Khối 12 · 8 em'])
    fireEvent.click(within(khoi).getByRole('radio', { name: 'Khối 11 · 5 em' }))
    expect(within(khoi).getByRole('radio', { name: 'Khối 11 · 5 em' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('img', { name: /^5 em:/ })).toBeTruthy()
    const lop = screen.getByRole('combobox')
    expect([...lop.querySelectorAll('option')].map((o) => o.textContent)).toEqual(['Mọi lớp', '11A1 · 1 em', '11A2 · 3 em', '11B · 1 em'])
    fireEvent.change(lop, { target: { value: '11A2' } })
    expect(screen.getByRole('img', { name: /^3 em:/ })).toBeTruthy()
    const luoi = screen.getByRole('region', { name: 'Lười nhất · cần nhắc ngay' })
    expect(within(luoi).getAllByRole('button').filter((b) => b.classList.contains('nht-em')).map((b) => b.getAttribute('data-sbd'))).toEqual(['L4'])
    const cham = screen.getByRole('region', { name: 'Chăm nhất · đáng khen' })
    expect(within(cham).getAllByRole('button').filter((b) => b.classList.contains('nht-em')).map((b) => b.getAttribute('data-sbd'))).toEqual(['C7', 'C6'])
  })

  it('Có dấu hiệu đối phó: 3 em đầu (tín hiệu nặng trước) + "Xem đủ 4 em"; mỗi em một câu lý do bằng số · Theo lớp: lớp nhiều lười trước', () => {
    render(<NhipHocThay du={{ ok: true, kq: KQ }} dangTai={false} onThuLai={() => {}} />)
    const dp = screen.getByRole('region', { name: 'Có dấu hiệu đối phó · 4 em' })
    const nut = () => within(dp).getAllByRole('button').filter((b) => b.classList.contains('nht-em'))
    // 41/96 (42,7%) trước 23/54 (42,6%); hai em 33,3% hoà ⇒ tên
    expect(nut().map((b) => b.getAttribute('data-sbd'))).toEqual(['L3', 'C5', 'D1'])
    expect(nut()[0]!.textContent).toContain('41/96 lượt trả lời dưới 8 giây, nhóm này đúng 28% (lượt thường đúng 78%)')
    fireEvent.click(within(dp).getByRole('button', { name: /Xem đủ 4 em/ }))
    expect(nut()).toHaveLength(4)
    const lop = screen.getByRole('region', { name: 'Theo lớp' })
    expect([...lop.querySelectorAll('.nht-lop-dong')].map((x) => x.querySelector('b')?.textContent)).toEqual(['10A2', '11B', '12 Lớp Thường', '11A2', '10A1', '11A1', '12 Tinh Hoa'])
    expect(within(lop).getByRole('img', { name: /^12 Lớp Thường: Chăm 1, Chưa đều 0, Lười 4/ })).toBeTruthy()
  })

  it('"Xem bảng từng ngày ›" mở bảng nhiệt đầy đủ ngay tại Hôm nay (nạp lười, đúng khối đang chọn)', async () => {
    render(<NhipHocThay du={{ ok: true, kq: KQ }} dangTai={false} onThuLai={() => {}} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Khối 12 · 8 em' }))
    const nut = screen.getByRole('button', { name: /Xem bảng từng ngày/ })
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(nut)
    expect((await screen.findByRole('region', { name: 'Bảng giả' })).textContent).toContain('khối 12')
    expect(screen.getByRole('button', { name: /Ẩn bảng từng ngày/ }).getAttribute('aria-expanded')).toBe('true')
  })

  it('đang tải ⇒ khung xương; lỗi ⇒ câu nói thật + Thử lại; chưa có em ⇒ nói rõ vì sao + việc làm tiếp', () => {
    const thu = vi.fn()
    const { rerender } = render(<NhipHocThay du={null} dangTai onThuLai={thu} />)
    expect(screen.getByRole('status', { name: 'Đang tải Nhịp học' }).querySelectorAll('.tt-xuong').length).toBeGreaterThan(6)
    rerender(<NhipHocThay du={{ ok: false, chu: 'Không nối được máy chủ.' }} dangTai={false} onThuLai={thu} />)
    const loi = screen.getByRole('alert')
    expect(loi.textContent).toContain('Chưa tải được Nhịp học. Không nối được máy chủ.')
    fireEvent.click(within(loi).getByRole('button', { name: 'Thử lại' }))
    expect(thu).toHaveBeenCalledTimes(1)
    rerender(<NhipHocThay du={{ ok: true, kq: { ...KQ, em: [], lop: [] } }} dangTai={false} onThuLai={thu} />)
    expect(screen.getByText(/Chưa có em nào nhận bài hằng ngày/)).toBeTruthy()
  })
})

describe('giao diện điện thoại (bản vẽ HomNay-DienThoai)', () => {
  it('≤ 600 px: thẻ phân đoạn Lười · Chăm · Đối phó thay hai cột; đổi thẻ ⇒ đúng danh sách', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('max-width: 600px'), media: q, addEventListener: () => {}, removeEventListener: () => {} }))
    render(<NhipHocThay du={{ ok: true, kq: KQ }} dangTai={false} onThuLai={() => {}} />)
    const tab = screen.getByRole('tablist', { name: 'Nhóm em' })
    expect(within(tab).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Lười 7', 'Chăm 7', 'Đối phó 4'])
    expect(screen.getByRole('tabpanel').getAttribute('data-kieu')).toBe('luoi')
    expect(screen.queryByRole('region', { name: 'Chăm nhất · đáng khen' })).toBeNull()
    fireEvent.click(within(tab).getByRole('tab', { name: 'Chăm 7' }))
    expect(within(tab).getByRole('tab', { name: 'Chăm 7' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tabpanel').getAttribute('data-kieu')).toBe('cham')
    fireEvent.click(within(tab).getByRole('tab', { name: 'Đối phó 4' }))
    expect(screen.getByRole('tabpanel').textContent).toContain('lượt trả lời dưới 8 giây')
    expect(screen.getByRole('region', { name: 'Theo lớp' })).toBeTruthy()
  })
})
