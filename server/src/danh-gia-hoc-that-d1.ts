// XẾP HỌC SINH — phần D1: đọc sổ → lõi thuần `danh-gia-hoc-that.ts` → lưu bản chụp tuần; lệnh thầy / học sinh / phụ huynh; cron thứ Hai.
// Thầy 24/10: «Chốt build tất cả nhưng chưa đẩy tới lúc tôi ra quyết định đẩy». Đặc tả docs/DE-XUAT-HOC-THAT-DOI-PHO-2410.md.
//
// CÔNG TẮC `cau_hinh.danh_gia_hoc_that` = "tat" | "ngam" | "bat" (MẶC ĐỊNH "ngam"):
//   · tat  — không tính, không hiện.
//   · ngam — CHẠY NGẦM: cron tính + lưu bản chụp; CHỈ thầy thấy (màn hiệu chỉnh, gán nhãn mù). KHÔNG nhắc em, KHÔNG báo phụ huynh.
//   · bat  — như ngầm + em/phụ huynh thấy Học thật/Đối phó + máy tự nhắc em (tuần Đối phó đầu) và báo phụ huynh (tuần thứ 2 liền).
//   ĐUỔI KHÔNG BAO GIỜ tự gửi: chỉ khi thầy bấm «Xác nhận cho nghỉ» (`/gv/danh-gia/can-thiep {loai:'xac_nhan_nghi'}`).
// BẢNG CHỈ-THÊM, tạo lúc chạy (IF NOT EXISTS): `danh_gia_em_tuan` (bản chụp tuần, tính lại được từ sổ), `danh_gia_cau_tuan` (tỉ lệ đúng của lớp từng câu),
// `can_thiep_em` (nhật ký nhắc / báo / cam kết / xác nhận), `nhan_mu_thay` (nhãn mù thầy gán để hiệu chỉnh). Không sửa / xoá dữ liệu cũ nào.
import type { Env, ExecutionContext } from './kieu'
import { gameIdentity } from './game-v2-auth'
import { sbdCuaPhuHuynh } from './ph-truy-cap'
import { CHI_NHAN_TOKEN } from './ph-tat-ca-ve-con'
import { giayUocTinhGame } from './ai-sai-cau'
import { tachSongSinh } from './loi-hoc-luat'
import { docBetaCau, docTauEm } from './omni-d1'
import { docKichThuocCau, type KichThuocCau } from './cau-doc-giay'
import { nangCoTinhTheoNgay, type MucLamLuot } from './muc-lam'
import { chuanMucDo, docDoMuc, lapLaiCacLuot } from './muc-lam-so'
import { doThatCacDong, giaySoLuot, mucLamCuaDong, tapCanTraMucLam, type DongMucSo } from './muc-lam-lo'
import { congNgay7, ngayVn7 } from './goi-bai-7-loi'
import {
  bacCongKhai, bacTheoLichSu, danhGiaEm, TEN_BAC,
  type BacDanhGia, type CanThiep, type KetLuanBac, type KetQuaDanhGia, type LoaiCanThiep, type LuotDanhGia, type TuanDaTinh,
} from './danh-gia-hoc-that'

type Row = Record<string, unknown>
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x)).trim()
const num = (x: unknown): number => (typeof x === 'number' ? x : Number(x)) || 0
const json = <T>(x: unknown, macDinh: T): T => { try { return x ? (JSON.parse(String(x)) as T) : macDinh } catch { return macDinh } }

export type CheDoDanhGia = 'tat' | 'ngam' | 'bat'
export const KHOA_CHE_DO = 'danh_gia_hoc_that'
export const SO_NGAY_CUA_SO = 14
export const LO_EM = 25

const BANG = [
  `CREATE TABLE IF NOT EXISTS danh_gia_em_tuan (sbd TEXT NOT NULL, tuan TEXT NOT NULL, diem REAL NOT NULL, bac_tuan INTEGER NOT NULL, bac INTEGER NOT NULL,
     co_do INTEGER NOT NULL DEFAULT 0, du_du_lieu INTEGER NOT NULL DEFAULT 1, phat_json TEXT, so_lieu_json TEXT, tien_bo_json TEXT, ly_do_json TEXT, viec TEXT,
     bang_chung_json TEXT, co_do_nang_json TEXT, tinh_luc TEXT NOT NULL, PRIMARY KEY (sbd, tuan))`,
  `CREATE TABLE IF NOT EXISTS danh_gia_cau_tuan (tuan TEXT NOT NULL, qid TEXT NOT NULL, n INTEGER NOT NULL, dung INTEGER NOT NULL, PRIMARY KEY (tuan, qid))`,
  `CREATE TABLE IF NOT EXISTS can_thiep_em (id TEXT PRIMARY KEY, sbd TEXT NOT NULL, loai TEXT NOT NULL, noi_dung TEXT, tuan TEXT, gui_luc TEXT NOT NULL,
     em_xem_luc TEXT, ph_xem_luc TEXT, tao_boi TEXT NOT NULL DEFAULT 'may')`,
  `CREATE INDEX IF NOT EXISTS idx_can_thiep_em ON can_thiep_em(sbd, gui_luc)`,
  `CREATE TABLE IF NOT EXISTS nhan_mu_thay (sbd TEXT PRIMARY KEY, nhan TEXT NOT NULL, luc TEXT NOT NULL)`,
]
const daDamBao = new WeakSet<object>()
export async function damBaoBangDanhGia(env: Env): Promise<void> {
  if (daDamBao.has(env.DB as unknown as object)) return
  await env.DB.batch(BANG.map((s) => env.DB.prepare(s)))
  daDamBao.add(env.DB as unknown as object)
}

export async function docCheDo(env: Env): Promise<CheDoDanhGia> {
  const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_CHE_DO).first<Row>().catch(() => null)
  const v = json<string>(r?.gia_tri, '')
  return v === 'tat' || v === 'bat' ? v : 'ngam'
}
async function ghiCheDo(env: Env, v: CheDoDanhGia, nowIso: string): Promise<void> {
  await env.DB.prepare(`INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc`)
    .bind(KHOA_CHE_DO, JSON.stringify(v), nowIso).run()
}

/** Thứ Hai (giờ VN) của tuần chứa ngày `ngay`. Thuần. */
export function thuHaiCua(ngay: string): string {
  const d = new Date(ngay + 'T00:00:00Z').getUTCDay()
  return congNgay7(ngay, -((d + 6) % 7))
}
const hoi = async (env: Env, sql: string, ...bind: unknown[]): Promise<Row[]> => (await env.DB.prepare(sql).bind(...bind).all<Row>()).results ?? []

// ───────────────────────── ĐỌC SỔ → ĐẦU VÀO LÕI ─────────────────────────

export interface KetQuaEm {
  sbd: string
  tuan: string
  kq: KetQuaDanhGia
  bac: KetLuanBac
  coDoNang: NonNullable<TuanDaTinh['coDoNang']>
}

/** Tính MỘT lô em (≤ LO_EM) cho tuần chứa `nowMs`, cửa sổ 14 ngày tới hôm nay. Không ghi gì. Ném lỗi khi không đọc được sổ. */
export async function tinhLoEm(env: Env, sbds: readonly string[], nowMs: number): Promise<KetQuaEm[]> {
  if (!sbds.length) return []
  await damBaoBangDanhGia(env)
  const den = ngayVn7(nowMs), tu = congNgay7(den, -(SO_NGAY_CUA_SO - 1)), tuan = thuHaiCua(den)
  const tuIso = new Date(Date.parse(tu + 'T00:00:00Z') - 7 * 3600_000).toISOString()
  const ds = JSON.stringify(sbds)
  const [rSo, rKt, rThi, rHs, rBuoi, rDd, rLs, rCt, rCauTuan] = await Promise.all([
    hoi(env, `SELECT s.sbd, s.qid, s.nguon, s.ma_nguon, s.ket_qua, s.giay, s.luc, s.muc_do, s.ngay_vn, s.assistance,
        CASE WHEN json_valid(s.raw_json) THEN json_extract(s.raw_json, '$.ms') END AS ms,
        CASE WHEN json_valid(s.raw_json) THEN json_extract(s.raw_json, '$.tc') END AS tc,
        CASE WHEN json_valid(s.raw_json) THEN json_extract(s.raw_json, '$.doc') END AS doc,
        CASE WHEN json_valid(s.raw_json) THEN UPPER(TRIM(CAST(COALESCE(json_extract(s.raw_json, '$.chon'), json_extract(s.raw_json, '$.traLoi')) AS TEXT))) END AS chon
      FROM su_kien_hoc s WHERE s.sbd IN (SELECT value FROM json_each(?1)) AND s.ngay_vn BETWEEN ?2 AND ?3 AND s.ket_qua IS NOT NULL
        AND COALESCE(s.purpose, '') NOT IN ('xem_loi_giai', 'luot', 'chan_doan', 'chua_buoc') AND COALESCE(s.visibility, '') <> 'embargoed'`, ds, tu, den),
    hoi(env, 'SELECT sbd, trang_thai, diem, ngay FROM kiem_tra_ca_nhan WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay BETWEEN ?2 AND ?3 ORDER BY ngay', ds, tu, den).catch(() => [] as Row[]),
    hoi(env, 'SELECT sbd, so_lan_roi_man, tong_giay_roi_man FROM luot WHERE sbd IN (SELECT value FROM json_each(?1)) AND vao_luc >= ?2', ds, tuIso).catch(() => [] as Row[]),
    hoi(env, 'SELECT sbd, lop FROM hoc_sinh WHERE sbd IN (SELECT value FROM json_each(?1))', ds).catch(() => [] as Row[]),
    hoi(env, "SELECT id, lop FROM buoi_hoc WHERE mo_luc >= ?1 AND COALESCE(lop, '') <> ''", tuIso).catch(() => [] as Row[]),
    hoi(env, 'SELECT buoi_id, sbd, trang_thai FROM buoi_hoc_diem_danh WHERE sbd IN (SELECT value FROM json_each(?1))', ds).catch(() => [] as Row[]),
    hoi(env, 'SELECT * FROM danh_gia_em_tuan WHERE sbd IN (SELECT value FROM json_each(?1)) AND tuan < ?2 ORDER BY tuan DESC', ds, tuan).catch(() => [] as Row[]),
    hoi(env, 'SELECT sbd, loai, gui_luc, em_xem_luc, ph_xem_luc FROM can_thiep_em WHERE sbd IN (SELECT value FROM json_each(?1)) AND gui_luc >= ?2', ds, new Date(nowMs - 70 * 86_400_000).toISOString()).catch(() => [] as Row[]),
    hoi(env, 'SELECT MAX(tuan) AS t FROM danh_gia_cau_tuan').catch(() => [] as Row[]),
  ])
  // Lượt → Mức làm (CÙNG đường với Lịch sử làm câu / bảng điểm danh: hệ số lặp, τ riêng, β, đo lại lượt cũ).
  const dong: (DongMucSo & { chon: string; coGoiY: boolean })[] = rSo.map((x) => {
    const qid = str(x.qid), tc = str(x.tc)
    const kq = x.ket_qua === null || x.ket_qua === undefined || x.ket_qua === '' ? null : Number(x.ket_qua)
    return {
      sbd: str(x.sbd), nguon: str(x.nguon), ngay: str(x.ngay_vn), maNguon: str(x.ma_nguon), luc: str(x.luc),
      goc: tc ? tachSongSinh(tc).goc : tachSongSinh(qid).goc, mucDo: chuanMucDo(x.muc_do),
      ketQua: kq === null || !Number.isFinite(kq) ? null : kq, giayCot: x.giay, ms: x.ms,
      doMuc: docDoMuc({ doc: json<Row | null>(x.doc, null) }), qid, tc, chon: str(x.chon), coGoiY: str(x.assistance) === 'assisted',
    }
  })
  const doThat = doThatCacDong(dong)
  const can = tapCanTraMucLam(dong, doThat)
  const tuanCau = str(rCauTuan[0]?.t)
  const qids = [...new Set(dong.map((d) => d.qid ?? ''))].filter(Boolean)
  const [uoc, beta, kichThuoc, tau, rP] = await Promise.all([
    can.gameThieuGiay.length ? giayUocTinhGame(env, can.gameThieuGiay).catch(() => new Map<string, number>()) : Promise.resolve(new Map<string, number>()),
    can.gocMuc.length ? docBetaCau(env, can.gocMuc).catch(() => new Map<string, number>()) : Promise.resolve(new Map<string, number>()),
    can.gocCanKichThuoc.length ? docKichThuocCau(env, can.gocCanKichThuoc).catch(() => new Map<string, KichThuocCau>()) : Promise.resolve(new Map<string, KichThuocCau>()),
    docTauEm(env, sbds).catch(() => new Map<string, number>()),
    tuanCau && qids.length ? hoi(env, 'SELECT qid, n, dung FROM danh_gia_cau_tuan WHERE tuan = ?1 AND qid IN (SELECT value FROM json_each(?2))', tuanCau, JSON.stringify(qids)).catch(() => [] as Row[]) : Promise.resolve([] as Row[]),
  ])
  const pLop = new Map(rP.filter((x) => num(x.n) >= 5).map((x) => [str(x.qid), num(x.dung) / num(x.n)]))
  const lap = lapLaiCacLuot(dong.map((d) => ({ sbd: d.sbd, qid: d.qid ?? d.goc, tc: d.tc || null, luc: d.luc })))
  const luotEm = new Map<string, { m: MucLamLuot | null; d: (typeof dong)[number] }[]>(sbds.map((s) => [s, []]))
  dong.forEach((d, i) => {
    const gs = giaySoLuot(d, doThat[i] ?? null, uoc)
    luotEm.get(d.sbd)?.push({ m: mucLamCuaDong(d, doThat[i] ?? null, gs, beta, kichThuoc, { lap: lap[i] ?? null, tau: tau.get(d.sbd) ?? null }), d })
  })
  const ngayCuaSo = Array.from({ length: SO_NGAY_CUA_SO }, (_, i) => congNgay7(tu, i))
  const lopEm = new Map(rHs.map((x) => [str(x.sbd), str(x.lop)]))
  const ra: KetQuaEm[] = []
  for (const sbd of sbds) {
    const ls = luotEm.get(sbd) ?? []
    const co6 = nangCoTinhTheoNgay(ls.map((x) => ({ mucLam: x.m, ngay: x.d.ngay ?? '' })))
    const luot: LuotDanhGia[] = ls.map((x, i) => {
      const m = co6[i]!.mucLam ?? null
      const p = x.d.doMuc?.phan ?? kichThuoc.get(x.d.goc)?.phan ?? null
      return {
        phan: (p as LuotDanhGia['phan']) ?? null,
        dung: x.d.ketQua === null ? null : x.d.ketQua === 1,
        ma: m ? m.ma : null,
        thuoc: !!m?.thuoc,
        treo: m?.treo ?? null,
        r: m && m.giayDoc > 0 && !m.uocTinh ? m.giay / m.giayDoc : null,
        pLop: pLop.get(x.d.qid ?? '') ?? null,
        chon: x.d.chon || null,
        coGoiY: x.d.coGoiY,
        songSinh: !!x.d.tc,
        ngay: x.d.ngay ?? '',
        luc: x.d.luc,
      }
    })
    const kt = rKt.filter((x) => str(x.sbd) === sbd)
    const lop = lopEm.get(sbd) ?? ''
    const buoiLop = lop ? rBuoi.filter((x) => str(x.lop) === lop).map((x) => str(x.id)) : []
    const dd = rDd.filter((x) => str(x.sbd) === sbd && buoiLop.includes(str(x.buoi_id)))
    const ct: CanThiep[] = rCt.filter((x) => str(x.sbd) === sbd).map((x) => ({ loai: str(x.loai) as LoaiCanThiep, luc: str(x.gui_luc), emXem: str(x.em_xem_luc) || null, phXem: str(x.ph_xem_luc) || null }))
    const gianLan = ct.filter((c) => c.loai === 'gian_lan_xac_nhan' && c.luc >= tuIso).length
    const kq = danhGiaEm({
      luot,
      ngayCuaSo,
      ktcn: { daNop: kt.filter((x) => str(x.trang_thai) === 'da_nop').length, boHan: kt.filter((x) => str(x.trang_thai) === 'het_han').length, diem: kt.filter((x) => str(x.trang_thai) === 'da_nop' && x.diem !== null).map((x) => num(x.diem)) },
      thi: rThi.filter((x) => str(x.sbd) === sbd).map((x) => ({ roiLan: num(x.so_lan_roi_man), roiGiay: num(x.tong_giay_roi_man) })),
      gianLanXacNhan: gianLan,
      buoi: buoiLop.length ? { tong: buoiLop.length, coMat: dd.filter((x) => str(x.trang_thai) === 'co_mat').length, coPhep: dd.filter((x) => str(x.trang_thai) === 'co_phep').length } : null,
    })
    const vangKhongPhep = buoiLop.length ? Math.max(0, buoiLop.length - dd.length) / buoiLop.length : 0
    const tuanNay: TuanDaTinh = {
      tuan, diem: kq.diem, bacTuan: kq.bacTuan, bac: kq.bacTuan, coDo: kq.coDo,
      coDoNang: { coTinh: kq.soLieu.ngayCoTinh >= 1, gianLan, boVaVang: (kq.soLieu.boKtcn ?? 0) >= 0.75 && vangKhongPhep >= 0.5 },
    }
    const truoc: TuanDaTinh[] = rLs.filter((x) => str(x.sbd) === sbd).slice(0, 4).map((x) => ({
      tuan: str(x.tuan), diem: num(x.diem), bacTuan: num(x.bac_tuan) as 1 | 2 | 3, bac: num(x.bac) as BacDanhGia, coDo: num(x.co_do) === 1,
      coDoNang: json(x.co_do_nang_json, undefined as TuanDaTinh['coDoNang']),
    }))
    const bac = bacTheoLichSu(tuanNay, truoc, ct, kq.tienBo, new Date(nowMs).toISOString())
    ra.push({ sbd, tuan, kq, bac, coDoNang: tuanNay.coDoNang! })
  }
  return ra
}

/** Ghi bản chụp tuần của các em (UPSERT theo (sbd, tuần) — tính lại trong tuần thì thay bản cũ của CHÍNH tuần đó). */
export async function ghiBanChup(env: Env, ds: readonly KetQuaEm[], nowMs: number): Promise<void> {
  if (!ds.length) return
  const nay = new Date(nowMs).toISOString()
  await env.DB.batch(ds.map((x) => env.DB.prepare(
    `INSERT INTO danh_gia_em_tuan (sbd, tuan, diem, bac_tuan, bac, co_do, du_du_lieu, phat_json, so_lieu_json, tien_bo_json, ly_do_json, viec, bang_chung_json, co_do_nang_json, tinh_luc)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(sbd, tuan) DO UPDATE SET diem=excluded.diem, bac_tuan=excluded.bac_tuan, bac=excluded.bac, co_do=excluded.co_do,
       du_du_lieu=excluded.du_du_lieu, phat_json=excluded.phat_json, so_lieu_json=excluded.so_lieu_json, tien_bo_json=excluded.tien_bo_json, ly_do_json=excluded.ly_do_json,
       viec=excluded.viec, bang_chung_json=excluded.bang_chung_json, co_do_nang_json=excluded.co_do_nang_json, tinh_luc=excluded.tinh_luc`,
  ).bind(
    x.sbd, x.tuan, x.kq.diem, x.kq.bacTuan, x.bac.bac, x.kq.coDo ? 1 : 0, x.kq.duDuLieu ? 1 : 0, JSON.stringify(x.kq.phat), JSON.stringify(x.kq.soLieu),
    JSON.stringify(x.kq.tienBo), JSON.stringify(x.bac.lyDo), x.bac.viec, x.bac.bangChung ? JSON.stringify(x.bac.bangChung) : null,
    JSON.stringify(x.coDoNang), nay,
  )))
}

/** Việc tự động khi công tắc «bật»: nhắc em (tuần Đối phó đầu) / báo phụ huynh (tuần thứ 2 liền) — mỗi tuần mỗi loại một lần. ĐUỔI không bao giờ tự gửi. */
export async function lamViecTuDong(env: Env, ds: readonly KetQuaEm[], nowMs: number): Promise<number> {
  const nay = new Date(nowMs).toISOString()
  const lenh = ds.filter((x) => x.bac.viec === 'nhac_em' || x.bac.viec === 'bao_ph').map((x) => env.DB.prepare(
    `INSERT INTO can_thiep_em (id, sbd, loai, noi_dung, tuan, gui_luc, tao_boi) SELECT ?, ?, ?, ?, ?, ?, 'may'
     WHERE NOT EXISTS (SELECT 1 FROM can_thiep_em WHERE sbd = ? AND loai = ? AND tuan = ?)`,
  ).bind(`${x.sbd}|${x.tuan}|${x.bac.viec}`, x.sbd, x.bac.viec, JSON.stringify(x.kq.phat.map((p) => p.chu)), x.tuan, nay, x.sbd, x.bac.viec, x.tuan))
  if (lenh.length) await env.DB.batch(lenh)
  return lenh.length
}

// ───────────────────────── CRON (thứ Hai, ngoài cao điểm, chia lô) ─────────────────────────

const KHOA_CON_TRO = 'danh_gia_hoc_that_con_tro'
/** Gọi mỗi phút từ cron. Thứ Hai 01:00–06:00 giờ VN (hoặc tuần chưa tính xong): dựng tỉ lệ đúng từng câu rồi tính LO_EM em mỗi lượt cho tới hết. */
export async function cronDanhGiaTuan(env: Env, nowMs: number): Promise<{ chay: boolean; soEm?: number; xong?: boolean; lyDo?: string }> {
  const g = new Date(nowMs + 7 * 3600_000)
  const phut = g.getUTCHours() * 60 + g.getUTCMinutes()
  if (phut < 60 || phut >= 360) return { chay: false, lyDo: 'ngoai_gio' }
  const cheDo = await docCheDo(env)
  if (cheDo === 'tat') return { chay: false, lyDo: 'tat' }
  await damBaoBangDanhGia(env)
  const homNay = ngayVn7(nowMs), tuan = thuHaiCua(homNay)
  const ct = json<{ tuan?: string; sau?: string; xong?: boolean }>((await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_CON_TRO).first<Row>().catch(() => null))?.gia_tri, {})
  if (ct.tuan === tuan && ct.xong) return { chay: false, lyDo: 'da_xong' }
  // Chỉ bắt đầu tuần mới vào thứ Hai; tuần đang dở thì làm tiếp bất kể thứ.
  if (ct.tuan !== tuan && g.getUTCDay() !== 1) return { chay: false, lyDo: 'chua_thu_hai' }
  const nay = new Date(nowMs).toISOString()
  const ghiCt = (v: unknown) => env.DB.prepare(`INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc`).bind(KHOA_CON_TRO, JSON.stringify(v), nay).run()
  if (ct.tuan !== tuan) {
    const tu = congNgay7(homNay, -(SO_NGAY_CUA_SO - 1))
    await env.DB.prepare(`INSERT OR REPLACE INTO danh_gia_cau_tuan (tuan, qid, n, dung) SELECT ?1, qid, COUNT(*), SUM(ket_qua = 1) FROM su_kien_hoc
      WHERE ngay_vn BETWEEN ?2 AND ?3 AND ket_qua IS NOT NULL GROUP BY qid HAVING COUNT(*) >= 5`).bind(tuan, tu, homNay).run()
    await ghiCt({ tuan, sau: '', xong: false })
    return { chay: true, soEm: 0 }
  }
  const lo = (await hoi(env, "SELECT sbd FROM hoc_sinh WHERE sbd > ?1 AND COALESCE(trang_thai, '') <> 'khoa' ORDER BY sbd LIMIT ?2", ct.sau ?? '', LO_EM)).map((x) => str(x.sbd))
  if (!lo.length) { await ghiCt({ tuan, sau: ct.sau, xong: true }); return { chay: true, soEm: 0, xong: true } }
  const ds = await tinhLoEm(env, lo, nowMs)
  await ghiBanChup(env, ds, nowMs)
  if (cheDo === 'bat') await lamViecTuDong(env, ds, nowMs)
  await ghiCt({ tuan, sau: lo[lo.length - 1], xong: false })
  return { chay: true, soEm: ds.length }
}

// ───────────────────────── LỆNH THẦY ─────────────────────────

const docBanChupMoiNhat = async (env: Env, sbds?: readonly string[]): Promise<Row[]> => {
  await damBaoBangDanhGia(env)
  const t = str((await hoi(env, 'SELECT MAX(tuan) AS t FROM danh_gia_em_tuan'))[0]?.t)
  if (!t) return []
  return sbds?.length
    ? hoi(env, 'SELECT * FROM danh_gia_em_tuan WHERE tuan = ?1 AND sbd IN (SELECT value FROM json_each(?2))', t, JSON.stringify(sbds))
    : hoi(env, 'SELECT * FROM danh_gia_em_tuan WHERE tuan = ?1', t)
}
const banChupRa = (x: Row) => ({
  sbd: str(x.sbd), tuan: str(x.tuan), diem: num(x.diem), bac: num(x.bac) as BacDanhGia, tenBac: TEN_BAC[(num(x.bac) || 1) as BacDanhGia], bacTuan: num(x.bac_tuan),
  duDuLieu: num(x.du_du_lieu) === 1, coDo: num(x.co_do) === 1, phat: json(x.phat_json, [] as unknown[]), soLieu: json(x.so_lieu_json, {}), tienBo: json(x.tien_bo_json, {}),
  lyDo: json(x.ly_do_json, [] as string[]), viec: str(x.viec) || null, bangChung: json(x.bang_chung_json, null as unknown), tinhLuc: str(x.tinh_luc),
})

/** `POST /gv/danh-gia/lop` — bản chụp tuần mới nhất của mọi em (+ tên, lớp) + công tắc. Nhãn mù KHÔNG kèm ở đây (màn gán nhãn đọc riêng). */
export async function gvDanhGiaLop(env: Env): Promise<Row> {
  const [cheDo, ds, hs] = await Promise.all([docCheDo(env), docBanChupMoiNhat(env), hoi(env, "SELECT sbd, ho_ten, lop FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa'")])
  const ten = new Map(hs.map((x) => [str(x.sbd), { ten: str(x.ho_ten), lop: str(x.lop) }]))
  return { ok: true, cheDo, em: ds.map((x) => ({ ...banChupRa(x), ...(ten.get(str(x.sbd)) ?? { ten: str(x.sbd), lop: '' }) })) }
}

/** `POST /gv/danh-gia/em {sbd}` — tính TRỰC TIẾP tuần này (không ghi) + các tuần đã lưu + nhật ký can thiệp: hồ sơ một em / hồ sơ bằng chứng ĐUỔI. */
export async function gvDanhGiaEm(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  const sbd = str(b.sbd)
  if (!sbd || sbd.length > 40) return { ok: false, error: 'Thiếu mã học sinh.' }
  await damBaoBangDanhGia(env)
  const [hien, ls, ct, hs] = await Promise.all([
    tinhLoEm(env, [sbd], nowMs),
    hoi(env, 'SELECT * FROM danh_gia_em_tuan WHERE sbd = ? ORDER BY tuan DESC LIMIT 12', sbd),
    hoi(env, 'SELECT id, loai, noi_dung, tuan, gui_luc, em_xem_luc, ph_xem_luc, tao_boi FROM can_thiep_em WHERE sbd = ? ORDER BY gui_luc DESC LIMIT 50', sbd),
    hoi(env, 'SELECT ho_ten, lop FROM hoc_sinh WHERE sbd = ?', sbd),
  ])
  const h = hien[0]
  return {
    ok: true,
    em: { sbd, ten: str(hs[0]?.ho_ten) || sbd, lop: str(hs[0]?.lop) },
    hienTai: h ? { tuan: h.tuan, diem: h.kq.diem, bacTuan: h.kq.bacTuan, bac: h.bac.bac, tenBac: TEN_BAC[h.bac.bac], duDuLieu: h.kq.duDuLieu, coDo: h.kq.coDo, phat: h.kq.phat, soLieu: h.kq.soLieu, tienBo: h.kq.tienBo, lyDo: h.bac.lyDo, viec: h.bac.viec, bangChung: h.bac.bangChung ?? null } : null,
    lichSu: ls.map(banChupRa),
    canThiep: ct.map((x) => ({ id: str(x.id), loai: str(x.loai), noiDung: json(x.noi_dung, str(x.noi_dung) as unknown), tuan: str(x.tuan), guiLuc: str(x.gui_luc), emXem: str(x.em_xem_luc) || null, phXem: str(x.ph_xem_luc) || null, taoBoi: str(x.tao_boi) })),
  }
}

/** `POST /gv/danh-gia/tinh-lai {sbds?}` — tính + lưu bản chụp tuần NGAY cho ≤ 25 em (vắng ⇒ lô kế tiếp theo con trỏ riêng). Màn hiệu chỉnh gọi lặp. KHÔNG làm việc tự động. */
export async function gvDanhGiaTinhLai(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  await damBaoBangDanhGia(env)
  let sbds = (Array.isArray(b.sbds) ? b.sbds : []).map(str).filter((x) => x && x.length <= 40).slice(0, LO_EM)
  const sau = str(b.sau)
  if (!sbds.length) sbds = (await hoi(env, "SELECT sbd FROM hoc_sinh WHERE sbd > ?1 AND COALESCE(trang_thai, '') <> 'khoa' ORDER BY sbd LIMIT ?2", sau, LO_EM)).map((x) => str(x.sbd))
  if (!sbds.length) return { ok: true, soEm: 0, xong: true }
  // Tỉ lệ đúng từng câu của tuần: dựng nếu tuần này chưa có (một câu gộp, ngoài giờ cao điểm thầy mới bấm).
  const den = ngayVn7(nowMs), tuan = thuHaiCua(den)
  const coCau = await hoi(env, 'SELECT 1 FROM danh_gia_cau_tuan WHERE tuan = ? LIMIT 1', tuan)
  if (!coCau.length) {
    await env.DB.prepare(`INSERT OR REPLACE INTO danh_gia_cau_tuan (tuan, qid, n, dung) SELECT ?1, qid, COUNT(*), SUM(ket_qua = 1) FROM su_kien_hoc
      WHERE ngay_vn BETWEEN ?2 AND ?3 AND ket_qua IS NOT NULL GROUP BY qid HAVING COUNT(*) >= 5`).bind(tuan, congNgay7(den, -(SO_NGAY_CUA_SO - 1)), den).run()
  }
  const ds = await tinhLoEm(env, sbds, nowMs)
  await ghiBanChup(env, ds, nowMs)
  return { ok: true, soEm: ds.length, sau: sbds[sbds.length - 1], xong: sbds.length < LO_EM }
}

const LOAI_THAY: readonly LoaiCanThiep[] = ['nhac_em', 'bao_ph', 'thay_goi_ph', 'cam_ket', 'xac_nhan_nghi', 'cho_them', 'gian_lan_xac_nhan']
/** `POST /gv/danh-gia/can-thiep {sbd, loai, noiDung?}` — thầy ghi một lần can thiệp. «xac_nhan_nghi» là bước DUY NHẤT gửi tin ĐUỔI cho phụ huynh. */
export async function gvDanhGiaCanThiep(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  const sbd = str(b.sbd), loai = str(b.loai) as LoaiCanThiep
  if (!sbd || sbd.length > 40) return { ok: false, error: 'Thiếu mã học sinh.' }
  if (!LOAI_THAY.includes(loai)) return { ok: false, error: 'Loại can thiệp không hợp lệ.' }
  await damBaoBangDanhGia(env)
  const nay = new Date(nowMs).toISOString()
  const id = `${sbd}|${loai}|${nowMs}`
  await env.DB.prepare(`INSERT INTO can_thiep_em (id, sbd, loai, noi_dung, tuan, gui_luc, tao_boi) VALUES (?, ?, ?, ?, ?, ?, 'thay')`)
    .bind(id, sbd, loai, str(b.noiDung).slice(0, 2000) || null, thuHaiCua(ngayVn7(nowMs)), nay).run()
  return { ok: true, id }
}

const NHAN_MU = ['hoc_that', 'doi_pho', 'khong_day_noi'] as const
/** `POST /gv/danh-gia/nhan-mu {sbd?, nhan?, soSanh?}` — gán / bỏ nhãn mù; đọc danh sách nhãn. `soSanh` (chỉ khi đã gán ≥ 30 em) ⇒ kèm bảng khớp với máy. */
export async function gvDanhGiaNhanMu(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  await damBaoBangDanhGia(env)
  const sbd = str(b.sbd), nhan = str(b.nhan)
  if (sbd) {
    if (nhan && !(NHAN_MU as readonly string[]).includes(nhan)) return { ok: false, error: 'Nhãn không hợp lệ.' }
    if (nhan) await env.DB.prepare('INSERT INTO nhan_mu_thay (sbd, nhan, luc) VALUES (?, ?, ?) ON CONFLICT(sbd) DO UPDATE SET nhan = excluded.nhan, luc = excluded.luc').bind(sbd, nhan, new Date(nowMs).toISOString()).run()
    else await env.DB.prepare('DELETE FROM nhan_mu_thay WHERE sbd = ?').bind(sbd).run()
  }
  const ds = await hoi(env, 'SELECT sbd, nhan, luc FROM nhan_mu_thay')
  const ra: Row = { ok: true, nhan: ds.map((x) => ({ sbd: str(x.sbd), nhan: str(x.nhan) })) }
  if (b.soSanh === true && ds.length >= 30) {
    const may = new Map((await docBanChupMoiNhat(env, ds.map((x) => str(x.sbd)))).map((x) => [str(x.sbd), num(x.bac) as BacDanhGia]))
    let khop = 0, coMay = 0, hocThatBiNang = 0
    const lech: Row[] = []
    for (const x of ds) {
      const b2 = may.get(str(x.sbd))
      if (!b2) continue
      coMay++
      const nhomMay = b2 <= 2 ? 'hoc_that' : b2 === 3 ? 'doi_pho' : 'khong_day_noi'
      if (nhomMay === str(x.nhan)) khop++
      else lech.push({ sbd: str(x.sbd), thay: str(x.nhan), may: TEN_BAC[b2] })
      if (str(x.nhan) === 'hoc_that' && b2 >= 4) hocThatBiNang++
    }
    ra.soSanh = { coMay, khop, tiLeKhop: coMay ? khop / coMay : null, hocThatBiNang, lech }
  }
  return ra
}

/** `POST /gv/danh-gia/che-do {cheDo?}` — đọc / đặt công tắc. */
export async function gvDanhGiaCheDo(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  const v = str(b.cheDo)
  if (v) {
    if (v !== 'tat' && v !== 'ngam' && v !== 'bat') return { ok: false, error: 'Chế độ không hợp lệ.' }
    await ghiCheDo(env, v, new Date(nowMs).toISOString())
  }
  return { ok: true, cheDo: await docCheDo(env) }
}

// ───────────────────────── LỆNH HỌC SINH / PHỤ HUYNH (chỉ khi «bật»; chỉ Học thật / Đối phó) ─────────────────────────

async function banCongKhai(env: Env, sbd: string, ai: 'em' | 'ph', nowMs: number): Promise<Row> {
  if ((await docCheDo(env)) !== 'bat') return { ok: true, bat: false }
  await damBaoBangDanhGia(env)
  const [ls, ct] = await Promise.all([
    hoi(env, 'SELECT tuan, diem, bac, phat_json, so_lieu_json, tien_bo_json FROM danh_gia_em_tuan WHERE sbd = ? ORDER BY tuan DESC LIMIT 6', sbd),
    hoi(env, `SELECT id, loai, noi_dung, gui_luc, em_xem_luc, ph_xem_luc FROM can_thiep_em WHERE sbd = ? AND loai IN ('nhac_em', 'bao_ph', 'xac_nhan_nghi') ORDER BY gui_luc DESC LIMIT 6`, sbd),
  ])
  const moi = ls[0]
  // Đánh dấu ĐÃ XEM các tin của đúng người đọc (bằng chứng cho luật «can thiệp đã xem»).
  const cot = ai === 'em' ? 'em_xem_luc' : 'ph_xem_luc'
  const loaiCua = ai === 'em' ? ['nhac_em'] : ['bao_ph', 'xac_nhan_nghi']
  const chuaXem = ct.filter((x) => loaiCua.includes(str(x.loai)) && !str(x[cot]))
  if (chuaXem.length) await env.DB.batch(chuaXem.map((x) => env.DB.prepare(`UPDATE can_thiep_em SET ${cot} = ? WHERE id = ? AND ${cot} IS NULL`).bind(new Date(nowMs).toISOString(), str(x.id)))).catch(() => undefined)
  if (!moi) return { ok: true, bat: true, coDanhGia: false }
  const bac = bacCongKhai(num(moi.bac) as BacDanhGia)
  return {
    ok: true,
    bat: true,
    coDanhGia: true,
    tuan: str(moi.tuan),
    nhan: bac === 1 ? 'Học thật' : 'Đối phó',
    // Lý do bằng số CHỈ khi Đối phó (tự sửa được); Học thật ⇒ không liệt kê lỗi nhỏ.
    lyDo: bac === 3 ? json(moi.phat_json, [] as { chu: string }[]).map((p) => p.chu) : [],
    soLieu: json(moi.so_lieu_json, {}),
    tienBo: json(moi.tien_bo_json, {}),
    lichSu: ls.map((x) => ({ tuan: str(x.tuan), nhan: bacCongKhai(num(x.bac) as BacDanhGia) === 1 ? 'Học thật' : 'Đối phó' })),
    tin: ct.filter((x) => loaiCua.includes(str(x.loai))).map((x) => ({ loai: str(x.loai) === 'xac_nhan_nghi' ? 'thong_bao_nghi' : str(x.loai), noiDung: json(x.noi_dung, str(x.noi_dung) as unknown), guiLuc: str(x.gui_luc) })),
  }
}

/** `POST /hs/danh-gia {token}` */
export async function hsDanhGia(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  let sbd = ''
  try { sbd = await gameIdentity(env, b) } catch { return { ok: false, error: 'Em cần đăng nhập lại.' } }
  if (!sbd || sbd.length > 40) return { ok: false, error: 'Em cần đăng nhập lại.' }
  return banCongKhai(env, sbd, 'em', nowMs)
}

/** `POST /ph/danh-gia {pass|sbd}` */
export async function phDanhGia(env: Env, b: Row, nowMs = Date.now(), ctx?: ExecutionContext): Promise<Row> {
  const { sbd } = await sbdCuaPhuHuynh(env, b, 'ph-danh-gia', { chiToken: CHI_NHAN_TOKEN, envGhi: env, ctx })
  return banCongKhai(env, sbd, 'ph', nowMs)
}
