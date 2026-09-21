// BỘ NÃO A.I — BỘ ĐỌC LỜI NHẮN (học sinh + phụ huynh). Trường do Code 3 chốt 21/09:
//  · HS: `loiNhanHlv: { ngay, loi, gan:[{ngay,loi}] }` (gan ≤ 7, mới nhất trước, gồm hôm nay); KHÔNG có khoá khi chạy thử/không lời.
//  · PH: `boNaoAi: { ngay, loiNhan, thuTuan, tuanTu? }` ở /ph/ke-hoach.
import { describe, expect, it } from 'vitest'
import {
  KHONG_BO_NAO,
  TOI_DA_LOI_GAN_DAY,
  docBoNao,
  docBoNaoHocSinh,
  docBoNaoPhuHuynh,
  lamSachLoi,
  ngayHomNay,
  ngayNganVi,
  nhanNgayLoi,
  nhanTuan,
} from '../src/lib/bo-nao-hien-thi'

const NUL = String.fromCharCode(0)
const ZW = String.fromCharCode(0x200b) // ký tự độ rộng không
const LOI = 'Hôm nay em đúng lại 2 câu ester từng sai, tự sửa được mà không ai làm hộ.'
const ngay = (n: number) => `2026-09-${String(n).padStart(2, '0')}`

describe('docBoNaoHocSinh', () => {
  it('đúng dạng Code 3 chốt: lời hôm nay + gan; hôm nay đứng đầu, bỏ trùng đúng chữ, tối đa 7', () => {
    const gan = [21, 20, 19, 18, 17, 16, 15, 14, 13].map((n) => ({ ngay: ngay(n), loi: n === 21 ? LOI : `Lời ngày ${n}` }))
    const r = docBoNaoHocSinh({ ngay: ngay(21), loi: LOI, gan })!
    expect(r.loi).toBe(LOI)
    expect(r.ngay).toBe('2026-09-21')
    expect(r.gan).toHaveLength(TOI_DA_LOI_GAN_DAY)
    expect(r.gan[0]).toEqual({ ngay: '2026-09-21', loi: LOI })
    expect(r.gan.filter((g) => g.loi === LOI)).toHaveLength(1)
    expect(r.gan.map((g) => g.ngay)).toEqual([21, 20, 19, 18, 17, 16, 15].map(ngay))
  })

  it('chỉ có lời hôm nay (chưa có lời cũ) ⇒ gan có đúng 1 phần tử', () => {
    expect(docBoNaoHocSinh({ ngay: ngay(21), loi: LOI, gan: [] })!.gan).toEqual([{ ngay: ngay(21), loi: LOI }])
    expect(docBoNaoHocSinh({ ngay: ngay(21), loi: LOI })!.gan).toHaveLength(1)
  })

  it('chịu cả chuỗi trơn (dạng sơ khai) và lời trong gan viết bằng chuỗi', () => {
    expect(docBoNaoHocSinh(`  ${LOI}  `)).toEqual({ ngay: '', loi: LOI, gan: [{ ngay: '', loi: LOI }] })
    expect(docBoNaoHocSinh({ loi: LOI, gan: ['Lời cũ một', { ngay: ngay(20), loi: 'Lời cũ hai' }] })!.gan.map((g) => g.loi)).toEqual([LOI, 'Lời cũ một', 'Lời cũ hai'])
  })

  it('không có lời ⇒ null (không thẻ): vắng, null, rỗng, trắng, kiểu lạ, mảng', () => {
    for (const x of [undefined, null, '', '   ', 5, true, [], {}, { loi: '' }, { loi: '   ', gan: [{ loi: 'x' }] }, { ngay: ngay(21) }]) expect(docBoNaoHocSinh(x)).toBeNull()
  })

  it('dòng hỏng trong gan bị bỏ, không làm hỏng cả danh sách', () => {
    const r = docBoNaoHocSinh({ loi: LOI, gan: [null, 5, { loi: '' }, { ngay: 'x', loi: 'Lời tốt' }, []] })!
    expect(r.gan.map((g) => g.loi)).toEqual([LOI, 'Lời tốt'])
    expect(r.gan[1].ngay).toBe('') // ngày sai khuôn ⇒ rỗng, lời vẫn giữ
  })

  it('không tin tên trường lạ: không mang mã, không mang trường thừa ra kết quả', () => {
    const r = docBoNaoHocSinh({ loi: LOI, sbd: '12121212', token: 'x', html: '<b>x</b>' })!
    expect(JSON.stringify(r)).not.toContain('12121212')
    expect(JSON.stringify(r)).not.toContain('token')
    expect(Object.keys(r).sort()).toEqual(['gan', 'loi', 'ngay'])
  })
})

describe('docBoNaoPhuHuynh', () => {
  it('đủ lời + thư tuần + tuanTu', () => {
    expect(docBoNaoPhuHuynh({ ngay: ngay(21), loiNhan: 'Lời cho anh chị.', thuTuan: 'Thư tuần.', tuanTu: ngay(14) })).toEqual({ ngay: ngay(21), loiNhan: 'Lời cho anh chị.', thuTuan: 'Thư tuần.', tuanTu: ngay(14) })
  })
  it('chỉ có một trong hai vẫn hiện; cả hai rỗng/vắng ⇒ null', () => {
    expect(docBoNaoPhuHuynh({ loiNhan: 'Chỉ lời', thuTuan: '' })).toMatchObject({ loiNhan: 'Chỉ lời', thuTuan: '', tuanTu: '' })
    expect(docBoNaoPhuHuynh({ loiNhan: '', thuTuan: 'Chỉ thư' })).toMatchObject({ loiNhan: '', thuTuan: 'Chỉ thư' })
    for (const x of [undefined, null, 'x', [], {}, { loiNhan: '', thuTuan: '' }, { loiNhan: '  ', thuTuan: '\n' }]) expect(docBoNaoPhuHuynh(x)).toBeNull()
  })
  it('thư tuần được phép dài hơn lời (trần riêng)', () => {
    const dai = 'Một câu khá dài. '.repeat(60) // ~1000 ký tự
    const r = docBoNaoPhuHuynh({ loiNhan: dai, thuTuan: dai })!
    expect(r.thuTuan.length).toBeGreaterThan(r.loiNhan.length)
    expect(r.loiNhan.length).toBeLessThanOrEqual(401)
  })
})

describe('docBoNao — mỗi vai CHỈ đọc phần của mình từ gốc phản hồi', () => {
  it('loiNhanHlv → hs; boNaoAi → ph; không lẫn', () => {
    const r = docBoNao({ ok: true, viec: [], loiNhanHlv: { ngay: ngay(21), loi: LOI }, boNaoAi: { loiNhan: 'Lời PH' } })
    expect(r.hs!.loi).toBe(LOI)
    expect(r.ph!.loiNhan).toBe('Lời PH')
    expect(docBoNao({ loiNhanHlv: { loi: LOI } }).ph).toBeNull()
    expect(docBoNao({ boNaoAi: { loiNhan: 'x' } }).hs).toBeNull()
  })
  it('phản hồi không phải đối tượng / không có khoá (chạy thử) ⇒ không có gì', () => {
    for (const x of [null, undefined, 'x', 5, [], {}, { ok: true, viec: [] }]) expect(docBoNao(x)).toEqual(KHONG_BO_NAO)
  })
})

describe('lamSachLoi — chữ luôn an toàn để vẽ', () => {
  it('bỏ ký tự điều khiển/độ rộng-không, gọn khoảng trắng, giữ xuống dòng', () => {
    expect(lamSachLoi(`  Em \t làm  tốt${NUL}.${ZW}  `)).toBe('Em làm tốt.')
    expect(lamSachLoi('Dòng một.  \n  Dòng hai.\n\n\n\nDòng ba.')).toBe('Dòng một.\nDòng hai.\n\nDòng ba.')
  })
  it('không phải chuỗi ⇒ rỗng', () => {
    for (const x of [undefined, null, 5, {}, []]) expect(lamSachLoi(x)).toBe('')
  })
  it('dài quá trần ⇒ cắt ở ranh giới câu/từ gần nhất + "…", không cắt cụt giữa chữ', () => {
    const dai = `${'Câu ngắn số một. '.repeat(30)}Cuối.`
    const r = lamSachLoi(dai, 100)
    expect(r.endsWith('…')).toBe(true)
    expect(r.length).toBeLessThanOrEqual(101)
    expect(r).toMatch(/\.…$/) // dừng sau dấu chấm câu
    expect(lamSachLoi('x'.repeat(500), 100)).toBe('x'.repeat(100) + '…') // không có chỗ ngắt ⇒ cắt cứng
  })
  it('dấu kết câu chỉ ở ĐẦU lời (dưới 60% trần) thì KHÔNG dừng ở đó — dừng ở ranh giới TỪ gần trần, không cụt lủn', () => {
    const r = lamSachLoi(`Ngắn. ${'chữ '.repeat(40)}`, 100)
    expect(r.length).toBeGreaterThan(80)
    expect(r.endsWith('chữ…')).toBe(true)
    expect(r).not.toBe('Ngắn.…')
  })
  it('đúng trần thì giữ nguyên; quá một ký tự thì cắt', () => {
    expect(lamSachLoi('a'.repeat(400))).toBe('a'.repeat(400))
    expect(lamSachLoi('a'.repeat(401)).length).toBe(401) // 400 + "…"
  })
})

describe('nhãn ngày', () => {
  const NOW = new Date(2026, 8, 21, 10, 0).getTime()
  it('ngayNganVi / ngayHomNay', () => {
    expect(ngayNganVi('2026-09-21')).toBe('Thứ Hai 21/09')
    expect(ngayNganVi('2026-09-20')).toBe('Chủ nhật 20/09')
    expect(ngayNganVi('2026-09-19')).toBe('Thứ Bảy 19/09')
    for (const x of ['', 'x', '2026-13-40', '2026-02-31']) expect(ngayNganVi(x)).toBe('')
    expect(ngayHomNay(NOW)).toBe('2026-09-21')
  })
  it('nhanNgayLoi: hôm nay có ngày; lời của ngày khác KHÔNG nhận là hôm nay; không ngày ⇒ chỉ nhãn', () => {
    expect(nhanNgayLoi('2026-09-21', NOW)).toBe('Lời hôm nay · Thứ Hai 21/09')
    expect(nhanNgayLoi('2026-09-20', NOW)).toBe('Lời ngày Chủ nhật 20/09')
    expect(nhanNgayLoi('', NOW)).toBe('Lời hôm nay')
    expect(nhanNgayLoi('2026-09-21', NOW, 'Lời cho anh chị')).toBe('Lời cho anh chị · Thứ Hai 21/09')
  })
  it('nhanTuan: trong tháng "14–20/09", sang tháng "28/09–04/10", hỏng ⇒ rỗng', () => {
    expect(nhanTuan('2026-09-14')).toBe('14–20/09')
    expect(nhanTuan('2026-09-28')).toBe('28/09–04/10')
    for (const x of ['', 'x', '2026-02-31']) expect(nhanTuan(x)).toBe('')
  })
})
