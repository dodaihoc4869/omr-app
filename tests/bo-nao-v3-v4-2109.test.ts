// BỘ NÃO — V4 "VÒNG KHÉP KÍN" (`huongEm`) + V3 "MỤC TIÊU TUẦN" (`mucTieuTuan` + `loiMucTieu`) — PHẦN THUẦN (Code 1, 21/09/2026; thầy chốt 4 điều lúc 12:xx). CHƯA bật gì: khuôn + kiemKhuon + luật + test; máy chủ (Code 3) làm sau.
// Luật: sai khuôn CHỈ bỏ phần ấy (phần tử vẫn hợp lệ, núm giữ); nhãn kín không chữ tự do; mọi số bằng chứng phải có trong thẻ; mục tiêu chỉ ở ngày soi kỹ hằng tuần, đích = bậc hiện tại + 1; nhãn đang có ràng buộc thử thách.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { kiemHuongEm, kiemKhuon, kiemMucTieuTuan, lamSachDauRa, tapSoCuaThe, type DauRaEm, type TheDeKiem } from '../src/lib/bo-nao-khuon'
import { LOI_TOT, THE } from './_bo-nao-thu-thach-mau'

const the = (o: Record<string, unknown> = {}): TheDeKiem => ({
  ...THE,
  hoatDong: { ngayCoBai7: 5, soNgayVang: 0, soNgayTuLucDau: 12 },
  gioHoc: 21,
  homQuaThuThach: { mo: true, soDaLam: 4, soDung: 3, bac: 'dung_bac', dang: ['ESTE.THUY_PHAN'] },
  luotSoiKyTuan: true,
  ...o,
})
const nen = (): DauRaEm => ({
  biDanh: 'A17', doTinCay: 0.8, nhip: { lech: 0, khoiDong: 2 }, dang: [], khacPhuc: [], co: 'khong', loiNhanChoEm: '', loiNhanChoPhuHuynh: '', thuTuan: '',
  goiYChoThay: { chu: '', hanhDong: 'khong', dang: '' }, ghiChuHlv: '', canSau: false,
})
const hu = (h: unknown, t: TheDeKiem = the()) => kiemHuongEm({ huongEm: h }, t, tapSoCuaThe(t)).join(' | ')
const mt = (d: Record<string, unknown>, t: TheDeKiem = the()) => kiemMucTieuTuan(d, t, tapSoCuaThe(t)).join(' | ')
const LOI_MT = 'Dạng Thuỷ phân ester em đã gặp 9 câu, sai 1 câu. Tuần này mình cùng đưa dạng này từ Hiểu lên Vận dụng nhé.'
const MT_OK = { mucTieuTuan: { dang: 'ESTE.THUY_PHAN', den: 2 }, loiMucTieu: LOI_MT }

describe('V4 huongEm — nhãn kín kèm số bằng chứng', () => {
  it('hợp lệ: 1–2 nhãn khác trục, số bằng chứng có trong thẻ; vắng / rỗng ⇒ không lỗi', () => {
    expect(hu([{ nhan: 'thu_thach', so: [4, 3] }, { nhan: 'muon', so: [21] }])).toBe('')
    expect(hu([{ nhan: 'ngan', so: [5] }])).toBe('')
    expect(kiemHuongEm({}, the(), new Set())).toEqual([])
    expect(hu([])).toBe('')
    expect(kiemHuongEm({ huongEm: null }, the(), new Set())).toEqual([])
  })
  it('danh sách kín: nhãn lạ, chữ tự do, khoá lạ, không phải mảng/đối tượng bị bỏ', () => {
    expect(hu([{ nhan: 'thich_hoc_hoa', so: [4] }])).toContain('không thuộc danh sách kín')
    expect(hu([{ nhan: 'ngan', so: [5], ghiChu: 'em thích ngắn' }])).toContain('khoá lạ')
    expect(hu('thu_thach')).toContain('phải là mảng')
    expect(hu(['ngan'])).toContain('không phải đối tượng')
  })
  it('≤ 2 nhãn; không lặp; mỗi trục tối đa MỘT nhãn', () => {
    expect(hu([{ nhan: 'ngan', so: [5] }, { nhan: 'thu_thach', so: [4] }, { nhan: 'muon', so: [21] }])).toContain('quá 2 nhãn')
    expect(hu([{ nhan: 'ngan', so: [5] }, { nhan: 'ngan', so: [5] }])).toContain('lặp')
    for (const [a, b] of [['thu_thach', 'tran_an'], ['ngan', 'giai_thich'], ['som', 'muon']]) expect(hu([{ nhan: a, so: [4] }, { nhan: b, so: [4] }], the({ gioHoc: 21 })), `${a}+${b}`).toContain('đối nghịch')
  })
  it('số bằng chứng: 1–4 số THẬT có trong thẻ (số lạ, rỗng, > 4, sai kiểu bị bỏ)', () => {
    expect(hu([{ nhan: 'ngan', so: [] }])).toContain('1–4 con số')
    expect(hu([{ nhan: 'ngan', so: [1, 2, 3, 4, 5] }])).toContain('1–4 con số')
    expect(hu([{ nhan: 'ngan', so: ['5'] }])).toContain('1–4 con số')
    expect(hu([{ nhan: 'ngan' }])).toContain('1–4 con số')
    expect(hu([{ nhan: 'ngan', so: [77] }])).toContain('số không có trong thẻ: 77')
  })
  it('cần ≥ 3 ngày có bài trong 7 ngày', () => {
    expect(hu([{ nhan: 'ngan', so: [5] }], the({ hoatDong: { ngayCoBai7: 2 } }))).toContain('≥ 3 ngày')
    expect(hu([{ nhan: 'ngan', so: [5] }], the({ hoatDong: undefined }))).toContain('≥ 3 ngày')
  })
  it('giờ học: som chỉ khi gioHoc ≤ 19; muon chỉ khi ≥ 21; thẻ không có gioHoc ⇒ không được', () => {
    expect(hu([{ nhan: 'som', so: [19] }], the({ gioHoc: 19 }))).toBe('')
    expect(hu([{ nhan: 'som', so: [20] }], the({ gioHoc: 20 }))).toContain('som cần thẻ có gioHoc ≤ 19')
    expect(hu([{ nhan: 'muon', so: [20] }], the({ gioHoc: 20 }))).toContain('muon cần thẻ có gioHoc ≥ 21')
    expect(hu([{ nhan: 'muon', so: [21] }], the({ gioHoc: 21 }))).toBe('')
    expect(hu([{ nhan: 'muon', so: [4] }], the({ gioHoc: undefined }))).toContain('muon cần')
  })
  it('thu_thach chỉ khi hôm qua em ĐÃ MỞ thẻ và làm ≥ 3 câu', () => {
    expect(hu([{ nhan: 'thu_thach', so: [4] }], the({ homQuaThuThach: { mo: true, soDaLam: 2, soDung: 2 } }))).toContain('thu_thach cần')
    expect(hu([{ nhan: 'thu_thach', so: [4] }], the({ homQuaThuThach: { mo: false, soDaLam: 0, soDung: 0 } }))).toContain('thu_thach cần')
    expect(hu([{ nhan: 'thu_thach', so: [4] }], the({ homQuaThuThach: undefined }))).toContain('thu_thach cần')
    expect(hu([{ nhan: 'thu_thach', so: [4] }], the({ homQuaThuThach: { mo: true, soDaLam: 3, soDung: 1 } }))).toBe('')
  })
})

describe('V4 gắn vào kiemKhuon — sai huongEm CHỈ bỏ phần huongEm', () => {
  it('huongEm sai ⇒ phần tử hợp lệ, boLoi ["huongEm"], lamSachDauRa xoá huongEm và giữ phần còn lại', () => {
    const d = { ...nen(), loiNhanChoEm: 'Hôm nay em đúng 7 trên 8 câu. Chuỗi 4 ngày rồi, giữ nhịp nhé.', huongEm: [{ nhan: 'khoe', so: [4] }] } as unknown as DauRaEm
    const k = kiemKhuon(d, the())
    expect(k.hopLe, JSON.stringify(k.lyDo)).toBe(true)
    expect(k.boLoi).toEqual(['huongEm'])
    const sach = lamSachDauRa(d, k)
    expect('huongEm' in sach).toBe(false)
    expect(sach.loiNhanChoEm).toBe(d.loiNhanChoEm)
  })
  it('huongEm hợp lệ ⇒ không boLoi, giữ nguyên', () => {
    const d = { ...nen(), huongEm: [{ nhan: 'ngan', so: [5] }] } as DauRaEm
    const k = kiemKhuon(d, the())
    expect(k.boLoi).toBeUndefined()
    expect(lamSachDauRa(d, k).huongEm).toEqual([{ nhan: 'ngan', so: [5] }])
  })
})

describe('V4 nhãn ĐANG CÓ (thẻ) ràng buộc thử thách hôm nay — chỉ làm bộ NHẸ đi', () => {
  const tt = (bac: string, soCau: number, chu = 'Hôm qua em đúng lại 4 câu từng sai. Hôm nay thử mấy câu Thuỷ phân ester nhé.') => ({ ...nen(), thuThach: { dang: ['ESTE.THUY_PHAN'], soCau, bac }, loiMoi: chu }) as unknown as DauRaEm
  const boLoi = (d: DauRaEm, t: TheDeKiem) => kiemKhuon(d, t).boLoi ?? []
  it('tran_an ⇒ không cao_hon_mot_bac; ngan ⇒ soCau ≤ 5; thu_thach / giai_thich không ràng buộc', () => {
    const cao = the({ huongEm: [{ nhan: 'tran_an', so: [4] }] })
    expect(boLoi(tt('cao_hon_mot_bac', 5), cao)).toEqual(['thuThach'])
    expect(kiemKhuon(tt('cao_hon_mot_bac', 5), cao).canhBao?.join()).toContain('tran_an')
    expect(boLoi(tt('dung_bac', 5), cao)).toEqual([])
    const ngan = the({ huongEm: [{ nhan: 'ngan', so: [5] }] })
    expect(boLoi(tt('dung_bac', 6), ngan)).toEqual(['thuThach'])
    expect(boLoi(tt('dung_bac', 5), ngan)).toEqual([])
    const loiCao = LOI_TOT[1].chu // lời mời đẩy bậc hợp lệ
    for (const nhan of ['thu_thach', 'giai_thich']) expect(boLoi(tt('cao_hon_mot_bac', 8, loiCao), the({ huongEm: [{ nhan, so: [4] }] })), nhan).toEqual([])
    expect(boLoi(tt('cao_hon_mot_bac', 8, loiCao), the())).toEqual([]) // không nhãn ⇒ y hệt bản trước
  })
  it('lời mời / lời mục tiêu KHÔNG nói ra điều Bộ não "biết" về em', () => {
    for (const cam of ['em thích', 'em hay', 'mình biết em', 'mình để ý', 'mình thấy em', 'em thường']) {
      expect(kiemKhuon(tt('dung_bac', 5, `Hôm qua em đúng lại 4 câu, ${cam} thử mấy câu nhé.`), the()).canhBao?.join(), cam).toContain('nói ra điều Bộ não')
    }
  })
})

describe('V3 mục tiêu tuần — chỉ ở ngày soi kỹ, đích = bậc hiện tại + 1', () => {
  it('hợp lệ (dạng Hiểu → Vận dụng; dạng đủ tin, không yếu)', () => {
    expect(mt(MT_OK)).toBe('')
    expect(mt({ mucTieuTuan: { dang: 'LIPID.BEO', den: 2 }, loiMucTieu: 'Dạng Lipid béo em đã gặp 5 câu, sai 0 câu. Tuần này mình cùng đưa dạng này từ Hiểu lên Vận dụng nhé.' })).toBe('')
    expect(mt({})).toBe('')
  })
  it('đi cùng nhau: thiếu một trong hai ⇒ bỏ', () => {
    expect(mt({ mucTieuTuan: MT_OK.mucTieuTuan })).toContain('đi cùng nhau')
    expect(mt({ loiMucTieu: LOI_MT })).toContain('đi cùng nhau')
  })
  it('chỉ ở ngày soi kỹ hằng tuần; em đang có mục tiêu chưa hết hạn ⇒ không đặt thêm', () => {
    expect(mt(MT_OK, the({ luotSoiKyTuan: false }))).toContain('ngày soi kỹ hằng tuần')
    expect(mt(MT_OK, the({ mucTieuTuan: { dang: 'LIPID.BEO', tu: 1, den: 2, ngayCon: 3, tienDo: 0.4 } }))).toContain('đang có mục tiêu tuần chưa hết hạn')
    expect(mt(MT_OK, the({ mucTieuTuan: { dang: 'LIPID.BEO', tu: 1, den: 2, ngayCon: 0, tienDo: 1 } }))).toBe('')
  })
  it('dạng: có trong thẻ, đủ tin (≥ 4 câu), không yếu; den = bậc + 1, ≤ Vận dụng', () => {
    expect(mt({ mucTieuTuan: { dang: 'KHONG.CO', den: 2 }, loiMucTieu: LOI_MT })).toContain('không có trong thẻ')
    expect(mt(MT_OK, the({ dangChuY: [{ ma: 'ESTE.THUY_PHAN', gap: 3, sai: 1, bac: 1, tiLeKhacPhuc: null, lam7: 3, sai7: 1 }] }))).toContain('chưa đủ tin')
    expect(mt({ mucTieuTuan: { dang: 'CARB.PHAN_LOAI', den: 1 }, loiMucTieu: 'Dạng Carb phân loại em đã gặp 6 câu, sai 3 câu. Tuần này mình cùng đưa dạng này từ Biết lên Hiểu nhé.' })).toContain('đang yếu')
    expect(mt({ mucTieuTuan: { dang: 'ESTE.THUY_PHAN', den: 1 }, loiMucTieu: LOI_MT })).toContain('đúng bậc hiện tại + 1')
    expect(mt({ mucTieuTuan: { dang: 'ESTE.THUY_PHAN', den: 3 }, loiMucTieu: LOI_MT })).toContain('phải là 1')
    const vanDung = the({ dangChuY: [{ ma: 'ESTE.THUY_PHAN', gap: 9, sai: 1, bac: 2, tiLeKhacPhuc: 0.9, lam7: 9, sai7: 1 }] })
    expect(mt(MT_OK, vanDung)).toContain('đúng bậc hiện tại + 1') // đã Vận dụng ⇒ không còn bậc để lên
    expect(mt({ mucTieuTuan: { dang: 'ESTE.THUY_PHAN', den: 2, ghi: 'x' }, loiMucTieu: LOI_MT })).toContain('khoá lạ')
    expect(mt({ mucTieuTuan: 'ESTE.THUY_PHAN', loiMucTieu: LOI_MT })).toContain('không phải đối tượng')
  })
  it('loiMucTieu theo LUẬT CHỮ: ≤ 160, có số thật, mọi số có trong thẻ, không hứa, không nêu số câu, không gọi tên / nói điều "biết" về em', () => {
    const L = (chu: string) => mt({ mucTieuTuan: MT_OK.mucTieuTuan, loiMucTieu: chu })
    expect(L(`${LOI_MT} ${'a'.repeat(160)}`)).toContain('loiMucTieu quá 160 ký tự')
    expect(L('Tuần này mình cùng đưa dạng Thuỷ phân ester từ Hiểu lên Vận dụng nhé.')).toContain('ít nhất một con số')
    expect(L('Dạng Thuỷ phân ester em đã gặp 19 câu. Tuần này mình cùng đưa dạng này lên Vận dụng nhé.')).toContain('số không có trong thẻ: 19')
    expect(L('Dạng Thuỷ phân ester em đã gặp 9 câu. Tuần này chắc chắn em lên Vận dụng.')).toContain('hứa điều không chắc')
    expect(L('Dạng Thuỷ phân ester em đã gặp 9 câu. Tuần này thử 4 câu mỗi ngày nhé.')).toContain('nêu số câu sẽ làm')
    expect(L('Minh ơi, dạng Thuỷ phân ester em đã gặp 9 câu, tuần này lên Vận dụng nhé.')).toContain('gọi tên')
    expect(L('Dạng Thuỷ phân ester em đã gặp 9 câu, em thích dạng này, tuần này lên Vận dụng nhé.')).toContain('nói ra điều Bộ não')
    expect(L('Dạng Thuỷ phân ester em đã gặp 9 câu. Em đã nắm chắc dạng này, tuần này lên Vận dụng.')).toContain('từ cấm')
    expect(L('Dạng Thuỷ phân ester em đã gặp 9 câu. Long Hoả đợi em lên Vận dụng.')).toContain('tên riêng không có trong thẻ')
    expect(L('Dạng Thuỷ phân ester em đã gặp 9 câu 🔥 tuần này lên Vận dụng.')).toContain('emoji')
    expect(L('Dạng Thuỷ phân ester em đã gặp 9 câu.\nTuần này lên Vận dụng.')).toContain('ký tự lạ hoặc xuống dòng')
  })
})

describe('V3 gắn vào kiemKhuon — sai mục tiêu CHỈ bỏ phần mục tiêu; cả ba phần độc lập', () => {
  it('mucTieuTuan sai ⇒ phần tử hợp lệ, boLoi ["mucTieuTuan"], lamSachDauRa xoá CẢ mucTieuTuan lẫn loiMucTieu', () => {
    const d = { ...nen(), mucTieuTuan: { dang: 'KHONG.CO', den: 2 }, loiMucTieu: LOI_MT } as unknown as DauRaEm
    const k = kiemKhuon(d, the())
    expect(k.hopLe, JSON.stringify(k.lyDo)).toBe(true)
    expect(k.boLoi).toEqual(['mucTieuTuan'])
    const sach = lamSachDauRa(d, k)
    expect('mucTieuTuan' in sach || 'loiMucTieu' in sach).toBe(false)
  })
  it('mucTieuTuan hợp lệ giữ nguyên; thử thách + huongEm + mục tiêu sai cùng lúc ⇒ boLoi đủ ba, phần tử vẫn hợp lệ', () => {
    const tot = { ...nen(), ...MT_OK } as unknown as DauRaEm
    const k = kiemKhuon(tot, the())
    expect(k.boLoi).toBeUndefined()
    expect(lamSachDauRa(tot, k).mucTieuTuan).toEqual({ dang: 'ESTE.THUY_PHAN', den: 2 })
    const xau = { ...nen(), thuThach: { dang: ['X'], soCau: 5, bac: 'dung_bac' }, loiMoi: 'x', huongEm: 'x', mucTieuTuan: { dang: 'X', den: 2 }, loiMucTieu: 'x' } as unknown as DauRaEm
    const k2 = kiemKhuon(xau, the())
    expect(k2.hopLe).toBe(true)
    expect([...(k2.boLoi ?? [])].sort()).toEqual(['huongEm', 'mucTieuTuan', 'thuThach'])
    const sach = lamSachDauRa(xau, k2)
    for (const kh of ['thuThach', 'loiMoi', 'huongEm', 'mucTieuTuan', 'loiMucTieu']) expect(kh in sach, kh).toBe(false)
  })
  it('phần tử KHÔNG có các trường mới ⇒ Y HỆT bản trước (không boLoi, không cảnh báo)', () => {
    const k = kiemKhuon(nen(), the())
    expect(k.hopLe).toBe(true)
    expect(k.boLoi).toBeUndefined()
    expect(k.canhBao).toBeUndefined()
  })
})

describe('tài liệu: hợp đồng cho Code 3 đủ khối; cẩm nang nói rõ CHƯA BẬT; luật đêm chưa nhắc tới', () => {
  const doc = (p: string) => readFileSync(p, 'utf8')
  it('hợp đồng có đủ năm khối thẻ + hai bảng mới + cờ + dọn reset + 14 ngày; tên khớp mã kiểu của thẻ', () => {
    const hd = doc('docs/hop-dong-bo-nao-v3-v4-2109.md')
    for (const t of ['homQuaThuThach', 'gioHoc', 'huongEm', 'mucTieuTuan', 'mucTieuTuanTruoc', 'ai_huong_em', 'ai_muc_tieu_tuan', 'cau_hinh.bo_nao.mucTieuTuan', '`.voiEm`', '+ 14', 'Reset toàn app', 'luotSoiKyTuan']) expect(hd, t).toContain(t)
    const dt = doc('src/lib/bo-nao-dac-trung.ts')
    for (const t of ['homQuaThuThach', 'gioHoc', 'huongEm', 'mucTieuTuan', 'mucTieuTuanTruoc']) expect(dt, t).toContain(t)
  })
  it('cẩm nang: mục SẮP CÓ ghi CHƯA BẬT và cấm ghi ở đêm này; LUAT-RUT-GON (đọc mỗi đêm) KHÔNG nhắc huongEm / mucTieuTuan', () => {
    const c = doc('bo-nao/HUONG-DAN-BO-NAO.md')
    expect(c).toContain('CHƯA BẬT: đêm này KHÔNG ghi `huongEm`, `mucTieuTuan`, `loiMucTieu`')
    const luat = doc('bo-nao/LUAT-RUT-GON.md')
    for (const t of ['huongEm', 'mucTieuTuan', 'loiMucTieu']) expect(luat, t).not.toContain(t)
  })
})
