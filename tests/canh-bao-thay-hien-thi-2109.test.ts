// "CẢNH BÁO CỦA THẦY" — bộ đọc `canhBaoThay` + câu chữ (Code 3 chốt 21/09):
//   { id, maBtvn, tenBtvn, guiLuc, hanNop, loi, trangThaiEm:'chua_mo'|'do_chang'|'qua_han', chang?:{hienTai,tong}, daXem } — ≤ 3, mới nhất trước.
import { describe, expect, it } from 'vitest'
import {
  TEN_BAI_MAC_DINH,
  TOI_DA_CANH_BAO,
  chuConLai,
  chuGuiLuc,
  chuHanNop,
  daQuaHan,
  docCanhBaoThay,
  dongTinhTrang,
  tenBaiHienThi,
  tieuDeCanhBao,
  trongNhuMa,
  type CanhBaoThay,
} from '../src/lib/canh-bao-thay-hien-thi'

const HAN = '2026-09-24T16:59:00.000Z' // 23:59 Thứ Năm 24/09/2026 giờ Việt Nam
const NOW = Date.parse('2026-09-24T09:47:00.000Z') // 16:47 giờ VN, trước hạn
const tho = (o: object = {}) => ({ id: 'cb1', maBtvn: 'B1', tenBtvn: 'Ester và lipid', guiLuc: '2026-09-24T13:15:00.000Z', hanNop: HAN, loi: 'Em nhớ nộp bài nhé.', trangThaiEm: 'chua_mo', daXem: false, ...o })
const doc1 = (o: object = {}): CanhBaoThay => docCanhBaoThay([tho(o)])[0]!

describe('docCanhBaoThay', () => {
  it('đúng khuôn máy chủ ⇒ đủ trường, không mang trường thừa', () => {
    const r = docCanhBaoThay([{ ...tho({ chang: { hienTai: 2, tong: 7 }, trangThaiEm: 'do_chang' }), sbd: '12121212', token: 'x' }])
    expect(r).toEqual([{ id: 'cb1', maBtvn: 'B1', tenBtvn: 'Ester và lipid', guiLuc: '2026-09-24T13:15:00.000Z', hanNop: HAN, loi: 'Em nhớ nộp bài nhé.', trangThaiEm: 'do_chang', chang: { hienTai: 2, tong: 7 }, daXem: false }])
    expect(JSON.stringify(r)).not.toContain('12121212')
  })
  it('không phải mảng / vắng khoá ⇒ [] (thẻ không dựng)', () => {
    for (const x of [undefined, null, '', 5, {}, 'x', true]) expect(docCanhBaoThay(x)).toEqual([])
    expect(docCanhBaoThay([])).toEqual([])
  })
  it('dòng hỏng bị bỏ, dòng tốt giữ; thiếu id ⇒ bỏ; trùng id ⇒ giữ dòng đầu', () => {
    const r = docCanhBaoThay([null, 5, 'x', [], {}, { loi: 'không id' }, tho({ id: 'a' }), tho({ id: 'a', loi: 'trùng' }), tho({ id: 'b' })])
    expect(r.map((c) => c.id)).toEqual(['a', 'b'])
    expect(r[0]!.loi).toBe('Em nhớ nộp bài nhé.')
  })
  it('tối đa 3, giữ thứ tự (mới nhất trước)', () => {
    const r = docCanhBaoThay(['a', 'b', 'c', 'd', 'e'].map((id) => tho({ id })))
    expect(TOI_DA_CANH_BAO).toBe(3)
    expect(r.map((c) => c.id)).toEqual(['a', 'b', 'c'])
  })
  it('trạng thái lạ ⇒ rỗng (không đoán); chang sai (không nguyên dương / hiện tại > tổng) ⇒ null', () => {
    expect(doc1({ trangThaiEm: 'gian_lan' }).trangThaiEm).toBe('')
    expect(doc1({ trangThaiEm: 5 }).trangThaiEm).toBe('')
    for (const chang of [{ hienTai: 0, tong: 3 }, { hienTai: 4, tong: 3 }, { hienTai: 1.5, tong: 3 }, { hienTai: '2', tong: 7 }, {}, [], 5, null]) expect(doc1({ chang }).chang).toBeNull()
    expect(doc1({ chang: { hienTai: 3, tong: 3 } }).chang).toEqual({ hienTai: 3, tong: 3 })
  })
  it('daXem chỉ `true` thật mới là đã xem (chuỗi "true", 1 không tính)', () => {
    expect(doc1({ daXem: true }).daXem).toBe(true)
    for (const daXem of ['true', 1, 'yes', null, undefined]) expect(doc1({ daXem }).daXem).toBe(false)
  })
  it('lời làm sạch: bỏ ký tự điều khiển, cắt ≤ 400 (+…); lời vắng ⇒ rỗng nhưng dòng vẫn giữ', () => {
    const dai = 'Một câu dài. '.repeat(60)
    expect(doc1({ loi: dai }).loi.length).toBeLessThanOrEqual(401)
    expect(doc1({ loi: `Ok${String.fromCharCode(0)}.` }).loi).toBe('Ok.')
    expect(doc1({ loi: undefined }).loi).toBe('')
    expect(docCanhBaoThay([tho({ loi: '' })])).toHaveLength(1)
  })
  it('tên bài là MÃ tờ đề ⇒ bỏ tên (không lộ mã lên màn); tên thường giữ; xuống dòng trong tên ⇒ một dòng', () => {
    for (const ten of ['DH-12-C2-B6-TN', 'BTVN240921', 'B1234567']) expect(doc1({ tenBtvn: ten }).tenBtvn).toBe('')
    expect(doc1({ tenBtvn: 'Ester và lipid' }).tenBtvn).toBe('Ester và lipid')
    expect(doc1({ tenBtvn: 'Ester\nvà lipid' }).tenBtvn).toBe('Ester và lipid')
    expect(tenBaiHienThi(doc1({ tenBtvn: 'DH-12-C2-B6-TN' }))).toBe(TEN_BAI_MAC_DINH)
    expect(tenBaiHienThi(doc1())).toBe('Ester và lipid')
  })
  it('trongNhuMa: cần ≥ 6 ký tự, không khoảng trắng, có chữ số', () => {
    expect(trongNhuMa('DH-12-C2-B6-TN')).toBe(true)
    expect(trongNhuMa('Ester')).toBe(false)
    expect(trongNhuMa('ABCDEFGH')).toBe(false) // toàn chữ ⇒ là từ, không phải mã
    expect(trongNhuMa('B12')).toBe(false) // quá ngắn
    expect(trongNhuMa('Bài 12 hoá học')).toBe(false)
  })
})

describe('câu chữ nói đúng sự thật', () => {
  it('tiêu đề theo vai: em / con', () => {
    expect(tieuDeCanhBao(doc1(), 'hocsinh')).toBe('Thầy nhắc: em chưa nộp Ester và lipid')
    expect(tieuDeCanhBao(doc1({ tenBtvn: '' }), 'phuhuynh')).toBe('Thầy nhắc: con chưa nộp Bài tập về nhà')
  })
  it('tình trạng: chưa mở / dở chặng mấy trong mấy / dở không rõ chặng / quá hạn; không rõ ⇒ rỗng', () => {
    expect(dongTinhTrang(doc1(), NOW, 'hocsinh')).toBe('Em chưa mở bài.')
    expect(dongTinhTrang(doc1(), NOW, 'phuhuynh')).toBe('Con chưa mở bài.')
    expect(dongTinhTrang(doc1({ trangThaiEm: 'do_chang', chang: { hienTai: 2, tong: 7 } }), NOW, 'hocsinh')).toBe('Em đang dở chặng 2 trong 7 chặng.')
    expect(dongTinhTrang(doc1({ trangThaiEm: 'do_chang' }), NOW, 'phuhuynh')).toBe('Con đang làm dở bài này.')
    expect(dongTinhTrang(doc1({ trangThaiEm: 'qua_han' }), NOW, 'hocsinh')).toBe('Đã qua Hạn nộp.')
    expect(dongTinhTrang(doc1({ trangThaiEm: '' }), NOW, 'hocsinh')).toBe('')
  })
  it('quá hạn theo ĐỒNG HỒ máy cũng tính (mốc hạn đã trôi) dù máy chủ nói chưa mở; hạn sai ⇒ không quá hạn', () => {
    const sauHan = Date.parse(HAN) + 60_000
    expect(daQuaHan(doc1(), sauHan)).toBe(true)
    expect(dongTinhTrang(doc1(), sauHan, 'hocsinh')).toBe('Đã qua Hạn nộp.')
    expect(daQuaHan(doc1(), Date.parse(HAN))).toBe(false) // đúng mốc chưa quá
    expect(daQuaHan(doc1({ hanNop: 'hôm qua' }), sauHan)).toBe(false)
    expect(daQuaHan(doc1({ hanNop: '' }), sauHan)).toBe(false)
  })
  it('chuConLai: phút / giờ + phút / ngày + giờ; hết hạn ⇒ rỗng', () => {
    const h = 1_000_000_000_000
    expect(chuConLai(h + 40 * 60000, h)).toBe('còn 40 phút')
    expect(chuConLai(h + 60 * 60000, h)).toBe('còn 1 giờ')
    expect(chuConLai(h + (3 * 60 + 12) * 60000, h)).toBe('còn 3 giờ 12 phút')
    expect(chuConLai(h + (2 * 24 * 60 + 5 * 60) * 60000, h)).toBe('còn 2 ngày 5 giờ')
    expect(chuConLai(h + 3 * 24 * 3600000, h)).toBe('còn 3 ngày')
    expect(chuConLai(h + (23 * 60 + 30) * 60000, h)).toBe('còn 23 giờ 30 phút') // chưa tròn ngày
    expect(chuConLai(h + 24 * 3600000, h)).toBe('còn 1 ngày') // tròn ngày
    expect(chuConLai(h + 59 * 60000, h)).toBe('còn 59 phút')
    expect(chuConLai(h + 30_000, h)).toBe('') // chưa đủ 1 phút
    expect(chuConLai(h - 1, h)).toBe('')
    expect(chuConLai(NaN, h)).toBe('')
  })
  it('hạn nộp theo chuẩn A1-6 (24 giờ, giờ VN, kèm còn lại); mốc sai ⇒ rỗng, không bịa hạn', () => {
    const luc = Date.parse('2026-09-24T13:47:00.000Z') // 20:47 VN, còn 3 giờ 12 phút tới 23:59
    expect(chuHanNop(doc1(), luc)).toBe('Hạn nộp: 23:59 · Thứ Năm 24/09/2026 — còn 3 giờ 12 phút')
    expect(chuHanNop(doc1(), Date.parse(HAN) + 1)).toBe('Hạn nộp: 23:59 · Thứ Năm 24/09/2026') // quá hạn: chỉ mốc thật
    expect(chuHanNop(doc1({ hanNop: 'xxx' }), luc)).toBe('')
    expect(chuHanNop(doc1({ hanNop: '' }), luc)).toBe('')
  })
  it('giờ gửi: "Thầy gửi lúc 20:15 · Thứ Năm 24/09/2026"; sai ⇒ rỗng', () => {
    expect(chuGuiLuc(doc1())).toBe('Thầy gửi lúc 20:15 · Thứ Năm 24/09/2026')
    expect(chuGuiLuc(doc1({ guiLuc: 'x' }))).toBe('')
  })
  it('KHÔNG có chữ doạ / so sánh / nhãn năng lực trong mọi câu sinh ra', () => {
    const cb = doc1({ trangThaiEm: 'do_chang', chang: { hienTai: 1, tong: 3 } })
    const tat = [tieuDeCanhBao(cb, 'hocsinh'), tieuDeCanhBao(cb, 'phuhuynh'), dongTinhTrang(cb, NOW, 'hocsinh'), dongTinhTrang(cb, NOW, 'phuhuynh'), chuHanNop(cb, NOW), chuGuiLuc(cb)].join(' ')
    expect(tat).not.toMatch(/nắm chắc|yếu|kém|lười|so với|các bạn|bạn khác|khẩn|nguy|phạt|trừ điểm|cảnh cáo/i)
  })
})
