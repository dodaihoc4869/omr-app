// @vitest-environment jsdom
// GIAO DIỆN HỌC SINH hệ thưởng phạt kiểu Duolingo + «Học cùng bạn» (thầy chốt 26/10, bản vẽ tp-1…tp-18; DAC-TA-THUONG-PHAT-2610 mục 7 «Test giao diện»):
//  - mỗi màn vẽ ĐÚNG số từ dữ liệu giả (tests/_thuong-mau.ts, đúng tên trường hợp đồng);
//  - công tắc tắt ⇒ màn / khối ẩn hẳn; thiếu trường ⇒ ẩn, không bịa số;
//  - giảm chuyển động ⇒ không hạt, số cuối hiện ngay;
//  - màn học sinh KHÔNG có chữ «lười / đối phó / vội / treo / ĐUỔI / bậc»; Học cùng bạn không hiện điểm / nguyên tử của bạn; giải không lộ số báo danh;
//  - các màn đầy đủ nạp LƯỜI (thanh trên chỉ nạp ManThuong khi có thông báo).
import { readFileSync, readdirSync } from 'node:fs'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test', ghiDiaChiDaDung: () => {} }))

import * as M from './_thuong-mau'
import { DUONG, _quenTam, docBangGiai, docDsBan, docKetBai, docThuongCau, docTongQuan, ghiTam, khoaTam, type TongQuanThuong, type ThongBao } from '../src/lib/thuong-api'
import { _quenDaXem } from '../src/components/thuong/loc-thong-bao'
import { ThanhThuong } from '../src/components/thuong/ThanhThuong'
import { BangCombo, CHU_KHONG_TINH, OngNghiem, TamThuong } from '../src/components/thuong/TamThuong'
import KetBaiThuong from '../src/components/thuong/KetBaiThuong'
import ManThuong, { BaoGoCua, ManBinhDaDo, ManChuoiNgay, ManCuaHang, ManCuocKetQua, ManCuoiTuan, ManCuuChuoi, ManGiaiTuan, ManHocCungBan, ManHuyHieu, ManHuyHieuMoi, ManKimCuong, ManLoiMoi,
  ManMocChuoi, ManMocDoi, ManMoiBan, ManNhiemVu, ManThangHoa, TheBenThuong, ThongBaoThuong } from '../src/components/thuong/ManThuong'
import { bungHat, demSo, hoatAnh, mucChuyenDong } from '../src/lib/hieu-ung-thuong'

const TK = 'tk-em'
type Tra = Record<string, unknown>
let mayChu: Record<string, Tra> = {}
const daGoi: { duong: string; than: Tra }[] = []
function datMayChu(tq: Tra = M.tongQuanGia(), them: Record<string, Tra> = {}) {
  mayChu = { [DUONG.tongQuan]: tq, [DUONG.giai]: M.GIAI_GIA, [DUONG.huyHieu]: M.HUY_HIEU_GIA, [DUONG.ban]: M.BAN_GIA, [DUONG.timBan]: M.TIM_GIA, [DUONG.kimCuong]: M.PHIEN_KC, ...them }
  // bản gần nhất ở máy ⇒ màn vẽ NGAY từ số này (đúng như app thật), máy chủ giả trả cùng số
  _quenTam()
  try { localStorage.clear() } catch { /* bỏ qua */ }
  const tqDoc = docTongQuan(mayChu[DUONG.tongQuan])
  if (tqDoc) ghiTam(khoaTam(DUONG.tongQuan, TK), tqDoc)
  const g = docBangGiai(mayChu[DUONG.giai]); if (g) ghiTam(khoaTam(DUONG.giai, TK), g)
  const b = docDsBan(mayChu[DUONG.ban]); if (b) ghiTam(khoaTam(DUONG.ban, TK), b)
}
beforeEach(() => {
  daGoi.length = 0
  _quenDaXem()
  datMayChu()
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const duong = new URL(url).pathname
    const than = init?.body ? JSON.parse(String(init.body)) : {}
    daGoi.push({ duong, than })
    const du = mayChu[duong] ?? { ok: true }
    return new Response(JSON.stringify(du), { status: 200, headers: { 'content-type': 'application/json' } })
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.querySelectorAll('.tp-lop').forEach((e) => e.remove()) })

const tq = (them: Tra = {}) => docTongQuan(M.tongQuanGia(them)) as TongQuanThuong
const tb = (x: { ma: string; loai: string; duLieu: object }) => x as unknown as ThongBao
const CAM = /lười|đối phó|\bvội\b|\btreo\b|ĐUỔI|\bbậc\b/i
function chuMan(el: HTMLElement): string {
  const nhan = [...el.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).join(' | ')
  return `${el.textContent} | ${nhan}`
}
const ve = (x: ReactElement) => render(x).container

describe('đọc chặt theo hợp đồng', () => {
  it('tổng quan đọc đúng số; cược nhận cả {ngay} và {tuNgay}; ketBai đủ trường (giay, hoanHao)', () => {
    const t = tq()
    expect([t.nguyenTuHomNay, t.tinhThe, t.mucTieu, t.chuoiNgay?.so, t.chuoiNgay?.giuChuoi, t.giai?.thuHang, t.cuoc]).toEqual([147, 245, { daXong: 3, can: 4 }, 12, 1, 4, { dat: 50, ngay: 3 }])
    expect(tq({ cuoc: { dat: 50, tuNgay: M.ngayTruoc(2), denNgay: M.ngayTruoc(-4) } }).cuoc).toEqual({ dat: 50, ngay: 3 })
    expect(docKetBai(M.KET_BAI)).toMatchObject({ tong: 61, giay: 252, chinhXac: 83, hoanHao: false, mucTieu: { daXong: 3, can: 4 }, giai: { thuHang: 4, doi: 2 } })
    expect(docKetBai({ ...M.KET_BAI, chinhXac: 0.5 })?.chinhXac).toBe(50)
    expect(docThuongCau(M.THUONG_KHONG_TINH)).toEqual({ tinh: false, nguyenTu: 0, dong: [], chuoiDung: 0, cauKho: false })
    // thiếu trường ⇒ vắng (không bịa)
    const thieu = docTongQuan({ ok: true, bat: {}, thongBao: [], tinhThe: 'x', chuoiNgay: { so: 3 } })!
    expect(thieu.tinhThe).toBeUndefined(); expect(thieu.chuoiNgay).toBeUndefined(); expect(thieu.bat).toEqual({ giai: true, thangHoa: true, banBe: true, kimCuong: true })
    expect(docBangGiai({ ok: true, bat: false })?.tat).toBe(true)
    expect(docDsBan({ ok: true, bat: false })?.tat).toBe(true)
  })
})

describe('phần hiện ngay', () => {
  it('thanh trên (tp-4): chuỗi 12 · 147 nguyên tử · 245 tinh thể · vòng 3/4 bài; bấm ô ⇒ mở màn', async () => {
    const mo = vi.fn()
    const c = ve(<ThanhThuong token={TK} onMo={mo} thongBao={false} />)
    await waitFor(() => expect(c.querySelector('[data-k="tt"] .tp-so')?.textContent).toBe('245'))
    expect(c.querySelector('[data-k="lua"] .tp-so')?.textContent).toBe('12')
    expect(c.querySelector('[data-k="nt"] .tp-so')?.textContent).toBe('147')
    expect(screen.getByRole('button', { name: 'Mục tiêu ngày 3/4 chặng' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '245 tinh thể' }))
    expect(mo).toHaveBeenCalledWith('cua-hang')
  })
  it('thanh trên: thiếu trường ⇒ ô đó ẩn; chưa có bản nào ⇒ khung xương không số', async () => {
    datMayChu({ ok: true, bat: M.BAT, thongBao: [], tinhThe: 80 })
    const c = ve(<ThanhThuong token={TK} thongBao={false} />)
    expect(c.querySelectorAll('.tp-tr-o').length).toBe(1)
    expect(c.querySelector('.tp-tr-muc')).toBeNull()
    cleanup(); _quenTam(); localStorage.clear()
    const c2 = ve(<ThanhThuong token={TK} thongBao={false} />)
    expect(c2.querySelector('[aria-busy="true"]')).toBeTruthy()
    expect(c2.textContent).toBe('')
  })
  it('tấm kết quả câu (tp-1): +12 nguyên tử, dòng Đúng +10 · Chuỗi đúng 3 +2; câu khó +5', () => {
    const c = ve(<TamThuong thuong={docThuongCau(M.THUONG_COMBO)} />)
    expect(c.querySelector('.tong')?.textContent).toMatch(/^\+12/)
    expect([...c.querySelectorAll('.tp-ct')].map((e) => e.textContent)).toEqual(['Đúng +10', 'Chuỗi đúng 3 +2'])
    cleanup()
    const k = ve(<TamThuong thuong={docThuongCau(M.THUONG_KHO)} />)
    expect(k.querySelector('.tp-ct[data-k="kho"]')?.textContent).toBe('Câu khó +5')
  })
  it('câu không được tính (tp-2): MỘT câu trung tính, nguyên tử 0, không lộ đúng/sai, không nhãn nào khác', () => {
    const c = ve(<TamThuong thuong={docThuongCau(M.THUONG_KHONG_TINH)} />)
    expect(c.querySelector('.tp-kq-trung')?.textContent).toBe(CHU_KHONG_TINH)
    expect(CHU_KHONG_TINH).toBe('Câu này chưa được tính — đọc kĩ rồi làm nhé')
    expect(c.textContent).not.toMatch(/Đúng|Sai|Chính xác/)
    expect(chuMan(c)).not.toMatch(CAM)
    cleanup()
    expect(ve(<TamThuong thuong={null} />).innerHTML).toBe('')
  })
  it('băng phản ứng dây chuyền (A6) + ống nghiệm (A7)', () => {
    expect(ve(<BangCombo chuoi={2} />).innerHTML).toBe('')
    cleanup()
    const c3 = ve(<BangCombo chuoi={3} />)
    expect(c3.textContent).toBe('Chuỗi đúng 3 · +2 mỗi câu')
    expect(c3.querySelectorAll('.tp-phan-tu .ng').length).toBe(3)
    cleanup()
    const c5 = ve(<BangCombo chuoi={5} />)
    expect(c5.textContent).toBe('Phản ứng dây chuyền! · +5 mỗi câu')
    expect(c5.querySelector('[data-day]')).toBeTruthy()
    cleanup()
    expect(ve(<BangCombo chuoi={0} tat truoc={3} />).textContent).toBe('Chuỗi đúng: 0')
    cleanup()
    const o = ve(<OngNghiem phanTram={50} combo nhan="Câu 3/6 của bài" />)
    expect(o.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('50')
    expect(o.querySelector('[data-combo]')).toBeTruthy()
  })
})

describe('các màn (đúng số bản vẽ)', () => {
  it('kết bài (tp-3): +61 · 83% · 4:12, tách dòng đúng nhãn máy chủ, mục tiêu 3/4, lên hạng 4 ↑2', () => {
    const c = ve(<KetBaiThuong ketBai={docKetBai(M.KET_BAI)!} hang="bac" phu="Amine · chặng 3 · 6 câu" onTiep={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Xong chặng!' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Tổng nguyên tử: +61' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Chính xác: 83%' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Thời gian: 4:12' })).toBeTruthy()
    expect([...c.querySelectorAll('.hang-t')].map((r) => r.textContent)).toEqual(['Câu đúng · 5 câu × 10+50', 'Câu khó · câu 4+5', 'Chuỗi đúng · câu 3, 4+4', 'Câu sai làm kĩ · câu 5+2', 'Hoàn hảo · cần 6/6 câu đúng+0', 'Tổng+61 '])
    expect(c.textContent).toMatch(/Mục tiêu ngày · 3\/4 chặng/)
    expect(c.textContent).toMatch(/Lên hạng 4 trong nhóm Bạc ↑2/)
    expect(c.textContent).toMatch(/Top 5 cuối tuần được lên Giải Vàng/)
    cleanup()
    const h = ve(<KetBaiThuong ketBai={docKetBai(M.KET_BAI_HH)!} hang="bac" onTiep={() => {}} bat={{ giai: false, thangHoa: true, banBe: true, kimCuong: true }} />)
    expect(screen.getByRole('heading', { name: 'Hoàn hảo!' })).toBeTruthy()
    expect(h.textContent).toMatch(/Đạt mục tiêu! · 4\/4 chặng/)
    expect(h.querySelector('[aria-label="Giải tuần"]')).toBeNull() // công tắc giải tắt ⇒ ẩn thẻ giải
  })
  it('chuỗi ngày (tp-5): 12 ngày liền, 3 câu luật đúng chữ, 1/2 bình, mốc 30 còn 18 ngày, cược ngày 3/7', () => {
    const c = ve(<ManChuoiNgay token={TK} />)
    expect(c.querySelector('#tp-so-chuoi')?.textContent).toBe('12')
    expect([...c.querySelectorAll('.tp-luat li span')].map((x) => x.textContent)).toEqual([
      'Mỗi ngày xong ít nhất 1 chặng để giữ chuỗi.', 'Lỡ một ngày? Bình giữ chuỗi tự đỡ cho em. Em mang được tối đa 2 bình.', 'Hết bình? Học bù 2 chặng trong 24 giờ là cứu được chuỗi.'])
    expect(c.textContent).toMatch(/đang mang 1\/2/)
    expect(c.textContent).toMatch(/Còn 18 ngày tới mốc 30/)
    expect(c.textContent).toMatch(/Đang cược · ngày 3\/7/)
    expect(c.querySelectorAll('.tp-tuan7 .n').length).toBe(7)
    expect(c.querySelector('.tp-tuan7 .n[data-k="phep"]')?.textContent).toBe('P')
    expect(c.querySelector('.tp-tuan7 .n[data-nay]')?.getAttribute('data-k')).toBe('hoc')
  })
  it('cứu chuỗi (tp-6): vừa tắt 0/2 + đồng hồ; cứu xong 2/2 ⇒ sống lại', () => {
    ve(<ManCuuChuoi chuoi={docTongQuan(M.tongQuanGia({ chuoiNgay: M.CUU(0) }))!.chuoiNgay!} onDong={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Chuỗi 12 ngày vừa tắt' })).toBeTruthy()
    expect(screen.getByText('Chặng bù · 0/2')).toBeTruthy()
    expect(screen.getByRole('timer').textContent).toMatch(/^23:1\d:\d\d$/)
    cleanup()
    ve(<ManCuuChuoi chuoi={docTongQuan(M.tongQuanGia({ chuoiNgay: M.CUU(2) }))!.chuoiNgay!} onDong={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Chuỗi 12 ngày đã sống lại!' })).toBeTruthy()
    expect(screen.queryByRole('timer')).toBeNull()
  })
  it('giải tuần (tp-7): 20 bạn, em hạng 4 nổi bật, vùng lên 5 / rơi 4, còn 2 ngày 5 giờ, không số báo danh', () => {
    const c = ve(<ManGiaiTuan token={TK} />)
    expect(c.querySelectorAll('.tp-bxh .r').length).toBe(20)
    const em = c.querySelector('.tp-bxh .r[data-em]')!
    expect(em.getAttribute('data-h')).toBe('4'); expect(em.textContent).toMatch(/Lê Minh KhôiEm12A1412/)
    expect(c.querySelectorAll('.r[data-vung="len"]').length).toBe(5)
    expect(c.querySelectorAll('.r[data-vung="roi"]').length).toBe(4)
    expect(screen.getByRole('heading', { name: 'Giải Bạc' })).toBeTruthy()
    expect(c.textContent).toMatch(/còn 2 ngày 5 giờ/)
    expect(c.textContent).toMatch(/Top 5 lên Giải Vàng · 4 bạn cuối xuống Giải Đồng/)
    expect(c.textContent).not.toMatch(/\d{6}/)
  })
  it('cuối tuần (tp-8): lên Vàng +40 · giữ Bạc · xuống Đồng', () => {
    const t = tq()
    let c = ve(<ManCuoiTuan tb={tb(M.TB.cuoiTuanLen)} tq={t} onDong={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Lên Giải Vàng!' })).toBeTruthy()
    expect(c.textContent).toMatch(/\+40 tinh thể/); expect(c.textContent).toMatch(/4\/20/); expect(c.textContent).toMatch(/412/); expect(c.textContent).toMatch(/7\/7/)
    expect(screen.getByRole('button', { name: 'Nhận 40 tinh thể' })).toBeTruthy()
    cleanup()
    c = ve(<ManCuoiTuan tb={tb(M.TB.cuoiTuanGiu)} tq={t} onDong={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Giữ Giải Bạc' })).toBeTruthy(); expect(screen.getByRole('button', { name: 'Vào tuần mới' })).toBeTruthy()
    cleanup()
    c = ve(<ManCuoiTuan tb={tb(M.TB.cuoiTuanRoi)} tq={t} onDong={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Xuống Giải Đồng' })).toBeTruthy(); expect(c.textContent).toMatch(/18\/20/)
  })
  it('nhiệm vụ (tp-9): 3 ô 3/4 · 5/5 · 1/2, đã nhận +5, còn +40, rương khoá 1/3; đủ 3 ô ⇒ nút mở rương', () => {
    let c = ve(<ManNhiemVu token={TK} />)
    expect([...c.querySelectorAll('.tp-nv small')].map((x) => x.textContent)).toEqual(['3/4', '5/5', '1/2'])
    expect(c.querySelector('.tp-tong-nv')?.textContent).toMatch(/Đã nhận\+5 · còn có thể nhận\+40/)
    expect(screen.getByRole('img', { name: 'Đã xong 1/3 nhiệm vụ' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Mở rương/ })).toBeNull()
    cleanup(); datMayChu(M.tongQuanGia({ nhiemVu: M.NHIEM_VU_XONG }))
    c = ve(<ManNhiemVu token={TK} />)
    expect(screen.getByRole('button', { name: /Mở rương · \+15/ })).toBeTruthy()
  })
  it('cửa hàng (tp-10): 245 tinh thể, mua bình 50, cược ngày 3/7, thăng hoa + cách kiếm; công tắc tắt ⇒ ẩn khối', () => {
    let c = ve(<ManCuaHang token={TK} />)
    expect(c.querySelector('.tp-so-du .tp-so')?.textContent).toBe('245')
    expect(screen.getByRole('button', { name: 'Mua 1 bình · 50 tinh thể' })).toBeTruthy()
    expect(c.textContent).toMatch(/Đang cược · ngày 3\/7/)
    expect(screen.getByRole('heading', { name: 'Thăng hoa là gì?' })).toBeTruthy()
    expect(c.textContent).toMatch(/Thử thách Kim cương\+40/)
    cleanup(); datMayChu(M.tongQuanGia({ bat: { giai: false, thangHoa: false, banBe: true, kimCuong: false } }))
    c = ve(<ManCuaHang token={TK} />)
    expect(screen.queryByRole('heading', { name: 'Thăng hoa là gì?' })).toBeNull()
    expect(c.textContent).not.toMatch(/Lên hạng giải tuần|Thử thách Kim cương/)
  })
  it('thăng hoa (tp-11): 12 tinh thể · trước 120 · còn 108', () => {
    const c = ve(<ManThangHoa tb={tb(M.TB.thangHoa)} onDong={() => {}} />)
    expect(screen.getByRole('heading', { name: '12 tinh thể đã thăng hoa' })).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Số dư từ 120 còn 108 tinh thể' })).toBeTruthy()
    expect(c.textContent).toMatch(/10% của 120 là 12/)
  })
  it('Kim cương (tp-12): mời · làm câu 7/10 còn 2 ống · trượt · đạt; công tắc tắt ⇒ ẩn', () => {
    const phien = { phien: 'kc1', ong: 3, cau: M.PHIEN_KC.cau.map((x) => ({ ...x, phan: 'I' as const })) }
    ve(<ManKimCuong token={TK} chuyenDe="ester" tenChuyenDe="Ester – Lipid" onDong={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Thử thách Kim cương' })).toBeTruthy(); expect(screen.getByRole('button', { name: 'Bắt đầu thử thách' })).toBeTruthy()
    cleanup()
    const c = ve(<ManKimCuong token={TK} chuyenDe="ester" tenChuyenDe="Ester – Lipid" onDong={() => {}} batDau={{ buoc: 'lam', phien, viTri: 6, vo: 1, dung: 5 }} />)
    expect(c.textContent).toMatch(/Câu 7\/10/); expect(screen.getByRole('img', { name: 'Còn 2/3 ống nghiệm' })).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Kiểm tra' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /^C/ }))
    expect((screen.getByRole('button', { name: 'Kiểm tra' }) as HTMLButtonElement).disabled).toBe(false)
    expect(c.innerHTML).not.toMatch(/dapAn|correct|đáp án đúng/i)
    cleanup()
    ve(<ManKimCuong token={TK} chuyenDe="ester" tenChuyenDe="Ester – Lipid" onDong={() => {}} batDau={{ buoc: 'truot', phien, viTri: 7, vo: 3, dung: 5 }} />)
    expect(screen.getByRole('heading', { name: 'Chưa qua lần này' })).toBeTruthy(); expect(screen.getByText(/Vỡ đủ 3 ống ở câu 8\/10 · em đúng 5\/8 câu/)).toBeTruthy()
    cleanup()
    ve(<ManKimCuong token={TK} chuyenDe="ester" tenChuyenDe="Ester – Lipid" onDong={() => {}} batDau={{ buoc: 'dat', phien, viTri: 9, vo: 2, dung: 8 }} />)
    expect(screen.getByRole('heading', { name: 'Đạt Kim cương!' })).toBeTruthy(); expect(screen.getByText(/đúng 8\/10 câu, vỡ 2\/3 ống/)).toBeTruthy()
    cleanup(); datMayChu(M.tongQuanGia({ bat: { ...M.BAT, kimCuong: false } }))
    expect(ve(<ManKimCuong token={TK} chuyenDe="ester" tenChuyenDe="Ester – Lipid" onDong={() => {}} />).innerHTML).toBe('')
  })
  it('thành tích · huy hiệu (tp-13): nhóm theo mã, có/chưa có + tiến độ, «Mới»; công tắc tắt ⇒ nhóm ẩn', async () => {
    datMayChu(); ghiTam(khoaTam(DUONG.huyHieu, TK), (await import('../src/lib/thuong-api')).docDsHuyHieu(M.HUY_HIEU_GIA))
    let c = ve(<ManHuyHieu token={TK} moi="hoan_hao_10" />)
    expect([...c.querySelectorAll('.tp-the > h2')].map((x) => x.textContent)).toEqual(['Chuỗi ngày', 'Giải tuần', 'Chặng hoàn hảo', 'Thử thách Kim cương', 'Học cùng bạn', 'Đặc biệt'])
    expect(c.textContent).toMatch(/12 ngàychuỗi hiện tại/); expect(c.textContent).toMatch(/Vànghạng cao nhất/); expect(c.textContent).toMatch(/9\/21huy hiệu đã có/)
    expect(c.querySelector('[data-hh-ma="hoan_hao_10"] .tp-moi')?.textContent).toBe('Mới')
    expect(c.querySelector('[data-hh-ma="chuoi_30"] small')?.textContent).toBe('12/30')
    cleanup(); datMayChu(M.tongQuanGia({ bat: { giai: false, thangHoa: true, banBe: false, kimCuong: false } })); ghiTam(khoaTam(DUONG.huyHieu, TK), (await import('../src/lib/thuong-api')).docDsHuyHieu(M.HUY_HIEU_GIA))
    c = ve(<ManHuyHieu token={TK} />)
    expect([...c.querySelectorAll('.tp-the > h2')].map((x) => x.textContent)).toEqual(['Chuỗi ngày', 'Chặng hoàn hảo', 'Đặc biệt'])
  })
  it('học cùng bạn (tp-16): 2 bạn, lửa đôi 9 · 3, gõ cửa, mốc kế tiếp; KHÔNG điểm / nguyên tử của bạn', () => {
    const c = ve(<ManHocCungBan token={TK} onMoi={() => {}} />)
    const the = [...c.querySelectorAll('.tp-the-ban')]
    expect(the.length).toBe(2)
    expect(screen.getByRole('img', { name: 'Lửa đôi 9 ngày' })).toBeTruthy(); expect(screen.getByRole('img', { name: 'Lửa đôi 3 ngày' })).toBeTruthy()
    expect(the[0]!.textContent).toMatch(/Hôm nay cả hai đã xong/); expect(the[0]!.textContent).toMatch(/Mốc kế tiếp · 30 ngày\+30/)
    expect(the[1]!.textContent).toMatch(/Bảo chưa học hôm nay/); expect(screen.getByRole('button', { name: 'Gõ cửa' })).toBeTruthy()
    expect(c.textContent).toMatch(/Còn 1 chỗ/)
    for (const t of the) expect(t.textContent).not.toMatch(/điểm|nguyên tử|⚛/i)
  })
  it('mời bạn (tp-17): tìm ⇒ kết quả, «Đã gửi lời mời»; nhận lời mời; mốc đôi 7 ngày +10', async () => {
    ve(<ManMoiBan token={TK} onDong={() => {}} q="Hà" />)
    await waitFor(() => expect(screen.getByText('Nguyễn Thu Hà')).toBeTruthy(), { timeout: 2000 })
    expect(screen.getAllByRole('button', { name: 'Mời' }).length).toBe(2)
    expect(screen.getByRole('button', { name: 'Đã gửi lời mời' })).toBeTruthy()
    expect(daGoi.find((x) => x.duong === DUONG.timBan)?.than).toMatchObject({ q: 'Hà', token: TK })
    cleanup()
    ve(<ManLoiMoi tb={tb(M.TB.moiBan)} token={TK} onDong={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Minh Châu mời em học cùng' })).toBeTruthy(); expect(screen.getByRole('button', { name: 'Đồng ý' })).toBeTruthy()
    cleanup()
    const c = ve(<ManMocDoi tb={tb(M.TB.mocDoi)} tq={tq()} onDong={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Chuỗi đôi 7 ngày!' })).toBeTruthy(); expect(c.textContent).toMatch(/\+10 tinh thể cho mỗi bạn/)
  })
  it('bình đã đỡ (tp-18) + vắng có phép «P»', () => {
    const t = tq({ chuoiNgay: { so: 12, giuChuoi: 0, sucChua: 2, lich7: M.lich7(['hoc', 'hoc', 'hoc', 'hoc', 'hoc', 'binh', 'tat']) } })
    let c = ve(<ManBinhDaDo tb={tb(M.TB.binhDo)} tq={t} onDong={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Hôm qua bình giữ chuỗi đã đỡ cho em' })).toBeTruthy()
    expect(c.textContent).toMatch(/Chuỗi vẫn 12 ngày/); expect(c.textContent).toMatch(/Còn 0\/2 bình/)
    cleanup()
    c = ve(<ManBinhDaDo tb={tb(M.TB.phep)} tq={tq()} onDong={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Ngày vắng có phép — chuỗi vẫn giữ' })).toBeTruthy(); expect(c.textContent).toMatch(/không tốn bình/)
  })
  it('mốc chuỗi · huy hiệu mới · cược thua · gõ cửa; thẻ bên Lộ trình', () => {
    ve(<ManMocChuoi tb={tb(M.TB.mocChuoi)} tq={tq()} onDong={() => {}} />); expect(screen.getByRole('heading', { name: 'Chuỗi 7 ngày!' })).toBeTruthy(); cleanup()
    ve(<ManHuyHieuMoi tb={tb(M.TB.huyHieu)} onDong={() => {}} />); expect(screen.getByRole('heading', { name: '10 chặng hoàn hảo' })).toBeTruthy(); cleanup()
    ve(<ManCuocKetQua tb={tb(M.TB.cuocThua)} tq={tq()} onDong={() => {}} />); expect(screen.getByRole('heading', { name: 'Cược chuỗi chưa thành' })).toBeTruthy(); cleanup()
    ve(<BaoGoCua tb={tb(M.TB.goCua)} onDong={() => {}} />); expect(screen.getByText(/Bảo gõ cửa/)).toBeTruthy(); cleanup()
    const c = ve(<TheBenThuong token={TK} onMo={() => {}} />)
    expect(c.textContent).toMatch(/Giải Bạc · hạng 4\/20/); expect(c.textContent).toMatch(/Xong 4 chặng3\/4/)
  })
})

describe('công tắc tắt ⇒ ẩn hẳn', () => {
  it('giải tắt: màn giải, thông báo cuối tuần, thẻ giải ở Lộ trình đều ẩn; bạn bè tắt: Học cùng bạn ẩn; thăng hoa tắt: không thông báo', () => {
    datMayChu(M.tongQuanGia({ bat: { giai: false, thangHoa: false, banBe: false, kimCuong: true }, thongBao: [M.TB.cuoiTuanLen, M.TB.thangHoa, M.TB.moiBan] }))
    expect(ve(<ManGiaiTuan token={TK} />).innerHTML).toBe(''); cleanup()
    expect(ve(<ManHocCungBan token={TK} />).innerHTML).toBe(''); cleanup()
    expect(ve(<ManThuong man="giai" token={TK} />).innerHTML).toBe(''); cleanup()
    const t = docTongQuan(mayChu[DUONG.tongQuan])!
    expect(ve(<ThongBaoThuong token={TK} tongQuan={t} />).innerHTML).toBe(''); cleanup()
    expect(ve(<TheBenThuong token={TK} />).textContent).not.toMatch(/Giải/)
  })
  it('máy chủ trả bat:false cho /hs/giai, /hs/ban ⇒ ẩn', async () => {
    datMayChu(M.tongQuanGia(), { [DUONG.giai]: { ok: true, bat: false }, [DUONG.ban]: { ok: true, bat: false } })
    _quenTam(); localStorage.clear(); ghiTam(khoaTam(DUONG.tongQuan, TK), docTongQuan(M.tongQuanGia())!)
    const c = ve(<><ManGiaiTuan token={TK} /><ManHocCungBan token={TK} /></>)
    await waitFor(() => expect(c.innerHTML).toBe(''))
  })
  it('thông báo hiện MỘT lần: đóng ⇒ POST /hs/thuong/da-xem {ma} rồi sang thông báo kế', async () => {
    datMayChu(M.tongQuanGia({ thongBao: [M.TB.thangHoa, M.TB.mocChuoi] }))
    const t = docTongQuan(mayChu[DUONG.tongQuan])!
    ve(<ThongBaoThuong token={TK} tongQuan={t} />)
    expect(screen.getByRole('heading', { name: '12 tinh thể đã thăng hoa' })).toBeTruthy()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Để sau' })) })
    expect(daGoi.find((x) => x.duong === DUONG.daXem)?.than).toMatchObject({ ma: 'thang_hoa|1', token: TK })
    expect(screen.getByRole('heading', { name: 'Chuỗi 7 ngày!' })).toBeTruthy()
  })
})

describe('chuyển động + chữ + tốc độ', () => {
  it('giảm chuyển động: không hạt, không hoạt ảnh, số cuối hiện ngay', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} }))
    window.matchMedia = globalThis.matchMedia as typeof window.matchMedia
    expect(mucChuyenDong()).toBe('khong')
    const el = document.createElement('div'); document.body.append(el)
    el.animate = vi.fn() as never
    expect(hoatAnh(el, [{ opacity: 0 }, { opacity: 1 }], 300)).toBeNull()
    expect(el.animate).not.toHaveBeenCalled()
    bungHat([10, 10], { n: 20 })
    expect(document.querySelectorAll('.tp-hat').length).toBe(0)
    const s = document.createElement('span')
    await demSo(s, 0, 61, 800, (v) => `+${v}`)
    expect(s.textContent).toBe('+61')
    const css = readFileSync('src/styles/trong-thuong.css', 'utf8') + readFileSync('src/styles/trong-thuong-gon.css', 'utf8')
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\[data-trong='hs'\] \.tp-goc \*/)
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\[data-trong='hs'\] :is\(\.tp-tr, \.tp-kq, \.tp-combo, \.tp-ong, \.tp-lop\) \*/)
    // @ts-expect-error dọn
    delete window.matchMedia
  })
  it('mọi màn học sinh KHÔNG có chữ «lười / đối phó / vội / treo / ĐUỔI / bậc» (cả nhãn đọc màn hình)', async () => {
    const t = tq({ thongBao: [] })
    ghiTam(khoaTam(DUONG.huyHieu, TK), (await import('../src/lib/thuong-api')).docDsHuyHieu(M.HUY_HIEU_GIA))
    const phien = { phien: 'kc1', ong: 3, cau: M.PHIEN_KC.cau.map((x) => ({ ...x, phan: 'I' as const })) }
    const ds: ReactElement[] = [
      <ThanhThuong token={TK} thongBao={false} />, <TamThuong thuong={docThuongCau(M.THUONG_KHONG_TINH)} />, <TamThuong thuong={docThuongCau(M.THUONG_DAY)} />, <BangCombo chuoi={5} />,
      <KetBaiThuong ketBai={docKetBai(M.KET_BAI)!} hang="bac" onTiep={() => {}} />, <ManChuoiNgay token={TK} />, <ManGiaiTuan token={TK} />, <ManNhiemVu token={TK} />, <ManCuaHang token={TK} onPhuKien={() => {}} />,
      <ManHuyHieu token={TK} />, <ManHocCungBan token={TK} onMoi={() => {}} onHoc={() => {}} />, <ManMoiBan token={TK} onDong={() => {}} />, <TheBenThuong token={TK} />,
      <ManCuuChuoi chuoi={docTongQuan(M.tongQuanGia({ chuoiNgay: M.CUU(0) }))!.chuoiNgay!} onDong={() => {}} />,
      ...Object.values(M.TB).map((x) => <ThongBaoThuong token={TK} tongQuan={{ ...t, thongBao: [tb(x)] }} />),
      ...(['moi', 'lam', 'truot', 'dat'] as const).map((b) => <ManKimCuong token={TK} chuyenDe="e" tenChuyenDe="Ester – Lipid" onDong={() => {}} batDau={{ buoc: b, phien, viTri: 6, vo: 1, dung: 5 }} />),
    ]
    for (const x of ds) { _quenDaXem(); localStorage.removeItem('ddh.thuong.da-xem'); const c = ve(x); expect(chuMan(c)).not.toMatch(CAM); expect(c.textContent?.length).toBeGreaterThan(0); cleanup() }
    // chữ cố định trong mã nguồn (bỏ chú thích) cũng sạch
    for (const f of readdirSync('src/components/thuong').filter((x) => x.endsWith('.tsx') || x.endsWith('.ts'))) {
      const ma = readFileSync(`src/components/thuong/${f}`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')
      for (const chu of ma.match(/'[^'\n]*'|"[^"\n]*"|`[^`]*`|>[^<>{}\n]+</g) ?? []) expect(chu, `${f}: ${chu}`).not.toMatch(CAM)
    }
  })
  it('nạp lười: thanh trên / tấm câu không kéo theo các màn; màn đầy đủ nằm sau import() động', () => {
    const tt = readFileSync('src/components/thuong/ThanhThuong.tsx', 'utf8'), tam = readFileSync('src/components/thuong/TamThuong.tsx', 'utf8')
    expect(tt).toMatch(/lazy\(\(\) => import\('\.\/ManThuong'\)/)
    for (const s of [tt, tam]) expect(s).not.toMatch(/^import .*from '\.\/(ManThuong|ManChuoi|ManGiai|ManTinhThe|ManBan|ManKimCuong|ManHuyHieu|KetBaiThuong|chung)'/m)
    expect(tam).not.toMatch(/trong-thuong\.css/)
    expect(readFileSync('src/components/thuong/CAM-VAO.md', 'utf8')).toMatch(/lazy\(\(\) => import\('\.\/components\/thuong\/ManThuong'\)\)/)
  })
})
