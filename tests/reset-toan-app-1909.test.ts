// @vitest-environment node
// RESET TOÀN APP 00:01 thứ Hai 21/09/2026 (server/src/reset-toan-app.ts) — chạy trên SQLite THẬT với lược đồ thật + mọi migration.
import { describe, it, expect, vi, afterEach } from 'vitest'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { mom } from '../server/src/mom'
import { capNhatKeyBank, noiKhoCa } from '../server/src/goi-cu'
import {
  BANG_GIU, BANG_XOA, DONG_BANG_DEN_MS, DONG_BANG_TU_MS, KHOA_HUY, MA_RESET, MOC_RESET, MOC_RESET_MS, MUA_MOI, QUA_HAN_DANG_CHAY_MS,
  chayReset, chayResetNeuDenGio, dangLamMoi, docMocReset, docTrangThaiReset, maDaDung, resetDryRun,
} from '../server/src/reset-toan-app'
import { chayCaLop } from '../server/src/ke-hoach-ngay-d1'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

afterEach(() => vi.useRealTimers())

const SAU_MOC = MOC_RESET_MS + 5_000
const bangHienCo = (d: D1That) => (d.sql.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name").all() as { name: string }[]).map((x) => x.name)
const bam = (d: D1That, t: string) => JSON.stringify(d.sql.prepare(`SELECT * FROM "${t}" ORDER BY rowid`).all())
const dem = (d: D1That, t: string) => Number((d.sql.prepare(`SELECT COUNT(*) AS n FROM "${t}"`).get() as { n: number }).n)
const bamTatCa = (d: D1That, ds: readonly string[]) => Object.fromEntries(ds.filter((t) => bangHienCo(d).includes(t)).map((t) => [t, bam(d, t)]))

/** Gieo MỖI bảng 2 dòng (điền cột NOT NULL bằng giá trị mẫu theo kiểu) để job có gì mà xoá/giữ. */
function gieo(d: D1That, nhieuHon: Record<string, number> = {}) {
  for (const t of bangHienCo(d)) {
    const cot = d.sql.prepare(`PRAGMA table_info("${t}")`).all() as { name: string; type: string; notnull: number; dflt_value: unknown; pk: number }[]
    const tuTang = cot.length > 0 && cot.filter((c) => c.pk > 0).length === 1 && cot.find((c) => c.pk > 0)!.type.toUpperCase() === 'INTEGER'
    const dung = cot.filter((c) => !(tuTang && c.pk > 0) && ((c.notnull && c.dflt_value === null) || c.pk > 0))
    const so = nhieuHon[t] ?? 2
    for (let i = 0; i < so; i++) {
      const gt = dung.map((c) => (/INT/i.test(c.type) ? i + 1 : /REAL|FLOA|DOUB/i.test(c.type) ? i + 0.5 : `${t}-${c.name}-${i}`))
      d.sql.prepare(`INSERT OR IGNORE INTO "${t}" (${dung.map((c) => `"${c.name}"`).join(',')}) VALUES (${dung.map(() => '?').join(',')})`).run(...(gt as never[]))
    }
  }
  // Dòng có nghĩa: tài khoản có mật khẩu; ca/btvn/mom cũ với mã đọc được; cấu hình thầy; mùa game cũ.
  d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('12121212','Thầy','12A','mk-cu','x')").run()
  d.sql.prepare("INSERT OR REPLACE INTO ca(ma_ca,trang_thai,cap_nhat_luc) VALUES('CA-CU-1','dong','x')").run()
  d.sql.prepare("INSERT OR REPLACE INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES('CA-CU-1-abc','CA-CU-1','DE',3,'x','y',0,'x')").run()
  d.sql.prepare("INSERT OR REPLACE INTO mom_bai(sbd,id,title,created_at,question_count,bank_key) VALUES('12121212','daily_2026-09-20','t','x',1,'k')").run()
  d.sql.prepare("INSERT OR REPLACE INTO mom_bai(sbd,id,title,created_at,question_count,bank_key) VALUES('12121212','123e4567-e89b-42d3-a456-426614174000','t','x',1,'k')").run()
  d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('ngay_nghi','[\"2026-10-01\"]','x')").run()
  d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: '2026-09-19T08:47:43.000Z', dsSbd: ['12121212'], toanBo: false }))
  d.sql.prepare("INSERT OR REPLACE INTO game_v2_settings(key,json) VALUES('season',?)").run(JSON.stringify({ id: '2026-09-16-bat-linh-01', startedAt: '2026-09-16T04:10:27.001Z' }))
}
const dung = (nhieuHon: Record<string, number> = {}) => {
  const d = taoD1That()
  gieo(d, nhieuHon)
  return d
}
const KHONG_DOI_NOI_DUNG = BANG_GIU.filter((t) => !['cau_hinh', 'game_v2_settings', 'ma_da_dung'].includes(t))

describe('phân loại bảng', () => {
  it('MỌI bảng của lược đồ (schema + mọi migration) đều được phân loại XOÁ hoặc GIỮ — thêm bảng mới là buộc phải quyết', () => {
    const d = taoD1That()
    const daPhanLoai = new Set([...BANG_XOA, ...BANG_GIU])
    expect(bangHienCo(d).filter((t) => !daPhanLoai.has(t))).toEqual([])
  })
  it('hai danh sách không giao nhau; tài khoản, lớp, kho đề, cấu hình KHÔNG BAO GIỜ nằm trong danh sách XOÁ', () => {
    expect(BANG_XOA.filter((t) => BANG_GIU.includes(t))).toEqual([])
    for (const t of ['hoc_sinh', 'danh_sach', 'phu_huynh', 'de_kho', 'cau_hoi', 'game_v2_question', 'game_v2_index', 'cau_hinh', 'game_v2_settings', 'game_v2_scope', 'study_preferences', 'student_push', 'app_presence', 'ma_da_dung']) {
      expect(BANG_XOA, t).not.toContain(t)
    }
    expect(new Set(BANG_XOA).size).toBe(BANG_XOA.length)
  })
})

describe('chạy thử (dryRun): chỉ đếm, không ghi gì', () => {
  it('trả đúng số dòng từng bảng, danh sách xoá/giữ, bảng chưa phân loại; KHÔNG đổi một byte nào của D1', async () => {
    const d = dung()
    d.sql.exec('CREATE TABLE bang_la_moi (x TEXT)')
    d.sql.exec("INSERT INTO bang_la_moi VALUES ('a')")
    const truoc = bamTatCa(d, bangHienCo(d))
    const r = await resetDryRun(d.env)
    expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
    expect(r).toMatchObject({ ok: true, dryRun: true, mocLuc: MOC_RESET, daXong: false, huy: false, trangThaiKhoa: null })
    expect(r.chuaPhanLoai).toEqual(['bang_la_moi'])
    expect(r.xoa.find((x) => x.bang === 'su_kien_hoc')!.dong).toBe(dem(d, 'su_kien_hoc'))
    expect(r.giu.find((x) => x.bang === 'hoc_sinh')!.dong).toBe(dem(d, 'hoc_sinh'))
    expect(r.tongDongSeXoa).toBe(BANG_XOA.reduce((t, b) => t + dem(d, b), 0))
    expect(r.maSeGiuLai).toMatchObject({ mom: 3 }) // chỉ id KHÔNG phải UUID (2 dòng mẫu + daily_…)
    expect(r.maSeGiuLai.ca).toBeGreaterThan(0)
  })
  it('lệnh của thầy /reset/dry-run đòi mã bí mật', async () => {
    const d = dung()
    expect((await goiWorker(worker, d.env, '/reset/dry-run', {})).ok).not.toBe(true)
    const r = await goiWorker(worker, d.env, '/reset/dry-run', {}, true)
    expect(r).toMatchObject({ ok: true, dryRun: true })
  })
})

describe('chạy thật', () => {
  it('bảng XOÁ rỗng hết; bảng GIỮ y nguyên TỪNG DÒNG (so băm); mùa game mới; exp_moi toàn trường; các dòng cấu hình khác còn nguyên', async () => {
    const d = dung()
    const giuTruoc = bamTatCa(d, KHONG_DOI_NOI_DUNG)
    const cauHinhKhac = (d.sql.prepare("SELECT * FROM cau_hinh WHERE khoa NOT IN ('exp_moi') ORDER BY khoa").all())
    const r = await chayReset(d.env, SAU_MOC)
    expect(r).toMatchObject({ chay: true })
    for (const t of BANG_XOA) expect(dem(d, t), t).toBe(0)
    expect(bamTatCa(d, KHONG_DOI_NOI_DUNG)).toEqual(giuTruoc)
    expect(JSON.parse((d.sql.prepare("SELECT json FROM game_v2_settings WHERE key='season'").get() as { json: string }).json)).toEqual(MUA_MOI)
    expect(JSON.parse((d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='exp_moi'").get() as { gia_tri: string }).gia_tri)).toEqual({ tu: MOC_RESET, toanBo: true })
    expect(d.sql.prepare("SELECT * FROM cau_hinh WHERE khoa NOT IN ('exp_moi','reset_20260921') ORDER BY khoa").all()).toEqual(cauHinhKhac.filter((x: any) => x.khoa !== 'reset_20260921'))
    const st = (await docTrangThaiReset(d.env))!
    expect(st).toMatchObject({ trangThai: 'xong', soLanChay: 1, soEm: dem(d, 'hoc_sinh'), muaCu: expect.stringContaining('bat-linh-01') })
    expect(st.xongLuc).toBeTruthy()
    expect(st.demTruoc.su_kien_hoc).toBe(2)
    expect(st.demSau!.su_kien_hoc).toBe(0)
    expect(st.demSau!.hoc_sinh).toBe(st.demTruoc.hoc_sinh)
    expect(JSON.parse(st.expMoiCu!)).toMatchObject({ dsSbd: ['12121212'] })
  })

  it('xoá được bảng LỚN hơn một lô (9000 dòng > 4000/lô)', async () => {
    const d = dung()
    d.sql.exec(`WITH RECURSIVE c(i) AS (SELECT 1 UNION ALL SELECT i+1 FROM c WHERE i<9000)
      INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,luc,ngay_vn) SELECT 'k'||i,'S1','q','btvn','B',1,'x','2026-09-19' FROM c`)
    expect(dem(d, 'su_kien_hoc')).toBeGreaterThan(9000)
    await chayReset(d.env, SAU_MOC)
    expect(dem(d, 'su_kien_hoc')).toBe(0)
  })

  it('TẬP MÃ ĐÃ DÙNG nạp TRƯỚC khi xoá: mã ca, btvn, bài Mẹ giao không phải UUID (UUID thì không cần giữ); bảng ma_da_dung KHÔNG bị xoá', async () => {
    const d = dung()
    await chayReset(d.env, SAU_MOC)
    expect(await maDaDung(d.env, 'ca', 'CA-CU-1')).toBe(true)
    expect(await maDaDung(d.env, 'btvn', 'CA-CU-1-abc')).toBe(true)
    expect(await maDaDung(d.env, 'mom', 'daily_2026-09-20')).toBe(true)
    expect(await maDaDung(d.env, 'mom', '123e4567-e89b-42d3-a456-426614174000')).toBe(false)
    expect(await maDaDung(d.env, 'ca', 'CA-MOI-9')).toBe(false)
    expect(dem(d, 'ma_da_dung')).toBeGreaterThan(0)
  })

  it('MỘT LẦN: chạy lại lần hai không làm gì (D1 không đổi một byte); trước mốc không làm gì', async () => {
    const d = dung()
    expect((await chayReset(d.env, MOC_RESET_MS - 1000)).lyDo).toBe('chua_toi_gio')
    expect(dem(d, 'su_kien_hoc')).toBe(2)
    await chayReset(d.env, SAU_MOC)
    const truoc = bamTatCa(d, bangHienCo(d))
    const lai = await chayReset(d.env, SAU_MOC + 3600_000)
    expect(lai).toMatchObject({ chay: false, lyDo: 'da_xong' })
    expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
    // Dữ liệu MỚI sau reset không bị xoá bởi lần cron sau.
    d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,luc,ngay_vn) VALUES('moi','S1','q','btvn','B',1,'x','2026-09-22')").run()
    await chayResetNeuDenGio(d.env, SAU_MOC + 7200_000)
    expect(dem(d, 'su_kien_hoc')).toBe(1)
  })

  it('CỜ HUỶ: reset_20260921_huy = true → không chạy, không xoá gì (nhận cả "true", "1", {huy:true})', async () => {
    for (const v of ['true', '1', '{"huy":true}']) {
      const d = dung()
      d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,'x')").run(KHOA_HUY, v)
      const truoc = bamTatCa(d, bangHienCo(d))
      expect(await chayReset(d.env, SAU_MOC)).toMatchObject({ chay: false, lyDo: 'huy' })
      expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
    }
    const d = dung()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,'false','x')").run(KHOA_HUY)
    expect((await chayReset(d.env, SAU_MOC)).chay).toBe(true)
  })

  it('HAI lượt chạy CHỒNG NHAU (hai cron): đúng một lượt chạy thật', async () => {
    const d = dung()
    const kq = await Promise.all([chayReset(d.env, SAU_MOC), chayReset(d.env, SAU_MOC), chayReset(d.env, SAU_MOC)])
    expect(kq.filter((x) => x.chay)).toHaveLength(1)
    expect((await docTrangThaiReset(d.env))!.soLanChay).toBe(1)
    for (const t of BANG_XOA) expect(dem(d, t)).toBe(0)
  })

  it('bảng trong danh sách mà CHƯA TỒN TẠI thì bỏ qua, job vẫn xong', async () => {
    const d = dung()
    d.sql.exec('DROP TABLE study_drafts; DROP TABLE student_notice; DROP TABLE doan_luot')
    const r = await chayReset(d.env, SAU_MOC)
    expect(r.chay).toBe(true)
    expect(r.trangThai!.demTruoc.study_drafts).toBeNull()
    expect(dem(d, 'su_kien_hoc')).toBe(0)
  })

  it('bảng CHƯA PHÂN LOẠI không bị đụng, chỉ được báo', async () => {
    const d = dung()
    d.sql.exec('CREATE TABLE bang_la_moi (x TEXT); INSERT INTO bang_la_moi VALUES (\'a\'), (\'b\')')
    const r = await chayReset(d.env, SAU_MOC)
    expect(r.trangThai!.chuaPhanLoai).toEqual(['bang_la_moi'])
    expect(dem(d, 'bang_la_moi')).toBe(2)
  })

  it('chưa chạy migration ma_da_dung → DỪNG, KHÔNG xoá gì (không xoá khi chưa giữ được mã)', async () => {
    const d = dung()
    d.sql.exec('DROP TABLE ma_da_dung')
    const truoc = bamTatCa(d, BANG_XOA)
    const r = await chayReset(d.env, SAU_MOC)
    expect(r).toMatchObject({ chay: false, lyDo: 'loi' })
    expect(r.trangThai!.loi).toMatch(/ma-da-dung/)
    expect(bamTatCa(d, BANG_XOA)).toEqual(truoc)
  })

  it('TIẾP TỤC sau khi chết giữa chừng: nhịp tim còn mới thì bỏ qua; quá hạn thì chạy tiếp và xong, không xoá nhầm bảng GIỮ', async () => {
    const d = dung()
    const giuTruoc = bamTatCa(d, KHONG_DOI_NOI_DUNG)
    // Giả lập: lượt trước giành khoá, xoá xong vài bảng rồi chết.
    const demTruoc = Object.fromEntries(bangHienCo(d).map((t) => [t, dem(d, t)]))
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,'x')").run(MA_RESET, JSON.stringify({ trangThai: 'dang_chay', batDauLuc: new Date(SAU_MOC).toISOString(), tiepTucLuc: new Date(SAU_MOC).toISOString(), soLanChay: 1, demTruoc }))
    d.sql.exec('DELETE FROM luot; DELETE FROM su_kien_hoc')
    expect(await chayReset(d.env, SAU_MOC + 30_000)).toMatchObject({ chay: false, lyDo: 'dang_chay' })
    expect(dem(d, 'ke_hoach_ngay')).toBeGreaterThan(0)
    const r = await chayReset(d.env, SAU_MOC + QUA_HAN_DANG_CHAY_MS + 1000)
    expect(r.chay).toBe(true)
    expect(r.trangThai).toMatchObject({ trangThai: 'xong', soLanChay: 2 })
    for (const t of BANG_XOA) expect(dem(d, t)).toBe(0)
    expect(bamTatCa(d, KHONG_DOI_NOI_DUNG)).toEqual(giuTruoc)
  })
})

describe('sau reset: tài khoản còn nguyên, mọi lệnh chạy trên dữ liệu TRỐNG không lỗi', () => {
  it('đăng nhập bằng mật khẩu cũ vẫn được; hồ sơ game tạo lại là bản TRẮNG chưa chọn thú; thanThu:null; kế hoạch ngày/ca đang mở/tin PH/cron chạy được', async () => {
    const d = dung()
    await chayReset(d.env, SAU_MOC)
    const dn = await goiWorker(worker, d.env, '/hs/dang-nhap', { sbd: '12121212', matKhau: 'mk-cu' })
    expect(dn.ok).toBe(true)
    expect(dn.token).toBeTruthy()
    expect((await goiWorker(worker, d.env, '/hs/dang-nhap', { sbd: '12121212', matKhau: 'sai' })).ok).not.toBe(true)
    const kh = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: '12121212' })
    expect(kh).toMatchObject({ ok: true, thanThu: null })
    expect(kh.viec).toBeInstanceOf(Array)
    expect((await goiWorker(worker, d.env, '/hs/ca-dang-mo', { sbd: '12121212' })).ok).toBe(true)
    const pn = await goiWorker(worker, d.env, '/parent-news/list', { sbd: '12121212' })
    expect(pn.ok).toBe(true)
    await expect(chayCaLop(d.env, SAU_MOC + 60_000)).resolves.toMatchObject({ soEm: expect.any(Number) })
    const profile = await goiWorker(worker, d.env, '/game-v2/profile', { token: dn.token })
    expect(profile.ok).toBe(true)
    expect(profile.profile).toMatchObject({ choice: true, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [] })
    expect(profile.profile.nickname).toBeUndefined()
    expect((await goiWorker(worker, d.env, '/goi', { action: 'danhSachCa' }, true)).ok).toBe(true)
  })

  it('mở ca mới (publish) chạy bình thường trên bảng trống; mã ca CŨ bị từ chối, mã mới thì được', async () => {
    const d = dung()
    await chayReset(d.env, SAU_MOC)
    const moi = await goiWorker(worker, d.env, '/goi', { action: 'publish', ca: { maCa: 'CA-MOI-1', tenCa: 'Ca mới', trangThai: 'mo' } }, true)
    expect(moi.ok).toBe(true)
    expect(d.sql.prepare("SELECT ma_ca FROM ca WHERE ma_ca='CA-MOI-1'").get()).toBeTruthy()
    const cu = await goiWorker(worker, d.env, '/goi', { action: 'publish', ca: { maCa: 'CA-CU-1', tenCa: 'Ca ma', trangThai: 'mo' }, keyBank: { phanI: [] } }, true)
    expect(cu).toMatchObject({ ok: false, maCaDaDung: true })
    expect(d.sql.prepare("SELECT ma_ca FROM ca WHERE ma_ca='CA-CU-1'").get()).toBeUndefined()
    expect(d.objects.has('key/CA-CU-1.json')).toBe(false)
  })

  it('đường đẩy tờ đáp án của ca CŨ (capNhatKeyBank, noiKhoCa) bị từ chối và KHÔNG ghi R2; ca mới/mã lạ vẫn ghi được', async () => {
    const d = dung()
    await chayReset(d.env, SAU_MOC)
    expect(await capNhatKeyBank(d.env, { maCa: 'CA-CU-1', keyBank: { x: 1 } })).toMatchObject({ ok: false, maCaDaDung: true })
    expect(await noiKhoCa(d.env, { maCa: 'CA-CU-1', bank: [] })).toMatchObject({ ok: false, maCaDaDung: true })
    expect(d.objects.has('key/CA-CU-1.json')).toBe(false)
    expect(await capNhatKeyBank(d.env, { maCa: 'CA-CHUA-CO-1', keyBank: { x: 1 } })).toMatchObject({ ok: true })
    expect(d.objects.has('key/CA-CHUA-CO-1.json')).toBe(true)
  })

  it('bài Mẹ giao: mã cũ không phải UUID bị từ chối; mã mới tạo được', async () => {
    const d = dung()
    await chayReset(d.env, SAU_MOC)
    d.sql.prepare("UPDATE hoc_sinh SET mat_khau='mk-cu' WHERE sbd='12121212'").run()
    await expect(mom(d.env, 'create', { sbd: '12121212', id: 'daily_2026-09-20', dsCau: [{ id: 'Q1', dapAn: 'A' }] })).rejects.toThrow(/đã từng dùng/)
    await expect(mom(d.env, 'create', { sbd: '12121212', id: 'daily_2026-09-21', dsCau: [{ id: 'Q1', dapAn: 'A' }] })).resolves.toMatchObject({ ok: true })
  })
})

describe('đóng băng ghi trong lúc job chạy', () => {
  const luc = (phutSauMoc: number) => MOC_RESET_MS + phutSauMoc * 60_000
  it('chỉ đóng băng trong [00:00, 00:20] giờ VN khi job CHƯA xong; xong sớm thì MỞ ngay; huỷ thì không đóng; ngoài cửa sổ không tốn truy vấn', async () => {
    const d = dung()
    expect(await dangLamMoi(d.env, DONG_BANG_TU_MS - 1000)).toBe(false)
    expect(await dangLamMoi(d.env, luc(-0.5))).toBe(true) // 00:00:30
    expect(await dangLamMoi(d.env, luc(19))).toBe(true)
    expect(await dangLamMoi(d.env, DONG_BANG_DEN_MS + 1000)).toBe(false)
    const soTruoc = d.soLenh.prepare
    await dangLamMoi(d.env, DONG_BANG_DEN_MS + 5000)
    await dangLamMoi(d.env, DONG_BANG_TU_MS - 5000)
    expect(d.soLenh.prepare).toBe(soTruoc) // ngoài cửa sổ: không truy vấn nào
    await chayReset(d.env, luc(1))
    expect(await dangLamMoi(d.env, luc(4))).toBe(false) // xong lúc nào thì mở lúc ấy (sau 2 giây bộ nhớ đệm)
    const h = dung()
    h.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,'true','x')").run(KHOA_HUY)
    expect(await dangLamMoi(h.env, luc(1))).toBe(false)
  })

  it('qua Worker: trong cửa sổ trả JSON {ok:false, error, dangLamMoi:true}; /khoe vẫn qua; job xong thì lệnh chạy lại bình thường', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const d = dung()
    vi.setSystemTime(luc(0.5))
    const bi = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: '12121212' })
    expect(bi).toMatchObject({ ok: false, error: 'Hệ thống đang làm mới, thử lại sau 1 phút', dangLamMoi: true })
    const t = await goiWorker(worker, d.env, '/goi', { action: 'danhSachCa' }, true)
    expect(t.dangLamMoi).toBe(true)
    const khoe = await (await worker.fetch(new Request('https://test/khoe'), d.env)).json()
    expect((khoe as { ok: boolean }).ok).toBe(true)
    await chayReset(d.env, Date.now())
    vi.setSystemTime(luc(3)) // vượt bộ nhớ đệm 2 giây
    const xong = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: '12121212' })
    expect(xong.ok).toBe(true)
    expect(xong.dangLamMoi).toBeUndefined()
  })
})

describe('mocReset cho máy khách: CHỈ sau khi job xong', () => {
  it('trước khi xong: KHÔNG có trường mocReset ở /hs/ke-hoach-ngay, /hs/ca-dang-mo, danhSachCa; sau khi xong: "2026-09-21" ở GỐC JSON', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(MOC_RESET_MS + 25 * 60_000) // đã qua mốc và qua cửa sổ đóng băng nhưng job CHƯA chạy
    const d = dung()
    const truoc = {
      kh: await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: '12121212' }),
      ca: await goiWorker(worker, d.env, '/hs/ca-dang-mo', { sbd: '12121212' }),
      gv: await goiWorker(worker, d.env, '/goi', { action: 'danhSachCa' }, true),
      gv2: await goiWorker(worker, d.env, '/ca/danh-sach', {}, true), // đường CHÍNH của app thầy
    }
    for (const r of Object.values(truoc)) {
      expect(r.ok).toBe(true)
      expect('mocReset' in r).toBe(false)
    }
    expect(await docMocReset(d.env, Date.now())).toBeNull()
    await chayReset(d.env, Date.now())
    const sau = {
      kh: await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: '12121212' }),
      ca: await goiWorker(worker, d.env, '/hs/ca-dang-mo', { sbd: '12121212' }),
      gv: await goiWorker(worker, d.env, '/goi', { action: 'danhSachCa' }, true),
      gv2: await goiWorker(worker, d.env, '/ca/danh-sach', {}, true),
    }
    for (const r of Object.values(sau)) {
      expect(r.ok).toBe(true)
      expect(r.mocReset).toBe('2026-09-21')
    }
  })
  it('đang chạy dở (khoá dang_chay) cũng KHÔNG gửi mocReset; và TRƯỚC mốc không tốn truy vấn nào', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(MOC_RESET_MS + 25 * 60_000)
    const d = dung()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,'x')").run(MA_RESET, JSON.stringify({ trangThai: 'dang_chay', batDauLuc: MOC_RESET, soLanChay: 1, demTruoc: {} }))
    expect(await docMocReset(d.env, Date.now())).toBeNull()
    expect('mocReset' in (await goiWorker(worker, d.env, '/hs/ca-dang-mo', { sbd: '12121212' }))).toBe(false)
    const soTruoc = d.soLenh.prepare
    expect(await docMocReset(d.env, MOC_RESET_MS - 1000)).toBeNull()
    expect(d.soLenh.prepare).toBe(soTruoc)
  })
})

describe('EXP: mốc riêng tuDsSbd', () => {
  it('em trong dsSbd giữ mốc riêng sớm khi toanBo ở mốc muộn; tuDsSbd vắng thì như cũ', async () => {
    const { mocExpCuaEm } = await import('../server/src/exp-d1')
    const cfg = { tu: '2026-09-20T17:01:00.000Z', dsSbd: ['12121212'], toanBo: true, tuDsSbd: '2026-09-19T08:47:43.000Z' }
    const truocMoc = Date.parse('2026-09-20T10:00:00Z')
    expect(mocExpCuaEm(cfg, '12121212', truocMoc)).toBe('2026-09-19T08:47:43.000Z')
    expect(mocExpCuaEm(cfg, 'S9', truocMoc)).toBeNull()
    expect(mocExpCuaEm(cfg, 'S9', MOC_RESET_MS)).toBe('2026-09-20T17:01:00.000Z')
    expect(mocExpCuaEm({ ...cfg, tuDsSbd: null }, '12121212', truocMoc)).toBeNull()
  })
})
