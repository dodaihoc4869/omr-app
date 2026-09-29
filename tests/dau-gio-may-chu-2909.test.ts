// @vitest-environment node
// KIỂM TRA ĐẦU GIỜ (đặc tả docs/DAC-TA-KIEM-TRA-DAU-GIO-SO-NO-2909.md mục B + nghiệm thu E.3) — máy chủ `server/src/dau-gio.ts` trên D1 thật (node:sqlite, đủ migration)
// + phần thuần `src/lib/dau-gio.ts`. Khoá: ≤ 6 em/lượt; không trùng câu trong lượt; KHÔNG lặp câu cũ của em qua các buổi; chỉ câu em đã làm ĐÚNG (lần gần nhất);
// em hết câu ⇒ bỏ qua; Gọi thêm không trùng em đã gọi; Kết thúc ⇒ em chưa chấm không ghi gì; chấm idempotent (buổi + em + câu), sổ nguon='dau_gio' 1/0;
// "Thầy đã chữa" ⇒ nhãn + mốc dạy lại `srs2_day_lai`; dòng lịch sử "Sai 20/09 (Ca) · Đúng 22/09 (Đoàn) · Đúng 25/09 (Bi-a)".
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvBuoiHoc } from '../server/src/buoi-hoc'
import { gvDauGio } from '../server/src/dau-gio'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import { BANG_XOA, BANG_GIU } from '../server/src/reset-toan-app'
import { BANG_GIU_HOA2 } from '../server/src/reset-hoa2'
import { tenNguon } from '../server/src/ho-so-em-chieu'
import { chonLuotDauGio, chuLichSuCau, diemThanhThaoAo, xepUngVien, type EmUngVien } from '../src/lib/dau-gio'
import { docHoSo2, layKeHoachHomNay } from '../server/src/srs2-d1'
import { laNo } from '../server/src/srs2-loi'
import { gvChienDich } from '../server/src/srs2-gv'

const T0 = Date.parse('2026-09-29T11:00:00.000Z') // 18:00 giờ VN
const ngayTruoc = (n: number, gio = 3) => new Date(T0 - n * 864e5 - gio * 3600e3).toISOString()
/** rng cố định (LCG) — test khoá được thứ tự. */
const rngCo = (seed = 7) => {
  let x = seed
  return () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648)
}

async function fixture(soEm = 3) {
  const d = taoD1That()
  const em = Array.from({ length: soEm }, (_, i) => `S${i + 1}`)
  d.sql.exec(`INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES ${em.map((s, i) => `('${s}','Học Sinh ${i + 1}','12','mk','x')`).join(',')}`)
  const env = d.env
  const mo = (await gvBuoiHoc(env, { action: 'mo', lop: '' }, T0)) as any
  await gvBuoiHoc(env, { action: 'them-em', id: mo.buoi.id, sbd: em }, T0)
  return { d, env, buoiId: mo.buoi.id as string, em }
}
const sk = (sbd: string, qid: string, ketQua: 0 | 1, luc: string, nguon: SuKien['nguon'] = 'game', maNguon = 'P'): SuKien => ({ nguon, maNguon, sbd, qid, lan: 1, ketQua, luc })
const g = (env: any, b: Record<string, unknown>, now = T0) => gvDauGio(env, b, now) as Promise<any>

describe('phần thuần — chọn lượt, điểm thành thạo ảo, dòng lịch sử', () => {
  it('≤ 6 em/lượt, mỗi em 1 câu, không trùng câu giữa các em; em đã gọi bị bỏ; em hết câu ⇒ bỏ qua', () => {
    const chung = ['Q1', 'Q2', 'Q3'].map((qid) => ({ qid, soLan: 1, dungLanDau: true, lanCuoi: ngayTruoc(10) }))
    const em: EmUngVien[] = Array.from({ length: 9 }, (_, i) => ({ sbd: `S${i + 1}`, hoTen: '', cau: i < 8 ? [...chung, { qid: `R${i}`, soLan: 1, dungLanDau: true, lanCuoi: ngayTruoc(10) }] : [] }))
    for (let seed = 1; seed < 30; seed++) {
      const r = chonLuotDauGio(em, { rng: rngCo(seed), nowMs: T0, daGoi: new Set(['S2']) })
      expect(r.length).toBeLessThanOrEqual(6)
      expect(new Set(r.map((x) => x.qid)).size).toBe(r.length)
      expect(new Set(r.map((x) => x.sbd)).size).toBe(r.length)
      expect(r.some((x) => x.sbd === 'S2' || x.sbd === 'S9')).toBe(false)
      expect(r.length).toBe(6)
    }
    // câu đã chiếu ở lượt trước của buổi không dùng lại
    const r = chonLuotDauGio([{ sbd: 'A', hoTen: '', cau: chung }], { cauDaDung: new Set(['Q1', 'Q2', 'Q3']), rng: rngCo(), nowMs: T0 })
    expect(r).toEqual([])
  })

  it('"thành thạo ảo" trước: đúng ngay lần đầu + lâu chưa gặp > câu từng sai rồi sửa, mới gặp', () => {
    const ao = { qid: 'AO', soLan: 1, dungLanDau: true, lanCuoi: ngayTruoc(40) }
    const sua = { qid: 'SUA', soLan: 3, dungLanDau: false, lanCuoi: ngayTruoc(1) }
    expect(diemThanhThaoAo(ao, T0)).toBeGreaterThan(diemThanhThaoAo(sua, T0))
    expect(xepUngVien([sua, ao], T0).map((x) => x.qid)).toEqual(['AO', 'SUA'])
  })

  it('dòng lịch sử cũ → mới, đúng nhãn nguồn; nhiều lần thì giữ các lần mới nhất', () => {
    expect(
      chuLichSuCau([
        { luc: '2026-09-25T03:00:00Z', dung: true, nguon: 'Bi-a' },
        { luc: '2026-09-20T03:00:00Z', dung: false, nguon: 'Ca' },
        { luc: '2026-09-22T03:00:00Z', dung: true, nguon: 'Đoàn' },
      ]),
    ).toBe('Sai 20/09 (Ca) · Đúng 22/09 (Đoàn) · Đúng 25/09 (Bi-a)')
    const nhieu = Array.from({ length: 8 }, (_, i) => ({ luc: `2026-09-${String(10 + i).padStart(2, '0')}T03:00:00Z`, dung: true, nguon: 'Đảo' }))
    expect(chuLichSuCau(nhieu, 3)).toBe('… Đúng 15/09 (Đảo) · Đúng 16/09 (Đảo) · Đúng 17/09 (Đảo)')
  })
})

describe('/gv/dau-gio — ứng viên', () => {
  it('chỉ câu em đã làm ĐÚNG ở lần gần nhất (kể cả đã khắc phục), mọi nguồn; bỏ câu đang nợ và kết quả CHE; em vắng không vào', async () => {
    const { env, buoiId, d } = await fixture(2)
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('VANG','Vắng Mặt','12','mk','x')")
    await ghiSuKien(env, [
      sk('S1', 'Q-DUNG', 1, ngayTruoc(9), 'thi', 'CA1'),
      sk('S1', 'Q-SUA', 0, ngayTruoc(8)),
      sk('S1', 'Q-SUA', 1, ngayTruoc(2), 'khac_phuc', 'KP'),
      sk('S1', 'Q-NO', 1, ngayTruoc(8)),
      sk('S1', 'Q-NO', 0, ngayTruoc(1), 'luyen', 'L'),
      { ...sk('S1', 'Q-CHE', 1, ngayTruoc(1), 'thi', 'CA2'), visibility: 'embargoed' },
      sk('VANG', 'Q-DUNG', 1, ngayTruoc(3)),
    ])
    const r = await g(env, { action: 'ung-vien', buoiId })
    expect(r.ok).toBe(true)
    expect(r.em.map((e: any) => e.sbd)).toEqual(['S1', 'S2'])
    const s1 = r.em.find((e: any) => e.sbd === 'S1')
    expect(s1.cau.map((c: any) => c.qid).sort()).toEqual(['Q-DUNG', 'Q-SUA'])
    expect(s1.cau.find((c: any) => c.qid === 'Q-DUNG')).toMatchObject({ soLan: 1, dungLanDau: true })
    expect(s1.cau.find((c: any) => c.qid === 'Q-SUA')).toMatchObject({ soLan: 2, dungLanDau: false })
    expect(s1.cau[0].qid).toBe('Q-DUNG') // thành thạo ảo trước
    expect(r.em.find((e: any) => e.sbd === 'S2').cau).toEqual([])
  })
})

describe('/gv/dau-gio — chốt lượt, gọi thêm, không lặp câu qua các buổi', () => {
  it('máy chủ từ chối: > 6 em, em vắng, trùng câu trong lượt, câu em chưa làm đúng; nhận phần hợp lệ', async () => {
    const { env, buoiId, em } = await fixture(8)
    await ghiSuKien(env, em.flatMap((s) => [sk(s, 'Q1', 1, ngayTruoc(5)), sk(s, `R-${s}`, 1, ngayTruoc(5))]))
    const bay = em.slice(0, 7).map((s) => ({ sbd: s, qid: `R-${s}` }))
    expect((await g(env, { action: 'chot', buoiId, cap: bay })).ok).toBe(false)
    const r = await g(env, {
      action: 'chot',
      buoiId,
      cap: [
        { sbd: 'S1', qid: 'Q1' },
        { sbd: 'S2', qid: 'Q1' }, // trùng câu trong lượt
        { sbd: 'S3', qid: 'KHONG-LAM' }, // chưa làm đúng
        { sbd: 'NGOAI', qid: 'Q1' }, // không có mặt
        { sbd: 'S4', qid: 'R-S4' },
      ],
    })
    expect(r.ok).toBe(true)
    expect(r.luot).toBe(1)
    expect(r.nhan).toEqual([
      { sbd: 'S1', qid: 'Q1' },
      { sbd: 'S4', qid: 'R-S4' },
    ])
    expect(r.tuChoi.map((x: any) => x.lyDo)).toEqual(['trung_cau', 'chua_lam_dung', 'khong_co_mat'])
    // Gọi thêm: em đã gọi trong buổi không vào ứng viên, câu đã chiếu trong buổi không vào; chốt lại em cũ bị từ chối
    const uv = await g(env, { action: 'ung-vien', buoiId })
    expect(uv.em.map((e: any) => e.sbd)).not.toContain('S1')
    expect(uv.em.find((e: any) => e.sbd === 'S2').cau.map((c: any) => c.qid)).toEqual(['R-S2'])
    const lai = await g(env, { action: 'chot', buoiId, cap: [{ sbd: 'S1', qid: 'R-S1' }, { sbd: 'S2', qid: 'R-S2' }] })
    expect(lai.luot).toBe(2)
    expect(lai.tuChoi).toEqual([{ sbd: 'S1', qid: 'R-S1', lyDo: 'da_goi' }])
    expect(lai.ds.map((x: any) => [x.sbd, x.qid, x.luot])).toEqual([
      ['S1', 'Q1', 1],
      ['S4', 'R-S4', 1],
      ['S2', 'R-S2', 2],
    ])
  })

  it('buổi SAU gọi lại em ⇒ câu KHÁC hoàn toàn; em hết câu chưa hỏi ⇒ không còn ứng viên (bỏ qua ở lượt đó)', async () => {
    const { env, buoiId } = await fixture(1)
    await ghiSuKien(env, [sk('S1', 'Q1', 1, ngayTruoc(5)), sk('S1', 'Q2', 1, ngayTruoc(5))])
    expect((await g(env, { action: 'chot', buoiId, cap: [{ sbd: 'S1', qid: 'Q1' }] })).nhan).toHaveLength(1)
    // buổi mới (hôm sau)
    const T1 = T0 + 864e5
    const mo2 = (await gvBuoiHoc(env, { action: 'mo', lop: '' }, T1)) as any
    await gvBuoiHoc(env, { action: 'them-em', id: mo2.buoi.id, sbd: ['S1'] }, T1)
    const uv = await g(env, { action: 'ung-vien', buoiId: mo2.buoi.id }, T1)
    expect(uv.em[0].cau.map((c: any) => c.qid)).toEqual(['Q2'])
    const cu = await g(env, { action: 'chot', buoiId: mo2.buoi.id, cap: [{ sbd: 'S1', qid: 'Q1' }] }, T1)
    expect(cu.tuChoi).toEqual([{ sbd: 'S1', qid: 'Q1', lyDo: 'da_hoi' }])
    await g(env, { action: 'chot', buoiId: mo2.buoi.id, cap: [{ sbd: 'S1', qid: 'Q2' }] }, T1)
    // buổi thứ ba: hết câu ⇒ app không gọi em này
    const T2 = T1 + 864e5
    const mo3 = (await gvBuoiHoc(env, { action: 'mo', lop: '' }, T2)) as any
    await gvBuoiHoc(env, { action: 'them-em', id: mo3.buoi.id, sbd: ['S1'] }, T2)
    const uv3 = await g(env, { action: 'ung-vien', buoiId: mo3.buoi.id }, T2)
    expect(uv3.em[0].cau).toEqual([])
    expect(chonLuotDauGio(uv3.em, { nowMs: T2 })).toEqual([])
  })
})

describe('/gv/dau-gio — chấm, Thầy đã chữa, Kết thúc', () => {
  it('Đạt ⇒ sổ nguon=dau_gio ket_qua 1; Chưa đạt ⇒ 0; chấm lại (kể cả đổi ý) KHÔNG ghi thêm, trả kết quả đã có', async () => {
    const { env, buoiId, d } = await fixture(2)
    await ghiSuKien(env, [sk('S1', 'Q1', 1, ngayTruoc(5)), sk('S2', 'Q2', 1, ngayTruoc(5))])
    await g(env, { action: 'chot', buoiId, cap: [{ sbd: 'S1', qid: 'Q1', chuyenDe: 'Ester' }, { sbd: 'S2', qid: 'Q2' }] })
    expect(await g(env, { action: 'cham', buoiId, sbd: 'S1', qid: 'Q1', dat: true })).toMatchObject({ ok: true, ketQua: 'dat' })
    expect(await g(env, { action: 'cham', buoiId, sbd: 'S1', qid: 'Q1', dat: false })).toMatchObject({ ok: true, daCoTruoc: true, ketQua: 'dat' })
    expect(await g(env, { action: 'cham', buoiId, sbd: 'S2', qid: 'Q2', dat: false })).toMatchObject({ ok: true, ketQua: 'chua_dat' })
    const so = d.sql.prepare("SELECT sbd, qid, ket_qua, ma_nguon, chuyen_de FROM su_kien_hoc WHERE nguon = 'dau_gio' ORDER BY sbd").all() as any[]
    expect(so.map((x) => [x.sbd, x.qid, x.ket_qua, x.ma_nguon])).toEqual([
      ['S1', 'Q1', 1, buoiId],
      ['S2', 'Q2', 0, buoiId],
    ])
    expect(so[0].chuyen_de).toBe('Ester')
    // câu không thuộc lượt của buổi ⇒ từ chối
    expect((await g(env, { action: 'cham', buoiId, sbd: 'S1', qid: 'Q2', dat: true })).ok).toBe(false)
  })

  it('"Thầy đã chữa" ⇒ nhãn (ngày) + mốc dạy lại srs2_day_lai; bấm lại không ghi thêm', async () => {
    const { env, buoiId, d } = await fixture(1)
    await ghiSuKien(env, [sk('S1', 'Q1', 1, ngayTruoc(5))])
    await g(env, { action: 'chot', buoiId, cap: [{ sbd: 'S1', qid: 'Q1' }] })
    await g(env, { action: 'cham', buoiId, sbd: 'S1', qid: 'Q1', dat: false })
    const r = await g(env, { action: 'da-chua', buoiId, sbd: 'S1', qid: 'Q1' })
    expect(r).toMatchObject({ ok: true, luc: new Date(T0).toISOString() })
    expect((await g(env, { action: 'da-chua', buoiId, sbd: 'S1', qid: 'Q1' }, T0 + 5000)).daCoTruoc).toBe(true)
    expect(d.sql.prepare('SELECT sbd, qid, luc FROM srs2_day_lai').all()).toEqual([{ sbd: 'S1', qid: 'Q1', luc: new Date(T0).toISOString() }])
    expect(d.sql.prepare('SELECT sbd, qid, nguon, ma_nguon, ngay_vn FROM thay_da_chua').all()).toEqual([{ sbd: 'S1', qid: 'Q1', nguon: 'dau_gio', ma_nguon: buoiId, ngay_vn: '2026-09-29' }])
    const x = await g(env, { action: 'xem', buoiId })
    expect(x.luot[0]).toMatchObject({ trangThai: 'chua_dat', daChuaLuc: new Date(T0).toISOString() })
    const ls = await g(env, { action: 'lich-su', cap: [{ sbd: 'S1', qid: 'Q1' }] })
    expect(ls.ketQua[0].daChua).toEqual([new Date(T0).toISOString()])
  })

  it('Kết thúc: em chưa chấm KHÔNG ghi gì vào sổ; sau đó không chấm / gọi thêm được', async () => {
    const { env, buoiId, d } = await fixture(3)
    await ghiSuKien(env, [sk('S1', 'Q1', 1, ngayTruoc(5)), sk('S2', 'Q2', 1, ngayTruoc(5)), sk('S3', 'Q3', 1, ngayTruoc(5))])
    await g(env, { action: 'chot', buoiId, cap: [{ sbd: 'S1', qid: 'Q1' }, { sbd: 'S2', qid: 'Q2' }] })
    await g(env, { action: 'cham', buoiId, sbd: 'S1', qid: 'Q1', dat: true })
    const kt = await g(env, { action: 'ket-thuc', buoiId })
    expect(kt.soBo).toBe(1)
    expect(kt.luot.map((x: any) => [x.sbd, x.trangThai])).toEqual([
      ['S1', 'dat'],
      ['S2', 'bo'],
    ])
    expect((await g(env, { action: 'cham', buoiId, sbd: 'S2', qid: 'Q2', dat: true })).ok).toBe(false)
    expect((await g(env, { action: 'chot', buoiId, cap: [{ sbd: 'S3', qid: 'Q3' }] })).ok).toBe(false)
    expect((d.sql.prepare("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE nguon = 'dau_gio'").get() as any).n).toBe(1)
    expect((await g(env, { action: 'xem', buoiId })).daKetThuc).toBe(true)
  })
})

describe('lịch sử câu cho thẻ tên + nhãn nguồn', () => {
  it('"Sai 20/09 (Ca) · Đúng 22/09 (Đoàn) · Đúng 25/09 (Bi-a)" — game tách Đoàn / Bi-a / Đảo theo phiên; bỏ sự kiện CHE', async () => {
    const { env, d } = await fixture(1)
    d.sql.exec(`INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES('PD','S1','{"mode":"adventure","doan":1}','x'),('PB','S1','{"mode":"bia","bia":1}','x'),('PA','S1','{"mode":"adventure"}','x')`)
    await ghiSuKien(env, [
      sk('S1', 'Q1', 0, '2026-09-20T03:00:00.000Z', 'thi', 'CA1'),
      sk('S1', 'Q1', 1, '2026-09-22T03:00:00.000Z', 'game', 'PD'),
      sk('S1', 'Q1', 1, '2026-09-25T03:00:00.000Z', 'game', 'PB'),
      { ...sk('S1', 'Q1', 0, '2026-09-26T03:00:00.000Z', 'thi', 'CA2'), visibility: 'embargoed' },
      sk('S1', 'Q2', 1, '2026-09-21T03:00:00.000Z', 'game', 'PA'),
    ])
    const r = await g(env, { action: 'lich-su', cap: [{ sbd: 'S1', qid: 'Q1' }, { sbd: 'S1', qid: 'Q2' }, { sbd: 'S1', qid: 'CHUA' }] })
    expect(r.ketQua.map((x: any) => x.chu)).toEqual(['Sai 20/09 (Ca) · Đúng 22/09 (Đoàn) · Đúng 25/09 (Bi-a)', 'Đúng 21/09 (Đảo)', ''])
    // bảng chi tiết em trên tờ chiếu (bấm thẻ tên) cũng gọi đúng tên nguồn mới
    expect([tenNguon('game', 'bia'), tenNguon('game', true), tenNguon('game', false), tenNguon('dau_gio', false)]).toEqual(['Bi-a', 'Đoàn', 'Đảo', 'Đầu giờ'])
  })
})

describe('reset', () => {
  it('lượt hỏi thuộc XOÁ (cùng họ buoi_hoc); nhãn "Thầy đã chữa" GIỮ cùng mốc dạy lại', () => {
    expect(BANG_XOA).toEqual(expect.arrayContaining(['dau_gio_hoi', 'dau_gio_buoi']))
    expect(BANG_GIU).toContain('thay_da_chua')
    expect(BANG_GIU_HOA2).toContain('thay_da_chua')
  })
})

// ───────────── ĐẦU CUỐI với Sổ nợ của trợ lý A (docs/so-no-2909/HOP-DONG.md): chấm qua /gv/dau-gio ⇒ trạng thái câu tính lại từ sổ ─────────────
describe('đầu cuối với Sổ nợ (phatLaiCau / kế hoạch ngày)', () => {
  const TA = Date.parse('2026-09-30T01:00:00Z') // 08:00 VN 30/09 — đầu giờ
  const NGAY = 86_400_000
  const cauJson = (qid: string, sao = 0) =>
    JSON.stringify({ qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'TH', sao, kienThuc: ['k'], correct: 'B', reviewed: true, solution: { chot: 'x', tungPa: {} } })
  async function fx() {
    const d = taoD1That()
    const env = d.env
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','x'),('S2','Trần Bảo','12A1','x'),('S3','Lê Chi','12A1','x')")
    const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
    for (let i = 1; i <= 6; i++) st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, 'D1', cauJson(`Q${i}`, i === 1 ? 2 : 0))
    d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
    expect((await gvChienDich(env, { action: 'tao', ten: 'CD', lop: '12A1', maDe: ['DE1'], hanNop: '2026-10-20', theLucNgay: 40 }, TA - 5 * NGAY)).ok).toBe(true)
    const mo = (await gvBuoiHoc(env, { action: 'mo', lop: '' }, TA)) as any
    await gvBuoiHoc(env, { action: 'them-em', id: mo.buoi.id, sbd: ['S1', 'S2', 'S3'] }, TA)
    return { env, buoiId: mo.buoi.id as string }
  }
  const saiNhieu = (sbd: string, qid: string, ks: number[]) => ks.map((k, i) => ({ ...sk(sbd, qid, 0, new Date(TA - k * NGAY).toISOString()), maNguon: `p${i}` }))

  it('Đạt ⇒ thành thạo NGAY (câu 2 sao); Chưa đạt ⇒ nợ, có trong kế hoạch NGÀY MAI; Thầy đã chữa ⇒ câu cắt tỉa quay lại kế hoạch hôm sau', async () => {
    const { env, buoiId } = await fx()
    await ghiSuKien(env, [
      sk('S1', 'Q1', 0, new Date(TA - 4 * NGAY).toISOString()),
      sk('S1', 'Q1', 1, new Date(TA - 2 * NGAY).toISOString(), 'luyen', 'L0'),
      sk('S2', 'Q2', 1, new Date(TA - 3 * NGAY).toISOString()),
      ...saiNhieu('S3', 'Q3', [6, 5, 4, 3]),
      sk('S3', 'Q3', 1, new Date(TA - NGAY).toISOString(), 'luyen', 'L1'),
    ])
    const chot = await g(env, { action: 'chot', buoiId, cap: [{ sbd: 'S1', qid: 'Q1' }, { sbd: 'S2', qid: 'Q2' }, { sbd: 'S3', qid: 'Q3' }] }, TA)
    expect(chot.nhan).toHaveLength(3)
    await g(env, { action: 'cham', buoiId, sbd: 'S1', qid: 'Q1', dat: true }, TA + 60_000)
    await g(env, { action: 'cham', buoiId, sbd: 'S2', qid: 'Q2', dat: false }, TA + 120_000)
    await g(env, { action: 'cham', buoiId, sbd: 'S3', qid: 'Q3', dat: false }, TA + 180_000)
    const hs1 = await docHoSo2(env, 'S1', '2026-09-30')
    expect(hs1.tt.get('Q1')!.thanhThao).toBe(true)
    const hs2 = await docHoSo2(env, 'S2', '2026-09-30')
    expect(laNo(hs2.tt.get('Q2')!)).toBe(true)
    expect(hs2.tt.get('Q2')!.henOn).toBe('2026-10-01')
    expect((await layKeHoachHomNay(env, 'S2', TA + NGAY)).kh.doan).toContain('Q2')
    // S3: sai lần thứ 5, lần gần nhất sai ⇒ "Cần thầy dạy lại"; tích "Thầy đã chữa" ⇒ mốc dạy lại ⇒ quay lại kế hoạch hôm sau.
    expect((await docHoSo2(env, 'S3', '2026-09-30')).tt.get('Q3')!.catTia).toBe(true)
    await g(env, { action: 'da-chua', buoiId, sbd: 'S3', qid: 'Q3' }, TA + 240_000)
    const hs3 = await docHoSo2(env, 'S3', '2026-10-01')
    expect(hs3.tt.get('Q3')!.catTia).toBe(false)
    expect((await layKeHoachHomNay(env, 'S3', TA + NGAY, hs3)).kh.doan).toContain('Q3')
  })

  it('tích "Thầy đã chữa" TRƯỚC khi chấm Chưa đạt ⇒ mốc dạy lại đặt lại SAU lần chấm (hợp đồng A: mốc ≥ sự kiện)', async () => {
    const { env, buoiId } = await fx()
    await ghiSuKien(env, [...saiNhieu('S3', 'Q3', [6, 5, 4]), sk('S3', 'Q3', 1, new Date(TA - NGAY).toISOString(), 'luyen', 'L1')])
    await g(env, { action: 'chot', buoiId, cap: [{ sbd: 'S3', qid: 'Q3' }] }, TA)
    await g(env, { action: 'da-chua', buoiId, sbd: 'S3', qid: 'Q3' }, TA + 60_000)
    await g(env, { action: 'cham', buoiId, sbd: 'S3', qid: 'Q3', dat: false }, TA + 120_000)
    const moc = ((await env.DB.prepare("SELECT luc FROM srs2_day_lai WHERE sbd = 'S3' ORDER BY luc").all()).results ?? []).map((x: any) => x.luc)
    expect(moc).toEqual([new Date(TA + 60_000).toISOString(), new Date(TA + 120_000).toISOString()])
    const hs = await docHoSo2(env, 'S3', '2026-10-01')
    expect(hs.tt.get('Q3')!.catTia).toBe(false)
    expect((await layKeHoachHomNay(env, 'S3', TA + NGAY, hs)).kh.doan).toContain('Q3')
  })
})
