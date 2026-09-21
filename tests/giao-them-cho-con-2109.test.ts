// GIAO THÊM BÀI CHO CON — hàm THUẦN `src/lib/giao-them-cho-con.ts` (Code 1, 21/09/2026; đề bài `prompt-ph-giao-them-bai-2109.md`).
// Nghiệm thu: không bao giờ vượt trần (10 · 6 · 4 · sau 21:30 ≤ 4 · tổng ngày ≤ 16) · liều ĐƠN ĐIỆU không tăng theo lượt / giờ / số câu đã giao · từ chối ĐÚNG ca (còn việc bắt buộc, gói trước chưa xong, hết lượt, hết trần, hết câu)
// và KHÔNG có soCau · thứ tự ưu tiên (ôn lại → dạng vấp → câu sai → thử sức) · thử sức chỉ khi đúng ≥ 80 % (≥ 5 câu), tối đa MỘT, không dạng yếu, không vượt bậc + 1 · không đòi quá số câu khả dụng · lời không nhắc game.
import { describe, expect, it } from 'vitest'
import {
  GIAO_THEM,
  duDieuKienThuSuc,
  lieuMongMuon,
  tinhGiaoThem,
  tranLuot,
  type DangCuaCon,
  type DauVaoGiaoThem,
  type KetQuaGiaoThem,
} from '../src/lib/giao-them-cho-con'
import { phutUocTinhChang } from '../src/lib/btvn-nang-do-lich'
import { mulberry32 } from '../src/lib/exam-shuffle'

/** ms UTC của một giờ Việt Nam. */
const vn = (gio: string) => Date.parse(`2026-09-21T${gio}:00+07:00`)
const dang = (ma: string, o: Partial<DangCuaCon> = {}): DangCuaCon => ({ ma, ten: `Dạng ${ma}`, bac: 1, vap: true, yeu: true, tiLeKhacPhuc: 0.6, soSai7: 3, soKhaDungDungBac: 5, soKhaDungThapHon: 3, soKhaDungCaoHon: 2, ...o })
const vao = (o: Partial<DauVaoGiaoThem> = {}): DauVaoGiaoThem => ({
  hoSo: { dang: [dang('A'), dang('B', { yeu: false, vap: false, bac: 1, tiLeKhacPhuc: 0.9 })], soCauDenLichOn: 3, soCauSaiChuaKhacPhuc: 4 },
  nganSach: { mucTieuCau: 20, daLam: 14, dung: 12, batBuocConLai: [] },
  bayGioMs: vn('19:30'),
  luot: 1,
  tongDaGiaoHomNay: 0,
  goiTruoc: null,
  giayMoiCau: 75,
  ...o,
})
const dem = (r: KetQuaGiaoThem, loai: string) => r.thanhPhan.filter((t) => t.loai === loai).reduce((s, t) => s + t.soCau, 0)

describe('hằng số và hàm nhỏ', () => {
  it('trần từng lượt: 10 · 6 · 4; kẹp lượt 1: 4–10, vượt mục tiêu 4–6; sau 21:30 ≤ 4; tổng 16; tối đa 3 lượt', () => {
    expect([1, 2, 3].map(tranLuot)).toEqual([10, 6, 4])
    expect(GIAO_THEM).toMatchObject({ SO_LUOT_TOI_DA: 3, TONG_CAU_TOI_DA_NGAY: 16, LUOT_1_TOI_THIEU: 4, LUOT_1_TOI_DA: 10, VUOT_MUC_TIEU_TOI_THIEU: 4, VUOT_MUC_TIEU_TOI_DA: 6, SAU_GIO_TOI_DA: 4, THU_SUC_TI_LE: 0.8 })
  })
  it('thử sức: đúng ≥ 80 % trong ≥ 5 câu (4/5 được; 7/10 không; 4/4 chưa đủ mẫu; dung > daLam bị kẹp)', () => {
    expect(duDieuKienThuSuc(5, 4)).toBe(true)
    expect(duDieuKienThuSuc(10, 7)).toBe(false)
    expect(duDieuKienThuSuc(4, 4)).toBe(false)
    expect(duDieuKienThuSuc(10, 8)).toBe(true)
    expect(duDieuKienThuSuc(5, 50)).toBe(true)
    expect(duDieuKienThuSuc(0, 0)).toBe(false)
    expect(duDieuKienThuSuc(Number.NaN, 3)).toBe(false)
  })
})

describe('liều: phần còn thiếu so với mục tiêu ngày', () => {
  it('lượt 1 chưa vượt mục tiêu: liều = phần còn thiếu, kẹp 4–10 (thiếu 8 ⇒ 8; thiếu 2 ⇒ 4; thiếu 30 ⇒ 10)', () => {
    const l = (daLam: number) => lieuMongMuon(1, { mucTieuCau: 20, daLam, dung: daLam }, vn('19:00'), 0).lieu
    expect(l(12)).toBe(8)
    expect(l(18)).toBe(4)
    expect(l(0)).toBe(10)
    expect(lieuMongMuon(1, { mucTieuCau: 40, daLam: 5, dung: 5 }, vn('19:00'), 0).lieu).toBe(10)
  })
  it('con ĐÃ vượt mục tiêu ⇒ gói nhẹ 4–6 (đúng < 60 % ⇒ 4 · 60–80 % ⇒ 5 · ≥ 80 % ⇒ 6)', () => {
    const l = (dung: number) => lieuMongMuon(1, { mucTieuCau: 10, daLam: 12, dung }, vn('19:00'), 0)
    expect(l(6)).toMatchObject({ lieu: 4, vuotMucTieu: true })
    expect(l(8)).toMatchObject({ lieu: 5 })
    expect(l(11)).toMatchObject({ lieu: 6 })
  })
  it('lượt 2 ≤ 6, lượt 3 ≤ 4; sau 21:30 ≤ 4; còn ít chỗ trong tổng 16 thì cắt theo chỗ còn lại', () => {
    const ns = { mucTieuCau: 40, daLam: 0, dung: 0 }
    expect(lieuMongMuon(2, ns, vn('19:00'), 10).lieu).toBe(6)
    expect(lieuMongMuon(3, ns, vn('19:00'), 12).lieu).toBe(4)
    expect(lieuMongMuon(1, ns, vn('21:31'), 0).lieu).toBe(4)
    expect(lieuMongMuon(1, ns, vn('21:30'), 0).lieu).toBe(10) // đúng 21:30:00 chưa "sau"
    expect(lieuMongMuon(1, ns, new Date('2026-09-21T14:30:01Z').getTime(), 0).lieu).toBe(4) // 21:30:01 giờ VN đã "sau"
    expect(lieuMongMuon(1, ns, vn('19:00'), 13).lieu).toBe(3) // 16 − 13
  })
})

describe('cơ cấu: ôn lại → dạng con vấp → câu sai → thử sức', () => {
  it('ưu tiên ôn lại trước: ôn 3 + vấp + sai đủ; tổng đúng bằng liều (thiếu 6 ⇒ 6 câu)', () => {
    const r = tinhGiaoThem(vao({ nganSach: { mucTieuCau: 20, daLam: 14, dung: 8, batBuocConLai: [] } })) // đúng 8/14 < 80 % ⇒ chưa có thử sức
    expect(r.tuChoi).toBeUndefined()
    expect(r.soCau).toBe(6)
    expect(r.thanhPhan.reduce((s, t) => s + t.soCau, 0)).toBe(6)
    expect(dem(r, 'on_lai')).toBe(3)
    expect(dem(r, 'dang_vap')).toBe(3)
    expect(dem(r, 'cau_sai')).toBe(0) // dạng vấp còn đủ câu ⇒ chưa tới câu sai
    expect(r.thanhPhan[0]).toMatchObject({ loai: 'on_lai', soCau: 3 })
    expect(r.phutUocTinh).toBe(phutUocTinhChang(6, 75))
  })
  it('ôn lại nhiều ⇒ ôn lại ăn hết chỗ, dạng vấp và câu sai không có phần', () => {
    const r = tinhGiaoThem(vao({ hoSo: { dang: [dang('A')], soCauDenLichOn: 30, soCauSaiChuaKhacPhuc: 9 } }))
    expect(r.thanhPhan).toEqual([{ loai: 'on_lai', soCau: 6 }])
  })
  it('dạng vấp chia VÒNG TRÒN, dạng yếu / sai nhiều trước; hết câu khả dụng của dạng này thì dồn sang dạng kia rồi tới câu sai', () => {
    const r = tinhGiaoThem(
      vao({
        hoSo: {
          dang: [dang('A', { soKhaDungDungBac: 1, soKhaDungThapHon: 0, soSai7: 9 }), dang('B', { soKhaDungDungBac: 2, soKhaDungThapHon: 0, soSai7: 1 }), dang('C', { yeu: false, soSai7: 5, soKhaDungDungBac: 9 })],
          soCauDenLichOn: 0,
          soCauSaiChuaKhacPhuc: 5,
        },
        nganSach: { mucTieuCau: 20, daLam: 10, dung: 5, batBuocConLai: [] },
      }),
    )
    // liều 10: vòng 1 A,B,C mỗi dạng 1 (A yếu + sai 9 trước, rồi B yếu, rồi C không yếu); A hết (1 câu); B thêm 1; C còn nhiều ⇒ dồn C tới đủ; câu sai chỉ khi mọi dạng hết
    expect(r.soCau).toBe(10)
    expect(r.thanhPhan.find((t) => t.dang === 'A')?.soCau).toBe(1)
    expect(r.thanhPhan.find((t) => t.dang === 'B')?.soCau).toBe(2)
    expect(dem(r, 'dang_vap')).toBe(10)
    expect(r.thanhPhan.map((t) => t.dang).filter(Boolean)).toEqual(['A', 'B', 'C']) // thứ tự: yếu + sai nhiều → yếu → còn lại
  })
  it('câu sai chỉ nhận phần khi ôn lại + dạng vấp đã hết chỗ', () => {
    const r = tinhGiaoThem(vao({ hoSo: { dang: [dang('A', { soKhaDungDungBac: 1, soKhaDungThapHon: 0 })], soCauDenLichOn: 1, soCauSaiChuaKhacPhuc: 9 }, nganSach: { mucTieuCau: 20, daLam: 14, dung: 10, batBuocConLai: [] } }))
    expect(r.thanhPhan).toEqual([{ loai: 'on_lai', soCau: 1 }, { loai: 'dang_vap', dang: 'A', bac: 'dung_bac', soCau: 1 }, { loai: 'cau_sai', soCau: 4 }])
    expect(r.soCau).toBe(6)
  })
  it('gợi ý bậc: dạng vấp NẶNG (tỉ lệ khắc phục < 0,5) ⇒ thap_hon_mot_bac khi còn câu thấp hơn; vấp nhẹ ⇒ dung_bac', () => {
    const r = tinhGiaoThem(vao({ hoSo: { dang: [dang('A', { tiLeKhacPhuc: 0.3 }), dang('B', { tiLeKhacPhuc: 0.65 })], soCauDenLichOn: 0, soCauSaiChuaKhacPhuc: 0 } }))
    expect(r.thanhPhan.find((t) => t.dang === 'A')?.bac).toBe('thap_hon_mot_bac')
    expect(r.thanhPhan.find((t) => t.dang === 'B')?.bac).toBe('dung_bac')
  })
  it('không đòi quá số câu khả dụng: chỉ có 4 câu phù hợp mà liều 10 ⇒ giao 4 và nói rõ', () => {
    const r = tinhGiaoThem(vao({ hoSo: { dang: [dang('A', { soKhaDungDungBac: 2, soKhaDungThapHon: 0 })], soCauDenLichOn: 1, soCauSaiChuaKhacPhuc: 1 }, nganSach: { mucTieuCau: 30, daLam: 0, dung: 0, batBuocConLai: [] } }))
    expect(r.soCau).toBe(4)
    expect(r.lyDo.join(' ')).toContain('Chỉ có 4 câu phù hợp nên gói nhỏ hơn dự định (10 câu)')
  })
})

describe('thử sức (bậc + 1): chỉ khi hôm nay đúng ≥ 80 %, tối đa MỘT câu', () => {
  const hs = { dang: [dang('A'), dang('B', { yeu: false, vap: false, bac: 1, tiLeKhacPhuc: 0.9, ten: 'Thuỷ phân ester' }), dang('C', { yeu: false, vap: false, bac: 2, soKhaDungCaoHon: 5 })], soCauDenLichOn: 3, soCauSaiChuaKhacPhuc: 4 }
  it('đúng 9/10 ⇒ đúng MỘT câu thử sức ở dạng ổn còn câu bậc + 1 (bậc cao nhất < Vận dụng), bậc gợi ý cao_hon_mot_bac; tổng vẫn bằng liều', () => {
    const r = tinhGiaoThem(vao({ hoSo: hs, nganSach: { mucTieuCau: 20, daLam: 10, dung: 9, batBuocConLai: [] } }))
    expect(r.thanhPhan.filter((t) => t.loai === 'thu_suc')).toEqual([{ loai: 'thu_suc', dang: 'B', bac: 'cao_hon_mot_bac', soCau: 1 }])
    expect(r.soCau).toBe(10)
    expect(r.lyDo.join(' ')).toContain('1 câu thử sức dạng Thuỷ phân ester vì hôm nay con đúng 9/10 câu')
  })
  it('đúng dưới 80 %, hoặc dưới 5 câu, ⇒ KHÔNG thử sức', () => {
    for (const [daLam, dung] of [[10, 7], [10, 0], [4, 4]]) expect(dem(tinhGiaoThem(vao({ hoSo: hs, nganSach: { mucTieuCau: 20, daLam, dung, batBuocConLai: [] } })), 'thu_suc'), `${dung}/${daLam}`).toBe(0)
  })
  it('không chọn dạng yếu, dạng đang vấp, dạng đã Vận dụng, hoặc dạng hết câu bậc + 1', () => {
    const kem = { dang: [dang('A'), dang('B', { yeu: false, vap: true }), dang('C', { yeu: false, vap: false, bac: 2 }), dang('D', { yeu: false, vap: false, bac: 1, soKhaDungCaoHon: 0 })], soCauDenLichOn: 3, soCauSaiChuaKhacPhuc: 4 }
    expect(dem(tinhGiaoThem(vao({ hoSo: kem, nganSach: { mucTieuCau: 20, daLam: 10, dung: 10, batBuocConLai: [] } })), 'thu_suc')).toBe(0)
  })
})

describe('TỪ CHỐI đúng ca — soCau 0, thanhPhan rỗng, lý do bằng số thật, không tính lượt', () => {
  const chuan = (r: KetQuaGiaoThem, ma: string) => {
    expect(r.tuChoi?.ma).toBe(ma)
    expect(r.soCau).toBe(0)
    expect(r.thanhPhan).toEqual([])
    expect(r.phutUocTinh).toBe(0)
    expect(r.lyDo).toEqual([])
    expect(r.tuChoi!.lyDo.length).toBeGreaterThan(0)
    return r.tuChoi!.lyDo.join(' ')
  }
  it('còn việc BẮT BUỘC hôm nay ⇒ từ chối bằng lời thật của chặng (ví dụ của thầy)', () => {
    const r = tinhGiaoThem(vao({ nganSach: { mucTieuCau: 20, daLam: 5, dung: 5, batBuocConLai: [{ loai: 'chang_btvn', soCau: 9, ten: 'chặng 2 bài tập về nhà', han: '12:00 trưa mai' }] } }))
    expect(chuan(r, 'con_viec_bat_buoc')).toBe('Hôm nay con còn chặng 2 bài tập về nhà, 9 câu, hạn 12:00 trưa mai — con nên làm phần này trước.')
  })
  it('nhiều việc bắt buộc ⇒ gộp số; việc 0 câu không tính; ôn lại bắt buộc cũng chặn', () => {
    const r = tinhGiaoThem(vao({ nganSach: { mucTieuCau: 20, daLam: 5, dung: 5, batBuocConLai: [{ loai: 'chang_btvn', soCau: 6, ten: 'chặng 1' }, { loai: 'on_lai', soCau: 4 }, { loai: 'khac', soCau: 0 }] } }))
    expect(chuan(r, 'con_viec_bat_buoc')).toContain('2 việc bắt buộc (10 câu)')
    expect(chuan(tinhGiaoThem(vao({ nganSach: { mucTieuCau: 20, daLam: 5, dung: 5, batBuocConLai: [{ loai: 'on_lai', soCau: 3 }] } })), 'con_viec_bat_buoc')).toContain('phần ôn lại, 3 câu')
    expect(tinhGiaoThem(vao({ nganSach: { mucTieuCau: 20, daLam: 5, dung: 5, batBuocConLai: [{ loai: 'khac', soCau: 0 }] } })).tuChoi).toBeUndefined()
  })
  it('gói trước CHƯA xong ⇒ không chồng gói mới (ví dụ của thầy: gói 19:40, mới làm 2/6)', () => {
    const r = tinhGiaoThem(vao({ bayGioMs: vn('20:30'), luot: 2, tongDaGiaoHomNay: 6, goiTruoc: { soCau: 6, soDaLam: 2, lucGiaoMs: vn('19:40') } }))
    expect(chuan(r, 'goi_truoc_chua_xong')).toBe('Gói lúc 19:40 con mới làm 2 trong 6 câu — chờ con làm xong rồi giao tiếp.')
    expect(tinhGiaoThem(vao({ luot: 2, tongDaGiaoHomNay: 6, goiTruoc: { soCau: 6, soDaLam: 6, lucGiaoMs: vn('19:40') } })).tuChoi).toBeUndefined()
  })
  it('hết 3 lượt ⇒ từ chối; hết trần 16 câu/ngày (còn < 3 câu) ⇒ từ chối; còn đúng 3 câu thì giao được', () => {
    expect(chuan(tinhGiaoThem(vao({ luot: 4, tongDaGiaoHomNay: 10 })), 'het_luot')).toContain('đủ 3 lượt')
    expect(chuan(tinhGiaoThem(vao({ luot: 3, tongDaGiaoHomNay: 14 })), 'het_tran_ngay')).toContain('14 trên 16 câu')
    const con3 = tinhGiaoThem(vao({ luot: 3, tongDaGiaoHomNay: 13 }))
    expect(con3.tuChoi).toBeUndefined()
    expect(con3.soCau).toBe(3)
  })
  it('không có câu phù hợp (< 3) ⇒ từ chối nói rõ ba con số', () => {
    const r = tinhGiaoThem(vao({ hoSo: { dang: [dang('A', { soKhaDungDungBac: 1, soKhaDungThapHon: 0 })], soCauDenLichOn: 0, soCauSaiChuaKhacPhuc: 1 } }))
    expect(chuan(r, 'khong_co_cau')).toBe('Hôm nay chưa có đủ câu phù hợp để giao thêm (ôn lại 0 câu, dạng con đang vấp 1 câu, câu từng sai 1 câu).')
  })
  it('THỨ TỰ từ chối: hết lượt → việc bắt buộc → gói trước chưa xong → hết trần → không có câu', () => {
    const bb = { mucTieuCau: 20, daLam: 5, dung: 5, batBuocConLai: [{ loai: 'chang_btvn' as const, soCau: 2 }] }
    const goi = { soCau: 6, soDaLam: 1, lucGiaoMs: vn('19:40') }
    expect(tinhGiaoThem(vao({ luot: 4, nganSach: bb, goiTruoc: goi, tongDaGiaoHomNay: 15 })).tuChoi?.ma).toBe('het_luot')
    expect(tinhGiaoThem(vao({ nganSach: bb, goiTruoc: goi, tongDaGiaoHomNay: 15 })).tuChoi?.ma).toBe('con_viec_bat_buoc')
    expect(tinhGiaoThem(vao({ goiTruoc: goi, tongDaGiaoHomNay: 15 })).tuChoi?.ma).toBe('goi_truoc_chua_xong')
    expect(tinhGiaoThem(vao({ tongDaGiaoHomNay: 15 })).tuChoi?.ma).toBe('het_tran_ngay')
  })
})

/** Lưới ngẫu nhiên tất định (mulberry32) — TÍNH CHẤT phải đúng với MỌI đầu vào. */
function ngauNhien(hat: number): DauVaoGiaoThem {
  const r = mulberry32(hat)
  const ri = (a: number, b: number) => a + Math.floor(r() * (b - a + 1))
  const soDang = ri(0, 5)
  const dsDang: DangCuaCon[] = Array.from({ length: soDang }, (_, i) => ({
    ma: `D${i}`,
    ten: r() < 0.5 ? `Dạng số ${i}` : undefined,
    bac: ri(0, 2) as 0 | 1 | 2,
    vap: r() < 0.6,
    yeu: r() < 0.4,
    tiLeKhacPhuc: r() < 0.2 ? null : Math.round(r() * 100) / 100,
    soSai7: ri(0, 6),
    soKhaDungDungBac: ri(0, 6),
    soKhaDungThapHon: ri(0, 4),
    soKhaDungCaoHon: ri(0, 3),
  }))
  const co = r() < 0.15
  return {
    hoSo: { dang: dsDang, soCauDenLichOn: ri(0, 12), soCauSaiChuaKhacPhuc: ri(0, 10) },
    nganSach: { mucTieuCau: ri(0, 40), daLam: ri(0, 45), dung: ri(0, 45), batBuocConLai: co ? [{ loai: 'chang_btvn', soCau: ri(1, 12) }] : [] },
    bayGioMs: vn('17:00') + ri(0, 7 * 60) * 60_000 + ri(0, 59) * 1000,
    luot: ri(1, 4),
    tongDaGiaoHomNay: ri(0, 18),
    goiTruoc: r() < 0.2 ? { soCau: ri(1, 8), soDaLam: ri(0, 8), lucGiaoMs: vn('19:00') } : null,
    giayMoiCau: ri(20, 200),
  }
}
const PHU_CAM = ['thú', 'EXP', 'khiên', 'game', 'Đoàn', 'Đảo', 'Võ đài']

describe('TÍNH CHẤT trên 6000 đầu vào ngẫu nhiên', () => {
  const CAC = Array.from({ length: 6000 }, (_, i) => ({ v: ngauNhien(1000 + i), i }))
  it('KHÔNG BAO GIỜ vượt trần: ≤ trần lượt, ≤ 10, sau 21:30 ≤ 4, tổng ngày ≤ 16, ≥ 3 câu; thanhPhan cộng đúng; không đòi quá khả dụng; thử sức ≤ 1', () => {
    for (const { v, i } of CAC) {
      const r = tinhGiaoThem(v)
      if (r.tuChoi) continue
      const nhan = `#${i}`
      expect(r.soCau, nhan).toBeGreaterThanOrEqual(GIAO_THEM.TOI_THIEU_MOI_GOI)
      expect(r.soCau, nhan).toBeLessThanOrEqual(tranLuot(v.luot))
      expect(r.soCau, nhan).toBeLessThanOrEqual(10)
      if (new Date(v.bayGioMs + 7 * 3_600_000).getUTCHours() * 3600 + new Date(v.bayGioMs + 7 * 3_600_000).getUTCMinutes() * 60 + new Date(v.bayGioMs + 7 * 3_600_000).getUTCSeconds() > 21.5 * 3600) expect(r.soCau, nhan).toBeLessThanOrEqual(4)
      expect(v.tongDaGiaoHomNay + r.soCau, nhan).toBeLessThanOrEqual(16)
      expect(r.thanhPhan.reduce((s, t) => s + t.soCau, 0), nhan).toBe(r.soCau)
      expect(r.thanhPhan.every((t) => t.soCau > 0), nhan).toBe(true)
      expect(dem(r, 'on_lai'), nhan).toBeLessThanOrEqual(v.hoSo.soCauDenLichOn)
      expect(dem(r, 'cau_sai'), nhan).toBeLessThanOrEqual(v.hoSo.soCauSaiChuaKhacPhuc)
      for (const d of v.hoSo.dang) expect(r.thanhPhan.filter((t) => t.loai === 'dang_vap' && t.dang === d.ma).reduce((s, t) => s + t.soCau, 0), `${nhan} ${d.ma}`).toBeLessThanOrEqual(d.soKhaDungDungBac + d.soKhaDungThapHon)
      expect(dem(r, 'thu_suc'), nhan).toBeLessThanOrEqual(1)
      expect(r.phutUocTinh, nhan).toBe(phutUocTinhChang(r.soCau, v.giayMoiCau ?? 90))
      expect(r.lyDo.length, nhan).toBeGreaterThan(0)
    }
  })
  it('thử sức CHỈ khi đúng ≥ 80 % (≥ 5 câu), dạng không yếu / không vấp, bậc < Vận dụng, còn câu bậc + 1 — không bao giờ vượt bậc + 1', () => {
    let soThuSuc = 0
    for (const { v, i } of CAC) {
      const r = tinhGiaoThem(v)
      for (const t of r.thanhPhan.filter((x) => x.loai === 'thu_suc')) {
        soThuSuc++
        const d = v.hoSo.dang.find((x) => x.ma === t.dang)!
        expect(duDieuKienThuSuc(v.nganSach.daLam, v.nganSach.dung), `#${i}`).toBe(true)
        expect(d.yeu || d.vap, `#${i}`).toBe(false)
        expect(d.bac, `#${i}`).toBeLessThan(2)
        expect(d.soKhaDungCaoHon, `#${i}`).toBeGreaterThanOrEqual(1)
        expect(t.bac).toBe('cao_hon_mot_bac')
      }
    }
    expect(soThuSuc).toBeGreaterThan(50) // lưới có đủ ca thử sức để phép kiểm có nghĩa
  })
  it('TỪ CHỐI đúng ca — và chỉ khi có lý do: mỗi tuChoi có lý do bằng số, soCau 0; KHÔNG từ chối khi không thuộc ca nào', () => {
    let soTuChoi = 0
    for (const { v, i } of CAC) {
      const r = tinhGiaoThem(v)
      const bb = v.nganSach.batBuocConLai.some((x) => x.soCau > 0)
      const goiDo = !!v.goiTruoc && v.goiTruoc.soCau > 0 && v.goiTruoc.soDaLam < v.goiTruoc.soCau
      if (v.luot > 3) expect(r.tuChoi?.ma, `#${i}`).toBe('het_luot')
      else if (bb) expect(r.tuChoi?.ma, `#${i}`).toBe('con_viec_bat_buoc')
      else if (goiDo) expect(r.tuChoi?.ma, `#${i}`).toBe('goi_truoc_chua_xong')
      else if (16 - v.tongDaGiaoHomNay < 3) expect(r.tuChoi?.ma, `#${i}`).toBe('het_tran_ngay')
      else if (r.tuChoi) expect(r.tuChoi.ma, `#${i}`).toBe('khong_co_cau')
      if (r.tuChoi) {
        soTuChoi++
        expect(r.soCau, `#${i}`).toBe(0)
        expect(r.thanhPhan, `#${i}`).toEqual([])
        expect(/\d/.test(r.tuChoi.lyDo.join(' ')), `#${i} lý do có số`).toBe(true)
      }
    }
    expect(soTuChoi).toBeGreaterThan(500)
  })
  it('ĐƠN ĐIỆU: cùng đầu vào, lượt 1 → 2 → 3 số câu KHÔNG tăng; giờ muộn hơn KHÔNG tăng; tổng đã giao nhiều hơn KHÔNG tăng', () => {
    for (const { v, i } of CAC.slice(0, 3000)) {
      const goc = { ...v, goiTruoc: null, tongDaGiaoHomNay: 0, nganSach: { ...v.nganSach, batBuocConLai: [] }, bayGioMs: vn('19:00') }
      const n = (o: Partial<DauVaoGiaoThem>) => {
        const r = tinhGiaoThem({ ...goc, ...o })
        return r.tuChoi ? -1 : r.soCau
      }
      const [l1, l2, l3] = [1, 2, 3].map((luot) => n({ luot }))
      if (l1 >= 0 && l2 >= 0) expect(l2, `#${i} lượt`).toBeLessThanOrEqual(l1)
      if (l2 >= 0 && l3 >= 0) expect(l3, `#${i} lượt`).toBeLessThanOrEqual(l2)
      const som = n({ bayGioMs: vn('21:00') })
      const muon = n({ bayGioMs: vn('21:45') })
      if (som >= 0 && muon >= 0) expect(muon, `#${i} giờ`).toBeLessThanOrEqual(som)
      const it1 = n({ tongDaGiaoHomNay: 2 })
      const it2 = n({ tongDaGiaoHomNay: 8 })
      if (it1 >= 0 && it2 >= 0) expect(it2, `#${i} tổng`).toBeLessThanOrEqual(it1)
    }
  })
  it('THUẦN: cùng đầu vào cho cùng kết quả; không sửa đầu vào; lời cho phụ huynh KHÔNG nhắc thú / EXP / khiên / game / Đoàn / Đảo / Võ đài', () => {
    for (const { v, i } of CAC.slice(0, 2000)) {
      const truoc = JSON.stringify(v)
      const a = tinhGiaoThem(v)
      expect(JSON.stringify(v), `#${i} không sửa vào`).toBe(truoc)
      expect(JSON.stringify(tinhGiaoThem(v)), `#${i} tất định`).toBe(JSON.stringify(a))
      const chu = [...a.lyDo, ...(a.tuChoi?.lyDo ?? [])].join(' ')
      for (const cam of PHU_CAM) expect(chu.includes(cam), `#${i} "${cam}"`).toBe(false)
    }
  })
  it('đầu vào lạ (NaN, âm, thiếu trường) không làm hỏng: kết quả vẫn hợp lệ hoặc từ chối có lý do', () => {
    const lạ = { hoSo: { dang: [{ ma: 'X', bac: 1, vap: true, yeu: false, tiLeKhacPhuc: null, soKhaDungDungBac: Number.NaN, soKhaDungThapHon: -3, soKhaDungCaoHon: 1 }], soCauDenLichOn: Number.NaN, soCauSaiChuaKhacPhuc: -1 }, nganSach: { mucTieuCau: Number.NaN, daLam: -5, dung: Number.POSITIVE_INFINITY, batBuocConLai: [] }, bayGioMs: vn('19:00'), luot: 1.9, tongDaGiaoHomNay: Number.NaN } as unknown as DauVaoGiaoThem
    const r = tinhGiaoThem(lạ)
    expect(r.soCau).toBeGreaterThanOrEqual(0)
    expect(r.tuChoi ? r.tuChoi.lyDo.length : r.lyDo.length).toBeGreaterThan(0)
  })
})
