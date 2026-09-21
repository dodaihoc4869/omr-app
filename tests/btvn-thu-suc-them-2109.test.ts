// BTVN NÂNG ĐỠ · BẢN 1.2 — phần MÁY EM: nhóm "Thử sức thêm · không bắt buộc" SAU chặng cuối (mở cùng chặng cuối).
// Boss 21/09: câu ghi "Câu cao — làm đúng được cộng, bỏ qua không sao"; KHÔNG chặn nút xong chặng/xong bài; không tính vào "N câu của em"
// và thanh tiến độ; bảng nhiệm vụ + phụ huynh "N câu của em (+M câu thử sức thêm, không bắt buộc)". Máy chủ chưa trả khoá ⇒ như cũ.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dungPhieuBtvn } from '../src/lib/btvn-cho-em'
import {
  GHI_CHU_CAU_THU_SUC,
  LOI_DAN_THU_SUC,
  TIEU_DE_THU_SUC,
  chuSoCauCuaEm,
  docBaiCaNhan,
  docKetQuaChang,
  hienNhomThuSuc,
  tachThuSucThem,
  theChangView,
} from '../src/lib/btvn-ca-nhan-kieu'
import { soThuSucCua, tuKeHoachNgay, type KeHoachNgayMayChu } from '../src/lib/nhiem-vu-adapter'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'
import { boLoiGiai, dungPhieu, type ThongTinPhieu } from '../src/lib/html-phieu'
import { heroCaNhanHtml, type DauBaiCaNhanVao } from '../src/lib/html-phieu-ca-nhan'

const homNay = new Date()
const NGAY_MAI = new Date(homNay.getFullYear(), homNay.getMonth(), homNay.getDate() + 1, 0, 0).toISOString()
const HOM_QUA = new Date(homNay.getFullYear(), homNay.getMonth(), homNay.getDate() - 1, 0, 0).toISOString()
const HAN = new Date(homNay.getFullYear(), homNay.getMonth(), homNay.getDate() + 7, 20, 0).toISOString()

const cau = (so: number, phan: 'I' | 'II' | 'III') => ({
  qid: `M-${phan}-${so}`,
  phan,
  so,
  de: `Đề câu ${so}`,
  ...(phan === 'I' ? { pa: { A: 'a', B: 'b', C: 'c', D: 'd' } } : {}),
  ...(phan === 'II' ? { y: { a: 'ý a', b: 'ý b', c: 'ý c', d: 'ý d' } } : {}),
})
const C1 = cau(1, 'I')
const C2 = cau(2, 'II')
const C3 = cau(3, 'III') // chặng 0
const C4 = cau(4, 'I')
const C5 = cau(5, 'I') // chặng 1 (cuối)
const T6 = cau(6, 'III') // thử sức
const T7 = cau(7, 'I') // thử sức
const chang = (chiSo: number, soCau: number, daMo: boolean, daXong: boolean, moLuc = HOM_QUA) => ({ chiSo, soCau, moLuc, daMo, daXong })
const NHAN = { 'M-I-1': 'khoi_dong', 'M-II-2': 'loi', 'M-III-3': 'dang_yeu', 'M-I-4': 'loi', 'M-I-5': 'dang_yeu', 'M-III-6': 'loi_cao', 'M-I-7': 'loi_cao' }

/** Khoá `thuSucThem` theo khuôn Boss chốt: CHẶNG ẢO chiSo = soChang, câu đầy đủ (không đáp án) trong `cau[]`. */
const nhomTs = (o: Record<string, unknown> = {}) => ({ chiSo: 2, moLuc: HOM_QUA, cau: [T6, T7], daNop: false, ...o })

/** Bài 5 câu BẮT BUỘC (3 + 2) + 2 câu thử sức (chặng ảo). Mặc định: chặng 0 xong, chặng cuối (1) đang mở. */
const phanHoi = (o: Record<string, unknown> = {}) => ({
  ok: true,
  caNhan: true,
  maBtvn: 'B1',
  hanNop: HAN,
  soCau: 5,
  soCauCuaEm: 5,
  soThuSucThem: 2,
  thuSucThem: nhomTs(),
  soChang: 2,
  loDaXong: 1,
  changDangMo: 1,
  chang: [chang(0, 3, true, true), chang(1, 2, true, false)],
  nhan: NHAN,
  de: { ma_de: 'M', khongDapAn: true, cau: [C1, C2, C3, C4, C5] },
  ...o,
})
const than = (html: string) => html.slice(html.indexOf('<body'), html.indexOf('<script type="application/json" id="du-nop">'))
const duNop = (html: string) => JSON.parse(/<script type="application\/json" id="du-nop">([\s\S]*?)<\/script>/.exec(html)![1].replace(/\\u003c/g, '<'))
const the = (html: string, qid: string) => new RegExp(`<article[^>]*data-qid="${qid}"[\\s\\S]*?</article>`).exec(than(html))![0]
const dung = (r: Record<string, unknown>) => dungPhieuBtvn(r as never, 'Riêng', '12121212')

beforeEach(() => localStorage.clear())

describe('bộ đọc: khoá thuSucThem = chặng ảo {chiSo, moLuc, cau[], daNop}', () => {
  it('đọc đủ: chiSo, moLuc, daNop, mã + câu đầy đủ; soThuSucThem theo số gửi hoặc số mã (lấy số lớn)', () => {
    const b = docBaiCaNhan(phanHoi())!
    expect(b.thuSucThem).toMatchObject({ chiSo: 2, daNop: false, maCau: ['M-III-6', 'M-I-7'] })
    expect(b.thuSucThem!.cau).toHaveLength(2)
    expect(b.thuSucThem!.moLuc).toBe(HOM_QUA)
    expect(b.soThuSucThem).toBe(2)
    expect(docBaiCaNhan(phanHoi({ soThuSucThem: undefined }))!.soThuSucThem).toBe(2)
    expect(docBaiCaNhan(phanHoi({ soThuSucThem: 3 }))!.soThuSucThem).toBe(3)
    expect(docBaiCaNhan(phanHoi({ soThuSucThem: 1 }))!.soThuSucThem).toBe(2) // số gửi nhỏ hơn số mã ⇒ số lớn
    expect(docBaiCaNhan(phanHoi({ thuSucThem: nhomTs({ daNop: true }) }))!.thuSucThem!.daNop).toBe(true)
  })
  it('chiSo máy chủ gửi hợp lệ thì GIỮ đúng số đó (không tự đổi thành soChang)', () => {
    expect(docBaiCaNhan(phanHoi({ thuSucThem: nhomTs({ chiSo: 5 }) }))!.thuSucThem!.chiSo).toBe(5)
    expect(docBaiCaNhan(phanHoi({ thuSucThem: nhomTs({ chiSo: 0 }) }))!.thuSucThem!.chiSo).toBe(0)
  })
  it('chiSo thiếu/sai ⇒ lấy soChang; daNop chỉ `true` thật', () => {
    expect(docBaiCaNhan(phanHoi({ thuSucThem: nhomTs({ chiSo: undefined }) }))!.thuSucThem!.chiSo).toBe(2)
    expect(docBaiCaNhan(phanHoi({ thuSucThem: nhomTs({ chiSo: -1 }) }))!.thuSucThem!.chiSo).toBe(2)
    expect(docBaiCaNhan(phanHoi({ thuSucThem: nhomTs({ chiSo: 1.5 }) }))!.thuSucThem!.chiSo).toBe(2)
    for (const daNop of ['true', 1, 'yes', null]) expect(docBaiCaNhan(phanHoi({ thuSucThem: nhomTs({ daNop }) }))!.thuSucThem!.daNop).toBe(false)
  })
  it('cau[] lẫn: mục là chuỗi = chỉ mã; bỏ trùng, bỏ rỗng/rác', () => {
    const b = docBaiCaNhan(phanHoi({ thuSucThem: nhomTs({ cau: ['M-I-7', T6, T6, null, 5, '', '  ', {}, 'M-I-7'] }) }))!
    expect(b.thuSucThem!.maCau).toEqual(['M-I-7', 'M-III-6'])
    expect(b.thuSucThem!.cau.map((c) => c.qid)).toEqual(['M-III-6']) // chỉ câu đầy đủ mới vào `cau`
  })
  it('vắng / kiểu sai (mảng cũ, chuỗi, số) ⇒ null và 0 (bài như cũ)', () => {
    for (const thuSucThem of [undefined, null, 'x', 5, [], ['M-I-7'], true]) {
      const b = docBaiCaNhan(phanHoi({ thuSucThem, soThuSucThem: undefined }))!
      expect(b.thuSucThem).toBeNull()
      expect(b.soThuSucThem).toBe(0)
    }
    expect(docBaiCaNhan(phanHoi({ soThuSucThem: -1, thuSucThem: undefined }))!.soThuSucThem).toBe(0)
    expect(docBaiCaNhan(phanHoi({ soThuSucThem: 1.5, thuSucThem: undefined }))!.soThuSucThem).toBe(0)
    expect(docBaiCaNhan(phanHoi({ soThuSucThem: 3, thuSucThem: undefined }))!.soThuSucThem).toBe(3) // nói trước số khi nhóm chưa gửi
  })
  it('tachThuSucThem: câu thử sức lấy từ thuSucThem.cau HOẶC de.cau (theo mã), đúng thứ tự mã của nhóm; bắt buộc giữ thứ tự, không lẫn', () => {
    const b = docBaiCaNhan(phanHoi())!
    const t = tachThuSucThem(b, [C1, C2, C3, C4, C5])
    expect(t.batBuoc.map((c) => c.qid)).toEqual(['M-I-1', 'M-II-2', 'M-III-3', 'M-I-4', 'M-I-5'])
    expect(t.thuSuc.map((c) => c.qid)).toEqual(['M-III-6', 'M-I-7'])
    // câu thử sức nằm lẫn trong de.cau (chỉ có mã trong nhóm): rút ra khỏi bắt buộc, vào thử sức
    const b2 = docBaiCaNhan(phanHoi({ thuSucThem: nhomTs({ cau: ['M-I-7', 'M-III-6'] }) }))!
    const t2 = tachThuSucThem(b2, [C1, C2, C3, C4, C5, T6, T7])
    expect(t2.batBuoc.map((c) => c.qid)).toEqual(['M-I-1', 'M-II-2', 'M-III-3', 'M-I-4', 'M-I-5'])
    expect(t2.thuSuc.map((c) => c.qid)).toEqual(['M-I-7', 'M-III-6'])
    // mã có mà không tìm thấy câu ở đâu ⇒ bỏ (không bịa)
    const t3 = tachThuSucThem(docBaiCaNhan(phanHoi({ thuSucThem: nhomTs({ cau: ['M-I-7', 'M-X-9'] }) }))!, [C1])
    expect(t3.thuSuc).toEqual([])
    // không có nhóm ⇒ nguyên vẹn
    const t4 = tachThuSucThem({ thuSucThem: null }, [C1, T6])
    expect(t4.batBuoc).toHaveLength(2)
    expect(t4.thuSuc).toEqual([])
    expect(tachThuSucThem(docBaiCaNhan(phanHoi({ thuSucThem: nhomTs({ cau: [] }) }))!, [C1]).batBuoc).toHaveLength(1)
  })
  it('hienNhomThuSuc: CHỈ ở chặng cuối đã mở (kể cả khi phần bắt buộc đã xong); chặng cuối chưa mở / chặng khác / không nhóm ⇒ không', () => {
    const b = docBaiCaNhan(phanHoi())!
    expect(hienNhomThuSuc(b, 1)).toBe(true)
    expect(hienNhomThuSuc(b, 0)).toBe(false)
    const xongHet = docBaiCaNhan(phanHoi({ loDaXong: 2, changDangMo: null, chang: [chang(0, 3, true, true), chang(1, 2, true, true)] }))!
    expect(hienNhomThuSuc(xongHet, 1)).toBe(true) // bài đã xong phần bắt buộc vẫn mở lại nhóm này
    const chuaMo = docBaiCaNhan(phanHoi({ chang: [chang(0, 3, true, true), chang(1, 2, false, false, NGAY_MAI)] }))!
    expect(chuaMo.thuSucThem).not.toBeNull()
    expect(hienNhomThuSuc(chuaMo, 1)).toBe(false)
    expect(hienNhomThuSuc(docBaiCaNhan(phanHoi({ thuSucThem: undefined }))!, 1)).toBe(false)
    expect(hienNhomThuSuc(docBaiCaNhan(phanHoi({ thuSucThem: nhomTs({ cau: [] }) }))!, 1)).toBe(false)
  })
  it('chữ: "N câu của em (+M câu thử sức thêm, không bắt buộc)"; M = 0 ⇒ như cũ', () => {
    expect(chuSoCauCuaEm(12, 3)).toBe('12 câu của em (+3 câu thử sức thêm, không bắt buộc)')
    expect(chuSoCauCuaEm(12, 0)).toBe('12 câu của em')
    expect(chuSoCauCuaEm(12, -1)).toBe('12 câu của em')
    expect(TIEU_DE_THU_SUC).toBe('Thử sức thêm · không bắt buộc')
    expect(GHI_CHU_CAU_THU_SUC).toBe('Câu cao — làm đúng được cộng, bỏ qua không sao')
    expect(LOI_DAN_THU_SUC).toMatch(/Không bắt buộc/)
  })
  it('thẻ cuối chặng của CHẶNG ẢO: "Xong phần thử sức thêm", không tính vào "chặng k/K", không thanh trạm', () => {
    const ket = { ok: true, chang: { chiSo: 2, soCau: 2, soDung: 1, xong: true }, ketQua: [], loDaXong: 2, tienBo: null, exp: null } as never
    const v = theChangView(ket, 2)!
    expect(v.tieuDe).toBe('Đã nộp phần thử sức thêm')
    expect(v.phu).toBe('Thử sức thêm · đúng 1/2 câu đã làm')
    expect(v.tram).toBeNull()
    expect(v.nop).toBeNull()
    const thuong = theChangView({ ok: true, chang: { chiSo: 0, soCau: 3, soDung: 2, xong: true }, ketQua: [], loDaXong: 1, tienBo: null, exp: null } as never, 2)!
    expect(thuong.tieuDe).toBe('Xong chặng 1')
    expect(thuong.tram).toEqual({ xong: 1, tong: 2 })
  })
})

describe('kết quả nộp phần thử sức: /btvn/xong-lo với chiSo = soChang (khuôn máy chủ 5b37676)', () => {
  const kq = (o: Record<string, unknown> = {}) => ({
    ok: true, loDaXong: 2, changDangMo: null,
    chang: { chiSo: 2, soCau: 2, soDung: 1, xong: true },
    ketQua: [{ qid: 'M-III-6', dung: true, dapAnDung: '5', loiGiai: { chot: 'ok' }, anhLoiGiai: [] }, { qid: 'M-I-7', dung: false, dapAnDung: 'B', loiGiai: null, anhLoiGiai: [] }],
    chuaLam: [],
    thuSucThem: { chiSo: 2, soCau: 2, soDaLam: 2, soDung: 1, daNop: true },
    exp: { homNay: 6, conLaiLenCap: 40 },
    ...o,
  })
  it('đọc thuSucThem {chiSo, soCau, soDaLam, soDung, daNop} và baiDaNop {soDung, soCau}; vắng ⇒ không có', () => {
    const r = docKetQuaChang(kq({ baiDaNop: { soDung: 9, soCau: 10 } }))!
    expect(r.thuSucThem).toEqual({ chiSo: 2, soCau: 2, soDaLam: 2, soDung: 1, daNop: true })
    expect(r.baiDaNop).toEqual({ soDung: 9, soCau: 10 })
    const khong = docKetQuaChang(kq({ thuSucThem: undefined }))!
    expect(khong.thuSucThem).toBeUndefined()
    expect(khong.baiDaNop).toBeUndefined()
    for (const baiDaNop of ['x', { soDung: 'a', soCau: 3 }, { soDung: 1 }, null]) expect(docKetQuaChang(kq({ baiDaNop }))!.baiDaNop).toBeUndefined()
    expect(docKetQuaChang(kq({ thuSucThem: { chiSo: 2 } }))!.thuSucThem).toBeUndefined() // thiếu soCau ⇒ bỏ
    expect(docKetQuaChang(kq({ thuSucThem: { chiSo: 2, soCau: 2 } }))!.thuSucThem).toEqual({ chiSo: 2, soCau: 2, soDaLam: 0, soDung: 0, daNop: false })
  })
  it('thẻ sau khi nộp: "Đã nộp phần thử sức thêm · đúng x/y câu đã làm"; bài đã nộp ⇒ dòng "Điểm bài đã cộng phần thử sức"; KHÔNG dòng "Xong cả bài" cũ', () => {
    const v = theChangView(docKetQuaChang(kq({ baiDaNop: { soDung: 9, soCau: 10 } }))!, 2)!
    expect(v.tieuDe).toBe('Đã nộp phần thử sức thêm')
    expect(v.phu).toBe('Thử sức thêm · đúng 1/2 câu đã làm')
    expect(v.nop).toEqual({ chu: 'Điểm bài đã cộng phần thử sức: đúng 9/10 câu', ghiThuong: null })
    expect(v.tram).toBeNull()
  })
  it('nộp MỘT PHẦN (bỏ trống câu, chang.xong=false) vẫn hiện thẻ vì có câu đã làm; chưa làm câu nào ⇒ không thẻ', () => {
    const mot = kq({ chang: { chiSo: 2, soCau: 2, soDung: 1, xong: false }, chuaLam: ['M-I-7'], thuSucThem: { chiSo: 2, soCau: 2, soDaLam: 1, soDung: 1, daNop: false } })
    const v = theChangView(docKetQuaChang(mot)!, 2)!
    expect(v).not.toBeNull()
    expect(v.phu).toBe('Thử sức thêm · đúng 1/1 câu đã làm') // y = số câu ĐÃ LÀM (câu bỏ trống không tính gì)
    const khongLam = kq({ chang: { chiSo: 2, soCau: 2, soDung: 0, xong: false }, ketQua: [], thuSucThem: { chiSo: 2, soCau: 2, soDaLam: 0, soDung: 0, daNop: false } })
    expect(theChangView(docKetQuaChang(khongLam)!, 2)).toBeNull()
  })
  it('nhận ra chặng ảo cả khi host chưa biết soChang (nhờ thuSucThem.chiSo trùng chang.chiSo)', () => {
    const v = theChangView(docKetQuaChang(kq())!)!
    expect(v.tieuDe).toBe('Đã nộp phần thử sức thêm')
  })
  it('chặng THƯỜNG chưa xong hẳn vẫn ⇒ không thẻ (như cũ); chặng thường xong ⇒ thẻ "Xong chặng k"', () => {
    const thuong = { ok: true, chang: { chiSo: 0, soCau: 3, soDung: 2, xong: false }, ketQua: [], chuaLam: ['a'], loDaXong: 0, changDangMo: 0 }
    expect(theChangView(docKetQuaChang(thuong)!, 2)).toBeNull()
    expect(theChangView(docKetQuaChang({ ...thuong, chang: { chiSo: 0, soCau: 3, soDung: 2, xong: true } })!, 2)!.tieuDe).toBe('Xong chặng 1')
  })
})

describe('phiếu dựng từ /btvn/cua-em: nhóm Thử sức thêm (chặng ảo, nộp riêng)', () => {
  it('chặng cuối đang mở: nhóm SAU câu bắt buộc, tiêu đề + lời dẫn; câu thử sức có nhãn + dải ghi; câu bắt buộc KHÔNG có; MỘT tiêu đề nhóm', async () => {
    const html = await dung(phanHoi())
    const t = than(html)
    expect(t).toContain('gcn-nhom-ts')
    expect(t).toContain('Thử sức thêm · không bắt buộc')
    expect(t.indexOf('gcn-nhom-ts')).toBeGreaterThan(t.indexOf('data-qid="M-I-5"'))
    expect(t.indexOf('gcn-nhom-ts')).toBeLessThan(t.indexOf('data-qid="M-III-6"'))
    for (const q of ['M-III-6', 'M-I-7']) {
      const c = the(html, q)
      expect(c).toContain('q-card-thu-suc')
      expect(c).toContain('data-nhan="thu_suc_them"')
      expect(c).toContain('Câu cao — làm đúng được cộng, bỏ qua không sao')
    }
    for (const q of ['M-I-4', 'M-I-5']) {
      expect(the(html, q)).not.toContain('q-card-thu-suc')
      expect(the(html, q)).not.toContain('Câu cao — làm đúng')
    }
    expect(t.match(/class="gcn-nhom-ts"/g)).toHaveLength(1)
    expect(t).toContain('nộp riêng bằng nút ở cuối nhóm')
  })
  it('có NÚT RIÊNG "Nộp phần thử sức thêm" đứng SAU câu thử sức cuối; nút "Nộp chặng" của phần bắt buộc vẫn còn', async () => {
    const t = than(await dung(phanHoi()))
    expect(t).toContain('id="nut-nop-ts">Nộp phần thử sức thêm</button>')
    expect(t.indexOf('id="nut-nop-ts"')).toBeGreaterThan(t.indexOf('data-qid="M-I-7"'))
    expect(t.match(/id="nut-nop-ts"/g)).toHaveLength(1)
    expect(t).toContain('id="nut-nop">Nộp chặng</button>')
  })
  it('máy chủ nói ĐÃ NỘP phần thử sức ⇒ nút riêng khoá "Đã nộp phần thử sức thêm"', async () => {
    const t = than(await dung(phanHoi({ thuSucThem: nhomTs({ daNop: true }) })))
    expect(t).toContain('id="nut-nop-ts" disabled>Đã nộp phần thử sức thêm</button>')
  })
  it('du-nop: chỉ id + phan (+ ts cho câu thử sức); caNhan mang chiSoThuSuc = chỉ số chặng ảo (soChang); KHÔNG lộ đáp án', async () => {
    const html = await dung(phanHoi())
    const ds = duNop(html).cau as { id: string; ts?: number }[]
    expect(ds.map((c) => c.id)).toEqual(['M-I-4', 'M-I-5', 'M-I-7', 'M-III-6']) // xếp theo phần I→III trong từng nhóm
    expect(ds.filter((c) => c.ts === 1).map((c) => c.id).sort()).toEqual(['M-I-7', 'M-III-6'])
    for (const c of ds) expect(Object.keys(c).sort()).toEqual(c.ts ? ['id', 'phan', 'ts'] : ['id', 'phan'])
    expect(duNop(html).caNhan).toEqual({ chiSo: 1, daCham: {}, chiSoThuSuc: 2 })
    expect(than(html)).not.toContain('data-dung')
  })
  it('nhóm thử sức luôn ở CUỐI: câu bắt buộc phần III của chặng cuối vẫn đứng TRƯỚC câu thử sức phần I', async () => {
    const C6 = cau(8, 'III') // bắt buộc, phần III
    const html = await dung(phanHoi({ chang: [chang(0, 3, true, true), chang(1, 3, true, false)], soCau: 6, soCauCuaEm: 6, de: { ma_de: 'M', cau: [C1, C2, C3, C4, C5, C6] } }))
    const ds = (duNop(html).cau as { id: string }[]).map((c) => c.id)
    expect(ds).toEqual(['M-I-4', 'M-I-5', 'M-III-8', 'M-I-7', 'M-III-6'])
    expect(than(html).indexOf('gcn-nhom-ts"')).toBeGreaterThan(than(html).indexOf('data-qid="M-III-8"'))
  })
  it('thanh trên + đáy đếm CHỈ câu bắt buộc của chặng: 2, không phải 4', async () => {
    const html = await dung(phanHoi())
    expect(html).toContain('<span id="nop-tong">2</span>')
    expect(html).toContain('<span id="gd-tong">2</span>')
    expect(than(html)).toContain('Chặng 2/2 · Đã làm')
  })
  it('hero: "5 câu" giữ nguyên + dòng "(+2 câu thử sức thêm, không bắt buộc)"', async () => {
    const t = than(await dung(phanHoi()))
    expect(t).toContain('<b>5</b> câu')
    expect(t).toContain('(+2 câu thử sức thêm, không bắt buộc)')
  })
  it('chặng cuối CHƯA mở: nhóm/câu/nút thử sức KHÔNG hiện dù máy chủ có gửi; hero vẫn nói trước "+2"', async () => {
    const html = await dung(phanHoi({ loDaXong: 0, changDangMo: 0, chang: [chang(0, 3, true, false), chang(1, 2, false, false, NGAY_MAI)], de: { ma_de: 'M', cau: [C1, C2, C3] } }))
    const t = than(html)
    for (const dau of ['gcn-nhom-ts"', 'q-card-thu-suc', 'nut-nop-ts', 'Đề câu 6', 'Đề câu 7']) expect(t, dau).not.toContain(dau)
    expect(t).toContain('(+2 câu thử sức thêm, không bắt buộc)')
    expect(duNop(html).caNhan.chiSoThuSuc).toBeUndefined()
  })
  it('thuSucThem.cau chỉ có mã, câu nằm trong de.cau ⇒ cùng nhóm', async () => {
    const html = await dung(phanHoi({ thuSucThem: nhomTs({ cau: ['M-III-6', 'M-I-7'] }), de: { ma_de: 'M', cau: [C1, C2, C3, C4, C5, T6, T7] } }))
    expect(than(html)).toContain('gcn-nhom-ts')
    expect((duNop(html).cau as { ts?: number }[]).filter((c) => c.ts === 1)).toHaveLength(2)
    expect(than(html)).toContain('Đề câu 6')
  })
  it('KHÔNG có thuSucThem (máy chủ chưa 1.2): không một dấu vết — không nhóm, không lớp, không chip, không nút, không dòng hero, du-nop không có ts/chiSoThuSuc', async () => {
    const html = await dung(phanHoi({ thuSucThem: undefined, soThuSucThem: undefined }))
    const t = than(html)
    for (const dau of ['gcn-nhom-ts"', 'q-card-thu-suc"', 'thu_suc_them', 'thử sức thêm', 'Thử sức thêm', 'nut-nop-ts']) expect(t, dau).not.toContain(dau)
    expect(JSON.stringify(duNop(html))).not.toMatch(/"ts"|chiSoThuSuc/)
    expect(t).not.toContain('gcn-hero-ts">')
  })
  it('mọi câu bắt buộc đã chấm ⇒ "Đã xong chặng" (khoá) NHƯNG nút thử sức vẫn mở (chưa nộp): làm rồi nộp riêng tới hạn', async () => {
    const { luuKetQuaChang } = await import('../src/lib/btvn-ca-nhan-em')
    const kq = (qid: string) => ({ qid, dung: true, dapAnDung: 'A', loiGiai: { chot: 'ok' }, anhLoiGiai: [] })
    luuKetQuaChang('B1', '12121212', 1, [kq('M-I-4'), kq('M-I-5')] as never, { 'M-I-4': 'A', 'M-I-5': 'A' })
    const t = than(await dung(phanHoi()))
    expect(t).toContain('id="nut-nop" disabled')
    expect(t).toContain('Đã xong chặng')
    expect(t).toContain('id="nut-nop-ts">Nộp phần thử sức thêm</button>')
  })
  it('bài ĐÃ xong mọi chặng bắt buộc (changDangMo = null) vẫn mở lại nhóm thử sức + lời dặn "nộp riêng ở cuối phiếu"', async () => {
    const html = await dung(phanHoi({ loDaXong: 2, changDangMo: null, chang: [chang(0, 3, true, true), chang(1, 2, true, true)] }))
    const t = than(html)
    expect(t).toContain('gcn-nhom-ts')
    expect(t).toContain('id="nut-nop-ts">')
    expect(t).toContain('Phần thử sức thêm không bắt buộc — làm rồi nộp riêng ở cuối phiếu.')
  })
  it('kết quả phần thử sức đã lưu (chặng ảo) ⇒ câu thử sức hiện đã chấm, khoá; lời dặn "nộp riêng" không còn khi đã nộp', async () => {
    const { luuKetQuaChang } = await import('../src/lib/btvn-ca-nhan-em')
    luuKetQuaChang('B1', '12121212', 2, [{ qid: 'M-I-7', dung: true, dapAnDung: 'B', loiGiai: { chot: 'Vì sao đúng' }, anhLoiGiai: [] }] as never, { 'M-I-7': 'B' })
    const html = await dung(phanHoi({ loDaXong: 2, changDangMo: null, chang: [chang(0, 3, true, true), chang(1, 2, true, true)], thuSucThem: nhomTs({ daNop: true }) }))
    const c = the(html, 'M-I-7')
    expect(c).toContain('da-cham')
    expect(c).toContain('cau-dung')
    expect(the(html, 'M-III-6')).not.toContain('da-cham')
    expect(than(html)).not.toContain('làm rồi nộp riêng ở cuối phiếu')
    expect(duNop(html).caNhan.daCham).toEqual({ 'M-I-7': { dung: true, chon: 'B' } })
  })
})

// ─────────────────── CHẠY THẬT TRONG JSDOM: đếm, nộp chặng, nộp RIÊNG phần thử sức ───────────────────
const C = (o: Partial<CauLuyen>): CauLuyen =>
  ({ phan: 'I', id: 'x', maDe: 'X', chuyenDe: 'Ester – lipid', dang: 'chua_ro', sao: 0, mucDo: 'hieu', text: 'Đề', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', chot: 'c', lyDo: null, buoc: ['Bước'], ...o }) as CauLuyen
const chua = (o: Partial<CauLuyen>, thuSuc = false): CauLuyen => ({ ...boLoiGiai(C(o)), caNhan: { nhan: thuSuc ? 'loi_cao' : 'loi', chuaCoDapAn: true, ...(thuSuc ? { thuSuc: true as const } : {}) } })
const CAU_JS: CauLuyen[] = [chua({ id: 'b1', text: 'Bắt buộc 1' }), chua({ id: 'b2', text: 'Bắt buộc 2' }), chua({ id: 't1', text: 'Thử sức 1' }, true), chua({ id: 't2', text: 'Thử sức 2' }, true)]
const TT: ThongTinPhieu = { hoTen: '', sbd: '12121212', ngay: new Date(2026, 8, 21), tenChuyenDe: 'Bài tập về nhà', ketQua: '', hienDapAn: false, nhanBia: 'BÀI TẬP VỀ NHÀ', oBia: [{ nhan: 'Số báo danh', gia: '12121212' }, { nhan: 'Ca', gia: 'M' }, { nhan: 'Hạn nộp', gia: '—' }] }
const DAU: DauBaiCaNhanVao = { tong: 2, soChang: 1, phutMoiNgay: 10, han: '28/09', chang: [{ chiSo: 0, daXong: false }], chiSoHienThi: 0, nhanChang: { 0: 'Hôm nay' }, soThuSuc: 2 }
const phieuJs = () =>
  dungPhieu(TT, CAU_JS, {
    nop: { ma: 'BTVN-abc', sbd: '12121212', url: 'https://may-chu.thu/goi' },
    caNhan: { chiSo: 0, daCham: {}, dauBai: DAU, ghiCho: '', tienTo: 'Chặng 1/1 · ', nutNop: 'Nộp chặng', nutTat: false, thuSuc: { chiSo: 1, nut: 'Nộp phần thử sức thêm', tat: false } },
  })

let boNghe: Array<[string, EventListenerOrEventListenerObject, unknown]> = []
function moPhieu(html: string) {
  for (const [ten, ham, ch] of boNghe) document.removeEventListener(ten, ham, ch as boolean)
  boNghe = []
  for (const k of Object.keys(localStorage)) if (k.indexOf('ddh.lam.') === 0) localStorage.removeItem(k)
  const themGoc = document.addEventListener.bind(document)
  document.addEventListener = ((ten: string, ham: EventListenerOrEventListenerObject, ch?: unknown) => {
    boNghe.push([ten, ham, ch])
    themGoc(ten as keyof DocumentEventMap, ham as EventListener, ch as boolean)
  }) as typeof document.addEventListener
  const thanH = html.slice(html.indexOf('<body'), html.lastIndexOf('</body>'))
  document.documentElement.innerHTML = thanH.replace(/<\/?body[^>]*>/g, '')
  document.body.className = /<body class="([^"]*)"/.exec(html)?.[1] ?? ''
  new Function([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n'))()
}
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!
const chonI = (qid: string, k: number) => document.querySelectorAll<HTMLElement>(`.q-card[data-qid="${qid}"] .q-opt.lam-o`)[k].click()
const cho = () => new Promise((r) => setTimeout(r, 0))

describe('trong trình duyệt giả: thử sức không tính vào tiến độ, không dính gói nộp chặng, NỘP RIÊNG', () => {
  let guiHost: ReturnType<typeof vi.fn>
  const nopChang = () => guiHost.mock.calls.filter((c) => c[0]?.type === 'ddh-btvn-nop-chang')
  const traLoiHost = (d: Record<string, unknown>) => window.dispatchEvent(new MessageEvent('message', { data: d, source: window.parent as never }))
  beforeEach(() => {
    guiHost = vi.fn()
    Object.defineProperty(window, 'parent', { value: { postMessage: guiHost }, configurable: true })
    window.confirm = vi.fn(() => true) as unknown as typeof window.confirm
    globalThis.fetch = vi.fn() as unknown as typeof fetch
    localStorage.clear()
  })

  it('tổng = 2 (chỉ bắt buộc); làm câu thử sức KHÔNG tăng "Đã làm"; làm câu bắt buộc mới tăng', () => {
    moPhieu(phieuJs())
    expect($('#nop-tong').textContent).toBe('2')
    expect($('#nop-dem').textContent).toBe('0')
    chonI('t1', 0)
    expect($('#nop-dem').textContent).toBe('0')
    chonI('b1', 1)
    expect($('#nop-dem').textContent).toBe('1')
  })
  it('NỘP CHẶNG: gói CHỈ có câu bắt buộc, dù em đã làm cả câu thử sức (thử sức nộp riêng)', async () => {
    moPhieu(phieuJs())
    chonI('b1', 0)
    chonI('b2', 1)
    chonI('t2', 2)
    $('#nut-nop').click()
    await cho()
    expect(nopChang()).toHaveLength(1)
    expect(nopChang()[0][0]).toEqual({ type: 'ddh-btvn-nop-chang', ma: 'BTVN-abc', sbd: '12121212', chiSo: 0, dapAn: { b1: 'A', b2: 'B' } })
    expect($('#nop-loi').hidden).toBe(true)
  })
  it('bỏ trống thử sức ⇒ nộp chặng NGAY một lần, không hỏi "còn N câu chưa làm"; còn câu BẮT BUỘC trống vẫn hỏi (không đếm thử sức)', async () => {
    moPhieu(phieuJs())
    chonI('b1', 0)
    $('#nut-nop').click()
    await cho()
    expect(nopChang()).toHaveLength(0)
    expect($('#nop-loi').textContent).toContain('Còn 1 câu chưa làm')
    chonI('b2', 1)
    $('#nut-nop').click()
    await cho()
    expect(nopChang()).toHaveLength(1)
  })
  it('chỉ làm câu thử sức, chưa làm câu bắt buộc nào ⇒ nút "Nộp chặng" báo "chưa làm câu nào trong chặng", không gửi', async () => {
    moPhieu(phieuJs())
    chonI('t1', 0)
    $('#nut-nop').click()
    await cho()
    expect(nopChang()).toHaveLength(0)
    expect($('#nop-loi').textContent).toContain('chưa làm câu nào trong chặng')
  })
  it('NÚT RIÊNG: gửi chiSo = chặng ẢO (1) với CHỈ đáp án thử sức đã làm; không đụng câu bắt buộc; không hỏi xác nhận', async () => {
    moPhieu(phieuJs())
    chonI('b1', 0) // câu bắt buộc đã làm dở — KHÔNG đi cùng gói thử sức
    chonI('t1', 2)
    $('#nut-nop-ts').click()
    await cho()
    expect(nopChang()).toHaveLength(1)
    expect(nopChang()[0][0]).toEqual({ type: 'ddh-btvn-nop-chang', ma: 'BTVN-abc', sbd: '12121212', chiSo: 1, dapAn: { t1: 'C' } })
    expect($('#nut-nop-ts').textContent).toBe('Đang nộp…')
    expect(($('#nut-nop-ts') as HTMLButtonElement).disabled).toBe(true)
    expect(window.confirm).not.toHaveBeenCalled()
    expect($('#nut-nop').textContent).toBe('Nộp chặng') // nút chặng không bị đụng
    expect(($('#nut-nop') as HTMLButtonElement).disabled).toBe(false)
  })
  it('NÚT RIÊNG không gửi lại câu thử sức ĐÃ CHẤM (đã khoá), chỉ câu mới làm', async () => {
    const html = dungPhieu(TT, CAU_JS.map((c) => (c.id === 't1' ? { ...c, caNhan: { ...c.caNhan, daCham: { dung: true, chon: 'B' } } } : c)), {
      nop: { ma: 'BTVN-abc', sbd: '12121212', url: 'https://may-chu.thu/goi' },
      caNhan: { chiSo: 0, daCham: { t1: { dung: true, chon: 'B' } }, dauBai: DAU, ghiCho: '', tienTo: 'Chặng 1/1 · ', nutNop: 'Nộp chặng', nutTat: false, thuSuc: { chiSo: 1, nut: 'Nộp phần thử sức thêm', tat: false } },
    })
    moPhieu(html)
    chonI('t2', 2)
    $('#nut-nop-ts').click()
    await cho()
    expect(nopChang()[0][0].dapAn).toEqual({ t2: 'C' })
  })
  it('phiếu thiếu chiSoThuSuc trong dữ liệu (không thể có chặng ảo để nộp) ⇒ bấm nút riêng KHÔNG gửi gì', async () => {
    moPhieu(phieuJs().replace(/,"chiSoThuSuc":1/, ''))
    chonI('t1', 0)
    $('#nut-nop-ts').click()
    await cho()
    expect(nopChang()).toHaveLength(0)
  })
  it('NÚT RIÊNG khi chưa làm câu thử sức nào ⇒ báo, không gửi, nút còn mở', async () => {
    moPhieu(phieuJs())
    chonI('b1', 0)
    $('#nut-nop-ts').click()
    await cho()
    expect(nopChang()).toHaveLength(0)
    expect($('#nop-loi-ts').hidden).toBe(false)
    expect($('#nop-loi-ts').textContent).toContain('chưa làm câu nào ở phần thử sức thêm')
    expect(($('#nut-nop-ts') as HTMLButtonElement).disabled).toBe(false)
  })
  it('nộp thử sức bị host trả lỗi ⇒ lỗi hiện ở CHỖ THỬ SỨC, nút mở lại đúng chữ; nút chặng không dính', async () => {
    moPhieu(phieuJs())
    chonI('t2', 0)
    $('#nut-nop-ts').click()
    await cho()
    traLoiHost({ type: 'ddh-btvn-nop-chang-ket', ok: false, error: 'Bài đã quá hạn nộp.' })
    expect($('#nop-loi-ts').textContent).toBe('Bài đã quá hạn nộp.')
    expect($('#nop-loi-ts').hidden).toBe(false)
    expect($('#nut-nop-ts').textContent).toBe('Nộp phần thử sức thêm')
    expect(($('#nut-nop-ts') as HTMLButtonElement).disabled).toBe(false)
    expect($('#nop-loi').hidden).toBe(true)
    // nộp lại được
    $('#nut-nop-ts').click()
    await cho()
    expect(nopChang()).toHaveLength(2)
  })
  it('nộp CHẶNG bị lỗi (không phải thử sức) ⇒ lỗi hiện ở nút chặng, không lẫn sang chỗ thử sức', async () => {
    moPhieu(phieuJs())
    chonI('b1', 0)
    chonI('b2', 1)
    $('#nut-nop').click()
    await cho()
    traLoiHost({ type: 'ddh-btvn-nop-chang-ket', ok: false, error: 'Chặng này chưa mở.' })
    expect($('#nop-loi').textContent).toBe('Chặng này chưa mở.')
    expect($('#nop-loi-ts').hidden).toBe(true)
  })
  it('xong hết câu bắt buộc ⇒ trạng thái "xong" của phiếu bật dù thử sức chưa làm', async () => {
    moPhieu(phieuJs())
    chonI('b1', 0)
    chonI('b2', 1)
    await cho()
    expect(document.body.classList.contains('gd-xong')).toBe(true)
  })
})

describe('bảng nhiệm vụ: "N câu của em (+M câu thử sức thêm, không bắt buộc)"', () => {
  const NOW = new Date(2026, 8, 21, 10, 0).getTime()
  const v = (o: object) => ({ thuTu: 1, batBuoc: true, khan: false, cong: null, hien: true, nhan: null, trangThai: 'cho', ghiChu: '', chiTiet: {}, hanCung: null, hanMem: null, nguon: 'x', ...o })
  const keHoach = (chiSo: number, them: object = {}): KeHoachNgayMayChu => ({
    ok: true, ngay: '2026-09-21', nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 80, vanTocNguon: 'do', ghiChuVanToc: '' },
    viec: [v({ id: 'btvn_lo:B1:' + chiSo, loai: 'btvn_lo', soCau: 4, chiTiet: { ma: 'B1', caNhan: true, chiSo, tongLo: 3 }, ...them })] as never,
    canhBao: [], quaHan: [], tienBo: { daLamCau: 3, lenBac: 0, tutBac: 0, dat: false, toiThieuCau: 6, conThieu: 3 }, chuoiDat: 0, lanNghi: false, capNhatLuc: new Date(NOW).toISOString(),
  })
  const phu = (soThuSucThem: unknown) => ({ dsBtvn: [{ maBtvn: 'B1', tenBtvn: 'BTVN Este', soChang: 3, soThuSucThem }] })
  const moTa = (chiSo: number, ts: unknown) => {
    const d = tuKeHoachNgay(keHoach(chiSo), NOW, phu(ts) as never)
    return [...(d.lamNgay ? [d.lamNgay] : []), ...d.cacBac.flatMap((b) => b.viec)][0]!.moTa
  }
  it('CHẶNG CUỐI (chặng 3/3): "4 câu của em (+2 câu thử sức thêm, không bắt buộc)"', () => {
    expect(moTa(2, 2)).toContain('4 câu của em (+2 câu thử sức thêm, không bắt buộc)')
  })
  it('chặng không phải cuối: chỉ "4 câu của em" (nhóm thử sức mở cùng chặng cuối)', () => {
    expect(moTa(0, 2)).toContain('4 câu của em')
    expect(moTa(0, 2)).not.toContain('thử sức')
    expect(moTa(1, 2)).not.toContain('thử sức')
  })
  it('máy chủ chưa gửi / 0 / rác ⇒ như cũ', () => {
    for (const ts of [undefined, null, 0, '', 'x', -3, 1.5]) expect(moTa(2, ts)).not.toContain('thử sức')
  })
  it('soThuSucCua: ưu tiên /hs/btvn, rồi chiTiet; số nguyên dương mới tính', () => {
    expect(soThuSucCua({ soThuSucThem: 3 }, { soThuSucThem: 5 })).toBe(3)
    expect(soThuSucCua({}, { soThuSucThem: 5 })).toBe(5)
    expect(soThuSucCua({ soThuSucThem: 0 }, { soThuSucThem: 4 })).toBe(4)
    expect(soThuSucCua(undefined)).toBe(0)
    expect(soThuSucCua({ soThuSucThem: '2' })).toBe(2)
  })
})

describe('hero: dòng thử sức', () => {
  it('có soThuSuc > 0 ⇒ có dòng; 0/vắng ⇒ không có phần tử', () => {
    const d: DauBaiCaNhanVao = { tong: 12, soChang: 4, phutMoiNgay: null, han: '', chang: [], chiSoHienThi: null, nhanChang: {} }
    expect(heroCaNhanHtml({ ...d, soThuSuc: 3 })).toContain('<div class="gcn-hero-ts">(+3 câu thử sức thêm, không bắt buộc)</div>')
    expect(heroCaNhanHtml({ ...d, soThuSuc: 0 })).not.toContain('gcn-hero-ts')
    expect(heroCaNhanHtml(d)).not.toContain('gcn-hero-ts')
  })
})
