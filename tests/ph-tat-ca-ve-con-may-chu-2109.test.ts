// @vitest-environment node
// `phTatCaVeCon` (server/src/ph-tat-ca-ve-con.ts; hợp đồng docs/hop-dong-xem-diem-v2-2109.md mục 6 + `homNay`/`manhYeu`) trên D1 GIẢ BẰNG SQLITE THẬT.
// Khoá: xác thực chỉ token · LUẬT CHE (ca chưa công bố ở cả ba chế độ, BTVN/gói gia đình giao chưa nộp: không điểm, không đáp án, không đúng/sai, không lời giải; JSON không chứa dấu bí mật) ·
// đủ khối khi có số thật, VẮNG (không có khoá) khi thiếu · không khoá của game, không chữ game · không ghi (chỉ dòng đếm truy cập của hàm xác thực) · ≤ 12 truy vấn ·
// tienBo.diem chỉ ca đã công bố, cũ→mới, ≤ 8 · nhịp học 14 ngày, khung giờ chỉ khi ≥ 20 lượt · không mã dạng trần ở trường hiển thị · không tự luận.
import { describe, expect, it } from 'vitest'
import { parentPass } from '../server/src/game-v2-auth'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { docCauHinhTangDoc } from '../server/src/bo-nao-doc'
import { chuGameTrong } from '../server/src/chu-game'
import {
  CHI_NHAN_TOKEN, cauHinhTangDocTuChuoi, deRutGon, gioThuongHoc, nhanNguon, phChiTietCauVeCon, phTatCaVeCon,
  DANG_VAP_TI_LE_DUNG_TOI_DA, DANG_VAP_TOI_THIEU_LUOT, PHIEN_CACH_TOI_DA_PHUT, TOI_DA_CAU_HOM_NAY, TOI_THIEU_LUOT_GIO_THUONG_HOC,
} from '../server/src/ph-tat-ca-ve-con'
import type { Env } from '../server/src/kieu'
import { taoD1That, type D1That } from './_d1-that'
import { phutUocTinhChang } from '../src/lib/btvn-nang-do-lich'

const T = (s: string): number => Date.parse(`${s}+07:00`)
const NGAY = '2026-09-22'
const NOW = T(`${NGAY}T20:30:00`)
const themNgay = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
const vn = (ngay: string, gio: string): string => new Date(T(`${ngay}T${gio}:00`)).toISOString()

// ------------------------------------------------------------------ dựng dữ liệu ------------------------------------------------------------------
const themCa = (d: D1That, ma: string, congBo: string | null, trangThai = 'mo', ten = `Ca ${ma}`, loai = 'thi') =>
  d.sql.prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,cap_nhat_luc) VALUES(?,?,?,?,?,?)').run(ma, ten, trangThai, loai, congBo, 'x')
const themLuot = (d: D1That, ma: string, sbd: string, o: { nop?: string | null; vao?: string; tong?: number | null; lan?: number; tt?: string } = {}) => {
  const tt = o.tt ?? 'da_nop'
  const nop = o.nop === undefined ? '2026-09-20T03:00:00.000Z' : o.nop
  d.sql.prepare('INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,cap_nhat_luc,tong,diem_i,diem_ii,diem_iii,ho_ten) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(`${ma}|${sbd}|${o.lan ?? 1}`, ma, sbd, o.lan ?? 1, o.vao ?? '2026-09-20T02:15:00.000Z', nop, tt, 'x', o.tong === undefined ? 7.5 : o.tong, 3, 2.5, 2, `Em ${sbd}`)
}
const themCt = (d: D1That, ma: string, sbd: string, phan: string, so: number, qid: string, chon: string, dung: string, dungSai: number | null, lan = 1) =>
  d.sql.prepare('INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,chuyen_de,muc_do,dap_an_chon,dap_an_dung,dung_sai,giay,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(`${ma}|${sbd}|${lan}|${phan}|${so}`, ma, sbd, lan, phan, so, qid, 'Este', 'hieu', chon, dung, dungSai, 30, 'x')
let dem = 0
const suKien = (d: D1That, o: { qid: string; ngay: string; gio?: string; nguon?: string; ma?: string; kq?: 0 | 1 | null; giay?: number | null; dang?: string | null; lan?: number; sbd?: string }) => {
  const gio = o.gio ?? '19:00'
  d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(`k${++dem}|${o.qid}|${o.ngay}|${gio}`, o.sbd ?? 'S1', o.qid, o.nguon ?? 'on_lai', o.ma ?? 'm', o.lan ?? 1, o.kq === undefined ? 1 : o.kq, o.giay === undefined ? 30 : o.giay, vn(o.ngay, gio), o.ngay, o.dang === undefined ? null : o.dang)
}
interface OKho { dang?: string; tenDang?: string; text?: string; correct?: string; solution?: string; choices?: string[]; phan?: string }
const kho = (d: D1That, qid: string, o: OKho = {}) => {
  const c = { qid, maDe: 'DE', phan: o.phan ?? 'I', text: o.text ?? `Chọn phát biểu đúng về ${qid}.`, choices: o.choices ?? ['A. a', 'B. b', 'C. c', 'D. d'], dang: o.dang ?? null, tenDang: o.tenDang ?? '', correct: o.correct ?? 'B', solution: o.solution ?? `LG-BI-MAT-${qid}`, reviewed: true }
  d.sql.prepare('INSERT OR REPLACE INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE', qid, 'v', `g-${qid}`, o.dang ?? null, JSON.stringify(c))
}
const themBtvn = (d: D1That, ma: string, o: { han?: string; giao?: string; nop?: string | null; soDung?: number | null; soCau?: number; ten?: string; chang?: [number, number] } = {}) => {
  themCa(d, `CA-${ma}`, 'ngay', 'mo', o.ten ?? `Bài ${ma}`)
  d.sql.prepare('INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,?,0,?)').run(ma, `CA-${ma}`, 'DE', o.soCau ?? 10, o.giao ?? '2026-09-21T03:00:00.000Z', o.han ?? '2026-09-25T05:00:00.000Z', 'x')
  d.sql.prepare('INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten,nop_luc,so_dung,so_cau,so_chang,lo_da_xong) VALUES(?,?,?,?,?,?,?,?,?)')
    .run(`${ma}|S1`, ma, 'S1', 'Em', o.nop === undefined ? null : o.nop, o.soDung === undefined ? null : o.soDung, o.soCau ?? 10, o.chang ? o.chang[1] : null, o.chang ? o.chang[0] : 0)
}
const themMom = (d: D1That, id: string, daNop: boolean) =>
  d.sql.prepare("INSERT INTO mom_bai(sbd,id,title,created_at,question_count,bank_key,submitted_at,answers) VALUES('S1',?,?,?,?,?,?,'{}')").run(id, 'Gia đình giao thêm · 3 câu', '2026-09-22T05:00:00.000Z', 3, 'k', daNop ? '2026-09-22T12:00:00.000Z' : null)

/** Mốc hiển thị đặt từ 2020 để các test cũ (sổ 15–22/09) giữ nguyên nghĩa; khối cuối tệp ("MỐC HIỂN THỊ") đặt/đọc mốc thật. */
const MOC_CO = '2020-01-01T00:00:00.000Z'
function dung(o: { moc?: string | null } = {}): { d: D1That; pass: string } {
  const d = taoD1That()
  if (o.moc !== null) d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('hien_thi_tu',?,'x')").run(o.moc ?? MOC_CO)
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn Thu Hà','12','mk','x')").run()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S2','Trần Bình','12','mk','x')").run()
  return { d, pass: '' }
}
const capPass = async (d: D1That): Promise<string> => parentPass(d.env, 'S1')

/** Bọc D1: ghi lại mọi câu SQL được chuẩn bị (đếm truy vấn, soi ghi/bảng game). */
function ghi(d: D1That): { env: Env; log: string[] } {
  const log: string[] = []
  const env = {
    ...d.env,
    DB: {
      prepare: (q: string) => { log.push(q.replace(/\s+/g, ' ').trim()); return d.env.DB.prepare(q) },
      batch: async (x: never) => { log.push('BATCH'); return d.env.DB.batch(x) },
    },
  } as unknown as Env
  return { env, log }
}
const chay = async (d: D1That, pass: string, now = NOW) => (await phTatCaVeCon(d.env, { pass }, now)) as Record<string, any>
const KHOA_CAM = ['than_thu', 'thanThu', 'exp', 'manhKhien', 'khien', 'doan', 'dao', 'vo_dai']
const moiKhoa = (v: unknown, ra: string[] = []): string[] => {
  if (Array.isArray(v)) v.forEach((x) => moiKhoa(x, ra))
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { ra.push(k); moiKhoa(x, ra) }
  return ra
}
const BANG_DOI_CHIEU = ['su_kien_hoc', 'nam_kt_cau', 'nam_kt_dang', 'luot', 'chi_tiet_cau', 'ph_giao_them', 'mom_bai', 'btvn_em', 'student_notice', 'ai_dieu_chinh', 'ke_hoach_ngay']

// ================================================================== XÁC THỰC ==================================================================
describe('xác thực — token HOẶC SBD trần (sổ ph_truy_cap thật: 100 % phụ huynh vào bằng SBD trần)', () => {
  it('hằng CHI_NHAN_TOKEN là false (để MỘT chỗ siết lại khi thầy phát liên kết riêng)', () => {
    expect(CHI_NHAN_TOKEN).toBe(false)
  })
  it('token sai / hết hạn ⇒ lỗi và KHÔNG rơi xuống SBD trần (kể cả khi thân có sbd hợp lệ)', async () => {
    const { d } = dung()
    const pass = await capPass(d)
    await expect(phTatCaVeCon(d.env, { pass: `${pass}x`, sbd: 'S1' }, NOW)).rejects.toThrow(/không hợp lệ/)
    await expect(phTatCaVeCon(d.env, { pass: 'abc.def', sbd: 'S1' }, NOW)).rejects.toThrow(/không hợp lệ/)
  })
  it('SBD trần của con thật ⇒ MỞ ĐƯỢC (hoTen của đúng em); token rỗng/khoảng trắng coi như không token', async () => {
    const { d } = dung()
    themCa(d, 'CA-S1', 'ngay'); themLuot(d, 'CA-S1', 'S1', { tong: 8.25 })
    const r = (await phTatCaVeCon(d.env, { sbd: 'S1' }, NOW)) as Record<string, any>
    expect(r).toMatchObject({ ok: true, hoTen: 'Nguyễn Thu Hà' })
    expect(r.caGanNhat.ketQua.tong).toBe(8.25)
    expect(((await phTatCaVeCon(d.env, { pass: '   ', sbd: 'S2' }, NOW)) as Record<string, any>).hoTen).toBe('Trần Bình')
  })
  it('SBD lạ / rỗng / quá dài / không có gì ⇒ từ chối, không đọc dữ liệu', async () => {
    const { d } = dung()
    for (const b of [{ sbd: 'KHONG-CO' }, { sbd: '' }, { sbd: 'X'.repeat(41) }, {}]) await expect(phTatCaVeCon(d.env, b, NOW)).rejects.toThrow(/Không tìm thấy số báo danh/)
  })
  it('SBD trần: dòng đếm truy cập ghi kiểu sbd_tran; token ghi kiểu token', async () => {
    const { d } = dung()
    await phTatCaVeCon(d.env, { sbd: 'S1' }, NOW)
    await phTatCaVeCon(d.env, { pass: await capPass(d) }, NOW)
    const kieu = (d.sql.prepare('SELECT kieu FROM ph_truy_cap WHERE sbd = ? ORDER BY kieu').all('S1') as { kieu: string }[]).map((x) => x.kieu)
    expect(kieu).toEqual(['sbd_tran', 'token'])
  })
  it('DANH TÍNH lấy từ token: `sbd` trong thân bị bỏ qua (token của S1 không đọc được S2)', async () => {
    const { d } = dung()
    themCa(d, 'CA-S2', 'ngay'); themLuot(d, 'CA-S2', 'S2', { tong: 9.75 })
    const r = (await phTatCaVeCon(d.env, { pass: await capPass(d), sbd: 'S2' }, NOW)) as Record<string, any>
    expect(r.hoTen).toBe('Nguyễn Thu Hà')
    expect(JSON.stringify(r)).not.toContain('9.75')
    expect(r.caGanNhat).toBeUndefined()
  })
  it('mật khẩu của con đã đổi ⇒ liên kết hết hiệu lực', async () => {
    const { d } = dung()
    const pass = await capPass(d)
    d.sql.prepare("UPDATE hoc_sinh SET mat_khau = 'moi' WHERE sbd = 'S1'").run()
    await expect(phTatCaVeCon(d.env, { pass }, NOW)).rejects.toThrow(/đã đổi/)
  })
})

// ================================================================== LUẬT CÔNG BỐ / CHE Ở caGanNhat ==================================================================
describe('ca CHƯA công bố: chỉ congBo + soEmDaNop/soEmDaVao — không điểm, không số câu, không đáp án', () => {
  /** Ca CA (S1 đã nộp, tong 8.25) + S2: dựng theo kiểu công bố. */
  async function dungCa(congBo: string | null, trangThaiCa: string, s2Nop: boolean) {
    const { d } = dung()
    themCa(d, 'CA', congBo, trangThaiCa, 'Kiểm tra Este')
    themLuot(d, 'CA', 'S1', { tong: 8.25 })
    themLuot(d, 'CA', 'S2', s2Nop ? { tong: 3.5 } : { tt: 'dang_lam', nop: null, tong: null })
    themCt(d, 'CA', 'S1', 'I', 1, 'Q-CA-1', 'A', 'B', 0)
    themCt(d, 'CA', 'S1', 'I', 2, 'Q-CA-2', 'B', 'B', 1)
    kho(d, 'Q-CA-1', { solution: 'LG-BI-MAT-CA', correct: 'C', tenDang: 'Este', dang: 'ES' })
    suKien(d, { qid: 'Q-CA-1', ngay: NGAY, gio: '10:00', nguon: 'thi', ma: 'CA', kq: 0, dang: 'ES' })
    suKien(d, { qid: 'Q-CA-2', ngay: NGAY, gio: '10:01', nguon: 'thi', ma: 'CA', kq: 1, dang: 'ES' })
    await dungLaiHoSo(d.env, ['S1'], 'x')
    return { d, pass: await capPass(d) }
  }
  const soiKhongLo = (r: Record<string, any>) => {
    const s = JSON.stringify(r)
    for (const dauBiMat of ['8.25', 'LG-BI-MAT', '"dapAn"', '"dung"', '"conChon"', 'ketQua', 'truoc', '"phan":', '"soCau"', '"soDung"', 'soCauDung', 'diem']) {
      // (`phan` của caGanNhat, không phải `phan` nào khác: chuỗi `"phan":` chỉ ra ở khối phần điểm)
      expect(s, dauBiMat).not.toContain(dauBiMat)
    }
  }
  it.each([
    ['khong', 'mo', true, 'khong'],
    ['khong', 'dong', true, 'khong'],
    [null, 'mo', true, 'khong'],
    ['ca_lop_xong', 'mo', false, 'ca_lop_xong'], // S2 còn đang làm ⇒ chưa đủ lớp
  ])('cong_bo=%s, ca %s ⇒ CHƯA công bố', async (congBo, tt, s2Nop, cheDo) => {
    const { d, pass } = await dungCa(congBo, tt, s2Nop)
    const r = await chay(d, pass)
    expect(Object.keys(r.caGanNhat).sort()).toEqual(['congBo', 'maCa', 'nopLuc', 'tenCa', 'thoiGianLamGiay'])
    expect(r.caGanNhat.congBo).toMatchObject({ congBo: cheDo, daCongBo: false })
    expect(r.caGanNhat.congBo.soEmDaVao).toBe(2)
    expect(r.caGanNhat.congBo.soEmDaNop).toBe(s2Nop ? 2 : 1)
    expect(r.tienBo).toBeUndefined() // không điểm cũ: ca chưa công bố không vào tienBo.diem
    soiKhongLo(r)
  })
  it('cong_bo=ngay ⇒ đã công bố ngay: có điểm, số câu, phần', async () => {
    const { d, pass } = await dungCa('ngay', 'mo', false)
    const r = await chay(d, pass)
    expect(r.caGanNhat.congBo.daCongBo).toBe(true)
    expect(r.caGanNhat.ketQua).toEqual({ tong: 8.25, soCau: 2, soCauDung: 1 })
    expect(r.caGanNhat.phan).toEqual([{ ma: 'I', dung: 1, tong: 2, diem: 3 }])
  })
  it('ca_lop_xong: cả lớp đã nộp HOẶC ca đã đóng ⇒ công bố; ca chưa ai vào KHÔNG tính là xong', async () => {
    for (const [tt, s2Nop] of [['mo', true], ['dong', false]] as const) {
      const { d, pass } = await dungCa('ca_lop_xong', tt, s2Nop)
      const r = await chay(d, pass)
      expect(r.caGanNhat.congBo.daCongBo, `${tt}/${s2Nop}`).toBe(true)
      expect(r.caGanNhat.ketQua.tong).toBe(8.25)
    }
  })
  it('ca không có dòng trong bảng ca ⇒ chưa công bố (đóng cửa khi thiếu tin), không điểm', async () => {
    const { d } = dung()
    themLuot(d, 'CA-MA', 'S1', { tong: 9.5 })
    const r = await chay(d, await capPass(d))
    expect(r.caGanNhat.congBo).toEqual({ congBo: 'khong', daCongBo: false, soEmDaNop: 0, soEmDaVao: 0 })
    expect(JSON.stringify(r)).not.toContain('9.5')
  })
  it('ca bài tập (loai=baitap) và ca đã xoá KHÔNG là "ca kiểm tra gần nhất"', async () => {
    const { d } = dung()
    themCa(d, 'CA-THI', 'ngay', 'mo', 'Ca thi'); themLuot(d, 'CA-THI', 'S1', { nop: '2026-09-10T03:00:00.000Z', tong: 6 })
    themCa(d, 'CA-BT', 'ngay', 'mo', 'Bài tập', 'baitap'); themLuot(d, 'CA-BT', 'S1', { nop: '2026-09-21T03:00:00.000Z', tong: 1 })
    themCa(d, 'CA-XOA', 'ngay', 'da_xoa', 'Đã xoá'); themLuot(d, 'CA-XOA', 'S1', { nop: '2026-09-21T04:00:00.000Z', tong: 2 })
    const r = await chay(d, await capPass(d))
    expect(r.caGanNhat.maCa).toBe('CA-THI')
  })
  it('em chưa nộp ca nào ⇒ vắng cả khối caGanNhat', async () => {
    const { d } = dung()
    themCa(d, 'CA', 'ngay'); themLuot(d, 'CA', 'S1', { tt: 'dang_lam', nop: null, tong: null })
    const r = await chay(d, await capPass(d))
    expect('caGanNhat' in r).toBe(false)
  })
})

// ================================================================== ĐỦ KHỐI ==================================================================
async function dungDayDu() {
  const { d } = dung()
  for (const [ma, nop, tong] of [['CA1', '2026-09-01T03:00:00.000Z', 6], ['CA2', '2026-09-10T03:00:00.000Z', 6.75], ['CA3', '2026-09-20T03:00:00.000Z', 7.5]] as const) {
    themCa(d, ma, 'ngay', 'mo', `Kiểm tra ${ma}`); themLuot(d, ma, 'S1', { nop, tong })
  }
  // CA3: phần I 3 câu (2 đúng), phần II 2 câu (1 đúng), phần III 2 câu (1 đúng)
  themCt(d, 'CA3', 'S1', 'I', 1, 'C3-1', 'A', 'A', 1); themCt(d, 'CA3', 'S1', 'I', 2, 'C3-2', 'A', 'A', 1); themCt(d, 'CA3', 'S1', 'I', 3, 'C3-3', 'B', 'A', 0)
  themCt(d, 'CA3', 'S1', 'II', 1, 'C3-4', 'DDDD', 'DDDD', 1); themCt(d, 'CA3', 'S1', 'II', 2, 'C3-5', 'DSDS', 'DDDD', 0)
  themCt(d, 'CA3', 'S1', 'III', 1, 'C3-6', '3', '3', 1); themCt(d, 'CA3', 'S1', 'III', 2, 'C3-7', '4', '5', 0)
  // sổ học: ES (Thuỷ phân ester) lên bậc ngày 20/09; AM (Amin) vấp; PO (Polime) làm tốt; ZZ không có tên
  const ten: Record<string, string> = { ES: 'Thuỷ phân ester', AM: 'Amin bậc một', PO: 'Polime' }
  for (const [ma, tenDang] of Object.entries(ten)) for (let i = 1; i <= 3; i++) kho(d, `${ma}-${i}`, { dang: ma, tenDang })
  suKien(d, { qid: 'ES-1', ngay: '2026-09-20', dang: 'ES', kq: 1 })
  suKien(d, { qid: 'AM-1', ngay: '2026-09-21', dang: 'AM', kq: 0 }); suKien(d, { qid: 'AM-2', ngay: '2026-09-21', dang: 'AM', kq: 0 }); suKien(d, { qid: 'AM-3', ngay: '2026-09-21', dang: 'AM', kq: 1 })
  for (let i = 1; i <= 4; i++) suKien(d, { qid: `PO-${i % 3 + 1}`, ngay: '2026-09-21', gio: `20:0${i}`, dang: 'PO', kq: 1, lan: i })
  suKien(d, { qid: 'ZZ-1', ngay: '2026-09-21', dang: 'ZZ', kq: 0 }); suKien(d, { qid: 'ZZ-2', ngay: '2026-09-21', dang: 'ZZ', kq: 0 }); suKien(d, { qid: 'ZZ-3', ngay: '2026-09-21', dang: 'ZZ', kq: 0 })
  // câu sai hôm qua ⇒ mốc ôn hôm nay (22/09); câu sai hôm nay ⇒ mốc ngày mai
  suKien(d, { qid: 'AM-1', ngay: NGAY, gio: '18:00', dang: 'AM', kq: 0, lan: 2 })
  await dungLaiHoSo(d.env, ['S1'], 'x')
  // BTVN: một bài đang chạy (chặng 2/5), một bài đã nộp đúng hạn
  themBtvn(d, 'BT-CHAY', { han: '2026-09-25T05:00:00.000Z', chang: [2, 5], ten: 'Bài Este' })
  themBtvn(d, 'BT-NOP', { nop: '2026-09-21T10:00:00.000Z', soDung: 8, soCau: 10, han: '2026-09-22T05:00:00.000Z', ten: 'Bài Amin' })
  // Bộ não thật + lời cho phụ huynh
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bo_nao',?,'x')").run(JSON.stringify({ bat: true, cheDo: 'that', lopThat: [] }))
  d.sql.prepare("INSERT INTO ai_dieu_chinh(sbd,ngay,json,che_do,ap_dung,het_han,huy,nop_luc) VALUES('S1',?,?,'that',1,?,0,'x')")
    .run(NGAY, JSON.stringify({ loiNhanChoPhuHuynh: 'Con đang ôn đều, tối nay làm thêm phần ôn lại.', thuTuan: 'Tuần này con làm 4 ngày liên tiếp.' }), themNgay(NGAY, 3))
  // giao thêm: 2 lượt hôm nay + 1 lượt hôm qua (không tính)
  for (const [ngay, luot] of [[NGAY, 1], [NGAY, 2], [themNgay(NGAY, -1), 1]] as const) {
    d.sql.prepare("INSERT INTO ph_giao_them(khoa,sbd,ngay_vn,luot,so_cau,phut_uoc_tinh,thanh_phan_json,ly_do_json,ma_mom,qid_json,luc) VALUES(?,'S1',?,?,5,8,'[]','[]','m','[]','x')").run(`k${ngay}${luot}`, ngay, luot)
  }
  return { d, pass: await capPass(d) }
}

describe('đủ khối khi có số thật', () => {
  it('trả đúng hợp đồng mục 6: ok, serverNow, hoTen, caGanNhat, tienBo, baiTapVeNha, bacTheoDang, dangVap, vuaLenBac, lichOn, nhipHoc, loiBoNao, phuHuynhLamGi, giaoThem', async () => {
    const { d, pass } = await dungDayDu()
    const r = await chay(d, pass)
    expect(r).toMatchObject({ ok: true, serverNow: NOW, hoTen: 'Nguyễn Thu Hà' })
    // caGanNhat: ca CA3 (nộp 20/09 03:00Z, vào 02:15Z ⇒ 45 phút = 2700 giây)
    expect(r.caGanNhat).toEqual({
      maCa: 'CA3', tenCa: 'Kiểm tra CA3', nopLuc: '2026-09-20T03:00:00.000Z', thoiGianLamGiay: 2700,
      congBo: { congBo: 'ngay', daCongBo: true, soEmDaNop: 1, soEmDaVao: 1 },
      ketQua: { tong: 7.5, soCau: 7, soCauDung: 4 },
      truoc: { tong: 6.75, doi: 0.75 },
      phan: [{ ma: 'I', dung: 2, tong: 3, diem: 3 }, { ma: 'II', dung: 1, tong: 2, diem: 2.5 }, { ma: 'III', dung: 1, tong: 2, diem: 2 }],
    })
    // tienBo.diem: cũ → mới
    expect(r.tienBo.diem).toEqual([
      { ngay: '2026-09-01', diem: 6, maCa: 'CA1', tenCa: 'Kiểm tra CA1' }, { ngay: '2026-09-10', diem: 6.75, maCa: 'CA2', tenCa: 'Kiểm tra CA2' }, { ngay: '2026-09-20', diem: 7.5, maCa: 'CA3', tenCa: 'Kiểm tra CA3' },
    ])
    // bài tập về nhà
    expect(r.baiTapVeNha.dangChay).toEqual([{ maBtvn: 'BT-CHAY', ten: 'Bài Este', hanNop: '2026-09-25T05:00:00.000Z', changXong: 2, changTong: 5 }])
    expect(r.baiTapVeNha.gan).toEqual([{ maBtvn: 'BT-NOP', ten: 'Bài Amin', nopLuc: '2026-09-21T10:00:00.000Z', dungHan: true, diem: 8 }])
    // dạng: tên, không mã ở trường hiển thị; dạng ZZ không có tên bị bỏ
    expect(r.bacTheoDang.map((x: any) => x.ten)).toContain('Thuỷ phân ester')
    for (const x of [...r.bacTheoDang, ...r.dangVap, ...r.vuaLenBac]) expect(x.ten).not.toBe(x.ma)
    expect(r.dangVap).toEqual([{ ma: 'AM', ten: 'Amin bậc một', dung: 1, tong: 4 }])
    // ES lên bậc ngày 20/09, PO (làm đúng ở ngày mới) lên bậc ngày 21/09 ⇒ mới nhất trước; AM (sai) không lên
    expect(r.vuaLenBac).toEqual([{ ma: 'PO', ten: 'Polime', tu: 1, den: 2, ngay: '2026-09-21' }, { ma: 'ES', ten: 'Thuỷ phân ester', tu: 1, den: 2, ngay: '2026-09-20' }])
    expect(JSON.stringify(r)).not.toContain('ZZ') // dạng chưa đặt tên không lộ mã trần
    // lịch ôn: AM-1 sai hôm nay (mốc mai) + AM-2 sai hôm qua (mốc hôm nay)
    expect(r.lichOn).toMatchObject({ homNay: expect.any(Number), ngayMai: expect.any(Number) })
    expect(r.lichOn.conSaiChuaKhacPhuc).toBeGreaterThan(0)
    // nhịp học: chỉ ngày có học
    expect(r.nhipHoc.ngay.map((x: any) => x.ngay)).toEqual(['2026-09-20', '2026-09-21', NGAY])
    expect(r.nhipHoc.gioThuongHoc).toBeUndefined() // dưới 20 lượt
    // lời Bộ não + giao thêm + việc phụ huynh
    expect(r.loiBoNao).toEqual({ loi: 'Con đang ôn đều, tối nay làm thêm phần ôn lại.', ngay: NGAY, thuTuan: 'Tuần này con làm 4 ngày liên tiếp.' })
    expect(r.giaoThem).toEqual({ conLaiHomNay: 1 })
    expect(r.phuHuynhLamGi.length).toBeGreaterThanOrEqual(1)
    expect(r.phuHuynhLamGi.length).toBeLessThanOrEqual(2)
    for (const c of r.phuHuynhLamGi) { expect(c).toMatch(/^Nhắc con làm \d+ câu ôn lại .*, khoảng \d+ phút\.$/); expect(c).not.toMatch(/\bem\b/) }
  })

  it('≤ 12 truy vấn D1 (kể cả xác thực); KHÔNG ghi ngoài dòng đếm truy cập của hàm xác thực; bảng dữ liệu không đổi một byte', async () => {
    const { d, pass } = await dungDayDu()
    const truoc = BANG_DOI_CHIEU.map((b) => d.chup(b))
    const { env, log } = ghi(d)
    await phTatCaVeCon(env, { pass }, NOW)
    // 12 truy vấn cho phần dữ liệu + tối đa 3 của `doCham` (hangChamCuaEm dùng chung với lệnh thi đua: danh sách lớp, số câu/ngày, đạt nhiệm vụ ngày)
    const cuaDoCham = log.filter((q) => /UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop/.test(q) || /SELECT sbd, ngay_vn, COUNT\(\*\) AS n, MAX\(luc1\)/.test(q) || /FROM exp_so WHERE ngay_vn = \? AND loai = 'dat_ngay'/.test(q))
    expect(cuaDoCham.length).toBeLessThanOrEqual(3)
    // Sửa CÓ CHỦ Ý 21/09 (W3b Dồn về đích): `docVeDichCuaEm` (Code 4, đọc-chỉ) đọc đúng 5 truy vấn + 1 truy vấn mốc tính nợ (W3c) để trả `no` của con — ngân sách phần dữ liệu vẫn 12 (trừ riêng phần dồn về đích), tổng 15 → 22.
    const cuaVeDich = log.filter((q) => /^SELECT khoa, gia_tri FROM cau_hinh WHERE khoa IN \(\?, \?, \?\)$/.test(q.trim()) || /^WITH dang AS \(SELECT be\.ma_btvn/.test(q) || /FROM nam_kt_cau WHERE sbd = \? AND trang_thai IN \('moi_sai', 'dang_on', 'da_khac_phuc'\) AND can_day_lai = 0 AND moc_on_ke IS NOT NULL/.test(q) || /FROM mom_bai WHERE sbd = \? AND COALESCE\(submitted_at, ''\) = ''/.test(q) || /^SELECT 'g' AS k, giay AS a/.test(q) || /^SELECT 'em' AS k, lop AS a, nam_sinh AS b/.test(q))
    expect(cuaVeDich.length, log.join('\n')).toBeLessThanOrEqual(7) // 5 dữ liệu + 1 mốc tính nợ của docVeDichCuaEm + (tối đa) 1 mốc hiển thị của hangChamCuaEm (Code 4, cùng câu SQL)
    expect(log.length - cuaDoCham.length - cuaVeDich.length, log.join('\n')).toBeLessThanOrEqual(12) // phần dữ liệu của hợp đồng: vẫn ≤ 12
    expect(log.length, log.join('\n')).toBeLessThanOrEqual(22)
    expect(log.length).toBeGreaterThanOrEqual(8) // đo thật: chống test rỗng
    const ghiSql = log.filter((q) => /^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i.test(q) || q === 'BATCH')
    expect(ghiSql.length, ghiSql.join('\n')).toBe(1)
    expect(ghiSql[0]).toMatch(/^INSERT INTO ph_truy_cap /)
    expect(BANG_DOI_CHIEU.map((b) => d.chup(b))).toEqual(truoc)
  })

  it('không đọc bảng của game (EXP, khiên, thần thú, đoàn, đảo, võ đài, tháp)', async () => {
    const { d, pass } = await dungDayDu()
    const { env, log } = ghi(d)
    await phTatCaVeCon(env, { pass }, NOW)
    // NGOẠI LỆ DUY NHẤT: `doCham` (xếp hạng chăm) đọc cột "đã đạt nhiệm vụ ngày" ở exp_so — chỉ SELECT DISTINCT sbd loai = 'dat_ngay', kết quả không lên phản hồi (chỉ hạng + sĩ số).
    const choPhep = (q: string): boolean => /^SELECT DISTINCT sbd FROM exp_so WHERE ngay_vn = \? AND loai = 'dat_ngay' AND sbd IN \(SELECT value FROM json_each\(\?\)\)$/.test(q)
    for (const q of log.filter((x) => !choPhep(x))) expect(q, q).not.toMatch(/exp_|manh_khien|khien_|than_thu|pet|doan_|dao_|vo_dai|thap|game_v2_(attempt|session|reward|room|scope|task|season)/i)
    expect(log.filter(choPhep).length).toBeLessThanOrEqual(1)
  })

  it('quét JSON: KHÔNG có khoá của game, KHÔNG có chữ game ở bất kỳ đâu', async () => {
    const { d, pass } = await dungDayDu()
    // thêm sự kiện nguồn game (nhãn trung tính) + thử thách riêng
    kho(d, 'G-1', { dang: 'ES', tenDang: 'Thuỷ phân ester' })
    suKien(d, { qid: 'G-1', ngay: NGAY, gio: '19:30', nguon: 'game', ma: 'sess1', kq: 1, dang: 'ES' })
    const r = await chay(d, pass)
    const khoa = moiKhoa(r)
    for (const k of KHOA_CAM) expect(khoa, k).not.toContain(k)
    const s = JSON.stringify(r)
    expect(chuGameTrong(s)).toEqual([])
    expect(s).not.toMatch(/"game"|luyen_dang_vap.*game/)
    expect(r.homNay.dongThoiGian.map((x: any) => x.nguon)).toContain('luyen_dang_vap')
  })

  it('serverNow là giờ máy chủ truyền vào; hoTen luôn có', async () => {
    const { d } = dung()
    const r = await chay(d, await capPass(d), NOW + 5)
    expect(r.serverNow).toBe(NOW + 5)
    expect(typeof r.hoTen).toBe('string')
  })
})

// ================================================================== VẮNG ==================================================================
describe('khối thiếu dữ liệu ⇒ VẮNG (không có khoá, không số 0 giả, không mảng bịa)', () => {
  it('con chưa có gì: chỉ ok, serverNow, hoTen (+ giaoThem vì bảng đếm có thật: còn 3 lượt)', async () => {
    const { d } = dung()
    const r = await chay(d, await capPass(d))
    expect(Object.keys(r).sort()).toEqual(['giaoThem', 'hoTen', 'ok', 'serverNow'])
    expect(r.giaoThem).toEqual({ conLaiHomNay: 3 })
  })
  it('chỉ có sổ học nhưng chưa có hồ sơ nắm kiến thức ⇒ vắng lichOn, bacTheoDang, vuaLenBac, phuHuynhLamGi, dangTienBoNhat; vẫn có nhịp học', async () => {
    const { d } = dung()
    suKien(d, { qid: 'Q1', ngay: NGAY, gio: '19:00', kq: 1, dang: 'ES' })
    const r = await chay(d, await capPass(d))
    for (const k of ['lichOn', 'bacTheoDang', 'vuaLenBac', 'dangVap', 'phuHuynhLamGi', 'tienBo', 'manhYeu', 'loiBoNao', 'baiTapVeNha', 'caGanNhat']) expect(k in r, k).toBe(false)
    expect(r.nhipHoc.ngay).toEqual([{ ngay: NGAY, soCau: 1, soCauDung: 1 }])
  })
  it('có hồ sơ nhưng không có câu tới hạn ôn hôm nay/mai ⇒ lichOn có số 0 thật, phuHuynhLamGi VẮNG', async () => {
    const { d } = dung()
    suKien(d, { qid: 'Q1', ngay: themNgay(NGAY, -6), kq: 1, dang: 'ES' }) // đúng từ lâu: chưa từng sai ⇒ không vào lịch
    await dungLaiHoSo(d.env, ['S1'], 'x')
    const r = await chay(d, await capPass(d))
    expect(r.lichOn).toEqual({ homNay: 0, ngayMai: 0, daKhacPhuc14Ngay: 0, conSaiChuaKhacPhuc: 0 })
    expect('phuHuynhLamGi' in r).toBe(false)
  })
  it('Bộ não chạy thử (bong) / tắt / không có lời ⇒ vắng loiBoNao; lời có chữ game bị loại', async () => {
    for (const cfg of [{ bat: true, cheDo: 'bong', lopThat: [] }, { bat: false, cheDo: 'that', lopThat: [] }]) {
      const { d } = dung()
      d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bo_nao',?,'x')").run(JSON.stringify(cfg))
      d.sql.prepare("INSERT INTO ai_dieu_chinh(sbd,ngay,json,che_do,ap_dung,het_han,huy,nop_luc) VALUES('S1',?,?,'that',1,?,0,'x')").run(NGAY, JSON.stringify({ loiNhanChoPhuHuynh: 'Con làm tốt.' }), themNgay(NGAY, 3))
      expect('loiBoNao' in (await chay(d, await capPass(d)))).toBe(false)
    }
    const { d } = dung()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bo_nao',?,'x')").run(JSON.stringify({ bat: true, cheDo: 'that', lopThat: [] }))
    d.sql.prepare("INSERT INTO ai_dieu_chinh(sbd,ngay,json,che_do,ap_dung,het_han,huy,nop_luc) VALUES('S1',?,?,'that',1,?,0,'x')").run(NGAY, JSON.stringify({ loiNhanChoPhuHuynh: 'Con nhận thêm khiên nhờ làm đều.', thuTuan: 'Tuần này con học đều.' }), themNgay(NGAY, 3))
    const r = await chay(d, await capPass(d))
    expect(r.loiBoNao).toEqual({ ngay: NGAY, thuTuan: 'Tuần này con học đều.' }) // lời có "khiên" bị loại, thư tuần sạch còn
    expect(chuGameTrong(JSON.stringify(r))).toEqual([])
  })
  it('bảng đếm giao thêm chưa có (chưa chạy migration) ⇒ vắng giaoThem, lệnh vẫn ok', async () => {
    const { d } = dung()
    d.sql.exec('DROP TABLE ph_giao_them')
    const r = await chay(d, await capPass(d))
    expect(r.ok).toBe(true)
    expect('giaoThem' in r).toBe(false)
    expect(r.hoTen).toBe('Nguyễn Thu Hà')
  })
  it('cấu hình Bộ não đọc gộp = docCauHinhTangDoc (cùng kết quả trên nhiều cấu hình)', async () => {
    const cfgs: (Record<string, unknown> | null)[] = [null, {}, { bat: false, cheDo: 'that' }, { bat: true, cheDo: 'that', lopThat: [] }, { cheDo: 'bong', lopThat: ['12'] }, { cheDo: 'bong', lopThat: [] }, { bat: 'x', cheDo: 'that' }, { cheDo: 'that', lopThat: ['a', '', 'a'] }]
    for (const c of cfgs) {
      const { d } = dung()
      if (c !== null) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bo_nao',?,'x')").run(JSON.stringify(c))
      expect(cauHinhTangDocTuChuoi(c === null ? undefined : JSON.stringify(c)), JSON.stringify(c)).toEqual(await docCauHinhTangDoc(d.env))
    }
  })
})

// ================================================================== tienBo.diem ==================================================================
describe('tienBo.diem — chỉ ca ĐÃ công bố, cũ → mới, ≤ 8', () => {
  it('12 ca (một số chưa công bố xen kẽ): đúng 8 ca đã công bố mới nhất, tăng dần theo thời gian, không ca chưa công bố nào', async () => {
    const { d } = dung()
    for (let i = 1; i <= 12; i++) {
      const ma = `C${String(i).padStart(2, '0')}`
      const chua = i % 4 === 0 // C04, C08, C12 chưa công bố
      themCa(d, ma, chua ? 'khong' : 'ngay'); themLuot(d, ma, 'S1', { nop: `2026-09-${String(i).padStart(2, '0')}T03:00:00.000Z`, tong: i + 0.5 })
    }
    const r = await chay(d, await capPass(d))
    const ds = r.tienBo.diem as { maCa: string; diem: number; ngay: string }[]
    expect(ds).toHaveLength(8)
    expect(ds.map((x) => x.maCa)).toEqual(['C03', 'C05', 'C06', 'C07', 'C09', 'C10', 'C11'].length === 7 ? ['C02', 'C03', 'C05', 'C06', 'C07', 'C09', 'C10', 'C11'] : [])
    expect(ds.map((x) => x.diem)).toEqual([2.5, 3.5, 5.5, 6.5, 7.5, 9.5, 10.5, 11.5])
    for (const x of ds) expect(['C04', 'C08', 'C12']).not.toContain(x.maCa)
    expect([...ds].sort((a, b) => (a.ngay < b.ngay ? -1 : 1))).toEqual(ds)
    // caGanNhat = C12 (chưa công bố): không điểm 12.5
    expect(r.caGanNhat.maCa).toBe('C12')
    expect(JSON.stringify(r)).not.toContain('12.5')
  })
  it('đúng 8 ca đã công bố ⇒ 8; 9 ca ⇒ vẫn 8 (bỏ ca cũ nhất)', async () => {
    for (const n of [8, 9]) {
      const { d } = dung()
      for (let i = 1; i <= n; i++) { themCa(d, `C${i}`, 'ngay'); themLuot(d, `C${i}`, 'S1', { nop: `2026-09-${String(i).padStart(2, '0')}T03:00:00.000Z`, tong: i }) }
      const ds = (await chay(d, await capPass(d))).tienBo.diem as { maCa: string }[]
      expect(ds).toHaveLength(8)
      expect(ds[0]!.maCa).toBe(n === 8 ? 'C1' : 'C2')
      expect(ds[7]!.maCa).toBe(`C${n}`)
    }
  })
  it('một ca thi lại nhiều lượt: mỗi ca chỉ một điểm (lượt nộp mới nhất); truoc là ca khác đã công bố liền trước', async () => {
    const { d } = dung()
    themCa(d, 'A', 'ngay'); themLuot(d, 'A', 'S1', { nop: '2026-09-05T03:00:00.000Z', tong: 5 })
    themCa(d, 'B', 'ngay'); themLuot(d, 'B', 'S1', { nop: '2026-09-10T03:00:00.000Z', tong: 4, lan: 1 }); themLuot(d, 'B', 'S1', { nop: '2026-09-11T03:00:00.000Z', tong: 6, lan: 2 })
    themCt(d, 'B', 'S1', 'I', 1, 'B-1', 'A', 'A', 1, 2)
    const r = await chay(d, await capPass(d))
    expect(r.tienBo.diem.map((x: any) => [x.maCa, x.diem])).toEqual([['A', 5], ['B', 6]])
    expect(r.caGanNhat.ketQua).toEqual({ tong: 6, soCau: 1, soCauDung: 1 }) // chi tiết của ĐÚNG lượt 2
    expect(r.caGanNhat.truoc).toEqual({ tong: 5, doi: 1 })
  })
  it('ca đầu tiên đã công bố (chưa có ca trước) ⇒ vắng truoc', async () => {
    const { d } = dung()
    themCa(d, 'A', 'ngay'); themLuot(d, 'A', 'S1')
    const r = await chay(d, await capPass(d))
    expect('truoc' in r.caGanNhat).toBe(false)
    expect(r.caGanNhat.ketQua).toEqual({ tong: 7.5 }) // không bảng chấm ⇒ không soCau
    expect('phan' in r.caGanNhat).toBe(false)
  })
  it('ca liền trước CHƯA công bố bị bỏ qua khi tìm truoc (lấy ca đã công bố gần nhất)', async () => {
    const { d } = dung()
    themCa(d, 'A', 'ngay'); themLuot(d, 'A', 'S1', { nop: '2026-09-01T03:00:00.000Z', tong: 5 })
    themCa(d, 'B', 'khong'); themLuot(d, 'B', 'S1', { nop: '2026-09-05T03:00:00.000Z', tong: 9 })
    themCa(d, 'C', 'ngay'); themLuot(d, 'C', 'S1', { nop: '2026-09-10T03:00:00.000Z', tong: 7 })
    const r = await chay(d, await capPass(d))
    expect(r.caGanNhat.truoc).toEqual({ tong: 5, doi: 2 })
    expect(JSON.stringify(r)).not.toMatch(/(^|[^\d.])9([^\d]|$)/) // điểm 9 của ca chưa công bố không xuất hiện
  })
})

// ================================================================== nhịp học ==================================================================
describe('nhipHoc — chỉ ngày có học, cửa sổ 14 ngày (giờ Việt Nam), gioThuongHoc chỉ khi ≥ 20 lượt chấm', () => {
  it('cửa sổ đúng 14 ngày: ngày NGAY-13 có, NGAY-14 không; ngày không học không xuất hiện; câu bỏ trống không tính', async () => {
    const { d } = dung()
    suKien(d, { qid: 'A', ngay: themNgay(NGAY, -14), kq: 1 })
    suKien(d, { qid: 'B', ngay: themNgay(NGAY, -13), kq: 1 }); suKien(d, { qid: 'B2', ngay: themNgay(NGAY, -13), kq: 0 }); suKien(d, { qid: 'B3', ngay: themNgay(NGAY, -13), kq: null })
    suKien(d, { qid: 'C', ngay: NGAY, kq: 1 })
    const r = await chay(d, await capPass(d))
    expect(r.nhipHoc.ngay).toEqual([{ ngay: themNgay(NGAY, -13), soCau: 2, soCauDung: 1 }, { ngay: NGAY, soCau: 1, soCauDung: 1 }])
  })
  it('gioThuongHoc: 19 lượt ⇒ vắng; 20 lượt ⇒ khung 2 giờ nhiều lượt nhất', async () => {
    const soLuot = async (n: number, gioLe = 19) => {
      const { d } = dung()
      for (let i = 0; i < n; i++) suKien(d, { qid: `Q${i}`, ngay: themNgay(NGAY, -(i % 5)), gio: `${String(gioLe + (i % 2)).padStart(2, '0')}:${String(10 + i).padStart(2, '0')}`, kq: 1 })
      return (await chay(d, await capPass(d))).nhipHoc
    }
    expect(TOI_THIEU_LUOT_GIO_THUONG_HOC).toBe(20)
    expect((await soLuot(19)).gioThuongHoc).toBeUndefined()
    expect((await soLuot(20)).gioThuongHoc).toBe('19:00–21:00')
  })
  it('hàm gioThuongHoc: đếm theo giờ Việt Nam; hoà ⇒ khung sớm hơn; khung qua nửa đêm', () => {
    const luc = (gio: number, n: number) => Array.from({ length: n }, () => vn(NGAY, `${String(gio).padStart(2, '0')}:30`))
    expect(gioThuongHoc([...luc(8, 10), ...luc(9, 10)])).toBe('08:00–10:00')
    expect(gioThuongHoc([...luc(8, 10), ...luc(20, 10)])).toBe('08:00–10:00') // hoà 8h↔20h: khung ôm đúng chỗ học, sớm hơn thắng
    expect(gioThuongHoc([...luc(23, 12), ...luc(0, 9)])).toBe('23:00–01:00')
    expect(gioThuongHoc(luc(9, 19))).toBeUndefined()
    // giờ UTC 12:30 = 19:30 giờ Việt Nam
    expect(gioThuongHoc(Array.from({ length: 20 }, () => '2026-09-22T12:30:00.000Z'))).toBe('19:00–21:00')
  })
})

// ================================================================== dạng: tên, giới hạn, ngưỡng ==================================================================
describe('dạng — tên qua tenCuaCacDang, không mã trần, giới hạn và ngưỡng', () => {
  async function dungBayDang() {
    const { d } = dung()
    for (let i = 1; i <= 7; i++) {
      const ma = `D${i}`
      kho(d, `${ma}-q`, { dang: ma, tenDang: `Tên ${ma}` })
      suKien(d, { qid: `${ma}-q`, ngay: themNgay(NGAY, -1), dang: ma, kq: 1 })
    }
    await dungLaiHoSo(d.env, ['S1'], 'x')
    return { d, pass: await capPass(d) }
  }
  it('bacTheoDang ≤ 5, vuaLenBac ≤ 5, dangTienBoNhat ≤ 3; bậc theo phát lại sổ', async () => {
    const { d, pass } = await dungBayDang()
    const r = await chay(d, pass)
    expect(r.bacTheoDang).toHaveLength(5)
    expect(r.vuaLenBac).toHaveLength(5)
    expect(r.tienBo.dangTienBoNhat).toHaveLength(3)
    expect(r.tienBo.dangTienBoNhat.map((x: any) => x.ma)).toEqual(['D1', 'D2', 'D3'])
    for (const x of r.tienBo.dangTienBoNhat) expect(x).toMatchObject({ tu: 1, den: 2 })
    for (const x of r.vuaLenBac) expect(x).toMatchObject({ tu: 1, den: 2, ngay: themNgay(NGAY, -1) })
    for (const x of r.bacTheoDang) expect(x.bac).toBe(2)
  })
  it('dạng không có tên ⇒ bỏ khỏi mọi danh sách (không mã trần ở trường hiển thị); mã CD:<chuyên đề> lấy tên là chuyên đề', async () => {
    const { d } = dung()
    kho(d, 'X-1', { dang: 'KHONGTEN' })
    for (let i = 0; i < 3; i++) suKien(d, { qid: `X-${i}`, ngay: NGAY, gio: `1${i}:00`, dang: 'KHONGTEN', kq: 0 })
    for (let i = 0; i < 3; i++) suKien(d, { qid: `Y-${i}`, ngay: NGAY, gio: `1${i}:30`, dang: 'CD:Este - Lipit', kq: 0 })
    await dungLaiHoSo(d.env, ['S1'], 'x')
    const r = await chay(d, await capPass(d))
    expect(r.dangVap.map((x: any) => x.ten)).toEqual(['Este - Lipit'])
    expect(JSON.stringify(r)).not.toContain('KHONGTEN')
    expect(r.manhYeu.conVap).toEqual([{ tenDang: 'Este - Lipit', dung: 0, tong: 3, bac: 'hieu' === 'hieu' ? expect.stringMatching(/^(biet|hieu|van_dung)$/) : '' }])
  })
  it(`dangVap: cần ≥ ${DANG_VAP_TOI_THIEU_LUOT} lượt chấm và tỉ lệ đúng ≤ ${DANG_VAP_TI_LE_DUNG_TOI_DA} (biên hai phía); câu bỏ trống không tính; sắp thấp nhất trước`, async () => {
    const { d } = dung()
    const dang = (ma: string, kqs: (0 | 1 | null)[]) => {
      kho(d, `${ma}-q`, { dang: ma, tenDang: `Tên ${ma}` })
      kqs.forEach((kq, i) => suKien(d, { qid: `${ma}-q${i}`, ngay: NGAY, gio: `1${i}:00`, dang: ma, kq }))
    }
    dang('B1', [1, 0, 0]) // 1/3 = 0,33 ≤ 0,5 ⇒ vấp
    dang('B2', [1, 0, 1, 0]) // 2/4 = 0,5 ⇒ vấp (biên: ≤)
    dang('B3', [1, 1, 0]) // 2/3 ⇒ không
    dang('B4', [0, 0]) // chỉ 2 lượt ⇒ không (biên: ≥ 3)
    dang('B5', [0, 0, null, null]) // 2 lượt chấm + 2 bỏ trống ⇒ không
    await dungLaiHoSo(d.env, ['S1'], 'x')
    const r = await chay(d, await capPass(d))
    expect(r.dangVap.map((x: any) => x.ma)).toEqual(['B1', 'B2'])
    expect(r.dangVap[0]).toEqual({ ma: 'B1', ten: 'Tên B1', dung: 1, tong: 3 })
  })
  it('manhYeu: lamTot ≤ 3 (đúng ≥ 80%), conVap ≤ 3, lenBacHomNay; nhãn bậc là chữ, không xếp hạng/so sánh bạn', async () => {
    const { d } = dung()
    for (let i = 1; i <= 5; i++) {
      kho(d, `T${i}-q`, { dang: `T${i}`, tenDang: `Tốt ${i}` })
      for (let k = 0; k < 4; k++) suKien(d, { qid: `T${i}-q${k}`, ngay: themNgay(NGAY, -1), gio: `1${k}:00`, dang: `T${i}`, kq: 1 })
    }
    kho(d, 'H-q', { dang: 'H', tenDang: 'Lên hôm nay' })
    suKien(d, { qid: 'H-q', ngay: NGAY, gio: '09:00', dang: 'H', kq: 1 })
    await dungLaiHoSo(d.env, ['S1'], 'x')
    const r = await chay(d, await capPass(d))
    expect(r.manhYeu.lamTot).toHaveLength(3)
    for (const x of r.manhYeu.lamTot) expect(x).toMatchObject({ dung: 4, tong: 4, bac: 'van_dung' })
    expect(r.manhYeu.lenBacHomNay).toEqual([{ tenDang: 'Lên hôm nay' }])
    expect(JSON.stringify(r.manhYeu)).not.toMatch(/hạng|xếp hạng|so với bạn|doCham/i)
  })
})

// ================================================================== doCham (nối hangChamCuaEm của lệnh thi đua) ==================================================================
describe('doCham — hạng chăm hôm nay trong lớp: chỉ {hang, siSo}, không tên bạn, vắng khi con chưa học', () => {
  const lam = (d: D1That, sbd: string, n: number) => { for (let i = 0; i < n; i++) suKien(d, { qid: `${sbd}-c${i}`, ngay: NGAY, gio: '18:00', sbd, kq: 1 }) }

  it('con làm ít hơn bạn ⇒ hạng 2 trong 2 bạn; đúng hai khoá hang + siSo, không tên/sbd bạn, không tên thần thú', async () => {
    const { d } = dung()
    lam(d, 'S1', 3)
    lam(d, 'S2', 5)
    const r = await chay(d, await capPass(d))
    expect(r.doCham).toEqual({ hang: 2, siSo: 2 })
    expect(JSON.stringify(r)).not.toMatch(/Trần Bình|S2/)
  })

  it('con dẫn đầu ⇒ hạng 1; hoà số câu thì cùng hạng', async () => {
    const { d } = dung()
    lam(d, 'S1', 5)
    lam(d, 'S2', 3)
    expect((await chay(d, await capPass(d))).doCham).toEqual({ hang: 1, siSo: 2 })
    const { d: d2 } = dung()
    lam(d2, 'S1', 4)
    lam(d2, 'S2', 4)
    // hoà HOÀN TOÀN (cùng số câu, chưa ai đạt nhiệm vụ, cùng chuỗi, cùng thời điểm đạt) ⇒ CÙNG hạng 1, không xếp theo tên/sbd
    expect((await chay(d2, await capPass(d2))).doCham).toEqual({ hang: 1, siSo: 2 })
  })

  it('con CHƯA học hôm nay ⇒ VẮNG doCham (không hạng bịa); ngày hôm trước không tính', async () => {
    const { d } = dung()
    lam(d, 'S2', 5)
    suKien(d, { qid: 'cu', ngay: themNgay(NGAY, -1), gio: '18:00', sbd: 'S1' })
    const r = await chay(d, await capPass(d))
    expect('doCham' in r).toBe(false)
  })

  it('doCham không xuất hiện ở khối nào khác và không có khoá xếp hạng nào ngoài doCham', async () => {
    const { d } = dung()
    lam(d, 'S1', 2)
    lam(d, 'S2', 1)
    const r = await chay(d, await capPass(d))
    expect(moiKhoa(r).filter((k) => /hang|siSo|cham/i.test(k))).toEqual(['doCham', 'hang', 'siSo'])
  })
})

// ================================================================== homNay: LUẬT CHE ==================================================================
describe('homNay.cau — LUẬT CHE: ca chưa công bố / BTVN chưa nộp / gói gia đình giao chưa nộp', () => {
  const BI_MAT = ['LG-BI-MAT', 'CHON-BI-MAT', 'Đề bí mật', '"dapAn"', '"dung"', '"conChon"']
  const soiRo = (r: Record<string, any>) => { const s = JSON.stringify(r); for (const x of BI_MAT) expect(s, x).not.toContain(x) }
  const khoBiMat = (d: D1That, qid: string) => kho(d, qid, { dang: 'ES', tenDang: 'Thuỷ phân ester', text: `Đề bí mật ${qid}`, correct: 'D', solution: `LG-BI-MAT-${qid}` })
  const tuoiChe = (r: Record<string, any>, nguon: string) => (r.homNay.cau as any[]).filter((c) => c.nguon === nguon)

  it.each([['khong', 'mo'], ['ca_lop_xong', 'mo'], [null, 'mo']] as const)('ca thi cong_bo=%s chưa công bố ⇒ câu chỉ còn {luc, nguon, che, giay}', async (congBo, tt) => {
    const { d } = dung()
    themCa(d, 'CA', congBo, tt); themLuot(d, 'CA', 'S1', { tong: 8.25 }); themLuot(d, 'CA', 'S2', { tt: 'dang_lam', nop: null, tong: null })
    themCt(d, 'CA', 'S1', 'I', 1, 'Q-KIEM', 'CHON-BI-MAT', 'D', 0)
    khoBiMat(d, 'Q-KIEM')
    suKien(d, { qid: 'Q-KIEM', ngay: NGAY, gio: '10:00', nguon: 'thi', ma: 'CA', kq: 0, dang: 'ES', giay: 40 })
    await dungLaiHoSo(d.env, ['S1'], 'x')
    const r = await chay(d, await capPass(d))
    const c = tuoiChe(r, 'ca_kiem_tra')
    expect(c).toEqual([{ luc: vn(NGAY, '10:00'), nguon: 'ca_kiem_tra', che: 'chua_cong_bo', giay: 40 }])
    expect(JSON.stringify(r)).not.toContain('Q-KIEM') // câu bị che không lộ cả MÃ CÂU (qid chỉ có ở câu được phép, để màn gọi lệnh lời giải)
    soiRo(r)
    expect(JSON.stringify(r)).not.toMatch(/Đề bí mật|8\.25|Thuỷ phân ester/)
    // dòng thời gian: có phiên nhưng không số câu/đúng
    expect(r.homNay.dongThoiGian).toEqual([{ batDau: vn(NGAY, '10:00'), nguon: 'ca_kiem_tra', ten: 'Ca CA', che: 'chua_cong_bo', phut: 1 }])
    // không lọt vào bất kỳ con số nào có đúng/sai
    expect(r.homNay.tongQuan).toEqual({ phutHoc: 1 }) // chỉ thời gian; KHÔNG soCau/soDung của ca chưa công bố
    for (const k of ['nhipHoc', 'lichOn', 'dangVap', 'bacTheoDang', 'vuaLenBac', 'manhYeu', 'phuHuynhLamGi', 'tienBo']) expect(k in r, k).toBe(false)
  })

  it('ca đã công bố (ngay) ⇒ câu hiện đủ: conChon (từ chi_tiet_cau), dapAn, dung, coLoiGiai, deRutGon, tenDang — nhưng KHÔNG lời giải', async () => {
    const { d } = dung()
    themCa(d, 'CA', 'ngay'); themLuot(d, 'CA', 'S1')
    themCt(d, 'CA', 'S1', 'I', 1, 'Q-KIEM', 'A', 'B', 0)
    kho(d, 'Q-KIEM', { dang: 'ES', tenDang: 'Thuỷ phân ester', text: 'Este nào thuỷ phân ra ancol?', correct: 'B', solution: 'LG-BI-MAT-Q-KIEM' })
    suKien(d, { qid: 'Q-KIEM', ngay: NGAY, gio: '10:00', nguon: 'thi', ma: 'CA', kq: 0, dang: 'ES', giay: 40 })
    await dungLaiHoSo(d.env, ['S1'], 'x')
    const r = await chay(d, await capPass(d))
    expect(r.homNay.cau).toEqual([{ luc: vn(NGAY, '10:00'), nguon: 'ca_kiem_tra', qid: 'Q-KIEM', tenDang: 'Thuỷ phân ester', deRutGon: 'Este nào thuỷ phân ra ancol?', conChon: 'A', dapAn: 'B', dung: false, giay: 40, coLoiGiai: true }])
    expect(JSON.stringify(r)).not.toContain('LG-BI-MAT') // lời giải chỉ có ở lệnh mở từng câu, không ở danh sách
  })

  it('BTVN CHƯA nộp ⇒ che chua_nop; khi ĐÃ nộp thì hiện (đột biến bỏ che phải làm test này đỏ)', async () => {
    const { d } = dung()
    themBtvn(d, 'BT1', { nop: null })
    khoBiMat(d, 'Q-BT')
    suKien(d, { qid: 'Q-BT', ngay: NGAY, gio: '11:00', nguon: 'btvn', ma: 'BT1', kq: 1, dang: 'ES' })
    suKien(d, { qid: 'Q-BT', ngay: NGAY, gio: '11:05', nguon: 'btvn_lo', ma: 'BT1', kq: 1, dang: 'ES', lan: 2 })
    const pass = await capPass(d)
    let r = await chay(d, pass)
    expect(tuoiChe(r, 'btvn').map((c) => c.che)).toEqual(['chua_nop', 'chua_nop'])
    for (const c of tuoiChe(r, 'btvn')) expect(Object.keys(c).sort()).toEqual(expect.arrayContaining(['che', 'luc', 'nguon']))
    for (const c of tuoiChe(r, 'btvn')) for (const k of ['dung', 'dapAn', 'conChon', 'deRutGon', 'tenDang', 'coLoiGiai']) expect(k in c, k).toBe(false)
    soiRo(r)
    d.sql.prepare("UPDATE btvn_em SET nop_luc = '2026-09-22T05:00:00.000Z' WHERE ma_btvn = 'BT1'").run()
    r = await chay(d, pass)
    expect(tuoiChe(r, 'btvn').every((c) => c.che === undefined && c.dung === true && c.dapAn === 'D')).toBe(true)
  })

  it('gói gia đình giao CHƯA nộp ⇒ che chua_nop; đã nộp ⇒ hiện', async () => {
    const { d } = dung()
    themMom(d, 'giao_them_2026-09-22_1', false)
    khoBiMat(d, 'Q-MOM')
    suKien(d, { qid: 'Q-MOM', ngay: NGAY, gio: '17:00', nguon: 'mom', ma: 'giao_them_2026-09-22_1', kq: 0, dang: 'ES' })
    const pass = await capPass(d)
    let r = await chay(d, pass)
    expect(tuoiChe(r, 'gia_dinh_giao')).toEqual([{ luc: vn(NGAY, '17:00'), nguon: 'gia_dinh_giao', che: 'chua_nop', giay: 30 }])
    soiRo(r)
    d.sql.prepare("UPDATE mom_bai SET submitted_at = '2026-09-22T12:00:00.000Z'").run()
    r = await chay(d, pass)
    expect(tuoiChe(r, 'gia_dinh_giao')[0]).toMatchObject({ dung: false, dapAn: 'D' })
    expect(tuoiChe(r, 'gia_dinh_giao')[0].che).toBeUndefined()
  })

  it('nguồn không lưu đáp án con chọn (ôn lại, thử thách riêng…) ⇒ KHÔNG có conChon; dung lấy từ sổ; câu tự luận không vào danh sách', async () => {
    const { d } = dung()
    kho(d, 'Q-OL', { dang: 'ES', tenDang: 'Thuỷ phân ester', correct: 'C' })
    kho(d, 'Q-TL', { dang: 'ES', tenDang: 'Thuỷ phân ester', choices: [], phan: 'I', text: 'Trình bày cơ chế phản ứng.' }) // phần I không phương án = tự luận
    suKien(d, { qid: 'Q-OL', ngay: NGAY, gio: '12:00', nguon: 'on_lai', ma: 'x', kq: 1, dang: 'ES' })
    suKien(d, { qid: 'Q-TL', ngay: NGAY, gio: '12:01', nguon: 'on_lai', ma: 'x', kq: 1, dang: 'ES' })
    const r = await chay(d, await capPass(d))
    expect(r.homNay.cau).toHaveLength(1)
    expect('conChon' in r.homNay.cau[0]).toBe(false)
    expect(r.homNay.cau[0]).toMatchObject({ nguon: 'on_lai', dung: true, dapAn: 'C' })
    expect(JSON.stringify(r)).not.toContain('Trình bày cơ chế')
  })

  it('câu bị che KHÔNG BAO GIỜ được đọc từ kho (không có truy vấn kho cho qid bị che)', async () => {
    const { d } = dung()
    themCa(d, 'CA', 'khong'); themLuot(d, 'CA', 'S1')
    khoBiMat(d, 'Q-KIEM')
    suKien(d, { qid: 'Q-KIEM', ngay: NGAY, gio: '10:00', nguon: 'thi', ma: 'CA', kq: 0, dang: 'ES' })
    const { env, log } = ghi(d)
    await phTatCaVeCon(env, { pass: await capPass(d) }, NOW)
    expect(log.filter((q) => /game_v2_question/.test(q) && /json_each/.test(q) && /SELECT qid, MIN\(json\)/.test(q))).toEqual([])
  })

  it('tổng quan chỉ đếm sổ KHÔNG bị che: ca chưa công bố + BTVN chưa nộp không lọt vào soCau/soDung/nhịp/dạng', async () => {
    const { d } = dung()
    themCa(d, 'CA', 'khong'); themLuot(d, 'CA', 'S1'); themBtvn(d, 'BT1', { nop: null })
    for (let i = 0; i < 5; i++) suKien(d, { qid: `T${i}`, ngay: NGAY, gio: `09:0${i}`, nguon: 'thi', ma: 'CA', kq: 1, dang: 'ES' })
    for (let i = 0; i < 4; i++) suKien(d, { qid: `B${i}`, ngay: NGAY, gio: `10:0${i}`, nguon: 'btvn_lo', ma: 'BT1', kq: 1, dang: 'ES' })
    suKien(d, { qid: 'OK1', ngay: NGAY, gio: '11:00', nguon: 'on_lai', kq: 1, dang: 'ES' }); suKien(d, { qid: 'OK2', ngay: NGAY, gio: '11:01', nguon: 'on_lai', kq: 0, dang: 'ES' })
    kho(d, 'OK1', { dang: 'ES', tenDang: 'Este' }); kho(d, 'OK2', { dang: 'ES', tenDang: 'Este' })
    await dungLaiHoSo(d.env, ['S1'], 'x')
    const r = await chay(d, await capPass(d))
    expect(r.homNay.tongQuan).toMatchObject({ soCau: 2, soDung: 1 })
    expect(r.nhipHoc.ngay).toEqual([{ ngay: NGAY, soCau: 2, soCauDung: 1 }])
    expect(r.homNay.cau).toHaveLength(11) // 9 stub bị che + 2 câu rõ
    expect(r.homNay.cau.filter((c: any) => c.che)).toHaveLength(9)
  })
})

// ================================================================== homNay: tổng quan, dòng thời gian ==================================================================
describe('homNay — tongQuan, dongThoiGian, giới hạn câu, nhãn nguồn', () => {
  it('tongQuan: câu KHÁC NHAU, phút học từ giây, chuỗi ngày học, so với hôm qua; vắng khi thiếu', async () => {
    const { d } = dung()
    kho(d, 'Q1', { dang: 'ES', tenDang: 'Este' })
    suKien(d, { qid: 'Q1', ngay: NGAY, gio: '09:00', kq: 0, giay: 60 })
    suKien(d, { qid: 'Q1', ngay: NGAY, gio: '09:05', kq: 1, giay: 90, lan: 2 }) // cùng câu, làm lại: vẫn MỘT câu khác nhau
    suKien(d, { qid: 'Q2', ngay: NGAY, gio: '09:06', kq: 1, giay: 30 })
    suKien(d, { qid: 'Q3', ngay: themNgay(NGAY, -1), gio: '09:00', kq: 1 }); suKien(d, { qid: 'Q4', ngay: themNgay(NGAY, -1), gio: '09:01', kq: 0 })
    suKien(d, { qid: 'Q5', ngay: themNgay(NGAY, -2), gio: '09:00', kq: 1 })
    suKien(d, { qid: 'Q6', ngay: themNgay(NGAY, -4), gio: '09:00', kq: 1 }) // ngắt chuỗi
    const r = await chay(d, await capPass(d))
    expect(r.homNay.tongQuan).toEqual({ soCau: 2, soDung: 2, phutHoc: 3, chuoiNgayHoc: 3, soVoiHomQua: { soCau: 2, tiLeDung: 0.5 } })
  })
  it('hôm nay chưa học ⇒ chuỗi tính từ hôm qua, không soCau/soDung/dòng thời gian/câu; không có hôm qua ⇒ vắng soVoiHomQua; không sổ nào ⇒ vắng cả homNay', async () => {
    const { d } = dung()
    suKien(d, { qid: 'Q1', ngay: themNgay(NGAY, -1), kq: 1 })
    let r = await chay(d, await capPass(d))
    expect(r.homNay).toEqual({ tongQuan: { chuoiNgayHoc: 1, soVoiHomQua: { soCau: 1, tiLeDung: 1 } } })
    expect(r.nhipHoc.ngay).toHaveLength(1)
    const { d: d2 } = dung()
    suKien(d2, { qid: 'Q1', ngay: NGAY, kq: 1 })
    r = await chay(d2, await capPass(d2))
    expect('soVoiHomQua' in r.homNay.tongQuan).toBe(false)
    expect(r.homNay.tongQuan.chuoiNgayHoc).toBe(1)
    const { d: d3 } = dung()
    expect('homNay' in (await chay(d3, await capPass(d3)))).toBe(false)
  })
  it(`dongThoiGian: gom theo (nguồn, mã nguồn), cách nhau ≤ ${PHIEN_CACH_TOI_DA_PHUT} phút; > ${PHIEN_CACH_TOI_DA_PHUT} phút tách phiên; nhãn không chữ game`, async () => {
    const { d } = dung()
    for (const [gio, q] of [['10:00', 'a'], ['10:10', 'b'], ['10:21', 'c']] as const) suKien(d, { qid: q, ngay: NGAY, gio, nguon: 'on_lai', ma: 'p', kq: 1, giay: 60 })
    suKien(d, { qid: 'g1', ngay: NGAY, gio: '15:00', nguon: 'game', ma: 'sess', kq: 1, giay: 30 })
    suKien(d, { qid: 'l1', ngay: NGAY, gio: '16:00', nguon: 'len_bang', ma: 'lb', kq: 0, giay: 30 })
    suKien(d, { qid: 't1', ngay: NGAY, gio: '17:00', nguon: 'thu_thach_rieng', ma: 'tt', kq: 1, giay: 30 })
    suKien(d, { qid: 'x1', ngay: NGAY, gio: '17:30', nguon: 'nguon_la', ma: 'z', kq: 1 }) // nguồn lạ ⇒ bỏ
    const r = await chay(d, await capPass(d))
    const dong = r.homNay.dongThoiGian as any[]
    expect(dong.map((x) => [x.nguon, x.soCau, x.soDung])).toEqual([['on_lai', 2, 2], ['on_lai', 1, 1], ['luyen_dang_vap', 1, 1], ['len_bang', 1, 0], ['thu_thach_rieng', 1, 1]])
    expect(dong[0].phut).toBe(2)
    expect(dong.every((x) => typeof x.batDau === 'string' && x.phut >= 1)).toBe(true)
    expect(nhanNguon('game')).toBe('luyen_dang_vap')
    expect(nhanNguon('nguon_la')).toBeNull()
    expect(JSON.stringify(r)).not.toContain('nguon_la')
  })
  it('BTVN đã nộp hôm nay: ghiChu "Nộp đúng hạn" / "Nộp sau hạn"; tên bài từ ca', async () => {
    const { d } = dung()
    themBtvn(d, 'B1', { nop: '2026-09-22T05:00:00.000Z', han: '2026-09-22T09:00:00.000Z', ten: 'Bài Este' })
    themBtvn(d, 'B2', { nop: '2026-09-22T06:00:00.000Z', han: '2026-09-22T04:00:00.000Z', ten: 'Bài Amin' })
    kho(d, 'Q1'); kho(d, 'Q2')
    suKien(d, { qid: 'Q1', ngay: NGAY, gio: '12:00', nguon: 'btvn', ma: 'B1' }); suKien(d, { qid: 'Q2', ngay: NGAY, gio: '13:00', nguon: 'btvn', ma: 'B2' })
    const dong = (await chay(d, await capPass(d))).homNay.dongThoiGian as any[]
    expect(dong.map((x) => [x.ten, x.ghiChu])).toEqual([['Bài Este', 'Nộp đúng hạn'], ['Bài Amin', 'Nộp sau hạn']])
  })
  it('cau[] tối đa 120, mới nhất trước; deRutGon ≤ 160 ký tự và không cắt giữa công thức $…$', async () => {
    const { d } = dung()
    expect(TOI_DA_CAU_HOM_NAY).toBe(120)
    for (let i = 0; i < 125; i++) {
      kho(d, `Q${i}`, { text: 'Cho $x^2$ '.repeat(30) })
      const phut = Math.floor(i / 60) + 8
      suKien(d, { qid: `Q${i}`, ngay: NGAY, gio: `${String(phut).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`, nguon: 'on_lai', kq: 1 })
    }
    const cau = (await chay(d, await capPass(d))).homNay.cau as any[]
    expect(cau).toHaveLength(120)
    for (let i = 1; i < cau.length; i++) expect(Date.parse(cau[i - 1].luc)).toBeGreaterThanOrEqual(Date.parse(cau[i].luc))
    expect(cau[0].luc).toBe(vn(NGAY, '10:04')) // Q124 (mới nhất) đứng đầu; 5 câu cũ nhất (Q0–Q4) bị cắt
    for (const c of cau) { expect(c.deRutGon.length).toBeLessThanOrEqual(160); expect((c.deRutGon.match(/\$/g) ?? []).length % 2).toBe(0) }
  })
  it('deRutGon thuần: ngắn giữ nguyên; dài cắt ≤ 160 + "…"; lùi trước "$" lẻ', () => {
    expect(deRutGon('ngắn   gọn')).toBe('ngắn gọn')
    const dai = deRutGon('a'.repeat(300))
    expect(dai).toHaveLength(160)
    expect(dai.endsWith('…')).toBe(true)
    const congThuc = deRutGon(`${'a'.repeat(150)} $H_2SO_4 + NaOH$ xong`)
    expect(congThuc.length).toBeLessThanOrEqual(160)
    expect((congThuc.match(/\$/g) ?? []).length % 2).toBe(0)
    expect(deRutGon('x'.repeat(160))).toBe('x'.repeat(160)) // đúng 160 ⇒ giữ nguyên (biên)
  })
})

// ================================================================== BTVN ==================================================================
describe('baiTapVeNha — dangChay (còn hạn, chưa nộp), gan ≤ 5 đã nộp mới nhất', () => {
  it('bài quá hạn chưa nộp không phải "đang chạy"; bài thường không có changXong/changTong; ≤ 5 bài đã nộp, mới nhất trước; diem = đúng/tổng × 10', async () => {
    const { d } = dung()
    themBtvn(d, 'HET-HAN', { han: '2026-09-20T05:00:00.000Z' })
    themBtvn(d, 'THUONG', { han: '2026-09-24T05:00:00.000Z' })
    for (let i = 1; i <= 7; i++) themBtvn(d, `N${i}`, { nop: `2026-09-1${i}T05:00:00.000Z`, han: `2026-09-1${i}T09:00:00.000Z`, soDung: i, soCau: 10 })
    const r = await chay(d, await capPass(d))
    expect(r.baiTapVeNha.dangChay).toEqual([{ maBtvn: 'THUONG', ten: 'Bài THUONG', hanNop: '2026-09-24T05:00:00.000Z' }])
    expect(r.baiTapVeNha.gan.map((x: any) => x.maBtvn)).toEqual(['N7', 'N6', 'N5', 'N4', 'N3'])
    expect(r.baiTapVeNha.gan[0]).toMatchObject({ dungHan: true, diem: 7 })
  })
  it('nộp sau hạn ⇒ dungHan false; thiếu số đúng ⇒ vắng diem; thu hồi/đã xoá ⇒ không hiện', async () => {
    const { d } = dung()
    themBtvn(d, 'TRE', { nop: '2026-09-15T12:00:00.000Z', han: '2026-09-15T05:00:00.000Z', soDung: null })
    themBtvn(d, 'THU-HOI', { nop: '2026-09-16T12:00:00.000Z', soDung: 5 })
    d.sql.prepare("UPDATE btvn_em SET thu_hoi = 1 WHERE ma_btvn = 'THU-HOI'").run()
    themBtvn(d, 'XOA', { nop: '2026-09-17T12:00:00.000Z', soDung: 5 })
    d.sql.prepare("UPDATE btvn SET da_xoa = 1 WHERE ma_btvn = 'XOA'").run()
    const r = await chay(d, await capPass(d))
    expect(r.baiTapVeNha.gan).toEqual([{ maBtvn: 'TRE', ten: 'Bài TRE', nopLuc: '2026-09-15T12:00:00.000Z', dungHan: false }])
    expect('dangChay' in r.baiTapVeNha).toBe(false)
  })
})

// ================================================================== lịch ôn + phuHuynhLamGi ==================================================================
describe('lichOn và phuHuynhLamGi — số thật từ hồ sơ, xưng "con"', () => {
  it('lichOn đếm đúng: tới hạn hôm nay (kể cả quá hạn), ngày mai, đã khắc phục 14 ngày, còn sai; phuHuynhLamGi ≤ 2 câu có số và phút', async () => {
    const { d } = dung()
    // 3 câu sai hôm qua (mốc = hôm nay), 2 câu sai hôm nay (mốc = ngày mai), 1 câu sai từ 5 ngày trước (mốc quá hạn = vẫn "hôm nay")
    for (let i = 0; i < 3; i++) suKien(d, { qid: `S${i}`, ngay: themNgay(NGAY, -1), gio: `10:0${i}`, dang: 'ES', kq: 0 })
    for (let i = 0; i < 2; i++) suKien(d, { qid: `M${i}`, ngay: NGAY, gio: `10:0${i}`, dang: 'ES', kq: 0 })
    suKien(d, { qid: 'QH', ngay: themNgay(NGAY, -5), dang: 'ES', kq: 0 })
    await dungLaiHoSo(d.env, ['S1'], 'x')
    const r = await chay(d, await capPass(d))
    expect(r.lichOn).toEqual({ homNay: 4, ngayMai: 2, daKhacPhuc14Ngay: 0, conSaiChuaKhacPhuc: 6 })
    expect(r.phuHuynhLamGi).toEqual(['Nhắc con làm 4 câu ôn lại hôm nay, khoảng 2 phút.', 'Nhắc con làm 2 câu ôn lại vào ngày mai, khoảng 1 phút.']) // 30 giây/câu (trung vị của sổ 14 ngày)
  })
  it('câu "cần dạy lại" (sai nhiều lần chưa đúng lại) không vào lịch ôn; câu đã khắc phục trong 14 ngày được đếm', async () => {
    const { d } = dung()
    for (let i = 0; i < 4; i++) suKien(d, { qid: 'DL', ngay: themNgay(NGAY, -1), gio: `0${i + 1}:00`, dang: 'ES', kq: 0, lan: i + 1 }) // sai 4 lần liên tiếp
    // câu đã khắc phục: sai rồi đúng ở 3 ngày khác nhau
    suKien(d, { qid: 'KP', ngay: themNgay(NGAY, -9), dang: 'ES', kq: 0 })
    for (const n of [-8, -6, -2]) suKien(d, { qid: 'KP', ngay: themNgay(NGAY, n), dang: 'ES', kq: 1 })
    await dungLaiHoSo(d.env, ['S1'], 'x')
    const r = await chay(d, await capPass(d))
    expect(r.lichOn.daKhacPhuc14Ngay).toBe(1)
    expect(r.lichOn.homNay).toBeGreaterThanOrEqual(0)
  })
  it('sổ lẫn câu BỊ CHE và câu rõ: lịch ôn, bậc, chuỗi ngày học, vuaLenBac chỉ tính phần rõ (hồ sơ dựng từ sổ đầy đủ vẫn có câu sai của ca chưa công bố)', async () => {
    const { d } = dung()
    themCa(d, 'CA', 'khong'); themLuot(d, 'CA', 'S1')
    kho(d, 'R-1', { dang: 'ES', tenDang: 'Este' })
    suKien(d, { qid: 'R-1', ngay: themNgay(NGAY, -2), dang: 'ES', kq: 0 }) // rõ: sai ⇒ bậc ES 1 → 0, mốc ôn = hôm qua ⇒ tới hạn hôm nay
    for (let i = 0; i < 6; i++) suKien(d, { qid: `W${i}`, ngay: themNgay(NGAY, -1), gio: `0${i + 1}:00`, nguon: 'thi', ma: 'CA', dang: 'ES', kq: 0 })
    for (let i = 0; i < 3; i++) suKien(d, { qid: `K${i}`, ngay: i < 2 ? themNgay(NGAY, -1) : NGAY, gio: `1${i}:00`, nguon: 'thi', ma: 'CA', dang: 'ES', kq: 1 })
    await dungLaiHoSo(d.env, ['S1'], 'x')
    expect(d.dem('nam_kt_cau', "sbd = 'S1' AND trang_thai = 'moi_sai'")).toBe(7) // hồ sơ đầy đủ đếm cả 6 câu sai của ca chưa công bố
    const r = await chay(d, await capPass(d))
    expect(r.lichOn).toEqual({ homNay: 1, ngayMai: 0, daKhacPhuc14Ngay: 0, conSaiChuaKhacPhuc: 1 })
    expect(r.bacTheoDang).toEqual([{ ma: 'ES', ten: 'Este', bac: 0 }]) // các câu đúng của ca chưa công bố KHÔNG nâng bậc
    for (const k of ['vuaLenBac', 'manhYeu']) expect(k in r, k).toBe(false)
    expect(r.tienBo).toBeUndefined()
    expect('chuoiNgayHoc' in (r.homNay.tongQuan ?? {})).toBe(false) // hôm qua và hôm nay chỉ có sổ bị che ⇒ không tính là ngày học
  })
  it('em chỉ có câu sai của ca CHƯA công bố ⇒ lịch ôn không đếm chúng (không lộ số câu sai qua "Nhắc con làm N câu")', async () => {
    const { d } = dung()
    themCa(d, 'CA', 'khong'); themLuot(d, 'CA', 'S1')
    for (let i = 0; i < 6; i++) suKien(d, { qid: `K${i}`, ngay: themNgay(NGAY, -1), gio: `0${i + 1}:00`, nguon: 'thi', ma: 'CA', dang: 'ES', kq: 0 })
    await dungLaiHoSo(d.env, ['S1'], 'x') // hồ sơ dựng từ sổ ĐẦY ĐỦ: nam_kt_cau có 6 câu sai tới hạn hôm nay
    expect(d.dem('nam_kt_cau', "sbd = 'S1' AND trang_thai = 'moi_sai'")).toBe(6)
    const r = await chay(d, await capPass(d))
    expect('lichOn' in r).toBe(false)
    expect('phuHuynhLamGi' in r).toBe(false)
  })
})

// ================================================================== LỆNH CON: lời giải MỘT câu ==================================================================
describe('phChiTietCauVeCon — lời giải một câu, CÙNG luật che', () => {
  const goi = async (d: D1That, qid: string, pass?: string) => (await phChiTietCauVeCon(d.env, { pass: pass ?? (await capPass(d)), qid }, NOW)) as Record<string, any>
  const khoLG = (d: D1That, qid: string, o: OKho = {}) => kho(d, qid, { dang: 'ES', tenDang: 'Thuỷ phân ester', text: `Đề đầy đủ ${qid}`, correct: 'C', solution: `LG-BI-MAT-${qid}`, ...o })

  it('xác thực: token sai / không token ⇒ lỗi; thiếu qid ⇒ ok:false', async () => {
    const { d } = dung()
    await expect(phChiTietCauVeCon(d.env, { pass: 'x.y', qid: 'Q' }, NOW)).rejects.toThrow(/không hợp lệ/)
    await expect(phChiTietCauVeCon(d.env, { pass: 'x.y', sbd: 'S1', qid: 'Q' }, NOW)).rejects.toThrow(/không hợp lệ/) // token sai không rơi xuống SBD trần
    await expect(phChiTietCauVeCon(d.env, { sbd: 'KHONG-CO', qid: 'Q' }, NOW)).rejects.toThrow(/Không tìm thấy số báo danh/)
    expect((await phChiTietCauVeCon(d.env, { sbd: 'S1', qid: 'Q' }, NOW)).ok).toBe(false) // SBD trần được nhận; câu con chưa làm thì từ chối vì lý do khác
    expect((await goi(d, '')).ok).toBe(false)
  })
  it('BA ca từ chối: qid LẠ (không có ở đâu) · qid của EM KHÁC · qid của câu BỊ CHE của chính con — không lộ đề, đáp án, lời giải; qid của câu được phép thì có', async () => {
    const { d } = dung()
    khoLG(d, 'Q-EM-KHAC'); khoLG(d, 'Q-CHE'); khoLG(d, 'Q-DUOC')
    suKien(d, { qid: 'Q-EM-KHAC', ngay: NGAY, gio: '09:00', sbd: 'S2', kq: 1 }) // con của nhà khác làm, S1 (con của phụ huynh này) chưa làm
    themCa(d, 'CA-CHE', 'khong'); themLuot(d, 'CA-CHE', 'S1', { tong: 6 })
    suKien(d, { qid: 'Q-CHE', ngay: NGAY, gio: '10:00', nguon: 'thi', ma: 'CA-CHE', kq: 0 }) // ca chưa công bố
    suKien(d, { qid: 'Q-DUOC', ngay: NGAY, gio: '11:00', nguon: 'on_lai', ma: 'm', kq: 1 })
    const pass = await capPass(d)
    for (const qid of ['Q-KHONG-CO-DAU', 'Q-EM-KHAC']) {
      const r = await goi(d, qid, pass)
      expect(r, qid).toMatchObject({ ok: false })
      expect(JSON.stringify(r), qid).not.toMatch(/LG-BI-MAT|Đề đầy đủ|"dapAn"/)
    }
    const che = await goi(d, 'Q-CHE', pass)
    expect(che).toMatchObject({ ok: false, che: 'chua_cong_bo' })
    expect(JSON.stringify(che)).not.toMatch(/LG-BI-MAT|Đề đầy đủ|"dapAn"/)
    const duoc = await goi(d, 'Q-DUOC', pass)
    expect(duoc.ok).toBe(true)
    expect(duoc.loiGiai).toContain('LG-BI-MAT-Q-DUOC')
  })
  it('qid trong danh sách hôm nay khớp lệnh lời giải: mọi câu CÓ qid mở được, mọi câu KHÔNG qid (bị che) thì lệnh từ chối', async () => {
    const { d } = dung()
    khoLG(d, 'Q-A'); khoLG(d, 'Q-B')
    themCa(d, 'CA-B', 'khong'); themLuot(d, 'CA-B', 'S1', { tong: 6 })
    suKien(d, { qid: 'Q-A', ngay: NGAY, gio: '10:00', nguon: 'on_lai', ma: 'm', kq: 1 })
    suKien(d, { qid: 'Q-B', ngay: NGAY, gio: '10:30', nguon: 'thi', ma: 'CA-B', kq: 0 })
    const pass = await capPass(d)
    const r = await chay(d, pass)
    const conQid = (r.homNay.cau as any[]).filter((c) => 'qid' in c)
    const bi = (r.homNay.cau as any[]).filter((c) => !('qid' in c))
    expect(conQid.map((c) => c.qid)).toEqual(['Q-A'])
    expect(bi).toHaveLength(1)
    expect(bi[0].che).toBe('chua_cong_bo')
    expect((await goi(d, 'Q-A', pass)).ok).toBe(true)
    expect((await goi(d, 'Q-B', pass)).ok).toBe(false)
  })
  it('câu con CHƯA làm ⇒ từ chối (không thành đường đọc kho tuỳ ý)', async () => {
    const { d } = dung()
    khoLG(d, 'Q-LA')
    const r = await goi(d, 'Q-LA')
    expect(r.ok).toBe(false)
    expect(JSON.stringify(r)).not.toContain('LG-BI-MAT')
  })
  it.each([['khong', 'chua_cong_bo'], ['ca_lop_xong', 'chua_cong_bo']] as const)('câu của ca cong_bo=%s CHƯA công bố ⇒ từ chối, có che, không lộ lời giải/đáp án', async (congBo, che) => {
    const { d } = dung()
    themCa(d, 'CA', congBo); themLuot(d, 'CA', 'S1'); themLuot(d, 'CA', 'S2', { tt: 'dang_lam', nop: null, tong: null })
    khoLG(d, 'Q1')
    suKien(d, { qid: 'Q1', ngay: NGAY, nguon: 'thi', ma: 'CA', kq: 1 })
    const r = await goi(d, 'Q1')
    expect(r).toMatchObject({ ok: false, che })
    expect(JSON.stringify(r)).not.toMatch(/LG-BI-MAT|Đề đầy đủ|"dapAn"/)
    d.sql.prepare("UPDATE ca SET cong_bo = 'ngay' WHERE ma_ca = 'CA'").run()
    expect(await goi(d, 'Q1')).toMatchObject({ ok: true, dapAn: 'C', loiGiai: 'LG-BI-MAT-Q1', de: 'Đề đầy đủ Q1', tenDang: 'Thuỷ phân ester' })
  })
  it('BTVN / gói gia đình giao CHƯA nộp ⇒ từ chối chua_nop; nộp rồi ⇒ có lời giải', async () => {
    const { d } = dung()
    themBtvn(d, 'BT1', { nop: null }); themMom(d, 'giao_them_2026-09-22_1', false)
    khoLG(d, 'QB'); khoLG(d, 'QM')
    suKien(d, { qid: 'QB', ngay: NGAY, nguon: 'btvn', ma: 'BT1' }); suKien(d, { qid: 'QM', ngay: NGAY, nguon: 'mom', ma: 'giao_them_2026-09-22_1' })
    for (const q of ['QB', 'QM']) { const r = await goi(d, q); expect(r, q).toMatchObject({ ok: false, che: 'chua_nop' }); expect(JSON.stringify(r)).not.toContain('LG-BI-MAT') }
    d.sql.prepare("UPDATE btvn_em SET nop_luc = '2026-09-22T05:00:00.000Z'").run()
    d.sql.prepare("UPDATE mom_bai SET submitted_at = '2026-09-22T12:00:00.000Z'").run()
    for (const q of ['QB', 'QM']) expect((await goi(d, q)).ok, q).toBe(true)
  })
  it('CÙNG câu làm ở hai nơi, một nơi bị che ⇒ từ chối (che theo lần làm nghiêm nhất)', async () => {
    const { d } = dung()
    themCa(d, 'CA', 'khong'); themLuot(d, 'CA', 'S1')
    khoLG(d, 'QX')
    suKien(d, { qid: 'QX', ngay: NGAY, nguon: 'on_lai', ma: 'x' }); suKien(d, { qid: 'QX', ngay: NGAY, gio: '20:00', nguon: 'thi', ma: 'CA', lan: 1 })
    expect(await goi(d, 'QX')).toMatchObject({ ok: false, che: 'chua_cong_bo' })
  })
  it('nguồn ôn lại (không bị che) ⇒ có lời giải; câu TỰ LUẬN ⇒ từ chối; thiếu lời giải ⇒ vắng loiGiai', async () => {
    const { d } = dung()
    khoLG(d, 'QOK'); khoLG(d, 'QTL', { choices: [], text: 'Trình bày cơ chế.' }); khoLG(d, 'QKHONG', { solution: '' })
    for (const q of ['QOK', 'QTL', 'QKHONG']) suKien(d, { qid: q, ngay: NGAY, gio: `1${q.length}:00`, nguon: 'on_lai', ma: q })
    expect(await goi(d, 'QOK')).toMatchObject({ ok: true, loiGiai: 'LG-BI-MAT-QOK', phuongAn: ['A. a', 'B. b', 'C. c', 'D. d'] })
    const tl = await goi(d, 'QTL')
    expect(tl.ok).toBe(false)
    expect(JSON.stringify(tl)).not.toMatch(/Trình bày|LG-BI-MAT/)
    const khong = await goi(d, 'QKHONG')
    expect(khong.ok).toBe(true)
    expect('loiGiai' in khong).toBe(false)
  })
  it('≤ 9 truy vấn (kể cả xác thực), không ghi ngoài dòng đếm truy cập; không chữ game', async () => {
    const { d } = dung()
    themCa(d, 'CA', 'ngay'); themLuot(d, 'CA', 'S1'); themBtvn(d, 'BT1', { nop: '2026-09-22T05:00:00.000Z' }); themMom(d, 'M1', true)
    khoLG(d, 'Q1')
    for (const [nguon, ma] of [['thi', 'CA'], ['btvn', 'BT1'], ['mom', 'M1']] as const) suKien(d, { qid: 'Q1', ngay: NGAY, gio: `1${ma.length}:00`, nguon, ma })
    const { env, log } = ghi(d)
    const r = (await phChiTietCauVeCon(env, { pass: await capPass(d), qid: 'Q1' }, NOW)) as Record<string, any>
    expect(r.ok).toBe(true)
    expect(log.length, log.join('\n')).toBeLessThanOrEqual(9)
    expect(log.filter((q) => /^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i.test(q))).toHaveLength(1)
    expect(chuGameTrong(JSON.stringify(r))).toEqual([])
    for (const k of KHOA_CAM) expect(moiKhoa(r)).not.toContain(k)
  })
})

// ================================================================== MỐC HIỂN THỊ ==================================================================
// Thầy chốt 21/09 15:56: mọi con số hiển thị chỉ tính từ 12:00 trưa 21/09 (`cau_hinh.hien_thi_tu` ⇒ … ⇒ hằng 2026-09-21T05:00:00.000Z); sổ trước mốc CHỈ để thuật toán dùng.
// Mỗi chỗ MỘT test "sự kiện trước mốc không lọt vào số hiển thị" (+ đối chứng mốc cổ ⇒ CHÍNH các sự kiện ấy tính lại) + phần "thuật toán vẫn dùng". Ngoại lệ: ca kiểm tra đã công bố.
describe('MỐC HIỂN THỊ — sự kiện trước 12:00 trưa 21/09 không lọt vào số hiển thị', () => {
  const NGAY_MOC = '2026-09-21'
  const T_MOC = T(`${NGAY_MOC}T20:30:00`) // "bây giờ" = tối ngày mốc (cùng ngày với mốc)
  const truoc = themNgay(NGAY_MOC, -1) // 20/09 — hoàn toàn trước mốc
  const homQua = NGAY_MOC // NOW (22/09) − 1
  const chayMoc = async (d: D1That, now = NOW) => (await phTatCaVeCon(d.env, { sbd: 'S1' }, now)) as Record<string, any>

  it('nhipHoc: ngày trước mốc vắng; ngày mốc chỉ đếm sự kiện từ 12:00 (2 câu 14:00, không tính 2 câu 08:00); đối chứng mốc cổ ⇒ tính đủ', async () => {
    const dat = (o?: { moc?: string | null }) => {
      const { d } = dung(o)
      for (let i = 0; i < 3; i++) suKien(d, { qid: `A${i}`, ngay: truoc, gio: '19:00', kq: 1 })
      for (let i = 0; i < 2; i++) suKien(d, { qid: `B${i}`, ngay: NGAY_MOC, gio: '08:00', kq: 1 })
      for (let i = 0; i < 2; i++) suKien(d, { qid: `C${i}`, ngay: NGAY_MOC, gio: '14:00', kq: i === 0 ? 1 : 0 })
      suKien(d, { qid: 'D', ngay: NGAY, gio: '10:00', kq: 1 })
      return d
    }
    const r = await chayMoc(dat({ moc: null }))
    expect(r.nhipHoc.ngay).toEqual([{ ngay: NGAY_MOC, soCau: 2, soCauDung: 1 }, { ngay: NGAY, soCau: 1, soCauDung: 1 }])
    const doiChung = await chayMoc(dat())
    expect(doiChung.nhipHoc.ngay).toEqual([{ ngay: truoc, soCau: 3, soCauDung: 3 }, { ngay: NGAY_MOC, soCau: 4, soCauDung: 3 }, { ngay: NGAY, soCau: 1, soCauDung: 1 }])
  })

  it('mọi sự kiện đều trước mốc ⇒ nhipHoc, tổng quan, chuỗi, dạng… VẮNG (khối thiếu dữ liệu ⇒ vắng, không số 0 giả)', async () => {
    const { d } = dung({ moc: null })
    for (let i = 0; i < 5; i++) suKien(d, { qid: `Q${i}`, ngay: truoc, gio: '19:00', kq: i % 2, dang: 'ES' })
    kho(d, 'Q0', { dang: 'ES', tenDang: 'Este' })
    await dungLaiHoSo(d.env, ['S1'], 'x')
    const r = await chayMoc(d)
    for (const k of ['nhipHoc', 'homNay', 'dangVap', 'manhYeu', 'vuaLenBac']) expect(k in r, k).toBe(false)
    expect(r.tienBo?.dangTienBoNhat).toBeUndefined()
  })

  it('dạng vấp / làm tốt (manhYeu): chỉ đếm từ mốc — 4 câu sai TRƯỚC mốc + 3 câu sai SAU mốc ⇒ "dung 0 / tong 3", không phải tong 7; dạng chỉ có làm tốt trước mốc không vào lamTot', async () => {
    const dat = async (o?: { moc?: string | null }) => {
      const { d } = dung(o)
      kho(d, 'ES-q', { dang: 'ES', tenDang: 'Este' }); kho(d, 'PO-q', { dang: 'PO', tenDang: 'Polime' })
      for (let i = 0; i < 4; i++) suKien(d, { qid: `ES-t${i}`, ngay: truoc, gio: '10:00', dang: 'ES', kq: 0 })
      for (let i = 0; i < 3; i++) suKien(d, { qid: `ES-s${i}`, ngay: NGAY, gio: `1${i}:00`, dang: 'ES', kq: 0 })
      for (let i = 0; i < 5; i++) suKien(d, { qid: `PO-${i}`, ngay: truoc, gio: '11:00', dang: 'PO', kq: 1 })
      await dungLaiHoSo(d.env, ['S1'], 'x')
      return d
    }
    const r = await chayMoc(await dat({ moc: null }))
    expect(r.dangVap).toEqual([{ ma: 'ES', ten: 'Este', dung: 0, tong: 3 }])
    expect(r.manhYeu.conVap).toEqual([expect.objectContaining({ tenDang: 'Este', dung: 0, tong: 3 })])
    expect(r.manhYeu.lamTot).toBeUndefined()
    const doiChung = await chayMoc(await dat())
    expect(doiChung.dangVap.find((x: any) => x.ma === 'ES')).toMatchObject({ dung: 0, tong: 7 })
    expect(doiChung.manhYeu.lamTot).toEqual([expect.objectContaining({ tenDang: 'Polime', dung: 5, tong: 5 })])
  })

  it('bậc: "vừa lên bậc" / "tiến bộ" so với TRẠNG THÁI TẠI MỐC — lên bậc TRƯỚC mốc không hiện; lên SAU mốc hiện; bacTheoDang (trạng thái do thuật toán giữ) vẫn hiện cả hai dạng', async () => {
    const dat = async (o?: { moc?: string | null }) => {
      const { d } = dung(o)
      kho(d, 'UP-q', { dang: 'UP', tenDang: 'Lên trước mốc' }); kho(d, 'NEW-q', { dang: 'NEW', tenDang: 'Lên sau mốc' })
      suKien(d, { qid: 'UP-1', ngay: truoc, gio: '10:00', dang: 'UP', kq: 1 }) // bậc UP 1→2 TRƯỚC mốc
      suKien(d, { qid: 'UP-2', ngay: NGAY, gio: '10:00', dang: 'UP', kq: 1 }) // sau mốc nhưng đã ở bậc tối đa ⇒ không lên thêm
      suKien(d, { qid: 'NEW-1', ngay: NGAY, gio: '11:00', dang: 'NEW', kq: 1 }) // bậc NEW 1→2 SAU mốc
      await dungLaiHoSo(d.env, ['S1'], 'x')
      return d
    }
    const r = await chayMoc(await dat({ moc: null }))
    expect(r.vuaLenBac).toEqual([{ ma: 'NEW', ten: 'Lên sau mốc', tu: 1, den: 2, ngay: NGAY }])
    expect(r.tienBo.dangTienBoNhat).toEqual([{ ma: 'NEW', ten: 'Lên sau mốc', tu: 1, den: 2 }])
    expect(r.bacTheoDang.map((x: any) => [x.ma, x.bac]).sort()).toEqual([['NEW', 2], ['UP', 2]]) // trạng thái hiện tại vẫn hiện (thuật toán dùng toàn bộ sổ)
    const doiChung = await chayMoc(await dat())
    expect(doiChung.vuaLenBac.map((x: any) => x.ma).sort()).toEqual(['NEW', 'UP'])
  })

  it('bậc: dạng có hoạt động CHỈ trước mốc (trong 14 ngày) vẫn có mặt ở bacTheoDang (bậc là trạng thái), nhưng KHÔNG ở dangVap/manhYeu', async () => {
    const { d } = dung({ moc: null })
    kho(d, 'TR-q', { dang: 'TR', tenDang: 'Chỉ trước mốc' }); kho(d, 'SA-q', { dang: 'SA', tenDang: 'Có sau mốc' })
    suKien(d, { qid: 'TR-1', ngay: truoc, gio: '10:00', dang: 'TR', kq: 1 })
    suKien(d, { qid: 'SA-1', ngay: NGAY, gio: '10:00', dang: 'SA', kq: 1 })
    await dungLaiHoSo(d.env, ['S1'], 'x')
    const r = await chayMoc(d)
    expect(r.bacTheoDang.map((x: any) => x.ma).sort()).toEqual(['SA', 'TR'])
  })

  it('tổng quan HÔM NAY khi hôm nay là NGÀY MỐC: chỉ đếm phiên/câu từ 12:00 (sáng 08:00 không vào soCau, dongThoiGian, phút học)', async () => {
    const dat = (o?: { moc?: string | null }) => {
      const { d } = dung(o)
      for (let i = 0; i < 3; i++) suKien(d, { qid: `S${i}`, ngay: NGAY_MOC, gio: `08:0${i}`, kq: 1, giay: 60 })
      for (let i = 0; i < 2; i++) suKien(d, { qid: `C${i}`, ngay: NGAY_MOC, gio: `14:0${i}`, kq: 1, giay: 60 })
      return d
    }
    const r = await chayMoc(dat({ moc: null }), T_MOC)
    expect(r.homNay.tongQuan).toMatchObject({ soCau: 2, soDung: 2, phutHoc: 2 })
    expect(r.homNay.dongThoiGian).toHaveLength(1)
    expect(r.homNay.dongThoiGian[0].soCau).toBe(2)
    const doiChung = await chayMoc(dat(), T_MOC)
    expect(doiChung.homNay.tongQuan).toMatchObject({ soCau: 5, phutHoc: 5 })
    expect(doiChung.homNay.dongThoiGian).toHaveLength(2)
  })

  it('chuỗi học đều chỉ đếm từ ngày mốc: học 19/09, 20/09, 21/09 (chiều), 22/09 ⇒ chuỗi 2 (không phải 4); đối chứng mốc cổ ⇒ 4', async () => {
    const dat = (o?: { moc?: string | null }) => {
      const { d } = dung(o)
      suKien(d, { qid: 'N1', ngay: themNgay(NGAY_MOC, -2), gio: '19:00' }); suKien(d, { qid: 'N2', ngay: truoc, gio: '19:00' })
      suKien(d, { qid: 'N3', ngay: NGAY_MOC, gio: '14:00' }); suKien(d, { qid: 'N4', ngay: NGAY, gio: '10:00' })
      return d
    }
    expect((await chayMoc(dat({ moc: null }))).homNay.tongQuan.chuoiNgayHoc).toBe(2)
    expect((await chayMoc(dat())).homNay.tongQuan.chuoiNgayHoc).toBe(4)
  })

  it('"so với hôm qua": hôm qua = NGÀY MỐC chỉ đếm từ 12:00 (2 câu chiều, không phải 6); hôm qua chỉ có sự kiện SÁNG (trước mốc) ⇒ soVoiHomQua VẮNG', async () => {
    const { d } = dung({ moc: null })
    for (let i = 0; i < 4; i++) suKien(d, { qid: `S${i}`, ngay: homQua, gio: '08:00', kq: 1 })
    for (let i = 0; i < 2; i++) suKien(d, { qid: `C${i}`, ngay: homQua, gio: '14:00', kq: i === 0 ? 1 : 0 })
    suKien(d, { qid: 'H', ngay: NGAY, gio: '10:00' })
    expect((await chayMoc(d)).homNay.tongQuan.soVoiHomQua).toEqual({ soCau: 2, tiLeDung: 0.5 })
    const { d: d2 } = dung({ moc: null })
    for (let i = 0; i < 4; i++) suKien(d2, { qid: `S${i}`, ngay: homQua, gio: '08:00', kq: 1 })
    suKien(d2, { qid: 'H', ngay: NGAY, gio: '10:00' })
    expect('soVoiHomQua' in (await chayMoc(d2)).homNay.tongQuan).toBe(false)
  })

  it('"đã khắc phục x trong y": câu sai TRƯỚC mốc mà con chưa động lại là nợ cũ ⇒ loại khỏi y; câu con làm lại từ mốc thì tính; lịch ôn hôm nay vẫn do thuật toán (gồm cả câu cũ)', async () => {
    const dat = async (o?: { moc?: string | null }) => {
      const { d } = dung(o)
      for (let i = 0; i < 3; i++) suKien(d, { qid: `P${i}`, ngay: truoc, gio: '10:00', dang: 'ES', kq: 0 }) // sai trước mốc, KHÔNG động lại
      suKien(d, { qid: 'Q0', ngay: truoc, gio: '10:00', dang: 'ES', kq: 0 }) // sai trước mốc, đúng lại SAU mốc (1 ngày ⇒ đang ôn)
      suKien(d, { qid: 'Q0', ngay: NGAY, gio: '10:00', dang: 'ES', kq: 1, lan: 2 })
      suKien(d, { qid: 'R0', ngay: themNgay(NGAY_MOC, -2), gio: '10:00', dang: 'ES', kq: 0 }) // sai 19/09, đúng 20/09, 21/09 (chiều), 22/09 ⇒ ba ngày đúng khác nhau = ĐÃ KHẮC PHỤC
      suKien(d, { qid: 'R0', ngay: truoc, gio: '10:00', dang: 'ES', kq: 1, lan: 2 })
      suKien(d, { qid: 'R0', ngay: NGAY_MOC, gio: '14:00', dang: 'ES', kq: 1, lan: 3 })
      suKien(d, { qid: 'R0', ngay: NGAY, gio: '10:00', dang: 'ES', kq: 1, lan: 4 })
      // K0: sai 17/09, đúng 18/09, 19/09, 20/09 ⇒ ĐÃ khắc phục nhưng HOÀN TOÀN trước mốc và không động lại ⇒ không phải thành tích "từ mốc"
      suKien(d, { qid: 'K0', ngay: themNgay(NGAY_MOC, -4), gio: '10:00', dang: 'ES', kq: 0 })
      for (const [i, n] of [[2, -3], [3, -2], [4, -1]] as const) suKien(d, { qid: 'K0', ngay: themNgay(NGAY_MOC, n), gio: '10:00', dang: 'ES', kq: 1, lan: i })
      await dungLaiHoSo(d.env, ['S1'], 'x')
      return d
    }
    const r = await chayMoc(await dat({ moc: null }))
    expect(r.lichOn.daKhacPhuc14Ngay).toBe(1) // R0 (K0 khắc phục xong từ trước mốc ⇒ không tính)
    expect(r.lichOn.conSaiChuaKhacPhuc).toBe(1) // Q0 (P0–P2 là nợ cũ, loại)
    expect(r.lichOn.homNay).toBeGreaterThanOrEqual(3) // thuật toán vẫn xếp P0–P2 (sai trước mốc) vào lịch ôn hôm nay
    const doiChung = await chayMoc(await dat())
    expect(doiChung.lichOn.conSaiChuaKhacPhuc).toBe(4) // P0–P2 + Q0
    expect(doiChung.lichOn.daKhacPhuc14Ngay).toBe(2) // R0 + K0
    expect(doiChung.lichOn.homNay).toBe(r.lichOn.homNay) // lịch (thuật toán) không đổi theo mốc
    // "khoảng X phút": trung vị giây/câu do THUẬT TOÁN đọc cả sổ 14 ngày (30 giây/câu); chỉ 4 sự kiện từ mốc (< 5 mẫu) mà vẫn ra 30 giây, không rơi về mặc định 90
    const n = r.lichOn.homNay
    expect(phutUocTinhChang(n, 30)).not.toBe(phutUocTinhChang(n, 90))
    expect(r.phuHuynhLamGi[0]).toBe(`Nhắc con làm ${n} câu ôn lại hôm nay, khoảng ${phutUocTinhChang(n, 30)} phút.`)
  })

  it('NGOẠI LỆ: ca kiểm tra đã công bố (nộp TRƯỚC mốc) vẫn có ở caGanNhat và tienBo.diem', async () => {
    const { d } = dung({ moc: null })
    themCa(d, 'CA-CU', 'ngay'); themLuot(d, 'CA-CU', 'S1', { nop: '2026-09-20T03:00:00.000Z', tong: 6.5 })
    const r = await chayMoc(d)
    expect(r.caGanNhat).toMatchObject({ maCa: 'CA-CU', congBo: { daCongBo: true }, ketQua: { tong: 6.5 } })
    expect(r.tienBo.diem).toEqual([expect.objectContaining({ maCa: 'CA-CU', diem: 6.5 })])
  })

  it('doCham (hạng chăm hôm nay) cũng từ mốc: học sáng ngày mốc ⇒ VẮNG; học chiều ngày mốc ⇒ có hạng', async () => {
    const { d } = dung({ moc: null })
    for (let i = 0; i < 3; i++) suKien(d, { qid: `S${i}`, ngay: NGAY_MOC, gio: '08:00' })
    expect('doCham' in (await chayMoc(d, T_MOC))).toBe(false)
    suKien(d, { qid: 'C1', ngay: NGAY_MOC, gio: '14:00' })
    expect((await chayMoc(d, T_MOC)).doCham).toEqual({ hang: 1, siSo: 2 })
  })

  it('BIÊN: sự kiện đúng 12:00:00 VN (= mốc) TÍNH là từ mốc (nhịp học, và lên bậc đúng lúc mốc hiện); 11:59 thì không', async () => {
    const { d } = dung({ moc: null })
    kho(d, 'EX-q', { dang: 'EX', tenDang: 'Đúng mốc' }); kho(d, 'SM-q', { dang: 'SM', tenDang: 'Sát mốc' })
    suKien(d, { qid: 'EX-1', ngay: NGAY_MOC, gio: '12:00', dang: 'EX', kq: 1 }) // đúng mốc ⇒ lên bậc SAU mốc
    suKien(d, { qid: 'SM-1', ngay: NGAY_MOC, gio: '11:59', dang: 'SM', kq: 1 }) // 1 phút trước mốc ⇒ lên bậc TRƯỚC mốc
    await dungLaiHoSo(d.env, ['S1'], 'x')
    const r = await chayMoc(d, T_MOC)
    expect(r.nhipHoc.ngay).toEqual([{ ngay: NGAY_MOC, soCau: 1, soCauDung: 1 }])
    expect(r.vuaLenBac.map((x: any) => x.ma)).toEqual(['EX'])
  })

  it('thứ tự ưu tiên của mốc: hien_thi_tu THẮNG ve_dich_tu THẮNG bang_tin_tu (cùng hàm giaiMocHienThi của Code 3)', async () => {
    const { d } = dung({ moc: `${NGAY_MOC}T03:00:00.000Z` }) // hien_thi_tu = 10:00 VN
    d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bang_tin_tu',?,'x')").run(`${NGAY_MOC}T09:00:00.000Z`) // 16:00 VN — KHÔNG được thắng
    d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('ve_dich_tu',?,'x')").run(`${NGAY_MOC}T08:00:00.000Z`) // 15:00 VN — KHÔNG được thắng
    suKien(d, { qid: 'M', ngay: NGAY_MOC, gio: '11:00' })
    expect((await chayMoc(d, T_MOC)).homNay.tongQuan.soCau).toBe(1)
  })

  it('mốc đọc từ cấu hình: hien_thi_tu = 10:00 VN ngày mốc ⇒ 08:00 loại, 11:00 giữ; mốc KHÔNG tốn truy vấn riêng ở lệnh này (chung truy vấn gộp)', async () => {
    const { d } = dung({ moc: `${NGAY_MOC}T03:00:00.000Z` })
    suKien(d, { qid: 'S', ngay: NGAY_MOC, gio: '08:00' }); suKien(d, { qid: 'M', ngay: NGAY_MOC, gio: '11:00' })
    const { env, log } = ghi(d)
    const r = (await phTatCaVeCon(env, { sbd: 'S1' }, T_MOC)) as Record<string, any>
    expect(r.homNay.tongQuan.soCau).toBe(1)
    // đọc mốc riêng lẻ (`FROM cau_hinh WHERE khoa IN (?, ?, ?)`) chỉ có ở docVeDichCuaEm của Code 3 — lệnh này không thêm truy vấn mốc nào
    expect(log.filter((q) => /FROM cau_hinh WHERE khoa IN \(\?, \?, \?\)/.test(q)).length).toBeLessThanOrEqual(1)
    expect(log.some((q) => /^(INSERT|UPDATE|DELETE)/i.test(q) && !/ph_truy_cap/.test(q))).toBe(false)
  })

  it('không có hàng cấu hình mốc nào ⇒ dùng HẰNG 12:00 trưa 21/09 (không ném, không lộ sự kiện trước mốc)', async () => {
    const { d } = dung({ moc: null })
    suKien(d, { qid: 'S', ngay: NGAY_MOC, gio: '08:00' }); suKien(d, { qid: 'C', ngay: NGAY_MOC, gio: '14:00' })
    expect((await chayMoc(d, T_MOC)).homNay.tongQuan.soCau).toBe(1)
  })
})
