// HÔM NAY CHỈ MỘT NÚT (thầy 10/11 duyệt bản vẽ docs/ban-ve-mot-nut-1011: «ẩn hết những phần ở dưới, chỉ để lại một nút bấm vào làm luôn» · «giữ lại nút này,
// làm xong tự chuyển để học sinh làm tiếp» — chốt: em tự bấm «Làm tiếp», bỏ hẳn Nhóm lỗi / Lịch bài) + «Hs vẫn 57 câu à» (ngày có Kiểm tra ôn tập không còn
// chặng Tự sửa lỗi riêng). Khoá: Hôm nay chỉ một nút chính; không còn danh sách Việc hôm nay / Nhóm lỗi / Lịch bài / dải nợ bài / thẻ Bạn bè; Rương chỉ khi
// hết việc; màn xong chặng còn chặng ⇒ «Làm tiếp: Chặng n» vào thẳng chặng sau + «Về Hôm nay».
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { MotTrangHs, type PropsMotTrang } from '../src/components/hoc-tap/TrongHs'
import KetBaiThuong from '../src/components/thuong/KetBaiThuong'
import { docKetBai } from '../src/lib/thuong-api'

const noop = () => {}
const goc = (them: Partial<PropsMotTrang> = {}): PropsMotTrang => ({
  so: { daLam: 6, muc: 28, chang: 2, soChang: 5 } as PropsMotTrang['so'], dangTai: false, tenBai: 'Bài 8. Amine', viec: 'Chặng 2/5',
  onHoc: noop, khoaHoc: false, hetCau: false, coCa: false, onThi: noop, soSua: 0, onChua: noop, ngayKiem: false, soBaiTap: 0, coBaiTap: false, onBaiTap: noop, ghi: [], ...them,
})
afterEach(() => { cleanup(); try { localStorage.clear() } catch { /* bỏ qua */ } })

describe('Hôm nay chỉ một nút', () => {
  it('đang học: đúng MỘT nút chính, không danh sách / Nhóm lỗi / Lịch bài / nợ bài / Bạn bè / Rương', () => {
    const onHoc = vi.fn()
    const { container } = render(<MotTrangHs {...goc({ onHoc })} />)
    expect(container.querySelectorAll('.kb-cta')).toHaveLength(1)
    expect(container.querySelector('.kb-cta b')!.textContent).toBe('Chặng 2')
    for (const s of ['.kb-viec', '.kb-viec-ds', '.kb-dong', '.kb-nhom-sua', '.kb-no-bai', '.kb-lich', '.da-ban', '.kb-the-ruong']) expect(container.querySelector(s), s).toBeNull()
    fireEvent.click(container.querySelector('.kb-cta')!)
    expect(onHoc).toHaveBeenCalledTimes(1)
  })
  it('hết việc hôm nay ⇒ không còn nút chính, Rương thay chỗ', () => {
    const { container } = render(<MotTrangHs {...goc({ so: { daLam: 30, muc: 28, chang: 5, soChang: 5 } as PropsMotTrang['so'] })} />)
    expect(container.querySelector('.kb-cta')).toBeNull()
    expect(container.querySelector('.kb-the-ruong')).toBeTruthy()
  })
  it('ngày có Kiểm tra ôn tập: không chặng Tự sửa lỗi riêng (thầy «Hs vẫn 57 câu à») — mã', () => {
    const src = readFileSync('src/components/hoc-tap/TrongHs.tsx', 'utf8')
    expect(src).toMatch(/const coSua = !!soSua && soSua > 0 && !p\.loaiNgay && !kiem\?\.homNay/)
  })
})

describe('xong chặng: «Làm tiếp» (em tự bấm) + «Về Hôm nay»', () => {
  const kb = docKetBai({ tong: 61, soDung: 5, soCau: 6, chinhXac: 83, giay: 252, dong: [] })
  it('KetBaiThuong vẽ nút phụ dưới nút chính, mỗi nút gọi đúng việc', () => {
    expect(kb).toBeTruthy()
    if (!kb) return
    const tiep = vi.fn(), ve = vi.fn()
    const { getByRole } = render(<KetBaiThuong ketBai={kb} onTiep={tiep} chuNut="Làm tiếp: Chặng 4" nutPhu={{ chu: 'Về Hôm nay', onClick: ve }} />)
    fireEvent.click(getByRole('button', { name: 'Làm tiếp: Chặng 4' }))
    fireEvent.click(getByRole('button', { name: 'Về Hôm nay' }))
    expect(tiep).toHaveBeenCalledTimes(1)
    expect(ve).toHaveBeenCalledTimes(1)
  })
  it('màn làm bài: còn chặng ⇒ «Làm tiếp: Chặng n» mở thẳng chặng sau (setLan), «Về …» về Hôm nay; hết chặng ⇒ «Tiếp tục» về Hôm nay', () => {
    const src = readFileSync('src/components/hoc-tap/ManLamBaiTap.tsx', 'utf8')
    expect(src).toMatch(/const coTiep = !!chang && !!homNayHien && chang < homNayHien\.soChang/)
    expect(src).toMatch(/coTiep \? \{ chuNut: `Làm tiếp: Chặng \$\{chang! \+ 1\}`, onTiep: \(\) => setLan\(n => n \+ 1\), nutPhu: \{ chu: `Về \$\{tenTrangChinh\(\)\}`, onClick: veLoTrinh \} \} : \{ onTiep: veLoTrinh \}/)
  })
})
