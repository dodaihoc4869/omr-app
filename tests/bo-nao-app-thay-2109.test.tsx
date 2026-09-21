// BỘ NÃO A.I — PHÍA APP THẦY (Code 4, 21/09; bản vẽ docs/ban-ve-bo-nao-2109/, hợp đồng docs/hop-dong-bo-nao-2109.md).
// Bộ não TỰ HÀNH: thầy chỉ ĐỌC; nút chỉ "Xem" / "Bỏ điều chỉnh"; chạy THỬ ⇒ nhãn "CHẠY THỬ" + KHÔNG nói "đã làm"; máy chủ chưa có lệnh ⇒ nói thật, không giả số.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import KhoiBoNaoDemQua from '../src/components/KhoiBoNaoDemQua'
import NhatKyDieuChinh from '../src/components/NhatKyDieuChinh'
import KhoiBoNaoCaiDat from '../src/components/KhoiBoNaoCaiDat'
import { useAppStore } from '../src/store/appStore'
import {
  QUA_HAN_GIO,
  cheDoHieuLuc,
  coTheBoDong,
  conHieuLuc,
  docDemQua,
  docNhatKy,
  doiCheDoLop,
  gioTuLanChay,
  laDongChiBao,
  lopDangThat,
  moTaNum,
  ngayNgan,
  nhanCuaDong,
  nutCuaDong,
  tachSoDam,
  tieuDeKhoi,
  trangThaiChay,
  type DongBanTin,
} from '../src/lib/bo-nao-thay'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'mat-thu' }))

const goi = vi.fn()
type Tra = { status?: number; json?: unknown; cham?: boolean; nem?: boolean }
/** Định tuyến fetch theo đường lệnh; đường lạ ⇒ 404 (máy chủ chưa có lệnh). */
function dungMayChu(bang: Record<string, (body: Record<string, unknown>) => Tra>) {
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    const duong = url.replace('https://may.test', '')
    const body = JSON.parse(String(init.body ?? '{}')) as Record<string, unknown>
    goi(duong, body, init.headers)
    const h = bang[duong]
    if (!h) return { status: 404, ok: false, json: async () => ({}) }
    const r = h(body)
    if (r.nem) throw new TypeError('mất mạng')
    if (r.cham) {
      const e = new Error('abort')
      e.name = 'AbortError'
      throw e
    }
    const status = r.status ?? 200
    return { status, ok: status < 400, json: async () => r.json }
  })
}

const gioTruoc = (g: number) => new Date(Date.now() - g * 3_600_000).toISOString()
const dong = (o: Partial<DongBanTin> = {}): DongBanTin => ({ loai: 'dieu_chinh', chu: 'Đã giảm 3 câu mỗi ngày vì bỏ dở chặng 2 ngày liền.', sbd: '12007', hoTen: 'Trần Thu Hà', dang: '', hanhDong: 'xem_ho_so', apDung: null, ketQua: null, ketQuaChu: '', tuGo: false, ngayDieuChinh: '', ...o })
const demQuaJson = (o: Record<string, unknown> = {}) => ({ ok: true, ngay: '2026-09-22', chayLanCuoi: gioTruoc(5), cheDo: 'bong', bat: true, lopThat: [], soEm: 120, soSoiNhanh: 96, soSoiKy: 18, soVang: 6, soDieuChinh: { nhan: 30, chiGhiSo: 9, biLoai: 2 }, banTin: { cacDong: [] }, ...o })

beforeEach(() => {
  useAppStore.setState({ classList: [{ sbd: '12007', hoTen: 'Trần Thu Hà', lop: '12A1', sdt: '', namSinh: '', raw: {} }, { sbd: '12008', hoTen: 'Lê Minh Đức', lop: '12A2', sdt: '', namSinh: '', raw: {} }] as never, toast: null } as never)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

// ---------------------------------------------------------------- lớp nối (thuần)
describe('lớp nối bo-nao-thay — đọc hợp đồng, không đoán', () => {
  it('docDemQua: giữ tối đa 6 dòng hợp lệ, bỏ dòng thiếu chữ / loại lạ; trường tự hành tuỳ chọn', () => {
    const cac = Array.from({ length: 9 }, (_, i) => ({ loai: 'can_thay_y', chu: `Dòng ${i + 1}`, sbd: '1', hoTen: 'A', hanhDong: 'xem_ho_so', dang: '' }))
    const d = docDemQua({ ...demQuaJson(), banTin: { cacDong: [{ loai: 'la', chu: 'x' }, { loai: 'can_thay_y', chu: '   ' }, ...cac, { loai: 'dieu_chinh', chu: 'C', apDung: true, ketQua: 'an_thua', ketQuaChu: 'xong chặng', tuGo: false, ngayDieuChinh: '2026-09-21', hanhDong: 'dua_vao_buoi_chua' }] } })
    expect(d.banTin).toHaveLength(6)
    expect(d.banTin[0].chu).toBe('Dòng 1')
    const rieng = docDemQua({ banTin: { cacDong: [{ loai: 'dieu_chinh', chu: 'C', apDung: true, ketQua: 'an_thua', ketQuaChu: 'xong chặng', tuGo: true, ngayDieuChinh: '2026-09-21', hanhDong: 'dua_vao_buoi_chua' }] } })
    expect(rieng.banTin[0]).toMatchObject({ apDung: true, ketQua: 'an_thua', ketQuaChu: 'xong chặng', tuGo: true, ngayDieuChinh: '2026-09-21', hanhDong: 'dua_vao_buoi_chua' })
    expect(d.soEm).toBe(120)
    expect(d.soDieuChinh).toEqual({ nhan: 30, chiGhiSo: 9, biLoai: 2 })
    expect(d.soEmHoTro).toBeNull() // máy chủ chưa nói ⇒ không bịa
    expect(docDemQua({}).chayLanCuoi).toBeNull()
    expect(docDemQua({}).cheDo).toBe('bong')
  })

  it('docNhatKy: núm khắc phục, áp dụng, tự gỡ, lời nhắn em + phụ huynh + thư tuần nguyên văn', () => {
    const [x] = docNhatKy({ ds: [{ ngay: '2026-09-22', hetHan: '2026-09-25', cheDo: 'that', doTin: 0.8, nhip: { lech: -2, khoiDong: 3 }, dang: [{ ma: 'ESTE.THUY_PHAN', hanhDong: 'uu_tien', lyDo: 'đúng 7/9 câu' }], khacPhuc: [{ dang: 'ESTE.THUY_PHAN', kieu: 'khac_phuc', soCau: 3, bac: 'thap_hon_mot_bac' }, { dang: 'X', kieu: 'on_som' }], apDung: true, lyDoBo: ['làm lõi không kịp hạn'], tuGo: false, co: 'tut_nhip', loiNhanChoEm: 'Chào em', loiNhanChoPhuHuynh: 'Kính gửi phụ huynh', thuTuan: 'Tuần này…', goiYChoThay: { chu: 'Gọi lên bảng', hanhDong: 'goi_len_bang', dang: 'X' }, ghiChuHlv: 'đang thử', ketQua: 'an_thua', ketQuaChu: 'xong 2/2 chặng', daBo: false }, { chu: 'thiếu ngày' }] })
    expect(x).toMatchObject({ ngay: '2026-09-22', cheDo: 'that', apDung: true, tuGo: false, loiNhanChoEm: 'Chào em', loiNhanChoPhuHuynh: 'Kính gửi phụ huynh', thuTuan: 'Tuần này…', ketQua: 'an_thua' })
    expect(x.khacPhuc).toEqual([{ dang: 'ESTE.THUY_PHAN', kieu: 'khac_phuc', soCau: 3, bac: 'thap_hon_mot_bac' }, { dang: 'X', kieu: 'on_som', soCau: null, bac: '' }])
    expect(moTaNum(x)).toEqual({ chinh: 'Nhịp −2 · khởi động 3', phu: ['Ưu tiên: ESTE.THUY_PHAN', 'Khắc phục: ESTE.THUY_PHAN · 3 câu · thấp hơn một bậc', 'Ôn sớm: X'] })
    // máy chủ điền nhịp mặc định {lech:0, khoiDong:2} khi bộ não KHÔNG vặn nhịp ⇒ không in "Nhịp ±0"
    expect(moTaNum({ nhip: { lech: 0, khoiDong: 2 }, dang: [{ ma: 'X', hanhDong: 'uu_tien', lyDo: '' }], co: 'khong' })).toEqual({ chinh: '', phu: ['Ưu tiên: X'] })
    expect(moTaNum({ nhip: { lech: 0, khoiDong: 2 }, dang: [], co: 'khong' }).chinh).toBe('Giữ nguyên')
    expect(moTaNum({ nhip: { lech: 0, khoiDong: 3 }, dang: [], co: 'khong' }).chinh).toBe('Nhịp ±0 · khởi động 3') // vặn khởi động thì vẫn in
    expect(docNhatKy({ ds: [{ ngay: '2026-09-22' }] })[0]).toMatchObject({ loiNhanChoEm: '', loiNhanChoPhuHuynh: '', thuTuan: '', apDung: null, ketQua: null, khacPhuc: [] })
  })

  it('tiêu đề khối: chạy thật "Bộ não A.I · đêm qua đã hỗ trợ N em"; chạy thử chỉ nói đã soi; thiếu số thì KHÔNG nêu số', () => {
    const dem = { soEm: 120, soEmHoTro: 9, soDieuChinh: { nhan: 30, chiGhiSo: 9, biLoai: 2 } }
    expect(tieuDeKhoi(dem, true)).toBe('Bộ não A.I · đêm qua đã hỗ trợ 9 em')
    expect(tieuDeKhoi({ ...dem, soEmHoTro: null }, true)).toBe('Bộ não A.I · đêm qua') // KHÔNG suy từ số điều chỉnh qua kiểm khuôn — chỉ nêu số khi máy chủ nói
    expect(tieuDeKhoi({ ...dem, soEmHoTro: 0 }, true)).toBe('Bộ não A.I · đêm qua chưa áp điều chỉnh nào cho em')
    expect(tieuDeKhoi(dem, false)).toBe('Bộ não A.I · đêm qua đã soi 120 em')
    expect(tieuDeKhoi({ soEm: 0, soEmHoTro: 0 }, false)).toBe('Bộ não A.I · đêm qua chưa soi em nào') // chưa có bản tin đêm ấy
    expect(tieuDeKhoi({ soEm: null, soEmHoTro: null }, false)).toBe('Bộ não A.I · đêm qua đã soi các em')
  })

  it('nhãn dòng: điều chỉnh ĐÃ ÁP ⇒ "ĐÃ LÀM"; chạy thử / chưa áp ⇒ "ĐỀ XUẤT" (không nói đã làm khi chưa làm); chỉ-báo và nút', () => {
    expect(nhanCuaDong(dong({ apDung: true })).nhan).toBe('ĐÃ LÀM')
    expect(nhanCuaDong(dong({ apDung: null })).nhan).toBe('ĐỀ XUẤT') // máy chủ không nói ⇒ không khẳng định đã làm
    expect(nhanCuaDong(dong({ apDung: false })).nhan).toBe('ĐỀ XUẤT')
    expect(nhanCuaDong(dong({ loai: 'thay_xem_lai' })).nhan).toBe('THẦY XEM LẠI')
    expect(laDongChiBao(dong({ loai: 'thay_xem_lai' }))).toBe(true)
    expect(laDongChiBao(dong({ loai: 'can_thay_y', hanhDong: 'nhan_phu_huynh' }))).toBe(true)
    expect(laDongChiBao(dong({ loai: 'can_thay_y', hanhDong: 'xem_ho_so' }))).toBe(false)
    expect(coTheBoDong(dong())).toBe(true)
    expect(coTheBoDong(dong({ tuGo: true }))).toBe(false)
    expect(coTheBoDong(dong({ sbd: '' }))).toBe(false)
    expect(coTheBoDong(dong({ loai: 'ca_lop' }))).toBe(false)
    expect(nutCuaDong(dong())).toEqual({ nhan: 'Xem', dich: 'ho_so' })
    expect(nutCuaDong(dong({ sbd: '', loai: 'ca_lop', hanhDong: 'dua_vao_buoi_chua' }))).toEqual({ nhan: 'Xem', dich: 'goi_len_bang' })
    expect(nutCuaDong(dong({ sbd: '', loai: 'ca_lop', hanhDong: 'khong' }))).toBeNull()
  })

  it('trạng thái chạy: chưa chạy · bình thường · QUÁ 36 GIỜ (đúng biên)', () => {
    const nay = Date.parse('2026-09-22T12:00:00Z')
    const truoc = (g: number) => new Date(nay - g * 3_600_000).toISOString()
    expect(QUA_HAN_GIO).toBe(36)
    expect(trangThaiChay(null, nay)).toBe('chua_chay')
    expect(trangThaiChay('không phải ngày', nay)).toBe('chua_chay')
    expect(trangThaiChay(truoc(5), nay)).toBe('binh_thuong')
    expect(trangThaiChay(truoc(36), nay)).toBe('binh_thuong')
    expect(trangThaiChay(truoc(37), nay)).toBe('qua_han')
    expect(gioTuLanChay(truoc(40), nay)).toBe(40)
  })

  it('chế độ theo lớp: hiệu lực = lopThat.includes(L) ? that : cheDo; đổi một lớp KHÔNG vô tình đổi lớp khác', () => {
    const cacLop = ['11B1', '12A1', '12A2']
    expect(cheDoHieuLuc({ cheDo: 'bong', lopThat: ['12A1'] }, '12A1')).toBe('that')
    expect(cheDoHieuLuc({ cheDo: 'bong', lopThat: ['12A1'] }, '12A2')).toBe('bong')
    expect(cheDoHieuLuc({ cheDo: 'that', lopThat: [] }, '12A2')).toBe('that')
    expect(lopDangThat({ cheDo: 'that', lopThat: [] }, cacLop)).toEqual(cacLop)
    expect(doiCheDoLop({ cheDo: 'bong', lopThat: [] }, cacLop, '12A1', 'that')).toEqual({ cheDo: 'bong', lopThat: ['12A1'] })
    expect(doiCheDoLop({ cheDo: 'bong', lopThat: ['12A1'] }, cacLop, '12A1', 'bong')).toEqual({ cheDo: 'bong', lopThat: [] })
    // đã có một lớp 'thật', bật thêm lớp thứ hai ⇒ lớp đầu VẪN thật
    expect(doiCheDoLop({ cheDo: 'bong', lopThat: ['12A1'] }, cacLop, '12A2', 'that')).toEqual({ cheDo: 'bong', lopThat: ['12A1', '12A2'] })
    // cờ đang 'that' toàn cục, thầy đưa MỘT lớp về thử ⇒ các lớp còn lại phải GIỮ 'that'
    expect(doiCheDoLop({ cheDo: 'that', lopThat: [] }, cacLop, '12A2', 'bong')).toEqual({ cheDo: 'bong', lopThat: ['11B1', '12A1'] })
  })

  it('còn hiệu lực: chưa hết hạn + chưa bỏ + chưa tự gỡ (hết hạn tính hết ngày ấy); ngày ngắn; in đậm số', () => {
    const nay = Date.parse('2026-09-24T10:00:00')
    expect(conHieuLuc({ hetHan: '2026-09-24', daBo: false, tuGo: false }, nay)).toBe(true)
    expect(conHieuLuc({ hetHan: '2026-09-23', daBo: false, tuGo: false }, nay)).toBe(false)
    expect(conHieuLuc({ hetHan: '2026-09-25', daBo: true, tuGo: false }, nay)).toBe(false)
    expect(conHieuLuc({ hetHan: '2026-09-25', daBo: false, tuGo: true }, nay)).toBe(false)
    expect(conHieuLuc({ hetHan: '', daBo: false, tuGo: false }, nay)).toBe(false)
    expect(ngayNgan('2026-09-22')).toBe('22/09')
    expect(tachSoDam('sai 4/5 câu, chuỗi 12 ngày').filter((p) => p.dam).map((p) => p.t)).toEqual(['4/5 câu', '12 ngày'])
    expect(tachSoDam('không có số').every((p) => !p.dam)).toBe(true)
  })
})

// ---------------------------------------------------------------- gọi lệnh: nói thật
describe('gọi lệnh /ai/* — 404, chậm, từ chối; gửi mã bí mật', () => {
  it('máy chủ chưa có lệnh (404) ⇒ lời thật, KHÔNG giả số; gửi x-ma-bi-mat', async () => {
    dungMayChu({})
    const { layDemQua, layNhatKy, layCauHinhBoNao, datCauHinhBoNao, boDieuChinh } = await import('../src/lib/bo-nao-thay')
    const a = await layDemQua()
    expect(a).toMatchObject({ ok: false, loai: 'chua_co_lenh' })
    expect(a.ok === false && a.chu).toContain('chưa có bản tin bộ não')
    expect((await layNhatKy('1')).ok).toBe(false)
    const c = await layCauHinhBoNao()
    expect(c.ok === false && c.chu).toContain('chưa có lệnh cài đặt bộ não')
    const d = await datCauHinhBoNao({ bat: false })
    expect(d.ok === false && d.chu).toContain('chưa lưu được')
    expect((await boDieuChinh('1', '2026-09-22')).ok).toBe(false)
    expect((goi.mock.calls[0][2] as Record<string, string>)['x-ma-bi-mat']).toBe('mat-thu')
  })

  it('quá hạn chờ khi BỎ điều chỉnh ⇒ "CHƯA CHẮC đã bỏ" (lệnh có thể đã tới); mất mạng / không đọc được / từ chối', async () => {
    const { boDieuChinh, layDemQua } = await import('../src/lib/bo-nao-thay')
    dungMayChu({ '/ai/dieu-chinh/bo': () => ({ cham: true }) })
    const r = await boDieuChinh('12007', '2026-09-22')
    expect(r.ok === false && r.loai).toBe('cham')
    expect(r.ok === false && r.chu).toContain('CHƯA CHẮC')
    dungMayChu({ '/ai/dem-qua': () => ({ nem: true }) })
    expect((await layDemQua()).ok === false && ((await layDemQua()) as { loai: string }).loai).toBe('mang')
    dungMayChu({ '/ai/dem-qua': () => ({ status: 200, json: { ok: false, error: 'Sai mã bí mật.' } }) })
    const t = await layDemQua()
    expect(t.ok === false && t.chu).toBe('Sai mã bí mật.')
    expect(t.ok === false && t.loai).toBe('tu_choi')
  })

  it('ghi cờ: gửi đúng thân, trả cờ do máy chủ xác nhận; đọc = thân rỗng', async () => {
    const { datCauHinhBoNao, layCauHinhBoNao } = await import('../src/lib/bo-nao-thay')
    dungMayChu({ '/ai/cau-hinh': (b) => ({ json: { ok: true, cauHinh: { bat: true, cheDo: 'bong', lopThat: [], ...b } } }) })
    const doc = await layCauHinhBoNao()
    expect(doc).toEqual({ ok: true, du: { bat: true, cheDo: 'bong', lopThat: [] } })
    expect(goi.mock.calls[0][1]).toEqual({})
    const ghi = await datCauHinhBoNao({ cheDo: 'bong', lopThat: ['12A1'] })
    expect(ghi).toEqual({ ok: true, du: { bat: true, cheDo: 'bong', lopThat: ['12A1'] } })
    expect(goi.mock.calls[1][1]).toEqual({ cheDo: 'bong', lopThat: ['12A1'] })
  })
})

// ---------------------------------------------------------------- khối Hôm nay
describe('KhoiBoNaoDemQua — bản tin đêm qua (tự hành)', () => {
  const chay = (o: Record<string, unknown>, props: Partial<React.ComponentProps<typeof KhoiBoNaoDemQua>> = {}) => {
    dungMayChu({ '/ai/dem-qua': () => ({ json: demQuaJson(o) }), '/ai/dieu-chinh/bo': () => ({ json: { ok: true, daBo: true } }) })
    const onMoHoSo = vi.fn()
    const onGoiLenBang = vi.fn()
    const onMoCaiDat = vi.fn()
    render(<KhoiBoNaoDemQua onMoHoSo={onMoHoSo} onGoiLenBang={onGoiLenBang} onMoCaiDat={onMoCaiDat} {...props} />)
    return { onMoHoSo, onGoiLenBang, onMoCaiDat }
  }

  it('máy chủ chưa có lệnh ⇒ nói thật, không dựng dòng nào, có "Thử lại"', async () => {
    dungMayChu({})
    render(<KhoiBoNaoDemQua />)
    expect(await screen.findByText('Máy chủ chưa có bản tin bộ não')).toBeTruthy()
    expect(screen.getByText(/Chưa có số nào để hiện/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy()
    expect(screen.queryByText(/CHẠY THỬ/)).toBeNull()
  })

  it('chưa có bản tin (chưa chạy lần nào) ⇒ trạng thái TRUNG TÍNH "chưa có bản tin cho hôm nay — lượt đầu chạy khoảng 04:00", KHÔNG khung đỏ', async () => {
    chay({ chayLanCuoi: null })
    expect(await screen.findByText('Chưa có bản tin cho hôm nay')).toBeTruthy()
    expect(screen.getByText('Bộ não A.I chưa có bản tin cho hôm nay')).toBeTruthy()
    expect(screen.getByText(/lượt đầu chạy khoảng 04:00/)).toBeTruthy()
    // TRUNG TÍNH: không khung đỏ / cảnh báo vàng-đỏ, không role=alert
    expect(document.querySelector('.bnao-ghi-chu--loi, .bnao-ghi-chu--canh')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('CHẠY THỬ: nhãn "CHẠY THỬ — chưa tác động tới học sinh", tiêu đề chỉ nói đã soi, dòng điều chỉnh ghi "ĐỀ XUẤT" (không "ĐÃ LÀM")', async () => {
    chay({ banTin: { cacDong: [{ loai: 'dieu_chinh', chu: 'Giảm 3 câu mỗi ngày vì bỏ dở 2 ngày liền.', sbd: '12007', hoTen: 'Trần Thu Hà', hanhDong: 'xem_ho_so' }] } })
    expect(await screen.findByText('CHẠY THỬ — chưa tác động tới học sinh')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Bộ não A.I · đêm qua đã soi 120 em' })).toBeTruthy()
    expect(screen.getByText('ĐỀ XUẤT')).toBeTruthy()
    expect(screen.queryByText('ĐÃ LÀM')).toBeNull()
    expect(screen.getByText(/chỉ được lưu để kiểm máy móc/)).toBeTruthy()
    expect(screen.getByText(/soi 120 em \(18 soi kỹ · 6 vắng\)/)).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/BÓNG/i) // đổi chữ theo thầy: chỉ còn "chạy thử"
  })

  it('CHẠY THẬT: không có nhãn thử; "đã hỗ trợ N em"; dòng "ĐÃ LÀM" kèm kết quả hôm sau; nút Xem mở hồ sơ đúng em', async () => {
    const { onMoHoSo } = chay({ cheDo: 'that', soEmHoTro: 9, banTin: { cacDong: [{ loai: 'dieu_chinh', chu: 'Đã giảm 3 câu mỗi ngày cho em vì bỏ dở 2 ngày liền.', sbd: '12007', hoTen: 'Trần Thu Hà', hanhDong: 'xem_ho_so', apDung: true, ketQua: 'an_thua', ketQuaChu: 'hôm nay em xong chặng', ngayDieuChinh: '2026-09-21' }] } })
    expect(await screen.findByRole('heading', { name: 'Bộ não A.I · đêm qua đã hỗ trợ 9 em' })).toBeTruthy()
    expect(screen.queryByText(/CHẠY THỬ/)).toBeNull()
    expect(screen.getByText('ĐÃ LÀM')).toBeTruthy()
    expect(screen.getByText('Có hiệu quả')).toBeTruthy()
    expect(screen.getByText('hôm nay em xong chặng')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Xem Trần Thu Hà' }))
    expect(onMoHoSo).toHaveBeenCalledWith('12007')
    expect(screen.getByText(/không đổi hạn nộp/)).toBeTruthy()
  })

  it('CHẠY THẬT nhưng máy chủ CHƯA áp điều chỉnh nào (apDung vắng/false, soEmHoTro 0) ⇒ KHÔNG nói "đã hỗ trợ"/"ĐÃ LÀM"; nói thật là chưa áp', async () => {
    chay({ cheDo: 'that', soEmHoTro: 0, banTin: { cacDong: [{ loai: 'dieu_chinh', chu: 'Giảm 3 câu mỗi ngày.', sbd: '12007', hoTen: 'Trần Thu Hà', hanhDong: 'xem_ho_so' }] } })
    expect(await screen.findByRole('heading', { name: 'Bộ não A.I · đêm qua chưa áp điều chỉnh nào cho em' })).toBeTruthy()
    expect(screen.getByText('ĐỀ XUẤT')).toBeTruthy()
    expect(screen.queryByText('ĐÃ LÀM')).toBeNull()
    expect(screen.getByText(/chưa có điều chỉnh nào được áp/)).toBeTruthy()
    expect(document.body.textContent).not.toContain('Thầy không cần làm gì')
  })

  it('Bỏ điều chỉnh: hỏi lại → gọi /ai/dieu-chinh/bo {sbd, ngay của điều chỉnh}; xong thì ghi "Đã bỏ"; Giữ thì thôi', async () => {
    chay({ cheDo: 'that', banTin: { cacDong: [{ loai: 'dieu_chinh', chu: 'Đã giảm 3 câu.', sbd: '12007', hoTen: 'Trần Thu Hà', hanhDong: 'xem_ho_so', apDung: true, ngayDieuChinh: '2026-09-21' }] } })
    await screen.findByText('ĐÃ LÀM')
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ điều chỉnh' }))
    fireEvent.click(screen.getByRole('button', { name: 'Giữ' }))
    expect(screen.getByRole('button', { name: 'Bỏ điều chỉnh' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ điều chỉnh' }))
    expect(screen.getByText('Bỏ điều chỉnh này?')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ' }))
    await screen.findByText('Đã bỏ điều chỉnh')
    const lan = goi.mock.calls.find((c) => c[0] === '/ai/dieu-chinh/bo')!
    expect(lan[1]).toEqual({ sbd: '12007', ngay: '2026-09-21' })
    expect(useAppStore.getState().toast?.text).toContain('Đã bỏ điều chỉnh của Trần Thu Hà')
  })

  it('máy chủ trả ok nhưng daBo=false (không có gì để bỏ) ⇒ KHÔNG nói "đã bỏ"; nói thật', async () => {
    dungMayChu({ '/ai/dem-qua': () => ({ json: demQuaJson({ cheDo: 'that', banTin: { cacDong: [{ loai: 'dieu_chinh', chu: 'Đã giảm 3 câu.', sbd: '12007', hoTen: 'Trần Thu Hà', hanhDong: 'xem_ho_so', apDung: true }] } }) }), '/ai/dieu-chinh/bo': () => ({ json: { ok: true, daBo: false } }) })
    render(<KhoiBoNaoDemQua />)
    await screen.findByText('ĐÃ LÀM')
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ điều chỉnh' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ' }))
    await waitFor(() => expect(useAppStore.getState().toast?.text ?? '').toContain('Không có điều chỉnh nào của Trần Thu Hà để bỏ'))
    expect(screen.queryByText('Đã bỏ điều chỉnh')).toBeNull()
  })

  it('dòng CHỈ BÁO (thầy xem lại · em vắng lâu) và dòng bộ não đã tự gỡ KHÔNG có nút "Bỏ điều chỉnh"; dòng cả lớp nối Gọi lên bảng', async () => {
    const { onGoiLenBang } = chay({
      cheDo: 'that',
      banTin: {
        cacDong: [
          { loai: 'thay_xem_lai', chu: '2 em đúng 12/12 câu, 4 giây/câu.', sbd: '12007', hoTen: 'Trần Thu Hà', hanhDong: 'xem_ho_so' },
          { loai: 'can_thay_y', chu: 'Vắng 5 ngày.', sbd: '12008', hoTen: 'Lê Minh Đức', hanhDong: 'nhan_phu_huynh' },
          { loai: 'dieu_chinh', chu: 'Đã thử ôn sớm.', sbd: '12007', hoTen: 'Trần Thu Hà', hanhDong: 'xem_ho_so', apDung: true, tuGo: true, ketQua: 'xau_di', ketQuaChu: 'bỏ dở chặng' },
          { loai: 'ca_lop', chu: 'Oxi hoá ancol: 21/34 em sai từ 2 câu.', sbd: '', hoTen: '', hanhDong: 'dua_vao_buoi_chua', dang: 'OXI' },
        ],
      },
    })
    await screen.findByText('THẦY XEM LẠI')
    expect(screen.queryByRole('button', { name: 'Bỏ điều chỉnh' })).toBeNull()
    expect(screen.getByText(/bộ não đã tự gỡ điều chỉnh này/)).toBeTruthy()
    expect(screen.getByText('Chưa hiệu quả')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Xem' })) // dòng cả lớp (không có tên) chỉ có "Xem"
    expect(onGoiLenBang).toHaveBeenCalledTimes(1)
  })

  it('quá 36 giờ ⇒ cảnh báo "chưa chạy N giờ" + học sinh vẫn học bình thường; đang tắt ⇒ nói tắt', async () => {
    chay({ chayLanCuoi: gioTruoc(40) })
    const canh = await screen.findByRole('alert')
    expect(canh.textContent).toContain('Bộ não chưa chạy 40 giờ')
    expect(canh.textContent).toContain('Học sinh vẫn học bình thường')
    cleanup()
    chay({ bat: false })
    expect(await screen.findByText('Bộ não đang tắt')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mở Cài đặt' })).toBeTruthy()
  })

  it('bản GỌN (Bảng tin): soDongGon=0 ⇒ chỉ tiêu đề + số đếm, không dòng, không nút; soDongGon=3 ⇒ ≤ 3 dòng không nút', async () => {
    const cac = Array.from({ length: 5 }, (_, i) => ({ loai: 'can_thay_y', chu: `Dòng ${'ABCDE'[i]}`, sbd: '12007', hoTen: 'A', hanhDong: 'xem_ho_so' }))
    chay({ banTin: { cacDong: cac } }, { gon: true, soDongGon: 0 })
    await screen.findByRole('heading', { name: /Bộ não A.I · đêm qua/ })
    expect(screen.queryByText('Dòng A')).toBeNull()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    cleanup()
    chay({ banTin: { cacDong: cac } }, { gon: true, soDongGon: 3 })
    await screen.findByText('Dòng A')
    expect(screen.queryByText('Dòng D')).toBeNull()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------- nhật ký từng em
describe('NhatKyDieuChinh — nhật ký + nguyên văn lời đã gửi em và phụ huynh', () => {
  const homNay = new Date().toISOString().slice(0, 10)
  const ngayCong = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)
  const hang = (o: Record<string, unknown> = {}) => ({ ngay: homNay, hetHan: ngayCong(3), cheDo: 'bong', doTin: 0.8, nhip: { lech: -2, khoiDong: 3 }, dang: [{ ma: 'ESTE.THUY_PHAN', hanhDong: 'uu_tien', lyDo: 'sai 5/8 câu' }], co: 'khong', loiNhanChoEm: 'Hôm qua em làm xong 4 câu đầu chặng 3.', loiNhanChoPhuHuynh: 'Kính gửi phụ huynh: em đã làm xong 4 câu.', thuTuan: '', goiYChoThay: null, ghiChuHlv: 'đang thử giảm 2 câu', ketQua: null, ketQuaChu: '', daBo: false, tuGo: false, apDung: false, lyDoBo: [], khacPhuc: [], ...o })

  it('CHẠY THỬ: hiện NGUYÊN VĂN lời cho em + phụ huynh KÈM NGÀY, ghi rõ CHƯA gửi; nhãn "Chỉ ghi sổ — chạy thử"', async () => {
    dungMayChu({ '/ai/nhat-ky': () => ({ json: { ok: true, sbd: '12007', hoTen: 'Trần Thu Hà', ds: [hang()] } }) })
    render(<NhatKyDieuChinh sbd="12007" />)
    expect(await screen.findByText('CHẠY THỬ — chưa tác động tới học sinh')).toBeTruthy()
    const dd = ngayNgan(homNay)
    expect(screen.getByText(`Lời dự kiến cho em (CHƯA gửi — chạy thử) · ${dd}`)).toBeTruthy()
    expect(screen.getByText('Hôm qua em làm xong 4 câu đầu chặng 3.')).toBeTruthy()
    expect(screen.getByText(`Lời dự kiến cho phụ huynh (CHƯA gửi — chạy thử) · ${dd}`)).toBeTruthy()
    expect(screen.getByText('Kính gửi phụ huynh: em đã làm xong 4 câu.')).toBeTruthy()
    expect(screen.getByText('Chỉ ghi sổ — chạy thử')).toBeTruthy()
    expect(screen.getByText('Chờ dữ liệu ngày mai')).toBeTruthy()
    expect(screen.getByText('Nhịp −2 · khởi động 3')).toBeTruthy()
    expect(screen.getByText('sai 5/8 câu')).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/BÓNG/i)
  })

  it('ĐÃ ÁP: nhãn "đã gửi" + thư tuần; kết quả hôm sau; dòng hết hạn / đã bỏ / tự gỡ KHÔNG có nút Bỏ; dòng còn hiệu lực có', async () => {
    dungMayChu({
      '/ai/nhat-ky': () => ({
        json: {
          ok: true,
          sbd: '12007',
          ds: [
            hang({ cheDo: 'that', apDung: true, thuTuan: 'Tuần này em đã đúng lại 2 câu.', ketQua: 'an_thua', ketQuaChu: 'xong 2/2 chặng, đúng 78 %' }),
            hang({ ngay: ngayCong(-6), hetHan: ngayCong(-3), cheDo: 'that', apDung: true, ketQua: 'khong_doi', loiNhanChoEm: 'Lời cũ cho em', loiNhanChoPhuHuynh: '' }),
            hang({ ngay: ngayCong(-1), hetHan: ngayCong(2), cheDo: 'that', apDung: true, tuGo: true, ketQua: 'xau_di', loiNhanChoEm: '', loiNhanChoPhuHuynh: '' }),
            hang({ ngay: ngayCong(-2), hetHan: ngayCong(1), cheDo: 'that', apDung: true, daBo: true, loiNhanChoEm: '', loiNhanChoPhuHuynh: '' }),
          ],
        },
      }),
    })
    render(<NhatKyDieuChinh sbd="12007" />)
    await screen.findByText('Có hiệu quả')
    expect(screen.queryByText('CHẠY THỬ — chưa tác động tới học sinh')).toBeNull()
    expect(screen.getByText(`Lời đã gửi cho em · ${ngayNgan(homNay)}`)).toBeTruthy()
    expect(screen.getByText(`Lời đã gửi cho phụ huynh · ${ngayNgan(homNay)}`)).toBeTruthy()
    expect(screen.getByText(`Thư tuần đã gửi cho phụ huynh · ${ngayNgan(homNay)}`)).toBeTruthy()
    expect(screen.getByText('Tuần này em đã đúng lại 2 câu.')).toBeTruthy()
    expect(screen.getByText('xong 2/2 chặng, đúng 78 %')).toBeTruthy()
    expect(screen.getByText('Lời cũ cho em')).toBeTruthy() // nguyên văn kèm ngày cũ
    expect(screen.getByText(`Lời đã gửi cho em · ${ngayNgan(ngayCong(-6))}`)).toBeTruthy()
    expect(screen.getByText('Bộ não đã tự gỡ (kết quả chưa tốt)')).toBeTruthy()
    expect(screen.getByText('Thầy đã bỏ')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Bỏ điều chỉnh ngày/ })).toHaveLength(1) // chỉ dòng hôm nay còn hiệu lực
  })

  it('Bỏ điều chỉnh: hỏi lại → /ai/dieu-chinh/bo {sbd, ngay} → tải lại nhật ký; lỗi ⇒ báo thật', async () => {
    let daBo = false
    dungMayChu({
      '/ai/nhat-ky': () => ({ json: { ok: true, sbd: '12007', ds: [hang({ daBo, apDung: true, cheDo: 'that' })] } }),
      '/ai/dieu-chinh/bo': () => {
        daBo = true
        return { json: { ok: true, daBo: true } }
      },
    })
    render(<NhatKyDieuChinh sbd="12007" />)
    fireEvent.click(await screen.findByRole('button', { name: /Bỏ điều chỉnh ngày/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ' }))
    await screen.findByText('Thầy đã bỏ')
    expect(goi.mock.calls.find((c) => c[0] === '/ai/dieu-chinh/bo')![1]).toEqual({ sbd: '12007', ngay: homNay })
    expect(screen.queryByRole('button', { name: /Bỏ điều chỉnh ngày/ })).toBeNull()
    cleanup()
    dungMayChu({ '/ai/nhat-ky': () => ({ json: { ok: true, sbd: '1', ds: [hang()] } }), '/ai/dieu-chinh/bo': () => ({ cham: true }) })
    render(<NhatKyDieuChinh sbd="12007" />)
    fireEvent.click(await screen.findByRole('button', { name: /Bỏ điều chỉnh ngày/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ' }))
    await waitFor(() => expect(useAppStore.getState().toast?.text ?? '').toContain('CHƯA CHẮC'))
  })

  it('trống · chưa có lệnh · lỗi mạng ⇒ lời thật, không dựng số', async () => {
    dungMayChu({ '/ai/nhat-ky': () => ({ json: { ok: true, sbd: '1', ds: [] } }) })
    render(<NhatKyDieuChinh sbd="12007" />)
    expect(await screen.findByText('Chưa có điều chỉnh nào cho em này')).toBeTruthy()
    cleanup()
    dungMayChu({})
    render(<NhatKyDieuChinh sbd="12007" />)
    expect(await screen.findByText('Máy chủ chưa có nhật ký điều chỉnh')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy()
  })
})

// ---------------------------------------------------------------- công tắc + theo lớp
describe('KhoiBoNaoCaiDat — công tắc và chế độ theo lớp', () => {
  let co: { bat: boolean; cheDo: string; lopThat: string[] }
  beforeEach(() => {
    co = { bat: true, cheDo: 'bong', lopThat: [] }
    dungMayChu({
      '/ai/cau-hinh': (b) => {
        co = { ...co, ...b } as typeof co
        return { json: { ok: true, cauHinh: co } }
      },
      '/ai/dem-qua': () => ({ json: demQuaJson() }),
    })
  })

  it('đọc cờ: công tắc BẬT, mọi lớp "Chạy thử"; tắt công tắc ⇒ POST {bat:false} rồi mới đổi màn', async () => {
    render(<KhoiBoNaoCaiDat />)
    const cong = await screen.findByRole('switch', { name: 'Bật bộ não' })
    expect(cong.getAttribute('aria-checked')).toBe('true')
    const g12A1 = screen.getByRole('radiogroup', { name: 'Chế độ lớp 12A1' })
    expect(within(g12A1).getByRole('radio', { name: 'Chạy thử' }).getAttribute('aria-checked')).toBe('true')
    expect(within(g12A1).getByRole('radio', { name: 'Thật' }).getAttribute('aria-checked')).toBe('false')
    fireEvent.click(cong)
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Bật bộ não' }).getAttribute('aria-checked')).toBe('false'))
    expect(goi.mock.calls.filter((c) => c[0] === '/ai/cau-hinh').at(-1)![1]).toEqual({ bat: false })
    expect(screen.getByText(/Bộ não đang/)).toBeTruthy()
  })

  it('chuyển lớp sang THẬT phải XÁC NHẬN; giữ chạy thử thì không ghi; xác nhận ⇒ POST {cheDo:"bong", lopThat:[lớp]}', async () => {
    render(<KhoiBoNaoCaiDat />)
    await screen.findByRole('switch', { name: 'Bật bộ não' })
    const soGhi = () => goi.mock.calls.filter((c) => c[0] === '/ai/cau-hinh' && Object.keys(c[1] as object).length > 0).length
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Chế độ lớp 12A1' })).getByRole('radio', { name: 'Thật' }))
    const hop = screen.getByRole('alertdialog', { name: 'Chuyển lớp 12A1 sang chế độ thật' })
    expect(hop.textContent).toContain('Không đổi hạn nộp')
    expect(soGhi()).toBe(0) // chưa xác nhận ⇒ chưa ghi
    fireEvent.click(within(hop).getByRole('button', { name: 'Giữ chạy thử' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(soGhi()).toBe(0)
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Chế độ lớp 12A1' })).getByRole('radio', { name: 'Thật' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Chuyển sang Thật' }))
    await waitFor(() => expect(within(screen.getByRole('radiogroup', { name: 'Chế độ lớp 12A1' })).getByRole('radio', { name: 'Thật' }).getAttribute('aria-checked')).toBe('true'))
    expect(goi.mock.calls.filter((c) => c[0] === '/ai/cau-hinh').at(-1)![1]).toEqual({ cheDo: 'bong', lopThat: ['12A1'] })
    // lớp kia vẫn chạy thử
    expect(within(screen.getByRole('radiogroup', { name: 'Chế độ lớp 12A2' })).getByRole('radio', { name: 'Chạy thử' }).getAttribute('aria-checked')).toBe('true')
    // đưa 12A1 về chạy thử: không cần xác nhận
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Chế độ lớp 12A1' })).getByRole('radio', { name: 'Chạy thử' }))
    await waitFor(() => expect(co.lopThat).toEqual([]))
  })

  it('máy chủ chưa có lệnh ⇒ KHÔNG có công tắc giả, nói "chưa lưu được"; lưu lỗi ⇒ giữ nguyên màn + báo thật', async () => {
    dungMayChu({})
    render(<KhoiBoNaoCaiDat />)
    expect(await screen.findByText(/Máy chủ chưa có lệnh cài đặt bộ não/)).toBeTruthy()
    expect(screen.getByText(/Chưa lưu được công tắc/)).toBeTruthy()
    expect(screen.queryByRole('switch')).toBeNull()
    cleanup()
    let lan = 0
    dungMayChu({ '/ai/cau-hinh': (b) => (Object.keys(b).length === 0 ? { json: { ok: true, cauHinh: { bat: true, cheDo: 'bong', lopThat: [] } } } : ++lan && { json: { ok: false, error: 'lopThat quá 50 phần tử' } }), '/ai/dem-qua': () => ({ json: demQuaJson() }) })
    render(<KhoiBoNaoCaiDat />)
    fireEvent.click(await screen.findByRole('switch', { name: 'Bật bộ não' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Chưa lưu được: lopThat quá 50 phần tử')
    expect(screen.getByRole('switch', { name: 'Bật bộ não' }).getAttribute('aria-checked')).toBe('true') // máy chủ không xác nhận ⇒ màn không đổi
  })
})

// ---------------------------------------------------------------- nối vào màn thật + chữ thầy chốt
describe('nguồn: nối vào màn, đổi chữ "bóng" → "thử", không hex', () => {
  const doc = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')
  it('Hôm nay · hồ sơ em · Cài đặt · Bảng tin đều gắn khối Bộ não; nút nối hàm SẴN CÓ', () => {
    const hn = doc('src/screens/HomNayScreen.tsx')
    expect(hn).toContain("<KhoiBoNaoDemQua onMoHoSo={moHoSoEm} onGoiLenBang={() => setScreen('goilenbang')} onMoCaiDat={() => setScreen('caidat')} />")
    expect(doc('src/screens/HocSinhScreen.tsx')).toContain('<NhatKyDieuChinh sbd={hoSo.em.sbd} />')
    expect(doc('src/screens/CaiDatScreen.tsx')).toContain('<KhoiBoNaoCaiDat />')
    expect(doc('src/components/BangTinGiaoVien.tsx')).toContain('<KhoiBoNaoDemQua gon ngay={day || undefined} soDongGon={day ? 3 : 0} />')
  })
  it('giao diện KHÔNG còn chữ "chạy bóng"/"CHẠY BÓNG" (thầy đổi thành "chạy thử"); mã nội bộ cheDo:"bong" giữ nguyên', () => {
    for (const f of ['src/components/KhoiBoNaoDemQua.tsx', 'src/components/NhatKyDieuChinh.tsx', 'src/components/KhoiBoNaoCaiDat.tsx']) {
      const tep = doc(f)
      // bỏ dòng chú thích rồi mới soi chữ hiển thị
      const chay = tep.split('\n').filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join('\n')
      expect(chay).not.toMatch(/chạy bóng|CHẠY BÓNG|Chạy bóng|chế độ <b>bóng/)
    }
    expect(doc('src/lib/bo-nao-thay.ts')).toContain("(v: unknown): CheDoBoNao => (v === 'that' ? 'that' : 'bong')")
  })
  it('CSS mới không hex, không !important', () => {
    const css = doc('src/styles/bo-nao-m3.css').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toContain('!important')
  })
})
