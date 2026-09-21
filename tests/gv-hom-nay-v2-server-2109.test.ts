// @vitest-environment node
// HÔM NAY v2 (máy chủ) — 5 lệnh ĐỌC-CHỈ của thầy: /gv/tim-em, /gv/chua-nop, /gv/can-giup, /gv/vinh-danh-ngay, /gv/em-toan-canh (docs/hop-dong-hom-nay-v2-2109.md).
// Khoá: cần mã bí mật · KHÔNG ghi một byte · ≤ 12 truy vấn · hình dạng đã chốt với Code 4 · chỗ thiếu dữ liệu VẮNG KHOÁ (không bịa) · không kết luận năng lực.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { khongDau, mucNhip, xuHuong7 } from '../server/src/gv-hom-nay-v2'
import { NGUONG_DANG_YEU, SO_CAU_DU_TIN } from '../server/src/ho-so-cau-hinh'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { BAY_GIO, cauThay, dung, giao, gio, maBtvn, mo } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())

const H = 3_600_000
const D = 86_400_000
const goi = (d: D1That, duong: string, b: Record<string, unknown> = {}, thay = true) => goiWorker(worker, d.env, duong, b, thay)
const NAY = BAY_GIO.getTime() // 22/09/2026 10:00 giờ VN
const luc = (soNgayTruoc: number, gioTrongNgay = 0) => new Date(NAY - soNgayTruoc * D + gioTrongNgay * H).toISOString()

/** Ghi lại mọi câu lệnh GHI mà D1 nhận (đọc-chỉ ⇒ rỗng). */
function theoDoiGhi(d: D1That): string[] {
  const ghi: string[] = []
  const goc = d.env.DB.prepare.bind(d.env.DB)
  d.env.DB.prepare = ((q: string) => {
    if (/^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i.test(q)) ghi.push(q.trim().slice(0, 60))
    return goc(q)
  }) as typeof d.env.DB.prepare
  return ghi
}
const themHs = (d: D1That, sbd: string, hoTen: string, lop: string) => d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,'mk','x')").run(sbd, hoTen, lop)
function truong(): D1That {
  gio(BAY_GIO)
  const d = taoD1That()
  themHs(d, '1001', 'Nguyễn Văn An', '12A'); themHs(d, '1002', 'Trần Thị Bình', '12A'); themHs(d, '1003', 'Lê Đức Anh', '12B'); themHs(d, '2001', 'Phạm Minh Châu', '12B')
  return d
}
const sk = (d: D1That, sbd: string, qid: string, kq: 0 | 1, soNgayTruoc: number, o: { nguon?: 'btvn' | 'on_lai' | 'game' | 'mom' | 'thi'; ma?: string; dang?: string; giay?: number; lan?: number } = {}) =>
  ghiSuKien(d.env, [{ nguon: o.nguon ?? 'on_lai', maNguon: o.ma ?? 'M1', sbd, qid, lan: o.lan ?? 1, ketQua: kq, luc: luc(soNgayTruoc, 3), maDang: o.dang ?? 'DA-1', giay: o.giay ?? 20 }])
const dangHs = (d: D1That, sbd: string, ma: string, gap: number, sai: number, khacPhuc: number, bac = 0) =>
  d.sql.prepare("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,0,?,'x')").run(`${sbd}|${ma}`, sbd, ma, gap, sai, khacPhuc, sai, bac)
const khNgay = (d: D1That, sbd: string, soNgayTruoc: number, o: { kq?: string | null; nghi?: number; len?: number; tut?: number } = {}) =>
  d.sql.prepare("INSERT INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,ket_qua,so_cau_da_lam,so_cau_len_bac,so_cau_tut_bac,la_ngay_nghi,so_su_kien,cap_nhat_luc) VALUES(?,?,?,1,'s','{}','{}','[]',?,0,?,?,?,0,'x')")
    .run(`${sbd}|${luc(soNgayTruoc, 3).slice(0, 10)}`, sbd, luc(soNgayTruoc, 3).slice(0, 10), o.kq === undefined ? 'dat' : o.kq, o.len ?? 0, o.tut ?? 0, o.nghi ?? 0)

describe('hàm thuần', () => {
  it('khongDau: bỏ dấu, đ → d, hạ chữ thường', () => {
    expect(khongDau('  Nguyễn  Đức ĐẠT ')).toBe('nguyen duc dat')
  })
  it('xuHuong7: cần ≥ 2 câu mỗi kỳ; chênh ≥ 15 điểm % mới tang/giam', () => {
    expect(xuHuong7(4, 4, 4, 1)).toBe('tang')
    expect(xuHuong7(4, 1, 4, 4)).toBe('giam')
    expect(xuHuong7(10, 5, 10, 4)).toBe('giu') // +10 điểm
    expect(xuHuong7(1, 1, 5, 1)).toBeUndefined() // kỳ mới chỉ 1 câu ⇒ không bịa
    expect(xuHuong7(5, 5, 0, 0)).toBeUndefined()
  })
  it('mucNhip: 0 · 1–4 · 5–14 · ≥ 15', () => {
    expect([0, 1, 4, 5, 14, 15, 99].map(mucNhip)).toEqual([0, 1, 1, 2, 2, 3, 3])
  })
})

describe('mọi lệnh: cần mã bí mật, đọc-chỉ, ≤ 12 truy vấn', () => {
  const LENH: [string, Record<string, unknown>][] = [
    ['/gv/tim-em', { q: 'nguyen' }], ['/gv/chua-nop', {}], ['/gv/can-giup', {}], ['/gv/vinh-danh-ngay', {}], ['/gv/em-toan-canh', { sbd: '1001' }],
  ]
  it('không mã bí mật ⇒ 403; có mã ⇒ ok và soTruyVan ≤ 12; KHÔNG câu lệnh ghi nào', async () => {
    const d = truong()
    for (const [duong, b] of LENH) expect((await goi(d, duong, b, false)).ok, duong).toBe(false)
    const ghi = theoDoiGhi(d)
    for (const [duong, b] of LENH) {
      const r = await goi(d, duong, b)
      expect(r.ok, duong).toBe(true)
      expect(r.soTruyVan, duong).toBeLessThanOrEqual(12)
      expect(r.serverNow).toBeTypeOf('number')
    }
    expect(ghi).toEqual([])
  })
})

describe('/gv/tim-em', () => {
  it('gõ không dấu cũng ra; SBD trùng lên đầu, rồi tên bắt đầu bằng, rồi có chứa; ≤ 10; chỉ sbd/hoTen/lop', async () => {
    const d = truong()
    const t = async (q: string) => (await goi(d, '/gv/tim-em', { q })).ds as { sbd: string; hoTen: string; lop: string }[]
    expect((await t('nguyen van an'))[0]).toEqual({ sbd: '1001', hoTen: 'Nguyễn Văn An', lop: '12A' })
    expect((await t('NGUYEN')).map((x) => x.sbd)).toEqual(['1001'])
    expect((await t('1002')).map((x) => x.sbd)).toEqual(['1002'])
    expect((await t('100')).map((x) => x.sbd).sort()).toEqual(['1001', '1002', '1003'])
    expect((await t('anh')).map((x) => x.sbd)).toEqual(['1003']) // "Lê Đức Anh" (không lẫn "An")
    expect((await t('duc anh'))[0]!.sbd).toBe('1003')
    expect(await t('')).toEqual([])
    expect(await t('khong-co-ai')).toEqual([])
    expect(Object.keys((await t('nguyen'))[0]!).sort()).toEqual(['hoTen', 'lop', 'sbd'])
    expect((await goi(d, '/gv/tim-em', { q: 'x'.repeat(61) })).ok).toBe(false)
  })
  it('hơn 10 em khớp ⇒ chỉ 10', async () => {
    const d = truong()
    for (let i = 0; i < 15; i++) themHs(d, `30${String(i).padStart(2, '0')}`, `Học Sinh ${i}`, '12A')
    expect(((await goi(d, '/gv/tim-em', { q: 'hoc sinh' })).ds as unknown[]).length).toBe(10)
  })
  it('thứ hạng: SBD trùng hẳn trước tên chứa chuỗi ấy', async () => {
    const d = truong()
    themHs(d, '5555', 'Đỗ 1001 Test', '12A') // tên chứa "1001"
    expect(((await goi(d, '/gv/tim-em', { q: '1001' })).ds as { sbd: string }[]).map((x) => x.sbd)).toEqual(['1001', '5555'])
  })
})

describe('/gv/chua-nop', () => {
  async function baiDaGiao() {
    const d = dung(3) // S1–S3 (btvn_em) — hồ sơ lớp riêng
    themHs(d, 'S1', 'Em Một', '12A'); themHs(d, 'S2', 'Em Hai', '12A'); themHs(d, 'S3', 'Em Ba', '12B')
    gio(BAY_GIO)
    expect((await giao(d, { cau: cauThay() })).ok).toBe(true)
    return d
  }
  it('bài đang chạy: hạn, đã/chưa nộp, từng em một trạng thái THẬT (chưa mở / dở chặng / quá hạn), xếp quá hạn → chưa mở → dở', async () => {
    const d = await baiDaGiao()
    expect((await mo(d, 'S2')).ok).toBe(true) // S2 đã mở bài (dở chặng 1)
    d.sql.exec("UPDATE btvn_em SET nop_luc = '2026-09-22T02:00:00.000Z' WHERE sbd = 'S3'") // S3 đã nộp
    const r = await goi(d, '/gv/chua-nop', {})
    expect(r.ok).toBe(true)
    expect(r.bai).toHaveLength(1)
    const b = r.bai[0]
    expect(b).toMatchObject({ maBtvn: maBtvn(d), maCa: 'CA1', maDe: 'DE1', caNhan: true, tong: 3, daNop: 1, chuaNop: 2, quaHan: false, lop: '12A' })
    expect(b.em.map((x: { sbd: string; trangThai: string }) => [x.sbd, x.trangThai])).toEqual([['S1', 'chua_mo'], ['S2', 'do_chang']])
    expect(b.em[0]).toMatchObject({ hoTen: 'Em 1', lop: '12A', nhan: 'Chưa mở bài', soNgayQuaHan: 0 })
    expect(b.em[1].nhan).toMatch(/^Dở chặng 1 trong \d+$/)
    expect(b.em[1].chang).toMatchObject({ daXong: 0 })
    expect(b.em[0]).not.toHaveProperty('canhBao')
  })
  it('sau khi thầy cảnh báo: mỗi em có canhBao {id, luc, emDaXem, phuHuynhDaXem}; em xem thì emDaXem = true', async () => {
    const d = await baiDaGiao()
    await goi(d, '/gv/canh-bao-nop-bai', { maBtvn: maBtvn(d), dsSbd: ['S1'] })
    const id = `cb:${maBtvn(d)}:S1:2026-09-22`
    let em = (await goi(d, '/gv/chua-nop', {})).bai[0].em.find((x: { sbd: string }) => x.sbd === 'S1')
    expect(em.canhBao).toEqual({ id, luc: expect.any(String), emDaXem: false, phuHuynhDaXem: false })
    d.sql.exec(`UPDATE canh_bao_thay SET em_xem_luc = '2026-09-22T04:00:00.000Z' WHERE id = '${id}'`)
    em = (await goi(d, '/gv/chua-nop', {})).bai[0].em.find((x: { sbd: string }) => x.sbd === 'S1')
    expect(em.canhBao).toMatchObject({ emDaXem: true, phuHuynhDaXem: false })
  })
  it('quá hạn: nhãn "Quá hạn N ngày" đứng ĐẦU; bài hạn đã quá 3 ngày, bài đã xoá, em thu hồi không hiện; lọc theo lớp', async () => {
    const d = await baiDaGiao()
    gio(new Date('2026-09-30T03:00:00.000Z')) // hạn 29/09 03:00 đã qua > 1 ngày
    d.sql.exec("UPDATE btvn_em SET thu_hoi = 1 WHERE sbd = 'S3'")
    const r = await goi(d, '/gv/chua-nop', { ngay: '2026-09-30' })
    expect(r.bai[0]).toMatchObject({ quaHan: true, tong: 2, chuaNop: 2 })
    expect(r.bai[0].em.map((x: { nhan: string }) => x.nhan)).toEqual(['Quá hạn 1 ngày', 'Quá hạn 1 ngày']) // đúng 24 giờ sau hạn = 1 ngày
    expect(r.bai[0].em[0].trangThai).toBe('qua_han')
    expect((await goi(d, '/gv/chua-nop', { ngay: '2026-09-30', lop: '12B' })).bai).toEqual([]) // S3 (12B) đã thu hồi
    gio(new Date('2026-10-05T03:00:00.000Z')) // quá 3 ngày
    expect((await goi(d, '/gv/chua-nop', { ngay: '2026-10-05' })).bai).toEqual([])
    gio(BAY_GIO)
    d.sql.exec("UPDATE btvn SET da_xoa = 1")
    expect((await goi(d, '/gv/chua-nop', {})).bai).toEqual([])
  })
  it('bài đã có TẤT CẢ em nộp thì không hiện; ngày sai dạng ⇒ lỗi bằng lời', async () => {
    const d = await baiDaGiao()
    d.sql.exec("UPDATE btvn_em SET nop_luc = '2026-09-22T02:00:00.000Z'")
    expect((await goi(d, '/gv/chua-nop', {})).bai).toEqual([])
    expect((await goi(d, '/gv/chua-nop', { ngay: '22/09' })).ok).toBe(false)
  })
})

describe('/gv/can-giup', () => {
  it('trễ nhịp (≥ 3 ngày, trừ ngày nghỉ) · tụt bậc (≥ 3 câu/3 ngày) · dạng yếu; lý do CHÍNH theo thứ tự; ds theo nhiều lý do trước; lọc lớp', async () => {
    const d = truong()
    // 1001: dạng yếu (gặp ≥ 4, khắc phục ít) + làm hôm qua ⇒ chỉ dang_yeu
    await sk(d, '1001', 'Q1', 0, 1); dangHs(d, '1001', 'DA-1', SO_CAU_DU_TIN + 6, 8, 1, 1)
    // 1002: làm câu cuối cách đây 5 ngày ⇒ trễ nhịp 5 ngày (không dạng yếu)
    await sk(d, '1002', 'Q2', 1, 5)
    // 1003: tụt bậc 4 câu trong 3 ngày (ke_hoach_ngay) + hôm qua có làm
    await sk(d, '1003', 'Q3', 1, 1); khNgay(d, '1003', 1, { tut: 4 })
    // 2001: bình thường (không ghi gì) ⇒ KHÔNG có trong danh sách
    const r = await goi(d, '/gv/can-giup', {})
    expect(r.ok).toBe(true)
    expect(r.tong).toBe(3)
    expect(r.lop).toEqual(['12A', '12B'])
    const theo = Object.fromEntries(r.ds.map((x: { sbd: string }) => [x.sbd, x]))
    expect(Object.keys(theo).sort()).toEqual(['1001', '1002', '1003'])
    expect(theo['1001']).toMatchObject({ hoTen: 'Nguyễn Văn An', lop: '12A', lyDo: 'dang_yeu' })
    expect(theo['1001'].dang).toEqual([{ ma: 'DA-1', ten: 'DA-1', sai: 8, gap: SO_CAU_DU_TIN + 6, bac: 'hieu' }])
    expect(theo['1002']).toMatchObject({ lyDo: 'tre_nhip', ngayTre: 5 })
    expect(theo['1003']).toMatchObject({ lyDo: 'tut_bac' })
    expect(theo['1002'].dang).toEqual([])
    const loc = await goi(d, '/gv/can-giup', { lop: '12B' })
    expect(loc.ds.map((x: { sbd: string }) => x.sbd)).toEqual(['1003'])
    expect(loc.tong).toBe(1)
    expect(loc.lop).toEqual(['12A', '12B']) // bộ lọc lớp vẫn đủ các lớp có em cần giúp
  })
  it('ngày nghỉ KHÔNG tính vào trễ nhịp; đúng 2 ngày thì chưa tính', async () => {
    const d = truong()
    await sk(d, '1001', 'Q1', 1, 4) // 4 ngày trước
    d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('ngay_nghi','${JSON.stringify([luc(1, 3).slice(0, 10), luc(2, 3).slice(0, 10)])}','x')`)
    expect((await goi(d, '/gv/can-giup', {})).ds).toEqual([]) // 4 ngày − 2 ngày nghỉ = 2 ⇒ chưa trễ
    d.sql.exec("DELETE FROM cau_hinh WHERE khoa = 'ngay_nghi'")
    expect((await goi(d, '/gv/can-giup', {})).ds.map((x: { sbd: string; ngayTre: number }) => [x.sbd, x.ngayTre])).toEqual([['1001', 4]])
  })
  it('chi tiết dạng: tên dạng từ kho, xu hướng 7 ngày (giảm/tăng/giữ), không có xu hướng khi thiếu câu; ≤ 4 dạng, sai nhiều trước', async () => {
    const d = truong()
    d.sql.exec("INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('X','Q1','v','g','DA-1','{\"tenDang\":\"Thuỷ phân este\"}')")
    for (const [ma, sai] of [['DA-1', 9], ['DA-2', 8], ['DA-3', 7], ['DA-4', 6], ['DA-5', 5]] as const) dangHs(d, '1001', ma, SO_CAU_DU_TIN + 8, sai, 0)
    // DA-1: 7 ngày qua 4 câu đúng 1 · 7 ngày trước 4 câu đúng 4 ⇒ giảm; DA-2: ngược lại ⇒ tăng
    for (let i = 0; i < 4; i++) { await sk(d, '1001', `A${i}`, i === 0 ? 1 : 0, 1, { dang: 'DA-1', lan: i + 1 }); await sk(d, '1001', `B${i}`, 1, 9, { dang: 'DA-1', lan: i + 1 }) }
    for (let i = 0; i < 4; i++) { await sk(d, '1001', `C${i}`, 1, 2, { dang: 'DA-2', lan: i + 1 }); await sk(d, '1001', `E${i}`, i === 0 ? 1 : 0, 10, { dang: 'DA-2', lan: i + 1 }) }
    await sk(d, '1001', 'F0', 0, 1, { dang: 'DA-3' }) // chỉ 1 câu ⇒ không xu hướng
    const e = (await goi(d, '/gv/can-giup', {})).ds[0]
    expect(e.dang.map((x: { ma: string }) => x.ma)).toEqual(['DA-1', 'DA-2', 'DA-3', 'DA-4'])
    expect(e.dang[0]).toMatchObject({ ten: 'Thuỷ phân este', sai: 9, xuHuong: 'giam' })
    expect(e.dang[1]).toMatchObject({ ma: 'DA-2', xuHuong: 'tang', ten: 'DA-2' })
    expect(e.dang[2]).not.toHaveProperty('xuHuong')
  })
})

describe('/gv/vinh-danh-ngay', () => {
  it('bốn bục, mỗi bục MỘT em và CHỈ khi có số > 0; không dữ liệu ⇒ khoá vắng (không bịa)', async () => {
    const d = truong()
    expect(await goi(d, '/gv/vinh-danh-ngay', {})).toEqual({ ok: true, ngay: '2026-09-22', soTruyVan: expect.any(Number), serverNow: expect.any(Number) })
    // chăm nhất: EXP HÔM NAY (1001: 30 + 25 = 55; 1002: 40; 1003 chỉ có EXP hôm qua — không tính)
    for (const [sbd, exp] of [['1001', 30], ['1001', 25], ['1002', 40]] as const) d.sql.prepare("INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu) VALUES(?,?,'2026-09-22','x','q','m',?,?,'')").run(`k${sbd}${exp}`, sbd, exp, luc(0, -6))
    d.sql.prepare("INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu) VALUES('cu','1003','2026-09-21','x','q','m',999,?,'')").run(luc(1))
    // tiến bộ: câu sai nay làm đúng lại trong 7 ngày (1002: 3 câu; 1003: 1 câu) + lần lên bậc (1003: 5, 1002: 1) ⇒ 1002 nhất (đúng lại nhiều hơn)
    for (const [sbd, n] of [['1002', 3], ['1003', 1]] as const) for (let i = 0; i < n; i++) d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,trang_thai,luc_cuoi,nguon_cuoi,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,can_day_lai,cap_nhat_luc) VALUES(?,?,?,'da_khac_phuc',?,'btvn',1,1,0,0,0,0,'x')").run(`${sbd}|${i}`, sbd, `Q${i}`, luc(2))
    khNgay(d, '1003', 1, { len: 5 }); khNgay(d, '1002', 1, { len: 1 })
    // bền bỉ: 1003 đạt 4 ngày (ngày nghỉ giữa chừng KHÔNG đứt chuỗi); 1001 chỉ 1 ngày rồi "không" đứt chuỗi
    khNgay(d, '1003', 3, { kq: 'dat' }); khNgay(d, '1003', 2, { kq: 'dat' }); khNgay(d, '1003', 4, { kq: null, nghi: 1 }); khNgay(d, '1003', 5, { kq: 'dat' })
    khNgay(d, '1001', 2, { kq: 'dat' }); khNgay(d, '1001', 3, { kq: 'khong' })
    // điểm cao: ca nộp GẦN NHẤT trong ngày (C2), em cao nhất ca ấy
    d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cap_nhat_luc) VALUES('C1','Ca sáng','dong','x'),('C2','Ca trưa','dong','x')")
    const luotThi = (ma: string, sbd: string, tong: number, nop: string) => d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,tong,cap_nhat_luc) VALUES(?,?,?,1,'x',?,'da_nop',?,'x')").run(`${ma}|${sbd}`, ma, sbd, nop, tong)
    luotThi('C1', '1001', 9.5, luc(0, -2)); luotThi('C2', '1002', 7.25, luc(0, -1)); luotThi('C2', '1003', 8, luc(0, -1.5)); luotThi('C1', '2001', 3, luc(1))
    const r = await goi(d, '/gv/vinh-danh-ngay', {})
    expect(r.chamNhat).toEqual({ sbd: '1001', hoTen: 'Nguyễn Văn An', lop: '12A', exp: 55 })
    expect(r.tienBoNhat).toEqual({ sbd: '1002', hoTen: 'Trần Thị Bình', lop: '12A', soDangLenBac: 1, soCauDungLai: 3 })
    expect(r.benBiNhat).toEqual({ sbd: '1003', hoTen: 'Lê Đức Anh', lop: '12B', chuoiNgay: 4 })
    expect(r.diemCao).toEqual({ sbd: '1003', hoTen: 'Lê Đức Anh', lop: '12B', diem: 8, tenCa: 'Ca trưa' })
    expect(r.soTruyVan).toBeLessThanOrEqual(12)
    // ngày khác ⇒ bục theo NGÀY ấy (không có EXP/ca ngày 21 ngoài 1003:999 ⇒ chỉ chăm nhất là 1003)
    const homQua = await goi(d, '/gv/vinh-danh-ngay', { ngay: '2026-09-21' })
    expect(homQua.chamNhat).toMatchObject({ sbd: '1003', exp: 999 })
    expect(homQua.diemCao).toEqual({ sbd: '2001', hoTen: 'Phạm Minh Châu', lop: '12B', diem: 3, tenCa: 'Ca sáng' }) // ca nộp trong ngày 21 (2001)
    expect((await goi(d, '/gv/vinh-danh-ngay', { ngay: 'hôm qua' })).ok).toBe(false)
  })
})

describe('/gv/em-toan-canh', () => {
  /** Em 1001 có mọi loại sự kiện. Mốc "hôm nay" = 22/09 10:00 giờ VN. */
  async function emDayDu() {
    const d = truong()
    d.sql.prepare("UPDATE hoc_sinh SET nam_sinh = '2008' WHERE sbd = '1001'").run()
    d.sql.exec("INSERT INTO game_v2_profile(sbd,json,created_at) VALUES('1001','{\"pet\":\"lua_phuong\",\"cap\":7,\"choice\":false}','x')")
    d.sql.prepare("INSERT INTO ph_truy_cap(ngay,sbd,kieu,duong,so,luc) VALUES('2026-09-21','1001','token','ph-ke-hoach',1,?)").run(luc(1, 2))
    d.sql.exec("INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('X','B1-Q1','v','g','DA-1','{\"tenDang\":\"Thuỷ phân este\"}')")
    d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cap_nhat_luc) VALUES('CA1','Ca giữa kỳ','dong','x')")
    d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,tong,so_lan_roi_man,tong_giay_roi_man,cap_nhat_luc) VALUES('CA1|1001','CA1','1001',1,?,?,'da_nop',7.5,1,12,'x')").run(luc(3, 0), luc(3, 0.75))
    d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,chuyen_de,muc_do,dap_an_chon,dap_an_dung,dung_sai,cap_nhat_luc) VALUES('CA1|1001|1|I|14','CA1','1001',1,'I',14,'B1-Q1','c','biet','C','A',0,'x')").run()
    await sk(d, '1001', 'B1-Q1', 0, 2, { nguon: 'btvn', ma: 'BT-1', dang: 'DA-1', giay: 40 })
    for (let i = 2; i <= 4; i++) await sk(d, '1001', `B1-Q${i}`, 1, 2, { nguon: 'btvn', ma: 'BT-1', dang: 'DA-1', giay: 30, lan: i })
    await sk(d, '1001', 'O1', 1, 1, { nguon: 'on_lai', ma: 'OL', dang: 'DA-1' })
    await sk(d, '1001', 'G1', 1, 1, { nguon: 'game', ma: 'GM', dang: 'DA-1' })
    d.sql.prepare("INSERT INTO len_bang(sbd,chuyen_de,qid,dat,luc) VALUES('1001','Este','B1-Q1',1,?)").run(luc(1, 6))
    d.sql.prepare("INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu) VALUES('e1','1001','2026-09-22','x','q','m',40,?,'')").run(luc(0, -1))
    d.sql.prepare("INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu) VALUES('e0','1001','2026-09-20','x','q','m',60,?,'')").run(luc(2, 1))
    const dc = (ngay: string, cheDo: string, loi: string) => d.sql.prepare("INSERT INTO ai_dieu_chinh(sbd,ngay,json,che_do,het_han,nop_luc) VALUES('1001',?,?,?,'2026-09-30',?)").run(ngay, JSON.stringify({ loiNhanChoEm: loi, loiNhanChoPhuHuynh: 'Lời PH' }), cheDo, `${ngay}T21:00:00.000Z`)
    dc('2026-09-20', 'that', 'Em làm đều, thầy thấy.'); dc('2026-09-21', 'bong', 'Bản chạy thử.')
    dangHs(d, '1001', 'DA-1', SO_CAU_DU_TIN + 4, 5, 1, 1)
    d.sql.exec("INSERT INTO canh_bao_thay(id,ma_btvn,sbd,ngay,ten_btvn,han_nop,loi_em,loi_ph,trang_thai_em,gui_luc,em_xem_luc,moc,gui_ph) VALUES('cb:BT-1:1001:2026-09-21','BT-1','1001','2026-09-21','Bài','x','Thầy nhắc em.','p','chua_mo','" + luc(1, 4) + "','" + luc(1, 5) + "','tay',1)")
    return d
  }
  it('đầu trang: em + thần thú + chuỗi + hoạt động cuối + phụ huynh xem cuối + điểm ca gần nhất + EXP hôm nay/tổng; chỉ trường CÓ dữ liệu', async () => {
    const d = await emDayDu()
    const r = await goi(d, '/gv/em-toan-canh', { sbd: '1001' })
    expect(r.ok).toBe(true)
    expect(r.em).toMatchObject({ sbd: '1001', hoTen: 'Nguyễn Văn An', lop: '12A', namSinh: '2008', thanThu: { ten: 'Viêm Sư', cap: 7 }, chuoiNgay: 0, expHomNay: 40, expTong: 100 })
    expect(r.em.phuHuynhXemCuoi).toBe(luc(1, 2))
    expect(r.em.diemCaGanNhat).toEqual({ diem: 7.5, tenCa: 'Ca giữa kỳ', maCa: 'CA1', luc: luc(3, 0.75) })
    expect(r.em.hoatDongCuoi).toMatchObject({ luc: luc(1, 3), viec: expect.any(String) })
    // em KHÔNG có thần thú/EXP/phụ huynh ⇒ các khoá VẮNG (không bịa)
    const trong = (await goi(d, '/gv/em-toan-canh', { sbd: '2001' })).em
    expect(trong).toEqual({ sbd: '2001', hoTen: 'Phạm Minh Châu', lop: '12B', chuoiNgay: 0 })
  })
  it('dòng thời gian: hàng CHIỀU-riêng-lẻ của Bộ não (json.luot = "chieu", chỉ có thử thách) KHÔNG thành thêm một dòng "Bộ não A.I"', async () => {
    const d = await emDayDu()
    const soBoNao = async () => (await goi(d, '/gv/em-toan-canh', { sbd: '1001' })).dong.filter((x: { loai: string }) => x.loai === 'bo_nao').length
    expect(await soBoNao()).toBe(2)
    d.sql.prepare("INSERT INTO ai_dieu_chinh(sbd,ngay,json,che_do,het_han,nop_luc) VALUES('1001','2026-09-22',?,'that','2026-09-30',?)")
      .run(JSON.stringify({ luot: 'chieu', thuThach: { dang: ['DA-1'], soCau: 5, bac: 'dung_bac' }, loiMoi: 'Hôm nay thử mấy câu nhé.', loiNhanChoEm: '', loiNhanChoPhuHuynh: '' }), luc(0, 5))
    expect(await soBoNao()).toBe(2)
  })
  it('dòng thời gian: mới nhất trước; đủ loại (ca, btvn, on_lai, game, len_bang, exp, bo_nao, canh_bao); mota bằng SỐ THẬT; chiTiet có maCa/maBtvn; KHÔNG bao giờ có loại mo_app', async () => {
    const d = await emDayDu()
    const r = await goi(d, '/gv/em-toan-canh', { sbd: '1001' })
    const luc_ = r.dong.map((x: { luc: string }) => x.luc)
    expect([...luc_].sort().reverse()).toEqual(luc_)
    const loai = new Set(r.dong.map((x: { loai: string }) => x.loai))
    expect([...loai].sort()).toEqual(['bo_nao', 'btvn', 'ca', 'canh_bao', 'exp', 'game', 'len_bang', 'on_lai'])
    expect(loai.has('mo_app')).toBe(false)
    const ca = r.dong.find((x: { loai: string }) => x.loai === 'ca')
    expect(ca).toMatchObject({ tieuDe: 'Ca kiểm tra: Ca giữa kỳ', chiTiet: { maCa: 'CA1', mota: 'Làm 45 phút · rời màn 1 lần (12 giây) · điểm 7.5' } })
    expect(ca.chips).toEqual([{ chu: 'Điểm 7.5', muc: 'trung' }, { chu: 'Rời màn 1 lần', muc: 'sai' }])
    const bt = r.dong.find((x: { loai: string }) => x.loai === 'btvn')
    expect(bt.chiTiet).toMatchObject({ maBtvn: 'BT-1', soCau: 4, soDung: 3, mota: 'Làm 4 câu trong 2 phút 10 giây: đúng 3, sai 1' })
    expect(bt.chips).toEqual([{ chu: 'Đúng 3', muc: 'tot' }, { chu: 'Sai 1', muc: 'sai' }, { chu: '2 phút 10 giây', muc: 'trung' }])
    const cb = r.dong.find((x: { loai: string }) => x.loai === 'canh_bao')
    expect(cb).toMatchObject({ tieuDe: 'Cảnh báo của thầy', chiTiet: { maBtvn: 'BT-1', emDaXem: true, phuHuynhDaXem: false, mota: 'Thầy nhắc em.' } })
    const bn = r.dong.filter((x: { loai: string }) => x.loai === 'bo_nao')
    expect(bn.map((x: { tieuDe: string }) => x.tieuDe).sort()).toEqual(['Bộ não A.I', 'Bộ não A.I (chạy thử)']) // nhãn chạy thử/thật
    expect(bn.find((x: { tieuDe: string }) => x.tieuDe === 'Bộ não A.I').chiTiet).toMatchObject({ cheDo: 'that', loiChoEm: 'Em làm đều, thầy thấy.', loiChoPhuHuynh: 'Lời PH' })
    expect(r.dong.find((x: { loai: string }) => x.loai === 'len_bang').chiTiet.mota).toBe('Lên bảng và làm đúng')
    expect(r.dong.find((x: { loai: string }) => x.loai === 'exp' && x.chiTiet.ngay === '2026-09-22').chiTiet.mota).toBe('Nhận 40 EXP trong ngày (1 lần ghi)')
  })
  it('lọc loại + phân trang theo thời gian: ≤ 30/trang, conNua = mốc của dòng cuối, trang sau KHÔNG trùng và đủ', async () => {
    const d = await emDayDu()
    for (let i = 0; i < 40; i++) await ghiSuKien(d.env, [{ nguon: 'on_lai', maNguon: `OLX${i}`, sbd: '1001', qid: `Z${i}`, lan: 1, ketQua: 1, luc: new Date(NAY - (30 + i) * 3_600_000).toISOString(), maDang: 'DA-1' }])
    const t1 = await goi(d, '/gv/em-toan-canh', { sbd: '1001', loai: ['on_lai'] })
    expect(t1.dong).toHaveLength(30)
    expect(t1.dong.every((x: { loai: string }) => x.loai === 'on_lai')).toBe(true)
    expect(t1.conNua).toBe(t1.dong[29].luc)
    const t2 = await goi(d, '/gv/em-toan-canh', { sbd: '1001', loai: ['on_lai'], truoc: t1.conNua })
    expect(t2.dong.length).toBeGreaterThan(0)
    expect(t2.dong.length).toBeLessThanOrEqual(30)
    expect(t2.dong.every((x: { luc: string }) => x.luc < t1.conNua)).toBe(true)
    expect(t1.dong.length + t2.dong.length).toBe(41) // 40 mới + 1 sự kiện on_lai cũ
    expect(t2).not.toHaveProperty('conNua')
    expect((await goi(d, '/gv/em-toan-canh', { sbd: '1001', truoc: 'không phải giờ' })).ok).toBe(false)
    expect((await goi(d, '/gv/em-toan-canh', { sbd: '1001', loai: ['mo_app'] })).dong).toHaveLength(30) // loại lạ bị bỏ ⇒ lọc rỗng = mọi loại
  })
  it('bản đồ dạng (bậc chữ, gặp/sai/khắc phục, xu hướng, câu sai gần nhất kèm em chọn/đáp án) và nhịp 30 ngày đủ 30 ô', async () => {
    const d = await emDayDu()
    const r = await goi(d, '/gv/em-toan-canh', { sbd: '1001' })
    expect(r.dang).toHaveLength(1)
    expect(r.dang[0]).toMatchObject({ ma: 'DA-1', ten: 'Thuỷ phân este', bac: 'hieu', gap: SO_CAU_DU_TIN + 4, sai: 5, khacPhuc: 1, cauSaiGanNhat: { stt: 14, emChon: 'C', dapAn: 'A' } })
    expect(r.nhip30).toHaveLength(30)
    expect(r.nhip30[29]).toMatchObject({ ngay: '2026-09-22' })
    expect(r.nhip30[0].ngay).toBe('2026-08-24')
    const theoNgay = Object.fromEntries(r.nhip30.map((x: { ngay: string; muc: number }) => [x.ngay, x.muc]))
    expect(theoNgay['2026-09-20']).toBe(1) // 4 câu btvn = mức 1 (1–4 câu)
    expect(theoNgay['2026-09-21']).toBe(1) // on_lai + game = 2 câu
    expect(theoNgay['2026-09-10']).toBe(0)
  })
  it('lỗi bằng lời: thiếu sbd, sbd lạ; em không có gì thì dong = [] (không bịa)', async () => {
    const d = truong()
    expect((await goi(d, '/gv/em-toan-canh', {})).ok).toBe(false)
    expect((await goi(d, '/gv/em-toan-canh', { sbd: 'KHONG-CO' })).error).toContain('Không tìm thấy')
    const r = await goi(d, '/gv/em-toan-canh', { sbd: '2001' })
    expect(r).toMatchObject({ ok: true, dong: [], dang: [] })
    expect(r.nhip30.every((x: { muc: number }) => x.muc === 0)).toBe(true)
    expect(r).not.toHaveProperty('conNua')
  })
})
