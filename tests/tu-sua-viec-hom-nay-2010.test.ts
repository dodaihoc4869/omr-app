// @vitest-environment jsdom
// VIỆC HÔM NAY của Tự sửa lỗi (thầy 20/10: "cho sửa ít nhất 12 câu mỗi ngày, chia làm các chặng"). Khoá phần THUẦN `src/lib/tu-sua-viec-hom-nay.ts`:
//   · tối thiểu 12 câu, chặng 4 câu, thứ tự gần xong → đang dở → câu mới → tự làm lại trên câu gốc; không đủ 12 ⇒ ngày nhỏ hơn đúng số có; 0 việc ⇒ null;
//   · "xong phần hôm nay" ≠ "đã tự sửa": ghép xong · tự sửa xong · hết sức mà vướng; câu chỉ có lối câu gốc xong khi em đã bấm "Kiểm tra lại" (ghi lúc làm);
//   · danh sách chỉ 100 dòng: câu rớt khỏi danh sách KHÔNG tính là xong, giữ nguyên chỗ; qua nửa đêm giờ VN ⇒ ngày mới; khoá theo SBD.
import { beforeEach, describe, expect, it } from 'vitest'
import type { MucChua } from '../src/lib/chua-cau-sai-api'
import { dungViecHomNay, ghiXongHomNay, luuViecHomNay, moTaChang, ngayVnTuSua, themMotChang, loaiViec, SO_CAU_MOI_NGAY } from '../src/lib/tu-sua-viec-hom-nay'

const NAY = Date.parse('2026-10-20T03:00:00Z') // 10:00 VN
const QUA = '2026-10-20T01:00:00Z'
const MAI = '2026-10-21T01:00:00Z'
const dai = (n: number, tt: string, tien = 'd') => Array.from({ length: n }, (_, i): MucChua => ({ qid: `${tien}${tt}${i}`, dotId: `${tien}-${tt}-${i}`, trangThai: tt }))
const ds = (...nhom: MucChua[][]) => nhom.flat()
const bat = (d: MucChua[], can?: number) => ({ trangThai: 'bat', ds: d, ...(can === undefined ? {} : { dem: { can } }) })
const dungNgay = (d: MucChua[], sbd = '11010', nay = NAY) => {
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd, token: 'x' }))
  const r = dungViecHomNay(bat(d), nay, sbd)
  luuViecHomNay(r.luu)
  return r.viec
}

beforeEach(() => { localStorage.clear() })

describe('loại việc', () => {
  it('gần xong · đang dở · mới · câu gốc; đã tự sửa và câu chờ chưa tới giờ không có việc', () => {
    const l = (trangThai: string, denHan?: string) => loaiViec({ trangThai, ...(denHan ? { denHan } : {}) }, NAY)
    expect(l('cho_gap_lai_2', QUA)).toBe('gan')
    expect(l('dang_kiem_chung')).toBe('gan')
    expect(l('dang_chua_buoc')).toBe('dang')
    expect(l('dang_ghep_bai')).toBe('dang')
    expect(l('can_chan_doan')).toBe('moi')
    for (const t of ['thieu_hoc_lieu', 'can_thay', 'tam_khoa', 'cau_thay_doi']) expect(l(t)).toBe('goc')
    expect(l('cho_gap_lai_2', MAI)).toBeNull()
    expect(l('cho_gap_lai_2')).toBeNull()
    expect(l('da_tu_sua')).toBeNull()
  })
})

describe('chọn 12 câu, chia chặng', () => {
  it('tối thiểu 12 câu, 3 chặng × 4, thứ tự gần xong → đang dở → mới → câu gốc', () => {
    const v = dungNgay(ds(dai(30, 'thieu_hoc_lieu', 'g'), dai(3, 'can_chan_doan', 'm'), dai(2, 'dang_chua_buoc', 'k'), [{ qid: 'x1', dotId: 'x-1', trangThai: 'cho_gap_lai_2', denHan: QUA }]))!
    expect(SO_CAU_MOI_NGAY).toBe(12)
    expect(v.tong).toBe(12)
    expect(v.chang.map((c) => c.length)).toEqual([4, 4, 4])
    expect(v.muc.map((x) => x.loai).slice(0, 7)).toEqual(['gan', 'dang', 'dang', 'moi', 'moi', 'moi', 'goc'])
    expect(v.tiep?.khoa).toBe('x-1')
    expect(v.changHienTai).toBe(0)
  })
  it('không đủ 12 câu làm được ⇒ ngày nhỏ hơn đúng số có; không có việc nào ⇒ null', () => {
    const v = dungNgay(dai(7, 'can_chan_doan'))!
    expect(v.tong).toBe(7)
    expect(v.chang.map((c) => c.length)).toEqual([4, 3])
    localStorage.clear()
    expect(dungNgay([...dai(3, 'da_tu_sua'), { qid: 'c', dotId: 'c1', trangThai: 'cho_gap_lai_2', denHan: MAI }])).toBeNull()
    expect(dungViecHomNay({ trangThai: 'tat' }, NAY, '11010')).toEqual({ viec: null, luu: null })
    expect(dungViecHomNay({ trangThai: 'loi' }, NAY, '11010').viec).toBeNull()
  })
  it('còn bao nhiêu câu cho các ngày sau: nhóm cần sửa trừ câu của hôm nay (dùng số đếm máy chủ khi có)', () => {
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '11010' }))
    const d = dai(20, 'can_chan_doan')
    const r = dungViecHomNay(bat(d, 155), NAY, '11010')
    expect(r.viec!.conNgaySau).toBe(155 - 12)
    expect(dungViecHomNay(bat(d), NAY, '11010').viec!.conNgaySau).toBe(20 - 12)
  })
  it('đóng băng trong ngày: lần dựng sau giữ đúng 12 câu và thứ tự, dù có câu mới tới giờ', () => {
    const d = dai(20, 'can_chan_doan')
    const a = dungNgay(d)!
    const d2 = [{ qid: 'moi', dotId: 'moi-1', trangThai: 'cho_gap_lai_2', denHan: QUA } as MucChua, ...d]
    const b = dungViecHomNay(bat(d2), NAY + 3600_000, '11010').viec!
    expect(b.muc.map((x) => x.khoa)).toEqual(a.muc.map((x) => x.khoa))
    expect(b.muc.some((x) => x.khoa === 'moi-1')).toBe(false)
  })
})

describe('xong phần hôm nay ≠ đã tự sửa', () => {
  it('ghép xong (chờ bản mới) · đã tự sửa · hết sức mà vướng đều là xong phần; đang sửa dở thì chưa', () => {
    const d = ds([{ qid: 'a', dotId: 'a', trangThai: 'dang_ghep_bai' }, { qid: 'b', dotId: 'b', trangThai: 'cho_gap_lai_2', denHan: QUA }, { qid: 'c', dotId: 'c', trangThai: 'dang_chua_buoc' }, { qid: 'd', dotId: 'd', trangThai: 'can_chan_doan' }])
    const v0 = dungNgay(d)!
    expect(v0.xong).toBe(0)
    // a: ghép xong ⇒ cho_gap_lai_2 chưa tới giờ · b: tự sửa xong · c: vướng ⇒ can_thay · d: mới bắt đầu
    const sau = ds([{ qid: 'a', dotId: 'a', trangThai: 'cho_gap_lai_2', denHan: MAI }, { qid: 'b', dotId: 'b', trangThai: 'da_tu_sua' }, { qid: 'c', dotId: 'c', trangThai: 'can_thay' }, { qid: 'd', dotId: 'd', trangThai: 'dang_chua_buoc' }])
    const v1 = dungViecHomNay(bat(sau), NAY, '11010').viec!
    expect(v1.muc.map((x) => x.xong)).toEqual([true, true, true, false]) // gan(b) đứng đầu rồi dang(a,c) rồi moi(d): thứ tự lưu giữ nguyên
    expect(v1.xong).toBe(3)
    expect(v1.tiep?.khoa).toBe('d')
  })
  it('câu chỉ có lối câu gốc chỉ xong khi em đã bấm "Kiểm tra lại" (ghi lúc làm), không xong chỉ vì xem lời giải', () => {
    const d = dai(2, 'thieu_hoc_lieu')
    const v = dungNgay(d)!
    expect(v.muc.every((x) => !x.xong)).toBe(true)
    ghiXongHomNay('d-thieu_hoc_lieu-0', NAY)
    ghiXongHomNay('d-thieu_hoc_lieu-0', NAY) // lặp lại không đổi gì
    const v2 = dungViecHomNay(bat(d), NAY, '11010').viec!
    expect(v2.muc.map((x) => x.xong)).toEqual([true, false])
    expect(JSON.parse(localStorage.getItem('omr_tu_sua_hom_nay_11010')!).x).toEqual(['d-thieu_hoc_lieu-0'])
  })
  it('câu gốc ở trạng thái can_thay (chờ chữa trên lớp) vẫn cần ghi lúc làm: chỉ tự đổi trạng thái chưa đủ', () => {
    const d = dai(1, 'can_thay')
    expect(dungNgay(d)!.xong).toBe(0)
  })
})

describe('danh sách 100 dòng, nửa đêm, nhiều em', () => {
  it('câu rớt khỏi danh sách KHÔNG tính là xong và giữ nguyên chỗ; đã ghi lúc nộp thì xong', () => {
    const d = dai(12, 'dang_chua_buoc')
    const v0 = dungNgay(d)!
    const roi = d.slice(1) // câu đầu rớt khỏi trang 1
    const v1 = dungViecHomNay(bat(roi), NAY, '11010').viec!
    expect(v1.tong).toBe(12)
    expect(v1.muc[0]!.khoa).toBe(v0.muc[0]!.khoa)
    expect(v1.muc[0]!.xong).toBe(false)
    ghiXongHomNay(v0.muc[0]!.khoa, NAY)
    expect(dungViecHomNay(bat(roi), NAY, '11010').viec!.muc[0]!.xong).toBe(true)
  })
  it('qua nửa đêm giờ VN ⇒ ngày mới (17:00 UTC), chọn lại từ danh sách', () => {
    expect(ngayVnTuSua(Date.parse('2026-10-20T16:59:00Z'))).toBe('2026-10-20')
    expect(ngayVnTuSua(Date.parse('2026-10-20T17:00:00Z'))).toBe('2026-10-21')
    const d = dai(13, 'can_chan_doan')
    dungNgay(d)
    ghiXongHomNay('d-can_chan_doan-0', NAY)
    const sang = dungViecHomNay(bat(d), Date.parse('2026-10-20T17:30:00Z'), '11010').viec!
    expect(sang.xong).toBe(0)
  })
  it('nhật ký tách theo SBD', () => {
    dungNgay(dai(5, 'can_chan_doan'), '11010')
    ghiXongHomNay('d-can_chan_doan-0', NAY)
    expect(dungViecHomNay(bat(dai(5, 'can_chan_doan')), NAY, '22020').viec!.xong).toBe(0)
  })
  it('máy chặn lưu / chưa đăng nhập ⇒ vẫn dựng được trong phiên, không ném lỗi', () => {
    localStorage.clear()
    expect(dungViecHomNay(bat(dai(5, 'can_chan_doan')), NAY, '').viec!.tong).toBe(5)
    expect(() => ghiXongHomNay('d')).not.toThrow()
  })
})

describe('sửa thêm một chặng và dòng mô tả chặng', () => {
  it('"Sửa thêm" mở thêm đúng 4 câu, lưu lại; không còn câu thì không thêm', () => {
    const d = dai(20, 'can_chan_doan')
    dungNgay(d)
    const v = themMotChang(bat(d), NAY)!
    expect(v.tong).toBe(16)
    expect(v.chang.map((c) => c.length)).toEqual([4, 4, 4, 4])
    expect(dungViecHomNay(bat(d), NAY, '11010').viec!.tong).toBe(16)
    localStorage.clear()
    dungNgay(dai(13, 'can_chan_doan'))
    expect(themMotChang(bat(dai(13, 'can_chan_doan')), NAY)?.tong).toBe(13)
    expect(themMotChang(bat(dai(13, 'can_chan_doan')), NAY)?.tong).toBe(13)
  })
  it('moTaChang: chỉ nói phần còn việc, theo thứ tự gần xong trước', () => {
    const v = dungNgay(ds(dai(2, 'can_chan_doan', 'm'), [{ qid: 'x', dotId: 'x', trangThai: 'cho_gap_lai_2', denHan: QUA }], dai(1, 'dang_ghep_bai', 'k')))!
    expect(moTaChang(v.chang[0]!)).toBe('1 câu chỉ còn làm bản mới · 1 câu đang sửa dở · 2 câu chưa bắt đầu')
    expect(moTaChang([])).toBe('')
  })
})
