// KIỂM CHUỖI MẤT OAN (thầy 02/11: «Kiểm tra xem có học sinh nào làm đủ bị mất chuỗi không? Nếu có khôi phục chuỗi cho học sinh nhé.»)
// CHỈ ĐỌC D1 thật (mọi câu là SELECT, chặn cứng bên dưới) · CHỈ IN SỐ ĐẾM GỘP — repo công khai ⇒ log Actions công khai: KHÔNG in SBD, tên, mã bí mật.
// Hàng kết quả của D1 chỉ nằm trong bộ nhớ tiến trình này (không ghi tệp, không in). Chạy bằng workflow .github/workflows/kiem-chuoi-0211.yml.
//
// Đo gì (14 ngày VN gần nhất, tính tới hết hôm qua):
//   · ĐẠT THEO LUẬT CHUỖI = đúng hàm `ngayDatChuoi` của máy chủ (server/src/chuoi-ngay-bai.ts): từ 28/10 «câu tính mức» (SQL_CAU_TINH_MUC, chỉ sổ su_kien_hoc)
//     ≥ mức đã chốt cuối ngày (goi_bai_7_muc_ngay.muc, chưa chốt ⇒ 6); trước 28/10 ≥ 6 câu hoặc tự sửa xong.
//   · ĐỦ THEO MÀN = (a) số «đã làm hôm nay» như Lộ trình / vòng «Đủ mức» (`docDaLamVaVuaLam7`: sổ ∪ câu học cách giải `goi_bai_7_gap`) ≥ mức cuối ngày,
//     HOẶC (b) máy chủ ĐÃ trả thưởng «đạt mục tiêu ngày» (`vang_so` khoá `tt|<ngày>|muc_tieu` — chỉ ghi khi số đã làm ≥ mức LÚC ĐÓ, tức em đã thấy «Đủ x/y»).
//   · OAN = đủ theo màn mà luật chuỗi không tính. Mô phỏng lại chuỗi bằng CHÍNH `chuoiNgayCuaEm` hai lần (như hiện tại / coi ngày oan là ngày đạt) ⇒
//     chuỗi đứt oan, bình tiêu oan, chuỗi lẽ ra có. Thêm: mô phỏng cách khôi phục (hạ mức ngày oan xuống số câu em đã làm) để soát trước khi ghi.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import {
  canMucNgay, chuoiNgayCuaEm, ngayDatChuoi, ngayVn, CAU_MOT_BAI, NGAY_CHUOI_DU_MUC, SO_NGAY_DOC, SQL_CAU_TINH_MUC, SQL_CO_KET_QUA_HOAC_LUOT, SQL_COT_BINH_MUA,
  type ChuoiNgay, type KieuNgay, type NhatKyChuoi,
} from '../server/src/chuoi-ngay-bai'
import { laNgayBaoTri } from '../server/src/ngay-bao-tri'

type Row = Record<string, unknown>
const NGAY = 86_400_000
const cong = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * NGAY).toISOString().slice(0, 10)
const dauNgayIso = (d: string) => new Date(Date.parse(`${d}T00:00:00+07:00`)).toISOString()
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v))
const num = (v: unknown) => Number(v) || 0

const homNay = /^\d{4}-\d{2}-\d{2}$/.test(process.env.HOM_NAY ?? '') ? process.env.HOM_NAY! : ngayVn(Date.now())
const den = cong(homNay, -1)
const tu = cong(homNay, -14)
const tuDoc = cong(homNay, -SO_NGAY_DOC)
const tuIso = dauNgayIso(cong(tuDoc, -1))
const tu14Iso = dauNgayIso(tu)
const cacNgay = Array.from({ length: 14 }, (_, i) => cong(tu, i))

// ───── Chạy SELECT trên D1 thật (wrangler, --remote). Hàng trả về KHÔNG in ra.
const CAM = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|TRUNCATE|PRAGMA|ATTACH|VACUUM)\b/i
function chon(ten: string, sql: string, tuyChon = false): Row[] {
  const goc = sql.replace(/'[^']*'/g, "''") // bỏ chuỗi hằng rồi mới soát từ khoá
  if (!/^\s*(SELECT|WITH)\b/i.test(sql) || CAM.test(goc) || /;\s*\S/.test(goc)) throw new Error(`[${ten}] không phải một câu SELECT — dừng.`)
  if (process.env.KHO_GIA) return docKhoGia(ten)
  try {
    const ra = execFileSync('npx', ['-y', 'wrangler@4', 'd1', 'execute', 'omr', '--remote', '--json', '--command', sql.replace(/\s+/g, ' ')], {
      cwd: process.env.THU_MUC_WRANGLER ?? 'server', encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    })
    // stdout của --json là một mảng JSON; phòng dòng cảnh báo lọt vào (vd «▲ [WARNING]») ⇒ lấy từ dòng đầu tiên BẮT ĐẦU bằng «[».
    const dau = ra.search(/^\[/m)
    const j = JSON.parse(ra.slice(Math.max(0, dau), ra.lastIndexOf(']') + 1)) as { results?: Row[]; success?: boolean }[]
    const kq = j[0]?.results ?? []
    console.log(`  · đọc ${ten}: ${kq.length} hàng`)
    return kq
  } catch (e) {
    // Lỗi: chỉ in vài dòng cuối của stderr (thông báo wrangler / D1, không có hàng dữ liệu).
    const err = str((e as { stderr?: unknown }).stderr).split('\n').filter(Boolean).slice(-4).join(' | ').slice(0, 400)
    console.log(`  · đọc ${ten}: LỖI ${err || (e as Error).message.slice(0, 200)}`)
    if (tuyChon) return []
    throw new Error(`Không đọc được ${ten}`)
  }
}
// Thử tại máy bằng dữ liệu giả (không chạm D1): KHO_GIA=<tệp json {tên: hàng[]}>.
function docKhoGia(ten: string): Row[] {
  const kho = JSON.parse(readFileSync(process.env.KHO_GIA!, 'utf8')) as Record<string, Row[]>
  return kho[ten] ?? []
}

// Điều kiện «câu tính mức» cho dòng sổ (bảng su_kien_hoc không bí danh) — y như chuỗi (SQL_CAU_TINH_MUC + có kết quả hoặc lượt lướt của chặng).
const CAU_TINH = `${SQL_CO_KET_QUA_HOAC_LUOT} AND ${SQL_CAU_TINH_MUC}`

console.log(`KIỂM CHUỖI MẤT OAN — chỉ đọc · hôm nay (VN) ${homNay} · xét ${tu} → ${den} · mốc luật đủ mức ${NGAY_CHUOI_DU_MUC}`)
const co = chon('co', "SELECT gia_tri AS g FROM cau_hinh WHERE khoa = 'duolingo_bai'", true)[0]
const coJ = (() => { try { return JSON.parse(str(co?.g) || '{}') as { cheDo?: string; lop?: unknown[] } } catch { return {} } })()
const so = chon('so', `SELECT sbd AS s, ngay_vn AS n, COUNT(DISTINCT CASE WHEN ket_qua IS NOT NULL THEN qid END) AS c,
    COUNT(DISTINCT CASE WHEN ngay_vn >= '${tu}' AND ${SQL_CAU_TINH_MUC} THEN qid END) AS c7,
    MIN(CASE WHEN ngay_vn >= '${tu}' AND ${SQL_CAU_TINH_MUC} THEN luc END) AS dau
  FROM su_kien_hoc WHERE ngay_vn >= '${tuDoc}' AND ngay_vn <= '${homNay}' AND ${SQL_CO_KET_QUA_HOAC_LUOT} GROUP BY sbd, ngay_vn`)
const sua = chon('sua', `SELECT DISTINCT sbd AS s, date(dong_luc, '+7 hours') AS n FROM chua_loi_dot WHERE trang_thai_day = 'da_tu_sua' AND dong_luc >= '${tuIso}'`, true)
const phep = chon('phep', `SELECT DISTINCT d.sbd AS s, date(b.mo_luc, '+7 hours') AS n FROM buoi_hoc_diem_danh d JOIN buoi_hoc b ON b.id = d.buoi_id
  WHERE d.trang_thai = 'co_phep' AND b.mo_luc >= '${tuIso}'`, true)
// SQL_COT_BINH_MUA cho cột n (ngày), s (số bình), r (có đặt lại) ⇒ SBD đặt bí danh `em` cho khỏi trùng.
const mua = chon('mua', `SELECT m.sbd AS em, ${SQL_COT_BINH_MUA} FROM chuoi_binh_mua m WHERE m.luc >= '${tuIso}' GROUP BY m.sbd, n`, true)
const muc = chon('muc', `SELECT sbd AS s, ngay AS n, muc AS m, luc AS l FROM goi_bai_7_muc_ngay WHERE ngay >= '${tu}' AND ngay <= '${homNay}'`)
const gap = chon('gap', `SELECT g.sbd AS s, date(g.luc, '+7 hours') AS n, COUNT(DISTINCT g.qid) AS k FROM goi_bai_7_gap g WHERE g.luc >= '${tu14Iso}'
  AND NOT EXISTS (SELECT 1 FROM su_kien_hoc WHERE su_kien_hoc.sbd = g.sbd AND su_kien_hoc.ngay_vn = date(g.luc, '+7 hours') AND su_kien_hoc.qid = g.qid AND ${CAU_TINH})
  GROUP BY g.sbd, n`, true)
const thuong = chon('thuong', `SELECT sbd AS s, substr(khoa_yeu_cau, 4, 10) AS n, MIN(luc) AS l FROM vang_so
  WHERE khoa_yeu_cau >= 'tt|${tu}' AND khoa_yeu_cau < 'tt|${homNay}' AND khoa_yeu_cau LIKE 'tt|%|muc_tieu' GROUP BY sbd, n`, true)
// Lượt trả lời (máy chủ đã chấm) mà sổ học KHÔNG có dòng nào cùng câu cùng ngày — dấu hiệu ghi nền (waitUntil) bị rơi. Chỉ để chẩn đoán.
const vua = chon('vua', `SELECT a.sbd AS s, date(a.created_at, '+7 hours') AS n, COUNT(DISTINCT a.qid) AS k FROM game_v2_attempt a WHERE a.created_at >= '${tu14Iso}'
  AND COALESCE(json_extract(a.json, '$.omni.luot'), 0) <> 1
  AND NOT EXISTS (SELECT 1 FROM su_kien_hoc s WHERE s.sbd = a.sbd AND s.qid = a.qid AND s.ngay_vn = date(a.created_at, '+7 hours')) GROUP BY a.sbd, n`, true)
// Múi giờ: dòng sổ có ngày VN ghi lệch với giờ ghi (+7).
const lech = chon('lech', `SELECT COUNT(*) AS d, COUNT(DISTINCT sbd || '|' || ngay_vn) AS e FROM su_kien_hoc WHERE ngay_vn >= '${tu}' AND ngay_vn <= '${den}'
  AND luc LIKE '____-__-__T%' AND ngay_vn <> date(luc, '+7 hours')`, true)[0]
// Sự kiện làm mức hôm nay bị XOÁ rồi chốt lại (giao bài mới #708 / sửa hạn / sửa danh sách em) theo ngày VN — chỉ số đếm.
const suKien = chon('su_kien', `SELECT 'goi_moi' AS k, date(tao_luc, '+7 hours') AS n, COUNT(*) AS c FROM goi_bai_7 WHERE tao_luc >= '${tu14Iso}' GROUP BY n
  UNION ALL SELECT 'sua_han', date(luc, '+7 hours'), COUNT(*) FROM goi_bai_7_sua_han WHERE luc >= '${tu14Iso}' GROUP BY 2
  UNION ALL SELECT 'sua_em', date(luc, '+7 hours'), COUNT(*) FROM goi_bai_7_sua_em WHERE luc >= '${tu14Iso}' GROUP BY 2`, true)

// ───── Gom theo em (khoá = SBD, chỉ trong bộ nhớ).
interface Em { soCau: Map<string, number>; soCau7: Map<string, number>; c7: Map<string, number>; dau: Map<string, string>; tuSua: Set<string>; phep: Set<string>
  mua: Map<string, number>; datLai: Set<string>; muc: Map<string, { m: number; l: string }>; gap: Map<string, number>; thuong: Map<string, string>; vua: Map<string, number> }
const ds = new Map<string, Em>()
const em = (s: unknown): Em => {
  const k = str(s)
  let e = ds.get(k)
  if (!e) ds.set(k, e = { soCau: new Map(), soCau7: new Map(), c7: new Map(), dau: new Map(), tuSua: new Set(), phep: new Set(), mua: new Map(), datLai: new Set(), muc: new Map(), gap: new Map(), thuong: new Map(), vua: new Map() })
  return e
}
for (const r of so) { const e = em(r.s), n = str(r.n); e.soCau.set(n, num(r.c)); e.c7.set(n, num(r.c7)); if (n >= NGAY_CHUOI_DU_MUC) e.soCau7.set(n, num(r.c7)); if (r.dau) e.dau.set(n, str(r.dau)) }
for (const r of sua) em(r.s).tuSua.add(str(r.n))
for (const r of phep) em(r.s).phep.add(str(r.n))
for (const r of mua) { const e = em(r.em), n = str(r.n); if (num(r.s)) e.mua.set(n, num(r.s)); if (num(r.r) === 1) e.datLai.add(n) }
for (const r of muc) if (num(r.m) > 0) em(r.s).muc.set(str(r.n), { m: num(r.m), l: str(r.l) })
for (const r of gap) em(r.s).gap.set(str(r.n), num(r.k))
for (const r of thuong) em(r.s).thuong.set(str(r.n), str(r.l))
for (const r of vua) em(r.s).vua.set(str(r.n), num(r.k))

const nhatKy = (e: Em, them?: (d: string) => { soCau7?: number; soCau?: number; muc?: number } | null): NhatKyChuoi => {
  const nk: NhatKyChuoi = {
    soCau: new Map(e.soCau), tuSua: e.tuSua, phep: e.phep, mua: e.mua, datLai: e.datLai, soCau7: new Map(e.soCau7),
    muc: new Map([...e.muc].filter(([n]) => n >= NGAY_CHUOI_DU_MUC).map(([n, v]) => [n, v.m] as const)),
  }
  if (them) for (const d of cacNgay) {
    const x = them(d)
    if (!x) continue
    if (x.soCau !== undefined) (nk.soCau as Map<string, number>).set(d, x.soCau)
    if (x.soCau7 !== undefined) (nk.soCau7 as Map<string, number>).set(d, x.soCau7)
    if (x.muc !== undefined) (nk.muc as Map<string, number>).set(d, x.muc)
  }
  return nk
}

// ───── Xét từng em-ngày.
type NguyenNhan = 'gap' | 'chot_lai' | 'khac'
interface Dem { datLuat: number; duMan: number; thuong: number; oan: number; kieu: Partial<Record<KieuNgay, number>>; nn: Record<NguyenNhan, number>; ngoaiLuat: number; neuGhiDu: number; chotLai: number }
const theoNgay = new Map(cacNgay.map((d) => [d, { datLuat: 0, duMan: 0, thuong: 0, oan: 0, kieu: {}, nn: { gap: 0, chot_lai: 0, khac: 0 }, ngoaiLuat: 0, neuGhiDu: 0, chotLai: 0 } as Dem]))
let coSo14 = 0, emOan = 0, emThapHon = 0, emVe01 = 0, tongChenh = 0, emMatBinh = 0, viPham = 0, khoiPhucDung = 0, khoiPhucThieu = 0, ngayKhongHaDuoc = 0
const loLeRa: number[] = [], loHienTai: number[] = []
const chu = (k: Partial<Record<KieuNgay, number>>) => Object.entries(k).map(([a, b]) => `${a} ${b}`).join(' · ') || '—'

for (const e of ds.values()) {
  if (!cacNgay.some((d) => e.soCau.has(d) || e.gap.has(d) || e.thuong.has(d))) continue
  coSo14++
  const nk = nhatKy(e)
  const hien: ChuoiNgay = chuoiNgayCuaEm(nk, homNay, true)
  const kieuNgay = new Map((hien.lich30 ?? []).map((x) => [x.ngay, x.kieu] as const))
  const oan = new Set<string>()
  for (const d of cacNgay) {
    const t = theoNgay.get(d)!
    const mucCuoi = e.muc.get(d)?.m ?? null
    const can = d >= NGAY_CHUOI_DU_MUC ? canMucNgay(nk, d) : Math.max(1, mucCuoi ?? CAU_MOT_BAI)
    const c7 = e.c7.get(d) ?? 0, g = e.gap.get(d) ?? 0
    const datLuat = ngayDatChuoi(nk, d)
    const duCuoi = c7 + g >= can
    const coThuong = e.thuong.has(d)
    const duMan = duCuoi || coThuong
    if (datLuat) t.datLuat++
    if (duMan) t.duMan++
    if (coThuong) t.thuong++
    // Mức bị chốt lại SAU khi em đã bắt đầu làm trong ngày (dòng mức bị xoá rồi ghi mới — giao bài mới / sửa hạn / sửa danh sách em).
    const mucL = e.muc.get(d)?.l ?? '', dau = e.dau.get(d) ?? ''
    const chotLai = !!mucL && !!dau && mucL > dau
    if (chotLai) t.chotLai++
    if (!datLuat && !duMan && (e.soCau.get(d) ?? 0) >= can) t.ngoaiLuat++ // đủ nếu tính cả câu Sửa lỗi / Tự luyện / Kiểm tra (luật thầy không tính)
    if (!datLuat && !duMan && c7 + g + (e.vua.get(d) ?? 0) >= can) t.neuGhiDu++
    if (!duMan || datLuat) continue
    oan.add(d)
    t.oan++
    const k = kieuNgay.get(d) ?? (laNgayBaoTri(d) ? 'phep' : 'tat')
    t.kieu[k] = (t.kieu[k] ?? 0) + 1
    // Nguyên nhân: «gap» = cuối ngày chỉ đủ khi cộng câu học cách giải (màn đếm, chuỗi không) · «chốt lại» = em đã nhận thưởng đạt mục tiêu rồi mức bị
    // chốt lại cao hơn (dòng mức ghi SAU lúc thưởng, hoặc sau câu đầu tiên trong ngày) · «khác» = còn lại.
    const thuongL = e.thuong.get(d) ?? ''
    const nn: NguyenNhan = c7 < can && c7 + g >= can ? 'gap' : coThuong && !duCuoi && (chotLai || (!!mucL && !!thuongL && mucL > thuongL)) ? 'chot_lai' : 'khac'
    t.nn[nn]++
  }
  if (!oan.size) { loHienTai.push(hien.so); loLeRa.push(hien.so); continue }
  emOan++
  // Chuỗi lẽ ra có: coi ngày oan là ngày đạt (đủ mức).
  const leRa = chuoiNgayCuaEm(nhatKy(e, (d) => (!oan.has(d) ? null : d >= NGAY_CHUOI_DU_MUC ? { soCau7: Math.max(e.soCau7.get(d) ?? 0, canMucNgay(nk, d)) } : { soCau: Math.max(e.soCau.get(d) ?? 0, CAU_MOT_BAI) })), homNay, true)
  // Cách khôi phục đã soạn (scripts/khoi-phuc-chuoi-0211.sql): ngày oan từ mốc 28/10 có dòng mức ⇒ hạ mức xuống đúng số câu luật chuỗi đếm (≥ 1).
  const khoiPhuc = chuoiNgayCuaEm(nhatKy(e, (d) => {
    if (!oan.has(d)) return null
    const c7 = e.c7.get(d) ?? 0
    if (d < NGAY_CHUOI_DU_MUC) { ngayKhongHaDuoc++; return null }
    if (!e.muc.has(d) || c7 < 1) { ngayKhongHaDuoc++; return null }
    return { muc: Math.min(e.muc.get(d)!.m, c7) }
  }), homNay, true)
  loHienTai.push(hien.so); loLeRa.push(leRa.so)
  if (leRa.so < hien.so) viPham++
  if (leRa.so > hien.so) { emThapHon++; tongChenh += leRa.so - hien.so; if (hien.so <= 1) emVe01++ }
  if (leRa.giuChuoi > hien.giuChuoi) emMatBinh++
  if (leRa.so > hien.so || leRa.giuChuoi > hien.giuChuoi) { if (khoiPhuc.so === leRa.so && khoiPhuc.giuChuoi === leRa.giuChuoi) khoiPhucDung++; else khoiPhucThieu++ }
}

const nhom = (xs: number[]) => {
  const b = { '0': 0, '1': 0, '2–3': 0, '4–7': 0, '8–14': 0, '15+': 0 }
  for (const x of xs) b[x <= 0 ? '0' : x === 1 ? '1' : x <= 3 ? '2–3' : x <= 7 ? '4–7' : x <= 14 ? '8–14' : '15+']++
  return Object.entries(b).map(([k, v]) => `${k}: ${v}`).join(' · ')
}
console.log('')
console.log(`Cờ chuỗi theo bài (duolingo_bai): ${str(coJ.cheDo) || 'vắng'}${Array.isArray(coJ.lop) ? ` · ${coJ.lop.length} lớp` : ''}`)
console.log(`Em có học trong 14 ngày: ${coSo14} · em có ≥ 1 ngày ĐỦ THEO MÀN mà luật chuỗi KHÔNG tính: ${emOan}`)
console.log(`Múi giờ: dòng sổ ghi ngày VN lệch giờ ghi (+7): ${num(lech?.d)} dòng / ${num(lech?.e)} em-ngày`)
console.log('')
console.log('Theo ngày — đạt luật | đủ theo màn | có thưởng «đạt mục tiêu» | OAN (lịch chuỗi ngày đó) [nguyên nhân] | mức chốt lại sau khi em bắt đầu | đủ nếu tính cả Sửa lỗi/Tự luyện/KT | đủ nếu cộng lượt sổ thiếu')
for (const d of cacNgay) {
  const t = theoNgay.get(d)!
  console.log(`  ${d}${laNgayBaoTri(d) ? ' (bảo trì)' : ''}${d < NGAY_CHUOI_DU_MUC ? ' (luật cũ)' : ''}: ${t.datLuat} | ${t.duMan} | ${t.thuong} | OAN ${t.oan} (${chu(t.kieu)}) [gap ${t.nn.gap} · chốt lại ${t.nn.chot_lai} · khác ${t.nn.khac}] | ${t.chotLai} | ${t.ngoaiLuat} | ${t.neuGhiDu}`)
}
const sk = new Map<string, string[]>()
for (const r of suKien) { const n = str(r.n); if (!sk.has(n)) sk.set(n, []); sk.get(n)!.push(`${str(r.k)} ${num(r.c)}`) }
console.log('')
console.log(`Sự kiện xoá + chốt lại mức hôm nay (gói mới / sửa hạn / sửa danh sách em): ${[...sk].sort().map(([n, x]) => `${n}: ${x.join(', ')}`).join(' · ') || '—'}`)
console.log('')
console.log(`CHUỖI HIỆN TẠI (tính lúc ${homNay}) so với LẼ RA CÓ:`)
console.log(`  em chuỗi thấp hơn lẽ ra: ${emThapHon} (đang 0 hoặc 1: ${emVe01}) · tổng số ngày chuỗi thiếu: ${tongChenh}`)
console.log(`  em bị tiêu bình oan (lẽ ra còn nhiều bình hơn): ${emMatBinh}`)
console.log(`  phân bố chuỗi hiện tại: ${nhom(loHienTai)}`)
console.log(`  phân bố chuỗi lẽ ra có:  ${nhom(loLeRa)}`)
console.log(`  kiểm đơn điệu (lẽ ra < hiện tại — phải 0): ${viPham}`)
console.log(`  mô phỏng khôi phục (hạ mức ngày oan về số câu luật đếm): khớp lẽ ra ${khoiPhucDung} em · chưa khớp ${khoiPhucThieu} em · ngày oan không hạ được (không dòng mức / 0 câu) ${ngayKhongHaDuoc}`)
