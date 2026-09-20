// ĐẢO THẦN THÚ bản mới · màn 2 "Hòn đảo của em" + lõi thuần dao-core + Túi đồ.
// Nguyên tắc kiểm: mọi con số trên màn đều đọc từ hồ sơ máy chủ trả (không bịa), bỏ sạch chữ người lớn của màn cũ.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import DaoCuaEm from '../src/game/than-thu-v2/dao/DaoCuaEm'
import TuiDo from '../src/game/than-thu-v2/dao/TuiDo'
import { NHOM_AI, demNhomAi, duongTienHoa, loiThu, lyDoThuongTuKetQua, mucTieuGanNhat, tienHoaKe, tinhHinhDang, vongExp } from '../src/game/than-thu-v2/dao/dao-core'
import type { DaoProfile } from '../src/game/than-thu-v2/dao/kieu'
import { advance, chooseSession } from '../src/game/than-thu-v2/core'
import type { Attempt, Mastery } from '../src/game/than-thu-v2/core'
import { thanhExp } from '../src/game/than-thu-hoa-hoc/kinh-nghiem'

afterEach(cleanup)
const NGAY = 86400000, NOW = 1_790_000_000_000
const m = (key: string, stage: number, due = NOW + NGAY): Mastery => ({ key, stage, first: stage ? NOW - 9 * NGAY : 0, due, groups: [], repaired: stage === 3 })
const hoSo = (them: Partial<DaoProfile> = {}): DaoProfile => ({ nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 34, exp: 640, wallet: 0, mastery: [m('ES-TP', 2, NOW - 1), m('ES-TEN', 3), m('ES-DOT', 1), m('CB-LM', 0)], ...them })

describe('dao-core', () => {
  it('4 nhóm ải = đúng suất của chooseSession: 2 yếu · 1 tới hạn · 2 lấp · 1 thử thách = 6 ải', () => {
    expect(NHOM_AI.map(n => [n.vai, n.suat])).toEqual([['yeu', 2], ['toi_han', 1], ['lap', 2], ['thu_thach', 1]])
    expect(NHOM_AI.reduce((s, n) => s + n.suat, 0)).toBe(6)
    expect(chooseSession([], [], [], [], 'adventure', NOW)).toEqual([]) // công thức gốc vẫn là của core.ts, đảo không có bản sao
    expect(demNhomAi([{ role: 'yeu' }, { role: 'thu_thach' }, {}, {}]).map(n => n.so)).toEqual([1, 0, 2, 1])
  })
  it('vòng EXP = exp trong ống / thanhExp(cấp); cấp 120 ⇒ đầy, không còn "còn N EXP"', () => {
    const v = vongExp(34, 640)
    expect(v.can).toBe(thanhExp(34)); expect(v.con).toBe(thanhExp(34) - 640); expect(v.tiLe).toBeCloseTo(640 / thanhExp(34))
    expect(vongExp(120, 0)).toMatchObject({ toiDa: true, tiLe: 1 })
    expect(vongExp(34, 1e12).con).toBe(0)
  })
  it('3 mục tiêu: lên cấp · dạng gần thành thạo nhất (nhiều sao nhất dưới 3) · rèn khiên từ exp.manhKhien', () => {
    const mt = mucTieuGanNhat(hoSo(), { homNay: 46, manhKhien: { manh: 8, moiKhien: 12 } }, { 'ES-TP': 'Ester thuỷ phân' })
    expect(mt.map(x => x.loai)).toEqual(['cap', 'dang', 'khien'])
    expect(mt[0]).toMatchObject({ tieuDe: 'Lên cấp 35', phu: `còn ${(thanhExp(34) - 640).toLocaleString('vi-VN')} EXP` })
    expect(mt[1]).toMatchObject({ tieuDe: 'Thành thạo dạng Ester thuỷ phân', phu: '2/3 sao' })
    expect(mt[2]).toMatchObject({ tieuDe: 'Rèn khiên', phu: '8/12 mảnh' })
  })
  it('không có số mảnh khiên ⇒ KHÔNG bịa: thay bằng mốc tiến hoá kế; có profile.khienRen thì dùng', () => {
    expect(mucTieuGanNhat(hoSo(), null)[2]).toMatchObject({ loai: 'tien-hoa', tieuDe: 'Tiến hoá dạng 4', phu: 'còn 16 cấp' })
    expect(mucTieuGanNhat(hoSo({ khienRen: { manh: 15, moiKhien: 12 } }), null)[2]).toMatchObject({ loai: 'khien', phu: '3/12 mảnh' })
    expect(mucTieuGanNhat(hoSo({ mastery: [] }), null)[1]).toMatchObject({ tieuDe: 'Gặp dạng bài đầu tiên', tiLe: 0 })
  })
  it('đường tiến hoá 6 dạng theo EVOLUTION_LEVELS; dạng chưa tới không lộ', () => {
    const d = duongTienHoa(34)
    expect(d.map(x => x.moc)).toEqual([1, 10, 30, 50, 70, 100])
    expect(d.map(x => x.daToi)).toEqual([true, true, true, false, false, false])
    expect(d.findIndex(x => x.hienTai)).toBe(2)
    expect(tienHoaKe(34)).toMatchObject({ dang: 3, moc: 50, conCap: 16 }); expect(tienHoaKe(100)).toBeNull()
  })
  it('tình hình dạng + lời thú chỉ nói điều hồ sơ có', () => {
    expect(tinhHinhDang(hoSo().mastery, NOW)).toEqual({ toiHan: 1, yeu: 1, thanhThao: 1, daGap: 4 })
    expect(loiThu(hoSo({ wallet: 120 }), NOW)).toBe('Lửa Nhỏ đang chờ em nạp 120 EXP')
    expect(loiThu(hoSo(), NOW, 5)).toMatch(/chuỗi 5 ngày/)
    expect(loiThu(hoSo(), NOW)).toBe('Lửa Nhỏ nhắc em: 1 dạng tới hạn ôn hôm nay')
    expect(loiThu(hoSo({ mastery: [], nickname: undefined }), NOW)).toBe('Viêm Sư háo hức đi chuyến đầu tiên cùng em')
  })
  it('lý do thưởng khớp `advance`: 20/40/40 = sao 1/2/3; sai, có trợ giúp, đúng mà chưa tới hạn đều 0 EXP và nói rõ vì sao', () => {
    const a = (them: Partial<Attempt>): Attempt => ({ id: 'a', session: 's', group: 'g1', qid: 'q', dang: 'D', mucDo: 'biet', correct: true, assisted: false, at: NOW, novel: true, ...them })
    const b1 = advance(undefined, a({}))
    expect(lyDoThuongTuKetQua({ correct: true, assisted: false, reward: b1.reward, stage: b1.mastery.stage })).toMatchObject({ moc: 1, exp: 20 })
    const b2 = advance(b1.mastery, a({ group: 'g2', at: NOW + NGAY }))
    expect(lyDoThuongTuKetQua({ correct: true, assisted: false, reward: b2.reward, stage: b2.mastery.stage })).toMatchObject({ moc: 2, exp: 40, chu: expect.stringContaining('sao thứ 2') })
    const b3 = advance(b2.mastery, a({ group: 'g3', at: NOW + 8 * NGAY }))
    expect(lyDoThuongTuKetQua({ correct: true, assisted: false, reward: b3.reward, stage: b3.mastery.stage })).toMatchObject({ moc: 3, exp: 40, chu: expect.stringContaining('sao thứ 3') })
    const som = advance(b1.mastery, a({ group: 'g2', at: NOW + 1000 }))
    expect(lyDoThuongTuKetQua({ correct: true, assisted: false, reward: som.reward, stage: som.mastery.stage })).toMatchObject({ moc: 0, exp: 0, chu: expect.stringContaining('sao thứ 2 mở khi') })
    expect(lyDoThuongTuKetQua({ correct: false, assisted: false, reward: 0, stage: 1 }).chu).toMatch(/Chưa đúng/)
    expect(lyDoThuongTuKetQua({ correct: true, assisted: true, reward: 0, stage: 1 }).chu).toMatch(/trợ giúp/)
  })
})

describe('Hòn đảo của em', () => {
  const dung = (them: Partial<Parameters<typeof DaoCuaEm>[0]> = {}) => render(<div className="dao"><DaoCuaEm profile={hoSo()} now={NOW} onLenDuong={() => {}} {...them} /></div>)
  it('hiện đúng thú / cấp / dạng tiến hoá thật bằng ảnh nhẹ; "còn N EXP lên cấp"; MỘT nút LÊN ĐƯỜNG', () => {
    const onLenDuong = vi.fn(), { container } = dung({ onLenDuong })
    expect(container.querySelector('.dao-hon-thu')!.getAttribute('src')).toBe('/than-thu-v2/nho/thu-2-2.webp')
    expect(screen.getByRole('status').textContent).toBe(`còn ${(thanhExp(34) - 640).toLocaleString('vi-VN')} EXP lên cấp 35`)
    const nut = screen.getAllByRole('button', { name: /LÊN ĐƯỜNG/ }); expect(nut.length).toBe(1)
    fireEvent.click(nut[0]!); expect(onLenDuong).toHaveBeenCalledTimes(1)
    expect([...container.querySelectorAll('img')].every(i => i.getAttribute('src')!.startsWith('/than-thu-v2/nho/'))).toBe(true)
  })
  it('thẻ chuyến thám hiểm: 4 nhóm ải 2·1·2·1; gợi ý của máy chủ in nguyên tên; hết 200 câu ⇒ khoá nút', () => {
    const { container, rerender } = dung({ goiY: [{ title: 'Ester thuỷ phân' }, { title: 'Glucose tráng bạc' }] })
    expect([...container.querySelectorAll('.dao-chuyen-ai li')].map(li => li.textContent)).toEqual(['2Sửa lỗi', '1Ký ức', '2Luyện đều', '1Trùm ải'])
    expect(container.querySelector('.dao-chuyen-ta')!.textContent).toContain('Ester thuỷ phân · Glucose tráng bạc')
    rerender(<div className="dao"><DaoCuaEm profile={hoSo()} now={NOW} conLai={0} onLenDuong={() => {}} /></div>)
    expect((screen.getByRole('button', { name: /LÊN ĐƯỜNG/ }) as HTMLButtonElement).disabled).toBe(true)
    expect(container.textContent).toContain('200 câu hôm nay')
  })
  it('bỏ sạch chữ người lớn của màn cũ và không còn "today/100"', () => {
    const { container } = dung({ exp: { homNay: 46 } })
    expect(container.textContent).not.toMatch(/3 Vòng|Lõi Căn Bản|Thuật toán|tờ đề|\/ 100/)
    expect(container.textContent).toContain('+46 EXP hôm nay')
  })
  it('EXP mới / chuỗi ngày vắng ⇒ ẩn chip; đường tiến hoá: 3 dạng đã tới có ảnh bé, 3 dạng sau là "?"', () => {
    const { container } = dung()
    expect(container.querySelector('.dao-chip')).toBeNull()
    const o = [...container.querySelectorAll('.dao-tien-hoa li')]
    expect(o.map(li => li.querySelector('img')?.getAttribute('src') ?? li.querySelector('b')?.textContent)).toEqual(['/than-thu-v2/nho/thu-2-0-be.webp', '/than-thu-v2/nho/thu-2-1-be.webp', '/than-thu-v2/nho/thu-2-2-be.webp', '?', '?', '?'])
    expect(container.textContent).toContain('16 cấp nữa tới dạng 4')
  })
  it('có EXP trong kho ⇒ nút nạp; đổi tên chuẩn hoá trước khi gọi; nhắc của gia đình ⇒ ôn đúng dạng', () => {
    const onNap = vi.fn(), onDoiTen = vi.fn(), onOnTheoNhac = vi.fn()
    dung({ profile: hoSo({ wallet: 120 }), onNap, onDoiTen, onOnTheoNhac, tasks: [{ id: 't', dang: 'Xà phòng hoá' }] })
    fireEvent.click(screen.getByRole('button', { name: 'Nạp 120 EXP cho Lửa Nhỏ' })); expect(onNap).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Đổi tên thần thú' }))
    fireEvent.change(screen.getByLabelText('Tên thần thú'), { target: { value: '  Tia   Nắng ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' })); expect(onDoiTen).toHaveBeenCalledWith('Tia Nắng')
    fireEvent.click(screen.getByRole('button', { name: 'Ôn ngay' })); expect(onOnTheoNhac).toHaveBeenCalledWith('Xà phòng hoá')
  })
})

describe('Túi đồ', () => {
  it('giữ NGUYÊN khiên chống đuổi (component cũ, cùng lệnh dùng khiên) + mảnh khiên; phần thưởng chưa có ⇒ SẮP MỞ', () => {
    const onDungKhien = vi.fn(async () => {})
    render(<div className="dao"><TuiDo profile={hoSo({ shields: { used: 0, activeUntil: 0 }, khienRen: { manh: 8, daRen: 1, moiKhien: 12 } })} onDungKhien={onDungKhien} /></div>)
    const khien = screen.getByLabelText('Khiên chống đuổi')
    expect(within(khien).getByText(/Khiên chống đuổi · 3 lượt/)).toBeTruthy() // cấp 34 = đã qua mốc 10 (+1) và 30 (+2)
    fireEvent.click(within(khien).getByRole('button', { name: 'Dùng Khiên chống đuổi' })); expect(onDungKhien).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('Mảnh khiên').textContent).toContain('8/12')
    expect(screen.getByLabelText('Trang phục, sắp mở').textContent).toContain('SẮP MỞ')
  })
})
