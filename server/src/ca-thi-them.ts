// CA KIỂM TRA — PHẦN THÊM cho bản vẽ docs/ban-ve-ca-thi-2809 (28/09/2026). CHỈ THÊM, không đổi luật chấm / luật vào thi.
//   · `POST /gv/cong-bo-ca {maCa}`      — ca ĐÃ ĐÓNG mà chưa công bố ⇒ đổi `ca.cong_bo` sang 'ngay' (em + phụ huynh thấy điểm ngay). Ghi một dòng `nhat_ky_may` (nguồn `cong_bo_ca`, mức 'tin').
//                                         Ca đang mở ⇒ TỪ CHỐI (`lyDo:'ca_dang_mo'`) để không lộ đáp án cho em đang làm. Ca đã công bố ⇒ ok, `daCongBoTruoc: true` (không ghi).
//   · `POST /gv/nhan-xet-ca-em {maCa, sbd, noiDung}` — lưu nhận xét của thầy cho MỘT em trong MỘT ca (bảng `nhan_xet_ca_em`, migration-2809-nhan-xet-ca-em.sql). Rỗng ⇒ xoá nhận xét.
//   · `docNhanXet` — đọc nhận xét để `/gv/bao-cao-ca-em` trả `nhanXet`.
//   · `maTranCa`   — bảng em × câu cho `/gv/bao-cao-ca` (`maTran`): mỗi ô một chữ D đúng · P đúng một phần (Phần II) · S sai · B bỏ trống · N chưa chấm.
//   · `docTbCaTruoc` — TB lớp của ca ĐÃ CÔNG BỐ liền trước cùng lớp (`tongQuan.tbCaTruoc`).
// Cổng mã bí mật của thầy do `index.ts` chặn (sau `laThay`).
import type { Env } from './kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { SBD_THU } from './gv-bang-tin'
import { laBoTrong } from './su-kien-hoc'

type Hang = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
export const TOI_DA_NHAN_XET = 2000

// ---------------------------------------------------------------- công bố điểm ----------------------------------------------------------------
export async function gvCongBoCa(env: Env, b: Hang, nowMs: number = Date.now()): Promise<Hang> {
  const maCa = chuoi(b.maCa)
  if (!maCa) return { ok: false, lyDo: 'thieu', error: 'Thiếu mã ca.' }
  const ca = await env.DB.prepare('SELECT ma_ca, ten_ca, trang_thai, cong_bo FROM ca WHERE ma_ca = ?').bind(maCa).first<Hang>()
  if (!ca || chuoi(ca.trang_thai) === 'da_xoa') return { ok: false, lyDo: 'khong_co_ca', error: 'Không tìm thấy ca này.' }
  if (chuoi(ca.trang_thai) !== 'dong') return { ok: false, lyDo: 'ca_dang_mo', error: 'Ca còn mở. Kết thúc ca rồi mới công bố điểm.' }
  if (chuoi(ca.cong_bo) === 'ngay' || chuoi(ca.cong_bo) === 'ca_lop_xong') return { ok: true, maCa, congBo: chuoi(ca.cong_bo), daCongBoTruoc: true }
  const nay = new Date(nowMs).toISOString()
  const r = await env.DB.prepare("UPDATE ca SET cong_bo = 'ngay', cap_nhat_luc = ? WHERE ma_ca = ? AND trang_thai = 'dong' AND COALESCE(cong_bo, 'khong') NOT IN ('ngay', 'ca_lop_xong')")
    .bind(nay, maCa)
    .run()
  try {
    await env.DB.prepare("INSERT INTO nhat_ky_may (luc, nguon, muc, chu) VALUES (?, 'cong_bo_ca', 'tin', ?)").bind(nay, `Thầy công bố điểm ca ${chuoi(ca.ten_ca) || maCa} (${maCa})`).run()
  } catch {
    /* nhật ký không được kéo việc chính đổ theo */
  }
  return { ok: true, maCa, congBo: 'ngay', daCongBoTruoc: false, doi: Number(r.meta?.changes ?? 0) }
}

// ---------------------------------------------------------------- nhận xét của thầy ----------------------------------------------------------------
export async function gvNhanXetCaEm(env: Env, b: Hang, nowMs: number = Date.now()): Promise<Hang> {
  const maCa = chuoi(b.maCa)
  const sbd = chuoi(b.sbd)
  if (!maCa || !sbd) return { ok: false, lyDo: 'thieu', error: 'Thiếu mã ca hoặc số báo danh.' }
  const noiDung = typeof b.noiDung === 'string' ? b.noiDung.trim() : ''
  if (noiDung.length > TOI_DA_NHAN_XET) return { ok: false, lyDo: 'qua_dai', error: `Nhận xét dài quá ${TOI_DA_NHAN_XET} ký tự.` }
  const ca = await env.DB.prepare('SELECT trang_thai FROM ca WHERE ma_ca = ?').bind(maCa).first<Hang>()
  if (!ca || chuoi(ca.trang_thai) === 'da_xoa') return { ok: false, lyDo: 'khong_co_ca', error: 'Không tìm thấy ca này.' }
  const nay = new Date(nowMs).toISOString()
  if (!noiDung) {
    await env.DB.prepare('DELETE FROM nhan_xet_ca_em WHERE ma_ca = ? AND sbd = ?').bind(maCa, sbd).run()
    return { ok: true, maCa, sbd, noiDung: '', capNhatLuc: nay }
  }
  await env.DB.prepare(
    'INSERT INTO nhan_xet_ca_em (ma_ca, sbd, noi_dung, cap_nhat_luc) VALUES (?, ?, ?, ?) ON CONFLICT(ma_ca, sbd) DO UPDATE SET noi_dung = excluded.noi_dung, cap_nhat_luc = excluded.cap_nhat_luc',
  )
    .bind(maCa, sbd, noiDung, nay)
    .run()
  return { ok: true, maCa, sbd, noiDung, capNhatLuc: nay }
}

/** Nhận xét đã lưu (vắng ⇒ null). Bảng chưa có (chưa chạy migration) ⇒ null, không ném. */
export async function docNhanXet(env: Env, maCa: string, sbd: string): Promise<{ noiDung: string; capNhatLuc: string } | null> {
  try {
    const x = await env.DB.prepare('SELECT noi_dung, cap_nhat_luc FROM nhan_xet_ca_em WHERE ma_ca = ? AND sbd = ?').bind(maCa, sbd).first<Hang>()
    const nd = chuoi(x?.noi_dung)
    return nd ? { noiDung: nd, capNhatLuc: chuoi(x?.cap_nhat_luc) } : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------- ma trận em × câu ----------------------------------------------------------------
export interface DongMaTran {
  phan: string
  soCau: number
  chon: string
  dapAnDung: string
  dungSai: 0 | 1 | null
}
const THU_TU_PHAN = ['I', 'II', 'III']

/** Một ô: D đúng · P đúng một phần (Phần II, có ít nhất một ý trùng) · S sai · B bỏ trống · N chưa chấm. */
export function oMaTran(d: DongMaTran): 'D' | 'P' | 'S' | 'B' | 'N' {
  if (laBoTrong(d.chon)) return d.dungSai === 1 ? 'D' : 'B'
  if (d.dungSai === 1) return 'D'
  if (d.dungSai === null) return 'N'
  if (d.phan === 'II') {
    const a = d.chon.toUpperCase()
    const b = d.dapAnDung.toUpperCase()
    let trung = 0
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] === b[i] && a[i] !== '-' && a[i] !== ' ') trung++
    if (trung > 0) return 'P'
  }
  return 'S'
}

/** `maTran: {cot:[{phan, soCau}], em:[{sbd, kq}]}` — hàng theo thứ tự `thuTuSbd` (điểm cao trước), cột theo phần rồi số câu. */
export function maTranCa(dongTheoEm: ReadonlyMap<string, readonly DongMaTran[]>, thuTuSbd: readonly string[]): Hang | null {
  const khoa = (d: DongMaTran) => `${d.phan}|${d.soCau}`
  const cot = new Map<string, { phan: string; soCau: number }>()
  for (const ds of dongTheoEm.values()) for (const d of ds) cot.set(khoa(d), { phan: d.phan, soCau: d.soCau })
  if (cot.size === 0) return null
  const cacCot = [...cot.values()].sort((a, b) => THU_TU_PHAN.indexOf(a.phan) - THU_TU_PHAN.indexOf(b.phan) || a.soCau - b.soCau)
  const em = thuTuSbd.flatMap((sbd) => {
    const ds = dongTheoEm.get(sbd)
    if (!ds) return []
    const theo = new Map(ds.map((d) => [khoa(d), d]))
    return [{ sbd, kq: cacCot.map((c) => { const d = theo.get(`${c.phan}|${c.soCau}`); return d ? oMaTran(d) : '-' }).join('') }]
  })
  return { cot: cacCot, em }
}

// ---------------------------------------------------------------- TB lớp ca trước ----------------------------------------------------------------
/** TB lớp (lượt đã nộp mới nhất mỗi em, bỏ tài khoản thử) của ca ĐÃ CÔNG BỐ mở liền trước ca này, CÙNG lớp, cùng loại. Không có ⇒ null. */
export async function docTbCaTruoc(env: Env, maCa: string): Promise<{ maCa: string; tenCa: string; tb: number; ngay: string } | null> {
  const ca = await env.DB.prepare('SELECT lop, loai, COALESCE(mo_luc, bat_dau, cap_nhat_luc) AS luc FROM ca WHERE ma_ca = ?').bind(maCa).first<Hang>()
  const lop = chuoi(ca?.lop)
  if (!ca || !lop) return null
  const x = await env.DB.prepare(
    `SELECT * FROM (
       SELECT c.ma_ca, c.ten_ca, COALESCE(c.mo_luc, c.bat_dau, c.cap_nhat_luc) AS luc,
              (SELECT AVG(l.tong) FROM luot l
                WHERE l.ma_ca = c.ma_ca AND l.tong IS NOT NULL AND COALESCE(l.nop_luc, '') <> '' AND l.trang_thai IN ('da_nop', 'khoa') AND l.sbd <> ?
                  AND l.lan_thu = (SELECT MAX(l2.lan_thu) FROM luot l2 WHERE l2.ma_ca = l.ma_ca AND l2.sbd = l.sbd AND COALESCE(l2.nop_luc, '') <> '' AND l2.trang_thai IN ('da_nop', 'khoa'))) AS tb
         FROM ca c
        WHERE c.lop = ? AND c.ma_ca <> ? AND c.trang_thai <> 'da_xoa' AND COALESCE(c.loai, '') = ?
          AND COALESCE(c.mo_luc, c.bat_dau, c.cap_nhat_luc, '') < ? AND ${SQL_DA_CONG_BO('c')}
     ) WHERE tb IS NOT NULL ORDER BY luc DESC LIMIT 1`,
  )
    .bind(SBD_THU, lop, maCa, chuoi(ca.loai), chuoi(ca.luc))
    .first<Hang>()
  if (!x) return null
  const tb = Number(x.tb)
  if (!Number.isFinite(tb)) return null
  return { maCa: chuoi(x.ma_ca), tenCa: chuoi(x.ten_ca), tb: Math.round(tb * 100) / 100, ngay: chuoi(x.luc).slice(0, 10) }
}
