// THẦN THÚ MỖI NGÀY · ĐỢT 1 · MÀN HỌC SINH (Code 2; Boss 21/09; Code 3 làm rõ số): lời nhắc "Cho ăn" ở Bảng nhiệm vụ, "Dự trữ đủ N ngày ăn" ở ống nghiệm, thẻ cuối chặng nói ĐÚNG
// ("EXP đã vào ống nghiệm · còn N EXP nữa lên cấp · ống nghiệm có M EXP · hôm nay thú còn ăn được K EXP"), câu báo trần EXP game 120/ngày, và lý do `tienBo.thieuDat` ("cần đúng thêm N câu").
// Mọi số do máy chủ; thiếu MỘT số ⇒ ẩn hết (Pages đi trước Worker được); phụ huynh không thấy gì về thú.
// 27/10: thẻ "Cho ăn" (`bang-nhiem-vu/TheChoAn`) đã gỡ khỏi src/ vì không màn nào dùng ⇒ các phép kiểm viewChoAn / TheChoAn bỏ theo.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import TheCuoiChang from '../src/components/bang-nhiem-vu/TheCuoiChang'
import { docThieuDat, dongGoiBanNho, phucHoiBanNho, tuKeHoachNgay, type KeHoachNgayMayChu } from '../src/lib/nhiem-vu-adapter'
import { docKetQuaChang, theChangView } from '../src/lib/btvn-ca-nhan-kieu'
import { PETS } from '../src/game/than-thu-v2/core'
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
