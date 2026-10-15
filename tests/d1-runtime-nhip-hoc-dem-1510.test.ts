// Runtime workerd/D1 cục bộ, dữ liệu tổng hợp; không kết nối production.
// B3 + B5 "máy chủ nhanh hơn giờ cao điểm" (thầy duyệt 15/10) trên RUNTIME D1 thật (Miniflare/workerd):
//   · DDL lúc chạy (bảng đệm + ba trigger có `;` bên trong BEGIN…END) đi qua `DB.batch` của D1; câu `WITH … INSERT OR REPLACE … SELECT` chạy được;
//   · cùng kết quả đường cũ / đường đệm (cờ đối phó từng em), cả sau lượt ghi muộn qua trigger;
//   · ĐO `meta.rows_read` (đúng bộ đếm D1 tính tiền) + thời gian trên sổ cỡ giờ cao điểm 14/10 (~188 nghìn dòng: 300 em × 14 ngày) — trước → sau.
import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import type { Env } from '../server/src/kieu'
import { cacNgay, docDanhSachEm, ngayVnCua } from '../server/src/bai-hang-ngay'
import { NGUONG_THAI_DO as NG } from '../server/src/bai-hang-ngay-kieu'
import { docDoiPhoTho, SQL_GIAY_LO, SQL_LAP_LO } from '../server/src/nhip-hoc'
import { BAN_DEM_DOI_PHO, BANG_DEM_DOI_PHO, SQL_DOC_DEM_DOI_PHO, lapDemDoiPho } from '../server/src/nhip-hoc-dem'
import { ngayTruocCuaChuoi, SO_NGAY_DOC_CHUOI, SQL_SO_CAU_LOP } from '../server/src/thi-dua-hom-nay'
import { themNgay } from '../server/src/ho-so-nam-kt'

const E = env as unknown as Env
type Row = Record<string, unknown>
const VN = (s: string) => Date.parse(`${s}+07:00`)
const NOW = VN('2026-10-14T21:00:00') // giữa giờ cao điểm 14/10
const SO_EM = 300
const LUOT_TB = 45 // lượt / em / ngày (trung bình) ⇒ ~189 nghìn dòng 01–14/10
const SBD = Array.from({ length: SO_EM }, (_, i) => `NH${String(i).padStart(3, '0')}`)
const MOC_ISO = '2026-09-21T05:00:00.000Z'

function hat(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Bọc D1: cộng dồn `meta.rows_read` / `meta.duration` của mọi câu đã chạy. */
function dem(db: Env['DB']) {
  const tong = { rowsRead: 0, ms: 0, cau: 0 }
  const boc = (st: ReturnType<Env['DB']['prepare']>): ReturnType<Env['DB']['prepare']> => new Proxy(st, {
    get(t, p) {
      const v = Reflect.get(t, p) as unknown
      if (p === 'bind') return (...a: unknown[]) => boc((v as (...x: unknown[]) => ReturnType<Env['DB']['prepare']>).apply(t, a))
      if (p === 'all' || p === 'run') return async () => {
        const r = (await (v as () => Promise<{ meta?: { rows_read?: number; duration?: number } }>).apply(t)) as { meta?: { rows_read?: number; duration?: number } }
        tong.rowsRead += Number(r.meta?.rows_read ?? 0); tong.ms += Number(r.meta?.duration ?? 0); tong.cau++
        return r
      }
      return typeof v === 'function' ? (v as (...x: unknown[]) => unknown).bind(t) : v
    },
  })
  const env2 = { ...E, DB: { prepare: (q: string) => boc(db.prepare(q)), batch: db.batch.bind(db), withSession: undefined } } as unknown as Env
  return { env: env2, tong }
}

beforeAll(async () => {
  for (const sql of (env as unknown as { LUOC_DO_SQL: string[] }).LUOC_DO_SQL) {
    const ds = sql.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*--/.test(l)).map((l) => l.replace(/\s--.*$/, '')).join('\n')
      .split(/;\s*(?:\n|$)/).map((x) => x.trim()).filter(Boolean)
    for (let i = 0; i < ds.length; i += 50) await E.DB.batch(ds.slice(i, i + 50).map((x) => E.DB.prepare(x))).catch(() => undefined) // lược đồ đã có (file khác dựng trước) ⇒ bỏ qua
  }
  await E.DB.batch(SBD.flatMap((s) => [
    E.DB.prepare("INSERT OR REPLACE INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?, ?, '2009', '12', 'x')").bind(s, `Em ${s}`),
    E.DB.prepare("INSERT OR REPLACE INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, cap_nhat_luc) VALUES (?, ?, '12', ?, 'x')").bind(s, `Em ${s}`, `12 - Lớp ${Math.floor(Number(s.slice(2)) / 40)}`),
  ]))
  await E.DB.prepare("INSERT OR REPLACE INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, tao_luc, trang_thai) VALUES ('hanh-trinh-v3-khoi-12','HT','Khối 12',?,'[]','[]','9999-12-31','2026-10-01T00:00:00Z','dang_chay')").bind(JSON.stringify(SBD)).run()
  // Sổ: 300 em × 01–14/10 (hôm nay tới 21:00), trung bình 45 lượt / em / ngày; giây ở cột hoặc raw_json.ms, chữ A–D, có lượt đọc lời giải, lượt che.
  const r = hat(1410)
  let hang: unknown[] = []
  let k = 0
  const xa = async () => {
    if (!hang.length) return
    await E.DB.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, purpose, visibility, raw_json)
      SELECT json_extract(j.value,'$[0]'), json_extract(j.value,'$[1]'), json_extract(j.value,'$[2]'), 'game', 'P', 1, json_extract(j.value,'$[3]'), json_extract(j.value,'$[4]'),
        json_extract(j.value,'$[5]'), json_extract(j.value,'$[6]'), json_extract(j.value,'$[7]'), json_extract(j.value,'$[8]'), json_extract(j.value,'$[9]') FROM json_each(?) j`).bind(JSON.stringify(hang)).run()
    hang = []
  }
  for (const s of SBD) {
    const cham = 0.3 + r() * 1.4
    for (const ngay of cacNgay('2026-10-01', '2026-10-14')) {
      const n = Math.round(LUOT_TB * cham * (ngay === '2026-10-14' ? 0.85 : 1) * (0.5 + r()))
      let chu = 'ABCD'[Math.floor(r() * 4)]!
      for (let i = 0; i < n; i++) {
        if (r() < 0.3) chu = 'ABCD'[Math.floor(r() * 4)]!
        const phut = Math.floor(r() * (ngay === '2026-10-14' ? 1260 : 1440))
        const luc = new Date(VN(`${ngay}T00:00:00`) + phut * 60_000 + Math.floor(r() * 60_000)).toISOString()
        const coMs = r() < 0.5
        hang.push([`nh${++k}`, s, `DE${Math.floor(r() * 30)}-${['I', 'II', 'III'][Math.floor(r() * 3)]}-${Math.floor(r() * 40)}`, r() < 0.2 ? null : r() < 0.6 ? 1 : 0,
          coMs ? null : Math.floor(2 + r() * 60), luc, ngayVnCua(Date.parse(luc)), r() < 0.05 ? 'xem_loi_giai' : null, r() < 0.03 ? 'embargoed' : null,
          JSON.stringify(coMs ? { chon: chu, ms: Math.floor(2000 + r() * 60000) } : { chon: chu })])
        if (hang.length >= 2000) await xa()
      }
    }
  }
  await xa()
}, 600_000)

describe('B3 + B5 trên runtime D1 (workerd)', () => {
  it('B3: DDL + lấp đêm chạy trên D1; cùng cờ đối phó; rows_read / thời gian của lệnh thầy trước → sau', async () => {
    const tongSo = Number((await E.DB.prepare('SELECT COUNT(*) AS n FROM su_kien_hoc WHERE sbd LIKE ?').bind('NH%').first<{ n: number }>())!.n)
    expect(tongSo).toBeGreaterThan(150_000)
    const em = (await docDanhSachEm(E, []))!.filter((e) => e.sbd.startsWith('NH'))
    expect(em).toHaveLength(SO_EM)
    // TRƯỚC: hai truy vấn cũ mỗi lô 100 em (3 lô).
    const cu = dem(E.DB)
    const kqCu = await docDoiPhoTho(cu.env, em, '2026-10-01', '2026-10-14', [], NOW, false)
    // Lấp đêm (đêm đầu sau phát hành: cả 01–13/10) — đo riêng.
    const lap = dem(E.DB)
    const l = await lapDemDoiPho(lap.env, NOW)
    expect(l.soDong).toBe(SO_EM * 13)
    // SAU: một câu mỗi lô (đệm 01–13/10 + hôm nay tính trực tiếp).
    const moi = dem(E.DB)
    const kqMoi = await docDoiPhoTho(moi.env, em, '2026-10-01', '2026-10-14', [], NOW, true)
    const ban = (k: typeof kqCu) => JSON.stringify([...k.theoEm].sort(([a], [b]) => (a < b ? -1 : 1)))
    expect(ban(kqMoi)).toBe(ban(kqCu))
    expect(kqMoi.daTinh).toEqual({ quaNhanh: true, chonLap: true })
    // Đêm thường: chỉ hôm qua thiếu (giả lập: xoá đệm 13/10 rồi lấp lại).
    await E.DB.prepare(`DELETE FROM ${BANG_DEM_DOI_PHO} WHERE ngay = '2026-10-13'`).run()
    const dem1 = dem(E.DB)
    expect((await lapDemDoiPho(dem1.env, NOW)).soDong).toBe(SO_EM)
    console.log('[B3 đo]', JSON.stringify({
      soDong: tongSo,
      truoc: { rowsRead: cu.tong.rowsRead, ms: Math.round(cu.tong.ms), cau: cu.tong.cau },
      sau: { rowsRead: moi.tong.rowsRead, ms: Math.round(moi.tong.ms), cau: moi.tong.cau },
      lapDemDauTien: { rowsRead: lap.tong.rowsRead, ms: Math.round(lap.tong.ms) },
      lapDemMotDem: { rowsRead: dem1.tong.rowsRead, ms: Math.round(dem1.tong.ms) },
      soCo: kqCu.theoEm.size,
    }))
    expect(moi.tong.rowsRead * 3).toBeLessThan(cu.tong.rowsRead)
    // Trigger trên runtime D1: lượt ghi muộn mang giờ 10/10 xoá đúng (em, ngày) ấy; số vẫn khớp đường cũ.
    await E.DB.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES ('nh-muon','NH007','DE1-I-1','on_lai','bu',1,0,2,?,'2026-10-10')").bind(new Date(VN('2026-10-10T21:00:00')).toISOString()).run()
    expect((await E.DB.prepare(`SELECT COUNT(*) AS n FROM ${BANG_DEM_DOI_PHO} WHERE sbd = 'NH007' AND ngay = '2026-10-10'`).first<{ n: number }>())!.n).toBe(0)
    expect((await E.DB.prepare(`SELECT COUNT(*) AS n FROM ${BANG_DEM_DOI_PHO} WHERE sbd = 'NH007'`).first<{ n: number }>())!.n).toBe(12)
    expect(ban(await docDoiPhoTho(E, em, '2026-10-01', '2026-10-14', [], NOW, true))).toBe(ban(await docDoiPhoTho(E, em, '2026-10-01', '2026-10-14', [], NOW, false)))
    // Câu đọc đệm trên D1 thật: dò bảng đệm theo khoá chính, sổ theo chỉ mục (sbd, ngay_vn).
    const ke = ((await E.DB.prepare(`EXPLAIN QUERY PLAN ${SQL_DOC_DEM_DOI_PHO}`).bind(JSON.stringify(SBD.slice(0, 100)), '2026-10-01', '2026-10-13', BAN_DEM_DOI_PHO,
      JSON.stringify(cacNgay('2026-10-01', '2026-10-13')), '2026-10-14', NG.giayNhanhTracNghiem, NG.giayNhanhTuTinh, NG.chuoiLap).all<{ detail: string }>()).results ?? []).map((x) => x.detail).join('\n')
    expect(ke).toMatch(/SEARCH s USING (COVERING )?INDEX idx_skh_em_ngay\w* \(sbd=\? AND ngay_vn=\?\)/)
    expect(ke).not.toMatch(/SCAN (su_kien_hoc|s)\b/)
  }, 600_000)

  it('B5: câu số câu của lớp (40 em): rows_read / thời gian trước → sau, cùng tập ngày có học', async () => {
    const lop = SBD.slice(0, 40)
    const homNay = ngayVnCua(NOW)
    const cu = dem(E.DB)
    const a = (await cu.env.DB.prepare(`SELECT sbd, ngay_vn, COUNT(*) AS n, MAX(luc1) AS luc FROM (
         SELECT sbd, ngay_vn, qid, MIN(luc) AS luc1 FROM su_kien_hoc
          WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay_vn >= ? AND ngay_vn <= ? AND luc >= ? AND ket_qua IS NOT NULL
          GROUP BY sbd, ngay_vn, qid
       ) GROUP BY sbd, ngay_vn`).bind(JSON.stringify(lop), themNgay(homNay, -(SO_NGAY_DOC_CHUOI - 1)), homNay, MOC_ISO).all<Row>()).results ?? []
    const moi = dem(E.DB)
    const b = (await moi.env.DB.prepare(SQL_SO_CAU_LOP).bind(JSON.stringify(lop), homNay, MOC_ISO, JSON.stringify(ngayTruocCuaChuoi(homNay))).all<Row>()).results ?? []
    const tap = (ds: Row[]) => ds.map((x) => `${String(x.sbd)}|${String(x.ngay_vn)}`).sort()
    expect(tap(b)).toEqual(tap(a))
    const homNayCua = (ds: Row[]) => ds.filter((x) => x.ngay_vn === homNay).map((x) => `${String(x.sbd)}|${String(x.n)}|${String(x.luc)}`).sort()
    expect(homNayCua(b)).toEqual(homNayCua(a))
    console.log('[B5 đo]', JSON.stringify({ truoc: { rowsRead: cu.tong.rowsRead, ms: Math.round(cu.tong.ms) }, sau: { rowsRead: moi.tong.rowsRead, ms: Math.round(moi.tong.ms) }, soNgayCoHoc: a.length }))
    expect(moi.tong.rowsRead).toBeLessThan(cu.tong.rowsRead)
  }, 600_000)
})
