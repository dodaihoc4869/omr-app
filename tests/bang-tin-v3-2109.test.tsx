// BẢNG TIN CỦA THẦY BẢN 3 (thầy chốt bản vẽ 21/09; đề bài prompt-bang-tin-thay-v3.md; hợp đồng docs/hop-dong-bang-tin-v3-2109.md).
// Thầy chỉ ĐỌC: không nút hành động; số nào cũng có nhãn; khoá vắng ⇒ nói thật, KHÔNG số 0 giả; "A.I Đỗ Đại Học" làm chủ ngữ việc tự động (bảng A2); một khung nhìn không cuộn (đo bằng Chromium — số ghi ở Nhật ký; ở đây khoá nguồn CSS).
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MAU_DAY, MAU_RONG, MAU_THAT_SANG_21 } from './fixtures/bang-tin-mau'
import { buoiCuaGio, chuHanNop, chuMocDau, chuTinhTu, chuTuMoc, docBangTin, phanTramTiLe } from '../src/lib/bang-tin-thay'
import BangTinV3, { BangTinLoi, BangTinXuong } from '../src/components/bang-tin/BangTin'
import { boSoDau, chuDamSo, chuMayBaiTap, chuVietTat } from '../src/components/bang-tin/cac-khoi'
import { chiaHang } from '../src/components/bang-tin/hooks'
import { useAppStore } from '../src/store/appStore'
import HomNayScreen from '../src/screens/HomNayScreen'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'mat-thu' }))
vi.mock('../src/lib/cap-nhat-app', () => ({ daySangBanMoi: () => {} }))

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const NAY = Date.parse('2026-09-21T06:14:00.000Z') // 13:14 giờ VN, Thứ Hai 21/09/2026
const bt = (mau: object = MAU_DAY) => docBangTin(mau as Record<string, unknown>)!

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ─────────────────────────────── BỘ ĐỌC HỢP ĐỒNG ───────────────────────────────
describe('docBangTin — đọc CÓ CHỐNG SAI KIỂU', () => {
  it('bản đủ: đúng số, đúng thứ tự, không thêm gì', () => {
    const d = bt()
    expect(d.nhip).toMatchObject({ soEmHoc: 57, tongEm: 263, soCau: 1234, soCauDung: 900, tiLeDung: 0.729, homQua: { soEmHoc: 61, soCau: 1100, tiLeDung: 0.7 } })
    expect(d.baiTap.map((b) => [b.ten, b.tenLop, b.chuaMo, b.dangLam, b.daNop, b.tong])).toEqual([
      ['Bài tập về nhà tuần 4 · Este – lipid', '12 - Lớp Thường', 41, 19, 7, 67],
      ['Bài tập về nhà · Carbohydrate', '12 - Tinh Hoa', 3, 11, 28, 42],
      ['Bài tập về nhà · Amin – Aminoaxit', '12 - Nhóm 10 điểm', 0, 2, 13, 15],
      ['Ôn tập giữa kì · Polime và vật liệu', '11', 60, 20, 11, 91],
    ])
    expect(d.baiTap[0].chang).toEqual({ tbDaXong: 1.4, tong: 5, soEm: 65 })
    expect(d.baiTap[2].nhac).toBeNull()
    expect(d.tienBo.map((t) => t.loai)).toEqual(['cham_nhat', 'tien_bo_nhat', 'ben_bi_nhat'])
    expect(d.canDeY.ds).toHaveLength(5)
    expect(d.canDeY.conLai).toBe(7)
    expect(d.dangVap.map((x) => x.soEmVap)).toEqual([9, 8, 7, 6, 5])
    expect(d.boNao).toMatchObject({ soEmSoi: 250, soEmDieuChinh: 12, soLoiNhan: 30 })
    expect(d.mayDaLam).toHaveLength(6)
    expect(d.sucKhoe).toEqual({ muc: 'xanh', chu: 'Bộ não A.I chạy lúc 01:04 · nhắc nộp bài chạy lúc 13:30' })
  })

  it('thiếu `nhip` ⇒ null (màn rơi về lệnh cũ, KHÔNG vẽ bảng tin rỗng như "hôm nay không ai học")', () => {
    expect(docBangTin({ ok: true, baiTap: [] })).toBeNull()
    expect(docBangTin({ ok: true, nhip: 'x' })).toBeNull()
  })

  it('khoá vắng ⇒ null / rỗng, KHÔNG số 0 giả: không homQua, không boNao, không sucKhoe', () => {
    const d = bt(MAU_THAT_SANG_21)
    expect(d.nhip.homQua).toBeNull()
    expect(d.boNao).toBeNull()
    expect(d.tienBo).toEqual([])
    expect(d.lyDoThieu).toEqual({ boNao: 'Chưa có bản tin' })
    const r = bt(MAU_RONG)
    expect(r.nhip.tiLeDung).toBeNull()
    expect(r.nhip.soCauDung).toBeNull()
    expect(phanTramTiLe(r.nhip.tiLeDung)).toBeNull()
  })

  it('sai kiểu từng dòng ⇒ bỏ dòng ấy, phần còn lại vẫn đọc; `tong` không bao giờ nhỏ hơn tổng ba ô; tienBo ≤ 3; mayDaLam chỉ dòng so > 0', () => {
    const d = docBangTin({
      nhip: { soEmHoc: 1, tongEm: 2, soCau: 3 },
      baiTap: [{ ten: 'A', chuaMo: 5, dangLam: 3, daNop: 2, tong: 1 }, { chuaMo: 1 }, 'rác', null],
      tienBo: [
        { loai: 'cham_nhat', sbd: '1', so: 9 },
        { loai: 'không_có', sbd: '2', so: 1 },
        { loai: 'tien_bo_nhat', sbd: '', so: 1 },
        { loai: 'tien_bo_nhat', sbd: '3', so: 2 },
        { loai: 'ben_bi_nhat', sbd: '4', so: 3 },
        { loai: 'cham_nhat', sbd: '5', so: 4 },
      ],
      canDeY: [{ sbd: '9', hoTen: 'Em', lyDo: [{ chu: 'x' }, { loai: 'y' }] }],
      canDeYConLai: 4,
      mayDaLam: [{ loai: 'a', so: 0, chu: 'không' }, { loai: 'b', so: 2, chu: 'có' }, { loai: 'c', so: 3 }],
      sucKhoe: { muc: 'tím', chu: 'x' },
    } as Record<string, unknown>)!
    expect(d.baiTap).toHaveLength(1)
    expect(d.baiTap[0].tong).toBe(10)
    expect(d.tienBo.map((t) => t.sbd)).toEqual(['1', '3', '4'])
    expect(d.canDeY.ds[0].lyDo.map((l) => l.chu)).toEqual(['x'])
    expect(d.canDeY.conLai).toBe(4)
    expect(d.mayDaLam.map((v) => v.loai)).toEqual(['b'])
    expect(d.sucKhoe).toBeNull()
  })
})

// ─────────────────────────────── CHỮ · GIỜ · SỐ ───────────────────────────────
describe('chữ hiển thị (giờ 24, tiếng Việt, bản vẽ thầy chốt)', () => {
  it('nhãn mốc đầu trang: giữa hôm nay ⇒ "Từ 12:00 · Thứ Hai 21/09/2026"; mốc cũ hoặc chưa áp ⇒ "Hôm nay · …"', () => {
    const d = bt()
    expect(chuMocDau(d, NAY)).toBe('Từ 12:00 · Thứ Hai 21/09/2026')
    expect(chuMocDau(d, Date.parse('2026-09-22T03:00:00.000Z'))).toBe('Hôm nay · Thứ Ba 22/09/2026')
    expect(chuMocDau({ ...d, tuDangAp: false }, NAY)).toBe('Hôm nay · Thứ Hai 21/09/2026')
    expect(chuMocDau({ ...d, tuHomNay: '2026-09-20T17:00:00.000Z' }, NAY)).toBe('Hôm nay · Thứ Hai 21/09/2026') // 00:00 giờ VN ⇒ không phải giữa ngày
  })

  it('chuTuMoc / chuTinhTu / buoiCuaGio', () => {
    const d = bt()
    expect(chuTuMoc(d, NAY)).toBe('Từ 12:00 trưa nay')
    expect(chuTinhTu(d, NAY)).toBe('tính từ 12:00 trưa')
    expect(chuTuMoc({ ...d, tuDangAp: false }, NAY)).toBe('Hôm nay')
    expect(chuTinhTu({ ...d, tuDangAp: false }, NAY)).toBe('tính trong hôm nay')
    expect([buoiCuaGio('06:00'), buoiCuaGio('12:00'), buoiCuaGio('15:30'), buoiCuaGio('20:00')]).toEqual(['sáng', 'trưa', 'chiều', 'tối'])
  })

  it('chuHanNop: "Hạn nộp 12:00 Thứ Năm 24/09" / quá hạn / hạn hỏng ⇒ rỗng', () => {
    expect(chuHanNop('2026-09-24T05:00:00.000Z')).toBe('Hạn nộp 12:00 Thứ Năm 24/09')
    expect(chuHanNop('2026-09-20T16:59:00.000Z', true)).toBe('Quá hạn nộp 23:59 Chủ nhật 20/09')
    expect(chuHanNop('không phải ngày')).toBe('')
  })

  it('chuVietTat (hai từ cuối), boSoDau (bỏ số + đơn vị đã có ở số lớn), chuDamSo (in đậm số đầu)', () => {
    expect([chuVietTat('Trần Gia Hân'), chuVietTat('Lê Bảo'), chuVietTat('An'), chuVietTat('')]).toEqual(['GH', 'LB', 'A', '?'])
    expect(boSoDau('42 câu đã làm hôm nay', 42, 'câu')).toBe('đã làm hôm nay')
    expect(boSoDau('6 câu sai trước nay đã làm đúng lại', 6, 'câu')).toBe('sai trước nay đã làm đúng lại')
    expect(boSoDau('3 ngày liên tiếp làm từ 5 câu trở lên', 3, 'ngày')).toBe('liên tiếp làm từ 5 câu trở lên')
    expect(boSoDau('42 câu đã làm hôm nay', 41, 'câu')).toBe('42 câu đã làm hôm nay') // số không khớp ⇒ giữ nguyên câu của máy chủ
    const { container } = render(<p>{chuDamSo('Nhắc nộp bài cho 12 em, báo 9 phụ huynh')}</p>)
    expect([...container.querySelectorAll('b')].map((b) => b.textContent)).toEqual(['12 em'])
  })

  it('dòng dưới mỗi bài: chủ ngữ "A.I Đỗ Đại Học" (thầy lệnh 21/09), không còn "Máy đã tự nhắc"; không có gì thật ⇒ rỗng', () => {
    const [b1, , b3] = bt().baiTap
    expect(chuMayBaiTap(b1)).toBe('A.I Đỗ Đại Học đã nhắc 12 em · 9 phụ huynh · lượt nhắc kế 18:00 · chặng xong trung bình 1,4/5')
    expect(chuMayBaiTap(b3)).toBe('chặng xong trung bình 4,6/5')
    expect(chuMayBaiTap({ ...b3, chang: null })).toBe('')
  })
})

describe('chiaHang — top-N theo chỗ trống (trang chính KHÔNG cuộn)', () => {
  it('vừa hết ⇒ hiện hết; không vừa ⇒ chừa 48 px cho "+N nữa", luôn ≥ 1; không đo được ⇒ hiện hết; còn mục ngoài danh sách ⇒ luôn chừa nút', () => {
    expect(chiaHang(3, 220, 72, 48)).toBe(3)
    expect(chiaHang(4, 220, 72, 48)).toBe(2)
    expect(chiaHang(4, 60, 72, 48)).toBe(1)
    expect(chiaHang(4, null, 72, 48)).toBe(4)
    expect(chiaHang(3, 400, 72, 48, 5)).toBe(3)
    expect(chiaHang(5, 400, 72, 48, 5)).toBe(4)
  })
})

// ─────────────────────────────── KHỐI (vẽ) ───────────────────────────────
const dung = (mau: object = MAU_DAY, ex: Partial<React.ComponentProps<typeof BangTinV3>> = {}) => {
  const onMoEm = vi.fn()
  const onMoCa = vi.fn()
  const r = render(<BangTinV3 du={bt(mau)} nayMs={NAY} dsTraCuu={[]} onMoEm={onMoEm} onMoCa={onMoCa} {...ex} />)
  return { ...r, onMoEm, onMoCa }
}

describe('BangTinV3 — bố cục máy tính, đủ dữ liệu', () => {
  it('đầu trang: "Bảng tin", nhãn mốc, giờ cập nhật; bốn số lớn CÓ NHÃN (đúng chữ bản vẽ) + dòng phụ tính từ dữ liệu', () => {
    const { container } = dung(MAU_DAY, { dungNhip: { soEm: 97, soCoLo: 148 } })
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Bảng tin')
    expect(screen.getByText('Từ 12:00 · Thứ Hai 21/09/2026')).toBeTruthy()
    expect(screen.getByText('Cập nhật 13:12 · tự làm mới mỗi phút')).toBeTruthy()
    const so = [...container.querySelectorAll('.bt3-so')].map((e) => [e.querySelector('.bt3-so-nhan')?.textContent, e.querySelector('.bt3-so-gia-tri')?.textContent, e.querySelector('.bt3-so-phu')?.textContent])
    expect(so).toEqual([
      ['Em đã học hôm nay', '57/ 263 em', '22% số em · tính từ 12:00 trưa'],
      ['Câu đã làm', '1.234câu', 'trung bình 21,6 câu mỗi em đã học'],
      ['Tỉ lệ đúng', '73%', '900 câu đúng trong 1.234 câu'],
      ['Bài tập về nhà đúng nhịp', '97/ 148 em', '51 em chậm một chặng trở lên'],
    ])
  })

  it('số "đúng nhịp" chưa có (lệnh cũ không trả) ⇒ "—" và câu thật, KHÔNG 0 giả', () => {
    const { container } = dung(MAU_DAY, { dungNhip: null })
    const t = container.querySelectorAll('.bt3-so')[3]
    expect(t.querySelector('.bt3-so-gia-tri')?.textContent).toBe('—')
    expect(t.querySelector('.bt3-so-phu')?.textContent).toBe('chưa có số liệu đúng nhịp')
  })

  it('bảy ô đúng thứ tự bản vẽ; tiêu đề ô "A.I Đỗ Đại Học đã tự làm hôm nay" (không còn "Máy đã tự làm")', () => {
    const { container } = dung()
    expect([...container.querySelectorAll('section[data-khoi]')].map((s) => s.getAttribute('data-khoi'))).toEqual(['bai-tap', 'tien-bo', 'can-de-y', 'dang-vap', 'bo-nao', 'may-da-lam'])
    expect(screen.getByRole('heading', { name: 'A.I Đỗ Đại Học đã tự làm hôm nay' })).toBeTruthy()
    expect(container.textContent).not.toMatch(/Máy đã|máy đã tự|Máy chưa/)
    expect(screen.getByRole('heading', { name: 'Bộ não A.I · đêm qua' })).toBeTruthy()
  })

  it('bài tập: mỗi bài MỘT thanh xếp chồng có số, nhãn đọc màn hình đủ ba số; hạn nộp có thứ + giờ 24; lớp kèm số em', () => {
    const { container } = dung()
    const bai = container.querySelectorAll('[data-khoi="bai-tap"] .bt3-bt')
    expect(bai).toHaveLength(4)
    const b1 = bai[0]
    expect(b1.querySelector('.bt3-bt-lop')?.textContent).toBe('12 - Lớp Thường · 67 em')
    expect(b1.querySelector('.bt3-bt-han')?.textContent).toBe('Hạn nộp 12:00 Thứ Năm 24/09')
    expect(b1.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('67 em: 41 chưa mở, 19 đang làm, 7 đã nộp')
    expect([...b1.querySelectorAll('.bt3-doan')].map((s) => s.textContent)).toEqual(['41', '19', '7'])
  })

  it('tiến bộ: ba bục có nhãn; số lớn + đơn vị; câu sẵn bỏ phần số đã có; chạm tên ⇒ Toàn cảnh (onMoEm)', () => {
    const { container, onMoEm } = dung()
    const the = [...container.querySelectorAll('.bt3-tb')]
    expect(the.map((t) => [t.querySelector('.bt3-tb-buc')?.textContent, t.querySelector('.bt3-tb-so')?.textContent, t.querySelector('.bt3-tb-phu')?.textContent])).toEqual([
      ['Chăm nhất', '42 câu', 'đã làm hôm nay'],
      ['Tiến bộ nhất', '6 câu', 'sai trước nay đã làm đúng lại'],
      ['Bền bỉ nhất', '3 ngày', 'liên tiếp làm từ 5 câu trở lên'],
    ])
    expect(the[0].querySelector('.bt3-anh')?.textContent).toBe('MA')
    fireEvent.click(the[1])
    expect(onMoEm).toHaveBeenCalledWith('12026')
  })

  it('tiến bộ trống (sáng 21/09): nói thật lý do, không số giả', () => {
    dung(MAU_THAT_SANG_21)
    expect(screen.getByText(/chưa có em nào đủ số liệu để nêu tên \(chăm nhất cần từ 5 lượt chấm\)/)).toBeTruthy()
  })

  it('em cần để ý: tên + lớp, lý do bằng SỐ; chạm ⇒ Toàn cảnh; "+N em nữa" = số trong danh sách còn lại + conLai của máy chủ', () => {
    const { container, onMoEm } = dung()
    const hang = container.querySelectorAll('[data-khoi="can-de-y"] .bt3-em')
    expect(hang).toHaveLength(5)
    expect(hang[0].textContent).toContain('Nguyễn Hoàng Long · 12 - Lớp Thường')
    expect(hang[0].textContent).toContain('Sai 6/8 câu dạng Este hôm nay')
    fireEvent.click(hang[2])
    expect(onMoEm).toHaveBeenCalledWith('12044')
    expect(screen.getByRole('button', { name: '+7 em nữa' })).toBeTruthy() // 5 hiện hết + conLai 7
  })

  it('dạng vấp: tên dạng KHÔNG mã, "vấp / đã gặp" bằng số; Bộ não: ba con số có nhãn + gợi ý; "Bộ não A.I soi" không lặp ở ô A.I Đỗ Đại Học', () => {
    const { container } = dung()
    expect([...container.querySelectorAll('[data-khoi="dang-vap"] .bt3-dv')].map((r) => [r.querySelector('.bt3-dv-ten')?.textContent, r.querySelector('.bt3-dv-so')?.textContent]).slice(0, 2)).toEqual([
      ['Thuỷ phân ester', '9 / 24 em vấp'],
      ['Phản ứng xà phòng hoá', '8 / 22 em vấp'],
    ])
    expect(container.querySelector('[data-khoi="dang-vap"]')?.textContent).not.toMatch(/ESTE\./)
    const bn = container.querySelector('[data-khoi="bo-nao"]')!
    expect([...bn.querySelectorAll('.bt3-bn-so > div')].map((d) => d.textContent)).toEqual(['250em được soi lúc 01:04', '12em được chỉnh bài', '30lời nhắn cho em'])
    expect(bn.textContent).toContain('Gợi ý cho thầy')
    const may = container.querySelector('[data-khoi="may-da-lam"]')!
    expect([...may.querySelectorAll('.bt3-may')].map((l) => l.textContent)).toEqual(['Nhắc nộp bài cho 12 em, báo 9 phụ huynh', 'Cho 5 em khắc phục luôn các câu vừa sai', 'Đưa 38 câu sai về lịch ôn lại 1·3·7', 'Rút bộ câu riêng cho 40 em', 'Vinh danh 3 em'])
    expect(may.textContent).not.toContain('soi 250')
  })

  it('chân ô A.I Đỗ Đại Học: xanh ⇒ đúng câu bản vẽ "Hệ thống bình thường · thầy không cần làm gì"; vàng/đỏ ⇒ lý do thật của máy chủ', () => {
    const { container, rerender } = dung()
    expect(container.querySelector('.bt3-suc')?.textContent).toContain('Hệ thống bình thường · thầy không cần làm gì')
    rerender(<BangTinV3 du={bt(MAU_THAT_SANG_21)} nayMs={NAY} dsTraCuu={[]} onMoEm={() => {}} onMoCa={() => {}} />)
    expect(container.querySelector('.bt3-suc')?.textContent).toContain('Cần để ý · Chưa có bản tin Bộ não A.I để kiểm')
  })

  it('dòng "N em nhận thử thách riêng · M em đã làm" (Bộ não nấc 1) nằm ở ô Bộ não, không lặp ở ô A.I Đỗ Đại Học', () => {
    const mau = { ...MAU_DAY, mayDaLam: [...MAU_DAY.mayDaLam, { loai: 'thu_thach_rieng', so: 40, chu: '40 em nhận thử thách riêng · 12 em đã làm' }] }
    const { container } = dung(mau)
    expect(container.querySelector('[data-khoi="bo-nao"] .bt3-bn-thu')?.textContent).toBe('40 em nhận thử thách riêng · 12 em đã làm')
    expect(container.querySelector('[data-khoi="may-da-lam"]')?.textContent).not.toContain('thử thách')
  })

  it('KHÔNG có nút hành động trên trang: mọi nút là chạm-vào-em, "+N … nữa" hoặc ô tra cứu', () => {
    const { container } = dung()
    const chu = [...container.querySelectorAll('button')].map((b) => (b.getAttribute('aria-label') || b.textContent || '').trim())
    for (const c of chu) expect(c).toMatch(/— mở toàn cảnh$|^\+\d+ .+ nữa$/)
    expect(container.textContent).not.toMatch(/Nhắc ngay|Gửi cảnh báo|Giao bài riêng|Đưa vào buổi chữa|Mở buổi chữa|Nhắn phụ huynh/)
    expect(container.querySelectorAll('input')).toHaveLength(1) // ô tra cứu
    expect(container.querySelector('input')?.getAttribute('placeholder')).toBe('Tìm học sinh theo tên hoặc số báo danh')
  })
})

describe('BangTinV3 — trạng thái rỗng thật (không giả số)', () => {
  it('mốc mới, chưa em nào làm bài: số 0 là 0 thật, tỉ lệ "—", câu rỗng viết thật ở từng ô', () => {
    const { container } = dung(MAU_RONG, { dungNhip: null })
    const so = [...container.querySelectorAll('.bt3-so')].map((e) => [e.querySelector('.bt3-so-gia-tri')?.textContent, e.querySelector('.bt3-so-phu')?.textContent])
    expect(so[0]).toEqual(['0/ 263 em', '0% số em · tính từ 12:00 trưa'])
    expect(so[1]).toEqual(['0câu', 'chưa có em nào làm bài từ 12:00 trưa'])
    expect(so[2]).toEqual(['—', 'chưa có lượt làm nào để tính'])
    const chuTrong = [...container.querySelectorAll('.bt3-trong')].map((e) => e.textContent)
    expect(chuTrong).toContain('Từ 12:00 trưa nay chưa giao bài tập về nhà nào.')
    expect(chuTrong).toContain('Từ 12:00 trưa nay chưa có em nào cần thầy để ý.')
    expect(chuTrong).toContain('Từ 12:00 trưa nay A.I Đỗ Đại Học chưa có việc nào cần tự làm.')
    expect(chuTrong).toContain('Chưa có bản tin của Bộ não A.I: Chưa có bản tin.')
    expect(container.querySelectorAll('[data-khoi="bai-tap"] .bt3-bt')).toHaveLength(0)
  })

  it('khung xương (chờ) và trạng thái lỗi: có role, không nút', () => {
    const a = render(<BangTinXuong />)
    expect(screen.getByRole('status', { name: 'Đang tải bảng tin' })).toBeTruthy()
    expect(a.container.querySelectorAll('button')).toHaveLength(0)
    a.unmount()
    const b = render(<BangTinLoi chu="Máy chủ trả lời chậm." />)
    expect(screen.getByRole('alert').textContent).toContain('Chưa đọc được bảng tin')
    expect(b.container.querySelectorAll('button')).toHaveLength(0)
  })
})

describe('top-N + tấm bên (trang chính không cuộn)', () => {
  beforeEach(() => {
    class RO {
      constructor(private cb: () => void) {}
      observe() {
        this.cb()
      }
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', RO)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('bt3-than') ? 150 : 0
    })
  })

  it('chỗ trống 150 px ⇒ ô Bài tập hiện 1 bài + "+3 bài nữa"; bấm ⇒ tấm bên có ĐỦ 4 bài, có nút Đóng, Esc đóng', () => {
    const { container } = dung()
    expect(container.querySelectorAll('[data-khoi="bai-tap"] .bt3-bt')).toHaveLength(1)
    // ô Em cần để ý: 1 em hiện + 4 em cắt bớt + 7 em máy chủ báo còn lại = "+11 em nữa"
    expect(container.querySelectorAll('[data-khoi="can-de-y"] .bt3-em')).toHaveLength(1)
    expect(screen.getByRole('button', { name: '+11 em nữa' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '+3 bài nữa' }))
    const tam = screen.getByRole('dialog', { name: 'Bài tập về nhà đang chạy' })
    expect(within(tam).getAllByRole('img').filter((x) => x.getAttribute('aria-label')?.includes('chưa mở'))).toHaveLength(4)
    expect(within(tam).getByRole('button', { name: 'Đóng' })).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('"+N em nữa": tấm bên hiện đủ em đang có + lời thật "Còn N em nữa …"; chạm em trong tấm ⇒ đóng tấm và mở Toàn cảnh', () => {
    const { onMoEm } = dung()
    fireEvent.click(screen.getByRole('button', { name: /^\+\d+ em nữa$/ }))
    const tam = screen.getByRole('dialog', { name: 'Em cần thầy để ý' })
    expect(within(tam).getAllByRole('button', { name: /mở toàn cảnh/ })).toHaveLength(5)
    expect(within(tam).getByText('Còn 7 em nữa chưa nêu tên ở đây — xem đủ ở màn Học sinh.')).toBeTruthy()
    fireEvent.click(within(tam).getAllByRole('button', { name: /mở toàn cảnh/ })[0])
    expect(onMoEm).toHaveBeenCalledWith('12007')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('có lệnh chi tiết ⇒ tấm bên nạp danh sách ĐỦ (taiTatCaCanDeY) rồi bỏ câu "Còn N em nữa"', async () => {
    const tai = vi.fn(async () => Array.from({ length: 12 }, (_, i) => ({ sbd: `S${i}`, hoTen: `Em ${i}`, tenLop: '12', lyDo: [{ loai: 'x', chu: 'lý do', so: null, tong: null }] })))
    dung(MAU_DAY, { taiTatCaCanDeY: tai })
    fireEvent.click(screen.getByRole('button', { name: /^\+\d+ em nữa$/ }))
    const tam = screen.getByRole('dialog', { name: 'Em cần thầy để ý' })
    await waitFor(() => expect(within(tam).getAllByRole('button', { name: /mở toàn cảnh/ })).toHaveLength(12))
    expect(within(tam).queryByText(/Còn \d+ em nữa/)).toBeNull()
  })
})

describe('điện thoại: 6 trang lướt ngang', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('max-width: 879px'), addEventListener: () => {}, removeEventListener: () => {} }))
    Element.prototype.scrollTo = vi.fn() as never
  })

  it('sáu trang đúng thứ tự, nhãn "Trang k trong 6 · …", chấm chỉ trang, nút "Lướt sang: …" (48 px) và nút tìm tròn', () => {
    const { container } = dung()
    expect([...container.querySelectorAll('.bt3-trang-nhan')].map((e) => e.textContent)).toEqual([
      'Trang 1 trong 6 · Nhịp hôm nay',
      'Trang 2 trong 6 · Bài tập về nhà đang chạy',
      'Trang 3 trong 6 · Tiến bộ hôm nay',
      'Trang 4 trong 6 · Em cần thầy để ý',
      'Trang 5 trong 6 · Dạng cả lớp đang vấp',
      'Trang 6 trong 6 · Bộ não A.I đêm qua',
    ])
    expect(container.querySelectorAll('.bt3-cham > span')).toHaveLength(6)
    const sang = screen.getByRole('button', { name: 'Lướt sang: Bài tập về nhà' })
    fireEvent.click(sang)
    expect((Element.prototype.scrollTo as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1)
    expect(screen.getByRole('button', { name: 'Tìm học sinh' })).toBeTruthy()
    expect(screen.getByRole('region', { name: /lướt ngang/ }).getAttribute('tabindex')).toBe('0')
  })

  it('nút tròn tìm em mở tấm "Tìm học sinh" có ô nhập; trang 1 có ô A.I Đỗ Đại Học đã tự làm', () => {
    dung()
    expect(screen.getByRole('heading', { name: 'A.I Đỗ Đại Học đã tự làm hôm nay' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tìm học sinh' }))
    const tam = screen.getByRole('dialog', { name: 'Tìm học sinh' })
    expect(within(tam).getByRole('combobox')).toBeTruthy()
  })
})

// ─────────────────────────────── MÀN: bản 3 hay bản dự phòng ───────────────────────────────
describe('HomNayScreen — /gv/bang-tin có ⇒ Bảng tin; chưa có ⇒ bản 2 dự phòng; chờ ⇒ khung xương', () => {
  const nap: { bangTin: unknown; hom: unknown; cho: boolean } = { bangTin: MAU_DAY, hom: { ok: true, btvn: { soEmCoLo: 148, soEmDungNhip: 97, dangChay: [] } }, cho: false }
  const goi: string[] = []
  beforeEach(() => {
    nap.bangTin = MAU_DAY
    nap.cho = false
    goi.length = 0
    useAppStore.getState().setScreen('examhub')
    useAppStore.getState().setClassList([{ sbd: '12001', hoTen: 'Nguyễn Minh Khôi', sdt: '', lop: '12A1', namSinh: '2008', raw: {} }])
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const u = new URL(String(url)).pathname
        goi.push(u)
        const ok = (b: unknown) => ({ ok: true, status: 200, json: async () => b })
        const kho = { ok: false, status: 404, json: async () => ({ ok: false }) }
        if (nap.cho) return new Promise(() => {})
        if (u === '/gv/bang-tin') return nap.bangTin ? ok(nap.bangTin) : kho
        if (u === '/ke-hoach/hom-nay-thay') return ok(nap.hom)
        if (u === '/gv/can-giup') return kho
        return ok({ ok: true })
      }),
    )
  })

  it('đang chờ lần đầu ⇒ khung xương (không màn trắng, không nút)', () => {
    nap.cho = true
    const { container } = render(<HomNayScreen />)
    expect(screen.getByRole('status', { name: 'Đang tải bảng tin' })).toBeTruthy()
    expect(container.querySelectorAll('button')).toHaveLength(0)
  })

  it('có /gv/bang-tin ⇒ dựng BẢNG TIN (không dựng "Chào thầy Học" của bản 2); số "đúng nhịp" lấy từ lệnh cũ; KHÔNG có nút Lấy bản mới trên trang', async () => {
    const { container } = render(<HomNayScreen />)
    await screen.findByText('Từ 12:00 · Thứ Hai 21/09/2026', { exact: false }).catch(() => undefined)
    await waitFor(() => expect(container.querySelector('[data-khung="bang-tin-v3"]')).toBeTruthy())
    expect(screen.queryByText('Chào thầy Học')).toBeNull()
    expect(screen.queryByRole('button', { name: /Lấy bản mới/ })).toBeNull()
    await waitFor(() => expect(container.querySelectorAll('.bt3-so')[3].querySelector('.bt3-so-gia-tri')?.textContent).toBe('97/ 148 em'))
    expect(goi).toContain('/gv/bang-tin')
  })

  it('lệnh /gv/bang-tin CHƯA CÓ (404) ⇒ rơi về bản 2 qua các lệnh cũ, không lỗi đỏ; bản dự phòng còn nút Lấy bản mới', async () => {
    nap.bangTin = null
    render(<HomNayScreen />)
    expect(await screen.findByText('Chào thầy Học')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Lấy bản mới/ })).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('thân trả sai dạng (thiếu nhip) ⇒ cũng rơi về bản 2, không vẽ bảng tin rỗng', async () => {
    nap.bangTin = { ok: true, baiTap: [] }
    const { container } = render(<HomNayScreen />)
    expect(await screen.findByText('Chào thầy Học')).toBeTruthy()
    expect(container.querySelector('[data-khung="bang-tin-v3"]')).toBeNull()
  })

  it('làm mới định kỳ: lần sau lỗi thì GIỮ bản đã đọc (không nhảy về bản dự phòng); tab ẩn thì dừng', async () => {
    vi.useFakeTimers()
    try {
      const { container } = render(<HomNayScreen />)
      await act(async () => void (await vi.advanceTimersByTimeAsync(50)))
      expect(container.querySelector('[data-khung="bang-tin-v3"]')).toBeTruthy()
      const truoc = goi.filter((u) => u === '/gv/bang-tin').length
      nap.bangTin = null // máy chủ lỗi ở lần làm mới sau
      await act(async () => void (await vi.advanceTimersByTimeAsync(60_100)))
      expect(goi.filter((u) => u === '/gv/bang-tin').length).toBe(truoc + 1)
      expect(container.querySelector('[data-khung="bang-tin-v3"]')).toBeTruthy()
      expect(screen.queryByText('Chào thầy Học')).toBeNull()
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
      document.dispatchEvent(new Event('visibilitychange'))
      const dung1 = goi.length
      await act(async () => void (await vi.advanceTimersByTimeAsync(180_000)))
      expect(goi.length).toBe(dung1) // ẩn tab ⇒ không gọi nữa
    } finally {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
      vi.useRealTimers()
    }
  })
})

// ─────────────────────────────── NGUỒN · CSS ───────────────────────────────
describe('khoá nguồn: một khung nhìn, token, cỡ chữ, chuyển động, chữ "Máy"', () => {
  const css = doc('src/styles/bang-tin-v3.css').replace(/\/\*[\s\S]*?\*\//g, '')

  it('trang máy tính = ĐÚNG chiều cao màn hình, không cuộn; hàng 56 · 124 · 288; khoảng cách 16; bo 20', () => {
    expect(css).toMatch(/\.bt3 \{[^}]*height: calc\(100dvh - 24px\)[^}]*overflow: hidden/)
    expect(css).toMatch(/\.bt3-dau \{[^}]*height: 56px/)
    expect(css).toMatch(/\.bt3-hang-so \{[^}]*height: 124px/)
    expect(css).toMatch(/\.bt3-giua \{[^}]*height: 288px/)
    expect(css).toMatch(/\.bt3-duoi \{[^}]*flex: 1 1 0/)
    expect(css).toMatch(/gap: 16px/)
    expect(css).toMatch(/\.bt3-o \{[^}]*border-radius: 20px/)
    expect(css).toMatch(/\.bt3-giua \{[^}]*1\.55fr[^}]*1fr/)
    expect(css).toMatch(/\.bt3-duoi \{[^}]*1\.25fr[^}]*1\.15fr[^}]*1fr[^}]*1\.1fr/)
  })

  it('màn thấp (≤ 800 px) có bản siết riêng; điện thoại: trang lướt ngang scroll-snap, nút chạm 48 px', () => {
    expect(css).toMatch(/@media \(min-width: 880px\) and \(max-height: 800px\)/)
    expect(css).toMatch(/scroll-snap-type: x mandatory/)
    expect(css).toMatch(/\.bt3-tim-nut \{[^}]*width: 48px[^}]*height: 48px/)
    expect(css).toMatch(/\.bt3-luot-sang \{[^}]*min-height: 48px/)
    expect(css).toMatch(/\.bt3-nua \{[^}]*min-height: 48px/)
  })

  it('không hex, không !important ngoài ghi đè khung vỏ (gv-page); chữ ≥ 12 px; hoạt ảnh ≤ 300 ms và có nhánh giảm chuyển động', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    const chuNho = [...css.matchAll(/font-size: (\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1])).filter((n) => n < 12)
    expect(chuNho).toEqual([])
    for (const m of css.matchAll(/(?:transition|animation)[^;]*?(\d+)ms/g)) expect(Number(m[1])).toBeLessThanOrEqual(300)
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\)/)
    const nhieuImportant = css.split('\n').filter((l) => l.includes('!important') && !/padding|gap/.test(l))
    expect(nhieuImportant).toEqual([])
    expect(css).not.toMatch(/transition: all/)
  })

  it('token màu mới có CẶP sáng/tối trong tokens.css (ô A.I Đỗ Đại Học nền đậm ở cả hai)', () => {
    const t = doc('src/styles/tokens.css')
    for (const k of ['--bt-dang-lam', '--bt-vap', '--bt-may-nen', '--bt-may-vien']) expect(t.match(new RegExp(`${k}:`, 'g'))?.length).toBeGreaterThanOrEqual(2)
    for (const k of ['--bt-dang-lam-chu', '--bt-may-chu', '--bt-may-phu', '--bt-may-xanh']) expect(t).toContain(`${k}:`)
  })

  it('chữ hiển thị: không còn "Máy" làm chủ ngữ việc tự động trong mã bảng tin; thầy chỉ đọc (không onClick trên div, không nút hành động trong nguồn)', () => {
    for (const f of ['src/components/bang-tin/cac-khoi.tsx', 'src/components/bang-tin/BangTin.tsx', 'src/lib/bang-tin-thay.ts']) {
      const s = doc(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
      expect(s).not.toMatch(/['"`>]Máy (đã|chưa|sẽ|tự)/)
      expect(s).not.toMatch(/<div[^>]*onClick/)
    }
    const kho = doc('src/components/bang-tin/cac-khoi.tsx')
    expect(kho).toContain('A.I Đỗ Đại Học đã tự làm hôm nay')
    expect(kho).toContain('A.I Đỗ Đại Học đã nhắc')
  })
})
