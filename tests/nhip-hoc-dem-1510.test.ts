// @vitest-environment node
// B3 "máy chủ nhanh hơn giờ cao điểm" (thầy duyệt 15/10): cờ "đối phó" của Nhịp học thầy đọc ĐỆM THEO NGÀY (server/src/nhip-hoc-dem.ts) thay vì quét
// sổ cả khoảng mỗi lần. Khoá: đường mới CHO CÙNG SỐ với hai truy vấn cũ (SQL_GIAY_LO + SQL_LAP_LO) — trên dữ liệu 14+ ngày, 130+ em (hai lô), có lượt
// đọc lời giải / lướt / chẩn đoán, lượt còn che, giây ở cột và ở raw_json.ms, câu tự tính, chuỗi chọn lặp DÀI BẰNG NHAU khác chữ (cùng ngày và khác
// ngày); vẫn cùng số sau MỌI kiểu ghi muộn mang giờ cũ (nộp bù, chấm lại, công bố ca, xoá, dời ngày) nhờ trigger; qua nửa đêm 23:59 → 00:01 giờ VN;
// đệm khác phiên bản; bảng chưa dựng (rơi về đường cũ). EXPLAIN QUERY PLAN: đọc đệm theo khoá chính, sổ theo chỉ mục (sbd, ngay_vn) — không quét bảng.
// Chạy trên SQLite thật (tests/_d1-that.ts, lược đồ repo); tên em là mã giả.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import { cacNgay, docDanhSachEm, ngayVnCua } from '../server/src/bai-hang-ngay'
import { NGUONG_THAI_DO as NG } from '../server/src/bai-hang-ngay-kieu'
import { docDoiPhoTho, gvNhipHoc, SQL_GIAY_LO, SQL_LAP_LO } from '../server/src/nhip-hoc'
import {
  BAN_DEM_DOI_PHO, BANG_DEM_DOI_PHO, DDL_DEM_DOI_PHO, SQL_DOC_DEM_DOI_PHO, docDoiPhoLoQuaDem, lapDemDoiPho,
} from '../server/src/nhip-hoc-dem'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { congBoSuKien } from '../server/src/nang-luc-d1'
import { BANG_GIU } from '../server/src/reset-toan-app'
import { BANG_GIU_HOA2 } from '../server/src/reset-hoa2'

type D = ReturnType<typeof taoD1That>
type Row = Record<string, unknown>
const VN = (s: string) => Date.parse(`${s}+07:00`)
const NOW = VN('2026-10-14T12:00:00') // trưa 14/10 giờ VN

/** Số giả ngẫu nhiên có hạt (mulberry32) — dữ liệu lặp lại y hệt giữa hai D1. */
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
const chon = <T,>(r: () => number, ds: readonly T[]): T => ds[Math.floor(r() * ds.length)]!

let khoa = 0
interface Sk { sbd: string; qid: string; luc: string; kq?: number | null; giay?: number | null; purpose?: string | null; vis?: string | null; raw?: unknown; nguon?: string; maNguon?: string }
function sk(d: D, x: Sk) {
  d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, purpose, visibility, raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
    `k${String(++khoa).padStart(7, '0')}`, x.sbd, x.qid, x.nguon ?? 'game', x.maNguon ?? 'P', 1, x.kq === undefined ? 1 : x.kq, x.giay ?? null, x.luc,
    ngayVnCua(Date.parse(x.luc)), x.purpose ?? null, x.vis ?? null, x.raw === undefined ? null : typeof x.raw === 'string' ? x.raw : JSON.stringify(x.raw),
  )
}
const luc = (ngay: string, gio: number, phut: number, giay = 0) => new Date(VN(`${ngay}T00:00:00`) + ((gio * 60 + phut) * 60 + giay) * 1000).toISOString()

/** 130 em ngẫu nhiên (hai lô 100) + ba em dựng sẵn: T1 chuỗi 7 "B" (10/10) rồi 7 "A" (11/10) · T2 cùng ngày 7 "C" rồi 7 "A" · T3 quá nhanh nhiều ngày. */
function dung(soEm = 130): D {
  const d = taoD1That()
  for (const q of [...SQL_BANG_HANH_TRINH, ...SQL_GOI7]) d.sql.exec(q)
  const sbd = [...Array.from({ length: soEm }, (_, i) => `S${String(i).padStart(3, '0')}`), 'T1', 'T2', 'T3']
  for (const s of sbd) {
    d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(s, `Em ${s}`, '2009', '12', 'x')
    d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(s, `Em ${s}`, '12', '12 - Tinh Hoa', 'x')
  }
  d.sql.prepare("INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, tao_luc, trang_thai) VALUES ('hanh-trinh-v3-khoi-12','HT','Khối 12',?,'[]','[]','9999-12-31','2026-10-01T00:00:00Z','dang_chay')").run(JSON.stringify(sbd))
  const r = hat(1510)
  d.sql.exec('BEGIN')
  for (const s of sbd.slice(0, soEm)) {
    const chamChi = r() // em chăm làm nhiều lượt, em khác ít
    for (const ngay of cacNgay('2026-09-29', '2026-10-14')) {
      const n = r() < 0.2 ? 0 : Math.floor(r() * (chamChi * 26))
      let chu = chon(r, ['A', 'B', 'C', 'D'])
      for (let i = 0; i < n; i++) {
        if (r() < 0.25) chu = chon(r, ['A', 'B', 'C', 'D']) // giữ chữ ⇒ có chuỗi chọn lặp
        const phut = r() < 0.08 ? 23 * 60 + 50 + Math.floor(r() * 10) : r() < 0.08 ? Math.floor(r() * 10) : Math.floor(r() * 1440)
        const raw = chon<unknown>(r, [
          null, { chon: chu }, { chon: ` ${chu.toLowerCase()} ` }, { traLoi: chu }, { chon: chu, ms: Math.floor(r() * 20000) }, { ms: Math.floor(r() * 16000) },
          { tc: `DE9-III-${Math.floor(r() * 5)}`, chon: chu }, { tc: '' , chon: chu }, { tc: 7 }, { tc: { x: 1 } }, { chon: 'E' }, { traLoi: 12 }, '[1,2]', '"x"',
        ])
        sk(d, {
          sbd: s,
          qid: `DE${Math.floor(r() * 4)}-${chon(r, ['I', 'II', 'III'])}-${Math.floor(r() * 12)}${r() < 0.1 ? '~ss1' : ''}`,
          luc: luc(ngay, 0, phut, r() < 0.1 ? 0 : Math.floor(r() * 60)),
          kq: chon(r, [1, 1, 0, 0, null]),
          giay: chon(r, [null, null, 0, 3, 5, 7.6, 8, 9, 12, 14.4, 15, 30, 61]),
          purpose: chon(r, [null, null, null, null, null, 'xem_loi_giai', 'luot', 'chan_doan', 'chua_buoc', 'repair']),
          vis: chon(r, [null, null, null, null, 'released', 'embargoed']),
          raw,
          nguon: chon(r, ['game', 'game', 'thi', 'on_lai']),
          maNguon: chon(r, ['P', 'CA1', 'CA2']),
        })
      }
    }
  }
  // T1: chuỗi 7 "B" ngày 10/10, chuỗi 7 "A" ngày 11/10 (dài bằng nhau ⇒ chữ nêu là của chuỗi ngày SỚM hơn) + 8 lượt xen kẽ.
  for (let i = 0; i < 7; i++) sk(d, { sbd: 'T1', qid: `T1-a${i}`, luc: luc('2026-10-10', 9, i), raw: { chon: 'B' } })
  for (let i = 0; i < 7; i++) sk(d, { sbd: 'T1', qid: `T1-b${i}`, luc: luc('2026-10-11', 9, i), raw: { chon: 'A' } })
  for (let i = 0; i < 8; i++) sk(d, { sbd: 'T1', qid: `T1-c${i}`, luc: luc('2026-10-12', 9, i), raw: { chon: 'ABCD'[i % 4] } })
  // T2: CÙNG ngày 12/10, 7 "C" (sớm) rồi 7 "A" (muộn) ⇒ thứ tự cũ theo chữ: "A" đứng trước.
  for (let i = 0; i < 7; i++) sk(d, { sbd: 'T2', qid: `T2-a${i}`, luc: luc('2026-10-12', 8, i), raw: { chon: 'C' } })
  for (let i = 0; i < 7; i++) sk(d, { sbd: 'T2', qid: `T2-b${i}`, luc: luc('2026-10-12', 10, i), raw: { chon: 'A' } })
  for (let i = 0; i < 6; i++) sk(d, { sbd: 'T2', qid: `T2-c${i}`, luc: luc('2026-10-13', 10, i), raw: { chon: 'BD'[i % 2] } })
  // T3: 30 lượt 3–5 giây rải 5 ngày (đúng 4) + 20 lượt 30 giây + 10 câu tự tính 10 giây.
  for (let i = 0; i < 30; i++) sk(d, { sbd: 'T3', qid: `DE1-I-${i}`, luc: luc(`2026-10-0${5 + (i % 5)}`, 10, i), kq: i < 4 ? 1 : 0, giay: 3 + (i % 3) })
  for (let i = 0; i < 20; i++) sk(d, { sbd: 'T3', qid: `DE1-II-${i}`, luc: luc('2026-10-10', 11, i), kq: 1, giay: 30 })
  for (let i = 0; i < 10; i++) sk(d, { sbd: 'T3', qid: `DE2-III-${i}`, luc: luc('2026-10-11', 11, i), kq: 0, giay: 10 })
  // Câu gốc `tc` lạ trong raw_json (đối tượng, số nguyên, số thực 2.0) ở nhóm 8–14 giây: chuỗi câu phải ra y hệt bản cũ.
  for (const [i, raw] of ['{"tc":{"x":1}}', '{"tc":7}', '{"tc":2.0}'].entries()) sk(d, { sbd: 'T3', qid: `DE3-I-${i}`, luc: luc('2026-10-12', 11, i), kq: 1, giay: 10, raw })
  d.sql.exec('COMMIT')
  return d
}

const emCua = async (env: Env) => (await docDanhSachEm(env, []))!
const ban = (kq: Awaited<ReturnType<typeof docDoiPhoTho>>) => JSON.stringify({ theoEm: [...kq.theoEm].sort(([a], [b]) => (a < b ? -1 : 1)), daTinh: kq.daTinh })

/** Ghi lại mọi câu SQL đã chạy (để biết đường nào được dùng); `tra()` trả lại `prepare` gốc. */
function ghiCau(env: Env): string[] & { tra: () => void } {
  const ds = [] as unknown as string[] & { tra: () => void }
  const db = env.DB as { prepare: Env['DB']['prepare'] }
  const goc = db.prepare
  const boc = goc.bind(env.DB)
  db.prepare = (q: string) => { ds.push(q); return boc(q) }
  ds.tra = () => { db.prepare = goc }
  return ds
}

/** Đường cũ vs đường đệm trên CÙNG D1: kết quả cuối (cờ từng em) y hệt; trả kết quả để kiểm thêm. Kiểm đường đệm thật sự được dùng. */
async function soSanh(env: Env, tu: string, den: string, now: number) {
  const em = await emCua(env)
  const cu = await docDoiPhoTho(env, em, tu, den, [], now, false)
  const cau = ghiCau(env)
  const moi = await docDoiPhoTho(env, em, tu, den, [], now, true)
  cau.tra()
  expect(cau.some((q) => q === SQL_DOC_DEM_DOI_PHO)).toBe(true)
  expect(cau.some((q) => q === SQL_GIAY_LO || q === SQL_LAP_LO)).toBe(false)
  expect(ban(moi)).toBe(ban(cu))
  return { cu, moi }
}

/** Hàng thô của hai truy vấn cũ vs hàng dựng lại từ đệm, cho MỘT lô: tổng theo (loại, em, câu) bằng nhau; chuỗi chọn lặp CÙNG THỨ TỰ. */
async function soSanhHang(env: Env, sbd: string[], tu: string, den: string, now: number) {
  const j = JSON.stringify(sbd)
  const rG = (await env.DB.prepare(SQL_GIAY_LO).bind(j, tu, den, NG.giayNhanhTracNghiem, NG.giayNhanhTuTinh).all<Row>()).results ?? []
  const rL = (await env.DB.prepare(SQL_LAP_LO).bind(j, tu, den, NG.chuoiLap).all<Row>()).results ?? []
  const moi = await docDoiPhoLoQuaDem(env, sbd, tu, den, ngayVnCua(now))
  const gop = (ds: readonly Row[]) => {
    const m = new Map<string, [number, number, number]>()
    for (const x of ds) {
      const k = `${String(x.loai)}|${String(x.sbd)}|${String(x.q ?? '')}`
      const c = m.get(k) ?? [0, 0, 0]
      m.set(k, [c[0] + Number(x.n), c[1] + Number(x.nkq), c[2] + Number(x.nd)])
    }
    return [...m].sort(([a], [b]) => (a < b ? -1 : 1))
  }
  const lap = (ds: readonly Row[]) => {
    const m = new Map<string, string[]>()
    for (const x of ds) (m.get(String(x.sbd)) ?? m.set(String(x.sbd), []).get(String(x.sbd))!).push(`${String(x.c)}:${Number(x.n)}`)
    return [...m].map(([s, v]) => [s, v.filter((c) => c.startsWith(':')).join(), v.filter((c) => !c.startsWith(':')).join()]).sort(([a], [b]) => (a! < b! ? -1 : 1))
  }
  expect(gop(moi.rG)).toEqual(gop(rG))
  expect(lap(moi.rL)).toEqual(lap(rL))
  return { rG, rL }
}

const soDongDem = (d: D, sbd?: string, ngay?: string) =>
  Number((d.sql.prepare(`SELECT COUNT(*) AS n FROM ${BANG_DEM_DOI_PHO} WHERE (?1 IS NULL OR sbd = ?1) AND (?2 IS NULL OR ngay = ?2)`).get(sbd ?? null, ngay ?? null) as { n: number }).n)

describe('B3 · đệm theo ngày cho cờ đối phó — cùng số với đường cũ', { timeout: 120_000 }, () => {
  it('lấp đêm (01/10 → hôm qua, hai lô) rồi so: cả khoảng mặc định, khoảng toàn ngày đã qua, khoảng cắt ngang; hàng thô khớp, chuỗi cùng thứ tự', async () => {
    const d = dung()
    const env = d.env as unknown as Env
    const lap = await lapDemDoiPho(env, NOW)
    expect(lap.soCau).toBeGreaterThan(0)
    expect(soDongDem(d)).toBe(133 * 13) // mọi (em, ngày 01–13/10), kể cả dòng toàn 0; KHÔNG có hôm nay
    expect(soDongDem(d, undefined, '2026-10-14')).toBe(0)
    const { cu } = await soSanh(env, '2026-10-01', '2026-10-14', NOW)
    expect(cu.theoEm.size).toBeGreaterThanOrEqual(5) // dữ liệu thật sự có cờ để so
    expect(cu.theoEm.get('T1')?.chonLap).toMatchObject({ dai: 7, chu: 'B' }) // chuỗi khác ngày dài bằng nhau ⇒ ngày sớm hơn
    expect(cu.theoEm.get('T2')?.chonLap).toMatchObject({ dai: 7, chu: 'A' }) // cùng ngày ⇒ theo chữ
    expect(cu.theoEm.get('T3')?.quaNhanh).toMatchObject({ nhanh: 40, coTuTinh: true })
    await soSanh(env, '2026-10-05', '2026-10-10', NOW)
    await soSanh(env, '2026-09-29', '2026-10-14', NOW) // 29–30/09 chưa có đệm ⇒ tính trực tiếp trong cùng câu
    const em = (await emCua(env)).map((e) => e.sbd)
    for (const lo of [em.slice(0, 100), em.slice(100)]) await soSanhHang(env, lo, '2026-10-01', '2026-10-14', NOW)
    const t = await soSanhHang(env, ['T1', 'T2', 'T3'], '2026-10-01', '2026-10-14', NOW)
    expect(t.rG.filter((x) => x.loai === 'giua').map((x) => String(x.q)).sort()).toEqual(expect.arrayContaining(['2', '7', '{"x":1}']))
  })

  it('toàn bộ trả lời /gv/nhip-hoc y hệt bản D1 không có đệm (đường cũ)', async () => {
    const coDem = dung(40)
    const khongDem = dung(40)
    await lapDemDoiPho(coDem.env as unknown as Env, NOW)
    const a = await gvNhipHoc(coDem.env as unknown as Env, {}, NOW)
    const b = await gvNhipHoc(khongDem.env as unknown as Env, {}, NOW)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    expect((a as { em: { doiPho: unknown }[] }).em.filter((e) => e.doiPho).length).toBeGreaterThan(0)
  })

  it('ghi muộn mang giờ CŨ (nộp bù, chấm lại ca, công bố ca, xoá, dời ngày): trigger xoá đúng (em, ngày) bị chạm, số vẫn y hệt đường cũ', async () => {
    const d = dung(60)
    const env = d.env as unknown as Env
    await lapDemDoiPho(env, NOW)
    const truoc = soDongDem(d)
    // 1) nộp bù ngoại tuyến: 25 lượt 2 giây ngày 12/10 của T2 tới hôm nay (đi đúng đường ghi sổ thật).
    expect((await soSanh(env, '2026-10-01', '2026-10-14', NOW)).cu.theoEm.get('T2')?.quaNhanh).toBeNull()
    await ghiSuKien(env, Array.from({ length: 25 }, (_, i) => ({ nguon: 'on_lai' as const, maNguon: 'bu', sbd: 'T2', qid: `BU-I-${i}`, lan: 1, ketQua: 0 as const, giay: 2, luc: luc('2026-10-12', 21, i), raw: { chon: 'D' } })))
    expect(soDongDem(d, 'T2', '2026-10-12')).toBe(0)
    expect(soDongDem(d)).toBe(truoc - 1)
    const { cu: sau1 } = await soSanh(env, '2026-10-01', '2026-10-14', NOW)
    expect(sau1.theoEm.get('T2')?.quaNhanh).toBeTruthy() // lượt bù làm em bật cờ ⇒ đệm cũ mà còn thì đã SAI
    // 2) chấm lại ca thi: cùng khoá, đổi kết quả + giây của lượt 11/10 (ON CONFLICT DO UPDATE).
    const cham = { nguon: 'thi' as const, maNguon: 'CA-X', sbd: 'S002', qid: 'DE1-I-1', lan: 1, giay: 30, luc: luc('2026-10-11', 9, 0), raw: { chon: 'A' } }
    await ghiSuKien(env, [{ ...cham, ketQua: 1 }])
    await lapDemDoiPho(env, NOW)
    expect(soDongDem(d, 'S002', '2026-10-11')).toBe(1)
    await ghiSuKien(env, [{ ...cham, ketQua: 0, giay: 2 }], { capNhat: true })
    expect(soDongDem(d, 'S002', '2026-10-11')).toBe(0)
    await soSanh(env, '2026-10-01', '2026-10-14', NOW)
    // 3) công bố ca: 30 lượt che của T1 ngày 09/10 ⇒ bắt đầu được tính.
    await ghiSuKien(env, Array.from({ length: 30 }, (_, i) => ({ nguon: 'thi' as const, maNguon: 'CA-CHE', sbd: 'T1', qid: `CHE-I-${i}`, lan: 1, ketQua: 0 as const, giay: 3, luc: luc('2026-10-09', 8, i), visibility: 'embargoed' as const })))
    await lapDemDoiPho(env, NOW)
    expect(soDongDem(d, 'T1', '2026-10-09')).toBe(1)
    const che = await soSanh(env, '2026-10-01', '2026-10-14', NOW)
    expect(che.cu.theoEm.get('T1')?.quaNhanh).toBeNull()
    expect(await congBoSuKien(env, 'thi', 'CA-CHE')).toBe(30)
    expect(soDongDem(d, 'T1', '2026-10-09')).toBe(0)
    const cong = await soSanh(env, '2026-10-01', '2026-10-14', NOW)
    expect(cong.cu.theoEm.get('T1')?.quaNhanh).toBeTruthy() // công bố đổi số thật ⇒ đệm cũ mà còn thì đã SAI
    // 4) xoá dòng · 5) dời ngày của một dòng (07/10 → 06/10): cả ngày cũ lẫn ngày mới đều bị xoá khỏi đệm.
    await lapDemDoiPho(env, NOW)
    const mot = d.sql.prepare("SELECT khoa, sbd FROM su_kien_hoc WHERE ngay_vn = '2026-10-08' AND sbd LIKE 'S0%' LIMIT 1").get() as { khoa: string; sbd: string }
    d.sql.prepare('DELETE FROM su_kien_hoc WHERE khoa = ?').run(mot.khoa)
    expect(soDongDem(d, mot.sbd, '2026-10-08')).toBe(0)
    const hai = d.sql.prepare("SELECT khoa, sbd FROM su_kien_hoc WHERE ngay_vn = '2026-10-07' AND sbd LIKE 'S0%' LIMIT 1").get() as { khoa: string; sbd: string }
    d.sql.prepare("UPDATE su_kien_hoc SET ngay_vn = '2026-10-06', luc = ? WHERE khoa = ?").run(luc('2026-10-06', 9, 0), hai.khoa)
    expect(soDongDem(d, hai.sbd, '2026-10-07') + soDongDem(d, hai.sbd, '2026-10-06')).toBe(0)
    await soSanh(env, '2026-10-01', '2026-10-14', NOW)
    // Đêm sau lấp lại đúng những dòng bị xoá; số vẫn y hệt.
    await lapDemDoiPho(env, NOW + 86_400_000)
    expect(soDongDem(d, hai.sbd, '2026-10-06')).toBe(1)
    await soSanh(env, '2026-10-01', '2026-10-15', NOW + 86_400_000)
  })

  it('qua nửa đêm giờ VN: 23:59 (14/10 là hôm nay) → 00:01 (14/10 thành ngày đã qua: chưa lấp thì tính trực tiếp, lấp rồi đọc đệm; lượt muộn mang giờ 23:59 tới sau khi lấp)', async () => {
    const d = dung(30)
    const env = d.env as unknown as Env
    const t2359 = VN('2026-10-14T23:59:00')
    const t0001 = VN('2026-10-15T00:01:00')
    await lapDemDoiPho(env, t2359)
    expect(soDongDem(d, undefined, '2026-10-14')).toBe(0)
    for (let i = 0; i < 25; i++) sk(d, { sbd: 'S004', qid: `KHUYA-I-${i}`, luc: luc('2026-10-14', 23, 58, i), kq: 0, giay: 2 })
    await soSanh(env, '2026-10-01', '2026-10-14', t2359)
    for (let i = 0; i < 3; i++) sk(d, { sbd: 'S004', qid: `SANG-I-${i}`, luc: luc('2026-10-15', 0, 0, 10 + i), kq: 0, giay: 2 })
    await soSanh(env, '2026-10-01', '2026-10-15', t0001) // chưa lấp 14/10 ⇒ tính trực tiếp
    await lapDemDoiPho(env, t0001)
    expect(soDongDem(d, undefined, '2026-10-14')).toBe(33)
    expect(soDongDem(d, undefined, '2026-10-15')).toBe(0)
    await soSanh(env, '2026-10-01', '2026-10-15', t0001)
    // Máy em ngoại tuyến gửi bù lượt 23:59:50 ngày 14/10 SAU khi cron đã lấp 14/10.
    await ghiSuKien(env, [{ nguon: 'on_lai', maNguon: 'bu', sbd: 'S004', qid: 'MUON-I-1', lan: 1, ketQua: 0, giay: 1, luc: luc('2026-10-14', 23, 59, 50) }])
    expect(soDongDem(d, 'S004', '2026-10-14')).toBe(0)
    await soSanh(env, '2026-10-01', '2026-10-15', t0001 + 60_000)
    await soSanh(env, '2026-10-14', '2026-10-14', t0001 + 60_000)
  })

  it('đệm khác phiên bản ⇒ coi như chưa tính (cùng số); bảng chưa dựng ⇒ đúng hai truy vấn cũ và isolate nghỉ 10 phút, không thử lại mỗi lượt', async () => {
    const d = dung(30)
    const env = d.env as unknown as Env
    await lapDemDoiPho(env, NOW)
    d.sql.prepare(`UPDATE ${BANG_DEM_DOI_PHO} SET ban = 'cu', tn = 999, lt = 999 WHERE ngay <= '2026-10-06'`).run()
    await soSanh(env, '2026-10-01', '2026-10-14', NOW)
    expect(BAN_DEM_DOI_PHO).toMatch(/^1-8-15-6-[0-9a-f]{8}$/)

    const moi = dung(30)
    const envMoi = moi.env as unknown as Env
    const em = await emCua(envMoi)
    const cau = ghiCau(envMoi)
    const a = await docDoiPhoTho(envMoi, em, '2026-10-01', '2026-10-14', [], NOW, true)
    expect(cau.filter((q) => q === SQL_DOC_DEM_DOI_PHO)).toHaveLength(1) // thử một lần, hỏng (chưa có bảng)
    expect(cau.filter((q) => q === SQL_GIAY_LO)).toHaveLength(1)
    const b = await docDoiPhoTho(envMoi, em, '2026-10-01', '2026-10-14', [], NOW + 60_000, true)
    expect(cau.filter((q) => q === SQL_DOC_DEM_DOI_PHO)).toHaveLength(1) // trong 10 phút: không thử lại
    expect(ban(a)).toBe(ban(b))
    expect(ban(a)).toBe(ban(await docDoiPhoTho(envMoi, em, '2026-10-01', '2026-10-14', [], NOW, false)))
    await lapDemDoiPho(envMoi, NOW + 60_000) // cron dựng bảng + lấp
    await docDoiPhoTho(envMoi, em, '2026-10-01', '2026-10-14', [], NOW + 11 * 60_000, true)
    expect(cau.filter((q) => q === SQL_DOC_DEM_DOI_PHO)).toHaveLength(2) // hết 10 phút ⇒ đọc đệm
  })

  it('lệnh thầy CHỈ ĐỌC: không câu ghi / DDL nào trên đường trả lời, kể cả khi đệm thiếu ngày', async () => {
    const d = dung(30)
    const env = d.env as unknown as Env
    await lapDemDoiPho(env, NOW)
    d.sql.prepare(`DELETE FROM ${BANG_DEM_DOI_PHO} WHERE ngay = '2026-10-10'`).run()
    const cau = ghiCau(env)
    const b0 = d.soLenh.batch
    expect((await gvNhipHoc(env, {}, NOW)).ok).toBe(true)
    cau.tra()
    expect(cau.some((q) => q === SQL_DOC_DEM_DOI_PHO)).toBe(true)
    expect(cau.filter((q) => /^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i.test(q) || /\bINSERT\s+(OR\s+\w+\s+)?INTO\b/i.test(q))).toEqual([])
    expect(d.soLenh.batch).toBe(b0)
  })
})

describe('B3 · lược đồ + kế hoạch truy vấn', { timeout: 120_000 }, () => {
  it('EXPLAIN QUERY PLAN: đệm theo khoá chính (sbd, ngay); sổ theo chỉ mục (sbd=? AND ngay_vn=?) — không SCAN su_kien_hoc, không SCAN bảng đệm', async () => {
    const d = dung(5)
    await lapDemDoiPho(d.env as unknown as Env, NOW)
    const ke = (d.sql.prepare(`EXPLAIN QUERY PLAN ${SQL_DOC_DEM_DOI_PHO}`).all(
      '["S000","S001"]', '2026-10-01', '2026-10-13', BAN_DEM_DOI_PHO, JSON.stringify(cacNgay('2026-10-01', '2026-10-13')), '2026-10-14', 8, 15, 6,
    ) as { detail: string }[]).map((x) => x.detail)
    const noi = ke.join('\n')
    expect(noi).toMatch(/SEARCH s USING (COVERING )?INDEX idx_skh_em_ngay\w* \(sbd=\? AND ngay_vn=\?\)/)
    expect(noi).toMatch(new RegExp(`SEARCH ${BANG_DEM_DOI_PHO} USING INDEX sqlite_autoindex_${BANG_DEM_DOI_PHO}_1 \\(sbd=\\? AND ngay>\\? AND ngay<\\?\\)`))
    expect(noi).not.toMatch(/SCAN (su_kien_hoc|s)\b/)
    expect(noi).not.toMatch(new RegExp(`SCAN ${BANG_DEM_DOI_PHO}\\b`))
  })

  it('DDL một batch: bảng + ba trigger (thêm / sửa / xoá); bảng xếp GIỮ ở cả hai job reset (đệm dẫn xuất từ sổ — sổ GIỮ)', async () => {
    const d = dung(1)
    await lapDemDoiPho(d.env as unknown as Env, NOW)
    const ten = (d.sql.prepare("SELECT type, name FROM sqlite_master WHERE name LIKE 'nhip_hoc_doi_pho%' ORDER BY name").all() as { type: string; name: string }[]).map((x) => `${x.type}:${x.name}`)
    expect(ten).toEqual([`table:${BANG_DEM_DOI_PHO}`, 'trigger:nhip_hoc_doi_pho_sau_sua', 'trigger:nhip_hoc_doi_pho_sau_them', 'trigger:nhip_hoc_doi_pho_sau_xoa'])
    expect(DDL_DEM_DOI_PHO.every((s) => /^CREATE (TABLE|TRIGGER) IF NOT EXISTS /.test(s))).toBe(true)
    expect(BANG_GIU).toContain(BANG_DEM_DOI_PHO)
    expect(BANG_GIU_HOA2).toContain(BANG_DEM_DOI_PHO)
  })
})
