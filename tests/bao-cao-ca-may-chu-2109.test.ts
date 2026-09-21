// @vitest-environment node
// `/gv/bao-cao-ca` (tổng quan CẢ LỚP) và `/gv/bao-cao-ca-em` (báo cáo MỘT em + hangTrongLop) — server/src/bao-cao-ca.ts; hợp đồng docs/hop-dong-xem-diem-v2-2109.md mục 2, 4.
// Khoá: số liệu lớp (soEm, tb, cao, thap, phổ điểm 10 khoảng, phanTb + toiDa), luật vắng (JSON KHÔNG có khoá), ca chưa công bố thầy vẫn xem + congBo, dạng cả lớp vấp, câu sai nhiều + đáp án sai nhiều nhất,
// câu tự luận không vào danh sách nào, em cần để ý, tài khoản thử + em khoá bị loại, ketQua/phan/dang (tên, ≤ 12 dòng)/cauCanXemLai (sai trước, ≤ 8, tbGiay chỉ ≥ 5 em)/bậc trước-sau ca/hạng,
// ≤ 12 truy vấn, KHÔNG ghi, lỗi đọc ⇒ loi_doc. SQLite thật (tests/_d1-that.ts, có chốt 5 term UNION của D1).
import { describe, expect, it, vi } from 'vitest'
import {
  baoCaoMotEm, deRutGon, gvBaoCaoCa, gvBaoCaoCaEm, DE_TOI_DA_KY_TU, SAN_EM_TB_GIAY, TOI_DA_CAU_XEM_LAI, TOI_DA_DANG_EM, TOI_DA_EM_CAN_Y,
} from '../server/src/bao-cao-ca'
import { docTrangThaiCongBo } from '../server/src/cong-bo-diem'
import { docSuKienDoc, phatLaiSuKien, traCuuTheoQid } from '../server/src/ho-so-nam-kt'
import { quotaPhan } from '../src/engine/score'
import { taoD1That, type D1That } from './_d1-that'

const NOW = Date.parse('2026-09-22T05:00:00.000Z') // 12:00 VN thứ Ba 22/09
const VAO = '2026-09-20T02:00:00.000Z'
const NOP = '2026-09-20T02:30:00.000Z' // 1800 giây sau VAO
type Ph = 'I' | 'II' | 'III'
interface Cau { p: Ph; so: number; qid?: string }
const DAP_AN: Record<Ph, string> = { I: 'B', II: 'DSDS', III: '2,5' }
const SAI_MAC_DINH: Record<Ph, string> = { I: 'A', II: 'DDSS', III: '3,0' } // phần II 'DDSS' so với 'DSDS' đúng 2 ý ⇒ "đúng một phần"
const TEN_DANG: Record<string, string> = { 'D.ESTE': 'Thuỷ phân ester', 'D.AMIN': 'Tính chất amin', 'D.PIN': 'Pin điện hoá', 'D.TINH': 'Tính hiệu suất' }
const dangCua = (p: Ph, so: number): string => (p === 'I' ? (so <= 6 ? 'D.ESTE' : so <= 12 ? 'D.AMIN' : 'D.PIN') : p === 'II' ? 'D.ESTE' : 'D.TINH')
/** Đề chuẩn 18/4/6. */
const hinh = (i: number, ii: number, iii: number): Cau[] => [
  ...Array.from({ length: i }, (_, k) => ({ p: 'I' as Ph, so: k + 1 })),
  ...Array.from({ length: ii }, (_, k) => ({ p: 'II' as Ph, so: k + 1 })),
  ...Array.from({ length: iii }, (_, k) => ({ p: 'III' as Ph, so: k + 1 })),
]
const CHUAN = hinh(18, 4, 6)
const nhan = (c: Cau): string => `${c.p}-${c.so}`

// ---------------------------------------------------------------- dựng dữ liệu ----------------------------------------------------------------
const themCa = (d: D1That, ma: string, o: { ten?: string; tt?: string; congBo?: string | null; loai?: string; lop?: string | null } = {}) =>
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,cong_bo,thoi_gian_phut,cap_nhat_luc) VALUES(?,?,?,?,?,?,45,'x')")
    .run(ma, o.ten ?? `Ca ${ma}`, o.tt ?? 'mo', o.loai ?? 'thi', o.lop === undefined ? '12' : o.lop, o.congBo === undefined ? 'ngay' : o.congBo)
const themHs = (d: D1That, sbd: string, ten: string, tt: string | null = null) =>
  d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,trang_thai,mat_khau,cap_nhat_luc) VALUES(?,?,'12',?,'mk','x')").run(sbd, ten, tt)
const themLuot = (d: D1That, o: { ma: string; sbd: string; lan?: number; vao?: string; nop?: string | null; tt?: string; tong?: number | null; i?: number | null; ii?: number | null; iii?: number | null }) =>
  d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,diem_i,diem_ii,diem_iii,tong,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?,'x')")
    .run(`${o.ma}|${o.sbd}|${o.lan ?? 1}`, o.ma, o.sbd, o.lan ?? 1, o.vao ?? VAO, o.nop === undefined ? NOP : o.nop, o.tt ?? 'da_nop', o.i ?? null, o.ii ?? null, o.iii ?? null, o.tong ?? null)
interface OCham { ma: string; sbd: string; lan?: number; cau?: Cau[]; de?: string; sai?: string[]; chon?: Record<string, string>; trong?: string[]; giay?: Record<string, number>; giayMacDinh?: number; chuyenDe?: string }
/** Ghi bảng chấm của MỘT lượt: câu trong `sai` (nhãn 'I-1') sai, trong `trong` chưa chấm (dung_sai NULL), còn lại đúng. */
function chamLuot(d: D1That, o: OCham): void {
  const ins = d.sql.prepare('INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,chuyen_de,muc_do,dap_an_chon,dap_an_dung,dung_sai,giay,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
  for (const c of o.cau ?? CHUAN) {
    const n = nhan(c)
    const sai = (o.sai ?? []).includes(n)
    const trong = (o.trong ?? []).includes(n)
    const chon = trong ? '' : sai ? (o.chon?.[n] ?? SAI_MAC_DINH[c.p]) : DAP_AN[c.p]
    ins.run(`${o.ma}|${o.sbd}|${o.lan ?? 1}|${c.p}|${c.so}`, o.ma, o.sbd, o.lan ?? 1, c.p, c.so, c.qid ?? `${o.de ?? 'DE1'}-${n}`, o.chuyenDe ?? '', '', chon, DAP_AN[c.p], trong ? null : sai ? 0 : 1, o.giay?.[n] ?? o.giayMacDinh ?? 40, 'x')
  }
}
/** Kho câu: mỗi câu một dòng `game_v2_question` (mã dạng + JSON có tên dạng, đề, đáp án, lời giải). */
function themKho(d: D1That, cau: Cau[] = CHUAN, de = 'DE1'): void {
  const ins = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const c of cau) {
    const qid = c.qid ?? `${de}-${nhan(c)}`
    const dang = dangCua(c.p, c.so)
    const q = {
      qid, phan: c.p, text: qid === 'DE1-I-1' ? `Rất dài ${'chữ '.repeat(120)}` : `Câu ${qid}: nội dung đề`,
      ...(c.p === 'I' ? { choices: ['a1', 'b1', 'c1', 'd1'] } : c.p === 'II' ? { ideas: ['y1', 'y2', 'y3', 'y4'] } : {}),
      correct: DAP_AN[c.p], dang, tenDang: TEN_DANG[dang], solution: `LOIGIAI-${qid}`,
    }
    ins.run(de, qid, 'v1', `g-${qid}`, dang, JSON.stringify(q))
  }
}
const nkc = (d: D1That, sbd: string, qid: string, o: { dang?: string | null; tt: string; moc?: string | null }) =>
  d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,chuyen_de,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,ket_qua_cuoi,nguon_cuoi,luc_cuoi,moc_on_ke,trang_thai,cap_nhat_luc) VALUES(?,?,?,?,'',1,1,0,0,0,0,'thi',?,?,?,'x')")
    .run(`${sbd}|${qid}`, sbd, qid, o.dang ?? null, NOP, o.moc ?? null, o.tt)
const nkd = (d: D1That, sbd: string, ma: string, o: { gap: number; sai?: number; khacPhuc?: number; moiSai?: number; chuaSai?: number; bac: number; mocMoi?: string | null }) =>
  d.sql.prepare("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,moc_on_ke,moc_moi_sai,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?,'x')")
    .run(`${sbd}|${ma}`, sbd, ma, o.gap, o.sai ?? 0, o.khacPhuc ?? 0, o.moiSai ?? 0, o.chuaSai ?? 0, o.bac, o.mocMoi ?? null, o.mocMoi ?? null)
let dk = 0
const sk = (d: D1That, o: { sbd: string; qid: string; nguon: string; ma: string; kq: 0 | 1 | null; luc: string; dang?: string | null }) =>
  d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(`${o.nguon}|${o.ma}|${o.sbd}|${o.qid}|${++dk}`, o.sbd, o.qid, o.nguon, o.ma, 1, o.kq, 30, o.luc, new Date(Date.parse(o.luc) + 7 * 3_600_000).toISOString().slice(0, 10), o.dang ?? null)
const expSo = (d: D1That, sbd: string, khoa: string, maNguon: string, exp: number) =>
  d.sql.prepare("INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu) VALUES(?,?,'2026-09-20','cau',NULL,?,?,?,'x')").run(`${sbd}|${khoa}`, sbd, maNguon, exp, NOP)

/** Ca "C1" ĐÃ công bố, đề chuẩn 18/4/6, 8 em có điểm + tài khoản thử + em khoá + em đang làm; có ca trước đã công bố (P1, P0), ca trước CHƯA công bố (P2) và ca trước đã xoá (P3). */
const CA_C1: { sbd: string; ten: string; tong: number; i: number; ii: number; iii: number; sai: string[]; chon?: Record<string, string>; trong?: string[] }[] = [
  { sbd: 'S1', ten: 'An', tong: 9.5, i: 4.5, ii: 3.5, iii: 1.5, sai: [] },
  { sbd: 'S2', ten: 'Bình', tong: 8, i: 3.5, ii: 3, iii: 1.5, sai: ['I-1', 'II-1'] },
  { sbd: 'S3', ten: 'Chi', tong: 6.5, i: 3, ii: 2, iii: 1.5, sai: ['I-1', 'I-2', 'II-1'] },
  { sbd: 'S4', ten: 'Dũng', tong: 5, i: 2.5, ii: 2, iii: 0.5, sai: ['I-1', 'I-7', 'III-1'] },
  { sbd: 'S5', ten: 'Em', tong: 4.5, i: 2, ii: 2, iii: 0.5, sai: ['I-1', 'I-2', 'I-7', 'II-1', 'III-1'], chon: { 'I-1': 'C' }, trong: ['I-18'] },
  { sbd: 'S6', ten: 'Phúc', tong: 3, i: 1.5, ii: 1, iii: 0.5, sai: ['I-1', 'I-2', 'I-7', 'I-8', 'II-1', 'III-1', 'III-2'] },
  { sbd: 'S7', ten: 'Giang', tong: 10, i: 4.5, ii: 4, iii: 1.5, sai: [] },
  { sbd: 'S8', ten: 'Hà', tong: 0.5, i: 0.5, ii: 0, iii: 0, sai: ['I-1', 'I-2', 'I-3', 'I-7', 'I-8', 'II-1', 'III-1'] },
]
function truong(): D1That {
  const d = taoD1That()
  themKho(d)
  themCa(d, 'C1', { ten: 'Kiểm tra Este', lop: '12 - Tinh Hoa' })
  for (const e of CA_C1) themHs(d, e.sbd, e.ten)
  themHs(d, 'S9', 'Khoa'); themHs(d, '12121212', 'Tài khoản thử'); themHs(d, 'SK', 'Đã khoá', 'khoa')
  for (const e of CA_C1) {
    const lan = e.sbd === 'S3' ? 2 : 1
    themLuot(d, { ma: 'C1', sbd: e.sbd, lan, vao: e.sbd === 'S3' ? '2026-09-20T03:00:00.000Z' : VAO, nop: e.sbd === 'S1' ? '2026-09-20T02:32:10.000Z' : e.sbd === 'S3' ? '2026-09-20T03:30:00.000Z' : NOP, tong: e.tong, i: e.i, ii: e.ii, iii: e.iii })
    chamLuot(d, { ma: 'C1', sbd: e.sbd, lan, sai: e.sai, chon: e.chon, trong: e.trong })
  }
  // S3 làm HAI lượt: lượt 1 (điểm 1, SAI HẾT) không được vào số liệu lớp — chỉ lượt nộp mới nhất.
  themLuot(d, { ma: 'C1', sbd: 'S3', lan: 1, nop: '2026-09-20T02:20:00.000Z', tong: 1, i: 0.5, ii: 0.5, iii: 0 })
  chamLuot(d, { ma: 'C1', sbd: 'S3', lan: 1, sai: CHUAN.map(nhan) })
  // tài khoản thử (10 điểm) và em khoá (1 điểm): không vào MỌI số của lớp
  for (const [s, tong] of [['12121212', 10], ['SK', 1]] as const) { themLuot(d, { ma: 'C1', sbd: s, tong, i: 1, ii: 1, iii: 1 }); chamLuot(d, { ma: 'C1', sbd: s, sai: ['I-1'], chon: { 'I-1': 'A' } }) }
  themLuot(d, { ma: 'C1', sbd: 'S9', nop: null, tt: 'dang_lam' })
  // các ca trước
  themCa(d, 'P0'); themCa(d, 'P1'); themCa(d, 'P2', { congBo: 'khong' }); themCa(d, 'P3', { tt: 'da_xoa' })
  const truoc: [string, string, number, string][] = [
    ['P0', 'S2', 7, '2026-09-10T02:30:00.000Z'],
    ['P1', 'S1', 9, '2026-09-15T02:30:00.000Z'], ['P1', 'S2', 9.75, '2026-09-15T02:30:00.000Z'], ['P1', 'S3', 6.5, '2026-09-15T02:30:00.000Z'], ['P1', 'S4', 6.5, '2026-09-15T02:30:00.000Z'],
    ['P1', 'S6', 3.5, '2026-09-15T02:30:00.000Z'], ['P1', 'S8', 1, '2026-09-15T02:30:00.000Z'],
    ['P2', 'S5', 9, '2026-09-17T02:30:00.000Z'], ['P3', 'S7', 3, '2026-09-18T02:30:00.000Z'],
  ]
  for (const [ma, sbd, tong, nop] of truoc) themLuot(d, { ma, sbd, vao: nop.replace('02:30', '02:00'), nop, tong })
  return d
}
const gvCa = async (d: D1That, ma = 'C1') => (await gvBaoCaoCa(d.env, { maCa: ma }, NOW)) as any
const gvEm = async (d: D1That, sbd: string, ma = 'C1') => (await gvBaoCaoCaEm(d.env, { maCa: ma, sbd }, NOW)) as any
const khoaCon = (o: unknown, k: string): boolean => JSON.stringify(o).includes(`"${k}"`)
/** Đếm mọi truy vấn D1 (kể cả truy vấn của hàm dùng chung) + chặn mọi lệnh ghi. */
function theoDoi(d: D1That) {
  const cau: string[] = []
  const goc = d.env.DB.prepare.bind(d.env.DB)
  d.env.DB.prepare = ((q: string) => { cau.push(q); return goc(q) }) as typeof d.env.DB.prepare
  const thayDoi = () => Number((d.sql.prepare('SELECT total_changes() AS n').get() as { n: number }).n)
  return { cau, truoc: thayDoi(), thayDoi }
}

// ---------------------------------------------------------------- đầu vào ----------------------------------------------------------------
describe('kiểm tra đầu vào và ca không có', () => {
  it('thiếu maCa / sbd ⇒ lyDo thieu (không đụng D1)', async () => {
    const d = truong()
    const t = theoDoi(d)
    expect(await gvBaoCaoCa(d.env, {}, NOW)).toMatchObject({ ok: false, lyDo: 'thieu' })
    expect(await gvBaoCaoCa(d.env, { maCa: '  ' }, NOW)).toMatchObject({ ok: false, lyDo: 'thieu' })
    expect(await gvBaoCaoCaEm(d.env, { sbd: 'S1' }, NOW)).toMatchObject({ ok: false, lyDo: 'thieu' })
    expect(await gvBaoCaoCaEm(d.env, { maCa: 'C1' }, NOW)).toMatchObject({ ok: false, lyDo: 'thieu' })
    expect(await gvBaoCaoCaEm(d.env, { maCa: 'C1', sbd: '' }, NOW)).toMatchObject({ ok: false, lyDo: 'thieu' })
    expect(t.cau).toHaveLength(0)
  })
  it('ca không có hoặc đã xoá ⇒ lyDo khong_co_ca (cả hai lệnh)', async () => {
    const d = truong()
    themCa(d, 'CX', { tt: 'da_xoa' })
    for (const ma of ['KHONG-CO', 'CX']) {
      expect(await gvCa(d, ma)).toMatchObject({ ok: false, lyDo: 'khong_co_ca' })
      expect(await gvEm(d, 'S1', ma)).toMatchObject({ ok: false, lyDo: 'khong_co_ca' })
    }
  })
  it('-em: em chưa nộp (đang làm) hoặc không có lượt ⇒ chua_nop, đúng câu chữ của hợp đồng', async () => {
    const d = truong()
    expect(await gvEm(d, 'S9')).toEqual({ ok: false, lyDo: 'chua_nop', error: 'Em chưa nộp bài ca này' })
    expect(await gvEm(d, 'S-LA')).toEqual({ ok: false, lyDo: 'chua_nop', error: 'Em chưa nộp bài ca này' })
  })
})

// ---------------------------------------------------------------- tổng quan lớp ----------------------------------------------------------------
describe('/gv/bao-cao-ca — số liệu chung của lớp', () => {
  it('ca + congBo + tongQuan: soEm, tb, cao, thap, phổ điểm 10 khoảng (điểm 10 vào khoảng cuối)', async () => {
    const d = truong()
    const r = await gvCa(d)
    expect(r.ok).toBe(true)
    expect(r.serverNow).toBe(NOW)
    expect(r.ca).toEqual({ maCa: 'C1', tenCa: 'Kiểm tra Este', loai: 'thi', trangThai: 'mo', lop: '12 - Tinh Hoa' })
    // 8 em có điểm; KHÔNG tính 12121212 (10) và SK (1), S3 chỉ lượt 2 (6,5), S9 đang làm
    expect(r.tongQuan).toMatchObject({ soEm: 8, tb: 5.88, cao: 10, thap: 0.5 }) // (9,5+8+6,5+5+4,5+3+10+0,5)/8 = 5,875
    expect(r.tongQuan.phoDiem).toHaveLength(10)
    expect(r.tongQuan.phoDiem.map((x: any) => x.tu)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(r.tongQuan.phoDiem.map((x: any) => x.den)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(r.tongQuan.phoDiem.map((x: any) => x.so)).toEqual([1, 0, 0, 1, 1, 1, 1, 0, 1, 2]) // 0,5 | 3 | 4,5 | 5 | 6,5 | 8 | 9,5 và 10
    expect(r.tongQuan.phoDiem.reduce((a: number, x: any) => a + x.so, 0)).toBe(r.tongQuan.soEm)
  })
  it('congBo = ĐÚNG kết quả của docTrangThaiCongBo (một luật, hai đường)', async () => {
    const d = truong()
    const r = await gvCa(d)
    const t = (await docTrangThaiCongBo(d.env, ['C1'])).get('C1')!
    expect(r.congBo).toEqual({ congBo: t.congBo, daCongBo: t.daCongBo, soEmDaNop: t.soEmDaNop, soEmDaVao: t.soEmDaVao })
    expect(r.congBo).toEqual({ congBo: 'ngay', daCongBo: true, soEmDaNop: 11, soEmDaVao: 12 }) // 11 lượt da_nop (8 em + S3 lượt 1 + thử + khoá) + S9 đang làm; lượt của ca khác không tính
  })
  it('tài khoản thử và em bị khoá không xuất hiện ở BẤT KỲ khối nào của lớp', async () => {
    const d = truong()
    const r = await gvCa(d)
    const s = JSON.stringify(r)
    expect(s).not.toContain('12121212')
    expect(s).not.toContain('"SK"')
    expect(s).not.toContain('Tài khoản thử')
    expect(s).not.toContain('Đã khoá')
    expect(r.hocSinh.map((h: any) => h.sbd)).not.toContain('S9') // em đang làm chưa có điểm
  })
  it('mỗi em CHỈ lượt nộp MỚI NHẤT: lượt 1 của S3 (sai hết) không vào điểm, số câu, câu sai nhiều', async () => {
    const d = truong()
    const r = await gvCa(d)
    const s3 = r.hocSinh.find((h: any) => h.sbd === 'S3')
    expect(s3).toMatchObject({ tong: 6.5, thoiGianLamGiay: 1800, soCau: 28, soCauDung: 25 })
    const i1 = r.cauSaiNhieu.find((c: any) => c.qid === 'DE1-I-1')
    expect(i1).toMatchObject({ soEm: 8, soEmSai: 6 }) // nếu lượt 1 lọt vào: soEm 9, soEmSai 7
  })
})

describe('/gv/bao-cao-ca — chọn lượt và đáp án bỏ trống', () => {
  it('lượt ĐANG LÀM mới hơn không che điểm của lượt đã nộp; lượt chưa nộp không vào số liệu', async () => {
    const d = taoD1That()
    themCa(d, 'KL2'); themHs(d, 'H0', 'An'); themHs(d, 'H1', 'Bình')
    themLuot(d, { ma: 'KL2', sbd: 'H0', lan: 1, tong: 7 })
    themLuot(d, { ma: 'KL2', sbd: 'H0', lan: 2, nop: null, tt: 'dang_lam', tong: 9 }) // đang làm, điểm tạm 9 KHÔNG được tính
    themLuot(d, { ma: 'KL2', sbd: 'H1', lan: 1, tong: 5 })
    const r = await gvCa(d, 'KL2')
    expect(r.tongQuan).toMatchObject({ soEm: 2, tb: 6, cao: 7, thap: 5 })
    expect(r.hocSinh.find((h: any) => h.sbd === 'H0')).toMatchObject({ tong: 7 })
  })
  it('dapAnSaiNhieu chỉ tính đáp án em THẬT SỰ chọn: ô bỏ trống ("" hoặc "----") không thành "đáp án sai nhiều nhất"', async () => {
    const d = taoD1That()
    themCa(d, 'KT'); themKho(d, hinh(2, 1, 0), 'KT')
    const chon: [string, Record<string, string>][] = [['H0', { 'I-1': '', 'II-1': '----' }], ['H1', { 'I-1': '', 'II-1': '----' }], ['H2', { 'I-1': '', 'II-1': '----' }], ['H3', { 'I-1': 'A', 'II-1': 'DDSS' }], ['H4', { 'I-1': 'A', 'II-1': 'DDSS' }]]
    for (const [s, c] of chon) { themHs(d, s, s); themLuot(d, { ma: 'KT', sbd: s, tong: 4 }); chamLuot(d, { ma: 'KT', sbd: s, cau: hinh(2, 1, 0), de: 'KT', sai: ['I-1', 'II-1'], chon: c }) }
    const r = await gvCa(d, 'KT')
    const c1 = r.cauSaiNhieu.find((c: any) => c.qid === 'KT-I-1')
    expect(c1).toMatchObject({ soEmSai: 5, soEm: 5, dapAnSaiNhieu: { dapAn: 'A', soEm: 2 } }) // 3 ô trống không được đếm là một đáp án
    expect(r.cauSaiNhieu.find((c: any) => c.qid === 'KT-II-1').dapAnSaiNhieu).toEqual({ dapAn: 'DDSS', soEm: 2 })
    // toàn ô trống: không có đáp án sai nào được chọn ⇒ khoá dapAnSaiNhieu vắng
    d.sql.prepare("UPDATE chi_tiet_cau SET dap_an_chon = '' WHERE qid = 'KT-I-1'").run()
    expect((await gvCa(d, 'KT')).cauSaiNhieu.find((c: any) => c.qid === 'KT-I-1')).not.toHaveProperty('dapAnSaiNhieu')
  })
})

describe('/gv/bao-cao-ca — chưa chấm và làm tròn', () => {
  it('câu CHƯA CHẤM (dung_sai NULL) không tính là "sai": 3 em chưa chấm + 2 em sai ⇒ chưa đủ 3 em sai', async () => {
    const d = taoD1That()
    themCa(d, 'KN'); themKho(d, hinh(2, 0, 0), 'KN')
    for (const [s, sai, trong] of [['H0', [], ['I-1']], ['H1', [], ['I-1']], ['H2', [], ['I-1']], ['H3', ['I-1'], []], ['H4', ['I-1'], []]] as [string, string[], string[]][]) {
      themHs(d, s, s); themLuot(d, { ma: 'KN', sbd: s, tong: 5 }); chamLuot(d, { ma: 'KN', sbd: s, cau: hinh(2, 0, 0), de: 'KN', sai, trong })
    }
    expect(khoaCon(await gvCa(d, 'KN'), 'cauSaiNhieu')).toBe(false)
    expect(khoaCon(await gvCa(d, 'KN'), 'dangCaLopVap')).toBe(false)
  })
  it('phổ điểm xếp theo điểm ĐÃ LÀM TRÒN 2 chữ số (8,996 hiện 9 ⇒ khoảng [9,10]; 4,999 hiện 5 ⇒ [5,6))', async () => {
    const d = taoD1That()
    themCa(d, 'KR')
    ;[8.996, 4.999, 0.994].forEach((tong, i) => { themHs(d, `H${i}`, `H${i}`); themLuot(d, { ma: 'KR', sbd: `H${i}`, tong }) })
    const r = await gvCa(d, 'KR')
    expect(r.tongQuan.phoDiem.map((x: any) => x.so)).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 1])
    expect(r.tongQuan).toMatchObject({ cao: 9, thap: 0.99 })
  })
})

describe('/gv/bao-cao-ca — hocSinh và lần trước của CHÍNH em', () => {
  it('hocSinh: điểm giảm dần; diemTruoc/doi từ ca ĐÃ CÔNG BỐ liền trước (bỏ ca chưa công bố và ca đã xoá); thời gian làm; đúng/tổng câu', async () => {
    const d = truong()
    const r = await gvCa(d)
    expect(r.hocSinh.map((h: any) => h.sbd)).toEqual(['S7', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S8'])
    const theo = (s: string) => r.hocSinh.find((h: any) => h.sbd === s)
    expect(theo('S1')).toEqual({ sbd: 'S1', hoTen: 'An', tong: 9.5, diemTruoc: 9, doi: 0.5, thoiGianLamGiay: 1930, soCauDung: 28, soCau: 28 })
    expect(theo('S2')).toMatchObject({ tong: 8, diemTruoc: 9.75, doi: -1.75, soCauDung: 26 })
    expect(theo('S3')).toMatchObject({ diemTruoc: 6.5, doi: 0 })
    expect(theo('S4')).toMatchObject({ diemTruoc: 6.5, doi: -1.5, soCauDung: 25 })
    expect(theo('S5')).toMatchObject({ tong: 4.5, soCauDung: 22, soCau: 28 })
    expect(theo('S5')).not.toHaveProperty('diemTruoc') // ca trước của S5 (P2) CHƯA công bố ⇒ vắng
    expect(theo('S5')).not.toHaveProperty('doi')
    expect(theo('S7')).not.toHaveProperty('diemTruoc') // ca trước của S7 (P3) đã xoá ⇒ vắng
    expect(theo('S8')).toMatchObject({ diemTruoc: 1, doi: -0.5, soCauDung: 21 })
  })
  it('hocSinh: em không có bảng chấm thì không có soCau/soCauDung (không số 0 giả)', async () => {
    const d = truong()
    d.sql.prepare("DELETE FROM chi_tiet_cau WHERE sbd = 'S7'").run()
    const s7 = (await gvCa(d)).hocSinh.find((h: any) => h.sbd === 'S7')
    expect(s7).toMatchObject({ tong: 10 })
    expect(s7).not.toHaveProperty('soCau')
    expect(s7).not.toHaveProperty('soCauDung')
  })
})

describe('/gv/bao-cao-ca — emCanYY', () => {
  it('điểm DƯỚI 5 hoặc giảm ≥ 1,5 so với lần trước của CHÍNH em; xếp điểm thấp trước; chỉ số liệu', async () => {
    const d = truong()
    const r = await gvCa(d)
    // dưới 5: S8 (0,5), S6 (3), S5 (4,5) · giảm ≥ 1,5: S4 (5, giảm đúng 1,5), S2 (8, giảm 1,75) · S3 (giữ) và S1 (tăng) không vào
    expect(r.emCanYY).toEqual([
      { sbd: 'S8', hoTen: 'Hà', tong: 0.5, diemTruoc: 1, doi: -0.5 },
      { sbd: 'S6', hoTen: 'Phúc', tong: 3, diemTruoc: 3.5, doi: -0.5 },
      { sbd: 'S5', hoTen: 'Em', tong: 4.5 },
      { sbd: 'S4', hoTen: 'Dũng', tong: 5, diemTruoc: 6.5, doi: -1.5 },
      { sbd: 'S2', hoTen: 'Bình', tong: 8, diemTruoc: 9.75, doi: -1.75 },
    ])
  })
  it('biên: giảm 1,4 KHÔNG vào; điểm đúng 5 KHÔNG vào; 4,9 vào; giảm 1,5 vào', async () => {
    const d = taoD1That()
    themCa(d, 'D0'); themCa(d, 'D1')
    const em: [string, string, number, number | null][] = [['A', 'Ánh', 8, 9.75], ['B', 'Bảo', 5, 6.5], ['C', 'Cúc', 5, 6.4], ['D', 'Dương', 4.9, null], ['E', 'Em', 9, 9]]
    for (const [s, ten, tong, truoc] of em) {
      themHs(d, s, ten)
      themLuot(d, { ma: 'D1', sbd: s, tong })
      if (truoc !== null) themLuot(d, { ma: 'D0', sbd: s, nop: '2026-09-10T02:30:00.000Z', vao: '2026-09-10T02:00:00.000Z', tong: truoc })
    }
    const r = await gvCa(d, 'D1')
    expect(r.emCanYY.map((x: any) => x.sbd)).toEqual(['D', 'B', 'A'])
    expect(r.emCanYY[1]).toMatchObject({ tong: 5, diemTruoc: 6.5, doi: -1.5 })
  })
  it('tối đa 5 em (điểm thấp nhất trước)', async () => {
    const d = taoD1That()
    themCa(d, 'D1')
    ;[1, 2, 3, 4, 4.5, 4.9, 5, 9].forEach((tong, i) => { themHs(d, `H${i}`, `Em ${i}`); themLuot(d, { ma: 'D1', sbd: `H${i}`, tong }) })
    const r = await gvCa(d, 'D1')
    expect(TOI_DA_EM_CAN_Y).toBe(5)
    expect(r.emCanYY.map((x: any) => x.tong)).toEqual([1, 2, 3, 4, 4.5])
  })
  it('không em nào cần để ý ⇒ KHÔNG có khoá emCanYY', async () => {
    const d = taoD1That()
    themCa(d, 'D1')
    ;[6, 7, 8].forEach((tong, i) => { themHs(d, `H${i}`, `Em ${i}`); themLuot(d, { ma: 'D1', sbd: `H${i}`, tong }) })
    expect(khoaCon(await gvCa(d, 'D1'), 'emCanYY')).toBe(false)
  })
})

describe('/gv/bao-cao-ca — phanTb và toiDa', () => {
  it('đề chuẩn 18/4/6: toiDa 4,5 · 4 · 1,5; tong = số câu; dungTb = TB số câu đúng mỗi em; diemTb = TB điểm phần', async () => {
    const d = truong()
    const r = await gvCa(d)
    expect(r.tongQuan.phanTb).toEqual([
      { ma: 'I', diemTb: 2.75, dungTb: 15.75, tong: 18, toiDa: 4.5 }, // đúng: 18+17+16+16+14+14+18+13 = 126 câu / 8 em
      { ma: 'II', diemTb: 2.19, dungTb: 3.38, tong: 4, toiDa: 4 }, // 27 / 8 = 3,375 · điểm (3,5+3+2+2+2+1+4+0)/8 = 2,1875
      { ma: 'III', diemTb: 0.94, dungTb: 5.38, tong: 6, toiDa: 1.5 }, // 43 / 8 = 5,375 · điểm 7,5/8 = 0,9375
    ])
  })
  it('lượt 8/2/2: toiDa lấy từ quotaPhan của ĐÚNG đề ấy (kiểm bằng engine, không tính tay)', async () => {
    const d = taoD1That()
    themCa(d, 'K8')
    ;[7, 8, 9].forEach((tong, i) => { themHs(d, `H${i}`, `Em ${i}`); themLuot(d, { ma: 'K8', sbd: `H${i}`, tong, i: 3, ii: 2, iii: 1 }); chamLuot(d, { ma: 'K8', sbd: `H${i}`, cau: hinh(8, 2, 2), de: 'K8', sai: i === 0 ? ['I-1'] : [] }) })
    const q = quotaPhan({ I: 8, II: 2, III: 2 })
    const r = await gvCa(d, 'K8')
    expect(r.tongQuan.phanTb.map((p: any) => [p.ma, p.tong, p.toiDa])).toEqual([['I', 8, q.I / 100], ['II', 2, q.II / 100], ['III', 2, q.III / 100]])
    expect(q.I + q.II + q.III).toBe(1000)
  })
  it('ca thiếu một phần (18/4/0): trần điểm chia lại theo engine, phần III vắng khỏi phanTb', async () => {
    const d = taoD1That()
    themCa(d, 'K2')
    themHs(d, 'H0', 'An'); themLuot(d, { ma: 'K2', sbd: 'H0', tong: 8, i: 4, ii: 4 }); chamLuot(d, { ma: 'K2', sbd: 'H0', cau: hinh(18, 4, 0), de: 'K2' })
    const q = quotaPhan({ I: 18, II: 4, III: 0 })
    const r = await gvCa(d, 'K2')
    expect(q.III).toBe(0)
    expect(r.tongQuan.phanTb.map((p: any) => [p.ma, p.toiDa])).toEqual([['I', q.I / 100], ['II', q.II / 100]])
    expect(q.I / 100).not.toBe(4.5) // trần đổi vì thiếu phần III
  })
  it('các em làm hai dạng đề khác nhau: lấy dạng PHỔ BIẾN nhất; hoà số em ⇒ dạng nhiều câu hơn', async () => {
    const d = taoD1That()
    themCa(d, 'KH')
    const kieu: [string, Cau[]][] = [['H0', hinh(8, 2, 2)], ['H1', hinh(8, 2, 2)], ['H2', hinh(18, 4, 6)], ['H3', hinh(18, 4, 6)]]
    for (const [s, cau] of kieu) { themHs(d, s, s); themLuot(d, { ma: 'KH', sbd: s, tong: 7, i: 3, ii: 3, iii: 1 }); chamLuot(d, { ma: 'KH', sbd: s, cau, de: 'KH' }) }
    const r = await gvCa(d, 'KH')
    expect(r.tongQuan.phanTb.map((p: any) => p.tong)).toEqual([18, 4, 6]) // hoà 2–2 ⇒ 28 câu thắng 12 câu
    themLuot(d, { ma: 'KH', sbd: 'H4', tong: 6 }); themHs(d, 'H4', 'H4'); chamLuot(d, { ma: 'KH', sbd: 'H4', cau: hinh(8, 2, 2), de: 'KH' })
    expect((await gvCa(d, 'KH')).tongQuan.phanTb.map((p: any) => p.tong)).toEqual([8, 2, 2]) // 3 em 8/2/2 > 2 em 18/4/6
  })
})

describe('/gv/bao-cao-ca — dạng cả lớp vấp', () => {
  it('tiLeDung = câu đúng / tổng câu của dạng trong ca; soEmSai = em sai ≥ 1 câu; soEm = em có câu dạng ấy; tên dạng, vấp nhất trước', async () => {
    const d = truong()
    const r = await gvCa(d)
    expect(r.dangCaLopVap).toEqual([
      { ma: 'D.ESTE', ten: 'Thuỷ phân ester', tiLeDung: 0.8, soEmSai: 6, soEm: 8 }, // 64/80 câu đúng
      { ma: 'D.AMIN', ten: 'Tính chất amin', tiLeDung: 0.88, soEmSai: 4, soEm: 8 }, // 42/48 = 0,875
      { ma: 'D.TINH', ten: 'Tính hiệu suất', tiLeDung: 0.9, soEmSai: 4, soEm: 8 }, // 43/48
    ])
  })
  it('dạng không ai sai (Pin điện hoá) không vào danh sách; tổng câu các dạng không vượt tổng câu của ca', async () => {
    const d = truong()
    const r = await gvCa(d)
    expect(r.dangCaLopVap.map((x: any) => x.ma)).not.toContain('D.PIN')
    expect(JSON.stringify(r)).not.toContain('Pin điện hoá')
  })
  it('dạng chỉ có dưới 3 em sai hoặc dưới 30 % em làm sai ⇒ không tính là "cả lớp vấp"', async () => {
    const d = taoD1That()
    themCa(d, 'K3'); themKho(d, CHUAN, 'K3')
    for (const s of ['H0', 'H1']) { themHs(d, s, s); themLuot(d, { ma: 'K3', sbd: s, tong: 5 }); chamLuot(d, { ma: 'K3', sbd: s, de: 'K3', sai: ['I-1', 'I-2'] }) }
    expect(khoaCon(await gvCa(d, 'K3'), 'dangCaLopVap')).toBe(false) // 2 em sai < 3
    // 3 em sai trong 12 em làm (25 % < 30 %) vẫn chưa phải "cả lớp vấp"; 4/12 (33 %) thì có
    for (let i = 2; i < 12; i++) { themHs(d, `H${i}`, `H${i}`); themLuot(d, { ma: 'K3', sbd: `H${i}`, tong: 5 }); chamLuot(d, { ma: 'K3', sbd: `H${i}`, de: 'K3', sai: i === 2 ? ['I-1'] : [] }) }
    expect(khoaCon(await gvCa(d, 'K3'), 'dangCaLopVap')).toBe(false)
    d.sql.prepare("UPDATE chi_tiet_cau SET dung_sai = 0, dap_an_chon = 'A' WHERE sbd = 'H3' AND qid = 'K3-I-1'").run() // em thứ 4 sai
    const r = await gvCa(d, 'K3')
    expect(r.dangCaLopVap).toEqual([{ ma: 'D.ESTE', ten: 'Thuỷ phân ester', tiLeDung: 0.95, soEmSai: 4, soEm: 12 }]) // 12 em × 10 câu ESTE = 120; sai: H0 2 + H1 2 + H2 1 + H3 1 = 6 ⇒ 114/120
  })
})

describe('/gv/bao-cao-ca — cauSaiNhieu', () => {
  it('câu nhiều em sai nhất trước; soEm/soEmSai; dapAnSaiNhieu = đáp án SAI được chọn nhiều nhất + số em; dạng là TÊN; đề rút gọn từ kho', async () => {
    const d = truong()
    const r = await gvCa(d)
    expect(r.cauSaiNhieu.map((c: any) => c.qid)).toEqual(['DE1-I-1', 'DE1-II-1', 'DE1-I-2', 'DE1-I-7', 'DE1-III-1'])
    const c1 = r.cauSaiNhieu[0]
    expect(c1).toMatchObject({ qid: 'DE1-I-1', phan: 'I', soCau: 1, dang: 'Thuỷ phân ester', soEmSai: 6, soEm: 8, dapAnDung: 'B', dapAnSaiNhieu: { dapAn: 'A', soEm: 5 } }) // A×5, C×1
    expect(c1.de.length).toBeLessThanOrEqual(DE_TOI_DA_KY_TU)
    expect(c1.de.endsWith('…')).toBe(true)
    expect(r.cauSaiNhieu[1]).toMatchObject({ qid: 'DE1-II-1', phan: 'II', soEmSai: 5, dapAnDung: 'DSDS', dapAnSaiNhieu: { dapAn: 'DDSS', soEm: 5 }, de: 'Câu DE1-II-1: nội dung đề' })
    expect(r.cauSaiNhieu[4]).toMatchObject({ qid: 'DE1-III-1', dang: 'Tính hiệu suất', dapAnSaiNhieu: { dapAn: '3,0', soEm: 4 } })
    // chỉ câu có ≥ 3 em sai: I-3 (1 em), I-8 (2 em), III-2 (1 em) không vào
    for (const q of ['DE1-I-3', 'DE1-I-8', 'DE1-III-2']) expect(r.cauSaiNhieu.map((c: any) => c.qid)).not.toContain(q)
  })
  it('KHÔNG mã dạng thô ở trường hiển thị (dang là tên) và không lời giải / đáp án từng em', async () => {
    const d = truong()
    const r = await gvCa(d)
    for (const c of r.cauSaiNhieu) {
      expect(c.dang).not.toMatch(/^D\./)
      expect(Object.keys(c)).not.toContain('loiGiai')
    }
    expect(JSON.stringify(r)).not.toContain('LOIGIAI')
    expect(JSON.stringify(r.cauSaiNhieu)).not.toContain('D.ESTE')
  })
  it('CÂU TỰ LUẬN không bao giờ vào cauSaiNhieu: theo JSON kho (đáp án chữ nhiều từ) và theo mã câu (-VD-)', async () => {
    const d = truong()
    d.sql.prepare("UPDATE game_v2_question SET json = json_set(json, '$.correct', 'kết tinh lại') WHERE qid = 'DE1-III-1'").run() // kho: phần III đáp án chữ ⇒ tự luận
    let r = await gvCa(d)
    expect(r.cauSaiNhieu.map((c: any) => c.qid)).toEqual(['DE1-I-1', 'DE1-II-1', 'DE1-I-2', 'DE1-I-7'])
    expect(khoaCon(r.cauSaiNhieu, 'DE1-III-1')).toBe(false)
    // mã câu mang -VD-: 5 em cùng sai, vẫn không vào
    const d2 = taoD1That()
    themCa(d2, 'KV')
    for (const s of ['H0', 'H1', 'H2', 'H3', 'H4']) { themHs(d2, s, s); themLuot(d2, { ma: 'KV', sbd: s, tong: 6 }); chamLuot(d2, { ma: 'KV', sbd: s, cau: [{ p: 'I', so: 1, qid: 'KV-VD-1' }, { p: 'I', so: 2, qid: 'KV-I-2' }], sai: ['I-1', 'I-2'] }) }
    r = await gvCa(d2, 'KV')
    expect(r.cauSaiNhieu.map((c: any) => c.qid)).toEqual(['KV-I-2'])
  })
  it('kho câu không có câu: dòng vẫn có số liệu nhưng KHÔNG đề, KHÔNG tên dạng (vắng, không bịa)', async () => {
    const d = truong()
    d.sql.prepare('DELETE FROM game_v2_question').run()
    const r = await gvCa(d)
    expect(r.cauSaiNhieu[0]).toMatchObject({ qid: 'DE1-I-1', soEmSai: 6, soEm: 8 })
    expect(r.cauSaiNhieu[0]).not.toHaveProperty('de')
    expect(r.cauSaiNhieu[0]).not.toHaveProperty('dang')
    expect(khoaCon(r, 'dangCaLopVap')).toBe(false) // không dạng nào xác định được ⇒ vắng
  })
})

describe('/gv/bao-cao-ca — ca chưa công bố: thầy vẫn xem số, có congBo', () => {
  it("cong_bo 'khong': đủ số liệu + congBo.daCongBo = false", async () => {
    const d = truong()
    const truoc = await gvCa(d)
    d.sql.prepare("UPDATE ca SET cong_bo = 'khong' WHERE ma_ca = 'C1'").run()
    const r = await gvCa(d)
    expect(r.congBo).toMatchObject({ congBo: 'khong', daCongBo: false })
    expect({ ...r, congBo: 0 }).toEqual({ ...truoc, congBo: 0 }) // mọi số của lớp giữ nguyên
    expect(r.tongQuan.soEm).toBe(8)
  })
  it("cong_bo 'ca_lop_xong' mà còn em đang làm: chưa công bố, soEmDaNop < soEmDaVao, vẫn có số", async () => {
    const d = truong()
    d.sql.prepare("UPDATE ca SET cong_bo = 'ca_lop_xong' WHERE ma_ca = 'C1'").run()
    const r = await gvCa(d)
    const t = (await docTrangThaiCongBo(d.env, ['C1'])).get('C1')!
    expect(r.congBo).toEqual({ congBo: 'ca_lop_xong', daCongBo: false, soEmDaNop: t.soEmDaNop, soEmDaVao: t.soEmDaVao })
    expect(r.congBo.soEmDaNop).toBeLessThan(r.congBo.soEmDaVao)
    expect(r.tongQuan.tb).toBe(5.88)
    expect(r.cauSaiNhieu.length).toBeGreaterThan(0)
  })
  it("cong_bo 'ca_lop_xong' và ca đã đóng ⇒ daCongBo true", async () => {
    const d = truong()
    d.sql.prepare("UPDATE ca SET cong_bo = 'ca_lop_xong', trang_thai = 'dong' WHERE ma_ca = 'C1'").run()
    const r = await gvCa(d)
    expect(r.congBo.daCongBo).toBe(true)
    expect(r.ca.trangThai).toBe('dong')
  })
})

describe('/gv/bao-cao-ca — aiDaLo của lớp', () => {
  it('soCauSaiVaoLichOn / soEmCoLichOn (câu SAI của ca đang trong lịch ôn) và dangBaiTapKe (≥ 3 em yếu)', async () => {
    const d = truong()
    nkc(d, 'S5', 'DE1-I-1', { dang: 'D.ESTE', tt: 'moi_sai', moc: '2026-09-21' })
    nkc(d, 'S5', 'DE1-I-2', { dang: 'D.ESTE', tt: 'dang_on', moc: '2026-09-23' })
    nkc(d, 'S5', 'DE1-I-7', { dang: 'D.AMIN', tt: 'da_khac_phuc' }) // đã khắc phục ⇒ không tính
    nkc(d, 'S6', 'DE1-I-1', { dang: 'D.ESTE', tt: 'moi_sai', moc: null }) // thiếu mốc ⇒ không tính
    nkc(d, 'S5', 'DE1-I-3', { dang: 'D.ESTE', tt: 'moi_sai', moc: '2026-09-21' }) // câu ĐÚNG của S5 ở ca này ⇒ không tính
    for (const s of ['S2', 'S3', 'S5']) nkd(d, s, 'D.ESTE', { gap: 10, khacPhuc: 0, chuaSai: 5, moiSai: 1, bac: 0, mocMoi: '2026-09-21' })
    for (const s of ['S2', 'S3']) nkd(d, s, 'D.AMIN', { gap: 6, sai: 2, chuaSai: 2, khacPhuc: 1, moiSai: 1, bac: 0, mocMoi: '2026-09-21' }) // chỉ 2 em yếu ⇒ chưa đủ 3
    const r = await gvCa(d)
    expect(r.aiDaLo).toEqual({ soCauSaiVaoLichOn: 2, soEmCoLichOn: 1, dangBaiTapKe: [{ ma: 'D.ESTE', ten: 'Thuỷ phân ester', soEm: 3 }] })
    expect(khoaCon(r.aiDaLo, 'dangBuoiChuaXepSan')).toBe(false) // không làm: cần luật xếp của /gv/buoi-chua-de-xuat
  })
  it('chưa có hồ sơ lịch ôn ⇒ KHÔNG có khoá aiDaLo', async () => {
    const d = truong()
    expect(khoaCon(await gvCa(d), 'aiDaLo')).toBe(false)
  })
})

describe('/gv/bao-cao-ca — vắng đúng chỗ thiếu', () => {
  it('chưa em nào có điểm ⇒ chỉ ca + congBo (không tongQuan, không số 0 giả)', async () => {
    const d = taoD1That()
    themCa(d, 'K0'); themHs(d, 'H0', 'An'); themLuot(d, { ma: 'K0', sbd: 'H0', nop: null, tt: 'dang_lam' })
    themHs(d, 'H1', 'Bình'); themLuot(d, { ma: 'K0', sbd: 'H1', tong: null }) // nộp nhưng chưa chấm (tong NULL)
    const r = await gvCa(d, 'K0')
    expect(Object.keys(r).sort()).toEqual(['ca', 'congBo', 'ok', 'serverNow'])
    expect(r.congBo).toMatchObject({ soEmDaNop: 1, soEmDaVao: 2 })
  })
  it('ca không có bảng chấm (chi_tiet_cau): có điểm, KHÔNG phanTb / dangCaLopVap / cauSaiNhieu / aiDaLo / soCau', async () => {
    const d = truong()
    d.sql.prepare('DELETE FROM chi_tiet_cau').run()
    const r = await gvCa(d)
    expect(r.tongQuan).toMatchObject({ soEm: 8, tb: 5.88 })
    for (const k of ['phanTb', 'dangCaLopVap', 'cauSaiNhieu', 'aiDaLo', 'soCau', 'soCauDung']) expect(khoaCon(r, k), k).toBe(false)
    expect(r.emCanYY).toHaveLength(5) // điểm vẫn cho ra em cần để ý
  })
  it('ca không có tên lớp / loại: khoá vắng (không chuỗi rỗng)', async () => {
    const d = taoD1That()
    themCa(d, 'KL', { lop: null, loai: '' })
    themHs(d, 'H0', 'An'); themLuot(d, { ma: 'KL', sbd: 'H0', tong: 7 })
    const r = await gvCa(d, 'KL')
    expect(r.ca).toEqual({ maCa: 'KL', tenCa: 'Ca KL', trangThai: 'mo' })
  })
})

describe('/gv/bao-cao-ca — chi phí và độ an toàn', () => {
  it('≤ 12 truy vấn D1, chỉ SELECT, không ghi một dòng nào', async () => {
    const d = truong()
    nkc(d, 'S5', 'DE1-I-1', { dang: 'D.ESTE', tt: 'moi_sai', moc: '2026-09-21' })
    for (const s of ['S2', 'S3', 'S5']) nkd(d, s, 'D.ESTE', { gap: 10, khacPhuc: 0, chuaSai: 5, moiSai: 1, bac: 0, mocMoi: '2026-09-21' })
    const t = theoDoi(d)
    const r = await gvCa(d)
    expect(r.ok).toBe(true)
    expect(khoaCon(r, 'aiDaLo')).toBe(true) // đường dài nhất (đủ mọi khối) mới đáng đo
    expect(t.cau.length).toBeGreaterThan(0)
    expect(t.cau.length).toBeLessThanOrEqual(12)
    for (const q of t.cau) expect(q.trim(), q).toMatch(/^SELECT\b/i)
    expect(t.cau.some((q) => /^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i.test(q))).toBe(false)
    expect(t.thayDoi()).toBe(t.truoc)
    expect(d.soLenh.batch).toBe(0)
  })
  it('lỗi đọc bất kỳ truy vấn nào ⇒ {ok:false, lyDo:"loi_doc"} (không trả nửa vời)', async () => {
    const im = vi.spyOn(console, 'error').mockImplementation(() => {})
    for (const bang of ['chi_tiet_cau', 'game_v2_question', 'nam_kt_dang', 'FROM luot l JOIN ca c', 'FROM ca c WHERE']) {
      const d = truong()
      const goc = d.env.DB.prepare.bind(d.env.DB)
      d.env.DB.prepare = ((q: string) => { if (q.includes(bang)) throw new Error('D1_ERROR: hỏng giả'); return goc(q) }) as typeof d.env.DB.prepare
      const r = await gvBaoCaoCa(d.env, { maCa: 'C1' }, NOW)
      expect(r, bang).toMatchObject({ ok: false, lyDo: 'loi_doc' })
      expect(Object.keys(r).sort(), bang).toEqual(['error', 'lyDo', 'ok'])
    }
    im.mockRestore()
  })
})

// ---------------------------------------------------------------- báo cáo một em ----------------------------------------------------------------
describe('/gv/bao-cao-ca-em — ca, ketQua, phan', () => {
  it('ca + em + congBo + ketQua đếm ĐÚNG luật goiDemCau (đúng · sai · một phần · bỏ trống, cộng lại = soCau)', async () => {
    const d = truong()
    const r = await gvEm(d, 'S5')
    expect(r.ok).toBe(true)
    expect(r.ca).toEqual({ maCa: 'C1', tenCa: 'Kiểm tra Este', lanThu: 1, nopLuc: NOP, thoiGianPhut: 45, thoiGianLamGiay: 1800 })
    expect(r.em).toEqual({ sbd: 'S5', hoTen: 'Em' })
    expect(r.congBo).toMatchObject({ congBo: 'ngay', daCongBo: true })
    // S5: sai I-1, I-2, I-7, III-1 (4 câu sai) + II-1 'DDSS' (2/4 ý ⇒ một phần) + I-18 chưa chấm (NULL) ⇒ 28 − 6 = 22 đúng
    expect(r.ketQua).toEqual({ tong: 4.5, diemI: 2, diemII: 2, diemIII: 0.5, soCau: 28, soCauDung: 22, soCauSai: 4, soCauMotPhan: 1, soCauBoTrong: 1 })
    expect(r.ketQua.soCauDung + r.ketQua.soCauSai + r.ketQua.soCauMotPhan + r.ketQua.soCauBoTrong).toBe(r.ketQua.soCau)
  })
  it('phan: đúng/tổng đếm từ bảng chấm (không tổng cứng), motPhan, điểm phần, toiDa 4,5 · 4 · 1,5 của đề 18/4/6', async () => {
    const d = truong()
    const r = await gvEm(d, 'S5')
    expect(r.phan).toEqual([
      { ma: 'I', dung: 14, tong: 18, motPhan: 0, diem: 2, toiDa: 4.5 },
      { ma: 'II', dung: 3, tong: 4, motPhan: 1, diem: 2, toiDa: 4 },
      { ma: 'III', dung: 5, tong: 6, motPhan: 0, diem: 0.5, toiDa: 1.5 },
    ])
  })
  it('lượt 8/2/2: mỗi phần có toiDa = quotaPhan(đề của lượt)/100; phần không có câu bị bỏ; điểm phần vắng khi luot không có', async () => {
    const d = taoD1That()
    themCa(d, 'K8'); themHs(d, 'H0', 'An')
    themLuot(d, { ma: 'K8', sbd: 'H0', tong: 6, i: 3, ii: null, iii: 1 })
    chamLuot(d, { ma: 'K8', sbd: 'H0', cau: hinh(8, 2, 2), de: 'K8', sai: ['I-1'] })
    const q = quotaPhan({ I: 8, II: 2, III: 2 })
    const r = await gvEm(d, 'H0', 'K8')
    expect(r.phan.map((p: any) => [p.ma, p.tong, p.toiDa])).toEqual([['I', 8, q.I / 100], ['II', 2, q.II / 100], ['III', 2, q.III / 100]])
    expect(r.phan[1]).not.toHaveProperty('diem') // luot.diem_ii NULL ⇒ vắng
    expect(r.ketQua).not.toHaveProperty('diemII')
    // chỉ hai phần: trần chia lại
    const d2 = taoD1That()
    themCa(d2, 'K9'); themHs(d2, 'H0', 'An'); themLuot(d2, { ma: 'K9', sbd: 'H0', tong: 7 }); chamLuot(d2, { ma: 'K9', sbd: 'H0', cau: hinh(10, 3, 0), de: 'K9' })
    const q2 = quotaPhan({ I: 10, II: 3, III: 0 })
    const r2 = await gvEm(d2, 'H0', 'K9')
    expect(r2.phan.map((p: any) => [p.ma, p.toiDa])).toEqual([['I', q2.I / 100], ['II', q2.II / 100]])
  })
  it('hangTrongLop (chỉ lệnh thầy): hạng theo điểm ca, sĩ số = số em có điểm (không tính thử/khoá); điểm bằng nhau cùng hạng', async () => {
    const d = truong()
    expect((await gvEm(d, 'S5')).hangTrongLop).toEqual({ hang: 6, siSo: 8 })
    expect((await gvEm(d, 'S7')).hangTrongLop).toEqual({ hang: 1, siSo: 8 })
    const d2 = taoD1That()
    themCa(d2, 'KB')
    ;[['A', 7], ['B', 7], ['C', 6]].forEach(([s, tong]) => { themHs(d2, s as string, s as string); themLuot(d2, { ma: 'KB', sbd: s as string, tong: tong as number }) })
    expect((await gvEm(d2, 'A', 'KB')).hangTrongLop).toEqual({ hang: 1, siSo: 3 })
    expect((await gvEm(d2, 'B', 'KB')).hangTrongLop).toEqual({ hang: 1, siSo: 3 })
    expect((await gvEm(d2, 'C', 'KB')).hangTrongLop).toEqual({ hang: 3, siSo: 3 })
  })
  it('tài khoản thử được thầy xem thẳng nhưng không có hạng (không nằm trong lớp)', async () => {
    const d = truong()
    const r = await gvEm(d, '12121212')
    expect(r.ok).toBe(true)
    expect(r).not.toHaveProperty('hangTrongLop')
  })
  it('lanThu chọn đúng lượt: lượt 1 của S3 (sai hết) và lượt 2 (mới nhất) cho hai báo cáo khác nhau', async () => {
    const d = truong()
    const moi = (await baoCaoMotEm(d.env, { maCa: 'C1', sbd: 'S3', nowMs: NOW, chanCongBo: false, coExp: true, choThay: true })) as any
    const cu = (await baoCaoMotEm(d.env, { maCa: 'C1', sbd: 'S3', lanThu: 1, nowMs: NOW, chanCongBo: false, coExp: true, choThay: true })) as any
    expect(moi.ca.lanThu).toBe(2)
    expect(moi.ketQua).toMatchObject({ tong: 6.5, soCauDung: 25 })
    expect(cu.ca).toMatchObject({ lanThu: 1, thoiGianLamGiay: 1200 })
    expect(cu.ketQua).toMatchObject({ tong: 1, soCauDung: 0 })
    expect((await baoCaoMotEm(d.env, { maCa: 'C1', sbd: 'S3', lanThu: 9, nowMs: NOW, chanCongBo: false, coExp: true, choThay: true }))).toMatchObject({ ok: false, lyDo: 'chua_nop' })
  })
})

describe('/gv/bao-cao-ca-em — dang (tên, bậc, phát lại sổ)', () => {
  it('sổ của CHÍNH lượt: sự kiện `thi` của lượt 1 không thay được sổ của lượt 2 (ngoài khoảng vào → nộp của lượt xem)', async () => {
    const d = truong()
    for (const q of ['DE1-I-1', 'DE1-I-2', 'DE1-I-3']) sk(d, { sbd: 'S3', qid: q, nguon: 'thi', ma: 'C1', kq: 0, luc: '2026-09-20T02:20:00.000Z' }) // giờ nộp lượt 1
    const chung = { maCa: 'C1', sbd: 'S3', nowMs: NOW, chanCongBo: false, coExp: true, choThay: true }
    const l2 = (await baoCaoMotEm(d.env, chung)) as any
    const l1 = (await baoCaoMotEm(d.env, { ...chung, lanThu: 1 })) as any
    expect(l2.ca.lanThu).toBe(2)
    for (const x of l2.dang) expect(x).not.toHaveProperty('bacSau') // lượt 2 chưa có sổ
    expect(l1.ca.lanThu).toBe(1)
    expect(l1.dang.find((x: any) => x.ma === 'D.ESTE')).toMatchObject({ bacTruoc: 1, bacSau: 0, doiBac: 'xuong' }) // ba câu ESTE sai ⇒ 1 → 0
  })
  it('nhóm theo mã dạng, dạng vấp xếp trên, TÊN dạng (không mã trên trường hiển thị), tổng các dòng ≤ số câu', async () => {
    const d = truong()
    const r = await gvEm(d, 'S5')
    expect(r.dang).toEqual([
      { ma: 'D.ESTE', ten: 'Thuỷ phân ester', dung: 7, tong: 10 },
      { ma: 'D.AMIN', ten: 'Tính chất amin', dung: 5, tong: 6 },
      { ma: 'D.PIN', ten: 'Pin điện hoá', dung: 5, tong: 6 }, // I-18 chưa chấm ⇒ không tính đúng; ba dạng cùng 5/6 xếp theo mã
      { ma: 'D.TINH', ten: 'Tính hiệu suất', dung: 5, tong: 6 },
    ])
    expect(r.dang.reduce((a: number, x: any) => a + x.tong, 0)).toBeLessThanOrEqual(r.ketQua.soCau)
    for (const x of r.dang) expect(x.ten).not.toMatch(/^D\./)
  })
  it('bậc HIỆN TẠI lấy từ nam_kt_dang; không có hồ sơ thì không khoá bac', async () => {
    const d = truong()
    nkd(d, 'S5', 'D.ESTE', { gap: 10, bac: 0 })
    nkd(d, 'S5', 'D.AMIN', { gap: 6, bac: 2 })
    const r = await gvEm(d, 'S5')
    expect(r.dang.find((x: any) => x.ma === 'D.ESTE').bac).toBe(0)
    expect(r.dang.find((x: any) => x.ma === 'D.AMIN').bac).toBe(2)
    expect(r.dang.find((x: any) => x.ma === 'D.TINH')).not.toHaveProperty('bac')
  })
  it('bacTruoc/bacSau = PHÁT LẠI SỔ: sự kiện trước lượt vào / tới lượt nộp; sự kiện SAU khi nộp không tính; doiBac len|xuong|giu', async () => {
    const d = taoD1That()
    themCa(d, 'C5'); themHs(d, 'S9', 'Khoa'); themLuot(d, { ma: 'C5', sbd: 'S9', tong: 5 })
    chamLuot(d, { ma: 'C5', sbd: 'S9', cau: [{ p: 'I', so: 1, qid: 'DE5-I-1' }, { p: 'I', so: 2, qid: 'DE5-I-2' }, { p: 'I', so: 3, qid: 'DE5-I-3' }], sai: ['I-2'] })
    const dang: Record<string, string> = { 'DE5-I-1': 'D.X', 'DE5-I-2': 'D.Y', 'DE5-I-3': 'D.Z' }
    for (const [q, m] of Object.entries(dang)) nkc(d, 'S9', q, { dang: m, tt: 'chua_thay_sai' }) // hồ sơ câu (mã dạng) như hệ thật đã dựng từ sổ
    // trước ca: D.X từng SAI (bậc 1 → 0); D.Y đúng ở HAI ngày cho hai câu (bậc 1 → 2); D.Z chưa gặp
    sk(d, { sbd: 'S9', qid: 'CU-1', nguon: 'on_lai', ma: 'm1', kq: 0, luc: '2026-09-15T03:00:00.000Z', dang: 'D.X' })
    sk(d, { sbd: 'S9', qid: 'CU-2', nguon: 'on_lai', ma: 'm2', kq: 1, luc: '2026-09-16T03:00:00.000Z', dang: 'D.Y' })
    sk(d, { sbd: 'S9', qid: 'CU-3', nguon: 'on_lai', ma: 'm3', kq: 1, luc: '2026-09-17T03:00:00.000Z', dang: 'D.Y' })
    // đúng LÚC vào ca (ranh giới): KHÔNG thuộc "trước lượt vào" (luc < vào) — D.Z vẫn bậc 1 ở bacTruoc
    sk(d, { sbd: 'S9', qid: 'CU-5', nguon: 'on_lai', ma: 'm5', kq: 1, luc: VAO, dang: 'D.Z' })
    // chính ca (giờ nộp): X đúng (0 → 1 · len), Y sai (2 → 1 · xuong), Z đúng (1 → 2 · len)
    for (const [qid, kq] of [['DE5-I-1', 1], ['DE5-I-2', 0], ['DE5-I-3', 1]] as const) sk(d, { sbd: 'S9', qid, nguon: 'thi', ma: 'C5', kq, luc: NOP, dang: dang[qid]! })
    // SAU khi nộp: Y đúng thêm — chỉ ảnh hưởng bậc hiện tại, không ảnh hưởng bacSau
    sk(d, { sbd: 'S9', qid: 'CU-4', nguon: 'on_lai', ma: 'm4', kq: 1, luc: '2026-09-21T03:00:00.000Z', dang: 'D.Y' })
    nkd(d, 'S9', 'D.Y', { gap: 4, bac: 2 })
    const r = await gvEm(d, 'S9', 'C5')
    const theoMa = (m: string) => r.dang.find((x: any) => x.ma === m)
    expect(theoMa('D.X')).toMatchObject({ bacTruoc: 0, bacSau: 1, doiBac: 'len' })
    expect(theoMa('D.Y')).toMatchObject({ bacTruoc: 2, bacSau: 1, doiBac: 'xuong', bac: 2 }) // bậc hiện tại 2 ≠ bacSau 1
    expect(theoMa('D.Z')).toMatchObject({ bacTruoc: 1, bacSau: 2, doiBac: 'len' }) // dạng chưa từng gặp: bậc bắt đầu 1
    expect(r.tienBo.dangLenBac.map((x: any) => x.ma).sort()).toEqual(['D.X', 'D.Z'])
    expect(r.tienBo.dangLenBac[0]).toMatchObject({ tu: expect.any(Number), den: expect.any(Number) })
  })
  it('khớp phatLaiSuKien chạy độc lập trên cùng sổ (kho dạng làm bảng tra) — cả bacTruoc lẫn bacSau', async () => {
    const d = truong()
    // trước ca: S5 đúng hai câu ESTE ở hai ngày; trong ca: 28 sự kiện `thi` giờ nộp; sau ca: thêm một câu AMIN đúng
    sk(d, { sbd: 'S5', qid: 'DE1-I-3', nguon: 'on_lai', ma: 'a', kq: 1, luc: '2026-09-15T03:00:00.000Z' })
    sk(d, { sbd: 'S5', qid: 'DE1-I-4', nguon: 'on_lai', ma: 'b', kq: 1, luc: '2026-09-16T03:00:00.000Z' })
    for (const c of CHUAN) sk(d, { sbd: 'S5', qid: `DE1-${nhan(c)}`, nguon: 'thi', ma: 'C1', kq: CA_C1[4]!.sai.includes(nhan(c)) ? 0 : nhan(c) === 'I-18' ? null : 1, luc: NOP })
    sk(d, { sbd: 'S5', qid: 'DE1-I-9', nguon: 'on_lai', ma: 'c', kq: 1, luc: '2026-09-21T03:00:00.000Z' })
    const r = await gvEm(d, 'S5')
    const suKien = await docSuKienDoc(d.env, ['S5'])
    const tra = await traCuuTheoQid(d.env, [...new Set(suKien.map((e) => e.qid))])
    const bac = (ds: typeof suKien) => new Map(phatLaiSuKien(ds, tra).dang.map((x) => [x.maDang, x.bac]))
    const truoc = bac(suKien.filter((e) => Date.parse(e.luc) < Date.parse(VAO)))
    const sau = bac(suKien.filter((e) => Date.parse(e.luc) <= Date.parse(NOP)))
    expect(r.dang).toHaveLength(4)
    for (const x of r.dang) {
      const tu = truoc.get(x.ma) ?? 1
      const den = sau.get(x.ma) ?? 1
      expect(x, x.ma).toMatchObject({ bacTruoc: tu, bacSau: den, doiBac: den > tu ? 'len' : den < tu ? 'xuong' : 'giu' })
    }
    expect(r.dang.find((x: any) => x.ma === 'D.ESTE').bacTruoc).toBe(2) // hai câu ESTE đúng ở hai ngày ⇒ 1 → 2
    expect(r.dang.find((x: any) => x.ma === 'D.AMIN').bacTruoc).toBe(1) // chưa gặp (sự kiện I-9 SAU ca không tính)
  })
  it('sổ học KHÔNG có sự kiện của chính ca này ⇒ không bacTruoc/bacSau/doiBac (không giả "giữ bậc")', async () => {
    const d = truong()
    sk(d, { sbd: 'S5', qid: 'DE1-I-3', nguon: 'on_lai', ma: 'a', kq: 1, luc: '2026-09-15T03:00:00.000Z' }) // có sổ, nhưng không phải của ca C1
    sk(d, { sbd: 'S5', qid: 'DE1-I-1', nguon: 'thi', ma: 'C0', kq: 1, luc: '2026-09-20T02:10:00.000Z' }) // sự kiện `thi` của CA KHÁC (cùng câu, giờ nằm giữa vào và nộp) cũng không thay được sổ của C1
    const r = await gvEm(d, 'S5')
    expect(r.dang.length).toBeGreaterThan(0)
    for (const x of r.dang) for (const k of ['bacTruoc', 'bacSau', 'doiBac']) expect(x).not.toHaveProperty(k)
    expect(khoaCon(r, 'dangLenBac')).toBe(false)
  })
  it('tối đa 12 dòng dạng; dạng tên không biết vẫn có dòng nhưng KHÔNG khoá ten; câu không rõ dạng không vào dòng nào', async () => {
    const d = taoD1That()
    themCa(d, 'KD'); themHs(d, 'H0', 'An'); themLuot(d, { ma: 'KD', sbd: 'H0', tong: 6 })
    const cau: Cau[] = Array.from({ length: 16 }, (_, i) => ({ p: 'I' as Ph, so: i + 1, qid: `KD-I-${i + 1}` }))
    chamLuot(d, { ma: 'KD', sbd: 'H0', cau, sai: ['I-1'] })
    // 14 câu có dạng (D.M01..D.M14, có 2 dạng không tên), 2 câu KHÔNG rõ dạng
    for (let i = 0; i < 14; i++) nkc(d, 'H0', `KD-I-${i + 1}`, { dang: `D.M${String(i + 1).padStart(2, '0')}`, tt: 'chua_thay_sai' })
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('KD', 'KD-I-9', 'v', 'g', 'D.M09', JSON.stringify({ qid: 'KD-I-9', tenDang: '' }))
    for (let i = 1; i <= 14; i++) if (i !== 9 && i !== 10) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('KD', `KD-X-${i}`, 'v', `g${i}`, `D.M${String(i).padStart(2, '0')}`, JSON.stringify({ qid: `KD-X-${i}`, tenDang: `Dạng số ${i}` }))
    const r = await gvEm(d, 'H0', 'KD')
    expect(TOI_DA_DANG_EM).toBe(12)
    expect(r.dang).toHaveLength(12)
    expect(r.dang[0]).toMatchObject({ ma: 'D.M01', dung: 0, tong: 1 }) // dạng vấp (sai câu duy nhất) đứng đầu
    expect(r.dang.reduce((a: number, x: any) => a + x.tong, 0)).toBeLessThanOrEqual(14) // 2 câu không rõ dạng không vào dòng nào
    const d2 = taoD1That()
    themCa(d2, 'KD2'); themHs(d2, 'H0', 'An'); themLuot(d2, { ma: 'KD2', sbd: 'H0', tong: 6 })
    chamLuot(d2, { ma: 'KD2', sbd: 'H0', cau: [{ p: 'I', so: 1, qid: 'KD2-I-1' }], de: 'KD2' })
    nkc(d2, 'H0', 'KD2-I-1', { dang: 'D.LA', tt: 'chua_thay_sai' }) // mã dạng không có tên ở bất kỳ đâu
    const r2 = await gvEm(d2, 'H0', 'KD2')
    expect(r2.dang).toEqual([{ ma: 'D.LA', dung: 1, tong: 1 }])
  })
  it('dạng theo CHUYÊN ĐỀ khi kho không có câu: mã CD:<tên> ⇒ tên là phần sau CD:', async () => {
    const d = taoD1That()
    themCa(d, 'KC'); themHs(d, 'H0', 'An'); themLuot(d, { ma: 'KC', sbd: 'H0', tong: 6 })
    chamLuot(d, { ma: 'KC', sbd: 'H0', cau: [{ p: 'I', so: 1, qid: 'KC-I-1' }, { p: 'I', so: 2, qid: 'KC-I-2' }], sai: ['I-1'], chuyenDe: 'Este' })
    const r = await gvEm(d, 'H0', 'KC')
    expect(r.dang).toEqual([{ ma: 'CD:Este', ten: 'Este', dung: 1, tong: 2 }])
  })
})

describe('/gv/bao-cao-ca-em — cauCanXemLai', () => {
  it('câu SAI trước (theo phần, số câu), rồi câu ĐÚNG nhưng lâu (lâu nhất trước); đủ trường: đề, đáp án chọn/đúng, lời giải, giây, tbGiay, laDungNhungLau, ngày ôn lại', async () => {
    const d = truong()
    d.sql.prepare("UPDATE chi_tiet_cau SET giay = ? WHERE sbd = 'S5' AND qid = ?").run(200, 'DE1-I-3')
    d.sql.prepare("UPDATE chi_tiet_cau SET giay = ? WHERE sbd = 'S5' AND qid = ?").run(100, 'DE1-II-2')
    nkc(d, 'S5', 'DE1-I-1', { dang: 'D.ESTE', tt: 'moi_sai', moc: '2026-09-21' })
    nkc(d, 'S5', 'DE1-I-2', { dang: 'D.ESTE', tt: 'dang_on', moc: '2026-09-23' })
    nkc(d, 'S5', 'DE1-I-7', { dang: 'D.AMIN', tt: 'da_khac_phuc' }) // đã khắc phục ⇒ không có ngayOnLai
    const r = await gvEm(d, 'S5')
    expect(r.cauCanXemLai.map((c: any) => c.qid)).toEqual(['DE1-I-1', 'DE1-I-2', 'DE1-I-7', 'DE1-II-1', 'DE1-III-1', 'DE1-I-3', 'DE1-II-2'])
    const [i1, , i7] = r.cauCanXemLai
    expect(i1).toMatchObject({ qid: 'DE1-I-1', phan: 'I', soCau: 1, dapAnChon: 'C', dapAnDung: 'B', loiGiai: 'LOIGIAI-DE1-I-1', giay: 40, laDungNhungLau: false, ngayOnLai: '2026-09-21' })
    expect(i1.de.length).toBeLessThanOrEqual(DE_TOI_DA_KY_TU) // đề dài 400+ ký tự phải rút gọn
    expect(i1.tbGiay).toBe(40) // 8 em (không tính thử/khoá) đều 40 s ở câu này
    expect(r.cauCanXemLai[1]).toMatchObject({ ngayOnLai: '2026-09-23' })
    expect(i7).not.toHaveProperty('ngayOnLai')
    expect(r.cauCanXemLai[3]).toMatchObject({ qid: 'DE1-II-1', dapAnChon: 'DDSS', dapAnDung: 'DSDS', de: 'Câu DE1-II-1: nội dung đề' })
    expect(r.cauCanXemLai[5]).toMatchObject({ qid: 'DE1-I-3', giay: 200, laDungNhungLau: true, dapAnChon: 'B', tbGiay: 60 }) // (7 × 40 + 200) / 8; nếu lẫn thử/khoá thì 56
    expect(r.cauCanXemLai[6]).toMatchObject({ qid: 'DE1-II-2', giay: 100, laDungNhungLau: true, tbGiay: 48 }) // (7 × 40 + 100) / 8 = 47,5
  })
  it('tối đa 8 câu, câu SAI luôn trước câu lâu (S6 có 7 sai + 3 lâu ⇒ 7 sai + câu lâu nhất)', async () => {
    const d = truong()
    for (const [q, g] of [['DE1-I-10', 300], ['DE1-I-11', 200], ['DE1-I-12', 150]] as const) d.sql.prepare("UPDATE chi_tiet_cau SET giay = ? WHERE sbd = 'S6' AND qid = ?").run(g, q)
    const r = await gvEm(d, 'S6')
    expect(TOI_DA_CAU_XEM_LAI).toBe(8)
    expect(r.cauCanXemLai).toHaveLength(8)
    expect(r.cauCanXemLai.slice(0, 7).every((c: any) => c.laDungNhungLau === false)).toBe(true)
    expect(r.cauCanXemLai[7]).toMatchObject({ qid: 'DE1-I-10', laDungNhungLau: true, giay: 300 })
  })
  it('không câu sai và không câu lâu ⇒ KHÔNG có khoá cauCanXemLai', async () => {
    const d = truong()
    expect(khoaCon(await gvEm(d, 'S1'), 'cauCanXemLai')).toBe(false)
  })
  it('câu ĐÚNG không lâu (< 2 × trung vị) không vào; chỉ có 1 câu có giây thì không có câu "lâu" (giây = trung vị)', async () => {
    const d = truong()
    d.sql.prepare("UPDATE chi_tiet_cau SET giay = 79 WHERE sbd = 'S1' AND qid = 'DE1-I-3'").run() // 79 < 80
    expect(khoaCon(await gvEm(d, 'S1'), 'cauCanXemLai')).toBe(false)
    d.sql.prepare("UPDATE chi_tiet_cau SET giay = 80 WHERE sbd = 'S1' AND qid = 'DE1-I-3'").run() // đúng 2 × 40
    expect((await gvEm(d, 'S1')).cauCanXemLai.map((c: any) => c.qid)).toEqual(['DE1-I-3'])
  })
  it('tbGiay CHỈ khi ≥ 5 em có số (không lộ từng em): 4 em ⇒ vắng, thêm em thứ 5 ⇒ hiện; tài khoản thử không góp', async () => {
    const d = taoD1That()
    themCa(d, 'KG'); themKho(d, hinh(2, 0, 0), 'KG')
    const them = (s: string, tong = 6) => { themHs(d, s, s); themLuot(d, { ma: 'KG', sbd: s, tong }); chamLuot(d, { ma: 'KG', sbd: s, cau: hinh(2, 0, 0), de: 'KG', sai: s === 'H0' ? ['I-1'] : [] }) }
    for (const s of ['H0', 'H1', 'H2', 'H3']) them(s)
    themHs(d, '12121212', 'Thử'); themLuot(d, { ma: 'KG', sbd: '12121212', tong: 6 }); chamLuot(d, { ma: 'KG', sbd: '12121212', cau: hinh(2, 0, 0), de: 'KG' })
    expect(SAN_EM_TB_GIAY).toBe(5)
    let r = await gvEm(d, 'H0', 'KG')
    expect(r.cauCanXemLai[0]).toMatchObject({ qid: 'KG-I-1', giay: 40 })
    expect(r.cauCanXemLai[0]).not.toHaveProperty('tbGiay') // 4 em thật + 1 tài khoản thử (không tính)
    them('H4')
    r = await gvEm(d, 'H0', 'KG')
    expect(r.cauCanXemLai[0].tbGiay).toBe(40)
  })
  it('câu TỰ LUẬN (kho ghi đáp án chữ; mã -VD-) không vào cauCanXemLai và lời giải của chúng KHÔNG lộ', async () => {
    const d = truong()
    d.sql.prepare("UPDATE game_v2_question SET json = json_set(json, '$.correct', 'kết tinh lại') WHERE qid = 'DE1-III-1'").run()
    d.sql.prepare("UPDATE chi_tiet_cau SET qid = 'DE1-VD-9' WHERE sbd = 'S5' AND qid = 'DE1-II-1'").run() // mã mục dạy học / tự luận
    const r = await gvEm(d, 'S5')
    const ds = r.cauCanXemLai.map((c: any) => c.qid)
    expect(ds).not.toContain('DE1-III-1')
    expect(ds).not.toContain('DE1-VD-9')
    expect(JSON.stringify(r)).not.toContain('LOIGIAI-DE1-III-1')
    expect(ds).toEqual(['DE1-I-1', 'DE1-I-2', 'DE1-I-7'])
  })
  it('kho câu không có câu: vẫn liệt kê câu sai nhưng KHÔNG de / loiGiai (vắng); đáp án chọn lúc bỏ trống cũng vắng', async () => {
    const d = truong()
    d.sql.prepare('DELETE FROM game_v2_question').run()
    d.sql.prepare("UPDATE chi_tiet_cau SET dap_an_chon = '----' WHERE sbd = 'S5' AND qid = 'DE1-II-1'").run()
    const r = await gvEm(d, 'S5')
    expect(r.cauCanXemLai.length).toBeGreaterThan(0)
    for (const c of r.cauCanXemLai) for (const k of ['de', 'loiGiai']) expect(c).not.toHaveProperty(k)
    expect(r.cauCanXemLai.find((c: any) => c.qid === 'DE1-II-1')).not.toHaveProperty('dapAnChon')
    expect(deRutGon({ text: 'a  b\n c' })).toBe('a b c')
    expect(deRutGon(null)).toBe('')
    expect(Array.from(deRutGon({ text: 'é'.repeat(500) })).length).toBe(DE_TOI_DA_KY_TU)
  })
})

describe('/gv/bao-cao-ca-em — truoc, tienBo, aiDaLo', () => {
  it('truoc = ca ĐÃ CÔNG BỐ liền trước của CHÍNH em; doi 2 chữ số; ca chưa công bố / đã xoá không tính; ca đầu ⇒ vắng', async () => {
    const d = truong()
    const r = await gvEm(d, 'S2')
    expect(r.truoc).toEqual({ maCa: 'P1', tenCa: 'Ca P1', nopLuc: '2026-09-15T02:30:00.000Z', tong: 9.75, doi: -1.75 })
    expect(khoaCon(await gvEm(d, 'S5'), 'truoc')).toBe(false) // ca trước của S5 chưa công bố
    expect(khoaCon(await gvEm(d, 'S7'), 'truoc')).toBe(false) // ca trước của S7 đã xoá
  })
  it('tienBo.diem: các ca đã công bố của em, cũ → mới, GỒM ca này (ngày VN); dangLenBac vắng khi không có sổ', async () => {
    const d = truong()
    const r = await gvEm(d, 'S2')
    expect(r.tienBo).toEqual({ diem: [{ ngay: '2026-09-10', diem: 7, maCa: 'P0' }, { ngay: '2026-09-15', diem: 9.75, maCa: 'P1' }, { ngay: '2026-09-20', diem: 8, maCa: 'C1' }] })
  })
  it('tienBo.diem tối đa 5 ca gần nhất (cũ → mới, kết thúc ở ca này)', async () => {
    const d = taoD1That()
    themHs(d, 'H0', 'An')
    for (let i = 1; i <= 7; i++) { themCa(d, `Q${i}`); themLuot(d, { ma: `Q${i}`, sbd: 'H0', tong: i, vao: `2026-09-0${i}T02:00:00.000Z`, nop: `2026-09-0${i}T02:30:00.000Z` }) }
    const r = await gvEm(d, 'H0', 'Q7')
    expect(r.tienBo.diem.map((x: any) => x.maCa)).toEqual(['Q3', 'Q4', 'Q5', 'Q6', 'Q7'])
    const cu = await gvEm(d, 'H0', 'Q4') // xem ca cũ: tiến bộ dừng ở ca ấy, không lẫn ca mới hơn
    expect(cu.tienBo.diem.map((x: any) => x.maCa)).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
    expect(cu.truoc).toMatchObject({ maCa: 'Q3', tong: 3, doi: 1 })
  })
  it('aiDaLo của em: cauSaiVaoLichOn, ngayOnGanNhat, soCauOnNgayMai (kể cả câu ngoài ca), dangBaiTapKe (dạng yếu), expDaCong; thầy thêm dangUuTien + ngayOnLai', async () => {
    const d = truong()
    nkc(d, 'S5', 'DE1-I-1', { dang: 'D.ESTE', tt: 'moi_sai', moc: '2026-09-21' })
    nkc(d, 'S5', 'DE1-I-2', { dang: 'D.ESTE', tt: 'dang_on', moc: '2026-09-23' })
    nkc(d, 'S5', 'DE1-I-7', { dang: 'D.AMIN', tt: 'da_khac_phuc' })
    nkc(d, 'S5', 'DE9-I-1', { dang: 'D.ESTE', tt: 'moi_sai', moc: '2026-09-22' }) // ngoài ca này, mốc ≤ ngày mai
    nkc(d, 'S5', 'DE9-I-2', { dang: 'D.ESTE', tt: 'dang_on', moc: '2026-09-25' }) // mốc sau ngày mai
    nkd(d, 'S5', 'D.ESTE', { gap: 10, khacPhuc: 1, chuaSai: 4, moiSai: 2, bac: 0, mocMoi: '2026-09-21' }) // 5/10 < 0,7 ⇒ yếu
    nkd(d, 'S5', 'D.AMIN', { gap: 6, khacPhuc: 3, chuaSai: 3, bac: 1 }) // 6/6 ⇒ không yếu
    expSo(d, 'S5', 'cau|a', 'C1', 10); expSo(d, 'S5', 'diem|C1', 'C1', 15); expSo(d, 'S5', 'cau|b', 'CA-KHAC', 100)
    const r = await gvEm(d, 'S5')
    expect(r.aiDaLo).toEqual({
      cauSaiVaoLichOn: 2, ngayOnGanNhat: '2026-09-21', soCauOnNgayMai: 3,
      dangBaiTapKe: [{ ma: 'D.ESTE', ten: 'Thuỷ phân ester' }], expDaCong: 25,
      dangUuTien: [{ ma: 'D.ESTE', ten: 'Thuỷ phân ester' }], ngayOnLai: { ngay: '2026-09-21', soCau: 1 },
    })
  })
  it('không có số thật ⇒ từng trường aiDaLo vắng; không EXP ⇒ không expDaCong; toàn bộ rỗng ⇒ không khoá aiDaLo', async () => {
    const d = truong()
    expect(khoaCon(await gvEm(d, 'S5'), 'aiDaLo')).toBe(false)
    nkc(d, 'S5', 'DE1-I-1', { dang: 'D.ESTE', tt: 'moi_sai', moc: '2026-09-21' })
    const r = await gvEm(d, 'S5')
    expect(Object.keys(r.aiDaLo).sort()).toEqual(['cauSaiVaoLichOn', 'ngayOnGanNhat', 'ngayOnLai', 'soCauOnNgayMai'])
  })
})

describe('bộ dựng chung baoCaoMotEm (cho /hs và /ph về sau)', () => {
  const tuyChon = { maCa: 'C1', sbd: 'S5', nowMs: NOW }
  it('ca CHƯA công bố + chanCongBo: CHỈ ca + congBo — không một điểm / đáp án / lời giải / dạng nào (kể cả trong JSON)', async () => {
    const d = truong()
    d.sql.prepare("UPDATE ca SET cong_bo = 'ca_lop_xong' WHERE ma_ca = 'C1'").run()
    const t = theoDoi(d)
    const r = (await baoCaoMotEm(d.env, { ...tuyChon, chanCongBo: true, coExp: true, choThay: false })) as any
    expect(Object.keys(r).sort()).toEqual(['ca', 'congBo', 'ok', 'serverNow'])
    expect(r.congBo).toMatchObject({ congBo: 'ca_lop_xong', daCongBo: false })
    const s = JSON.stringify(r)
    for (const dau of ['LOIGIAI', 'DSDS', '"tong"', 'diemI', 'ketQua', 'phan"', 'dang"', 'cauCanXemLai', 'aiDaLo', 'tienBo', 'D.ESTE', '2,5']) expect(s, dau).not.toContain(dau)
    expect(t.cau.length).toBeLessThanOrEqual(2) // dừng sớm: chỉ đọc ca + lượt
  })
  it('ca đã công bố + chanCongBo: đủ báo cáo; coExp false ⇒ KHÔNG BAO GIỜ có expDaCong (phụ huynh); choThay false ⇒ không em, không hangTrongLop', async () => {
    const d = truong()
    nkc(d, 'S5', 'DE1-I-1', { dang: 'D.ESTE', tt: 'moi_sai', moc: '2026-09-21' })
    expSo(d, 'S5', 'cau|a', 'C1', 10)
    const ph = (await baoCaoMotEm(d.env, { ...tuyChon, chanCongBo: true, coExp: false, choThay: false })) as any
    expect(ph.ok).toBe(true)
    expect(ph.ketQua.soCau).toBe(28)
    expect(khoaCon(ph, 'expDaCong')).toBe(false)
    expect(khoaCon(ph, 'em')).toBe(false)
    expect(khoaCon(ph, 'hangTrongLop')).toBe(false)
    expect(khoaCon(ph, 'dangUuTien')).toBe(false)
    const hs = (await baoCaoMotEm(d.env, { ...tuyChon, chanCongBo: true, coExp: true, choThay: false })) as any
    expect(hs.aiDaLo.expDaCong).toBe(10)
    expect(khoaCon(hs, 'hangTrongLop')).toBe(false)
    // cùng dữ liệu (ba lệnh cùng bộ dựng): bỏ expDaCong thì HS = PH
    const boExp = (o: any) => ({ ...o, aiDaLo: { ...o.aiDaLo, expDaCong: undefined } })
    expect(JSON.parse(JSON.stringify(boExp(hs)))).toEqual(JSON.parse(JSON.stringify(boExp(ph))))
  })
  it('lệnh thầy KHÔNG chặn: ca chưa công bố vẫn ra báo cáo đầy đủ + congBo.daCongBo false', async () => {
    const d = truong()
    d.sql.prepare("UPDATE ca SET cong_bo = 'khong' WHERE ma_ca = 'C1'").run()
    const r = await gvEm(d, 'S5')
    expect(r.congBo).toMatchObject({ congBo: 'khong', daCongBo: false })
    expect(r.ketQua.soCau).toBe(28)
    expect(r.cauCanXemLai.length).toBeGreaterThan(0)
    expect(r.hangTrongLop).toEqual({ hang: 6, siSo: 8 })
  })
})

describe('/gv/bao-cao-ca-em — vắng đúng chỗ thiếu', () => {
  it('lượt có điểm nhưng KHÔNG bảng chấm: chỉ điểm — không soCau*, phan, dang, cauCanXemLai, aiDaLo (JSON không có khoá)', async () => {
    const d = truong()
    d.sql.prepare("DELETE FROM chi_tiet_cau WHERE sbd = 'S2'").run()
    nkd(d, 'S2', 'D.ESTE', { gap: 10, khacPhuc: 0, chuaSai: 5, moiSai: 1, bac: 0, mocMoi: '2026-09-21' })
    const t = theoDoi(d)
    const r = await gvEm(d, 'S2')
    expect(r.ketQua).toEqual({ tong: 8, diemI: 3.5, diemII: 3, diemIII: 1.5 })
    for (const k of ['soCau', 'soCauDung', 'phan', 'dang', 'cauCanXemLai', 'aiDaLo', 'dangLenBac']) expect(khoaCon(r, k), k).toBe(false)
    expect(r.truoc).toMatchObject({ maCa: 'P1' }) // điểm ca trước vẫn có
    expect(r.hangTrongLop).toBeDefined()
    expect(t.cau.some((q) => q.includes('nam_kt_') || q.includes('su_kien_hoc'))).toBe(false) // không đọc hồ sơ / sổ vô ích
  })
  it('lượt chưa chấm (tong NULL) và chưa có ca trước: chỉ ca + congBo + hạng vắng — không truoc, không tienBo, không ketQua', async () => {
    const d = taoD1That()
    themCa(d, 'K0'); themHs(d, 'H0', 'An'); themLuot(d, { ma: 'K0', sbd: 'H0', tong: null })
    const r = await gvEm(d, 'H0', 'K0')
    expect(Object.keys(r).sort()).toEqual(['ca', 'congBo', 'em', 'ok', 'serverNow'])
  })
  it('ca thiếu mốc vào ⇒ không thoiGianLamGiay; ca không đặt phút ⇒ không thoiGianPhut', async () => {
    const d = taoD1That()
    themCa(d, 'K0'); d.sql.prepare("UPDATE ca SET thoi_gian_phut = NULL WHERE ma_ca = 'K0'").run()
    themHs(d, 'H0', 'An'); themLuot(d, { ma: 'K0', sbd: 'H0', tong: 5, vao: '' })
    const r = await gvEm(d, 'H0', 'K0')
    expect(r.ca).toEqual({ maCa: 'K0', tenCa: 'Ca K0', lanThu: 1, nopLuc: NOP })
  })
})

describe('/gv/bao-cao-ca-em — chi phí và độ an toàn', () => {
  it('≤ 12 truy vấn D1 ở đường dài nhất (đủ mọi khối), chỉ SELECT, không ghi', async () => {
    const d = truong()
    themCa(d, 'P4'); themLuot(d, { ma: 'P4', sbd: 'S5', tong: 5, vao: '2026-09-16T02:00:00.000Z', nop: '2026-09-16T02:30:00.000Z' }) // ca trước ĐÃ công bố ⇒ có `truoc`
    nkc(d, 'S5', 'DE1-I-1', { dang: 'D.ESTE', tt: 'moi_sai', moc: '2026-09-21' })
    nkd(d, 'S5', 'D.ESTE', { gap: 10, khacPhuc: 1, chuaSai: 4, moiSai: 2, bac: 0, mocMoi: '2026-09-21' })
    expSo(d, 'S5', 'cau|a', 'C1', 10)
    sk(d, { sbd: 'S5', qid: 'DE1-I-1', nguon: 'thi', ma: 'C1', kq: 0, luc: NOP })
    const t = theoDoi(d)
    const r = await gvEm(d, 'S5')
    for (const k of ['ketQua', 'phan', 'dang', 'cauCanXemLai', 'aiDaLo', 'tienBo', 'truoc', 'hangTrongLop']) expect(r, k).toHaveProperty(k)
    expect(t.cau.length).toBeGreaterThan(0)
    expect(t.cau.length).toBeLessThanOrEqual(12)
    for (const q of t.cau) expect(q.trim(), q).toMatch(/^SELECT\b/i)
    expect(t.thayDoi()).toBe(t.truoc)
    expect(d.soLenh.batch).toBe(0)
  })
  it('lỗi đọc bất kỳ truy vấn nào ⇒ {ok:false, lyDo:"loi_doc"} (không trả nửa vời)', async () => {
    const im = vi.spyOn(console, 'error').mockImplementation(() => {})
    for (const bang of ['FROM chi_tiet_cau WHERE', 'FROM chi_tiet_cau c', 'game_v2_question', 'nam_kt_cau', 'nam_kt_dang', 'su_kien_hoc', 'exp_so', 'FROM luot l JOIN ca c', 'FROM ca c WHERE', 'FROM luot l LEFT JOIN']) {
      const d = truong()
      const goc = d.env.DB.prepare.bind(d.env.DB)
      d.env.DB.prepare = ((q: string) => { if (q.includes(bang)) throw new Error('D1_ERROR: hỏng giả'); return goc(q) }) as typeof d.env.DB.prepare
      const r = await gvBaoCaoCaEm(d.env, { maCa: 'C1', sbd: 'S5' }, NOW)
      expect(r, bang).toMatchObject({ ok: false, lyDo: 'loi_doc' })
      expect(Object.keys(r).sort(), bang).toEqual(['error', 'lyDo', 'ok'])
    }
    im.mockRestore()
  })
  it('hằng số hợp đồng: dòng dạng ≤ 12, câu cần xem lại ≤ 8', () => {
    expect(TOI_DA_DANG_EM).toBe(12)
    expect(TOI_DA_CAU_XEM_LAI).toBe(8)
  })
})
