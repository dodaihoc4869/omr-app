// BỘ NÃO — THỬ THÁCH RIÊNG HÔM NAY (`thuThach` + `loiMoi`, Code 1, 21/09/2026; thầy chốt 11:31, hợp đồng `docs/hop-dong-thu-thach-rieng-2109.md`).
// Luật cứng: hai trường đi cùng nhau; sai khuôn ⇒ CHỈ bỏ phần thử thách (phần tử vẫn hợp lệ, núm giữ); lời mời phải có ≥ 1 số THẬT trong thẻ, mọi số phải có trong thẻ, không nêu số câu sẽ làm,
// không hứa điều không chắc, không nhãn năng lực / so với bạn / gọi tên, tên thú chỉ lấy từ thẻ; `cao_hon_mot_bac` chỉ khi đúng ≥ 80 % theo số trong thẻ.
import { describe, it, expect } from 'vitest'
import { HAN_MUC_BO_NAO, kiemKhuon, kiemThuThach, lamSachDauRa, tapSoCuaThe, type DauRaEm, type TheDeKiem } from '../src/lib/bo-nao-khuon'
import { LOI_CAM, LOI_TOT, THE, THE_KHONG_THU } from './_bo-nao-thu-thach-mau'

const nen = (): DauRaEm => ({
  biDanh: 'A17',
  doTinCay: 0.8,
  nhip: { lech: 0, khoiDong: 2 },
  dang: [],
  khacPhuc: [],
  co: 'khong',
  loiNhanChoEm: '',
  loiNhanChoPhuHuynh: '',
  thuTuan: '',
  goiYChoThay: { chu: '', hanhDong: 'khong', dang: '' },
  ghiChuHlv: '',
  canSau: false,
})
const ghep = (chu: string, dang: string[] = ['ESTE.THUY_PHAN'], soCau = 6, bac = 'dung_bac'): DauRaEm => ({ ...nen(), thuThach: { dang, soCau, bac } as DauRaEm['thuThach'], loiMoi: chu })
const kt = (d: Record<string, unknown>, the: TheDeKiem = THE) => kiemThuThach(d, the, tapSoCuaThe(the))
const CHU_OK = LOI_TOT[0].chu
const bo = (d: DauRaEm, the: TheDeKiem = THE) => {
  const k = kiemKhuon(d, the)
  expect(k.hopLe, JSON.stringify(k.lyDo)).toBe(true) // sai thử thách KHÔNG làm hỏng cả phần tử
  return k
}

describe('thuThach + loiMoi — hợp lệ', () => {
  it('6 lời mẫu tốt (khung 3 ý) đều qua; phần tử hợp lệ, không có boLoi; lamSachDauRa giữ nguyên hai trường', () => {
    for (const { chu, the, dang } of LOI_TOT) {
      const d = ghep(chu, dang)
      expect(kt(d as unknown as Record<string, unknown>, the), chu).toEqual([])
      const k = bo(d, the)
      expect(k.boLoi, chu).toBeUndefined()
      expect(lamSachDauRa(d, k).loiMoi).toBe(chu)
      expect(lamSachDauRa(d, k).thuThach).toEqual(d.thuThach)
    }
  })
  it('4 lời mẫu cấm đều bị chặn với đúng lý do; CHỈ bỏ phần thử thách (phần tử hợp lệ, boLoi = ["thuThach"], lamSachDauRa xoá cả hai trường)', () => {
    for (const { chu, mau } of LOI_CAM) {
      const d = ghep(chu)
      const k = bo(d)
      expect(k.boLoi, chu).toEqual(['thuThach'])
      expect((k.canhBao ?? []).join(' | '), chu).toContain(mau)
      const sach = lamSachDauRa(d, k)
      expect('thuThach' in sach || 'loiMoi' in sach).toBe(false)
    }
  })
  it('phần tử KHÔNG có thuThach/loiMoi (bản cũ) ⇒ Y HỆT: không boLoi, không cảnh báo thử thách', () => {
    const k = kiemKhuon(nen(), THE)
    expect(k.hopLe).toBe(true)
    expect(k.boLoi).toBeUndefined()
    expect(k.canhBao).toBeUndefined()
    expect(kt({ loiMoi: '' })).toEqual([])
  })
})

describe('thuThach — khuôn', () => {
  const T = (t: unknown, chu = CHU_OK) => kt({ thuThach: t, loiMoi: chu })
  const CO = (t: unknown, mau: string) => expect(T(t).join(' | ')).toContain(mau)
  it('đi cùng nhau: thiếu một trong hai ⇒ bỏ (lý do rõ)', () => {
    expect(kt({ thuThach: { dang: ['ESTE.THUY_PHAN'], soCau: 6, bac: 'dung_bac' } }).join()).toContain('đi cùng nhau')
    expect(kt({ loiMoi: CHU_OK }).join()).toContain('đi cùng nhau')
    expect(kt({ thuThach: null, loiMoi: CHU_OK }).join()).toContain('đi cùng nhau')
  })
  it('dang: 1–2 mã, có trong thẻ, không lặp, đúng kiểu', () => {
    CO({ dang: [], soCau: 6, bac: 'dung_bac' }, 'thuThach.dang phải là mảng 1–2')
    CO({ dang: ['ESTE.THUY_PHAN', 'CARB.PHAN_LOAI', 'LIPID.BEO'], soCau: 6, bac: 'dung_bac' }, 'thuThach.dang phải là mảng 1–2')
    CO({ dang: 'ESTE.THUY_PHAN', soCau: 6, bac: 'dung_bac' }, 'thuThach.dang phải là mảng')
    CO({ dang: ['KHONG.CO'], soCau: 6, bac: 'dung_bac' }, 'không có trong thẻ')
    CO({ dang: ['ESTE.THUY_PHAN', 'ESTE.THUY_PHAN'], soCau: 6, bac: 'dung_bac' }, 'lặp')
    CO({ dang: [7], soCau: 6, bac: 'dung_bac' }, 'không hợp lệ')
    expect(T({ dang: ['ESTE.THUY_PHAN', 'LIPID.BEO'], soCau: 6, bac: 'dung_bac' })).toEqual([])
  })
  it('soCau: số nguyên 3–8 (biên và kiểu lạ)', () => {
    for (const v of [2, 9, 0, -3, 3.5, '6', null, Number.NaN, Infinity]) CO({ dang: ['ESTE.THUY_PHAN'], soCau: v, bac: 'dung_bac' }, 'soCau phải là số nguyên trong [3, 8]')
    for (const v of [3, 8]) expect(T({ dang: ['ESTE.THUY_PHAN'], soCau: v, bac: 'dung_bac' })).toEqual([])
    expect(HAN_MUC_BO_NAO.THU_THACH_SO_CAU_TOI_THIEU).toBe(3)
    expect(HAN_MUC_BO_NAO.THU_THACH_SO_CAU_TOI_DA).toBe(8)
  })
  it('bac: đúng ba giá trị; khoá lạ bị từ chối; không phải đối tượng bị từ chối', () => {
    CO({ dang: ['ESTE.THUY_PHAN'], soCau: 6, bac: 'kho_hon' }, 'thuThach.bac phải là')
    CO({ dang: ['ESTE.THUY_PHAN'], soCau: 6, bac: 'dung_bac', maCau: ['q1'] }, 'khoá lạ')
    CO('dung_bac', 'không phải đối tượng')
    CO(['a'], 'không phải đối tượng')
    for (const b of ['dung_bac', 'thap_hon_mot_bac']) expect(T({ dang: ['ESTE.THUY_PHAN'], soCau: 6, bac: b })).toEqual([])
  })
})

describe('cao_hon_mot_bac — chỉ khi đúng ≥ 80 % theo số trong thẻ', () => {
  const cao = (dang: string[], the: TheDeKiem = THE) => kt({ thuThach: { dang, soCau: 6, bac: 'cao_hon_mot_bac' }, loiMoi: CHU_OK }, the)
  it('dạng đúng 8/9 (lam7 9, sai7 1) + 3 ngày chung 92 % ⇒ được', () => {
    expect(cao(['ESTE.THUY_PHAN'])).toEqual([])
  })
  it('dạng đúng dưới 80 % (Carb 3/6) ⇒ không; dạng ít mẫu (< 5 câu, Lipid 4/4) ⇒ không', () => {
    expect(cao(['CARB.PHAN_LOAI']).join()).toContain('chưa đúng ≥ 80 %')
    expect(cao(['LIPID.BEO']).join()).toContain('chưa đúng ≥ 80 %')
  })
  it('một trong hai dạng không đạt ⇒ không; 3 ngày chung dưới 80 % hoặc thiếu ⇒ không; thẻ không có dangChuY ⇒ không', () => {
    expect(cao(['ESTE.THUY_PHAN', 'CARB.PHAN_LOAI']).join()).toContain('CARB.PHAN_LOAI')
    expect(cao(['ESTE.THUY_PHAN'], { ...THE, cau: { ...(THE.cau as object), tiLe3: 0.7 } }).join()).toContain('3 ngày gần nhất')
    expect(cao(['ESTE.THUY_PHAN'], { ...THE, cau: { ...(THE.cau as object), tiLe3: null } }).join()).toContain('3 ngày gần nhất')
    const { dangChuY: _d, ...khong } = THE as Record<string, unknown>
    void _d
    expect(cao(['ESTE.THUY_PHAN'], khong as TheDeKiem).join()).toContain('chưa đúng ≥ 80 %')
  })
  it('dạng đúng nhiều nhưng đang YẾU theo khắc phục (< 0,7) ⇒ không', () => {
    const the = { ...THE, dangChuY: [{ ma: 'ESTE.THUY_PHAN', gap: 9, sai: 1, bac: 1, tiLeKhacPhuc: 0.5, lam7: 9, sai7: 1 }] } as TheDeKiem
    expect(cao(['ESTE.THUY_PHAN'], the).join()).toContain('chưa đúng ≥ 80 %')
  })
  it('đúng 80 % tròn (4/5) được; 3/5 = 60 % không', () => {
    const mk = (sai7: number) => ({ ...THE, dangChuY: [{ ma: 'ESTE.THUY_PHAN', gap: 9, sai: 1, bac: 1, tiLeKhacPhuc: 0.9, lam7: 5, sai7 }] }) as TheDeKiem
    expect(cao(['ESTE.THUY_PHAN'], mk(1))).toEqual([])
    expect(cao(['ESTE.THUY_PHAN'], mk(2)).join()).toContain('chưa đúng ≥ 80 %')
  })
})

describe('loiMoi — luật chữ', () => {
  const L = (chu: string, the: TheDeKiem = THE, soCau = 6) => kt(ghep(chu, ['ESTE.THUY_PHAN'], soCau) as unknown as Record<string, unknown>, the).join(' | ')
  it('phải có ≥ 1 số; MỌI số phải có trong thẻ', () => {
    expect(L('Hôm nay em thử mấy câu Thuỷ phân ester nhé.')).toContain('ít nhất một con số')
    expect(L('Rồng Lửa còn thiếu 41 EXP, thử mấy câu nhé.')).toContain('số không có trong thẻ: 41')
    expect(L('Rồng Lửa còn thiếu 40 EXP và có 3 mảnh khiên, thử mấy câu nhé.')).toBe('') // 3, 40 đều có trong thẻ
  })
  it('độ dài ≤ 200; một dòng; không ký tự lạ; không emoji; không dấu gạch dài', () => {
    expect(L(`Em đúng lại 4 câu. ${'a'.repeat(200)}`)).toContain('quá 200 ký tự')
    expect(L('Em đúng lại 4 câu.\nThử mấy câu nhé.')).toContain('ký tự lạ hoặc xuống dòng')
    expect(L('Em đúng lại 4 câu 🔥 thử mấy câu nhé.')).toContain('emoji')
    expect(L('Em đúng lại 4 câu — thử mấy câu nhé.')).toContain('gạch dài')
    expect(L('Em đúng lại 4 câu – thử mấy câu nhé.')).toContain('gạch dài')
    expect(L('Em đúng lại 4 câu, xem https://x.vn thử mấy câu nhé.')).toContain('ký tự lạ')
  })
  it('từ cấm lời cho em: nhãn năng lực, so với bạn, đáp án, phụ huynh…', () => {
    for (const t of ['nắm chắc', 'giỏi', 'yếu', 'các bạn', 'xếp hạng', 'đáp án', 'phụ huynh', 'cả lớp']) expect(L(`Em đúng lại 4 câu, ${t} thử mấy câu nhé.`), t).toContain('từ cấm')
  })
  it('không hứa điều không chắc / không gọi tên', () => {
    for (const t of ['chắc chắn', 'đảm bảo', 'nhất định', 'xong là', 'chỉ cần', 'chắc sẽ']) expect(L(`Em đúng lại 4 câu, ${t} lên cấp, thử mấy câu nhé.`), t).toContain('hứa điều không chắc')
    expect(L('Minh ơi, em đúng lại 4 câu, thử mấy câu nhé.')).toContain('gọi tên')
  })
  it('KHÔNG nêu số câu sẽ làm: "thử N câu" bị chặn với mọi N; "làm/luyện N câu" chặn khi N = soCau; số câu quá khứ trong thẻ vẫn được', () => {
    expect(L('Hôm qua em đúng lại 4 câu, hôm nay thử 4 câu nữa nhé.')).toContain('số câu')
    expect(L('Hôm qua em đúng lại 4 câu, hôm nay thử ngay 4 câu nữa nhé.')).toContain('số câu')
    expect(L('Hôm qua em đúng lại 4 câu, hôm nay làm 4 câu nữa nhé.', THE, 4)).toContain('số câu sẽ làm')
    expect(L('Hôm qua em đúng lại 4 câu, hôm nay làm mấy câu nữa nhé.', THE, 4)).toBe('')
    expect(L('Hôm qua em làm 8 câu, đúng 7 câu. Hôm nay thử mấy câu nhé.', THE, 6)).toBe('')
  })
  it('thú: nhắc thú / tên riêng CHỈ khi thẻ có thanThu.ten và đúng tên ấy', () => {
    expect(L('Hôm qua em đúng lại 4 câu. Thần thú của em còn thiếu 40 EXP.', THE_KHONG_THU)).toContain('thẻ không có thanThu')
    expect(L('Rồng Lửa còn thiếu 40 EXP, thử mấy câu nhé.', THE_KHONG_THU)).toContain('tên riêng không có trong thẻ: Rồng Lửa')
    expect(L('Long Hoả còn thiếu 40 EXP, thử mấy câu nhé.', THE)).toContain('tên riêng không có trong thẻ: Long Hoả')
    expect(L('Rồng Lửa còn thiếu 40 EXP, thử mấy câu nhé.', THE)).toBe('')
    expect(L('Thần thú Rồng Lửa còn thiếu 40 EXP, thử mấy câu nhé.', THE)).toBe('') // nhắc thú khi thẻ có thanThu ⇒ được
    expect(L('Hôm nay em thử mấy câu, chuỗi 4 ngày rồi, thêm EXP nữa.', THE_KHONG_THU)).toBe('') // từ toàn hoa (EXP) và chữ đầu câu không phải tên riêng
  })
})

describe('gắn vào kiemKhuon — sai thử thách CHỈ bỏ phần thử thách, các phần khác vẫn xét như cũ', () => {
  it('phần tử có lời nhắn hợp lệ + thử thách sai ⇒ hợp lệ, boLoi ["thuThach"]; lời nhắn giữ', () => {
    const d = { ...ghep('Em nắm chắc 4 câu rồi.'), loiNhanChoEm: 'Hôm nay em đúng 7 trên 8 câu. Chuỗi 4 ngày rồi, giữ nhịp nhé.' }
    const k = kiemKhuon(d, THE)
    expect(k.hopLe, JSON.stringify(k.lyDo)).toBe(true)
    expect(k.boLoi).toEqual(['thuThach'])
    const sach = lamSachDauRa(d, k)
    expect(sach.loiNhanChoEm).toBe(d.loiNhanChoEm)
    expect('thuThach' in sach).toBe(false)
  })
  it('lời nhắn cho em sai VẪN làm hỏng cả phần tử như cũ (thử thách hợp lệ không cứu được)', () => {
    const d = { ...ghep(CHU_OK), loiNhanChoEm: 'Em nắm chắc dạng này rồi.' }
    expect(kiemKhuon(d, THE).hopLe).toBe(false)
  })
  it('cả thử thách sai lẫn lời cho phụ huynh bị bỏ ⇒ boLoi có cả hai, phần tử hợp lệ', () => {
    const d = { ...ghep('Em nắm chắc 4 câu rồi.'), loiNhanChoPhuHuynh: 'Con hôm nay đúng 7 trên 8 câu.' }
    const k = kiemKhuon(d, THE)
    expect(k.hopLe).toBe(true)
    expect(k.boLoi).toEqual(expect.arrayContaining(['thuThach', 'loiNhanChoPhuHuynh']))
  })
})
