// OMNI 3 · SẢNH HỌC SINH (làn C2, 05/10) — thầy lệnh "giữ nguyên mọi giao diện hiện tại … thêm những mục cần thiết đồng bộ với giao diện hiện tại".
// Khi `hoa2-sanh` có `omni`: dòng nhỏ trong THẺ CHIẾN DỊCH sẵn có (Dạng vững · Sơ ý · mốc 8 / chứng chỉ · Đang luyện thêm), nút PHỤ cạnh
// "Thử sức thêm" (Vé thử thách, Đề thử), chế độ chờ bài mới thay dòng "chưa có câu", mệt theo giờ (Để mai / Làm luôn), nhật ký dưới lời mừng.
// Vắng `omni` (cờ tắt) ⇒ DOM y hệt cũ. Chữ mong đợi dựng bằng CHÍNH hàm của src/lib/omni-chu.ts (không so chữ "%" viết tay).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import SanhBanDo, { type SanhBanDoProps } from '../src/components/hoa2/SanhBanDo'
import { docSanh, type KetQuaSanh } from '../src/components/hoa2/api'
import { MQ_NGANG, MQ_NGANG_THAP } from '../src/components/hoa2/bo-cuc-ngang'
import { docSanhOmni, KHOA_OMNI_DAO, layViecOmniDao } from '../src/lib/omni-hs'
import { CHU_CHO_BAI_MOI, GOI_Y_VE, NUT_DE_MAI, NUT_LAM_LUON, chuChungChi, chuConDangDe8, chuDangVung, chuDeThu, chuMetGio, chuOnBaiCu, chuSoY, chuVe } from '../src/lib/omni-chu'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const NOW = Date.UTC(2026, 9, 5, 7, 0, 0)
const CD = { id: 'cd6', ten: 'Bài 6 · Ester', hanNop: '2026-10-12', D: 7, tong: 120, coXat: 55, thanhThao: 25, canDayLai: 0, thanhThaoTangTu: null }
const GOC = { ok: true, cheDo2: true, ngay: '2026-10-05', chienDich: CD, huyetChien: false, khoaDao: false, loiKhoaDao: '' }
const DANG_LAM = { ...GOC, theLuc: { con: 28, tong: 40 }, doan: { con: 0 }, dao: { con: 28 }, ruong: { daLam: 12, tong: 40, moDuoc: false, daMo: false } }
const XONG = { ...GOC, theLuc: { con: 0, tong: 40 }, doan: { con: 0 }, dao: { con: 0 }, ruong: { daLam: 40, tong: 40, moDuoc: true, daMo: true, qua: { vang: 20 } }, thuSucThem: { duoc: true, soCau: 6 } }
const TRONG = { ...GOC, theLuc: { con: 0, tong: 0 }, doan: { con: 0 }, dao: { con: 0 }, ruong: { daLam: 0, tong: 0, moDuoc: false, daMo: false } }
const OMNI = {
  bat: true,
  baiDangLuyen: [{ id: 'cd6', ten: 'Bài 6 · Ester', hanNop: '2026-10-12' }, { id: 'cd7', ten: 'Bài 7 · Lipid', hanNop: '2026-10-19' }],
  dangVung: { a: 2, b: 9 }, conDangDe8: 3, sEm: 0.06, sMucTieu: 0.07, chungChi: [],
  ve: { con: 2, tong: 2 }, choBaiMoi: false, onBaiCu: 0, metGio: null, nhatKy: null, deThu: { duoc: false, soCau: 14, phut: 25 },
}

function datMan(rong: number, cao: number) {
  const ngangHuong = rong > cao
  vi.stubGlobal('innerHeight', cao)
  vi.stubGlobal('matchMedia', vi.fn((q: string) => ({
    matches: q === MQ_NGANG ? rong >= 1024 || (ngangHuong && rong >= 700) : q === MQ_NGANG_THAP ? ngangHuong && cao <= 500 : false,
    media: q, addEventListener: () => {}, removeEventListener: () => {},
  })))
}
function ve(sanh: Record<string, unknown>, them: Partial<SanhBanDoProps> = {}) {
  const props: SanhBanDoProps = {
    ketQua: docSanh(sanh) as KetQuaSanh, loi: '', dangTai: false, thu: { index: 2, cap: 7, ten: 'Mập Địch' }, exp: { homNay: 22, conThieu: 60 }, chuoiNgay: 5,
    caDangMo: false, now: NOW, token: 'tk', shopBat: true,
    onVaoThi: vi.fn(), onPhaPhucKich: vi.fn(), onKhamPhaDao: vi.fn(), onCauDaLam: vi.fn(), onTuiDo: vi.fn(), onCuaHang: vi.fn(), onMoThanThu: vi.fn(), onChonThu: vi.fn(), onDangXuat: vi.fn(), onTaiLai: vi.fn(),
    ...them,
  }
  return render(<SanhBanDo {...props} />)
}
const khoi = (c: HTMLElement, ten: string) => [...c.querySelectorAll<HTMLElement>(`[data-khoi="${ten}"]`)]
/** `useId` đổi số giữa hai lần dựng ⇒ thay mọi id theo thứ tự xuất hiện bằng ID0, ID1… rồi mới so DOM. Cảnh mở màn chỉ chạy lần dựng ĐẦU
 *  của phiên (sessionStorage) ⇒ bỏ cờ `data-mo-man` khỏi phép so. */
function chuanHoa(html: string): string {
  const ids = [...new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]!))]
  return ids.reduce((h, id, i) => h.split(id).join(`ID${i}`), html).replace(/ data-mo-man="(true|false)"/g, '')
}

beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('docSanhOmni — đọc chặt, không bịa số', () => {
  it('vắng / bat khác true / rác ⇒ null (Sảnh y hệt hôm nay)', () => {
    expect(docSanhOmni(undefined)).toBeNull()
    expect(docSanhOmni({ bat: false, dangVung: { a: 1, b: 2 } })).toBeNull()
    expect(docSanhOmni('omni')).toBeNull()
    const k = docSanh(DANG_LAM)
    expect(k && 'sanh' in k && 'omni' in k.sanh).toBe(false) // trường vắng hẳn, không phải omni: undefined
  })
  it('đủ trường ⇒ giữ; số sai kiểu ⇒ 0 / null; tỉ lệ kẹp 0..1; chứng chỉ thiếu độ tin bị bỏ', () => {
    const o = docSanhOmni({ ...OMNI, sEm: 1.7, conDangDe8: 'x', ve: { con: -1, tong: 2 }, chungChi: [{ ten: 'Bài 5', doTin: 0.91, ngay: '2026-10-05' }, { ten: 'Bài 4' }], nhatKy: ['  Dòng 1 ', '', 3] })!
    expect(o.sEm).toBe(1)
    expect(o.conDangDe8).toBeNull()
    expect(o.ve).toEqual({ con: 0, tong: 2 })
    expect(o.chungChi).toEqual([{ ten: 'Bài 5', doTin: 0.91, ngay: '2026-10-05' }])
    expect(o.nhatKy).toEqual(['Dòng 1'])
    expect(o.baiDangLuyen.map(b => b.ten)).toEqual(['Bài 6 · Ester', 'Bài 7 · Lipid'])
  })
})

describe.each([['dọc', 390, 844], ['ngang', 1280, 800]] as const)('Sảnh %s', (_ten, rong, cao) => {
  it('vắng omni ⇒ không phần tử OMNI nào; DOM trùng khít bản omni.bat=false (cờ tắt)', () => {
    datMan(rong, cao)
    for (const sanh of [DANG_LAM, XONG, TRONG]) {
      const a = ve(sanh)
      const htmlCu = a.container.innerHTML
      expect(a.container.querySelector('[data-khoi^="omni-"], [data-khoi="ve-thu-thach"], [data-khoi="de-thu"], [data-khoi="met-gio"], [data-khoi="nhat-ky"]')).toBeNull()
      expect(a.container.textContent).not.toMatch(/Dạng vững|Sơ ý|Vé thử thách|Đề thử|Đang luyện thêm/)
      cleanup()
      const b = ve({ ...sanh, omni: { ...OMNI, bat: false } })
      expect(chuanHoa(b.container.innerHTML)).toBe(chuanHoa(htmlCu))
      cleanup()
    }
  })

  it('thẻ chiến dịch sẵn có thêm đúng các dòng nhỏ: Dạng vững · Sơ ý, mốc 8, Đang luyện thêm (thẻ giữ bài hạn gần nhất)', () => {
    datMan(rong, cao)
    const { container } = ve({ ...DANG_LAM, omni: OMNI })
    const the = container.querySelector(rong > cao ? '.h2-ng-cd' : '.h2-cd') as HTMLElement
    expect(the.textContent).toContain('Chiến dịch Bài 6 · Ester') // tên chiến dịch cũ giữ nguyên
    expect(khoi(the, 'omni-dang-vung')[0]!.textContent).toBe(`${chuDangVung(2, 9)} · ${chuSoY(0.06, 0.07)}`)
    expect(khoi(the, 'omni-moc-8')[0]!.textContent).toBe(chuConDangDe8(3))
    expect(khoi(the, 'omni-luyen-them')[0]!.textContent).toBe('Đang luyện thêm: Bài 7 · Lipid')
    // dòng thêm dùng đúng lớp dòng phụ sẵn có của thẻ
    for (const d of khoi(the, 'omni-dang-vung')) expect(d.className).toBe(rong > cao ? 'h2-ng-phu h2-ng-an-thap' : 'h2-cd-phu')
  })

  it('có chứng chỉ ⇒ dòng mốc 8 thay bằng chứng chỉ gần nhất (ngày dd/mm, độ tin không bao giờ 100)', () => {
    datMan(rong, cao)
    const { container } = ve({ ...DANG_LAM, omni: { ...OMNI, baiDangLuyen: [OMNI.baiDangLuyen[0]], chungChi: [{ ten: 'Bài 5', doTin: 0.999, ngay: '2026-10-05' }, { ten: 'Bài 4', doTin: 0.9, ngay: '2026-09-28' }] } })
    expect(khoi(container, 'omni-moc-8')[0]!.textContent).toBe(chuChungChi('Bài 5', 0.999, '05/10'))
    expect(khoi(container, 'omni-moc-8')[0]!.textContent).not.toMatch(/100/)
    expect(khoi(container, 'omni-luyen-them')).toHaveLength(0)
  })

  it('xong kế hoạch: cạnh "Thử sức thêm" có nút PHỤ "Vé thử thách 2/2" + "Đề thử 14 câu · 25 phút"; bấm vé ⇒ khoá cửa vào Đảo = ve rồi mở Đảo', () => {
    datMan(rong, cao)
    const onKhamPhaDao = vi.fn()
    const { container } = ve({ ...XONG, omni: { ...OMNI, deThu: { duoc: true, soCau: 14, phut: 25 } } }, { onKhamPhaDao })
    const thuSuc = container.querySelector('[data-khoi="thu-suc-them"]') as HTMLElement
    const nutVe = container.querySelector('[data-khoi="ve-thu-thach"]') as HTMLButtonElement
    const nutThu = container.querySelector('[data-khoi="de-thu"]') as HTMLButtonElement
    expect(thuSuc).toBeTruthy()
    expect(nutVe.textContent).toBe(chuVe(2, 2) + GOI_Y_VE)
    expect(nutThu.textContent).toBe(chuDeThu(14, 25))
    for (const n of [nutVe, nutThu]) { expect(n.className).toBe(thuSuc.className); expect(n.classList.contains('h2-nut-chinh')).toBe(false) } // cùng kiểu nút phụ, không tranh nút chính
    // ngay sau "Thử sức thêm" (cùng cha, liền kề)
    expect(thuSuc.nextElementSibling).toBe(nutVe)
    fireEvent.click(nutVe)
    expect(sessionStorage.getItem(KHOA_OMNI_DAO)).toBe('ve')
    expect(onKhamPhaDao).toHaveBeenCalledTimes(1)
    expect(layViecOmniDao()).toBe('ve')
    expect(layViecOmniDao()).toBeNull() // đọc MỘT lần rồi tự xoá
    fireEvent.click(nutThu)
    expect(layViecOmniDao()).toBe('de-thu')
  })

  it('hết vé tuần này ⇒ nút vé mờ (disabled), bấm không mở Đảo; đề thử chưa được ⇒ không có nút', () => {
    datMan(rong, cao)
    const onKhamPhaDao = vi.fn()
    const { container } = ve({ ...XONG, omni: { ...OMNI, ve: { con: 0, tong: 2 } } }, { onKhamPhaDao })
    const nutVe = container.querySelector('[data-khoi="ve-thu-thach"]') as HTMLButtonElement
    expect(nutVe.disabled).toBe(true)
    expect(nutVe.textContent).toContain(chuVe(0, 2))
    fireEvent.click(nutVe)
    expect(onKhamPhaDao).not.toHaveBeenCalled()
    expect(container.querySelector('[data-khoi="de-thu"]')).toBeNull()
  })

  it('nhật ký: các dòng nối dưới lời "Hôm nay em xong rồi" / rương sẵn có', () => {
    datMan(rong, cao)
    const dong = ['34 câu · 29 đúng', 'Bước cân bằng hệ số: hôm nay 3/3 câu nền đúng']
    const { container } = ve({ ...XONG, omni: { ...OMNI, nhatKy: dong } })
    const ds = khoi(container, 'nhat-ky')
    expect(ds.map(d => d.textContent)).toEqual(dong)
    const ruong = container.querySelector('.h2-ruong-da') as HTMLElement
    expect(ruong.textContent).toContain('Rương Bát Linh đã mở')
    expect(ds[0]!.previousElementSibling).toBe(ruong) // ngay dưới dòng rương
    expect(ds[0]!.className).toBe(rong > cao ? 'h2-ng-phu' : 'h2-xong-phu')
  })

  it('chờ bài mới: dòng "chưa có câu" thay bằng "Hôm nay ôn bài cũ: N câu" / "Đang ôn bài cũ, chờ thầy giao bài mới."', () => {
    datMan(rong, cao)
    const a = ve({ ...TRONG, omni: { ...OMNI, choBaiMoi: true, onBaiCu: 5 } })
    expect(a.container.textContent).toContain(chuOnBaiCu(5))
    expect(a.container.textContent).not.toContain('Hôm nay chưa có câu nào trong kế hoạch của em')
    cleanup()
    const b = ve({ ...TRONG, chienDich: null, omni: { ...OMNI, choBaiMoi: true, onBaiCu: 0 } })
    expect(b.container.textContent).toContain(CHU_CHO_BAI_MOI)
    expect(b.container.textContent).not.toContain('Thầy chưa giao chiến dịch nào cho em')
  })

  it('mệt theo giờ: MỘT dòng + "Để mai" / "Làm luôn"; bấm ⇒ hoa2-omni-doi-thu-tu {quyet} kèm token ⇒ tải lại Sảnh, nút ẩn', async () => {
    datMan(rong, cao)
    const fetch = vi.fn(async () => ({ json: async () => ({ ok: true, theLuc: { con: 28, tong: 40 }, dao: { con: 20 }, doan: { con: 0 } }) }))
    vi.stubGlobal('fetch', fetch)
    const onTaiLai = vi.fn()
    const { container, getByRole, queryByRole } = ve({ ...DANG_LAM, omni: { ...OMNI, metGio: { khung: '22_24', tiLe: 0.31, tiLeTot: 0.12, coTheDoi: true } } }, { onTaiLai })
    expect(khoi(container, 'met-gio')[0]!.textContent).toBe(chuMetGio(0.31, 0.12))
    fireEvent.click(getByRole('button', { name: NUT_DE_MAI }))
    await waitFor(() => expect(onTaiLai).toHaveBeenCalledTimes(1))
    const [url, init] = fetch.mock.calls[0] as unknown as [string, { body: string }]
    expect(url).toBe('https://may.test/game-v2/hoa2-omni-doi-thu-tu')
    expect(JSON.parse(init.body)).toEqual({ quyet: 'de_mai', token: 'tk' })
    expect(queryByRole('button', { name: NUT_LAM_LUON })).toBeNull()
  })

  it('máy chủ không cho đổi (coTheDoi false) ⇒ chỉ dòng chữ, không nút', () => {
    datMan(rong, cao)
    const { container, queryByRole } = ve({ ...DANG_LAM, omni: { ...OMNI, metGio: { khung: '22_24', tiLe: 0.31, tiLeTot: 0.12, coTheDoi: false } } })
    expect(khoi(container, 'met-gio')).toHaveLength(1)
    expect(queryByRole('button', { name: NUT_DE_MAI })).toBeNull()
  })
})
