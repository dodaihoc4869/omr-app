// «MỘT TRANG VỀ CON» (thầy chốt bản vẽ 01/11 — docs/ban-ve-ph-mot-trang-0111/DAC-TA.md). Khoá:
//   · lệnh mới `/ph/bon-so-do`: chỉ con mình (một câu theo khoá chính), bằng chứng lời phụ huynh ≤ 3 thẻ, KHÔNG qid / cả lớp / thẻ lạ; chưa có bản tính ⇒ co:false;
//   · phép thuần: mức + lời 4 số đo, xu hướng 14 ngày, câu Hôm nay, 14 ô, việc sắp tới, dạng cần luyện, «nên làm gì»;
//   · màn (bật <html data-trong="ph">): đủ khối Hôm nay · 4 số đo · Kiểm tra gần nhất · Con cần luyện thêm · Sắp tới · Thầy nhắn · Nên làm gì; KHÔNG nút «Nhắn thầy»
//     (thầy 01/11); bấm số đo ⇒ tấm (vì sao + nên làm gì), Esc / Đóng ⇒ đóng; chỉ lệnh sẵn có + /ph/bon-so-do đúng MỘT lần; không lộ SBD.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import AppPhuHuynh from '../src/components/ph-v3/AppPhuHuynh'
import { bangChungPh, banPhuHuynh, phBonSoDo } from '../server/src/ph-bon-so-do'
import { docBonSoDo } from '../src/lib/ph-v3/bon-so-do-api'
import { cauHomNay, cauPhuHomNay, dangCanLuyen, doiTuan, giaTriNgay, mucSoDo, nenLamGi, nenTheoSoDo, o14, viecSap } from '../src/lib/ph-v3/mot-trang-con'
import type { NgaySoDo, TraLoiBonSoDo } from '../src/lib/ph-v3/bon-so-do-kieu'
import type { NgayHoc } from '../src/lib/ph-v3/con-tong-quan'
import type { TomTatKiemTra } from '../src/lib/kiem-tra-ca-nhan'
import { hoc2Gia, lichSuGia, loiThayGia, nhipGia, thaiDoGia, tatCaGia, tongQuanGia } from '../scripts/chup-ph-dot19/gia'
import './_ph-nap-trang-cu'

// ───────────────────────────── dữ liệu giả 4 số đo (hình hàng bon_chi_so_em)
const NGAY14 = Array.from({ length: 14 }, (_, i) => `2026-10-${String(18 + i).padStart(2, '0')}`)
const HANG = {
  ngay: '2026-11-01', tinh_luc: '2026-10-31T18:05:00.000Z', ht: 34.4, dp: 63.6, ch: 38, lu: 62, so_luot: 168,
  the_json: JSON.stringify({
    dp: [
      { ma: 'do', w: 12, tieu: 'Dò đáp án', lon: '9/40', nhoSo: 'lượt · 23%' },
      { ma: 'voi', w: 30, tieu: 'Chọn đáp án khi chưa kịp đọc hết đề', lon: '23/168', nhoSo: 'lượt · 14%', lop: 6, viDu: [{ luc: '2026-10-30T14:52:00.000Z', qid: 'Q-BI-MAT-1', phu: 'cần ít nhất 18 giây để đọc đề', kq: 'chọn sau 4 giây · sai', dung: false }] },
      { ma: 'treo', w: 3, tieu: 'Treo máy cho đủ giờ', lon: '2', nhoSo: 'lượt' },
      { ma: 'goiY', w: 1, tieu: 'Mở lời giải trước khi tự làm', lon: '4/168', nhoSo: 'lượt' },
      { ma: 'la-hoac', w: 99, tieu: 'Thẻ nội bộ chưa có lời phụ huynh', lon: '1' },
    ],
    ht: [{ ma: 'sua', tieu: 'Sửa câu sai đến khi đúng', lon: '3/12', nhoSo: 'câu · 25%' }],
    ch: [{ ma: 'ngayDu', tieu: 'Đủ mức mỗi ngày', lon: '4/14', nhoSo: 'ngày' }],
    lu: [{ ma: 'ngayCoLam', tieu: 'Ngày có làm', lon: '14/14', nhoSo: 'ngày' }, { ma: 'lanCuoi', tieu: 'Lần cuối học', lon: '31/10', nhoSo: 'hôm qua' }],
  }),
  ngay_json: JSON.stringify(NGAY14.map((ngay, i) => ({ ngay, muc: 20, ky: i < 7 ? 14 : 8, voi: i < 7 ? 2 : 8 }))),
}
const BON = banPhuHuynh(HANG)

describe('/ph/bon-so-do — máy chủ', () => {
  it('bằng chứng lời phụ huynh: xếp theo sức nặng, tối đa 3, bỏ thẻ lạ, không qid / cả lớp', () => {
    expect(BON.ok && BON.co).toBe(true)
    if (!BON.co) return
    expect(BON.diem).toEqual({ ht: 34, dp: 64, ch: 38, lu: 62 })
    expect(BON.bangChung.dp.map((b) => b.so)).toEqual(['23/168', '9/40', '2'])
    expect(BON.bangChung.dp[0]!.chu).toBe('lượt con chọn đáp án khi chưa đọc hết đề')
    expect(BON.bangChung.dp[0]!.vd).toEqual({ luc: '2026-10-30T14:52:00.000Z', chu: 'cần ít nhất 18 giây để đọc đề · chọn sau 4 giây · sai' })
    const chuoi = JSON.stringify(BON)
    expect(chuoi).not.toMatch(/Q-BI-MAT|"lop"|qid|Thẻ nội bộ|la-hoac/)
    // «Ngày có làm 14/14» ⇒ nói theo ngày KHÔNG học: 0/14; lần cuối kèm «hôm qua»
    expect(BON.bangChung.lu).toEqual([{ so: '0/14', ngan: 'ngày không học', chu: 'ngày con không làm câu nào' }, { so: '31/10', ngan: 'lần cuối học', chu: 'lần cuối con học (hôm qua)' }])
    // nhãn ngắn cho ô trên trang: mọi nhãn ≤ 24 ký tự (không cắt chữ)
    for (const m of ['ht', 'dp', 'ch', 'lu'] as const) for (const b of BON.bangChung[m]) expect(b.ngan.length).toBeLessThanOrEqual(24)
    expect(BON.ngay).toHaveLength(14)
    expect([BON.tu, BON.den, BON.soLuot]).toEqual(['2026-10-18', '2026-10-31', 168])
  })
  it('chưa có bản tính ⇒ co:false; thẻ quá 3 bị cắt', () => {
    expect(banPhuHuynh(undefined)).toEqual({ ok: true, co: false })
    expect(bangChungPh('ht', Array.from({ length: 6 }, (_, i) => ({ ma: 'sua', lon: `${i}/9` })))).toHaveLength(3)
  })
  it('v3 (02/11): thẻ ca thi / lên bảng / làm cho có có lời phụ huynh (nhãn ngắn ≤ 24 ký tự), không lộ chữ của thầy', () => {
    const cap: [('ht' | 'dp' | 'lu'), string, string][] = [['ht', 'caThi', '8/9'], ['ht', 'lenBang', '3/4'], ['dp', 'lechCa', '90% → 2/6'], ['dp', 'bangChua', '2/3'], ['lu', 'choCo', '120/400'], ['lu', 'donHan', '9/12']]
    for (const [m, ma, lon] of cap) {
      const [b] = bangChungPh(m, [{ ma, lon, tieu: 'chữ của thầy' }])
      expect(b, `${m}:${ma}`).toBeDefined()
      expect(b!.so).toBe(lon)
      expect(b!.ngan.length).toBeLessThanOrEqual(24)
      expect(b!.chu).not.toContain('chữ của thầy')
    }
  })
  it('lệnh: MỘT câu đọc theo khoá chính của đúng con (SBD lấy từ xác thực)', async () => {
    const sql: string[] = []
    const ban: unknown[][] = []
    const DB = {
      prepare: (s: string) => {
        sql.push(s)
        const cau = {
          bind: (...b: unknown[]) => { ban.push(b); return cau },
          first: async () => (s.includes('FROM hoc_sinh') ? { sbd: 'S1' } : s.includes('bon_chi_so_em') ? HANG : null),
          run: async () => ({}),
          all: async () => ({ results: [] }),
        }
        return cau
      },
    }
    const env = { DB } as never
    const kq = await phBonSoDo(env, { sbd: 'S1' }, env, { waitUntil: () => {}, passThroughOnException: () => {} } as never)
    expect(kq.ok && 'co' in kq && kq.co).toBe(true)
    const doc = sql.filter((s) => s.includes('bon_chi_so_em'))
    expect(doc).toEqual(['SELECT ngay, tinh_luc, ht, dp, ch, lu, so_luot, the_json, ngay_json FROM bon_chi_so_em WHERE sbd = ?1'])
    expect(ban[sql.indexOf(doc[0]!)]).toEqual(['S1'])
  })
  it('định tuyến có /ph/bon-so-do (nạp lười)', () => {
    const idx = readFileSync(resolve(__dirname, '../server/src/index.ts'), 'utf8')
    expect(idx).toMatch(/p === '\/ph\/bon-so-do'\) return ra\(await import\('\.\/ph-bon-so-do'\)/)
  })
})

describe('phép thuần «Một trang về con»', () => {
  it('đọc phản hồi máy chủ; sai hình ⇒ null', () => {
    expect(docBonSoDo(JSON.parse(JSON.stringify(BON)))).toEqual(BON)
    expect(docBonSoDo({ ok: true, co: false })).toEqual({ ok: true, co: false })
    expect(docBonSoDo({ ok: true, co: true })).toBeNull()
  })
  it('mức 4 số đo (DAC-TA mục 3): cao tốt / thấp tốt; null ⇒ chưa đủ dữ liệu', () => {
    expect(mucSoDo('ht', 78)).toMatchObject({ chu: 'Tốt', mau: 'xl' })
    expect(mucSoDo('ht', 34)).toMatchObject({ chu: 'Cần để ý', muc: 'xau' })
    expect(mucSoDo('dp', 12)).toMatchObject({ chu: 'Ít, tốt', mau: 'xl' })
    expect(mucSoDo('dp', 64)).toMatchObject({ chu: 'Cao', mau: 'ho' })
    expect(mucSoDo('ch', 86).chu).toBe('Rất đều')
    expect(mucSoDo('lu', 62)).toMatchObject({ chu: 'Cao', mau: 'ho' })
    expect(mucSoDo('lu', null)).toMatchObject({ chu: 'Chưa đủ dữ liệu', mau: 'xam' })
    expect(nenTheoSoDo('dp', 64)[0]).toMatch(/đọc hết đề/)
  })
  it('xu hướng 14 ngày: Học thật = % câu làm kỹ, Đối phó = % chọn vội; so với tuần trước', () => {
    const n: NgaySoDo = { ngay: '2026-10-20', muc: 20, ky: 15, voi: 5 }
    expect([giaTriNgay('ht', n), giaTriNgay('dp', n), giaTriNgay('ch', n), giaTriNgay('lu', n)]).toEqual([75, 25, 100, 0])
    expect(giaTriNgay('ht', { ...n, ky: 0, voi: 0 })).toBeNull()
    if (!BON.co) throw new Error('thiếu')
    expect(doiTuan('dp', BON.ngay)).toBe(37) // 50% − 13% (mỗi ngày làm tròn)
    expect(doiTuan('ht', BON.ngay)).toBe(-38)
  })
  it('câu Hôm nay + câu phụ', () => {
    expect(cauHomNay({ soCau: 26, dung: 21, phut: 38 }).map((x) => x.chu).join('')).toBe('Hôm nay con học 38 phút, làm 26 câu, đúng 21.')
    expect(cauHomNay({ soCau: 0, dung: null, phut: null }).map((x) => x.chu).join('')).toBe('Hôm nay con chưa làm câu nào.')
    expect(cauPhuHomNay({ soCau: 0, giayTb: null, homQua: { daLam: 14, canLam: 20 } })).toBe('Hôm qua con làm 14/20 câu.')
  })
  it('14 ô ngày: hôm nay chưa làm ⇒ «chua»; đếm đủ mức', () => {
    const ds = Array.from({ length: 16 }, (_, i): NgayHoc => ({ ngay: `2026-10-${String(10 + i).padStart(2, '0')}`, dung: 0, sai: 0, boTrong: 0, soCau: 0, muc: 20, mucUocTinh: false, daXep: 20, canLam: 20, daLam: i % 2 ? 20 : 0, trangThai: i % 2 ? 'du' : 'khong', homNay: i === 15 }))
    ds[15] = { ...ds[15]!, daLam: 0 }
    const r = o14(ds)
    expect(r.o).toHaveLength(14)
    expect(r.o[13]).toMatchObject({ t: 'chua', nay: true })
    expect(r.du).toBe(6)
  })
  it('việc sắp tới: gần trước, bỏ hạn đã qua; dạng cần luyện: tỉ lệ đúng thấp trước', () => {
    const now = Date.parse('2026-11-01T14:00:00Z')
    const kt = { trangThai: 'sap_den', moLuc: Date.parse('2026-11-02T12:00:00Z'), hanLuc: Date.parse('2026-11-03T12:00:00Z'), tong: 14, con: 14 } as TomTatKiemTra
    const ds = viecSap([{ maBtvn: 'B1', ten: 'x', hanNop: '2026-11-02T16:59:00Z', changXong: 2, changTong: 5, chang: null }, { maBtvn: 'B0', ten: 'y', hanNop: '2026-10-30T16:59:00Z', changXong: null, changTong: null, chang: null }], kt, now)
    expect(ds.map((x) => [x.loai, x.thu, x.ngay, x.ten, x.phu])).toEqual([['kt', 'Thứ Hai', '02/11', 'Kiểm tra ôn tập', 'mở 19:00 · 14 câu'], ['btvn', 'Thứ Hai', '02/11', 'Hạn nộp BTVN', '23:59 · còn 3 chặng']])
    expect(dangCanLuyen([{ ma: 'a', ten: 'A', dung: 5, tong: 9, bac: 1 }, { ma: 'b', ten: 'B', dung: 3, tong: 10, bac: 1 }, { ma: 'c', ten: 'C', dung: 0, tong: 2, bac: 1 }]).map((d) => d.ten)).toEqual(['B', 'A'])
  })
  it('«nên làm gì»: chưa làm hôm nay + Đối phó cao + Lười cao lên trước; tối đa 3', () => {
    const r = nenLamGi({ bon: BON, homNayDaLam: 0, homNayDu: false, chuoi: 0, goiYMayChu: ['Gợi ý máy chủ'] })
    expect(r.map((x) => x.dong)).toEqual(['Tối nay', 'Nhắc con', 'Thống nhất'])
    const tot: TraLoiBonSoDo = { ...BON, diem: { ht: 80, dp: 10, ch: 90, lu: 10 } } as TraLoiBonSoDo
    expect(nenLamGi({ bon: tot, homNayDaLam: 30, homNayDu: true, chuoi: 6, goiYMayChu: [] })).toEqual([{ dong: 'Khen con', chu: 'vì giữ chuỗi 6 ngày học đều.' }, { dong: 'Không cần', chu: 'nhắc thêm giờ học: con đang tự giác.' }])
    // chưa có số đo, đang làm dở ⇒ vẫn có việc cụ thể (ô không bao giờ trống)
    expect(nenLamGi({ bon: null, homNayDaLam: 5, homNayDu: false, chuoi: null, goiYMayChu: [] })).toEqual([{ dong: 'Nhắc nhẹ', chu: 'con làm nốt phần hôm nay.' }])
    expect(nenLamGi({ bon: null, homNayDaLam: 30, homNayDu: false, chuoi: null, goiYMayChu: [] }).length).toBe(1)
  })
})

// ───────────────────────────── màn
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/tai-thong-tin-ph', () => ({ taiThongTinPhuHuynh: async () => ({ canhBao: [] }) }))
const MAY: Record<string, () => unknown> = {
  '/ph/tat-ca-ve-con': tatCaGia, '/ph/con-tong-quan': tongQuanGia, '/ph/nhip-hoc': nhipGia, '/ph/loi-thay': loiThayGia, '/ph/hoc-2': hoc2Gia,
  '/ph/ho-so-thai-do': thaiDoGia, '/ph/lich-su-lam-cau': lichSuGia, '/ph/bon-so-do': () => BON,
}
let goi: string[] = []
beforeEach(() => {
  goi = []
  localStorage.clear()
  window.history.replaceState(null, '', '/?vai=phuhuynh')
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
  Element.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    const duong = String(url).replace('https://may.test', '')
    goi.push(duong)
    const body = MAY[duong]?.() ?? { ok: true }
    return Promise.resolve({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) })
  }))
  document.documentElement.dataset.trong = 'ph'
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.trong
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})
const mo = () => render(<div className="m3"><AppPhuHuynh sbd="12121212" hoTen="Nguyễn Minh Khôi" lop="12A1" onDoiSbd={() => {}} /></div>).container

describe('màn «Một trang về con» (<html data-trong="ph">)', () => {
  it('đủ khối theo bản vẽ, không nút «Nhắn thầy», chỉ lệnh sẵn có + /ph/bon-so-do một lần, không lộ SBD', async () => {
    const c = mo()
    await waitFor(() => expect(c.querySelector('[data-vung="ph-mot-trang"] [data-vung="hom-nay"]')).toBeTruthy())
    const man = c.querySelector('[data-vung="ph-mot-trang"]')!
    expect(man.querySelector('[data-vung="ten-con"]')!.textContent).toBe('Nguyễn Minh Khôi')
    for (const v of ['hom-nay', 'bon-so-do', 'diem-gan-nhat', 'can-luyen', 'sap-toi', 'thay-nhan', 'nen-lam']) expect(man.querySelector(`[data-vung="${v}"]`), v).toBeTruthy()
    expect(man.querySelector('[data-vung="cau-hom-nay"]')!.textContent).toBe('Hôm nay con học 12 phút, làm 18 câu, đúng 13.')
    await waitFor(() => expect(man.querySelectorAll('.mtc-so[data-ma]')).toHaveLength(4))
    expect([...man.querySelectorAll('.mtc-so__ten')].map((x) => x.textContent)).toEqual(['Học thật', 'Đối phó', 'Chăm', 'Lười'])
    expect(man.querySelector('.mtc-so[data-ma="dp"] .mtc-so__muc')!.textContent).toBe('Cao')
    expect(man.querySelector('[data-vung="diem-gan-nhat"]')!.textContent).toContain('7,5')
    expect(man.querySelector('[data-vung="can-luyen"]')!.textContent).toContain('Xà phòng hoá chất béo')
    expect(man.querySelector('[data-vung="sap-toi"]')!.textContent).toContain('Hạn nộp BTVN')
    expect(man.textContent).not.toMatch(/Nhắn thầy|12121212|CA-45/)
    expect(man.querySelectorAll('.mtc-ah__o i')).toHaveLength(14)
    for (const d of goi) expect(Object.keys(MAY)).toContain(d)
    expect(goi.filter((x) => x === '/ph/bon-so-do')).toHaveLength(1)
    for (const d of ['/ph/ho-so-thai-do', '/ph/lich-su-lam-cau', '/ph/bao-cao-tuan']) expect(goi).not.toContain(d)
    // mọi ô bấm được là <button>
    for (const b of man.querySelectorAll('[data-vung="diem-gan-nhat"], [data-vung="thay-nhan"], [data-vung="nen-lam"], .mtc-so')) expect(b.tagName).toBe('BUTTON')
  })

  it('bấm số đo ⇒ tấm «vì sao + nên làm gì»; Esc đóng; nút Đóng đóng', async () => {
    const c = mo()
    await waitFor(() => expect(c.querySelector('.mtc-so[data-ma="dp"]')).toBeTruthy())
    fireEvent.click(c.querySelector('.mtc-so[data-ma="dp"]')!)
    const tam = () => c.querySelector('[role="dialog"][data-loai="dp"]')
    await waitFor(() => expect(tam()).toBeTruthy())
    expect(tam()!.textContent).toContain('Vì sao?')
    expect(tam()!.textContent).toContain('lượt con chọn đáp án khi chưa đọc hết đề')
    expect(tam()!.textContent).toContain('Anh chị nên làm gì')
    expect(tam()!.textContent).not.toMatch(/Q-BI-MAT/)
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(tam()).toBeNull())
    fireEvent.click(c.querySelector('[data-vung="nen-lam"]')!)
    await waitFor(() => expect(c.querySelector('[role="dialog"][data-loai="nen"]')).toBeTruthy())
    fireEvent.click(c.querySelector('[role="dialog"] [aria-label="Đóng"]')!)
    await waitFor(() => expect(c.querySelector('[role="dialog"]')).toBeNull())
  })

  it('bấm Kiểm tra gần nhất / Thầy nhắn ⇒ màn cũ trong tấm', async () => {
    const c = mo()
    await waitFor(() => expect(c.querySelector('[data-vung="diem-gan-nhat"]')).toBeTruthy())
    fireEvent.click(c.querySelector('[data-vung="thay-nhan"]')!)
    await waitFor(() => expect(c.querySelector('[role="dialog"][data-loai="thay"]')!.textContent).toContain('Kiểm tra 45 phút'))
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(c.querySelector('[data-vung="diem-gan-nhat"]')!)
    await waitFor(() => expect(c.querySelector('[role="dialog"][data-loai="diem"]')!.textContent).toMatch(/7,5/))
  })

  it('4 số đo chưa tính ⇒ câu nói rõ, không vòng giả', async () => {
    MAY['/ph/bon-so-do'] = () => ({ ok: true, co: false })
    try {
      // SBD khác: 4 số đo đã tải được nhớ theo SBD trong phiên
      const c = render(<div className="m3"><AppPhuHuynh sbd="34343434" hoTen="Trần Gia Huy" lop="11A2" onDoiSbd={() => {}} /></div>).container
      await waitFor(() => expect(c.querySelector('[data-vung="bon-chua-tinh"]')).toBeTruthy())
      expect(c.querySelector('.mtc-so[data-ma]')).toBeNull()
    } finally { MAY['/ph/bon-so-do'] = () => BON }
  })

  it('CSS: chỉ biến --ph3-*, không mã màu thô; trang cao đúng màn, không cuộn', () => {
    const css = readFileSync(resolve(__dirname, '../src/components/ph-v3/mot-trang-con.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i)
    for (const m of css.match(/var\(--[a-z0-9-]+/g) ?? []) expect(m).toMatch(/^var\(--(ph3-|t-|r-|p\b)/)
    expect(css).toMatch(/\.mtc \{[^}]*height: 100dvh;[^}]*overflow: hidden;/)
  })
})
