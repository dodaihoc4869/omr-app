// @vitest-environment node
// LỆNH ĐỌC-CHỈ CHO MÀN "HÔM NAY" CỦA APP GIÁO VIÊN (server/src/hom-nay-thay.ts; hợp đồng docs/hop-dong-gv-hom-nay-2109.md). SQLite thật, lược đồ thật + mọi migration.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { homNayThay } from '../server/src/hom-nay-thay'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const NOW = Date.parse('2026-09-21T05:00:00.000Z') // 12:00 VN thứ Hai 21/09/2026
const NGAY = '2026-09-21'
const bam = (d: D1That, t: string) => JSON.stringify(d.sql.prepare(`SELECT * FROM "${t}" ORDER BY rowid`).all())
const bamTatCa = (d: D1That) => Object.fromEntries((d.sql.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[]).map((x) => [x.name, bam(d, x.name)]))

const themEm = (d: D1That, sbd: string, hoTen: string, lop: string, trangThai: string | null = null) =>
  d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,trang_thai,cap_nhat_luc) VALUES(?,?,?,?,?)').run(sbd, hoTen, lop, trangThai, 'x')
const keHoach = (d: D1That, sbd: string, ngay: string, o: { tt?: number; coToiHan?: number; treNhip?: boolean; ketQua?: string | null; tut?: number; nghi?: boolean; viec?: unknown[] } = {}) =>
  d.sql.prepare(
    `INSERT INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,ket_qua,so_cau_da_lam,so_cau_len_bac,so_cau_tut_bac,la_ngay_nghi,so_su_kien,cap_nhat_luc) VALUES(?,?,?,1,1,?,?,'[]',?,0,0,?,?,0,'x')`,
  ).run(`${sbd}|${ngay}`, sbd, ngay, JSON.stringify({ toiThieuCau: o.tt ?? 4 }), JSON.stringify({ viec: o.viec ?? [], tienBo: { soCauToiHan: o.coToiHan ?? 0, treNhip: o.treNhip ?? false } }), o.ketQua ?? null, o.tut ?? 0, o.nghi ? 1 : 0)
const btvnLo = (ma: string, chiSo: number, tongLo: number, treNhip: boolean, han: string) => ({ loai: 'btvn_lo', hanCung: han, chiTiet: { ma, chiSo, tongLo, treNhip } })
const su = (sbd: string, qid: string, ketQua: 0 | 1, luc: string, lan = 1) => ({ nguon: 'btvn' as const, maNguon: 'B', sbd, qid, lan, ketQua, luc })
const dangHs = (d: D1That, sbd: string, ma: string, soGap: number, soSai: number, khacPhuc: number) =>
  d.sql.prepare('INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES(?,?,?,?,?,?,0,0,0,?)').run(`${sbd}|${ma}`, sbd, ma, soGap, soSai, khacPhuc, 'x')
const doanLuot = (d: D1That, ma: string, sbd: string, ngay: string, lop: string, thang: number | null) =>
  d.sql.prepare('INSERT INTO doan_luot(ma_chang,sbd,ngay_vn,lop,ghe,thang,vao_luc) VALUES(?,?,?,?,1,?,?)').run(ma, sbd, ngay, lop, thang, 'x')

/** Kịch bản đủ mọi khối. Lớp 12A: A1..A5 (+ K1 bị khoá); lớp 11B: B1..B3; N1 không lớp. */
async function dung() {
  const d = taoD1That()
  for (const [s, ten] of [['A1', 'Nguyễn A1'], ['A2', 'Trần A2'], ['A3', 'Lê A3'], ['A4', 'Phạm A4'], ['A5', 'Vũ A5']]) themEm(d, s!, ten!, '12A')
  themEm(d, 'K1', 'Khoá K1', '12A', 'khoa')
  for (const [s, ten] of [['B1', 'Đỗ B1'], ['B2', 'Hà B2'], ['B3', 'Mai B3']]) themEm(d, s!, ten!, '11B')
  themEm(d, 'N1', 'Không lớp', '')
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('ngay_nghi','[\"2026-09-19\"]','x')").run()

  // Sổ học: hôm nay 03:00Z (10:00 VN 21/09).
  const hn = (i: number) => `2026-09-21T03:00:0${i}.000Z`
  const ev = [
    ...[1, 2, 3, 4, 5].map((i) => su('A1', `a1q${i}`, 1, hn(i))),              // A1: 5 câu hôm nay, không tới hạn → ĐẠT
    ...[1, 2, 3, 4, 5].map((i) => su('A2', `a2q${i}`, 1, hn(i))),              // A2: 5 câu nhưng có câu tới hạn mà không lên bậc → KHÔNG đạt
    ...[1, 2].map((i) => su('A3', `a3q${i}`, 1, hn(i))),                       // A3: 2 câu < 4
    su('A4', 'a4q1', 1, '2026-09-17T03:00:00.000Z'),                            // A4: lần cuối 17/09
    su('A5', 'a5q1', 1, '2026-09-19T03:00:00.000Z'),                            // A5: lần cuối 19/09 (2 ngày)
    su('B1', 'z1', 1, '2026-09-19T04:00:00.000Z'), su('B1', 'z2', 1, '2026-09-19T04:00:01.000Z'), // B1 đúng hôm 19
    su('B1', 'z1', 0, hn(1), 2), su('B1', 'z2', 0, hn(2), 2),                  // rồi SAI hôm nay: tụt bậc 2 câu
    ...[1, 2, 3, 4].map((i) => su('B2', `b2q${i}`, 1, hn(i))),                 // B2: 4 câu → ĐẠT
    ...[1, 2, 3, 4].map((i) => su('B3', `b3q${i}`, 1, hn(i))),                 // B3: 4 câu nhưng kế hoạch báo TRỄ NHỊP → KHÔNG đạt
  ]
  expect((await ghiSuKien(d.env, ev)).ok).toBe(true)

  // Kế hoạch hôm nay (8 em), hôm qua, hôm kia.
  keHoach(d, 'A1', NGAY, { viec: [btvnLo('BT1', 1, 4, false, '2026-09-25T16:59:00.000Z')] })
  keHoach(d, 'A2', NGAY, { coToiHan: 3, viec: [btvnLo('BT1', 2, 4, true, '2026-09-25T16:59:00.000Z')] })
  keHoach(d, 'A3', NGAY, { viec: [btvnLo('BT2', 0, 3, false, '2026-09-23T16:59:00.000Z')] })
  keHoach(d, 'A4', NGAY, { viec: [btvnLo('BT1', 2, 4, false, '2026-09-25T16:59:00.000Z')] }); keHoach(d, 'A5', NGAY)
  keHoach(d, 'B1', NGAY, { viec: [btvnLo('BT2', 0, 5, true, '2026-09-23T16:59:00.000Z')] })
  keHoach(d, 'B2', NGAY); keHoach(d, 'B3', NGAY, { treNhip: true })
  keHoach(d, 'A1', '2026-09-20', { ketQua: 'dat' }); keHoach(d, 'A2', '2026-09-20', { ketQua: 'mot_phan' })
  keHoach(d, 'A3', '2026-09-20', { ketQua: 'khong', tut: 2 }); keHoach(d, 'B1', '2026-09-20', { ketQua: 'dat', tut: 1 })
  keHoach(d, 'A5', '2026-09-20', { nghi: true })                               // ngày nghỉ: không tính
  keHoach(d, 'A3', '2026-09-19', { ketQua: 'khong', tut: 1 })
  keHoach(d, 'N1', NGAY, { nghi: true })                                        // hôm nay là ngày nghỉ của em này: không tính vào tong, không xét trễ nhịp

  // Hồ sơ dạng: A2 và A5 yếu ES.A.X; A5 còn yếu CD:Este.
  dangHs(d, 'A2', 'ES.A.X', 6, 4, 1); dangHs(d, 'A5', 'ES.A.X', 6, 5, 1); dangHs(d, 'A5', 'CD:Este', 4, 3, 0); dangHs(d, 'A5', 'CD:Xa', 4, 2, 0); dangHs(d, 'A5', 'CD:Yb', 4, 1, 0); dangHs(d, 'A1', 'ES.A.X', 6, 1, 6)
  d.sql.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('DE1','q-x','v','g','ES.A.X',?)").run(JSON.stringify({ qid: 'q-x', tenDang: 'Este đơn chức', correct: 'B', solution: 'SECRET-LOI-GIAI' }))

  // BTVN + ca + đề: tên bài, hạn nộp.
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,bat_dau,het_han_vao,thoi_gian_phut,cap_nhat_luc) VALUES('CA1','Kiểm tra este','mo','thi',?,?,45,'x')").run(new Date(NOW - 3_600_000).toISOString(), new Date(NOW + 3_600_000).toISOString())
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,bat_dau,het_han_vao,thoi_gian_phut,cap_nhat_luc) VALUES('CA2','Ca hết hạn','mo','thi',?,?,45,'x')").run(new Date(NOW - 5 * 3_600_000).toISOString(), new Date(NOW - 4 * 3_600_000).toISOString())
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cap_nhat_luc) VALUES('CA3','Ca đóng','dong','thi','x')").run()
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cap_nhat_luc) VALUES('CA4','Bài tập','mo','baitap','x')").run()
  d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES('BT1','CA1','DE1',8,'x','2026-09-24T16:59:00.000Z',0,'x')").run()

  // Đoàn Hộ Tống: cờ mở cho A1 (lớp 12A); mùa 21/09; 3 chặng thắng hôm nay của 12A.
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong','{\"dsSbd\":[\"A1\"],\"toanBo\":false}','x')").run()
  d.sql.prepare("INSERT INTO game_v2_settings(key,json) VALUES('season',?)").run(JSON.stringify({ id: '2026-09-21-mua-1', startedAt: '2026-09-21T00:00:00.000Z' }))
  for (const s of ['A1', 'A2', 'A3']) doanLuot(d, `C-${s}`, s, NGAY, '12A', 1)
  doanLuot(d, 'C-cu1', 'A1', '2026-09-20', '12A', 1); doanLuot(d, 'C-cu2', 'A4', '2026-09-20', '12A', 1)
  doanLuot(d, 'C-lop-khac', 'B1', NGAY, '11B', 1); doanLuot(d, 'C-thua', 'A4', NGAY, '12A', 0)
  return d
}
const goi = (d: D1That, b: Record<string, unknown> = {}) => homNayThay(d.env, { ngay: NGAY, ...b }, NOW)

describe('lệnh /ke-hoach/hom-nay-thay: mọi khối từ dữ liệu thật', () => {
  it('soEm/soLop (bỏ em bị khoá, tính em không lớp), caDangMo (chỉ ca thi trong giờ), nhiemVu hôm nay và hôm qua', async () => {
    const d = await dung()
    const r = await goi(d)
    expect(r).toMatchObject({ ok: true, ngay: NGAY, soEm: 9, soLop: 2, caDangMo: 1 })
    // 8 em có kế hoạch; ĐẠT chỉ A1 (5 câu, không câu tới hạn) và B2 (4 câu); A2 có câu tới hạn mà không lên bậc; A3 mới 2 câu.
    expect(r.nhiemVu).toEqual({ tong: 8, dat: 2, tongHomQua: 4, datHomQua: 2 })
    expect(r.lyDoThieu).toEqual({})
  })
  it('btvn: bài đang chạy theo lô nhiều em đang ở nhất, tổng lô lớn nhất, em kịp nhịp, hạn gần nhất trước; tên từ ca/đề; tối đa 6 bài', async () => {
    const d = await dung()
    const r = await goi(d)
    expect(r.btvn).toEqual({
      soEmCoLo: 5, soEmDungNhip: 3,
      dangChay: [
        { ma: 'BT2', ten: 'BT2', lop: '11B', soEm: 2, loHienTai: 1, tongLo: 5, soEmKip: 1, han: '2026-09-23T16:59:00.000Z' },
        { ma: 'BT1', ten: 'Kiểm tra este', lop: '12A', soEm: 3, loHienTai: 3, tongLo: 4, soEmKip: 2, han: '2026-09-24T16:59:00.000Z' }, // A1 ở lô 2, A2 và A4 ở lô 3 ⇒ lô hiện tại 3
      ],
    })
    // Quá 6 bài ⇒ cắt còn 6.
    d.sql.prepare("DELETE FROM ke_hoach_ngay WHERE ngay = ? AND sbd = 'B3'").run(NGAY)
    const nhieu = [...Array(9)].map((_, i) => btvnLo(`X${i}`, 0, 2, false, `2026-09-3${i}T00:00:00.000Z`))
    d.sql.prepare("UPDATE ke_hoach_ngay SET viec_json = ? WHERE khoa = ?").run(JSON.stringify({ viec: nhieu, tienBo: {} }), `B2|${NGAY}`)
    const r2 = await goi(d)
    expect((r2.btvn as any).dangChay).toHaveLength(6)
  })
  it('canYTuong: MỘT lý do mỗi em, thứ tự tre_nhip → tut_bac → dang_yeu; số liệu đúng; tong đếm cả em ngoài ds; em bị khoá/không kế hoạch không vào', async () => {
    const d = await dung()
    const r = await goi(d)
    expect(r.canYTuong).toEqual({
      tong: 5,
      ds: [
        { sbd: 'A4', hoTen: 'Phạm A4', lop: '12A', lyDo: 'tre_nhip', soLieu: { ngay: 3 } }, // 17/09 → 21/09 = 4 ngày, trừ ngày nghỉ 19/09
        { sbd: 'A3', hoTen: 'Lê A3', lop: '12A', lyDo: 'tut_bac', soLieu: { soCau: 3, soNgay: 3 } }, // 2 + 1 ở hai ngày trước
        { sbd: 'B1', hoTen: 'Đỗ B1', lop: '11B', lyDo: 'tut_bac', soLieu: { soCau: 3, soNgay: 3 } }, // 1 hôm qua + 2 tụt hôm nay
        { sbd: 'A5', hoTen: 'Vũ A5', lop: '12A', lyDo: 'dang_yeu', soLieu: { ma: 'ES.A.X', ten: 'Este đơn chức', soCauSai: 5 } },
        { sbd: 'A2', hoTen: 'Trần A2', lop: '12A', lyDo: 'dang_yeu', soLieu: { ma: 'ES.A.X', ten: 'Este đơn chức', soCauSai: 4 } },
      ],
    })
    const sbd = (r.canYTuong as any).ds.map((x: any) => x.sbd)
    expect(new Set(sbd).size).toBe(sbd.length)
  })
  it('canYTuong: ds tối đa 8 nhưng tong đếm hết; xếp theo số ngày trễ giảm dần', async () => {
    const d = taoD1That()
    for (let i = 0; i < 12; i++) {
      const s = `T${String(i).padStart(2, '0')}`
      themEm(d, s, `Em ${s}`, '10C')
      keHoach(d, s, NGAY)
      expect((await ghiSuKien(d.env, [su(s, 'q', 1, `2026-09-${String(10 + (i % 6)).padStart(2, '0')}T03:00:00.000Z`)])).ok).toBe(true)
    }
    const r = await goi(d)
    const ct = r.canYTuong as any
    expect(ct.tong).toBe(12)
    expect(ct.ds).toHaveLength(8)
    const ngay = ct.ds.map((x: any) => x.soLieu.ngay)
    expect(ngay).toEqual([...ngay].sort((a: number, b: number) => b - a))
    expect(ct.ds.every((x: any) => x.lyDo === 'tre_nhip')).toBe(true)
  })
  it('dangYeu theo lớp: ≤ 4 lớp đông nhất, ≤ 3 dạng nhiều em yếu nhất; tên dạng từ kho (thiếu thì mã bỏ tiền tố CD:); KHÔNG lộ cột json (đáp án)', async () => {
    const d = await dung()
    const r = await goi(d)
    expect(r.dangYeu).toEqual([
      { lop: '12A', siSo: 5, dang: [{ ma: 'ES.A.X', ten: 'Este đơn chức', soEmYeu: 2 }, { ma: 'CD:Este', ten: 'Este', soEmYeu: 1 }, { ma: 'CD:Xa', ten: 'Xa', soEmYeu: 1 }] }, // 4 dạng yếu, chỉ 3 dạng đầu
      { lop: '11B', siSo: 3, dang: [] },
    ])
    const s = JSON.stringify(r)
    for (const cam of ['SECRET-LOI-GIAI', 'correct', 'solution', 'json']) expect(s, cam).not.toContain(cam)
  })
  it('doan: chỉ khi cờ doan_ho_tong bật; lớp đã mở, trạm theo chặng thắng trong mùa, số bạn góp sức hôm nay, sĩ số', async () => {
    const d = await dung()
    expect((await goi(d)).doan).toEqual({ lop: '12A', tram: 1, tongTram: 30, gopSucHomNay: 3, siSo: 5 })
    d.sql.prepare("UPDATE cau_hinh SET gia_tri = '{\"dsSbd\":[],\"toanBo\":false}' WHERE khoa = 'doan_ho_tong'").run()
    const tat = await goi(d)
    expect(tat.doan).toBeNull()
    expect('doan' in (tat.lyDoThieu as object)).toBe(false) // cờ tắt KHÔNG phải lỗi
    d.sql.prepare("UPDATE cau_hinh SET gia_tri = '{\"toanBo\":true}' WHERE khoa = 'doan_ho_tong'").run()
    expect(((await goi(d)).doan as any).lop).toBe('12A') // toàn trường: lớp đông nhất
  })
})

describe('dangYeu: chỉ các lớp đông nhất', () => {
  it('nhiều hơn 4 lớp ⇒ 4 lớp đông nhất, đông trước; hoà sĩ số thì theo tên lớp', async () => {
    const d = taoD1That()
    const co = { '10A': 2, '10B': 6, '10C': 4, '10D': 5, '10E': 3, '10F': 5 }
    for (const [lop, n] of Object.entries(co)) for (let i = 0; i < n; i++) themEm(d, `${lop}-${i}`, `Em ${lop}-${i}`, lop)
    const r = await goi(d)
    expect((r.dangYeu as any[]).map((x) => [x.lop, x.siSo])).toEqual([['10B', 6], ['10D', 5], ['10F', 5], ['10C', 4]])
    expect(r.soLop).toBe(6)
  })
})

describe('chỉ đọc, giới hạn truy vấn, xác thực', () => {
  it('KHÔNG ghi gì (mọi bảng y nguyên từng byte) và ≤ 8 truy vấn D1, khớp `soTruyVan`', async () => {
    const d = await dung()
    const truoc = bamTatCa(d)
    const t0 = d.soLenh.prepare
    const b0 = d.soLenh.batch
    const r = await goi(d)
    expect(bamTatCa(d)).toEqual(truoc)
    expect(d.soLenh.batch - b0).toBe(0)
    expect(d.soLenh.prepare - t0).toBe(r.soTruyVan)
    expect(r.soTruyVan).toBeLessThanOrEqual(8)
  })
  it('qua Worker: đòi mã bí mật; ngày sai định dạng ⇒ ok:false; mặc định là hôm nay giờ VN', async () => {
    const d = await dung()
    expect((await goiWorker(worker, d.env, '/ke-hoach/hom-nay-thay', {})).ok).not.toBe(true)
    const ok = await goiWorker(worker, d.env, '/ke-hoach/hom-nay-thay', {}, true)
    expect(ok.ok).toBe(true)
    expect(ok.ngay).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect((await goiWorker(worker, d.env, '/ke-hoach/hom-nay-thay', { ngay: '21/09/2026' }, true)).ok).toBe(false)
    expect((await homNayThay(d.env, {}, NOW)).ngay).toBe(NGAY)
  })
})

describe('khối nào không tính được thì null + lyDoThieu, các khối còn lại vẫn ra (không bịa số)', () => {
  it('sau reset (chưa có kế hoạch ngày): nhiemVu/btvn/canYTuong null có lý do; soEm, caDangMo, dangYeu vẫn có; doan theo cờ', async () => {
    const d = await dung()
    d.sql.exec('DELETE FROM ke_hoach_ngay')
    const r = await goi(d)
    expect(r.nhiemVu).toBeNull(); expect(r.btvn).toBeNull(); expect(r.canYTuong).toBeNull()
    for (const k of ['nhiemVu', 'btvn', 'canYTuong']) expect(String((r.lyDoThieu as any)[k]), k).toMatch(/kế hoạch ngày/)
    expect(r).toMatchObject({ soEm: 9, soLop: 2, caDangMo: 1 })
    expect((r.dangYeu as any[]).length).toBe(2)
    expect(r.doan).not.toBeNull()
  })
  it('hôm qua có kế hoạch nhưng chưa chốt ket_qua ⇒ tongHomQua/datHomQua null (không đếm 0 giả)', async () => {
    const d = await dung()
    d.sql.exec("UPDATE ke_hoach_ngay SET ket_qua = NULL WHERE ngay = '2026-09-20'")
    expect((await goi(d)).nhiemVu).toEqual({ tong: 8, dat: 2, tongHomQua: null, datHomQua: null })
  })
  it('thiếu từng bảng: chỉ các khối phụ thuộc bảng ấy thành null', async () => {
    const thieu = async (bang: string) => {
      const d = await dung()
      d.sql.exec(`DROP TABLE ${bang}`)
      return goi(d)
    }
    const a = await thieu('ke_hoach_ngay')
    expect([a.nhiemVu, a.btvn, a.canYTuong]).toEqual([null, null, null])
    expect(a.dangYeu).not.toBeNull()
    const b = await thieu('nam_kt_dang')
    expect(b.dangYeu).toBeNull(); expect(b.canYTuong).toBeNull()
    expect(String((b.lyDoThieu as any).dangYeu)).toMatch(/hồ sơ dạng/)
    expect(b.nhiemVu).not.toBeNull(); expect(b.btvn).not.toBeNull()
    const c = await thieu('ca')
    expect(c.caDangMo).toBeNull(); expect(String((c.lyDoThieu as any).caDangMo)).toMatch(/ca/)
    expect(c.nhiemVu).not.toBeNull()
    const e = await thieu('doan_luot')
    expect(e.doan).toBeNull(); expect(String((e.lyDoThieu as any).doan)).toMatch(/Đoàn/)
    expect(e.dangYeu).not.toBeNull()
    const f = await thieu('su_kien_hoc')
    expect(f.nhiemVu).toBeNull(); expect(f.canYTuong).toBeNull()
    expect(f.btvn).not.toBeNull() // tiến độ lô đọc từ kế hoạch, không cần sổ
    const g = await thieu('hoc_sinh')
    expect(g.soEm).toBeNull(); expect(g.soLop).toBeNull(); expect(g.dangYeu).toBeNull(); expect(g.canYTuong).toBeNull() // danh sách em lấy từ hoc_sinh: thiếu thì không có hồ sơ dạng để xét
    expect(g.nhiemVu).not.toBeNull()
  })
})
