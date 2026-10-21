// CÂU KHÓ ở "Chữa câu khó & tính toán" (thầy chốt 21/10): Vận dụng (kho gộp VDC vào van_dung) HOẶC 2 sao cần chữa — đọc qua đúng đường nạp kho.
import { expect, it } from 'vitest'
import { chuanHoaMucDo, parseCanChua } from '../src/lib/exam-kho-de-import'
import { demTuChua, laCauKho, laCauKhoHoacTinh, xepThuTuChua, type CauTuChua } from '../src/lib/thay-tu-chua'

/** Câu như sau khi nạp kho: `muc_do` → `mucDo` qua chuanHoaMucDo, `can_chua` → `canChua` qua parseCanChua. */
const quaKho = (muc_do: unknown, can_chua?: unknown) => ({ mucDo: chuanHoaMucDo(muc_do), canChua: parseCanChua(can_chua) })
const sao = (n: 0 | 1 | 2) => ({ sao: n, dk: ['buoc'], ly_do: 'x', bay: null })

it('Vận dụng và VDC (mọi cách ghi trong kho) là câu khó; Nhận biết / Thông hiểu / thiếu mức độ thì không', () => {
  for (const m of ['van_dung', 'VD', 'VDC', 'Vận dụng', 'vận dụng cao']) expect(laCauKho(quaKho(m)), m).toBe(true)
  for (const m of ['biet', 'hieu', 'NB', 'TH', undefined, 'lạ']) expect(laCauKho(quaKho(m)), String(m)).toBe(false)
})

it('2 sao cần chữa là câu khó (đọc canChua.sao, không phải q.sao); 1 sao / 0 sao / không gắn sao thì không', () => {
  expect(laCauKho(quaKho('hieu', sao(2)))).toBe(true)
  expect(laCauKho(quaKho('hieu', sao(1)))).toBe(false)
  expect(laCauKho(quaKho('biet', sao(0)))).toBe(false)
  // dữ liệu đặt nhầm `sao` ở ngọn câu (hình dạng test cũ) KHÔNG được tính — kho thật không có trường này
  expect(laCauKho({ mucDo: 'hieu', sao: 2 } as never)).toBe(false)
  expect(laCauKho(null)).toBe(false)
})

it('xếp: câu khó vào nhóm ưu tiên đầu tờ cùng câu tính toán; công tắc lọc chỉ giữ câu khó hoặc tính toán; đếm câu khó', () => {
  const c = (i: number, x: Partial<CauTuChua>): CauTuChua => ({ khoa: `k${i}`, qid: `q${i}`, phan: 'I', so: i, maDe: 'D', thuTuDe: i, q: {} as CauTuChua['q'], tinhToan: false, kho: false, tuLuan: false, thieuNoiDung: false, ...x })
  const ds = [c(0, {}), c(1, { kho: true }), c(2, {}), c(3, { tinhToan: true }), c(4, { kho: laCauKho(quaKho('hieu', sao(2))) })]
  const xep = xepThuTuChua(ds, null, 'buoi')
  expect(new Set(xep.slice(0, 3).map((x) => x.qid))).toEqual(new Set(['q1', 'q3', 'q4']))
  expect(xep.slice(3).map((x) => x.qid)).toEqual(['q0', 'q2'])
  expect(ds.filter(laCauKhoHoacTinh).map((x) => x.qid)).toEqual(['q1', 'q3', 'q4'])
  expect(demTuChua(ds).kho).toBe(2)
})

it('22/10 (thầy báo đề Trả lời ngắn 40/40): câu ĐẾM lý thuyết Phần III không là "có tính toán"; câu Phần III có phép tính vẫn là', async () => {
  const { laCauTinhToan } = await import('../src/lib/thay-tu-chua')
  const III = (text: string) => laCauTinhToan({ phan: 'III', text })
  for (const t of ['Cho các phát biểu sau về ester. Có bao nhiêu phát biểu đúng?', 'Số đồng phân cấu tạo ứng với công thức C4H10O là bao nhiêu?', 'Trong các chất sau, có bao nhiêu chất làm mất màu nước bromine?', 'Thực hiện các thí nghiệm sau. Số thí nghiệm xảy ra phản ứng là'])
    expect(III(t), t).toBe(false)
  for (const t of ['Tổng hợp ammonia với hiệu suất 25%. Cần bao nhiêu lít N2 (đkc) để thu được 6,8 gam ammonia?', 'Cần bao nhiêu gam NaOH để trung hoà 0,2 mol HCl?', 'Tính pH của dung dịch HCl 0,01 M.', 'Đốt cháy hoàn toàn m gam ester X thu được 0,3 mol CO2. Giá trị của m là', 'Có bao nhiêu phát biểu đúng? (a) 0,1 mol glucose tạo 0,2 mol Ag.'])
    expect(III(t), t).toBe(true)
  // tự luận Phần III vẫn xét theo nội dung như cũ
  expect(laCauTinhToan({ phan: 'III', text: 'Giải thích vì sao ammonia tan nhiều trong nước.' }, true)).toBe(false)
})

it('22/10 (gộp): câu ĐẾM Phần III không là "có tính toán" KỂ CẢ khi kho gắn nhãn bài tập; nhãn lý thuyết thắng; câu tính có nhãn bài tập vẫn là tính', async () => {
  const { laCauTinhToan } = await import('../src/lib/thay-tu-chua')
  expect(laCauTinhToan({ phan: 'III', kieu: 'bai_tap', text: 'Cho các phát biểu sau. Số phát biểu đúng là' })).toBe(false)
  expect(laCauTinhToan({ phan: 'III', kieu: 'bai_tap', text: 'Số nguyên tử hydrogen trong phân tử trimethylamine là' })).toBe(false)
  expect(laCauTinhToan({ phan: 'III', kieu: 'bai_tap', text: 'Cho 2,24 lít khí CO2 vào dung dịch NaOH dư. Khối lượng muối thu được là bao nhiêu gam?' })).toBe(true)
  expect(laCauTinhToan({ phan: 'III', kieu: 'bai_tap', text: 'Giá trị của m là' })).toBe(true)
  expect(laCauTinhToan({ phan: 'III', kieu: 'ly_thuyet', text: 'Cho 0,1 mol X… Số chất thoả mãn là' })).toBe(false)
})

it('22/10 (kho thật gắn "bài tập" cho MỌI câu Phần III): nhãn ấy không quyết định; tên dạng "— đếm…" ⇒ không, "— tính…" ⇒ có; qua cauCuaDe đề Trả lời ngắn co lại', async () => {
  const { laCauTinhToan, cauCuaDe, laCauKhoHoacTinh } = await import('../src/lib/thay-tu-chua')
  expect(laCauTinhToan({ phan: 'III', kieu: 'bai_tap', text: 'Chất X là gì? Ghi số thứ tự.', tenDang: 'Số oxi hoá — đếm đồng phân' })).toBe(false)
  expect(laCauTinhToan({ phan: 'III', kieu: 'bai_tap', text: 'Giá trị của a là', tenDang: 'Hợp chất vô cơ thường gặp — tính khối lượng' })).toBe(true)
  const q = (id: string, text: string) => ({ id, text, correct: '3', kieu: 'bai_tap' as const })
  const to = { maDe: 'DH-12-C3-B8-TLN', phanI: [], phanII: [], phanIII: [
    q('DH-12-C3-B8-III-1', 'Có bao nhiêu chất làm quỳ tím ẩm hoá xanh?'),
    q('DH-12-C3-B8-III-2', 'Số đồng phân amine bậc một của C4H11N là'),
    q('DH-12-C3-B8-III-3', 'Cho 9,3 gam aniline tác dụng vừa đủ với HCl. Khối lượng muối là bao nhiêu gam?'),
    q('DH-12-C3-B8-III-4', 'Đốt cháy 0,1 mol amine X thu được 0,3 mol CO2. Số nguyên tử C của X là'),
  ] } as never
  const ds = cauCuaDe([to])
  expect(ds.filter(laCauKhoHoacTinh).map((c) => c.so)).toEqual([3, 4])
})
