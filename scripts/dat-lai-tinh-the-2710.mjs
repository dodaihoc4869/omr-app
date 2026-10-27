// ĐẶT SỐ DƯ TINH THỂ CỦA MỌI EM VỀ ĐÚNG 50 (thầy DUYỆT 27/10: «Đưa tất cả tinh thể về 0» rồi «Để lại cho mỗi bạn 50 tinh thể»). Chạy bằng workflow
// dat-lai-tinh-the-2710.yml (workflow_dispatch), KHÔNG chạy từ máy local. Log chỉ in TỔNG (repo công khai); số dư từng em (mã HS + số dư, không tên)
// ghi vào tệp BAN_SAO ⇒ workflow tải lên artifact để khôi phục được.
//
// Chỉ-THÊM vào sổ `vang_so` (không UPDATE / DELETE sổ): mỗi em lệch 50 một dòng điều chỉnh, ma_mon 'tt-reset-50-2710', khoá 'tt|reset-50-2710'
// (UNIQUE(sbd, khoa) ⇒ chạy lại không ghi đôi). MỘT câu INSERT…SELECT tính số dư NGAY LÚC GHI ⇒ đúng 50 kể cả em vừa kiếm thêm; dòng điều chỉnh
// = 50 − số dư cũ ⇒ chính nó là bản sao chính xác (số dư cũ = 50 − so_vang).
//   · em > 50 ⇒ loai 'mua', số âm; em < 50 (kể cả em chưa có dòng nào) ⇒ loai 'doi', số dương. Tập em = hoc_sinh ∪ em có dòng sổ.
// Cược chuỗi đang chạy (stake 50 đã trừ từ tinh thể CŨ): đóng lại (trang_thai 'thua', CHECK chỉ cho dang/thang/thua — không đổi lược đồ), KHÔNG hoàn
// tinh thể cũ, KHÔNG trả 100 ⇒ không cộng ngược tinh thể cũ, không âm. Thông báo một lần 'dat_lai_tt' cho mọi em (conLai 50, cuocHuy).
// Cổng: có ca thi mở ⇒ DỪNG; Worker sống chưa có commit `MOC_LUAT` ⇒ DỪNG. Đối chiếu sau: mọi em = 50 tại lúc ghi, tổng = 50 × số em, 0 em âm,
// dòng sổ cũ không đổi, nguyên tử / bình / Kim cương / huy hiệu không đổi.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const token = process.env.CLOUDFLARE_API_TOKEN
const account = process.env.CLOUDFLARE_ACCOUNT_ID
const MOC_LUAT = process.env.MOC_LUAT ?? ''
const GHI = process.env.GHI === 'ghi'
const BAN_SAO = process.env.BAN_SAO || 'ban-sao-tinh-the/so-du-truoc-2710.json'
if (!token || !account) throw new Error('Thiếu cấu hình Cloudflare.')
if (!/^[a-f0-9]{7,40}$/.test(MOC_LUAT)) throw new Error('Thiếu commit cần có trên bản sống (MOC_LUAT).')
export const MUC = 50
export const MA_MON = 'tt-reset-50-2710'
export const KHOA = 'tt|reset-50-2710'
export const MA_TB = 'dat_lai_tt|2710'
const DB = 'd2e6d322-374a-45d7-83a3-9fac486b23f1'

async function goi(sql, params = []) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${DB}/query`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ sql, params }), signal: AbortSignal.timeout(60000),
  })
  const j = await r.json()
  if (!r.ok || !j.success || j.result?.some((x) => !x.success)) throw new Error(`D1 lỗi (${r.status}): ${(j.errors ?? []).map((e) => e.message).join('; ').slice(0, 200)}`)
  return j.result?.[0] ?? { results: [], meta: {} }
}
const query = async (sql, params) => (await goi(sql, params)).results ?? []
async function cf(path) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/${path}`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000) })
  const j = await r.json()
  if (!r.ok || !j.success || !j.result) throw new Error(`Chưa đọc được Cloudflare (${r.status}).`)
  return j.result
}
const log = (o) => console.log(JSON.stringify(o))
const n = (x) => Number(x) || 0

// (1) Ca thi mở ⇒ dừng.
const ca = (await query(readFileSync('scripts/kiem-ca-mo.sql', 'utf8').replace(/--[^\n]*/g, ' ')))[0] ?? {}
log({ buoc: 'ca_thi', soCaMo: ca.so_ca_mo, soLuotDangLam: ca.so_luot_dang_lam })
if (ca.so_ca_mo !== 0 || ca.so_luot_dang_lam !== 0) throw new Error('Có ca thi mở: DỪNG, chưa đặt lại tinh thể.')

// (2) Bản sống chứa commit cần có.
const dep = await cf('workers/scripts/omr/deployments')
const ban = (dep.deployments ?? [])[0]?.versions
if (!ban?.length || ban.length !== 1 || ban[0].percentage !== 100) throw new Error('Worker chưa chạy một bản 100%.')
const ver = await cf(`workers/scripts/omr/versions/${ban[0].version_id}`)
const the = (ver.annotations ?? ver.metadata?.annotations)?.['workers/tag']
if (typeof the !== 'string' || !/^[a-f0-9]{40}$/.test(the)) throw new Error('Bản Worker sống không có thẻ commit.')
try { execFileSync('git', ['merge-base', '--is-ancestor', MOC_LUAT, the]) } catch { throw new Error('Worker sống CHƯA có commit cần có — dừng (chạy lại sau khi deploy xanh).') }
log({ buoc: 'ban_song', coCommit: true })

const TAP_EM = 'SELECT sbd FROM hoc_sinh UNION SELECT sbd FROM vang_so'
async function doiChieu() {
  const [t, e, b, k, h, c, dong] = await Promise.all([
    query(`SELECT COUNT(*) AS so_em, COALESCE(SUM(COALESCE(v.s, 0)), 0) AS tong, COALESCE(SUM(CASE WHEN COALESCE(v.s, 0) < 0 THEN 1 ELSE 0 END), 0) AS am,
        COALESCE(SUM(CASE WHEN COALESCE(v.s, 0) <> ${MUC} THEN 1 ELSE 0 END), 0) AS lech FROM (${TAP_EM}) x LEFT JOIN (SELECT sbd, SUM(so_vang) AS s FROM vang_so GROUP BY sbd) v ON v.sbd = x.sbd`),
    query('SELECT COUNT(*) AS n, COALESCE(SUM(exp), 0) AS s FROM exp_so'),
    query('SELECT COUNT(*) AS n, COALESCE(SUM(so), 0) AS s FROM chuoi_binh_mua').catch(() => [{ n: 0, s: 0 }]),
    query("SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN ket_qua = 'dat' THEN 1 ELSE 0 END), 0) AS dat FROM kim_cuong_phien").catch(() => [{ n: 0, dat: 0 }]),
    query("SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN ma LIKE 'kc|%' THEN 1 ELSE 0 END), 0) AS kc FROM huy_hieu_em").catch(() => [{ n: 0, kc: 0 }]),
    query("SELECT COUNT(*) AS n FROM cuoc_chuoi WHERE trang_thai = 'dang'").catch(() => [{ n: 0 }]),
    query('SELECT COUNT(*) AS n, COALESCE(SUM(so_vang), 0) AS s, COALESCE(MAX(id), 0) AS m FROM vang_so'),
  ])
  return {
    soEm: n(t[0]?.so_em), tongTinhThe: n(t[0]?.tong), soEmAm: n(t[0]?.am), soEmKhac50: n(t[0]?.lech),
    nguyenTu: { dong: n(e[0]?.n), tong: n(e[0]?.s) }, binh: { dong: n(b[0]?.n), tong: n(b[0]?.s) },
    kimCuong: { phien: n(k[0]?.n), dat: n(k[0]?.dat), huyHieuKc: n(h[0]?.kc) }, huyHieu: n(h[0]?.n), cuocDang: n(c[0]?.n),
    so: { dong: n(dong[0]?.n), tong: n(dong[0]?.s), maxId: n(dong[0]?.m) },
  }
}

const daChay = n((await query('SELECT COUNT(*) AS n FROM vang_so WHERE khoa_yeu_cau = ?', [KHOA]))[0]?.n)
const truoc = await doiChieu()
// Bản sao số dư từng em (mã HS + số dư; không tên) — vào artifact, KHÔNG in ra log.
const soDu = await query(`SELECT x.sbd AS sbd, COALESCE(v.s, 0) AS so_du FROM (${TAP_EM}) x LEFT JOIN (SELECT sbd, SUM(so_vang) AS s FROM vang_so GROUP BY sbd) v ON v.sbd = x.sbd ORDER BY x.sbd`)
const MOC = new Date().toISOString()
mkdirSync(dirname(BAN_SAO), { recursive: true })
writeFileSync(BAN_SAO, JSON.stringify({ moc: MOC, muc: MUC, maMon: MA_MON, khoa: KHOA, ghiChu: 'số dư TRƯỚC khi đặt lại; số dư chính xác lúc ghi = 50 − so_vang của dòng khoá tt|reset-50-2710', soDu }, null, 0))
log({ buoc: 'truoc', moc: MOC, daChayTruoc: daChay, ...truoc, banSao: { soEm: soDu.length } })

if (!GHI) { log({ buoc: 'chi_dem', ghi: false }); process.exit(0) }

// (3) Đóng cược đang chạy (không hoàn tinh thể cũ, không trả thưởng). Lấy danh sách em TRƯỚC để ghi vào thông báo.
const emCuoc = (await query("SELECT em FROM cuoc_chuoi WHERE trang_thai = 'dang'").catch(() => [])).map((x) => String(x.em))
const dongCuoc = emCuoc.length ? await goi("UPDATE cuoc_chuoi SET trang_thai = 'thua', xong_luc = ? WHERE trang_thai = 'dang'", [MOC]) : { meta: { changes: 0 } }

// (4) MỘT câu: mỗi em lệch 50 một dòng điều chỉnh (số dư tính ngay lúc ghi).
const ghi = await goi(`INSERT OR IGNORE INTO vang_so (sbd, loai, so_vang, exp_tru, ma_mon, khoa_yeu_cau, luc)
    SELECT x.sbd, CASE WHEN ${MUC} - COALESCE(v.s, 0) > 0 THEN 'doi' ELSE 'mua' END, ${MUC} - COALESCE(v.s, 0), 0, ?, ?, ?
    FROM (${TAP_EM}) x LEFT JOIN (SELECT sbd, SUM(so_vang) AS s FROM vang_so GROUP BY sbd) v ON v.sbd = x.sbd
    WHERE ${MUC} - COALESCE(v.s, 0) <> 0`, [MA_MON, KHOA, MOC])

// (5) Thông báo một lần cho mọi em có hồ sơ.
const tb = await goi(`INSERT OR IGNORE INTO thong_bao_thuong (em, ma, loai, du_lieu, luc)
    SELECT sbd, ?, 'dat_lai_tt', json_object('conLai', ${MUC}, 'cuocHuy', json(CASE WHEN sbd IN (SELECT value FROM json_each(?)) THEN 'true' ELSE 'false' END)), ? FROM hoc_sinh`,
  [MA_TB, JSON.stringify(emCuoc), MOC])

// (6) Đối chiếu. «Tại lúc ghi» = mọi dòng có id ≤ id lớn nhất của các dòng điều chỉnh (một câu ⇒ id liền nhau, dòng ghi chen vào chỉ đứng trước/sau).
const sau = await doiChieu()
const mocId = n((await query('SELECT COALESCE(MAX(id), 0) AS m FROM vang_so WHERE khoa_yeu_cau = ?', [KHOA]))[0]?.m) || truoc.so.maxId
const tai = (await query(`SELECT COUNT(*) AS so_em, COALESCE(SUM(COALESCE(v.s, 0)), 0) AS tong, COALESCE(SUM(CASE WHEN COALESCE(v.s, 0) <> ${MUC} THEN 1 ELSE 0 END), 0) AS lech
    FROM (${TAP_EM}) x LEFT JOIN (SELECT sbd, SUM(so_vang) AS s FROM vang_so WHERE id <= ? GROUP BY sbd) v ON v.sbd = x.sbd`, [mocId]))[0] ?? {}
const cu = (await query('SELECT COUNT(*) AS n, COALESCE(SUM(so_vang), 0) AS s FROM vang_so WHERE id <= ?', [truoc.so.maxId]))[0] ?? {}
const dongCuGiu = n(cu.n) === truoc.so.dong && n(cu.s) === truoc.so.tong
const giu = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const kq = {
  buoc: 'sau', dongDieuChinh: n(ghi.meta?.changes), cuocDong: n(dongCuoc.meta?.changes), thongBao: n(tb.meta?.changes),
  taiLucGhi: { soEm: n(tai.so_em), tongTinhThe: n(tai.tong), soEmKhac50: n(tai.lech), dung50XSoEm: n(tai.tong) === MUC * n(tai.so_em) },
  hienTai: { soEm: sau.soEm, tongTinhThe: sau.tongTinhThe, soEmAm: sau.soEmAm, soEmKhac50: sau.soEmKhac50 },
  dongSoCuGiuNguyen: dongCuGiu,
  nguyenTuGiu: giu(sau.nguyenTu, truoc.nguyenTu), binhGiu: giu(sau.binh, truoc.binh), kimCuongGiu: giu(sau.kimCuong, truoc.kimCuong), cuocDangSau: sau.cuocDang,
}
log(kq)
if (n(tai.lech) !== 0 || sau.soEmAm !== 0) throw new Error('Còn em khác 50 tại lúc ghi / có em âm — kiểm lại.')
if (!dongCuGiu) throw new Error('Dòng sổ cũ bị đổi — kiểm lại ngay.')
