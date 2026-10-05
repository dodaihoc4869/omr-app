// HỌC LIỆU MÁY SOẠN (05/10) — LỚP D1 + ĐƯỜNG CỦA THẦY. Lõi thuần (bộ kiểm, hai lượt, tự xử cờ): server/src/may-soan-kiem.ts. Kho ý Đ–S: cau-y-ds.ts.
//
//   · `/kho/may-soan/nop-bo-tro {qid, bam, songSinh?, yMoi?}` — máy soạn nộp bản khác + ý mới ĐÃ QUA HAI LƯỢT KHỚP (cổng mã bí mật như
//     /kho/loi-giai/nop). Máy chủ dựng câu gốc từ KHO, kiểm lại từng mục + bằng chứng `kiem.d2`, rồi: bản khác ⇒ NỐI vào
//     `cau_bo_tro.song_sinh_json` (các bản đã có giữ nguyên vị trí — qid ảo ~ssN trong sổ không đổi nghĩa; dừng khi đủ 4 bản dùng được; mỗi bản
//     mang khối/mã tờ của câu gốc: `qid_mau`, `ma_de`, `lop`); ý ⇒ `cau_y_ds`. Không sửa / xoá gì đã có.
//   · `/kho/may-soan/nop-y-ds` — chỉ kho ý (cau-y-ds.ts). `/kho/may-soan/hang-em-sai {lamMoi?, lop?}` — xem hàng câu em đã sai (thầy / điều phối).
//   · HÀNG SOẠN ƯU TIÊN CÂU EM ĐÃ SAI MÀ CHƯA CÓ BẢN KHÁC (`lamMoiHangEmSai`; `layViec` gọi, ≤ 1 lần / 15 phút): sổ `su_kien_hoc` từ 29/09, lượt
//     TỰ LÀM sai (bỏ đọc lời giải · lướt · có hỗ trợ · bị che; câu ca thi chỉ khi ca ĐÃ công bố — đúng bộ lọc `docQidSaiV2` của hang-chua-loi.ts)
//     ⇒ câu Phần I/III chưa có bản khác dùng được, Phần II chưa có kho ý, lên đầu hàng, nhiều em sai trước: câu chưa có hồ sơ ⇒ nâng việc hồ sơ
//     (`loi_giai_viec`); đã có hồ sơ (hoặc chương chưa có bộ chìa khoá) ⇒ việc "chỉ học liệu" ở bảng `may_soan_viec`. Sau đó mới tới thứ tự cũ.
//   · `ghiNghiTuXu`: hồ sơ vẫn còn cờ đáp án sau khi máy tự xử (giải lại độc lập vẫn lệch) ⇒ mọi bản cùng nội dung vào `cau_nghi_dap_an` 'nghi'
//     (cơ chế sẵn có của tu-hoan-thien.ts — rút đề ca kiểm tra tạm bỏ câu qua `/ca/cau-nghi-dap-an`) — không đẩy việc cho thầy, không sửa đáp án kho.
// Bảng CHỈ-THÊM `may_soan_viec` (tự tạo lúc dùng; bản SQL: server/migration-0510-y-ds.sql).
import type { Env } from './kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { TU_NGAY } from './loi-hoc-luat'
import { damBaoBangBoTro, docBoTro, songSinhDuDuLieu, type SongSinh } from './cau-bo-tro'
import { damBaoBangTuHoanThien } from './tu-hoan-thien'
import { BO_CHIA_KHOA } from '../../src/lib/loi-giai-bo'
import { khoiCuaLop, locCauHopKhoi } from '../../src/lib/khoi-cau'
import {
  cauGocTuKho, nhanBanKhacNop, qidGocMaySoan, SO_BAN_KHAC_TOI_DA, thieuBanKhac, tinhCan, uuTienEmSai,
  type CanSoan, type CauGoc, type DaCo, type MucBo, type MucThieu,
} from './may-soan-kiem'
import { chuYDsTheoBam, docCauKhoHienTai, metaCua, nhanVaGhiYDs, nopYDs, type MetaGoc } from './cau-y-ds'
import type { DangLoiGiai } from '../../src/lib/loi-giai-kiem'

type Obj = Record<string, unknown>
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v)).trim()

export const SQL_BANG_MAY_SOAN: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS may_soan_viec (bam TEXT PRIMARY KEY, qid TEXT NOT NULL, ma_de TEXT NOT NULL, dang TEXT NOT NULL, lop TEXT, bo TEXT,
    so_em_sai INTEGER NOT NULL DEFAULT 0, thieu TEXT, uu_tien INTEGER NOT NULL DEFAULT 0, trang_thai TEXT NOT NULL, so_lan INTEGER NOT NULL DEFAULT 0,
    ma_luot TEXT, nhan_luc TEXT, loi TEXT, tao_luc TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS may_soan_viec_hang ON may_soan_viec(trang_thai, bo, uu_tien)',
]
const daTao = new WeakMap<object, Promise<void>>()
export function damBaoBangMaySoan(env: Env): Promise<void> {
  const k = env.DB as unknown as object
  let p = daTao.get(k)
  if (!p) {
    p = env.DB.batch(SQL_BANG_MAY_SOAN.map((s) => env.DB.prepare(s))).then(() => undefined)
    p.catch(() => daTao.delete(k))
    daTao.set(k, p)
  }
  return p
}

/** Khoá `cau_hinh`: lúc làm mới hàng câu em đã sai gần nhất (giãn ≥ 15 phút — đọc sổ cả trung tâm không chạy mỗi lô). */
export const KHOA_MOC_EM_SAI = 'may_soan_em_sai_luc'
const PHUT_LAM_MOI_EM_SAI = 15
/** Nhiều nhất chừng này câu (theo số em sai) mỗi lượt làm mới; trần dòng sổ đọc mỗi lượt. */
const TRAN_CAU_EM_SAI = 400
const TRAN_DONG_SO = 80_000
/** Việc "chỉ học liệu" thử quá chừng này lần mà vẫn thiếu ⇒ 'truot' (thôi giao, không lặp vô hạn). */
export const SO_LAN_TOI_DA_BO_TRO = 3

const phanCua = (dang: string): 'I' | 'II' | 'III' => (dang === 'tn' ? 'I' : dang === 'ds' ? 'II' : 'III')
/** Bản khác game dùng được (cùng luật `songSinhDuDuLieu`); bản hỏng khuôn ⇒ không dùng được, không ném. */
const dungDuoc = (phan: string, ss: SongSinh): boolean => { try { return songSinhDuDuLieu(phan, ss) } catch { return false } }

// ---------------------------------------------------------------- tình trạng học liệu của một nhóm câu

export interface TinhTrangBoTro { soBanDung: number; banKhac: DaCo['banKhac']; soY: number; yChu: string[]; nghi: boolean }

/** Băm có ít nhất một bản (cùng nội dung) đang nằm diện nghi đáp án. Bảng chưa có ⇒ rỗng. */
async function docBamNghi(env: Env, bams: readonly string[]): Promise<Set<string>> {
  const ra = new Set<string>()
  for (let i = 0; i < bams.length; i += 90) {
    const r = await env.DB.prepare(`SELECT DISTINCT q.bam FROM loi_giai_cau q JOIN cau_nghi_dap_an n ON n.qid = q.qid AND n.trang_thai = 'nghi'
      WHERE q.bam IN (SELECT value FROM json_each(?))`).bind(JSON.stringify(bams.slice(i, i + 90))).all<Obj>().catch(() => ({ results: [] as Obj[] }))
    for (const x of r.results ?? []) ra.add(str(x.bam))
  }
  return ra
}

/** Bản khác (mọi bản + số bản dùng được), ý Đ–S mới, diện nghi — của một nhóm câu theo băm. */
export async function docTinhTrangBoTro(env: Env, ds: readonly { bam: string; dang: string }[]): Promise<Map<string, TinhTrangBoTro>> {
  const ra = new Map<string, TinhTrangBoTro>()
  const bams = [...new Set(ds.map((x) => x.bam).filter(Boolean))]
  if (!bams.length) return ra
  const dangCua = new Map(ds.map((x) => [x.bam, x.dang]))
  const [bt, y, nghi] = await Promise.all([
    docBoTro(env, bams).catch(() => new Map<string, { songSinh: SongSinh[] }>()),
    chuYDsTheoBam(env, bams).catch(() => new Map<string, string[]>()),
    docBamNghi(env, bams),
  ])
  for (const b of bams) {
    const ss = bt.get(b)?.songSinh ?? []
    const yc = y.get(b) ?? []
    ra.set(b, {
      soBanDung: ss.filter((x) => dungDuoc(phanCua(dangCua.get(b) ?? ''), x)).length,
      banKhac: ss.map((x) => ({ de: String(x.de ?? ''), dap_an: String(x.dap_an ?? ''), ...(x.pa ? { pa: x.pa } : {}), ...(x.bang ? { bang: x.bang } : {}) })),
      soY: yc.length, yChu: yc, nghi: nghi.has(b),
    })
  }
  return ra
}

/** Việc giao (`can`) + học liệu đã có (`daCo`, để máy soạn không soạn trùng) cho các câu của một lô. Lỗi đọc ⇒ chỉ hồ sơ. */
export async function canVaDaCoChoViec(env: Env, ds: readonly { bam: string; dang: string; kieuKho?: unknown; hoSo: boolean }[], boTro = true):
  Promise<Map<string, { can: CanSoan; daCo: DaCo }>> {
  const ra = new Map<string, { can: CanSoan; daCo: DaCo }>()
  const tt = boTro ? await docTinhTrangBoTro(env, ds).catch(() => new Map<string, TinhTrangBoTro>()) : new Map<string, TinhTrangBoTro>()
  for (const x of ds) {
    const t = tt.get(x.bam)
    ra.set(x.bam, {
      can: tinhCan({ dang: x.dang as DangLoiGiai, kieuKho: x.kieuKho, hoSo: x.hoSo, soBanDung: t?.soBanDung ?? 0, soY: t?.soY ?? 0, nghi: t?.nghi, boTro }),
      daCo: { banKhac: t?.banKhac ?? [], yDs: t?.yChu ?? [] },
    })
  }
  return ra
}

// ---------------------------------------------------------------- hàng soạn: câu em đã sai chưa có bản khác lên đầu

/**
 * Sổ ⇒ câu gốc → các em đã SAI TỰ LÀM từ 29/09 (mọi kênh). Bộ lọc y như `docQidSaiV2` (hang-chua-loi.ts): bỏ dòng đọc lời giải + lướt
 * (`SQL_LA_LAN_LAM`), lượt có hỗ trợ, dòng bị che (ca chưa công bố); câu ca thi chỉ tính khi ca ĐÃ công bố — không lộ câu ca thi chưa công bố;
 * bỏ trống chỉ tính sai ở ca thi. D1 cũ thiếu cột ⇒ lùi bộ lọc cũ. Lỗi ⇒ rỗng.
 */
export async function docCauEmSai(env: Env): Promise<Map<string, Set<string>>> {
  const sql = (moi: boolean) => `SELECT qid, sbd FROM su_kien_hoc WHERE ngay_vn >= ? AND luc >= ?
      AND (ket_qua = 0 OR (ket_qua IS NULL AND nguon = 'thi')) AND COALESCE(qid, '') <> ''
      AND (nguon <> 'thi' OR EXISTS (SELECT 1 FROM ca c WHERE c.ma_ca = su_kien_hoc.ma_nguon AND c.trang_thai <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')}))
      ${moi ? `AND ${SQL_LA_LAN_LAM} AND COALESCE(assistance, '') <> 'assisted' AND COALESCE(visibility, '') <> 'embargoed'` : ''}
    GROUP BY qid, sbd LIMIT ${TRAN_DONG_SO}`
  // `luc` chỉ để dùng chỉ mục idx_skh_luc: mốc lùi một ngày (chuỗi giờ của mọi nguồn đều bắt đầu bằng ngày) — lọc thật là `ngay_vn`.
  const lucTu = new Date(Date.parse(`${TU_NGAY}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10)
  let rows: Obj[]
  try { rows = (await env.DB.prepare(sql(true)).bind(TU_NGAY, lucTu).all<Obj>()).results ?? [] } catch {
    try { rows = (await env.DB.prepare(sql(false)).bind(TU_NGAY, lucTu).all<Obj>()).results ?? [] } catch { return new Map() }
  }
  const ra = new Map<string, Set<string>>()
  for (const x of rows) {
    const q = qidGocMaySoan(str(x.qid)), sbd = str(x.sbd)
    if (!q || !sbd) continue
    const s = ra.get(q) ?? new Set<string>()
    s.add(sbd)
    ra.set(q, s)
  }
  return ra
}

export interface MucEmSai { bam: string; qid: string; maDe: string; dang: string; lop: string; bo: string; soEm: number }
export type HanhDongEmSai =
  | { loai: 'nang_ho_so'; bam: string; uuTien: number }
  | { loai: 'mo_hoc_lieu'; muc: MucEmSai; thieu: 'han' | 'mot_phan'; uuTien: number }
  | { loai: 'dong_hoc_lieu'; bam: string }

/**
 * THUẦN — quyết định cho mỗi câu em đã sai: còn thiếu bản khác (Phần II: kho ý) ⇒ việc hồ sơ đang chờ (chương có bộ chìa khoá) được NÂNG ưu tiên;
 * không có việc hồ sơ đang chờ ⇒ MỞ việc "chỉ học liệu"; đã đủ ⇒ đóng việc học liệu đang chờ. Câu nghi đáp án ⇒ bỏ qua.
 * Việc đang làm (`dang`) hoặc đã thôi (`truot`) ⇒ không đụng.
 */
export function quyetDinhEmSai(
  ds: readonly MucEmSai[], tt: ReadonlyMap<string, TinhTrangBoTro>, viecHoSo: ReadonlyMap<string, string>,
  viecHocLieu: ReadonlyMap<string, string>, boCo: ReadonlySet<string>,
): HanhDongEmSai[] {
  const ra: HanhDongEmSai[] = []
  for (const m of ds) {
    const t = tt.get(m.bam)
    if (t?.nghi) continue
    const thieu: MucThieu = thieuBanKhac(m.dang as DangLoiGiai, t?.soBanDung ?? 0, t?.soY ?? 0)
    const hl = viecHocLieu.get(m.bam)
    if (!thieu) { if (hl === 'cho') ra.push({ loai: 'dong_hoc_lieu', bam: m.bam }); continue }
    const uuTien = uuTienEmSai(m.soEm, thieu)
    const hs = viecHoSo.get(m.bam)
    if (hs === 'cho' && boCo.has(m.bo)) { ra.push({ loai: 'nang_ho_so', bam: m.bam, uuTien }); continue }
    if (hs === 'dang' || hl === 'dang' || hl === 'truot') continue
    ra.push({ loai: 'mo_hoc_lieu', muc: m, thieu, uuTien })
  }
  return ra
}

/**
 * LÀM MỚI HÀNG theo câu em đã sai (gọi đầu mỗi `layViec`; giãn ≥ 15 phút, `ep` ⇒ chạy ngay). Ghi mốc TRƯỚC khi đọc sổ ⇒ 4 luồng gọi cùng lúc
 * chỉ một luồng đọc. Chỉ đụng hai bảng hàng việc (`loi_giai_viec.uu_tien`, `may_soan_viec`) — không đổi dữ liệu học của em.
 */
export async function lamMoiHangEmSai(env: Env, nowMs = Date.now(), ep = false): Promise<Obj> {
  await damBaoBangMaySoan(env)
  const iso = new Date(nowMs).toISOString()
  if (!ep) {
    const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_MOC_EM_SAI).first<Obj>().catch(() => null)
    const t = Date.parse(str(r?.gia_tri))
    if (Number.isFinite(t) && nowMs >= t && nowMs - t < PHUT_LAM_MOI_EM_SAI * 60_000) return { chay: false, lyDo: 'vừa làm mới' }
  }
  await env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?,?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
    .bind(KHOA_MOC_EM_SAI, iso, iso).run().catch(() => null)
  const emSai = await docCauEmSai(env)
  if (!emSai.size) return { chay: true, soCau: 0, nangHoSo: 0, moHocLieu: 0, dongHocLieu: 0 }
  // qid gốc → câu trong hàng lời giải (băm); bản trùng ở nhiều tờ gộp về một băm, các em sai cộng hợp.
  const qids = [...emSai.keys()]
  const theoBam = new Map<string, MucEmSai & { em: Set<string> }>()
  for (let i = 0; i < qids.length; i += 90) {
    const r = await env.DB.prepare('SELECT qid, bam, ma_de, dang, lop, bo FROM loi_giai_cau WHERE qid IN (SELECT value FROM json_each(?))')
      .bind(JSON.stringify(qids.slice(i, i + 90))).all<Obj>().catch(() => ({ results: [] as Obj[] }))
    for (const x of r.results ?? []) {
      const bam = str(x.bam), em = emSai.get(str(x.qid))
      if (!bam || !em) continue
      const cu = theoBam.get(bam)
      if (cu) { for (const s of em) cu.em.add(s); continue }
      theoBam.set(bam, { bam, qid: str(x.qid), maDe: str(x.ma_de), dang: str(x.dang), lop: str(x.lop), bo: str(x.bo), soEm: 0, em: new Set(em) })
    }
  }
  const ds: MucEmSai[] = [...theoBam.values()].map(({ em, ...m }) => ({ ...m, soEm: em.size }))
    .sort((a, b) => b.soEm - a.soEm || a.qid.localeCompare(b.qid)).slice(0, TRAN_CAU_EM_SAI)
  const bams = ds.map((x) => x.bam)
  const tt = await docTinhTrangBoTro(env, ds)
  const viecHoSo = new Map<string, string>(), viecHocLieu = new Map<string, string>()
  for (let i = 0; i < bams.length; i += 90) {
    const j = JSON.stringify(bams.slice(i, i + 90))
    const [a, b] = await Promise.all([
      env.DB.prepare('SELECT bam, trang_thai FROM loi_giai_viec WHERE bam IN (SELECT value FROM json_each(?))').bind(j).all<Obj>().catch(() => ({ results: [] as Obj[] })),
      env.DB.prepare('SELECT bam, trang_thai FROM may_soan_viec WHERE bam IN (SELECT value FROM json_each(?))').bind(j).all<Obj>().catch(() => ({ results: [] as Obj[] })),
    ])
    for (const x of a.results ?? []) viecHoSo.set(str(x.bam), str(x.trang_thai))
    for (const x of b.results ?? []) viecHocLieu.set(str(x.bam), str(x.trang_thai))
  }
  const hd = quyetDinhEmSai(ds, tt, viecHoSo, viecHocLieu, new Set(Object.keys(BO_CHIA_KHOA)))
  const lenh = hd.map((h) => {
    if (h.loai === 'nang_ho_so') return env.DB.prepare("UPDATE loi_giai_viec SET uu_tien = MAX(uu_tien, ?) WHERE bam = ? AND trang_thai = 'cho'").bind(h.uuTien, h.bam)
    if (h.loai === 'dong_hoc_lieu') return env.DB.prepare("UPDATE may_soan_viec SET trang_thai = 'xong', ma_luot = NULL, loi = NULL, cap_nhat_luc = ? WHERE bam = ? AND trang_thai = 'cho'").bind(iso, h.bam)
    const m = h.muc
    return env.DB.prepare(
      `INSERT INTO may_soan_viec (bam, qid, ma_de, dang, lop, bo, so_em_sai, thieu, uu_tien, trang_thai, so_lan, tao_luc, cap_nhat_luc) VALUES (?,?,?,?,?,?,?,?,?,'cho',0,?,?)
       ON CONFLICT(bam) DO UPDATE SET so_em_sai = excluded.so_em_sai, thieu = excluded.thieu, uu_tien = excluded.uu_tien, trang_thai = 'cho', cap_nhat_luc = excluded.cap_nhat_luc
       WHERE may_soan_viec.trang_thai IN ('cho', 'xong')`,
    ).bind(m.bam, m.qid, m.maDe, m.dang, m.lop, m.bo, m.soEm, h.thieu, h.uuTien, iso, iso)
  })
  for (let i = 0; i < lenh.length; i += 100) await env.DB.batch(lenh.slice(i, i + 100))
  const dem = (l: HanhDongEmSai['loai']) => hd.filter((h) => h.loai === l).length
  return { chay: true, soCau: ds.length, nangHoSo: dem('nang_ho_so'), moHocLieu: dem('mo_hoc_lieu'), dongHocLieu: dem('dong_hoc_lieu') }
}

/** `/kho/may-soan/hang-em-sai {lamMoi?, lop?}` — hàng câu em đã sai (việc chỉ học liệu + việc hồ sơ đã nâng). `lop` ⇒ lọc qua luật khối chung. */
export async function hangEmSai(env: Env, b: Obj): Promise<Obj> {
  await damBaoBangMaySoan(env)
  const lamMoi = b.lamMoi === true ? await lamMoiHangEmSai(env, Date.now(), true) : null
  const hocLieu = (await env.DB.prepare(`SELECT bam, qid, ma_de, dang, lop, bo, so_em_sai, thieu, uu_tien, trang_thai, so_lan, loi FROM may_soan_viec
    ORDER BY CASE trang_thai WHEN 'cho' THEN 0 WHEN 'dang' THEN 1 ELSE 2 END, uu_tien DESC LIMIT 300`).all<Obj>()).results ?? []
  const hoSo = (await env.DB.prepare(`SELECT bam, qid, ma_de, dang, lop, bo, uu_tien, trang_thai FROM loi_giai_viec WHERE uu_tien >= ? AND trang_thai IN ('cho', 'dang')
    ORDER BY uu_tien DESC LIMIT 300`).bind(uuTienEmSai(0, 'mot_phan')).all<Obj>().catch(() => ({ results: [] as Obj[] }))).results ?? []
  // Danh sách câu cho thầy theo lớp ⇒ lọc bằng luật khối dùng chung (src/lib/khoi-cau.ts).
  const khoi = str(b.lop) ? khoiCuaLop(str(b.lop)) : null
  return { ok: true, lamMoi, hocLieu: khoi ? locCauHopKhoi(khoi, hocLieu) : hocLieu, hoSo: khoi ? locCauHopKhoi(khoi, hoSo) : hoSo }
}

// ---------------------------------------------------------------- nhận học liệu máy soạn nộp

/** Nối bản khác vào `cau_bo_tro.song_sinh_json`: các bản đã có GIỮ NGUYÊN (vị trí, nội dung); thêm tới khi đủ 4 bản dùng được. */
export async function nhanVaGhiBanKhac(env: Env, goc: CauGoc, meta: MetaGoc, ds: unknown): Promise<{ giu: number; bo: MucBo[]; tong: number }> {
  await damBaoBangBoTro(env)
  const daCoTat = (await docBoTro(env, [goc.bam])).get(goc.bam)?.songSinh ?? []
  const daCo: DaCo = { banKhac: daCoTat.map((x) => ({ de: String(x.de ?? ''), dap_an: String(x.dap_an ?? ''), ...(x.pa ? { pa: x.pa } : {}), ...(x.bang ? { bang: x.bang } : {}) })), yDs: [] }
  const { giu, bo } = nhanBanKhacNop(goc, ds, daCo)
  const soDung = daCoTat.filter((x) => dungDuoc(goc.phan, x)).length
  const cho = Math.max(0, SO_BAN_KHAC_TOI_DA - soDung)
  const them = giu.slice(0, cho)
  for (const g of giu.slice(cho)) bo.push({ i: g.i, lyDo: `câu đã đủ ${SO_BAN_KHAC_TOI_DA} bản dùng được` })
  bo.sort((a, b) => a.i - b.i)
  if (!them.length) return { giu: 0, bo, tong: soDung }
  const luc = new Date().toISOString()
  const moi = [...daCoTat, ...them.map(({ ban }) => ({ ...ban, nguon: 'may_soan_2_luot', qid_mau: meta.qidMau, ma_de: meta.maDe, lop: meta.lop, luc }))]
  await env.DB.prepare(
    `INSERT INTO cau_bo_tro (bam, qid_mau, song_sinh_json, cau_kiem_json, nhan_nen_json, buoc_json, cap_nhat_luc) VALUES (?,?,?,?,?,?,?)
     ON CONFLICT(bam) DO UPDATE SET song_sinh_json = excluded.song_sinh_json, cap_nhat_luc = excluded.cap_nhat_luc`,
  ).bind(goc.bam, meta.qidMau, JSON.stringify(moi), '[]', '[]', '[]', luc).run()
  return { giu: them.length, bo, tong: soDung + them.length }
}

/** Sau mỗi lần nộp: việc "chỉ học liệu" của câu (nếu có) ⇒ đủ thì 'xong'; còn thiếu ⇒ về hàng (ưu tiên theo mức thiếu mới) hoặc 'truot' sau 3 lần. */
async function capNhatViecHocLieu(env: Env, goc: CauGoc): Promise<string | null> {
  await damBaoBangMaySoan(env)
  const v = await env.DB.prepare('SELECT trang_thai, so_lan, so_em_sai, uu_tien FROM may_soan_viec WHERE bam = ?').bind(goc.bam).first<Obj>()
  if (!v || !['dang', 'cho'].includes(str(v.trang_thai))) return null
  const t = (await docTinhTrangBoTro(env, [{ bam: goc.bam, dang: goc.dang }])).get(goc.bam)
  const thieu = thieuBanKhac(goc.dang, t?.soBanDung ?? 0, t?.soY ?? 0)
  const tt = !thieu ? 'xong' : Number(v.so_lan ?? 0) >= SO_LAN_TOI_DA_BO_TRO ? 'truot' : 'cho'
  await env.DB.prepare('UPDATE may_soan_viec SET trang_thai = ?, thieu = ?, uu_tien = ?, ma_luot = NULL, loi = ?, cap_nhat_luc = ? WHERE bam = ?')
    .bind(tt, thieu, thieu ? uuTienEmSai(Number(v.so_em_sai ?? 0), thieu) : Number(v.uu_tien ?? 0),
      thieu ? `còn thiếu học liệu (${thieu === 'han' ? 'chưa có bản dùng được' : 'chưa đủ'}) sau lần ${Number(v.so_lan ?? 0)}` : null, new Date().toISOString(), goc.bam).run()
  return tt
}

/**
 * `/kho/may-soan/nop-bo-tro {qid, bam, songSinh?, yMoi?}` — máy soạn nộp học liệu của MỘT câu (gửi cả khi rỗng, để trả việc về hàng).
 * Máy chủ không tin máy soạn: câu gốc dựng từ KHO, băm lệch ⇒ từ chối; từng mục qua lại bộ kiểm + bằng chứng hai lượt khớp.
 */
export async function nopBoTro(env: Env, b: Obj): Promise<Obj> {
  const qid = str(b.qid), bam = str(b.bam)
  if (!qid || !bam) return { ok: false, error: 'Thiếu qid / bam' }
  const ht = await docCauKhoHienTai(env, qid).catch(() => null)
  if (!ht) return { ok: false, error: 'Không thấy câu trong kho' }
  if (ht.bam !== bam) return { ok: false, error: 'Đề đã đổi sau khi nhận việc (băm lệch) — bỏ học liệu này', loi: ['KHOÁ VÂN TAY'] }
  const goc = cauGocTuKho(ht.c, bam)
  if (!goc) return { ok: false, error: 'Câu không thuộc dạng soạn (tự luận?)' }
  const meta = metaCua(ht.c)
  const banKhac = goc.dang !== 'ds' && b.songSinh !== undefined ? await nhanVaGhiBanKhac(env, goc, meta, b.songSinh) : { giu: 0, bo: [] as MucBo[], tong: null }
  const yDs = goc.dang === 'ds' && b.yMoi !== undefined ? await nhanVaGhiYDs(env, goc, meta, b.yMoi) : { giu: 0, bo: [] as MucBo[], tong: null }
  const viec = await capNhatViecHocLieu(env, goc).catch(() => null)
  return { ok: true, bam, banKhac, yDs, viec }
}

// ---------------------------------------------------------------- tự xử cờ đáp án ⇒ diện nghi

/**
 * Hồ sơ còn cờ đáp án sau khi máy đã giải lại độc lập (cờ mang `tuXu`) ⇒ câu và MỌI bản cùng nội dung (cùng băm, tờ khác) vào `cau_nghi_dap_an`
 * trạng thái 'nghi' (so_lan / so_sai / ty_le_sai = 0: không phải số liệu em — bộ tự hoàn thiện hằng tuần tự ghi số liệu em nếu cũng nghi).
 * Dòng đã có (nghi từ số liệu em, hoặc đã chốt 'dung_dap_an' / 'da_sua') ⇒ GIỮ NGUYÊN. Không sửa đáp án kho, không đẩy việc cho thầy.
 */
export async function ghiNghiTuXu(env: Env, bam: string, qidMau: string, ghi: string): Promise<number> {
  await damBaoBangTuHoanThien(env)
  const r = await env.DB.prepare('SELECT qid FROM loi_giai_cau WHERE bam = ?').bind(bam).all<Obj>().catch(() => ({ results: [] as Obj[] }))
  const qids = [...new Set([qidMau, ...(r.results ?? []).map((x) => str(x.qid))].filter(Boolean))]
  const nay = new Date().toISOString()
  const ghiChu = `máy soạn tự xử ${nay.slice(0, 10)}: ${ghi}`.slice(0, 500)
  const lenh = qids.map((q) => env.DB.prepare(
    "INSERT INTO cau_nghi_dap_an (qid, so_lan, so_sai, ty_le_sai, trang_thai, ghi_chu, luc) VALUES (?, 0, 0, 0, 'nghi', ?, ?) ON CONFLICT(qid) DO NOTHING",
  ).bind(q, ghiChu, nay))
  let n = 0
  for (let i = 0; i < lenh.length; i += 100) n += (await env.DB.batch(lenh.slice(i, i + 100))).reduce((s, x) => s + (x.meta?.changes ?? 0), 0)
  return n
}

// ---------------------------------------------------------------- định tuyến (sau cổng mã bí mật của thầy trong index.ts)

export async function duongMaySoan(env: Env, p: string, b: Obj): Promise<Obj> {
  if (p === '/kho/may-soan/nop-bo-tro') return nopBoTro(env, b)
  if (p === '/kho/may-soan/nop-y-ds') return nopYDs(env, b)
  if (p === '/kho/may-soan/hang-em-sai') return hangEmSai(env, b)
  return { ok: false, error: 'Không có lệnh máy soạn này' }
}
