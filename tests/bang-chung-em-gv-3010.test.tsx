// @vitest-environment jsdom
// BẰNG CHỨNG CỦA MỘT EM (thầy 30/10 «Bấm vào từng hs phải ra đủ thông tin dễ hiểu sắc bén chứng minh hs đó như vậy», BangChungEm.tsx).
// Khoá: kết luận (nhóm · hạng · bậc Học thật · đối phó) + luật nhóm bằng số + số ngày đủ mức / không làm / câu thiếu + chuỗi bỏ dài nhất + dải từng ngày có
// số câu trong ô + lý do đối phó + Điểm Thật, lý do, điểm trừ, cách làm bài; thiếu bảng Học thật ⇒ nói đúng lý do; tấm Hồ sơ ở Hôm nay nhận khối này.
import { readFileSync } from 'node:fs'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import BangChungEm from '../src/components/hom-nay-thay/BangChungEm'
import type { DongNhipHoc } from '../src/lib/nhip-hoc-thay'
import type { EmLop } from '../src/lib/hoc-that-api'

afterEach(cleanup)
const NGAY = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05']
const D: DongNhipHoc = {
  sbd: 'S1', hoTen: 'Lê Văn A', lop: '12A1', khoi: '12', ngayVao: '2026-10-01', nhom: 'luoi', soNgayQua: 4, soNgayDu: 1, soNgayThieu: 3, tongCauThieu: 80,
  soNgayKhongLam: 3, tongLam: 30, chuoiKhongLam: { dai: 3, tu: '2026-10-02', den: '2026-10-04' }, chuoiDuGanNhat: 0, homNay: { muc: 30, lam: 4 },
  o: NGAY.map((ngay, i) => ({ ngay, muc: 30, lam: [30, 0, 0, 0, 4][i]!, loai: i === 0 ? 'du' : 'khong-lam', homNay: i === 4 })) as DongNhipHoc['o'],
  doiPho: { quaNhanh: { nhanh: 23, coGiay: 54, dungNhanh: 28, dungThuong: 78, coTuTinh: false }, chonLap: null, lyDo: ['23/54 lượt trả lời dưới 8 giây, nhóm này đúng 28% (lượt thường đúng 78%)'] },
}
const HT: EmLop = {
  sbd: 'S1', ten: 'Lê Văn A', lop: '12A1', tuan: '2026-10-26', diem: 31, bac: 4, bacTuan: 4, duDuLieu: true, coDo: false,
  phat: [{ ma: 'bam_voi', diem: 25, chu: '18 lượt bấm vội (nhanh mà sai)', xau: true, coDo: false }],
  soLieu: { soLuot: 120, soDo: 110, soThuoc: 12, soBamVoi: 18, soTreo: 3, soCoTinh: 1, nhanDung: 0.28, chamDung: 0.74, dungGoc: null, dungSongSinh: null, boKtcn: null },
  tienBo: null, lyDo: ['nhiều câu trả lời quá nhanh mà sai'], viec: null, bangChung: null,
}

describe('BangChungEm', () => {
  it('kết luận + bằng chứng Nhịp học bằng số + dải từng ngày', () => {
    render(<BangChungEm d={D} ht={HT} htTai="co" hang={[{ cot: 'luoi', so: 1, tong: 101 }, { cot: 'doi-pho', so: 2, tong: 11 }]} />)
    const k = screen.getByRole('region', { name: 'Vì sao xếp em như vậy' })
    for (const chu of ['Lười', 'Hạng 1/101 lười nhất', 'Hạng 2/11 đối phó nhiều nhất', 'Không dạy nổi · Điểm Thật 31', 'Có dấu hiệu đối phó']) expect(within(k).getByText(chu)).toBeTruthy()
    expect(k.textContent).toContain('Luật nhóm Lười:')
    expect(k.textContent).toContain('1/4ngày đủ mức')
    expect(k.textContent).toContain('3ngày không làm câu nào')
    expect(k.textContent).toContain('80câu còn thiếu so với mức')
    expect(k.textContent).toContain('3 ngày liền không làm')
    const ngay = within(k).getByRole('list', { name: /Từng ngày/ })
    expect(within(ngay).getAllByRole('listitem').map((li) => li.querySelector('.bce-o-ngay')!.textContent)).toEqual(['30', '0', '0', '0', '4'])
    expect(ngay.querySelector('[data-muc="hom-nay"]')).not.toBeNull()
  })
  it('đối phó: câu lý do bằng số; Học thật: Điểm Thật, điểm trừ, cách làm bài', () => {
    render(<BangChungEm d={D} ht={HT} htTai="co" hang={[]} />)
    expect(screen.getByText(/23\/54 lượt trả lời dưới 8 giây/)).toBeTruthy()
    const k = screen.getByRole('region', { name: 'Vì sao xếp em như vậy' })
    expect(k.textContent).toContain('Điểm Thật · Không dạy nổi')
    expect(within(k).getByRole('list', { name: 'Điểm trừ' }).textContent).toContain('18 lượt bấm vội (nhanh mà sai)−25')
    expect(k.textContent).toContain('18bấm vội (nhanh mà sai)')
    expect(k.textContent).toContain('28%đúng khi làm nhanh')
  })
  it('chưa có bảng Học thật ⇒ nói đúng lý do, không bịa điểm', () => {
    render(<BangChungEm d={D} htTai="tat" hang={[]} />)
    expect(screen.getByText(/Thầy đang tắt xếp Học thật · Đối phó/)).toBeTruthy()
    cleanup()
    render(<BangChungEm d={D} htTai="co" hang={[]} />)
    expect(screen.getByText(/Em chưa có Điểm Thật tuần này/)).toBeTruthy()
    expect(screen.queryByText(/Điểm Thật ·/)).toBeNull()
  })
  it('Hôm nay: tấm Hồ sơ nhận khối bằng chứng của đúng em đang mở', () => {
    const src = readFileSync('src/components/hom-nay-thay/NhipHocThay.tsx', 'utf8')
    expect(src).toContain('<HoSoLamCauEm em={mo} onDong={onDong} dauThan={bangChung} />')
    expect(src).toMatch(/t\?\.dong\.find\(\(x\) => x\.sbd === mo\.sbd\)/)
  })
})
