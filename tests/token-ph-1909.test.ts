// @vitest-environment node
// TOKEN PHỤ HUYNH — GIAI ĐOẠN MỀM (server/src/ph-truy-cap.ts; hợp đồng docs/token-phu-huynh-1909.md). SQLite thật, lược đồ thật + mọi migration.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { gameToken, parentPass } from '../server/src/game-v2-auth'
import { mom } from '../server/src/mom'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { DIA_CHI_APP, NGAY_HAN_LIEN_KET, TOI_DA_EM_MOI_LUOT_CAP_MA, ghiTruyCap, phDemTruyCap, sbdCuaPhuHuynh } from '../server/src/ph-truy-cap'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const NGAY = 86_400_000
const ngayVnHomNay = () => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10)
const themEm = (d: D1That, sbd: string, hoTen: string, lop: string, matKhau: string | null) =>
  d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,?)').run(sbd, hoTen, lop, matKhau, 'x')
const truyCap = (d: D1That) => d.sql.prepare('SELECT sbd,kieu,duong,so FROM ph_truy_cap ORDER BY sbd,kieu,duong').all() as { sbd: string; kieu: string; duong: string; so: number }[]
const giaiMa = (t: string) => JSON.parse(atob(t.split('.')[0]!)) as Record<string, any>
const cauKho = (qid: string) => ({
  qid, maDe: 'x', version: 'v', group: `g-${qid}`, phan: 'I', text: `Chọn phát biểu đúng về ${qid}.`, choices: ['A. a', 'B. b', 'C. c', 'D. d'], ideas: [], hinhAnh: [],
  dang: 'ES.A.X', tenDang: 'Dạng', mucDo: 'hieu', sao: 1, kienThuc: ['k1'], correct: 'B', solution: 'Lời giải ngắn', reviewed: true,
})
function themCau(d: D1That, cau: string[]) {
  d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE12','DE12','12A',?, 'kho/DE12.json',0,'v1')").run(cau.length)
  d.sql.prepare("INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE12','v1','x')").run()
  for (const q of cau) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE12', q, 'v', `g-${q}`, 'ES.A.X', JSON.stringify({ ...cauKho(q), maDe: 'DE12' }))
}
/** S1 (12A, mật khẩu mk-1, 3 câu sai cách đây 3 ngày → có việc ôn), S2 (12A, mk-2), S3 (11B, chưa có mật khẩu). */
async function dung() {
  const d = taoD1That()
  themEm(d, 'S1', 'Nguyễn An', '12A', 'mk-1'); themEm(d, 'S2', 'Trần Bình', '12A', 'mk-2'); themEm(d, 'S3', 'Lê Cường', '11B', null)
  themCau(d, ['T1', 'T2', 'T3', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6'])
  const r = await ghiSuKien(d.env, ['T1', 'T2', 'T3'].map((q, i) => ({ nguon: 'btvn' as const, maNguon: 'B1', sbd: 'S1', qid: q, lan: i + 1, ketQua: 0 as const, luc: new Date(Date.now() - 3 * NGAY).toISOString() })))
  expect(r.ok).toBe(true)
  await dungLaiHoSo(d.env, ['S1'], new Date().toISOString())
  return d
}
const goi = (d: D1That, p: string, b: Record<string, unknown>, thay = false) => goiWorker(worker, d.env, p, b, thay)

describe('bộ giải SBD phụ huynh: token quyết định, SBD trần chỉ ở giai đoạn mềm', () => {
  it('có pass ⇒ SBD lấy từ TOKEN, `sbd` trong thân bị bỏ qua (token của em A không đọc được em B); đếm loại token', async () => {
    const d = await dung()
    const r = await sbdCuaPhuHuynh(d.env, { pass: await parentPass(d.env, 'S1'), sbd: 'S2' }, 'parent-news')
    expect(r).toEqual({ sbd: 'S1', kieu: 'token' })
    expect(truyCap(d)).toEqual([{ sbd: 'S1', kieu: 'token', duong: 'parent-news', so: 1 }])
  })
  it('không có pass ⇒ SBD trần (giai đoạn mềm) và được ĐẾM loại sbd_tran; cộng dồn theo ngày, em, loại, đường', async () => {
    const d = await dung()
    for (let i = 0; i < 3; i++) expect(await sbdCuaPhuHuynh(d.env, { sbd: 'S1' }, 'parent-news')).toEqual({ sbd: 'S1', kieu: 'sbd_tran' })
    await sbdCuaPhuHuynh(d.env, { sbd: 'S1' }, 'mom')
    await sbdCuaPhuHuynh(d.env, { sbd: 'S2', pass: '   ' }, 'parent-news') // pass rỗng/khoảng trắng = không có pass
    expect(truyCap(d)).toEqual([
      { sbd: 'S1', kieu: 'sbd_tran', duong: 'mom', so: 1 },
      { sbd: 'S1', kieu: 'sbd_tran', duong: 'parent-news', so: 3 },
      { sbd: 'S2', kieu: 'sbd_tran', duong: 'parent-news', so: 1 },
    ])
    expect((d.sql.prepare('SELECT DISTINCT ngay FROM ph_truy_cap').all() as { ngay: string }[]).map((x) => x.ngay)).toEqual([ngayVnHomNay()])
  })
  it('token hỏng/hết hạn/bị thu hồi ⇒ BÁO LỖI, KHÔNG rơi xuống SBD trần dù thân có `sbd` đúng; không đếm', async () => {
    const d = await dung()
    const t = await parentPass(d.env, 'S1')
    d.sql.prepare("UPDATE hoc_sinh SET mat_khau='mk-moi' WHERE sbd='S1'").run()
    await expect(sbdCuaPhuHuynh(d.env, { pass: t, sbd: 'S1' }, 'mom')).rejects.toThrow(/hết hiệu lực/)
    await expect(sbdCuaPhuHuynh(d.env, { pass: 'rac.rac', sbd: 'S1' }, 'mom')).rejects.toThrow(/Mã xem tiến bộ/)
    await expect(sbdCuaPhuHuynh(d.env, { pass: 12345, sbd: 'S1' }, 'mom')).rejects.toThrow(/Mã xem tiến bộ/)
    await expect(sbdCuaPhuHuynh(d.env, { pass: { a: 1 }, sbd: 'S1' }, 'mom')).rejects.toThrow(/Mã xem tiến bộ/)
    expect(truyCap(d)).toEqual([])
  })
  it('lệnh chỉ-token (chiToken) từ chối SBD trần; em không có thật hoặc SBD quá dài ⇒ báo lỗi, không đếm', async () => {
    const d = await dung()
    await expect(sbdCuaPhuHuynh(d.env, { sbd: 'S1' }, 'ph-ke-hoach', { chiToken: true })).rejects.toThrow(/liên kết riêng/)
    await expect(sbdCuaPhuHuynh(d.env, { sbd: 'KHONG-CO' }, 'mom')).rejects.toThrow(/Không tìm thấy số báo danh/)
    await expect(sbdCuaPhuHuynh(d.env, { sbd: 'x'.repeat(41) }, 'mom')).rejects.toThrow(/Không tìm thấy số báo danh/)
    await expect(sbdCuaPhuHuynh(d.env, {}, 'mom')).rejects.toThrow(/Không tìm thấy số báo danh/)
    // token ký đúng nhưng em đã bị xoá khỏi hoc_sinh
    const t = await parentPass(d.env, 'S3')
    d.sql.prepare("DELETE FROM hoc_sinh WHERE sbd='S3'").run()
    await expect(sbdCuaPhuHuynh(d.env, { pass: t }, 'mom')).rejects.toThrow(/Không tìm thấy số báo danh/)
    expect(truyCap(d)).toEqual([])
  })
  it('đếm lỗi (chưa chạy migration ph_truy_cap) KHÔNG làm hỏng lệnh chính', async () => {
    const d = await dung()
    d.sql.exec('DROP TABLE ph_truy_cap')
    expect(await sbdCuaPhuHuynh(d.env, { sbd: 'S1' }, 'parent-news')).toEqual({ sbd: 'S1', kieu: 'sbd_tran' })
    await expect(ghiTruyCap(d.env, 'S1', 'token', 'mom')).resolves.toBeUndefined()
    expect((await goi(d, '/parent-news/list', { sbd: 'S1' })).ok).toBe(true)
  })
})

describe('đường cũ nhận cả token lẫn SBD trần (giai đoạn mềm)', () => {
  it('/parent-news/list: token và SBD trần đều ra bản tin của em; pass thắng `sbd`: chỉ em trong token có bản tin mới', async () => {
    const d = await dung()
    const t1 = await parentPass(d.env, 'S1')
    expect((await goi(d, '/parent-news/list', { sbd: 'S1' })).ok).toBe(true)
    const a = await goi(d, '/parent-news/list', { pass: t1 })
    expect(a.ok).toBe(true)
    const b = await goi(d, '/parent-news/list', { pass: t1, sbd: 'S2' }) // cố đọc em khác bằng token của em này
    expect(b.ok).toBe(true)
    expect(b.report.sbd).toBe('S1') // dữ liệu của em trong TOKEN, không phải em trong thân
    expect(a.report.sbd).toBe('S1')
    const co = (d.sql.prepare('SELECT DISTINCT sbd FROM parent_daily_news').all() as { sbd: string }[]).map((x) => x.sbd)
    expect(co).toEqual(['S1'])
    expect(truyCap(d)).toEqual([
      { sbd: 'S1', kieu: 'sbd_tran', duong: 'parent-news', so: 1 },
      { sbd: 'S1', kieu: 'token', duong: 'parent-news', so: 2 },
    ])
    const hong = await goi(d, '/parent-news/list', { pass: 'rac.rac', sbd: 'S1' })
    expect(hong.ok).toBe(false)
    expect(String(hong.error)).toMatch(/Mã xem tiến bộ/)
  })
  it('/student-news/* (em đã có token học sinh) KHÔNG bị đếm là phụ huynh', async () => {
    const d = await dung()
    const tk = await gameToken(d.env, 'S1')
    expect((await goi(d, '/student-news/list', { token: tk })).ok).toBe(true)
    expect(truyCap(d)).toEqual([])
  })
  it('/mom/parent-list và /mom/create nhận token; token quyết định em, `sbd` trong thân bị bỏ qua', async () => {
    const d = await dung()
    const t1 = await parentPass(d.env, 'S1')
    const tao = await goi(d, '/mom/create', { pass: t1, sbd: 'S2', id: 'PH-1', tieuDe: 'Bài của phụ huynh', dsCau: [{ qid: 'T1', dapAn: 'B' }] })
    expect(tao.ok).toBe(true)
    expect((d.sql.prepare("SELECT sbd FROM mom_bai WHERE id='PH-1'").all() as { sbd: string }[]).map((x) => x.sbd)).toEqual(['S1'])
    const ds = await goi(d, '/mom/parent-list', { pass: t1 })
    expect(ds.ok).toBe(true)
    expect(ds.items.map((x: any) => x.id)).toContain('PH-1')
    const cu = await goi(d, '/mom/parent-list', { sbd: 'S1' })
    expect(cu.items.map((x: any) => x.id)).toContain('PH-1')
    expect((await goi(d, '/mom/parent-list', { pass: 'rac.rac', sbd: 'S1' })).ok).toBe(false)
    expect(truyCap(d).filter((x) => x.duong === 'mom')).toEqual([
      { sbd: 'S1', kieu: 'sbd_tran', duong: 'mom', so: 1 },
      { sbd: 'S1', kieu: 'token', duong: 'mom', so: 2 },
    ])
  })
  it('lệnh NỘI BỘ (bài hằng ngày `assign` gọi mom create) không bị đếm thêm một lượt "mom"', async () => {
    const d = await dung()
    const r = await goi(d, '/parent-news/assign', { pass: await parentPass(d.env, 'S1') })
    expect(r.ok).toBe(true)
    expect(String(r.id)).toMatch(/^daily_/)
    expect(truyCap(d)).toEqual([{ sbd: 'S1', kieu: 'token', duong: 'parent-news', so: 1 }])
    // gọi trực tiếp có/không noiBo
    await mom(d.env, 'create', { sbd: 'S2', id: 'X-1', dsCau: [{ qid: 'T1', dapAn: 'B' }] }, { noiBo: true })
    expect(truyCap(d).filter((x) => x.sbd === 'S2')).toEqual([])
    await ghiSuKien(d.env,[{nguon:'btvn',maNguon:'B2',sbd:'S2',qid:'T1',lan:1,ketQua:0,luc:new Date(Date.now()-3*NGAY).toISOString()}])
    await mom(d.env, 'create', { sbd: 'S2', id: 'X-2', dsCau: [{ qid: 'T1', dapAn: 'B' }] })
    expect(truyCap(d).filter((x) => x.sbd === 'S2')).toEqual([{ sbd: 'S2', kieu: 'sbd_tran', duong: 'mom', so: 1 }])
  })
})

describe('/ph/xac-dinh và /ph/ke-hoach: chỉ nhận token', () => {
  it('/ph/xac-dinh: trả sbd, họ tên, lớp của con; không token hoặc SBD trần ⇒ ok:false', async () => {
    const d = await dung()
    expect(await goi(d, '/ph/xac-dinh', { pass: await parentPass(d.env, 'S1') })).toMatchObject({ ok: true, sbd: 'S1', hoTen: 'Nguyễn An', lop: '12A' })
    expect(await goi(d, '/ph/xac-dinh', { sbd: 'S1' })).toMatchObject({ ok: false })
    expect(await goi(d, '/ph/xac-dinh', {})).toMatchObject({ ok: false })
    expect((await goi(d, '/ph/xac-dinh', { pass: 'rac.rac' })).ok).toBe(false)
    expect(truyCap(d)).toEqual([{ sbd: 'S1', kieu: 'token', duong: 'ph-xac-dinh', so: 1 }])
  })
  it('/ph/ke-hoach: có việc ôn của con, số phút, tiến bộ; KHÔNG lộ mã câu, mã bài, mã ca, chiTiet hay chữ ghiChu; SBD trần bị từ chối', async () => {
    const d = await dung()
    const t = await parentPass(d.env, 'S1')
    expect(await goi(d, '/ph/ke-hoach', { sbd: 'S1' })).toMatchObject({ ok: false })
    const r = await goi(d, '/ph/ke-hoach', { pass: t, sbd: 'S2' })
    expect(r).toMatchObject({ ok: true, hoTen: 'Nguyễn An', lop: '12A', phutMoiNgay: 20, phutLaMacDinh: true, phutToiThieu: 10, phutToiDa: 45 })
    expect(typeof r.mucTieuCau).toBe('number')
    expect(r.viec.length).toBeGreaterThan(0)
    const onLai = r.viec.find((v: any) => v.loai === 'on_lai')
    expect(onLai).toMatchObject({ loai: 'on_lai', soCau: 3 })
    for (const v of r.viec) expect(Object.keys(v).sort()).toEqual(['batBuoc', 'hanCung', 'hanMem', 'khan', 'loai', 'soCau'])
    const chuoi = JSON.stringify(r)
    for (const cam of ['T1', 'T2', 'T3', 'chiTiet', 'ghiChu', 'noiDung', 'qid', 'sbd', 'B1', 'DE12']) expect(chuoi, cam).not.toContain(cam)
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM ke_hoach_ngay WHERE sbd='S1'").get()).toEqual({ n: 1 })
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM ke_hoach_ngay WHERE sbd='S2'").get()).toEqual({ n: 0 })
  })
})

describe('/ph/thoi-gian-hoc: phụ huynh xem và đặt số phút học mỗi ngày của con', () => {
  it('đọc mặc định 20; đặt 30 ⇒ lưu study_preferences, kế hoạch dùng ngay; 9, 46, chữ ⇒ từ chối và KHÔNG đổi; token của em A không đổi em B', async () => {
    const d = await dung()
    const t = await parentPass(d.env, 'S1')
    expect(await goi(d, '/ph/thoi-gian-hoc', { pass: t })).toMatchObject({ ok: true, phut: 20, laMacDinh: true, toiThieu: 10, toiDa: 45 })
    expect(await goi(d, '/ph/thoi-gian-hoc', { pass: t, phut: 30, sbd: 'S2' })).toMatchObject({ ok: true, phut: 30, laMacDinh: false })
    expect(d.sql.prepare('SELECT sbd, minutes FROM study_preferences ORDER BY sbd').all()).toEqual([{ sbd: 'S1', minutes: 30 }])
    expect((await goi(d, '/ph/ke-hoach', { pass: t })).phutMoiNgay).toBe(30)
    for (const xau of [9, 46, 'abc', 0, -5, 1000]) {
      const r = await goi(d, '/ph/thoi-gian-hoc', { pass: t, phut: xau })
      expect(r.ok, String(xau)).toBe(false)
      expect(String(r.error)).toMatch(/từ 10 đến 45/)
    }
    expect(d.sql.prepare("SELECT minutes FROM study_preferences WHERE sbd='S1'").get()).toEqual({ minutes: 30 })
    expect((await goi(d, '/ph/thoi-gian-hoc', { pass: t, phut: 10 })).phut).toBe(10)
    expect((await goi(d, '/ph/thoi-gian-hoc', { pass: t, phut: 45 })).phut).toBe(45)
    expect(await goi(d, '/ph/thoi-gian-hoc', { sbd: 'S1', phut: 15 })).toMatchObject({ ok: false })
    expect(d.sql.prepare("SELECT minutes FROM study_preferences WHERE sbd='S1'").get()).toEqual({ minutes: 45 })
  })
  it('lệnh của em `/hs/thoi-gian-hoc` vẫn chạy như cũ (dùng chung một hàm ghi)', async () => {
    const d = await dung()
    const tk = await gameToken(d.env, 'S1')
    expect(await goi(d, '/hs/thoi-gian-hoc', { token: tk, phut: 25 })).toMatchObject({ ok: true, phut: 25 })
    expect((await goi(d, '/hs/thoi-gian-hoc', { token: tk, phut: 99 })).ok).toBe(false)
    expect(d.sql.prepare("SELECT minutes FROM study_preferences WHERE sbd='S1'").get()).toEqual({ minutes: 25 })
    expect(await goi(d, '/ph/thoi-gian-hoc', { pass: await parentPass(d.env, 'S1') })).toMatchObject({ phut: 25, laMacDinh: false })
  })
})

describe('/ph/cap-ma: thầy cấp liên kết phụ huynh', () => {
  it('đòi mã bí mật; cấp theo dsSbd (bỏ SBD không có, báo khongTimThay); liên kết đúng dạng; token dùng được và hạn 90 ngày', async () => {
    const d = await dung()
    expect((await goi(d, '/ph/cap-ma', { dsSbd: ['S1'] })).ok).not.toBe(true)
    const r = await goi(d, '/ph/cap-ma', { dsSbd: ['S1', 'S3', 'KHONG-CO', 'S1'] }, true)
    expect(r).toMatchObject({ ok: true, hanNgay: NGAY_HAN_LIEN_KET, khongTimThay: ['KHONG-CO'] })
    expect(r.ma.map((x: any) => x.sbd)).toEqual(['S1', 'S3'])
    const s1 = r.ma[0]
    expect(s1).toMatchObject({ hoTen: 'Nguyễn An', lop: '12A', chuaCoMatKhau: false })
    expect(r.ma[1]).toMatchObject({ sbd: 'S3', chuaCoMatKhau: true })
    expect(s1.lienKet).toBe(`${DIA_CHI_APP}/ph?ph=${encodeURIComponent(s1.pass)}`)
    expect(decodeURIComponent(new URL(s1.lienKet).searchParams.get('ph')!)).toBe(s1.pass)
    const han = giaiMa(s1.pass).exp - Date.now()
    expect(han).toBeGreaterThan(89 * NGAY)
    expect(han).toBeLessThanOrEqual(90 * NGAY)
    expect(await goi(d, '/ph/xac-dinh', { pass: s1.pass })).toMatchObject({ ok: true, sbd: 'S1' })
    // mã game chia sẻ vẫn 30 ngày
    expect(giaiMa(await parentPass(d.env, 'S1')).exp - Date.now()).toBeLessThanOrEqual(30 * NGAY)
    // đổi mật khẩu ⇒ liên kết đã phát hết hiệu lực
    d.sql.prepare("UPDATE hoc_sinh SET mat_khau='mk-doi' WHERE sbd='S1'").run()
    expect((await goi(d, '/ph/xac-dinh', { pass: s1.pass })).ok).toBe(false)
  })
  it('cấp theo lớp; danh sách rỗng hoặc quá 100 em ⇒ từ chối', async () => {
    const d = await dung()
    const r = await goi(d, '/ph/cap-ma', { lop: '12A' }, true)
    expect(r.ma.map((x: any) => x.sbd)).toEqual(['S1', 'S2'])
    expect((await goi(d, '/ph/cap-ma', {}, true)).ok).toBe(false)
    expect((await goi(d, '/ph/cap-ma', { lop: 'khong-co-lop' }, true)).ok).toBe(false)
    const nhieu = Array.from({ length: TOI_DA_EM_MOI_LUOT_CAP_MA + 1 }, (_, i) => `E${i}`)
    const q = await goi(d, '/ph/cap-ma', { dsSbd: nhieu }, true)
    expect(q.ok).toBe(false)
    expect(String(q.error)).toMatch(/Tối đa 100/)
  })
})

describe('/ph/dem-truy-cap: số liệu để thầy quyết giai đoạn cứng', () => {
  it('đòi mã bí mật; đếm theo loại/đường; liệt kê em CHỈ dùng SBD trần (em đã dùng token thì không còn nằm trong danh sách)', async () => {
    const d = await dung()
    expect((await goi(d, '/ph/dem-truy-cap', {})).ok).not.toBe(true)
    await sbdCuaPhuHuynh(d.env, { sbd: 'S1' }, 'parent-news'); await sbdCuaPhuHuynh(d.env, { sbd: 'S1' }, 'parent-news')
    await sbdCuaPhuHuynh(d.env, { sbd: 'S2' }, 'mom')
    await sbdCuaPhuHuynh(d.env, { pass: await parentPass(d.env, 'S1') }, 'parent-news')
    await sbdCuaPhuHuynh(d.env, { pass: await parentPass(d.env, 'S3') }, 'ph-ke-hoach')
    const r = await goi(d, '/ph/dem-truy-cap', {}, true)
    expect(r).toMatchObject({ ok: true, soNgay: 14, denNgay: ngayVnHomNay(), token: { luot: 2, em: 2 }, sbdTran: { luot: 3, em: 2 } })
    expect(r.theoDuong).toEqual([
      { kieu: 'sbd_tran', duong: 'mom', luot: 1, em: 1 },
      { kieu: 'sbd_tran', duong: 'parent-news', luot: 2, em: 1 },
      { kieu: 'token', duong: 'parent-news', luot: 1, em: 1 },
      { kieu: 'token', duong: 'ph-ke-hoach', luot: 1, em: 1 },
    ])
    expect(r.emChiSbdTran).toEqual([{ sbd: 'S2', luot: 1 }]) // S1 đã có token
  })
  it('cửa sổ ngày: dòng cũ hơn không tính; ngay tối đa 60, mặc định 14; chưa chạy migration ⇒ ok:false có chữ', async () => {
    const d = await dung()
    const cu = new Date(Date.now() - 20 * NGAY + 7 * 3_600_000).toISOString().slice(0, 10)
    d.sql.prepare("INSERT INTO ph_truy_cap(ngay,sbd,kieu,duong,so,luc) VALUES(?,'S2','sbd_tran','mom',9,'x')").run(cu)
    await sbdCuaPhuHuynh(d.env, { sbd: 'S1' }, 'mom')
    expect((await goi(d, '/ph/dem-truy-cap', {}, true)).sbdTran).toEqual({ luot: 1, em: 1 })
    const dai = await goi(d, '/ph/dem-truy-cap', { ngay: 30 }, true)
    expect(dai.sbdTran).toEqual({ luot: 10, em: 2 })
    expect((await goi(d, '/ph/dem-truy-cap', { ngay: 9999 }, true)).soNgay).toBe(60)
    expect((await goi(d, '/ph/dem-truy-cap', { ngay: 'abc' }, true)).soNgay).toBe(14)
    d.sql.exec('DROP TABLE ph_truy_cap')
    const thieu = await phDemTruyCap(d.env, {})
    expect(thieu.ok).toBe(false)
    expect(String(thieu.error)).toMatch(/migration-1909-ph-truy-cap/)
  })
})
