// ĐỢT 19 · LÀN R — app phụ huynh trùng tu theo bản vẽ thầy duyệt 13/10 (docs/ban-ve-dot19/app-phu-huynh.html; "duyệt cả hai giữ xếp theo bậc phụ
// huynh xem được hạng"; "không hiện tính cách cũng được"). Khoá:
//   · MỘT trang "Hôm nay của <tên>" có ĐỦ các phần: Hôm nay · Cần nhắc con · Nhịp học (bậc, hạng) · Nhận xét của thầy · Thái độ (6 tín hiệu: số đo, thước vạch
//     ngưỡng, "Nghĩa là") · Câu sai và tự sửa · Thời gian · Kiểm tra · Bài tập về nhà · Buổi học · Lịch sử; KHÔNG mục / nhãn tính cách;
//   · hạng chăm trong lớp hiện; buổi học hiện (có mặt lúc mấy giờ, 8 buổi, buổi vắng);
//   · phần dưới NẠP KHI CUỘN TỚI: lúc mở chưa gọi `/ph/ho-so-thai-do`, `/ph/lich-su-lam-cau`; khi phần ấy sắp hiện ⇒ gọi CẢ HAI, song song (cùng lúc);
//   · máy chủ cũ thiếu trường ⇒ phần đó ẩn (không vỡ, không số giả); lệnh hồ sơ chưa có ⇒ lý do + nút tải lại;
//   · số nào cũng có nhãn; không mã nội bộ (mã ca, mã bài, mã câu) trên trang; thanh mục bấm ⇒ cuộn tới phần.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import AppPhuHuynh from '../src/components/ph-v3/AppPhuHuynh'
import { buoiHomNay, dongCanNhac, oNgay, phanCo, tenGoi } from '../src/components/ph-v3/TrangVeCon'
import { chuKetLuan, giayTheoMucDo, nghiaLa, soLieu, THUOC } from '../src/components/ph-v3/TrangVeConDuoi'
import { docTatCaVeCon } from '../src/lib/ph-moi/du-lieu'
import { docConTongQuan } from '../src/lib/ph-v3/con-tong-quan'
import { docHoSoThaiDo, NGUONG_THAI_DO } from '../src/lib/bai-hang-ngay-api'
import { docLichSuLamCau } from '../src/lib/lich-su-lam-cau-api'
import { NAY, hoc2Gia, lichSuGia, loiThayGia, nhipGia, thaiDoGia, tatCaGia, tongQuanGia } from '../scripts/chup-ph-dot19/gia'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/tai-thong-tin-ph', () => ({ taiThongTinPhuHuynh: async () => ({ canhBao: [] }) }))

type Tra = { body: unknown; status?: number }
let may: Record<string, () => Tra> = {}
let goi: { duong: string; luc: number }[] = []
let choHoSo: (() => void)[] = []
let giuHoSo = false
let ioCb: ((e: { isIntersecting: boolean }[]) => void) | null = null

function mayMacDinh(): Record<string, () => Tra> {
  return {
    '/ph/tat-ca-ve-con': () => ({ body: tatCaGia() }),
    '/ph/con-tong-quan': () => ({ body: tongQuanGia() }),
    '/ph/nhip-hoc': () => ({ body: nhipGia() }),
    '/ph/loi-thay': () => ({ body: loiThayGia() }),
    '/ph/hoc-2': () => ({ body: hoc2Gia() }),
    '/ph/ho-so-thai-do': () => ({ body: thaiDoGia() }),
    '/ph/lich-su-lam-cau': () => ({ body: lichSuGia() }),
  }
}

beforeEach(() => {
  may = mayMacDinh()
  goi = []
  choHoSo = []
  giuHoSo = false
  ioCb = null
  localStorage.clear()
  window.history.replaceState(null, '', '/?vai=phuhuynh')
  vi.stubGlobal('scrollTo', vi.fn())
  class IO {
    constructor(cb: (e: { isIntersecting: boolean }[]) => void) { ioCb = cb }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', IO)
  Element.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    const duong = String(url).replace('https://may.test', '')
    goi.push({ duong, luc: goi.length })
    const r = may[duong]?.() ?? { body: { ok: true } }
    const res = { ok: (r.status ?? 200) < 400, status: r.status ?? 200, json: async () => r.body, text: async () => JSON.stringify(r.body) }
    if (giuHoSo && /ho-so-thai-do|lich-su-lam-cau/.test(duong)) return new Promise((ok) => choHoSo.push(() => ok(res)))
    return Promise.resolve(res)
  }))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})

const moTrang = async () => {
  const r = render(<div className="m3"><AppPhuHuynh sbd="12121212" hoTen="Nguyễn Minh Khôi" lop="12A1" onDoiSbd={() => {}} /></div>)
  await waitFor(() => expect(r.container.querySelector('[data-vung="anh-hung"]')).toBeTruthy())
  await waitFor(() => expect(r.container.querySelector('[data-vung="nhip-hoc-con"]')).toBeTruthy())
  await waitFor(() => expect(r.container.querySelector('[data-vung="goi-y-nhac"]')).toBeTruthy())
  return r.container
}
/** Báo phần Thái độ sắp hiện (IntersectionObserver giả) ⇒ phần dưới nạp. */
const cuonToi = async () => {
  await act(async () => { ioCb?.([{ isIntersecting: true }]) })
}
const moHet = async () => {
  const c = await moTrang()
  await cuonToi()
  await waitFor(() => expect(c.querySelector('[data-vung="tin-hieu"]')).toBeTruthy())
  await waitFor(() => expect(c.querySelector('[data-vung="cau-chua-sua"]')).toBeTruthy())
  return c
}
const goiHoSo = () => goi.filter((g) => /ho-so-thai-do|lich-su-lam-cau/.test(g.duong)).map((g) => g.duong)

describe('một trang đủ mọi phần, theo bản vẽ', () => {
  it('lời chào + tiêu đề tên gọi; đủ 11 phần theo đúng thứ tự trên trang; thanh mục 9 mục', async () => {
    const c = await moHet()
    expect(c.querySelector('.tvc-chao')!.textContent).toContain('Chào anh/chị,')
    expect(c.querySelector('.tvc-chao h1')!.textContent).toBe('Hôm nay của Khôi')
    expect(c.querySelector('.tvc-chao p')!.textContent).toBe('Cập nhật 21:05 · Thứ Tư 14/10/2026 · mọi số đo từ 01/10')
    const tieuDe = [...c.querySelectorAll('.tvc-luoi h2')].map((h) => h.textContent)
    // SỬA CÓ CHỦ ĐÍCH 24/10: thêm thẻ «Báo cáo tuần» (7 ngày gần nhất) ngay trên «Thái độ làm bài».
    expect(tieuDe).toEqual([
      'Nhịp học 14 ngày', 'Cần nhắc con', 'Nhận xét của thầy', 'Báo cáo tuần', 'Thái độ làm bài', 'Câu sai và tự sửa', 'Thời gian làm bài', 'Kiểm tra và tiến bộ', 'Bài tập về nhà', 'Buổi học trên lớp', 'Lịch sử từng ngày',
    ])
    expect(c.querySelector('#tvc-hn')!.textContent).toBe('Hôm nay · Thứ Tư 14/10')
    const phan = [...c.querySelectorAll('.tvc-luoi [data-phan]')].map((x) => x.getAttribute('data-phan'))
    expect(phan).toEqual(['hom-nay', 'nhip', 'bao-cao-tuan', 'thai-do', 'cau-sai', 'thoi-gian', 'kiem-tra', 'btvn', 'buoi-hoc', 'lich-su'])
    expect([...c.querySelectorAll('.tvc-muc-luc a')].map((a) => a.textContent)).toEqual(['Hôm nay', 'Nhịp học', 'Thái độ', 'Câu sai', 'Thời gian', 'Kiểm tra', 'Bài tập về nhà', 'Buổi học', 'Lịch sử'])
    expect([...c.querySelectorAll('nav.tvc-ben a')].map((a) => a.textContent)).toEqual(['Hôm nay', 'Nhịp học', 'Thái độ', 'Câu sai', 'Thời gian', 'Kiểm tra', 'Bài tập về nhà', 'Buổi học', 'Lịch sử'])
    expect(c.querySelector('.tvc-chan')!.textContent).toContain('Mọi con số trên trang là số app đo được')
  })

  it('Hôm nay: 18/30 câu một lần · còn 12 câu · có mặt buổi học 17:52 · các lần học + hôm qua · đúng 13 sai 5 · 41 giây/câu · bậc + nhóm + điểm chăm + chuỗi', async () => {
    const c = await moTrang()
    const hn = c.querySelector('[data-vung="anh-hung"]')!
    expect(c.querySelectorAll('[data-vung="so-cau-hom-nay"]')).toHaveLength(1)
    expect(hn.querySelector('[data-vung="so-cau-hom-nay"]')!.textContent).toBe('18/30 câu')
    expect(hn.textContent).toContain('Con đã làm / mức tối thiểu của ngày')
    expect(hn.querySelector('.tvc-hn-con')!.textContent).toBe('Còn 12 câu nữa là đủ mức hôm nay.')
    expect(hn.querySelector('[data-vung="co-mat-hom-nay"]')!.textContent).toBe('Có mặt buổi học · 17:52')
    expect([...hn.querySelectorAll('[data-vung="lan-hoc-hom-nay"] li')].map((li) => li.textContent)).toEqual(['19:31–19:3911 câu8 phút', '20:38–20:427 câu4 phút', 'Hôm qua31 câu · đúng 77%22 phút'])
    expect([...hn.querySelectorAll('[data-vung="dung-sai-hom-nay"] > div')].map((d) => [d.querySelector('dt')!.textContent, d.querySelector('dd')!.textContent])).toEqual([['Câu đúng', '13'], ['Câu sai', '5'], ['Trung bình', '41 giây/câu']])
    await waitFor(() => expect(hn.querySelector('[data-vung="bac-hom-nay"]')).toBeTruthy())
    const bac = hn.querySelector('[data-vung="bac-hom-nay"]')!
    expect(bac.tagName).toBe('BUTTON') // bấm ⇒ tấm 12 bậc của làn M
    expect(bac.textContent).toMatch(/^Bậc 7\/12 · Đại Sư Cân Bằng/)
    expect(bac.textContent).toMatch(/Nhóm Chưa đều · Điểm chăm \d+\/100 · Chuỗi đủ mức 3 ngày/)
    expect(bac.querySelector('svg.bcc-hh')).toBeTruthy() // huy hiệu vẽ riêng (HuyHieuBac)
  })

  it('Cần nhắc con: gợi ý số liệu (bỏ vế khuyên), xếp theo mức cần để ý, thêm câu đến lịch ôn lại hôm nay và bài tập về nhà đang chạy; không lặp số câu hôm nay', async () => {
    const c = await moTrang()
    const ds = [...c.querySelectorAll('[data-vung="goi-y-nhac"] li')]
    expect(ds.map((li) => li.getAttribute('data-ma'))).toEqual(['nhanh-sai', 'sai-chua-sua', 'ti-le-giam', 'btvn-B7'])
    expect(ds.map((li) => li.textContent)).toEqual([
      '7 ngày qua có 40 câu con làm dưới 8 giây và sai 28 câu.',
      'Có 19 câu con làm sai chưa sửa được. Hôm nay có 4 câu đến lịch ôn lại.',
      'Tỉ lệ đúng 7 ngày qua là 66%, thấp hơn 7 ngày trước đó (74%).',
      'Bài tập về nhà Ester – Lipid · buổi 7 còn 2/5 chặng, hạn nộp 23:59 Thứ Năm 15/10.',
    ])
    expect(c.querySelector('[data-vung="goi-y-nhac"]')!.textContent).not.toMatch(/Nhắc con|Hỏi con|Tự sửa lỗi/)
    expect(c.querySelector('[data-vung="goi-y-nhac"] li b')!.textContent).toBe('7') // số được tô đậm
  })

  it('Nhịp học 14 ngày: 14 ô (trạng thái bằng chữ, không chỉ màu) · ngày đủ mức · chuỗi · câu còn thiếu · thang 12 bậc · luật lên bậc · độ tin cậy · HẠNG CHĂM trong lớp', async () => {
    const c = await moTrang()
    const n = c.querySelector('[data-vung="nhip-hoc-con"]')!
    const o = [...n.querySelectorAll('.tvc-o-ngay')]
    expect(o).toHaveLength(14)
    expect(o.map((x) => x.getAttribute('data-t'))).toEqual(['du', 'du', 'it', 'du', 'khong', 'du', 'du', 'nhieu', 'du', 'it', 'du', 'du', 'du', 'nay'])
    expect(o[4]!.textContent).toContain('05/10: đã làm 0/30 câu — không làm')
    expect(o[13]!.textContent).toContain('14/10 (hôm nay): đã làm 18/30 câu — đang làm')
    expect(n.querySelector('[data-vung="nhom-nhip"]')!.textContent).toBe('Chưa đều')
    expect([...n.querySelectorAll('[data-vung="so-nhip"] > div')].map((d) => d.textContent)).toEqual(['Ngày đủ mức9/13 ngày (69%)', 'Chuỗi đủ mức3 ngày liền', 'Câu còn thiếu69 câu so với mức'])
    await waitFor(() => expect(n.querySelector('.tvc-thang')).toBeTruthy())
    expect(n.querySelectorAll('.tvc-thang > i')).toHaveLength(12)
    expect(n.querySelector('.tvc-thang > i[data-hien]')!.getAttribute('data-bac')).toBe('7')
    expect(n.querySelector('.tvc-thang-nhan')!.textContent).toBe('Lười 1–5Chưa đềuChăm 8–12')
    expect(n.querySelector('[data-vung="luat-len-bac"]')!.textContent).toContain('Lên Bậc 8/12 · Tân Binh Siêng Năng khi con vào nhóm Chăm (từ 80% số ngày đủ mức): cần thêm 7 ngày đủ mức, tính cả hôm nay.')
    expect(n.textContent).toContain('Độ tin cậy của nhóm 84%')
    // thầy duyệt 13/10: "phụ huynh xem được hạng"
    expect(n.querySelector('[data-vung="hang-cham"]')!.textContent).toBe('Độ chăm hôm nay: con đang hạng 17 trong 42 bạn của lớp.Xếp theo số câu đã làm hôm nay.')
  })

  it('Nhận xét của thầy: lời mới nhất (tác giả Thầy Đỗ Đại Học) + liên kết xem tất cả 6 nhận xét', async () => {
    const c = await moTrang()
    await waitFor(() => expect(c.querySelector('[data-vung="loi-thay-moi"]')).toBeTruthy())
    const t = c.querySelector('[data-vung="loi-thay-moi"]')!
    expect(t.textContent).toContain('Thầy Đỗ Đại Học · sau Kiểm tra 45 phút · Thứ Bảy 10/10')
    expect(t.querySelector('blockquote')!.textContent).toContain('Phần III con còn sai 2 câu hiệu suất ester hoá')
    expect(t.querySelector('a[href="#loi-thay"]')!.textContent).toBe('Xem tất cả 6 nhận xét của thầy')
  })

  it('KHÔNG mục / nhãn tính cách (thầy chốt 13/10); không mã nội bộ; không đáp án', async () => {
    const c = await moHet()
    const chu = c.textContent!
    expect(chu).not.toMatch(/[Tt]ính cách|tâm lý|cảm xúc|động lực|mức tập trung|hướng nội|hướng ngoại/)
    for (const ma of ['CA-45', 'B7', 'B6', 'q12', 's-Câu', 'luyen_dang_vap', 'on_lai', 'doi-pho', 'chua-deu', 'qua-nhanh', 'undefined', 'NaN', 'null']) expect(chu, ma).not.toContain(ma)
    expect(chu).not.toMatch(/[Đđ]áp án đúng/)
  })
})

describe('phần dưới: nạp khi cuộn tới, hai lệnh song song', () => {
  it('lúc mở KHÔNG gọi hồ sơ thái độ / lịch sử làm câu; phần sắp hiện ⇒ gọi CẢ HAI cùng lúc (lệnh thứ hai không chờ lệnh thứ nhất), một lần', async () => {
    giuHoSo = true
    const c = await moTrang()
    expect(goiHoSo()).toEqual([])
    expect(c.querySelectorAll('[data-vung="phan-cho"]').length).toBe(7) // khung chờ đúng chỗ, giữ id để thanh mục cuộn tới được
    await cuonToi()
    await waitFor(() => expect(goiHoSo().sort()).toEqual(['/ph/ho-so-thai-do', '/ph/lich-su-lam-cau']))
    expect(choHoSo).toHaveLength(2) // cả hai đang chờ CÙNG LÚC ⇒ song song
    await waitFor(() => expect(c.querySelector('[data-vung="thai-do"]')).toBeTruthy())
    expect(c.querySelector('[data-vung="thai-do"] [role="status"]')).toBeTruthy() // khung chờ của 6 tín hiệu
    await act(async () => { for (const f of choHoSo.splice(0)) f() })
    await waitFor(() => expect(c.querySelector('[data-vung="tin-hieu"]')).toBeTruthy())
    await cuonToi()
    expect(goiHoSo()).toHaveLength(2) // không gọi lại
  })

  it('Thái độ: kết luận đối phó nói thẳng bằng số; 6 tín hiệu đủ số đo · thước có hai vạch ngưỡng · "Nghĩa là" · ngưỡng · độ tin cậy', async () => {
    const c = await moHet()
    const kl = c.querySelector('[data-vung="ket-luan-thai-do"]')!
    expect(kl.getAttribute('data-muc')).toBe('xau')
    expect(kl.textContent).toContain('Nhóm: Chưa đều')
    expect(kl.textContent).toContain('Có dấu hiệu đối phó vì con trả lời rất nhanh ở 32% số lượt mà nhóm này chỉ đúng 29%. Nghĩa là: ở nhiều câu, con có thể đã chọn đại cho xong.')
    const th = [...c.querySelectorAll('[data-vung="tin-hieu"] .tvc-th')]
    expect(th.map((x) => x.getAttribute('data-ma'))).toEqual(['ngay-du-muc', 'qua-nhanh', 'don-bai', 'goi-y', 'chon-lap', 'xu-huong'])
    expect(th.map((x) => x.querySelector('.ph3-chip')!.textContent)).toEqual(['Cần để mắt', 'Vượt ngưỡng', 'Trong ngưỡng', 'Trong ngưỡng', 'Trong ngưỡng', 'Cần để mắt'])
    const nhanh = th[1]!
    expect(nhanh.querySelector('.tvc-th-so b')!.textContent).toBe('32%')
    expect(nhanh.querySelector('.tvc-th-so span')!.textContent).toBe('131/409 lượt dưới 8 giây · nhóm này đúng 29% (lượt thường 77%)')
    expect([...nhanh.querySelectorAll('.tvc-thuoc-moc span')].map((s) => s.textContent)).toEqual(['0%', '15%', '30%', '60%'])
    expect(nhanh.querySelector('.tvc-thuoc-cham')!.getAttribute('style')).toContain('left: 53.')
    expect(nhanh.querySelector('.tvc-th-nghia')!.textContent).toBe('Nghĩa là: Cứ 3 lượt có 1 lượt con trả lời rất nhanh, và nhóm lượt này chỉ đúng 29%: ở những câu này con có thể đã chọn cho xong.')
    expect(nhanh.querySelector('.tvc-th-chan')!.textContent).toContain('Độ tin cậy 93%')
    expect(th[5]!.querySelector('.tvc-th-so b')!.textContent).toBe('−8 điểm %')
    expect(th[5]!.querySelector('.tvc-so-sanh')!.textContent).toBe('7 ngày gần66%Trước đó74%')
    for (const x of th) expect(x.querySelector('.tvc-th-nghia')!.textContent!.length).toBeGreaterThan(20)
  })

  it('Câu sai và tự sửa (27/46, 19 chưa sửa, số giây từng lần sai) · lịch ôn lại · Thời gian (trung bình, trung vị, giờ học quen, số giây theo mức độ, phân bố 7 ngày)', async () => {
    const c = await moHet()
    const cs = c.querySelector('[data-vung="cau-sai"]')!
    expect(cs.querySelector('.tvc-vong')!.textContent).toBe('59%')
    expect(cs.textContent).toContain('Con đã làm đúng lại 27/46 câu từng sai')
    expect(cs.textContent).toContain('46 câu từng sai · 27 đã sửa · 19 chưa sửa')
    const li = [...cs.querySelectorAll('[data-vung="cau-chua-sua"] li')]
    expect(li).toHaveLength(4)
    expect(li[0]!.textContent).toBe('Câu 31 · Bảo toàn khối lượng khi xà phòng hoáVận dụng · sai 3 lần · lần cuối 13/106 giây5 giây41 giây')
    expect([...li[0]!.querySelectorAll('.tvc-giay span[data-nhanh]')].map((s) => s.textContent)).toEqual(['6 giây', '5 giây'])
    expect(cs.textContent).toContain('Xem đủ 19 câu chưa sửa và 27 câu đã sửa')
    expect(cs.querySelector('[data-vung="lich-on"]')!.textContent).toContain('Hôm nay 4 câu · ngày mai 3 câu (khoảng 6 phút) · đã khắc phục trong 14 ngày: 6 câu')
    const tg = c.querySelector('[data-vung="thoi-gian"]')!
    expect([...tg.querySelectorAll('.tvc-luoi-so > div')].map((d) => d.textContent)).toEqual(['Trung bình41 giây/lượt', 'Một nửa số lượt dưới33 giây', 'Giờ học quen19:30–21:00'])
    expect([...tg.querySelectorAll('[data-vung="giay-muc-do"] li')].map((x) => x.querySelector('span')!.textContent)).toEqual(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'])
    expect(tg.querySelector('[data-vung="giay-muc-do"] li')!.textContent).toContain('mỗi lượt · 118 lượt · đúng 90%')
    expect(tg.querySelector('[data-vung="phan-bo-giay"] li')!.textContent).toBe('Dưới 8 giây40 lượt · sai 28')
    expect(tg.textContent).toContain('Làm bài 23:00–04:59 trong 7 ngày qua: 2 ngày, 5 lượt · 14 lượt có số giây ước tính (≈) · 3 lượt chưa đo giờ.')
  })

  it('Kiểm tra (điểm, so ca trước, các phần, biểu đồ 4 ca, sơ ý, dạng) · Bài tập về nhà (chặng, hạn, nộp trễ, điểm, câu dồn) · Buổi học (7/8, vắng) · Lịch sử', async () => {
    const c = await moHet()
    const kt = c.querySelector('[data-vung="kiem-tra"]')!
    expect(kt.querySelector('.tvc-ca-so')!.textContent).toBe('7,5/10+0,75 so với ca trước (6,75)')
    expect(kt.textContent).toContain('Nộp 19:40 Thứ Bảy 10/10 · làm trong 38 phút · đúng 21/28 câu')
    expect([...kt.querySelectorAll('.tvc-ca-phan li b')].map((b) => b.textContent)).toEqual(['3,5/4,5', '2,75/4', '1,25/1,5'])
    expect(kt.querySelector('.tvc-bieu-do')!.getAttribute('aria-label')).toBe('Điểm 4 ca kiểm tra: 6 · 6,5 · 6,75 · 7,5')
    expect(kt.querySelector('[data-vung="omni-ph"]')!.textContent).toBe('Sơ ý của con6% (mục tiêu dưới 7%)Dạng cần vững3 dạngKhoảng cách tới 8Chưa tính (cần 3 ca chốt, đã có 1)')
    expect([...kt.querySelectorAll('[data-vung="dang-ph"] li')].map((x) => x.textContent)).toEqual([
      'Dạng con làm tốtGọi tên ester theo danh pháp9/10 đúng', 'Dạng con đang luyện thêmXà phòng hoá chất béo3/8 đúng', 'Dạng con đang luyện thêmHiệu suất ester hoá2/5 đúng',
      'Vừa lên bậc · 12/10Thuỷ phân ester: Hiểu → Vận dụngLên bậc',
    ])
    expect(kt.querySelector('a[href="#ca-kiem-tra"]')!.textContent).toBe('Xem tất cả 4 ca kiểm tra')
    const bt = c.querySelector('[data-vung="btvn"]')!
    expect(bt.querySelector('.tvc-chang')!.querySelectorAll('i[data-xong]')).toHaveLength(3)
    expect(bt.querySelector('[data-vung="btvn-dang-lam"]')!.textContent).toContain('Xong 3/5 chặng · hạn nộp 23:59 Thứ Năm 15/10 (còn 1 ngày 2 giờ)')
    expect([...bt.querySelectorAll('[data-vung="btvn-da-nop"] li')].map((x) => x.textContent)).toEqual([
      'Ester · buổi 6Nộp 21:40 Thứ Hai 12/10 · đúng hạn8,2', 'Ester · buổi 5Nộp 02:30 Thứ Sáu 09/10 · trễ 3,5 giờ6', 'Chất béo · buổi 4Nộp 20:15 Thứ Hai 05/10 · đúng hạn7,4',
    ])
    expect(bt.textContent).toContain('Câu dồn từ các ngày trước: 12 câu, khoảng 10 phút.')
    const bh = c.querySelector('[data-vung="buoi-hoc"]')!
    expect(bh.querySelector('[data-vung="co-mat-tong"]')!.textContent).toBe('Có mặt 7/8')
    const buoi = [...bh.querySelectorAll('li')]
    expect(buoi).toHaveLength(8)
    expect(buoi[0]!.textContent).toBe('Thứ Tư 14/10 · Buổi 8 · Ester – LipidCó mặt 17:52 · tự điểm danh bằng mã')
    expect(buoi[2]!.textContent).toBe('Thứ Năm 08/10 · Buổi 6 · EsterVắng')
    expect(buoi[3]!.textContent).toContain('thầy điểm danh')
    const ls = c.querySelector('[data-vung="lich-su"]')!
    const dong = [...ls.querySelectorAll('tbody tr')]
    expect(dong).toHaveLength(14)
    expect(dong[0]!.textContent).toBe('T4 14/10 · hôm nay18/30135')
    expect(dong[9]!.textContent).toBe('T2 05/10Không làm00')
    expect([...ls.querySelectorAll('[data-vung="cau-gan-day"] li strong')].map((s) => s.textContent)).toEqual(['42 giây', '6 giây', '1 phút 15 giây', '≈ 4 giây', '38 giây'])
    expect(ls.textContent).toContain('Xem tất cả 412 lượt')
  })
})

describe('máy chủ cũ / lỗi: phần đó ẩn hoặc nói thật, trang không vỡ', () => {
  it('thiếu buoiHoc · doCham · con-tong-quan (404) ⇒ không phần Buổi học, không hạng, không Lịch sử, không mục trỏ vào chỗ trống; không có-mặt hôm nay', async () => {
    const cu = tatCaGia({ coBuoi: false }) as Record<string, unknown>
    delete cu.doCham
    may['/ph/tat-ca-ve-con'] = () => ({ body: cu })
    may['/ph/con-tong-quan'] = () => ({ body: { ok: false, error: 'không có' }, status: 404 })
    const r = render(<div className="m3"><AppPhuHuynh sbd="12121212" hoTen="Nguyễn Minh Khôi" lop="12A1" onDoiSbd={() => {}} /></div>)
    const c = r.container
    await waitFor(() => expect(c.querySelector('[data-vung="nhip-hoc-con"]')).toBeTruthy())
    await waitFor(() => expect(goi.some((g) => g.duong === '/ph/con-tong-quan')).toBe(true))
    await cuonToi()
    await waitFor(() => expect(c.querySelector('[data-vung="tin-hieu"]')).toBeTruthy())
    expect(c.querySelector('[data-phan="buoi-hoc"]')).toBeNull()
    expect(c.querySelector('[data-phan="lich-su"]')).toBeNull()
    expect(c.querySelector('[data-vung="hang-cham"]')).toBeNull()
    expect(c.querySelector('[data-vung="co-mat-hom-nay"]')).toBeNull()
    expect(c.querySelector('[data-vung="dung-sai-hom-nay"]')).toBeNull()
    expect([...c.querySelectorAll('.tvc-muc-luc a')].map((a) => a.textContent)).not.toContain('Buổi học')
    expect([...c.querySelectorAll('.tvc-muc-luc a')].map((a) => a.textContent)).not.toContain('Lịch sử')
    // số câu hôm nay rơi về kế hoạch Game Hoá 2.0 (một nguồn)
    expect(c.querySelector('[data-vung="so-cau-hom-nay"]')!.textContent).toBe('18/30 câu')
    // Kiểm tra (7 cột) không có Bài tập về nhà bên cạnh? có ⇒ vẫn 7; Buổi học vắng ⇒ không lỗ
    expect(c.textContent).not.toMatch(/undefined|NaN/)
  })

  it('lệnh hồ sơ chưa có (404) ⇒ phần Thái độ / Câu sai nói thật + nút tải lại; bấm ⇒ gọi lại; các phần khác vẫn đủ', async () => {
    may['/ph/ho-so-thai-do'] = () => ({ body: {}, status: 404 })
    may['/ph/lich-su-lam-cau'] = () => ({ body: {}, status: 404 })
    const c = await moTrang()
    await cuonToi()
    await waitFor(() => expect(c.querySelector('[data-vung="thai-do"]')!.textContent).toContain('Máy chủ chưa có hồ sơ làm bài cho phụ huynh'))
    expect(c.querySelector('[data-vung="cau-sai"]')!.textContent).toContain('Chưa tải được danh sách câu sai của con.')
    expect(c.querySelector('[data-vung="cau-sai"]')!.textContent).toContain('Con đã làm đúng lại 27/46 câu từng sai') // số tổng quan (đã tải lúc mở) vẫn hiện
    expect(c.querySelector('[data-vung="kiem-tra"]')).toBeTruthy()
    may = mayMacDinh()
    const truoc = goiHoSo().length
    fireEvent.click([...c.querySelectorAll('button')].find((b) => b.textContent === 'Tải lại thái độ làm bài')!)
    await waitFor(() => expect(c.querySelector('[data-vung="tin-hieu"]')).toBeTruthy())
    expect(goiHoSo().length).toBe(truoc + 2)
  })
})

describe('thanh mục + hàm thuần', () => {
  it('bấm mục ở thanh mục / thanh bên ⇒ cuộn tới đúng phần (không đổi tuyến); mục phần dưới mở luôn phần dưới', async () => {
    const c = await moTrang()
    const cuon = Element.prototype.scrollIntoView as unknown as ReturnType<typeof vi.fn>
    cuon.mockClear()
    fireEvent.click([...c.querySelectorAll('.tvc-muc-luc a')].find((a) => a.textContent === 'Buổi học')!)
    expect(cuon).toHaveBeenCalled()
    expect((cuon.mock.instances.at(-1) as unknown as HTMLElement).id).toBe('phan-buoi-hoc')
    expect(location.hash).toBe('')
    await waitFor(() => expect(goiHoSo()).toHaveLength(2)) // bấm mục phần dưới ⇒ phần dưới nạp
    cuon.mockClear()
    fireEvent.click([...c.querySelectorAll('nav.tvc-ben a')].find((a) => a.textContent === 'Nhịp học')!)
    await waitFor(() => expect(cuon).toHaveBeenCalled())
    expect((cuon.mock.instances.at(-1) as unknown as HTMLElement).id).toBe('phan-nhip')
  })

  it('hàm thuần: tên gọi · buổi hôm nay · ô ngày · phần có · "Nghĩa là" · thước đúng ngưỡng máy chủ · kết luận khi không đối phó · số giây theo mức độ', () => {
    expect(tenGoi('Nguyễn Minh Khôi')).toBe('Khôi')
    const pm = docTatCaVeCon(tatCaGia())!
    expect(buoiHomNay(pm, NAY)).toEqual({ kieu: 'co-mat', luc: '17:52' })
    expect(buoiHomNay(pm, NAY + 86_400_000)).toBeNull()
    const vang = { ...pm, buoiHoc: [{ ...pm.buoiHoc![0]!, coMat: false, luc: '', cach: null, dangMo: false }] }
    expect(buoiHomNay(vang, NAY)).toEqual({ kieu: 'vang' })
    expect(buoiHomNay({ ...vang, buoiHoc: [{ ...vang.buoiHoc[0]!, dangMo: true }] }, NAY)).toEqual({ kieu: 'chua' })
    expect(oNgay({ ngay: '2026-10-05', muc: 30, lam: 0 }, '2026-10-14')).toMatchObject({ nhan: 'T2 05', loai: 'khong' })
    expect(oNgay({ ngay: '2026-10-08', muc: 30, lam: 9 }, '2026-10-14').loai).toBe('nhieu')
    expect(phanCo(null, null)).toEqual(['hom-nay', 'nhip', 'thai-do', 'cau-sai', 'thoi-gian', 'kiem-tra'])
    const td = docHoSoThaiDo(thaiDoGia() as never)!
    expect(THUOC['qua-nhanh'].moc).toEqual([NGUONG_THAI_DO.nhanChuY, NGUONG_THAI_DO.nhanXau])
    expect(THUOC['ngay-du-muc'].moc).toEqual([NGUONG_THAI_DO.ngayDuLuoi, NGUONG_THAI_DO.ngayDuTot])
    expect(nghiaLa(td.tinHieu[0]!)).toBe('Trong 13 ngày đã qua, con làm đủ số câu tối thiểu ở 9 ngày; 4 ngày còn lại con làm thiếu hoặc không làm.')
    expect(soLieu(td.tinHieu[2]!)).toBe('37/412 lượt làm trong 23:00–04:59')
    const tot = { ...td, coDoiPho: false, ketLuan: { ...td.ketLuan, nhan: 'chua-deu' as const }, tinHieu: td.tinHieu.map((t) => ({ ...t, muc: 'tot' as const })) }
    expect(chuKetLuan(tot)).toEqual({ doiPho: false, chu: 'Chưa thấy dấu hiệu đối phó. Cả 6 tín hiệu đều trong ngưỡng.' })
    const ls = docLichSuLamCau(lichSuGia() as never)!
    expect(giayTheoMucDo(ls.lan).map((d) => [d.ten, d.soLuot, d.tiLeDung])).toEqual([['Nhận biết', 118, 90], ['Thông hiểu', 165, 74], ['Vận dụng', 101, 58], ['Vận dụng cao', 25, 32]])
    const tq = docConTongQuan(tongQuanGia())!
    expect(dongCanNhac(tq, null, NAY).map((d) => d.khoa)).toEqual(['nhanh-sai', 'sai-chua-sua', 'ti-le-giam'])
  })
})
