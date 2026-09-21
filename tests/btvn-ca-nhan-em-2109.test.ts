import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  cauCuaChang,
  chuDauBai,
  chuMoLuc,
  chuNgayMo,
  nhanMoLucNgan,
  docBaiCaNhan,
  docKetQuaChang,
  docKetQuaChangDaLuu,
  doiLuotLam,
  dongPhuChang,
  ghepKetQuaVaoCau,
  hanChu,
  khoaKetQuaChang,
  khoaLuotLam,
  luuKetQuaChang,
  tenMucBac,
  themDapAnGiaChoCau,
  theChangView,
  thongTinNhan,
  type KetQuaChang,
} from '../src/lib/btvn-ca-nhan-em'

const phanHoi = (o: Record<string, unknown> = {}) => ({
  ok: true,
  caNhan: true,
  soCau: 52,
  soCauCuaEm: 52,
  soChang: 3,
  loDaXong: 1,
  changDangMo: 1,
  chang: [
    { chiSo: 1, soCau: 3, moLuc: '2026-09-22T17:00:00.000Z', daMo: true, daXong: false },
    { chiSo: 0, soCau: 2, moLuc: '2026-09-21T17:00:00.000Z', daMo: true, daXong: true },
    { chiSo: 2, soCau: 4, moLuc: '2026-09-23T17:00:00.000Z', daMo: false, daXong: false },
  ],
  nhan: { a: 'khoi_dong', b: 'loi', c: 'dang_yeu', d: 'cung_co', e: 'thu_thach', f: 'loi_cao', x: 'la_hoac' },
  ...o,
})

describe('docBaiCaNhan — chỉ nhận bài cá nhân hoá đúng nghĩa', () => {
  it('KHÔNG phải bài cá nhân hoá ⇒ null (phiếu cũ chạy y như cũ)', () => {
    for (const caNhan of [false, undefined, null, 'true', 1, 0, {}]) expect(docBaiCaNhan(phanHoi({ caNhan }))).toBeNull()
    expect(docBaiCaNhan(null)).toBeNull()
    expect(docBaiCaNhan('x')).toBeNull()
    expect(docBaiCaNhan([])).toBeNull()
  })

  it('đọc đủ trường, xếp chặng theo chỉ số, bỏ nhãn lạ', () => {
    const b = docBaiCaNhan(phanHoi())!
    expect(b.soCauCuaEm).toBe(52)
    expect(b.soChang).toBe(3)
    expect(b.loDaXong).toBe(1)
    expect(b.changDangMo).toBe(1)
    expect(b.chang.map((c) => c.chiSo)).toEqual([0, 1, 2])
    expect(b.chang[2].daMo).toBe(false)
    expect(Object.keys(b.nhan).sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
    expect(b.nhan.x).toBeUndefined()
  })

  it('đã xong hết ⇒ changDangMo null; thiếu soCauCuaEm ⇒ lấy soCau', () => {
    const b = docBaiCaNhan(phanHoi({ changDangMo: null, soCauCuaEm: undefined, soCau: 40 }))!
    expect(b.changDangMo).toBeNull()
    expect(b.soCauCuaEm).toBe(40)
  })

  it('chặng hỏng (thiếu chỉ số/số câu) bị bỏ, không làm hỏng cả bài', () => {
    const b = docBaiCaNhan(phanHoi({ chang: [{ chiSo: 0, soCau: 2, daMo: true }, { soCau: 3 }, { chiSo: 1 }, null, 'x'] }))!
    expect(b.chang).toHaveLength(1)
  })
})

describe('cauCuaChang — cắt câu theo chặng ĐÃ MỞ', () => {
  const b = docBaiCaNhan(phanHoi())!
  const cau = ['c0', 'c1', 'c2', 'c3', 'c4'] // chặng 0: 2 câu, chặng 1: 3 câu, chặng 2 chưa mở
  it('đúng thứ tự chặng → thứ tự trong chặng', () => {
    expect(cauCuaChang(b, cau, 0)).toEqual(['c0', 'c1'])
    expect(cauCuaChang(b, cau, 1)).toEqual(['c2', 'c3', 'c4'])
  })
  it('chặng CHƯA MỞ không chiếm chỗ: câu của chặng mở sau nó vẫn cắt đúng vị trí', () => {
    const lech = docBaiCaNhan(
      phanHoi({
        chang: [
          { chiSo: 0, soCau: 2, daMo: true, daXong: true },
          { chiSo: 1, soCau: 3, daMo: false, daXong: false },
          { chiSo: 2, soCau: 4, daMo: true, daXong: false },
        ],
      }),
    )!
    const sau = ['a', 'b', 'c', 'd', 'e', 'f'] // máy chủ chỉ gửi câu chặng đã mở: 2 + 4
    expect(cauCuaChang(lech, sau, 0)).toEqual(['a', 'b'])
    expect(cauCuaChang(lech, sau, 2)).toEqual(['c', 'd', 'e', 'f'])
    expect(cauCuaChang(lech, sau, 1)).toEqual([])
  })
  it('chặng chưa mở hoặc không có ⇒ rỗng (không lộ câu)', () => {
    expect(cauCuaChang(b, cau, 2)).toEqual([])
    expect(cauCuaChang(b, cau, 9)).toEqual([])
  })
})

describe('chuDauBai — chỉ số đếm của chính em', () => {
  it('52 câu / 7 chặng ⇒ ceil(52/7 × 80/60) = 10 phút mỗi ngày', () => {
    const b = docBaiCaNhan(phanHoi({ soCauCuaEm: 52, soChang: 7, chang: [] }))!
    expect(chuDauBai(b)).toEqual({ tong: 52, soChang: 7, phutMoiNgay: 10 })
  })
  it('không chia cho 0: chưa có chặng ⇒ không có số phút', () => {
    const b = docBaiCaNhan(phanHoi({ soCauCuaEm: 10, soChang: 0, chang: [] }))!
    expect(chuDauBai(b).phutMoiNgay).toBeNull()
  })
  it('ít nhất 1 phút', () => {
    const b = docBaiCaNhan(phanHoi({ soCauCuaEm: 1, soChang: 5, chang: [] }))!
    expect(chuDauBai(b).phutMoiNgay).toBe(1)
  })
})

describe('thongTinNhan — nhãn nhẹ, không lẫn màu đúng/sai', () => {
  it('bảng ánh xạ đúng với lõi của Code 1', () => {
    expect(thongTinNhan('khoi_dong')).toMatchObject({ kieu: 'kd', chu: 'Khởi động', thuong: false })
    expect(thongTinNhan('loi')).toMatchObject({ kieu: 'cl', chu: 'Cốt lõi', thuong: false })
    expect(thongTinNhan('dang_yeu')).toMatchObject({ kieu: 'rr', chu: 'Dành riêng cho em' })
    expect(thongTinNhan('cung_co')).toMatchObject({ kieu: 'rr', chu: 'Dành riêng cho em' })
  })
  it('thử thách và lõi-cao là câu THƯỞNG, cùng kiểu vàng, đều ghi "sai không sao"', () => {
    for (const n of ['thu_thach', 'loi_cao'] as const) {
      const t = thongTinNhan(n)
      expect(t.kieu).toBe('tt')
      expect(t.thuong).toBe(true)
      expect(t.ghi).toContain('sai không sao')
    }
    expect(thongTinNhan('loi_cao').chu).toBe('Cốt lõi · câu cao')
    expect(thongTinNhan('thu_thach').chu).toBe('Thử thách')
  })
  it('câu thường KHÔNG có dòng ghi', () => {
    for (const n of ['khoi_dong', 'loi', 'dang_yeu', 'cung_co'] as const) expect(thongTinNhan(n).ghi).toBeNull()
  })
})

describe('chuNgayMo', () => {
  const bayGio = new Date(2026, 8, 21, 10, 0) // 21/09 10:00 giờ máy
  it('cùng ngày / ngày mai / xa hơn / hỏng', () => {
    expect(chuNgayMo(new Date(2026, 8, 21, 0, 0).toISOString(), bayGio)).toBe('hôm nay')
    expect(chuNgayMo(new Date(2026, 8, 22, 0, 0).toISOString(), bayGio)).toBe('ngày mai')
    expect(chuNgayMo(new Date(2026, 8, 24, 0, 0).toISOString(), bayGio)).toBe('ngày 24/09')
    expect(chuNgayMo('không phải ngày', bayGio)).toBe('')
  })
})

describe('docKetQuaChang', () => {
  const ket = (o: Record<string, unknown> = {}) => ({
    ok: true,
    loDaXong: 1,
    changDangMo: 1,
    chang: { chiSo: 0, soCau: 2, soDung: 1, xong: true },
    ketQua: [
      { qid: 'q1', dung: true, dapAnDung: 'B', loiGiai: 'Vì…', anhLoiGiai: [{ tep: 'a.png' }] },
      { qid: 'q2', dung: false, dapAnDung: 'DSDS' },
    ],
    chuaLam: ['q3'],
    exp: { homNay: 46, conLaiLenCap: 30 },
    tienBo: { dangLenBac: [{ ma: 'thuy-phan', ten: 'Thuỷ phân ester', tu: 0, den: 1 }], soCauDungLai: 2, soCauMoiGap: 1, soDangMoi: 0, coTienBo: true },
    ...o,
  })
  it('đọc đủ', () => {
    const k = docKetQuaChang(ket())!
    expect(k.ok).toBe(true)
    expect(k.ketQua).toHaveLength(2)
    expect(k.ketQua[0]).toMatchObject({ qid: 'q1', dung: true, dapAnDung: 'B', loiGiai: 'Vì…' })
    expect(k.ketQua[1]).toMatchObject({ qid: 'q2', dung: false, loiGiai: null, anhLoiGiai: [] })
    expect(k.chuaLam).toEqual(['q3'])
    expect(k.chang).toEqual({ chiSo: 0, soCau: 2, soDung: 1, xong: true })
    expect(k.exp).toEqual({ homNay: 46, conLaiLenCap: 30 })
    expect(k.tienBo?.dangLenBac[0]).toEqual({ ma: 'thuy-phan', ten: 'Thuỷ phân ester', tu: 0, den: 1 })
    expect(k.tienBo?.soCauDungLai).toBe(2)
  })
  it('đáp án/lời giải giữ NGUYÊN DẠNG kho: chuỗi hoặc đối tượng (không ép String → "[object Object]")', () => {
    const lg = { chot: 'Nhóm chức ester', buoc: ['Bước 1'], dap_an_tu_giai: 'B' }
    const k = docKetQuaChang(ket({ ketQua: [
      { qid: 'a', dung: true, dapAnDung: 'B', loiGiai: lg },
      { qid: 'b', dung: false, dapAnDung: { a: 'D', b: 'S', c: 'D', d: 'S' }, loiGiai: {} },
      { qid: 'c', dung: true, dapAnDung: 12.5, loiGiai: '   ' },
      { qid: 'd', dung: true, dapAnDung: null, loiGiai: [1] },
    ] }))!
    expect(k.ketQua[0].loiGiai).toEqual(lg)
    expect(k.ketQua[1].dapAnDung).toEqual({ a: 'D', b: 'S', c: 'D', d: 'S' })
    expect(k.ketQua[1].loiGiai).toBeNull() // đối tượng rỗng = không có lời giải
    expect(k.ketQua[2]).toMatchObject({ dapAnDung: '12.5', loiGiai: null })
    expect(k.ketQua[3]).toMatchObject({ dapAnDung: '', loiGiai: null }) // mảng/null không hợp lệ
  })
  it('em chưa có thú ⇒ conLaiLenCap null; không có exp/tienBo ⇒ vắng (không bịa)', () => {
    expect(docKetQuaChang(ket({ exp: { homNay: 5, conLaiLenCap: null } }))!.exp).toEqual({ homNay: 5, conLaiLenCap: null })
    const k = docKetQuaChang(ket({ exp: undefined, tienBo: undefined }))!
    expect(k.exp).toBeUndefined()
    expect(k.tienBo).toBeUndefined()
  })
  it('chặng cuối xong: máy chủ tự chốt nộp — đọc nop (soCau là MẪU điểm); chặng thường KHÔNG có nop', () => {
    expect(docKetQuaChang(ket())!.nop).toBeUndefined()
    const k = docKetQuaChang(ket({ nop: { daNop: true, nopLuc: '2026-09-28T13:00:00.000Z', soDung: 40, soCau: 45, soCauCuaEm: 48, soCauThuongSai: 3, qidSai: ['q2', 5] } }))!
    expect(k.nop).toEqual({ daNop: true, nopLuc: '2026-09-28T13:00:00.000Z', soDung: 40, soCau: 45, soCauCuaEm: 48, soCauThuongSai: 3, qidSai: ['q2'] })
    // chưa nộp (daNop khác đúng true) hoặc thiếu số ⇒ vắng, không bịa
    expect(docKetQuaChang(ket({ nop: { daNop: false, soDung: 1, soCau: 2 } }))!.nop).toBeUndefined()
    expect(docKetQuaChang(ket({ nop: { daNop: true, soDung: 'x', soCau: 2 } }))!.nop).toBeUndefined()
  })
  it('dòng kết quả hỏng bị bỏ (dung phải đúng kiểu boolean)', () => {
    const k = docKetQuaChang(ket({ ketQua: [{ qid: 'q1', dung: 'true' }, { qid: '', dung: true }, { dung: true }, { qid: 'q9', dung: false }] }))!
    expect(k.ketQua.map((x) => x.qid)).toEqual(['q9'])
  })
  it('ok:false giữ lyDo (chang_chua_mo)', () => {
    const k = docKetQuaChang({ ok: false, lyDo: 'chang_chua_mo' })!
    expect(k.ok).toBe(false)
    expect(k.lyDo).toBe('chang_chua_mo')
    expect(k.ketQua).toEqual([])
  })
  it('không phải đối tượng ⇒ null', () => {
    expect(docKetQuaChang(null)).toBeNull()
    expect(docKetQuaChang('x')).toBeNull()
  })
})

describe('lưu kết quả chặng ở máy — ĐÁP ÁN ĐẦU THẮNG', () => {
  beforeEach(() => localStorage.clear())
  const kq = (qid: string, dung: boolean, dapAnDung = 'A') => ({ qid, dung, dapAnDung, loiGiai: 'g-' + qid, anhLoiGiai: [] })
  it('lưu rồi đọc lại đúng', () => {
    luuKetQuaChang('B1', 'S1', 0, [kq('q1', true)], { q1: 'A' })
    const d = docKetQuaChangDaLuu('B1', 'S1', 0)
    expect(d.ketQua.map((k) => k.qid)).toEqual(['q1'])
    expect(d.dapAn).toEqual({ q1: 'A' })
    expect(localStorage.getItem(khoaKetQuaChang('B1', 'S1', 0))).not.toBeNull()
  })
  it('nộp lần hai: câu đã có giữ NGUYÊN kết quả và đáp án cũ; câu mới được thêm', () => {
    luuKetQuaChang('B1', 'S1', 0, [kq('q1', false, 'B')], { q1: 'C' })
    const d = luuKetQuaChang('B1', 'S1', 0, [kq('q1', true, 'B'), kq('q2', true)], { q1: 'B', q2: 'A' })
    expect(d.ketQua.find((k) => k.qid === 'q1')!.dung).toBe(false)
    expect(d.dapAn).toEqual({ q1: 'C', q2: 'A' })
    expect(d.ketQua.map((k) => k.qid)).toEqual(['q1', 'q2'])
  })
  it('mỗi (bài, em, chặng) một khoá riêng', () => {
    luuKetQuaChang('B1', 'S1', 0, [kq('q1', true)], {})
    expect(docKetQuaChangDaLuu('B1', 'S1', 1).ketQua).toEqual([])
    expect(docKetQuaChangDaLuu('B1', 'S2', 0).ketQua).toEqual([])
    expect(docKetQuaChangDaLuu('B2', 'S1', 0).ketQua).toEqual([])
  })
  it('máy chặn lưu / dữ liệu hỏng ⇒ không ném lỗi', () => {
    localStorage.setItem(khoaKetQuaChang('B1', 'S1', 0), '{hỏng')
    expect(docKetQuaChangDaLuu('B1', 'S1', 0)).toEqual({ ketQua: [], dapAn: {} })
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('đầy')
    })
    expect(() => luuKetQuaChang('B1', 'S1', 5, [kq('q1', true)], {})).not.toThrow()
    spy.mockRestore()
  })
})

describe('câu thô ↔ kết quả', () => {
  const tho = [
    { qid: 'q1', phan: 'I', so: 1, de: 'x', pa: { A: 'a' } },
    { qid: 'q2', phan: 'II', so: 2, de: 'y', dap_an: 'SSSS' },
    { qid: 'q3', phan: 'III', so: 3, de: 'z', hinh: [{ tep: 'de.png', vi_tri: 'sau_de' }] },
    { qid: 'q4', phan: 'I', so: 4, de: 'w', dap_an: '' },
  ]
  it('themDapAnGiaChoCau: đáp án giả theo phần, câu có sẵn giữ nguyên, ghi nhận câu chưa có', () => {
    const { cau, chuaCo } = themDapAnGiaChoCau(tho)
    expect(cau[0].dap_an).toBe('A')
    expect(cau[1].dap_an).toBe('SSSS')
    expect(cau[2].dap_an).toBe('0')
    expect(cau[3].dap_an).toBe('A')
    expect([...chuaCo].sort()).toEqual(['q1', 'q3', 'q4'])
    expect(tho[0]).not.toHaveProperty('dap_an') // không sửa mảng vào
  })
  it('ghepKetQuaVaoCau: câu đã chấm có đáp án đúng + lời giải + ảnh lời giải; câu chưa chấm KHÔNG đổi', () => {
    const ghep = ghepKetQuaVaoCau(tho, [
      { qid: 'q3', dung: true, dapAnDung: '12,5', loiGiai: 'Giải q3', anhLoiGiai: [{ tep: 'lg.png', vi_tri: 'sau_loi_giai' }] },
    ])
    expect(ghep[2].dap_an).toBe('12,5')
    expect(ghep[2].loi_giai).toEqual({ chot: 'Giải q3' }) // chuỗi trơn ⇒ bọc `chot` (cửa nạp chỉ nhận đối tượng, phiếu chỉ vẽ chot/buoc/tung_*)
    expect(ghep[2].hinh).toEqual([{ tep: 'de.png', vi_tri: 'sau_de' }, { tep: 'lg.png', vi_tri: 'sau_loi_giai' }])
    expect(ghep[0]).toBe(tho[0])
    expect(ghep[0]).not.toHaveProperty('dap_an')
    expect(tho[2]).not.toHaveProperty('loi_giai')
  })
  it('ghép lời giải dạng ĐỐI TƯỢNG và đáp án Phần II dạng đối tượng nguyên vẹn', () => {
    const lg = { chot: 'ý chính' }
    const ghep = ghepKetQuaVaoCau(tho, [{ qid: 'q2', dung: true, dapAnDung: { a: 'D', b: 'D', c: 'S', d: 'S' }, loiGiai: lg, anhLoiGiai: [] }])
    expect(ghep[1].loi_giai).toBe(lg)
    expect(ghep[1].dap_an).toEqual({ a: 'D', b: 'D', c: 'S', d: 'S' })
  })
  it('lời giải rỗng không ghi đè bằng chuỗi rỗng', () => {
    const ghep = ghepKetQuaVaoCau(tho, [{ qid: 'q1', dung: false, dapAnDung: 'B', loiGiai: null, anhLoiGiai: [] }, { qid: 'q3', dung: true, dapAnDung: '1', loiGiai: '  ', anhLoiGiai: [] }, { qid: 'q4', dung: true, dapAnDung: 'A', loiGiai: {}, anhLoiGiai: [] }])
    expect(ghep[0].dap_an).toBe('B')
    expect(ghep[0]).not.toHaveProperty('loi_giai')
    expect(ghep[0]).not.toHaveProperty('hinh')
    expect(ghep[2]).not.toHaveProperty('loi_giai') // chuỗi trắng
    expect(ghep[3]).not.toHaveProperty('loi_giai') // đối tượng rỗng
  })
})

describe('tenMucBac', () => {
  it('0/1/2 = Biết/Hiểu/Vận dụng, ngoài ra rỗng', () => {
    expect([0, 1, 2, 3, -1].map(tenMucBac)).toEqual(['Biết', 'Hiểu', 'Vận dụng', '', ''])
  })
})

describe('theChangView — thẻ cuối chặng: chỉ nói điều có số đếm thật', () => {
  const ket = (o: Partial<KetQuaChang> = {}): KetQuaChang => ({
    ok: true,
    ketQua: [],
    chuaLam: [],
    loDaXong: 3,
    chang: { chiSo: 2, soCau: 8, soDung: 6, xong: true },
    exp: { homNay: 46, conLaiLenCap: 30 },
    tienBo: { dangLenBac: [{ ma: 'tp', ten: 'Thuỷ phân ester', tu: 0, den: 1 }], soCauDungLai: 2, soCauMoiGap: 1, soDangMoi: 1, coTienBo: true },
    ...o,
  })
  it('chặng xong: tiêu đề, dòng phụ, dạng lên bậc, các dòng đếm, EXP, thanh 7 chặng', () => {
    const v = theChangView(ket(), 7)!
    expect(v.tieuDe).toBe('Xong chặng 3')
    expect(v.phu).toBe('Chặng 3/7 · đúng 6/8 câu')
    expect(v.coTienBo).toBe(true)
    expect(v.dangLenBac).toEqual([{ ten: 'Thuỷ phân ester', tu: 'Biết', den: 'Hiểu' }])
    expect(v.dong).toEqual([
      { kieu: 'lai', chu: 'Đúng lại 2 câu từng sai' },
      { kieu: 'moi', chu: 'Gặp 1 câu mới' },
      { kieu: 'dang', chu: 'Mở thêm 1 dạng mới' },
    ])
    expect(v.exp).toEqual({ homNay: 46, conLai: 30 })
    expect(v.tram).toEqual({ xong: 3, tong: 7 })
    expect(v.nop).toBeNull()
  })
  it('chặng CHƯA xong hẳn (còn câu trống) hoặc lỗi ⇒ null (chỉ làm mới phiếu)', () => {
    expect(theChangView(ket({ chang: { chiSo: 0, soCau: 3, soDung: 1, xong: false } }), 7)).toBeNull()
    expect(theChangView(ket({ chang: undefined }), 7)).toBeNull()
    expect(theChangView(ket({ ok: false }), 7)).toBeNull()
  })
  it('không có tiến triển: thẻ IM (không bịa), vẫn còn tiêu đề + đếm + EXP', () => {
    const v = theChangView(ket({ tienBo: { dangLenBac: [], soCauDungLai: 0, soCauMoiGap: 0, soDangMoi: 0, coTienBo: false } }), 7)!
    expect(v.coTienBo).toBe(false)
    expect(v.dangLenBac).toEqual([])
    expect(v.dong).toEqual([])
    expect(v.exp).not.toBeNull()
    expect(theChangView(ket({ tienBo: undefined }), 7)!.coTienBo).toBe(false)
  })
  it('dòng đếm bằng 0 KHÔNG hiện; bậc lạ bị bỏ', () => {
    const v = theChangView(ket({ tienBo: { dangLenBac: [{ ma: 'a', ten: 'A', tu: 0, den: 9 }], soCauDungLai: 0, soCauMoiGap: 3, soDangMoi: 0, coTienBo: true } }), 7)!
    expect(v.dong).toEqual([{ kieu: 'moi', chu: 'Gặp 3 câu mới' }])
    expect(v.dangLenBac).toEqual([])
  })
  it('EXP: 0 hôm nay ⇒ ẩn; em chưa có thú ⇒ conLai null', () => {
    expect(theChangView(ket({ exp: { homNay: 0, conLaiLenCap: 5 } }), 7)!.exp).toBeNull()
    expect(theChangView(ket({ exp: undefined }), 7)!.exp).toBeNull()
    expect(theChangView(ket({ exp: { homNay: 4, conLaiLenCap: null } }), 7)!.exp).toEqual({ homNay: 4, conLai: null })
  })
  it('thanh chặng theo loDaXong của máy chủ (không phải chiSo+1); thiếu loDaXong ⇒ lấy chiSo+1; không vượt tổng', () => {
    expect(theChangView(ket({ loDaXong: 5 }), 7)!.tram).toEqual({ xong: 5, tong: 7 })
    expect(theChangView(ket({ loDaXong: undefined }), 7)!.tram).toEqual({ xong: 3, tong: 7 })
    expect(theChangView(ket({ loDaXong: 99 }), 7)!.tram).toEqual({ xong: 7, tong: 7 })
  })
  it('chưa biết tổng số chặng ⇒ bỏ "/7" và thanh chặng, không bịa', () => {
    const v = theChangView(ket(), null)!
    expect(v.phu).toBe('Chặng 3 · đúng 6/8 câu')
    expect(v.tram).toBeNull()
  })
  it('chặng CUỐI: máy chủ tự chốt nộp ⇒ tiêu đề "Xong cả bài", đúng x/y (mẫu điểm) + ghi chú câu thưởng', () => {
    const v = theChangView(ket({ nop: { daNop: true, nopLuc: '', soDung: 40, soCau: 45, soCauCuaEm: 48, soCauThuongSai: 3, qidSai: [] } }), 7)!
    expect(v.tieuDe).toBe('Xong cả bài')
    expect(v.nop).toEqual({ chu: 'Em đã xong cả bài: đúng 40/45 câu', ghiThuong: '3 câu thưởng chưa đúng không bị tính vào điểm.' })
    const khong = theChangView(ket({ nop: { daNop: true, nopLuc: '', soDung: 40, soCau: 45, soCauCuaEm: 45, soCauThuongSai: 0, qidSai: [] } }), 7)!
    expect(khong.nop!.ghiThuong).toBeNull()
  })
  it('không xếp hạng, không chữ "nắm chắc"', () => {
    const v = JSON.stringify(theChangView(ket(), 7))
    expect(v).not.toMatch(/nắm chắc|xếp hạng|hạng \d|bạn khác/i)
  })
})

describe('doiLuotLam — thầy "Cho làm lại": bỏ làm dở của lượt cũ', () => {
  const dat = () => {
    localStorage.clear()
    localStorage.setItem('ddh.btvn.draft.B1.S1', '{"q1":"A"}')
    localStorage.setItem('ddh.lam.B1.abc123', '{"q1":"A"}')
    localStorage.setItem('ddh.lam.B1', '{"q1":"A"}')
    localStorage.setItem(khoaKetQuaChang('B1', 'S1', 0), '{"ketQua":[]}')
    localStorage.setItem(khoaKetQuaChang('B1', 'S1', 1), '{"ketQua":[]}')
    // KHÔNG được đụng: em khác cùng bài, bài khác, khoá lạ
    localStorage.setItem('ddh.btvn.draft.B1.S2', '{"q1":"B"}')
    localStorage.setItem(khoaKetQuaChang('B1', 'S2', 0), '{"ketQua":[]}')
    localStorage.setItem('ddh.btvn.draft.B2.S1', '{"q9":"C"}')
    localStorage.setItem('ddh.lam.B2.zzz', '{"q9":"C"}')
    localStorage.setItem('ddh.lam.B10.zzz', '{"q9":"C"}') // tiền tố gần giống B1 nhưng là bài KHÁC
    localStorage.setItem('khoa-la', 'x')
  }
  const con = () => Object.keys(localStorage).filter((k) => k !== khoaLuotLam('B1', 'S1')).sort()

  it('lần đầu thấy lượt 1: chỉ ghi nhớ, KHÔNG xoá (không phá bài đang làm)', () => {
    dat()
    expect(doiLuotLam('B1', 'S1', 1)).toBe(false)
    expect(localStorage.getItem(khoaLuotLam('B1', 'S1'))).toBe('1')
    expect(localStorage.getItem('ddh.btvn.draft.B1.S1')).not.toBeNull()
    expect(localStorage.getItem('ddh.lam.B1.abc123')).not.toBeNull()
  })

  it('cùng lượt: không làm gì', () => {
    dat()
    doiLuotLam('B1', 'S1', 1)
    expect(doiLuotLam('B1', 'S1', 1)).toBe(false)
    expect(localStorage.getItem('ddh.btvn.draft.B1.S1')).not.toBeNull()
  })

  it('lượt TĂNG: xoá nháp (host + phiếu) và kết quả MỌI chặng của em này, ghi nhớ lượt mới; KHÔNG đụng em khác / bài khác', () => {
    dat()
    doiLuotLam('B1', 'S1', 1)
    expect(doiLuotLam('B1', 'S1', 2)).toBe(true)
    expect(localStorage.getItem(khoaLuotLam('B1', 'S1'))).toBe('2')
    expect(con()).toEqual(['ddh.btvn.draft.B1.S2', 'ddh.btvn.draft.B2.S1', 'ddh.lam.B10.zzz', 'ddh.lam.B2.zzz', khoaKetQuaChang('B1', 'S2', 0), 'khoa-la'].sort())
  })

  it('máy chưa từng thấy bài mà máy chủ báo lượt ≥ 2 ⇒ xoá cho chắc; báo lượt 1 ⇒ không xoá', () => {
    dat()
    expect(doiLuotLam('B1', 'S1', 3)).toBe(true)
    expect(localStorage.getItem('ddh.btvn.draft.B1.S1')).toBeNull()
    dat()
    expect(doiLuotLam('B1', 'S1', 1)).toBe(false)
    expect(localStorage.getItem('ddh.btvn.draft.B1.S1')).not.toBeNull()
  })

  it('lượt GIẢM (thầy đặt lại bài từ đầu) cũng là lượt mới', () => {
    dat()
    localStorage.setItem(khoaLuotLam('B1', 'S1'), '3')
    expect(doiLuotLam('B1', 'S1', 1)).toBe(true)
    expect(localStorage.getItem('ddh.btvn.draft.B1.S1')).toBeNull()
    expect(localStorage.getItem(khoaLuotLam('B1', 'S1'))).toBe('1')
  })

  it('máy chủ cũ / trường hỏng ⇒ không làm gì, không ghi nhớ', () => {
    for (const v of [undefined, null, 'x', '2', 0, -1, 1.5, NaN]) {
      dat()
      expect(doiLuotLam('B1', 'S1', v)).toBe(false)
      expect(localStorage.getItem(khoaLuotLam('B1', 'S1'))).toBeNull()
      expect(localStorage.getItem('ddh.btvn.draft.B1.S1')).not.toBeNull()
    }
    expect(doiLuotLam('', 'S1', 2)).toBe(false)
  })

  it('máy chặn lưu ⇒ không ném lỗi', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('chặn')
    })
    expect(() => doiLuotLam('B1', 'S1', 2)).not.toThrow()
    spy.mockRestore()
  })
})

describe('chuMoLuc — chặng kế mở lúc nào (lịch theo giờ, bản 1.1)', () => {
  const bay = new Date(2026, 8, 21, 20, 30, 0) // 21/09 20:30
  const at = (ngay: number, g: number, p: number) => new Date(2026, 8, ngay, g, p).toISOString()
  it('mốc có giờ trong hôm nay: "lúc 21:20" + còn bao lâu', () => {
    expect(chuMoLuc(at(21, 21, 20), bay)).toEqual({ chu: 'lúc 21:20', conLai: 'còn 50 phút', daToi: false })
    expect(chuMoLuc(at(21, 23, 45), bay)).toEqual({ chu: 'lúc 23:45', conLai: null, daToi: false }) // còn 3 giờ 15 phút > 3 giờ
  })
  it('còn < 3 giờ mới có đếm ngược; xa hơn thì KHÔNG dọa em bằng đồng hồ', () => {
    expect(chuMoLuc(at(21, 22, 30), bay)!.conLai).toBe('còn 2 giờ')
    expect(chuMoLuc(at(21, 23, 20), bay)!.conLai).toBe('còn 2 giờ 50 phút')
    expect(chuMoLuc(at(21, 23, 59), bay)!.conLai).toBeNull()
    expect(chuMoLuc(at(21, 20, 31), bay)!.conLai).toBe('còn 1 phút')
  })
  it('làm tròn LÊN phút: còn 49 phút 30 giây ⇒ "còn 50 phút"; còn 20 giây ⇒ "còn 1 phút" (không bao giờ "còn 0 phút")', () => {
    const bayGiay = new Date(2026, 8, 21, 20, 30, 30)
    expect(chuMoLuc(at(21, 21, 20), bayGiay)!.conLai).toBe('còn 50 phút')
    expect(chuMoLuc(new Date(2026, 8, 21, 20, 30, 50).toISOString(), bayGiay)!.conLai).toBe('còn 1 phút')
  })
  it('sáng mai có giờ: "lúc 20:00 ngày mai"; mốc 00:00 nói theo NGÀY như cũ', () => {
    expect(chuMoLuc(at(22, 20, 0), bay)!.chu).toBe('lúc 20:00 ngày mai')
    expect(chuMoLuc(at(22, 0, 0), bay)!.chu).toBe('ngày mai')
    expect(chuMoLuc(at(24, 0, 0), bay)!.chu).toBe('ngày 24/09')
    expect(chuMoLuc(at(24, 21, 20), bay)!.chu).toBe('lúc 21:20 ngày 24/09')
  })
  it('mốc đã tới/qua ⇒ daToi (chặng phải mở được)', () => {
    expect(chuMoLuc(at(21, 20, 30), bay)).toEqual({ chu: 'ngay bây giờ', conLai: null, daToi: true })
    expect(chuMoLuc(at(21, 19, 0), bay)!.daToi).toBe(true)
  })
  it('hỏng ⇒ null', () => {
    expect(chuMoLuc('không phải ngày', bay)).toBeNull()
    expect(chuMoLuc('', bay)).toBeNull()
  })
  it('nhãn ngắn dưới chấm chặng', () => {
    expect(nhanMoLucNgan(at(21, 21, 20), bay)).toBe('21:20')
    expect(nhanMoLucNgan(at(21, 0, 0), bay)).toBe('Hôm nay')
    expect(nhanMoLucNgan(at(22, 20, 0), bay)).toBe('Mai')
    expect(nhanMoLucNgan(at(24, 0, 0), bay)).toBe('24/09')
    expect(nhanMoLucNgan('x', bay)).toBe('')
  })
})

describe('hanChu / dongPhuChang — hạn bằng ngày giờ thật (thầy 21/09)', () => {
  it('hanChu: "23:59 Thứ Năm 24/09"; hỏng ⇒ chuỗi rỗng', () => {
    expect(hanChu(new Date(2026, 8, 24, 23, 59).toISOString())).toBe('23:59 Thứ Năm 24/09')
    expect(hanChu(new Date(2026, 8, 21, 0, 5).toISOString())).toBe('00:05 Thứ Hai 21/09')
    expect(hanChu(new Date(2026, 8, 27, 20, 0).toISOString())).toBe('20:00 Chủ nhật 27/09')
    for (const x of ['', '  ', 'không phải ngày', null, undefined, 5, {}]) expect(hanChu(x)).toBe('')
  })
  it('dongPhuChang: hạn chặng ≠ hạn bài ⇒ hai dòng; bằng nhau ⇒ MỘT dòng "bằng hạn nộp cả bài"; chỉ có một hạn ⇒ một dòng, không bịa', () => {
    const c = new Date(2026, 8, 21, 23, 59).toISOString()
    const b = new Date(2026, 8, 24, 23, 59).toISOString()
    expect(dongPhuChang({ chiSo: 0, tongChang: 7, hanChang: c, hanBai: b })).toEqual(['Chặng 1 trong 7 chặng', 'Hạn chặng này: 23:59 Thứ Hai 21/09', 'Hạn nộp cả bài: 23:59 Thứ Năm 24/09'])
    expect(dongPhuChang({ chiSo: 0, tongChang: 7, hanChang: b, hanBai: b })).toEqual(['Chặng 1 trong 7 chặng', 'Hạn chặng này: 23:59 Thứ Năm 24/09 · bằng hạn nộp cả bài'])
    expect(dongPhuChang({ chiSo: 0, tongChang: 7, hanChang: c })).toEqual(['Chặng 1 trong 7 chặng', 'Hạn chặng này: 23:59 Thứ Hai 21/09'])
    expect(dongPhuChang({ chiSo: 0, tongChang: 7, hanBai: b })).toEqual(['Chặng 1 trong 7 chặng', 'Hạn chặng này: 23:59 Thứ Năm 24/09'])
    expect(dongPhuChang({ chiSo: 0, tongChang: 7 })).toEqual(['Chặng 1 trong 7 chặng'])
  })
  it('dongPhuChang: tổng số chặng không hợp lệ ⇒ chỉ "Chặng k"; tờ đề trống ⇒ không dòng tờ đề', () => {
    expect(dongPhuChang({ chiSo: 2, tongChang: NaN })).toEqual(['Chặng 3'])
    expect(dongPhuChang({ chiSo: 2, tongChang: 0 })).toEqual(['Chặng 3'])
    expect(dongPhuChang({ chiSo: 0, tongChang: 7, tenTo: '   ' })).toEqual(['Chặng 1 trong 7 chặng'])
    expect(dongPhuChang({ chiSo: 0, tongChang: 7, tenTo: 5 })).toEqual(['Chặng 1 trong 7 chặng'])
  })
})
