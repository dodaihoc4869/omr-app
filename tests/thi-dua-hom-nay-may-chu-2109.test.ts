// @vitest-environment node
// THI ĐUA CHĂM HÔM NAY (server/src/thi-dua-hom-nay.ts): xếp các em CÙNG LỚP theo sự chăm trong ngày VN.
// Khoá: xác thực · ba tiêu chí + tie-break "đạt số câu sớm hơn" + đồng hạng · DISTINCT qid · chỉ hôm nay theo NGÀY VN · lớp theo ten_lop / theo khối · em 0 câu không hạng ·
// top ≤ 3 chỉ có tên rút gọn + thần thú (không sbd/họ tên đầy đủ/em ngoài top/EXP) · themDeVuot · nhomCuoi + thoatNhomCuoi · em duy nhất · KHÔNG ghi · trần truy vấn · lệnh thầy · thiếu bảng.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { hsThuThachHomNay } from '../server/src/thu-thach-rieng'
import { CAN_DANG_NHAP } from '../server/src/on-lai-nop'
import { ghiSuKien, ngayVn } from '../server/src/su-kien-hoc'
import { SBD_THU } from '../server/src/gv-bang-tin'
import {
  duSauMuoiPhanTram, gvChuaHocHomNay, hangChamCuaEm, hsThiDuaHomNay, LOI_KHONG_XEM_DUOC, SBD_THU_NGHIEM, soSanhCham, soViTriNhomCuoi, tenRutGon, tinhBangThiDua, trongNhomCuoi, xepHangCham,
  type EmCham,
} from '../server/src/thi-dua-hom-nay'
import { taoD1That, type D1That } from './_d1-that'

vi.mock('../server/src/game-v2-auth', async (orig) => ({
  ...(await orig<typeof import('../server/src/game-v2-auth')>()),
  gameIdentity: async (_e: unknown, b: Record<string, unknown>) => {
    const t = String(b.token ?? '')
    if (t.startsWith('token-')) return t.slice(6)
    throw new Error('Phiên đăng nhập không hợp lệ.')
  },
}))
afterEach(() => vi.restoreAllMocks())

const NGAY = '2026-09-22'
const NOW = Date.parse(`${NGAY}T15:00:00+07:00`)
const HOM_QUA = '2026-09-21'
const HAI_NGAY_TRUOC = '2026-09-20'
const ba = '2026-09-19'
/** ISO của giờ VN `gio` (HH:MM) ngày `ngay`, cộng `phut` phút. */
const iso = (gio: string, ngay = NGAY, phut = 0): string => new Date(Date.parse(`${ngay}T${gio}:00+07:00`) + phut * 60_000).toISOString()

const themEm = (d: D1That, sbd: string, hoTen: string, lop = '12', tenLop: string | null = null) =>
  d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,'mk','x')").run(sbd, hoTen, lop, tenLop)
const themDanhSach = (d: D1That, sbd: string, hoTen: string, lop = '12') => d.sql.prepare("INSERT INTO danh_sach(sbd,ho_ten,nam_sinh,lop,cap_nhat_luc) VALUES(?,?,'2008',?,'x')").run(sbd, hoTen, lop)
/** Một dòng sổ (qua `ghiSuKien` thật: ngày VN do máy chủ tính từ `luc`). */
const lam = (d: D1That, sbd: string, qid: string, luc: string, o: { kq?: 0 | 1 | null; nguon?: 'btvn' | 'mom' | 'on_lai' | 'game'; ma?: string; lan?: number } = {}) =>
  ghiSuKien(d.env, [{ nguon: o.nguon ?? 'btvn', maNguon: o.ma ?? 'M1', sbd, qid, lan: o.lan ?? 1, ketQua: o.kq === undefined ? 1 : o.kq, luc, giay: 20 }])
/** `n` câu KHÁC NHAU, mỗi phút một câu kể từ giờ `gio`, đều ở ngày `ngay`. */
const lamN = async (d: D1That, sbd: string, n: number, gio: string, ngay = NGAY) => {
  for (let i = 0; i < n; i++) await lam(d, sbd, `${sbd}-${ngay}-${i}`, iso(gio, ngay, i))
}
const datNv = (d: D1That, sbd: string, ngay = NGAY, loai = 'dat_ngay') =>
  d.sql.prepare("INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,exp,luc,ghi_chu) VALUES(?,?,?,?,80,'x','x')").run(`${sbd}|${loai}|${ngay}`, sbd, ngay, loai)
const hoSoThu = (d: D1That, sbd: string, o: { pet?: string; cap?: number; choice?: boolean } = {}) =>
  d.sql.prepare('INSERT OR REPLACE INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,1,?,?)').run(
    sbd, JSON.stringify({ pet: o.pet ?? 'lua_phuong', choice: o.choice ?? false, cap: o.cap ?? 6, exp: 987654, nickname: 'Biệt danh riêng', khienRen: { manh: 9, daRen: 0 } }), 'x')
const goi = (d: D1That, sbd: string, now = NOW) => hsThiDuaHomNay(d.env, { token: `token-${sbd}` }, now)
const dungGhi = (d: D1That): string[] => {
  const ghi: string[] = []
  const goc = d.env.DB.prepare.bind(d.env.DB)
  d.env.DB.prepare = ((q: string) => {
    if (/^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i.test(q)) ghi.push(q.trim().slice(0, 60))
    return goc(q)
  }) as typeof d.env.DB.prepare
  return ghi
}

/**
 * Lớp "12 - Lớp Thường" (khối 12, chưa gán ten_lop), 9 em, hôm nay 22/09:
 *   A 8 câu (chuỗi 1: học 20/09 và 19/09 nhưng ĐỨT ngày 21/09) · B 5 câu + ĐẠT nhiệm vụ ngày · C 5 câu chuỗi 3 (học 21, 20/09; "đạt" chỉ ở HÔM QUA + khoản EXP loại khác hôm nay ⇒ KHÔNG tính đạt)
 *   D 5 câu (07:00–07:03 và câu thứ 5 lúc 10:00) · E 5 câu (09:00–09:04, LÀM LẠI câu đầu lúc 11:00) ⇒ E đạt 5 câu SỚM hơn D · F, G 2 câu y hệt nhau (08:00, 08:01) ⇒ đồng hạng
 *   H không làm gì · I chỉ có dòng bỏ trống (ket_qua NULL) ⇒ chưa học.
 * Hạng: A1, B2, C3, E4, D5, F6, G6; H, I không hạng. siSo 9, daHoc 7.
 */
async function lopMau(): Promise<D1That> {
  const d = taoD1That()
  const ds: [string, string][] = [
    ['HS7101', 'Lê Văn An'], ['HS7102', 'Phạm Thu Bình'], ['HS7103', 'Đặng Gia Cường'], ['HS7104', 'Vũ Minh Dũng'], ['HS7105', 'Hồ Quốc Em'],
    ['HS7106', 'Bùi Thị Phương'], ['HS7107', 'Ngô Hải Giang'], ['HS7108', 'Đinh Hoa Hà'], ['HS7109', 'Tô Ngọc Ích'],
  ]
  for (const [s, t] of ds) themEm(d, s, t)
  await lamN(d, 'HS7101', 8, '08:00')
  await lamN(d, 'HS7101', 2, '08:00', HAI_NGAY_TRUOC)
  await lamN(d, 'HS7101', 1, '08:00', ba)
  await lamN(d, 'HS7102', 5, '08:00')
  datNv(d, 'HS7102')
  await lamN(d, 'HS7103', 5, '08:00')
  await lamN(d, 'HS7103', 1, '08:00', HOM_QUA)
  await lamN(d, 'HS7103', 1, '08:00', HAI_NGAY_TRUOC)
  datNv(d, 'HS7103', HOM_QUA) // đạt HÔM QUA không tính hôm nay
  datNv(d, 'HS7103', NGAY, 'cau') // khoản EXP loại khác hôm nay không phải "đạt nhiệm vụ ngày"
  for (let i = 0; i < 4; i++) await lam(d, 'HS7104', `D-${i}`, iso('07:00', NGAY, i))
  await lam(d, 'HS7104', 'D-4', iso('10:00'))
  await lamN(d, 'HS7105', 5, '09:00')
  await lam(d, 'HS7105', 'HS7105-2026-09-22-0', iso('11:00'), { nguon: 'mom', ma: 'X' }) // làm lại câu đầu, không đổi thời điểm đạt 5 câu
  await lamN(d, 'HS7106', 2, '08:00')
  await lamN(d, 'HS7107', 2, '08:00')
  await lam(d, 'HS7109', 'ICH-1', iso('09:00'), { kq: null })
  await lam(d, 'HS7109', 'ICH-2', iso('09:01'), { kq: null })
  return d
}

// ================================================================== HÀM THUẦN ==================================================================

describe('tenRutGon', () => {
  it('bỏ họ, còn > 2 từ thì lấy 2 từ cuối, thêm chữ cái đầu họ; một từ giữ nguyên; rỗng ⇒ "Bạn học"', () => {
    expect(tenRutGon('Trần Minh Anh')).toBe('Minh Anh T.')
    expect(tenRutGon('Nguyễn Thị Minh Anh')).toBe('Minh Anh N.')
    expect(tenRutGon('Trần Anh')).toBe('Anh T.')
    expect(tenRutGon('Anh')).toBe('Anh')
    expect(tenRutGon('  đặng   Bảo  Ngọc ')).toBe('Bảo Ngọc Đ.')
    expect(tenRutGon('')).toBe('Bạn học')
    expect(tenRutGon(null)).toBe('Bạn học')
    expect(tenRutGon('   ')).toBe('Bạn học')
  })
})

describe('soSanhCham / xepHangCham', () => {
  const e = (sbd: string, soCau: number, o: Partial<EmCham> = {}): EmCham => ({ sbd, soCau, datNhiemVu: false, chuoi: 1, lucDatSoCau: 1000, ...o })
  it('thứ tự tiêu chí: số câu > đạt nhiệm vụ > chuỗi > đạt số câu sớm hơn; hoà hoàn toàn ⇒ soSanhCham = 0', () => {
    expect(soSanhCham(e('a', 6), e('b', 5, { datNhiemVu: true, chuoi: 99, lucDatSoCau: 1 }))).toBeLessThan(0) // nhiều câu hơn thắng mọi tiêu chí sau
    expect(soSanhCham(e('a', 5, { datNhiemVu: true }), e('b', 5, { chuoi: 99, lucDatSoCau: 1 }))).toBeLessThan(0) // đạt nhiệm vụ thắng chuỗi và thời điểm
    expect(soSanhCham(e('a', 5, { chuoi: 3 }), e('b', 5, { chuoi: 2, lucDatSoCau: 1 }))).toBeLessThan(0) // chuỗi thắng thời điểm
    expect(soSanhCham(e('a', 5, { lucDatSoCau: 10 }), e('b', 5, { lucDatSoCau: 20 }))).toBeLessThan(0) // sớm hơn thắng
    expect(soSanhCham(e('b', 5, { lucDatSoCau: 20 }), e('a', 5, { lucDatSoCau: 10 }))).toBeGreaterThan(0)
    expect(soSanhCham(e('a', 5), e('z', 5))).toBe(0) // KHÔNG xếp theo sbd/tên
    expect(soSanhCham(e('a', 5, { lucDatSoCau: null }), e('b', 5, { lucDatSoCau: 10 }))).toBeGreaterThan(0) // thiếu thời điểm ⇒ muộn nhất
  })
  it('hạng kiểu thi đấu 1, 1, 3; em 0 câu bị loại khỏi danh sách (không hạng, không thứ tự với nhau)', () => {
    const r = xepHangCham([e('d', 3), e('a', 9), e('b', 9), e('c', 5), e('z0', 0), e('z1', 0)])
    expect(r.map((x) => [x.sbd, x.hang])).toEqual([['a', 1], ['b', 1], ['c', 3], ['d', 4]])
  })
})

describe('trongNhomCuoi / duSauMuoiPhanTram', () => {
  it('nhóm cuối = ceil(n / 5) vị trí cuối (n = 15 ⇒ 3, n = 16 ⇒ 4, n = 1 ⇒ 1)', () => {
    expect([0, 1, 5, 6, 10, 11, 15, 16].map(soViTriNhomCuoi)).toEqual([0, 1, 1, 2, 2, 3, 3, 4])
  })
  it('n = 10 (2 vị trí cuối): hạng 9, 10 ở nhóm cuối; hạng 8 thì không', () => {
    expect([7, 8, 9, 10].map((h) => trongNhomCuoi(h, 10))).toEqual([false, false, true, true])
  })
  it('n = 15 (3 vị trí cuối) và n = 5 (1 vị trí cuối): đúng biên', () => {
    expect([12, 13, 14, 15].map((h) => trongNhomCuoi(h, 15))).toEqual([false, true, true, true])
    expect([4, 5].map((h) => trongNhomCuoi(h, 5))).toEqual([false, true])
  })
  it('hạng 1 không bao giờ ở nhóm cuối (lớp một em; cả lớp hoà); không ai học ⇒ false', () => {
    expect(trongNhomCuoi(1, 1)).toBe(false)
    expect(trongNhomCuoi(1, 8)).toBe(false)
    expect(trongNhomCuoi(3, 0)).toBe(false)
  })
  it('đồng hạng ở RANH GIỚI thì CÙNG RA; đồng hạng nằm trọn trong nhóm cuối thì cùng vào', () => {
    const ds = (soCau: number[]): EmCham[] => soCau.map((c, i) => ({ sbd: `s${i}`, soCau: c, datNhiemVu: false, chuoi: 1, lucDatSoCau: 5 }))
    // 10 em, nhóm cuối = 2 vị trí (9, 10). Hai em 2 câu ở vị trí 8–9 (hạng 8, 8), em 1 câu ở vị trí 10 (hạng 10) ⇒ chỉ em hạng 10 ở nhóm cuối.
    const bien = xepHangCham(ds([10, 9, 8, 7, 6, 5, 4, 2, 2, 1]))
    expect(bien.map((x) => [x.hang, trongNhomCuoi(x.hang, bien.length)])).toEqual([[1, false], [2, false], [3, false], [4, false], [5, false], [6, false], [7, false], [8, false], [8, false], [10, true]])
    // Hai em 1 câu ở vị trí 9–10 (hạng 9, 9) ⇒ cả hai cùng vào.
    const trong = xepHangCham(ds([10, 9, 8, 7, 6, 5, 4, 3, 1, 1]))
    expect(trong.slice(-3).map((x) => [x.hang, trongNhomCuoi(x.hang, trong.length)])).toEqual([[8, false], [9, true], [9, true]])
  })
  it('≥ 60 % sĩ số: đúng 60 % là ĐỦ, 59 % chưa đủ', () => {
    expect(duSauMuoiPhanTram(6, 10)).toBe(true)
    expect(duSauMuoiPhanTram(5, 10)).toBe(false)
    expect(duSauMuoiPhanTram(60, 100)).toBe(true)
    expect(duSauMuoiPhanTram(59, 100)).toBe(false)
    expect(duSauMuoiPhanTram(0, 0)).toBe(false)
  })
})

describe('tinhBangThiDua (hàm thuần)', () => {
  const e = (sbd: string, soCau: number, o: Partial<EmCham> = {}): EmCham => ({ sbd, soCau, datNhiemVu: false, chuoi: 1, lucDatSoCau: 1000, ...o })
  it('themDeVuot = (số câu nhóm ngay trên − số câu em) + 1, soBan = số bạn nhóm đó; hạng 1 ⇒ null', () => {
    const ds = [e('em', 5), e('A', 8), e('B', 8), e('C', 20), e('D', 3)]
    expect(tinhBangThiDua(ds, 'em').cuaEm).toMatchObject({ hang: 4, soCau: 5, themDeVuot: { soCau: 4, soBan: 2 } })
    expect(tinhBangThiDua(ds, 'C').cuaEm).toMatchObject({ hang: 1, soCau: 20, themDeVuot: null })
    expect(tinhBangThiDua(ds, 'A').cuaEm.themDeVuot).toEqual({ soCau: 13, soBan: 1 })
  })
  it('bạn CÙNG số câu nhưng hơn ở tiêu chí sau cũng là "trên": em cần thêm 1 câu để vượt họ', () => {
    const ds = [e('em', 10), e('B', 10, { datNhiemVu: true }), e('C', 12)]
    expect(tinhBangThiDua(ds, 'em').cuaEm).toMatchObject({ hang: 3, themDeVuot: { soCau: 1, soBan: 1 } })
  })
  it('hoà HOÀN TOÀN với bạn ⇒ cùng hạng, bạn đó KHÔNG tính là "trên" em', () => {
    const ds = [e('em', 5), e('B', 5), e('A', 9)]
    const v = tinhBangThiDua(ds, 'em').cuaEm
    expect(v.hang).toBe(2)
    expect(v.themDeVuot).toEqual({ soCau: 5, soBan: 1 })
    expect(tinhBangThiDua(ds, 'B').cuaEm.hang).toBe(2)
    expect(tinhBangThiDua([e('em', 5), e('B', 5)], 'em').cuaEm).toMatchObject({ hang: 1, themDeVuot: null })
  })
  it('em chưa học: hạng null, soCau 0, themDeVuot = { số câu bạn đứng cuối + 1, số bạn ở nhóm cuối }; chưa ai học ⇒ { 1, 0 }', () => {
    const ds = [e('em', 0), e('A', 6), e('B', 2), e('C', 2), e('D', 4), e('z', 0)]
    const v = tinhBangThiDua(ds, 'em')
    expect(v.cuaEm).toMatchObject({ hang: null, soCau: 0, themDeVuot: { soCau: 3, soBan: 2 } })
    expect(v.daHoc).toBe(4)
    expect(v.siSo).toBe(6)
    expect(tinhBangThiDua([e('em', 0), e('z', 0)], 'em').cuaEm).toEqual({ hang: null, soCau: 0, themDeVuot: { soCau: 1, soBan: 0 }, nhomCuoi: false })
  })
  it('nhomCuoi: cần ≥ 60 % đã học VÀ (chưa học HOẶC 20 % cuối); không kèm thoatNhomCuoi khi false', () => {
    // 10 em: 6 đã học (6..1 câu) + 4 chưa học. 60 % ⇒ đủ. Nhóm cuối = ceil(6/5) = 2 vị trí (hạng 5, 6).
    const hoc = [6, 5, 4, 3, 2, 1].map((c, i) => e(`h${i}`, c))
    const chua = [0, 1, 2, 3].map((i) => e(`c${i}`, 0))
    const lop = [...hoc, ...chua]
    expect(tinhBangThiDua(lop, 'h5').cuaEm.nhomCuoi).toBe(true) // 1 câu: hạng 6
    expect(tinhBangThiDua(lop, 'h4').cuaEm.nhomCuoi).toBe(true) // 2 câu: hạng 5
    expect(tinhBangThiDua(lop, 'h3').cuaEm.nhomCuoi).toBe(false) // 3 câu: hạng 4
    expect(tinhBangThiDua(lop, 'c0').cuaEm.nhomCuoi).toBe(true) // chưa học, lớp đã ≥ 60 % học
    // chỉ 5/10 học ⇒ không ai là "nhóm cuối", kể cả em chưa học và em chót bảng
    const it = [...hoc.slice(0, 5), ...[0, 1, 2, 3, 4].map((i) => e(`c${i}`, 0))]
    for (const s of ['h4', 'c0']) {
      const v = tinhBangThiDua(it, s).cuaEm
      expect(v.nhomCuoi, s).toBe(false)
      expect('thoatNhomCuoi' in v, s).toBe(false)
    }
  })
  it('thoatNhomCuoi: số câu THÊM ít nhất để ra khỏi nhóm cuối (bạn hoà số câu thì em, làm xong sau, vẫn đứng sau)', () => {
    // 10 em học 10, 9, …, 1 câu (mọi thứ khác bằng nhau, thời điểm đạt cũ hơn của em). Em 1 câu (hạng 10, nhóm cuối = hạng 9–10): 2 câu ⇒ hoà 2 câu, thua ⇒ hạng 10;
    // 3 câu ⇒ hoà 3 câu, thua ⇒ hạng 9 (vẫn cuối); 4 câu ⇒ hạng 8 ⇒ ra. Cần thêm 3 câu.
    const lop = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((c) => e(`s${c}`, c))
    const v = tinhBangThiDua(lop, 's1').cuaEm
    expect(v).toMatchObject({ hang: 10, nhomCuoi: true, thoatNhomCuoi: { soCau: 3 } })
    expect(tinhBangThiDua(lop, 's2').cuaEm.thoatNhomCuoi).toEqual({ soCau: 2 }) // 2 câu (hạng 9): thêm 1 ⇒ 3 câu hoà s3, thua ⇒ hạng 9 vẫn cuối; thêm 2 ⇒ 4 câu, hạng 8 ⇒ ra
    // em chưa học: số câu để vào rồi thoát nhóm cuối (tổng, không phải "thêm")
    const lop2 = [...[6, 5, 4, 3, 2, 1].map((c) => e(`h${c}`, c, { chuoi: 1 })), e('moi', 0, { chuoi: 0 }), e('c1', 0), e('c2', 0), e('c3', 0)]
    expect(tinhBangThiDua(lop2, 'moi').cuaEm).toMatchObject({ hang: null, nhomCuoi: true, themDeVuot: { soCau: 2, soBan: 1 }, thoatNhomCuoi: { soCau: 3 } })
  })
  it('thoatNhomCuoi của em chưa học tính CHUỖI +1 (hôm nay có học): chuỗi 2 hôm qua ⇒ chuỗi 3 khi học, đứng TRÊN bạn 2 câu chuỗi 2 ⇒ thoát sớm hơn một câu', () => {
    const lop = [...[6, 5, 4, 3, 2, 1].map((c) => e(`h${c}`, c, { chuoi: c === 2 ? 2 : 1 })), e('moi', 0, { chuoi: 2 }), e('c1', 0), e('c2', 0), e('c3', 0)]
    expect(tinhBangThiDua(lop, 'moi').cuaEm).toMatchObject({ hang: null, nhomCuoi: true, thoatNhomCuoi: { soCau: 2 } })
  })
  it('em duy nhất trong lớp: học ⇒ hạng 1, không nhomCuoi; chưa học ⇒ hạng null, themDeVuot { 1, 0 }', () => {
    expect(tinhBangThiDua([e('em', 4)], 'em')).toMatchObject({ siSo: 1, daHoc: 1, cuaEm: { hang: 1, soCau: 4, themDeVuot: null, nhomCuoi: false } })
    expect(tinhBangThiDua([e('em', 0)], 'em')).toMatchObject({ siSo: 1, daHoc: 0, cuaEm: { hang: null, soCau: 0, themDeVuot: { soCau: 1, soBan: 0 }, nhomCuoi: false } })
  })
})

// ================================================================== LỆNH CỦA MÁY EM ==================================================================

describe('xác thực', () => {
  it('token sai / thiếu ⇒ { ok:false, error } CÙNG CHỮ với /hs/thu-thach-hom-nay; không đọc D1', async () => {
    const d = await lopMau()
    const t0 = d.soLenh.prepare
    for (const b of [{ token: 'sai' }, {}, { sbd: 'HS7101' }]) {
      const r = await hsThiDuaHomNay(d.env, b, NOW)
      expect(r).toEqual({ ok: false, error: CAN_DANG_NHAP })
      expect((await hsThuThachHomNay(d.env, b, NOW)).error).toBe(r.error)
    }
    expect(d.soLenh.prepare - t0).toBe(0) // cả hai lệnh dừng ở cổng ⇒ không truy vấn nào
  })
})

describe('xếp hạng trên D1 thật (lớp mẫu 9 em)', () => {
  it('top = A, B, C theo số câu rồi đạt nhiệm vụ (hôm nay) — C có chuỗi 3 nhưng "đạt" chỉ ở hôm qua nên đứng SAU B; hạng của từng em đúng', async () => {
    const d = await lopMau()
    const r = await goi(d, 'HS7104') // D
    expect(r).toMatchObject({ ok: true, lop: '12 - Lớp Thường', siSo: 9, daHoc: 7, capNhatLuc: new Date(NOW).toISOString() })
    expect((r.top as { ten: string }[]).map((x) => x.ten)).toEqual(['Văn An L.', 'Thu Bình P.', 'Gia Cường Đ.'])
    expect((r.top as { hang: number }[]).map((x) => x.hang)).toEqual([1, 2, 3])
    expect((r.top as { soCau: number }[]).map((x) => x.soCau)).toEqual([8, 5, 5])
    // chuỗi: A đứt ngày 21/09 nên chỉ 1; B 1; C = 22, 21, 20 ⇒ 3
    expect((r.top as { chuoi: number }[]).map((x) => x.chuoi)).toEqual([1, 1, 3])
  })
  it('E đứng trên D vì đạt 5 câu SỚM hơn (làm lại câu cũ lúc 11:00 không làm E muộn đi; câu ĐẦU của D sớm hơn của E nhưng câu thứ 5 mới tính)', async () => {
    const d = await lopMau()
    expect((await goi(d, 'HS7105')).cuaEm).toMatchObject({ hang: 4, soCau: 5 })
    expect((await goi(d, 'HS7104')).cuaEm).toMatchObject({ hang: 5, soCau: 5 })
    expect((await goi(d, 'HS7102')).cuaEm).toMatchObject({ hang: 2 })
    expect((await goi(d, 'HS7103')).cuaEm).toMatchObject({ hang: 3 })
  })
  it('F và G y hệt nhau ⇒ CÙNG hạng 6', async () => {
    const d = await lopMau()
    expect((await goi(d, 'HS7106')).cuaEm).toMatchObject({ hang: 6, soCau: 2 })
    expect((await goi(d, 'HS7107')).cuaEm).toMatchObject({ hang: 6, soCau: 2 })
  })
  it('themDeVuot, nhomCuoi, thoatNhomCuoi của từng em mẫu', async () => {
    const d = await lopMau()
    // A hạng 1
    expect((await goi(d, 'HS7101')).cuaEm).toEqual({ hang: 1, soCau: 8, themDeVuot: null, nhomCuoi: false })
    // D hạng 5: trên D là B, C, E (5 câu) và A ⇒ nhóm gần nhất 5 câu (3 bạn) ⇒ thêm 1 câu
    expect((await goi(d, 'HS7104')).cuaEm).toEqual({ hang: 5, soCau: 5, themDeVuot: { soCau: 1, soBan: 3 }, nhomCuoi: false })
    // F hạng 6: 7 em đã học ⇒ nhóm cuối 2 vị trí (hạng 6–7) ⇒ có; trên F: bốn bạn 5 câu (B, C, D, E) ⇒ thêm 4 câu; thoát cần thêm 4 (đạt 6 câu thì hạng 2)
    expect((await goi(d, 'HS7106')).cuaEm).toEqual({ hang: 6, soCau: 2, themDeVuot: { soCau: 4, soBan: 4 }, nhomCuoi: true, thoatNhomCuoi: { soCau: 4 } })
    // H chưa học: hạng null; bạn cuối 2 câu (F, G) ⇒ 3 câu để vượt 2 bạn; 7/9 ≥ 60 % ⇒ nhomCuoi; vào bảng và thoát nhóm cuối cần 3 câu
    expect((await goi(d, 'HS7108')).cuaEm).toEqual({ hang: null, soCau: 0, themDeVuot: { soCau: 3, soBan: 2 }, nhomCuoi: true, thoatNhomCuoi: { soCau: 3 } })
    // I chỉ có dòng bỏ trống ⇒ như chưa học
    expect((await goi(d, 'HS7109')).cuaEm).toMatchObject({ hang: null, soCau: 0 })
  })
  it('daHoc chỉ đếm em ≥ 1 câu (dòng bỏ trống không phải "đã làm")', async () => {
    const d = await lopMau()
    expect(await goi(d, 'HS7108')).toMatchObject({ siSo: 9, daHoc: 7 })
  })
})

describe('DISTINCT qid · chỉ hôm nay theo ngày VN', () => {
  it('làm lại CÙNG một câu (nguồn/lần khác nhau) không tăng số; câu làm hôm qua rồi làm lại hôm nay tính 1 hôm nay', async () => {
    const d = taoD1That()
    themEm(d, 'X1', 'Lê Xuân Một')
    themEm(d, 'X2', 'Lê Xuân Hai')
    await lam(d, 'X1', 'Q1', iso('08:00'))
    await lam(d, 'X1', 'Q1', iso('08:05'), { nguon: 'mom', ma: 'B2' })
    await lam(d, 'X1', 'Q1', iso('08:10'), { lan: 2 })
    await lam(d, 'X1', 'Q1', iso('08:15'), { nguon: 'on_lai', ma: 'ON', kq: 0 })
    await lam(d, 'X1', 'Q2', iso('08:20'))
    await lam(d, 'X2', 'Q1', iso('08:00', HOM_QUA))
    await lam(d, 'X2', 'Q1', iso('09:00'), { ma: 'M2' }) // khoá sổ khác (bài khác) — cùng khoá thì sổ bỏ qua
    expect((await goi(d, 'X1')).cuaEm).toMatchObject({ hang: 1, soCau: 2 })
    expect((await goi(d, 'X2')).cuaEm).toMatchObject({ hang: 2, soCau: 1 })
  })
  it('câu 23:30 giờ VN hôm qua KHÔNG tính hôm nay; câu 00:30 giờ VN hôm nay (còn là ngày hôm qua theo UTC) VẪN tính', async () => {
    const d = taoD1That()
    themEm(d, 'N1', 'Vũ Đêm Qua')
    themEm(d, 'N2', 'Vũ Sáng Sớm')
    await lam(d, 'N1', 'Q1', iso('23:30', HOM_QUA))
    await lam(d, 'N1', 'Q2', iso('23:59', HOM_QUA))
    await lam(d, 'N2', 'Q1', iso('00:30'))
    const r1 = await goi(d, 'N1')
    expect(r1.cuaEm).toMatchObject({ hang: null, soCau: 0 })
    expect(r1.daHoc).toBe(1)
    expect((await goi(d, 'N2')).cuaEm).toMatchObject({ hang: 1, soCau: 1 })
  })
  it('sang ngày mới (00:30 ngày 23) thì câu 23:20 ngày 22 hết tính; câu của ngày sau chưa tính khi còn ở ngày 22', async () => {
    const d = taoD1That()
    themEm(d, 'M1', 'Đỗ Muộn Một')
    themEm(d, 'M2', 'Đỗ Muộn Hai')
    await lam(d, 'M1', 'Q1', iso('23:20'))
    await lam(d, 'M2', 'Q1', iso('00:10', '2026-09-23'))
    const truoc = Date.parse('2026-09-22T23:30:00+07:00')
    const sau = Date.parse('2026-09-23T00:30:00+07:00')
    expect((await goi(d, 'M1', truoc)).cuaEm).toMatchObject({ hang: 1, soCau: 1 })
    expect((await goi(d, 'M1', sau)).cuaEm).toMatchObject({ hang: null, soCau: 0 })
    expect((await goi(d, 'M2', sau)).cuaEm).toMatchObject({ hang: 1, soCau: 1 })
    expect(ngayVn(sau)).toBe('2026-09-23')
  })
  it('chuỗi ngày: tính lùi từ hôm nay, đứt khi thiếu một ngày', async () => {
    const d = taoD1That()
    themEm(d, 'C1', 'Bùi Chuỗi Bốn')
    themEm(d, 'C2', 'Bùi Chuỗi Đứt')
    for (const n of [NGAY, HOM_QUA, HAI_NGAY_TRUOC, ba]) await lam(d, 'C1', `Q-${n}`, iso('08:00', n))
    for (const n of [NGAY, HAI_NGAY_TRUOC, ba]) await lam(d, 'C2', `Q-${n}`, iso('08:00', n))
    const top = ((await goi(d, 'C1')).top as { chuoi: number }[]).map((x) => x.chuoi)
    expect(top).toEqual([4, 1]) // C1 chuỗi 4 (hạng 1 nhờ chuỗi khi bằng số câu), C2 đứt ngày 21 ⇒ 1
  })
})

describe('lớp theo ten_lop, theo khối khi NULL', () => {
  it('cùng lớp = cùng tên lớp hiệu lực; danh sách cổng (chưa có tài khoản) tính vào sĩ số; em đã khoá và tài khoản thử KHÔNG tính; lớp khác không lọt vào top', async () => {
    const d = taoD1That()
    themEm(d, 'K1', 'Trần Tinh Một', '12', '12 - Tinh Hoa')
    themEm(d, 'K2', 'Trần Tinh Hai', '12', '12 - Tinh Hoa')
    themEm(d, 'K3', 'Lý Thường Ba', '12', null)
    themEm(d, 'K4', 'Lý Thường Bốn', '12', null)
    themEm(d, 'K5', 'Phan Mười Một', '11', null)
    themEm(d, 'KK', 'Phan Đã Khoá', '12', null)
    d.sql.prepare("UPDATE hoc_sinh SET trang_thai = 'khoa' WHERE sbd = 'KK'").run()
    themEm(d, SBD_THU_NGHIEM, 'Tài khoản thử', '12', null)
    themDanhSach(d, 'DS1', 'Hồ Cổng Một', '12')
    await lamN(d, 'K5', 20, '08:00')
    await lamN(d, 'K1', 3, '08:00')
    await lamN(d, 'K3', 1, '08:00')
    await lamN(d, 'KK', 30, '08:00')
    await lamN(d, SBD_THU_NGHIEM, 30, '08:00')
    const tinhHoa = await goi(d, 'K2')
    expect(tinhHoa).toMatchObject({ lop: '12 - Tinh Hoa', siSo: 2, daHoc: 1 })
    expect((tinhHoa.top as { ten: string }[]).map((x) => x.ten)).toEqual(['Tinh Một T.'])
    const thuong = await goi(d, 'K4')
    expect(thuong).toMatchObject({ lop: '12 - Lớp Thường', siSo: 3, daHoc: 1 }) // K3, K4 và DS1 (danh sách cổng)
    expect((thuong.top as { ten: string }[]).map((x) => x.ten)).toEqual(['Thường Ba L.'])
    expect(await goi(d, 'K5')).toMatchObject({ lop: '11', siSo: 1, daHoc: 1, cuaEm: { hang: 1, soCau: 20 } })
    expect(await goi(d, 'KK')).toMatchObject({ ok: true, lop: '', siSo: 0 }) // đã khoá: không thuộc lớp nào
  })
  it('tài khoản thử tự xem: không thuộc lớp nào ⇒ ok, siSo 0, top rỗng (app ẩn thẻ); SBD_THU_NGHIEM khớp SBD_THU của Bảng tin', async () => {
    const d = taoD1That()
    themEm(d, SBD_THU_NGHIEM, 'Tài khoản thử')
    themEm(d, 'K1', 'Trần Tinh Một')
    await lamN(d, SBD_THU_NGHIEM, 5, '08:00')
    expect(await goi(d, SBD_THU_NGHIEM)).toEqual({
      ok: true, lop: '', siSo: 0, daHoc: 0, top: [], cuaEm: { hang: null, soCau: 0, themDeVuot: null, nhomCuoi: false }, capNhatLuc: new Date(NOW).toISOString(),
    })
    expect(SBD_THU_NGHIEM).toBe(SBD_THU)
  })
  it('chưa có cột ten_lop (migration chưa chạy) ⇒ vẫn chạy, mọi em ở lớp mặc định theo khối', async () => {
    const d = taoD1That()
    themEm(d, 'L1', 'Ngô Lùi Một', '12', '12 - Tinh Hoa')
    themEm(d, 'L2', 'Ngô Lùi Hai', '12', null)
    d.sql.exec('ALTER TABLE hoc_sinh DROP COLUMN ten_lop')
    await lamN(d, 'L1', 2, '08:00')
    expect(await goi(d, 'L2')).toMatchObject({ ok: true, lop: '12 - Lớp Thường', siSo: 2, daHoc: 1 })
  })
})

describe('em duy nhất trong lớp', () => {
  it('chưa học: hạng null, themDeVuot { 1, 0 }, không nhomCuoi; đã học: hạng 1, themDeVuot null, top một dòng laEm', async () => {
    const d = taoD1That()
    themEm(d, 'ONE', 'Cao Duy Nhất', '10')
    expect(await goi(d, 'ONE')).toMatchObject({ lop: '10', siSo: 1, daHoc: 0, top: [], cuaEm: { hang: null, soCau: 0, themDeVuot: { soCau: 1, soBan: 0 }, nhomCuoi: false } })
    await lamN(d, 'ONE', 3, '08:00')
    const r = await goi(d, 'ONE')
    expect(r).toMatchObject({ siSo: 1, daHoc: 1, cuaEm: { hang: 1, soCau: 3, themDeVuot: null, nhomCuoi: false } })
    expect(r.top).toEqual([{ hang: 1, ten: 'Duy Nhất C.', soCau: 3, chuoi: 1, thu: null, laEm: true }])
  })
})

describe('top ≤ 3, riêng tư, thần thú', () => {
  it('đúng 3 dòng dù 7 em đã học; không chứa sbd, họ tên đầy đủ, em ngoài top, biệt danh, EXP; đúng các khoá', async () => {
    const d = await lopMau()
    hoSoThu(d, 'HS7101', { pet: 'lua_phuong', cap: 6 })
    hoSoThu(d, 'HS7104', { pet: 'nuoc_long', cap: 9 })
    const r = await goi(d, 'HS7104') // D (ngoài top) xem
    expect((r.top as unknown[]).length).toBe(3)
    const s = JSON.stringify(r)
    for (const sbd of ['HS7101', 'HS7102', 'HS7103', 'HS7104', 'HS7105', 'HS7106', 'HS7107', 'HS7108', 'HS7109']) expect(s, sbd).not.toContain(sbd)
    for (const ten of ['Lê Văn An', 'Phạm Thu Bình', 'Đặng Gia Cường']) expect(s, ten).not.toContain(ten) // họ tên đầy đủ của em TRONG top
    for (const ten of ['Minh Dũng', 'Quốc Em', 'Bùi Thị Phương', 'Phương', 'Hải Giang', 'Hoa Hà', 'Ngọc Ích']) expect(s, ten).not.toContain(ten) // em NGOÀI top (kể cả chính em D)
    expect(s).not.toContain('Biệt danh riêng')
    expect(s).not.toContain('987654') // EXP trong hồ sơ game
    expect(Object.keys(r).sort()).toEqual(['capNhatLuc', 'cuaEm', 'daHoc', 'lop', 'ok', 'siSo', 'top'])
    for (const t of r.top as Record<string, unknown>[]) expect(Object.keys(t).sort()).toEqual(['chuoi', 'hang', 'laEm', 'soCau', 'ten', 'thu'])
    expect(Object.keys(r.cuaEm as object).sort()).toEqual(['hang', 'nhomCuoi', 'soCau', 'themDeVuot'])
  })
  it('chính em ở top ⇒ đúng một dòng laEm = true', async () => {
    const d = await lopMau()
    const r = await goi(d, 'HS7102')
    expect((r.top as { laEm: boolean }[]).map((x) => x.laEm)).toEqual([false, true, false])
  })
  it('thu = { ma, cap } đọc thật từ hồ sơ thần thú; chưa có hồ sơ / chưa chọn thú ⇒ null; mã cũ đổi theo ALIASES; cấp kẹp 1–120', async () => {
    const d = await lopMau()
    hoSoThu(d, 'HS7101', { pet: 'lua_phuong', cap: 6 })
    hoSoThu(d, 'HS7103', { pet: 'dat_quy', cap: 5, choice: true }) // đang ở màn chọn thú ⇒ chưa chọn
    const r = await goi(d, 'HS7108')
    expect((r.top as { thu: unknown }[]).map((x) => x.thu)).toEqual([{ ma: 'lua_phuong', cap: 6 }, null, null]) // B chưa có hồ sơ
    hoSoThu(d, 'HS7102', { pet: 'hoa_long', cap: 500 })
    hoSoThu(d, 'HS7103', { pet: 'sangy_cu', cap: 0 })
    const r2 = await goi(d, 'HS7108')
    expect((r2.top as { thu: unknown }[]).map((x) => x.thu)).toEqual([{ ma: 'lua_phuong', cap: 6 }, { ma: 'lua_phuong', cap: 120 }, { ma: 'sangy_cu', cap: 1 }])
    hoSoThu(d, 'HS7101', { pet: 'thu_la_hoac_khong_co' })
    expect(((await goi(d, 'HS7108')).top as { thu: unknown }[])[0]!.thu).toBeNull() // loài lạ ⇒ không bịa
  })
})

describe('chỉ đọc · trần truy vấn · thiếu bảng', () => {
  it('KHÔNG câu INSERT/UPDATE/DELETE nào chạy và không dùng batch; ≤ 4 truy vấn (3 xếp hạng + 1 thần thú) / ≤ 3 (hangChamCuaEm) / ≤ 2 (lệnh thầy)', async () => {
    const d = await lopMau()
    hoSoThu(d, 'HS7101')
    const ghi = dungGhi(d)
    const b0 = d.soLenh.batch
    let t = d.soLenh.prepare
    await goi(d, 'HS7104')
    expect(d.soLenh.prepare - t).toBeLessThanOrEqual(4)
    t = d.soLenh.prepare
    await goi(d, 'HS7108')
    expect(d.soLenh.prepare - t).toBeLessThanOrEqual(4)
    t = d.soLenh.prepare
    await hangChamCuaEm(d.env, 'HS7104', NOW)
    expect(d.soLenh.prepare - t).toBeLessThanOrEqual(3)
    t = d.soLenh.prepare
    await gvChuaHocHomNay(d.env, NOW)
    expect(d.soLenh.prepare - t).toBeLessThanOrEqual(2)
    expect(ghi).toEqual([])
    expect(d.soLenh.batch).toBe(b0)
  })
  it('chưa có bảng exp_so ⇒ không ai "đạt" nhưng vẫn xếp theo số câu, chuỗi, thời điểm; chưa có su_kien_hoc ⇒ chưa ai học', async () => {
    const d = await lopMau()
    d.sql.exec('DROP TABLE exp_so')
    const r = await goi(d, 'HS7104')
    expect(r).toMatchObject({ ok: true, daHoc: 7 })
    // B mất "đạt" ⇒ C (chuỗi 3) lên trên B
    expect((r.top as { ten: string }[]).map((x) => x.ten)).toEqual(['Văn An L.', 'Gia Cường Đ.', 'Thu Bình P.'])
    d.sql.exec('DROP TABLE su_kien_hoc')
    expect(await goi(d, 'HS7104')).toMatchObject({ ok: true, siSo: 9, daHoc: 0, top: [], cuaEm: { hang: null, soCau: 0, themDeVuot: { soCau: 1, soBan: 0 }, nhomCuoi: false } })
    expect(await hangChamCuaEm(d.env, 'HS7104', NOW)).toBeNull()
  })
  it('lỗi không đoán trước (mất bảng hồ sơ) ⇒ { ok:false } bằng lời tiếng Việt, không lộ câu SQL; hangChamCuaEm ⇒ null', async () => {
    const d = await lopMau()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    d.sql.exec('DROP TABLE hoc_sinh')
    const r = await goi(d, 'HS7104')
    expect(r).toEqual({ ok: false, error: LOI_KHONG_XEM_DUOC })
    expect(await hangChamCuaEm(d.env, 'HS7104', NOW)).toBeNull()
  })
})

// ================================================================== LỆNH PHỤ HUYNH · LỆNH THẦY ==================================================================

describe('hangChamCuaEm', () => {
  it('hạng + sĩ số của lớp em; đồng hạng cùng hạng; chưa học / không có trong lớp / tài khoản thử ⇒ null', async () => {
    const d = await lopMau()
    expect(await hangChamCuaEm(d.env, 'HS7101', NOW)).toEqual({ hang: 1, siSo: 9 })
    expect(await hangChamCuaEm(d.env, 'HS7104', NOW)).toEqual({ hang: 5, siSo: 9 })
    expect(await hangChamCuaEm(d.env, 'HS7106', NOW)).toEqual({ hang: 6, siSo: 9 })
    expect(await hangChamCuaEm(d.env, 'HS7107', NOW)).toEqual({ hang: 6, siSo: 9 })
    expect(await hangChamCuaEm(d.env, 'HS7108', NOW)).toBeNull()
    expect(await hangChamCuaEm(d.env, 'HS7109', NOW)).toBeNull() // chỉ có dòng bỏ trống
    expect(await hangChamCuaEm(d.env, 'KHONG_CO', NOW)).toBeNull()
    expect(await hangChamCuaEm(d.env, SBD_THU_NGHIEM, NOW)).toBeNull()
  })
})

describe('gvChuaHocHomNay', () => {
  it('theo lớp: em CHƯA học hôm nay / sĩ số + tên thật; chỉ lớp có em chưa học; lớp và em xếp theo tên; không tính em khoá, tài khoản thử; bỏ trống và học hôm qua vẫn là chưa học', async () => {
    const d = taoD1That()
    const T = (s: string, t: string, lop = '12', tenLop: string | null = null) => themEm(d, s, t, lop, tenLop)
    T('T1', 'Nguyễn Văn Bình')
    T('T2', 'Trần Thị An')
    T('T3', 'Lê Minh Cường')
    T('T4', 'Phạm Anh Dũng')
    T('T5', 'Hoàng Bảo Châu')
    T('U1', 'Vương Tinh Một', '12', '12 - Tinh Hoa')
    T('U2', 'Vương Tinh Hai', '12', '12 - Tinh Hoa')
    T('V1', 'Mai Mười Một', '11')
    T('KK', 'Đã Khoá Em')
    d.sql.prepare("UPDATE hoc_sinh SET trang_thai = 'khoa' WHERE sbd = 'KK'").run()
    T(SBD_THU_NGHIEM, 'Tài khoản thử')
    themDanhSach(d, 'D1', 'Đỗ Văn Hải', '12')
    await lam(d, 'T3', 'Q1', iso('08:00'))
    await lam(d, 'T4', 'Q1', iso('08:00'), { kq: null })
    await lam(d, 'T5', 'Q1', iso('08:00', HOM_QUA))
    await lam(d, 'U1', 'Q1', iso('08:00'))
    await lam(d, 'U2', 'Q1', iso('08:00'))
    const r = await gvChuaHocHomNay(d.env, NOW)
    expect(r.ngay).toBe(NGAY)
    expect(r.theoLop.map((l) => l.lop)).toEqual(['11', '12 - Lớp Thường']) // Tinh Hoa đã học hết ⇒ vắng
    expect(r.theoLop[0]).toEqual({ lop: '11', siSo: 1, chuaHoc: 1, em: [{ sbd: 'V1', hoTen: 'Mai Mười Một' }] })
    const thuong = r.theoLop[1]!
    expect(thuong).toMatchObject({ lop: '12 - Lớp Thường', siSo: 6, chuaHoc: 5 }) // T1..T5 + D1 (danh sách cổng); T3 đã học
    // xếp theo TÊN (chữ cuối): An, Bình, Châu, Dũng, Hải
    expect(thuong.em.map((x) => x.sbd)).toEqual(['T2', 'T1', 'T5', 'T4', 'D1'])
    expect(thuong.em[0]).toEqual({ sbd: 'T2', hoTen: 'Trần Thị An' })
    expect(JSON.stringify(r)).not.toContain('KK')
    expect(JSON.stringify(r)).not.toContain(SBD_THU_NGHIEM)
  })
  it('nửa đêm giờ VN: 23:59 ngày 22 vẫn là ngày 22, 00:01 ngày 23 thì em học tối qua thành "chưa học"', async () => {
    const d = taoD1That()
    themEm(d, 'P1', 'Đinh Phiên Một')
    await lam(d, 'P1', 'Q1', iso('23:20'))
    expect((await gvChuaHocHomNay(d.env, Date.parse('2026-09-22T23:59:00+07:00'))).theoLop).toEqual([])
    expect((await gvChuaHocHomNay(d.env, Date.parse('2026-09-23T00:01:00+07:00'))).theoLop).toEqual([{ lop: '12 - Lớp Thường', siSo: 1, chuaHoc: 1, em: [{ sbd: 'P1', hoTen: 'Đinh Phiên Một' }] }])
  })
  it('chưa có sổ học ⇒ mọi em là "chưa học"; không lớp nào ⇒ theoLop rỗng', async () => {
    const d = taoD1That()
    expect((await gvChuaHocHomNay(d.env, NOW)).theoLop).toEqual([])
    themEm(d, 'S1', 'Lê Sổ Một')
    d.sql.exec('DROP TABLE su_kien_hoc')
    expect((await gvChuaHocHomNay(d.env, NOW)).theoLop).toEqual([{ lop: '12 - Lớp Thường', siSo: 1, chuaHoc: 1, em: [{ sbd: 'S1', hoTen: 'Lê Sổ Một' }] }])
  })
})
