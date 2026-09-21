// @vitest-environment node
// `POST /gv/bang-tin` (Bảng tin của thầy bản 3, docs/hop-dong-bang-tin-v3-2109.md): MỘT lệnh ĐỌC-CHỈ, ≤ 12 truy vấn, số liệu chỉ tính TỪ MỐC `cau_hinh.bang_tin_tu`.
// Khoá: cần mã bí mật · không ghi một byte · biên mốc (04:59:59Z không đếm, 05:00:00Z đếm) ở MỌI nguồn · ngưỡng từng khối · chỗ thiếu dữ liệu VẮNG (không bịa) · thiếu bảng ⇒ khối vắng + lyDoThieu.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { chuHanBangTin, docMocBangTin } from '../server/src/gv-bang-tin'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { gio } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())

const MOC = '2026-09-21T05:00:00.000Z' // 12:00 trưa 21/09 giờ VN
const T = (s: string): string => new Date(`${s}+07:00`).toISOString()
const goi = (d: D1That, thay = true) => goiWorker(worker, d.env, '/gv/bang-tin', {}, thay)
const dat = (s: string) => gio(new Date(`${s}+07:00`))
const themHs = (d: D1That, sbd: string, hoTen: string, lop = '12', tenLop: string | null = null) =>
  d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,'mk','x')").run(sbd, hoTen, lop, tenLop)
const datMoc = (d: D1That, v: string | null = MOC) => { if (v) d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bang_tin_tu',?,'x')").run(v) }
let dem = 0
/** Ghi `sai` lượt sai + `dung` lượt đúng của em ở dạng `dang`, mỗi lượt một câu khác nhau, tại thời điểm `luc` (ISO). */
const sk = async (d: D1That, sbd: string, sai: number, dung: number, luc: string, dang = 'D1') => {
  const ev = [...Array(sai).fill(0), ...Array(dung).fill(1)] as (0 | 1)[]
  await ghiSuKien(d.env, ev.map((k) => ({ nguon: 'on_lai' as const, maNguon: 'M1', sbd, qid: `Q${++dem}`, lan: 1, ketQua: k, luc, maDang: dang, giay: 20 })))
}
const themBai = (d: D1That, ma: string, giao: string, han: string, o: { xoa?: number; caNhan?: number; ten?: string } = {}) =>
  d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,giao_luc,han_nop,so_cau,da_xoa,cap_nhat_luc,ca_nhan) VALUES(?,?,?,?,?,10,?,'x',?)").run(ma, 'Riêng', o.ten ?? 'DE1', giao, han, o.xoa ?? 0, o.caNhan ?? 1)
const themBaiEm = (d: D1That, ma: string, sbd: string, o: { nop?: string | null; soChang?: number; xong?: number; chot?: string | null; dapAn?: string | null } = {}) =>
  d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten,so_cau,nop_luc,so_chang,lo_da_xong,chot_luc,dap_an_json) VALUES(?,?,?,?,10,?,?,?,?,?)")
    .run(`${ma}|${sbd}`, ma, sbd, `Em ${sbd}`, o.nop ?? null, o.soChang ?? 5, o.xong ?? 0, o.chot ?? null, o.dapAn ?? null)
function theoDoiGhi(d: D1That): string[] {
  const ghi: string[] = []
  const goc = d.env.DB.prepare.bind(d.env.DB)
  d.env.DB.prepare = ((q: string) => {
    if (/^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i.test(q)) ghi.push(q.trim().slice(0, 60))
    return goc(q)
  }) as typeof d.env.DB.prepare
  return ghi
}
const EM = Array.from({ length: 12 }, (_, i) => `1200${String(i + 1).padStart(2, '0')}`) // 120001 … 120012
/** Trường: 12 em (6 Lớp Thường + 6 Tinh Hoa), tài khoản thử 12121212 (không được tính); mốc đã ghi. Giờ giả 21/09 13:00 VN. */
function truong(luc = '2026-09-21T13:00:00', moc: string | null = MOC): D1That {
  dat(luc)
  const d = taoD1That()
  EM.forEach((s, i) => themHs(d, s, `Em ${s}`, '12', i < 6 ? null : '12 - Tinh Hoa'))
  themHs(d, '12121212', 'Tài khoản thử')
  datMoc(d, moc)
  return d
}

describe('hàm thuần', () => {
  it('docMocBangTin: ISO hợp lệ ⇒ dùng; vắng / hỏng / không phải chuỗi ⇒ 00:00 hôm nay và tuDangAp = false', () => {
    expect(docMocBangTin(MOC, '2026-09-22')).toEqual({ tuMs: Date.parse(MOC), tuDangAp: true })
    for (const v of [undefined, null, '', 'rác', 5, '2026-09-21', {}]) expect(docMocBangTin(v, '2026-09-22'), String(v)).toEqual({ tuMs: Date.parse('2026-09-22T00:00:00+07:00'), tuDangAp: false })
  })
  it('chuHanBangTin: "12:00 trưa nay" · "12:00 trưa mai (Thứ Tư 23/09)" · "12:00 Thứ Năm 24/09"', () => {
    const nay = Date.parse('2026-09-22T10:00:00+07:00')
    expect(chuHanBangTin(T('2026-09-22T15:00:00'), nay)).toBe('15:00 chiều nay')
    expect(chuHanBangTin(T('2026-09-23T12:00:00'), nay)).toBe('12:00 trưa mai (Thứ Tư 23/09)')
    expect(chuHanBangTin(T('2026-09-24T23:59:00'), nay)).toBe('23:59 Thứ Năm 24/09')
    expect(chuHanBangTin('rác', nay)).toBe('chưa rõ')
  })
})

describe('khoá chung', () => {
  it('không mã bí mật ⇒ từ chối; có mã ⇒ ok, ≤ 12 truy vấn, KHÔNG câu lệnh ghi nào; đầu trang trả tu / tuHomNay / capNhatLuc', async () => {
    const d = truong()
    expect((await goi(d, false)).ok).toBe(false)
    const ghi = theoDoiGhi(d)
    const r = await goi(d)
    expect(r).toMatchObject({ ok: true, ngay: '2026-09-21', tu: MOC, tuHomNay: MOC, tuDangAp: true, capNhatLuc: T('2026-09-21T13:00:00') })
    expect(r.soTruyVan).toBeLessThanOrEqual(12)
    expect(ghi).toEqual([])
  })
  it('vắng khoá mốc ⇒ tuDangAp false, mốc = 00:00 hôm nay; mốc CŨ hơn hôm nay ⇒ tuHomNay = 00:00 hôm nay (tu vẫn là mốc cấu hình)', async () => {
    const a = await goi(truong('2026-09-22T10:00:00', null))
    expect(a).toMatchObject({ tuDangAp: false, tu: T('2026-09-22T00:00:00'), tuHomNay: T('2026-09-22T00:00:00') })
    const b = await goi(truong('2026-09-23T10:00:00'))
    expect(b).toMatchObject({ tuDangAp: true, tu: MOC, tuHomNay: T('2026-09-23T00:00:00') })
  })
  it('trường trống: nhip.soCau = 0 (không tiLeDung), mọi danh sách rỗng, sucKhoe vẫn có mức', async () => {
    dat('2026-09-21T13:00:00')
    const d = taoD1That()
    const r = await goi(d)
    expect(r).toMatchObject({ ok: true, nhip: { soEmHoc: 0, tongEm: 0, soCau: 0, soCauDung: 0 }, baiTap: [], tienBo: [], canDeY: { ds: [], conLai: 0 }, dangVap: [], mayDaLam: [] })
    expect(r.nhip).not.toHaveProperty('tiLeDung')
    expect(r.nhip).not.toHaveProperty('homQua')
    expect(['xanh', 'vang', 'do']).toContain(r.sucKhoe.muc)
  })
})

describe('MỐC: biên đúng ở mọi nguồn (04:59:59Z không đếm, 05:00:00Z đếm)', () => {
  it('sổ học: lượt 04:59:59Z không đếm, 05:00:00Z đếm (nhip, soEmHoc, tiLeDung)', async () => {
    const d = truong()
    await sk(d, EM[0]!, 1, 0, '2026-09-21T04:59:59.000Z') // 11:59:59 VN — trước mốc
    await sk(d, EM[1]!, 0, 1, '2026-09-21T05:00:00.000Z') // 12:00:00 VN — đúng mốc
    await sk(d, EM[2]!, 1, 0, '2026-09-21T05:00:01.000Z')
    const r = await goi(d)
    expect(r.nhip).toMatchObject({ soEmHoc: 2, soCau: 2, soCauDung: 1, tiLeDung: 0.5 })
  })
  it('bài tập: lọc theo NGÀY của mốc (giao trước 00:00 ngày mốc không hiện; giao lúc 10:48 sáng cùng ngày, trước mốc 12:00, VẪN hiện); nhắc tự động gui_luc 04:59:59Z không đếm', async () => {
    const d = truong()
    themBai(d, 'B-TRUOC', T('2026-09-20T23:59:59.999'), T('2026-09-24T12:00:00')); themBaiEm(d, 'B-TRUOC', EM[0]!) // giao trước ngày mốc
    themBai(d, 'B-SANG', T('2026-09-21T00:00:00'), T('2026-09-24T12:00:00')); themBaiEm(d, 'B-SANG', EM[2]!) // đúng 00:00 ngày mốc: hiện
    themBai(d, 'B-DUNG', T('2026-09-21T10:48:00'), T('2026-09-24T12:00:00')); themBaiEm(d, 'B-DUNG', EM[0]!); themBaiEm(d, 'B-DUNG', EM[1]!) // 10:48 sáng, TRƯỚC mốc 12:00: hiện
    const nhac = (id: string, sbd: string, luc: string) => d.sql.prepare("INSERT INTO canh_bao_thay(id,ma_btvn,sbd,ngay,ten_btvn,han_nop,loi_em,loi_ph,trang_thai_em,gui_luc,moc,gui_ph,ph_nhom) VALUES(?,?,?,'2026-09-21','x','x','a','b','chua_mo',?,'M1',1,?)").run(id, 'B-DUNG', sbd, luc, `${sbd}|2026-09-21`)
    nhac('n1', EM[0]!, '2026-09-21T04:59:59.000Z'); nhac('n2', EM[1]!, '2026-09-21T05:00:00.000Z')
    const r = await goi(d)
    expect((r.baiTap as { maBtvn: string }[]).map((b) => b.maBtvn).sort()).toEqual(['B-DUNG', 'B-SANG'])
    expect(r.baiTap.find((b: { maBtvn: string }) => b.maBtvn === 'B-DUNG').nhac).toMatchObject({ soEm: 1, soPhuHuynh: 1 })
    expect(r.mayDaLam).toEqual(expect.arrayContaining([expect.objectContaining({ loai: 'nhac_nop_bai', so: 1, soPhuHuynh: 1 })]))
  })
  it('hồ sơ nắm kiến thức: luc_cuoi 04:59:59Z không đếm, 05:00:00Z đếm (tiến bộ nhất, câu về lịch ôn lại)', async () => {
    const d = truong()
    const kt = (q: string, sbd: string, tt: string, luc: string) => d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,trang_thai,luc_cuoi,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,nguon_cuoi,cap_nhat_luc) VALUES(?,?,?,?,?,1,1,0,0,0,'on_lai','x')").run(`${sbd}|${q}`, sbd, q, tt, luc)
    kt('K1', EM[0]!, 'da_khac_phuc', '2026-09-21T04:59:59.000Z')
    kt('K2', EM[1]!, 'da_khac_phuc', '2026-09-21T05:00:00.000Z')
    kt('K3', EM[2]!, 'moi_sai', '2026-09-21T04:59:59.000Z')
    kt('K4', EM[3]!, 'moi_sai', '2026-09-21T05:00:00.000Z')
    const r = await goi(d)
    expect(r.tienBo).toEqual([expect.objectContaining({ loai: 'tien_bo_nhat', sbd: EM[1], so: 1 })])
    expect(r.mayDaLam).toEqual(expect.arrayContaining([expect.objectContaining({ loai: 'on_lai', so: 1 })]))
  })
})

describe('nhip', () => {
  it('soEmHoc / tongEm (bỏ tài khoản thử) / tiLeDung 3 chữ số; homQua CHỈ khi cả ngày hôm qua ≥ mốc', async () => {
    const d = truong('2026-09-23T10:00:00')
    await sk(d, EM[0]!, 1, 2, T('2026-09-23T09:00:00'))
    await sk(d, '12121212', 5, 0, T('2026-09-23T09:00:00')) // tài khoản thử: bỏ
    await sk(d, EM[1]!, 2, 1, T('2026-09-22T09:00:00')) // hôm qua (22/09 ≥ mốc)
    await sk(d, EM[2]!, 0, 3, T('2026-09-22T09:30:00'))
    const r = await goi(d)
    expect(r.nhip).toMatchObject({ soEmHoc: 1, tongEm: 12, soCau: 3, soCauDung: 2, tiLeDung: 0.667, homQua: { soEmHoc: 2, soCau: 6, tiLeDung: 0.667 } })
    // mốc 21/09 12:00: ngày 21/09 chỉ có nửa ngày ⇒ sáng 22/09 KHÔNG có homQua
    const e = truong('2026-09-22T10:00:00')
    await sk(e, EM[0]!, 0, 3, T('2026-09-21T13:00:00')); await sk(e, EM[0]!, 0, 2, T('2026-09-22T08:00:00'))
    expect((await goi(e)).nhip).not.toHaveProperty('homQua')
  })
})

describe('baiTap', () => {
  it('trạng thái em (đã nộp / chưa mở / đang làm), chặng trung bình, tên lớp đa số, nhắc tự động (không tính tin tay), lượt kế; bài xoá và bài quá hạn > 1 ngày không hiện; xếp hạn gần trước', async () => {
    const d = truong()
    themBai(d, 'B1', T('2026-09-21T12:30:00'), T('2026-09-24T12:00:00'))
    themBaiEm(d, 'B1', EM[0]!, { nop: T('2026-09-21T13:00:00'), soChang: 4, xong: 4, chot: T('2026-09-21T12:40:00') }) // đã nộp
    themBaiEm(d, 'B1', EM[1]!, { soChang: 4, xong: 2, chot: T('2026-09-21T12:40:00') }) // đang làm, xong 2/4 chặng
    themBaiEm(d, 'B1', EM[2]!, { soChang: 4, xong: 1, chot: T('2026-09-21T12:50:00') }) // đang làm, xong 1
    themBaiEm(d, 'B1', EM[6]!, { soChang: 0 }) // Tinh Hoa, chưa mở (bài thường: không đáp án)
    themBaiEm(d, 'B1', EM[7]!, { soChang: 0, dapAn: '{"Q1":"A"}' }) // đang làm (có đáp án)
    themBaiEm(d, 'B1', EM[3]!, { soChang: 4 }) // chưa mở (chưa chốt)
    d.sql.prepare("UPDATE btvn_em SET thu_hoi = 1 WHERE sbd = ?").run(EM[3]) // đã thu hồi: không tính
    themBai(d, 'B2', T('2026-09-21T12:10:00'), T('2026-09-22T12:00:00')); themBaiEm(d, 'B2', EM[0]!) // hạn gần hơn ⇒ đứng trước
    themBai(d, 'B-XOA', T('2026-09-21T12:10:00'), T('2026-09-24T12:00:00'), { xoa: 1 }); themBaiEm(d, 'B-XOA', EM[0]!)
    themBai(d, 'B-CU', T('2026-09-21T12:10:00'), T('2026-09-20T11:00:00')); themBaiEm(d, 'B-CU', EM[0]!) // quá hạn 1 ngày + 1 giờ ở 21/09 13:00 ⇒ không hiện
    d.sql.prepare("INSERT INTO canh_bao_thay(id,ma_btvn,sbd,ngay,ten_btvn,han_nop,loi_em,loi_ph,trang_thai_em,gui_luc,moc,gui_ph,ph_nhom) VALUES('a','B1',?,'2026-09-21','x','x','a','b','chua_mo',?,'M1',0,NULL)").run(EM[1], T('2026-09-21T12:45:00'))
    d.sql.prepare("INSERT INTO canh_bao_thay(id,ma_btvn,sbd,ngay,ten_btvn,han_nop,loi_em,loi_ph,trang_thai_em,gui_luc,moc,gui_ph,ph_nhom) VALUES('b','B1',?,'2026-09-21','x','x','a','b','chua_mo',?,'tay',0,NULL)").run(EM[2], T('2026-09-21T12:46:00'))
    const r = await goi(d)
    const bai = r.baiTap as Record<string, unknown>[]
    expect(bai.map((b) => b.maBtvn)).toEqual(['B2', 'B1'])
    const b1 = bai[1]!
    expect(b1).toMatchObject({ tong: 6 - 1, chuaMo: 1, dangLam: 3, daNop: 1, tenLop: '12 - Lớp Thường', nhieuLop: true, quaHan: false, hanNop: T('2026-09-24T12:00:00') })
    expect(b1.chang).toEqual({ tbDaXong: 2.3, tong: 4, soEm: 3 }) // (4 + 2 + 1) / 3 em đã chốt = 2,33 ⇒ 2,3
    expect(b1.nhac).toMatchObject({ soEm: 1, soPhuHuynh: 0 }) // tin tay của thầy KHÔNG phải nhắc tự động
    expect((b1.nhac as { luotKe: string }).luotKe).toBe(T('2026-09-21T13:30:00'))
  })
  it('cờ nhắc tắt ⇒ không có luotKe; bài thường không có khoá chang', async () => {
    const d = truong()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('canh_bao_tu_dong','{\"bat\":false}','x')").run()
    themBai(d, 'B1', T('2026-09-21T12:30:00'), T('2026-09-24T12:00:00'), { caNhan: 0 }); themBaiEm(d, 'B1', EM[0]!, { soChang: 0 })
    const b = ((await goi(d)).baiTap as Record<string, unknown>[])[0]!
    expect(b.nhac).not.toHaveProperty('luotKe')
    expect(b).not.toHaveProperty('chang')
  })
})

describe('tienBo (mỗi bục một em, chỉ khi có số)', () => {
  it('cham_nhat cần ≥ 5 lượt (4 thì vắng); ben_bi cần ≥ 2 ngày liên tiếp mỗi ngày ≥ 5 lượt; tiến bộ nhất = nhiều câu làm đúng lại', async () => {
    const d = truong('2026-09-23T10:00:00')
    await sk(d, EM[0]!, 0, 4, T('2026-09-23T09:00:00')) // 4 lượt: chưa đủ
    expect(((await goi(d)).tienBo as unknown[])).toEqual([])
    await sk(d, EM[1]!, 1, 8, T('2026-09-23T09:00:00')) // 9 lượt hôm nay
    await sk(d, EM[1]!, 0, 5, T('2026-09-22T09:00:00')) // hôm qua đúng 5 ⇒ chuỗi 2 ngày
    await sk(d, EM[2]!, 0, 5, T('2026-09-23T09:00:00')); await sk(d, EM[2]!, 0, 4, T('2026-09-22T09:00:00')) // hôm qua 4 ⇒ chuỗi 1
    d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,trang_thai,luc_cuoi,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,nguon_cuoi,cap_nhat_luc) VALUES('a',?,'K1','da_khac_phuc',?,1,1,0,0,0,'on_lai','x'),('b',?,'K2','da_khac_phuc',?,1,1,0,0,0,'on_lai','x'),('c',?,'K3','da_khac_phuc',?,1,1,0,0,0,'on_lai','x')")
      .run(EM[3], T('2026-09-23T08:00:00'), EM[3], T('2026-09-23T08:10:00'), EM[4], T('2026-09-23T08:20:00'))
    const tb = (await goi(d)).tienBo as Record<string, unknown>[]
    expect(tb).toEqual([
      expect.objectContaining({ loai: 'cham_nhat', sbd: EM[1], so: 9, chu: '9 câu đã làm hôm nay', tenLop: '12 - Lớp Thường' }),
      expect.objectContaining({ loai: 'tien_bo_nhat', sbd: EM[3], so: 2 }),
      expect.objectContaining({ loai: 'ben_bi_nhat', sbd: EM[1], so: 2, chu: '2 ngày liên tiếp làm từ 5 câu' }),
    ])
  })
})

describe('canDeY (lý do luôn là SỐ; ≤ 5 + conLai)', () => {
  it('sai_nhieu: ≥ 4 lượt ở một dạng và sai ≥ 60 % (biên 3/5 có; 2/4 không; 3 lượt không); tên dạng không mã', async () => {
    const d = truong()
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DEA', 'DEA-I-1', 'v1', 'G', 'ESTE.X', JSON.stringify({ tenDang: 'Thuỷ phân este' }))
    await sk(d, EM[0]!, 3, 2, T('2026-09-21T13:00:00'), 'ESTE.X') // 3/5 = 60 % ⇒ có (biên)
    await sk(d, EM[1]!, 2, 2, T('2026-09-21T13:00:00'), 'ESTE.X') // 2/4 = 50 % ⇒ không
    await sk(d, EM[2]!, 3, 0, T('2026-09-21T13:00:00'), 'ESTE.X') // 3 lượt (< 4) ⇒ không
    await sk(d, EM[3]!, 4, 0, T('2026-09-21T13:00:00'), 'ESTE.X') // 4/4 ⇒ có
    const r = await goi(d)
    expect(r.canDeY.ds.map((e: { sbd: string }) => e.sbd)).toEqual([EM[3], EM[0]]) // tỉ lệ sai giảm dần
    expect(r.canDeY.ds[1].lyDo).toEqual([{ loai: 'sai_nhieu', chu: 'Sai 3/5 câu dạng Thuỷ phân este hôm nay', so: 3, tong: 5 }])
    expect(r.canDeY.conLai).toBe(0)
  })
  it('chua_mo_bai: chưa mở bài còn ≤ 24 giờ tới hạn (hạn > 24 giờ không tính); qua_han: chưa nộp bài quá hạn ≤ 1 ngày; nhiều lý do đứng trước; conLai', async () => {
    const d = truong()
    themBai(d, 'B-SAP', T('2026-09-21T12:10:00'), T('2026-09-22T12:00:00'), { ten: 'DE1' }) // hạn 23 giờ nữa
    themBai(d, 'B-XA', T('2026-09-21T12:10:00'), T('2026-09-22T14:00:00')) // hạn 25 giờ nữa
    themBai(d, 'B-QUA', T('2026-09-21T12:10:00'), T('2026-09-21T12:30:00')) // đã quá hạn 30 phút (giao trước hạn)
    for (const e of EM.slice(0, 7)) { themBaiEm(d, 'B-SAP', e, { soChang: 4 }); themBaiEm(d, 'B-XA', e, { soChang: 4 }) }
    themBaiEm(d, 'B-QUA', EM[0]!, { soChang: 4 }); themBaiEm(d, 'B-QUA', EM[1]!, { soChang: 4, nop: T('2026-09-21T12:20:00') })
    themBaiEm(d, 'B-XA', EM[9]!, { soChang: 4 }) // chỉ có bài hạn xa ⇒ không thành "cần để ý"
    await sk(d, EM[0]!, 4, 1, T('2026-09-21T13:00:00'), 'D9') // EM[0]: quá hạn + sai nhiều + chưa mở ⇒ 3 lý do
    const r = await goi(d)
    const ds = r.canDeY.ds as { sbd: string; lyDo: { loai: string; chu: string }[] }[]
    expect(ds).toHaveLength(5)
    expect(r.canDeY.conLai).toBe(2) // 7 em chưa mở bài sát hạn (EM[0..6])
    expect(ds[0]!.sbd).toBe(EM[0])
    expect(ds[0]!.lyDo.map((l) => l.loai)).toEqual(['qua_han', 'sai_nhieu', 'chua_mo_bai'])
    expect(ds[0]!.lyDo[0]!.chu).toMatch(/^Chưa nộp bài «.+», đã quá hạn 12:30 trưa nay$/)
    expect(ds[0]!.lyDo[2]!.chu).toMatch(/^Chưa mở bài «.+», hạn 12:00 trưa mai \(Thứ Ba 22\/09\)$/)
    expect(ds.slice(1).every((e) => e.lyDo.length === 1 && e.lyDo[0]!.loai === 'chua_mo_bai')).toBe(true)
    expect(ds.map((e) => e.sbd)).not.toContain(EM[9]) // hạn xa hơn 24 giờ
  })
})

describe('dangVap (dạng cả lớp đang vấp, 3 ngày gần nhất, không trước mốc)', () => {
  it('em vấp = ≥ 2 lượt và sai ≥ 50 %; dạng hiện khi ≥ 3 em vấp; soEmGap = em có ≥ 1 lượt; lượt ngoài 3 ngày không tính (biên ngày thứ 3 có, ngày thứ 4 không)', async () => {
    const d = truong('2026-09-26T10:00:00') // mốc 21/09; 3 ngày gần nhất = 24–26/09
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DEA', 'DEA-I-1', 'v1', 'G', 'ESTE.X', JSON.stringify({ tenDang: 'Xà phòng hoá' }))
    for (const e of EM.slice(0, 3)) await sk(d, e, 1, 1, T('2026-09-25T09:00:00'), 'ESTE.X') // 3 em vấp 1/2 = 50 %
    await sk(d, EM[3]!, 0, 3, T('2026-09-25T09:00:00'), 'ESTE.X') // gặp nhưng không vấp
    await sk(d, EM[4]!, 2, 0, T('2026-09-23T09:00:00'), 'ESTE.X') // 3 ngày trước (23/09): NGOÀI cửa sổ 24–26/09
    await sk(d, EM[5]!, 1, 0, T('2026-09-25T09:00:00'), 'ESTE.X') // 1 lượt sai (100 %) nhưng chưa đủ 2 lượt ⇒ gặp, không vấp
    await sk(d, EM[6]!, 2, 0, T('2026-09-24T00:00:00'), 'ESTE.X') // ĐÚNG ngày đầu của cửa sổ (24/09 00:00 VN) ⇒ tính: vấp
    for (const e of EM.slice(0, 2)) await sk(d, e, 2, 0, T('2026-09-26T09:00:00'), 'D2') // chỉ 2 em vấp D2 ⇒ ẩn
    const r = await goi(d)
    expect(r.dangVap).toEqual([{ ma: 'ESTE.X', ten: 'Xà phòng hoá', soEmVap: 4, soEmGap: 6 }]) // 3 + EM[6] vấp; gặp: 3 + EM[3] + EM[5] + EM[6]
  })
  it('xếp theo tỉ lệ vấp/đã gặp giảm, rồi số em vấp; tối đa 5; thiếu tên dạng ⇒ bỏ tiền tố CD:', async () => {
    const d = truong('2026-09-22T10:00:00')
    for (let k = 0; k < 7; k++) for (const e of EM.slice(0, 3 + (k % 2))) await sk(d, e, 2, 0, T('2026-09-22T09:00:00'), `CD:Chuyên đề ${k}`)
    for (const e of EM.slice(4, 6)) await sk(d, e, 0, 2, T('2026-09-22T09:00:00'), 'CD:Chuyên đề 0') // em gặp mà không vấp ⇒ tỉ lệ dạng 0 thấp hơn
    const r = await goi(d)
    expect(r.dangVap).toHaveLength(5)
    const tl = (r.dangVap as { soEmVap: number; soEmGap: number }[]).map((x) => x.soEmVap / x.soEmGap)
    expect(tl).toEqual([...tl].sort((a, c) => c - a))
    expect(r.dangVap[0].ten).toMatch(/^Chuyên đề \d$/)
  })
})

describe('boNao · mayDaLam · sucKhoe', () => {
  const banTin = (d: D1That, ngay: string, nopLuc: string, cacDong: unknown[], soEm = 250) =>
    d.sql.prepare("INSERT INTO ai_ban_tin(ngay,json,nop_luc,so_em,so_nhan) VALUES(?,?,?,?,30)").run(ngay, JSON.stringify({ cacDong }), nopLuc, soEm)
  it('boNao: bản tin gần nhất tới hôm nay; soEmDieuChinh = điều chỉnh ĐÃ ÁP hôm nay chưa huỷ; goiY ≤ 2 dòng ca_lop kèm tên dạng; chưa có bản tin ⇒ khoá vắng + lyDoThieu', async () => {
    const d = truong()
    expect(await goi(d)).toMatchObject({ lyDoThieu: { boNao: 'Chưa có bản tin Bộ não A.I' } })
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DEA', 'DEA-I-1', 'v1', 'G', 'ESTE.X', JSON.stringify({ tenDang: 'Xà phòng hoá' }))
    banTin(d, '2026-09-20', T('2026-09-20T01:00:00'), [{ loai: 'ca_lop', chu: 'bản tin cũ' }])
    banTin(d, '2026-09-21', T('2026-09-21T01:04:00'), [{ loai: 'ca_lop', chu: 'Gợi ý 1', dang: 'ESTE.X' }, { loai: 'em', sbd: EM[0], chu: 'dòng em' }, { loai: 'ca_lop', chu: 'Gợi ý 2' }, { loai: 'ca_lop', chu: 'Gợi ý 3' }])
    const dc = (sbd: string, ap: number, huy: number, o = '{}') => d.sql.prepare("INSERT INTO ai_dieu_chinh(sbd,ngay,json,ap_dung,het_han,huy,nop_luc) VALUES(?,'2026-09-21',?,?,'2026-09-24',?,'x')").run(sbd, o, ap, huy)
    dc(EM[0]!, 1, 0, '{"khacPhuc":[{"dang":"ESTE.X"}]}'); dc(EM[1]!, 1, 0); dc(EM[2]!, 0, 0); dc(EM[3]!, 1, 1)
    const r = await goi(d)
    expect(r.boNao).toEqual({
      ngay: '2026-09-21', chayLuc: T('2026-09-21T01:04:00'), soEmSoi: 250, soEmDieuChinh: 2, soLoiNhan: 30,
      goiY: [{ chu: 'Gợi ý 1', dang: 'ESTE.X', tenDang: 'Xà phòng hoá' }, { chu: 'Gợi ý 2' }],
    })
    expect(r.lyDoThieu?.boNao).toBeUndefined()
    // ngày sau chưa có bản tin mới: vẫn hiện bản gần nhất (ghi rõ `ngay`), nhưng "Bộ não soi N em" ở mayDaLam CHỈ khi bản tin là của hôm nay
    dat('2026-09-22T10:00:00')
    const r2 = await goi(d)
    expect(r2.boNao.ngay).toBe('2026-09-21')
    expect((r2.mayDaLam as { loai: string }[]).map((x) => x.loai)).not.toContain('bo_nao_soi')
  })
  it('mayDaLam: CHỈ dòng có số > 0, thứ tự cố định, câu sẵn; vinh danh = bản đăng hôm nay (lưu ở ngày hôm qua); bộ câu riêng = chốt sau mốc; khắc phục luôn từ điều chỉnh đã áp', async () => {
    const d = truong()
    expect((await goi(d)).mayDaLam).toEqual([])
    banTin(d, '2026-09-21', T('2026-09-21T01:04:00'), [], 250)
    d.sql.prepare("INSERT INTO ai_dieu_chinh(sbd,ngay,json,ap_dung,het_han,huy,nop_luc) VALUES(?,'2026-09-21','{\"khacPhuc\":[{\"dang\":\"X\"}]}',1,'2026-09-24',0,'x'),(?,'2026-09-21','{\"khacPhuc\":[]}',1,'2026-09-24',0,'x')").run(EM[0], EM[1])
    themBai(d, 'B1', T('2026-09-21T12:30:00'), T('2026-09-24T12:00:00'))
    themBaiEm(d, 'B1', EM[0]!, { soChang: 4, chot: T('2026-09-21T12:40:00') }); themBaiEm(d, 'B1', EM[1]!, { soChang: 4, chot: T('2026-09-21T11:59:59') }) // 1 em chốt trước mốc
    d.sql.prepare("INSERT INTO daily_honors(day,created_at,body) VALUES('2026-09-20','x',?)").run(JSON.stringify({ winners: [{ rank: 1 }, { rank: 2 }, { rank: 3 }], publishedAt: T('2026-09-21T13:00:00') }))
    d.sql.prepare("INSERT INTO canh_bao_thay(id,ma_btvn,sbd,ngay,ten_btvn,han_nop,loi_em,loi_ph,trang_thai_em,gui_luc,moc,gui_ph,ph_nhom) VALUES('a','B1',?,'2026-09-21','x','x','a','b','chua_mo',?,'M1',1,?)").run(EM[5], T('2026-09-21T12:45:00'), `${EM[5]}|2026-09-21`)
    d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,trang_thai,luc_cuoi,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,nguon_cuoi,cap_nhat_luc) VALUES('a',?,'K1','moi_sai',?,1,1,0,0,0,'on_lai','x')").run(EM[2], T('2026-09-21T12:50:00'))
    const r = await goi(d)
    expect(r.mayDaLam).toEqual([
      { loai: 'nhac_nop_bai', so: 1, soPhuHuynh: 1, chu: 'Nhắc nộp bài cho 1 em, báo 1 phụ huynh' },
      { loai: 'khac_phuc_luon', so: 1, chu: 'Đưa câu khắc phục vào bài cho 1 em' },
      { loai: 'on_lai', so: 1, chu: 'Đưa 1 câu sai về lịch ôn lại' },
      { loai: 'bo_cau_rieng', so: 1, chu: 'Rút bộ câu riêng cho 1 em' },
      { loai: 'vinh_danh', so: 3, chu: 'Vinh danh 3 em' },
      { loai: 'bo_nao_soi', so: 250, chu: 'Bộ não A.I soi 250 em' },
    ])
    // bản vinh danh đăng TRƯỚC mốc hôm nay thì không tính
    d.sql.prepare("UPDATE daily_honors SET body = ? WHERE day = '2026-09-20'").run(JSON.stringify({ winners: [{ rank: 1 }], publishedAt: '2026-09-21T04:59:59.000Z' }))
    expect(((await goi(d)).mayDaLam as { loai: string }[]).map((x) => x.loai)).not.toContain('vinh_danh')
  })
  it('sucKhoe: xanh = Bộ não ≤ 26 giờ và cron nhắc ≤ 45 phút (trong khung 07:00–21:30); trễ một ⇒ vàng; trễ cả hai ⇒ đỏ; chưa có dữ liệu ⇒ vàng (không giả xanh); ngoài khung không tính cron', async () => {
    const lan = (d: D1That, luc: string) => d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('nhac_tu_dong_lan','2026-09-21T13:00',?)").run(luc)
    const a = truong('2026-09-21T13:10:00')
    banTin(a, '2026-09-21', T('2026-09-21T01:04:00'), []); lan(a, T('2026-09-21T13:00:00'))
    expect((await goi(a)).sucKhoe).toMatchObject({ muc: 'xanh', chu: 'Bộ não A.I chạy lúc 01:04 · nhắc nộp bài chạy lúc 13:00', boNaoChayLuc: T('2026-09-21T01:04:00'), cronNhacLuc: T('2026-09-21T13:00:00') })
    const b = truong('2026-09-21T14:00:00') // cron trễ 60 phút
    banTin(b, '2026-09-21', T('2026-09-21T01:04:00'), []); lan(b, T('2026-09-21T13:00:00'))
    expect((await goi(b)).sucKhoe).toMatchObject({ muc: 'vang' })
    const c = truong('2026-09-22T14:00:00') // cả hai trễ
    banTin(c, '2026-09-21', T('2026-09-21T01:04:00'), []); lan(c, T('2026-09-21T13:00:00'))
    expect((await goi(c)).sucKhoe).toMatchObject({ muc: 'do' })
    expect((await goi(truong())).sucKhoe).toMatchObject({ muc: 'vang' }) // chưa có dữ liệu nào
    const e = truong('2026-09-21T23:00:00') // ngoài khung nhắc: cron không bị coi là trễ
    banTin(e, '2026-09-21', T('2026-09-21T01:04:00'), []); lan(e, T('2026-09-21T21:30:00'))
    expect((await goi(e)).sucKhoe.muc).toBe('xanh')
    const g = truong('2026-09-21T13:10:00')
    g.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('canh_bao_tu_dong','{\"bat\":false}','x')").run()
    banTin(g, '2026-09-21', T('2026-09-21T01:04:00'), [])
    expect((await goi(g)).sucKhoe).toMatchObject({ muc: 'vang', chu: expect.stringContaining('nhắc nộp bài đang tắt') })
  })
})

describe('thiếu bảng ⇒ khối vắng, lệnh vẫn ok', () => {
  it('thiếu canh_bao_thay / ai_ban_tin / ai_dieu_chinh / daily_honors / nam_kt_cau: ok, khối liên quan vắng hoặc rỗng, không ném lỗi', async () => {
    const d = truong()
    await sk(d, EM[0]!, 1, 5, T('2026-09-21T13:00:00'))
    for (const t of ['canh_bao_thay', 'ai_ban_tin', 'ai_dieu_chinh', 'daily_honors', 'nam_kt_cau']) d.sql.exec(`DROP TABLE ${t}`)
    const r = await goi(d)
    expect(r).toMatchObject({ ok: true, nhip: { soCau: 6 }, lyDoThieu: { nhacNopBai: 'Chưa có bảng nhắc', boNao: 'Không đọc được bản tin Bộ não A.I' } })
    expect(r).not.toHaveProperty('boNao')
    expect(r.tienBo).toEqual([expect.objectContaining({ loai: 'cham_nhat', so: 6 })])
  })
  it('thiếu cột ten_lop (chưa chạy migration): vẫn ok, mọi em ở lớp mặc định theo khối', async () => {
    const d = truong()
    d.sql.exec('ALTER TABLE hoc_sinh DROP COLUMN ten_lop')
    await sk(d, EM[0]!, 0, 9, T('2026-09-21T13:00:00'))
    const r = await goi(d)
    expect(r.tienBo[0]).toMatchObject({ sbd: EM[0], tenLop: '12 - Lớp Thường' })
  })
})
