// @vitest-environment node
// MÁY SOẠN SƠ ĐỒ CHẠY BẰNG CRON (27/10) — server/src/may-soan-cron.ts. D1 thật SQLite (tests/_d1-that.ts); `soanSoDoLo` GIẢ tiêm qua `phu.soanLo`
// (không gọi mạng, không nạp máy soạn thật). Kiểm: cờ tắt ⇒ không gọi · khoá chạy chặn lượt chồng · con trỏ đi tiếp · chinh → sua → xong ·
// vòng sửa không bỏ sót câu khi câu vừa sửa rời danh sách · 3 lượt 429 ⇒ nghỉ 30 phút · KTCN mở ⇒ tuSuaDapAn false · giờ cao điểm · lỗi không làm hỏng cron.
import { beforeEach, describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { KHOA_MAY_SOAN, NGHI_KHI_LOI_MS, THOI_HAN_KHOA_MS, chayMaySoanCron, docCoMaySoan, type SoanLo } from '../server/src/may-soan-cron'
import type { Env } from '../server/src/kieu'

const NGOAI_CAO_DIEM = Date.parse('2026-10-27T03:00:00Z') // 10:00 giờ VN
const CAO_DIEM = Date.parse('2026-10-27T13:00:00Z') // 20:00 giờ VN

let d: D1That
let env: Env
beforeEach(() => { d = taoD1That(); env = d.env })

function datCo(v: unknown) {
  d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, 'x') ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri").run(KHOA_MAY_SOAN, JSON.stringify(v))
  xoaDemCauHinh(env, KHOA_MAY_SOAN)
}
const trangThai = () => d.sql.prepare('SELECT * FROM may_soan_trang_thai WHERE id = 1').get() as Record<string, unknown>
const tra = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
const ketDat = (n: number) => Array.from({ length: n }, (_, i) => ({ qid: `q${i}`, ket: 'dat', lanThu: 1 }))

/** Máy soạn giả: ghi lại tham số mỗi lần gọi, trả theo hàm `tl`. */
function soanGia(tl: (thamSo: Record<string, unknown>, lan: number) => Response | Promise<Response>) {
  const goi: Record<string, unknown>[] = []
  const fn: SoanLo = async (_env, thamSo) => { goi.push(thamSo as Record<string, unknown>); return await tl(thamSo as Record<string, unknown>, goi.length) }
  return { fn, goi }
}

describe('cờ', () => {
  it('27/10: câu vòng sửa của cron trùng nguyên văn với máy soạn (có câu thiếu sơ đồ)', async () => {
    const may = await import('../server/src/soan-so-do')
    const cron = await import('../server/src/may-soan-cron')
    expect(cron.SQL_CAN_SUA).toBe(may.SQL_CAN_SUA)
    expect(cron.SQL_CAN_SUA).toContain("cong = 'khong_kiem_duoc'")
  })

  it('đọc cờ: vắng / hỏng / thiếu ⇒ tắt; chỉ true thật mới bật', () => {
    expect(docCoMaySoan(null)).toEqual({ bat: false, gioCaoDiem: false, tuSuaDapAn: false })
    expect(docCoMaySoan('{hỏng')).toEqual({ bat: false, gioCaoDiem: false, tuSuaDapAn: false })
    expect(docCoMaySoan('{"bat":"true","tuSuaDapAn":1}')).toEqual({ bat: false, gioCaoDiem: false, tuSuaDapAn: false })
    expect(docCoMaySoan('{"bat":true,"gioCaoDiem":true,"tuSuaDapAn":true}')).toEqual({ bat: true, gioCaoDiem: true, tuSuaDapAn: true })
  })

  it('cờ vắng ⇒ không gọi máy soạn; bat:false ⇒ không gọi', async () => {
    const s = soanGia(() => tra({ ok: true, xong: false, conTro: 'x', dem: {}, ketQua: [] }))
    expect(await chayMaySoanCron(env, NGOAI_CAO_DIEM, { soanLo: s.fn })).toMatchObject({ chay: false, lyDo: 'co_tat' })
    datCo({ bat: false, gioCaoDiem: true })
    expect(await chayMaySoanCron(env, NGOAI_CAO_DIEM, { soanLo: s.fn })).toMatchObject({ chay: false, lyDo: 'co_tat' })
    expect(s.goi).toHaveLength(0)
    expect(trangThai().dang_chay_den).toBe(0)
  })

  it('cờ không có tuSuaDapAn ⇒ luôn truyền tuSuaDapAn: false RÕ RÀNG (soanSoDoLo mặc định bật)', async () => {
    datCo({ bat: true })
    const s = soanGia(() => tra({ ok: true, xong: false, conTro: 'DE|q1', dem: { dat: 1 }, ketQua: ketDat(1) }))
    await chayMaySoanCron(env, NGOAI_CAO_DIEM, { soanLo: s.fn })
    expect(s.goi[0]).toMatchObject({ tuSuaDapAn: false, choChayGioCaoDiem: true, gioiHan: 6, nganSachGiay: 25, songSong: 3, conTro: '' })
    expect(s.goi[0]!.chiSuaLoi).toBeUndefined()
  })
})

describe('khoá chạy', () => {
  it('lượt thứ hai trong lúc lượt đầu đang chạy ⇒ thôi; xong lượt thì nhả khoá', async () => {
    datCo({ bat: true })
    let mo!: () => void
    const cho = new Promise<void>((ok) => { mo = ok })
    const s = soanGia(async () => { await cho; return tra({ ok: true, xong: false, conTro: 'DE|q2', dem: { dat: 2 }, ketQua: ketDat(2) }) })
    const a = chayMaySoanCron(env, NGOAI_CAO_DIEM, { soanLo: s.fn })
    for (let i = 0; i < 20 && !s.goi.length; i++) await new Promise((ok) => setTimeout(ok, 5))
    expect(s.goi).toHaveLength(1)
    expect(await chayMaySoanCron(env, NGOAI_CAO_DIEM + 60_000, { soanLo: s.fn })).toMatchObject({ chay: false, lyDo: 'dang_chay' })
    expect(s.goi).toHaveLength(1)
    mo()
    expect(await a).toMatchObject({ chay: true })
    expect(trangThai()).toMatchObject({ dang_chay_den: 0, con_tro: 'DE|q2' })
    await chayMaySoanCron(env, NGOAI_CAO_DIEM + 120_000, { soanLo: s.fn })
    expect(s.goi).toHaveLength(2)
    expect(s.goi[1]!.conTro).toBe('DE|q2')
  })

  it('lượt quá giờ khoá bị lượt khác giành ⇒ KHÔNG ghi đè con trỏ của lượt mới', async () => {
    datCo({ bat: true })
    let mo!: () => void
    const cho = new Promise<void>((ok) => { mo = ok })
    const cham = soanGia(async () => { await cho; return tra({ ok: true, xong: false, conTro: 'DE|cu', dem: { dat: 1 }, ketQua: ketDat(1) }) })
    const a = chayMaySoanCron(env, NGOAI_CAO_DIEM, { soanLo: cham.fn })
    for (let i = 0; i < 20 && !cham.goi.length; i++) await new Promise((ok) => setTimeout(ok, 5))
    const nhanh = soanGia(() => tra({ ok: true, xong: false, conTro: 'DE|moi', dem: { dat: 1 }, ketQua: ketDat(1) }))
    expect(await chayMaySoanCron(env, NGOAI_CAO_DIEM + THOI_HAN_KHOA_MS + 1, { soanLo: nhanh.fn })).toMatchObject({ chay: true })
    mo()
    await a
    expect(trangThai().con_tro).toBe('DE|moi')
  })
})

describe('vòng và con trỏ', () => {
  it('con trỏ đi tiếp; chinh → sua (vòng sửa không bỏ sót câu) → xong', async () => {
    datCo({ bat: true })
    const ghiLech = (qid: string, cong = 'lech') => d.sql.prepare(`INSERT INTO loi_giai_so_do (qid, ma_de, version, phien_ban, ban_json, cong, tao_luc, cap_nhat_luc)
      VALUES (?, 'DE', 'v', 1, '{}', ?, 'x', 'x') ON CONFLICT(qid) DO UPDATE SET cong = excluded.cong`).run(qid, cong)
    for (const q of ['q01', 'q02', 'q03', 'q04', 'q05', 'q06', 'q07', 'q08']) ghiLech(q)
    ghiLech('q00', 'dat')
    const s = soanGia((t, lan) => {
      if (lan === 1) return tra({ ok: true, xong: false, conTro: 'DE|q3', dem: { dat: 3, bo_qua: 2 }, ketQua: ketDat(3) })
      if (lan === 2) return tra({ ok: true, xong: true, conTro: '', dem: { dat: 1 }, ketQua: ketDat(1) })
      if (lan === 3) {
        // xử lý 3 câu đầu danh sách (hết ngân sách): q01, q02 thành đạt ⇒ rời danh sách lệch; q03 vẫn lệch
        ghiLech('q01', 'dat'); ghiLech('q02', 'dat')
        return tra({ ok: true, xong: false, conTro: '#3', dem: { dat: 2, lech: 1 }, ketQua: [...ketDat(2), { qid: 'q03', ket: 'lech', lanThu: 4 }] })
      }
      const qids = t.qids as string[]
      return tra({ ok: true, xong: true, conTro: '', dem: { dat: qids.length }, ketQua: ketDat(qids.length) })
    })
    let t = NGOAI_CAO_DIEM
    const luot = async () => { t += 60_000; return await chayMaySoanCron(env, t, { soanLo: s.fn }) }
    await luot()
    expect(trangThai()).toMatchObject({ vong: 'chinh', con_tro: 'DE|q3' })
    await luot()
    expect(s.goi[1]!.conTro).toBe('DE|q3')
    expect(trangThai()).toMatchObject({ vong: 'sua', con_tro: '' })
    await luot()
    expect(s.goi[2]).toMatchObject({ chiSuaLoi: true, tuSuaDapAn: false, qids: ['q01', 'q02', 'q03', 'q04', 'q05', 'q06'] })
    expect(trangThai()).toMatchObject({ vong: 'sua', con_tro: 'q03' })
    await luot()
    expect(s.goi[3]!.qids).toEqual(['q04', 'q05', 'q06', 'q07', 'q08']) // q04 KHÔNG bị bỏ qua dù q01, q02 đã rời danh sách
    expect(trangThai()).toMatchObject({ vong: 'sua', con_tro: 'q08' })
    await luot()
    expect(s.goi).toHaveLength(4) // hết câu lệch sau q08 ⇒ chuyển xong, không gọi
    expect(trangThai().vong).toBe('xong')
    expect(await luot()).toMatchObject({ chay: false, lyDo: 'da_xong' })
    expect(s.goi).toHaveLength(4)
    const dem = JSON.parse(String(trangThai().dem_json)) as Record<string, number>
    expect(dem).toMatchObject({ luot: 4, dat: 3 + 1 + 2 + 5, lech: 1, bo_qua: 2 })
    expect(trangThai().dang_chay_den).toBe(0)
  })
})

describe('vòng sửa: qid sai mẫu của máy soạn', () => {
  it('qid sai mẫu bị lọc (không làm cả lô 400), vòng sửa vẫn tới xong; trang toàn qid sai mẫu ⇒ bước qua không gọi', async () => {
    datCo({ bat: true })
    d.sql.prepare("UPDATE may_soan_trang_thai SET vong = 'sua', con_tro = '' WHERE id = 1").run()
    const ghi = (qid: string) => d.sql.prepare(`INSERT INTO loi_giai_so_do (qid, ma_de, version, phien_ban, ban_json, cong, tao_luc, cap_nhat_luc)
      VALUES (?, 'DE', 'v', 1, '{}', 'lech', 'x', 'x')`).run(qid)
    for (const q of ['q01', 'Đề x-III-1', 'q03']) ghi(q) // chữ có dấu + khoảng trắng: sai mẫu RE_QID
    const s = soanGia((t) => tra({ ok: true, xong: true, conTro: '', dem: { lech: (t.qids as string[]).length }, ketQua: [] }))
    await chayMaySoanCron(env, NGOAI_CAO_DIEM, { soanLo: s.fn })
    expect(s.goi[0]!.qids).toEqual(['q01', 'q03'])
    expect(trangThai()).toMatchObject({ vong: 'sua', con_tro: 'Đề x-III-1' }) // xong cả lô ⇒ con trỏ = qid cuối TRANG (chữ có dấu xếp sau 'q')
    await chayMaySoanCron(env, NGOAI_CAO_DIEM + 60_000, { soanLo: s.fn })
    expect(trangThai().vong).toBe('xong')
    // trang chỉ toàn qid sai mẫu
    d.sql.prepare("UPDATE may_soan_trang_thai SET vong = 'sua', con_tro = 'q03' WHERE id = 1").run()
    ghi('zz_xau 1')
    await chayMaySoanCron(env, NGOAI_CAO_DIEM + 120_000, { soanLo: s.fn })
    expect(s.goi).toHaveLength(1)
    expect(trangThai()).toMatchObject({ vong: 'sua', con_tro: 'Đề x-III-1' }) // trang ['zz_xau 1', 'Đề x-III-1'] toàn sai mẫu
    await chayMaySoanCron(env, NGOAI_CAO_DIEM + 180_000, { soanLo: s.fn })
    expect(trangThai().vong).toBe('xong')
  })

  it('vòng sửa: lô bị từ chối 400 ⇒ bước qua lô, không kẹt; không tính là lỗi hạn mức', async () => {
    datCo({ bat: true })
    d.sql.prepare("UPDATE may_soan_trang_thai SET vong = 'sua', con_tro = '' WHERE id = 1").run()
    d.sql.prepare(`INSERT INTO loi_giai_so_do (qid, ma_de, version, phien_ban, ban_json, cong, tao_luc, cap_nhat_luc) VALUES ('q01', 'DE', 'v', 1, '{}', 'lech', 'x', 'x')`).run()
    const s = soanGia(() => tra({ ok: false, error: 'qid không hợp lệ' }, 400))
    await chayMaySoanCron(env, NGOAI_CAO_DIEM, { soanLo: s.fn })
    expect(trangThai()).toMatchObject({ vong: 'sua', con_tro: 'q01', so_loi_lien_tiep: 0 })
    await chayMaySoanCron(env, NGOAI_CAO_DIEM + 60_000, { soanLo: s.fn })
    expect(trangThai().vong).toBe('xong')
    expect(s.goi).toHaveLength(1)
  })
})

describe('tự hãm', () => {
  it('3 lượt lỗi 429 ⇒ nghỉ 30 phút; hết nghỉ mà lỗi tiếp ⇒ nghỉ tiếp; lượt soạn được ⇒ về 0', async () => {
    datCo({ bat: true })
    let kieu: 'loi' | 'tot' = 'loi'
    const s = soanGia(() => kieu === 'loi'
      ? tra({ ok: true, xong: false, conTro: '', dem: { loi_goi: 3 }, ketQua: [1, 2, 3].map((i) => ({ qid: `q${i}`, ket: 'loi_goi', lyDo: 'HTTP 429 Resource exhausted', lanThu: 2 })) })
      : tra({ ok: true, xong: false, conTro: 'DE|q9', dem: { dat: 1, loi_goi: 1 }, ketQua: [{ qid: 'a', ket: 'dat', lanThu: 1 }, { qid: 'b', ket: 'loi_goi', lyDo: 'HTTP 429', lanThu: 2 }] }))
    let t = NGOAI_CAO_DIEM
    for (let i = 1; i <= 2; i++) { t += 60_000; await chayMaySoanCron(env, t, { soanLo: s.fn }); expect(trangThai()).toMatchObject({ so_loi_lien_tiep: i, nghi_den: 0 }) }
    t += 60_000
    expect(await chayMaySoanCron(env, t, { soanLo: s.fn })).toMatchObject({ chay: true, nghi: true })
    expect(trangThai()).toMatchObject({ so_loi_lien_tiep: 3, nghi_den: t + NGHI_KHI_LOI_MS })
    expect(String(trangThai().ly_do)).toMatch(/nghỉ 30 phút/)
    expect(String(trangThai().ly_do)).not.toMatch(/Resource exhausted/)
    const truocNghi = s.goi.length
    expect(await chayMaySoanCron(env, t + 60_000, { soanLo: s.fn })).toMatchObject({ chay: false, lyDo: 'dang_nghi' })
    expect(await chayMaySoanCron(env, t + NGHI_KHI_LOI_MS - 1, { soanLo: s.fn })).toMatchObject({ chay: false, lyDo: 'dang_nghi' })
    expect(s.goi.length).toBe(truocNghi)
    t += NGHI_KHI_LOI_MS
    await chayMaySoanCron(env, t, { soanLo: s.fn })
    expect(s.goi.length).toBe(truocNghi + 1)
    expect(trangThai()).toMatchObject({ so_loi_lien_tiep: 4, nghi_den: t + NGHI_KHI_LOI_MS }) // vẫn lỗi ⇒ nghỉ tiếp
    t += NGHI_KHI_LOI_MS
    kieu = 'tot'
    await chayMaySoanCron(env, t, { soanLo: s.fn })
    expect(trangThai()).toMatchObject({ so_loi_lien_tiep: 0, ly_do: null, con_tro: 'DE|q9' })
  })

  it('máy soạn trả 503 (vd chưa có khoá) hoặc ném lỗi ⇒ đếm lỗi, nhả khoá, không ném ra ngoài', async () => {
    datCo({ bat: true })
    const s503 = soanGia(() => tra({ ok: false, error: 'Máy chủ chưa có khoá GEMINI_API_KEY.' }, 503))
    expect(await chayMaySoanCron(env, NGOAI_CAO_DIEM, { soanLo: s503.fn })).toMatchObject({ chay: true })
    expect(trangThai()).toMatchObject({ so_loi_lien_tiep: 1, dang_chay_den: 0, con_tro: '' })
    const nem: SoanLo = async () => { throw new Error('D1_ERROR: lỗi giả') }
    expect(await chayMaySoanCron(env, NGOAI_CAO_DIEM + 60_000, { soanLo: nem })).toMatchObject({ chay: true })
    expect(trangThai()).toMatchObject({ so_loi_lien_tiep: 2, dang_chay_den: 0 })
    expect(String(trangThai().ly_do)).toMatch(/lỗi lượt soạn/)
  })
})

describe('tự sửa đáp án và giờ cao điểm', () => {
  it('cờ tuSuaDapAn bật nhưng có chặng KTCN đang mở ⇒ tuSuaDapAn false; hết chặng ⇒ true', async () => {
    datCo({ bat: true, tuSuaDapAn: true })
    const s = soanGia(() => tra({ ok: true, xong: false, conTro: 'DE|q1', dem: { dat: 1 }, ketQua: ketDat(1) }))
    const t = NGOAI_CAO_DIEM
    d.sql.prepare("INSERT INTO kiem_tra_ca_nhan (id, sbd, lop, ngay, mo_luc, han_luc, trang_thai, json, cap_nhat_luc) VALUES ('b1', '001', '12A1', '2026-10-27', ?, ?, 'mo', '{}', ?)")
      .run(t - 600_000, t + 3_600_000, t)
    d.sql.prepare('INSERT INTO kiem_tra_ca_nhan_chang (bai_id, stt, bat_dau, han, chot_luc) VALUES (?, 0, ?, ?, NULL)').run('b1', t - 60_000, t + 600_000)
    expect(await chayMaySoanCron(env, t, { soanLo: s.fn })).toMatchObject({ chay: true, tuSuaDapAn: false })
    expect(s.goi[0]!.tuSuaDapAn).toBe(false)
    d.sql.prepare('UPDATE kiem_tra_ca_nhan_chang SET chot_luc = ? WHERE bai_id = ?').run(t, 'b1')
    expect(await chayMaySoanCron(env, t + 60_000, { soanLo: s.fn })).toMatchObject({ chay: true, tuSuaDapAn: true })
    expect(s.goi[1]!.tuSuaDapAn).toBe(true)
  })

  it('giờ cao điểm 19–24h VN: không có cờ gioCaoDiem ⇒ không chạy; có ⇒ chạy 1 câu song song', async () => {
    datCo({ bat: true })
    const s = soanGia(() => tra({ ok: true, xong: false, conTro: 'DE|q1', dem: { dat: 1 }, ketQua: ketDat(1) }))
    expect(await chayMaySoanCron(env, CAO_DIEM, { soanLo: s.fn })).toMatchObject({ chay: false, lyDo: 'gio_cao_diem' })
    expect(s.goi).toHaveLength(0)
    datCo({ bat: true, gioCaoDiem: true })
    expect(await chayMaySoanCron(env, CAO_DIEM, { soanLo: s.fn })).toMatchObject({ chay: true })
    expect(s.goi[0]).toMatchObject({ songSong: 1, choChayGioCaoDiem: true })
  })
})
