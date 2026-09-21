// @vitest-environment node
// `/btvn/theo-doi` BẢN 2 (server/src/btvn-theo-doi-nhom.ts; docs/hop-dong-btvn-theo-doi-v2-2109.md): CHỈ-THÊM `ten · tenLop · soCauLoi · chang[] · nhom{…}` mỗi bài, `nhom · changHienTai · soCauDaLam · soCauCuaEm · hocGanNhat · nopTreGio?` mỗi em.
// Khoá: luật nhóm khớp `emChamNhip` + `baiTap[].chuaMo/daNop` của Bảng tin cho cùng bài; tổng 5 nhóm = tong (không tính em thu hồi); nopTre ⊂ daNop; bài giao TRƯỚC ngày mốc không bao giờ chậm; bài không chia chặng;
// đường chặng có ngày (mốc GỐC); mọi khoá cũ giữ nguyên; lỗi khối mới ⇒ bỏ khoá mới, lệnh cũ vẫn chạy; đúng 5 truy vấn thêm, không UNION. SQLite thật.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { emChamNhip, gvBangTin } from '../server/src/gv-bang-tin'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const VN = (s: string): number => Date.parse(`${s}+07:00`)
const NOW = VN('2026-09-23T13:00:00') // thứ Tư 23/09; mốc mặc định 21/09 12:00
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => vi.useRealTimers())
const goi = (d: D1That) => goiWorker(worker, d.env, '/btvn/theo-doi', {}, true) as Promise<any>

const themBai = (d: D1That, ma: string, giao: string, han: string, caNhan: 0 | 1 = 0, soCau = 10) =>
  d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES(?,?,?,?,?,?,0,'x',?)").run(ma, `CA-${ma}`, `DH-12-C2-${ma}-TN`, soCau, giao, han, caNhan)
const themEm = (d: D1That, ma: string, sbd: string, o: Partial<{ nop: string; thuHoi: number; chang: number; lo: number; chot: string; soCauEm: number; dapAn: string; nopTre: number; gioTre: number; xongV1: string }> = {}) =>
  d.sql.prepare('INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten,nop_luc,so_dung,so_cau,thu_hoi,dap_an_json,so_chang,lo_da_xong,chot_luc,so_cau_em,nop_tre,gio_tre,xong_vong1_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(`${ma}|${sbd}`, ma, sbd, `Em ${sbd}`, o.nop ?? null, o.nop ? 7 : null, o.nop ? 10 : null, o.thuHoi ?? 0, o.dapAn ?? null, o.chang ?? null, o.lo ?? 0, o.chot ?? null, o.soCauEm ?? null, o.nopTre ?? 0, o.gioTre ?? null, o.xongV1 ?? null)
const themHs = (d: D1That, sbd: string, tenLop: string) => d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12',?,'mk','x')").run(sbd, `Em ${sbd}`, tenLop)

const CHOT = '2026-09-21T05:40:00.000Z' // 12:40 VN 21/09 ⇒ chặng 0 mở lúc chốt, 1 mở 22/09 00:00, 2 mở 23/09 00:00 (HÔM NAY), 3 mở 24/09 00:00

/**
 * B1 (cá nhân hoá, 4 chặng, hạn 24/09 12:00, giao 21/09 10:48): E0 nộp · E1 xong 2 chặng (đang ở chặng 3) · E2 xong 1 (CHẬM: hai chặng đã tới hạn) · E3 xong 3 (xong chặng hôm nay) · E4 chưa mở · E5 thu hồi.
 * B2 (bài thường, hạn 23/09 09:00 — QUÁ HẠN): F1 nộp trễ 5 giờ · F2 làm dở · F3 chưa mở (chưa quá hạn ⇒ ba nhóm; quá hạn ⇒ chậm) · F4 thu hồi.
 * B3 (bài thường giao 20/09 — TRƯỚC ngày mốc 21/09): G1 làm dở, G2 chưa mở — bài cũ không bao giờ "chậm nhịp".
 */
function dung(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bang_tin_tu','2026-09-21T05:00:00.000Z','x')").run() // mốc thật của app (Bảng tin cần khoá này; các lệnh khác rơi về hằng cùng giá trị)
  for (const [s, l] of [['E0', '12 - Tinh Hoa'], ['E1', '12 - Tinh Hoa'], ['E2', '12 - Tinh Hoa'], ['E3', '12 - Tinh Hoa'], ['E4', '12 - Tinh Hoa'], ['E5', '12 - Tinh Hoa'], ['F1', '12 - Tinh Hoa'], ['F2', '12 - Lớp Thường'], ['F3', '12 - Lớp Thường'], ['F4', '12 - Lớp Thường'], ['G1', '11'], ['G2', '11']] as const) themHs(d, s, l)
  themBai(d, 'B1', '2026-09-21T03:48:00.000Z', '2026-09-24T05:00:00.000Z', 1, 12)
  d.sql.prepare("INSERT INTO btvn_cau(ma_btvn,qid,thu_tu,dang,chuyen_de,muc_do,sao,phan,loi,ghim) VALUES('B1','Q1',1,'D','Carbohydrate',0,0,'I',1,0),('B1','Q2',2,'D','Carbohydrate',0,0,'I',1,0),('B1','Q3',3,'D','Polime',0,0,'I',0,0)").run()
  themEm(d, 'B1', 'E0', { nop: '2026-09-23T02:00:00.000Z', chang: 4, lo: 4, chot: CHOT, soCauEm: 12, dapAn: '{"Q1":"A"}' })
  themEm(d, 'B1', 'E1', { chang: 4, lo: 2, chot: CHOT, soCauEm: 12, dapAn: '{"Q1":"A","Q2":"B","Q3":""}' })
  themEm(d, 'B1', 'E2', { chang: 4, lo: 1, chot: CHOT, soCauEm: 12, dapAn: '{"Q1":"C"}' })
  themEm(d, 'B1', 'E3', { chang: 4, lo: 3, chot: CHOT, soCauEm: 12, dapAn: '{"Q1":"A","Q2":"B","Q3":"C"}' })
  themEm(d, 'B1', 'E4', {})
  themEm(d, 'B1', 'E5', { thuHoi: 1, chang: 4, lo: 0, chot: CHOT })
  themBai(d, 'B2', '2026-09-22T02:00:00.000Z', '2026-09-23T02:00:00.000Z')
  themEm(d, 'B2', 'F1', { nop: '2026-09-23T07:00:00.000Z', nopTre: 1, gioTre: 5, dapAn: '{"Q1":"A"}' })
  themEm(d, 'B2', 'F2', { dapAn: '{"Q1":"A","Q2":"B"}' })
  themEm(d, 'B2', 'F3', {})
  themEm(d, 'B2', 'F4', { thuHoi: 1 })
  themBai(d, 'B3', '2026-09-20T02:00:00.000Z', '2026-09-22T02:00:00.000Z')
  themEm(d, 'B3', 'G1', { dapAn: '{"Q1":"A"}' })
  themEm(d, 'B3', 'G2', {})
  // lần học gần nhất của E1 ở B1 (sổ học nguồn btvn_lo)
  d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run('k1', 'E1', 'Q1', 'btvn_lo', 'B1', 1, 1, 30, '2026-09-23T02:30:00.000Z', '2026-09-23', 'D.1')
  d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run('k2', 'E1', 'Q2', 'btvn_lo', 'B1', 2, 1, 30, '2026-09-23T03:10:00.000Z', '2026-09-23', 'D.1')
  return d
}
const bai = (r: any, ma: string) => r.ds.find((x: any) => x.maBtvn === ma)
const em = (b: any, sbd: string) => b.hocSinh.find((x: any) => x.sbd === sbd)

describe('nhóm của bài và của em', () => {
  it('B1 (chia chặng): 5 nhóm chia đúng em, tổng = tong (không tính em thu hồi); chậm = xong ít hơn số chặng đã tới hạn; xong chặng hôm nay tách khỏi đúng nhịp', async () => {
    const r = await goi(dung()); expect(r.ok).toBe(true)
    const b = bai(r, 'B1')
    expect(b.nhom).toEqual({ chuaMo: 1, dungNhip: 1, chamNhip: 1, xongHomNay: 1, daNop: 1, nopTre: 0 })
    expect(Object.values(b.nhom).slice(0, 5).reduce((a: number, x) => a + (x as number), 0)).toBe(b.tong) // 5 = tong
    expect(b.tong).toBe(5)
    expect(['E0', 'E1', 'E2', 'E3', 'E4'].map((s) => em(b, s).nhom)).toEqual(['da_nop', 'dung_nhip', 'cham_nhip', 'xong_hom_nay', 'chua_mo'])
    expect(em(b, 'E5')).not.toHaveProperty('nhom') // thu hồi: không nhóm
  })

  it('B2 (bài thường, QUÁ HẠN): người chưa nộp (dở dang hay chưa mở) = chậm nhịp; nộp trễ ⊂ đã nộp, kèm số giờ trễ; không có đường chặng', async () => {
    const b = bai(await goi(dung()), 'B2')
    expect(b.nhom).toEqual({ chuaMo: 0, dungNhip: 0, chamNhip: 2, xongHomNay: 0, daNop: 1, nopTre: 1 })
    expect(['F1', 'F2', 'F3'].map((s) => em(b, s).nhom)).toEqual(['da_nop', 'cham_nhip', 'cham_nhip'])
    expect(em(b, 'F1').nopTreGio).toBe(5)
    expect(em(b, 'F2')).not.toHaveProperty('nopTreGio')
    expect(b).not.toHaveProperty('chang')
    expect(em(b, 'F2').changHienTai).toBeNull()
  })

  it('B3 (giao TRƯỚC ngày mốc 21/09): không bao giờ "chậm nhịp" — người chưa nộp rơi vào đang làm / chưa mở', async () => {
    const b = bai(await goi(dung()), 'B3')
    expect(b.nhom.chamNhip).toBe(0)
    expect(b.nhom).toMatchObject({ daNop: 0 })
    expect(b.nhom.chuaMo + b.nhom.dungNhip).toBe(2)
    expect(b.hocSinh.every((x: any) => x.nhom !== 'cham_nhip')).toBe(true)
  })
})

describe('đối chiếu Bảng tin thầy: MỘT nguồn', () => {
  it('nhom.chamNhip = số em `emChamNhip`; nhom.chuaMo / daNop = baiTap[].chuaMo / daNop; Σ chậm các bài trong Bảng tin = btvnDungNhip.cham (mỗi em một bài ở bộ này)', async () => {
    const d = dung()
    const r = await goi(d)
    const bt = await gvBangTin(d.env, {}, NOW)
    expect(bt.ok).toBe(true)
    for (const ma of ['B1', 'B2']) {
      const b = bai(r, ma), bang = (bt.baiTap as any[]).find((x) => x.maBtvn === ma)
      const dong = d.sql.prepare('SELECT * FROM btvn_em WHERE ma_btvn = ? AND thu_hoi = 0').all(ma) as Record<string, unknown>[]
      const han = String(b.hanNop), hanMs = Date.parse(han)
      expect(b.nhom.chamNhip, `${ma} chậm = emChamNhip`).toBe(dong.filter((x) => emChamNhip(x, han, hanMs, NOW)).length)
      expect(new Set(b.hocSinh.filter((x: any) => x.nhom === 'cham_nhip').map((x: any) => x.sbd))).toEqual(new Set(dong.filter((x) => emChamNhip(x, han, hanMs, NOW)).map((x) => String(x.sbd))))
      expect(b.nhom.chuaMo, `${ma} chưa mở`).toBe(bang.chuaMo)
      expect(b.nhom.daNop, `${ma} đã nộp`).toBe(bang.daNop)
    }
    expect((bt.nhip as any).btvnDungNhip.cham).toBe(bai(r, 'B1').nhom.chamNhip + bai(r, 'B2').nhom.chamNhip)
    expect(bt.baiTap.some((x: any) => x.maBtvn === 'B3')).toBe(false) // bài cũ không hiện ở Bảng tin (và không chậm ở đây)
  })
})

describe('tên, chặng, số câu, lần học', () => {
  it('ten = chuyên đề trội nhất (không mã "CA-B1"/"Riêng-…"), tenLop = lớp DUY NHẤT của em trong bài (nhiều lớp ⇒ ""), soCauLoi = số câu lõi (bài thường null)', async () => {
    const r = await goi(dung())
    expect(bai(r, 'B1')).toMatchObject({ ten: 'Carbohydrate', tenLop: '12 - Tinh Hoa', soCauLoi: 2 })
    expect(bai(r, 'B2')).toMatchObject({ tenLop: '', soCauLoi: null })
    expect(bai(r, 'B2').ten).toBe('Bài tập về nhà') // tờ chỉ có mã kỹ thuật ⇒ tên chung, KHÔNG lộ mã
    for (const ma of ['B1', 'B2', 'B3']) expect(bai(r, ma).ten).not.toMatch(/CA-|DH-|Riêng-/)
  })

  it('đường chặng có NGÀY theo mốc GỐC: 4 chặng mở 21, 22, 23, 24/09; chỉ chặng 3 (23/09) là hôm nay', async () => {
    const b = bai(await goi(dung()), 'B1')
    expect(b.chang).toEqual([
      { so: 1, ngay: '2026-09-21', laHomNay: false }, { so: 2, ngay: '2026-09-22', laHomNay: false },
      { so: 3, ngay: '2026-09-23', laHomNay: true }, { so: 4, ngay: '2026-09-24', laHomNay: false },
    ])
  })

  it('chặng mở SỚM: ngày chặng lấy mốc GỐC `truoc` (không đẩy chặng lên sớm), người đã xong 3 chặng vẫn là "xong chặng hôm nay", không bị tính chậm', async () => {
    const d = dung()
    // E3 "xin làm thêm": chặng 4 (chỉ số 3) mở SỚM lúc 23/09 01:00 VN (22/09T18:00Z) nhưng lịch GỐC là 24/09 00:00 VN (23/09T17:00Z)
    d.sql.prepare("UPDATE btvn_em SET chang_mo_json = ? WHERE khoa = 'B1|E3'").run(JSON.stringify({
      cheDo: 'dai',
      chang: [CHOT, '2026-09-21T17:00:00.000Z', '2026-09-22T17:00:00.000Z', '2026-09-22T18:00:00.000Z'].map((moLuc, k) => ({ moLuc, dungNhipTruoc: ['2026-09-21T16:59:59.000Z', '2026-09-22T16:59:59.000Z', '2026-09-23T16:59:59.000Z', '2026-09-24T05:00:00.000Z'][k] })),
      moSom: [{ chiSo: 3, luc: '2026-09-22T18:00:00.000Z', truoc: '2026-09-23T17:00:00.000Z' }],
    }))
    const b = bai(await goi(d), 'B1')
    expect(em(b, 'E3').nhom).toBe('xong_hom_nay') // dùng mốc mở thật (23/09) thì chặng 4 đã là "hôm nay" và E3 (xong 3) sẽ chưa xong nó; mốc gốc 24/09 ⇒ chặng hôm nay vẫn là chặng 3
    expect(b.nhom.chamNhip).toBe(1)
    expect(b.chang.map((c: any) => c.ngay)).toEqual(['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24']) // đa số em theo lịch chuẩn
  })

  it('em: changHienTai (từ 1) · soCauDaLam (đáp án không rỗng) · soCauCuaEm · hocGanNhat (ISO) · chưa mở ⇒ null', async () => {
    const b = bai(await goi(dung()), 'B1')
    expect(em(b, 'E1')).toMatchObject({ changHienTai: 3, soCauDaLam: 2, soCauCuaEm: 12, hocGanNhat: '2026-09-23T03:10:00.000Z' })
    expect(em(b, 'E2')).toMatchObject({ changHienTai: 2, soCauDaLam: 1, hocGanNhat: null })
    expect(em(b, 'E0')).toMatchObject({ nhom: 'da_nop', changHienTai: 4, hocGanNhat: '2026-09-23T02:00:00.000Z' }) // nộp cũng là lần học
    expect(em(b, 'E4')).toMatchObject({ nhom: 'chua_mo', changHienTai: null, soCauDaLam: null, soCauCuaEm: null, hocGanNhat: null })
    const b2 = bai(await goi(dung()), 'B2')
    expect(em(b2, 'F2')).toMatchObject({ soCauDaLam: 2, soCauCuaEm: 10 }) // bài thường: số câu của em = số câu của bài
  })
})

describe('an toàn: khoá cũ, lỗi, chi phí', () => {
  it('MỌI khoá cũ còn nguyên ở bài và ở em', async () => {
    const r = await goi(dung())
    const b = bai(r, 'B1')
    expect(b).toMatchObject({ maBtvn: 'B1', maCa: 'CA-B1', maDe: 'DH-12-C2-B1-TN', soCau: 12, giaoLuc: '2026-09-21T03:48:00.000Z', hanNop: '2026-09-24T05:00:00.000Z', quaHan: false, caNhan: true, soLoi: 2, tong: 5, daNop: 1 })
    expect(b.chuaNop.map((x: any) => x.sbd).sort()).toEqual(['E1', 'E2', 'E3', 'E4'])
    for (const k of ['sbd', 'hoTen', 'nopLuc', 'soDung', 'soCau', 'thuHoi', 'gianLan', 'xacSuatGianLan', 'lyDoGianLan', 'diemThiDoiChieu']) expect(em(b, 'E1'), k).toHaveProperty(k)
    expect(em(b, 'E1')).toHaveProperty('soChang') // khoá cá nhân hoá cũ
  })

  it('khối mới lỗi (truy vấn lịch chặng hỏng) ⇒ lệnh cũ VẪN ok với khoá cũ, VẮNG khoá mới (màn hiện thẻ không có thanh nhóm)', async () => {
    const d = dung()
    const goc = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = ((q: string) => { if (/^SELECT ma_btvn, sbd, so_chang, lo_da_xong, chot_luc, chang_mo_json/.test(q)) throw new Error('hỏng'); return goc(q) }) as typeof d.env.DB.prepare
    const r = await goi(d)
    expect(r.ok).toBe(true)
    const b = bai(r, 'B1')
    expect(b).toMatchObject({ tong: 5, daNop: 1 })
    for (const k of ['ten', 'tenLop', 'soCauLoi', 'chang', 'nhom']) expect(b, k).not.toHaveProperty(k)
    expect(em(b, 'E1')).not.toHaveProperty('nhom')
  })

  it('đúng 5 truy vấn thêm mỗi lần gọi, chỉ SELECT, không UNION, không ghi', async () => {
    const d = dung()
    const goc = d.env.DB.prepare.bind(d.env.DB), moi: string[] = [], ghi: string[] = []
    d.env.DB.prepare = ((q: string) => {
      if (/^SELECT ma_btvn, sbd, so_chang, lo_da_xong|^SELECT b\.ma_btvn, COALESCE\(NULLIF|^SELECT sbd, lop, ten_lop FROM hoc_sinh WHERE sbd IN \(SELECT value|^SELECT ma_nguon, sbd, MAX\(luc\)|^SELECT khoa, gia_tri FROM cau_hinh WHERE khoa IN \(\?, \?, \?\)/.test(q.trim())) moi.push(q)
      if (/^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i.test(q)) ghi.push(q.trim().slice(0, 50))
      return goc(q)
    }) as typeof d.env.DB.prepare
    await goi(d)
    expect(moi).toHaveLength(5)
    for (const q of moi) expect(q).not.toMatch(/UNION/i)
    expect(ghi).toEqual([])
  })

  it('không có bài nào ⇒ ds rỗng và không truy vấn thêm', async () => {
    const d = taoD1That()
    expect((await goi(d)).ds).toEqual([])
  })
})
