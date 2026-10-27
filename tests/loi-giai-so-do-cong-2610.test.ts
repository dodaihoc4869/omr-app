// @vitest-environment node
// CỔNG KIỂM «LỜI GIẢI KIỂU SƠ ĐỒ» (26/10, server/src/so-do-cong.ts) — hàm thuần: tính chuỗi thừa số, so đáp án kho, chặn lộ, cắt trước nộp.
import { describe, expect, it } from 'vitest'
import type { BanSoDo } from '../src/lib/goi-y-cham/kieu'
import { catTruocNop, giaTriThuaSo, kiemCong, lamSachChu, lamSachChuHien } from '../server/src/so-do-cong'
import { qidTraSoDo } from '../server/src/loi-giai-so-do'

/** Mẫu XUÔI của thầy: 1 tấn quặng 8% FeS₂ ⇒ m kg H₂SO₄? (theo S, H = 90%) — m = 10^6 · 8/100 · 1/120 · 2 · 64 · 90/100 · 1/1000 = 76,8. */
function banXuoi(): BanSoDo {
  return {
    qid: 'Q-XUOI', phienBan: 1,
    deNoiGi: 'Quặng chứa FeS_2; đề cho khối lượng quặng và phần trăm, hỏi khối lượng chất sau cùng khi hiệu suất chưa trọn vẹn.',
    soDo: {
      chieu: 'xuoi',
      nut: [{ tong: '1 tấn quặng', chat: 'FeS_2', soLieu: ['8%'] }, { chat: 'SO_2', soLieu: ['m kg = ?'] }],
      muiTen: [{ H: 90 }],
    },
    buoc: [{
      ten: 'm', donVi: 'kg', ketQua: '76,8',
      thuaSo: [
        { so: '10^6', nghia: 'đổi tấn ra gam' },
        { so: '8/100', nghia: 'lấy phần FeS_2 trong quặng' },
        { so: '1/120', nghia: 'số mol FeS_2 (chia M = 120)' },
        { so: '2', nghia: 'bảo toàn S: ra 2 SO_2', denDay: 'tới đây là: số mol SO_2' },
        { so: '64', nghia: 'đổi mol ra gam' },
        { so: '90/100', nghia: 'tính xuôi: nhân H/100' },
        { so: '1/1000', nghia: 'đổi gam ra kg' },
      ],
    }],
    ketQua: '76,8',
  }
}
/** Mẫu NGƯỢC: 10^6 · 98/100 · 1/98 · 1/2 · 120 · 100/60 · 100/80 · 10^-6 = 1,25. */
function banNguoc(): BanSoDo {
  return {
    qid: 'Q-NGUOC', phienBan: 1,
    deNoiGi: 'Muốn có lượng axit cho trước, hỏi cần bao nhiêu quặng khi hai giai đoạn đều hao hụt.',
    soDo: {
      chieu: 'nguoc',
      nut: [{ tong: 'm tấn quặng = ?', chat: 'FeS_2', soLieu: ['60%'] }, { tong: '1 tấn dung dịch', chat: 'H_2SO_4', soLieu: ['98%'] }],
      muiTen: [{ H: 80 }],
    },
    buoc: [{
      ten: 'm', donVi: 'tấn',
      thuaSo: [
        { so: '10⁶', nghia: 'tấn ra gam' }, { so: '98/100', nghia: 'phần axit' }, { so: '1/98', nghia: 'đổi ra mol' },
        { so: '1/2', nghia: 'nhà FeS_2 nghèo hơn một nửa' }, { so: '120', nghia: 'mol ra gam' }, { so: '100/60', nghia: 'quặng chỉ có 60% là FeS_2' },
        { so: '100/80', nghia: 'tính ngược thì chia thuế: nhân 100/H' }, { so: '10⁻⁶', nghia: 'gam ra tấn' },
      ],
    }],
  }
}

describe('cổng kiểm số', () => {
  it('mẫu xuôi FeS₂ ra 76,8 ⇒ đạt (Phần III)', () => {
    const k = kiemCong(banXuoi(), { phan: 'III', dapAn: '76,8' })
    expect(k.ket).toBe('dat')
    expect(k.giaTri!).toBeCloseTo(76.8, 9)
  })
  it('mẫu ngược ra 1,25 ⇒ đạt; viết 10⁶ / 10⁻⁶ chữ nhỏ đọc được', () => {
    const k = kiemCong(banNguoc(), { phan: 'III', dapAn: '1,25' })
    expect(k.ket).toBe('dat')
    expect(k.giaTri!).toBeCloseTo(1.25, 9)
  })
  it('đáp án kho làm tròn thô hơn phép tính vẫn đạt (làm tròn như kho); lệch quá nửa chữ số cuối ⇒ lệch', () => {
    const b = banNguoc()
    expect(kiemCong(b, { phan: 'III', dapAn: '1,3' }).ket).toBe('dat')
    expect(kiemCong(b, { phan: 'III', dapAn: '1,4' }).ket).toBe('lech')
    expect(kiemCong(b, { phan: 'III', dapAn: '1,26' }).ket).toBe('lech')
  })
  it('lệch: phép tính 76,8 mà kho ghi 80 ⇒ lech', () => {
    expect(kiemCong(banXuoi(), { phan: 'III', dapAn: '80' })).toMatchObject({ ket: 'lech' })
  })
  it('ketQua ghi trong bản lệch phép tính ⇒ lech (dù đáp án kho khớp)', () => {
    const b = banXuoi(); b.buoc[0]!.ketQua = '77,8'
    expect(kiemCong(b, { phan: 'III', dapAn: '76,8' }).ket).toBe('lech')
    const c = banXuoi(); c.ketQua = '7,68'
    expect(kiemCong(c, { phan: 'III', dapAn: '76,8' }).ket).toBe('lech')
  })
  it('nhiều bước: bước sau dùng tên kết quả bước trước; phân số, dấu phẩy, 1/<tên>', () => {
    const b: BanSoDo = {
      qid: 'Q-2B', phienBan: 1, deNoiGi: 'Khí sinh ra ở điều kiện chuẩn.', soDo: { chieu: 'xuoi', nut: [{ chat: 'Fe', soLieu: ['5,6 gam'] }, { chat: 'H_2', soLieu: ['V lít = ?'] }], muiTen: [{}] },
      buoc: [
        { ten: 'n_Fe', thuaSo: [{ so: '5,6', nghia: 'khối lượng sắt' }, { so: '1/56', nghia: 'chia M' }] },
        { ten: 'V', thuaSo: [{ so: 'n_Fe', nghia: 'số mol sắt ở bước trên' }, { so: '24,79', nghia: 'thể tích mol ở đkc' }] },
      ],
    }
    expect(giaTriThuaSo('1/22,4')).toBeCloseTo(1 / 22.4, 12)
    // 27/10: dấu cách ngăn hàng nghìn kiểu VN
    expect(giaTriThuaSo('1 000 000')).toBe(1_000_000)
    expect(giaTriThuaSo('10 000')).toBe(10_000)
    expect(giaTriThuaSo('10 000,5')).toBe(10_000.5)
    expect(giaTriThuaSo('1 000 000/120')).toBeCloseTo(1e6 / 120, 9)
    expect(giaTriThuaSo('2 * 64')).toBe(128)
    expect(giaTriThuaSo('12 34')).toBeNull() // nhóm không đủ 3 chữ số ⇒ không đoán
    expect(giaTriThuaSo('1/n', new Map([['n', 4]]))).toBe(0.25)
    expect(kiemCong(b, { phan: 'III', dapAn: '2,479' })).toMatchObject({ ket: 'dat' })
    expect(kiemCong(b, { phan: 'III', dapAn: '2,48' })).toMatchObject({ ket: 'dat' })
  })
  it('thừa số dạng biểu thức: hiệu trong ngoặc (dấu trừ «−» Unicode và «-»), lũy thừa, %, «2,5.10^-3», tên bước trước', () => {
    expect(giaTriThuaSo('(0,15 − 0,1)')).toBeCloseTo(0.05, 12)
    expect(giaTriThuaSo('(0,15 - 0,1)')).toBeCloseTo(0.05, 12)
    expect(giaTriThuaSo('10^-6')).toBeCloseTo(1e-6, 18)
    expect(giaTriThuaSo('10⁻⁶')).toBeCloseTo(1e-6, 18)
    expect(giaTriThuaSo('× 90%')).toBeCloseTo(0.9, 12)
    expect(giaTriThuaSo('2,5.10^-3')).toBeCloseTo(0.0025, 12)
    expect(giaTriThuaSo('1,2375×10⁹')).toBeCloseTo(1.2375e9, 0)
    expect(giaTriThuaSo('1/(2·64)')).toBeCloseTo(1 / 128, 12)
    expect(giaTriThuaSo('n_CO2 · 44', new Map([['n_CO2', 0.05]]))).toBeCloseTo(2.2, 12)
    expect(giaTriThuaSo('n_CO')).toBeNull()
    expect(giaTriThuaSo('1/0')).toBeNull()
    expect(giaTriThuaSo('(0,15 − 0,1')).toBeNull()
    const b: BanSoDo = {
      qid: 'Q-HIEU', phienBan: 1, deNoiGi: 'Khí CO_2 thoát ra là phần mol axit dư sau phản ứng.',
      soDo: { chieu: 'xuoi', nut: [{ chat: 'HCl', soLieu: ['0,15 mol'] }, { chat: 'CO_2', soLieu: ['m gam = ?'] }], muiTen: [{}] },
      buoc: [
        { ten: 'n_CO2', thuaSo: [{ so: '(0,15 − 0,1)', nghia: 'phần axit còn lại' }, { so: '1/2', nghia: 'hai axit đổi một CO_2' }] },
        { ten: 'm', thuaSo: [{ so: 'n_CO2', nghia: 'số mol CO_2 ở bước trên' }, { so: '44', nghia: 'đổi mol ra gam' }] },
      ],
    }
    expect(kiemCong(b, { phan: 'III', dapAn: '1,1' })).toMatchObject({ ket: 'dat' })
  })
  it('Phần I: so giá trị số của phương án đúng; phương án chữ ⇒ không kiểm được', () => {
    const lc = { A: '85,3', B: '76,8', C: '69,1', D: '96,0' }
    expect(kiemCong(banXuoi(), { phan: 'I', dapAn: 'B', luaChon: lc }).ket).toBe('dat')
    expect(kiemCong(banXuoi(), { phan: 'I', dapAn: 'A', luaChon: lc }).ket).toBe('lech')
    expect(kiemCong(banXuoi(), { phan: 'I', dapAn: 'B', luaChon: { A: 'FeS', B: 'FeS2', C: 'Fe2O3', D: 'SO3' } }).ket).toBe('khong_kiem_duoc')
    expect(kiemCong(banXuoi(), { phan: 'I', dapAn: 'B', luaChon: { A: '85,3 kg', B: '76,8 kg', C: '69,1 kg', D: '96 kg' } }).ket).toBe('dat')
  })
  it('Phần II (v1) và câu tính thiếu sơ đồ / bước ⇒ không kiểm được', () => {
    expect(kiemCong(banXuoi(), { phan: 'II', dapAn: 'DSDS' }).ket).toBe('khong_kiem_duoc')
    const b = banXuoi(); delete b.soDo
    expect(kiemCong(b, { phan: 'III', dapAn: '76,8' }).ket).toBe('khong_kiem_duoc')
    const c = banXuoi(); c.buoc = []; delete c.ketQua
    expect(kiemCong(c, { phan: 'III', dapAn: '76,8' }).ket).toBe('khong_kiem_duoc')
    const d = banXuoi(); d.buoc[0]!.thuaSo[2]!.so = '1/M'
    expect(kiemCong(d, { phan: 'III', dapAn: '76,8' }).ket).toBe('khong_kiem_duoc')
    expect(kiemCong(banXuoi(), { phan: 'III', dapAn: 'FeS2 + O2' }).ket).toBe('khong_kiem_duoc')
  })
})

describe('chặn lộ đáp án (phần hiện trước khi nộp)', () => {
  it('đề nói gì chứa đáp số cuối ⇒ lo_dap_an (xét trước cả đúng/sai)', () => {
    const b = banXuoi(); b.deNoiGi = 'Kết quả khoảng 76,8 kg axit.'
    expect(kiemCong(b, { phan: 'III', dapAn: '76,8' }).ket).toBe('lo_dap_an')
    const c = banXuoi(); c.deNoiGi = 'Ra chừng 77 kg.'
    expect(kiemCong(c, { phan: 'III', dapAn: '76,8' }).ket).toBe('lo_dap_an')
  })
  it('sơ đồ chứa đáp số ⇒ lo_dap_an', () => {
    const b = banXuoi(); b.soDo!.nut[1]!.soLieu = ['m = 76,8 kg']
    expect(kiemCong(b, { phan: 'III', dapAn: '76,8' }).ket).toBe('lo_dap_an')
  })
  it('nghĩa thừa số chứa kết quả trung gian quyết định (số mol SO₂ = 1333,3) ⇒ lo_dap_an', () => {
    const b = banXuoi(); b.buoc[0]!.thuaSo[3]!.nghia = 'bảo toàn S: được 1333,3 mol'
    expect(kiemCong(b, { phan: 'III', dapAn: '76,8' }).ket).toBe('lo_dap_an')
    const c = banXuoi(); c.buoc[0]!.thuaSo[5]!.denDay = 'tới đây là 76800 gam'
    expect(kiemCong(c, { phan: 'III', dapAn: '76,8' }).ket).toBe('lo_dap_an')
  })
  it('kết quả bước trước (nhiều bước) lộ trong đề nói gì ⇒ lo_dap_an', () => {
    const b: BanSoDo = {
      qid: 'Q', phienBan: 1, deNoiGi: 'Có 0,1 mol sắt phản ứng.', soDo: { chieu: 'xuoi', nut: [{ chat: 'Fe', soLieu: ['5,6 gam'] }, { chat: 'H_2', soLieu: ['V = ?'] }], muiTen: [{}] },
      buoc: [{ ten: 'n', thuaSo: [{ so: '5,6', nghia: 'gam' }, { so: '1/56', nghia: 'chia M' }] }, { ten: 'V', thuaSo: [{ so: 'n', nghia: 'mol' }, { so: '24,79', nghia: 'đkc' }] }],
    }
    expect(kiemCong(b, { phan: 'III', dapAn: '2,479' }).ket).toBe('lo_dap_an')
  })
  it('Phần I: nói thẳng chữ cái hay giá trị phương án đúng ⇒ lo_dap_an', () => {
    const lc = { A: '85,3', B: '76,8', C: '69,1', D: '96,0' }
    const b = banXuoi(); b.deNoiGi = 'Đề hỏi khối lượng; đáp án B.'
    expect(kiemCong(b, { phan: 'I', dapAn: 'B', luaChon: lc }).ket).toBe('lo_dap_an')
    const c = banXuoi(); c.buoc[0]!.thuaSo[0]!.nghia = 'đổi tấn ra gam, nhớ là ra 76,8'
    expect(kiemCong(c, { phan: 'I', dapAn: 'B', luaChon: lc }).ket).toBe('lo_dap_an')
  })
  it('chữ số trong công thức (FeS_2, Fe2O3, H₂SO₄) và số liệu đề cho không bị coi là lộ', () => {
    const b = banXuoi(); b.deNoiGi += ' Có thể gặp Fe2O3, H₂SO₄ 98%, CuSO4.5H2O.'
    expect(kiemCong(b, { phan: 'III', dapAn: '76,8' }).ket).toBe('dat')
  })
})

describe('cắt trước nộp và chọn qid', () => {
  it('catTruocNop xoá mọi ketQua (gốc + từng bước), không sửa bản gốc', () => {
    const b = banXuoi()
    const c = catTruocNop(b)
    expect(JSON.stringify(c)).not.toContain('ketQua')
    expect(c.buoc[0]!.thuaSo).toHaveLength(7)
    expect(c.buoc[0]!.donVi).toBe('kg')
    expect(b.ketQua).toBe('76,8')
    expect(b.buoc[0]!.ketQua).toBe('76,8')
  })
  it('câu lặp cùng số liệu (#n, ~n) dùng bản gốc; song sinh / biến thể / ý mới thì không', () => {
    expect(qidTraSoDo('DH-1-III-2')).toEqual(['DH-1-III-2'])
    expect(qidTraSoDo('DH-1-III-2#3')).toEqual(['DH-1-III-2#3', 'DH-1-III-2'])
    expect(qidTraSoDo('DH-1-III-2~2')).toEqual(['DH-1-III-2~2', 'DH-1-III-2'])
    expect(qidTraSoDo('DH-1-III-2~ss0')).toEqual(['DH-1-III-2~ss0'])
    expect(qidTraSoDo('DH-1-III-2~bt1#2')).toEqual(['DH-1-III-2~bt1#2'])
    expect(qidTraSoDo('DH-1-III-2~yd0')).toEqual(['DH-1-III-2~yd0'])
  })
})

describe('27/10 thầy «Bỏ thực tế lý thuyết đi» (ảnh nitrobenzene)', () => {
  it('bỏ «thực tế» / «lý thuyết»; «per» ⇒ «/»', () => {
    expect(lamSachChu('số mol nitrobenzene thực tế (tính ngược ×100/H)')).toBe('số mol nitrobenzene (tính ngược ×100/H)')
    expect(lamSachChu('gam SO₂ theo lý thuyết (nhân M = 64)')).toBe('gam SO₂ (nhân M = 64)')
    expect(lamSachChu('khối lượng benzene (kg per kmol)')).toBe('khối lượng benzene (kg/kmol)')
    expect(lamSachChu('Lượng thực tế: tính xuôi × H/100')).toBe('Lượng: tính xuôi × H/100')
    expect(lamSachChu('số mol aniline (chia M = 93)')).toBe('số mol aniline (chia M = 93)')
  })
  it('làm sạch mọi chữ hiện, không đụng số / tên bước', () => {
    const ban = { qid: 'q', phienBan: 1, deNoiGi: 'Tính lượng thực tế', soDo: { nut: [{ chat: 'C_6H_6', soLieu: ['m thực tế = ?'] }], muiTen: [], chieu: 'nguoc' as const },
      buoc: [{ ten: 'm thực tế', thuaSo: [{ so: '100/60', nghia: 'số mol thực tế (tính ngược ×100/H)', denDay: 'tới đây là: số mol lý thuyết' }] }] }
    const r = lamSachChuHien(ban)
    expect(JSON.stringify([r.deNoiGi, r.soDo, r.buoc[0]!.thuaSo])).not.toMatch(/thực tế|lý thuyết/)
    expect(r.buoc[0]!.ten).toBe('m thực tế')
    expect(r.buoc[0]!.thuaSo[0]!.so).toBe('100/60')
    expect(ban.deNoiGi).toBe('Tính lượng thực tế')
  })
})
