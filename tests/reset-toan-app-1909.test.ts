// @vitest-environment node
// RESET TOÀN APP — MỘT LẦN, CHẠY THEO LỆNH (server/src/reset-toan-app.ts) — chạy trên SQLite THẬT với lược đồ thật + mọi migration.
// Thiết kế 21/09 (thầy): xoá BTVN/Mẹ giao/game/EXP (chọn lại thú) nhưng GIỮ sổ + hồ sơ mạnh yếu (su_kien_hoc, nam_kt_cau, nam_kt_dang, tien_do_hs, qid_da_lam) VÀ toàn bộ CA THI đã thi (14 bảng).
// Không có mốc cố định: job chạy khi có CỜ LÊN ĐẠN; cửa sổ tự chạy + đóng băng = 60 phút kể từ lúc lên đạn.
import { describe, it, expect, vi, afterEach } from 'vitest'
import worker from '../server/src/index'
import { mom } from '../server/src/mom'
import { capNhatKeyBank, noiKhoCa } from '../server/src/goi-cu'
import {
  BANG_GIU, BANG_XOA, CUA_SO_MS, KHOA_CHO_PHEP, KHOA_HUY, MA_RESET, QUA_HAN_DANG_CHAY_MS, TOI_DA_TRUY_VAN_MOI_LUOT,
  chayReset, chayResetNeuDenGio, chayTiepTay, dangLamMoi, docMocReset, docTrangThaiReset, doGioiHanTruyVan, maDaDung, resetDryRun,
} from '../server/src/reset-toan-app'
import { chayCaLop, lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { layCauChoEm, qidPhucVuDuoc } from '../server/src/cau-theo-qid'
import { capNhatExp } from '../server/src/exp-d1'
import { protectedQuestions, readScope, xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

afterEach(() => vi.useRealTimers())

const H = 3_600_000
const D = 24 * H
/** Lúc "lên đạn" của phần lớn test: 16:00 VN chiều 21/09/2026. Không phải mốc cố định của job: chỉ là giá trị ghi vào `cap_nhat_luc` của cờ. */
const LEN_DAN_MS = Date.parse('2026-09-21T09:00:00.000Z')
const LEN_DAN = new Date(LEN_DAN_MS).toISOString()
/** Lượt cron đầu tiên sau khi lên đạn. */
const SAU = LEN_DAN_MS + 60_000
const HAN_MS = LEN_DAN_MS + CUA_SO_MS

/** Sổ + hồ sơ mạnh yếu: thầy chốt GIỮ. Khai cứng ở đây (không lấy từ BANG_GIU) để đột biến "chuyển nhầm sang XOÁ" bị bắt. */
const HO_SO_GIU = ['su_kien_hoc', 'nam_kt_cau', 'nam_kt_dang', 'tien_do_hs', 'qid_da_lam'] as const
/** Mọi ca thi đã thi: thầy chốt GIỮ (21/09 ~01:30). Khai cứng vì cùng lý do như `HO_SO_GIU`. */
const CA_THI_GIU = ['ca', 'luot', 'chi_tiet_cau', 'ban_do_sai', 'phong_cho', 'chan_vao', 'trang_thai', 'phieu', 'kho_ca_them', 'nhan_xet', 'de_rieng', 'dong_bo', 'nop_khac_phuc', 'tien_do_ca'] as const

const bangHienCo = (d: D1That) => (d.sql.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name").all() as { name: string }[]).map((x) => x.name)
const bam = (d: D1That, t: string) => JSON.stringify(d.sql.prepare(`SELECT * FROM "${t}" ORDER BY rowid`).all())
/** Số dòng của bảng; bảng CHƯA TỒN TẠI (danh sách XOÁ có thể nêu trước bảng của migration chưa gộp, job bỏ qua bảng thiếu) tính 0. */
const dem = (d: D1That, t: string) => (bangHienCo(d).includes(t) ? Number((d.sql.prepare(`SELECT COUNT(*) AS n FROM "${t}"`).get() as { n: number }).n) : 0)
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
/** CỜ LÊN ĐẠN: các test chạy thật đều phải bật (mặc định TẮT). `cap_nhat_luc` của dòng cờ = lúc lên đạn. */
const lenDan = (d: D1That, luc: string = LEN_DAN, giaTri = 'true') => d.sql.prepare('INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)').run(KHOA_CHO_PHEP, giaTri, luc)
const huy = (d: D1That, giaTri = 'true') => d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,'x')").run(KHOA_HUY, giaTri)

const dung = (nhieuHon: Record<string, number> = {}, coLenDan = true) => {
  const d = taoD1That()
  gieo(d, nhieuHon)
  if (coLenDan) lenDan(d)
  return d
}
/** Chạy job qua NHIỀU lượt cron (mỗi phút một lượt) cho tới khi xong; mỗi lượt được đo độc lập: ≤ 40 truy vấn D1. Trả số lượt và truy vấn tối đa một lượt. */
async function chayHet(d: D1That, batDau = SAU, toiDaLuot = 40) {
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
/** Mọi bảng GIỮ có NỘI DUNG không được đổi (trừ ba bảng cấu hình mà job chỉ ghi vài dòng). Hợp với `HO_SO_GIU` để đột biến bị bắt dù `BANG_GIU` bị sửa. */
const KHONG_DOI_NOI_DUNG = [...new Set([...BANG_GIU, ...HO_SO_GIU, ...CA_THI_GIU])].filter((t) => !['cau_hinh', 'game_v2_settings', 'ma_da_dung'].includes(t))

describe('phân loại bảng', () => {
  it('MỌI bảng của lược đồ (schema + mọi migration) đều được phân loại XOÁ hoặc GIỮ — thêm bảng mới là buộc phải quyết', () => {
    const d = taoD1That()
    const daPhanLoai = new Set([...BANG_XOA, ...BANG_GIU])
    expect(bangHienCo(d).filter((t) => !daPhanLoai.has(t))).toEqual([])
  })
  it('hai danh sách không giao nhau; tài khoản, lớp, kho đề, cấu hình và SỔ + HỒ SƠ MẠNH YẾU KHÔNG BAO GIỜ nằm trong danh sách XOÁ', () => {
    expect(BANG_XOA.filter((t) => BANG_GIU.includes(t))).toEqual([])
    for (const t of ['hoc_sinh', 'danh_sach', 'phu_huynh', 'de_kho', 'cau_hoi', 'game_v2_question', 'game_v2_index', 'cau_hinh', 'game_v2_settings', 'game_v2_scope', 'study_preferences', 'student_push', 'app_presence', 'ma_da_dung', 'ph_truy_cap', ...HO_SO_GIU]) {
      expect(BANG_XOA, t).not.toContain(t)
    }
    for (const t of HO_SO_GIU) expect(BANG_GIU, t).toContain(t)
    for (const t of CA_THI_GIU) { expect(BANG_XOA, t).not.toContain(t); expect(BANG_GIU, t).toContain(t) }
    expect(new Set(BANG_XOA).size).toBe(BANG_XOA.length)
  })
  it('mọi thứ thầy bảo XOÁ đều nằm trong danh sách XOÁ (BTVN, bài Mẹ giao, luyện đề, kế hoạch ngày, lên bảng, trao đổi, game, thú, EXP, khiên, Đoàn, vinh danh, tin PH)', () => {
    for (const t of ['btvn', 'btvn_em', 'btvn_em_lich_su', 'mom_bai', 'luyen_de_2026', 'yeu_cau_giao_bai', 'study_drafts', 'ke_hoach_ngay', 'len_bang', 'tin_nhan', 'cau_hoi_em', 'student_notice', 'student_push_delivery', 'game_v2_profile', 'game_v2_attempt', 'game_v2_reward', 'game_v2_room', 'game_v2_session', 'game_v2_task', 'than_thu', 'exp_so', 'manh_khien_so', 'doan_chang', 'doan_luot', 'doan_tiep_suc', 'doan_ve_so', 'doan_trum_lop', 'doan_trum_cau', 'daily_honors', 'parent_daily_news']) {
      expect(BANG_XOA, t).toContain(t)
    }
  })
})

describe('chạy thử (dryRun): chỉ đếm, không ghi gì', () => {
  it('trả đúng số dòng từng bảng, danh sách xoá/giữ, bảng chưa phân loại, lúc lên đạn + hạn; KHÔNG đổi một byte nào của D1', async () => {
    const d = dung()
    d.sql.exec('CREATE TABLE bang_la_moi (x TEXT)')
    d.sql.exec("INSERT INTO bang_la_moi VALUES ('a')")
    const truoc = bamTatCa(d, bangHienCo(d))
    const luotTruoc = d.soLenh.prepare
    const r = await resetDryRun(d.env)
    expect(d.soLenh.prepare - luotTruoc).toBeLessThanOrEqual(TOI_DA_TRUY_VAN_MOI_LUOT) // đo độc lập bằng bộ đếm của D1 giả
    expect(d.soLenh.prepare - luotTruoc).toBe(r.soTruyVan)
    expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
    expect(r).toMatchObject({ ok: true, dryRun: true, lenDanLuc: LEN_DAN, hanTuChay: new Date(HAN_MS).toISOString(), daXong: false, huy: false, choPhep: true, sanSang: true, lyDo: [], trangThaiKhoa: null })
    expect(r.soTruyVan).toBeLessThanOrEqual(TOI_DA_TRUY_VAN_MOI_LUOT)
    expect(r.chuaPhanLoai).toEqual(['bang_la_moi'])
    // Sổ + hồ sơ nằm ở danh sách GIỮ, không ở XOÁ.
    for (const t of [...HO_SO_GIU, ...CA_THI_GIU]) {
      expect(r.giu.find((x) => x.bang === t)!.dong, t).toBe(dem(d, t))
      expect(r.xoa.find((x) => x.bang === t), t).toBeUndefined()
    }
    expect(r.giu.find((x) => x.bang === 'hoc_sinh')!.dong).toBe(dem(d, 'hoc_sinh'))
    expect(r.tongDongSeXoa).toBe(BANG_XOA.reduce((t, b) => t + dem(d, b), 0))
    expect(r.tongDongGiu).toBeGreaterThanOrEqual([...HO_SO_GIU, ...CA_THI_GIU].reduce((t, b) => t + dem(d, b), 0))
    expect(r.maSeGiuLai).toMatchObject({ ca: 0, mom: 3 }) // KHÔNG nạp mã ca (ca được giữ); mom: chỉ id KHÔNG phải UUID (2 dòng mẫu + daily_…)
    expect(r.maSeGiuLai.btvn).toBeGreaterThan(0)
  })
  it('chưa lên đạn: lenDanLuc/hanTuChay là null, choPhep:false; vẫn chạy được', async () => {
    const d = dung({}, false)
    expect(await resetDryRun(d.env)).toMatchObject({ ok: true, choPhep: false, lenDanLuc: null, hanTuChay: null, sanSang: true })
  })
  it('lệnh của thầy /reset/dry-run đòi mã bí mật', async () => {
    // Sửa 21/09 (Boss): bỏ phụ thuộc ĐỒNG HỒ THẬT — LEN_DAN cố định 09:00Z + cửa sổ đóng băng 60 phút làm test đỏ oan nếu chạy đúng khung 16:00–17:00 VN 21/09. Giờ giả: 1 giờ TRƯỚC lúc lên đạn.
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(LEN_DAN_MS - 3_600_000)
    const d = dung()
    expect((await goiWorker(worker, d.env, '/reset/dry-run', {})).ok).not.toBe(true)
    const r = await goiWorker(worker, d.env, '/reset/dry-run', {}, true)
    expect(r).toMatchObject({ ok: true, dryRun: true })
  })
  it('thiếu bảng ma_da_dung ⇒ sanSang:false kèm lý do NGAY ở dryRun (không đợi tới lúc chạy)', async () => {
    const d = dung()
    d.sql.exec('DROP TABLE ma_da_dung')
    const r = await resetDryRun(d.env)
    expect(r.sanSang).toBe(false)
    expect(r.lyDo.join(' ')).toMatch(/ma-da-dung/)
    expect(r.soTruyVan).toBeLessThanOrEqual(TOI_DA_TRUY_VAN_MOI_LUOT)
  })
})

describe('chạy thật', () => {
  it('bảng XOÁ rỗng hết; SỔ + HỒ SƠ và mọi bảng GIỮ y nguyên TỪNG DÒNG (so băm); mùa game mới; exp_moi.tu = lúc bắt đầu; các dòng cấu hình khác còn nguyên', async () => {
    const d = dung()
    expect(d.sql.prepare("SELECT 1 AS x FROM game_v2_profile WHERE sbd='12121212'").get()).toBeTruthy() // trước reset em có hồ sơ thú
    for (const t of [...HO_SO_GIU, ...CA_THI_GIU]) expect(dem(d, t), `${t} có dữ liệu để giữ`).toBeGreaterThan(0)
    const giuTruoc = bamTatCa(d, KHONG_DOI_NOI_DUNG)
    const cauHinhKhac = d.sql.prepare("SELECT * FROM cau_hinh WHERE khoa NOT IN ('exp_moi') ORDER BY khoa").all()
    const luotTruoc = d.soLenh.prepare
    const { cuoi: r, luot, toiDaTruyVan } = await chayHet(d)
    expect(r).toMatchObject({ chay: true })
    expect(luot).toBeGreaterThan(1) // job CHIA BƯỚC qua nhiều lượt cron
    expect(toiDaTruyVan).toBeLessThanOrEqual(TOI_DA_TRUY_VAN_MOI_LUOT)
    expect(d.soLenh.prepare - luotTruoc).toBeGreaterThan(TOI_DA_TRUY_VAN_MOI_LUOT) // tổng nhiều hơn một lượt nhưng từng lượt ≤ 40
    for (const t of BANG_XOA) expect(dem(d, t), t).toBe(0)
    expect(bamTatCa(d, KHONG_DOI_NOI_DUNG)).toEqual(giuTruoc)
    for (const t of [...HO_SO_GIU, ...CA_THI_GIU]) expect(dem(d, t), `${t} còn nguyên`).toBeGreaterThan(0)
    const batDauLuc = new Date(SAU).toISOString()
    expect(JSON.parse((d.sql.prepare("SELECT json FROM game_v2_settings WHERE key='season'").get() as { json: string }).json)).toEqual({ id: '2026-09-21-mua-1', startedAt: batDauLuc })
    expect(JSON.parse((d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='exp_moi'").get() as { gia_tri: string }).gia_tri)).toEqual({ tu: batDauLuc, toanBo: true })
    expect(d.sql.prepare(`SELECT * FROM cau_hinh WHERE khoa NOT IN ('exp_moi','${MA_RESET}') ORDER BY khoa`).all()).toEqual(cauHinhKhac.filter((x: any) => x.khoa !== MA_RESET))
    const st = (await docTrangThaiReset(d.env))!
    expect(st).toMatchObject({ trangThai: 'xong', batDauLuc, lenDanLuc: LEN_DAN, mua: '2026-09-21-mua-1', soEm: dem(d, 'hoc_sinh'), muaCu: expect.stringContaining('bat-linh-01') })
    expect(st.soLanChay).toBeGreaterThan(1)
    expect(st.xongLuc).toBeTruthy()
    for (const t of HO_SO_GIU) expect(st.demSau![t], t).toBe(st.demTruoc[t])
    for (const t of CA_THI_GIU) expect(st.demSau![t], t).toBe(st.demTruoc[t])
    expect(st.demTruoc.btvn).toBeGreaterThan(0)
    expect(st.demSau!.btvn).toBe(0)
    expect(st.demSau!.hoc_sinh).toBe(st.demTruoc.hoc_sinh)
    expect(JSON.parse(st.expMoiCu!)).toMatchObject({ dsSbd: ['12121212'] })
  })

  it('bảng LỚN hơn một lô (9000 dòng > 4000/lô): bảng XOÁ sạch, bảng GIỮ cùng cỡ KHÔNG bị đụng, mỗi lượt ≤ 40 truy vấn', async () => {
    const d = dung()
    d.sql.exec(`WITH RECURSIVE c(i) AS (SELECT 1 UNION ALL SELECT i+1 FROM c WHERE i<9000)
      INSERT INTO tin_nhan(tu,den,noi_dung,da_doc,gui_luc) SELECT 'a','b','x'||i,0,'x' FROM c`)
    d.sql.exec(`WITH RECURSIVE c(i) AS (SELECT 1 UNION ALL SELECT i+1 FROM c WHERE i<9000)
      INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,luc,ngay_vn) SELECT 'k'||i,'S1','q','btvn','B',1,'x','2026-09-19' FROM c`)
    expect(dem(d, 'tin_nhan')).toBeGreaterThan(9000)
    const soSo = dem(d, 'su_kien_hoc')
    const { cuoi, toiDaTruyVan } = await chayHet(d)
    expect(cuoi.trangThai!.trangThai).toBe('xong')
    expect(toiDaTruyVan).toBeLessThanOrEqual(TOI_DA_TRUY_VAN_MOI_LUOT)
    expect(dem(d, 'tin_nhan')).toBe(0)
    expect(dem(d, 'su_kien_hoc')).toBe(soSo)
  })

  it('TẬP MÃ ĐÃ DÙNG nạp TRƯỚC khi xoá: btvn và bài Mẹ giao không phải UUID (UUID thì không cần giữ); KHÔNG nạp mã ca (ca được giữ); bảng ma_da_dung KHÔNG bị xoá', async () => {
    const d = dung()
    await chayHet(d)
    expect(await maDaDung(d.env, 'ca', 'CA-CU-1')).toBe(false) // ca còn nguyên trong bảng `ca`, không có mã nào "đã dùng mà biến mất"
    expect(await maDaDung(d.env, 'btvn', 'CA-CU-1-abc')).toBe(true)
    expect(await maDaDung(d.env, 'mom', 'daily_2026-09-20')).toBe(true)
    expect(await maDaDung(d.env, 'mom', '123e4567-e89b-42d3-a456-426614174000')).toBe(false)
    expect(await maDaDung(d.env, 'ca', 'CA-MOI-9')).toBe(false)
    expect(dem(d, 'ma_da_dung')).toBeGreaterThan(0)
  })

  it('MỘT LẦN: xong rồi thì lên đạn lại cũng không chạy lại (D1 không đổi một byte); dữ liệu MỚI sau reset không bị xoá', async () => {
    const d = dung()
    await chayHet(d)
    const truoc = bamTatCa(d, bangHienCo(d))
    expect(await chayReset(d.env, SAU + 30 * 60_000)).toMatchObject({ chay: false, lyDo: 'da_xong' })
    lenDan(d, new Date(SAU + H).toISOString()) // lên đạn lần nữa
    expect(await chayReset(d.env, SAU + H + 60_000)).toMatchObject({ chay: false, lyDo: 'da_xong' })
    expect(await chayReset(d.env, SAU + H + 60_000)).toMatchObject({ chay: false, lyDo: 'da_xong' })
    const sauCo = bamTatCa(d, bangHienCo(d))
    expect(sauCo.cau_hinh).not.toEqual(truoc.cau_hinh) // chỉ khác đúng dòng cờ vừa ghi lại
    delete (sauCo as Record<string, string>).cau_hinh
    delete (truoc as Record<string, string>).cau_hinh
    expect(sauCo).toEqual(truoc)
    d.sql.prepare("INSERT INTO tin_nhan(tu,den,noi_dung,da_doc,gui_luc) VALUES('a','b','moi',0,'x')").run()
    await chayResetNeuDenGio(d.env, SAU + 3 * H)
    expect(dem(d, 'tin_nhan')).toBe(1)
  })

  it('CỜ HUỶ: reset_toan_app_huy = true → không chạy, không xoá gì (nhận cả "true", "1", {huy:true}); "false" thì không chặn', async () => {
    for (const v of ['true', '1', '{"huy":true}']) {
      const d = dung()
      huy(d, v)
      const truoc = bamTatCa(d, bangHienCo(d))
      expect(await chayReset(d.env, SAU)).toMatchObject({ chay: false, lyDo: 'huy' })
      expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
    }
    const d = dung()
    huy(d, 'false')
    expect((await chayReset(d.env, SAU)).chay).toBe(true)
  })

  it('HAI lượt chạy CHỒNG NHAU (hai cron): đúng một lượt chạy thật', async () => {
    const d = dung()
    const kq = await Promise.all([chayReset(d.env, SAU), chayReset(d.env, SAU), chayReset(d.env, SAU)])
    expect(kq.filter((x) => x.chay)).toHaveLength(1)
    expect(kq.filter((x) => x.lyDo === 'dang_chay')).toHaveLength(2)
    expect((await docTrangThaiReset(d.env))!.soLanChay).toBe(1)
    await chayHet(d, SAU + 61_000)
    for (const t of BANG_XOA) expect(dem(d, t)).toBe(0)
  })

  it('bảng trong danh sách mà CHƯA TỒN TẠI thì bỏ qua (XOÁ lẫn GIỮ), job vẫn xong', async () => {
    const d = dung()
    d.sql.exec('DROP TABLE study_drafts; DROP TABLE student_notice; DROP TABLE doan_luot; DROP TABLE qid_da_lam')
    const giuTruoc = bamTatCa(d, KHONG_DOI_NOI_DUNG)
    const { cuoi: r } = await chayHet(d)
    expect(r.trangThai!.trangThai).toBe('xong')
    expect(r.trangThai!.demTruoc.study_drafts).toBeNull()
    expect(r.trangThai!.demTruoc.qid_da_lam).toBeNull()
    expect(bamTatCa(d, KHONG_DOI_NOI_DUNG)).toEqual(giuTruoc)
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
    const r = await chayReset(d.env, SAU)
    expect(r).toMatchObject({ chay: false, lyDo: 'loi' })
    expect(r.trangThai!.loi).toMatch(/ma-da-dung/)
    expect(bamTatCa(d, BANG_XOA)).toEqual(truoc)
  })

  it('TIẾP TỤC: `cho_tiep` (đã nhường) chạy tiếp NGAY ở lượt sau; `dang_chay` nhịp tim còn mới thì bỏ qua, quá 3 phút (chết) thì chạy tiếp; không xoá nhầm bảng GIỮ', async () => {
    const d = dung()
    const giuTruoc = bamTatCa(d, KHONG_DOI_NOI_DUNG)
    const l1 = await chayReset(d.env, SAU)
    expect(l1).toMatchObject({ chay: true, lyDo: 'cho_tiep' })
    expect(l1.trangThai!.trangThai).toBe('cho_tiep')
    expect(l1.soTruyVan).toBeLessThanOrEqual(TOI_DA_TRUY_VAN_MOI_LUOT)
    // Giả lập lượt kế bị treo: khoá `dang_chay` với nhịp tim mới → lượt khác bỏ qua; quá hạn → chạy tiếp.
    const st = l1.trangThai!
    d.sql.prepare('UPDATE cau_hinh SET gia_tri=? WHERE khoa=?').run(JSON.stringify({ ...st, trangThai: 'dang_chay', tiepTucLuc: new Date(SAU + 61_000).toISOString() }), MA_RESET)
    expect(await chayReset(d.env, SAU + 61_000 + 30_000)).toMatchObject({ chay: false, lyDo: 'dang_chay' })
    const tiep = await chayReset(d.env, SAU + 61_000 + QUA_HAN_DANG_CHAY_MS + 1000)
    expect(tiep.chay).toBe(true)
    const { cuoi } = await chayHet(d, SAU + 400_000)
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

describe('CỜ LÊN ĐẠN: mặc định KHÔNG chạy, KHÔNG đóng băng; mốc là lúc lên đạn, không phải ngày cố định', () => {
  it('không có cờ cho phép: job không xoá gì (kể cả nhiều ngày sau), dryRun vẫn chạy và báo choPhep:false', async () => {
    const d = dung({}, false)
    const truoc = bamTatCa(d, bangHienCo(d))
    expect(await chayReset(d.env, SAU)).toMatchObject({ chay: false, lyDo: 'khong_cho_phep' })
    expect(await chayResetNeuDenGio(d.env, SAU + 30 * D)).toMatchObject({ chay: false, lyDo: 'khong_cho_phep' })
    expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
    expect((await docTrangThaiReset(d.env))).toBeNull()
    expect(await dangLamMoi(d.env, SAU)).toBe(false)
    expect(await resetDryRun(d.env)).toMatchObject({ ok: true, choPhep: false, huy: false, sanSang: true })
  })
  it('cờ "false"/"0"/rỗng cũng KHÔNG chạy; cờ HUỶ thắng cờ cho phép', async () => {
    for (const v of ['false', '0', '']) {
      const d = dung({}, false)
      lenDan(d, LEN_DAN, v)
      expect((await chayReset(d.env, SAU)).lyDo).toBe('khong_cho_phep')
    }
    const d = dung()
    huy(d)
    expect((await chayReset(d.env, SAU)).lyDo).toBe('huy')
    expect(await dangLamMoi(d.env, SAU)).toBe(false)
  })
  it('lúc lên đạn không đọc được (cap_nhat_luc hỏng) ⇒ KHÔNG chạy và KHÔNG đóng băng (an toàn: không có mốc thì không xoá)', async () => {
    const d = dung({}, false)
    lenDan(d, 'khong-phai-ngay')
    const truoc = bamTatCa(d, BANG_XOA)
    expect(await chayReset(d.env, SAU)).toMatchObject({ chay: false, lyDo: 'khong_cho_phep' })
    expect(await dangLamMoi(d.env, SAU)).toBe(false)
    expect(bamTatCa(d, BANG_XOA)).toEqual(truoc)
  })
  it('`cap_nhat_luc` dạng SQLite datetime("now") ("YYYY-MM-DD HH:MM:SS", UTC không có Z) được đọc đúng là UTC', async () => {
    const d = dung({}, false)
    lenDan(d, '2026-09-21 09:00:00')
    expect(await resetDryRun(d.env)).toMatchObject({ choPhep: true, lenDanLuc: LEN_DAN, hanTuChay: new Date(HAN_MS).toISOString() })
    expect(await chayReset(d.env, LEN_DAN_MS - 1000)).toMatchObject({ chay: false, lyDo: 'chua_toi_gio' })
    expect((await chayReset(d.env, SAU)).chay).toBe(true)
  })
  it('lên đạn vào NGÀY BẤT KỲ đều chạy (không còn mốc 21/09 cố định); trước lúc lên đạn không làm gì', async () => {
    const luc = Date.parse('2026-11-03T03:30:00.000Z')
    const d = dung({}, false)
    lenDan(d, new Date(luc).toISOString())
    const truoc = bamTatCa(d, BANG_XOA)
    expect(await chayReset(d.env, luc - 60_000)).toMatchObject({ chay: false, lyDo: 'chua_toi_gio' })
    expect(bamTatCa(d, BANG_XOA)).toEqual(truoc)
    const { cuoi } = await chayHet(d, luc + 60_000)
    expect(cuoi.trangThai).toMatchObject({ trangThai: 'xong', mua: '2026-11-03-mua-1', lenDanLuc: new Date(luc).toISOString() })
    for (const t of BANG_XOA) expect(dem(d, t)).toBe(0)
  })
})

describe('CỬA SỔ 60 PHÚT kể từ lúc lên đạn', () => {
  it('quá 60 phút mà chưa xong ⇒ qua_gio, không tự chạy nữa, mở băng; lệnh TAY chạy tiếp được tới xong', async () => {
    const d = dung()
    const l1 = await chayReset(d.env, SAU)
    expect(l1.trangThai!.trangThai).toBe('cho_tiep')
    const conBang = JSON.stringify(bamTatCa(d, BANG_XOA))
    expect(await dangLamMoi(d.env, HAN_MS - 60_000)).toBe(true) // còn trong cửa sổ: vẫn đóng băng
    const qg = await chayReset(d.env, HAN_MS + 60_000)
    expect(qg).toMatchObject({ chay: false, lyDo: 'qua_gio' })
    expect(qg.trangThai!.trangThai).toBe('qua_gio')
    expect(JSON.stringify(bamTatCa(d, BANG_XOA))).toBe(conBang) // không xoá thêm gì
    expect(await dangLamMoi(d.env, HAN_MS + 3000 + 60_000)).toBe(false) // mở băng
    // Cron các giờ sau KHÔNG tự chạy nữa.
    expect(await chayReset(d.env, HAN_MS + 7 * H)).toMatchObject({ chay: false, lyDo: 'qua_gio' })
    expect(await chayResetNeuDenGio(d.env, HAN_MS + 7 * H)).toMatchObject({ chay: false, lyDo: 'qua_gio' })
    expect(JSON.stringify(bamTatCa(d, BANG_XOA))).toBe(conBang)
    // Lệnh TAY chạy tiếp (mỗi lần một lượt ≤ 40 truy vấn) tới khi xong.
    let r = await chayTiepTay(d.env, HAN_MS + 8 * H)
    for (let i = 0; i < 30 && r.trangThai?.trangThai !== 'xong'; i++) {
      expect(r.soTruyVan).toBeLessThanOrEqual(TOI_DA_TRUY_VAN_MOI_LUOT)
      r = await chayTiepTay(d.env, HAN_MS + 8 * H + (i + 1) * 61_000)
    }
    expect(r.trangThai!.trangThai).toBe('xong')
    for (const t of BANG_XOA) expect(dem(d, t)).toBe(0)
  })
  it('LÊN ĐẠN LẠI sau qua_gio: cửa sổ mới 60 phút, cron tiếp tục job VÀ ĐÓNG BĂNG ghi trở lại, tới xong thì mở; xong rồi thì không chạy lại', async () => {
    const d = dung()
    await chayReset(d.env, SAU)
    expect((await chayReset(d.env, HAN_MS + 60_000)).lyDo).toBe('qua_gio')
    const luc2 = HAN_MS + 2 * H
    expect(await dangLamMoi(d.env, luc2 + 10_000)).toBe(false) // chưa lên đạn lại
    lenDan(d, new Date(luc2).toISOString())
    expect(await dangLamMoi(d.env, luc2 + 45_000)).toBe(true) // (quá bộ nhớ đệm 30 giây — SỬA CÓ CHỦ Ý 21/09 hạ tải D1: 3 s → 30 s) cửa sổ mới: đóng băng dù khoá đang ghi qua_gio
    const { cuoi } = await chayHet(d, luc2 + 60_000)
    expect(cuoi.trangThai).toMatchObject({ trangThai: 'xong', lenDanLuc: LEN_DAN }) // khoá giữ lúc lên đạn đầu tiên, batDauLuc giữ từ lượt đầu
    for (const t of BANG_XOA) expect(dem(d, t)).toBe(0)
    expect(await dangLamMoi(d.env, luc2 + 30 * 60_000)).toBe(false)
    expect(await chayReset(d.env, luc2 + 40 * 60_000)).toMatchObject({ chay: false, lyDo: 'da_xong' })
  })
  it('hạn tính từ LÚC LÊN ĐẠN: lượt cron đầu tiên đến muộn hơn 60 phút sau khi lên đạn ⇒ không chạy, không xoá gì', async () => {
    const d = dung()
    const truoc = bamTatCa(d, BANG_XOA)
    const r = await chayReset(d.env, LEN_DAN_MS + 61 * 60_000)
    expect(r.chay).toBe(false)
    expect(r.lyDo).toBe('qua_gio')
    expect(bamTatCa(d, BANG_XOA)).toEqual(truoc)
    expect(await dangLamMoi(d.env, LEN_DAN_MS + 62 * 60_000)).toBe(false)
  })
  it('lệnh tay vẫn cần cờ cho phép và không có cờ huỷ', async () => {
    const d = dung({}, false)
    expect((await chayTiepTay(d.env, HAN_MS + 60_000)).lyDo).toBe('khong_cho_phep')
    lenDan(d)
    huy(d)
    expect((await chayTiepTay(d.env, HAN_MS + 60_000)).lyDo).toBe('huy')
  })
})

describe('cron: đang làm reset thì các việc cron khác nghỉ lượt đó', () => {
  it('trong lúc job còn chạy/nhường, scheduled KHÔNG lập kế hoạch/tin PH; job xong rồi lượt sau mới chạy lại việc thường lệ', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const d = dung()
    d.sql.prepare('DELETE FROM ke_hoach_ngay').run()
    d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('12121212','Thầy','12A','mk-cu','x')").run()
    let phut = 0
    let xong = false
    for (let i = 0; i < 20 && !xong; i++) {
      vi.setSystemTime(SAU + phut * 61_000)
      await worker.scheduled({ cron: '1 17 * * *' }, d.env)
      xong = (await docTrangThaiReset(d.env))?.trangThai === 'xong'
      if (!xong) expect(dem(d, 'ke_hoach_ngay'), `lượt ${i}`).toBe(0)
      phut++
    }
    expect(xong).toBe(true)
    vi.setSystemTime(SAU + phut * 61_000)
    await worker.scheduled({ cron: '1 17 * * *' }, d.env)
    expect(dem(d, 'ke_hoach_ngay')).toBeGreaterThan(0) // việc thường lệ chạy lại trên dữ liệu trống
  })
})

describe('sau reset: tài khoản còn nguyên, mọi lệnh chạy khi hồ sơ CÒN mà ca/lượt/btvn TRỐNG không lỗi', () => {
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
    await expect(chayCaLop(d.env, SAU + 60_000)).resolves.toMatchObject({ soEm: expect.any(Number) })
    const profile = await goiWorker(worker, d.env, '/game-v2/profile', { token: dn.token })
    expect(profile.ok).toBe(true)
    expect(profile.profile).toMatchObject({ choice: true, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [] })
    expect(profile.profile.nickname).toBeUndefined()
    expect((await goiWorker(worker, d.env, '/goi', { action: 'danhSachCa' }, true)).ok).toBe(true)
  })

  it('CA THI ĐƯỢC GIỮ: mở ca mới chạy bình thường; đẩy lại ca cũ (đang có trong bảng ca) KHÔNG bị chặn; ca cũ vẫn còn nguyên dòng', async () => {
    const d = dung()
    const caTruoc = bam(d, 'ca')
    await chayHet(d)
    expect(bam(d, 'ca')).toBe(caTruoc)
    const moi = await goiWorker(worker, d.env, '/goi', { action: 'publish', ca: { maCa: 'CA-MOI-1', tenCa: 'Ca mới', trangThai: 'mo' } }, true)
    expect(moi.ok).toBe(true)
    expect(d.sql.prepare("SELECT ma_ca FROM ca WHERE ma_ca='CA-MOI-1'").get()).toBeTruthy()
    const cu = await goiWorker(worker, d.env, '/goi', { action: 'publish', ca: { maCa: 'CA-CU-1', tenCa: 'Ca cũ đẩy lại', trangThai: 'dong' }, keyBank: { phanI: [] } }, true)
    expect(cu.maCaDaDung).toBeUndefined()
    expect(cu.ok).toBe(true)
    expect(d.sql.prepare("SELECT ma_ca FROM ca WHERE ma_ca='CA-CU-1'").get()).toBeTruthy()
  })

  it('chặn "mã ca đã dùng mà KHÔNG còn trong bảng ca" vẫn hoạt động (mã nạp tay), và KHÔNG chặn ca CÒN trong bảng: publish, capNhatKeyBank, noiKhoCa, /ca/nhieu', async () => {
    const d = dung()
    await chayHet(d)
    d.sql.prepare("INSERT INTO ma_da_dung(loai,ma,xoa_luc) VALUES('ca','CA-MA','x'), ('ca','CA-CU-1','x')").run() // CA-MA không còn trong ca; CA-CU-1 còn
    // Mã ma: bị chặn ở cả bốn đường và KHÔNG ghi R2.
    expect(await goiWorker(worker, d.env, '/goi', { action: 'publish', ca: { maCa: 'CA-MA', tenCa: 'Ma', trangThai: 'mo' }, keyBank: { phanI: [] } }, true)).toMatchObject({ ok: false, maCaDaDung: true })
    expect(await capNhatKeyBank(d.env, { maCa: 'CA-MA', keyBank: { x: 1 } })).toMatchObject({ ok: false, maCaDaDung: true })
    expect(await noiKhoCa(d.env, { maCa: 'CA-MA', bank: [] })).toMatchObject({ ok: false, maCaDaDung: true })
    expect(d.objects.has('key/CA-MA.json')).toBe(false)
    const nhieu = await goiWorker(worker, d.env, '/ca/nhieu', {
      ca: [{ maCa: 'CA-MA', tenCa: 'Ma' }, { maCa: 'CA-CU-1', tenCa: 'Cũ còn' }, { maCa: 'CA-MOI-2', tenCa: 'Mới' }],
      luot: [{ maCa: 'CA-MA', sbd: '12121212', lanThu: 1 }, { maCa: 'CA-CU-1', sbd: '12121212', lanThu: 1 }],
    }, true)
    expect(nhieu).toMatchObject({ ok: true, soCa: 2, soLuot: 1, boQuaMaCu: ['CA-MA'] }) // chỉ mã ma bị bỏ qua; ca còn trong bảng vẫn đẩy được
    expect(d.sql.prepare("SELECT ma_ca FROM ca WHERE ma_ca='CA-MA'").get()).toBeUndefined()
    expect(d.sql.prepare("SELECT ma_ca FROM luot WHERE ma_ca='CA-MA'").get()).toBeUndefined()
    expect(d.sql.prepare("SELECT ma_ca FROM ca WHERE ma_ca='CA-MOI-2'").get()).toBeTruthy()
    expect(await goiWorker(worker, d.env, '/ca/nhieu', { ca: [{ maCa: 'CA-MA' }] }, true)).toMatchObject({ ok: false, maCaDaDung: true })
    // Ca còn trong bảng: capNhatKeyBank/noiKhoCa/publish KHÔNG bị chặn dù mã nằm trong tập.
    expect(await capNhatKeyBank(d.env, { maCa: 'CA-CU-1', keyBank: { x: 1 } })).toMatchObject({ ok: true })
    expect(d.objects.has('key/CA-CU-1.json')).toBe(true)
    expect((await noiKhoCa(d.env, { maCa: 'CA-CU-1', bank: [] })).maCaDaDung).toBeUndefined()
    expect((await goiWorker(worker, d.env, '/goi', { action: 'publish', ca: { maCa: 'CA-CU-1', tenCa: 'Cũ', trangThai: 'dong' }, keyBank: { phanI: [] } }, true)).maCaDaDung).toBeUndefined()
  })

  it('bài Mẹ giao: mã cũ không phải UUID bị từ chối; mã mới tạo được', async () => {
    const d = dung()
    await chayHet(d)
    d.sql.prepare("UPDATE hoc_sinh SET mat_khau='mk-cu' WHERE sbd='12121212'").run()
    await expect(mom(d.env, 'create', { sbd: '12121212', id: 'daily_2026-09-20', dsCau: [{ id: 'Q1', dapAn: 'A' }] })).rejects.toThrow(/đã từng dùng/)
    await expect(mom(d.env, 'create', { sbd: '12121212', id: 'daily_2026-09-21', dsCau: [{ id: 'Q1', dapAn: 'A' }] })).resolves.toMatchObject({ ok: true })
  })
})

describe('CA THI VÀ HỒ SƠ ĐƯỢC GIỮ, BTVN/Mẹ giao/game TRỐNG: kế hoạch, câu phục vụ được, bằng chứng của game, hồ sơ lớp lên bảng, EXP', () => {
  const NGAY_CU = Date.parse('2026-09-17T03:00:00.000Z') // 3 ngày trước
  const HOM_NAY = Date.parse('2026-09-20T02:00:00.000Z') // 09:00 VN, TRƯỚC lúc reset (12:00 VN)
  const RESET_LUC = Date.parse('2026-09-20T05:00:00.000Z') // 12:00 VN ngày 20/09
  const SAU_RESET = Date.parse('2026-09-20T06:00:00.000Z')
  const BAY_GIO = Date.parse('2026-09-20T07:00:00.000Z')
  const iso = (ms: number) => new Date(ms).toISOString()
  const cauKho = (qid: string) => ({
    qid, maDe: 'x', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Đề ${qid}`, choices: ['A', 'B', 'C', 'D'], ideas: [], hinhAnh: [], dang: 'ES.A.X', tenDang: 'Dạng', mucDo: 'biet', sao: 2,
    kienThuc: ['K1'], correct: 'B', solution: 'Giải', reviewed: true,
  })
  function themCau(d: D1That, maDe: string, cau: string[]) {
    d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?, '12',?,?,0, 'v1')").run(maDe, maDe, cau.length, `kho/${maDe}.json`)
    d.sql.prepare('INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)').run(maDe, 'v1', 'x')
    for (const q of cau) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(maDe, q, 'v1', `g-${q}`, 'ES.A.X', JSON.stringify({ ...cauKho(q), maDe }))
  }
  /** Ca THI đang mở (chưa công bố) mà tờ đề có `qid`: các qid ấy là đề đang bảo vệ, và sự kiện `thi` của ca này bị ẩn khỏi bằng chứng. */
  function themCaBaoVe(d: D1That, maCa: string, qid: string[]) {
    d.objects.set(`de/${maCa}.json`, { phanI: qid.map((q) => ({ id: q, text: `Đề ${q}`, choices: ['A', 'B', 'C', 'D'], correct: 'B', dang: { ma: 'ES.A.X', ten: 'Dạng' }, mucDo: 'biet', kienThuc: ['K1'], loiGiai: { chot: 'g' } })), phanII: [], phanIII: [] })
    d.sql.prepare("INSERT INTO ca(ma_ca,trang_thai,cong_bo,bank_r2,loai,thoi_gian_phut,bat_dau,het_han_vao,cap_nhat_luc) VALUES(?,'mo','ca_lop_xong',?,'thi',45,?,?,'x')")
      .run(maCa, `de/${maCa}.json`, new Date(Date.now() + 3600_000).toISOString(), new Date(Date.now() + 7200_000).toISOString())
  }
  const sk = (qid: string, ketQua: 0 | 1, luc: number, nguon: 'btvn' | 'thi' | 'mom', maNguon: string, lan = 1) => ({ nguon, maNguon, sbd: 'S1', qid, lan, ketQua, luc: iso(luc), maDang: 'ES.A.X' as string | null })
  const hoSo = (d: D1That) => ({ cau: bam(d, 'nam_kt_cau'), dang: bam(d, 'nam_kt_dang'), so: bam(d, 'su_kien_hoc'), tienDo: bam(d, 'tien_do_hs'), daLam: bam(d, 'qid_da_lam') })
  const boCapNhat = (d: D1That, t: string) => (d.sql.prepare(`SELECT * FROM "${t}" ORDER BY khoa`).all() as Record<string, unknown>[]).map(({ cap_nhat_luc, ...con }) => con)

  async function dungHoSo() {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em','12','mk-cu','x')").run()
    themCau(d, 'DE-OK', ['OK1', 'OK2', 'OK3'])
    themCau(d, 'DE-BV', ['BAOVE1'])
    themCaBaoVe(d, 'CA-MO-1', ['BAOVE1'])
    // S1 đã NỘP lượt 1 của CA-MO-1 (nên sổ có sự kiện `thi` lan 1) nhưng S2 còn ĐANG LÀM ⇒ ca `ca_lop_xong` chưa công bố: câu thi của ca vẫn ẩn.
    d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,cap_nhat_luc) VALUES('CA-MO-1|S1|1','CA-MO-1','S1',1,'2026-09-17T02:00:00.000Z','2026-09-17T03:00:00.000Z','da_nop','x')").run()
    d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,cap_nhat_luc) VALUES('CA-MO-1|S2|1','CA-MO-1','S2',1,'x','dang_lam','x')").run()
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES('B-CU-1','CA-CU-1','DE-OK',3,'x','y',0,'x')").run()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: '2026-09-01T00:00:00.000Z', dsSbd: ['S1'] }))
    const r = await ghiSuKien(d.env, [
      sk('OK1', 0, NGAY_CU, 'btvn', 'B-CU-1'),
      sk('OK2', 0, NGAY_CU + 1000, 'btvn', 'B-CU-1'),
      sk('OK3', 0, NGAY_CU + 2000, 'mom', 'M1'),
      sk('BAOVE1', 0, NGAY_CU + 3000, 'thi', 'CA-MO-1'), // sai ở ca thi CHƯA công bố: trước reset bị ẩn khỏi bằng chứng
      sk('OK3', 1, HOM_NAY, 'btvn', 'B-CU-1', 2), // hôm nay (trước reset) em sửa đúng OK3: dưới cờ EXP cũ đây là lên bậc + EXP câu
    ])
    expect(r.ok).toBe(true)
    await dungLaiHoSo(d.env, ['S1'], iso(HOM_NAY + H))
    return d
  }
  const qidOnLai = async (d: D1That) => {
    const kh = (await lapVaLuuKeHoach(d.env, ['S1'], BAY_GIO)).get('S1')!
    return ((kh.viec.find((x) => x.loai === 'on_lai')?.chiTiet.qid as string[] | undefined) ?? []).slice().sort()
  }
  const dsQid = ['OK1', 'OK2', 'OK3', 'BAOVE1']
  const lenBang = async (d: D1That) => (await goiWorker(worker, d.env, '/goi', { action: 'hoSoLopLenBang', dsSbd: ['S1'], dsQid }, true)).em.S1

  /** Ca đã thi xong và công bố (`cong_bo='ngay'`), em S1 nộp TRƯỚC lúc reset: dưới cờ EXP cũ sinh EXP điểm ca; sau reset thì KHÔNG. */
  function themCaDaThi(d: D1That) {
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cong_bo,loai,lop,cap_nhat_luc) VALUES('CA-DA-THI','Ca đã thi','dong','ngay','thi','12','x')").run()
    d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,diem_i,diem_ii,diem_iii,cap_nhat_luc) VALUES('CA-DA-THI|S1|1','CA-DA-THI','S1',1,'2026-09-19T02:00:00.000Z','2026-09-19T03:00:00.000Z','da_nop',2,1,1,'x')").run()
    d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,dung_sai,cap_nhat_luc) VALUES('CA-DA-THI|S1|1|OK1','CA-DA-THI','S1',1,'I',1,'OK1',0,'x')").run()
  }

  it('CA THI ĐƯỢC GIỮ nguyên từng byte (ca, lượt, chi tiết…); BTVN/kế hoạch ngày/EXP bị xoá; ca chưa công bố VẪN ẩn và VẪN bảo vệ; sổ + hồ sơ y nguyên; kế hoạch, lệnh lấy câu, hồ sơ lớp lên bảng chạy như trước', async () => {
    const d = await dungHoSo()
    themCaDaThi(d)
    lenDan(d, iso(RESET_LUC - 60_000))

    // --- trước ---
    const evTruoc = (await readScope(d.env, 'S1')).evidence
    expect(evTruoc.map((e) => e.qid).sort()).toEqual(['OK1', 'OK2', 'OK3'])
    expect((await qidPhucVuDuoc(d.env, dsQid)).biBaoVe).toEqual(['BAOVE1'])
    const onLaiTruoc = await qidOnLai(d)
    expect(onLaiTruoc).not.toContain('BAOVE1')
    expect(onLaiTruoc).toEqual(expect.arrayContaining(['OK1', 'OK2']))
    const lbTruoc = await lenBang(d)
    const hoSoTruoc = hoSo(d)
    const hoSoKhongGio = { cau: boCapNhat(d, 'nam_kt_cau'), dang: boCapNhat(d, 'nam_kt_dang') }
    const caThiTruoc = bamTatCa(d, CA_THI_GIU)
    expect(dem(d, 'ca')).toBeGreaterThan(0); expect(dem(d, 'luot')).toBeGreaterThan(0); expect(dem(d, 'btvn')).toBeGreaterThan(0)

    // --- reset ---
    const { cuoi } = await chayHet(d, RESET_LUC)
    expect(cuoi.trangThai!.trangThai).toBe('xong')
    for (const t of ['btvn', 'ke_hoach_ngay', 'exp_so']) expect(dem(d, t), t).toBe(0)
    expect(bamTatCa(d, CA_THI_GIU)).toEqual(caThiTruoc) // MỌI bảng ca thi y nguyên từng byte
    expect(hoSo(d)).toEqual(hoSoTruoc) // sổ + hồ sơ giữ nguyên từng byte

    // --- sau: ca vẫn còn nên mọi thứ liên quan ca hành xử NHƯ TRƯỚC ---
    await dungLaiHoSo(d.env, ['S1'], iso(BAY_GIO))
    expect({ cau: boCapNhat(d, 'nam_kt_cau'), dang: boCapNhat(d, 'nam_kt_dang') }).toEqual(hoSoKhongGio) // dựng lại từ sổ ra đúng hồ sơ cũ
    const evSau = (await readScope(d.env, 'S1')).evidence
    expect(evSau.map((e) => e.qid).sort()).toEqual(['OK1', 'OK2', 'OK3']) // câu thi của ca CHƯA công bố vẫn ẩn
    expect([...(await protectedQuestions(d.env))]).toContain('BAOVE1')
    expect((await qidPhucVuDuoc(d.env, dsQid)).biBaoVe).toEqual(['BAOVE1'])
    expect(await qidOnLai(d)).toEqual(onLaiTruoc)
    const lay = await layCauChoEm(d.env, 'S1', ['BAOVE1', 'OK1'])
    expect(lay.khongCo).toEqual(['BAOVE1'])
    expect(lay.cau.map((c) => c.qid)).toEqual(['OK1'])
    expect(await lenBang(d)).toEqual(lbTruoc) // hồ sơ lớp cho màn lên bảng của thầy: không đổi
  })

  it('thầy XOÁ CỨNG một ca (không phải do reset): sự kiện thi của ca không còn trong bảng ca tính là ĐÃ công bố, câu hết bị bảo vệ và vào kế hoạch', async () => {
    const d = await dungHoSo()
    lenDan(d, iso(RESET_LUC - 60_000))
    const onLaiTruoc = await qidOnLai(d)
    await chayHet(d, RESET_LUC)
    d.sql.prepare("DELETE FROM ca WHERE ma_ca = 'CA-MO-1'").run()
    xoaDemCaBaoVe() // test xoá bảng `ca` bằng SQL thô, không qua lệnh thật ⇒ tự xoá đệm 5 giây của protectedQuestions (production có móc bất hoạt ở mọi lệnh sửa ca thật)
    const evSau = (await readScope(d.env, 'S1')).evidence
    expect(evSau.map((e) => e.qid).sort()).toEqual(['BAOVE1', 'OK1', 'OK2', 'OK3'])
    expect(evSau.find((e) => e.qid === 'BAOVE1')).toMatchObject({ wrong: true })
    expect([...(await protectedQuestions(d.env))]).not.toContain('BAOVE1')
    expect((await qidPhucVuDuoc(d.env, dsQid)).biBaoVe).toEqual([])
    expect(await qidOnLai(d)).toEqual(expect.arrayContaining([...onLaiTruoc, 'BAOVE1']))
    const lay = await layCauChoEm(d.env, 'S1', ['BAOVE1', 'OK1'])
    expect(lay.khongCo).toEqual([])
  })

  it('EXP: sổ cũ NGUYÊN và lượt thi cũ còn mà tổng EXP sau reset = 0 (tu = lúc bắt đầu); câu cũ từng sai nay làm đúng vẫn "lên bậc" +6', async () => {
    const d = await dungHoSo()
    themCaDaThi(d)
    lenDan(d, iso(RESET_LUC - 60_000))
    // Cờ EXP CŨ (tu 01/09) tính EXP từ sổ hôm nay VÀ điểm ca đã thi: đây là thứ reset phải cắt.
    const truoc = await capNhatExp(d.env, 'S1', BAY_GIO)
    expect(truoc.bat).toBe(true)
    expect(truoc.khoan.length).toBeGreaterThan(0)
    expect(truoc.khoan.some((k) => k.loai === 'diem_ca')).toBe(true)
    const tongTruoc = (d.sql.prepare("SELECT COALESCE(SUM(exp),0) AS t FROM exp_so WHERE sbd='S1'").get() as { t: number }).t
    expect(tongTruoc).toBeGreaterThan(0)

    await chayHet(d, RESET_LUC)
    expect(dem(d, 'exp_so')).toBe(0)
    expect(dem(d, 'su_kien_hoc')).toBeGreaterThan(0) // sổ còn nguyên
    expect(dem(d, 'luot')).toBeGreaterThan(0) // lượt thi còn nguyên
    expect(JSON.parse((d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='exp_moi'").get() as { gia_tri: string }).gia_tri)).toEqual({ tu: iso(RESET_LUC), toanBo: true })

    const sau = await capNhatExp(d.env, 'S1', BAY_GIO)
    expect(sau.khoan).toEqual([]) // không câu, không lên bậc, không điểm ca của lượt nộp TRƯỚC reset
    expect(d.sql.prepare("SELECT COALESCE(SUM(exp),0) AS t FROM exp_so WHERE sbd='S1'").get()).toEqual({ t: 0 })

    // Sau reset em làm ĐÚNG câu OK1 (từng sai 3 ngày trước): lên bậc +6 (cộng EXP câu), dù sổ cũ vẫn còn đó.
    expect((await ghiSuKien(d.env, [sk('OK1', 1, SAU_RESET, 'btvn', 'B-MOI', 1)])).ok).toBe(true)
    const moi = await capNhatExp(d.env, 'S1', BAY_GIO)
    expect(moi.khoan.map((k) => k.loai)).toContain('len_bac')
    expect(moi.khoan.find((k) => k.loai === 'len_bac')!.exp).toBe(6)
    expect(moi.khoan.map((k) => k.loai)).toContain('cau')
    expect(moi.khoan.map((k) => k.loai)).not.toContain('diem_ca')
    // Lần OK3 đúng lúc 09:00 (trước reset) KHÔNG được tính lại.
    expect(moi.khoan.filter((k) => k.qid === 'OK3')).toEqual([])
  })

  it('EXP: câu sai ở ca thi CHƯA công bố (ca được giữ) chỉ lên bậc khi ca công bố; ca bị xoá cứng thì coi như đã công bố', async () => {
    for (const cach of ['cong_bo', 'xoa'] as const) {
      const d = await dungHoSo()
      lenDan(d, iso(RESET_LUC - 60_000))
      await chayHet(d, RESET_LUC)
      expect((await ghiSuKien(d.env, [sk('BAOVE1', 1, SAU_RESET, 'btvn', 'B-MOI', 2)])).ok).toBe(true)
      const truocCongBo = await capNhatExp(d.env, 'S1', BAY_GIO)
      expect(truocCongBo.khoan.some((k) => k.loai === 'len_bac' && k.qid === 'BAOVE1'), 'ca chưa công bố thì lần sai ở ca ẩn').toBe(false)
      if (cach === 'cong_bo') d.sql.prepare("UPDATE ca SET cong_bo = 'ngay' WHERE ma_ca = 'CA-MO-1'").run()
      else d.sql.prepare("DELETE FROM ca WHERE ma_ca = 'CA-MO-1'").run()
      const sau = await capNhatExp(d.env, 'S1', BAY_GIO)
      expect(sau.khoan.some((k) => k.loai === 'len_bac' && k.qid === 'BAOVE1'), cach).toBe(true)
    }
  })
})

describe('đóng băng ghi trong lúc job chạy', () => {
  const luc = (phutSauLenDan: number) => LEN_DAN_MS + phutSauLenDan * 60_000
  it('chỉ đóng băng từ lúc lên đạn tới +60 phút, CÓ cờ cho phép, KHÔNG huỷ, job CHƯA xong; xong sớm thì MỞ ngay; không mở giữa chừng', async () => {
    const d = dung()
    expect(await dangLamMoi(d.env, luc(-1))).toBe(false) // chưa tới lúc lên đạn
    expect(await dangLamMoi(d.env, luc(0.5))).toBe(true)
    expect(await dangLamMoi(d.env, luc(19))).toBe(true)
    expect(await dangLamMoi(d.env, luc(21))).toBe(true) // job chưa xong mà mở băng là dữ liệu nửa cũ nửa mới
    expect(await dangLamMoi(d.env, luc(58))).toBe(true)
    expect(await dangLamMoi(d.env, luc(61))).toBe(false) // hết cửa sổ (qua_gio): mở
    await chayHet(d, luc(1))
    expect(await dangLamMoi(d.env, luc(30))).toBe(false) // xong lúc nào thì mở lúc ấy
    const h = dung()
    huy(h)
    expect(await dangLamMoi(h.env, luc(1))).toBe(false)
    const kCo = dung({}, false)
    expect(await dangLamMoi(kCo.env, luc(1))).toBe(false) // không có cờ lên đạn: không đóng băng
  })

  it('bộ nhớ đệm 30 giây (SỬA CÓ CHỦ Ý 21/09 hạ tải D1: 3 s → 30 s): hai lần hỏi trong 30 giây chỉ tốn MỘT truy vấn; hỏi lại sau 30 giây thì đọc lại (thấy cờ mới)', async () => {
    const d = dung({}, false)
    const t0 = d.soLenh.prepare
    expect(await dangLamMoi(d.env, luc(1))).toBe(false)
    expect(await dangLamMoi(d.env, luc(1) + 1000)).toBe(false)
    expect(d.soLenh.prepare - t0).toBe(1)
    lenDan(d)
    expect(await dangLamMoi(d.env, luc(1) + 2000)).toBe(false) // vẫn trong đệm
    expect(await dangLamMoi(d.env, luc(1) + 29_000)).toBe(false) // còn đệm (29 s)
    expect(await dangLamMoi(d.env, luc(1) + 31_000)).toBe(true) // hết đệm: thấy cờ
  })

  it('môi trường tối giản/hỏng (không có D1 dùng được làm khoá đệm) không ném lỗi: không đóng băng, mocReset vắng', async () => {
    const raw = { DB: undefined } as never
    await expect(dangLamMoi(raw, luc(1))).resolves.toBe(false)
    await expect(docMocReset(raw, luc(1))).resolves.toBeNull()
    const chuoi = { DB: 'khong-phai-d1' } as never
    await expect(dangLamMoi(chuoi, luc(1))).resolves.toBe(false)
    await expect(docMocReset(chuoi, luc(1))).resolves.toBeNull()
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
    vi.setSystemTime(luc(30)) // vượt bộ nhớ đệm 3 giây
    const xong = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: '12121212' })
    expect(xong.ok).toBe(true)
    expect(xong.dangLamMoi).toBeUndefined()

    const kCo = dung({}, false)
    vi.setSystemTime(luc(0.5))
    expect((await goiWorker(worker, kCo.env, '/hs/ke-hoach-ngay', { sbd: '12121212' })).ok).toBe(true)
  })
})

describe('mocReset cho máy khách: CHỈ sau khi job xong, = ngày VN lúc XONG', () => {
  const luc = (phutSauLenDan: number) => LEN_DAN_MS + phutSauLenDan * 60_000
  it('trước khi xong: KHÔNG có trường mocReset ở /hs/ke-hoach-ngay, /hs/ca-dang-mo, /ca/danh-sach, danhSachCa; sau khi xong: ngày VN lúc xong ở GỐC JSON', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(luc(25)) // chưa lên đạn nên không đóng băng
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
    vi.setSystemTime(luc(40))
    const sau = {
      kh: await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: '12121212' }),
      ca: await goiWorker(worker, d.env, '/hs/ca-dang-mo', { sbd: '12121212' }),
      gv: await goiWorker(worker, d.env, '/goi', { action: 'danhSachCa' }, true),
      gv2: await goiWorker(worker, d.env, '/ca/danh-sach', {}, true),
    }
    for (const r of Object.values(sau)) {
      expect(r.ok).toBe(true)
      expect(r.mocReset).toBe('2026-09-21') // 16:0x giờ VN ngày 21/09
    }
  })
  it('đang chạy dở (khoá dang_chay/cho_tiep) cũng KHÔNG gửi mocReset', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(luc(25))
    const d = dung({}, false)
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,'x')").run(MA_RESET, JSON.stringify({ trangThai: 'cho_tiep', buoc: 'xoa', bangTiep: 3, batDauLuc: LEN_DAN, soLanChay: 1, demTruoc: {} }))
    expect(await docMocReset(d.env, Date.now())).toBeNull()
    expect('mocReset' in (await goiWorker(worker, d.env, '/hs/ca-dang-mo', { sbd: '12121212' }))).toBe(false)
  })
  it('job bắt đầu 23:59 VN và xong sau nửa đêm: mùa game theo ngày BẮT ĐẦU, mocReset theo ngày XONG', async () => {
    const lenDanLuc = Date.parse('2026-09-21T16:50:00.000Z') // 23:50 VN 21/09
    const d = dung({}, false)
    lenDan(d, new Date(lenDanLuc).toISOString())
    const { cuoi } = await chayHet(d, Date.parse('2026-09-21T16:59:30.000Z')) // 23:59:30 VN
    const st = cuoi.trangThai!
    expect(st.trangThai).toBe('xong')
    expect(st.mua).toBe('2026-09-21-mua-1')
    expect(new Date(Date.parse(st.xongLuc!) + 7 * H).toISOString().slice(0, 10)).toBe('2026-09-22') // xong sau 00:00 VN
    expect(st.mocReset).toBe('2026-09-22')
    expect(await docMocReset(d.env, Date.parse(st.xongLuc!) + 10_000)).toBe('2026-09-22')
    expect(JSON.parse((d.sql.prepare("SELECT json FROM game_v2_settings WHERE key='season'").get() as { json: string }).json).id).toBe('2026-09-21-mua-1')
  })
})

describe('lệnh của thầy: chạy tiếp tay và đo giới hạn', () => {
  it('lệnh chạy tiếp tay và đo giới hạn qua Worker đòi mã bí mật; đo giới hạn trả số truy vấn', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(LEN_DAN_MS - 3_600_000) // bỏ phụ thuộc đồng hồ thật (xem test /reset/dry-run)
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

describe('EXP: mốc riêng tuDsSbd', () => {
  it('em trong dsSbd giữ mốc riêng sớm khi toanBo ở mốc muộn; tuDsSbd vắng thì như cũ', async () => {
    const { mocExpCuaEm } = await import('../server/src/exp-d1')
    const cfg = { tu: '2026-09-20T17:01:00.000Z', dsSbd: ['12121212'], toanBo: true, tuDsSbd: '2026-09-19T08:47:43.000Z' }
    const truocMoc = Date.parse('2026-09-20T10:00:00Z')
    expect(mocExpCuaEm(cfg, '12121212', truocMoc)).toBe('2026-09-19T08:47:43.000Z')
    expect(mocExpCuaEm(cfg, 'S9', truocMoc)).toBeNull()
    expect(mocExpCuaEm(cfg, 'S9', Date.parse('2026-09-20T17:01:00.000Z'))).toBe('2026-09-20T17:01:00.000Z')
    expect(mocExpCuaEm({ ...cfg, tuDsSbd: null }, '12121212', truocMoc)).toBeNull()
  })
})
