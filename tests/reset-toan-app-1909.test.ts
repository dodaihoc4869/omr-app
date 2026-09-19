// @vitest-environment node
// RESET TOÀN APP 00:01 thứ Hai 21/09/2026 (server/src/reset-toan-app.ts) — chạy trên SQLite THẬT với lược đồ thật + mọi migration.
import { describe, it, expect, vi, afterEach } from 'vitest'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { mom } from '../server/src/mom'
import { capNhatKeyBank, noiKhoCa } from '../server/src/goi-cu'
import {
  BANG_GIU, BANG_XOA, DONG_BANG_TU_MS, HAN_TU_CHAY_MS, KHOA_CHO_PHEP, KHOA_HUY, MA_RESET, MOC_RESET, MOC_RESET_MS, MUA_MOI, QUA_HAN_DANG_CHAY_MS, TOI_DA_TRUY_VAN_MOI_LUOT,
  chayReset, chayResetNeuDenGio, chayTiepTay, dangLamMoi, docMocReset, docTrangThaiReset, doGioiHanTruyVan, maDaDung, resetDryRun,
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
  d.sql.prepare("INSERT OR REPLACE INTO game_v2_profile(sbd,revision,json,created_at) VALUES('12121212',3,?,'x')").run(JSON.stringify({ pet: 'nuoc_long', nickname: 'Bé Na', choice: false, legacy: null, cap: 20, exp: 55, wallet: 9, earned: 900, tower: 7, mastery: [{ key: 'ES.A.X', stage: 2 }], arena: null, cutover: '2026-09-16T00:00:00.000Z', season: '2026-09-16-bat-linh-01', khienRen: { manh: 3, daRen: 1 }, expMoi: { daCong: 100, manhDaTinh: 4 }, shields: { used: 1, activeUntil: 0 } }))
  d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: '2026-09-19T08:47:43.000Z', dsSbd: ['12121212'], toanBo: false }))
  d.sql.prepare("INSERT OR REPLACE INTO game_v2_settings(key,json) VALUES('season',?)").run(JSON.stringify({ id: '2026-09-16-bat-linh-01', startedAt: '2026-09-16T04:10:27.001Z' }))
}
/** CỜ LÊN ĐẠN: các test chạy thật đều phải bật (mặc định TẮT). */
const lenDan = (d: D1That) => d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,'true','x')").run(KHOA_CHO_PHEP)

const dung = (nhieuHon: Record<string, number> = {}, coLenDan = true) => {
  const d = taoD1That()
  gieo(d, nhieuHon)
  if (coLenDan) lenDan(d)
  return d
}
/** Chạy job qua NHIỀU lượt cron (mỗi phút một lượt) cho tới khi xong; mỗi lượt được đo độc lập: ≤ 40 truy vấn D1. Trả số lượt và truy vấn tối đa một lượt. */
async function chayHet(d: D1That, batDau = SAU_MOC, toiDaLuot = 40) {
  let luot = 0
  let toiDa = 0
  let cuoi = await chayReset(d.env, batDau)
  for (; ; luot++) {
    toiDa = Math.max(toiDa, cuoi.soTruyVan)
    if (cuoi.trangThai?.trangThai === 'xong' || luot >= toiDaLuot) break
    cuoi = await chayReset(d.env, batDau + (luot + 1) * 61_000)
  }
  return { cuoi, luot: luot + 1, toiDaTruyVan: toiDa }
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
    const luotTruoc = d.soLenh.prepare
    const r = await resetDryRun(d.env)
    expect(d.soLenh.prepare - luotTruoc).toBeLessThanOrEqual(TOI_DA_TRUY_VAN_MOI_LUOT) // đo độc lập bằng bộ đếm của D1 giả
    expect(d.soLenh.prepare - luotTruoc).toBe(r.soTruyVan)
    expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
    expect(r).toMatchObject({ ok: true, dryRun: true, mocLuc: MOC_RESET, daXong: false, huy: false, choPhep: true, sanSang: true, lyDo: [], trangThaiKhoa: null })
    expect(r.soTruyVan).toBeLessThanOrEqual(TOI_DA_TRUY_VAN_MOI_LUOT)
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
    expect(d.sql.prepare("SELECT 1 AS x FROM game_v2_profile WHERE sbd='12121212'").get()).toBeTruthy() // trước reset em có hồ sơ thú
    const giuTruoc = bamTatCa(d, KHONG_DOI_NOI_DUNG)
    const cauHinhKhac = (d.sql.prepare("SELECT * FROM cau_hinh WHERE khoa NOT IN ('exp_moi') ORDER BY khoa").all())
    const luotTruoc = d.soLenh.prepare
    const { cuoi: r, luot, toiDaTruyVan } = await chayHet(d)
    expect(r).toMatchObject({ chay: true })
    expect(luot).toBeGreaterThan(1) // job CHIA BƯỚC qua nhiều lượt cron
    expect(toiDaTruyVan).toBeLessThanOrEqual(TOI_DA_TRUY_VAN_MOI_LUOT)
    expect(d.soLenh.prepare - luotTruoc).toBeGreaterThan(TOI_DA_TRUY_VAN_MOI_LUOT) // tổng nhiều hơn một lượt nhưng từng lượt ≤ 40
    for (const t of BANG_XOA) expect(dem(d, t), t).toBe(0)
    expect(bamTatCa(d, KHONG_DOI_NOI_DUNG)).toEqual(giuTruoc)
    expect(JSON.parse((d.sql.prepare("SELECT json FROM game_v2_settings WHERE key='season'").get() as { json: string }).json)).toEqual(MUA_MOI)
    expect(JSON.parse((d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='exp_moi'").get() as { gia_tri: string }).gia_tri)).toEqual({ tu: MOC_RESET, toanBo: true })
    expect(d.sql.prepare("SELECT * FROM cau_hinh WHERE khoa NOT IN ('exp_moi','reset_20260921') ORDER BY khoa").all()).toEqual(cauHinhKhac.filter((x: any) => x.khoa !== 'reset_20260921'))
    const st = (await docTrangThaiReset(d.env))!
    expect(st).toMatchObject({ trangThai: 'xong', soEm: dem(d, 'hoc_sinh'), muaCu: expect.stringContaining('bat-linh-01') })
    expect(st.soLanChay).toBeGreaterThan(1)
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
    const { toiDaTruyVan } = await chayHet(d)
    expect(toiDaTruyVan).toBeLessThanOrEqual(TOI_DA_TRUY_VAN_MOI_LUOT)
    expect(dem(d, 'su_kien_hoc')).toBe(0)
  })

  it('TẬP MÃ ĐÃ DÙNG nạp TRƯỚC khi xoá: mã ca, btvn, bài Mẹ giao không phải UUID (UUID thì không cần giữ); bảng ma_da_dung KHÔNG bị xoá', async () => {
    const d = dung()
    await chayHet(d)
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
    await chayHet(d)
    const truoc = bamTatCa(d, bangHienCo(d))
    const lai = await chayReset(d.env, SAU_MOC + 1_800_000)
    expect(lai).toMatchObject({ chay: false, lyDo: 'da_xong' })
    expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
    // Dữ liệu MỚI sau reset không bị xoá bởi lần cron sau.
    d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,luc,ngay_vn) VALUES('moi','S1','q','btvn','B',1,'x','2026-09-22')").run()
    await chayResetNeuDenGio(d.env, SAU_MOC + 3_600_000)
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
    expect(kq.filter((x) => x.lyDo === 'dang_chay')).toHaveLength(2)
    expect((await docTrangThaiReset(d.env))!.soLanChay).toBe(1)
    await chayHet(d, SAU_MOC + 61_000)
    for (const t of BANG_XOA) expect(dem(d, t)).toBe(0)
  })

  it('bảng trong danh sách mà CHƯA TỒN TẠI thì bỏ qua, job vẫn xong', async () => {
    const d = dung()
    d.sql.exec('DROP TABLE study_drafts; DROP TABLE student_notice; DROP TABLE doan_luot')
    const { cuoi: r } = await chayHet(d)
    expect(r.trangThai!.trangThai).toBe('xong')
    expect(r.trangThai!.demTruoc.study_drafts).toBeNull()
    expect(dem(d, 'su_kien_hoc')).toBe(0)
  })

  it('bảng CHƯA PHÂN LOẠI không bị đụng, chỉ được báo', async () => {
    const d = dung()
    d.sql.exec('CREATE TABLE bang_la_moi (x TEXT); INSERT INTO bang_la_moi VALUES (\'a\'), (\'b\')')
    const { cuoi: r } = await chayHet(d)
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

  it('TIẾP TỤC: `cho_tiep` (đã nhường) chạy tiếp NGAY ở lượt sau; `dang_chay` nhịp tim còn mới thì bỏ qua, quá 3 phút (chết) thì chạy tiếp; không xoá nhầm bảng GIỮ', async () => {
    const d = dung()
    const giuTruoc = bamTatCa(d, KHONG_DOI_NOI_DUNG)
    const l1 = await chayReset(d.env, SAU_MOC)
    expect(l1).toMatchObject({ chay: true, lyDo: 'cho_tiep' })
    expect(l1.trangThai!.trangThai).toBe('cho_tiep')
    expect(l1.soTruyVan).toBeLessThanOrEqual(TOI_DA_TRUY_VAN_MOI_LUOT)
    // Giả lập lượt kế bị treo: khoá `dang_chay` với nhịp tim mới → lượt khác bỏ qua; quá hạn → chạy tiếp.
    const st = l1.trangThai!
    d.sql.prepare('UPDATE cau_hinh SET gia_tri=? WHERE khoa=?').run(JSON.stringify({ ...st, trangThai: 'dang_chay', tiepTucLuc: new Date(SAU_MOC + 61_000).toISOString() }), MA_RESET)
    expect(await chayReset(d.env, SAU_MOC + 61_000 + 30_000)).toMatchObject({ chay: false, lyDo: 'dang_chay' })
    const tiep = await chayReset(d.env, SAU_MOC + 61_000 + QUA_HAN_DANG_CHAY_MS + 1000)
    expect(tiep.chay).toBe(true)
    const { cuoi } = await chayHet(d, SAU_MOC + 400_000)
    expect(cuoi.trangThai).toMatchObject({ trangThai: 'xong' })
    for (const t of BANG_XOA) expect(dem(d, t)).toBe(0)
    expect(bamTatCa(d, KHONG_DOI_NOI_DUNG)).toEqual(giuTruoc)
  })

  it('bảng WITHOUT ROWID (không có rowid) vẫn xoá được, không lỗi', async () => {
    const d = dung()
    d.sql.exec('DROP TABLE study_drafts')
    d.sql.exec('CREATE TABLE study_drafts (id TEXT PRIMARY KEY, x TEXT) WITHOUT ROWID')
    d.sql.exec("INSERT INTO study_drafts VALUES ('a','1'), ('b','2'), ('c','3')")
    const { cuoi } = await chayHet(d)
    expect(cuoi.trangThai!.trangThai).toBe('xong')
    expect(cuoi.trangThai!.loi).toBeUndefined()
    expect(dem(d, 'study_drafts')).toBe(0)
    for (const t of BANG_XOA) expect(dem(d, t), t).toBe(0)
  })
})

describe('CỜ LÊN ĐẠN: mặc định KHÔNG chạy, KHÔNG đóng băng', () => {
  it('không có cờ reset_20260921_cho_phep: job không xoá gì (kể cả sau mốc, trong cửa sổ), dryRun vẫn chạy và báo choPhep:false', async () => {
    const d = dung({}, false)
    const truoc = bamTatCa(d, bangHienCo(d))
    expect(await chayReset(d.env, SAU_MOC)).toMatchObject({ chay: false, lyDo: 'khong_cho_phep' })
    expect(await chayResetNeuDenGio(d.env, SAU_MOC + 60_000)).toMatchObject({ chay: false, lyDo: 'khong_cho_phep' })
    expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
    expect((await docTrangThaiReset(d.env))).toBeNull()
    expect(await dangLamMoi(d.env, SAU_MOC)).toBe(false)
    const r = await resetDryRun(d.env)
    expect(r).toMatchObject({ ok: true, choPhep: false, huy: false, sanSang: true })
  })
  it('cờ "false"/rỗng cũng KHÔNG chạy; cờ HUỶ thắng cờ cho phép', async () => {
    for (const v of ['false', '0', '']) {
      const d = dung({}, false)
      d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,'x')").run(KHOA_CHO_PHEP, v)
      expect((await chayReset(d.env, SAU_MOC)).lyDo).toBe('khong_cho_phep')
    }
    const d = dung()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,'true','x')").run(KHOA_HUY)
    expect((await chayReset(d.env, SAU_MOC)).lyDo).toBe('huy')
    expect(await dangLamMoi(d.env, SAU_MOC)).toBe(false)
  })
})

describe('HẠN TỰ CHẠY 01:00 giờ VN', () => {
  it('quá 01:00 mà chưa xong ⇒ qua_gio, không tự chạy nữa, mở băng; lệnh TAY chạy tiếp được tới xong', async () => {
    const d = dung()
    const l1 = await chayReset(d.env, SAU_MOC)
    expect(l1.trangThai!.trangThai).toBe('cho_tiep')
    const conBang = JSON.stringify(bamTatCa(d, BANG_XOA))
    expect(await dangLamMoi(d.env, HAN_TU_CHAY_MS - 60_000)).toBe(true) // 00:59: vẫn đóng băng
    const qg = await chayReset(d.env, HAN_TU_CHAY_MS + 60_000)
    expect(qg).toMatchObject({ chay: false, lyDo: 'qua_gio' })
    expect(qg.trangThai!.trangThai).toBe('qua_gio')
    expect(JSON.stringify(bamTatCa(d, BANG_XOA))).toBe(conBang) // không xoá thêm gì
    expect(await dangLamMoi(d.env, HAN_TU_CHAY_MS + 3000)).toBe(false) // mở băng
    // Cron các phút sau (8 giờ sáng) KHÔNG tự chạy nữa.
    expect(await chayReset(d.env, HAN_TU_CHAY_MS + 7 * 3_600_000)).toMatchObject({ chay: false, lyDo: 'qua_gio' })
    expect(await chayResetNeuDenGio(d.env, HAN_TU_CHAY_MS + 7 * 3_600_000)).toMatchObject({ chay: false, lyDo: 'qua_gio', soTruyVan: 0 })
    expect(JSON.stringify(bamTatCa(d, BANG_XOA))).toBe(conBang)
    // Lệnh TAY chạy tiếp (mỗi lần một lượt ≤ 40 truy vấn) tới khi xong.
    let r = await chayTiepTay(d.env, HAN_TU_CHAY_MS + 8 * 3_600_000)
    for (let i = 0; i < 30 && r.trangThai?.trangThai !== 'xong'; i++) {
      expect(r.soTruyVan).toBeLessThanOrEqual(TOI_DA_TRUY_VAN_MOI_LUOT)
      r = await chayTiepTay(d.env, HAN_TU_CHAY_MS + 8 * 3_600_000 + (i + 1) * 61_000)
    }
    expect(r.trangThai!.trangThai).toBe('xong')
    for (const t of BANG_XOA) expect(dem(d, t)).toBe(0)
  })
  it('lệnh tay vẫn cần cờ cho phép và không có cờ huỷ; cron chỉ hỏi khoá trong [00:01, 01:00 + 2 giờ]', async () => {
    const d = dung({}, false)
    expect((await chayTiepTay(d.env, HAN_TU_CHAY_MS + 60_000)).lyDo).toBe('khong_cho_phep')
    lenDan(d)
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,'true','x')").run(KHOA_HUY)
    expect((await chayTiepTay(d.env, HAN_TU_CHAY_MS + 60_000)).lyDo).toBe('huy')
    expect((await chayResetNeuDenGio(d.env, MOC_RESET_MS - 1000))).toMatchObject({ lyDo: 'chua_toi_gio', soTruyVan: 0 })
  })
})

describe('cron: đang làm reset thì các việc cron khác nghỉ lượt đó', () => {
  it('trong lúc job còn chạy/nhường, scheduled KHÔNG lập kế hoạch/tin PH; job xong rồi lượt sau mới chạy lại việc thường lệ', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const d = dung()
    d.sql.prepare("DELETE FROM ke_hoach_ngay").run()
    d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('12121212','Thầy','12A','mk-cu','x')").run()
    let phut = 0
    let xong = false
    for (let i = 0; i < 20 && !xong; i++) {
      vi.setSystemTime(SAU_MOC + phut * 61_000)
      await worker.scheduled({ cron: '1 17 * * *' }, d.env)
      xong = (await docTrangThaiReset(d.env))?.trangThai === 'xong'
      if (!xong) expect(dem(d, 'ke_hoach_ngay'), `lượt ${i}`).toBe(0)
      phut++
    }
    expect(xong).toBe(true)
    vi.setSystemTime(SAU_MOC + phut * 61_000)
    await worker.scheduled({ cron: '1 17 * * *' }, d.env)
    expect(dem(d, 'ke_hoach_ngay')).toBeGreaterThan(0) // việc thường lệ chạy lại trên dữ liệu trống
  })
})

describe('sau reset: tài khoản còn nguyên, mọi lệnh chạy trên dữ liệu TRỐNG không lỗi', () => {
  it('đăng nhập bằng mật khẩu cũ vẫn được; hồ sơ game tạo lại là bản TRẮNG chưa chọn thú; thanThu:null; kế hoạch ngày/ca đang mở/tin PH/cron chạy được', async () => {
    const d = dung()
    await chayHet(d)
    const dn = await goiWorker(worker, d.env, '/hs/dang-nhap', { sbd: '12121212', matKhau: 'mk-cu' })
    expect(dn.ok).toBe(true)
    expect(dn.token).toBeTruthy()
    expect((await goiWorker(worker, d.env, '/hs/dang-nhap', { sbd: '12121212', matKhau: 'sai' })).ok).not.toBe(true)
    // Trước reset em có thú cấp 20; sau reset không còn hồ sơ nào (game tạo lại bản trắng khi em mở).
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
    await chayHet(d)
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
    await chayHet(d)
    expect(await capNhatKeyBank(d.env, { maCa: 'CA-CU-1', keyBank: { x: 1 } })).toMatchObject({ ok: false, maCaDaDung: true })
    expect(await noiKhoCa(d.env, { maCa: 'CA-CU-1', bank: [] })).toMatchObject({ ok: false, maCaDaDung: true })
    expect(d.objects.has('key/CA-CU-1.json')).toBe(false)
    expect(await capNhatKeyBank(d.env, { maCa: 'CA-CHUA-CO-1', keyBank: { x: 1 } })).toMatchObject({ ok: true })
    expect(d.objects.has('key/CA-CHUA-CO-1.json')).toBe(true)
  })

  it('bài Mẹ giao: mã cũ không phải UUID bị từ chối; mã mới tạo được', async () => {
    const d = dung()
    await chayHet(d)
    d.sql.prepare("UPDATE hoc_sinh SET mat_khau='mk-cu' WHERE sbd='12121212'").run()
    await expect(mom(d.env, 'create', { sbd: '12121212', id: 'daily_2026-09-20', dsCau: [{ id: 'Q1', dapAn: 'A' }] })).rejects.toThrow(/đã từng dùng/)
    await expect(mom(d.env, 'create', { sbd: '12121212', id: 'daily_2026-09-21', dsCau: [{ id: 'Q1', dapAn: 'A' }] })).resolves.toMatchObject({ ok: true })
  })
})

describe('đóng băng ghi trong lúc job chạy', () => {
  const luc = (phutSauMoc: number) => MOC_RESET_MS + phutSauMoc * 60_000
  it('chỉ đóng băng trong [00:00, 01:00] giờ VN, CÓ cờ cho phép, KHÔNG huỷ, job CHƯA xong; xong sớm thì MỞ ngay; không mở giữa chừng lúc 00:20; ngoài cửa sổ không tốn truy vấn', async () => {
    const d = dung()
    expect(await dangLamMoi(d.env, DONG_BANG_TU_MS - 1000)).toBe(false)
    expect(await dangLamMoi(d.env, luc(-0.5))).toBe(true) // 00:00:30
    expect(await dangLamMoi(d.env, luc(19))).toBe(true)
    expect(await dangLamMoi(d.env, luc(21))).toBe(true) // qua 00:20 vẫn đóng khi job chưa xong (đang xoá dở mà mở băng là dữ liệu nửa cũ nửa mới)
    expect(await dangLamMoi(d.env, luc(58))).toBe(true)
    expect(await dangLamMoi(d.env, HAN_TU_CHAY_MS + 1000)).toBe(false)
    const soTruoc = d.soLenh.prepare
    await dangLamMoi(d.env, HAN_TU_CHAY_MS + 5000)
    await dangLamMoi(d.env, DONG_BANG_TU_MS - 5000)
    expect(d.soLenh.prepare).toBe(soTruoc) // ngoài cửa sổ: không truy vấn nào
    await chayHet(d, luc(1))
    expect(await dangLamMoi(d.env, luc(30))).toBe(false) // xong lúc nào thì mở lúc ấy
    const h = dung()
    h.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,'true','x')").run(KHOA_HUY)
    expect(await dangLamMoi(h.env, luc(1))).toBe(false)
    const kCo = dung({}, false)
    expect(await dangLamMoi(kCo.env, luc(1))).toBe(false) // không có cờ lên đạn: không đóng băng
  })

  it('qua Worker: trong cửa sổ trả JSON {ok:false, error, dangLamMoi:true}; /khoe vẫn qua; job xong thì lệnh chạy lại bình thường; không có cờ cho phép thì lệnh chạy bình thường', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const d = dung()
    vi.setSystemTime(luc(0.5))
    const bi = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: '12121212' })
    expect(bi).toMatchObject({ ok: false, error: 'Hệ thống đang làm mới, thử lại sau 1 phút', dangLamMoi: true })
    const t = await goiWorker(worker, d.env, '/goi', { action: 'danhSachCa' }, true)
    expect(t.dangLamMoi).toBe(true)
    const khoe = await (await worker.fetch(new Request('https://test/khoe'), d.env)).json()
    expect((khoe as { ok: boolean }).ok).toBe(true)
    await chayHet(d, Date.now())
    vi.setSystemTime(luc(30)) // vượt bộ nhớ đệm 2 giây
    const xong = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: '12121212' })
    expect(xong.ok).toBe(true)
    expect(xong.dangLamMoi).toBeUndefined()

    const kCo = dung({}, false)
    vi.setSystemTime(luc(0.5))
    expect((await goiWorker(worker, kCo.env, '/hs/ke-hoach-ngay', { sbd: '12121212' })).ok).toBe(true)
  })
})

describe('mocReset cho máy khách: CHỈ sau khi job xong', () => {
  it('trước khi xong: KHÔNG có trường mocReset ở /hs/ke-hoach-ngay, /hs/ca-dang-mo, /ca/danh-sach, danhSachCa; sau khi xong: "2026-09-21" ở GỐC JSON', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(MOC_RESET_MS + 25 * 60_000) // đã qua mốc, job CHƯA chạy (chưa lên đạn nên không đóng băng)
    const d = dung({}, false)
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
    lenDan(d)
    await chayHet(d, Date.now())
    vi.setSystemTime(MOC_RESET_MS + 40 * 60_000)
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
  it('đang chạy dở (khoá dang_chay/cho_tiep) cũng KHÔNG gửi mocReset; và TRƯỚC mốc không tốn truy vấn nào', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(MOC_RESET_MS + 25 * 60_000)
    const d = dung({}, false)
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,'x')").run(MA_RESET, JSON.stringify({ trangThai: 'cho_tiep', buoc: 'xoa', bangTiep: 3, batDauLuc: MOC_RESET, soLanChay: 1, demTruoc: {} }))
    expect(await docMocReset(d.env, Date.now())).toBeNull()
    expect('mocReset' in (await goiWorker(worker, d.env, '/hs/ca-dang-mo', { sbd: '12121212' }))).toBe(false)
    const soTruoc = d.soLenh.prepare
    expect(await docMocReset(d.env, MOC_RESET_MS - 1000)).toBeNull()
    expect(d.soLenh.prepare).toBe(soTruoc)
  })
})

describe('sau reset: /ca/nhieu và /goi doGioiHan', () => {
  it('/ca/nhieu (đẩy nhiều ca + lượt) BỎ QUA ca và lượt mang mã cũ, báo lại; ca mới vẫn đẩy được', async () => {
    const d = dung()
    await chayHet(d)
    const r = await goiWorker(worker, d.env, '/ca/nhieu', {
      ca: [{ maCa: 'CA-CU-1', tenCa: 'Ma' }, { maCa: 'CA-MOI-2', tenCa: 'Mới' }],
      luot: [{ maCa: 'CA-CU-1', sbd: '12121212', lanThu: 1 }, { maCa: 'CA-MOI-2', sbd: '12121212', lanThu: 1 }],
    }, true)
    expect(r).toMatchObject({ ok: true, soCa: 1, soLuot: 1, boQuaMaCu: ['CA-CU-1'] })
    expect(d.sql.prepare("SELECT ma_ca FROM ca WHERE ma_ca='CA-CU-1'").get()).toBeUndefined()
    expect(d.sql.prepare("SELECT ma_ca FROM ca WHERE ma_ca='CA-MOI-2'").get()).toBeTruthy()
    expect(d.sql.prepare("SELECT ma_ca FROM luot WHERE ma_ca='CA-CU-1'").get()).toBeUndefined()
    const toanCu = await goiWorker(worker, d.env, '/ca/nhieu', { ca: [{ maCa: 'CA-CU-1' }] }, true)
    expect(toanCu).toMatchObject({ ok: false, maCaDaDung: true })
  })
  it('lệnh chạy tiếp tay và đo giới hạn qua Worker đòi mã bí mật; đo giới hạn trả số truy vấn', async () => {
    const d = dung()
    expect((await goiWorker(worker, d.env, '/reset/chay-tiep', {})).ok).not.toBe(true)
    expect((await goiWorker(worker, d.env, '/reset/do-gioi-han', {})).ok).not.toBe(true)
    const r = await goiWorker(worker, d.env, '/reset/do-gioi-han', {}, true)
    expect(r).toMatchObject({ ok: true, biTuChoi: false })
    expect(r.soTruyVanThanhCong).toBe(1100)
    expect((await doGioiHanTruyVan(d.env, 60)).soTruyVanThanhCong).toBe(60)
    const c = await goiWorker(worker, d.env, '/reset/chay-tiep', {}, true)
    expect(c).toMatchObject({ ok: true })
  })
})

describe('dryRun báo sẵn sàng', () => {
  it('thiếu bảng ma_da_dung ⇒ sanSang:false kèm lý do NGAY ở dryRun (không đợi tới 00:01)', async () => {
    const d = dung()
    d.sql.exec('DROP TABLE ma_da_dung')
    const r = await resetDryRun(d.env)
    expect(r.sanSang).toBe(false)
    expect(r.lyDo.join(' ')).toMatch(/ma-da-dung/)
    expect(r.soTruyVan).toBeLessThanOrEqual(TOI_DA_TRUY_VAN_MOI_LUOT)
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
