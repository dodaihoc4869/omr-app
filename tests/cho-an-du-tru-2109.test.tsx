// THẦN THÚ MỖI NGÀY · ĐỢT 1 · MÀN HỌC SINH (Code 2; Boss 21/09; Code 3 làm rõ số): lời nhắc "Cho ăn" ở Bảng nhiệm vụ, "Dự trữ đủ N ngày ăn" ở ống nghiệm, thẻ cuối chặng nói ĐÚNG
// ("EXP đã vào ống nghiệm · còn N EXP nữa lên cấp · ống nghiệm có M EXP · hôm nay thú còn ăn được K EXP"), câu báo trần EXP game 120/ngày, và lý do `tienBo.thieuDat` ("cần đúng thêm N câu").
// Mọi số do máy chủ; thiếu MỘT số ⇒ ẩn hết (Pages đi trước Worker được); phụ huynh không thấy gì về thú.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import BangNhiemVu from '../src/components/bang-nhiem-vu/BangNhiemVu'
import TheChoAn, { viewChoAn } from '../src/components/bang-nhiem-vu/TheChoAn'
import TheCuoiChang from '../src/components/bang-nhiem-vu/TheCuoiChang'
import DaoCuaEm from '../src/game/than-thu-v2/dao/DaoCuaEm'
import { duTruNgayAn, lyDoTranExpGame } from '../src/game/than-thu-v2/dao/dao-core'
import type { DaoProfile } from '../src/game/than-thu-v2/dao/kieu'
import { docThieuDat, dongGoiBanNho, phucHoiBanNho, tuKeHoachNgay, type KeHoachNgayMayChu } from '../src/lib/nhiem-vu-adapter'
import { docKetQuaChang, theChangView } from '../src/lib/btvn-ca-nhan-kieu'
import { PETS } from '../src/game/than-thu-v2/core'

vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
afterEach(cleanup)
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const NOW = Date.parse('2026-09-23T10:00:00+07:00')
const gio = (h: number) => new Date(NOW + h * 3600_000).toISOString()
const vm = (o: object) => ({ thuTu: 1, batBuoc: false, khan: false, cong: null, hien: true, nhan: null, trangThai: 'cho', ghiChu: '', chiTiet: {}, hanCung: null, hanMem: null, soCau: 6, ...o })
const TUY_CHON = [vm({ id: 'on_lai:x', loai: 'on_lai', soCau: 3, nhan: 'tuy_chon', ghiChu: 'Ôn 3 câu', chiTiet: { qid: ['a', 'b', 'c'] } }), vm({ id: 'than_thu:X', loai: 'than_thu', soCau: 6, nhan: 'tuy_chon', ghiChu: 'Luyện dạng yếu' })]
const BAT_BUOC = [vm({ id: 'btvn_lo:BT-A:0', loai: 'btvn_lo', batBuoc: true, hanCung: gio(5), chiTiet: { ma: 'BT-A', chiSo: 0, tongLo: 1 } })]
const kh = (tienBo: object, exp: object | null = null, viec: unknown[] = BAT_BUOC): KeHoachNgayMayChu =>
  ({
    ok: true,
    nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
    viec: viec as any,
    canhBao: [],
    quaHan: [],
    tienBo: { daLamCau: 9, lenBac: 3, conThieu: 0, ...tienBo } as any,
    chuoiDat: 2,
    lanNghi: false,
    capNhatLuc: gio(-0.1),
    ...(exp ? { exp } : {}),
  }) as KeHoachNgayMayChu
const phu = { dsBtvn: [{ maBtvn: 'BT-A', maCa: 'CA-A', tenBtvn: 'BTVN A', soCau: 12 }], dsMomGiao: [] as any[] }
const THU = { kieu: 'co', pet: PETS[3]!.id, cap: 12, ten: 'Hoả Long' } as const
const EXP3 = { expConThieu: 340, ongNghiem: 480, hapThuConLaiHomNay: 200 }
const EXP = (them: object = EXP3) => ({ homNay: 50, chiTietHomNay: [], manhKhien: null, ...them })
const dl = (exp: object | null = EXP(), tienBo: object = {}, viec?: unknown[]) => ({ ...tuKeHoachNgay(kh(tienBo, exp, viec), NOW, phu), thanThu: THU as any })

describe('adapter — ba số Đợt 1 của khối exp', () => {
  it('đủ cả ba ⇒ exp.thu; thiếu MỘT / âm / không phải số ⇒ vắng hết (không đoán)', () => {
    expect(dl().exp!.thu).toEqual({ expConThieu: 340, ongNghiem: 480, hapThuConLaiHomNay: 200 })
    for (const hong of [{ expConThieu: 340, ongNghiem: 480 }, { ongNghiem: 480, hapThuConLaiHomNay: 200 }, { ...EXP3, ongNghiem: -1 }, { ...EXP3, hapThuConLaiHomNay: 'x' }, { ...EXP3, expConThieu: NaN }, { ...EXP3, ongNghiem: null }]) {
      expect(dl(EXP(hong)).exp!.thu, JSON.stringify(hong)).toBeUndefined()
    }
    expect(dl(null).exp).toBeNull()
  })
  it('0 hợp lệ (chưa học ⇒ hôm nay ăn được 0); số lẻ làm tròn xuống', () => {
    expect(dl(EXP({ expConThieu: 10.9, ongNghiem: 0, hapThuConLaiHomNay: 0 })).exp!.thu).toEqual({ expConThieu: 10, ongNghiem: 0, hapThuConLaiHomNay: 0 })
  })
  it('KHÔNG lưu vào bản nhớ (số ví cũ sẽ nói sai khi mở lại)', () => {
    const goi = dongGoiBanNho(dl(), NOW)!
    const lai = phucHoiBanNho(JSON.parse(JSON.stringify(goi)), NOW + 1000)!
    expect(lai.exp).toBeTruthy()
    expect(lai.exp!.thu).toBeUndefined()
  })
})

describe('tienBo.thieuDat — "cần đúng thêm N câu" (Điều 7)', () => {
  const CD = { soCauDung: 2, chu: 'cần đúng thêm 2 câu' }
  it('docThieuDat: chữ máy chủ; thiếu chữ ⇒ tự viết từ số; số ≤ 0 / hỏng / thiếu ⇒ null', () => {
    expect(docThieuDat({ daLamCau: 1, thieuDat: CD })).toBe('cần đúng thêm 2 câu')
    expect(docThieuDat({ daLamCau: 1, thieuDat: { soCauDung: 3 } })).toBe('cần đúng thêm 3 câu')
    expect(docThieuDat({ daLamCau: 1, thieuDat: { soCauDung: 3, chu: '   ' } })).toBe('cần đúng thêm 3 câu')
    expect(docThieuDat({ daLamCau: 1, thieuDat: { soCauDung: 2, chu: ' cần  đúng   thêm 2 câu ' } })).toBe('cần đúng thêm 2 câu')
    for (const hong of [undefined, {}, { soCauDung: 0 }, { soCauDung: -1 }, { soCauDung: 'a' }, { chu: 'cần đúng thêm 2 câu' }, null as never]) expect(docThieuDat({ daLamCau: 1, thieuDat: hong as any }), JSON.stringify(hong)).toBeNull()
    expect(docThieuDat(undefined)).toBeNull()
  })
  it('nguồn không có datNgay: đủ số câu LÀM nhưng thiếu câu ĐÚNG ⇒ "Để đạt hôm nay: cần đúng thêm 2 câu", KHÔNG nói "đã đủ số câu tối thiểu"', () => {
    const g = dl(null, { thieuDat: CD }).tienDo.ghiChu!
    expect(g).toBe('Đã làm 9 câu, 3 câu lên bậc · Để đạt hôm nay: cần đúng thêm 2 câu')
    expect(g).not.toContain('đã đủ số câu tối thiểu')
  })
  it('còn thiếu cả số câu làm ⇒ hai vế, có nhãn "câu"', () => {
    expect(dl(null, { conThieu: 3, thieuDat: CD }).tienDo.ghiChu).toBe('Đã làm 9 câu, 3 câu lên bậc · Để đạt hôm nay: làm thêm 3 câu; cần đúng thêm 2 câu')
  })
  it('không có thieuDat ⇒ câu cũ nguyên (đủ câu; còn thiếu câu)', () => {
    expect(dl(null).tienDo.ghiChu).toContain('đã đủ số câu tối thiểu hôm nay')
    expect(dl(null, { conThieu: 4 }).tienDo.ghiChu).toContain('còn 4 câu là đạt hôm nay')
  })
  it('có datNgay: gộp lý do của máy chủ với thieuDat; datNgay nói đạt mà thieuDat còn ⇒ vẫn CHƯA đạt', () => {
    const e = (datNgay: object) => EXP({ datNgay })
    expect(dl(e({ dat: false, thieu: ['tre_nhip'], daLam: 9, toiThieu: 6 }), { thieuDat: CD }).tienDo.ghiChu).toBe('Đã làm 9 câu, 3 câu lên bậc · Để đạt hôm nay: làm nốt việc bắt buộc đang trễ nhịp; cần đúng thêm 2 câu')
    expect(dl(e({ dat: true, thieu: [], daLam: 9, toiThieu: 6 }), { thieuDat: CD }).tienDo.ghiChu).toBe('Đã làm 9 câu, 3 câu lên bậc · Để đạt hôm nay: cần đúng thêm 2 câu')
    expect(dl(e({ dat: true, thieu: [], daLam: 9, toiThieu: 6 })).tienDo.ghiChu).toBe('Đã làm 9 câu, 3 câu lên bậc · đã đạt hôm nay')
  })
  it('máy chủ nói tienBo.dat=true nhưng còn thieuDat ⇒ KHÔNG thẻ mừng "xong việc hôm nay"', () => {
    expect(dl(null, { dat: true }, TUY_CHON).daXongHomNay).toEqual({ daLamCau: 9, lenBac: 3 })
    expect(dl(null, { dat: true, thieuDat: CD }, TUY_CHON).daXongHomNay).toBeNull()
  })
})

describe('viewChoAn — khi nào thú "đói"', () => {
  const v = (exp: object | null, thanThu: any = THU) => viewChoAn({ exp: dl(exp).exp, thanThu })
  it('ống nghiệm > 0 và hôm nay còn ăn được ⇒ thẻ: tên thú thật, số ống nghiệm, dự trữ = ⌊ống ÷ 200⌋', () => {
    expect(v(EXP())).toEqual({ ten: 'Hoả Long', ongNghiem: 480, duTruNgay: 2 })
    expect(v(EXP({ ...EXP3, ongNghiem: 199 }))!.duTruNgay).toBeNull()
    expect(v(EXP({ ...EXP3, ongNghiem: 200 }))!.duTruNgay).toBe(1)
    expect(v(EXP({ ...EXP3, ongNghiem: 400 }))!.duTruNgay).toBe(2)
    expect(v(EXP({ ...EXP3, ongNghiem: 399 }))!.duTruNgay).toBe(1)
  })
  it('KHÔNG thẻ: ống nghiệm 0 · hôm nay không ăn được nữa · cấp cao nhất (còn 0 EXP lên cấp) · thiếu số · chưa có thú', () => {
    expect(v(EXP({ ...EXP3, ongNghiem: 0 }))).toBeNull()
    expect(v(EXP({ ...EXP3, hapThuConLaiHomNay: 0 }))).toBeNull()
    expect(v(EXP({ ...EXP3, expConThieu: 0 }))).toBeNull()
    expect(v(EXP({ ongNghiem: 480, hapThuConLaiHomNay: 200 }))).toBeNull()
    expect(v(null)).toBeNull()
    expect(v(EXP(), { kieu: 'chua_chon' })).toBeNull()
    expect(v(EXP(), { kieu: 'chua_biet' })).toBeNull()
  })
  it('thú không có biệt danh ⇒ tên loài; lạ ⇒ "Thần thú"', () => {
    expect(v(EXP(), { kieu: 'co', pet: PETS[3]!.id, cap: 3 })!.ten).toBe(PETS[3]!.name)
    expect(v(EXP(), { kieu: 'co', pet: 'khong_co', cap: 3 })!.ten).toBe('Thần thú')
  })
})

describe('TheChoAn + Bảng nhiệm vụ', () => {
  const ve = (d: any, extra: Record<string, unknown> = {}, vaiTro: 'hocsinh' | 'phuhuynh' = 'hocsinh') =>
    render(<BangNhiemVu vaiTro={vaiTro} hoTen="Đỗ Minh" now={NOW} duLieu={d} onHanhDong={() => {}} taiVinhDanh={async () => null} {...extra} />)
  it('thẻ đúng chữ; MỘT đích chạm ≥ 48 px (button); bấm ⇒ vào Đảo', () => {
    const onMoThanThu = vi.fn()
    const { container } = ve(dl(), { onMoThanThu })
    const the = container.querySelector('[data-vung="cho-an"]') as HTMLElement
    expect(the.tagName).toBe('BUTTON')
    expect(the.textContent).toContain('Hoả Long đang đói')
    expect(the.textContent).toContain('Ống nghiệm có 480 EXP · dự trữ đủ 2 ngày ăn')
    expect(the.textContent).toContain('Cho ăn')
    expect(the.getAttribute('aria-label')).toBe('Hoả Long đang đói. Ống nghiệm có 480 EXP. Chạm để cho Hoả Long ăn')
    expect(container.querySelectorAll('[data-vung="cho-an"]')).toHaveLength(1)
    fireEvent.click(the)
    expect(onMoThanThu).toHaveBeenCalledTimes(1)
  })
  it('ống nghiệm < 200 ⇒ có thẻ nhưng KHÔNG câu "dự trữ"; không số "0 ngày" bao giờ', () => {
    const { container } = ve(dl(EXP({ ...EXP3, ongNghiem: 120 })), { onMoThanThu: () => {} })
    const t = container.querySelector('[data-vung="cho-an"]')!.textContent!
    expect(t).toContain('Ống nghiệm có 120 EXP')
    expect(t).not.toMatch(/dự trữ|0 ngày/)
  })
  it('ẨN: thiếu số máy chủ / không đói / thiếu onMoThanThu / phụ huynh (không một chữ về thú)', () => {
    expect(ve(dl(EXP({ ongNghiem: 480 })), { onMoThanThu: () => {} }).container.querySelector('[data-vung="cho-an"]')).toBeNull()
    cleanup()
    expect(ve(dl(EXP({ ...EXP3, hapThuConLaiHomNay: 0 })), { onMoThanThu: () => {} }).container.querySelector('[data-vung="cho-an"]')).toBeNull()
    cleanup()
    expect(ve(dl(), {}).container.querySelector('[data-vung="cho-an"]')).toBeNull()
    cleanup()
    const ph = ve(dl(), { onMoThanThu: () => {} }, 'phuhuynh').container
    expect(ph.querySelector('[data-vung="cho-an"]')).toBeNull()
    expect(ph.textContent).not.toMatch(/đang đói|ống nghiệm|Cho ăn/)
  })
  it('TheChoAn dựng thẳng: tên dài không vỡ, số ≥ 1000 có dấu chấm', () => {
    render(<TheChoAn v={{ ten: 'Một Cái Tên Rất Dài Của Thần Thú', ongNghiem: 1200, duTruNgay: 6 }} onMo={() => {}} />)
    expect(screen.getByRole('button').textContent).toContain('1.200 EXP · dự trữ đủ 6 ngày ăn')
  })
})

describe('thẻ cuối chặng — EXP đã vào ống nghiệm', () => {
  const KQ = (exp: object) => ({ ok: true, loDaXong: 1, changDangMo: 1, chang: { chiSo: 0, soCau: 6, soDung: 5, xong: true }, ketQua: [], chuaLam: [], exp })
  it('docKetQuaChang: đủ 3 số ⇒ giữ; thiếu / âm ⇒ bỏ; số cũ (conLaiLenCap) vẫn đọc', () => {
    const ok = docKetQuaChang(KQ({ homNay: 46, conLaiLenCap: 30, ...EXP3 }))!
    expect(ok.exp).toEqual({ homNay: 46, conLaiLenCap: 30, thu: EXP3 })
    expect(docKetQuaChang(KQ({ homNay: 46, conLaiLenCap: 30, expConThieu: 5 }))!.exp).toEqual({ homNay: 46, conLaiLenCap: 30 })
    expect(docKetQuaChang(KQ({ homNay: 46, conLaiLenCap: null, ...EXP3, ongNghiem: -3 }))!.exp).toEqual({ homNay: 46, conLaiLenCap: null })
  })
  it('theChangView chuyển `thu` sang thẻ khi có; không có thì thẻ cũ nguyên', () => {
    expect(theChangView(docKetQuaChang(KQ({ homNay: 46, conLaiLenCap: 30, ...EXP3 }))!, 3)!.exp).toEqual({ homNay: 46, conLai: 30, thu: EXP3 })
    expect(theChangView(docKetQuaChang(KQ({ homNay: 46, conLaiLenCap: 30 }))!, 3)!.exp).toEqual({ homNay: 46, conLai: 30 })
  })
  const the = (exp: object) => render(<TheCuoiChang view={theChangView(docKetQuaChang(KQ(exp))!, 3)!} dong={() => {}} veBang={() => {}} />).container
  it('có ba số: "+46 EXP đã vào ống nghiệm" và câu ba vế có nhãn EXP; KHÔNG "hôm nay" ở ô số, KHÔNG "nữa là lên cấp" cũ', () => {
    const c = the({ homNay: 46, conLaiLenCap: 30, ...EXP3 })
    expect(c.querySelector('.tcc-exp-so')!.textContent).toBe('+46 EXPđã vào ống nghiệm')
    const phuChu = c.querySelector('[data-vung="exp-thu"]')!.textContent!
    expect(phuChu).toBe('Thần thú của em còn 340 EXP nữa lên cấp · ống nghiệm có 480 EXP · hôm nay thú còn ăn được 200 EXP')
    expect(c.textContent).not.toContain('nữa là lên cấp')
  })
  it('máy chủ cũ (không có ba số): chữ cũ nguyên', () => {
    const c = the({ homNay: 46, conLaiLenCap: 30 })
    expect(c.querySelector('.tcc-exp-so')!.textContent).toBe('+46 EXPhôm nay')
    expect(c.textContent).toContain('còn 30 EXP nữa là lên cấp')
    expect(c.querySelector('[data-vung="exp-thu"]')).toBeNull()
  })
  it('hôm nay ăn được 0 vẫn nói 0 (thật), không ẩn', () => {
    const c = the({ homNay: 46, conLaiLenCap: null, expConThieu: 340, ongNghiem: 480, hapThuConLaiHomNay: 0 })
    expect(c.querySelector('[data-vung="exp-thu"]')!.textContent).toContain('hôm nay thú còn ăn được 0 EXP')
  })
})

describe('Đảo — "Dự trữ đủ N ngày ăn" + câu trần EXP game', () => {
  const hoSo = (them: Partial<DaoProfile> = {}): DaoProfile => ({ nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 34, exp: 640, wallet: 0, mastery: [], ...them })
  const ve = (them: Partial<DaoProfile>) => render(<DaoCuaEm profile={hoSo(them)} onLenDuong={() => {}} onNap={() => {}} />).container
  it('duTruNgayAn: ⌊ví ÷ 200⌋, 0/âm/hỏng ⇒ null', () => {
    expect(duTruNgayAn(200)).toBe(1)
    expect(duTruNgayAn(399)).toBe(1)
    expect(duTruNgayAn(400)).toBe(2)
    for (const x of [0, 199, -50, NaN, Infinity * 0]) expect(duTruNgayAn(x), String(x)).toBeNull()
  })
  it('có hapThuHomNay + ví ≥ 200 ⇒ dòng "Dự trữ đủ 2 ngày ăn · ống nghiệm có 480 EXP" trong khối hấp thụ', () => {
    const c = ve({ hapThuHomNay: { da: 100, tran: 200 }, wallet: 480 })
    const d = c.querySelector('[data-vung="hap-thu"] [data-vung="du-tru"]')!
    expect(d.textContent).toBe('Dự trữ đủ 2 ngày ăn · ống nghiệm có 480 EXP')
  })
  it('ví < 200 ⇒ ẩn; máy chủ cũ (không hapThuHomNay) ⇒ ẩn dù ví lớn', () => {
    expect(ve({ hapThuHomNay: { da: 100, tran: 200 }, wallet: 150 }).querySelector('[data-vung="du-tru"]')).toBeNull()
    cleanup()
    expect(ve({ wallet: 900 }).querySelector('[data-vung="du-tru"]')).toBeNull()
  })
  it('lyDoTranExpGame: bị cắt (thưởng < thưởng gốc) ⇒ câu đủ 120 EXP; không cắt / thiếu ⇒ null (giữ câu máy chủ)', () => {
    expect(lyDoTranExpGame(0, 20, 'Lửa Nhỏ')).toEqual({ moc: 0, exp: 0, chu: '+0 EXP · hôm nay em đã đủ 120 EXP từ game. Muốn Lửa Nhỏ ăn no thì làm bài tập về nhà hoặc phần ôn lại.' })
    expect(lyDoTranExpGame(5, 20, 'Bông')!.chu).toBe('+5 EXP · hôm nay em đã đủ 120 EXP từ game. Muốn Bông ăn no thì làm bài tập về nhà hoặc phần ôn lại.')
    for (const [r, g] of [[20, 20], [20, undefined], [0, 0], [0, undefined], [30, 20], [undefined, undefined]] as const) expect(lyDoTranExpGame(r, g, 'X'), `${r}/${g}`).toBeNull()
  })
})

describe('khoá nguồn', () => {
  it('Đảo dùng lyDoTranExpGame trước câu của máy chủ; kiểu kết quả có thuongGoc; trần lấy từ Code 1 (không viết cứng 120/200 mới)', () => {
    expect(doc('src/game/than-thu-v2/dao/DaoThanThu.tsx')).toMatch(/lyDoTranExpGame\(reward,r\.thuongGoc,tenThu\(profile\)\)\?\?r\.lyDoThuong/)
    expect(doc('src/game/than-thu-v2/dao/kieu.ts')).toContain('thuongGoc?:number')
    const core = doc('src/game/than-thu-v2/dao/dao-core.ts')
    expect(core).toContain("from '../../../lib/hap-thu-ngay'")
    expect(core).toContain('HAP_THU_TOI_DA_NGAY=HAP_THU_DAT')
    expect(core).toContain('${TRAN_EXP_GAME_NGAY} EXP từ game')
  })
  it('không màu thô / emoji / lookbehind / .at( trong tệp mới; thẻ Cho ăn chỉ nhận prop, không gọi mạng', () => {
    const s = doc('src/components/bang-nhiem-vu/TheChoAn.tsx')
    expect(s).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\(\?<[=!]|\.at\(|fetch\(|randomUUID/)
    expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(s)).toBe(false)
    expect(doc('src/components/bang-nhiem-vu/BangNhiemVu.tsx')).toMatch(/\{!laPh && onMoThanThu && viewChoAnHs && <TheChoAn/)
  })
})
