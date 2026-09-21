// @vitest-environment node
// CẢNH BÁO CỦA THẦY (máy chủ) — docs/hop-dong-hom-nay-v2-2109.md: /gv/canh-bao-nop-bai (GHI), khoá `canhBaoThay` của /hs/ke-hoach-ngay và /ph/ke-hoach, /hs/canh-bao/xem, /ph/canh-bao/xem.
// Chỉ THẦY bấm mới gửi · trần MỘT cảnh báo/em/bài/ngày · lời đúng sự thật, không doạ, không emoji, không gạch ngang dài · bộ não không có đường ghi.
import { readdirSync, readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { gameToken, parentPass } from '../server/src/game-v2-auth'
import { BANG_GIU, BANG_XOA } from '../server/src/reset-toan-app'
import { loiChoPhuHuynh, loiMacDinhChoEm, trangThaiNopBai } from '../server/src/canh-bao-thay'
import { goiWorker, type D1That } from './_d1-that'
import { BAY_GIO, cauThay, dung, giao, gio, maBtvn, mo } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())

const canhBao = (d: D1That, b: Record<string, unknown>, thay = true) => goiWorker(worker, d.env, '/gv/canh-bao-nop-bai', b, thay)
const khHs = async (d: D1That, sbd: string) => goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { token: await gameToken(d.env, sbd) })
const khPh = async (d: D1That, sbd: string) => goiWorker(worker, d.env, '/ph/ke-hoach', { pass: await parentPass(d.env, sbd) })
const dongCb = (d: D1That) => d.sql.prepare('SELECT * FROM canh_bao_thay ORDER BY sbd').all() as Record<string, string | null>[]
const tatCaChu = (d: D1That) => JSON.stringify([dongCb(d), d.sql.prepare('SELECT * FROM student_notice').all()])

/** Bài cá nhân hoá đã giao cho 3 em (S1–S3), 10:00 giờ VN thứ Ba 22/09, hạn 10:00 29/09. */
async function dungBai() {
  gio(BAY_GIO)
  const d = dung(3)
  d.sql.exec("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES ('S1','Em 1','12A','mk','x'),('S2','Em 2','12A','mk','x'),('S3','Em 3','12B','mk','x')")
  expect((await giao(d, { cau: cauThay() })).ok).toBe(true)
  return { d, ma: maBtvn(d) }
}

describe('lệnh GHI /gv/canh-bao-nop-bai', () => {
  it('cần mã bí mật của thầy: không mã ⇒ 403 và KHÔNG ghi một dòng', async () => {
    const { d, ma } = await dungBai()
    const r = await canhBao(d, { maBtvn: ma, dsSbd: ['S1'] }, false)
    expect(r.ok).toBe(false)
    expect(dongCb(d)).toEqual([])
    expect(d.dem('student_notice')).toBe(0)
  })

  it('gửi cho em chưa mở: MỘT dòng canh_bao_thay + MỘT student_notice mỗi em; lời đúng sự thật (chưa mở, hạn), không doạ/emoji/gạch dài; ra {daGui, boQua, luc}', async () => {
    const { d, ma } = await dungBai()
    const r = await canhBao(d, { maBtvn: ma, dsSbd: ['S1', 'S2'] })
    expect(r).toMatchObject({ ok: true, daGui: 2, boQua: [] })
    expect(typeof r.luc).toBe('string')
    expect(r.soTruyVan).toBeLessThanOrEqual(12)
    const ds = dongCb(d)
    expect(ds.map((x) => x.sbd)).toEqual(['S1', 'S2'])
    expect(ds[0]).toMatchObject({ id: `cb:${ma}:S1:2026-09-22`, ma_btvn: ma, ngay: '2026-09-22', trang_thai_em: 'chua_mo', em_xem_luc: null, ph_xem_luc: null })
    expect(ds[0]!.loi_em).toBe('Thầy nhắc: em chưa mở Bài tập về nhà, hạn nộp 10:00 29/09. Em mở bài và bắt đầu làm.')
    expect(ds[0]!.loi_ph).toBe('Anh/chị, em 1 chưa mở Bài tập về nhà, hạn nộp 10:00 29/09. Anh/chị nhắc em mở bài và làm hôm nay.')
    expect(d.sql.prepare("SELECT id, target, body FROM student_notice WHERE sbd = 'S1'").get()).toMatchObject({ id: `cb:${ma}:S1:2026-09-22`, target: 'canh_bao_btvn', body: ds[0]!.loi_em })
    const chu = tatCaChu(d)
    expect(chu).not.toMatch(/—|–|\p{Extended_Pictographic}/u)
    expect(chu).not.toMatch(/nắm chắc|so với bạn|bạn khác/i)
  })

  it('TRẦN MỘT cảnh báo/em/bài/ngày: gửi lại trong ngày ⇒ boQua da_canh_bao_hom_nay, không thêm dòng; sang ngày mới thì gửi được', async () => {
    const { d, ma } = await dungBai()
    await canhBao(d, { maBtvn: ma, dsSbd: ['S1'] })
    const lai = await canhBao(d, { maBtvn: ma, dsSbd: ['S1', 'S2'] })
    expect(lai).toMatchObject({ ok: true, daGui: 1, boQua: [{ sbd: 'S1', lyDo: 'da_canh_bao_hom_nay' }] })
    expect(dongCb(d).map((x) => x.sbd)).toEqual(['S1', 'S2'])
    expect(d.dem('student_notice')).toBe(2)
    gio(new Date(BAY_GIO.getTime() + 24 * 3_600_000)) // ngày VN kế tiếp
    const mai = await canhBao(d, { maBtvn: ma, dsSbd: ['S1'] })
    expect(mai).toMatchObject({ ok: true, daGui: 1, boQua: [] })
    expect(d.dem('canh_bao_thay', "sbd = 'S1'")).toBe(2)
  })

  it('em không hợp lệ vào boQua kèm lý do thật: đã nộp / không thuộc bài / thu hồi / bài quá hạn nhiều ngày; danh sách trùng chỉ tính một lần', async () => {
    const { d, ma } = await dungBai()
    d.sql.exec(`UPDATE btvn_em SET nop_luc = '2026-09-22T02:00:00.000Z' WHERE sbd = 'S1'`)
    d.sql.exec(`UPDATE btvn_em SET thu_hoi = 1 WHERE sbd = 'S2'`)
    const r = await canhBao(d, { maBtvn: ma, dsSbd: ['S1', 'S2', 'S3', 'S3', 'KHAC'] })
    expect(r.daGui).toBe(1)
    expect(Object.fromEntries(r.boQua.map((x: { sbd: string; lyDo: string }) => [x.sbd, x.lyDo]))).toEqual({ S1: 'da_nop', S2: 'thu_hoi', KHAC: 'khong_thuoc_bai' })
    expect(dongCb(d).map((x) => x.sbd)).toEqual(['S3'])
    gio(new Date('2026-10-05T03:00:00.000Z')) // hạn 29/09 đã qua 6 ngày
    const muon = await canhBao(d, { maBtvn: ma, dsSbd: ['S3'] })
    expect(muon).toMatchObject({ ok: true, daGui: 0, boQua: [{ sbd: 'S3', lyDo: 'bai_qua_han_nhieu_ngay' }] })
  })

  it('lỗi tổng bằng lời: thiếu mã, thiếu danh sách, > 60 em, lời > 200 ký tự, bài không có; không ghi gì', async () => {
    const { d, ma } = await dungBai()
    expect((await canhBao(d, { dsSbd: ['S1'] })).error).toContain('mã bài')
    expect((await canhBao(d, { maBtvn: ma })).error).toContain('danh sách')
    expect((await canhBao(d, { maBtvn: ma, dsSbd: Array.from({ length: 61 }, (_, i) => `E${i}`) })).error).toContain('60')
    expect((await canhBao(d, { maBtvn: ma, dsSbd: ['S1'], loiNhan: 'x'.repeat(201) })).error).toContain('200')
    expect((await canhBao(d, { maBtvn: 'KHONG-CO', dsSbd: ['S1'] })).error).toContain('Không tìm thấy')
    expect(dongCb(d)).toEqual([])
  })

  it('loiNhan của thầy thay LỜI CHO EM (lời phụ huynh vẫn máy chủ dựng)', async () => {
    const { d, ma } = await dungBai()
    await canhBao(d, { maBtvn: ma, dsSbd: ['S1'], loiNhan: '  Em nhớ nộp bài trước Chủ nhật.  ' })
    expect(dongCb(d)[0]).toMatchObject({ loi_em: 'Em nhớ nộp bài trước Chủ nhật.' })
    expect(dongCb(d)[0]!.loi_ph).toContain('Anh/chị, em 1 chưa mở')
  })

  it('trạng thái THẬT: em đã mở bài (đã chốt bộ) mà chưa nộp ⇒ dở chặng x trong y; lời nói đúng chặng', async () => {
    const { d, ma } = await dungBai()
    expect((await mo(d, 'S1')).ok).toBe(true)
    const tong = Number((d.sql.prepare("SELECT so_chang FROM btvn_em WHERE sbd = 'S1'").get() as { so_chang: number }).so_chang)
    expect(tong).toBeGreaterThan(0)
    await canhBao(d, { maBtvn: ma, dsSbd: ['S1'] })
    const c = dongCb(d)[0]!
    expect(c.trang_thai_em).toBe('do_chang')
    expect(c.loi_em).toBe(`Thầy nhắc: em đang dở chặng 1 trong ${tong} của Bài tập về nhà, hạn nộp 10:00 29/09. Em làm tiếp từ chặng 1.`)
  })

  it('ghi đúng ngày VN: 00:30 giờ VN (17:30 UTC hôm trước) là NGÀY MỚI', async () => {
    const { d, ma } = await dungBai()
    gio(new Date('2026-09-22T17:30:00.000Z')) // 00:30 23/09 giờ VN
    await canhBao(d, { maBtvn: ma, dsSbd: ['S1'] })
    expect(dongCb(d)[0]).toMatchObject({ ngay: '2026-09-23', id: `cb:${ma}:S1:2026-09-23` })
    expect(dongCb(d)[0]!.loi_em).toContain('hạn nộp 10:00 29/09')
  })
})

describe('phía EM: khoá canhBaoThay của /hs/ke-hoach-ngay và /hs/canh-bao/xem', () => {
  it('chưa có cảnh báo ⇒ KHÔNG có khoá canhBaoThay; có cảnh báo ⇒ đúng hình dạng đã chốt, chỉ lời cho EM', async () => {
    const { d, ma } = await dungBai()
    expect(await khHs(d, 'S1')).not.toHaveProperty('canhBaoThay')
    await canhBao(d, { maBtvn: ma, dsSbd: ['S1'] })
    const kh = await khHs(d, 'S1')
    expect(kh.canhBaoThay).toEqual([{
      id: `cb:${ma}:S1:2026-09-22`, maBtvn: ma, tenBtvn: 'Bài tập về nhà', guiLuc: expect.stringMatching(/^2026-09-22T03:00:00/), hanNop: expect.any(String),
      loi: 'Thầy nhắc: em chưa mở Bài tập về nhà, hạn nộp 10:00 29/09. Em mở bài và bắt đầu làm.', trangThaiEm: 'chua_mo', daXem: false,
    }])
    expect(JSON.stringify(kh.canhBaoThay)).not.toContain('Anh/chị') // không bao giờ lời phụ huynh
    expect(await khHs(d, 'S2')).not.toHaveProperty('canhBaoThay') // em khác không thấy
  })

  it('/hs/canh-bao/xem: ghi em đã xem (lần đầu) + đọc thông báo; chỉ cảnh báo CỦA CHÍNH EM', async () => {
    const { d, ma } = await dungBai()
    await canhBao(d, { maBtvn: ma, dsSbd: ['S1', 'S2'] })
    const id = `cb:${ma}:S1:2026-09-22`
    // S2 không đánh dấu được cảnh báo của S1
    expect((await goiWorker(worker, d.env, '/hs/canh-bao/xem', { token: await gameToken(d.env, 'S2'), id })).ok).toBe(true)
    expect(d.sql.prepare('SELECT em_xem_luc FROM canh_bao_thay WHERE id = ?').get(id)).toEqual({ em_xem_luc: null })
    gio(new Date(BAY_GIO.getTime() + 600_000))
    expect((await goiWorker(worker, d.env, '/hs/canh-bao/xem', { token: await gameToken(d.env, 'S1'), id })).ok).toBe(true)
    const luc = (d.sql.prepare('SELECT em_xem_luc FROM canh_bao_thay WHERE id = ?').get(id) as { em_xem_luc: string }).em_xem_luc
    expect(luc).toBe('2026-09-22T03:10:00.000Z')
    expect(d.sql.prepare('SELECT read_at FROM student_notice WHERE id = ?').get(id)).toEqual({ read_at: luc })
    gio(new Date(BAY_GIO.getTime() + 1_200_000))
    await goiWorker(worker, d.env, '/hs/canh-bao/xem', { token: await gameToken(d.env, 'S1'), id }) // xem lần hai KHÔNG ghi đè mốc đầu
    expect(d.sql.prepare('SELECT em_xem_luc FROM canh_bao_thay WHERE id = ?').get(id)).toEqual({ em_xem_luc: luc })
    expect((await khHs(d, 'S1')).canhBaoThay[0].daXem).toBe(true)
  })

  it('cần token học sinh (không nhận SBD trần); em NỘP BÀI xong thì cảnh báo biến mất; quá 48 giờ cũng biến mất', async () => {
    const { d, ma } = await dungBai()
    await canhBao(d, { maBtvn: ma, dsSbd: ['S1', 'S2'] })
    expect((await goiWorker(worker, d.env, '/hs/canh-bao/xem', { sbd: 'S1', id: `cb:${ma}:S1:2026-09-22` })).ok).not.toBe(true)
    d.sql.exec(`UPDATE btvn_em SET nop_luc = '2026-09-22T04:00:00.000Z' WHERE sbd = 'S1'`)
    expect(await khHs(d, 'S1')).not.toHaveProperty('canhBaoThay')
    expect((await khHs(d, 'S2')).canhBaoThay).toHaveLength(1)
    gio(new Date(BAY_GIO.getTime() + 49 * 3_600_000))
    expect(await khHs(d, 'S2')).not.toHaveProperty('canhBaoThay')
  })

  it('trạng thái tính LẠI khi đọc: gửi lúc chưa mở, em mở bài rồi thì hiện dở chặng; quá hạn thì qua_han', async () => {
    const { d, ma } = await dungBai()
    await canhBao(d, { maBtvn: ma, dsSbd: ['S1'] })
    expect((await mo(d, 'S1')).ok).toBe(true)
    const a = (await khHs(d, 'S1')).canhBaoThay[0]
    expect(a.trangThaiEm).toBe('do_chang')
    expect(a.chang).toMatchObject({ hienTai: 1 })
    d.sql.exec("UPDATE btvn SET han_nop = '2026-09-22T05:00:00.000Z'") // hạn = 12:00 hôm nay
    gio(new Date('2026-09-22T06:00:00.000Z'))
    expect((await khHs(d, 'S1')).canhBaoThay[0].trangThaiEm).toBe('qua_han')
  })
})

describe('phía PHỤ HUYNH: khoá canhBaoThay của /ph/ke-hoach và /ph/canh-bao/xem', () => {
  it('cùng hình dạng như phía em nhưng `loi` là LỜI CHO PHỤ HUYNH, `daXem` là phụ huynh đã xem; chỉ của đúng con', async () => {
    const { d, ma } = await dungBai()
    expect(await khPh(d, 'S1')).not.toHaveProperty('canhBaoThay')
    await canhBao(d, { maBtvn: ma, dsSbd: ['S1'] })
    const kh = await khPh(d, 'S1')
    expect(kh.canhBaoThay).toEqual([{
      id: `cb:${ma}:S1:2026-09-22`, maBtvn: ma, tenBtvn: 'Bài tập về nhà', guiLuc: expect.any(String), hanNop: expect.any(String),
      loi: 'Anh/chị, em 1 chưa mở Bài tập về nhà, hạn nộp 10:00 29/09. Anh/chị nhắc em mở bài và làm hôm nay.', trangThaiEm: 'chua_mo', daXem: false,
    }])
    expect(await khPh(d, 'S2')).not.toHaveProperty('canhBaoThay')
  })

  it('/ph/canh-bao/xem: ghi ph_xem_luc; chỉ nhận token, chỉ cảnh báo của đúng con; em xem không làm phụ huynh "đã xem" và ngược lại', async () => {
    const { d, ma } = await dungBai()
    await canhBao(d, { maBtvn: ma, dsSbd: ['S1'] })
    const id = `cb:${ma}:S1:2026-09-22`
    await goiWorker(worker, d.env, '/ph/canh-bao/xem', { pass: await parentPass(d.env, 'S2'), id }) // token con khác
    expect(d.sql.prepare('SELECT ph_xem_luc FROM canh_bao_thay WHERE id = ?').get(id)).toEqual({ ph_xem_luc: null })
    expect((await goiWorker(worker, d.env, '/ph/canh-bao/xem', { sbd: 'S1', id })).ok).not.toBe(true) // SBD trần không được
    await goiWorker(worker, d.env, '/hs/canh-bao/xem', { token: await gameToken(d.env, 'S1'), id })
    expect((await khPh(d, 'S1')).canhBaoThay[0].daXem).toBe(false)
    expect((await goiWorker(worker, d.env, '/ph/canh-bao/xem', { pass: await parentPass(d.env, 'S1'), id })).ok).toBe(true)
    expect((await khPh(d, 'S1')).canhBaoThay[0].daXem).toBe(true)
    expect((await khHs(d, 'S1')).canhBaoThay[0].daXem).toBe(true) // em đã xem từ trước, độc lập
    d.sql.exec(`UPDATE btvn_em SET nop_luc = '2026-09-22T04:00:00.000Z' WHERE sbd = 'S1'`)
    expect(await khPh(d, 'S1')).not.toHaveProperty('canhBaoThay')
  })
})

describe('lời viết: hàm thuần', () => {
  const em = { trangThai: 'chua_mo' as const, nhan: 'Chưa mở bài', soNgayQuaHan: 0 }
  it('mọi lời: xưng Thầy/Anh chị, ≤ 30 chữ mỗi câu, không emoji, không gạch ngang dài, không doạ', () => {
    const now = Date.parse('2026-09-22T03:00:00.000Z')
    const han = '2026-09-22T16:59:00.000Z' // 23:59 hôm nay
    const trangThai = [
      em,
      { trangThai: 'do_chang' as const, nhan: 'Dở chặng 2 trong 7', chang: { daXong: 1, tong: 7, hienTai: 2 }, soNgayQuaHan: 0 },
      { trangThai: 'do_chang' as const, nhan: 'Làm dở, chưa nộp', soNgayQuaHan: 0 },
      { trangThai: 'qua_han' as const, nhan: 'Quá hạn 1 ngày', soNgayQuaHan: 1 },
    ]
    for (const st of trangThai) for (const ten of ['Nguyễn Thu Hà', '']) {
      for (const loi of [loiMacDinhChoEm(st, han, now), loiChoPhuHuynh(st, ten, han, now)]) {
        expect(loi).not.toMatch(/—|–|\p{Extended_Pictographic}|!/u)
        expect(loi).not.toMatch(/cố gắng hơn|phát huy|hy vọng|trân trọng|chúc/i)
        for (const cau of loi.split(/(?<=[.?])\s+/)) expect(cau.split(/\s+/).length).toBeLessThanOrEqual(30)
      }
    }
    expect(loiMacDinhChoEm(em, han, now)).toContain('23:59 hôm nay')
    expect(loiChoPhuHuynh(em, '', han, now)).toContain('Anh/chị, con chưa mở') // không có tên ⇒ "con"
    expect(loiChoPhuHuynh(em, 'Nguyễn Thu Hà', han, now)).toContain('em Hà')
  })
  it('trạng thái: chưa mở (chưa chốt bộ / chưa có đáp án) · dở chặng · quá hạn theo NGÀY tròn lên', () => {
    const han = '2026-09-22T05:00:00.000Z'
    const truoc = Date.parse('2026-09-22T04:00:00.000Z')
    expect(trangThaiNopBai({ so_chang: 5, chot_luc: null }, han, truoc)).toMatchObject({ trangThai: 'chua_mo', nhan: 'Chưa mở bài' })
    expect(trangThaiNopBai({ so_chang: 5, chot_luc: 'x', lo_da_xong: 2 }, han, truoc)).toMatchObject({ trangThai: 'do_chang', nhan: 'Dở chặng 3 trong 5', chang: { hienTai: 3, tong: 5, daXong: 2 } })
    expect(trangThaiNopBai({ so_chang: 5, chot_luc: 'x', lo_da_xong: 5 }, han, truoc).chang).toMatchObject({ hienTai: 5 }) // không vượt tổng
    expect(trangThaiNopBai({ dap_an_json: '{}' }, han, truoc).trangThai).toBe('chua_mo') // bài cũ chưa có đáp án
    expect(trangThaiNopBai({ dap_an_json: '{"a":"A"}' }, han, truoc).trangThai).toBe('do_chang')
    expect(trangThaiNopBai({ so_chang: 5, chot_luc: null }, han, Date.parse('2026-09-22T05:00:01.000Z'))).toMatchObject({ trangThai: 'qua_han', nhan: 'Quá hạn 1 ngày', soNgayQuaHan: 1 })
    expect(trangThaiNopBai({}, han, Date.parse('2026-09-24T06:00:00.000Z'))).toMatchObject({ trangThai: 'qua_han', soNgayQuaHan: 3 })
  })
})

describe('an toàn: bộ não không có đường ghi; bảng vào danh sách reset', () => {
  it('không tệp bo-nao*.ts nào nhắc tới canh_bao_thay hay canh-bao-thay (chỉ thầy bấm mới gửi)', () => {
    const tep = readdirSync('server/src').filter((f) => /^bo-nao/.test(f)).concat(['../../src/lib/bo-nao-khuon.ts', '../../src/lib/bo-nao-dac-trung.ts'])
    expect(tep.length).toBeGreaterThan(1)
    for (const f of tep) expect(readFileSync(`server/src/${f}`, 'utf-8')).not.toMatch(/canh_bao_thay|canh-bao-thay|guiCanhBao/)
  })
  it('chỉ HAI nơi trong máy chủ ghi canh_bao_thay: canh-bao-thay.ts (thầy bấm tay) và nhac-tu-dong.ts (nhắc TỰ ĐỘNG theo luật Boss 21/09, không AI); chỉ index.ts gọi guiCanhBao (sau cổng laThay)', () => {
    // Đổi có chủ ý 21/09: trước là MỘT nơi (chỉ thầy bấm mới gửi); Boss chốt cảnh báo phải TỰ ĐỘNG (nhac-tu-dong.ts) — bộ não A.I vẫn KHÔNG có đường ghi (test trên).
    const co = readdirSync('server/src').filter((f) => f.endsWith('.ts') && /INSERT (OR \w+ )?INTO canh_bao_thay/i.test(readFileSync(`server/src/${f}`, 'utf-8')))
    expect(co.sort()).toEqual(['canh-bao-thay.ts', 'nhac-tu-dong.ts'])
    const goi = readdirSync('server/src').filter((f) => f.endsWith('.ts') && /guiCanhBao\(/.test(readFileSync(`server/src/${f}`, 'utf-8')) && f !== 'canh-bao-thay.ts')
    expect(goi).toEqual(['index.ts'])
    const index = readFileSync('server/src/index.ts', 'utf-8')
    expect(index.indexOf("'/gv/canh-bao-nop-bai'")).toBeGreaterThan(index.indexOf('// Lệnh của THẦY — đòi mã bí mật.'))
  })
  it('canh_bao_thay có trong BANG_XOA (reset toàn app xoá nhật ký cảnh báo cùng student_notice), không trong BANG_GIU', () => {
    expect(BANG_XOA).toContain('canh_bao_thay')
    expect(BANG_GIU).not.toContain('canh_bao_thay')
  })
})
