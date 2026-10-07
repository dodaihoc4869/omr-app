// @vitest-environment node
// RESET LẦN 2 — GAME HÓA 2.0 (server/src/reset-hoa2.ts) — chạy trên SQLite THẬT với lược đồ thật + mọi migration (tests/_d1-that.ts).
// Lệnh thầy 27/09/2026: "reset lại toàn bộ về 0, chọn lại thần thú. Giữ lại toàn bộ hồ sơ dữ liệu của từng học sinh, xoá toàn bộ các ca thi cũ."
// + "Bỏ hẳn BTVN", "bỏ app phụ huynh" + (chốt thêm) "xoá cả vàng và phụ kiện luôn nhé vì cho chọn lại thần thú từ đầu chơi cho công bằng".
// KHÔNG import server/src/index.ts (tệp ấy đang thiếu mô-đun của phiên khác ⇒ nạp là đỏ cả tệp): lệnh tay thử qua `xuLyLenhResetHoa2`, còn chỗ nối trong
// index.ts (sau cổng mã bí mật, sau job 21/09 trong cron) được khoá bằng đọc mã nguồn.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  BANG_CA_THI_HOA2, BANG_GIU_HOA2, BANG_XOA_HOA2, KHOA_CHO_PHEP_HOA2, KHOA_HUY_HOA2, MA_RESET_HOA2, RESET_HOA2,
  cronResetHoa2, kiemCaDangMo, resetHoa2DryRun, trangThaiResetHoa2, xuLyLenhResetHoa2,
} from '../server/src/reset-hoa2'
import * as ResetHoa2 from '../server/src/reset-hoa2'
import {
  BANG_XOA, CUA_SO_MS, KHOA_CHO_PHEP, KHOA_JOB_HOA2, MA_RESET, TOI_DA_TRUY_VAN_MOI_LUOT,
  chayResetTheo, dangLamMoi, docMocReset, docTrangThaiReset, maDaDung,
} from '../server/src/reset-toan-app'
import { loadProfile } from '../server/src/game-v2'
import { readScope } from '../server/src/game-v2-bank'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { capNhatExp } from '../server/src/exp-d1'
import { docLanLam } from '../server/src/srs2-d1'
import { taoD1That, type D1That } from './_d1-that'

const H = 3_600_000
/** Lúc "lên đạn" của phần lớn test: 19:00 VN 27/09/2026 (chỉ là giá trị ghi vào `cap_nhat_luc` của cờ, không phải mốc cố định của job). */
const LEN_DAN_MS = Date.parse('2026-09-27T12:00:00.000Z')
const LEN_DAN = new Date(LEN_DAN_MS).toISOString()
const SAU = LEN_DAN_MS + 60_000
const iso = (ms: number) => new Date(ms).toISOString()

/** KHAI CỨNG (không lấy từ danh sách của mã) để đột biến "chuyển nhầm bảng" bị bắt. */
const HO_SO_GIU = ['su_kien_hoc', 'nam_kt_cau', 'nam_kt_dang', 'tien_do_hs', 'qid_da_lam', 'skill_snapshot', 'nang_luc_cursor', 'learner_scope', 'quyen_hoc_sinh', 'cau_snapshot'] as const
const TAI_KHOAN_GIU = ['hoc_sinh', 'danh_sach', 'phu_huynh', 'de_kho', 'cau_hoi', 'game_v2_question', 'game_v2_index', 'cau_hinh', 'game_v2_settings', 'game_v2_scope', 'ma_da_dung', 'ph_truy_cap'] as const
const HOA2_GIU = ['chien_dich', 'srs2_day_lai', 'dong_bo'] as const
const CA_THI_XOA = ['ca', 'luot', 'bai_bo_sung', 'chi_tiet_cau', 'ban_do_sai', 'phong_cho', 'chan_vao', 'trang_thai', 'phieu', 'kho_ca_them', 'nhan_xet', 'de_rieng', 'nop_khac_phuc', 'tien_do_ca', 'nhan_xet_ca_em'] as const // 01/10: bai_bo_sung đi theo lượt ca thi
const VANG_PHU_KIEN_XOA = ['vang_so', 'phu_kien_so_huu', 'phu_kien_dang_mac'] as const
const GAME_XOA = ['game_v2_profile', 'than_thu', 'exp_so', 'manh_khien_so', 'cnh_exp_account', 'srs2_ke_hoach', 'ruong_bat_linh', 'doan_luot', 'btvn', 'btvn_em', 'mom_bai', 'ke_hoach_ngay', 'parent_daily_news', 'ph_giao_them'] as const

const bangHienCo = (d: D1That) => (d.sql.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name").all() as { name: string }[]).map((x) => x.name)
const bam = (d: D1That, t: string) => JSON.stringify(d.sql.prepare(`SELECT * FROM "${t}" ORDER BY rowid`).all())
const dem = (d: D1That, t: string) => (bangHienCo(d).includes(t) ? Number((d.sql.prepare(`SELECT COUNT(*) AS n FROM "${t}"`).get() as { n: number }).n) : 0)
const bamTatCa = (d: D1That, ds: readonly string[]) => Object.fromEntries(ds.filter((t) => bangHienCo(d).includes(t)).map((t) => [t, bam(d, t)]))
/** Bảng GIỮ mà job KHÔNG được đổi một byte (trừ ba bảng job chỉ ghi vài dòng: cấu hình, mùa game, mã đã dùng). */
const KHONG_DOI = [...new Set([...BANG_GIU_HOA2, ...HO_SO_GIU, ...TAI_KHOAN_GIU, ...HOA2_GIU])].filter((t) => !['cau_hinh', 'game_v2_settings', 'ma_da_dung'].includes(t))

/** Gieo MỖI bảng 2 dòng (điền cột NOT NULL bằng giá trị mẫu theo kiểu) + dòng có nghĩa: tài khoản, ca đã đóng, ca đo tải, hồ sơ game đã chọn thú, vàng. */
function gieo(d: D1That) {
  // Bảng có khoá ngoại mới phải gieo cha trước con, giữ nguyên FK của sản phẩm.
  const thuTu: Record<string, number> = {chua_loi_dot:-4,chua_loi_phien:-3,chua_loi_item:-2,chua_loi_nop:-1}
  for (const t of bangHienCo(d).sort((a,b)=>(thuTu[a]??0)-(thuTu[b]??0))) {
    const cot = d.sql.prepare(`PRAGMA table_info("${t}")`).all() as { name: string; type: string; notnull: number; dflt_value: unknown; pk: number }[]
    const tuTang = cot.length > 0 && cot.filter((c) => c.pk > 0).length === 1 && cot.find((c) => c.pk > 0)!.type.toUpperCase() === 'INTEGER'
    const dung = cot.filter((c) => !(tuTang && c.pk > 0) && ((c.notnull && c.dflt_value === null) || c.pk > 0))
    for (let i = 0; i < 2; i++) {
      const gt = dung.map((c) => (t.startsWith('chua_loi_') && ['dot_id','phien_id','item_id'].includes(c.name) ? `chua_loi_${c.name.slice(0,-3)}-id-${i}` : /INT/i.test(c.type) ? i + 1 : /REAL|FLOA|DOUB/i.test(c.type) ? i + 0.5 : `${t}-${c.name}-${i}`))
      d.sql.prepare(`INSERT OR IGNORE INTO "${t}" (${dung.map((c) => `"${c.name}"`).join(',')}) VALUES (${dung.map(() => '?').join(',')})`).run(...(gt as never[]))
    }
  }
  d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('12121212','Thầy','12A','mk-cu','x')").run()
  d.sql.prepare("INSERT OR REPLACE INTO ca(ma_ca,trang_thai,cap_nhat_luc) VALUES('CA-CU-1','dong','x')").run()
  d.sql.prepare("INSERT OR REPLACE INTO ca(ma_ca,trang_thai,cap_nhat_luc) VALUES('DOTAI','mo','x')").run() // ca đo tải đang mở: KHÔNG được làm hoãn
  d.sql.prepare("INSERT OR REPLACE INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES('CA-CU-1-abc','CA-CU-1','DE',3,'x','y',0,'x')").run()
  d.sql.prepare("INSERT OR REPLACE INTO mom_bai(sbd,id,title,created_at,question_count,bank_key) VALUES('12121212','daily_2026-09-26','t','x',1,'k')").run()
  d.sql.prepare("INSERT OR REPLACE INTO dong_bo(ma,luc,so_ca,so_luot,ghi_chu) VALUES('ca_day_du','x',3,2,'')").run()
  // Vàng + phụ kiện đã mua/đang mặc (bảng có CHECK nên gieo tay): thầy chốt 27/09 XOÁ.
  d.sql.prepare("INSERT INTO vang_so(sbd,loai,so_vang,exp_tru,khoa_yeu_cau,luc) VALUES('12121212','doi',50,500,'k1','x')").run()
  d.sql.prepare("INSERT INTO phu_kien_dang_mac(sbd,o_gan,ma_mon,luc) VALUES('12121212','khung','khung-vang','x')").run()
  d.sql.prepare("INSERT OR REPLACE INTO game_v2_profile(sbd,revision,json,created_at) VALUES('12121212',3,?,'x')").run(JSON.stringify({ pet: 'nuoc_long', choice: false, cap: 20, exp: 55, wallet: 9, earned: 900, tower: 7, mastery: [], arena: null, season: '2026-09-21-mua-1' }))
  d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: '2026-09-21T09:01:00.000Z', toanBo: true }))
  d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','true','x')").run()
  d.sql.prepare("INSERT OR REPLACE INTO game_v2_settings(key,json) VALUES('season',?)").run(JSON.stringify({ id: '2026-09-21-mua-1', startedAt: '2026-09-21T09:01:00.000Z' }))
  // Lần 21/09 đã XONG (như trên D1 thật): cổng đóng băng + mocReset phải xét cả hai job.
  d.sql.prepare('INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)').run(MA_RESET, JSON.stringify({ trangThai: 'xong', buoc: 'chot', bangTiep: 0, batDauLuc: '2026-09-21T09:01:00.000Z', xongLuc: '2026-09-21T09:05:00.000Z', mocReset: '2026-09-21', soLanChay: 3, demTruoc: {} }), 'x')
  d.sql.prepare('INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)').run(KHOA_CHO_PHEP, 'true', '2026-09-21T09:00:00.000Z')
}
const lenDan = (d: D1That, luc: string = LEN_DAN, giaTri = 'true') => d.sql.prepare('INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)').run(KHOA_CHO_PHEP_HOA2, giaTri, luc)
const huy = (d: D1That, giaTri = 'true') => d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,'x')").run(KHOA_HUY_HOA2, giaTri)
const moCa = (d: D1That, ma: string, loai = 'thi') => d.sql.prepare("INSERT OR REPLACE INTO ca(ma_ca,trang_thai,loai,cap_nhat_luc) VALUES(?,'mo',?,'x')").run(ma, loai)
const dongCa = (d: D1That, ma: string) => d.sql.prepare("UPDATE ca SET trang_thai='dong' WHERE ma_ca=?").run(ma)
const chay = (d: D1That, luc: number) => chayResetTheo(RESET_HOA2, d.env, luc)
const khoaHoa2 = (d: D1That) => docTrangThaiReset(d.env, KHOA_JOB_HOA2)

const dung = (coLenDan = true) => {
  const d = taoD1That()
  gieo(d)
  if (coLenDan) lenDan(d)
  return d
}
/** Chạy job qua NHIỀU lượt cron (mỗi 61 giây một lượt) tới khi xong; đo truy vấn TỪNG lượt. */
async function chayHet(d: D1That, batDau = SAU, toiDaLuot = 60) {
  let luot = 0
  let toiDa = 0
  let cuoi = await chay(d, batDau)
  for (; ; luot++) {
    toiDa = Math.max(toiDa, cuoi.soTruyVan)
    if (cuoi.trangThai?.trangThai === 'xong' || luot >= toiDaLuot) break
    cuoi = await chay(d, batDau + (luot + 1) * 61_000)
  }
  return { cuoi, luot: luot + 1, toiDaTruyVan: toiDa, cuoiLuc: batDau + luot * 61_000 }
}

describe('phân loại bảng (lần 2)', () => {
  it('MỌI bảng của lược đồ (schema + mọi migration, gồm migration-2709-game-hoa-2) đều được phân loại XOÁ hoặc GIỮ', () => {
    const d = taoD1That()
    const daPhanLoai = new Set([...BANG_XOA_HOA2, ...BANG_GIU_HOA2])
    expect(bangHienCo(d).filter((t) => !daPhanLoai.has(t))).toEqual([])
    for (const t of ['chien_dich', 'srs2_ke_hoach', 'srs2_day_lai', 'ruong_bat_linh']) expect(bangHienCo(d), t).toContain(t)
  })
  it('hai danh sách không giao nhau, không trùng; sổ + hồ sơ, tài khoản, chien_dich, srs2_day_lai, dong_bo GIỮ; ca thi, vàng + phụ kiện, game XOÁ; không còn danh sách chờ chốt', () => {
    expect(BANG_XOA_HOA2.filter((t) => BANG_GIU_HOA2.includes(t))).toEqual([])
    expect(new Set(BANG_XOA_HOA2).size).toBe(BANG_XOA_HOA2.length)
    expect(new Set(BANG_GIU_HOA2).size).toBe(BANG_GIU_HOA2.length)
    for (const t of [...HO_SO_GIU, ...TAI_KHOAN_GIU, ...HOA2_GIU]) { expect(BANG_GIU_HOA2, t).toContain(t); expect(BANG_XOA_HOA2, t).not.toContain(t) }
    for (const t of [...CA_THI_XOA, ...VANG_PHU_KIEN_XOA, ...GAME_XOA]) expect(BANG_XOA_HOA2, t).toContain(t)
    for (const t of BANG_XOA) expect(BANG_XOA_HOA2, `${t} (XOÁ lần 21/09)`).toContain(t)
    expect([...BANG_CA_THI_HOA2].sort()).toEqual([...CA_THI_XOA].sort())
    // `ca` xoá SAU mọi bảng ca thi khác (xoá dở thì ca còn để kiểm "ca đang mở" và nạp mã lại).
    const viTriCa = BANG_XOA_HOA2.indexOf('ca')
    for (const t of CA_THI_XOA.filter((x) => x !== 'ca')) expect(BANG_XOA_HOA2.indexOf(t), t).toBeLessThan(viTriCa)
    expect('BANG_CHO_THAY_CHOT' in ResetHoa2).toBe(false) // thầy đã chốt 27/09: vàng + phụ kiện XOÁ
    expect(RESET_HOA2).toMatchObject({ maReset: 'reset_hoa2', khoaHuy: 'reset_hoa2_huy', khoaChoPhep: 'reset_hoa2_cho_phep', dongBangTuLenDan: false, loaiMaNap: ['ca', 'btvn', 'mom'] })
    expect(MA_RESET_HOA2).not.toBe(MA_RESET)
  })
})

describe('chạy thử (dryRun): chỉ đếm, không ghi gì', () => {
  it('đếm đúng, KHÔNG đổi một byte D1, ≤ 40 truy vấn; báo số mã ca sẽ nạp; không có ca mở (ca đo tải không tính) ⇒ hoan: null', async () => {
    const d = dung()
    const truoc = bamTatCa(d, bangHienCo(d))
    const lenhTruoc = d.soLenh.prepare
    const r = await resetHoa2DryRun(d.env)
    expect(d.soLenh.prepare - lenhTruoc).toBe(r.soTruyVan)
    expect(r.soTruyVan).toBeLessThanOrEqual(TOI_DA_TRUY_VAN_MOI_LUOT)
    expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
    expect(r).toMatchObject({ ok: true, dryRun: true, choPhep: true, huy: false, daXong: false, sanSang: true, lyDo: [], chuaPhanLoai: [], lenDanLuc: LEN_DAN, hanTuChay: iso(LEN_DAN_MS + CUA_SO_MS), hoan: null, trangThaiKhoa: null })
    expect(r.maSeGiuLai.ca).toBe(dem(d, 'ca'))
    expect(r.maSeGiuLai.btvn).toBeGreaterThan(0)
    for (const t of CA_THI_XOA) expect(r.xoa.find((x) => x.bang === t)!.dong, t).toBe(dem(d, t))
    for (const t of ['su_kien_hoc', 'hoc_sinh', 'chien_dich', 'dong_bo']) expect(r.giu.find((x) => x.bang === t)!.dong, t).toBe(dem(d, t))
    expect(r.tongDongSeXoa).toBe(BANG_XOA_HOA2.reduce((t, b) => t + dem(d, b), 0))
  })
  it('có ca thi mở ⇒ dryRun báo hoan kèm mã ca; chưa lên đạn ⇒ choPhep:false', async () => {
    const d = dung(false)
    moCa(d, 'CA-DANG-THI')
    const r = await resetHoa2DryRun(d.env)
    expect(r.choPhep).toBe(false)
    expect(r.hoan).toMatchObject({ caDangMo: ['CA-DANG-THI'] })
    expect(r.hoan!.lyDo).toMatch(/CA-DANG-THI/)
  })
})

describe('chạy thật', () => {
  it('bảng XOÁ rỗng hết; bảng GIỮ y nguyên TỪNG BYTE (su_kien_hoc, hoc_sinh, chien_dich cùng số dòng); mã ca vào ma_da_dung; exp_moi.tu + mùa mới; em phải CHỌN LẠI thú; ≤ 40 truy vấn/lượt', async () => {
    const d = dung()
    for (const t of [...CA_THI_XOA, ...VANG_PHU_KIEN_XOA, 'srs2_ke_hoach', 'ruong_bat_linh']) expect(dem(d, t), `${t} có dữ liệu để xoá`).toBeGreaterThan(0)
    const giuTruoc = bamTatCa(d, KHONG_DOI)
    const soTruoc = { su_kien_hoc: dem(d, 'su_kien_hoc'), hoc_sinh: dem(d, 'hoc_sinh'), chien_dich: dem(d, 'chien_dich'), dong_bo: dem(d, 'dong_bo') }
    for (const [t, n] of Object.entries(soTruoc)) expect(n, t).toBeGreaterThan(0)
    const maCa = (d.sql.prepare('SELECT ma_ca FROM ca').all() as { ma_ca: string }[]).map((x) => x.ma_ca)
    const cauHinhKhac = d.sql.prepare("SELECT * FROM cau_hinh WHERE khoa NOT IN ('exp_moi') ORDER BY khoa").all() as { khoa: string }[]

    const { cuoi, luot, toiDaTruyVan } = await chayHet(d)
    expect(cuoi.trangThai!.trangThai).toBe('xong')
    expect(luot).toBeGreaterThan(2) // giành khoá → chờ băng → xoá chia bước
    expect(toiDaTruyVan).toBeLessThanOrEqual(TOI_DA_TRUY_VAN_MOI_LUOT)
    for (const t of BANG_XOA_HOA2) expect(dem(d, t), t).toBe(0)
    for (const t of VANG_PHU_KIEN_XOA) expect(dem(d, t), `${t} (thầy chốt 27/09: xoá vàng + phụ kiện)`).toBe(0)
    expect(bamTatCa(d, KHONG_DOI)).toEqual(giuTruoc)
    for (const [t, n] of Object.entries(soTruoc)) expect(dem(d, t), t).toBe(n)
    for (const m of maCa) expect(await maDaDung(d.env, 'ca', m), m).toBe(true)
    expect(await maDaDung(d.env, 'btvn', 'CA-CU-1-abc')).toBe(true)
    expect(await maDaDung(d.env, 'mom', 'daily_2026-09-26')).toBe(true)
    expect(await maDaDung(d.env, 'ca', 'CA-MOI-9')).toBe(false)

    const st = (await khoaHoa2(d))!
    const batDauLuc = iso(SAU)
    expect(st).toMatchObject({ trangThai: 'xong', batDauLuc, lenDanLuc: LEN_DAN, mua: '2026-09-27-mua-1', chuaPhanLoai: [] })
    expect(st.maDaDung!.ca).toBe(maCa.length)
    for (const t of KHONG_DOI) if (st.demTruoc[t] !== undefined && st.demTruoc[t] !== null) expect(st.demSau![t], t).toBe(st.demTruoc[t])
    expect(st.demSau!.ma_da_dung).toBeGreaterThan(st.demTruoc.ma_da_dung!)
    expect(st.xoaConDu).toBeUndefined()
    expect(JSON.parse((d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='exp_moi'").get() as { gia_tri: string }).gia_tri)).toEqual({ tu: batDauLuc, toanBo: true })
    expect(JSON.parse((d.sql.prepare("SELECT json FROM game_v2_settings WHERE key='season'").get() as { json: string }).json)).toEqual({ id: '2026-09-27-mua-1', startedAt: batDauLuc })
    // Cấu hình khác còn nguyên (cờ game_hoa_2, khoá lần 21/09…), trừ dòng khoá lần 2 vừa ghi.
    expect(d.sql.prepare(`SELECT * FROM cau_hinh WHERE khoa NOT IN ('exp_moi','${MA_RESET_HOA2}') ORDER BY khoa`).all()).toEqual(cauHinhKhac.filter((x) => x.khoa !== MA_RESET_HOA2))
    // CHỌN LẠI thần thú: hồ sơ game tạo lại là bản TRẮNG, choice:true, mùa mới.
    const { profile } = await loadProfile(d.env, '12121212')
    expect(profile).toMatchObject({ choice: true, pet: 'dat_quy', cap: 1, exp: 0, wallet: 0, season: '2026-09-27-mua-1' })
  })

  it('KHÔNG CÓ CỜ lên đạn ⇒ không làm gì (D1 không đổi một byte, không đóng băng); cờ của lần 21/09 KHÔNG kích hoạt lần 2; cờ "false"/"0" cũng không', async () => {
    for (const v of [null, 'false', '0']) {
      const d = dung(false)
      if (v !== null) lenDan(d, LEN_DAN, v)
      const truoc = bamTatCa(d, bangHienCo(d))
      expect(await chay(d, SAU)).toMatchObject({ chay: false, lyDo: 'khong_cho_phep' })
      expect(await chay(d, SAU + 5 * 24 * H)).toMatchObject({ chay: false, lyDo: 'khong_cho_phep' })
      expect(await cronResetHoa2(d.env, SAU)).toBe(false)
      expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
      expect(await dangLamMoi(d.env, SAU)).toBe(false)
    }
  })

  it('CỜ HUỶ thắng cờ lên đạn ("true", "1", {huy:true}); "false" thì không chặn', async () => {
    for (const v of ['true', '1', '{"huy":true}']) {
      const d = dung()
      huy(d, v)
      const truoc = bamTatCa(d, bangHienCo(d))
      expect(await chay(d, SAU)).toMatchObject({ chay: false, lyDo: 'huy' })
      expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
      expect(await dangLamMoi(d.env, SAU)).toBe(false)
    }
    const d = dung()
    huy(d, 'false')
    expect((await chay(d, SAU)).chay).toBe(true)
  })

  it('CÓ CA THI MỞ ⇒ HOÃN: không ghi gì, KHÔNG đóng băng (em đang thi vẫn nộp được), báo mã ca; đóng ca rồi thì cron chạy tới xong', async () => {
    const d = dung()
    moCa(d, 'CA-DANG-THI')
    moCa(d, 'BT-MO', 'baitap')
    const truoc = bamTatCa(d, bangHienCo(d))
    const r = await chay(d, SAU)
    expect(r).toMatchObject({ chay: false, lyDo: 'hoan', hoan: { caDangMo: ['BT-MO', 'CA-DANG-THI'] } })
    expect(r.hoan!.lyDo).toMatch(/1 ca loại bài tập/)
    expect(await cronResetHoa2(d.env, SAU + 61_000)).toBe(false) // hoãn ⇒ việc cron thường lệ vẫn chạy
    expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
    expect(await dangLamMoi(d.env, SAU + 2 * 61_000)).toBe(false)
    expect((await trangThaiResetHoa2(d.env, SAU)).tomTat).toMatch(/^HOÃN: .*CA-DANG-THI/)
    dongCa(d, 'CA-DANG-THI'); dongCa(d, 'BT-MO')
    const { cuoi } = await chayHet(d, SAU + 5 * 60_000)
    expect(cuoi.trangThai!.trangThai).toBe('xong')
    for (const t of CA_THI_XOA) expect(dem(d, t), t).toBe(0)
    expect(await maDaDung(d.env, 'ca', 'CA-DANG-THI')).toBe(true)
  })

  it('ca mở LỌT QUA khe đệm cổng (sau khi giành khoá, trước khi xoá) ⇒ TRẢ KHOÁ, chưa xoá gì, mở băng; đóng ca thì chạy lại từ đầu tới xong', async () => {
    const d = dung()
    const xoaTruoc = bamTatCa(d, BANG_XOA_HOA2)
    const l1 = await chay(d, SAU)
    expect(l1).toMatchObject({ chay: true, lyDo: 'cho_tiep', trangThai: { trangThai: 'cho_tiep', buoc: 'cho_bang' } })
    expect(await dangLamMoi(d.env, SAU + 1000)).toBe(true) // đã giữ khoá ⇒ đóng băng
    // Chưa đủ thời gian chờ băng ⇒ nhường, không xoá.
    expect(await chay(d, SAU + 10_000)).toMatchObject({ lyDo: 'cho_tiep', trangThai: { buoc: 'cho_bang' } })
    moCa(d, 'CA-LOT-KHE') // một isolate còn đệm "chưa đóng băng" nhận lệnh mở ca
    const l2 = await chay(d, SAU + 61_000)
    expect(l2).toMatchObject({ chay: false, lyDo: 'hoan', hoan: { caDangMo: ['CA-LOT-KHE'] } })
    expect(await khoaHoa2(d)).toBeNull()
    expect(bamTatCa(d, BANG_XOA_HOA2.filter((t) => t !== 'ca'))).toEqual(Object.fromEntries(Object.entries(xoaTruoc).filter(([t]) => t !== 'ca')))
    expect(await dangLamMoi(d.env, SAU + 61_000)).toBe(false)
    expect(await chay(d, SAU + 2 * 61_000)).toMatchObject({ lyDo: 'hoan' })
    dongCa(d, 'CA-LOT-KHE')
    const { cuoi } = await chayHet(d, SAU + 3 * 61_000)
    expect(cuoi.trangThai).toMatchObject({ trangThai: 'xong', batDauLuc: iso(SAU + 3 * 61_000) })
    for (const t of BANG_XOA_HOA2) expect(dem(d, t), t).toBe(0)
  })

  it('xoá dở rồi QUÁ GIỜ, lên đạn lại mà có ca mở ⇒ hoãn không đóng băng; ca mở lọt khe khi đang chờ băng ⇒ khoá `hoan`, mở băng; hết ca mở thì làm tiếp tới xong', async () => {
    const d = dung()
    await chay(d, SAU) // giành khoá
    const l2 = await chay(d, SAU + 61_000) // chờ băng xong ⇒ nạp mã + xoá, hết ngân sách thì nhường
    expect(l2.trangThai).toMatchObject({ trangThai: 'cho_tiep', buoc: 'xoa' })
    expect(l2.trangThai!.maDaDung!.ca).toBeGreaterThan(0)
    // Cron chết quá 60 phút ⇒ qua_gio, mở băng.
    const quaGio = LEN_DAN_MS + CUA_SO_MS + 60_000
    expect(await chay(d, quaGio)).toMatchObject({ lyDo: 'qua_gio', trangThai: { trangThai: 'qua_gio' } })
    expect(await dangLamMoi(d.env, quaGio + 1000)).toBe(false)
    moCa(d, 'CA-SAU-QUA-GIO')
    const lenDan2 = quaGio + 10 * 60_000
    lenDan(d, iso(lenDan2))
    const truoc = bamTatCa(d, bangHienCo(d))
    expect(await chay(d, lenDan2 + 60_000)).toMatchObject({ chay: false, lyDo: 'hoan', trangThai: { trangThai: 'qua_gio' } })
    expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
    expect(await dangLamMoi(d.env, lenDan2 + 60_000)).toBe(false)
    dongCa(d, 'CA-SAU-QUA-GIO')
    const l3 = await chay(d, lenDan2 + 2 * 60_000) // làm tiếp ⇒ lại chờ băng
    expect(l3.trangThai).toMatchObject({ trangThai: 'cho_tiep', buoc: 'cho_bang' })
    moCa(d, 'CA-LOT-KHE-2')
    const l4 = await chay(d, lenDan2 + 3 * 60_000)
    expect(l4).toMatchObject({ lyDo: 'hoan', trangThai: { trangThai: 'hoan', hoan: { caDangMo: ['CA-LOT-KHE-2'] } } })
    expect(await dangLamMoi(d.env, lenDan2 + 3 * 60_000 + 1000)).toBe(false)
    expect(await chay(d, lenDan2 + 4 * 60_000)).toMatchObject({ lyDo: 'hoan' })
    dongCa(d, 'CA-LOT-KHE-2')
    const { cuoi } = await chayHet(d, lenDan2 + 5 * 60_000)
    expect(cuoi.trangThai).toMatchObject({ trangThai: 'xong', batDauLuc: iso(SAU) })
    for (const t of BANG_XOA_HOA2) expect(dem(d, t), t).toBe(0)
    expect(await maDaDung(d.env, 'ca', 'CA-LOT-KHE-2')).toBe(true)
  })

  it('MỘT LẦN: xong rồi thì lên đạn lại cũng không chạy lại (D1 không đổi một byte); dữ liệu mới sau reset không bị xoá', async () => {
    const d = dung()
    const { cuoiLuc } = await chayHet(d)
    const truoc = bamTatCa(d, bangHienCo(d).filter((t) => t !== 'cau_hinh'))
    expect(await chay(d, cuoiLuc + 60_000)).toMatchObject({ chay: false, lyDo: 'da_xong' })
    lenDan(d, iso(cuoiLuc + H))
    expect(await chay(d, cuoiLuc + H + 60_000)).toMatchObject({ chay: false, lyDo: 'da_xong' })
    d.sql.prepare("INSERT INTO ca(ma_ca,trang_thai,cap_nhat_luc) VALUES('CA-MOI-1','dong','x')").run()
    expect(await cronResetHoa2(d.env, cuoiLuc + H + 2 * 60_000)).toBe(false)
    expect(dem(d, 'ca')).toBe(1)
    const sau = bamTatCa(d, bangHienCo(d).filter((t) => t !== 'cau_hinh'))
    delete (sau as Record<string, string>).ca; delete (truoc as Record<string, string>).ca
    expect(sau).toEqual(truoc)
  })

  it('HAI lượt cron CHỒNG NHAU: đúng một lượt giành được khoá', async () => {
    const d = dung()
    const kq = await Promise.all([chay(d, SAU), chay(d, SAU), chay(d, SAU)])
    expect(kq.filter((x) => x.chay)).toHaveLength(1)
    expect(kq.filter((x) => x.lyDo === 'dang_chay')).toHaveLength(2)
  })
})

describe('đóng băng, mocReset, cron', () => {
  it('đóng băng CHỈ khi job giữ khoá (không phải ngay lúc lên đạn như 21/09); xong thì mở; mocReset = ngày VN lúc lần 2 xong (thắng mốc 21/09)', async () => {
    const d = dung(false)
    expect(await docMocReset(d.env, SAU - 5 * 60_000)).toBe('2026-09-21') // lần 21/09 đã xong
    lenDan(d)
    expect(await dangLamMoi(d.env, SAU)).toBe(false) // đã lên đạn, chưa giành khoá
    await chay(d, SAU)
    expect(await dangLamMoi(d.env, SAU + 31_000)).toBe(true)
    expect(await cronResetHoa2(d.env, SAU + 61_000)).toBe(true) // đang làm ⇒ việc cron khác nghỉ lượt này
    const { cuoi, cuoiLuc } = await chayHet(d, SAU + 2 * 61_000)
    expect(cuoi.trangThai!.trangThai).toBe('xong')
    expect(await dangLamMoi(d.env, cuoiLuc + 1000)).toBe(false)
    expect(await docMocReset(d.env, cuoiLuc + 1000)).toBe(cuoi.trangThai!.mocReset)
    expect(cuoi.trangThai!.mocReset).toBe('2026-09-27')
  })
  it('chưa lên đạn / đã xong: cron chỉ tốn MỘT truy vấn', async () => {
    const d = dung(false)
    const n0 = d.soLenh.prepare
    expect(await cronResetHoa2(d.env, SAU)).toBe(false)
    expect(d.soLenh.prepare - n0).toBe(1)
  })
})

describe('lệnh tay của thầy', () => {
  it('/reset-hoa2/chay-thu = dryRun; /reset-hoa2/trang-thai = cờ, hạn, khoá, ca mở; lệnh lạ ⇒ ok:false; đều CHỈ ĐỌC', async () => {
    const d = dung()
    moCa(d, 'CA-DANG-THI')
    const truoc = bamTatCa(d, bangHienCo(d))
    expect(await xuLyLenhResetHoa2(d.env, '/reset-hoa2/chay-thu', SAU)).toMatchObject({ ok: true, dryRun: true, hoan: { caDangMo: ['CA-DANG-THI'] } })
    const tt = await xuLyLenhResetHoa2(d.env, '/reset-hoa2/trang-thai', SAU)
    expect(tt).toMatchObject({ ok: true, choPhep: true, huy: false, lenDanLuc: LEN_DAN, khoa: null, hoan: { caDangMo: ['CA-DANG-THI'] } })
    expect(String(tt.tomTat)).toMatch(/HOÃN/)
    expect(await xuLyLenhResetHoa2(d.env, '/reset-hoa2/xoa-het', SAU)).toMatchObject({ ok: false })
    expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
    expect(await kiemCaDangMo(d.env)).toMatchObject({ caDangMo: ['CA-DANG-THI'] })
  })
  it('index.ts: lệnh /reset-hoa2/* nằm SAU cổng mã bí mật; cron gọi lần 2 SAU job 21/09', () => {
    const nguon = readFileSync('server/src/index.ts', 'utf8')
    const cong = nguon.indexOf("if (!laThay(req, env, b)) return ra({ ok: false, error: 'Sai mã bí mật' }, 403)")
    const lenh = nguon.indexOf("if (p.startsWith('/reset-hoa2/')) return ra(await xuLyLenhResetHoa2(env, p, Date.now()))")
    expect(cong).toBeGreaterThan(0)
    expect(lenh).toBeGreaterThan(cong)
    const cron21 = nguon.indexOf('if(dangReset)return')
    const cronHoa2 = nguon.indexOf('if(await cronResetHoa2(env,Date.now())')
    expect(cron21).toBeGreaterThan(0)
    expect(cronHoa2).toBeGreaterThan(cron21)
    expect(cronHoa2).toBeLessThan(nguon.indexOf("if(event.cron==='1 17 * * *')"))
  })
})

describe('sổ + hồ sơ sau khi xoá ca: sự kiện `thi` của ca bị xoá vẫn "đã công bố" và vẫn vào hồ sơ', () => {
  const NGAY_CU = Date.parse('2026-09-24T03:00:00.000Z')
  const BAY_GIO = Date.parse('2026-09-27T14:00:00.000Z')
  const cauKho = (qid: string) => ({
    qid, maDe: 'x', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Đề ${qid}`, choices: ['A', 'B', 'C', 'D'], ideas: [], hinhAnh: [], dang: 'ES.A.X', tenDang: 'Dạng', mucDo: 'biet', sao: 2,
    kienThuc: ['K1'], correct: 'B', solution: 'Giải', reviewed: true,
  })
  function themCau(d: D1That, maDe: string, cau: string[]) {
    d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?, '12',?,?,0, 'v1')").run(maDe, maDe, cau.length, `kho/${maDe}.json`)
    d.sql.prepare('INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)').run(maDe, 'v1', 'x')
    for (const q of cau) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(maDe, q, 'v1', `g-${q}`, 'ES.A.X', JSON.stringify({ ...cauKho(q), maDe }))
  }
  const sk = (qid: string, ketQua: 0 | 1, luc: number, nguon: 'btvn' | 'thi', maNguon: string, lan = 1) => ({ nguon, maNguon, sbd: 'S1', qid, lan, ketQua, luc: iso(luc), maDang: 'ES.A.X' as string | null })
  const boCapNhat = (d: D1That, t: string) => (d.sql.prepare(`SELECT * FROM "${t}" ORDER BY khoa`).all() as Record<string, unknown>[]).map(({ cap_nhat_luc, ...con }) => con)

  it('ca ĐÃ công bố và ca CHƯA công bố (đã đóng) đều bị xoá: hồ sơ dựng lại từ sổ y nguyên, bằng chứng game + Game Hóa 2.0 thấy câu thi, câu từng sai nay đúng được "lên bậc"', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em','12','mk-cu','x')").run()
    themCau(d, 'DE-OK', ['OK1', 'THI1', 'THI2'])
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cong_bo,loai,lop,cap_nhat_luc) VALUES('CA-DA-CB','Đã công bố','dong','ngay','thi','12','x')").run()
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cong_bo,loai,lop,cap_nhat_luc) VALUES('CA-CHUA-CB','Chưa công bố','dong','khong','thi','12','x')").run()
    for (const ma of ['CA-DA-CB', 'CA-CHUA-CB']) d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,cap_nhat_luc) VALUES(?,?,'S1',1,'2026-09-24T02:00:00.000Z','2026-09-24T03:00:00.000Z','da_nop','x')").run(`${ma}|S1|1`, ma)
    expect((await ghiSuKien(d.env, [
      sk('OK1', 0, NGAY_CU, 'btvn', 'B-CU-1'),
      sk('THI1', 0, NGAY_CU + 1000, 'thi', 'CA-DA-CB'),
      sk('THI2', 0, NGAY_CU + 2000, 'thi', 'CA-CHUA-CB'),
    ])).ok).toBe(true)
    await dungLaiHoSo(d.env, ['S1'], iso(NGAY_CU + H))
    const hoSoTruoc = { cau: boCapNhat(d, 'nam_kt_cau'), dang: boCapNhat(d, 'nam_kt_dang') }
    expect(hoSoTruoc.cau.map((x) => x.qid).sort()).toEqual(['OK1', 'THI1', 'THI2'])
    const soTruoc = bam(d, 'su_kien_hoc')
    lenDan(d)

    const { cuoi } = await chayHet(d)
    expect(cuoi.trangThai!.trangThai).toBe('xong')
    expect(dem(d, 'ca')).toBe(0)
    expect(dem(d, 'luot')).toBe(0)
    expect(bam(d, 'su_kien_hoc')).toBe(soTruoc) // sổ nguyên từng byte, gồm sự kiện `thi` của hai ca đã xoá
    expect({ cau: boCapNhat(d, 'nam_kt_cau'), dang: boCapNhat(d, 'nam_kt_dang') }).toEqual(hoSoTruoc)

    // Dựng lại hồ sơ từ sổ (như sau mỗi lần nộp): ra đúng hồ sơ cũ, câu thi của ca đã xoá vẫn ở đó.
    await dungLaiHoSo(d.env, ['S1'], iso(BAY_GIO))
    expect({ cau: boCapNhat(d, 'nam_kt_cau'), dang: boCapNhat(d, 'nam_kt_dang') }).toEqual(hoSoTruoc)
    // Bằng chứng của game (game-v2-bank.ts): sự kiện `thi` của ca KHÔNG còn trong bảng `ca` coi là đã công bố.
    const ev = (await readScope(d.env, 'S1')).evidence
    expect(ev.map((e) => e.qid).sort()).toEqual(['OK1', 'THI1', 'THI2'])
    expect(ev.filter((e) => e.qid.startsWith('THI')).every((e) => e.wrong)).toBe(true)
    // Game Hóa 2.0 (srs2-d1.ts `docLanLam`): đọc thẳng sổ (chỉ bỏ `embargoed`), không cần bảng `ca`.
    const lan = await docLanLam(d.env, 'S1', ['THI1', 'THI2'])
    expect(lan.map((x) => x.qid).sort()).toEqual(['THI1', 'THI2'])
    // EXP (exp-d1.ts): sổ cũ trước `tu` không sinh EXP; câu thi từng sai (kể cả của ca chưa công bố đã xoá) nay làm đúng ⇒ "lên bậc".
    expect((await capNhatExp(d.env, 'S1', BAY_GIO)).khoan).toEqual([])
    expect((await ghiSuKien(d.env, [sk('THI1', 1, BAY_GIO - 60_000, 'btvn', 'B-MOI'), sk('THI2', 1, BAY_GIO - 50_000, 'btvn', 'B-MOI')])).ok).toBe(true)
    const moi = await capNhatExp(d.env, 'S1', BAY_GIO)
    expect(moi.khoan.filter((k) => k.loai === 'len_bac').map((k) => k.qid).sort()).toEqual(['THI1', 'THI2'])
  })
})

describe('lên đạn / huỷ qua API (lenhGhiResetHoa2) — thay câu wrangler', () => {
  const { lenhGhiResetHoa2, XAC_NHAN_LEN_DAN_HOA2 } = ResetHoa2
  it('thiếu hoặc sai chuỗi xác nhận ⇒ từ chối, D1 không đổi một byte', async () => {
    const d = dung(false)
    const truoc = bamTatCa(d, bangHienCo(d))
    expect(await lenhGhiResetHoa2(d.env, '/reset-hoa2/len-dan', {}, SAU)).toMatchObject({ ok: false })
    expect(await lenhGhiResetHoa2(d.env, '/reset-hoa2/len-dan', { xacNhan: 'xoa' }, SAU)).toMatchObject({ ok: false })
    expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
  })
  it('có ca thi MỞ ⇒ KHÔNG lên đạn (báo HOÃN + mã ca), cờ không ghi', async () => {
    const d = dung(false)
    moCa(d, 'CA-DANG-THI')
    const r = await lenhGhiResetHoa2(d.env, '/reset-hoa2/len-dan', { xacNhan: XAC_NHAN_LEN_DAN_HOA2 }, SAU)
    expect(r).toMatchObject({ ok: false })
    expect(String(r.error)).toMatch(/HOÃN.*CA-DANG-THI/)
    expect((await trangThaiResetHoa2(d.env, SAU)).choPhep).toBe(false)
  })
  it('đủ điều kiện ⇒ ghi cờ lúc gọi; cron chạy tới xong: bảng XOÁ rỗng, sổ su_kien_hoc giữ nguyên; xong rồi lên đạn lại bị từ chối', async () => {
    const d = dung(false)
    const soTruoc = bam(d, 'su_kien_hoc')
    const r = await lenhGhiResetHoa2(d.env, '/reset-hoa2/len-dan', { xacNhan: XAC_NHAN_LEN_DAN_HOA2 }, LEN_DAN_MS)
    expect(r).toMatchObject({ ok: true, lenDan: true, lenDanLuc: LEN_DAN, hanTuChay: iso(LEN_DAN_MS + CUA_SO_MS) })
    expect((await trangThaiResetHoa2(d.env, SAU)).choPhep).toBe(true)
    const { cuoi } = await chayHet(d)
    expect(cuoi.trangThai?.trangThai).toBe('xong')
    for (const t of BANG_XOA_HOA2) expect(dem(d, t)).toBe(0)
    expect(bam(d, 'su_kien_hoc')).toBe(soTruoc)
    const lai = await lenhGhiResetHoa2(d.env, '/reset-hoa2/len-dan', { xacNhan: XAC_NHAN_LEN_DAN_HOA2 }, SAU + 3 * H)
    expect(lai).toMatchObject({ ok: false })
    expect(String(lai.error)).toMatch(/XONG/)
  })
  it('/reset-hoa2/huy bật cờ huỷ ⇒ lên đạn bị từ chối, cron không làm gì', async () => {
    const d = dung(false)
    expect(await lenhGhiResetHoa2(d.env, '/reset-hoa2/huy', {}, SAU)).toMatchObject({ ok: true, huy: true })
    expect(await lenhGhiResetHoa2(d.env, '/reset-hoa2/len-dan', { xacNhan: XAC_NHAN_LEN_DAN_HOA2 }, SAU)).toMatchObject({ ok: false })
    const truoc = bamTatCa(d, bangHienCo(d))
    expect((await chay(d, SAU + 61_000)).chay).toBe(false)
    expect(bamTatCa(d, bangHienCo(d))).toEqual(truoc)
  })
  it('index.ts: lệnh lên đạn/huỷ nằm SAU cổng mã bí mật', () => {
    const nguon = readFileSync('server/src/index.ts', 'utf8')
    const cong = nguon.indexOf("if (!laThay(req, env, b)) return ra({ ok: false, error: 'Sai mã bí mật' }, 403)")
    const lenh = nguon.indexOf("if (p === '/reset-hoa2/len-dan' || p === '/reset-hoa2/huy') return ra(await lenhGhiResetHoa2(env, p, b, Date.now()))")
    expect(cong).toBeGreaterThan(0)
    expect(lenh).toBeGreaterThan(cong)
  })
})
