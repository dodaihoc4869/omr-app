// RÀ SOÁT TRƯỚC CA THẬT ĐẦU TIÊN TRÊN MÁY CHỦ MỚI (9h sáng 12/09).
//
// Thầy: "rà soát lại toàn bộ, không bỏ chi tiết nào… rà soát từng lỗi nhỏ tự
// động sửa lỗi". Tệp này canh những chỗ chỉ lộ ra khi có ca thật chạy — mỗi
// mục dưới đây là một lỗi ĐÃ TÌM RA trong lượt rà, không phải phòng xa.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { hopPhamVi } from '../server/src/index'
import { quyetDinhVaoThi } from '../server/src/luat-vao-thi'
import type { DongCa, DongLuot } from '../server/src/kieu'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const WK = doc('server/src/index.ts')

const CA_MAU = {
  ma_ca: 'c1', ten_ca: 'Lớp 1', trang_thai: 'mo', bat_dau: '', het_han_vao: '',
  thoi_gian_phut: 45, loai: 'thi', han_nop: '', cong_bo: 'khong',
} as unknown as DongCa

describe('LỖI 1 — bấm Bắt đầu lần hai KHÔNG được đặt lại đồng hồ cả lớp', () => {
  const HAM = WK.slice(WK.indexOf('async function batDauThi('), WK.indexOf('/** Đọc một ô có thể null'))

  it('đã có mốc thì trả lại mốc cũ, không ghi đè', () => {
    expect(HAM).toContain('if (cu) return ra({ ok: true, batDauLuc: cu, daBatTruoc: true')
  })

  it('báo về đủ ba cờ màn Theo dõi đang đọc', () => {
    for (const f of ['daBatTruoc', 'canBoTheoEm', 'coBoTheoEm']) expect(HAM, f).toContain(f)
  })

  it('ca đề riêng mà máy chủ CHƯA có bản đồ thì nói ra — em cầm đề khác bảng chấm của thầy', () => {
    expect(HAM).toContain("const canBoTheoEm = Number(ca.de_rieng ?? 0) === 1")
    expect(HAM).toContain("const coBoTheoEm = chuoiRong(ca.bo_theo_em_json) !== ''")
  })
})

describe('LỖI 2 — cổng PHẠM VI của ca', () => {
  it('ca tự do thì không chặn ai', () => {
    expect(hopPhamVi({ pham_vi: 'tu_do' }, { nam_sinh: '2009' }, '10001').ok).toBe(true)
  })

  it('ca theo KHỐI: đúng năm sinh thì vào, khác năm sinh thì chặn', () => {
    const ca = { pham_vi: 'khoi', danh_sach_chon_json: '"2009"' }
    expect(hopPhamVi(ca, { nam_sinh: '2009' }, '10001').ok).toBe(true)
    const chan = hopPhamVi(ca, { nam_sinh: '2010' }, '10002')
    expect(chan.ok).toBe(false)
    if (!chan.ok) expect(chan.lyDo).toBe('khong_thuoc_khoi')
  })

  it('ca CHỌN TỪNG EM: ngoài danh sách thì chặn', () => {
    const ca = { pham_vi: 'chon', danh_sach_chon_json: '["10001","10002"]' }
    expect(hopPhamVi(ca, null, '10001').ok).toBe(true)
    const chan = hopPhamVi(ca, null, '10009')
    expect(chan.ok).toBe(false)
    if (!chan.ok) expect(chan.lyDo).toBe('khong_trong_danh_sach')
  })

  it('THIẾU DỮ LIỆU THÌ KHÔNG CHẶN — chặn cả lớp vì một trường thiếu là hỏng nặng hơn', () => {
    expect(hopPhamVi({ pham_vi: 'chon', danh_sach_chon_json: '[]' }, null, '10001').ok).toBe(true)
    expect(hopPhamVi({ pham_vi: 'chon' }, null, '10001').ok).toBe(true)
    expect(hopPhamVi({ pham_vi: 'khoi', danh_sach_chon_json: '"2009"' }, { nam_sinh: '' }, '1').ok).toBe(true)
    expect(hopPhamVi({ pham_vi: 'khoi', danh_sach_chon_json: 'hong' }, { nam_sinh: '2010' }, '1').ok).toBe(true)
  })

  it('cổng nằm TRƯỚC lúc tạo lượt, và em bị chặn được ghi vào sổ để thầy thấy', () => {
    const han = WK.slice(WK.indexOf('async function vaoThi('), WK.indexOf('async function luuTam('))
    expect(han.indexOf('hopPhamVi(')).toBeLessThan(han.indexOf('INSERT INTO luot'))
    expect(han).toContain("ghiChanVao(env, maCa, sbd, String(b.hoTen ?? ''), String(b.namSinh ?? ''), pv.lyDo)")
  })
})

describe('LỖI 3 — em được duyệt thi lại phải vào ĐÚNG lượt đã duyệt', () => {
  const luot = { lan_thu: 2, trang_thai: 'duoc_duyet_lai', id_thiet_bi: '', vao_luc: '', het_gio_luc: '' } as unknown as DongLuot

  it('không đẻ thêm lần thử thứ ba', () => {
    const qd = quyetDinhVaoThi(CA_MAU, luot, 'tb', Date.now())
    expect(qd.ok).toBe(true)
    expect(qd.cach).toBe('duyet_lai')
    expect(qd.lanThu).toBe(2)
  })

  it('KHÔNG bị hạn vào phòng chặn — thầy duyệt sau giờ đóng cửa là chuyện thường', () => {
    const caDongCua = { ...CA_MAU, het_han_vao: new Date(Date.now() - 3600_000).toISOString() } as DongCa
    expect(quyetDinhVaoThi(caDongCua, luot, 'tb', Date.now()).ok).toBe(true)
  })

  it('vào rồi thì lượt đổi hẳn sang đang làm, đồng hồ tính lại từ lúc vào', () => {
    const han = WK.slice(WK.indexOf('async function vaoThi('), WK.indexOf('async function luuTam('))
    expect(han).toContain("trang_thai = CASE WHEN luot.trang_thai = 'duoc_duyet_lai' THEN 'dang_lam' ELSE luot.trang_thai END")
    expect(han).toContain("het_gio_luc = CASE WHEN luot.trang_thai = 'duoc_duyet_lai' THEN excluded.het_gio_luc ELSE luot.het_gio_luc END")
  })

  it('lượt ĐANG LÀM vẫn khôi phục như cũ, không bị nhánh mới đụng vào', () => {
    const dangLam = { lan_thu: 1, trang_thai: 'dang_lam', id_thiet_bi: 'tb', vao_luc: 'a', het_gio_luc: 'b' } as unknown as DongLuot
    const qd = quyetDinhVaoThi(CA_MAU, dangLam, 'tb', Date.now())
    expect(qd.cach).toBe('khoi_phuc')
    expect(qd.lanThu).toBe(1)
  })
})

describe('LỖI 4 — cấu hình máy chủ không còn cờ tắt', () => {
  it('có địa chỉ là bật; một cấu hình cũ sót BAT:false không được làm hỏng ca', () => {
    const CH = doc('src/lib/cau-hinh-may-chu.ts')
    expect(CH).toContain('BAT: url.length > 0')
    expect(CH).not.toContain('c?.BAT === true')
  })
})
